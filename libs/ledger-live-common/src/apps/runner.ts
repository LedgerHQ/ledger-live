import { Observable, from, of, defer, concat } from "rxjs";
import {
  map,
  materialize,
  reduce,
  ignoreElements,
  throttleTime,
  scan,
  mergeMap,
  distinctUntilChanged,
} from "rxjs/operators";
import type { Exec, State, AppOp, RunnerEvent, Action } from "./types";
import { reducer, getActionPlan, getNextAppOp } from "./logic";
import { delay } from "../promise";
import { getEnv } from "@ledgerhq/live-env";

export const runAppOp = (
  { appByName, deviceInfo }: State,
  appOp: AppOp,
  exec: Exec,
): Observable<RunnerEvent> => {
  const app = appByName[appOp.name];

  if (!app) {
    const events: RunnerEvent[] = [
      {
        type: "runStart",
        appOp,
      },
      {
        type: "runSuccess",
        appOp,
      },
    ];
    // app not in list, we skip it.
    return from(events);
  }

  return concat(
    of(<RunnerEvent>{
      type: "runStart",
      appOp,
    }), // we need to allow a 1s delay for the action to be achieved without glitch (bug in old firmware when you do things too closely)
    defer(() => delay(getEnv("MANAGER_INSTALL_DELAY"))).pipe(ignoreElements()),
    defer(() => exec(appOp, deviceInfo.targetId, app)).pipe(
      throttleTime(100),
      materialize(),
      map(n => {
        switch (n.kind) {
          case "N":
            return <RunnerEvent>{
              type: "runProgress",
              appOp,
              progress: n?.value?.progress ?? 0,
            };

          case "E":
            return <RunnerEvent>{
              type: "runError",
              appOp,
              error: n.error,
            };

          case "C":
            return <RunnerEvent>{
              type: "runSuccess",
              appOp,
            };
        }
      }),
    ),
  );
};

type InlineInstallProgress = {
  globalProgress: number;
  itemProgress: number;
  currentAppOp: AppOp | null | undefined;
  installQueue: string[];
};

export const runAllWithProgress = (
  state: State,
  exec: Exec,
  precision = 100,
): Observable<InlineInstallProgress> => {
  const total = state.uninstallQueue.length + state.installQueue.length;

  function globalProgress(s, localProgress) {
    let p = 1 - (s.uninstallQueue.length + s.installQueue.length - localProgress) / total;
    p = Math.round(p * precision) / precision;
    return p;
  }

  return concat(...getActionPlan(state).map(appOp => runAppOp(state, appOp, exec))).pipe(
    map(event => {
      if (event.type === "runError") {
        throw event.error;
      }
      return <Action>{
        type: "onRunnerEvent",
        event,
      };
    }),
    scan(reducer, state),
    mergeMap(s => {
      // Nb if you also want to expose the uninstall queue, feel free.
      const { currentProgressSubject, currentAppOp, installQueue } = s;

      if (!currentProgressSubject)
        return of({
          globalProgress: globalProgress(s, 0),
          itemProgress: 0,
          installQueue,
          currentAppOp,
        });

      // Expose more information about what's happening during the install
      return currentProgressSubject.pipe(
        map(v => ({
          globalProgress: globalProgress(s, v),
          itemProgress: v,
          installQueue,
          currentAppOp,
        })),
      );
    }),
    distinctUntilChanged(),
  );
};
// use for CLI, no change of the state over time
export const runAll = (state: State, exec: Exec): Observable<State> =>
  concat(...getActionPlan(state).map(appOp => runAppOp(state, appOp, exec))).pipe(
    map(
      event =>
        <Action>{
          type: "onRunnerEvent",
          event,
        },
    ),
    reduce(reducer, state),
  );
export const runOneAppOp = (state: State, appOp: AppOp, exec: Exec): Observable<State> =>
  runAppOp(state, appOp, exec).pipe(
    map(
      event =>
        <Action>{
          type: "onRunnerEvent",
          event,
        },
    ),
    reduce(reducer, state),
  );
export const runOne = (state: State, exec: Exec): Observable<State> => {
  const next = getNextAppOp(state);
  if (!next) return of(state);
  return runOneAppOp(state, next, exec);
};

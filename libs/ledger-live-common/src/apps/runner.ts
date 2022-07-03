import { Observable, from, of, defer, concat, Subject } from "rxjs";
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
import { getEnv } from "../env";

export const runAppOp = (
  { appByName, deviceInfo }: State,
  appOp: AppOp,
  exec: Exec
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
      map((n) => {
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

          default:
            throw new Error("invalid notification of kind=" + n.kind);
        }
      })
    )
  );
};

export const getGlobalProgress = (
  observable: Observable<RunnerEvent> | Subject<RunnerEvent>,
  state: State,
  precision = 100
): Observable<number> => {
  // As we reduce the state, the total decreases and we near 1
  const globalProgress = (s: State, localProgress = 0) => {
    const installs = s.installQueue.length;
    const uninstalls = s.uninstallQueue.length;
    const total = installs + uninstalls;

    const p = 1 - (uninstalls + installs - localProgress) / total;
    return Math.round(p * precision) / precision;
  };

  return observable.pipe(
    map(
      (event) =>
        <Action>{
          type: "onRunnerEvent",
          event,
        }
    ),
    scan(reducer, state),
    mergeMap((s) => {
      const { currentProgressSubject } = s;
      if (!currentProgressSubject) return of(globalProgress(s));
      return currentProgressSubject.pipe(map((v) => globalProgress(s, v)));
    }),
    distinctUntilChanged()
  );
};

export const runAllWithProgress = (
  state: State,
  exec: Exec,
  precision = 100
): Observable<number> => {
  return getGlobalProgress(
    concat(
      ...getActionPlan(state).map((appOp) => runAppOp(state, appOp, exec))
    ),
    state,
    precision
  );
};
// use for CLI, no change of the state over time
export const runAll = (state: State, exec: Exec): Observable<State> =>
  concat(
    ...getActionPlan(state).map((appOp) => runAppOp(state, appOp, exec))
  ).pipe(
    map(
      (event) =>
        <Action>{
          type: "onRunnerEvent",
          event,
        }
    ),
    reduce(reducer, state)
  );
export const runOneAppOp = (
  state: State,
  appOp: AppOp,
  exec: Exec
): Observable<State> =>
  runAppOp(state, appOp, exec).pipe(
    map(
      (event) =>
        <Action>{
          type: "onRunnerEvent",
          event,
        }
    ),
    reduce(reducer, state)
  );
export const runOne = (state: State, exec: Exec): Observable<State> => {
  const next = getNextAppOp(state);
  if (!next) return of(state);
  return runOneAppOp(state, next, exec);
};

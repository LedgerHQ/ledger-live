// @flow

import { useReducer, useEffect } from "react";
import { Observable, from, of, defer, concat } from "rxjs";
import { map, materialize, reduce, ignoreElements } from "rxjs/operators";
import type { Exec, State, AppOp, RunnerEvent, ListAppsResult } from "./types";
import { reducer, initState } from "./logic";
import { delay } from "../promise";

export const getNextAppOp = (state: State): ?AppOp => {
  if (state.uninstallQueue.length) {
    return { type: "uninstall", name: state.uninstallQueue[0] };
  } else if (state.installQueue.length) {
    return { type: "install", name: state.installQueue[0] };
  }
};

export const getActionPlan = (state: State): AppOp[] =>
  state.uninstallQueue
    .map(name => ({ type: "uninstall", name }))
    .concat(state.installQueue.map(name => ({ type: "install", name })));

export const runAppOp = (
  state: State,
  appOp: AppOp,
  exec: Exec
): Observable<RunnerEvent> => {
  const app = state.appByName[appOp.name];
  if (!app) {
    // app not in list, we skip it.
    return from([{ type: "runStart", appOp }, { type: "runSuccess", appOp }]);
  }
  return concat(
    of({ type: "runStart", appOp }),
    // we need to allow a 1s delay for the action to be achieved without glitch (bug in old firmware when you do things too closely)
    defer(() => delay(1000)).pipe(ignoreElements()),
    defer(() => exec(appOp, state.deviceInfo.targetId, app)).pipe(
      materialize(),
      map(n => {
        switch (n.kind) {
          case "N":
            return { type: "runProgress", appOp, progress: n.value.progress };
          case "E":
            return { type: "runError", appOp, error: n.error };
          case "C":
            return { type: "runSuccess", appOp };
          default:
            throw new Error("invalid notification of kind=" + n.kind);
        }
      })
    )
  );
};

// use for CLI, no change of the state over time
export const runAll = (state: State, exec: Exec): Observable<State> =>
  concat(
    ...getActionPlan(state).map(appOp => runAppOp(state, appOp, exec))
  ).pipe(
    map(event => ({ type: "onRunnerEvent", event })),
    reduce(reducer, state)
  );

// use for React apps. support dynamic change of the state.
export const useAppsRunner = (listResult: ListAppsResult, exec: Exec) => {
  // $FlowFixMe no clue why flow complains
  const [state, dispatch] = useReducer(reducer, () => initState(listResult));
  const appOp = state.currentAppOp || getNextAppOp(state);

  useEffect(() => {
    if (appOp) {
      const sub = runAppOp(state, appOp, exec).subscribe(event => {
        dispatch({ type: "onRunnerEvent", event });
      });
      return () => {
        sub.unsubscribe();
      };
    }
  }, [appOp, exec]);

  return [state, dispatch];
};

// @flow

import { useReducer, useEffect, useMemo } from "react";
import { Observable, from, of, defer, concat } from "rxjs";
import {
  map,
  materialize,
  reduce,
  ignoreElements,
  throttleTime
} from "rxjs/operators";
import type {
  Exec,
  State,
  Action,
  AppOp,
  RunnerEvent,
  ListAppsResult
} from "./types";
import { reducer, initState, getActionPlan, getNextAppOp } from "./logic";
import { delay } from "../promise";
import { getEnv } from "../env";

export const runAppOp = (
  { appByName, deviceInfo }: State,
  appOp: AppOp,
  exec: Exec
): Observable<RunnerEvent> => {
  const app = appByName[appOp.name];
  if (!app) {
    // app not in list, we skip it.
    return from([
      { type: "runStart", appOp },
      { type: "runSuccess", appOp }
    ]);
  }
  return concat(
    of({ type: "runStart", appOp }),
    // we need to allow a 1s delay for the action to be achieved without glitch (bug in old firmware when you do things too closely)
    defer(() => delay(getEnv("MANAGER_INSTALL_DELAY"))).pipe(ignoreElements()),
    defer(() => exec(appOp, deviceInfo.targetId, app)).pipe(
      throttleTime(100),
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

type UseAppsRunnerResult = [State, (Action) => void];

// use for React apps. support dynamic change of the state.
export const useAppsRunner = (
  listResult: ListAppsResult,
  exec: Exec
): UseAppsRunnerResult => {
  // $FlowFixMe for ledger-live-mobile older react/flow version
  const [state, dispatch] = useReducer(reducer, null, () =>
    initState(listResult)
  );

  const nextAppOp = useMemo(() => getNextAppOp(state), [state]);
  const appOp = state.currentAppOp || nextAppOp;
  useEffect(() => {
    if (appOp) {
      const sub = runAppOp(state, appOp, exec).subscribe(event => {
        dispatch({ type: "onRunnerEvent", event });
      });
      return () => {
        sub.unsubscribe();
      };
    }
    // we only want to redo the effect on appOp changes here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listResult, appOp, exec]);

  return [state, dispatch];
};

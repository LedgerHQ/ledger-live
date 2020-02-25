// @flow

import { useReducer, useEffect, useMemo } from "react";
import type { Exec, State, Action, ListAppsResult } from "./types";
import type { App } from "../types/manager";
import type { AppType, SortOptions } from "./filtering";
import { useSortedFilteredApps } from "./filtering";
import {
  reducer,
  initState,
  getNextAppOp,
  isOutOfMemoryState,
  predictOptimisticState
} from "./logic";
import { runAppOp } from "./runner";

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

// FIXME code of these hooks will later be improved (some performance can be better)

export function useNotEnoughMemoryToInstall(state: State, name: string) {
  return useMemo(
    () =>
      isOutOfMemoryState(
        predictOptimisticState(reducer(state, { type: "install", name }))
      ),
    [name, state]
  );
}

type AppsSections = {
  catalog: App[],
  device: App[],
  update: App[]
};

type AppsSectionsOpts = {
  query: string,
  appFilter: AppType,
  sort: SortOptions
};

export function useAppsSections(
  state: State,
  opts: AppsSectionsOpts
): AppsSections {
  const { updateAllQueue, appByName, installed, installQueue, apps } = state;

  const appsUpdating = useMemo(
    () => updateAllQueue.map(name => appByName[name]).filter(Boolean),
    [appByName, updateAllQueue]
  );

  const updatableAppList = useMemo(
    () =>
      apps.filter(({ name }) =>
        installed.some(i => i.name === name && !i.updated)
      ),
    [apps, installed]
  );

  const update = appsUpdating.length > 0 ? appsUpdating : updatableAppList;

  const filterParam = useMemo(
    () => ({
      query: opts.query,
      installedApps: installed,
      type: [opts.appFilter]
    }),
    [installed, opts.appFilter, opts.query]
  );

  const catalog = useSortedFilteredApps(apps, filterParam, opts.sort);

  const installedAppList = useSortedFilteredApps(
    apps,
    {
      query: opts.query,
      installedApps: installed,
      installQueue,
      type: ["installed"]
    },
    { type: "default", order: "asc" }
  );

  const device = installedAppList
    .sort(({ name: _name }, { name }) =>
      installed.indexOf(_name) > installed.indexOf(name) ? -1 : 0
    )
    .sort(
      ({ name: _name }, { name }) =>
        installQueue.indexOf(_name) > installQueue.indexOf(name) ? -1 : 0 // place install queue on top of list
    );

  return { update, catalog, device };
}

// at the moment it will uses State but in future, we'll refine!
export function useAppInstallProgress(state: State, name: string) {
  // $FlowFixMe
  const { currentProgress } = state;
  if (currentProgress && currentProgress.appOp.name === name) {
    return currentProgress.progress;
  }
  return 1;
}

// if the app needs deps to be installed, we want to display a modal
// this should returns all params the modal also need (so we don't do things twice)
export function useAppInstallNeedsDeps(
  state: State,
  app: App
): ?{ app: App, dependencies: App[] } {
  const { appByName, installed: installedList, installQueue } = state;

  const res = useMemo(() => {
    const dependencies = (app.dependencies || [])
      .map(name => appByName[name])
      .filter(
        dep =>
          dep &&
          !installedList.some(app => app.name === dep.name) &&
          !installQueue.includes(dep.name)
      );
    if (dependencies.length) {
      return { app, dependencies };
    }
    return null;
  }, [appByName, app, installQueue, installedList]);

  return res;
}

// if the app needs deps to be installed, we want to display a modal
// this should returns all params the modal also need (so we don't do things twice)
export function useAppUninstallNeedsDeps(
  state: State,
  app: App
): ?{ dependents: App[], app: App } {
  const { apps, installed } = state;

  const res = useMemo(() => {
    const dependents = apps.filter(
      a =>
        installed.some(i => i.name === a.name) &&
        a.dependencies.includes(app.name)
    );

    if (dependents.length) {
      return { dependents, app };
    }
    return null;
  }, [app, apps, installed]);

  return res;
}

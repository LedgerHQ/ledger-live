import { useState, useReducer, useEffect, useMemo, useCallback } from "react";
import type { Exec, State, Action, ListAppsResult } from "./types";
import type { AppType, SortOptions } from "./filtering";
import { useSortedFilteredApps } from "./filtering";
import {
  reducer,
  initState,
  getNextAppOp,
  isOutOfMemoryState,
  predictOptimisticState,
} from "./logic";
import { runAppOp } from "./runner";
import { App } from "@ledgerhq/types-live";
import useBackgroundInstallSubject from "./reactBIM";

type UseAppsRunnerResult = [State, (arg0: Action) => void];
// use for React apps. support dynamic change of the state.
export const useAppsRunner = (
  listResult: ListAppsResult,
  exec: Exec,
  appsToRestore?: string[],
  deviceId?: string
): UseAppsRunnerResult => {
  const [state, dispatch] = useReducer(reducer, null, () =>
    initState(listResult, appsToRestore)
  );
  const nextAppOp = useMemo(() => getNextAppOp(state), [state]);
  const appOp = state.currentAppOp || nextAppOp;
  const onDispatchEvent = useCallback((event) => {
    dispatch({
      type: "onRunnerEvent",
      event,
    });
  }, []);

  const bimActive = useBackgroundInstallSubject(
    deviceId,
    state,
    onDispatchEvent
  );

  useEffect(() => {
    if (appOp && !bimActive) {
      const sub = runAppOp(state, appOp, exec).subscribe(onDispatchEvent);
      return () => {
        sub.unsubscribe();
      };
    } // we only want to redo the effect on appOp changes here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listResult, appOp, exec]);

  return [state, dispatch];
};

export function useNotEnoughMemoryToInstall(
  state: State,
  name: string
): boolean {
  return useMemo(
    () =>
      isOutOfMemoryState(
        predictOptimisticState(
          reducer(state, {
            type: "install",
            name,
          })
        )
      ),
    [name, state]
  );
}

type AppsSections = {
  catalog: App[];
  device: App[];
  update: App[];
};

type AppsSectionsOpts = {
  query: string;
  appFilter: AppType;
  sort: SortOptions;
};

export function useAppsSections(
  state: State,
  opts: AppsSectionsOpts
): AppsSections {
  const { updateAllQueue, appByName, installed, installQueue, apps } = state;
  const appsUpdating = useMemo(
    () => updateAllQueue.map((name) => appByName[name]).filter(Boolean),
    [appByName, updateAllQueue]
  );
  const updatableAppList = useMemo(
    () =>
      apps.filter(({ name }) =>
        installed.some((i) => i.name === name && !i.updated)
      ),
    [apps, installed]
  );
  const update = appsUpdating.length > 0 ? appsUpdating : updatableAppList;
  const filterParam = useMemo(
    () => ({
      query: opts.query,
      installedApps: installed,
      type: [opts.appFilter],
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
      type: ["installed"],
    },
    {
      type: "default",
      order: "asc",
    }
  );

  const device = installedAppList.sort(({ name: _name }, { name }) => {
    // place install queue on top of list
    // with the app being installed at the top
    let pos1 = installQueue.indexOf(_name);
    let pos2 = installQueue.indexOf(name);
    pos1 = pos1 < 0 ? Number.MAX_VALUE : pos1;
    pos2 = pos2 < 0 ? Number.MAX_VALUE : pos2;
    return pos1 - pos2;
  });

  return {
    update,
    catalog,
    device,
  };
}

export function useAppInstallProgress(state: State, name: string): number {
  const { currentProgressSubject, currentAppOp } = state;
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (
      !currentAppOp ||
      !currentProgressSubject ||
      currentAppOp.name !== name
    ) {
      setProgress(0);
      return;
    }

    const sub = currentProgressSubject.subscribe(setProgress);
    return () => sub.unsubscribe();
  }, [currentProgressSubject, currentAppOp, name]);

  if (currentProgressSubject && currentAppOp && currentAppOp.name === name) {
    return progress;
  }

  return 0;
}

// if the app needs deps to be installed, we want to display a modal
// this should returns all params the modal also need (so we don't do things twice)
export function useAppInstallNeedsDeps(
  state: State,
  app: App
):
  | {
      app: App;
      dependencies: App[];
    }
  | null
  | undefined {
  const { appByName, installed: installedList, installQueue } = state;
  const res = useMemo(() => {
    const dependencies = (app.dependencies || [])
      .map((name) => appByName[name])
      .filter(
        (dep) =>
          dep &&
          !installedList.some((app) => app.name === dep.name) &&
          !installQueue.includes(dep.name)
      );

    if (dependencies.length) {
      return {
        app,
        dependencies,
      };
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
):
  | {
      dependents: App[];
      app: App;
    }
  | null
  | undefined {
  const { apps, installed } = state;
  const res = useMemo(() => {
    const dependents = apps.filter(
      (a) =>
        installed.some((i) => i.name === a.name) &&
        a.dependencies.includes(app.name)
    );

    if (dependents.length) {
      return {
        dependents,
        app,
      };
    }

    return null;
  }, [app, apps, installed]);
  return res;
}

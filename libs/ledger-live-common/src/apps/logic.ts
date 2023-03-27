import { $Shape } from "utility-types";
import { Subject } from "rxjs";
import flatMap from "lodash/flatMap";
import semver from "semver";
import { getDeviceModel } from "@ledgerhq/devices";
import {
  AppOp,
  State,
  Action,
  ListAppsResult,
  AppsDistribution,
  SkipReason,
} from "./types";
import {
  findCryptoCurrency,
  findCryptoCurrencyById,
  isCurrencySupported,
} from "../currencies";
import { LatestFirmwareVersionRequired, NoSuchAppOnProvider } from "../errors";
import { App } from "@ledgerhq/types-live";

export const initState = (
  {
    deviceModelId,
    appsListNames,
    installed,
    appByName,
    ...listAppsResult
  }: ListAppsResult,
  appsToRestore?: string[]
): State => {
  let state: State = {
    ...listAppsResult,
    installed,
    appByName,
    apps: appsListNames.map((name) => appByName[name]).filter(Boolean),
    deviceModel: getDeviceModel(deviceModelId),
    recentlyInstalledApps: [],
    installQueue: [],
    uninstallQueue: [],
    updateAllQueue: [],
    currentProgressSubject: new Subject(),
    currentError: null,
    currentAppOp: null,
    skippedAppOps: [],
  };

  if (appsToRestore) {
    state = appsToRestore
      .filter(
        (name) => appByName[name] && !installed.some((a) => a.name === name)
      )
      .map(
        (name) =>
          <Action>{
            type: "install",
            name,
          }
      )
      .reduce(reducer, state);
  }

  return state;
};

// ^TODO move this to legacyDependencies.js
// we should have dependency as part of the data!
const reorderInstallQueue = (
  appByName: Record<string, App>,
  apps: string[]
): string[] => {
  const list: string[] = [];
  apps.forEach((app) => {
    if (list.includes(app)) return;

    if (app in appByName) {
      const deps = appByName[app].dependencies;
      deps.forEach((dep) => {
        if (apps.includes(dep) && !list.includes(dep)) {
          list.push(dep);
        }
      });
    }

    list.push(app);
  });
  return list;
};

const reorderUninstallQueue = (
  appByName: Record<string, App>,
  apps: string[]
): string[] =>
  reorderInstallQueue(appByName, apps.slice(0).reverse()).reverse();

const findDependents = (
  appByName: Record<string, App>,
  name: string
): string[] => {
  const all: string[] = [];

  for (const k in appByName) {
    const app = appByName[k];

    if (app.dependencies.includes(name)) {
      all.push(app.name);
    }
  }

  return all;
};

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "onRunnerEvent": {
      // an app operation was correctly prefered. update state accordingly
      const { event } = action;
      const { appOp } = event;

      if (event.type === "runStart") {
        return {
          ...state,
          currentAppOp: appOp,
          currentProgressSubject: new Subject(),
        };
      } else if (event.type === "runSuccess") {
        if (state.currentProgressSubject) {
          state.currentProgressSubject.complete();
        }

        let nextState;

        if (appOp.type === "install") {
          const app = state.apps.find((a) => a.name === appOp.name);
          nextState = {
            ...state,
            currentAppOp: null,
            currentProgressSubject: null,
            currentError: null,
            recentlyInstalledApps: state.recentlyInstalledApps.concat(
              appOp.name
            ),
            // append the app to known installed apps
            installed: state.installed
              .filter((o) => o.name !== appOp.name)
              .concat({
                name: appOp.name,
                updated: true,
                hash: app ? app.hash : "",
                blocks:
                  app && app.bytes
                    ? Math.ceil(app.bytes / getBlockSize(state))
                    : 0,
                version: app ? app.version : "",
                availableVersion: app ? app.version : "",
              }),
            // remove the install action
            installQueue: state.installQueue.filter(
              (name) => appOp.name !== name
            ),
          };
        } else {
          nextState = {
            ...state,
            currentAppOp: null,
            currentProgressSubject: null,
            currentError: null,
            // remove apps to known installed apps
            installed: state.installed.filter((i) => appOp.name !== i.name),
            // remove the uninstall action
            uninstallQueue: state.uninstallQueue.filter(
              (name) => appOp.name !== name
            ),
          };
        }

        if (
          nextState.installQueue.length + nextState.uninstallQueue.length ===
          0
        ) {
          nextState.updateAllQueue = [];
        }

        return nextState;
      } else if (event.type === "runError") {
        // TO BE CONTINUED LL-2138
        // to handle recovering from error. however we are not correctly using it at the moment.

        /*
          const error = event.error;
          if (error instanceof ManagerDeviceLockedError) {
            return {
              ...state,
              currentError: {
                appOp: appOp,
                error: event.error
              }
            };
          }
          */
        if (state.currentProgressSubject) {
          state.currentProgressSubject.complete();
        }

        // any other error stops everything
        return {
          ...state,
          uninstallQueue: [],
          installQueue: [],
          updateAllQueue: [],
          currentAppOp: null,
          currentProgressSubject: null,
          currentError: {
            appOp: appOp,
            error: event.error,
          },
        };
      } else if (event.type === "runProgress") {
        // we just emit on the subject
        if (state.currentProgressSubject) {
          state.currentProgressSubject.next(event.progress);
        }

        return state; // identity state will not re-render the UI
      }

      return state;
    }

    case "recover":
      return { ...state, currentError: null };

    case "wipe":
      return {
        ...state,
        currentError: null,
        installQueue: [],
        uninstallQueue: reorderUninstallQueue(
          state.appByName,
          state.installed.map(({ name }) => name)
        ),
      };

    case "updateAll": {
      let installList = state.installQueue.slice(0);
      let uninstallList = state.uninstallQueue.slice(0);
      state.installed
        .filter(({ updated, name }) => !updated && state.appByName[name])
        .forEach((app) => {
          const dependents = state.installed
            .filter((a) => {
              const depApp = state.appByName[a.name];
              return depApp && depApp.dependencies.includes(app.name);
            })
            .map((a) => a.name);
          uninstallList = uninstallList.concat([app.name, ...dependents]);
          installList = installList.concat([app.name, ...dependents]);
        });
      const installQueue = reorderInstallQueue(state.appByName, installList);
      const uninstallQueue = reorderUninstallQueue(
        state.appByName,
        uninstallList
      );

      /** since install queue === uninstall queue in this case we can map the update queue to either one */
      const updateAllQueue = installQueue;
      return {
        ...state,
        currentError: null,
        installQueue,
        uninstallQueue,
        updateAllQueue,
      };
    }

    case "install": {
      const { name, allowPartialDependencies } = action;

      if (state.installQueue.includes(name)) {
        // already queued for install
        return state;
      }

      const existing = state.installed.find((app) => app.name === name);
      const skippedAppOps = [...state.skippedAppOps];

      if (existing && existing.updated && state.installedAvailable) {
        // already installed and up to date
        skippedAppOps.push({
          reason: SkipReason.AppAlreadyInstalled,
          appOp: action,
        });
        return { ...state, skippedAppOps };
      }

      const appToInstall: App | null | undefined = state.appByName[name];

      // The target application was not found in the specified provider BUT
      // we can update the firmware instead, and perhaps in the new FW it is available.
      if (
        !appToInstall &&
        state.firmware?.updateAvailable?.final?.version &&
        semver.lt(
          state.deviceInfo.version,
          state.firmware?.updateAvailable?.final?.version || ""
        )
      ) {
        throw new LatestFirmwareVersionRequired(
          "LatestFirmwareVersionRequired",
          {
            current: state.deviceInfo.version,
            latest: state.firmware?.updateAvailable?.final?.version,
          }
        );
      }

      // The target application was not found in the specified provider.
      if (!appToInstall) {
        if (allowPartialDependencies) {
          // Some flows are resillient to missing operations.
          skippedAppOps.push({
            reason: SkipReason.NoSuchAppOnProvider,
            appOp: action,
          });
          return { ...state, skippedAppOps };
        } else {
          // Some flows are not, and we want to stop with an error.
          throw new NoSuchAppOnProvider("", { appName: name });
        }
      }

      const dependencies = appToInstall.dependencies;
      const dependentsOfDep = flatMap(dependencies, (dep) =>
        findDependents(state.appByName, dep)
      );
      const depsInstalledOutdated = state.installed.filter(
        (a) => dependencies.includes(a.name) && !a.updated
      );
      let installList = state.installQueue;

      // installing an app will remove if planned for uninstalling
      let uninstallList = state.uninstallQueue.filter(
        (u) => name !== u && !dependencies.includes(u)
      );

      if (state.uninstallQueue.length !== uninstallList.length) {
        // app was asked for uninstall so it means we need to just cancel.
        // TODO cover this in tests...
      } else {
        // if app is already installed but outdated, we'll need to update related deps
        if ((existing && !existing.updated) || depsInstalledOutdated.length) {
          // if app has installed direct dependent apps, we'll need to update them too
          const directDependents = findDependents(state.appByName, name).filter(
            (d) => state.installed.some((a) => a.name === d)
          );
          const outdated = state.installed
            .filter(
              (a) =>
                !a.updated &&
                [
                  name,
                  ...dependencies,
                  ...directDependents,
                  ...dependentsOfDep,
                ].includes(a.name)
            )
            .map((a) => a.name);
          uninstallList = uninstallList.concat(outdated);
          installList = installList.concat(outdated);
        }

        installList = installList.concat([
          ...dependencies.filter(
            (d) => !state.installed.some((a) => a.name === d)
          ),
          name,
        ]);
      }

      const installQueue = reorderInstallQueue(state.appByName, installList);
      const uninstallQueue = reorderUninstallQueue(
        state.appByName,
        uninstallList
      );
      return { ...state, currentError: null, installQueue, uninstallQueue };
    }
    case "setCustomImage": {
      const { lastSeenCustomImage } = action;
      const { size } = lastSeenCustomImage;
      return {
        ...state,
        customImageBlocks: Math.ceil(size / getBlockSize(state)),
      };
    }

    case "uninstall": {
      const { name } = action;

      if (state.uninstallQueue.includes(name)) {
        // already queued
        return state;
      }

      // uninstalling an app will remove from installQueue as well as direct deps
      const installQueue = state.installQueue.filter((u) => name !== u);
      let uninstallQueue = state.uninstallQueue;

      if (
        state.installed.some((a) => a.name === name || a.name === "") ||
        action.force || // if installed unavailable and it was not a cancellation
        // TODO cover this in tests...
        (!state.installedAvailable && !state.installQueue.includes(name))
      ) {
        uninstallQueue = reorderUninstallQueue(
          state.appByName,
          uninstallQueue.concat([
            ...findDependents(state.appByName, name).filter((d) =>
              state.installed.some((a) => a.name === d)
            ),
            name,
          ])
        );
      }

      return { ...state, currentError: null, installQueue, uninstallQueue };
    }
  }
};
const defaultConfig = {
  warnMemoryRatio: 0.1,
  sortApps: false,
};
// calculate all size information useful for display
export const distribute = (
  state: State,
  config?: $Shape<typeof defaultConfig>
): AppsDistribution => {
  const { customImageBlocks } = state;
  const { warnMemoryRatio, sortApps } = { ...defaultConfig, ...config };
  const blockSize = getBlockSize(state);
  const totalBytes = state.deviceModel.memorySize;
  const totalBlocks = Math.floor(totalBytes / blockSize);
  const osBytes = (state.firmware && state.firmware.bytes) || 0;
  const osBlocks = Math.ceil(osBytes / blockSize);
  const appsSpaceBlocks = totalBlocks - osBlocks - customImageBlocks;
  const appsSpaceBytes = appsSpaceBlocks * blockSize;
  let totalAppsBlocks = 0;
  const apps = state.installed.map((app) => {
    const { name, blocks } = app;
    totalAppsBlocks += blocks;
    const currency =
      // try to find the "official" currency when possible (2 currencies can have the same manager app and ticker)
      findCryptoCurrency((c) => c.name === name) ||
      // Else take the first one with that manager app
      findCryptoCurrency((c) => c.managerAppName === name);
    return {
      currency,
      name,
      blocks,
      bytes: blocks * blockSize,
    };
  });

  if (sortApps) {
    apps.sort((a, b) => b.blocks - a.blocks);
  }

  const totalAppsBytes = totalAppsBlocks * blockSize;
  const freeSpaceBlocks = appsSpaceBlocks - totalAppsBlocks;
  const freeSpaceBytes = freeSpaceBlocks * blockSize;
  const shouldWarnMemory = freeSpaceBlocks / appsSpaceBlocks < warnMemoryRatio;
  return {
    totalBlocks,
    totalBytes,
    osBlocks,
    osBytes,
    apps,
    appsSpaceBlocks,
    appsSpaceBytes,
    totalAppsBlocks,
    customImageBlocks,
    totalAppsBytes,
    freeSpaceBlocks,
    freeSpaceBytes,
    shouldWarnMemory,
  };
};
export function getBlockSize(state: State): number {
  return state.deviceModel.getBlockSize(state.deviceInfo.version);
}
// tells if the state is "incomplete" to implement the Manager v2 feature
// this happens when some apps are unrecognized
export const isIncompleteState = (state: State): boolean =>
  state.installed.some((a) => !a.name);
// calculate if a given state (typically a predicted one) is out of memory (meaning impossible to reach with a device)
export const isOutOfMemoryState = (state: State): boolean => {
  const blockSize = getBlockSize(state);
  const totalBytes = state.deviceModel.memorySize;
  const totalBlocks = Math.floor(totalBytes / blockSize);
  const osBytes = (state.firmware && state.firmware.bytes) || 0;
  const osBlocks = Math.ceil(osBytes / blockSize);
  const appsSpaceBlocks = totalBlocks - osBlocks;
  const totalAppsBlocks = state.installed.reduce(
    (sum, app) => sum + app.blocks,
    0
  );
  return totalAppsBlocks > appsSpaceBlocks;
};
export const isLiveSupportedApp = (app: App): boolean => {
  const currency = app?.currencyId
    ? findCryptoCurrencyById(app.currencyId)
    : null;
  return currency ? isCurrencySupported(currency) : false;
};
export const updateAllProgress = (state: State): number => {
  const total = state.updateAllQueue.length;

  /** each uninstall and install comes in a pair and have a weight of 0.5 in the progress */
  const current = (state.uninstallQueue.length + state.installQueue.length) / 2;
  if (total === 0 || current === 0) return 1;
  return Math.max(0, Math.min((total - current) / total, 1));
};
// a series of operation to perform on the device for current state
export const getActionPlan = (state: State): AppOp[] =>
  state.uninstallQueue
    .map(
      (name) =>
        <AppOp>{
          type: "uninstall",
          name,
        }
    )
    .concat(
      state.installQueue.map(
        (name) =>
          <AppOp>{
            type: "install",
            name,
          }
      )
    );
// get next operation to perform
export const getNextAppOp = (state: State): AppOp | null | undefined => {
  if (state.uninstallQueue.length) {
    return {
      type: "uninstall",
      name: state.uninstallQueue[0],
    };
  } else if (state.installQueue.length) {
    return {
      type: "install",
      name: state.installQueue[0],
    };
  }
};
// resolve the State to predict when all queued ops are done
export const predictOptimisticState = (state: State): State => {
  const s = { ...state, currentProgressSubject: null };
  return getActionPlan(s)
    .map(
      (appOp) =>
        <Action>{
          type: "onRunnerEvent",
          event: {
            type: "runSuccess",
            appOp,
          },
        }
    )
    .reduce(reducer, s);
};

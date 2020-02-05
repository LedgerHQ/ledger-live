// @flow

import flatMap from "lodash/flatMap";
import { getDeviceModel } from "@ledgerhq/devices";
import type { App } from "../types/manager";
import type {
  AppOp,
  State,
  Action,
  ListAppsResult,
  AppsDistribution
} from "./types";
import { findCryptoCurrency } from "../data/cryptocurrencies";

export const initState = ({
  deviceModelId,
  appsListNames,
  ...listAppsResult
}: ListAppsResult): State => ({
  ...listAppsResult,
  apps: appsListNames.map(name => listAppsResult.appByName[name]),
  deviceModel: getDeviceModel(deviceModelId),
  installQueue: [],
  uninstallQueue: [],
  currentProgress: null,
  currentError: null,
  currentAppOp: null
});

// ^TODO move this to legacyDependencies.js
// we should have dependency as part of the data!

const reorderInstallQueue = (
  appByName: { [_: string]: App },
  apps: string[]
): string[] => {
  let list = [];
  apps.forEach(app => {
    if (list.includes(app)) return;
    if (app in appByName) {
      const deps = appByName[app].dependencies;
      deps.forEach(dep => {
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
  appByName: { [_: string]: App },
  apps: string[]
): string[] =>
  reorderInstallQueue(appByName, apps.slice(0).reverse()).reverse();

const findDependents = (
  appByName: { [_: string]: App },
  name: string
): string[] => {
  const all = [];
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
          currentProgress: {
            appOp: appOp,
            progress: 0
          }
        };
      } else if (event.type === "runSuccess") {
        if (appOp.type === "install") {
          const app = state.apps.find(a => a.name === appOp.name);
          return {
            ...state,
            currentAppOp: null,
            currentProgress: null,
            currentError: null,
            // append the app to known installed apps
            installed: state.installed
              .filter(o => o.name !== appOp.name)
              .concat({
                name: appOp.name,
                updated: true,
                hash: app ? app.hash : "",
                blocks:
                  app && app.bytes
                    ? Math.ceil(app.bytes / state.deviceModel.blockSize)
                    : 0
              }),
            // remove the install action
            installQueue: state.installQueue.filter(name => appOp.name !== name)
          };
        } else {
          return {
            ...state,
            currentAppOp: null,
            currentProgress: null,
            currentError: null,
            // remove apps to known installed apps
            installed: state.installed.filter(i => appOp.name !== i.name),
            // remove the uninstall action
            uninstallQueue: state.uninstallQueue.filter(
              name => appOp.name !== name
            )
          };
        }
      } else if (event.type === "runError") {
        return {
          ...state,
          // an error stops everything
          uninstallQueue: [],
          installQueue: [],
          currentAppOp: null,
          currentError: {
            appOp: appOp,
            error: event.error
          }
        };
      } else if (event.type === "runProgress") {
        return {
          ...state,
          currentProgress: {
            appOp: appOp,
            progress: event.progress
          }
        };
      }
      return state;
    }

    case "wipe":
      return {
        ...state,
        currentError: null,
        installQueue: [],
        uninstallQueue: reorderUninstallQueue(
          state.appByName,
          state.installed.map(({ name }) => name)
        )
      };

    case "updateAll": {
      let installList = state.installQueue.slice(0);
      let uninstallList = state.uninstallQueue.slice(0);

      state.installed.forEach(app => {
        if (!app.updated) {
          const dependents = state.installed
            .filter(a => {
              const depApp = state.appByName[a.name];
              return depApp && depApp.dependencies.includes(app.name);
            })
            .map(a => a.name);
          uninstallList = uninstallList.concat([app.name, ...dependents]);
          installList = installList.concat([app.name, ...dependents]);
        }
      });

      const installQueue = reorderInstallQueue(state.appByName, installList);
      const uninstallQueue = reorderUninstallQueue(
        state.appByName,
        uninstallList
      );

      return {
        ...state,
        currentError: null,
        installQueue,
        uninstallQueue
      };
    }

    case "install": {
      const { name } = action;
      if (state.installQueue.includes(name)) {
        // already queued for install
        return state;
      }
      const existing = state.installed.find(app => app.name === name);

      if (existing && existing.updated && state.installedAvailable) {
        // already installed and up to date
        return state;
      }

      const depApp = state.appByName[name];
      const deps = depApp && depApp.dependencies;
      const dependentsOfDep =
        deps && flatMap(deps, dep => findDependents(state.appByName, dep));
      const depsInstalledOutdated =
        deps &&
        state.installed.filter(a => deps.includes(a.name) && !a.updated);

      let installList = state.installQueue;
      // installing an app will remove if planned for uninstalling
      let uninstallList = state.uninstallQueue.filter(
        u => name !== u && !deps.includes(u)
      );

      if (state.uninstallQueue.length !== uninstallList.length) {
        // app was asked for uninstall so it means we need to just cancel.
        // TODO cover this in tests...
      } else {
        // if app is already installed but outdated, we'll need to update related deps
        if ((existing && !existing.updated) || depsInstalledOutdated.length) {
          const outdated = state.installed
            .filter(
              a =>
                !a.updated &&
                [name, ...deps, ...dependentsOfDep].includes(a.name)
            )
            .map(a => a.name);
          uninstallList = uninstallList.concat(outdated);
          installList = installList.concat(outdated);
        }

        installList = installList.concat([
          ...deps.filter(d => !state.installed.some(a => a.name === d)),
          name
        ]);
      }

      const installQueue = reorderInstallQueue(state.appByName, installList);
      const uninstallQueue = reorderUninstallQueue(
        state.appByName,
        uninstallList
      );

      return {
        ...state,
        currentError: null,
        installQueue,
        uninstallQueue
      };
    }

    case "uninstall": {
      const { name } = action;
      if (state.uninstallQueue.includes(name)) {
        // already queued
        return state;
      }

      // uninstalling an app will remove from installQueue as well as direct deps
      const installQueue = state.installQueue.filter(u => name !== u);

      let uninstallQueue = state.uninstallQueue;
      if (
        state.installed.some(a => a.name === name || a.name === "") ||
        action.force ||
        // if installed unavailable and it was not a cancellation
        // TODO cover this in tests...
        (!state.installedAvailable && !state.installQueue.includes(name))
      ) {
        uninstallQueue = reorderUninstallQueue(
          state.appByName,
          uninstallQueue.concat([
            ...findDependents(state.appByName, name).filter(d =>
              state.installed.some(a => a.name === d)
            ),
            name
          ])
        );
      }

      return {
        ...state,
        currentError: null,
        installQueue,
        uninstallQueue
      };
    }
  }
  return state;
};

const defaultConfig = {
  warnMemoryRatio: 0.1,
  sortApps: false
};

// calculate all size information useful for display
export const distribute = (
  state: State,
  config?: $Shape<typeof defaultConfig>
): AppsDistribution => {
  const { warnMemoryRatio, sortApps } = { ...defaultConfig, ...config };
  const blockSize = state.deviceModel.blockSize;
  const totalBytes = state.deviceModel.memorySize;
  const totalBlocks = Math.floor(totalBytes / blockSize);
  const osBytes = (state.firmware && state.firmware.bytes) || 0;
  const osBlocks = Math.ceil(osBytes / blockSize);
  const appsSpaceBlocks = totalBlocks - osBlocks;
  const appsSpaceBytes = appsSpaceBlocks * blockSize;
  let totalAppsBlocks = 0;
  const apps = state.installed.map(app => {
    const { name, blocks } = app;
    totalAppsBlocks += blocks;
    const currency = findCryptoCurrency(c => c.managerAppName === name);
    return { currency, name, blocks, bytes: blocks * blockSize };
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
    totalAppsBytes,
    freeSpaceBlocks,
    freeSpaceBytes,
    shouldWarnMemory
  };
};

// tells if the state is "incomplete" to implement the Manager v2 feature
// this happens when some apps are unrecognized
export const isIncompleteState = (state: State): boolean =>
  state.installed.some(a => !a.name);

// calculate if a given state (typically a predicted one) is out of memory (meaning impossible to reach with a device)
export const isOutOfMemoryState = (state: State): boolean => {
  const blockSize = state.deviceModel.blockSize;
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

// a series of operation to perform on the device for current state
export const getActionPlan = (state: State): AppOp[] =>
  state.uninstallQueue
    .map(name => ({ type: "uninstall", name }))
    .concat(state.installQueue.map(name => ({ type: "install", name })));

// get next operation to perform
export const getNextAppOp = (state: State): ?AppOp => {
  if (state.uninstallQueue.length) {
    return { type: "uninstall", name: state.uninstallQueue[0] };
  } else if (state.installQueue.length) {
    return { type: "install", name: state.installQueue[0] };
  }
};

// resolve the State to predict when all queued ops are done
export const predictOptimisticState = (state: State): State =>
  getActionPlan(state)
    .map(appOp => ({
      type: "onRunnerEvent",
      event: { type: "runSuccess", appOp }
    }))
    .reduce(reducer, state);

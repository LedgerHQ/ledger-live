// @flow

import type { State, Action, ListAppsResult } from "./types";
import {
  listCryptoCurrencies,
  findCryptoCurrencyById
} from "../data/cryptocurrencies";

export const initState = (listAppsResult: ListAppsResult): State => ({
  ...listAppsResult,
  installQueue: [],
  uninstallQueue: [],
  currentProgress: null,
  currentError: null,
  currentAppOp: null
});

const directDep = {};
const reverseDep = {};
function declareDep(name, dep) {
  directDep[name] = dep;
  reverseDep[dep] = (reverseDep[dep] || []).concat(name);
}
listCryptoCurrencies(true, true).forEach(a => {
  if (!a.managerAppName) return; // no app for this currency
  const dep = findCryptoCurrencyById(a.family);
  if (!dep || !dep.managerAppName) return; // no dep
  if (dep.managerAppName === a.managerAppName) return; // same app
  declareDep(a.managerAppName, dep.managerAppName);
});

// extra dependencies
[
  ["RSK", "Ethereum"],
  ["ZenCash", "Bitcoin"],
  ["kUSD", "Ethereum"],
  ["ThunderCore", "Ethereum"]
].forEach(([name, dep]) => declareDep(name, dep));

export const getDirectDep = (appName: string): ?string => directDep[appName];

export const getDependencies = (appName: string): string[] =>
  reverseDep[appName] || [];

const reorderInstallQueue = (apps: string[]): string[] => {
  const list = [];
  apps.forEach(app => {
    if (list.includes(app)) return;
    const dep = directDep[app];
    if (dep && apps.includes(dep) && !list.includes(dep)) {
      list.push(dep);
    }
    list.push(app);
  });
  return list;
};

const reorderUninstallQueue = (apps: string[]): string[] =>
  reorderInstallQueue(apps.slice(0).reverse()).reverse();

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "onRunnerEvent":
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
                hash: (app && state.hashesByKey[app.firmware]) || "", // today we don't trust the app.hash
                blocks: (app && state.blocksByKey[app.firmware]) || 0
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

    case "wipe":
      return {
        ...state,
        currentError: null,
        installQueue: [],
        uninstallQueue: reorderUninstallQueue(
          state.installed.map(({ name }) => name)
        )
      };

    case "updateAll": {
      let installList = state.installQueue.slice(0);
      let uninstallList = state.uninstallQueue.slice(0);

      state.installed.forEach(app => {
        if (!app.updated) {
          const dependents = state.installed
            .filter(a => directDep[a.name] === app.name)
            .map(a => a.name);
          uninstallList = uninstallList.concat([app.name, ...dependents]);
          installList = installList.concat([app.name, ...dependents]);
        }
      });

      const installQueue = reorderInstallQueue(installList);
      const uninstallQueue = reorderUninstallQueue(uninstallList);

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

      const dep = directDep[name];
      const depInstall = dep && state.installed.find(a => a.name === dep);

      let installList = state.installQueue;
      // installing an app will remove if planned for uninstalling
      let uninstallList = state.uninstallQueue.filter(
        u => name !== u && u !== dep
      );

      if (state.uninstallQueue.length !== uninstallList.length) {
        // app was asked for uninstall so it means we need to just cancel.
        // TODO cover this in tests...
      } else {
        // if app is already installed but outdated, we'll need to update related deps
        if (
          (existing && !existing.updated) ||
          (depInstall && !depInstall.updated)
        ) {
          const outdated = state.installed
            .filter(
              a =>
                !a.updated &&
                [name, dep, ...getDependencies(dep)].includes(a.name)
            )
            .map(a => a.name);
          uninstallList = uninstallList.concat(outdated);
          installList = installList.concat(outdated);
        }

        installList = installList.concat(
          dep && !depInstall ? [dep, name] : [name]
        );
      }

      const installQueue = reorderInstallQueue(installList);
      const uninstallQueue = reorderUninstallQueue(uninstallList);

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
      const installQueue = state.installQueue.filter(
        u => name !== u && name !== !directDep[u]
      );

      let uninstallQueue = state.uninstallQueue;
      if (
        state.installed.some(a => a.name === name) ||
        action.force ||
        // if installed unavailable and it was not a cancellation
        // TODO cover this in tests...
        (!state.installedAvailable && !state.installQueue.includes(name))
      ) {
        uninstallQueue = reorderUninstallQueue(
          uninstallQueue.concat([
            ...getDependencies(name).filter(d =>
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

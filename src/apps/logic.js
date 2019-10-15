// @flow

import uniq from "lodash/uniq";
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

const reorderInstallQueue = (apps: string[]): string[] =>
  // we assume there is only one level of dep here.
  uniq(
    // deps first
    apps
      .map(a => directDep[a])
      .filter(a => a)
      .concat(apps)
  );

const reorderUninstallQueue = (apps: string[]): string[] =>
  reorderInstallQueue(apps).reverse();

/* TODO
 - logic does not yet handle the outdated apps to update.
   - installing an app require all deps to be up to date
   - add a updateAll action
 - 
*/

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "onRunnerEvent":
      // an app operation was correctly prefered. update state accordingly
      const { event } = action;
      const { appOp } = event;
      if (event.type === "runStart") {
        return {
          ...state,
          currentAppOp: appOp
        };
      } else if (event.type === "runSuccess") {
        if (appOp.type === "install") {
          return {
            ...state,
            currentAppOp: null,
            // append the app to known installed apps
            installed: state.installed
              .filter(o => o.name !== appOp.name)
              .concat({
                name: appOp.name,
                updated: true
              }),
            // remove the install action
            installQueue: state.installQueue.filter(name => appOp.name !== name)
          };
        } else {
          return {
            ...state,
            currentAppOp: null,
            // remove apps to known installed apps
            installed: state.installed.filter(i => appOp.name !== i.name),
            // remove the uninstall action
            uninstallQueue: state.installQueue.filter(
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

    case "install": {
      const { name } = action;
      if (state.installQueue.includes(name)) return state; // already queued

      const dep = directDep[name];

      const installQueue = reorderInstallQueue(
        state.installQueue.concat(dep ? [dep, name] : [name])
      );

      // installing an app will remove if planned for uninstalling
      const uninstallQueue = state.uninstallQueue.filter(
        u => name !== u && u !== dep
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
      if (state.uninstallQueue.includes(name)) return state; // already queued

      // uninstalling an app will remove from installQueue as well as direct deps
      const installQueue = state.installQueue.filter(
        u => name !== u && name !== !directDep[u]
      );

      const uninstallQueue = reorderUninstallQueue(
        state.installQueue.concat([...reverseDep[name], name])
      );

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

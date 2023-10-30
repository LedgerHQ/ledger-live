import { App } from "@ledgerhq/types-live";
import React, { useContext } from "react";

/**
 * Represents an installed app that depends on other installed apps.
 * For instance:
 * `{ app: polygonApp, dependents: [ethereumApp] }`
 */
export type AppWithDependencies = {
  app: App;
  dependencies: App[];
};

/**
 * Represents an installed app that has other installed apps depending on it.
 * For instance:
 * `{ app: ethereumApp, dependents: [polygonApp] }`
 */
export type AppWithDependents = {
  app: App;
  dependents: App[];
};

type AppsInstallUninstallWithDependenciesValue = {
  setAppWithDependenciesToInstall: (appWithDependencies: AppWithDependencies | null) => void;
  setAppWithDependentsToUninstall: (appWithDependents: AppWithDependents | null) => void;
};

/**
 * Defines setters for apps to install with their dependencies or apps to
 * uninstall with their dependents.
 * This context was introduced to avoid prop drilling.
 */
const AppsInstallUninstallWithDependenciesContext = React.createContext<
  AppsInstallUninstallWithDependenciesValue | undefined
>(undefined);

export const AppsInstallUninstallWithDependenciesContextProvider =
  AppsInstallUninstallWithDependenciesContext.Provider;

export function useSetAppsWithDependenciesToInstallUninstall() {
  const contextValue = useContext(AppsInstallUninstallWithDependenciesContext);
  if (contextValue === undefined)
    throw new Error(
      "useAppsInstallUninstallWithDependencies must be used within a context provider",
    );
  return contextValue;
}

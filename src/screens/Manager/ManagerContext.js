import React, { createContext, useState } from "react";

export const ManagerContext = createContext();

export const ManagerProvider = ({ children }: *) => {
  const [storageWarning, setStorageWarning] = useState(null);
  const [appInstallWithDependencies, setAppInstallWithDependencies] = useState(
    null,
  );
  const [
    appUninstallWithDependencies,
    setAppUninstallWithDependencies,
  ] = useState(null);
  const MANAGER_TABS = {
    CATALOG: "CATALOG",
    INSTALLED_APPS: "INSTALLED_APPS",
  };

  return (
    <ManagerContext.Provider
      value={{
        storageWarning,
        setStorageWarning,
        MANAGER_TABS,
        appInstallWithDependencies,
        setAppInstallWithDependencies,
        appUninstallWithDependencies,
        setAppUninstallWithDependencies,
      }}
    >
      {children}
    </ManagerContext.Provider>
  );
};

import React, { useState, useCallback, useEffect, createContext } from "react";

import type { Action, State } from "@ledgerhq/live-common/lib/apps";

import { NavigationEvents } from "react-navigation";

import AppsScreen from "./AppsScreen";
import GenericErrorBottomModal from "../../components/GenericErrorBottomModal";
import StorageWarningModal from "./Modals/StorageWarningModal";
import AppDependenciesModal from "./Modals/AppDependenciesModal";
import UninstallDependenciesModal from "./Modals/UninstallDependenciesModal";

type Props = {
  screenProps: {
    state: State,
    dispatch: Action => void,
  },
  navigation: *,
};

export const ManagerContext = createContext();

export default ({ screenProps: { state, dispatch }, navigation }: Props) => {
  const { apps, currentError, installQueue, uninstallQueue } = state;

  useEffect(() => {
    const isUpdating = installQueue.length + uninstallQueue.length > 0;
    console.log('updating', isUpdating);
    navigation.setParams({ isUpdating });
  }, [installQueue.length, uninstallQueue.length]);

  const [error, setError] = useState(null);
  useEffect(() => setError(currentError), [setError, currentError]);
  const closeErrorModal = useCallback(() => setError(null), [setError]);

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

  const resetAppInstallWithDependencies = useCallback(() => {
    setAppInstallWithDependencies(null);
  }, [setAppInstallWithDependencies]);
  const resetAppUninstallWithDependencies = useCallback(() => {
    setAppUninstallWithDependencies(null);
  }, [setAppUninstallWithDependencies]);

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
      <NavigationEvents
        onWillBlur={payload => console.log('will blur', payload)} // show modal if updating
      />
      <AppsScreen state={state} dispatch={dispatch} />
      <GenericErrorBottomModal error={error} onClose={closeErrorModal} />
      <StorageWarningModal
        warning={storageWarning}
        onClose={setStorageWarning}
      />
      <AppDependenciesModal
        app={appInstallWithDependencies}
        onClose={resetAppInstallWithDependencies}
        appList={apps}
        dispatch={dispatch}
      />
      <UninstallDependenciesModal
        app={appUninstallWithDependencies}
        onClose={resetAppUninstallWithDependencies}
        state={state}
        dispatch={dispatch}
      />
    </ManagerContext.Provider>
  );
};

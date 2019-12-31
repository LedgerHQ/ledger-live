import React, { useState, useCallback, useEffect } from "react";
import { NavigationActions } from "react-navigation";
import type { Action, State } from "@ledgerhq/live-common/lib/apps";

import { ManagerContext } from "./shared";
import AppsScreen from "./AppsScreen";
import GenericErrorBottomModal from "../../components/GenericErrorBottomModal";
import QuitManagerModal from "./Modals/QuitManagerModal";
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

export default ({ screenProps: { state, dispatch }, navigation }: Props) => {
  const { apps, currentError, installQueue, uninstallQueue } = state;
  const [quitManagerAction, setQuitManagerAction] = useState(false);

  useEffect(() => {
    const blockNavigation = installQueue.length + uninstallQueue.length > 0;
    const n = navigation.dangerouslyGetParent();
    if (n) {
      n.setParams({ blockNavigation });
      let navListener;
      if (blockNavigation) {
        navListener = navigation.addListener("action", e => {
          if (e.action && e.action.type !== NavigationActions.SET_PARAMS) {
            setQuitManagerAction(e.action);
          }
        });
      } else if (navListener) {
        navListener.remove();
        setQuitManagerAction(false);
      }
    }
  }, [installQueue.length, uninstallQueue.length, setQuitManagerAction]);

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
  const closeQuitManagerModal = useCallback(() => setQuitManagerAction(null), [
    setQuitManagerAction,
  ]);
  const quitManager = useCallback(() => {
    const n = navigation.dangerouslyGetParent();
    if (n) n.setParams({ blockNavigation: false });
    navigation.dispatch(quitManagerAction);
    setQuitManagerAction(null);
  }, [quitManagerAction, setQuitManagerAction]);

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
      <AppsScreen state={state} dispatch={dispatch} navigation={navigation} />
      <GenericErrorBottomModal error={error} onClose={closeErrorModal} />
      <QuitManagerModal
        isOpened={quitManagerAction}
        onConfirm={quitManager}
        onClose={closeQuitManagerModal}
      />
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

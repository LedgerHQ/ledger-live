import React, { useState, useCallback, useEffect, memo } from "react";
import { NavigationActions } from "react-navigation";
import type { Action, State } from "@ledgerhq/live-common/lib/apps";

import { useApps } from "./shared";
import AppsScreen from "./AppsScreen";
import GenericErrorBottomModal from "../../components/GenericErrorBottomModal";
import { TrackScreen } from "../../analytics";
import QuitManagerModal from "./Modals/QuitManagerModal";
import StorageWarningModal from "./Modals/StorageWarningModal";
import AppDependenciesModal from "./Modals/AppDependenciesModal";
import UninstallDependenciesModal from "./Modals/UninstallDependenciesModal";

const MANAGER_TABS = {
  CATALOG: "CATALOG",
  INSTALLED_APPS: "INSTALLED_APPS",
};
type Props = {
  screenProps: {
    state: State,
    dispatch: Action => void,
  },
  navigation: *,
};

/** navigation action listener */
let navListener;

const Manager = ({ navigation }: Props) => {
  const { appRes, deviceId, deviceInfo } = navigation.state.params;
  const [state, dispatch] = useApps(appRes, deviceId);

  const { apps, currentError, installQueue, uninstallQueue } = state;
  const blockNavigation = installQueue.length + uninstallQueue.length > 0;

  const [quitManagerAction, setQuitManagerAction] = useState(false);

  /** general error state */
  const [error, setError] = useState(null);
  /** storage warning modal state */
  const [storageWarning, setStorageWarning] = useState(null);
  /** install app with dependencies modal state */
  const [appInstallWithDependencies, setAppInstallWithDependencies] = useState(
    null,
  );
  /** uninstall app with dependencies modal state */
  const [
    appUninstallWithDependencies,
    setAppUninstallWithDependencies,
  ] = useState(null);

  /** open error modal each time a new error appears in state.currentError */
  useEffect(() => {
    if (currentError) {
      setError(currentError.error);
    }
  }, [setError, currentError]);

  /**
   * updates navigation params to block it if un/installation is running
   * (Main navigation router handles the blocking)
   * */
  useEffect(() => {
    const n = navigation.dangerouslyGetParent();
    if (n) {
      /** set navigation param */
      n.setParams({ blockNavigation });

      // if we should block navigation
      if (blockNavigation) {
        /** we listen for future navigation actions that trigger page changes (not SET_PARAMS) */
        navListener = navigation.addListener("action", e => {
          if (e.action && e.action.type !== NavigationActions.SET_PARAMS) {
            /** set quit manager modal to the navigation action we caught */
            setQuitManagerAction(e.action);
          }
        });
      } else if (navListener) {
        /** if we should unblock navigation AND previous navListner was set
         * we remove the listener and reset the quit modal state to null */
        navListener.remove();
        setQuitManagerAction(null);
      }
    }
  }, [blockNavigation, setQuitManagerAction, navigation]);

  /**
   * Resets the navigation params in order to unlock navigation
   * then trigger caught navigation action
   */
  const quitManager = useCallback(() => {
    const n = navigation.dangerouslyGetParent();
    if (n) n.setParams({ blockNavigation: false });
    navigation.dispatch(quitManagerAction);
    setQuitManagerAction(null);
  }, [quitManagerAction, setQuitManagerAction, navigation]);

  const closeErrorModal = useCallback(() => setError(null), [setError]);

  const resetAppInstallWithDependencies = useCallback(() => {
    setAppInstallWithDependencies(null);
  }, [setAppInstallWithDependencies]);

  const resetAppUninstallWithDependencies = useCallback(() => {
    setAppUninstallWithDependencies(null);
  }, [setAppUninstallWithDependencies]);

  const closeQuitManagerModal = useCallback(() => setQuitManagerAction(null), [
    setQuitManagerAction,
  ]);

  const resetStorageWarning = useCallback(() => setStorageWarning(null), [
    setStorageWarning,
  ]);

  return (
    <>
      <TrackScreen category="Manager" name="AppsList" />
      <AppsScreen
        state={state}
        dispatch={dispatch}
        navigation={navigation}
        setAppInstallWithDependencies={setAppInstallWithDependencies}
        setAppUninstallWithDependencies={setAppUninstallWithDependencies}
        setStorageWarning={setStorageWarning}
        managerTabs={MANAGER_TABS}
        deviceId={navigation.getParam("deviceId")}
        initialDeviceName={navigation.getParam("deviceName")}
        blockNavigation={blockNavigation}
        deviceInfo={deviceInfo}
      />
      <GenericErrorBottomModal error={error} onClose={closeErrorModal} />
      <QuitManagerModal
        isOpened={quitManagerAction}
        onConfirm={quitManager}
        onClose={closeQuitManagerModal}
        installQueue={installQueue}
        uninstallQueue={uninstallQueue}
      />
      <StorageWarningModal
        warning={storageWarning}
        onClose={resetStorageWarning}
      />
      <AppDependenciesModal
        appInstallWithDependencies={appInstallWithDependencies}
        onClose={resetAppInstallWithDependencies}
        appList={apps}
        dispatch={dispatch}
      />
      <UninstallDependenciesModal
        appUninstallWithDependencies={appUninstallWithDependencies}
        onClose={resetAppUninstallWithDependencies}
        dispatch={dispatch}
      />
    </>
  );
};

export default memo(Manager);

import React, { useState, useCallback, useEffect } from "react";
import { NavigationActions } from "react-navigation";
import type { Action, State } from "@ledgerhq/live-common/lib/apps";

import { ManagerContext, ManagerProgressContext, useApps } from "./shared";
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
  const { appRes, deviceId } = navigation.state.params;
  const [state, dispatch] = useApps(appRes, deviceId);
  const filteredState = {
    apps: state.apps,
    deviceInfo: state.deviceInfo,
    deviceModel: state.deviceModel,
    firmware: state.firmware,
    appByName: state.appByName,
    installed: state.installed,
    installQueue: state.installQueue,
    uninstallQueue: state.uninstallQueue,
    currentAppOp: state.currentAppOp,
    currentError: state.currentError,
  };
  const { apps, currentError, installQueue, uninstallQueue } = filteredState;
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
  useEffect(() => setError(currentError), [setError, currentError]);

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
        deviceId: navigation.getParam("deviceId"),
        initialDeviceName: navigation.getParam("deviceName"),
      }}
    >
      <TrackScreen category="Manager" name="AppsList" />
      <ManagerProgressContext.Provider
        value={{ currentProgress: state.currentProgress }}
      >
        <AppsScreen
          state={filteredState}
          dispatch={dispatch}
          navigation={navigation}
        />
      </ManagerProgressContext.Provider>
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

export default Manager;

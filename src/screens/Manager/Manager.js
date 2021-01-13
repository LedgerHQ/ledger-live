import React, { useState, useCallback, useEffect, memo } from "react";
import { CommonActions } from "@react-navigation/native";

import type { DeviceInfo } from "@ledgerhq/live-common/lib/types/manager";
import type { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import type { ListAppsResult } from "@ledgerhq/live-common/lib/apps/types";

import { useApps } from "./shared";
import AppsScreen from "./AppsScreen";
import GenericErrorBottomModal from "../../components/GenericErrorBottomModal";
import { TrackScreen } from "../../analytics";
import QuitManagerModal from "./Modals/QuitManagerModal";
import StorageWarningModal from "./Modals/StorageWarningModal";
import AppDependenciesModal from "./Modals/AppDependenciesModal";
import UninstallDependenciesModal from "./Modals/UninstallDependenciesModal";
import { useLockNavigation } from "../../components/RootNavigator/CustomBlockRouterNavigator";
import { defaultNavigationOptions } from "../../navigation/navigatorConfig";

export const MANAGER_TABS = {
  CATALOG: "CATALOG",
  INSTALLED_APPS: "INSTALLED_APPS",
};

export type ManagerTab = $Keys<typeof MANAGER_TABS>;

type Props = {
  navigation: any,
  route: {
    params: {
      device: Device,
      deviceInfo: DeviceInfo,
      result: ListAppsResult,
      searchQuery?: string,
      updateModalOpened?: boolean,
      tab: ManagerTab,
    },
  },
};

const Manager = ({
  navigation,
  route: {
    params: {
      device,
      deviceInfo,
      result,
      searchQuery,
      updateModalOpened,
      tab = MANAGER_TABS.CATALOG,
    },
  },
}: Props) => {
  const { deviceId, deviceName, modelId } = device;
  const [state, dispatch] = useApps(result, deviceId);

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

  // send informations to main router in order to lock navigation
  useLockNavigation(blockNavigation, setQuitManagerAction);

  useEffect(() => {
    navigation.setOptions({
      headerBackImage: blockNavigation
        ? () => null
        : defaultNavigationOptions.headerBackImage,
      gestureEnabled: !blockNavigation,
    });
  }, [navigation, blockNavigation]);

  /**
   * Resets the navigation params in order to unlock navigation
   * then trigger caught navigation action
   */
  const quitManager = useCallback(() => {
    navigation.dispatch({
      ...CommonActions.navigate(
        quitManagerAction.payload.name,
        quitManagerAction.payload.params,
      ),
      force: true, // custom navigation option to force redirect
    });
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
      <TrackScreen
        category="Manager"
        name="AppsList"
        deviceModelId={modelId}
        deviceVersion={deviceInfo.version}
        appLength={result ? result.installed.length : 0}
      />
      <AppsScreen
        state={state}
        dispatch={dispatch}
        navigation={navigation}
        setAppInstallWithDependencies={setAppInstallWithDependencies}
        setAppUninstallWithDependencies={setAppUninstallWithDependencies}
        setStorageWarning={setStorageWarning}
        managerTabs={MANAGER_TABS}
        deviceId={deviceId}
        initialDeviceName={deviceName}
        blockNavigation={blockNavigation}
        deviceInfo={deviceInfo}
        searchQuery={searchQuery}
        updateModalOpened={updateModalOpened}
        tab={tab}
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

import React, { useState, useCallback, useEffect, memo, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { firstValueFrom, from } from "rxjs";
import { predictOptimisticState } from "@ledgerhq/live-common/apps/index";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import { CommonActions } from "@react-navigation/native";
import getDeviceInfo from "@ledgerhq/live-common/hw/getDeviceInfo";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import isFirmwareUpdateVersionSupported from "@ledgerhq/live-common/hw/isFirmwareUpdateVersionSupported";
import useLatestFirmware from "@ledgerhq/live-common/hooks/useLatestFirmware";
import { useApps } from "./shared";
import AppsScreen from "./AppsScreen";
import GenericErrorBottomModal from "~/components/GenericErrorBottomModal";
import { TrackScreen } from "~/analytics";
import QuitManagerModal from "./Modals/QuitManagerModal";
import StorageWarningModal from "./Modals/StorageWarningModal";
import InstallAppDependenciesModal from "./Modals/InstallAppDependenciesModal";
import UninstallAppDependenciesModal from "./Modals/UninstallAppDependenciesModal";
import { useLockNavigation } from "~/components/RootNavigator/CustomBlockRouterNavigator";
import { setHasInstalledAnyApp, setLastSeenDeviceInfo } from "~/actions/settings";
import { ScreenName } from "~/const";
import FirmwareUpdateScreen from "~/components/FirmwareUpdate";
import { ManagerNavigatorStackParamList } from "~/components/RootNavigator/types/ManagerNavigator";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { lastConnectedDeviceSelector } from "~/reducers/settings";
import { UpdateStep } from "../FirmwareUpdate";
import {
  AppWithDependencies,
  AppWithDependents,
  AppsInstallUninstallWithDependenciesContextProvider,
} from "./AppsInstallUninstallWithDependenciesContext";

type NavigationProps = BaseComposite<
  StackNavigatorProps<ManagerNavigatorStackParamList, ScreenName.ManagerMain>
>;

const Manager = ({ navigation, route }: NavigationProps) => {
  const {
    device,
    deviceInfo,
    result,
    searchQuery,
    firmwareUpdate,
    appsToRestore,
    updateModalOpened,
    tab = "CATALOG",
  } = route.params;

  const { deviceId, deviceName, modelId } = device;
  const [state, dispatch] = useApps(result, deviceId, appsToRestore);
  const reduxDispatch = useDispatch();

  const lastConnectedDevice = useSelector(lastConnectedDeviceSelector);
  useEffect(() => {
    // refresh the manager if an USB device gets plugged while we're on a bluetooth connection
    if (lastConnectedDevice?.deviceId.startsWith("usb|") && !device.deviceId.startsWith("usb|")) {
      navigation.replace(ScreenName.Manager, {
        device: lastConnectedDevice,
      });
    }
  }, [device.deviceId, lastConnectedDevice, navigation]);

  const refreshDeviceInfo = useCallback(() => {
    firstValueFrom(withDevice(deviceId)(transport => from(getDeviceInfo(transport)))).then(
      deviceInfo => {
        navigation.setParams({ deviceInfo });
      },
    );
  }, [deviceId, navigation]);

  const { currentError, installQueue, uninstallQueue } = state;
  const pendingInstalls = installQueue.length + uninstallQueue.length > 0;

  const optimisticState = useMemo(() => predictOptimisticState(state), [state]);
  const latestFirmware = useLatestFirmware(deviceInfo);
  const [quitManagerAction, setQuitManagerAction] = useState<{
    type: string;
    payload?: object;
    source?: string;
    target?: string;
  } | null>(null);

  const [isFirmwareUpdateOpen, setIsFirmwareUpdateOpen] = useState(false);
  useEffect(() => {
    if (
      latestFirmware &&
      firmwareUpdate &&
      isFirmwareUpdateVersionSupported(deviceInfo, device.modelId)
    ) {
      setIsFirmwareUpdateOpen(true);
    }
  }, [device.modelId, deviceInfo, firmwareUpdate, latestFirmware]);
  /** general error state */
  const [error, setError] = useState<Error | null>(null);
  /** storage warning modal state */
  const [storageWarning, setStorageWarning] = useState<string | null>(null);
  /** install app with dependencies modal state */
  const [appWithDependenciesToInstall, setAppWithDependenciesToInstall] =
    useState<AppWithDependencies | null>(null);
  /** uninstall app with dependents modal state */
  const [appWithDependentsToUninstall, setAppWithDependentsToUninstall] =
    useState<AppWithDependents | null>(null);

  /** open error modal each time a new error appears in state.currentError */
  useEffect(() => {
    if (currentError) {
      setError(currentError.error);
    }
  }, [setError, currentError]);

  // send informations to main router in order to lock navigation
  useLockNavigation(pendingInstalls, setQuitManagerAction, navigation);

  // Save last seen device
  useEffect(() => {
    const dmi = {
      modelId: device.modelId,
      deviceInfo,
      apps: state.installed.map(({ name, version }) => ({
        name,
        version,
      })),
    };
    reduxDispatch(setLastSeenDeviceInfo(dmi));
  }, [device, state.installed, deviceInfo, reduxDispatch]);

  const installedApps = useMemo(() => state.installed.map(({ name }) => name), [state.installed]);

  /**
   * Resets the navigation params in order to unlock navigation
   * then trigger caught navigation action
   */
  const quitManager = useCallback(() => {
    if (quitManagerAction) {
      navigation.dispatch(quitManagerAction);
      setQuitManagerAction(null);
    }
  }, [quitManagerAction, setQuitManagerAction, navigation]);

  const closeErrorModal = useCallback(() => setError(null), [setError]);

  const closeQuitManagerModal = useCallback(
    () => setQuitManagerAction(null),
    [setQuitManagerAction],
  );

  const resetStorageWarning = useCallback(() => setStorageWarning(null), [setStorageWarning]);

  const onCloseFirmwareUpdate = useCallback(
    (restoreApps?: boolean) => {
      setIsFirmwareUpdateOpen(false);
      refreshDeviceInfo();

      // removes the firmwareUpdate param from the stack navigation so we don't open the modal again
      // if the user comes back to this page within the stack
      navigation.dispatch(state => {
        const routes = state.routes.map(route => ({
          ...route,
          params: { ...route.params, firmwareUpdate: false },
        }));
        return CommonActions.reset({ ...state, routes });
      });
      if (restoreApps) {
        // we renavigate to the manager to force redetection of the apps and restore apps if needed
        navigation.replace(ScreenName.Manager, {
          device,
          appsToRestore: installedApps,
          firmwareUpdate: false,
        });
      }
    },
    [device, installedApps, navigation, refreshDeviceInfo],
  );

  const onBackFromNewUpdateUx = useCallback(
    (updateState: UpdateStep) => {
      // If the fw update was completed or not yet started, we know the device in a correct state
      if (["start", "completed"].includes(updateState)) {
        navigation.replace(ScreenName.Manager, {
          device,
        });
        return;
      }

      // Otherwise navigating back to the main manager screen without settings a device
      // so it does not try to automatically connect to the device while it
      // might still be on an unknown state because the fw update was just stopped
      navigation.replace(ScreenName.Manager);
    },
    [device, navigation],
  );

  const appsInstallUninstallWithDependenciesContextValue = useMemo(
    () => ({
      setAppWithDependenciesToInstall,
      setAppWithDependentsToUninstall,
    }),
    [],
  );

  const onCloseInstallAppDependenciesModal = useCallback(() => {
    setAppWithDependenciesToInstall(null);
  }, []);

  const installAppWithDependencies = useCallback(() => {
    if (appWithDependenciesToInstall) {
      reduxDispatch(setHasInstalledAnyApp(true));
      dispatch({ type: "install", name: appWithDependenciesToInstall?.app.name });
    }
    onCloseInstallAppDependenciesModal();
  }, [appWithDependenciesToInstall, onCloseInstallAppDependenciesModal, reduxDispatch, dispatch]);

  const onCloseUninstallAppDependenciesModal = useCallback(() => {
    setAppWithDependentsToUninstall(null);
  }, []);

  const uninstallAppsWithDependents = useCallback(() => {
    if (appWithDependentsToUninstall) {
      dispatch({ type: "uninstall", name: appWithDependentsToUninstall?.app.name });
    }
    onCloseUninstallAppDependenciesModal();
  }, [appWithDependentsToUninstall, dispatch, onCloseUninstallAppDependenciesModal]);

  return (
    <>
      <TrackScreen
        category="Manager"
        name="AppsList"
        deviceModelId={modelId}
        deviceVersion={deviceInfo.version}
        appLength={result ? result.installed.length : 0}
      />
      <SyncSkipUnderPriority priority={100} />
      <AppsInstallUninstallWithDependenciesContextProvider
        value={appsInstallUninstallWithDependenciesContextValue}
      >
        <AppsScreen
          state={state}
          dispatch={dispatch}
          device={device}
          navigation={navigation}
          setStorageWarning={setStorageWarning}
          deviceId={deviceId}
          initialDeviceName={deviceName}
          pendingInstalls={pendingInstalls}
          deviceInfo={deviceInfo}
          searchQuery={searchQuery}
          updateModalOpened={updateModalOpened}
          optimisticState={optimisticState}
          tab={tab}
          result={result}
          onLanguageChange={refreshDeviceInfo}
          onBackFromUpdate={onBackFromNewUpdateUx}
        />
      </AppsInstallUninstallWithDependenciesContextProvider>
      <GenericErrorBottomModal error={error} onClose={closeErrorModal} />
      <QuitManagerModal
        isOpened={!!quitManagerAction}
        onConfirm={quitManager}
        onClose={closeQuitManagerModal}
        installQueue={installQueue}
        uninstallQueue={uninstallQueue}
      />
      <StorageWarningModal warning={storageWarning} onClose={resetStorageWarning} />
      <InstallAppDependenciesModal
        appWithDependenciesToInstall={appWithDependenciesToInstall}
        onClose={onCloseInstallAppDependenciesModal}
        installAppWithDependencies={installAppWithDependencies}
      />
      <UninstallAppDependenciesModal
        appWithDependentsToUninstall={appWithDependentsToUninstall}
        onClose={onCloseUninstallAppDependenciesModal}
        uninstallAppsWithDependents={uninstallAppsWithDependents}
      />
      <FirmwareUpdateScreen
        device={device}
        deviceInfo={deviceInfo}
        isOpen={isFirmwareUpdateOpen}
        onClose={onCloseFirmwareUpdate}
        hasAppsToRestore={Boolean(appsToRestore?.length)}
      />
    </>
  );
};

export default memo<NavigationProps>(Manager);

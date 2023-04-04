import React, { useState, useCallback, useEffect, memo, useMemo } from "react";
import { useDispatch } from "react-redux";
import { from } from "rxjs";
import type { App } from "@ledgerhq/types-live";
import { predictOptimisticState } from "@ledgerhq/live-common/apps/index";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import { CommonActions } from "@react-navigation/native";
import getDeviceInfo from "@ledgerhq/live-common/hw/getDeviceInfo";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import isFirmwareUpdateVersionSupported from "@ledgerhq/live-common/hw/isFirmwareUpdateVersionSupported";
import useLatestFirmware from "@ledgerhq/live-common/hooks/useLatestFirmware";
import { useApps } from "./shared";
import AppsScreen from "./AppsScreen";
import GenericErrorBottomModal from "../../components/GenericErrorBottomModal";
import { TrackScreen } from "../../analytics";
import QuitManagerModal from "./Modals/QuitManagerModal";
import StorageWarningModal from "./Modals/StorageWarningModal";
import AppDependenciesModal from "./Modals/AppDependenciesModal";
import UninstallDependenciesModal from "./Modals/UninstallDependenciesModal";
import { useLockNavigation } from "../../components/RootNavigator/CustomBlockRouterNavigator";
import { setLastSeenDeviceInfo } from "../../actions/settings";
import { ScreenName } from "../../const";
import FirmwareUpdateScreen from "../../components/FirmwareUpdate";
import { ManagerNavigatorStackParamList } from "../../components/RootNavigator/types/ManagerNavigator";
import {
  BaseComposite,
  StackNavigatorProps,
} from "../../components/RootNavigator/types/helpers";

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

  const refreshDeviceInfo = useCallback(() => {
    withDevice(deviceId)(transport => from(getDeviceInfo(transport)))
      .toPromise()
      .then(deviceInfo => {
        navigation.setParams({ deviceInfo });
      });
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
  const [appInstallWithDependencies, setAppInstallWithDependencies] = useState<{
    app: App;
    dependencies: App[];
  } | null>(null);
  /** uninstall app with dependencies modal state */
  const [appUninstallWithDependencies, setAppUninstallWithDependencies] =
    useState<{ dependents: App[]; app: App } | null>(null);

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

  const installedApps = useMemo(
    () => state.installed.map(({ name }) => name),
    [state.installed],
  );

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

  const resetAppInstallWithDependencies = useCallback(() => {
    setAppInstallWithDependencies(null);
  }, [setAppInstallWithDependencies]);

  const resetAppUninstallWithDependencies = useCallback(() => {
    setAppUninstallWithDependencies(null);
  }, [setAppUninstallWithDependencies]);

  const closeQuitManagerModal = useCallback(
    () => setQuitManagerAction(null),
    [setQuitManagerAction],
  );

  const resetStorageWarning = useCallback(
    () => setStorageWarning(null),
    [setStorageWarning],
  );

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
      <AppsScreen
        state={state}
        dispatch={dispatch}
        device={device}
        navigation={navigation}
        setAppInstallWithDependencies={setAppInstallWithDependencies}
        setAppUninstallWithDependencies={setAppUninstallWithDependencies}
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
      />
      <GenericErrorBottomModal error={error} onClose={closeErrorModal} />
      <QuitManagerModal
        isOpened={!!quitManagerAction}
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
        appInstallWithDependencies={appInstallWithDependencies!}
        onClose={resetAppInstallWithDependencies}
        dispatch={dispatch}
      />
      <UninstallDependenciesModal
        appUninstallWithDependencies={appUninstallWithDependencies!}
        onClose={resetAppUninstallWithDependencies}
        dispatch={dispatch}
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

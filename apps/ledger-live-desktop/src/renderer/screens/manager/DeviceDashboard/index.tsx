import React, { memo, useRef, useState, useCallback, useMemo, useEffect } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { App, DeviceInfo, FirmwareUpdateContext } from "@ledgerhq/types-live";
import { Exec, InstalledItem, ListAppsResult } from "@ledgerhq/live-common/apps/types";
import {
  predictOptimisticState,
  reducer,
  isIncompleteState,
  distribute,
} from "@ledgerhq/live-common/apps/index";
import { useAppsRunner, useAppsSections } from "@ledgerhq/live-common/apps/react";
import NavigationGuard from "~/renderer/components/NavigationGuard";
import Quit from "~/renderer/icons/Quit";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import AppList from "./AppsList";
import DeviceInformationSummary from "./DeviceInformationSummary";
import ProviderWarning from "./ProviderWarning";
import AppDepsInstallModal from "./AppDepsInstallModal";
import CommunityAppInstallModal from "./CommunityAppInstallModal";
import { isCommunityApp } from "@ledgerhq/live-common/apps/developer";
import { useFeature } from "@features/platform-feature-flags";
import AppDepsUnInstallModal from "./AppDepsUnInstallModal";
import ErrorModal from "~/renderer/modals/ErrorModal/index";
import {
  addNewDeviceModel,
  clearLastSeenCustomImage,
  setHasInstalledApps,
  setLastSeenDeviceInfo,
} from "~/renderer/actions/settings";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import {
  hasInstalledAppsSelector,
  lastSeenCustomImageSelector,
} from "~/renderer/reducers/settings";
import LedgerSyncEntryPoint from "LLD/features/LedgerSyncEntryPoints";
import { LNSUpsellBanner } from "LLD/features/LNSUpsell";
import { EntryPoint } from "LLD/features/LedgerSyncEntryPoints/types";
import manager from "@ledgerhq/live-common/manager/index";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  ${p => p.theme.animations.fadeIn}
`;

const QuitIconWrapper = styled.div`
  display: flex;
  align-items: center;
  align-content: center;
  justify-content: center;
  width: ${p => p.theme.space[8]}px;
  height: ${p => p.theme.space[8]}px;
  color: ${p => p.theme.colors.primary.c80};
  background-color: ${p => p.theme.colors.opacityDefault.c10};
  border-radius: 100%;
  margin: ${p => -p.theme.space[5]}px auto ${p => p.theme.space[6]}px auto;
`;

type Props = {
  device: Device;
  firmware: FirmwareUpdateContext | undefined | null;
  deviceInfo: DeviceInfo & { languageId: number };
  result: ListAppsResult;
  onRefreshDeviceInfo: () => void;
  setPreventResetOnDeviceChange: (value: boolean) => void;
  exec: Exec;
  renderFirmwareUpdateBanner?: (a: {
    disableFirmwareUpdate: boolean;
    installed: InstalledItem[];
  }) => React.ReactNode;
  appsToRestore?: string[];
}; // workaround until we fix LL-4458

const shouldBlockNavigation = (l: { pathname: string }) => l.pathname !== "/manager";

/**
 * Component meant to be displayed on an entire page.
 * Renders all the main information available about the device,
 * a catalog of apps and the apps installed.
 */
const DeviceDashboard = ({
  firmware,
  deviceInfo,
  onRefreshDeviceInfo,
  setPreventResetOnDeviceChange,
  result,
  exec,
  renderFirmwareUpdateBanner,
  appsToRestore = [],
  device,
}: Props) => {
  const { t } = useTranslation();
  const { deviceName } = result;
  const [state, dispatch] = useAppsRunner(result, exec, appsToRestore);
  const optimisticState = useMemo(() => predictOptimisticState(state), [state]);
  const [appInstallDep, setAppInstallDep] = useState<{ app: App; dependencies: App[] } | undefined>(
    undefined,
  );

  /** community app waiting for the user to accept the disclaimer before installing */
  const [communityAppToInstall, setCommunityAppToInstall] = useState<App | undefined>(undefined);
  const { enabled: isDeveloperInfoEnabled } = useFeature("myLedgerDisplayAppDeveloperName") || {};

  const [appUninstallDep, setAppUninstallDep] = useState<
    { dependents: App[]; app: App } | undefined
  >(undefined);
  const isIncomplete = isIncompleteState(state);
  const hasInstalledApps = useSelector(hasInstalledAppsSelector);
  const reduxDispatch = useDispatch();
  const lastSeenCustomImage = useSelector(lastSeenCustomImageSelector);
  const isFirstCustomImageUpdate = useRef<boolean>(true);

  useEffect(() => {
    if (isFirstCustomImageUpdate.current) {
      isFirstCustomImageUpdate.current = false;
    } else {
      dispatch({
        type: "setCustomImage",
        lastSeenCustomImage,
      });
    }
  }, [dispatch, lastSeenCustomImage]);

  const { installQueue, uninstallQueue, currentError } = state;
  const jobInProgress = installQueue.length > 0 || uninstallQueue.length > 0;

  const distribution = useMemo(() => {
    const newState = installQueue.length
      ? predictOptimisticState(
          reducer(state, {
            type: "install",
            name: installQueue[0],
          }),
        )
      : state;
    return distribute(newState);
  }, [state, installQueue]);

  /** Installs an app; a community app first shows the disclaimer, which is always the last step. */
  const installApp = useCallback(
    (app: App) => {
      if (isDeveloperInfoEnabled && isCommunityApp(app)) setCommunityAppToInstall(app);
      else dispatch({ type: "install", name: app.name });
    },
    [dispatch, isDeveloperInfoEnabled],
  );

  const onCloseCommunityAppInstallModal = useCallback(
    () => setCommunityAppToInstall(undefined),
    [],
  );

  const onCloseDepsInstallModal = useCallback(
    () => setAppInstallDep(undefined),
    [setAppInstallDep],
  );

  const onCloseDepsUninstallModal = useCallback(
    () => setAppUninstallDep(undefined),
    [setAppUninstallDep],
  );

  const installState =
    installQueue.length > 0 ? (uninstallQueue.length > 0 ? "update" : "install") : "uninstall";

  const onCloseError = useCallback(() => {
    dispatch({
      type: "recover",
    });
  }, [dispatch]);

  useEffect(() => {
    if (state.installed.length && !hasInstalledApps) {
      reduxDispatch(setHasInstalledApps(true));
    }
  }, [state.installed.length, reduxDispatch, hasInstalledApps]);

  // Save last seen device
  useEffect(() => {
    const lastSeenDevice = {
      modelId: device.modelId,
      deviceInfo,
      apps: state.installed.map(({ name, version }) => ({
        name,
        version,
      })),
    };
    reduxDispatch(
      setLastSeenDeviceInfo({
        lastSeenDevice,
        latestFirmware: firmware,
      }),
    );
    reduxDispatch(addNewDeviceModel({ deviceModelId: lastSeenDevice.modelId }));
  }, [device, state.installed, deviceInfo, reduxDispatch, firmware]);

  useEffect(() => {
    // Not ideal but we have no concept of device ids so we can consider
    // an empty custom image size an indicator of not having an image set.
    // If this is troublesome we'd have to react by asking the device directly.
    if (result.customImageBlocks === 0) reduxDispatch(clearLastSeenCustomImage());
  }, [reduxDispatch, result.customImageBlocks]);

  const disableFirmwareUpdate = state.installQueue.length > 0 || state.uninstallQueue.length > 0;

  const [hasCustomLockScreen, setHasCustomLockScreen] = useState(result.customImageBlocks !== 0);
  const { update } = useAppsSections(state, {
    query: "",
    appFilter: "all",
    sort: {
      type: "marketcap",
      order: "desc",
    },
  });
  const isFirmwareDeprecated = manager.firmwareUnsupported(device.modelId, deviceInfo);

  return (
    <>
      {renderFirmwareUpdateBanner
        ? renderFirmwareUpdateBanner({
            disableFirmwareUpdate,
            installed: state.installed,
          })
        : null}
      <Container>
        {currentError && (
          <ErrorModal isOpened={!!currentError} error={currentError.error} onClose={onCloseError} />
        )}
        <NavigationGuard
          shouldBlockNavigation={shouldBlockNavigation}
          analyticsName="ManagerGuardModal"
          when={jobInProgress}
          subTitle={
            <>
              <QuitIconWrapper>
                <Quit size={30} />
              </QuitIconWrapper>
              {t(`errors.ManagerQuitPage.${installState}.title`)}
            </>
          }
          desc={t(`errors.ManagerQuitPage.${installState}.description`)}
          confirmText={t(`errors.ManagerQuitPage.${installState}.stay`)}
          cancelText={t(`errors.ManagerQuitPage.quit`)}
          centered
        />
        <DeviceInformationSummary
          uninstallQueue={uninstallQueue}
          installQueue={installQueue}
          distribution={distribution}
          deviceModel={state.deviceModel}
          onRefreshDeviceInfo={onRefreshDeviceInfo}
          setPreventResetOnDeviceChange={setPreventResetOnDeviceChange}
          deviceInfo={deviceInfo}
          device={device}
          deviceName={deviceName}
          isIncomplete={isIncomplete}
          hasCustomLockScreen={hasCustomLockScreen}
          setHasCustomLockScreen={setHasCustomLockScreen}
        />
        <ProviderWarning />
        {!firmware && !isFirmwareDeprecated && update.length === 0 ? (
          <>
            <LedgerSyncEntryPoint entryPoint={EntryPoint.manager} />
            <LNSUpsellBanner location="manager" />
          </>
        ) : null}
        <AppList
          optimisticState={optimisticState}
          state={state}
          dispatch={dispatch}
          isIncomplete={isIncomplete}
          setAppInstallDep={setAppInstallDep}
          setAppUninstallDep={setAppUninstallDep}
          installApp={installApp}
          t={t}
        />
        <AppDepsInstallModal
          app={appInstallDep && appInstallDep.app}
          dependencies={appInstallDep && appInstallDep.dependencies}
          dispatch={dispatch}
          installApp={installApp}
          onClose={onCloseDepsInstallModal}
        />
        <CommunityAppInstallModal
          app={communityAppToInstall}
          dispatch={dispatch}
          onClose={onCloseCommunityAppInstallModal}
        />
        <AppDepsUnInstallModal
          app={appUninstallDep && appUninstallDep.app}
          dependents={appUninstallDep && appUninstallDep.dependents}
          dispatch={dispatch}
          onClose={onCloseDepsUninstallModal}
        />
      </Container>
    </>
  );
};
export default memo<Props>(DeviceDashboard);

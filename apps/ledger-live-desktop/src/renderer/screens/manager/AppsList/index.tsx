import React, { memo, useRef, useState, useCallback, useMemo, useEffect } from "react";
import styled from "styled-components";
import { log } from "@ledgerhq/logs";
import { withTranslation } from "react-i18next";
import { App, DeviceInfo, FirmwareUpdateContext } from "@ledgerhq/types-live";
import { Exec, InstalledItem, ListAppsResult } from "@ledgerhq/live-common/apps/types";
import {
  predictOptimisticState,
  reducer,
  isIncompleteState,
  distribute,
} from "@ledgerhq/live-common/apps/index";
import { useAppsRunner } from "@ledgerhq/live-common/apps/react";
import NavigationGuard from "~/renderer/components/NavigationGuard";
import Quit from "~/renderer/icons/Quit";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import AppList from "./AppsList";
import DeviceStorage from "../DeviceStorage/index";
import ProviderWarning from "../ProviderWarning";
import AppDepsInstallModal from "./AppDepsInstallModal";
import AppDepsUnInstallModal from "./AppDepsUnInstallModal";
import ErrorModal from "~/renderer/modals/ErrorModal/index";
import {
  clearLastSeenCustomImage,
  setHasInstalledApps,
  setLastSeenDeviceInfo,
} from "~/renderer/actions/settings";
import { useDispatch, useSelector } from "react-redux";
import {
  hasInstalledAppsSelector,
  lastSeenCustomImageSelector,
} from "~/renderer/reducers/settings";
import { TFunction } from "i18next";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  animation: ${p => p.theme.animations.fadeIn};
`;

const QuitIconWrapper = styled.div`
  display: flex;
  align-items: center;
  align-content: center;
  justify-content: center;
  width: ${p => p.theme.space[8]}px;
  height: ${p => p.theme.space[8]}px;
  color: ${p => p.theme.colors.palette.primary.main};
  background-color: ${p => p.theme.colors.palette.action.hover};
  border-radius: 100%;
  margin: ${p => -p.theme.space[5]}px auto ${p => p.theme.space[6]}px auto;
`;

type Props = {
  device: Device;
  firmware: FirmwareUpdateContext | undefined | null;
  deviceInfo: DeviceInfo & { languageId: number };
  result: ListAppsResult;
  onRefreshDeviceInfo: () => void;
  exec: Exec;
  t: TFunction;
  render?: (a: { disableFirmwareUpdate: boolean; installed: InstalledItem[] }) => React.ReactNode;
  appsToRestore?: string[];
}; // workaround until we fix LL-4458

const shouldBlockNavigation = (l: { pathname: string }) => l.pathname !== "/manager";
const AppsList = ({
  firmware,
  deviceInfo,
  onRefreshDeviceInfo,
  result,
  exec,
  t,
  render,
  appsToRestore = [],
  device,
}: Props) => {
  const { deviceName } = result;
  const [state, dispatch] = useAppsRunner(result, exec, appsToRestore);
  const optimisticState = useMemo(() => predictOptimisticState(state), [state]);
  const [appInstallDep, setAppInstallDep] = useState<{ app: App; dependencies: App[] } | undefined>(
    undefined,
  );
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
  const onCloseDepsInstallModal = useCallback(() => setAppInstallDep(undefined), [
    setAppInstallDep,
  ]);
  const onCloseDepsUninstallModal = useCallback(() => setAppUninstallDep(undefined), [
    setAppUninstallDep,
  ]);
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
  }, [device, state.installed, deviceInfo, reduxDispatch, firmware]);

  useEffect(() => {
    // Not ideal but we have no concept of device ids so we can consider
    // an empty custom image size an indicator of not having an image set.
    // If this is troublesome we'd have to react by asking the device directly.
    if (state.customImageBlocks === 0) reduxDispatch(clearLastSeenCustomImage());
  }, [reduxDispatch, state.customImageBlocks]);

  const disableFirmwareUpdate = state.installQueue.length > 0 || state.uninstallQueue.length > 0;
  return (
    <>
      {render
        ? render({
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
        <DeviceStorage
          uninstallQueue={uninstallQueue}
          installQueue={installQueue}
          distribution={distribution}
          deviceModel={state.deviceModel}
          onRefreshDeviceInfo={onRefreshDeviceInfo}
          deviceInfo={deviceInfo}
          device={device}
          deviceName={deviceName}
          isIncomplete={isIncomplete}
          firmware={firmware}
        />
        <ProviderWarning />
        <AppList
          optimisticState={optimisticState}
          state={state}
          dispatch={dispatch}
          isIncomplete={isIncomplete}
          setAppInstallDep={setAppInstallDep}
          setAppUninstallDep={setAppUninstallDep}
          t={t}
        />
        <AppDepsInstallModal
          app={appInstallDep && appInstallDep.app}
          dependencies={appInstallDep && appInstallDep.dependencies}
          dispatch={dispatch}
          onClose={onCloseDepsInstallModal}
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
const AppsListScreen = memo<Props>(AppsList);
export default withTranslation()(AppsListScreen);

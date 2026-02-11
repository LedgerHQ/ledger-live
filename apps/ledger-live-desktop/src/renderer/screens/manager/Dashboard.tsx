import React, { useMemo, useState, useEffect, useRef, useContext } from "react";
import { useSelector } from "LLD/hooks/redux";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { execWithTransport } from "@ledgerhq/live-common/device/use-cases/execWithTransport";
import { DeviceInfo, FirmwareUpdateContext } from "@ledgerhq/types-live";
import { ExecArgs, ListAppsResult } from "@ledgerhq/live-common/apps/types";
import { distribute, initState } from "@ledgerhq/live-common/apps/logic";
import { mockExecWithInstalledContext } from "@ledgerhq/live-common/apps/mock";
import { getLatestFirmwareForDeviceUseCase } from "@ledgerhq/live-common/device/use-cases/getLatestFirmwareForDeviceUseCase";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import DeviceDashboard from "./DeviceDashboard";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import FirmwareUpdate from "./FirmwareUpdate";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { osUpdateRequestedSelector } from "~/renderer/reducers/manager";
import { getEnv } from "@ledgerhq/live-env";
import { context as drawerContext } from "~/renderer/drawers/Provider";
import { useFeature, useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { useAppDataStorageProvider } from "~/renderer/hooks/storage-provider/useAppDataStorage";
import { useLocation } from "react-router";

type Props = {
  device: Device;
  deviceInfo: DeviceInfo & { languageId: number };
  result: ListAppsResult | undefined | null;
  onRefreshDeviceInfo: () => void;
  onReset: (b?: string[] | null, a?: boolean | null) => void;
  appsToRestore: string[];
};

const Dashboard = ({
  device,
  deviceInfo,
  result,
  onReset,
  appsToRestore,
  onRefreshDeviceInfo,
}: Props) => {
  const appsBackupEnabled = useFeature("enableAppsBackup");
  const { search } = useLocation();
  const storage = useAppDataStorageProvider();
  const { isEnabled: isWallet40Enabled } = useWalletFeaturesConfig("desktop");
  const { state: drawerState } = useContext(drawerContext);
  const currentDevice = useSelector(getCurrentDevice);
  const [preventResetOnDeviceChange, setPreventResetOnDeviceChange] = useState(false);
  const deviceChangedWhenResetPrevented = useRef(false);
  const [firmware, setFirmware] = useState<FirmwareUpdateContext | null>(null);
  const [firmwareError, setFirmwareError] = useState(null);
  const osUpdateRequested = useSelector(osUpdateRequestedSelector);
  const params = new URLSearchParams(search || "");
  const openFirmwareUpdate = isWallet40Enabled
    ? osUpdateRequested
    : params.get("firmwareUpdate") === "true";

  useEffect(() => {
    getLatestFirmwareForDeviceUseCase(deviceInfo).then(setFirmware, setFirmwareError);
  }, [deviceInfo]);

  // on disconnect, go back to connect
  useEffect(() => {
    // if there is no device, and a reset is currently prevented,
    // we need to perform the reset when it becomes possible
    if (!currentDevice && preventResetOnDeviceChange) {
      deviceChangedWhenResetPrevented.current = true;
    }

    // Don't reset now if a drawer is open and reset is prevented,
    // for example, during firmware update or device name change
    if (preventResetOnDeviceChange && drawerState.open) {
      return;
    }

    // We need to reset under the following conditions:
    // - If a device is unplugged and reset is not prevented
    // - If a disconnection happens during a reset prevention period
    //   and the drawer is currently closed
    if (!currentDevice || deviceChangedWhenResetPrevented.current) {
      onReset(appsToRestore);
    }
  }, [appsToRestore, onReset, preventResetOnDeviceChange, currentDevice, drawerState.open]);

  const exec = useMemo(
    () =>
      getEnv("MOCK")
        ? mockExecWithInstalledContext(result?.installed || [])
        : ({ app, appOp, targetId, skipAppDataBackup }: ExecArgs) =>
            withDevice(device.deviceId)(transport =>
              execWithTransport(
                transport,
                appsBackupEnabled?.enabled,
              )({
                appOp,
                targetId,
                app,
                modelId: device.modelId,
                storage,
                skipAppDataBackup,
              }),
            ),
    [device, result, appsBackupEnabled, storage],
  );

  const appsStoragePercentage = useMemo(() => {
    if (!result) return 0;
    const d = distribute(initState(result));
    return d.totalAppsBytes / d.appsSpaceBytes;
  }, [result]);
  return (
    <Box flow={4} selectable>
      <TrackPage
        category="Manager"
        name="Dashboard"
        deviceModelId={device.modelId}
        deviceVersion={deviceInfo.version}
        appsStoragePercentage={appsStoragePercentage}
        appLength={result ? result.installed.length : 0}
      />
      {result ? (
        <DeviceDashboard
          device={device}
          deviceInfo={deviceInfo}
          onRefreshDeviceInfo={onRefreshDeviceInfo}
          setPreventResetOnDeviceChange={setPreventResetOnDeviceChange}
          firmware={firmware}
          result={result}
          appsToRestore={appsToRestore}
          exec={exec}
          renderFirmwareUpdateBanner={({ disableFirmwareUpdate, installed }) => (
            <FirmwareUpdate
              device={device}
              deviceInfo={deviceInfo}
              firmware={firmware}
              error={firmwareError}
              setPreventResetOnDeviceChange={setPreventResetOnDeviceChange}
              disableFirmwareUpdate={disableFirmwareUpdate}
              installed={installed}
              onReset={onReset}
              openFirmwareUpdate={openFirmwareUpdate}
            />
          )}
        />
      ) : (
        <FirmwareUpdate
          device={device}
          deviceInfo={deviceInfo}
          firmware={firmware}
          error={firmwareError}
          setPreventResetOnDeviceChange={setPreventResetOnDeviceChange}
          onReset={onReset}
          openFirmwareUpdate={openFirmwareUpdate}
        />
      )}
    </Box>
  );
};
export default Dashboard;

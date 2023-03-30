import React, { useMemo, useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import manager from "@ledgerhq/live-common/manager/index";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { execWithTransport } from "@ledgerhq/live-common/apps/hw";
import { DeviceInfo } from "@ledgerhq/types-live";
import { ListAppsResult } from "@ledgerhq/live-common/apps/types";
import { distribute, initState } from "@ledgerhq/live-common/apps/logic";
import { mockExecWithInstalledContext } from "@ledgerhq/live-common/apps/mock";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import AppsList from "./AppsList";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import FirmwareUpdate from "./FirmwareUpdate";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { getEnv } from "@ledgerhq/live-common/env";
import { useLocation } from "react-router";
type Props = {
  device: Device;
  deviceInfo: DeviceInfo;
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
  const { search } = useLocation();
  const { t } = useTranslation();
  const currentDevice = useSelector(getCurrentDevice);
  const [firmwareUpdateOpened, setFirmwareUpdateOpened] = useState(false);
  const hasDisconnectedDuringFU = useRef(false);
  const [firmware, setFirmware] = useState(null);
  const [firmwareError, setFirmwareError] = useState(null);
  const params = new URLSearchParams(search || "");
  const openFirmwareUpdate = params.get("firmwareUpdate") === "true";
  useEffect(() => {
    manager.getLatestFirmwareForDevice(deviceInfo).then(setFirmware, setFirmwareError);
  }, [deviceInfo]);

  // on disconnect, go back to connect
  useEffect(() => {
    // if there is no device but firmware update still happening
    if (!currentDevice && firmwareUpdateOpened) {
      hasDisconnectedDuringFU.current = true; // set disconnected to true for a later onReset()
    }

    // we must not reset during firmware update
    if (firmwareUpdateOpened) {
      return;
    }

    // we need to reset only if device is unplugged OR a disconnection happened during firmware update
    if (!currentDevice || hasDisconnectedDuringFU.current) {
      onReset([], firmwareUpdateOpened);
    }
  }, [onReset, firmwareUpdateOpened, currentDevice]);
  const exec = useMemo(
    () =>
      getEnv("MOCK")
        ? mockExecWithInstalledContext(result?.installed || [])
        : (appOp, targetId, app) =>
            withDevice(device.deviceId)(transport =>
              execWithTransport(transport)(appOp, targetId, app),
            ),
    [device, result],
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
        <AppsList
          device={device}
          deviceInfo={deviceInfo}
          onRefreshDeviceInfo={onRefreshDeviceInfo}
          firmware={firmware}
          result={result}
          appsToRestore={appsToRestore}
          exec={exec}
          render={({ disableFirmwareUpdate, installed }) => (
            <FirmwareUpdate
              t={t}
              device={device}
              deviceInfo={deviceInfo}
              firmware={firmware}
              error={firmwareError}
              setFirmwareUpdateOpened={setFirmwareUpdateOpened}
              disableFirmwareUpdate={disableFirmwareUpdate}
              installed={installed}
              onReset={onReset}
              openFirmwareUpdate={openFirmwareUpdate}
            />
          )}
        />
      ) : (
        <FirmwareUpdate
          t={t}
          device={device}
          deviceInfo={deviceInfo}
          firmware={firmware}
          error={firmwareError}
          setFirmwareUpdateOpened={setFirmwareUpdateOpened}
          onReset={onReset}
          openFirmwareUpdate={openFirmwareUpdate}
        />
      )}
    </Box>
  );
};
export default Dashboard;

// @flow
import React, { useState, useEffect } from "react";
import Select from "react-select";
import manager, { getProviderId } from "@ledgerhq/live-common/lib/manager";
import ManagerAPI from "@ledgerhq/live-common/lib/api/Manager";
import type {
  ApplicationVersion,
  DeviceInfo,
} from "@ledgerhq/live-common/lib/types/manager";

export type DataTypeApplication = {
  type: "application",
};

type Props = {
  value: ?ApplicationVersion,
  onChange: (?ApplicationVersion) => void,
  dependencies: {
    deviceInfo: DeviceInfo,
  },
};

const ApplicationField = ({
  value,
  onChange,
  dependencies: { deviceInfo },
}: Props) => {
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    if (!deviceInfo) return;
    const provider = getProviderId(deviceInfo);
    const deviceVersionP = ManagerAPI.getDeviceVersion(
      deviceInfo.targetId,
      provider
    );

    const firmwareDataP = deviceVersionP.then((deviceVersion) =>
      ManagerAPI.getCurrentFirmware({
        deviceId: deviceVersion.id,
        version: deviceInfo.version,
        provider,
      })
    );

    const latestFirmwareForDeviceP = manager.getLatestFirmwareForDevice(
      deviceInfo
    );

    Promise.all([firmwareDataP, latestFirmwareForDeviceP]).then(
      ([firmwareData, updateAvailable]) => ({
        ...firmwareData,
        updateAvailable,
      })
    );

    const applicationsByDeviceP = Promise.all([
      deviceVersionP,
      firmwareDataP,
    ]).then(([deviceVersion, firmwareData]) =>
      ManagerAPI.applicationsByDevice({
        provider,
        current_se_firmware_final_version: firmwareData.id,
        device_version: deviceVersion.id,
      })
    );

    applicationsByDeviceP.then(setApplications);
  }, [deviceInfo]);

  return (
    <Select
      value={value}
      options={applications}
      onChange={onChange}
      placeholder={applications.length ? "Select an app" : "Loading..."}
      getOptionLabel={(app) => `${app.name} (${app.version})`}
      getOptionValue={(app) => app.id}
    />
  );
};

export default ApplicationField;

import React, { useState, useEffect } from "react";
import Select from "react-select";
import type { App, DeviceInfo } from "@ledgerhq/types-live";
import { getAppsCatalogForDevice } from "@ledgerhq/live-common/device/use-cases/getAppsCatalogForDevice";
import { mapApplicationV2ToApp } from "@ledgerhq/live-common/apps/polyfill";

export type DataTypeApplication = {
  type: "application";
};

type Props = {
  value?: App | null;
  onChange: (_: App | null) => void;
  dependencies: {
    deviceInfo: DeviceInfo;
  };
};

const ApplicationField = ({ value, onChange, dependencies: { deviceInfo } }: Props) => {
  const [applications, setApplications] = useState<App[]>([]);

  useEffect(() => {
    if (!deviceInfo) return;

    getAppsCatalogForDevice(deviceInfo).then(apps =>
      setApplications(apps.map(mapApplicationV2ToApp)),
    );
  }, [deviceInfo]);

  return (
    <Select
      value={value}
      options={applications}
      onChange={onChange}
      placeholder={applications.length ? "Select an app" : "Loading..."}
      getOptionLabel={app => `${app.name} (${app.version})`}
      getOptionValue={app => String(app.id)}
    />
  );
};

export default ApplicationField;

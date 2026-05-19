import React from "react";
import type { DeviceConnectionComponent } from "@ledgerhq/device-intent";
import { DeviceConnectionComponentLWMView } from "./DeviceConnectionComponentLWMView";
import { useDeviceConnectionComponentLWMViewModel } from "./useDeviceConnectionComponentLWMViewModel";

const DeviceConnectionComponentLWM: DeviceConnectionComponent = ({
  deviceConnectionParams: _deviceConnectionParams,
  onConnected,
}) => {
  const viewModel = useDeviceConnectionComponentLWMViewModel({
    onConnected,
  });

  return <DeviceConnectionComponentLWMView {...viewModel} />;
};

export default DeviceConnectionComponentLWM;

import React from "react";
import type { DeviceConnectionComponent } from "@ledgerhq/device-intent";
import { DeviceConnectionComponentLWMView } from "./DeviceConnectionComponentLWMView";
import { useDeviceConnectionComponentLWMViewModel } from "./useDeviceConnectionComponentLWMViewModel";

const DeviceConnectionComponentLWM: DeviceConnectionComponent = ({
  deviceConnectionParams: _deviceConnectionParams,
  onConnected,
  onError,
}) => {
  const viewModel = useDeviceConnectionComponentLWMViewModel({
    onConnected,
    onError,
  });

  return <DeviceConnectionComponentLWMView {...viewModel} />;
};

export default DeviceConnectionComponentLWM;

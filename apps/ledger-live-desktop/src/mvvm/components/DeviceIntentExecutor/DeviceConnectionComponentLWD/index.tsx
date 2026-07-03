import React from "react";
import type { DeviceConnectionComponent } from "@ledgerhq/device-intent";

import { DeviceConnectionComponentLWDView } from "./DeviceConnectionComponentLWDView";
import { useDeviceConnectionComponentLWDViewModel } from "./useDeviceConnectionComponentLWDViewModel";

const DeviceConnectionComponentLWD: DeviceConnectionComponent = ({
  deviceConnectionParams,
  onConnected,
}) => {
  const viewModel = useDeviceConnectionComponentLWDViewModel({
    deviceConnectionParams,
    onConnected,
  });

  return <DeviceConnectionComponentLWDView {...viewModel} />;
};

export default DeviceConnectionComponentLWD;

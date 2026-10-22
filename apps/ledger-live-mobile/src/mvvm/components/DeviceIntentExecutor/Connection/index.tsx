import React from "react";
import type { DeviceConnectionComponent } from "@features/platform-device-intent";
import { ConnectionView } from "./ConnectionView";
import { useConnectionViewModel } from "./useConnectionViewModel";

const Connection: DeviceConnectionComponent = ({ deviceConnectionParams, onConnected }) => {
  const viewModel = useConnectionViewModel({
    deviceConnectionParams,
    onConnected,
  });

  return <ConnectionView {...viewModel} />;
};

export default Connection;

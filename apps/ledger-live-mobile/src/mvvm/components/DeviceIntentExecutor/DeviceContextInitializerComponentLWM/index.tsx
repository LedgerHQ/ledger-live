import React from "react";
import type { DeviceContextInitializerComponent } from "@ledgerhq/device-intent";
import type { ConnectAppDeviceInitializationInput } from "../types";
import { DeviceContextInitializerComponentLWMView } from "./DeviceContextInitializerComponentLWMView";
import { useDeviceContextInitializerComponentLWMViewModel } from "./useDeviceContextInitializerComponentLWMViewModel";

const DeviceContextInitializerComponentLWM: DeviceContextInitializerComponent<
  ConnectAppDeviceInitializationInput
> = ({ connectionResult, deviceInitializationInput, onContextInitialized }) => {
  const state = useDeviceContextInitializerComponentLWMViewModel({
    connectionResult,
    deviceInitializationInput,
    onContextInitialized,
  });

  return <DeviceContextInitializerComponentLWMView state={state} />;
};

export default DeviceContextInitializerComponentLWM;

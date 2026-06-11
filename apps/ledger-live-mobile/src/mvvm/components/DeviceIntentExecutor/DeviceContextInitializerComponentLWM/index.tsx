import { type EnsureAppReadyUseCaseDependencies } from "@ledgerhq/live-common/device/use-cases/ensureAppReady/ensureAppReadyUseCase";
import type { DeviceContextInitializerComponent } from "@ledgerhq/device-intent";
import React from "react";
import type { InitializationInput } from "../types";
import { DeviceContextInitializerComponentLWMView } from "./DeviceContextInitializerComponentLWMView";
import { useDeviceContextInitializerComponentLWMViewModel } from "./useDeviceContextInitializerComponentLWMViewModel";

export type InitializerConfig =
  | {
      dependencies?: Partial<EnsureAppReadyUseCaseDependencies>;
    }
  | undefined;

const DeviceContextInitializerComponentLWM: DeviceContextInitializerComponent<
  InitializationInput,
  InitializerConfig
> = ({ connectionResult, deviceInitializationInput, onContextInitialized, config, onClose }) => {
  const { state, device, sourceFlow } = useDeviceContextInitializerComponentLWMViewModel({
    connectionResult,
    deviceInitializationInput,
    onContextInitialized,
    dependencies: config?.dependencies,
  });

  return (
    <DeviceContextInitializerComponentLWMView
      state={state}
      device={device}
      sourceFlow={sourceFlow}
      onCancel={onClose}
    />
  );
};

export default DeviceContextInitializerComponentLWM;

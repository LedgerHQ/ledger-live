import React from "react";
import type { DeviceContextInitializerComponent } from "@ledgerhq/device-intent";
import type { EnsureAppReadyUseCaseDependencies } from "@ledgerhq/live-common/device/use-cases/ensureAppReady/ensureAppReadyUseCase";
import type { InitializationInput } from "../types";
import { DeviceContextInitializerComponentLWDView } from "./DeviceContextInitializerComponentLWDView";
import { useDeviceContextInitializerComponentLWDViewModel } from "./useDeviceContextInitializerComponentLWDViewModel";

export type InitializerConfig =
  | {
      dependencies?: Partial<EnsureAppReadyUseCaseDependencies>;
    }
  | undefined;

const DeviceContextInitializerComponentLWD: DeviceContextInitializerComponent<
  InitializationInput,
  InitializerConfig
> = ({ connectionResult, deviceInitializationInput, onContextInitialized, config, onClose }) => {
  const { state, device } = useDeviceContextInitializerComponentLWDViewModel({
    connectionResult,
    deviceInitializationInput,
    onContextInitialized,
    dependencies: config?.dependencies,
  });

  return (
    <DeviceContextInitializerComponentLWDView state={state} device={device} onCancel={onClose} />
  );
};

export default DeviceContextInitializerComponentLWD;

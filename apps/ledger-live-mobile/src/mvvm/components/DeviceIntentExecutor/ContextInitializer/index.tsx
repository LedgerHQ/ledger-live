import { type EnsureAppReadyUseCaseDependencies } from "@ledgerhq/live-common/device/use-cases/ensureAppReady/ensureAppReadyUseCase";
import type { DeviceContextInitializerComponent } from "@features/platform-device-intent";
import React from "react";
import type { InitializationInput } from "../types";
import { ContextInitializerView } from "./ContextInitializerView";
import { useContextInitializerViewModel } from "./useContextInitializerViewModel";

export type InitializerConfig =
  | {
      dependencies?: Partial<EnsureAppReadyUseCaseDependencies>;
    }
  | undefined;

const ContextInitializer: DeviceContextInitializerComponent<
  InitializationInput,
  InitializerConfig
> = ({ connectionResult, deviceInitializationInput, onContextInitialized, config, onClose }) => {
  const { state, device } = useContextInitializerViewModel({
    connectionResult,
    deviceInitializationInput,
    onContextInitialized,
    dependencies: config?.dependencies,
  });

  return <ContextInitializerView state={state} device={device} onCancel={onClose} />;
};

export default ContextInitializer;

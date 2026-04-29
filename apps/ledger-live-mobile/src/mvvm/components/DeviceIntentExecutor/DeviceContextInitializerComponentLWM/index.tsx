import type { DeviceContextInitializerComponentProps } from "@ledgerhq/device-intent";
import { type EnsureAppReadyUseCaseDependencies } from "@ledgerhq/live-common/device/use-cases/ensureAppReady/ensureAppReadyUseCase";
import React from "react";
import type { InitializationInput } from "../types";
import { DeviceContextInitializerComponentLWMView } from "./DeviceContextInitializerComponentLWMView";
import { useDeviceContextInitializerComponentLWMViewModel } from "./useDeviceContextInitializerComponentLWMViewModel";

type Props = DeviceContextInitializerComponentProps<InitializationInput> & {
  dependencies?: Partial<EnsureAppReadyUseCaseDependencies>;
};

const DeviceContextInitializerComponentLWM: React.FC<Props> = ({
  connectionResult,
  deviceInitializationInput,
  onContextInitialized,
  dependencies,
}) => {
  const state = useDeviceContextInitializerComponentLWMViewModel({
    connectionResult,
    deviceInitializationInput,
    onContextInitialized,
    dependencies,
  });

  return <DeviceContextInitializerComponentLWMView state={state} />;
};

export default DeviceContextInitializerComponentLWM;

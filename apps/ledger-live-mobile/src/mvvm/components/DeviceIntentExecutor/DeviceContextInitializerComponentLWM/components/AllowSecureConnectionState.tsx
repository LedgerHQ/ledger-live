import React from "react";
import { DeviceInteractionRequiredType, type EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import { ContinueOnDevice } from "LLM/components/DeviceIntentExecutor/components/DeviceGenericStates/ContinueOnDevice";
import type { BaseInitializerStateProps } from "../types";

type AllowSecureConnectionStateProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: DeviceInteractionRequiredType.AllowSecureConnection }>
>;

export function AllowSecureConnectionState({ device }: AllowSecureConnectionStateProps) {
  return (
    <ContinueOnDevice
      deviceModelId={device.modelId}
      deviceName={device.name}
      testID="device-initializer-allow-secure-connection"
    />
  );
}

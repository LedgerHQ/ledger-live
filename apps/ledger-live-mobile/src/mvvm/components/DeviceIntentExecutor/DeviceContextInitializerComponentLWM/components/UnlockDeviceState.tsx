import React from "react";
import { DeviceInteractionRequiredType, type EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import { UnlockDevice } from "LLM/components/DeviceIntentExecutor/components/DeviceGenericStates/UnlockDevice";
import type { BaseInitializerStateProps } from "../types";

type UnlockDeviceStateProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: DeviceInteractionRequiredType.UnlockDevice }>
>;

export function UnlockDeviceState({ device }: UnlockDeviceStateProps) {
  return (
    <UnlockDevice
      deviceModelId={device.modelId}
      deviceName={device.name}
      testID="device-initializer-unlock-device"
    />
  );
}

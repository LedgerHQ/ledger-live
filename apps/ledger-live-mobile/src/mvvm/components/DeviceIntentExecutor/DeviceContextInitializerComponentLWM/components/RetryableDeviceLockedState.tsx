import React from "react";
import { RetryableStateType, type EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import { RetryableDeviceLocked } from "LLM/components/DeviceIntentExecutor/components/DeviceGenericStates/RetryableDeviceLocked";
import type { BaseInitializerStateProps } from "../types";

type RetryableDeviceLockedStateProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: RetryableStateType.DeviceLocked }>
>;

export function RetryableDeviceLockedState({ state, device }: RetryableDeviceLockedStateProps) {
  return (
    <RetryableDeviceLocked
      deviceModelId={device.modelId}
      onRetry={state.retry}
      testID="device-initializer-retryable-device-locked"
    />
  );
}

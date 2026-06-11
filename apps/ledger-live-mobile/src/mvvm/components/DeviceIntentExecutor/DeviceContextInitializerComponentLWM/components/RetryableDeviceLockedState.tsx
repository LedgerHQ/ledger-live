import React from "react";
import { RetryableStateType, type EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import { RetryableDeviceLocked } from "LLM/components/DeviceIntentExecutor/components/DeviceGenericStates/RetryableDeviceLocked";
import { TrackScreen } from "~/analytics";
import {
  CONNECT_APP_BUTTON,
  PAGE_CONNECT_APP,
  trackConnectAppButtonClicked,
} from "../../utils/trackDeviceIntent";
import type { BaseInitializerStateProps } from "../types";

type RetryableDeviceLockedStateProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: RetryableStateType.DeviceLocked }>
>;

export function RetryableDeviceLockedState({
  state,
  device,
  sourceFlow,
}: RetryableDeviceLockedStateProps) {
  const modelId = device.modelId;

  const handleRetry = () => {
    trackConnectAppButtonClicked({
      sourceFlow,
      modelId,
      button: CONNECT_APP_BUTTON.Retry,
    });
    state.retry();
  };

  return (
    <>
      <TrackScreen
        category={PAGE_CONNECT_APP.DeviceLocked}
        sourceFlow={sourceFlow}
        modelId={modelId}
        refreshSource
        deviceUxV2
      />
      <RetryableDeviceLocked
        deviceModelId={device.modelId}
        onRetry={handleRetry}
        testID="device-initializer-retryable-device-locked"
      />
    </>
  );
}

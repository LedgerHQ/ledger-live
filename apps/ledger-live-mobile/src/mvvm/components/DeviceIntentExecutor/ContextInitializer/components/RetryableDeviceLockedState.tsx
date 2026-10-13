import React from "react";
import { RetryableStateType, type EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import { RetryableDeviceLocked } from "LLM/components/DeviceIntentExecutor/components/DeviceGenericStates/RetryableDeviceLocked";
import { TrackDIEScreen } from "../../components/TrackDIEScreen";
import { useDeviceIntentTracking } from "../../utils/DeviceIntentTrackingContext";
import {
  CONNECT_APP_BUTTON,
  PAGE_CONNECT_APP,
  trackConnectAppButtonClicked,
} from "../../utils/trackDeviceIntent";
import type { BaseInitializerStateProps } from "../types";

type RetryableDeviceLockedStateProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: RetryableStateType.DeviceLocked }>
>;

export function RetryableDeviceLockedState({ state, device }: RetryableDeviceLockedStateProps) {
  const { sourceFlow, analyticsProperties } = useDeviceIntentTracking();
  const modelId = device.modelId;

  const handleRetry = () => {
    trackConnectAppButtonClicked({
      sourceFlow,
      modelId,
      button: CONNECT_APP_BUTTON.Retry,
      extraProperties: analyticsProperties,
    });
    state.retry();
  };

  return (
    <>
      <TrackDIEScreen category={PAGE_CONNECT_APP.DeviceLocked} modelId={modelId} refreshSource />
      <RetryableDeviceLocked
        deviceModelId={device.modelId}
        onRetry={handleRetry}
        testID="device-initializer-retryable-device-locked"
      />
    </>
  );
}

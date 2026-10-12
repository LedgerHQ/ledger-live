import React from "react";
import {
  RetryableStateType,
  type EnsureAppReadyState,
  useDeviceIntentTracking,
} from "@ledgerhq/live-dmk-shared";
import { TrackDIEScreen } from "../../components/TrackDIEScreen";
import {
  CONNECT_APP_BUTTON,
  PAGE_CONNECT_APP,
  trackConnectAppButtonClicked,
} from "../../utils/trackDeviceIntent";
import { RetryableDeviceLocked } from "../../components/DeviceGenericStates/RetryableDeviceLocked";
import type { BaseInitializerStateProps } from "../types";

type RetryableDeviceLockedStateProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: RetryableStateType.DeviceLocked }>
>;

export function RetryableDeviceLockedState({ state, device }: RetryableDeviceLockedStateProps) {
  const { sourceFlow, analyticsProperties } = useDeviceIntentTracking();

  const handleRetry = () => {
    trackConnectAppButtonClicked({
      sourceFlow,
      modelId: device.modelId,
      button: CONNECT_APP_BUTTON.Retry,
      extraProperties: analyticsProperties,
    });
    state.retry();
  };

  return (
    <>
      <TrackDIEScreen
        category={PAGE_CONNECT_APP.DeviceLocked}
        modelId={device.modelId}
        refreshSource
      />
      <RetryableDeviceLocked
        deviceModelId={device.modelId}
        onRetry={handleRetry}
        testID="device-initializer-retryable-device-locked"
      />
    </>
  );
}

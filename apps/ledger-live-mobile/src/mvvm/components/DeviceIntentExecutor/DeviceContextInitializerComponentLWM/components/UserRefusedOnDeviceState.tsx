import React from "react";
import { RetryableStateType, type EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import { Trans } from "~/context/Locale";
import { InfoState } from "LLM/components/InfoState";
import { TrackDIEScreen } from "../../components/TrackDIEScreen";
import { useDeviceIntentTracking } from "../../utils/DeviceIntentTrackingContext";
import {
  CONNECT_APP_BUTTON,
  PAGE_CONNECT_APP,
  trackConnectAppButtonClicked,
} from "../../utils/trackDeviceIntent";
import type { BaseInitializerStateProps } from "../types";

type UserRefusedOnDeviceStateProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: RetryableStateType.UserRefusedOnDevice }>
>;

export function UserRefusedOnDeviceState({
  state,
  device,
  onCancel,
}: UserRefusedOnDeviceStateProps) {
  const { sourceFlow, analyticsProperties } = useDeviceIntentTracking();
  const modelId = device.modelId;

  const handleClose = () => {
    trackConnectAppButtonClicked({
      sourceFlow,
      modelId,
      button: CONNECT_APP_BUTTON.Close,
      extraProperties: analyticsProperties,
    });
    onCancel();
  };
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
      <TrackDIEScreen category={PAGE_CONNECT_APP.UserRefused} modelId={modelId} refreshSource />
      <InfoState
        preset="info"
        size="hug"
        title={<Trans i18nKey="deviceIntentExecutor.initialization.retryable.userRefused.title" />}
        primaryCta={{
          label: <Trans i18nKey="common.close" />,
          onPress: handleClose,
        }}
        secondaryCta={{
          label: <Trans i18nKey="common.retry" />,
          onPress: handleRetry,
        }}
        testID="device-initializer-user-refused-on-device"
      />
    </>
  );
}

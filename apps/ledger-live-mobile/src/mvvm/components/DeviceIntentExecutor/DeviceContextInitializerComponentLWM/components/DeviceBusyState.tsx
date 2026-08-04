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

type DeviceBusyStateProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: RetryableStateType.DeviceBusy }>
>;

export function DeviceBusyState({ state, device, onCancel }: DeviceBusyStateProps) {
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
  const handleCancel = () => {
    trackConnectAppButtonClicked({
      sourceFlow,
      modelId,
      button: CONNECT_APP_BUTTON.Close,
      extraProperties: analyticsProperties,
    });
    onCancel();
  };

  return (
    <>
      <TrackDIEScreen category={PAGE_CONNECT_APP.DeviceBusy} modelId={modelId} refreshSource />
      <InfoState
        preset="info"
        size="hug"
        title={<Trans i18nKey="deviceIntentExecutor.initialization.retryable.deviceBusy.title" />}
        description={
          <Trans i18nKey="deviceIntentExecutor.initialization.retryable.deviceBusy.description" />
        }
        primaryCta={{
          label: <Trans i18nKey="common.retry" />,
          onPress: handleRetry,
        }}
        secondaryCta={{
          label: <Trans i18nKey="deviceIntentExecutor.initialization.cta.cancelOperation" />,
          onPress: handleCancel,
        }}
        testID="device-initializer-device-busy"
      />
    </>
  );
}

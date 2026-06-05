import React from "react";
import { RetryableStateType, type EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import { Trans } from "~/context/Locale";
import { InfoState } from "LLM/components/InfoState";
import { TrackScreen } from "~/analytics";
import {
  CONNECT_APP_BUTTON,
  PAGE_CONNECT_APP,
  trackConnectAppButtonClicked,
} from "../../utils/trackDeviceIntent";
import type { BaseInitializerStateProps } from "../types";

type DeviceBusyStateProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: RetryableStateType.DeviceBusy }>
>;

export function DeviceBusyState({ state, device, sourceFlow, onCancel }: DeviceBusyStateProps) {
  const modelId = device.modelId;

  const handleRetry = () => {
    trackConnectAppButtonClicked({
      sourceFlow,
      modelId,
      button: CONNECT_APP_BUTTON.Retry,
    });
    state.retry();
  };
  const handleCancel = () => {
    trackConnectAppButtonClicked({
      sourceFlow,
      modelId,
      button: CONNECT_APP_BUTTON.Close,
    });
    onCancel();
  };

  return (
    <>
      <TrackScreen
        category={PAGE_CONNECT_APP.DeviceBusy}
        sourceFlow={sourceFlow}
        modelId={modelId}
        refreshSource
        deviceUxV2
      />
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

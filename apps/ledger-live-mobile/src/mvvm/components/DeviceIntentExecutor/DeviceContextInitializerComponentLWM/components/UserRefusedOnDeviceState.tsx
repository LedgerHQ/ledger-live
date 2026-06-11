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

type UserRefusedOnDeviceStateProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: RetryableStateType.UserRefusedOnDevice }>
>;

export function UserRefusedOnDeviceState({
  state,
  device,
  sourceFlow,
  onCancel,
}: UserRefusedOnDeviceStateProps) {
  const modelId = device.modelId;

  const handleClose = () => {
    trackConnectAppButtonClicked({
      sourceFlow,
      modelId,
      button: CONNECT_APP_BUTTON.Close,
    });
    onCancel();
  };
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
        category={PAGE_CONNECT_APP.UserRefused}
        sourceFlow={sourceFlow}
        modelId={modelId}
        refreshSource
        deviceUxV2
      />
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

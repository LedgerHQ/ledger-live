import React from "react";
import { RetryableStateType, type EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import { Trans } from "~/context/Locale";
import { InfoState } from "LLM/components/InfoState";
import type { BaseInitializerStateProps } from "../types";

type DeviceBusyStateProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: RetryableStateType.DeviceBusy }>
>;

export function DeviceBusyState({ state, onCancel }: DeviceBusyStateProps) {
  return (
    <InfoState
      preset="info"
      size="hug"
      title={<Trans i18nKey="deviceIntentExecutor.initialization.retryable.deviceBusy.title" />}
      description={
        <Trans i18nKey="deviceIntentExecutor.initialization.retryable.deviceBusy.description" />
      }
      primaryCta={{
        label: <Trans i18nKey="common.retry" />,
        onPress: state.retry,
      }}
      secondaryCta={{
        label: <Trans i18nKey="deviceIntentExecutor.initialization.cta.cancelOperation" />,
        onPress: onCancel,
      }}
      testID="device-initializer-device-busy"
    />
  );
}

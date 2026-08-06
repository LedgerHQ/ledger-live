import React from "react";
import { useTranslation } from "react-i18next";
import { RetryableStateType, type EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import { InfoState } from "LLD/components/InfoState";
import type { BaseInitializerStateProps } from "../types";

type DeviceBusyStateProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: RetryableStateType.DeviceBusy }>
>;

export function DeviceBusyState({ state, onCancel }: DeviceBusyStateProps) {
  const { t } = useTranslation();

  return (
    <InfoState
      preset="info"
      size="hug"
      title={t("deviceIntentExecutor.initialization.retryable.deviceBusy.title")}
      description={t("deviceIntentExecutor.initialization.retryable.deviceBusy.description")}
      primaryCta={{
        label: t("common.retry"),
        onPress: state.retry,
      }}
      secondaryCta={{
        label: t("deviceIntentExecutor.initialization.cta.cancelOperation"),
        onPress: onCancel,
      }}
      testID="device-initializer-device-busy"
    />
  );
}

import React from "react";
import { useTranslation } from "react-i18next";
import { RetryableStateType, type EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import { InfoState } from "LLD/components/InfoState";
import type { BaseInitializerStateProps } from "../types";

type UserRefusedOnDeviceStateProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: RetryableStateType.UserRefusedOnDevice }>
>;

export function UserRefusedOnDeviceState({ state, onCancel }: UserRefusedOnDeviceStateProps) {
  const { t } = useTranslation();

  return (
    <InfoState
      preset="info"
      size="hug"
      title={t("deviceIntentExecutor.initialization.retryable.userRefused.title")}
      primaryCta={{
        label: t("common.close"),
        onPress: onCancel,
      }}
      secondaryCta={{
        label: t("common.retry"),
        onPress: state.retry,
      }}
      testID="device-initializer-user-refused-on-device"
    />
  );
}

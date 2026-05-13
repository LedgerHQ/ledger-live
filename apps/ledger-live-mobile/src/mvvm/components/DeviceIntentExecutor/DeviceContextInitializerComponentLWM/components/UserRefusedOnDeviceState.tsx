import React from "react";
import { RetryableStateType, type EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import { Trans } from "~/context/Locale";
import { InfoState } from "LLM/components/InfoState";
import type { BaseInitializerStateProps } from "../types";

type UserRefusedOnDeviceStateProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: RetryableStateType.UserRefusedOnDevice }>
>;

export function UserRefusedOnDeviceState({ state, onCancel }: UserRefusedOnDeviceStateProps) {
  return (
    <InfoState
      preset="info"
      size="hug"
      title={<Trans i18nKey="deviceIntentExecutor.initialization.retryable.userRefused.title" />}
      primaryCta={{
        label: <Trans i18nKey="common.close" />,
        onPress: onCancel,
      }}
      secondaryCta={{
        label: <Trans i18nKey="common.retry" />,
        onPress: state.retry,
      }}
      testID="device-initializer-user-refused-on-device"
    />
  );
}

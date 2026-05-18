import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { RetryableStateType, type EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import { Trans } from "~/context/Locale";
import type { BaseInitializerStateProps } from "../types";
import { InfoState } from "LLM/components/InfoState";

type RetryableDeviceLockedStateProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: RetryableStateType.DeviceLocked }>
>;

export function RetryableDeviceLockedState({ state, device }: RetryableDeviceLockedStateProps) {
  return (
    <Box lx={rootStyle}>
      <InfoState
        preset="info"
        size="hug"
        title={
          <Trans
            i18nKey="deviceIntentExecutor.initialization.retryable.locked.title"
            values={{ productName: device.productName }}
          />
        }
        description={
          <Trans
            i18nKey="deviceIntentExecutor.initialization.retryable.locked.description"
            values={{ productName: device.productName }}
          />
        }
        primaryCta={{
          label: <Trans i18nKey="common.retry" />,
          onPress: state.retry,
        }}
        testID="device-initializer-retryable-device-locked"
      />
    </Box>
  );
}

const rootStyle = {
  gap: "s16",
  width: "full",
} as const;

import React from "react";
import { Box, Button } from "@ledgerhq/lumen-ui-rnative";
import { RetryableStateType, type EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import { Trans } from "~/context/Locale";
import { DeviceActionContent } from "LLM/components/DeviceActionContent";
import type { BaseInitializerStateProps } from "../types";

type RetryableDeviceLockedStateProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: RetryableStateType.DeviceLocked }>
>;

export function RetryableDeviceLockedState({ state, device }: RetryableDeviceLockedStateProps) {
  return (
    <Box lx={rootStyle}>
      <DeviceActionContent
        action="power-and-unlock"
        deviceModelId={device.supportedModelId}
        deviceName={device.name}
        title={
          <Trans
            i18nKey="deviceIntentExecutor.initialization.deviceAction.unlock.title"
            values={{ productName: device.productName }}
          />
        }
        testID="device-initializer-retryable-device-locked"
      />
      <Button appearance="base" size="lg" lx={{ width: "full" }} onPress={state.retry}>
        <Trans i18nKey="common.retry" />
      </Button>
    </Box>
  );
}

const rootStyle = {
  gap: "s16",
  width: "full",
} as const;

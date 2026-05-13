import React from "react";
import { DeviceInteractionRequiredType, type EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import { Trans } from "~/context/Locale";
import { DeviceActionContent } from "LLM/components/DeviceActionContent";
import type { BaseInitializerStateProps } from "../types";

type UnlockDeviceStateProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: DeviceInteractionRequiredType.UnlockDevice }>
>;

export function UnlockDeviceState({ device }: UnlockDeviceStateProps) {
  return (
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
      testID="device-initializer-unlock-device"
    />
  );
}

import React from "react";
import { DeviceInteractionRequiredType, type EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import { Trans } from "~/context/Locale";
import { DeviceActionContent } from "LLM/components/DeviceActionContent";
import type { BaseInitializerStateProps } from "../types";

type ConfirmOpenAppStateProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: DeviceInteractionRequiredType.ConfirmOpenApp }>
>;

export function ConfirmOpenAppState({ device }: ConfirmOpenAppStateProps) {
  return (
    <DeviceActionContent
      action="continue"
      deviceModelId={device.supportedModelId}
      deviceName={device.name}
      title={
        <Trans
          i18nKey="deviceIntentExecutor.initialization.deviceAction.continue.title"
          values={{ productName: device.productName }}
        />
      }
      description={
        <Trans i18nKey="deviceIntentExecutor.initialization.deviceAction.continue.description" />
      }
      testID="device-initializer-confirm-open-app"
    />
  );
}

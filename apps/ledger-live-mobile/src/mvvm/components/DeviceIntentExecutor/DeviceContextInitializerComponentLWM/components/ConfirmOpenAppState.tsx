import React from "react";
import { DeviceInteractionRequiredType, type EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import { ContinueOnDevice } from "LLM/components/DeviceIntentExecutor/components/DeviceGenericStates/ContinueOnDevice";
import type { BaseInitializerStateProps } from "../types";

type ConfirmOpenAppStateProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: DeviceInteractionRequiredType.ConfirmOpenApp }>
>;

export function ConfirmOpenAppState({ device }: ConfirmOpenAppStateProps) {
  return (
    <ContinueOnDevice
      deviceModelId={device.modelId}
      deviceName={device.name}
      testID="device-initializer-confirm-open-app"
    />
  );
}

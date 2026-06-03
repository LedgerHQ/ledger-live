import React from "react";
import { DeviceInteractionRequiredType, type EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import { ContinueOnDevice } from "LLM/components/DeviceIntentExecutor/components/DeviceGenericStates/ContinueOnDevice";
import { TrackScreen } from "~/analytics";
import { PAGE_CONNECT_APP } from "../../utils/trackDeviceIntent";
import type { BaseInitializerStateProps } from "../types";

type ConfirmOpenAppStateProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: DeviceInteractionRequiredType.ConfirmOpenApp }>
>;

export function ConfirmOpenAppState({ device, sourceFlow }: ConfirmOpenAppStateProps) {
  return (
    <>
      <TrackScreen
        category={PAGE_CONNECT_APP.ConfirmOpenApp}
        sourceFlow={sourceFlow}
        modelId={device.modelId}
        deviceUxV2
      />
      <ContinueOnDevice
        deviceModelId={device.modelId}
        deviceName={device.name}
        testID="device-initializer-confirm-open-app"
      />
    </>
  );
}

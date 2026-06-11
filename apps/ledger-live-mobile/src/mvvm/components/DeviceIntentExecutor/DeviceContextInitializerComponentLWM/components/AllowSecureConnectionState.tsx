import React from "react";
import { DeviceInteractionRequiredType, type EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import { ContinueOnDevice } from "LLM/components/DeviceIntentExecutor/components/DeviceGenericStates/ContinueOnDevice";
import { TrackScreen } from "~/analytics";
import { PAGE_CONNECT_APP } from "../../utils/trackDeviceIntent";
import type { BaseInitializerStateProps } from "../types";

type AllowSecureConnectionStateProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: DeviceInteractionRequiredType.AllowSecureConnection }>
>;

export function AllowSecureConnectionState({
  device,
  sourceFlow,
}: AllowSecureConnectionStateProps) {
  return (
    <>
      <TrackScreen
        category={PAGE_CONNECT_APP.AllowSecureConnection}
        sourceFlow={sourceFlow}
        modelId={device.modelId}
        refreshSource
        deviceUxV2
      />
      <ContinueOnDevice
        deviceModelId={device.modelId}
        deviceName={device.name}
        testID="device-initializer-allow-secure-connection"
      />
    </>
  );
}

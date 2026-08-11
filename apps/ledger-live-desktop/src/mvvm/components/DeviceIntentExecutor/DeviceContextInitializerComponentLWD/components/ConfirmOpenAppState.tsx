import React from "react";
import { DeviceInteractionRequiredType, type EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import { TrackDIEScreen } from "../../components/TrackDIEScreen";
import { PAGE_CONNECT_APP } from "../../utils/trackDeviceIntent";
import { ContinueOnDevice } from "../../components/DeviceGenericStates/ContinueOnDevice";
import type { BaseInitializerStateProps } from "../types";

type ConfirmOpenAppStateProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: DeviceInteractionRequiredType.ConfirmOpenApp }>
>;

export function ConfirmOpenAppState({ device }: ConfirmOpenAppStateProps) {
  return (
    <>
      <TrackDIEScreen
        category={PAGE_CONNECT_APP.ConfirmOpenApp}
        modelId={device.modelId}
        refreshSource
      />
      <ContinueOnDevice
        deviceModelId={device.modelId}
        deviceName={device.name}
        testID="device-initializer-confirm-open-app"
      />
    </>
  );
}

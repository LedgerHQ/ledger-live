import React from "react";
import {
  DeviceInteractionRequiredType,
  OverrideDeviceIntentExecutorHeader,
  type EnsureAppReadyState,
} from "@ledgerhq/live-dmk-shared";
import { TrackDIEScreen } from "../../components/TrackDIEScreen";
import { PAGE_CONNECT_APP } from "../../utils/trackDeviceIntent";
import { UnlockDevice } from "../../components/DeviceGenericStates/UnlockDevice";
import type { BaseInitializerStateProps } from "../types";

type UnlockDeviceStateProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: DeviceInteractionRequiredType.UnlockDevice }>
>;

export function UnlockDeviceState({ device }: UnlockDeviceStateProps) {
  return (
    <>
      <OverrideDeviceIntentExecutorHeader>
        <div className="h-48" aria-hidden />
      </OverrideDeviceIntentExecutorHeader>
      <TrackDIEScreen
        category={PAGE_CONNECT_APP.UnlockDevice}
        modelId={device.modelId}
        refreshSource
      />
      <UnlockDevice
        deviceModelId={device.modelId}
        deviceName={device.name}
        testID="device-initializer-unlock-device"
      />
    </>
  );
}

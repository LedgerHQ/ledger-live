import React from "react";
import { DeviceInteractionRequiredType, type EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import { OverrideDeviceIntentExecutorHeader } from "@ledgerhq/live-dmk-shared/react";
import { TrackDIEScreen } from "../../components/TrackDIEScreen";
import { PAGE_CONNECT_APP } from "../../utils/trackDeviceIntent";
import { UnlockDevice } from "../../components/DeviceGenericStates/UnlockDevice";
import type { BaseInitializerStateProps } from "../types";
import { DeviceBlocker } from "~/renderer/components/DeviceAction/DeviceBlocker";

type UnlockDeviceStateProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: DeviceInteractionRequiredType.UnlockDevice }>
>;

export function UnlockDeviceState({ device }: UnlockDeviceStateProps) {
  return (
    <>
      <DeviceBlocker />
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

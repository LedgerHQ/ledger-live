import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { DeviceInteractionRequiredType, type EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import { UnlockDevice } from "LLM/components/DeviceIntentExecutor/components/DeviceGenericStates/UnlockDevice";
import ModalLock from "~/components/ModalLock";
import { TrackDIEScreen } from "../../components/TrackDIEScreen";
import { PAGE_CONNECT_APP } from "../../utils/trackDeviceIntent";
import type { BaseInitializerStateProps } from "../types";
import { OverrideDeviceIntentExecutorHeader } from "../../components/OverrideDeviceIntentExecutorHeader";

type UnlockDeviceStateProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: DeviceInteractionRequiredType.UnlockDevice }>
>;

export function UnlockDeviceState({ device }: UnlockDeviceStateProps) {
  return (
    <>
      <ModalLock />
      <OverrideDeviceIntentExecutorHeader>
        <Box lx={{ height: "s64" }} />
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

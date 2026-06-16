import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { DeviceInteractionRequiredType, type EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import { UnlockDevice } from "LLM/components/DeviceIntentExecutor/components/DeviceGenericStates/UnlockDevice";
import { TrackScreen } from "~/analytics";
import ModalLock from "~/components/ModalLock";
import { PAGE_CONNECT_APP } from "../../utils/trackDeviceIntent";
import type { BaseInitializerStateProps } from "../types";
import { OverrideDeviceIntentExecutorHeader } from "../../components/OverrideDeviceIntentExecutorHeader";

type UnlockDeviceStateProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: DeviceInteractionRequiredType.UnlockDevice }>
>;

export function UnlockDeviceState({ device, sourceFlow }: UnlockDeviceStateProps) {
  return (
    <>
      <ModalLock />
      <OverrideDeviceIntentExecutorHeader>
        <Box lx={{ height: "s64" }} />
      </OverrideDeviceIntentExecutorHeader>
      <TrackScreen
        category={PAGE_CONNECT_APP.UnlockDevice}
        sourceFlow={sourceFlow}
        modelId={device.modelId}
        refreshSource
        deviceUxV2
      />
      <UnlockDevice
        deviceModelId={device.modelId}
        deviceName={device.name}
        testID="device-initializer-unlock-device"
      />
    </>
  );
}

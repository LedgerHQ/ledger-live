import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { DeviceInteractionRequiredType, type EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import { ContinueOnDevice } from "LLM/components/DeviceIntentExecutor/components/DeviceGenericStates/ContinueOnDevice";
import { TrackScreen } from "~/analytics";
import ModalLock from "~/components/ModalLock";
import { PAGE_CONNECT_APP } from "../../utils/trackDeviceIntent";
import type { BaseInitializerStateProps } from "../types";
import { OverrideDeviceIntentExecutorHeader } from "../../components/OverrideDeviceIntentExecutorHeader";

type ConfirmOpenAppStateProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: DeviceInteractionRequiredType.ConfirmOpenApp }>
>;

export function ConfirmOpenAppState({ device, sourceFlow }: ConfirmOpenAppStateProps) {
  return (
    <>
      <ModalLock />
      <OverrideDeviceIntentExecutorHeader>
        <Box lx={{ height: "s64" }} />
      </OverrideDeviceIntentExecutorHeader>
      <TrackScreen
        category={PAGE_CONNECT_APP.ConfirmOpenApp}
        sourceFlow={sourceFlow}
        modelId={device.modelId}
        refreshSource
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

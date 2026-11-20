import React from "react";
import { DeviceInteractionRequiredType, type EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import { OverrideDeviceIntentExecutorHeader } from "@ledgerhq/live-dmk-shared/react";
import { TrackDIEScreen } from "../../components/TrackDIEScreen";
import { PAGE_CONNECT_APP } from "../../utils/trackDeviceIntent";
import { ContinueOnDevice } from "../../components/DeviceGenericStates/ContinueOnDevice";
import type { BaseInitializerStateProps } from "../types";
import { DeviceBlocker } from "~/renderer/components/DeviceAction/DeviceBlocker";

type ConfirmOpenAppStateProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: DeviceInteractionRequiredType.ConfirmOpenApp }>
>;

export function ConfirmOpenAppState({ device }: ConfirmOpenAppStateProps) {
  return (
    <>
      <DeviceBlocker />
      <OverrideDeviceIntentExecutorHeader>
        <div className="h-48" aria-hidden />
      </OverrideDeviceIntentExecutorHeader>
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

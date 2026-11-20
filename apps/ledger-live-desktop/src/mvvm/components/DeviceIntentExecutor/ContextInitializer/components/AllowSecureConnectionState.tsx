import React from "react";
import { DeviceInteractionRequiredType, type EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import { OverrideDeviceIntentExecutorHeader } from "@ledgerhq/live-dmk-shared/react";
import { TrackDIEScreen } from "../../components/TrackDIEScreen";
import { PAGE_CONNECT_APP } from "../../utils/trackDeviceIntent";
import { ContinueOnDevice } from "../../components/DeviceGenericStates/ContinueOnDevice";
import type { BaseInitializerStateProps } from "../types";
import { DeviceBlocker } from "~/renderer/components/DeviceAction/DeviceBlocker";

type AllowSecureConnectionStateProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: DeviceInteractionRequiredType.AllowSecureConnection }>
>;

export function AllowSecureConnectionState({ device }: AllowSecureConnectionStateProps) {
  return (
    <>
      <DeviceBlocker />
      <OverrideDeviceIntentExecutorHeader>
        <div className="h-48" aria-hidden />
      </OverrideDeviceIntentExecutorHeader>
      <TrackDIEScreen
        category={PAGE_CONNECT_APP.AllowSecureConnection}
        modelId={device.modelId}
        refreshSource
      />
      <ContinueOnDevice
        deviceModelId={device.modelId}
        deviceName={device.name}
        testID="device-initializer-allow-secure-connection"
      />
    </>
  );
}

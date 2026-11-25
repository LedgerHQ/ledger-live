import React from "react";
import type { Device } from "@ledgerhq/live-dmk-shared";
import { TrackDIEScreen } from "LLM/components/DeviceIntentExecutor/components/TrackDIEScreen";
import {
  getTrackingTransport,
  PAGE_CONNECT_DEVICE,
} from "LLM/components/DeviceIntentExecutor/utils/trackDeviceIntent";
import { WaitingForSelectedDeviceState } from "./WaitingForSelectedDeviceState";

type TrackedWaitingForSelectedDeviceStateProps = {
  device: Device;
};

/** `WaitingForSelectedDeviceState` with its Connect Device page event. */
export function TrackedWaitingForSelectedDeviceState({
  device,
}: Readonly<TrackedWaitingForSelectedDeviceStateProps>): React.ReactNode {
  return (
    <>
      <TrackDIEScreen
        category={PAGE_CONNECT_DEVICE.WaitingForSelectedDevice}
        modelId={device.deviceModelId}
        transport={getTrackingTransport(device.transport)}
        refreshSource
      />
      <WaitingForSelectedDeviceState device={device} />
    </>
  );
}

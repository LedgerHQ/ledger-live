import React from "react";
import type { Device } from "@ledgerhq/live-dmk-shared";
import { TrackDIEScreen } from "LLM/components/DeviceIntentExecutor/components/TrackDIEScreen";
import {
  getTrackingTransport,
  PAGE_CONNECT_DEVICE,
} from "LLM/components/DeviceIntentExecutor/utils/trackDeviceIntent";
import { ConnectingState } from "./ConnectingState";

type TrackedConnectingStateProps = {
  device: Device;
  /** Sent with the page when the flow knows it. The DIE does not send it. */
  isNewDevice?: boolean;
};

/** `ConnectingState` with its Connect Device page event. */
export function TrackedConnectingState({
  device,
  isNewDevice,
}: Readonly<TrackedConnectingStateProps>): React.ReactNode {
  return (
    <>
      <TrackDIEScreen
        category={PAGE_CONNECT_DEVICE.Connecting}
        modelId={device.deviceModelId}
        transport={getTrackingTransport(device.transport)}
        {...(isNewDevice === undefined ? {} : { isNewDevice })}
        refreshSource
      />
      <ConnectingState />
    </>
  );
}

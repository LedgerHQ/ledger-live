import React from "react";
import { ConnectDeviceUIStateTypes, type ConnectDeviceUIState } from "@ledgerhq/live-dmk-mobile";
import { WaitingForSelectedDeviceState as WaitingForSelectedDeviceStateView } from "LLM/components/DeviceConnection";
import { TrackDIEScreen } from "../../components/TrackDIEScreen";
import { PAGE_CONNECT_DEVICE } from "../../utils/trackDeviceIntent";

type WaitingForSelectedDeviceStateProps = {
  state: Extract<
    ConnectDeviceUIState,
    { type: typeof ConnectDeviceUIStateTypes.WaitingForSelectedDevice }
  >;
};

export function WaitingForSelectedDeviceState({
  state,
}: Readonly<WaitingForSelectedDeviceStateProps>): React.ReactNode {
  return (
    <>
      <TrackDIEScreen
        category={PAGE_CONNECT_DEVICE.WaitingForSelectedDevice}
        modelId={state.device.deviceModelId}
        refreshSource
      />
      <WaitingForSelectedDeviceStateView device={state.device} />
    </>
  );
}

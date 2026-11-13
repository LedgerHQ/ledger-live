import React from "react";
import {
  ConnectDeviceUIStateTypes,
  rnHidTransportIdentifier,
  type ConnectDeviceUIState,
} from "@ledgerhq/live-dmk-mobile";
import { ConnectingState as ConnectingStateView } from "LLM/components/DeviceConnection";
import { TrackDIEScreen } from "../../components/TrackDIEScreen";
import { PAGE_CONNECT_DEVICE } from "../../utils/trackDeviceIntent";

type ConnectingStateProps = {
  state: Extract<ConnectDeviceUIState, { type: typeof ConnectDeviceUIStateTypes.Connecting }>;
};

export function ConnectingState({ state }: Readonly<ConnectingStateProps>): React.ReactNode {
  const modelId = state.device.deviceModelId;
  const transport: "ble" | "usb" =
    state.device.transport === rnHidTransportIdentifier ? "usb" : "ble";

  return (
    <>
      <TrackDIEScreen
        category={PAGE_CONNECT_DEVICE.Connecting}
        modelId={modelId}
        transport={transport}
        refreshSource
      />
      <ConnectingStateView />
    </>
  );
}

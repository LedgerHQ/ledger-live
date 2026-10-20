import React from "react";
import { ConnectDeviceUIStateTypes, type ConnectDeviceUIState } from "@ledgerhq/live-dmk-mobile";
import { getErrorName } from "@ledgerhq/live-dmk-shared";
import { UnknownErrorState as UnknownErrorStateView } from "LLM/components/DeviceConnection";
import { TrackDIEScreen } from "../../components/TrackDIEScreen";
import { PAGE_CONNECT_DEVICE } from "../../utils/trackDeviceIntent";

type UnknownErrorStateProps = {
  state: Extract<ConnectDeviceUIState, { type: typeof ConnectDeviceUIStateTypes.UnknownError }>;
};

export function UnknownErrorState({ state }: Readonly<UnknownErrorStateProps>): React.ReactNode {
  return (
    <>
      <TrackDIEScreen
        category={PAGE_CONNECT_DEVICE.UnknownError}
        subError={getErrorName(state.error)}
        refreshSource
      />
      <UnknownErrorStateView />
    </>
  );
}

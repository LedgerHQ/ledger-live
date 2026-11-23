import React from "react";
import {
  ConnectDeviceUIStateTypes,
  ConnectNewDeviceUIStateTypes,
  type ConnectDeviceUIState,
} from "@ledgerhq/live-dmk-mobile";
import type { AppPlatform } from "@ledgerhq/live-common/platform/types";
import {
  ConnectedView,
  ConnectingView,
  DiscoveringView,
  SheetStateLayout,
} from "LLM/components/ConnectNewDevice";
import { ConnectionErrorState, DiscoveryErrorState } from "LLM/components/DeviceConnection";
import { useSheetBack } from "../../utils/ConnectionStepContext";

type AddNewDeviceStateProps = {
  state: Extract<ConnectDeviceUIState, { type: typeof ConnectDeviceUIStateTypes.ConnectNewDevice }>;
  platform: Exclude<AppPlatform, "desktop">;
  onDeviceNotFound: () => void;
};

function assertNever(value: never): never {
  throw new Error(`Unhandled connect new device state: ${JSON.stringify(value)}`);
}

/** The add flow inside the sheet: the connectNewDevice states, with the errors inline. */
export function AddNewDeviceState({
  state,
  platform,
  onDeviceNotFound,
}: Readonly<AddNewDeviceStateProps>): React.ReactNode {
  useSheetBack(state.back);
  const addFlowState = state.connectNewDeviceUIState;

  switch (addFlowState.type) {
    case ConnectNewDeviceUIStateTypes.Discovering:
      return (
        <DiscoveringView
          state={addFlowState}
          onDeviceNotFound={onDeviceNotFound}
          Layout={SheetStateLayout}
        />
      );
    case ConnectNewDeviceUIStateTypes.Connecting:
      return <ConnectingView state={addFlowState} Layout={SheetStateLayout} />;
    case ConnectNewDeviceUIStateTypes.Connected:
      return <ConnectedView state={addFlowState} Layout={SheetStateLayout} />;
    case ConnectNewDeviceUIStateTypes.DiscoveryError:
      return <DiscoveryErrorState state={addFlowState} platform={platform} />;
    case ConnectNewDeviceUIStateTypes.ConnectionError:
      return <ConnectionErrorState state={addFlowState} />;
    default:
      return assertNever(addFlowState);
  }
}

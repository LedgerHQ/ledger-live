import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { ConnectNewDeviceUIStateTypes } from "@ledgerhq/live-dmk-mobile";
import {
  ConnectionErrorState,
  DiscoveryErrorState,
  UnknownErrorState,
} from "LLM/components/DeviceConnection";
import { ConnectedView } from "./components/ConnectedView";
import { ConnectingView } from "./components/ConnectingView";
import { DiscoveringView } from "./components/DiscoveringView";
import { ErrorBottomSheet } from "./components/ErrorBottomSheet";
import type { ConnectNewDeviceErrorUIState, ConnectNewDeviceNonErrorUIState } from "./types";
import { isErrorState, type ConnectNewDeviceViewModel } from "./useConnectNewDeviceViewModel";

function assertNever(value: never): never {
  throw new Error(`Unhandled connect new device state: ${JSON.stringify(value)}`);
}

function NonErrorStateView({
  state,
  onDeviceNotFound,
}: Readonly<{
  state: ConnectNewDeviceNonErrorUIState;
  onDeviceNotFound?: () => void;
}>): React.ReactNode {
  switch (state.type) {
    case ConnectNewDeviceUIStateTypes.Discovering:
      return <DiscoveringView state={state} onDeviceNotFound={onDeviceNotFound} />;
    case ConnectNewDeviceUIStateTypes.Connecting:
      return <ConnectingView state={state} />;
    case ConnectNewDeviceUIStateTypes.Connected:
    case ConnectNewDeviceUIStateTypes.Done:
      return <ConnectedView state={state} />;
    case ConnectNewDeviceUIStateTypes.Terminated:
      return null;
    default:
      return assertNever(state);
  }
}

function ErrorStateView({
  state,
  platform,
}: Readonly<{
  state: ConnectNewDeviceErrorUIState;
  platform: ConnectNewDeviceViewModel["platform"];
}>): React.ReactNode {
  switch (state.type) {
    case ConnectNewDeviceUIStateTypes.DiscoveryError:
      return <DiscoveryErrorState state={state} platform={platform} />;
    case ConnectNewDeviceUIStateTypes.ConnectionError:
      return <ConnectionErrorState state={state} />;
    case ConnectNewDeviceUIStateTypes.UnknownError:
      return <UnknownErrorState />;
    default:
      return assertNever(state);
  }
}

export function ConnectNewDeviceView({
  state,
  lastNonErrorState,
  platform,
  onDeviceNotFound,
  onCloseErrorSheet,
}: Readonly<ConnectNewDeviceViewModel>) {
  // An error shows in the sheet, over the last view before it.
  const nonErrorState = isErrorState(state) ? lastNonErrorState : state;
  const errorState = isErrorState(state) ? state : null;

  return (
    <Box lx={{ flex: 1, backgroundColor: "canvas" }}>
      <NonErrorStateView state={nonErrorState} onDeviceNotFound={onDeviceNotFound} />
      <ErrorBottomSheet isOpen={errorState !== null} onClose={onCloseErrorSheet}>
        {errorState && <ErrorStateView state={errorState} platform={platform} />}
      </ErrorBottomSheet>
    </Box>
  );
}

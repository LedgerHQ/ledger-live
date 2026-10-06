import React from "react";
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
import type { ConnectNewDeviceNonErrorUIState } from "./types";
import type { ConnectNewDeviceViewModel } from "./useConnectNewDeviceViewModel";

function assertNever(value: never): never {
  throw new Error(`Unhandled connect new device state: ${JSON.stringify(value)}`);
}

function NonErrorStateView({
  state,
  onDeviceNotFound,
}: Readonly<{
  state: ConnectNewDeviceNonErrorUIState;
  onDeviceNotFound: () => void;
}>): React.ReactNode {
  switch (state.type) {
    case ConnectNewDeviceUIStateTypes.Discovering:
      return <DiscoveringView state={state} onDeviceNotFound={onDeviceNotFound} />;
    case ConnectNewDeviceUIStateTypes.Connecting:
      return <ConnectingView state={state} />;
    case ConnectNewDeviceUIStateTypes.Connected:
    case ConnectNewDeviceUIStateTypes.Done:
      return <ConnectedView />;
    case ConnectNewDeviceUIStateTypes.Terminated:
      return null;
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
  let nonErrorState: ConnectNewDeviceNonErrorUIState;
  let error: React.ReactNode = null;

  switch (state.type) {
    case ConnectNewDeviceUIStateTypes.DiscoveryError:
      nonErrorState = lastNonErrorState;
      error = <DiscoveryErrorState state={state} platform={platform} />;
      break;
    case ConnectNewDeviceUIStateTypes.ConnectionError:
      nonErrorState = lastNonErrorState;
      error = <ConnectionErrorState state={state} />;
      break;
    case ConnectNewDeviceUIStateTypes.UnknownError:
      nonErrorState = lastNonErrorState;
      error = <UnknownErrorState />;
      break;
    case ConnectNewDeviceUIStateTypes.Discovering:
    case ConnectNewDeviceUIStateTypes.Connecting:
    case ConnectNewDeviceUIStateTypes.Connected:
    case ConnectNewDeviceUIStateTypes.Done:
    case ConnectNewDeviceUIStateTypes.Terminated:
      nonErrorState = state;
      break;
    default:
      return assertNever(state);
  }

  return (
    <>
      <NonErrorStateView state={nonErrorState} onDeviceNotFound={onDeviceNotFound} />
      <ErrorBottomSheet isOpen={error !== null} onClose={onCloseErrorSheet}>
        {error}
      </ErrorBottomSheet>
    </>
  );
}

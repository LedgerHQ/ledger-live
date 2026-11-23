import React from "react";
import { ConnectDeviceUIStateTypes } from "@ledgerhq/live-dmk-mobile";
import { LoadingState } from "./components/LoadingState";
import { NoKnownDeviceState } from "./components/NoKnownDeviceState";
import { DiscoveringState } from "./components/DiscoveringState";
import { WaitingForSelectedDeviceState } from "./components/WaitingForSelectedDeviceState";
import { DiscoveryErrorState } from "./components/DiscoveryErrorState";
import { ConnectingState } from "./components/ConnectingState";
import { ConnectedState } from "./components/ConnectedState";
import { ConnectionErrorState } from "./components/ConnectionErrorState";
import { UnknownErrorState } from "./components/UnknownErrorState";
import { AddNewDeviceState } from "./components/AddNewDeviceState";
import type { ConnectionViewModel } from "./useConnectionViewModel";

function assertNever(value: never): never {
  throw new Error(`Unhandled connect device state: ${JSON.stringify(value)}`);
}

export function ConnectionView({
  state,
  platform,
  onConnectLedgerDevice,
  onBuyLedgerDevice,
  onDeviceNotFound,
}: Readonly<ConnectionViewModel>) {
  switch (state.type) {
    case ConnectDeviceUIStateTypes.Loading:
      return <LoadingState />;

    case ConnectDeviceUIStateTypes.NoKnownDevice:
      return (
        <NoKnownDeviceState
          onConnectLedgerDevice={state.addNewDevice ?? onConnectLedgerDevice}
          onBuyLedgerDevice={onBuyLedgerDevice}
        />
      );

    case ConnectDeviceUIStateTypes.Discovering:
      return <DiscoveringState state={state} />;

    case ConnectDeviceUIStateTypes.WaitingForSelectedDevice:
      return <WaitingForSelectedDeviceState state={state} />;

    case ConnectDeviceUIStateTypes.DiscoveryError:
      return <DiscoveryErrorState state={state} platform={platform} />;

    case ConnectDeviceUIStateTypes.Connecting:
      return <ConnectingState state={state} />;

    case ConnectDeviceUIStateTypes.ConnectionError:
      return <ConnectionErrorState state={state} />;

    case ConnectDeviceUIStateTypes.Connected:
      return <ConnectedState />;

    case ConnectDeviceUIStateTypes.UnknownError:
      return <UnknownErrorState state={state} />;

    case ConnectDeviceUIStateTypes.ConnectNewDevice:
      return (
        <AddNewDeviceState state={state} platform={platform} onDeviceNotFound={onDeviceNotFound} />
      );

    default:
      return assertNever(state);
  }
}

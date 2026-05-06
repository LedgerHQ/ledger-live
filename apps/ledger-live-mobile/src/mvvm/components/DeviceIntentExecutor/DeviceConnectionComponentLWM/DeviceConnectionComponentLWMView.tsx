import React from "react";
import { ConnectDeviceUIStateTypes } from "@ledgerhq/live-dmk-mobile";
import { LoadingState } from "./state/LoadingState";
import { NoKnownDeviceState } from "./state/NoKnownDeviceState";
import { DiscoveringState } from "./state/DiscoveringState";
import { WaitingForSelectedDeviceState } from "./state/WaitingForSelectedDeviceState";
import { DiscoveryErrorState } from "./state/DiscoveryErrorState";
import { ConnectingState } from "./state/ConnectingState";
import { ConnectionErrorState } from "./state/ConnectionErrorState";
import type { DeviceConnectionComponentLWMViewModel } from "./useDeviceConnectionComponentLWMViewModel";

function assertNever(value: never): never {
  throw new Error(`Unhandled connect device state: ${JSON.stringify(value)}`);
}

export function DeviceConnectionComponentLWMView({
  state,
  onConnectLedgerDevice,
  onBuyLedgerDevice,
}: DeviceConnectionComponentLWMViewModel) {
  switch (state.type) {
    case ConnectDeviceUIStateTypes.Loading:
      return <LoadingState />;

    case ConnectDeviceUIStateTypes.NoKnownDevice:
      return (
        <NoKnownDeviceState
          onConnectLedgerDevice={onConnectLedgerDevice}
          onBuyLedgerDevice={onBuyLedgerDevice}
        />
      );

    case ConnectDeviceUIStateTypes.Discovering:
      return <DiscoveringState state={state} />;

    case ConnectDeviceUIStateTypes.WaitingForSelectedDevice:
      return <WaitingForSelectedDeviceState state={state} />;

    case ConnectDeviceUIStateTypes.DiscoveryError:
      return <DiscoveryErrorState state={state} />;

    case ConnectDeviceUIStateTypes.Connecting:
      return <ConnectingState />;

    case ConnectDeviceUIStateTypes.ConnectionError:
      return <ConnectionErrorState state={state} />;

    case ConnectDeviceUIStateTypes.Connected:
      return null;

    default:
      return assertNever(state);
  }
}

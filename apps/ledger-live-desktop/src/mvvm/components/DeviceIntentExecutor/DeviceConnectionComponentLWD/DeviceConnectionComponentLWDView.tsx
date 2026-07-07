import React from "react";
import { ConnectDeviceUIStateTypes } from "@ledgerhq/live-dmk-desktop";

import { ConnectedState } from "./components/ConnectedState";
import { ConnectingState } from "./components/ConnectingState";
import { ConnectionErrorState } from "./components/ConnectionErrorState";
import { DiscoveringState } from "./components/DiscoveringState";
import { DiscoveryErrorState } from "./components/DiscoveryErrorState";
import { LoadingState } from "./components/LoadingState";
import { NoKnownDeviceState } from "./components/NoKnownDeviceState";
import { UnknownErrorState } from "./components/UnknownErrorState";
import { WaitingForSelectedDeviceState } from "./components/WaitingForSelectedDeviceState";
import type { DeviceConnectionComponentLWDViewModel } from "./useDeviceConnectionComponentLWDViewModel";

function assertNever(value: never): never {
  throw new Error(`Unhandled connect device state: ${JSON.stringify(value)}`);
}

export function DeviceConnectionComponentLWDView({
  state,
  onConnectLedgerDevice,
  onBuyLedgerDevice,
}: Readonly<DeviceConnectionComponentLWDViewModel>) {
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
      return <ConnectingState state={state} />;

    case ConnectDeviceUIStateTypes.ConnectionError:
      return <ConnectionErrorState state={state} />;

    case ConnectDeviceUIStateTypes.Connected:
      return <ConnectedState />;

    case ConnectDeviceUIStateTypes.UnknownError:
      return <UnknownErrorState />;

    default:
      return assertNever(state);
  }
}

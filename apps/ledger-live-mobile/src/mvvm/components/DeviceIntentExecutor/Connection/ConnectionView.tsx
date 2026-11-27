import React from "react";
import { ConnectDeviceUIStateTypes } from "@ledgerhq/live-dmk-mobile";
import {
  TrackedConnectingState,
  TrackedConnectionErrorState,
  TrackedDiscoveryErrorState,
  TrackedUnknownErrorState,
  TrackedWaitingForSelectedDeviceState,
} from "LLM/components/DeviceConnection";
import { LoadingState } from "./components/LoadingState";
import { NoKnownDeviceState } from "./components/NoKnownDeviceState";
import { DiscoveringState } from "./components/DiscoveringState";
import { ConnectedState } from "./components/ConnectedState";
import type { ConnectionViewModel } from "./useConnectionViewModel";

function assertNever(value: never): never {
  throw new Error(`Unhandled connect device state: ${JSON.stringify(value)}`);
}

export function ConnectionView({
  state,
  platform,
  onConnectLedgerDevice,
  onBuyLedgerDevice,
}: Readonly<ConnectionViewModel>) {
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
      return <TrackedWaitingForSelectedDeviceState device={state.device} />;

    case ConnectDeviceUIStateTypes.DiscoveryError:
      return <TrackedDiscoveryErrorState state={state} platform={platform} />;

    case ConnectDeviceUIStateTypes.Connecting:
      return <TrackedConnectingState device={state.device} />;

    case ConnectDeviceUIStateTypes.ConnectionError:
      return <TrackedConnectionErrorState state={state} />;

    case ConnectDeviceUIStateTypes.Connected:
      return <ConnectedState />;

    case ConnectDeviceUIStateTypes.UnknownError:
      return <TrackedUnknownErrorState state={state} />;

    default:
      return assertNever(state);
  }
}

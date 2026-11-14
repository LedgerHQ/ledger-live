import React from "react";
import { ConnectKnownOrNewDeviceView } from "./ConnectKnownOrNewDeviceView";
import type { ConnectKnownOrNewDeviceProps } from "./types";
import { useConnectKnownOrNewDeviceViewModel } from "./useConnectKnownOrNewDeviceViewModel";

export type { ConnectKnownOrNewDeviceDelays, ConnectKnownOrNewDeviceProps } from "./types";

/**
 * The device section of My Wallet: lists the known, connected and discovered devices, connects
 * one, and pairs a new device in its Add mode. It has no end and does no navigation: the caller
 * reacts to `onConnected` and `onAddModeChange`.
 */
export function ConnectKnownOrNewDevice(props: Readonly<ConnectKnownOrNewDeviceProps>) {
  const viewModel = useConnectKnownOrNewDeviceViewModel(props);

  return <ConnectKnownOrNewDeviceView {...viewModel} />;
}

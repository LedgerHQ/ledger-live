import React from "react";
import { DeviceIntentTrackingProvider } from "LLM/components/DeviceIntentExecutor/utils/DeviceIntentTrackingContext";
import { ConnectKnownOrNewDeviceView } from "./ConnectKnownOrNewDeviceView";
import type { ConnectKnownOrNewDeviceProps } from "./types";
import { useConnectKnownOrNewDeviceViewModel } from "./useConnectKnownOrNewDeviceViewModel";

export type { ConnectKnownOrNewDeviceProps } from "./types";

/**
 * The device section of My Wallet: lists the known, connected and discovered devices, connects
 * one, and pairs a new device in its Add mode. It has no end and does no navigation: the caller
 * reacts to `onConnected` and `onAddModeChange`. It sends its analytics events itself, with the
 * `sourceFlow` of the caller.
 */
export function ConnectKnownOrNewDevice(props: Readonly<ConnectKnownOrNewDeviceProps>) {
  const viewModel = useConnectKnownOrNewDeviceViewModel(props);

  return (
    <DeviceIntentTrackingProvider value={{ sourceFlow: props.sourceFlow }}>
      <ConnectKnownOrNewDeviceView {...viewModel} />
    </DeviceIntentTrackingProvider>
  );
}

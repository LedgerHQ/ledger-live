import React from "react";
import { ConnectNewDeviceView } from "./ConnectNewDeviceView";
import type { ConnectNewDeviceProps } from "./types";
import { useConnectNewDeviceViewModel } from "./useConnectNewDeviceViewModel";

export type {
  ConnectNewDeviceDelays,
  ConnectNewDeviceProps,
  ConnectNewDeviceViewProps,
} from "./types";
export { ConnectNewDeviceView } from "./ConnectNewDeviceView";
export { isErrorState } from "./utils/isErrorState";

/**
 * Discovers and connects a device the app does not know yet. It shows no top bar and does no
 * navigation: the caller reacts to `onConnected`, `onClose` and the optional `onDeviceNotFound`.
 */
export function ConnectNewDevice(props: Readonly<ConnectNewDeviceProps>) {
  const viewModel = useConnectNewDeviceViewModel(props);

  return <ConnectNewDeviceView {...viewModel} />;
}

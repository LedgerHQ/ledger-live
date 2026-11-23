import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { ConnectNewDeviceView } from "./ConnectNewDeviceView";
import type { ConnectNewDeviceProps } from "./types";
import { useConnectNewDeviceViewModel } from "./useConnectNewDeviceViewModel";

export type {
  ConnectNewDeviceDelays,
  ConnectNewDeviceProps,
  ConnectNewDeviceViewProps,
  StateLayoutComponent,
  StateLayoutProps,
} from "./types";
export { ConnectNewDeviceView } from "./ConnectNewDeviceView";
export { ConnectedView } from "./components/ConnectedView";
export { ConnectingView } from "./components/ConnectingView";
export { DiscoveringView } from "./components/DiscoveringView";
export { SheetStateLayout } from "./components/SheetStateLayout";
export { isErrorState } from "./utils/isErrorState";

/**
 * Discovers and connects a device the app does not know yet. It shows no top bar and does no
 * navigation: the caller reacts to `onConnected`, `onClose` and the optional `onDeviceNotFound`.
 */
export function ConnectNewDevice(props: Readonly<ConnectNewDeviceProps>) {
  const viewModel = useConnectNewDeviceViewModel(props);

  return (
    <Box lx={{ flex: 1, paddingHorizontal: "s16", backgroundColor: "canvas" }}>
      <ConnectNewDeviceView {...viewModel} />
    </Box>
  );
}

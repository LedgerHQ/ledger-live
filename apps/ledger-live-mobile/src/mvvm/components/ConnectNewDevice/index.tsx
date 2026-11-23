import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { DeviceIntentTrackingProvider } from "LLM/components/DeviceIntentExecutor/utils/DeviceIntentTrackingContext";
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
 * It sends its analytics events itself, with the `sourceFlow` of the caller.
 */
export function ConnectNewDevice(props: Readonly<ConnectNewDeviceProps>) {
  const viewModel = useConnectNewDeviceViewModel(props);

  return (
    <DeviceIntentTrackingProvider value={{ sourceFlow: props.sourceFlow }}>
      <Box lx={{ flex: 1, paddingHorizontal: "s16", backgroundColor: "canvas" }}>
        <ConnectNewDeviceView {...viewModel} />
      </Box>
    </DeviceIntentTrackingProvider>
  );
}

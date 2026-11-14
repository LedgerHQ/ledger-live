import {
  ConnectKnownOrNewDeviceUIStateTypes,
  type ConnectKnownOrNewDeviceUIState,
} from "@ledgerhq/live-dmk-mobile";
import type { ConnectKnownOrNewDeviceErrorUIState } from "../types";

const ERROR_STATE_TYPES = new Set<ConnectKnownOrNewDeviceUIState["type"]>([
  ConnectKnownOrNewDeviceUIStateTypes.DiscoveryError,
  ConnectKnownOrNewDeviceUIStateTypes.ConnectionError,
  ConnectKnownOrNewDeviceUIStateTypes.UnknownError,
]);

export function isErrorState(
  state: ConnectKnownOrNewDeviceUIState,
): state is ConnectKnownOrNewDeviceErrorUIState {
  return ERROR_STATE_TYPES.has(state.type);
}

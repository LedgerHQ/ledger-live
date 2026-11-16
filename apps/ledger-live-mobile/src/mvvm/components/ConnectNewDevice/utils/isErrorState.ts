import {
  ConnectNewDeviceUIStateTypes,
  type ConnectNewDeviceUIState,
} from "@ledgerhq/live-dmk-mobile";
import type { ConnectNewDeviceErrorUIState } from "../types";

const ERROR_STATE_TYPES = new Set<ConnectNewDeviceUIState["type"]>([
  ConnectNewDeviceUIStateTypes.DiscoveryError,
  ConnectNewDeviceUIStateTypes.ConnectionError,
  ConnectNewDeviceUIStateTypes.UnknownError,
]);

export function isErrorState(
  state: ConnectNewDeviceUIState,
): state is ConnectNewDeviceErrorUIState {
  return ERROR_STATE_TYPES.has(state.type);
}

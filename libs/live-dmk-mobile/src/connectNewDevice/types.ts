import type { ConnectNewDeviceUIState } from "@ledgerhq/live-dmk-shared";
import type { MobileConnectionError, MobileDiscoveryError } from "../deviceConnectivity/types";

export { ConnectNewDeviceUIStateTypes } from "@ledgerhq/live-dmk-shared";

export type MobileConnectNewDeviceUIState = ConnectNewDeviceUIState<
  MobileDiscoveryError,
  MobileConnectionError
>;

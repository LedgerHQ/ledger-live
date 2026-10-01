import type { ConnectDeviceUIState } from "@ledgerhq/live-dmk-shared";
import type { MobileConnectionError, MobileDiscoveryError } from "../deviceConnectivity/types";

export { ConnectDeviceUIStateTypes } from "@ledgerhq/live-dmk-shared";

export type MobileConnectDeviceUIState = ConnectDeviceUIState<
  MobileDiscoveryError,
  MobileConnectionError
>;

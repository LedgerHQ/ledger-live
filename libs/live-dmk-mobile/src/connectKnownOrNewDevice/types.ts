import type {
  ConnectKnownOrNewDeviceUIState,
  ConnectKnownOrNewDeviceUseCaseOutput,
} from "@ledgerhq/live-dmk-shared";
import type { MobileConnectionError, MobileDiscoveryError } from "../deviceConnectivity/types";

export { ConnectKnownOrNewDeviceUIStateTypes } from "@ledgerhq/live-dmk-shared";

export type MobileConnectKnownOrNewDeviceUIState = ConnectKnownOrNewDeviceUIState<
  MobileDiscoveryError,
  MobileConnectionError
>;

export type MobileConnectKnownOrNewDevice = ConnectKnownOrNewDeviceUseCaseOutput<
  MobileDiscoveryError,
  MobileConnectionError
>;

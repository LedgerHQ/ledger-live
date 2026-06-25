import type {
  ConnectDeviceUIState,
  UnknownConnectionError,
  UnknownDiscoveryError,
} from "@ledgerhq/live-dmk-shared";

export {
  BaseConnectionErrorTypes,
  BaseDiscoveryErrorTypes,
  ConnectDeviceUIStateTypes,
} from "@ledgerhq/live-dmk-shared";

export type DesktopConnectionError = UnknownConnectionError;

export type DesktopDiscoveryError = UnknownDiscoveryError;

export type DesktopConnectDeviceUIState = ConnectDeviceUIState<
  DesktopDiscoveryError,
  DesktopConnectionError
>;

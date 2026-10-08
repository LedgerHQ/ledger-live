export * from "./hooks/useDeviceManagementKit";
export { DeviceManagementKitTransport } from "./transport/DeviceManagementKitTransport";
export {
  isAllowedOnboardingStatePollingErrorDmk,
  isDisconnectedWhileSendingApduError,
  isInvalidGetFirmwareMetadataResponseError,
  isDmkError,
} from "./errors";
export {
  BaseConnectionErrorTypes,
  BaseDiscoveryErrorTypes,
  ConnectDeviceUIStateTypes,
  type DesktopConnectionError as ConnectionError,
  type DesktopDiscoveryError as DiscoveryError,
  type DesktopConnectDeviceUIState as ConnectDeviceUIState,
} from "./connectDevice/types";
export { useActiveMockServerDeviceId } from "./mockServer/useActiveMockServerDeviceId";
export type { DisplayedDevice } from "@ledgerhq/live-dmk-shared";
export { connectDevice, type ConnectDeviceInput } from "./connectDevice/connectDevice";
export { webHidIdentifier as webHidTransportIdentifier } from "@ledgerhq/device-transport-kit-web-hid";
export { mockserverIdentifier } from "@ledgerhq/device-transport-kit-mockserver";
export type { DmkError } from "@ledgerhq/device-management-kit";

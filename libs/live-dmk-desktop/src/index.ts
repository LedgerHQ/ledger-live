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
export { useDeviceScreen, type DeviceScreenSource } from "./deviceScreen/useDeviceScreen";
export type { ScreenApi } from "./deviceScreen/screenApi";
export type { DeviceScreenInput, DeviceScreenState } from "./deviceScreen/types";
// Re-exported so consumers rendering the screen need not depend on the mock
// server client directly — it stays an implementation detail of this layer.
export type {
  Device as MockServerDevice,
  SpeculosAction,
  SpeculosButton,
} from "@ledgerhq/device-mockserver-client";
export type { DisplayedDevice } from "@ledgerhq/live-dmk-shared";
export { connectDevice, type ConnectDeviceInput } from "./connectDevice/connectDevice";
export { webHidIdentifier as webHidTransportIdentifier } from "@ledgerhq/device-transport-kit-web-hid";
export type { DmkError } from "@ledgerhq/device-management-kit";

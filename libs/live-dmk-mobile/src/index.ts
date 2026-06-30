export { DeviceManagementKitBLETransport } from "./transport/DeviceManagementKitBLETransport";
export { DeviceManagementKitHIDTransport } from "./transport/DeviceManagementKitHIDTransport";
export { DeviceManagementKitHTTPProxyTransport } from "./transport/DeviceManagementKitHTTPProxyTransport";
export { rnBleTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-ble";
export { rnHidTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-hid";
export {
  BaseConnectionErrorTypes,
  BaseDiscoveryErrorTypes,
  ConnectDeviceUIStateTypes,
  ConnectionErrorTypes,
  DiscoveryErrorTypes,
  type MobileConnectionError as ConnectionError,
  type MobileDiscoveryError as DiscoveryError,
  type MobileConnectDeviceUIState as ConnectDeviceUIState,
} from "./connectDevice/types";
export type { DisplayedDevice } from "@ledgerhq/live-dmk-shared";
export { connectDevice, type ConnectDeviceInput } from "./connectDevice/connectDevice";
export * from "./errors";
export * from "./hooks";
export * from "./utils/matchDevicesByNameOrId";
export { type DmkError } from "@ledgerhq/device-management-kit";

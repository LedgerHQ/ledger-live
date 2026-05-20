export { DeviceManagementKitBLETransport } from "./transport/DeviceManagementKitBLETransport";
export { DeviceManagementKitHIDTransport } from "./transport/DeviceManagementKitHIDTransport";
export { DeviceManagementKitHTTPProxyTransport } from "./transport/DeviceManagementKitHTTPProxyTransport";
export { rnBleTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-ble";
export { rnHidTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-hid";
export { DefaultDeviceDiscoveryService } from "./connectDevice/discoveryService/DefaultDeviceDiscoveryService";
export {
  ConnectDeviceUIStateTypes,
  ConnectionErrorTypes,
  DiscoveryErrorTypes,
  type DeviceDiscoveryService,
  type DeviceDiscoveryStartArgs,
  type DiscoveryError,
  type DiscoveryErrorResolution,
  type DisplayedDevice,
  type ConnectDeviceUIState,
  type ConnectionError,
} from "./connectDevice/types";
export { connectDeviceUseCase, type ConnectDeviceUseCaseInput } from "./connectDevice/connectDeviceUseCase";
export * from "./errors";
export * from "./hooks";
export * from "./utils/matchDevicesByNameOrId";
export { type DmkError } from "@ledgerhq/device-management-kit";

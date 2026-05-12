export { DeviceManagementKitBLETransport } from "./transport/DeviceManagementKitBLETransport";
export { DeviceManagementKitHIDTransport } from "./transport/DeviceManagementKitHIDTransport";
export { DeviceManagementKitHTTPProxyTransport } from "./transport/DeviceManagementKitHTTPProxyTransport";
export { rnBleTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-ble";
export { rnHidTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-hid";
export { DefaultDeviceDiscoveryService } from "./connectDevice/discoveryService/DefaultDeviceDiscoveryService";
export {
  DiscoveryErrors,
  type DeviceDiscoveryService,
  type DeviceDiscoveryStartArgs,
  type DiscoveryError,
  type DiscoveryErrorResolution,
} from "./connectDevice/types";
export * from "./errors";
export * from "./hooks";
export * from "./utils/matchDevicesByNameOrId";
export { type DmkError } from "@ledgerhq/device-management-kit";

import { useDeviceSessionState } from "@ledgerhq/live-dmk-shared";

export { DeviceManagementKitBLETransport } from "./transport/DeviceManagementKitBLETransport";
export { DeviceManagementKitHIDTransport } from "./transport/DeviceManagementKitHIDTransport";
export { DeviceManagementKitHTTPProxyTransport } from "./transport/DeviceManagementKitHTTPProxyTransport";
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
export { useDeviceSessionState };
export { type DmkError } from "@ledgerhq/device-management-kit";

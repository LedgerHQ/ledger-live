import { HIDDiscoveredDevice, ScannedDevice } from "@ledgerhq/live-dmk-mobile";
import { DisplayedAvailableDevice, DisplayedDevice } from "./DisplayedDevice";
import { DeviceLike } from "~/reducers/types";
import { WsProxyDiscoveredDevice } from "@ledgerhq/live-dmk-ws-proxy-client";

export function mapScannedDeviceToDisplayedAvailableDevice(
  scannedDevice: ScannedDevice,
): DisplayedAvailableDevice {
  return {
    device: {
      deviceId: scannedDevice.deviceId,
      deviceName: scannedDevice.deviceName,
      modelId: scannedDevice.modelId,
      wired: false,
    },
    available: true,
    discoveredDevice: scannedDevice.discoveredDevice,
  };
}

export function mapHidDeviceToDisplayedAvailableDevice(
  hidDevice: HIDDiscoveredDevice,
): DisplayedAvailableDevice {
  return {
    device: {
      deviceId: hidDevice.deviceId,
      deviceName: hidDevice.deviceName,
      modelId: hidDevice.modelId,
      wired: true,
    },
    available: true,
    discoveredDevice: hidDevice.discoveredDevice,
  };
}

export function mapWsProxyDeviceToDisplayedAvailableDevice(
  wsProxyDevice: WsProxyDiscoveredDevice,
): DisplayedAvailableDevice {
  return {
    device: {
      deviceId: wsProxyDevice.deviceId,
      deviceName: wsProxyDevice.deviceName,
      modelId: wsProxyDevice.modelId,
      wired: true,
    },
    available: true,
    discoveredDevice: wsProxyDevice.discoveredDevice,
  };
}

export function mapDeviceLikeToDisplayedDevice(deviceLike: DeviceLike): DisplayedDevice {
  return {
    device: {
      deviceId: deviceLike.id,
      deviceName: deviceLike.name,
      modelId: deviceLike.modelId,
      wired: false,
    },
    available: false,
  };
}

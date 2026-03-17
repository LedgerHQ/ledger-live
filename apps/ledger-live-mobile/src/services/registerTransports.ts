import Config from "react-native-config";
import { registerTransportModule } from "@ledgerhq/live-common/hw/index";
import getBLETransport from "~/transport/bleTransport";
import { DeviceManagementKitHIDTransport, getDeviceManagementKit } from "@ledgerhq/live-dmk-mobile";
import { WsProxyLegacyTransportCompat } from "@ledgerhq/live-dmk-ws-proxy-client";
import { DeviceManagementKitTransportSpeculos } from "@ledgerhq/live-dmk-speculos";
import { retry } from "@ledgerhq/live-common/promise";

const SPECULOS_PREFIX = "speculos|";

/**
 * Registers transport modules for different connection types (BLE, HID, WS proxy, Speculos).
 *
 */
export const registerTransports = () => {
  if (Config.BLE_LOG_LEVEL) {
    getBLETransport().setLogLevel(Config.BLE_LOG_LEVEL);
  }

  registerTransportModule({
    id: "hid",
    open: (id, timeoutMs, traceContext) => {
      if (id.startsWith("usb|")) {
        const devicePath = JSON.parse(id.slice(4));
        return DeviceManagementKitHIDTransport.open(devicePath, timeoutMs, traceContext);
      }
      return null;
    },
    disconnect: () => Promise.resolve(),
  });

  if (Config.DETOX) {
    registerTransportModule({
      id: "speculos",
      open: id => {
        if (!id.startsWith(SPECULOS_PREFIX)) return null;
        const baseURL = id.slice(SPECULOS_PREFIX.length);
        return retry(() => DeviceManagementKitTransportSpeculos.open({ baseURL }));
      },
      disconnect: id => (id.startsWith(SPECULOS_PREFIX) ? Promise.resolve() : null),
    });
  }

  registerTransportModule({
    id: "wsHidProxy",
    open: (id, timeoutMs, traceContext) => {
      if (id.startsWith("wsHidProxy|")) {
        const deviceId = id.slice(11);
        return WsProxyLegacyTransportCompat.open(
          deviceId,
          timeoutMs,
          traceContext,
          getDeviceManagementKit(),
        );
      }
      return null;
    },
    disconnect: id => (id.startsWith("wsHidProxy|") ? Promise.resolve() : null),
  });

  // BLE is always the fallback choice because we always keep raw id in it
  registerTransportModule({
    id: "ble",
    open: (id, timeoutMs, traceContext, matchDeviceByName) =>
      getBLETransport().open(id, timeoutMs, traceContext, { matchDeviceByName }),
    disconnect: id => getBLETransport().disconnectDevice(id),
  });
};

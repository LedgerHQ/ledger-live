import Config from "react-native-config";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import withStaticURLs from "@ledgerhq/hw-transport-http";
import { registerTransportModule, type TransportModule } from "@ledgerhq/live-common/hw/index";
import { getDeviceModel } from "@ledgerhq/devices";
import { DescriptorEvent } from "@ledgerhq/hw-transport";
import { DeviceModelId } from "@ledgerhq/types-devices";
import getBLETransport from "~/transport/bleTransport";
import {
  DeviceManagementKitHIDTransport,
  DeviceManagementKitHTTPProxyTransport,
} from "@ledgerhq/live-dmk-mobile";
import { DeviceManagementKitTransportSpeculos } from "@ledgerhq/live-dmk-speculos";
import { ledgerToDmkDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import { retry } from "@ledgerhq/live-common/promise";

const SPECULOS_PREFIX = "speculos|";

// Speculos cannot tell the DMK transport which device it emulates (it defaults
// to Stax). The e2e bridge sends the real model via `setSpeculosDeviceModel`,
// which we then forward when opening the transport so the app behaves like it.
let speculosDeviceModel: DeviceModelId | undefined;

export function setSpeculosDeviceModel(model?: DeviceModelId) {
  speculosDeviceModel = model;
}

/**
 * Registers transport modules for different connection types (BLE, HID, HTTP Debug, Speculos).
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
        const model = speculosDeviceModel ? ledgerToDmkDeviceIdMap[speculosDeviceModel] : undefined;
        return retry(() => DeviceManagementKitTransportSpeculos.open({ baseURL, model }));
      },
      disconnect: id => (id.startsWith(SPECULOS_PREFIX) ? Promise.resolve() : null),
    });
  }

  // Dev-only HTTP proxy transport. Gated on __DEV__ so production builds don't expose
  // an `open` path that would accept arbitrary URLs. The module is registered for the
  // whole __DEV__ build so the runtime "Settings > Debug > Connectivity > HTTP transport"
  // flow can supply a URL at runtime; build-time URL polling is opt-in via DEVICE_PROXY_URL.
  if (__DEV__) {
    const httpdebug: TransportModule = {
      id: "httpdebug",
      open: id =>
        id.startsWith("httpdebug|")
          ? DeviceManagementKitHTTPProxyTransport.open(id.slice("httpdebug|".length))
          : null,
      disconnect: id =>
        id.startsWith("httpdebug|")
          ? Promise.resolve() // nothing to do
          : null,
    };
    if (Config.DEVICE_PROXY_URL) {
      const DebugHttpProxy = withStaticURLs(Config.DEVICE_PROXY_URL.split("|"));
      httpdebug.discovery = new Observable<DescriptorEvent<string>>(o =>
        DebugHttpProxy.listen(o),
      ).pipe(
        map(({ type, descriptor }) => ({
          type,
          id: `httpdebug|${descriptor}`,
          deviceModel: getDeviceModel(
            (Config?.FALLBACK_DEVICE_MODEL_ID as DeviceModelId) || DeviceModelId.nanoX,
          ),
          wired: Config?.FALLBACK_DEVICE_WIRED === "YES",
          name: descriptor,
        })),
      );
    }
    registerTransportModule(httpdebug);
  }

  // BLE is always the fallback choice because we always keep raw id in it
  registerTransportModule({
    id: "ble",
    open: (id, timeoutMs, traceContext, matchDeviceByName) =>
      getBLETransport().open(id, timeoutMs, traceContext, { matchDeviceByName }),
    disconnect: id => getBLETransport().disconnectDevice(id),
  });
};

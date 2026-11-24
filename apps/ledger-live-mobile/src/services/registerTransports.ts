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
  getDeviceManagementKit,
  isSpeculosLegacyDeviceId,
  isUsbCompatDeviceId,
} from "@ledgerhq/live-dmk-mobile";
import { AppDmkSpeculosTransport } from "@ledgerhq/live-dmk-speculos";
import {
  DeviceManagementKitMockServerTransport,
  isMockServerCompatDeviceId,
} from "@ledgerhq/live-dmk-shared";
import { retry } from "@ledgerhq/live-common/promise";

/**
 * Registers transport modules for different connection types (BLE, HID, HTTP Debug, Speculos, mock server).
 *
 */
export const registerTransports = ({
  isMockServerEnabled,
}: {
  isMockServerEnabled: () => boolean;
}) => {
  if (Config.BLE_LOG_LEVEL) {
    getBLETransport().setLogLevel(Config.BLE_LOG_LEVEL);
  }

  registerTransportModule({
    id: "hid",
    open: (id, timeoutMs, traceContext) => {
      return isUsbCompatDeviceId(id)
        ? DeviceManagementKitHIDTransport.open(id, timeoutMs, traceContext)
        : null;
    },
    disconnect: () => Promise.resolve(),
  });

  if (Config.DETOX) {
    registerTransportModule({
      id: "speculos",
      open: (id, timeoutMs) =>
        isSpeculosLegacyDeviceId(id)
          ? retry(() => AppDmkSpeculosTransport.open(getDeviceManagementKit(), timeoutMs))
          : null,
      disconnect: id => (isSpeculosLegacyDeviceId(id) ? Promise.resolve() : null),
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

  registerTransportModule({
    id: "mockserver",
    open: (id, timeoutMs) =>
      isMockServerCompatDeviceId(id) && isMockServerEnabled()
        ? DeviceManagementKitMockServerTransport.open(id, getDeviceManagementKit(), timeoutMs)
        : null,
    disconnect: id => (isMockServerCompatDeviceId(id) ? Promise.resolve() : null),
  });

  // BLE is always the fallback choice because we always keep raw id in it
  registerTransportModule({
    id: "ble",
    open: (id, timeoutMs, traceContext, matchDeviceByName) =>
      getBLETransport().open(id, timeoutMs, traceContext, { matchDeviceByName }),
    disconnect: id => getBLETransport().disconnectDevice(id),
  });
};

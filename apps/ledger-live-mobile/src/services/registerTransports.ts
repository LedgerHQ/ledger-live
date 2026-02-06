import Config from "react-native-config";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import withStaticURLs from "@ledgerhq/hw-transport-http";
import { registerTransportModule, type TransportModule } from "@ledgerhq/live-common/hw/index";
import { getDeviceModel } from "@ledgerhq/devices";
import { DescriptorEvent } from "@ledgerhq/hw-transport";
import { DeviceModelId } from "@ledgerhq/types-devices";
import getBLETransport from "~/transport/bleTransport";
import { DeviceManagementKitHIDTransport } from "@ledgerhq/live-dmk-mobile";

/**
 * Registers transport modules for different connection types (BLE, HID, HTTP Debug).
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

  // Add dev mode support of an http proxy
  let DebugHttpProxy: ReturnType<typeof withStaticURLs>;
  const httpdebug: TransportModule = {
    id: "httpdebug",
    open: id => (id.startsWith("httpdebug|") ? DebugHttpProxy.open(id.slice(10)) : null),
    disconnect: id =>
      id.startsWith("httpdebug|")
        ? Promise.resolve() // nothing to do
        : null,
  };

  if (__DEV__ && Config.DEVICE_PROXY_URL) {
    DebugHttpProxy = withStaticURLs(Config.DEVICE_PROXY_URL.split("|"));
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
  } else {
    DebugHttpProxy = withStaticURLs([]);
  }

  registerTransportModule(httpdebug);

  // BLE is always the fallback choice because we always keep raw id in it
  registerTransportModule({
    id: "ble",
    open: (id, timeoutMs, traceContext, matchDeviceByName) =>
      getBLETransport().open(id, timeoutMs, traceContext, { matchDeviceByName }),
    disconnect: id => getBLETransport().disconnectDevice(id),
  });
};

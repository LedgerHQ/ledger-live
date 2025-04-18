import Config from "react-native-config";
import { Observable, timer } from "rxjs";
import { map, debounce } from "rxjs/operators";
import withStaticURLs from "@ledgerhq/hw-transport-http";
import { retry } from "@ledgerhq/live-common/promise";
import { registerTransportModule, type TransportModule } from "@ledgerhq/live-common/hw/index";
import { getDeviceModel } from "@ledgerhq/devices";
import { DescriptorEvent } from "@ledgerhq/hw-transport";
import { DeviceModelId } from "@ledgerhq/types-devices";
import getBLETransport from "~/react-native-hw-transport-ble";
import { getHIDTransport } from "~/services/getHidTransport";

/**
 * Registers transport modules for different connection types (BLE, HID, HTTP Debug).
 *
 * @param {boolean} isLDMKEnabled - Flag to enable or disable LDMK support.
 */
export const registerTransports = (isLDMKEnabled: boolean) => {
  if (Config.BLE_LOG_LEVEL) getBLETransport({ isLDMKEnabled }).setLogLevel(Config.BLE_LOG_LEVEL);
  const hidTransport = getHIDTransport(isLDMKEnabled);

  // Add support of HID (experimental until we stabilize it)
  registerTransportModule({
    id: "hid",
    // eslint-disable-next-line consistent-return
    open: id => {
      if (id.startsWith("usb|")) {
        const devicePath = JSON.parse(id.slice(4));
        return retry(() => hidTransport.open(devicePath), { maxRetry: 2 });
      }
      return null;
    },
    disconnect: id =>
      id.startsWith("usb|") && hidTransport.disconnect
        ? hidTransport.disconnect()
        : Promise.resolve(),
    discovery: new Observable<DescriptorEvent<string>>(o => hidTransport.listen(o)).pipe(
      map(({ type, descriptor, deviceModel }) => {
        const name = deviceModel?.productName ?? "";
        return {
          type,
          id: `usb|${JSON.stringify(descriptor)}`,
          deviceModel,
          wired: true,
          name,
        };
      }),
      debounce(e => timer(e.type === "remove" ? 2000 : 0)),
    ),
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
    open: (...args) => getBLETransport({ isLDMKEnabled }).open(...args),
    disconnect: id => getBLETransport({ isLDMKEnabled }).disconnectDevice(id),
  });
};

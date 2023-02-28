import { NativeModules, DeviceEventEmitter } from "react-native";
import { ledgerUSBVendorId, identifyUSBProductId } from "@ledgerhq/devices";
import type { DeviceModel } from "@ledgerhq/devices";
import {
  DisconnectedDeviceDuringOperation,
  DisconnectedDevice,
} from "@ledgerhq/errors";
import { log } from "@ledgerhq/logs";
import Transport from "@ledgerhq/hw-transport";
import type { DescriptorEvent } from "@ledgerhq/hw-transport";
import { Subject, from, concat } from "rxjs";
import { mergeMap } from "rxjs/operators";
type DeviceObj = {
  vendorId: number;
  productId: number;
};
const disconnectedErrors = [
  "I/O error",
  "Attempt to invoke virtual method 'int android.hardware.usb.UsbDevice.getDeviceClass()' on a null object reference",
  "Invalid channel",
  "Permission denied by user for device",
];

const listLedgerDevices = async () => {
  const devices = await NativeModules.HID.getDeviceList();
  return devices.filter((d) => d.vendorId === ledgerUSBVendorId);
};

const liveDeviceEventsSubject: Subject<DescriptorEvent<any>> = new Subject();
DeviceEventEmitter.addListener("onDeviceConnect", (device: any) => {
  if (device.vendorId !== ledgerUSBVendorId) return;
  const deviceModel = identifyUSBProductId(device.productId);
  liveDeviceEventsSubject.next({
    type: "add",
    descriptor: device,
    deviceModel,
  });
});
DeviceEventEmitter.addListener("onDeviceDisconnect", (device: any) => {
  if (device.vendorId !== ledgerUSBVendorId) return;
  const deviceModel = identifyUSBProductId(device.productId);
  liveDeviceEventsSubject.next({
    type: "remove",
    descriptor: device,
    deviceModel,
  });
});
const liveDeviceEvents = liveDeviceEventsSubject;
/**
 * Ledger's React Native HID Transport implementation
 * @example
 * import TransportHID from "@ledgerhq/react-native-hid";
 * ...
 * TransportHID.create().then(transport => ...)
 */

export default class HIDTransport extends Transport {
  id: number;
  deviceModel: DeviceModel | null | undefined;

  constructor(nativeId: number, productId: number) {
    super();
    this.id = nativeId;
    this.deviceModel = identifyUSBProductId(productId);
  }

  /**
   * Check if the transport is supported (basically true on Android)
   */
  static isSupported = (): Promise<boolean> =>
    Promise.resolve(!!NativeModules.HID);

  /**
   * List currently connected devices.
   * @returns Promise of devices
   */
  static async list(): Promise<any[]> {
    if (!NativeModules.HID) return Promise.resolve([]);
    return await listLedgerDevices();
  }

  /**
   * Listen to ledger devices events
   */
  static listen(observer: any): any {
    if (!NativeModules.HID)
      return {
        unsubscribe: () => {},
      };
    return concat(
      from(listLedgerDevices()).pipe(
        mergeMap((devices) =>
          from(
            devices.map((device) => ({
              type: "add",
              descriptor: device,
              deviceModel: identifyUSBProductId(device.productId),
            }))
          )
        )
      ),
      liveDeviceEvents
    ).subscribe(observer);
  }

  /**
   * Open a the transport with a Ledger device
   */
  static async open(deviceObj: DeviceObj) {
    try {
      const nativeObj = await NativeModules.HID.openDevice(deviceObj);
      return new HIDTransport(nativeObj.id, deviceObj.productId);
    } catch (error: any) {
      if (disconnectedErrors.includes(error.message)) {
        throw new DisconnectedDevice(error.message);
      }

      throw error;
    }
  }

  /**
   * @param {*} apdu input value
   * @returns Promise of apdu response
   */
  async exchange(apdu: Buffer): Promise<any> {
    return this.exchangeAtomicImpl(async () => {
      try {
        const apduHex = apdu.toString("hex");
        log("apdu", "=> " + apduHex);
        const resultHex = await NativeModules.HID.exchange(this.id, apduHex);
        const res = Buffer.from(resultHex, "hex");
        log("apdu", "<= " + resultHex);
        return res;
      } catch (error: any) {
        if (disconnectedErrors.includes(error.message)) {
          this.emit("disconnect", error);
          throw new DisconnectedDeviceDuringOperation(error.message);
        }

        throw error;
      }
    });
  }

  /**
   * Close the transport
   * @returns Promise
   */
  async close() {
    await this.exchangeBusyPromise;
    return NativeModules.HID.closeDevice(this.id);
  }

  setScrambleKey() {}
}

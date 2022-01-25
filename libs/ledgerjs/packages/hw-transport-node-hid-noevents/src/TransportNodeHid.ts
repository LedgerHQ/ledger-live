import HID, { Device } from "node-hid";
import { log } from "@ledgerhq/logs";
import Transport, {
  Observer,
  DescriptorEvent,
  Subscription,
  Device as TransportDevice,
} from "@ledgerhq/hw-transport";
import { ledgerUSBVendorId } from "@ledgerhq/devices";
import hidFraming from "@ledgerhq/devices/lib/hid-framing";
import { identifyUSBProductId, identifyProductName } from "@ledgerhq/devices";
import { DeviceModel } from "@ledgerhq/devices";
import {
  TransportError,
  DisconnectedDevice,
  DisconnectedDeviceDuringOperation,
} from "@ledgerhq/errors";

const filterInterface = (device) =>
  ["win32", "darwin"].includes(process.platform)
    ? device.usagePage === 0xffa0
    : device.interface === 0;

export function getDevices(): (Device & { deviceName?: string })[] {
  return HID.devices(ledgerUSBVendorId, 0x0).filter(filterInterface);
}

/**
 * node-hid Transport minimal implementation
 * @example
 * import TransportNodeHid from "@ledgerhq/hw-transport-node-hid-noevents";
 * ...
 * TransportNodeHid.create().then(transport => ...)
 */

export default class TransportNodeHidNoEvents extends Transport {
  /**
   *
   */
  static isSupported = (): Promise<boolean> =>
    Promise.resolve(typeof HID.HID === "function");

  /**
   *
   */
  static list = (): Promise<any> =>
    Promise.resolve(getDevices().map((d) => d.path));

  /**
   */
  static listen = (observer: Observer<DescriptorEvent<any>>): Subscription => {
    getDevices().forEach((device) => {
      const deviceModel = identifyUSBProductId(device.productId);
      observer.next({
        type: "add",
        descriptor: device.path,
        deviceModel,
        device: (device as unknown) as TransportDevice,
      });
    });
    observer.complete();
    return {
      unsubscribe: () => {},
    };
  };

  /**
   * if path="" is not provided, the library will take the first device
   */
  static open(path: string | null | undefined) {
    return Promise.resolve().then(() => {
      if (path) {
        return new TransportNodeHidNoEvents(new HID.HID(path));
      }

      const device = getDevices()[0];
      if (!device) throw new TransportError("NoDevice", "NoDevice");
      return new TransportNodeHidNoEvents(new HID.HID(device.path as string));
    });
  }

  device: HID.HID;
  deviceModel: DeviceModel | null | undefined;
  channel = Math.floor(Math.random() * 0xffff);
  packetSize = 64;
  disconnected = false;

  constructor(device: HID.HID) {
    super();
    this.device = device;
    // @ts-expect-error accessing low level API in C
    const info = device.getDeviceInfo();
    this.deviceModel =
      info && info.product ? identifyProductName(info.product) : null;
  }

  setDisconnected = () => {
    if (!this.disconnected) {
      this.emit("disconnect");
      this.disconnected = true;
    }
  };
  writeHID = (content: Buffer): Promise<void> => {
    const data = [0x00];

    for (let i = 0; i < content.length; i++) {
      data.push(content[i]);
    }

    try {
      this.device.write(data);
      return Promise.resolve();
    } catch (e: any) {
      const maybeMappedError =
        e && e.message ? new DisconnectedDeviceDuringOperation(e.message) : e;
      if (maybeMappedError instanceof DisconnectedDeviceDuringOperation) {
        this.setDisconnected();
      }

      return Promise.reject(maybeMappedError);
    }
  };
  readHID = (): Promise<Buffer> =>
    new Promise((resolve, reject) =>
      this.device.read((e, res) => {
        if (!res) {
          return reject(new DisconnectedDevice());
        }

        if (e) {
          const maybeMappedError =
            e && e.message
              ? new DisconnectedDeviceDuringOperation(e.message)
              : e;
          if (maybeMappedError instanceof DisconnectedDeviceDuringOperation) {
            this.setDisconnected();
          }

          reject(maybeMappedError);
        } else {
          const buffer = Buffer.from(res);
          resolve(buffer);
        }
      })
    );

  /**
   * Exchange with the device using APDU protocol.
   * @param apdu
   * @returns a promise of apdu response
   */
  async exchange(apdu: Buffer): Promise<Buffer> {
    const b = await this.exchangeAtomicImpl(async () => {
      const { channel, packetSize } = this;
      log("apdu", "=> " + apdu.toString("hex"));
      const framing = hidFraming(channel, packetSize);
      // Write...
      const blocks = framing.makeBlocks(apdu);

      for (let i = 0; i < blocks.length; i++) {
        await this.writeHID(blocks[i]);
      }

      // Read...
      let result;
      let acc;

      while (!(result = framing.getReducedResult(acc))) {
        const buffer = await this.readHID();
        acc = framing.reduceResponse(acc, buffer);
      }

      log("apdu", "<= " + result.toString("hex"));
      return result;
    });

    return b as Buffer;
  }

  setScrambleKey() {}

  /**
   * release the USB device.
   */
  async close(): Promise<void> {
    await this.exchangeBusyPromise;
    this.device.close();
  }
}

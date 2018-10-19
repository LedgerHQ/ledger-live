// @flow
/* eslint-disable prefer-template */

import Transport, { TransportError } from "@ledgerhq/hw-transport";
import { BleManager } from "react-native-ble-plx";

const ServiceUuid = "d973f2e0-b19e-11e2-9e96-0800200c9a66";
const RenameCharacteristicUuid = "d973f2e3-b19e-11e2-9e96-0800200c9a66";
const WriteCharacteristicUuid = "d973f2e2-b19e-11e2-9e96-0800200c9a66";
const NotifyCharacteristicUuid = "d973f2e1-b19e-11e2-9e96-0800200c9a66";
const MaxChunkBytes = 20;
const TagId = 0x05;

type Device = *;
type Characteristic = *;

function chunkBuffer(
  buffer: Buffer,
  sizeForIndex: number => number,
): Array<Buffer> {
  const chunks = [];
  for (
    let i = 0, size = sizeForIndex(0);
    i < buffer.length;
    i += size, size = sizeForIndex(i)
  ) {
    chunks.push(buffer.slice(i, i + size));
  }
  return chunks;
}

function receive(characteristic, debug) {
  let subscription;
  const promise = new Promise((resolve, reject) => {
    let notifiedIndex = 0;
    let notifiedDataLength = 0;
    let notifiedData = Buffer.alloc(0);
    subscription = characteristic.monitor((error, c) => {
      if (error) {
        reject(error);
        return;
      }
      try {
        const value = Buffer.from(c.value, "base64");
        if (debug) {
          console.log(`<= ${value.toString("hex")}`); // eslint-disable-line no-console
        }
        const tag = value.readUInt8(0);
        const index = value.readUInt16BE(1);
        let data = value.slice(3);

        if (tag !== TagId) {
          throw new TransportError(
            "Invalid tag " + tag.toString(16),
            "InvalidTag",
          );
        }
        if (notifiedIndex !== index) {
          throw new TransportError(
            "BLE: Invalid sequence number. discontinued chunk. Received " +
              index +
              " but expected " +
              notifiedIndex,
            "InvalidSequence",
          );
        }
        if (index === 0) {
          notifiedDataLength = data.readUInt16BE(0);
          data = data.slice(2);
        }
        notifiedIndex++;
        notifiedData = Buffer.concat([notifiedData, data]);
        if (notifiedData.length > notifiedDataLength) {
          throw new TransportError(
            "BLE: received too much data. discontinued chunk. Received " +
              notifiedData.length +
              " but expected " +
              notifiedDataLength,
            "BLETooMuchData",
          );
        }
        if (notifiedData.length === notifiedDataLength) {
          resolve(notifiedData);
        }
      } catch (e) {
        reject(e);
      }
    });
  });
  if (!subscription) throw new Error("subscription undefined"); // to satisfy flow
  return { promise, subscription };
}

async function send(characteristic, apdu, termination, debug) {
  const chunks = chunkBuffer(apdu, i => MaxChunkBytes - (i === 0 ? 5 : 3)).map(
    (buffer, i) => {
      const head = Buffer.alloc(i === 0 ? 5 : 3);
      head.writeUInt8(TagId, 0);
      head.writeUInt16BE(i, 1);
      if (i === 0) {
        head.writeUInt16BE(apdu.length, 3);
      }
      return Buffer.concat([head, buffer]);
    },
  );
  let terminated = false;
  termination.then(() => {
    terminated = true;
  });
  for (const chunk of chunks) {
    if (terminated) return;
    if (debug) {
      console.log(`=> ${chunk.toString("hex")}`); // eslint-disable-line no-console
    }
    await characteristic.writeWithResponse(chunk.toString("base64"));
  }
}

/**
 * react-native bluetooth BLE implementation
 * @example
 * import BluetoothTransport from "@ledgerhq/react-native-hw-transport-ble";
 */
export default class BluetoothTransport extends Transport<Device | string> {
  static isSupported = (): Promise<boolean> =>
    Promise.resolve(typeof BleManager === "function");

  /**
   * TODO could add this concept in all transports
   * observe event with { available: bool, type: string } // available is generic, type is specific
   * an event is emit once and then listened
   */
  static observeState(observer: *) {
    const manager = new BleManager();
    const emitFromState = type => {
      observer.next({ type, available: type === "PoweredOn" });
    };
    manager.onStateChange(emitFromState, true);
    return {
      unsubscribe: () => manager.destroy(),
    };
  }

  static list = (): * => {
    const bleManager = new BleManager();
    return bleManager.connectedDevices([ServiceUuid]);
  };

  static listen(observer: *) {
    // TODO protect from race condition. should not allow to call listen() twice before stopDeviceScan is done.
    const bleManager = new BleManager();
    const stateSub = bleManager.onStateChange(state => {
      if (state === "PoweredOn") {
        stateSub.remove();
        bleManager.startDeviceScan([ServiceUuid], null, (bleError, device) => {
          if (bleError) {
            observer.error(bleError);
            unsubscribe();
            return;
          }
          observer.next({ type: "add", descriptor: device });
        });
      }
    }, true);
    const unsubscribe = () => {
      bleManager.stopDeviceScan();
      stateSub.remove();
    };
    return { unsubscribe };
  }

  // TODO : usage of open(deviceId): try { open } catch { e => inform it fails and ask user if he wants to remove the device from the list }
  static async open(deviceOrId: Device | string) {
    let device;
    if (typeof deviceOrId === "string") {
      console.log(`deviceId=${deviceOrId}`); // eslint-disable-line no-console
      const manager = new BleManager();
      const devices = await manager.devices([deviceOrId]);
      console.log(`${devices.length} devices`); // eslint-disable-line no-console
      [device] = devices;

      if (!device) {
        const connectedDevices = await manager.connectedDevices([ServiceUuid]);
        console.log(`${connectedDevices.length} connectedDevices`); // eslint-disable-line no-console
        const connectedDevicesFiltered = connectedDevices.filter(
          d => d.id === deviceOrId,
        );
        console.log(`${connectedDevicesFiltered.length} connectedDFiltered`); // eslint-disable-line no-console
        [device] = connectedDevicesFiltered;
      }

      if (device) {
        const isDeviceConnected = await manager.isDeviceConnected(deviceOrId);
        console.log(`isDeviceConnected=${isDeviceConnected}`); // eslint-disable-line no-console
        if (!isDeviceConnected) {
          device = null;
        }
      }

      if (!device) {
        console.log("cancelDeviceConnection (force device to be redeemed)"); // eslint-disable-line no-console
        await manager.cancelDeviceConnection(deviceOrId);
        console.log("Last chance, we attempt to connectToDevice"); // eslint-disable-line no-console
        device = await manager.connectToDevice(deviceOrId);
      }
    } else {
      device = deviceOrId;
    }

    await device.connect();
    await device.discoverAllServicesAndCharacteristics();

    const characteristics = await device.characteristicsForService(ServiceUuid);
    if (!characteristics) {
      throw new TransportError("service not found", "BLEServiceNotFound");
    }
    let writeC;
    let notifyC;
    let renameC;
    for (const c of characteristics) {
      if (c.uuid === RenameCharacteristicUuid) {
        renameC = c;
      } else if (c.uuid === WriteCharacteristicUuid) {
        writeC = c;
      } else if (c.uuid === NotifyCharacteristicUuid) {
        notifyC = c;
      }
    }
    if (!writeC) {
      throw new TransportError(
        "write characteristic not found",
        "BLEChracteristicNotFound",
      );
    }
    if (!notifyC) {
      throw new TransportError(
        "notify characteristic not found",
        "BLEChracteristicNotFound",
      );
    }
    if (!writeC.isWritableWithResponse) {
      throw new TransportError(
        "write characteristic not writableWithResponse",
        "BLEChracteristicInvalid",
      );
    }
    if (!notifyC.isNotifiable) {
      throw new TransportError(
        "notify characteristic not notifiable",
        "BLEChracteristicInvalid",
      );
    }

    return new BluetoothTransport(device, writeC, notifyC, renameC);
  }

  device: Device;

  writeCharacteristic: Characteristic;

  notifyCharacteristic: Characteristic;

  renameCharacteristic: Characteristic;

  constructor(
    device: Device,
    writeCharacteristic: Characteristic,
    notifyCharacteristic: Characteristic,
    renameCharacteristic: Characteristic,
  ) {
    super();
    this.device = device;
    this.writeCharacteristic = writeCharacteristic;
    this.notifyCharacteristic = notifyCharacteristic;
    this.renameCharacteristic = renameCharacteristic;
    device.onDisconnected(e => {
      if (this.debug) {
        console.log("BLE disconnect", this.device); // eslint-disable-line
      }
      this.emit("disconnect", e);
    });
  }

  busy = false;

  async exchange(apdu: Buffer): Promise<Buffer> {
    if (this.busy) {
      throw new TransportError(
        "exchange() race condition",
        "ExchangeRaceCondition",
      );
    }
    this.busy = true;
    let receiving;
    try {
      receiving = receive(this.notifyCharacteristic, this.debug);
      send(this.writeCharacteristic, apdu, receiving.promise, this.debug);
      const data = await receiving.promise;
      return data;
    } finally {
      this.busy = false;
      if (receiving) {
        receiving.subscription.remove();
      }
    }
  }

  setScrambleKey() {}

  close(): Promise<void> {
    return this.device.cancelConnection();
  }
}

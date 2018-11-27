// @flow
/* eslint-disable prefer-template */

import Transport, { TransportError } from "@ledgerhq/hw-transport";
import { BleManager } from "react-native-ble-plx";
import { CantOpenDevice } from "@ledgerhq/live-common/lib/errors";
import Config from "react-native-config";
import { logSubject, logsObservable } from "./debug";
import { BluetoothRequired } from "../errors";
import timer from "../timer";

const ServiceUuid = "d973f2e0-b19e-11e2-9e96-0800200c9a66";
const WriteCharacteristicUuid = "d973f2e2-b19e-11e2-9e96-0800200c9a66";
const NotifyCharacteristicUuid = "d973f2e1-b19e-11e2-9e96-0800200c9a66";
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

function receive(characteristic) {
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
        logSubject.next({
          type: "ble-frame-in",
          message: value.toString("hex"),
        });

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

async function send(characteristic, apdu, termination, mtuSize) {
  const chunks = chunkBuffer(apdu, i => mtuSize - (i === 0 ? 5 : 3)).map(
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
    const message = chunk.toString("base64");
    logSubject.next({ type: "ble-frame-out", message: chunk.toString("hex") });
    await characteristic.writeWithResponse(message);
  }
}

const connectOptions = {
  requestMTU: 156,
};

let id = 0;
const devicesCache = {};

let verboseLog = null;

if (Config.DEBUG_BLE) {
  /* eslint-disable no-console */
  verboseLog = (...a) => console.log(...a);
  logsObservable.subscribe(o => console.log(o.type + ": " + o.message));
  /* eslint-enable no-console */
}

const awaitsBleOn = (manager, ms = 3000) =>
  new Promise((resolve, reject) => {
    let done = false;
    let lastState = "Unknown";

    const stateSub = manager.onStateChange(state => {
      lastState = state;
      if (verboseLog) verboseLog("ble state -> " + state);
      if (state === "PoweredOn") {
        if (done) return;
        removeTimeout();
        done = true;
        stateSub.remove();
        resolve();
      }
    }, true);

    const removeTimeout = timer.timeout(() => {
      if (done) return;
      stateSub.remove();
      reject(new BluetoothRequired("", { state: lastState }));
    }, ms);
  });

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
  static async open(deviceOrId: Device | string, _timeout: number = 30000) {
    // TODO implement timeout

    let device;
    if (typeof deviceOrId === "string") {
      if (verboseLog) verboseLog(`deviceId=${deviceOrId}`);

      if (devicesCache[deviceOrId]) {
        if (verboseLog) verboseLog("Device in cache, using that.");
        device = devicesCache[deviceOrId];
      } else {
        const manager = new BleManager();

        if (verboseLog) verboseLog("awaitsBleOn");
        await awaitsBleOn(manager);

        if (!device) {
          /*
          const devices = await manager.devices([deviceOrId]);
          if (verboseLog) verboseLog(`${devices.length} devices`);
          [device] = devices;
          */

          const connectedDevices = await manager.connectedDevices([
            ServiceUuid,
          ]);
          if (verboseLog)
            verboseLog(`${connectedDevices.length} connectedDevices`);
          const connectedDevicesFiltered = connectedDevices.filter(
            d => d.id === deviceOrId,
          );
          if (verboseLog)
            verboseLog(`${connectedDevicesFiltered.length} connectedDFiltered`);
          [device] = connectedDevicesFiltered;
        }

        /*
        if (device) {
          const isDeviceConnected = await manager.isDeviceConnected(deviceOrId);
          if (verboseLog) verboseLog(`isDeviceConnected=${isDeviceConnected}`); // eslint-disable-line no-console
          if (!isDeviceConnected) {
            device = null;
          }
        }
        */

        if (!device) {
          if (verboseLog)
            verboseLog("Last chance, we attempt to connectToDevice"); // eslint-disable-line no-console
          device = await manager.connectToDevice(deviceOrId, connectOptions);
        }

        if (!device) {
          throw new CantOpenDevice();
        }
      }
    } else {
      device = deviceOrId;
    }

    if (verboseLog) verboseLog("isConnected?");
    if (!(await device.isConnected())) {
      if (verboseLog) verboseLog("nope! connecting...");
      await device.connect(connectOptions);
    }

    if (verboseLog) verboseLog("discoverAllServicesAndCharacteristics");
    await device.discoverAllServicesAndCharacteristics();

    if (verboseLog) verboseLog("characteristicsForService");
    const characteristics = await device.characteristicsForService(ServiceUuid);
    if (!characteristics) {
      throw new TransportError("service not found", "BLEServiceNotFound");
    }
    let writeC;
    let notifyC;
    for (const c of characteristics) {
      if (c.uuid === WriteCharacteristicUuid) {
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

    devicesCache[device.id] = device;

    if (verboseLog) verboseLog("device.mtu=" + device.mtu);

    // Firmware team need to fix things for mtu to work
    // const mtuSize = device.mtu - 3;
    const mtuSize = 20;

    return new BluetoothTransport(device, writeC, notifyC, mtuSize);
  }

  id: number;

  device: Device;

  mtuSize: number;

  writeCharacteristic: Characteristic;

  notifyCharacteristic: Characteristic;

  constructor(
    device: Device,
    writeCharacteristic: Characteristic,
    notifyCharacteristic: Characteristic,
    mtuSize: number,
  ) {
    super();
    this.id = ++id;
    this.device = device;
    this.mtuSize = mtuSize;
    this.writeCharacteristic = writeCharacteristic;
    this.notifyCharacteristic = notifyCharacteristic;
    this.disconnectedSub = device.onDisconnected(e => {
      if (verboseLog) verboseLog("BLE disconnect", this.device); // eslint-disable-line
      this.emit("disconnect", e);
      if (this.disconnectedSub) {
        this.disconnectedSub.remove();
        this.disconnectedSub = null;
      }
    });
    if (verboseLog) {
      verboseLog(
        "BleTransport(" +
          String(this.id) +
          ") opened. using mtuSize=" +
          mtuSize,
      );
    }
  }

  disconnectedSub: *;

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
      const { debug } = this;

      const msgIn = apdu.toString("hex");
      if (debug) debug(`=> ${msgIn}`); // eslint-disable-line no-console
      logSubject.next({ type: "ble-apdu-in", message: msgIn });

      receiving = receive(this.notifyCharacteristic);
      const sending = send(
        this.writeCharacteristic,
        apdu,
        receiving.promise,
        this.mtuSize,
      );
      const [data] = await Promise.all([receiving.promise, sending]);

      const msgOut = data.toString("hex");
      logSubject.next({ type: "ble-apdu-out", message: msgOut });
      if (debug) debug(`<= ${msgOut}`); // eslint-disable-line no-console

      return data;
    } catch (e) {
      logSubject.next({ type: "ble-error", message: String(e) });
      throw e;
    } finally {
      this.busy = false;
      if (receiving) {
        receiving.subscription.remove();
      }
    }
  }

  setScrambleKey() {}

  close(): Promise<void> {
    if (this.disconnectedSub) {
      this.disconnectedSub.remove();
      this.disconnectedSub = null;
    }
    if (verboseLog) verboseLog("BleTransport(" + String(this.id) + ") close");
    // we don't want to actually close the device. TODO: we might want to stop all exchanges
    return Promise.resolve();
  }
}

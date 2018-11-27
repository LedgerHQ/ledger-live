// @flow
/* eslint-disable prefer-template */

import Transport, { TransportError } from "@ledgerhq/hw-transport";
import { BleManager } from "react-native-ble-plx";
import { Observable, merge } from "rxjs";
import { share } from "rxjs/operators";
import { CantOpenDevice } from "@ledgerhq/live-common/lib/errors";
import { logSubject, verboseLog } from "./debug";

import type { Device, Characteristic } from "./types";
import { sendAPDU } from "./sendAPDU";
import { receiveAPDU } from "./receiveAPDU";
import { monitorCharacteristic } from "./monitorCharacteristic";
import { awaitsBleOn } from "./awaitsBleOn";

const ServiceUuid = "d973f2e0-b19e-11e2-9e96-0800200c9a66";
const WriteCharacteristicUuid = "d973f2e2-b19e-11e2-9e96-0800200c9a66";
const NotifyCharacteristicUuid = "d973f2e1-b19e-11e2-9e96-0800200c9a66";

const connectOptions = {
  requestMTU: 156,
};

let id = 0;
const devicesCache = {};
const bleManager = new BleManager();

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
    const emitFromState = type => {
      observer.next({ type, available: type === "PoweredOn" });
    };
    bleManager.onStateChange(emitFromState, true);
    return {
      unsubscribe: () => {},
    };
  }

  static list = (): * => {
    throw new Error("not implemented");
  };

  static listen(observer: *) {
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
        if (verboseLog) verboseLog("awaitsBleOn");
        await awaitsBleOn(bleManager);

        if (!device) {
          /*
          const devices = await bleManager.devices([deviceOrId]);
          if (verboseLog) verboseLog(`${devices.length} devices`);
          [device] = devices;
          */

          const connectedDevices = await bleManager.connectedDevices([
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
          const isDeviceConnected = await bleManager.isDeviceConnected(deviceOrId);
          if (verboseLog) verboseLog(`isDeviceConnected=${isDeviceConnected}`); // eslint-disable-line no-console
          if (!isDeviceConnected) {
            device = null;
          }
        }
        */

        if (!device) {
          if (verboseLog)
            verboseLog("Last chance, we attempt to connectToDevice"); // eslint-disable-line no-console
          device = await bleManager.connectToDevice(deviceOrId, connectOptions);
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

    const { id } = device;
    if (!devicesCache[id]) {
      devicesCache[id] = device;
      const disconnectedSub = device.onDisconnected(() => {
        delete devicesCache[id];
        disconnectedSub.remove();
      });
    }

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

  notifyObservable: Observable<Buffer>;

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
    const notifyObservable = monitorCharacteristic(notifyCharacteristic).pipe(
      share(),
    );
    this.notifyObservable = notifyObservable;
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

      const data = await merge(
        this.notifyObservable.pipe(receiveAPDU),
        sendAPDU(bleManager, this.writeCharacteristic, apdu, this.mtuSize),
      ).toPromise();

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

  // TODO when we remove a device globally, we need to disconnect it.
  // so we need a new api for this.

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

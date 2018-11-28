// @flow
/* eslint-disable prefer-template */

import Transport, { TransportError } from "@ledgerhq/hw-transport";
import { BleManager, ConnectionPriority } from "react-native-ble-plx";
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

const transportsCache = {};
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

  static async open(deviceOrId: Device | string, _timeout: number = 30000) {
    // TODO implement timeout

    let device;
    if (typeof deviceOrId === "string") {
      if (transportsCache[deviceOrId]) {
        if (verboseLog) verboseLog("Transport in cache, using that.");
        return transportsCache[deviceOrId];
      }

      if (verboseLog) verboseLog(`deviceId=${deviceOrId}`);

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

    if (verboseLog) verboseLog("device.mtu=" + device.mtu);

    const transport = new BluetoothTransport(device, writeC, notifyC);

    transportsCache[transport.id] = transport;
    const disconnectedSub = device.onDisconnected(e => {
      transport.notYetDisconnected = false;
      disconnectedSub.remove();
      delete transportsCache[transport.id];
      if (verboseLog) {
        verboseLog("BleTransport(" + transport.id + ") disconnect"); // eslint-disable-line
      }
      transport.emit("disconnect", e);
    });

    return transport;
  }

  static disconnect = async (id: *) => {
    await bleManager.cancelDeviceConnection(id);
  };

  id: string;

  device: Device;

  mtuSize: number = 20;

  writeCharacteristic: Characteristic;

  notifyCharacteristic: Characteristic;

  notifyObservable: Observable<Buffer>;

  notYetDisconnected = true;

  constructor(
    device: Device,
    writeCharacteristic: Characteristic,
    notifyCharacteristic: Characteristic,
  ) {
    super();
    this.id = device.id;
    this.device = device;
    this.writeCharacteristic = writeCharacteristic;
    this.notifyCharacteristic = notifyCharacteristic;
    const notifyObservable = monitorCharacteristic(notifyCharacteristic).pipe(
      share(),
    );
    this.notifyObservable = notifyObservable;
    if (verboseLog) {
      verboseLog("BleTransport(" + String(this.id) + ") opened");
    }
  }

  busy: ?Promise<void>;

  async exchange(apdu: Buffer): Promise<Buffer> {
    if (this.busy) {
      throw new TransportError(
        "exchange() race condition",
        "ExchangeRaceCondition",
      );
    }
    let resolveBusy;
    const busyPromise = new Promise(r => {
      resolveBusy = r;
    });
    this.busy = busyPromise;
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
      if (this.notYetDisconnected) {
        // in such case we will always disconnect because something is bad.
        await bleManager.cancelDeviceConnection(this.id).catch(() => {}); // but we ignore if disconnect worked.
      }
      throw e;
    } finally {
      if (resolveBusy) resolveBusy();
      this.busy = null;
      if (receiving) {
        receiving.subscription.remove();
      }
    }
  }

  // TODO when do we need to call this?
  async inferMTU() {
    let { mtu } = this.device;
    if (mtu === 23) {
      // do an apdu because it's likely device.mtu this failed to be retrieved.
      mtu = 23; // TODO
    }
    const mtuSize = mtu - 3;
    if (verboseLog) {
      verboseLog(
        "BleTransport(" + String(this.id) + ") mtu set to " + String(mtuSize),
      );
    }
    this.mtuSize = mtuSize;
    return mtuSize;
  }

  async requestConnectionPriority(
    connectionPriority: "Balanced" | "High" | "LowPower",
  ) {
    await this.device.requestConnectionPriority(
      ConnectionPriority[connectionPriority],
    );
  }

  setScrambleKey() {}

  // TODO when we remove a device globally, we need to disconnect it.
  // so we need a new api for this.

  async close() {
    if (verboseLog) verboseLog("BleTransport(" + String(this.id) + ") close");
    if (this.busy) {
      await this.busy;
    }
  }
}

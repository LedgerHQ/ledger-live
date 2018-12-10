// @flow
/* eslint-disable prefer-template */

import Transport, { TransportError } from "@ledgerhq/hw-transport";
import {
  BleManager,
  ConnectionPriority,
  BleErrorCode,
} from "react-native-ble-plx";
import Config from "react-native-config";
import { Observable, defer, merge, from } from "rxjs";
import {
  share,
  ignoreElements,
  first,
  map,
  tap,
  timeout,
} from "rxjs/operators";
import { CantOpenDevice } from "@ledgerhq/live-common/lib/errors";
import { logSubject } from "./debug";

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

if (Config.BLE_LOG_LEVEL) bleManager.setLogLevel(Config.BLE_LOG_LEVEL);

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
    logSubject.next({
      type: "verbose",
      message: `listen...`,
    });
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
      logSubject.next({
        type: "verbose",
        message: `done listening.`,
      });
    };
    return { unsubscribe };
  }

  static async open(deviceOrId: Device | string, _timeout: number = 30000) {
    // TODO implement timeout

    let device;
    if (typeof deviceOrId === "string") {
      if (transportsCache[deviceOrId]) {
        logSubject.next({
          type: "verbose",
          message: "Transport in cache, using that.",
        });
        return transportsCache[deviceOrId];
      }

      logSubject.next({ type: "verbose", message: `open(${deviceOrId})` });

      await awaitsBleOn(bleManager);

      if (!device) {
        // works for iOS but not Android
        const devices = await bleManager.devices([deviceOrId]);
        logSubject.next({
          type: "verbose",
          message: `found ${devices.length} devices`,
        });
        [device] = devices;
      }

      if (!device) {
        const connectedDevices = await bleManager.connectedDevices([
          ServiceUuid,
        ]);
        const connectedDevicesFiltered = connectedDevices.filter(
          d => d.id === deviceOrId,
        );
        logSubject.next({
          type: "verbose",
          message: `found ${connectedDevicesFiltered.length} connected devices`,
        });
        [device] = connectedDevicesFiltered;
      }

      if (!device) {
        logSubject.next({
          type: "verbose",
          message: `connectToDevice(${deviceOrId})`,
        });
        try {
          device = await bleManager.connectToDevice(deviceOrId, connectOptions);
        } catch (e) {
          if (e.errorCode === BleErrorCode.DeviceMTUChangeFailed) {
            device = await bleManager.connectToDevice(deviceOrId);
          } else {
            throw e;
          }
        }
      }

      if (!device) {
        throw new CantOpenDevice();
      }
    } else {
      device = deviceOrId;
    }

    if (!(await device.isConnected())) {
      logSubject.next({
        type: "verbose",
        message: "not connected. connecting...",
      });
      try {
        await device.connect(connectOptions);
      } catch (e) {
        if (e.errorCode === BleErrorCode.DeviceMTUChangeFailed) {
          await device.connect();
        } else {
          throw e;
        }
      }
    }

    await device.discoverAllServicesAndCharacteristics();

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

    logSubject.next({ type: "verbose", message: `device.mtu=${device.mtu}` });

    const notifyObservable = monitorCharacteristic(notifyC).pipe(
      tap(value => {
        logSubject.next({
          type: "ble-frame-read",
          message: value.toString("hex"),
        });
      }),
      share(),
    );

    const notif = notifyObservable.subscribe();

    const transport = new BluetoothTransport(device, writeC, notifyObservable);

    transportsCache[transport.id] = transport;
    const disconnectedSub = device.onDisconnected(e => {
      transport.notYetDisconnected = false;
      notif.unsubscribe();
      disconnectedSub.remove();
      delete transportsCache[transport.id];
      logSubject.next({
        type: "verbose",
        message: `BleTransport(${transport.id}) disconnected`,
      });
      transport.emit("disconnect", e);
    });

    // TODO when firmware is ready:
    // await transport.inferMTU();

    return transport;
  }

  static disconnect = async (id: *) => {
    logSubject.next({
      type: "verbose",
      message: `user disconnect(${id})`,
    });
    await bleManager.cancelDeviceConnection(id);
  };

  id: string;

  device: Device;

  mtuSize: number = 20;

  writeCharacteristic: Characteristic;

  notifyObservable: Observable<Buffer>;

  notYetDisconnected = true;

  constructor(
    device: Device,
    writeCharacteristic: Characteristic,
    notifyObservable: Observable<Buffer>,
  ) {
    super();
    this.id = device.id;
    this.device = device;
    this.writeCharacteristic = writeCharacteristic;
    this.notifyObservable = notifyObservable;
    logSubject.next({
      type: "verbose",
      message: `BleTransport(${String(this.id)}) new instance`,
    });
  }

  exchange = (apdu: Buffer): Promise<Buffer> =>
    this.atomic(async () => {
      try {
        const { debug } = this;

        const msgIn = apdu.toString("hex");
        if (debug) debug(`=> ${msgIn}`); // eslint-disable-line no-console
        logSubject.next({ type: "ble-apdu-write", message: msgIn });

        const data = await merge(
          this.notifyObservable.pipe(receiveAPDU),
          sendAPDU(bleManager, this.write, apdu, this.mtuSize),
        ).toPromise();

        const msgOut = data.toString("hex");
        logSubject.next({ type: "ble-apdu-read", message: msgOut });
        if (debug) debug(`<= ${msgOut}`); // eslint-disable-line no-console

        return data;
      } catch (e) {
        logSubject.next({
          type: "ble-error",
          message: "exchange got " + String(e),
        });
        if (this.notYetDisconnected) {
          // in such case we will always disconnect because something is bad.
          await bleManager.cancelDeviceConnection(this.id).catch(() => {}); // but we ignore if disconnect worked.
        }
        throw e;
      }
    });

  // TODO we probably will do this at end of open
  async inferMTU() {
    let { mtu } = this.device;
    if (mtu <= 23) {
      await this.atomic(async () => {
        try {
          mtu =
            (await merge(
              this.notifyObservable.pipe(
                first(buffer => buffer.readUInt8(0) === 0x08),
                map(buffer => buffer.readUInt8(5)),
                timeout(30000),
              ),
              defer(() =>
                from(this.write(Buffer.from([0x08, 0, 0, 0, 0]))),
              ).pipe(ignoreElements()),
            ).toPromise()) + 3;
        } catch (e) {
          logSubject.next({
            type: "ble-error",
            message: "inferMTU got " + String(e),
          });
          await bleManager.cancelDeviceConnection(this.id).catch(() => {}); // but we ignore if disconnect worked.
          throw e;
        }
      });
    }

    if (mtu > 23) {
      const mtuSize = mtu - 3;
      logSubject.next({
        type: "verbose",
        message: `BleTransport(${String(this.id)}) mtu set to ${String(
          mtuSize,
        )}`,
      });
      this.mtuSize = mtuSize;
    }

    return this.mtuSize;
  }

  async requestConnectionPriority(
    connectionPriority: "Balanced" | "High" | "LowPower",
  ) {
    await this.device.requestConnectionPriority(
      ConnectionPriority[connectionPriority],
    );
  }

  setScrambleKey() {}

  write = async (buffer: Buffer, txid?: ?string) => {
    logSubject.next({
      type: "ble-frame-write",
      message: buffer.toString("hex"),
    });
    await this.writeCharacteristic.writeWithResponse(
      buffer.toString("base64"),
      txid,
    );
  };

  busy: ?Promise<void>;
  atomic = async <R>(f: () => Promise<R>): Promise<R> => {
    if (this.busy) {
      throw new TransportError("BLE Transport race condition", "RaceCondition");
    }
    let resolveBusy;
    const busyPromise = new Promise(r => {
      resolveBusy = r;
    });
    this.busy = busyPromise;
    try {
      const res = await f();
      return res;
    } finally {
      if (resolveBusy) resolveBusy();
      this.busy = null;
    }
  };

  async close() {
    if (this.busy) {
      await this.busy;
    }
  }
}

/* eslint-disable prefer-template */
import Transport from "@ledgerhq/hw-transport";
import type {
  Subscription as TransportSubscription,
  Observer as TransportObserver,
  DescriptorEvent,
} from "@ledgerhq/hw-transport";
import {
  BleManager,
  ConnectionPriority,
  BleErrorCode,
} from "react-native-ble-plx";
import {
  getBluetoothServiceUuids,
  getInfosForServiceUuid,
} from "@ledgerhq/devices";
import type { DeviceModel } from "@ledgerhq/devices";
import { sendAPDU } from "@ledgerhq/devices/ble/sendAPDU";
import { receiveAPDU } from "@ledgerhq/devices/ble/receiveAPDU";
import { log } from "@ledgerhq/logs";
import { Observable, defer, merge, from, of, throwError } from "rxjs";
import {
  share,
  ignoreElements,
  first,
  map,
  tap,
  catchError,
} from "rxjs/operators";
import {
  CantOpenDevice,
  TransportError,
  DisconnectedDeviceDuringOperation,
  PairingFailed,
} from "@ledgerhq/errors";
import type { Device, Characteristic } from "./types";
import { monitorCharacteristic } from "./monitorCharacteristic";
import { awaitsBleOn } from "./awaitsBleOn";
import { decoratePromiseErrors, remapError } from "./remapErrors";
let connectOptions: Record<string, unknown> = {
  requestMTU: 156,
  connectionPriority: 1,
  forceDisconnectTimeout: 4000,
};
const transportsCache = {};
const bleManager = new BleManager();

const retrieveInfos = (device) => {
  if (!device || !device.serviceUUIDs) return;
  const [serviceUUID] = device.serviceUUIDs;
  if (!serviceUUID) return;
  const infos = getInfosForServiceUuid(serviceUUID);
  if (!infos) return;
  return infos;
};

type ReconnectionConfig = {
  pairingThreshold: number;
  delayAfterFirstPairing: number;
};
let reconnectionConfig: ReconnectionConfig | null | undefined = {
  pairingThreshold: 2000,
  delayAfterFirstPairing: 4000,
};
export function setReconnectionConfig(config: ReconnectionConfig | null): void {
  reconnectionConfig = config;
}

const delay = (ms) => new Promise((success) => setTimeout(success, ms));

async function open(deviceOrId: Device | string, needsReconnect: boolean) {
  let device;

  if (typeof deviceOrId === "string") {
    if (transportsCache[deviceOrId]) {
      log("ble-verbose", "Transport in cache, using that.");
      const maybeTimeout = transportsCache[deviceOrId].disconnectTimeout;
      if (maybeTimeout) {
        log("ble-verbose", "Clearing queued disconnect");
        clearTimeout(transportsCache[deviceOrId].disconnectTimeout);
      }
      return transportsCache[deviceOrId];
    }

    log("ble-verbose", `open(${deviceOrId})`);
    await awaitsBleOn(bleManager);

    if (!device) {
      // works for iOS but not Android
      const devices = await bleManager.devices([deviceOrId]);
      log("ble-verbose", `found ${devices.length} devices`);
      [device] = devices;
    }

    if (!device) {
      const connectedDevices = await bleManager.connectedDevices(
        getBluetoothServiceUuids()
      );
      const connectedDevicesFiltered = connectedDevices.filter(
        (d) => d.id === deviceOrId
      );
      log(
        "ble-verbose",
        `found ${connectedDevicesFiltered.length} connected devices`
      );
      [device] = connectedDevicesFiltered;
    }

    if (!device) {
      log("ble-verbose", `connectToDevice(${deviceOrId})`);

      try {
        device = await bleManager.connectToDevice(deviceOrId, connectOptions);
      } catch (e: any) {
        if (e.errorCode === BleErrorCode.DeviceMTUChangeFailed) {
          // eslint-disable-next-line require-atomic-updates
          connectOptions = {};
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
    log("ble-verbose", "not connected. connecting...");

    try {
      await device.connect(connectOptions);
    } catch (e: any) {
      if (e.errorCode === BleErrorCode.DeviceMTUChangeFailed) {
        // eslint-disable-next-line require-atomic-updates
        connectOptions = {};
        await device.connect();
      } else {
        throw e;
      }
    }
  }

  await device.discoverAllServicesAndCharacteristics();
  let res = retrieveInfos(device);
  let characteristics;

  if (!res) {
    for (const uuid of getBluetoothServiceUuids()) {
      try {
        characteristics = await device.characteristicsForService(uuid);
        res = getInfosForServiceUuid(uuid);
        break;
      } catch (e) {
        // we attempt to connect to service
      }
    }
  }

  if (!res) {
    throw new TransportError("service not found", "BLEServiceNotFound");
  }

  const { deviceModel, serviceUuid, writeUuid, writeCmdUuid, notifyUuid } = res;

  if (!characteristics) {
    characteristics = await device.characteristicsForService(serviceUuid);
  }

  if (!characteristics) {
    throw new TransportError("service not found", "BLEServiceNotFound");
  }

  let writeC;
  let writeCmdC;
  let notifyC;

  for (const c of characteristics) {
    if (c.uuid === writeUuid) {
      writeC = c;
    } else if (c.uuid === writeCmdUuid) {
      writeCmdC = c;
    } else if (c.uuid === notifyUuid) {
      notifyC = c;
    }
  }

  if (!writeC) {
    throw new TransportError(
      "write characteristic not found",
      "BLEChracteristicNotFound"
    );
  }

  if (!notifyC) {
    throw new TransportError(
      "notify characteristic not found",
      "BLEChracteristicNotFound"
    );
  }

  if (!writeC.isWritableWithResponse) {
    throw new TransportError(
      "write characteristic not writableWithResponse",
      "BLEChracteristicInvalid"
    );
  }

  if (!notifyC.isNotifiable) {
    throw new TransportError(
      "notify characteristic not notifiable",
      "BLEChracteristicInvalid"
    );
  }

  if (writeCmdC) {
    if (!writeCmdC.isWritableWithoutResponse) {
      throw new TransportError(
        "write cmd characteristic not writableWithoutResponse",
        "BLEChracteristicInvalid"
      );
    }
  }

  log("ble-verbose", `device.mtu=${device.mtu}`);
  const notifyObservable = monitorCharacteristic(notifyC).pipe(
    catchError((e) => {
      // LL-9033 fw 2.0.2 introduced this case, we silence the inner unhandled error.
      const msg = String(e);
      return msg.includes("notify change failed")
        ? of(new PairingFailed(msg))
        : throwError(e);
    }),
    tap((value) => {
      if (value instanceof PairingFailed) return;
      log("ble-frame", "<= " + value.toString("hex"));
    }),
    share()
  );
  const notif = notifyObservable.subscribe();
  const transport = new BluetoothTransport(
    device,
    writeC,
    writeCmdC,
    notifyObservable,
    deviceModel
  );

  const onDisconnect = (e) => {
    transport.notYetDisconnected = false;
    notif.unsubscribe();
    disconnectedSub.remove();
    delete transportsCache[transport.id];
    log("ble-verbose", `BleTransport(${transport.id}) disconnected`);
    transport.emit("disconnect", e);
  };

  // eslint-disable-next-line require-atomic-updates
  transportsCache[transport.id] = transport;
  const disconnectedSub = device.onDisconnected((e) => {
    if (!transport.notYetDisconnected) return;
    onDisconnect(e);
  });
  const beforeMTUTime = Date.now();

  try {
    await transport.inferMTU();
  } finally {
    const afterMTUTime = Date.now();

    if (reconnectionConfig) {
      // workaround for #279: we need to open() again if we come the first time here,
      // to make sure we do a disconnect() after the first pairing time
      // because of a firmware bug
      if (afterMTUTime - beforeMTUTime < reconnectionConfig.pairingThreshold) {
        needsReconnect = false; // (optim) there is likely no new pairing done because mtu answer was fast.
      }

      if (needsReconnect) {
        // necessary time for the bonding workaround
        await BluetoothTransport.disconnect(transport.id).catch(() => {});
        await delay(reconnectionConfig.delayAfterFirstPairing);
      }
    } else {
      needsReconnect = false;
    }
  }

  if (needsReconnect) {
    return open(device, false);
  }

  return transport;
}

/**
 * react-native bluetooth BLE implementation
 * @example
 * import BluetoothTransport from "@ledgerhq/react-native-hw-transport-ble";
 */
export default class BluetoothTransport extends Transport {
  /**
   *
   */
  static isSupported = (): Promise<boolean> =>
    Promise.resolve(typeof BleManager === "function");

  /**
   *
   */
  static setLogLevel = (level: any) => {
    bleManager.setLogLevel(level);
  };

  /**
   * TODO could add this concept in all transports
   * observe event with { available: bool, string } // available is generic, type is specific
   * an event is emit once and then listened
   */
  static observeState(observer: any) {
    const emitFromState = (type) => {
      observer.next({
        type,
        available: type === "PoweredOn",
      });
    };

    bleManager.onStateChange(emitFromState, true);
    return {
      unsubscribe: () => {},
    };
  }

  static list = (): any => {
    throw new Error("not implemented");
  };

  /**
   * Scan for bluetooth Ledger devices
   */
  static listen(
    observer: TransportObserver<DescriptorEvent<Device>>
  ): TransportSubscription {
    log("ble-verbose", "listen...");
    let unsubscribed;
    // $FlowFixMe
    const stateSub = bleManager.onStateChange(async (state) => {
      if (state === "PoweredOn") {
        stateSub.remove();
        const devices = await bleManager.connectedDevices(
          getBluetoothServiceUuids()
        );
        if (unsubscribed) return;
        await Promise.all(
          devices.map((d) =>
            BluetoothTransport.disconnect(d.id).catch(() => {})
          )
        );
        if (unsubscribed) return;
        bleManager.startDeviceScan(
          getBluetoothServiceUuids(),
          null,
          (bleError, device) => {
            if (bleError) {
              observer.error(bleError);
              unsubscribe();
              return;
            }

            const res = retrieveInfos(device);
            const deviceModel = res && res.deviceModel;

            if (device) {
              observer.next({
                type: "add",
                descriptor: device,
                deviceModel,
              });
            }
          }
        );
      }
    }, true);

    const unsubscribe = () => {
      unsubscribed = true;
      bleManager.stopDeviceScan();
      stateSub.remove();
      log("ble-verbose", "done listening.");
    };

    return {
      unsubscribe,
    };
  }

  /**
   * Open a BLE transport
   * @param {*} deviceOrId
   */
  static async open(deviceOrId: Device | string) {
    return open(deviceOrId, true);
  }

  /**
   * Globally disconnect a BLE device by its ID
   */
  static disconnect = async (id: any) => {
    log("ble-verbose", `user disconnect(${id})`);
    await bleManager.cancelDeviceConnection(id);
    await delay(1000); // Nb Test to improve stability of re-connections.
  };
  id: string;
  device: Device;
  mtuSize = 20;
  writeCharacteristic: Characteristic;
  writeCmdCharacteristic: Characteristic;
  notifyObservable: Observable<any>;
  deviceModel: DeviceModel;
  notYetDisconnected = true;
  disconnectTimeout: null | ReturnType<typeof setTimeout> = null;

  constructor(
    device: Device,
    writeCharacteristic: Characteristic,
    writeCmdCharacteristic: Characteristic,
    notifyObservable: Observable<any>,
    deviceModel: DeviceModel
  ) {
    super();
    this.id = device.id;
    this.device = device;
    this.writeCharacteristic = writeCharacteristic;
    this.writeCmdCharacteristic = writeCmdCharacteristic;
    this.notifyObservable = notifyObservable;
    this.deviceModel = deviceModel;
    log("ble-verbose", `BleTransport(${String(this.id)}) new instance`);
  }

  /**
   * communicate with a BLE transport
   */
  exchange = (apdu: Buffer): Promise<any> =>
    this.exchangeAtomicImpl(async () => {
      try {
        const msgIn = apdu.toString("hex");
        log("apdu", `=> ${msgIn}`);
        const data = await merge(
          // $FlowFixMe
          this.notifyObservable.pipe(receiveAPDU),
          sendAPDU(this.write, apdu, this.mtuSize)
        ).toPromise();
        const msgOut = data.toString("hex");
        log("apdu", `<= ${msgOut}`);
        return data;
      } catch (e: any) {
        log("ble-error", "exchange got " + String(e));

        if (this.notYetDisconnected) {
          // in such case we will always disconnect because something is bad.
          await bleManager.cancelDeviceConnection(this.id).catch(() => {}); // but we ignore if disconnect worked.
        }

        throw remapError(e);
      }
    });

  // TODO we probably will do this at end of open
  async inferMTU() {
    let { mtu } = this.device;
    await this.exchangeAtomicImpl(async () => {
      try {
        mtu =
          (await merge(
            this.notifyObservable.pipe(
              tap((maybeError) => {
                if (maybeError instanceof Error) throw maybeError;
              }),
              first((buffer) => buffer.readUInt8(0) === 0x08),
              map((buffer) => buffer.readUInt8(5))
            ),
            defer(() => from(this.write(Buffer.from([0x08, 0, 0, 0, 0])))).pipe(
              ignoreElements()
            )
          ).toPromise()) + 3;
      } catch (e: any) {
        log("ble-error", "inferMTU got " + String(e));
        await bleManager.cancelDeviceConnection(this.id).catch(() => {}); // but we ignore if disconnect worked.

        throw remapError(e);
      }
    });

    if (mtu > 23) {
      const mtuSize = mtu - 3;
      log(
        "ble-verbose",
        `BleTransport(${String(this.id)}) mtu set to ${String(mtuSize)}`
      );
      this.mtuSize = mtuSize;
    }

    return this.mtuSize;
  }

  async requestConnectionPriority(
    connectionPriority: "Balanced" | "High" | "LowPower"
  ) {
    await decoratePromiseErrors(
      this.device.requestConnectionPriority(
        ConnectionPriority[connectionPriority]
      )
    );
  }

  setScrambleKey() {}

  write = async (buffer: Buffer, txid?: string | null | undefined) => {
    log("ble-frame", "=> " + buffer.toString("hex"));

    if (!this.writeCmdCharacteristic) {
      try {
        await this.writeCharacteristic.writeWithResponse(
          buffer.toString("base64"),
          txid
        );
      } catch (e: any) {
        throw new DisconnectedDeviceDuringOperation(e.message);
      }
    } else {
      try {
        await this.writeCmdCharacteristic.writeWithoutResponse(
          buffer.toString("base64"),
          txid
        );
      } catch (e: any) {
        throw new DisconnectedDeviceDuringOperation(e.message);
      }
    }
  };

  async close(): Promise<void> {
    // Clear any potential leftover timeouts
    if (this.disconnectTimeout) {
      clearTimeout(this.disconnectTimeout);
    }

    let resolve;
    const disconnectPromise = new Promise<void>((res) => {
      resolve = res;
    });

    // Queue a disconnect
    this.disconnectTimeout = setTimeout(() => {
      BluetoothTransport.disconnect(this.id);
      resolve();
    }, connectOptions.forceDisconnectTimeout as number);

    // For cases where an exchange hasn't resolve and we triggered a `close` we
    // introduce a timeout to forcefully disconnect in order to unblock subsequent
    // usages of the `withDevice` logic.
    await Promise.race([
      this.exchangeBusyPromise || Promise.resolve(),
      disconnectPromise,
    ]);

    return;
  }
}

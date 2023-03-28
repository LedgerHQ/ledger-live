import Transport from "@ledgerhq/hw-transport";
// ---------------------------------------------------------------------------------------------
// Since this is a react-native library and metro bundler does not support
// package exports yet (see: https://github.com/facebook/metro/issues/670)
// we need to import the file directly from the lib folder.
// Otherwise it would force the consumer of the lib to manually "tell" metro to resolve to /lib.
//
// TLDR: /!\ Do not remove the /lib part in the import statements below (@ledgerhq/devices/lib) ! /!\
// See: https://github.com/LedgerHQ/ledger-live/pull/879
import { sendAPDU } from "@ledgerhq/devices/lib/ble/sendAPDU";
import { receiveAPDU } from "@ledgerhq/devices/lib/ble/receiveAPDU";

import type {
  Subscription as TransportSubscription,
  Observer as TransportObserver,
} from "@ledgerhq/hw-transport";
import {
  BleManager,
  ConnectionPriority,
  BleErrorCode,
  LogLevel,
  DeviceId,
  Device,
  Characteristic,
  BleError,
  Subscription,
} from "react-native-ble-plx";
import {
  BluetoothInfos,
  getBluetoothServiceUuids,
  getInfosForServiceUuid,
} from "@ledgerhq/devices";
import type { DeviceModel } from "@ledgerhq/devices";
import { log } from "@ledgerhq/logs";
import { Observable, defer, merge, from, of, throwError, Observer } from "rxjs";
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
  HwTransportError,
} from "@ledgerhq/errors";
import { monitorCharacteristic } from "./monitorCharacteristic";
import { awaitsBleOn } from "./awaitsBleOn";
import {
  decoratePromiseErrors,
  mapBleErrorToHwTransportError,
  remapError,
} from "./remapErrors";
import { ReconnectionConfig } from "./types";

/**
 * This is potentially not needed anymore, to be checked if the bug is still
 * happening.
 */
let reconnectionConfig: ReconnectionConfig | null | undefined = {
  pairingThreshold: 1000,
  delayAfterFirstPairing: 4000,
};

export const setReconnectionConfig = (
  config: ReconnectionConfig | null | undefined
): void => {
  reconnectionConfig = config;
};

const retrieveInfos = (device: Device | null) => {
  if (!device || !device.serviceUUIDs) return;
  const [serviceUUID] = device.serviceUUIDs;
  if (!serviceUUID) return;
  const infos = getInfosForServiceUuid(serviceUUID);
  if (!infos) return;
  return infos;
};

const delay = (ms: number | undefined) =>
  new Promise((success) => setTimeout(success, ms));

/**
 * A cache of Bluetooth transport instances associated with device IDs.
 * Allows efficient storage and retrieval of previously initialized transports.
 * @type {Object.<string, BluetoothTransport>}
 */
const transportsCache: { [deviceId: string]: BleTransport } = {};

// connectOptions is actually used by react-native-ble-plx even if comment above ConnectionOptions says it's not used
let connectOptions: Record<string, unknown> = {
  // 156 bytes to max the iOS < 10 limit (158 bytes)
  // (185 bytes for iOS >= 10)(up to 512 bytes for Android, but could be blocked at 23 bytes)
  requestMTU: 156,
  // Priority 1 = high. TODO: Check firmware update over BLE PR before merging
  connectionPriority: 1,
};

/**
 * Returns the instance of the Bluetooth Low Energy Manager. It initializes it only
 * when it's first needed, preventing the permission prompt happening prematurely.
 * Important: Do NOT access the _bleManager variable directly.
 * Use this function instead.
 * @returns {BleManager} - The instance of the BleManager.
 */
let _bleManager: BleManager | null = null;
const bleManagerInstance = (): BleManager => {
  if (!_bleManager) {
    _bleManager = new BleManager();
  }

  return _bleManager;
};

const clearDisconnectTimeout = (deviceId: string): void => {
  const cachedTransport = transportsCache[deviceId];
  if (cachedTransport && cachedTransport.disconnectTimeout) {
    log(TAG, "Clearing queued disconnect");
    clearTimeout(cachedTransport.disconnectTimeout);
  }
};

async function open(deviceOrId: Device | string, needsReconnect: boolean) {
  let device: Device;
  log(TAG, `open with ${deviceOrId}`);

  if (typeof deviceOrId === "string") {
    if (transportsCache[deviceOrId]) {
      log(TAG, "Transport in cache, using that.");
      clearDisconnectTimeout(deviceOrId);
      return transportsCache[deviceOrId];
    }

    log(TAG, `Tries to open device: ${deviceOrId}`);
    await awaitsBleOn(bleManagerInstance());

    // Returns a list of known devices by their identifiers
    const devices = await bleManagerInstance().devices([deviceOrId]);
    log(TAG, `found ${devices.length} devices`);
    [device] = devices;

    if (!device) {
      // Returns a list of the peripherals currently connected to the system
      // which have discovered services, connected to system doesn't mean
      // connected to our app, we check that below.
      const connectedDevices = await bleManagerInstance().connectedDevices(
        getBluetoothServiceUuids()
      );
      const connectedDevicesFiltered = connectedDevices.filter(
        (d) => d.id === deviceOrId
      );
      log(TAG, `found ${connectedDevicesFiltered.length} connected devices`);
      [device] = connectedDevicesFiltered;
    }

    if (!device) {
      // We still don't have a device, so we attempt to connect to it.
      log(TAG, `connectToDevice(${deviceOrId})`);
      // Nb ConnectionOptions dropped since it's not used internally by ble-plx.
      try {
        device = await bleManagerInstance().connectToDevice(
          deviceOrId,
          connectOptions
        );
      } catch (e: any) {
        log(TAG, `error code ${e.errorCode}`);
        if (e.errorCode === BleErrorCode.DeviceMTUChangeFailed) {
          // If the MTU update did not work, we try to connect without requesting for a specific MTU
          connectOptions = {};
          device = await bleManagerInstance().connectToDevice(deviceOrId);
        } else {
          throw e;
        }
      }
    }

    if (!device) {
      throw new CantOpenDevice();
    }
  } else {
    // It was already a Device
    device = deviceOrId;
  }

  if (!(await device.isConnected())) {
    log(TAG, "not connected. connecting...");
    try {
      await device.connect(connectOptions);
    } catch (e: any) {
      if (e.errorCode === BleErrorCode.DeviceMTUChangeFailed) {
        // If the MTU update did not work, we try to connect without requesting for a specific MTU
        connectOptions = {};
        await device.connect();
      } else {
        throw e;
      }
    }
  }

  await device.discoverAllServicesAndCharacteristics();
  let res: BluetoothInfos | undefined = retrieveInfos(device);
  let characteristics: Characteristic[] | undefined;

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

  let writeC: Characteristic | null | undefined;
  let writeCmdC: Characteristic | undefined;
  let notifyC: Characteristic | null | undefined;

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
      "BLECharacteristicNotFound"
    );
  }

  if (!notifyC) {
    throw new TransportError(
      "notify characteristic not found",
      "BLECharacteristicNotFound"
    );
  }

  if (!writeC.isWritableWithResponse) {
    throw new TransportError(
      "write characteristic not writableWithResponse",
      "BLECharacteristicInvalid"
    );
  }

  if (!notifyC.isNotifiable) {
    throw new TransportError(
      "notify characteristic not notifiable",
      "BLECharacteristicInvalid"
    );
  }

  if (writeCmdC) {
    if (!writeCmdC.isWritableWithoutResponse) {
      throw new TransportError(
        "write cmd characteristic not writableWithoutResponse",
        "BLECharacteristicInvalid"
      );
    }
  }

  log(TAG, `device.mtu=${device.mtu}`);
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
  const transport = new BleTransport(
    device,
    writeC,
    writeCmdC,
    notifyObservable,
    deviceModel
  );

  // Keeping it as a comment for now but if no new bluetooth issues occur, we will be able to remove it
  // await transport.requestConnectionPriority("High");
  // eslint-disable-next-line prefer-const
  let disconnectedSub: Subscription;
  const onDisconnect = (e: BleError | null) => {
    transport.isConnected = false;
    transport.notYetDisconnected = false;
    notif.unsubscribe();
    disconnectedSub?.remove();

    clearDisconnectTimeout(transport.id);
    delete transportsCache[transport.id];
    log(TAG, `BleTransport(${transport.id}) disconnected`);
    transport.emit("disconnect", e);
  };

  // eslint-disable-next-line require-atomic-updates
  transportsCache[transport.id] = transport;
  const beforeMTUTime = Date.now();

  disconnectedSub = device.onDisconnected((e) => {
    if (!transport.notYetDisconnected) return;
    onDisconnect(e);
  });

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
        await BleTransport.disconnect(transport.id).catch(() => {});
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
 * import BleTransport from "@ledgerhq/react-native-hw-transport-ble";
 */
const TAG = "ble-verbose";
export default class BleTransport extends Transport {
  static disconnectTimeoutMs = 5000;
  /**
   *
   */
  static isSupported = (): Promise<boolean> =>
    Promise.resolve(typeof BleManager === "function");

  /**
   *
   */
  static list = (): Promise<void[]> => {
    throw new Error("not implemented");
  };

  /**
   * Exposed method from the ble-plx library
   * Sets new log level for native module's logging mechanism.
   * @param string logLevel New log level to be set.
   */
  static setLogLevel = (logLevel: string): void => {
    if (Object.values<string>(LogLevel).includes(logLevel)) {
      bleManagerInstance().setLogLevel(logLevel as LogLevel);
    } else {
      throw new Error(`${logLevel} is not a valid LogLevel`);
    }
  };

  /**
   * Listen to state changes on the bleManagerInstance and notify the
   * specified observer.
   * @param observer
   * @returns TransportSubscription
   */
  static observeState(
    observer: Observer<{
      type: string;
      available: boolean;
    }>
  ): TransportSubscription {
    const emitFromState = (type: string) => {
      observer.next({
        type,
        available: type === "PoweredOn",
      });
    };

    bleManagerInstance().onStateChange(emitFromState, true);

    return {
      unsubscribe: () => {},
    };
  }

  /**
   * Scan for bluetooth Ledger devices
   * @param observer Device is partial in order to avoid the live-common/this dep
   * @returns TransportSubscription
   */
  static listen(
    observer: TransportObserver<any, HwTransportError>
  ): TransportSubscription {
    log(TAG, "listening for devices");

    let unsubscribed: boolean;

    const stateSub = bleManagerInstance().onStateChange(async (state) => {
      if (state === "PoweredOn") {
        stateSub.remove();
        const devices = await bleManagerInstance().connectedDevices(
          getBluetoothServiceUuids()
        );
        if (unsubscribed) return;
        if (devices.length) {
          log(TAG, "disconnecting from devices");

          await Promise.all(
            devices.map((d) => BleTransport.disconnect(d.id).catch(() => {}))
          );
        }

        if (unsubscribed) return;
        bleManagerInstance().startDeviceScan(
          getBluetoothServiceUuids(),
          null,
          (bleError: BleError | null, scannedDevice: Device | null) => {
            if (bleError) {
              observer.error(mapBleErrorToHwTransportError(bleError));
              unsubscribe();
              return;
            }

            const res = retrieveInfos(scannedDevice);
            const deviceModel = res && res.deviceModel;

            if (scannedDevice) {
              observer.next({
                type: "add",
                descriptor: scannedDevice,
                deviceModel,
              });
            }
          }
        );
      }
    }, true);

    const unsubscribe = () => {
      unsubscribed = true;
      bleManagerInstance().stopDeviceScan();
      stateSub.remove();

      log(TAG, "done listening.");
    };

    return {
      unsubscribe,
    };
  }

  /**
   * Open a BLE transport
   * @param {Device | string} deviceOrId
   */
  static async open(deviceOrId: Device | string): Promise<BleTransport> {
    return open(deviceOrId, true);
  }

  /**
   * Exposed method from the ble-plx library
   * Disconnects from {@link Device} if it's connected or cancels pending connection.
   */
  static disconnect = async (id: DeviceId): Promise<void> => {
    log(TAG, `user disconnect(${id})`);
    await bleManagerInstance().cancelDeviceConnection(id);
    log(TAG, "disconnected");
  };

  device: Device;
  deviceModel: DeviceModel;
  disconnectTimeout: null | ReturnType<typeof setTimeout> = null;
  id: string;
  isConnected = true;
  mtuSize = 20;
  notifyObservable: Observable<any>;
  notYetDisconnected = true;
  writeCharacteristic: Characteristic;
  writeCmdCharacteristic: Characteristic | undefined;

  constructor(
    device: Device,
    writeCharacteristic: Characteristic,
    writeCmdCharacteristic: Characteristic | undefined,
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

    log(TAG, `BleTransport(${String(this.id)}) new instance`);
    clearDisconnectTimeout(this.id);
  }

  /**
   * Send data to the device using a low level API.
   * It's recommended to use the "send" method for a higher level API.
   * @param {Buffer} apdu - The data to send.
   * @returns {Promise<Buffer>} A promise that resolves with the response data from the device.
   */
  exchange = (apdu: Buffer): Promise<any> =>
    this.exchangeAtomicImpl(async () => {
      try {
        const msgIn = apdu.toString("hex");
        log("apdu", `=> ${msgIn}`);

        const data = await merge(
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
          await bleManagerInstance()
            .cancelDeviceConnection(this.id)
            .catch(() => {}); // but we ignore if disconnect worked.
        }

        throw remapError(e);
      }
    });

  /**
   * Negotiate with the device the maximum transfer unit for the ble frames
   * @returns Promise<number>
   */
  async inferMTU(): Promise<number> {
    let { mtu } = this.device;

    await this.exchangeAtomicImpl(async () => {
      try {
        mtu = await merge(
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
        ).toPromise();
      } catch (e: any) {
        log("ble-error", "inferMTU got " + JSON.stringify(e));

        await bleManagerInstance()
          .cancelDeviceConnection(this.id)
          .catch(() => {}); // but we ignore if disconnect worked.

        throw remapError(e);
      }
    });

    if (mtu > 20) {
      this.mtuSize = mtu;
      log(TAG, `BleTransport(${this.id}) mtu set to ${this.mtuSize}`);
    }

    return this.mtuSize;
  }

  /**
   * Exposed method from the ble-plx library
   * Request the connection priority for the given device.
   * @param {"Balanced" | "High" | "LowPower"} connectionPriority: Connection priority.
   * @returns {Promise<Device>} Connected device.
   */
  async requestConnectionPriority(
    connectionPriority: "Balanced" | "High" | "LowPower"
  ): Promise<Device> {
    return await decoratePromiseErrors(
      this.device.requestConnectionPriority(
        ConnectionPriority[connectionPriority as keyof ConnectionPriority]
      )
    );
  }

  /**
   * Do not call this directly unless you know what you're doing. Communication
   * with a Ledger device should be through the {@link exchange} method.
   * @param buffer
   * @param txid
   */
  write = async (buffer: Buffer, txid?: string | undefined): Promise<void> => {
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

  /**
   * We intentionally do not immediately close a transport connection.
   * Instead, we queue the disconnect and wait for a future connection to dismiss the event.
   * This approach prevents unnecessary disconnects and reconnects. We use the isConnected
   * flag to ensure that we do not trigger a disconnect if the current cached transport has
   * already been disconnected.
   * @returns {Promise<void>}
   */
  async close(): Promise<void> {
    let resolve: (value: void | PromiseLike<void>) => void;
    const disconnectPromise = new Promise<void>((innerResolve) => {
      resolve = innerResolve;
    });

    clearDisconnectTimeout(this.id);

    log(TAG, "Queuing a disconnect");

    this.disconnectTimeout = setTimeout(() => {
      log(TAG, `Triggering a disconnect from ${this.id}`);
      if (this.isConnected) {
        BleTransport.disconnect(this.id)
          .catch(() => {})
          .finally(resolve);
      } else {
        resolve();
      }
    }, BleTransport.disconnectTimeoutMs);

    // The closure will occur no later than 5s, triggered either by disconnection
    // or the actual response of the apdu.
    await Promise.race([
      this.exchangeBusyPromise || Promise.resolve(),
      disconnectPromise,
    ]);

    return;
  }
}

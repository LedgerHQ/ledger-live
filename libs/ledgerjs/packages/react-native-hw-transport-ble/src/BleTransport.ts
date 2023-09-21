import Transport from "@ledgerhq/hw-transport";
import type {
  Subscription as TransportSubscription,
  Observer as TransportObserver,
} from "@ledgerhq/hw-transport";
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
  DeviceModelId,
  getBluetoothServiceUuids,
  getInfosForServiceUuid,
} from "@ledgerhq/devices";
import type { DeviceModel } from "@ledgerhq/devices";
import { trace, LocalTracer, TraceContext } from "@ledgerhq/logs";
import { Observable, defer, merge, from, of, throwError, Observer } from "rxjs";
import { share, ignoreElements, first, map, tap, catchError } from "rxjs/operators";
import {
  CantOpenDevice,
  TransportError,
  DisconnectedDeviceDuringOperation,
  PairingFailed,
  PeerRemovedPairing,
  HwTransportError,
} from "@ledgerhq/errors";
import { monitorCharacteristic } from "./monitorCharacteristic";
import { awaitsBleOn } from "./awaitsBleOn";
import { decoratePromiseErrors, remapError, mapBleErrorToHwTransportError } from "./remapErrors";
import { ReconnectionConfig } from "./types";

const LOG_TYPE = "ble-verbose";

/**
 * This is potentially not needed anymore, to be checked if the bug is still
 * happening.
 */
let reconnectionConfig: ReconnectionConfig | null | undefined = {
  pairingThreshold: 1000,
  delayAfterFirstPairing: 4000,
};

export const setReconnectionConfig = (config: ReconnectionConfig | null | undefined): void => {
  reconnectionConfig = config;
};

const retrieveInfos = (device: Device | null) => {
  if (!device || !device.serviceUUIDs) return;
  const [serviceUUID] = device.serviceUUIDs;
  if (!serviceUUID) return;
  const infos = getInfosForServiceUuid(serviceUUID);
  if (!infos) return;

  // If we retrieved information, update the cache
  bluetoothInfoCache[device.id] = infos;
  return infos;
};

const delay = (ms: number | undefined) => new Promise(success => setTimeout(success, ms));

/**
 * A cache of Bluetooth transport instances associated with device IDs.
 * Allows efficient storage and retrieval of previously initialized transports.
 * @type {Object.<string, BluetoothTransport>}
 */
const transportsCache: { [deviceId: string]: BleTransport } = {};
const bluetoothInfoCache: { [deviceUuid: string]: BluetoothInfos } = {}; // Allows us to give more granulary error messages.

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

const clearDisconnectTimeout = (deviceId: string, context?: TraceContext): void => {
  const cachedTransport = transportsCache[deviceId];
  if (cachedTransport && cachedTransport.disconnectTimeout) {
    trace({ type: LOG_TYPE, message: "Clearing queued disconnect", context });
    clearTimeout(cachedTransport.disconnectTimeout);
  }
};

/**
 * Opens a BLE connection with a given device. Returns a Transport instance.
 *
 * @param deviceOrId
 * @param needsReconnect
 * @param timeoutMs TODO: to keep, used in a separate PR
 * @param context Optional tracing/log context
 * @returns A BleTransport instance
 */
async function open(
  deviceOrId: Device | string,
  needsReconnect: boolean,
  timeoutMs?: number,
  context?: TraceContext,
) {
  const tracer = new LocalTracer(LOG_TYPE, context);
  let device: Device;
  tracer.trace(`Opening ${deviceOrId}`, { needsReconnect });

  if (typeof deviceOrId === "string") {
    if (transportsCache[deviceOrId]) {
      tracer.trace(`Transport in cache, using it`);
      clearDisconnectTimeout(deviceOrId);

      // The cached transport probably has an older trace/log context
      transportsCache[deviceOrId].setTraceContext(context);
      return transportsCache[deviceOrId];
    }

    tracer.trace(`Trying to open device: ${deviceOrId}`);
    await awaitsBleOn(bleManagerInstance());

    // Returns a list of known devices by their identifiers
    const devices = await bleManagerInstance().devices([deviceOrId]);
    tracer.trace(`Found ${devices.length} already known device(s) with given id`, { deviceOrId });
    [device] = devices;

    if (!device) {
      // Returns a list of the peripherals currently connected to the system
      // which have discovered services, connected to system doesn't mean
      // connected to our app, we check that below.
      const connectedDevices = await bleManagerInstance().connectedDevices(
        getBluetoothServiceUuids(),
      );
      const connectedDevicesFiltered = connectedDevices.filter(d => d.id === deviceOrId);
      tracer.trace(
        `No known device with given id. Found ${connectedDevicesFiltered.length} devices from already connected devices`,
        { deviceOrId },
      );
      [device] = connectedDevicesFiltered;
    }

    if (!device) {
      // We still don't have a device, so we attempt to connect to it.
      tracer.trace(`No known nor connected devices with given id. Trying to connect to device`, {
        deviceOrId,
        timeoutMs,
      });

      // Nb ConnectionOptions dropped since it's not used internally by ble-plx.
      try {
        device = await bleManagerInstance().connectToDevice(deviceOrId, connectOptions);
      } catch (e: any) {
        tracer.trace(`Error code: ${e.errorCode}`);
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
    tracer.trace(`Device found but not connected. connecting...`, { timeoutMs, connectOptions });
    try {
      await device.connect({ ...connectOptions });
    } catch (error: any) {
      tracer.trace(`Connect error`, { error });
      if (error.errorCode === BleErrorCode.DeviceMTUChangeFailed) {
        tracer.trace(`Device mtu=${device.mtu}, reconnecting`);
        connectOptions = {};
        await device.connect();
      } else if (error.iosErrorCode === 14 || error.reason === "Peer removed pairing information") {
        tracer.trace(`iOS broken pairing`, {
          device,
          bluetoothInfoCache: bluetoothInfoCache[device.id],
        });
        const { deviceModel } = bluetoothInfoCache[device.id] || {};
        const { productName } = deviceModel || {};
        throw new PeerRemovedPairing(undefined, {
          deviceName: device.name,
          productName,
        });
      } else {
        throw remapError(error);
      }
    }
  }

  tracer.trace(`Device is connected now, getting services and characteristics`);
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
    tracer.trace(`Service not found`);
    throw new TransportError("service not found", "BLEServiceNotFound");
  }

  const { deviceModel, serviceUuid, writeUuid, writeCmdUuid, notifyUuid } = res;

  if (!characteristics) {
    characteristics = await device.characteristicsForService(serviceUuid);
  }

  if (!characteristics) {
    tracer.trace(`Characteristics not found`);
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
    throw new TransportError("write characteristic not found", "BLECharacteristicNotFound");
  }

  if (!notifyC) {
    throw new TransportError("notify characteristic not found", "BLECharacteristicNotFound");
  }

  if (!writeC.isWritableWithResponse) {
    throw new TransportError(
      "write characteristic not writableWithResponse",
      "BLECharacteristicInvalid",
    );
  }

  if (!notifyC.isNotifiable) {
    throw new TransportError("notify characteristic not notifiable", "BLECharacteristicInvalid");
  }

  if (writeCmdC) {
    if (!writeCmdC.isWritableWithoutResponse) {
      throw new TransportError(
        "write cmd characteristic not writableWithoutResponse",
        "BLECharacteristicInvalid",
      );
    }
  }

  tracer.trace(`device.mtu=${device.mtu}`);
  const notifyObservable = monitorCharacteristic(notifyC, context).pipe(
    catchError(e => {
      // LL-9033 fw 2.0.2 introduced this case, we silence the inner unhandled error.
      const msg = String(e);
      return msg.includes("notify change failed") ? of(new PairingFailed(msg)) : throwError(e);
    }),
    tap(value => {
      if (value instanceof PairingFailed) return;
      trace({ type: "ble-frame", message: `<= ${value.toString("hex")}`, context });
    }),
    share(),
  );
  const notif = notifyObservable.subscribe();

  const transport = new BleTransport(device, writeC, writeCmdC, notifyObservable, deviceModel, {
    context,
  });
  tracer.trace(`New BleTransport created`);

  // Keeping it as a comment for now but if no new bluetooth issues occur, we will be able to remove it
  // await transport.requestConnectionPriority("High");
  // eslint-disable-next-line prefer-const
  let disconnectedSub: Subscription;
  const onDisconnect = (error: BleError | null) => {
    transport.isConnected = false;
    transport.notYetDisconnected = false;
    notif.unsubscribe();
    disconnectedSub?.remove();

    clearDisconnectTimeout(transport.id);
    delete transportsCache[transport.id];
    tracer.trace(
      `On device disconnected callback: cleared cached transport for ${transport.id}, emitting Transport event "disconnect"`,
      { reason: error },
    );
    transport.emit("disconnect", error);
  };

  // eslint-disable-next-line require-atomic-updates
  transportsCache[transport.id] = transport;
  const beforeMTUTime = Date.now();

  disconnectedSub = device.onDisconnected(e => {
    if (!transport.notYetDisconnected) return;
    onDisconnect(e);
  });

  try {
    await transport.inferMTU();
  } finally {
    const afterMTUTime = Date.now();

    if (reconnectionConfig) {
      // Refer to ledgerjs archived repo issue #279
      // All HW .v1 LNX have a bug that prevents us from communicating with the device right after pairing.
      // When we connect for the first time we issue a disconnect and reconnect, this guarantees that we are
      // in a good state. This is avoidable in some key scenarios ↓
      if (afterMTUTime - beforeMTUTime < reconnectionConfig.pairingThreshold) {
        needsReconnect = false;
      } else if (deviceModel.id === DeviceModelId.stax) {
        tracer.trace(`Skipping "needsReconnect" strategy for Stax`);
        needsReconnect = false;
      }

      if (needsReconnect) {
        await BleTransport.disconnect(transport.id).catch(() => {});
        await delay(reconnectionConfig.delayAfterFirstPairing);
      }
    } else {
      needsReconnect = false;
    }
  }

  if (needsReconnect) {
    tracer.trace(`Reconnecting`);
    return open(device, false, timeoutMs, context);
  }

  return transport;
}

/**
 * react-native bluetooth BLE implementation
 * @example
 * import BleTransport from "@ledgerhq/react-native-hw-transport-ble";
 */
export default class BleTransport extends Transport {
  static disconnectTimeoutMs = 5000;
  /**
   *
   */
  static isSupported = (): Promise<boolean> => Promise.resolve(typeof BleManager === "function");

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
    }>,
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
    observer: TransportObserver<any, HwTransportError>,
    context?: TraceContext,
  ): TransportSubscription {
    const tracer = new LocalTracer(LOG_TYPE, context);
    tracer.trace("Listening for devices ...");

    let unsubscribed: boolean;

    const stateSub = bleManagerInstance().onStateChange(async state => {
      if (state === "PoweredOn") {
        stateSub.remove();
        const devices = await bleManagerInstance().connectedDevices(getBluetoothServiceUuids());
        if (unsubscribed) return;
        if (devices.length) {
          tracer.trace("Disconnecting from all devices", { deviceCount: devices.length });

          await Promise.all(devices.map(d => BleTransport.disconnect(d.id).catch(() => {})));
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
          },
        );
      }
    }, true);

    const unsubscribe = () => {
      unsubscribed = true;
      bleManagerInstance().stopDeviceScan();
      stateSub.remove();

      tracer.trace("Done listening");
    };

    return {
      unsubscribe,
    };
  }

  /**
   * Opens a BLE transport
   *
   * @param {Device | string} deviceOrId
   * @param timeoutMs TODO: to keep, used in a separate PR
   * @param context An optional context object for log/tracing strategy
   */
  static async open(
    deviceOrId: Device | string,
    timeoutMs?: number,
    context?: TraceContext,
  ): Promise<BleTransport> {
    return open(deviceOrId, true, timeoutMs, context);
  }

  /**
   * Exposes method from the ble-plx library to disconnect a device
   *
   * Disconnects from {@link Device} if it's connected or cancels pending connection.
   */
  static disconnect = async (id: DeviceId, context?: TraceContext): Promise<void> => {
    trace({
      type: LOG_TYPE,
      message: `Trying to disconnect device ${id})`,
      context,
    });
    await bleManagerInstance().cancelDeviceConnection(id);
    trace({
      type: LOG_TYPE,
      message: `Device ${id} disconnected`,
      context,
    });
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
    deviceModel: DeviceModel,
    { context }: { context?: TraceContext } = {},
  ) {
    super({ context, logType: LOG_TYPE });
    this.id = device.id;
    this.device = device;
    this.writeCharacteristic = writeCharacteristic;
    this.writeCmdCharacteristic = writeCmdCharacteristic;
    this.notifyObservable = notifyObservable;
    this.deviceModel = deviceModel;

    clearDisconnectTimeout(this.id);

    this.tracer.trace(`New instance of BleTransport for device ${this.id}`);
  }

  /**
   * Send data to the device using a low level API.
   * It's recommended to use the "send" method for a higher level API.
   *
   * @param {Buffer} apdu - The data to send.
   * @returns {Promise<Buffer>} A promise that resolves with the response data from the device.
   */
  exchange = (apdu: Buffer): Promise<any> => {
    const tracer = this.tracer.withUpdatedContext({
      function: "exchange",
    });
    tracer.trace("Exchanging APDU ...");

    return this.exchangeAtomicImpl(async () => {
      try {
        const msgIn = apdu.toString("hex");
        tracer.withType("apdu").trace(`=> ${msgIn}`);

        const data = await merge(
          this.notifyObservable.pipe(receiveAPDU),
          sendAPDU(this.write, apdu, this.mtuSize),
        ).toPromise();

        const msgOut = data.toString("hex");
        tracer.withType("apdu").trace(`<= ${msgOut}`);

        return data;
      } catch (error: any) {
        tracer.withType("ble-error").trace(`Error while exchanging APDU`, { error });

        if (this.notYetDisconnected) {
          // in such case we will always disconnect because something is bad.
          await bleManagerInstance()
            .cancelDeviceConnection(this.id)
            .catch(() => {}); // but we ignore if disconnect worked.
        }

        const mappedError = remapError(error);
        tracer.trace("Error while exchanging APDU, mapped and throws following error", {
          mappedError,
        });
        throw mappedError;
      }
    });
  };

  /**
   * Negotiate with the device the maximum transfer unit for the ble frames
   * @returns Promise<number>
   */
  async inferMTU(): Promise<number> {
    let { mtu } = this.device;
    this.tracer.trace(`Inferring MTU ...`, { currentDeviceMtu: mtu });

    await this.exchangeAtomicImpl(async () => {
      try {
        mtu = await merge(
          this.notifyObservable.pipe(
            tap(maybeError => {
              if (maybeError instanceof Error) throw maybeError;
            }),
            first(buffer => buffer.readUInt8(0) === 0x08),
            map(buffer => buffer.readUInt8(5)),
          ),
          defer(() => from(this.write(Buffer.from([0x08, 0, 0, 0, 0])))).pipe(ignoreElements()),
        ).toPromise();
      } catch (error: any) {
        this.tracer.withType("ble-error").trace("Error while inferring MTU", { mtu });

        await bleManagerInstance()
          .cancelDeviceConnection(this.id)
          .catch(() => {}); // but we ignore if disconnect worked.

        const mappedError = remapError(error);
        this.tracer.trace("Error while inferring APDU, mapped and throws following error", {
          mappedError,
        });
        throw mappedError;
      }
    });

    this.tracer.trace(`Successfully negotiated MTU with device`, {
      mtu,
      mtuSize: this.mtuSize,
    });
    if (mtu > 20) {
      this.mtuSize = mtu;
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
    connectionPriority: "Balanced" | "High" | "LowPower",
  ): Promise<Device> {
    return await decoratePromiseErrors(
      this.device.requestConnectionPriority(ConnectionPriority[connectionPriority]),
    );
  }

  /**
   * Do not call this directly unless you know what you're doing. Communication
   * with a Ledger device should be through the {@link exchange} method.
   * @param buffer
   * @param txid
   */
  write = async (buffer: Buffer, txid?: string | undefined): Promise<void> => {
    try {
      if (!this.writeCmdCharacteristic) {
        await this.writeCharacteristic.writeWithResponse(buffer.toString("base64"), txid);
      } else {
        await this.writeCmdCharacteristic.writeWithoutResponse(buffer.toString("base64"), txid);
      }
      this.tracer.withType("ble-frame").trace("=> " + buffer.toString("hex"));
    } catch (error: unknown) {
      this.tracer.trace("Error while writing APDU", { error });
      throw new DisconnectedDeviceDuringOperation(
        error instanceof Error ? error.message : `${error}`,
      );
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
    this.tracer.trace("Closing, queuing a disconnect ...");

    let resolve: (value: void | PromiseLike<void>) => void;
    const disconnectPromise = new Promise<void>(innerResolve => {
      resolve = innerResolve;
    });

    clearDisconnectTimeout(this.id);

    this.disconnectTimeout = setTimeout(() => {
      if (this.isConnected) {
        BleTransport.disconnect(this.id, this.tracer.getContext())
          .catch(() => {})
          .finally(resolve);
      } else {
        resolve();
      }
    }, BleTransport.disconnectTimeoutMs);

    // The closure will occur no later than 5s, triggered either by disconnection
    // or the actual response of the apdu.
    await Promise.race([this.exchangeBusyPromise || Promise.resolve(), disconnectPromise]);

    return;
  }
}

import { v4 as uuid } from "uuid";
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
import {
  Observable,
  defer,
  merge,
  from,
  of,
  throwError,
  Observer,
  firstValueFrom,
  TimeoutError,
  SchedulerLike,
} from "rxjs";
import {
  share,
  ignoreElements,
  first,
  map,
  tap,
  catchError,
  timeout,
  finalize,
} from "rxjs/operators";
import {
  CantOpenDevice,
  TransportError,
  DisconnectedDeviceDuringOperation,
  PairingFailed,
  PeerRemovedPairing,
  HwTransportError,
  ExchangeTimeoutError,
} from "@ledgerhq/errors";
import { monitorCharacteristic } from "./monitorCharacteristic";
import { awaitsBleOn } from "./awaitsBleOn";
import {
  decoratePromiseErrors,
  remapError,
  mapBleErrorToHwTransportError,
  IOBleErrorRemap,
} from "./remapErrors";
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
 * @param timeoutMs Optional Timeout (in ms) applied during the connection with the device
 * @param context Optional tracing/log context
 * @param injectedDependencies Contains optional injected dependencies used by the transport implementation
 *  - rxjsScheduler: dependency injected RxJS scheduler to control time. Default AsyncScheduler.
 * @returns A BleTransport instance
 */
async function open(
  deviceOrId: Device | string,
  needsReconnect: boolean,
  timeoutMs?: number,
  context?: TraceContext,
  { rxjsScheduler }: { rxjsScheduler?: SchedulerLike } = {},
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
        device = await bleManagerInstance().connectToDevice(deviceOrId, {
          ...connectOptions,
          timeout: timeoutMs,
        });
      } catch (e: any) {
        tracer.trace(`Error code: ${e.errorCode}`);
        if (e.errorCode === BleErrorCode.DeviceMTUChangeFailed) {
          // If the MTU update did not work, we try to connect without requesting for a specific MTU
          connectOptions = {};
          device = await bleManagerInstance().connectToDevice(deviceOrId, { timeout: timeoutMs });
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
      await device.connect({ ...connectOptions, timeout: timeoutMs });
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
      }
      // This case should not happen, but recording logs to be warned if we see it in production
      else if (error.errorCode === BleErrorCode.DeviceAlreadyConnected) {
        tracer.trace(`Device already connected, while it was not supposed to`, {
          error,
        });

        throw remapError(error);
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

  // Inits the observable that will emit received data from the device via BLE
  const notifyObservable = monitorCharacteristic(notifyC, context).pipe(
    catchError(e => {
      // LL-9033 fw 2.0.2 introduced this case, we silence the inner unhandled error.
      // It will be handled when negotiating the MTU in `inferMTU` but will be ignored in other cases.
      const msg = String(e);
      return msg.includes("notify change failed")
        ? of(new PairingFailed(msg))
        : throwError(() => e);
    }),
    tap(value => {
      if (value instanceof PairingFailed) return;
      trace({ type: "ble-frame", message: `<= ${value.toString("hex")}`, context });
    }),
    // Returns a new Observable that multicasts (shares) the original Observable.
    // As long as there is at least one Subscriber this Observable will be subscribed and emitting data.
    share(),
  );

  // Keeps the input from the device observable alive (multicast observable)
  const notif = notifyObservable.subscribe();

  const transport = new BleTransport(device, writeC, writeCmdC, notifyObservable, deviceModel, {
    context,
    rxjsScheduler,
  });
  tracer.trace(`New BleTransport created`);

  // Keeping it as a comment for now but if no new bluetooth issues occur, we will be able to remove it
  // await transport.requestConnectionPriority("High");

  // eslint-disable-next-line prefer-const
  let disconnectedSub: Subscription;

  // Callbacks on `react-native-ble-plx` notifying the device has been disconnected
  const onDisconnect = (error: BleError | null) => {
    transport.isConnected = false;
    transport.notYetDisconnected = false;
    notif.unsubscribe();
    disconnectedSub?.remove();

    clearDisconnectTimeout(transport.id);
    delete transportsCache[transport.id];
    tracer.trace(
      `On device disconnected callback: cleared cached transport for ${transport.id}, emitting Transport event "disconnect. Error: ${error}"`,
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
        tracer.trace(`Device needs reconnection. Triggering a disconnect`);
        await BleTransport.disconnectDevice(transport.id);
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

          await Promise.all(devices.map(d => BleTransport.disconnectDevice(d.id)));
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
   * @param timeoutMs Applied when trying to connect to a device
   * @param context An optional context object for log/tracing strategy
   * @param injectedDependencies Contains optional injected dependencies used by the transport implementation
   *  - rxjsScheduler: dependency injected RxJS scheduler to control time. Default AsyncScheduler.
   */
  static async open(
    deviceOrId: Device | string,
    timeoutMs?: number,
    context?: TraceContext,
    { rxjsScheduler }: { rxjsScheduler?: SchedulerLike } = {},
  ): Promise<BleTransport> {
    return open(deviceOrId, true, timeoutMs, context, { rxjsScheduler });
  }

  /**
   * Exposes method from the ble-plx library to disconnect a device
   *
   * Disconnects from {@link Device} if it's connected or cancels pending connection.
   * A "disconnect" event will normally be emitted by the ble-plx lib once the device is disconnected.
   * Errors are logged but silenced.
   */
  static disconnectDevice = async (id: DeviceId, context?: TraceContext): Promise<void> => {
    const tracer = new LocalTracer(LOG_TYPE, context);
    tracer.trace(`Trying to disconnect device ${id}`);

    await bleManagerInstance()
      .cancelDeviceConnection(id)
      .catch(error => {
        // Only log, ignore if disconnect did not work
        tracer
          .withType("ble-error")
          .trace(`Error while trying to cancel device connection`, { error });
      });
    tracer.trace(`Device ${id} disconnected`);
  };

  device: Device;
  deviceModel: DeviceModel;
  disconnectTimeout: null | ReturnType<typeof setTimeout> = null;
  id: string;
  isConnected = true;
  mtuSize = 20;
  // Observable emitting data received from the device via BLE
  notifyObservable: Observable<Buffer | Error>;
  notYetDisconnected = true;
  writeCharacteristic: Characteristic;
  writeCmdCharacteristic: Characteristic | undefined;
  rxjsScheduler?: SchedulerLike;
  // Transaction ids of communication operations that are currently pending
  currentTransactionIds: Array<string>;

  /**
   * The static `open` function is used to handle BleTransport instantiation
   *
   * @param device
   * @param writeCharacteristic
   * @param writeCmdCharacteristic
   * @param notifyObservable A multicast observable that emits messages received from the device
   * @param deviceModel
   * @param params Contains optional options and injected dependencies used by the transport implementation
   *  - abortTimeoutMs: stop the exchange after a given timeout. Another timeout exists
   *    to detect unresponsive device (see `unresponsiveTimeout`). This timeout aborts the exchange.
   *  - rxjsScheduler: dependency injected RxJS scheduler to control time. Default: AsyncScheduler.
   */
  constructor(
    device: Device,
    writeCharacteristic: Characteristic,
    writeCmdCharacteristic: Characteristic | undefined,
    notifyObservable: Observable<Buffer | Error>,
    deviceModel: DeviceModel,
    { context, rxjsScheduler }: { context?: TraceContext; rxjsScheduler?: SchedulerLike } = {},
  ) {
    super({ context, logType: LOG_TYPE });
    this.id = device.id;
    this.device = device;
    this.writeCharacteristic = writeCharacteristic;
    this.writeCmdCharacteristic = writeCmdCharacteristic;
    this.notifyObservable = notifyObservable;
    this.deviceModel = deviceModel;
    this.rxjsScheduler = rxjsScheduler;
    this.currentTransactionIds = [];

    clearDisconnectTimeout(this.id);

    this.tracer.trace(`New instance of BleTransport for device ${this.id}`);
  }

  /**
   * A message exchange (APDU request <-> response) with the device that can be aborted
   *
   * The message will be BLE-encoded/framed before being sent, and the response will be BLE-decoded.
   *
   * @param message A buffer (u8 array) of a none BLE-encoded message (an APDU for ex) to be sent to the device
   *   as a request
   * @param options Contains optional options for the exchange function
   *  - abortTimeoutMs: stop the exchange after a given timeout. Another timeout exists
   *    to detect unresponsive device (see `unresponsiveTimeout`). This timeout aborts the exchange.
   * @returns A promise that resolves with the response data from the device.
   */
  exchange = (
    message: Buffer,
    { abortTimeoutMs }: { abortTimeoutMs?: number } = {},
  ): Promise<Buffer> => {
    const tracer = this.tracer.withUpdatedContext({
      function: "exchange",
    });
    tracer.trace("Exchanging APDU ...", { abortTimeoutMs });
    tracer.withType("apdu").trace(`=> ${message.toString("hex")}`);

    return this.exchangeAtomicImpl(() => {
      return firstValueFrom(
        // `sendApdu` will only emit if an error occurred, otherwise it will complete,
        // while `receiveAPDU` will emit the full response.
        // Consequently it monitors the response while being able to reject on an error from the send.
        merge(
          this.notifyObservable.pipe(data => receiveAPDU(data, { context: tracer.getContext() })),
          sendAPDU(this.write, message, this.mtuSize, {
            context: tracer.getContext(),
          }),
        ).pipe(
          abortTimeoutMs ? timeout(abortTimeoutMs, this.rxjsScheduler) : tap(),
          tap(data => {
            tracer.withType("apdu").trace(`<= ${data.toString("hex")}`);
          }),
          catchError(async error => {
            // Currently only 1 reason the exchange has been explicitly aborted (other than job and transport errors): a timeout
            if (error instanceof TimeoutError) {
              tracer.trace(
                "Aborting due to timeout and trying to cancel all communication write of the current exchange",
                {
                  abortTimeoutMs,
                  transactionIds: this.currentTransactionIds,
                },
              );

              // No concurrent exchange should happen at the same time, so all pending operations are part of the same exchange
              this.cancelPendingOperations();

              throw new ExchangeTimeoutError("Exchange aborted due to timeout");
            }

            tracer.withType("ble-error").trace(`Error while exchanging APDU`, { error });

            if (this.notYetDisconnected) {
              // In such case we will always disconnect because something is bad.
              // This sends a "disconnect" event
              await BleTransport.disconnectDevice(this.id);
            }

            const mappedError = remapError(error as IOBleErrorRemap);
            tracer.trace("Error while exchanging APDU, mapped and throws following error", {
              mappedError,
            });
            throw mappedError;
          }),
          finalize(() => {
            tracer.trace("Clearing current transaction ids", {
              currentTransactionIds: this.currentTransactionIds,
            });
            this.clearCurrentTransactionIds();
          }),
        ),
      );
    });
  };

  /**
   * Tries to cancel all operations that have a recorded transaction and are pending
   *
   * Cancelling transaction which doesn't exist is ignored.
   *
   * Note: cancelling `writeCmdCharacteristic.write...` will throw a `BleError` with code `OperationCancelled`
   * but this error should be ignored. (In `exchange` our observable is unsubscribed before `cancelPendingOperations`
   * is called so the error is ignored)
   */
  private cancelPendingOperations() {
    for (const transactionId of this.currentTransactionIds) {
      try {
        this.tracer.trace("Cancelling operation", { transactionId });
        bleManagerInstance().cancelTransaction(transactionId);
      } catch (error) {
        this.tracer.trace("Error while cancelling operation", { transactionId, error });
      }
    }
  }

  /**
   * Sets the collection of current transaction ids to an empty array
   */
  private clearCurrentTransactionIds() {
    this.currentTransactionIds = [];
  }

  /**
   * Negotiate with the device the maximum transfer unit for the ble frames
   * @returns Promise<number>
   */
  async inferMTU(): Promise<number> {
    let { mtu } = this.device;
    this.tracer.trace(`Inferring MTU ...`, { currentDeviceMtu: mtu });

    await this.exchangeAtomicImpl(async () => {
      try {
        mtu = await firstValueFrom(
          merge(
            this.notifyObservable.pipe(
              map(maybeError => {
                // Catches the PairingFailed Error that has only been emitted
                if (maybeError instanceof Error) {
                  throw maybeError;
                }

                return maybeError;
              }),
              first(buffer => buffer.readUInt8(0) === 0x08),
              map(buffer => buffer.readUInt8(5)),
            ),
            defer(() => from(this.write(Buffer.from([0x08, 0, 0, 0, 0])))).pipe(ignoreElements()),
          ),
        );
      } catch (error: any) {
        this.tracer.withType("ble-error").trace("Error while inferring MTU", { mtu });

        await BleTransport.disconnectDevice(this.id);

        const mappedError = remapError(error);
        this.tracer.trace("Error while inferring APDU, mapped and throws following error", {
          mappedError,
        });
        throw mappedError;
      } finally {
        // When negotiating the MTU, a message is sent/written to the device, and a transaction id was associated to this write
        this.clearCurrentTransactionIds();
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
   *
   * For each call a transaction id is added to the current stack of transaction ids.
   * With this transaction id, a pending BLE communication operations can be cancelled.
   * Note: each frame/packet of a longer BLE-encoded message to be sent should have their unique transaction id.
   *
   * @param buffer BLE-encoded packet to send to the device
   * @param frameId Frame id to make `write` aware of a bigger message that this frame/packet is part of.
   *  Helps creating related a collection of transaction ids
   */
  write = async (buffer: Buffer): Promise<void> => {
    const transactionId = uuid();
    this.currentTransactionIds.push(transactionId);

    const tracer = this.tracer.withUpdatedContext({ transactionId });
    tracer.trace("Writing to device", { willMessageBeAcked: !this.writeCmdCharacteristic });

    try {
      if (!this.writeCmdCharacteristic) {
        // The message will be acked by the device
        await this.writeCharacteristic.writeWithResponse(buffer.toString("base64"), transactionId);
      } else {
        // The message won't be acked by the device
        await this.writeCmdCharacteristic.writeWithoutResponse(
          buffer.toString("base64"),
          transactionId,
        );
      }
      tracer.withType("ble-frame").trace("=> " + buffer.toString("hex"));
    } catch (error: unknown) {
      tracer.trace("Error while writing APDU", { error });
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
    const tracer = this.tracer.withUpdatedContext({ function: "close" });
    tracer.trace("Closing, queuing a disconnect with a timeout ...");

    let resolve: (value: void | PromiseLike<void>) => void;
    const disconnectPromise = new Promise<void>(innerResolve => {
      resolve = innerResolve;
    });

    clearDisconnectTimeout(this.id);

    this.disconnectTimeout = setTimeout(() => {
      tracer.trace("Disconnect timeout has been reached ...");
      if (this.isConnected) {
        BleTransport.disconnectDevice(this.id, tracer.getContext())
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

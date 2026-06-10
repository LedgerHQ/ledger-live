import {
  OpeningConnectionError,
  TransportConnectedDevice,
  UnknownDeviceError,
  type ApduReceiverService,
  type ApduSenderService,
  type ConnectError,
  type DeviceId,
  type DmkError,
  type Transport,
  type TransportArgs,
  type TransportConnectedDevice as TransportConnectedDeviceType,
  type TransportDeviceModel,
  type TransportDiscoveredDevice,
  type TransportFactory,
  type TransportIdentifier,
} from "@ledgerhq/device-management-kit";
import { Left, Maybe, Right, type Either } from "purify-ts";
import { BehaviorSubject, Observable } from "rxjs";
import {
  BLE_MTU_HANDSHAKE_TIMEOUT_MS,
  BLE_MTU_REQUEST_FRAME,
  BLE_MTU_RESPONSE_HEADER_TAG,
  DEFAULT_BLE_FRAME_SIZE,
} from "./node-ble-constants";

export const nodeBleIdentifier: TransportIdentifier = "NODE-BLE";

/**
 * Minimal structural surface of `@abandonware/noble` (callback API). noble does
 * not ship its own type declarations, and the transport only relies on this
 * subset, so we keep the contract explicit here — it also gives the tests a
 * small, honest seam to fake.
 */
export type NobleCharacteristic = {
  uuid: string;
  write(data: Buffer, withoutResponse: boolean, cb: (error?: unknown) => void): void;
  subscribe(cb: (error?: unknown) => void): void;
  unsubscribe(cb?: (error?: unknown) => void): void;
  on(event: "data", cb: (data: Buffer) => void): void;
  removeAllListeners(event?: string): void;
};
export type NobleService = {
  uuid: string;
  discoverCharacteristics(
    uuids: string[] | null,
    cb: (error: unknown, characteristics: NobleCharacteristic[]) => void,
  ): void;
};
export type NoblePeripheral = {
  id: string;
  state: string;
  advertisement: { localName?: string; serviceUuids?: string[] };
  connect(cb: (error?: unknown) => void): void;
  disconnect(cb: (error?: unknown) => void): void;
  discoverServices(uuids: string[] | null, cb: (error: unknown, services: NobleService[]) => void): void;
  once(event: "disconnect", cb: () => void): void;
  removeAllListeners(event?: string): void;
};
export type NobleAdapter = {
  state: string;
  on(event: string, cb: (...args: unknown[]) => void): void;
  removeListener(event: string, cb: (...args: unknown[]) => void): void;
  startScanning(serviceUuids: string[], allowDuplicates: boolean, cb?: (error?: unknown) => void): void;
  stopScanning(cb?: () => void): void;
};

const normalizeUuid = (uuid: string): string => uuid.replace(/-/gu, "").toLowerCase();

/** Initial notification sink before the MTU handshake claims the stream. */
const dropNotification = (_data: Buffer): void => {};

const promisify = (fn: (cb: (error?: unknown) => void) => void): Promise<void> =>
  new Promise((resolve, reject) => fn(error => (error ? reject(error) : resolve())));

type BleServiceMatch = {
  deviceModel: TransportDeviceModel;
  writeUuid: string;
  notifyUuid: string;
};

type LiveConnection = {
  peripheral: NoblePeripheral;
  /** Suppress the DMK onDisconnect callback for a disconnect we initiated. */
  markManual(): void;
  /** Release the GATT subscription + data listeners exactly once. */
  cleanup(): void;
};

type Exchange = {
  receiver: ApduReceiverService;
  settled: boolean;
  abortTimer: ReturnType<typeof setTimeout> | null;
  resolve: (value: Either<DmkError, unknown>) => void;
};

/**
 * DMK transport for Ledger devices over Bluetooth Low Energy on Node/Bun,
 * backed by `@abandonware/noble`.
 *
 * Framing is delegated to DMK's own injected ApduSender/ApduReceiver services
 * with `channel = Maybe.zero()` and `padding = false`: with no channel DMK
 * emits exactly the `[0x05][seq(2)][len(2) on frame 0][payload]` block layout
 * Ledger BLE expects, so the transport writes raw frames to the GATT write
 * characteristic and feeds notification buffers straight back to DMK — no
 * hand-rolled framer.
 *
 * BLE service/characteristic UUIDs and device models come from DMK's own
 * `deviceModelDataSource.getBluetoothServicesInfos()`, so the transport stays
 * in sync with the device models DMK knows about (Flex, Stax, Nano X, …).
 * The scan/connect/subscribe plumbing and the 0x08 GET-MTU handshake mirror
 * the proven `@ledgerhq/hw-transport-node-ble` implementation.
 */
export class NodeBleTransport implements Transport {
  private readonly noble: NobleAdapter;
  private readonly args: TransportArgs;
  /** serviceUuid (normalized) -> device model + write/notify characteristic uuids */
  private readonly infosByService = new Map<string, BleServiceMatch>();
  private readonly scanServiceUuids: string[];
  /** discovered peripheral id -> peripheral + resolved model */
  private readonly discovered = new Map<
    string,
    { peripheral: NoblePeripheral; deviceModel: TransportDeviceModel; name?: string }
  >();
  private readonly availableDevices = new BehaviorSubject<TransportDiscoveredDevice[]>([]);
  private readonly connections = new Map<DeviceId, LiveConnection>();
  private scanning = false;
  private onDiscoverHandler: ((peripheral: NoblePeripheral) => void) | null = null;
  private onStateHandler: ((state: unknown) => void) | null = null;

  constructor(args: TransportArgs, noble: NobleAdapter) {
    this.args = args;
    this.noble = noble;
    const servicesInfos = args.deviceModelDataSource.getBluetoothServicesInfos();
    for (const infos of Object.values(servicesInfos)) {
      this.infosByService.set(normalizeUuid(infos.serviceUuid), {
        deviceModel: infos.deviceModel,
        writeUuid: normalizeUuid(infos.writeUuid),
        notifyUuid: normalizeUuid(infos.notifyUuid),
      });
    }
    this.scanServiceUuids = args.deviceModelDataSource.getBluetoothServices().map(normalizeUuid);
  }

  getIdentifier(): TransportIdentifier {
    return nodeBleIdentifier;
  }

  isSupported(): boolean {
    return true;
  }

  startDiscovering(): Observable<TransportDiscoveredDevice> {
    return new Observable(observer => {
      const onDiscover = (peripheral: NoblePeripheral): void => {
        const match = this.matchModelForPeripheral(peripheral);
        if (!match) {
          return;
        }
        const name = peripheral.advertisement.localName;
        this.discovered.set(peripheral.id, { peripheral, deviceModel: match.deviceModel, name });
        this.refreshAvailable();
        observer.next(this.toDiscoveredDevice(peripheral.id, match.deviceModel, name));
      };
      this.onDiscoverHandler = onDiscover;
      this.noble.on("discover", onDiscover as (...args: unknown[]) => void);
      const startScan = (): void => {
        try {
          this.noble.startScanning(this.scanServiceUuids, false);
          // Mark scanning only after the call succeeds, so a throw can't leave the
          // transport believing a scan is active.
          this.scanning = true;
        } catch (error) {
          this.scanning = false;
          observer.error(error);
        }
      };
      if (this.noble.state === "poweredOn") {
        startScan();
      } else {
        const onState = (state: unknown): void => {
          if (state === "poweredOn") {
            this.detachStateHandler();
            startScan();
          }
        };
        this.onStateHandler = onState;
        this.noble.on("stateChange", onState as (...args: unknown[]) => void);
      }
      return () => {
        this.stopScanning();
      };
    });
  }

  stopDiscovering(): void {
    this.stopScanning();
  }

  listenToAvailableDevices(): Observable<TransportDiscoveredDevice[]> {
    // BLE has no cheap snapshot scan (unlike USB enumeration): peripherals are
    // only visible while an active scan hears their advertisements. Listening
    // therefore drives a scan for the lifetime of the subscription, mirroring
    // how the node-webusb transport refreshes its device list on listen.
    return new Observable(observer => {
      const devicesSubscription = this.availableDevices.subscribe(observer);
      const discoverySubscription = this.startDiscovering().subscribe({
        error: error => observer.error(error),
      });
      return () => {
        discoverySubscription.unsubscribe();
        devicesSubscription.unsubscribe();
      };
    });
  }

  async connect(params: {
    deviceId: DeviceId;
    onDisconnect: (deviceId: DeviceId) => void;
  }): Promise<Either<ConnectError, TransportConnectedDeviceType>> {
    const entry = this.discovered.get(params.deviceId);
    if (!entry) {
      return Left(new UnknownDeviceError(`Unknown device ${params.deviceId}`));
    }
    const { peripheral, deviceModel } = entry;

    // Per-connection teardown state, reachable from both the peripheral
    // disconnect event and transport.disconnect() (via the connections map).
    let manuallyDisconnected = false;
    let notifyChar: NobleCharacteristic | undefined;
    let subscribed = false;
    let cleaned = false;
    const cleanup = (): void => {
      if (cleaned) {
        return;
      }
      cleaned = true;
      if (notifyChar) {
        try {
          notifyChar.removeAllListeners("data");
        } catch {
          // best-effort listener teardown
        }
        if (subscribed) {
          try {
            notifyChar.unsubscribe();
          } catch {
            // best-effort unsubscribe
          }
        }
      }
    };
    const disconnectPeripheral = async (): Promise<void> => {
      try {
        await promisify(cb => peripheral.disconnect(cb));
      } catch {
        // best-effort disconnect
      }
    };

    let connectedHere = false;
    try {
      if (peripheral.state !== "connected") {
        await promisify(cb => peripheral.connect(cb));
        connectedHere = true;
      }

      // Discover the Ledger GATT service + write/notify characteristics.
      const services = await new Promise<NobleService[]>((resolve, reject) =>
        peripheral.discoverServices(null, (error, s) => (error ? reject(error) : resolve(s))),
      );
      let infos: BleServiceMatch | undefined;
      let service: NobleService | undefined;
      for (const s of services) {
        const candidate = this.infosByService.get(normalizeUuid(s.uuid));
        if (candidate) {
          infos = candidate;
          service = s;
          break;
        }
      }
      if (!service || !infos) {
        throw new Error("Ledger BLE service not found on device");
      }
      const matchedInfos = infos;
      const characteristics = await new Promise<NobleCharacteristic[]>((resolve, reject) =>
        service.discoverCharacteristics(null, (error, chs) => (error ? reject(error) : resolve(chs))),
      );
      let writeChar: NobleCharacteristic | undefined;
      for (const characteristic of characteristics) {
        const uuid = normalizeUuid(characteristic.uuid);
        if (uuid === matchedInfos.writeUuid) {
          writeChar = characteristic;
        } else if (uuid === matchedInfos.notifyUuid) {
          notifyChar = characteristic;
        }
      }
      if (!writeChar || !notifyChar) {
        throw new Error("Ledger BLE characteristics not found");
      }
      const boundWriteChar = writeChar;
      const boundNotifyChar = notifyChar;

      const writeFrame = (buffer: Buffer): Promise<void> =>
        promisify(cb => boundWriteChar.write(buffer, false, cb));

      // Single 'data' listener; a mutable handler lets the MTU handshake and the
      // per-exchange APDU receiver take turns owning incoming notifications.
      let notificationHandler: (data: Buffer) => void = dropNotification;
      const routeNotification = (data: Buffer): void => {
        notificationHandler(data);
      };
      boundNotifyChar.on("data", routeNotification);
      await promisify(cb => boundNotifyChar.subscribe(cb));
      subscribed = true;

      // 0x08 GET-MTU handshake (mirrors hw-transport-node-ble's inferMTU).
      const mtu = await new Promise<number>((resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error("Timed out negotiating Ledger BLE MTU")),
          BLE_MTU_HANDSHAKE_TIMEOUT_MS,
        );
        notificationHandler = (data: Buffer): void => {
          if (data.length > 5 && data.readUInt8(0) === BLE_MTU_RESPONSE_HEADER_TAG) {
            clearTimeout(timer);
            resolve(data.readUInt8(5) + 3);
          }
        };
        writeFrame(Buffer.from(BLE_MTU_REQUEST_FRAME)).catch(error => {
          clearTimeout(timer);
          reject(error);
        });
      });
      const frameSize = mtu > 23 ? mtu - 3 : DEFAULT_BLE_FRAME_SIZE;

      // DMK owns framing. No channel for BLE; no padding. The sender is stateless
      // across exchanges (getFrames depends only on frameSize); the receiver
      // accumulates partial frames, so a fresh one is created per exchange — a
      // dropped/reordered BLE notification can't leave stale state that hangs the
      // next send.
      const apduSender: ApduSenderService = this.args.apduSenderServiceFactory({
        frameSize,
        channel: Maybe.zero(),
        padding: false,
      });

      let currentExchange: Exchange | null = null;
      const settleExchange = (exchange: Exchange, value: Either<DmkError, unknown>): void => {
        if (exchange.settled) {
          return;
        }
        exchange.settled = true;
        if (exchange.abortTimer) {
          clearTimeout(exchange.abortTimer);
          exchange.abortTimer = null;
        }
        if (currentExchange === exchange) {
          currentExchange = null;
        }
        exchange.resolve(value);
      };

      // After the handshake, route notifications to the in-flight exchange only.
      notificationHandler = (data: Buffer): void => {
        const exchange = currentExchange;
        if (!exchange || exchange.settled) {
          return; // stray notification between exchanges — ignore
        }
        exchange.receiver
          .handleFrame(new Uint8Array(data))
          .map(maybe => {
            maybe.map(response => settleExchange(exchange, Right(response)));
          })
          .mapLeft(error => settleExchange(exchange, Left(error)));
      };

      const sendApdu = async (
        apdu: Uint8Array,
        _triggersDisconnection?: boolean,
        abortTimeout?: number,
      ): Promise<Either<DmkError, unknown>> => {
        const exchange: Exchange = {
          receiver: this.args.apduReceiverServiceFactory({ channel: Maybe.zero() }),
          settled: false,
          abortTimer: null,
          resolve: () => {},
        };
        const responsePromise = new Promise<Either<DmkError, unknown>>(resolve => {
          exchange.resolve = resolve;
        });
        currentExchange = exchange;
        for (const frame of apduSender.getFrames(apdu)) {
          try {
            await writeFrame(Buffer.from(frame.getRawData()));
          } catch (error) {
            settleExchange(exchange, Left(new OpeningConnectionError(error)));
            return responsePromise;
          }
        }
        if (abortTimeout) {
          exchange.abortTimer = setTimeout(() => {
            settleExchange(exchange, Left(new OpeningConnectionError("Ledger BLE abort timeout")));
          }, abortTimeout);
        }
        return responsePromise;
      };

      peripheral.once("disconnect", () => {
        if (currentExchange) {
          settleExchange(currentExchange, Left(new OpeningConnectionError("Device disconnected")));
        }
        cleanup();
        this.connections.delete(params.deviceId);
        this.discovered.delete(params.deviceId);
        this.refreshAvailable();
        // A disconnect we initiated (transport.disconnect) must NOT re-enter
        // DMK's onDisconnect — DMK already tore the session down.
        if (!manuallyDisconnected) {
          params.onDisconnect(params.deviceId);
        }
      });

      this.connections.set(params.deviceId, {
        peripheral,
        markManual: () => {
          manuallyDisconnected = true;
        },
        cleanup,
      });

      return Right(
        new TransportConnectedDevice({
          id: params.deviceId,
          deviceModel,
          type: "BLE",
          transport: nodeBleIdentifier,
          sendApdu: sendApdu as TransportConnectedDeviceType["sendApdu"],
          name: entry.name,
        }),
      );
    } catch (error) {
      // Any failure after we opened/subscribed must release the BLE resources, or
      // a failed connect leaks a connected peripheral + active GATT subscription
      // that DMK will never clean up (it got a Left, so it never calls disconnect).
      cleanup();
      if (connectedHere) {
        await disconnectPeripheral();
      }
      return Left(new OpeningConnectionError(error));
    }
  }

  async disconnect(params: {
    connectedDevice: TransportConnectedDeviceType;
  }): Promise<Either<DmkError, void>> {
    const id = params.connectedDevice.id;
    const connection = this.connections.get(id);
    if (!connection) {
      return Right(undefined);
    }
    connection.markManual();
    connection.cleanup();
    try {
      await promisify(cb => connection.peripheral.disconnect(cb));
    } catch {
      // best-effort disconnect
    }
    this.connections.delete(id);
    this.discovered.delete(id);
    this.refreshAvailable();
    return Right(undefined);
  }

  /** Tear down scanning and any live connections (process-exit path). */
  async destroy(): Promise<void> {
    this.stopScanning();
    const open = [...this.connections.values()];
    this.connections.clear();
    for (const connection of open) {
      connection.markManual();
      connection.cleanup();
      try {
        await promisify(cb => connection.peripheral.disconnect(cb));
      } catch {
        // best-effort disconnect at teardown
      }
    }
  }

  private matchModelForPeripheral(
    peripheral: NoblePeripheral,
  ): { deviceModel: TransportDeviceModel } | null {
    const advertised = (peripheral.advertisement.serviceUuids ?? []).map(normalizeUuid);
    for (const uuid of advertised) {
      const infos = this.infosByService.get(uuid);
      if (infos) {
        return { deviceModel: infos.deviceModel };
      }
    }
    return null;
  }

  private toDiscoveredDevice(
    id: string,
    deviceModel: TransportDeviceModel,
    name?: string,
  ): TransportDiscoveredDevice {
    return { id, deviceModel, transport: nodeBleIdentifier, name, rssi: null };
  }

  private refreshAvailable(): void {
    this.availableDevices.next(
      [...this.discovered.entries()].map(([id, device]) =>
        this.toDiscoveredDevice(id, device.deviceModel, device.name),
      ),
    );
  }

  private detachStateHandler(): void {
    if (this.onStateHandler) {
      this.noble.removeListener("stateChange", this.onStateHandler as (...args: unknown[]) => void);
      this.onStateHandler = null;
    }
  }

  private stopScanning(): void {
    // Always detach the stateChange listener (it may be attached while waiting
    // for poweredOn, before scanning ever started) — it leaks on the shared
    // noble singleton otherwise.
    this.detachStateHandler();
    if (this.scanning) {
      this.scanning = false;
      try {
        this.noble.stopScanning();
      } catch {
        // best-effort scan stop
      }
    }
    if (this.onDiscoverHandler) {
      this.noble.removeListener("discover", this.onDiscoverHandler as (...args: unknown[]) => void);
      this.onDiscoverHandler = null;
    }
  }
}

/**
 * Build the BLE transport factory for `DeviceManagementKitBuilder.addTransport`.
 * noble is injected so callers (and tests) control when the native bindings
 * load — requiring `@abandonware/noble` initializes the platform Bluetooth
 * stack, which USB-only runs must never pay for.
 */
export function nodeBleTransportFactory(noble: NobleAdapter): TransportFactory {
  return args => new NodeBleTransport(args, noble);
}

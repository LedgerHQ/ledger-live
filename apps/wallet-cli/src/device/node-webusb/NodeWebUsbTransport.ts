import {
  DeviceConnectionStateMachine,
  DeviceDisconnectedBeforeSendingApdu,
  DeviceNotRecognizedError,
  LEDGER_VENDOR_ID,
  NoAccessibleDeviceError,
  OpeningConnectionError,
  TransportConnectedDevice,
  UnknownDeviceError,
  type ApduReceiverServiceFactory,
  type ApduSenderServiceFactory,
  type DeviceId,
  type DeviceModelDataSource,
  type DeviceConnectionStateMachineParams,
  type LoggerPublisherService,
  type Transport,
  type TransportDeviceModel,
  type TransportDiscoveredDevice,
  type TransportFactory,
  type TransportIdentifier,
} from "@ledgerhq/device-management-kit";
import { usb, type WebUSB } from "usb";
import { Left, Maybe, Right } from "purify-ts";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { BehaviorSubject, from, merge, Subject, throwError } from "rxjs";
import { map, mergeMap, switchMap } from "rxjs/operators";
import {
  NodeWebUsbApduSender,
  type NodeUsbDevice,
  type NodeWebUsbApduSenderConstructorArgs,
  type NodeWebUsbApduSenderDependencies,
} from "./NodeWebUsbApduSender";
import {
  RECONNECT_DEVICE_TIMEOUT_MS,
  WINDOWS_WEBUSB_DISCOVERY_POLL_INTERVAL_MS,
} from "./node-webusb-constants";

export const nodeWebUsbIdentifier: TransportIdentifier = "NODE-WEBUSB";

type WebUsbDiscoveredInternal = TransportDiscoveredDevice & {
  webUsbDevice: NodeUsbDevice;
  interfaceNumber: number;
};

function getVendorInterfaceNumber(device: USBDevice): number | null {
  const cfg = device.configurations[0];
  if (!cfg) {
    return null;
  }
  for (const iface of cfg.interfaces) {
    if (iface.alternates.some(a => a.interfaceClass === 255)) {
      return iface.interfaceNumber;
    }
  }
  return null;
}

type ScannedWebUsbDevice = { device: NodeUsbDevice; interfaceNumber: number };

type LedgerScan = { opened: ScannedWebUsbDevice[]; openFailures: unknown[] };

type NodeWebUsbBindings = Pick<WebUSB, "getDevices" | "addEventListener" | "removeEventListener">;

type NodeWebUsbIntervalHandle = ReturnType<typeof globalThis.setInterval>;

type NodeWebUsbTransportPlatform = {
  platform: NodeJS.Platform;
  usb: NodeWebUsbBindings;
  setInterval: (callback: () => void, delay: number) => NodeWebUsbIntervalHandle;
  clearInterval: (handle: NodeWebUsbIntervalHandle) => void;
  hasUsbBus?: () => boolean;
};

const defaultNodeWebUsbTransportPlatform: NodeWebUsbTransportPlatform = {
  platform: process.platform,
  usb,
  setInterval: globalThis.setInterval,
  clearInterval: globalThis.clearInterval,
  // usb 3 enumerates natively when a listener is added, and warns on stderr when it fails.
  hasUsbBus: () => process.platform !== "linux" || existsSync("/sys/bus/usb/devices"),
};

/** usb 3 builds a new object per enumeration: its nusb `handle` is what stays stable while plugged in. */
function nusbDeviceHandle(device: USBDevice): string | undefined {
  return "handle" in device && typeof device.handle === "string" ? device.handle : undefined;
}

const serialNumbersByDevice = new WeakMap<USBDevice, string>();

/** nusb may fetch the serial from the device (Windows), which throws once it is unplugged. */
function readSerialNumber(device: USBDevice): string | undefined {
  const cached = serialNumbersByDevice.get(device);
  if (cached) return cached;
  try {
    const serial = device.serialNumber ?? undefined;
    if (serial) serialNumbersByDevice.set(device, serial);
    return serial;
  } catch {
    return undefined;
  }
}

/** Uses serialNumber when available so two same-model devices are distinguishable. */
function deviceIdentityKey(device: NodeUsbDevice): string {
  const serial = readSerialNumber(device);
  return serial
    ? `${device.vendorId}:${device.productId}:${serial}`
    : `${device.vendorId}:${device.productId}`;
}

function dedupeLedgerWebUsbDevices(devices: ScannedWebUsbDevice[]): ScannedWebUsbDevice[] {
  return [...new Map(devices.map(d => [deviceIdentityKey(d.device), d])).values()];
}

function areSameDiscoveredDevices(
  previous: WebUsbDiscoveredInternal[],
  next: WebUsbDiscoveredInternal[],
): boolean {
  if (previous.length !== next.length) {
    return false;
  }

  return previous.every((device, index) => {
    const nextDevice = next[index];
    if (!nextDevice) {
      return false;
    }

    return (
      device.id === nextDevice.id &&
      device.interfaceNumber === nextDevice.interfaceNumber &&
      deviceIdentityKey(device.webUsbDevice) === deviceIdentityKey(nextDevice.webUsbDevice)
    );
  });
}

/**
 * DMK transport for Node.js using Ledger WebUSB bulk over {@link NodeUsbDevice} (node-usb).
 */
export class NodeWebUsbTransport implements Transport {
  private readonly _deviceModelDataSource: DeviceModelDataSource;
  private readonly _loggerServiceFactory: (tag: string) => LoggerPublisherService;
  private readonly _apduSenderFactory: ApduSenderServiceFactory;
  private readonly _apduReceiverFactory: ApduReceiverServiceFactory;
  private readonly _deviceConnectionStateMachineFactory: (
    args: DeviceConnectionStateMachineParams<NodeWebUsbApduSenderDependencies>,
  ) => DeviceConnectionStateMachine<NodeWebUsbApduSenderDependencies>;
  private readonly _deviceApduSenderFactory: (
    args: NodeWebUsbApduSenderConstructorArgs,
  ) => NodeWebUsbApduSender;
  private readonly _platformBindings: NodeWebUsbTransportPlatform;

  private readonly _transportDiscoveredDevices = new BehaviorSubject<WebUsbDiscoveredInternal[]>(
    [],
  );
  private readonly _deviceConnectionsByWebUsbDevice = new Map<
    NodeUsbDevice,
    DeviceConnectionStateMachine<NodeWebUsbApduSenderDependencies>
  >();
  private readonly _deviceConnectionSetupsByWebUsbDevice = new Map<
    NodeUsbDevice,
    Promise<DeviceConnectionStateMachine<NodeWebUsbApduSenderDependencies>>
  >();
  // Mirrors the values of _deviceConnectionsByWebUsbDevice so that membership
  // checks (e.g. isConnectionMachineRoutable) are O(1) instead of O(n).
  private readonly _activeConnectionMachines = new Set<
    DeviceConnectionStateMachine<NodeWebUsbApduSenderDependencies>
  >();
  private readonly _deviceConnectionsPendingReconnection = new Set<
    DeviceConnectionStateMachine<NodeWebUsbApduSenderDependencies>
  >();
  private readonly _sendApduQueues = new WeakMap<
    DeviceConnectionStateMachine<NodeWebUsbApduSenderDependencies>,
    Promise<unknown>
  >();
  private readonly _deviceApduSendersByConnectionMachine = new WeakMap<
    DeviceConnectionStateMachine<NodeWebUsbApduSenderDependencies>,
    NodeWebUsbApduSender
  >();

  private readonly _logger: LoggerPublisherService;
  private readonly connectionType = "USB" as const;
  private readonly identifier = nodeWebUsbIdentifier;
  private _usbConnectHandler: ((event: USBConnectionEvent) => void) | null = null;
  private _usbDisconnectHandler: ((event: USBConnectionEvent) => void) | null = null;
  private _discoveryPollInterval: NodeWebUsbIntervalHandle | null = null;
  private _explicitConnectionClosesInFlight = 0;
  // In-flight discovery refresh promise. While a scan is running, additional
  // callers (e.g. a Windows polling tick overlapping with startDiscovering()
  // or with the attach handler) get a queued follow-up scan instead of an
  // empty result — preventing promptDeviceAccess() from spuriously throwing
  // NoAccessibleDeviceError when a refresh is already in progress.
  private _refreshDiscoveredDevicesInFlight: Promise<ScannedWebUsbDevice[]> | null = null;
  private _refreshDiscoveredDevicesQueued: Promise<ScannedWebUsbDevice[]> | null = null;
  private readonly _ledgerOpenFailures = new Subject<NoAccessibleDeviceError>();

  constructor(
    deviceModelDataSource: DeviceModelDataSource,
    loggerServiceFactory: (tag: string) => LoggerPublisherService,
    apduSenderFactory: ApduSenderServiceFactory,
    apduReceiverFactory: ApduReceiverServiceFactory,
    deviceConnectionStateMachineFactory: (
      args: DeviceConnectionStateMachineParams<NodeWebUsbApduSenderDependencies>,
    ) => DeviceConnectionStateMachine<NodeWebUsbApduSenderDependencies> = a =>
      new DeviceConnectionStateMachine(a),
    deviceApduSenderFactory: (
      args: NodeWebUsbApduSenderConstructorArgs,
    ) => NodeWebUsbApduSender = a => new NodeWebUsbApduSender(a),
    platformBindings: NodeWebUsbTransportPlatform = defaultNodeWebUsbTransportPlatform,
  ) {
    this._deviceModelDataSource = deviceModelDataSource;
    this._loggerServiceFactory = loggerServiceFactory;
    this._apduSenderFactory = apduSenderFactory;
    this._apduReceiverFactory = apduReceiverFactory;
    this._deviceConnectionStateMachineFactory = deviceConnectionStateMachineFactory;
    this._deviceApduSenderFactory = deviceApduSenderFactory;
    this._platformBindings = platformBindings;
    this._logger = loggerServiceFactory("NodeWebUsbTransport");
    this.startListeningToConnectionEvents();
  }

  getIdentifier(): TransportIdentifier {
    return this.identifier;
  }

  isSupported(): boolean {
    return true;
  }

  private shouldUseWindowsDiscoveryPolling(): boolean {
    return this._platformBindings.platform === "win32";
  }

  private isConnectionMachineRoutable(
    machine: DeviceConnectionStateMachine<NodeWebUsbApduSenderDependencies>,
  ): boolean {
    return (
      this._deviceConnectionsPendingReconnection.has(machine) ||
      this._activeConnectionMachines.has(machine)
    );
  }

  private setActiveConnection(
    device: NodeUsbDevice,
    machine: DeviceConnectionStateMachine<NodeWebUsbApduSenderDependencies>,
  ): void {
    this._deviceConnectionsByWebUsbDevice.set(device, machine);
    this._activeConnectionMachines.add(machine);
  }

  private deleteActiveConnection(device: NodeUsbDevice): void {
    const machine = this._deviceConnectionsByWebUsbDevice.get(device);
    if (!machine) {
      return;
    }
    this._deviceConnectionsByWebUsbDevice.delete(device);
    // The same machine could (in transient states) sit under multiple keys; only
    // drop the routable flag once no key references it anymore.
    const stillReferenced = this._deviceConnectionsByWebUsbDevice
      .values()
      .some(other => other === machine);
    if (!stillReferenced) {
      this._activeConnectionMachines.delete(machine);
    }
  }

  private deleteActiveConnectionsForMachine(
    machine: DeviceConnectionStateMachine<NodeWebUsbApduSenderDependencies>,
  ): void {
    for (const [dev, sm] of this._deviceConnectionsByWebUsbDevice) {
      if (sm === machine) this.deleteActiveConnection(dev);
    }
    this._deviceConnectionsPendingReconnection.delete(machine);
    // Safety: drop activeMachines flag in case the device map had no entry for this machine.
    this._activeConnectionMachines.delete(machine);
    this._deviceApduSendersByConnectionMachine.delete(machine);
  }

  private async closeMachineConnection(
    machine: DeviceConnectionStateMachine<NodeWebUsbApduSenderDependencies>,
  ): Promise<void> {
    const apduSender = this._deviceApduSendersByConnectionMachine.get(machine);
    this._explicitConnectionClosesInFlight++;
    try {
      machine.closeConnection();
      await apduSender?.closeConnection();
    } finally {
      this.deleteActiveConnectionsForMachine(machine);
      this._explicitConnectionClosesInFlight--;
    }
  }

  private async refreshDiscoveredDevicesAfterExplicitClose(): Promise<void> {
    this._transportDiscoveredDevices.next([]);
    await this.updateTransportDiscoveredDevices();
  }

  private makeTransportConnectedDevice({
    row,
    machine,
  }: {
    row: WebUsbDiscoveredInternal;
    machine: DeviceConnectionStateMachine<NodeWebUsbApduSenderDependencies>;
  }): TransportConnectedDevice {
    const deviceId = row.id;

    const sendApduToMachine: TransportConnectedDevice["sendApdu"] = (...args) => {
      if (!this.isConnectionMachineRoutable(machine)) {
        return Promise.resolve(
          Left(
            new DeviceDisconnectedBeforeSendingApdu(`${deviceId} is no longer active or pending`),
          ),
        );
      }
      return machine.sendApdu(...args);
    };

    return new TransportConnectedDevice({
      id: deviceId,
      deviceModel: row.deviceModel,
      type: this.connectionType,
      sendApdu: async (...args) => {
        const previous = this._sendApduQueues.get(machine) ?? Promise.resolve();
        const queued = previous.catch(() => undefined).then(() => sendApduToMachine(...args));
        this._sendApduQueues.set(
          machine,
          queued.catch(() => undefined),
        );
        return queued;
      },
      transport: this.identifier,
    });
  }

  private startWindowsDiscoveryPolling(): void {
    if (!this.shouldUseWindowsDiscoveryPolling() || this._discoveryPollInterval !== null) {
      return;
    }

    this._discoveryPollInterval = this._platformBindings.setInterval(() => {
      void this.updateTransportDiscoveredDevices();
    }, WINDOWS_WEBUSB_DISCOVERY_POLL_INTERVAL_MS);
    this._discoveryPollInterval.unref?.();
  }

  private stopWindowsDiscoveryPolling(): void {
    if (this._discoveryPollInterval === null) {
      return;
    }

    this._platformBindings.clearInterval(this._discoveryPollInterval);
    this._discoveryPollInterval = null;
  }

  private resumeDiscoveryAfterDisconnect(): void {
    this.startWindowsDiscoveryPolling();
    void this.updateTransportDiscoveredDevices();
  }

  private getDeviceModel(device: NodeUsbDevice): Maybe<TransportDeviceModel> {
    const { productId } = device;
    const model = this._deviceModelDataSource
      .getAllDeviceModels()
      .find(m => m.usbProductId === productId >> 8 || m.bootloaderUsbProductId === productId);
    return model ? Maybe.of(model) : Maybe.zero();
  }

  private getUsbProductIdForMatch(device: NodeUsbDevice): number {
    return this.getDeviceModel(device).caseOf({
      Just: m => m.usbProductId,
      Nothing: () => device.productId >> 8,
    });
  }

  private findPendingReconnectionMachine(
    web: NodeUsbDevice,
  ): DeviceConnectionStateMachine<NodeWebUsbApduSenderDependencies> | undefined {
    return this._deviceConnectionsPendingReconnection.values().find(sm => {
      const previousDevice = sm.getDependencies().device;
      const previousSerial = readSerialNumber(previousDevice);
      const serial = readSerialNumber(web);
      if (previousSerial && serial) {
        return previousSerial === serial;
      }

      return this.getUsbProductIdForMatch(previousDevice) === this.getUsbProductIdForMatch(web);
    });
  }

  private async reconnectPendingMachines(scanned: ScannedWebUsbDevice[]): Promise<void> {
    for (const { device, interfaceNumber } of scanned) {
      const pending = this.findPendingReconnectionMachine(device);
      if (!pending) {
        continue;
      }

      await this.handleDeviceReconnection(pending, device, interfaceNumber);
    }
  }

  private async scanLedgerWebUsbDevices(): Promise<LedgerScan> {
    const collected: ScannedWebUsbDevice[] = [];
    const openFailures: unknown[] = [];
    for (const device of await this._platformBindings.usb.getDevices()) {
      if (device.vendorId !== LEDGER_VENDOR_ID) {
        continue;
      }
      let interfaceNumber: number | null;
      try {
        // Reading configurations opens the device in usb 3, so it fails without USB access.
        interfaceNumber = getVendorInterfaceNumber(device);
      } catch (error) {
        this._logger.error("Error while opening a Ledger WebUSB device", { data: { error } });
        openFailures.push(error);
        continue;
      }
      if (interfaceNumber === null) {
        continue;
      }
      collected.push({ device, interfaceNumber });
    }
    return { opened: dedupeLedgerWebUsbDevices(collected), openFailures };
  }

  /** Fails the device stream with the open error when it leaves no Ledger to offer. */
  private reportLedgerOpenFailure(error: unknown): void {
    if (this._transportDiscoveredDevices.getValue().length === 0) {
      this._ledgerOpenFailures.next(new NoAccessibleDeviceError(error));
    }
  }

  private mapWebUsbToDiscovered(
    web: NodeUsbDevice,
    interfaceNumber: number,
  ): WebUsbDiscoveredInternal {
    const key = deviceIdentityKey(web);
    const existing = this._transportDiscoveredDevices
      .getValue()
      .find(d => deviceIdentityKey(d.webUsbDevice) === key);
    const fromActive = this._deviceConnectionsByWebUsbDevice
      .entries()
      .find(([k]) => deviceIdentityKey(k) === key);
    const id: DeviceId = existing?.id ?? (fromActive ? fromActive[1].getDeviceId() : randomUUID());

    return this.getDeviceModel(web).caseOf({
      Just: deviceModel => {
        const row: WebUsbDiscoveredInternal = {
          id,
          deviceModel,
          webUsbDevice: web,
          interfaceNumber,
          transport: this.identifier,
        };
        this._logger.debug(`Discovered device ${id} ${deviceModel.productName} (WebUSB)`);
        return row;
      },
      Nothing: () => {
        this._logger.warn(
          `Device not recognized: WebUSB productId: 0x${web.productId.toString(16)}`,
        );
        throw new DeviceNotRecognizedError(
          `Device not recognized: WebUSB productId: 0x${web.productId.toString(16)}`,
        );
      },
    });
  }

  listenToAvailableDevices() {
    void this.updateTransportDiscoveredDevices();
    return merge(
      this._transportDiscoveredDevices.pipe(
        map(list => list.map(({ webUsbDevice: _w, interfaceNumber: _i, ...rest }) => rest)),
      ),
      this._ledgerOpenFailures.pipe(mergeMap(error => throwError(() => error))),
    );
  }

  async updateTransportDiscoveredDevices(): Promise<ScannedWebUsbDevice[]> {
    if (this._refreshDiscoveredDevicesInFlight) {
      // Coalesce concurrent callers onto a single fresh scan that starts
      // *after* the in-flight one completes, so they don't observe stale
      // results captured before their call.
      if (!this._refreshDiscoveredDevicesQueued) {
        const queued = this._refreshDiscoveredDevicesInFlight
          .catch(() => undefined)
          .then(() => {
            if (this._refreshDiscoveredDevicesQueued === queued) {
              this._refreshDiscoveredDevicesQueued = null;
            }
            return this.runDiscoveryRefresh();
          });
        this._refreshDiscoveredDevicesQueued = queued;
      }
      return this._refreshDiscoveredDevicesQueued;
    }

    return this.runDiscoveryRefresh();
  }

  private runDiscoveryRefresh(): Promise<ScannedWebUsbDevice[]> {
    const refresh = this.scanAndPublishDiscoveredDevices().finally(() => {
      if (this._refreshDiscoveredDevicesInFlight === refresh) {
        this._refreshDiscoveredDevicesInFlight = null;
      }
    });
    this._refreshDiscoveredDevicesInFlight = refresh;
    return refresh;
  }

  private async scanAndPublishDiscoveredDevices(): Promise<ScannedWebUsbDevice[]> {
    try {
      const { opened, openFailures } = await this.scanLedgerWebUsbDevices();
      await this.reconnectPendingMachines(opened);
      const found: WebUsbDiscoveredInternal[] = [];
      for (const { device, interfaceNumber } of opened) {
        try {
          found.push(this.mapWebUsbToDiscovered(device, interfaceNumber));
        } catch (e) {
          if (e instanceof DeviceNotRecognizedError) {
            continue;
          }
          throw e;
        }
      }

      if (found.length > 0) {
        this.stopWindowsDiscoveryPolling();
      } else {
        this.startWindowsDiscoveryPolling();
      }

      const previous = this._transportDiscoveredDevices.getValue();
      // A failed open does not say which listed Ledger it was, so all of them stay listed.
      const next =
        openFailures.length === 0
          ? found
          : [...found, ...previous.filter(row => !found.some(f => f.id === row.id))];
      if (!areSameDiscoveredDevices(previous, next)) {
        this._transportDiscoveredDevices.next(next);
      }
      if (openFailures.length > 0) {
        this.reportLedgerOpenFailure(openFailures[0]);
      }

      return opened;
    } catch (e) {
      this._logger.error("Error while scanning Ledger WebUSB devices", { data: { error: e } });
      return [];
    }
  }

  private async promptDeviceAccess(): Promise<ScannedWebUsbDevice[]> {
    const scanned = await this.updateTransportDiscoveredDevices();
    if (scanned.length === 0) {
      this._logger.warn("No Ledger WebUSB device found");
      throw new NoAccessibleDeviceError("No Ledger WebUSB device found");
    }
    for (const { device } of scanned) {
      this._logger.debug("promptDeviceAccess: WebUSB device", {
        data: { vendorId: device.vendorId, productId: device.productId },
      });
    }
    return scanned;
  }

  startDiscovering() {
    this._logger.debug("startDiscovering (WebUSB)");
    return from(this.promptDeviceAccess()).pipe(
      switchMap(scanned =>
        from(
          scanned.map(({ device, interfaceNumber }) =>
            this.mapWebUsbToDiscovered(device, interfaceNumber),
          ),
        ),
      ),
    );
  }

  /**
   * No-op: startDiscovering performs a one-shot USB scan that completes
   * on its own, so there is no ongoing discovery to cancel.
   */
  stopDiscovering(): void {
    this._logger.debug("stopDiscovering (WebUSB)");
  }

  private startListeningToConnectionEvents(): void {
    if (this._usbConnectHandler || this._usbDisconnectHandler) {
      return;
    }
    if (this._platformBindings.hasUsbBus?.() === false) {
      this._logger.debug("No USB bus, skipping hotplug listeners");
      return;
    }
    this._logger.debug("startListeningToConnectionEvents (WebUSB)");
    this._usbConnectHandler = event => {
      void this.handleDeviceConnection(event.device);
    };
    this._usbDisconnectHandler = event => {
      this.handleDeviceDisconnection(event.device);
    };
    this._platformBindings.usb.addEventListener("connect", this._usbConnectHandler);
    this._platformBindings.usb.addEventListener("disconnect", this._usbDisconnectHandler);
    this.startWindowsDiscoveryPolling();
  }

  private stopListeningToConnectionEvents(): void {
    this._logger.debug("stopListeningToConnectionEvents (WebUSB)");
    if (this._usbConnectHandler) {
      this._platformBindings.usb.removeEventListener("connect", this._usbConnectHandler);
      this._usbConnectHandler = null;
    }
    if (this._usbDisconnectHandler) {
      this._platformBindings.usb.removeEventListener("disconnect", this._usbDisconnectHandler);
      this._usbDisconnectHandler = null;
    }
    this.stopWindowsDiscoveryPolling();
  }

  async connect({
    deviceId,
    onDisconnect,
  }: {
    deviceId: DeviceId;
    onDisconnect: (deviceId: DeviceId) => void;
  }) {
    this._logger.debug("connect", { data: { deviceId } });
    const row = this._transportDiscoveredDevices.getValue().find(d => d.id === deviceId);
    if (!row) {
      this._logger.error(`Unknown device ${deviceId}`);
      return Left(new UnknownDeviceError(`Unknown device ${deviceId}`));
    }

    const existing = this._deviceConnectionsByWebUsbDevice.get(row.webUsbDevice);
    if (existing) {
      return Right(this.makeTransportConnectedDevice({ row, machine: existing }));
    }

    const pendingSetup = this._deviceConnectionSetupsByWebUsbDevice.get(row.webUsbDevice);
    if (pendingSetup) {
      try {
        const machine = await pendingSetup;
        return Right(this.makeTransportConnectedDevice({ row, machine }));
      } catch (e) {
        return Left(new OpeningConnectionError(e));
      }
    }

    const apduSender = this._deviceApduSenderFactory({
      dependencies: { device: row.webUsbDevice, interfaceNumber: row.interfaceNumber },
      apduSenderFactory: this._apduSenderFactory,
      apduReceiverFactory: this._apduReceiverFactory,
      loggerFactory: this._loggerServiceFactory,
    });

    const machine = this._deviceConnectionStateMachineFactory({
      deviceId,
      deviceApduSender: apduSender,
      timeoutDuration: RECONNECT_DEVICE_TIMEOUT_MS,
      tryToReconnect: () => {
        this._deviceConnectionsByWebUsbDevice.forEach((sm, dev) => {
          if (sm.getDeviceId() === deviceId) {
            this._deviceConnectionsPendingReconnection.add(sm);
            this.deleteActiveConnection(dev);
          }
        });
        this.resumeDiscoveryAfterDisconnect();
      },
      onTerminated: () => {
        // _deviceApduSendersByConnectionMachine is a WeakMap keyed by `machine`, so its entries
        // are reclaimed automatically once the machine becomes unreachable below.
        this._deviceConnectionsPendingReconnection.forEach(sm => {
          if (sm.getDeviceId() === deviceId) {
            this._deviceConnectionsPendingReconnection.delete(sm);
            onDisconnect(sm.getDeviceId());
          }
        });
        this._deviceConnectionsByWebUsbDevice.forEach((sm, dev) => {
          if (sm.getDeviceId() === deviceId) {
            this.deleteActiveConnection(dev);
            onDisconnect(sm.getDeviceId());
          }
        });
        this.resumeDiscoveryAfterDisconnect();
      },
    });
    this._deviceApduSendersByConnectionMachine.set(machine, apduSender);

    const setupConnection = (async () => {
      await machine.setupConnection();
      this.setActiveConnection(row.webUsbDevice, machine);
      return machine;
    })();
    this._deviceConnectionSetupsByWebUsbDevice.set(row.webUsbDevice, setupConnection);

    try {
      await setupConnection;
    } catch (e) {
      this._deviceApduSendersByConnectionMachine.delete(machine);
      this._logger.error("Error while setting up device connection", { data: { error: e } });
      return Left(new OpeningConnectionError(e));
    } finally {
      if (this._deviceConnectionSetupsByWebUsbDevice.get(row.webUsbDevice) === setupConnection) {
        this._deviceConnectionSetupsByWebUsbDevice.delete(row.webUsbDevice);
      }
    }

    return Right(this.makeTransportConnectedDevice({ row, machine }));
  }

  async disconnect(params: { connectedDevice: TransportConnectedDevice }) {
    this._logger.debug("disconnect", { data: { connectedDevice: params.connectedDevice } });
    const sm = this._deviceConnectionsByWebUsbDevice
      .values()
      .find(s => s.getDeviceId() === params.connectedDevice.id);
    if (!sm) {
      this._logger.error("No matching device connection found", {
        data: { connectedDevice: params.connectedDevice },
      });
      return Left(new UnknownDeviceError(`Unknown device ${params.connectedDevice.id}`));
    }
    this.stopListeningToConnectionEvents();
    try {
      await this.closeMachineConnection(sm);
      await this.refreshDiscoveredDevicesAfterExplicitClose();
    } finally {
      this.startListeningToConnectionEvents();
    }
    return Right(undefined);
  }

  handleDeviceDisconnection(device: USBDevice): void {
    const { vendorId, productId } = device;
    if (vendorId !== LEDGER_VENDOR_ID) {
      return;
    }
    if (this._explicitConnectionClosesInFlight > 0) {
      this._logger.debug("[handleDeviceDisconnection] Ignoring detach during explicit close", {
        data: { vendorId, productId },
      });
      return;
    }
    this._logger.info("[handleDeviceDisconnection] Device disconnected (WebUSB)", {
      data: { vendorId, productId },
    });
    this.resumeDiscoveryAfterDisconnect();

    const handle = nusbDeviceHandle(device);
    const entries = [...this._deviceConnectionsByWebUsbDevice.entries()];
    const match =
      handle === undefined
        ? entries.find(([dev]) => dev.vendorId === vendorId && dev.productId === productId)
        : entries.find(([dev]) => nusbDeviceHandle(dev) === handle);

    if (match) {
      try {
        match[1].eventDeviceDisconnected();
      } catch (e) {
        this._logger.error("Error while handling device disconnection", { data: { error: e } });
      }
    } else {
      this._logger.debug("No matching WebUSB connection for detach event", {
        data: { vendorId, productId },
      });
    }
  }

  async handleDeviceReconnection(
    machine: DeviceConnectionStateMachine<NodeWebUsbApduSenderDependencies>,
    web: NodeUsbDevice,
    interfaceNumber: number,
  ): Promise<void> {
    const previousDependencies = machine.getDependencies();
    try {
      this._deviceConnectionsPendingReconnection.delete(machine);
      machine.setDependencies({ device: web, interfaceNumber });
      await machine.setupConnection();
      this.setActiveConnection(web, machine);
      machine.eventDeviceConnected();
    } catch (e) {
      this._logger.error("Error while reconnecting to device", { data: { error: e } });
      // If we failed after publishing to the active maps (e.g. eventDeviceConnected
      // threw), undo the publish so the machine isn't both "active" and "pending"
      // and APDUs aren't routed to a machine whose dependencies were reverted.
      // deleteActiveConnection is a no-op if the entry was never inserted.
      this.deleteActiveConnection(web);
      machine.setDependencies(previousDependencies);
      this._deviceConnectionsPendingReconnection.add(machine);
    }
  }

  async handleDeviceConnection(device: USBDevice): Promise<void> {
    const { vendorId, productId } = device;
    if (vendorId !== LEDGER_VENDOR_ID) {
      return;
    }
    if (this._explicitConnectionClosesInFlight > 0) {
      this._logger.debug("[handleDeviceConnection] Ignoring attach during explicit close", {
        data: { vendorId, productId },
      });
      return;
    }
    this._logger.info("[handleDeviceConnection] New device connected (WebUSB)", {
      data: { vendorId, productId },
    });

    try {
      if (getVendorInterfaceNumber(device) === null) {
        this._logger.debug("[handleDeviceConnection] No Ledger WebUSB interface", {
          data: { vendorId, productId },
        });
        return;
      }

      // Reconnection of any pending machines happens inside the rescan via
      // reconnectPendingMachines(), so the rescan is the single source of truth.
      await this.updateTransportDiscoveredDevices();
    } catch (e) {
      this._logger.error("Error while handling WebUSB connection event", { data: { error: e } });
      this.reportLedgerOpenFailure(e);
    }
  }

  async destroy(): Promise<void> {
    this.stopListeningToConnectionEvents();
    await Promise.all(
      [...this._deviceConnectionsByWebUsbDevice.values()].map(sm =>
        this.closeMachineConnection(sm),
      ),
    );
    this._deviceConnectionsPendingReconnection.clear();
    this._activeConnectionMachines.clear();
  }
}

export const nodeWebUsbTransportFactory: TransportFactory = ({
  deviceModelDataSource,
  loggerServiceFactory,
  apduSenderServiceFactory,
  apduReceiverServiceFactory,
}) =>
  new NodeWebUsbTransport(
    deviceModelDataSource,
    loggerServiceFactory,
    apduSenderServiceFactory,
    apduReceiverServiceFactory,
  );

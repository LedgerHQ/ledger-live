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
import {
  getDeviceList,
  usb as usbBindings,
  WebUSBDevice,
  type Device as NativeUsbDevice,
} from "usb";
import { Left, Maybe, Right } from "purify-ts";
import { randomUUID } from "node:crypto";
import { BehaviorSubject, from } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import {
  NodeWebUsbApduSender,
  type NodeWebUsbApduSenderConstructorArgs,
  type NodeWebUsbApduSenderDependencies,
} from "./NodeWebUsbApduSender";
import {
  RECONNECT_DEVICE_TIMEOUT_MS,
  WINDOWS_WEBUSB_DISCOVERY_POLL_INTERVAL_MS,
} from "./node-webusb-constants";

export const nodeWebUsbIdentifier: TransportIdentifier = "NODE-WEBUSB";

type WebUsbDiscoveredInternal = TransportDiscoveredDevice & {
  webUsbDevice: WebUSBDevice;
  interfaceNumber: number;
};

function getVendorInterfaceNumber(device: WebUSBDevice): number | null {
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

type ScannedWebUsbDevice = { device: WebUSBDevice; interfaceNumber: number };

type NodeWebUsbBindings = Pick<typeof usbBindings, "on" | "removeListener" | "unrefHotplugEvents">;

type NodeWebUsbIntervalHandle = ReturnType<typeof globalThis.setInterval>;

type NodeWebUsbTransportPlatform = {
  platform: NodeJS.Platform;
  getDeviceList: typeof getDeviceList;
  createWebUsbDevice: typeof WebUSBDevice.createInstance;
  usbBindings: NodeWebUsbBindings;
  setInterval: (callback: () => void, delay: number) => NodeWebUsbIntervalHandle;
  clearInterval: (handle: NodeWebUsbIntervalHandle) => void;
};

const defaultNodeWebUsbTransportPlatform: NodeWebUsbTransportPlatform = {
  platform: process.platform,
  getDeviceList,
  createWebUsbDevice: native => WebUSBDevice.createInstance(native),
  usbBindings,
  setInterval: globalThis.setInterval,
  clearInterval: globalThis.clearInterval,
};

/** Uses serialNumber when available so two same-model devices are distinguishable. */
function deviceIdentityKey(device: WebUSBDevice): string {
  const serial = device.serialNumber;
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
 * DMK transport for Node.js using Ledger WebUSB bulk over {@link WebUSBDevice} (node-usb).
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
    WebUSBDevice,
    DeviceConnectionStateMachine<NodeWebUsbApduSenderDependencies>
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
  private _usbAttachHandler: ((d: NativeUsbDevice) => void) | null = null;
  private _usbDetachHandler: ((d: NativeUsbDevice) => void) | null = null;
  private _discoveryPollInterval: NodeWebUsbIntervalHandle | null = null;
  private _explicitConnectionClosesInFlight = 0;
  // In-flight discovery refresh promise. While a scan is running, additional
  // callers (e.g. a Windows polling tick overlapping with startDiscovering()
  // or with the attach handler) get a queued follow-up scan instead of an
  // empty result — preventing promptDeviceAccess() from spuriously throwing
  // NoAccessibleDeviceError when a refresh is already in progress.
  private _refreshDiscoveredDevicesInFlight: Promise<ScannedWebUsbDevice[]> | null = null;
  private _refreshDiscoveredDevicesQueued: Promise<ScannedWebUsbDevice[]> | null = null;

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
    device: WebUSBDevice,
    machine: DeviceConnectionStateMachine<NodeWebUsbApduSenderDependencies>,
  ): void {
    this._deviceConnectionsByWebUsbDevice.set(device, machine);
    this._activeConnectionMachines.add(machine);
  }

  private deleteActiveConnection(device: WebUSBDevice): void {
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

    const sendApduToMachine: TransportConnectedDevice["sendApdu"] = async (...args) => {
      if (!this.isConnectionMachineRoutable(machine)) {
        return Left(
          new DeviceDisconnectedBeforeSendingApdu(`${deviceId} is no longer active or pending`),
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

  private getDeviceModel(device: WebUSBDevice): Maybe<TransportDeviceModel> {
    const { productId } = device;
    const model = this._deviceModelDataSource
      .getAllDeviceModels()
      .find(m => m.usbProductId === productId >> 8 || m.bootloaderUsbProductId === productId);
    return model ? Maybe.of(model) : Maybe.zero();
  }

  private getUsbProductIdForMatch(device: WebUSBDevice): number {
    return this.getDeviceModel(device).caseOf({
      Just: m => m.usbProductId,
      Nothing: () => device.productId >> 8,
    });
  }

  private findPendingReconnectionMachine(
    web: WebUSBDevice,
  ): DeviceConnectionStateMachine<NodeWebUsbApduSenderDependencies> | undefined {
    return this._deviceConnectionsPendingReconnection.values().find(sm => {
      const previousDevice = sm.getDependencies().device;
      if (previousDevice.serialNumber && web.serialNumber) {
        return previousDevice.serialNumber === web.serialNumber;
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

  private async scanLedgerWebUsbDevices(): Promise<ScannedWebUsbDevice[]> {
    const collected: ScannedWebUsbDevice[] = [];
    for (const native of this._platformBindings.getDeviceList()) {
      if (native.deviceDescriptor.idVendor !== LEDGER_VENDOR_ID) {
        continue;
      }
      const device = await this._platformBindings.createWebUsbDevice(native);
      const interfaceNumber = getVendorInterfaceNumber(device);
      if (interfaceNumber === null) {
        continue;
      }
      collected.push({ device, interfaceNumber });
    }
    return dedupeLedgerWebUsbDevices(collected);
  }

  private mapWebUsbToDiscovered(
    web: WebUSBDevice,
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
    return this._transportDiscoveredDevices.pipe(
      map(list => list.map(({ webUsbDevice: _w, interfaceNumber: _i, ...rest }) => rest)),
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
      const scanned = await this.scanLedgerWebUsbDevices();
      await this.reconnectPendingMachines(scanned);
      const next: WebUsbDiscoveredInternal[] = [];
      for (const { device, interfaceNumber } of scanned) {
        try {
          next.push(this.mapWebUsbToDiscovered(device, interfaceNumber));
        } catch (e) {
          if (e instanceof DeviceNotRecognizedError) {
            continue;
          }
          throw e;
        }
      }

      if (next.length > 0) {
        this.stopWindowsDiscoveryPolling();
      } else {
        this.startWindowsDiscoveryPolling();
      }

      if (!areSameDiscoveredDevices(this._transportDiscoveredDevices.getValue(), next)) {
        this._transportDiscoveredDevices.next(next);
      }

      return scanned;
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
    if (this._usbAttachHandler || this._usbDetachHandler) {
      return;
    }
    this._logger.debug("startListeningToConnectionEvents (WebUSB)");
    this._usbAttachHandler = (d: NativeUsbDevice) => {
      void this.handleDeviceConnection(d);
    };
    this._usbDetachHandler = (d: NativeUsbDevice) => {
      void this.handleDeviceDisconnection(d);
    };
    this._platformBindings.usbBindings.on("attach", this._usbAttachHandler);
    this._platformBindings.usbBindings.on("detach", this._usbDetachHandler);
    this.startWindowsDiscoveryPolling();
  }

  private stopListeningToConnectionEvents(): void {
    this._logger.debug("stopListeningToConnectionEvents (WebUSB)");
    if (this._usbAttachHandler) {
      this._platformBindings.usbBindings.removeListener("attach", this._usbAttachHandler);
      this._usbAttachHandler = null;
    }
    if (this._usbDetachHandler) {
      this._platformBindings.usbBindings.removeListener("detach", this._usbDetachHandler);
      this._usbDetachHandler = null;
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

    try {
      await machine.setupConnection();
    } catch (e) {
      this._deviceApduSendersByConnectionMachine.delete(machine);
      this._logger.error("Error while setting up device connection", { data: { error: e } });
      return Left(new OpeningConnectionError(e));
    }

    this.setActiveConnection(row.webUsbDevice, machine);

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

  async handleDeviceDisconnection(native: NativeUsbDevice): Promise<void> {
    const { idVendor, idProduct } = native.deviceDescriptor;
    if (idVendor !== LEDGER_VENDOR_ID) {
      return;
    }
    if (this._explicitConnectionClosesInFlight > 0) {
      this._logger.debug("[handleDeviceDisconnection] Ignoring detach during explicit close", {
        data: { vendorId: idVendor, productId: idProduct },
      });
      return;
    }
    this._logger.info("[handleDeviceDisconnection] Device disconnected (WebUSB)", {
      data: { vendorId: idVendor, productId: idProduct },
    });
    this.resumeDiscoveryAfterDisconnect();

    // Native detach events only expose vendorId/productId — serialNumber is
    // unavailable for a disconnecting device, so same-model disambiguation
    // is not possible here.
    const match = this._deviceConnectionsByWebUsbDevice
      .entries()
      .find(([dev]) => dev.vendorId === idVendor && dev.productId === idProduct);

    if (match) {
      try {
        match[1].eventDeviceDisconnected();
      } catch (e) {
        this._logger.error("Error while handling device disconnection", { data: { error: e } });
      }
    } else {
      this._logger.debug("No matching WebUSB connection for detach event", {
        data: { vendorId: idVendor, productId: idProduct },
      });
    }
  }

  async handleDeviceReconnection(
    machine: DeviceConnectionStateMachine<NodeWebUsbApduSenderDependencies>,
    web: WebUSBDevice,
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

  async handleDeviceConnection(native: NativeUsbDevice): Promise<void> {
    const { idVendor, idProduct } = native.deviceDescriptor;
    if (idVendor !== LEDGER_VENDOR_ID) {
      return;
    }
    if (this._explicitConnectionClosesInFlight > 0) {
      this._logger.debug("[handleDeviceConnection] Ignoring attach during explicit close", {
        data: { vendorId: idVendor, productId: idProduct },
      });
      return;
    }
    this._logger.info("[handleDeviceConnection] New device connected (WebUSB)", {
      data: { vendorId: idVendor, productId: idProduct },
    });

    try {
      const web = await this._platformBindings.createWebUsbDevice(native);
      if (getVendorInterfaceNumber(web) === null) {
        this._logger.debug("[handleDeviceConnection] No Ledger WebUSB interface", {
          data: { vendorId: idVendor, productId: idProduct },
        });
        return;
      }

      // Reconnection of any pending machines happens inside the rescan via
      // reconnectPendingMachines(), so the rescan is the single source of truth.
      await this.updateTransportDiscoveredDevices();
    } catch (e) {
      this._logger.error("Error while handling WebUSB connection event", { data: { error: e } });
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
    // Unref last, after in-flight close transfers have settled, so we don't
    // release hotplug refs while native USB ops are still running.
    this._platformBindings.usbBindings.unrefHotplugEvents();
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

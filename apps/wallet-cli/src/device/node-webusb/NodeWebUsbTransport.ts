import {
  DeviceConnectionStateMachine,
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
import { RECONNECT_DEVICE_TIMEOUT_MS } from "./node-webusb-constants";

export const nodeWebUsbIdentifier: TransportIdentifier = "NODE-WEBUSB";

type WebUsbDiscoveredInternal = TransportDiscoveredDevice & {
  webUsbDevice: USBDevice;
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

type ScannedWebUsbDevice = { device: USBDevice; interfaceNumber: number };

/** Uses serialNumber when available so two same-model devices are distinguishable. */
function deviceIdentityKey(device: USBDevice): string {
  const serial = device.serialNumber;
  return serial
    ? `${device.vendorId}:${device.productId}:${serial}`
    : `${device.vendorId}:${device.productId}`;
}

function dedupeLedgerWebUsbDevices(devices: ScannedWebUsbDevice[]): ScannedWebUsbDevice[] {
  return [...new Map(devices.map(d => [deviceIdentityKey(d.device), d])).values()];
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

  private readonly _transportDiscoveredDevices = new BehaviorSubject<WebUsbDiscoveredInternal[]>(
    [],
  );
  private readonly _deviceConnectionsByWebUsbDevice = new Map<
    USBDevice,
    DeviceConnectionStateMachine<NodeWebUsbApduSenderDependencies>
  >();
  private readonly _deviceConnectionsPendingReconnection = new Set<
    DeviceConnectionStateMachine<NodeWebUsbApduSenderDependencies>
  >();

  private readonly _logger: LoggerPublisherService;
  private readonly connectionType = "USB" as const;
  private readonly identifier = nodeWebUsbIdentifier;
  private _usbAttachHandler: ((d: NativeUsbDevice) => void) | null = null;
  private _usbDetachHandler: ((d: NativeUsbDevice) => void) | null = null;

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
  ) {
    this._deviceModelDataSource = deviceModelDataSource;
    this._loggerServiceFactory = loggerServiceFactory;
    this._apduSenderFactory = apduSenderFactory;
    this._apduReceiverFactory = apduReceiverFactory;
    this._deviceConnectionStateMachineFactory = deviceConnectionStateMachineFactory;
    this._deviceApduSenderFactory = deviceApduSenderFactory;
    this._logger = loggerServiceFactory("NodeWebUsbTransport");
    this.startListeningToConnectionEvents();
  }

  getIdentifier(): TransportIdentifier {
    return this.identifier;
  }

  isSupported(): boolean {
    return true;
  }

  private getDeviceModel(device: USBDevice): Maybe<TransportDeviceModel> {
    const { productId } = device;
    const model = this._deviceModelDataSource
      .getAllDeviceModels()
      .find(m => m.usbProductId === productId >> 8 || m.bootloaderUsbProductId === productId);
    return model ? Maybe.of(model) : Maybe.zero();
  }

  private getUsbProductIdForMatch(device: USBDevice): number {
    return this.getDeviceModel(device).caseOf({
      Just: m => m.usbProductId,
      Nothing: () => device.productId >> 8,
    });
  }

  private async scanLedgerWebUsbDevices(): Promise<ScannedWebUsbDevice[]> {
    const collected: ScannedWebUsbDevice[] = [];
    for (const native of getDeviceList()) {
      if (native.deviceDescriptor.idVendor !== LEDGER_VENDOR_ID) {
        continue;
      }
      const device = await WebUSBDevice.createInstance(native);
      const interfaceNumber = getVendorInterfaceNumber(device);
      if (interfaceNumber === null) {
        continue;
      }
      collected.push({ device, interfaceNumber });
    }
    return dedupeLedgerWebUsbDevices(collected);
  }

  private mapWebUsbToDiscovered(web: USBDevice, interfaceNumber: number): WebUsbDiscoveredInternal {
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
    try {
      const scanned = await this.scanLedgerWebUsbDevices();
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
      this._transportDiscoveredDevices.next(next);
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

  stopDiscovering(): void {}

  private startListeningToConnectionEvents(): void {
    this._logger.debug("startListeningToConnectionEvents (WebUSB)");
    this._usbAttachHandler = (d: NativeUsbDevice) => {
      void this.handleDeviceConnection(d);
    };
    this._usbDetachHandler = (d: NativeUsbDevice) => {
      void this.handleDeviceDisconnection(d);
    };
    usbBindings.on("attach", this._usbAttachHandler);
    usbBindings.on("detach", this._usbDetachHandler);
    process.on("exit", () => {
      this.stopListeningToConnectionEvents();
      usbBindings.unrefHotplugEvents();
    });
  }

  private stopListeningToConnectionEvents(): void {
    this._logger.debug("stopListeningToConnectionEvents (WebUSB)");
    if (this._usbAttachHandler) {
      usbBindings.removeListener("attach", this._usbAttachHandler);
      this._usbAttachHandler = null;
    }
    if (this._usbDetachHandler) {
      usbBindings.removeListener("detach", this._usbDetachHandler);
      this._usbDetachHandler = null;
    }
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
      return Right(
        new TransportConnectedDevice({
          id: deviceId,
          deviceModel: row.deviceModel,
          type: this.connectionType,
          sendApdu: (...args) => existing.sendApdu(...args),
          transport: this.identifier,
        }),
      );
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
      tryToReconnect: (_timeoutDuration: number) => {
        this._deviceConnectionsByWebUsbDevice.forEach((sm, dev) => {
          if (sm.getDeviceId() === deviceId) {
            this._deviceConnectionsPendingReconnection.add(sm);
            this._deviceConnectionsByWebUsbDevice.delete(dev);
          }
        });
      },
      onTerminated: () => {
        this._deviceConnectionsPendingReconnection.forEach(sm => {
          if (sm.getDeviceId() === deviceId) {
            this._deviceConnectionsPendingReconnection.delete(sm);
            onDisconnect(sm.getDeviceId());
          }
        });
        this._deviceConnectionsByWebUsbDevice.forEach((sm, dev) => {
          if (sm.getDeviceId() === deviceId) {
            this._deviceConnectionsByWebUsbDevice.delete(dev);
            onDisconnect(sm.getDeviceId());
          }
        });
      },
    });

    try {
      await machine.setupConnection();
    } catch (e) {
      this._logger.error("Error while setting up device connection", { data: { error: e } });
      return Left(new OpeningConnectionError(e));
    }

    this._deviceConnectionsByWebUsbDevice.set(row.webUsbDevice, machine);

    return Right(
      new TransportConnectedDevice({
        sendApdu: machine.sendApdu.bind(machine),
        deviceModel: row.deviceModel,
        id: deviceId,
        type: this.connectionType,
        transport: this.identifier,
      }),
    );
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
      return Promise.resolve(
        Left(new UnknownDeviceError(`Unknown device ${params.connectedDevice.id}`)),
      );
    }
    void sm.closeConnection();
    return Promise.resolve(Right(undefined));
  }

  async handleDeviceDisconnection(native: NativeUsbDevice): Promise<void> {
    const { idVendor, idProduct } = native.deviceDescriptor;
    if (idVendor !== LEDGER_VENDOR_ID) {
      return;
    }
    this._logger.info("[handleDeviceDisconnection] Device disconnected (WebUSB)", {
      data: { vendorId: idVendor, productId: idProduct },
    });
    void this.updateTransportDiscoveredDevices();

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
    web: USBDevice,
    interfaceNumber: number,
  ): Promise<void> {
    try {
      this._deviceConnectionsPendingReconnection.delete(machine);
      machine.setDependencies({ device: web, interfaceNumber });
      await machine.setupConnection();
      this._deviceConnectionsByWebUsbDevice.set(web, machine);
      machine.eventDeviceConnected();
    } catch (e) {
      this._logger.error("Error while reconnecting to device", { data: { error: e } });
      void machine.closeConnection();
    }
  }

  async handleDeviceConnection(native: NativeUsbDevice): Promise<void> {
    const { idVendor, idProduct } = native.deviceDescriptor;
    if (idVendor !== LEDGER_VENDOR_ID) {
      return;
    }
    this._logger.info("[handleDeviceConnection] New device connected (WebUSB)", {
      data: { vendorId: idVendor, productId: idProduct },
    });

    try {
      const web = await WebUSBDevice.createInstance(native);
      const iface = getVendorInterfaceNumber(web);
      if (iface === null) {
        this._logger.debug("[handleDeviceConnection] No Ledger WebUSB interface", {
          data: { vendorId: idVendor, productId: idProduct },
        });
        return;
      }

      const pending = this._deviceConnectionsPendingReconnection.values().find(sm => {
        const prev = sm.getDependencies().device;
        if (prev.serialNumber && web.serialNumber) {
          return prev.serialNumber === web.serialNumber;
        }
        return this.getUsbProductIdForMatch(prev) === this.getUsbProductIdForMatch(web);
      });

      if (pending) {
        await this.handleDeviceReconnection(pending, web, iface);
      }
      await this.updateTransportDiscoveredDevices();
    } catch (e) {
      this._logger.error("Error while handling WebUSB connection event", { data: { error: e } });
    }
  }

  destroy(): void {
    this.stopListeningToConnectionEvents();
    this._deviceConnectionsByWebUsbDevice.forEach(sm => {
      void sm.closeConnection();
    });
    this._deviceConnectionsPendingReconnection.clear();
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

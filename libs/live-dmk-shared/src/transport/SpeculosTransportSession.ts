import {
  UnknownDeviceError,
  type ConnectError,
  type DeviceId,
  type DeviceModelId,
  type DisconnectHandler,
  type DmkError,
  type Transport as DmkTransport,
  type TransportConnectedDevice,
} from "@ledgerhq/device-management-kit";
import { Left, Right, type Either } from "purify-ts";

export type SpeculosSessionTarget = Readonly<{
  url: string;
  deviceModelId?: DeviceModelId;
}>;

type SpeculosDelegate = {
  key: string;
  transport: DmkTransport;
};

export class SpeculosTransportSession {
  private delegate: SpeculosDelegate | null = null;
  private readonly transportsByDevice = new Map<DeviceId, DmkTransport>();

  constructor(private readonly openTransport: (target: SpeculosSessionTarget) => DmkTransport) {}

  resolve(target: SpeculosSessionTarget | null): DmkTransport | null {
    if (!target) return null;

    const key = `${target.url}|${target.deviceModelId ?? ""}`;
    if (this.delegate?.key === key) return this.delegate.transport;

    this.delegate?.transport.stopDiscovering();

    const transport = this.openTransport(target);
    this.delegate = { key, transport };
    return transport;
  }

  stopDiscovering(): void {
    this.delegate?.transport.stopDiscovering();
  }

  async connect(
    target: SpeculosSessionTarget | null,
    params: {
      deviceId: DeviceId;
      onDisconnect: DisconnectHandler;
    },
  ): Promise<Either<ConnectError, TransportConnectedDevice>> {
    const transport = this.resolve(target);
    if (!transport) {
      return Left(new UnknownDeviceError("Speculos target not set"));
    }

    const connection = await transport.connect(params);
    connection.ifRight(({ id }) => this.transportsByDevice.set(id, transport));

    return connection;
  }

  disconnect(params: {
    connectedDevice: TransportConnectedDevice;
  }): Promise<Either<DmkError, void>> {
    const { id } = params.connectedDevice;
    const transport = this.transportsByDevice.get(id) ?? this.delegate?.transport;
    if (!transport) return Promise.resolve(Right(undefined));

    this.transportsByDevice.delete(id);

    return transport.disconnect(params);
  }
}

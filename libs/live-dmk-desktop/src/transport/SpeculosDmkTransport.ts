import { EMPTY, Observable, of } from "rxjs";
import { Either, Left, Right } from "purify-ts";
import {
  DeviceModelId,
  UnknownDeviceError,
  type ConnectError,
  type DeviceId,
  type DisconnectHandler,
  type DmkError,
  type Transport as DmkTransport,
  type TransportArgs,
  type TransportConnectedDevice,
  type TransportDiscoveredDevice,
  type TransportFactory,
  type TransportIdentifier,
} from "@ledgerhq/device-management-kit";
import {
  speculosIdentifier,
  speculosTransportFactory,
} from "@ledgerhq/device-transport-kit-speculos";
import { ledgerToDmkDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import { DeviceModelId as LLDeviceModelId } from "@ledgerhq/types-devices";

type SpeculosTarget = Readonly<{
  url: string;
  deviceModelId?: DeviceModelId;
}>;

const SPECULOS_DEVICE_TO_MODEL: Record<string, LLDeviceModelId> = {
  nanoS: LLDeviceModelId.nanoS,
  nanoSP: LLDeviceModelId.nanoSP,
  nanoX: LLDeviceModelId.nanoX,
  stax: LLDeviceModelId.stax,
  flex: LLDeviceModelId.europa,
  europa: LLDeviceModelId.europa,
  nanoGen5: LLDeviceModelId.apex,
};

function readSpeculosTarget(): SpeculosTarget | null {
  const port = process.env.SPECULOS_API_PORT;
  if (!port) return null;

  const configuredHost = (process.env.SPECULOS_ADDRESS ?? "http://127.0.0.1").replace(/\/+$/, "");
  const url = /:\d+$/.test(configuredHost) ? configuredHost : `${configuredHost}:${port}`;
  const model = SPECULOS_DEVICE_TO_MODEL[process.env.SPECULOS_DEVICE ?? ""];

  return {
    url,
    deviceModelId: model ? ledgerToDmkDeviceIdMap[model] : undefined,
  };
}

const targetKey = (target: SpeculosTarget): string => `${target.url}|${target.deviceModelId ?? ""}`;

function ignoreCompletion<T>(source: Observable<T>): Observable<T> {
  return new Observable(subscriber => {
    const subscription = source.subscribe({
      next: value => subscriber.next(value),
      error: error => subscriber.error(error),
    });

    return () => subscription.unsubscribe();
  });
}

/** Idle until SPECULOS_API_PORT is set. The DMK is built before that port is known. */
export class SpeculosDmkTransport implements DmkTransport {
  private readonly args: TransportArgs;
  private delegate: { key: string; transport: DmkTransport } | null = null;

  constructor(args: TransportArgs) {
    this.args = args;
  }

  getIdentifier(): TransportIdentifier {
    return speculosIdentifier;
  }

  isSupported(): boolean {
    return true;
  }

  listenToAvailableDevices(): Observable<TransportDiscoveredDevice[]> {
    const transport = this.resolveDelegate(readSpeculosTarget());

    if (!transport) {
      return of([]);
    }

    return ignoreCompletion(transport.listenToAvailableDevices());
  }

  startDiscovering(): Observable<TransportDiscoveredDevice> {
    const transport = this.resolveDelegate(readSpeculosTarget());

    return transport ? transport.startDiscovering() : EMPTY;
  }

  stopDiscovering(): void {
    this.delegate?.transport.stopDiscovering();
  }

  async connect(params: {
    deviceId: DeviceId;
    onDisconnect: DisconnectHandler;
  }): Promise<Either<ConnectError, TransportConnectedDevice>> {
    const transport = this.resolveDelegate(readSpeculosTarget());

    if (!transport) {
      return Left(new UnknownDeviceError("Speculos target not set"));
    }

    return transport.connect(params);
  }

  async disconnect(params: {
    connectedDevice: TransportConnectedDevice;
  }): Promise<Either<DmkError, void>> {
    const transport = this.delegate?.transport;

    return transport ? transport.disconnect(params) : Right(undefined);
  }

  private resolveDelegate(target: SpeculosTarget | null): DmkTransport | null {
    if (!target) {
      return null;
    }

    const key = targetKey(target);

    if (this.delegate?.key !== key) {
      this.delegate = {
        key,
        transport: speculosTransportFactory(target.url, true, target.deviceModelId)(this.args),
      };
    }

    return this.delegate.transport;
  }
}

export const speculosDmkTransportFactory: TransportFactory = (args: TransportArgs) =>
  new SpeculosDmkTransport(args);

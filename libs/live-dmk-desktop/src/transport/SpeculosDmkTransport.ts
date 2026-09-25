import { EMPTY, Observable, of } from "rxjs";
import type { Either } from "purify-ts";
import {
  type ConnectError,
  type DeviceId,
  type DeviceModelId,
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
import {
  ledgerToDmkDeviceIdMap,
  SpeculosTransportSession,
  type SpeculosSessionTarget,
} from "@ledgerhq/live-dmk-shared";
import { DeviceModelId as LLDeviceModelId } from "@ledgerhq/types-devices";

type SpeculosTarget = Readonly<{
  url: string;
  deviceModelId: DeviceModelId;
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

const DEFAULT_SPECULOS_MODEL = LLDeviceModelId.nanoSP;

const TRAILING_SLASHES = /\/+$/;
const EXPLICIT_PORT = /:\d+$/;

function readSpeculosTarget(): SpeculosTarget | null {
  const port = process.env.SPECULOS_API_PORT;
  if (!port) return null;

  const configuredHost = (process.env.SPECULOS_ADDRESS ?? "http://127.0.0.1").replace(
    TRAILING_SLASHES,
    "",
  );
  const url = EXPLICIT_PORT.test(configuredHost) ? configuredHost : `${configuredHost}:${port}`;
  const model = SPECULOS_DEVICE_TO_MODEL[process.env.SPECULOS_DEVICE ?? ""] ?? DEFAULT_SPECULOS_MODEL;

  return {
    url,
    deviceModelId: ledgerToDmkDeviceIdMap[model],
  };
}

function ignoreCompletion<T>(source: Observable<T>): Observable<T> {
  return new Observable(subscriber => {
    const subscription = source.subscribe({
      next: value => subscriber.next(value),
      error: error => subscriber.error(error),
    });

    return () => subscription.unsubscribe();
  });
}

function openSpeculosTransport(args: TransportArgs) {
  return (target: SpeculosSessionTarget) =>
    speculosTransportFactory(target.url, true, target.deviceModelId)(args);
}

export class SpeculosDmkTransport implements DmkTransport {
  private readonly session: SpeculosTransportSession;

  constructor(args: TransportArgs) {
    this.session = new SpeculosTransportSession(openSpeculosTransport(args));
  }

  getIdentifier(): TransportIdentifier {
    return speculosIdentifier;
  }

  isSupported(): boolean {
    return true;
  }

  listenToAvailableDevices(): Observable<TransportDiscoveredDevice[]> {
    const transport = this.session.resolve(readSpeculosTarget());

    if (!transport) {
      return of([]);
    }

    return ignoreCompletion(transport.listenToAvailableDevices());
  }

  startDiscovering(): Observable<TransportDiscoveredDevice> {
    const transport = this.session.resolve(readSpeculosTarget());

    return transport ? transport.startDiscovering() : EMPTY;
  }

  stopDiscovering(): void {
    this.session.stopDiscovering();
  }

  connect(params: {
    deviceId: DeviceId;
    onDisconnect: DisconnectHandler;
  }): Promise<Either<ConnectError, TransportConnectedDevice>> {
    return this.session.connect(readSpeculosTarget(), params);
  }

  disconnect(params: {
    connectedDevice: TransportConnectedDevice;
  }): Promise<Either<DmkError, void>> {
    return this.session.disconnect(params);
  }
}

export const speculosDmkTransportFactory: TransportFactory = (args: TransportArgs) =>
  new SpeculosDmkTransport(args);

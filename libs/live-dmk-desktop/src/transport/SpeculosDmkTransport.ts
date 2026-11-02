import { EMPTY, Observable, of } from "rxjs";
import type { Either } from "purify-ts";
import {
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
import { speculosIdentifier } from "@ledgerhq/device-transport-kit-speculos";
import { SpeculosTransportSession, type SpeculosSessionTarget } from "@ledgerhq/live-dmk-shared";
import {
  readSpeculosTarget,
  speculosTargetTransportFactory,
} from "@ledgerhq/live-dmk-shared/transport/speculosTarget";

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
  return (target: SpeculosSessionTarget) => speculosTargetTransportFactory(target)(args);
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

import { BehaviorSubject, EMPTY, Observable, of } from "rxjs";
import { switchMap } from "rxjs/operators";
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
import { SpeculosTransportSession } from "@ledgerhq/live-dmk-shared";

export type SpeculosTarget = Readonly<{
  url: string;
  /** Speculos cannot report its model, so the e2e bridge supplies it. */
  deviceModelId?: DeviceModelId;
}>;

/** Idle until the e2e bridge sets a Speculos target. */
export const speculosTargetSubject = new BehaviorSubject<SpeculosTarget | null>(null);

export const SPECULOS_LEGACY_DEVICE_ID_PREFIX = "speculos|";

export const buildSpeculosLegacyDeviceId = (url: string): string =>
  `${SPECULOS_LEGACY_DEVICE_ID_PREFIX}${url}`;

export const isSpeculosLegacyDeviceId = (deviceId: string): boolean =>
  deviceId.startsWith(SPECULOS_LEGACY_DEVICE_ID_PREFIX);

function openSpeculosTransport(args: TransportArgs) {
  return (target: SpeculosTarget) =>
    speculosTransportFactory(target.url, true, target.deviceModelId)(args);
}

/** Built lazily: the DMK starts before the e2e bridge knows the Speculos URL. */
export class SpeculosDmkTransport implements DmkTransport {
  private readonly session: SpeculosTransportSession;
  private readonly targetSubject: BehaviorSubject<SpeculosTarget | null>;

  constructor(args: TransportArgs, targetSubject: BehaviorSubject<SpeculosTarget | null>) {
    this.session = new SpeculosTransportSession(openSpeculosTransport(args));
    this.targetSubject = targetSubject;
  }

  getIdentifier(): TransportIdentifier {
    return speculosIdentifier;
  }

  isSupported(): boolean {
    return true;
  }

  listenToAvailableDevices(): Observable<TransportDiscoveredDevice[]> {
    return this.targetSubject.pipe(
      switchMap(target => {
        const transport = this.session.resolve(target);

        return transport ? transport.listenToAvailableDevices() : of([]);
      }),
    );
  }

  startDiscovering(): Observable<TransportDiscoveredDevice> {
    const transport = this.session.resolve(this.targetSubject.getValue());

    return transport ? transport.startDiscovering() : EMPTY;
  }

  stopDiscovering(): void {
    this.session.stopDiscovering();
  }

  connect(params: {
    deviceId: DeviceId;
    onDisconnect: DisconnectHandler;
  }): Promise<Either<ConnectError, TransportConnectedDevice>> {
    return this.session.connect(this.targetSubject.getValue(), params);
  }

  disconnect(params: {
    connectedDevice: TransportConnectedDevice;
  }): Promise<Either<DmkError, void>> {
    return this.session.disconnect(params);
  }
}

export const speculosDmkTransportFactory =
  (targetSubject: BehaviorSubject<SpeculosTarget | null>): TransportFactory =>
  (args: TransportArgs) =>
    new SpeculosDmkTransport(args, targetSubject);

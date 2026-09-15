import { BehaviorSubject, EMPTY, Observable, of } from "rxjs";
import { switchMap } from "rxjs/operators";
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

export type SpeculosTarget = Readonly<{
  url: string;
  /** Speculos cannot report the model it emulates, so the e2e bridge supplies it. */
  deviceModelId?: DeviceModelId;
}>;

/**
 * Null in every build that is not driven by Detox: the transport stays inert, discovers nothing
 * and refuses to connect until the e2e bridge points it at a Speculos instance.
 */
export const speculosTargetSubject = new BehaviorSubject<SpeculosTarget | null>(null);

export const SPECULOS_LEGACY_DEVICE_ID_PREFIX = "speculos|";

export const buildSpeculosLegacyDeviceId = (url: string): string =>
  `${SPECULOS_LEGACY_DEVICE_ID_PREFIX}${url}`;

const targetKey = (target: SpeculosTarget): string => `${target.url}|${target.deviceModelId ?? ""}`;

/**
 * The DMK is built once at app start, long before the e2e bridge knows which Speculos to talk to,
 * so this wraps the transport kit's factory and builds the real transport on first use.
 */
export class SpeculosDmkTransport implements DmkTransport {
  private readonly args: TransportArgs;
  private readonly targetSubject: BehaviorSubject<SpeculosTarget | null>;
  private delegate: { key: string; transport: DmkTransport } | null = null;

  constructor(args: TransportArgs, targetSubject: BehaviorSubject<SpeculosTarget | null>) {
    this.args = args;
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
        const transport = this.resolveDelegate(target);

        return transport ? transport.listenToAvailableDevices() : of([]);
      }),
    );
  }

  startDiscovering(): Observable<TransportDiscoveredDevice> {
    const transport = this.resolveDelegate(this.targetSubject.getValue());

    return transport ? transport.startDiscovering() : EMPTY;
  }

  stopDiscovering(): void {
    void this.delegate?.transport.stopDiscovering();
  }

  async connect(params: {
    deviceId: DeviceId;
    onDisconnect: DisconnectHandler;
  }): Promise<Either<ConnectError, TransportConnectedDevice>> {
    const transport = this.resolveDelegate(this.targetSubject.getValue());

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

export const speculosDmkTransportFactory =
  (targetSubject: BehaviorSubject<SpeculosTarget | null>): TransportFactory =>
  (args: TransportArgs) =>
    new SpeculosDmkTransport(args, targetSubject);

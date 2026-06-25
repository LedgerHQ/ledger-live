import type { DiscoveredDevice, TransportIdentifier } from "@ledgerhq/device-management-kit";
import { BehaviorSubject, Subject, Subscription, type Observable } from "rxjs";
import {
  BaseDiscoveryErrorTypes,
  type BaseDiscoveryError,
  type DeviceDiscoveryService,
  type DeviceDiscoveryStartArgs,
  type UnknownDiscoveryError,
} from "../types";
import { type DeviceDiscoverySource } from "./sources/DeviceDiscoverySource";

type DefaultDeviceDiscoveryServiceError<TDiscoveryError extends BaseDiscoveryError> =
  | TDiscoveryError
  | UnknownDiscoveryError;

/**
 * Note: this logic should be part of the DMK, but for now the API of the DMK is not designed to handle:
 * - discovery of a given set of transports at the same time (it's either all or 1 transport at a time)
 * - preflight checks (BLE enabled, BLE permissions, android location services enabled, etc.),
 * and related error management and retry logic.
 */
export class DefaultDeviceDiscoveryService<
  TDiscoveryError extends BaseDiscoveryError = BaseDiscoveryError,
> implements DeviceDiscoveryService<DefaultDeviceDiscoveryServiceError<TDiscoveryError>> {
  private subscription: Subscription | null = null;
  private readonly discoveredDevicesSubject = new BehaviorSubject<DiscoveredDevice[]>([]);
  private readonly errorsSubject = new Subject<
    DefaultDeviceDiscoveryServiceError<TDiscoveryError>
  >();

  readonly discoveredDevices: Observable<DiscoveredDevice[]> =
    this.discoveredDevicesSubject.asObservable();
  readonly errors: Observable<DefaultDeviceDiscoveryServiceError<TDiscoveryError>> =
    this.errorsSubject.asObservable();

  constructor(
    private readonly discoverySources: Map<
      TransportIdentifier,
      DeviceDiscoverySource<TDiscoveryError>
    >,
  ) {}

  start({ ignoreTransportIdentifiers = [] }: DeviceDiscoveryStartArgs = {}): void {
    if (this.subscription) {
      return;
    }

    const ignoredTransportIds = new Set(ignoreTransportIdentifiers);
    const devicesByTransport = new Map<TransportIdentifier, DiscoveredDevice[]>();
    const subscription = new Subscription();

    this.discoverySources.forEach(source => {
      if (ignoredTransportIds.has(source.transportId)) {
        return;
      }

      subscription.add(
        source.listen().subscribe({
          next: event => {
            if (event.type === "devices") {
              devicesByTransport.set(source.transportId, event.devices);
              this.emitDiscoveredDevices(devicesByTransport);
              return;
            }

            devicesByTransport.set(source.transportId, []);
            this.emitDiscoveredDevices(devicesByTransport);
            this.errorsSubject.next(event.error);
          },
          error: error => {
            devicesByTransport.set(source.transportId, []);
            this.emitDiscoveredDevices(devicesByTransport);
            this.errorsSubject.next({
              type: BaseDiscoveryErrorTypes.Unknown,
              transportId: source.transportId,
              error,
            });
          },
          complete: () => {
            devicesByTransport.set(source.transportId, []);
            this.emitDiscoveredDevices(devicesByTransport);
          },
        }),
      );
    });

    this.subscription = subscription;
    this.emitDiscoveredDevices(devicesByTransport);
  }

  stop(): void {
    this.subscription?.unsubscribe();
    this.subscription = null;
    this.discoveredDevicesSubject.next([]);
  }

  private emitDiscoveredDevices(
    devicesByTransport: Map<TransportIdentifier, DiscoveredDevice[]>,
  ): void {
    this.discoveredDevicesSubject.next([...devicesByTransport.values()].flat());
  }
}

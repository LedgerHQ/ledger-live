import type {
  DeviceManagementKit,
  DiscoveredDevice,
  TransportIdentifier,
} from "@ledgerhq/device-management-kit";
import { BehaviorSubject, Subject, Subscription, type Observable } from "rxjs";
import {
  DiscoveryErrorTypes,
  type DeviceDiscoveryService,
  type DeviceDiscoveryStartArgs,
  type DiscoveryError,
} from "../types";
import { type DeviceDiscoverySource } from "./sources/DeviceDiscoverySource";
import { RnBleDeviceDiscoverySource } from "./sources/RnBleDeviceDiscoverySource";
import { RnHidDeviceDiscoverySource } from "./sources/RnHidDeviceDiscoverySource";

const createDefaultDeviceDiscoverySources = (
  dmk: DeviceManagementKit,
): Map<TransportIdentifier, DeviceDiscoverySource> => {
  const sources = [new RnHidDeviceDiscoverySource(dmk), new RnBleDeviceDiscoverySource(dmk)];

  return new Map(sources.map(source => [source.transportId, source]));
};

/**
 * Note: this logic should be part of the DMK, but for now the API of the DMK is not designed to handle:
 * - discovery of a given set of transports at the same time (it's either all or 1 transport at a time)
 * - preflight checks (BLE enabled, BLE permissions, android location services enabled, etc.),
 * and related error management and retry logic.
 */
export class DefaultDeviceDiscoveryService implements DeviceDiscoveryService {
  private subscription: Subscription | null = null;
  private readonly discoveredDevicesSubject = new BehaviorSubject<DiscoveredDevice[]>([]);
  private readonly errorsSubject = new Subject<DiscoveryError>();

  readonly discoveredDevices: Observable<DiscoveredDevice[]> =
    this.discoveredDevicesSubject.asObservable();
  readonly errors: Observable<DiscoveryError> = this.errorsSubject.asObservable();

  constructor(
    dmk: DeviceManagementKit,
    private readonly discoverySources = createDefaultDeviceDiscoverySources(dmk),
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
              type: DiscoveryErrorTypes.Unknown,
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

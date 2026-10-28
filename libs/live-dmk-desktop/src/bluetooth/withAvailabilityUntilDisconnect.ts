import type { DeviceId, TransportFactory } from "@ledgerhq/device-management-kit";
import { BehaviorSubject, combineLatest, map, tap } from "rxjs";

/**
 * Wraps a transport whose registry never forgets a discovered device (web-ble keeps every device
 * picked through `navigator.bluetooth.requestDevice` for the whole session).
 *
 * A device is listed by `listenToAvailableDevices` from its discovery until it disconnects, so a
 * device turned off or out of range leaves the regular device flow instead of staying selectable.
 * It shows up again once the user discovers it anew.
 */
export const withAvailabilityUntilDisconnect =
  (factory: TransportFactory): TransportFactory =>
  args => {
    const transport = factory(args);
    const availableIds$ = new BehaviorSubject<ReadonlySet<DeviceId>>(new Set());

    const markAvailable = (deviceId: DeviceId): void => {
      availableIds$.next(new Set(availableIds$.getValue()).add(deviceId));
    };

    const markUnavailable = (deviceId: DeviceId): void => {
      const ids = new Set(availableIds$.getValue());
      if (ids.delete(deviceId)) availableIds$.next(ids);
    };

    return {
      getIdentifier: () => transport.getIdentifier(),
      isSupported: () => transport.isSupported(),
      startDiscovering: () =>
        transport.startDiscovering().pipe(tap(device => markAvailable(device.id))),
      stopDiscovering: () => transport.stopDiscovering(),
      listenToAvailableDevices: () =>
        combineLatest([transport.listenToAvailableDevices(), availableIds$]).pipe(
          map(([devices, availableIds]) => devices.filter(device => availableIds.has(device.id))),
        ),
      connect: params =>
        transport.connect({
          ...params,
          onDisconnect: deviceId => {
            markUnavailable(deviceId);
            params.onDisconnect(deviceId);
          },
        }),
      disconnect: async params => {
        const result = await transport.disconnect(params);
        markUnavailable(params.connectedDevice.id);
        return result;
      },
    };
  };

import {
  DeviceStatus,
  type ConnectedDevice,
  type DeviceManagementKit,
  type DeviceSessionId,
} from "@ledgerhq/device-management-kit";
import { filter, Observable, Subscription } from "rxjs";

// TODO: clean up once the DMK API lands: https://github.com/LedgerHQ/device-sdk-ts/pull/2189
/**
 * The devices that have a DMK session, also the sessions that other code opens. Emits the list on
 * subscribe, then at each connection and each disconnection.
 */
export function connectedDevices$(dmk: DeviceManagementKit): Observable<ConnectedDevice[]> {
  return new Observable<ConnectedDevice[]>(subscriber => {
    const devices = new Map<DeviceSessionId, ConnectedDevice>();
    const subscription = new Subscription();
    let hasStarted = false;

    const emit = () => {
      if (hasStarted) {
        subscriber.next([...devices.values()]);
      }
    };

    const add = (device: ConnectedDevice) => {
      if (!devices.has(device.sessionId)) {
        devices.set(device.sessionId, device);
        emit();
      }
    };

    const remove = (sessionId: DeviceSessionId) => {
      if (devices.delete(sessionId)) {
        emit();
      }
    };

    const track = (device: ConnectedDevice) => {
      const { sessionId } = device;
      if (devices.has(sessionId)) {
        return;
      }
      subscription.add(
        dmk.getDeviceSessionState({ sessionId }).subscribe({
          next: ({ deviceStatus }) =>
            deviceStatus === DeviceStatus.NOT_CONNECTED ? remove(sessionId) : add(device),
          error: () => remove(sessionId),
          complete: () => remove(sessionId),
        }),
      );
    };

    const isListed = ({ sessionId }: ConnectedDevice) =>
      dmk.listConnectedDevices().some(device => device.sessionId === sessionId);

    dmk.listConnectedDevices().forEach(track);
    subscription.add(
      dmk
        .listenToConnectedDevice()
        // The DMK replays every session it opened, also the closed ones.
        .pipe(filter(isListed))
        .subscribe({ next: track, error: error => subscriber.error(error) }),
    );

    hasStarted = true;
    emit();

    return subscription;
  });
}

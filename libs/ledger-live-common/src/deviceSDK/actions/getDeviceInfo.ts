import { LockedDeviceError } from "@ledgerhq/errors";
import { DeviceId, DeviceInfo } from "@ledgerhq/types-live";
import { Observable } from "rxjs";
import { scan } from "rxjs/operators";
import { getDeviceInfoTask } from "../tasks/getDeviceInfo";

export type GetDeviceInfoActionArgs = { deviceId: DeviceId };

// TODO: Bad idea ?
// Should it be: SpeficActionErrors | CommonErrors
export type DeviceActionError = Error;

// TODO: Should we create a "general state" (scared we would end up with the same big existing state by doing this)
// for all the lockedDevice etc. to be consistent ?
// What would be in it ?
// lockedDevice (and unresponsive would be handle with lockedDevice)
// error ? meaning an action can throw an error, but it's always handled in the state ? could be interesting
// If only those, it's ok ? But what happens if we device to add a new prop to this "general state" ? We will need to add it everywhere ?
export type GetDeviceInfoActionState = {
  deviceInfo: DeviceInfo | null;
  lockedDevice: boolean;
  error: DeviceActionError | null;
};

// or maybe to be more flexible on the "general state"/"common state"
export type GetDeviceInfoActionState2 = {
  deviceInfo: DeviceInfo | null;
  commonState: {
    lockedDevice?: boolean;
    error?: DeviceActionError | null;
  };
};

export function getDeviceInfoAction({
  deviceId,
}: GetDeviceInfoActionArgs): Observable<GetDeviceInfoActionState> {
  // or getDeviceInfoTask({}).pipe(scan(reducer)).subscribe(o) ? See below
  return new Observable((o) => {
    getDeviceInfoTask({ deviceId }).subscribe({
      next: (event) => {
        o.next({ deviceInfo: event, lockedDevice: false, error: null });
      },
      error: (error) => {
        // TODO: handle device locked for ex ?
        if (error instanceof LockedDeviceError) {
          o.next({ deviceInfo: null, lockedDevice: true, error: null });
          return;
        }

        o.next({ deviceInfo: null, lockedDevice: false, error });
      },
      complete: () => o.complete(),
    });
  });
}

export function getDeviceInfoAction2({
  deviceId,
}: GetDeviceInfoActionArgs): Observable<GetDeviceInfoActionState> {
  // TODO: what does it looks like with several tasks ?
  return getDeviceInfoTask({ deviceId }).pipe(
    scan((_precState: GetDeviceInfoActionState, event: DeviceInfo) => {
      // TODO: handles error cases
      return { deviceInfo: event, lockedDevice: false, error: null };
    })
  );
}

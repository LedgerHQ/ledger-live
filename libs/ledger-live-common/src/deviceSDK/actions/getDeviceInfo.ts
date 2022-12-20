//import { LockedDeviceError } from "@ledgerhq/errors";
import { DeviceId, DeviceInfo } from "@ledgerhq/types-live";
import { Observable } from "rxjs";
import { scan, tap } from "rxjs/operators";
import {
  getDeviceInfoTask,
  GetDeviceInfoTaskEvent,
} from "../tasks/getDeviceInfo";

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
type State = {
  deviceInfo: DeviceInfo | null;
};

// TODO: put it somewhere else: in the type lib
export type GeneralState = {
  lockedDevice: boolean;
  error: DeviceActionError | null;
};

// Maybe here, or in the type lib
export type GetDeviceInfoActionState = State & GeneralState;

// export function getDeviceInfoAction({
//   deviceId,
// }: GetDeviceInfoActionArgs): Observable<GetDeviceInfoActionState> {
//   // or getDeviceInfoTask({}).pipe(scan(reducer)).subscribe(o) ? See below
//   return new Observable((o) => {
//     getDeviceInfoTask({ deviceId }).subscribe({
//       next: (event) => {
//         o.next({ deviceInfo: event, lockedDevice: false, error: null });
//       },
//       error: (error) => {
//         // TODO: handle device locked for ex ?
//         if (error instanceof LockedDeviceError) {
//           o.next({ deviceInfo: null, lockedDevice: true, error: null });
//           return;
//         }

//         o.next({ deviceInfo: null, lockedDevice: false, error });
//       },
//       complete: () => o.complete(),
//     });
//   });
// }

const generalInitialState: GeneralState = { lockedDevice: false, error: null };
export const initialState: GetDeviceInfoActionState = {
  deviceInfo: null,
  ...generalInitialState,
};

// const generalReducer = (currentState: GeneralState, event: GeneralTaskEvent) => {
//   switch (event.type) {
//     case "error":
//       if (event.error instanceof LockedDeviceError) {
//         return { ...currentState, lockedDevice: true };
//       }
//     default:
//       return currentState;
//   }
// };

export function getDeviceInfoAction({
  deviceId,
}: GetDeviceInfoActionArgs): Observable<GetDeviceInfoActionState> {
  // TODO: what does it looks like with several tasks ?
  return getDeviceInfoTask({ deviceId }).pipe(
    tap((event) => console.log(`🦖 ${JSON.stringify(event)}`)),
    scan(
      (
        currentState: GetDeviceInfoActionState,
        event: GetDeviceInfoTaskEvent
      ) => {
        switch (event.type) {
          case "taskError":
            return { ...initialState, error: event.error };
          case "data":
            return { ...currentState, deviceInfo: event.deviceInfo };
          default:
            // TODO: define a general reducer
            return { ...currentState, error: event.error }; // ...generalReducer(currentState, event) };
        }
      },
      initialState
    )
  );
}

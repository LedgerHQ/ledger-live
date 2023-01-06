//import { LockedDeviceError } from "@ledgerhq/errors";
import { DeviceId, FirmwareUpdateContext } from "@ledgerhq/types-live";
import { Observable } from "rxjs";
import { scan, tap } from "rxjs/operators";
import {
  updateFirmwareTask,
  UpdateFirmwareTaskEvent,
} from "../tasks/updateFirmware";

export type updateFirmwareActionArgs = {
  deviceId: DeviceId;
  updateContext: FirmwareUpdateContext;
};
// TODO: should the update context be retrieved from the app or here? we'll have to retrieve it in the app anyway
// to check if there's an available firmware

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
  // installingOsu: boolean;
  // installOsuDevicePermissionRequested: boolean; // TODO: should this all be booleans or maybe a single prop called "step"?
  // allowManagerRequested: boolean;
  step:
    | "installingOsu"
    | "installOsuDevicePermissionRequested"
    | "allowManagerRequested"
    | "preparingUpdate";
  progress: number;
  // TODO: probably we'll need old and new device info here so we can check if we want reinstall language, apps, etc
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
  step: "preparingUpdate",
  progress: 0,
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
  updateContext,
}: updateFirmwareActionArgs): Observable<GetDeviceInfoActionState> {
  // TODO: what does it looks like with several tasks ?
  return updateFirmwareTask({ deviceId, updateContext }).pipe(
    tap((event) => console.log(`🦖 ${JSON.stringify(event)}`)),
    scan(
      (
        currentState: GetDeviceInfoActionState,
        event: UpdateFirmwareTaskEvent
      ) => {
        switch (event.type) {
          case "taskError":
            return { ...initialState, error: event.error };
          case "installingOsu":
            return {
              ...currentState,
              step: "installingOsu",
              progress: event.progress,
            };
          case "allowManagerRequested":
          case "installOsuDevicePermissionRequested":
            return { ...currentState, step: event.type };
          default:
            // TODO: define a general reducer
            return { ...currentState, error: event.error }; // ...generalReducer(currentState, event) };
        }
      },
      initialState
    )
  );
}

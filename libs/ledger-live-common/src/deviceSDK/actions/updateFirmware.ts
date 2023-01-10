//import { LockedDeviceError } from "@ledgerhq/errors";
import { DeviceId, FirmwareUpdateContext } from "@ledgerhq/types-live";
import { Observable } from "rxjs";
import { scan } from "rxjs/operators";
import {
  updateFirmwareTask,
  UpdateFirmwareTaskEvent,
} from "../tasks/updateFirmware";
import {
  FullActionState,
  initialSharedActionState,
  sharedReducer,
} from "./core";

export type updateFirmwareActionArgs = {
  deviceId: DeviceId;
  updateContext: FirmwareUpdateContext;
};
// TODO: should the update context be retrieved from the app or here? we'll have to retrieve it in the app anyway
// to check if there's an available firmware

// TODO: Should we create a "general state" (scared we would end up with the same big existing state by doing this)
// for all the lockedDevice etc. to be consistent ?
// What would be in it ?
// lockedDevice (and unresponsive would be handle with lockedDevice)
// error ? meaning an action can throw an error, but it's always handled in the state ? could be interesting
// If only those, it's ok ? But what happens if we device to add a new prop to this "general state" ? We will need to add it everywhere ?

// TODO: put it somewhere else: in the type lib

export type UpdateFirmwareActionState = FullActionState<{
  // installingOsu: boolean;
  // installOsuDevicePermissionRequested: boolean; // TODO: should this all be booleans or maybe a single prop called "step"?
  // allowManagerRequested: boolean;
  step:
    | "installingOsu"
    | "installOsuDevicePermissionRequested"
    | "allowManagerRequested"
    | "preparingUpdate";
  progress: number;
  error: { type: "UpdateFirmwareError"; message?: string };
  // TODO: probably we'll need old and new device info here so we can check if we want reinstall language, apps, etc
}>;

export const initialState: UpdateFirmwareActionState = {
  step: "preparingUpdate",
  progress: 0,
  ...initialSharedActionState,
};

export function updateFirmwareAction({
  deviceId,
  updateContext,
}: updateFirmwareActionArgs): Observable<UpdateFirmwareActionState> {
  // TODO: what does it looks like with several tasks ?
  return updateFirmwareTask({ deviceId, updateContext }).pipe(
    scan<UpdateFirmwareTaskEvent, UpdateFirmwareActionState>(
      (currentState, event) => {
        switch (event.type) {
          case "taskError":
            return {
              ...initialState,
              error: {
                type: "UpdateFirmwareError",
                error: event.error.message,
              },
            };
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
            return {
              ...currentState,
              ...sharedReducer({
                event,
              }),
            };
        }
      },
      initialState
    )
  );
}

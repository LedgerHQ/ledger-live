//import { LockedDeviceError } from "@ledgerhq/errors";
import { DeviceId, DeviceInfo } from "@ledgerhq/types-live";
import { Observable, of } from "rxjs";
import { filter, scan, switchMap } from "rxjs/operators";
import {
  updateFirmwareTask,
  UpdateFirmwareTaskEvent,
} from "../tasks/updateFirmware";
import {
  getDeviceInfoTask,
  GetDeviceInfoTaskEvent,
} from "../tasks/getDeviceInfo";
import {
  FullActionState,
  initialSharedActionState,
  sharedReducer,
} from "./core";
import {
  getLatestFirmwareTask,
  GetLatestFirmwareTaskErrorEvent,
} from "../tasks/getLatestFirmware";

export type updateFirmwareActionArgs = {
  deviceId: DeviceId;
};

export type UpdateFirmwareActionState = FullActionState<{
  // installingOsu: boolean;
  // installOsuDevicePermissionRequested: boolean; // TODO: should this all be booleans or maybe a single prop called "step"?
  // allowSecureChannelRequested: boolean;
  step:
    | "installingOsu"
    | "flashingMcu"
    | "flashingBootloader"
    | "installOsuDevicePermissionRequested"
    | "installOsuDevicePermissionGranted"
    | "allowSecureChannelRequested"
    | "firmwareUpdateCompleted"
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
}: updateFirmwareActionArgs): Observable<UpdateFirmwareActionState> {
  //let oldDeviceInfo: DeviceInfo | undefined;

  return getDeviceInfoTask({ deviceId })
    .pipe(
      filter<GetDeviceInfoTaskEvent, { type: "data"; deviceInfo: DeviceInfo }>(
        (e): e is { type: "data"; deviceInfo: DeviceInfo } => {
          return e.type === "data";
        }
      ),
      switchMap(({ deviceInfo }) => {
        return getLatestFirmwareTask({ deviceId, deviceInfo });
      }),
      switchMap((latestFirmwareData) => {
        if (latestFirmwareData.type !== "data") {
          return of(latestFirmwareData);
        } else {
          return updateFirmwareTask({
            deviceId,
            updateContext: latestFirmwareData.firmwareUpdateContext,
          });
        }
      })
      // reinstall the language if needed
      // oldDeviceInfo?.languageId !== undefined && oldDeviceInfo?.languageId !== 0
      //   ? EMPTY // install language
      //   : EMPTY
    )
    .pipe(
      scan<
        UpdateFirmwareTaskEvent | GetLatestFirmwareTaskErrorEvent,
        UpdateFirmwareActionState
      >((currentState, event) => {
        switch (event.type) {
          case "taskError":
            return {
              ...initialState,
              error: {
                type: "UpdateFirmwareError",
                error: event.error,
              },
            };
          case "installingOsu":
          case "flashingMcu":
          case "flashingBootloader":
            return {
              ...currentState,
              step: event.type,
              progress: event.progress,
            };
          case "allowSecureChannelRequested":
          case "installOsuDevicePermissionRequested":
          case "installOsuDevicePermissionGranted":
          case "firmwareUpdateCompleted":
            return { ...currentState, step: event.type };
          default:
            return {
              ...currentState,
              ...sharedReducer({
                event,
              }),
            };
        }
      }, initialState)
    );
}

// const isNotGetDeviceInfoEventPredicate = (
//   e: UpdateFirmwareTaskEvent | GetDeviceInfoTaskEvent
// ): e is UpdateFirmwareTaskEvent => {
//   return e.type !== "data";
// };

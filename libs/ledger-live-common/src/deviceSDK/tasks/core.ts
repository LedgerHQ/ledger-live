import { LockedDeviceError } from "@ledgerhq/errors";
import { Observable, of } from "rxjs";
import { catchError, retryWhen, timeout } from "rxjs/operators";
import { retryWhileErrors } from "../../hw/deviceAccess";

export type SharedTaskEvent = { type: "error"; error: Error };

const NO_RESPONSE_TIMEOUT_MS = 30000;

export function wrappedTask<TaskArgumentsType, TaskEventsType>(
  task: (
    args: TaskArgumentsType
  ) => Observable<TaskEventsType | SharedTaskEvent>
) {
  return (
    args: TaskArgumentsType
  ): Observable<TaskEventsType | SharedTaskEvent> =>
    task(args).pipe(
      timeout(NO_RESPONSE_TIMEOUT_MS),
      retryWhen(
        retryWhileErrors((error) => {
          // TODO: emits here an event to the action of type error, error: LockedDeviceError ? Yes
          if (error instanceof LockedDeviceError) {
            return true;
          }

          // TODO: other errors on which to retry:
          // - CantOpenDevice: seems to be when device is USB plugged, powered on, but not yet unlocked for the 1st time
          //   since being powered on.

          return false;
        })
      ),
      catchError((error: Error) => {
        // Emits the error to the action, without throwing
        return of<SharedTaskEvent>({ type: "error", error });
      })
    );
}

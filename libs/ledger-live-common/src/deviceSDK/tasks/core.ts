import { LockedDeviceError } from "@ledgerhq/errors";
import { Observable, of } from "rxjs";
import { catchError, retryWhen, timeout } from "rxjs/operators";
import { retryWhileErrors } from "../../hw/deviceAccess";

export type SharedTaskEvent = { type: "error"; error: Error };

const NO_RESPONSE_TIMEOUT_MS = 30000;

/**
 * Wraps a task function to add some common logic to it:
 * - Timeout for no response
 * - Retry strategy on specific errors
 * - Catch errors and emit them as events
 *
 * @param task The task function to wrap
 * @returns A wrapped task function
 */
export function sharedLogicTaskWrapper<TaskArgumentsType, TaskEventsType>(
  task: (
    args: TaskArgumentsType
  ) => Observable<TaskEventsType | SharedTaskEvent>
) {
  return (
    args: TaskArgumentsType
  ): Observable<TaskEventsType | SharedTaskEvent> => {
    return new Observable((subscriber) => {
      return task(args)
        .pipe(
          timeout(NO_RESPONSE_TIMEOUT_MS),
          retryWhen(
            retryWhileErrors((error) => {
              if (error instanceof LockedDeviceError) {
                // Emits to the action a locked device error event so it is aware of it before retrying
                subscriber.next({ type: "error", error });
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
        )
        .subscribe(subscriber);
    });
  };
}

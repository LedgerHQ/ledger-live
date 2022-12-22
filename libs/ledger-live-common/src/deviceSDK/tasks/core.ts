import { LockedDeviceError } from "@ledgerhq/errors";
import { Observable, of } from "rxjs";
import { catchError, retryWhen, timeout } from "rxjs/operators";
import { retryWhileErrors } from "../../hw/deviceAccess";

export type GeneralTaskEvent = { type: "error"; error: Error };

const NO_RESPONSE_TIMEOUT_MS = 10000;

export function wrappedTask<TaskArgumentsType, TaskEventsType>(
  task: (
    args: TaskArgumentsType
  ) => Observable<TaskEventsType | GeneralTaskEvent>
) {
  return (
    args: TaskArgumentsType
  ): Observable<TaskEventsType | GeneralTaskEvent> =>
    task(args).pipe(
      timeout(NO_RESPONSE_TIMEOUT_MS),
      retryWhen(
        retryWhileErrors((error) => {
          if (error instanceof LockedDeviceError) {
            return true;
          }

          return false;
        })
      ),
      catchError((error: Error) => {
        return of<GeneralTaskEvent>({ type: "error", error });
      })
    );
}

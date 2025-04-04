import {
  CantOpenDevice,
  DisconnectedDevice,
  LockedDeviceError,
  TransportRaceCondition,
  UnresponsiveDeviceError,
  TransportStatusErrorClassType,
  CustomErrorClassType,
} from "@ledgerhq/errors";
import { Observable, from, of, throwError, timer } from "rxjs";
import { catchError, concatMap, retry, switchMap, timeout } from "rxjs/operators";
import { Transport, TransportRef } from "../transports/core";
import { DmkError } from "@ledgerhq/device-management-kit";

export type SharedTaskEvent = { type: "error"; error: Error; retrying: boolean };

export const NO_RESPONSE_TIMEOUT_MS = 30000;
export const RETRY_ON_ERROR_DELAY_MS = 500;

export const LOG_TYPE = "device-sdk-task";

/**
 * Wraps a task function to add some common logic to it:
 * - Timeout for no response
 * - Retry strategy on specific errors: those errors are fixed for all tasks
 * - Catch errors and emit them as events
 *
 * @param task The task function to wrap
 * @returns A wrapped task function
 */
export function sharedLogicTaskWrapper<TaskArgsType, TaskEventsType>(
  task: (args: TaskArgsType) => Observable<TaskEventsType | SharedTaskEvent>,
  defaultTimeoutOverride?: number,
) {
  return (args: TaskArgsType): Observable<TaskEventsType | SharedTaskEvent> => {
    return new Observable(subscriber => {
      return task(args)
        .pipe(
          timeout(defaultTimeoutOverride ?? NO_RESPONSE_TIMEOUT_MS),
          retry({
            delay: error => {
              let acceptedError = false;

              // - LockedDeviceError and UnresponsiveDeviceError: on every transport if there is a device but it is locked
              // - CantOpenDevice: it can come from hw-transport-node-hid-singleton/TransportNodeHid
              //   or react-native-hw-transport-ble/BleTransport when no device is found
              // - DisconnectedDevice: it can come from TransportNodeHid while switching app
              if (
                error instanceof LockedDeviceError ||
                error instanceof UnresponsiveDeviceError ||
                error instanceof CantOpenDevice ||
                error instanceof DisconnectedDevice ||
                error instanceof TransportRaceCondition
              ) {
                // Emits to the action an error event so it is aware of it (for ex locked device) before retrying
                const event: SharedTaskEvent = {
                  type: "error",
                  error,
                  retrying: true,
                };
                subscriber.next(event);
                acceptedError = true;
              }
              return acceptedError ? timer(RETRY_ON_ERROR_DELAY_MS) : throwError(() => error);
            },
          }),
          catchError((error: Error) => {
            // Emits the error to the action, without throwing
            return of<SharedTaskEvent>({ type: "error", error, retrying: false });
          }),
        )
        .subscribe(subscriber);
    });
  };
}

type ErrorClass = CustomErrorClassType | TransportStatusErrorClassType;

// To be able to retry a command, the command needs to take an object containing a transport as its argument
type CommandTransportArgs = { transport: Transport };

const isDmkError = (error: any): error is DmkError => error && "_tag" in error;

/**
 * Calls a command and retries it on given errors. The transport is refreshed before each retry.
 *
 * The no response timeout is handled at the task level
 *
 * @param command the command to wrap, it should take as argument an object containing a transport
 * @param transportRef a reference to the transport, that can be updated/refreshed
 * @param allowedErrors a list of errors to retry on
 *  - errorClass: the error class to retry on
 *  - maxRetries: the maximum number of retries for this error
 */
export function retryOnErrorsCommandWrapper<CommandArgsWithoutTransportType, CommandEventsType>({
  command,
  allowedErrors,
  allowedDmkErrors = [],
}: {
  command: (
    args: CommandArgsWithoutTransportType & CommandTransportArgs,
  ) => Observable<CommandEventsType>;
  allowedErrors: {
    errorClass: ErrorClass;
    maxRetries: number | "infinite";
  }[];
  allowedDmkErrors?: DmkError[];
}) {
  // Returns the command wrapped into the retry mechanism
  // No need to pass the transport to the wrapped command
  return (
    transportRef: TransportRef,
    argsWithoutTransport: CommandArgsWithoutTransportType,
  ): Observable<CommandEventsType> => {
    let sameErrorInARowCount = 0;
    let shouldRefreshTransport = false;
    let latestErrorName: string | null = null;

    // It cannot start with the command itself because of the retry and the transport reference:
    // the retry will be chained on the observable returned before the pipe and if it is the command itself,
    // it would retry the command with the same transport and not the refreshed one
    return of(1).pipe(
      switchMap(() => {
        if (shouldRefreshTransport) {
          // if we pass through this code again it means that some error happened during the command
          // execution, therefore we'll then, and only then, start refreshing the transport
          // before trying the command again
          return from(transportRef.refreshTransport());
        }

        shouldRefreshTransport = true;
        return of(1);
      }),
      // Overrides the transport instance so it can be refreshed
      concatMap(() => {
        return command({
          ...argsWithoutTransport,
          transport: transportRef.current,
        });
      }),
      retry({
        delay: error => {
          let isAllowedError = false;

          if (latestErrorName !== error.name) {
            sameErrorInARowCount = 0;
          } else {
            sameErrorInARowCount++;
          }

          latestErrorName = error.name;

          for (const { errorClass, maxRetries } of allowedErrors) {
            if (error instanceof errorClass) {
              if (maxRetries === "infinite" || sameErrorInARowCount < maxRetries) {
                isAllowedError = true;
              }
              break;
            }
          }

          if (isDmkError(error)) {
            isAllowedError = allowedDmkErrors.some(dmkError => dmkError._tag === error._tag);
          }

          if (isAllowedError) {
            // Retries the whole pipe chain after the delay
            return timer(RETRY_ON_ERROR_DELAY_MS);
          }

          // If the error is not part of the allowed errors, it is thrown
          return throwError(() => error);
        },
      }),
    );
  };
}

import { Observable, throwError, timer } from "rxjs";
import { throttleTime, filter, map, catchError, retry } from "rxjs/operators";
import {
  LockedDeviceError,
  ManagerAppDepInstallRequired,
  ManagerDeviceLockedError,
  UnresponsiveDeviceError,
} from "@ledgerhq/errors";
import Transport from "@ledgerhq/hw-transport";
import type { ApplicationVersion, App } from "@ledgerhq/types-live";
import ManagerAPI from "../manager/api";
import { getDependencies } from "../apps/polyfill";
import { LocalTracer } from "@ledgerhq/logs";
import { LOG_TYPE } from ".";

const APP_INSTALL_RETRY_DELAY = 500;
const APP_INSTALL_RETRY_LIMIT = 5;

/**
 * Command to install a given app to a device.
 *
 * On error (except on locked device errors), a retry mechanism is set.
 *
 * @param transport
 * @param targetId Device firmware target id
 * @param app Info of the app to install
 * @param others Extended params:
 *  - retryLimit: number of time this command is retried when any error occurs. Default to 5.
 *  - retryDelayMs: delay in ms before retrying on an error. Default to 500ms.
 * @returns An Observable emitting installation progress
 *  - progress: float number from 0 to 1 representing the installation progress
 */
export default function installApp(
  transport: Transport,
  targetId: string | number,
  app: ApplicationVersion | App,
  {
    retryLimit = APP_INSTALL_RETRY_LIMIT,
    retryDelayMs = APP_INSTALL_RETRY_DELAY,
  }: { retryLimit?: number; retryDelayMs?: number } = {},
): Observable<{
  progress: number;
}> {
  const tracer = new LocalTracer(LOG_TYPE, {
    ...transport.getTraceContext(),
    function: "installApp",
  });
  tracer.trace("Install app", {
    targetId,
    appName: app?.name,
    appVersion: app?.version,
    retryLimit,
    retryDelayMs,
  });

  return ManagerAPI.install(transport, "install-app", {
    targetId,
    perso: app.perso,
    deleteKey: app.delete_key,
    firmware: app.firmware,
    firmwareKey: app.firmware_key,
    hash: app.hash,
  }).pipe(
    retry({
      count: retryLimit,
      delay: (error: unknown, retryCount: number) => {
        // Not retrying on locked device errors
        if (
          error instanceof LockedDeviceError ||
          error instanceof ManagerDeviceLockedError ||
          error instanceof UnresponsiveDeviceError
        ) {
          tracer.trace(`Not retrying on error: ${error}`, {
            error,
          });
          return throwError(() => error);
        }

        tracer.trace(`Retrying (${retryCount}/${retryLimit}) on error: ${error}`, {
          error,
          retryLimit,
          retryDelayMs,
        });
        return timer(retryDelayMs);
      },
    }),
    filter((e: any) => e.type === "bulk-progress"), // only bulk progress interests the UI
    throttleTime(100), // throttle to only emit 10 event/s max, to not spam the UI
    map((e: any) => ({
      progress: e.progress,
    })), // extract a stream of progress percentage
    catchError((e: Error) => {
      tracer.trace(`Error: ${e}`, { error: e });

      if (!e || !e.message) return throwError(() => e);

      const status = e.message.slice(e.message.length - 4);
      if (status === "6a83" || status === "6811") {
        const dependencies = getDependencies(app.name);
        return throwError(
          () =>
            new ManagerAppDepInstallRequired("", {
              appName: app.name,
              dependency: dependencies.join(", "),
            }),
        );
      }

      return throwError(() => e);
    }),
  );
}

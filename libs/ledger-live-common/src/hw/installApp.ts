import { Observable, throwError } from "rxjs";
import { throttleTime, filter, map, catchError } from "rxjs/operators";
import { ManagerAppDepInstallRequired } from "@ledgerhq/errors";
import Transport from "@ledgerhq/hw-transport";
import type { ApplicationVersion, App } from "@ledgerhq/types-live";
import ManagerAPI from "../manager/api";
import { getDependencies } from "../apps/polyfill";
import { retryWithDelay } from "../rxjs/operators/retryWithDelay";

const APP_INSTALL_RETRY_DELAY = 500;
const APP_INSTALL_RETRY_LIMIT = 5;

export default function installApp(
  transport: Transport,
  targetId: string | number,
  app: ApplicationVersion | App,
): Observable<{
  progress: number;
}> {
  return ManagerAPI.install(transport, "install-app", {
    targetId,
    perso: app.perso,
    deleteKey: app.delete_key,
    firmware: app.firmware,
    firmwareKey: app.firmware_key,
    hash: app.hash,
  }).pipe(
    retryWithDelay(APP_INSTALL_RETRY_DELAY, APP_INSTALL_RETRY_LIMIT),
    filter((e: any) => e.type === "bulk-progress"), // only bulk progress interests the UI
    throttleTime(100), // throttle to only emit 10 event/s max, to not spam the UI
    map((e: any) => ({
      progress: e.progress,
    })), // extract a stream of progress percentage
    catchError((e: Error) => {
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

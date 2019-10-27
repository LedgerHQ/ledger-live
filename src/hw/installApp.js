// @flow
import { Observable, throwError } from "rxjs";
import { throttleTime, filter, map, catchError } from "rxjs/operators";
import { ManagerAppDepInstallRequired } from "@ledgerhq/errors";
import type Transport from "@ledgerhq/hw-transport";
import type { ApplicationVersion } from "../types/manager";
import ManagerAPI from "../api/Manager";
import { getDirectDep } from "../apps/polyfill";

export default function installApp(
  transport: Transport<*>,
  targetId: string | number,
  app: ApplicationVersion
): Observable<{ progress: number }> {
  return ManagerAPI.install(transport, "install-app", {
    targetId,
    perso: app.perso,
    deleteKey: app.delete_key,
    firmware: app.firmware,
    firmwareKey: app.firmware_key,
    hash: app.hash
  }).pipe(
    filter(e => e.type === "bulk-progress"), // only bulk progress interests the UI
    throttleTime(100), // throttle to only emit 10 event/s max, to not spam the UI
    map(e => ({ progress: e.progress })), // extract a stream of progress percentage
    catchError((e: Error) => {
      if (!e || !e.message) return throwError(e);
      const status = e.message.slice(e.message.length - 4);
      if (status === "6a83") {
        return throwError(
          new ManagerAppDepInstallRequired("", {
            appName: app.name,
            dependency: getDirectDep(app.name) || ""
          })
        );
      }
      return throwError(e);
    })
  );
}

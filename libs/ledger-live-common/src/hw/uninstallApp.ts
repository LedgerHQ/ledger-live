import { ignoreElements, catchError } from "rxjs/operators";
import { Observable, throwError } from "rxjs";
import { ManagerAppDepUninstallRequired } from "@ledgerhq/errors";
import Transport from "@ledgerhq/hw-transport";
import ManagerAPI from "../api/Manager";
import type { App, ApplicationVersion } from "@ledgerhq/types-live";
export default function uninstallApp(
  transport: Transport,
  targetId: string | number,
  app: ApplicationVersion | App
): Observable<any> {
  return ManagerAPI.install(
    transport,
    "uninstall-app",
    {
      targetId,
      perso: app.perso,
      deleteKey: app.delete_key,
      firmware: app.delete,
      firmwareKey: app.delete_key,
      hash: app.hash,
    },
    true
  ).pipe(
    ignoreElements(),
    catchError((e: Error) => {
      if (!e || !e.message) return throwError(e);
      const status = e.message.slice(e.message.length - 4);

      if (status === "6a83") {
        return throwError(
          new ManagerAppDepUninstallRequired("", {
            appName: app.name,
          })
        );
      }

      return throwError(e);
    })
  );
}

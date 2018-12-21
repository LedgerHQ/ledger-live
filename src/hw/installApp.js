// @flow
import { throttleTime, filter, map } from "rxjs/operators";
import type Transport from "@ledgerhq/hw-transport";
import type { Observable } from "rxjs";
import type { ApplicationVersion } from "../types/manager";
import ManagerAPI from "../api/Manager";

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
    map(e => ({ progress: e.progress })) // extract a stream of progress percentage
  );
}

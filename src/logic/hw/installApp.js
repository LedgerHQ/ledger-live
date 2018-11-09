// @flow
import type Transport from "@ledgerhq/hw-transport";
import type { Observable } from "rxjs";
import type { ApplicationVersion } from "../../types/manager";
import ManagerAPI from "../../api/Manager";

export default function installApp(
  transport: Transport<*>,
  targetId: string | number,
  app: ApplicationVersion,
): Observable<*> {
  return ManagerAPI.install(transport, "install-app", {
    targetId,
    perso: app.perso,
    deleteKey: app.delete_key,
    firmware: app.firmware,
    firmwareKey: app.firmware_key,
    hash: app.hash,
  });
}

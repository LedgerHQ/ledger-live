// @flow
import type Transport from "@ledgerhq/hw-transport";
import type { ApplicationVersion } from "../../types/manager";
import ManagerAPI from "../../api/Manager";

export default async function uninstallApp(
  transport: Transport<*>,
  targetId: string | number,
  app: ApplicationVersion,
): Promise<void> {
  const params = {
    targetId,
    perso: app.perso,
    deleteKey: app.delete_key,
    firmware: app.delete,
    firmwareKey: app.delete_key,
    hash: app.hash,
  };
  await ManagerAPI.install(transport, "uninstall-app", params).toPromise();
}

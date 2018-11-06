// @flow
import type Transport from "@ledgerhq/hw-transport";
import type { ApplicationVersion } from "../../types/manager";
import ManagerAPI from "../../api/Manager";

export default async function installApp(
  transport: Transport<*>,
  targetId: string | number,
  app: ApplicationVersion,
): Promise<void> {
  const params = {
    targetId,
    perso: app.perso,
    deleteKey: app.delete_key,
    firmware: app.firmware,
    firmwareKey: app.firmware_key,
    hash: app.hash,
  };
  await ManagerAPI.install(transport, "install-app", params).toPromise();
}

// @flow
import Transport from "@ledgerhq/hw-transport";
import type { Observable } from "rxjs";
import type { OsuFirmware } from "../types/manager";
import ManagerAPI from "../api/Manager";

export default (
  transport: typeof Transport,
  targetId: string | number,
  firmware: OsuFirmware
): Observable<*> => {
  const params = {
    targetId,
    firmware: firmware.firmware,
    perso: firmware.perso,
    firmwareKey: firmware.firmware_key,
  };
  return ManagerAPI.install(transport, "firmware", params, true);
};

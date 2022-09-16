import Transport from "@ledgerhq/hw-transport";
import type { OsuFirmware } from "@ledgerhq/types-live";
import type { Observable } from "rxjs";
import ManagerAPI from "../api/Manager";
export default (
  transport: Transport,
  targetId: string | number,
  firmware: OsuFirmware
): Observable<any> => {
  const params = {
    targetId,
    firmware: firmware.firmware,
    perso: firmware.perso,
    firmwareKey: firmware.firmware_key,
  };
  return ManagerAPI.install(transport, "firmware", params, true);
};

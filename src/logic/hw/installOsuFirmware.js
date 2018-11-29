// @flow
import type Transport from "@ledgerhq/hw-transport";
import type { Observable } from "rxjs";
import { last } from "rxjs/operators";
import type { Firmware } from "../../types/manager";
import ManagerAPI from "../../api/Manager";

export default (
  transport: Transport<*>,
  targetId: string | number,
  firmware: Firmware,
): Observable<*> => {
  const params = {
    targetId,
    ...firmware,
    firmwareKey: firmware.firmware_key,
  };
  delete params.shouldFlashMcu;
  return ManagerAPI.install(transport, "firmware", params).pipe(last());
};

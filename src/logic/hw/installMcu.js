// @flow
import type Transport from "@ledgerhq/hw-transport";
import { Observable, from } from "rxjs";
import { mergeMap } from "rxjs/operators";
import ManagerAPI from "../../api/Manager";
import getDeviceInfo from "./getDeviceInfo";

export default (transport: Transport<*>): Observable<*> =>
  from(getDeviceInfo(transport)).pipe(
    mergeMap(({ seVersion, targetId }) =>
      from(ManagerAPI.getNextMCU(seVersion)).pipe(
        mergeMap(nextVersion =>
          ManagerAPI.installMcu(transport, "mcu", {
            targetId,
            version: nextVersion.name,
          }),
        ),
      ),
    ),
  );

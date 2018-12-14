// @flow
import { from, of, empty, concat } from "rxjs";
import { concatMap, delay } from "rxjs/operators";

import ManagerAPI from "../api/Manager";
import { withDevice } from "../hw/deviceAccess";
import getDeviceInfo from "../hw/getDeviceInfo";

const wait2s = of({ type: "wait" }).pipe(delay(2000));

export default (deviceId: string) => {
  const installMCU = (version: string) =>
    withDevice(deviceId)(transport =>
      from(getDeviceInfo(transport)).pipe(
        concatMap(
          deviceInfo =>
            !deviceInfo.isBootloader
              ? empty()
              : ManagerAPI.installMcu(transport, "mcu", {
                  targetId: deviceInfo.targetId,
                  version
                })
        )
      )
    );
  return concat(installMCU("0.6"), wait2s, installMCU("1.5"));
};

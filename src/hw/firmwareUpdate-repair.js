// @flow
import { from, of, empty, concat } from "rxjs";
import { concatMap, delay } from "rxjs/operators";

import { CantOpenDevice } from "../errors";
import ManagerAPI from "../api/Manager";
import { withDevicePolling } from "../hw/deviceAccess";
import getDeviceInfo from "../hw/getDeviceInfo";

const wait2s = of({ type: "wait" }).pipe(delay(2000));

export default (deviceId: string) => {
  const loop = () =>
    withDevicePolling(deviceId)(
      transport =>
        from(getDeviceInfo(transport)).pipe(
          concatMap(deviceInfo => {
            const installMcu = (version: string) =>
              ManagerAPI.installMcu(transport, "mcu", {
                targetId: deviceInfo.targetId,
                version
              });

            if (!deviceInfo.isBootloader) return empty();

            if (deviceInfo.rawVersion === "0.9") {
              return installMcu("1.7");
            }

            if (deviceInfo.rawVersion === "0.6") {
              return installMcu("1.5");
            }

            if (deviceInfo.rawVersion === "0.0") {
              return concat(installMcu("0.6"), wait2s, loop());
            }

            return empty();
          })
        ),
      e => e instanceof CantOpenDevice // this can happen if withDevicePolling was still seeing the device but it was then interrupted by a device reboot
    );

  return loop();
};

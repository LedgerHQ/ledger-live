// @flow
import { from, of, empty, concat } from "rxjs";
import { concatMap, delay } from "rxjs/operators";
import ManagerAPI from "../../api/Manager";
import { withDevice } from "./deviceAccess";
import getDeviceInfo from "./getDeviceInfo";

const wait2s = of({ type: "wait" }).pipe(delay(2000));
export default (deviceId: string) => {
  const loop = () =>
    withDevice(deviceId)(transport =>
      from(getDeviceInfo(transport)).pipe(
        concatMap(deviceInfo => {
          const installMcu = (version: string) =>
            ManagerAPI.installMcu(transport, "mcu", {
              targetId: deviceInfo.targetId,
              version,
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
        }),
      ),
    );

  return loop();
};

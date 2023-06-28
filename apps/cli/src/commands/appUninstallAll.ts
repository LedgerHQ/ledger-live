/* eslint-disable no-console */
import { from } from "rxjs";
import { mergeMap, filter, map } from "rxjs/operators";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import getDeviceInfo from "@ledgerhq/live-common/hw/getDeviceInfo";
import { reducer, runAll } from "@ledgerhq/live-common/apps/index";
import { listApps, execWithTransport } from "@ledgerhq/live-common/apps/hw";
import { command as uninstallAllApps } from "@ledgerhq/live-common/hw/uninstallAllApps";
import { deviceOpt } from "../scan";

export default {
  description: "uninstall all apps in the device",
  args: [deviceOpt],
  job: ({
    device,
  }: Partial<{
    device: string;
  }>) =>
    withDevice(device || "")(t => {
      const exec = execWithTransport(t);
      return from(uninstallAllApps(t)).pipe(
        mergeMap((res: boolean) => {
          if (res) {
            return from(["Uninstalled using bulk mode"]);
          } else {
            return from(getDeviceInfo(t)).pipe(
              mergeMap(deviceInfo =>
                listApps(t, deviceInfo).pipe(
                  filter(e => e.type === "result"),
                  map((e: any) =>
                    reducer(e.result, {
                      type: "wipe",
                    }),
                  ),
                  mergeMap(s => runAll(s, exec)),
                ),
              ),
            );
          }
        }),
      );
    }),
};

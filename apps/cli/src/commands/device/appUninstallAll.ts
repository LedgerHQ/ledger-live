/* eslint-disable no-console */
import { from } from "rxjs";
import { mergeMap, filter, map } from "rxjs/operators";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import getDeviceInfo from "@ledgerhq/live-common/hw/getDeviceInfo";
import { reducer, runAll } from "@ledgerhq/live-common/apps/index";
import { listAppsUseCase } from "@ledgerhq/live-common/device/use-cases/listAppsUseCase";
import { execWithTransport } from "@ledgerhq/live-common/device/use-cases/execWithTransport";
import { command as uninstallAllApps } from "@ledgerhq/live-common/hw/uninstallAllApps";
import { DeviceCommonOpts, deviceOpt } from "../../scan";

export type AppsUninstallAllJobOpts = DeviceCommonOpts;

export default {
  description: "uninstall all apps in the device",
  args: [deviceOpt],
  job: ({ device }: AppsUninstallAllJobOpts) =>
    withDevice(device || "")(t => {
      const exec = execWithTransport(t);
      return from(uninstallAllApps(t)).pipe(
        mergeMap((res: boolean) => {
          if (res) {
            return from(["Uninstalled using bulk mode"]);
          } else {
            return from(getDeviceInfo(t)).pipe(
              mergeMap(deviceInfo =>
                listAppsUseCase(t, deviceInfo).pipe(
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

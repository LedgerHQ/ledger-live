/* eslint-disable no-console */
import { from } from "rxjs";
import { mergeMap, filter, map } from "rxjs/operators";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import getDeviceInfo from "@ledgerhq/live-common/hw/getDeviceInfo";
import { initState, reducer, runAll } from "@ledgerhq/live-common/apps/index";
import { listAppsUseCase } from "@ledgerhq/live-common/device/use-cases/listAppsUseCase";
import { execWithTransport } from "@ledgerhq/live-common/device/use-cases/execWithTransport";
import { DeviceCommonOpts, deviceOpt } from "../../scan";

export type AppsInstallAllJobOpts = DeviceCommonOpts;

export default {
  description: "test script to install and uninstall all apps",
  args: [deviceOpt],
  job: ({ device }: AppsInstallAllJobOpts) =>
    withDevice(device || "")(t => {
      const exec = execWithTransport(t);
      return from(getDeviceInfo(t)).pipe(
        mergeMap(deviceInfo =>
          listAppsUseCase(t, deviceInfo).pipe(
            filter(e => e.type === "result"),
            map((e: any) =>
              e.result.appsListNames.reduce(
                (s, name) =>
                  reducer(s, {
                    type: "install",
                    name,
                  }),
                initState(e.result),
              ),
            ),
            mergeMap(s => runAll(s, exec)),
          ),
        ),
      );
    }),
};

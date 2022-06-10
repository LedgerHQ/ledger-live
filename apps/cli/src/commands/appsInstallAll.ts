/* eslint-disable no-console */
import { from } from "rxjs";
import { mergeMap, filter, map } from "rxjs/operators";
import { withDevice } from "@ledgerhq/live-common/lib/hw/deviceAccess";
import getDeviceInfo from "@ledgerhq/live-common/lib/hw/getDeviceInfo";
import { initState, reducer, runAll } from "@ledgerhq/live-common/lib/apps";
import { listApps, execWithTransport } from "@ledgerhq/live-common/lib/apps/hw";
import { deviceOpt } from "../scan";
export default {
  description: "test script to install and uninstall all apps",
  args: [deviceOpt],
  job: ({
    device,
  }: Partial<{
    device: string;
  }>) =>
    withDevice(device || "")((t) => {
      const exec = execWithTransport(t);
      return from(getDeviceInfo(t)).pipe(
        mergeMap((deviceInfo) =>
          listApps(t, deviceInfo).pipe(
            filter((e) => e.type === "result"),
            map((e: any) =>
              e.result.appsListNames.reduce(
                (s, name) =>
                  reducer(s, {
                    type: "install",
                    name,
                  }),
                initState(e.result)
              )
            ),
            mergeMap((s) => runAll(s, exec))
          )
        )
      );
    }),
};

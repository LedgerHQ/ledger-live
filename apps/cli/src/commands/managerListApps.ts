import { from } from "rxjs";
import { filter, map, mergeMap } from "rxjs/operators";
import { withDevice } from "@ledgerhq/live-common/lib/hw/deviceAccess";
import getDeviceInfo from "@ledgerhq/live-common/lib/hw/getDeviceInfo";
import { listApps } from "@ledgerhq/live-common/lib/apps/hw";
import { deviceOpt } from "../scan";
export default {
  description: "List apps that can be installed on the device",
  args: [
    deviceOpt,
    {
      name: "format",
      alias: "f",
      type: String,
      typeDesc: "raw | json | default",
    },
  ],
  job: ({
    device,
    format,
  }: Partial<{
    device: string;
    format: string;
  }>) =>
    withDevice(device || "")((t) =>
      from(getDeviceInfo(t)).pipe(
        mergeMap((deviceInfo) =>
          listApps(t, deviceInfo).pipe(
            filter((e) => e.type === "result"),
            // @ts-expect-error we need better typings and safe guard to infer types
            map((e) => e.result)
          )
        ),
        map((r) =>
          format === "raw"
            ? r
            : format === "json"
            ? JSON.stringify(r)
            : r.appsListNames
                .map((name) => {
                  const item = r.appByName[name];
                  const ins = r.installed.find((i) => i.name === item.name);
                  return (
                    `- ${item.name} ${item.version}` +
                    (ins ? (ins.updated ? " (installed)" : " (outdated!)") : "")
                  );
                })
                .join("\n")
        )
      )
    ),
};

import { from } from "rxjs";
import { filter, map, mergeMap, repeat } from "rxjs/operators";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import getDeviceInfo from "@ledgerhq/live-common/hw/getDeviceInfo";
import { enableListAppsV2, listApps } from "@ledgerhq/live-common/apps/hw";
import { deviceOpt } from "../scan";
export default {
  description: "List apps that can be installed on the device",
  args: [
    deviceOpt,
    {
      name: "benchmark",
      alias: "b",
      type: Boolean,
      default: false,
      typeDesc: "if true, it will run 5 times for benchmarking and cache",
    },
    {
      name: "format",
      alias: "f",
      type: String,
      typeDesc: "raw | json | default",
    },
    {
      name: "v2",
      type: Boolean,
      typeDesc: "use v2 instead of v1",
    },
  ],
  job: ({
    device,
    format,
    benchmark,
    v2,
  }: Partial<{
    device: string;
    format: string;
    benchmark: boolean;
    v2: boolean;
  }>) => {
    if (benchmark) console.log("Running the whole thing 5 times to have cache and averages.");
    enableListAppsV2(!!v2);

    return withDevice(device || "")(t =>
      from(getDeviceInfo(t)).pipe(
        mergeMap(deviceInfo =>
          listApps(t, deviceInfo).pipe(
            filter(e => e.type === "result"),
            // @ts-expect-error we need better typings and safe guard to infer types
            map(e => e.result),
            repeat(benchmark ? 5 : 1),
          ),
        ),
        map(r =>
          format === "raw"
            ? r
            : format === "json"
            ? JSON.stringify(r)
            : r.appsListNames
                .map(name => {
                  const item = r.appByName[name];
                  const ins = r.installed.find(i => i.name === item.name);
                  return (
                    `- ${item.name} ${item.version}` +
                    (ins ? (ins.updated ? " (installed)" : " (outdated!)") : "")
                  );
                })
                .join("\n"),
        ),
      ),
    );
  },
};

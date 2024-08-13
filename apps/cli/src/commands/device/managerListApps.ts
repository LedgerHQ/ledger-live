import { from } from "rxjs";
import { filter, map, mergeMap, repeat } from "rxjs/operators";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import getDeviceInfo from "@ledgerhq/live-common/hw/getDeviceInfo";
import { listAppsUseCase } from "@ledgerhq/live-common/device/use-cases/listAppsUseCase";
import { deviceOpt } from "../../scan";
import { ListAppsEvent, ListAppsResult } from "@ledgerhq/live-common/apps/types";

function isResultEvent(event: ListAppsEvent): event is { type: "result"; result: ListAppsResult } {
  return event.type === "result";
}
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
  ],
  job: ({
    device,
    format,
    benchmark,
  }: Partial<{
    device: string;
    format: string;
    benchmark: boolean;
  }>) => {
    if (benchmark) console.log("Running the whole thing 5 times to have cache and averages.");

    return withDevice(device || "")(t =>
      from(getDeviceInfo(t)).pipe(
        mergeMap(deviceInfo =>
          listAppsUseCase(t, deviceInfo).pipe(
            filter(isResultEvent),
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

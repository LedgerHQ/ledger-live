import { from, concat, defer, Observable } from "rxjs";
import { mergeMap, filter, map, ignoreElements } from "rxjs/operators";
import { withDevice } from "@ledgerhq/live-common/lib/hw/deviceAccess";
import getDeviceInfo from "@ledgerhq/live-common/lib/hw/getDeviceInfo";
import {
  initState,
  ListAppsResult,
  reducer,
  runAll,
} from "@ledgerhq/live-common/lib/apps";
import ManagerAPI from "@ledgerhq/live-common/lib/api/Manager";
import { listApps, execWithTransport } from "@ledgerhq/live-common/lib/apps/hw";
import installApp from "@ledgerhq/live-common/lib/hw/installApp";
import { deviceOpt } from "../scan";
import { Application } from "@ledgerhq/live-common/lib/types/manager";
type Scenario = number[];
// how to add a scenario:
// wget https://manager.api.live.ledger.com/api/applications
// then find in that json the apps you are looking for (with a provider 1)
// with JS: obj.flatMap(a => a.application_versions).filter(a => a.version==="1.3.16" && a.providers.includes(1))
// array of applicationversion ids
const scenarios: Record<string, Scenario> = {
  "nanos160-outdated-apps": [1679, 222, 2783, 3295, 3305],
  "nanos160-outdated-bitcoin-apps": [
    3295, 3305, 3319, 3325, 3302, 3324, 3298, 3297, 3318, 3309, 3322, 3304,
    3296, 3308, 3299, 3300, 3312, 3303, 3301, 3315, 3314, 3323,
  ],
};
const scenariosValues = Object.keys(scenarios).join(" | ");

const installScenario = (apps, transport, deviceInfo, scene) => {
  const appVersionsPerId = {};
  apps.forEach((a) =>
    a.application_versions.forEach((av) => {
      appVersionsPerId[av.id] = av;
    })
  );
  return concat(
    ...scene
      .map((id) => appVersionsPerId[id])
      .filter(Boolean)
      .map((app) =>
        defer(() => installApp(transport, deviceInfo.targetId, app))
      )
  );
};

export default {
  description: "dev feature to enter into a specific device apps scenario",
  args: [
    deviceOpt,
    {
      name: "scenario",
      alias: "s",
      type: String,
      desc: scenariosValues,
    },
  ],
  job: ({
    device,
    scenario,
  }: Partial<{
    device: string;
    scenario: keyof typeof scenarios;
  }>) =>
    withDevice(device || "")((t) => {
      const scene = scenarios[scenario || ""];
      if (!scene)
        throw new Error(
          "scenario is not found. available --scenario are: " + scenariosValues
        );
      const exec = execWithTransport(t);
      // $FlowFixMe
      return from(getDeviceInfo(t)).pipe(
        mergeMap((deviceInfo) =>
          listApps(t, deviceInfo).pipe(
            filter<any>((e) => e.type === "result"),
            map<{ type: "result"; result: ListAppsResult }, ListAppsResult>(
              (e) => e.result
            ),
            mergeMap<ListAppsResult, Observable<Application[]>>(
              (listAppsResult) => {
                const s = reducer(initState(listAppsResult), {
                  type: "wipe",
                });
                return concat(
                  runAll(s, exec).pipe(ignoreElements()),
                  from(ManagerAPI.listApps())
                );
              }
            ),
            mergeMap((apps) => installScenario(apps, t, deviceInfo, scene))
          )
        )
      );
    }),
};

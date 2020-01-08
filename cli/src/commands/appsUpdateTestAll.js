/* eslint-disable no-console */
// @flow

import { from, of } from "rxjs";
import { mergeMap, ignoreElements, filter, map } from "rxjs/operators";
import { withDevice } from "@ledgerhq/live-common/lib/hw/deviceAccess";
import getDeviceInfo from "@ledgerhq/live-common/lib/hw/getDeviceInfo";
import {
  initState,
  reducer,
  runAll,
  getActionPlan
} from "@ledgerhq/live-common/lib/apps";
import { listApps, execWithTransport } from "@ledgerhq/live-common/lib/apps/hw";
import type { AppOp } from "@ledgerhq/live-common/lib/apps/types";
import { deviceOpt } from "../scan";

const prettyActionPlan = (ops: AppOp[]) =>
  ops.map(op => (op.type === "install" ? "+" : "-") + op.name).join(", ");

export default {
  description: "test script to install and uninstall all apps",
  args: [deviceOpt, { name: "index", type: Number }],
  job: ({ device, index }: $Shape<{ device: string, index: number }>) =>
    withDevice(device || "")(t => {
      const exec = execWithTransport(t);
      // $FlowFixMe
      return from(getDeviceInfo(t)).pipe(
        mergeMap(deviceInfo =>
          listApps(t, deviceInfo).pipe(
            filter(e => e.type === "result"),
            map(e => e.result)
          )
        ),
        mergeMap(listAppsResult => {
          return listAppsResult.appsListNames.slice(index || 0).reduce(
            ($state, name) =>
              $state.pipe(
                mergeMap(s => {
                  if (s.currentError) {
                    console.error(
                      "FAILED " +
                        s.currentError.appOp.type +
                        " " +
                        s.currentError.appOp.name +
                        ": " +
                        String(s.currentError.error)
                    );
                  }
                  console.log(
                    "on device: " +
                      s.installed
                        .map(i => i.name + (!i.updated ? " (outdated)" : ""))
                        .join(", ")
                  );
                  s = reducer(s, { type: "wipe" });
                  console.log(
                    "wipe action plan = " + prettyActionPlan(getActionPlan(s))
                  );
                  return runAll(s, exec);
                }),
                mergeMap(s => {
                  s = reducer(s, { type: "install", name });
                  console.log(
                    "install '" +
                      name +
                      "' action plan = " +
                      prettyActionPlan(getActionPlan(s))
                  );
                  return runAll(s, exec);
                })
              ),
            of(initState(listAppsResult))
          );
        }),
        ignoreElements()
      );
    })
};

/* eslint-disable no-console */
// @flow

import { from, of } from "rxjs";
import { mergeMap, ignoreElements } from "rxjs/operators";
import { withDevice } from "@ledgerhq/live-common/lib/hw/deviceAccess";
import getDeviceInfo from "@ledgerhq/live-common/lib/hw/getDeviceInfo";
import listApps from "@ledgerhq/live-common/lib/apps/list";
import type { AppOp } from "@ledgerhq/live-common/lib/apps/types";
import { initState, reducer } from "@ledgerhq/live-common/lib/apps/logic";
import { runAll, getActionPlan } from "@ledgerhq/live-common/lib/apps/runner";
import { execWithTransport } from "@ledgerhq/live-common/lib/apps/hw";
import { deviceOpt } from "../scan";

const prettyActionPlan = (ops: AppOp[]) =>
  ops.map(op => (op.type === "install" ? "+" : "-") + op.name).join(", ");

export default {
  description: "test script to install and uninstall all apps",
  args: [deviceOpt, { name: "index", type: Number }],
  job: ({ device, index }: $Shape<{ device: string, index: number }>) =>
    withDevice(device || "")(t => {
      const exec = execWithTransport(t);
      return from(getDeviceInfo(t)).pipe(
        mergeMap(deviceInfo => from(listApps(t, deviceInfo))),
        mergeMap(listAppsResult => {
          return listAppsResult.apps.slice(index || 0).reduce(
            ($state, app) =>
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
                  s = reducer(s, { type: "install", name: app.name });
                  console.log(
                    "install '" +
                      app.name +
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

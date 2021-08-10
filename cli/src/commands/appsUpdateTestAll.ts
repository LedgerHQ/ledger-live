/* eslint-disable no-console */
import { from, of, Observable } from "rxjs";
import { mergeMap, ignoreElements, filter, map } from "rxjs/operators";
import { withDevice } from "@ledgerhq/live-common/lib/hw/deviceAccess";
import getDeviceInfo from "@ledgerhq/live-common/lib/hw/getDeviceInfo";
import {
  initState,
  reducer,
  runAll,
  getActionPlan,
} from "@ledgerhq/live-common/lib/apps";
import { listApps, execWithTransport } from "@ledgerhq/live-common/lib/apps/hw";
import type { AppOp } from "@ledgerhq/live-common/lib/apps/types";
import { deviceOpt } from "../scan";

const prettyActionPlan = (ops: AppOp[]) =>
  ops.map((op) => (op.type === "install" ? "+" : "-") + op.name).join(", ");

export default {
  description: "test script to install and uninstall all apps",
  args: [
    deviceOpt,
    {
      name: "index",
      type: Number,
    },
  ],
  job: ({
    device,
    index,
  }: Partial<{
    device: string;
    index: number;
  }>) =>
    withDevice(device || "")((t) => {
      const exec = execWithTransport(t);
      // $FlowFixMe
      return from(getDeviceInfo(t)).pipe(
        // FIXME: mergeMap deprecated, using map inside pipe should do the work
        map(
          (deviceInfo) =>
            listApps(t, deviceInfo).pipe(
              filter((e) => e.type === "result"),
              map((e: any) => e.result),
              mergeMap((listAppsResult) => {
                return listAppsResult.appsListNames.slice(index || 0).reduce(
                  ($state, name) =>
                    $state.pipe(
                      mergeMap((s: any) => {
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
                              .map(
                                (i) =>
                                  i.name + (!i.updated ? " (outdated)" : "")
                              )
                              .join(", ")
                        );
                        s = reducer(s, {
                          type: "wipe",
                        });
                        console.log(
                          "wipe action plan = " +
                            prettyActionPlan(getActionPlan(s))
                        );
                        return runAll(s, exec);
                      }),
                      mergeMap((s) => {
                        s = reducer(s as any, {
                          type: "install",
                          name,
                        });
                        console.log(
                          "install '" +
                            name +
                            "' action plan = " +
                            prettyActionPlan(getActionPlan(s as any))
                        );
                        return runAll(s as any, exec);
                      }),
                      mergeMap((state) =>
                        new Observable((o) => {
                          let sub;
                          const timeout = setTimeout(() => {
                            sub = listApps(t, deviceInfo).subscribe(o);
                          }, 4000);
                          return () => {
                            clearTimeout(timeout);
                            if (sub) sub.unsubscribe();
                          };
                        }).pipe(
                          filter((e: any) => e.type === "result"),
                          map((e) => e.result),
                          map((results) => {
                            const app = results.installed.find(
                              (a) => a.name === name
                            );

                            if (!app) {
                              throw new Error(
                                "after install " +
                                  name +
                                  ", app is not visible on listApps"
                              );
                            }

                            if (app && !app.updated) {
                              throw new Error(
                                "after install " +
                                  name +
                                  ", app hash is not matching latest one. Got " +
                                  app.hash
                              );
                            }

                            // continue with state
                            return state;
                          })
                        )
                      )
                    ),
                  of(initState(listAppsResult))
                );
              })
            ),
          ignoreElements()
        )
      );
    }),
};

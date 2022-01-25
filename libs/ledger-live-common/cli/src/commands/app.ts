import { from, concat } from "rxjs";
import { map, mergeMap, ignoreElements } from "rxjs/operators";
import manager from "@ledgerhq/live-common/lib/manager";
import type { DeviceInfo } from "@ledgerhq/live-common/lib/types/manager";
import { withDevice } from "@ledgerhq/live-common/lib/hw/deviceAccess";
import getDeviceInfo from "@ledgerhq/live-common/lib/hw/getDeviceInfo";
import openApp from "@ledgerhq/live-common/lib/hw/openApp";
import quitApp from "@ledgerhq/live-common/lib/hw/quitApp";
import installApp from "@ledgerhq/live-common/lib/hw/installApp";
import uninstallApp from "@ledgerhq/live-common/lib/hw/uninstallApp";
import { deviceOpt, inferManagerApp } from "../scan";
export default {
  description: "Manage Ledger device's apps",
  args: [
    deviceOpt,
    {
      name: "verbose",
      alias: "v",
      type: Boolean,
      desc: "enable verbose logs",
    },
    {
      name: "install",
      alias: "i",
      type: String,
      desc: "install an application by its name",
      multiple: true,
    },
    {
      name: "uninstall",
      alias: "u",
      type: String,
      desc: "uninstall an application by its name",
      multiple: true,
    },
    {
      name: "open",
      alias: "o",
      type: String,
      desc: "open an application by its display name",
    },
    {
      name: "debug",
      type: String,
      desc: "get information of an application by its name",
    },
    {
      name: "quit",
      alias: "q",
      type: Boolean,
      desc: "close current application",
    },
  ],
  job: ({
    device,
    verbose,
    install,
    uninstall,
    open,
    quit,
    debug,
  }: Partial<{
    device: string;
    verbose: boolean;
    install: string[];
    uninstall: string[];
    open: string;
    quit: string;
    debug: string;
  }>) =>
    withDevice(device || "")((t) => {
      if (quit) return from(quitApp(t));
      if (open) return from(openApp(t, inferManagerApp(open)));
      if (debug)
        return from(getDeviceInfo(t)).pipe(
          mergeMap((deviceInfo: DeviceInfo) =>
            from(manager.getAppsList(deviceInfo, true)).pipe(
              mergeMap((list) => {
                const app = list.find(
                  (item) =>
                    item.name.toLowerCase() ===
                    inferManagerApp(debug).toLowerCase()
                );

                if (!app) {
                  throw new Error("application '" + debug + "' not found");
                }

                return [app];
              })
            )
          )
        );
      return from(getDeviceInfo(t)).pipe(
        mergeMap((deviceInfo: DeviceInfo) =>
          from(manager.getAppsList(deviceInfo, true)).pipe(
            mergeMap((list) =>
              concat(
                ...(uninstall || []).map((application) => {
                  const { targetId } = deviceInfo;
                  const app = list.find(
                    (item) =>
                      item.name.toLowerCase() ===
                      inferManagerApp(application).toLowerCase()
                  );

                  if (!app) {
                    throw new Error(
                      "application '" + application + "' not found"
                    );
                  }

                  return uninstallApp(t, targetId, app);
                }),
                ...(install || []).map((application) => {
                  const { targetId } = deviceInfo;
                  const app = list.find(
                    (item) =>
                      item.name.toLowerCase() ===
                      inferManagerApp(application).toLowerCase()
                  );

                  if (!app) {
                    throw new Error(
                      "application '" + application + "' not found"
                    );
                  }

                  return installApp(t, targetId, app);
                })
              )
            )
          )
        ),
        verbose ? map((a) => a) : ignoreElements()
      );
    }),
};

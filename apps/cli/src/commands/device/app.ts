import { from, concat } from "rxjs";
import { map, mergeMap, ignoreElements } from "rxjs/operators";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import getDeviceInfo from "@ledgerhq/live-common/hw/getDeviceInfo";
import openApp from "@ledgerhq/live-common/hw/openApp";
import quitApp from "@ledgerhq/live-common/hw/quitApp";
import installApp from "@ledgerhq/live-common/hw/installApp";
import uninstallApp from "@ledgerhq/live-common/hw/uninstallApp";
import { getAppsCatalogForDevice } from "@ledgerhq/live-common/device/use-cases/getAppsCatalogForDevice";
import { mapApplicationV2ToApp } from "@ledgerhq/live-common/apps/polyfill";
import { DeviceCommonOpts, deviceOpt, inferManagerApp } from "../../scan";
import type { DeviceInfo } from "@ledgerhq/types-live";

export type AppJobOpts = DeviceCommonOpts &
  Partial<{
    verbose: boolean;
    install: string[];
    uninstall: string[];
    open: string;
    quit: string;
    debug: string;
  }>;

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
  job: ({ device, verbose, install, uninstall, open, quit, debug }: AppJobOpts) =>
    withDevice(device || "")(t => {
      if (quit) return from(quitApp(t));
      if (open) return from(openApp(t, inferManagerApp(open)));
      if (debug)
        return from(getDeviceInfo(t)).pipe(
          mergeMap((deviceInfo: DeviceInfo) =>
            from(getAppsCatalogForDevice(deviceInfo)).pipe(
              mergeMap(list => {
                const app = list.find(
                  item => item.versionName.toLowerCase() === inferManagerApp(debug).toLowerCase(),
                );

                if (!app) {
                  throw new Error("application '" + debug + "' not found");
                }

                return [app];
              }),
            ),
          ),
        );
      return from(getDeviceInfo(t)).pipe(
        mergeMap((deviceInfo: DeviceInfo) =>
          from(getAppsCatalogForDevice(deviceInfo)).pipe(
            mergeMap(v2List =>
              concat(
                ...(uninstall || []).map(application => {
                  const { targetId } = deviceInfo;
                  const list = v2List.map(mapApplicationV2ToApp);
                  const app = list.find(
                    item => item.name.toLowerCase() === inferManagerApp(application).toLowerCase(),
                  );

                  if (!app) {
                    throw new Error("application '" + application + "' not found");
                  }

                  return uninstallApp(t, targetId, app);
                }),
                ...(install || []).map(application => {
                  const { targetId } = deviceInfo;
                  const list = v2List.map(mapApplicationV2ToApp);
                  const app = list.find(
                    item => item.name.toLowerCase() === inferManagerApp(application).toLowerCase(),
                  );

                  if (!app) {
                    throw new Error("application '" + application + "' not found");
                  }

                  return installApp(t, targetId, app);
                }),
              ),
            ),
          ),
        ),
        verbose ? map(a => a) : ignoreElements(),
      );
    }),
};

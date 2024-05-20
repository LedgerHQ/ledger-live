// Ledger internal speculos testing framework.
// loading this file have side effects and is only for Node.
import sample from "lodash/sample";
import invariant from "invariant";
import path from "path";
import semver from "semver";
import { promises as fsp } from "fs";
import { log } from "@ledgerhq/logs";
import type { DeviceModelId } from "@ledgerhq/devices";
import type { AppCandidate } from "@ledgerhq/coin-framework/bot/types";
import { registerTransportModule } from "../hw";
import { getEnv } from "@ledgerhq/live-env";
import { getDependencies } from "../apps/polyfill";
import { findCryptoCurrencyByKeyword } from "../currencies";
import { formatAppCandidate } from "../bot/formatters";
import { mustUpgrade, shouldUpgrade } from "../apps";

import {
  closeAllSpeculosDevices,
  releaseSpeculosDevice,
  createSpeculosDevice,
  getMemorySpeculosDeviceInternal,
  modelMap,
} from "@ledgerhq/speculos-transport";
import type { SpeculosTransport } from "@ledgerhq/speculos-transport";

export { closeAllSpeculosDevices, releaseSpeculosDevice, createSpeculosDevice };
export type { SpeculosTransport };

const modelMapPriority: Record<string, number> = {
  nanos: 4,
  "nanos+": 3,
  nanox: 2,
  blue: 1,
};
const defaultFirmware: Record<string, string> = {};

function hackBadSemver(str) {
  const split = str.split(".");
  const [x, y, , ...rest] = split;
  let [, , z] = split;

  if (rest.length) {
    z += "-" + rest.join("-");
  }

  return [x, y, z].filter(Boolean).join(".");
}

// list all possible apps. sorted by latest first
export async function listAppCandidates(cwd: string): Promise<AppCandidate[]> {
  let candidates: AppCandidate[] = [];
  const models = <string[]>(await fsp.readdir(cwd))
    .map(modelName => [modelName, modelMapPriority[modelName.toLowerCase()]])
    .filter(([, priority]) => priority)
    .sort((a, b) => <number>b[1] - <number>a[1])
    .map(a => a[0]);

  for (const modelName of models) {
    const model = modelMap[modelName.toLowerCase()];
    const p1 = path.join(cwd, modelName);
    const firmwares = await fsp.readdir(p1);
    firmwares.sort((a, b) => semver.compare(hackBadSemver(a), hackBadSemver(b)));
    firmwares.reverse();

    for (const firmware of firmwares) {
      const p2 = path.join(p1, firmware);
      const appNames = await fsp.readdir(p2);

      for (const appName of appNames) {
        const p3 = path.join(p2, appName);
        const elfs = await fsp.readdir(p3);
        const c: AppCandidate[] = [];

        for (const elf of elfs) {
          if (elf.startsWith("app_") && elf.endsWith(".elf")) {
            const p4 = path.join(p3, elf);
            const appVersion = elf.slice(4, elf.length - 4);
            if (
              semver.valid(appVersion) &&
              !shouldUpgrade(appName, appVersion) &&
              !mustUpgrade(appName, appVersion)
            ) {
              c.push({
                path: p4,
                model,
                firmware,
                appName,
                appVersion,
              });
            }
          }
        }

        c.sort((a, b) => semver.compare(a.appVersion, b.appVersion));
        c.reverse();
        candidates = candidates.concat(c);
      }
    }
  }

  return candidates;
}
export type AppSearch = {
  model?: DeviceModelId;
  firmware?: string;
  appName?: string;
  appVersion?: string;
};

export function appCandidatesMatches(appCandidate: AppCandidate, search: AppSearch): boolean {
  const searchFirmware = search.firmware || defaultFirmware[appCandidate.model];
  return !!(
    (!search.model || search.model === appCandidate.model) &&
    (!search.appName ||
      search.appName.replace(/ /g, "").toLowerCase() ===
        appCandidate.appName.replace(/ /g, "").toLowerCase()) &&
    ((!searchFirmware && !appCandidate.firmware.includes("rc")) ||
      appCandidate.firmware === searchFirmware ||
      (searchFirmware && semver.satisfies(hackBadSemver(appCandidate.firmware), searchFirmware))) &&
    (appCandidate.appVersion === search.appVersion ||
      (!search.appVersion && !appCandidate.appVersion.includes("-")) ||
      (search.appVersion && semver.satisfies(appCandidate.appVersion, search.appVersion)))
  );
}
export const findAppCandidate = (
  appCandidates: AppCandidate[],
  search: AppSearch,
  picker: (arg0: AppCandidate[]) => AppCandidate = sample,
): AppCandidate | null | undefined => {
  let apps = appCandidates.filter(c => appCandidatesMatches(c, search));

  if (!search.appVersion && apps.length > 0) {
    const appVersion = apps[0].appVersion;
    apps = apps.filter(a => a.appVersion === appVersion);
  }

  const app = picker(apps);

  if (apps.length > 1) {
    log(
      "speculos",
      apps.length +
        " app candidates (out of " +
        appCandidates.length +
        "):\n" +
        apps.map((a, i) => " [" + i + "] " + formatAppCandidate(a)).join("\n"),
    );
  }

  return app;
};

function eatDevice(parts: string[]): {
  model?: DeviceModelId;
  firmware?: string;
} {
  if (parts.length > 0) {
    const [modelQ, firmware] = parts[0].split("@");
    const model: DeviceModelId = modelMap[(modelQ || "").toLowerCase()];

    if (model) {
      parts.shift();

      if (firmware) {
        return {
          model,
          firmware,
        };
      }

      return {
        model,
      };
    }
  }

  return {};
}

function parseAppSearch(query: string):
  | {
      search: AppSearch;
      appName: string;
      dependency: string | void;
    }
  | null
  | undefined {
  const parts = query.slice(9).split(":");
  const { model, firmware } = eatDevice(parts);
  if (parts.length === 0) return;
  const [nameQ, versionQ] = parts[0].split("@");
  const currency = findCryptoCurrencyByKeyword(nameQ);
  const appName = currency ? currency.managerAppName : nameQ;
  const appVersion = versionQ || undefined;
  let dependency;

  if (currency) {
    dependency = getDependencies(currency.managerAppName)[0]?.replace(/ /g, "");
  }

  return {
    search: {
      model,
      firmware,
      appName,
      appVersion,
    },
    appName,
    dependency,
  };
}

export async function createImplicitSpeculos(query: string): Promise<{
  device: {
    transport: SpeculosTransport;
    id: string;
  };
  appCandidate: AppCandidate;
} | null> {
  const coinapps = getEnv("COINAPPS");
  invariant(coinapps, "COINAPPS folder is missing!");
  const seed = getEnv("SEED");
  invariant(seed, "SEED is missing!");
  const apps = await listAppCandidates(coinapps);
  const match = parseAppSearch(query);
  invariant(
    match,
    "speculos: invalid format of '%s'. Usage example: speculos:nanoS:bitcoin@1.3.x",
    query,
  );
  const { search, dependency, appName } = <
    {
      search: AppSearch;
      appName: string;
      dependency: string | undefined;
    }
  >match;

  const appCandidate = findAppCandidate(apps, search);
  invariant(appCandidate, "could not find an app that matches '%s'", query);
  log("speculos", "using app " + formatAppCandidate(appCandidate as AppCandidate));
  return appCandidate
    ? {
        device: await createSpeculosDevice({
          ...appCandidate,
          coinapps,
          appName,
          dependency,
          seed,
        }),
        appCandidate,
      }
    : null;
}

async function openImplicitSpeculos(query: string) {
  const r = await createImplicitSpeculos(query);
  return r?.device.transport;
}

registerTransportModule({
  id: "speculos",
  open: (id): Promise<any> | null | undefined => {
    if (!id) return;

    if (id.startsWith("speculosID")) {
      const obj = getMemorySpeculosDeviceInternal(id);

      if (!obj) {
        throw new Error("speculos transport was destroyed");
      }

      return Promise.resolve(obj.transport);
    }

    if (id.startsWith("speculos:")) {
      return openImplicitSpeculos(id);
    }
  },
  close: (transport, id) => {
    if (id.startsWith("speculos")) {
      return Promise.resolve();
    } // todo close the speculos: case
  },
  disconnect: releaseSpeculosDevice,
});

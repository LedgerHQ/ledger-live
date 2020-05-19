// @flow
// Ledger internal speculos testing framework.
// loading this file have side effects and is only for Node.

import path from "path";
import semver from "semver";
import { spawn, exec } from "child_process";
import { promises as fsp } from "fs";
import invariant from "invariant";
import { log } from "@ledgerhq/logs";
import SpeculosTransport from "@ledgerhq/hw-transport-node-speculos";
import type { DeviceModelId } from "@ledgerhq/devices";
import { registerTransportModule } from "../hw";

let idCounter = 0;
const data = {};

export function releaseSpeculosDevice(id: ?string) {
  if (!id) return;
  const obj = data[id];
  if (obj) obj.destroy();
}

export type AppCandidate = {
  path: string,
  model: DeviceModelId,
  firmware: string,
  appName: string,
  appVersion: string,
};

const modelMap: { [_: string]: DeviceModelId } = {
  blue: "blue",
  nanox: "nanoX",
  nanos: "nanoS",
};

function hackBadSemver(str) {
  let [x, y, z, ...rest] = str.split(".");
  if (rest.length) {
    z += "-" + rest.join("-");
  }
  return [x, y, z].filter(Boolean).join(".");
}

// list all possible apps. sorted by latest first
export async function listAppCandidates(cwd: string): Promise<AppCandidate[]> {
  let candidates = [];
  const models = await fsp.readdir(cwd);
  for (const modelName of models) {
    const model = modelMap[modelName.toLowerCase()];
    if (!model) continue;
    const p1 = path.join(cwd, modelName);
    const firmwares = await fsp.readdir(p1);
    firmwares.sort((a, b) =>
      semver.compare(hackBadSemver(a), hackBadSemver(b))
    );
    firmwares.reverse();
    for (const firmware of firmwares) {
      const p2 = path.join(p1, firmware);
      const appNames = await fsp.readdir(p2);
      for (const appName of appNames) {
        const p3 = path.join(p2, appName);
        const elfs = await fsp.readdir(p3);
        const c = [];
        for (const elf of elfs) {
          if (elf.startsWith("app_") && elf.endsWith(".elf")) {
            const p4 = path.join(p3, elf);
            const appVersion = elf.slice(4, elf.length - 4);
            if (semver.valid(appVersion)) {
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
  model: DeviceModelId,
  firmware: string,
  appName: string,
  appVersion: string,
};

export function appCandidatesMatches(
  appCandidate: AppCandidate,
  search: $Shape<AppSearch>
): boolean {
  return (
    (!search.model || search.model === appCandidate.model) &&
    (!search.appName || search.appName === appCandidate.appName) &&
    (!search.firmware ||
      appCandidate.firmware === search.firmware ||
      semver.satisfies(
        hackBadSemver(appCandidate.firmware),
        search.firmware
      )) &&
    (!search.appVersion ||
      semver.satisfies(appCandidate.appVersion, search.appVersion))
  );
}

export const findAppCandidate = (
  appCandidates: AppCandidate[],
  search: $Shape<AppSearch>
): ?AppCandidate => appCandidates.find((c) => appCandidatesMatches(c, search));

export async function createSpeculosDevice({
  model,
  firmware,
  appName,
  appVersion,
  seed,
  coinapps,
  dependency,
}: {
  model: DeviceModelId,
  firmware: string,
  appName: string,
  appVersion: string,
  dependency?: string,
  seed: string,
  // Folder where we have app binaries
  coinapps: string,
}): Promise<{
  transport: SpeculosTransport,
  id: string,
}> {
  invariant(model === "nanoS", "only model=nanoS supported");
  invariant(firmware === "1.6.0", "only firmware=1.6.0 supported");

  const id = `speculos-${++idCounter}`;

  const apduPort = 40000 + idCounter;
  const vncPort = 41000 + idCounter;
  const buttonPort = 42000 + idCounter;
  const automationPort = 43000 + idCounter;

  log("speculos", "spawning with apdu=" + apduPort + " button=" + buttonPort);

  const p = spawn("docker", [
    "run",
    "-v",
    `${coinapps}:/speculos/apps`,
    "-p",
    `${apduPort}:40000`,
    "-p",
    `${vncPort}:41000`,
    "-p",
    `${buttonPort}:42000`,
    "-p",
    `${automationPort}:43000`,
    "-e",
    `SPECULOS_APPNAME=${appName}:${appVersion}`,
    "--name",
    `${id}`,
    "ledgerhq/speculos",
    "--model",
    model.toLowerCase(),
    `./apps/${model.toLowerCase()}/${firmware}/${appName}/app_${appVersion}.elf`,
    ...(dependency
      ? [
          "-l",
          `${dependency}:${`./apps/${model.toLowerCase()}/${firmware}/${dependency}/app_${appVersion}.elf`}`,
        ]
      : []),
    "--sdk",
    "1.6",
    "--seed",
    `${seed}`,
    "--display",
    "headless",
    "--vnc-password",
    "live",
    "--apdu-port",
    "40000",
    "--vnc-port",
    "41000",
    "--button-port",
    "42000",
    "--automation-port",
    "43000",
  ]);

  let resolveReady;
  let rejectReady;
  const ready = new Promise((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
  });

  p.stdout.on("data", (data) => {
    log("speculos", data);
  });

  p.stderr.on("data", (data) => {
    if (data.includes("using SDK")) {
      resolveReady();
    }
    if (process.env.VERBOSE) console.error(`${id}: ${data}`);
  });

  const destroy = () => {
    exec(`docker rm -f ${id}`, (error, stdout, stderr) => {
      if (error) {
        log("speculos", `ERROR: could not destroy ${id}: ${error} ${stderr}`);
      } else {
        log("speculos", `destroyed ${id}`);
      }
    });
    delete data[id];
  };

  p.on("close", () => {
    destroy();
    rejectReady(new Error("closed"));
  });

  await ready;

  const transport = await SpeculosTransport.open({
    apduPort,
    buttonPort,
    automationPort,
  });

  data[id] = {
    process: p,
    apduPort,
    buttonPort,
    automationPort,
    transport,
    destroy,
  };

  return { id, transport };
}

registerTransportModule({
  id: "speculos",
  open: (id): ?Promise<any> => {
    if (id.startsWith("speculos")) {
      const obj = data[id];
      if (!obj) {
        throw new Error("speculos transport was destroyed");
      }
      return Promise.resolve(obj.transport);
    }
  },
  close: (transport, id) => {
    if (id.startsWith("speculos")) {
      return Promise.resolve();
    }
  },
  disconnect: (deviceId) => {
    const obj = data[deviceId];
    if (obj) obj.destroy();
  },
});

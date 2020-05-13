// @flow
// Ledger internal speculos testing framework.
// loading this file have side effects and is only for Node.

import { spawn, exec } from "child_process";
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
  coinapps: string
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

  const p = spawn("/usr/local/bin/docker", [
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
    exec(`/usr/local/bin/docker rm -f ${id}`);
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

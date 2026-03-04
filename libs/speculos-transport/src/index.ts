import { spawn, exec, ChildProcessWithoutNullStreams } from "child_process";
import { createServer } from "node:net";
import { randomInt, randomUUID } from "node:crypto";
import { log } from "@ledgerhq/logs";
import { DeviceModelId } from "@ledgerhq/devices";
import { DeviceManagementKitTransportSpeculos } from "@ledgerhq/live-dmk-speculos";
import SpeculosTransportWebsocket from "@ledgerhq/hw-transport-node-speculos";
import { getEnv } from "@ledgerhq/live-env";
import { delay } from "@ledgerhq/live-promise";

export type SpeculosDevice = {
  transport: SpeculosTransport;
  id: string;
  appPath: string;
  ports: Awaited<ReturnType<typeof getPorts>>;
};

export type SpeculosTransport = DeviceManagementKitTransportSpeculos | SpeculosTransportWebsocket;

export { DeviceModelId };

export type SpeculosDeviceInternal =
  | {
      process: ChildProcessWithoutNullStreams;
      apduPort: number;
      buttonPort: number;
      automationPort: number;
      transport: SpeculosTransportWebsocket;
      destroy: () => Promise<unknown>;
    }
  | {
      process: ChildProcessWithoutNullStreams;
      apiPort: string | undefined;
      transport: DeviceManagementKitTransportSpeculos;
      destroy: () => Promise<unknown>;
    };

// FIXME we need to figure out a better system, using a filesystem file?
const isSpeculosWebsocket = getEnv("SPECULOS_USE_WEBSOCKET");
const data: Record<string, SpeculosDeviceInternal | undefined> = {};

export function getMemorySpeculosDeviceInternal(id: string): SpeculosDeviceInternal | undefined {
  return data[id];
}

export const modelMap: Record<string, DeviceModelId> = {
  stax: DeviceModelId.stax,
  flex: DeviceModelId.europa,
  apex_p: DeviceModelId.apex,
  nanos: DeviceModelId.nanoS,
  "nanos+": DeviceModelId.nanoSP,
  nanox: DeviceModelId.nanoX,
  blue: DeviceModelId.blue,
};

export const reverseModelMap: Record<string, string> = {};
for (const k in modelMap) {
  reverseModelMap[modelMap[k]] = k;
}

const getSpeculosModel = (model: DeviceModelId): string => {
  switch (model) {
    case DeviceModelId.europa:
      return "flex";
    case DeviceModelId.apex:
      return "apex_p";
    default:
      return model.toLowerCase();
  }
};
/**
 * Release a speculos device
 */
export async function releaseSpeculosDevice(id: string) {
  log("speculos", "release " + id);
  const obj = data[id];

  if (obj) {
    await obj.destroy();
  }
}

/**
 * Close all speculos devices
 */
export function closeAllSpeculosDevices() {
  return Promise.all(Object.keys(data).map(releaseSpeculosDevice));
}

// to keep in sync from https://github.com/LedgerHQ/speculos/tree/master/speculos/cxlib
const existingSdks = [
  "nanos-cx-2.0.elf",
  "nanos-cx-2.1.elf",
  "nanosp-cx-1.0.3.elf",
  "nanosp-cx-1.0.elf",
  "nanox-cx-2.0.2.elf",
  "nanox-cx-2.0.elf",
];

function inferSDK(firmware: string, model: string): string | undefined {
  const begin = `${model.toLowerCase()}-cx-`;
  if (existingSdks.includes(begin + firmware + ".elf")) return firmware;
  const shortVersion = firmware.slice(0, 3);
  if (existingSdks.includes(begin + shortVersion + ".elf")) return shortVersion;
}

async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = createServer();

    server.once("error", () => {
      resolve(false);
    });

    server.once("listening", () => {
      server.close();
      resolve(true);
    });

    server.listen(port);
  });
}

const BASE_PORT = 30000;
const MAX_PORT = 60000;
const PORTS_PER_WORKER = 1000;
const MAX_WORKER_SLOTS = Math.floor((65535 - BASE_PORT) / PORTS_PER_WORKER);
const MAX_PORT_RETRIES = 10;
let nextPortOffset = 0;

function getWorkerIndex(): number | undefined {
  const playwright = process.env.TEST_WORKER_INDEX;
  if (playwright !== undefined) return parseInt(playwright, 10);
  const jest = process.env.JEST_WORKER_ID;
  if (jest !== undefined) return parseInt(jest, 10) - 1;
  return undefined;
}

async function getNextAvailablePort(exclude: number[] = []): Promise<number> {
  const workerIndex = getWorkerIndex();

  if (workerIndex !== undefined) {
    const effectiveIndex = workerIndex % MAX_WORKER_SLOTS;
    const workerBase = BASE_PORT + effectiveIndex * PORTS_PER_WORKER;
    for (let i = 0; i < PORTS_PER_WORKER; i++) {
      const port = workerBase + ((nextPortOffset + i) % PORTS_PER_WORKER);
      if (exclude.includes(port)) continue;
      if (await isPortAvailable(port)) {
        nextPortOffset = nextPortOffset + i + 1;
        return port;
      }
    }
    throw new Error(
      `No available port in worker ${workerIndex} (slot ${effectiveIndex}) range [${workerBase}, ${workerBase + PORTS_PER_WORKER - 1}]`,
    );
  }

  for (let attempt = 0; attempt < MAX_PORT_RETRIES; attempt++) {
    const port = randomInt(BASE_PORT, MAX_PORT + 1);
    if (exclude.includes(port)) continue;
    if (await isPortAvailable(port)) return port;
  }
  throw new Error(`Failed to find an available port after ${MAX_PORT_RETRIES} attempts`);
}

const getPorts = async (isSpeculosWebsocket?: boolean) => {
  const usedPorts: number[] = [];
  const getPort = async () => {
    const port = await getNextAvailablePort(usedPorts);
    usedPorts.push(port);
    return port;
  };

  if (isSpeculosWebsocket) {
    const apduPort = await getPort();
    const vncPort = await getPort();
    const buttonPort = await getPort();
    const automationPort = await getPort();

    return { apduPort, vncPort, buttonPort, automationPort };
  } else {
    const apiPort = await getPort();
    const vncPort = await getPort();

    return { apiPort, vncPort };
  }
};

export function conventionalAppSubpath(
  model: DeviceModelId,
  firmware: string,
  appName: string,
  appVersion: string,
) {
  return `${reverseModelMap[model]}/${firmware}/${appName.replace(/ /g, "")}/app_${appVersion}.elf`;
}

interface Dependency {
  name: string;
  appVersion?: string;
}

export type DeviceParams = {
  model: DeviceModelId;
  firmware: string;
  appName: string;
  appVersion: string;
  dependency?: string;
  dependencies?: Dependency[];
  seed: string;
  // Root folder from which you need to lookup app binaries
  coinapps: string;
  // if you want to force a specific app path
  overridesAppPath?: string;
  onSpeculosDeviceCreated?: (device: SpeculosDevice) => Promise<void>;
};

/**
 * instantiate a speculos device that runs through docker
 */
export async function createSpeculosDevice(
  arg: DeviceParams,
  maxRetry = 3,
): Promise<SpeculosDevice> {
  const {
    overridesAppPath,
    model,
    firmware,
    appName,
    appVersion,
    seed,
    coinapps,
    dependency,
    dependencies,
  } = arg;
  const speculosID = `speculosID-${randomUUID()}`;
  const ports = await getPorts(isSpeculosWebsocket);

  const sdk = inferSDK(firmware, model);

  const subpath = overridesAppPath || conventionalAppSubpath(model, firmware, appName, appVersion);
  const appPath = `./apps/${subpath}`;

  const getPortMappings = (): string[] => {
    if (process.env.CI) {
      return [];
    }
    if (isSpeculosWebsocket) {
      return [
        "-p",
        `${ports.apduPort}:40000`,
        "-p",
        `${ports.vncPort}:41000`,
        "-p",
        `${ports.buttonPort}:42000`,
        "-p",
        `${ports.automationPort}:43000`,
      ];
    }
    return ["-p", `${ports.apiPort}:40000`, "-p", `${ports.vncPort}:41000`];
  };

  const params = [
    "run",
    ...(process.env.CI ? ["--network=host"] : []),
    "-v",
    `${coinapps}:/speculos/apps`,
    ...getPortMappings(),
    "-e",
    `SPECULOS_APPNAME=${appName}:${appVersion}`,
    "--name",
    `${speculosID}`,
    process.env.SPECULOS_IMAGE_TAG ?? "ghcr.io/ledgerhq/speculos:sha-e262a0c",
    "--model",
    getSpeculosModel(model),
    appPath,
    ...(dependency
      ? [
          "-l",
          `${dependency}:./apps/${conventionalAppSubpath(model, firmware, dependency, appVersion)}`,
        ]
      : []),
    ...(dependencies !== undefined
      ? dependencies.flatMap(dependency => [
          "-l",
          `${dependency.name}:./apps/${conventionalAppSubpath(model, firmware, dependency.name, dependency.appVersion ? dependency.appVersion : "1.0.0")}`,
        ])
      : []),
    ...(sdk ? ["--sdk", sdk] : []),
    "--display",
    "headless",
    ...(getEnv("PLAYWRIGHT_RUN") || getEnv("DETOX") ? ["-p"] : []),
    ...(process.env.CI ? ["--vnc-password", "live", "--vnc-port", `${ports.vncPort}`] : []),
    ...(isSpeculosWebsocket
      ? [
          "--apdu-port",
          process.env.CI ? `${ports.apduPort}` : "40000",
          "--button-port",
          process.env.CI ? `${ports.buttonPort}` : "42000",
          "--automation-port",
          process.env.CI ? `${ports.automationPort}` : "43000",
        ]
      : ["--api-port", process.env.CI ? `${ports.apiPort}` : "40000"]),
  ];

  log("speculos", `${speculosID}: spawning = ${params.join(" ")}`);

  const p = spawn("docker", [...params, "--seed", `${seed}`]);

  let resolveReady: (value: boolean) => void;
  let rejectReady: (e: Error) => void;
  const ready = new Promise((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
  });
  let destroyed = false;

  const destroy = async () => {
    if (destroyed) return Promise.resolve();
    destroyed = true;
    return new Promise((resolve, reject) => {
      if (!data[speculosID]) return resolve(undefined);
      delete data[speculosID];
      exec(`docker rm -f ${speculosID}`, (error, stdout, stderr) => {
        if (error) {
          log("speculos-error", `${speculosID} not destroyed ${error} ${stderr}`);
          reject(error);
        } else {
          log("speculos", `destroyed ${speculosID}`);
          resolve(undefined);
        }
      });
    });
  };

  p.stdout.on("data", data => {
    if (data) {
      log("speculos-stdout", `${speculosID}: ${String(data).trim()}`);
    }
  });
  let latestStderr: string | undefined;
  p.stderr.on("data", async data => {
    if (!data) return;
    latestStderr = data;

    if (!data.includes("apdu: ")) {
      log("speculos-stderr", `${speculosID}: ${String(data).trim()}`);
    }

    if (/using\s(?:SDK|API_LEVEL)/.test(data)) {
      setTimeout(() => resolveReady(true), 500);
    } else if (data.includes("is already in use by")) {
      rejectReady(
        new Error("speculos already in use! Try `ledger-live cleanSpeculos` or check logs"),
      );
    } else if (data.includes("address already in use")) {
      if (maxRetry > 0) {
        log("speculos", "retrying speculos connection");
        await destroy();
        resolveReady(false);
      }
    }
  });
  p.on("close", async () => {
    log("speculos", `${speculosID} closed`);

    if (!destroyed) {
      await destroy();
      rejectReady(new Error(`speculos process failure. ${latestStderr || ""}`));
    }
  });
  const hasSucceed = await ready;

  if (!hasSucceed) {
    await delay(1000);
    return createSpeculosDevice(arg, maxRetry - 1);
  }

  let transport: SpeculosTransport;
  if (isSpeculosWebsocket) {
    transport = await SpeculosTransportWebsocket.open({
      apduPort: ports?.apduPort as number,
      buttonPort: ports?.buttonPort as number,
      automationPort: ports?.automationPort as number,
    });

    data[speculosID] = {
      process: p,
      apduPort: ports.apduPort as number,
      buttonPort: ports.buttonPort as number,
      automationPort: ports.automationPort as number,
      transport,
      destroy,
    };
  } else {
    transport = await DeviceManagementKitTransportSpeculos.open({
      apiPort: ports.apiPort?.toString(),
    });

    data[speculosID] = {
      process: p,
      apiPort: ports.apiPort?.toString(),
      transport,
      destroy,
    };
  }

  const device = {
    id: speculosID,
    transport,
    appPath,
    ports,
  };

  if (arg.onSpeculosDeviceCreated != null) {
    await arg.onSpeculosDeviceCreated(device);
  }

  return device;
}

import { spawn, exec, ChildProcessWithoutNullStreams } from "child_process";
import { log } from "@ledgerhq/logs";
import { DeviceModelId } from "@ledgerhq/devices";
import SpeculosTransportWebsocket from "@ledgerhq/hw-transport-node-speculos";
import { getEnv } from "@ledgerhq/live-env";
import { delay } from "@ledgerhq/live-promise";
import { DeviceManagementKitTransportSpeculos } from "@ledgerhq/live-dmk-speculos";
import SpeculosTransportHttp from "@ledgerhq/hw-transport-node-speculos-http";
import http from "http";

export type SpeculosDevice = {
  transport: SpeculosTransport;
  id: string;
  appPath: string;
  ports: ReturnType<typeof getPorts>;
};

export type SpeculosTransport =
  | DeviceManagementKitTransportSpeculos
  | SpeculosTransportWebsocket
  | SpeculosTransportHttp;

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
      transport: DeviceManagementKitTransportSpeculos | SpeculosTransportHttp;
      destroy: () => Promise<unknown>;
    };

// FIXME we need to figure out a better system, using a filesystem file?
let idCounter: number;
const isSpeculosWebsocket = getEnv("SPECULOS_USE_WEBSOCKET");
const data: Record<string, SpeculosDeviceInternal | undefined> = {};

export function getMemorySpeculosDeviceInternal(id: string): SpeculosDeviceInternal | undefined {
  return data[id];
}

export const modelMap: Record<string, DeviceModelId> = {
  nanos: DeviceModelId.nanoS,
  "nanos+": DeviceModelId.nanoSP,
  nanox: DeviceModelId.nanoX,
  blue: DeviceModelId.blue,
};

export const reverseModelMap: Record<string, string> = {};
for (const k in modelMap) {
  reverseModelMap[modelMap[k]] = k;
}
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

const getPorts = (idCounter: number, isSpeculosWebsocket?: boolean) => {
  if (isSpeculosWebsocket) {
    const apduPort = 30000 + idCounter;
    const vncPort = 35000 + idCounter;
    const buttonPort = 40000 + idCounter;
    const automationPort = 45000 + idCounter;

    return { apduPort, vncPort, buttonPort, automationPort };
  } else {
    const apiPort = 30000 + idCounter;
    const vncPort = 35000 + idCounter;

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

// optional automation configuration
type AutomationRules = {
  version: 1;
  rules: Array<any>;
};

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
  // either mount a file or push rules at runtime
  automationPath?: string; // host path to an automation.json you want to mount
  automationRules?: AutomationRules; // inline rules to POST to /automation
};

// automation per app (used if caller didn't pass rules)
const defaultAutomationFor = (appName: string): AutomationRules | undefined => {
  const a = appName.toLowerCase();
  // Cosmos-family: need Expert mode
  if (["cosmos", "osmosis", "injective", "sei", "akash", "terra"].some(n => a.includes(n))) {
    return {
      version: 1,
      rules: [
        {
          regexp: "Settings",
          actions: [
            ["button", 2, true],
            ["button", 2, false],
          ],
        },
        {
          regexp: "Expert mode",
          actions: [
            ["button", 2, true],
            ["button", 2, false],
          ],
        },
        {
          regexp: "Enable|Enabled",
          actions: [
            ["button", 2, true],
            ["button", 2, false],
          ],
        },
      ],
    };
  }
  // EVM / Solana: need Blind signing / Contract data
  if (
    ["solana", "ethereum", "polygon", "bsc", "avalanche", "arbitrum", "optimism"].some(n =>
      a.includes(n),
    )
  ) {
    return {
      version: 1,
      rules: [
        {
          regexp: "Settings",
          actions: [
            ["button", 2, true],
            ["button", 2, false],
          ],
        },
        {
          regexp: "Blind signing|Contract data",
          actions: [
            ["button", 2, true],
            ["button", 2, false],
          ],
        },
        {
          regexp: "Allow|Enable|Enabled",
          actions: [
            ["button", 2, true],
            ["button", 2, false],
          ],
        },
      ],
    };
  }
  return undefined;
};

// lightweight GET (used to wait for REST API to be ready)
function getOnce(apiPort: string, path: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { hostname: "127.0.0.1", port: Number(apiPort), path, method: "GET" },
      res =>
        res.statusCode && res.statusCode < 500
          ? resolve()
          : reject(new Error(String(res.statusCode))),
    );
    req.on("error", reject);
    req.end();
  });
}

async function waitForApi(apiPort?: string, timeoutMs = 8000) {
  if (!apiPort) return;
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      // any simple endpoint works /screenshot is cheap and available
      await getOnce(apiPort, "/screenshot");
      return;
    } catch {
      await delay(200);
    }
  }
  throw new Error(`Speculos REST API not ready on port ${apiPort}`);
}

// POST automation rules to Speculos
async function postAutomation(apiPort: string, rules: AutomationRules): Promise<void> {
  const body = JSON.stringify(rules);
  return new Promise<void>((resolve, reject) => {
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: Number(apiPort),
        path: "/automation",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      res => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve();
        } else {
          reject(new Error(`Automation POST failed with status ${res.statusCode}`));
        }
      },
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

/**
 * instanciate a speculos device that runs through docker
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
    automationPath,
    automationRules,
  } = arg;
  idCounter = idCounter ?? getEnv("SPECULOS_PID_OFFSET");
  const speculosID = `speculosID-${++idCounter}`;
  const ports = getPorts(idCounter, isSpeculosWebsocket);

  const sdk = inferSDK(firmware, model);

  const subpath = overridesAppPath || conventionalAppSubpath(model, firmware, appName, appVersion);
  const appPath = `./apps/${subpath}`;

  // build -v arguments once so we can optionally mount automation file
  const dockerVolumes: string[] = [`${coinapps}:/speculos/apps`];
  if (automationPath) {
    dockerVolumes.push(`${automationPath}:/tmp/automation.json`);
  }

  const params = [
    "run",
    ...dockerVolumes.flatMap(v => ["-v", v]),
    ...(isSpeculosWebsocket
      ? [
          // websocket ports
          "-p",
          `${ports.apduPort}:40000`,
          "-p",
          `${ports.vncPort}:41000`,
          "-p",
          `${ports.buttonPort}:42000`,
          "-p",
          `${ports.automationPort}:43000`,
        ]
      : [
          // http ports
          "-p",
          `${(ports as any).apiPort}:40000`,
          "-p",
          `${ports.vncPort}:41000`,
        ]),
    "-e",
    `SPECULOS_APPNAME=${appName}:${appVersion}`,
    "--name",
    `${speculosID}`,
    process.env.SPECULOS_IMAGE_TAG ?? "ghcr.io/ledgerhq/speculos:sha-e262a0c",
    "--model",
    model.toLowerCase(),
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
          `${dependency.name}:./apps/${conventionalAppSubpath(
            model,
            firmware,
            dependency.name,
            dependency.appVersion ? dependency.appVersion : "1.0.0",
          )}`,
        ])
      : []),
    ...(sdk ? ["--sdk", sdk] : []),
    "--display",
    "headless",
    ...(getEnv("PLAYWRIGHT_RUN") || getEnv("DETOX") ? ["-p"] : []), // to use the production PKI
    ...(process.env.CI ? ["--vnc-password", "live", "--vnc-port", "41000"] : []),
    ...(isSpeculosWebsocket
      ? [
          // websocket ports
          "--apdu-port",
          "40000",
          "--button-port",
          "42000",
          "--automation-port",
          "43000",
        ]
      : [
          // http ports
          "--api-port",
          "40000",
        ]),
    // pass automation file to Speculos if provided
    ...(automationPath ? ["--automation", "file:/tmp/automation.json"] : []),
  ];

  log("speculos", `${speculosID}: spawning = ${params.join(" ")}`);

  const p = spawn("docker", [...params, "--seed", `${seed}`]);

  let resolveReady: (value: boolean) => void;
  let rejectReady: (e: Error) => void;
  const ready = new Promise((resolve, reject) => {
    resolveReady = resolve as any;
    rejectReady = reject as any;
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

    // post automation rules: caller-provided OR safe defaults by app (enabled by default)
    const wantDefault = (process.env.SPECULOS_DEFAULT_AUTOMATION ?? "1") !== "0";
    const effRules = automationRules ?? (wantDefault ? defaultAutomationFor(appName) : undefined);
    if (effRules && (ports as any).apiPort) {
      await waitForApi((ports as any).apiPort.toString()); // ensure REST is up in CI
      await postAutomation((ports as any).apiPort.toString(), effRules);
      log("speculos", `${speculosID}: automation rules posted (${appName})`);
    }
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

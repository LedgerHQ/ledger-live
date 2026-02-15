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
const useContainerPool = process.env.CI && getEnv("SPECULOS_USE_CONTAINER_POOL");
const data: Record<string, SpeculosDeviceInternal | undefined> = {};

// Container pool for reusing Docker containers in CI
type PooledContainer = {
  containerName: string;
  model: DeviceModelId;
  firmware: string;
  seed: string;
  ports: Awaited<ReturnType<typeof getPorts>>;
  inUse: boolean;
  lastUsed: number;
  useCount: number;
};

const containerPool: Map<string, PooledContainer> = new Map();
const MAX_CONTAINER_USES = 50; // Recreate container after this many uses to prevent degradation
const CONTAINER_IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

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
    if (useContainerPool) {
      // In pool mode, just mark container as available and close transport
      await obj.transport.close();
      delete data[id];

      // Find and mark container as not in use
      for (const pooled of containerPool.values()) {
        if (pooled.containerName === id) {
          pooled.inUse = false;
          pooled.lastUsed = Date.now();
          log("speculos", `released container ${id} to pool (uses: ${pooled.useCount})`);
          return;
        }
      }
    }
    await obj.destroy();
  }
}

/**
 * Generate a pool key based on device configuration
 */
function getPoolKey(model: DeviceModelId, firmware: string, seed: string): string {
  return `${model}-${firmware}-${seed}`;
}

/**
 * Generate a stable container name for pooled containers
 */
function getPooledContainerName(model: DeviceModelId, firmware: string, seed: string): string {
  const hash = seed.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);
  const shortHash = Math.abs(hash).toString(36).substring(0, 8);
  return `speculos-pool-${reverseModelMap[model]}-${firmware.replace(/\./g, '')}-${shortHash}`;
}

/**
 * Close all speculos devices
 */
export async function closeAllSpeculosDevices() {
  await Promise.all(Object.keys(data).map(releaseSpeculosDevice));

  // Clean up container pool in CI
  if (useContainerPool) {
    log("speculos", `cleaning up ${containerPool.size} pooled containers`);
    await cleanupContainerPool();
  }
}

/**
 * Clean up all pooled containers
 */
async function cleanupContainerPool() {
  const cleanupPromises = Array.from(containerPool.values()).map(async (pooled) => {
    return new Promise<void>((resolve, reject) => {
      exec(`docker rm -f ${pooled.containerName}`, (error, stdout, stderr) => {
        if (error) {
          log("speculos-error", `failed to cleanup ${pooled.containerName}: ${error} ${stderr}`);
          reject(error);
        } else {
          log("speculos", `cleaned up pooled container ${pooled.containerName}`);
          resolve();
        }
      });
    });
  });

  await Promise.all(cleanupPromises);
  containerPool.clear();
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

async function getRandomAvailablePort(exclude: number[] = []): Promise<number> {
  const BASE_PORT = 30000;
  const MAX_PORT = 60000;
  const MAX_PORT_RETRIES = 10;

  for (let attempt = 0; attempt < MAX_PORT_RETRIES; attempt++) {
    const port = randomInt(BASE_PORT, MAX_PORT + 1);

    if (exclude.includes(port)) {
      continue;
    }

    if (await isPortAvailable(port)) {
      return port;
    }
  }

  throw new Error(`Failed to find an available port after ${MAX_PORT_RETRIES} attempts`);
}

const getPorts = async (isSpeculosWebsocket?: boolean) => {
  const usedPorts: number[] = [];
  const getPort = async () => {
    const port = await getRandomAvailablePort(usedPorts);
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

/**
 * Check if a Docker container is running and healthy
 */
async function isContainerHealthy(containerName: string): Promise<boolean> {
  return new Promise((resolve) => {
    exec(`docker ps --filter "name=${containerName}" --filter "status=running" --format "{{.Names}}"`, (error, stdout) => {
      if (error || !stdout.trim()) {
        resolve(false);
      } else {
        resolve(stdout.trim() === containerName);
      }
    });
  });
}

/**
 * Stop the current Speculos process in a running container
 */
async function stopSpeculosInContainer(containerName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    exec(`docker exec ${containerName} pkill -9 speculos || true`, (error, stdout, stderr) => {
      if (error && !stderr.includes("no process found")) {
        log("speculos-error", `failed to stop speculos in ${containerName}: ${error} ${stderr}`);
        reject(error);
      } else {
        log("speculos", `stopped speculos process in ${containerName}`);
        // Give it a moment to clean up
        setTimeout(resolve, 500);
      }
    });
  });
}

/**
 * Start a new Speculos app in an existing container
 */
async function startSpeculosInContainer(
  containerName: string,
  model: DeviceModelId,
  firmware: string,
  appPath: string,
  seed: string,
  dependency?: string,
  dependencies?: Dependency[],
): Promise<void> {
  const sdk = inferSDK(firmware, reverseModelMap[model]);

  const speculosArgs = [
    "--model", getSpeculosModel(model),
    appPath,
    ...(dependency ? ["-l", `${dependency}:${dependency}`] : []),
    ...(dependencies !== undefined
      ? dependencies.flatMap(dep => ["-l", `${dep.name}:${dep.name}`])
      : []),
    ...(sdk ? ["--sdk", sdk] : []),
    "--display", "headless",
    ...(getEnv("PLAYWRIGHT_RUN") || getEnv("DETOX") ? ["-p"] : []),
    ...(isSpeculosWebsocket
      ? ["--apdu-port", "40000", "--button-port", "42000", "--automation-port", "43000"]
      : ["--api-port", "40000"]),
    "--seed", seed,
  ].join(" ");

  return new Promise((resolve, reject) => {
    const cmd = `docker exec -d ${containerName} sh -c "speculos ${speculosArgs}"`;
    log("speculos", `starting app in container: ${cmd}`);

    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        log("speculos-error", `failed to start speculos in ${containerName}: ${error} ${stderr}`);
        reject(error);
      } else {
        log("speculos", `started speculos in ${containerName}`);
        // Give Speculos time to initialize
        setTimeout(resolve, 1000);
      }
    });
  });
}

interface Dependency {
  name: string;
  appVersion?: string;
}

/**
 * Get or create a pooled container for reuse
 */
async function getOrCreatePooledContainer(
  model: DeviceModelId,
  firmware: string,
  seed: string,
  coinapps: string,
): Promise<PooledContainer> {
  const poolKey = getPoolKey(model, firmware, seed);

  // Check if we have an available container in the pool
  let pooled = containerPool.get(poolKey);

  if (pooled) {
    // Check if container is healthy
    const isHealthy = await isContainerHealthy(pooled.containerName);

    if (isHealthy && pooled.useCount < MAX_CONTAINER_USES) {
      // Mark as in use and return
      pooled.inUse = true;
      pooled.useCount++;
      log("speculos", `reusing pooled container ${pooled.containerName} (use ${pooled.useCount}/${MAX_CONTAINER_USES})`);
      return pooled;
    } else {
      // Container is unhealthy or exceeded max uses, remove it
      log("speculos", `removing unhealthy or overused container ${pooled.containerName}`);
      await new Promise<void>((resolve) => {
        exec(`docker rm -f ${pooled!.containerName}`, () => resolve());
      });
      containerPool.delete(poolKey);
    }
  }

  // Create a new pooled container
  const containerName = getPooledContainerName(model, firmware, seed);
  const ports = await getPorts(isSpeculosWebsocket);

  log("speculos", `creating new pooled container ${containerName}`);

  // Create container without starting Speculos yet (we'll start it per-app)
  const createParams = [
    "run", "-d",
    "-v", `${coinapps}:/speculos/apps`,
    ...(isSpeculosWebsocket
      ? [
          "-p", `${ports.apduPort}:40000`,
          "-p", `${ports.vncPort}:41000`,
          "-p", `${ports.buttonPort}:42000`,
          "-p", `${ports.automationPort}:43000`,
        ]
      : [
          "-p", `${ports.apiPort}:40000`,
          "-p", `${ports.vncPort}:41000`,
        ]),
    "--name", containerName,
    "--restart", "unless-stopped",
    process.env.SPECULOS_IMAGE_TAG ?? "ghcr.io/ledgerhq/speculos:sha-e262a0c",
    "tail", "-f", "/dev/null", // Keep container alive without running speculos yet
  ];

  return new Promise((resolve, reject) => {
    exec(`docker ${createParams.join(" ")}`, async (error, stdout, stderr) => {
      if (error) {
        log("speculos-error", `failed to create pooled container: ${error} ${stderr}`);
        reject(error);
      } else {
        pooled = {
          containerName,
          model,
          firmware,
          seed,
          ports,
          inUse: true,
          lastUsed: Date.now(),
          useCount: 1,
        };
        containerPool.set(poolKey, pooled);
        log("speculos", `created pooled container ${containerName}`);
        resolve(pooled);
      }
    });
  });
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

  const subpath = overridesAppPath || conventionalAppSubpath(model, firmware, appName, appVersion);
  const appPath = `./apps/${subpath}`;

  // Use container pooling if enabled in CI
  if (useContainerPool) {
    return createSpeculosDevicePooled(arg, appPath, maxRetry);
  }

  // Original implementation for non-pooled mode
  const speculosID = `speculosID-${randomUUID()}`;
  const ports = await getPorts(isSpeculosWebsocket);

  const sdk = inferSDK(firmware, model);


  const params = [
    "run",
    "-v",
    `${coinapps}:/speculos/apps`,
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
          `${ports.apiPort}:40000`,
          "-p",
          `${ports.vncPort}:41000`,
        ]),
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

/**
 * Create a speculos device using container pooling (CI mode)
 * Reuses existing containers and swaps apps instead of creating new containers
 */
async function createSpeculosDevicePooled(
  arg: DeviceParams,
  appPath: string,
  maxRetry: number,
): Promise<SpeculosDevice> {
  const { model, firmware, appName, appVersion, seed, coinapps, dependency, dependencies } = arg;

  try {
    // Get or create a pooled container
    const pooled = await getOrCreatePooledContainer(model, firmware, seed, coinapps);
    const containerName = pooled.containerName;
    const ports = pooled.ports;

    log("speculos", `using pooled container ${containerName} for ${appName}:${appVersion}`);

    // Stop any existing Speculos process in the container
    await stopSpeculosInContainer(containerName);

    // Start the new app in the container
    await startSpeculosInContainer(
      containerName,
      model,
      firmware,
      appPath,
      seed,
      dependency,
      dependencies,
    );

    // Wait a bit for Speculos to be ready
    await delay(1500);

    // Create transport connection
    let transport: SpeculosTransport;
    if (isSpeculosWebsocket) {
      transport = await SpeculosTransportWebsocket.open({
        apduPort: ports.apduPort as number,
        buttonPort: ports.buttonPort as number,
        automationPort: ports.automationPort as number,
      });
    } else {
      transport = await DeviceManagementKitTransportSpeculos.open({
        apiPort: ports.apiPort?.toString(),
      });
    }

    // Create a dummy process object (container is managed separately)
    const dummyProcess = {
      kill: () => {},
      on: () => {},
      stdout: { on: () => {} },
      stderr: { on: () => {} },
    } as unknown as ChildProcessWithoutNullStreams;

    // Store the device in the data map
    if (isSpeculosWebsocket) {
      data[containerName] = {
        process: dummyProcess,
        apduPort: ports.apduPort as number,
        buttonPort: ports.buttonPort as number,
        automationPort: ports.automationPort as number,
        transport: transport as SpeculosTransportWebsocket,
        destroy: async () => {
          // In pooled mode, destroy just closes the transport
          await transport.close();
        },
      };
    } else {
      data[containerName] = {
        process: dummyProcess,
        apiPort: ports.apiPort?.toString(),
        transport: transport as DeviceManagementKitTransportSpeculos,
        destroy: async () => {
          // In pooled mode, destroy just closes the transport
          await transport.close();
        },
      };
    }

    const device = {
      id: containerName,
      transport,
      appPath,
      ports,
    };

    if (arg.onSpeculosDeviceCreated != null) {
      await arg.onSpeculosDeviceCreated(device);
    }

    return device;
  } catch (error) {
    log("speculos-error", `failed to create pooled device: ${error}`);
    if (maxRetry > 0) {
      log("speculos", `retrying pooled device creation (${maxRetry} retries left)`);
      await delay(1000);
      return createSpeculosDevicePooled(arg, appPath, maxRetry - 1);
    }
    throw error;
  }
}


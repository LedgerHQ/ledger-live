import { log } from "@ledgerhq/logs";
import { SpeculosDevice } from "@ledgerhq/speculos-transport";
import { DeviceModelId } from "@ledgerhq/devices";

import axios from "axios";
import { Dependency } from "./speculos";
import { getEnv } from "@ledgerhq/live-env";

let idCounter: number;
const dockerApiUrl = `http://${process.env.DOCKER_API_ADDRESS}:${process.env.DOCKER_API_PORT || "2375"}`;

const { SEED, COINAPPS, COINAPPS_REMOTE } = process.env;

type DeviceParams = {
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
 * Helper function to make API requests with error handling
 */
async function dockerApiRequest(
  method: string,
  url: string,
  data = {},
  throwError = false,
  params = {},
) {
  try {
    const response = await axios({
      method,
      url: `${dockerApiUrl}/containers/${url}`,
      headers: { "Content-Type": "application/json" },
      data: method !== "GET" ? data : undefined,
      params,
    });
    return response.data;
  } catch (error) {
    console.warn(
      `API Request failed: ${method} ${url}`,
      axios.isAxiosError(error) ? error.response?.data : (error as Error).message,
    );
    if (throwError) throw error;
  }
}

const waitForSpeculosReady = async (speculosID: string, timeout = 10000, interval = 500) => {
  const startTime = Date.now();
  const logPattern = /using\s(?:SDK|API_LEVEL)/;

  while (Date.now() - startTime < timeout) {
    const params = { stdout: true, stderr: true };
    const logs = await dockerApiRequest("GET", `${speculosID}/logs`, {}, false, params);
    if (logPattern.test(logs)) return logs;
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  throw new Error(`Timeout: Speculos not ready in ${timeout}ms`);
};

const modelMap: Record<string, DeviceModelId> = {
  nanos: DeviceModelId.nanoS,
  "nanos+": DeviceModelId.nanoSP,
  nanox: DeviceModelId.nanoX,
  blue: DeviceModelId.blue,
};

const reverseModelMap: Record<string, string> = {};
for (const k in modelMap) {
  reverseModelMap[modelMap[k]] = k;
}

function conventionalAppSubpath(
  model: DeviceModelId,
  firmware: string,
  appName: string,
  appVersion: string,
) {
  return `${reverseModelMap[model]}/${firmware}/${appName.replace(/ /g, "")}/app_${appVersion}.elf`;
}

function createRequestData(deviceParams: DeviceParams) {
  const { model, firmware, appName, appVersion, dependency, dependencies } = deviceParams;

  const subpath = conventionalAppSubpath(model, firmware, appName, appVersion);
  const appPath = `./apps/${subpath}`;

  return {
    Image: `${process.env.SPECULOS_IMAGE_TAG}`,
    Cmd: [
      "--model",
      model.toLowerCase(),
      appPath,
      "--display",
      "headless",
      "--api-port",
      "40000",
      "--seed",
      `${SEED}`,
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
    ],
    Env: [`SPECULOS_APPNAME=${appName}:${appVersion}`],
    HostConfig: {
      Binds: [`${COINAPPS_REMOTE ?? COINAPPS}:/speculos/apps`],
      PortBindings: { "40000/tcp": [{ HostPort: (30000 + idCounter).toString() }] },
    },
    NetworkMode: "bridge",
    AutoRemove: true,
  };
}

export async function createSpeculosDeviceAPI(
  deviceParams: DeviceParams,
): Promise<SpeculosDevice | undefined> {
  idCounter = idCounter ?? getEnv("SPECULOS_PID_OFFSET");
  const speculosID = `speculosID-${++idCounter}`;

  try {
    const requestData = createRequestData(deviceParams);
    await dockerApiRequest("POST", speculosID + "/stop");
    await dockerApiRequest("DELETE", speculosID);
    await dockerApiRequest("POST", `create?name=${speculosID}`, requestData, true);
    await dockerApiRequest("POST", `${speculosID}/start`, {}, true);
    await waitForSpeculosReady(speculosID);

    return {
      transport: undefined as unknown,
      id: speculosID,
      appPath: requestData.Cmd[3],
      ports: { apiPort: 30000 + idCounter, vncPort: 0 },
    } as SpeculosDevice;
  } catch (e: unknown) {
    console.error(e);
    log("engine", `test ${speculosID} failed with ${String(e)}`);
  }
}

export async function releaseSpeculosDeviceAPI(deviceId: string) {
  log("engine", `test ${deviceId} finished`);
  await dockerApiRequest("POST", deviceId + "/stop");
  await dockerApiRequest("DELETE", deviceId);
}

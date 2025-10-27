import axios from "axios";
import {
  conventionalAppSubpath,
  DeviceParams,
  reverseModelMap,
} from "@ledgerhq/speculos-transport";
import { SpeculosDevice } from "./speculos";
import https from "https";

const { SEED, GITHUB_TOKEN, AWS_ROLE, CLUSTER, SPECULOS_IMAGE_TAG } = process.env;
const GIT_API_URL = "https://api.github.com/repos/LedgerHQ/actions/actions/";
const START_WORKFLOW_ID = "workflows/161487603/dispatches";
const STOP_WORKFLOW_ID = "workflows/161487604/dispatches";
const GITHUB_REF = "main";
const getSpeculosAddress = (runId: string) => `https://${runId}.speculos.aws.stg.ldg-tech.com`;
const speculosPort = 443;

function uniqueId(): string {
  const timestamp = Date.now().toString(36);
  const randomString = Math.random().toString(36).slice(2, 7);
  return timestamp + randomString;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Helper function to make API requests with error handling
 */
async function githubApiRequest<T = unknown>({
  method = "POST",
  urlSuffix,
  data,
  params,
}: {
  method?: "GET" | "POST";
  urlSuffix: string;
  data?: Record<string, unknown>;
  params?: Record<string, unknown>;
}): Promise<T> {
  const url = `${GIT_API_URL}${urlSuffix}`;
  try {
    const response = await axios({
      method,
      url,
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      data,
      params,
    });
    return response.data;
  } catch (error) {
    console.warn(
      `API Request failed: ${method} ${url}`,
      axios.isAxiosError(error) ? error.response?.data : (error as Error).message,
    );
    throw error;
  }
}

export function waitForSpeculosReady(
  deviceId: string,
  { interval = 2_000, timeout = 150_000 } = {},
) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    let currentRequest: ReturnType<typeof https.get> | null = null;
    const url = getSpeculosAddress(deviceId);

    function cleanup() {
      if (currentRequest) {
        currentRequest.destroy();
        currentRequest = null;
      }
    }

    function check() {
      cleanup();

      currentRequest = https.get(url, { timeout: 10000 }, res => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 400) {
          process.env.SPECULOS_ADDRESS = url;
          cleanup();
          console.warn(`Speculos is ready at ${url}`);
          resolve(true);
        } else {
          console.warn(`Speculos not ready yet, status: ${res.statusCode}`);
          retry();
        }
      });

      currentRequest.on("error", error => {
        console.error(`Request error: ${error.message}`);
        retry();
      });

      currentRequest.on("timeout", () => {
        console.error("Request timeout");
        retry();
      });
    }

    function retry() {
      if (Date.now() - startTime >= timeout) {
        cleanup();
        reject(new Error(`Timeout: ${url} did not become available within ${timeout}ms`));
      } else {
        setTimeout(check, interval);
      }
    }

    check();
  });
}

function createStartPayload(deviceParams: DeviceParams, runId: string) {
  const { model, firmware, appName, appVersion, dependency, dependencies } = deviceParams;

  let additional_args = "-p";

  if (dependency) {
    additional_args = `${additional_args} -l ${dependency}:/apps/${conventionalAppSubpath(model, firmware, dependency, appVersion)}`;
  } else if (dependencies) {
    additional_args = [
      ...new Set(
        dependencies.map(
          dep =>
            `${additional_args} -l ${dep.name}:/apps/${conventionalAppSubpath(
              model,
              firmware,
              dep.name,
              dep.appVersion ?? "1.0.0",
            )}`,
        ),
      ),
    ].join(" ");
  }

  return {
    ref: GITHUB_REF,
    inputs: {
      speculos_version: SPECULOS_IMAGE_TAG?.split(":")[1] || "master",
      coin_app: appName,
      coin_app_version: appVersion,
      device: reverseModelMap[model],
      device_os_version: firmware,
      aws_role: AWS_ROLE,
      cluster: CLUSTER,
      seed: SEED,
      run_id: runId,
      additional_args,
    },
  };
}

export async function createSpeculosDeviceCI(
  deviceParams: DeviceParams,
): Promise<SpeculosDevice | undefined> {
  const runId = `${slugify(deviceParams.appName)}-${uniqueId()}`;
  try {
    const data = createStartPayload(deviceParams, runId);
    await githubApiRequest({ urlSuffix: START_WORKFLOW_ID, data });
    return {
      id: runId,
      port: speculosPort,
      appName: deviceParams.appName,
      appVersion: deviceParams.appVersion,
    };
  } catch (e: unknown) {
    console.warn(
      `Creating remote speculos ${deviceParams.appName}:${deviceParams.appVersion} failed with ${String(e)}`,
    );
    return {
      id: runId,
      port: 0,
      appName: deviceParams.appName,
      appVersion: deviceParams.appVersion,
    };
  }
}

export async function releaseSpeculosDeviceCI(runId: string) {
  const data = {
    ref: GITHUB_REF,
    inputs: {
      run_id: runId.toString(),
      aws_role: AWS_ROLE,
      cluster: CLUSTER,
    },
  };
  await githubApiRequest({ urlSuffix: STOP_WORKFLOW_ID, data });
}

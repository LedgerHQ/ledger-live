import { log } from "@ledgerhq/logs";
import axios from "axios";
import {
  conventionalAppSubpath,
  DeviceParams,
  reverseModelMap,
} from "@ledgerhq/speculos-transport";
import { SpeculosDevice } from "./speculos";

const { SEED, GITHUB_TOKEN, AWS_ROLE, CLUSTER } = process.env;
const GIT_API_URL = "https://api.github.com/repos/LedgerHQ/actions/actions/";
const START_WORKFLOW_ID = "workflows/161487603/dispatches";
const STOP_WORKFLOW_ID = "workflows/161487604/dispatches";
const GITHUB_REF = "qaa"; // TODO: use the correct ref for your workflow
const getSpeculosAddress = (runId: string) => `https://${runId}.speculos.aws.stg.ldg-tech.com`;

function uniqueId(): string {
  const timestamp = Date.now().toString(36);
  const randomString = Math.random().toString(36).slice(2, 7);
  return timestamp + randomString;
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
const waitForSpeculosReady = async (run_id: string, timeout = 300_000, interval = 5_000) => {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const data = await githubApiRequest<{ artifacts: any[] }>({
      method: "GET",
      urlSuffix: "artifacts",
    });

    const match = data.artifacts.find(a => a.name === run_id);
    if (match) return run_id;
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  throw new Error(`Timeout: Speculos not ready in ${timeout}ms`);
};

function createStartPayload(deviceParams: DeviceParams) {
  const { model, firmware, appName, appVersion, dependency, dependencies } = deviceParams;

  const payload = {
    ref: GITHUB_REF,
    inputs: {
      coin_app: appName,
      coin_app_version: appVersion,
      device: reverseModelMap[model],
      device_os_version: firmware,
      aws_role: AWS_ROLE,
      cluster: CLUSTER,
      seed: SEED,
      run_id: uniqueId(),
      additional_args: [
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
    },
  };
  return payload;
}

export async function createSpeculosDeviceCI(
  deviceParams: DeviceParams,
): Promise<SpeculosDevice | undefined> {
  try {
    const data = createStartPayload(deviceParams);
    await githubApiRequest({ urlSuffix: START_WORKFLOW_ID, data });
    const runId = await waitForSpeculosReady(data.inputs.run_id);
    process.env.SPECULOS_ADDRESS = getSpeculosAddress(runId);

    return {
      id: runId,
      port: 443,
    };
  } catch (e: unknown) {
    console.error(e);
    log(
      "engine",
      `Creating remote speculos ${deviceParams.appName}:${deviceParams.appVersion} failed with ${String(e)}`,
    );
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

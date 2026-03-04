import { setEnv } from "@ledgerhq/live-env";
import {
  startSpeculos,
  specs,
  stopSpeculos,
  type SpeculosDevice,
} from "@ledgerhq/live-common/e2e/speculos";
import * as allure from "allure-js-commons";
import { waitForSpeculosReady } from "@ledgerhq/live-common/e2e/speculosCI";

const BASE_PORT = 30000;
const MAX_PORT = 65535;
let portCounter = BASE_PORT;

export async function launchSpeculos(appName: string, testTitle?: string): Promise<SpeculosDevice> {
  if (portCounter > MAX_PORT) {
    portCounter = BASE_PORT;
  }

  const speculosPort = portCounter++;

  if (testTitle) {
    testTitle = testTitle.replace(/ /g, "_");
  }

  setEnv(
    "SPECULOS_PID_OFFSET",
    (speculosPort - BASE_PORT) * 1000 + parseInt(process.env.TEST_WORKER_INDEX || "0") * 100,
  );

  const specKey = appName.replace(/ /g, "_");
  const spec = specs[specKey];

  if (!spec) {
    const availableSpecs = Object.keys(specs).join(", ");
    throw new Error(
      `[E2E Setup] No spec found for "${specKey}" (appName="${appName}"). Available specs: [${availableSpecs}]`,
    );
  }

  const testLabel = testTitle ?? "cli_speculos";

  console.warn(
    `[E2E Setup] Starting Speculos for "${specKey}" (test="${testLabel}", port=${speculosPort}, ` +
      `remote=${process.env.REMOTE_SPECULOS ?? "false"}, model=${spec.appQuery.model}, ` +
      `appName=${spec.appQuery.appName}, COINAPPS=${process.env.COINAPPS ?? "unset"})`,
  );

  const device = await startSpeculos(testLabel, spec);

  if (!device) {
    throw new Error(
      `[E2E Setup] Speculos not started — startSpeculos returned undefined. ` +
        `specKey="${specKey}", test="${testLabel}", port=${speculosPort}, ` +
        `model=${spec.appQuery.model}, appQueryName=${spec.appQuery.appName}, ` +
        `REMOTE_SPECULOS=${process.env.REMOTE_SPECULOS ?? "false"}, ` +
        `SPECULOS_ADDRESS=${process.env.SPECULOS_ADDRESS ?? "unset"}, ` +
        `COINAPPS=${process.env.COINAPPS ?? "unset"}, ` +
        `SEED=${process.env.SEED ? "set" : "unset"}. ` +
        `Check logs above for the underlying error from startSpeculos.`,
    );
  }

  if (process.env.REMOTE_SPECULOS === "true") {
    await waitForSpeculosReady(device.id);
    console.warn(
      `[E2E Setup] Remote Speculos ready - SPECULOS_ADDRESS: ${process.env.SPECULOS_ADDRESS}`,
    );
  }

  setEnv("SPECULOS_API_PORT", device.port);
  process.env.SPECULOS_API_PORT = device.port.toString();

  if (device.appVersion) {
    allure.parameter("App name:", device.appName || "");
    allure.parameter("App version:", device.appVersion || "");
  }

  console.warn(
    `Speculos ${device.id} started on port ${device.port}, address: ${process.env.SPECULOS_ADDRESS || "http://localhost"}`,
  );
  return device;
}

export async function killSpeculos(deviceId: string) {
  await stopSpeculos(deviceId);
}

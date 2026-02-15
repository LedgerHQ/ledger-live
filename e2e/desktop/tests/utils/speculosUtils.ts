import { setEnv } from "@ledgerhq/live-env";
import {
  startSpeculos,
  specs,
  stopSpeculos,
  type SpeculosDevice,
} from "@ledgerhq/live-common/e2e/speculos";
import invariant from "invariant";
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

  const device = await startSpeculos(
    testTitle ?? "cli_speculos",
    specs[appName.replace(/ /g, "_")],
  );

  invariant(device, "[E2E Setup] Speculos not started");

  if (process.env.REMOTE_SPECULOS === "true") {
    await waitForSpeculosReady(device.id);
  }

  setEnv("SPECULOS_API_PORT", device.port);
  // ????
  // process.env.SPECULOS_API_PORT = device.port.toString();

  if (device.appVersion) {
    allure.parameter("App name:", device.appName || "");
    allure.parameter("App version:", device.appVersion || "");
  }

  console.warn(`Speculos ${device.id} started on ${device.port}`);
  return device;
}

export async function killSpeculos(deviceId: string) {
  await stopSpeculos(deviceId);
}

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

export async function launchSpeculos(appName: string, testTitle?: string): Promise<SpeculosDevice> {
  if (testTitle) {
    testTitle = testTitle.replace(/ /g, "_");
  }

  const device = await startSpeculos(
    testTitle ?? "cli_speculos",
    specs[appName.replace(/ /g, "_")],
  );

  invariant(device, "[E2E Setup] Speculos not started");

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

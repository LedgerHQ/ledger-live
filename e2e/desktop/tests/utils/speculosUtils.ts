import { setEnv } from "@shared/env";
import {
  startSpeculos,
  specs,
  stopSpeculos,
  type SpeculosDevice,
  getSpeculosAddress,
} from "@ledgerhq/live-e2e-shared/speculos";
import invariant from "invariant";
import * as allure from "allure-js-commons";
import { waitForSpeculosReady } from "@ledgerhq/live-e2e-shared/speculosCI";
import { sanitizeError } from "@ledgerhq/live-e2e-shared/index";
import { CLI } from "tests/utils/cliUtils";
import { unregisterTransportModule } from "@ledgerhq/live-common/hw/index";

export async function launchSpeculos(
  appName: string,
  testTitle?: string,
  previousDevice?: SpeculosDevice,
): Promise<SpeculosDevice> {
  if (testTitle) {
    testTitle = testTitle.replace(/ /g, "_");
  }

  if (previousDevice) {
    await cleanSpeculos(previousDevice);
  }
  const device = await startSpeculos(
    testTitle ?? "cli_speculos",
    specs[appName.replace(/ /g, "_")],
    previousDevice?.port,
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
  CLI.registerSpeculosTransport(device.id, device.port.toString(), getSpeculosAddress());

  let info = `App: ${device.appName || ""} (${device.appVersion || ""})`;
  if (device.dependencies?.length) {
    info += `\nDependencies: ${device.dependencies?.map(dep => dep.name + " (" + dep.appVersion + ")").join(", ") || ""}`;
  }
  await allure.description("SPECULOS\n" + info);

  console.warn(
    `Speculos ${device.id} ${appName} started on port ${device.port}, address: ${process.env.SPECULOS_ADDRESS || "http://localhost"}`,
  );
  return device;
}

export async function cleanSpeculos(speculos: SpeculosDevice) {
  await stopSpeculos(speculos.id);
  unregisterTransportModule("speculos-http-" + speculos.id);
}

function restoreProcessEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

/**
 * Runs `work` on a Speculos of its own, then puts the caller's device back.
 *
 * A remote device is identified by its URL and protected by its own token, not by its port, so
 * SPECULOS_ADDRESS and SPECULOS_SESSION_TOKEN are restored along with the port.
 */
export async function withTemporarySpeculos<T>(
  appName: string,
  work: () => Promise<T>,
): Promise<T> {
  const previousPort = process.env.SPECULOS_API_PORT;
  const previousAddress = process.env.SPECULOS_ADDRESS;
  const previousSessionToken = process.env.SPECULOS_SESSION_TOKEN;
  const speculos = await launchSpeculos(appName);
  try {
    return await work();
  } finally {
    // A failed release must neither skip the restore nor replace the error `work` threw.
    await cleanSpeculos(speculos).catch(error =>
      console.warn(`Could not release temporary Speculos ${speculos.id}: ${sanitizeError(error)}`),
    );
    restoreProcessEnv("SPECULOS_ADDRESS", previousAddress);
    restoreProcessEnv("SPECULOS_SESSION_TOKEN", previousSessionToken);
    restoreProcessEnv("SPECULOS_API_PORT", previousPort);
    setEnv("SPECULOS_API_PORT", Number(previousPort) || 0);
  }
}

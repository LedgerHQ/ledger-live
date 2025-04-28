import { allure } from "jest-allure2-reporter/api";
import {
  startSpeculos,
  stopSpeculos,
  specs,
  takeScreenshot,
} from "@ledgerhq/live-common/e2e/speculos";
import invariant from "invariant";
import { setEnv } from "@ledgerhq/live-env";
import { startProxy, closeProxy } from "../bridge/proxy";
import { device } from "detox";
import { log } from "@ledgerhq/logs";

const BASE_PORT = 30000;
const MAX_PORT = 65535;
let portCounter = BASE_PORT; // Counter for generating unique ports
const speculosDevices = new Map<number, string>();

/**
 * Waits for a specified amount of time
 * /!\ Do not use it to wait for a specific element, use waitFor instead.
 * @param {number} ms
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function launchSpeculos(appName: string) {
  if (portCounter > MAX_PORT) portCounter = BASE_PORT;
  const speculosPort = portCounter++;

  if (speculosDevices.has(speculosPort)) {
    log("e2e", `[E2E Setup] Speculos already launched on port ${speculosPort}`);
    return speculosPort;
  }

  const speculosPidOffset =
    (speculosPort - BASE_PORT) * 1000 + parseInt(process.env.JEST_WORKER_ID || "0") * 100;
  setEnv("SPECULOS_PID_OFFSET", speculosPidOffset);

  const testName = jestExpect.getState().testPath || "unknown";
  const specKey = appName.replace(/ /g, "_");
  const spec = specs[specKey];
  invariant(spec, `[E2E Setup] Spec '${specKey}' not found in specs`);

  const speculosDevice = await startSpeculos(testName, spec);
  invariant(speculosDevice, "[E2E Setup] Speculos not started");

  const speculosApiPort = speculosDevice.ports.apiPort;
  invariant(speculosApiPort, "[E2E Setup] speculosApiPort not defined");
  speculosDevices.set(speculosApiPort, speculosDevice.id);
  setEnv("SPECULOS_API_PORT", speculosApiPort);

  log("e2e", `Speculos started: id=${speculosDevice.id}, port=${speculosApiPort}`);
  return speculosApiPort;
}

export async function launchProxy(
  proxyPort: number,
  speculosAddress?: string,
  speculosPort?: number,
) {
  await device.reverseTcpPort(proxyPort);
  await startProxy(proxyPort, speculosAddress, speculosPort);
}

export async function deleteSpeculos(apiPort?: number) {
  if (!apiPort) {
    if (!speculosDevices.size) {
      log("e2e", "[E2E Teardown] No active Speculos instances to stop.");
    }
    const ports = Array.from(speculosDevices.keys());
    await Promise.all(
      ports.map(async port => {
        try {
          await deleteSpeculos(port);
        } catch (err) {
          log("e2e", `Failed to stop Speculos on port ${port}: ${String(err)}`);
        }
      }),
    );
    return;
  }

  if (speculosDevices.has(apiPort)) {
    const speculosId = speculosDevices.get(apiPort);
    if (speculosId) await stopSpeculos(speculosId);
    speculosDevices.delete(apiPort);
    log("e2e", `Speculos successfully stopped on port ${apiPort}`);
  } else {
    log("e2e", `Speculos not found on port ${apiPort}`);
  }

  setEnv("SPECULOS_API_PORT", 0);
  return closeProxy(apiPort);
}

export async function takeSpeculosScreenshot() {
  for (const [apiPort] of speculosDevices) {
    const speculosScreenshot = await takeScreenshot(apiPort);
    if (speculosScreenshot) {
      await allure.attachment(`Speculos Screenshot - ${apiPort}`, speculosScreenshot, "image/png");
    }
  }
}

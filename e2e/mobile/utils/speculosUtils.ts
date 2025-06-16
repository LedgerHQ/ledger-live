import { allure } from "jest-allure2-reporter/api";
import {
  specs,
  startSpeculos,
  stopSpeculos,
  takeScreenshot,
} from "@ledgerhq/live-common/e2e/speculos";
import invariant from "invariant";
import { setEnv } from "@ledgerhq/live-env";
import { closeProxy, startProxy } from "../bridge/proxy";
import { device, log } from "detox";

const BASE_PORT = 30000;
const MAX_PORT = 65535;
let portCounter = BASE_PORT; // Counter for generating unique ports

export async function launchSpeculos(appName: string) {
  // Ensure the portCounter stays within the valid port range
  if (portCounter > MAX_PORT) {
    portCounter = BASE_PORT;
  }
  const speculosPort = portCounter++;
  const speculosPidOffset =
    (speculosPort - BASE_PORT) * 1000 + parseInt(process.env.JEST_WORKER_ID || "0") * 100;
  setEnv("SPECULOS_PID_OFFSET", speculosPidOffset);

  const testName = jestExpect.getState().testPath || "unknown";
  const device = await startSpeculos(testName, specs[appName.replace(/ /g, "_")]);

  invariant(device, "[E2E Setup] Speculos not started");
  setEnv("SPECULOS_API_PORT", device.port);
  speculosDevices.set(device.port, device.id);
  log.warn(`Speculos ${device.id} started on ${device.port}`);
  return device.port;
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
      log.info("e2e", "[E2E Teardown] No active Speculos instances to stop.");
    }
    const ports = Array.from(speculosDevices.keys());
    await Promise.all(
      ports.map(async port => {
        try {
          await deleteSpeculos(port);
        } catch (err) {
          log.error("e2e", `Failed to stop Speculos on port ${port}: ${String(err)}`);
        }
      }),
    );
    return;
  }

  if (speculosDevices.has(apiPort)) {
    const speculosId = speculosDevices.get(apiPort);
    if (speculosId) await stopSpeculos(speculosId);
    speculosDevices.delete(apiPort);
    log.info("e2e", `Speculos successfully stopped on port ${apiPort}`);
  } else {
    log.warn("e2e", `Speculos not found on port ${apiPort}`);
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

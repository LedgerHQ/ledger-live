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
import { waitForSpeculosReady } from "@ledgerhq/live-common/e2e/speculosCI";
import { isRemoteIos } from "../helpers/commonHelpers";

const BASE_PORT = 30000;
const MAX_PORT = 65535;
let portCounter = BASE_PORT; // Counter for generating unique ports

export async function launchSpeculos(appName: string, runId?: string) {
  // Ensure the portCounter stays within the valid port range
  if (portCounter > MAX_PORT) {
    portCounter = BASE_PORT;
  }
  const speculosPort = portCounter++;
  const speculosPidOffset =
    (speculosPort - BASE_PORT) * 1000 + parseInt(process.env.JEST_WORKER_ID || "0") * 100;
  setEnv("SPECULOS_PID_OFFSET", speculosPidOffset);

  const testName = jestExpect.getState().testPath || "unknown";
  const device = await startSpeculos(testName, specs[appName.replace(/ /g, "_")], runId);

  invariant(device, "[E2E Setup] Speculos not started");
  setEnv("SPECULOS_API_PORT", device.port);

  log.info("e2e", "Device info before map set:", {
    port: device.port,
    deviceId: device.id,
    providedRunId: runId,
  });

  // Store the runId if provided, otherwise fall back to device.id
  speculosDevices.set(device.port, runId || device.id);

  log.info(
    "e2e",
    "Current speculosDevices map after set:",
    Array.from(speculosDevices.entries())
      .map(([port, id]) => `${port} -> ${id}`)
      .join(", "),
  );

  console.log(
    "[E2E SPECULOS_PID] Started",
    device.port,
    "with runId",
    runId || "N/A",
    "running on",
    device.id,
  );

  log.info(`Speculos ${device.id} started on ${device.port}`);
  return device;
}

export async function launchProxy(
  proxyPort: number,
  speculosAddress?: string,
  speculosPort?: number,
) {
  await device.reverseTcpPort(proxyPort);
  await startProxy(proxyPort, speculosAddress, speculosPort);
}

async function findPortByRunId(
  runId: string,
  maxAttempts = 3,
  delay = 1000,
): Promise<number | undefined> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    log.info(
      "e2e",
      `Current speculosDevices map (attempt ${attempt}/${maxAttempts}):`,
      Array.from(speculosDevices.entries())
        .map(([port, deviceId]) => `${port} -> ${deviceId}`)
        .join(", "),
    );

    for (const [port, deviceId] of speculosDevices.entries()) {
      if (deviceId === runId) {
        return port;
      }
    }

    if (attempt < maxAttempts) {
      log.info(
        "e2e",
        `RunId ${runId} not found in map, retrying in ${delay}ms (attempt ${attempt}/${maxAttempts})`,
      );
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return undefined;
}

export async function deleteSpeculos(apiPortOrRunId?: number | string) {
  if (!apiPortOrRunId) {
    if (!speculosDevices.size) {
      log.info("e2e", "[E2E Teardown] No active Speculos instances to stop.");
    } else {
      log.info("e2e", `[E2E Teardown] Stopping ${speculosDevices.size} Speculos instances:`);
      for (const [port, deviceId] of speculosDevices.entries()) {
        log.info("e2e", `  Port ${port} -> DeviceId ${deviceId}`);
      }
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

  if (typeof apiPortOrRunId === "string") {
    const runId = apiPortOrRunId;
    const foundPort = await findPortByRunId(runId);

    if (foundPort) {
      await stopSpeculos(runId);
      speculosDevices.delete(foundPort);
      log.info("e2e", `Remote Speculos successfully stopped with runId ${runId}`);
      return closeProxy(foundPort);
    } else {
      log.warn("e2e", `Remote Speculos not found with runId ${runId}. Available devices:`);
      try {
        await stopSpeculos(runId);
        log.info("e2e", `Attempted direct cleanup of remote Speculos with runId ${runId}`);
      } catch (err) {
        log.warn("e2e", `Direct cleanup failed for runId ${runId}:`, err);
      }
      return;
    }
  }

  const apiPort = apiPortOrRunId as number;
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
  for (const apiPort of speculosDevices.keys()) {
    if (isRemoteIos()) {
      try {
        await waitForSpeculosReady(
          process.env.SPECULOS_ADDRESS!,
          `Skipping screenshot: Speculos ${process.env.SPECULOS_ADDRESS} unreachable`,
          {
            interval: 5_000,
            timeout: 10_000,
          },
        );
      } catch {
        log.warn(
          "e2e",
          `Skipping screenshot: Speculos ${process.env.SPECULOS_ADDRESS} unreachable.`,
        );
        continue;
      }
    }

    const screenshot = await takeScreenshot(apiPort);
    if (screenshot) {
      await allure.attachment(`Speculos Screenshot – port ${apiPort}`, screenshot, "image/png");
    }
  }
}

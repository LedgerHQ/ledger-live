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
  speculosDevices.set(runId || device.id, device.port);

  log.info(
    "e2e",
    "Current speculosDevices map after set:",
    Array.from(speculosDevices.entries())
      .map(([runId, port]) => `${runId} -> ${port}`)
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
      "E2E",
      `Current speculosDevices map (attempt ${attempt}/${maxAttempts}):`,
      Array.from(speculosDevices.entries())
        .map(([runId, port]) => `${runId} -> ${port}`)
        .join(", "),
    );

    if (speculosDevices.has(runId)) {
      return speculosDevices.get(runId);
    }

    if (attempt < maxAttempts) {
      log.info(
        "E2E",
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
      log.info("E2E", "No active Speculos instances to stop.");
    } else {
      log.info("E2E", `Stopping ${speculosDevices.size} Speculos instances:`);
      for (const [runId, port] of speculosDevices.entries()) {
        log.info("E2E", `RunId ${runId} -> Port ${port}`);
      }
    }
    const runIds = Array.from(speculosDevices.keys());
    await Promise.all(
      runIds.map(async runId => {
        try {
          await deleteSpeculos(runId);
        } catch (err) {
          log.error("E2E", `Failed to stop Speculos with runId ${runId}: ${String(err)}`);
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
      speculosDevices.delete(runId);
      log.info("E2E", `Remote Speculos successfully stopped with runId ${runId}`);
      return closeProxy(foundPort);
    } else {
      log.warn("E2E", `Remote Speculos not found with runId ${runId}. Available devices:`);
      try {
        await stopSpeculos(runId);
        log.info("E2E", `Attempted direct cleanup of remote Speculos with runId ${runId}`);
      } catch (err) {
        log.warn("E2E", `Direct cleanup failed for runId ${runId}:`, err);
      }
      return;
    }
  }

  const apiPort = apiPortOrRunId as number;
  let foundRunId: string | undefined;
  for (const [runId, port] of speculosDevices.entries()) {
    if (port === apiPort) {
      foundRunId = runId;
      break;
    }
  }

  if (foundRunId) {
    await stopSpeculos(foundRunId);
    speculosDevices.delete(foundRunId);
    log.info("E2E", `Speculos successfully stopped on port ${apiPort} (runId: ${foundRunId})`);
  } else {
    log.warn("E2E", `Speculos not found on port ${apiPort}`);
  }

  setEnv("SPECULOS_API_PORT", 0);
  return closeProxy(apiPort);
}

export async function takeSpeculosScreenshot() {
  for (const [, apiPort] of speculosDevices.entries()) {
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
          "E2E",
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

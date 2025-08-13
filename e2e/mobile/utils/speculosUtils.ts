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
import { exec as childExec } from "child_process";
import { waitForSpeculosReady } from "@ledgerhq/live-common/e2e/speculosCI";
import { isRemoteIos } from "../helpers/commonHelpers";
import { addKnownSpeculos, removeKnownSpeculos } from "../bridge/server";
import { unregisterAllTransportModules } from "@ledgerhq/live-common/hw/index";
import { CLI } from "./cliUtils";

const BASE_PORT = 30000;
const MAX_PORT = 65535;
let portCounter = BASE_PORT; // Counter for generating unique ports
const proxyAddress = "localhost";

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

  log.info("E2E", "Device info before map set:", {
    port: device.port,
    deviceId: device.id,
  });

  // Store the runId if provided, otherwise fall back to device.id
  speculosDevices.set(runId || device.id, device.port);

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

export async function deleteSpeculos(apiPortOrDeviceId?: number | string) {
  // No argument: stop everything. Use device id on remote, port locally
  if (apiPortOrDeviceId === undefined) {
    if (!speculosDevices.size) {
      log.info("E2E", "No active Speculos instances to stop.");
      return;
    }

    log.info("E2E", `Stopping ${speculosDevices.size} Speculos instances:`);
    for (const [runId, port] of speculosDevices.entries()) {
      log.info("E2E", `RunId ${runId} -> Port ${port}`);
    }

    const tasks = Array.from(speculosDevices.entries()).map(async ([runId, port]) => {
      try {
        log.info(
          "E2E",
          `Stopping Speculos with ${isRemoteIos() ? `device ${runId}` : `port ${port}`}`,
        );
        await deleteSpeculos(isRemoteIos() ? runId : port);
      } catch (err) {
        log.error(
          "E2E",
          `Failed to stop Speculos with ${isRemoteIos() ? `device ${runId}` : `port ${port}`}: ${String(
            err,
          )}`,
        );
      }
    });
    await Promise.all(tasks);
    return;
  }

  // Remote: argument is a device id (string)
  if (typeof apiPortOrDeviceId === "string") {
    const runId = apiPortOrDeviceId;
    const foundPort = await findPortByRunId(runId);

    if (foundPort) {
      await stopSpeculos(runId);
      speculosDevices.delete(runId);
      log.info("E2E", `Speculos successfully stopped for device ${runId}`);
      return closeProxy(foundPort);
    }

    log.warn("E2E", `Remote Speculos not found with device ${runId}. Attempting direct cleanup…`);
    await stopSpeculos(runId);
    return;
  }

  // Local: argument is a port (number)
  const apiPort = apiPortOrDeviceId;
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
        await waitForSpeculosReady(process.env.SPECULOS_ADDRESS!, {
          interval: 5_000,
          timeout: 10_000,
        });
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

export async function registerSpeculos(speculosPort: number, proxyPort: number) {
  unregisterAllTransportModules();
  const speculosAddress = process.env.SPECULOS_ADDRESS;
  await launchProxy(proxyPort, speculosAddress, speculosPort);
  await addKnownSpeculos(`${proxyAddress}:${proxyPort}`);
  process.env.DEVICE_PROXY_URL = `ws://localhost:${proxyPort}`;
  CLI.registerSpeculosTransport(speculosPort.toString(), speculosAddress);
  setEnv("SPECULOS_API_PORT", speculosPort);
}

export async function removeSpeculos(apiPortOrDeviceId?: number | string) {
  const proxyPort = await deleteSpeculos(apiPortOrDeviceId);
  proxyPort && (await removeKnownSpeculos(`${proxyAddress}:${proxyPort}`));
}

function forceRemoveDockerContainer(containerName: string): Promise<void> {
  return new Promise(resolve => {
    // Only relevant locally (not on remote iOS)
    if (isRemoteIos()) return resolve();
    childExec(`docker rm -f ${containerName}`, (err: unknown) => {
      if (err) {
        log.warn("E2E", `Docker fallback cleanup failed for ${containerName}: ${String(err)}`);
      } else {
        log.info("E2E", `Docker container ${containerName} removed (fallback).`);
      }
      resolve();
    });
  });
}

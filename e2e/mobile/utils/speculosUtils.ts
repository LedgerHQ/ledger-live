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
import { addKnownSpeculos, removeKnownSpeculos } from "../bridge/server";
import { unregisterAllTransportModules } from "@ledgerhq/live-common/hw/index";
import { promises as fs } from "fs";
import path from "path";

import { CLI } from "./cliUtils";

const BASE_PORT = 30000;
const MAX_PORT = 65535;
let portCounter = BASE_PORT; // Counter for generating unique ports
const proxyAddress = "localhost";

type SpeculosId = { deviceId: string };
export const SPECULOS_TRACKING_FILE = path.resolve("artifacts/speculos-instances.json");

// Register in tracking file for cross-process cleanup
async function writeSpeculosInFile(deviceId: string) {
  try {
    const instances = await readInstances();
    instances.push({ deviceId });
    await writeInstances(instances);
  } catch (error) {
    log.warn("E2E", `⚠️ Failed to register Speculos instance ${deviceId}:`, error);
  }
}

async function removeSpeculosFromFile(deviceId: string) {
  try {
    const instances = await readInstances();
    const filtered = instances.filter(inst => inst.deviceId !== deviceId);
    if (filtered.length !== instances.length) await writeInstances(filtered);
  } catch (error) {
    log.warn("E2E", `⚠️ Failed to unregister Speculos instance ${deviceId}:`, error);
  }
}

async function readInstances(): Promise<SpeculosId[]> {
  try {
    const content = await fs.readFile(SPECULOS_TRACKING_FILE, "utf-8");
    return JSON.parse(content);
  } catch {
    return [];
  }
}

async function writeInstances(instances: SpeculosId[]) {
  await fs.mkdir(path.dirname(SPECULOS_TRACKING_FILE), { recursive: true });
  await fs.writeFile(SPECULOS_TRACKING_FILE, JSON.stringify(instances, null, 2));
}

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
  const device = await startSpeculos(testName ?? "cli_speculos", specs[appName.replace(/ /g, "_")]);

  invariant(device, "[E2E Setup] Speculos not started");
  setEnv("SPECULOS_API_PORT", device.port);
  speculosDevices.set(device.id, device.port);
  invariant(device.port, "[E2E Setup] Speculos port not null");

  await writeSpeculosInFile(device.id);
  log.info("E2E Setup", "Device info before map set:", {
    port: device.port,
    deviceId: device.id,
  });

  allure.description(`App name: ${device.appName || ""}`);
  allure.description(`App version: ${device.appVersion || ""}`);

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

async function findPortByDeviceId(
  deviceId: string,
  maxAttempts = 3,
  delay = 1000,
): Promise<number | undefined> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    log.info(
      "E2E",
      `Current speculosDevices map (attempt ${attempt}/${maxAttempts}):`,
      Array.from(speculosDevices.entries())
        .map(([deviceId, port]) => `${deviceId} -> ${port}`)
        .join(", "),
    );

    if (speculosDevices.has(deviceId)) {
      return speculosDevices.get(deviceId);
    }

    if (attempt < maxAttempts) {
      log.info(
        "E2E",
        `RunId ${deviceId} not found in map, retrying in ${delay}ms (attempt ${attempt}/${maxAttempts})`,
      );
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return undefined;
}

export async function deleteSpeculos(deviceId?: string) {
  if (!deviceId) {
    if (!speculosDevices.size) {
      log.info("E2E", "No active Speculos instances to stop.");
      return;
    }

    const tasks = Array.from(speculosDevices.entries()).map(async ([deviceId, port]) => {
      try {
        log.info("E2E", `Stopping Speculos with device ${deviceId} and port ${port}}`);
        await deleteSpeculos(deviceId);
      } catch (err) {
        log.error(
          "E2E",
          `Failed to stop Speculos with device ${deviceId} port ${port}}: ${String(err)}`,
        );
      }
    });
    await Promise.all(tasks);
    return;
  }

  const port = await findPortByDeviceId(deviceId);

  await stopSpeculos(deviceId);
  speculosDevices.delete(deviceId);
  await removeSpeculosFromFile(deviceId);

  log.info("E2E", `Speculos successfully stopped for device ${deviceId}`);
  setEnv("SPECULOS_API_PORT", 0);

  return closeProxy(port);
}

export async function takeSpeculosScreenshot() {
  for (const [deviceId, apiPort] of speculosDevices.entries()) {
    if (isRemoteIos()) {
      try {
        await waitForSpeculosReady(deviceId, {
          interval: 5_000,
          timeout: 10_000,
        });
      } catch {
        log.warn("E2E", `Skipping screenshot: Speculos with ${deviceId} unreachable.`);
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
  process.env.DEVICE_PROXY_URL = `ws://localhost:${proxyPort}`;
  CLI.registerSpeculosTransport(speculosPort.toString(), speculosAddress);
  setEnv("SPECULOS_API_PORT", speculosPort);
}

export async function registerKnownSpeculos(proxyPort: number) {
  await addKnownSpeculos(`${proxyAddress}:${proxyPort}`);
}

export async function removeSpeculosAndDeregisterKnownSpeculos(deviceId?: string) {
  const proxyPort = await deleteSpeculos(deviceId);
  proxyPort && (await removeKnownSpeculos(`${proxyAddress}:${proxyPort}`));
}

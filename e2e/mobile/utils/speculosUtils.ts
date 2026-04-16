import { allure } from "jest-allure2-reporter/api";
import {
  specs,
  startSpeculos,
  stopSpeculos,
  takeScreenshot,
  setExchangeDependencies,
} from "@ledgerhq/live-common/e2e/speculos";
import { setEnv } from "@ledgerhq/live-env";
import { device, log } from "detox";
import { waitForSpeculosReady } from "@ledgerhq/live-common/e2e/speculosCI";
import { isSpeculosRemote } from "../helpers/commonHelpers";
import { addKnownSpeculos, getEnvs, removeKnownSpeculos } from "../bridge/server";
import { CLI } from "./cliUtils";
import { promises as fs } from "fs";
import path from "path";

import { sanitizeError } from "@ledgerhq/live-common/e2e/index";
import { getCapturedStderr } from "./loggingUtils";

const SPECULOS_STDOUT_MARKER = "--- Speculos stdout ---";
const SPECULOS_STDERR_MARKER = "--- Speculos stderr ---";

function attachSpeculosOutputToAllure(message: string): Promise<void> {
  const promises: Promise<void>[] = [];
  try {
    if (message.includes(SPECULOS_STDOUT_MARKER)) {
      const afterStdout = message.indexOf(SPECULOS_STDOUT_MARKER) + SPECULOS_STDOUT_MARKER.length;
      const rest = message.slice(afterStdout).replace(/^\n+/, "");
      const endOfStdout = rest.includes(SPECULOS_STDERR_MARKER)
        ? rest.indexOf(SPECULOS_STDERR_MARKER)
        : rest.length;
      const stdout = rest.slice(0, endOfStdout).replace(/\n+$/, "").trim();
      if (stdout) {
        promises.push(
          allure.attachment("Speculos stdout", stdout, "text/plain").then(() => undefined),
        );
      }
    }
    if (message.includes(SPECULOS_STDERR_MARKER)) {
      const afterStderr = message.indexOf(SPECULOS_STDERR_MARKER) + SPECULOS_STDERR_MARKER.length;
      const stderr = message.slice(afterStderr).replace(/^\n+/, "").replace(/\n+$/, "").trim();
      if (stderr) {
        promises.push(
          allure.attachment("Speculos stderr", stderr, "text/plain").then(() => undefined),
        );
      }
    }
    return Promise.all(promises).then(() => undefined);
  } catch {
    return Promise.resolve();
  }
}

// Re-export setExchangeDependencies to ensure the same module instance is used
export { setExchangeDependencies };

type SpeculosId = { deviceId: string };
export const SPECULOS_TRACKING_FILE = path.resolve("artifacts/speculos-instances.json");

// Register in tracking file for cross-process cleanup
async function writeSpeculosInFile(deviceId: string) {
  try {
    const instances = await readInstances();
    instances.push({ deviceId });
    await writeInstances(instances);
  } catch (error) {
    log.warn("E2E", `⚠️ Failed to register Speculos instance ${deviceId}:`, sanitizeError(error));
  }
}

async function removeSpeculosFromFile(deviceId: string) {
  try {
    const instances = await readInstances();
    const filtered = instances.filter(inst => inst.deviceId !== deviceId);
    if (filtered.length !== instances.length) await writeInstances(filtered);
  } catch (error) {
    log.warn("E2E", `⚠️ Failed to unregister Speculos instance ${deviceId}:`, sanitizeError(error));
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
  const testName = jestExpect.getState().testPath || "unknown";
  let device;
  try {
    device = await startSpeculos(testName ?? "cli_speculos", specs[appName.replace(/ /g, "_")]);
  } catch (e: unknown) {
    const err = e instanceof Error ? e : new Error(String(e));
    globalThis.speculosStartupErrorMessage = err.message;
    globalThis.speculosFailureStderr = getCapturedStderr();
    await attachSpeculosOutputToAllure(err.message);
    const message = ["[E2E Setup] Speculos failed to start.", err.message]
      .filter(Boolean)
      .join("\n\n");
    log.error("E2E Setup", message);
    throw new Error(message);
  }

  if (!device) {
    const note =
      "[E2E Setup] Speculos not started: no device returned. Check SEED, COINAPPS, and Docker (local) or CI workflow (remote).";
    globalThis.speculosStartupErrorMessage = note;
    globalThis.speculosFailureStderr = getCapturedStderr();
    log.error("E2E Setup", "[E2E Setup] Speculos not started");
    throw new Error("[E2E Setup] Speculos not started");
  }
  if (!device.port) {
    const remoteHint = isSpeculosRemote()
      ? " Remote Speculos workflow may have failed (port 0). Check CI/GitHub Actions."
      : "";
    const message = [
      "[E2E Setup] Speculos port not set.",
      `deviceId: ${device.id}, appName: ${device.appName ?? appName}${remoteHint}`,
    ].join(" ");
    log.error("E2E Setup", message);
    throw new Error(message);
  }
  setEnv("SPECULOS_API_PORT", device.port);
  speculosDevices.set(device.id, device.port);

  await writeSpeculosInFile(device.id);
  log.info("E2E Setup", "Device info before map set:", {
    port: device.port,
    deviceId: device.id,
  });

  let info = `App: ${device.appName || ""} (${device.appVersion || ""}) `;
  if (device.dependencies?.length)
    info += `\nDependencies: ${device.dependencies?.map(dep => dep.name + " (" + dep.appVersion + ")").join(", ") || ""}`;

  await allure.description("SPECULOS\n" + info);

  return device;
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
        .map(([id, p]) => `${id} -> ${p ?? "(null)"}`)
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

export async function deleteSpeculos(deviceId?: string): Promise<number | undefined> {
  if (!deviceId) {
    if (!speculosDevices.size) {
      log.info("E2E", "No active Speculos instances to stop.");
      return;
    }

    const tasks = Array.from(speculosDevices.entries()).map(async ([deviceId, port]) => {
      try {
        log.info("E2E", `Stopping Speculos with device ${deviceId} and port ${port}}`);
        await deleteSpeculos(deviceId);
      } catch (error) {
        log.error(
          "E2E",
          `Failed to stop Speculos with device ${deviceId} port ${port}}: ${sanitizeError(error)}`,
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
  delete process.env.SPECULOS_API_PORT;

  return port;
}

export async function takeSpeculosScreenshot() {
  for (const [deviceId, apiPort] of speculosDevices.entries()) {
    if (isSpeculosRemote()) {
      try {
        await waitForSpeculosReady(deviceId, {
          interval: 5_000,
          timeout: 30_000,
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

export async function registerSpeculos(speculosPort: number) {
  const speculosAddress = process.env.SPECULOS_ADDRESS;
  await device.reverseTcpPort(speculosPort);
  process.env.SPECULOS_API_PORT = speculosPort.toString();
  delete process.env.DEVICE_PROXY_URL;
  CLI.registerSpeculosTransport(speculosPort.toString(), speculosAddress);
  setEnv("SPECULOS_API_PORT", speculosPort);
}

function getKnownSpeculosAddress(speculosPort: number): string {
  const configuredAddress = process.env.SPECULOS_ADDRESS?.trim();
  if (!configuredAddress) {
    return `http://127.0.0.1:${speculosPort}`;
  }

  const normalizedAddress = configuredAddress.startsWith("http")
    ? configuredAddress
    : `http://${configuredAddress}`;
  const withoutTrailingSlash = normalizedAddress.replace(/\/+$/, "");
  return /:\d+$/.test(withoutTrailingSlash)
    ? withoutTrailingSlash
    : `${withoutTrailingSlash}:${speculosPort}`;
}

async function waitForBridgeEnv(
  key: string,
  expectedValue: string,
  attempts = 12,
  delayMs = 500,
): Promise<void> {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const envsRaw = await getEnvs();
      if (envsRaw) {
        const envs = JSON.parse(envsRaw) as Record<string, string | undefined>;
        if ((envs[key] ?? "") === expectedValue) return;
      }
    } catch {
      // retry until timeout
    }
    if (attempt < attempts) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  throw new Error(
    `Bridge env sync failed: expected ${key}="${expectedValue}" after ${attempts} attempts`,
  );
}

export async function registerKnownSpeculos(speculosPort: number) {
  const address = getKnownSpeculosAddress(speculosPort);
  await addKnownSpeculos(address);
  await waitForBridgeEnv("DEVICE_PROXY_URL", address);
}

export async function removeSpeculosAndDeregisterKnownSpeculos(deviceId?: string) {
  const speculosPort = await deleteSpeculos(deviceId);
  if (speculosPort) {
    try {
      await device.unreverseTcpPort(speculosPort);
    } catch (e) {
      log.warn(`unreverseTcpPort(${speculosPort}) failed: ${sanitizeError(e)}`);
    }
    await removeKnownSpeculos(getKnownSpeculosAddress(speculosPort));
    await waitForBridgeEnv("DEVICE_PROXY_URL", "");
  }
}

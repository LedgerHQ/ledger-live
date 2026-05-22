import type { SpeculosAppType } from "@ledgerhq/live-common/e2e/enum/AppInfos";
import {
  specs,
  startSpeculos,
  stopSpeculos,
  setExchangeDependencies,
  type Dependency,
} from "@ledgerhq/live-common/e2e/speculos";
import { setEnv } from "@ledgerhq/live-env";
import { sanitizeError } from "@ledgerhq/live-common/e2e/index";
import { execSync } from "node:child_process";
import path from "node:path";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { waitForSpeculosReady } from "@ledgerhq/live-common/e2e/speculosCI";
import { addKnownSpeculos, getEnvs, removeKnownSpeculos } from "../bridge/server.ts";

import { CLIUtils } from "./CLIUtils.ts";

export type Entry = {
  name: string;
  speculosPort: number;
  deviceId: string;
};

export type SpeculosId = { deviceId: string };

export class SpeculosUtils {
  private static readonly SPECULOS_TRACKING_FILE = path.resolve(
    "artifacts/speculos-instances.json",
  );

  static setExchangeDependencies = (dependencies: Dependency[]) =>
    setExchangeDependencies(dependencies);

  static isSpeculosRemote = (): boolean => process.env.REMOTE_SPECULOS === "true";

  static launchSpeculosDevices = async (
    toStart: SpeculosAppType[],
  ): Promise<Record<string, Entry>> => {
    // Setup all Speculos devices in parallel for better performance
    const entries: Entry[] = await Promise.all(
      toStart.map(async app => {
        // checkTestFailed(); TODO -> REVIEW
        const device = await SpeculosUtils.launchSpeculos(app.name);

        return {
          name: app.name,
          speculosPort: device.port,
          deviceId: device.id,
        };
      }),
    );

    return entries.reduce<Record<string, Entry>>((acc, entry) => {
      acc[entry.name] = entry;
      return acc;
    }, {});
  };

  static launchSpeculos = async (appName: string) => {
    // const testName = jestExpect.getState().testPath || "unknown"; TODO: REVIEW
    const testName = "DUMMY TEST NAME";
    let device;
    try {
      device = await startSpeculos(testName ?? "cli_speculos", specs[appName.replace(/ /g, "_")]);
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e));
      globalThis.speculosStartupErrorMessage = err.message;
      // globalThis.speculosFailureStderr = getCapturedStderr(); TODO: REVIEW
      // await attachSpeculosOutputToAllure(err.message); TODO: REVIEW
      const message = ["[E2E Setup] Speculos failed to start.", err.message]
        .filter(Boolean)
        .join("\n\n");
      console.error("ERROR:", message);
      console.error("E2E Setup", message);
      throw new Error(err.message);
    }

    if (!device) {
      throw new Error("[E2E Setup] Speculos not started");
    }

    if (!device.port) {
      const remoteHint = SpeculosUtils.isSpeculosRemote()
        ? " Remote Speculos (Speculinho) did not return an API port — check logs above for POST /acquire errors, SPECULINHO_URL, and SEED."
        : "";
      const message = [
        "[E2E Setup] Speculos port not set.",
        `deviceId: ${device.id}, appName: ${device.appName ?? appName}${remoteHint}`,
      ].join(" ");
      console.error("E2E Setup", message);
      throw new Error(message);
    }
    setEnv("SPECULOS_API_PORT", device.port);
    globalThis.speculosDevices.set(device.id, device.port);

    SpeculosUtils.writeSpeculosInFile(device.id);
    console.info("E2E Setup", "Device info before map set:", {
      port: device.port,
      deviceId: device.id,
    });

    let info = `App: ${device.appName || ""} (${device.appVersion || ""}) `;
    if (device.dependencies?.length)
      info += `\nDependencies: ${device.dependencies?.map(dep => dep.name + " (" + dep.appVersion + ")").join(", ") || ""}`;

    // TODO: CUSTOM -> REMOVE!
    console.info(
      "E2E Setup",
      `Speculos started for device ${device.id} on port ${device.port}. ${info}`,
    );
    // await allure.description("SPECULOS\n" + info); TODO: REVIEW

    return device;
  };

  static registerSpeculos = async (speculosPort: number) => {
    const speculosAddress = process.env.SPECULOS_ADDRESS;
    if (driver.isAndroid) {
      execSync("adb reverse tcp:8081 tcp:8081");
    }
    process.env.SPECULOS_API_PORT = speculosPort.toString();
    delete process.env.DEVICE_PROXY_URL;
    CLIUtils.registerSpeculosTransport(speculosPort.toString(), speculosAddress);
    setEnv("SPECULOS_API_PORT", speculosPort);
  };

  static deleteSpeculos = async (deviceId?: string): Promise<number | undefined> => {
    if (!deviceId) {
      if (!globalThis.speculosDevices.size) {
        console.info("E2E", "No active Speculos instances to stop.");
        return;
      }

      const tasks = Array.from(globalThis.speculosDevices.entries()).map(
        async ([deviceId, port]) => {
          try {
            console.info("E2E", `Stopping Speculos with device ${deviceId} and port ${port}}`);
            await SpeculosUtils.deleteSpeculos(deviceId);
          } catch (error) {
            console.error(
              "E2E",
              `Failed to stop Speculos with device ${deviceId} port ${port}}: ${sanitizeError(error)}`,
            );
          }
        },
      );
      await Promise.all(tasks);
      return;
    }

    const port = await SpeculosUtils.findPortByDeviceId(deviceId);

    await stopSpeculos(deviceId);
    globalThis.speculosDevices.delete(deviceId);
    SpeculosUtils.removeSpeculosFromFile(deviceId);

    console.info("E2E", `Speculos successfully stopped for device ${deviceId}`);
    setEnv("SPECULOS_API_PORT", 0);
    delete process.env.SPECULOS_API_PORT;

    return port;
  };

  static writeSpeculosInFile = (deviceId: string) => {
    // Register in tracking file for cross-process cleanup
    try {
      const instances = SpeculosUtils.readInstances();
      instances.push({ deviceId });
      SpeculosUtils.writeInstances(instances);
    } catch (error) {
      console.warn(
        "E2E",
        `⚠️ Failed to register Speculos instance ${deviceId}:`,
        sanitizeError(error),
      );
    }
  };

  static removeSpeculosFromFile = (deviceId: string) => {
    try {
      const instances = SpeculosUtils.readInstances();
      const filtered = instances.filter(inst => inst.deviceId !== deviceId);
      if (filtered.length !== instances.length) SpeculosUtils.writeInstances(filtered);
    } catch (error) {
      console.warn(
        "E2E",
        `⚠️ Failed to unregister Speculos instance ${deviceId}:`,
        sanitizeError(error),
      );
    }
  };

  static readInstances = (): SpeculosId[] => {
    try {
      const content = readFileSync(SpeculosUtils.SPECULOS_TRACKING_FILE, "utf-8");
      return JSON.parse(content);
    } catch {
      return [];
    }
  };

  static writeInstances = (instances: SpeculosId[]) => {
    mkdirSync(path.dirname(SpeculosUtils.SPECULOS_TRACKING_FILE), { recursive: true });
    writeFileSync(SpeculosUtils.SPECULOS_TRACKING_FILE, JSON.stringify(instances, null, 2));
  };

  static findPortByDeviceId = async (
    deviceId: string,
    maxAttempts = 3,
    delay = 1000,
  ): Promise<number | undefined> => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.info(
        "E2E",
        `Current speculosDevices map (attempt ${attempt}/${maxAttempts}):`,
        Array.from(globalThis.speculosDevices.entries())
          .map(([id, p]) => `${id} -> ${p ?? "(null)"}`)
          .join(", "),
      );

      if (globalThis.speculosDevices.has(deviceId)) {
        return globalThis.speculosDevices.get(deviceId);
      }

      if (attempt < maxAttempts) {
        console.info(
          "E2E",
          `RunId ${deviceId} not found in map, retrying in ${delay}ms (attempt ${attempt}/${maxAttempts})`,
        );
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return undefined;
  };

  static removeSpeculosAndDeregisterKnownSpeculos = async (deviceId?: string) => {
    const speculosPort = await SpeculosUtils.deleteSpeculos(deviceId);
    /* TODO: REVIEW
  if (speculosPort) {
    try {
      await device.unreverseTcpPort(speculosPort);
    } catch (e) {
      console.warn(`unreverseTcpPort(${speculosPort}) failed: ${sanitizeError(e)}`);
    }
    */
    // REVERT CUSTOM IF
    if (speculosPort) {
      const knownAddress = SpeculosUtils.getKnownSpeculosAddress(speculosPort);
      await removeKnownSpeculos(knownAddress);
    }
    await SpeculosUtils.waitForBridgeEnv("DEVICE_PROXY_URL", "");
  };

  static setupMainSpeculosApp = async (
    // Retry logic for main Speculos app setup with instance recreation
    speculosApp: SpeculosAppType,
    entryMap: Record<string, Entry>,
  ): Promise<void> => {
    const main = entryMap[speculosApp.name];
    if (!main) {
      throw new Error(`No entry found for main speculos app: ${speculosApp.name}`);
    }

    const maxRetries = 3;
    let attempt = 0;
    let lastError: unknown;

    while (attempt < maxRetries) {
      // checkTestFailed(); TODO: review
      attempt++;

      try {
        console.info(`\n🔄 [${speculosApp.name}] Main setup attempt ${attempt}/${maxRetries}`);

        if (SpeculosUtils.isSpeculosRemote()) {
          await waitForSpeculosReady(main.deviceId);
        }
        await SpeculosUtils.registerSpeculos(main.speculosPort);
        await SpeculosUtils.registerKnownSpeculos(main.speculosPort);
        console.info(
          `✅ [${speculosApp.name}] Main Speculos registered successfully on port ${main.speculosPort}`,
        );

        lastError = undefined;
        break;
      } catch (err) {
        lastError = err;

        if (attempt < maxRetries) {
          // checkTestFailed(); TODO: review

          console.info(`[${speculosApp.name}] Creating new main Speculos instance for retry`);
          await SpeculosUtils.removeSpeculosAndDeregisterKnownSpeculos(main.deviceId);
          const device = await SpeculosUtils.launchSpeculos(main.name);

          entryMap[speculosApp.name] = {
            name: main.name,
            speculosPort: device.port,
            deviceId: device.id,
          };
        }
      }
    }

    if (lastError) {
      throw new Error(
        `❌ [${speculosApp.name}] Failed to setup main Speculos app after ${maxRetries} attempts: ${sanitizeError(lastError)}`,
      );
    }
  };

  static waitForBridgeEnv = async (
    key: string,
    expectedValue: string,
    attempts = 12,
    delayMs = 500,
  ): Promise<void> => {
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
  };

  static getKnownSpeculosAddress = (speculosPort: number): string => {
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
  };

  static registerKnownSpeculos = async (speculosPort: number) => {
    const address = SpeculosUtils.getKnownSpeculosAddress(speculosPort);
    await addKnownSpeculos(address);
    await SpeculosUtils.waitForBridgeEnv("DEVICE_PROXY_URL", address);
  };
}

export default SpeculosUtils;

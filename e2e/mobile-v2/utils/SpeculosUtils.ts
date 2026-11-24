import type { SpeculosAppType } from "@ledgerhq/live-e2e-shared/enum/AppInfos";
import {
  specs,
  startSpeculos,
  stopSpeculos,
  setExchangeDependencies,
  type Dependency,
} from "@ledgerhq/live-e2e-shared/speculos";
import { setEnv } from "@shared/env";
import { sanitizeError } from "@ledgerhq/live-e2e-shared/index";
import { execSync } from "node:child_process";
import { waitForSpeculosReady } from "@ledgerhq/live-e2e-shared/speculosCI";
import { addKnownSpeculos, getEnvs, removeKnownSpeculos } from "@e2e-mobile/bridge/server";
import { trackSpeculos, untrackSpeculos } from "@e2e-mobile/utils/SpeculosTrackingFile";
import logger from "@wdio/logger";

const speculosUtilsLogger = logger("Speculos Utils");

import { CLIUtils } from "@e2e-mobile/utils/CLIUtils";

export type Entry = {
  name: string;
  speculosPort: number;
  deviceId: string;
};

export class SpeculosUtils {
  /** Device id to API port for the Speculos instances this worker started. */
  private static readonly speculosDevices = new Map<string, number>();

  static resetSpeculosDevices = () => {
    SpeculosUtils.speculosDevices.clear();
  };

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
    const testName = "unknown";
    let device;
    try {
      device = await startSpeculos(testName ?? "cli_speculos", specs[appName.replace(/ /g, "_")], {
        suite: "mobile-e2e",
      });
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e));
      const message = ["Speculos failed to start", err.message].filter(Boolean).join("\n\n");
      speculosUtilsLogger.error(message);
      throw new Error(err.message);
    }

    if (!device) {
      throw new Error("Speculos not started");
    }

    if (!device.port) {
      const remoteHint = SpeculosUtils.isSpeculosRemote()
        ? " Remote Speculos (Speculinho) did not return an API port — check logs above for POST /acquire errors, SPECULINHO_URL, and SEED."
        : "";
      const message = [
        "Speculos port not set.",
        `deviceId: ${device.id}, appName: ${device.appName ?? appName}${remoteHint}`,
      ].join(" ");
      speculosUtilsLogger.error(message);
      throw new Error(message);
    }
    setEnv("SPECULOS_API_PORT", device.port);
    SpeculosUtils.speculosDevices.set(device.id, device.port);

    await trackSpeculos(device.id);
    speculosUtilsLogger.info("Device info before map set:", {
      port: device.port,
      deviceId: device.id,
    });

    let info = `App: ${device.appName || ""} (${device.appVersion || ""}) `;
    if (device.dependencies?.length)
      info += `\nDependencies: ${device.dependencies?.map(dep => dep.name + " (" + dep.appVersion + ")").join(", ") || ""}`;

    // TODO: CUSTOM -> REMOVE!
    speculosUtilsLogger.info(
      `Speculos started for device ${device.id} on port ${device.port}. ${info}`,
    );

    return device;
  };

  static registerSpeculos = async (speculosPort: number) => {
    const speculosAddress = process.env.SPECULOS_ADDRESS;
    if (driver.isAndroid && !SpeculosUtils.isSpeculosRemote()) {
      const deviceID = driver.capabilities.deviceUDID ?? driver.capabilities["appium:deviceName"];
      execSync(`adb -s ${deviceID} reverse tcp:${speculosPort} tcp:${speculosPort}`);
    }
    process.env.SPECULOS_API_PORT = speculosPort.toString();
    delete process.env.DEVICE_PROXY_URL;
    CLIUtils.registerSpeculosTransport(speculosPort.toString(), speculosAddress);
    setEnv("SPECULOS_API_PORT", speculosPort);
  };

  static deleteSpeculos = async (deviceId?: string): Promise<number | undefined> => {
    if (!deviceId) {
      if (!SpeculosUtils.speculosDevices.size) {
        speculosUtilsLogger.info("E2E", "No active Speculos instances to stop.");
        return;
      }

      for (const [id, port] of SpeculosUtils.speculosDevices.entries()) {
        try {
          speculosUtilsLogger.info("E2E", `Stopping Speculos with device ${id} and port ${port}`);
          await SpeculosUtils.deleteSpeculos(id);
        } catch (error) {
          speculosUtilsLogger.warn(
            "E2E",
            `Failed to stop Speculos with device ${id} port ${port}}: ${sanitizeError(error)}`,
          );
        }
      }
      return;
    }

    const port = await SpeculosUtils.findPortByDeviceId(deviceId);

    await stopSpeculos(deviceId);
    SpeculosUtils.speculosDevices.delete(deviceId);
    await untrackSpeculos(deviceId);

    speculosUtilsLogger.info("E2E", `Speculos successfully stopped for device ${deviceId}`);
    setEnv("SPECULOS_API_PORT", 0);
    delete process.env.SPECULOS_API_PORT;

    return port;
  };

  static findPortByDeviceId = async (
    deviceId: string,
    maxAttempts = 3,
    delay = 1000,
  ): Promise<number | undefined> => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      speculosUtilsLogger.info(
        "E2E",
        `Current speculosDevices map (attempt ${attempt}/${maxAttempts}):`,
        Array.from(SpeculosUtils.speculosDevices.entries())
          .map(([id, p]) => `${id} -> ${p ?? "(null)"}`)
          .join(", "),
      );

      if (SpeculosUtils.speculosDevices.has(deviceId)) {
        return SpeculosUtils.speculosDevices.get(deviceId);
      }

      if (attempt < maxAttempts) {
        speculosUtilsLogger.info(
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
    if (speculosPort) {
      if (driver.isAndroid && !SpeculosUtils.isSpeculosRemote()) {
        const deviceID = driver.capabilities.deviceUDID ?? driver.capabilities["appium:deviceName"];
        execSync(`adb -s ${deviceID} reverse --remove tcp:${speculosPort}`);
      }
      const knownAddress = SpeculosUtils.getKnownSpeculosAddress(speculosPort);
      await removeKnownSpeculos(knownAddress);
    }
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
        speculosUtilsLogger.info(
          `\n🔄 [${speculosApp.name}] Main setup attempt ${attempt}/${maxRetries}`,
        );

        if (SpeculosUtils.isSpeculosRemote()) {
          await waitForSpeculosReady(main.deviceId);
        }
        await SpeculosUtils.registerSpeculos(main.speculosPort);
        await SpeculosUtils.registerKnownSpeculos(main.speculosPort);
        speculosUtilsLogger.info(
          `✅ [${speculosApp.name}] Main Speculos registered successfully on port ${main.speculosPort}`,
        );

        lastError = undefined;
        break;
      } catch (err) {
        lastError = err;

        if (attempt < maxRetries) {
          // checkTestFailed(); TODO: review

          speculosUtilsLogger.info(
            `[${speculosApp.name}] Creating new main Speculos instance for retry`,
          );
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

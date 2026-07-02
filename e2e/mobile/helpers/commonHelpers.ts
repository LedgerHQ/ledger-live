import { close as closeBridge, findFreePort, init as initBridge } from "../bridge/server";
import { getEnv, setEnv } from "@ledgerhq/live-env";
import { exec } from "child_process";
import { device, log } from "detox";
import { allure } from "jest-allure2-reporter/api";
import { Device } from "@ledgerhq/live-common/e2e/enum/Device";
import { readFile } from "fs/promises";
import { NANO_APP_CATALOG_PATH } from "../utils/constants";
import { sanitizeError } from "@ledgerhq/live-common/e2e/index";

const BASE_DEEPLINK = "ledgerlive://";

export const currencyParam = "?currency=";

export const isWallet40 = process.env.E2E_ENABLE_WALLET40 !== "0";

/**
 * Waits for a specified amount of time
 * /!\ Do not use it to wait for a specific element, use waitFor instead.
 * @param {number} ms
 */
export async function delay(ms: number) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve("delay complete");
    }, ms);
  });
}

/** @param path the part after "ledgerlive://", e.g. "portfolio", or "discover?param=123"  */
export async function openDeeplink(path?: string) {
  await device.openURL({ url: BASE_DEEPLINK + path });
}

export const describeIfNotNanoS = (...args: Parameters<typeof describe>) =>
  process.env.SPECULOS_DEVICE !== Device.LNS.name
    ? describe(...args)
    : describe.skip("[not available on LNS] " + args[0], args[1]);

export function isAndroid(): boolean {
  return device.getPlatform() === "android";
}

export function isIos(): boolean {
  return device.getPlatform() === "ios";
}

export function isSpeculosRemote(): boolean {
  return process.env.REMOTE_SPECULOS === "true";
}

export function isRemoteIos(): boolean {
  return isSpeculosRemote() && isIos();
}

/**
 * Creates a regex string for Detox URL blacklisting
 * @returns Formatted regex string for Detox
 */
function createDetoxURLBlacklistRegex(): string {
  const patterns = [
    ".*sdk.*.braze.*",
    ".*.googleapis.com/.*",
    ".*clients3.google.com.*",
    ".*tron.coin.ledger.com/wallet/getBrokerage.*",
    ".*crypto-assets-service.api.ledger.com.*",
    ".*127.0.0.1.*",
    ".*speculos.*ldg-tech.com.*",
    ".*optimism.*",
    ".*speculos.ledgerlabs.net.*",
  ];

  return `\\("${patterns.join('","')}"\\)`;
}

export async function launchApp(customConfig: Detox.DeviceLaunchAppConfig = {}) {
  const port = await findFreePort();
  closeBridge();
  initBridge(port);
  await device.launchApp({
    launchArgs: {
      wsPort: port,
      detoxURLBlacklistRegex: createDetoxURLBlacklistRegex(),
      mock: "0",
      disable_broadcast: getEnv("DISABLE_TRANSACTION_BROADCAST") ? 1 : 0,
      IS_TEST: true,
    },
    languageAndLocale: {
      language: "en-US",
      locale: "en-US",
    },
    permissions: {
      camera: "YES",
    },
    ...customConfig,
  });
  return port;
}

/**
 * Simulate an abrupt, uncatchable loss of the app process — the way an OOM / jetsam
 * kill takes the app down in the wild. Sends SIGKILL to the app via `simctl terminate`
 * (iOS) or `am force-stop` (Android); neither delivers a signal Detox's in-app crash
 * handler can catch. Because Detox is never told, it does not relaunch, so the next
 * interaction fails with "The app has unexpectedly disconnected from Detox server" /
 * "Detox can't seem to connect to the test app(s)!" — the CI connection-loss signature,
 * as opposed to "The app has crashed" (a caught crash) or "The app is busy" (a JS freeze).
 *
 * Contrast with `device.terminateApp()`, which Detox performs knowingly and cleanly.
 *
 * @param bundleId app id to kill; defaults to the e2e build id for the current platform.
 */
export function killApp(bundleId?: string): Promise<void> {
  // device.id is this worker's simulator UDID (iOS) / adb id (Android): parallel-safe.
  const id = bundleId ?? (isIos() ? "com.ledger.live" : "com.ledger.live.detox");
  const cmd = isIos()
    ? `xcrun simctl terminate ${device.id} ${id}`
    : `adb -s ${device.id} shell am force-stop ${id}`;
  log.info(`[killApp] simulating Detox connection loss: ${cmd}`);
  return new Promise<void>((resolve, reject) => {
    exec(cmd, error => (error ? reject(error) : resolve()));
  });
}

/**
 * Kill the app with an optional delay before or after the kill.
 * @param delayMs wait duration in milliseconds
 * @param options.when `"before"` (default) waits then kills; `"after"` kills then waits
 */
export async function killAppWithDelay(
  delayMs: number,
  options: { bundleId?: string; when?: "before" | "after" } = {},
): Promise<void> {
  const when = options.when ?? "before";
  if (when === "before") await delay(delayMs);
  await killApp(options.bundleId);
  if (when === "after") await delay(delayMs);
}

export function setupEnvironment() {
  setEnv("DISABLE_APP_VERSION_REQUIREMENTS", true);
  setEnv("MOCK", "");
  process.env.MOCK = "";
  setEnv("DETOX", "1");
  setEnv("E2E_NANO_APP_VERSION_PATH", NANO_APP_CATALOG_PATH);

  const disableBroadcastEnv = process.env.DISABLE_TRANSACTION_BROADCAST;
  const shouldBroadcast = disableBroadcastEnv === "0";
  setEnv("DISABLE_TRANSACTION_BROADCAST", !shouldBroadcast);
}

export const logMemoryUsage = (): Promise<void> => {
  const pid = process.pid;
  const isLinux = process.platform !== "darwin";
  const topArgs = isLinux ? `-b -n 1 -p ${pid}` : `-l 1 -pid ${pid}`;
  return new Promise<void>(resolve => {
    exec(
      `top ${topArgs} | grep "${pid}" | awk '{print ${isLinux ? "$6" : "$8"}}'`,
      async (error: Error | null, stdout: string, stderr: string): Promise<void> => {
        if (error || stderr) {
          log.error(
            `Error getting memory usage:\n Error: ${sanitizeError(error)}\n Stderr: ${stderr}`,
          );
          resolve();
          return;
        }
        const logMessage = `📦 Detox Memory Usage: ${stdout.trim()}`;
        await allure.attachment("Memory Usage Details", logMessage, "text/plain");
        log.warn(logMessage);
        resolve();
      },
    );
  });
};

export async function takeAppScreenshot(screenshotName: string) {
  try {
    const screenshotPath = await device.takeScreenshot(screenshotName);
    if (screenshotPath) {
      const screenshotData = await readFile(screenshotPath);
      await allure.attachment(`App Screenshot: ${screenshotName}`, screenshotData, "image/png");
    }
  } catch (error) {
    log.error(`Error taking app screenshot: ${sanitizeError(error)}`);
  }
}

export async function captureNativeViewHierarchy(
  label = "Native View Hierarchy at failure",
): Promise<void> {
  try {
    const xml = await device.generateViewHierarchyXml();
    if (xml) {
      await allure.attachment(label, xml, "text/xml");
    }
  } catch (error) {
    log.warn(`Could not capture native view hierarchy: ${sanitizeError(error)}`);
  }
}

export const normalizeText = (text: string) =>
  text
    .replace(/\s+/g, " ")
    .replace(/\u202F/g, " ")
    .trim();

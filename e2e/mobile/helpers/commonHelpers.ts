import { close as closeBridge, findFreePort, init as initBridge } from "../bridge/server";
import { getEnv, setEnv } from "@ledgerhq/live-env";
import { exec } from "child_process";
import { device, log } from "detox";
import { allure } from "jest-allure2-reporter/api";
import { Device } from "@ledgerhq/live-common/e2e/enum/Device";

const BASE_DEEPLINK = "ledgerlive://";

export const currencyParam = "?currency=";

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
  process.env.SPECULOS_DEVICE !== Device.LNS
    ? describe(...args)
    : describe.skip("[not avilable on LNS] " + args[0], args[1]);

export function isAndroid() {
  return device.getPlatform() === "android";
}

export function isIos() {
  return device.getPlatform() === "ios";
}

export function isSpeculosRemote() {
  return process.env.REMOTE_SPECULOS === "true";
}

export async function launchApp() {
  const port = await findFreePort();
  closeBridge();
  initBridge(port);
  await device.launchApp({
    launchArgs: {
      wsPort: port,
      detoxURLBlacklistRegex:
        '\\(".*sdk.*.braze.*",".*.googleapis.com/.*",".*clients3.google.com.*",".*tron.coin.ledger.com/wallet/getBrokerage.*"\\)',
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
  });
  return port;
}

export function setupEnvironment() {
  setEnv("DISABLE_APP_VERSION_REQUIREMENTS", true);
  setEnv("MOCK", "");
  process.env.MOCK = "";
  setEnv("DETOX", "1");
  process.env.SPECULOS_DEVICE = process.env.SPECULOS_DEVICE || Device.LNSP;

  const disableBroadcastEnv = process.env.DISABLE_TRANSACTION_BROADCAST;
  const shouldBroadcast = disableBroadcastEnv === "0";
  setEnv("DISABLE_TRANSACTION_BROADCAST", !shouldBroadcast);
}

export const logMemoryUsage = async (): Promise<void> => {
  const pid = process.pid;
  const isLinux = process.platform !== "darwin";
  const topArgs = isLinux ? `-b -n 1 -p ${pid}` : `-l 1 -pid ${pid}`;
  exec(
    `top ${topArgs} | grep "${pid}" | awk '{print ${isLinux ? "$6" : "$8"}}'`,
    async (error: Error | null, stdout: string, stderr: string): Promise<void> => {
      if (error || stderr) {
        log.error(`Error getting memory usage:\n Error: ${error}\n Stderr: ${stderr}`);
        return;
      }
      const logMessage = `📦 Detox Memory Usage: ${stdout.trim()}`;
      await allure.attachment("Memory Usage Details", logMessage, "text/plain");
      log.warn(logMessage);
    },
  );
};

import { findFreePort, close as closeBridge, init as initBridge } from "../bridge/server";
import { getEnv } from "@ledgerhq/live-env";
import { exec } from "child_process";
import { device, log } from "detox";
import { allure } from "jest-allure2-reporter/api";

const BASE_DEEPLINK = "ledgerlive://";

export const itifAndroid = (...args: Parameters<typeof test>) =>
  isAndroid() ? test(...args) : test.skip("[Android only] " + args[0], args[1], args[2]);
export const describeifAndroid = (...args: Parameters<typeof describe>) =>
  isAndroid() ? describe(...args) : describe.skip("[Android only] " + args[0], args[1]);
export const currencyParam = "?currency=";
export const recipientParam = "&recipient=";
export const amountParam = "&amount=";
export const accountIdParam = "?accountId=";

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

export function isAndroid() {
  return device.getPlatform() === "android";
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
      mock: getEnv("MOCK") ? getEnv("MOCK") : "0",
      disable_broadcast: getEnv("DISABLE_TRANSACTION_BROADCAST") ? 1 : 0,
    },
    languageAndLocale: {
      language: "en-US",
      locale: "en-US",
    },
    permissions: {
      camera: "YES", // Give iOS permissions for the camera
    },
  });
  return port;
}

export const logMemoryUsage = async () => {
  const pid = process.pid;
  exec(
    `top -pid ${pid} -l 1 | grep -E '^[ ]*${pid}' | awk '{for(i=1;i<=NF;i++) if ($i ~ /[MG]/) {print $i; exit}}'`,
    async (error, stdout, stderr) => {
      if (error || stderr) {
        console.error(`Error getting memory usage:\n ${error}\n ${stderr}`);
        return;
      }
      const memoryUsed = stdout.trim();
      let memoryUsedGB = 0;

      if (memoryUsed.includes("M")) {
        memoryUsedGB = parseFloat(memoryUsed.replace("M", "")) / 1024;
      } else if (memoryUsed.includes("G")) {
        memoryUsedGB = parseFloat(memoryUsed.replace("G", ""));
      }
      const logMessage = `📦 Detox Memory Usage: ${memoryUsedGB.toFixed(2)} GB`;
      await allure.attachment("Memory Usage Details", logMessage, "text/plain");
      log.warn(logMessage);
    },
  );
};

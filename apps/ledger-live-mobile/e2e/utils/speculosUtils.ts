import { allure } from "jest-allure2-reporter/api";
import {
  startSpeculos,
  stopSpeculos,
  specs,
  takeScreenshot,
} from "@ledgerhq/live-common/e2e/speculos";
import invariant from "invariant";
import { setEnv } from "@ledgerhq/live-env";
import { startProxy, closeProxy } from "../bridge/proxy";
import { device } from "detox";

const BASE_DEEPLINK = "ledgerlive://";

export const itifAndroid = (...args: Parameters<typeof test>) =>
  isAndroid() ? test(...args) : test.skip("[Android only] " + args[0], args[1], args[2]);
export const describeifAndroid = (...args: Parameters<typeof describe>) =>
  isAndroid() ? describe(...args) : describe.skip("[Android only] " + args[0], args[1]);
export const currencyParam = "?currency=";
export const recipientParam = "&recipient=";
export const amountParam = "&amount=";
export const accountIdParam = "?accountId=";

const BASE_PORT = 30000;
const MAX_PORT = 65535;
let portCounter = BASE_PORT; // Counter for generating unique ports

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
  const speculosDevice = await startSpeculos(testName, specs[appName.replace(/ /g, "_")]);
  invariant(speculosDevice, "[E2E Setup] Speculos not started");

  const speculosApiPort = speculosDevice.ports.apiPort;
  invariant(speculosApiPort, "[E2E Setup] speculosApiPort not defined");
  setEnv("SPECULOS_API_PORT", speculosApiPort);
  speculosDevices.set(speculosApiPort, speculosDevice.id);
  console.warn(`Speculos ${speculosDevice.id} started on ${speculosApiPort}`);
  return speculosApiPort;
}

export async function launchProxy(
  proxyPort: number,
  speculosAddress?: string,
  speculosPort?: number,
) {
  await device.reverseTcpPort(proxyPort);
  await startProxy(proxyPort, speculosAddress, speculosPort);
}

export async function deleteSpeculos(apiPort?: number) {
  if (!apiPort) {
    await Promise.all(Array.from(speculosDevices.keys()).map(async port => deleteSpeculos(port)));
    return;
  }

  if (speculosDevices.has(apiPort)) {
    const speculosId = speculosDevices.get(apiPort);
    if (speculosId) await stopSpeculos(speculosId);
    speculosDevices.delete(apiPort);
    console.warn(`Speculos successfully stopped on port ${apiPort}`);
  } else console.warn(`Speculos not found on port ${apiPort}`);
  setEnv("SPECULOS_API_PORT", 0);
  const proxyPrort = closeProxy(apiPort);
  return proxyPrort;
}

export async function takeSpeculosScreenshot() {
  for (const [apiPort] of speculosDevices) {
    const speculosScreenshot = await takeScreenshot(apiPort);
    speculosScreenshot &&
      (await allure.attachment("Speculos Screenshot", speculosScreenshot, "image/png"));
  }
}

import { by, element, waitFor, device, web } from "detox";
import { Direction } from "detox/detox";
import { findFreePort, close as closeBridge, init as initBridge } from "./bridge/server";
import { allure } from "jest-allure2-reporter/api";

import {
  startSpeculos,
  stopSpeculos,
  specs,
  takeScreenshot,
} from "@ledgerhq/live-common/e2e/speculos";
import invariant from "invariant";
import { getEnv, setEnv } from "@ledgerhq/live-env";
import { startProxy, closeProxy } from "./bridge/proxy";

const DEFAULT_TIMEOUT = 60000; // 60s !!
const BASE_DEEPLINK = "ledgerlive://";
const startPositionY = 0.8; // Needed on Android to scroll views : https://github.com/wix/Detox/issues/3918

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

export function setupEnvironment() {
  setEnv("DISABLE_APP_VERSION_REQUIREMENTS", true);

  if (process.env.MOCK == "0") {
    setEnv("MOCK", "");
    process.env.MOCK = "";
  } else {
    setEnv("MOCK", "1");
    process.env.MOCK = "1";
  }

  if (process.env.DISABLE_TRANSACTION_BROADCAST == "0") {
    setEnv("DISABLE_TRANSACTION_BROADCAST", false);
  } else if (getEnv("MOCK") != "1") {
    setEnv("DISABLE_TRANSACTION_BROADCAST", true);
  }
}

function sync_delay(ms: number) {
  const done = new Int32Array(new SharedArrayBuffer(4));
  Atomics.wait(done, 0, 0, ms); // Wait for the specified duration
}

export function waitForElementById(id: string | RegExp, timeout: number = DEFAULT_TIMEOUT) {
  return waitFor(element(by.id(id)))
    .toBeVisible()
    .withTimeout(timeout);
}

export function waitForElementByText(text: string | RegExp, timeout: number = DEFAULT_TIMEOUT) {
  return waitFor(element(by.text(text)))
    .toBeVisible()
    .withTimeout(timeout);
}

export function getElementById(id: string | RegExp, index = 0) {
  if (!isAndroid()) sync_delay(200); // Issue with RN75 : QAA-370
  return element(by.id(id)).atIndex(index);
}

export function getElementByText(text: string | RegExp, index = 0) {
  if (!isAndroid()) sync_delay(200); // Issue with RN75 : QAA-370
  return element(by.text(text)).atIndex(index);
}

export function getWebElementById(id: string, index = 0) {
  if (!isAndroid()) sync_delay(200); // Issue with RN75 : QAA-370
  return web.element(by.web.id(id)).atIndex(index);
}

export function getWebElementByTag(tag: string, index = 0) {
  if (!isAndroid()) sync_delay(200); // Issue with RN75 : QAA-370
  return web.element(by.web.tag(tag)).atIndex(index);
}

export async function IsIdVisible(id: string | RegExp) {
  try {
    await waitFor(element(by.id(id)))
      .toBeVisible()
      .withTimeout(1000);
    return true;
  } catch {
    return false;
  }
}

export async function tapById(id: string | RegExp, index = 0) {
  return await getElementById(id, index).tap();
}

export async function tapByText(text: string | RegExp, index = 0) {
  return await getElementByText(text, index).tap();
}

export async function tapByElement(elem: Detox.NativeElement) {
  await elem.tap();
}

export async function typeTextById(
  id: string | RegExp,
  text: string,
  closeKeyboard = true,
  focus = true,
) {
  await typeTextByElement(getElementById(id), text, closeKeyboard, focus);
}

export async function typeTextByElement(
  elem: Detox.NativeElement,
  text: string,
  closeKeyboard = true,
  focus = true,
) {
  if (focus) await tapByElement(elem);
  await elem.replaceText(text);
  if (closeKeyboard) await elem.typeText("\n"); // ' \n' close keyboard if open
}

export async function clearTextByElement(elem: Detox.NativeElement) {
  return await elem.clearText();
}

async function performScroll(
  elementMatcher: Detox.NativeMatcher,
  scrollViewId?: string | RegExp,
  pixels = 300,
  direction: Direction = "down",
) {
  const scrollViewMatcher = scrollViewId
    ? by.id(scrollViewId)
    : by.type(isAndroid() ? "android.widget.ScrollView" : "RCTScrollView");
  if (!isAndroid()) sync_delay(200); // Issue with RN75 : QAA-370
  await waitFor(element(elementMatcher))
    .toBeVisible()
    .whileElement(scrollViewMatcher)
    .scroll(pixels, direction, NaN, startPositionY);
  if (isAndroid()) await delay(30); // Issue on tap after scroll on Android : https://github.com/wix/Detox/issues/3637
}

export async function scrollToText(
  text: string | RegExp,
  scrollViewId?: string | RegExp,
  pixels?: number,
  direction?: Direction,
) {
  await performScroll(by.text(text), scrollViewId, pixels, direction);
}

export async function scrollToId(
  // Index broken on Android :  https://github.com/wix/Detox/issues/2931
  id: string | RegExp,
  scrollViewId?: string | RegExp,
  pixels?: number,
  direction?: Direction,
) {
  await performScroll(by.id(id), scrollViewId, pixels, direction);
}

export async function getTextOfElement(id: string | RegExp, index = 0) {
  const attributes = await getElementById(id, index).getAttributes();
  return (!("elements" in attributes) ? attributes.text : attributes.elements[index].text) || "";
}

export async function getIdOfElement(id: RegExp, index = 0) {
  const attributes = await getElementById(id, index).getAttributes();
  return (
    (!("elements" in attributes) ? attributes.identifier : attributes.elements[index].identifier) ||
    ""
  );
}

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
      IS_TEST: true,
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

export async function launchSpeculos(appName: string) {
  // Ensure the portCounter stays within the valid port range
  if (portCounter > MAX_PORT) {
    portCounter = BASE_PORT;
  }
  const speculosPort = portCounter++;
  const speculosPidOffset =
    (speculosPort - BASE_PORT) * 1000 + parseInt(process.env.JEST_WORKER_ID || "0") * 100;
  setEnv("SPECULOS_PID_OFFSET", speculosPidOffset);

  const testName = expect.getState().testPath || "unknown";
  const speculosDevice = await startSpeculos(testName, specs[appName.replace(/ /g, "_")]);
  invariant(speculosDevice, "[E2E Setup] Speculos not started");

  const speculosApiPort = speculosDevice.ports.apiPort;
  invariant(speculosApiPort, "[E2E Setup] speculosApiPort not defined");
  setEnv("SPECULOS_API_PORT", speculosApiPort);
  speculosDevices.set(speculosApiPort, speculosDevice.id);
  console.warn(`Speculos started on ${speculosApiPort}`);
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

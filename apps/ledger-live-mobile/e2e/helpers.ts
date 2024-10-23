import { by, element, waitFor, device } from "detox";
import { Direction } from "detox/detox";
import { findFreePort, close as closeBridge, init as initBridge } from "./bridge/server";

import { startSpeculos, stopSpeculos, specs } from "@ledgerhq/live-common/e2e/speculos";
import { SpeculosDevice } from "@ledgerhq/speculos-transport";
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
const speculosDevices: [number, SpeculosDevice][] = [];

export async function waitForElementById(id: string | RegExp, timeout: number = DEFAULT_TIMEOUT) {
  return await waitFor(getElementById(id)).toBeVisible().withTimeout(timeout);
}

export async function waitForElementByText(
  text: string | RegExp,
  timeout: number = DEFAULT_TIMEOUT,
) {
  return await waitFor(getElementByText(text)).toBeVisible().withTimeout(timeout);
}

export function getElementById(id: string | RegExp, index = 0) {
  return element(by.id(id)).atIndex(index);
}

export function getElementByText(text: string | RegExp, index = 0) {
  return element(by.text(text)).atIndex(index);
}

export async function tapById(id: string | RegExp, index = 0) {
  return getElementById(id, index).tap();
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
        '\\(".*sdk.*.braze.*",".*.googleapis.com/.*",".*app.adjust.*",".*clients3.google.com.*"\\)',
      mock: getEnv("MOCK") ? getEnv("MOCK") : "0",
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

export async function launchSpeculos(appName: string, proxyPort: number) {
  // Ensure the portCounter stays within the valid port range
  if (portCounter > MAX_PORT) {
    portCounter = BASE_PORT;
  }
  const speculosPort = portCounter++;
  const speculosPidOffset =
    (speculosPort - BASE_PORT) * 1000 + parseInt(process.env.TEST_WORKER_INDEX || "0") * 100;
  setEnv("SPECULOS_PID_OFFSET", speculosPidOffset);

  const testName = expect.getState().testPath || "unknown";
  const speculosDevice = await startSpeculos(testName, specs[appName]);
  invariant(speculosDevice, "[E2E Setup] Speculos not started");

  const speculosApiPort = speculosDevice.ports.apiPort;
  invariant(speculosApiPort, "[E2E Setup] speculosApiPort not defined");
  setEnv("SPECULOS_API_PORT", speculosApiPort);
  speculosDevices.push([proxyPort, speculosDevice]);
  console.warn(`Speculos started on ${proxyPort}`);
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

export async function deleteSpeculos(proxyPort?: number) {
  if (!proxyPort) {
    for (const [address] of speculosDevices) {
      await deleteSpeculos(address);
    }
    return;
  }
  if (proxyPort) closeProxy(proxyPort);
  const speculosDevice = speculosDevices.find(([number]) => number === proxyPort)?.[1];
  if (speculosDevice) {
    await stopSpeculos(speculosDevice);
    speculosDevices.splice(speculosDevices.indexOf([proxyPort, speculosDevice]));
    console.warn(`Speculos stopped on ${proxyPort}`);
  }
  setEnv("SPECULOS_API_PORT", 0);
}

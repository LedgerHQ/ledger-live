import { by, element, waitFor, device } from "detox";
import { Direction } from "detox/detox";

const DEFAULT_TIMEOUT = 60000; // 60s !!
const BASE_DEEPLINK = "ledgerlive://";
const startPositionY = 0.8; // Needed on Android to scroll views : https://github.com/wix/Detox/issues/3918
export const itifAndroid = (...args: Parameters<typeof test>) =>
  isAndroid() ? test(...args) : test.skip("[Android only] " + args[0], args[1], args[2]);
export const currencyParam = "?currency=";
export const recipientParam = "&recipient=";
export const amountParam = "&amount=";
export const accountIdParam = "?accountId=";

export function waitForElementById(id: string | RegExp, timeout: number = DEFAULT_TIMEOUT) {
  return waitFor(getElementById(id)).toBeVisible().withTimeout(timeout);
}

export function waitForElementByText(text: string | RegExp, timeout: number = DEFAULT_TIMEOUT) {
  return waitFor(getElementByText(text)).toBeVisible().withTimeout(timeout);
}

export function getElementById(id: string | RegExp, index = 0) {
  return element(by.id(id)).atIndex(index);
}

export function getElementByText(text: string | RegExp, index = 0) {
  return element(by.text(text)).atIndex(index);
}

export function tapById(id: string | RegExp, index = 0) {
  return getElementById(id, index).tap();
}

export function tapByText(text: string | RegExp, index = 0) {
  return getElementByText(text, index).tap();
}

export function tapByElement(elem: Detox.NativeElement) {
  return elem.tap();
}

export async function typeTextById(id: string | RegExp, text: string, focus = true) {
  if (focus) {
    await tapById(id);
  }
  return getElementById(id).typeText(text);
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
  return elem.clearText();
}

export async function scrollToText(
  text: string | RegExp,
  scrollViewId: string,
  pixels = 300,
  direction: Direction = "down",
) {
  await waitFor(element(by.text(text)))
    .toBeVisible()
    .whileElement(by.id(scrollViewId))
    .scroll(pixels, direction, NaN, startPositionY);
}

export async function scrollToId(
  // Index broken on Android :  https://github.com/wix/Detox/issues/2931
  id: string | RegExp,
  scrollViewId: string | RegExp,
  pixels = 300,
  direction: Direction = "down",
) {
  await waitFor(element(by.id(id)))
    .toBeVisible()
    .whileElement(by.id(scrollViewId))
    .scroll(pixels, direction, NaN, startPositionY);
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
export function openDeeplink(path?: string) {
  return device.openURL({ url: BASE_DEEPLINK + path });
}

export function isAndroid() {
  return device.getPlatform() === "android";
}

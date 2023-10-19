import { by, element, waitFor, device } from "detox";
import { Direction } from "react-native-modal";

const DEFAULT_TIMEOUT = 60000;
const BASE_DEEPLINK = "ledgerlive://";
const startPositionY = 0.8; // Needed on Android to scroll views : https://github.com/wix/Detox/issues/3918
export const currencyParam = "?currency=";
export const recipientParam = "&recipient=";
export const amountParam = "&amount=";
export const accountIdParam = "?accountId=";

export function waitForElementById(id: string, timeout: number = DEFAULT_TIMEOUT) {
  return waitFor(getElementById(id)).toBeVisible().withTimeout(timeout);
}

export function waitForElementByText(text: string, timeout: number = DEFAULT_TIMEOUT) {
  return waitFor(getElementByText(text)).toBeVisible().withTimeout(timeout);
}

export function waitForElementToExistWithUniqueId(id: string, timeout: number = DEFAULT_TIMEOUT) {
  return waitFor(element(by.id(id)))
    .toExist()
    .withTimeout(timeout);
}

export function waitForElementWithUniqueText(text: string, timeout: number = DEFAULT_TIMEOUT) {
  return waitFor(getElementByUniqueText(text)).toExist().withTimeout(timeout);
}

/**
 * NB: Index is not recommended. Use unique ids or text instead.
 * Indices may not match between iOS and Android. Relying on indices may also introduce flakiness in tests as the UI is updated. See: https://wix.github.io/Detox/docs/api/matchers/#atindexindex
 */
export function getElementById(id: string, index = 0) {
  return element(by.id(id)).atIndex(index);
}

export function getElementByText(text: string, index = 0) {
  return element(by.text(text)).atIndex(index);
}

export function getElementByUniqueId(id: string) {
  return element(by.id(id));
}

/** Text should be unique */
export function getElementByUniqueText(text: string) {
  return element(by.text(text));
}

export function tapById(id: string, index = 0) {
  return getElementById(id, index).tap();
}

export function tapByText(text: string, index = 0) {
  return getElementByText(text, index).tap();
}

export function tapByElement(elem: Detox.NativeElement) {
  return elem.tap();
}

export async function typeTextById(id: string, text: string, focus = true) {
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
  if (focus) {
    await tapByElement(elem);
  }
  await elem.typeText(text + (closeKeyboard ? "\n" : "")); // ' \n' close keyboard if open
}

export async function clearTextByElement(elem: Detox.NativeElement) {
  return elem.clearText();
}

export async function scrollToText(
  text: string,
  scrollViewId: string,
  pixels = 100,
  direction: Direction = "down",
) {
  await waitFor(element(by.text(text)))
    .toBeVisible()
    .whileElement(by.id(scrollViewId))
    .scroll(pixels, direction);
}

export async function scrollToId(
  // Index broken on Android :  https://github.com/wix/Detox/issues/2931
  id: string,
  scrollViewId: string,
  pixels = 100,
  direction: Direction = "down",
) {
  await waitFor(element(by.id(id)))
    .toBeVisible()
    .whileElement(by.id(scrollViewId))
    .scroll(pixels, direction, NaN, startPositionY);
}

export async function getTextOfElement(id: string, index = 0) {
  const attributes = await getElementById(id, index).getAttributes();
  return !("elements" in attributes) ? attributes.text : attributes.elements[index].text;
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

import { by, device, element, waitFor } from "detox";
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

export function getElementById(id: string, index = 0) {
  return element(by.id(id)).atIndex(index);
}

export function getElementByText(text: string, index = 0) {
  return element(by.text(text)).atIndex(index);
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

export async function typeTextByElement(elem: Detox.NativeElement, text: string, focus = true) {
  if (focus) {
    await tapByElement(elem);
  }
  await elem.typeText(text);
}

export async function clearTextByElement(elem: Detox.NativeElement) {
  return elem.clearText();
}

export async function scrollToText(
  text: string,
  scrollViewId: string,
  index = 0,
  pixels = 100,
  direction: Direction = "down",
) {
  await waitFor(getElementByText(text, index))
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

export async function openDeeplink(link?: string) {
  await device.openURL({ url: BASE_DEEPLINK + link });
}

export function isAndroid() {
  return device.getPlatform() === "android";
}

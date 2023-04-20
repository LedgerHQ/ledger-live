import { by, device, element, waitFor } from "detox";
import { Direction } from "react-native-modal";

const DEFAULT_TIMEOUT = 60000;
const BASE_DEEPLINK: string = "ledgerlive://";
export const currencyParam: string = "?currency=";
export const recipientParam: string = "&recipient=";
export const amountParam: string = "&amount=";
export const accountIdParam: string = "?accountId=";

export function waitForElementByID(elementId: string, timeout?: number) {
  return waitFor(element(by.id(elementId)))
    .toBeVisible()
    .withTimeout(timeout || DEFAULT_TIMEOUT);
}

export function waitForElementByText(text: string, timeout?: number) {
  return waitFor(element(by.text(text)))
    .toBeVisible()
    .withTimeout(timeout || DEFAULT_TIMEOUT);
}

export function getElementById(id: string) {
  return element(by.id(id));
}

export function getElementByText(text: string) {
  return element(by.text(text));
}

export function tapById(id: string, index?: number) {
  return element(by.id(id))
    .atIndex(index || 0)
    .tap();
}

export function tapByText(text: string, index?: number) {
  return element(by.text(text))
    .atIndex(index || 0)
    .tap();
}

export function tapByElement(elem: Detox.IndexableNativeElement, index = 0) {
  return elem.atIndex(index || 0).tap();
}

export async function typeTextById(id: string, text: string, focus = true) {
  if (focus) {
    await tapById(id);
  }
  return getElementById(id).typeText(text);
}

export async function typeTextByElement(
  elem: Detox.IndexableNativeElement,
  text: string,
  focus = true,
) {
  if (focus) {
    await tapByElement(elem);
  }

  await elem.typeText(text);
}

export async function scrollToText(
  text: string,
  scrollViewId: string,
  pixels = 100,
  direction: Direction = "down",
) {
  await waitFor(getElementByText(text))
    .toBeVisible()
    .whileElement(by.id(scrollViewId)) // where some is your ScrollView testID
    .scroll(pixels, direction);
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

export async function isAndroid() {
  return device.getPlatform() == "android";
}

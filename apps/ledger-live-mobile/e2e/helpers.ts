import { readFileSync } from "fs";
import { by, element, expect, waitFor } from "detox";

const DEFAULT_TIMEOUT = 60000;

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

export  function getElementById(id: string) {
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

export function tapByElement(
  elem: Detox.IndexableNativeElement,
  index = 0,
) {
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

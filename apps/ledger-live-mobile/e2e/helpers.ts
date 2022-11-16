import { readFileSync } from "fs";
import { by, element, expect, waitFor } from "detox";

const DEFAULT_TIMEOUT = 60000;

export function waitAndTap(elementId: string, timeout?: number) {
  waitFor(element(by.id(elementId)))
    .toBeVisible()
    .withTimeout(timeout || DEFAULT_TIMEOUT);

  return element(by.id(elementId)).tap();
}

export function waitForElement(elementId: string, timeout?: number) {
  return waitFor(element(by.id(elementId)))
    .toBeVisible()
    .withTimeout(timeout || DEFAULT_TIMEOUT);
}

export function waitForElementByText(text: string, timeout?: number) {
  return waitFor(element(by.text(text)))
    .toBeVisible()
    .withTimeout(timeout || DEFAULT_TIMEOUT);
}

export function tap(elementId: string) {
  return element(by.id(elementId)).tap();
}

export function tapByText(text: string, index?: number) {
  return element(by.text(text))
    .atIndex(index || 0)
    .tap();
}

export async function typeText(elementId: string, text: string, focus = true) {
  if (focus) {
    await tap(elementId);
  }
  return element(by.id(elementId)).typeText(text);
}

export function clearField(elementId: string) {
  element(by.id(elementId)).replaceText("");
}

export async function scrollToElementById(
  elementToScrollToId: string,
  parentElementId: string,
  pixelsToScroll: number,
  direction = "down",
  startPositionXAxis = NaN,
  startPositionYAxis = 0.5,
) {
  await waitFor(element(by.id(elementToScrollToId)))
    .toBeVisible()
    .whileElement(by.id(parentElementId))
    .scroll(
      pixelsToScroll,
      direction as Detox.Direction,
      startPositionXAxis,
      startPositionYAxis,
    );
}

export async function retryAction(
  action: () => Promise<void>,
  timeout?: number,
) {
  let shouldContinue = true;
  const startTime = Date.now();

  while (shouldContinue) {
    shouldContinue = false;

    try {
      await action();
    } catch {
      shouldContinue = true;
    }

    if (timeout && Date.now() - startTime > timeout) {
      throw new Error("Timed out when waiting for action");
    }

    // eslint-disable-next-line no-console
    console.log("Trying again...");
  }
}

export async function verifyIsVisible(elementId: string) {
  await delay(1000);
  await expect(element(by.id(elementId))).toBeVisible();
}

export async function verifyTextIsVisible(text: string) {
  await delay(1000);
  await expect(element(by.text(text))).toBeVisible();
}

export function delay(ms: number) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve("delay complete");
    }, ms);
  });
}

// for future use for screenshot conmparison
export function expectBitmapsToBeEqual(
  imagePath: string,
  expectedImagePath: string,
) {
  const bitmapBuffer = readFileSync(imagePath);
  const expectedBitmapBuffer = readFileSync(expectedImagePath);
  if (!bitmapBuffer.equals(expectedBitmapBuffer)) {
    throw new Error(
      `Expected image at ${imagePath} to be equal to image at ${expectedImagePath}, but it was different!`,
    );
  }
}

import { Direction, NativeElement, NativeMatcher, WebElement } from "detox/detox";
import { by, element, waitFor, web, expect as detoxExpect, log } from "detox";
import { delay, isAndroid } from "./commonHelpers";
import { retryUntilTimeout } from "../utils/retry";

interface IndexedWebElement extends WebElement {
  atIndex(index: number): WebElement;
}

const DEFAULT_TIMEOUT = 60000; // 60s
const START_POSITION_Y = 0.8; // Android scroll workaround: https://github.com/wix/Detox/issues/3918
const ANDROID_SCROLL_DELAY = 500; // Tap after scroll workaround: https://github.com/wix/Detox/issues/3637
const RN75_DELAY = 200; // React Native 75 workaround: QAA-370
const MAX_SCROLL_ATTEMPTS_PER_DIRECTION = 30; // Prevent infinite scrolling per direction
const SCROLL_STALL_THRESHOLD = 30; // Number of unchanged scrolls to detect limit

// Async delay
async function asyncDelay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// RN75 workaround wrapper
async function withRN75Delay<T>(fn: () => T): Promise<T> {
  if (!isAndroid()) await asyncDelay(RN75_DELAY);
  return fn();
}

export const NativeElementHelpers = {
  async waitForElementById(id: string | RegExp, timeout = DEFAULT_TIMEOUT): Promise<boolean> {
    const el = element(by.id(id));

    try {
      await detoxExpect(el).toBeVisible();
      return true;
    } catch {
      try {
        await waitFor(el).toBeVisible().withTimeout(timeout);
        return true;
      } catch {
        return false;
      }
    }
  },

  async waitForElementNotVisible(id: string | RegExp, timeout = DEFAULT_TIMEOUT): Promise<boolean> {
    const el = element(by.id(id));

    try {
      await detoxExpect(el).not.toBeVisible();
      return true;
    } catch {
      try {
        await waitFor(el).not.toBeVisible().withTimeout(timeout);
        return true;
      } catch {
        return false;
      }
    }
  },

  async waitForElementByText(text: string | RegExp, timeout = DEFAULT_TIMEOUT): Promise<boolean> {
    const el = element(by.text(text));

    try {
      await detoxExpect(el).toBeVisible();
      return true;
    } catch {
      try {
        await waitFor(el).toBeVisible().withTimeout(timeout);
        return true;
      } catch {
        return false;
      }
    }
  },

  async getElementsById(id: string | RegExp): Promise<NativeElement> {
    return withRN75Delay(() => element(by.id(id)));
  },

  async getElementById(id: string | RegExp, index = 0): Promise<NativeElement> {
    return withRN75Delay(() => element(by.id(id)).atIndex(index));
  },

  async getElementByText(text: string | RegExp, index = 0): Promise<NativeElement> {
    return withRN75Delay(() => element(by.text(text)).atIndex(index));
  },

  async isIdVisible(id: string | RegExp): Promise<boolean> {
    try {
      await waitFor(element(by.id(id)))
        .toBeVisible()
        .withTimeout(1000);
      return true;
    } catch {
      return false;
    }
  },

  async tapById(id: string | RegExp, index = 0): Promise<void> {
    await retryUntilTimeout(async () => {
      const el = await NativeElementHelpers.getElementById(id, index);
      await detoxExpect(el).toBeVisible();
      await el.tap();
    });
  },

  async tapByText(text: string | RegExp, index = 0): Promise<void> {
    await retryUntilTimeout(async () =>
      (await NativeElementHelpers.getElementByText(text, index)).tap(),
    );
  },

  async tapByElement(elem: NativeElement): Promise<void> {
    await retryUntilTimeout(async () => {
      return elem.tap();
    });
  },

  async typeTextById(
    id: string | RegExp,
    text: string,
    closeKeyboard = true,
    focus = true,
  ): Promise<void> {
    await NativeElementHelpers.typeTextByElement(
      await NativeElementHelpers.getElementById(id),
      text,
      closeKeyboard,
      focus,
    );
  },

  async typeTextByElement(
    elem: NativeElement,
    text: string,
    closeKeyboard = true,
    focus = true,
  ): Promise<void> {
    if (focus) await retryUntilTimeout(async () => elem.tap());
    await retryUntilTimeout(async () => elem.replaceText(text));
    if (closeKeyboard) await retryUntilTimeout(async () => elem.typeText("\n"));
  },

  async clearTextByElement(elem: NativeElement): Promise<void> {
    await retryUntilTimeout(async () => elem.clearText());
  },

  async performScroll(
    elementMatcher: NativeMatcher,
    scrollViewId?: string | RegExp,
    pixels = 300,
    direction: Direction = "down",
    androidDelay = ANDROID_SCROLL_DELAY,
  ): Promise<void> {
    if (!elementMatcher) {
      throw new Error("Element matcher is required");
    }

    const scrollElement = scrollViewId
      ? element(by.id(scrollViewId))
      : element(by.type(isAndroid() ? "android.widget.ScrollView" : "RCTScrollView")).atIndex(0);

    try {
      await waitFor(element(elementMatcher).atIndex(0)).toBeVisible().withTimeout(androidDelay);
      return;
    } catch {
      // Element not visible, proceed with scrolling
    }

    let currentDirection: Direction = direction;
    let topReached = false;
    let bottomReached = false;
    let totalAttempts = 0;
    let unchangedScrollCount = 0;
    let lastVisibleElementId: string | null = null;

    while (totalAttempts < MAX_SCROLL_ATTEMPTS_PER_DIRECTION * 2) {
      let currentVisibleElementId: string | null = null;
      try {
        await waitFor(element(elementMatcher).atIndex(0)).toBeVisible().withTimeout(androidDelay);
        currentVisibleElementId = JSON.stringify(elementMatcher);
        return;
      } catch {
        // Element not visible, continue scrolling
      }

      try {
        if (currentDirection == "bottom") {
          await scrollElement.scrollTo(currentDirection);
        } else {
          await scrollElement.scroll(pixels, currentDirection, NaN, START_POSITION_Y);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        log.warn(`Scroll attempt failed: ${errorMessage}`);
        unchangedScrollCount++;
      }

      // if (isAndroid() && androidDelay > 0) {
      //   await delay(androidDelay);
      // }

      if (currentVisibleElementId === lastVisibleElementId && elementMatcher) {
        unchangedScrollCount++;
      } else {
        unchangedScrollCount = 0;
        lastVisibleElementId = currentVisibleElementId;
      }

      if (unchangedScrollCount >= SCROLL_STALL_THRESHOLD) {
        if (currentDirection === "down") {
          bottomReached = true;
        } else {
          topReached = true;
        }

        currentDirection = currentDirection === "down" ? "up" : "down";
        unchangedScrollCount = 0;

        if (topReached && bottomReached) {
          throw new Error(
            `Failed to find element after reaching both scroll limits. Matcher: ${JSON.stringify(
              elementMatcher,
            )}`,
          );
        }
      }

      totalAttempts++;
    }

    throw new Error(
      `Failed to find element after ${totalAttempts} scroll attempts. Matcher: ${JSON.stringify(
        elementMatcher,
      )}`,
    );
  },

  async scrollToText(
    text: string | RegExp,
    scrollViewId?: string | RegExp,
    pixels?: number,
    direction?: Direction,
    androidDelay?: number,
  ): Promise<void> {
    await NativeElementHelpers.performScroll(
      by.text(text),
      scrollViewId,
      pixels,
      direction,
      androidDelay,
    );
  },

  async scrollToId(
    id: string | RegExp,
    scrollViewId?: string | RegExp,
    pixels?: number,
    direction?: Direction,
    androidDelay?: number,
  ): Promise<void> {
    await NativeElementHelpers.performScroll(
      by.id(id),
      scrollViewId,
      pixels,
      direction,
      androidDelay,
    );
  },

  async getTextOfElement(id: string | RegExp, index = 0): Promise<string> {
    const attributes = await retryUntilTimeout(async () =>
      (await NativeElementHelpers.getElementById(id, index)).getAttributes(),
    );
    return (!("elements" in attributes) ? attributes.text : attributes.elements[index].text) || "";
  },

  async getIdOfElement(elem: NativeElement, index = 0): Promise<string> {
    const attributes = await retryUntilTimeout(async () => elem.getAttributes());
    return (
      (!("elements" in attributes)
        ? attributes.identifier
        : attributes.elements[index].identifier) || ""
    );
  },

  async getIdByRegexp(id: RegExp, index = 0): Promise<string> {
    const elem = await NativeElementHelpers.getElementById(id, index);
    return await NativeElementHelpers.getIdOfElement(elem, index);
  },
};

export const WebElementHelpers = {
  getWebElementByTestId(id: string, index = 0): WebElement {
    const base = web.element(by.web.cssSelector(`[data-testid="${id}"]`)) as IndexedWebElement;
    return index > 0 ? base.atIndex(index) : base;
  },

  async getWebElementText(id: string, index = 0) {
    return await getWebElementByTestId(id, index).getText();
  },

  getWebElementById(id: string, index = 0): WebElement {
    const base = web.element(by.web.id(id)) as IndexedWebElement;
    return index > 0 ? base.atIndex(index) : base;
  },

  getWebElementByTag(tag: string, index = 0): WebElement {
    const base = web.element(by.web.tag(tag)) as IndexedWebElement;
    return index > 0 ? base.atIndex(index) : base;
  },

  getWebElementsByIdAndText(id: string, text: string, index = 0): WebElement {
    const base = web.element(
      by.web.xpath(`//span[@data-testid="${id}" and text()="${text}"]`),
    ) as IndexedWebElement;
    return index > 0 ? base.atIndex(index) : base;
  },

  async getWebElementsText(id: string): Promise<string[]> {
    const texts: string[] = [];
    let i = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        const element = WebElementHelpers.getWebElementByTestId(id, i);
        const text = await element.getText();
        texts.push(text);
        i++;
      } catch {
        break;
      }
    }

    return texts.filter(Boolean);
  },

  async waitWebElementByTestId(id: string, timeout = DEFAULT_TIMEOUT): Promise<WebElement> {
    const start = Date.now();
    let lastErr: Error | undefined;
    while (Date.now() - start < timeout) {
      try {
        const elem = WebElementHelpers.getWebElementByTestId(id);
        await retryUntilTimeout(() => elem.getText(), 1000, 200);
        return elem;
      } catch (e) {
        lastErr = e instanceof Error ? e : new Error(String(e));
        await delay(200);
      }
    }
    throw new Error(`Web element '${id}' not found after ${timeout}ms: ${lastErr?.message}`);
  },

  async tapWebElementByTestId(id: string, index = 0): Promise<void> {
    await retryUntilTimeout(async () => WebElementHelpers.getWebElementByTestId(id, index).tap());
  },

  async typeTextByWebTestId(id: string, text: string): Promise<void> {
    await retryUntilTimeout(async () =>
      WebElementHelpers.getWebElementByTestId(id).runScript(
        (el: HTMLInputElement, val: string) => {
          const setValue = Object.getOwnPropertyDescriptor(
            HTMLInputElement.prototype,
            "value",
          )?.set;
          if (setValue) setValue.call(el, val);
          else el.value = val;
          el.dispatchEvent(new Event("input", { bubbles: true }));
        },
        [text],
      ),
    );
  },
};

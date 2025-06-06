import { Direction, NativeElement, WebElement } from "detox/detox";
import { by, element, expect as detoxExpect, waitFor, web } from "detox";
import { delay, isAndroid } from "./commonHelpers";
import { retryUntilTimeout } from "../utils/retry";
import { PageScroller } from "./pageScroller";

interface IndexedWebElement extends WebElement {
  atIndex(index: number): WebElement;
}

const scroller = new PageScroller();

const DEFAULT_TIMEOUT = 60000;
const RN75_DELAY = 200; // React Native 75 workaround: QAA-370

function sync_delay(ms: number) {
  const done = new Int32Array(new SharedArrayBuffer(4));
  Atomics.wait(done, 0, 0, ms); // Wait for the specified duration
}

function withRN75Delay<T>(fn: () => T) {
  if (!isAndroid()) sync_delay(RN75_DELAY);
  return fn();
}

export const NativeElementHelpers = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expect(element: any) {
    return withRN75Delay(() => detoxExpect(element));
  },

  waitForElementById(id: string | RegExp, timeout: number = DEFAULT_TIMEOUT) {
    return waitFor(element(by.id(id)))
      .toBeVisible()
      .withTimeout(timeout);
  },

  waitForElementByText(text: string | RegExp, timeout: number = DEFAULT_TIMEOUT) {
    return waitFor(element(by.text(text)))
      .toBeVisible()
      .withTimeout(timeout);
  },

  async waitForElementNotVisible(id: string | RegExp, timeout = DEFAULT_TIMEOUT): Promise<boolean> {
    const el = element(by.id(id));

    try {
      await NativeElementHelpers.expect(el).not.toBeVisible();
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

  async countElementsById(id: string | RegExp, index = 0): Promise<number> {
    try {
      await detoxExpect(element(by.id(id)).atIndex(index)).toBeVisible();
      return countElementsById(id, index + 1);
    } catch {
      return index;
    }
  },

  getElementsById(id: string | RegExp) {
    return withRN75Delay(() => element(by.id(id)));
  },

  getElementById(id: string | RegExp, index = 0) {
    return withRN75Delay(() => element(by.id(id)).atIndex(index));
  },

  getElementByText(text: string | RegExp, index = 0) {
    return withRN75Delay(() => element(by.text(text)).atIndex(index));
  },

  getElementByIdAndText(id: string | RegExp, text: string | RegExp, index = 0) {
    return withRN75Delay(() => element(by.id(id).and(by.text(text))).atIndex(index));
  },

  async isIdVisible(id: string | RegExp, timeout: number = 1_000): Promise<boolean> {
    try {
      await waitFor(element(by.id(id)))
        .toBeVisible()
        .withTimeout(timeout);
      return true;
    } catch {
      return false;
    }
  },

  async tapById(id: string | RegExp, index = 0) {
    return await NativeElementHelpers.getElementById(id, index).tap();
  },

  async tapByText(text: string | RegExp, index = 0) {
    return await NativeElementHelpers.getElementByText(text, index).tap();
  },

  async tapByElement(elem: Detox.NativeElement) {
    await elem.tap();
  },

  async typeTextById(
    id: string | RegExp,
    text: string,
    closeKeyboard = true,
    focus = true,
  ): Promise<void> {
    await NativeElementHelpers.typeTextByElement(
      NativeElementHelpers.getElementById(id),
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

  async scrollToText(
    text: string | RegExp,
    scrollViewId?: string | RegExp,
    pixels?: number,
    direction?: Direction,
    androidDelay?: number,
  ): Promise<void> {
    await scroller.performScroll(by.text(text), scrollViewId, pixels, direction, androidDelay);
  },

  async scrollToId(
    id: string | RegExp,
    scrollViewId?: string | RegExp,
    pixels?: number,
    direction?: Direction,
    androidDelay?: number,
  ): Promise<void> {
    await scroller.performScroll(by.id(id), scrollViewId, pixels, direction, androidDelay);
  },

  async getTextOfElement(id: string | RegExp, index = 0): Promise<string> {
    const attributes = await retryUntilTimeout(async () =>
      NativeElementHelpers.getElementById(id, index).getAttributes(),
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
    const elem = NativeElementHelpers.getElementById(id, index);
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

/* eslint-disable prettier/prettier */
import { Direction, NativeElement, WebElement } from "detox/detox";
import { by, element, expect as detoxExpect, waitFor, web, log } from "detox";
import { delay, isAndroid, isIos } from "./commonHelpers";
import { retryUntilTimeout } from "../utils/retry";
import { PageScroller } from "./pageScroller";
import { checkForErrorElement } from "./errorHelpers";
import { sanitizeError } from "@ledgerhq/live-common/e2e/index";

interface IndexedWebElement extends WebElement {
  atIndex(index: number): WebElement;
}
interface WebElementWithMatcher extends WebElement {
  matcher?: {
    predicate?: unknown;
    type?: string;
    value?: string;
  };
  _call?: {
    value?: unknown;
  };
}

function hasMatcherProperty(obj: unknown): obj is WebElementWithMatcher {
  return (
    (isIos() && typeof obj === "object" && obj !== null && "matcher" in obj) ||
    (isAndroid() && typeof obj === "object" && obj !== null && "_call" in obj)
  );
}

const scroller = new PageScroller();

const DEFAULT_TIMEOUT = 60000;

export type WaitForElementOptions = {
  errorCheckTimeout?: number;
  errorElementId?: string;
  checkVisibility?: boolean;
};

export const NativeElementHelpers = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expect(element: any) {
    return detoxExpect(element);
  },

  /**
   * Waits for a native element to become visible (or to exist), with optional error checking.
   * When errorElementId is provided, polls for both the expected element and error elements,
   * providing fail-fast behavior if errors are detected.
   *
   * @param nativeElement - The Detox native element to wait for
   * @param timeout - Maximum time to wait for the element (in ms)
   * @param options - Optional configuration
   * @param options.errorCheckTimeout - Polling frequency for error checks (default: 500ms)
   * @param options.errorElementId - Test ID of error element to check for fail-fast behavior
   * @param options.checkVisibility - If true (default), waits for toBeVisible; if false, waits for toExist.
   *   Use false when the element may be present but Detox synchronization or main-thread contention
   *   prevents the visibility check from completing (e.g. WebView screens under heavy load).
   * @throws {Error} If error element detected or timeout reached
   *
   * @example
   * // Basic usage — waits for visibility
   * await waitForElement(myElement);
   *
   * @example
   * // With error checking
   * await waitForElement(myElement, 60000, {
   *   errorElementId: "error-description-deviceAction"
   * });
   */
  async waitForElement(
    nativeElement: NativeElement,
    timeout: number = DEFAULT_TIMEOUT,
    options?: WaitForElementOptions,
  ) {
    const errorCheckTimeout = options?.errorCheckTimeout ?? 500;
    const checkVisibility = options?.checkVisibility ?? true;
    const waitCondition = checkVisibility
      ? waitFor(nativeElement).toBeVisible()
      : waitFor(nativeElement).toExist();
    if (!options?.errorElementId) {
      return waitCondition.withTimeout(timeout);
    }

    const startTime = Date.now();
    let lastWaitError: Error | null = null;

    while (Date.now() - startTime < timeout) {
      try {
        await waitCondition.withTimeout(errorCheckTimeout);
        return;
      } catch (error) {
        lastWaitError = error instanceof Error ? error : new Error(String(error));
      }

      await checkForErrorElement(options.errorElementId, errorCheckTimeout);

      await delay(200);
    }

    throw new Error(
      lastWaitError
        ? `Timeout waiting for element after ${timeout}ms. Wait error: ${lastWaitError.message}`
        : `Timeout waiting for element after ${timeout}ms`,
    );
  },

  async waitForElementById(
    id: string | RegExp,
    timeout: number = DEFAULT_TIMEOUT,
    options?: WaitForElementOptions,
  ) {
    return NativeElementHelpers.waitForElement(element(by.id(id)), timeout, options);
  },

  async waitForElementByText(
    text: string | RegExp,
    timeout: number = DEFAULT_TIMEOUT,
    options?: WaitForElementOptions,
  ) {
    return NativeElementHelpers.waitForElement(element(by.text(text)), timeout, options);
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
    return element(by.id(id));
  },

  getElementById(id: string | RegExp, index = 0) {
    return element(by.id(id)).atIndex(index);
  },

  getElementByText(text: string | RegExp, index = 0) {
    return element(by.text(text)).atIndex(index);
  },

  getElementByIdAndText(id: string | RegExp, text: string | RegExp, index = 0) {
    return element(by.id(id).and(by.text(text))).atIndex(index);
  },

  /**
   * Builds a Detox element matcher scoped by test id and constrained by descendant text matchers.
   * String values are converted to case-insensitive partial matches.
   *
   * @param id - Test id of the root element to target
   * @param texts - Descendant text constraints (plain strings or RegExp)
   * @returns Detox element matching id and all descendant text constraints
   */
  getElementByIdWithDescendantTexts(id: string, ...texts: Array<string | RegExp>) {
    let matcher = by.id(id);

    for (const text of texts) {
      const descendantText = typeof text === "string" ? new RegExp(`.*${text}.*`, "i") : text;
      matcher = matcher.withDescendant(by.text(descendantText));
    }

    return element(matcher);
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

  async isIdPresent(id: string | RegExp, timeout: number = 1_000): Promise<boolean> {
    try {
      await waitFor(element(by.id(id)))
        .toExist()
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

  async tapByIdAndExpectToDisappear(
    id: string | RegExp,
    opts: { index?: number; timeout?: number; disappearTimeout?: number } = {},
  ) {
    const { index = 0, timeout = 60000, disappearTimeout = 1000 } = opts;
    let tapped = false;
    await retryUntilTimeout(async () => {
      if (tapped) {
        const visible = await NativeElementHelpers.isIdVisible(id);
        if (!visible) return;
      }
      await NativeElementHelpers.tapById(id, index);
      tapped = true;
      const stillVisible = await NativeElementHelpers.isIdVisible(id, disappearTimeout);
      if (stillVisible) throw new Error(`Element "${id}" is still visible after tap`);
    }, timeout);
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

  async getAttributesOfElement(id: string | RegExp, index = 0): Promise<Detox.ElementAttributes> {
    const attributes = await retryUntilTimeout(async () =>
      NativeElementHelpers.getElementById(id, index).getAttributes(),
    );
    if ("elements" in attributes) {
      return attributes.elements[index];
    }
    return attributes;
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
  getWebElementByTestId(id: string, index = 0, testIdAttribute = "data-testid"): WebElement {
    const base = web.element(
      by.web.cssSelector(`[${testIdAttribute}="${id}"]`),
    ) as IndexedWebElement;
    return index > 0 ? base.atIndex(index) : base;
  },

  getWebElementByCssSelector(selector: string, index = 0): WebElement {
    const base = web.element(by.web.cssSelector(selector));
    return index > 0 ? base.atIndex(index) : base;
  },

  async getWebElementText(id: string, index = 0) {
    const elem = WebElementHelpers.getWebElementByTestId(id, index);
    await detoxExpect(elem).toExist();
    return await elem.runScript(el => (el.innerText || el.textContent || "").trim());
  },

  getWebElementById(id: string, index = 0): WebElement {
    const base = web.element(by.web.id(id)) as IndexedWebElement;
    return index > 0 ? base.atIndex(index) : base;
  },

  getWebElementByTag(tag: string, index = 0): WebElement {
    const base = web.element(by.web.tag(tag)) as IndexedWebElement;
    return index > 0 ? base.atIndex(index) : base;
  },

  async getWebElementsByCssSelector(selector: string): Promise<string[]> {
    const texts: string[] = [];
    let i = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        const element = web
          .element(by.web.cssSelector(selector))
          .atIndex(i) as unknown as IndexedWebElement;
        const text: string = await element.runScript((node: HTMLElement) =>
          (node.innerText || node.textContent || "").trim(),
        );
        texts.push(text);
        i++;
      } catch {
        break;
      }
    }

    return texts.filter(Boolean);
  },

  getWebElementByXpath(xpath: string, index = 0): WebElement {
    const base = web.element(by.web.xpath(xpath)) as IndexedWebElement;
    return index > 0 ? base.atIndex(index) : base;
  },

  getWebElementsByIdAndText(id: string, text: string, index = 0): WebElement {
    const xpath = id
      ? `//span[@data-testid="${id}" and text()="${text}"]`
      : `//span[text()="${text}"]`;
    const base = web.element(by.web.xpath(xpath)) as IndexedWebElement;
    return index > 0 ? base.atIndex(index) : base;
  },

  async getWebElementsText(cssSelector: string): Promise<string[]> {
    const texts: string[] = [];
    let i = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        const element = getWebElementByCssSelector(cssSelector, i);
        const text = await element.runScript(el => (el.innerText || el.textContent || "").trim());
        texts.push(text);
        i++;
      } catch {
        break;
      }
    }

    return texts.filter(Boolean);
  },

  async waitWebElement(
    webElement: WebElement,
    timeout = DEFAULT_TIMEOUT,
    throwOnTimeout = true,
  ): Promise<WebElement | undefined> {
    try {
      await retryUntilTimeout(() => webElement.runScript(el => el.innerText), timeout);
      return webElement;
    } catch (e) {
      if (throwOnTimeout) {
        throw e;
      }
      log.warn(
        `Web element not found after ${timeout}ms: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  },

  async waitWebElementByTestId(
    id: string,
    timeout = DEFAULT_TIMEOUT,
    throwOnTimeout = true,
  ): Promise<WebElement | undefined> {
    const webElement = WebElementHelpers.getWebElementByTestId(id);
    try {
      return await WebElementHelpers.waitWebElement(webElement, timeout, true);
    } catch (e) {
      const message = `Web element '${id}' not found after ${timeout}ms: ${e instanceof Error ? e.message : String(e)}`;
      if (throwOnTimeout) {
        throw new Error(message);
      }
      log.warn(message);
    }
  },

  async expectWebElementNotVisible(id: string, index = 0): Promise<void> {
    await detoxExpect(WebElementHelpers.getWebElementByTestId(id, index)).not.toExist();
  },

  async tapWebElementByTestId(id: string, index = 0): Promise<void> {
    await retryUntilTimeout(async () => WebElementHelpers.getWebElementByTestId(id, index).tap());
  },

  async tapWebElementByElement(element: WebElement, timeout = DEFAULT_TIMEOUT / 10): Promise<void> {
    await retryUntilTimeout(async () => element.tap(), timeout);
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

  async getValueByWebTestId(id: string): Promise<string> {
    const raw = await retryUntilTimeout(() =>
      WebElementHelpers.getWebElementByTestId(id).runScript((el: HTMLInputElement) => el.value),
    );

    if (raw != null && typeof raw === "object" && "result" in raw) {
      return String(raw["result"]);
    }
    return String(raw);
  },

  async scrollToWebElement(element: WebElement) {
    try {
      await element.runScript((el: HTMLElement) => el.scrollIntoView({ behavior: "smooth" }));
    } catch (error) {
      throw new Error(
        `Failed to scroll to web element using matcher: ${WebElementHelpers.getWebElementMatcher(element)}\nError: ${sanitizeError(error)}`,
      );
    }
  },

  getWebElementMatcher(webElement: WebElement): string {
    if (hasMatcherProperty(webElement)) {
      return isIos()
        ? JSON.stringify(webElement.matcher?.predicate || webElement.matcher, null, 2)
        : JSON.stringify(webElement._call?.value || webElement._call, null, 2);
    }
    return "{}";
  },
  async getCurrentWebviewUrl(): Promise<string> {
    let url = "";
    try {
      url = await getWebElementByTag("body").runScript(() => window.location.href);
    } catch {
      url = await getWebElementByTag("html").runScript(() => window.location.href);
    }
    return String(url);
  },

  async waitForCurrentWebviewUrlToContain(substring: string, timeout = 10000): Promise<string> {
    let currentUrl = "";
    await retryUntilTimeout(async () => {
      currentUrl = await WebElementHelpers.getCurrentWebviewUrl();
      if (currentUrl.toLowerCase().includes(substring.toLowerCase())) {
        return currentUrl;
      }
      throw new Error(`URL ${currentUrl} does not contain the expected substring: ${substring}`);
    }, timeout);
    return currentUrl;
  },

  async waitForWebElementToMatchRegex(
    webElementId: string,
    regexPattern: RegExp,
    timeout = 10000,
  ): Promise<string> {
    let webElementText = "";
    await retryUntilTimeout(async () => {
      webElementText = await WebElementHelpers.getWebElementText(webElementId);
      if (new RegExp(regexPattern).test(webElementText)) {
        return webElementText;
      }
      throw new Error(
        `Web Element "${webElementId}" with text "${webElementText}" does not contain the expected regex: ${regexPattern}`,
      );
    }, timeout);
    return webElementText;
  },

  async isWebElementEnabled(element: WebElement) {
    const isEnabled = await element.runScript(
      (el: HTMLButtonElement | HTMLInputElement, android: boolean) => {
        return android ? el.ariaDisabled !== "true" : el.getAttributeNames().toString();
      },
      [isAndroid()],
    );
    return typeof isEnabled === "string" ? !isEnabled.includes("disabled") : isEnabled;
  },

  async waitForWebElementToBeEnabled(
    id: string,
    timeout = DEFAULT_TIMEOUT,
    index = 0,
  ): Promise<void> {
    const start = Date.now();
    let lastErr: Error | undefined;

    while (Date.now() - start < timeout) {
      try {
        const element = WebElementHelpers.getWebElementByTestId(id, index);
        const isEnabled = await WebElementHelpers.isWebElementEnabled(element);
        if (isEnabled) {
          return;
        }
      } catch (e) {
        lastErr = e instanceof Error ? e : new Error(String(e));
      }
      await delay(100);
    }

    throw new Error(
      `Web element '${id}' did not become enabled within ${timeout}ms: ${lastErr?.message}`,
    );
  },
};

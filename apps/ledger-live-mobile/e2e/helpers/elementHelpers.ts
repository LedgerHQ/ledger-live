import { Direction } from "detox/detox";
import { delay, isAndroid } from "./commonHelpers";
import { by, element, waitFor, web } from "detox";

const DEFAULT_TIMEOUT = 60000; // 60s !!
const startPositionY = 0.8; // Needed on Android to scroll views : https://github.com/wix/Detox/issues/3918

function sync_delay(ms: number) {
  const done = new Int32Array(new SharedArrayBuffer(4));
  Atomics.wait(done, 0, 0, ms); // Wait for the specified duration
}

export const ElementHelpers = {
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

  getElementById(id: string | RegExp, index = 0) {
    if (!isAndroid()) sync_delay(200); // Issue with RN75 : QAA-370
    return element(by.id(id)).atIndex(index);
  },

  getElementByText(text: string | RegExp, index = 0) {
    if (!isAndroid()) sync_delay(200); // Issue with RN75 : QAA-370
    return element(by.text(text)).atIndex(index);
  },

  getWebElementById(id: string, index = 0) {
    if (!isAndroid()) sync_delay(200); // Issue with RN75 : QAA-370
    return web.element(by.web.id(id)).atIndex(index);
  },

  getWebElementByTag(tag: string, index = 0) {
    if (!isAndroid()) sync_delay(200); // Issue with RN75 : QAA-370
    return web.element(by.web.tag(tag)).atIndex(index);
  },

  getWebElementByTestId(id: string) {
    return web.element(by.web.cssSelector(`[data-testid="${id}"]`));
  },

  getWebElementsWithText(id: string, text: string) {
    return web.element(by.web.xpath(`//span[@data-testid="${id}" and text()="${text}"]`));
  },

  async getWebElementsText(id: string) {
    const texts: string[] = [];
    let i = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        texts.push(await getWebElementByTestId(id).atIndex(i).getText());
        i++;
      } catch {
        break;
      }
    }
    return texts;
  },

  async waitWebElementByTestId(id: string, timeout = DEFAULT_TIMEOUT) {
    const startTime = Date.now();
    const element = web.element(by.web.cssSelector(`[data-testid="${id}"]`));

    while (Date.now() - startTime < timeout) {
      try {
        await element.getText();
        return element;
      } catch {
        await delay(200);
      }
    }
    throw new Error(`Element with data-testid "${id}" not found in ${timeout} ms`);
  },

  async tapWebElementByTestId(id: string, index = 0) {
    await getWebElementByTestId(id).atIndex(index).tap();
  },

  async typeTextByWebTestId(id: string, text: string) {
    await getWebElementByTestId(id).runScript(
      (el, text) => {
        const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
        if (setValue) {
          setValue.call(el, text);
        } else {
          el.value = text;
        }
        el.dispatchEvent(new Event("input", { bubbles: true }));
      },
      [text],
    );
  },

  async IsIdVisible(id: string | RegExp) {
    try {
      await waitFor(element(by.id(id)))
        .toBeVisible()
        .withTimeout(1000);
      return true;
    } catch {
      return false;
    }
  },

  async tapById(id: string | RegExp, index = 0) {
    return await ElementHelpers.getElementById(id, index).tap();
  },

  async tapByText(text: string | RegExp, index = 0) {
    return await ElementHelpers.getElementByText(text, index).tap();
  },

  async tapByElement(elem: Detox.NativeElement) {
    await elem.tap();
  },

  async typeTextById(id: string | RegExp, text: string, closeKeyboard = true, focus = true) {
    await ElementHelpers.typeTextByElement(
      ElementHelpers.getElementById(id),
      text,
      closeKeyboard,
      focus,
    );
  },

  async typeTextByElement(
    elem: Detox.NativeElement,
    text: string,
    closeKeyboard = true,
    focus = true,
  ) {
    if (focus) await ElementHelpers.tapByElement(elem);
    await elem.replaceText(text);
    if (closeKeyboard) await elem.typeText("\n"); // ' \n' close keyboard if open
  },

  async clearTextByElement(elem: Detox.NativeElement) {
    return await elem.clearText();
  },

  async performScroll(
    elementMatcher: Detox.NativeMatcher,
    scrollViewId?: string | RegExp,
    pixels = 300,
    direction: Direction = "down",
  ) {
    const scrollViewMatcher = scrollViewId
      ? by.id(scrollViewId)
      : by.type(isAndroid() ? "android.widget.ScrollView" : "RCTScrollView");
    if (!isAndroid()) sync_delay(200); // Issue with RN75 : QAA-370
    await waitFor(element(elementMatcher))
      .toBeVisible()
      .whileElement(scrollViewMatcher)
      .scroll(pixels, direction, NaN, startPositionY);
    if (isAndroid()) await delay(30); // Issue on tap after scroll on Android : https://github.com/wix/Detox/issues/3637
  },

  async scrollToText(
    text: string | RegExp,
    scrollViewId?: string | RegExp,
    pixels?: number,
    direction?: Direction,
  ) {
    await ElementHelpers.performScroll(by.text(text), scrollViewId, pixels, direction);
  },

  async scrollToId(
    // Index broken on Android :  https://github.com/wix/Detox/issues/2931
    id: string | RegExp,
    scrollViewId?: string | RegExp,
    pixels?: number,
    direction?: Direction,
  ) {
    await ElementHelpers.performScroll(by.id(id), scrollViewId, pixels, direction);
  },

  async getTextOfElement(id: string | RegExp, index = 0) {
    const attributes = await ElementHelpers.getElementById(id, index).getAttributes();
    return (!("elements" in attributes) ? attributes.text : attributes.elements[index].text) || "";
  },

  async getIdOfElement(id: RegExp, index = 0) {
    const attributes = await ElementHelpers.getElementById(id, index).getAttributes();
    return (
      (!("elements" in attributes)
        ? attributes.identifier
        : attributes.elements[index].identifier) || ""
    );
  },
};

import type { WebElement } from "detox/detox";
import { WebElementHelpers } from "@e2e/helpers/elementHelpers";
import { TIMEOUT } from "@e2e/utils/timeouts";
import type { ElementHandle } from "./elementHandle";

/**
 * An element inside a webview (Live App), declared once by its `data-testid`.
 * Every action waits up to `timeout` (default 60s) for the element, then acts.
 * To act without waiting, use {@link WebHandle.raw}. Build one with {@link webByTestId}.
 */
export class WebHandle implements ElementHandle {
  private readonly testId: string;

  constructor(testId: string) {
    this.testId = testId;
  }

  /** The Detox web element, with no wait. Escape hatch for actions this handle does not wrap. */
  get raw(): WebElement {
    return WebElementHelpers.getWebElementByTestId(this.testId);
  }

  /** Waits until the element exists in the webview and its text can be read (webviews have no visibility check). */
  async waitVisible(timeout = TIMEOUT.xxlarge): Promise<void> {
    await WebElementHelpers.waitWebElement(this.raw, timeout);
  }

  /** Waits for the element, then taps it. */
  async tap(timeout = TIMEOUT.xxlarge): Promise<void> {
    await this.waitVisible(timeout);
    await WebElementHelpers.tapWebElementByElement(this.raw);
  }

  /** Waits for the input, then sets its value and fires an `input` event so the page's React state updates. */
  async replaceText(text: string, timeout = TIMEOUT.xxlarge): Promise<void> {
    await this.waitVisible(timeout);
    await WebElementHelpers.typeTextByWebElement(this.raw, text);
  }

  /** Waits for the element, then returns its trimmed text. */
  async getText(timeout = TIMEOUT.xxlarge): Promise<string> {
    await this.waitVisible(timeout);
    return WebElementHelpers.getTextByWebElement(this.raw);
  }
}

/** Matches a webview element whose `data-testid` starts with `testId` (same prefix match as the `*WebTestId` globals). */
export const webByTestId = (testId: string): WebHandle => new WebHandle(testId);

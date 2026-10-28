import { by, web } from "detox";
import type { WebElement } from "detox/detox";
import { retryUntilTimeout } from "@e2e/utils/retry";
import { INTERVAL, TIMEOUT } from "@e2e/utils/timeouts";
import type { ElementHandle } from "./elementHandle";
import { waitHardTimeout, withHardTimeout } from "./hardTimeout";

/**
 * An element inside a webview (Live App), declared once by its `data-testid`.
 * Every action waits up to `timeout` (default 60s) for the element, then acts.
 * Build one with {@link webByTestId}.
 */
export class WebHandle implements ElementHandle {
  private readonly testId: string;

  constructor(testId: string) {
    this.testId = testId;
  }

  /** The Detox web element, with no wait and no hard timeout. */
  private get raw(): WebElement {
    return web.element(by.web.cssSelector(`[data-testid="${this.testId}"]`));
  }

  /** Waits until the element exists in the webview and its text can be read (webviews have no visibility check). */
  async waitVisible(timeout = TIMEOUT.xxlarge): Promise<void> {
    await withHardTimeout(
      retryUntilTimeout(() => this.raw.runScript(el => el.innerText), timeout, INTERVAL.long),
      waitHardTimeout(timeout),
    );
  }

  /** Waits for the element, then taps it. */
  async tap(timeout = TIMEOUT.xxlarge): Promise<void> {
    await this.waitVisible(timeout);
    await withHardTimeout(this.raw.tap(), TIMEOUT.medium);
  }

  /** Waits for the input, then sets its value and fires an `input` event so the page's React state updates. */
  async replaceText(text: string, timeout = TIMEOUT.xxlarge): Promise<void> {
    await this.waitVisible(timeout);
    await withHardTimeout(
      this.raw.runScript(
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
      TIMEOUT.medium,
    );
  }

  /** Waits for the element, then returns its trimmed text. */
  async getText(timeout = TIMEOUT.xxlarge): Promise<string> {
    await this.waitVisible(timeout);
    return withHardTimeout(
      this.raw.runScript(el => (el.innerText || el.textContent || "").trim()),
      TIMEOUT.medium,
    );
  }
}

/** Matches a webview element whose `data-testid` equals `testId`. */
export const webByTestId = (testId: string): WebHandle => new WebHandle(testId);

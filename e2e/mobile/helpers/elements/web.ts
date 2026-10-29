import { by, expect as detoxExpect, web } from "detox";
import type { WebElement, WebMatcher } from "detox/detox";
import { retryUntilTimeout } from "@e2e/utils/retry";
import { INTERVAL, TIMEOUT } from "@e2e/utils/timeouts";
import type { ElementHandle } from "./elementHandle";
import { waitHardTimeout, withHardTimeout } from "./hardTimeout";

/** Reads a `runScript` result as text: Android returns some results wrapped as `{ result }`. */
const scriptText = (value: unknown): string =>
  String(value != null && typeof value === "object" && "result" in value ? value.result : value);

/**
 * An element inside a webview (Live App), declared once with its match strategy.
 * Every action waits up to `timeout` (default 60s) for the element, then acts.
 * Build one with {@link webById} or {@link webByXPath}.
 */
export class WebHandle implements ElementHandle {
  private readonly createMatcher: () => WebMatcher;
  private readonly description: string;

  constructor(createMatcher: () => WebMatcher, description: string) {
    this.createMatcher = createMatcher;
    this.description = description;
  }

  /** The Detox web element, with no wait and no hard timeout. */
  private get raw(): WebElement {
    return web.element(this.createMatcher());
  }

  /** Waits until the element exists in the webview and its text can be read (webviews have no visibility check). */
  async waitVisible(timeout = TIMEOUT.xxlarge): Promise<void> {
    await withHardTimeout(
      retryUntilTimeout(() => this.raw.runScript(el => el.innerText), timeout, INTERVAL.long, {
        messageOnError: `${this.description} not found after ${timeout}ms`,
      }),
      waitHardTimeout(timeout),
    );
  }

  /** Waits until the element no longer exists in the webview. */
  async waitGone(timeout = TIMEOUT.xxlarge): Promise<void> {
    await withHardTimeout(
      retryUntilTimeout(() => detoxExpect(this.raw).not.toExist(), timeout, INTERVAL.long, {
        messageOnError: `${this.description} still exists after ${timeout}ms`,
      }),
      waitHardTimeout(timeout),
    );
  }

  /** Waits for the element, then until it has neither `disabled` nor `aria-disabled="true"`. */
  async waitEnabled(timeout = TIMEOUT.xxlarge): Promise<void> {
    await this.waitVisible(timeout);
    await withHardTimeout(
      retryUntilTimeout(
        async () => {
          if (!(await this.isEnabled())) throw new Error(`${this.description} is disabled`);
        },
        timeout,
        INTERVAL.long,
        { messageOnError: `${this.description} did not become enabled within ${timeout}ms` },
      ),
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
    const text = await withHardTimeout(
      this.raw.runScript(el => (el.innerText || el.textContent || "").trim()),
      TIMEOUT.medium,
    );
    return scriptText(text);
  }

  /** Waits for the input, then returns its `value`. */
  async getValue(timeout = TIMEOUT.xxlarge): Promise<string> {
    await this.waitVisible(timeout);
    const value = await withHardTimeout(
      this.raw.runScript((el: HTMLInputElement) => el.value),
      TIMEOUT.medium,
    );
    return scriptText(value);
  }

  private async isEnabled(): Promise<boolean> {
    // Returned as a string: the same check and result type on both platforms.
    const disabled = await this.raw.runScript((el: HTMLButtonElement | HTMLInputElement) =>
      String(el.disabled === true || el.getAttribute("aria-disabled") === "true"),
    );
    return scriptText(disabled) !== "true";
  }
}

/** Matches a webview element whose `data-testid` equals `id`. */
export const webById = (id: string): WebHandle =>
  new WebHandle(() => by.web.cssSelector(`[data-testid="${id}"]`), `data-testid "${id}"`);

/** Matches a webview element by XPath, for elements without a usable `data-testid`. */
export const webByXPath = (xpath: string): WebHandle =>
  new WebHandle(() => by.web.xpath(xpath), `xpath ${xpath}`);

const readUrl = (tag: string) => web.element(by.web.tag(tag)).runScript(() => window.location.href);

/** Waits until the current webview URL contains `fragment` (case-insensitive), then returns it. */
export async function waitForWebviewUrl(
  fragment: string,
  timeout = TIMEOUT.medium,
): Promise<string> {
  return withHardTimeout(
    retryUntilTimeout(
      async () => {
        const url = scriptText(await readUrl("body").catch(() => readUrl("html")));
        if (!url.toLowerCase().includes(fragment.toLowerCase())) {
          throw new Error(`Webview URL ${url} does not contain "${fragment}"`);
        }
        return url;
      },
      timeout,
      INTERVAL.long,
    ),
    waitHardTimeout(timeout),
  );
}

/**
 * Webview element handle — an action-ready locator bound to one resolved
 * webview element, produced by `webView(scope)` (see ./surface).
 *
 * Detox's web API is deliberately thin, so this fills the gaps:
 *   • No `waitFor` for web → `wait()` polls.
 *   • Existence ≠ visibility → pass `{ visible: true }` (or use `visible()`);
 *     it checks layout via `runScript`, the escape hatch for anything the
 *     matcher API can't express.
 * (testID-vs-id is handled by the surface's `testId` / `id` factories.)
 *
 * Platform note: this stays on the cross-platform matcher subset; the surface
 * never builds `by.web.value`/`label`/`type` (iOS-only).
 */
import { expect as detoxExpect } from "detox";
import { TIMEOUTS, POLL_INTERVAL } from "../../timeouts";

/** `await sleep(ms)` — the only intentional delay in this module (poll spacing). */
export const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

export type WebWaitOpts = {
  /** Max time to poll. Default {@link TIMEOUTS.S}. */
  timeout?: number;
  /** Gap between polls. Default {@link POLL_INTERVAL}. */
  interval?: number;
  /** Require the element to be laid out & visible, not merely present in the DOM. */
  visible?: boolean;
};

/**
 * `runScript` predicate: is the element laid out and visibly rendered? Kept as
 * a string on purpose — the test tsconfig has no DOM lib, so a function body
 * referencing `window` wouldn't typecheck; the string is shipped verbatim to
 * the page's JS engine.
 */
const VISIBILITY_SCRIPT = `(el) => {
  const rect = el.getBoundingClientRect();
  const style = window.getComputedStyle(el);
  return rect.width > 0 && rect.height > 0 &&
    style.visibility !== 'hidden' && style.display !== 'none' && style.opacity !== '0';
}`;

export class WebHandle {
  constructor(private readonly target: Detox.WebElement) {}

  /** The underlying Detox web element — escape hatch. */
  get raw(): Detox.WebElement {
    return this.target;
  }

  /** True if the element exists in the DOM right now — resolves immediately, never throws. */
  async exists(): Promise<boolean> {
    try {
      await detoxExpect(this.target).toExist();
      return true;
    } catch {
      return false;
    }
  }

  /** True if the element is laid out & visible right now — resolves immediately, never throws. */
  async visible(): Promise<boolean> {
    try {
      return Boolean(await this.target.runScript(VISIBILITY_SCRIPT));
    } catch {
      return false;
    }
  }

  /** Poll until the element exists (or, with `{ visible: true }`, is on-screen). */
  async wait(opts: WebWaitOpts = {}): Promise<Detox.WebElement> {
    const timeout = opts.timeout ?? TIMEOUTS.S;
    const interval = opts.interval ?? POLL_INTERVAL;
    const start = Date.now();
    for (;;) {
      const ready = opts.visible ? await this.visible() : await this.exists();
      if (ready) return this.target;
      if (Date.now() - start > timeout) {
        throw new Error(
          `WebHandle.wait: timed out after ${timeout}ms waiting for web element to ${
            opts.visible ? "be visible" : "exist"
          }`,
        );
      }
      await sleep(interval);
    }
  }

  /** Scroll the element to the top of the viewport. */
  scrollIntoView(): Promise<void> {
    return this.target.scrollToView();
  }

  /** Wait for the element, optionally scroll it into view, then tap. */
  async tap(opts: WebWaitOpts & { scroll?: boolean } = {}): Promise<void> {
    await this.wait(opts);
    if (opts.scroll) await this.target.scrollToView();
    await this.target.tap();
  }

  /** Wait, then dispatch a DOM `click()` via `runScript` (handler-firing fallback). */
  async click(opts: WebWaitOpts = {}): Promise<void> {
    await this.wait(opts);
    await this.target.runScript("(el) => el.click()");
  }

  /** Wait, then type into the element (`contentEditable` defaults to false). */
  async type(text: string, opts: WebWaitOpts & { contentEditable?: boolean } = {}): Promise<void> {
    await this.wait(opts);
    await this.target.typeText(text, opts.contentEditable ?? false);
  }

  /** Wait, then read the element's `.value` / `textContent` via `runScript`. */
  async getValue(opts: WebWaitOpts = {}): Promise<string> {
    await this.wait(opts);
    const value = await this.target.runScript("el => el.value || el.textContent || ''");
    return typeof value === "string" ? value : "";
  }
}

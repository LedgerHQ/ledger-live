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
  /** Max time to poll. Default {@link TIMEOUTS.XS}. */
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

/**
 * `runScript` body (string — no DOM lib in tsconfig) that sets a controlled
 * `<input>`'s value the way React expects. React tracks the value via its own
 * descriptor, so assigning `el.value` is ignored; we call the native prototype
 * setter and dispatch a bubbling `input` event so React's `onChange` fires.
 * The new value arrives as `runScript`'s arg. Mirrors e2e/mobile's typeText.
 */
const SET_VALUE_SCRIPT = `(el, val) => {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  if (setter) setter.call(el, val); else el.value = val;
  el.dispatchEvent(new Event('input', { bubbles: true }));
}`;

export class WebHandle {
  /**
   * @param target the resolved Detox web element.
   * @param description human-readable locator (e.g. `testId "pay-button"`),
   *   surfaced in {@link wait}'s timeout error so a failure names the element.
   *   Supplied by the `webView(...)` factories in ./surface.
   */
  constructor(
    private readonly target: Detox.WebElement,
    private readonly description: string,
  ) {}

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
    const timeout = opts.timeout ?? TIMEOUTS.XS;
    const interval = opts.interval ?? POLL_INTERVAL;
    const start = Date.now();
    for (;;) {
      const ready = opts.visible ? await this.visible() : await this.exists();
      if (ready) return this.target;
      if (Date.now() - start > timeout) {
        throw new Error(
          `WebHandle.wait: timed out after ${timeout}ms waiting for web element ${
            this.description
          } to ${opts.visible ? "be visible" : "exist"}`,
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

  /**
   * Wait, then set a React-controlled `<input>`'s value (replacing any existing
   * content) and fire its `onChange`. Use this instead of {@link type} for
   * framework-controlled fields where simulated keystrokes don't register —
   * e.g. the swap amount input.
   */
  async fill(value: string, opts: WebWaitOpts = {}): Promise<void> {
    await this.wait(opts);
    await this.target.runScript(SET_VALUE_SCRIPT, [value]);
  }

  /** Wait, then read the element's `.value` / `textContent` via `runScript`. */
  async getValue(opts: WebWaitOpts = {}): Promise<string> {
    await this.wait(opts);
    const value = await this.target.runScript("el => el.value || el.textContent || ''");
    return typeof value === "string" ? value : "";
  }
}

import { by, element, expect as detoxExpect, waitFor } from "detox";
import type {
  AndroidElementAttributes,
  IosElementAttributes,
  NativeElement,
  NativeMatcher,
} from "detox/detox";
import { retryUntilTimeout } from "@e2e/utils/retry";
import { TIMEOUT } from "@e2e/utils/timeouts";
import type { ElementHandle } from "./elementHandle";
import { waitHardTimeout, withHardTimeout } from "./hardTimeout";

type ElementAttributes = IosElementAttributes | AndroidElementAttributes;

/**
 * A native (React Native) element, declared once with its match strategy.
 * Every action waits up to `timeout` (default 60s) for the element to be visible, then acts.
 * Build one with {@link byId}.
 */
export class NativeHandle implements ElementHandle {
  private readonly createMatcher: () => NativeMatcher;
  private readonly description: string;

  constructor(createMatcher: () => NativeMatcher, description: string) {
    this.createMatcher = createMatcher;
    this.description = description;
  }

  /** The first matching Detox element, with no wait and no hard timeout. */
  private get raw(): NativeElement {
    // Android's atIndex mutates the matcher it wraps, so every element needs a fresh one.
    return element(this.createMatcher()).atIndex(0);
  }

  /** Waits until at least 75% of the element is visible. */
  async waitVisible(timeout = TIMEOUT.xxlarge): Promise<void> {
    await this.waitUntil(waitFor(this.raw).toBeVisible().withTimeout(timeout), timeout, "visible");
  }

  /** Waits until 100% of the element is visible. Use it for bottom sheets: they pass 75% while still sliding. */
  async waitFullyVisible(timeout = TIMEOUT.xxlarge): Promise<void> {
    await this.waitUntil(
      waitFor(this.raw).toBeVisible(100).withTimeout(timeout),
      timeout,
      "fully visible",
    );
  }

  /** Waits until the element is no longer visible. Throws if it is still visible after the timeout. */
  async waitGone(timeout = TIMEOUT.xxlarge): Promise<void> {
    await this.waitUntil(
      waitFor(this.raw).not.toBeVisible().withTimeout(timeout),
      timeout,
      "hidden",
    );
  }

  /** Waits for visibility, then taps. */
  async tap(timeout = TIMEOUT.xxlarge): Promise<void> {
    await this.waitVisible(timeout);
    await withHardTimeout(this.raw.tap());
  }

  /**
   * Waits until the element exists, then taps, leaving the visibility check to Detox's tap. Only for a
   * control `waitVisible` never accepts although it is on screen (e.g. its parent's layout box clips it
   * on Android). Say why at the call site.
   */
  async tapExisting(timeout = TIMEOUT.xxlarge): Promise<void> {
    await this.waitUntil(waitFor(this.raw).toExist().withTimeout(timeout), timeout, "present");
    await withHardTimeout(this.raw.tap());
  }

  /** Waits for visibility, then focuses the field, replaces its content and presses Enter. */
  async replaceText(text: string, timeout = TIMEOUT.xxlarge): Promise<void> {
    await this.replaceTextKeepKeyboard(text, timeout);
    await withHardTimeout(this.raw.typeText("\n"));
  }

  /** Like {@link replaceText} without pressing Enter, so the keyboard stays open and the form is not submitted. */
  async replaceTextKeepKeyboard(text: string, timeout = TIMEOUT.xxlarge): Promise<void> {
    await this.waitVisible(timeout);
    await withHardTimeout(this.raw.tap());
    await withHardTimeout(this.raw.replaceText(text));
  }

  /** Waits for visibility, then clears the field. */
  async clearText(timeout = TIMEOUT.xxlarge): Promise<void> {
    await this.waitVisible(timeout);
    await withHardTimeout(this.raw.clearText());
  }

  /** Waits for visibility, then returns the element's attributes (`enabled`, `label`…). */
  async getAttributes(timeout = TIMEOUT.xxlarge): Promise<ElementAttributes> {
    await this.waitVisible(timeout);
    const attributes = await withHardTimeout(
      retryUntilTimeout(() => this.raw.getAttributes(), timeout),
      waitHardTimeout(timeout),
    );
    return "elements" in attributes ? attributes.elements[0] : attributes;
  }

  /** Waits for visibility, then returns the element's text ("" when it has none). */
  async getText(timeout = TIMEOUT.xxlarge): Promise<string> {
    const { text } = await this.getAttributes(timeout);
    return text ?? "";
  }

  /** Asserts the element is visible now. A Detox expect: synchronised with the app, it does not wait. */
  async expectVisible(): Promise<void> {
    await withHardTimeout(detoxExpect(this.raw).toBeVisible());
  }

  /** Asserts the element is not visible now. A Detox expect: synchronised with the app, it does not wait. */
  async expectNotVisible(): Promise<void> {
    await withHardTimeout(detoxExpect(this.raw).not.toBeVisible());
  }

  /** Asserts the element's text now. A Detox expect: synchronised with the app, it does not wait. */
  async expectText(text: string): Promise<void> {
    await withHardTimeout(detoxExpect(this.raw).toHaveText(text));
  }

  /** Names the element in the failure and keeps the Detox message, hard timeout marker included. */
  private async waitUntil(wait: Promise<unknown>, timeout: number, state: string): Promise<void> {
    try {
      await withHardTimeout(wait, waitHardTimeout(timeout));
    } catch (error) {
      const details = error instanceof Error ? error.message : String(error);
      throw new Error(`${this.description} did not become ${state}: ${details}`, { cause: error });
    }
  }
}

/** Matches by React Native `testID` (Detox `by.id`). */
export const byId = (id: string | RegExp): NativeHandle =>
  new NativeHandle(() => by.id(id), `#${id}`);

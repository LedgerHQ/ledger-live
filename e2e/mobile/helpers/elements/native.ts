import { by, element, expect as detoxExpect, waitFor } from "detox";
import type {
  AndroidElementAttributes,
  IosElementAttributes,
  NativeElement,
  NativeMatcher,
} from "detox/detox";
import { PageScroller } from "@e2e/helpers/pageScroller";
import { retryUntilTimeout } from "@e2e/utils/retry";
import { TIMEOUT } from "@e2e/utils/timeouts";
import type { ElementHandle } from "./elementHandle";
import { isHardTimeout, waitHardTimeout, withHardTimeout } from "./hardTimeout";

type ElementAttributes = IosElementAttributes | AndroidElementAttributes;

const scroller = new PageScroller();

/**
 * A native (React Native) element, declared once with its match strategy.
 * Every action waits up to `timeout` (default 60s) for the element to be visible, then acts.
 * Build one with {@link byId}, {@link byIdAndText}, {@link byIdWithDescendantText} or
 * {@link byTextWithAncestorId}.
 */
export class NativeHandle implements ElementHandle {
  private readonly createMatcher: () => NativeMatcher;
  private readonly description: string;
  private readonly index: number;

  constructor(createMatcher: () => NativeMatcher, description: string, index = 0) {
    this.createMatcher = createMatcher;
    this.description = description;
    this.index = index;
  }

  /** The matching Detox element at `index`, with no wait and no hard timeout. */
  private get raw(): NativeElement {
    // Android's atIndex mutates the matcher it wraps, so every element needs a fresh one.
    return element(this.createMatcher()).atIndex(this.index);
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
  async waitNotVisible(timeout = TIMEOUT.xxlarge): Promise<void> {
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

  /**
   * Returns whether the element becomes visible within `timeout`, for an element that may or may not
   * appear. A hung app still throws.
   */
  async isVisible(timeout = TIMEOUT.xxsmall): Promise<boolean> {
    try {
      await withHardTimeout(
        waitFor(this.raw).toBeVisible().withTimeout(timeout),
        waitHardTimeout(timeout),
      );
      return true;
    } catch (error) {
      if (isHardTimeout(error)) throw error;
      return false;
    }
  }

  /** Scrolls `container` (default: the first scroll view on screen) until the element is visible. */
  async scrollTo(container?: NativeHandle): Promise<void> {
    await scroller.performScroll(this.createMatcher(), container?.createMatcher());
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

/**
 * Matches by React Native `testID` (Detox `by.id`).
 * `index` picks the n-th match, the first by default.
 */
export const byId = (id: string | RegExp, index = 0): NativeHandle =>
  new NativeHandle(() => by.id(id), index ? `#${id}[${index}]` : `#${id}`, index);

/** Matches by `testID` and the element's own text. */
export const byIdAndText = (id: string | RegExp, text: string | RegExp): NativeHandle =>
  new NativeHandle(() => by.id(id).and(by.text(text)), `#${id} with text "${text}"`);

/** Matches by `testID` and the text of a descendant, e.g. a label inside a button or card. */
export const byIdWithDescendantText = (id: string, text: string | RegExp): NativeHandle =>
  new NativeHandle(
    () => by.id(id).withDescendant(by.text(text)),
    `#${id} containing text "${text}"`,
  );

/** Matches a text inside the `testID` element, for a text that has no `testID` of its own. */
export const byTextWithAncestorId = (id: string, text: string | RegExp): NativeHandle =>
  new NativeHandle(() => by.text(text).withAncestor(by.id(id)), `"${text}" inside #${id}`);

import { by, element } from "detox";
import type { ElementAttributes, NativeElement, NativeMatcher } from "detox/detox";
import { NativeElementHelpers } from "@e2e/helpers/elementHelpers";
import { TIMEOUT } from "@e2e/utils/timeouts";

/**
 * A native (React Native) element, declared once with its match strategy.
 * Every action waits up to `timeout` (default 60s) for the element to be visible, then acts.
 * To act without waiting, use {@link NativeHandle.raw}. Build one with {@link byId} or {@link byText}.
 */
export class NativeHandle {
  private readonly matcher: NativeMatcher;
  private readonly description: string;

  constructor(matcher: NativeMatcher, description: string) {
    this.matcher = matcher;
    this.description = description;
  }

  /** The first matching Detox element, with no wait. Escape hatch for actions this handle does not wrap. */
  get raw(): NativeElement {
    return element(this.matcher).atIndex(0);
  }

  /** Waits until at least 75% of the element is visible. */
  async waitVisible(timeout = TIMEOUT.xxlarge): Promise<void> {
    await NativeElementHelpers.waitForElement(this.raw, timeout);
  }

  /** Waits until 100% of the element is visible. Use it for bottom sheets: they pass 75% while still sliding. */
  async waitFullyVisible(timeout = TIMEOUT.xxlarge): Promise<void> {
    await NativeElementHelpers.waitForElement(this.raw, timeout, { visibilityPercentage: 100 });
  }

  /** Waits until the element is no longer visible. Throws if it is still visible after the timeout. */
  async waitGone(timeout = TIMEOUT.xxlarge): Promise<void> {
    const gone = await NativeElementHelpers.waitForElementNotVisibleByElement(this.raw, timeout);
    if (!gone) throw new Error(`${this.description} is still visible after ${timeout}ms`);
  }

  /** Waits for visibility, then taps. */
  async tap(timeout = TIMEOUT.xxlarge): Promise<void> {
    await this.waitVisible(timeout);
    await NativeElementHelpers.tapByElement(this.raw);
  }

  /** Waits for visibility, then focuses the field, replaces its content and presses Enter. */
  async replaceText(text: string, timeout = TIMEOUT.xxlarge): Promise<void> {
    await this.waitVisible(timeout);
    await NativeElementHelpers.typeTextByElement(this.raw, text);
  }

  /** Waits for visibility, then clears the field. */
  async clearText(timeout = TIMEOUT.xxlarge): Promise<void> {
    await this.waitVisible(timeout);
    await NativeElementHelpers.clearTextByElement(this.raw);
  }

  /** Waits for visibility, then returns the element's text ("" when it has none). */
  async getText(timeout = TIMEOUT.xxlarge): Promise<string> {
    await this.waitVisible(timeout);
    return NativeElementHelpers.getTextByElement(this.raw);
  }

  /** Waits for visibility, then returns the element's attributes (`enabled`, `label`…). */
  async getAttributes(timeout = TIMEOUT.xxlarge): Promise<ElementAttributes> {
    await this.waitVisible(timeout);
    return NativeElementHelpers.getAttributesByElement(this.raw);
  }
}

/** Matches by React Native `testID` (Detox `by.id`). */
export const byId = (id: string | RegExp): NativeHandle => new NativeHandle(by.id(id), `#${id}`);

/** Matches by visible text (Detox `by.text`). */
export const byText = (text: string | RegExp): NativeHandle =>
  new NativeHandle(by.text(text), `text "${text}"`);

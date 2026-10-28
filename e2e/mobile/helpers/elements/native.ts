import { by, element, waitFor } from "detox";
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
 * Build one with {@link byId} or {@link byText}.
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
    await withHardTimeout(
      waitFor(this.raw).toBeVisible().withTimeout(timeout),
      waitHardTimeout(timeout),
    );
  }

  /** Waits until 100% of the element is visible. Use it for bottom sheets: they pass 75% while still sliding. */
  async waitFullyVisible(timeout = TIMEOUT.xxlarge): Promise<void> {
    await withHardTimeout(
      waitFor(this.raw).toBeVisible(100).withTimeout(timeout),
      waitHardTimeout(timeout),
    );
  }

  /** Waits until the element is no longer visible. Throws if it is still visible after the timeout. */
  async waitGone(timeout = TIMEOUT.xxlarge): Promise<void> {
    try {
      await withHardTimeout(
        waitFor(this.raw).not.toBeVisible().withTimeout(timeout),
        waitHardTimeout(timeout),
      );
    } catch (error) {
      const details = error instanceof Error ? error.message : String(error);
      throw new Error(`${this.description} did not become hidden: ${details}`, { cause: error });
    }
  }

  /** Waits for visibility, then taps. */
  async tap(timeout = TIMEOUT.xxlarge): Promise<void> {
    await this.waitVisible(timeout);
    await withHardTimeout(this.raw.tap());
  }

  /** Waits for visibility, then focuses the field, replaces its content and presses Enter. */
  async replaceText(text: string, timeout = TIMEOUT.xxlarge): Promise<void> {
    await this.waitVisible(timeout);
    await withHardTimeout(this.raw.tap());
    await withHardTimeout(this.raw.replaceText(text));
    await withHardTimeout(this.raw.typeText("\n"));
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
}

/** Matches by React Native `testID` (Detox `by.id`). */
export const byId = (id: string | RegExp): NativeHandle =>
  new NativeHandle(() => by.id(id), `#${id}`);

/** Matches by visible text (Detox `by.text`). */
export const byText = (text: string | RegExp): NativeHandle =>
  new NativeHandle(() => by.text(text), `text "${text}"`);

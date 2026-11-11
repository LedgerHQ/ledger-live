import { by, device, element, expect as detoxExpect, waitFor } from "detox";
import type {
  AndroidElementAttributes,
  Direction,
  IosElementAttributes,
  NativeElement,
  NativeMatcher,
} from "detox/detox";
import { PageScroller } from "@e2e/helpers/pageScroller";
import { expectWithinTolerance } from "@e2e/utils/amountUtils";
import { retryUntilTimeout } from "@e2e/utils/retry";
import { INTERVAL, TIMEOUT } from "@e2e/utils/timeouts";
import type { ElementHandle } from "./elementHandle";
import { isHardTimeout, waitHardTimeout, withHardTimeout } from "./hardTimeout";

type ElementAttributes = IosElementAttributes | AndroidElementAttributes;

type NativeHandleOptions = {
  createMatcher: () => NativeMatcher;
  description: string;
  /** Which match to act on when several elements match, the first by default. */
  index?: number;
};

type WaitUnlessErrorOptions = {
  /** One short check of the awaited element. */
  isFound: () => Promise<boolean>;
  errorElement: NativeHandle;
  timeout: number;
  state: "visible" | "present";
};

type ScrollOptions = {
  /** Scroll step, 300 by default. */
  pixels?: number;
  /** Where the content moves into view from: "down" (the default) reveals what is below. */
  direction?: Direction;
};

type ExpectTextOptions = {
  /** Any run of whitespace, non-breaking spaces included, counts as one space; zero-width spaces and edges are dropped. */
  normaliseWhitespace?: boolean;
  /** The element's text contains `text` instead of being equal to it. */
  containing?: boolean;
  /** Letter case is ignored, e.g. a checksummed EVM address against a lowercase fixture. */
  ignoreCase?: boolean;
};

type ExpectAmountOptions = {
  /** How far the amount may be from the expected one, either way. 0 by default: equal. */
  tolerance?: number;
};

/** Applies the options that change the text itself, to the actual and the expected text alike. */
const prepareText = (value: string, { normaliseWhitespace, ignoreCase }: ExpectTextOptions) => {
  const spaced = normaliseWhitespace
    ? value.replaceAll(/\s+/g, " ").replaceAll("\u200B", "").trim()
    : value;
  return ignoreCase ? spaced.toLowerCase() : spaced;
};

/** Compares an element's text as the options say: equal by default, or containing. */
const compareText = (actual: string, expected: string, options: ExpectTextOptions) => {
  const preparedActual = prepareText(actual, options);
  const preparedExpected = prepareText(expected, options);
  if (options.containing) {
    jestExpect(preparedActual).toContain(preparedExpected);
  } else {
    jestExpect(preparedActual).toBe(preparedExpected);
  }
};

const scroller = new PageScroller();

/** How far past the viewport edge `revealForTap` pushes an element, so a sticky header or footer cannot take the tap. */
const EDGE_CLEARANCE_PIXELS = 200;

/**
 * A native (React Native) element, declared once with its match strategy.
 * Every action waits up to `timeout` (default 60s) for the element to be visible, then acts.
 * Build one with {@link byId}, {@link byText}, {@link byIdAndText}, {@link byIdWithDescendantText}
 * or {@link byTextWithAncestorId}.
 */
export class NativeHandle implements ElementHandle {
  private readonly createMatcher: () => NativeMatcher;
  private readonly description: string;
  private readonly index: number;

  constructor(options: NativeHandleOptions) {
    const { createMatcher, description, index = 0 } = options;
    this.createMatcher = createMatcher;
    this.description = description;
    this.index = index;
  }

  /** The matching Detox element at `index`, with no wait and no hard timeout. */
  private get raw(): NativeElement {
    // Android's atIndex mutates the matcher it wraps, so every element needs a fresh one.
    return element(this.createMatcher()).atIndex(this.index);
  }

  /**
   * Waits until at least 75% of the element is visible. With `errorElement`, throws as soon as that
   * error element is visible instead of waiting out the timeout.
   */
  async waitVisible(timeout = TIMEOUT.xxlarge, errorElement?: NativeHandle): Promise<void> {
    if (errorElement) {
      await this.waitUnlessError({
        isFound: () => this.isVisible(TIMEOUT.xxxsmall),
        errorElement,
        timeout,
        state: "visible",
      });
      return;
    }
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

  /**
   * Waits until the element is removed from the view hierarchy. Use it for a closing sheet: it can
   * still block taps once it is no longer visible.
   */
  async waitNotExist(timeout = TIMEOUT.xxlarge): Promise<void> {
    await this.waitUntil(waitFor(this.raw).not.toExist().withTimeout(timeout), timeout, "removed");
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
    await this.waitExist(timeout);
    await withHardTimeout(this.raw.tap());
  }

  /**
   * Waits until the element is in the view hierarchy, without the visibility check: for a list Detox
   * does not measure as visible while it renders. With `errorElement`, throws as soon as that error
   * element is visible instead of waiting out the timeout.
   */
  async waitExist(timeout = TIMEOUT.xxlarge, errorElement?: NativeHandle): Promise<void> {
    if (errorElement) {
      await this.waitUnlessError({
        isFound: () => this.exists(TIMEOUT.xxxsmall),
        errorElement,
        timeout,
        state: "present",
      });
      return;
    }
    await this.waitUntil(waitFor(this.raw).toExist().withTimeout(timeout), timeout, "present");
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

  /** Waits for visibility, then returns the element's accessibility label ("" when it has none). */
  async getLabel(timeout = TIMEOUT.xxlarge): Promise<string> {
    const { label } = await this.getAttributes(timeout);
    return label ?? "";
  }

  /** Waits for visibility, then returns the element's `testID`, e.g. the full id behind a regex match. */
  async getIdentifier(timeout = TIMEOUT.xxlarge): Promise<string> {
    const { identifier } = await this.getAttributes(timeout);
    return identifier;
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

  /**
   * Returns whether the element is visible once the app is idle, like {@link expectVisible} but
   * without throwing: to pick the on-screen match among several. Unlike {@link isVisible}, a screen
   * still settling is waited for, not reported as hidden. A hung app still throws.
   */
  async isVisibleNow(): Promise<boolean> {
    try {
      await this.expectVisible();
      return true;
    } catch (error) {
      if (isHardTimeout(error)) throw error;
      return false;
    }
  }

  /**
   * Returns how many elements match, 0 when none, e.g. the rows of a list. It ignores the handle's
   * index and does not wait. A hung app still throws.
   */
  async count(): Promise<number> {
    try {
      const attributes = await withHardTimeout(element(this.createMatcher()).getAttributes());
      return "elements" in attributes ? attributes.elements.length : 1;
    } catch (error) {
      if (isHardTimeout(error)) throw error;
      return 0;
    }
  }

  /** Asserts how many elements match now, e.g. the rows of a list. Like {@link count}, it does not wait. */
  async expectCount(expected: number): Promise<void> {
    jestExpect(await this.count()).toBe(expected);
  }

  /** Returns whether the element is in the view hierarchy within `timeout`. A hung app still throws. */
  private async exists(timeout: number): Promise<boolean> {
    try {
      await withHardTimeout(
        waitFor(this.raw).toExist().withTimeout(timeout),
        waitHardTimeout(timeout),
      );
      return true;
    } catch (error) {
      if (isHardTimeout(error)) throw error;
      return false;
    }
  }

  /**
   * Scrolls `container` (default: the first scroll view on screen) until the element is visible,
   * starting in `direction` and turning back at the end. Both resolve to the same match index as
   * every other method of their handle.
   */
  async scrollTo(container?: NativeHandle, options: ScrollOptions = {}): Promise<void> {
    const { pixels, direction } = options;
    try {
      await scroller.performScroll(
        () => this.raw,
        container && (() => container.raw),
        pixels,
        direction,
      );
    } catch (error) {
      const details = error instanceof Error ? error.message : String(error);
      const scrollView = container?.description ?? "the first scroll view";
      throw new Error(`${this.description} not reached by scrolling ${scrollView}: ${details}`, {
        cause: error,
      });
    }
  }

  /**
   * Scrolls to the element, then on by `EDGE_CLEARANCE_PIXELS` in the same direction. `scrollTo`
   * stops as soon as the element is visible at the edge it came in through, where a sticky header or
   * footer can still take the tap (Android reports it visible anyway). Use before a tap; `scrollTo`
   * stays right for assertions.
   */
  async revealForTap(
    container?: NativeHandle,
    options: Pick<ScrollOptions, "direction"> = {},
  ): Promise<void> {
    const { direction = "down" } = options;
    await this.scrollTo(container, { direction });
    await scroller.scrollByPixels(
      container && (() => container.raw),
      EDGE_CLEARANCE_PIXELS,
      direction,
    );
  }

  /** Waits for visibility, then swipes on the element, e.g. down on a bottom sheet to close it. */
  async swipe(direction: Direction, timeout = TIMEOUT.xxlarge): Promise<void> {
    await this.waitVisible(timeout);
    await withHardTimeout(this.raw.swipe(direction));
  }

  /** Asserts the element is visible now. A Detox expect: synchronised with the app, it does not wait. */
  async expectVisible(): Promise<void> {
    await withHardTimeout(detoxExpect(this.raw).toBeVisible());
  }

  /** Asserts the element is not visible now. A Detox expect: synchronised with the app, it does not wait. */
  async expectNotVisible(): Promise<void> {
    await withHardTimeout(detoxExpect(this.raw).not.toBeVisible());
  }

  /** Asserts the element is in the view hierarchy now, visible or not. A Detox expect: it does not wait. */
  async expectExist(): Promise<void> {
    await withHardTimeout(detoxExpect(this.raw).toExist());
  }

  /**
   * Asserts the element is not in the view hierarchy now, e.g. a deleted row. Stricter than
   * {@link expectNotVisible}: an element scrolled off screen or hidden behind a sheet still fails.
   */
  async expectNotExist(): Promise<void> {
    await withHardTimeout(detoxExpect(this.raw).not.toExist());
  }

  /** Asserts a switch is on (`true`) or off now. A Detox expect: synchronised with the app, it does not wait. */
  async expectToggleValue(value: boolean): Promise<void> {
    await withHardTimeout(detoxExpect(this.raw).toHaveToggleValue(value));
  }

  /** Asserts the element's `testID` now, e.g. which row a regex or index match landed on. A Detox expect: it does not wait. */
  async expectId(id: string): Promise<void> {
    await withHardTimeout(detoxExpect(this.raw).toHaveId(id));
  }

  /**
   * Asserts the element's text. Without options, a Detox expect on the exact text now: it does not
   * wait. With options, waits for visibility, reads the text, then compares it as the options say.
   */
  async expectText(text: string, options: ExpectTextOptions = {}): Promise<void> {
    const noOptionSet = !Object.values(options).some(Boolean);
    if (noOptionSet) {
      await withHardTimeout(detoxExpect(this.raw).toHaveText(text));
      return;
    }
    compareText(await this.getText(), text, options);
  }

  /**
   * Waits for visibility, then asserts the accessibility value (iOS `value`, Android `label`), e.g. a
   * link that carries its URL there. Compares like {@link expectText} with options.
   */
  async expectAccessibilityValue(text: string, options: ExpectTextOptions = {}): Promise<void> {
    const { value, label } = await this.getAttributes();
    const accessibilityValue = device.getPlatform() === "ios" ? value : label;
    compareText(String(accessibilityValue ?? ""), text, options);
  }

  /**
   * Waits for visibility, then asserts the accessibility label, for an element whose value is only
   * in its label (e.g. a balance hidden behind discreet mode). Compares like {@link expectText} with
   * options.
   */
  async expectLabel(text: string, options: ExpectTextOptions = {}): Promise<void> {
    compareText(await this.getLabel(), text, options);
  }

  /**
   * Waits for visibility, reads the number in the element's text (a ticker or grouping commas are
   * dropped), then asserts it is within `tolerance` of `expected`, e.g. a max amount whose fee can
   * move between two steps.
   */
  async expectAmount(expected: number, options: ExpectAmountOptions = {}): Promise<void> {
    const { tolerance = 0 } = options;
    const amount = Number.parseFloat((await this.getText()).replaceAll(/[^\d.-]/g, ""));
    expectWithinTolerance({ actual: amount, expected, tolerance });
  }

  /** Waits for visibility, then asserts the element's text matches `pattern`. */
  async expectTextMatching(pattern: RegExp, timeout = TIMEOUT.xxlarge): Promise<void> {
    jestExpect(await this.getText(timeout)).toMatch(pattern);
  }

  /**
   * Waits for visibility, then asserts the element's accessibility label matches `pattern`.
   * For a control with no text of its own, e.g. a Lumen `Tag`.
   */
  async expectLabelMatching(pattern: RegExp, timeout = TIMEOUT.xxlarge): Promise<void> {
    jestExpect(await this.getLabel(timeout)).toMatch(pattern);
  }

  /**
   * Checks the element, then the error element, every round until one shows. A round returns
   * rather than throws on the error, since `retryUntilTimeout` retries on any throw. The error text
   * is read after the loop, so a failed read cannot turn into a retry. The whole wait has the same
   * hard timeout as a plain wait, so a hung app cannot stretch it.
   */
  private async waitUnlessError(options: WaitUnlessErrorOptions): Promise<void> {
    const { isFound, errorElement, timeout, state } = options;
    const errorShown = await withHardTimeout(
      retryUntilTimeout<boolean>(
        async () => {
          if (await isFound()) return false;
          if (await errorElement.isVisible(TIMEOUT.xxxsmall)) return true;
          throw new Error(`${this.description} is not ${state} yet`);
        },
        timeout,
        INTERVAL.short,
        { messageOnError: `${this.description} did not become ${state} within ${timeout}ms` },
      ),
      waitHardTimeout(timeout),
    );
    if (errorShown) {
      const errorText = await errorElement.getText(TIMEOUT.xxxsmall);
      throw new Error(
        `${errorElement.description} showed while waiting for ${this.description}: ${errorText}`,
      );
    }
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
  new NativeHandle({
    createMatcher: () => by.id(id),
    description: index ? `#${id}[${index}]` : `#${id}`,
    index,
  });

/**
 * Matches by visible text, for an element with no `testID` (e.g. a navigation header title).
 * `index` picks the n-th match, the first by default.
 */
export const byText = (text: string | RegExp, index = 0): NativeHandle =>
  new NativeHandle({
    createMatcher: () => by.text(text),
    description: index ? `"${text}"[${index}]` : `"${text}"`,
    index,
  });

/** A `testID` and a text, named so the two strings cannot be swapped by mistake. */
type IdAndTextOptions = {
  id: string | RegExp;
  text: string | RegExp;
};

/** Matches by `testID` and the element's own text. */
export const byIdAndText = (options: IdAndTextOptions): NativeHandle => {
  const { id, text } = options;
  return new NativeHandle({
    createMatcher: () => by.id(id).and(by.text(text)),
    description: `#${id} with text "${text}"`,
  });
};

/** Matches by `testID` and the text of a descendant, e.g. a label inside a button or card. */
export const byIdWithDescendantText = (options: IdAndTextOptions): NativeHandle => {
  const { id, text } = options;
  return new NativeHandle({
    createMatcher: () => by.id(id).withDescendant(by.text(text)),
    description: `#${id} containing text "${text}"`,
  });
};

/** Matches a text inside the `testID` element, for a text that has no `testID` of its own. */
export const byTextWithAncestorId = (options: IdAndTextOptions): NativeHandle => {
  const { id, text } = options;
  return new NativeHandle({
    createMatcher: () => by.text(text).withAncestor(by.id(id)),
    description: `"${text}" inside #${id}`,
  });
};

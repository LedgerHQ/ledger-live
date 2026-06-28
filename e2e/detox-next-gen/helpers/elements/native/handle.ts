/**
 * Native (React Native) element handle — the action-ready locator the rest of
 * the suite uses. Build one with a `by*` factory (see ./factories) so the
 * match strategy is explicit; the handle owns the wait-then-act logic (it's
 * the sole implementation — there is no separate free-function layer).
 *
 * Every action waits for visibility first: Detox can only interact with an
 * element that is ≥75% visible, so acting before it has rendered is the #1
 * source of flake. `el()` / `NativeHandle.raw` is the escape hatch for actions
 * not wrapped here (longPress, swipe, scroll, …).
 *
 * `expect` is imported as `detoxExpect` so it never collides with Jest's
 * global `expect`.
 */
import { element, waitFor, expect as detoxExpect } from "detox";
import { TIMEOUTS, POLL_INTERVAL, sleep } from "../../timeouts";

export type ActionOpts = {
  /** Max time to wait for the element before acting. Default {@link TIMEOUTS.XS}. */
  timeout?: number;
  /** Disambiguate when a matcher resolves to several elements (e.g. `by.text(...)`). */
  index?: number;
};

/** First match (single element) or the multi-match `{ elements }` shape, normalised. */
export type SingleAttributes = Detox.IosElementAttributes | Detox.AndroidElementAttributes;

/**
 * Resolve a matcher (+ optional index) to a raw Detox element. Escape hatch
 * for actions the handle doesn't wrap, e.g. `await el(by.id("list")).swipe("up")`.
 */
export function el(matcher: Detox.NativeMatcher, index?: number): Detox.NativeElement {
  const matched = element(matcher);
  return typeof index === "number" ? matched.atIndex(index) : matched;
}

/**
 * Action-ready native locator: a matcher (+ optional index) exposing the
 * wait-then-act helpers as methods.
 */
export class NativeHandle {
  constructor(
    private readonly matcher: Detox.NativeMatcher,
    private readonly index?: number,
  ) {}

  /** Disambiguate a multi-match matcher. Returns a new handle (immutable). */
  atIndex(index: number): NativeHandle {
    return new NativeHandle(this.matcher, index);
  }

  /** The underlying Detox element — escape hatch for longPress/swipe/scroll/etc. */
  get raw(): Detox.NativeElement {
    return el(this.matcher, this.index);
  }

  /** Merge the handle's stored index with per-call opts (explicit opts.index wins). */
  private opts(opts: ActionOpts = {}): ActionOpts {
    return this.index === undefined ? opts : { index: this.index, ...opts };
  }

  /** Wait until visible. Returns the resolved element so callers can chain a raw action. */
  async waitVisible(o?: ActionOpts): Promise<Detox.NativeElement> {
    const opts = this.opts(o);
    const target = el(this.matcher, opts.index);
    await waitFor(target)
      .toBeVisible()
      .withTimeout(opts.timeout ?? TIMEOUTS.XS);
    return target;
  }

  /** Wait until present in the hierarchy (may be off-screen). Prefer {@link waitVisible} before acting. */
  async waitExists(o?: ActionOpts): Promise<Detox.NativeElement> {
    const opts = this.opts(o);
    const target = el(this.matcher, opts.index);
    await waitFor(target)
      .toExist()
      .withTimeout(opts.timeout ?? TIMEOUTS.XS);
    return target;
  }

  /** Wait until no longer visible (e.g. a spinner/overlay clears). */
  async waitGone(o?: ActionOpts): Promise<void> {
    const opts = this.opts(o);
    await waitFor(el(this.matcher, opts.index))
      .not.toBeVisible()
      .withTimeout(opts.timeout ?? TIMEOUTS.XS);
  }

  /**
   * Wait until this element is visible, racing it against an error element so a
   * known failure screen fails fast — with its on-screen text — instead of
   * burning the whole timeout. Generic across flows: pass any success vs error
   * locators (swap success vs device-action error, a Send confirmation vs a Send
   * error, …) plus an `errorLabel` for the thrown message.
   *
   * Polls (not Detox `waitFor`) so both outcomes are checked each tick — required
   * when synchronization is disabled, as in the on-device signing flows.
   */
  async waitVisibleOrError(
    errorTarget: NativeHandle,
    o: ActionOpts & { errorLabel?: string } = {},
  ): Promise<void> {
    const timeout = o.timeout ?? TIMEOUTS.XS;
    const label = o.errorLabel ?? "waitVisibleOrError";
    const start = Date.now();
    for (;;) {
      if (await this.isVisible()) return;
      if (await errorTarget.isVisible()) {
        const detail = (await errorTarget.getText().catch(() => "")).trim();
        throw new Error(`${label} failed: error screen shown${detail ? ` — "${detail}"` : ""}`);
      }
      if (Date.now() - start >= timeout) {
        throw new Error(
          `${label}: element not visible within ${timeout}ms (no error screen shown)`,
        );
      }
      await sleep(POLL_INTERVAL);
    }
  }

  /** Wait for visibility, then tap. */
  async tap(o?: ActionOpts): Promise<void> {
    const target = await this.waitVisible(o);
    await target.tap();
  }

  /** Wait for visibility, then type (append). Use {@link replaceText} to overwrite. */
  async typeText(text: string, o?: ActionOpts): Promise<void> {
    const target = await this.waitVisible(o);
    await target.typeText(text);
  }

  /** Wait for visibility, then replace the field's entire content. */
  async replaceText(text: string, o?: ActionOpts): Promise<void> {
    const target = await this.waitVisible(o);
    await target.replaceText(text);
  }

  /** Wait for visibility, then clear the field. */
  async clearText(o?: ActionOpts): Promise<void> {
    const target = await this.waitVisible(o);
    await target.clearText();
  }

  /** Read attributes, normalising Detox's single vs `{ elements }` shapes to the first match. */
  async getAttributes(o?: ActionOpts): Promise<SingleAttributes> {
    const attrs = await el(this.matcher, this.opts(o).index).getAttributes();
    return "elements" in attrs ? attrs.elements[0] : attrs;
  }

  /** Read the element's `text` attribute (handles the multi-match shape). */
  async getText(o?: ActionOpts): Promise<string> {
    const attrs = await this.getAttributes(o);
    return attrs?.text ?? "";
  }

  /** True if visible right now — resolves immediately, never throws. */
  async isVisible(): Promise<boolean> {
    try {
      await detoxExpect(el(this.matcher, this.index)).toBeVisible();
      return true;
    } catch {
      return false;
    }
  }

  /** True if present in the hierarchy right now — resolves immediately, never throws. */
  async exists(): Promise<boolean> {
    try {
      await detoxExpect(el(this.matcher, this.index)).toExist();
      return true;
    } catch {
      return false;
    }
  }
}

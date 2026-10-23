/**
 * The duration scale of the desktop E2E suite: upper bounds for "give up after this long".
 * The buckets are the mobile suite's (`e2e/mobile/utils/timeouts.ts`), so both suites share one
 * vocabulary.
 *
 * Most waits rely on the defaults: the page timeout set in `fixtures/common.ts` for actions and
 * locator waits, and the `expect` timeout in `playwright.config.ts`. Pass a bucket only to a wait
 * that legitimately outlasts its default, and pick the smallest bucket that covers its slowest
 * passing run. An oversized timeout costs nothing on a passing test, but every failing one waits
 * for it to expire.
 */

/*
 * Typed as `number` rather than `as const`: a literal type would make
 * `async waitFor(timeout = TIMEOUT.xxlarge)` infer the parameter as that bucket's value, so a
 * caller passing another bucket would fail to typecheck.
 */

/** Upper bounds for "wait until X happens", from shortest to longest. */
interface TimeoutScale {
  /** "Is this already on screen right now?". Never for something still loading. */
  readonly xxxsmall: number;
  /** Probe an element that is either already mounted or genuinely absent. */
  readonly xxsmall: number;
  /** A short probe of an optional affordance, where a miss should not cost a full wait. */
  readonly xsmall: number;
  /** A purely local UI transition: a modal opens, a route changes, a list re-renders. */
  readonly small: number;
  /** One round-trip outside the main window: a webview reacting, the device mock server. */
  readonly medium: number;
  /** A swap quote or an amount that settles after a provider round-trip. */
  readonly large: number;
  /** Something remote getting ready: a Live App, Speculos, quotes. */
  readonly xlarge: number;
  /** A screen that mounts behind an account sync or a webview load. */
  readonly xxlarge: number;
  /** App start-up, a device account scan, a slow account sync. */
  readonly xxxlarge: number;
  /** An on-chain confirmation, e.g. a token approval being mined. */
  readonly xxxxlarge: number;
}

export const TIMEOUT: TimeoutScale = {
  xxxsmall: 500,
  xxsmall: 1_000,
  xsmall: 2_000,
  small: 5_000,
  medium: 10_000,
  large: 20_000,
  xlarge: 30_000,
  xxlarge: 60_000,
  xxxlarge: 120_000,
  xxxxlarge: 300_000,
};

/**
 * Upper bounds for "give up after this long", shared by the desktop (Playwright) and mobile
 * (Detox) E2E suites so both speak one duration vocabulary. Each suite re-exports `TIMEOUT` from
 * its own `utils/timeouts.ts`, next to the durations only that suite uses.
 *
 * Pick the *smallest* bucket that is not flaky. An oversized timeout costs nothing on a passing
 * test, but it makes a failing one take much longer to report, and on a shared CI runner every
 * other spec pays for it too.
 */

/*
 * Typed as `number` rather than `as const`. A literal type would make
 * `async waitFor(timeout = TIMEOUT.xxlarge)` infer the parameter as that bucket's literal value,
 * so every caller passing a different bucket would fail to typecheck.
 *
 * The docs below say what each bucket is for, not how long it is: the value lives only in the
 * object, so the two cannot drift apart.
 */

/** Upper bounds for "wait until X happens", from shortest to longest. */
interface TimeoutScale {
  /** "Is this already on screen right now?". Never for something still loading. */
  readonly xxxsmall: number;
  /** Probe an element that is either already mounted or genuinely absent. */
  readonly xxsmall: number;
  /** A short probe: an optional affordance that may or may not render (e.g. an "expand"
   * toggle), where waiting the full `small` budget would be paid on every miss. */
  readonly xsmall: number;
  /** A purely local UI transition: a drawer or modal opens, a screen or route changes, a list
   * re-renders. */
  readonly small: number;
  /** One round-trip outside the app's own UI: the E2E bridge, a webview reacting, the device
   * mock server. */
  readonly medium: number;
  /** A swap quote or amount that has to settle after a provider round-trip. */
  readonly large: number;
  /** Something remote getting ready: a live app, Speculos, quotes, a partner's reply. */
  readonly xlarge: number;
  /** A screen that mounts behind a sync or a webview (the mobile element-helper default). */
  readonly xxlarge: number;
  /** Cold start, portfolio first paint, a device account scan, fee estimation, a broadcast
   * landing. */
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

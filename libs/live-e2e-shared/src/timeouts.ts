/**
 * The duration vocabulary shared by the desktop (Playwright) and mobile (Detox) E2E suites.
 * Desktop imports it from here; mobile re-exports it from `e2e/mobile/utils/timeouts.ts`, next to
 * the durations only mobile uses.
 *
 * Two scales, deliberately kept apart:
 *  - `TIMEOUT`  — upper bounds: "give up after this long".
 *  - `INTERVAL` — fixed waits: "wait this long", once or between attempts.
 *
 * Passing an `INTERVAL` where a `TIMEOUT` belongs (or the reverse) is almost always a bug, so they
 * never share a name or a lookup.
 *
 * Pick the *smallest* bucket that is not flaky. An oversized timeout costs nothing on a passing
 * test, but it makes a failing one take much longer to report, and on a shared CI runner every
 * other spec pays for it too.
 */

/*
 * Both scales are typed as `number` rather than `as const`. A literal type would make
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

/** Fixed waits: a pause, or the cadence between attempts. Never use these as a timeout. */
interface IntervalScale {
  /** Busy-wait on something local: a file appearing, a process flushing before exit. */
  readonly instant: number;
  /** Tight poll inside a loop that is already bounded by a TIMEOUT. */
  readonly tick: number;
  /** Default retry cadence. */
  readonly short: number;
  /** Let an animation or a scroll settle before asserting on it, or poll app state that is
   * still loading. */
  readonly medium: number;
  /** Poll something expensive (a webview query, a trustchain read), or pause for the app. */
  readonly long: number;
  /** Poll a remote service whose state changes slowly, e.g. a Speculos health check. */
  readonly slow: number;
}

export const INTERVAL: IntervalScale = {
  instant: 100,
  tick: 200,
  short: 500,
  medium: 1_000,
  long: 2_000,
  slow: 5_000,
};

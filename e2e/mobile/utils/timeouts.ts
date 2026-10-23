/**
 * The shared duration vocabulary of the mobile E2E suite.
 *
 * Two scales, deliberately kept apart:
 *  - `TIMEOUT`  — upper bounds: "give up after this long".
 *  - `INTERVAL` — fixed waits: "wait this long", once or between attempts.
 *
 * `TIMEOUT` is shared with the desktop suite: it lives in `@ledgerhq/live-e2e-shared/timeouts`
 * and this file re-exports it.
 *
 * Passing an `INTERVAL` where a `TIMEOUT` belongs (or the reverse) is almost always a
 * bug, so they never share a name or a lookup.
 *
 * Pick the *smallest* bucket that is not flaky. An oversized timeout costs nothing on a
 * passing test, but it makes a failing one take much longer to report — and on a shared
 * CI runner that cost is paid by every other spec in the shard.
 *
 * The scales are a vocabulary, so every bucket stays even while a single file uses it.
 * Beyond them, a named budget lives here only when more than one file relies on it. A
 * budget that bounds one file's own flow (a per-test override, a harness step, a partner's
 * server-side wait) stays in that file as a named constant, so its rationale travels with it.
 * Either way, a call site never passes a bare number.
 *
 * `jest.config.js` requires this file as well as the test code, so it must stay free of
 * non-erasable TypeScript syntax (no `enum`, no `namespace`) — Node strips the types at
 * require time — and import nothing but `@ledgerhq/live-e2e-shared`, which
 * `jest.config.js` already loads.
 */

/*
 * Both scales are typed as `number` rather than `as const`. A literal type would make
 * `async waitFor(timeout = TIMEOUT.xxlarge)` infer the parameter as that bucket's literal value,
 * so every caller passing a different bucket would fail to typecheck.
 *
 * The docs below say what each bucket is for, not how long it is: the value lives only in
 * the object, so the two cannot drift apart.
 */

export { TIMEOUT } from "@ledgerhq/live-e2e-shared/timeouts";

/** Fixed waits: a pause, or the cadence between attempts. Never use these as a timeout. */
interface IntervalScale {
  /** Busy-wait on something local: a file appearing, a process flushing before exit. */
  readonly instant: number;
  /** Tight poll inside a loop that is already bounded by a TIMEOUT. */
  readonly tick: number;
  /** Default retry cadence. */
  readonly short: number;
  /** Let an animation or a scroll settle before asserting on it. */
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

/** Jest's per-test budget. */
export const TEST_TIMEOUT = 360_000;

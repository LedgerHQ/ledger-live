/**
 * Single source of truth for every duration used by the mobile E2E suite.
 *
 * Two scales, deliberately kept apart:
 *  - `TIMEOUT`  — upper bounds: "give up after this long".
 *  - `INTERVAL` — cadences: "wait this long between attempts".
 *
 * Passing an `INTERVAL` where a `TIMEOUT` belongs (or the reverse) is almost always a
 * bug, so they never share a name or a lookup.
 *
 * Pick the *smallest* bucket that is not flaky. An oversized timeout costs nothing on a
 * passing test, but it makes a failing one take much longer to report — and on a shared
 * CI runner that cost is paid by every other spec in the shard.
 *
 * This file is required from `jest.config.js` and `detox.config.js` as well as from the
 * test code, so it must stay free of imports and of non-erasable TypeScript syntax
 * (no `enum`, no `namespace`) — Node strips the types at require time.
 */

/*
 * Both scales are typed as `number` rather than `as const`. A literal type would make
 * `async waitFor(timeout = TIMEOUT.l)` infer the parameter as `60000`, so every caller
 * passing a different bucket would fail to typecheck.
 */

/** Upper bounds for "wait until X happens". */
interface TimeoutScale {
  /** 500ms — "is this already on screen right now?". Never for something still loading. */
  readonly xxs: number;
  /** 1s — probe an element that is either already mounted or genuinely absent. */
  readonly xs: number;
  /**
   * 5s — a purely local UI transition: a drawer opens, a screen pushes, a list re-renders.
   * The default for every element-helper wait. Anything that has to cross the network or
   * a webview must ask for a bigger bucket explicitly at the call site.
   */
  readonly s: number;
  /**
   * 10s — one round-trip to something outside the app: the E2E bridge, a drawer that
   * mounts late after a cold start. Bridges what was a 6x gap between `s` and `m`.
   */
  readonly sm: number;
  /** 30s — anything crossing the network or the E2E bridge: sync, quotes, fee estimation. */
  readonly m: number;
  /** 1min — a screen that mounts behind a sync or a webview. */
  readonly l: number;
  /** 2min — cold start, portfolio first paint, waiting on a broadcast to land. */
  readonly xl: number;
  /** 5min — a whole device-signing flow (approve, sign, broadcast) end to end. */
  readonly xxl: number;
}

export const TIMEOUT: TimeoutScale = {
  xxs: 500,
  xs: 1_000,
  s: 5_000,
  sm: 10_000,
  m: 30_000,
  l: 60_000,
  xl: 120_000,
  xxl: 300_000,
};

/** Cadences for "try again in a moment". Never use these as a timeout. */
interface IntervalScale {
  /** 200ms — tight poll inside a loop that is already bounded by a TIMEOUT. */
  readonly tick: number;
  /** 500ms — default retry cadence. */
  readonly short: number;
  /** 1s — let an animation or a scroll settle before asserting on it. */
  readonly medium: number;
  /** 2s — poll something expensive: a webview query, an error-modal probe. */
  readonly long: number;
  /** 5s — poll a remote service whose state changes slowly, e.g. a Speculos health check. */
  readonly slow: number;
}

export const INTERVAL: IntervalScale = {
  tick: 200,
  short: 500,
  medium: 1_000,
  long: 2_000,
  slow: 5_000,
};

/*
 * ── Test-flow budgets ─────────────────────────────────────────────────────────────────
 * Off the scale because the thing they bound has a known duration that no bucket
 * describes, but still ordinary test waits.
 */

/**
 * Wallet 4.0 blocking drawers right after a cold start. They mount late on Android, and
 * this is paid in full whenever the drawer does *not* appear — so it stays at `sm` rather
 * than being rounded up.
 */
export const COLD_START_DRAWER_TIMEOUT = TIMEOUT.sm;

/** Full account discovery on a fresh currency, dominated by the derivation scan. */
export const ACCOUNT_DISCOVERY_TIMEOUT = 240_000;

/*
 * ── Harness tier ──────────────────────────────────────────────────────────────────────
 * Process-level budgets: the runner, the device, the bridge, failure diagnostics. These
 * bound the machinery that *runs* a test rather than anything the app is doing, so they
 * are deliberately kept separate from the test-facing scale above.
 */

/** Round-trip to the app's E2E websocket bridge. `waitSwapReady`/`waitEarnReady` use `m`. */
export const BRIDGE_RESPONSE_TIMEOUT = TIMEOUT.sm;

/**
 * Outer bound on `getLogs`, which is itself capped by {@link BRIDGE_RESPONSE_TIMEOUT}
 * inside the bridge. The margin is defense-in-depth for a wedged worker where the inner
 * timer is starved, so it has to stay strictly greater than the inner one.
 */
export const BRIDGE_LOGS_TIMEOUT = BRIDGE_RESPONSE_TIMEOUT + INTERVAL.long;

/**
 * Fast failure-diagnostic steps (screenshots, attaching captured console output). Paid on
 * the teardown path of an already-failing test.
 */
export const FAST_DIAGNOSTIC_TIMEOUT = 5_000;

/**
 * Failure-diagnostic steps that talk to Speculos or dump a native view hierarchy. Kept
 * tighter than 30s because every one of these is paid on the teardown path of an
 * already-failing test.
 */
export const SLOW_DIAGNOSTIC_TIMEOUT = 15_000;

/** `beforeAll`: launch the app and wire the TCP ports. CI emulators are slower than local. */
export const SUITE_SETUP_TIMEOUT = process.env.CI ? 150_000 : 120_000;

/** `afterAll`: terminate the app, tear down Speculos and close the bridge. */
export const SUITE_TEARDOWN_TIMEOUT = process.env.CI ? 60_000 : 30_000;

/** Jest's per-test budget. Bounds the whole test body, not any single wait. */
export const TEST_TIMEOUT = 360_000;

/** Detox teardown: shut the app and release the device. */
export const DETOX_TEARDOWN_TIMEOUT = 120_000;

/**
 * Detox's threshold for logging "app is busy" synchronization diagnostics. Matches Detox's
 * own default, which is what was effectively in force before the key was moved under
 * `session` where Detox actually reads it.
 */
export const DETOX_DEBUG_SYNCHRONIZATION = 10_000;

/** `globalTeardown`: default Detox teardown, guarded against proper-lockfile CI hangs. */
export const GLOBAL_TEARDOWN_TIMEOUT = 60_000;

/** `globalTeardown`: Detox cleanup after the CI env-collection pass. */
export const GLOBAL_CLEANUP_TIMEOUT = 30_000;

/** `globalTeardown`: waiting for the relaunched app in the CI env-collection pass. */
export const GLOBAL_TEARDOWN_APP_READY_TIMEOUT = 120_000;

/** Detox setup: install the app binary and boot the emulator/simulator. */
export const DETOX_SETUP_TIMEOUT = 500_000;

/** Per-test budget for the token-approval swap flow (approval + swap, two device signings). */
export const TOKEN_APPROVAL_TEST_TIMEOUT = 480_000;

/** Per-test budget for the token *re*-approval swap flow (revoke + approve + swap). */
export const TOKEN_REAPPROVAL_TEST_TIMEOUT = 600_000;

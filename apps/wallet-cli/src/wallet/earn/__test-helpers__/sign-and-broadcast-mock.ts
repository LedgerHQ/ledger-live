import { mock } from "bun:test";

/**
 * Shared, flag-gated `sign-and-broadcast` module mock for the earn pipeline unit tests.
 *
 * Bun evaluates every listed file's top-level code during a single COLLECTION phase before any test
 * runs, so a naive top-level `mock.module("../sign-and-broadcast", ...)` in one earn pipeline test
 * file stays active while EVERY other file's tests run (e.g. the send / sol-stake / sign-and-broadcast
 * unit tests that import the real helper). To avoid that cross-file bleed, this helper installs ONE
 * mock whose overrides delegate to the REAL implementation unless an earn pipeline test is actively
 * running. Each pipeline test file calls `activateSignBroadcastMock(...)` on entry (beforeAll) and
 * `deactivateSignBroadcastMock()` on exit (afterAll) so its fakes are scoped to its own tests only.
 *
 * The `../../sign-and-broadcast` path below is resolved relative to THIS file, but points at the same
 * `wallet/sign-and-broadcast` module that `eth-vault-pipeline.ts` / `sol-stake.ts` import via
 * `../sign-and-broadcast`.
 */

type AnyAsyncFn = (...args: never[]) => unknown;

export type SignBroadcastOverrides = {
  prepareIntentDryRun?: AnyAsyncFn;
  signAndBroadcastIntent?: AnyAsyncFn;
};

const GATED_KEYS = ["prepareIntentDryRun", "signAndBroadcastIntent"] as const;

// Snapshot the genuine implementations into a PLAIN object BEFORE installing the mock. Spreading the
// namespace copies the real function references by value; we must not hold the live module namespace,
// because `mock.module` re-binds that namespace's exports to the mock — an inactive pass-through that
// read `realSignBroadcast.signAndBroadcastIntent` would then call the gated wrapper again and recurse
// forever.
const realSignBroadcast = {
  ...((await import("../../sign-and-broadcast")) as unknown as Record<string, AnyAsyncFn>),
};

let active = false;
let overrides: SignBroadcastOverrides = {};

function gated(key: (typeof GATED_KEYS)[number]): AnyAsyncFn {
  return (...args) => {
    const override = active ? overrides[key] : undefined;
    return (override ?? realSignBroadcast[key])(...args);
  };
}

function installMock(): void {
  mock.module("../../sign-and-broadcast", () => ({
    ...realSignBroadcast,
    prepareIntentDryRun: gated("prepareIntentDryRun"),
    signAndBroadcastIntent: gated("signAndBroadcastIntent"),
  }));
}

// Install at module load (collection phase) so the gated mock exists for every test in the run. It is
// inactive by default, so unrelated tests transparently see the real helper.
installMock();

/**
 * Scope the earn pipeline fakes to the current test file. Re-installs the mock defensively in case a
 * sibling file's `mock.restore()` cleared it earlier in the run, keeping the helper robust to test file
 * order.
 */
export function activateSignBroadcastMock(fakes: SignBroadcastOverrides): void {
  overrides = fakes;
  active = true;
  installMock();
}

/** Stop using the earn pipeline fakes; subsequent callers pass through to the real helper. */
export function deactivateSignBroadcastMock(): void {
  active = false;
  overrides = {};
}

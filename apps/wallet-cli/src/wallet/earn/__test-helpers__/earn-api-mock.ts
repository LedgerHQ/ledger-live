import { mock } from "bun:test";

/**
 * Shared, flag-gated `earn-api` module mock for the eth-vault unit tests.
 *
 * Bun evaluates every listed file's top-level code during a single COLLECTION phase before any test
 * runs, so a naive top-level `mock.module("./api", ...)` in one eth-vault test file stays
 * active while EVERY other file's tests run (e.g. the `earn yields`/`earn positions` integration tests
 * that expect the real client to hit their MockServer). To avoid that cross-file bleed, this helper
 * installs ONE mock whose overrides delegate to the REAL implementation unless an eth-vault test is
 * actively running. Each eth-vault test file calls `activateEarnApiMock(...)` on entry (beforeAll) and
 * `deactivateEarnApiMock()` on exit (afterAll) so its fakes are scoped to its own tests only.
 *
 * The `../api` path below is resolved relative to THIS file, but points at the same
 * `wallet/earn/api` module that `eth-vault-pipeline.ts` imports via `./api`.
 */

type AnyAsyncFn = (...args: never[]) => unknown;

export type EarnApiOverrides = {
  getDefiProducts?: AnyAsyncFn;
  postDefiApprove?: AnyAsyncFn;
  postDefiDeposit?: AnyAsyncFn;
  postDefiWithdraw?: AnyAsyncFn;
  getEthTxStatus?: AnyAsyncFn;
};

const GATED_KEYS = [
  "getDefiProducts",
  "postDefiApprove",
  "postDefiDeposit",
  "postDefiWithdraw",
  "getEthTxStatus",
] as const;

// Snapshot the genuine implementations into a PLAIN object BEFORE installing the mock. Spreading the
// namespace copies the real function references by value; we must not hold the live module namespace,
// because `mock.module` re-binds that namespace's exports to the mock — an inactive pass-through that
// read `realEarnApi.getDefiProducts` would then call the gated wrapper again and recurse forever.
const realEarnApi = {
  ...((await import("../api")) as unknown as Record<string, AnyAsyncFn>),
};

let active = false;
let overrides: EarnApiOverrides = {};

function gated(key: (typeof GATED_KEYS)[number]): AnyAsyncFn {
  return (...args) => {
    const override = active ? overrides[key] : undefined;
    return (override ?? realEarnApi[key])(...args);
  };
}

function installMock(): void {
  mock.module("../api", () => ({
    ...realEarnApi,
    getDefiProducts: gated("getDefiProducts"),
    postDefiApprove: gated("postDefiApprove"),
    postDefiDeposit: gated("postDefiDeposit"),
    postDefiWithdraw: gated("postDefiWithdraw"),
    getEthTxStatus: gated("getEthTxStatus"),
  }));
}

// Install at module load (collection phase) so the gated mock exists for every test in the run. It is
// inactive by default, so unrelated tests transparently see the real client.
installMock();

/**
 * Scope the eth-vault fakes to the current test file. Re-installs the mock defensively in case a sibling
 * file's `mock.restore()` cleared it earlier in the run, keeping the helper robust to test file order.
 */
export function activateEarnApiMock(fakes: EarnApiOverrides): void {
  overrides = fakes;
  active = true;
  installMock();
}

/** Stop using the eth-vault fakes; subsequent callers pass through to the real `earn-api`. */
export function deactivateEarnApiMock(): void {
  active = false;
  overrides = {};
}

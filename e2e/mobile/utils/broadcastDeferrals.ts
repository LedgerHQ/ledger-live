/**
 * A spec file whose broadcast accounts are busy when it starts is skipped and leaves a marker in
 * this directory (relative to e2e/mobile, see jest.environment.ts). jest.config.js keeps its
 * skipped results out of Allure, and apps/ledger-live-mobile/scripts/e2e-ci.mjs runs it again
 * in a later pass.
 *
 * `jest.config.js` requires this file, so it must stay free of imports and of non-erasable
 * TypeScript syntax.
 */
export const BROADCAST_DEFERRALS_DIR = "artifacts/broadcast-deferrals";

/** Time each spec file waited for broadcast locks, which e2e-ci.mjs keeps out of the shard timings. */
export const BROADCAST_LOCK_WAITS_DIR = "artifacts/broadcast-lock-waits";

export const deferralMarkerName = (testFilePath: string) =>
  `${Buffer.from(testFilePath).toString("base64url")}.txt`;

/** Set on the spec's global by helpers/broadcastLock.ts, so the environment can reach its accounts. */
export const SPEC_BROADCAST_LOCK = Symbol.for("@ledgerhq/e2e-mobile/specBroadcastLock");

export type SpecBroadcastLock = {
  readonly tryLock: () => Promise<"none" | "held" | "busy">;
  readonly release: () => Promise<void>;
  readonly takeWaitedMs: () => number;
};

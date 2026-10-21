/**
 * A spec file whose broadcast accounts are busy when it starts is skipped and leaves a marker in
 * this directory (relative to e2e/mobile, see jest.environment.ts). jest.config.js keeps its
 * skipped results out of Allure, and apps/ledger-live-mobile/scripts/e2e-ci.mjs runs it again
 * in a later pass.
 *
 * `jest.config.js` requires this file, so it must stay free of imports and of non-erasable
 * TypeScript syntax.
 */
export const LOCK_DEFERRALS_DIR = "artifacts/lock-deferrals";

/** Time each spec file waited for exclusive locks, which e2e-ci.mjs keeps out of the shard timings. */
export const EXCLUSIVE_LOCK_WAITS_DIR = "artifacts/exclusive-lock-waits";

export const deferralMarkerName = (testFilePath: string) =>
  `${Buffer.from(testFilePath).toString("base64url")}.txt`;

/** Set on the spec's global by helpers/exclusiveLock.ts, so the environment can reach its accounts. */
export const SPEC_EXCLUSIVE_LOCK = Symbol.for("@ledgerhq/e2e-mobile/specExclusiveLock");

export type SpecExclusiveLock = {
  /** Resolves to false when the spec's targets are busy. */
  readonly tryLock: () => Promise<boolean>;
  readonly release: () => Promise<void>;
  readonly takeWaitedMs: () => number;
};

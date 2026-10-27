/**
 * A test whose exclusive locks are busy on a deferring pass is skipped with
 * {@link EXCLUSIVE_LOCK_DEFERRED_REASON}. tests/reporters/lockDeferralReporter.ts lists it in
 * the file named by {@link LOCK_DEFERRAL_REPORT_ENV}, and scripts/playwrightWithDeferrals.mjs
 * runs it again in a later pass and drops the skipped result from Allure, which keeps the reason as
 * its message. That script mirrors these values, keep them in sync.
 */
export const LOCK_DEFERRAL_REPORT_ENV = "E2E_LOCK_DEFERRAL_REPORT";

export const EXCLUSIVE_LOCK_DEFERRED_REASON =
  "[exclusiveLock] moved to a later pass: its exclusive locks are busy";

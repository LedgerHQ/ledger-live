/**
 * A test whose broadcast locks are busy on a deferring pass is skipped with
 * {@link BROADCAST_LOCK_DEFERRED_REASON}. tests/reporters/broadcastDeferralReporter.ts lists it in
 * the file named by {@link BROADCAST_DEFERRAL_REPORT_ENV}, and scripts/playwrightWithDeferrals.mjs
 * runs it again in a later pass and drops the skipped result from Allure, which keeps the reason as
 * its message. That script mirrors these values, keep them in sync.
 */
export const BROADCAST_DEFERRAL_REPORT_ENV = "E2E_BROADCAST_DEFERRAL_REPORT";

export const BROADCAST_LOCK_DEFERRED_REASON =
  "[broadcastLock] moved to a later pass: its broadcast locks are busy";

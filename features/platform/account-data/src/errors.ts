import type { AccountId } from "@shared/schema-primitives";

/**
 * No registered source supports this account.
 *
 * Recorded on the account's status rather than thrown at the UI: one account nobody can serve must
 * not take down a list of forty.
 */
export class NoAccountBalanceSourceError extends Error {
  constructor(readonly accountId: AccountId) {
    super(`No account balance source supports ${accountId}`);
    this.name = "NoAccountBalanceSourceError";
  }
}

import type { AccountId } from "@shared/schema-primitives";

/** What a source reads. Only the two the exploration has actually built. */
export type AccountDatum = "balance" | "operations";

/**
 * No registered source supports this account for this datum.
 *
 * Recorded on the account's status rather than thrown at the UI: one account nobody can serve must
 * not take down a list of forty. Carries the datum because a family can be servable for one and not
 * the other — which is the whole reason capability is declared per source rather than per family.
 */
export class NoAccountSourceError extends Error {
  constructor(
    readonly accountId: AccountId,
    readonly datum: AccountDatum,
  ) {
    super(`No account ${datum} source supports ${accountId}`);
    this.name = "NoAccountSourceError";
  }
}

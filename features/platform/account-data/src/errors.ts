import type { AccountId } from "@domain/entity-account";

export class NoAccountBalanceSourceError extends Error {
  constructor(readonly accountId: AccountId) {
    super(`No account balance source supports ${accountId}`);
    this.name = "NoAccountBalanceSourceError";
  }
}

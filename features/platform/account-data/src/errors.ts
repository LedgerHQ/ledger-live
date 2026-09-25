import type { AccountId } from "@domain/entity-account";

export type AccountDatum = "balance" | "operations";

export class NoAccountSourceError extends Error {
  constructor(
    readonly accountId: AccountId,
    readonly datum: AccountDatum,
  ) {
    super(`No account ${datum} source supports ${accountId}`);
    this.name = "NoAccountSourceError";
  }
}

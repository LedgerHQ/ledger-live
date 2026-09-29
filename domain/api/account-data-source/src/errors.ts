import type { AccountId } from "@domain/entity-account";

export class NoAccountSourceError extends Error {
  constructor(
    readonly accountId: AccountId,
    readonly datum: string,
  ) {
    super(`No account data source supports ${datum} for ${accountId}`);
    this.name = "NoAccountSourceError";
  }
}

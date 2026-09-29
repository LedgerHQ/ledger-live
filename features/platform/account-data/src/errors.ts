import type { AccountId } from "@domain/entity-account";

export class NoAccountDataSourceError extends Error {
  constructor(
    readonly accountId: AccountId,
    readonly method: string,
  ) {
    super(`No account data source supports ${method} for ${accountId}`);
    this.name = "NoAccountDataSourceError";
  }
}

import type { AccountId } from "@domain/entity-account";

export class NoAccountSourceError extends Error {
  constructor(
    readonly accountId: AccountId,
    readonly datum: string,
    readonly sourceId?: string,
  ) {
    super(
      sourceId === undefined
        ? `No account ${datum} source supports ${accountId}`
        : `Account ${datum} source "${sourceId}" no longer supports ${accountId}`,
    );
    this.name = "NoAccountSourceError";
  }
}

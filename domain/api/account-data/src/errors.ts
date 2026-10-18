import type { AccountDataKind, AccountDataSourceId } from "@domain/entity-account-data";
import type { AccountUUID } from "@domain/entity-account-descriptor";

export class NoAccountDataSourceError extends Error {
  override name = "NoAccountDataSourceError";
  readonly accountUUID: AccountUUID;
  readonly kind: AccountDataKind;
  readonly sourceId: AccountDataSourceId | undefined;
  constructor(accountUUID: AccountUUID, kind: AccountDataKind, sourceId?: AccountDataSourceId) {
    super(
      sourceId === undefined
        ? `No account data source serves ${kind} for ${accountUUID}`
        : `Account data source "${sourceId}" no longer serves ${kind} for ${accountUUID}`,
    );
    this.accountUUID = accountUUID;
    this.kind = kind;
    this.sourceId = sourceId;
  }
}

export class AccountDataRouterMissingError extends Error {
  override name = "AccountDataRouterMissingError";
  constructor() {
    super("No account data router in the thunk extraArgument (`accountData`)");
  }
}

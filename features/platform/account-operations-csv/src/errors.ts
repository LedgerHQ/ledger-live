import type { AccountDataError } from "@domain/entity-account-data";
import type { AccountUUID } from "@domain/entity-account-descriptor";
import type { AccountId } from "@domain/entity-account";

export class AccountOperationsCsvError extends Error {
  override name: string = "AccountOperationsCsvError";
}

/** The operations of an account could not be read, so its rows would be missing from the CSV. */
export class AccountOperationsReadError extends AccountOperationsCsvError {
  override name = "AccountOperationsReadError" as const;
  readonly accountUUID: AccountUUID;
  constructor(accountUUID: AccountUUID, cause: AccountDataError) {
    super(`The operations of ${accountUUID} could not be read: ${cause.message}`, { cause });
    this.accountUUID = accountUUID;
  }
}

/** A requested account is not in the accounts list, so it has no descriptor to read. */
export class UnknownAccountError extends AccountOperationsCsvError {
  override name = "UnknownAccountError" as const;
  readonly accountId: AccountId;
  constructor(accountId: AccountId) {
    super(`No account entry for ${accountId}`);
    this.accountId = accountId;
  }
}

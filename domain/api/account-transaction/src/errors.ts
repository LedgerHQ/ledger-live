import type { AccountDataSourceId } from "@domain/entity-account-data";
import type { AccountUUID } from "@domain/entity-account-descriptor";

export class NoSendingSourceError extends Error {
  override name = "NoSendingSourceError";
  readonly accountUUID: AccountUUID;
  readonly sourceId: AccountDataSourceId | undefined;
  constructor(accountUUID: AccountUUID, sourceId?: AccountDataSourceId) {
    super(
      sourceId === undefined
        ? `No source sends from ${accountUUID}`
        : `Source "${sourceId}" no longer sends from ${accountUUID}`,
    );
    this.accountUUID = accountUUID;
    this.sourceId = sourceId;
  }
}

/** Signing a transaction its preparation reported errors for. */
export class TransactionNotSignableError extends Error {
  override name = "TransactionNotSignableError";
}

/** The user refused on the device: the same preparation can be signed again. */
export class SignatureRefusedError extends Error {
  override name = "SignatureRefusedError";
}

/** Broadcasting a signature with another preparation, account or source than the one it signed. */
export class SignatureMismatchError extends Error {
  override name = "SignatureMismatchError";
}

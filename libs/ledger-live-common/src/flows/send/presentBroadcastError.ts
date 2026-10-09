import type { Account, AccountLike } from "@ledgerhq/types-live";
import { TransactionBroadcastError } from "../../errors/transactionBroadcastErrors";

const ERRORS_KEPT_AS_IS = new Set(["InvalidTransactionError", "TransactionBroadcastError"]);

const RETRYABLE_SEND_CONFIRMATION_ERRORS = new Set([
  "LedgerAPI5xx",
  "NetworkDown",
  "DeviceLockedError",
  "LockedDeviceError",
  "UserRefusedOnDevice",
]);

export function isSendConfirmationRetryable(error: Error): boolean {
  if (RETRYABLE_SEND_CONFIRMATION_ERRORS.has(error.name)) return true;
  return (error as Error & { retryable?: boolean }).retryable === true;
}

function shouldKeepBroadcastError(error: Error): boolean {
  if (ERRORS_KEPT_AS_IS.has(error.name) || error.message === "InvalidTransactionError") {
    return true;
  }

  const cause = error.cause;
  return (
    cause instanceof Error &&
    (cause.name === "InvalidTransactionError" || cause.message === "InvalidTransactionError")
  );
}

function describeRejection(rejection: object): string {
  try {
    return JSON.stringify(rejection);
  } catch {
    return String(rejection);
  }
}

export function toBroadcastError(rejection: unknown): Error {
  if (rejection instanceof Error) return rejection;
  if (typeof rejection === "object" && rejection !== null) {
    const error = Object.assign(new Error(), rejection);
    if (!error.message) error.message = describeRejection(rejection);
    return error;
  }
  return new Error(String(rejection));
}

export function presentBroadcastError(
  rejection: unknown,
  account: AccountLike | null,
  parentAccount: Account | null,
): Error {
  const error = toBroadcastError(rejection);
  if (!account || shouldKeepBroadcastError(error)) {
    return error;
  }

  const coin = account.type === "TokenAccount" ? account.token.ticker : account.currency?.ticker;
  const network =
    account.type === "TokenAccount" ? parentAccount?.currency?.name : account.currency?.name;

  return new TransactionBroadcastError(error.message, {
    coin,
    network,
    currencyName: coin,
    networkName: network,
    retryable: isSendConfirmationRetryable(error),
  });
}

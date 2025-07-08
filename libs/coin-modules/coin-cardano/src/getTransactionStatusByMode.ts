import { getDelegateTransactionStatus } from "./getDelegateTransactionStatus";
import { getSendTransactionStatus } from "./getSendTransactionStatus";
import { getUndelegateTransactionStatus } from "./getUndelegateTransactionStatus";
import type { CardanoAccount, Transaction, TransactionStatus } from "./types";

type StatusHandler = (
  account: CardanoAccount,
  transaction: Transaction,
) => Promise<TransactionStatus>;

const modeHandlers: Record<string, StatusHandler> = {
  send: getSendTransactionStatus,
  delegate: getDelegateTransactionStatus,
  undelegate: getUndelegateTransactionStatus,
};

export async function getTransactionStatusByTransactionMode(
  account: CardanoAccount,
  transaction: Transaction,
) {
  const handler = modeHandlers[transaction.mode];
  if (!handler) {
    throw new Error(`Unsupported transaction mode: ${transaction.mode}`);
  }
  return handler(account, transaction);
}

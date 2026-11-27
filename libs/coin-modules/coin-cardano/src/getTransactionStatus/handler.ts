import type { CardanoContext } from "../config";
import type { CardanoAccount, Transaction, TransactionStatus } from "../types";
import { getDelegateTransactionStatus } from "./delegate";
import { getSendTransactionStatus } from "./send";
import { getUndelegateTransactionStatus } from "./undelegate";

type StatusHandler = (
  context: CardanoContext,
  account: CardanoAccount,
  transaction: Transaction,
) => Promise<TransactionStatus>;

const modeHandlers: Record<string, StatusHandler> = {
  send: getSendTransactionStatus,
  delegate: (_context, account, transaction) => getDelegateTransactionStatus(account, transaction),
  undelegate: (_context, account, transaction) =>
    getUndelegateTransactionStatus(account, transaction),
};

export async function getTransactionStatusByTransactionMode(
  context: CardanoContext,
  account: CardanoAccount,
  transaction: Transaction,
) {
  const handler = modeHandlers[transaction.mode];
  if (!handler) {
    throw new Error(`Unsupported transaction mode: ${transaction.mode}`);
  }
  return handler(context, account, transaction);
}

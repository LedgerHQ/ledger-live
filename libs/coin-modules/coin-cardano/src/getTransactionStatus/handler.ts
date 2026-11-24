import type { CardanoAccount, Transaction, TransactionStatus } from "../types";
import { getDelegateTransactionStatus } from "./delegate";
import { getSendTransactionStatus } from "./send";
import { getUndelegateTransactionStatus } from "./undelegate";
import { getVoteDelegationTransactionStatus } from "./voteDelegation";

type StatusHandler = (
  account: CardanoAccount,
  transaction: Transaction,
) => Promise<TransactionStatus>;

const modeHandlers: Record<string, StatusHandler> = {
  send: getSendTransactionStatus,
  delegate: getDelegateTransactionStatus,
  undelegate: getUndelegateTransactionStatus,
  voteDelegation: getVoteDelegationTransactionStatus,
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

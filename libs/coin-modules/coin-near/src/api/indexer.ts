import { Operation, OperationType } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import liveNetwork from "@ledgerhq/live-network";
import { NearTransaction } from "./sdk.types";
import { getCoinConfig } from "../config";

const DEFAULT_TRANSACTIONS_LIMIT = 100;

const fetchTransactions = async (
  address: string,
  limit: number = DEFAULT_TRANSACTIONS_LIMIT,
): Promise<NearTransaction[]> => {
  const currencyConfig = getCoinConfig();

  const response = await liveNetwork<{ txns: NearTransaction[] }>({
    url: `${currencyConfig.infra.API_NEAR_INDEXER}/v1/account/${address}/txns-only`,
  });

  return response.data.txns || [];
};

function isSender(transaction: NearTransaction, address: string): boolean {
  return transaction.sender === address;
}

function getOperationType(transaction: NearTransaction, address: string): OperationType {
  switch (transaction.actions[0]?.data?.method_name) {
    case "deposit_and_stake":
      return "STAKE";
    case "unstake":
    case "unstake_all":
      return "UNSTAKE";
    case "withdraw":
    case "withdraw_all":
      return "WITHDRAW_UNSTAKED";
    default:
      return isSender(transaction, address) ? "OUT" : "IN";
  }
}

function getOperationValue(transaction: NearTransaction, type: OperationType): BigNumber {
  const amount = transaction.actions[0]?.data?.deposit || 0;

  if (type === "OUT") {
    return new BigNumber(amount).plus(transaction.fee);
  }

  return new BigNumber(amount);
}

async function transactionToOperation(
  accountId: string,
  address: string,
  transaction: NearTransaction,
): Promise<Operation> {
  const type = getOperationType(transaction, address);

  return {
    id: encodeOperationId(accountId, transaction.hash, type),
    accountId,
    fee: new BigNumber(transaction.fee || 0),
    value: getOperationValue(transaction, type),
    type,
    hash: transaction.hash,
    blockHash: transaction.block_hash,
    blockHeight: transaction.height,
    date: new Date(transaction.time),
    extra: {},
    senders: transaction.sender ? [transaction.sender] : [],
    recipients: transaction.receiver ? [transaction.receiver] : [],
    hasFailed: !transaction.success,
  };
}

export const getOperations = async (accountId: string, address: string): Promise<Operation[]> => {
  const rawTransactions = await fetchTransactions(address);

  return await Promise.all(
    rawTransactions.map(transaction => transactionToOperation(accountId, address, transaction)),
  );
};

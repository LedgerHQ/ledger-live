import { Operation, OperationType } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import liveNetwork from "@ledgerhq/live-network";
import { NearTransaction } from "./sdk.types";
import { getCoinConfig } from "../config";

const fetchTransactions = async (address: string): Promise<NearTransaction[]> => {
  const currencyConfig = getCoinConfig();

  const response = await liveNetwork<{ txns: NearTransaction[] }>({
    url: `${currencyConfig.infra.API_NEAR_INDEXER}/v1/account/${address}/txns-only`,
  });

  return response.data.txns || [];
};

function isSender(transaction: NearTransaction, address: string): boolean {
  return transaction.signer_account_id === address;
}

function getOperationType(transaction: NearTransaction, address: string): OperationType {
  switch (transaction.actions[0]?.method) {
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
  const amount = transaction.actions[0]?.deposit || 0;

  if (type === "OUT") {
    return new BigNumber(amount).plus(transaction.outcomes_agg.transaction_fee);
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
    id: encodeOperationId(accountId, transaction.transaction_hash, type),
    accountId,
    fee: new BigNumber(transaction.outcomes_agg.transaction_fee || 0),
    value: getOperationValue(transaction, type),
    type,
    hash: transaction.transaction_hash,
    blockHash: transaction.included_in_block_hash,
    blockHeight: transaction.block.block_height,
    date: new Date(parseFloat(transaction.block_timestamp) / 1000000),
    extra: {},
    senders: transaction.signer_account_id ? [transaction.signer_account_id] : [],
    recipients: transaction.receiver_account_id ? [transaction.receiver_account_id] : [],
    hasFailed: !transaction.outcomes.status,
  };
}

export const getOperations = async (accountId: string, address: string): Promise<Operation[]> => {
  const rawTransactions = await fetchTransactions(address);

  return await Promise.all(
    rawTransactions.map(transaction => transactionToOperation(accountId, address, transaction)),
  );
};

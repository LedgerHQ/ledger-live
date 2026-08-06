import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import liveNetwork from "@ledgerhq/live-network";
import { Operation, OperationType } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { getCoinConfig } from "../config";
import { NearTransaction, NearV3Response } from "./sdk.types";

/**
 * One page of account transactions. `next` is the indexer's own opaque cursor, forwarded as-is so
 * callers can resume without knowing its encoding.
 */
export const fetchTransactionsPage = async (
  address: string,
  options: { cursor?: string; limit?: number } = {},
): Promise<{ transactions: NearTransaction[]; next?: string }> => {
  const currencyConfig = getCoinConfig();

  const params = new URLSearchParams();
  if (options.limit !== undefined) {
    params.set("limit", String(options.limit));
  }
  if (options.cursor) {
    params.set("next", options.cursor);
  }
  const query = params.toString();

  const response = await liveNetwork<NearV3Response<NearTransaction[]>>({
    url: `${currencyConfig.infra.API_NEARBLOCKS_INDEXER}/v3/accounts/${address}/txns${
      query ? `?${query}` : ""
    }`,
  });

  const next = response.data.meta?.next_page;

  return {
    transactions: response.data.data ?? [],
    ...(next !== undefined && { next }),
  };
};

const fetchTransactions = async (address: string): Promise<NearTransaction[]> => {
  const { transactions } = await fetchTransactionsPage(address);

  return transactions;
};

function isSender(transaction: NearTransaction, address: string): boolean {
  return transaction.signer_account_id === address;
}

export function getOperationType(transaction: NearTransaction, address: string): OperationType {
  switch (transaction.actions?.at(0)?.method) {
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
  const amount = transaction.actions_agg?.deposit || 0;

  if (type === "OUT") {
    return new BigNumber(amount).plus(transaction.outcomes_agg?.transaction_fee || 0);
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
    fee: new BigNumber(transaction.outcomes_agg?.transaction_fee || 0),
    value: getOperationValue(transaction, type),
    type,
    hash: transaction.transaction_hash,
    blockHash: transaction.block?.block_hash,
    blockHeight:
      transaction.block?.block_height !== undefined
        ? Number(transaction.block.block_height)
        : undefined,
    date: new Date(parseFloat(transaction.block_timestamp) / 1000000),
    extra: {},
    senders: transaction.signer_account_id ? [transaction.signer_account_id] : [],
    recipients: transaction.receiver_account_id ? [transaction.receiver_account_id] : [],
    hasFailed: transaction.outcomes?.status === false,
  };
}

export const getOperations = async (accountId: string, address: string): Promise<Operation[]> => {
  const rawTransactions = await fetchTransactions(address);

  return await Promise.all(
    rawTransactions.map(transaction => transactionToOperation(accountId, address, transaction)),
  );
};

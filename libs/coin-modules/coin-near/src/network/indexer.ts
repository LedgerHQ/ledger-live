import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { Operation, OperationType } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { type NearConfig } from "../config";
import { LEGACY_HISTORY_PAGE_SIZE, STAKING_POOL_METHODS } from "../constants";
import { fetchNearblocks } from "./nearblocks";
import { NearTransaction, NearV3Response } from "./sdk.types";

/**
 * One page of account transactions. `next` is the indexer's own opaque cursor, forwarded as-is so
 * callers can resume without knowing its encoding.
 */
export const fetchTransactionsPage = async (
  config: NearConfig,
  address: string,
  options: { cursor?: string; limit?: number } = {},
): Promise<{ transactions: NearTransaction[]; next?: string }> => {
  const params = new URLSearchParams();
  if (options.limit !== undefined) {
    params.set("limit", String(options.limit));
  }
  if (options.cursor) {
    params.set("next", options.cursor);
  }
  const query = params.toString();

  const body = await fetchNearblocks<NearV3Response<NearTransaction[]>>(
    config,
    `/v3/accounts/${address}/txns${query ? `?${query}` : ""}`,
  );

  const next = body.meta?.next_page;

  return {
    transactions: body.data ?? [],
    ...(next !== undefined && { next }),
  };
};

const fetchTransactions = async (
  config: NearConfig,
  address: string,
): Promise<NearTransaction[]> => {
  const { transactions } = await fetchTransactionsPage(config, address, {});

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

const isStakingPoolMethod = (method: string | null): boolean =>
  (STAKING_POOL_METHODS as readonly (string | null)[]).includes(method);

export type LegacyHistory = {
  operations: Operation[];
  /** Pool called by each transaction the account signed that has a staking-pool action. */
  stakingPoolsCalled: Map<string, string>;
  /** The page came back full, so older transactions may exist that this read did not see. */
  isFullPage: boolean;
};

/**
 * The history the legacy sync reads, plus what the sync needs to decide whether the staking pools
 * must be listed again. The operation type shown to users still follows the first action only,
 * whereas a staking call can sit in any action of a transaction.
 */
export const fetchLegacyHistory = async (
  config: NearConfig,
  accountId: string,
  address: string,
): Promise<LegacyHistory> => {
  const rawTransactions = await fetchTransactions(config, address);

  const stakingPoolsCalled = new Map<string, string>();
  for (const transaction of rawTransactions) {
    if (
      isSender(transaction, address) &&
      transaction.actions?.some(action => isStakingPoolMethod(action.method))
    ) {
      stakingPoolsCalled.set(transaction.transaction_hash, transaction.receiver_account_id);
    }
  }

  return {
    operations: await Promise.all(
      rawTransactions.map(transaction => transactionToOperation(accountId, address, transaction)),
    ),
    stakingPoolsCalled,
    isFullPage: rawTransactions.length >= LEGACY_HISTORY_PAGE_SIZE,
  };
};

export const getOperations = async (
  config: NearConfig,
  accountId: string,
  address: string,
): Promise<Operation[]> => (await fetchLegacyHistory(config, accountId, address)).operations;

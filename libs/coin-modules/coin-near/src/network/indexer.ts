import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { Operation, OperationType } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { type NearConfig } from "../config";
import {
  DELEGATE_ACTION,
  LEGACY_HISTORY_MAX_PAGES,
  LEGACY_HISTORY_PAGE_SIZE,
  STAKING_POOL_METHODS,
} from "../constants";
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

/**
 * The newest transactions, page after page until one the caller already knows, and until every
 * hash in `unsettledHashes` was read: a transaction listed before its outcome was indexed may sit
 * below the first known one. A burst of more transactions than a page holds is read whole. Without
 * known transactions (a first read), the newest page only. Bounded, so an account with a long
 * unseen history does not read all of it.
 */
const fetchTransactions = async (
  config: NearConfig,
  address: string,
  knownHashes: ReadonlySet<string>,
  unsettledHashes: ReadonlySet<string>,
): Promise<{ transactions: NearTransaction[]; hasOlder: boolean; gap: boolean }> => {
  const transactions: NearTransaction[] = [];
  const unread = new Set(unsettledHashes);
  let reachedKnown = false;
  let cursor: string | undefined;

  for (let page = 0; page < LEGACY_HISTORY_MAX_PAGES; page++) {
    const { transactions: batch, next } = await fetchTransactionsPage(config, address, {
      ...(cursor !== undefined && { cursor }),
    });
    transactions.push(...batch);

    for (const { transaction_hash } of batch) {
      unread.delete(transaction_hash);
      if (knownHashes.has(transaction_hash)) reachedKnown = true;
    }
    const full = batch.length >= LEGACY_HISTORY_PAGE_SIZE;
    if ((reachedKnown && unread.size === 0) || !full || next === undefined) {
      return {
        transactions,
        hasOlder: full && !reachedKnown && knownHashes.size === 0,
        gap: false,
      };
    }
    if (knownHashes.size === 0) return { transactions, hasOlder: true, gap: false };
    cursor = next;
  }

  // The bound stopped the read above the known transactions: what lies between was not read. Once
  // a known one was reached the read joins the stored history, even if an unsettled one lies below.
  return { transactions, hasOlder: true, gap: !reachedKnown };
};

/** The indexer lists a transaction before it records its outcome: its fee and status are not final. */
export const isOutcomePending = (transaction: NearTransaction): boolean =>
  transaction.outcomes?.status === undefined;

/**
 * Another account signed, on behalf of this one, a transaction whose inner actions call a staking
 * pool (a relayed staking call): the indexer lists the inner methods but not the pool they call.
 * Relayed calls to anything else (claims, transfers) are left out, so they cost no pool listing.
 */
export const isRelayedCall = (transaction: NearTransaction, address: string): boolean =>
  transaction.signer_account_id !== address &&
  transaction.actions?.some(action => action.action === DELEGATE_ACTION) === true &&
  transaction.actions.some(action => isStakingPoolMethod(action.method));

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

export const isStakingPoolMethod = (method: string | null): boolean =>
  (STAKING_POOL_METHODS as readonly (string | null)[]).includes(method);

export type LegacyHistory = {
  operations: Operation[];
  /** Pool called by each transaction the account signed that has a staking-pool action. */
  stakingPoolsCalled: Map<string, string>;
  /** The read stopped before a known transaction, so older ones may exist that it did not see. */
  isFullPage: boolean;
  /**
   * The bound stopped the read before it reached a known transaction: the read and the stored
   * history do not join, so the stored one is replaced rather than merged across the gap.
   */
  gap: boolean;
  /** Transactions whose outcome the indexer had not recorded when read. */
  outcomePendingHashes: string[];
  /** Transactions another account relayed for this one. */
  relayedHashes: string[];
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
  knownHashes: ReadonlySet<string> = new Set(),
  unsettledHashes: ReadonlySet<string> = new Set(),
): Promise<LegacyHistory> => {
  const {
    transactions: rawTransactions,
    hasOlder,
    gap,
  } = await fetchTransactions(config, address, knownHashes, unsettledHashes);

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
    isFullPage: hasOlder,
    gap,
    outcomePendingHashes: rawTransactions.filter(isOutcomePending).map(t => t.transaction_hash),
    relayedHashes: rawTransactions
      .filter(transaction => isRelayedCall(transaction, address))
      .map(t => t.transaction_hash),
  };
};

export const getOperations = async (
  config: NearConfig,
  accountId: string,
  address: string,
): Promise<Operation[]> => (await fetchLegacyHistory(config, accountId, address)).operations;

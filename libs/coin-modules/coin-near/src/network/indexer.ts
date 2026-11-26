import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { log } from "@ledgerhq/logs";
import { Operation, OperationType } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { type NearConfig } from "../config";
import {
  DELEGATE_ACTION,
  LEGACY_HISTORY_MAX_PAGES,
  LEGACY_HISTORY_PAGE_SIZE,
  RECEIPTS_MAX_PAGES,
  RECEIPTS_PAGE_SIZE,
  STAKING_POOL_METHODS,
  SYSTEM_ACCOUNT,
} from "../constants";
import { fetchTransactionReceipts } from "./blockTransactions";
import { fetchNearblocks } from "./nearblocks";
import {
  NearAccountReceipt,
  NearReceiptNode,
  NearReceiptTransfer,
  NearTransaction,
  NearV3Response,
} from "./sdk.types";

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

export const fetchReceiptsPage = async (
  config: NearConfig,
  address: string,
  options: { cursor?: string; limit?: number } = {},
): Promise<{ receipts: NearAccountReceipt[]; next?: string }> => {
  const params = new URLSearchParams();
  if (options.limit !== undefined) {
    params.set("limit", String(options.limit));
  }
  if (options.cursor) {
    params.set("next", options.cursor);
  }
  const query = params.toString();

  const body = await fetchNearblocks<NearV3Response<NearAccountReceipt[]>>(
    config,
    `/v3/accounts/${address}/receipts${query ? `?${query}` : ""}`,
  );

  const next = body.meta?.next_page;

  return {
    receipts: body.data ?? [],
    ...(next !== undefined && { next }),
  };
};

const receiptHeight = (receipt: NearAccountReceipt): number =>
  receipt.block?.block_height !== undefined ? Number(receipt.block.block_height) : NaN;

export const isReceiptTransferCandidate = (receipt: NearAccountReceipt, address: string): boolean =>
  receipt.actions?.some(action => action.action === "TRANSFER") === true &&
  new BigNumber(receipt.actions_agg?.deposit || 0).gt(0) &&
  receipt.receiver_account_id === address &&
  receipt.outcome?.status === true &&
  receipt.predecessor_account_id !== SYSTEM_ACCOUNT &&
  receipt.predecessor_account_id !== address;

const receiptNodes = (node: NearReceiptNode): NearReceiptNode[] => [
  node,
  ...(node.receipts ?? []).flatMap(receiptNodes),
];

const isIncomingTransferNode = (node: NearReceiptNode, address: string): boolean =>
  node.receiver_account_id === address &&
  node.predecessor_account_id !== SYSTEM_ACCOUNT &&
  node.predecessor_account_id !== address &&
  node.actions.some(action => action.action === "TRANSFER");

const nodeHeight = (node: NearReceiptNode): number => Number(node.block?.block_height ?? NaN);

/** Undefined when `/txns` lists the transaction for the account, or while one of its transfers has no outcome. */
export const receiptOnlyTransfer = (
  tree: NearReceiptNode,
  transactionHash: string,
  address: string,
): NearReceiptTransfer | undefined => {
  const listedByTxns =
    tree.predecessor_account_id === address || tree.receiver_account_id === address;
  const incoming = receiptNodes(tree).filter(node => isIncomingTransferNode(node, address));
  const settled = incoming.every(node => typeof node.outcome?.status === "boolean");
  const credited = incoming.filter(node => node.outcome.status === true);
  if (listedByTxns || !settled || credited.length === 0) return undefined;

  const newest = credited.reduce((a, b) => (nodeHeight(b) > nodeHeight(a) ? b : a));
  const value = credited
    .flatMap(node => node.actions)
    .filter(action => action.action === "TRANSFER")
    .reduce((sum, action) => sum.plus(action.args?.deposit ?? 0), new BigNumber(0));

  return {
    transactionHash,
    sender: newest.predecessor_account_id,
    value: value.toFixed(),
    blockHeight: nodeHeight(newest),
    blockHash: newest.block?.block_hash,
    date: new Date(parseFloat(newest.block?.block_timestamp ?? "0") / 1e6),
  };
};

/**
 * Incoming transfers the account received by receipt in a transaction its `/txns` listing lacks,
 * each reported once, by the window holding its newest receipt.
 */
export const readReceiptTransfers = async (
  config: NearConfig,
  address: string,
  options: {
    floorHeight?: number;
    upperHeight?: number;
    cursor?: string;
    knownHashes: ReadonlySet<string>;
    stopAtHashes?: ReadonlySet<string>;
  },
): Promise<{
  transfers: NearReceiptTransfer[];
  resumeCursor?: string;
  truncatedAtHeight?: number;
}> => {
  const { floorHeight, upperHeight, knownHashes, stopAtHashes } = options;
  const candidateHashes = new Set<string>();
  let requestCursor = options.cursor;
  let resumeCursor: string | undefined;
  let truncatedAtHeight: number | undefined;

  for (let page = 1; ; page++) {
    const { receipts, next } = await fetchReceiptsPage(config, address, {
      limit: RECEIPTS_PAGE_SIZE,
      ...(requestCursor !== undefined && { cursor: requestCursor }),
    });

    const inWindow = receipts.filter(receipt => {
      const height = receiptHeight(receipt);
      return (
        !Number.isNaN(height) &&
        (upperHeight === undefined || height < upperHeight) &&
        (floorHeight === undefined || height >= floorHeight)
      );
    });
    for (const receipt of inWindow) {
      if (
        !knownHashes.has(receipt.transaction_hash) &&
        isReceiptTransferCandidate(receipt, address)
      ) {
        candidateHashes.add(receipt.transaction_hash);
      }
    }

    const crossedFloor =
      floorHeight !== undefined && receipts.some(receipt => receiptHeight(receipt) < floorHeight);
    if (crossedFloor) {
      resumeCursor = requestCursor;
      break;
    }
    const reachedStored = receipts.some(receipt => stopAtHashes?.has(receipt.transaction_hash));
    if (next === undefined || reachedStored) break;
    const unboundedWindow = floorHeight === undefined;
    if (unboundedWindow && page >= RECEIPTS_MAX_PAGES) {
      truncatedAtHeight = Math.min(...receipts.map(receiptHeight).filter(h => !Number.isNaN(h)));
      log("Near", `receipts of ${address}: read stopped after ${page} pages`);
      break;
    }
    requestCursor = next;
  }

  const transfers = await Promise.all(
    [...candidateHashes].map(async hash =>
      receiptOnlyTransfer(await fetchTransactionReceipts(config, hash), hash, address),
    ),
  );

  return {
    transfers: transfers.filter(
      (transfer): transfer is NearReceiptTransfer =>
        transfer !== undefined &&
        (upperHeight === undefined || transfer.blockHeight < upperHeight) &&
        (truncatedAtHeight === undefined || transfer.blockHeight >= truncatedAtHeight),
    ),
    ...(resumeCursor !== undefined && { resumeCursor }),
    ...(truncatedAtHeight !== undefined && { truncatedAtHeight }),
  };
};

const receiptTransferToOperation = (
  accountId: string,
  address: string,
  transfer: NearReceiptTransfer,
): Operation => ({
  id: encodeOperationId(accountId, transfer.transactionHash, "IN"),
  accountId,
  fee: new BigNumber(0),
  value: new BigNumber(transfer.value),
  type: "IN",
  hash: transfer.transactionHash,
  blockHash: transfer.blockHash,
  blockHeight: transfer.blockHeight,
  date: transfer.date,
  extra: {},
  senders: [transfer.sender],
  recipients: [address],
  hasFailed: false,
});

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
): Promise<{
  transactions: NearTransaction[];
  hasOlder: boolean;
  gap: boolean;
  exhausted: boolean;
}> => {
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
        exhausted: !full || next === undefined,
      };
    }
    if (knownHashes.size === 0) {
      return { transactions, hasOlder: true, gap: false, exhausted: false };
    }
    cursor = next;
  }

  // The bound stopped the read above the known transactions: what lies between was not read. Once
  // a known one was reached the read joins the stored history, even if an unsettled one lies below.
  return { transactions, hasOlder: true, gap: !reachedKnown, exhausted: false };
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
    exhausted,
  } = await fetchTransactions(config, address, knownHashes, unsettledHashes);

  const reachedKnown = rawTransactions.some(t => knownHashes.has(t.transaction_hash));
  const heights = rawTransactions
    .map(t => (t.block?.block_height !== undefined ? Number(t.block.block_height) : NaN))
    .filter(height => !Number.isNaN(height));
  const floorHeight =
    (exhausted && !reachedKnown) || heights.length === 0 ? undefined : Math.min(...heights);
  const { transfers, truncatedAtHeight } = await readReceiptTransfers(config, address, {
    ...(floorHeight !== undefined && { floorHeight }),
    knownHashes: new Set([...knownHashes, ...rawTransactions.map(t => t.transaction_hash)]),
    stopAtHashes: knownHashes,
  });
  const keptTransactions =
    truncatedAtHeight === undefined
      ? rawTransactions
      : rawTransactions.filter(t => Number(t.block?.block_height ?? 0) >= truncatedAtHeight);

  const stakingPoolsCalled = new Map<string, string>();
  for (const transaction of keptTransactions) {
    if (
      isSender(transaction, address) &&
      transaction.actions?.some(action => isStakingPoolMethod(action.method))
    ) {
      stakingPoolsCalled.set(transaction.transaction_hash, transaction.receiver_account_id);
    }
  }

  const operations = await Promise.all(
    keptTransactions.map(transaction => transactionToOperation(accountId, address, transaction)),
  );
  operations.push(
    ...transfers.map(transfer => receiptTransferToOperation(accountId, address, transfer)),
  );

  return {
    operations,
    stakingPoolsCalled,
    isFullPage: hasOlder || truncatedAtHeight !== undefined,
    gap,
    outcomePendingHashes: keptTransactions.filter(isOutcomePending).map(t => t.transaction_hash),
    relayedHashes: keptTransactions
      .filter(transaction => isRelayedCall(transaction, address))
      .map(t => t.transaction_hash),
  };
};

export const getOperations = async (
  config: NearConfig,
  accountId: string,
  address: string,
): Promise<Operation[]> => (await fetchLegacyHistory(config, accountId, address)).operations;

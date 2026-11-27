import type {
  ListOperationsOptions,
  MemoNotSupported,
  Operation,
  Page,
} from "@ledgerhq/coin-module-framework/api/index";
import type { NearContext } from "../config";
import { RECEIPTS_MAX_PAGES } from "../constants";
import { fetchTransactionsPage, readReceiptTransfers } from "../network";
import {
  getOperationType,
  isOutcomePending,
  isRelayedCall,
  isStakingPoolMethod,
} from "../network/indexer";
import type { NearReceiptTransfer, NearTransaction } from "../network/sdk.types";

/** The indexer defaults to 25 and 422s on anything outside this range. */
const MIN_PAGE_SIZE = 1;
const MAX_PAGE_SIZE = 100;

const blockHeight = (transaction: NearTransaction): number =>
  transaction.block?.block_height !== undefined ? Number(transaction.block.block_height) : 0;

// Unlike the account bridge, an OUT value here is the transferred amount only — the generic
// framework adds `tx.fees` on top for outgoing ops, so folding the fee in here would double-charge it.
export function toOperation(transaction: NearTransaction, address: string): Operation {
  const type = getOperationType(transaction, address);
  const date = new Date(Number.parseFloat(transaction.block_timestamp) / 1e6);
  // The pool a transaction the account signed called, whatever its first action or display type
  // (a plain `deposit` shows as OUT): the sync reads it on the node when its positions lack it.
  const stakingPool =
    transaction.signer_account_id === address &&
    transaction.receiver_account_id &&
    transaction.actions?.some(action => isStakingPoolMethod(action.method))
      ? transaction.receiver_account_id
      : undefined;

  // Read by the sync: a missing outcome is read again later, a relayed call may name a pool.
  const familyExtra = {
    ...(stakingPool && { stakingPool }),
    ...(isOutcomePending(transaction) && { outcomePending: true }),
    ...(isRelayedCall(transaction, address) && { relayedCall: true }),
  };

  return {
    id: transaction.transaction_hash,
    type,
    senders: transaction.signer_account_id ? [transaction.signer_account_id] : [],
    recipients: transaction.receiver_account_id ? [transaction.receiver_account_id] : [],
    value: BigInt(transaction.actions_agg?.deposit || 0),
    asset: { type: "native" },
    tx: {
      hash: transaction.transaction_hash,
      block: {
        height: blockHeight(transaction),
        hash: transaction.block?.block_hash ?? "",
        time: date,
      },
      fees: BigInt(transaction.outcomes_agg?.transaction_fee || 0),
      date,
      failed: transaction.outcomes?.status === false,
    },
    ...(Object.keys(familyExtra).length > 0 && { details: { familyExtra } }),
  };
}

/**
 * `t`: transactions cursor, `r`: receipts cursor to resume from, `u`: upper height of the next
 * receipts window, `h`: height from which the transactions of page `t` were already returned.
 */
type Cursor = { t?: string; r?: string; u?: number; h?: number };

const encodeCursor = (cursor: Cursor): string =>
  Buffer.from(JSON.stringify(cursor)).toString("base64url");

function decodeCursor(token: string): Cursor {
  try {
    const parsed: unknown = JSON.parse(Buffer.from(token, "base64url").toString("utf8"));
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      const { t, r, u, h } = parsed as Record<string, unknown>;
      if (
        (t === undefined || typeof t === "string") &&
        (r === undefined || typeof r === "string") &&
        (u === undefined || typeof u === "number") &&
        (h === undefined || typeof h === "number")
      ) {
        return {
          ...(t !== undefined && { t }),
          ...(r !== undefined && { r }),
          ...(u !== undefined && { u }),
          ...(h !== undefined && { h }),
        };
      }
    }
  } catch {
    // falls through to the invalid cursor error
  }
  throw new Error("invalid cursor");
}

export function toReceiptOperation(
  transfer: NearReceiptTransfer,
  address: string,
): Operation<MemoNotSupported> {
  return {
    id: transfer.transactionHash,
    type: "IN",
    senders: [transfer.sender],
    recipients: [address],
    value: BigInt(transfer.value),
    asset: { type: "native" },
    tx: {
      hash: transfer.transactionHash,
      block: { height: transfer.blockHeight, hash: transfer.blockHash ?? "", time: transfer.date },
      fees: 0n,
      date: transfer.date,
      failed: false,
    },
  };
}

// Forward-only newest-to-oldest paging, so ascending order can't be honoured across pages.
export async function listOperations(
  context: NearContext,
  address: string,
  options: ListOperationsOptions,
): Promise<Page<Operation<MemoNotSupported>>> {
  const config = await context.config();
  if (options.order === "asc") {
    throw new Error("ascending order is not supported");
  }

  // `limit` is a soft limit by contract, and the indexer 422s on anything outside its range, so an
  // out-of-range request is clamped rather than forwarded and turned into a network error.
  const limit = Math.min(Math.max(options.limit ?? MAX_PAGE_SIZE, MIN_PAGE_SIZE), MAX_PAGE_SIZE);

  const cursor = options.cursor !== undefined ? decodeCursor(options.cursor) : {};

  const { transactions, next } = await fetchTransactionsPage(config, address, {
    ...(cursor.t !== undefined && { cursor: cursor.t }),
    limit,
  });

  const minHeight = options.minHeight || 0;
  // Pages run newest-first, so a transaction below the floor means everything after it is older:
  // drop it and stop advertising a next cursor.
  const reachedFloor = transactions.some(transaction => blockHeight(transaction) < minHeight);
  const hasNext = !reachedFloor && next !== undefined;

  const windowFloor =
    hasNext && transactions.length > 0 ? Math.min(...transactions.map(blockHeight)) : minHeight;

  const { transfers, resumeCursor, truncatedAtHeight } = await readReceiptTransfers(
    config,
    address,
    {
      floorHeight: windowFloor,
      ...(cursor.u !== undefined && { upperHeight: cursor.u }),
      ...(cursor.r !== undefined && { cursor: cursor.r }),
      knownHashes: new Set(transactions.map(transaction => transaction.transaction_hash)),
      pageBudget: RECEIPTS_MAX_PAGES,
    },
  );

  const isUnreturned = (height: number): boolean =>
    height >= minHeight &&
    (cursor.h === undefined || height < cursor.h) &&
    (truncatedAtHeight === undefined || height >= truncatedAtHeight);

  const items = [
    ...transactions
      .filter(transaction => isUnreturned(blockHeight(transaction)))
      .map(transaction => toOperation(transaction, address)),
    ...transfers
      .filter(transfer => transfer.blockHeight >= minHeight)
      .map(transfer => toReceiptOperation(transfer, address)),
  ].sort((a, b) => b.tx.block.height - a.tx.block.height);

  if (truncatedAtHeight !== undefined) {
    return {
      items,
      next: encodeCursor({
        ...(cursor.t !== undefined && { t: cursor.t }),
        ...(resumeCursor !== undefined && { r: resumeCursor }),
        u: truncatedAtHeight,
        h: truncatedAtHeight,
      }),
    };
  }

  return {
    items,
    next: hasNext
      ? encodeCursor({
          t: next,
          ...(resumeCursor !== undefined && { r: resumeCursor }),
          u: windowFloor,
        })
      : undefined,
  };
}

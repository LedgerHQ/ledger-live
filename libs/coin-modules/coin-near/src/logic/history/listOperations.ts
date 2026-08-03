import type {
  ListOperationsOptions,
  MemoNotSupported,
  Operation,
  Page,
} from "@ledgerhq/coin-module-framework/api/index";
import { fetchTransactionsPage } from "../../network";
import { getOperationType } from "../../network/indexer";
import type { NearTransaction } from "../../network/sdk.types";

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
  };
}

// Paginated, newest-first history. The cursor is the indexer's own opaque token, forwarded
// unchanged; paging is forward-only newest-to-oldest, so ascending order can't be honoured across pages.
export async function listOperations(
  address: string,
  options: ListOperationsOptions,
): Promise<Page<Operation<MemoNotSupported>>> {
  if (options.order === "asc") {
    throw new Error("ascending order is not supported");
  }

  // `limit` is a soft limit by contract, and the indexer 422s on anything outside its range, so an
  // out-of-range request is clamped rather than forwarded and turned into a network error.
  const limit = Math.min(Math.max(options.limit ?? MAX_PAGE_SIZE, MIN_PAGE_SIZE), MAX_PAGE_SIZE);

  const { transactions, next } = await fetchTransactionsPage(address, {
    ...(options.cursor !== undefined && { cursor: options.cursor }),
    limit,
  });

  const minHeight = options.minHeight || 0;
  // Pages run newest-first, so a transaction below the floor means everything after it is older:
  // drop it and stop advertising a next cursor.
  const reachedFloor = transactions.some(transaction => blockHeight(transaction) < minHeight);

  const items = transactions
    .filter(transaction => blockHeight(transaction) >= minHeight)
    .map(transaction => toOperation(transaction, address));

  return {
    items,
    next: reachedFloor ? undefined : next,
  };
}

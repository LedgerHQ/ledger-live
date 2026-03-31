import { Operation, Page } from "@ledgerhq/coin-module-framework/api/index";
import { promiseAllBatched } from "@ledgerhq/live-promise";
import uniqBy from "lodash/uniqBy";
import { fetchTronAccountTxsPage, getBlock } from "../network";
import { fromTrongridTxInfoToOperation } from "../network/trongrid/trongrid-adapters";
import { Block } from "../network/types";
import {
  compareTxsByTimestamp,
  dropTxsAfterNextCursor,
  dropTxsBeforeCursor,
  parseCursor,
} from "./cursor";

// Pagination uses a SUI-style cursor approach to handle two separate endpoints
// (native transactions and TRC20 transactions) while maintaining chronological order.
//
// The cursor format is "{timestamp}:{txHash}" which identifies the last transaction
// returned. On the next page, we fetch from both endpoints starting at that timestamp,
// then filter out transactions at or before the cursor position.
//
// To ensure no transactions are skipped when endpoints have different page boundaries,
// we find the "boundary transaction" - the earliest (for asc) or latest (for desc) of
// the last transactions from each endpoint - and only return transactions up to that
// boundary. The next cursor points to this boundary transaction.

export type ListOperationsOptions = {
  limit: number;
  minTimestamp: number;
  order: "asc" | "desc";
  cursor?: string;
};

export async function listOperations(
  address: string,
  options: ListOperationsOptions,
): Promise<Page<Operation>> {
  const { limit, order, cursor } = options;
  const parsedCursor = parseCursor(cursor);

  let fetchMinTimestamp: number;
  if (order === "asc") {
    fetchMinTimestamp = parsedCursor ? parsedCursor.timestamp : options.minTimestamp;
  } else {
    fetchMinTimestamp = options.minTimestamp;
  }

  const { nativeTxs, trc20Txs } = await fetchTronAccountTxsPage(
    address,
    {},
    {
      limit,
      minTimestamp: fetchMinTimestamp,
      order,
    },
  );

  // Merge and dedupe: some transactions appear in both native and TRC20 results
  const mergedTxs = uniqBy([...nativeTxs.txs, ...trc20Txs.txs], tx => tx.txID);
  const sortedTxs = [...mergedTxs].sort(compareTxsByTimestamp(order));
  const afterCursorTxs = dropTxsBeforeCursor({ txs: sortedTxs, order, cursor: parsedCursor });

  const { txs: pageTxs, nextCursor } = dropTxsAfterNextCursor({
    order,
    cursor,
    pageTxs: afterCursorTxs,
    nativeResult: nativeTxs,
    trc20Result: trc20Txs,
  });

  const blocksByHeight = new Map<number, Block>();
  const uniqueHeights = Array.from(
    new Set(pageTxs.map(tx => tx.blockHeight).filter((h): h is number => typeof h === "number")),
  );

  await promiseAllBatched(5, uniqueHeights, async height => {
    const fetchedBlock = await getBlock(height);
    blocksByHeight.set(height, fetchedBlock);
  });

  const operations = pageTxs.map(tx => {
    const height = tx.blockHeight;
    if (typeof height !== "number") {
      throw new Error(`Transaction ${tx.txID} has no block height`);
    }
    const txBlock = blocksByHeight.get(height);
    if (!txBlock) {
      throw new Error(`Block ${height} not found for transaction ${tx.txID}`);
    }
    return fromTrongridTxInfoToOperation(tx, txBlock, address);
  });

  return { items: operations, next: nextCursor };
}

import { TxPageResult } from "../network";
import { TrongridTxInfo } from "../types";

export type ListOperationsCursor = {
  txHash: string;
  timestamp: number;
};

export function serializeCursor(cursor: ListOperationsCursor): string {
  return `${cursor.timestamp}:${cursor.txHash}`;
}

export function parseCursor(cursor: string | undefined): ListOperationsCursor | null {
  if (!cursor) return null;

  const sepIdx = cursor.indexOf(":");
  if (sepIdx <= 0 || sepIdx === cursor.length - 1) {
    throw new Error("Invalid cursor format: missing timestamp or txHash");
  }

  const ts = Number(cursor.slice(0, sepIdx));
  const txHash = cursor.slice(sepIdx + 1);
  if (!Number.isFinite(ts) || !txHash) {
    throw new Error("Invalid cursor format: invalid timestamp or txHash");
  }

  return { txHash, timestamp: ts };
}

export function compareTxsByTimestamp(
  order: "asc" | "desc",
): (a: TrongridTxInfo, b: TrongridTxInfo) => number {
  return (a, b) => {
    const diff = a.date.getTime() - b.date.getTime();
    return order === "asc" ? diff : -diff;
  };
}

// Drops transactions at or before the cursor position.
// For transactions with the same timestamp as the cursor, we rely on TronGrid's
// consistent ordering: find the cursor txHash in the list and drop everything
// at or before that position.
export function dropTxsBeforeCursor(params: {
  txs: TrongridTxInfo[];
  order: "asc" | "desc";
  cursor: ListOperationsCursor | null;
}): TrongridTxInfo[] {
  const { txs, order, cursor } = params;
  if (!cursor) return txs;

  const cursorIndex = txs.findIndex(tx => tx.txID === cursor.txHash);

  if (cursorIndex !== -1) {
    return txs.slice(cursorIndex + 1);
  }

  return txs.filter(tx => {
    const txTimestamp = tx.date.getTime();
    if (order === "asc") {
      return txTimestamp > cursor.timestamp;
    } else {
      return txTimestamp < cursor.timestamp;
    }
  });
}

function getLastTx(txs: TrongridTxInfo[]): TrongridTxInfo | undefined {
  return txs.length > 0 ? txs[txs.length - 1] : undefined;
}

// Computes the boundary for pagination and filters transactions accordingly.
// The boundary is the "earliest" (for asc) or "latest" (for desc) of the last
// transactions from each endpoint. This ensures we don't skip transactions
// that might appear on the next page of one endpoint but chronologically
// belong before the current page of the other endpoint.
export function dropTxsAfterNextCursor(params: {
  order: "asc" | "desc";
  cursor: string | undefined;
  pageTxs: TrongridTxInfo[];
  nativeResult: TxPageResult;
  trc20Result: TxPageResult;
}): { txs: TrongridTxInfo[]; nextCursor: string | undefined } {
  const { order, cursor, pageTxs, nativeResult, trc20Result } = params;

  if (!(nativeResult.hasNextPage || trc20Result.hasNextPage)) {
    return { txs: pageTxs, nextCursor: undefined };
  }

  const lastTxs: TrongridTxInfo[] = [
    getLastTx(nativeResult.txs),
    getLastTx(trc20Result.txs),
  ].filter((tx): tx is TrongridTxInfo => tx !== undefined);

  if (lastTxs.length === 0) {
    return { txs: pageTxs, nextCursor: undefined };
  }

  const boundaryTx = lastTxs.reduce((selected, current) =>
    compareTxsByTimestamp(order)(current, selected) < 0 ? current : selected,
  );

  const boundaryTimestamp = boundaryTx.date.getTime();

  const txsBeforeOrAtBoundary = pageTxs.filter(tx => {
    const txTimestamp = tx.date.getTime();
    if (order === "asc") {
      return txTimestamp <= boundaryTimestamp;
    } else {
      return txTimestamp >= boundaryTimestamp;
    }
  });

  if (txsBeforeOrAtBoundary.length === 0) {
    return { txs: [], nextCursor: undefined };
  }

  const lastReturnedTx = txsBeforeOrAtBoundary[txsBeforeOrAtBoundary.length - 1];

  const nextCursorCandidate = serializeCursor({
    txHash: lastReturnedTx.txID,
    timestamp: lastReturnedTx.date.getTime(),
  });

  const nextCursor = nextCursorCandidate === cursor ? undefined : nextCursorCandidate;

  return { txs: txsBeforeOrAtBoundary, nextCursor };
}

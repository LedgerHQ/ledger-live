import { PageBoundary, TxPageResult } from "../network";
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

// Last record TronGrid returned for an endpoint, whether or not it survived filtering.
function getLastRecord(result: TxPageResult): PageBoundary | undefined {
  return result.lastRaw ?? getLastTx(result.txs);
}

// True when TronGrid itself returned nothing for both endpoints (as opposed to returning
// records that were all filtered out).
export function isEmptyTronGridPage(
  nativeResult: TxPageResult,
  trc20Result: TxPageResult,
): boolean {
  return !getLastRecord(nativeResult) && !getLastRecord(trc20Result);
}

// Resume position that matches no transaction hash, so `dropTxsBeforeCursor` always falls back to
// comparing timestamps.
const TIMESTAMP_ONLY_MARKER = "timestamp-only";

type Frontier = PageBoundary & { kept: boolean };

// How far an endpoint has been read. Its last surviving tx when that tx is still in the page.
// Otherwise (every record filtered out, or the only survivor is the cursor tx itself) the last
// record TronGrid returned, as long as the endpoint has more to give.
function getFrontier(result: TxPageResult, pageTxIds: Set<string>): Frontier | undefined {
  const lastTx = getLastTx(result.txs);
  if (lastTx && pageTxIds.has(lastTx.txID)) {
    return { txID: lastTx.txID, date: lastTx.date, kept: true };
  }
  if (result.hasNextPage && result.lastRaw) {
    return { ...result.lastRaw, kept: false };
  }
  return undefined;
}

// Computes the boundary for pagination and filters transactions accordingly.
// The boundary is the "earliest" (for asc) or "latest" (for desc) of the frontiers of the
// endpoints. This ensures we don't skip transactions that might appear on the next page of one
// endpoint but chronologically belong before the current page of the other endpoint. On equal
// timestamps a frontier that is in the page wins, because its hash can be found again.
//
// When the boundary is a record that is not in the page, its hash cannot be relied on to locate the
// next page (it may be filtered out there too, or match another endpoint's entry). The page is then
// cut strictly before its timestamp and the cursor carries a timestamp-only position, moved one
// millisecond back so the next page starts again from the whole boundary timestamp. If that does not
// move the cursor forward, the page cannot be crossed: pagination ends, as it always did.
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

  const pageTxIds = new Set(pageTxs.map(tx => tx.txID));
  const frontiers: Frontier[] = [nativeResult, trc20Result]
    .map(result => getFrontier(result, pageTxIds))
    .filter((frontier): frontier is Frontier => frontier !== undefined);

  if (frontiers.length === 0) {
    return { txs: pageTxs, nextCursor: undefined };
  }

  const boundary = frontiers.reduce((selected, current) => {
    const diff = current.date.getTime() - selected.date.getTime();
    const shouldSelect =
      diff === 0 ? current.kept && !selected.kept : order === "asc" ? diff < 0 : diff > 0;
    return shouldSelect ? current : selected;
  });
  const boundaryTimestamp = boundary.date.getTime();

  if (boundary.kept) {
    const boundaryIndex = pageTxs.findIndex(tx => tx.txID === boundary.txID);
    const nextCursorCandidate = serializeCursor({
      txHash: boundary.txID,
      timestamp: boundaryTimestamp,
    });
    return {
      txs: pageTxs.slice(0, boundaryIndex + 1),
      nextCursor: nextCursorCandidate === cursor ? undefined : nextCursorCandidate,
    };
  }

  const txs = pageTxs.filter(tx =>
    order === "asc" ? tx.date.getTime() < boundaryTimestamp : tx.date.getTime() > boundaryTimestamp,
  );
  const nextTimestamp = order === "asc" ? boundaryTimestamp - 1 : boundaryTimestamp + 1;
  const previousTimestamp = parseCursor(cursor)?.timestamp;
  const advances =
    previousTimestamp === undefined ||
    (order === "asc" ? nextTimestamp > previousTimestamp : nextTimestamp < previousTimestamp);

  return {
    txs,
    nextCursor: advances
      ? serializeCursor({ txHash: TIMESTAMP_ONLY_MARKER, timestamp: nextTimestamp })
      : undefined,
  };
}

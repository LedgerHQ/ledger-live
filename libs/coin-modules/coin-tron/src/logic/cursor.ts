import type { TxEndpointPage } from "../network";
import { TrongridTxInfo } from "../types";

export type Order = "asc" | "desc";

// The cursor is the block timestamp the next page starts at, inclusive. It is never persisted:
// it lives only for one walk of `paginateOperations`.
export function serializeCursor(timestamp: number): string {
  return String(timestamp);
}

export function parseCursor(cursor: string | undefined): number | null {
  if (!cursor) return null;
  const timestamp = Number(cursor);
  if (!/^\d+$/.test(cursor) || !Number.isSafeInteger(timestamp)) {
    throw new Error(`Invalid cursor format: ${cursor}`);
  }
  return timestamp;
}

/** Whether `a` comes strictly before `b` in walk order. */
export function walksBefore(order: Order, a: number, b: number): boolean {
  return order === "asc" ? a < b : a > b;
}

/** The first timestamp after `timestamp` in walk order. */
export function stepPast(order: Order, timestamp: number): number {
  return order === "asc" ? timestamp + 1 : timestamp - 1;
}

export function compareTxsByTimestamp(
  order: Order,
): (a: TrongridTxInfo, b: TrongridTxInfo) => number {
  return (a, b) => {
    const diff = a.date.getTime() - b.date.getTime();
    return order === "asc" ? diff : -diff;
  };
}

/**
 * The timestamp a page is cut at, or `undefined` when no endpoint has a next page.
 *
 * Records sharing a timestamp may continue on an endpoint's next page, so the last timestamp of
 * each endpoint that has one is open. The cut is the earliest of them in walk order: every record
 * strictly before it is complete on both endpoints. An endpoint with no next page is complete and
 * takes no part. Raw timestamps are used, so filtering never moves the cut.
 */
export function pageBoundary(order: Order, pages: TxEndpointPage[]): number | undefined {
  const open = pages
    .filter(page => page.next !== undefined && page.timestamps.length > 0)
    .map(page => page.timestamps.reduce((last, ts) => (walksBefore(order, last, ts) ? ts : last)));
  if (open.length === 0) return undefined;
  return open.reduce((boundary, ts) => (walksBefore(order, ts, boundary) ? ts : boundary));
}

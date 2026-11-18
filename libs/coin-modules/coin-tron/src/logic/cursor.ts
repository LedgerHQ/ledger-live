import type { TxEndpointPage } from "../network";
import { TrongridTxInfo } from "../types";

export type Order = "asc" | "desc";

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

export function walksBefore(order: Order, a: number, b: number): boolean {
  return order === "asc" ? a < b : a > b;
}

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

export function pageBoundary(order: Order, pages: TxEndpointPage[]): number | undefined {
  const lastTimestampsOfUnfinishedEndpoints = pages
    .filter(page => page.next !== undefined && page.rawTimestamps.length > 0)
    .map(page =>
      page.rawTimestamps.reduce((last, ts) => (walksBefore(order, last, ts) ? ts : last)),
    );
  if (lastTimestampsOfUnfinishedEndpoints.length === 0) return undefined;
  return lastTimestampsOfUnfinishedEndpoints.reduce((boundary, ts) =>
    walksBefore(order, ts, boundary) ? ts : boundary,
  );
}

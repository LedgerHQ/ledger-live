import type { AccountOperationsRow, ListedOperation } from "../types";

/** `2026-01-31T12:00:00.000Z` → `2026-01-31 12:00`. Enough to order a list by eye. */
export function formatDate(iso: string): string {
  const ms = new Date(iso).getTime();
  return Number.isFinite(ms) ? iso.slice(0, 16).replace("T", " ") : iso;
}

/** Where the operation sits in a block, or that it has not reached one. */
export function blockLine(operation: ListedOperation): string {
  return operation.blockHeight === null ? "pending" : `block ${operation.blockHeight}`;
}

/** How much of the history is loaded, saying so when the total is not knowable. */
export function countLine(row: AccountOperationsRow): string {
  if (!row.status.sourceId) return "not read yet";
  const loaded = `${row.operations.length} loaded`;
  if (row.total === undefined) return `${loaded} · total unknown, the window is partial`;
  if (row.complete) return `${loaded} · complete history`;
  return `${loaded} of ${row.total}`;
}

/** Who answered and what is left, or the error if the read failed. */
export function statusLine(row: AccountOperationsRow): string {
  if (row.status.error) return row.status.error;
  if (row.status.pending) return "reading…";
  if (!row.status.sourceId) return "not read yet";
  const more = row.hasMore ? "more available" : "nothing more to load";
  return `served by ${row.status.sourceId} · ${more}`;
}

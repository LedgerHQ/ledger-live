import invariant from "invariant";
import type { Operation } from "@ledgerhq/coin-module-framework/api/types";

export type OperationsOrder = "asc" | "desc";

/**
 * Opaque pagination state — callers must not parse it.
 *
 * It carries the identity of the stream, not just a position: `maxBlockHeight` is pinned on the
 * first page so a paging run stays a consistent snapshot as the scanner advances, and
 * `minHeight` / `order` are echoed back so a cursor replayed against a different window is rejected.
 *
 * `resume` names the last operation actually emitted, by `(block, transactionId)` — the same pair the
 * total order sorts on. The framework requires a non-volatile cursor, which is why it is an identity
 * and not an offset: a count of operations at a height is recomputed on every call, so a late-indexed
 * row or a reorg would shift it and the next page would skip or repeat rows.
 */
export type OperationsCursor = {
  minHeight: number;
  maxBlockHeight: number;
  order: OperationsOrder;
  resume?: { block: number; transactionId: string };
};

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isOperationsOrder(value: unknown): value is OperationsOrder {
  return value === "asc" || value === "desc";
}

export function encodeOperationsCursor(cursor: OperationsCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

export function decodeOperationsCursor(raw: string | undefined): OperationsCursor | null {
  if (!raw) return null;

  let decoded: Partial<OperationsCursor>;
  try {
    decoded = JSON.parse(Buffer.from(raw, "base64url").toString());
  } catch {
    throw new Error("aleo: malformed listOperations cursor");
  }

  const { minHeight, maxBlockHeight, order, resume } = decoded;
  invariant(
    isNonNegativeInteger(minHeight) && isNonNegativeInteger(maxBlockHeight),
    "aleo: malformed listOperations cursor",
  );
  invariant(isOperationsOrder(order), "aleo: malformed listOperations cursor");

  if (resume === undefined) return { minHeight, maxBlockHeight, order };

  invariant(
    isNonNegativeInteger(resume?.block) && typeof resume?.transactionId === "string",
    "aleo: malformed listOperations cursor",
  );

  return { minHeight, maxBlockHeight, order, resume };
}

/**
 * A position is only meaningful relative to the window it was cut from, so a caller that changes
 * `minHeight` or flips `order` mid-run is told, not silently served rows it has already seen.
 */
export function assertCursorMatchesRequest(
  cursor: OperationsCursor,
  minHeight: number,
  order: OperationsOrder,
): void {
  invariant(
    cursor.minHeight === minHeight && cursor.order === order,
    "aleo: listOperations cursor does not match the requested range",
  );
}

/**
 * The height range to fetch. A resume reopens *on* the boundary block rather than after it: the
 * explorer resumes at block granularity, and operations already emitted from that block are dropped
 * locally by {@link dropThroughResumePoint}.
 */
export function resolveHeightWindow(
  cursor: OperationsCursor | null,
  minHeight: number,
  maxBlockHeight: number,
): { from: number; to: number } {
  if (!cursor?.resume) return { from: minHeight, to: maxBlockHeight };

  return cursor.order === "asc"
    ? { from: cursor.resume.block, to: maxBlockHeight }
    : { from: minHeight, to: cursor.resume.block };
}

/** Total order over operations: block height first, hash to break ties within a height. */
export function compareOperations(
  a: { block: number; transactionId: string },
  b: { block: number; transactionId: string },
  order: OperationsOrder,
): number {
  const direction = order === "asc" ? 1 : -1;

  return direction * (a.block - b.block || a.transactionId.localeCompare(b.transactionId));
}

function toOrderKey(operation: Operation): {
  block: number;
  transactionId: string;
} {
  return { block: operation.tx.block.height, transactionId: operation.tx.hash };
}

/**
 * Drops the operations an earlier page already emitted.
 *
 * Compares against the resume point in the stream's own total order rather than looking the operation
 * up by identity, so a resume point that has since vanished from the range — a reorg dropped it, the
 * explorer re-indexed it — still cuts at the right place instead of replaying the page.
 */
export function dropThroughResumePoint(
  ordered: Operation[],
  resume: OperationsCursor["resume"],
  order: OperationsOrder,
): Operation[] {
  if (!resume) return ordered;

  return ordered.filter(operation => compareOperations(toOrderKey(operation), resume, order) > 0);
}

/** Where the next page picks up: the last operation this page emitted. */
export function buildResumePoint(items: Operation[]): OperationsCursor["resume"] {
  const last = items.at(-1);

  return last ? toOrderKey(last) : undefined;
}

import invariant from "invariant";
import type { Operation } from "@ledgerhq/coin-module-framework/api/types";

export type OperationsOrder = "asc" | "desc";

// `resume` is an identity (block + transactionId), not an offset — recomputing a count on every
// call would shift on a late-indexed row or a reorg, causing skips or repeats.
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

// A resume reopens *on* the boundary block — already-emitted rows are dropped by dropThroughResumePoint.
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

// Compares by order position, not identity, so a reorg-dropped resume point still cuts correctly.
export function dropThroughResumePoint(
  ordered: Operation[],
  resume: OperationsCursor["resume"],
  order: OperationsOrder,
): Operation[] {
  if (!resume) return ordered;

  return ordered.filter(operation => compareOperations(toOrderKey(operation), resume, order) > 0);
}

export function buildResumePoint(items: Operation[]): OperationsCursor["resume"] {
  const last = items.at(-1);

  return last ? toOrderKey(last) : undefined;
}

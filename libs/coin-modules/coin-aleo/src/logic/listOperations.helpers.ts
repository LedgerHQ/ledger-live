import invariant from "invariant";
import type { Operation } from "@ledgerhq/coin-module-framework/api/types";

export type OperationsOrder = "asc" | "desc";

// The explorer only pages by block (`cursor_block_number`), so `nextBlock` — the first block not yet
// emitted — is the finest resume point the source can express. Pages therefore never split a block.
export type OperationsCursor = {
  minHeight: number;
  maxBlockHeight: number;
  order: OperationsOrder;
  nextBlock?: number;
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

  const { minHeight, maxBlockHeight, order, nextBlock } = decoded;
  invariant(
    isNonNegativeInteger(minHeight) && isNonNegativeInteger(maxBlockHeight),
    "aleo: malformed listOperations cursor",
  );
  invariant(isOperationsOrder(order), "aleo: malformed listOperations cursor");

  if (nextBlock === undefined) return { minHeight, maxBlockHeight, order };

  invariant(isNonNegativeInteger(nextBlock), "aleo: malformed listOperations cursor");

  return { minHeight, maxBlockHeight, order, nextBlock };
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

/** The blocks this call may emit, or `null` when the range is empty. */
export function resolveBlockWindow(
  cursor: OperationsCursor | null,
  minHeight: number,
  maxBlockHeight: number,
): { fromBlock: number; toBlock: number } | null {
  const resumesAt = cursor?.nextBlock;
  const isAscending = (cursor?.order ?? "asc") === "asc";
  const fromBlock = resumesAt !== undefined && isAscending ? resumesAt : minHeight;
  const toBlock = resumesAt !== undefined && !isAscending ? resumesAt : maxBlockHeight;

  return fromBlock > toBlock ? null : { fromBlock, toBlock };
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

export function sortOperations(operations: Operation[], order: OperationsOrder): Operation[] {
  return operations.sort((a, b) =>
    compareOperations(
      { block: a.tx.block.height, transactionId: a.tx.hash },
      { block: b.tx.block.height, transactionId: b.tx.hash },
      order,
    ),
  );
}

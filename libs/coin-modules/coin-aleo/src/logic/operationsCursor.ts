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
 * `resume.height` is where the next page picks up; `resume.emitted` counts the operations already
 * returned at exactly that height, which is what makes the boundary skip exact.
 */
export type OperationsCursor = {
  minHeight: number;
  maxBlockHeight: number;
  order: OperationsOrder;
  resume?: { height: number; emitted: number };
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
    isNonNegativeInteger(resume?.height) && isNonNegativeInteger(resume?.emitted),
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

export function resolveHeightWindow(
  cursor: OperationsCursor | null,
  minHeight: number,
  maxBlockHeight: number,
): { from: number; to: number } {
  if (!cursor?.resume) return { from: minHeight, to: maxBlockHeight };

  return cursor.order === "asc"
    ? { from: cursor.resume.height, to: maxBlockHeight }
    : { from: minHeight, to: cursor.resume.height };
}

/**
 * Where the next page picks up: the last emitted operation's height, plus how many operations at that
 * height have gone out across the whole run. The window opens on the previous resume height, so the
 * emitted prefix of `ordered` still contains the earlier pages' rows at that height.
 */
export function buildResumePoint(
  ordered: Operation[],
  emittedBefore: number,
  emittedNow: number,
): OperationsCursor["resume"] {
  const last = ordered[emittedBefore + emittedNow - 1];
  if (!last) return undefined;

  const height = last.tx.block.height;
  const emitted = ordered
    .slice(0, emittedBefore + emittedNow)
    .filter(operation => operation.tx.block.height === height).length;

  return { height, emitted };
}

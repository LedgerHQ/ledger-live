// Ids repeat (internal ops can share their parent's id), so the cursor also stores the occurrence.

export class InvalidOperationsCursorError extends Error {
  constructor() {
    super(
      "This --cursor does not match the account's operation history. " +
        "Run the command again without --cursor to start from the most recent operation.",
    );
    this.name = "InvalidOperationsCursorError";
  }
}

type Cursor = { id: string; occurrence: number };

export function paginateOperations<T extends { id: string }>(
  ops: T[],
  { cursor, limit }: { cursor?: string; limit?: number },
): { operations: T[]; nextCursor: string | undefined } {
  if (limit !== undefined && limit < 1) throw new RangeError("limit must be at least 1");
  const start = cursor === undefined ? 0 : indexOf(ops, decodeCursor(cursor)) + 1;
  const end = limit === undefined ? ops.length : start + limit;
  const operations = ops.slice(start, end);
  const hasMore = end < ops.length;
  return {
    operations,
    nextCursor: hasMore && operations.length > 0 ? encodeCursor(ops, end - 1) : undefined,
  };
}

function encodeCursor(ops: { id: string }[], index: number): string {
  const { id } = ops[index];
  const occurrence = ops.slice(0, index).filter(op => op.id === id).length;
  return Buffer.from(JSON.stringify([id, occurrence])).toString("base64url");
}

function decodeCursor(cursor: string): Cursor {
  try {
    const parsed: unknown = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
    if (
      Array.isArray(parsed) &&
      parsed.length === 2 &&
      typeof parsed[0] === "string" &&
      Number.isSafeInteger(parsed[1]) &&
      parsed[1] >= 0
    ) {
      return { id: parsed[0], occurrence: parsed[1] };
    }
  } catch {
    // Falls through to the error below, like any other cursor that is not ours.
  }
  throw new InvalidOperationsCursorError();
}

function indexOf(ops: { id: string }[], { id, occurrence }: Cursor): number {
  let seen = 0;
  for (const [index, op] of ops.entries()) {
    if (op.id !== id) continue;
    if (seen === occurrence) return index;
    seen += 1;
  }
  throw new InvalidOperationsCursorError();
}

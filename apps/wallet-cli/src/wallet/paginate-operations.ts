// The cursor names the last operation of the previous page, so operations that arrive at the top
// of the history between two calls do not shift the next page.

export class InvalidOperationsCursorError extends Error {
  constructor() {
    super(
      "This --cursor does not match the account's operation history. " +
        "Run the command again without --cursor to start from the most recent operation.",
    );
    this.name = "InvalidOperationsCursorError";
  }
}

export function paginateOperations<T extends { id: string }>(
  ops: T[],
  { cursor, limit }: { cursor?: string; limit?: number },
): { operations: T[]; nextCursor: string | undefined } {
  const start = cursor === undefined ? 0 : indexAfterCursor(ops, cursor);
  const end = limit === undefined ? ops.length : start + limit;
  const operations = ops.slice(start, end);
  const lastReturned = operations.at(-1);
  const hasMore = end < ops.length;
  return {
    operations,
    nextCursor:
      hasMore && lastReturned ? Buffer.from(lastReturned.id).toString("base64url") : undefined,
  };
}

function indexAfterCursor(ops: { id: string }[], cursor: string): number {
  const lastReturnedId = Buffer.from(cursor, "base64url").toString("utf8");
  const index = ops.findIndex(op => op.id === lastReturnedId);
  if (index === -1) throw new InvalidOperationsCursorError();
  return index + 1;
}

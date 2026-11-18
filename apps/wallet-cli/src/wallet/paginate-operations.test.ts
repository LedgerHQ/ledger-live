import { describe, expect, it } from "bun:test";
import { InvalidOperationsCursorError, paginateOperations } from "./paginate-operations";

const history = ["a", "b", "c", "d", "e"].map(id => ({ id }));
const ids = (page: { operations: { id: string }[] }) => page.operations.map(op => op.id);

function readAllPages(ops: { id: string }[], limit: number): string[][] {
  const pages: string[][] = [];
  let cursor: string | undefined;
  do {
    if (pages.length > ops.length) throw new Error("pagination never reached the last page");
    const page = paginateOperations(ops, { limit, cursor });
    pages.push(ids(page));
    cursor = page.nextCursor;
  } while (cursor !== undefined);
  return pages;
}

describe("paginateOperations", () => {
  it("returns the whole history without a next cursor when no limit is given", () => {
    const page = paginateOperations(history, {});
    expect(ids(page)).toEqual(["a", "b", "c", "d", "e"]);
    expect(page.nextCursor).toBeUndefined();
  });

  it("returns a next cursor when the history is longer than the limit", () => {
    const page = paginateOperations(history, { limit: 2 });
    expect(ids(page)).toEqual(["a", "b"]);
    expect(page.nextCursor).toEqual(expect.any(String));
  });

  it("walks the whole history page by page without duplicates or gaps", () => {
    expect(readAllPages(history, 2)).toEqual([["a", "b"], ["c", "d"], ["e"]]);
  });

  it("returns no next cursor when the last page is exactly full", () => {
    expect(readAllPages(history.slice(0, 4), 2)).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
  });

  it("returns the rest of the history when a cursor comes without a limit", () => {
    const first = paginateOperations(history, { limit: 2 });
    const rest = paginateOperations(history, { cursor: first.nextCursor });
    expect(ids(rest)).toEqual(["c", "d", "e"]);
    expect(rest.nextCursor).toBeUndefined();
  });

  it("keeps the next page stable when new operations arrive at the top", () => {
    const first = paginateOperations(history, { limit: 2 });
    const withNewOps = [{ id: "new-2" }, { id: "new-1" }, ...history];
    const second = paginateOperations(withNewOps, { limit: 2, cursor: first.nextCursor });
    expect(ids(second)).toEqual(["c", "d"]);
  });

  // The bridge lists an internal operation under both parents of a self-send, with the same id.
  const selfSendHistory = ["out", "internal", "in", "internal", "older"].map(id => ({ id }));

  it.each([1, 2, 3, 4])(
    "returns every operation once when operations share an id (limit %i)",
    limit => {
      expect(readAllPages(selfSendHistory, limit).flat()).toEqual(selfSendHistory.map(op => op.id));
    },
  );

  it.each([
    ["is not a cursor", "not-a-cursor"],
    [
      "points at an operation that is gone",
      paginateOperations([{ id: "gone" }, ...history], { limit: 1 }).nextCursor,
    ],
  ])("rejects a cursor that %s", (_case, cursor) => {
    expect(() => paginateOperations(history, { limit: 2, cursor })).toThrow(
      InvalidOperationsCursorError,
    );
  });
});

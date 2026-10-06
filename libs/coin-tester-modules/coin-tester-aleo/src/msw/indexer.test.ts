import type { AleoPublicTransaction } from "@ledgerhq/coin-aleo/types";
import { applyTransactionsCursor, pageTransactions, readTransactionsCursor } from "./indexer";

function row(blockNumber: number, transitionId: string): AleoPublicTransaction {
  return { block_number: blockNumber, transition_id: transitionId } as AleoPublicTransaction;
}

const ROWS = [row(10, "au1a"), row(11, "au1b"), row(11, "au1c"), row(12, "au1d")];

const ids = (rows: AleoPublicTransaction[]) => rows.map(r => r.transition_id);

describe("applyTransactionsCursor", () => {
  it("returns every row, oldest first, without a cursor", () => {
    expect(ids(applyTransactionsCursor(ROWS, { order: "asc" }))).toStrictEqual([
      "au1a",
      "au1b",
      "au1c",
      "au1d",
    ]);
  });

  it("resumes past the whole block when only a block number is given", () => {
    expect(ids(applyTransactionsCursor(ROWS, { blockNumber: 11, order: "asc" }))).toStrictEqual([
      "au1d",
    ]);
  });

  it("resumes past the transition inside its block when a transition id is given", () => {
    expect(
      ids(applyTransactionsCursor(ROWS, { blockNumber: 11, transitionId: "au1b", order: "asc" })),
    ).toStrictEqual(["au1c", "au1d"]);
  });

  it("walks newest first and stops before the cursor block in desc order", () => {
    expect(ids(applyTransactionsCursor(ROWS, { blockNumber: 11, order: "desc" }))).toStrictEqual([
      "au1a",
    ]);
    expect(ids(applyTransactionsCursor(ROWS, { order: "desc" }))).toStrictEqual([
      "au1d",
      "au1c",
      "au1b",
      "au1a",
    ]);
  });

  it("does not mutate the rows it is given", () => {
    const rows = [...ROWS];
    applyTransactionsCursor(rows, { order: "desc" });
    expect(rows).toStrictEqual(ROWS);
  });
});

describe("readTransactionsCursor", () => {
  it("reads no cursor and ascending order from a bare query", () => {
    expect(readTransactionsCursor(new URLSearchParams())).toStrictEqual({ order: "asc" });
  });

  it("reads the block number, transition id and descending order", () => {
    const query = new URLSearchParams({
      cursor_block_number: "11",
      cursor_transition_id: "au1b",
      sort: "desc",
    });

    expect(readTransactionsCursor(query)).toStrictEqual({
      blockNumber: 11,
      transitionId: "au1b",
      order: "desc",
    });
  });

  it("keeps block 0 as a cursor", () => {
    const query = new URLSearchParams({ cursor_block_number: "0" });

    expect(readTransactionsCursor(query)).toStrictEqual({ blockNumber: 0, order: "asc" });
  });
});

describe("pageTransactions", () => {
  it("serves every row without a next_cursor when they fit the requested limit", () => {
    const response = pageTransactions("aleo1owner", ROWS, new URLSearchParams({ limit: "10" }));

    expect(ids(response.transactions)).toStrictEqual(["au1a", "au1b", "au1c", "au1d"]);
    expect(response.next_cursor).toBeUndefined();
  });

  it("stops at the requested limit and points next_cursor at the last row served", () => {
    const response = pageTransactions("aleo1owner", ROWS, new URLSearchParams({ limit: "2" }));

    expect(ids(response.transactions)).toStrictEqual(["au1a", "au1b"]);
    expect(response.next_cursor).toStrictEqual({ block_number: 11, transition_id: "au1b" });
  });

  it("caps the page below the requested limit", () => {
    const response = pageTransactions("aleo1owner", ROWS, new URLSearchParams({ limit: "50" }), 3);

    expect(ids(response.transactions)).toStrictEqual(["au1a", "au1b", "au1c"]);
    expect(response.next_cursor).toStrictEqual({ block_number: 11, transition_id: "au1c" });
  });

  it("resumes from the cursor it was given", () => {
    const query = new URLSearchParams({
      limit: "2",
      cursor_block_number: "11",
      cursor_transition_id: "au1b",
    });

    const response = pageTransactions("aleo1owner", ROWS, query);

    expect(ids(response.transactions)).toStrictEqual(["au1c", "au1d"]);
    expect(response.next_cursor).toBeUndefined();
  });
});

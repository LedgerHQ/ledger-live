import type { Operation, Page } from "@ledgerhq/coin-module-framework/api/types";
import { paginateOperations } from "./paginateOperations";

const op = (hash: string) => ({ tx: { hash } }) as unknown as Operation;

const pages =
  (...responses: Page<Operation>[]) =>
  (cursor: string | undefined) => {
    calls.push(cursor);
    const next = responses[calls.length - 1];
    if (!next) throw new Error("fetched more pages than the test provided");
    return Promise.resolve(next);
  };

let calls: (string | undefined)[] = [];
beforeEach(() => {
  calls = [];
});

describe("paginateOperations", () => {
  it("stops on an absent cursor", async () => {
    const items = await paginateOperations(pages({ items: [op("a")] }));

    expect(items.map(o => o.tx.hash)).toEqual(["a"]);
    expect(calls).toEqual([undefined]);
  });

  it("stops on an empty-string cursor (coin-evm's Ledger explorer arm, coin-algorand)", async () => {
    const items = await paginateOperations(pages({ items: [op("a")], next: "" }));

    expect(items.map(o => o.tx.hash)).toEqual(["a"]);
    expect(calls).toEqual([undefined]);
  });

  it("follows the chain across pages, threading each cursor into the next request", async () => {
    const items = await paginateOperations(
      pages(
        { items: [op("a")], next: "c1" },
        { items: [op("b")], next: "c2" },
        { items: [op("c")] },
      ),
    );

    expect(items.map(o => o.tx.hash)).toEqual(["a", "b", "c"]);
    expect(calls).toEqual([undefined, "c1", "c2"]);
  });

  it("stops when the cursor does not advance", async () => {
    const items = await paginateOperations(
      pages({ items: [op("a")], next: "c1" }, { items: [op("b")], next: "c1" }),
    );

    expect(items.map(o => o.tx.hash)).toEqual(["a", "b"]);
    expect(calls).toEqual([undefined, "c1"]);
  });

  it("stops on a cursor cycle longer than one page, which no equality check would catch", async () => {
    const items = await paginateOperations(
      pages(
        { items: [op("a")], next: "c1" },
        { items: [op("b")], next: "c2" },
        { items: [op("c")], next: "c1" },
      ),
    );

    expect(items.map(o => o.tx.hash)).toEqual(["a", "b", "c"]);
    expect(calls).toEqual([undefined, "c1", "c2"]);
  });

  it("stops on an empty page handed back with a cursor (coin-vechain's early return)", async () => {
    const items = await paginateOperations(
      pages({ items: [op("a")], next: "c1" }, { items: [], next: "c2" }),
    );

    expect(items.map(o => o.tx.hash)).toEqual(["a"]);
    expect(calls).toEqual([undefined, "c1"]);
  });

  it("propagates a mid-chain failure rather than returning a truncated history", async () => {
    await expect(
      paginateOperations(cursor => {
        calls.push(cursor);
        return calls.length === 1
          ? Promise.resolve({ items: [op("a")], next: "c1" })
          : Promise.reject(new Error("transient explorer failure"));
      }),
    ).rejects.toThrow("transient explorer failure");
    expect(calls).toEqual([undefined, "c1"]);
  });
});

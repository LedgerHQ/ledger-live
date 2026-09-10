import { log } from "@ledgerhq/logs";
import type { Operation, Page } from "@ledgerhq/coin-module-framework/api/types";
import { paginateOperations } from "./paginateOperations";

jest.mock("@ledgerhq/logs", () => ({ log: jest.fn() }));
const logMock = jest.mocked(log);

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
  logMock.mockClear();
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

  describe("with a bound", () => {
    it("stops after the page that reaches the bound, without fetching further pages or trimming that page", async () => {
      const items = await paginateOperations(
        pages(
          { items: [op("a"), op("b"), op("c")], next: "c1" },
          // "d" appears twice in this page, straddling the exact position where the bound (4)
          // is reached mid-page -- if the walk trimmed to the bound instead of returning the
          // whole page, this pair would be split.
          { items: [op("d"), op("d"), op("e")], next: "c2" },
          { items: [op("f"), op("g"), op("h")] },
        ),
        4,
      );

      // Whole pages only: 6 (2 pages of 3), never trimmed to exactly 4.
      expect(items.map(o => o.tx.hash)).toEqual(["a", "b", "c", "d", "d", "e"]);
      expect(items.length).toBeGreaterThanOrEqual(4);
      // The third page (only reachable had the bound not stopped the walk) was never fetched.
      expect(calls).toEqual([undefined, "c1"]);

      const grouped = new Map<string, number>();
      for (const o of items) grouped.set(o.tx.hash, (grouped.get(o.tx.hash) ?? 0) + 1);
      expect(grouped.get("d")).toBe(2);
    });

    it("logs when the bound stops the walk, so a bounded run is distinguishable from a complete one", async () => {
      // The second page still carries a `next`: the bound, not a natural end, is what stops the
      // walk here -- a third page exists and is deliberately never fetched.
      await paginateOperations(
        pages(
          { items: [op("a"), op("b")], next: "c1" },
          { items: [op("c"), op("d")], next: "c2" },
          { items: [op("e")] },
        ),
        3,
      );

      expect(logMock).toHaveBeenCalledWith(
        "generic-coin-framework",
        expect.stringContaining("bound"),
        expect.objectContaining({ maxOperations: 3, collected: 4 }),
      );
    });

    it("does not log when the stream ends naturally before the bound is reached", async () => {
      await paginateOperations(pages({ items: [op("a")] }), 1000);

      expect(logMock).not.toHaveBeenCalled();
    });

    it("behaves identically to an unbounded walk when the bound is undefined", async () => {
      const withoutBound = await paginateOperations(
        pages({ items: [op("a")], next: "c1" }, { items: [op("b")] }),
      );
      calls = [];
      const withUndefinedBound = await paginateOperations(
        pages({ items: [op("a")], next: "c1" }, { items: [op("b")] }),
        undefined,
      );

      expect(withUndefinedBound.map(o => o.tx.hash)).toEqual(withoutBound.map(o => o.tx.hash));
      expect(logMock).not.toHaveBeenCalled();
    });

    it("changes nothing when the bound is larger than the whole stream", async () => {
      const items = await paginateOperations(
        pages({ items: [op("a")], next: "c1" }, { items: [op("b")] }),
        1000,
      );

      expect(items.map(o => o.tx.hash)).toEqual(["a", "b"]);
      expect(calls).toEqual([undefined, "c1"]);
      expect(logMock).not.toHaveBeenCalled();
    });
  });
});

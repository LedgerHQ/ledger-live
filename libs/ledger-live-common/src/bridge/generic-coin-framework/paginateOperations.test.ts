import { log } from "@ledgerhq/logs";
import type { Operation, Page } from "@ledgerhq/coin-module-framework/api/types";
import { paginateOperations, PAGE_BUDGET, EMPTY_PAGE_BUDGET } from "./paginateOperations";

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
  it("continues past an empty page as long as the cursor still advances (coin-stellar's and coin-xrp's shape: a filtered page can legitimately be empty)", async () => {
    const items = await paginateOperations(
      pages(
        { items: [op("a")], next: "c1" },
        // Empty on purpose -- a page filtered down to nothing for this address, with a truthy,
        // advancing cursor: not an end of stream. Stopping here is exactly the 4%-truncation bug.
        { items: [], next: "c2" },
        { items: [op("b")], next: "c3" },
        { items: [op("c")] },
      ),
    );

    expect(items.map(o => o.tx.hash)).toEqual(["a", "b", "c"]);
    expect(calls).toEqual([undefined, "c1", "c2", "c3"]);
  });

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

  it("throws when the cursor does not advance, rather than returning the fragment collected so far", async () => {
    const walk = paginateOperations(
      pages({ items: [op("a")], next: "c1" }, { items: [op("b")], next: "c1" }),
    );

    // Rejects -- never resolves with the two operations collected before the stall.
    await expect(walk).rejects.toThrow(/cursor c1 was served twice/);
    expect(calls).toEqual([undefined, "c1"]);
  });

  it("throws on a cursor cycle longer than one page, which no equality check would catch, rather than returning a fragment", async () => {
    const walk = paginateOperations(
      pages(
        { items: [op("a")], next: "c1" },
        { items: [op("b")], next: "c2" },
        { items: [op("c")], next: "c1" },
      ),
    );

    await expect(walk).rejects.toThrow(/cursor c1 was served twice/);
    expect(calls).toEqual([undefined, "c1", "c2"]);
  });

  it("throws on a vechain-shaped module (an empty page repeating the same truthy cursor), rather than returning a fragment", async () => {
    const walk = paginateOperations(
      pages({ items: [op("a")], next: "c1" }, { items: [], next: "c1" }),
    );

    await expect(walk).rejects.toThrow(/cursor c1 was served twice/);
    // One extra request beyond the last page with data: the empty page no longer stops the walk
    // by itself, so this module is caught by the non-advancing guard on the very next fetch.
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
    it("resolves with the collected operations when the bound stops the walk -- an intended truncation, not an error -- without fetching further pages or trimming that page", async () => {
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

  describe("page budget", () => {
    it("throws when a module pages forever with strictly advancing cursors and non-empty pages, rather than returning a fragment, and logs that the budget -- not a natural end -- is what stopped it", async () => {
      let fetches = 0;
      const walk = paginateOperations(async () => {
        fetches++;
        return { items: [op(`op${fetches}`)], next: `c${fetches}` };
      });

      // Rejects -- never resolves with the PAGE_BUDGET operations collected before the safety net.
      await expect(walk).rejects.toThrow(
        new RegExp(
          `page budget \\(${PAGE_BUDGET}\\) reached after collecting ${PAGE_BUDGET} operations`,
        ),
      );
      expect(fetches).toBe(PAGE_BUDGET);
      expect(logMock).toHaveBeenCalledWith(
        "generic-coin-framework",
        expect.stringContaining("budget"),
        expect.objectContaining({ pagesFetched: PAGE_BUDGET, collected: PAGE_BUDGET }),
      );
    });

    it("does not fire on a walk shorter than the budget", async () => {
      const items = await paginateOperations(
        pages({ items: [op("a")], next: "c1" }, { items: [op("b")] }),
      );

      expect(items.map(o => o.tx.hash)).toEqual(["a", "b"]);
      expect(logMock).not.toHaveBeenCalled();
    });

    it("does not apply to a bounded walk: reaching the bound through more pages than the budget is legitimate, not a failure", async () => {
      // The regression this guard's sizing used to cause. A module that honours a page size of 10
      // needs 2 000 pages to reach a 20 000-operation bound -- twice the page budget. Counting pages
      // for a bounded caller turned a well-behaved module into a failed sync, and the bound it was
      // asked to enforce became unreachable.
      const pageSize = 10;
      const maxOperations = 20_000;
      let fetches = 0;
      const items = await paginateOperations(async () => {
        fetches++;
        return {
          items: Array.from({ length: pageSize }, (_, i) => op(`p${fetches}-${i}`)),
          next: `c${fetches}`,
        };
      }, maxOperations);

      expect(items).toHaveLength(maxOperations);
      expect(fetches).toBeGreaterThan(PAGE_BUDGET);
      expect(logMock).toHaveBeenCalledWith(
        "generic-coin-framework",
        expect.stringContaining("operation-history bound reached"),
        expect.objectContaining({ maxOperations, collected: maxOperations }),
      );
    });
  });

  describe("empty-page budget", () => {
    it("throws when a module advances its cursor forever without ever returning an operation, which no operation bound can stop", async () => {
      let fetches = 0;
      const walk = paginateOperations(async () => {
        fetches++;
        return { items: [], next: `c${fetches}` };
      }, 5_000);

      await expect(walk).rejects.toThrow(
        new RegExp(
          `${EMPTY_PAGE_BUDGET} consecutive empty pages -- the module keeps advancing its cursor`,
        ),
      );
      expect(fetches).toBe(EMPTY_PAGE_BUDGET);
      expect(logMock).toHaveBeenCalledWith(
        "generic-coin-framework",
        expect.stringContaining("empty-page budget reached"),
        expect.objectContaining({
          consecutiveEmptyPages: EMPTY_PAGE_BUDGET,
          collected: 0,
        }),
      );
    });

    it("counts a run, not a total: any page that yields an operation resets it, so it can never fire on a walk making progress", async () => {
      // Alternating productive and empty pages forever -- far more empty pages in total than the
      // budget, never that many in a row. The bound is what must stop this walk.
      const maxOperations = 5;
      let fetches = 0;
      const items = await paginateOperations(async () => {
        fetches++;
        return fetches % 2 === 1
          ? { items: [op(`op${fetches}`)], next: `c${fetches}` }
          : { items: [], next: `c${fetches}` };
      }, maxOperations);

      expect(items).toHaveLength(maxOperations);
      expect(logMock).toHaveBeenCalledWith(
        "generic-coin-framework",
        expect.stringContaining("operation-history bound reached"),
        expect.objectContaining({ maxOperations, collected: maxOperations }),
      );
    });
  });
});

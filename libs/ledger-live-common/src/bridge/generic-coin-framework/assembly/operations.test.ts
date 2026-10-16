import type { Operation as CoreOperation } from "@ledgerhq/coin-module-framework/api/types";
import {
  isIncomingCoreOp,
  isListedCoreOp,
  isNftCoreOp,
  listedOperations,
  walkListing,
} from "./operations";

const coreOp = (
  id: string,
  date: string,
  fields: Partial<CoreOperation> & { failed?: boolean } = {},
): CoreOperation => {
  const { failed = false, ...rest } = fields;
  return {
    id,
    type: "OUT",
    senders: [],
    recipients: [],
    value: 0n,
    asset: { type: "native" },
    tx: {
      hash: id.split("-")[0],
      block: { height: 1, hash: "b", time: new Date(date) },
      fees: 0n,
      date: new Date(date),
      failed,
    },
    ...rest,
  };
};

describe("isNftCoreOp", () => {
  it("tells an NFT transfer by the module's ledgerOpType", () => {
    expect(isNftCoreOp(coreOp("a", "2026-01-01", { details: { ledgerOpType: "NFT_IN" } }))).toBe(
      true,
    );
    expect(isNftCoreOp(coreOp("a", "2026-01-01", { details: { ledgerOpType: "NFT_OUT" } }))).toBe(
      true,
    );
    expect(isNftCoreOp(coreOp("a", "2026-01-01", { details: { ledgerOpType: "IN" } }))).toBe(false);
    expect(isNftCoreOp(coreOp("a", "2026-01-01", { details: { ledgerOpType: 1 } }))).toBe(false);
    expect(isNftCoreOp(coreOp("a", "2026-01-01"))).toBe(false);
  });
});

describe("isIncomingCoreOp", () => {
  it("reads the module's ledgerOpType first, the operation type otherwise", () => {
    expect(isIncomingCoreOp(coreOp("a", "2026-01-01", { type: "IN" }))).toBe(true);
    expect(
      isIncomingCoreOp(coreOp("a", "2026-01-01", { type: "OUT", details: { ledgerOpType: "IN" } })),
    ).toBe(true);
    expect(
      isIncomingCoreOp(coreOp("a", "2026-01-01", { type: "IN", details: { ledgerOpType: "OUT" } })),
    ).toBe(false);
    expect(
      isIncomingCoreOp(coreOp("a", "2026-01-01", { type: "IN", details: { ledgerOpType: 3 } })),
    ).toBe(true);
  });
});

describe("listedOperations", () => {
  it("leaves out NFT transfers and failed incoming operations, keeping failed sends", () => {
    const listed = listedOperations([
      coreOp("nft", "2026-01-03", { details: { ledgerOpType: "NFT_IN" } }),
      coreOp("failed-in", "2026-01-03", { type: "IN", failed: true }),
      coreOp("failed-token-in", "2026-01-03", { details: { ledgerOpType: "IN" }, failed: true }),
      coreOp("failed-out", "2026-01-02", { failed: true }),
      coreOp("in", "2026-01-01", { type: "IN" }),
    ]);

    expect(listed.map(op => op.id)).toEqual(["failed-out", "in"]);
  });

  it("orders newest first whatever the listing order", () => {
    const listed = listedOperations([
      coreOp("old", "2026-01-01"),
      coreOp("new", "2026-01-03"),
      coreOp("mid", "2026-01-02"),
    ]);

    expect(listed.map(op => op.id)).toEqual(["new", "mid", "old"]);
  });

  it("orders operations sharing a date by id, numerically (one order on both paths)", () => {
    const listed = listedOperations([
      coreOp("h-OUT-10", "2026-01-01"),
      coreOp("h-OUT-2", "2026-01-01"),
      coreOp("h-IN", "2026-01-01"),
      coreOp("h-OUT-1", "2026-01-01"),
    ]);

    expect(listed.map(op => op.id)).toEqual(["h-IN", "h-OUT-1", "h-OUT-2", "h-OUT-10"]);
  });

  it("orders by id an operation without a date, and keeps the listing order without an id", () => {
    const undated = (id: string) => {
      const op = coreOp(id, "2026-01-01");
      return { ...op, tx: { ...op.tx, date: undefined } } as unknown as CoreOperation;
    };
    const anonymous = (date: string) =>
      ({ ...coreOp("x", date), id: undefined }) as unknown as CoreOperation;

    expect(listedOperations([undated("b"), undated("a")]).map(op => op.id)).toEqual(["a", "b"]);
    expect(listedOperations([coreOp("b", "2026-01-02"), undated("a")]).map(op => op.id)).toEqual([
      "a",
      "b",
    ]);
    const [first, second] = [anonymous("2026-01-01"), anonymous("2026-01-01")];
    expect(listedOperations([first, second])).toEqual([first, second]);
    expect(listedOperations([second, first])).toEqual([second, first]);
  });

  it("keeps the listing order of operations sharing a date and an id", () => {
    const native = coreOp("h-OUT", "2026-01-01", { asset: { type: "native" } });
    const token = coreOp("h-OUT", "2026-01-01", {
      asset: { type: "erc20", assetReference: "0xtoken" },
    });

    expect(listedOperations([native, token])).toEqual([native, token]);
    expect(listedOperations([token, native])).toEqual([token, native]);
  });
});

describe("isListedCoreOp", () => {
  it("keeps every operation but an NFT transfer and a failed incoming one", () => {
    expect(isListedCoreOp(coreOp("a", "2026-01-01"))).toBe(true);
    expect(isListedCoreOp(coreOp("a", "2026-01-01", { failed: true }))).toBe(true);
    expect(isListedCoreOp(coreOp("a", "2026-01-01", { type: "IN", failed: true }))).toBe(false);
    expect(
      isListedCoreOp(coreOp("a", "2026-01-01", { details: { ledgerOpType: "NFT_OUT" } })),
    ).toBe(false);
  });
});

describe("walkListing", () => {
  const atHeight = (
    id: string,
    height: number,
    fields: Partial<CoreOperation> & { failed?: boolean } = {},
  ) => {
    const op = coreOp(id, `2026-01-${String(height).padStart(2, "0")}`, fields);
    return { ...op, tx: { ...op.tx, block: { ...op.tx.block, height } } };
  };

  it("lists from the height asked, newest first, sending no limit without a page size", async () => {
    const list = jest.fn(async () => ({ items: [atHeight("b", 2), atHeight("a", 1)] }));

    const walked = await walkListing(list, 1, { maxOperations: undefined, pageSize: undefined });

    expect(list).toHaveBeenCalledWith({ minHeight: 1, cursor: undefined, order: "desc" });
    expect(walked).toEqual({ items: [atHeight("b", 2), atHeight("a", 1)], bounded: false });
  });

  it("sends the page size as limit, and drops what a sync leaves out before the bound counts it", async () => {
    const list = jest
      .fn()
      .mockResolvedValueOnce({
        items: [atHeight("failed-in", 9, { type: "IN", failed: true }), atHeight("c", 8)],
        next: "c1",
      })
      .mockResolvedValueOnce({ items: [atHeight("b", 7), atHeight("a", 6)], next: "c2" });

    const walked = await walkListing(list, 0, { maxOperations: 2, pageSize: 2 });

    expect(list).toHaveBeenNthCalledWith(2, {
      minHeight: 0,
      cursor: "c1",
      order: "desc",
      limit: 2,
    });
    // The bound stopped the walk on the second page, the lowest block of it dropped.
    expect(walked).toEqual({ items: [atHeight("c", 8), atHeight("b", 7)], bounded: true });
  });
});

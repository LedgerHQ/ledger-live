import BigNumber from "bignumber.js";
import type { Operation as LegacyOperation } from "@ledgerhq/types-live";
import { getLastBlockHeight, getOperations, getTokenOperations } from "../../network";
import { listOperations } from "./listOperations";

jest.mock("../../network", () => ({
  getLastBlockHeight: jest.fn(),
  getOperations: jest.fn(),
  getTokenOperations: jest.fn(),
}));

const ADDRESS = "0x0fe6688548f0C303932bB197B0A96034f1d74dba";

function makeLegacyOp(overrides: Partial<LegacyOperation> = {}): LegacyOperation {
  return {
    id: "op1",
    hash: "0xtx1",
    type: "OUT",
    value: new BigNumber("1000000000000000000"),
    fee: new BigNumber("21000000000000000"),
    senders: [ADDRESS],
    recipients: ["0xrecipient"],
    blockHeight: 100,
    blockHash: "0xblock",
    accountId: ADDRESS,
    date: new Date("2024-01-01T00:00:00Z"),
    extra: {},
    ...overrides,
  } as unknown as LegacyOperation;
}

describe("listOperations", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("merges VET and VTHO operations, both asset paths present", async () => {
    jest.mocked(getLastBlockHeight).mockResolvedValueOnce(200);
    jest.mocked(getOperations).mockResolvedValueOnce([makeLegacyOp({ id: "vet-op", type: "IN" })]);
    jest
      .mocked(getTokenOperations)
      .mockResolvedValueOnce([makeLegacyOp({ id: "vtho-op", type: "IN" })]);

    const page = await listOperations(ADDRESS, { minHeight: 0 });

    expect(page.items).toHaveLength(2);
    expect(page.items.find(op => op.id === "vet-op")?.asset).toEqual({
      type: "native",
      name: "VET",
    });
    expect(page.items.find(op => op.id === "vtho-op")?.asset.type).not.toBe("native");
    expect(page.items.find(op => op.id === "vet-op")?.details?.ledgerOpType).toBe("IN");
    expect(page.items.find(op => op.id === "vtho-op")?.details?.ledgerOpType).toBe("IN");
  });

  it("merges VET + VTHO without duplicate operations and resumes one block past the head", async () => {
    jest.mocked(getLastBlockHeight).mockResolvedValueOnce(300);
    jest
      .mocked(getOperations)
      .mockResolvedValueOnce([
        makeLegacyOp({ id: "vet-1", date: new Date("2024-01-03T00:00:00Z") }),
        makeLegacyOp({ id: "vet-2", date: new Date("2024-01-01T00:00:00Z") }),
      ]);
    jest
      .mocked(getTokenOperations)
      .mockResolvedValueOnce([
        makeLegacyOp({ id: "vtho-1", date: new Date("2024-01-02T00:00:00Z") }),
      ]);

    const page = await listOperations(ADDRESS, { minHeight: 0 });

    const ids = page.items.map(op => op.id);
    expect(ids).toHaveLength(3);
    expect(new Set(ids).size).toBe(ids.length); // no duplicates across the merged VET + VTHO streams
    expect(ids).toEqual(["vet-1", "vtho-1", "vet-2"]); // merged, sorted by date desc
    // Cursor resumes at head + 1 so the boundary block is never re-scanned into a duplicate next page.
    expect(page.next).toBe("301");
  });

  it("attaches no fee to a native VET operation (VeChain gas is VTHO, avoids inflating the debit)", async () => {
    jest.mocked(getLastBlockHeight).mockResolvedValueOnce(200);
    const outOp = makeLegacyOp({
      type: "OUT",
      value: new BigNumber("1000000000000000000"),
      fee: new BigNumber("21000000000000000"),
    });
    jest.mocked(getOperations).mockResolvedValueOnce([outOp]);
    jest.mocked(getTokenOperations).mockResolvedValueOnce([]);

    const page = await listOperations(ADDRESS, { minHeight: 0 });

    expect(page.items[0].value).toBe(BigInt("1000000000000000000"));
    expect(page.items[0].tx.fees).toBe(0n);
  });

  it("keeps the VTHO gas as the fee on a VTHO (token) operation", async () => {
    jest.mocked(getLastBlockHeight).mockResolvedValueOnce(200);
    const vthoOut = makeLegacyOp({
      type: "OUT",
      value: new BigNumber("5000000000000000000"),
      fee: new BigNumber("21000000000000000"),
    });
    jest.mocked(getOperations).mockResolvedValueOnce([]);
    jest.mocked(getTokenOperations).mockResolvedValueOnce([vthoOut]);

    const page = await listOperations(ADDRESS, { minHeight: 0 });

    expect(page.items[0].value).toBe(BigInt("5000000000000000000"));
    expect(page.items[0].tx.fees).toBe(BigInt("21000000000000000"));
  });

  it("returns an empty page (with a resumable cursor) when the range is already exhausted", async () => {
    jest.mocked(getLastBlockHeight).mockResolvedValueOnce(50);

    const page = await listOperations(ADDRESS, { minHeight: 0, cursor: "100" });

    expect(page.items).toEqual([]);
    expect(getOperations).not.toHaveBeenCalled();
    expect(page.next).toBe("100");
  });

  it("propagates an error from the underlying network call", async () => {
    jest.mocked(getLastBlockHeight).mockResolvedValueOnce(200);
    jest.mocked(getOperations).mockRejectedValueOnce(new Error("network down"));
    jest.mocked(getTokenOperations).mockResolvedValueOnce([]);

    await expect(listOperations(ADDRESS, { minHeight: 0 })).rejects.toThrow("network down");
  });
});

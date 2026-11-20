import BigNumber from "bignumber.js";
import type { Operation as LegacyOperation } from "@ledgerhq/types-live";
import { VTHO_ADDRESS } from "@vechain/sdk-core";
import { getLastBlockHeight, getOperations, getTokenOperations } from "../../network";
import { getTransactionFee } from "../../network/getFees";
import { createMockVechainContext } from "../../test/context";
import { listOperations } from "./listOperations";

jest.mock("../../network", () => ({
  getLastBlockHeight: jest.fn(),
  getOperations: jest.fn(),
  getTokenOperations: jest.fn(),
}));
jest.mock("../../network/getFees", () => ({ getTransactionFee: jest.fn() }));

const ADDRESS = "0x0fe6688548f0C303932bB197B0A96034f1d74dba";
const PAID = new BigNumber("21000000000000000");
const context = createMockVechainContext();

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
  beforeEach(() => {
    jest.mocked(getTransactionFee).mockResolvedValue({ paid: PAID, payer: ADDRESS });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("merges VET and VTHO operations, both asset paths present", async () => {
    jest.mocked(getLastBlockHeight).mockResolvedValueOnce(200);
    jest.mocked(getOperations).mockResolvedValueOnce([makeLegacyOp({ id: "vet-op", type: "IN" })]);
    jest
      .mocked(getTokenOperations)
      .mockResolvedValueOnce([makeLegacyOp({ id: "vtho-op", type: "IN" })]);

    const page = await listOperations(context, ADDRESS, { minHeight: 0 });

    expect(page.items).toHaveLength(2);
    expect(page.items.find(op => op.id === "vet-op")?.asset).toEqual({ type: "native" });
    expect(page.items.find(op => op.id === "vtho-op")?.asset.type).not.toBe("native");
    expect(page.items.find(op => op.id === "vet-op")?.details?.ledgerOpType).toBe("IN");
    expect(page.items.find(op => op.id === "vtho-op")?.details?.ledgerOpType).toBe("IN");
  });

  it("merges VET + VTHO without duplicate operations", async () => {
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

    const page = await listOperations(context, ADDRESS, { minHeight: 0 });

    const ids = page.items.map(op => op.id);
    expect(ids).toHaveLength(3);
    expect(new Set(ids).size).toBe(ids.length); // no duplicates across the merged VET + VTHO streams
    expect(ids).toEqual(["vet-1", "vtho-1", "vet-2"]); // merged, sorted by date desc
  });

  it("does not advertise a next page: one call already covers everything up to the head", async () => {
    jest.mocked(getLastBlockHeight).mockResolvedValueOnce(300);
    jest.mocked(getOperations).mockResolvedValueOnce([makeLegacyOp({ id: "vet-1" })]);
    jest.mocked(getTokenOperations).mockResolvedValueOnce([]);

    const page = await listOperations(context, ADDRESS, { minHeight: 0 });

    // getOperations/getTokenOperations exhaust [startAt, head] within this call, so the page is
    // complete. A cursor here would point at nothing, and a client that pages until `next` is
    // falsy would keep asking for the page after it, forever.
    expect(page.next).toBeUndefined();
  });

  it("reports the VTHO fee and its payer on the VET and VTHO operations of a transaction", async () => {
    jest.mocked(getLastBlockHeight).mockResolvedValueOnce(200);
    jest
      .mocked(getOperations)
      .mockResolvedValueOnce([
        makeLegacyOp({ id: "vet", value: new BigNumber("1000000000000000000") }),
      ]);
    jest
      .mocked(getTokenOperations)
      .mockResolvedValueOnce([
        makeLegacyOp({ id: "vtho", value: new BigNumber("5000000000000000000") }),
      ]);

    const page = await listOperations(context, ADDRESS, { minHeight: 0 });

    const vtho = { type: "token", assetReference: VTHO_ADDRESS };
    expect(page.items.map(({ id, value, tx }) => ({ id, value, ...tx }))).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "vet",
          value: BigInt("1000000000000000000"),
          fees: BigInt(PAID.toFixed()),
          feesAsset: vtho,
          feesPayer: ADDRESS,
        }),
        expect.objectContaining({
          id: "vtho",
          value: BigInt("5000000000000000000"),
          fees: BigInt(PAID.toFixed()),
          feesAsset: vtho,
          feesPayer: ADDRESS,
        }),
      ]),
    );
  });

  it("reports the receipt's payer when the account did not pay the fee", async () => {
    jest.mocked(getLastBlockHeight).mockResolvedValueOnce(200);
    jest.mocked(getTransactionFee).mockResolvedValue({ paid: PAID, payer: "0xsponsor" });
    jest.mocked(getOperations).mockResolvedValueOnce([]);
    jest
      .mocked(getTokenOperations)
      .mockResolvedValueOnce([
        makeLegacyOp({ type: "IN", senders: ["0xsender"], recipients: [ADDRESS] }),
      ]);

    const page = await listOperations(context, ADDRESS, { minHeight: 0 });

    expect(page.items[0].tx.feesPayer).toBe("0xsponsor");
  });

  it("reports no payer when the receipt names none", async () => {
    jest.mocked(getLastBlockHeight).mockResolvedValueOnce(200);
    jest.mocked(getTransactionFee).mockResolvedValue({ paid: PAID, payer: undefined });
    jest.mocked(getOperations).mockResolvedValueOnce([makeLegacyOp()]);
    jest.mocked(getTokenOperations).mockResolvedValueOnce([]);

    const page = await listOperations(context, ADDRESS, { minHeight: 0 });

    expect(page.items[0].tx).not.toHaveProperty("feesPayer");
  });

  it("returns an empty page without a cursor when the range is already exhausted", async () => {
    jest.mocked(getLastBlockHeight).mockResolvedValueOnce(50);

    const page = await listOperations(context, ADDRESS, { minHeight: 0, cursor: "100" });

    expect(page.items).toEqual([]);
    expect(getOperations).not.toHaveBeenCalled();
    // An empty page advertising another page is the loop clients cannot escape.
    expect(page.next).toBeUndefined();
  });

  it("sorts oldest first when order is asc", async () => {
    jest.mocked(getLastBlockHeight).mockResolvedValueOnce(300);
    jest
      .mocked(getOperations)
      .mockResolvedValueOnce([
        makeLegacyOp({ id: "newest", date: new Date("2024-01-03T00:00:00Z") }),
        makeLegacyOp({ id: "oldest", date: new Date("2024-01-01T00:00:00Z") }),
      ]);
    jest
      .mocked(getTokenOperations)
      .mockResolvedValueOnce([
        makeLegacyOp({ id: "middle", date: new Date("2024-01-02T00:00:00Z") }),
      ]);

    const page = await listOperations(context, ADDRESS, { minHeight: 0, order: "asc" });

    expect(page.items.map(op => op.id)).toEqual(["oldest", "middle", "newest"]);
  });

  it("sorts newest first when order is desc", async () => {
    jest.mocked(getLastBlockHeight).mockResolvedValueOnce(300);
    jest
      .mocked(getOperations)
      .mockResolvedValueOnce([
        makeLegacyOp({ id: "oldest", date: new Date("2024-01-01T00:00:00Z") }),
        makeLegacyOp({ id: "newest", date: new Date("2024-01-03T00:00:00Z") }),
      ]);
    jest
      .mocked(getTokenOperations)
      .mockResolvedValueOnce([
        makeLegacyOp({ id: "middle", date: new Date("2024-01-02T00:00:00Z") }),
      ]);

    const page = await listOperations(context, ADDRESS, { minHeight: 0, order: "desc" });

    expect(page.items.map(op => op.id)).toEqual(["newest", "middle", "oldest"]);
  });

  it("propagates an error from the underlying network call", async () => {
    jest.mocked(getLastBlockHeight).mockResolvedValueOnce(200);
    jest.mocked(getOperations).mockRejectedValueOnce(new Error("network down"));
    jest.mocked(getTokenOperations).mockResolvedValueOnce([]);

    await expect(listOperations(context, ADDRESS, { minHeight: 0 })).rejects.toThrow(
      "network down",
    );
  });
});

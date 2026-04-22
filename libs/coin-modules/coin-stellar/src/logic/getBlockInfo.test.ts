import { getBlockInfo } from "./getBlockInfo";
import * as horizon from "../network/horizon";

jest.mock("../network/horizon", () => ({
  ...jest.requireActual<typeof import("../network/horizon")>("../network/horizon"),
  fetchLedgerRecord: jest.fn(),
}));

const fetchLedgerRecordMock = horizon.fetchLedgerRecord as jest.MockedFunction<
  typeof horizon.fetchLedgerRecord
>;

describe("getBlockInfo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns block info with parent when height > 1", async () => {
    fetchLedgerRecordMock.mockImplementation(async (seq: number) =>
      ({
        sequence: seq,
        hash: `hash-${seq}`,
        closed_at: `2020-01-0${seq}T00:00:00Z`,
      }) as unknown as Awaited<ReturnType<typeof horizon.fetchLedgerRecord>>,
    );

    const result = await getBlockInfo(5);

    expect(fetchLedgerRecordMock).toHaveBeenCalledWith(5);
    expect(fetchLedgerRecordMock).toHaveBeenCalledWith(4);
    expect(result).toEqual({
      height: 5,
      hash: "hash-5",
      time: new Date("2020-01-05T00:00:00Z"),
      parent: { height: 4, hash: "hash-4" },
    });
  });

  it("omits parent for genesis ledger sequence 1", async () => {
    fetchLedgerRecordMock.mockResolvedValue({
      sequence: 1,
      hash: "genesis-hash",
      closed_at: "2015-09-30T00:00:00Z",
    } as unknown as Awaited<ReturnType<typeof horizon.fetchLedgerRecord>>);

    const result = await getBlockInfo(1);

    expect(fetchLedgerRecordMock).toHaveBeenCalledTimes(1);
    expect(fetchLedgerRecordMock).toHaveBeenCalledWith(1);
    expect(result.parent).toBeUndefined();
    expect(result.height).toBe(1);
  });

  describe("height validation", () => {
    it("rejects height 0", async () => {
      await expect(getBlockInfo(0)).rejects.toThrow(
        "getBlockInfo: height must be a positive integer, got 0",
      );
    });

    it("rejects negative height", async () => {
      await expect(getBlockInfo(-3)).rejects.toThrow(
        "getBlockInfo: height must be a positive integer, got -3",
      );
    });

    it("rejects non-integer height", async () => {
      await expect(getBlockInfo(3.5)).rejects.toThrow(
        "getBlockInfo: height must be a positive integer, got 3.5",
      );
    });

    it("rejects NaN", async () => {
      await expect(getBlockInfo(Number.NaN)).rejects.toThrow(
        "getBlockInfo: height must be a positive integer, got NaN",
      );
    });

    it("rejects unsafe integer", async () => {
      await expect(getBlockInfo(Number.MAX_SAFE_INTEGER + 1)).rejects.toThrow(
        "getBlockInfo: height must be a positive integer",
      );
    });

    it("rejects Infinity", async () => {
      await expect(getBlockInfo(Number.POSITIVE_INFINITY)).rejects.toThrow(
        "getBlockInfo: height must be a positive integer, got Infinity",
      );
    });
  });
});

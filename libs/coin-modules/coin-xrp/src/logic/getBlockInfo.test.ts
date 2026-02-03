import { getBlockInfo } from "./getBlockInfo";

const mockGetLedgerInfoByIndex = jest.fn();
jest.mock("../network", () => ({
  getLedgerInfoByIndex: (index: number) => mockGetLedgerInfoByIndex(index),
}));

describe("getBlockInfo", () => {
  afterEach(() => {
    mockGetLedgerInfoByIndex.mockClear();
  });

  it("returns block info with correct height, hash, time and parent", async () => {
    // Given
    const blockIndex = 12345;
    const mockLedgerHash = "ABC123DEF456";
    const mockParentHash = "PARENT789XYZ";
    const mockCloseTimeIso = "2024-06-01T12:34:56Z";
    mockGetLedgerInfoByIndex.mockResolvedValue({
      ledger_index: blockIndex,
      ledger: {
        ledger_hash: mockLedgerHash,
        parent_hash: mockParentHash,
        close_time_iso: mockCloseTimeIso,
      },
    });

    // When
    const result = await getBlockInfo(blockIndex);

    // Then
    expect(mockGetLedgerInfoByIndex).toHaveBeenCalledWith(blockIndex);
    expect(result).toEqual({
      height: blockIndex,
      hash: mockLedgerHash,
      time: new Date(mockCloseTimeIso),
      parent: {
        height: blockIndex - 1,
        hash: mockParentHash,
      },
    });
  });

  it("returns early with only height for index <= 0", async () => {
    // When
    const resultZero = await getBlockInfo(0);
    const resultNegative = await getBlockInfo(-1);
    const epoch = new Date(0);

    // Then
    expect(mockGetLedgerInfoByIndex).not.toHaveBeenCalled();
    expect(resultZero).toEqual({ height: 0, hash: "", time: epoch });
    expect(resultNegative).toEqual({ height: -1, hash: "", time: epoch });
  });

  it("correctly calculates parent height as current height minus one", async () => {
    // Given
    const blockIndex = 100;
    mockGetLedgerInfoByIndex.mockResolvedValue({
      ledger_index: blockIndex,
      ledger: {
        ledger_hash: "CURRENT_HASH",
        parent_hash: "PARENT_HASH",
        close_time_iso: "2024-06-01T12:00:00Z",
      },
    });

    // When
    const result = await getBlockInfo(blockIndex);

    // Then
    expect(result.parent).toEqual({
      height: 99,
      hash: "PARENT_HASH",
    });
  });

  it("parses close_time_iso into a Date object", async () => {
    // Given
    const blockIndex = 12345;
    const isoDate = "2024-12-25T10:30:00.000Z";
    mockGetLedgerInfoByIndex.mockResolvedValue({
      ledger_index: blockIndex,
      ledger: {
        ledger_hash: "HASH",
        parent_hash: "PARENT",
        close_time_iso: isoDate,
      },
    });

    // When
    const result = await getBlockInfo(blockIndex);

    // Then
    expect(result.time).toBeInstanceOf(Date);
    expect(result.time?.toISOString()).toBe(isoDate);
  });

  it("propagates network errors from getLedgerInfoByIndex", async () => {
    // Given
    mockGetLedgerInfoByIndex.mockRejectedValue(new Error("Network error"));

    // When & Then
    await expect(getBlockInfo(12345)).rejects.toThrow("Network error");
  });
});

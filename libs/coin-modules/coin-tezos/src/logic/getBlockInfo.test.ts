import tzktApi from "../network/tzkt";
import { getBlockInfo } from "./getBlockInfo";

const mockGetBlockByLevel = jest.spyOn(tzktApi, "getBlockByLevel");

describe("getBlockInfo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("maps level, hash, timestamp, and parent from the TzKT block response", async () => {
    // Given
    const level = 7_000_000;
    mockGetBlockByLevel.mockResolvedValueOnce({
      level,
      hash: "BLockHashABC123",
      timestamp: "2024-06-15T10:30:00Z",
    } as any);
    mockGetBlockByLevel.mockResolvedValueOnce({
      level: level - 1,
      hash: "BLockHashParent",
      timestamp: "2024-06-15T10:29:52Z",
    } as any);

    // When
    const result = await getBlockInfo(level);

    // Then
    expect(mockGetBlockByLevel).toHaveBeenCalledTimes(2);
    expect(mockGetBlockByLevel).toHaveBeenCalledWith(level);
    expect(mockGetBlockByLevel).toHaveBeenCalledWith(level - 1);
    expect(result).toEqual({
      height: level,
      hash: "BLockHashABC123",
      time: new Date("2024-06-15T10:30:00Z"),
      parent: { height: level - 1, hash: "BLockHashParent" },
    });
  });

  it("parses the timestamp string into a proper Date instance", async () => {
    // Given
    const isoDate = "2025-01-01T00:00:00.000Z";
    mockGetBlockByLevel.mockResolvedValue({
      level: 8_000_000,
      hash: "BLockHashXYZ",
      timestamp: isoDate,
    } as any);

    // When
    const result = await getBlockInfo(8_000_000);

    // Then
    expect(result.time).toBeInstanceOf(Date);
    expect(result.time.toISOString()).toBe(isoDate);
  });

  it("throws for height = 0 without calling the API", async () => {
    // When / Then
    await expect(getBlockInfo(0)).rejects.toThrow(
      "getBlockInfo: height must be a positive integer, got 0",
    );
    expect(mockGetBlockByLevel).not.toHaveBeenCalled();
  });

  it("throws for negative height without calling the API", async () => {
    // When / Then
    await expect(getBlockInfo(-5)).rejects.toThrow(
      "getBlockInfo: height must be a positive integer, got -5",
    );
    expect(mockGetBlockByLevel).not.toHaveBeenCalled();
  });

  it("includes parent from the predecessor block fetched in parallel", async () => {
    // Given – genesis-adjacent block: level 1 with level 0 as parent
    mockGetBlockByLevel.mockResolvedValueOnce({
      level: 1,
      hash: "BLBlock1",
      timestamp: "2018-06-30T16:07:40Z",
    } as any);
    mockGetBlockByLevel.mockResolvedValueOnce({
      level: 0,
      hash: "BLGenesis",
      timestamp: "2018-06-30T16:07:32Z",
    } as any);

    // When
    const result = await getBlockInfo(1);

    // Then
    expect(result.parent).toEqual({ height: 0, hash: "BLGenesis" });
  });

  it("propagates errors thrown by the network layer", async () => {
    // Given
    mockGetBlockByLevel.mockRejectedValue(new Error("TzKT unreachable"));

    // When / Then
    await expect(getBlockInfo(999_999)).rejects.toThrow("TzKT unreachable");
  });
});

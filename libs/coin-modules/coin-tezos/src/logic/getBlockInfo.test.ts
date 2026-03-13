import tzktApi from "../network/tzkt";
import { getBlockInfo } from "./getBlockInfo";

const mockGetBlockByLevel = jest.spyOn(tzktApi, "getBlockByLevel");

describe("getBlockInfo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("maps level, hash and timestamp from the TzKT block response", async () => {
    // Given
    const level = 7_000_000;
    mockGetBlockByLevel.mockResolvedValue({
      level,
      hash: "BLockHashABC123",
      timestamp: "2024-06-15T10:30:00Z",
    } as any);

    // When
    const result = await getBlockInfo(level);

    // Then
    expect(mockGetBlockByLevel).toHaveBeenCalledTimes(1);
    expect(mockGetBlockByLevel).toHaveBeenCalledWith(level);
    expect(result).toEqual({
      height: level,
      hash: "BLockHashABC123",
      time: new Date("2024-06-15T10:30:00Z"),
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

  it("returns sentinel value for height = 0 without calling the API", async () => {
    // When
    const result = await getBlockInfo(0);

    // Then
    expect(mockGetBlockByLevel).not.toHaveBeenCalled();
    expect(result).toEqual({ height: 0, hash: "", time: new Date(0) });
  });

  it("returns sentinel value for negative height without calling the API", async () => {
    // When
    const result = await getBlockInfo(-5);

    // Then
    expect(mockGetBlockByLevel).not.toHaveBeenCalled();
    expect(result).toEqual({ height: -5, hash: "", time: new Date(0) });
  });

  it("does not include a parent field (TzKT default response has no prevHash)", async () => {
    // Given
    mockGetBlockByLevel.mockResolvedValue({
      level: 1,
      hash: "BLGenesis",
      timestamp: "2018-06-30T16:07:32Z",
    } as any);

    // When
    const result = await getBlockInfo(1);

    // Then
    expect(result.parent).toBeUndefined();
  });

  it("propagates errors thrown by the network layer", async () => {
    // Given
    mockGetBlockByLevel.mockRejectedValue(new Error("TzKT unreachable"));

    // When / Then
    await expect(getBlockInfo(999_999)).rejects.toThrow("TzKT unreachable");
  });
});

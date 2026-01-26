import * as network from "../network";
import { getBlockInfo } from "./getBlockInfo";

jest.mock("../network");

describe("getBlockInfo", () => {
  const mockGetBlock = network.getBlock as jest.MockedFunction<typeof network.getBlock>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return block info with height, hash, and time", async () => {
    // Given
    const height = 12345678;
    const mockBlockData = {
      block: {
        rnd: height,
        ts: 1704067200, // 2024-01-01 00:00:00 UTC
        gh: "wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=",
      },
    };
    mockGetBlock.mockResolvedValue(mockBlockData);

    // When
    const result = await getBlockInfo(height);

    // Then
    expect(mockGetBlock).toHaveBeenCalledWith(height);
    expect(result).toEqual({
      height,
      hash: "wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=",
      time: new Date(1704067200000),
    });
  });

  it("should convert Unix timestamp to Date correctly", async () => {
    // Given
    const height = 100;
    const unixTimestamp = 1609459200; // 2021-01-01 00:00:00 UTC
    const mockBlockData = {
      block: {
        rnd: height,
        ts: unixTimestamp,
        gh: "testHash123",
      },
    };
    mockGetBlock.mockResolvedValue(mockBlockData);

    // When
    const result = await getBlockInfo(height);

    // Then
    expect(result.time).toEqual(new Date(unixTimestamp * 1000));
    expect(result.time.getTime()).toBe(unixTimestamp * 1000);
  });

  it("should handle errors from network layer", async () => {
    // Given
    const height = 999999999;
    const error = new Error("Block not found");
    mockGetBlock.mockRejectedValue(error);

    // When/Then
    await expect(getBlockInfo(height)).rejects.toThrow("Block not found");
    expect(mockGetBlock).toHaveBeenCalledWith(height);
  });
});

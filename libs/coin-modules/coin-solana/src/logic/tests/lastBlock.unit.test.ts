import type { ChainAPI } from "../../network";
import { lastBlock } from "../lastBlock";

const TEST_BLOCKHASH = "EEbZs6DmDyDjucyYbo3LwVJU7pQYuVopYcYTSEZXskW3";

describe("lastBlock", () => {
  const mockGetLatestBlockhash = jest.fn();
  const mockGetSlot = jest.fn();
  const mockGetBlockTime = jest.fn();

  const api = {
    getLatestBlockhash: mockGetLatestBlockhash,
    connection: {
      getSlot: mockGetSlot,
      getBlockTime: mockGetBlockTime,
    },
  } as unknown as ChainAPI;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return block info from slot", async () => {
    const blockTime = 1700000000;
    mockGetLatestBlockhash.mockResolvedValue({
      blockhash: TEST_BLOCKHASH,
      lastValidBlockHeight: 280064048,
    });
    mockGetSlot.mockResolvedValue(250000000);
    mockGetBlockTime.mockResolvedValue(blockTime);

    const result = await lastBlock(api);

    expect(result).toEqual({
      height: 250000000,
      hash: TEST_BLOCKHASH,
      time: new Date(blockTime * 1000),
    });
  });

  it("should use current date when blockTime is null", async () => {
    mockGetLatestBlockhash.mockResolvedValue({
      blockhash: TEST_BLOCKHASH,
      lastValidBlockHeight: 100,
    });
    mockGetSlot.mockResolvedValue(100);
    mockGetBlockTime.mockResolvedValue(null);

    const before = Date.now();
    const result = await lastBlock(api);
    const after = Date.now();

    expect(result.time.getTime()).toBeGreaterThanOrEqual(before);
    expect(result.time.getTime()).toBeLessThanOrEqual(after);
  });

  it("should propagate errors from getLatestBlockhash", async () => {
    mockGetLatestBlockhash.mockRejectedValue(new Error("RPC error"));

    await expect(lastBlock(api)).rejects.toThrow("RPC error");
  });

  it("should propagate errors from getSlot", async () => {
    mockGetLatestBlockhash.mockResolvedValue({
      blockhash: TEST_BLOCKHASH,
      lastValidBlockHeight: 100,
    });
    mockGetSlot.mockRejectedValue(new Error("Slot error"));

    await expect(lastBlock(api)).rejects.toThrow("Slot error");
  });

});

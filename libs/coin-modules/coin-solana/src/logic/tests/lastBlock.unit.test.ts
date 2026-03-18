/* eslint-disable @typescript-eslint/consistent-type-assertions */
import type { ChainAPI } from "../../network";
import { lastBlock } from "../lastBlock";

const TEST_BLOCKHASH = "EEbZs6DmDyDjucyYbo3LwVJU7pQYuVopYcYTSEZXskW3";

describe("lastBlock", () => {
  const mockGetLatestBlockhashAndContext = jest.fn();
  const mockGetBlockTime = jest.fn();

  const api = {
    connection: {
      getLatestBlockhashAndContext: mockGetLatestBlockhashAndContext,
      getBlockTime: mockGetBlockTime,
    },
  } as unknown as ChainAPI;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return block info from context slot", async () => {
    const blockTime = 1700000000;
    mockGetLatestBlockhashAndContext.mockResolvedValue({
      context: { slot: 250000000 },
      value: { blockhash: TEST_BLOCKHASH, lastValidBlockHeight: 280064048 },
    });
    mockGetBlockTime.mockResolvedValue(blockTime);

    const result = await lastBlock(api);

    expect(result).toEqual({
      height: 250000000,
      hash: TEST_BLOCKHASH,
      time: new Date(blockTime * 1000),
    });
  });

  it("should use current date when blockTime is null", async () => {
    mockGetLatestBlockhashAndContext.mockResolvedValue({
      context: { slot: 100 },
      value: { blockhash: TEST_BLOCKHASH, lastValidBlockHeight: 200 },
    });
    mockGetBlockTime.mockResolvedValue(null);

    const fixedNow = new Date("2024-01-01T00:00:00.000Z");
    jest.useFakeTimers().setSystemTime(fixedNow);

    try {
      const result = await lastBlock(api);

      expect(result.height).toBe(100);
      expect(result.hash).toBe(TEST_BLOCKHASH);
      expect(result.time.getTime()).toBe(fixedNow.getTime());
    } finally {
      jest.useRealTimers();
    }
  });

  it("should propagate errors from getLatestBlockhashAndContext", async () => {
    mockGetLatestBlockhashAndContext.mockRejectedValue(new Error("RPC error"));

    await expect(lastBlock(api)).rejects.toThrow("RPC error");
  });

  it("should propagate errors from getBlockTime", async () => {
    mockGetLatestBlockhashAndContext.mockResolvedValue({
      context: { slot: 250000000 },
      value: { blockhash: TEST_BLOCKHASH, lastValidBlockHeight: 280064048 },
    });
    mockGetBlockTime.mockRejectedValue(new Error("BlockTime error"));

    await expect(lastBlock(api)).rejects.toThrow("BlockTime error");
  });
});

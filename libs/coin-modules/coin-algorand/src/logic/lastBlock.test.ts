import * as network from "../network";
import { lastBlock } from "./lastBlock";

jest.mock("../network");

const mockGetTransactionParams = network.getTransactionParams as jest.MockedFunction<
  typeof network.getTransactionParams
>;
const mockGetBlock = network.getBlock as jest.MockedFunction<typeof network.getBlock>;

describe("lastBlock", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return the last round as block height with hash and time", async () => {
    mockGetTransactionParams.mockResolvedValue({
      fee: 0,
      minFee: 1000,
      firstRound: 1000,
      lastRound: 50000000,
      genesisHash: "hash",
      genesisID: "mainnet-v1.0",
    });

    mockGetBlock.mockResolvedValue({
      block: {
        rnd: 50000000,
        ts: 1704067200, // 2024-01-01 00:00:00 UTC
        gh: "wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=",
      },
    });

    const result = await lastBlock();

    expect(mockGetBlock).toHaveBeenCalledWith(50000000);
    expect(result).toEqual({
      height: 50000000,
      hash: "wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=",
      time: new Date(1704067200000),
    });
  });

  it("should handle different round numbers", async () => {
    mockGetTransactionParams.mockResolvedValue({
      fee: 0,
      minFee: 1000,
      firstRound: 100,
      lastRound: 12345678,
      genesisHash: "hash",
      genesisID: "mainnet-v1.0",
    });

    mockGetBlock.mockResolvedValue({
      block: {
        rnd: 12345678,
        ts: 1609459200, // 2021-01-01 00:00:00 UTC
        gh: "testHash123",
      },
    });

    const result = await lastBlock();

    expect(mockGetBlock).toHaveBeenCalledWith(12345678);
    expect(result.height).toBe(12345678);
    expect(result.hash).toBe("testHash123");
    expect(result.time).toEqual(new Date(1609459200000));
  });

  it("should propagate network errors from getTransactionParams", async () => {
    mockGetTransactionParams.mockRejectedValue(new Error("Network error"));

    await expect(lastBlock()).rejects.toThrow("Network error");
  });

  it("should propagate network errors from getBlock", async () => {
    mockGetTransactionParams.mockResolvedValue({
      fee: 0,
      minFee: 1000,
      firstRound: 1000,
      lastRound: 50000000,
      genesisHash: "hash",
      genesisID: "mainnet-v1.0",
    });

    mockGetBlock.mockRejectedValue(new Error("Block not found"));

    await expect(lastBlock()).rejects.toThrow("Block not found");
  });
});

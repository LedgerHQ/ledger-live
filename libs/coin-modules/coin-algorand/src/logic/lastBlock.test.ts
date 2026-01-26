import { lastBlock } from "./lastBlock";
import * as network from "../network";

jest.mock("../network");

const mockGetTransactionParams = network.getTransactionParams as jest.MockedFunction<
  typeof network.getTransactionParams
>;

describe("lastBlock", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return the last round as block height", async () => {
    mockGetTransactionParams.mockResolvedValue({
      fee: 0,
      minFee: 1000,
      firstRound: 1000,
      lastRound: 50000000,
      genesisHash: "hash",
      genesisID: "mainnet-v1.0",
    });

    const result = await lastBlock();

    expect(result).toEqual({
      height: 50000000,
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

    const result = await lastBlock();

    expect(result.height).toBe(12345678);
  });

  it("should propagate network errors", async () => {
    mockGetTransactionParams.mockRejectedValue(new Error("Network error"));

    await expect(lastBlock()).rejects.toThrow("Network error");
  });
});

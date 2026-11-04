import * as network from "../network";
import { lastBlock } from "./lastBlock";
import { mockAlgorandContext, mockAlgorandConfig } from "../test/context";

jest.mock("../network");

const mockGetTransactionParams = network.getTransactionParams as jest.MockedFunction<
  typeof network.getTransactionParams
>;
const mockGetBlock = network.getBlock as jest.MockedFunction<typeof network.getBlock>;
const mockGetBlockHash = network.getBlockHash as jest.MockedFunction<typeof network.getBlockHash>;

const transactionParams = (lastRound: number) => ({
  fee: 0,
  minFee: 1000,
  firstRound: 1000,
  lastRound,
  genesisHash: "hash",
  genesisID: "mainnet-v1.0",
});

describe("lastBlock", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return the last round as block height with hash, time and parent", async () => {
    mockGetTransactionParams.mockResolvedValue(transactionParams(50000000));
    mockGetBlock.mockResolvedValue({
      block: {
        rnd: 50000000,
        ts: 1704067200, // 2024-01-01 00:00:00 UTC
        gh: "wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=",
        prev: "blk-PARENTHASH",
      },
    });
    mockGetBlockHash.mockResolvedValue("BLOCKHASH");

    const result = await lastBlock(mockAlgorandContext);

    expect(mockGetBlock).toHaveBeenCalledWith(mockAlgorandConfig, 50000000);
    expect(mockGetBlockHash).toHaveBeenCalledWith(mockAlgorandConfig, 50000000);
    expect(result).toEqual({
      height: 50000000,
      hash: "BLOCKHASH",
      time: new Date(1704067200000),
      parent: { height: 49999999, hash: "PARENTHASH" },
    });
  });

  it("should propagate network errors from getTransactionParams", async () => {
    mockGetTransactionParams.mockRejectedValue(new Error("Network error"));

    await expect(lastBlock(mockAlgorandContext)).rejects.toThrow("Network error");
  });

  it("should propagate network errors from getBlock", async () => {
    mockGetTransactionParams.mockResolvedValue(transactionParams(50000000));
    mockGetBlock.mockRejectedValue(new Error("Block not found"));
    mockGetBlockHash.mockResolvedValue("BLOCKHASH");

    await expect(lastBlock(mockAlgorandContext)).rejects.toThrow("Block not found");
  });
});

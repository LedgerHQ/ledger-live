import * as network from "../network";
import { getBlockInfo } from "./getBlockInfo";
import { mockAlgorandContext, mockAlgorandConfig } from "../test/context";

jest.mock("../network");

describe("getBlockInfo", () => {
  const mockGetBlock = network.getBlock as jest.MockedFunction<typeof network.getBlock>;
  const mockGetBlockHash = network.getBlockHash as jest.MockedFunction<typeof network.getBlockHash>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return block info with height, hash, time and parent", async () => {
    // Given
    const height = 12345678;
    mockGetBlock.mockResolvedValue({
      block: {
        rnd: height,
        ts: 1704067200, // 2024-01-01 00:00:00 UTC
        gh: "wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=",
        prev: "blk-2HMKHXWWPKZVB3MT4EU533YFCBWRYS6A56FXYHF43HAVO2EPP3JQ",
      },
    });
    mockGetBlockHash.mockResolvedValue("HY4BUR6N33YYKSYDIGIEVNHAZIWWPP5BCRM43BJNVZ6J56LW3DPA");

    // When
    const result = await getBlockInfo(mockAlgorandContext, height);

    // Then
    expect(mockGetBlock).toHaveBeenCalledWith(mockAlgorandConfig, height);
    expect(mockGetBlockHash).toHaveBeenCalledWith(mockAlgorandConfig, height);
    expect(result).toEqual({
      height,
      hash: "HY4BUR6N33YYKSYDIGIEVNHAZIWWPP5BCRM43BJNVZ6J56LW3DPA",
      time: new Date(1704067200000),
      parent: {
        height: height - 1,
        hash: "2HMKHXWWPKZVB3MT4EU533YFCBWRYS6A56FXYHF43HAVO2EPP3JQ",
      },
    });
  });

  it("should return no parent for the genesis block", async () => {
    // Given
    mockGetBlock.mockResolvedValue({
      block: { rnd: 0, ts: 1560211200, gh: "wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=" },
    });
    mockGetBlockHash.mockResolvedValue("YJZOZDOPATE6P7GZFHTNHQRANB4RNDUNQ7EQVVPSVJ5K7T5OJXTQ");

    // When
    const result = await getBlockInfo(mockAlgorandContext, 0);

    // Then
    expect(result).toEqual({
      height: 0,
      hash: "YJZOZDOPATE6P7GZFHTNHQRANB4RNDUNQ7EQVVPSVJ5K7T5OJXTQ",
      time: new Date(1560211200000),
    });
  });

  it("should handle errors from network layer", async () => {
    // Given
    const height = 999999999;
    mockGetBlock.mockRejectedValue(new Error("Block not found"));
    mockGetBlockHash.mockRejectedValue(new Error("Block not found"));

    // When/Then
    await expect(getBlockInfo(mockAlgorandContext, height)).rejects.toThrow("Block not found");
  });
});

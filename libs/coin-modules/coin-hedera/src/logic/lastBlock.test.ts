import { FINALITY_MS, SYNTHETIC_BLOCK_WINDOW_SECONDS } from "../constants";
import { apiClient } from "../network/api";
import { lastBlock } from "./lastBlock";
import { getSyntheticBlock } from "./utils";

jest.mock("../network/api");

const BLOCK_WINDOW_MS = SYNTHETIC_BLOCK_WINDOW_SECONDS * 1000;

describe("lastBlock", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return the last block info", async () => {
    const mockTransaction = {
      consensus_timestamp: "1625097600.000000000",
    };

    (apiClient.getLatestTransaction as jest.Mock).mockResolvedValue(mockTransaction);

    const result = await lastBlock();
    const expectedSyntheticBlock = getSyntheticBlock(mockTransaction.consensus_timestamp);

    expect(apiClient.getLatestTransaction).toHaveBeenCalledTimes(1);
    expect(result.height).toEqual(expectedSyntheticBlock.blockHeight);
    expect(result.hash).toEqual(expectedSyntheticBlock.blockHash);
    expect(result.time).toEqual(expectedSyntheticBlock.blockTime);
  });

  it("should only query transactions from fully finalized blocks", async () => {
    const mockTransaction = {
      consensus_timestamp: "1625097600.000000000",
    };

    (apiClient.getLatestTransaction as jest.Mock).mockResolvedValue(mockTransaction);

    const now = Date.now();
    await lastBlock();

    // lastBlock() accounts for block window size: a transaction at the start of a block
    // creates a block whose END time is BLOCK_WINDOW later, so we query transactions
    // before (now - FINALITY_MS - BLOCK_WINDOW) to ensure getBlock() can fetch it.
    const expectedBefore = now - FINALITY_MS - BLOCK_WINDOW_MS;

    expect(apiClient.getLatestTransaction).toHaveBeenCalledTimes(1);
    const calledWithDate = (apiClient.getLatestTransaction as jest.Mock).mock.calls[0][0] as Date;
    expect(calledWithDate.getTime()).toBeGreaterThanOrEqual(expectedBefore - 500);
    expect(calledWithDate.getTime()).toBeLessThanOrEqual(expectedBefore + 500);
  });
});

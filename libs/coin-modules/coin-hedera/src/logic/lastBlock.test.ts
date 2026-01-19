import { FINALITY_MS } from "../constants";
import { lastBlock } from "./lastBlock";
import { apiClient } from "../network/api";
import { getSyntheticBlock } from "./utils";

jest.mock("../network/api");

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

  it("should only query transactions from finalized time range", async () => {
    const mockTransaction = {
      consensus_timestamp: "1625097600.000000000",
    };

    (apiClient.getLatestTransaction as jest.Mock).mockResolvedValue(mockTransaction);

    const now = Date.now();
    await lastBlock();

    expect(apiClient.getLatestTransaction).toHaveBeenCalledTimes(1);
    const calledWithDate = (apiClient.getLatestTransaction as jest.Mock).mock.calls[0][0] as Date;
    expect(calledWithDate.getTime()).toBeGreaterThanOrEqual(now - FINALITY_MS - 500);
    expect(calledWithDate.getTime()).toBeLessThanOrEqual(now - FINALITY_MS + 500);
  });
});

import { lastBlock } from "./lastBlock";
import { apiClient } from "../network/api";
import { getSyntheticBlock } from "./utils";

jest.mock("../network/api");

describe("lastBlock", () => {
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
});

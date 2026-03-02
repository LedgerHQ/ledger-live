import BigNumber from "bignumber.js";
import { FINALITY_MS, SYNTHETIC_BLOCK_WINDOW_SECONDS } from "../constants";
import { apiClient } from "../network/api";
import { hgraphClient } from "../network/hgraph";
import { lastBlockV2 } from "./lastBlock.v2";
import { getSyntheticBlock } from "./utils";

jest.mock("../network/api");
jest.mock("../network/hgraph");

const BLOCK_WINDOW_MS = SYNTHETIC_BLOCK_WINDOW_SECONDS * 1000;

describe("lastBlockV2", () => {
  const mockHgraphTimestampNs = "1625097500000000000";
  const mockHgraphTimestamp = new BigNumber(mockHgraphTimestampNs).dividedBy(10 ** 9).toFixed(9);
  const mockTransaction = {
    consensus_timestamp: "1625097600.000000000",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return the last block info using the smaller timestamp", async () => {
    (apiClient.getLatestTransaction as jest.Mock).mockResolvedValue(mockTransaction);
    (hgraphClient.getLatestIndexedConsensusTimestamp as jest.Mock).mockResolvedValue(
      new BigNumber(mockHgraphTimestampNs),
    );

    const result = await lastBlockV2();
    const expectedSyntheticBlock = getSyntheticBlock(mockHgraphTimestamp);

    expect(apiClient.getLatestTransaction).toHaveBeenCalledTimes(1);
    expect(hgraphClient.getLatestIndexedConsensusTimestamp).toHaveBeenCalledTimes(1);
    expect(result.height).toEqual(expectedSyntheticBlock.blockHeight);
    expect(result.hash).toEqual(expectedSyntheticBlock.blockHash);
    expect(result.time).toEqual(expectedSyntheticBlock.blockTime);
  });

  it("should only query transactions from fully finalized blocks", async () => {
    (apiClient.getLatestTransaction as jest.Mock).mockResolvedValue(mockTransaction);

    const now = Date.now();
    await lastBlockV2();

    // lastBlockV2() accounts for block window size: a transaction at the start of a block
    // creates a block whose END time is BLOCK_WINDOW later, so we query transactions
    // before (now - FINALITY_MS - BLOCK_WINDOW) to ensure getBlock() can fetch it.
    const expectedBefore = now - FINALITY_MS - BLOCK_WINDOW_MS;

    expect(apiClient.getLatestTransaction).toHaveBeenCalledTimes(1);
    const calledWithDate = (apiClient.getLatestTransaction as jest.Mock).mock.calls[0][0] as Date;
    expect(calledWithDate.getTime()).toBeGreaterThanOrEqual(expectedBefore - 500);
    expect(calledWithDate.getTime()).toBeLessThanOrEqual(expectedBefore + 500);
  });
});

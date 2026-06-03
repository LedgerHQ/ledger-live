import { FINALITY_MS, SYNTHETIC_BLOCK_WINDOW_SECONDS } from "../constants";
import { apiClient } from "../network/api";
import { getMockedCurrency } from "../test/fixtures/currency.fixture";
import { lastBlock } from "./lastBlock";
import { getSyntheticBlock } from "./utils";

jest.mock("../network/api");

const BLOCK_WINDOW_MS = SYNTHETIC_BLOCK_WINDOW_SECONDS * 1000;

describe("lastBlock", () => {
  const mockCurrency = getMockedCurrency();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return the last block info", async () => {
    const mockTransaction = {
      consensus_timestamp: "1625097600.000000000",
    };

    (apiClient.getLatestTransaction as jest.Mock).mockResolvedValue(mockTransaction);

    const result = await lastBlock({ configOrCurrencyId: mockCurrency.id });
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
    await lastBlock({ configOrCurrencyId: mockCurrency.id });

    // lastBlock({ configOrCurrencyId: "hedera" }) accounts for block window size: a transaction at the start of a block
    // creates a block whose END time is BLOCK_WINDOW later, so we query transactions
    // before (now - FINALITY_MS - BLOCK_WINDOW) to ensure getBlock() can fetch it.
    const expectedBefore = now - FINALITY_MS - BLOCK_WINDOW_MS;

    const call = (apiClient.getLatestTransaction as jest.Mock).mock.calls[0][0];
    const callDate = call.before as Date;

    expect(apiClient.getLatestTransaction).toHaveBeenCalledTimes(1);
    expect(callDate.getTime()).toBeGreaterThanOrEqual(expectedBefore - 500);
    expect(callDate.getTime()).toBeLessThanOrEqual(expectedBefore + 500);
  });
});

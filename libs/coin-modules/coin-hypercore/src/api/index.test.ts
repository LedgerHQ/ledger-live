import { createMockCoinConfigValue } from "../test/fixtures";
import { createApi } from ".";

describe("createApi", () => {
  it("returns every Alpaca API method", () => {
    expect(createApi(createMockCoinConfigValue())).toEqual({
      broadcast: expect.any(Function),
      combine: expect.any(Function),
      craftTransaction: expect.any(Function),
      craftRawTransaction: expect.any(Function),
      estimateFees: expect.any(Function),
      getBalance: expect.any(Function),
      getBlock: expect.any(Function),
      getBlockInfo: expect.any(Function),
      getNextSequence: expect.any(Function),
      getRewards: expect.any(Function),
      getStakes: expect.any(Function),
      getValidators: expect.any(Function),
      lastBlock: expect.any(Function),
      listOperations: expect.any(Function),
      validateAddress: expect.any(Function),
      validateIntent: expect.any(Function),
      craftTransactionData: expect.any(Function),
    });
  });
});

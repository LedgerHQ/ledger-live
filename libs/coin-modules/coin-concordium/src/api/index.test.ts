import { ConcordiumConfig } from "../config";
import { createApi } from ".";

describe("createApi", () => {
  it("should return every api methods", () => {
    expect(createApi({} as ConcordiumConfig)).toEqual({
      broadcast: expect.any(Function),
      combine: expect.any(Function),
      craftRawTransaction: expect.any(Function),
      craftTransaction: expect.any(Function),
      estimateFees: expect.any(Function),
      getBalance: expect.any(Function),
      getBlock: expect.any(Function),
      getBlockInfo: expect.any(Function),
      getRewards: expect.any(Function),
      getStakes: expect.any(Function),
      getValidators: expect.any(Function),
      lastBlock: expect.any(Function),
      listOperations: expect.any(Function),
    });
  });
});

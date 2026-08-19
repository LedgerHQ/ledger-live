import { BalanceOptions } from "@ledgerhq/coin-module-framework/api/types";
import { createApi } from ".";
import { type BoilerplateContext } from "../config";

const context: BoilerplateContext = {
  config: async () => ({ nodeUrl: "", minReserve: 0, status: { type: "active" } }),
  logger: () => {},
};

describe("createApi", () => {
  it("should return every api methods", () => {
    expect(createApi()).toEqual({
      broadcast: expect.any(Function),
      call: expect.any(Function),
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
      register: expect.any(Function),
      validateAddress: expect.any(Function),
      validateIntent: expect.any(Function),
      getNextSequence: expect.any(Function),
      craftTransactionData: expect.any(Function),
    });
  });

  describe("getBalance", () => {
    it("should throw an exception when options is provided", async () => {
      const api = createApi();
      await expect(
        api.getBalance(context, "random address", {} as unknown as BalanceOptions),
      ).rejects.toMatchObject({ name: "InvalidParameterError" });
    });
  });
});

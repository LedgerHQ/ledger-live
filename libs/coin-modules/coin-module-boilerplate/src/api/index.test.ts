import { BalanceOptions } from "@ledgerhq/coin-module-framework/api/types";
import { withDefaults } from "@ledgerhq/coin-module-framework/api/index";
import { createApi } from ".";
import { type BoilerplateContext } from "../config";

const context: BoilerplateContext = {
  config: async () => ({ nodeUrl: "", minReserve: 0, status: { type: "active" } }),
  logger: () => {},
};

describe("createApi", () => {
  // The migrated shape: a module declares what it implements and omits the rest. Both halves of
  // that contract are asserted here, because this module is the reference every new one copies.
  it("declares the methods it implements and omits the capabilities it has none of", () => {
    expect(createApi()).toEqual({
      broadcast: expect.any(Function),
      combine: expect.any(Function),
      craftTransaction: expect.any(Function),
      craftTransactionData: expect.any(Function),
      estimateFees: expect.any(Function),
      getBalance: expect.any(Function),
      lastBlock: expect.any(Function),
      listOperations: expect.any(Function),
    });
  });

  it("presents the full consumer surface once the resolver applies withDefaults", () => {
    const impl = createApi();
    const api = withDefaults(impl);

    // An omitted capability is reachable and reports itself unsupported rather than being absent,
    // which is what lets a consumer call it without a presence check.
    expect(api.supports("getStakes")).toBe(false);
    expect(() => api.getStakes(context, "addr")).toThrow("getStakes is not supported");
    expect(() => api.getBlock(context, 1)).toThrow("getBlock is not supported");

    // What the module does implement is passed through untouched, not re-wrapped.
    expect(api.lastBlock).toBe(impl.lastBlock);
    expect(api.broadcast).toBe(impl.broadcast);
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

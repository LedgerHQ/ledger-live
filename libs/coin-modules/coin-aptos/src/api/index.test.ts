import { BalanceOptions } from "@ledgerhq/coin-module-framework/api/types";
import { createApi } from ".";
import { createMockAptosContext } from "../test/context";

describe("index", () => {
  describe("getBalance", () => {
    it("should throw an exception when options is provided", async () => {
      const api = createApi();
      const context = createMockAptosContext();
      await expect(
        api.getBalance(context, "random address", {} as unknown as BalanceOptions),
      ).rejects.toMatchObject({ name: "InvalidParameterError" });
    });
  });
});

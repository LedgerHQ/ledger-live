import { BalanceOptions } from "@ledgerhq/coin-module-framework/api/types";
import { InvalidParameterError } from "@ledgerhq/errors";
import { createApi } from ".";
import type { AptosConfig as AptosConfigApi } from "../config";

export const getMockedConfig = (): AptosConfigApi => {
  return {
    aptosSettings: {},
  };
};

describe("index", () => {
  describe("getBalance", () => {
    it("should throw an exception when options is provided", async () => {
      const api = createApi(getMockedConfig());
      await expect(
        api.getBalance("random address", {} as unknown as BalanceOptions),
      ).rejects.toThrow(InvalidParameterError);
    });
  });
});

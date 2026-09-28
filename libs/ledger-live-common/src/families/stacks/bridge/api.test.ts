import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import stacksBridge from "./api";

describe("stacks bridge api", () => {
  describe("default export", () => {
    it("opts into the generic staking-positions account shape", () => {
      const bridgeApi = stacksBridge({} as unknown as CryptoCurrency);
      expect(bridgeApi.usesStakingPositions).toBe(true);
    });
  });
});

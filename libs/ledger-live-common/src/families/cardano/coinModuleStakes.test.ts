import { toNetworkValidator } from "@features/platform-account-source-coin-module";
import cardanoCoinModuleStakes from "./coinModuleStakes";

describe("cardanoCoinModuleStakes", () => {
  it("lists a pool with its percentage margin as a fraction", () => {
    const getValidatorsItem = {
      id: "pool1",
      address: "pool1",
      name: "LEDGR",
      balance: 1_000n,
      commissionRate: "3.00",
    };
    const validator = cardanoCoinModuleStakes.normalizeValidator?.(getValidatorsItem);
    expect(validator && toNetworkValidator(validator)).toMatchObject({ commission: 0.03 });
  });

  it("leaves a pool without a margin as it is", () => {
    const pool = { id: "pool1", address: "pool1", name: "LEDGR" };
    expect(cardanoCoinModuleStakes.normalizeValidator?.(pool)).toBe(pool);
  });
});

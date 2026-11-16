import { toNetworkValidator } from "@features/platform-account-source-coin-module";
import nearCoinModuleStakes from "./coinModuleStakes";

describe("nearCoinModuleStakes", () => {
  it("lists a validator with its percentage commission as a fraction", () => {
    const getValidatorsItem = {
      id: "ledgerbyfigment.poolv1.near",
      address: "ledgerbyfigment.poolv1.near",
      name: "ledgerbyfigment.poolv1.near",
      balance: 1_000n,
      commissionRate: "5",
    };
    const validator = nearCoinModuleStakes.normalizeValidator?.(getValidatorsItem);
    expect(validator && toNetworkValidator(validator)).toMatchObject({ commission: 0.05 });
  });
});

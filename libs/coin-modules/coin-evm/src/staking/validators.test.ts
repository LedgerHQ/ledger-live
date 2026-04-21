import { getUnbondingPeriodDays, hasUnbondingPeriod } from "./validators";

describe("evm staking – unbonding period helpers", () => {
  describe("getUnbondingPeriodDays", () => {
    it("returns the configured unbonding period for sei_evm (21 days)", () => {
      expect(getUnbondingPeriodDays("sei_evm")).toBe(21);
    });

    it.each(["celo", "__unknown__"])(
      "returns undefined for chains without a configured unbonding period (%s)",
      currencyId => {
        expect(getUnbondingPeriodDays(currencyId)).toBeUndefined();
      },
    );
  });

  describe("hasUnbondingPeriod", () => {
    it("returns true when the chain has a non-zero unbonding period", () => {
      expect(hasUnbondingPeriod("sei_evm")).toBe(true);
    });

    it.each(["celo", "__unknown__"])(
      "returns false for chains without a configured unbonding period (%s)",
      currencyId => {
        expect(hasUnbondingPeriod(currencyId)).toBe(false);
      },
    );
  });
});

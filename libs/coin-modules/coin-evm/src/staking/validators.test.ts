import { getUnbondingPeriodDays, hasUnbondingPeriod } from "./validators";

describe("evm staking – unbonding period helpers", () => {
  describe("getUnbondingPeriodDays", () => {
    it("returns the configured unbonding period for sei_evm (21 days)", () => {
      expect(getUnbondingPeriodDays("sei_evm")).toBe(21);
    });

    it("returns undefined when the chain has no configured unbonding period", () => {
      // celo contract entry is declared without an unbondingPeriodDays field
      expect(getUnbondingPeriodDays("celo")).toBeUndefined();
    });

    it("returns undefined for an unknown currencyId", () => {
      expect(getUnbondingPeriodDays("__unknown__")).toBeUndefined();
    });
  });

  describe("hasUnbondingPeriod", () => {
    it("returns true when the chain has a non-zero unbonding period", () => {
      expect(hasUnbondingPeriod("sei_evm")).toBe(true);
    });

    it("returns false when the chain has no unbonding period (instant withdrawals)", () => {
      expect(hasUnbondingPeriod("celo")).toBe(false);
    });

    it("returns false for an unknown currencyId", () => {
      expect(hasUnbondingPeriod("__unknown__")).toBe(false);
    });
  });
});

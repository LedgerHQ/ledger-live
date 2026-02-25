import { withdrawableFromStake } from "./logic";
import { SolanaStake } from "./types";

describe("withdrawableFromStake", () => {
  const rentExemptReserve = 2282880;

  describe("active stake with inactive balance (e.g., Jito MEV rewards)", () => {
    test("should allow withdrawal of inactive stake without deactivating delegation", () => {
      const stakeAccBalance = 10000000;
      const activation: SolanaStake["activation"] = {
        state: "active",
        active: 7000000,
        inactive: 717120, // MEV rewards
      };

      const withdrawable = withdrawableFromStake({
        stakeAccBalance,
        activation,
        rentExemptReserve,
      });

      // Should be able to withdraw inactive stake (rewards) + any excess
      // stakeAccBalance - rentExemptReserve - active = 10000000 - 2282880 - 7000000 = 717120
      expect(withdrawable).toBe(717120);
    });

    test("should handle zero inactive stake", () => {
      const stakeAccBalance = 10000000;
      const activation: SolanaStake["activation"] = {
        state: "active",
        active: 7717120,
        inactive: 0,
      };

      const withdrawable = withdrawableFromStake({
        stakeAccBalance,
        activation,
        rentExemptReserve,
      });

      // No inactive stake, no rewards to withdraw
      expect(withdrawable).toBe(0);
    });
  });

  describe("activating stake", () => {
    test("should allow withdrawal of inactive balance during activation", () => {
      const stakeAccBalance = 10000000;
      const activation: SolanaStake["activation"] = {
        state: "activating",
        active: 5000000,
        inactive: 2717120,
      };

      const withdrawable = withdrawableFromStake({
        stakeAccBalance,
        activation,
        rentExemptReserve,
      });

      // Should be able to withdraw inactive portion
      expect(withdrawable).toBe(2717120);
    });
  });

  describe("deactivating stake", () => {
    test("should allow withdrawal of deactivating portion", () => {
      const stakeAccBalance = 10000000;
      const activation: SolanaStake["activation"] = {
        state: "deactivating",
        active: 3000000,
        inactive: 4717120,
      };

      const withdrawable = withdrawableFromStake({
        stakeAccBalance,
        activation,
        rentExemptReserve,
      });

      // Should be able to withdraw everything except active portion and rent
      expect(withdrawable).toBe(4717120);
    });
  });

  describe("inactive stake", () => {
    test("should allow full withdrawal when stake is fully inactive", () => {
      const stakeAccBalance = 10000000;
      const activation: SolanaStake["activation"] = {
        state: "inactive",
        active: 0,
        inactive: 7717120,
      };

      const withdrawable = withdrawableFromStake({
        stakeAccBalance,
        activation,
        rentExemptReserve,
      });

      // Should be able to withdraw entire balance
      expect(withdrawable).toBe(stakeAccBalance);
    });
  });

  describe("edge cases", () => {
    test("should handle exact balance (no excess)", () => {
      const stakeAccBalance = 9282880;
      const activation: SolanaStake["activation"] = {
        state: "active",
        active: 7000000,
        inactive: 0,
      };

      const withdrawable = withdrawableFromStake({
        stakeAccBalance,
        activation,
        rentExemptReserve,
      });

      // stakeAccBalance - rentExemptReserve - active = 9282880 - 2282880 - 7000000 = 0
      expect(withdrawable).toBe(0);
    });

    test("should handle small inactive rewards", () => {
      const stakeAccBalance = 9283880;
      const activation: SolanaStake["activation"] = {
        state: "active",
        active: 7000000,
        inactive: 1000, // Small reward
      };

      const withdrawable = withdrawableFromStake({
        stakeAccBalance,
        activation,
        rentExemptReserve,
      });

      // Should be able to withdraw the small reward
      expect(withdrawable).toBe(1000);
    });
  });
});

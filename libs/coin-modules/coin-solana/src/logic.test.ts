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
        activating: 0,
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
        activating: 0,
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
    test("returns 0 when principal is fully activating (nothing withdrawable)", () => {
      // Bug case: stake just delegated, no epoch boundary crossed yet.
      // effective=0, activating=full delegation — the old formula (balance - rent - effective)
      // incorrectly returned the full principal as withdrawable, causing an on-chain error.
      const stakeAccBalance = 10000000; // rentExemptReserve + delegation
      const activation: SolanaStake["activation"] = {
        state: "activating",
        active: 0,
        activating: 7717120, // full delegation still warming up
        inactive: 0,
      };

      const withdrawable = withdrawableFromStake({
        stakeAccBalance,
        activation,
        rentExemptReserve,
      });

      expect(withdrawable).toBe(0);
    });

    test("returns 0 using amount-minus-activeAmount as activating (prepareTransaction call shape)", () => {
      // prepareTransaction.ts derives activating as Math.max(0, amount - activeAmount).
      // For a newly delegated stake: amount=delegation, activeAmount=0 → activating=delegation.
      const delegation = 7717120;
      const stakeAccBalance = rentExemptReserve + delegation; // no MEV rewards yet
      const activation: SolanaStake["activation"] = {
        state: "activating",
        active: 0,
        activating: Math.max(0, delegation - 0), // amount - activeAmount
        inactive: 0,
      };

      const withdrawable = withdrawableFromStake({
        stakeAccBalance,
        activation,
        rentExemptReserve,
      });

      expect(withdrawable).toBe(0);
    });

    test("returns MEV rewards above delegation when partially activated", () => {
      // delegation = 7_000_000; 5_000_000 effective so far, 2_000_000 still activating.
      // stakeAccBalance includes 717_120 of MEV rewards above the full delegation.
      const stakeAccBalance = 10000000; // 2_282_880 rent + 7_000_000 delegation + 717_120 MEV
      const activation: SolanaStake["activation"] = {
        state: "activating",
        active: 5000000,
        activating: 2000000,
        inactive: 717120,
      };

      const withdrawable = withdrawableFromStake({
        stakeAccBalance,
        activation,
        rentExemptReserve,
      });

      // Only the excess above the full delegation (effective + activating) is withdrawable.
      expect(withdrawable).toBe(717120);
    });
  });

  describe("deactivating stake", () => {
    test("should allow withdrawal of deactivating portion", () => {
      const stakeAccBalance = 10000000;
      const activation: SolanaStake["activation"] = {
        state: "deactivating",
        active: 3000000,
        activating: 0,
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
        activating: 0,
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
        activating: 0,
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
        activating: 0,
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

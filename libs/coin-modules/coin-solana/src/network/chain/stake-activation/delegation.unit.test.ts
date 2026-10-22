import { PublicKey } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import type { Delegation, StakeHistoryEntry } from "../account/stake";
import { getStakeActivatingAndDeactivating } from "./delegation";

const NEVER = "18446744073709551615"; // u64::MAX, a deactivation epoch that never comes

const delegation = (stake: number, activationEpoch: number, deactivationEpoch: number | string) =>
  ({
    voter: new PublicKey("EvnRmnMrd69kFdbLMxWkTn1icZ7DCceRhvmb2SJXqDo4"),
    stake: BigNumber(stake),
    activationEpoch: BigNumber(activationEpoch),
    deactivationEpoch: BigNumber(deactivationEpoch),
  }) as Delegation;

const entry = (
  epoch: number,
  effective: number,
  activating: number,
  deactivating = 0,
): StakeHistoryEntry => ({
  epoch: BigNumber(epoch),
  effective: BigNumber(effective),
  activating: BigNumber(activating),
  deactivating: BigNumber(deactivating),
});

const compute = (d: Delegation, targetEpoch: number, history: StakeHistoryEntry[]) => {
  const { effective, activating, deactivating } = getStakeActivatingAndDeactivating(
    d,
    BigNumber(targetEpoch),
    history,
  );
  return {
    effective: effective.toNumber(),
    activating: activating.toNumber(),
    deactivating: deactivating.toNumber(),
  };
};

describe("getStakeActivatingAndDeactivating", () => {
  describe("warmup", () => {
    it("has no stake when deactivated in its activation epoch", () => {
      expect(compute(delegation(1000, 10, 10), 12, [])).toEqual({
        effective: 0,
        activating: 0,
        deactivating: 0,
      });
    });

    it("has no stake before its activation epoch", () => {
      expect(compute(delegation(1000, 10, NEVER), 9, [])).toEqual({
        effective: 0,
        activating: 0,
        deactivating: 0,
      });
    });

    it("is all activating in its activation epoch", () => {
      expect(compute(delegation(1000, 10, NEVER), 10, [])).toEqual({
        effective: 0,
        activating: 1000,
        deactivating: 0,
      });
    });

    it("is fully effective once out of the stake history", () => {
      expect(compute(delegation(1000, 10, NEVER), 11, [])).toEqual({
        effective: 1000,
        activating: 0,
        deactivating: 0,
      });
    });

    it("takes its share of the 9% cluster warmup per epoch", () => {
      // epoch 10: 1000/2000 of 9% * 10000 = 450
      // epoch 11: 550/1550 of 9% * 10450 = 333.7 → 334
      const history = [entry(10, 10000, 2000), entry(11, 10450, 1550)];

      expect(compute(delegation(1000, 10, NEVER), 11, history)).toEqual({
        effective: 450,
        activating: 550,
        deactivating: 0,
      });
      expect(compute(delegation(1000, 10, NEVER), 12, history)).toEqual({
        effective: 784,
        activating: 216,
        deactivating: 0,
      });
    });

    it("caps the effective stake at the delegated amount", () => {
      expect(compute(delegation(1000, 10, NEVER), 11, [entry(10, 100000, 1000)])).toEqual({
        effective: 1000,
        activating: 0,
        deactivating: 0,
      });
    });

    it("stops warming up at its deactivation epoch", () => {
      // warmup stops at 450 (epoch 10 only), then epoch 11 cools down 450/4500 of 9% * 10450 = 94;
      // warming up through epoch 11 as well would give 784 - 164 = 620
      const history = [entry(10, 10000, 2000), entry(11, 10450, 1550, 4500)];

      expect(compute(delegation(1000, 10, 11), 12, history)).toEqual({
        effective: 356,
        activating: 0,
        deactivating: 356,
      });
    });
  });

  describe("cooldown", () => {
    // fully effective from epoch 6 onwards
    const active = [entry(5, 100000, 1000)];

    it("is all deactivating in its deactivation epoch", () => {
      expect(compute(delegation(1000, 5, 10), 10, active)).toEqual({
        effective: 1000,
        activating: 0,
        deactivating: 1000,
      });
    });

    it("takes its share of the 9% cluster cooldown per epoch", () => {
      // epoch 10: 1000/2000 of 9% * 10000 = 450 cooled down
      expect(compute(delegation(1000, 5, 10), 11, [...active, entry(10, 10000, 0, 2000)])).toEqual({
        effective: 550,
        activating: 0,
        deactivating: 550,
      });
    });

    it("is fully inactive once its share covers the remaining stake", () => {
      expect(compute(delegation(1000, 5, 10), 11, [...active, entry(10, 100000, 0, 1000)])).toEqual(
        { effective: 0, activating: 0, deactivating: 0 },
      );
    });

    it("keeps its stake while the cluster has nothing deactivating", () => {
      expect(compute(delegation(1000, 5, 10), 11, [...active, entry(10, 10000, 0, 0)])).toEqual({
        effective: 1000,
        activating: 0,
        deactivating: 1000,
      });
    });

    it("is fully inactive once out of the stake history", () => {
      expect(compute(delegation(1000, 5, 10), 11, active)).toEqual({
        effective: 0,
        activating: 0,
        deactivating: 0,
      });
    });
  });
});

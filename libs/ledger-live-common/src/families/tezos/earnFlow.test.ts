import { getTezosEarnFlow, type TezosEarnFlowInput } from "./earnFlow";

const input = (over: Partial<TezosEarnFlowInput> = {}): TezosEarnFlowInput => ({
  isEmpty: false,
  stakingEnabled: false,
  isDelegated: false,
  ...over,
});

describe("getTezosEarnFlow", () => {
  it("returns no-funds for an empty account regardless of other state", () => {
    expect(getTezosEarnFlow(input({ isEmpty: true }))).toEqual({ kind: "no-funds" });
    expect(
      getTezosEarnFlow(input({ isEmpty: true, stakingEnabled: true, isDelegated: true })),
    ).toEqual({ kind: "no-funds" });
  });

  describe("staking enabled", () => {
    it("offers the earning choice when not delegated", () => {
      expect(getTezosEarnFlow(input({ stakingEnabled: true }))).toEqual({ kind: "earning-choice" });
    });

    it("routes a delegated account straight to staking, skipping delegation", () => {
      expect(getTezosEarnFlow(input({ stakingEnabled: true, isDelegated: true }))).toEqual({
        kind: "stake",
        skipDelegation: true,
      });
    });
  });

  describe("staking feature disabled", () => {
    it("redelegates when already delegated", () => {
      expect(getTezosEarnFlow(input({ isDelegated: true }))).toEqual({
        kind: "delegate",
        redelegate: true,
      });
    });

    it("starts a fresh delegation when not delegated", () => {
      expect(getTezosEarnFlow(input())).toEqual({ kind: "delegate", redelegate: false });
    });
  });
});

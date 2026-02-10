import { mapDelegationState, DELEGATION_STATE_MAP } from "./stateMapping";
import type { MultiversXDelegation } from "../types";

describe("DELEGATION_STATE_MAP", () => {
  it("documents the expected state mappings for MultiversX", () => {
    expect(DELEGATION_STATE_MAP).toEqual({
      staked: "active",
      unstaking: "deactivating",
      withdrawable: "inactive",
    });
  });
});

describe("mapDelegationState", () => {
  const createDelegation = (
    overrides: Partial<MultiversXDelegation> = {},
  ): MultiversXDelegation => ({
    address: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
    contract: "erd1qqqqqqqqqqqqqpgqp699jngundfqw07d8jzkepucvpzush6k3wvqyc44rx",
    userActiveStake: "0",
    claimableRewards: "0",
    userUnBondable: "0",
    userUndelegatedList: [],
    ...overrides,
  });

  describe("active state (AC: #1)", () => {
    it("returns 'active' when delegation has only active stake", () => {
      const delegation = createDelegation({
        userActiveStake: "1000000000000000000", // 1 EGLD
        claimableRewards: "0",
        userUnBondable: "0",
        userUndelegatedList: [],
      });

      expect(mapDelegationState(delegation)).toBe("active");
    });

    it("returns 'active' when delegation has active stake and rewards", () => {
      const delegation = createDelegation({
        userActiveStake: "1000000000000000000",
        claimableRewards: "50000000000000000", // 0.05 EGLD rewards
        userUnBondable: "0",
        userUndelegatedList: [],
      });

      expect(mapDelegationState(delegation)).toBe("active");
    });
  });

  describe("deactivating state (AC: #2)", () => {
    it("returns 'deactivating' when delegation has pending undelegations (seconds > 0)", () => {
      const delegation = createDelegation({
        userActiveStake: "0",
        claimableRewards: "0",
        userUnBondable: "0",
        userUndelegatedList: [
          { amount: "500000000000000000", seconds: 86400 }, // 24 hours remaining
        ],
      });

      expect(mapDelegationState(delegation)).toBe("deactivating");
    });

    it("returns 'deactivating' when has both active stake AND pending undelegations (AC: #5)", () => {
      const delegation = createDelegation({
        userActiveStake: "1000000000000000000", // Still has active stake
        claimableRewards: "0",
        userUnBondable: "0",
        userUndelegatedList: [
          { amount: "500000000000000000", seconds: 3600 }, // Pending undelegation
        ],
      });

      // Deactivating takes precedence over active
      expect(mapDelegationState(delegation)).toBe("deactivating");
    });

    it("returns 'deactivating' when has multiple pending undelegations with different times", () => {
      const delegation = createDelegation({
        userActiveStake: "0",
        claimableRewards: "0",
        userUnBondable: "0",
        userUndelegatedList: [
          { amount: "100000000000000000", seconds: 3600 },
          { amount: "200000000000000000", seconds: 86400 },
        ],
      });

      expect(mapDelegationState(delegation)).toBe("deactivating");
    });
  });

  describe("inactive state (AC: #3)", () => {
    it("returns 'inactive' when delegation has withdrawable amount (userUnBondable > 0)", () => {
      const delegation = createDelegation({
        userActiveStake: "0",
        claimableRewards: "0",
        userUnBondable: "1000000000000000000", // Ready to withdraw
        userUndelegatedList: [],
      });

      expect(mapDelegationState(delegation)).toBe("inactive");
    });

    it("returns 'inactive' when undelegations are complete (seconds === 0)", () => {
      const delegation = createDelegation({
        userActiveStake: "0",
        claimableRewards: "0",
        userUnBondable: "0",
        userUndelegatedList: [
          { amount: "500000000000000000", seconds: 0 }, // Complete - ready to withdraw
        ],
      });

      expect(mapDelegationState(delegation)).toBe("inactive");
    });

    it("returns 'inactive' when delegation is empty (all zeros)", () => {
      const delegation = createDelegation({
        userActiveStake: "0",
        claimableRewards: "0",
        userUnBondable: "0",
        userUndelegatedList: [],
      });

      expect(mapDelegationState(delegation)).toBe("inactive");
    });

    it("returns 'inactive' when has only claimable rewards but no active stake", () => {
      const delegation = createDelegation({
        userActiveStake: "0",
        claimableRewards: "50000000000000000",
        userUnBondable: "0",
        userUndelegatedList: [],
      });

      expect(mapDelegationState(delegation)).toBe("inactive");
    });
  });

  describe("mixed states - precedence rules (AC: #5)", () => {
    it("deactivating takes precedence over inactive (userUnBondable)", () => {
      const delegation = createDelegation({
        userActiveStake: "0",
        claimableRewards: "0",
        userUnBondable: "500000000000000000", // Has withdrawable
        userUndelegatedList: [
          { amount: "200000000000000000", seconds: 3600 }, // Also has pending
        ],
      });

      // Pending undelegation takes precedence
      expect(mapDelegationState(delegation)).toBe("deactivating");
    });

    it("deactivating takes precedence over active stake", () => {
      const delegation = createDelegation({
        userActiveStake: "1000000000000000000", // Has active stake
        claimableRewards: "50000000000000000",
        userUnBondable: "0",
        userUndelegatedList: [
          { amount: "200000000000000000", seconds: 7200 }, // Pending undelegation
        ],
      });

      expect(mapDelegationState(delegation)).toBe("deactivating");
    });

    it("inactive when all undelegations complete (seconds === 0) even with withdrawable", () => {
      const delegation = createDelegation({
        userActiveStake: "0",
        claimableRewards: "0",
        userUnBondable: "500000000000000000",
        userUndelegatedList: [
          { amount: "200000000000000000", seconds: 0 }, // Complete
        ],
      });

      expect(mapDelegationState(delegation)).toBe("inactive");
    });

    it("deactivating when mixed undelegations (some pending, some complete)", () => {
      const delegation = createDelegation({
        userActiveStake: "0",
        claimableRewards: "0",
        userUnBondable: "0",
        userUndelegatedList: [
          { amount: "200000000000000000", seconds: 0 }, // Complete
          { amount: "300000000000000000", seconds: 3600 }, // Still pending
        ],
      });

      // Pending undelegation takes precedence
      expect(mapDelegationState(delegation)).toBe("deactivating");
    });
  });

  describe("edge cases", () => {
    it("handles undelegation with amount 0 and seconds > 0 (ignores empty amounts)", () => {
      const delegation = createDelegation({
        userActiveStake: "1000000000000000000",
        claimableRewards: "0",
        userUnBondable: "0",
        userUndelegatedList: [
          { amount: "0", seconds: 3600 }, // Empty amount, ignore
        ],
      });

      // Should be active since the undelegation has 0 amount
      expect(mapDelegationState(delegation)).toBe("active");
    });

    it("handles undelegation with amount 0 and seconds === 0", () => {
      const delegation = createDelegation({
        userActiveStake: "1000000000000000000",
        claimableRewards: "0",
        userUnBondable: "0",
        userUndelegatedList: [
          { amount: "0", seconds: 0 }, // Empty completed undelegation
        ],
      });

      // Should be active since the undelegation has 0 amount
      expect(mapDelegationState(delegation)).toBe("active");
    });

    it("handles very large stake amounts", () => {
      const delegation = createDelegation({
        userActiveStake: "999999999999999999999999999", // Very large
        claimableRewards: "0",
        userUnBondable: "0",
        userUndelegatedList: [],
      });

      expect(mapDelegationState(delegation)).toBe("active");
    });
  });
});

import type { StakingResources } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import BigNumber from "bignumber.js";
import cosmosBridge from "./api";

const mockGetRedelegations = jest.fn();
jest.mock("@ledgerhq/coin-cosmos/logic/staking/getRedelegations", () => ({
  getRedelegations: (...args: unknown[]) => mockGetRedelegations(...args),
}));

const cosmos = getCryptoCurrencyById("cosmos");

describe("cosmos bridge", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("computeIntentType", () => {
    it.each([
      [{ mode: "send" }, "send"],
      [{}, "send"],
      [{ mode: undefined }, "send"],
      [{ mode: "delegate" }, "delegate"],
      [{ mode: "undelegate" }, "undelegate"],
      [{ mode: "redelegate" }, "redelegate"],
      [{ mode: "claimReward" }, "claimReward"],
      [{ mode: "compoundReward" }, "compoundReward"],
    ])("maps %o to %s", (transaction, expected) => {
      expect(cosmosBridge(cosmos).computeIntentType!(transaction)).toBe(expected);
    });

    it("throws for an unsupported mode", () => {
      expect(() => cosmosBridge(cosmos).computeIntentType!({ mode: "swap" })).toThrow(
        "Unsupported Cosmos transaction mode: swap",
      );
    });
  });

  describe("bridge surface", () => {
    it("marks staking supported", () => {
      expect(cosmosBridge(cosmos).stakingSupported).toBe(true);
    });
  });

  describe("enrichStakingResources", () => {
    const base: StakingResources = {
      delegations: [],
      redelegations: [],
      unbondings: [],
      delegatedBalance: new BigNumber(0),
      pendingRewardsBalance: new BigNumber(0),
      unbondingBalance: new BigNumber(0),
    };

    it("populates redelegations fetched for the address, preserving the other fields", async () => {
      const redelegations = [
        {
          validatorSrcAddress: "cosmosvaloper1src",
          validatorDstAddress: "cosmosvaloper1dst",
          amount: new BigNumber("1000000"),
          completionDate: new Date("2026-01-01T00:00:00Z"),
        },
      ];
      mockGetRedelegations.mockResolvedValue(redelegations);

      const result = await cosmosBridge(cosmos).enrichStakingResources!(
        cosmos,
        "cosmos1a",
        [],
        base,
      );

      expect(mockGetRedelegations).toHaveBeenCalledWith("cosmos", "cosmos1a");
      expect(result.redelegations).toEqual(redelegations);
      expect(result.delegatedBalance).toBe(base.delegatedBalance);
    });
  });
});

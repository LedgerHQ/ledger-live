import BigNumber from "bignumber.js";
import { resolveIntents } from "./resolver";

function makeCosmosAccount(overrides: Record<string, unknown> = {}) {
  return {
    id: "cosmos-account-1",
    type: "Account" as const,
    currency: { family: "cosmos", id: "cosmos" },
    cosmosResources: {
      delegations: [
        {
          validatorAddress: "cosmosvaloper1",
          pendingRewards: { gt: (n: number) => n === 0 },
        },
      ],
      redelegations: [],
      unbondings: [],
      delegatedBalance: { gt: (n: number) => n === 0 },
      pendingRewardsBalance: { gt: (n: number) => n === 0 },
      unbondingBalance: { gt: () => false },
    },
    spendableBalance: new BigNumber(1_000_000),
    balance: new BigNumber(1_000_000),
    ...overrides,
  };
}

function makeSolanaAccount(overrides: Record<string, unknown> = {}) {
  return {
    id: "solana-account-1",
    type: "Account" as const,
    currency: { family: "solana", id: "solana" },
    balance: { isZero: () => false },
    spendableBalance: { isZero: () => false },
    solanaResources: {
      stakes: [
        {
          activation: { state: "active" },
          withdrawable: 0,
        },
      ],
    },
    ...overrides,
  };
}

describe("resolveIntents", () => {
  describe("cosmos family", () => {
    it("returns generic intents with family-specific labels", () => {
      const account = makeCosmosAccount();
      const intents = resolveIntents(account as never);

      expect(intents).toHaveLength(4);
      expect(intents.map(i => i.intent)).toEqual(["stake", "unstake", "restake", "claimRewards"]);
      expect(intents.map(i => i.label)).toEqual([
        "Delegate",
        "Undelegate",
        "Redelegate",
        "Claim rewards",
      ]);
    });

    it("stake is always enabled", () => {
      const intents = resolveIntents(makeCosmosAccount() as never);
      const stake = intents.find(i => i.intent === "stake");
      expect(stake?.enabled).toBe(true);
    });

    it("restake requires validatorAddress", () => {
      const intents = resolveIntents(makeCosmosAccount() as never);
      const restake = intents.find(i => i.intent === "restake");
      expect(restake?.params).toContain("validatorAddress");
    });

    it("unstake is disabled when unbondings at max (7)", () => {
      const account = makeCosmosAccount({
        cosmosResources: {
          delegations: [{ validatorAddress: "v1", pendingRewards: { gt: () => false } }],
          redelegations: [],
          unbondings: Array(7).fill({}),
          delegatedBalance: { gt: () => true },
          pendingRewardsBalance: { gt: () => false },
          unbondingBalance: { gt: () => true },
        },
      });
      const unstake = resolveIntents(account as never).find(i => i.intent === "unstake");
      expect(unstake?.enabled).toBe(false);
    });

    it("restake is disabled when redelegations at max (7)", () => {
      const account = makeCosmosAccount({
        cosmosResources: {
          delegations: [{ validatorAddress: "v1", pendingRewards: { gt: () => false } }],
          redelegations: Array(7).fill({ validatorDstAddress: "v" }),
          unbondings: [],
          delegatedBalance: { gt: () => true },
          pendingRewardsBalance: { gt: () => false },
          unbondingBalance: { gt: () => false },
        },
      });
      const restake = resolveIntents(account as never).find(i => i.intent === "restake");
      expect(restake?.enabled).toBe(false);
    });

    it("claimRewards is disabled when no pending rewards", () => {
      const account = makeCosmosAccount({
        cosmosResources: {
          delegations: [{ validatorAddress: "v1", pendingRewards: { gt: () => false } }],
          redelegations: [],
          unbondings: [],
          delegatedBalance: { gt: () => true },
          pendingRewardsBalance: { gt: () => false },
          unbondingBalance: { gt: () => false },
        },
      });
      const claim = resolveIntents(account as never).find(i => i.intent === "claimRewards");
      expect(claim?.enabled).toBe(false);
    });
  });

  describe("solana family", () => {
    it("returns stake, unstake, restake, and withdraw intents", () => {
      const intents = resolveIntents(makeSolanaAccount() as never);
      expect(intents.map(i => i.intent)).toEqual(["stake", "unstake", "restake", "withdraw"]);
    });

    it("enables unstake when a stake can be deactivated", () => {
      const unstake = resolveIntents(makeSolanaAccount() as never).find(i => i.intent === "unstake");
      expect(unstake?.enabled).toBe(true);
      expect(unstake?.label).toBe("Deactivate");
    });
  });

  describe("near family", () => {
    it("returns stake, unstake, and withdraw intents", () => {
      const account = {
        id: "near-account",
        type: "Account" as const,
        currency: { family: "near", id: "near" },
        balance: new BigNumber(1000),
        nearResources: { stakingPositions: [] },
      };
      const intents = resolveIntents(account as never);
      expect(intents.map(i => i.intent)).toEqual(["stake", "unstake", "withdraw"]);
    });
  });

  it("returns empty array for unsupported family", () => {
    const account = {
      id: "btc-account",
      type: "Account" as const,
      currency: { family: "bitcoin", id: "bitcoin" },
    };
    expect(resolveIntents(account as never)).toEqual([]);
  });

  it("returns empty array for token accounts", () => {
    const tokenAccount = {
      id: "token-1",
      type: "TokenAccount" as const,
    };
    expect(resolveIntents(tokenAccount as never)).toEqual([]);
  });
});

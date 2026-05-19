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
    ...overrides,
  };
}

describe("resolveIntents", () => {
  describe("cosmos family", () => {
    it("returns all intents for account with active delegations", () => {
      const account = makeCosmosAccount();
      const intents = resolveIntents(account as never);

      expect(intents).toHaveLength(4);
      expect(intents.map(i => i.name)).toEqual([
        "delegate",
        "redelegate",
        "unbond",
        "claimRewards",
      ]);
    });

    it("delegate is always enabled", () => {
      const account = makeCosmosAccount();
      const intents = resolveIntents(account as never);
      const delegate = intents.find(i => i.name === "delegate");
      expect(delegate?.enabled).toBe(true);
    });

    it("redelegate requires validatorAddress", () => {
      const account = makeCosmosAccount();
      const intents = resolveIntents(account as never);
      const redelegate = intents.find(i => i.name === "redelegate");
      expect(redelegate?.params).toContain("validatorAddress");
    });

    it("unbond is disabled when unbondings at max (7)", () => {
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
      const intents = resolveIntents(account as never);
      const unbond = intents.find(i => i.name === "unbond");
      expect(unbond?.enabled).toBe(false);
    });

    it("redelegate is disabled when redelegations at max (7)", () => {
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
      const intents = resolveIntents(account as never);
      const redelegate = intents.find(i => i.name === "redelegate");
      expect(redelegate?.enabled).toBe(false);
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
      const intents = resolveIntents(account as never);
      const claim = intents.find(i => i.name === "claimRewards");
      expect(claim?.enabled).toBe(false);
    });

    it("redelegate/unbond/claimRewards disabled when no delegations", () => {
      const account = makeCosmosAccount({
        cosmosResources: {
          delegations: [],
          redelegations: [],
          unbondings: [],
          delegatedBalance: { gt: () => false },
          pendingRewardsBalance: { gt: () => false },
          unbondingBalance: { gt: () => false },
        },
      });
      const intents = resolveIntents(account as never);

      const redelegate = intents.find(i => i.name === "redelegate");
      const unbond = intents.find(i => i.name === "unbond");
      const claim = intents.find(i => i.name === "claimRewards");

      expect(redelegate?.enabled).toBe(false);
      expect(unbond?.enabled).toBe(false);
      expect(claim?.enabled).toBe(false);
    });
  });

  it("returns empty array for unsupported family", () => {
    const account = {
      id: "eth-account",
      type: "Account" as const,
      currency: { family: "ethereum", id: "ethereum" },
    };
    const intents = resolveIntents(account as never);
    expect(intents).toEqual([]);
  });

  it("returns empty array for token accounts", () => {
    const tokenAccount = {
      id: "token-1",
      type: "TokenAccount" as const,
    };
    const intents = resolveIntents(tokenAccount as never);
    expect(intents).toEqual([]);
  });
});

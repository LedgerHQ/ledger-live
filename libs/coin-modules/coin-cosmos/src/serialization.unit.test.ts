import { BigNumber } from "bignumber.js";
import {
  createEmptyStakingResources,
  type StakingResources,
  type StakingAccount,
  type StakingResourcesRaw,
} from "@ledgerhq/types-live";
import {
  assignFromAccountRaw,
  assignToAccountRaw,
  fromOperationExtraRaw,
  toOperationExtraRaw,
} from "./serialization";
import type {
  CosmosAccount,
  CosmosAccountRaw,
  CosmosResourcesRaw,
  LegacyCosmosResourcesFields,
} from "./types";

function makeResources(override?: Partial<StakingResources>): StakingResources {
  return { ...createEmptyStakingResources(), ...override };
}

function makeRawResources(
  override?: Partial<CosmosResourcesRaw>,
): CosmosResourcesRaw & LegacyCosmosResourcesFields {
  return {
    delegations: [],
    redelegations: [],
    unbondings: [],
    delegatedBalance: "0",
    pendingRewardsBalance: "0",
    unbondingBalance: "0",
    ...override,
  };
}

function makeRawStakingResources(override?: Partial<StakingResourcesRaw>): StakingResourcesRaw {
  return {
    delegations: [],
    redelegations: [],
    unbondings: [],
    delegatedBalance: "0",
    pendingRewardsBalance: "0",
    unbondingBalance: "0",
    ...override,
  };
}

describe("assignToAccountRaw", () => {
  it("persists the sequence and the staking resources, and never cosmosResources", () => {
    const now = new Date();
    const account = {
      sequence: 123456789,
      stakingResources: makeResources({
        delegations: [
          {
            validatorAddress: "0x123456",
            amount: BigNumber("0"),
            pendingRewards: BigNumber("1"),
            status: "bonded",
          },
        ],
        unbondings: [
          { validatorAddress: "0x789", amount: BigNumber("0"), completionDate: now },
          { validatorAddress: "0x123", amount: BigNumber("1"), completionDate: now },
        ],
        delegatedBalance: BigNumber("0"),
        pendingRewardsBalance: BigNumber("1"),
        unbondingBalance: BigNumber("2"),
      }),
    } as CosmosAccount & StakingAccount;
    const accountRaw = {} as CosmosAccountRaw;

    assignToAccountRaw(account, accountRaw);

    expect(accountRaw.sequence).toBe(123456789);
    expect(accountRaw.stakingResources).toMatchObject({
      delegations: [
        { validatorAddress: "0x123456", amount: "0", pendingRewards: "1", status: "bonded" },
      ],
      redelegations: [],
      unbondings: [
        { validatorAddress: "0x789", amount: "0" },
        { validatorAddress: "0x123", amount: "1" },
      ],
      delegatedBalance: "0",
      pendingRewardsBalance: "1",
      unbondingBalance: "2",
    });
    expect(accountRaw).not.toHaveProperty("cosmosResources");
    expect(accountRaw.stakingResources).not.toHaveProperty("sequence");
    expect(accountRaw.stakingResources).not.toHaveProperty("publicKey");
  });

  it("preserves the 'activating' delegation status when persisting stakingResources", () => {
    const account = {
      sequence: 0,
      stakingResources: makeResources({
        delegations: [
          {
            validatorAddress: "0xabc",
            amount: BigNumber("10"),
            pendingRewards: BigNumber("0"),
            status: "activating",
          },
        ],
      }),
    } as CosmosAccount & StakingAccount;
    const accountRaw = {} as CosmosAccountRaw;

    assignToAccountRaw(account, accountRaw);

    expect(accountRaw.stakingResources?.delegations[0].status).toBe("activating");
  });
});

describe("assignFromAccountRaw", () => {
  it("revives sequence and stakingResources from the current raw shape", () => {
    const accountRaw = {
      sequence: 9,
      stakingResources: makeRawStakingResources({ delegatedBalance: "5" }),
    } as CosmosAccountRaw;
    const account = {} as CosmosAccount & StakingAccount;

    assignFromAccountRaw(accountRaw, account);

    expect(account.sequence).toBe(9);
    expect(account.stakingResources.delegatedBalance).toEqual(BigNumber(5));
  });

  it("preserves the 'activating' delegation status when hydrating stakingResources", () => {
    const accountRaw = {
      sequence: 1,
      stakingResources: makeRawStakingResources({
        delegations: [
          { validatorAddress: "0xabc", amount: "10", pendingRewards: "0", status: "activating" },
        ],
      }),
    } as CosmosAccountRaw;
    const account = {} as CosmosAccount & StakingAccount;

    assignFromAccountRaw(accountRaw, account);

    expect(account.stakingResources.delegations[0].status).toBe("activating");
  });

  it("defaults the sequence to 0 and adds no staking resources when the raw carries nothing", () => {
    const account = {} as CosmosAccount;

    assignFromAccountRaw({} as CosmosAccountRaw, account);

    expect(account.sequence).toBe(0);
    expect(account).not.toHaveProperty("stakingResources");
  });

  describe("legacy raw accounts", () => {
    it("revives stakingResources from the legacy cosmosResources", () => {
      const now = new Date();
      const accountRaw = {
        cosmosResources: makeRawResources({
          delegations: [
            { validatorAddress: "0x1", amount: "10", pendingRewards: "1", status: "bonded" },
          ],
          redelegations: [
            {
              validatorSrcAddress: "0xsrc",
              validatorDstAddress: "0xdst",
              amount: "3",
              completionDate: now.toISOString(),
            },
          ],
          unbondings: [{ validatorAddress: "0x2", amount: "4", completionDate: now.toISOString() }],
          delegatedBalance: "42",
          pendingRewardsBalance: "1",
          unbondingBalance: "4",
          sequence: 7,
        }),
      } as CosmosAccountRaw;
      const account = {} as CosmosAccount & StakingAccount;

      assignFromAccountRaw(accountRaw, account);

      expect(account.stakingResources).toEqual({
        delegations: [
          {
            validatorAddress: "0x1",
            amount: BigNumber(10),
            pendingRewards: BigNumber(1),
            status: "bonded",
          },
        ],
        redelegations: [
          {
            validatorSrcAddress: "0xsrc",
            validatorDstAddress: "0xdst",
            amount: BigNumber(3),
            completionDate: now,
          },
        ],
        unbondings: [{ validatorAddress: "0x2", amount: BigNumber(4), completionDate: now }],
        delegatedBalance: BigNumber(42),
        pendingRewardsBalance: BigNumber(1),
        unbondingBalance: BigNumber(4),
      });
      expect(account).not.toHaveProperty("cosmosResources");
    });

    it("keeps the raw stakingResources over the legacy cosmosResources when both are present", () => {
      const accountRaw = {
        cosmosResources: makeRawResources({ delegatedBalance: "1" }),
        stakingResources: makeRawStakingResources({ delegatedBalance: "2" }),
      } as CosmosAccountRaw;
      const account = {} as CosmosAccount & StakingAccount;

      assignFromAccountRaw(accountRaw, account);

      expect(account.stakingResources.delegatedBalance).toEqual(BigNumber(2));
    });

    it("prefers the top-level sequence over the legacy ones", () => {
      const accountRaw = {
        sequence: 1,
        stakingResources: { ...makeRawStakingResources(), sequence: 2 },
        cosmosResources: makeRawResources({ sequence: 3 }),
      } as CosmosAccountRaw;
      const account = {} as CosmosAccount;

      assignFromAccountRaw(accountRaw, account);

      expect(account.sequence).toBe(1);
    });

    it("falls back to the legacy stakingResources sequence", () => {
      const accountRaw = {
        stakingResources: { ...makeRawStakingResources(), sequence: 2 },
        cosmosResources: makeRawResources({ sequence: 3 }),
      } as CosmosAccountRaw;
      const account = {} as CosmosAccount;

      assignFromAccountRaw(accountRaw, account);

      expect(account.sequence).toBe(2);
    });

    it("falls back to the legacy cosmosResources sequence", () => {
      const accountRaw = {
        cosmosResources: makeRawResources({ sequence: 3 }),
      } as CosmosAccountRaw;
      const account = {} as CosmosAccount;

      assignFromAccountRaw(accountRaw, account);

      expect(account.sequence).toBe(3);
    });

    describe("publicKey migration into xpub", () => {
      const address = "cosmos1address";

      it("migrates the legacy stakingResources publicKey when xpub is missing", () => {
        const accountRaw = {
          stakingResources: { ...makeRawStakingResources(), publicKey: "02stk" },
        } as CosmosAccountRaw;
        const account = { freshAddress: address } as CosmosAccount;

        assignFromAccountRaw(accountRaw, account);

        expect(account.xpub).toBe("02stk");
      });

      it("migrates the legacy cosmosResources publicKey when xpub is the plain address", () => {
        const accountRaw = {
          cosmosResources: makeRawResources({ publicKey: "02cos" }),
        } as CosmosAccountRaw;
        const account = { freshAddress: address, xpub: address } as CosmosAccount;

        assignFromAccountRaw(accountRaw, account);

        expect(account.xpub).toBe("02cos");
      });

      it("prefers the stakingResources publicKey over the cosmosResources one", () => {
        const accountRaw = {
          stakingResources: { ...makeRawStakingResources(), publicKey: "02stk" },
          cosmosResources: makeRawResources({ publicKey: "02cos" }),
        } as CosmosAccountRaw;
        const account = { freshAddress: address } as CosmosAccount;

        assignFromAccountRaw(accountRaw, account);

        expect(account.xpub).toBe("02stk");
      });

      it("keeps an xpub that is already a public key", () => {
        const accountRaw = {
          cosmosResources: makeRawResources({ publicKey: "02cos" }),
        } as CosmosAccountRaw;
        const account = { freshAddress: address, xpub: "02current" } as CosmosAccount;

        assignFromAccountRaw(accountRaw, account);

        expect(account.xpub).toBe("02current");
      });

      it("leaves xpub untouched when the legacy publicKey is empty or absent", () => {
        const emptyKey = { cosmosResources: makeRawResources({ publicKey: "" }) };
        const noKey = { cosmosResources: makeRawResources() };

        for (const accountRaw of [emptyKey, noKey, {}] as CosmosAccountRaw[]) {
          const account = { freshAddress: address, xpub: address } as CosmosAccount;
          assignFromAccountRaw(accountRaw, account);
          expect(account.xpub).toBe(address);
        }
      });
    });
  });
});

describe("operation extra serialization", () => {
  const extra = {
    validator: { address: "cosmosvaloper1a", amount: new BigNumber("1500") },
    validators: [
      { address: "cosmosvaloper1b", amount: new BigNumber("10") },
      { address: "cosmosvaloper1c", amount: new BigNumber("20") },
    ],
    sourceValidator: "cosmosvaloper1src",
    autoClaimedRewards: "42",
    memo: "invoice 42",
  };
  const extraRaw = {
    validator: { address: "cosmosvaloper1a", amount: "1500" },
    validators: [
      { address: "cosmosvaloper1b", amount: "10" },
      { address: "cosmosvaloper1c", amount: "20" },
    ],
    sourceValidator: "cosmosvaloper1src",
    autoClaimedRewards: "42",
    memo: "invoice 42",
  };

  it("serializes every field, amounts as strings", () => {
    expect(toOperationExtraRaw(extra)).toEqual(extraRaw);
  });

  it("deserializes every field, amounts as BigNumber", () => {
    const result = fromOperationExtraRaw(extraRaw) as typeof extra;

    expect(result).toEqual(extra);
    expect(BigNumber.isBigNumber(result.validator.amount)).toBe(true);
    expect(BigNumber.isBigNumber(result.validators[1].amount)).toBe(true);
  });

  it("round-trips the memo on its own, so it still shows in operation details", () => {
    expect(fromOperationExtraRaw(toOperationExtraRaw({ memo: "hello" }))).toEqual({
      memo: "hello",
    });
  });

  it("omits empty fields instead of writing empty values", () => {
    expect(toOperationExtraRaw({ memo: "hello", validators: [] })).toEqual({ memo: "hello" });
    expect(fromOperationExtraRaw({ memo: "hello", validators: [] })).toEqual({ memo: "hello" });
  });

  it("ignores an extra that carries no Cosmos field", () => {
    expect(toOperationExtraRaw({ foo: "bar" })).toEqual({});
    expect(fromOperationExtraRaw({ foo: "bar" })).toEqual({});
  });
});

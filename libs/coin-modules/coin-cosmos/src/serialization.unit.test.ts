import { BigNumber } from "bignumber.js";
import {
  type StakingResourcesRaw,
  type StakingResources,
  createEmptyStakingResources,
} from "@ledgerhq/types-live";
import { assignFromAccountRaw, assignToAccountRaw } from "./serialization";
import type {
  CosmosAccount,
  CosmosAccountRaw,
  CosmosResources,
  LegacyCosmosResourcesFields,
} from "./types";

function makeResources(
  override?: Partial<StakingResources & LegacyCosmosResourcesFields>,
): StakingResources & LegacyCosmosResourcesFields {
  return {
    delegations: [],
    redelegations: [],
    unbondings: [],
    delegatedBalance: new BigNumber(0),
    pendingRewardsBalance: new BigNumber(0),
    unbondingBalance: new BigNumber(0),
    sequence: 3,
    ...override,
  };
}

function makeRawResources(
  override?: Partial<StakingResourcesRaw & LegacyCosmosResourcesFields>,
): StakingResourcesRaw & LegacyCosmosResourcesFields {
  return {
    delegations: [],
    redelegations: [],
    unbondings: [],
    delegatedBalance: "0",
    pendingRewardsBalance: "0",
    unbondingBalance: "0",
    sequence: 3,
    ...override,
  };
}

describe("assignToAccountRaw", () => {
  it("should correctly persist empty cosmosResources and stakingResources", () => {
    const account = {
      cosmosResources: createEmptyStakingResources() as CosmosResources,
      stakingResources: createEmptyStakingResources(),
    } as CosmosAccount;
    const accountRaw = {} as unknown as CosmosAccountRaw;

    assignToAccountRaw(account, accountRaw);

    expect(accountRaw.stakingResources).toEqual({
      delegations: [],
      redelegations: [],
      unbondings: [],
      delegatedBalance: "0",
      pendingRewardsBalance: "0",
      unbondingBalance: "0",
    });

    expect(accountRaw.cosmosResources).toEqual(accountRaw.stakingResources);
  });

  it("should correctly persist cosmosResources and stakingResources", () => {
    const now = new Date();
    const resources = makeResources({
      delegations: [
        {
          validatorAddress: "0x123456",
          amount: BigNumber("0"),
          pendingRewards: BigNumber("1"),
          status: "bonded",
        },
      ],
      redelegations: [],
      unbondings: [
        {
          validatorAddress: "0x789",
          amount: BigNumber("0"),
          completionDate: now,
        },
        {
          validatorAddress: "0x123",
          amount: BigNumber("1"),
          completionDate: now,
        },
      ],
      delegatedBalance: BigNumber("0"),
      pendingRewardsBalance: BigNumber("1"),
      unbondingBalance: BigNumber("2"),
      sequence: 123456789,
      publicKey: "0x123456789",
    });

    const account = {
      cosmosResources: resources,
      stakingResources: resources,
    } as CosmosAccount;
    const accountRaw = {} as CosmosAccountRaw;

    assignToAccountRaw(account, accountRaw);

    expect(accountRaw.stakingResources).toEqual({
      delegations: [
        {
          validatorAddress: "0x123456",
          amount: "0",
          pendingRewards: "1",
          status: "bonded",
        },
      ],
      redelegations: [],
      unbondings: [
        {
          validatorAddress: "0x789",
          amount: "0",
          completionDate: now.toString(),
        },
        {
          validatorAddress: "0x123",
          amount: "1",
          completionDate: now.toString(),
        },
      ],
      delegatedBalance: "0",
      pendingRewardsBalance: "1",
      unbondingBalance: "2",
      sequence: 123456789,
      publicKey: "0x123456789",
    });
    expect(account.cosmosResources).toEqual(account.stakingResources);
  });

  it("preserves the 'activating' delegation status when persisting stakingResources", () => {
    const stakingResources = makeResources({
      delegations: [
        {
          validatorAddress: "0xabc",
          amount: BigNumber("10"),
          pendingRewards: BigNumber("0"),
          status: "activating",
        },
      ],
    });

    const account = {
      cosmosResources: createEmptyStakingResources() as CosmosResources,
      stakingResources,
    } as CosmosAccount;
    const accountRaw = {} as CosmosAccountRaw;

    assignToAccountRaw(account, accountRaw);

    expect(accountRaw.stakingResources.delegations[0].status).toBe("activating");
  });
});

describe("assignFromAccountRaw", () => {
  it("should correctly persist empty cosmosResources and stakingResources", () => {
    const accountRaw = {
      cosmosResources: createEmptyStakingResources() as CosmosResources,
      stakingResources: createEmptyStakingResources(),
    } as unknown as CosmosAccountRaw;
    const account = {} as CosmosAccount;

    assignFromAccountRaw(accountRaw, account);

    expect(account.stakingResources).toEqual({
      delegations: [],
      redelegations: [],
      unbondings: [],
      delegatedBalance: BigNumber("0"),
      pendingRewardsBalance: BigNumber("0"),
      unbondingBalance: BigNumber("0"),
    });

    expect(accountRaw.cosmosResources).toEqual(account.stakingResources);
  });

  it("should correctly persist cosmosResources and stakingResources", () => {
    const now = new Date();
    const resourcesRaw = makeRawResources({
      delegations: [
        {
          validatorAddress: "0x123456",
          amount: "0",
          pendingRewards: "1",
          status: "bonded",
        },
      ],
      redelegations: [],
      unbondings: [
        {
          validatorAddress: "0x789",
          amount: "0",
          completionDate: now.toISOString(),
        },
        {
          validatorAddress: "0x123",
          amount: "1",
          completionDate: now.toISOString(),
        },
      ],
      delegatedBalance: "0",
      pendingRewardsBalance: "1",
      unbondingBalance: "2",
      sequence: 123456789,
      publicKey: "0x123456789",
    });

    const accountRaw = {
      cosmosResources: resourcesRaw,
      stakingResources: resourcesRaw,
    } as unknown as CosmosAccountRaw;
    const account = {} as CosmosAccount;

    assignFromAccountRaw(accountRaw, account);

    expect(account.stakingResources).toEqual({
      delegations: [
        {
          validatorAddress: "0x123456",
          amount: BigNumber(0),
          pendingRewards: BigNumber(1),
          status: "bonded",
        },
      ],
      redelegations: [],
      unbondings: [
        {
          validatorAddress: "0x789",
          amount: BigNumber(0),
          completionDate: now,
        },
        {
          validatorAddress: "0x123",
          amount: BigNumber(1),
          completionDate: now,
        },
      ],
      delegatedBalance: BigNumber(0),
      pendingRewardsBalance: BigNumber(1),
      unbondingBalance: BigNumber(2),
      sequence: 123456789,
      publicKey: "0x123456789",
    });
    expect(account.cosmosResources).toEqual(account.stakingResources);
  });

  it("preserves the 'activating' delegation status when hydrating stakingResources", () => {
    const stakingResourcesRaw = makeRawResources({
      delegations: [
        {
          validatorAddress: "0xabc",
          amount: "10",
          pendingRewards: "0",
          status: "activating",
        },
      ],
    });

    const accountRaw = {
      cosmosResources: makeRawResources(),
      stakingResources: stakingResourcesRaw,
    } as unknown as CosmosAccountRaw;
    const account = {} as CosmosAccount;

    assignFromAccountRaw(accountRaw, account);

    expect(account.stakingResources.delegations[0].status).toBe("activating");
  });
});

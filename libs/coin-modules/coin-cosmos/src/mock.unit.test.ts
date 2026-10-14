import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { BigNumber } from "bignumber.js";
import Prando from "prando";
import mock from "./mock";
import type { CosmosAccount, CosmosDelegation } from "./types";

const currency = getCryptoCurrencyById("cosmos");

function makeAccount(balance: BigNumber): CosmosAccount {
  return {
    type: "Account",
    id: "mock_account_1",
    freshAddress: "cosmos1mockaddressmockaddressmockaddr",
    currency,
    balance,
    spendableBalance: balance,
    blockHeight: 12_000_000,
    operations: [],
    operationsCount: 0,
    cosmosResources: {
      delegations: [],
      redelegations: [],
      unbondings: [],
      delegatedBalance: new BigNumber(0),
      pendingRewardsBalance: new BigNumber(0),
      unbondingBalance: new BigNumber(0),
      sequence: 0,
    },
    stakingResources: {
      delegations: [],
      redelegations: [],
      unbondings: [],
      delegatedBalance: new BigNumber(0),
      pendingRewardsBalance: new BigNumber(0),
      unbondingBalance: new BigNumber(0),
    },
  } as unknown as CosmosAccount;
}

describe("mock genAccountEnhanceOperations", () => {
  it("mirrors every field of the generated cosmosResources into stakingResources", () => {
    const rng = new Prando("cosmos-mock-seed-1");
    const account = makeAccount(new BigNumber(100_000_000));

    mock.genAccountEnhanceOperations(account, rng);

    // genAccountEnhanceOperations delegates, redelegates, claims and undelegates in sequence —
    // by the end cosmosResources has gone through several setCosmosResources calls, and
    // stakingResources must track it exactly at every step, not just on the first write.
    expect(account.stakingResources.delegations).toEqual(account.cosmosResources.delegations);
    expect(account.stakingResources.redelegations).toEqual(account.cosmosResources.redelegations);
    expect(account.stakingResources.unbondings).toEqual(account.cosmosResources.unbondings);
    expect(account.stakingResources.delegatedBalance).toEqual(
      account.cosmosResources.delegatedBalance,
    );
    expect(account.stakingResources.pendingRewardsBalance).toEqual(
      account.cosmosResources.pendingRewardsBalance,
    );
    expect(account.stakingResources.unbondingBalance).toEqual(
      account.cosmosResources.unbondingBalance,
    );

    // The redelegate/claim/undelegate steps only run once there are delegations to act on.
    expect(account.stakingResources.delegations.length).toBeGreaterThan(0);
    expect(account.stakingResources.redelegations.length).toBeGreaterThan(0);
    expect(account.stakingResources.unbondings.length).toBeGreaterThan(0);
  });

  it("leaves stakingResources at their initial empty state when spendableBalance is zero", () => {
    const rng = new Prando("cosmos-mock-seed-zero");
    const account = makeAccount(new BigNumber(0));

    mock.genAccountEnhanceOperations(account, rng);

    expect(account.stakingResources.delegations).toEqual([]);
    expect(account.stakingResources.redelegations).toEqual([]);
    expect(account.stakingResources.unbondings).toEqual([]);
  });

  it("accumulates unbondingBalance across successive undelegations instead of overwriting it", () => {
    const rng = new Prando("cosmos-mock-seed-2");
    const account = makeAccount(new BigNumber(500_000_000));

    mock.genAccountEnhanceOperations(account, rng);
    const firstUnbondingBalance = account.stakingResources.unbondingBalance;

    // Run the whole generation pipeline again on the same account: addUndelegationOperation
    // computes `resolvedUnbondingBalance` by adding onto the existing balance, so a second pass
    // must grow it rather than replace it.
    mock.genAccountEnhanceOperations(account, rng);

    expect(account.stakingResources.unbondingBalance.gte(firstUnbondingBalance)).toBe(true);
    expect(account.stakingResources.unbondingBalance).toEqual(
      account.cosmosResources.unbondingBalance,
    );
  });
});

describe("mock postScanAccount", () => {
  const populatedResources = (): CosmosDelegation[] => [
    {
      validatorAddress: "cosmosvaloper1qwl879nx9t6kef4supyazayf7vjhennyh568ys",
      amount: new BigNumber(1000),
      pendingRewards: new BigNumber(10),
      status: "bonded",
    },
  ];

  it("resets stakingResources to empty alongside cosmosResources when the account is empty", () => {
    const account = makeAccount(new BigNumber(1_000_000));
    account.cosmosResources = {
      delegations: populatedResources(),
      redelegations: [],
      unbondings: [],
      delegatedBalance: new BigNumber(1000),
      pendingRewardsBalance: new BigNumber(10),
      unbondingBalance: new BigNumber(0),
      sequence: 3,
    };
    account.stakingResources = {
      delegations: populatedResources(),
      redelegations: [],
      unbondings: [],
      delegatedBalance: new BigNumber(1000),
      pendingRewardsBalance: new BigNumber(10),
      unbondingBalance: new BigNumber(0),
    };
    account.operations = [{ id: "op1" } as unknown as CosmosAccount["operations"][number]];

    mock.postScanAccount(account, { isEmpty: true });

    expect(account.stakingResources).toEqual({
      delegations: [],
      redelegations: [],
      unbondings: [],
      delegatedBalance: new BigNumber(0),
      pendingRewardsBalance: new BigNumber(0),
      unbondingBalance: new BigNumber(0),
    });
    expect(account.operations).toEqual([]);
  });

  it("leaves stakingResources untouched when the account is not empty", () => {
    const account = makeAccount(new BigNumber(1_000_000));
    const stakingResources = {
      delegations: populatedResources(),
      redelegations: [],
      unbondings: [],
      delegatedBalance: new BigNumber(1000),
      pendingRewardsBalance: new BigNumber(10),
      unbondingBalance: new BigNumber(0),
    };
    account.stakingResources = stakingResources;

    mock.postScanAccount(account, { isEmpty: false });

    expect(account.stakingResources).toBe(stakingResources);
  });
});

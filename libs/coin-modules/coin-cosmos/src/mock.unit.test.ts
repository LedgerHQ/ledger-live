import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { BigNumber } from "bignumber.js";
import Prando from "prando";
import mock from "./mock";
import type { StakingAccount, StakingDelegation } from "@ledgerhq/types-live";
import type { CosmosAccount } from "./types";

type TestAccount = CosmosAccount & StakingAccount;

const currency = getCryptoCurrencyById("cosmos");

function makeAccount(balance: BigNumber): TestAccount {
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
    sequence: 0,
    stakingResources: {
      delegations: [],
      redelegations: [],
      unbondings: [],
      delegatedBalance: new BigNumber(0),
      pendingRewardsBalance: new BigNumber(0),
      unbondingBalance: new BigNumber(0),
    },
  } as unknown as TestAccount;
}

describe("mock genAccountEnhanceOperations", () => {
  it("generates delegations, redelegations and unbondings and bumps the sequence at every step", () => {
    const rng = new Prando("cosmos-mock-seed-1");
    const account = makeAccount(new BigNumber(100_000_000));

    mock.genAccountEnhanceOperations(account, rng);

    // The redelegate/claim/undelegate steps only run once there are delegations to act on.
    expect(account.stakingResources.delegations.length).toBeGreaterThan(0);
    expect(account.stakingResources.redelegations.length).toBeGreaterThan(0);
    expect(account.stakingResources.unbondings.length).toBeGreaterThan(0);
    // delegate, redelegate, claim, undelegate, delegate
    expect(account.sequence).toBe(5);
  });

  it("starts from empty staking resources when the account has none", () => {
    const rng = new Prando("cosmos-mock-seed-no-staking");
    const account = makeAccount(new BigNumber(100_000_000));
    delete (account as Partial<TestAccount>).stakingResources;

    mock.genAccountEnhanceOperations(account, rng);

    expect(account.stakingResources.delegations.length).toBeGreaterThan(0);
  });

  it("leaves stakingResources at their initial empty state when spendableBalance is zero", () => {
    const rng = new Prando("cosmos-mock-seed-zero");
    const account = makeAccount(new BigNumber(0));

    mock.genAccountEnhanceOperations(account, rng);

    expect(account.stakingResources.delegations).toEqual([]);
    expect(account.stakingResources.redelegations).toEqual([]);
    expect(account.stakingResources.unbondings).toEqual([]);
    expect(account.sequence).toBe(0);
  });

  it("accumulates unbondingBalance across successive undelegations instead of overwriting it", () => {
    const rng = new Prando("cosmos-mock-seed-2");
    const account = makeAccount(new BigNumber(500_000_000));

    mock.genAccountEnhanceOperations(account, rng);
    const firstUnbondingBalance = account.stakingResources.unbondingBalance;

    // Run the whole generation pipeline again on the same account: addUndelegationOperation
    // adds onto the existing unbonding balance, so a second pass must grow it, not replace it.
    mock.genAccountEnhanceOperations(account, rng);

    expect(account.stakingResources.unbondingBalance.gte(firstUnbondingBalance)).toBe(true);
  });
});

describe("mock postScanAccount", () => {
  const populatedResources = (): StakingDelegation[] => [
    {
      validatorAddress: "cosmosvaloper1qwl879nx9t6kef4supyazayf7vjhennyh568ys",
      amount: new BigNumber(1000),
      pendingRewards: new BigNumber(10),
      status: "bonded",
    },
  ];

  it("resets stakingResources and sequence when the account is empty", () => {
    const account = makeAccount(new BigNumber(1_000_000));
    account.sequence = 3;
    account.stakingResources = {
      delegations: populatedResources(),
      redelegations: [],
      unbondings: [],
      delegatedBalance: new BigNumber(1000),
      pendingRewardsBalance: new BigNumber(10),
      unbondingBalance: new BigNumber(0),
    };
    account.operations = [{ id: "op1" } as unknown as TestAccount["operations"][number]];

    mock.postScanAccount(account, { isEmpty: true });

    expect(account.stakingResources).toEqual({
      delegations: [],
      redelegations: [],
      unbondings: [],
      delegatedBalance: new BigNumber(0),
      pendingRewardsBalance: new BigNumber(0),
      unbondingBalance: new BigNumber(0),
    });
    expect(account.sequence).toBe(0);
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

describe("mock on a non-cosmos account", () => {
  const notCosmos = { currency: { family: "evm" } } as unknown as TestAccount;

  it("refuses to post sync it", () => {
    expect(() => mock.postSyncAccount(notCosmos)).toThrow(
      "postSyncAccount must be called with a CosmosAccount type parameter",
    );
  });

  it("refuses to post scan it", () => {
    expect(() => mock.postScanAccount(notCosmos, { isEmpty: true })).toThrow(
      "postScanAccount from cosmos must be used with a CosmosAccount type as parameter",
    );
  });
});

import BigNumber from "bignumber.js";
import type { Account, StakingAccount, StakingResources } from "@ledgerhq/types-live";
import { createEmptyStakingResources } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { registerAllCoins } from "../../coin-modules/load-all-coins";
import { mockTronAccount } from "../../families/tron/accountData.mock";
import { genAccount } from "../../mock/account";
import { toAccountStaking } from "./staking";

registerAllCoins();

const accountOf = (currencyId: string): Account => ({
  ...genAccount(`staking-${currencyId}`, { currency: getCryptoCurrencyById("ethereum") }),
  currency: getCryptoCurrencyById(currencyId),
});

const cosmosOf = (stakingResources: StakingResources): StakingAccount => ({
  ...accountOf("cosmos"),
  stakingResources,
});

const completionDate = new Date("2026-12-01T00:00:00.000Z");

const resources: StakingResources = {
  ...createEmptyStakingResources(),
  delegations: [
    {
      validatorAddress: "cosmosvaloper1a",
      amount: new BigNumber(1000),
      pendingRewards: new BigNumber(15),
      status: "bonded",
    },
    {
      validatorAddress: "cosmosvaloper1b",
      amount: new BigNumber(200),
      pendingRewards: new BigNumber(0),
      status: "activating",
    },
    {
      validatorAddress: "cosmosvaloper1c",
      amount: new BigNumber(300),
      pendingRewards: new BigNumber(1),
      status: "unbonding",
    },
  ],
  redelegations: [
    {
      validatorSrcAddress: "cosmosvaloper1c",
      validatorDstAddress: "cosmosvaloper1a",
      amount: new BigNumber(1000),
      completionDate,
    },
  ],
  unbondings: [
    { validatorAddress: "cosmosvaloper1a", amount: new BigNumber(50), completionDate },
    {
      validatorAddress: "cosmosvaloper1b",
      amount: new BigNumber(7),
      completionDate,
      status: "withdrawable",
      positionId: "stake-account",
    },
  ],
};

describe("toAccountStaking", () => {
  it("answers no position for an account that does not stake", async () => {
    expect(await toAccountStaking(accountOf("ethereum"))).toEqual({ positions: [] });
  });

  it("maps delegations to staked positions and unbondings to unlocking ones", async () => {
    const { positions } = await toAccountStaking(cosmosOf(resources));
    expect(positions).toEqual([
      {
        id: "delegation:cosmosvaloper1a:0",
        assetId: "cosmos",
        validatorId: "cosmosvaloper1a",
        state: "active",
        amount: "1000",
        rewards: "15",
        redelegatingFrom: {
          validatorId: "cosmosvaloper1c",
          completesAt: "2026-12-01T00:00:00.000Z",
        },
      },
      {
        id: "delegation:cosmosvaloper1b:1",
        assetId: "cosmos",
        validatorId: "cosmosvaloper1b",
        state: "activating",
        amount: "200",
        rewards: "0",
      },
      {
        id: "delegation:cosmosvaloper1c:2",
        assetId: "cosmos",
        validatorId: "cosmosvaloper1c",
        state: "active",
        amount: "300",
        rewards: "1",
      },
      {
        id: `unbonding:cosmosvaloper1a:${completionDate.getTime()}:0`,
        assetId: "cosmos",
        validatorId: "cosmosvaloper1a",
        state: "deactivating",
        amount: "50",
        unlockAt: "2026-12-01T00:00:00.000Z",
      },
      {
        id: "unbonding:stake-account",
        assetId: "cosmos",
        validatorId: "cosmosvaloper1b",
        state: "withdrawable",
        amount: "7",
        unlockAt: "2026-12-01T00:00:00.000Z",
      },
    ]);
  });

  it("marks the destination of a redelegation rather than adding a position", async () => {
    const { positions } = await toAccountStaking(cosmosOf(resources));
    expect(positions.filter(({ amount }) => amount === "1000")).toHaveLength(1);
    expect(positions.filter(({ redelegatingFrom }) => redelegatingFrom)).toHaveLength(1);
  });

  it("keeps the redelegation completing last when a destination has several", async () => {
    const later = new Date("2026-12-20T00:00:00.000Z");
    const [redelegation] = resources.redelegations;
    const stakingResources = {
      ...resources,
      redelegations: [
        redelegation,
        { ...redelegation, validatorSrcAddress: "cosmosvaloper1b", completionDate: later },
        { ...redelegation, validatorSrcAddress: "cosmosvaloper1d" },
      ],
    };
    const [position] = (await toAccountStaking(cosmosOf(stakingResources))).positions;
    expect(position.redelegatingFrom).toEqual({
      validatorId: "cosmosvaloper1b",
      completesAt: later.toISOString(),
    });
  });

  it("adds the positions and rewards the family keeps in its own resources", async () => {
    const account = mockTronAccount({
      votes: [{ name: "sr", address: "TSR", voteCount: 3 }],
      unwithdrawnReward: new BigNumber(42),
    });
    expect(await toAccountStaking(account)).toEqual({
      positions: [
        {
          id: "vote:TSR",
          assetId: "tron",
          validatorId: "TSR",
          state: "active",
          amount: "3000000",
          votes: "3",
        },
      ],
      rewards: [{ assetId: "tron", amount: "42" }],
    });
  });

  it("maps the positions kept by the generic bridge, native ones only", async () => {
    const account = {
      ...accountOf("tezos"),
      stakingPositions: [
        {
          uid: "tz1:delegation",
          address: "tz1",
          delegate: "tz1baker",
          state: "active",
          actions: ["undelegate"],
          asset: { type: "native" },
          amount: new BigNumber(500),
          amountDeposited: new BigNumber(490),
          amountRewarded: new BigNumber(10),
        },
        { uid: "tz1:unstake", state: "deactivating", amount: new BigNumber(20) },
        {
          uid: "tz1:token",
          state: "active",
          asset: { type: "fa2", assetReference: "KT1" },
          amount: new BigNumber(1),
        },
      ],
    };
    expect((await toAccountStaking(account)).positions).toEqual([
      {
        id: "tz1:delegation",
        assetId: "tezos",
        validatorId: "tz1baker",
        state: "active",
        amount: "500",
        deposited: "490",
        rewards: "10",
        actions: ["undelegate"],
      },
      { id: "tz1:unstake", assetId: "tezos", state: "deactivating", amount: "20" },
    ]);
  });

  it("floors a negative amount at zero", async () => {
    const stakingResources = {
      ...resources,
      delegations: [{ ...resources.delegations[0], amount: new BigNumber(-1) }],
      unbondings: [],
    };
    const [position] = (await toAccountStaking(cosmosOf(stakingResources))).positions;
    expect(position.amount).toBe("0");
  });
});

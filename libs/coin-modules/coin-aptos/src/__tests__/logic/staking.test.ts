import BigNumber from "bignumber.js";
import { createFixtureAccount } from "../../bridge/bridge.fixture";
import { MIN_COINS_ON_SHARES_POOL } from "../../constants";
import {
  canRestake,
  canStake,
  canUnstake,
  canWithdraw,
  getDelegationOpMaxAmount,
  mapStakingPositions,
} from "../../logic/staking";

const stakingPositions = [
  {
    active: BigNumber(123456789),
    inactive: BigNumber(567567567),
    pendingInactive: BigNumber(5345),
    validatorId: "validator-1",
  },
  {
    active: BigNumber(0),
    inactive: BigNumber(33333),
    pendingInactive: BigNumber(67868678),
    validatorId: "validator-2",
  },
  {
    active: BigNumber(45864986459),
    inactive: BigNumber(0),
    pendingInactive: BigNumber(0),
    validatorId: "validator-3",
  },
];

const nonBreakableSpace = " ";

describe("mapStakingPositions", () => {
  it("returns the staking positions per validator", () => {
    const validators = [
      {
        activeStake: BigNumber(8972343459783425),
        commission: BigNumber(8),
        address: "validator-1",
        name: "validator-1",
        shares: "no-shares",
      },
      {
        activeStake: BigNumber(172343459783425),
        commission: BigNumber(8),
        address: "validator-2",
        name: "validator-2",
        shares: "no-shares",
      },
      {
        activeStake: BigNumber(1743459783425),
        commission: BigNumber(7),
        address: "validator-3",
        name: "validator-3",
        shares: "no-shares",
      },
    ];

    const expected = [
      {
        active: BigNumber("123456789"),
        inactive: BigNumber("567567567"),
        pendingInactive: BigNumber("5345"),
        validatorId: "validator-1",
        formattedAmount: `1.23456${nonBreakableSpace}APT`,
        formattedPending: `0.00005345${nonBreakableSpace}APT`,
        formattedAvailable: `5.67567${nonBreakableSpace}APT`,
        rank: 0,
        validator: {
          activeStake: BigNumber("8972343459783425"),
          commission: BigNumber("8"),
          address: "validator-1",
          name: "validator-1",
          shares: "no-shares",
        },
      },
      {
        active: BigNumber("0"),
        inactive: BigNumber("33333"),
        pendingInactive: BigNumber("67868678"),
        validatorId: "validator-2",
        formattedAmount: `0${nonBreakableSpace}APT`,
        formattedPending: `0.678686${nonBreakableSpace}APT`,
        formattedAvailable: `0.00033333${nonBreakableSpace}APT`,
        rank: 1,
        validator: {
          activeStake: BigNumber("172343459783425"),
          commission: BigNumber("8"),
          address: "validator-2",
          name: "validator-2",
          shares: "no-shares",
        },
      },
      {
        active: BigNumber("45864986459"),
        inactive: BigNumber("0"),
        pendingInactive: BigNumber("0"),
        validatorId: "validator-3",
        formattedAmount: `458.649${nonBreakableSpace}APT`,
        formattedPending: `0${nonBreakableSpace}APT`,
        formattedAvailable: `0${nonBreakableSpace}APT`,
        rank: 2,
        validator: {
          activeStake: BigNumber("1743459783425"),
          commission: BigNumber("7"),
          address: "validator-3",
          name: "validator-3",
          shares: "no-shares",
        },
      },
    ];

    expect(
      mapStakingPositions(stakingPositions, validators, {
        name: "Aptos",
        code: "APT",
        magnitude: 8,
      }),
    ).toMatchObject(expected);
  });
});

describe("canStake", () => {
  it(`returns false for an account with a balance with less than ${MIN_COINS_ON_SHARES_POOL} APT`, () => {
    const account = createFixtureAccount({
      balance: BigNumber(5),
      spendableBalance: BigNumber(5),
    });
    const expected = canStake(account);
    expect(expected).toBe(false);
  });

  it(`returns true for an account with balance with more than ${MIN_COINS_ON_SHARES_POOL} APT`, () => {
    const account = createFixtureAccount({
      balance: BigNumber(1212312312312),
      spendableBalance: BigNumber(1212312312312),
    });
    const expected = canStake(account);
    expect(expected).toBe(true);
  });
});

describe("canUnstake", () => {
  it("returns true if there's no amount staked", () => {
    const expected = canUnstake(stakingPositions[0]);
    expect(expected).toBe(true);
  });

  it("returns false if there's no amount staked", () => {
    const expected = canUnstake(stakingPositions[1]);
    expect(expected).toBe(false);
  });
});

describe("canWithdraw", () => {
  it("returns true if there's no amount inactive", () => {
    const expected = canWithdraw(stakingPositions[0]);
    expect(expected).toBe(true);
  });

  it("returns false if there's no amount inactive", () => {
    const expected = canWithdraw(stakingPositions[2]);
    expect(expected).toBe(false);
  });
});

describe("canRestake", () => {
  it("returns true if there's no amount inactive", () => {
    const expected = canRestake(stakingPositions[0]);
    expect(expected).toBe(true);
  });

  it("returns false if there's no amount inactive", () => {
    const expected = canRestake(stakingPositions[2]);
    expect(expected).toBe(false);
  });
});

describe("getDelegationOpMaxAmount", () => {
  it("get maximum amount available to unstake", () => {
    const account = createFixtureAccount({
      aptosResources: {
        activeBalance: BigNumber(45988443248),
        pendingInactiveBalance: BigNumber(67874023),
        inactiveBalance: BigNumber(567600900),
        stakingPositions,
      },
    });
    const expected = getDelegationOpMaxAmount(account, "validator-1", "unstake");
    expect(expected).toEqual(BigNumber(123456789));
  });

  it("get maximum amount available to withdraw", () => {
    const account = createFixtureAccount({
      aptosResources: {
        activeBalance: BigNumber(45988443248),
        pendingInactiveBalance: BigNumber(67874023),
        inactiveBalance: BigNumber(567600900),
        stakingPositions,
      },
    });
    const expected = getDelegationOpMaxAmount(account, "validator-1", "withdraw");
    expect(expected).toEqual(BigNumber(567567567));
  });

  it("get maximum amount available to restake", () => {
    const account = createFixtureAccount({
      aptosResources: {
        activeBalance: BigNumber(45988443248),
        pendingInactiveBalance: BigNumber(67874023),
        inactiveBalance: BigNumber(567600900),
        stakingPositions,
      },
    });
    const expected = getDelegationOpMaxAmount(account, "validator-1", "restake");
    expect(expected).toEqual(BigNumber(5345));
  });
});

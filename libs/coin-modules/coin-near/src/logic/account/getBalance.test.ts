import { BigNumber } from "bignumber.js";
import { getAccount } from "../../network";
import { getYoctoThreshold } from "../../logic";
import { getBalance } from "./getBalance";

jest.mock("../../network", () => ({ getAccount: jest.fn() }));

const ADDRESS = "delegator.near";
const VALIDATOR = "astro-stakers.poolv1.near";
const STAKED = getYoctoThreshold().multipliedBy(4);

/** The storage deposit plus the minimum-balance buffer, as `getAccount` reports it. */
const RESERVE = new BigNumber("51820000000000000000000");
const ONE_NEAR = new BigNumber("1000000000000000000000000");

type Position = {
  validatorId: string;
  staked: BigNumber;
  available: BigNumber;
  pending: BigNumber;
};

/** Mirrors what `getAccount` derives: `balance` folds the staking buckets into the raw amount. */
const accountShape = ({
  amount,
  reserve = RESERVE,
  positions = [],
}: {
  amount: BigNumber;
  reserve?: BigNumber;
  positions?: Position[];
}) => {
  const staked = positions.reduce((acc, p) => acc.plus(p.staked), new BigNumber(0));
  const available = positions.reduce((acc, p) => acc.plus(p.available), new BigNumber(0));
  const pending = positions.reduce((acc, p) => acc.plus(p.pending), new BigNumber(0));

  return {
    blockHeight: 140_000_000,
    balance: amount.plus(staked).plus(available).plus(pending),
    spendableBalance: BigNumber.max(0, amount.minus(reserve)),
    nearResources: {
      stakedBalance: staked,
      availableBalance: available,
      pendingBalance: pending,
      storageUsageBalance: reserve,
      stakingPositions: positions,
    },
  };
};

const position = (overrides: Partial<Position> = {}): Position => ({
  validatorId: VALIDATOR,
  staked: new BigNumber(0),
  available: new BigNumber(0),
  pending: new BigNumber(0),
  ...overrides,
});

describe("getBalance", () => {
  beforeEach(() => jest.clearAllMocks());

  it("puts the native total first, so the framework reads it as the account balance", async () => {
    (getAccount as jest.Mock).mockResolvedValue(accountShape({ amount: ONE_NEAR }));

    const balances = await getBalance(ADDRESS);

    expect(balances[0].asset).toEqual({ type: "native" });
    expect(balances[0].stake).toBeUndefined();
    expect(balances[0].value).toBe(BigInt(ONE_NEAR.toFixed(0)));
  });

  it("reproduces the account bridge's spendable balance as value - locked", async () => {
    const shape = accountShape({ amount: ONE_NEAR });
    (getAccount as jest.Mock).mockResolvedValue(shape);

    const [native] = await getBalance(ADDRESS);

    expect(native.locked).toBe(BigInt(RESERVE.toFixed(0)));
    expect(native.value - native.locked!).toBe(BigInt(shape.spendableBalance.toFixed(0)));
  });

  it("reports nothing for an account that does not exist", async () => {
    (getAccount as jest.Mock).mockResolvedValue(
      accountShape({ amount: new BigNumber(0), reserve: RESERVE }),
    );

    const [native] = await getBalance(ADDRESS);

    expect(native.value).toBe(0n);
    expect(native.locked).toBe(0n);
  });

  it("never locks more than the account holds, when the balance is under the reserve", async () => {
    const amount = new BigNumber("10000000000000000000000"); // 0.01 NEAR, below the reserve
    const shape = accountShape({ amount });
    (getAccount as jest.Mock).mockResolvedValue(shape);

    const [native] = await getBalance(ADDRESS);

    expect(native.value).toBe(BigInt(amount.toFixed(0)));
    expect(native.locked).toBe(BigInt(amount.toFixed(0)));
    expect(native.value - native.locked!).toBe(0n);
    expect(shape.spendableBalance.isZero()).toBe(true);
  });

  it("adds one entry per staking position and keeps the account total as the native value", async () => {
    const shape = accountShape({
      amount: ONE_NEAR,
      positions: [position({ staked: STAKED })],
    });
    (getAccount as jest.Mock).mockResolvedValue(shape);

    const balances = await getBalance(ADDRESS);

    expect(balances).toHaveLength(2);
    expect(balances[0].value).toBe(BigInt(shape.balance.toFixed(0)));
    expect(balances[0].value - balances[0].locked!).toBe(BigInt(shape.spendableBalance.toFixed(0)));
    expect(balances[1]).toMatchObject({
      value: BigInt(STAKED.toFixed(0)),
      asset: { type: "native" },
      stake: { delegate: VALIDATOR, state: "active" },
    });
  });

  it("locks every staking bucket so the total stays spendable-accurate", async () => {
    const shape = accountShape({
      amount: ONE_NEAR,
      positions: [position({ staked: STAKED, available: STAKED, pending: STAKED })],
    });
    (getAccount as jest.Mock).mockResolvedValue(shape);

    const balances = await getBalance(ADDRESS);

    expect(balances[0].value).toBe(BigInt(shape.balance.toFixed(0)));
    expect(balances[0].value - balances[0].locked!).toBe(BigInt(shape.spendableBalance.toFixed(0)));
    expect(balances.filter(b => b.stake !== undefined)).toHaveLength(3);
  });
});

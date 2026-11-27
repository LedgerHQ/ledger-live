import type { Balance } from "@ledgerhq/coin-module-framework/api/index";
import { mockNearContext } from "../../test/context";
import BigNumber from "bignumber.js";
import { getAccount } from "../../network";
import { getYoctoThreshold } from "../../logic";
import { getBalance } from "../getBalance";

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
  // Like `getStakingPositions`, the totals leave out each bucket below the staking threshold.
  const sumAbove = (pick: (p: Position) => BigNumber) =>
    positions.reduce(
      (acc, p) => (pick(p).gte(getYoctoThreshold()) ? acc.plus(pick(p)) : acc),
      new BigNumber(0),
    );
  const staked = sumAbove(p => p.staked);
  const available = sumAbove(p => p.available);
  const pending = sumAbove(p => p.pending);

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

const sum = (balances: Balance[], pick: (b: Balance) => bigint): bigint =>
  balances.reduce((total, b) => total + pick(b), 0n);

describe("getBalance", () => {
  beforeEach(() => jest.clearAllMocks());

  it("puts the liquid funds first, as a plain native entry", async () => {
    (getAccount as jest.Mock).mockResolvedValue(accountShape({ amount: ONE_NEAR }));

    const balances = await getBalance(mockNearContext, ADDRESS);

    expect(balances).toHaveLength(1);
    expect(balances[0].asset).toEqual({ type: "native" });
    expect(balances[0].stake).toBeUndefined();
    expect(balances[0].value).toBe(BigInt(ONE_NEAR.toFixed(0)));
  });

  it("reproduces the account bridge's spendable balance as value - locked", async () => {
    const shape = accountShape({ amount: ONE_NEAR });
    (getAccount as jest.Mock).mockResolvedValue(shape);

    const [native] = await getBalance(mockNearContext, ADDRESS);

    expect(native.locked).toBe(BigInt(RESERVE.toFixed(0)));
    expect(native.value - native.locked!).toBe(BigInt(shape.spendableBalance.toFixed(0)));
  });

  it("reports nothing for an account that does not exist", async () => {
    (getAccount as jest.Mock).mockResolvedValue(
      accountShape({ amount: new BigNumber(0), reserve: RESERVE }),
    );

    const [native] = await getBalance(mockNearContext, ADDRESS);

    expect(native.value).toBe(0n);
    expect(native.locked).toBe(0n);
  });

  it("never locks more than the account holds, when the balance is under the reserve", async () => {
    const amount = new BigNumber("10000000000000000000000"); // 0.01 NEAR, below the reserve
    const shape = accountShape({ amount });
    (getAccount as jest.Mock).mockResolvedValue(shape);

    const [native] = await getBalance(mockNearContext, ADDRESS);

    expect(native.value).toBe(BigInt(amount.toFixed(0)));
    expect(native.locked).toBe(BigInt(amount.toFixed(0)));
    expect(native.value - native.locked!).toBe(0n);
    expect(shape.spendableBalance.isZero()).toBe(true);
  });

  it("counts a staked position once: the native entries add up to the account total", async () => {
    const shape = accountShape({
      amount: ONE_NEAR,
      positions: [position({ staked: STAKED })],
    });
    (getAccount as jest.Mock).mockResolvedValue(shape);

    const balances = await getBalance(mockNearContext, ADDRESS);

    expect(balances).toHaveLength(2);
    expect(balances[0].stake).toBeUndefined();
    expect(balances[0].value).toBe(BigInt(ONE_NEAR.toFixed(0)));
    expect(balances[1]).toEqual({
      value: BigInt(STAKED.toFixed(0)),
      asset: { type: "native" },
      locked: BigInt(STAKED.toFixed(0)),
      stake: expect.objectContaining({ delegate: VALIDATOR, state: "active" }),
    });
    expect(sum(balances, b => b.value)).toBe(BigInt(shape.balance.toFixed(0)));
  });

  it("locks every staking bucket, so the summed entries keep the bridge's spendable", async () => {
    const shape = accountShape({
      amount: ONE_NEAR,
      positions: [position({ staked: STAKED, available: STAKED, pending: STAKED })],
    });
    (getAccount as jest.Mock).mockResolvedValue(shape);

    const balances = await getBalance(mockNearContext, ADDRESS);
    const stakes = balances.filter(b => b.stake !== undefined);

    expect(stakes).toHaveLength(3);
    stakes.forEach(b => expect(b.locked).toBe(b.value));
    expect(sum(balances, b => b.value)).toBe(BigInt(shape.balance.toFixed(0)));
    expect(sum(balances, b => b.value) - sum(balances, b => b.locked ?? 0n)).toBe(
      BigInt(shape.spendableBalance.toFixed(0)),
    );
  });

  it("keeps the bridge's balance and spendable when liquid funds are under the reserve with a stake", async () => {
    const amount = new BigNumber("10000000000000000000000"); // 0.01 NEAR, below the reserve
    const shape = accountShape({ amount, positions: [position({ staked: STAKED })] });
    (getAccount as jest.Mock).mockResolvedValue(shape);

    const balances = await getBalance(mockNearContext, ADDRESS);

    expect(balances[0]).toEqual({
      value: BigInt(amount.toFixed(0)),
      asset: { type: "native" },
      locked: BigInt(amount.toFixed(0)),
    });
    expect(sum(balances, b => b.value)).toBe(BigInt(shape.balance.toFixed(0)));
    expect(sum(balances, b => b.value) - sum(balances, b => b.locked ?? 0n)).toBe(
      BigInt(shape.spendableBalance.toFixed(0)),
    );
    expect(shape.spendableBalance.isZero()).toBe(true);
  });

  it("leaves pending dust out of both the entries and the account total", async () => {
    const dust = getYoctoThreshold().minus(1);
    const shape = accountShape({
      amount: ONE_NEAR,
      positions: [position({ staked: STAKED, pending: dust })],
    });
    (getAccount as jest.Mock).mockResolvedValue(shape);

    const balances = await getBalance(mockNearContext, ADDRESS);

    expect(balances.filter(b => b.stake !== undefined).map(b => b.stake!.state)).toEqual([
      "active",
    ]);
    expect(sum(balances, b => b.value)).toBe(BigInt(shape.balance.toFixed(0)));
  });

  it("keeps a zero liquid entry first when every unit is in a pool", async () => {
    const shape = accountShape({
      amount: new BigNumber(0),
      positions: [position({ staked: STAKED })],
    });
    (getAccount as jest.Mock).mockResolvedValue(shape);

    const balances = await getBalance(mockNearContext, ADDRESS);

    expect(balances[0]).toEqual({ value: 0n, asset: { type: "native" }, locked: 0n });
    expect(sum(balances, b => b.value)).toBe(BigInt(STAKED.toFixed(0)));
  });

  describe("validator options", () => {
    beforeEach(() => {
      (getAccount as jest.Mock).mockResolvedValue(accountShape({ amount: ONE_NEAR }));
    });

    it("reads the account with no staking option when called without options", async () => {
      await getBalance(mockNearContext, ADDRESS);

      expect(getAccount).toHaveBeenCalledWith(expect.anything(), ADDRESS, {});
    });

    it("forwards the known pools and the listing switch to the account read", async () => {
      await getBalance(mockNearContext, ADDRESS, {
        knownValidatorIds: [VALIDATOR],
        listValidators: false,
      });

      expect(getAccount).toHaveBeenCalledWith(expect.anything(), ADDRESS, {
        knownValidatorIds: [VALIDATOR],
        listValidators: false,
      });
    });

    it("forwards a listing switch alone", async () => {
      await getBalance(mockNearContext, ADDRESS, { listValidators: true });

      expect(getAccount).toHaveBeenCalledWith(expect.anything(), ADDRESS, {
        listValidators: true,
      });
    });
  });
});

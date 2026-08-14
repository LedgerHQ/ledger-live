import { mockNearConfig } from "../../test/context";
import type { Balance, Stake } from "@ledgerhq/coin-module-framework/api/index";
import { BigNumber } from "bignumber.js";
import { getStakingPositions } from "../../network";
import type { NearStakingPosition } from "../../network/sdk.types";
import { pooledAmount } from "../pooledAmount";

jest.mock("../../network", () => ({ getStakingPositions: jest.fn() }));

const ADDRESS = "delegator.near";
const VALIDATOR = "astro-stakers.poolv1.near";
const OTHER_VALIDATOR = "other-pool.poolv1.near";

const stakeBalance = (overrides: Partial<Stake> & Pick<Stake, "state" | "amount">): Balance => ({
  value: overrides.amount,
  asset: { type: "native" },
  stake: {
    uid: `${ADDRESS}:${overrides.delegate ?? VALIDATOR}:${overrides.state}`,
    address: ADDRESS,
    delegate: VALIDATOR,
    actions: [],
    asset: { type: "native" },
    ...overrides,
  },
});

const position = (overrides: Partial<NearStakingPosition> = {}): NearStakingPosition =>
  ({
    validatorId: VALIDATOR,
    staked: new BigNumber(0),
    available: new BigNumber(0),
    pending: new BigNumber(0),
    ...overrides,
  }) as NearStakingPosition;

describe("pooledAmount", () => {
  beforeEach(() => jest.clearAllMocks());

  it("sums active and activating stake entries for unstake, from balances alone", async () => {
    const balances: Balance[] = [
      stakeBalance({ state: "active", amount: 10n }),
      stakeBalance({ state: "activating", amount: 5n }),
      stakeBalance({ state: "withdrawable", amount: 3n }),
    ];

    await expect(
      pooledAmount(mockNearConfig, "unstake", ADDRESS, VALIDATOR, balances),
    ).resolves.toBe(15n);
    expect(getStakingPositions).not.toHaveBeenCalled();
  });

  it("sums only withdrawable stake entries for withdraw, from balances alone", async () => {
    const balances: Balance[] = [
      stakeBalance({ state: "active", amount: 10n }),
      stakeBalance({ state: "withdrawable", amount: 3n }),
    ];

    await expect(
      pooledAmount(mockNearConfig, "withdraw", ADDRESS, VALIDATOR, balances),
    ).resolves.toBe(3n);
    expect(getStakingPositions).not.toHaveBeenCalled();
  });

  it("ignores stake entries delegated to a different pool", async () => {
    const balances: Balance[] = [
      stakeBalance({ state: "active", amount: 10n, delegate: OTHER_VALIDATOR }),
    ];

    await expect(
      pooledAmount(mockNearConfig, "unstake", ADDRESS, VALIDATOR, balances),
    ).resolves.toBe(0n);
    expect(getStakingPositions).not.toHaveBeenCalled();
  });

  it("falls back to the network when balances carry no stake entries", async () => {
    (getStakingPositions as jest.Mock).mockResolvedValue({
      stakingPositions: [position({ staked: new BigNumber(20) })],
    });
    const balances: Balance[] = [{ value: 0n, asset: { type: "native" } }];

    await expect(
      pooledAmount(mockNearConfig, "unstake", ADDRESS, VALIDATOR, balances),
    ).resolves.toBe(20n);
    expect(getStakingPositions).toHaveBeenCalledWith(expect.anything(), ADDRESS);
  });

  it("falls back to the network when no balances are passed at all", async () => {
    (getStakingPositions as jest.Mock).mockResolvedValue({
      stakingPositions: [position({ available: new BigNumber(7) })],
    });

    await expect(
      pooledAmount(mockNearConfig, "withdraw", ADDRESS, VALIDATOR, undefined),
    ).resolves.toBe(7n);
    expect(getStakingPositions).toHaveBeenCalledWith(expect.anything(), ADDRESS);
  });

  it("returns 0 when the network has no position for the given pool", async () => {
    (getStakingPositions as jest.Mock).mockResolvedValue({
      stakingPositions: [position({ validatorId: OTHER_VALIDATOR, staked: new BigNumber(20) })],
    });

    await expect(
      pooledAmount(mockNearConfig, "unstake", ADDRESS, VALIDATOR, undefined),
    ).resolves.toBe(0n);
  });
});

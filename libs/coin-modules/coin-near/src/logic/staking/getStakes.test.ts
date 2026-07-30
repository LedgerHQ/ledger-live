import { BigNumber } from "bignumber.js";
import { getStakingPositions } from "../../network";
import type { NearStakingPosition } from "../../network/sdk.types";
import { getYoctoThreshold } from "../../logic";
import { getStakes, toStakes } from "./getStakes";

jest.mock("../../network", () => ({ getStakingPositions: jest.fn() }));

const ADDRESS = "delegator.near";
const VALIDATOR = "astro-stakers.poolv1.near";

const ABOVE_THRESHOLD = getYoctoThreshold().multipliedBy(3);
const BELOW_THRESHOLD = getYoctoThreshold().minus(1);

/** exactOptionalPropertyTypes is on, so an explicit `undefined` override needs the union. */
type Overrides<T> = { [K in keyof T]?: T[K] | undefined };

const position = (overrides: Overrides<NearStakingPosition> = {}): NearStakingPosition =>
  ({
    validatorId: VALIDATOR,
    staked: new BigNumber(0),
    available: new BigNumber(0),
    pending: new BigNumber(0),
    ...overrides,
  }) as NearStakingPosition;

describe("toStakes", () => {
  it("maps a staked balance to an active, undelegatable position", () => {
    const [stake] = toStakes(ADDRESS, [position({ staked: ABOVE_THRESHOLD })]);

    expect(stake).toMatchObject({
      uid: `${ADDRESS}:${VALIDATOR}:staked`,
      address: ADDRESS,
      delegate: VALIDATOR,
      state: "active",
      actions: ["undelegate"],
      asset: { type: "native" },
      amount: BigInt(ABOVE_THRESHOLD.toFixed(0)),
    });
  });

  it("maps an unstaked balance still in the unbonding window to deactivating with no actions", () => {
    const [stake] = toStakes(ADDRESS, [position({ pending: ABOVE_THRESHOLD })]);

    expect(stake).toMatchObject({
      uid: `${ADDRESS}:${VALIDATOR}:pending`,
      state: "deactivating",
      actions: [],
      amount: BigInt(ABOVE_THRESHOLD.toFixed(0)),
    });
  });

  it("maps a released balance to a withdrawable position", () => {
    const [stake] = toStakes(ADDRESS, [position({ available: ABOVE_THRESHOLD })]);

    expect(stake).toMatchObject({
      uid: `${ADDRESS}:${VALIDATOR}:available`,
      state: "withdrawable",
      actions: ["withdraw"],
      amount: BigInt(ABOVE_THRESHOLD.toFixed(0)),
    });
  });

  it("emits one position per bucket for a pool holding all three", () => {
    const stakes = toStakes(ADDRESS, [
      position({
        staked: ABOVE_THRESHOLD,
        pending: ABOVE_THRESHOLD,
        available: ABOVE_THRESHOLD,
      }),
    ]);

    expect(stakes.map(s => s.state)).toEqual(["active", "deactivating", "withdrawable"]);
  });

  it("drops staked and withdrawable dust below the staking threshold", () => {
    const stakes = toStakes(ADDRESS, [
      position({ staked: BELOW_THRESHOLD, available: BELOW_THRESHOLD }),
    ]);

    expect(stakes).toEqual([]);
  });

  it("reports no rewards, since a staking pool compounds them into the staked balance", () => {
    const [stake] = toStakes(ADDRESS, [position({ staked: ABOVE_THRESHOLD })]);

    expect(stake.amountRewarded).toBeUndefined();
    expect(stake.amountDeposited).toBe(stake.amount);
  });
});

describe("getStakes", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns a single page of the account's positions", async () => {
    (getStakingPositions as jest.Mock).mockResolvedValue({
      stakingPositions: [position({ staked: ABOVE_THRESHOLD })],
    });

    const page = await getStakes(ADDRESS);

    expect(getStakingPositions).toHaveBeenCalledWith(ADDRESS);
    expect(page.items).toHaveLength(1);
    expect(page.next).toBeUndefined();
  });

  it("returns an empty page for an account with no delegations", async () => {
    (getStakingPositions as jest.Mock).mockResolvedValue({ stakingPositions: [] });

    await expect(getStakes(ADDRESS)).resolves.toEqual({ items: [], next: undefined });
  });
});

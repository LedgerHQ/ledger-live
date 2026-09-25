import BigNumber from "bignumber.js";
import { getStakingPosition } from "../network/utils";
import { getMockedConfig } from "../__tests__/fixtures/config.fixture";
import { MIN_DELEGATOR_STAKE_MICROCREDITS } from "../constants";
import { earningValidator } from "../__tests__/fixtures/api.fixture";
import type { AleoStakingPosition } from "../types";
import { getStakes, toStakes } from "./getStakes";
import { getValidators } from "./getValidators";
import { lastBlock } from "./lastBlock";

jest.mock("../network/utils");
jest.mock("./getValidators");
jest.mock("./lastBlock");

const ADDRESS = "aleo1staker";
const VALIDATOR_ADDRESS = earningValidator.address;

const noPosition: AleoStakingPosition = {
  bondedBalance: new BigNumber(0),
  bondedValidator: null,
  unbondingBalance: new BigNumber(0),
  unbondingHeight: null,
  withdrawalAddress: null,
};

describe("toStakes", () => {
  it("returns no stakes for an address with neither a bond nor an unbond", () => {
    expect(
      toStakes({
        address: ADDRESS,
        position: noPosition,
        validator: undefined,
        currentHeight: 100,
      }),
    ).toEqual([]);
  });

  it("returns an active bonded stake with no non-earning reason when the validator earns and the bond clears the delegator minimum", () => {
    const stakes = toStakes({
      address: ADDRESS,
      position: {
        ...noPosition,
        bondedBalance: new BigNumber(MIN_DELEGATOR_STAKE_MICROCREDITS),
        bondedValidator: VALIDATOR_ADDRESS,
      },
      validator: earningValidator,
      currentHeight: 100,
    });

    expect(stakes).toEqual([
      {
        uid: ADDRESS,
        address: ADDRESS,
        delegate: VALIDATOR_ADDRESS,
        state: "active",
        actions: ["delegate", "undelegate"],
        asset: { type: "native" },
        amount: BigInt(MIN_DELEGATOR_STAKE_MICROCREDITS),
      },
    ]);
  });

  it("stays active but carries the validator's own non-earning reason in details", () => {
    const [stake] = toStakes({
      address: ADDRESS,
      position: {
        ...noPosition,
        bondedBalance: new BigNumber(MIN_DELEGATOR_STAKE_MICROCREDITS),
        bondedValidator: VALIDATOR_ADDRESS,
      },
      validator: { ...earningValidator, nonEarningReason: "overConcentrated" },
      currentHeight: 100,
    });

    expect(stake.state).toBe("active");
    expect(stake.details).toEqual({ nonEarningReason: "overConcentrated" });
  });

  it("stays active but flags ownStakeBelowMinimum when this delegator's own bond is below the 10,000 AC minimum, even on an earning validator", () => {
    const [stake] = toStakes({
      address: ADDRESS,
      position: {
        ...noPosition,
        bondedBalance: new BigNumber(MIN_DELEGATOR_STAKE_MICROCREDITS).minus(1),
        bondedValidator: VALIDATOR_ADDRESS,
      },
      validator: earningValidator,
      currentHeight: 100,
    });

    expect(stake.state).toBe("active");
    expect(stake.details).toEqual({ nonEarningReason: "ownStakeBelowMinimum" });
  });

  it("stays active with no non-earning reason for a validator's own self-bond below the delegator minimum", () => {
    const [stake] = toStakes({
      address: VALIDATOR_ADDRESS,
      position: {
        ...noPosition,
        bondedBalance: new BigNumber(MIN_DELEGATOR_STAKE_MICROCREDITS).minus(1),
        bondedValidator: VALIDATOR_ADDRESS,
      },
      validator: earningValidator,
      currentHeight: 100,
    });

    expect(stake.state).toBe("active");
    expect(stake.details).toBeUndefined();
  });

  it("stays active but flags leftCommittee when the bonded validator can no longer be found in the committee", () => {
    const [stake] = toStakes({
      address: ADDRESS,
      position: {
        ...noPosition,
        bondedBalance: new BigNumber(MIN_DELEGATOR_STAKE_MICROCREDITS),
        bondedValidator: VALIDATOR_ADDRESS,
      },
      validator: undefined,
      currentHeight: 100,
    });

    expect(stake.state).toBe("active");
    expect(stake.details).toEqual({ nonEarningReason: "leftCommittee" });
  });

  it.each([
    [999, "deactivating", []],
    [1_000, "withdrawable", ["withdraw"]],
  ] as const)(
    "is %s at height %i, with withdraw only once withdrawable",
    (currentHeight, state, actions) => {
      const position: AleoStakingPosition = {
        ...noPosition,
        unbondingBalance: new BigNumber(5_000_000),
        unbondingHeight: 1_000,
      };

      const [stake] = toStakes({ address: ADDRESS, position, validator: undefined, currentHeight });

      expect(stake.state).toBe(state);
      expect(stake.actions).toEqual(actions);
      expect(stake.uid).toBe(`${ADDRESS}:unbonding`);
      expect(stake.delegate).toBeUndefined();
    },
  );

  it("returns both stakes, with distinct uids, for a bonded remainder alongside a cooling-down unbond", () => {
    const stakes = toStakes({
      address: ADDRESS,
      position: {
        bondedBalance: new BigNumber(MIN_DELEGATOR_STAKE_MICROCREDITS),
        bondedValidator: VALIDATOR_ADDRESS,
        unbondingBalance: new BigNumber(5_000_000),
        unbondingHeight: 1_000,
        withdrawalAddress: null,
      },
      validator: earningValidator,
      currentHeight: 500,
    });

    expect(stakes.map(s => s.uid)).toEqual([ADDRESS, `${ADDRESS}:unbonding`]);
  });
});

describe("getStakes", () => {
  const mockConfig = { ...getMockedConfig("mainnet"), enableStaking: true };
  const mockedGetStakingPosition = jest.mocked(getStakingPosition);
  const mockedGetValidators = jest.mocked(getValidators);
  const mockedLastBlock = jest.mocked(lastBlock);

  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetStakingPosition.mockResolvedValue(noPosition);
    mockedGetValidators.mockResolvedValue([earningValidator]);
    mockedLastBlock.mockResolvedValue({ hash: "hash", height: 100, time: new Date() });
  });

  it("returns an empty page for an address with no staking position, without fetching the committee or the chain tip", async () => {
    const page = await getStakes(mockConfig, ADDRESS);

    expect(page).toEqual({ items: [] });
    expect(mockedGetValidators).not.toHaveBeenCalled();
    expect(mockedLastBlock).not.toHaveBeenCalled();
  });

  it("resolves the bonded stake's validator from the network's committee", async () => {
    mockedGetStakingPosition.mockResolvedValue({
      ...noPosition,
      bondedBalance: new BigNumber(MIN_DELEGATOR_STAKE_MICROCREDITS),
      bondedValidator: VALIDATOR_ADDRESS,
    });
    mockedGetValidators.mockResolvedValue([
      { ...earningValidator, nonEarningReason: "fullCommission" },
    ]);

    const page = await getStakes(mockConfig, ADDRESS);

    expect(mockedGetValidators).toHaveBeenCalledTimes(1);
    expect(mockedGetValidators).toHaveBeenCalledWith(mockConfig);
    expect(mockedLastBlock).not.toHaveBeenCalled();
    expect(page.items).toEqual([
      expect.objectContaining({
        delegate: VALIDATOR_ADDRESS,
        state: "active",
        details: { nonEarningReason: "fullCommission" },
      }),
    ]);
  });

  it("reads the chain tip only for an unbond, to decide whether it is withdrawable", async () => {
    mockedGetStakingPosition.mockResolvedValue({
      ...noPosition,
      unbondingBalance: new BigNumber(5_000_000),
      unbondingHeight: 100,
    });

    const page = await getStakes(mockConfig, ADDRESS);

    expect(mockedLastBlock).toHaveBeenCalledTimes(1);
    expect(mockedLastBlock).toHaveBeenCalledWith(mockConfig);
    expect(mockedGetValidators).not.toHaveBeenCalled();
    expect(page.items).toEqual([
      expect.objectContaining({ state: "withdrawable", actions: ["withdraw"] }),
    ]);
  });

  it("skips staking entirely when the config disables it", async () => {
    const page = await getStakes({ ...mockConfig, enableStaking: false }, ADDRESS);

    expect(page).toEqual({ items: [] });
    expect(mockedGetStakingPosition).not.toHaveBeenCalled();
    expect(mockedGetValidators).not.toHaveBeenCalled();
    expect(mockedLastBlock).not.toHaveBeenCalled();
  });
});

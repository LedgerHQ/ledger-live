import BigNumber from "bignumber.js";
import { getStakingPosition } from "../network/utils";
import { getMockedConfig } from "../__tests__/fixtures/config.fixture";
import type { AleoStakingPosition } from "../types";
import { getStakes } from "./getStakes";
import { lastBlock } from "./lastBlock";

jest.mock("../network/utils");
jest.mock("./lastBlock");

const ADDRESS = "aleo1staker";
const VALIDATOR_ADDRESS = "aleo1validator";

const noPosition: AleoStakingPosition = {
  bondedBalance: new BigNumber(0),
  bondedValidator: null,
  unbondingBalance: new BigNumber(0),
  unbondingHeight: null,
  withdrawalAddress: null,
};

const bondedPosition: AleoStakingPosition = {
  ...noPosition,
  bondedBalance: new BigNumber(10_000_000),
  bondedValidator: VALIDATOR_ADDRESS,
};

const unbondingPosition: AleoStakingPosition = {
  ...noPosition,
  unbondingBalance: new BigNumber(5_000_000),
  unbondingHeight: 1_000,
};

describe("getStakes", () => {
  const mockConfig = { ...getMockedConfig("mainnet"), enableStaking: true };
  const mockedGetStakingPosition = jest.mocked(getStakingPosition);
  const mockedLastBlock = jest.mocked(lastBlock);

  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetStakingPosition.mockResolvedValue(noPosition);
    mockedLastBlock.mockResolvedValue({ hash: "hash", height: 100, time: new Date() });
  });

  it("skips staking entirely when the config disables it", async () => {
    const page = await getStakes({ ...mockConfig, enableStaking: false }, ADDRESS);

    expect(page).toEqual({ items: [] });
    expect(mockedGetStakingPosition).not.toHaveBeenCalled();
    expect(mockedLastBlock).not.toHaveBeenCalled();
  });

  it("returns an empty page for an address with no staking position, without reading the chain tip", async () => {
    const page = await getStakes(mockConfig, ADDRESS);

    expect(mockedGetStakingPosition).toHaveBeenCalledTimes(1);
    expect(mockedGetStakingPosition).toHaveBeenCalledWith(mockConfig, ADDRESS);
    expect(page).toEqual({ items: [] });
    expect(mockedLastBlock).not.toHaveBeenCalled();
  });

  it("returns an active bonded stake, without reading the chain tip", async () => {
    mockedGetStakingPosition.mockResolvedValue(bondedPosition);

    const page = await getStakes(mockConfig, ADDRESS);

    expect(page).toEqual({
      items: [
        {
          uid: ADDRESS,
          address: ADDRESS,
          delegate: VALIDATOR_ADDRESS,
          state: "active",
          actions: ["delegate", "undelegate"],
          asset: { type: "native" },
          amount: 10_000_000n,
        },
      ],
    });
    expect(mockedLastBlock).not.toHaveBeenCalled();
  });

  it.each([
    [999, "deactivating", []],
    [1_000, "withdrawable", ["withdraw"]],
  ] as const)(
    "reads the chain tip for an unbond: at height %i it is %s",
    async (height, state, actions) => {
      mockedGetStakingPosition.mockResolvedValue(unbondingPosition);
      mockedLastBlock.mockResolvedValue({ hash: "hash", height, time: new Date() });

      const page = await getStakes(mockConfig, ADDRESS);

      expect(mockedLastBlock).toHaveBeenCalledTimes(1);
      expect(mockedLastBlock).toHaveBeenCalledWith(mockConfig);
      expect(page).toEqual({
        items: [
          {
            uid: `${ADDRESS}:unbonding`,
            address: ADDRESS,
            state,
            actions,
            asset: { type: "native" },
            amount: 5_000_000n,
          },
        ],
      });
    },
  );

  it("returns both stakes, with distinct uids, for a bonded remainder alongside a cooling-down unbond", async () => {
    mockedGetStakingPosition.mockResolvedValue({
      ...unbondingPosition,
      bondedBalance: bondedPosition.bondedBalance,
      bondedValidator: VALIDATOR_ADDRESS,
    });

    const page = await getStakes(mockConfig, ADDRESS);

    expect(page.items).toEqual([
      expect.objectContaining({ uid: ADDRESS, state: "active" }),
      expect.objectContaining({ uid: `${ADDRESS}:unbonding`, state: "deactivating" }),
    ]);
  });
});

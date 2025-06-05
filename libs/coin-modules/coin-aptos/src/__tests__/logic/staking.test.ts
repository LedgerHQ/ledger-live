import BigNumber from "bignumber.js";
import { mapStakingPositions } from "../../logic/staking";

const nonBreakableSpace = " ";

describe("staking", () => {
  it("mapStakingPositions", () => {
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
        validatorId: "validator-1",
      },
      {
        active: BigNumber(45864986459),
        inactive: BigNumber(0),
        pendingInactive: BigNumber(0),
        validatorId: "validator-2",
      },
    ];
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
        validatorId: "validator-1",
        formattedAmount: `0${nonBreakableSpace}APT`,
        formattedPending: `0.678686${nonBreakableSpace}APT`,
        formattedAvailable: `0.00033333${nonBreakableSpace}APT`,
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
        active: BigNumber("45864986459"),
        inactive: BigNumber("0"),
        pendingInactive: BigNumber("0"),
        validatorId: "validator-2",
        formattedAmount: `458.649${nonBreakableSpace}APT`,
        formattedPending: `0${nonBreakableSpace}APT`,
        formattedAvailable: `0${nonBreakableSpace}APT`,
        rank: 1,
        validator: {
          activeStake: BigNumber("172343459783425"),
          commission: BigNumber("8"),
          address: "validator-2",
          name: "validator-2",
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

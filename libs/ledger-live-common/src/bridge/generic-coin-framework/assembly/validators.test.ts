import { readsValidators, toValidatorItems } from "./validators";

describe("readsValidators", () => {
  it.each([
    [{ stakingSupported: true }, true],
    [{ stakingSupported: true, usesStakingPositions: false }, true],
    [{ stakingSupported: true, usesStakingPositions: true }, false],
    [{ stakingSupported: false }, false],
    [{}, false],
  ])("is %s → %s: only stakingResources carries the validators", (bridgeApi, expected) => {
    expect(readsValidators(bridgeApi)).toBe(expected);
  });
});

describe("toValidatorItems", () => {
  it("maps a validator of either path, its pool as a decimal string", () => {
    expect(
      toValidatorItems([
        {
          address: "val1",
          name: "Validator 1",
          commissionRate: "0.05",
          balance: 1_000_000_000_000_000_000_000n,
          apy: 0.12,
        },
        { address: "val2", balance: "42" },
        { address: "val3" },
      ]),
    ).toEqual([
      {
        validatorAddress: "val1",
        name: "Validator 1",
        commission: 0.05,
        tokens: "1000000000000000000000",
        votingPower: 0,
        estimatedYearlyRewardsRate: 0.12,
      },
      {
        validatorAddress: "val2",
        name: "val2",
        commission: 0,
        tokens: "42",
        votingPower: 0,
        estimatedYearlyRewardsRate: 0,
      },
      {
        validatorAddress: "val3",
        name: "val3",
        commission: 0,
        tokens: "0",
        votingPower: 0,
        estimatedYearlyRewardsRate: 0,
      },
    ]);
  });
});

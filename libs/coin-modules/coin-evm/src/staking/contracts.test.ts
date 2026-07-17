import { getStakingContractAddress } from "./contracts";

describe("getStakingContractAddress", () => {
  it.each([
    ["0x55E1A0C8f376964bd339167476063bFED7f213d5", "celo", undefined],
    ["0x0000000000000000000000000000000000001000", "monad", undefined],
    ["0x0000000000000000000000000000000000001005", "sei_evm", { mode: "delegate" }],
    ["0x0000000000000000000000000000000000001007", "sei_evm", { mode: "claimReward" }],
    [
      "0x1111111111111111111111111111111111111111",
      "zero_gravity",
      { mode: "delegate", valAddress: "0x1111111111111111111111111111111111111111" },
    ],
    [undefined, "zero_gravity", { mode: "delegate" }],
    [undefined, "unknown_chain", undefined],
  ] as const)("returns %s for %s", (expected, currencyId, ctx) => {
    expect(getStakingContractAddress(currencyId, ctx)).toEqual(expected);
  });
});

import BigNumber from "bignumber.js";
import type { HederaValidator } from "../../types";

export const getMockedValidator = (overrides?: Partial<HederaValidator>): HederaValidator => {
  return {
    nodeId: 1,
    name: "Mock Validator",
    address: "0.0.3",
    addressChecksum: "abcde",
    minStake: new BigNumber(0),
    maxStake: new BigNumber(0),
    activeStake: new BigNumber(0),
    activeStakePercentage: new BigNumber(0),
    overstaked: false,
    ...overrides,
  };
};

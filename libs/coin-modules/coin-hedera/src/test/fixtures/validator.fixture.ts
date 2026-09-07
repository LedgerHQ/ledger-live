import BigNumber from "bignumber.js";
import type { HederaValidator } from "../../types";
import type { HederaMirrorNode } from "../../types/mirror";

export const getMockedValidator = (overrides?: Partial<HederaValidator>): HederaValidator => {
  return {
    id: "1",
    name: "Mock Validator",
    address: "0.0.3",
    addressChecksum: "abcde",
    minStake: new BigNumber(0),
    maxStake: new BigNumber(0),
    activeStake: new BigNumber(0),
    activeStakePercentage: new BigNumber(0),
    overstaked: false,
    isLedgerNode: false,
    ...overrides,
  };
};

export const getMockedMirrorNode = (overrides?: Partial<HederaMirrorNode>): HederaMirrorNode => ({
  node_id: 0,
  node_account_id: "0.0.3",
  description: "Hedera | 0 | Hosted by Hedera",
  min_stake: 1000,
  max_stake: 100000,
  stake: 50000,
  stake_rewarded: 30000,
  reward_rate_start: 0,
  ...overrides,
});

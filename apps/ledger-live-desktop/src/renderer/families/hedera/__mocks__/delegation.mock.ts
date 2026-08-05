import BigNumber from "bignumber.js";
import { HEDERA_DELEGATION_STATUS } from "@ledgerhq/live-common/families/hedera/constants";
import type { HederaEnrichedDelegation } from "@ledgerhq/live-common/families/hedera/types";

export const mockDelegation = {
  nodeId: 3,
  delegated: new BigNumber(50_000_000),
  pendingReward: new BigNumber(10_000),
};

export const mockEnrichedDelegation: HederaEnrichedDelegation = {
  nodeId: 3,
  delegated: new BigNumber(50_000_000),
  pendingReward: new BigNumber(10_000),
  status: HEDERA_DELEGATION_STATUS.Active,
  validator: {
    nodeId: 3,
    name: "Hedera Node 3",
    address: "0.0.3",
    addressChecksum: null,
    minStake: new BigNumber(0),
    maxStake: new BigNumber(0),
    activeStake: new BigNumber(0),
    activeStakePercentage: new BigNumber(0),
    overstaked: false,
  },
};

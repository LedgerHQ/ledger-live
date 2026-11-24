import BigNumber from "bignumber.js";

/**
 *   Icon Delegation item Type
 */
export type IconDelegationItemType = {
  address: string;
  value: string;
};

/**
 *   Icon DelegationType
 */
export type IconDelegationType = {
  delegations: IconDelegationItemType[];
  totalDelegated: BigNumber;
  votingPower: BigNumber;
};

export type IconSignedPayload = {
  signature: string;
  rawData?: Record<string, unknown>;
};

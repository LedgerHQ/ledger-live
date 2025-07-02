import BigNumber from "bignumber.js";

export * from "./bridge";
export * from "./signer";

export type HederaValidator = {
  nodeId: number;
  minStake: BigNumber;
  maxStake: BigNumber;
  activeStake: BigNumber;
  activeStakePercentage: BigNumber;
  address: string;
  name: string;
  overstaked: boolean;
};

export type HederaPreloadData = {
  validators: HederaValidator[];
};

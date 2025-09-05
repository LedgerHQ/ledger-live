import type { StakingContractConfig } from "../types/staking";
import { STAKING_CONTRACTS } from "./contracts";

export const getStakingContractConfig = (
  contractAddress: string,
): StakingContractConfig | undefined => {
  return STAKING_CONTRACTS[contractAddress];
};

export const getAllStakingContracts = (): Record<string, StakingContractConfig> => {
  return STAKING_CONTRACTS;
};

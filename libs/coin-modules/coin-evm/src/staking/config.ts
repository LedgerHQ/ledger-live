import type { StakingContractConfig } from "../types/staking";
import { STAKING_CONTRACTS } from "./contracts";

export const getStakingContractConfig = (
  contractAddress: string,
): StakingContractConfig | undefined => {
  return STAKING_CONTRACTS[contractAddress];
};

// Get all known staking contracts
export const getAllStakingContracts = (): Record<string, StakingContractConfig> => {
  return STAKING_CONTRACTS;
};

// Check if an address is a known staking contract (utils fn that may be useful later)
export const isKnownStakingContract = (contractAddress: string): boolean => {
  return contractAddress in STAKING_CONTRACTS;
};

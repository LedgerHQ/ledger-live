import type { StakingContractConfig } from "../types/staking";
import { STAKING_CONTRACTS } from "./contracts";

export const getStakingContractConfig = (currencyID: string): StakingContractConfig | undefined => {
  return STAKING_CONTRACTS[currencyID];
};

export const getAllStakingContracts = (): Record<string, StakingContractConfig> => {
  return STAKING_CONTRACTS;
};

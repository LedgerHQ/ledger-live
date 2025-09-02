import seiAbi from "../abis/sei.abi.json";
import celoAbi from "../abis/celo.abi.json";

export type StakingABI = typeof seiAbi | typeof celoAbi;

export const STAKING_ABIS: Record<string, StakingABI> = {
  // Sei EVM staking contract
  sei_network_evm: seiAbi,

  // Celo staking contract
  celo: celoAbi,
};

export const getStakingABI = (currencyId: string): StakingABI | undefined => {
  return STAKING_ABIS[currencyId];
};

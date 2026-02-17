import celoAbi from "../abis/celo.abi.json";
import seiAbi from "../abis/sei.abi.json";

type StakingABI = typeof seiAbi | typeof celoAbi;

interface ABIFunction {
  type: string;
  name: string;
  stateMutability?: string;
}

const STAKING_ABIS: Record<string, StakingABI> = {
  // Sei EVM staking contract
  sei_evm: seiAbi,

  // Celo staking contract
  celo: celoAbi,
};

export const getStakingABI = (currencyId: string): StakingABI | undefined => {
  return STAKING_ABIS[currencyId];
};

/**
 * Checks if state mutability of a function in the ABI is payable
 * (useful for staking operations)
 */
export const isPayable = (currencyId: string, functionName: string): boolean => {
  const abi = getStakingABI(currencyId);
  if (!abi) {
    return false;
  }

  const functionAbi = abi.find((item: ABIFunction) => {
    return item.type === "function" && item.name === functionName;
  });

  if (!functionAbi) {
    return false;
  }

  return functionAbi.stateMutability === "payable";
};

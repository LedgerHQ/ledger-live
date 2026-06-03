import celoAbi from "../abis/celo.abi.json";
import monadAbi from "../abis/monad.abi.json";
import seiAbi from "../abis/sei.abi.json";
import seiDistributionAbi from "../abis/sei-distribution.abi.json";

type StakingABI = typeof seiDistributionAbi | typeof seiAbi | typeof celoAbi | typeof monadAbi;

interface ABIFunction {
  type: string;
  name: string;
  stateMutability?: string;
}

const STAKING_ABIS: Record<string, StakingABI> = {
  // Sei EVM staking contract
  sei_evm: [...seiAbi, ...seiDistributionAbi],

  // Celo staking contract
  celo: celoAbi,

  // Monad staking precompile.
  // Note: all getter functions (getDelegator, getValidator, etc.) are marked
  // stateMutability: "nonpayable" — not "view" — because this is a precompile,
  // not a regular Solidity contract. The precompile can consume all gas on
  // invalid arguments, so "view" semantics do not apply.
  // Source: https://docs.monad.xyz/reference/staking/api (Staking ABI JSON)
  monad: monadAbi,
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

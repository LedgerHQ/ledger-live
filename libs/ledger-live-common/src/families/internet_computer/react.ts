import { useMemo } from "react";
import { BigNumber } from "bignumber.js";
import type { ICPAccount, ICPNeuron } from "@ledgerhq/coin-internet_computer/types";
import { ICP_MIN_STAKING_AMOUNT, ICP_FEES } from "@ledgerhq/coin-internet_computer/consts";

/**
 * Hook to get all neurons from an ICP account
 */
export function useICPNeurons(account: ICPAccount): ICPNeuron[] {
  return useMemo(() => {
    return account.neurons?.fullNeurons || [];
  }, [account.neurons?.fullNeurons]);
}

/**
 * Hook to get a specific neuron by ID
 */
export function useICPNeuronById(account: ICPAccount, neuronId: string): ICPNeuron | undefined {
  const neurons = useICPNeurons(account);
  return useMemo(() => {
    return neurons.find(n => n.id?.[0]?.id?.toString() === neuronId);
  }, [neurons, neuronId]);
}

/**
 * Check if account has enough balance to stake
 */
export function canStakeICP(account: ICPAccount): boolean {
  const spendable = account.spendableBalance.minus(ICP_FEES);
  return spendable.gte(ICP_MIN_STAKING_AMOUNT);
}

/**
 * Get the state of a neuron (Locked, Dissolving, Dissolved)
 */
export function getNeuronState(
  neuron: ICPNeuron,
): "Locked" | "Dissolving" | "Dissolved" | "Unlocked" | "Spawning" | "Unknown" {
  const dissolveState = neuron.dissolveState;
  if (!dissolveState) return "Unknown";

  // dissolveState is already a string enum: "Unlocked" | "Locked" | "Dissolving" | "Unknown" | "Spawning"
  switch (dissolveState) {
    case "Locked":
      return "Locked";
    case "Dissolving":
      return "Dissolving";
    case "Unlocked":
      return "Unlocked";
    case "Spawning":
      return "Spawning";
    default:
      return "Unknown";
  }
}

/**
 * Get total staked amount across all neurons
 */
export function useTotalStaked(account: ICPAccount): BigNumber {
  const neurons = useICPNeurons(account);
  return useMemo(() => {
    return neurons.reduce((total, neuron) => {
      const stake = new BigNumber(neuron.cached_neuron_stake_e8s?.toString() || "0");
      return total.plus(stake);
    }, new BigNumber(0));
  }, [neurons]);
}

/**
 * Get total maturity across all neurons
 */
export function useTotalMaturity(account: ICPAccount): BigNumber {
  const neurons = useICPNeurons(account);
  return useMemo(() => {
    return neurons.reduce((total, neuron) => {
      const maturity = new BigNumber(neuron.maturity_e8s_equivalent?.toString() || "0");
      return total.plus(maturity);
    }, new BigNumber(0));
  }, [neurons]);
}

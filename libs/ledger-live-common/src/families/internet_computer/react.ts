import BigNumber from "bignumber.js";
import { useMemo } from "react";
import {
  derivePrincipalFromPubkey,
  neuronStake,
  recoverStakeMemo,
} from "@ledgerhq/coin-internet_computer/logic";
import { ICP_FEES, MIN_NEURON_STAKE } from "./consts";
import { NeuronState } from "./types";
import type { ICPAccount, ICPNeuron, InternetComputerOperation } from "./types";

export type ICPNeuronStateLabel = "Locked" | "Dissolving" | "Dissolved" | "Spawning" | "Unknown";

const NO_NEURONS: readonly ICPNeuron[] = Object.freeze([]);

const NEURON_STATE_LABELS: Record<NeuronState, ICPNeuronStateLabel> = {
  [NeuronState.Unspecified]: "Unknown",
  [NeuronState.Locked]: "Locked",
  [NeuronState.Dissolving]: "Dissolving",
  [NeuronState.Dissolved]: "Dissolved",
  [NeuronState.Spawning]: "Spawning",
};

const sumE8s = (
  neurons: readonly ICPNeuron[],
  amountOf: (neuron: ICPNeuron) => bigint,
): BigNumber => new BigNumber(neurons.reduce((total, n) => total + amountOf(n), 0n).toString());

export function useICPNeurons(account: ICPAccount): readonly ICPNeuron[] {
  // Collapse every empty case onto one reference: each NeuronsData.empty() carries its own `[]`, and
  // the bridge mints a fresh one per sync/deserialize, which would churn the memos below.
  const fullNeurons = account.neurons?.fullNeurons;
  return fullNeurons?.length ? fullNeurons : NO_NEURONS;
}

export function useICPNeuronById(account: ICPAccount, neuronId: string): ICPNeuron | undefined {
  const neurons = useICPNeurons(account);
  return useMemo(() => neurons.find(n => n.id?.toString() === neuronId), [neurons, neuronId]);
}

export function useTotalStaked(account: ICPAccount): BigNumber {
  const neurons = useICPNeurons(account);
  return useMemo(() => sumE8s(neurons, neuronStake), [neurons]);
}

export function useTotalMaturity(account: ICPAccount): BigNumber {
  const neurons = useICPNeurons(account);
  return useMemo(() => sumE8s(neurons, n => n.maturityE8sEquivalent), [neurons]);
}

// Maturity already staked into a neuron. Disjoint from both useTotalStaked and useTotalMaturity:
// it is excluded from neuronStake but counts toward voting power and is disbursed as stake.
export function useTotalStakedMaturity(account: ICPAccount): BigNumber {
  const neurons = useICPNeurons(account);
  return useMemo(() => sumE8s(neurons, n => n.stakedMaturityE8sEquivalent), [neurons]);
}

export function canStakeICP(account: ICPAccount): boolean {
  return account.spendableBalance.gte(MIN_NEURON_STAKE + ICP_FEES);
}

/**
 * The account's own principal, in the textual form `ICPNeuron.controller` uses.
 *
 * Empty when the account has no public key yet, or when the key cannot be parsed — either way the
 * account controls nothing, which is the safe reading for gating neuron actions.
 */
export function useICPPrincipal(account: ICPAccount): string {
  return useMemo(() => {
    if (!account.xpub) return "";
    try {
      return derivePrincipalFromPubkey(account.xpub).toText();
    } catch {
      return "";
    }
  }, [account.xpub]);
}

/**
 * Whether this account can top the neuron up.
 *
 * A top-up transfer has to reuse the stake nonce of the transfer that created the neuron, and the
 * only place to find it is this account's own history — so a neuron created elsewhere, or one whose
 * creating transfer has aged out, cannot be topped up from here. `prepareTransaction` reaches the
 * same conclusion, but only once the user is already in the send flow; asking first keeps the action
 * off the screen instead of offering a dead end.
 */
export function useCanTopUpNeuron(account: ICPAccount, neuron: ICPNeuron | undefined): boolean {
  return useMemo(() => {
    if (!neuron || !account.xpub) return false;
    try {
      const controller = derivePrincipalFromPubkey(account.xpub);
      return (
        recoverStakeMemo(account.operations as InternetComputerOperation[], neuron, controller) !==
        undefined
      );
    } catch {
      return false;
    }
  }, [account.operations, account.xpub, neuron]);
}

export function getNeuronState(neuron: ICPNeuron): ICPNeuronStateLabel {
  // `state` is decoded with `as NeuronState` from a raw canister number, so it can be out of range.
  return NEURON_STATE_LABELS[neuron.state] ?? "Unknown";
}

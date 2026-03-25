import {
  Account,
  AccountRaw,
  Operation,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { KNOWN_TOPICS } from "../consts";
import { NeuronsData } from "@zondax/ledger-live-icp/neurons";

type FamilyType = "internet_computer";
export interface ICPAccount extends Account {
  neurons: NeuronsData;
}

export interface ICPAccountRaw extends AccountRaw {
  neuronsData: {
    fullNeurons: string;
    neuronInfos: string;
    lastUpdated: number;
  };
}

export type ICPTransactionType =
  // Send
  | "increase_stake"
  | "send"
  | "create_neuron"
  // Neuron
  | "start_dissolving"
  | "stop_dissolving"
  | "list_neurons"
  | "disburse"
  | "spawn_neuron"
  | "stake_maturity"
  | "refresh_voting_power"
  | "increase_dissolve_delay"
  | "auto_stake_maturity"
  | "spawn_neuron_from_maturity"
  | "set_auto_stake_maturity"
  | "set_dissolve_delay"
  | "remove_hot_key"
  | "follow"
  | "split_neuron"
  | "add_hot_key";

export type Transaction = TransactionCommon & {
  family: FamilyType;
  fees: BigNumber;
  memo?: string;
  type: ICPTransactionType;
  neuronAccountIdentifier?: string;
  neuronId?: string;
  percentageToStake?: string;
  percentageToSpawn?: string;
  dissolveDelay?: string;
  additionalDissolveDelay?: string;
  autoStakeMaturity?: boolean;
  hotKeyToRemove?: string;
  hotKeyToAdd?: string;
  followTopic?: keyof typeof KNOWN_TOPICS;
  followeesIds?: string[];
};

export type TransactionRaw = TransactionCommonRaw & {
  family: FamilyType;
  fees: string;
  memo?: string;
  type: ICPTransactionType;
  neuronAccountIdentifier?: string;
  neuronId?: string;
  percentageToStake?: string;
  percentageToSpawn?: string;
  dissolveDelay?: string;
  additionalDissolveDelay?: string;
  autoStakeMaturity?: boolean;
  hotKeyToRemove?: string;
  hotKeyToAdd?: string;
  followTopic?: keyof typeof KNOWN_TOPICS;
  followeesIds?: string[];
};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;

export type InternetComputerOperation = Operation<InternetComputerOperationExtra>;

export type InternetComputerOperationExtra = {
  memo: string | undefined;
  createdNeuronId?: string;
  neurons?: NeuronsData;
  methodName?: string;
};

export const ICPOperationTypeListNeuron = "LIST_NEURONS";
export type { ICPNeuron } from "@zondax/ledger-live-icp/neurons";

import {
  Account,
  AccountRaw,
  Operation,
  OperationExtra,
  OperationExtraRaw,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { KNOWN_TOPICS } from "../consts";
import { ICPNeuron, NeuronCommandOutcome, NeuronsData, NeuronsDataRaw } from "./neuron";

type FamilyType = "internet_computer";

/**
 * Every ICP operation the bridge can build. `send` is the plain ledger transfer; `create_neuron`
 * and `increase_stake` are ledger transfers to a governance subaccount; the rest are governance
 * `manage_neuron` update calls (plus the `list_neurons` query used to refresh account state).
 */
export type ICPTransactionType =
  | "send"
  | "create_neuron"
  | "increase_stake"
  | "start_dissolving"
  | "stop_dissolving"
  | "disburse"
  | "set_dissolve_delay"
  | "increase_dissolve_delay"
  | "add_hot_key"
  | "remove_hot_key"
  | "follow"
  | "refresh_voting_power"
  | "stake_maturity"
  | "auto_stake_maturity"
  | "spawn_neuron"
  | "spawn_neuron_from_maturity"
  | "split_neuron"
  | "list_neurons";

// Ledger-canister transfers (carry a recipient, amount, and fee); every other op is a governance
// call that doesn't debit the ledger. Single source of truth for this split.
export const TRANSFER_TYPES: ReadonlySet<ICPTransactionType> = new Set<ICPTransactionType>([
  "send",
  "create_neuron",
  "increase_stake",
]);

type ICPTransactionFields = {
  type: ICPTransactionType;
  neuronId?: string;
  // Nonce for claim_or_refresh after a create/top-up transfer; separate from the transfer memo.
  stakeNonce?: string;
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

export type Transaction = TransactionCommon &
  ICPTransactionFields & {
    family: FamilyType;
    fees: BigNumber;
    memo?: string | undefined;
  };

export type TransactionRaw = TransactionCommonRaw &
  ICPTransactionFields & {
    family: FamilyType;
    fees: string;
    memo?: string | undefined;
  };

export interface ICPAccount extends Account {
  neurons: NeuronsData;
}

export interface ICPAccountRaw extends AccountRaw {
  neuronsData?: NeuronsDataRaw;
}

// `neurons` is only populated once an account has been synced or deserialized, so classify by
// family rather than by the presence of the field.
export function isICPAccount(account: Account): account is ICPAccount {
  return account.currency.family === "internet_computer";
}

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;

export type InternetComputerOperation = Operation<InternetComputerOperationExtra>;

export type InternetComputerOperationExtra = {
  memo?: string | undefined;
  // Set on a successful create_neuron, once claim_or_refresh returns the new neuron id.
  createdNeuronId?: string;
  // Carries a refreshed neuron snapshot back from a list_neurons operation.
  neurons?: ICPNeuron[];
  // What the accepted manage_neuron command reported about its own result, where it reported one.
  outcome?: NeuronCommandOutcome;
  // The governance method a neuron operation invoked (for display / operation typing).
  methodName?: string;
};

/**
 * Persisted form of the above. Identical except for `neurons`, whose `bigint` fields have no JSON
 * form and so travel as the same tagged string the account snapshot uses.
 *
 * Without this pair the framework copies `extra` into the raw operation untouched
 * (`ledger-wallet-framework/src/serialization/operation.ts`), and one bigint reaching `JSON.stringify`
 * fails the whole namespace save.
 */
export type InternetComputerOperationExtraRaw = {
  memo?: string;
  createdNeuronId?: string;
  neurons?: string;
  outcome?: NeuronCommandOutcome;
  methodName?: string;
};

const EXTRA_KEYS = ["memo", "createdNeuronId", "neurons", "outcome", "methodName"] as const;

const hasAnyExtraKey = (value: object): boolean => EXTRA_KEYS.some(key => key in value);

export function isInternetComputerOperationExtra(
  extra: OperationExtra,
): extra is InternetComputerOperationExtra {
  return extra !== null && typeof extra === "object" && hasAnyExtraKey(extra);
}

export function isInternetComputerOperationExtraRaw(
  extraRaw: OperationExtraRaw,
): extraRaw is InternetComputerOperationExtraRaw {
  return extraRaw !== null && typeof extraRaw === "object" && hasAnyExtraKey(extraRaw);
}

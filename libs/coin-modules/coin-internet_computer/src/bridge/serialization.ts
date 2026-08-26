import type { Account, AccountRaw, OperationExtra, OperationExtraRaw } from "@ledgerhq/types-live";
import type {
  ICPAccount,
  ICPAccountRaw,
  InternetComputerOperationExtra,
  InternetComputerOperationExtraRaw,
} from "../types";
import {
  isInternetComputerOperationExtra,
  isInternetComputerOperationExtraRaw,
} from "../types/common";
import { NeuronsData, deserializeNeurons, serializeNeurons } from "../types/neuron";

export function assignToAccountRaw(account: Account, accountRaw: AccountRaw): void {
  const icpAccount = account as ICPAccount;
  const icpAccountRaw = accountRaw as ICPAccountRaw;
  if (icpAccount.neurons) {
    icpAccountRaw.neuronsData = icpAccount.neurons.serialize();
  }
}

export function assignFromAccountRaw(accountRaw: AccountRaw, account: Account): void {
  const icpAccount = account as ICPAccount;
  const icpAccountRaw = accountRaw as ICPAccountRaw;
  icpAccount.neurons = icpAccountRaw.neuronsData
    ? NeuronsData.deserialize(icpAccountRaw.neuronsData)
    : NeuronsData.empty();
}

/**
 * Whitelist rather than pass-through, on purpose: a key nobody converted is a key that could carry a
 * `bigint` to `JSON.stringify` and fail the save. Anything new on the extra has to be added here.
 */
export function toOperationExtraRaw(extra: OperationExtra): OperationExtraRaw {
  const extraRaw: InternetComputerOperationExtraRaw = {};
  if (!isInternetComputerOperationExtra(extra)) return extraRaw;

  if (extra.memo !== undefined) extraRaw.memo = extra.memo;
  if (extra.createdNeuronId !== undefined) extraRaw.createdNeuronId = extra.createdNeuronId;
  // Encoded even when empty: an empty snapshot is a real answer from list_neurons, not a missing one.
  if (extra.neurons !== undefined) extraRaw.neurons = serializeNeurons(extra.neurons);
  if (extra.outcome !== undefined) extraRaw.outcome = extra.outcome;
  if (extra.methodName !== undefined) extraRaw.methodName = extra.methodName;

  return extraRaw;
}

export function fromOperationExtraRaw(extraRaw: OperationExtraRaw): OperationExtra {
  const extra: InternetComputerOperationExtra = {};
  if (!isInternetComputerOperationExtraRaw(extraRaw)) return extra;

  if (extraRaw.memo !== undefined) extra.memo = extraRaw.memo;
  if (extraRaw.createdNeuronId !== undefined) extra.createdNeuronId = extraRaw.createdNeuronId;
  if (extraRaw.neurons !== undefined) extra.neurons = deserializeNeurons(extraRaw.neurons);
  if (extraRaw.outcome !== undefined) extra.outcome = extraRaw.outcome;
  if (extraRaw.methodName !== undefined) extra.methodName = extraRaw.methodName;

  return extra;
}

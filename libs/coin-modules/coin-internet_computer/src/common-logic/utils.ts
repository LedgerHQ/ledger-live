import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { OperationType } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { MAX_MEMO_VALUE } from "../consts";
import { ICPTransactionType, InternetComputerOperation } from "../types";

// Whole-string byte sequence: even number of hex digits, >= 3 bytes (preserving the prior 6-hex
// minimum) — anchored so it no longer matches a hex run embedded in other text.
const validHexRegExp = new RegExp(/^([0-9A-Fa-f]{2}){3,}$/);
const validBase64RegExp = new RegExp(
  /^(?:[A-Za-z\d+/]{4})*(?:[A-Za-z\d+/]{3}=|[A-Za-z\d+/]{2}==)?$/,
);

export const isValidHex = (msg: string): boolean => validHexRegExp.test(msg);
export const isValidBase64 = (msg: string): boolean => validBase64RegExp.test(msg);

const METHOD_LABELS: Record<ICPTransactionType, string> = {
  send: "Send ICP",
  create_neuron: "Stake Neuron",
  increase_stake: "Increase Neuron Stake",
  start_dissolving: "Start Dissolving",
  stop_dissolving: "Stop Dissolving",
  disburse: "Disburse Neuron",
  set_dissolve_delay: "Set Dissolve Delay",
  increase_dissolve_delay: "Increase Dissolve Delay",
  add_hot_key: "Add Hot Key",
  remove_hot_key: "Remove Hot Key",
  follow: "Follow",
  refresh_voting_power: "Refresh Voting Power",
  stake_maturity: "Stake Maturity",
  auto_stake_maturity: "Auto Stake Maturity",
  spawn_neuron: "Spawn Neuron",
  spawn_neuron_from_maturity: "Spawn Neuron",
  split_neuron: "Split Neuron",
  list_neurons: "List Neurons",
};

export const methodToString = (type: ICPTransactionType): string =>
  METHOD_LABELS[type] ?? "Unknown";

// Retype outgoing transfers whose recipient is one of the account's neuron accounts: a memo'd
// transfer is the initial stake (STAKE_NEURON), an unmemo'd one is a top-up (TOP_UP_NEURON).
export const reassignOperationType = (
  operations: InternetComputerOperation[],
  neuronAddresses: string[],
): InternetComputerOperation[] => {
  const neuronAddressSet = new Set(neuronAddresses);
  return operations.map(op => {
    if (op.type === "OUT" && neuronAddressSet.has(op.recipients[0])) {
      const type: OperationType = new BigNumber(op.extra?.memo ?? "0").gt(0)
        ? "STAKE_NEURON"
        : "TOP_UP_NEURON";
      return { ...op, id: encodeOperationId(op.accountId, op.hash, type), type };
    }
    return op;
  });
};

export const getBufferFromString = (message: string): Buffer =>
  isValidHex(message)
    ? Buffer.from(message, "hex")
    : isValidBase64(message)
      ? Buffer.from(message, "base64")
      : Buffer.from(message);

export const normalizeEpochTimestamp = (timestamp: string): number => {
  return parseInt(timestamp.slice(0, 13));
};

function randomIntFromInterval(min: any, max: any): string {
  const minBig = new BigNumber(min);
  const maxBig = new BigNumber(max);

  const random = BigNumber.random().multipliedBy(maxBig.minus(minBig).plus(1)).plus(minBig);
  const randomInt = random.integerValue(BigNumber.ROUND_FLOOR);

  return randomInt.toString();
}

export function getRandomTransferID(): string {
  return randomIntFromInterval(0, MAX_MEMO_VALUE);
}

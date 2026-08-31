import type { Principal } from "@dfinity/principal";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { OperationType } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { MAX_MEMO_VALUE } from "../consts";
import { getNeuronStakeSubAccountIdentifier } from "../logic/buildNeuronTransaction";
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

/**
 * Whether a transfer is this controller's own initial neuron stake, judged from the transfer alone.
 *
 * The neuron's subaccount is a hash of the controller and the stake nonce, and that nonce is the
 * transfer's memo — so a stake can be recognized without knowing the neuron. That matters because
 * the neuron snapshot only arrives with a device-signed `list_neurons`: until then background sync
 * had nothing to match against and relabelled a settled stake as a plain send.
 *
 * Top-ups carry memo 0 and so are not derivable this way; they still need the snapshot.
 */
const isOwnStakeTransfer = (
  op: InternetComputerOperation,
  controller: Principal | undefined,
): boolean => {
  const memo = op.extra?.memo;
  if (!controller || !memo || memo === "0" || !op.recipients[0]) return false;
  try {
    return getNeuronStakeSubAccountIdentifier(controller, BigInt(memo)) === op.recipients[0];
  } catch {
    // Non-numeric memo — not a stake nonce.
    return false;
  }
};

// Retype outgoing transfers whose recipient is one of the account's neuron accounts: a memo'd
// transfer is the initial stake (STAKE_NEURON), an unmemo'd one is a top-up (TOP_UP_NEURON).
export const reassignOperationType = (
  operations: InternetComputerOperation[],
  neuronAddresses: string[],
  controller?: Principal,
): InternetComputerOperation[] => {
  const neuronAddressSet = new Set(neuronAddresses);
  const retyped = operations.map(op => {
    if (op.type !== "OUT") return op;
    if (!neuronAddressSet.has(op.recipients[0]) && !isOwnStakeTransfer(op, controller)) return op;
    const type: OperationType = new BigNumber(op.extra?.memo ?? "0").gt(0)
      ? "STAKE_NEURON"
      : "TOP_UP_NEURON";
    return { ...op, id: encodeOperationId(op.accountId, op.hash, type), type };
  });
  // Retyping rewrites the id, and both callers hand this the list they are about to store, so the
  // collapse has to happen here or the caller stores the collision. See dedupeRetypedOperations.
  return dedupeRetypedOperations(retyped);
};

const NEURON_TRANSFER_OP_TYPES = new Set<OperationType>(["STAKE_NEURON", "TOP_UP_NEURON"]);

/**
 * Drop the copies one transfer accumulates as its classification changes.
 *
 * An operation id encodes its type, and `mergeOps` dedups on that id, so retyping a transfer mints
 * an id the merge has never seen: the retyped operation is added beside the stale `OUT` rather than
 * replacing it, and nothing removes the loser afterwards — `mergeOps` never dedups the stored list
 * against itself. A top-up carries memo 0 and so cannot be recognized until a device-signed
 * `list_neurons` supplies the neuron addresses, which makes the reclassification, and the duplicate,
 * routine rather than a corner case.
 *
 * Only an `OUT` superseded by a neuron type is dropped, never an `IN`: a self-transfer legitimately
 * produces one of each under a single hash. The pass is also what heals an account that already
 * holds duplicates, since no sync would otherwise remove them.
 */
export const dedupeRetypedOperations = (
  operations: InternetComputerOperation[],
): InternetComputerOperation[] => {
  const supersededHashes = new Set(
    operations.filter(op => NEURON_TRANSFER_OP_TYPES.has(op.type)).map(op => op.hash),
  );
  const kept = new Set<string>();
  return operations.filter(op => {
    if (op.type === "OUT" && supersededHashes.has(op.hash)) return false;
    if (kept.has(op.id)) return false;
    kept.add(op.id);
    return true;
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

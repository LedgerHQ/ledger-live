import { BigNumber } from "bignumber.js";
import type { Input, Output, TX } from "@ledgerhq/wallet-btc/index";

/**
 * Primitives over an explorer transaction, shared by the two readers of the
 * transparent history: the headless `listOperations` (single address) and the
 * bridge sync (whole xpub, see bridge/sync.ts). Both consume the same wire
 * shape, so what can be read from a transaction without knowing whose it is
 * belongs here rather than in either caller.
 */

/** An outpoint, in the `${txid}-${index}` form the operation extra carries. */
export type OutpointRef = `${string}-${number}`;

/** The outpoints a transaction spends. Coinbase inputs, which reference none, are skipped. */
export function spentOutpoints(tx: TX): OutpointRef[] {
  return tx.inputs
    .filter((input): input is Input & { output_hash: string } => Boolean(input.output_hash))
    .map(input => `${input.output_hash}-${input.output_index}` as OutpointRef);
}

/**
 * The fee the explorer reports.
 *
 * Trustworthy for a fully transparent transaction, where it is the difference
 * between inputs and outputs the explorer can see. A transaction touching a
 * shielded pool moves value the explorer cannot see, so its figure understates
 * (or zeroes) the real fee -- recovering that one means reading the raw
 * transaction through the engine, which is what bridge/transaction-details.ts
 * does for the account path.
 */
export function explorerFee(tx: TX): BigNumber {
  return new BigNumber(tx.fees ?? 0);
}

/** Block time when confirmed, else the time the explorer first saw the transaction. */
export function txDate(tx: TX): Date {
  return new Date(tx.block?.time || tx.received_at);
}

export function sumValues(entries: Pick<Input | Output, "value">[]): BigNumber {
  return entries.reduce((sum, entry) => sum.plus(entry.value), new BigNumber(0));
}

export type TransparentTxParticipation = {
  /** Inputs spending value the owner controls. */
  ownInputs: Input[];
  /** Outputs paying value back to the owner. */
  ownOutputs: Output[];
  /** Total spent from the owner's addresses. */
  spent: BigNumber;
  /** Total paid back to the owner's addresses (change included). */
  returned: BigNumber;
  /** Every address seen spending, in transaction order. A shielded spend contributes none. */
  senders: string[];
  /** Every address paid, in transaction order. A shielded output contributes none. */
  recipients: string[];
};

/**
 * Splits a transaction's transparent flows into what the owner spent and what
 * came back, `isOwn` deciding what "owner" means (one address for the headless
 * path, the account's whole address set for the bridge).
 *
 * Outputs the explorer could not attribute are dropped: it reports them with an
 * address containing "unknown", which is a placeholder rather than a payee.
 */
export function classifyTransparentTx(
  tx: TX,
  isOwn: (address: string) => boolean,
): TransparentTxParticipation {
  const ownInputs = tx.inputs.filter(input => input.address && isOwn(input.address) && input.value);
  const attributedOutputs = tx.outputs.filter(
    output => output.address && !output.address.includes("unknown"),
  );
  const ownOutputs = attributedOutputs.filter(output => isOwn(output.address));

  return {
    ownInputs,
    ownOutputs,
    spent: sumValues(ownInputs),
    returned: sumValues(ownOutputs),
    senders: [...new Set(tx.inputs.map(input => input.address).filter(Boolean) as string[])],
    recipients: [...new Set(attributedOutputs.map(output => output.address))],
  };
}

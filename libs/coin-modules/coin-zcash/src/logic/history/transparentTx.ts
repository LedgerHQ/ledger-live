import { BigNumber } from "bignumber.js";
import type { Input, TX } from "@ledgerhq/wallet-btc/index";

/**
 * Primitives over an explorer transaction, consumed by the bridge sync (see
 * bridge/sync.ts): what can be read from a transaction without knowing whose it
 * is, kept out of the sync's own mapping so each is testable on its own.
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

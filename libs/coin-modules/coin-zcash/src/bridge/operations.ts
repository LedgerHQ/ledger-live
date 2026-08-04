import { BigNumber } from "bignumber.js";
import type { OperationType } from "@ledgerhq/types-live";
import type { DecryptedOutput, ShieldedTransaction, SpendableNote } from "../network/types";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import type { BtcOperation } from "../types/bridge";

/**
 * Value the transaction moved out of the shielded pools through its transparent
 * outputs. Transparent inputs make that attribution impossible — the outputs may
 * be paid by those inputs instead — so the value is only counted without them.
 */
const deshieldedValue = (tx: ShieldedTransaction): BigNumber =>
  tx.hasTransparentInputs || !tx.transparentOut ? new BigNumber(0) : tx.transparentOut;

type NoteDirection = "incoming" | "outgoing";

const hasDirection = (notes: { transfer_type: string }[], direction: NoteDirection): boolean =>
  notes.some(n => n.transfer_type === direction);

/**
 * Pick the shielded type for the net-delta direction, preferring the newest pool
 * present (ironwood → orchard), falling back to sapling.
 */
const shieldedTypeByProtocol = (
  direction: NoteDirection,
  ironwoodOutputs: { transfer_type: string }[],
  orchardOutputs: { transfer_type: string }[],
): OperationType => {
  const suffix = direction === "incoming" ? "IN" : "OUT";
  if (hasDirection(ironwoodOutputs, direction)) return `SHIELDED_TX_IRONWOOD_${suffix}`;
  if (hasDirection(orchardOutputs, direction)) return `SHIELDED_TX_ORCHARD_${suffix}`;
  return `SHIELDED_TX_SAPLING_${suffix}`;
};

/**
 * Pick the outgoing type for a shielded→transparent send, where no note crossed
 * the wallet boundary so the pool is inferred from which outputs exist.
 */
const deshieldedType = (
  ironwoodOutputs: { length: number },
  orchardOutputs: { length: number },
  saplingOutputs: { length: number },
): OperationType => {
  if (ironwoodOutputs.length > 0) return "SHIELDED_TX_IRONWOOD_OUT";
  return saplingOutputs.length > 0 && orchardOutputs.length === 0
    ? "SHIELDED_TX_SAPLING_OUT"
    : "SHIELDED_TX_ORCHARD_OUT";
};

export const getTxType = (tx: ShieldedTransaction): OperationType => {
  if (!tx.decryptedData) return "UNKNOWN";

  const orchardOutputs = tx.decryptedData.orchard_outputs ?? [];
  const saplingOutputs = tx.decryptedData.sapling_outputs ?? [];
  const ironwoodOutputs = tx.decryptedData.ironwood_outputs ?? [];

  const netDelta = applyOutputDelta(new BigNumber(0), [
    ...ironwoodOutputs,
    ...orchardOutputs,
    ...saplingOutputs,
  ]);

  if (netDelta.isGreaterThan(0))
    return shieldedTypeByProtocol("incoming", ironwoodOutputs, orchardOutputs);
  if (netDelta.isLessThan(0))
    return shieldedTypeByProtocol("outgoing", ironwoodOutputs, orchardOutputs);

  // No note crossed the wallet boundary, yet a shielded→transparent send looks
  // exactly like this: its value went to a transparent output and only the change
  // came back, as an `internal` note (or no note at all, when the spent note was
  // consumed whole). The transparent bundle is the only place that value appears.
  if (deshieldedValue(tx).isGreaterThan(0))
    return deshieldedType(ironwoodOutputs, orchardOutputs, saplingOutputs);

  return "SHIELDED_TX_INTERNAL";
};

export function applyOutputDelta(
  balance: BigNumber,
  outputs: { transfer_type: string; amount: BigNumber }[],
): BigNumber {
  let result = balance;
  for (const n of outputs) {
    if (n.transfer_type === "incoming") result = result.plus(n.amount);
    else if (n.transfer_type === "outgoing") result = result.minus(n.amount);
  }
  return result;
}

export function computeProtocolDeltas(transactions: ShieldedTransaction[]): {
  deltaSapling: BigNumber;
  deltaOrchard: BigNumber;
  deltaIronwood: BigNumber;
} {
  let deltaSapling = new BigNumber(0);
  let deltaOrchard = new BigNumber(0);
  let deltaIronwood = new BigNumber(0);
  for (const tx of transactions) {
    deltaSapling = applyOutputDelta(deltaSapling, tx.decryptedData?.sapling_outputs ?? []);
    deltaOrchard = applyOutputDelta(deltaOrchard, tx.decryptedData?.orchard_outputs ?? []);
    deltaIronwood = applyOutputDelta(deltaIronwood, tx.decryptedData?.ironwood_outputs ?? []);
  }
  return { deltaSapling, deltaOrchard, deltaIronwood };
}

export function computeOutgoingFees(transactions: ShieldedTransaction[]): BigNumber {
  let fees = new BigNumber(0);
  for (const tx of transactions) {
    if (getTxType(tx).endsWith("_OUT")) {
      fees = fees.plus(tx.fee ?? new BigNumber(0));
    }
  }
  return fees;
}

/**
 * Compute Orchard balance by summing unspent notes.
 * Notes without `isSpent` are treated as unspent (conservative).
 * Sapling balance is not computed (Ledger is Orchard-only).
 */
export function computeBalanceFromNotes(transactions: ShieldedTransaction[]): BigNumber {
  return transactions
    .flatMap(tx => tx.decryptedData?.orchard_outputs ?? [])
    .filter(
      n => n.isSpent !== true && (n.transfer_type === "incoming" || n.transfer_type === "internal"),
    )
    .reduce((sum, n) => sum.plus(n.amount), new BigNumber(0));
}

type PoolSelector = (tx: ShieldedTransaction) => DecryptedOutput[] | undefined;

/**
 * Collect all unspent notes with full spending data from the pool selected by
 * `selectOutputs`. Returns only notes that have all spending fields (rseed, cmx,
 * position, etc.).
 */
function collectSpendableNotesFromPool(
  transactions: ShieldedTransaction[],
  selectOutputs: PoolSelector,
): SpendableNote[] {
  const notes: SpendableNote[] = [];
  for (const tx of transactions) {
    for (const [i, n] of (selectOutputs(tx) ?? []).entries()) {
      if (
        n.isSpent !== true &&
        (n.transfer_type === "incoming" || n.transfer_type === "internal") &&
        n.nullifier !== undefined &&
        n.rho !== undefined &&
        n.rseed !== undefined &&
        n.cmx !== undefined &&
        n.position !== undefined &&
        n.recipient !== undefined
      ) {
        notes.push({
          txid: tx.id,
          outputIndex: i,
          nullifier: n.nullifier,
          amount: n.amount,
          rho: n.rho,
          rseed: n.rseed,
          cmx: n.cmx,
          position: n.position,
          recipient: n.recipient,
        });
      }
    }
  }
  return notes;
}

/**
 * Collect all unspent Orchard notes with full spending data.
 * Returns only notes that have all spending fields (rseed, cmx, position, etc.).
 */
export function collectSpendableNotes(transactions: ShieldedTransaction[]): SpendableNote[] {
  return collectSpendableNotesFromPool(transactions, tx => tx.decryptedData?.orchard_outputs);
}

/**
 * Compute Ironwood balance by summing unspent notes from ironwood_outputs.
 * Notes without `isSpent` are treated as unspent (conservative).
 */
export function computeIronwoodBalanceFromNotes(transactions: ShieldedTransaction[]): BigNumber {
  return transactions
    .flatMap(tx => tx.decryptedData?.ironwood_outputs ?? [])
    .filter(
      n => n.isSpent !== true && (n.transfer_type === "incoming" || n.transfer_type === "internal"),
    )
    .reduce((sum, n) => sum.plus(n.amount), new BigNumber(0));
}

/**
 * Collect all unspent Ironwood notes with full spending data.
 * Returns only notes that have all spending fields (rseed, cmx, position, etc.).
 */
export function collectIronwoodSpendableNotes(
  transactions: ShieldedTransaction[],
): SpendableNote[] {
  return collectSpendableNotesFromPool(transactions, tx => tx.decryptedData?.ironwood_outputs);
}

/**
 * Converts raw shielded transactions to BtcOperation format.
 */
export function convertShieldedTransactionsToOperations(
  shieldedTransactions: ShieldedTransaction[],
  accountId: string,
): BtcOperation[] {
  return shieldedTransactions.map(tx => {
    const txType = getTxType(tx);
    const allNotes = [
      ...(tx.decryptedData?.orchard_outputs ?? []),
      ...(tx.decryptedData?.sapling_outputs ?? []),
      ...(tx.decryptedData?.ironwood_outputs ?? []),
    ];
    const sumNotes = (transferType: string) =>
      allNotes
        .filter(n => n.transfer_type === transferType)
        .reduce((sum, n) => sum.plus(n.amount), new BigNumber(0));

    const fee = new BigNumber(tx.fee);
    let value = new BigNumber(0);
    if (txType.endsWith("_IN")) {
      value = sumNotes("incoming");
    } else if (txType.endsWith("_OUT")) {
      // Outgoing value spans both destinations the funds can reach — other shielded
      // addresses and transparent ones — and includes the fee, the convention the
      // transparent operations and the optimistic operation both follow.
      value = sumNotes("outgoing").plus(deshieldedValue(tx)).plus(fee);
    }

    const operation: BtcOperation = {
      id: encodeOperationId(accountId, tx.id, txType),
      hash: tx.id,
      accountId,
      blockHash: tx.blockHash,
      blockHeight: tx.blockHeight,
      type: txType,
      senders: [],
      recipients: [],
      date: new Date(tx.timestamp * 1000), // zcash shielded transaction timestamps are Unix seconds.
      value,
      fee,
      extra: {},
      transactionSequenceNumber: new BigNumber(tx.blockHeight),
      subOperations: [],
      nftOperations: [],
    };

    return operation;
  });
}

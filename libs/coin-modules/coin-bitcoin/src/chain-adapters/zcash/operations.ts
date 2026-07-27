import { BigNumber } from "bignumber.js";
import type { OperationType } from "@ledgerhq/types-live";
import type { ShieldedTransaction, SpendableNote } from "./types";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import type { BtcOperation } from "../../types";

/**
 * Value the transaction moved out of the shielded pools through its transparent
 * outputs. Transparent inputs make that attribution impossible — the outputs may
 * be paid by those inputs instead — so the value is only counted without them.
 */
const deshieldedValue = (tx: ShieldedTransaction): BigNumber =>
  tx.hasTransparentInputs || !tx.transparentOut ? new BigNumber(0) : tx.transparentOut;

export const getTxType = (tx: ShieldedTransaction): OperationType => {
  if (!tx.decryptedData) return "UNKNOWN";

  const orchardOutputs = tx.decryptedData.orchard_outputs ?? [];
  const saplingOutputs = tx.decryptedData.sapling_outputs ?? [];

  let netDelta = new BigNumber(0);
  for (const note of [...orchardOutputs, ...saplingOutputs]) {
    if (note.transfer_type === "incoming") netDelta = netDelta.plus(note.amount);
    else if (note.transfer_type === "outgoing") netDelta = netDelta.minus(note.amount);
  }

  if (netDelta.isGreaterThan(0)) {
    return orchardOutputs.some(n => n.transfer_type === "incoming")
      ? "SHIELDED_TX_ORCHARD_IN"
      : "SHIELDED_TX_SAPLING_IN";
  }
  if (netDelta.isLessThan(0)) {
    return orchardOutputs.some(n => n.transfer_type === "outgoing")
      ? "SHIELDED_TX_ORCHARD_OUT"
      : "SHIELDED_TX_SAPLING_OUT";
  }

  // No note crossed the wallet boundary, yet a shielded→transparent send looks
  // exactly like this: its value went to a transparent output and only the change
  // came back, as an `internal` note (or no note at all, when the spent note was
  // consumed whole). The transparent bundle is the only place that value appears.
  if (deshieldedValue(tx).isGreaterThan(0)) {
    return saplingOutputs.length > 0 && orchardOutputs.length === 0
      ? "SHIELDED_TX_SAPLING_OUT"
      : "SHIELDED_TX_ORCHARD_OUT";
  }

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
} {
  let deltaSapling = new BigNumber(0);
  let deltaOrchard = new BigNumber(0);
  for (const tx of transactions) {
    deltaSapling = applyOutputDelta(deltaSapling, tx.decryptedData?.sapling_outputs ?? []);
    deltaOrchard = applyOutputDelta(deltaOrchard, tx.decryptedData?.orchard_outputs ?? []);
  }
  return { deltaSapling, deltaOrchard };
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

/**
 * Collect all unspent Orchard notes with full spending data.
 * Returns only notes that have all spending fields (rseed, cmx, position, etc.).
 */
export function collectSpendableNotes(transactions: ShieldedTransaction[]): SpendableNote[] {
  const notes: SpendableNote[] = [];
  for (const tx of transactions) {
    for (const [i, n] of (tx.decryptedData?.orchard_outputs ?? []).entries()) {
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

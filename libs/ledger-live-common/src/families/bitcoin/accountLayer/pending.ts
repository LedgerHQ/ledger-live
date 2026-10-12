import type { Account, Operation } from "@ledgerhq/types-live";
import type { CraftedTransaction } from "@ledgerhq/coin-module-framework/api/types";
import type { BitcoinSigningEnvelope, CraftedDetails } from "@ledgerhq/coin-bitcoin/api";
import { BigNumber } from "bignumber.js";
import {
  getFeePerByte,
  type BtcOperationExtra,
  type Transaction,
  type TransactionRaw,
} from "../types";

const inputsOf = (op: Operation): string[] =>
  (op.extra as BtcOperationExtra | undefined)?.inputs ?? [];

const isConfirmed = (op: Operation): boolean =>
  op.blockHeight !== null && op.blockHeight !== undefined;

/**
 * Pending operations of a UTXO account have no nonce: one is settled when its transaction is
 * confirmed, or when another confirmed transaction spends one of its inputs (it was replaced or
 * double spent). Optimistic operations past their retention are already dropped by `makeSync`.
 *
 * The confirmed counterpart of an optimistic send also takes the recipient the user entered, which
 * the chain view cannot always tell apart from change (coin-bitcoin's postSync, unchanged).
 */
export function postSync(_initial: Account, synced: Account): Account {
  if (synced.pendingOperations.length === 0) return synced;

  const confirmedHashes = new Set(synced.operations.map(op => op.hash));
  // a pending operation's own confirmed copy is already settled by its hash
  const spentByConfirmed = new Set(synced.operations.filter(isConfirmed).flatMap(inputsOf));

  const pendingByHash = new Map(synced.pendingOperations.map(op => [op.hash, op]));
  const operations = synced.operations.map(op => {
    const optimistic = pendingByHash.get(op.hash);
    if (!optimistic?.recipients.length || op.type.endsWith("IN")) return op;
    return { ...op, recipients: optimistic.recipients };
  });

  const pendingOperations = synced.pendingOperations.filter(
    op => !confirmedHashes.has(op.hash) && !inputsOf(op).some(input => spentByConfirmed.has(input)),
  );

  return { ...synced, operations, pendingOperations };
}

/**
 * The optimistic operation of a send, from what was crafted: the real senders and recipients, the
 * fee, and the inputs it spends — which coin selection excludes until it is synced, and which
 * replace-by-fee reads back.
 */
export function decorateOptimisticOperation(
  operation: Operation,
  crafted: CraftedTransaction,
  _account: Account,
  transaction: Record<string, unknown>,
): Operation {
  const details = crafted.details as CraftedDetails | undefined;
  if (!details) return operation;
  const envelope = JSON.parse(crafted.transaction) as BitcoinSigningEnvelope;
  const rbf = envelope.inputs.some(input => input.sequence < 0xfffffffe);
  const fee = new BigNumber(details.fee.toString());

  const transactionRaw = operation.transactionRaw as TransactionRaw | undefined;
  // the rate signed, so that an edit compares with it: a custom rate left over from before a
  // preset was picked is not
  const { feePerByte: _chosen, ...choices } = transactionRaw?.familySpecificData ?? {};
  const signedRate = getFeePerByte(transaction as Transaction);
  return {
    ...operation,
    fee,
    value: new BigNumber(details.amount.toString()).plus(fee),
    senders: details.senders,
    recipients: details.recipients.length
      ? details.recipients
      : [(transaction as Transaction).recipient],
    ...(transactionRaw
      ? {
          transactionRaw: {
            ...transactionRaw,
            familySpecificData: {
              ...choices,
              ...(signedRate ? { feePerByte: signedRate.toFixed() } : {}),
              rbf,
            },
          } as TransactionRaw as NonNullable<Operation["transactionRaw"]>,
        }
      : {}),
    extra: {
      ...(operation.extra as Record<string, unknown>),
      inputs: details.inputs,
      inputRefs: details.inputRefs,
    },
  };
}

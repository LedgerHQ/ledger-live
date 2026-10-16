import type { CraftedAccountTransaction } from "@ledgerhq/account-module-framework";
import type { CraftedDetails } from "@ledgerhq/coin-bitcoin/api";
import type { Account, Operation } from "@ledgerhq/types-live";
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
 * A pending send is settled, without its own transaction on chain, when a confirmed transaction
 * spends one of its inputs: it was replaced or double spent.
 */
export function isPendingSettled(pending: Operation, synced: Account): boolean {
  const spentByConfirmed = new Set(synced.operations.filter(isConfirmed).flatMap(inputsOf));
  return inputsOf(pending).some(input => spentByConfirmed.has(input));
}

/**
 * The synced operation of a send keeps the recipient the user entered, which the chain view
 * cannot always tell apart from change.
 */
export function mergeSentOperation(synced: Operation, optimistic: Operation): Operation {
  if (!optimistic.recipients.length || synced.type.endsWith("IN")) return synced;
  return { ...synced, recipients: optimistic.recipients };
}

/**
 * What only the bitcoin family shows of a send: the inputs it spends with their addresses, and
 * the choices signed — the fee rate, and whether it can be replaced — for the edit flows.
 */
export function decorateOptimisticOperation(
  operation: Operation,
  crafted: CraftedAccountTransaction,
  _account: Account,
  transaction: Record<string, unknown>,
): Operation {
  const details = crafted.details as Partial<CraftedDetails> | undefined;
  const { replaceable: _replaceable, ...extra } = operation.extra as BtcOperationExtra & {
    replaceable?: boolean;
  };
  const transactionRaw = operation.transactionRaw as TransactionRaw | undefined;
  // a custom rate left over from before a preset was picked is not the rate signed
  const { feePerByte: _chosen, ...choices } = transactionRaw?.familySpecificData ?? {};
  const signedRate = getFeePerByte(transaction as Transaction);
  return {
    ...operation,
    ...(transactionRaw
      ? {
          transactionRaw: {
            ...transactionRaw,
            familySpecificData: {
              ...choices,
              ...(signedRate ? { feePerByte: signedRate.toFixed() } : {}),
              rbf: !!details?.replaceable,
            },
          } as TransactionRaw as NonNullable<Operation["transactionRaw"]>,
        }
      : {}),
    extra: { ...extra, ...(details?.inputRefs ? { inputRefs: details.inputRefs } : {}) },
  };
}

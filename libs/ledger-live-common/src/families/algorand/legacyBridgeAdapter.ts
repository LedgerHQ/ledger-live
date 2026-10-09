import { addPrefixToken } from "@ledgerhq/coin-algorand/tokens";
import type {
  AlgorandAccount,
  AlgorandOperation,
  Transaction as LegacyTransaction,
  TransactionStatus,
} from "@ledgerhq/coin-algorand/types";
import type { AccountBridge } from "@ledgerhq/types-live";

type LegacyAccountBridge = AccountBridge<
  LegacyTransaction,
  AlgorandAccount,
  TransactionStatus,
  AlgorandOperation
>;

/** Either shape, or a mix of both: the output below keeps the generic fields it read. */
type BridgeInput = Omit<LegacyTransaction, "mode"> & {
  mode: string;
  memoValue?: string | null;
  assetReference?: string;
};

/**
 * Must stay idempotent: the legacy `prepareTransaction` returns its already converted output, which
 * comes back through here on every later call.
 */
export function toLegacyTransaction(tx: BridgeInput): LegacyTransaction {
  const mode = tx.mode === "changeTrust" ? "optIn" : tx.mode;
  const assetId = tx.assetReference ? addPrefixToken(tx.assetReference) : tx.assetId;
  // A `memoValue` key means the generic memo editor owns the note.
  const memo = "memoValue" in tx ? (tx.memoValue ?? undefined) : tx.memo;
  return { ...tx, mode, assetId, memo } as LegacyTransaction;
}

/** Lets the legacy bridge take the generic transaction shape, so the apps write only that shape. */
export function withGenericTransactionSupport(bridge: LegacyAccountBridge): LegacyAccountBridge {
  return {
    ...bridge,
    prepareTransaction: (account, tx) =>
      bridge.prepareTransaction(account, toLegacyTransaction(tx)),
    getTransactionStatus: (account, tx) =>
      bridge.getTransactionStatus(account, toLegacyTransaction(tx)),
    estimateMaxSpendable: args =>
      bridge.estimateMaxSpendable({
        ...args,
        transaction: args.transaction && toLegacyTransaction(args.transaction),
      }),
    signOperation: args =>
      bridge.signOperation({ ...args, transaction: toLegacyTransaction(args.transaction) }),
  };
}

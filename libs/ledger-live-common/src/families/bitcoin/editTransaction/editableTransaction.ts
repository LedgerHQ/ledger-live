import type { Account, Operation } from "@ledgerhq/types-live";
import {
  bitcoinPickingStrategy,
  type BitcoinFamilySpecificData,
  type TransactionRaw,
  type UtxoStrategy,
} from "../types";

/** The transaction the legacy bridge stored on the operations it sent: the choices at the top level. */
type LegacyTransactionRaw = TransactionRaw & {
  utxoStrategy?: UtxoStrategy;
  rbf?: boolean;
  feePerByte?: string | null;
  networkInfo?: unknown;
  opReturnData?: unknown;
  changeAddress?: string;
  replaceTxId?: string;
};

// a Buffer persisted as JSON reads back as { type: "Buffer", data: [...] }
function hexOf(data: unknown): string | undefined {
  if (typeof data === "string") return data || undefined;
  const bytes = Buffer.isBuffer(data) ? data : (data as { data?: unknown } | null)?.data;
  return Array.isArray(bytes) || Buffer.isBuffer(bytes)
    ? Buffer.from(bytes).toString("hex") || undefined
    : undefined;
}

/**
 * A pending operation sent before the generic bridge carries its transaction in the legacy shape.
 * Its choices move to `familySpecificData`; it is assumed replaceable, as the legacy edit flow did
 * (the coin module still refuses a replacement of a final transaction, from the chain data).
 */
function fromLegacyShape(raw: LegacyTransactionRaw): TransactionRaw {
  const {
    utxoStrategy,
    rbf: _rbf,
    feePerByte,
    networkInfo: _networkInfo,
    opReturnData,
    changeAddress,
    replaceTxId: _replaceTxId,
    ...common
  } = raw;
  const opReturnHex = hexOf(opReturnData);
  const familySpecificData: BitcoinFamilySpecificData = {
    rbf: true,
    ...(utxoStrategy ? { utxoStrategy } : {}),
    ...(feePerByte ? { feePerByte } : {}),
    ...(opReturnHex ? { opReturnData: opReturnHex } : {}),
    ...(changeAddress ? { changeAddress } : {}),
  };
  return { ...common, familySpecificData };
}

/**
 * The raw transaction an edit (speed up / cancel) of `operation` starts from. `replaceTxId` is
 * always the operation's own hash: re-cancelling a cancel must beat the cancel, never the send a
 * stored `replaceTxId` points to. An operation without a transaction (synced, not sent from here)
 * gets a minimal one.
 */
export function getEditableTransactionRaw(
  operation: Operation,
  mainAccount: Account,
): TransactionRaw {
  const raw = operation.transactionRaw as LegacyTransactionRaw | undefined;
  const base: TransactionRaw = !raw
    ? {
        family: "bitcoin",
        amount: "0",
        recipient: mainAccount.freshAddress,
        familySpecificData: {
          rbf: true,
          utxoStrategy: { strategy: bitcoinPickingStrategy.DEEP_OUTPUTS_FIRST, excludeUTXOs: [] },
        },
      }
    : raw.familySpecificData
      ? raw
      : fromLegacyShape(raw);
  return {
    ...base,
    familySpecificData: { ...base.familySpecificData, replaceTxId: operation.hash },
  };
}

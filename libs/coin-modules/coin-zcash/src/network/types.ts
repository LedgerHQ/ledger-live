import type { BigNumber } from "bignumber.js";
import type { Observable } from "rxjs";
import type { PcztTransaction } from "@ledgerhq/live-signer-zcash";

export type SyncShieldedArgs = {
  startBlockHeight: number;
  viewingKey: string;
  maxBatchSize: number;
  /** Hex-encoded nullifiers of unspent notes from previous syncs. */
  knownNullifiers?: string[];
};

/**
 * Public surface shared by the two native-engine clients
 * ({@link ./ZCash.ZCash} -- in-process, and
 * {@link ./ZCashIPC.ZCashIPC} -- Electron renderer bridge).
 *
 * Both implementations MUST stay signature-compatible so the renderer bundle
 * can alias one to the other. Declaring `implements ZCashClient` on each class
 * lets the compiler enforce that symmetry -- if a method is added or renamed on
 * one side without the other, `tsc` fails.
 */
export interface ZCashClient {
  readonly grpcUrl: string;
  readonly network: string;
  getChainTip(): Promise<number>;
  /** @param timestamp - Unix timestamp in **seconds** (not milliseconds). */
  findBlockHeight(timestamp: number): Promise<number>;
  estimatedSyncTime(totalBlocks: number): Promise<(processedBlocks: number) => SyncEstimatedTime>;
  syncShielded(args: SyncShieldedArgs): Observable<ShieldedSyncResult>;
  buildTransaction?(args: Omit<BuildTransactionArgs, "requestId">): Promise<BuildTransactionResult>;
  finalizeTransaction?(
    args: Omit<FinalizeTransactionArgs, "requestId">,
  ): Promise<FinalizeTransactionResult>;
  broadcastTransaction?(grpcUrl: string, txHex: string): Promise<string>;
}

/** Common constructor args shared by both ZCash client factories. */
export type ZCashClientArgs = {
  grpcUrl: string;
  network?: string;
};

export type ZcashSyncState = "disabled" | "ready" | "running" | "stopped" | "complete" | "outdated";

/** Orchard spending fields shared across note types. */
type SpendingFields = {
  nullifier?: string; // 64-char hex (32 bytes)
  rho?: string; // 64-char hex (32 bytes)
  rseed?: string; // 64-char hex (32 bytes)
  cmx?: string; // 64-char hex (32 bytes)
  position?: string; // decimal string (avoids f64 precision loss)
  recipient?: string; // 86-char hex (43 bytes)
};

export type DecryptedOutputRaw = SpendingFields & {
  memo: string;
  transfer_type: string;
  amount: string; // zatoshis
  is_spent?: boolean;
};

export type DecryptedOutput = SpendingFields & {
  memo: string;
  transfer_type: string;
  amount: BigNumber; // zatoshis
  isSpent?: boolean;
};

/** An unspent Orchard note eligible for spending (all spending fields required). */
export type SpendableNote = Required<SpendingFields> & {
  txid: string;
  outputIndex: number;
  amount: BigNumber;
};

export type DecryptedTransaction = {
  orchard_outputs: DecryptedOutput[];
  sapling_outputs: DecryptedOutput[];
};

export type ShieldedTransaction = {
  id: string;
  hex: string;
  blockHeight: number;
  blockHash: string;
  timestamp: number;
  fee: BigNumber; // zatoshis
  decryptedData?: DecryptedTransaction;
};

export type ZcashPrivateInfo = {
  saplingBalance: BigNumber;
  orchardBalance: BigNumber;
  syncState: ZcashSyncState;
  progress: number;
  estimatedTimeRemaining: SyncEstimatedTime;
  ufvk: string | null;
  birthday: string | null;
  lastSyncTimestamp: number | null;
  lastProcessedBlock: number | null;
  transactions: ShieldedTransaction[];
};

export type ZcashPrivateInfoRaw = {
  orchardBalance: string;
  saplingBalance: string;
  syncState: string;
  progress: number;
  estimatedTimeRemaining: SyncEstimatedTime;
  ufvk: string | null;
  birthday: string | null;
  lastSyncTimestamp: number | null;
  lastProcessedBlock: number | null;
  transactions: ShieldedTransactionRaw[];
};

export type ShieldedTransactionRaw = {
  id: string;
  hex: string;
  blockHeight: number;
  blockHash: string;
  timestamp: number;
  fee: string; // zatoshis
  decryptedData?: {
    orchard_outputs: DecryptedOutputRaw[];
    sapling_outputs: DecryptedOutputRaw[];
  };
};

export type ShieldedSyncResult = {
  processedBlocks: number;
  remainingBlocks: number;
  lastProcessedBlock?: number;
  transactions: ShieldedTransaction[];
  /** Nullifiers from previous syncs that were spent in this range (for incremental sync). */
  spentKnownNullifiers?: string[];
};

/**
 * IPC-safe variant of {@link ShieldedSyncResult}.
 *
 * `BigNumber` does not survive `structuredClone` (used by Electron IPC and
 * UtilityProcess `parentPort.postMessage`), so the native engine emits this
 * raw shape; the renderer client rehydrates it into {@link ShieldedSyncResult}
 * with real `BigNumber` instances.
 */
export type ShieldedSyncResultRaw = {
  processedBlocks: number;
  remainingBlocks: number;
  lastProcessedBlock?: number;
  transactions: ShieldedTransactionRaw[];
  spentKnownNullifiers?: string[];
};

export type SyncEstimatedTime = {
  hours: number;
  minutes: number;
};

export const ZCASH_SHIELDED_TX_IN_TYPES = ["SHIELDED_TX_SAPLING_IN", "SHIELDED_TX_ORCHARD_IN"];

export const ZCASH_SHIELDED_TX_OUT_TYPES = ["SHIELDED_TX_SAPLING_OUT", "SHIELDED_TX_ORCHARD_OUT"];

export const ZCASH_SHIELDED_TX_TYPES = [
  ...ZCASH_SHIELDED_TX_IN_TYPES,
  ...ZCASH_SHIELDED_TX_OUT_TYPES,
  "SHIELDED_TX_INTERNAL",
];

// ── IPC-safe signing types ──────────────────────────────────────────────
//
// All fields are structuredClone-safe: string amounts, hex-encoded bytes,
// primitive numbers. No BigNumber, no Buffer subclasses, no functions.
// PcztTransaction carries Uint8Array and bigint -- both are structuredClone-safe.

export type BuildTransactionArgs = {
  requestId: string;
  grpcUrl: string;
  ufvk: string;
  network?: string;
  seedFingerprint: string;
  accountIndex: number;
  feeZat: string;
  spends: Array<{
    recipient: string;
    valueZat: string;
    rho: string;
    rseed: string;
    cmx: string;
    position: string;
  }>;
  transparentInputs: Array<{
    txid: string;
    vout: number;
    scriptPubKey: string;
    valueZat: string;
    pubkey: string;
    derivationScope: number;
    addressIndex: number;
  }>;
  outputs: Array<{ address: string; valueZat: string; memo?: string }>;
  anchorHeight?: number;
};

export type BuildTransactionResult = {
  /** Hex-encoded canonical PCZT bytes -- passed unchanged to finalizeTransaction. */
  pcztHex: string;
  /**
   * Adapter-applied output of parsePczt(); ready for signPcztTransaction.
   * parsePczt runs in the UtilityProcess (engine.ts) so Uint8Array + bigint
   * values are structuredClone-safe across the IPC boundary.
   */
  pcztTransaction: PcztTransaction;
  feeZat: string;
  anchorHeight: number;
  nActionsOrchard: number;
  nTransparentInputs: number;
  nTransparentOutputs: number;
};

export type FinalizeTransactionArgs = {
  requestId: string;
  /** Hex-encoded canonical PCZT bytes from buildTransaction -- passed unchanged. */
  pczt: string;
  /** One 128-hex-char RedPallas spendAuthSig per real Orchard spend, in PCZT-action order. */
  orchardSignatures: string[];
  /** One DER-hex secp256k1 signature per transparent input (empty for pure Orchard). */
  transparentSignatures: string[];
};

export type FinalizeTransactionResult = {
  /** Hex-encoded signed V5 transaction bytes (ready for broadcast). */
  txHex: string;
  /** 64-char hex txid, big-endian display order (matches ShieldedTransaction.txid). */
  txid: string;
};

export type BroadcastTransactionArgs = {
  requestId: string;
  grpcUrl: string;
  txHex: string;
};

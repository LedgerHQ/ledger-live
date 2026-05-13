import type { BigNumber } from "bignumber.js";
import type { Observable } from "rxjs";
import type { BitcoinAccount, BitcoinAccountRaw, Transaction } from "../../types";

export type SyncShieldedArgs = {
  startBlockHeight: number;
  viewingKey: string;
  maxBatchSize: number;
};

/**
 * Public surface shared by the two native-engine clients
 * ({@link ../ZCash.ZCash} -- in-process, and
 * {@link ../ZCashIPC.ZCashIPC} -- Electron renderer bridge).
 *
 * Both implementations MUST stay signature-compatible so the renderer bundle
 * can alias one to the other (see `rspack.renderer.ts`). Declaring
 * `implements ZCashClient` on each class lets the compiler enforce that
 * symmetry -- if a method is added or renamed on one side without the other,
 * `tsc` fails.
 */
export interface ZCashClient {
  readonly grpcUrl: string;
  readonly network: string;
  getChainTip(): Promise<number>;
  /** @param timestamp - Unix timestamp in **seconds** (not milliseconds). */
  findBlockHeight(timestamp: number): Promise<number>;
  estimatedSyncTime(totalBlocks: number): Promise<(processedBlocks: number) => SyncEstimatedTime>;
  syncShielded(args: SyncShieldedArgs): Observable<ShieldedSyncResult>;
}

/** Common constructor args shared by both ZCash client factories. */
export type ZCashClientArgs = {
  grpcUrl: string;
  network?: string;
};

export type ZcashSyncState = "disabled" | "ready" | "running" | "stopped" | "complete" | "outdated";

export type DecryptedOutputRaw = {
  memo: string;
  transfer_type: string;
  amount: string; // zatoshis
};

export type DecryptedOutput = {
  memo: string;
  transfer_type: string;
  amount: BigNumber; // zatoshis
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

export type ZcashAccount = BitcoinAccount & {
  privateInfo?: ZcashPrivateInfo;
};

export type ZcashAccountRaw = BitcoinAccountRaw & {
  privateInfo?: ZcashPrivateInfoRaw;
};

export function isZcashAccount(a: BitcoinAccount): a is ZcashAccount {
  return "privateInfo" in a && a.currency.id === "zcash";
}

// ── Transaction types ───────────────────────────────────────────────────

export type ZcashTransferType =
  | "transparent"
  | "transparent-to-shielded"
  | "shielded-to-transparent"
  | "shielded";

export type ZcashTransaction = Transaction & {
  transferType: ZcashTransferType;
  /** Optional 512-byte memo field for shielded outputs. */
  memo?: string;
};

export function isZcashTransaction(tx: Transaction): tx is ZcashTransaction {
  return "transferType" in tx && tx.transferType !== null && tx.transferType !== undefined;
}

export function isShieldedTransfer(tx: ZcashTransaction): boolean {
  return (
    tx.transferType !== null && tx.transferType !== undefined && tx.transferType !== "transparent"
  );
}

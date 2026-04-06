import type { BigNumber } from "bignumber.js";

export type * from "./jsonRpcClient";
export type * from "./shieldedTransaction";
export type * from "./ZCash";

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

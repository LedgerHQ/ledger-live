import type { DecryptedTransaction, DecryptedOutput } from "@ledgerhq/zcash-decrypt";
import type { BigNumber } from "bignumber.js";

export type * from "./jsonRpcClient";
export type * from "./shieldedTransaction";
export type * from "./ZCash";

export type ZcashSyncState = "disabled" | "ready" | "running" | "stopped" | "complete" | "outdated";

export type ShieldedTransaction = {
  id: string;
  hex: string;
  blockHeight: number;
  blockHash: string;
  timestamp: number;
  fee: number;
  decryptedData?: DecryptedTransaction;
};

export type ZcashPrivateInfo = {
  saplingBalance: BigNumber;
  orchardBalance: BigNumber;
  ufvk: string | null;
  syncState: ZcashSyncState;
  lastSyncTimestamp: number | null;
  lastBlockProcessed: number | null;
  transactions: ShieldedTransaction[];
};

export type ZcashPrivateInfoRaw = {
  orchardBalance: string;
  saplingBalance: string;
  ufvk: string | null;
  syncState: string;
  lastSyncTimestamp: number | null;
  lastBlockProcessed: number | null;
  transactions: ShieldedTransactionRaw[];
};

export type ShieldedTransactionRaw = {
  id: string;
  hex: string;
  blockHeight: number;
  blockHash: string;
  timestamp: number;
  fee: number;
  decryptedData?: {
    orchard_outputs: DecryptedOutput[];
    sapling_outputs: DecryptedOutput[];
  };
};

export type ShieldedSyncResult = {
  operations: ShieldedTransaction[];
  latestBlockHeight: number;
};

export const ZCASH_SHIELDED_TX_IN_TYPES = ["SHIELDED_TX_SAPLING_IN", "SHIELDED_TX_ORCHARD_IN"];

export const ZCASH_SHIELDED_TX_OUT_TYPES = ["SHIELDED_TX_SAPLING_OUT", "SHIELDED_TX_ORCHARD_OUT"];

export const ZCASH_SHIELDED_TX_TYPES = [
  ...ZCASH_SHIELDED_TX_IN_TYPES,
  ...ZCASH_SHIELDED_TX_OUT_TYPES,
  "SHIELDED_TX_INTERNAL",
];

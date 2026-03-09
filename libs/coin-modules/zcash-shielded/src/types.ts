import { BigNumber } from "bignumber.js";

export type * from "./jsonRpcClient";
export type * from "./shieldedTransaction";
export type * from "./ZCash";

export type ZcashSyncState = "disabled" | "ready" | "running" | "stopped" | "complete" | "outdated";

export type ZcashPrivateInfo = {
  saplingBalance: BigNumber;
  orchardBalance: BigNumber;
  ufvk: string | null;
  syncState: ZcashSyncState;
  lastSyncTimestamp: number | null;
  lastBlockProcessed: number | null;
  transactions: {
    hash: string;
    type: "sapling" | "orchard";
  }[];
};

export type ZcashPrivateInfoRaw = {
  orchardBalance: string;
  saplingBalance: string;
  ufvk: string | null;
  syncState: string;
  lastSyncTimestamp: number | null;
  lastBlockProcessed: number | null;
  transactions: {
    hash: string;
    type: "sapling" | "orchard";
  }[];
};

export const ZCASH_SHIELDED_TX_IN_TYPES = ["SHIELDED_TX_SAPLING_IN", "SHIELDED_TX_ORCHARD_IN"];

export const ZCASH_SHIELDED_TX_OUT_TYPES = ["SHIELDED_TX_SAPLING_OUT", "SHIELDED_TX_ORCHARD_OUT"];

export const ZCASH_SHIELDED_TX_TYPES = [
  ...ZCASH_SHIELDED_TX_IN_TYPES,
  ...ZCASH_SHIELDED_TX_OUT_TYPES,
];

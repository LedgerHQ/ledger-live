import { BigNumber } from "bignumber.js";
import { ZcashPrivateInfo } from "@ledgerhq/coin-bitcoin/types";

export const LOG_TYPE = "zcash-shielded";
export const JSON_RPC_SERVER =
  "https://explorers.api.vault.ledger-test.com/nodes/zec_testnet/zaino/jsonrpc";
export const ZCASH_ACTIVATION_DATE = new Date("2016-10-28");
export const ZCASH_ACTIVATION_DATE_STRING = "2016-10-28";
export const ZCASH_OUTDATED_SYNC_INTERVAL_MINUTES = 2;
export const DEFAULT_ZCASH_PRIVATE_INFO: ZcashPrivateInfo = {
  orchardBalance: new BigNumber(0),
  saplingBalance: new BigNumber(0),
  ufvk: null,
  syncState: "disabled",
  lastSyncTimestamp: null,
  lastBlockProcessed: null,
  transactions: [],
};

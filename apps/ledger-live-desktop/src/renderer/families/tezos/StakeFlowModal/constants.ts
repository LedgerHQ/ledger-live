import BigNumber from "bignumber.js";

// Reserve for reveal + future unstake/finalize fees; padded well above the ~1500 mutez stake-op fee.
export const STAKE_GAS_RESERVE_XTZ = new BigNumber(0.5);

// Must exceed Body's SyncSkipUnderPriority(100); otherwise the await-delegation poll is dropped.
export const AWAIT_DELEGATION_SYNC_PRIORITY = 200;
export const AWAIT_DELEGATION_POLL_INTERVAL_MS = 5000;
export const MAX_AWAIT_DELEGATION_POLLS = 12;

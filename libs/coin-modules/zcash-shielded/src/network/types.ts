/**
 * Block representation from Zcash getblock RPC (verbosity=1).
 * Used for findBlockHeight logic and tests.
 */
export type ZCashBlock = {
  /** Block height / index */
  height: number;
  /** Block time in seconds since epoch (Jan 1 1970 GMT) */
  time: number;
  /** Block hash */
  hash: string;
};

/**
 * Raw getblock RPC response (verbosity=1) from the node.
 * We map this to ZCashBlock in the RPC client.
 */
export type GetBlockRpcResponse = ZCashBlock & {
  [key: string]: unknown;
};

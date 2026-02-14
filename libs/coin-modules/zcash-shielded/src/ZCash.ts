import { decrypt_tx, DecryptedTransaction } from "@ledgerhq/zcash-decrypt";
import { log } from "@ledgerhq/logs";
import { ZCashRpcClient } from "./network/rpc";

/**
 * ZCash API
 */

export type SyncEstimatedTime = {
  hours: number;
  minutes: number;
};

export default class ZCash {
  private readonly rpcClient: ZCashRpcClient | null;

  constructor(nodeUrl?: string) {
    this.rpcClient = nodeUrl ? new ZCashRpcClient(nodeUrl) : null;
  }

  /**
   * Estimates sync time given a total number of blocks to process.
   * This is a curried function that returns a function that returns the estimated sync time.
   * It should be called when processing a block (passing the total number of blocks to process)
   * and then called again when processing the next block.
   * The function will return the estimated sync time in hours and minutes.
   *
   * @param totalBlocks total blocks to process
   * @return an object with the estimated sync time in hours and minutes
   */
  async estimatedSyncTime(totalBlocks: number) {
    const start = Date.now();
    let end: number | null = null;

    return (): SyncEstimatedTime => {
      end = Date.now();
      const totalSeconds = ((end - start) / 1000) * totalBlocks;
      const totalMinutes = Math.floor(totalSeconds / 60);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      return {
        hours,
        minutes,
      };
    };
  }

  /**
   * Decrypts a ZCash shielded - i.e., encrypted - transaction.
   *
   * @param {string} rawHexTransaction, raw string representing an encrypted transaction.
   * @param {string} viewingKey the UFVK - unified full viewing key.
   * @return {Promise<DecryptedOutput>} the decrypted transaction
   */
  async decryptTransaction(
    rawHexTransaction: string,
    viewingKey: string,
  ): Promise<DecryptedTransaction | undefined> {
    try {
      return decrypt_tx(rawHexTransaction, viewingKey);
    } catch (error) {
      log("zcash-shielded", "failed to decrypt transaction", error);
    }
  }

  /**
   * Finds the highest block height whose block time is <= the given timestamp
   * (seconds since epoch). Uses binary search over block heights.
   *
   * @param timestamp seconds since epoch (Jan 1 1970 GMT)
   * @return the highest block height with block.time <= timestamp, or 0 if timestamp is before genesis, or tip height if timestamp is after the last block
   * @throws if no RPC client was provided to the constructor
   */
  async findBlockHeight(timestamp: number): Promise<number> {
    if (!this.rpcClient) {
      throw new Error(
        "ZCash findBlockHeight requires an RPC client; pass { nodeUrl } in the constructor.",
      );
    }

    const maxHeight = await this.rpcClient.getBlockCount();
    if (maxHeight <= 0) {
      return 0;
    }

    let low = 0;
    let high = maxHeight;
    let candidate = 0;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const block = await this.rpcClient.getBlockByHeight(mid);

      if (block.time <= timestamp) {
        candidate = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    return candidate;
  }
}

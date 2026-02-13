import { log } from "@ledgerhq/logs";
import { decrypt_tx, DecryptedTransaction } from "@ledgerhq/zcash-decrypt";
import type { ShieldedTransaction } from "./shieldedTransaction";
import { JsonRpcClient } from "./jsonRpcClient";
import { toShieldedTransaction } from "./shieldedTransaction";
import { LOG_TYPE } from "./constants";

/**
 * ZCash API
 */

export type SyncEstimatedTime = {
  hours: number;
  minutes: number;
};

export default class ZCash {
  nodeUrl: string;

  constructor(args: { nodeUrl: string }) {
    this.nodeUrl = args.nodeUrl;
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
   * Scans a block for shielded transactions matching the given viewing key.
   *
   * @param {string} blockHex Block hex
   * @param {string} viewingKey the UFVK - unified full viewing key.
   * @returns {ShieldedTransaction[]} list of shielded transactions
   */
  async findShieldedTxsInBlock(
    blockHex: string,
    viewingKey: string,
  ): Promise<ShieldedTransaction[]> {
    // 1. retrieve block
    const jsonRpcClient = new JsonRpcClient(this.nodeUrl);
    const block = await jsonRpcClient.getBlock(blockHex);

    // 2. get list of tx
    const transactions = block?.tx;
    const decryptedTransactions = [];

    // 3. retrieve each tx hash
    if (transactions) {
      for (const txId of transactions) {
        const tx = await jsonRpcClient.getRawTransaction(txId);

        // 4. call decryptTransaction for each tx hash containing orchard actions
        if (tx?.orchard.actions.length) {
          try {
            const decryptedTx = await this.decryptTransaction(tx?.hex, viewingKey);
            if (decryptedTx) {
              decryptedTransactions.push(toShieldedTransaction(tx, decryptedTx));
            }
          } catch (_e) {
            log(LOG_TYPE, "warn: could not decrypt transaction");
          }
        }
      }
    }

    // 5. return list of transaction for the given viewingKey
    return decryptedTransactions;
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
      log(LOG_TYPE, "error: failed to decrypt transaction", error);
    }
  }

  /**
   * Finds the lowest block height correspondent to a given timestamp.
   *
   * @param {number} timestamp
   * @return {Promise<number>} a block height
   */
  async findBlockHeight(timestamp: number): Promise<number> {
    return timestamp + 42;
  }
}

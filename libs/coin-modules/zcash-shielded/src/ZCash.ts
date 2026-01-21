import { decrypt_tx, DecryptedTransaction } from "@ledgerhq/zcash-decrypt";

/**
 * ZCash API
 */

export default class ZCash {
  static readonly AVERAGE_BLOCK_SYNC_TIME_MS = 5;

  /**
   * Estimates sync time given a start and an end block.
   *
   * @param {number} startBlock starting block
   * @param {number} endBlock end block, usually the latest confirmed block
   * @return {Promise<number>} the estimated sync time
   */
  async estimateSyncTime(startBlock: number, endBlock: number): Promise<number> {
    return (endBlock - startBlock) * ZCash.AVERAGE_BLOCK_SYNC_TIME_MS;
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
      console.log(error);
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

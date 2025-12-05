/**
 * ZCash API
 */

export default class ZCash {
  static AVERAGE_BLOCK_SYNC_TIME_SECONDS = 5;

  /**
   * Estimates sync time given a starting block height.
   *
   * @param blockHeight
   * @return the estimated sync time
   */
  async estimateSyncTime(startBlock: number, endBlock: number) {
    return (endBlock - startBlock) * ZCash.AVERAGE_BLOCK_SYNC_TIME_SECONDS;
  }

  /**
   * Decrypts a ZCash shielded - i.e., encrypted - transaction.
   *
   * @param encryptedTransaction string raw string representing an encrypted transaction.
   * @return a decrypted transaction
   */
  async decryptTransaction(encryptedTransaction: string): Promise<string> {
    return `decrypted_${encryptedTransaction}`;
  }

  /**
   * Finds the lowest block height correspondent to a given timestamp
   *
   * @param timestamp
   * @return a block height
   */
  async findBlockHeight(timestamp: number): Promise<number> {
    return timestamp + 42;
  }
}

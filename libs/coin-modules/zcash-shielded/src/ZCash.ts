/**
 * ZCash API
 */

export type SyncEstimatedTime = {
  hours: number;
  minutes: number;
};

export default class ZCash {
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

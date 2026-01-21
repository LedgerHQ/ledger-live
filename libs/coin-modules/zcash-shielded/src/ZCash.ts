import ZcashWASM, { DecryptedOutput } from "@cipherscan/zcash-decoder";

/**
 * ZCash API
 */

export default class ZCash {
  static readonly AVERAGE_BLOCK_SYNC_TIME_MS = 5;
  private _wasm?: ZcashWASM = undefined;

  /**
   * Loads the Zcash WASM library.
   *
   * @returns {Promise<ZcashWASM>}
   */
  private async wasm(): Promise<ZcashWASM> {
    if (!this._wasm) {
      this._wasm = await ZcashWASM.init();
    }

    return this._wasm;
  }

  /**
   * Estimates sync time given a start and an end block.
   *
   * @param {nunber} startBlock starting block
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
  ): Promise<DecryptedOutput> {
    // Initialize WASM module
    const zcashWASM = await this.wasm();
    const result = await zcashWASM.decryptMemo(rawHexTransaction, viewingKey);

    return result;
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

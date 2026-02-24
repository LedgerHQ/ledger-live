import { BigNumber } from "bignumber.js";
import { log } from "@ledgerhq/logs";
import { decrypt_tx, DecryptedTransaction } from "@ledgerhq/zcash-decrypt";
import { Block, JsonRpcClient } from "./jsonRpcClient";
import { toShieldedTransaction, ShieldedTransaction } from "./shieldedTransaction";
import { LOG_TYPE } from "./constants";

/**
 * ZCash API
 */

export type SyncEstimatedTime = {
  hours: number;
  minutes: number;
};

export type SyncedShielded = {
  balance: BigNumber;
  processedBlocks: number;
  remainingBlocks: number;
  lastProcessed: number | undefined;
};

export default class ZCash {
  jsonRpcClient: JsonRpcClient;

  constructor(args: { nodeUrl: string }) {
    this.jsonRpcClient = new JsonRpcClient(args.nodeUrl);
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
   * @param {{
   *    block: Block,
   *    viewingKey: string
   * }} args, Block and the UFVK - unified full viewing key.
   * @returns {ShieldedTransaction[]} list of shielded transactions
   */
  async findShieldedTxsInBlock(args: {
    block: Block;
    viewingKey: string;
  }): Promise<ShieldedTransaction[]> {
    const { block, viewingKey } = args;

    // 1. get list of tx
    const transactions = block?.tx;
    const decryptedTransactions = [];

    // 2. retrieve each tx hash
    if (transactions) {
      for (const txId of transactions) {
        if (!txId) {
          continue;
        }

        const tx = await this.jsonRpcClient.getRawTransaction(txId);

        // 3. call decryptTransaction for each tx hash containing orchard actions
        if (tx?.orchard.actions.length) {
          const decryptedTx = await this.decryptTransaction(tx?.hex, viewingKey);

          if (decryptedTx) {
            decryptedTransactions.push(toShieldedTransaction(tx, decryptedTx));
          }
        }
      }
    }

    // 4. return list of transaction for the given viewingKey
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
   * @returns {Promise<number>} a block height
   */
  async findBlockHeight(timestamp: number): Promise<number | undefined> {
    if (timestamp < 0 || !Number.isFinite(timestamp)) {
      log(LOG_TYPE, `error: findBlockHeight invalid timestamp: ${timestamp}`);
      return undefined;
    }

    const maxHeight = await this.jsonRpcClient.getBlockCount();
    if (maxHeight === undefined) {
      log(
        LOG_TYPE,
        "error: findBlockHeight failed to fetch block count from RPC node (getBlockCount returned undefined).",
      );
      return;
    }

    if (maxHeight <= 0) {
      return 0;
    }

    let low = 0;
    let high = maxHeight;
    let candidate = 0;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const block = await this.jsonRpcClient.getBlock(mid.toString());

      if (!block) {
        log(LOG_TYPE, `Block ${mid} not found.`);
        return;
      }

      if (block.time <= timestamp) {
        candidate = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    return candidate;
  }

  /**
   * Parses the blocks in the provided range and, after each iteration,
   * it returns a synced shielded context including aggregate information
   * like the computed balance and processing progress.
   *
   * ### As observable
   * The iterator can be converted to an observable.
   *
   * Example:
   * ```typescript
   * const syncShieldedGenerator = zcash.syncShielded({
   *   startBlockHeight: blockWithMyTx.height,
   *   viewingKey: testAccount1.viewingKey,
   *   maxBatchSize: 3,
   * });
   * const syncShieldedObs = rxjs.from(syncShieldedGenerator);
   * ```
   *
   * ### Stop the iterator
   * The sync operation can be gracefully stopped by calling with the stop
   * argument set to true.
   *
   * Example:
   * ```typescript
   * const syncedShielded = zcash.syncShielded({
   *   startBlockHeight: 3697074,
   *   viewingKey: testAccount1.viewingKey,
   * });
   * await syncedShielded.next(true)
   * ```
   *
   * @param {{
   *    startBlockHeight: number
   *    viewingKey: string
   *    maxBatchSize: number
   * }} args, Block, the UFVK - unified full viewing key, and max batch size.
   * @returns {AsyncGenerator<SyncedShielded>} the current synced shielded context.
   */
  async *syncShielded(args: {
    startBlockHeight: number;
    viewingKey: string;
    maxBatchSize: number;
  }): AsyncGenerator<SyncedShielded, SyncedShielded, boolean | undefined> {
    const { startBlockHeight, viewingKey, maxBatchSize } = args;
    let balance = new BigNumber(0);
    let processedBlocks = 0;
    let remainingBlocks = 0;
    let lastProcessed;

    if (startBlockHeight <= 0 || maxBatchSize <= 0) {
      log(LOG_TYPE, "error: invalid negative args startBlockHeight or maxBatchSize");
      return {
        balance,
        processedBlocks,
        remainingBlocks,
        lastProcessed,
      };
    }

    // 1. get end block height
    let endBlockHeight = await this.jsonRpcClient.getBlockCount();
    if (!endBlockHeight) {
      log(LOG_TYPE, "error: could not retrieve the last block");
      return {
        balance,
        processedBlocks,
        remainingBlocks,
        lastProcessed,
      };
    }

    for (let blockHeight = startBlockHeight; blockHeight <= endBlockHeight; blockHeight++) {
      // 2. on last iteration, update end block height
      if (blockHeight === endBlockHeight) {
        endBlockHeight = await this.jsonRpcClient.getBlockCount();
        if (!endBlockHeight) {
          log(LOG_TYPE, "error: could not retrieve the last block");
          break;
        }
      }

      // 3. get current block
      const block = await this.jsonRpcClient.getBlock(blockHeight.toString());
      if (!block) {
        log(LOG_TYPE, `error: invalid block height ${blockHeight}`);
        break;
      }

      // 4. find shielded tx in block
      const shieldedTxs = await this.findShieldedTxsInBlock({ block, viewingKey });

      // 5. update balance and counters
      balance = balance.plus(calculateShieldedBalance(shieldedTxs));
      processedBlocks++;
      remainingBlocks = endBlockHeight - blockHeight;
      lastProcessed = block.height;

      if (!(processedBlocks % maxBatchSize) || blockHeight === endBlockHeight) {
        const stop = yield {
          balance,
          processedBlocks,
          remainingBlocks,
          lastProcessed,
        };

        if (stop) {
          break;
        }
      }
    }

    return {
      balance,
      processedBlocks,
      remainingBlocks,
      lastProcessed,
    };
  }
}

const calculateShieldedBalance = (shieldedTxs: ShieldedTransaction[]): BigNumber => {
  let shieldedBalance = new BigNumber(0);

  for (const shieldedTx of shieldedTxs) {
    const orchard_outputs = shieldedTx.decryptedData?.orchard_outputs || [];

    // NOTE: sapling_outputs are purposely excluded because we are not implementing sapling yet
    for (const output of orchard_outputs) {
      if (output.transfer_type === "incoming") {
        shieldedBalance = shieldedBalance.plus(output.amount);
      } else if (output.transfer_type === "outgoing") {
        shieldedBalance = shieldedBalance.minus(output.amount);
      } else if (output.transfer_type === "internal") {
        // NOTE: ignore internal tx
        log(LOG_TYPE, `warn: skipped internal orchard output`);
      }
    }
  }

  return shieldedBalance;
};

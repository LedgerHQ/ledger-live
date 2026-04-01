import { BigNumber } from "bignumber.js";
import { Observable } from "rxjs";
import type { ShieldedSyncResult, SyncEstimatedTime, ShieldedTransaction } from "./types";
import type { SyncShieldedArgs } from "./ZCash";
import { log } from "@ledgerhq/logs";
import { ZCASH_LOG_TYPE } from "./constants";

// Lazy-loaded — only evaluated when syncShielded() is first called.
let nativeModulePromise: Promise<typeof import("@ledgerhq/zcash-utils")> | null = null;

function getNativeModule(): Promise<typeof import("@ledgerhq/zcash-utils")> {
  nativeModulePromise ??= import("@ledgerhq/zcash-utils").then(m => {
    log(ZCASH_LOG_TYPE, "@ledgerhq/zcash-utils loaded", Object.keys(m));
    return m;
  });
  return nativeModulePromise;
}

type NativeModule = Awaited<ReturnType<typeof getNativeModule>>;
type NativeStream = Awaited<ReturnType<NativeModule["startSync"]>>;
type NativeTx = NonNullable<Awaited<ReturnType<NativeStream["next"]>>>;

/**
 * ZCash native Rust engine.
 *
 * Mirrors the ZCash class interface but uses the napi-rs Rust addon instead
 * of the WASM/JSON-RPC stack. Streams compact blocks via tonic gRPC and
 * performs trial decryption entirely in Rust — no Node.js event loop involved.
 *
 * ~72,000 bl/s vs ~12 bl/s for the WASM/JSON-RPC backend (bench on 50k blocks,
 * coin-tester-zcash, testnet.zec.rocks, 2026-04-06).
 */
export class ZCashNative {
  readonly grpcUrl: string;
  readonly network: string;

  constructor(args: { grpcUrl: string; network?: string }) {
    this.grpcUrl = args.grpcUrl;
    this.network = args.network ?? "mainnet";
  }

  /**
   * Returns the current chain tip height.
   */
  async getChainTip(): Promise<number> {
    const native = await getNativeModule();
    return native.getChainTip(this.grpcUrl);
  }

  /**
   * Estimates remaining sync time based on observed throughput.
   *
   * @param totalBlocks total blocks to process
   * @return a function that, given the number of blocks processed so far,
   *         returns the estimated remaining sync time in hours and minutes.
   *         Returns { hours: 0, minutes: 0 } when processedBlocks is 0
   *         (not enough data to estimate).
   */
  async estimatedSyncTime(
    totalBlocks: number,
  ): Promise<(processedBlocks: number) => SyncEstimatedTime> {
    const start = Date.now();

    return (processedBlocks: number): SyncEstimatedTime => {
      if (processedBlocks <= 0) return { hours: 0, minutes: 0 };
      const elapsedSeconds = (Date.now() - start) / 1000;
      const secondsPerBlock = elapsedSeconds / processedBlocks;
      const remainingBlocks = totalBlocks - processedBlocks;
      const remainingSeconds = secondsPerBlock * remainingBlocks;

      const totalMinutes = Math.floor(remainingSeconds / 60);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return { hours, minutes };
    };
  }

  /**
   * Scans blocks for shielded transactions matching the given viewing key,
   * using the native Rust gRPC engine (trial decryption on compact blocks, ZIP-307).
   *
   * Emits a ShieldedSyncResult after every maxBatchSize blocks — same contract
   * as ZCash.syncShielded, drop-in compatible.
   *
   * @param args.startBlockHeight  First block to scan (inclusive)
   * @param args.viewingKey        UFVK — unified full viewing key
   * @param args.maxBatchSize      Blocks per emitted chunk (controls progress granularity)
   */
  syncShielded(args: SyncShieldedArgs): Observable<ShieldedSyncResult> {
    return new Observable(subscriber => {
      (async () => {
        const validationError = this.validateSyncArgs(args);
        if (validationError) {
          subscriber.error(validationError);
          return;
        }

        const { startBlockHeight, viewingKey, maxBatchSize } = args;
        const native = await getNativeModule();
        const endHeight = await native.getChainTip(this.grpcUrl);

        log(ZCASH_LOG_TYPE, "syncShielded start", {
          grpcUrl: this.grpcUrl,
          network: this.network,
          startBlockHeight,
          endHeight,
          totalBlocks: endHeight - startBlockHeight + 1,
          maxBatchSize,
        });

        if (startBlockHeight > endHeight) {
          log(ZCASH_LOG_TYPE, "already at tip, nothing to scan");
          subscriber.next({ processedBlocks: 0, remainingBlocks: 0, transactions: [] });
          subscriber.complete();
          return;
        }

        const allTransactions: ShieldedTransaction[] = [];
        let processedBlocks = 0;
        let chunkStart = startBlockHeight;

        while (chunkStart <= endHeight) {
          if (subscriber.closed) {
            log(ZCASH_LOG_TYPE, "subscriber closed — stopping before chunk", {
              chunkStart,
            });
            break;
          }

          const chunkEnd = Math.min(chunkStart + maxBatchSize - 1, endHeight);
          const { blocksScanned, transactions } = await this.syncChunk(
            native,
            viewingKey,
            chunkStart,
            chunkEnd,
            () => subscriber.closed,
          );

          if (subscriber.closed) {
            log(ZCASH_LOG_TYPE, "subscriber closed — stopping after chunk", { chunkStart });
            break;
          }

          processedBlocks += blocksScanned;
          for (const tx of transactions) {
            allTransactions.push(this.mapNativeTx(tx));
          }

          log(ZCASH_LOG_TYPE, "chunk done", {
            chunkStart,
            chunkEnd,
            blocksScanned,
            txFoundInChunk: transactions.length,
            totalTxSoFar: allTransactions.length,
            processedBlocks,
            remainingBlocks: endHeight - chunkEnd,
          });

          if (transactions.length > 0) {
            log(
              ZCASH_LOG_TYPE,
              "transactions found",
              transactions.map(tx => ({
                txid: tx.txid,
                blockHeight: tx.blockHeight,
                fee: tx.fee,
                orchardNotes: tx.orchardNotes,
                saplingNotes: tx.saplingNotes,
              })),
            );
          }

          subscriber.next({
            processedBlocks,
            remainingBlocks: endHeight - chunkEnd,
            lastProcessedBlock: chunkEnd,
            transactions: [...allTransactions],
          });

          chunkStart = chunkEnd + 1;
        }

        log(ZCASH_LOG_TYPE, "syncShielded complete", {
          totalBlocksScanned: processedBlocks,
          totalTransactions: allTransactions.length,
        });
        subscriber.complete();
      })().catch(err => subscriber.error(err));
    });
  }

  private validateSyncArgs(args: SyncShieldedArgs): string | null {
    if (args.startBlockHeight < 0) return "error: invalid negative arg startBlockHeight";
    if (args.maxBatchSize <= 0) return "error: invalid negative or zero arg maxBatchSize";
    return null;
  }

  private async syncChunk(
    native: NativeModule,
    viewingKey: string,
    chunkStart: number,
    chunkEnd: number,
    isCancelled: () => boolean = () => false,
  ): Promise<{ blocksScanned: number; transactions: NativeTx[] }> {
    // Retry and split-on-timeout are handled by the Rust layer via maxRetries.
    const stream = await native.startSync({
      grpcUrl: this.grpcUrl,
      viewingKey,
      startHeight: chunkStart,
      endHeight: chunkEnd,
      network: this.network,
      orchardOnly: true, // Ledger only supports Orchard
      maxRetries: 3, // network retry delegated to Rust
    });

    const transactions: NativeTx[] = [];
    let tx: NativeTx | null;
    while ((tx = await stream.next()) !== null) {
      if (isCancelled()) {
        log(ZCASH_LOG_TYPE, "cancelled mid-stream — calling stream.cancel()");
        stream.cancel();
        return { blocksScanned: 0, transactions: [] };
      }
      transactions.push(tx);
    }

    if (isCancelled()) {
      log(ZCASH_LOG_TYPE, "cancelled after stream exhausted — calling stream.cancel()");
      stream.cancel();
      return { blocksScanned: 0, transactions: [] };
    }

    const stats = await stream.stats();
    log(ZCASH_LOG_TYPE, "chunk stats", {
      chunkStart,
      chunkEnd,
      blocksScanned: stats.blocksScanned,
      elapsedMs: stats.elapsedMs,
    });

    return { blocksScanned: stats.blocksScanned, transactions };
  }

  private mapNativeTx(tx: NativeTx): ShieldedTransaction {
    return {
      id: tx.txid,
      hex: tx.hex,
      blockHeight: tx.blockHeight,
      blockHash: tx.blockHash,
      timestamp: tx.blockTime,
      fee: new BigNumber(tx.fee),
      decryptedData: {
        orchard_outputs: tx.orchardNotes.map(n => ({
          amount: new BigNumber(n.amount),
          memo: n.memo,
          transfer_type: n.transferType,
        })),
        sapling_outputs: tx.saplingNotes.map(n => ({
          amount: new BigNumber(n.amount),
          memo: n.memo,
          transfer_type: n.transferType,
        })),
      },
    };
  }
}

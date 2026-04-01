import { BigNumber } from "bignumber.js";
import { Observable } from "rxjs";
import type { ShieldedSyncResult, SyncEstimatedTime, ShieldedTransaction } from "./types";
import type { SyncShieldedArgs } from "./ZCash";

// Lazy-loaded — only imported when the native engine is actually called.
// This avoids loading the .node addon in environments that don't support it
// (browser, React Native).
let nativeModule: typeof import("@ledgerhq/zcash-utils") | null = null;

async function getNativeModule() {
  if (!nativeModule) {
    nativeModule = await import("@ledgerhq/zcash-utils");
  }
  return nativeModule;
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

  constructor(args: { grpcUrl: string }) {
    this.grpcUrl = args.grpcUrl;
  }

  /**
   * Returns the current chain tip height.
   */
  async getChainTip(): Promise<number> {
    const native = await getNativeModule();
    return native.getChainTip(this.grpcUrl);
  }

  /**
   * Estimates sync time given a total number of blocks to process.
   * Same semantics as ZCash.estimatedSyncTime.
   *
   * @param totalBlocks total blocks to process
   * @return a function that returns the estimated sync time in hours and minutes
   */
  async estimatedSyncTime(totalBlocks: number): Promise<() => SyncEstimatedTime> {
    const start = Date.now();

    return (): SyncEstimatedTime => {
      const elapsed = Date.now() - start;
      const totalSeconds = (elapsed / 1000) * totalBlocks;
      const totalMinutes = Math.floor(totalSeconds / 60);
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

        if (startBlockHeight > endHeight) {
          subscriber.next({ processedBlocks: 0, remainingBlocks: 0, transactions: [] });
          subscriber.complete();
          return;
        }

        const allTransactions: ShieldedTransaction[] = [];
        let processedBlocks = 0;
        let chunkStart = startBlockHeight;

        while (chunkStart <= endHeight) {
          if (subscriber.closed) break;

          const chunkEnd = Math.min(chunkStart + maxBatchSize - 1, endHeight);
          const { blocksScanned, transactions } = await this.syncChunk(
            native,
            viewingKey,
            chunkStart,
            chunkEnd,
          );

          processedBlocks += blocksScanned;
          for (const tx of transactions) {
            allTransactions.push(this.mapNativeTx(tx));
          }

          subscriber.next({
            processedBlocks,
            remainingBlocks: endHeight - chunkEnd,
            lastProcessedBlock: chunkEnd,
            transactions: [...allTransactions],
          });

          chunkStart = chunkEnd + 1;
        }

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
  ): Promise<{ blocksScanned: number; transactions: NativeTx[] }> {
    // Retry and split-on-timeout are handled by the Rust layer via maxRetries.
    const stream = await native.startSync({
      grpcUrl: this.grpcUrl,
      viewingKey,
      startHeight: chunkStart,
      endHeight: chunkEnd,
      orchardOnly: true, // Ledger only supports Orchard
      maxRetries: 3,     // network retry delegated to Rust
    });

    const transactions: NativeTx[] = [];
    let tx: NativeTx | null;
    while ((tx = await stream.next()) !== null) {
      transactions.push(tx);
    }
    const stats = await stream.stats();

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

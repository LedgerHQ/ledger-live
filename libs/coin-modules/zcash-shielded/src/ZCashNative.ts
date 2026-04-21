/**
 * In-process ZCash native engine wrapper.
 *
 * Drives the napi-rs Rust engine (`@ledgerhq/zcash-utils`) **directly** from
 * the current Node-compatible process — no IPC, no UtilityProcess. Intended
 * for plain Node runtimes: coin-tester, integration tests, Ledger Live Mobile
 * (when we later wire it up), or any context where `require()` of a native
 * `.node` addon is allowed.
 *
 * For the Electron renderer, use {@link ./ZCashNativeIPC.ZCashNativeIPC} instead. It
 * exposes the exact same public API but delegates to a UtilityProcess over
 * IPC. Both classes share `engine.ts`, so business logic lives in one place.
 *
 * Public API (kept identical to ZCashNativeIPC on purpose):
 *
 *   new ZCashNative({ grpcUrl, network })
 *     .getChainTip(): Promise<number>
 *     .estimatedSyncTime(totalBlocks): (processedBlocks) => SyncEstimatedTime
 *     .syncShielded(args): Observable<ShieldedSyncResult>
 *
 * The engine emits IPC-safe `Raw` shapes; we rehydrate to BigNumber here so
 * callers always receive the full-fat `ShieldedSyncResult`.
 */

import { Observable } from "rxjs";
import { log } from "@ledgerhq/logs";
import { ZCASH_LOG_TYPE } from "./constants";
import type { ShieldedSyncResult, SyncEstimatedTime } from "./types";
import type { SyncShieldedArgs } from "./types";
import {
  getChainTipJob,
  startSyncJob,
  validateStartSyncArgs,
  type StartSyncJobArgs,
} from "./native-engine/engine";
import { rehydrateSyncResult } from "./native-engine/rehydrate";
import { createSyncTimeEstimator } from "./native-engine/estimator";

type NativeStreamHandle = { cancel: () => void };

export class ZCashNative {
  readonly grpcUrl: string;
  readonly network: string;

  constructor(args: { grpcUrl: string; network?: string }) {
    this.grpcUrl = args.grpcUrl;
    this.network = args.network ?? "mainnet";
  }

  /**
   * Returns the current chain tip height, via the native gRPC client.
   */
  async getChainTip(): Promise<number> {
    return getChainTipJob(this.grpcUrl);
  }

  /**
   * Wall-clock-based estimator. Kept `async` to preserve the original public
   * contract used by callers; the underlying logic is sync and shared with
   * `ZCashNativeIPC` via `createSyncTimeEstimator`.
   */
  async estimatedSyncTime(
    totalBlocks: number,
  ): Promise<(processedBlocks: number) => SyncEstimatedTime> {
    return createSyncTimeEstimator(totalBlocks);
  }

  /**
   * Scans blocks for shielded transactions matching the viewing key, driving
   * the native Rust engine in-process.
   *
   * The Observable's teardown flips a `cancelled` flag and — if a native
   * stream is in flight — calls `stream.cancel()` so tonic/gRPC tears down
   * immediately rather than waiting for the current batch to finish.
   */
  syncShielded(args: SyncShieldedArgs): Observable<ShieldedSyncResult> {
    return new Observable<ShieldedSyncResult>(subscriber => {
      const validationError = validateStartSyncArgs(args);
      if (validationError) {
        subscriber.error(validationError);
        return;
      }

      let cancelled = false;
      let activeStream: NativeStreamHandle | null = null;
      const isCancelled = () => cancelled || subscriber.closed;

      const jobArgs: StartSyncJobArgs = {
        grpcUrl: this.grpcUrl,
        network: this.network,
        viewingKey: args.viewingKey,
        startBlockHeight: args.startBlockHeight,
        maxBatchSize: args.maxBatchSize,
      };

      startSyncJob(
        jobArgs,
        chunk => {
          if (isCancelled()) return;
          subscriber.next(rehydrateSyncResult(chunk));
        },
        {
          isCancelled,
          onActiveStream: stream => {
            activeStream = stream;
          },
        },
      )
        .then(() => {
          if (!isCancelled()) subscriber.complete();
        })
        .catch(err => subscriber.error(err));

      return () => {
        cancelled = true;
        if (activeStream) {
          log(ZCASH_LOG_TYPE, "teardown — cancelling active native stream");
          try {
            activeStream.cancel();
          } catch (err) {
            log(ZCASH_LOG_TYPE, "teardown — stream.cancel() threw", { err: String(err) });
          }
          activeStream = null;
        }
      };
    });
  }
}

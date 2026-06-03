/**
 * In-process ZCash native engine client.
 *
 * Drives the napi-rs Rust engine (`@ledgerhq/zcash-utils`) **directly** from
 * the current Node-compatible process -- no IPC, no UtilityProcess. Intended
 * for plain Node runtimes: coin-tester, integration tests, Ledger Live Mobile
 * (when we later wire it up), or any context where `require()` of a native
 * `.node` addon is allowed.
 *
 * For the Electron renderer, use {@link ./ZCashIPC.createZCashIPCClient}
 * instead. It exposes the exact same {@link ZCashClient} surface but delegates
 * to a UtilityProcess over IPC.
 *
 * Usage (production — deps wired automatically):
 *
 *   const client = createZCashClient({ grpcUrl, network });
 *
 * Usage (tests — inject fake deps):
 *
 *   const client = createZCashClientWith(fakeDeps, { grpcUrl });
 */

import { Observable } from "rxjs";
import { log } from "@ledgerhq/logs";
import { ZCASH_LOG_TYPE } from "./constants";
import type {
  ShieldedSyncResult,
  ShieldedSyncResultRaw,
  SyncEstimatedTime,
  SyncShieldedArgs,
  ZCashClient,
  ZCashClientArgs,
} from "./types";
import type { StartSyncJobArgs } from "./native-engine/engine";
import {
  getChainTipJob,
  findBlockHeightJob,
  startSyncJob,
  validateStartSyncArgs,
} from "./native-engine/engine";
import { rehydrateSyncResult } from "./serialization/rehydrate";
import { createSyncTimeEstimator } from "./sync-estimator";

// ── Dependency & argument types ─────────────────────────────────────────

type NativeStreamHandle = { cancel: () => void };

export type ZCashClientDeps = {
  getChainTipJob: (grpcUrl: string) => Promise<number>;
  findBlockHeightJob: (grpcUrl: string, timestamp: number) => Promise<number>;
  validateStartSyncArgs: (args: SyncShieldedArgs) => string | null;
  startSyncJob: (
    args: StartSyncJobArgs,
    onChunk: (chunk: ShieldedSyncResultRaw) => void,
    hooks: {
      isCancelled: () => boolean;
      onActiveStream?: (stream: NativeStreamHandle | null) => void;
    },
  ) => Promise<void>;
  rehydrateSyncResult: (raw: ShieldedSyncResultRaw) => ShieldedSyncResult;
  createSyncTimeEstimator: (totalBlocks: number) => (processedBlocks: number) => SyncEstimatedTime;
};

// ── DI factory (for tests) ──────────────────────────────────────────────

export function createZCashClientWith(deps: ZCashClientDeps, args: ZCashClientArgs): ZCashClient {
  const grpcUrl = args.grpcUrl;
  const network = args.network ?? "mainnet";

  return {
    grpcUrl,
    network,

    getChainTip(): Promise<number> {
      return deps.getChainTipJob(grpcUrl);
    },

    findBlockHeight(timestamp: number): Promise<number> {
      return deps.findBlockHeightJob(grpcUrl, timestamp);
    },

    async estimatedSyncTime(
      totalBlocks: number,
    ): Promise<(processedBlocks: number) => SyncEstimatedTime> {
      return deps.createSyncTimeEstimator(totalBlocks);
    },

    syncShielded(syncArgs: SyncShieldedArgs): Observable<ShieldedSyncResult> {
      return new Observable<ShieldedSyncResult>(subscriber => {
        const validationError = deps.validateStartSyncArgs(syncArgs);
        if (validationError) {
          subscriber.error(validationError);
          return;
        }

        let cancelled = false;
        let activeStream: NativeStreamHandle | null = null;
        const isCancelled = () => cancelled || subscriber.closed;

        const jobArgs: StartSyncJobArgs = {
          grpcUrl,
          network,
          viewingKey: syncArgs.viewingKey,
          startBlockHeight: syncArgs.startBlockHeight,
          maxBatchSize: syncArgs.maxBatchSize,
          ...(syncArgs.knownNullifiers &&
            syncArgs.knownNullifiers.length > 0 && {
              knownNullifiers: syncArgs.knownNullifiers,
            }),
        };

        deps
          .startSyncJob(
            jobArgs,
            chunk => {
              if (isCancelled()) return;
              subscriber.next(deps.rehydrateSyncResult(chunk));
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
            log(ZCASH_LOG_TYPE, "teardown -- cancelling active native stream");
            try {
              activeStream.cancel();
            } catch (err) {
              log(ZCASH_LOG_TYPE, "teardown -- stream.cancel() threw", { err: String(err) });
            }
            activeStream = null;
          }
        };
      });
    },
  };
}

// ── Default deps ────────────────────────────────────────────────────────

const defaultDeps: ZCashClientDeps = {
  getChainTipJob,
  findBlockHeightJob,
  startSyncJob,
  validateStartSyncArgs,
  rehydrateSyncResult,
  createSyncTimeEstimator,
};

// ── Convenience factory (production — deps pre-wired) ───────────────────

export function createZCashClient(args: ZCashClientArgs): ZCashClient {
  return createZCashClientWith(defaultDeps, args);
}

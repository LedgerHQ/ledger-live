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
  BuildTransactionArgs,
  BuildTransactionResult,
  BuildIronwoodTransactionArgs,
  BuildIronwoodTransactionResult,
  FinalizeTransactionArgs,
  FinalizeTransactionResult,
  TransactionDetailsRequest,
  TransactionDetailsResult,
} from "./types";
import type { StartSyncJobArgs } from "./native-engine/engine";
import {
  getChainTipJob,
  findBlockHeightJob,
  startSyncJob,
  validateStartSyncArgs,
  buildTransactionJob,
  buildIronwoodTransactionJob,
  finalizeTransactionJob,
  broadcastTransactionJob,
  transactionDetailsJob,
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
  buildTransactionJob?: (
    args: Omit<BuildTransactionArgs, "requestId">,
  ) => Promise<BuildTransactionResult>;
  buildIronwoodTransactionJob?: (
    args: Omit<BuildIronwoodTransactionArgs, "requestId">,
  ) => Promise<BuildIronwoodTransactionResult>;
  finalizeTransactionJob?: (
    args: Omit<FinalizeTransactionArgs, "requestId">,
  ) => Promise<FinalizeTransactionResult>;
  broadcastTransactionJob?: (grpcUrl: string, txHex: string) => Promise<string>;
  transactionDetailsJob?: (
    grpcUrl: string,
    requests: TransactionDetailsRequest[],
    network: string,
    ufvk?: string,
  ) => Promise<TransactionDetailsResult[]>;
};

// ── DI factory (for tests) ──────────────────────────────────────────────

export function createZCashClientWith(deps: ZCashClientDeps, args: ZCashClientArgs): ZCashClient {
  const grpcUrl = args.grpcUrl;
  const network = args.network ?? "mainnet";

  // Capture optional jobs as consts so their presence narrows inside closures.
  // When a job is absent (e.g. RN stubs) we omit the corresponding client
  // method entirely rather than defining one that throws, so capability checks
  // like `if (!client.buildTransaction)` behave consistently across environments.
  const {
    buildTransactionJob,
    buildIronwoodTransactionJob,
    finalizeTransactionJob,
    broadcastTransactionJob,
    transactionDetailsJob,
  } = deps;

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

    ...(buildTransactionJob && {
      buildTransaction: (
        args: Omit<BuildTransactionArgs, "requestId">,
      ): Promise<BuildTransactionResult> => buildTransactionJob(args),
    }),

    ...(buildIronwoodTransactionJob && {
      buildIronwoodTransaction: (
        args: Omit<BuildIronwoodTransactionArgs, "requestId">,
      ): Promise<BuildIronwoodTransactionResult> => buildIronwoodTransactionJob(args),
    }),

    ...(finalizeTransactionJob && {
      finalizeTransaction: (
        args: Omit<FinalizeTransactionArgs, "requestId">,
      ): Promise<FinalizeTransactionResult> => finalizeTransactionJob(args),
    }),

    ...(broadcastTransactionJob && {
      broadcastTransaction: (grpcUrl: string, txHex: string): Promise<string> =>
        broadcastTransactionJob(grpcUrl, txHex),
    }),

    ...(transactionDetailsJob && {
      transactionDetails: (
        requests: TransactionDetailsRequest[],
        ufvk?: string,
      ): Promise<TransactionDetailsResult[]> =>
        transactionDetailsJob(grpcUrl, requests, network, ufvk),
    }),

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
  buildTransactionJob,
  buildIronwoodTransactionJob,
  finalizeTransactionJob,
  broadcastTransactionJob,
  transactionDetailsJob,
};

// ── Convenience factory (production — deps pre-wired) ───────────────────

export function createZCashClient(args: ZCashClientArgs): ZCashClient {
  return createZCashClientWith(defaultDeps, args);
}

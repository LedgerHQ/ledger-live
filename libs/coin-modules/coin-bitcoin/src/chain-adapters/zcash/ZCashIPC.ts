/* eslint @typescript-eslint/consistent-type-assertions: 0 -- IPC boundary requires casts */
/**
 * Renderer-side Electron IPC client for the ZCash native engine.
 *
 * Exposes the same {@link ZCashClient} surface as
 * {@link ./ZCash.createZCashClient} so callers (e.g. sync.ts) are completely
 * agnostic about whether the engine runs in-process (Node) or in a
 * UtilityProcess bridged via IPC (Electron renderer).
 *
 * Usage:
 *
 *   const client = createZCashIPCClient(deps, { grpcUrl, network });
 *   client.getChainTip()
 *   client.syncShielded(args)
 *
 * Data flow for syncShielded:
 *
 *   renderer                  main (ipc/main-host.ts)             utility (ipc/utility-entry.ts)
 *     |                                |                                  |
 *     |-- invoke startSync ----------->|-- postMessage start-sync ------->|
 *     |                                |<-- postMessage stream chunk -----|
 *     |<-- send zcash:stream chunk ----|                                  |
 *     |                                |                                  |
 *     |-- invoke cancelSync ---------->|-- postMessage cancel-sync ------>|
 *
 * BigNumber amounts are rehydrated client-side from their string form
 * (`ShieldedSyncResultRaw`), since BigNumber instances don't survive
 * `structuredClone`.
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
import {
  ZCASH_IPC,
  type CancelSyncArgs,
  type FindBlockHeightArgs,
  type GetChainTipArgs,
  type RequestId,
  type StartSyncArgs,
  type StreamEvent,
} from "./ipc/contract";
import { rehydrateSyncResult } from "./serialization/rehydrate";
import { createSyncTimeEstimator } from "./sync-estimator";

// ── Dependency & argument types ─────────────────────────────────────────

export type IpcRendererLike = {
  invoke: (channel: string, args: unknown) => Promise<unknown>;
  on: (channel: string, listener: (event: unknown, payload: unknown) => void) => unknown;
  removeListener: (
    channel: string,
    listener: (event: unknown, payload: unknown) => void,
  ) => unknown;
};

export type ZCashIPCClientDeps = {
  ipcRenderer: IpcRendererLike;
  rehydrateSyncResult: (raw: ShieldedSyncResultRaw) => ShieldedSyncResult;
  createSyncTimeEstimator: (totalBlocks: number) => (processedBlocks: number) => SyncEstimatedTime;
};

export type ZCashIPCClientArgs = ZCashClientArgs;

// ── Internal helpers ────────────────────────────────────────────────────

let requestIdCounter = 0;
/**
 * Unique-per-process request id. Kept short & predictable on purpose --
 * `crypto.randomUUID` would force a conditional import for non-browser tests.
 */
function nextRequestId(): RequestId {
  requestIdCounter += 1;
  return `zcash-${Date.now().toString(36)}-${requestIdCounter}`;
}

function validateSyncArgs(args: SyncShieldedArgs): string | null {
  if (args.startBlockHeight < 0) {
    return "error: invalid negative arg startBlockHeight";
  }
  if (args.maxBatchSize <= 0) {
    return "error: invalid negative or zero arg maxBatchSize";
  }
  return null;
}

// ── Factory ─────────────────────────────────────────────────────────────

export function createZCashIPCClient(
  deps: ZCashIPCClientDeps,
  args: ZCashIPCClientArgs,
): ZCashClient {
  const { ipcRenderer } = deps;
  const grpcUrl = args.grpcUrl;
  const network = args.network ?? "mainnet";

  return {
    grpcUrl,
    network,

    async getChainTip(): Promise<number> {
      const payload: GetChainTipArgs = { requestId: nextRequestId(), grpcUrl };
      return (await ipcRenderer.invoke(ZCASH_IPC.getChainTip, payload)) as number;
    },

    async findBlockHeight(timestamp: number): Promise<number> {
      const payload: FindBlockHeightArgs = {
        requestId: nextRequestId(),
        grpcUrl,
        timestamp,
      };
      return (await ipcRenderer.invoke(ZCASH_IPC.findBlockHeight, payload)) as number;
    },

    async estimatedSyncTime(
      totalBlocks: number,
    ): Promise<(processedBlocks: number) => SyncEstimatedTime> {
      return deps.createSyncTimeEstimator(totalBlocks);
    },

    syncShielded(syncArgs: SyncShieldedArgs): Observable<ShieldedSyncResult> {
      return new Observable<ShieldedSyncResult>(subscriber => {
        const requestId = nextRequestId();

        const validationError = validateSyncArgs(syncArgs);
        if (validationError) {
          subscriber.error(new Error(validationError));
          return;
        }

        const listener = (_event: unknown, payload: unknown): void => {
          const evt = payload as StreamEvent;
          if (!evt || evt.requestId !== requestId) return;
          switch (evt.kind) {
            case "chunk":
              subscriber.next(deps.rehydrateSyncResult(evt.result));
              return;
            case "complete":
              subscriber.complete();
              return;
            case "error":
              subscriber.error(new Error(evt.message));
              return;
            default: {
              const exhaustive: never = evt;
              log(ZCASH_LOG_TYPE, "unknown stream event", { evt: exhaustive });
            }
          }
        };
        ipcRenderer.on(ZCASH_IPC.stream, listener);

        const startPayload: StartSyncArgs = {
          requestId,
          grpcUrl,
          network,
          viewingKey: syncArgs.viewingKey,
          startBlockHeight: syncArgs.startBlockHeight,
          maxBatchSize: syncArgs.maxBatchSize,
        };

        ipcRenderer.invoke(ZCASH_IPC.startSync, startPayload).catch(err => {
          subscriber.error(err instanceof Error ? err : new Error(String(err)));
        });

        return () => {
          ipcRenderer.removeListener(ZCASH_IPC.stream, listener);
          const cancelPayload: CancelSyncArgs = { requestId };
          // Fire-and-forget -- a failed cancel only leaks a bit of utility CPU
          // until the current batch ends; don't let it reach the subscriber.
          ipcRenderer.invoke(ZCASH_IPC.cancelSync, cancelPayload).catch(err => {
            log(ZCASH_LOG_TYPE, "cancelSync invoke failed", { err: String(err) });
          });
        };
      });
    },
  };
}

// ── Default deps ────────────────────────────────────────────────────────

let cachedIpcRenderer: IpcRendererLike | null = null;

function getIpcRenderer(): IpcRendererLike {
  if (cachedIpcRenderer) return cachedIpcRenderer;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const electron = require("electron") as { ipcRenderer?: IpcRendererLike };
  if (!electron?.ipcRenderer) {
    throw new Error("ZCashIPC: electron.ipcRenderer not available in this context");
  }
  cachedIpcRenderer = electron.ipcRenderer;
  return cachedIpcRenderer;
}

/**
 * Convenience factory for production — wires the real Electron IPC deps.
 *
 * Drop-in alias: the renderer bundle aliases
 * `@ledgerhq/coin-bitcoin/chain-adapters/zcash/ZCash` to this module
 * (see `rspack.renderer.ts`). Callers destructure `{ createZCashClient }`,
 * so we export the IPC factory under that name to keep the public API stable.
 */
export function createZCashClient(args: ZCashIPCClientArgs): ZCashClient {
  return createZCashIPCClient(
    { ipcRenderer: getIpcRenderer(), rehydrateSyncResult, createSyncTimeEstimator },
    args,
  );
}

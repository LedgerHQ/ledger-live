/**
 * Renderer-side Electron IPC client for the ZCash native engine.
 *
 * Exposes the same public surface as {@link ./ZCashNative.ZCashNative} so
 * callers (e.g. `familyConfig`) are completely agnostic about whether the
 * engine runs in-process (Node) or in a UtilityProcess bridged via IPC
 * (Electron renderer):
 *
 *   new ZCashNativeIPC({ grpcUrl, network })
 *     .getChainTip(): Promise<number>
 *     .estimatedSyncTime(totalBlocks): (processedBlocks) => SyncEstimatedTime
 *     .syncShielded(args): Observable<ShieldedSyncResult>
 *
 * Under the hood, every call is forwarded over Electron IPC to the main
 * process, which relays it to a UtilityProcess that owns the napi-rs Rust
 * engine. This removes the need for `nodeIntegration: true` in the renderer
 * (LIVE-10304).
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
import type { ShieldedSyncResult, SyncEstimatedTime, ZCashNativeClient } from "./types";
import type { SyncShieldedArgs } from "./types";
import {
  ZCASH_IPC,
  type CancelSyncArgs,
  type GetChainTipArgs,
  type RequestId,
  type StartSyncArgs,
  type StreamEvent,
} from "./ipc/contract";
import { rehydrateSyncResult } from "./serialization/rehydrate";
import { createSyncTimeEstimator } from "./sync-estimator";

/**
 * Minimal structural view of `electron.ipcRenderer`, kept narrow on purpose:
 * we only touch the three methods we need and avoid typing against
 * `import("electron")` so that this module stays importable from non-Electron
 * contexts (ex: Jest, which mocks the `electron` module).
 */
type IpcRendererLike = {
  invoke: (channel: string, args: unknown) => Promise<unknown>;
  on: (channel: string, listener: (event: unknown, payload: unknown) => void) => unknown;
  removeListener: (
    channel: string,
    listener: (event: unknown, payload: unknown) => void,
  ) => unknown;
};

let cachedIpcRenderer: IpcRendererLike | null = null;

/**
 * Resolves `electron.ipcRenderer` lazily, so importing this file in a
 * non-Electron test context doesn't crash at module load. Throws only when
 * actually used — not at import time.
 */
function getIpcRenderer(): IpcRendererLike {
  if (cachedIpcRenderer) return cachedIpcRenderer;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const electron = require("electron") as { ipcRenderer?: IpcRendererLike };
  if (!electron?.ipcRenderer) {
    throw new Error("ZCashNativeIPC: electron.ipcRenderer not available in this context");
  }
  cachedIpcRenderer = electron.ipcRenderer;
  return cachedIpcRenderer;
}

let requestIdCounter = 0;
/**
 * Unique-per-process request id. Kept short & predictable on purpose —
 * `crypto.randomUUID` would force a conditional import for non-browser tests.
 */
function nextRequestId(): RequestId {
  requestIdCounter += 1;
  return `zcash-${Date.now().toString(36)}-${requestIdCounter}`;
}

export class ZCashNativeIPC implements ZCashNativeClient {
  readonly grpcUrl: string;
  readonly network: string;

  constructor(args: { grpcUrl: string; network?: string }) {
    this.grpcUrl = args.grpcUrl;
    this.network = args.network ?? "mainnet";
  }

  /**
   * Returns the current chain tip height, via the UtilityProcess.
   */
  async getChainTip(): Promise<number> {
    const ipc = getIpcRenderer();
    const payload: GetChainTipArgs = { requestId: nextRequestId(), grpcUrl: this.grpcUrl };
    return (await ipc.invoke(ZCASH_IPC.getChainTip, payload)) as number;
  }

  /**
   * Wall-clock-based estimator. Kept `async` to preserve the original public
   * contract used by callers; the underlying logic is sync and shared with
   * `ZCashNative` via `createSyncTimeEstimator`.
   */
  async estimatedSyncTime(
    totalBlocks: number,
  ): Promise<(processedBlocks: number) => SyncEstimatedTime> {
    return createSyncTimeEstimator(totalBlocks);
  }

  /**
   * Scans blocks for shielded transactions matching the viewing key, by
   * delegating to the UtilityProcess over IPC.
   *
   * The Observable's teardown posts a `cancelSync` so in-flight gRPC streams
   * inside the utility are torn down promptly — no need to wait for the
   * current batch to finish.
   */
  syncShielded(args: SyncShieldedArgs): Observable<ShieldedSyncResult> {
    return new Observable<ShieldedSyncResult>(subscriber => {
      const ipc = getIpcRenderer();
      const requestId = nextRequestId();

      const validationError = this.validateSyncArgs(args);
      if (validationError) {
        subscriber.error(new Error(validationError));
        return;
      }

      const listener = (_event: unknown, payload: unknown): void => {
        const evt = payload as StreamEvent;
        if (!evt || evt.requestId !== requestId) return;
        switch (evt.kind) {
          case "chunk":
            subscriber.next(rehydrateSyncResult(evt.result));
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
      ipc.on(ZCASH_IPC.stream, listener);

      const startPayload: StartSyncArgs = {
        requestId,
        grpcUrl: this.grpcUrl,
        network: this.network,
        viewingKey: args.viewingKey,
        startBlockHeight: args.startBlockHeight,
        maxBatchSize: args.maxBatchSize,
      };

      ipc.invoke(ZCASH_IPC.startSync, startPayload).catch(err => {
        subscriber.error(err instanceof Error ? err : new Error(String(err)));
      });

      return () => {
        ipc.removeListener(ZCASH_IPC.stream, listener);
        const cancelPayload: CancelSyncArgs = { requestId };
        // Fire-and-forget — a failed cancel only leaks a bit of utility CPU
        // until the current batch ends; don't let it reach the subscriber.
        ipc.invoke(ZCASH_IPC.cancelSync, cancelPayload).catch(err => {
          log(ZCASH_LOG_TYPE, "cancelSync invoke failed", { err: String(err) });
        });
      };
    });
  }

  private validateSyncArgs(args: SyncShieldedArgs): string | null {
    if (args.startBlockHeight < 0) {
      return "error: invalid negative arg startBlockHeight";
    }
    if (args.maxBatchSize <= 0) {
      return "error: invalid negative or zero arg maxBatchSize";
    }
    return null;
  }
}

// Drop-in alias: the renderer bundle aliases `@ledgerhq/zcash-shielded/ZCashNative`
// to this module (see `rspack.renderer.ts`). Callers destructure `{ ZCashNative }`,
// so we re-export the IPC client under that name to keep the public API stable.
export { ZCashNativeIPC as ZCashNative };

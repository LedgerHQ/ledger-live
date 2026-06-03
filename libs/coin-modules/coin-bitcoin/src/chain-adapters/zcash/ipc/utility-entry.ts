/**
 * Entry point of the ZCash UtilityProcess (spawned by Electron main via
 * `utilityProcess.fork`).
 *
 * Owns the napi-rs `.node` addon and the tonic gRPC runtime. The main process
 * drives it via `parentPort.postMessage` using the {@link UtilityInboundMessage}
 * shapes; results flow back the same way as {@link UtilityOutboundMessage}.
 *
 * This file stays tiny on purpose -- the real logic lives in `engine.ts` so the
 * same code can be unit-tested without Electron, and later moved to any other
 * host (another UtilityProcess, a worker_thread, etc.) without touching the
 * wire format.
 */

import { log } from "@ledgerhq/logs";
import { ZCASH_LOG_TYPE } from "../constants";
import { findBlockHeightJob, getChainTipJob, startSyncJob } from "../native-engine/engine";
import type {
  CancelSyncArgs,
  FindBlockHeightArgs,
  GetChainTipArgs,
  StartSyncArgs,
  UtilityInboundMessage,
  UtilityOutboundMessage,
} from "./contract";

/**
 * Minimal parentPort surface -- we don't depend on Electron types here so this
 * file can be compiled by any Node-targeting TypeScript config.
 */
type ParentPort = {
  on(event: "message", handler: (e: { data: UtilityInboundMessage }) => void): void;
  postMessage(message: UtilityOutboundMessage): void;
};

/** Per-request cancel state. Flipped by `cancel-sync`, checked by the engine. */
type ActiveJob = {
  cancelled: boolean;
  /** Native stream handle set by the engine; used for immediate cancel. */
  activeStream: { cancel(): void } | null;
};

const activeJobs = new Map<string, ActiveJob>();

function send(port: ParentPort, message: UtilityOutboundMessage): void {
  port.postMessage(message);
}

async function handleGetChainTip(port: ParentPort, args: GetChainTipArgs): Promise<void> {
  try {
    const height = await getChainTipJob(args.grpcUrl);
    send(port, { type: "chain-tip", requestId: args.requestId, height });
  } catch (err) {
    send(port, {
      type: "chain-tip-error",
      requestId: args.requestId,
      message: err instanceof Error ? err.message : String(err),
    });
  }
}

async function handleFindBlockHeight(port: ParentPort, args: FindBlockHeightArgs): Promise<void> {
  try {
    const height = await findBlockHeightJob(args.grpcUrl, args.timestamp);
    send(port, { type: "block-height", requestId: args.requestId, height });
  } catch (err) {
    send(port, {
      type: "block-height-error",
      requestId: args.requestId,
      message: err instanceof Error ? err.message : String(err),
    });
  }
}

async function handleStartSync(port: ParentPort, args: StartSyncArgs): Promise<void> {
  const { requestId } = args;
  const job: ActiveJob = { cancelled: false, activeStream: null };
  activeJobs.set(requestId, job);

  try {
    await startSyncJob(
      {
        grpcUrl: args.grpcUrl,
        network: args.network,
        viewingKey: args.viewingKey,
        startBlockHeight: args.startBlockHeight,
        maxBatchSize: args.maxBatchSize,
        ...(args.knownNullifiers?.length && { knownNullifiers: args.knownNullifiers }),
      },
      chunk => {
        send(port, {
          type: "stream",
          event: { requestId, kind: "chunk", result: chunk },
        });
      },
      {
        isCancelled: () => job.cancelled,
        onActiveStream: stream => {
          job.activeStream = stream;
        },
      },
    );
    send(port, { type: "stream", event: { requestId, kind: "complete" } });
  } catch (err) {
    send(port, {
      type: "stream",
      event: {
        requestId,
        kind: "error",
        message: err instanceof Error ? err.message : String(err),
      },
    });
  } finally {
    activeJobs.delete(requestId);
  }
}

function handleCancelSync(args: CancelSyncArgs): void {
  const job = activeJobs.get(args.requestId);
  if (!job) {
    log(ZCASH_LOG_TYPE, "cancel for unknown requestId", { requestId: args.requestId });
    return;
  }
  job.cancelled = true;
  if (job.activeStream) {
    try {
      job.activeStream.cancel();
    } catch (err) {
      log(ZCASH_LOG_TYPE, "utility: native stream.cancel() threw", { err: String(err) });
    }
  }
}

/**
 * Wires up a {@link ParentPort} to the ZCash engine. Exported for testing --
 * production code calls this once below with Electron's `process.parentPort`.
 */
export function bootstrapUtility(port: ParentPort): void {
  port.on("message", event => {
    const message = event.data;
    switch (message.type) {
      case "get-chain-tip":
        void handleGetChainTip(port, message.args);
        break;
      case "find-block-height":
        void handleFindBlockHeight(port, message.args);
        break;
      case "start-sync":
        void handleStartSync(port, message.args);
        break;
      case "cancel-sync":
        handleCancelSync(message.args);
        break;
      default: {
        const exhaustive: never = message;
        log(ZCASH_LOG_TYPE, "utility: unknown message", { message: exhaustive });
      }
    }
  });
}

// `process.parentPort` is only set when the file is run as an Electron
// UtilityProcess. Guarded so the module can also be imported in unit tests.
const parentPort = (process as unknown as { parentPort?: ParentPort }).parentPort;
if (parentPort) {
  bootstrapUtility(parentPort);
  log(ZCASH_LOG_TYPE, "utility: bootstrapped");
}

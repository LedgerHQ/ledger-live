/**
 * ZCash native Rust engine (host-side).
 *
 * Pure functions that wrap `@ledgerhq/zcash-utils` -- the napi-rs `.node` addon.
 * No RxJS, no Electron, no BigNumber: everything emitted here is IPC-safe
 * (serializable via `structuredClone`). The renderer client rehydrates the
 * `ShieldedTransactionRaw` into `ShieldedTransaction` with real `BigNumber`.
 *
 * Runs in a host that has access to Node's `require()` (Electron main,
 * a UtilityProcess, or a plain Node test runner).
 */

import { log } from "@ledgerhq/logs";
import { ZCASH_LOG_TYPE } from "../constants";
import type {
  ShieldedSyncResultRaw,
  ShieldedTransactionRaw,
  BuildTransactionArgs,
  BuildTransactionResult,
  FinalizeTransactionArgs,
  FinalizeTransactionResult,
} from "./types";
import type { PcztTransaction } from "@ledgerhq/live-signer-zcash";

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
 * The `parsePczt()` output shape as declared by `@ledgerhq/zcash-utils`. Its
 * zatoshi value fields are decimal `string`s and its optional fields use
 * `undefined`; `adaptPcztForSigner` normalises these to the `bigint` / `null`
 * shape the device signer's `PcztTransaction` expects.
 */
type NativePcztTransaction = ReturnType<NativeModule["parsePczt"]>;

/** PCZT methods that must be present on the native addon at runtime. */
const PCZT_METHODS = [
  "parsePczt",
  "buildTransaction",
  "finalizeTransaction",
  "broadcastTransaction",
] as const;

/**
 * Loads the native addon and asserts it exposes the PCZT methods. Their types
 * ship with `@ledgerhq/zcash-utils`, but this runtime guard still catches a
 * version/build mismatch where the loaded binary lacks a method -- otherwise it
 * would surface as an opaque "x is not a function" deep inside a job; here it
 * fails fast with an actionable message listing what's missing.
 */
async function getPcztModule(): Promise<NativeModule> {
  const native = await getNativeModule();
  const missing = PCZT_METHODS.filter(
    method => typeof (native as Record<string, unknown>)[method] !== "function",
  );
  if (missing.length > 0) {
    throw new Error(
      `@ledgerhq/zcash-utils is missing PCZT method(s): ${missing.join(", ")}. ` +
        `The loaded native addon (keys: ${Object.keys(native).join(", ")}) is incompatible; ` +
        `check that the shipped binary matches the expected zcash-utils version.`,
    );
  }
  return native;
}

export type StartSyncJobArgs = {
  grpcUrl: string;
  network: string;
  viewingKey: string;
  startBlockHeight: number;
  maxBatchSize: number;
  /** Hex-encoded nullifiers of unspent notes from previous syncs. Enables spent detection across incremental sync boundaries. */
  knownNullifiers?: string[];
};

/**
 * Validation for {@link startSyncJob} arguments.
 *
 * Returns an error message string on failure, or `null` when the args are
 * valid. Extracted from the old `ZCash.validateSyncArgs` so callers can
 * fail fast before any native module load.
 */
export function validateStartSyncArgs(args: {
  startBlockHeight: number;
  maxBatchSize: number;
}): string | null {
  if (args.startBlockHeight < 0) return "error: invalid negative arg startBlockHeight";
  if (args.maxBatchSize <= 0) return "error: invalid negative or zero arg maxBatchSize";
  return null;
}

/**
 * Returns the current chain tip height using the native gRPC client.
 */
export async function getChainTipJob(grpcUrl: string): Promise<number> {
  const native = await getNativeModule();
  return native.getChainTip(grpcUrl);
}

/**
 * Returns the block height corresponding to the given Unix timestamp
 * using the native gRPC client (interpolation search + streaming range).
 *
 * @param timestamp - Unix timestamp in **seconds** (not milliseconds).
 *   Use `Math.floor(Date.getTime() / 1000)` to convert from a JS `Date`.
 */
export async function findBlockHeightJob(grpcUrl: string, timestamp: number): Promise<number> {
  const native = await getNativeModule();
  return native.findBlockHeight(grpcUrl, timestamp);
}

/**
 * Converts zcash-utils parsePczt() output to the PcztTransaction shape the
 * device signer consumes. Two mismatches are resolved here:
 *
 *   (a) Nullability: zcash-utils uses `undefined` for 3 optional fields;
 *       device-signer-kit-zcash uses `null`.
 *   (b) Value types: all zatoshi value fields are converted via BigInt() so the
 *       adapter remains safe if an upstream change switches the wire format.
 *
 * Running inside buildTransactionJob ensures this stays in the UtilityProcess
 * where the native addon is loaded -- parsePczt is a synchronous NAPI call.
 */
function adaptPcztForSigner(raw: NativePcztTransaction): PcztTransaction {
  return {
    global: {
      ...raw.global,
      fallbackLockTime: raw.global.fallbackLockTime ?? null,
    },
    transparentInputs: raw.transparentInputs.map(input => ({
      ...input,
      value: BigInt(input.value), // normalise: string (legacy) or bigint
      sequence: input.sequence ?? null,
    })),
    transparentOutputs: raw.transparentOutputs.map(output => ({
      ...output,
      value: BigInt(output.value),
      derivation: output.derivation ?? null,
    })),
    orchardBundle: raw.orchardBundle
      ? {
          ...raw.orchardBundle,
          valueBalance: BigInt(raw.orchardBundle.valueBalance),
          actions: raw.orchardBundle.actions.map(action => ({
            ...action,
            spendValue: BigInt(action.spendValue),
            value: BigInt(action.value),
          })),
        }
      : null,
  };
}

/**
 * Builds a PCZT for a Zcash send, then immediately parses it back into the
 * structured `PcztTransaction` the device signer expects. Both NAPI calls run
 * here in the UtilityProcess so the result can be sent to the renderer in a
 * single IPC reply.
 */
export async function buildTransactionJob(
  args: Omit<BuildTransactionArgs, "requestId">,
): Promise<BuildTransactionResult> {
  const native = await getPcztModule();
  const built = await native.buildTransaction(args);
  const rawPczt = native.parsePczt(built.pcztHex);
  return {
    pcztHex: built.pcztHex,
    pcztTransaction: adaptPcztForSigner(rawPczt),
    feeZat: built.feeZat,
    anchorHeight: built.anchorHeight,
    nActionsOrchard: built.nActionsOrchard,
    nTransparentInputs: built.nTransparentInputs,
    nTransparentOutputs: built.nTransparentOutputs,
  };
}

/**
 * Injects device signatures into the PCZT and extracts the final signed V5
 * transaction. CPU-bound; dispatched to spawn_blocking in the Rust layer.
 */
export async function finalizeTransactionJob(
  args: Omit<FinalizeTransactionArgs, "requestId">,
): Promise<FinalizeTransactionResult> {
  const native = await getPcztModule();
  return native.finalizeTransaction(args);
}

/**
 * Broadcasts a signed V5 transaction to the Zaino gRPC endpoint.
 * Returns the txid (64-char hex, big-endian display order).
 */
export async function broadcastTransactionJob(grpcUrl: string, txHex: string): Promise<string> {
  const native = await getPcztModule();
  return native.broadcastTransaction(grpcUrl, txHex);
}

/**
 * Runs the shielded sync loop.
 *
 * Drives the native tonic gRPC stream in `maxBatchSize`-block chunks, emitting
 * a `ShieldedSyncResultRaw` after every chunk via `onChunk`. Returns once the
 * tip is reached, or once `isCancelled()` starts returning `true` (caller is
 * expected to also call the returned abort hook to cancel an in-flight stream
 * without waiting for `stream.next()` to resolve).
 *
 * Mirrors the semantics of the old `ZCash.syncShielded` Observable
 * contract -- the only difference is that transactions are emitted as
 * `ShieldedTransactionRaw` (fee/amount as string) instead of `BigNumber`.
 */
export async function startSyncJob(
  args: StartSyncJobArgs,
  onChunk: (chunk: ShieldedSyncResultRaw) => void,
  hooks: {
    isCancelled: () => boolean;
    /**
     * Called once with the native stream handle for the current chunk.
     * Lets the host cancel the in-flight stream immediately (without waiting
     * for `stream.next()` to resolve) when a teardown signal arrives.
     */
    onActiveStream?: (stream: NativeStream | null) => void;
  },
): Promise<void> {
  const { grpcUrl, network, viewingKey, startBlockHeight, maxBatchSize, knownNullifiers } = args;
  const { isCancelled, onActiveStream } = hooks;

  const native = await getNativeModule();
  if (isCancelled()) return;
  const endHeight = await native.getChainTip(grpcUrl);

  log(ZCASH_LOG_TYPE, "syncShielded start", {
    grpcUrl,
    network,
    startBlockHeight,
    endHeight,
    totalBlocks: endHeight - startBlockHeight + 1,
    maxBatchSize,
  });

  if (startBlockHeight > endHeight) {
    log(ZCASH_LOG_TYPE, "already at tip, nothing to scan");
    onChunk({ processedBlocks: 0, remainingBlocks: 0, transactions: [] });
    return;
  }

  const allTransactions: ShieldedTransactionRaw[] = [];
  const allSpentKnownNullifiers: string[] = [];
  // Accumulate nullifiers across chunks so that a note received in chunk N
  // can be detected as spent in chunk N+1. Start with the caller-provided
  // nullifiers (from previous sync cycles) and grow as new notes are found.
  const accumulatedNullifiers: Set<string> = new Set(knownNullifiers ?? []);
  let processedBlocks = 0;
  let chunkStart = startBlockHeight;

  while (chunkStart <= endHeight) {
    if (isCancelled()) {
      log(ZCASH_LOG_TYPE, "cancelled -- stopping before chunk", { chunkStart });
      break;
    }

    const chunkEnd = Math.min(chunkStart + maxBatchSize - 1, endHeight);
    const { blocksScanned, transactions, spentKnownNullifiers } = await syncChunk(
      native,
      {
        grpcUrl,
        network,
        viewingKey,
        chunkStart,
        chunkEnd,
        ...(accumulatedNullifiers.size > 0 && { knownNullifiers: [...accumulatedNullifiers] }),
      },
      isCancelled,
      onActiveStream,
    );

    if (isCancelled()) {
      log(ZCASH_LOG_TYPE, "cancelled -- stopping after chunk", { chunkStart });
      break;
    }

    processedBlocks += blocksScanned;
    for (const tx of transactions) {
      allTransactions.push(mapNativeTx(tx));
      // Collect nullifiers from incoming/internal Orchard notes discovered
      // in this chunk so the next chunk can detect them as spent.
      for (const note of tx.orchardNotes ?? []) {
        if (note.nullifier && note.transferType !== "outgoing") {
          accumulatedNullifiers.add(note.nullifier);
        }
      }
    }
    allSpentKnownNullifiers.push(...spentKnownNullifiers);

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
          orchardNotesCount: tx.orchardNotes?.length ?? 0,
          saplingNotesCount: tx.saplingNotes?.length ?? 0,
        })),
      );
    }

    onChunk({
      processedBlocks,
      remainingBlocks: endHeight - chunkEnd,
      lastProcessedBlock: chunkEnd,
      transactions: [...allTransactions],
      ...(allSpentKnownNullifiers.length > 0 && {
        spentKnownNullifiers: [...allSpentKnownNullifiers],
      }),
    });

    chunkStart = chunkEnd + 1;
  }

  log(ZCASH_LOG_TYPE, "syncShielded complete", {
    totalBlocksScanned: processedBlocks,
    totalTransactions: allTransactions.length,
  });
}

async function syncChunk(
  native: NativeModule,
  args: {
    grpcUrl: string;
    network: string;
    viewingKey: string;
    chunkStart: number;
    chunkEnd: number;
    knownNullifiers?: string[];
  },
  isCancelled: () => boolean,
  onActiveStream?: (stream: NativeStream | null) => void,
): Promise<{ blocksScanned: number; transactions: NativeTx[]; spentKnownNullifiers: string[] }> {
  const { grpcUrl, network, viewingKey, chunkStart, chunkEnd, knownNullifiers } = args;

  // Retry and split-on-timeout are handled by the Rust layer via maxRetries.
  const stream = await native.startSync({
    grpcUrl,
    viewingKey,
    startHeight: chunkStart,
    endHeight: chunkEnd,
    network,
    orchardOnly: true, // Ledger only supports Orchard
    maxRetries: 3, // network retry delegated to Rust
    ...(knownNullifiers && knownNullifiers.length > 0 && { knownNullifiers }),
  });
  onActiveStream?.(stream);

  try {
    if (isCancelled()) {
      log(ZCASH_LOG_TYPE, "cancelled before first read -- calling stream.cancel()");
      stream.cancel();
      return { blocksScanned: 0, transactions: [], spentKnownNullifiers: [] };
    }

    const transactions: NativeTx[] = [];
    let tx: NativeTx | null;
    while ((tx = await stream.next()) !== null) {
      if (isCancelled()) {
        log(ZCASH_LOG_TYPE, "cancelled mid-stream -- calling stream.cancel()");
        stream.cancel();
        return { blocksScanned: 0, transactions: [], spentKnownNullifiers: [] };
      }
      transactions.push(tx);
    }

    if (isCancelled()) {
      log(ZCASH_LOG_TYPE, "cancelled after stream exhausted -- calling stream.cancel()");
      stream.cancel();
      return { blocksScanned: 0, transactions: [], spentKnownNullifiers: [] };
    }

    const stats = await stream.stats();
    log(ZCASH_LOG_TYPE, "chunk stats", {
      chunkStart,
      chunkEnd,
      blocksScanned: stats.blocksScanned,
      elapsedMs: stats.elapsedMs,
      spentKnownNullifiers: stats.spentKnownNullifiers?.length ?? 0,
    });

    return {
      blocksScanned: stats.blocksScanned,
      transactions,
      spentKnownNullifiers: stats.spentKnownNullifiers ?? [],
    };
  } finally {
    onActiveStream?.(null);
  }
}

/**
 * Converts a native (Rust-side) transaction to the IPC-safe `ShieldedTransactionRaw`.
 *
 * `BigNumber` reconstruction happens client-side, after the value has crossed IPC --
 * `structuredClone` would strip the prototype otherwise.
 */
function mapNativeTx(tx: NativeTx): ShieldedTransactionRaw {
  return {
    id: tx.txid,
    hex: tx.hex,
    blockHeight: tx.blockHeight,
    blockHash: tx.blockHash,
    timestamp: tx.blockTime,
    fee: String(tx.fee),
    decryptedData: {
      orchard_outputs: tx.orchardNotes.map(n => ({
        amount: String(n.amount),
        memo: n.memo,
        transfer_type: n.transferType,
        ...(n.nullifier !== undefined && { nullifier: n.nullifier }),
        ...(n.rho !== undefined && { rho: n.rho }),
        ...(n.rseed !== undefined && { rseed: n.rseed }),
        ...(n.cmx !== undefined && { cmx: n.cmx }),
        ...(n.position !== undefined && { position: n.position }),
        ...(n.recipient !== undefined && { recipient: n.recipient }),
        ...(n.isSpent !== undefined && { is_spent: n.isSpent }),
      })),
      sapling_outputs: tx.saplingNotes.map(n => ({
        amount: String(n.amount),
        memo: n.memo,
        transfer_type: n.transferType,
      })),
    },
  };
}

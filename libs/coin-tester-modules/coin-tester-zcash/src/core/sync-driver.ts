import { Observable, takeWhile } from "rxjs";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { makeGetAccountShape } from "@ledgerhq/coin-bitcoin/synchronisation";
import { setCoinConfig } from "@ledgerhq/coin-bitcoin/config";
import {
  setZainoNodeUrl,
  setZainoGrpcUrl,
  setUseNative,
} from "@ledgerhq/coin-bitcoin/familyConfig";
import { setEnv } from "@ledgerhq/live-env";
import type { SignerContext } from "@ledgerhq/coin-bitcoin/signer";
import type { ZcashAccount } from "@ledgerhq/coin-bitcoin/types";
import type { SyncConfig } from "@ledgerhq/types-live";
import { SYNC_TYPE_TRANSPARENT, SYNC_TYPE_SHIELDED } from "@ledgerhq/types-live";
import { MetricsCollector, type SyncMetrics } from "./metrics-collector";
import { logger } from "../utils/logger";

export interface SyncDriverConfig {
  /** Initial account state — from snapshot for replay, from factory for fresh sync */
  initialAccount: ZcashAccount;
  /** Zaino JSON-RPC URL — injected into familyConfig before sync */
  zainoUrl?: string;
  /**
   * Zaino gRPC URL — when set, uses the native Rust engine (napi-rs + tonic).
   * Takes priority over zainoUrl. Only supported in Node.js/Electron.
   */
  zainoGrpcUrl?: string;
  /** Blockbook base URL — injected as EXPLORER env before sync */
  blockbookUrl?: string;
  /** Stop after this block height (inclusive) */
  toHeight?: number;
  /** Called each time the Observable emits — used for checkpoint capture */
  onUpdate?: (shape: Partial<ZcashAccount>) => Promise<void>;
  syncType?: number;
}

export interface SyncDriverResult {
  finalShape: Partial<ZcashAccount>;
  metrics: SyncMetrics;
}

/**
 * Stub SignerContext for the test harness.
 *
 * makeGetAccountShape() requires a SignerContext but only calls it when
 * generateXpubIfNeeded() cannot extract the xpub from initialAccount.id.
 * Since our AccountFactory always encodes the xpub in the account id,
 * the signer is never actually invoked during sync.
 */
const stubSignerContext: SignerContext = (_deviceId, _currency, _fn) => {
  throw new Error(
    "SignerContext was unexpectedly called. " +
      "Ensure initialAccount.id encodes the xpub so generateXpubIfNeeded() " +
      "does not need to call the signer.",
  );
};

/**
 * Configure coin-bitcoin module with minimal Zcash config.
 * Must be called before makeGetAccountShape().
 */
function ensureCoinConfig(): void {
  setCoinConfig(() => ({
    info: {
      status: { type: "active" },
    },
  }));
}

/**
 * Drives makeGetAccountShape() for a Zcash account.
 * Emits progress updates via onUpdate callback.
 * Resolves when the Observable completes or toHeight is reached.
 */
export async function runZcashSync(config: SyncDriverConfig): Promise<SyncDriverResult> {
  ensureCoinConfig();

  if (config.zainoGrpcUrl) {
    setZainoGrpcUrl(config.zainoGrpcUrl);
    setUseNative(true);
    logger.debug(
      {
        zainoGrpcUrl: config.zainoGrpcUrl,
      },
      "Zaino gRPC URL set — native engine enabled",
    );
    if (config.zainoUrl) {
      logger.warn("Both zainoGrpcUrl and zainoUrl provided — native engine takes priority");
    }
  } else {
    setUseNative(false);
    if (config.zainoUrl) {
      setZainoNodeUrl(config.zainoUrl);
      logger.debug({ zainoUrl: config.zainoUrl }, "Zaino JSON-RPC URL overridden");
    }
  }
  if (config.blockbookUrl) {
    setEnv("EXPLORER", config.blockbookUrl);
    logger.debug({ blockbookUrl: config.blockbookUrl }, "Blockbook URL overridden");
  }

  const currency = getCryptoCurrencyById("zcash");
  const syncConfig: SyncConfig = {
    paginationConfig: { operationsPerAccountId: {}, operations: 0 },
    syncType: config.syncType ?? SYNC_TYPE_TRANSPARENT | SYNC_TYPE_SHIELDED,
  };

  const info = {
    currency,
    address: config.initialAccount.freshAddress,
    index: config.initialAccount.index,
    derivationPath: config.initialAccount.freshAddressPath ?? "44'/133'/0'/0/0",
    derivationMode: config.initialAccount.derivationMode ?? "",
    initialAccount: config.initialAccount,
    deviceId: undefined,
  };

  const getAccountShape = makeGetAccountShape(stubSignerContext);
  const obs = getAccountShape(info, syncConfig) as Observable<Partial<ZcashAccount>>;

  const collector = new MetricsCollector();
  collector.start();

  // Seed finalShape with identity fields that the Observable never emits.
  // These are static for the lifetime of the account (id encodes the xpub,
  // freshAddress/Path are set at creation, etc.) and must survive into snapshots
  // so that replay can call decodeAccountId(initialAccount.id) without failing.
  // Also seed operationsCount from the initial account so stable-window replays
  // (where no new transactions are found) preserve the correct count.
  let finalShape: Partial<ZcashAccount> = {
    id: config.initialAccount.id,
    seedIdentifier: config.initialAccount.seedIdentifier,
    freshAddress: config.initialAccount.freshAddress,
    freshAddressPath: config.initialAccount.freshAddressPath,
    derivationMode: config.initialAccount.derivationMode,
    index: config.initialAccount.index,
    operationsCount: config.initialAccount.operationsCount,
  };
  let prevBlockHeight = config.initialAccount.blockHeight ?? 0;

  // When syncType=all, each source emits its own operations array (transparent or
  // shielded-converted operations). A naive spread would let the last emission win,
  // discarding the other source's operations. Track the latest operations from each
  // source separately and merge them on every emission.
  let transparentOps: ZcashAccount["operations"] = [];
  let shieldedOps: ZcashAccount["operations"] = [];

  // Stop the stream when toHeight is reached. takeWhile handles synchronous
  // observables correctly (no TDZ issue with manual subscription.unsubscribe()).
  // inclusive:true ensures the emission at toHeight is included in finalShape.
  //
  // When syncType=all, transparent and shielded observables are merged. The
  // transparent sync emits blockHeight = mainnet tip (~3.3M) almost immediately,
  // which would prematurely kill the merged observable before the shielded sync
  // (testnet, incrementing gradually) has a chance to run. Guard: only apply the
  // toHeight termination on shielded-origin emissions (identified by privateInfo).
  const boundedObs =
    config.toHeight !== undefined
      ? obs.pipe(
          takeWhile(shape => {
            if (shape.privateInfo !== undefined) {
              return (shape.blockHeight ?? 0) < config.toHeight!;
            }
            return true; // transparent updates: never terminate early
          }, true),
        )
      : obs;

  // Chain onUpdate promises so complete/error wait for the last callback to finish.
  // RxJS does not await async next() handlers, so without this the manifest would
  // be written before snapshot files are flushed to disk.
  let updateChain: Promise<void> = Promise.resolve();

  await new Promise<void>((resolve, reject) => {
    let completed = false;
    boundedObs.subscribe({
      next: (shape: Partial<ZcashAccount>) => {
        // Keep per-source operation lists so both transparent and shielded ops
        // survive when syncType=all (a naive spread would let the last emission win).
        if (shape.privateInfo !== undefined) {
          if (shape.operations !== undefined) shieldedOps = shape.operations;
        } else if (shape.operations !== undefined) {
          transparentOps = shape.operations;
        }

        // Merge all fields, then overwrite operations with the combined list.
        // Each source's operations are deduplicated by id via a simple union; the
        // ordering respects each source's internal ordering (transparent first).
        const allOps = [
          ...transparentOps,
          ...shieldedOps.filter(s => !transparentOps.some(t => t.id === s.id)),
        ];

        // Prefer the operationsCount emitted by the sync source (which may include a
        // missingOpsCount offset for snapshots where the operations array is truncated).
        // Fall back to allOps.length, then the previously accumulated count.
        const newOpsCount =
          allOps.length > 0
            ? Math.max(allOps.length, shape.operationsCount ?? 0)
            : shape.operationsCount ?? finalShape.operationsCount ?? 0;

        finalShape = {
          ...finalShape,
          ...shape,
          operations: allOps,
          operationsCount: newOpsCount,
        };

        // Track blocks processed per-source to avoid skewed metrics when transparent
        // emits a far-future mainnet height before shielded has started.
        const emissionHeight = shape.blockHeight ?? 0;
        if (emissionHeight > prevBlockHeight) {
          collector.recordBlocks(emissionHeight - prevBlockHeight);
          prevBlockHeight = emissionHeight;
        }

        const shieldedTxCount = shape.privateInfo?.transactions?.length ?? 0;
        if (shieldedTxCount > 0) {
          collector.recordShieldedTx(shieldedTxCount);
        }

        logger.debug(
          { blockHeight: emissionHeight, operationsCount: finalShape.operationsCount },
          "sync update",
        );

        if (config.onUpdate) {
          const snapshot = finalShape; // capture by value before next emission mutates finalShape
          updateChain = updateChain.then(() =>
            config.onUpdate!(snapshot).catch(err => logger.error(err, "onUpdate error")),
          );
        }
      },
      complete: () => {
        updateChain.then(() => {
          if (!completed) {
            completed = true;
            resolve();
          }
        });
      },
      error: (err: unknown) => {
        updateChain.then(() => {
          if (!completed) {
            completed = true;
            reject(err);
          }
        });
      },
    });
  });

  const metrics = collector.stop();
  logger.info(
    {
      totalSyncTimeMs: metrics.totalSyncTimeMs,
      blocksProcessed: metrics.blocksProcessed,
      shieldedTxFound: metrics.shieldedTxFound,
    },
    "sync complete",
  );

  return { finalShape, metrics };
}

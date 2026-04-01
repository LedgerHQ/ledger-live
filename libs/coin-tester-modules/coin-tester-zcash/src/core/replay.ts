import { readSnapshot, snapshotToAccount } from "./snapshot";
import { runZcashSync } from "./sync-driver";
import { runAssertions, allPassed } from "./assertions";
import type { AssertionOptions, AssertionResult } from "./assertions";
import type { SyncMetrics } from "./metrics-collector";
import type { ZcashAccount } from "@ledgerhq/coin-bitcoin/types";
import { SYNC_TYPE_TRANSPARENT, SYNC_TYPE_SHIELDED } from "@ledgerhq/types-live";
import { logger } from "../utils/logger";

const SYNC_TYPE_ALL = SYNC_TYPE_TRANSPARENT | SYNC_TYPE_SHIELDED;

export interface ReplayConfig {
  snapshotPath: string;
  /** Absolute block height or delta string like "+50000" */
  syncTo: number | string;
  zainoUrl?: string;
  zainoGrpcUrl?: string;
  blockbookUrl?: string;
  syncType: "transparent" | "shielded" | "all";
  assertions?: AssertionOptions;
  /** Timeout in ms before the sync is aborted (default 120 000) */
  timeoutMs?: number;
  /** Called on every sync update */
  onProgress?: (height: number, toHeight: number) => void;
}

export interface ReplayResult {
  finalShape: Partial<ZcashAccount>;
  metrics: SyncMetrics;
  assertionResults: AssertionResult[];
  allPassed: boolean;
}

export async function runReplay(config: ReplayConfig): Promise<ReplayResult> {
  const snapshot = await readSnapshot(config.snapshotPath);
  const account = snapshotToAccount(snapshot);
  const snapshotHeight = snapshot.metadata.snapshotHeight;

  const toHeight =
    typeof config.syncTo === "string" && config.syncTo.startsWith("+")
      ? snapshotHeight + parseInt(config.syncTo.slice(1), 10)
      : typeof config.syncTo === "string"
        ? parseInt(config.syncTo, 10)
        : config.syncTo;

  logger.info(
    { from: snapshotHeight, to: toHeight, label: snapshot.metadata.accountLabel },
    "Starting replay",
  );

  const timeoutMs = config.timeoutMs ?? 120_000;
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Replay timed out after ${timeoutMs}ms`)), timeoutMs),
  );

  const syncTypeMap = {
    transparent: SYNC_TYPE_TRANSPARENT,
    shielded: SYNC_TYPE_SHIELDED,
    all: SYNC_TYPE_ALL,
  };

  const syncPromise = runZcashSync({
    initialAccount: account,
    zainoUrl: config.zainoUrl,
    zainoGrpcUrl: config.zainoGrpcUrl,
    blockbookUrl: config.blockbookUrl,
    toHeight,
    syncType: syncTypeMap[config.syncType],
    onUpdate: async shape => {
      config.onProgress?.(shape.blockHeight ?? 0, toHeight);
    },
  });

  const { finalShape, metrics } = await Promise.race([syncPromise, timeoutPromise]);

  const assertionResults = runAssertions(finalShape, config.assertions ?? {});

  return {
    finalShape,
    metrics,
    assertionResults,
    allPassed: allPassed(assertionResults),
  };
}

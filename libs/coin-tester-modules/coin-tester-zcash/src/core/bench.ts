import { readSnapshot, snapshotToAccount } from "./snapshot";
import { runZcashSync } from "./sync-driver";
import type { SyncMetrics } from "./metrics-collector";
import { SYNC_TYPE_TRANSPARENT, SYNC_TYPE_SHIELDED } from "@ledgerhq/types-live";
import { logger } from "../utils/logger";

const SYNC_TYPE_ALL = SYNC_TYPE_TRANSPARENT | SYNC_TYPE_SHIELDED;

export interface BenchConfig {
  snapshotPath: string;
  /** Number of blocks to sync per iteration, starting from snapshotHeight */
  syncBlocks: number;
  iterations: number;
  /** Number of accounts to sync in parallel per iteration (capped at 3) */
  parallelAccounts?: number;
  zainoUrl?: string;
  zainoGrpcUrl?: string;
  blockbookUrl?: string;
  syncType: "transparent" | "shielded" | "all";
}

export interface BenchResult {
  timingMs: { avg: number; p50: number; p95: number; p99: number; min: number; max: number };
  avgBlocksPerSecond: number;
  runs: number;
  rawMetrics: SyncMetrics[];
}

export async function runBench(config: BenchConfig): Promise<BenchResult> {
  const snapshot = await readSnapshot(config.snapshotPath);
  const parallelAccounts = Math.min(config.parallelAccounts ?? 1, 3);
  const toHeight = snapshot.metadata.snapshotHeight + config.syncBlocks;

  logger.info(
    {
      snapshotHeight: snapshot.metadata.snapshotHeight,
      toHeight,
      iterations: config.iterations,
      parallelAccounts,
    },
    "Starting bench",
  );

  const allMetrics: SyncMetrics[] = [];

  const syncTypeMap = {
    transparent: SYNC_TYPE_TRANSPARENT,
    shielded: SYNC_TYPE_SHIELDED,
    all: SYNC_TYPE_ALL,
  };

  for (let i = 0; i < config.iterations; i++) {
    const runs = Array.from({ length: parallelAccounts }, () =>
      runZcashSync({
        initialAccount: snapshotToAccount(snapshot),
        zainoUrl: config.zainoUrl,
        zainoGrpcUrl: config.zainoGrpcUrl,
        blockbookUrl: config.blockbookUrl,
        syncType: syncTypeMap[config.syncType],
        toHeight,
      }),
    );

    const results = await Promise.all(runs);
    for (const r of results) allMetrics.push(r.metrics);
  }

  const times = allMetrics.map(m => m.totalSyncTimeMs).sort((a, b) => a - b);
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const p50 = times[Math.floor(times.length * 0.5)];
  const p95 = times[Math.floor(times.length * 0.95)] ?? times[times.length - 1];
  const p99 = times[Math.floor(times.length * 0.99)] ?? times[times.length - 1];

  return {
    timingMs: { avg, p50, p95, p99, min: times[0], max: times[times.length - 1] },
    avgBlocksPerSecond:
      allMetrics.reduce((a, m) => a + m.throughput.blocksPerSecond, 0) / allMetrics.length,
    runs: allMetrics.length,
    rawMetrics: allMetrics,
  };
}

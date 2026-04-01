import path from "path";
import fs from "fs/promises";
import { createZcashAccountStub } from "./account-factory";
import { runZcashSync } from "./sync-driver";
import { writeSnapshot, ufvkFingerprint } from "./snapshot";
import type { SyncMetrics } from "./metrics-collector";
import { SYNC_TYPE_TRANSPARENT, SYNC_TYPE_SHIELDED } from "@ledgerhq/types-live";
import { logger } from "../utils/logger";

const SYNC_TYPE_ALL = SYNC_TYPE_TRANSPARENT | SYNC_TYPE_SHIELDED;

export interface RecordConfig {
  ufvk: string;
  xpub: string;
  birthHeight: number;
  zainoUrl?: string;
  zainoGrpcUrl?: string;
  blockbookUrl?: string;
  /** Checkpoint heights — sorted ascending before use */
  checkpoints: number[];
  outputDir: string;
  accountLabel: string;
  network: "mainnet" | "testnet";
  syncType: "transparent" | "shielded" | "all";
  /** Called on every sync update; useful for progress display */
  onProgress?: (height: number, opsCount: number) => void;
}

export interface RecordResult {
  snapshotPaths: string[];
  manifest: {
    accountLabel: string;
    ufvkFingerprint: string;
    birthHeight: number;
    checkpoints: number[];
    snapshots: string[];
    recordedAt: string;
    metrics: SyncMetrics;
  };
  metrics: SyncMetrics;
}

export async function runRecord(config: RecordConfig): Promise<RecordResult> {
  const checkpoints = [...config.checkpoints].sort((a, b) => a - b);

  logger.info(
    { label: config.accountLabel, birthHeight: config.birthHeight, checkpoints },
    "Starting record run",
  );

  const initialAccount = createZcashAccountStub({
    ufvk: config.ufvk,
    xpub: config.xpub,
    birthHeight: config.birthHeight,
    network: config.network,
  });

  const capturedSnapshots: string[] = [];
  let currentCheckpointIdx = 0;

  const syncTypeMap = {
    transparent: SYNC_TYPE_TRANSPARENT,
    shielded: SYNC_TYPE_SHIELDED,
    all: SYNC_TYPE_ALL,
  };

  const { metrics } = await runZcashSync({
    initialAccount,
    zainoUrl: config.zainoUrl,
    zainoGrpcUrl: config.zainoGrpcUrl,
    blockbookUrl: config.blockbookUrl,
    toHeight: checkpoints[checkpoints.length - 1],
    syncType: syncTypeMap[config.syncType],
    onUpdate: async shape => {
      const height = shape.blockHeight ?? 0;
      config.onProgress?.(height, shape.operationsCount ?? 0);

      // When syncType includes shielded, only capture checkpoints on shielded-origin
      // emissions (identified by presence of privateInfo). The transparent sync can
      // emit a far-future mainnet blockHeight (e.g. 3.3M) before shielded data has
      // been accumulated, which would capture an empty snapshot too early.
      const isShieldedEmission = shape.privateInfo !== undefined;
      const syncIncludesShielded = config.syncType === "shielded" || config.syncType === "all";
      if (syncIncludesShielded && !isShieldedEmission) return;

      while (
        currentCheckpointIdx < checkpoints.length &&
        height >= checkpoints[currentCheckpointIdx]
      ) {
        const checkpoint = checkpoints[currentCheckpointIdx];
        const snapshotPath = path.join(config.outputDir, `height-${checkpoint}.snapshot`);

        await writeSnapshot(snapshotPath, shape, {
          accountLabel: config.accountLabel,
          ufvkFingerprint: ufvkFingerprint(config.ufvk),
          birthHeight: config.birthHeight,
          snapshotHeight: checkpoint,
          chainTipAtCapture: height,
          coinBitcoinVersion: "0.0.0",
          zcashShieldedVersion: "0.0.0",
          network: config.network,
        });

        capturedSnapshots.push(snapshotPath);
        logger.info({ checkpoint, snapshotPath }, "Snapshot captured");
        currentCheckpointIdx++;
      }
    },
  });

  await fs.mkdir(config.outputDir, { recursive: true });
  const manifestPath = path.join(config.outputDir, "manifest.json");

  const manifest = {
    accountLabel: config.accountLabel,
    ufvkFingerprint: ufvkFingerprint(config.ufvk),
    birthHeight: config.birthHeight,
    checkpoints,
    snapshots: capturedSnapshots.map(p => path.basename(p)),
    recordedAt: new Date().toISOString(),
    metrics,
  };

  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  logger.info({ manifestPath, captured: capturedSnapshots.length }, "Manifest written");

  return { snapshotPaths: capturedSnapshots, manifest, metrics };
}

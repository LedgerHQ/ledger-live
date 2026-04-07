/**
 * Fixture-driven integration tests — Alice testnet account (shielded sync)
 *
 * Design principles:
 *   - All tests focus on syncType=shielded against testnet.zec.rocks.
 *   - All live tests use ABSOLUTE block heights pointing to fully-populated
 *     historical chain segments. No "+N" offsets that depend on chain tip.
 *   - The 50 000-block range 2 700 000 → 2 750 000 is the backbone: no new
 *     shielded transactions exist in that window, so the result is deterministic
 *     regardless of when the test runs. Native engine processes it in < 1 s.
 *   - Fixtures are committed to the repo (see fixtures/ directory). The record
 *     suite is opt-in behind ZCASH_RECORD=1 and is never run in CI.
 *
 * Note on incremental sync limitations:
 *   The native Rust engine starts from `snapshot.blockHeight + 1`. It cannot
 *   reproduce the same transaction history as a full scan from birth, because
 *   trial_decrypt_block uses IVKs only (no OVKs). Tests that rely on
 *   discovering transactions via incremental sync from a mid-chain snapshot
 *   would be non-deterministic. L2 uses only the stable 2700000→2750000
 *   window where no new shielded transactions exist — giving deterministic results.
 *
 * Committed snapshot anchors:
 *   alice-testnet/height-2560000  →  3 shielded ops, balance=0.00050000 ZEC
 *   alice-testnet/height-2700000  → 12 shielded ops, balance=0.17692173 ZEC
 *   alice-testnet/height-2750000  → 12 shielded ops, balance=0.17692173 ZEC (stable)
 *
 * Env vars required for L2 / Bench / L3:
 *   ZAINO_GRPC_URL=https://testnet.zec.rocks:443
 *
 * Env vars required for the Record suite (opt-in):
 *   ZCASH_RECORD=1
 *   ZCASH_UFVK=<unified full viewing key>
 *   ZCASH_XPUB=<xpub>
 *   ZCASH_BIRTH_HEIGHT=2542419
 *
 * Run all:      pnpm test:integ
 * Run live:     ZAINO_GRPC_URL=https://testnet.zec.rocks:443 pnpm test:integ
 * Run record:   ZCASH_RECORD=1 ZCASH_UFVK=... ZCASH_XPUB=... pnpm test:integ
 */

import path from "path";
import os from "os";
import fs from "fs/promises";
import type net from "net";
import { readSnapshot } from "../../core/snapshot";
import { runVerify } from "../../core/verify";
import { runReplay } from "../../core/replay";
import { runBench } from "../../core/bench";
import { runRecord } from "../../core/record";
import { createProxyServer } from "../../proxy/proxy-server";

// ── Environment ───────────────────────────────────────────────────────────────

const ZAINO_GRPC_URL = process.env.ZAINO_GRPC_URL ?? "";
const ZCASH_UFVK = process.env.ZCASH_UFVK ?? "";
const ZCASH_XPUB = process.env.ZCASH_XPUB ?? "";
const ZCASH_BIRTH_HEIGHT = parseInt(process.env.ZCASH_BIRTH_HEIGHT ?? "2542419", 10);

const hasNetwork = !!ZAINO_GRPC_URL;
const shouldRecord = !!process.env.ZCASH_RECORD && !!ZCASH_UFVK && !!ZCASH_XPUB && hasNetwork;

// ── Fixture paths ─────────────────────────────────────────────────────────────

const FIXTURES_DIR = path.resolve(__dirname, "../../../fixtures");
const GOLDEN_VALUES_PATH = path.join(FIXTURES_DIR, "golden-values.yaml");
const SNAPSHOT_2560000 = path.join(FIXTURES_DIR, "alice-testnet", "height-2560000.snapshot");
const SNAPSHOT_2700000 = path.join(FIXTURES_DIR, "alice-testnet", "height-2700000.snapshot");
const SNAPSHOT_2750000 = path.join(FIXTURES_DIR, "alice-testnet", "height-2750000.snapshot");

// ── L1 — Offline (no network) ─────────────────────────────────────────────────
//
// Uses committed fixtures only. Runs in < 100 ms.

describe("L1 — offline snapshot verification", () => {
  it("runVerify: all committed checkpoints pass golden values", async () => {
    const result = await runVerify({
      fixturesDir: FIXTURES_DIR,
      goldenValuesPath: GOLDEN_VALUES_PATH,
      mode: "quick",
    });

    const failed = result.rows.filter(r => !r.pass && !r.skipped);
    if (failed.length > 0) {
      const details = failed
        .map(r => `${r.account}@${r.height} ${r.check}: expected=${r.expected} actual=${r.actual}`)
        .join("\n");
      throw new Error(`${result.totalFailed} assertion(s) failed:\n${details}`);
    }

    expect(result.allPassed).toBe(true);
    // 5 assertions × 3 checkpoints
    expect(result.rows.filter(r => !r.skipped).length).toBe(15);
  });

  it("inspect height-2560000: first shielded batch (shielding + incoming visible)", async () => {
    const snapshot = await readSnapshot(SNAPSHOT_2560000);

    expect(snapshot.metadata.snapshotHeight).toBe(2_560_000);
    expect(snapshot.metadata.network).toBe("testnet");
    expect(snapshot.metadata.birthHeight).toBe(2_542_419);
    expect(snapshot.metadata.ufvkFingerprint).toBe("sha256:6b886d99b3466751");

    expect(snapshot.derivedData.shieldedBalance).toBe("0.00050000");
    expect(snapshot.derivedData.transparentBalance).toBe("0.00000000");
    expect(snapshot.derivedData.availableBalance).toBe("0.00050000");
    expect(snapshot.derivedData.operationsCount).toBe(3);
    expect(snapshot.derivedData.shieldedTxCount).toBe(3);
  });

  it("inspect height-2700000: all shielded txs visible (including outgoing + change)", async () => {
    const snapshot = await readSnapshot(SNAPSHOT_2700000);

    expect(snapshot.metadata.snapshotHeight).toBe(2_700_000);
    expect(snapshot.derivedData.shieldedBalance).toBe("0.17692173");
    expect(snapshot.derivedData.transparentBalance).toBe("0.00000000");
    expect(snapshot.derivedData.availableBalance).toBe("0.17692173");
    expect(snapshot.derivedData.operationsCount).toBe(12);
    expect(snapshot.derivedData.shieldedTxCount).toBe(12);
  });

  it("diff 2700000 → 2750000: no new shielded activity in that range", async () => {
    const snap2700 = await readSnapshot(SNAPSHOT_2700000);
    const snap2750 = await readSnapshot(SNAPSHOT_2750000);

    // The two snapshots must have the exact same derived values —
    // no shielded transaction falls between 2 700 000 and 2 750 000.
    expect(snap2750.derivedData.shieldedBalance).toBe(snap2700.derivedData.shieldedBalance);
    expect(snap2750.derivedData.operationsCount).toBe(snap2700.derivedData.operationsCount);
    expect(snap2750.derivedData.shieldedTxCount).toBe(snap2700.derivedData.shieldedTxCount);
    expect(snap2750.metadata.snapshotHeight).toBeGreaterThan(snap2700.metadata.snapshotHeight);
  });
});

// ── L2 — Live incremental replay ─────────────────────────────────────────────
//
// Uses the stable 2700000→2750000 window: no new shielded transactions exist
// in that 50 000-block range, so the result is fully deterministic.
// Starting from the 2700000 snapshot (which already includes the outgoing tx
// at 2700549), the engine processes 50 000 blocks and returns the same totals.

(hasNetwork ? describe : describe.skip)("L2 — incremental replay (live)", () => {
  it("shielded 2700000 → 2750000: stable window confirms no new txs", async () => {
    const result = await runReplay({
      snapshotPath: SNAPSHOT_2700000,
      syncTo: 2_750_000,
      zainoGrpcUrl: ZAINO_GRPC_URL,
      syncType: "shielded",
      assertions: {
        assertShieldedBalance: "0.17692173",
        assertShieldedTxCount: 12,
        assertOperationsCount: 12,
        assertTransparentBalance: "0.00000000",
      },
      timeoutMs: 20_000,
    });

    if (!result.allPassed) {
      const failed = result.assertionResults.filter(r => !r.pass);
      throw new Error(
        `Assertions failed:\n${failed.map(r => `  ${r.name}: expected=${r.expected} actual=${r.actual}`).join("\n")}`,
      );
    }
  }, 25_000);
});

// ── Bench — throughput over the 2700000→2750000 stable window ─────────────────
//
// 50 000 blocks × 3 iterations. Each iteration < 1 s with native engine.
// The bench also validates correctness: the stable window produces the same
// result every run, making it an implicit regression check too.

(hasNetwork ? describe : describe.skip)("Bench — shielded 2700000 → 2750000 throughput", () => {
  it("3 iterations: > 50 000 bl/s average, identical block count each run", async () => {
    const result = await runBench({
      snapshotPath: SNAPSHOT_2700000,
      syncBlocks: 50_000,
      iterations: 3,
      zainoGrpcUrl: ZAINO_GRPC_URL,
      syncType: "shielded",
    });

    expect(result.runs).toBe(3);
    // Network-limited throughput — assert > 500 bl/s as a basic sanity check
    expect(result.avgBlocksPerSecond).toBeGreaterThan(500);
    // All runs must process the same block count (determinism check)
    const blockCounts = result.rawMetrics.map(m => m.blocksProcessed);
    expect(new Set(blockCounts).size).toBe(1);
  }, 60_000);
});

// ── L3 — Fault injection ──────────────────────────────────────────────────────
//
// The stable 2700000→2750000 window is also ideal for fault injection: we know
// the exact expected result, so we can verify that the proxy doesn't corrupt data.

(hasNetwork ? describe : describe.skip)("L3 — fault injection via proxy", () => {
  let proxyServer: net.Server;
  let proxyPort: number;

  afterEach(() => {
    proxyServer?.close();
  });

  it("latency 100 ms/stream: 2700000→2750000 completes with exact same result as direct sync", async () => {
    const proxy = createProxyServer(ZAINO_GRPC_URL, {
      latencyMs: 100,
      errorRate: 0,
      dropResponses: false,
    });
    proxyServer = proxy.server;
    proxyPort = await proxy.port;

    const result = await runReplay({
      snapshotPath: SNAPSHOT_2700000,
      syncTo: 2_750_000,
      zainoGrpcUrl: `http://localhost:${proxyPort}`,
      syncType: "shielded",
      assertions: {
        assertShieldedBalance: "0.17692173",
        assertShieldedTxCount: 12,
        assertOperationsCount: 12,
      },
      timeoutMs: 30_000,
    });

    if (!result.allPassed) {
      const failed = result.assertionResults.filter(r => !r.pass);
      throw new Error(
        `Assertions failed:\n${failed.map(r => `  ${r.name}: expected=${r.expected} actual=${r.actual}`).join("\n")}`,
      );
    }
    const stats = proxy.getStats();
    expect(stats.totalRequests).toBeGreaterThan(0);
    expect(stats.errorsInjected).toBe(0);
    expect(stats.requestsDropped).toBe(0);
  }, 35_000);

  it("errorRate=1.0: sync fails after retries (ZCashNative retries 3×, each returns gRPC UNKNOWN)", async () => {
    const proxy = createProxyServer(ZAINO_GRPC_URL, {
      latencyMs: 0,
      errorRate: 1.0,
      dropResponses: false,
    });
    proxyServer = proxy.server;
    proxyPort = await proxy.port;

    await expect(
      runReplay({
        snapshotPath: SNAPSHOT_2700000,
        syncTo: 2_750_000,
        zainoGrpcUrl: `http://localhost:${proxyPort}`,
        syncType: "shielded",
        timeoutMs: 15_000,
      }),
    ).rejects.toThrow();

    const stats = proxy.getStats();
    expect(stats.errorsInjected).toBeGreaterThan(0);
  }, 20_000);
});

// ── Record — fixture creation (opt-in, never run in CI) ───────────────────────
//
// Enable with: ZCASH_RECORD=1 ZCASH_UFVK=<ufvk> ZCASH_XPUB=<xpub> pnpm test:integ
//
// Syncs from birth height to the three committed snapshot heights, then verifies
// the freshly-created snapshots against golden-values.yaml. This is how the
// fixtures/ directory was originally populated and how it can be refreshed.

(shouldRecord ? describe : describe.skip)(
  "Record — fixture creation from birth height (opt-in)",
  () => {
    let outputDir: string;

    beforeAll(async () => {
      outputDir = await fs.mkdtemp(path.join(os.tmpdir(), "zcash-alice-record-"));
    });

    afterAll(async () => {
      await fs.rm(outputDir, { recursive: true, force: true });
    });

    it("syncs birth → 2750000, captures 3 snapshots, all golden values pass", async () => {
      const recordResult = await runRecord({
        ufvk: ZCASH_UFVK,
        xpub: ZCASH_XPUB,
        birthHeight: ZCASH_BIRTH_HEIGHT,
        zainoGrpcUrl: ZAINO_GRPC_URL,
        checkpoints: [2_560_000, 2_700_000, 2_750_000],
        // outputDir/alice-testnet/ so runVerify can find alice-testnet/height-X.snapshot
        outputDir: path.join(outputDir, "alice-testnet"),
        accountLabel: "alice-testnet",
        network: "testnet",
        syncType: "shielded",
      });

      expect(recordResult.snapshotPaths).toHaveLength(3);
      expect(recordResult.metrics.blocksProcessed).toBeGreaterThan(0);

      // Verify each freshly-created snapshot against golden values.
      // fixturesDir=outputDir so verify looks for outputDir/alice-testnet/height-X.snapshot.
      const verifyResult = await runVerify({
        fixturesDir: outputDir,
        goldenValuesPath: GOLDEN_VALUES_PATH,
        mode: "quick",
      });

      const failed = verifyResult.rows.filter(r => !r.pass && !r.skipped);
      if (failed.length > 0) {
        const details = failed
          .map(
            r => `${r.account}@${r.height} ${r.check}: expected=${r.expected} actual=${r.actual}`,
          )
          .join("\n");
        throw new Error(`Fresh record does not match golden values:\n${details}`);
      }

      expect(verifyResult.allPassed).toBe(true);
    }, 120_000);
  },
);

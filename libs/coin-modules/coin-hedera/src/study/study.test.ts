/**
 * Block consistency test - checks that blocks remain stable over time.
 * Re-checks blocks at various intervals (1min, 5min, 10min, etc.) to detect changes.
 */

// Note: Type errors for fs/jest-diff/jest globals are expected as test files are excluded from tsconfig
import * as fs from "fs";
import * as path from "path";
import { diff } from "jest-diff";
import type { Block } from "@ledgerhq/coin-framework/api/types";
import { getBlock as apiGetBlock, lastBlock as apiLastBlock } from "../logic/index";
import coinConfig from "../config";

// Output files and directories - always relative to this file's directory
const STUDY_DIR = __dirname;
const RESULTS_CSV_FILE = path.join(STUDY_DIR, "results.csv");
const RESULTS_LOG_FILE = path.join(STUDY_DIR, "results.log");
const BLOCKS_DIR = path.join(STUDY_DIR, "blocks");

// Check intervals in milliseconds
const CHECK_INTERVALS_MS = [
  60_000, // 1min
  300_000, // 5min
  600_000, // 10min
  1_200_000, // 20min
  1_800_000, // 30min
  2_400_000, // 40min
  3_000_000, // 50min
  3_600_000, // 1h
  4_200_000, // 1h10
  4_800_000, // 1h20
  5_400_000, // 1h30
  6_000_000, // 1h40
  6_600_000, // 1h50
  7_200_000, // 2h
  10_800_000, // 3h
  14_400_000, // 4h
  18_000_000, // 5h
  21_600_000, // 6h
  28_800_000, // 8h
  43_200_000, // 12h
];

// Logging helper - writes to log file instead of console
function log(message: string): void {
  const line = `${message}\n`;
  fs.appendFileSync(RESULTS_LOG_FILE, line);
}

function initLogFile(): void {
  fs.writeFileSync(
    RESULTS_LOG_FILE,
    `Block Consistency Test - Started at ${new Date().toISOString()}\n`,
  );
  log("=".repeat(60));
}

function initBlocksDir(): void {
  // Clear and recreate blocks directory
  if (fs.existsSync(BLOCKS_DIR)) {
    fs.rmSync(BLOCKS_DIR, { recursive: true });
  }
  fs.mkdirSync(BLOCKS_DIR);
}

// CSV Header
const CSV_HEADER = "timestamp,block_height,interval_ms,interval_label,status\n";

interface CapturedBlock {
  height: number;
  content: Block;
  capturedAt: number;
  checksDone: number[];
  originalSaved: boolean; // Track if original block has been saved to file
}

interface CheckResult {
  timestamp: number;
  blockHeight: number;
  intervalMs: number;
  status: "changed" | "unchanged";
}

// Initialize coin config for API usage
function initCoinConfig(): void {
  coinConfig.setCoinConfig(() => ({ status: { type: "active" } }));
}

async function getLastBlock(): Promise<number> {
  const blockInfo = await apiLastBlock();
  return blockInfo.height;
}

async function getBlock(height: number): Promise<Block> {
  const block = await apiGetBlock(height);
  return normalizeBlock(block);
}

function formatInterval(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds >= 3600) {
    return `${Math.floor(seconds / 3600)}h`;
  }
  if (seconds >= 60) {
    return `${Math.floor(seconds / 60)}min`;
  }
  return `${seconds}s`;
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("en-US", { hour12: false });
}

function normalizeBlock(block: Block): Block {
  const normalized = { ...block };

  if (normalized.transactions) {
    // Filter out hiero/mirror-monitor transactions
    const filteredTxs = normalized.transactions.filter(tx => {
      const memo = (tx.details as { memo?: string })?.memo?.toLowerCase() ?? "";
      if (!memo) return true;
      return !memo.includes("hiero") && !memo.includes("mirror-monitor");
    });

    // Sort by transaction hash for stable ordering
    normalized.transactions = filteredTxs.sort((a, b) =>
      (a.hash ?? "").localeCompare(b.hash ?? ""),
    );
  }

  return normalized;
}

// Custom JSON serializer that handles BigInt
function jsonStringify(obj: unknown, indent?: number): string {
  return JSON.stringify(
    obj,
    (_key, value) => (typeof value === "bigint" ? value.toString() : value),
    indent,
  );
}

function deepEqual(a: unknown, b: unknown): boolean {
  return jsonStringify(a) === jsonStringify(b);
}

// Strip ANSI escape codes from string (used for diff output)
function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, "");
}

interface BlockChangeFiles {
  originalFile: string;
  afterFile: string;
  diffFile: string;
}

function saveBlockChangeFiles(
  height: number,
  intervalMs: number,
  originalBlock: Block,
  afterBlock: Block,
  blockDiff: string,
  captured: CapturedBlock,
): BlockChangeFiles {
  const intervalLabel = formatInterval(intervalMs);

  // Save original block (only if not already saved)
  const originalFile = `${BLOCKS_DIR}/${height}.0.json`;
  if (!captured.originalSaved) {
    fs.writeFileSync(originalFile, jsonStringify(originalBlock, 2));
    captured.originalSaved = true;
  }

  // Save after block
  const afterFile = `${BLOCKS_DIR}/${height}.${intervalLabel}.json`;
  fs.writeFileSync(afterFile, jsonStringify(afterBlock, 2));

  // Save diff
  const diffFile = `${BLOCKS_DIR}/${height}.${intervalLabel}.diff`;
  fs.writeFileSync(diffFile, blockDiff);

  return { originalFile, afterFile, diffFile };
}

function appendResultToCsv(result: CheckResult): void {
  const line = `${result.timestamp},${result.blockHeight},${result.intervalMs},${formatInterval(result.intervalMs)},${result.status}\n`;
  fs.appendFileSync(RESULTS_CSV_FILE, line);
}

function initCsvFile(): void {
  fs.writeFileSync(RESULTS_CSV_FILE, CSV_HEADER);
}

// ============================================================================
// Analysis functions
// ============================================================================

interface AnalysisData {
  changed: Map<number, number>;
  unchanged: Map<number, number>;
}

function parseResultsCsv(): AnalysisData {
  const changed = new Map<number, number>();
  const unchanged = new Map<number, number>();

  if (!fs.existsSync(RESULTS_CSV_FILE)) {
    return { changed, unchanged };
  }

  const content = fs.readFileSync(RESULTS_CSV_FILE, "utf-8");
  const lines = content.split("\n").slice(1); // Skip header

  for (const line of lines) {
    if (!line.trim()) continue;

    const parts = line.split(",");
    if (parts.length < 5) continue;

    const intervalMs = parseInt(parts[2]);
    const status = parts[4];

    if (status === "changed") {
      changed.set(intervalMs, (changed.get(intervalMs) ?? 0) + 1);
    } else if (status === "unchanged") {
      unchanged.set(intervalMs, (unchanged.get(intervalMs) ?? 0) + 1);
    }
  }

  return { changed, unchanged };
}

function renderHistogram(
  changed: Map<number, number>,
  unchanged: Map<number, number>,
  maxWidth: number = 40,
): string {
  // Get all intervals
  const allIntervals = [...new Set([...changed.keys(), ...unchanged.keys()])].sort((a, b) => a - b);

  if (allIntervals.length === 0) {
    return "No data to display.";
  }

  // Find max count for scaling
  const maxCount = Math.max(
    Math.max(...changed.values(), 0),
    Math.max(...unchanged.values(), 0),
    1,
  );

  // Find max label width
  const labels = allIntervals.map(interval => formatInterval(interval));
  const maxLabelWidth = Math.max(...labels.map(l => l.length));

  // Find max count width
  const allCounts = [...changed.values(), ...unchanged.values()];
  const maxCountWidth = Math.max(...allCounts.map(c => c.toString().length), 1);

  const lines: string[] = [];
  lines.push("");
  lines.push("Block Check Results by Interval");
  lines.push("  ❌ = changed    ✅ = unchanged");
  lines.push("=".repeat(maxLabelWidth + maxWidth + maxCountWidth * 2 + 20));

  for (const interval of allIntervals) {
    const label = formatInterval(interval);
    const chCount = changed.get(interval) ?? 0;
    const unchCount = unchanged.get(interval) ?? 0;

    // Calculate bar widths
    const chBarWidth = maxCount > 0 ? Math.floor((chCount / maxCount) * maxWidth) : 0;
    const unchBarWidth = maxCount > 0 ? Math.floor((unchCount / maxCount) * maxWidth) : 0;

    const chBar = "█".repeat(chBarWidth);
    const unchBar = "░".repeat(unchBarWidth);

    // Format lines
    lines.push(
      `${label.padStart(maxLabelWidth)} ❌ │ ${chBar.padEnd(maxWidth)} ${chCount.toString().padStart(maxCountWidth)}`,
    );
    lines.push(
      `${" ".repeat(maxLabelWidth)} ✅ │ ${unchBar.padEnd(maxWidth)} ${unchCount.toString().padStart(maxCountWidth)}`,
    );
    lines.push(`${" ".repeat(maxLabelWidth)}    │`);
  }

  lines.push("=".repeat(maxLabelWidth + maxWidth + maxCountWidth * 2 + 20));

  // Summary
  const totalChanged = [...changed.values()].reduce((a, b) => a + b, 0);
  const totalUnchanged = [...unchanged.values()].reduce((a, b) => a + b, 0);
  const total = totalChanged + totalUnchanged;

  lines.push(`\nTotal checks: ${total}`);
  if (total > 0) {
    lines.push(
      `  Changed:   ${totalChanged.toString().padStart(5)} (${((totalChanged / total) * 100).toFixed(1)}%)`,
    );
    lines.push(
      `  Unchanged: ${totalUnchanged.toString().padStart(5)} (${((totalUnchanged / total) * 100).toFixed(1)}%)`,
    );
  } else {
    lines.push("  Changed:       0");
    lines.push("  Unchanged:     0");
  }

  return lines.join("\n");
}

function renderDetailedBreakdown(
  changed: Map<number, number>,
  unchanged: Map<number, number>,
): string {
  const allIntervals = [...new Set([...changed.keys(), ...unchanged.keys()])].sort((a, b) => a - b);

  const lines: string[] = [];
  lines.push("\nDetailed breakdown by interval:");
  lines.push(
    `${"Interval".padStart(8)} │ ${"Changed".padStart(8)} │ ${"Unchanged".padStart(10)} │ ${"Change Rate".padStart(11)}`,
  );
  lines.push("─".repeat(48));

  for (const interval of allIntervals) {
    const ch = changed.get(interval) ?? 0;
    const unch = unchanged.get(interval) ?? 0;
    const total = ch + unch;
    const rate = total > 0 ? (ch / total) * 100 : 0;
    lines.push(
      `${formatInterval(interval).padStart(8)} │ ${ch.toString().padStart(8)} │ ${unch.toString().padStart(10)} │ ${rate.toFixed(1).padStart(10)}%`,
    );
  }

  return lines.join("\n");
}

// ============================================================================
// Analysis runner
// ============================================================================

function runAnalysis(): void {
  log(`\n${"#".repeat(60)}`);
  log(`# PERIODIC ANALYSIS - ${new Date().toISOString()}`);
  log("#".repeat(60));

  if (!fs.existsSync(RESULTS_CSV_FILE)) {
    log(`No results file found at ${RESULTS_CSV_FILE}.`);
    return;
  }

  const { changed, unchanged } = parseResultsCsv();

  if (changed.size === 0 && unchanged.size === 0) {
    log("No check results found in the CSV file yet.");
    return;
  }

  // Display histogram
  const histogram = renderHistogram(changed, unchanged);
  log(histogram);

  // Display detailed breakdown
  const breakdown = renderDetailedBreakdown(changed, unchanged);
  log(breakdown);

  // Calculate total changes
  const totalChanged = [...changed.values()].reduce((a, b) => a + b, 0);
  const totalUnchanged = [...unchanged.values()].reduce((a, b) => a + b, 0);
  const total = totalChanged + totalUnchanged;

  if (total > 0) {
    const changeRate = (totalChanged / total) * 100;
    log(`\n📈 Overall change rate: ${changeRate.toFixed(2)}%`);

    if (changeRate > 0) {
      log(`\n⚠️ Warning: ${totalChanged} block(s) changed so far.`);
    }
  }

  log("#".repeat(60) + "\n");
}

// ============================================================================
// Tests
// ============================================================================

// Analysis interval: 10 minutes
const ANALYSIS_INTERVAL_MS = 10 * 60 * 1000;

describe("Block Consistency", () => {
  // Set a very long timeout for this test suite
  jest.setTimeout(24 * 60 * 60 * 1000);

  it("run", async () => {
    const capturedBlocks: Map<number, CapturedBlock> = new Map();
    let lastHeight: number | null = null;
    const errors: string[] = [];
    let lastAnalysisTime = 0;

    // Initialize - clear all output files and directories
    initCoinConfig();
    initCsvFile();
    initLogFile();
    initBlocksDir();

    log("Starting block consistency monitor...");
    log(`Results will be written to: ${RESULTS_CSV_FILE}`);
    log(`Will re-check blocks after: ${CHECK_INTERVALS_MS.map(formatInterval).join(", ")}`);
    log(`Will run analysis every ${formatInterval(ANALYSIS_INTERVAL_MS)}`);
    log("-".repeat(60));

    // Run until all captured blocks have completed all checks
    // or we've been running for the max interval + some buffer
    const maxRunTime = Math.max(...CHECK_INTERVALS_MS) + 60_000; // max interval + 1 min buffer
    const startTime = Date.now();

    while (Date.now() - startTime < maxRunTime) {
      const now = Date.now();

      // Run periodic analysis every 10 minutes
      if (now - lastAnalysisTime >= ANALYSIS_INTERVAL_MS) {
        runAnalysis();
        lastAnalysisTime = now;
      }

      // Get the latest block
      try {
        const height = await getLastBlock();

        // Capture new block if height changed
        if (height !== lastHeight) {
          try {
            const content = await getBlock(height);
            capturedBlocks.set(height, {
              height,
              content,
              capturedAt: now,
              checksDone: [],
              originalSaved: false,
            });
            log(`[${formatTime(now)}] 📦 Captured block ${height}`);
            lastHeight = height;
          } catch (e) {
            log(`[${formatTime(now)}] ⚠️ Error getting block ${height}: ${e}`);
          }
        }
      } catch (e) {
        log(`[${formatTime(now)}] ⚠️ Error getting last block: ${e}`);
      }

      // Check captured blocks at each interval
      const blocksToRemove: number[] = [];

      for (const [blockHeight, captured] of capturedBlocks) {
        const elapsed = now - captured.capturedAt;

        for (const interval of CHECK_INTERVALS_MS) {
          // Check if we've passed this interval and haven't checked yet
          if (elapsed >= interval && !captured.checksDone.includes(interval)) {
            try {
              const currentBlock = await getBlock(blockHeight);

              // Compare blocks (already normalized at fetch time)
              const isChanged = !deepEqual(captured.content, currentBlock);

              // Record result to CSV
              appendResultToCsv({
                timestamp: now,
                blockHeight,
                intervalMs: interval,
                status: isChanged ? "changed" : "unchanged",
              });

              if (isChanged) {
                const blockDiff = stripAnsi(diff(captured.content, currentBlock) ?? "");
                const files = saveBlockChangeFiles(
                  blockHeight,
                  interval,
                  captured.content,
                  currentBlock,
                  blockDiff,
                  captured,
                );

                const errorMsg = `BLOCK ${blockHeight} CHANGED after ${formatInterval(interval)}!`;
                log(`[${formatTime(now)}] ❌ ${errorMsg}`);
                log(`  Original: ${files.originalFile}`);
                log(`  After:    ${files.afterFile}`);
                log(`  Diff:     ${files.diffFile}`);

                errors.push(errorMsg);
              } else {
                log(
                  `[${formatTime(now)}] ✅ Block ${blockHeight} unchanged after ${formatInterval(interval)}`,
                );
              }

              captured.checksDone.push(interval);
            } catch (e) {
              log(`[${formatTime(now)}] ⚠️ Error re-checking block ${blockHeight}: ${e}`);
            }
          }
        }

        // Remove block if all checks are done
        if (captured.checksDone.length >= CHECK_INTERVALS_MS.length) {
          blocksToRemove.push(blockHeight);
        }
      }

      // Clean up fully checked blocks
      for (const blockHeight of blocksToRemove) {
        capturedBlocks.delete(blockHeight);
        log(`[${formatTime(now)}] 🗑️ Block ${blockHeight} fully checked, removing from tracking`);
      }

      // Status update every minute
      if (capturedBlocks.size > 0 && Math.floor(now / 60000) % 1 === 0) {
        const oldestBlock = Math.min(...Array.from(capturedBlocks.values()).map(b => b.capturedAt));
        const oldestAge = formatInterval(now - oldestBlock);
        log(
          `[${formatTime(now)}] 📊 Tracking ${capturedBlocks.size} blocks (oldest: ${oldestAge})`,
        );
      }

      // Wait before next iteration
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Assert no errors occurred
    if (errors.length > 0) {
      throw new Error(
        `Block consistency check failed with ${errors.length} error(s):\n${errors.join("\n")}`,
      );
    }

    // Final analysis
    log("\n" + "=".repeat(60));
    log("FINAL ANALYSIS");
    log("=".repeat(60));
    runAnalysis();

    log("\n✅ All block consistency checks passed!");
  });

  it("analyze", () => {
    runAnalysis();
  });
});

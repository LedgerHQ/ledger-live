import type { CommandModule } from "yargs";
import fs from "fs/promises";
import ora from "ora";
import { runReplay } from "../core/replay";
import { formatAssertionResults } from "../core/assertions";
import { logger } from "../utils/logger";

interface ReplayArgs {
  snapshot: string;
  syncTo: string;
  zainoUrl?: string;
  zainoGrpcUrl?: string;
  blockbookUrl: string;
  syncType: "transparent" | "shielded" | "all";
  assertShieldedBalance?: string;
  assertTransparentBalance?: string;
  assertAvailableBalance?: string;
  assertOperationsCount?: number;
  assertShieldedTxCount?: number;
  timeout: number;
  outputReport?: string;
}

export const replayCommand: CommandModule<{}, ReplayArgs> = {
  command: "replay",
  describe:
    "Load a snapshot and run an incremental sync, then assert on the resulting account shape.",
  builder: yargs =>
    yargs
      .option("snapshot", {
        type: "string",
        demandOption: true,
        describe: "Path to snapshot file",
      })
      .option("syncTo", {
        type: "string",
        demandOption: true,
        describe: "Target block height (absolute) or delta like +500",
      })
      .option("zainoUrl", {
        type: "string",
        describe:
          "Zaino JSON-RPC URL — required for shielded sync (mutually exclusive with --zainoGrpcUrl)",
      })
      .option("zainoGrpcUrl", {
        type: "string",
        describe:
          "Zaino gRPC URL — uses native Rust engine (~27 000 bl/s). Takes priority over --zainoUrl",
      })
      .option("blockbookUrl", {
        type: "string",
        demandOption: true,
        describe: "Blockbook URL",
      })
      .option("assertShieldedBalance", {
        type: "string",
        describe: "Expected shielded balance (ZEC, 8 decimals)",
      })
      .option("assertTransparentBalance", {
        type: "string",
        describe: "Expected transparent balance (ZEC, 8 decimals)",
      })
      .option("assertAvailableBalance", {
        type: "string",
        describe: "Expected total available balance (ZEC, 8 decimals)",
      })
      .option("assertOperationsCount", {
        type: "number",
        describe: "Expected total operations count",
      })
      .option("assertShieldedTxCount", {
        type: "number",
        describe: "Expected shielded transaction count",
      })
      .option("timeout", {
        type: "number",
        default: 120000,
        describe: "Timeout in milliseconds",
      })
      .option("outputReport", {
        type: "string",
        describe: "Write JSON report to this path",
      })
      .option("syncType", {
        type: "string",
        choices: ["transparent", "shielded", "all"] as const,
        default: "all" as const,
        describe: "Sync type: transparent only, shielded only, or both",
      })
      .check(argv => {
        if (argv.syncType !== "transparent" && !argv.zainoUrl && !argv.zainoGrpcUrl) {
          throw new Error(
            "--zainoUrl or --zainoGrpcUrl is required when --syncType is 'shielded' or 'all'",
          );
        }
        if (argv.zainoUrl && argv.zainoGrpcUrl) {
          throw new Error("--zainoUrl and --zainoGrpcUrl are mutually exclusive");
        }
        return true;
      }),
  handler: async argv => {
    const spinner = ora(`Replaying from snapshot...`).start();

    const result = await runReplay({
      snapshotPath: argv.snapshot,
      syncTo: argv.syncTo,
      zainoUrl: argv.zainoUrl,
      zainoGrpcUrl: argv.zainoGrpcUrl,
      blockbookUrl: argv.blockbookUrl,
      syncType: argv.syncType,
      assertions: {
        assertShieldedBalance: argv.assertShieldedBalance,
        assertTransparentBalance: argv.assertTransparentBalance,
        assertAvailableBalance: argv.assertAvailableBalance,
        assertOperationsCount: argv.assertOperationsCount,
        assertShieldedTxCount: argv.assertShieldedTxCount,
      },
      timeoutMs: argv.timeout,
      onProgress: (height, toHeight) => {
        spinner.text = `Block ${height} / ${toHeight} | ops=${result?.finalShape?.operationsCount ?? 0}`;
      },
    });

    spinner.succeed(
      `Replay complete in ${(result.metrics.totalSyncTimeMs / 1000).toFixed(1)}s | blocks=${result.metrics.blocksProcessed}`,
    );

    if (result.assertionResults.length > 0) {
      console.log("\nAssertions:");
      console.log(formatAssertionResults(result.assertionResults));
    }

    const report = {
      snapshot: argv.snapshot,
      metrics: result.metrics,
      assertions: result.assertionResults,
      allPassed: result.allPassed,
      finalState: {
        blockHeight: result.finalShape.blockHeight,
        operationsCount: result.finalShape.operationsCount,
        shieldedTxCount: result.finalShape.privateInfo?.transactions?.length,
        syncState: result.finalShape.privateInfo?.syncState,
      },
    };

    if (argv.outputReport) {
      await fs.writeFile(argv.outputReport, JSON.stringify(report, null, 2));
      logger.info({ path: argv.outputReport }, "Report written");
    }

    if (result.assertionResults.length > 0 && !result.allPassed) {
      logger.error("Some assertions failed");
      process.exit(1);
    }
    // The native Rust engine (napi-rs) keeps a libuv reference alive after sync completes,
    // preventing the Node.js event loop from exiting naturally.
    process.exit(0);
  },
};

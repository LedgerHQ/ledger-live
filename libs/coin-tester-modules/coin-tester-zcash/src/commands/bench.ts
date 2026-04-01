import type { CommandModule } from "yargs";
import fs from "fs/promises";
import ora from "ora";
import { runBench } from "../core/bench";
import { logger } from "../utils/logger";

interface BenchArgs {
  snapshot: string;
  syncBlocks: number;
  iterations: number;
  parallelAccounts: number;
  zainoUrl?: string;
  zainoGrpcUrl?: string;
  blockbookUrl: string;
  syncType: "transparent" | "shielded" | "all";
  output?: string;
}

export const benchCommand: CommandModule<{}, BenchArgs> = {
  command: "bench",
  describe: "Benchmark sync performance: repeated runs, percentile stats.",
  builder: yargs =>
    yargs
      .option("snapshot", {
        type: "string",
        demandOption: true,
        describe: "Path to snapshot file",
      })
      .option("syncBlocks", {
        type: "number",
        default: 500,
        describe: "Number of blocks to sync per iteration",
      })
      .option("iterations", {
        type: "number",
        default: 3,
        describe: "Number of iterations",
      })
      .option("parallelAccounts", {
        type: "number",
        default: 1,
        describe: "Number of parallel account syncs (2-3 max)",
      })
      .option("zainoUrl", {
        type: "string",
        describe:
          "Zaino JSON-RPC URL — required for shielded sync (mutually exclusive with --zainoGrpcUrl)",
      })
      .option("zainoGrpcUrl", {
        type: "string",
        describe: "Zaino gRPC URL — takes priority over --zainoUrl",
      })
      .option("blockbookUrl", {
        type: "string",
        demandOption: true,
        describe: "Blockbook URL",
      })
      .option("syncType", {
        type: "string",
        choices: ["transparent", "shielded", "all"] as const,
        default: "all" as const,
        describe: "Sync type: transparent only, shielded only, or both",
      })
      .option("output", {
        type: "string",
        describe: "Write JSON results to this path",
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
    const spinner = ora("Benchmarking...").start();

    const result = await runBench({
      snapshotPath: argv.snapshot,
      syncBlocks: argv.syncBlocks,
      iterations: argv.iterations,
      parallelAccounts: argv.parallelAccounts,
      zainoUrl: argv.zainoUrl,
      zainoGrpcUrl: argv.zainoGrpcUrl,
      blockbookUrl: argv.blockbookUrl,
      syncType: argv.syncType,
    });

    spinner.succeed("Bench complete");

    const { avg, p50, p95, p99 } = result.timingMs;
    console.log(
      `\nBench results (${result.runs} runs):\n` +
        `  avg=${avg.toFixed(0)}ms  p50=${p50}ms  p95=${p95}ms  p99=${p99}ms\n` +
        `  avg throughput: ${result.avgBlocksPerSecond.toFixed(1)} blocks/s`,
    );

    if (argv.output) {
      await fs.writeFile(argv.output, JSON.stringify(result, null, 2));
      logger.info({ path: argv.output }, "Bench report written");
    }
    // The native Rust engine (napi-rs) keeps a libuv reference alive after sync completes,
    // preventing the Node.js event loop from exiting naturally.
    process.exit(0);
  },
};

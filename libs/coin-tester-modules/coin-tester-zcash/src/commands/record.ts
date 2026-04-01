import type { CommandModule } from "yargs";
import ora from "ora";
import { runRecord } from "../core/record";
import { logger } from "../utils/logger";

interface RecordArgs {
  ufvk: string;
  xpub: string;
  birthHeight: number;
  zainoUrl?: string;
  zainoGrpcUrl?: string;
  blockbookUrl: string;
  checkpoints: string;
  outputDir: string;
  accountLabel: string;
  network: "mainnet" | "testnet";
  syncType: "transparent" | "shielded" | "all";
}

export const recordCommand: CommandModule<{}, RecordArgs> = {
  command: "record",
  describe:
    "Run a full Zcash sync and capture account snapshots at checkpoint heights. Nightly CI job.",
  builder: yargs =>
    yargs
      .option("ufvk", { type: "string", demandOption: true, describe: "Unified Full Viewing Key" })
      .option("xpub", {
        type: "string",
        demandOption: true,
        describe: "xpub for transparent sync (from account)",
      })
      .option("birthHeight", {
        type: "number",
        demandOption: true,
        describe: "Account birth height",
      })
      .option("zainoUrl", {
        type: "string",
        describe:
          "Zaino JSON-RPC URL — required for shielded sync (mutually exclusive with --zainoGrpcUrl)",
      })
      .option("zainoGrpcUrl", {
        type: "string",
        describe:
          "Zaino gRPC URL — uses native Rust engine (napi-rs + tonic). Takes priority over --zainoUrl",
      })
      .option("blockbookUrl", {
        type: "string",
        demandOption: true,
        describe: "Blockbook URL",
      })
      .option("checkpoints", {
        type: "string",
        demandOption: true,
        describe: "Comma-separated block heights to capture (e.g. 700000,800000)",
      })
      .option("outputDir", {
        type: "string",
        demandOption: true,
        describe: "Directory to write snapshot files",
      })
      .option("accountLabel", {
        type: "string",
        default: "account",
        describe: "Human-readable label for the account",
      })
      .option("network", {
        type: "string",
        choices: ["mainnet", "testnet"] as const,
        default: "mainnet" as const,
        describe: "mainnet or testnet",
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
    const checkpoints = argv.checkpoints
      .split(",")
      .map(h => parseInt(h.trim(), 10))
      .sort((a, b) => a - b);

    const spinner = ora(`Recording from block ${argv.birthHeight}...`).start();

    process.on("SIGINT", () => {
      spinner.warn("Interrupted");
      process.exit(1);
    });

    const result = await runRecord({
      ufvk: argv.ufvk,
      xpub: argv.xpub,
      birthHeight: argv.birthHeight,
      zainoUrl: argv.zainoUrl,
      zainoGrpcUrl: argv.zainoGrpcUrl,
      blockbookUrl: argv.blockbookUrl,
      checkpoints,
      outputDir: argv.outputDir,
      accountLabel: argv.accountLabel,
      network: argv.network,
      syncType: argv.syncType,
      onProgress: (height, opsCount) => {
        spinner.text = `Block ${height} | ops=${opsCount}`;
      },
    });

    spinner.succeed(`Record complete in ${(result.metrics.totalSyncTimeMs / 1000).toFixed(1)}s`);
    logger.info({ captured: result.snapshotPaths.length }, "Manifest written");
    // The native Rust engine (napi-rs) keeps a libuv reference alive after sync completes,
    // preventing the Node.js event loop from exiting naturally.
    process.exit(0);
  },
};

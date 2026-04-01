import type { CommandModule } from "yargs";
import { table } from "table";
import { runVerify } from "../core/verify";
import { logger } from "../utils/logger";

interface VerifyArgs {
  fixturesDir: string;
  goldenValues: string;
  mode: "quick" | "full";
}

export const verifyCommand: CommandModule<{}, VerifyArgs> = {
  command: "verify",
  describe: "Verify snapshots against golden values (L1 offline or L2 full).",
  builder: yargs =>
    yargs
      .option("fixturesDir", {
        type: "string",
        demandOption: true,
        describe: "Directory containing snapshot files",
      })
      .option("goldenValues", {
        type: "string",
        demandOption: true,
        describe: "Path to golden-values.yaml",
      })
      .option("mode", {
        type: "string",
        choices: ["quick", "full"] as const,
        default: "quick" as const,
        describe: "quick (L1, offline) or full (L2, live sync)",
      }),
  handler: async argv => {
    const result = await runVerify({
      fixturesDir: argv.fixturesDir,
      goldenValuesPath: argv.goldenValues,
      mode: argv.mode,
    });

    const rows: string[][] = [["Account", "Height", "Check", "Expected", "Actual", "Status"]];
    for (const r of result.rows) {
      rows.push([
        r.account,
        String(r.height),
        r.check,
        r.expected,
        r.actual,
        r.skipped ? "SKIP" : r.pass ? "PASS" : "FAIL",
      ]);
    }

    console.log(table(rows));

    if (result.totalFailed > 0) {
      logger.error(`${result.totalFailed} assertion(s) failed`);
      process.exit(1);
    } else {
      logger.info("All assertions passed");
    }
  },
};

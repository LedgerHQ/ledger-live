#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { recordCommand } from "./commands/record";
import { replayCommand } from "./commands/replay";
import { verifyCommand } from "./commands/verify";
import { benchCommand } from "./commands/bench";
import { proxyCommand } from "./commands/proxy";
import { inspectCommand } from "./commands/inspect";

yargs(hideBin(process.argv))
  .scriptName("zcash-sync-tester")
  .usage(
    "$0 <command> [options]\n\n" +
      "  record   Full sync + snapshot capture (nightly CI)\n" +
      "  replay   Fast incremental sync from snapshot + assertions (developer loop)\n" +
      "  verify   Golden value assertions against snapshots (L1 offline / L2 live)\n" +
      "  bench    Performance benchmarking with percentile stats\n" +
      "  proxy    Fault-injecting HTTP interceptor for resilience testing (L3)\n" +
      "  inspect  Dump or diff snapshot metadata",
  )
  .command(recordCommand)
  .command(replayCommand)
  .command(verifyCommand)
  .command(benchCommand)
  .command(proxyCommand)
  .command(inspectCommand)
  .demandCommand(1, "Please specify a command.")
  .strict()
  .help()
  .version("0.1.0")
  .parseAsync()
  .catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(2);
  });

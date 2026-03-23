import "./setup";

import { Command } from "commander";
import { registerBalance } from "./commands/balance";
import { registerOperations } from "./commands/operations";
import { registerDiscoverAccounts } from "./commands/discoverAccounts";
import { registerReceive } from "./commands/receive";
import { registerSend } from "./commands/send";

const program = new Command();

program
  .name("ledger-cli")
  .description("Modern CLI for Ledger hardware wallets — power users, developers & agents")
  .version("0.1.0")
  .option(
    "--format <format>",
    "Output format: human (default) or json",
    (val: string) => {
      if (!["human", "json"].includes(val)) {
        throw new Error(`--format must be "human" or "json", got: "${val}"`);
      }
      return val;
    },
    "human",
  );

registerDiscoverAccounts(program);
registerBalance(program);
registerOperations(program);
registerReceive(program);
registerSend(program);

program.parseAsync(process.argv).catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  process.stderr.write(`Fatal: ${msg}\n`);
  process.exit(1);
});

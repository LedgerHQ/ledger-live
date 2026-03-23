import type { Command } from "commander";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { toOperationRaw } from "@ledgerhq/live-common/account/index";
import { parseDescriptor, buildShellAccount, formatDescriptorHuman } from "../descriptor";
import { syncAccount } from "../bridge";
import { createSpinner, outputJson, outputLine, outputHeader, runCommand, chalk } from "../output";
import type { OutputFormat } from "../output";

export function registerOperations(program: Command) {
  program
    .command("operations <descriptor>")
    .description("List recent operations (syncs from blockchain, no device needed)")
    .option("-l, --limit <n>", "Max number of operations to show", "20")
    .action(async (descriptor: string, opts: { limit?: string; format?: OutputFormat }) => {
      const format: OutputFormat = (program.opts().format as OutputFormat) || "human";
      const limit = parseInt(opts.limit || "20", 10);

      await runCommand(format, async () => {
        const spinner = createSpinner(format);
        spinner.start("Parsing descriptor…");

        const parsed = parseDescriptor(descriptor);
        const shell = buildShellAccount(parsed);

        spinner.text = `Syncing ${shell.currency.name} operations…`;
        const account = await syncAccount(shell, {
          paginationConfig: { operations: limit },
        });
        spinner.succeed(`${account.operations.length} operations synced`);

        const ops = account.operations.slice(0, limit);
        const unit = account.currency.units[0];

        if (format === "json") {
          outputJson({
            descriptor: account.id,
            currency: account.currency.id,
            count: ops.length,
            operations: ops.map(op => toOperationRaw(op)),
          });
        } else {
          outputHeader(formatDescriptorHuman(account));
          if (ops.length === 0) {
            outputLine("  No operations found.");
            return;
          }
          outputLine(
            chalk.dim("  Date                 Type       Amount                Hash"),
          );
          outputLine(chalk.dim("  " + "─".repeat(72)));
          for (const op of ops) {
            const date = op.date.toISOString().replace("T", " ").slice(0, 19);
            const typeStr = op.type.padEnd(10);
            const sign = op.type === "IN" ? chalk.green("+") : chalk.red("-");
            const amountStr = formatCurrencyUnit(unit, op.value, { showCode: true })
              .padStart(20);
            const hash = op.hash ? op.hash.slice(0, 12) + "…" : "—";
            outputLine(`  ${date}  ${typeStr} ${sign}${amountStr}  ${hash}`);
          }
        }
      });
    });
}

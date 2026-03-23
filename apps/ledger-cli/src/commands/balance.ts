import type { Command } from "commander";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { parseDescriptor, buildShellAccount, formatDescriptorHuman } from "../descriptor";
import { syncAccount } from "../bridge";
import { createSpinner, outputJson, outputLine, outputHeader, runCommand } from "../output";
import type { OutputFormat } from "../output";

export function registerBalance(program: Command) {
  program
    .command("balance <descriptor>")
    .description("Show account balance (syncs from blockchain, no device needed)")
    .option("--sub-accounts", "Show token sub-account balances")
    .action(async (descriptor: string, opts: { subAccounts?: boolean; format?: OutputFormat }) => {
      const format: OutputFormat = (program.opts().format as OutputFormat) || "human";
      await runCommand(format, async () => {
        const spinner = createSpinner(format);
        spinner.start("Parsing descriptor…");

        const parsed = parseDescriptor(descriptor);
        const shell = buildShellAccount(parsed);

        spinner.text = `Syncing ${shell.currency.name} account…`;
        const account = await syncAccount(shell);
        spinner.succeed("Account synced");

        const mainUnit = account.currency.units[0];
        const balanceStr = formatCurrencyUnit(mainUnit, account.balance, {
          showCode: true,
          disableRounding: false,
        });

        if (format === "json") {
          const result: Record<string, unknown> = {
            descriptor: account.id,
            currency: account.currency.id,
            balance: account.balance.toFixed(),
            balanceFormatted: balanceStr,
            freshAddress: account.freshAddress,
          };
          if (opts.subAccounts && account.subAccounts?.length) {
            result.subAccounts = account.subAccounts.map(sa => {
              if (sa.type !== "TokenAccount") return null;
              const unit = sa.token.units[0];
              return {
                token: sa.token.id,
                balance: sa.balance.toFixed(),
                balanceFormatted: formatCurrencyUnit(unit, sa.balance, { showCode: true }),
              };
            }).filter(Boolean);
          }
          outputJson(result);
        } else {
          outputHeader(formatDescriptorHuman(account));
          outputLine(`  Balance:  ${balanceStr}`);
          outputLine(`  Address:  ${account.freshAddress}`);
          outputLine(`  ID:       ${account.id}`);
          if (opts.subAccounts && account.subAccounts?.length) {
            outputLine("  Tokens:");
            for (const sa of account.subAccounts) {
              if (sa.type !== "TokenAccount") continue;
              const unit = sa.token.units[0];
              const saBalance = formatCurrencyUnit(unit, sa.balance, { showCode: true });
              outputLine(`    ${sa.token.name}: ${saBalance}`);
            }
          }
        }
      });
    });
}

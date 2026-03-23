import type { Command } from "commander";
import { BigNumber } from "bignumber.js";
import { lastValueFrom } from "rxjs";
import { filter, take, reduce } from "rxjs/operators";
import {
  parseCurrencyUnit,
  formatCurrencyUnit,
} from "@ledgerhq/live-common/currencies/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { toOperationRaw } from "@ledgerhq/live-common/account/index";
import { parseDescriptor, buildShellAccount, formatDescriptorHuman } from "../descriptor";
import { syncAccount } from "../bridge";
import { withDeviceApp } from "../dmk";
import { createSpinner, outputJson, outputLine, outputHeader, runCommand, chalk } from "../output";
import type { OutputFormat } from "../output";

function parseAmount(amountStr: string, account: { balance: BigNumber; currency: { units: import("@ledgerhq/types-cryptoassets").Unit[] } }): BigNumber {
  const { units } = account.currency;
  const lower = amountStr.toLowerCase().trim();

  // Percentage of balance
  if (lower.endsWith("%")) {
    const pct = parseFloat(lower);
    if (isNaN(pct)) throw new Error(`Invalid percentage: "${amountStr}"`);
    return account.balance.times(pct / 100).integerValue(BigNumber.ROUND_FLOOR);
  }

  // Try matching a unit code suffix (e.g. "0.1 eth", "100 gwei")
  for (const unit of units) {
    const code = unit.code.toLowerCase();
    if (lower.includes(code)) {
      return parseCurrencyUnit(unit, lower.replace(code, "").trim());
    }
  }

  // Default: main unit
  return parseCurrencyUnit(units[0], amountStr);
}

export function registerSend(program: Command) {
  program
    .command("send <descriptor>")
    .description("Sign and broadcast a transaction")
    .requiredOption("-r, --recipient <address>", "Recipient address")
    .option("-a, --amount <value>", 'Amount to send (e.g. "0.1", "0.1 eth", "50%"). Required unless --use-all-amount')
    .option("--use-all-amount", "Send the maximum spendable amount")
    .option("--dry-run", "Sign the transaction but do not broadcast it")
    .action(async (
      descriptor: string,
      opts: { recipient: string; amount?: string; useAllAmount?: boolean; dryRun?: boolean; format?: OutputFormat },
    ) => {
      const format: OutputFormat = (program.opts().format as OutputFormat) || "human";

      if (!opts.amount && !opts.useAllAmount) {
        process.stderr.write("Error: either --amount or --use-all-amount is required\n");
        process.exit(1);
      }

      await runCommand(format, async () => {
        const spinner = createSpinner(format);
        spinner.start("Syncing account…");

        const parsed = parseDescriptor(descriptor);
        const shell = buildShellAccount(parsed);
        const account = await syncAccount(shell);
        const bridge = getAccountBridge(account, null);

        spinner.text = "Building transaction…";

        let amount: BigNumber;
        if (opts.useAllAmount) {
          amount = await bridge.estimateMaxSpendable({ account, parentAccount: null, transaction: null });
        } else {
          amount = parseAmount(opts.amount!, account);
        }

        let transaction = bridge.createTransaction(account);
        transaction = bridge.updateTransaction(transaction, {
          recipient: opts.recipient,
          amount,
          useAllAmount: opts.useAllAmount || false,
        });

        // Validate transaction
        const status = await bridge.getTransactionStatus(account, transaction);

        if (Object.keys(status.errors).length > 0) {
          const errorMessages = Object.entries(status.errors)
            .map(([k, v]) => `  ${k}: ${v instanceof Error ? v.message : String(v)}`)
            .join("\n");
          throw new Error(`Transaction validation failed:\n${errorMessages}`);
        }

        const mainUnit = account.currency.units[0];
        const feeStr = formatCurrencyUnit(mainUnit, status.estimatedFees, { showCode: true });
        const totalStr = formatCurrencyUnit(mainUnit, status.totalSpent, { showCode: true });
        const amountStr = formatCurrencyUnit(mainUnit, amount, { showCode: true });

        if (format === "human") {
          spinner.stop();
          outputHeader(formatDescriptorHuman(account));
          outputLine(`  To:       ${opts.recipient}`);
          outputLine(`  Amount:   ${amountStr}`);
          outputLine(`  Fees:     ${feeStr}`);
          outputLine(`  Total:    ${totalStr}`);
          if (opts.dryRun) {
            outputLine(chalk.yellow("  (dry-run: will sign but NOT broadcast)"));
          }
        }

        // Connect device and sign
        const appName = account.currency.managerAppName || account.currency.name;
        spinner.start(`Connecting to device (${appName} app)…`);

        const signedOp = await withDeviceApp(appName, spinner, async () => {
          spinner.text = "Please sign the transaction on your device…";

          return lastValueFrom(
            bridge
              .signOperation({ account, transaction, deviceId: "" })
              .pipe(
                filter((event: any) => event.type === "signed"),
                take(1),
              ),
          ).then((event: any) => event.signedOperation);
        });

        if (opts.dryRun) {
          spinner.succeed("Transaction signed (dry-run)");
          if (format === "json") {
            outputJson({ dryRun: true, signedOperation: signedOp });
          } else {
            outputLine("  Signed operation (not broadcast):");
            outputLine(`  ${JSON.stringify(signedOp).slice(0, 120)}…`);
          }
          return;
        }

        // Broadcast
        spinner.text = "Broadcasting transaction…";
        const operation = await bridge.broadcast({ account, signedOperation: signedOp });
        spinner.succeed("Transaction broadcast");

        if (format === "json") {
          outputJson({
            descriptor: account.id,
            currency: account.currency.id,
            hash: operation.hash,
            amount: amountStr,
            fees: feeStr,
            operation: toOperationRaw(operation),
          });
        } else {
          outputLine(chalk.green(`  ✓ Transaction sent: ${operation.hash}`));
        }
      });
    });
}

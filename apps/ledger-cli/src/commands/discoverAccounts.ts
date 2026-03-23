import type { Command } from "commander";
import type { Account } from "@ledgerhq/types-live";
import { findCryptoCurrencyByKeyword } from "@ledgerhq/live-common/currencies/index";
import { getCurrencyBridge } from "@ledgerhq/live-common/bridge/index";
import { prepareCurrency } from "../bridge";
import { withDeviceApp } from "../dmk";
import { accountToDescriptor, formatDescriptorHuman } from "../descriptor";
import { createSpinner, outputJson, outputLine, outputHeader, runCommand } from "../output";
import type { OutputFormat } from "../output";

export function registerDiscoverAccounts(program: Command) {
  program
    .command("discover-accounts")
    .description("Discover accounts for a currency by scanning your Ledger device")
    .requiredOption("-c, --currency <currency>", "Currency name or ticker (e.g. ethereum, bitcoin, btc)")
    .option("--scheme <scheme>", "Limit to a specific derivation scheme")
    .action(async (opts: { currency: string; scheme?: string; format?: OutputFormat }) => {
      const format: OutputFormat = (program.opts().format as OutputFormat) || "human";

      await runCommand(format, async () => {
        const spinner = createSpinner(format);
        spinner.start(`Resolving currency "${opts.currency}"…`);

        const currency = findCryptoCurrencyByKeyword(opts.currency);
        if (!currency) {
          throw new Error(
            `Currency not found: "${opts.currency}". Try a name or ticker like "ethereum", "bitcoin", "btc".`,
          );
        }
        const appName = currency.managerAppName || currency.name;

        spinner.text = `Preparing ${currency.name} bridge…`;
        await prepareCurrency(currency);

        let foundCount = 0;
        spinner.text = "Waiting for Ledger device (connect via USB)…";

        await withDeviceApp(appName, spinner, async () => {
          spinner.text = `Scanning ${currency.name} accounts…`;

          await new Promise<void>((resolve, reject) => {
            const obs = getCurrencyBridge(currency).scanAccounts({
              currency,
              deviceId: "",
              scheme: opts.scheme as any,
              syncConfig: { paginationConfig: {} },
            });

            const subscription = obs.subscribe({
              next(event: any) {
                if (event.type === "discovered") {
                  const account: Account = event.account;
                  foundCount++;
                  const descriptor = accountToDescriptor(account);

                  if (format === "json") {
                    outputJson({
                      descriptor,
                      currency: currency.id,
                      freshAddress: account.freshAddress,
                      balance: account.balance.toFixed(),
                      index: account.index,
                      derivationMode: account.derivationMode,
                    });
                  } else {
                    if (foundCount === 1) {
                      spinner.stop();
                      outputHeader(`${currency.name} accounts:`);
                    }
                    outputLine(`  ${formatDescriptorHuman(account)}`);
                    outputLine(`    Balance:    ${account.balance.toFixed()} (raw)`);
                    outputLine(`    Descriptor: ${descriptor}`);
                    outputLine("");
                  }
                }
              },
              error: reject,
              complete: resolve,
            });

            // Allow graceful interruption
            process.once("SIGINT", () => {
              subscription.unsubscribe();
              resolve();
            });
          });
        });

        if (foundCount === 0) {
          if (format === "json") {
            outputJson({ currency: currency.id, accounts: [] });
          } else {
            spinner.warn(`No accounts found for ${currency.name}`);
          }
        } else if (format === "human") {
          outputLine(`Found ${foundCount} account(s).`);
        }
      });
    });
}

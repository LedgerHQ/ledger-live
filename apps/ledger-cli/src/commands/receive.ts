import type { Command } from "commander";
import { lastValueFrom } from "rxjs";
import { ignoreElements } from "rxjs/operators";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { parseDescriptor, buildShellAccount, formatDescriptorHuman } from "../descriptor";
import { syncAccount } from "../bridge";
import { withDeviceApp } from "../dmk";
import { createSpinner, outputJson, outputLine, outputHeader, runCommand, chalk } from "../output";
import type { OutputFormat } from "../output";

export function registerReceive(program: Command) {
  program
    .command("receive <descriptor>")
    .description("Display receive address — always verified on device")
    .option("--no-verify", "Skip on-device address verification (not recommended)")
    .action(async (descriptor: string, opts: { verify?: boolean; format?: OutputFormat }) => {
      const format: OutputFormat = (program.opts().format as OutputFormat) || "human";
      const shouldVerify = opts.verify !== false;

      await runCommand(format, async () => {
        const spinner = createSpinner(format);
        spinner.start("Syncing account…");

        const parsed = parseDescriptor(descriptor);
        const shell = buildShellAccount(parsed);
        const account = await syncAccount(shell);

        const address = account.freshAddress;
        const appName = account.currency.managerAppName || account.currency.name;

        // Print address immediately — don't wait for device
        spinner.stop();
        if (format === "json") {
          outputJson({
            descriptor: account.id,
            currency: account.currency.id,
            freshAddress: address,
            freshAddressPath: account.freshAddressPath,
            verified: false, // will be updated below if verification succeeds
          });
        } else {
          outputHeader(formatDescriptorHuman(account));
          outputLine(`  Address: ${chalk.bold.green(address)}`);
        }

        if (!shouldVerify) return;

        // Verify on device
        spinner.start(`Waiting for device to verify address (${appName} app)…`);

        await withDeviceApp(appName, spinner, async () => {
          spinner.text = "Please confirm the address on your device…";
          await lastValueFrom(
            getAccountBridge(account)
              .receive(account, { deviceId: "", verify: true })
              .pipe(ignoreElements()),
          );
        });

        spinner.succeed("Address verified on device");

        if (format === "json") {
          // Re-emit with verified: true
          outputJson({
            descriptor: account.id,
            currency: account.currency.id,
            freshAddress: address,
            freshAddressPath: account.freshAddressPath,
            verified: true,
          });
        } else {
          outputLine(chalk.green("  ✓ Address confirmed on device"));
        }
      });
    });
}

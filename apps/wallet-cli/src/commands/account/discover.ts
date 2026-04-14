import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import { firstValueFrom } from "rxjs";
import { toArray } from "rxjs/operators";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets";
import { WalletAdapter } from "../../wallet";
import { HumanFormatter, JsonFormatter } from "../../wallet/formatter";
import { OutputFormatSchema } from "../../wallet/models";
import { WALLET_CLI_DMK_DEVICE_ID } from "../../device/register-dmk-transport";
import { withCurrencyDeviceSession } from "../../session/bridge-device-session";
import { walletCliDebug } from "../../shared/log";
import { spinner, colors, writeStdout } from "../../shared/ui";
import { makeEnvelope, makeErrorEnvelope } from "../../shared/response";
import { parseNetworkArg, currencyIdFromNetwork } from "../../shared/accountDescriptor";

export default defineCommand({
  name: "discover",
  description: "Discover accounts for a network on the connected device",
  options: {
    network: option(z.string().min(1).optional(), {
      description:
        'Network to scan, e.g. "bitcoin", "ethereum", "ethereum:goerli" (or first positional arg). No env = mainnet.',
      short: "n",
    }),
    output: option(OutputFormatSchema.default("human"), {
      description: "Output format: human (default) or json",
    }),
  },
  handler: async ({ flags, positional }) => {
    const networkArg = flags.network ?? positional[0];
    if (!networkArg) {
      throw new Error(
        'Missing network: use --network <name> or -n <name>, e.g. "bitcoin", "ethereum:goerli".',
      );
    }

    const network = parseNetworkArg(networkArg);
    const currencyId = currencyIdFromNetwork(network);
    const isHuman = flags.output === "human";
    walletCliDebug(
      `account discover: network=${network.name}:${network.env}, output=${flags.output}`,
    );

    const spin = isHuman
      ? spinner(`Connect device and open ${colors.bold(network.name)} app…`)
      : null;

    try {
      await withCurrencyDeviceSession(currencyId, async () => {
        spin?.success("Device session established");

        const wallet = new WalletAdapter();

        if (isHuman) {
          const store = getCryptoAssetsStore();
          const fmt = new HumanFormatter(store);
          const scanSpin = spinner(`Scanning for ${colors.bold(network.name)} accounts…`);
          let count = 0;
          await new Promise<void>((resolve, reject) => {
            wallet.discoverAccounts(network, WALLET_CLI_DMK_DEVICE_ID).subscribe({
              next: d => {
                scanSpin.clear();
                writeStdout(fmt.formatDiscoveredAccount(d));
                count++;
                scanSpin.text = `Scanning… (${count} found so far)`;
              },
              error: err => {
                scanSpin.error("Scan failed");
                reject(err);
              },
              complete: () => {
                scanSpin.success(`Found ${count} account${count === 1 ? "" : "s"}`);
                resolve();
              },
            });
          });
        } else {
          const accounts = await firstValueFrom(
            wallet.discoverAccounts(network, WALLET_CLI_DMK_DEVICE_ID).pipe(toArray()),
          );
          writeStdout(
            JSON.stringify(
              makeEnvelope("account discover", `${network.name}:${network.env}`, {
                accounts: JsonFormatter.discoveredAccounts(accounts),
              }),
              null,
              2,
            ),
          );
        }
      });
    } catch (e) {
      if (isHuman) throw e;
      writeStdout(
        JSON.stringify(
          makeErrorEnvelope(
            "account discover",
            HumanFormatter.formatError(e),
            `${network.name}:${network.env}`,
          ),
          null,
          2,
        ),
      );
      process.exit(1);
    }
  },
});

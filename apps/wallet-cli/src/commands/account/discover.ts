import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import { WalletAdapter } from "../../wallet";
import { WALLET_CLI_DMK_DEVICE_ID } from "../../device/register-dmk-transport";
import { withCurrencyDeviceSession } from "../../session/bridge-device-session";
import { walletCliDebug } from "../../shared/log";
import { colors } from "../../shared/ui";
import { parseNetworkArg, currencyIdFromNetwork } from "../../shared/accountDescriptor";
import { createCommandOutput } from "../../output";
import { outputOption } from "../shared-options";

export default defineCommand({
  name: "discover",
  description: "Discover accounts for a network on the connected device",
  options: {
    network: option(z.string().min(1).optional(), {
      description:
        'Network to scan, e.g. "bitcoin", "ethereum", "ethereum:goerli" (or first positional arg). No env = mainnet.',
      short: "n",
    }),
    output: outputOption,
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
    const networkStr = `${network.name}:${network.env}`;
    walletCliDebug(`account discover: network=${networkStr}, output=${flags.output}`);

    const out = createCommandOutput(flags.output, { command: "account discover", network: networkStr });

    await out.run(async () => {
      const spin = out.spin(`Connect device and open ${colors.bold(network.name)} app…`);
      await withCurrencyDeviceSession(currencyId, async () => {
        spin?.success("Device session established");

        const wallet = new WalletAdapter();
        const scanSpin = out.spin(`Scanning for ${colors.bold(network.name)} accounts…`);
        let count = 0;

        await new Promise<void>((resolve, reject) => {
          wallet.discoverAccounts(network, WALLET_CLI_DMK_DEVICE_ID).subscribe({
            next: d => {
              out.discoveredAccount(d);
              count++;
              if (scanSpin) scanSpin.text = `Scanning… (${count} found so far)`;
            },
            error: err => {
              scanSpin?.error("Scan failed");
              reject(err);
            },
            complete: () => {
              scanSpin?.success(`Found ${count} account${count === 1 ? "" : "s"}`);
              resolve();
            },
          });
        });

        out.flushDiscovery();
      });
    });
  },
});

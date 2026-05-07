import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import { WalletAdapter } from "../../wallet";
import { WALLET_CLI_DMK_DEVICE_ID } from "../../device/register-dmk-transport";
import { WalletCliDeviceError } from "../../device/wallet-cli-device-error";
import {
  getManagerAppNameForCurrencyId,
  withCurrencyDeviceSession,
} from "../../session/bridge-device-session";
import { walletCliDebug } from "../../shared/log";
import { colors } from "../../shared/ui";
import { parseNetworkArg, currencyIdFromNetwork } from "../../shared/accountDescriptor";
import type { AccountDescriptorV1 } from "../../shared/accountDescriptor";
import { createCommandOutput } from "../../output";
import { Session } from "../../session/session-store";
import { runObservable } from "../run-observable";
import { deviceTimeoutOption, outputOption, resolveOutputFormat } from "../inputs";

type DiscoverAccountsParams = {
  wallet: WalletAdapter;
  network: ReturnType<typeof parseNetworkArg>;
  managerAppName: string;
  out: ReturnType<typeof createCommandOutput>;
};

async function discoverAccounts({
  wallet,
  network,
  managerAppName,
  out,
}: DiscoverAccountsParams): Promise<AccountDescriptorV1[]> {
  const scanSpin = out.spin(`Scanning for ${colors.bold(network.name)} accounts…`);
  let count = 0;
  const discoveredDescriptors: AccountDescriptorV1[] = [];

  await runObservable({
    source$: wallet.discoverAccounts(network, WALLET_CLI_DMK_DEVICE_ID),
    onNext: discoveredAccount => {
      out.discoveredAccount(discoveredAccount);
      discoveredDescriptors.push(discoveredAccount.descriptor);
      count++;
      if (scanSpin) scanSpin.text = `Scanning… (${count} found so far)`;
    },
    mapError: err =>
      WalletCliDeviceError.fromUnknown(err, {
        expectedApp: managerAppName,
      }),
  });

  scanSpin?.success(`Found ${count} account${count === 1 ? "" : "s"}`);
  out.flushDiscovery();
  return discoveredDescriptors;
}

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
    "device-timeout": deviceTimeoutOption,
  },
  handler: async ({ flags, positional }) => {
    const output = resolveOutputFormat(flags.output);
    const networkArg = flags.network ?? positional[0];
    if (!networkArg) {
      throw new Error(
        'Missing network: use --network <name> or -n <name>, e.g. "bitcoin", "ethereum:goerli".',
      );
    }

    const network = parseNetworkArg(networkArg);
    const currencyId = currencyIdFromNetwork(network);
    const managerAppName = getManagerAppNameForCurrencyId(currencyId);
    const networkStr = `${network.name}:${network.env}`;
    walletCliDebug(`account discover: network=${networkStr}, output=${output}`);

    const out = createCommandOutput(output, {
      command: "account discover",
      network: networkStr,
    });

    await out.run(async () => {
      out.spin(`Connect device and open ${colors.bold(managerAppName)} app…`);
      await withCurrencyDeviceSession(
        currencyId,
        async () => {
          const wallet = new WalletAdapter();
          const discoveredDescriptors = await discoverAccounts({
            wallet,
            network,
            managerAppName,
            out,
          });

          let added = 0;
          try {
            const session = await Session.read();
            added = session.addDescriptors(discoveredDescriptors);
            if (added > 0) session.write();
          } catch {
            // Session persistence failure is non-fatal; discovery output is already flushed.
          }

          if (added > 0) out.sessionSaved(added);
        },
        {
          deviceTimeoutMs: flags["device-timeout"],
          onStateChange: state => out.deviceState(state),
        },
      );
    });
  },
});

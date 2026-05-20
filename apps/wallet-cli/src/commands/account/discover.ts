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
import { createCommandOutput } from "../../output";
import { Session } from "../../session/session-store";
import { runObservable } from "../run-observable";
import { deviceTimeoutOption, outputOption, resolveOutputFormat } from "../inputs";

type DiscoverAccountsParams = {
  wallet: WalletAdapter;
  network: ReturnType<typeof parseNetworkArg>;
  managerAppName: string;
  session: Session;
  out: ReturnType<typeof createCommandOutput>;
};

async function discoverAccounts({
  wallet,
  network,
  managerAppName,
  session,
  out,
}: DiscoverAccountsParams): Promise<number> {
  const scanSpin = out.spin(`Scanning for ${colors.bold(network.name)} accounts…`);
  let count = 0;
  let added = 0;

  await runObservable({
    source$: wallet.discoverAccounts(network, WALLET_CLI_DMK_DEVICE_ID),
    onNext: raw => {
      const { label, added: wasAdded } = session.addDescriptor(raw.descriptor);
      if (wasAdded) added++;
      out.discoveredAccount({ ...raw, label });
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
  return added;
}

export default defineCommand({
  name: "discover",
  description:
    "Discover accounts for a network on the connected device (saves each to the session as --account <label>, e.g. ethereum-1).",
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
          // Surface read failures (e.g. corrupted session.yaml) before discovery so we never
          // overwrite a recoverable file with a fresh one. Session.read() returns an empty
          // session on ENOENT, so this only throws on parse/IO errors that need user action.
          const session = await Session.read();
          const added = await discoverAccounts({
            wallet,
            network,
            managerAppName,
            session,
            out,
          });

          if (added > 0) {
            try {
              session.write();
              out.sessionSaved(added);
            } catch {
              // Session persistence failure is non-fatal; discovery output is already flushed.
            }
          }
        },
        {
          deviceTimeoutMs: flags["device-timeout"],
          onStateChange: state => out.deviceState(state),
        },
      );
    });
  },
});

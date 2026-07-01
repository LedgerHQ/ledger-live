import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import { WalletAdapter } from "../../wallet";
import {
  WALLET_CLI_DMK_DEVICE_ID,
  getWalletCliDeviceModelId,
} from "../../device/register-dmk-transport";
import { WalletCliDeviceError } from "../../device/wallet-cli-device-error";
import {
  getManagerAppNameForCurrencyId,
  withCurrencyDeviceSession,
} from "../../session/bridge-device-session";
import { walletCliDebug } from "../../shared/log";
import { colors } from "../../shared/ui";
import { parseNetworkArg, currencyIdFromNetwork } from "../../shared/accountDescriptor";
import { type CommandOutput, type OutputContext, createCommandOutput } from "../../output";
import { Session } from "../../session/session-store";
import { runObservable } from "../run-observable";
import { deviceTimeoutOption, outputOption, resolveOutputFormat } from "../inputs";
import { trackDiscoveryStarted, trackDiscoveryCompleted } from "../accounts-analytics";

type DiscoverAccountsParams = {
  wallet: WalletAdapter;
  network: ReturnType<typeof parseNetworkArg>;
  managerAppName: string;
  session: Session;
  out: CommandOutput;
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

  const networks = [`${network.name}:${network.env}`];
  const device = await getWalletCliDeviceModelId();
  trackDiscoveryStarted({ networks, device });

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
  trackDiscoveryCompleted({ networks, accountsCount: count, device });
  return added;
}

export const accountDiscoverInputSchema = z.object({
  network: z.string().min(1, "Network is required"),
  "device-timeout": z.coerce.number().int().positive().default(60_000),
});

export type AccountDiscoverInput = z.infer<typeof accountDiscoverInputSchema>;

export function accountDiscoverContext(_input: AccountDiscoverInput): OutputContext {
  return { command: "account discover", network: "" };
}

export async function accountDiscoverCore(
  input: AccountDiscoverInput,
  out: CommandOutput,
): Promise<void> {
  await out.run(async () => {
    if (!input.network) {
      throw new Error(
        'Missing network: use --network <name> or -n <name>, e.g. "bitcoin", "ethereum:goerli".',
      );
    }

    const network = parseNetworkArg(input.network);
    const currencyId = currencyIdFromNetwork(network);
    const managerAppName = getManagerAppNameForCurrencyId(currencyId);
    const networkStr = `${network.name}:${network.env}`;
    out.setContext({ network: networkStr });
    walletCliDebug(`account discover: network=${networkStr}`);

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
        deviceTimeoutMs: input["device-timeout"],
        onStateChange: state => out.deviceState(state),
      },
    );
  });
}

export default defineCommand({
  name: "discover",
  description:
    "Discover accounts for a network on the connected device (saves each to the session as --account <label>, e.g. ethereum-1).",
  options: {
    // The schema field is required (so MCP advertises it and rejects a missing arg), but on the
    // CLI `network` is an optional flag with a first-positional fallback — so the flag itself
    // stays optional here rather than reusing the required schema shape.
    network: option(z.string().min(1).optional(), {
      description:
        'Network to scan, e.g. "bitcoin", "ethereum", "ethereum:goerli" (or first positional arg). No env = mainnet.',
      short: "n",
    }),
    output: outputOption,
    "device-timeout": deviceTimeoutOption,
  },
  handler: async ({ flags, positional }) => {
    const input: AccountDiscoverInput = {
      // Required in-schema (so MCP rejects a missing arg); "" fallback routes an absent CLI
      // flag/positional to the core's friendly "Missing network" guard. See balances.ts.
      network: flags.network ?? positional[0] ?? "",
      "device-timeout": flags["device-timeout"],
    };
    const out = createCommandOutput(
      resolveOutputFormat(flags.output),
      accountDiscoverContext(input),
    );
    await accountDiscoverCore(input, out);
  },
});

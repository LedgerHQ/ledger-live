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
import { colors, writeStderr } from "../../shared/ui";
import { parseNetworkArg, currencyIdFromNetwork } from "../../shared/accountDescriptor";
import { createCommandOutput } from "../../output";
import { Session, withSessionLock } from "../../session/session-store";
import type { AccountDescriptorV1 } from "../../shared/accountDescriptor";
import { runObservable } from "../run-observable";
import { deviceTimeoutOption, outputOption, resolveOutputFormat } from "../inputs";
import { trackDiscoveryStarted, trackDiscoveryCompleted } from "../accounts-analytics";

type DiscoverAccountsParams = {
  wallet: WalletAdapter;
  network: ReturnType<typeof parseNetworkArg>;
  managerAppName: string;
  session: Session;
  out: ReturnType<typeof createCommandOutput>;
};

/**
 * Runs the device scan and returns the newly-discovered descriptors — it does NOT persist them.
 * `session` is used only to preview labels live as accounts stream in (existing-label collision
 * avoidance needs to know what's already there); the authoritative merge+write happens afterwards,
 * under the session lock, against a freshly re-read session (see the handler below) — the device
 * scan can take a while, and something else may have written in the meantime, so a label previewed
 * here is not guaranteed to be the one that actually gets saved. The caller is responsible for
 * calling `out.reconcileDiscoveredLabels(...)` and `out.flushDiscovery()` once the authoritative
 * labels are known — this function only streams the provisional ones.
 */
async function discoverAccounts({
  wallet,
  network,
  managerAppName,
  session,
  out,
}: DiscoverAccountsParams): Promise<AccountDescriptorV1[]> {
  const scanSpin = out.spin(`Scanning for ${colors.bold(network.name)} accounts…`);
  let count = 0;
  const discovered: AccountDescriptorV1[] = [];

  const networks = [`${network.name}:${network.env}`];
  const device = await getWalletCliDeviceModelId();
  trackDiscoveryStarted({ networks, device });

  await runObservable({
    source$: wallet.discoverAccounts(network, WALLET_CLI_DMK_DEVICE_ID),
    onNext: raw => {
      // Every scanned descriptor goes into `discovered`, not just ones new to this preview session:
      // `addDescriptors` (plural) at the authoritative merge is itself idempotent, and gating on
      // this session's `wasAdded` would silently drop an account that's rediscovered here but was
      // meanwhile removed elsewhere (e.g. a concurrent `session reset`) — it just printed with a
      // label, so it must not vanish from what gets persisted.
      const { label } = session.addDescriptor(raw.descriptor);
      discovered.push(raw.descriptor);
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
  trackDiscoveryCompleted({ networks, accountsCount: count, device });
  return discovered;
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
          const discovered = await discoverAccounts({
            wallet,
            network,
            managerAppName,
            session,
            out,
          });

          if (discovered.length > 0) {
            try {
              // Re-read under lock rather than reusing `session`: the scan just spent a while
              // talking to the device, and another command could have written in that window.
              // Merging the discovered descriptors into a fresh read (not `session`, which is now
              // stale) is what makes this safe against that.
              const results = await withSessionLock(async () => {
                const fresh = await Session.read();
                const r = fresh.addDescriptors(discovered);
                fresh.write();
                return r;
              });
              // The labels streamed live above were previewed against the pre-scan `session` and can
              // differ from what actually got saved if something else wrote in the meantime — patch/
              // announce the authoritative ones before the discovery output is flushed.
              out.reconcileDiscoveredLabels(results.map(r => r.label));
              out.flushDiscovery();
              out.sessionSaved(results.filter(r => r.added).length);
            } catch (e) {
              // Non-fatal but must not be silent: this can now also be the lock's own 10s acquire
              // timeout (e.g. enroll or ring init holding it across a keychain/OS prompt), not just a
              // disk error — either way, the user just spent time on the device and needs to know
              // nothing was actually saved. The labels already streamed are the best we have, so flush
              // them as-is (unreconciled) rather than silently dropping the discovery output too.
              out.flushDiscovery();
              const message = e instanceof Error ? e.message : String(e);
              writeStderr(`⚠ Found accounts were NOT saved to the session: ${message}\n`);
            }
          } else {
            out.flushDiscovery();
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

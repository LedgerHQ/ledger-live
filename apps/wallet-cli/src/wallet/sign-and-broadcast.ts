/**
 * Shared "prepare / sign + broadcast a transaction intent" helpers.
 *
 * The `send` command and the earn pipelines (eth-vault-pipeline.ts, sol-stake.ts) all run the same
 * device-session + signOperation + broadcast block. These two helpers centralize it:
 *   - prepareIntentDryRun: sync + build + validate only, no device (dry-run); returns the prepared tx.
 *   - signAndBroadcastIntent: open the device session, sign, broadcast, stream progress to `out`,
 *     and return the broadcast hash.
 *
 * The caller owns how the result is rendered/shaped (e.g. earn wraps it into an EarnTransaction).
 * In particular, NEITHER helper emits a final result envelope: the caller is responsible for that so
 * each command emits exactly one terminal envelope.
 *   - signAndBroadcastIntent streams per-event progress via `out.sendEvent(...)`; the caller then
 *     emits the terminal envelope (`send` -> `out.sendComplete()`, earn -> `out.earnDepositResult()` /
 *     `out.earnWithdrawResult()`).
 *   - prepareIntentDryRun only prepares/validates and returns the tx; the caller emits the terminal
 *     envelope (`send` -> `out.sendDryRun(prepared)`, earn -> `out.earnDepositResult()` /
 *     `out.earnWithdrawResult()`).
 * This is why earn flows can call either helper multiple times (e.g. EVM approve + deposit) without
 * leaking an intermediate envelope into the JSON stream.
 */

import { getWalletCliDeviceModelId } from "../device/register-dmk-transport";
import { WalletCliDeviceError } from "../device/wallet-cli-device-error";
import type { ApplicationDependency } from "@ledgerhq/device-management-kit";
import { withCurrencyDeviceSession } from "../session/bridge-device-session";
import { runObservable } from "../commands/run-observable";
import { colors } from "../shared/ui";
import type { CommandOutput } from "../output";
import type { WalletAdapter } from "./index";
import type { AccountDescriptor } from "./models";
import type { TransactionIntent } from "./intents";

/**
 * A prepared (synced + built + validated) transaction, as returned by the dry-run entrypoint.
 * Intent-agnostic: shared by `send` and the earn pipelines, so it is not named after `send`.
 */
export type PreparedTransaction = Awaited<ReturnType<WalletAdapter["prepareSend"]>>;

/** live-common DeviceModelId resolved from the active DMK session, if any. */
type ResolvedDeviceModelId = Awaited<ReturnType<typeof getWalletCliDeviceModelId>>;

/**
 * Prepare and validate an intent without signing (dry-run). Opens no device session and returns the
 * prepared transaction. Does NOT emit a terminal envelope — the caller owns that (`send` ->
 * `out.sendDryRun(prepared)`, earn -> its own deposit/withdraw result), so each command emits exactly
 * one terminal envelope.
 */
export async function prepareIntentDryRun(params: {
  wallet: WalletAdapter;
  descriptor: AccountDescriptor;
  intent: TransactionIntent;
  out: CommandOutput;
}): Promise<PreparedTransaction> {
  const { wallet, descriptor, intent, out } = params;
  const spin = out.spin("Preparing transaction (dry run)…");
  const prepared = await wallet.prepareSend(descriptor, intent);
  spin?.success("Dry run complete (transaction not broadcasted)");
  return prepared;
}

/**
 * Open the device session, sign, and broadcast an intent, streaming progress to `out`.
 * Returns the broadcast hash (when the bridge emits a `broadcasted` event).
 */
export async function signAndBroadcastIntent(params: {
  wallet: WalletAdapter;
  descriptor: AccountDescriptor;
  intent: TransactionIntent;
  deviceId: string;
  managerAppName: string;
  deviceTimeoutMs?: number;
  /**
   * Extra apps ConnectApp must ensure are installed alongside the currency's app — clear-signing
   * plugins the main app calls into (e.g. `[{ name: "Kiln" }]` for EVM earn vaults). Defaults to
   * none, so send/solana open the currency app with no dependencies.
   */
  dependencies?: ApplicationDependency[];
  out: CommandOutput;
}): Promise<{ txHash?: string; deviceModelId?: ResolvedDeviceModelId }> {
  const {
    wallet,
    descriptor,
    intent,
    deviceId,
    managerAppName,
    deviceTimeoutMs,
    dependencies,
    out,
  } = params;

  let txHash: string | undefined;
  let resolvedDeviceModelId: ResolvedDeviceModelId | undefined;
  out.spin(`Connect device and open ${colors.bold(managerAppName)} app…`);
  await withCurrencyDeviceSession(
    descriptor.currencyId,
    async () => {
      out.spin(`Preparing ${colors.bold(managerAppName)} transaction…`);

      const deviceModelId = await getWalletCliDeviceModelId();
      if (deviceModelId === undefined) {
        throw new Error(
          "Could not determine device model from the active session. Disconnect and reconnect the device.",
        );
      }
      resolvedDeviceModelId = deviceModelId;

      await runObservable({
        source$: wallet.send(descriptor, intent, { deviceId, deviceModelId }),
        onNext: event => {
          if (event.type === "broadcasted") txHash = event.txHash;
          out.sendEvent(event);
        },
        mapError: error =>
          WalletCliDeviceError.fromKnownDeviceError(error, {
            expectedApp: managerAppName,
            rejectedContext: "sign",
            deviceModelId,
          }) ?? error,
      });
    },
    {
      deviceTimeoutMs,
      dependencies,
      onStateChange: state => out.deviceState(state),
    },
  );

  return { txHash, deviceModelId: resolvedDeviceModelId };
}

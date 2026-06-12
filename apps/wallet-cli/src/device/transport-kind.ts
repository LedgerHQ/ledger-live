import { WalletCliError } from "../shared/wallet-cli-error";

/** Which DMK transport the CLI drives the device over. */
export type WalletCliTransportKind = "usb" | "ble";

let bleInitialized = false;

/**
 * Record that the BLE transport (noble) was initialized in this process. noble
 * keeps a native libuv handle that never unrefs, so once it loads the process
 * cannot drain on its own and must exit explicitly — even when the active
 * transport is USB (e.g. the `devices` command scans BLE too).
 */
export function markBleInitialized(): void {
  bleInitialized = true;
}

/** Whether the BLE transport was initialized in this process. */
export function wasBleInitialized(): boolean {
  return bleInitialized;
}

/**
 * The transport explicitly forced via `WALLET_CLI_TRANSPORT`, or null when unset
 * (the CLI then infers the transport from the chosen device). Throws a usage
 * error (`invalid_transport`, exit 64) on an invalid value so a typo never
 * silently falls back — and never collides with the device-rejected exit code 2.
 */
export function explicitTransportKind(): WalletCliTransportKind | null {
  const raw = process.env.WALLET_CLI_TRANSPORT?.trim().toLowerCase();
  if (!raw) {
    return null;
  }
  if (raw === "usb" || raw === "ble") {
    return raw;
  }
  throw new WalletCliError(
    "invalid_transport",
    `Invalid WALLET_CLI_TRANSPORT "${process.env.WALLET_CLI_TRANSPORT}". Expected "usb" or "ble".`,
  );
}

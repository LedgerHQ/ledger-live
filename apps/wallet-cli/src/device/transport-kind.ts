/** Which DMK transport the CLI drives the device over. */
export type WalletCliTransportKind = "usb" | "ble";

/**
 * Resolve the transport from `WALLET_CLI_TRANSPORT` (default: usb).
 * Throws on anything else so a typo never silently falls back to USB.
 */
export function resolveWalletCliTransportKind(): WalletCliTransportKind {
  const raw = (process.env.WALLET_CLI_TRANSPORT ?? "usb").trim().toLowerCase();
  if (raw === "usb" || raw === "ble") {
    return raw;
  }
  throw new Error(
    `Invalid WALLET_CLI_TRANSPORT "${process.env.WALLET_CLI_TRANSPORT}". Expected "usb" or "ble".`,
  );
}

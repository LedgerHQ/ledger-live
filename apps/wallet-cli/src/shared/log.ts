import createDebug from "debug";

/**
 * Debug output when DEBUG matches `wallet-cli` or `wallet-cli:*` (see `debug` package).
 * Example: `DEBUG=wallet-cli pnpm --filter @ledgerhq/wallet-cli start …`
 */
const log = createDebug("wallet-cli");

export function walletCliDebug(message: string, ...args: unknown[]): void {
  log(message, ...args);
}

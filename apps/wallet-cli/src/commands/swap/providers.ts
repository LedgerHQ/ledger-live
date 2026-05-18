/** Providers passed to the swap quote/status/execute API from wallet-cli (allow-list). */
export const WALLET_CLI_DEFAULT_SWAP_PROVIDERS = [
  "changelly_v2",
  "changelly",
  "cic_v2",
  "cic",
  "exodus",
  "nearintents",
  "swapsxyz",
] as const;

const allowedSwapProviderInput = new Set<string>(WALLET_CLI_DEFAULT_SWAP_PROVIDERS);

/**
 * Validates swap `--provider` against the wallet-cli provider allow-list and maps legacy
 * `changelly` to `changelly_v2` for the exchange API.
 */
export function resolveSwapProvider(provider: string): string {
  if (!allowedSwapProviderInput.has(provider)) {
    throw new Error(
      `Unsupported swap provider "${provider}". Allowed: ${WALLET_CLI_DEFAULT_SWAP_PROVIDERS.join(", ")}.`,
    );
  }
  return provider === "changelly" ? "changelly_v2" : provider;
}

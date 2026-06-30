/** Providers passed to the swap quote/status/execute API from wallet-cli (allow-list). */
export const WALLET_CLI_DEFAULT_SWAP_PROVIDERS = [
  "1inch",
  "changelly",
  "changelly_v2",
  "cic",
  "cic_v2",
  "exodus",
  "lifi",
  "nearintents",
  "okx",
  "oneinch",
  "swapsxyz",
  "uniswap",
  "velora",
] as const;

const allowedSwapProviderInput = new Set<string>(WALLET_CLI_DEFAULT_SWAP_PROVIDERS);

const PROVIDER_ALIAS: Record<string, string> = {
  changelly: "changelly_v2",
  "1inch": "oneinch",
};

/**
 * Validates swap `--provider` against the wallet-cli provider allow-list and maps legacy
 * `changelly` to `changelly_v2` for the exchange API.
 * `1inch` to `oneinch` for the exchange API.
 */
export function resolveSwapProvider(provider: string): string {
  if (!allowedSwapProviderInput.has(provider)) {
    throw new Error(
      `Unsupported swap provider "${provider}". Allowed: ${WALLET_CLI_DEFAULT_SWAP_PROVIDERS.join(", ")}.`,
    );
  }
  return PROVIDER_ALIAS[provider] ?? provider;
}

const DIE_EXECUTION_PROVIDERS = new Set<string>(["uniswap", "oneinch", "velora", "okx"]);

export function isDieExecutionProvider(resolvedProvider: string): boolean {
  return DIE_EXECUTION_PROVIDERS.has(resolvedProvider);
}

/** Providers passed to the swap quote/status/execute API from wallet-cli (allow-list). */
export const WALLET_CLI_DEFAULT_SWAP_PROVIDERS = [
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

const PROVIDER_ALIAS: Record<string, string> = {
  changelly: "changelly_v2",
  "1inch": "oneinch",
};

const ALLOWED_SWAP_PROVIDER_INPUT = [
  ...new Set<string>([...WALLET_CLI_DEFAULT_SWAP_PROVIDERS, ...Object.keys(PROVIDER_ALIAS)]),
];

const allowedSwapProviderInput = new Set<string>(ALLOWED_SWAP_PROVIDER_INPUT);

/**
 * Validates swap `--provider` against the wallet-cli provider allow-list and maps legacy
 * `changelly` to `changelly_v2` for the exchange API.
 * `1inch` to `oneinch` for the exchange API.
 */
export function resolveSwapProvider(provider: string): string {
  if (!allowedSwapProviderInput.has(provider)) {
    throw new Error(
      `Unsupported swap provider "${provider}". Allowed: ${ALLOWED_SWAP_PROVIDER_INPUT.join(", ")}.`,
    );
  }
  return PROVIDER_ALIAS[provider] ?? provider;
}

const DIE_EXECUTION_PROVIDERS = new Set<string>(["uniswap", "oneinch", "velora", "okx"]);

export function isDieExecutionProvider(resolvedProvider: string): boolean {
  return DIE_EXECUTION_PROVIDERS.has(resolvedProvider);
}

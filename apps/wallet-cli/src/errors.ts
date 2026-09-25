function matchingProvidersHint(matchingProviders: string[]): string {
  const [onlyMatch, ...otherMatches] = matchingProviders;
  if (onlyMatch === undefined) return "";
  if (otherMatches.length === 0) {
    return ` This swap belongs to provider "${onlyMatch}"; re-run with --provider ${onlyMatch}.`;
  }
  const quoted = matchingProviders.map(p => `"${p}"`).join(", ");
  return ` Providers that know this swap id: ${quoted}; re-run with the one used by swap execute.`;
}

export class SwapNotFoundForProviderError extends Error {
  override name = "SwapNotFoundForProviderError";

  constructor(swapId: string, provider: string, matchingProviders: string[]) {
    super(
      `Swap "${swapId}" was not found for provider "${provider}". Check that --provider matches the provider used by swap execute.${matchingProvidersHint(matchingProviders)}`,
    );
  }
}

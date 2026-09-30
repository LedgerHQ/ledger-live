function matchingProvidersHint(matchingProviders: string[]): string {
  const [onlyMatch, ...otherMatches] = matchingProviders;
  if (onlyMatch === undefined) return "";
  if (otherMatches.length === 0) {
    return ` This swap belongs to provider "${onlyMatch}"; re-run with --provider ${onlyMatch}.`;
  }
  const quoted = matchingProviders.map(p => `"${p}"`).join(", ");
  return ` Multiple providers report a status for this swap id: ${quoted}. Check which provider was used to create your swap, then re-run with that --provider.`;
}

export class SwapNotFoundForProviderError extends Error {
  override name = "SwapNotFoundForProviderError";

  constructor(swapId: string, provider: string, matchingProviders: string[]) {
    super(
      `Swap "${swapId}" was not found for provider "${provider}". Check that --provider matches the provider used by swap execute.${matchingProvidersHint(matchingProviders)}`,
    );
  }
}

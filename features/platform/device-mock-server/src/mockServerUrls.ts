// No regex: https://github.com/LedgerHQ/ledger-live/security/code-scanning/358
export const stripTrailingSlashes = (value: string): string => {
  let end = value.length;
  while (end > 0 && value[end - 1] === "/") end--;
  return value.slice(0, end);
};

export const getMockServerSecureChannelUrl = (
  mockServerUrl: string,
  sessionToken?: string,
): string | undefined => {
  if (!sessionToken) return undefined;
  const wsBase = stripTrailingSlashes(mockServerUrl)
    .replace(/^https:/, "wss:")
    .replace(/^http:/, "ws:");
  return `${wsBase}/secure-channel/${sessionToken}`;
};

export const getMockServerConfigurationUiUrl = (
  mockServerUrl: string,
  sessionToken: string,
): string => `${stripTrailingSlashes(mockServerUrl)}/#token=${encodeURIComponent(sessionToken)}`;

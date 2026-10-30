export const DEFAULT_MOCK_SERVER_TRANSPORT_URL =
  "https://device-mock-server.aws.ldg-ps-default.ldg-tech.com";

// Scanned rather than matched with /\/+$/, whose backtracking CodeQL flags as
// polynomial on attacker-influenced input.
// See: https://github.com/LedgerHQ/ledger-live/security/code-scanning/358
export const stripTrailingSlashes = (value: string): string => {
  let end = value.length;
  while (end > 0 && value[end - 1] === "/") end--;
  return value.slice(0, end);
};

/**
 * The mock server's secure-channel (ScriptRunner) WebSocket base URL. The session token is carried
 * in the path because the secure-channel WebSocket has no bearer header. Used both as the DMK
 * `webSocketUrl` and as the `BASE_SOCKET_URL` of the legacy flows, so both reach the mock server.
 */
export const getMockScriptRunnerBaseUrl = (
  mockServerUrl: string,
  sessionToken?: string,
): string | undefined => {
  if (!sessionToken) return undefined;
  const wsBase = stripTrailingSlashes(mockServerUrl)
    .replace(/^https:/, "wss:")
    .replace(/^http:/, "ws:");
  return `${wsBase}/secure-channel/${sessionToken}`;
};

/**
 * The mock server's own UI, served from its root, takes over a session handed to it as
 * `#token=…`. A fragment never reaches the server, so the token stays out of its logs.
 */
export const getMockServerFrontendUrl = (mockServerUrl: string, sessionToken: string): string =>
  `${stripTrailingSlashes(mockServerUrl)}/#token=${encodeURIComponent(sessionToken)}`;

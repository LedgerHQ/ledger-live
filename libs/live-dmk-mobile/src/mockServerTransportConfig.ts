const stripTrailingSlashes = (value: string): string => {
  let end = value.length;
  while (end > 0 && value[end - 1] === "/") end--;
  return value.slice(0, end);
};

export const DEFAULT_MOCK_SERVER_TRANSPORT_URL =
  "https://device-mock-server.aws.ldg-ps-default.ldg-tech.com";

type MockServerTransportConfig = {
  url: string;
  token: string;
};

let mockServerTransport: MockServerTransportConfig | undefined;

export const configureMockServerTransport = (config: MockServerTransportConfig): void => {
  mockServerTransport = {
    url: stripTrailingSlashes(config.url),
    token: config.token,
  };
};

export const isMockServerTransportEnabled = (): boolean => mockServerTransport !== undefined;

export const resetMockServerTransport = (): void => {
  mockServerTransport = undefined;
};

export const getConfiguredMockServerTransport = (): MockServerTransportConfig | undefined =>
  mockServerTransport;

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

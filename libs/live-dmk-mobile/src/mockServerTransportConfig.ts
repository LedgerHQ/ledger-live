import { stripTrailingSlashes } from "@ledgerhq/live-dmk-shared";

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

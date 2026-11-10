import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";

const realAgentIntentSdk = { ...(await import("@ledgerhq/agent-intent-sdk")) };
let webSocketFactory: ((url: string) => unknown) | undefined;

mock.module("@ledgerhq/agent-intent-sdk", () => ({
  ...realAgentIntentSdk,
  createAgentEnrollmentChannelHost: ({
    webSocketFactory: factory,
  }: {
    webSocketFactory?: (url: string) => unknown;
  }) => {
    webSocketFactory = factory;
    return {};
  },
}));

const { createRelayHost, relayProxyFromEnv } = await import("./relay");

const RELAY_URL = "wss://trustchain.api.live.ledger.com/v1/qr?host=test-host-public-key";
const PROXY_URL = "http://proxy.example:8080";
const PROXY_ENVIRONMENT_KEYS = ["HTTPS_PROXY", "https_proxy", "HTTP_PROXY", "http_proxy"] as const;
const originalWebSocket = globalThis.WebSocket;
let originalProxyEnvironment: Record<(typeof PROXY_ENVIRONMENT_KEYS)[number], string | undefined>;

describe("relayProxyFromEnv", () => {
  it.each([
    [
      "uses HTTPS_PROXY before other proxy variables",
      {
        HTTPS_PROXY: "http://https-proxy.example.com:8080",
        https_proxy: "http://lowercase-https-proxy.example.com:8080",
        HTTP_PROXY: "http://http-proxy.example.com:8080",
        http_proxy: "http://lowercase-http-proxy.example.com:8080",
      },
      "http://https-proxy.example.com:8080",
    ],
    [
      "uses lowercase HTTPS proxy when HTTPS_PROXY is absent",
      { https_proxy: "http://lowercase-https-proxy.example.com:8080" },
      "http://lowercase-https-proxy.example.com:8080",
    ],
    [
      "uses HTTP_PROXY when HTTPS proxy variables are absent",
      { HTTP_PROXY: "http://http-proxy.example.com:8080" },
      "http://http-proxy.example.com:8080",
    ],
    [
      "uses HTTP_PROXY when HTTPS_PROXY is empty",
      { HTTPS_PROXY: "", HTTP_PROXY: PROXY_URL },
      PROXY_URL,
    ],
    [
      "uses lowercase HTTP proxy when no uppercase proxy variables are present",
      { http_proxy: "http://lowercase-http-proxy.example.com:8080" },
      "http://lowercase-http-proxy.example.com:8080",
    ],
    [
      "does not use an unsupported proxy variable",
      { ALL_PROXY: "socks5://proxy.example.com" },
      undefined,
    ],
  ])("%s", (_name, environment, expected) => {
    expect(relayProxyFromEnv(environment)).toBe(expected);
  });
});

describe("createRelayHost WebSocket factory", () => {
  beforeEach(() => {
    webSocketFactory = undefined;
    originalProxyEnvironment = Object.fromEntries(
      PROXY_ENVIRONMENT_KEYS.map(key => [key, process.env[key]]),
    ) as typeof originalProxyEnvironment;
    for (const key of PROXY_ENVIRONMENT_KEYS) delete process.env[key];
  });

  afterEach(() => {
    for (const key of PROXY_ENVIRONMENT_KEYS) {
      const value = originalProxyEnvironment[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    globalThis.WebSocket = originalWebSocket;
  });

  it("should pass the relay URL and configured proxy to WebSocket", () => {
    const calls: unknown[][] = [];
    globalThis.WebSocket = function (...args: unknown[]) {
      calls.push(args);
    } as unknown as typeof WebSocket;
    process.env.HTTPS_PROXY = PROXY_URL;

    createRelayHost("production", 60_000);
    expect(webSocketFactory).toBeDefined();
    webSocketFactory!(RELAY_URL);

    expect(calls).toEqual([[RELAY_URL, { proxy: PROXY_URL }]]);
  });

  it("should pass the relay URL without proxy options when no proxy is configured", () => {
    const calls: unknown[][] = [];
    globalThis.WebSocket = function (...args: unknown[]) {
      calls.push(args);
    } as unknown as typeof WebSocket;

    createRelayHost("production", 60_000);
    expect(webSocketFactory).toBeDefined();
    webSocketFactory!(RELAY_URL);

    expect(calls).toEqual([[RELAY_URL]]);
  });
});

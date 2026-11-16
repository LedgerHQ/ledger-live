import {
  createAgentEnrollmentRequest,
  createSoftwareAgentIdentity,
  type AgentEnrollmentChannelBinding,
  type AgentEnrollmentRequestV2,
  type EnrollmentChannelWebSocket,
} from "@ledgerhq/agent-intent-sdk";
import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { createRelayHost, relayProxyFromEnv } from "./relay";

const PROXY_URL = "http://proxy.example:8080";
const PROXY_ENVIRONMENT_KEYS = ["HTTPS_PROXY", "https_proxy", "HTTP_PROXY", "http_proxy"] as const;
const originalWebSocket = globalThis.WebSocket;
let originalProxyEnvironment: Record<(typeof PROXY_ENVIRONMENT_KEYS)[number], string | undefined>;

function relayRequest(channel: AgentEnrollmentChannelBinding): AgentEnrollmentRequestV2 {
  return createAgentEnrollmentRequest(createSoftwareAgentIdentity(), {
    name: "Relay test",
    description: "Tests relay WebSocket configuration",
    source: "other",
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    channel,
  }) as AgentEnrollmentRequestV2;
}

function openRelay(host: ReturnType<typeof createRelayHost>): void {
  void host
    .waitForCompletion({
      request: relayRequest(host.binding),
      authenticate: async () => undefined,
      persist: async () => undefined,
    })
    .catch(() => undefined);
}

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
      return {
        addEventListener: () => undefined,
        close: () => undefined,
        send: () => undefined,
      } satisfies EnrollmentChannelWebSocket;
    } as unknown as typeof WebSocket;
    process.env.HTTPS_PROXY = PROXY_URL;

    const host = createRelayHost("production", 60_000);
    openRelay(host);

    expect(calls).toHaveLength(1);
    expect(calls[0]?.[0]).toMatch(/^wss:\/\/trustchain\.api\.live\.ledger\.com\/v1\/qr\?host=/);
    expect(calls[0]?.[1]).toEqual({ proxy: PROXY_URL });
    host.close();
  });

  it("should pass the relay URL without proxy options when no proxy is configured", () => {
    const calls: unknown[][] = [];
    globalThis.WebSocket = function (...args: unknown[]) {
      calls.push(args);
      return {
        addEventListener: () => undefined,
        close: () => undefined,
        send: () => undefined,
      } satisfies EnrollmentChannelWebSocket;
    } as unknown as typeof WebSocket;

    const host = createRelayHost("production", 60_000);
    openRelay(host);

    expect(calls).toHaveLength(1);
    expect(calls[0]?.[0]).toMatch(/^wss:\/\/trustchain\.api\.live\.ledger\.com\/v1\/qr\?host=/);
    expect(calls[0]).toHaveLength(1);
    host.close();
  });
});

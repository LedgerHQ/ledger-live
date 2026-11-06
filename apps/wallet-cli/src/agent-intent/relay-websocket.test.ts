import { describe, expect, it } from "bun:test";
import type WebSocket from "ws";
import { createRelayWebSocketFactory, resolveRelayProxy } from "./relay-websocket";

describe("resolveRelayProxy", () => {
  it("uses HTTPS_PROXY for a secure relay", () => {
    expect(
      resolveRelayProxy("wss://relay.example.com/v1/qr", {
        HTTPS_PROXY: "http://proxy.example.com:8080",
        HTTP_PROXY: "http://fallback.example.com:8080",
      }),
    ).toBe("http://proxy.example.com:8080");
  });

  it("falls back to HTTP_PROXY when HTTPS_PROXY is absent", () => {
    expect(
      resolveRelayProxy("wss://relay.example.com/v1/qr", {
        HTTP_PROXY: "http://proxy.example.com:8080",
      }),
    ).toBe("http://proxy.example.com:8080");
  });

  it.each([["relay.example.com"], [".example.com"], ["relay.example.com:443"], ["*"]])(
    "does not proxy a secure relay matched by NO_PROXY=%s",
    noProxy => {
      expect(
        resolveRelayProxy("wss://relay.example.com/v1/qr", {
          HTTPS_PROXY: "http://proxy.example.com:8080",
          NO_PROXY: noProxy,
        }),
      ).toBeUndefined();
    },
  );

  it("does not treat a NO_PROXY port for another port as a match", () => {
    expect(
      resolveRelayProxy("wss://relay.example.com/v1/qr", {
        HTTPS_PROXY: "http://proxy.example.com:8080",
        NO_PROXY: "relay.example.com:8443",
      }),
    ).toBe("http://proxy.example.com:8080");
  });
});

describe("createRelayWebSocketFactory", () => {
  it("passes an HTTPS proxy agent to the Node WebSocket only when the relay needs a proxy", () => {
    const calls: Array<{ url: string; options: WebSocket.ClientOptions }> = [];
    const socket = {} as WebSocket;
    const factory = createRelayWebSocketFactory({
      environment: { HTTPS_PROXY: "http://proxy.example.com:8080" },
      createWebSocket: (url, options) => {
        calls.push({ url, options });
        return socket;
      },
    });

    expect(factory("wss://relay.example.com/v1/qr")).toBe(socket);
    expect(calls).toHaveLength(1);
    expect(calls[0].options.agent).toMatchObject({
      proxy: { href: "http://proxy.example.com:8080/" },
    });
  });

  it("uses the native connection when NO_PROXY excludes the relay", () => {
    const calls: Array<{ url: string; options: WebSocket.ClientOptions }> = [];
    const factory = createRelayWebSocketFactory({
      environment: {
        HTTPS_PROXY: "http://proxy.example.com:8080",
        NO_PROXY: "relay.example.com",
      },
      createWebSocket: (url, options) => {
        calls.push({ url, options });
        return {} as WebSocket;
      },
    });

    factory("wss://relay.example.com/v1/qr");
    expect(calls[0].options).toEqual({});
  });
});

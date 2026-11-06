import type WebSocket from "ws";
import { createProxyAwareWebSocketFactory, resolveProxy } from "./proxyWebsocket";

describe("resolveProxy", () => {
  const relay = "wss://relay.example.com/channel";

  it.each([
    [
      "prefers HTTPS_PROXY for a secure WebSocket",
      { HTTPS_PROXY: "http://https-proxy" },
      "http://https-proxy",
    ],
    [
      "uses HTTP_PROXY when HTTPS_PROXY is absent",
      { HTTP_PROXY: "http://http-proxy" },
      "http://http-proxy",
    ],
    ["uses ALL_PROXY as a fallback", { ALL_PROXY: "http://all-proxy" }, "http://all-proxy"],
    [
      "prefers lowercase proxy variables",
      { https_proxy: "http://lowercase-proxy" },
      "http://lowercase-proxy",
    ],
    [
      "prefers HTTP_PROXY for an insecure WebSocket",
      { HTTPS_PROXY: "http://https-proxy", HTTP_PROXY: "http://http-proxy" },
      "http://http-proxy",
      "ws://relay.example.com/channel",
    ],
  ])("%s", (_name, environment, expected, url = relay) => {
    expect(resolveProxy(url, environment)).toBe(expected);
  });

  it.each([
    ["an exact host", "relay.example.com"],
    ["a leading-dot suffix", ".example.com"],
    ["a wildcard suffix", "*.example.com"],
    ["an explicit matching port", "relay.example.com:443"],
    ["a wildcard", "*"],
  ])("bypasses the proxy for %s", (_name, no_proxy) => {
    expect(resolveProxy(relay, { HTTPS_PROXY: "http://proxy", no_proxy })).toBeUndefined();
  });

  it("does not bypass the proxy when a NO_PROXY port differs", () => {
    expect(
      resolveProxy(relay, { HTTPS_PROXY: "http://proxy", NO_PROXY: "relay.example.com:8443" }),
    ).toBe("http://proxy");
  });
});

describe("createProxyAwareWebSocketFactory", () => {
  it("creates a direct WebSocket without an agent", () => {
    const createWebSocket = jest.fn(() => ({}) as WebSocket);

    createProxyAwareWebSocketFactory({ createWebSocket })("wss://relay.example.com/channel");

    expect(createWebSocket).toHaveBeenCalledWith("wss://relay.example.com/channel", {});
  });

  it("creates a proxied WebSocket with an HTTPS proxy agent", () => {
    const createWebSocket = jest.fn(() => ({}) as WebSocket);

    createProxyAwareWebSocketFactory({
      environment: { HTTPS_PROXY: "http://proxy.example.com:8080" },
      createWebSocket,
    })("wss://relay.example.com/channel");

    expect(createWebSocket).toHaveBeenCalledWith(
      "wss://relay.example.com/channel",
      expect.objectContaining({ agent: expect.anything() }),
    );
  });
});

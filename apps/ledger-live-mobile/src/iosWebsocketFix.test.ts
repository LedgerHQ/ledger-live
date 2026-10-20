import type { Platform } from "react-native";

type ConnectArgs = [
  string,
  (string | string[] | null)?,
  { headers?: Record<string, string>; [optionName: string]: unknown }?,
];

const connections: ConnectArgs[] = [];

class FakeWebSocket {
  static CONNECTING = 0;
  constructor(...args: ConnectArgs) {
    connections.push(args);
  }
}

const originalWebSocket = globalThis.WebSocket;

const connect = (...args: ConnectArgs) =>
  new (globalThis.WebSocket as unknown as new (...connectArgs: ConnectArgs) => unknown)(...args);

const loadFixOn = (os: typeof Platform.OS) => {
  globalThis.WebSocket = FakeWebSocket as unknown as typeof WebSocket;
  jest.isolateModules(() => {
    require("react-native").Platform.OS = os;
    jest.requireActual("./iosWebsocketFix");
  });
};

afterEach(() => {
  connections.length = 0;
  globalThis.WebSocket = originalWebSocket;
});

describe("iosWebsocketFix", () => {
  it("adds a User-Agent header on iOS when none is given", () => {
    loadFixOn("ios");

    connect("wss://example.com", ["proto"]);

    expect(connections).toEqual([
      ["wss://example.com", ["proto"], { headers: { "User-Agent": "ReactNative" } }],
    ]);
  });

  it("keeps the other headers and options", () => {
    loadFixOn("ios");

    connect("wss://example.com", null, { headers: { origin: "ledger" }, extra: true });

    expect(connections[0][2]).toEqual({
      headers: { "User-Agent": "ReactNative", origin: "ledger" },
      extra: true,
    });
  });

  it("does not override a User-Agent given by the caller", () => {
    loadFixOn("ios");

    connect("wss://example.com", undefined, { headers: { "User-Agent": "Custom" } });

    expect(connections[0][2]).toEqual({ headers: { "User-Agent": "Custom" } });
  });

  it("keeps WebSocket static constants and instanceof checks", () => {
    loadFixOn("ios");

    expect(WebSocket.CONNECTING).toBe(0);
    expect(connect("wss://example.com")).toBeInstanceOf(FakeWebSocket);
  });

  it("leaves the global WebSocket untouched on Android", () => {
    loadFixOn("android");

    expect(globalThis.WebSocket).toBe(FakeWebSocket);
  });
});

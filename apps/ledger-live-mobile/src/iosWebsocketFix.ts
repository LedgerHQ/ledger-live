import { Platform } from "react-native";

// We are adding a missing user-agent header on the websocket for iOS with RN
// https://github.com/facebook/react-native/issues/28450
// https://github.com/facebook/react-native/issues/30727
// We don't control the code initiating the websocket (e.g. Solana RPC subscriptions),
// so we replace the global WebSocket with a subclass that sets the header when missing.
// RN's WebSocket accepts a non-standard third `options` argument with `headers`.
// This only uses public API, unlike RN's private WebSocketInterceptor we used before.

const DEFAULT_USER_AGENT = "ReactNative";

type WebSocketOptions = { headers?: Record<string, string>; [optionName: string]: unknown };

// The DOM lib typing of WebSocket shadows RN's one, which has the extra `options` argument
type RNWebSocketConstructor = new (
  url: string,
  protocols?: string | string[] | null,
  options?: WebSocketOptions | null,
) => WebSocket;

const withUserAgent = (options?: WebSocketOptions | null): WebSocketOptions => ({
  ...options,
  headers: { "User-Agent": DEFAULT_USER_AGENT, ...options?.headers },
});

if (Platform.OS === "ios") {
  const BaseWebSocket = globalThis.WebSocket as unknown as RNWebSocketConstructor;

  class WebSocketWithUserAgent extends BaseWebSocket {
    constructor(
      url: string,
      protocols?: string | string[] | null,
      options?: WebSocketOptions | null,
    ) {
      super(url, protocols, withUserAgent(options));
    }
  }

  globalThis.WebSocket = WebSocketWithUserAgent as unknown as typeof WebSocket;
}

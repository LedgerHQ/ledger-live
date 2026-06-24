import type { WebSocketLike } from "./types";

export function createSocketFactory() {
  return function socketFactory(url: string, protocols?: string | string[]): WebSocketLike {
    if (typeof WebSocket === "undefined") {
      throw new TypeError(
        "Global WebSocket is not available; provide TransportConfig.socketFactory",
      );
    }
    const ws = new WebSocket(url, protocols);

    const socket: WebSocketLike = {
      send: data => ws.send(data),
      close: (code, reason) => ws.close(code, reason),
      onopen: null,
      onclose: null,
      onerror: null,
      onmessage: null,
    };

    ws.onopen = event => socket.onopen?.(event);
    ws.onclose = event => socket.onclose?.(event);
    ws.onerror = event => socket.onerror?.(event);
    ws.onmessage = event => socket.onmessage?.({ data: event.data });

    return socket;
  };
}

# @devtools/transport

Generic WebSocket transport for DevTools — connection, status, history, and message framing.

Protocol-agnostic: the transport handles the socket lifecycle and message framing; all domain logic lives in a `TransportProtocol` implementation supplied by the consumer.

## Core concepts

**`Transport<M>`** — the public instance. Imperative writes (`connect`, `disconnect`, `send`, `setUrl`) and reactive reads (`getState`, `subscribe`) are kept separate. `getState` returns a stable-reference snapshot suitable for `useSyncExternalStore`.

**`TransportProtocol<M>`** — the consumer-supplied strategy. Implement `onOpen`, `onReceive`, `onClose`, and `onError` to wire domain logic. In `onOpen` you receive the transport handle and can start sending or attach listeners. See `@devtools/protocols` for ready-made implementations.

**`MessageMap`** — a `Record<string, unknown>` declared by the consumer that binds message kinds to their payload types. The transport is fully typed against it.

**`Envelope<M, K>`** — every message, in and out, is wrapped in an envelope stamped with `id`, `seq`, `ts`, and `origin`. Useful for dedup, ordering, and replay.

## Usage

```ts
import { createTransport, identityUrl } from "@devtools/transport";
import type { TransportProtocol } from "@devtools/transport";

type MyMessages = { ping: null; pong: null };

const protocol: TransportProtocol<MyMessages> = {
  onOpen(t) { t.send("ping", null); },
  onReceive(kind) { console.log("received", kind); },
};

const transport = createTransport<MyMessages>(
  { url: identityUrl("ws://localhost:3000", { role: "tool", id: "web-tools", target: "app" }), origin: "web-tools" },
  protocol,
);

transport.connect();
```

## Handshake / identity

Identity travels in the connection URL's query string so the relay can read it from the HTTP upgrade request without an in-band hello frame.

| Helper | Side | Purpose |
|---|---|---|
| `identityUrl(baseUrl, identity)` | client | Build the full connect URL |
| `identityToQuery(identity)` | client | Encode identity as a query string only |
| `parseIdentity(reqUrl)` | relay | Parse identity from an upgrade request URL |

A `host` omits `target`; a `tool` sets `target` to the host id it wants to reach.


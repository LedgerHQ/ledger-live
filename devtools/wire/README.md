# @devtools/wire

Builders for wiring DevTools transport and protocols. Each side of the relay (tool or host) instantiates its own transport and protocol independently; this package provides the factories for both.

## Exports

| Export | What it hides |
|---|---|
| `buildTransport` | `createTransport` + `identityUrl` assembly + immediate connect; returns a `Wire` |
| `buildCopyStoreProtocol` | store-aware protocol builder over `@devtools/protocols/copyStore` |
| `combineProtocols` | fan-out across multiple `TransportProtocol` instances |

`Wire<M>` holds the identity state (`hubUrl`, `role`, `target`) and exposes setters that recompute the URL and call `transport.setUrl` automatically. It follows the same `getState`/`subscribe` contract as `Transport`, so consumers can use `useSyncExternalStore` without any reactive dependency in wire itself. The underlying `Transport<M>` is available at `wire.transport` with full message types preserved.

## Usage

### Single protocol

```ts
import { buildTransport, buildCopyStoreProtocol } from "@devtools/wire";

const ROLE = "tool" as const;
const wire = buildTransport(
  { hubUrl: "ws://127.0.0.1:9090", role: ROLE, id: "web-tools", target: "desktop" },
  buildCopyStoreProtocol(store, listenerMiddleware, ROLE),
);

// reconnect to a different target at runtime
wire.setTarget("mobile");
```

### Multiple protocols

```ts
import { buildTransport, buildCopyStoreProtocol, combineProtocols } from "@devtools/wire";

const ROLE = "tool" as const;
const wire = buildTransport(
  { hubUrl: "ws://127.0.0.1:9090", role: ROLE, id: "web-tools", target: "desktop" },
  combineProtocols(
    buildCopyStoreProtocol(store, listenerMiddleware, ROLE),
    buildOtherProtocol(ROLE),
  ),
);
```

## Guidelines

- `buildTransport` is generic over `M` — pass the protocol directly, role is a `const` shared between `WireTransportOptions` and the protocol builder. Only `target` and `hubUrl` can change at runtime via `Wire` setters.
- `buildTransport` connects immediately and returns a `Wire` — no `.connect()` needed at the call site.
- Identity concerns (`role`, `target`, `hubUrl`) belong to `Wire`; the underlying `Transport` only knows about the URL string.
- Use `combineProtocols` inside the factory to merge multiple protocols — never nest transports.
- No logic beyond assembly — all domain logic stays in `@devtools/transport` and `@devtools/protocols`.

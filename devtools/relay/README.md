# @devtools/relay

A localhost WebSocket relay server for pairing DevTools clients. Dev-only — never shipped.

## What it does

Most WebSocket relays are dumb forwarders: bytes in, bytes out. This one is a **pairing broker** built for the two-role model in `@devtools/transport`.

Every connection declares its identity in the connect URL (no in-band hello frame):

```
ws://localhost:9090/?role=host&id=ledger-live-desktop
ws://localhost:9090/?role=tool&id=web-tools&target=ledger-live-desktop
```

Two roles exist per session:

- **`host`** — the Ledger Live app (desktop or mobile). It registers its own `id`.
- **`tool`** — the DevTools UI (e.g. web-tools). It names the `target` host it wants to reach.

When both roles of the same session are connected, the relay pairs them and forwards messages directly between the two sockets. Before that, messages from the tool are dropped with a log. If a new client connects for a slot that is already taken (e.g. a page reload), the previous occupant is evicted and the pair is reformed.

A tool that connects without a `target` is left connected but idle — it cannot pair until a host with a matching id is present.

## Usage

```sh
# from the relay package
pnpm start

# or from the monorepo root
pnpm --filter @devtools/relay start
```

Default: `ws://127.0.0.1:9090`. Override with options when embedding:

```ts
import { createRelayHub } from "@devtools/relay";

const hub = createRelayHub({ port: 9091 });
// later:
await hub.close();
```

## web-tools: `dev:remote` script

Install `concurrently` in web-tools:

```sh
pnpm --filter @ledgerhq/web-tools add -D concurrently
```

Add to `apps/web-tools/package.json`:

```json
"dev:remote": "concurrently -n relay,web-tools -c cyan,magenta \"pnpm --filter @devtools/relay start\" \"pnpm --filter @ledgerhq/web-tools dev\""
```

Run from the monorepo root:

```sh
pnpm dev:remote --filter @ledgerhq/web-tools
```

Or from inside `apps/web-tools`:

```sh
pnpm dev:remote
```

Both the relay and the Rsbuild dev server start together. The relay exits cleanly when you kill the process.

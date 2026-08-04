# @devtools/relay

A localhost WebSocket relay server for pairing DevTools clients. Dev-only — never shipped.

## What it does

This is a **pairing broker** built for the two-role model in `@devtools/transport`.

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

## Mobile Discovery

The relay is accessible via `localhost` or `127.0.0.1` for desktop apps and mobile emulators.
Mobile devices are a bit harder to handle. Here are the methods to connect to the relay on mobile:

- **Port reverse**: On Android devices, when plugged in via USB, you can use the following command to forward the relay port to the device:
  ```sh
  adb reverse tcp:9090 tcp:9090
  ```
  This makes the relay accessible at `localhost:9090` on the device.
  Unfortunately, port reversing is not available on iOS, so the second method is needed.

- **Wi-Fi**: The relay can also be accessed using an address on the local network. Only devices on the same Wi-Fi network can use the IP. To be accessible from any interface, `0.0.0.0` is used for the relay server. To prevent unknown devices from connecting, a token is required. Devices connecting via `localhost` or `127.0.0.1` do not need the token. On mobile devices, you can scan the QR code on the transport page to easily connect to the relay. The QR code is displayed in the relay's terminal.

In any case, the token is printed in the terminal at boot.

## Parameters

You can run the start script with the following parameters:

- `--quiet`: Don't display messages sent on the server, only connections and disconnections
- `--no-sec`: Disable token security — anyone on the same Wi-Fi can access the relay
- `--log <path>`: Output the logs to a file rather than the terminal



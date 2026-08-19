# @devtools/protocols

Message contracts and `TransportProtocol` implementations for DevTools host ⇄ tool communication.

Each protocol lives in its own folder under `src/` and exposes a single `index.ts`. Import from the named sub-path — no barrel index.

## Adding a protocol

Create `src/<protocol-name>/index.ts`. The wildcard export map picks it up automatically — no `package.json` change needed. Tests go in the same folder as `index.test.ts`.

## copy-store

```ts
import { createCopyStoreProtocol, withCopyStoreHydration } from "@devtools/protocols/copyStore";
```

Mirrors a Redux store across the wire. Both ends run the same loop: every locally dispatched action is relayed to the peer, and every action received from the peer is dispatched into the local store. A full snapshot is exchanged at connect for initial hydration.

### Wiring — app side (host or tool)

**1. Wrap the root reducer** so it can accept a full snapshot:

```ts
import { withCopyStoreHydration } from "@devtools/protocols/copyStore";

configureStore({
  reducer: withCopyStoreHydration(combineReducers({ featureFlags })),
});
```

**2. Register the listener middleware** in the store (do not call `startListening` yourself — the protocol owns it):

```ts
const listenerMiddleware = createListenerMiddleware();

configureStore({
  reducer: withCopyStoreHydration(combineReducers({ featureFlags })),
  middleware: gDM => gDM().prepend(listenerMiddleware.middleware),
});
```

**3. Create the protocol** and pass it to `createTransport`:

```ts
 import { createCopyStoreProtocol, replaceStoreAction, type CopyStoreMessages } from "@devtools/protocols/copyStore";
 import { createTransport } from "@devtools/transport";

const protocol = createCopyStoreProtocol({
  role: "host",
  dispatch: store.dispatch,
  setStoreState: snapshot => store.dispatch(replaceStoreAction(snapshot)),
  getSnapshot: store.getState,
  listener: listenerMiddleware,
});

const transport = createTransport<CopyStoreMessages>(
  { url: "ws://localhost:3000", origin: "app" },
  protocol,
);
```

### Role behaviour

| Role | `onOpen` |
|---|---|
| `host` | Pushes current snapshot immediately |
| `tool` | Requests a snapshot; hydrates whenever it arrives |

Running both roles covers either join order — the protocol is symmetric once connected.

## retrieve-connected-devices

```ts
import { createRetrieveConnectedDevicesProtocol } from "@devtools/protocols/retrieve-connected-devices";
```

Keeps a tool's device list in sync with the relay. The relay pushes the full list whenever membership changes — the tool replaces its local state wholesale.

```ts
const protocol = createRetrieveConnectedDevicesProtocol({
  setDevices: devices => { /* replace local device list with the incoming snapshot */ },
});
```

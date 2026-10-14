# @shared/network-status

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

Cross-platform network status. The API is identical on web and native, so consumers never branch on
platform:

- **native** — [`expo-network`](https://docs.expo.dev/versions/latest/sdk/network/)
- **web** — `navigator.onLine` and the `online` / `offline` window events

## Exports

| Export                    | Description                                                                         |
| ------------------------- | ----------------------------------------------------------------------------------- |
| `NetworkState`            | `{ isConnected?: boolean; isInternetReachable?: boolean }`, fields unset if unknown |
| `getNetworkState`         | `() => Promise<NetworkState>`, never rejects (`{}` if the read fails)               |
| `subscribeToNetworkState` | `(listener) => unsubscribe`, emits the current state, then every change             |
| `useNetworkState`         | `() => NetworkState`, re-renders on every change                                    |

Treat only an explicit `false` as offline: on native, fields stay unset until the first read resolves.

## Usage

```ts
import { subscribeToNetworkState, useNetworkState } from "@shared/network-status";

const { isConnected } = useNetworkState();
const isOffline = isConnected === false;

const unsubscribe = subscribeToNetworkState(state => {
  if (state.isConnected) refetch();
});
```

## Platform differences

`isInternetReachable` comes from the OS, no request is made:

- **Android** — the network is validated (`NET_CAPABILITY_VALIDATED`).
- **iOS** and **web** — same as `isConnected`. A captive portal, or Wi-Fi with no upstream, reports
  reachable.

On native, `subscribeToNetworkState` reads the current state asynchronously. If a change arrives
first, the older read is dropped.

## Testing

On native, `expo-network` needs a native runtime: map `^expo-network$` to a stub in the consumer's
jest config, or mock `@shared/network-status` itself.

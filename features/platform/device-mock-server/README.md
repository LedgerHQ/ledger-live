# @features/platform-device-mock-server

> [!CAUTION]
> **Status: UNSTABLE** — In active development; API may change.

The client side of the device mock server: the REST calls, the URLs derived from the server URL,
the settings that turn it on, and a hook that polls the session devices. It has no transport and no
app state, so the apps and the DMK libs (`@ledgerhq/live-dmk-*`) share it.

The DMK transport, the legacy `hw-transport` bridge and the `mockserver|` compat device ids stay in
`@ledgerhq/live-dmk-shared`: they need the DMK session and the legacy transport registry.

## Exports

| Export | What it does |
| --- | --- |
| `createMockServerSession` | Authenticates, pushes an optional seed, imports a session and returns its token |
| `getMockServerSession`, `listMockServerDevices` | Read the session and its devices |
| `getMockServerStatus`, `isMockServerReachable` | `connected`, `unreachable` or `sessionExpired` |
| `parseMockServerSessionImport` | Validates a session import, throws on an invalid one |
| `getMockServerSecureChannelUrl` | The `ws(s)://…/secure-channel/<token>` URL the scriptrunner flows use |
| `getMockServerConfigurationUiUrl` | The server's configuration UI, with the session token |
| `getMockServerConfig` | `{ url, token }` from the settings, or `null` when the mock server is off |
| `useMockServerDevices` | Polls the session devices every 2 s, without overlapping requests |
| `getMockServerDeviceModelId` | The DMK `DeviceModelId` of a session device, or `undefined` for an unknown type |

It owns `@ledgerhq/device-mockserver-client`: import the client from here, not from the app.

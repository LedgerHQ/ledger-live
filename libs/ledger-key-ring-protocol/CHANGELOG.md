# @ledgerhq/live-wallet

## 0.22.0-next.0

### Minor Changes

- [#21661](https://github.com/LedgerHQ/ledger-live/pull/21661) [`da3d09d`](https://github.com/LedgerHQ/ledger-live/commit/da3d09d75d7dcae659611cd371c48d75c03f7ae4) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Converge on a single Speculos transport and stop resolving Speculos config through the env singleton

  `@ledgerhq/hw-transport-node-speculos-http` and `@ledgerhq/hw-transport-node-speculos` are removed.
  The former was a duplicate of `@ledgerhq/live-dmk-speculos` — same class, same `SpeculosHttpTransportOpts`,
  same `SpeculosButton` enum, but without the DMK session cache, reconnect-on-APDU-failure and transient
  HTTP retries — and had a single consumer left. The latter implemented the websocket/TCP mode gated on
  `SPECULOS_USE_WEBSOCKET`, which defaulted to `false` and was never enabled anywhere; that definition is
  removed too. `@ledgerhq/live-dmk-speculos` is now the only Speculos transport, and it additionally
  exports `SpeculosButton`.

  `@ledgerhq/speculos-transport` loses the websocket branch, so `getPorts` has one shape,
  `SpeculosDeviceInternal` is no longer a union and `SpeculosTransport` is a single type. It no longer
  reads `@shared/env`: the Speculos PKI flag (`-p`) moves from `getEnv("PLAYWRIGHT_RUN") || getEnv("DETOX")`
  to an explicit `pki` field on `DeviceParams`, which `live-e2e-shared`'s `startSpeculos` sets — aligning
  the local Docker provider with the Speculinho provider, which already passed `-p` unconditionally.
  `@ledgerhq/live-dmk-speculos` resolves `SPECULOS_API_PORT` from `process.env` at the point of use
  instead of the env registry, so neither package depends on `@shared/env` any more.

  `@ledgerhq/live-cli` drops the `SPECULOS_APDU_PORT` / `SPECULOS_BUTTON_PORT` / `SPECULOS_HOST`
  websocket branch; use `SPECULOS_API_PORT`. The Canton integration test, the Solana smoke script and the
  disabled BTC integration test move to `@ledgerhq/live-dmk-speculos`, and the dead
  `hw-transport-node-speculos` devDependency is dropped from `coin-kaspa`, `hw-app-kaspa`, `hw-app-icon`
  and `ledger-wallet-framework`.

  `@ledgerhq/ledger-key-ring-protocol` declared `@ledgerhq/speculos-transport` and
  `@ledgerhq/hw-transport-mocker` as runtime `dependencies` even though both are only reachable from
  `tests/` and `src/__tests__/`, which `tsconfig.build.json` excludes from the published build. They
  move to `devDependencies`, so the Docker/Speculos harness is no longer part of the package's runtime
  dependency closure.

  Two further dead Speculos definitions leave `@shared/env`: `SPECULOS_PID_OFFSET`, which had no
  reference anywhere in the repo, and `SPECULOS_FIRMWARE_VERSION`, whose registry entry was unused
  because every reader (`live-common/src/load/speculos.ts`, `live-e2e-shared/src/speculosAppVersion.ts`,
  the CI workflows) already goes through `process.env`.

- [#21667](https://github.com/LedgerHQ/ledger-live/pull/21667) [`73eb9bc`](https://github.com/LedgerHQ/ledger-live/commit/73eb9bc68ed87f07142a1fdf54e4cd68af3a36d4) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Make the LKRP dependency closure publishable

  `@ledgerhq/ledger-key-ring-protocol` is meant to move out of this monorepo as-is, which requires
  every package it installs to be resolvable from outside. Two workspace-private ones were not.

  `@ledgerhq/speculos-transport` is replaced by a local harness in `tests/test-helpers/speculos.ts`.
  The recorder only ever needed three things from a Speculos container — exchange APDUs, press buttons,
  read the automation event stream — and all three are covered by two already-published DMK packages:
  `@ledgerhq/device-transport-kit-speculos` (`HttpSpeculosDatasource.postApdu` / `openEventStream`) and
  `@ledgerhq/speculos-device-controller` (`buttonFactory`). Both peer-depend on
  `@ledgerhq/device-management-kit`, which joins the devDependencies — without it the harness throws
  `Cannot find module` at require time. The `@ledgerhq/hw-transport` shape that
  `hw-ledger-key-ring-protocol`'s ApduDevice needs comes from implementing `exchange` alone, since the
  ledgerjs base class builds `send` on top of it. The harness is test-only: `tsconfig.build.json`
  excludes `tests/`, and only `pnpm e2e` (Docker + `COIN_APPS`) reaches it.

  `@shared/env` is gone from the tests, following the four exits in `libs/env/MIGRATION.md`:
  `setEnv("GET_CALLS_RETRY", 0)` was dead (`live-network` reads only `getNetworkState()`, and both
  helpers already call `setNetworkState({ getCallsRetry: 0 })` on the next line),
  `TRUSTCHAIN_API_STAGING` becomes a plain constant, and `MOCK` is dropped — nothing set it, and
  `mock.sdk.test.ts`, the only place that ever turned it on (a `setEnv`/`getEnv` round-trip in the same
  file), now passes `true` directly. `jest.setup.js` existed solely to inject env definitions before
  `getEnv()` and is removed with its last caller.

  The package's runtime closure is now `hw-ledger-key-ring-protocol` (which moves alongside it),
  `hw-transport`, `ledger-auth`, `live-network`, `types-devices` and `logs` — all published.

## 0.21.2

### Patch Changes

- Updated dependencies [[`5db7a7d`](https://github.com/LedgerHQ/ledger-live/commit/5db7a7dc517bb23d12532ae07cc947eddff6c10e)]:
  - @ledgerhq/hw-ledger-key-ring-protocol@0.12.0
  - @ledgerhq/speculos-transport@0.10.14

## 0.21.2-next.0

### Patch Changes

- Updated dependencies [[`5db7a7d`](https://github.com/LedgerHQ/ledger-live/commit/5db7a7dc517bb23d12532ae07cc947eddff6c10e)]:
  - @ledgerhq/hw-ledger-key-ring-protocol@0.12.0-next.0
  - @ledgerhq/speculos-transport@0.10.14-next.0

## 0.21.1

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/speculos-transport@0.10.13

## 0.21.1-next.0

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/speculos-transport@0.10.13-next.0

## 0.21.0

### Minor Changes

- [#21001](https://github.com/LedgerHQ/ledger-live/pull/21001) [`c0bdd70`](https://github.com/LedgerHQ/ledger-live/commit/c0bdd7075816b44d245832849b28e16f7a169006) Thanks [@KVNLS](https://github.com/KVNLS)! - Prevent keypair generation at each startup and remove zod valdiation which is coslty at startup

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/speculos-transport@0.10.12

## 0.21.0-next.0

### Minor Changes

- [#21001](https://github.com/LedgerHQ/ledger-live/pull/21001) [`c0bdd70`](https://github.com/LedgerHQ/ledger-live/commit/c0bdd7075816b44d245832849b28e16f7a169006) Thanks [@KVNLS](https://github.com/KVNLS)! - Prevent keypair generation at each startup and remove zod valdiation which is coslty at startup

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/speculos-transport@0.10.12-next.0

## 0.20.0

### Minor Changes

- [#20689](https://github.com/LedgerHQ/ledger-live/pull/20689) [`696f871`](https://github.com/LedgerHQ/ledger-live/commit/696f871fc89aedd6a2a50fe3f0dd442bbd7ebf07) Thanks [@thesan](https://github.com/thesan)! - Load LKRP identity credentials on demand, allow AuthSDK to resolve the Keycloak URL lazily, and
  simplify auth feature gating around an app-owned provider

### Patch Changes

- Updated dependencies [[`696f871`](https://github.com/LedgerHQ/ledger-live/commit/696f871fc89aedd6a2a50fe3f0dd442bbd7ebf07), [`a7b0bae`](https://github.com/LedgerHQ/ledger-live/commit/a7b0baeaa4e7b2fb180e7ab28ce92a6287b46a68)]:
  - @ledgerhq/ledger-auth@0.4.0
  - @ledgerhq/types-devices@7.0.0
  - @ledgerhq/speculos-transport@0.10.11

## 0.20.0-next.0

### Minor Changes

- [#20689](https://github.com/LedgerHQ/ledger-live/pull/20689) [`696f871`](https://github.com/LedgerHQ/ledger-live/commit/696f871fc89aedd6a2a50fe3f0dd442bbd7ebf07) Thanks [@thesan](https://github.com/thesan)! - Load LKRP identity credentials on demand, allow AuthSDK to resolve the Keycloak URL lazily, and
  simplify auth feature gating around an app-owned provider

### Patch Changes

- Updated dependencies [[`696f871`](https://github.com/LedgerHQ/ledger-live/commit/696f871fc89aedd6a2a50fe3f0dd442bbd7ebf07), [`a7b0bae`](https://github.com/LedgerHQ/ledger-live/commit/a7b0baeaa4e7b2fb180e7ab28ce92a6287b46a68)]:
  - @ledgerhq/ledger-auth@0.4.0-next.0
  - @ledgerhq/types-devices@7.0.0-next.0
  - @ledgerhq/speculos-transport@0.10.11-next.0

## 0.19.0

### Minor Changes

- [#20423](https://github.com/LedgerHQ/ledger-live/pull/20423) [`c4a8141`](https://github.com/LedgerHQ/ledger-live/commit/c4a8141369e63e875fb5bfc9aef3f53362150338) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Fix Ledger Sync surfacing a 401 instead of refreshing the expired JWT

  `@shared/cloud-sync` threw a bare `Error` carrying only `HTTP <status> on <method> <url>`, dropping
  both the HTTP status and the backend's response body. The trustchain JWT recovery in
  `genericWithJWT` could not classify it, so an expired token was rethrown instead of being refreshed
  and retried: the 401 reached the UI, and on mobile it fed the wallet-sync error into the account
  sync indicator ("Some account data couldn't load").

  `CloudSyncHttpError` now carries `status`, `url`, `method` and the backend's verbatim message, and
  `auth.ts` classifies 4xx from the numeric `status` rather than from the `LedgerAPI4xx` class name,
  so recovery no longer depends on which transport made the call. The error contract expected by the
  trustchain layer is documented in `auth.ts`; a transport whose errors are not `Error`-shaped must
  remap to it at its boundary.

### Patch Changes

- Updated dependencies [[`1e9db75`](https://github.com/LedgerHQ/ledger-live/commit/1e9db750a4882f9db7f95278e33c00262487b37b)]:
  - @ledgerhq/types-devices@6.32.0

## 0.19.0-next.0

### Minor Changes

- [#20423](https://github.com/LedgerHQ/ledger-live/pull/20423) [`c4a8141`](https://github.com/LedgerHQ/ledger-live/commit/c4a8141369e63e875fb5bfc9aef3f53362150338) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Fix Ledger Sync surfacing a 401 instead of refreshing the expired JWT

  `@shared/cloud-sync` threw a bare `Error` carrying only `HTTP <status> on <method> <url>`, dropping
  both the HTTP status and the backend's response body. The trustchain JWT recovery in
  `genericWithJWT` could not classify it, so an expired token was rethrown instead of being refreshed
  and retried: the 401 reached the UI, and on mobile it fed the wallet-sync error into the account
  sync indicator ("Some account data couldn't load").

  `CloudSyncHttpError` now carries `status`, `url`, `method` and the backend's verbatim message, and
  `auth.ts` classifies 4xx from the numeric `status` rather than from the `LedgerAPI4xx` class name,
  so recovery no longer depends on which transport made the call. The error contract expected by the
  trustchain layer is documented in `auth.ts`; a transport whose errors are not `Error`-shaped must
  remap to it at its boundary.

### Patch Changes

- Updated dependencies [[`1e9db75`](https://github.com/LedgerHQ/ledger-live/commit/1e9db750a4882f9db7f95278e33c00262487b37b)]:
  - @ledgerhq/types-devices@6.32.0-next.0

## 0.18.0

### Minor Changes

- [#19634](https://github.com/LedgerHQ/ledger-live/pull/19634) [`4015ade`](https://github.com/LedgerHQ/ledger-live/commit/4015ade1f9744d4bb575282060fdb1beb9aafc89) Thanks [@thesan](https://github.com/thesan)! - Connect @ledgerhq/ledger-auth to the Ledger Wallet apps Redux store

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/speculos-transport@0.10.10

## 0.18.0-next.0

### Minor Changes

- [#19634](https://github.com/LedgerHQ/ledger-live/pull/19634) [`4015ade`](https://github.com/LedgerHQ/ledger-live/commit/4015ade1f9744d4bb575282060fdb1beb9aafc89) Thanks [@thesan](https://github.com/thesan)! - Connect @ledgerhq/ledger-auth to the Ledger Wallet apps Redux store

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/speculos-transport@0.10.10-next.0

## 0.17.2

### Patch Changes

- Updated dependencies [[`1af9ec9`](https://github.com/LedgerHQ/ledger-live/commit/1af9ec984928e0bf5fd23ce12edcc6131b0302a0)]:
  - @ledgerhq/live-network@3.0.0
  - @ledgerhq/hw-transport@6.35.7
  - @ledgerhq/hw-ledger-key-ring-protocol@0.11.2
  - @ledgerhq/hw-transport-mocker@6.34.7
  - @ledgerhq/speculos-transport@0.10.9

## 0.17.2-next.0

### Patch Changes

- Updated dependencies [[`1af9ec9`](https://github.com/LedgerHQ/ledger-live/commit/1af9ec984928e0bf5fd23ce12edcc6131b0302a0)]:
  - @ledgerhq/live-network@3.0.0-next.0
  - @ledgerhq/hw-transport@6.35.7-next.0
  - @ledgerhq/hw-ledger-key-ring-protocol@0.11.2-next.0
  - @ledgerhq/hw-transport-mocker@6.34.7-next.0
  - @ledgerhq/speculos-transport@0.10.9-next.0

## 0.17.1

### Patch Changes

- Updated dependencies [[`e7caf31`](https://github.com/LedgerHQ/ledger-live/commit/e7caf310efbbf82aa777a7e86ceafe60f11e7193)]:
  - @ledgerhq/live-network@2.7.0

## 0.17.1-next.0

### Patch Changes

- Updated dependencies [[`e7caf31`](https://github.com/LedgerHQ/ledger-live/commit/e7caf310efbbf82aa777a7e86ceafe60f11e7193)]:
  - @ledgerhq/live-network@2.7.0-next.0

## 0.17.0

### Minor Changes

- [#19477](https://github.com/LedgerHQ/ledger-live/pull/19477) [`2ee5ac1`](https://github.com/LedgerHQ/ledger-live/commit/2ee5ac15540a462143b61f2d546063ed9c8cfe40) Thanks [@Justkant](https://github.com/Justkant)! - Mock SDK: make `walletSyncEncryptionKey` a valid 64-char hex string (distinct per application index). The value is contractually hex (the real SDK feeds it to `crypto.from_hex`), so consumers deriving keys from it now work against the mock.

- [#19432](https://github.com/LedgerHQ/ledger-live/pull/19432) [`d9dc6e6`](https://github.com/LedgerHQ/ledger-live/commit/d9dc6e621df877b13148688adec0b038983574e0) Thanks [@thesan](https://github.com/thesan)! - Make the attestation optional for the oidc flow

### Patch Changes

- Updated dependencies [[`a15b864`](https://github.com/LedgerHQ/ledger-live/commit/a15b864576d901f15d480070b475314c3b23c1dd), [`84cc6e9`](https://github.com/LedgerHQ/ledger-live/commit/84cc6e9b7a70ffe2780f4b3ef32c10fa8bf9a909), [`189a0d6`](https://github.com/LedgerHQ/ledger-live/commit/189a0d60928e458407c85dcefe954e905bd0ba59), [`fc44f1e`](https://github.com/LedgerHQ/ledger-live/commit/fc44f1e6ddcca939c117e0cb8bc49c404163b003)]:
  - @ledgerhq/live-env@2.42.0
  - @ledgerhq/ledger-auth@0.3.0
  - @ledgerhq/hw-ledger-key-ring-protocol@0.11.1
  - @ledgerhq/live-network@2.6.8
  - @ledgerhq/speculos-transport@0.10.8

## 0.17.0-next.0

### Minor Changes

- [#19477](https://github.com/LedgerHQ/ledger-live/pull/19477) [`2ee5ac1`](https://github.com/LedgerHQ/ledger-live/commit/2ee5ac15540a462143b61f2d546063ed9c8cfe40) Thanks [@Justkant](https://github.com/Justkant)! - Mock SDK: make `walletSyncEncryptionKey` a valid 64-char hex string (distinct per application index). The value is contractually hex (the real SDK feeds it to `crypto.from_hex`), so consumers deriving keys from it now work against the mock.

- [#19432](https://github.com/LedgerHQ/ledger-live/pull/19432) [`d9dc6e6`](https://github.com/LedgerHQ/ledger-live/commit/d9dc6e621df877b13148688adec0b038983574e0) Thanks [@thesan](https://github.com/thesan)! - Make the attestation optional for the oidc flow

### Patch Changes

- Updated dependencies [[`a15b864`](https://github.com/LedgerHQ/ledger-live/commit/a15b864576d901f15d480070b475314c3b23c1dd), [`84cc6e9`](https://github.com/LedgerHQ/ledger-live/commit/84cc6e9b7a70ffe2780f4b3ef32c10fa8bf9a909), [`189a0d6`](https://github.com/LedgerHQ/ledger-live/commit/189a0d60928e458407c85dcefe954e905bd0ba59), [`fc44f1e`](https://github.com/LedgerHQ/ledger-live/commit/fc44f1e6ddcca939c117e0cb8bc49c404163b003)]:
  - @ledgerhq/live-env@2.42.0-next.0
  - @ledgerhq/ledger-auth@0.3.0-next.0
  - @ledgerhq/hw-ledger-key-ring-protocol@0.11.1-next.0
  - @ledgerhq/live-network@2.6.8-next.0
  - @ledgerhq/speculos-transport@0.10.8-next.0

## 0.16.0

### Minor Changes

- [#18568](https://github.com/LedgerHQ/ledger-live/pull/18568) [`6ddd641`](https://github.com/LedgerHQ/ledger-live/commit/6ddd64113a4c360a091fc1fd54256cfabaab5220) Thanks [@gre-ledger](https://github.com/gre-ledger)! - feat(lkrp): per-application close on Wallet Sync deactivation

  Deactivating Wallet Sync now closes only the current application's stream instead of destroying the whole trustchain root, so other applications sharing the same root (e.g. wallet-cli `ring`) keep working. If the application being closed is the last open one, the whole trustchain is still destroyed (previous behaviour).

  - `CommandStreamResolver` now observes `CloseStream` (`ResolvedCommandStream.isClosed()`).
  - `StreamTree.getApplicationStreams()` / `hasAnotherOpenApplication()` enumerate application streams to detect the last open application.
  - New `TrustchainSDK.destroyApplication()` primitive, software-key signed (no hardware device): closes only the current application's stream, or destroys the whole trustchain when it is the last open application (`{ trustchainDestroyed }`).
  - `restoreTrustchain` throws `TrustchainEjected` when the application stream is closed, and `getOrCreateTrustchain` reopens on the next index after a close.
  - LLD/LLM `useDestroyTrustchain` hooks now call `destroyApplication`.
  - web-tools trustchain playground exposes a `sdk.destroyApplication` action to exercise the per-application close.

- [#18537](https://github.com/LedgerHQ/ledger-live/pull/18537) [`c22afcb`](https://github.com/LedgerHQ/ledger-live/commit/c22afcba4dda045b2be9294abc67c5a96e5f4016) Thanks [@thesan](https://github.com/thesan)! - Implement an LKRP identity provider for the auth lib

### Patch Changes

- Updated dependencies [[`70a706e`](https://github.com/LedgerHQ/ledger-live/commit/70a706e4efe3a6fa176f9827a4a06949ba185f11), [`6ddd641`](https://github.com/LedgerHQ/ledger-live/commit/6ddd64113a4c360a091fc1fd54256cfabaab5220)]:
  - @ledgerhq/live-env@2.41.0
  - @ledgerhq/hw-ledger-key-ring-protocol@0.11.0
  - @ledgerhq/live-network@2.6.7
  - @ledgerhq/speculos-transport@0.10.7
  - @ledgerhq/hw-transport@6.35.6
  - @ledgerhq/hw-transport-mocker@6.34.6

## 0.16.0-next.0

### Minor Changes

- [#18568](https://github.com/LedgerHQ/ledger-live/pull/18568) [`6ddd641`](https://github.com/LedgerHQ/ledger-live/commit/6ddd64113a4c360a091fc1fd54256cfabaab5220) Thanks [@gre-ledger](https://github.com/gre-ledger)! - feat(lkrp): per-application close on Wallet Sync deactivation

  Deactivating Wallet Sync now closes only the current application's stream instead of destroying the whole trustchain root, so other applications sharing the same root (e.g. wallet-cli `ring`) keep working. If the application being closed is the last open one, the whole trustchain is still destroyed (previous behaviour).

  - `CommandStreamResolver` now observes `CloseStream` (`ResolvedCommandStream.isClosed()`).
  - `StreamTree.getApplicationStreams()` / `hasAnotherOpenApplication()` enumerate application streams to detect the last open application.
  - New `TrustchainSDK.destroyApplication()` primitive, software-key signed (no hardware device): closes only the current application's stream, or destroys the whole trustchain when it is the last open application (`{ trustchainDestroyed }`).
  - `restoreTrustchain` throws `TrustchainEjected` when the application stream is closed, and `getOrCreateTrustchain` reopens on the next index after a close.
  - LLD/LLM `useDestroyTrustchain` hooks now call `destroyApplication`.
  - web-tools trustchain playground exposes a `sdk.destroyApplication` action to exercise the per-application close.

- [#18537](https://github.com/LedgerHQ/ledger-live/pull/18537) [`c22afcb`](https://github.com/LedgerHQ/ledger-live/commit/c22afcba4dda045b2be9294abc67c5a96e5f4016) Thanks [@thesan](https://github.com/thesan)! - Implement an LKRP identity provider for the auth lib

### Patch Changes

- Updated dependencies [[`70a706e`](https://github.com/LedgerHQ/ledger-live/commit/70a706e4efe3a6fa176f9827a4a06949ba185f11), [`6ddd641`](https://github.com/LedgerHQ/ledger-live/commit/6ddd64113a4c360a091fc1fd54256cfabaab5220)]:
  - @ledgerhq/live-env@2.41.0-next.0
  - @ledgerhq/hw-ledger-key-ring-protocol@0.11.0-next.0
  - @ledgerhq/live-network@2.6.7-next.0
  - @ledgerhq/speculos-transport@0.10.7-next.0
  - @ledgerhq/hw-transport@6.35.6-next.0
  - @ledgerhq/hw-transport-mocker@6.34.6-next.0

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->

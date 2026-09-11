---
"@ledgerhq/live-dmk-speculos": minor
"@ledgerhq/speculos-transport": minor
"@ledgerhq/live-e2e-shared": minor
"@ledgerhq/live-cli": minor
"@ledgerhq/hw-app-canton": patch
"@ledgerhq/hw-app-solana": patch
"@ledgerhq/hw-app-btc": patch
"@shared/env": patch
"@ledgerhq/ledger-key-ring-protocol": patch
---

Converge on a single Speculos transport and stop resolving Speculos config through the env singleton

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
`hw-transport-node-speculos` devDependency is dropped from `coin-kaspa`, `hw-app-kaspa`, `hw-app-helium`,
`hw-app-icon` and `ledger-wallet-framework`.

`@ledgerhq/ledger-key-ring-protocol` declared `@ledgerhq/speculos-transport` and
`@ledgerhq/hw-transport-mocker` as runtime `dependencies` even though both are only reachable from
`tests/` and `src/__tests__/`, which `tsconfig.build.json` excludes from the published build. They
move to `devDependencies`, so the Docker/Speculos harness is no longer part of the package's runtime
dependency closure.

Two further dead Speculos definitions leave `@shared/env`: `SPECULOS_PID_OFFSET`, which had no
reference anywhere in the repo, and `SPECULOS_FIRMWARE_VERSION`, whose registry entry was unused
because every reader (`live-common/src/load/speculos.ts`, `live-e2e-shared/src/speculosAppVersion.ts`,
the CI workflows) already goes through `process.env`.

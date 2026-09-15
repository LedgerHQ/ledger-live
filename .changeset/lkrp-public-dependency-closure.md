---
"@ledgerhq/ledger-key-ring-protocol": patch
---

Make the LKRP dependency closure publishable

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

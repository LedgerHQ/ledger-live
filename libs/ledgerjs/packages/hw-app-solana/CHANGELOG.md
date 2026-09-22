# @ledgerhq/hw-app-solana

## 7.11.0

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

## 7.11.0-next.0

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

## 7.10.7

### Patch Changes

- Updated dependencies [[`1070564`](https://github.com/LedgerHQ/ledger-live/commit/107056410174d3da2d45c468232a8d742aea021f)]:
  - @ledgerhq/errors@7.0.0
  - @ledgerhq/hw-transport@6.35.7

## 7.10.7-next.0

### Patch Changes

- Updated dependencies [[`1070564`](https://github.com/LedgerHQ/ledger-live/commit/107056410174d3da2d45c468232a8d742aea021f)]:
  - @ledgerhq/errors@7.0.0-next.0
  - @ledgerhq/hw-transport@6.35.7-next.0

## 7.10.6

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.35.6

## 7.10.6-next.0

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.35.6-next.0

## 7.10.5

### Patch Changes

- Updated dependencies [[`48dbd53`](https://github.com/LedgerHQ/ledger-live/commit/48dbd533a7a505cbb37989f8ce94f273f84bc7d2)]:
  - @ledgerhq/errors@6.37.0
  - @ledgerhq/hw-transport@6.35.5

## 7.10.5-next.0

### Patch Changes

- Updated dependencies [[`48dbd53`](https://github.com/LedgerHQ/ledger-live/commit/48dbd533a7a505cbb37989f8ce94f273f84bc7d2)]:
  - @ledgerhq/errors@6.37.0-next.0
  - @ledgerhq/hw-transport@6.35.5-next.0

## 7.10.4

### Patch Changes

- Updated dependencies [[`8c0f5f2`](https://github.com/LedgerHQ/ledger-live/commit/8c0f5f22e66aa6a34a3363a256d3da2d98d07dc9)]:
  - @ledgerhq/errors@6.36.0
  - @ledgerhq/hw-transport@6.35.4

## 7.10.4-next.0

### Patch Changes

- Updated dependencies [[`8c0f5f2`](https://github.com/LedgerHQ/ledger-live/commit/8c0f5f22e66aa6a34a3363a256d3da2d98d07dc9)]:
  - @ledgerhq/errors@6.36.0-next.0
  - @ledgerhq/hw-transport@6.35.4-next.0

## 7.10.3

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.35.3

## 7.10.3-next.0

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.35.3-next.0

## 7.10.2

### Patch Changes

- Updated dependencies [[`d308b1a`](https://github.com/LedgerHQ/ledger-live/commit/d308b1a6b9c629839f051cf367a527f4232120c7)]:
  - @ledgerhq/errors@6.35.0
  - @ledgerhq/hw-transport@6.35.2

## 7.10.2-next.0

### Patch Changes

- Updated dependencies [[`d308b1a`](https://github.com/LedgerHQ/ledger-live/commit/d308b1a6b9c629839f051cf367a527f4232120c7)]:
  - @ledgerhq/errors@6.35.0-next.0
  - @ledgerhq/hw-transport@6.35.2-next.0

## 7.10.2

### Patch Changes

- Updated dependencies [[`202cc42`](https://github.com/LedgerHQ/ledger-live/commit/202cc423b09662b5b25012b84124aecd4dc7245d)]:
  - @ledgerhq/errors@6.34.1
  - @ledgerhq/hw-transport@6.35.2

## 7.10.2-hotfix.0

### Patch Changes

- Updated dependencies [[`202cc42`](https://github.com/LedgerHQ/ledger-live/commit/202cc423b09662b5b25012b84124aecd4dc7245d)]:
  - @ledgerhq/errors@6.34.1-hotfix.0
  - @ledgerhq/hw-transport@6.35.2-hotfix.0

## 7.10.1

### Patch Changes

- Updated dependencies [[`4cf9b8c`](https://github.com/LedgerHQ/ledger-live/commit/4cf9b8cde388aebfe04a894e9a35584856d1713d)]:
  - @ledgerhq/errors@6.34.0
  - @ledgerhq/hw-transport@6.35.1

## 7.10.1-next.0

### Patch Changes

- Updated dependencies [[`4cf9b8c`](https://github.com/LedgerHQ/ledger-live/commit/4cf9b8cde388aebfe04a894e9a35584856d1713d)]:
  - @ledgerhq/errors@6.34.0-next.0
  - @ledgerhq/hw-transport@6.35.1-next.0

## 7.10.0

### Minor Changes

- [#15796](https://github.com/LedgerHQ/ledger-live/pull/15796) [`008a4bd`](https://github.com/LedgerHQ/ledger-live/commit/008a4bdb87f0e65fa23de3a29818a4d02f28f4f8) Thanks [@iqbalibrahim-ledger](https://github.com/iqbalibrahim-ledger)! - Replace ESLint/Prettier with oxlint and document oxfmt for LedgerJS packages under libs/ledgerjs/packages.

### Patch Changes

- Updated dependencies [[`53df748`](https://github.com/LedgerHQ/ledger-live/commit/53df74819753f084ed3df4a2ab9082d398b54920), [`008a4bd`](https://github.com/LedgerHQ/ledger-live/commit/008a4bdb87f0e65fa23de3a29818a4d02f28f4f8)]:
  - @ledgerhq/errors@6.33.0
  - @ledgerhq/hw-transport@6.35.0

## 7.10.0-next.0

### Minor Changes

- [#15796](https://github.com/LedgerHQ/ledger-live/pull/15796) [`008a4bd`](https://github.com/LedgerHQ/ledger-live/commit/008a4bdb87f0e65fa23de3a29818a4d02f28f4f8) Thanks [@iqbalibrahim-ledger](https://github.com/iqbalibrahim-ledger)! - Replace ESLint/Prettier with oxlint and document oxfmt for LedgerJS packages under libs/ledgerjs/packages.

### Patch Changes

- Updated dependencies [[`53df748`](https://github.com/LedgerHQ/ledger-live/commit/53df74819753f084ed3df4a2ab9082d398b54920), [`008a4bd`](https://github.com/LedgerHQ/ledger-live/commit/008a4bdb87f0e65fa23de3a29818a4d02f28f4f8)]:
  - @ledgerhq/errors@6.33.0-next.0
  - @ledgerhq/hw-transport@6.35.0-next.0

## 7.9.1

### Patch Changes

- Updated dependencies [[`6dac7f9`](https://github.com/LedgerHQ/ledger-live/commit/6dac7f974c28dcae409c110a60061996490c5088), [`8ce1cb7`](https://github.com/LedgerHQ/ledger-live/commit/8ce1cb755b3e68c8688f9e828596d3c2605ef3cb)]:
  - @ledgerhq/errors@6.32.0
  - @ledgerhq/hw-transport@6.34.1

## 7.9.1-next.0

### Patch Changes

- Updated dependencies [[`6dac7f9`](https://github.com/LedgerHQ/ledger-live/commit/6dac7f974c28dcae409c110a60061996490c5088), [`8ce1cb7`](https://github.com/LedgerHQ/ledger-live/commit/8ce1cb755b3e68c8688f9e828596d3c2605ef3cb)]:
  - @ledgerhq/errors@6.32.0-next.0
  - @ledgerhq/hw-transport@6.34.1-next.0

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->

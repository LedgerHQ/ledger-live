# @ledgerhq/live-network

## 3.0.0

### Major Changes

- [#19977](https://github.com/LedgerHQ/ledger-live/pull/19977) [`1af9ec9`](https://github.com/LedgerHQ/ledger-live/commit/1af9ec984928e0bf5fd23ce12edcc6131b0302a0) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Define `LedgerAPI4xx`, `LedgerAPI5xx`, and `NetworkDown` as native error classes in `@ledgerhq/live-network` instead of importing them from `@ledgerhq/errors`. All three are now exported from the package's public index for downstream migrations.

## 3.0.0-next.0

### Major Changes

- [#19977](https://github.com/LedgerHQ/ledger-live/pull/19977) [`1af9ec9`](https://github.com/LedgerHQ/ledger-live/commit/1af9ec984928e0bf5fd23ce12edcc6131b0302a0) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Define `LedgerAPI4xx`, `LedgerAPI5xx`, and `NetworkDown` as native error classes in `@ledgerhq/live-network` instead of importing them from `@ledgerhq/errors`. All three are now exported from the package's public index for downstream migrations.

## 2.7.0

### Minor Changes

- [#19870](https://github.com/LedgerHQ/ledger-live/pull/19870) [`e7caf31`](https://github.com/LedgerHQ/ledger-live/commit/e7caf310efbbf82aa777a7e86ceafe60f11e7193) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Decouple from `@ledgerhq/live-env` via local state singleton. Network configuration (timeouts, log flags, client version) is now managed via `setNetworkState()` and defaults to the previous env var values. Consumers in the monorepo call `bridgeEnvToNetworkState()` from `@ledgerhq/live-common/network/setup` at boot. External consumers get sensible defaults with no setup required.

## 2.7.0-next.0

### Minor Changes

- [#19870](https://github.com/LedgerHQ/ledger-live/pull/19870) [`e7caf31`](https://github.com/LedgerHQ/ledger-live/commit/e7caf310efbbf82aa777a7e86ceafe60f11e7193) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Decouple from `@ledgerhq/live-env` via local state singleton. Network configuration (timeouts, log flags, client version) is now managed via `setNetworkState()` and defaults to the previous env var values. Consumers in the monorepo call `bridgeEnvToNetworkState()` from `@ledgerhq/live-common/network/setup` at boot. External consumers get sensible defaults with no setup required.

## 2.6.8

### Patch Changes

- Updated dependencies [[`a15b864`](https://github.com/LedgerHQ/ledger-live/commit/a15b864576d901f15d480070b475314c3b23c1dd), [`fc44f1e`](https://github.com/LedgerHQ/ledger-live/commit/fc44f1e6ddcca939c117e0cb8bc49c404163b003)]:
  - @ledgerhq/live-env@2.42.0

## 2.6.8-next.0

### Patch Changes

- Updated dependencies [[`a15b864`](https://github.com/LedgerHQ/ledger-live/commit/a15b864576d901f15d480070b475314c3b23c1dd), [`fc44f1e`](https://github.com/LedgerHQ/ledger-live/commit/fc44f1e6ddcca939c117e0cb8bc49c404163b003)]:
  - @ledgerhq/live-env@2.42.0-next.0

## 2.6.7

### Patch Changes

- Updated dependencies [[`70a706e`](https://github.com/LedgerHQ/ledger-live/commit/70a706e4efe3a6fa176f9827a4a06949ba185f11), [`fa0123a`](https://github.com/LedgerHQ/ledger-live/commit/fa0123a1da7b053d58afab498266cf830958e2ff)]:
  - @ledgerhq/live-env@2.41.0
  - @ledgerhq/live-promise@0.3.0

## 2.6.7-next.0

### Patch Changes

- Updated dependencies [[`70a706e`](https://github.com/LedgerHQ/ledger-live/commit/70a706e4efe3a6fa176f9827a4a06949ba185f11), [`fa0123a`](https://github.com/LedgerHQ/ledger-live/commit/fa0123a1da7b053d58afab498266cf830958e2ff)]:
  - @ledgerhq/live-env@2.41.0-next.0
  - @ledgerhq/live-promise@0.3.0-next.0

## 2.6.6

### Patch Changes

- Updated dependencies [[`48dbd53`](https://github.com/LedgerHQ/ledger-live/commit/48dbd533a7a505cbb37989f8ce94f273f84bc7d2), [`13aeeb6`](https://github.com/LedgerHQ/ledger-live/commit/13aeeb6186997b433785e542ed1dafa6afde2267), [`798081d`](https://github.com/LedgerHQ/ledger-live/commit/798081db3e427c8d2d09930ceb836703146ca1ba)]:
  - @ledgerhq/errors@6.37.0
  - @ledgerhq/live-env@2.40.0

## 2.6.6-next.0

### Patch Changes

- Updated dependencies [[`48dbd53`](https://github.com/LedgerHQ/ledger-live/commit/48dbd533a7a505cbb37989f8ce94f273f84bc7d2), [`13aeeb6`](https://github.com/LedgerHQ/ledger-live/commit/13aeeb6186997b433785e542ed1dafa6afde2267), [`798081d`](https://github.com/LedgerHQ/ledger-live/commit/798081db3e427c8d2d09930ceb836703146ca1ba)]:
  - @ledgerhq/errors@6.37.0-next.0
  - @ledgerhq/live-env@2.40.0-next.0

## 2.6.5

### Patch Changes

- Updated dependencies [[`81ceb34`](https://github.com/LedgerHQ/ledger-live/commit/81ceb347c0b2167358c601a9922e2c7fa14a845b), [`9ab3a61`](https://github.com/LedgerHQ/ledger-live/commit/9ab3a6157abb3a382c3157eb292ce9d9d2c6df93), [`eb1dae8`](https://github.com/LedgerHQ/ledger-live/commit/eb1dae8fc14ff8e0bc1e1ce040712492a0328451)]:
  - @ledgerhq/live-env@2.39.0

## 2.6.5-next.0

### Patch Changes

- Updated dependencies [[`81ceb34`](https://github.com/LedgerHQ/ledger-live/commit/81ceb347c0b2167358c601a9922e2c7fa14a845b), [`9ab3a61`](https://github.com/LedgerHQ/ledger-live/commit/9ab3a6157abb3a382c3157eb292ce9d9d2c6df93), [`eb1dae8`](https://github.com/LedgerHQ/ledger-live/commit/eb1dae8fc14ff8e0bc1e1ce040712492a0328451)]:
  - @ledgerhq/live-env@2.39.0-next.0

## 2.6.4

### Patch Changes

- Updated dependencies [[`b14d5cc`](https://github.com/LedgerHQ/ledger-live/commit/b14d5cc29cc75c6be2e565db3d4d0ab400cc56d9), [`ec38133`](https://github.com/LedgerHQ/ledger-live/commit/ec38133ab6b2c18d329e1c78320b7c2a1f80fbfc), [`8c0f5f2`](https://github.com/LedgerHQ/ledger-live/commit/8c0f5f22e66aa6a34a3363a256d3da2d98d07dc9)]:
  - @ledgerhq/live-env@2.38.0
  - @ledgerhq/errors@6.36.0

## 2.6.4-next.0

### Patch Changes

- Updated dependencies [[`b14d5cc`](https://github.com/LedgerHQ/ledger-live/commit/b14d5cc29cc75c6be2e565db3d4d0ab400cc56d9), [`ec38133`](https://github.com/LedgerHQ/ledger-live/commit/ec38133ab6b2c18d329e1c78320b7c2a1f80fbfc), [`8c0f5f2`](https://github.com/LedgerHQ/ledger-live/commit/8c0f5f22e66aa6a34a3363a256d3da2d98d07dc9)]:
  - @ledgerhq/live-env@2.38.0-next.0
  - @ledgerhq/errors@6.36.0-next.0

## 2.6.3

### Patch Changes

- Updated dependencies [[`5fc817a`](https://github.com/LedgerHQ/ledger-live/commit/5fc817a5ee316396a327e5b10eccd8314bfb2df5), [`65f87d9`](https://github.com/LedgerHQ/ledger-live/commit/65f87d938ac4158e0ae706593d2a46561097f5a9)]:
  - @ledgerhq/live-env@2.37.0

## 2.6.3-next.0

### Patch Changes

- Updated dependencies [[`5fc817a`](https://github.com/LedgerHQ/ledger-live/commit/5fc817a5ee316396a327e5b10eccd8314bfb2df5), [`65f87d9`](https://github.com/LedgerHQ/ledger-live/commit/65f87d938ac4158e0ae706593d2a46561097f5a9)]:
  - @ledgerhq/live-env@2.37.0-next.0

## 2.6.2

### Patch Changes

- Updated dependencies [[`2eabd7f`](https://github.com/LedgerHQ/ledger-live/commit/2eabd7f56680e1399926a96b4bdeaf628e435999)]:
  - @ledgerhq/live-env@2.36.0

## 2.6.2-next.0

### Patch Changes

- Updated dependencies [[`2eabd7f`](https://github.com/LedgerHQ/ledger-live/commit/2eabd7f56680e1399926a96b4bdeaf628e435999)]:
  - @ledgerhq/live-env@2.36.0-next.0

## 2.6.1

### Patch Changes

- Updated dependencies [[`abdb866`](https://github.com/LedgerHQ/ledger-live/commit/abdb8662fba3784399a747ece63a11cc4f6e23bb), [`5177d5e`](https://github.com/LedgerHQ/ledger-live/commit/5177d5e6311047cc7485a66dbcb8971c9a8c0a5c)]:
  - @ledgerhq/live-env@2.35.0

## 2.6.1-next.0

### Patch Changes

- Updated dependencies [[`abdb866`](https://github.com/LedgerHQ/ledger-live/commit/abdb8662fba3784399a747ece63a11cc4f6e23bb), [`5177d5e`](https://github.com/LedgerHQ/ledger-live/commit/5177d5e6311047cc7485a66dbcb8971c9a8c0a5c)]:
  - @ledgerhq/live-env@2.35.0-next.0

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->

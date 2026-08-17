# @ledgerhq/live-wallet

## 0.11.2

### Patch Changes

- Updated dependencies [[`c475d28`](https://github.com/LedgerHQ/ledger-live/commit/c475d288b4978aa3011c9e76f3e9a1e2f9733010)]:
  - @ledgerhq/live-env@3.0.0
  - @ledgerhq/hw-transport@6.35.7

## 0.11.2-next.0

### Patch Changes

- Updated dependencies [[`c475d28`](https://github.com/LedgerHQ/ledger-live/commit/c475d288b4978aa3011c9e76f3e9a1e2f9733010)]:
  - @ledgerhq/live-env@3.0.0-next.0
  - @ledgerhq/hw-transport@6.35.7-next.0

## 0.11.1

### Patch Changes

- Updated dependencies [[`a15b864`](https://github.com/LedgerHQ/ledger-live/commit/a15b864576d901f15d480070b475314c3b23c1dd), [`fc44f1e`](https://github.com/LedgerHQ/ledger-live/commit/fc44f1e6ddcca939c117e0cb8bc49c404163b003)]:
  - @ledgerhq/live-env@2.42.0

## 0.11.1-next.0

### Patch Changes

- Updated dependencies [[`a15b864`](https://github.com/LedgerHQ/ledger-live/commit/a15b864576d901f15d480070b475314c3b23c1dd), [`fc44f1e`](https://github.com/LedgerHQ/ledger-live/commit/fc44f1e6ddcca939c117e0cb8bc49c404163b003)]:
  - @ledgerhq/live-env@2.42.0-next.0

## 0.11.0

### Minor Changes

- [#18568](https://github.com/LedgerHQ/ledger-live/pull/18568) [`6ddd641`](https://github.com/LedgerHQ/ledger-live/commit/6ddd64113a4c360a091fc1fd54256cfabaab5220) Thanks [@gre-ledger](https://github.com/gre-ledger)! - feat(lkrp): per-application close on Wallet Sync deactivation

  Deactivating Wallet Sync now closes only the current application's stream instead of destroying the whole trustchain root, so other applications sharing the same root (e.g. wallet-cli `ring`) keep working. If the application being closed is the last open one, the whole trustchain is still destroyed (previous behaviour).

  - `CommandStreamResolver` now observes `CloseStream` (`ResolvedCommandStream.isClosed()`).
  - `StreamTree.getApplicationStreams()` / `hasAnotherOpenApplication()` enumerate application streams to detect the last open application.
  - New `TrustchainSDK.destroyApplication()` primitive, software-key signed (no hardware device): closes only the current application's stream, or destroys the whole trustchain when it is the last open application (`{ trustchainDestroyed }`).
  - `restoreTrustchain` throws `TrustchainEjected` when the application stream is closed, and `getOrCreateTrustchain` reopens on the next index after a close.
  - LLD/LLM `useDestroyTrustchain` hooks now call `destroyApplication`.
  - web-tools trustchain playground exposes a `sdk.destroyApplication` action to exercise the per-application close.

### Patch Changes

- Updated dependencies [[`70a706e`](https://github.com/LedgerHQ/ledger-live/commit/70a706e4efe3a6fa176f9827a4a06949ba185f11)]:
  - @ledgerhq/live-env@2.41.0
  - @ledgerhq/hw-transport@6.35.6

## 0.11.0-next.0

### Minor Changes

- [#18568](https://github.com/LedgerHQ/ledger-live/pull/18568) [`6ddd641`](https://github.com/LedgerHQ/ledger-live/commit/6ddd64113a4c360a091fc1fd54256cfabaab5220) Thanks [@gre-ledger](https://github.com/gre-ledger)! - feat(lkrp): per-application close on Wallet Sync deactivation

  Deactivating Wallet Sync now closes only the current application's stream instead of destroying the whole trustchain root, so other applications sharing the same root (e.g. wallet-cli `ring`) keep working. If the application being closed is the last open one, the whole trustchain is still destroyed (previous behaviour).

  - `CommandStreamResolver` now observes `CloseStream` (`ResolvedCommandStream.isClosed()`).
  - `StreamTree.getApplicationStreams()` / `hasAnotherOpenApplication()` enumerate application streams to detect the last open application.
  - New `TrustchainSDK.destroyApplication()` primitive, software-key signed (no hardware device): closes only the current application's stream, or destroys the whole trustchain when it is the last open application (`{ trustchainDestroyed }`).
  - `restoreTrustchain` throws `TrustchainEjected` when the application stream is closed, and `getOrCreateTrustchain` reopens on the next index after a close.
  - LLD/LLM `useDestroyTrustchain` hooks now call `destroyApplication`.
  - web-tools trustchain playground exposes a `sdk.destroyApplication` action to exercise the per-application close.

### Patch Changes

- Updated dependencies [[`70a706e`](https://github.com/LedgerHQ/ledger-live/commit/70a706e4efe3a6fa176f9827a4a06949ba185f11)]:
  - @ledgerhq/live-env@2.41.0-next.0
  - @ledgerhq/hw-transport@6.35.6-next.0

## 0.10.7

### Patch Changes

- Updated dependencies [[`13aeeb6`](https://github.com/LedgerHQ/ledger-live/commit/13aeeb6186997b433785e542ed1dafa6afde2267), [`798081d`](https://github.com/LedgerHQ/ledger-live/commit/798081db3e427c8d2d09930ceb836703146ca1ba)]:
  - @ledgerhq/live-env@2.40.0
  - @ledgerhq/hw-transport@6.35.5

## 0.10.7-next.0

### Patch Changes

- Updated dependencies [[`13aeeb6`](https://github.com/LedgerHQ/ledger-live/commit/13aeeb6186997b433785e542ed1dafa6afde2267), [`798081d`](https://github.com/LedgerHQ/ledger-live/commit/798081db3e427c8d2d09930ceb836703146ca1ba)]:
  - @ledgerhq/live-env@2.40.0-next.0
  - @ledgerhq/hw-transport@6.35.5-next.0

## 0.10.6

### Patch Changes

- Updated dependencies [[`81ceb34`](https://github.com/LedgerHQ/ledger-live/commit/81ceb347c0b2167358c601a9922e2c7fa14a845b), [`9ab3a61`](https://github.com/LedgerHQ/ledger-live/commit/9ab3a6157abb3a382c3157eb292ce9d9d2c6df93), [`eb1dae8`](https://github.com/LedgerHQ/ledger-live/commit/eb1dae8fc14ff8e0bc1e1ce040712492a0328451)]:
  - @ledgerhq/live-env@2.39.0

## 0.10.6-next.0

### Patch Changes

- Updated dependencies [[`81ceb34`](https://github.com/LedgerHQ/ledger-live/commit/81ceb347c0b2167358c601a9922e2c7fa14a845b), [`9ab3a61`](https://github.com/LedgerHQ/ledger-live/commit/9ab3a6157abb3a382c3157eb292ce9d9d2c6df93), [`eb1dae8`](https://github.com/LedgerHQ/ledger-live/commit/eb1dae8fc14ff8e0bc1e1ce040712492a0328451)]:
  - @ledgerhq/live-env@2.39.0-next.0

## 0.10.5

### Patch Changes

- Updated dependencies [[`b14d5cc`](https://github.com/LedgerHQ/ledger-live/commit/b14d5cc29cc75c6be2e565db3d4d0ab400cc56d9), [`ec38133`](https://github.com/LedgerHQ/ledger-live/commit/ec38133ab6b2c18d329e1c78320b7c2a1f80fbfc)]:
  - @ledgerhq/live-env@2.38.0
  - @ledgerhq/hw-transport@6.35.4

## 0.10.5-next.0

### Patch Changes

- Updated dependencies [[`b14d5cc`](https://github.com/LedgerHQ/ledger-live/commit/b14d5cc29cc75c6be2e565db3d4d0ab400cc56d9), [`ec38133`](https://github.com/LedgerHQ/ledger-live/commit/ec38133ab6b2c18d329e1c78320b7c2a1f80fbfc)]:
  - @ledgerhq/live-env@2.38.0-next.0
  - @ledgerhq/hw-transport@6.35.4-next.0

## 0.10.4

### Patch Changes

- Updated dependencies [[`5fc817a`](https://github.com/LedgerHQ/ledger-live/commit/5fc817a5ee316396a327e5b10eccd8314bfb2df5), [`65f87d9`](https://github.com/LedgerHQ/ledger-live/commit/65f87d938ac4158e0ae706593d2a46561097f5a9)]:
  - @ledgerhq/live-env@2.37.0
  - @ledgerhq/hw-transport@6.35.3

## 0.10.4-next.0

### Patch Changes

- Updated dependencies [[`5fc817a`](https://github.com/LedgerHQ/ledger-live/commit/5fc817a5ee316396a327e5b10eccd8314bfb2df5), [`65f87d9`](https://github.com/LedgerHQ/ledger-live/commit/65f87d938ac4158e0ae706593d2a46561097f5a9)]:
  - @ledgerhq/live-env@2.37.0-next.0
  - @ledgerhq/hw-transport@6.35.3-next.0

## 0.10.3

### Patch Changes

- Updated dependencies [[`2eabd7f`](https://github.com/LedgerHQ/ledger-live/commit/2eabd7f56680e1399926a96b4bdeaf628e435999)]:
  - @ledgerhq/live-env@2.36.0

## 0.10.3-next.0

### Patch Changes

- Updated dependencies [[`2eabd7f`](https://github.com/LedgerHQ/ledger-live/commit/2eabd7f56680e1399926a96b4bdeaf628e435999)]:
  - @ledgerhq/live-env@2.36.0-next.0

## 0.10.2

### Patch Changes

- Updated dependencies [[`abdb866`](https://github.com/LedgerHQ/ledger-live/commit/abdb8662fba3784399a747ece63a11cc4f6e23bb), [`5177d5e`](https://github.com/LedgerHQ/ledger-live/commit/5177d5e6311047cc7485a66dbcb8971c9a8c0a5c)]:
  - @ledgerhq/live-env@2.35.0

## 0.10.2-next.0

### Patch Changes

- Updated dependencies [[`abdb866`](https://github.com/LedgerHQ/ledger-live/commit/abdb8662fba3784399a747ece63a11cc4f6e23bb), [`5177d5e`](https://github.com/LedgerHQ/ledger-live/commit/5177d5e6311047cc7485a66dbcb8971c9a8c0a5c)]:
  - @ledgerhq/live-env@2.35.0-next.0

## 0.10.1

### Patch Changes

- Updated dependencies [[`b866ea6`](https://github.com/LedgerHQ/ledger-live/commit/b866ea67bcbd408a33dbc9233ef55298e2a8ef25)]:
  - @ledgerhq/live-env@2.34.0
  - @ledgerhq/hw-transport@6.35.2

## 0.10.1-next.0

### Patch Changes

- Updated dependencies [[`b866ea6`](https://github.com/LedgerHQ/ledger-live/commit/b866ea67bcbd408a33dbc9233ef55298e2a8ef25)]:
  - @ledgerhq/live-env@2.34.0-next.0
  - @ledgerhq/hw-transport@6.35.2-next.0

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->

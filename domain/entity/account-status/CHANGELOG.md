# @domain/entity-account-status

## 0.2.0-next.0

### Minor Changes

- [#25428](https://github.com/LedgerHQ/ledger-live/pull/25428) [`452b4ed`](https://github.com/LedgerHQ/ledger-live/commit/452b4ed3cc44a6c9dc9726dfe0aa840b0cd3babd) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Follow coin-modules ADR-079: the coin module account status answers `activated` instead of `isOnboarded`, each field optional, and the asset activation gate no longer names its method

- [#25436](https://github.com/LedgerHQ/ledger-live/pull/25436) [`8030207`](https://github.com/LedgerHQ/ledger-live/commit/803020759f7f1b66ddeede81a2cd88c4fc36708a) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Keep `@domain/entity-account-descriptor` for the edges: AccountUUID moves to `@domain/entity-account`, NetworkId and Address to the new `@domain/entity-network`, DerivationPath and the legacy path bridges to `@domain/entity-derivation`

### Patch Changes

- Updated dependencies [[`8030207`](https://github.com/LedgerHQ/ledger-live/commit/803020759f7f1b66ddeede81a2cd88c4fc36708a), [`d35cf10`](https://github.com/LedgerHQ/ledger-live/commit/d35cf10970da952fb6a760b6c839f28f0ec85758), [`ed3d726`](https://github.com/LedgerHQ/ledger-live/commit/ed3d726cb936e75f9a54bc782bd97103dafbe51f)]:
  - @domain/entity-account-descriptor@0.8.0-next.0
  - @domain/entity-account@0.5.0-next.0
  - @domain/entity-account-data@0.7.0-next.0
  - @domain/entity-currency@0.5.2-next.0

## 0.1.0

### Minor Changes

- [#24864](https://github.com/LedgerHQ/ledger-live/pull/24864) [`4f46643`](https://github.com/LedgerHQ/ledger-live/commit/4f466432512683457cbdca0ce7b64ddbf678c64d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add the `accountStatus` and `assetStatus` account data kinds: whether an account was ever used and the onboarding it needs before it receives or sends, and per asset the activation it needs before holding it. No source answers them yet

### Patch Changes

- Updated dependencies [[`f8afe58`](https://github.com/LedgerHQ/ledger-live/commit/f8afe58413ae68f5331031c27d9655dca1a56143)]:
  - @domain/entity-account-descriptor@0.7.0
  - @domain/entity-currency@0.5.1
  - @domain/entity-account-data@0.6.1

## 0.1.0-next.0

### Minor Changes

- [#24864](https://github.com/LedgerHQ/ledger-live/pull/24864) [`4f46643`](https://github.com/LedgerHQ/ledger-live/commit/4f466432512683457cbdca0ce7b64ddbf678c64d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add the `accountStatus` and `assetStatus` account data kinds: whether an account was ever used and the onboarding it needs before it receives or sends, and per asset the activation it needs before holding it. No source answers them yet

### Patch Changes

- Updated dependencies [[`f8afe58`](https://github.com/LedgerHQ/ledger-live/commit/f8afe58413ae68f5331031c27d9655dca1a56143)]:
  - @domain/entity-account-descriptor@0.7.0-next.0
  - @domain/entity-currency@0.5.1-next.0
  - @domain/entity-account-data@0.6.1-next.0

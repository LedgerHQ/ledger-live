# @domain/entity-account

## 0.5.0-next.0

### Minor Changes

- [#25436](https://github.com/LedgerHQ/ledger-live/pull/25436) [`8030207`](https://github.com/LedgerHQ/ledger-live/commit/803020759f7f1b66ddeede81a2cd88c4fc36708a) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Keep `@domain/entity-account-descriptor` for the edges: AccountUUID moves to `@domain/entity-account`, NetworkId and Address to the new `@domain/entity-network`, DerivationPath and the legacy path bridges to `@domain/entity-derivation`

- [#25580](https://github.com/LedgerHQ/ledger-live/pull/25580) [`d35cf10`](https://github.com/LedgerHQ/ledger-live/commit/d35cf10970da952fb6a760b6c839f28f0ec85758) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Read the data of accounts discovery found before they are added, through a discoveredAccounts register; move discovery behind the edge-only `@features/platform-account-discovery/descriptor` entry

- [#25579](https://github.com/LedgerHQ/ledger-live/pull/25579) [`ed3d726`](https://github.com/LedgerHQ/ledger-live/commit/ed3d726cb936e75f9a54bc782bd97103dafbe51f) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Receive flow holds only the AccountUUID: network from the asset, assetStatus read for every asset, taproot from the legacy account

### Patch Changes

- Updated dependencies [[`8030207`](https://github.com/LedgerHQ/ledger-live/commit/803020759f7f1b66ddeede81a2cd88c4fc36708a)]:
  - @domain/entity-account-descriptor@0.8.0-next.0

## 0.4.1

### Patch Changes

- Updated dependencies [[`f8afe58`](https://github.com/LedgerHQ/ledger-live/commit/f8afe58413ae68f5331031c27d9655dca1a56143)]:
  - @domain/entity-account-descriptor@0.7.0

## 0.4.1-next.0

### Patch Changes

- Updated dependencies [[`f8afe58`](https://github.com/LedgerHQ/ledger-live/commit/f8afe58413ae68f5331031c27d9655dca1a56143)]:
  - @domain/entity-account-descriptor@0.7.0-next.0

## 0.4.0

### Minor Changes

- [#24745](https://github.com/LedgerHQ/ledger-live/pull/24745) [`5020021`](https://github.com/LedgerHQ/ledger-live/commit/5020021654f743e0e868cb9c8d011adc97f4ed9a) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Account descriptor: one `key` field for both types; Canton, Concordium, Internet Computer, TON, Aptos and Stacks accounts are keyed on their public key, their address computed through the coin module loaders; a legacy account left out is mirrored again once it converts

### Patch Changes

- Updated dependencies [[`5020021`](https://github.com/LedgerHQ/ledger-live/commit/5020021654f743e0e868cb9c8d011adc97f4ed9a), [`8064394`](https://github.com/LedgerHQ/ledger-live/commit/806439433d2c57b13db5a513688db52195bfc163)]:
  - @domain/entity-account-descriptor@0.6.0

## 0.4.0-next.0

### Minor Changes

- [#24745](https://github.com/LedgerHQ/ledger-live/pull/24745) [`5020021`](https://github.com/LedgerHQ/ledger-live/commit/5020021654f743e0e868cb9c8d011adc97f4ed9a) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Account descriptor: one `key` field for both types; Canton, Concordium, Internet Computer, TON, Aptos and Stacks accounts are keyed on their public key, their address computed through the coin module loaders; a legacy account left out is mirrored again once it converts

### Patch Changes

- Updated dependencies [[`5020021`](https://github.com/LedgerHQ/ledger-live/commit/5020021654f743e0e868cb9c8d011adc97f4ed9a), [`8064394`](https://github.com/LedgerHQ/ledger-live/commit/806439433d2c57b13db5a513688db52195bfc163)]:
  - @domain/entity-account-descriptor@0.6.0-next.0

## 0.3.0

### Minor Changes

- [#24392](https://github.com/LedgerHQ/ledger-live/pull/24392) [`934970a`](https://github.com/LedgerHQ/ledger-live/commit/934970adec67ed88f1d546d03b1bb555cbfd128f) Thanks [@renovate-operator-ledger](https://github.com/apps/renovate-operator-ledger)! - chore(deps): update dependency @reduxjs/toolkit to v2.13.0

  - Updated `@reduxjs/toolkit` to `2.13.0`

### Patch Changes

- Updated dependencies [[`842a9a5`](https://github.com/LedgerHQ/ledger-live/commit/842a9a547be2224eec86295c57c288f0c51f8fbd)]:
  - @domain/entity-account-descriptor@0.5.0

## 0.3.0-next.0

### Minor Changes

- [#24392](https://github.com/LedgerHQ/ledger-live/pull/24392) [`934970a`](https://github.com/LedgerHQ/ledger-live/commit/934970adec67ed88f1d546d03b1bb555cbfd128f) Thanks [@renovate-operator-ledger](https://github.com/apps/renovate-operator-ledger)! - chore(deps): update dependency @reduxjs/toolkit to v2.13.0

  - Updated `@reduxjs/toolkit` to `2.13.0`

### Patch Changes

- Updated dependencies [[`842a9a5`](https://github.com/LedgerHQ/ledger-live/commit/842a9a547be2224eec86295c57c288f0c51f8fbd)]:
  - @domain/entity-account-descriptor@0.5.0-next.0

## 0.2.0

### Minor Changes

- [#23787](https://github.com/LedgerHQ/ledger-live/pull/23787) [`b79c360`](https://github.com/LedgerHQ/ledger-live/commit/b79c360ab24df820c11299c080538fd40ddef820) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add a `mock-accounts` devtool: `mock:2:…` descriptors served by a lazy-loaded MockSource, with their balances and paginated operations

### Patch Changes

- Updated dependencies [[`b79c360`](https://github.com/LedgerHQ/ledger-live/commit/b79c360ab24df820c11299c080538fd40ddef820)]:
  - @domain/entity-account-descriptor@0.4.0

## 0.2.0-next.0

### Minor Changes

- [#23787](https://github.com/LedgerHQ/ledger-live/pull/23787) [`b79c360`](https://github.com/LedgerHQ/ledger-live/commit/b79c360ab24df820c11299c080538fd40ddef820) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add a `mock-accounts` devtool: `mock:2:…` descriptors served by a lazy-loaded MockSource, with their balances and paginated operations

### Patch Changes

- Updated dependencies [[`b79c360`](https://github.com/LedgerHQ/ledger-live/commit/b79c360ab24df820c11299c080538fd40ddef820)]:
  - @domain/entity-account-descriptor@0.4.0-next.0

## 0.1.1

### Patch Changes

- Updated dependencies [[`fd6a3a3`](https://github.com/LedgerHQ/ledger-live/commit/fd6a3a341b07baa2849a9e79e3a05b73863034b7)]:
  - @domain/entity-account-descriptor@0.3.0

## 0.1.1-next.0

### Patch Changes

- Updated dependencies [[`fd6a3a3`](https://github.com/LedgerHQ/ledger-live/commit/fd6a3a341b07baa2849a9e79e3a05b73863034b7)]:
  - @domain/entity-account-descriptor@0.3.0-next.0

## 0.1.0

### Minor Changes

- [#23436](https://github.com/LedgerHQ/ledger-live/pull/23436) [`f51fe16`](https://github.com/LedgerHQ/ledger-live/commit/f51fe16f67f2c50f36d772a60121ed3d7ae12c6a) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add the accounts slice, keyed by AccountUUID and kept in sync with the legacy accounts

- [#23443](https://github.com/LedgerHQ/ledger-live/pull/23443) [`7e54483`](https://github.com/LedgerHQ/ledger-live/commit/7e544837b934b55e0743faaabacfc89d922e9435) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Move the legacy account ids to src/legacy/

### Patch Changes

- Updated dependencies []:
  - @domain/entity-account-descriptor@0.2.1

## 0.1.0-next.0

### Minor Changes

- [#23436](https://github.com/LedgerHQ/ledger-live/pull/23436) [`f51fe16`](https://github.com/LedgerHQ/ledger-live/commit/f51fe16f67f2c50f36d772a60121ed3d7ae12c6a) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add the accounts slice, keyed by AccountUUID and kept in sync with the legacy accounts

- [#23443](https://github.com/LedgerHQ/ledger-live/pull/23443) [`7e54483`](https://github.com/LedgerHQ/ledger-live/commit/7e544837b934b55e0743faaabacfc89d922e9435) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Move the legacy account ids to src/legacy/

### Patch Changes

- Updated dependencies []:
  - @domain/entity-account-descriptor@0.2.1-next.0

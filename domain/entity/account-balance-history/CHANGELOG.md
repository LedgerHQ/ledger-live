# @domain/entity-account-balance-history

## 0.2.0-next.0

### Minor Changes

- [#24370](https://github.com/LedgerHQ/ledger-live/pull/24370) [`cea0076`](https://github.com/LedgerHQ/ledger-live/commit/cea0076fb3fd7c19d0e73b99ac76507278e390a4) Thanks [@ysitbon](https://github.com/ysitbon)! - Add `CryptoOrTokenCurrencyIdSchema` and `CryptoOrTokenCurrencyId` to `@domain/entity-currency`, replacing the duplicated `BalanceAssetIdSchema`, `ContactCurrencyIdSchema` and the send flow's local union. Runtime parsing is unchanged.

- [#24392](https://github.com/LedgerHQ/ledger-live/pull/24392) [`934970a`](https://github.com/LedgerHQ/ledger-live/commit/934970adec67ed88f1d546d03b1bb555cbfd128f) Thanks [@renovate-operator-ledger](https://github.com/apps/renovate-operator-ledger)! - chore(deps): update dependency @reduxjs/toolkit to v2.13.0

  - Updated `@reduxjs/toolkit` to `2.13.0`

### Patch Changes

- Updated dependencies [[`842a9a5`](https://github.com/LedgerHQ/ledger-live/commit/842a9a547be2224eec86295c57c288f0c51f8fbd), [`cea0076`](https://github.com/LedgerHQ/ledger-live/commit/cea0076fb3fd7c19d0e73b99ac76507278e390a4), [`934970a`](https://github.com/LedgerHQ/ledger-live/commit/934970adec67ed88f1d546d03b1bb555cbfd128f)]:
  - @domain/entity-account-descriptor@0.5.0-next.0
  - @domain/entity-currency@0.5.0-next.0
  - @domain/entity-account-balance@0.3.0-next.0
  - @domain/entity-account-data@0.5.0-next.0

## 0.1.0

### Minor Changes

- [#24185](https://github.com/LedgerHQ/ledger-live/pull/24185) [`304b8b2`](https://github.com/LedgerHQ/ledger-live/commit/304b8b2575f6adfa895b50b6697febd1ccab7e7e) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Store account data status and the operations windows per query, and keep the newest copy of an operation shared by several queries

- [#24162](https://github.com/LedgerHQ/ledger-live/pull/24162) [`08324bd`](https://github.com/LedgerHQ/ledger-live/commit/08324bd138b45b83dc0b763cddc284411a4e9577) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add the account balance history entity, one series per asset for a range

### Patch Changes

- Updated dependencies [[`304b8b2`](https://github.com/LedgerHQ/ledger-live/commit/304b8b2575f6adfa895b50b6697febd1ccab7e7e), [`b79c360`](https://github.com/LedgerHQ/ledger-live/commit/b79c360ab24df820c11299c080538fd40ddef820)]:
  - @domain/entity-account-data@0.4.0
  - @domain/entity-account-descriptor@0.4.0
  - @domain/entity-account-balance@0.2.2

## 0.1.0-next.0

### Minor Changes

- [#24185](https://github.com/LedgerHQ/ledger-live/pull/24185) [`304b8b2`](https://github.com/LedgerHQ/ledger-live/commit/304b8b2575f6adfa895b50b6697febd1ccab7e7e) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Store account data status and the operations windows per query, and keep the newest copy of an operation shared by several queries

- [#24162](https://github.com/LedgerHQ/ledger-live/pull/24162) [`08324bd`](https://github.com/LedgerHQ/ledger-live/commit/08324bd138b45b83dc0b763cddc284411a4e9577) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add the account balance history entity, one series per asset for a range

### Patch Changes

- Updated dependencies [[`304b8b2`](https://github.com/LedgerHQ/ledger-live/commit/304b8b2575f6adfa895b50b6697febd1ccab7e7e), [`b79c360`](https://github.com/LedgerHQ/ledger-live/commit/b79c360ab24df820c11299c080538fd40ddef820)]:
  - @domain/entity-account-data@0.4.0-next.0
  - @domain/entity-account-descriptor@0.4.0-next.0
  - @domain/entity-account-balance@0.2.2-next.0

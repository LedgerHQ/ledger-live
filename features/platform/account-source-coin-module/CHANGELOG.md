# @features/platform-account-source-coin-module

## 0.1.0

### Minor Changes

- [#24113](https://github.com/LedgerHQ/ledger-live/pull/24113) [`198fa76`](https://github.com/LedgerHQ/ledger-live/commit/198fa76df6b3048033c21a723be51eebda95bd88) Thanks [@dilaouid](https://github.com/dilaouid)! - Add the coin module account data source, reading the balance of an account from its coin module, ranked before the full sync source

- [#24177](https://github.com/LedgerHQ/ledger-live/pull/24177) [`e6382fe`](https://github.com/LedgerHQ/ledger-live/commit/e6382fec7ac8b74c432990ecfe9a49224267bb77) Thanks [@dilaouid](https://github.com/dilaouid)! - Read the operations of an account page by page from its coin module, the gas of token transfers included; the apps keep reading operations from the full sync until pending operations are listed

### Patch Changes

- Updated dependencies [[`eebea9e`](https://github.com/LedgerHQ/ledger-live/commit/eebea9eabe809bf103fb3b7337d091a17a5faa64), [`304b8b2`](https://github.com/LedgerHQ/ledger-live/commit/304b8b2575f6adfa895b50b6697febd1ccab7e7e), [`b79c360`](https://github.com/LedgerHQ/ledger-live/commit/b79c360ab24df820c11299c080538fd40ddef820)]:
  - @domain/entity-account-operation@0.1.0
  - @domain/entity-account-data@0.4.0
  - @domain/api-account-data@0.4.0
  - @domain/entity-account-descriptor@0.4.0
  - @domain/entity-account-balance@0.2.2

## 0.1.0-next.0

### Minor Changes

- [#24113](https://github.com/LedgerHQ/ledger-live/pull/24113) [`198fa76`](https://github.com/LedgerHQ/ledger-live/commit/198fa76df6b3048033c21a723be51eebda95bd88) Thanks [@dilaouid](https://github.com/dilaouid)! - Add the coin module account data source, reading the balance of an account from its coin module, ranked before the full sync source

- [#24177](https://github.com/LedgerHQ/ledger-live/pull/24177) [`e6382fe`](https://github.com/LedgerHQ/ledger-live/commit/e6382fec7ac8b74c432990ecfe9a49224267bb77) Thanks [@dilaouid](https://github.com/dilaouid)! - Read the operations of an account page by page from its coin module, the gas of token transfers included; the apps keep reading operations from the full sync until pending operations are listed

### Patch Changes

- Updated dependencies [[`eebea9e`](https://github.com/LedgerHQ/ledger-live/commit/eebea9eabe809bf103fb3b7337d091a17a5faa64), [`304b8b2`](https://github.com/LedgerHQ/ledger-live/commit/304b8b2575f6adfa895b50b6697febd1ccab7e7e), [`b79c360`](https://github.com/LedgerHQ/ledger-live/commit/b79c360ab24df820c11299c080538fd40ddef820)]:
  - @domain/entity-account-operation@0.1.0-next.0
  - @domain/entity-account-data@0.4.0-next.0
  - @domain/api-account-data@0.4.0-next.0
  - @domain/entity-account-descriptor@0.4.0-next.0
  - @domain/entity-account-balance@0.2.2-next.0

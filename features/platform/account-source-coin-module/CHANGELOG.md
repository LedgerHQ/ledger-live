# @features/platform-account-source-coin-module

## 0.3.0-next.0

### Minor Changes

- [#24745](https://github.com/LedgerHQ/ledger-live/pull/24745) [`5020021`](https://github.com/LedgerHQ/ledger-live/commit/5020021654f743e0e868cb9c8d011adc97f4ed9a) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Account descriptor: one `key` field for both types; Canton, Concordium, Internet Computer, TON, Aptos and Stacks accounts are keyed on their public key, their address computed through the coin module loaders; a legacy account left out is mirrored again once it converts

### Patch Changes

- Updated dependencies [[`9f10baf`](https://github.com/LedgerHQ/ledger-live/commit/9f10bafef466914b2536c7e509ff7c3c2c49b5c8), [`0fc43ab`](https://github.com/LedgerHQ/ledger-live/commit/0fc43ab03928e17d2da761f747ec0c449228d4aa), [`5020021`](https://github.com/LedgerHQ/ledger-live/commit/5020021654f743e0e868cb9c8d011adc97f4ed9a), [`8064394`](https://github.com/LedgerHQ/ledger-live/commit/806439433d2c57b13db5a513688db52195bfc163), [`0cf44d5`](https://github.com/LedgerHQ/ledger-live/commit/0cf44d56a449fb0f4448cd6f8e02c880fc47adb2)]:
  - @domain/api-account-data@0.6.0-next.0
  - @domain/entity-account-descriptor@0.6.0-next.0
  - @domain/entity-account-data@0.6.0-next.0
  - @domain/entity-account-operation@0.3.0-next.0
  - @domain/entity-account-balance@0.3.1-next.0

## 0.2.0

### Minor Changes

- [#24214](https://github.com/LedgerHQ/ledger-live/pull/24214) [`522d62b`](https://github.com/LedgerHQ/ledger-live/commit/522d62b80064e808746ad88be9c79d8477b1bf44) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Read the operations of one asset of an account with the `filterAsset` query

### Patch Changes

- Updated dependencies [[`7185de6`](https://github.com/LedgerHQ/ledger-live/commit/7185de6c3886010f3eac7cee2128eb883230e872), [`522d62b`](https://github.com/LedgerHQ/ledger-live/commit/522d62b80064e808746ad88be9c79d8477b1bf44), [`ac116ba`](https://github.com/LedgerHQ/ledger-live/commit/ac116baae8763f331fd21885be36474933b52dff), [`842a9a5`](https://github.com/LedgerHQ/ledger-live/commit/842a9a547be2224eec86295c57c288f0c51f8fbd), [`cea0076`](https://github.com/LedgerHQ/ledger-live/commit/cea0076fb3fd7c19d0e73b99ac76507278e390a4), [`934970a`](https://github.com/LedgerHQ/ledger-live/commit/934970adec67ed88f1d546d03b1bb555cbfd128f)]:
  - @domain/entity-account-operation@0.2.0
  - @domain/entity-account-descriptor@0.5.0
  - @domain/api-account-data@0.5.0
  - @domain/entity-account-balance@0.3.0
  - @domain/entity-account-data@0.5.0

## 0.2.0-next.0

### Minor Changes

- [#24214](https://github.com/LedgerHQ/ledger-live/pull/24214) [`522d62b`](https://github.com/LedgerHQ/ledger-live/commit/522d62b80064e808746ad88be9c79d8477b1bf44) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Read the operations of one asset of an account with the `filterAsset` query

### Patch Changes

- Updated dependencies [[`7185de6`](https://github.com/LedgerHQ/ledger-live/commit/7185de6c3886010f3eac7cee2128eb883230e872), [`522d62b`](https://github.com/LedgerHQ/ledger-live/commit/522d62b80064e808746ad88be9c79d8477b1bf44), [`ac116ba`](https://github.com/LedgerHQ/ledger-live/commit/ac116baae8763f331fd21885be36474933b52dff), [`842a9a5`](https://github.com/LedgerHQ/ledger-live/commit/842a9a547be2224eec86295c57c288f0c51f8fbd), [`cea0076`](https://github.com/LedgerHQ/ledger-live/commit/cea0076fb3fd7c19d0e73b99ac76507278e390a4), [`934970a`](https://github.com/LedgerHQ/ledger-live/commit/934970adec67ed88f1d546d03b1bb555cbfd128f)]:
  - @domain/entity-account-operation@0.2.0-next.0
  - @domain/entity-account-descriptor@0.5.0-next.0
  - @domain/api-account-data@0.5.0-next.0
  - @domain/entity-account-balance@0.3.0-next.0
  - @domain/entity-account-data@0.5.0-next.0

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

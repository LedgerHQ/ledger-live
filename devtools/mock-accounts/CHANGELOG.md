# @devtools/mock-accounts

## 0.4.0-next.0

### Minor Changes

- [#24745](https://github.com/LedgerHQ/ledger-live/pull/24745) [`5020021`](https://github.com/LedgerHQ/ledger-live/commit/5020021654f743e0e868cb9c8d011adc97f4ed9a) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Account descriptor: one `key` field for both types; Canton, Concordium, Internet Computer, TON, Aptos and Stacks accounts are keyed on their public key, their address computed through the coin module loaders; a legacy account left out is mirrored again once it converts

- [#24691](https://github.com/LedgerHQ/ledger-live/pull/24691) [`81d566b`](https://github.com/LedgerHQ/ledger-live/commit/81d566bd4b2fc0b72f4317aee917975601cd97b2) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add the account-receive DevTools tool, reading the `receive` kind per account, and the `receive` kind to the mock source

- [#24747](https://github.com/LedgerHQ/ledger-live/pull/24747) [`8b743fb`](https://github.com/LedgerHQ/ledger-live/commit/8b743fb4d98b915eac60d3b7a991dbe6a03f2b03) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Value each balance history point in the fiat a query asks for, at its date, with the `countervalue` query

### Patch Changes

- Updated dependencies [[`9f10baf`](https://github.com/LedgerHQ/ledger-live/commit/9f10bafef466914b2536c7e509ff7c3c2c49b5c8), [`0fc43ab`](https://github.com/LedgerHQ/ledger-live/commit/0fc43ab03928e17d2da761f747ec0c449228d4aa), [`5020021`](https://github.com/LedgerHQ/ledger-live/commit/5020021654f743e0e868cb9c8d011adc97f4ed9a), [`8064394`](https://github.com/LedgerHQ/ledger-live/commit/806439433d2c57b13db5a513688db52195bfc163), [`d5d2516`](https://github.com/LedgerHQ/ledger-live/commit/d5d2516e82d0ee1984fcff0357cc0406eca91c48), [`8b743fb`](https://github.com/LedgerHQ/ledger-live/commit/8b743fb4d98b915eac60d3b7a991dbe6a03f2b03), [`0cf44d5`](https://github.com/LedgerHQ/ledger-live/commit/0cf44d56a449fb0f4448cd6f8e02c880fc47adb2)]:
  - @domain/api-account-data@0.6.0-next.0
  - @domain/entity-account-descriptor@0.6.0-next.0
  - @domain/entity-account-receive@0.1.0-next.0
  - @domain/entity-account-data@0.6.0-next.0
  - @domain/entity-account-operation@0.3.0-next.0
  - @domain/entity-account-balance-history@0.3.0-next.0
  - @domain/entity-account-balance@0.3.1-next.0

## 0.3.0

### Minor Changes

- [#24215](https://github.com/LedgerHQ/ledger-live/pull/24215) [`7185de6`](https://github.com/LedgerHQ/ledger-live/commit/7185de6c3886010f3eac7cee2128eb883230e872) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Value each operation in the fiat a query asks for, at its date, with the `countervalue` query

- [#24214](https://github.com/LedgerHQ/ledger-live/pull/24214) [`522d62b`](https://github.com/LedgerHQ/ledger-live/commit/522d62b80064e808746ad88be9c79d8477b1bf44) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Read the operations of one asset of an account with the `filterAsset` query

- [#24311](https://github.com/LedgerHQ/ledger-live/pull/24311) [`ac116ba`](https://github.com/LedgerHQ/ledger-live/commit/ac116baae8763f331fd21885be36474933b52dff) Thanks [@ysitbon](https://github.com/ysitbon)! - Brand the fiat currency ticker as `FiatCurrencyTicker` (three uppercase letters) in `@domain/entity-currency-fiat` and use it for operation countervalues and the analytics fiat, replacing `CountervalueTicker` and the unused `FiatCurrencyId`.

- [#24272](https://github.com/LedgerHQ/ledger-live/pull/24272) [`842a9a5`](https://github.com/LedgerHQ/ledger-live/commit/842a9a547be2224eec86295c57c288f0c51f8fbd) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Brand the account descriptor network as `NetworkId`, distinct from `CryptoCurrencyId`, bridged only by `currencyIdFromNetwork` and `networkFromCurrencyId`

### Patch Changes

- Updated dependencies [[`7185de6`](https://github.com/LedgerHQ/ledger-live/commit/7185de6c3886010f3eac7cee2128eb883230e872), [`522d62b`](https://github.com/LedgerHQ/ledger-live/commit/522d62b80064e808746ad88be9c79d8477b1bf44), [`a95a6bc`](https://github.com/LedgerHQ/ledger-live/commit/a95a6bcb630289fde6782430fb511b9c48c9ffcc), [`ac116ba`](https://github.com/LedgerHQ/ledger-live/commit/ac116baae8763f331fd21885be36474933b52dff), [`842a9a5`](https://github.com/LedgerHQ/ledger-live/commit/842a9a547be2224eec86295c57c288f0c51f8fbd), [`cea0076`](https://github.com/LedgerHQ/ledger-live/commit/cea0076fb3fd7c19d0e73b99ac76507278e390a4), [`31f7eba`](https://github.com/LedgerHQ/ledger-live/commit/31f7ebace98301cb3e46185a91621aa3ef59bb3b), [`7324065`](https://github.com/LedgerHQ/ledger-live/commit/732406590c11eca310f977f401429e4e1270c4b4), [`934970a`](https://github.com/LedgerHQ/ledger-live/commit/934970adec67ed88f1d546d03b1bb555cbfd128f), [`e7b21f8`](https://github.com/LedgerHQ/ledger-live/commit/e7b21f816021dbbe7314ff51bf32cc4d87291b98)]:
  - @domain/entity-account-operation@0.2.0
  - @domain/entity-currency-crypto@0.19.0
  - @domain/entity-currency-fiat@0.6.0
  - @domain/entity-account-descriptor@0.5.0
  - @domain/api-account-data@0.5.0
  - @domain/entity-account-balance@0.3.0
  - @domain/entity-account-balance-history@0.2.0
  - @domain/entity-account-data@0.5.0

## 0.3.0-next.0

### Minor Changes

- [#24215](https://github.com/LedgerHQ/ledger-live/pull/24215) [`7185de6`](https://github.com/LedgerHQ/ledger-live/commit/7185de6c3886010f3eac7cee2128eb883230e872) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Value each operation in the fiat a query asks for, at its date, with the `countervalue` query

- [#24214](https://github.com/LedgerHQ/ledger-live/pull/24214) [`522d62b`](https://github.com/LedgerHQ/ledger-live/commit/522d62b80064e808746ad88be9c79d8477b1bf44) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Read the operations of one asset of an account with the `filterAsset` query

- [#24311](https://github.com/LedgerHQ/ledger-live/pull/24311) [`ac116ba`](https://github.com/LedgerHQ/ledger-live/commit/ac116baae8763f331fd21885be36474933b52dff) Thanks [@ysitbon](https://github.com/ysitbon)! - Brand the fiat currency ticker as `FiatCurrencyTicker` (three uppercase letters) in `@domain/entity-currency-fiat` and use it for operation countervalues and the analytics fiat, replacing `CountervalueTicker` and the unused `FiatCurrencyId`.

- [#24272](https://github.com/LedgerHQ/ledger-live/pull/24272) [`842a9a5`](https://github.com/LedgerHQ/ledger-live/commit/842a9a547be2224eec86295c57c288f0c51f8fbd) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Brand the account descriptor network as `NetworkId`, distinct from `CryptoCurrencyId`, bridged only by `currencyIdFromNetwork` and `networkFromCurrencyId`

### Patch Changes

- Updated dependencies [[`7185de6`](https://github.com/LedgerHQ/ledger-live/commit/7185de6c3886010f3eac7cee2128eb883230e872), [`522d62b`](https://github.com/LedgerHQ/ledger-live/commit/522d62b80064e808746ad88be9c79d8477b1bf44), [`a95a6bc`](https://github.com/LedgerHQ/ledger-live/commit/a95a6bcb630289fde6782430fb511b9c48c9ffcc), [`ac116ba`](https://github.com/LedgerHQ/ledger-live/commit/ac116baae8763f331fd21885be36474933b52dff), [`842a9a5`](https://github.com/LedgerHQ/ledger-live/commit/842a9a547be2224eec86295c57c288f0c51f8fbd), [`cea0076`](https://github.com/LedgerHQ/ledger-live/commit/cea0076fb3fd7c19d0e73b99ac76507278e390a4), [`31f7eba`](https://github.com/LedgerHQ/ledger-live/commit/31f7ebace98301cb3e46185a91621aa3ef59bb3b), [`7324065`](https://github.com/LedgerHQ/ledger-live/commit/732406590c11eca310f977f401429e4e1270c4b4), [`934970a`](https://github.com/LedgerHQ/ledger-live/commit/934970adec67ed88f1d546d03b1bb555cbfd128f), [`e7b21f8`](https://github.com/LedgerHQ/ledger-live/commit/e7b21f816021dbbe7314ff51bf32cc4d87291b98)]:
  - @domain/entity-account-operation@0.2.0-next.0
  - @domain/entity-currency-crypto@0.19.0-next.0
  - @domain/entity-currency-fiat@0.6.0-next.0
  - @domain/entity-account-descriptor@0.5.0-next.0
  - @domain/api-account-data@0.5.0-next.0
  - @domain/entity-account-balance@0.3.0-next.0
  - @domain/entity-account-balance-history@0.2.0-next.0
  - @domain/entity-account-data@0.5.0-next.0

## 0.2.0

### Minor Changes

- [#24169](https://github.com/LedgerHQ/ledger-live/pull/24169) [`a9d19d0`](https://github.com/LedgerHQ/ledger-live/commit/a9d19d080fbf0310c6fb7454784e8ac0682dfb51) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Mount the account balance histories slice, add a Balance history page to the DevTools Accounts section and serve the balanceHistory kind for mock accounts

- [#23787](https://github.com/LedgerHQ/ledger-live/pull/23787) [`b79c360`](https://github.com/LedgerHQ/ledger-live/commit/b79c360ab24df820c11299c080538fd40ddef820) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add a `mock-accounts` devtool: `mock:2:…` descriptors served by a lazy-loaded MockSource, with their balances and paginated operations

### Patch Changes

- Updated dependencies [[`eebea9e`](https://github.com/LedgerHQ/ledger-live/commit/eebea9eabe809bf103fb3b7337d091a17a5faa64), [`304b8b2`](https://github.com/LedgerHQ/ledger-live/commit/304b8b2575f6adfa895b50b6697febd1ccab7e7e), [`08324bd`](https://github.com/LedgerHQ/ledger-live/commit/08324bd138b45b83dc0b763cddc284411a4e9577), [`9907890`](https://github.com/LedgerHQ/ledger-live/commit/9907890790bf8b804d7cc454a067508df0969137), [`b79c360`](https://github.com/LedgerHQ/ledger-live/commit/b79c360ab24df820c11299c080538fd40ddef820), [`77a85a3`](https://github.com/LedgerHQ/ledger-live/commit/77a85a30abe7b42e5f5b4e0478bec14fa39033cf)]:
  - @domain/entity-account-operation@0.1.0
  - @domain/entity-account-data@0.4.0
  - @domain/api-account-data@0.4.0
  - @domain/entity-account-balance-history@0.1.0
  - @domain/entity-currency-crypto@0.18.0
  - @domain/entity-account-descriptor@0.4.0
  - @domain/entity-account-balance@0.2.2

## 0.2.0-next.0

### Minor Changes

- [#24169](https://github.com/LedgerHQ/ledger-live/pull/24169) [`a9d19d0`](https://github.com/LedgerHQ/ledger-live/commit/a9d19d080fbf0310c6fb7454784e8ac0682dfb51) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Mount the account balance histories slice, add a Balance history page to the DevTools Accounts section and serve the balanceHistory kind for mock accounts

- [#23787](https://github.com/LedgerHQ/ledger-live/pull/23787) [`b79c360`](https://github.com/LedgerHQ/ledger-live/commit/b79c360ab24df820c11299c080538fd40ddef820) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add a `mock-accounts` devtool: `mock:2:…` descriptors served by a lazy-loaded MockSource, with their balances and paginated operations

### Patch Changes

- Updated dependencies [[`eebea9e`](https://github.com/LedgerHQ/ledger-live/commit/eebea9eabe809bf103fb3b7337d091a17a5faa64), [`304b8b2`](https://github.com/LedgerHQ/ledger-live/commit/304b8b2575f6adfa895b50b6697febd1ccab7e7e), [`08324bd`](https://github.com/LedgerHQ/ledger-live/commit/08324bd138b45b83dc0b763cddc284411a4e9577), [`9907890`](https://github.com/LedgerHQ/ledger-live/commit/9907890790bf8b804d7cc454a067508df0969137), [`b79c360`](https://github.com/LedgerHQ/ledger-live/commit/b79c360ab24df820c11299c080538fd40ddef820), [`77a85a3`](https://github.com/LedgerHQ/ledger-live/commit/77a85a30abe7b42e5f5b4e0478bec14fa39033cf)]:
  - @domain/entity-account-operation@0.1.0-next.0
  - @domain/entity-account-data@0.4.0-next.0
  - @domain/api-account-data@0.4.0-next.0
  - @domain/entity-account-balance-history@0.1.0-next.0
  - @domain/entity-currency-crypto@0.18.0-next.0
  - @domain/entity-account-descriptor@0.4.0-next.0
  - @domain/entity-account-balance@0.2.2-next.0

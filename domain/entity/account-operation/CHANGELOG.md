# @domain/entity-account-operation

## 0.3.0-next.0

### Minor Changes

- [#24674](https://github.com/LedgerHQ/ledger-live/pull/24674) [`8064394`](https://github.com/LedgerHQ/ledger-live/commit/806439433d2c57b13db5a513688db52195bfc163) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add the `receive` account data kind: on which address an account receives and how the device confirms it, read by the full-sync source. The branded `Address` moves from `@domain/entity-account-operation` to `@domain/entity-account-descriptor`, next to the new `DerivationPathSchema`

- [#24735](https://github.com/LedgerHQ/ledger-live/pull/24735) [`0cf44d5`](https://github.com/LedgerHQ/ledger-live/commit/0cf44d56a449fb0f4448cd6f8e02c880fc47adb2) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - Add the `OPT_EDIT` operation type and `BridgeApi.tokenOptParentRow`. XRP tokens: opt-in and opt-out history rows keep their type, a pending edit is an `OPT_EDIT`, IOU device review fields, IOU amounts from fiat or the 25/50/75 % buttons rounded to 16 significant digits, error texts, send errors on the LWD amount step, and LWD Token settings messages for a limit of 0 and a limit below the balance

### Patch Changes

- Updated dependencies [[`5020021`](https://github.com/LedgerHQ/ledger-live/commit/5020021654f743e0e868cb9c8d011adc97f4ed9a), [`8064394`](https://github.com/LedgerHQ/ledger-live/commit/806439433d2c57b13db5a513688db52195bfc163)]:
  - @domain/entity-account-descriptor@0.6.0-next.0
  - @domain/entity-account-data@0.6.0-next.0
  - @domain/entity-account-balance@0.3.1-next.0

## 0.2.0

### Minor Changes

- [#24215](https://github.com/LedgerHQ/ledger-live/pull/24215) [`7185de6`](https://github.com/LedgerHQ/ledger-live/commit/7185de6c3886010f3eac7cee2128eb883230e872) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Value each operation in the fiat a query asks for, at its date, with the `countervalue` query

- [#24214](https://github.com/LedgerHQ/ledger-live/pull/24214) [`522d62b`](https://github.com/LedgerHQ/ledger-live/commit/522d62b80064e808746ad88be9c79d8477b1bf44) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Read the operations of one asset of an account with the `filterAsset` query

- [#24311](https://github.com/LedgerHQ/ledger-live/pull/24311) [`ac116ba`](https://github.com/LedgerHQ/ledger-live/commit/ac116baae8763f331fd21885be36474933b52dff) Thanks [@ysitbon](https://github.com/ysitbon)! - Brand the fiat currency ticker as `FiatCurrencyTicker` (three uppercase letters) in `@domain/entity-currency-fiat` and use it for operation countervalues and the analytics fiat, replacing `CountervalueTicker` and the unused `FiatCurrencyId`.

- [#24370](https://github.com/LedgerHQ/ledger-live/pull/24370) [`cea0076`](https://github.com/LedgerHQ/ledger-live/commit/cea0076fb3fd7c19d0e73b99ac76507278e390a4) Thanks [@ysitbon](https://github.com/ysitbon)! - Add `CryptoOrTokenCurrencyIdSchema` and `CryptoOrTokenCurrencyId` to `@domain/entity-currency`, replacing the duplicated `BalanceAssetIdSchema`, `ContactCurrencyIdSchema` and the send flow's local union. Runtime parsing is unchanged.

- [#24392](https://github.com/LedgerHQ/ledger-live/pull/24392) [`934970a`](https://github.com/LedgerHQ/ledger-live/commit/934970adec67ed88f1d546d03b1bb555cbfd128f) Thanks [@renovate-operator-ledger](https://github.com/apps/renovate-operator-ledger)! - chore(deps): update dependency @reduxjs/toolkit to v2.13.0

  - Updated `@reduxjs/toolkit` to `2.13.0`

### Patch Changes

- Updated dependencies [[`ac116ba`](https://github.com/LedgerHQ/ledger-live/commit/ac116baae8763f331fd21885be36474933b52dff), [`842a9a5`](https://github.com/LedgerHQ/ledger-live/commit/842a9a547be2224eec86295c57c288f0c51f8fbd), [`cea0076`](https://github.com/LedgerHQ/ledger-live/commit/cea0076fb3fd7c19d0e73b99ac76507278e390a4), [`934970a`](https://github.com/LedgerHQ/ledger-live/commit/934970adec67ed88f1d546d03b1bb555cbfd128f)]:
  - @domain/entity-currency-fiat@0.6.0
  - @domain/entity-account-descriptor@0.5.0
  - @domain/entity-currency@0.5.0
  - @domain/entity-account-balance@0.3.0
  - @domain/entity-account-data@0.5.0

## 0.2.0-next.0

### Minor Changes

- [#24215](https://github.com/LedgerHQ/ledger-live/pull/24215) [`7185de6`](https://github.com/LedgerHQ/ledger-live/commit/7185de6c3886010f3eac7cee2128eb883230e872) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Value each operation in the fiat a query asks for, at its date, with the `countervalue` query

- [#24214](https://github.com/LedgerHQ/ledger-live/pull/24214) [`522d62b`](https://github.com/LedgerHQ/ledger-live/commit/522d62b80064e808746ad88be9c79d8477b1bf44) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Read the operations of one asset of an account with the `filterAsset` query

- [#24311](https://github.com/LedgerHQ/ledger-live/pull/24311) [`ac116ba`](https://github.com/LedgerHQ/ledger-live/commit/ac116baae8763f331fd21885be36474933b52dff) Thanks [@ysitbon](https://github.com/ysitbon)! - Brand the fiat currency ticker as `FiatCurrencyTicker` (three uppercase letters) in `@domain/entity-currency-fiat` and use it for operation countervalues and the analytics fiat, replacing `CountervalueTicker` and the unused `FiatCurrencyId`.

- [#24370](https://github.com/LedgerHQ/ledger-live/pull/24370) [`cea0076`](https://github.com/LedgerHQ/ledger-live/commit/cea0076fb3fd7c19d0e73b99ac76507278e390a4) Thanks [@ysitbon](https://github.com/ysitbon)! - Add `CryptoOrTokenCurrencyIdSchema` and `CryptoOrTokenCurrencyId` to `@domain/entity-currency`, replacing the duplicated `BalanceAssetIdSchema`, `ContactCurrencyIdSchema` and the send flow's local union. Runtime parsing is unchanged.

- [#24392](https://github.com/LedgerHQ/ledger-live/pull/24392) [`934970a`](https://github.com/LedgerHQ/ledger-live/commit/934970adec67ed88f1d546d03b1bb555cbfd128f) Thanks [@renovate-operator-ledger](https://github.com/apps/renovate-operator-ledger)! - chore(deps): update dependency @reduxjs/toolkit to v2.13.0

  - Updated `@reduxjs/toolkit` to `2.13.0`

### Patch Changes

- Updated dependencies [[`ac116ba`](https://github.com/LedgerHQ/ledger-live/commit/ac116baae8763f331fd21885be36474933b52dff), [`842a9a5`](https://github.com/LedgerHQ/ledger-live/commit/842a9a547be2224eec86295c57c288f0c51f8fbd), [`cea0076`](https://github.com/LedgerHQ/ledger-live/commit/cea0076fb3fd7c19d0e73b99ac76507278e390a4), [`934970a`](https://github.com/LedgerHQ/ledger-live/commit/934970adec67ed88f1d546d03b1bb555cbfd128f)]:
  - @domain/entity-currency-fiat@0.6.0-next.0
  - @domain/entity-account-descriptor@0.5.0-next.0
  - @domain/entity-currency@0.5.0-next.0
  - @domain/entity-account-balance@0.3.0-next.0
  - @domain/entity-account-data@0.5.0-next.0

## 0.1.0

### Minor Changes

- [#24053](https://github.com/LedgerHQ/ledger-live/pull/24053) [`eebea9e`](https://github.com/LedgerHQ/ledger-live/commit/eebea9eabe809bf103fb3b7337d091a17a5faa64) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the paginated account operation entity

- [#24185](https://github.com/LedgerHQ/ledger-live/pull/24185) [`304b8b2`](https://github.com/LedgerHQ/ledger-live/commit/304b8b2575f6adfa895b50b6697febd1ccab7e7e) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Store account data status and the operations windows per query, and keep the newest copy of an operation shared by several queries

### Patch Changes

- Updated dependencies [[`304b8b2`](https://github.com/LedgerHQ/ledger-live/commit/304b8b2575f6adfa895b50b6697febd1ccab7e7e), [`b79c360`](https://github.com/LedgerHQ/ledger-live/commit/b79c360ab24df820c11299c080538fd40ddef820)]:
  - @domain/entity-account-data@0.4.0
  - @domain/entity-account-descriptor@0.4.0
  - @domain/entity-account-balance@0.2.2

## 0.1.0-next.0

### Minor Changes

- [#24053](https://github.com/LedgerHQ/ledger-live/pull/24053) [`eebea9e`](https://github.com/LedgerHQ/ledger-live/commit/eebea9eabe809bf103fb3b7337d091a17a5faa64) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the paginated account operation entity

- [#24185](https://github.com/LedgerHQ/ledger-live/pull/24185) [`304b8b2`](https://github.com/LedgerHQ/ledger-live/commit/304b8b2575f6adfa895b50b6697febd1ccab7e7e) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Store account data status and the operations windows per query, and keep the newest copy of an operation shared by several queries

### Patch Changes

- Updated dependencies [[`304b8b2`](https://github.com/LedgerHQ/ledger-live/commit/304b8b2575f6adfa895b50b6697febd1ccab7e7e), [`b79c360`](https://github.com/LedgerHQ/ledger-live/commit/b79c360ab24df820c11299c080538fd40ddef820)]:
  - @domain/entity-account-data@0.4.0-next.0
  - @domain/entity-account-descriptor@0.4.0-next.0
  - @domain/entity-account-balance@0.2.2-next.0

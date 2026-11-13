# @features/platform-account-source-portfolio

## 0.1.0-next.0

### Minor Changes

- [#24745](https://github.com/LedgerHQ/ledger-live/pull/24745) [`5020021`](https://github.com/LedgerHQ/ledger-live/commit/5020021654f743e0e868cb9c8d011adc97f4ed9a) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Account descriptor: one `key` field for both types; Canton, Concordium, Internet Computer, TON, Aptos and Stacks accounts are keyed on their public key, their address computed through the coin module loaders; a legacy account left out is mirrored again once it converts

- [#24747](https://github.com/LedgerHQ/ledger-live/pull/24747) [`8b743fb`](https://github.com/LedgerHQ/ledger-live/commit/8b743fb4d98b915eac60d3b7a991dbe6a03f2b03) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Value each balance history point in the fiat a query asks for, at its date, with the `countervalue` query

### Patch Changes

- Updated dependencies [[`9f10baf`](https://github.com/LedgerHQ/ledger-live/commit/9f10bafef466914b2536c7e509ff7c3c2c49b5c8), [`0fc43ab`](https://github.com/LedgerHQ/ledger-live/commit/0fc43ab03928e17d2da761f747ec0c449228d4aa), [`5020021`](https://github.com/LedgerHQ/ledger-live/commit/5020021654f743e0e868cb9c8d011adc97f4ed9a), [`8064394`](https://github.com/LedgerHQ/ledger-live/commit/806439433d2c57b13db5a513688db52195bfc163), [`6baeada`](https://github.com/LedgerHQ/ledger-live/commit/6baeadaca277a70109580c0d939278ebf729922b), [`797f57b`](https://github.com/LedgerHQ/ledger-live/commit/797f57b5789439d03259a434cfab6dcaddb84126), [`8b743fb`](https://github.com/LedgerHQ/ledger-live/commit/8b743fb4d98b915eac60d3b7a991dbe6a03f2b03), [`0cf44d5`](https://github.com/LedgerHQ/ledger-live/commit/0cf44d56a449fb0f4448cd6f8e02c880fc47adb2)]:
  - @domain/api-account-data@0.6.0-next.0
  - @domain/entity-account-descriptor@0.6.0-next.0
  - @domain/entity-account-data@0.6.0-next.0
  - @domain/entity-account-operation@0.3.0-next.0
  - @domain/entity-client-identity@0.6.0-next.0
  - @domain/api-account-portfolio@0.3.0-next.0
  - @domain/entity-account-balance-history@0.3.0-next.0
  - @domain/entity-account-balance@0.3.1-next.0

# @domain/entity-network

## 0.2.0-next.0

### Minor Changes

- [#25436](https://github.com/LedgerHQ/ledger-live/pull/25436) [`8030207`](https://github.com/LedgerHQ/ledger-live/commit/803020759f7f1b66ddeede81a2cd88c4fc36708a) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Keep `@domain/entity-account-descriptor` for the edges: AccountUUID moves to `@domain/entity-account`, NetworkId and Address to the new `@domain/entity-network`, DerivationPath and the legacy path bridges to `@domain/entity-derivation`

- [#25592](https://github.com/LedgerHQ/ledger-live/pull/25592) [`32dd38a`](https://github.com/LedgerHQ/ledger-live/commit/32dd38a82237a062e102d5cdc466db4682bf100c) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Deprecate `currencyIdFromNetwork`: keep it for legacy reconciliation only; prefer the asset or account data for product logic.

### Patch Changes

- Updated dependencies [[`afe8aea`](https://github.com/LedgerHQ/ledger-live/commit/afe8aea94052e7475b17e203028ca7e02e2848e1)]:
  - @domain/entity-currency-crypto@0.21.0-next.0

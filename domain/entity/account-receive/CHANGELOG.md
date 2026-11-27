# @domain/entity-account-receive

## 0.2.0-next.0

### Minor Changes

- [#25436](https://github.com/LedgerHQ/ledger-live/pull/25436) [`8030207`](https://github.com/LedgerHQ/ledger-live/commit/803020759f7f1b66ddeede81a2cd88c4fc36708a) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Keep `@domain/entity-account-descriptor` for the edges: AccountUUID moves to `@domain/entity-account`, NetworkId and Address to the new `@domain/entity-network`, DerivationPath and the legacy path bridges to `@domain/entity-derivation`

### Patch Changes

- Updated dependencies [[`8030207`](https://github.com/LedgerHQ/ledger-live/commit/803020759f7f1b66ddeede81a2cd88c4fc36708a), [`d35cf10`](https://github.com/LedgerHQ/ledger-live/commit/d35cf10970da952fb6a760b6c839f28f0ec85758), [`32dd38a`](https://github.com/LedgerHQ/ledger-live/commit/32dd38a82237a062e102d5cdc466db4682bf100c), [`ed3d726`](https://github.com/LedgerHQ/ledger-live/commit/ed3d726cb936e75f9a54bc782bd97103dafbe51f)]:
  - @domain/entity-account-descriptor@0.8.0-next.0
  - @domain/entity-account@0.5.0-next.0
  - @domain/entity-network@0.2.0-next.0
  - @domain/entity-derivation@0.3.0-next.0
  - @domain/entity-account-data@0.7.0-next.0

## 0.1.1

### Patch Changes

- Updated dependencies [[`f8afe58`](https://github.com/LedgerHQ/ledger-live/commit/f8afe58413ae68f5331031c27d9655dca1a56143)]:
  - @domain/entity-account-descriptor@0.7.0
  - @domain/entity-account-data@0.6.1

## 0.1.1-next.0

### Patch Changes

- Updated dependencies [[`f8afe58`](https://github.com/LedgerHQ/ledger-live/commit/f8afe58413ae68f5331031c27d9655dca1a56143)]:
  - @domain/entity-account-descriptor@0.7.0-next.0
  - @domain/entity-account-data@0.6.1-next.0

## 0.1.0

### Minor Changes

- [#24674](https://github.com/LedgerHQ/ledger-live/pull/24674) [`8064394`](https://github.com/LedgerHQ/ledger-live/commit/806439433d2c57b13db5a513688db52195bfc163) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add the `receive` account data kind: on which address an account receives and how the device confirms it, read by the full-sync source. The branded `Address` moves from `@domain/entity-account-operation` to `@domain/entity-account-descriptor`, next to the new `DerivationPathSchema`

- [#24740](https://github.com/LedgerHQ/ledger-live/pull/24740) [`d5d2516`](https://github.com/LedgerHQ/ledger-live/commit/d5d2516e82d0ee1984fcff0357cc0406eca91c48) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the memo a sender can attach to each receive address, from the coin's send descriptor

### Patch Changes

- Updated dependencies [[`5020021`](https://github.com/LedgerHQ/ledger-live/commit/5020021654f743e0e868cb9c8d011adc97f4ed9a), [`8064394`](https://github.com/LedgerHQ/ledger-live/commit/806439433d2c57b13db5a513688db52195bfc163)]:
  - @domain/entity-account-descriptor@0.6.0
  - @domain/entity-account-data@0.6.0

## 0.1.0-next.0

### Minor Changes

- [#24674](https://github.com/LedgerHQ/ledger-live/pull/24674) [`8064394`](https://github.com/LedgerHQ/ledger-live/commit/806439433d2c57b13db5a513688db52195bfc163) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add the `receive` account data kind: on which address an account receives and how the device confirms it, read by the full-sync source. The branded `Address` moves from `@domain/entity-account-operation` to `@domain/entity-account-descriptor`, next to the new `DerivationPathSchema`

- [#24740](https://github.com/LedgerHQ/ledger-live/pull/24740) [`d5d2516`](https://github.com/LedgerHQ/ledger-live/commit/d5d2516e82d0ee1984fcff0357cc0406eca91c48) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the memo a sender can attach to each receive address, from the coin's send descriptor

### Patch Changes

- Updated dependencies [[`5020021`](https://github.com/LedgerHQ/ledger-live/commit/5020021654f743e0e868cb9c8d011adc97f4ed9a), [`8064394`](https://github.com/LedgerHQ/ledger-live/commit/806439433d2c57b13db5a513688db52195bfc163)]:
  - @domain/entity-account-descriptor@0.6.0-next.0
  - @domain/entity-account-data@0.6.0-next.0

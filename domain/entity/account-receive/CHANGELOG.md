# @domain/entity-account-receive

## 0.1.0-next.0

### Minor Changes

- [#24674](https://github.com/LedgerHQ/ledger-live/pull/24674) [`8064394`](https://github.com/LedgerHQ/ledger-live/commit/806439433d2c57b13db5a513688db52195bfc163) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add the `receive` account data kind: on which address an account receives and how the device confirms it, read by the full-sync source. The branded `Address` moves from `@domain/entity-account-operation` to `@domain/entity-account-descriptor`, next to the new `DerivationPathSchema`

- [#24740](https://github.com/LedgerHQ/ledger-live/pull/24740) [`d5d2516`](https://github.com/LedgerHQ/ledger-live/commit/d5d2516e82d0ee1984fcff0357cc0406eca91c48) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the memo a sender can attach to each receive address, from the coin's send descriptor

### Patch Changes

- Updated dependencies [[`5020021`](https://github.com/LedgerHQ/ledger-live/commit/5020021654f743e0e868cb9c8d011adc97f4ed9a), [`8064394`](https://github.com/LedgerHQ/ledger-live/commit/806439433d2c57b13db5a513688db52195bfc163)]:
  - @domain/entity-account-descriptor@0.6.0-next.0
  - @domain/entity-account-data@0.6.0-next.0

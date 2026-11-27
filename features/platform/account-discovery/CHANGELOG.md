# @features/platform-account-discovery

## 0.3.0-next.0

### Minor Changes

- [#25623](https://github.com/LedgerHQ/ledger-live/pull/25623) [`aca6818`](https://github.com/LedgerHQ/ledger-live/commit/aca68184987bd9251ea8cb814ad317a583888174) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add the account discovery completion step, the device step after selection: Aleo asks the view key of each selected account

- [#25580](https://github.com/LedgerHQ/ledger-live/pull/25580) [`d35cf10`](https://github.com/LedgerHQ/ledger-live/commit/d35cf10970da952fb6a760b6c839f28f0ec85758) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Read the data of accounts discovery found before they are added, through a discoveredAccounts register; move discovery behind the edge-only `@features/platform-account-discovery/descriptor` entry

### Patch Changes

- Updated dependencies [[`afe8aea`](https://github.com/LedgerHQ/ledger-live/commit/afe8aea94052e7475b17e203028ca7e02e2848e1), [`67e32e5`](https://github.com/LedgerHQ/ledger-live/commit/67e32e57f1d22d5097200032dc2e7b9c49cf1e7e), [`452b4ed`](https://github.com/LedgerHQ/ledger-live/commit/452b4ed3cc44a6c9dc9726dfe0aa840b0cd3babd), [`8030207`](https://github.com/LedgerHQ/ledger-live/commit/803020759f7f1b66ddeede81a2cd88c4fc36708a), [`d35cf10`](https://github.com/LedgerHQ/ledger-live/commit/d35cf10970da952fb6a760b6c839f28f0ec85758), [`ed00958`](https://github.com/LedgerHQ/ledger-live/commit/ed00958b914fefe16416405ab3e109f0b2b1d67e), [`5992665`](https://github.com/LedgerHQ/ledger-live/commit/599266587ecabbe12307d9eac9a85b88e0ab99e2), [`ed3d726`](https://github.com/LedgerHQ/ledger-live/commit/ed3d726cb936e75f9a54bc782bd97103dafbe51f)]:
  - @domain/entity-currency-crypto@0.21.0-next.0
  - @domain/entity-account-context@0.2.0-next.0
  - @domain/entity-account-status@0.2.0-next.0
  - @domain/entity-account-descriptor@0.8.0-next.0
  - @domain/entity-account@0.5.0-next.0
  - @domain/entity-derivation@0.3.0-next.0
  - @domain/api-account-data@0.7.0-next.0

## 0.2.0

### Minor Changes

- [#25018](https://github.com/LedgerHQ/ledger-live/pull/25018) [`655ced5`](https://github.com/LedgerHQ/ledger-live/commit/655ced54a202288883b740f67a3edecdd38247b5) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add account discovery as a stream of account descriptors, found as the legacy scan accounts

### Patch Changes

- Updated dependencies [[`79e96f7`](https://github.com/LedgerHQ/ledger-live/commit/79e96f7f41181a20bcee56c39fe528c2186eeede), [`4f46643`](https://github.com/LedgerHQ/ledger-live/commit/4f466432512683457cbdca0ce7b64ddbf678c64d), [`f8afe58`](https://github.com/LedgerHQ/ledger-live/commit/f8afe58413ae68f5331031c27d9655dca1a56143), [`c80f5de`](https://github.com/LedgerHQ/ledger-live/commit/c80f5de17b263d8e111ddd3b3247b04f7b9a687a), [`d3b0f92`](https://github.com/LedgerHQ/ledger-live/commit/d3b0f92aadd5743ec190f72e2212d665a776ce43)]:
  - @domain/entity-currency-crypto@0.20.0
  - @domain/entity-account-status@0.1.0
  - @domain/entity-account-descriptor@0.7.0
  - @domain/entity-derivation@0.2.0
  - @domain/api-account-data@0.6.1

## 0.2.0-next.0

### Minor Changes

- [#25018](https://github.com/LedgerHQ/ledger-live/pull/25018) [`655ced5`](https://github.com/LedgerHQ/ledger-live/commit/655ced54a202288883b740f67a3edecdd38247b5) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add account discovery as a stream of account descriptors, found as the legacy scan accounts

### Patch Changes

- Updated dependencies [[`79e96f7`](https://github.com/LedgerHQ/ledger-live/commit/79e96f7f41181a20bcee56c39fe528c2186eeede), [`4f46643`](https://github.com/LedgerHQ/ledger-live/commit/4f466432512683457cbdca0ce7b64ddbf678c64d), [`f8afe58`](https://github.com/LedgerHQ/ledger-live/commit/f8afe58413ae68f5331031c27d9655dca1a56143), [`c80f5de`](https://github.com/LedgerHQ/ledger-live/commit/c80f5de17b263d8e111ddd3b3247b04f7b9a687a), [`d3b0f92`](https://github.com/LedgerHQ/ledger-live/commit/d3b0f92aadd5743ec190f72e2212d665a776ce43)]:
  - @domain/entity-currency-crypto@0.20.0-next.0
  - @domain/entity-account-status@0.1.0-next.0
  - @domain/entity-account-descriptor@0.7.0-next.0
  - @domain/entity-derivation@0.2.0-next.0
  - @domain/api-account-data@0.6.1-next.0

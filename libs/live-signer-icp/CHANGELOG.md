# @ledgerhq/live-signer-icp

## 0.1.4-next.0

### Patch Changes

- Updated dependencies [[`27388a8`](https://github.com/LedgerHQ/ledger-live/commit/27388a894eaac67b8e162a60f6d3368aad0a8682)]:
  - @ledgerhq/ledger-wallet-framework@3.2.0-next.0
  - @ledgerhq/coin-internet_computer@1.29.3-next.0

## 0.1.3

### Patch Changes

- Updated dependencies [[`585d8d7`](https://github.com/LedgerHQ/ledger-live/commit/585d8d78d5e153186c39ee2abfcdb7dc4a5d06e0)]:
  - @ledgerhq/ledger-wallet-framework@3.1.0
  - @ledgerhq/coin-internet_computer@1.29.2

## 0.1.3-next.0

### Patch Changes

- Updated dependencies [[`585d8d7`](https://github.com/LedgerHQ/ledger-live/commit/585d8d78d5e153186c39ee2abfcdb7dc4a5d06e0)]:
  - @ledgerhq/ledger-wallet-framework@3.1.0-next.0
  - @ledgerhq/coin-internet_computer@1.29.2-next.0

## 0.1.2

### Patch Changes

- Updated dependencies [[`eecf99a`](https://github.com/LedgerHQ/ledger-live/commit/eecf99af5c17ab63724843c31d5f3facc6352dad), [`030fc67`](https://github.com/LedgerHQ/ledger-live/commit/030fc677db03e8a411d3d33d2fa88e1ab04df80b), [`b6da6b1`](https://github.com/LedgerHQ/ledger-live/commit/b6da6b1b1c98d022f30985c6103c239bffd0c7df), [`79882e2`](https://github.com/LedgerHQ/ledger-live/commit/79882e26a14f246f1cc969937e011b16e701b8f2), [`a20805c`](https://github.com/LedgerHQ/ledger-live/commit/a20805cebd95f2f620d394c4d7598ec93506c83e), [`030b427`](https://github.com/LedgerHQ/ledger-live/commit/030b42707768af3f9c98a15fc6751f1d64b36fe6)]:
  - @ledgerhq/ledger-wallet-framework@3.0.0
  - @ledgerhq/coin-internet_computer@1.29.1

## 0.1.2-next.1

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/coin-internet_computer@1.29.1-next.1
  - @ledgerhq/ledger-wallet-framework@3.0.0-next.1

## 0.1.2-next.0

### Patch Changes

- Updated dependencies [[`eecf99a`](https://github.com/LedgerHQ/ledger-live/commit/eecf99af5c17ab63724843c31d5f3facc6352dad), [`030fc67`](https://github.com/LedgerHQ/ledger-live/commit/030fc677db03e8a411d3d33d2fa88e1ab04df80b), [`b6da6b1`](https://github.com/LedgerHQ/ledger-live/commit/b6da6b1b1c98d022f30985c6103c239bffd0c7df), [`79882e2`](https://github.com/LedgerHQ/ledger-live/commit/79882e26a14f246f1cc969937e011b16e701b8f2), [`a20805c`](https://github.com/LedgerHQ/ledger-live/commit/a20805cebd95f2f620d394c4d7598ec93506c83e), [`030b427`](https://github.com/LedgerHQ/ledger-live/commit/030b42707768af3f9c98a15fc6751f1d64b36fe6)]:
  - @ledgerhq/ledger-wallet-framework@3.0.0-next.0
  - @ledgerhq/coin-internet_computer@1.29.1-next.0

## 0.1.1

### Patch Changes

- Updated dependencies [[`3d24a89`](https://github.com/LedgerHQ/ledger-live/commit/3d24a898d59de55364ec29de29eaecb7ca14425d), [`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add), [`aee0e64`](https://github.com/LedgerHQ/ledger-live/commit/aee0e64b491aafc1ca8fea16b1ef124cb183770b), [`28046d3`](https://github.com/LedgerHQ/ledger-live/commit/28046d31707d0290b56522c14b51623860b7a3f8), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152)]:
  - @ledgerhq/coin-internet_computer@1.29.0
  - @ledgerhq/ledger-wallet-framework@2.8.0

## 0.1.1-next.0

### Patch Changes

- Updated dependencies [[`3d24a89`](https://github.com/LedgerHQ/ledger-live/commit/3d24a898d59de55364ec29de29eaecb7ca14425d), [`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add), [`aee0e64`](https://github.com/LedgerHQ/ledger-live/commit/aee0e64b491aafc1ca8fea16b1ef124cb183770b), [`28046d3`](https://github.com/LedgerHQ/ledger-live/commit/28046d31707d0290b56522c14b51623860b7a3f8), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152)]:
  - @ledgerhq/coin-internet_computer@1.29.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.8.0-next.0

## 0.1.0

### Minor Changes

- [#20074](https://github.com/LedgerHQ/ledger-live/pull/20074) [`72930e9`](https://github.com/LedgerHQ/ledger-live/commit/72930e93e2a01d46012c3e7b72e3e3d4875ae7d7) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Add a DMK-based Internet Computer signer and use it as the sole device signer, replacing the legacy `@zondax/ledger-icp` transport.

  The new `@ledgerhq/live-signer-icp` package provides `DmkSignerICP` (built on `@ledgerhq/device-signer-kit-icp`), and the `internet_computer` family now requires a DMK transport — mirroring the aleo and concordium signers. `@zondax/ledger-icp` is removed from Ledger Live.

  The ICP signer contract also exposes the neuron-management signing surface: `signUpdateCall` (signs a governance update call together with its read-state request, returning both signatures and the read-state body) and a `stake` flag on `sign` for neuron-creation transfers.

### Patch Changes

- Updated dependencies [[`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add), [`72930e9`](https://github.com/LedgerHQ/ledger-live/commit/72930e93e2a01d46012c3e7b72e3e3d4875ae7d7), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152), [`635fa12`](https://github.com/LedgerHQ/ledger-live/commit/635fa12d47f5a98858326f4dd68962dffe82eda9)]:
  - @ledgerhq/coin-internet_computer@1.28.0
  - @ledgerhq/ledger-wallet-framework@2.7.0

## 0.1.0-next.0

### Minor Changes

- [#20074](https://github.com/LedgerHQ/ledger-live/pull/20074) [`72930e9`](https://github.com/LedgerHQ/ledger-live/commit/72930e93e2a01d46012c3e7b72e3e3d4875ae7d7) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Add a DMK-based Internet Computer signer and use it as the sole device signer, replacing the legacy `@zondax/ledger-icp` transport.

  The new `@ledgerhq/live-signer-icp` package provides `DmkSignerICP` (built on `@ledgerhq/device-signer-kit-icp`), and the `internet_computer` family now requires a DMK transport — mirroring the aleo and concordium signers. `@zondax/ledger-icp` is removed from Ledger Live.

  The ICP signer contract also exposes the neuron-management signing surface: `signUpdateCall` (signs a governance update call together with its read-state request, returning both signatures and the read-state body) and a `stake` flag on `sign` for neuron-creation transfers.

### Patch Changes

- Updated dependencies [[`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add), [`72930e9`](https://github.com/LedgerHQ/ledger-live/commit/72930e93e2a01d46012c3e7b72e3e3d4875ae7d7), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152), [`635fa12`](https://github.com/LedgerHQ/ledger-live/commit/635fa12d47f5a98858326f4dd68962dffe82eda9)]:
  - @ledgerhq/coin-internet_computer@1.28.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.7.0-next.0

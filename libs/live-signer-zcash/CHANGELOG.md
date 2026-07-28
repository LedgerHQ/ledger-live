# @ledgerhq/live-signer-zcash

## 0.6.0

### Minor Changes

- [#19727](https://github.com/LedgerHQ/ledger-live/pull/19727) [`887f8c9`](https://github.com/LedgerHQ/ledger-live/commit/887f8c93e66c2730cbecc1adc09b6a2faa95bba6) Thanks [@semeano](https://github.com/semeano)! - Fix wrong ZIP-244 txid

## 0.6.0-next.0

### Minor Changes

- [#19727](https://github.com/LedgerHQ/ledger-live/pull/19727) [`887f8c9`](https://github.com/LedgerHQ/ledger-live/commit/887f8c93e66c2730cbecc1adc09b6a2faa95bba6) Thanks [@semeano](https://github.com/semeano)! - Fix wrong ZIP-244 txid

## 0.5.0

### Minor Changes

- [#19219](https://github.com/LedgerHQ/ledger-live/pull/19219) [`7094236`](https://github.com/LedgerHQ/ledger-live/commit/7094236545524bae7f501bbee1ee606ece868a14) Thanks [@semeano](https://github.com/semeano)! - Zcash: add PCZT support on LW signer

## 0.5.0-next.0

### Minor Changes

- [#19219](https://github.com/LedgerHQ/ledger-live/pull/19219) [`7094236`](https://github.com/LedgerHQ/ledger-live/commit/7094236545524bae7f501bbee1ee606ece868a14) Thanks [@semeano](https://github.com/semeano)! - Zcash: add PCZT support on LW signer

## 0.4.0

### Minor Changes

- [#18616](https://github.com/LedgerHQ/ledger-live/pull/18616) [`1c1e25d`](https://github.com/LedgerHQ/ledger-live/commit/1c1e25d866e8ad9bf8d29c4bd102ebd5fd02c2b3) Thanks [@may01](https://github.com/may01)! - Route transparent Zcash signing through the DMK signer. `DmkSignerZcash` now implements `createPaymentTransaction`, mapping the Bitcoin signer's `CreateTransaction` onto `@ledgerhq/device-signer-kit-zcash`'s `signTransaction(LegacyCreateTransactionArg)` and returning the broadcast-ready signed-tx hex (the device's `0x` prefix is stripped). The Zcash chain adapter wires this method into its `createSigner` augmentation, so transparent transactions are signed via the Device Management Kit instead of `hw-app-btc`, leaving other UTXO chains and the broadcast path unchanged.

## 0.4.0-next.0

### Minor Changes

- [#18616](https://github.com/LedgerHQ/ledger-live/pull/18616) [`1c1e25d`](https://github.com/LedgerHQ/ledger-live/commit/1c1e25d866e8ad9bf8d29c4bd102ebd5fd02c2b3) Thanks [@may01](https://github.com/may01)! - Route transparent Zcash signing through the DMK signer. `DmkSignerZcash` now implements `createPaymentTransaction`, mapping the Bitcoin signer's `CreateTransaction` onto `@ledgerhq/device-signer-kit-zcash`'s `signTransaction(LegacyCreateTransactionArg)` and returning the broadcast-ready signed-tx hex (the device's `0x` prefix is stripped). The Zcash chain adapter wires this method into its `createSigner` augmentation, so transparent transactions are signed via the Device Management Kit instead of `hw-app-btc`, leaving other UTXO chains and the broadcast path unchanged.

## 0.3.0

### Minor Changes

- [#18627](https://github.com/LedgerHQ/ledger-live/pull/18627) [`7fcf623`](https://github.com/LedgerHQ/ledger-live/commit/7fcf62387e642e10b23503a786e230b11d051cb6) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Bump Device Management Kit to 1.7.1

## 0.3.0-next.0

### Minor Changes

- [#18627](https://github.com/LedgerHQ/ledger-live/pull/18627) [`7fcf623`](https://github.com/LedgerHQ/ledger-live/commit/7fcf62387e642e10b23503a786e230b11d051cb6) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Bump Device Management Kit to 1.7.1

## 0.2.0

### Minor Changes

- [#17563](https://github.com/LedgerHQ/ledger-live/pull/17563) [`b2ee27c`](https://github.com/LedgerHQ/ledger-live/commit/b2ee27c2e1a508a6da44701d1881484f4f806e22) Thanks [@semeano](https://github.com/semeano)! - Add support to get full viewing key for Zcash

- [#17450](https://github.com/LedgerHQ/ledger-live/pull/17450) [`40f9d3b`](https://github.com/LedgerHQ/ledger-live/commit/40f9d3b64cd697865b761412147e6c181fdd4a63) Thanks [@semeano](https://github.com/semeano)! - Add live-signer-zcash; getAddress implementation for Zcash chain adapter

## 0.2.0-next.0

### Minor Changes

- [#17563](https://github.com/LedgerHQ/ledger-live/pull/17563) [`b2ee27c`](https://github.com/LedgerHQ/ledger-live/commit/b2ee27c2e1a508a6da44701d1881484f4f806e22) Thanks [@semeano](https://github.com/semeano)! - Add support to get full viewing key for Zcash

- [#17450](https://github.com/LedgerHQ/ledger-live/pull/17450) [`40f9d3b`](https://github.com/LedgerHQ/ledger-live/commit/40f9d3b64cd697865b761412147e6c181fdd4a63) Thanks [@semeano](https://github.com/semeano)! - Add live-signer-zcash; getAddress implementation for Zcash chain adapter

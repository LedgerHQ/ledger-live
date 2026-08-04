# @ledgerhq/live-signer-zcash

## 0.7.0-next.1

### Minor Changes

- [#20349](https://github.com/LedgerHQ/ledger-live/pull/20349) [`f715aa5`](https://github.com/LedgerHQ/ledger-live/commit/f715aa516225f72124e083e3ffa0f254b9d5df4f) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Fix Zcash sends failing before the device prompt when the coin being spent came from a V4-format transaction (PROD-12599).

  Signing a transparent Zcash transaction whose input came from a V4 (Sapling-format) transaction failed immediately: no review screen appeared on the device, and Ledger Live showed "Something went wrong" with no detail. V4 is still valid on mainnet and still emitted by exchanges and older wallets, while Ledger Live itself emits V5 — so an account funded from within Ledger Live never hit this, which is why the failure looked intermittent. It is in fact deterministic, decided by which software created the funding transaction.

  `serializedPreviousTransactionOverride` carries the source transaction's raw on-chain bytes so the device can compute the correct ZIP-244 txid for a V5 transaction, whose Orchard bundle the signer kit's serialization would otherwise strip. It was being set for every version. The kit chunks a V4 transaction expecting Ledger's internal serialization, whose header carries a consensus branch id absent from the on-chain bytes; given those bytes it read the input count four bytes late and threw while chunking that input. The override is now restricted to the versions that need it, and a V4 source transaction goes back through the serialization path that has always handled it, its Sapling fields travelling in `extraData` as before.

  The decision is made per input, which is what a send spending several coins looks like from the outside: the V5 inputs are chunked and their trusted inputs obtained from the device first, then the transaction dies when the V4 input's turn comes. The device has already answered several times by then, yet no review screen is ever reached — so the failure looks like a device problem rather than a serialization one.

  Untagged device action errors are also no longer flattened into a message-less `Error`, so a failure inside a device action task names itself in the logs instead of surfacing only as "Something went wrong".

## 0.7.0-next.0

### Minor Changes

- [#20021](https://github.com/LedgerHQ/ledger-live/pull/20021) [`0afef49`](https://github.com/LedgerHQ/ledger-live/commit/0afef49b60283afb44172de65891e435c2f0d637) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Take `@ledgerhq/device-signer-kit-zcash` 0.4.3, which asks the device for a spend-auth signature only on real Orchard spends. The dummy padding spend of a single-spend bundle is self-signed host-side by the PCZT IO finalizer, so signing it on-device too made the device return one signature more than the finalizer had unsigned actions, and the transaction was rejected. Sending from a shielded balance with a single note now goes through.

### Patch Changes

- Updated dependencies [[`1070564`](https://github.com/LedgerHQ/ledger-live/commit/107056410174d3da2d45c468232a8d742aea021f)]:
  - @ledgerhq/errors@7.0.0-next.0

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

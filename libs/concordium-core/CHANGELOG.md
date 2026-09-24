# @ledgerhq/concordium-core

## 0.8.0-next.0

### Minor Changes

- [#22087](https://github.com/LedgerHQ/ledger-live/pull/22087) [`736a0d5`](https://github.com/LedgerHQ/ledger-live/commit/736a0d5ba692e2342df4fc503056524359d35d65) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Carry a PLT memo as CBOR, the way a CCD memo already is

  A PLT memo went on chain as raw UTF-8 while a CCD memo went as a CBOR text
  string. The chain types them identically — a CBOR value in `Memo` under one
  256-byte cap — and only the envelope differs, so the codec is now shared.

  `encodePltMemo` emits `tag 24(byte string(CBOR text string))`; tag 24 declares
  the content to be CBOR, which the previous untagged bytes denied. Both paths
  bound the memo with `MAX_MEMO_LENGTH` (254), leaving room for the CBOR header;
  `PLT_MAX_MEMO_SIZE` is gone. The device app's PLT screen does not decode the
  content yet, so the wallet side lands first and the two ship together.

  `decodeMemoFromCbor` now requires the value to fill the buffer and reads
  integers as well as text strings. Without the first, `616263` decoded to `"b"`.

  PLT reads try CBOR and fall back to printable text, since the node strips the
  tag and the proxy reports bare bytes either way — so earlier memos still
  display. Integers are excluded there: `"0"` through `"7"` are `0x30`-`0x37`,
  CBOR major type 1, so a single-digit reference would read as `-17` through
  `-24`. The reverse holds for the rarer case, a negative integer reading as its
  printable head byte. Nothing separates the two, and text is what senders write.

## 0.7.0

### Minor Changes

- [#21634](https://github.com/LedgerHQ/ledger-live/pull/21634) [`b30f903`](https://github.com/LedgerHQ/ledger-live/commit/b30f903f592c0bafba74a1784d98b9d605c18ccb) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Validate PLT transfers and fix estimateMaxSpendable for tokens

  `getTransactionStatus` checks a PLT amount against the token sub-account and its fee
  against the CCD at the parent's disposal, and blocks on token state and device limits.
  `estimateMaxSpendable` returns the full token balance instead of subtracting µCCD fees.
  A PLT fee is priced from the buffered energy, so it covers the deposit the chain
  requires. `concordium-core` lowers the PLT decimals ceiling to 18. Adds the English
  error strings.

## 0.7.0-next.0

### Minor Changes

- [#21634](https://github.com/LedgerHQ/ledger-live/pull/21634) [`b30f903`](https://github.com/LedgerHQ/ledger-live/commit/b30f903f592c0bafba74a1784d98b9d605c18ccb) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Validate PLT transfers and fix estimateMaxSpendable for tokens

  `getTransactionStatus` checks a PLT amount against the token sub-account and its fee
  against the CCD at the parent's disposal, and blocks on token state and device limits.
  `estimateMaxSpendable` returns the full token balance instead of subtracting µCCD fees.
  A PLT fee is priced from the buffered energy, so it covers the deposit the chain
  requires. `concordium-core` lowers the PLT decimals ceiling to 18. Adds the English
  error strings.

## 0.6.0

### Minor Changes

- [#21239](https://github.com/LedgerHQ/ledger-live/pull/21239) [`02c9ccf`](https://github.com/LedgerHQ/ledger-live/commit/02c9ccfb409317a72f0b29d1fb755214adc9e596) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Add Protocol-Level Token (PLT) support: TransactionType.TokenUpdate, CIS-7 CBOR encoding, and flat wire serialization

## 0.6.0-next.0

### Minor Changes

- [#21239](https://github.com/LedgerHQ/ledger-live/pull/21239) [`02c9ccf`](https://github.com/LedgerHQ/ledger-live/commit/02c9ccfb409317a72f0b29d1fb755214adc9e596) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Add Protocol-Level Token (PLT) support: TransactionType.TokenUpdate, CIS-7 CBOR encoding, and flat wire serialization

## 0.5.0

### Minor Changes

- [#18900](https://github.com/LedgerHQ/ledger-live/pull/18900) [`67c6acb`](https://github.com/LedgerHQ/ledger-live/commit/67c6acb22afafa7671eebe94e60e672480b71728) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Remove unused exports left over after the `@ledgerhq/hw-app-concordium` removal: `chunkBuffer`, `pathToBuffer`, and `serializePath` (no consumer used them), and the `VerifyAddressResponse` type. The `bip32-path` dependency, only needed by `pathToBuffer`, is dropped.

## 0.5.0-next.0

### Minor Changes

- [#18900](https://github.com/LedgerHQ/ledger-live/pull/18900) [`67c6acb`](https://github.com/LedgerHQ/ledger-live/commit/67c6acb22afafa7671eebe94e60e672480b71728) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Remove unused exports left over after the `@ledgerhq/hw-app-concordium` removal: `chunkBuffer`, `pathToBuffer`, and `serializePath` (no consumer used them), and the `VerifyAddressResponse` type. The `bip32-path` dependency, only needed by `pathToBuffer`, is dropped.

## 0.4.0

### Minor Changes

- [#16023](https://github.com/LedgerHQ/ledger-live/pull/16023) [`c910c1b`](https://github.com/LedgerHQ/ledger-live/commit/c910c1bd9b4f7fbcc0e33fe19b33da44085ab7f9) Thanks [@iqbalibrahim-ledger](https://github.com/iqbalibrahim-ledger)! - chore: remove eslint and prettier, replace with with oxlint and oxfmt

## 0.4.0-next.0

### Minor Changes

- [#16023](https://github.com/LedgerHQ/ledger-live/pull/16023) [`c910c1b`](https://github.com/LedgerHQ/ledger-live/commit/c910c1bd9b4f7fbcc0e33fe19b33da44085ab7f9) Thanks [@iqbalibrahim-ledger](https://github.com/iqbalibrahim-ledger)! - chore: remove eslint and prettier, replace with with oxlint and oxfmt

## 0.3.0

### Minor Changes

- [#14913](https://github.com/LedgerHQ/ledger-live/pull/14913) [`dceb492`](https://github.com/LedgerHQ/ledger-live/commit/dceb4921a811ffc3cba96ff532ffcb5d1205431f) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Update TypeScript to latest 5.8.x

## 0.3.0-next.0

### Minor Changes

- [#14913](https://github.com/LedgerHQ/ledger-live/pull/14913) [`dceb492`](https://github.com/LedgerHQ/ledger-live/commit/dceb4921a811ffc3cba96ff532ffcb5d1205431f) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Update TypeScript to latest 5.8.x

## 0.2.0

### Minor Changes

- [#14258](https://github.com/LedgerHQ/ledger-live/pull/14258) [`5f1c644`](https://github.com/LedgerHQ/ledger-live/commit/5f1c644fd5f757f48618b62e976faac274ced40d) Thanks [@lysyi3m](https://github.com/lysyi3m)! - added concordium proxy & grpc client and core functionality implementation; extracted shared concordium-core package with types, serialization, CBOR and address utilities; simplified hw-app-concordium API to single signTransaction method with type-based routing

## 0.2.0-next.0

### Minor Changes

- [#14258](https://github.com/LedgerHQ/ledger-live/pull/14258) [`5f1c644`](https://github.com/LedgerHQ/ledger-live/commit/5f1c644fd5f757f48618b62e976faac274ced40d) Thanks [@lysyi3m](https://github.com/lysyi3m)! - added concordium proxy & grpc client and core functionality implementation; extracted shared concordium-core package with types, serialization, CBOR and address utilities; simplified hw-app-concordium API to single signTransaction method with type-based routing

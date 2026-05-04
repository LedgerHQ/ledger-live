# @ledgerhq/psbtv2

## 0.5.0

### Minor Changes

- [#16402](https://github.com/LedgerHQ/ledger-live/pull/16402) [`b7cdf0e`](https://github.com/LedgerHQ/ledger-live/commit/b7cdf0e7c6faca170af3bfed9042165c74517ae4) Thanks [@Justkant](https://github.com/Justkant)! - chore: update bitcoinjs-lib and bip32 dependencies across multiple packages

  This is helpful for the wallet-cli and bun usage to avoid some of the native bindings that would come with tiny-secp

## 0.5.0-next.0

### Minor Changes

- [#16402](https://github.com/LedgerHQ/ledger-live/pull/16402) [`b7cdf0e`](https://github.com/LedgerHQ/ledger-live/commit/b7cdf0e7c6faca170af3bfed9042165c74517ae4) Thanks [@Justkant](https://github.com/Justkant)! - chore: update bitcoinjs-lib and bip32 dependencies across multiple packages

  This is helpful for the wallet-cli and bun usage to avoid some of the native bindings that would come with tiny-secp

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

- [#14399](https://github.com/LedgerHQ/ledger-live/pull/14399) [`17149ee`](https://github.com/LedgerHQ/ledger-live/commit/17149ee26eeef8a600d650a6f4903c52320a0d8d) Thanks [@Justkant](https://github.com/Justkant)! - fix(bitcoin): refactor signpsbt derivation population and finalize only when broadcasting

  This change refactors Bitcoin PSBT signing in `hw-app-btc` into smaller, focused modules and improves derivation handling for incomplete PSBTs (notably WalletConnect-style payloads).

  #### What changed

  - Refactored `signPsbt` flow into dedicated modules:
    - `parsePsbt`
    - `inputAnalysis`
    - `accountTypeResolver`
    - `derivationAccessors`
    - `derivationPopulation`
    - `signAndFinalize`
  - Improved BIP32 derivation population:
    - fixes incorrect master fingerprint/path matching edge cases
    - auto-populates missing input/output derivations from local child pubkey derivation + script matching
    - improves local derivation scan depth when deriving and matching addresses
  - Introduced `broadcast` behavior through wallet API + desktop/mobile signing flows:
    - PSBT finalization now only happens when broadcast is requested
    - signed-but-not-finalized PSBT is preserved when `broadcast = false`
  - Updated signing contracts/types:
    - `signPsbtBuffer` options now include explicit account/address context and callbacks
    - returned `tx` is now optional (only when finalized)
    - removed transaction-level `finalizePsbt` field in coin-bitcoin transaction types
  - Updated documentation and tests:
    - new BIP32 non-hardened child derivation tests
    - extended `BtcNew.signPsbtBuffer` coverage for account inference and derivation auto-population scenarios
    - README updates for new signing behavior

  #### Impact

  - Improves reliability for partially populated PSBTs.
  - Changes finalization semantics (finalize-on-broadcast), which can affect integrators expecting an always-finalized tx.

- [#14399](https://github.com/LedgerHQ/ledger-live/pull/14399) [`17149ee`](https://github.com/LedgerHQ/ledger-live/commit/17149ee26eeef8a600d650a6f4903c52320a0d8d) Thanks [@Justkant](https://github.com/Justkant)! - fix: correct previous transaction ID handling in PsbtV2

  #### What changed

  - Updated `PsbtV2.addInputsFromV0` txid handling logic in `libs/psbtv2/src/psbtv2.ts`
  - Adjusted `fromV0.test.ts` expected values to match canonical txid behavior

  #### Impact

  - Prevents incorrect previous output references caused by byte-order mismatch.
  - Aligns PSBTv0 -> PSBTv2 conversion behavior with expected transaction ID encoding.

## 0.2.0-next.0

### Minor Changes

- [#14399](https://github.com/LedgerHQ/ledger-live/pull/14399) [`17149ee`](https://github.com/LedgerHQ/ledger-live/commit/17149ee26eeef8a600d650a6f4903c52320a0d8d) Thanks [@Justkant](https://github.com/Justkant)! - fix(bitcoin): refactor signpsbt derivation population and finalize only when broadcasting

  This change refactors Bitcoin PSBT signing in `hw-app-btc` into smaller, focused modules and improves derivation handling for incomplete PSBTs (notably WalletConnect-style payloads).

  #### What changed

  - Refactored `signPsbt` flow into dedicated modules:
    - `parsePsbt`
    - `inputAnalysis`
    - `accountTypeResolver`
    - `derivationAccessors`
    - `derivationPopulation`
    - `signAndFinalize`
  - Improved BIP32 derivation population:
    - fixes incorrect master fingerprint/path matching edge cases
    - auto-populates missing input/output derivations from local child pubkey derivation + script matching
    - improves local derivation scan depth when deriving and matching addresses
  - Introduced `broadcast` behavior through wallet API + desktop/mobile signing flows:
    - PSBT finalization now only happens when broadcast is requested
    - signed-but-not-finalized PSBT is preserved when `broadcast = false`
  - Updated signing contracts/types:
    - `signPsbtBuffer` options now include explicit account/address context and callbacks
    - returned `tx` is now optional (only when finalized)
    - removed transaction-level `finalizePsbt` field in coin-bitcoin transaction types
  - Updated documentation and tests:
    - new BIP32 non-hardened child derivation tests
    - extended `BtcNew.signPsbtBuffer` coverage for account inference and derivation auto-population scenarios
    - README updates for new signing behavior

  #### Impact

  - Improves reliability for partially populated PSBTs.
  - Changes finalization semantics (finalize-on-broadcast), which can affect integrators expecting an always-finalized tx.

- [#14399](https://github.com/LedgerHQ/ledger-live/pull/14399) [`17149ee`](https://github.com/LedgerHQ/ledger-live/commit/17149ee26eeef8a600d650a6f4903c52320a0d8d) Thanks [@Justkant](https://github.com/Justkant)! - fix: correct previous transaction ID handling in PsbtV2

  #### What changed

  - Updated `PsbtV2.addInputsFromV0` txid handling logic in `libs/psbtv2/src/psbtv2.ts`
  - Adjusted `fromV0.test.ts` expected values to match canonical txid behavior

  #### Impact

  - Prevents incorrect previous output references caused by byte-order mismatch.
  - Aligns PSBTv0 -> PSBTv2 conversion behavior with expected transaction ID encoding.

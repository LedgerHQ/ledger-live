---
"@ledgerhq/hw-app-btc": patch
"@ledgerhq/types-live": patch
"@ledgerhq/coin-bitcoin": patch
"ledger-live-desktop": patch
"live-mobile": patch
"@ledgerhq/live-common": patch
"@ledgerhq/psbtv2": patch
---

fix(bitcoin): refactor signpsbt derivation population and finalize only when broadcasting

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
  - adds configurable `addressScanLimit` for local derivation scan depth
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

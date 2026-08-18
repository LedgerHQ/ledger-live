# @ledgerhq/hw-app-btc

## 11.4.0-next.0

### Minor Changes

- [#20368](https://github.com/LedgerHQ/ledger-live/pull/20368) [`d0e69c2`](https://github.com/LedgerHQ/ledger-live/commit/d0e69c28bdba14725ef5efce73deedb49062eb79) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Fix Zcash sends failing before the device prompt when the coin being spent came from a V6-format transaction.

  Spending a coin whose funding transaction is a V6 (NU6.3 / Ironwood) one failed immediately, with no review screen on the device and `getVarint called with unexpected parameters` in the logs. Like the V4 case, this is decided by which software created the funding transaction, so it looks intermittent while being deterministic.

  `splitTransaction` recognized Zcash headers up to V5. A V6 header fell through to the pre-Overwinter layout, so the input count was read off the version group id — `0x98`, meaning 152 inputs — and the parser ran past the end of the buffer and threw before any APDU was built.

  A V6 reuses the V5 header and transparent layout, so both are now read the same way. Its shielded section is not the same: ZIP-229 adds an Ironwood pool this parser does not model, and it is left unread rather than parsed as an Orchard bundle would be. Callers needing it work from the raw bytes, which is what the Zcash chain adapter already attaches and what the signer kit chunks for the device.

  Two guards keep the V6 path from failing quietly. `splitTransaction` now rejects a V6 whose version group id is not the `0xd884b698` that ZIP-229 mandates, before the fixed-offset header read commits to the V6 layout, and only claims the V6 header for Zcash — a V6 hex passed with other `additionals` falls through to the legacy layout whole instead of consuming a version group id nobody validated. `getTrustedInput` throws on a V6 rather than emitting the three-counter shielded frame of a V4/V5: a V6 needs a fourth counter for its Ironwood actions, so the old frame would have left the device reading that counter out of the trailing data and deriving a wrong transaction id.

## 11.3.1

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.35.7

## 11.3.1-next.0

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.35.7-next.0

## 11.3.0

### Minor Changes

- [#19550](https://github.com/LedgerHQ/ledger-live/pull/19550) [`d7edc6e`](https://github.com/LedgerHQ/ledger-live/commit/d7edc6ee38776dcbc6da341f734b42d78dc05836) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Add the NU6.3 Zcash consensus branch id (0x37a5165b, mainnet activation height 3,428,143) to the transparent height→branch-id table, so transactions signed through the legacy (non-DMK) Btc path after NU6.3 activation are accepted by the network. Unknown block heights now default to the NU6.3 branch id.

## 11.3.0-next.0

### Minor Changes

- [#19550](https://github.com/LedgerHQ/ledger-live/pull/19550) [`d7edc6e`](https://github.com/LedgerHQ/ledger-live/commit/d7edc6ee38776dcbc6da341f734b42d78dc05836) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Add the NU6.3 Zcash consensus branch id (0x37a5165b, mainnet activation height 3,428,143) to the transparent height→branch-id table, so transactions signed through the legacy (non-DMK) Btc path after NU6.3 activation are accepted by the network. Unknown block heights now default to the NU6.3 branch id.

## 11.2.2

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.35.6

## 11.2.2-next.0

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.35.6-next.0

## 11.2.1

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.35.5

## 11.2.1-next.0

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.35.5-next.0

## 11.2.0

### Minor Changes

- [#18128](https://github.com/LedgerHQ/ledger-live/pull/18128) [`ee80f10`](https://github.com/LedgerHQ/ledger-live/commit/ee80f10ba4367fb76f930164c697318e08b9b186) Thanks [@may01](https://github.com/may01)! - Fix Zcash consensus branch ID by adding NU6.2 activation height

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.35.4

## 11.2.0-next.0

### Minor Changes

- [#18128](https://github.com/LedgerHQ/ledger-live/pull/18128) [`ee80f10`](https://github.com/LedgerHQ/ledger-live/commit/ee80f10ba4367fb76f930164c697318e08b9b186) Thanks [@may01](https://github.com/may01)! - Fix Zcash consensus branch ID by adding NU6.2 activation height

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.35.4-next.0

## 11.1.0

### Minor Changes

- [#18180](https://github.com/LedgerHQ/ledger-live/pull/18180) [`d1792fb`](https://github.com/LedgerHQ/ledger-live/commit/d1792fb26fa22c042bee8098e2fe9fc39feafc0a) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Fix Zcash consensus branch ID by adding NU6.2 activation height

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.35.3

## 11.1.0-next.1

### Minor Changes

- [#18180](https://github.com/LedgerHQ/ledger-live/pull/18180) [`d1792fb`](https://github.com/LedgerHQ/ledger-live/commit/d1792fb26fa22c042bee8098e2fe9fc39feafc0a) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Fix Zcash consensus branch ID by adding NU6.2 activation height

## 11.0.1

### Patch Changes

- [#18183](https://github.com/LedgerHQ/ledger-live/pull/18183) [`6e54780`](https://github.com/LedgerHQ/ledger-live/commit/6e547801ec07c005861eaa68d181b83ce9d42a40) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Fix Zcash consensus branch ID by adding NU6.2 activation height

## 11.0.1-next.0

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.35.3-next.0

## 11.0.1-hotfix.0

### Patch Changes

- [#18183](https://github.com/LedgerHQ/ledger-live/pull/18183) [`6e54780`](https://github.com/LedgerHQ/ledger-live/commit/6e547801ec07c005861eaa68d181b83ce9d42a40) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Fix Zcash consensus branch ID by adding NU6.2 activation height

## 11.0.0

### Major Changes

- [#16796](https://github.com/LedgerHQ/ledger-live/pull/16796) [`00d692c`](https://github.com/LedgerHQ/ledger-live/commit/00d692ce539ebde1a3f7d623e91eca63a5278dfa) Thanks [@bigspider](https://github.com/bigspider)! - Use protocol version 1 of the Bitcoin application, supported since version 2.1.0.

## 11.0.0-next.0

### Major Changes

- [#16796](https://github.com/LedgerHQ/ledger-live/pull/16796) [`00d692c`](https://github.com/LedgerHQ/ledger-live/commit/00d692ce539ebde1a3f7d623e91eca63a5278dfa) Thanks [@bigspider](https://github.com/bigspider)! - Use protocol version 1 of the Bitcoin application, supported since version 2.1.0.

## 10.22.1

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.35.2

## 10.22.1-next.0

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.35.2-next.0

## 10.22.1

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-transport@6.35.2

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->

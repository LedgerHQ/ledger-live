# @features/platform-verify-address-intent

## 0.3.0-next.0

### Minor Changes

- [#21164](https://github.com/LedgerHQ/ledger-live/pull/21164) [`a2be85c`](https://github.com/LedgerHQ/ledger-live/commit/a2be85cd773ae59e454cd33b9a38548ea5b003f8) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Wire Pay Request Verify on mobile (intro sheet, DIE address confirmation, tracking).
  Share `getAddressVerification` (maps refuse / unsupported) in the platform intent package.

### Patch Changes

- Updated dependencies [[`9d5a6d9`](https://github.com/LedgerHQ/ledger-live/commit/9d5a6d980442ac78bcc1c3c12fbfee389aa8e0c9)]:
  - @features/platform-device-intent@5.2.0-next.0

## 0.2.0

### Minor Changes

- [#20986](https://github.com/LedgerHQ/ledger-live/pull/20986) [`9965d7f`](https://github.com/LedgerHQ/ledger-live/commit/9965d7ffb37efc1a2f50fe49c199afa2f05446bf) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add `@features/platform-verify-address-intent`, a Device Intent that verifies a receive address on the device Secure Screen, and wire it to the desktop Pay tab Verify CTA.

  The host injects a family-agnostic `startAddressVerification` (generic `getAddress` over the DIE DMK transport). When `ldmkTransport` is off, Verify opens the classic Receive modal. Address comparison is encoding-aware (case-insensitive for hex, exact otherwise). `verified` / `cancelled` / `unsupported` return to the request summary; `mismatch` closes the flow.

  Generalize desktop `InfoState` by adding a full-width `content` slot and optional `backgroundTone` support for the `spot` preset.

### Patch Changes

- Updated dependencies [[`9fa2ab5`](https://github.com/LedgerHQ/ledger-live/commit/9fa2ab5eb2003fcade4e5821f1253ae27c1af82d), [`9fa2ab5`](https://github.com/LedgerHQ/ledger-live/commit/9fa2ab5eb2003fcade4e5821f1253ae27c1af82d), [`582f422`](https://github.com/LedgerHQ/ledger-live/commit/582f422ec2fbe8bb852c7a847c3ee0ff0a01ab32)]:
  - @features/platform-device-intent@5.1.0

## 0.2.0-next.0

### Minor Changes

- [#20986](https://github.com/LedgerHQ/ledger-live/pull/20986) [`9965d7f`](https://github.com/LedgerHQ/ledger-live/commit/9965d7ffb37efc1a2f50fe49c199afa2f05446bf) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add `@features/platform-verify-address-intent`, a Device Intent that verifies a receive address on the device Secure Screen, and wire it to the desktop Pay tab Verify CTA.

  The host injects a family-agnostic `startAddressVerification` (generic `getAddress` over the DIE DMK transport). When `ldmkTransport` is off, Verify opens the classic Receive modal. Address comparison is encoding-aware (case-insensitive for hex, exact otherwise). `verified` / `cancelled` / `unsupported` return to the request summary; `mismatch` closes the flow.

  Generalize desktop `InfoState` by adding a full-width `content` slot and optional `backgroundTone` support for the `spot` preset.

### Patch Changes

- Updated dependencies [[`9fa2ab5`](https://github.com/LedgerHQ/ledger-live/commit/9fa2ab5eb2003fcade4e5821f1253ae27c1af82d), [`9fa2ab5`](https://github.com/LedgerHQ/ledger-live/commit/9fa2ab5eb2003fcade4e5821f1253ae27c1af82d), [`582f422`](https://github.com/LedgerHQ/ledger-live/commit/582f422ec2fbe8bb852c7a847c3ee0ff0a01ab32)]:
  - @features/platform-device-intent@5.1.0-next.0

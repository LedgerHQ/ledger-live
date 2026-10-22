# @ledgerhq/live-signer-tron

## 0.2.2

### Patch Changes

- Updated dependencies [[`a8d48a9`](https://github.com/LedgerHQ/ledger-live/commit/a8d48a97f1bae0c2adad5d2790c9cc8ab5d7c2b0)]:
  - @ledgerhq/live-dmk-shared@0.36.0

## 0.2.2-next.0

### Patch Changes

- Updated dependencies [[`a8d48a9`](https://github.com/LedgerHQ/ledger-live/commit/a8d48a97f1bae0c2adad5d2790c9cc8ab5d7c2b0)]:
  - @ledgerhq/live-dmk-shared@0.36.0-next.0

## 0.2.1

### Patch Changes

- Updated dependencies [[`d33fd72`](https://github.com/LedgerHQ/ledger-live/commit/d33fd721a5d1a9363f820738f6aadbeb0a8b3cad), [`d819300`](https://github.com/LedgerHQ/ledger-live/commit/d819300df11d1e58ad33dbb8d0dbdb6f20c8dd93), [`e308deb`](https://github.com/LedgerHQ/ledger-live/commit/e308deb3e4f812f01166de17bb28c587a290b9bb), [`3a45eb3`](https://github.com/LedgerHQ/ledger-live/commit/3a45eb3e29f417f24570787e76d977cefa5090d9), [`3444d16`](https://github.com/LedgerHQ/ledger-live/commit/3444d16d5159b6e415b4dd0ab4fedfbf4cbeb260), [`e3e6c22`](https://github.com/LedgerHQ/ledger-live/commit/e3e6c222ddba748a7e9e03e85f5919ce8e5c28bd), [`1a9b21e`](https://github.com/LedgerHQ/ledger-live/commit/1a9b21e6cc971d5e5b069cab968826b15332024b), [`8737f89`](https://github.com/LedgerHQ/ledger-live/commit/8737f89e2b515ab518cbcdeacc064641c6f595be), [`42d4dc2`](https://github.com/LedgerHQ/ledger-live/commit/42d4dc25044dceb9936c1907fb5ea0838fa0a64b), [`9a39ad5`](https://github.com/LedgerHQ/ledger-live/commit/9a39ad5eeeaefff74791ec01db8c62c102b6e54a)]:
  - @ledgerhq/live-dmk-shared@0.35.0
  - @ledgerhq/hw-app-trx@6.37.0

## 0.2.1-next.0

### Patch Changes

- Updated dependencies [[`d33fd72`](https://github.com/LedgerHQ/ledger-live/commit/d33fd721a5d1a9363f820738f6aadbeb0a8b3cad), [`d819300`](https://github.com/LedgerHQ/ledger-live/commit/d819300df11d1e58ad33dbb8d0dbdb6f20c8dd93), [`e308deb`](https://github.com/LedgerHQ/ledger-live/commit/e308deb3e4f812f01166de17bb28c587a290b9bb), [`3a45eb3`](https://github.com/LedgerHQ/ledger-live/commit/3a45eb3e29f417f24570787e76d977cefa5090d9), [`3444d16`](https://github.com/LedgerHQ/ledger-live/commit/3444d16d5159b6e415b4dd0ab4fedfbf4cbeb260), [`e3e6c22`](https://github.com/LedgerHQ/ledger-live/commit/e3e6c222ddba748a7e9e03e85f5919ce8e5c28bd), [`1a9b21e`](https://github.com/LedgerHQ/ledger-live/commit/1a9b21e6cc971d5e5b069cab968826b15332024b), [`8737f89`](https://github.com/LedgerHQ/ledger-live/commit/8737f89e2b515ab518cbcdeacc064641c6f595be), [`42d4dc2`](https://github.com/LedgerHQ/ledger-live/commit/42d4dc25044dceb9936c1907fb5ea0838fa0a64b), [`9a39ad5`](https://github.com/LedgerHQ/ledger-live/commit/9a39ad5eeeaefff74791ec01db8c62c102b6e54a)]:
  - @ledgerhq/live-dmk-shared@0.35.0-next.0
  - @ledgerhq/hw-app-trx@6.37.0

## 0.2.0

### Minor Changes

- [#22503](https://github.com/LedgerHQ/ledger-live/pull/22503) [`33b4952`](https://github.com/LedgerHQ/ledger-live/commit/33b4952ef04d4e0528d2735ba299b4a8073e447e) Thanks [@daniel-choinski-ledger](https://github.com/daniel-choinski-ledger)! - Inject the Tron address book into the DMK Tron signer so Tron transactions can clear-sign saved contact names.

  Adds a generic `AddressBookProvider<T>` in `live-dmk-shared` (the EVM provider is refactored onto it), a `tronAddressBookProvider` instance, a pure `toTronAddressBook` mapper (`Contact[] -> TronAddressBook`, Tron-family only, no chain id, `ledgerAccounts` always empty), and registers the source at each app's composition root. An absent or empty book leaves signing behavior unchanged.

- [#22054](https://github.com/LedgerHQ/ledger-live/pull/22054) [`8c486aa`](https://github.com/LedgerHQ/ledger-live/commit/8c486aabe3dbd100b21e43d3f344fda5142858ed) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Add `@ledgerhq/live-signer-tron`, wrapping `@ledgerhq/device-signer-kit-tron` as `DmkSignerTron`
  alongside the legacy `hw-app-trx` path as `LegacySignerTron`. `families/tron/setup.ts` picks
  between them, using the DMK signer only on a DMK transport with the new `ldmkTronSigner` feature
  flag on. The flag is disabled by default, so Tron keeps signing through `hw-app-trx`.

### Patch Changes

- Updated dependencies [[`e8d5e1b`](https://github.com/LedgerHQ/ledger-live/commit/e8d5e1bf6eec2a47072ad59762064b24a89701cf), [`33b4952`](https://github.com/LedgerHQ/ledger-live/commit/33b4952ef04d4e0528d2735ba299b4a8073e447e)]:
  - @ledgerhq/live-dmk-shared@0.34.0

## 0.2.0-next.0

### Minor Changes

- [#22503](https://github.com/LedgerHQ/ledger-live/pull/22503) [`33b4952`](https://github.com/LedgerHQ/ledger-live/commit/33b4952ef04d4e0528d2735ba299b4a8073e447e) Thanks [@daniel-choinski-ledger](https://github.com/daniel-choinski-ledger)! - Inject the Tron address book into the DMK Tron signer so Tron transactions can clear-sign saved contact names.

  Adds a generic `AddressBookProvider<T>` in `live-dmk-shared` (the EVM provider is refactored onto it), a `tronAddressBookProvider` instance, a pure `toTronAddressBook` mapper (`Contact[] -> TronAddressBook`, Tron-family only, no chain id, `ledgerAccounts` always empty), and registers the source at each app's composition root. An absent or empty book leaves signing behavior unchanged.

- [#22054](https://github.com/LedgerHQ/ledger-live/pull/22054) [`8c486aa`](https://github.com/LedgerHQ/ledger-live/commit/8c486aabe3dbd100b21e43d3f344fda5142858ed) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Add `@ledgerhq/live-signer-tron`, wrapping `@ledgerhq/device-signer-kit-tron` as `DmkSignerTron`
  alongside the legacy `hw-app-trx` path as `LegacySignerTron`. `families/tron/setup.ts` picks
  between them, using the DMK signer only on a DMK transport with the new `ldmkTronSigner` feature
  flag on. The flag is disabled by default, so Tron keeps signing through `hw-app-trx`.

### Patch Changes

- Updated dependencies [[`e8d5e1b`](https://github.com/LedgerHQ/ledger-live/commit/e8d5e1bf6eec2a47072ad59762064b24a89701cf), [`33b4952`](https://github.com/LedgerHQ/ledger-live/commit/33b4952ef04d4e0528d2735ba299b4a8073e447e)]:
  - @ledgerhq/live-dmk-shared@0.34.0-next.0

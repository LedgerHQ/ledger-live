# @features/flow-contacts-delete-address

## 0.2.0

### Minor Changes

- [#23433](https://github.com/LedgerHQ/ledger-live/pull/23433) [`ad6aad8`](https://github.com/LedgerHQ/ledger-live/commit/ad6aad8eec3a718da9359ad683350360f745d0d5) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Resolve Delete address copy inside the package with @shared/i18n

- [#23389](https://github.com/LedgerHQ/ledger-live/pull/23389) [`03f4e70`](https://github.com/LedgerHQ/ledger-live/commit/03f4e70f38efc9362beae2e8ef12567cced3d3c6) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Extract address deletion into `@features/flow-contacts-delete-address` so Desktop and Mobile can reuse it without going through Contact Detail. Confirmation UI stays in `@features/platform-contacts`. Apps still own modal mounting, navigation, translations, and analytics.

### Patch Changes

- Updated dependencies [[`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c), [`4fd1ebc`](https://github.com/LedgerHQ/ledger-live/commit/4fd1ebc94718ead589f235824f0440803341feb9)]:
  - @features/platform-contacts@0.11.0
  - @domain/entity-contact@0.12.1

## 0.2.0-next.0

### Minor Changes

- [#23433](https://github.com/LedgerHQ/ledger-live/pull/23433) [`ad6aad8`](https://github.com/LedgerHQ/ledger-live/commit/ad6aad8eec3a718da9359ad683350360f745d0d5) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Resolve Delete address copy inside the package with @shared/i18n

- [#23389](https://github.com/LedgerHQ/ledger-live/pull/23389) [`03f4e70`](https://github.com/LedgerHQ/ledger-live/commit/03f4e70f38efc9362beae2e8ef12567cced3d3c6) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Extract address deletion into `@features/flow-contacts-delete-address` so Desktop and Mobile can reuse it without going through Contact Detail. Confirmation UI stays in `@features/platform-contacts`. Apps still own modal mounting, navigation, translations, and analytics.

### Patch Changes

- Updated dependencies [[`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c), [`4fd1ebc`](https://github.com/LedgerHQ/ledger-live/commit/4fd1ebc94718ead589f235824f0440803341feb9)]:
  - @features/platform-contacts@0.11.0-next.0
  - @domain/entity-contact@0.12.1-next.0

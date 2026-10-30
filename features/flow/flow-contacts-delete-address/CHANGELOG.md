# @features/flow-contacts-delete-address

## 0.3.0-next.0

### Minor Changes

- [#23973](https://github.com/LedgerHQ/ledger-live/pull/23973) [`57c72ac`](https://github.com/LedgerHQ/ledger-live/commit/57c72ac92d3c9352b751b21bb96d64f19a2b6cb1) Thanks [@ysitbon](https://github.com/ysitbon)! - Every `@features/platform-contacts` component has one props contract on both platforms. `ContactConfirmationDialog` replaces `ContactConfirmationBottomSheet` on mobile and takes a `tone` (`destructive` or `neutral`), `isConfirming` and `testID`; it reads the sheet's bottom inset itself. `ContactAvatar` takes `testID` instead of `testId` and drops `ariaLabel`, `ContactNameInput` calls `onChangeName`, and `ContactNameDisclaimer` now renders on mobile too. The `.` entry has no `react-native` condition, `./native` is gone, and `./web` exports only `getPastedValue`.

### Patch Changes

- Updated dependencies [[`9a1198f`](https://github.com/LedgerHQ/ledger-live/commit/9a1198fd10a67e2893163985b884c7437b4d036a), [`57c72ac`](https://github.com/LedgerHQ/ledger-live/commit/57c72ac92d3c9352b751b21bb96d64f19a2b6cb1), [`067b492`](https://github.com/LedgerHQ/ledger-live/commit/067b492cafa20166ce080344b7cb2d6c71f43301)]:
  - @features/platform-contacts@0.12.0-next.0
  - @domain/entity-contact@0.12.2-next.0
  - @shared/i18n@0.2.0

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

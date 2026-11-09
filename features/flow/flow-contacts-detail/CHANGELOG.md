# @features/flow-contacts-detail

## 0.4.0-next.0

### Minor Changes

- [#24217](https://github.com/LedgerHQ/ledger-live/pull/24217) [`298bf8d`](https://github.com/LedgerHQ/ledger-live/commit/298bf8de83301f558607d4611643ec8e54277a7e) Thanks [@ysitbon](https://github.com/ysitbon)! - `ContactDetailActionsMenu` moves to the native platform entry `@features/flow-contacts-detail/native` and reads its bottom inset from the sheet context; `ContactDetailActions` becomes internal. The universal entry is one unconditioned `src/index.ts`, `ContactAddressDetailDialog` and `ContactsEditSignerMismatchDialog` each have one props contract, `ContactDetailView` takes `onOpenLedgerWalletAccounts` and `onOpenAddressDetail`, and the web address detail dialog shows a Share tile when `onShareAddress` is set.

- [#24134](https://github.com/LedgerHQ/ledger-live/pull/24134) [`b582a36`](https://github.com/LedgerHQ/ledger-live/commit/b582a360738037ab8393a554f304d9e942892287) Thanks [@renovate-operator-ledger](https://github.com/apps/renovate-operator-ledger)! - chore(deps): update dependency @ledgerhq/crypto-icons to v2.0.7

  - Updated `@ledgerhq/crypto-icons` to `2.0.7`

### Patch Changes

- Updated dependencies [[`a95a6bc`](https://github.com/LedgerHQ/ledger-live/commit/a95a6bcb630289fde6782430fb511b9c48c9ffcc), [`360d6c9`](https://github.com/LedgerHQ/ledger-live/commit/360d6c9c4e4c37284397ee3118224767bc49076b), [`cea0076`](https://github.com/LedgerHQ/ledger-live/commit/cea0076fb3fd7c19d0e73b99ac76507278e390a4), [`31f7eba`](https://github.com/LedgerHQ/ledger-live/commit/31f7ebace98301cb3e46185a91621aa3ef59bb3b), [`7324065`](https://github.com/LedgerHQ/ledger-live/commit/732406590c11eca310f977f401429e4e1270c4b4), [`934970a`](https://github.com/LedgerHQ/ledger-live/commit/934970adec67ed88f1d546d03b1bb555cbfd128f), [`e7b21f8`](https://github.com/LedgerHQ/ledger-live/commit/e7b21f816021dbbe7314ff51bf32cc4d87291b98)]:
  - @domain/entity-currency-crypto@0.19.0-next.0
  - @domain/entity-contact@0.13.0-next.0
  - @features/platform-contacts@0.12.2-next.0
  - @features/flow-contacts-delete-address@0.4.1-next.0
  - @features/flow-contacts-delete-contact@0.5.1-next.0
  - @features/flow-contacts-edit-address@0.7.1-next.0
  - @features/flow-contacts-edit-contact@0.9.1-next.0

## 0.3.1

### Patch Changes

- Updated dependencies [[`9907890`](https://github.com/LedgerHQ/ledger-live/commit/9907890790bf8b804d7cc454a067508df0969137), [`0c9ce30`](https://github.com/LedgerHQ/ledger-live/commit/0c9ce30960837b6cf52f5df9be2999a5c7377abf), [`55dc039`](https://github.com/LedgerHQ/ledger-live/commit/55dc0396b8bea844c6b745dc54f8b5b7a01c0ecd), [`d7778b9`](https://github.com/LedgerHQ/ledger-live/commit/d7778b9a6fcaae428e8a4e30e0bcdab13e6b2c1d), [`1dee328`](https://github.com/LedgerHQ/ledger-live/commit/1dee328bd842dce945aff197ecf14d665b453bfd), [`77a85a3`](https://github.com/LedgerHQ/ledger-live/commit/77a85a30abe7b42e5f5b4e0478bec14fa39033cf)]:
  - @domain/entity-currency-crypto@0.18.0
  - @features/flow-contacts-delete-address@0.4.0
  - @features/flow-contacts-delete-contact@0.5.0
  - @features/flow-contacts-edit-address@0.7.0
  - @features/flow-contacts-edit-contact@0.9.0
  - @domain/entity-contact@0.12.3
  - @features/platform-contacts@0.12.1

## 0.3.1-next.0

### Patch Changes

- Updated dependencies [[`9907890`](https://github.com/LedgerHQ/ledger-live/commit/9907890790bf8b804d7cc454a067508df0969137), [`0c9ce30`](https://github.com/LedgerHQ/ledger-live/commit/0c9ce30960837b6cf52f5df9be2999a5c7377abf), [`55dc039`](https://github.com/LedgerHQ/ledger-live/commit/55dc0396b8bea844c6b745dc54f8b5b7a01c0ecd), [`d7778b9`](https://github.com/LedgerHQ/ledger-live/commit/d7778b9a6fcaae428e8a4e30e0bcdab13e6b2c1d), [`1dee328`](https://github.com/LedgerHQ/ledger-live/commit/1dee328bd842dce945aff197ecf14d665b453bfd), [`77a85a3`](https://github.com/LedgerHQ/ledger-live/commit/77a85a30abe7b42e5f5b4e0478bec14fa39033cf)]:
  - @domain/entity-currency-crypto@0.18.0-next.0
  - @features/flow-contacts-delete-address@0.4.0-next.0
  - @features/flow-contacts-delete-contact@0.5.0-next.0
  - @features/flow-contacts-edit-address@0.7.0-next.0
  - @features/flow-contacts-edit-contact@0.9.0-next.0
  - @domain/entity-contact@0.12.3-next.0
  - @features/platform-contacts@0.12.1-next.0

## 0.3.0

### Minor Changes

- [#23973](https://github.com/LedgerHQ/ledger-live/pull/23973) [`57c72ac`](https://github.com/LedgerHQ/ledger-live/commit/57c72ac92d3c9352b751b21bb96d64f19a2b6cb1) Thanks [@ysitbon](https://github.com/ysitbon)! - Every `@features/platform-contacts` component has one props contract on both platforms. `ContactConfirmationDialog` replaces `ContactConfirmationBottomSheet` on mobile and takes a `tone` (`destructive` or `neutral`), `isConfirming` and `testID`; it reads the sheet's bottom inset itself. `ContactAvatar` takes `testID` instead of `testId` and drops `ariaLabel`, `ContactNameInput` calls `onChangeName`, and `ContactNameDisclaimer` now renders on mobile too. The `.` entry has no `react-native` condition, `./native` is gone, and `./web` exports only `getPastedValue`.

### Patch Changes

- Updated dependencies [[`e3e0f3a`](https://github.com/LedgerHQ/ledger-live/commit/e3e0f3a5fefbdcf08c8c16d7dc2a3d9f6a6922e0), [`08730f5`](https://github.com/LedgerHQ/ledger-live/commit/08730f575a9ec7d9887f9b64ebf492a6d44ac6e8), [`9a1198f`](https://github.com/LedgerHQ/ledger-live/commit/9a1198fd10a67e2893163985b884c7437b4d036a), [`57c72ac`](https://github.com/LedgerHQ/ledger-live/commit/57c72ac92d3c9352b751b21bb96d64f19a2b6cb1), [`067b492`](https://github.com/LedgerHQ/ledger-live/commit/067b492cafa20166ce080344b7cb2d6c71f43301)]:
  - @domain/entity-currency-crypto@0.17.0
  - @features/platform-contacts@0.12.0
  - @features/flow-contacts-delete-address@0.3.0
  - @features/flow-contacts-delete-contact@0.4.0
  - @features/flow-contacts-edit-address@0.6.0
  - @features/flow-contacts-edit-contact@0.8.0
  - @domain/entity-contact@0.12.2
  - @shared/clipboard@0.1.0
  - @shared/i18n@0.2.0
  - @shared/ui-qr-code@0.5.0

## 0.3.0-next.0

### Minor Changes

- [#23973](https://github.com/LedgerHQ/ledger-live/pull/23973) [`57c72ac`](https://github.com/LedgerHQ/ledger-live/commit/57c72ac92d3c9352b751b21bb96d64f19a2b6cb1) Thanks [@ysitbon](https://github.com/ysitbon)! - Every `@features/platform-contacts` component has one props contract on both platforms. `ContactConfirmationDialog` replaces `ContactConfirmationBottomSheet` on mobile and takes a `tone` (`destructive` or `neutral`), `isConfirming` and `testID`; it reads the sheet's bottom inset itself. `ContactAvatar` takes `testID` instead of `testId` and drops `ariaLabel`, `ContactNameInput` calls `onChangeName`, and `ContactNameDisclaimer` now renders on mobile too. The `.` entry has no `react-native` condition, `./native` is gone, and `./web` exports only `getPastedValue`.

### Patch Changes

- Updated dependencies [[`e3e0f3a`](https://github.com/LedgerHQ/ledger-live/commit/e3e0f3a5fefbdcf08c8c16d7dc2a3d9f6a6922e0), [`08730f5`](https://github.com/LedgerHQ/ledger-live/commit/08730f575a9ec7d9887f9b64ebf492a6d44ac6e8), [`9a1198f`](https://github.com/LedgerHQ/ledger-live/commit/9a1198fd10a67e2893163985b884c7437b4d036a), [`57c72ac`](https://github.com/LedgerHQ/ledger-live/commit/57c72ac92d3c9352b751b21bb96d64f19a2b6cb1), [`067b492`](https://github.com/LedgerHQ/ledger-live/commit/067b492cafa20166ce080344b7cb2d6c71f43301)]:
  - @domain/entity-currency-crypto@0.17.0-next.0
  - @features/platform-contacts@0.12.0-next.0
  - @features/flow-contacts-delete-address@0.3.0-next.0
  - @features/flow-contacts-delete-contact@0.4.0-next.0
  - @features/flow-contacts-edit-address@0.6.0-next.0
  - @features/flow-contacts-edit-contact@0.8.0-next.0
  - @domain/entity-contact@0.12.2-next.0
  - @shared/clipboard@0.1.0
  - @shared/i18n@0.2.0
  - @shared/ui-qr-code@0.5.0

## 0.2.0

### Minor Changes

- [#23322](https://github.com/LedgerHQ/ledger-live/pull/23322) [`1349df3`](https://github.com/LedgerHQ/ledger-live/commit/1349df3f6e9a27eeecc8495ca99a453341d7bf70) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Extract the Contact Detail journey into `@features/flow-contacts-detail` so Desktop and Mobile can reuse it, while the Contacts aggregate keeps cross-journey orchestration

- [#23429](https://github.com/LedgerHQ/ledger-live/pull/23429) [`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Bump Lumen to lumen-design-core 0.1.32, lumen-ui-react 0.1.64, lumen-ui-rnative 0.1.67 and lumen-utils-shared 0.1.16, and migrate `Spot` to its palette API (`icon` required, `appearance="icon"` dropped, `check`/`info`/`error`/`warning`/`loader` mapped to explicit icons, `number` moved to `SpotNumber`). The devtools native jest preset now mocks `react-native-gesture-handler`, which the new lumen `Toaster` imports.

- [#23506](https://github.com/LedgerHQ/ledger-live/pull/23506) [`2f9c159`](https://github.com/LedgerHQ/ledger-live/commit/2f9c1598145b8a7dadab43b12a5deb4ab9dc91c9) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Resolve Contact detail copy inside the package with @shared/i18n

- [#23389](https://github.com/LedgerHQ/ledger-live/pull/23389) [`03f4e70`](https://github.com/LedgerHQ/ledger-live/commit/03f4e70f38efc9362beae2e8ef12567cced3d3c6) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Extract address deletion into `@features/flow-contacts-delete-address` so Desktop and Mobile can reuse it without going through Contact Detail. Confirmation UI stays in `@features/platform-contacts`. Apps still own modal mounting, navigation, translations, and analytics.

### Patch Changes

- Updated dependencies [[`d6ab47c`](https://github.com/LedgerHQ/ledger-live/commit/d6ab47c28339866ad88ef0deba75d314c2f6c4f0), [`393a02a`](https://github.com/LedgerHQ/ledger-live/commit/393a02a42be9f0410b75c0c34203915bcde27e43), [`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c), [`7da1ea9`](https://github.com/LedgerHQ/ledger-live/commit/7da1ea9534a1bdde063e31545363a27f0fdf5abb), [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574), [`2f9c159`](https://github.com/LedgerHQ/ledger-live/commit/2f9c1598145b8a7dadab43b12a5deb4ab9dc91c9), [`75498cf`](https://github.com/LedgerHQ/ledger-live/commit/75498cf55065bccf17d09b780866ae031c01701a), [`ad6aad8`](https://github.com/LedgerHQ/ledger-live/commit/ad6aad8eec3a718da9359ad683350360f745d0d5), [`47e5b74`](https://github.com/LedgerHQ/ledger-live/commit/47e5b740cf64f177fd1cbbfa7f5bf74de3d45661), [`ff33162`](https://github.com/LedgerHQ/ledger-live/commit/ff331621a49337b1065c373f16aa479fa0ab5c8b), [`5e9a60a`](https://github.com/LedgerHQ/ledger-live/commit/5e9a60ac27b41be43d1ea24b0d11acec92260c49), [`ad58765`](https://github.com/LedgerHQ/ledger-live/commit/ad58765b6151457022f8587d6ddcad3325ce96ac), [`03f4e70`](https://github.com/LedgerHQ/ledger-live/commit/03f4e70f38efc9362beae2e8ef12567cced3d3c6), [`4fd1ebc`](https://github.com/LedgerHQ/ledger-live/commit/4fd1ebc94718ead589f235824f0440803341feb9), [`37a49df`](https://github.com/LedgerHQ/ledger-live/commit/37a49df18649912157d8f269c3b4153d54b7817e)]:
  - @domain/entity-currency-crypto@0.16.0
  - @features/platform-contacts@0.11.0
  - @features/flow-contacts-edit-address@0.5.0
  - @features/flow-contacts-delete-address@0.2.0
  - @features/flow-contacts-delete-contact@0.3.0
  - @features/flow-contacts-edit-contact@0.7.0
  - @domain/entity-contact@0.12.1

## 0.2.0-next.0

### Minor Changes

- [#23322](https://github.com/LedgerHQ/ledger-live/pull/23322) [`1349df3`](https://github.com/LedgerHQ/ledger-live/commit/1349df3f6e9a27eeecc8495ca99a453341d7bf70) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Extract the Contact Detail journey into `@features/flow-contacts-detail` so Desktop and Mobile can reuse it, while the Contacts aggregate keeps cross-journey orchestration

- [#23429](https://github.com/LedgerHQ/ledger-live/pull/23429) [`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Bump Lumen to lumen-design-core 0.1.32, lumen-ui-react 0.1.64, lumen-ui-rnative 0.1.67 and lumen-utils-shared 0.1.16, and migrate `Spot` to its palette API (`icon` required, `appearance="icon"` dropped, `check`/`info`/`error`/`warning`/`loader` mapped to explicit icons, `number` moved to `SpotNumber`). The devtools native jest preset now mocks `react-native-gesture-handler`, which the new lumen `Toaster` imports.

- [#23506](https://github.com/LedgerHQ/ledger-live/pull/23506) [`2f9c159`](https://github.com/LedgerHQ/ledger-live/commit/2f9c1598145b8a7dadab43b12a5deb4ab9dc91c9) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Resolve Contact detail copy inside the package with @shared/i18n

- [#23389](https://github.com/LedgerHQ/ledger-live/pull/23389) [`03f4e70`](https://github.com/LedgerHQ/ledger-live/commit/03f4e70f38efc9362beae2e8ef12567cced3d3c6) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Extract address deletion into `@features/flow-contacts-delete-address` so Desktop and Mobile can reuse it without going through Contact Detail. Confirmation UI stays in `@features/platform-contacts`. Apps still own modal mounting, navigation, translations, and analytics.

### Patch Changes

- Updated dependencies [[`d6ab47c`](https://github.com/LedgerHQ/ledger-live/commit/d6ab47c28339866ad88ef0deba75d314c2f6c4f0), [`393a02a`](https://github.com/LedgerHQ/ledger-live/commit/393a02a42be9f0410b75c0c34203915bcde27e43), [`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c), [`7da1ea9`](https://github.com/LedgerHQ/ledger-live/commit/7da1ea9534a1bdde063e31545363a27f0fdf5abb), [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574), [`2f9c159`](https://github.com/LedgerHQ/ledger-live/commit/2f9c1598145b8a7dadab43b12a5deb4ab9dc91c9), [`75498cf`](https://github.com/LedgerHQ/ledger-live/commit/75498cf55065bccf17d09b780866ae031c01701a), [`ad6aad8`](https://github.com/LedgerHQ/ledger-live/commit/ad6aad8eec3a718da9359ad683350360f745d0d5), [`47e5b74`](https://github.com/LedgerHQ/ledger-live/commit/47e5b740cf64f177fd1cbbfa7f5bf74de3d45661), [`ff33162`](https://github.com/LedgerHQ/ledger-live/commit/ff331621a49337b1065c373f16aa479fa0ab5c8b), [`5e9a60a`](https://github.com/LedgerHQ/ledger-live/commit/5e9a60ac27b41be43d1ea24b0d11acec92260c49), [`ad58765`](https://github.com/LedgerHQ/ledger-live/commit/ad58765b6151457022f8587d6ddcad3325ce96ac), [`03f4e70`](https://github.com/LedgerHQ/ledger-live/commit/03f4e70f38efc9362beae2e8ef12567cced3d3c6), [`4fd1ebc`](https://github.com/LedgerHQ/ledger-live/commit/4fd1ebc94718ead589f235824f0440803341feb9), [`37a49df`](https://github.com/LedgerHQ/ledger-live/commit/37a49df18649912157d8f269c3b4153d54b7817e)]:
  - @domain/entity-currency-crypto@0.16.0-next.0
  - @features/platform-contacts@0.11.0-next.0
  - @features/flow-contacts-edit-address@0.5.0-next.0
  - @features/flow-contacts-delete-address@0.2.0-next.0
  - @features/flow-contacts-delete-contact@0.3.0-next.0
  - @features/flow-contacts-edit-contact@0.7.0-next.0
  - @domain/entity-contact@0.12.1-next.0

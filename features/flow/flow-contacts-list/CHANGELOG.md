# @features/flow-contacts-list

## 0.13.0-next.0

### Minor Changes

- [#25369](https://github.com/LedgerHQ/ledger-live/pull/25369) [`5c7f0ef`](https://github.com/LedgerHQ/ledger-live/commit/5c7f0ef8aaebce9ac0dcf1eb509dd0756f389b10) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Upgrade Lumen to latest

  - Updated `@ledgerhq/lumen-design-core` to `0.1.37`
  - Updated `@ledgerhq/lumen-ui-react` to `0.1.75`
  - Updated `@ledgerhq/lumen-ui-rnative` to `0.1.76`

### Patch Changes

- Updated dependencies []:
  - @features/platform-contacts@0.13.2-next.0
  - @domain/entity-contact@0.13.2-next.0

## 0.12.3

### Patch Changes

- Updated dependencies []:
  - @features/platform-contacts@0.13.1
  - @domain/entity-contact@0.13.1

## 0.12.3-next.0

### Patch Changes

- Updated dependencies []:
  - @features/platform-contacts@0.13.1-next.0
  - @domain/entity-contact@0.13.1-next.0

## 0.12.2

### Patch Changes

- Updated dependencies [[`a5a5309`](https://github.com/LedgerHQ/ledger-live/commit/a5a5309e913428497dfff7e1e13ad3d18e995cf3)]:
  - @features/platform-contacts@0.13.0

## 0.12.2-next.0

### Patch Changes

- Updated dependencies [[`a5a5309`](https://github.com/LedgerHQ/ledger-live/commit/a5a5309e913428497dfff7e1e13ad3d18e995cf3)]:
  - @features/platform-contacts@0.13.0-next.0

## 0.12.1

### Patch Changes

- Updated dependencies [[`360d6c9`](https://github.com/LedgerHQ/ledger-live/commit/360d6c9c4e4c37284397ee3118224767bc49076b), [`cea0076`](https://github.com/LedgerHQ/ledger-live/commit/cea0076fb3fd7c19d0e73b99ac76507278e390a4), [`934970a`](https://github.com/LedgerHQ/ledger-live/commit/934970adec67ed88f1d546d03b1bb555cbfd128f)]:
  - @domain/entity-contact@0.13.0
  - @features/platform-contacts@0.12.2

## 0.12.1-next.0

### Patch Changes

- Updated dependencies [[`360d6c9`](https://github.com/LedgerHQ/ledger-live/commit/360d6c9c4e4c37284397ee3118224767bc49076b), [`cea0076`](https://github.com/LedgerHQ/ledger-live/commit/cea0076fb3fd7c19d0e73b99ac76507278e390a4), [`934970a`](https://github.com/LedgerHQ/ledger-live/commit/934970adec67ed88f1d546d03b1bb555cbfd128f)]:
  - @domain/entity-contact@0.13.0-next.0
  - @features/platform-contacts@0.12.2-next.0

## 0.12.0

### Minor Changes

- [#24029](https://github.com/LedgerHQ/ledger-live/pull/24029) [`4bb6da0`](https://github.com/LedgerHQ/ledger-live/commit/4bb6da0fa786d014149c544d414398786aae9fc6) Thanks [@ysitbon](https://github.com/ysitbon)! - `@features/flow-contacts-list` exports `ContactsListView` from `./web` and `./native`, each with its own props, and `ContactsAddContactHeaderButton` from `./native`. The `.` entry has no `react-native` condition and exports the list logic plus the universal `ContactsCompactList`, which now calls `onSelectContact` and takes an optional `testID`. `ContactsCompactRow` and `ContactsSearchNoResults` are no longer exported, and `@features/flow-contacts` stops re-exporting `ContactsAddContactHeaderButton`.

### Patch Changes

- Updated dependencies []:
  - @domain/entity-contact@0.12.3
  - @features/platform-contacts@0.12.1

## 0.12.0-next.0

### Minor Changes

- [#24029](https://github.com/LedgerHQ/ledger-live/pull/24029) [`4bb6da0`](https://github.com/LedgerHQ/ledger-live/commit/4bb6da0fa786d014149c544d414398786aae9fc6) Thanks [@ysitbon](https://github.com/ysitbon)! - `@features/flow-contacts-list` exports `ContactsListView` from `./web` and `./native`, each with its own props, and `ContactsAddContactHeaderButton` from `./native`. The `.` entry has no `react-native` condition and exports the list logic plus the universal `ContactsCompactList`, which now calls `onSelectContact` and takes an optional `testID`. `ContactsCompactRow` and `ContactsSearchNoResults` are no longer exported, and `@features/flow-contacts` stops re-exporting `ContactsAddContactHeaderButton`.

### Patch Changes

- Updated dependencies []:
  - @domain/entity-contact@0.12.3-next.0
  - @features/platform-contacts@0.12.1-next.0

## 0.11.0

### Minor Changes

- [#23888](https://github.com/LedgerHQ/ledger-live/pull/23888) [`7ce8446`](https://github.com/LedgerHQ/ledger-live/commit/7ce8446db105f07bf142ab3bba9627875178f065) Thanks [@zel-kass](https://github.com/zel-kass)! - Bump Lumen to lumen-design-core 0.1.34, lumen-ui-react 0.1.67, lumen-ui-rnative 0.1.70, lumen-utils-shared 0.1.18 and lumen-lint-plugin 0.1.1. `cn` now comes from `@ledgerhq/lumen-design-core/cn` (the local helpers re-export it), the `Apex` icon is renamed `NanoGen5`, the removed `BellNotification` and `ShieldCheckNotification` icons are replaced by the plain icon inside a red `DotIndicator`, `FormattedValue` is imported from `@ledgerhq/lumen-ui-react` instead of `@ledgerhq/lumen-utils-shared`, Tailwind font classes that produce no CSS under the Lumen preset are dropped, and the `clsx`, `tailwind-merge`, `@radix-ui/react-switch` and `@radix-ui/react-checkbox` declarations Lumen no longer needs are removed.

- [#23973](https://github.com/LedgerHQ/ledger-live/pull/23973) [`57c72ac`](https://github.com/LedgerHQ/ledger-live/commit/57c72ac92d3c9352b751b21bb96d64f19a2b6cb1) Thanks [@ysitbon](https://github.com/ysitbon)! - Every `@features/platform-contacts` component has one props contract on both platforms. `ContactConfirmationDialog` replaces `ContactConfirmationBottomSheet` on mobile and takes a `tone` (`destructive` or `neutral`), `isConfirming` and `testID`; it reads the sheet's bottom inset itself. `ContactAvatar` takes `testID` instead of `testId` and drops `ariaLabel`, `ContactNameInput` calls `onChangeName`, and `ContactNameDisclaimer` now renders on mobile too. The `.` entry has no `react-native` condition, `./native` is gone, and `./web` exports only `getPastedValue`.

### Patch Changes

- Updated dependencies [[`9a1198f`](https://github.com/LedgerHQ/ledger-live/commit/9a1198fd10a67e2893163985b884c7437b4d036a), [`57c72ac`](https://github.com/LedgerHQ/ledger-live/commit/57c72ac92d3c9352b751b21bb96d64f19a2b6cb1), [`067b492`](https://github.com/LedgerHQ/ledger-live/commit/067b492cafa20166ce080344b7cb2d6c71f43301)]:
  - @features/platform-contacts@0.12.0
  - @domain/entity-contact@0.12.2
  - @shared/i18n@0.2.0

## 0.11.0-next.0

### Minor Changes

- [#23888](https://github.com/LedgerHQ/ledger-live/pull/23888) [`7ce8446`](https://github.com/LedgerHQ/ledger-live/commit/7ce8446db105f07bf142ab3bba9627875178f065) Thanks [@zel-kass](https://github.com/zel-kass)! - Bump Lumen to lumen-design-core 0.1.34, lumen-ui-react 0.1.67, lumen-ui-rnative 0.1.70, lumen-utils-shared 0.1.18 and lumen-lint-plugin 0.1.1. `cn` now comes from `@ledgerhq/lumen-design-core/cn` (the local helpers re-export it), the `Apex` icon is renamed `NanoGen5`, the removed `BellNotification` and `ShieldCheckNotification` icons are replaced by the plain icon inside a red `DotIndicator`, `FormattedValue` is imported from `@ledgerhq/lumen-ui-react` instead of `@ledgerhq/lumen-utils-shared`, Tailwind font classes that produce no CSS under the Lumen preset are dropped, and the `clsx`, `tailwind-merge`, `@radix-ui/react-switch` and `@radix-ui/react-checkbox` declarations Lumen no longer needs are removed.

- [#23973](https://github.com/LedgerHQ/ledger-live/pull/23973) [`57c72ac`](https://github.com/LedgerHQ/ledger-live/commit/57c72ac92d3c9352b751b21bb96d64f19a2b6cb1) Thanks [@ysitbon](https://github.com/ysitbon)! - Every `@features/platform-contacts` component has one props contract on both platforms. `ContactConfirmationDialog` replaces `ContactConfirmationBottomSheet` on mobile and takes a `tone` (`destructive` or `neutral`), `isConfirming` and `testID`; it reads the sheet's bottom inset itself. `ContactAvatar` takes `testID` instead of `testId` and drops `ariaLabel`, `ContactNameInput` calls `onChangeName`, and `ContactNameDisclaimer` now renders on mobile too. The `.` entry has no `react-native` condition, `./native` is gone, and `./web` exports only `getPastedValue`.

### Patch Changes

- Updated dependencies [[`9a1198f`](https://github.com/LedgerHQ/ledger-live/commit/9a1198fd10a67e2893163985b884c7437b4d036a), [`57c72ac`](https://github.com/LedgerHQ/ledger-live/commit/57c72ac92d3c9352b751b21bb96d64f19a2b6cb1), [`067b492`](https://github.com/LedgerHQ/ledger-live/commit/067b492cafa20166ce080344b7cb2d6c71f43301)]:
  - @features/platform-contacts@0.12.0-next.0
  - @domain/entity-contact@0.12.2-next.0
  - @shared/i18n@0.2.0

## 0.10.0

### Minor Changes

- [#23429](https://github.com/LedgerHQ/ledger-live/pull/23429) [`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Bump Lumen to lumen-design-core 0.1.32, lumen-ui-react 0.1.64, lumen-ui-rnative 0.1.67 and lumen-utils-shared 0.1.16, and migrate `Spot` to its palette API (`icon` required, `appearance="icon"` dropped, `check`/`info`/`error`/`warning`/`loader` mapped to explicit icons, `number` moved to `SpotNumber`). The devtools native jest preset now mocks `react-native-gesture-handler`, which the new lumen `Toaster` imports.

- [#23434](https://github.com/LedgerHQ/ledger-live/pull/23434) [`6abfd98`](https://github.com/LedgerHQ/ledger-live/commit/6abfd98fd3d0359864687b2fc125390f3643a6db) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Resolve Contacts list copy inside the package with @shared/i18n

### Patch Changes

- Updated dependencies [[`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c), [`4fd1ebc`](https://github.com/LedgerHQ/ledger-live/commit/4fd1ebc94718ead589f235824f0440803341feb9)]:
  - @features/platform-contacts@0.11.0
  - @domain/entity-contact@0.12.1

## 0.10.0-next.0

### Minor Changes

- [#23429](https://github.com/LedgerHQ/ledger-live/pull/23429) [`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Bump Lumen to lumen-design-core 0.1.32, lumen-ui-react 0.1.64, lumen-ui-rnative 0.1.67 and lumen-utils-shared 0.1.16, and migrate `Spot` to its palette API (`icon` required, `appearance="icon"` dropped, `check`/`info`/`error`/`warning`/`loader` mapped to explicit icons, `number` moved to `SpotNumber`). The devtools native jest preset now mocks `react-native-gesture-handler`, which the new lumen `Toaster` imports.

- [#23434](https://github.com/LedgerHQ/ledger-live/pull/23434) [`6abfd98`](https://github.com/LedgerHQ/ledger-live/commit/6abfd98fd3d0359864687b2fc125390f3643a6db) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Resolve Contacts list copy inside the package with @shared/i18n

### Patch Changes

- Updated dependencies [[`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c), [`4fd1ebc`](https://github.com/LedgerHQ/ledger-live/commit/4fd1ebc94718ead589f235824f0440803341feb9)]:
  - @features/platform-contacts@0.11.0-next.0
  - @domain/entity-contact@0.12.1-next.0

## 0.9.1

### Patch Changes

- Updated dependencies [[`4101467`](https://github.com/LedgerHQ/ledger-live/commit/4101467e60d17f1facfae9c71e5b684bcf9f48e3), [`8376d49`](https://github.com/LedgerHQ/ledger-live/commit/8376d497d552cd4644e806afdfbd5323bf10a695), [`8783545`](https://github.com/LedgerHQ/ledger-live/commit/87835456704c2322a25339ef27ef92a320d02025)]:
  - @domain/entity-contact@0.12.0
  - @features/platform-contacts@0.10.0

## 0.9.1-next.0

### Patch Changes

- Updated dependencies [[`4101467`](https://github.com/LedgerHQ/ledger-live/commit/4101467e60d17f1facfae9c71e5b684bcf9f48e3), [`8376d49`](https://github.com/LedgerHQ/ledger-live/commit/8376d497d552cd4644e806afdfbd5323bf10a695), [`8783545`](https://github.com/LedgerHQ/ledger-live/commit/87835456704c2322a25339ef27ef92a320d02025)]:
  - @domain/entity-contact@0.12.0-next.0
  - @features/platform-contacts@0.10.0-next.0

## 0.9.0

### Minor Changes

- [#22447](https://github.com/LedgerHQ/ledger-live/pull/22447) [`e8d72da`](https://github.com/LedgerHQ/ledger-live/commit/e8d72dad9cd8aca2bf11b1768d10f2c7553e4cba) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix the last contact hiding behind the Android system navigation bar by padding the mobile contacts list for the bottom safe area

- [#22572](https://github.com/LedgerHQ/ledger-live/pull/22572) [`6e76dda`](https://github.com/LedgerHQ/ledger-live/commit/6e76ddac6370bb60b17971679a857fae7ca83eb9) Thanks [@tonykhaov](https://github.com/tonykhaov)! - `ContactAvatar` takes `isMe` and is the only avatar that formats the Me label, so a Me avatar is announced once as "<name> (Me)". `MeAvatar` takes a display-ready `label` and is no longer exported; `ME_AVATAR_URL` stays exported. `PaySuccessRecipient.isMe` is now required.

- [#22570](https://github.com/LedgerHQ/ledger-live/pull/22570) [`dfd53ad`](https://github.com/LedgerHQ/ledger-live/commit/dfd53adbf0815e2a62f59c1e996bd709bd710ea0) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Show the Me contact as "<name> (Me)", or "My addresses (Me)" when it was never renamed, through one rule: `formatContactDisplayName`, wrapped by `useContactDisplayName`. It replaces `createMeDisplayNameFormatter`, `resolveMeContactDisplayName`, `identityFormatMeDisplayName` and every `formatMeDisplayName` label. Contact list items keep the raw name plus `isMe`, and rows render through the hook. Fixes the Me name in the Send recipient list, Pay contacts, the History scope and the address dialog. The Me address picker says "Select my address". Adds `@features/platform-contacts/testing`.

- [#22512](https://github.com/LedgerHQ/ledger-live/pull/22512) [`c63d0fa`](https://github.com/LedgerHQ/ledger-live/commit/c63d0fa3ad6f181beb5d8ea7b2ef474d82fd1ed7) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Always show Me in the Send recipient contact list, with only its addresses on the account network, ordered like the other contacts (last sent to first). Draw Me with one `MeAvatar` everywhere: `ContactAvatar` renders it for the Me contact, so the `meAvatarSrc`, `avatarSrc` and `isMe` avatar props are gone.

- [#22240](https://github.com/LedgerHQ/ledger-live/pull/22240) [`b2c3742`](https://github.com/LedgerHQ/ledger-live/commit/b2c3742dabf62702a85c8710421bce8ae80dc1fd) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Show an empty-search state in Pay contact selection and dismiss the keyboard before opening a contact.

### Patch Changes

- Updated dependencies [[`d5dfa07`](https://github.com/LedgerHQ/ledger-live/commit/d5dfa072c9a724609119c06622004d76a45414d9), [`6e76dda`](https://github.com/LedgerHQ/ledger-live/commit/6e76ddac6370bb60b17971679a857fae7ca83eb9), [`33b4952`](https://github.com/LedgerHQ/ledger-live/commit/33b4952ef04d4e0528d2735ba299b4a8073e447e), [`e9af9cb`](https://github.com/LedgerHQ/ledger-live/commit/e9af9cb415b3ba4038d13ffc2dca7edb0432c830), [`dfd53ad`](https://github.com/LedgerHQ/ledger-live/commit/dfd53adbf0815e2a62f59c1e996bd709bd710ea0), [`c63d0fa`](https://github.com/LedgerHQ/ledger-live/commit/c63d0fa3ad6f181beb5d8ea7b2ef474d82fd1ed7), [`9e54487`](https://github.com/LedgerHQ/ledger-live/commit/9e5448750d57eb92f95ef828b55d80eedd826323)]:
  - @domain/entity-contact@0.11.0
  - @features/platform-contacts@0.9.0

## 0.9.0-next.2

### Patch Changes

- Updated dependencies []:
  - @features/platform-contacts@0.9.0-next.2

## 0.9.0-next.1

### Patch Changes

- Updated dependencies [[`d5dfa07`](https://github.com/LedgerHQ/ledger-live/commit/d5dfa072c9a724609119c06622004d76a45414d9)]:
  - @domain/entity-contact@0.11.0-next.1
  - @features/platform-contacts@0.9.0-next.1

## 0.9.0-next.0

### Minor Changes

- [#22447](https://github.com/LedgerHQ/ledger-live/pull/22447) [`e8d72da`](https://github.com/LedgerHQ/ledger-live/commit/e8d72dad9cd8aca2bf11b1768d10f2c7553e4cba) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix the last contact hiding behind the Android system navigation bar by padding the mobile contacts list for the bottom safe area

- [#22572](https://github.com/LedgerHQ/ledger-live/pull/22572) [`6e76dda`](https://github.com/LedgerHQ/ledger-live/commit/6e76ddac6370bb60b17971679a857fae7ca83eb9) Thanks [@tonykhaov](https://github.com/tonykhaov)! - `ContactAvatar` takes `isMe` and is the only avatar that formats the Me label, so a Me avatar is announced once as "<name> (Me)". `MeAvatar` takes a display-ready `label` and is no longer exported; `ME_AVATAR_URL` stays exported. `PaySuccessRecipient.isMe` is now required.

- [#22570](https://github.com/LedgerHQ/ledger-live/pull/22570) [`dfd53ad`](https://github.com/LedgerHQ/ledger-live/commit/dfd53adbf0815e2a62f59c1e996bd709bd710ea0) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Show the Me contact as "<name> (Me)", or "My addresses (Me)" when it was never renamed, through one rule: `formatContactDisplayName`, wrapped by `useContactDisplayName`. It replaces `createMeDisplayNameFormatter`, `resolveMeContactDisplayName`, `identityFormatMeDisplayName` and every `formatMeDisplayName` label. Contact list items keep the raw name plus `isMe`, and rows render through the hook. Fixes the Me name in the Send recipient list, Pay contacts, the History scope and the address dialog. The Me address picker says "Select my address". Adds `@features/platform-contacts/testing`.

- [#22512](https://github.com/LedgerHQ/ledger-live/pull/22512) [`c63d0fa`](https://github.com/LedgerHQ/ledger-live/commit/c63d0fa3ad6f181beb5d8ea7b2ef474d82fd1ed7) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Always show Me in the Send recipient contact list, with only its addresses on the account network, ordered like the other contacts (last sent to first). Draw Me with one `MeAvatar` everywhere: `ContactAvatar` renders it for the Me contact, so the `meAvatarSrc`, `avatarSrc` and `isMe` avatar props are gone.

- [#22240](https://github.com/LedgerHQ/ledger-live/pull/22240) [`b2c3742`](https://github.com/LedgerHQ/ledger-live/commit/b2c3742dabf62702a85c8710421bce8ae80dc1fd) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Show an empty-search state in Pay contact selection and dismiss the keyboard before opening a contact.

### Patch Changes

- Updated dependencies [[`6e76dda`](https://github.com/LedgerHQ/ledger-live/commit/6e76ddac6370bb60b17971679a857fae7ca83eb9), [`33b4952`](https://github.com/LedgerHQ/ledger-live/commit/33b4952ef04d4e0528d2735ba299b4a8073e447e), [`e9af9cb`](https://github.com/LedgerHQ/ledger-live/commit/e9af9cb415b3ba4038d13ffc2dca7edb0432c830), [`dfd53ad`](https://github.com/LedgerHQ/ledger-live/commit/dfd53adbf0815e2a62f59c1e996bd709bd710ea0), [`c63d0fa`](https://github.com/LedgerHQ/ledger-live/commit/c63d0fa3ad6f181beb5d8ea7b2ef474d82fd1ed7), [`9e54487`](https://github.com/LedgerHQ/ledger-live/commit/9e5448750d57eb92f95ef828b55d80eedd826323)]:
  - @features/platform-contacts@0.9.0-next.0
  - @domain/entity-contact@0.10.1-next.0

## 0.8.0

### Minor Changes

- [#21923](https://github.com/LedgerHQ/ledger-live/pull/21923) [`5649787`](https://github.com/LedgerHQ/ledger-live/commit/56497875407fe63148b6dfbf266b778748972c01) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add desktop E2E for creating, renaming and deleting a contact without an address (LIVE-35043).

- [#22067](https://github.com/LedgerHQ/ledger-live/pull/22067) [`6996290`](https://github.com/LedgerHQ/ledger-live/commit/6996290580691788820aabd70367655f2283ac20) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Fix contacts detail pane header shaking on address list scroll

### Patch Changes

- Updated dependencies [[`871e485`](https://github.com/LedgerHQ/ledger-live/commit/871e4854284a0b21e31b53ff0ac312010093d914), [`33e92e8`](https://github.com/LedgerHQ/ledger-live/commit/33e92e8f074ff73a6a3e338c8313ba8bc9066ccf), [`0651158`](https://github.com/LedgerHQ/ledger-live/commit/0651158a2f03f819c2e2770ef4179901768c3c6c)]:
  - @features/platform-contacts@0.8.0
  - @domain/entity-contact@0.10.0

## 0.8.0-next.1

### Patch Changes

- Updated dependencies []:
  - @features/platform-contacts@0.8.0-next.1

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->

# @features/flow-pay-contact

## 0.9.0

### Minor Changes

- [#24295](https://github.com/LedgerHQ/ledger-live/pull/24295) [`3571671`](https://github.com/LedgerHQ/ledger-live/commit/3571671667a23517ced1aa9fec421368cb751ef7) Thanks [@ysitbon](https://github.com/ysitbon)! - `@features/flow-pay-contact` exports `PaySuccess` and the address picker from `.`, with `./web` and `./native` platform entries for `Contacts`. `PaySuccess` shares one props contract; suffix imports are removed from the package.

- [#24134](https://github.com/LedgerHQ/ledger-live/pull/24134) [`b582a36`](https://github.com/LedgerHQ/ledger-live/commit/b582a360738037ab8393a554f304d9e942892287) Thanks [@renovate-operator-ledger](https://github.com/apps/renovate-operator-ledger)! - chore(deps): update dependency @ledgerhq/crypto-icons to v2.0.7

  - Updated `@ledgerhq/crypto-icons` to `2.0.7`

### Patch Changes

- Updated dependencies [[`360d6c9`](https://github.com/LedgerHQ/ledger-live/commit/360d6c9c4e4c37284397ee3118224767bc49076b), [`298bf8d`](https://github.com/LedgerHQ/ledger-live/commit/298bf8de83301f558607d4611643ec8e54277a7e), [`cea0076`](https://github.com/LedgerHQ/ledger-live/commit/cea0076fb3fd7c19d0e73b99ac76507278e390a4), [`b582a36`](https://github.com/LedgerHQ/ledger-live/commit/b582a360738037ab8393a554f304d9e942892287), [`934970a`](https://github.com/LedgerHQ/ledger-live/commit/934970adec67ed88f1d546d03b1bb555cbfd128f)]:
  - @domain/entity-contact@0.13.0
  - @features/flow-contacts-detail@0.4.0
  - @features/platform-contacts@0.12.2
  - @features/flow-contacts-add-contact@0.10.1

## 0.9.0-next.0

### Minor Changes

- [#24295](https://github.com/LedgerHQ/ledger-live/pull/24295) [`3571671`](https://github.com/LedgerHQ/ledger-live/commit/3571671667a23517ced1aa9fec421368cb751ef7) Thanks [@ysitbon](https://github.com/ysitbon)! - `@features/flow-pay-contact` exports `PaySuccess` and the address picker from `.`, with `./web` and `./native` platform entries for `Contacts`. `PaySuccess` shares one props contract; suffix imports are removed from the package.

- [#24134](https://github.com/LedgerHQ/ledger-live/pull/24134) [`b582a36`](https://github.com/LedgerHQ/ledger-live/commit/b582a360738037ab8393a554f304d9e942892287) Thanks [@renovate-operator-ledger](https://github.com/apps/renovate-operator-ledger)! - chore(deps): update dependency @ledgerhq/crypto-icons to v2.0.7

  - Updated `@ledgerhq/crypto-icons` to `2.0.7`

### Patch Changes

- Updated dependencies [[`360d6c9`](https://github.com/LedgerHQ/ledger-live/commit/360d6c9c4e4c37284397ee3118224767bc49076b), [`298bf8d`](https://github.com/LedgerHQ/ledger-live/commit/298bf8de83301f558607d4611643ec8e54277a7e), [`cea0076`](https://github.com/LedgerHQ/ledger-live/commit/cea0076fb3fd7c19d0e73b99ac76507278e390a4), [`b582a36`](https://github.com/LedgerHQ/ledger-live/commit/b582a360738037ab8393a554f304d9e942892287), [`934970a`](https://github.com/LedgerHQ/ledger-live/commit/934970adec67ed88f1d546d03b1bb555cbfd128f)]:
  - @domain/entity-contact@0.13.0-next.0
  - @features/flow-contacts-detail@0.4.0-next.0
  - @features/platform-contacts@0.12.2-next.0
  - @features/flow-contacts-add-contact@0.10.1-next.0

## 0.8.0

### Minor Changes

- [#24031](https://github.com/LedgerHQ/ledger-live/pull/24031) [`ce12e26`](https://github.com/LedgerHQ/ledger-live/commit/ce12e264adcefe0248c3f806e628e967ad1ca9ca) Thanks [@ysitbon](https://github.com/ysitbon)! - `ContactsAddContactContent` of `@features/flow-contacts-add-contact` has one props contract on both platforms: `ContactsAddContactContentProps` gains the native-only `autoFocus`, and `ContactsAddContactContentNativeProps` is gone. The mobile content renders `ContactNameDisclaimer`. `ContactsAddContactDialog` moves to the `./web` entry, and `ContactsAddContactFooter` with `ContactsAddContactFooterProps` to the `./native` entry. The `.` entry has no `react-native` condition.

### Patch Changes

- Updated dependencies [[`ce12e26`](https://github.com/LedgerHQ/ledger-live/commit/ce12e264adcefe0248c3f806e628e967ad1ca9ca)]:
  - @features/flow-contacts-add-contact@0.10.0
  - @domain/entity-contact@0.12.3
  - @features/flow-contacts-detail@0.3.1
  - @features/platform-contacts@0.12.1

## 0.8.0-next.0

### Minor Changes

- [#24031](https://github.com/LedgerHQ/ledger-live/pull/24031) [`ce12e26`](https://github.com/LedgerHQ/ledger-live/commit/ce12e264adcefe0248c3f806e628e967ad1ca9ca) Thanks [@ysitbon](https://github.com/ysitbon)! - `ContactsAddContactContent` of `@features/flow-contacts-add-contact` has one props contract on both platforms: `ContactsAddContactContentProps` gains the native-only `autoFocus`, and `ContactsAddContactContentNativeProps` is gone. The mobile content renders `ContactNameDisclaimer`. `ContactsAddContactDialog` moves to the `./web` entry, and `ContactsAddContactFooter` with `ContactsAddContactFooterProps` to the `./native` entry. The `.` entry has no `react-native` condition.

### Patch Changes

- Updated dependencies [[`ce12e26`](https://github.com/LedgerHQ/ledger-live/commit/ce12e264adcefe0248c3f806e628e967ad1ca9ca)]:
  - @features/flow-contacts-add-contact@0.10.0-next.0
  - @domain/entity-contact@0.12.3-next.0
  - @features/flow-contacts-detail@0.3.1-next.0
  - @features/platform-contacts@0.12.1-next.0

## 0.7.1

### Patch Changes

- Updated dependencies [[`9a1198f`](https://github.com/LedgerHQ/ledger-live/commit/9a1198fd10a67e2893163985b884c7437b4d036a), [`7ce8446`](https://github.com/LedgerHQ/ledger-live/commit/7ce8446db105f07bf142ab3bba9627875178f065), [`57c72ac`](https://github.com/LedgerHQ/ledger-live/commit/57c72ac92d3c9352b751b21bb96d64f19a2b6cb1), [`9092dc3`](https://github.com/LedgerHQ/ledger-live/commit/9092dc350ccb833de3bd9b4254408a98cd264645), [`067b492`](https://github.com/LedgerHQ/ledger-live/commit/067b492cafa20166ce080344b7cb2d6c71f43301), [`5eed48e`](https://github.com/LedgerHQ/ledger-live/commit/5eed48ed200b672ba41afb663c6b648628ebaf3e)]:
  - @features/platform-contacts@0.12.0
  - @features/flow-contacts-add-contact@0.9.0
  - @features/flow-contacts-detail@0.3.0
  - @shared/ui-queued-bottom-sheet@0.8.0
  - @domain/entity-contact@0.12.2
  - @shared/i18n@0.2.0

## 0.7.1-next.0

### Patch Changes

- Updated dependencies [[`9a1198f`](https://github.com/LedgerHQ/ledger-live/commit/9a1198fd10a67e2893163985b884c7437b4d036a), [`7ce8446`](https://github.com/LedgerHQ/ledger-live/commit/7ce8446db105f07bf142ab3bba9627875178f065), [`57c72ac`](https://github.com/LedgerHQ/ledger-live/commit/57c72ac92d3c9352b751b21bb96d64f19a2b6cb1), [`9092dc3`](https://github.com/LedgerHQ/ledger-live/commit/9092dc350ccb833de3bd9b4254408a98cd264645), [`067b492`](https://github.com/LedgerHQ/ledger-live/commit/067b492cafa20166ce080344b7cb2d6c71f43301), [`5eed48e`](https://github.com/LedgerHQ/ledger-live/commit/5eed48ed200b672ba41afb663c6b648628ebaf3e)]:
  - @features/platform-contacts@0.12.0-next.0
  - @features/flow-contacts-add-contact@0.9.0-next.0
  - @features/flow-contacts-detail@0.3.0-next.0
  - @shared/ui-queued-bottom-sheet@0.8.0-next.0
  - @domain/entity-contact@0.12.2-next.0
  - @shared/i18n@0.2.0

## 0.7.0

### Minor Changes

- [#23322](https://github.com/LedgerHQ/ledger-live/pull/23322) [`1349df3`](https://github.com/LedgerHQ/ledger-live/commit/1349df3f6e9a27eeecc8495ca99a453341d7bf70) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Extract the Contact Detail journey into `@features/flow-contacts-detail` so Desktop and Mobile can reuse it, while the Contacts aggregate keeps cross-journey orchestration

- [#23429](https://github.com/LedgerHQ/ledger-live/pull/23429) [`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Bump Lumen to lumen-design-core 0.1.32, lumen-ui-react 0.1.64, lumen-ui-rnative 0.1.67 and lumen-utils-shared 0.1.16, and migrate `Spot` to its palette API (`icon` required, `appearance="icon"` dropped, `check`/`info`/`error`/`warning`/`loader` mapped to explicit icons, `number` moved to `SpotNumber`). The devtools native jest preset now mocks `react-native-gesture-handler`, which the new lumen `Toaster` imports.

### Patch Changes

- Updated dependencies [[`1349df3`](https://github.com/LedgerHQ/ledger-live/commit/1349df3f6e9a27eeecc8495ca99a453341d7bf70), [`2ebd029`](https://github.com/LedgerHQ/ledger-live/commit/2ebd029cd006cb89ceb240705247ccf5529c3c50), [`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c), [`fc846e5`](https://github.com/LedgerHQ/ledger-live/commit/fc846e53bbe5023223aa847b6e00b68fb22ace4a), [`2f9c159`](https://github.com/LedgerHQ/ledger-live/commit/2f9c1598145b8a7dadab43b12a5deb4ab9dc91c9), [`03f4e70`](https://github.com/LedgerHQ/ledger-live/commit/03f4e70f38efc9362beae2e8ef12567cced3d3c6), [`4fd1ebc`](https://github.com/LedgerHQ/ledger-live/commit/4fd1ebc94718ead589f235824f0440803341feb9)]:
  - @features/flow-contacts-detail@0.2.0
  - @shared/ui-queued-bottom-sheet@0.7.0
  - @features/platform-contacts@0.11.0
  - @features/flow-contacts-add-contact@0.8.0
  - @domain/entity-contact@0.12.1

## 0.7.0-next.0

### Minor Changes

- [#23322](https://github.com/LedgerHQ/ledger-live/pull/23322) [`1349df3`](https://github.com/LedgerHQ/ledger-live/commit/1349df3f6e9a27eeecc8495ca99a453341d7bf70) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Extract the Contact Detail journey into `@features/flow-contacts-detail` so Desktop and Mobile can reuse it, while the Contacts aggregate keeps cross-journey orchestration

- [#23429](https://github.com/LedgerHQ/ledger-live/pull/23429) [`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Bump Lumen to lumen-design-core 0.1.32, lumen-ui-react 0.1.64, lumen-ui-rnative 0.1.67 and lumen-utils-shared 0.1.16, and migrate `Spot` to its palette API (`icon` required, `appearance="icon"` dropped, `check`/`info`/`error`/`warning`/`loader` mapped to explicit icons, `number` moved to `SpotNumber`). The devtools native jest preset now mocks `react-native-gesture-handler`, which the new lumen `Toaster` imports.

### Patch Changes

- Updated dependencies [[`1349df3`](https://github.com/LedgerHQ/ledger-live/commit/1349df3f6e9a27eeecc8495ca99a453341d7bf70), [`2ebd029`](https://github.com/LedgerHQ/ledger-live/commit/2ebd029cd006cb89ceb240705247ccf5529c3c50), [`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c), [`fc846e5`](https://github.com/LedgerHQ/ledger-live/commit/fc846e53bbe5023223aa847b6e00b68fb22ace4a), [`2f9c159`](https://github.com/LedgerHQ/ledger-live/commit/2f9c1598145b8a7dadab43b12a5deb4ab9dc91c9), [`03f4e70`](https://github.com/LedgerHQ/ledger-live/commit/03f4e70f38efc9362beae2e8ef12567cced3d3c6), [`4fd1ebc`](https://github.com/LedgerHQ/ledger-live/commit/4fd1ebc94718ead589f235824f0440803341feb9)]:
  - @features/flow-contacts-detail@0.2.0-next.0
  - @shared/ui-queued-bottom-sheet@0.7.0-next.0
  - @features/platform-contacts@0.11.0-next.0
  - @features/flow-contacts-add-contact@0.8.0-next.0
  - @domain/entity-contact@0.12.1-next.0

## 0.6.0

### Minor Changes

- [#22866](https://github.com/LedgerHQ/ledger-live/pull/22866) [`52747b3`](https://github.com/LedgerHQ/ledger-live/commit/52747b3d876e34712619bd17206cd4aa23e07636) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Name the default Me contact "Me" in the Pay tab contacts list instead of "My addresses (Me)"

- [#23011](https://github.com/LedgerHQ/ledger-live/pull/23011) [`a99d63a`](https://github.com/LedgerHQ/ledger-live/commit/a99d63a75a8d02a14bdfef0eaaa249c3f92d1ced) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Wrap long Pay contact names inside the desktop tooltip

- [#22754](https://github.com/LedgerHQ/ledger-live/pull/22754) [`4aa7793`](https://github.com/LedgerHQ/ledger-live/commit/4aa77939cec43fd1aac459689c372868dece3496) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Cover paying a contact from the mobile Pay tab, selecting the native tile by contact id

### Patch Changes

- Updated dependencies [[`4101467`](https://github.com/LedgerHQ/ledger-live/commit/4101467e60d17f1facfae9c71e5b684bcf9f48e3), [`20bf9b0`](https://github.com/LedgerHQ/ledger-live/commit/20bf9b0c8694e9a3c873da1e81fd6b310410205c), [`8376d49`](https://github.com/LedgerHQ/ledger-live/commit/8376d497d552cd4644e806afdfbd5323bf10a695), [`48874b3`](https://github.com/LedgerHQ/ledger-live/commit/48874b3b33c83b40f7c2c389f7a84ebe96d58816), [`5f07a43`](https://github.com/LedgerHQ/ledger-live/commit/5f07a4399d54e6ebccb953045324d8ec5b571ad3), [`8783545`](https://github.com/LedgerHQ/ledger-live/commit/87835456704c2322a25339ef27ef92a320d02025), [`dad0153`](https://github.com/LedgerHQ/ledger-live/commit/dad01537ce5e0263964adcfaf762246003c527b4)]:
  - @domain/entity-contact@0.12.0
  - @features/platform-contacts@0.10.0
  - @features/flow-contacts@0.14.0
  - @features/flow-contacts-add-contact@0.7.2
  - @shared/i18n@0.2.0
  - @shared/ui-queued-bottom-sheet@0.6.0

## 0.6.0-next.0

### Minor Changes

- [#22866](https://github.com/LedgerHQ/ledger-live/pull/22866) [`52747b3`](https://github.com/LedgerHQ/ledger-live/commit/52747b3d876e34712619bd17206cd4aa23e07636) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Name the default Me contact "Me" in the Pay tab contacts list instead of "My addresses (Me)"

- [#23011](https://github.com/LedgerHQ/ledger-live/pull/23011) [`a99d63a`](https://github.com/LedgerHQ/ledger-live/commit/a99d63a75a8d02a14bdfef0eaaa249c3f92d1ced) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Wrap long Pay contact names inside the desktop tooltip

- [#22754](https://github.com/LedgerHQ/ledger-live/pull/22754) [`4aa7793`](https://github.com/LedgerHQ/ledger-live/commit/4aa77939cec43fd1aac459689c372868dece3496) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Cover paying a contact from the mobile Pay tab, selecting the native tile by contact id

### Patch Changes

- Updated dependencies [[`4101467`](https://github.com/LedgerHQ/ledger-live/commit/4101467e60d17f1facfae9c71e5b684bcf9f48e3), [`20bf9b0`](https://github.com/LedgerHQ/ledger-live/commit/20bf9b0c8694e9a3c873da1e81fd6b310410205c), [`8376d49`](https://github.com/LedgerHQ/ledger-live/commit/8376d497d552cd4644e806afdfbd5323bf10a695), [`48874b3`](https://github.com/LedgerHQ/ledger-live/commit/48874b3b33c83b40f7c2c389f7a84ebe96d58816), [`5f07a43`](https://github.com/LedgerHQ/ledger-live/commit/5f07a4399d54e6ebccb953045324d8ec5b571ad3), [`8783545`](https://github.com/LedgerHQ/ledger-live/commit/87835456704c2322a25339ef27ef92a320d02025), [`dad0153`](https://github.com/LedgerHQ/ledger-live/commit/dad01537ce5e0263964adcfaf762246003c527b4)]:
  - @domain/entity-contact@0.12.0-next.0
  - @features/platform-contacts@0.10.0-next.0
  - @features/flow-contacts@0.14.0-next.0
  - @features/flow-contacts-add-contact@0.7.2-next.0
  - @shared/i18n@0.2.0
  - @shared/ui-queued-bottom-sheet@0.6.0

## 0.5.0

### Minor Changes

- [#22840](https://github.com/LedgerHQ/ledger-live/pull/22840) [`e4c24f3`](https://github.com/LedgerHQ/ledger-live/commit/e4c24f3ebd7fe5838a6639e70b10b12863088e10) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Name the default Me contact "Me" in the Pay tab contacts list instead of "My addresses (Me)"

- [#22572](https://github.com/LedgerHQ/ledger-live/pull/22572) [`6e76dda`](https://github.com/LedgerHQ/ledger-live/commit/6e76ddac6370bb60b17971679a857fae7ca83eb9) Thanks [@tonykhaov](https://github.com/tonykhaov)! - `ContactAvatar` takes `isMe` and is the only avatar that formats the Me label, so a Me avatar is announced once as "<name> (Me)". `MeAvatar` takes a display-ready `label` and is no longer exported; `ME_AVATAR_URL` stays exported. `PaySuccessRecipient.isMe` is now required.

- [#22570](https://github.com/LedgerHQ/ledger-live/pull/22570) [`dfd53ad`](https://github.com/LedgerHQ/ledger-live/commit/dfd53adbf0815e2a62f59c1e996bd709bd710ea0) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Show the Me contact as "<name> (Me)", or "My addresses (Me)" when it was never renamed, through one rule: `formatContactDisplayName`, wrapped by `useContactDisplayName`. It replaces `createMeDisplayNameFormatter`, `resolveMeContactDisplayName`, `identityFormatMeDisplayName` and every `formatMeDisplayName` label. Contact list items keep the raw name plus `isMe`, and rows render through the hook. Fixes the Me name in the Send recipient list, Pay contacts, the History scope and the address dialog. The Me address picker says "Select my address". Adds `@features/platform-contacts/testing`.

- [#22512](https://github.com/LedgerHQ/ledger-live/pull/22512) [`c63d0fa`](https://github.com/LedgerHQ/ledger-live/commit/c63d0fa3ad6f181beb5d8ea7b2ef474d82fd1ed7) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Always show Me in the Send recipient contact list, with only its addresses on the account network, ordered like the other contacts (last sent to first). Draw Me with one `MeAvatar` everywhere: `ContactAvatar` renders it for the Me contact, so the `meAvatarSrc`, `avatarSrc` and `isMe` avatar props are gone.

- [#22241](https://github.com/LedgerHQ/ledger-live/pull/22241) [`3b95cbb`](https://github.com/LedgerHQ/ledger-live/commit/3b95cbb5968a4484966233313ca8e2781b720ae8) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Include the Me contact in Pay contact strips and contact selection, keeping the existing order.

- [#22402](https://github.com/LedgerHQ/ledger-live/pull/22402) [`dccea32`](https://github.com/LedgerHQ/ledger-live/commit/dccea322ed808abfa4e6829364fe945cd0a58383) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Polish the Pay tab: keep the last row of every Pay bottom sheet clear of the Android navigation bar and the iOS home indicator, size the card action buttons to `md`, make the desktop contacts table responsive with a wider name column, wrap the address-picker title, add 32px of scroll padding, widen the history tabs, fix the disclaimer copy and use the shield icon on verify address

### Patch Changes

- Updated dependencies [[`d5dfa07`](https://github.com/LedgerHQ/ledger-live/commit/d5dfa072c9a724609119c06622004d76a45414d9), [`26e51d9`](https://github.com/LedgerHQ/ledger-live/commit/26e51d98fde1c080e09f566e0dbeb4f2c2e9f382), [`c32cde3`](https://github.com/LedgerHQ/ledger-live/commit/c32cde31461523c72df4f67cd18288c6f65c9951), [`6e76dda`](https://github.com/LedgerHQ/ledger-live/commit/6e76ddac6370bb60b17971679a857fae7ca83eb9), [`486a1a4`](https://github.com/LedgerHQ/ledger-live/commit/486a1a45027e8104ae824d77bd34b298788c9b04), [`33b4952`](https://github.com/LedgerHQ/ledger-live/commit/33b4952ef04d4e0528d2735ba299b4a8073e447e), [`e9af9cb`](https://github.com/LedgerHQ/ledger-live/commit/e9af9cb415b3ba4038d13ffc2dca7edb0432c830), [`dfd53ad`](https://github.com/LedgerHQ/ledger-live/commit/dfd53adbf0815e2a62f59c1e996bd709bd710ea0), [`c63d0fa`](https://github.com/LedgerHQ/ledger-live/commit/c63d0fa3ad6f181beb5d8ea7b2ef474d82fd1ed7), [`9e54487`](https://github.com/LedgerHQ/ledger-live/commit/9e5448750d57eb92f95ef828b55d80eedd826323), [`dccea32`](https://github.com/LedgerHQ/ledger-live/commit/dccea322ed808abfa4e6829364fe945cd0a58383), [`909c761`](https://github.com/LedgerHQ/ledger-live/commit/909c761357291f48ac0266d91d6ed563aa4ad833), [`c020110`](https://github.com/LedgerHQ/ledger-live/commit/c02011033bf5ca5bf38f05c487adb3a27c209a7d)]:
  - @domain/entity-contact@0.11.0
  - @features/flow-contacts@0.13.0
  - @shared/ui-queued-bottom-sheet@0.6.0
  - @features/platform-contacts@0.9.0
  - @features/flow-contacts-add-contact@0.7.1

## 0.5.0-next.4

### Patch Changes

- Updated dependencies []:
  - @features/platform-contacts@0.9.0-next.2
  - @features/flow-contacts@0.13.0-next.3
  - @features/flow-contacts-add-contact@0.7.1-next.2

## 0.5.0-next.3

### Minor Changes

- [#22840](https://github.com/LedgerHQ/ledger-live/pull/22840) [`e4c24f3`](https://github.com/LedgerHQ/ledger-live/commit/e4c24f3ebd7fe5838a6639e70b10b12863088e10) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Name the default Me contact "Me" in the Pay tab contacts list instead of "My addresses (Me)"

## 0.5.0-next.2

### Patch Changes

- Updated dependencies []:
  - @features/flow-contacts@0.13.0-next.2

## 0.5.0-next.1

### Patch Changes

- Updated dependencies [[`d5dfa07`](https://github.com/LedgerHQ/ledger-live/commit/d5dfa072c9a724609119c06622004d76a45414d9)]:
  - @domain/entity-contact@0.11.0-next.1
  - @features/flow-contacts@0.13.0-next.1
  - @features/flow-contacts-add-contact@0.7.1-next.1
  - @features/platform-contacts@0.9.0-next.1

## 0.5.0-next.0

### Minor Changes

- [#22572](https://github.com/LedgerHQ/ledger-live/pull/22572) [`6e76dda`](https://github.com/LedgerHQ/ledger-live/commit/6e76ddac6370bb60b17971679a857fae7ca83eb9) Thanks [@tonykhaov](https://github.com/tonykhaov)! - `ContactAvatar` takes `isMe` and is the only avatar that formats the Me label, so a Me avatar is announced once as "<name> (Me)". `MeAvatar` takes a display-ready `label` and is no longer exported; `ME_AVATAR_URL` stays exported. `PaySuccessRecipient.isMe` is now required.

- [#22570](https://github.com/LedgerHQ/ledger-live/pull/22570) [`dfd53ad`](https://github.com/LedgerHQ/ledger-live/commit/dfd53adbf0815e2a62f59c1e996bd709bd710ea0) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Show the Me contact as "<name> (Me)", or "My addresses (Me)" when it was never renamed, through one rule: `formatContactDisplayName`, wrapped by `useContactDisplayName`. It replaces `createMeDisplayNameFormatter`, `resolveMeContactDisplayName`, `identityFormatMeDisplayName` and every `formatMeDisplayName` label. Contact list items keep the raw name plus `isMe`, and rows render through the hook. Fixes the Me name in the Send recipient list, Pay contacts, the History scope and the address dialog. The Me address picker says "Select my address". Adds `@features/platform-contacts/testing`.

- [#22512](https://github.com/LedgerHQ/ledger-live/pull/22512) [`c63d0fa`](https://github.com/LedgerHQ/ledger-live/commit/c63d0fa3ad6f181beb5d8ea7b2ef474d82fd1ed7) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Always show Me in the Send recipient contact list, with only its addresses on the account network, ordered like the other contacts (last sent to first). Draw Me with one `MeAvatar` everywhere: `ContactAvatar` renders it for the Me contact, so the `meAvatarSrc`, `avatarSrc` and `isMe` avatar props are gone.

- [#22241](https://github.com/LedgerHQ/ledger-live/pull/22241) [`3b95cbb`](https://github.com/LedgerHQ/ledger-live/commit/3b95cbb5968a4484966233313ca8e2781b720ae8) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Include the Me contact in Pay contact strips and contact selection, keeping the existing order.

- [#22402](https://github.com/LedgerHQ/ledger-live/pull/22402) [`dccea32`](https://github.com/LedgerHQ/ledger-live/commit/dccea322ed808abfa4e6829364fe945cd0a58383) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Polish the Pay tab: keep the last row of every Pay bottom sheet clear of the Android navigation bar and the iOS home indicator, size the card action buttons to `md`, make the desktop contacts table responsive with a wider name column, wrap the address-picker title, add 32px of scroll padding, widen the history tabs, fix the disclaimer copy and use the shield icon on verify address

### Patch Changes

- Updated dependencies [[`26e51d9`](https://github.com/LedgerHQ/ledger-live/commit/26e51d98fde1c080e09f566e0dbeb4f2c2e9f382), [`c32cde3`](https://github.com/LedgerHQ/ledger-live/commit/c32cde31461523c72df4f67cd18288c6f65c9951), [`6e76dda`](https://github.com/LedgerHQ/ledger-live/commit/6e76ddac6370bb60b17971679a857fae7ca83eb9), [`486a1a4`](https://github.com/LedgerHQ/ledger-live/commit/486a1a45027e8104ae824d77bd34b298788c9b04), [`33b4952`](https://github.com/LedgerHQ/ledger-live/commit/33b4952ef04d4e0528d2735ba299b4a8073e447e), [`e9af9cb`](https://github.com/LedgerHQ/ledger-live/commit/e9af9cb415b3ba4038d13ffc2dca7edb0432c830), [`dfd53ad`](https://github.com/LedgerHQ/ledger-live/commit/dfd53adbf0815e2a62f59c1e996bd709bd710ea0), [`c63d0fa`](https://github.com/LedgerHQ/ledger-live/commit/c63d0fa3ad6f181beb5d8ea7b2ef474d82fd1ed7), [`9e54487`](https://github.com/LedgerHQ/ledger-live/commit/9e5448750d57eb92f95ef828b55d80eedd826323), [`dccea32`](https://github.com/LedgerHQ/ledger-live/commit/dccea322ed808abfa4e6829364fe945cd0a58383), [`909c761`](https://github.com/LedgerHQ/ledger-live/commit/909c761357291f48ac0266d91d6ed563aa4ad833), [`c020110`](https://github.com/LedgerHQ/ledger-live/commit/c02011033bf5ca5bf38f05c487adb3a27c209a7d)]:
  - @features/flow-contacts@0.13.0-next.0
  - @shared/ui-queued-bottom-sheet@0.6.0-next.0
  - @features/platform-contacts@0.9.0-next.0
  - @features/flow-contacts-add-contact@0.7.1-next.0
  - @domain/entity-contact@0.10.1-next.0

## 0.4.1

### Patch Changes

- Updated dependencies [[`871e485`](https://github.com/LedgerHQ/ledger-live/commit/871e4854284a0b21e31b53ff0ac312010093d914), [`6996290`](https://github.com/LedgerHQ/ledger-live/commit/6996290580691788820aabd70367655f2283ac20), [`c52af21`](https://github.com/LedgerHQ/ledger-live/commit/c52af21b622efa62774657e190abb9762cffac1c), [`33e92e8`](https://github.com/LedgerHQ/ledger-live/commit/33e92e8f074ff73a6a3e338c8313ba8bc9066ccf), [`0651158`](https://github.com/LedgerHQ/ledger-live/commit/0651158a2f03f819c2e2770ef4179901768c3c6c), [`48af604`](https://github.com/LedgerHQ/ledger-live/commit/48af6040c2835f067a2dfe38fb8fadde72e0787b), [`bc43337`](https://github.com/LedgerHQ/ledger-live/commit/bc433372ebed1990d81a87b109eeb4d928271315)]:
  - @shared/ui-queued-bottom-sheet@0.5.0
  - @features/platform-contacts@0.8.0
  - @features/flow-contacts-add-contact@0.7.0
  - @features/flow-contacts@0.12.0
  - @domain/entity-contact@0.10.0

## 0.4.1-next.1

### Patch Changes

- Updated dependencies [[`48af604`](https://github.com/LedgerHQ/ledger-live/commit/48af6040c2835f067a2dfe38fb8fadde72e0787b)]:
  - @shared/ui-queued-bottom-sheet@0.5.0-next.1
  - @features/platform-contacts@0.8.0-next.1
  - @features/flow-contacts@0.12.0-next.1
  - @features/flow-contacts-add-contact@0.7.0-next.1

## 0.4.1-next.0

### Patch Changes

- Updated dependencies [[`871e485`](https://github.com/LedgerHQ/ledger-live/commit/871e4854284a0b21e31b53ff0ac312010093d914), [`6996290`](https://github.com/LedgerHQ/ledger-live/commit/6996290580691788820aabd70367655f2283ac20), [`c52af21`](https://github.com/LedgerHQ/ledger-live/commit/c52af21b622efa62774657e190abb9762cffac1c), [`33e92e8`](https://github.com/LedgerHQ/ledger-live/commit/33e92e8f074ff73a6a3e338c8313ba8bc9066ccf), [`0651158`](https://github.com/LedgerHQ/ledger-live/commit/0651158a2f03f819c2e2770ef4179901768c3c6c), [`bc43337`](https://github.com/LedgerHQ/ledger-live/commit/bc433372ebed1990d81a87b109eeb4d928271315)]:
  - @shared/ui-queued-bottom-sheet@0.5.0-next.0
  - @features/platform-contacts@0.8.0-next.0
  - @features/flow-contacts-add-contact@0.7.0-next.0
  - @features/flow-contacts@0.12.0-next.0
  - @domain/entity-contact@0.10.0-next.0

## 0.4.0

### Minor Changes

- [#21668](https://github.com/LedgerHQ/ledger-live/pull/21668) [`2edc7c8`](https://github.com/LedgerHQ/ledger-live/commit/2edc7c8d47b1ac8b49194155be8f8b3722574d39) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Keep the Pay Request receive QR scannable in light on mobile (white card, black modules) and use base color for Pay tab contact names (LIVE-37096).

### Patch Changes

- Updated dependencies [[`16a454f`](https://github.com/LedgerHQ/ledger-live/commit/16a454fa79be46df6aec3c50ad40407f36dfdea9), [`de19b3e`](https://github.com/LedgerHQ/ledger-live/commit/de19b3e4e56a0c28fcc1a3ca929059e84fc7bebf), [`96a1ca9`](https://github.com/LedgerHQ/ledger-live/commit/96a1ca9fef1b0acc8113708c148890054dea143d), [`632dd93`](https://github.com/LedgerHQ/ledger-live/commit/632dd9368616a97581d037f1503b2b16f567c02a), [`036b71d`](https://github.com/LedgerHQ/ledger-live/commit/036b71d678a57c3b1c3156374122fe13bea54f79), [`5b60a96`](https://github.com/LedgerHQ/ledger-live/commit/5b60a968d3292b3897380f2c74c472a51b81e35d), [`b49d5b5`](https://github.com/LedgerHQ/ledger-live/commit/b49d5b573e84bd63ac460ae398657f1035613141)]:
  - @features/platform-contacts@0.7.0
  - @shared/ui-queued-bottom-sheet@0.4.0
  - @features/flow-contacts@0.11.0
  - @features/flow-contacts-add-contact@0.6.0
  - @domain/entity-contact@0.9.0
  - @shared/i18n@0.2.0

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->

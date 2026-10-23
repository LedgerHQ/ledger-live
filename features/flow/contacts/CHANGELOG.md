# @features/flow-contacts

## 0.15.0

### Minor Changes

- [#23322](https://github.com/LedgerHQ/ledger-live/pull/23322) [`1349df3`](https://github.com/LedgerHQ/ledger-live/commit/1349df3f6e9a27eeecc8495ca99a453341d7bf70) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Extract the Contact Detail journey into `@features/flow-contacts-detail` so Desktop and Mobile can reuse it, while the Contacts aggregate keeps cross-journey orchestration

- [#23429](https://github.com/LedgerHQ/ledger-live/pull/23429) [`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Bump Lumen to lumen-design-core 0.1.32, lumen-ui-react 0.1.64, lumen-ui-rnative 0.1.67 and lumen-utils-shared 0.1.16, and migrate `Spot` to its palette API (`icon` required, `appearance="icon"` dropped, `check`/`info`/`error`/`warning`/`loader` mapped to explicit icons, `number` moved to `SpotNumber`). The devtools native jest preset now mocks `react-native-gesture-handler`, which the new lumen `Toaster` imports.

### Patch Changes

- Updated dependencies [[`1349df3`](https://github.com/LedgerHQ/ledger-live/commit/1349df3f6e9a27eeecc8495ca99a453341d7bf70), [`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c), [`fc846e5`](https://github.com/LedgerHQ/ledger-live/commit/fc846e53bbe5023223aa847b6e00b68fb22ace4a), [`2f9c159`](https://github.com/LedgerHQ/ledger-live/commit/2f9c1598145b8a7dadab43b12a5deb4ab9dc91c9), [`a654488`](https://github.com/LedgerHQ/ledger-live/commit/a654488d68942852ffa880a60ae674ff44a18918), [`6abfd98`](https://github.com/LedgerHQ/ledger-live/commit/6abfd98fd3d0359864687b2fc125390f3643a6db), [`47e5b74`](https://github.com/LedgerHQ/ledger-live/commit/47e5b740cf64f177fd1cbbfa7f5bf74de3d45661), [`03f4e70`](https://github.com/LedgerHQ/ledger-live/commit/03f4e70f38efc9362beae2e8ef12567cced3d3c6), [`4fd1ebc`](https://github.com/LedgerHQ/ledger-live/commit/4fd1ebc94718ead589f235824f0440803341feb9)]:
  - @features/flow-contacts-detail@0.2.0
  - @features/flow-contacts-introduction@1.5.0
  - @features/flow-contacts-list@0.10.0
  - @features/platform-contacts@0.11.0
  - @features/flow-contacts-add-contact@0.8.0
  - @features/flow-contacts-delete-contact@0.3.0
  - @domain/entity-contact@0.12.1

## 0.15.0-next.0

### Minor Changes

- [#23322](https://github.com/LedgerHQ/ledger-live/pull/23322) [`1349df3`](https://github.com/LedgerHQ/ledger-live/commit/1349df3f6e9a27eeecc8495ca99a453341d7bf70) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Extract the Contact Detail journey into `@features/flow-contacts-detail` so Desktop and Mobile can reuse it, while the Contacts aggregate keeps cross-journey orchestration

- [#23429](https://github.com/LedgerHQ/ledger-live/pull/23429) [`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Bump Lumen to lumen-design-core 0.1.32, lumen-ui-react 0.1.64, lumen-ui-rnative 0.1.67 and lumen-utils-shared 0.1.16, and migrate `Spot` to its palette API (`icon` required, `appearance="icon"` dropped, `check`/`info`/`error`/`warning`/`loader` mapped to explicit icons, `number` moved to `SpotNumber`). The devtools native jest preset now mocks `react-native-gesture-handler`, which the new lumen `Toaster` imports.

### Patch Changes

- Updated dependencies [[`1349df3`](https://github.com/LedgerHQ/ledger-live/commit/1349df3f6e9a27eeecc8495ca99a453341d7bf70), [`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c), [`fc846e5`](https://github.com/LedgerHQ/ledger-live/commit/fc846e53bbe5023223aa847b6e00b68fb22ace4a), [`2f9c159`](https://github.com/LedgerHQ/ledger-live/commit/2f9c1598145b8a7dadab43b12a5deb4ab9dc91c9), [`a654488`](https://github.com/LedgerHQ/ledger-live/commit/a654488d68942852ffa880a60ae674ff44a18918), [`6abfd98`](https://github.com/LedgerHQ/ledger-live/commit/6abfd98fd3d0359864687b2fc125390f3643a6db), [`47e5b74`](https://github.com/LedgerHQ/ledger-live/commit/47e5b740cf64f177fd1cbbfa7f5bf74de3d45661), [`03f4e70`](https://github.com/LedgerHQ/ledger-live/commit/03f4e70f38efc9362beae2e8ef12567cced3d3c6), [`4fd1ebc`](https://github.com/LedgerHQ/ledger-live/commit/4fd1ebc94718ead589f235824f0440803341feb9)]:
  - @features/flow-contacts-detail@0.2.0-next.0
  - @features/flow-contacts-introduction@1.5.0-next.0
  - @features/flow-contacts-list@0.10.0-next.0
  - @features/platform-contacts@0.11.0-next.0
  - @features/flow-contacts-add-contact@0.8.0-next.0
  - @features/flow-contacts-delete-contact@0.3.0-next.0
  - @domain/entity-contact@0.12.1-next.0

## 0.14.0

### Minor Changes

- [#23035](https://github.com/LedgerHQ/ledger-live/pull/23035) [`20bf9b0`](https://github.com/LedgerHQ/ledger-live/commit/20bf9b0c8694e9a3c873da1e81fd6b310410205c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Route every copy/paste through the new @shared/clipboard package (expo-clipboard replaces @react-native-clipboard/clipboard on mobile) and enforce it with lint rules; copy feedback now only shows once the copy succeeded

- [#22418](https://github.com/LedgerHQ/ledger-live/pull/22418) [`48874b3`](https://github.com/LedgerHQ/ledger-live/commit/48874b3b33c83b40f7c2c389f7a84ebe96d58816) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add desktop E2E coverage for creating a contact, registering Ethereum addresses on the device and deleting both, and let device intents discover Speculos.

- [#22930](https://github.com/LedgerHQ/ledger-live/pull/22930) [`5f07a43`](https://github.com/LedgerHQ/ledger-live/commit/5f07a4399d54e6ebccb953045324d8ec5b571ad3) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Keep the Ledger Wallet addresses entry at full height in the desktop contact detail on small windows, and let the empty detail scroll with the custom scrollbar (LIVE-38297).

- [#22943](https://github.com/LedgerHQ/ledger-live/pull/22943) [`dad0153`](https://github.com/LedgerHQ/ledger-live/commit/dad01537ce5e0263964adcfaf762246003c527b4) Thanks [@LucasWerey](https://github.com/LucasWerey)! - fix(my-wallet): show Help and Referral as tiles and Wallet backups as a list item (LIVE-38059)

### Patch Changes

- Updated dependencies [[`4101467`](https://github.com/LedgerHQ/ledger-live/commit/4101467e60d17f1facfae9c71e5b684bcf9f48e3), [`20bf9b0`](https://github.com/LedgerHQ/ledger-live/commit/20bf9b0c8694e9a3c873da1e81fd6b310410205c), [`8376d49`](https://github.com/LedgerHQ/ledger-live/commit/8376d497d552cd4644e806afdfbd5323bf10a695), [`75e55ba`](https://github.com/LedgerHQ/ledger-live/commit/75e55ba31bb763cfae2e0d850fb76930854abb39), [`87de6a7`](https://github.com/LedgerHQ/ledger-live/commit/87de6a72f75df73aab99da6c420de00004bf7692), [`7a2505b`](https://github.com/LedgerHQ/ledger-live/commit/7a2505bd21cc2401e1e887cb5b9713281cb11519), [`90e805d`](https://github.com/LedgerHQ/ledger-live/commit/90e805d9c1b0ef536d1e53489c73b88056731993), [`8783545`](https://github.com/LedgerHQ/ledger-live/commit/87835456704c2322a25339ef27ef92a320d02025), [`d31fbca`](https://github.com/LedgerHQ/ledger-live/commit/d31fbca35991fc58c8e61156761c5004393fe1cc), [`6f2ecf8`](https://github.com/LedgerHQ/ledger-live/commit/6f2ecf89dd1d978038f573738d6e85fe1805b5d9)]:
  - @domain/entity-contact@0.12.0
  - @features/platform-contacts@0.10.0
  - @shared/clipboard@0.1.0
  - @features/flow-contacts-introduction@1.4.0
  - @domain/entity-currency-crypto@0.15.0
  - @shared/ui-qr-code@0.5.0
  - @features/flow-contacts-add-contact@0.7.2
  - @features/flow-contacts-delete-contact@0.2.5
  - @features/flow-contacts-edit-address@0.4.2
  - @features/flow-contacts-edit-contact@0.6.2
  - @features/flow-contacts-list@0.9.1

## 0.14.0-next.0

### Minor Changes

- [#23035](https://github.com/LedgerHQ/ledger-live/pull/23035) [`20bf9b0`](https://github.com/LedgerHQ/ledger-live/commit/20bf9b0c8694e9a3c873da1e81fd6b310410205c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Route every copy/paste through the new @shared/clipboard package (expo-clipboard replaces @react-native-clipboard/clipboard on mobile) and enforce it with lint rules; copy feedback now only shows once the copy succeeded

- [#22418](https://github.com/LedgerHQ/ledger-live/pull/22418) [`48874b3`](https://github.com/LedgerHQ/ledger-live/commit/48874b3b33c83b40f7c2c389f7a84ebe96d58816) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add desktop E2E coverage for creating a contact, registering Ethereum addresses on the device and deleting both, and let device intents discover Speculos.

- [#22930](https://github.com/LedgerHQ/ledger-live/pull/22930) [`5f07a43`](https://github.com/LedgerHQ/ledger-live/commit/5f07a4399d54e6ebccb953045324d8ec5b571ad3) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Keep the Ledger Wallet addresses entry at full height in the desktop contact detail on small windows, and let the empty detail scroll with the custom scrollbar (LIVE-38297).

- [#22943](https://github.com/LedgerHQ/ledger-live/pull/22943) [`dad0153`](https://github.com/LedgerHQ/ledger-live/commit/dad01537ce5e0263964adcfaf762246003c527b4) Thanks [@LucasWerey](https://github.com/LucasWerey)! - fix(my-wallet): show Help and Referral as tiles and Wallet backups as a list item (LIVE-38059)

### Patch Changes

- Updated dependencies [[`4101467`](https://github.com/LedgerHQ/ledger-live/commit/4101467e60d17f1facfae9c71e5b684bcf9f48e3), [`20bf9b0`](https://github.com/LedgerHQ/ledger-live/commit/20bf9b0c8694e9a3c873da1e81fd6b310410205c), [`8376d49`](https://github.com/LedgerHQ/ledger-live/commit/8376d497d552cd4644e806afdfbd5323bf10a695), [`75e55ba`](https://github.com/LedgerHQ/ledger-live/commit/75e55ba31bb763cfae2e0d850fb76930854abb39), [`87de6a7`](https://github.com/LedgerHQ/ledger-live/commit/87de6a72f75df73aab99da6c420de00004bf7692), [`7a2505b`](https://github.com/LedgerHQ/ledger-live/commit/7a2505bd21cc2401e1e887cb5b9713281cb11519), [`90e805d`](https://github.com/LedgerHQ/ledger-live/commit/90e805d9c1b0ef536d1e53489c73b88056731993), [`8783545`](https://github.com/LedgerHQ/ledger-live/commit/87835456704c2322a25339ef27ef92a320d02025), [`d31fbca`](https://github.com/LedgerHQ/ledger-live/commit/d31fbca35991fc58c8e61156761c5004393fe1cc), [`6f2ecf8`](https://github.com/LedgerHQ/ledger-live/commit/6f2ecf89dd1d978038f573738d6e85fe1805b5d9)]:
  - @domain/entity-contact@0.12.0-next.0
  - @features/platform-contacts@0.10.0-next.0
  - @shared/clipboard@0.1.0-next.0
  - @features/flow-contacts-introduction@1.4.0-next.0
  - @domain/entity-currency-crypto@0.15.0-next.0
  - @shared/ui-qr-code@0.5.0-next.0
  - @features/flow-contacts-add-contact@0.7.2-next.0
  - @features/flow-contacts-delete-contact@0.2.5-next.0
  - @features/flow-contacts-edit-address@0.4.2-next.0
  - @features/flow-contacts-edit-contact@0.6.2-next.0
  - @features/flow-contacts-list@0.9.1-next.0

## 0.13.0

### Minor Changes

- [#21976](https://github.com/LedgerHQ/ledger-live/pull/21976) [`26e51d9`](https://github.com/LedgerHQ/ledger-live/commit/26e51d98fde1c080e09f566e0dbeb4f2c2e9f382) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add mobile E2E coverage for creating a contact, registering EVM addresses on the device and deleting both, and let device intents run against Speculos by registering it as a discoverable transport. Speculos specs can now pin an OS version so the run uses the Ethereum build the contacts intents require, which the app catalog does not serve yet.

- [#22572](https://github.com/LedgerHQ/ledger-live/pull/22572) [`6e76dda`](https://github.com/LedgerHQ/ledger-live/commit/6e76ddac6370bb60b17971679a857fae7ca83eb9) Thanks [@tonykhaov](https://github.com/tonykhaov)! - `ContactAvatar` takes `isMe` and is the only avatar that formats the Me label, so a Me avatar is announced once as "<name> (Me)". `MeAvatar` takes a display-ready `label` and is no longer exported; `ME_AVATAR_URL` stays exported. `PaySuccessRecipient.isMe` is now required.

- [#22656](https://github.com/LedgerHQ/ledger-live/pull/22656) [`486a1a4`](https://github.com/LedgerHQ/ledger-live/commit/486a1a45027e8104ae824d77bd34b298788c9b04) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Only mention ENS in the contact address input placeholder for networks that support domain resolution (LIVE-38284).

- [#22570](https://github.com/LedgerHQ/ledger-live/pull/22570) [`dfd53ad`](https://github.com/LedgerHQ/ledger-live/commit/dfd53adbf0815e2a62f59c1e996bd709bd710ea0) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Show the Me contact as "<name> (Me)", or "My addresses (Me)" when it was never renamed, through one rule: `formatContactDisplayName`, wrapped by `useContactDisplayName`. It replaces `createMeDisplayNameFormatter`, `resolveMeContactDisplayName`, `identityFormatMeDisplayName` and every `formatMeDisplayName` label. Contact list items keep the raw name plus `isMe`, and rows render through the hook. Fixes the Me name in the Send recipient list, Pay contacts, the History scope and the address dialog. The Me address picker says "Select my address". Adds `@features/platform-contacts/testing`.

- [#22512](https://github.com/LedgerHQ/ledger-live/pull/22512) [`c63d0fa`](https://github.com/LedgerHQ/ledger-live/commit/c63d0fa3ad6f181beb5d8ea7b2ef474d82fd1ed7) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Always show Me in the Send recipient contact list, with only its addresses on the account network, ordered like the other contacts (last sent to first). Draw Me with one `MeAvatar` everywhere: `ContactAvatar` renders it for the Me contact, so the `meAvatarSrc`, `avatarSrc` and `isMe` avatar props are gone.

- [#22573](https://github.com/LedgerHQ/ledger-live/pull/22573) [`9e54487`](https://github.com/LedgerHQ/ledger-live/commit/9e5448750d57eb92f95ef828b55d80eedd826323) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add `useOtherContactsAddresses(excludeContactId?)` so the duplicate-address list is built in one place, with each owner's display name: "This address is already used for My addresses (Me)." It replaces five copies in the Contacts and Send view models.

### Patch Changes

- Updated dependencies [[`e8d72da`](https://github.com/LedgerHQ/ledger-live/commit/e8d72dad9cd8aca2bf11b1768d10f2c7553e4cba), [`d5dfa07`](https://github.com/LedgerHQ/ledger-live/commit/d5dfa072c9a724609119c06622004d76a45414d9), [`4fc2063`](https://github.com/LedgerHQ/ledger-live/commit/4fc2063b0e49a445ebb660f750214e69d5c4355a), [`6e76dda`](https://github.com/LedgerHQ/ledger-live/commit/6e76ddac6370bb60b17971679a857fae7ca83eb9), [`f1d8aac`](https://github.com/LedgerHQ/ledger-live/commit/f1d8aac1c7c0bc0be9beb1508c1a9ef3cf7affae), [`33b4952`](https://github.com/LedgerHQ/ledger-live/commit/33b4952ef04d4e0528d2735ba299b4a8073e447e), [`e9af9cb`](https://github.com/LedgerHQ/ledger-live/commit/e9af9cb415b3ba4038d13ffc2dca7edb0432c830), [`dfd53ad`](https://github.com/LedgerHQ/ledger-live/commit/dfd53adbf0815e2a62f59c1e996bd709bd710ea0), [`c63d0fa`](https://github.com/LedgerHQ/ledger-live/commit/c63d0fa3ad6f181beb5d8ea7b2ef474d82fd1ed7), [`9e54487`](https://github.com/LedgerHQ/ledger-live/commit/9e5448750d57eb92f95ef828b55d80eedd826323), [`b2c3742`](https://github.com/LedgerHQ/ledger-live/commit/b2c3742dabf62702a85c8710421bce8ae80dc1fd), [`a896fca`](https://github.com/LedgerHQ/ledger-live/commit/a896fca1974a46f10e915d1212e0947e2d808ad5)]:
  - @features/flow-contacts-list@0.9.0
  - @domain/entity-contact@0.11.0
  - @features/flow-contacts-introduction@1.3.0
  - @features/platform-contacts@0.9.0
  - @domain/entity-currency-crypto@0.14.0
  - @features/flow-contacts-add-contact@0.7.1
  - @features/flow-contacts-delete-contact@0.2.4
  - @features/flow-contacts-edit-address@0.4.1
  - @features/flow-contacts-edit-contact@0.6.1

## 0.13.0-next.3

### Patch Changes

- Updated dependencies []:
  - @features/platform-contacts@0.9.0-next.2
  - @features/flow-contacts-add-contact@0.7.1-next.2
  - @features/flow-contacts-delete-contact@0.2.4-next.2
  - @features/flow-contacts-edit-address@0.4.1-next.2
  - @features/flow-contacts-edit-contact@0.6.1-next.2
  - @features/flow-contacts-list@0.9.0-next.2

## 0.13.0-next.2

### Patch Changes

- Updated dependencies [[`4fc2063`](https://github.com/LedgerHQ/ledger-live/commit/4fc2063b0e49a445ebb660f750214e69d5c4355a)]:
  - @features/flow-contacts-introduction@1.3.0-next.0

## 0.13.0-next.1

### Patch Changes

- Updated dependencies [[`d5dfa07`](https://github.com/LedgerHQ/ledger-live/commit/d5dfa072c9a724609119c06622004d76a45414d9)]:
  - @domain/entity-contact@0.11.0-next.1
  - @features/flow-contacts-add-contact@0.7.1-next.1
  - @features/flow-contacts-delete-contact@0.2.4-next.1
  - @features/flow-contacts-edit-address@0.4.1-next.1
  - @features/flow-contacts-edit-contact@0.6.1-next.1
  - @features/flow-contacts-list@0.9.0-next.1
  - @features/platform-contacts@0.9.0-next.1

## 0.13.0-next.0

### Minor Changes

- [#21976](https://github.com/LedgerHQ/ledger-live/pull/21976) [`26e51d9`](https://github.com/LedgerHQ/ledger-live/commit/26e51d98fde1c080e09f566e0dbeb4f2c2e9f382) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add mobile E2E coverage for creating a contact, registering EVM addresses on the device and deleting both, and let device intents run against Speculos by registering it as a discoverable transport. Speculos specs can now pin an OS version so the run uses the Ethereum build the contacts intents require, which the app catalog does not serve yet.

- [#22572](https://github.com/LedgerHQ/ledger-live/pull/22572) [`6e76dda`](https://github.com/LedgerHQ/ledger-live/commit/6e76ddac6370bb60b17971679a857fae7ca83eb9) Thanks [@tonykhaov](https://github.com/tonykhaov)! - `ContactAvatar` takes `isMe` and is the only avatar that formats the Me label, so a Me avatar is announced once as "<name> (Me)". `MeAvatar` takes a display-ready `label` and is no longer exported; `ME_AVATAR_URL` stays exported. `PaySuccessRecipient.isMe` is now required.

- [#22656](https://github.com/LedgerHQ/ledger-live/pull/22656) [`486a1a4`](https://github.com/LedgerHQ/ledger-live/commit/486a1a45027e8104ae824d77bd34b298788c9b04) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Only mention ENS in the contact address input placeholder for networks that support domain resolution (LIVE-38284).

- [#22570](https://github.com/LedgerHQ/ledger-live/pull/22570) [`dfd53ad`](https://github.com/LedgerHQ/ledger-live/commit/dfd53adbf0815e2a62f59c1e996bd709bd710ea0) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Show the Me contact as "<name> (Me)", or "My addresses (Me)" when it was never renamed, through one rule: `formatContactDisplayName`, wrapped by `useContactDisplayName`. It replaces `createMeDisplayNameFormatter`, `resolveMeContactDisplayName`, `identityFormatMeDisplayName` and every `formatMeDisplayName` label. Contact list items keep the raw name plus `isMe`, and rows render through the hook. Fixes the Me name in the Send recipient list, Pay contacts, the History scope and the address dialog. The Me address picker says "Select my address". Adds `@features/platform-contacts/testing`.

- [#22512](https://github.com/LedgerHQ/ledger-live/pull/22512) [`c63d0fa`](https://github.com/LedgerHQ/ledger-live/commit/c63d0fa3ad6f181beb5d8ea7b2ef474d82fd1ed7) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Always show Me in the Send recipient contact list, with only its addresses on the account network, ordered like the other contacts (last sent to first). Draw Me with one `MeAvatar` everywhere: `ContactAvatar` renders it for the Me contact, so the `meAvatarSrc`, `avatarSrc` and `isMe` avatar props are gone.

- [#22573](https://github.com/LedgerHQ/ledger-live/pull/22573) [`9e54487`](https://github.com/LedgerHQ/ledger-live/commit/9e5448750d57eb92f95ef828b55d80eedd826323) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add `useOtherContactsAddresses(excludeContactId?)` so the duplicate-address list is built in one place, with each owner's display name: "This address is already used for My addresses (Me)." It replaces five copies in the Contacts and Send view models.

### Patch Changes

- Updated dependencies [[`e8d72da`](https://github.com/LedgerHQ/ledger-live/commit/e8d72dad9cd8aca2bf11b1768d10f2c7553e4cba), [`6e76dda`](https://github.com/LedgerHQ/ledger-live/commit/6e76ddac6370bb60b17971679a857fae7ca83eb9), [`f1d8aac`](https://github.com/LedgerHQ/ledger-live/commit/f1d8aac1c7c0bc0be9beb1508c1a9ef3cf7affae), [`33b4952`](https://github.com/LedgerHQ/ledger-live/commit/33b4952ef04d4e0528d2735ba299b4a8073e447e), [`e9af9cb`](https://github.com/LedgerHQ/ledger-live/commit/e9af9cb415b3ba4038d13ffc2dca7edb0432c830), [`dfd53ad`](https://github.com/LedgerHQ/ledger-live/commit/dfd53adbf0815e2a62f59c1e996bd709bd710ea0), [`c63d0fa`](https://github.com/LedgerHQ/ledger-live/commit/c63d0fa3ad6f181beb5d8ea7b2ef474d82fd1ed7), [`9e54487`](https://github.com/LedgerHQ/ledger-live/commit/9e5448750d57eb92f95ef828b55d80eedd826323), [`b2c3742`](https://github.com/LedgerHQ/ledger-live/commit/b2c3742dabf62702a85c8710421bce8ae80dc1fd), [`a896fca`](https://github.com/LedgerHQ/ledger-live/commit/a896fca1974a46f10e915d1212e0947e2d808ad5)]:
  - @features/flow-contacts-list@0.9.0-next.0
  - @features/platform-contacts@0.9.0-next.0
  - @domain/entity-currency-crypto@0.14.0-next.0
  - @features/flow-contacts-edit-address@0.4.1-next.0
  - @features/flow-contacts-add-contact@0.7.1-next.0
  - @features/flow-contacts-delete-contact@0.2.4-next.0
  - @features/flow-contacts-edit-contact@0.6.1-next.0
  - @domain/entity-contact@0.10.1-next.0
  - @features/flow-contacts-introduction@1.2.0

## 0.12.0

### Minor Changes

- [#22067](https://github.com/LedgerHQ/ledger-live/pull/22067) [`6996290`](https://github.com/LedgerHQ/ledger-live/commit/6996290580691788820aabd70367655f2283ac20) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Fix contacts detail pane header shaking on address list scroll

### Patch Changes

- Updated dependencies [[`5649787`](https://github.com/LedgerHQ/ledger-live/commit/56497875407fe63148b6dfbf266b778748972c01), [`871e485`](https://github.com/LedgerHQ/ledger-live/commit/871e4854284a0b21e31b53ff0ac312010093d914), [`6996290`](https://github.com/LedgerHQ/ledger-live/commit/6996290580691788820aabd70367655f2283ac20), [`98e3038`](https://github.com/LedgerHQ/ledger-live/commit/98e303872684da47feca343c0db7d83fcce857b2), [`33e92e8`](https://github.com/LedgerHQ/ledger-live/commit/33e92e8f074ff73a6a3e338c8313ba8bc9066ccf), [`0651158`](https://github.com/LedgerHQ/ledger-live/commit/0651158a2f03f819c2e2770ef4179901768c3c6c)]:
  - @features/flow-contacts-list@0.8.0
  - @features/platform-contacts@0.8.0
  - @features/flow-contacts-add-contact@0.7.0
  - @features/flow-contacts-edit-contact@0.6.0
  - @features/flow-contacts-edit-address@0.4.0
  - @domain/entity-currency-crypto@0.13.0
  - @domain/entity-contact@0.10.0
  - @features/flow-contacts-delete-contact@0.2.3
  - @features/flow-contacts-introduction@1.2.0

## 0.12.0-next.1

### Patch Changes

- Updated dependencies []:
  - @features/flow-contacts-edit-address@0.4.0-next.1
  - @features/platform-contacts@0.8.0-next.1
  - @features/flow-contacts-add-contact@0.7.0-next.1
  - @features/flow-contacts-delete-contact@0.2.3-next.1
  - @features/flow-contacts-edit-contact@0.6.0-next.1
  - @features/flow-contacts-list@0.8.0-next.1

## 0.12.0-next.0

### Minor Changes

- [#22067](https://github.com/LedgerHQ/ledger-live/pull/22067) [`6996290`](https://github.com/LedgerHQ/ledger-live/commit/6996290580691788820aabd70367655f2283ac20) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Fix contacts detail pane header shaking on address list scroll

### Patch Changes

- Updated dependencies [[`5649787`](https://github.com/LedgerHQ/ledger-live/commit/56497875407fe63148b6dfbf266b778748972c01), [`871e485`](https://github.com/LedgerHQ/ledger-live/commit/871e4854284a0b21e31b53ff0ac312010093d914), [`6996290`](https://github.com/LedgerHQ/ledger-live/commit/6996290580691788820aabd70367655f2283ac20), [`98e3038`](https://github.com/LedgerHQ/ledger-live/commit/98e303872684da47feca343c0db7d83fcce857b2), [`33e92e8`](https://github.com/LedgerHQ/ledger-live/commit/33e92e8f074ff73a6a3e338c8313ba8bc9066ccf), [`0651158`](https://github.com/LedgerHQ/ledger-live/commit/0651158a2f03f819c2e2770ef4179901768c3c6c)]:
  - @features/flow-contacts-list@0.8.0-next.0
  - @features/platform-contacts@0.8.0-next.0
  - @features/flow-contacts-add-contact@0.7.0-next.0
  - @features/flow-contacts-edit-contact@0.6.0-next.0
  - @features/flow-contacts-edit-address@0.4.0-next.0
  - @domain/entity-currency-crypto@0.13.0-next.0
  - @domain/entity-contact@0.10.0-next.0
  - @features/flow-contacts-delete-contact@0.2.3-next.0
  - @features/flow-contacts-introduction@1.2.0

## 0.11.0

### Minor Changes

- [#21651](https://github.com/LedgerHQ/ledger-live/pull/21651) [`632dd93`](https://github.com/LedgerHQ/ledger-live/commit/632dd9368616a97581d037f1503b2b16f567c02a) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Align Contacts analytics events and properties with the tracking plan on desktop and mobile.

- [#21920](https://github.com/LedgerHQ/ledger-live/pull/21920) [`b49d5b5`](https://github.com/LedgerHQ/ledger-live/commit/b49d5b573e84bd63ac460ae398657f1035613141) Thanks [@ysitbon](https://github.com/ysitbon)! - Give each dual-platform feature package its own web and native TypeScript project

  These packages keep `.web.*` and `.native.*` sources side by side but typechecked both
  in a single program, so `tsc` resolved suffix-free imports without knowing which
  platform it was checking. Each package now carries a solution-style `tsconfig.json`
  that owns no files and references one project per platform it targets, as described in
  `docs/tsconfig-in-ddd.md`. The web project sets `moduleSuffixes: [".web", ""]` and
  excludes the native sources, the native project does the reverse and also excludes the
  unsuffixed web barrel, and `typecheck` runs both passes. `@features/flow-large-screen-upsell`
  is web-only and gets a web project on its own.

  Separating the two programs surfaced cross-platform leaks that a single program could
  not see, so this also fixes them. Barrels that hard-pinned one platform's file, in the
  Contacts button and the Market banner, now import suffix-free and let `moduleSuffixes`
  choose, which makes their parallel `index.native.ts` barrels redundant. The three
  packages whose web entry was `src/web.ts` now expose it as `src/index.ts`, so a native
  program resolving the package can find the `index.native.ts` beside it instead of
  falling through to the web barrel and dragging web components into the native program.
  `@features/platform-style` gives its web implementations the `.web` suffix they were
  missing, which stops its native program from typechecking web code against native
  components. One web test reached for `require`, which only resolved because React
  Native's global typings were leaking in from the native files sharing its program, and
  now imports normally.

### Patch Changes

- Updated dependencies [[`13e3ebb`](https://github.com/LedgerHQ/ledger-live/commit/13e3ebba3ec7f10dcaf7d960f242f14a9853a191), [`16a454f`](https://github.com/LedgerHQ/ledger-live/commit/16a454fa79be46df6aec3c50ad40407f36dfdea9), [`782b197`](https://github.com/LedgerHQ/ledger-live/commit/782b197bf61a233f5c6ffe7f68e37267f8546e73), [`96a1ca9`](https://github.com/LedgerHQ/ledger-live/commit/96a1ca9fef1b0acc8113708c148890054dea143d), [`632dd93`](https://github.com/LedgerHQ/ledger-live/commit/632dd9368616a97581d037f1503b2b16f567c02a), [`036b71d`](https://github.com/LedgerHQ/ledger-live/commit/036b71d678a57c3b1c3156374122fe13bea54f79), [`5b60a96`](https://github.com/LedgerHQ/ledger-live/commit/5b60a968d3292b3897380f2c74c472a51b81e35d), [`b49d5b5`](https://github.com/LedgerHQ/ledger-live/commit/b49d5b573e84bd63ac460ae398657f1035613141)]:
  - @features/flow-contacts-list@0.7.0
  - @features/platform-contacts@0.7.0
  - @features/flow-contacts-introduction@1.2.0
  - @features/flow-contacts-add-contact@0.6.0
  - @domain/entity-contact@0.9.0
  - @features/flow-contacts-edit-contact@0.5.0
  - @features/flow-contacts-delete-contact@0.2.2
  - @features/flow-contacts-edit-address@0.3.1
  - @shared/ui-qr-code@0.4.0

## 0.11.0-next.0

### Minor Changes

- [#21651](https://github.com/LedgerHQ/ledger-live/pull/21651) [`632dd93`](https://github.com/LedgerHQ/ledger-live/commit/632dd9368616a97581d037f1503b2b16f567c02a) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Align Contacts analytics events and properties with the tracking plan on desktop and mobile.

- [#21920](https://github.com/LedgerHQ/ledger-live/pull/21920) [`b49d5b5`](https://github.com/LedgerHQ/ledger-live/commit/b49d5b573e84bd63ac460ae398657f1035613141) Thanks [@ysitbon](https://github.com/ysitbon)! - Give each dual-platform feature package its own web and native TypeScript project

  These packages keep `.web.*` and `.native.*` sources side by side but typechecked both
  in a single program, so `tsc` resolved suffix-free imports without knowing which
  platform it was checking. Each package now carries a solution-style `tsconfig.json`
  that owns no files and references one project per platform it targets, as described in
  `docs/tsconfig-in-ddd.md`. The web project sets `moduleSuffixes: [".web", ""]` and
  excludes the native sources, the native project does the reverse and also excludes the
  unsuffixed web barrel, and `typecheck` runs both passes. `@features/flow-large-screen-upsell`
  is web-only and gets a web project on its own.

  Separating the two programs surfaced cross-platform leaks that a single program could
  not see, so this also fixes them. Barrels that hard-pinned one platform's file, in the
  Contacts button and the Market banner, now import suffix-free and let `moduleSuffixes`
  choose, which makes their parallel `index.native.ts` barrels redundant. The three
  packages whose web entry was `src/web.ts` now expose it as `src/index.ts`, so a native
  program resolving the package can find the `index.native.ts` beside it instead of
  falling through to the web barrel and dragging web components into the native program.
  `@features/platform-style` gives its web implementations the `.web` suffix they were
  missing, which stops its native program from typechecking web code against native
  components. One web test reached for `require`, which only resolved because React
  Native's global typings were leaking in from the native files sharing its program, and
  now imports normally.

### Patch Changes

- Updated dependencies [[`13e3ebb`](https://github.com/LedgerHQ/ledger-live/commit/13e3ebba3ec7f10dcaf7d960f242f14a9853a191), [`16a454f`](https://github.com/LedgerHQ/ledger-live/commit/16a454fa79be46df6aec3c50ad40407f36dfdea9), [`782b197`](https://github.com/LedgerHQ/ledger-live/commit/782b197bf61a233f5c6ffe7f68e37267f8546e73), [`96a1ca9`](https://github.com/LedgerHQ/ledger-live/commit/96a1ca9fef1b0acc8113708c148890054dea143d), [`632dd93`](https://github.com/LedgerHQ/ledger-live/commit/632dd9368616a97581d037f1503b2b16f567c02a), [`036b71d`](https://github.com/LedgerHQ/ledger-live/commit/036b71d678a57c3b1c3156374122fe13bea54f79), [`5b60a96`](https://github.com/LedgerHQ/ledger-live/commit/5b60a968d3292b3897380f2c74c472a51b81e35d), [`b49d5b5`](https://github.com/LedgerHQ/ledger-live/commit/b49d5b573e84bd63ac460ae398657f1035613141)]:
  - @features/flow-contacts-list@0.7.0-next.0
  - @features/platform-contacts@0.7.0-next.0
  - @features/flow-contacts-introduction@1.2.0-next.0
  - @features/flow-contacts-add-contact@0.6.0-next.0
  - @domain/entity-contact@0.9.0-next.0
  - @features/flow-contacts-edit-contact@0.5.0-next.0
  - @features/flow-contacts-delete-contact@0.2.2-next.0
  - @features/flow-contacts-edit-address@0.3.1-next.0
  - @shared/ui-qr-code@0.4.0

## 0.10.0

### Minor Changes

- [#21367](https://github.com/LedgerHQ/ledger-live/pull/21367) [`d182d46`](https://github.com/LedgerHQ/ledger-live/commit/d182d466275f4c35ec3bf86cadf544de77c27058) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix the Ledger Sync entry point from Contacts: align the introduction copy and artwork with the production design, only show it when the user actually tries to add a contact or an address, start the flow on "Choose your sync method", and return to Contacts instead of the Portfolio once the flow is done on Mobile.

- [#21543](https://github.com/LedgerHQ/ledger-live/pull/21543) [`eea933c`](https://github.com/LedgerHQ/ledger-live/commit/eea933c21039eab89442a4caae6cf0e121f68cca) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix the trash icon of the contact "Delete contact" action rendering white instead of red.

- [#21453](https://github.com/LedgerHQ/ledger-live/pull/21453) [`3b0dbae`](https://github.com/LedgerHQ/ledger-live/commit/3b0dbae4ae5df48bd4eb58146675747d7e3593c2) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the web `ContactAddressPicker` dialog to the Pay contact flow and open it from the desktop Pay tab when a contact is pressed. The picker lists the contact's addresses segmented by network with asset-aware icons, resolved through the view model, and exposes an optional add-address action that routes to the contact's add-address flow. Address grouping, icon resolution and truncation are shared from `@features/flow-contacts`. The account/send handoff on address selection lands in a follow-up.

- [#21401](https://github.com/LedgerHQ/ledger-live/pull/21401) [`8c40cc1`](https://github.com/LedgerHQ/ledger-live/commit/8c40cc1c2054d12fc546e341a18e966d6ab23986) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Skip the extra confirmation modal when editing a contact or address name. Apply changes now starts the device action directly when needed, and the Apply CTA shows the Ledger logo in that case.

- [#21619](https://github.com/LedgerHQ/ledger-live/pull/21619) [`23d2e1e`](https://github.com/LedgerHQ/ledger-live/commit/23d2e1e0a0a83516fb9f5c12f54a2afc15208702) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Keep mobile contact address detail action buttons full width by applying horizontal padding only to the summary.

- [#21614](https://github.com/LedgerHQ/ledger-live/pull/21614) [`6ccfc64`](https://github.com/LedgerHQ/ledger-live/commit/6ccfc644e6b5c00e2e0bafb10e8519a09d7fb589) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Fix contact detail page scroll — full page now scrolls as one unit with safe area inset support

### Patch Changes

- Updated dependencies [[`d182d46`](https://github.com/LedgerHQ/ledger-live/commit/d182d466275f4c35ec3bf86cadf544de77c27058), [`5b79eb3`](https://github.com/LedgerHQ/ledger-live/commit/5b79eb3c5b1e2e7aca86fb0a8c4b7af085e57f9d), [`c06bd2e`](https://github.com/LedgerHQ/ledger-live/commit/c06bd2ee99e9d76609d628a41698a16c37a0c0c7), [`8c40cc1`](https://github.com/LedgerHQ/ledger-live/commit/8c40cc1c2054d12fc546e341a18e966d6ab23986), [`0089a4b`](https://github.com/LedgerHQ/ledger-live/commit/0089a4b80512c2c8f8eb3a03b9e3245492380647), [`e601584`](https://github.com/LedgerHQ/ledger-live/commit/e6015847b44e86dd9c4733559d591874099e1f4e), [`000eac0`](https://github.com/LedgerHQ/ledger-live/commit/000eac03eacf0093f241f8a05d9f525bbcf5de13), [`9672658`](https://github.com/LedgerHQ/ledger-live/commit/967265820c38ad0b2f8f45fd0a892ca07c58d23a), [`a55d4ca`](https://github.com/LedgerHQ/ledger-live/commit/a55d4ca3a804f6ab27f039926255f2c410ef7221), [`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d), [`2d42e64`](https://github.com/LedgerHQ/ledger-live/commit/2d42e647d55f79cf2eb821ec30a232cc07891219), [`b7d0367`](https://github.com/LedgerHQ/ledger-live/commit/b7d03671db1aa022d3ff375465c7d8470bf2b215), [`a9e389f`](https://github.com/LedgerHQ/ledger-live/commit/a9e389fc59ca30abf53d0ba8decc6290752ba1db), [`2744267`](https://github.com/LedgerHQ/ledger-live/commit/2744267da72f342ca2dc67d95f34d512d7f4c7f6), [`08ae9c2`](https://github.com/LedgerHQ/ledger-live/commit/08ae9c2bf7b2b509fa23d9b4bf33360f18f7f39f)]:
  - @features/flow-contacts-introduction@1.1.0
  - @features/platform-contacts@0.6.0
  - @features/flow-contacts-edit-address@0.3.0
  - @features/flow-contacts-edit-contact@0.4.0
  - @features/flow-contacts-list@0.6.0
  - @domain/entity-currency-crypto@0.12.0
  - @features/flow-contacts-add-contact@0.5.1
  - @features/flow-contacts-delete-contact@0.2.1
  - @domain/entity-contact@0.8.2
  - @shared/ui-qr-code@0.4.0

## 0.10.0-next.1

### Patch Changes

- Updated dependencies []:
  - @features/platform-contacts@0.6.0-next.1
  - @features/flow-contacts-add-contact@0.5.1-next.1
  - @features/flow-contacts-delete-contact@0.2.1-next.1
  - @features/flow-contacts-edit-address@0.3.0-next.1
  - @features/flow-contacts-edit-contact@0.4.0-next.1
  - @features/flow-contacts-list@0.6.0-next.1

## 0.10.0-next.0

### Minor Changes

- [#21367](https://github.com/LedgerHQ/ledger-live/pull/21367) [`d182d46`](https://github.com/LedgerHQ/ledger-live/commit/d182d466275f4c35ec3bf86cadf544de77c27058) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix the Ledger Sync entry point from Contacts: align the introduction copy and artwork with the production design, only show it when the user actually tries to add a contact or an address, start the flow on "Choose your sync method", and return to Contacts instead of the Portfolio once the flow is done on Mobile.

- [#21543](https://github.com/LedgerHQ/ledger-live/pull/21543) [`eea933c`](https://github.com/LedgerHQ/ledger-live/commit/eea933c21039eab89442a4caae6cf0e121f68cca) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix the trash icon of the contact "Delete contact" action rendering white instead of red.

- [#21453](https://github.com/LedgerHQ/ledger-live/pull/21453) [`3b0dbae`](https://github.com/LedgerHQ/ledger-live/commit/3b0dbae4ae5df48bd4eb58146675747d7e3593c2) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the web `ContactAddressPicker` dialog to the Pay contact flow and open it from the desktop Pay tab when a contact is pressed. The picker lists the contact's addresses segmented by network with asset-aware icons, resolved through the view model, and exposes an optional add-address action that routes to the contact's add-address flow. Address grouping, icon resolution and truncation are shared from `@features/flow-contacts`. The account/send handoff on address selection lands in a follow-up.

- [#21401](https://github.com/LedgerHQ/ledger-live/pull/21401) [`8c40cc1`](https://github.com/LedgerHQ/ledger-live/commit/8c40cc1c2054d12fc546e341a18e966d6ab23986) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Skip the extra confirmation modal when editing a contact or address name. Apply changes now starts the device action directly when needed, and the Apply CTA shows the Ledger logo in that case.

- [#21619](https://github.com/LedgerHQ/ledger-live/pull/21619) [`23d2e1e`](https://github.com/LedgerHQ/ledger-live/commit/23d2e1e0a0a83516fb9f5c12f54a2afc15208702) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Keep mobile contact address detail action buttons full width by applying horizontal padding only to the summary.

- [#21614](https://github.com/LedgerHQ/ledger-live/pull/21614) [`6ccfc64`](https://github.com/LedgerHQ/ledger-live/commit/6ccfc644e6b5c00e2e0bafb10e8519a09d7fb589) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Fix contact detail page scroll — full page now scrolls as one unit with safe area inset support

### Patch Changes

- Updated dependencies [[`d182d46`](https://github.com/LedgerHQ/ledger-live/commit/d182d466275f4c35ec3bf86cadf544de77c27058), [`5b79eb3`](https://github.com/LedgerHQ/ledger-live/commit/5b79eb3c5b1e2e7aca86fb0a8c4b7af085e57f9d), [`c06bd2e`](https://github.com/LedgerHQ/ledger-live/commit/c06bd2ee99e9d76609d628a41698a16c37a0c0c7), [`8c40cc1`](https://github.com/LedgerHQ/ledger-live/commit/8c40cc1c2054d12fc546e341a18e966d6ab23986), [`0089a4b`](https://github.com/LedgerHQ/ledger-live/commit/0089a4b80512c2c8f8eb3a03b9e3245492380647), [`e601584`](https://github.com/LedgerHQ/ledger-live/commit/e6015847b44e86dd9c4733559d591874099e1f4e), [`000eac0`](https://github.com/LedgerHQ/ledger-live/commit/000eac03eacf0093f241f8a05d9f525bbcf5de13), [`9672658`](https://github.com/LedgerHQ/ledger-live/commit/967265820c38ad0b2f8f45fd0a892ca07c58d23a), [`a55d4ca`](https://github.com/LedgerHQ/ledger-live/commit/a55d4ca3a804f6ab27f039926255f2c410ef7221), [`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d), [`2d42e64`](https://github.com/LedgerHQ/ledger-live/commit/2d42e647d55f79cf2eb821ec30a232cc07891219), [`b7d0367`](https://github.com/LedgerHQ/ledger-live/commit/b7d03671db1aa022d3ff375465c7d8470bf2b215), [`a9e389f`](https://github.com/LedgerHQ/ledger-live/commit/a9e389fc59ca30abf53d0ba8decc6290752ba1db), [`2744267`](https://github.com/LedgerHQ/ledger-live/commit/2744267da72f342ca2dc67d95f34d512d7f4c7f6), [`08ae9c2`](https://github.com/LedgerHQ/ledger-live/commit/08ae9c2bf7b2b509fa23d9b4bf33360f18f7f39f)]:
  - @features/flow-contacts-introduction@1.1.0-next.0
  - @features/platform-contacts@0.6.0-next.0
  - @features/flow-contacts-edit-address@0.3.0-next.0
  - @features/flow-contacts-edit-contact@0.4.0-next.0
  - @features/flow-contacts-list@0.6.0-next.0
  - @domain/entity-currency-crypto@0.12.0-next.0
  - @features/flow-contacts-add-contact@0.5.1-next.0
  - @features/flow-contacts-delete-contact@0.2.1-next.0
  - @domain/entity-contact@0.8.2-next.0
  - @shared/ui-qr-code@0.4.0

## 0.9.0

### Minor Changes

- [#20973](https://github.com/LedgerHQ/ledger-live/pull/20973) [`7d02f4b`](https://github.com/LedgerHQ/ledger-live/commit/7d02f4bbdc49f57df242d47b55ebd21c5176f4de) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix mobile bottom sheets that could not be reopened after being closed.

- [#21255](https://github.com/LedgerHQ/ledger-live/pull/21255) [`37cc17e`](https://github.com/LedgerHQ/ledger-live/commit/37cc17ea60f5a6c779aa7c5b5b6ae39d0bfea229) Thanks [@deepyjr](https://github.com/deepyjr)! - Restore the Ledger Wallet addresses entry background on Desktop.

- [#21262](https://github.com/LedgerHQ/ledger-live/pull/21262) [`f99b720`](https://github.com/LedgerHQ/ledger-live/commit/f99b7205490cb4712eff99519444d7dd6903c02a) Thanks [@deepyjr](https://github.com/deepyjr)! - Compact the desktop contact detail header while scrolling addresses.

- [#21128](https://github.com/LedgerHQ/ledger-live/pull/21128) [`31223eb`](https://github.com/LedgerHQ/ledger-live/commit/31223ebdd9335ef14a3ae8712658d17de60924e5) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Orchestrate Contacts device confirmations through the Device Intent Executor.

- [#21320](https://github.com/LedgerHQ/ledger-live/pull/21320) [`0639bea`](https://github.com/LedgerHQ/ledger-live/commit/0639bea01c594c335fb9b0604ad9ffc331936d54) Thanks [@deepyjr](https://github.com/deepyjr)! - Extract the reusable Contact deletion journey into its own flow package and move shared Contacts confirmation presentation to Platform Contacts.

- [#21112](https://github.com/LedgerHQ/ledger-live/pull/21112) [`cdbc3ac`](https://github.com/LedgerHQ/ledger-live/commit/cdbc3acac0045ab860206e32062cc5c417d75196) Thanks [@deepyjr](https://github.com/deepyjr)! - Extract the shared Contacts Edit address journey into an independent flow package.

- [#21209](https://github.com/LedgerHQ/ledger-live/pull/21209) [`a334296`](https://github.com/LedgerHQ/ledger-live/commit/a334296eaeca54451650fc3a3d1c36d5c8b93b8d) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Wire the Pay contacts empty state to the shared Add contact dialog, Ledger Sync gate, and a host-injected `createContactCreationPort`.

- [#21267](https://github.com/LedgerHQ/ledger-live/pull/21267) [`c20677f`](https://github.com/LedgerHQ/ledger-live/commit/c20677f1b5d13973883196e5665d6dd0ef7c58ba) Thanks [@deepyjr](https://github.com/deepyjr)! - Fix the native address QR code format and present the Contacts QR code in its dedicated dark,
  framed layout.

- [#21342](https://github.com/LedgerHQ/ledger-live/pull/21342) [`9a3746d`](https://github.com/LedgerHQ/ledger-live/commit/9a3746d7442c10649e183aaefeca2d7f51d4797f) Thanks [@deepyjr](https://github.com/deepyjr)! - Use a white QR card with black modules in Contact details for reliable dark mode scanning.

### Patch Changes

- Updated dependencies [[`545e419`](https://github.com/LedgerHQ/ledger-live/commit/545e4191a1b059058a20f30bdd1925b7c78e682c), [`7fae8f5`](https://github.com/LedgerHQ/ledger-live/commit/7fae8f5f7f22aa84933b734266de73cd9fa8a79c), [`e6d6ed6`](https://github.com/LedgerHQ/ledger-live/commit/e6d6ed6eda460eb614680b31a42ba8067cc28d2a), [`46f41d2`](https://github.com/LedgerHQ/ledger-live/commit/46f41d2787191684f52e5dc85b0cd629901b13d8), [`f99b720`](https://github.com/LedgerHQ/ledger-live/commit/f99b7205490cb4712eff99519444d7dd6903c02a), [`bb44e2c`](https://github.com/LedgerHQ/ledger-live/commit/bb44e2c4f8ce29b88394b15a17f7c698cb647e74), [`31223eb`](https://github.com/LedgerHQ/ledger-live/commit/31223ebdd9335ef14a3ae8712658d17de60924e5), [`c62986b`](https://github.com/LedgerHQ/ledger-live/commit/c62986b76467651009a571d64908405988b13571), [`cef29a0`](https://github.com/LedgerHQ/ledger-live/commit/cef29a0cd39ee1a7cfb6428ae650595b4479e4d6), [`0639bea`](https://github.com/LedgerHQ/ledger-live/commit/0639bea01c594c335fb9b0604ad9ffc331936d54), [`cdbc3ac`](https://github.com/LedgerHQ/ledger-live/commit/cdbc3acac0045ab860206e32062cc5c417d75196), [`60c41bd`](https://github.com/LedgerHQ/ledger-live/commit/60c41bddad7f1d02028d237cd10fc781baf8f674), [`46d23e1`](https://github.com/LedgerHQ/ledger-live/commit/46d23e1c719201910c0811da2a7a5a6849d93e25), [`a8c34d0`](https://github.com/LedgerHQ/ledger-live/commit/a8c34d0d9469b4e11339edfbef53445e58194fd8), [`34fc080`](https://github.com/LedgerHQ/ledger-live/commit/34fc080bb0c4ec01528404dde38f7c25559ecebe), [`a334296`](https://github.com/LedgerHQ/ledger-live/commit/a334296eaeca54451650fc3a3d1c36d5c8b93b8d), [`3b3c696`](https://github.com/LedgerHQ/ledger-live/commit/3b3c696a3d857f474a64b25cff6389f4df3b2063), [`6f4814b`](https://github.com/LedgerHQ/ledger-live/commit/6f4814b8c0e0c1c06b6729f036d756206ed19d77), [`c20677f`](https://github.com/LedgerHQ/ledger-live/commit/c20677f1b5d13973883196e5665d6dd0ef7c58ba), [`45ea28b`](https://github.com/LedgerHQ/ledger-live/commit/45ea28b19d1e950bf4e705388a06181a9a7543aa), [`f0f9990`](https://github.com/LedgerHQ/ledger-live/commit/f0f999034f698b4e0e35928d5cf43a365ed3fef0)]:
  - @features/platform-contacts@0.5.0
  - @features/flow-contacts-add-contact@0.5.0
  - @features/flow-contacts-edit-contact@0.3.0
  - @domain/entity-currency-crypto@0.11.0
  - @features/flow-contacts-introduction@1.0.0
  - @features/flow-contacts-list@0.5.0
  - @features/flow-contacts-delete-contact@0.2.0
  - @features/flow-contacts-edit-address@0.2.0
  - @shared/ui-qr-code@0.4.0
  - @domain/entity-contact@0.8.1

## 0.9.0-next.0

### Minor Changes

- [#20973](https://github.com/LedgerHQ/ledger-live/pull/20973) [`7d02f4b`](https://github.com/LedgerHQ/ledger-live/commit/7d02f4bbdc49f57df242d47b55ebd21c5176f4de) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix mobile bottom sheets that could not be reopened after being closed.

- [#21255](https://github.com/LedgerHQ/ledger-live/pull/21255) [`37cc17e`](https://github.com/LedgerHQ/ledger-live/commit/37cc17ea60f5a6c779aa7c5b5b6ae39d0bfea229) Thanks [@deepyjr](https://github.com/deepyjr)! - Restore the Ledger Wallet addresses entry background on Desktop.

- [#21262](https://github.com/LedgerHQ/ledger-live/pull/21262) [`f99b720`](https://github.com/LedgerHQ/ledger-live/commit/f99b7205490cb4712eff99519444d7dd6903c02a) Thanks [@deepyjr](https://github.com/deepyjr)! - Compact the desktop contact detail header while scrolling addresses.

- [#21128](https://github.com/LedgerHQ/ledger-live/pull/21128) [`31223eb`](https://github.com/LedgerHQ/ledger-live/commit/31223ebdd9335ef14a3ae8712658d17de60924e5) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Orchestrate Contacts device confirmations through the Device Intent Executor.

- [#21320](https://github.com/LedgerHQ/ledger-live/pull/21320) [`0639bea`](https://github.com/LedgerHQ/ledger-live/commit/0639bea01c594c335fb9b0604ad9ffc331936d54) Thanks [@deepyjr](https://github.com/deepyjr)! - Extract the reusable Contact deletion journey into its own flow package and move shared Contacts confirmation presentation to Platform Contacts.

- [#21112](https://github.com/LedgerHQ/ledger-live/pull/21112) [`cdbc3ac`](https://github.com/LedgerHQ/ledger-live/commit/cdbc3acac0045ab860206e32062cc5c417d75196) Thanks [@deepyjr](https://github.com/deepyjr)! - Extract the shared Contacts Edit address journey into an independent flow package.

- [#21209](https://github.com/LedgerHQ/ledger-live/pull/21209) [`a334296`](https://github.com/LedgerHQ/ledger-live/commit/a334296eaeca54451650fc3a3d1c36d5c8b93b8d) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Wire the Pay contacts empty state to the shared Add contact dialog, Ledger Sync gate, and a host-injected `createContactCreationPort`.

- [#21267](https://github.com/LedgerHQ/ledger-live/pull/21267) [`c20677f`](https://github.com/LedgerHQ/ledger-live/commit/c20677f1b5d13973883196e5665d6dd0ef7c58ba) Thanks [@deepyjr](https://github.com/deepyjr)! - Fix the native address QR code format and present the Contacts QR code in its dedicated dark,
  framed layout.

- [#21342](https://github.com/LedgerHQ/ledger-live/pull/21342) [`9a3746d`](https://github.com/LedgerHQ/ledger-live/commit/9a3746d7442c10649e183aaefeca2d7f51d4797f) Thanks [@deepyjr](https://github.com/deepyjr)! - Use a white QR card with black modules in Contact details for reliable dark mode scanning.

### Patch Changes

- Updated dependencies [[`545e419`](https://github.com/LedgerHQ/ledger-live/commit/545e4191a1b059058a20f30bdd1925b7c78e682c), [`7fae8f5`](https://github.com/LedgerHQ/ledger-live/commit/7fae8f5f7f22aa84933b734266de73cd9fa8a79c), [`e6d6ed6`](https://github.com/LedgerHQ/ledger-live/commit/e6d6ed6eda460eb614680b31a42ba8067cc28d2a), [`46f41d2`](https://github.com/LedgerHQ/ledger-live/commit/46f41d2787191684f52e5dc85b0cd629901b13d8), [`f99b720`](https://github.com/LedgerHQ/ledger-live/commit/f99b7205490cb4712eff99519444d7dd6903c02a), [`bb44e2c`](https://github.com/LedgerHQ/ledger-live/commit/bb44e2c4f8ce29b88394b15a17f7c698cb647e74), [`31223eb`](https://github.com/LedgerHQ/ledger-live/commit/31223ebdd9335ef14a3ae8712658d17de60924e5), [`c62986b`](https://github.com/LedgerHQ/ledger-live/commit/c62986b76467651009a571d64908405988b13571), [`cef29a0`](https://github.com/LedgerHQ/ledger-live/commit/cef29a0cd39ee1a7cfb6428ae650595b4479e4d6), [`0639bea`](https://github.com/LedgerHQ/ledger-live/commit/0639bea01c594c335fb9b0604ad9ffc331936d54), [`cdbc3ac`](https://github.com/LedgerHQ/ledger-live/commit/cdbc3acac0045ab860206e32062cc5c417d75196), [`60c41bd`](https://github.com/LedgerHQ/ledger-live/commit/60c41bddad7f1d02028d237cd10fc781baf8f674), [`46d23e1`](https://github.com/LedgerHQ/ledger-live/commit/46d23e1c719201910c0811da2a7a5a6849d93e25), [`a8c34d0`](https://github.com/LedgerHQ/ledger-live/commit/a8c34d0d9469b4e11339edfbef53445e58194fd8), [`34fc080`](https://github.com/LedgerHQ/ledger-live/commit/34fc080bb0c4ec01528404dde38f7c25559ecebe), [`a334296`](https://github.com/LedgerHQ/ledger-live/commit/a334296eaeca54451650fc3a3d1c36d5c8b93b8d), [`3b3c696`](https://github.com/LedgerHQ/ledger-live/commit/3b3c696a3d857f474a64b25cff6389f4df3b2063), [`6f4814b`](https://github.com/LedgerHQ/ledger-live/commit/6f4814b8c0e0c1c06b6729f036d756206ed19d77), [`c20677f`](https://github.com/LedgerHQ/ledger-live/commit/c20677f1b5d13973883196e5665d6dd0ef7c58ba), [`45ea28b`](https://github.com/LedgerHQ/ledger-live/commit/45ea28b19d1e950bf4e705388a06181a9a7543aa), [`f0f9990`](https://github.com/LedgerHQ/ledger-live/commit/f0f999034f698b4e0e35928d5cf43a365ed3fef0)]:
  - @features/platform-contacts@0.5.0-next.0
  - @features/flow-contacts-add-contact@0.5.0-next.0
  - @features/flow-contacts-edit-contact@0.3.0-next.0
  - @domain/entity-currency-crypto@0.11.0-next.0
  - @features/flow-contacts-introduction@1.0.0-next.0
  - @features/flow-contacts-list@0.5.0-next.0
  - @features/flow-contacts-delete-contact@0.2.0-next.0
  - @features/flow-contacts-edit-address@0.2.0-next.0
  - @shared/ui-qr-code@0.4.0-next.0
  - @domain/entity-contact@0.8.1-next.0

## 0.8.0

### Minor Changes

- [#21025](https://github.com/LedgerHQ/ledger-live/pull/21025) [`de982e6`](https://github.com/LedgerHQ/ledger-live/commit/de982e6a9ef6e2a27789212bee2729c7141193ad) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix Contacts edit flow so the device connection prompt appears after saving a contact name or address, not before opening the edit form.

- [#20899](https://github.com/LedgerHQ/ledger-live/pull/20899) [`5a30d71`](https://github.com/LedgerHQ/ledger-live/commit/5a30d71a0910bcfeb75a9cface524d7f942f1a7c) Thanks [@deepyjr](https://github.com/deepyjr)! - Allow Contacts address groups to be resolved from a contact ID.

- [#20726](https://github.com/LedgerHQ/ledger-live/pull/20726) [`6560883`](https://github.com/LedgerHQ/ledger-live/commit/6560883682ff7af5f8e61ae79e29f8560ac3f8e2) Thanks [@deepyjr](https://github.com/deepyjr)! - Keep mobile Add Address actions anchored above the keyboard

- [#21021](https://github.com/LedgerHQ/ledger-live/pull/21021) [`e998478`](https://github.com/LedgerHQ/ledger-live/commit/e9984787e3352a399b107fc3d4e889ffb02d4fc2) Thanks [@deepyjr](https://github.com/deepyjr)! - Fix the mobile Me contact detail name after it is customized

- [#20954](https://github.com/LedgerHQ/ledger-live/pull/20954) [`5a630b2`](https://github.com/LedgerHQ/ledger-live/commit/5a630b2cb982168094177d9a3c21fdf163454ef8) Thanks [@deepyjr](https://github.com/deepyjr)! - Expose ContactAvatar through the platform root API.

- [#20934](https://github.com/LedgerHQ/ledger-live/pull/20934) [`d8c04dd`](https://github.com/LedgerHQ/ledger-live/commit/d8c04ddf5e8bc7a6994d59475e12381dd28f403a) Thanks [@deepyjr](https://github.com/deepyjr)! - Fix Contacts entry point styling and return navigation to Ledger Wallet addresses.

- [#20872](https://github.com/LedgerHQ/ledger-live/pull/20872) [`d4bb463`](https://github.com/LedgerHQ/ledger-live/commit/d4bb46367e40a98a454c72e71ccc73b2dc75b417) Thanks [@deepyjr](https://github.com/deepyjr)! - Fix Contact sharing and align empty address copy

- [#20748](https://github.com/LedgerHQ/ledger-live/pull/20748) [`b6bb5b5`](https://github.com/LedgerHQ/ledger-live/commit/b6bb5b537c4536890ca1959357cad1ea2ad5f5d5) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Allow editing the saved wallet address in Contacts Edit Address flow, with the same validation as Add Address.

- [#20927](https://github.com/LedgerHQ/ledger-live/pull/20927) [`fec3bc8`](https://github.com/LedgerHQ/ledger-live/commit/fec3bc88bacd2705da38c5c5bf5e68e7d734c3b3) Thanks [@deepyjr](https://github.com/deepyjr)! - Expose embeddable Add contact content for Desktop and Mobile consumers.

- [#20673](https://github.com/LedgerHQ/ledger-live/pull/20673) [`f0f10ca`](https://github.com/LedgerHQ/ledger-live/commit/f0f10cae65f1e2015afbac540ecdcd01548356a8) Thanks [@deepyjr](https://github.com/deepyjr)! - Extract the Contacts Add address flow and centralize shared Contacts configuration in Platform Contacts.

- [#20963](https://github.com/LedgerHQ/ledger-live/pull/20963) [`55b7e6d`](https://github.com/LedgerHQ/ledger-live/commit/55b7e6d50aa1e97da3b1ae3405263e99b5fe5bde) Thanks [@deepyjr](https://github.com/deepyjr)! - Extract the Edit contact journey, share contact-name input primitives through Platform Contacts, and
  own the contact-name length limit in the Contact entity.

- [#20937](https://github.com/LedgerHQ/ledger-live/pull/20937) [`dd64855`](https://github.com/LedgerHQ/ledger-live/commit/dd648554ba49b37a69888d7cd87354ebdd22db20) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add `@shared/ui-qr-code` (renamed from `@shared/qr-code`) with a web export of `QrCode` so it renders on both web and native from a single API. Web draws via `qrcode` on a canvas, native keeps `react-native-qrcode-svg`, and both accept a free `centerContent` slot for a centered icon or logo (LIVE-36118).

- [#20505](https://github.com/LedgerHQ/ledger-live/pull/20505) [`f4ed19f`](https://github.com/LedgerHQ/ledger-live/commit/f4ed19f310eeb9cfad9e56665b9c2f2b40097925) Thanks [@deepyjr](https://github.com/deepyjr)! - Connect Contacts mutations to Ledger Sync availability and activation on Desktop and Mobile.

- [#21022](https://github.com/LedgerHQ/ledger-live/pull/21022) [`d6f0c7d`](https://github.com/LedgerHQ/ledger-live/commit/d6f0c7dc9f85002d17f1fa8156b4dc4c2d94e36d) Thanks [@deepyjr](https://github.com/deepyjr)! - Prevent address lists from bouncing when their content fits on screen.

### Patch Changes

- Updated dependencies [[`f427599`](https://github.com/LedgerHQ/ledger-live/commit/f42759916771b6445544255700082ccdaa3466c4), [`5a630b2`](https://github.com/LedgerHQ/ledger-live/commit/5a630b2cb982168094177d9a3c21fdf163454ef8), [`9470502`](https://github.com/LedgerHQ/ledger-live/commit/947050267c2733e7d0087865d2e9b29edf7f6413), [`6084fcd`](https://github.com/LedgerHQ/ledger-live/commit/6084fcd6b848049b5240abf32b9ac940603576c0), [`b6bb5b5`](https://github.com/LedgerHQ/ledger-live/commit/b6bb5b537c4536890ca1959357cad1ea2ad5f5d5), [`fec3bc8`](https://github.com/LedgerHQ/ledger-live/commit/fec3bc88bacd2705da38c5c5bf5e68e7d734c3b3), [`f0f10ca`](https://github.com/LedgerHQ/ledger-live/commit/f0f10cae65f1e2015afbac540ecdcd01548356a8), [`55b7e6d`](https://github.com/LedgerHQ/ledger-live/commit/55b7e6d50aa1e97da3b1ae3405263e99b5fe5bde), [`46a0d30`](https://github.com/LedgerHQ/ledger-live/commit/46a0d30f0134786a0be5d1c1b671a9c7955a81e1), [`8003387`](https://github.com/LedgerHQ/ledger-live/commit/80033873ea4628cbf9af189c313f73d54b422fb2), [`dd64855`](https://github.com/LedgerHQ/ledger-live/commit/dd648554ba49b37a69888d7cd87354ebdd22db20), [`79ee882`](https://github.com/LedgerHQ/ledger-live/commit/79ee882545ea85c8a17027bd685f4b99f1ec84cd), [`4c333ad`](https://github.com/LedgerHQ/ledger-live/commit/4c333ad80187596319d6e0042af331770fc1858e)]:
  - @domain/entity-contact@0.8.0
  - @features/flow-contacts-list@0.4.0
  - @features/platform-contacts@0.4.0
  - @features/flow-contacts-add-contact@0.4.0
  - @features/flow-contacts-edit-contact@0.2.0
  - @shared/ui-qr-code@0.3.0
  - @features/flow-contacts-introduction@0.3.0

## 0.8.0-next.0

### Minor Changes

- [#21025](https://github.com/LedgerHQ/ledger-live/pull/21025) [`de982e6`](https://github.com/LedgerHQ/ledger-live/commit/de982e6a9ef6e2a27789212bee2729c7141193ad) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix Contacts edit flow so the device connection prompt appears after saving a contact name or address, not before opening the edit form.

- [#20899](https://github.com/LedgerHQ/ledger-live/pull/20899) [`5a30d71`](https://github.com/LedgerHQ/ledger-live/commit/5a30d71a0910bcfeb75a9cface524d7f942f1a7c) Thanks [@deepyjr](https://github.com/deepyjr)! - Allow Contacts address groups to be resolved from a contact ID.

- [#20726](https://github.com/LedgerHQ/ledger-live/pull/20726) [`6560883`](https://github.com/LedgerHQ/ledger-live/commit/6560883682ff7af5f8e61ae79e29f8560ac3f8e2) Thanks [@deepyjr](https://github.com/deepyjr)! - Keep mobile Add Address actions anchored above the keyboard

- [#21021](https://github.com/LedgerHQ/ledger-live/pull/21021) [`e998478`](https://github.com/LedgerHQ/ledger-live/commit/e9984787e3352a399b107fc3d4e889ffb02d4fc2) Thanks [@deepyjr](https://github.com/deepyjr)! - Fix the mobile Me contact detail name after it is customized

- [#20954](https://github.com/LedgerHQ/ledger-live/pull/20954) [`5a630b2`](https://github.com/LedgerHQ/ledger-live/commit/5a630b2cb982168094177d9a3c21fdf163454ef8) Thanks [@deepyjr](https://github.com/deepyjr)! - Expose ContactAvatar through the platform root API.

- [#20934](https://github.com/LedgerHQ/ledger-live/pull/20934) [`d8c04dd`](https://github.com/LedgerHQ/ledger-live/commit/d8c04ddf5e8bc7a6994d59475e12381dd28f403a) Thanks [@deepyjr](https://github.com/deepyjr)! - Fix Contacts entry point styling and return navigation to Ledger Wallet addresses.

- [#20872](https://github.com/LedgerHQ/ledger-live/pull/20872) [`d4bb463`](https://github.com/LedgerHQ/ledger-live/commit/d4bb46367e40a98a454c72e71ccc73b2dc75b417) Thanks [@deepyjr](https://github.com/deepyjr)! - Fix Contact sharing and align empty address copy

- [#20748](https://github.com/LedgerHQ/ledger-live/pull/20748) [`b6bb5b5`](https://github.com/LedgerHQ/ledger-live/commit/b6bb5b537c4536890ca1959357cad1ea2ad5f5d5) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Allow editing the saved wallet address in Contacts Edit Address flow, with the same validation as Add Address.

- [#20927](https://github.com/LedgerHQ/ledger-live/pull/20927) [`fec3bc8`](https://github.com/LedgerHQ/ledger-live/commit/fec3bc88bacd2705da38c5c5bf5e68e7d734c3b3) Thanks [@deepyjr](https://github.com/deepyjr)! - Expose embeddable Add contact content for Desktop and Mobile consumers.

- [#20673](https://github.com/LedgerHQ/ledger-live/pull/20673) [`f0f10ca`](https://github.com/LedgerHQ/ledger-live/commit/f0f10cae65f1e2015afbac540ecdcd01548356a8) Thanks [@deepyjr](https://github.com/deepyjr)! - Extract the Contacts Add address flow and centralize shared Contacts configuration in Platform Contacts.

- [#20963](https://github.com/LedgerHQ/ledger-live/pull/20963) [`55b7e6d`](https://github.com/LedgerHQ/ledger-live/commit/55b7e6d50aa1e97da3b1ae3405263e99b5fe5bde) Thanks [@deepyjr](https://github.com/deepyjr)! - Extract the Edit contact journey, share contact-name input primitives through Platform Contacts, and
  own the contact-name length limit in the Contact entity.

- [#20937](https://github.com/LedgerHQ/ledger-live/pull/20937) [`dd64855`](https://github.com/LedgerHQ/ledger-live/commit/dd648554ba49b37a69888d7cd87354ebdd22db20) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add `@shared/ui-qr-code` (renamed from `@shared/qr-code`) with a web export of `QrCode` so it renders on both web and native from a single API. Web draws via `qrcode` on a canvas, native keeps `react-native-qrcode-svg`, and both accept a free `centerContent` slot for a centered icon or logo (LIVE-36118).

- [#20505](https://github.com/LedgerHQ/ledger-live/pull/20505) [`f4ed19f`](https://github.com/LedgerHQ/ledger-live/commit/f4ed19f310eeb9cfad9e56665b9c2f2b40097925) Thanks [@deepyjr](https://github.com/deepyjr)! - Connect Contacts mutations to Ledger Sync availability and activation on Desktop and Mobile.

- [#21022](https://github.com/LedgerHQ/ledger-live/pull/21022) [`d6f0c7d`](https://github.com/LedgerHQ/ledger-live/commit/d6f0c7dc9f85002d17f1fa8156b4dc4c2d94e36d) Thanks [@deepyjr](https://github.com/deepyjr)! - Prevent address lists from bouncing when their content fits on screen.

### Patch Changes

- Updated dependencies [[`f427599`](https://github.com/LedgerHQ/ledger-live/commit/f42759916771b6445544255700082ccdaa3466c4), [`5a630b2`](https://github.com/LedgerHQ/ledger-live/commit/5a630b2cb982168094177d9a3c21fdf163454ef8), [`9470502`](https://github.com/LedgerHQ/ledger-live/commit/947050267c2733e7d0087865d2e9b29edf7f6413), [`6084fcd`](https://github.com/LedgerHQ/ledger-live/commit/6084fcd6b848049b5240abf32b9ac940603576c0), [`b6bb5b5`](https://github.com/LedgerHQ/ledger-live/commit/b6bb5b537c4536890ca1959357cad1ea2ad5f5d5), [`fec3bc8`](https://github.com/LedgerHQ/ledger-live/commit/fec3bc88bacd2705da38c5c5bf5e68e7d734c3b3), [`f0f10ca`](https://github.com/LedgerHQ/ledger-live/commit/f0f10cae65f1e2015afbac540ecdcd01548356a8), [`55b7e6d`](https://github.com/LedgerHQ/ledger-live/commit/55b7e6d50aa1e97da3b1ae3405263e99b5fe5bde), [`46a0d30`](https://github.com/LedgerHQ/ledger-live/commit/46a0d30f0134786a0be5d1c1b671a9c7955a81e1), [`8003387`](https://github.com/LedgerHQ/ledger-live/commit/80033873ea4628cbf9af189c313f73d54b422fb2), [`dd64855`](https://github.com/LedgerHQ/ledger-live/commit/dd648554ba49b37a69888d7cd87354ebdd22db20), [`79ee882`](https://github.com/LedgerHQ/ledger-live/commit/79ee882545ea85c8a17027bd685f4b99f1ec84cd), [`4c333ad`](https://github.com/LedgerHQ/ledger-live/commit/4c333ad80187596319d6e0042af331770fc1858e)]:
  - @domain/entity-contact@0.8.0-next.0
  - @features/flow-contacts-list@0.4.0-next.0
  - @features/platform-contacts@0.4.0-next.0
  - @features/flow-contacts-add-contact@0.4.0-next.0
  - @features/flow-contacts-edit-contact@0.2.0-next.0
  - @shared/ui-qr-code@0.3.0-next.0
  - @features/flow-contacts-introduction@0.3.0-next.0

## 0.7.0

### Minor Changes

- [#20570](https://github.com/LedgerHQ/ledger-live/pull/20570) [`8605089`](https://github.com/LedgerHQ/ledger-live/commit/8605089242fd91da0ee4c6a7e8ea2f5a9f58962a) Thanks [@deepyjr](https://github.com/deepyjr)! - Add typed Device Intent data and a Cloud Sync document for Contacts.

- [#20851](https://github.com/LedgerHQ/ledger-live/pull/20851) [`55768ad`](https://github.com/LedgerHQ/ledger-live/commit/55768ad9f20ee24b2de8bbbe743b62b3b2e53355) Thanks [@deepyjr](https://github.com/deepyjr)! - Fix the pressed-state spacing of the mobile Contacts entry point.

- [#20571](https://github.com/LedgerHQ/ledger-live/pull/20571) [`7c8d5df`](https://github.com/LedgerHQ/ledger-live/commit/7c8d5dfa862a2e9c3a35251b5d06a3cd4f905d2a) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Thread the coin-module `Context` (ADR-019) explicitly through the coin-evm, coin-vechain and coin-near api and logic layers instead of resolving configuration from the module-level `getCoinConfig` singleton. Exported logic functions now take the context as their first argument, resolve `config` from it (`await context.config(currencyId)`), and pass an explicit, required `config` down to the network layer — no `config?` optionals and no singleton reads on the data path. `getCoinConfig`/`setCoinConfig` remain only as the compatibility surface for the classic account bridge. Ledger Live consumers (live-common, desktop, mobile and coin-celo) are updated to resolve and pass config/context explicitly. Also fixes a coin-polkadot type-inference issue where `getTransactionMaterialWithMetadata`'s cache-key extractor narrowed the cached signature and dropped the `config` argument.

- [#20682](https://github.com/LedgerHQ/ledger-live/pull/20682) [`f2f3ec9`](https://github.com/LedgerHQ/ledger-live/commit/f2f3ec9ef1f2869c44190e2f6aa16dc362f2891f) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add shared Contacts analytics global properties in platform-contacts and the typed tracking contract helper in flow-contacts.

- [#20759](https://github.com/LedgerHQ/ledger-live/pull/20759) [`526ca7b`](https://github.com/LedgerHQ/ledger-live/commit/526ca7be272a78b5cbd48481b6c5120989c0731b) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Extract shared Contacts tracking hooks and move currency analytics resolution to platform-contacts.

- [#20696](https://github.com/LedgerHQ/ledger-live/pull/20696) [`d43f03d`](https://github.com/LedgerHQ/ledger-live/commit/d43f03d2ab01e821677227cc2a76ee4ff5d0d7e7) Thanks [@deepyjr](https://github.com/deepyjr)! - Fix the address-name input focus state in Contacts.

- [#20697](https://github.com/LedgerHQ/ledger-live/pull/20697) [`21323c6`](https://github.com/LedgerHQ/ledger-live/commit/21323c66d04a25979a09b317014c6007d1c6b368) Thanks [@deepyjr](https://github.com/deepyjr)! - Truncate long contact names in the Contacts detail pane.

- [#20676](https://github.com/LedgerHQ/ledger-live/pull/20676) [`f040998`](https://github.com/LedgerHQ/ledger-live/commit/f04099812f60fc328ee101b5f4f0457b1d1c4bfa) Thanks [@deepyjr](https://github.com/deepyjr)! - Expose the reusable Contacts avatar renderer from Platform Contacts, including the Me profile image.

- [#20853](https://github.com/LedgerHQ/ledger-live/pull/20853) [`a781abe`](https://github.com/LedgerHQ/ledger-live/commit/a781abec59454ec3bd1cbd4b74b67666aef73aab) Thanks [@deepyjr](https://github.com/deepyjr)! - Allow Contacts addresses to be deleted without a device connection.

- [#20729](https://github.com/LedgerHQ/ledger-live/pull/20729) [`68448cd`](https://github.com/LedgerHQ/ledger-live/commit/68448cdf5c1fd5a2b6d912f4034d170dbabfc93f) Thanks [@deepyjr](https://github.com/deepyjr)! - Move the ENS resolution disclaimer below the address name field.

- [#20652](https://github.com/LedgerHQ/ledger-live/pull/20652) [`ca74f9d`](https://github.com/LedgerHQ/ledger-live/commit/ca74f9d50026c4a14657692de9c74c8f1c32f130) Thanks [@deepyjr](https://github.com/deepyjr)! - Extract the Contacts Feature and Ledger Sync introduction journeys into a dedicated flow package.

- [#20645](https://github.com/LedgerHQ/ledger-live/pull/20645) [`dd3baf3`](https://github.com/LedgerHQ/ledger-live/commit/dd3baf39e2fab7d30d0064e9a10e3e58df2dd6e1) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add shared edit contact signer validation state with mocked signer mismatch handling and wire Desktop and Mobile contact edit flows.

### Patch Changes

- Updated dependencies [[`e4e8d08`](https://github.com/LedgerHQ/ledger-live/commit/e4e8d086fc5672e4ce96c30c9a9af3f2022f863a), [`0dc2509`](https://github.com/LedgerHQ/ledger-live/commit/0dc2509c9646374755fce5aebc3d07bba17a8feb), [`8605089`](https://github.com/LedgerHQ/ledger-live/commit/8605089242fd91da0ee4c6a7e8ea2f5a9f58962a), [`45dc82e`](https://github.com/LedgerHQ/ledger-live/commit/45dc82e7aaf3dbc70a6fb89c673a342b28b3b12c), [`f2f3ec9`](https://github.com/LedgerHQ/ledger-live/commit/f2f3ec9ef1f2869c44190e2f6aa16dc362f2891f), [`526ca7b`](https://github.com/LedgerHQ/ledger-live/commit/526ca7be272a78b5cbd48481b6c5120989c0731b), [`46eb674`](https://github.com/LedgerHQ/ledger-live/commit/46eb6748e96782f28499d74cfc930abfbc99a5e4), [`da0a5ce`](https://github.com/LedgerHQ/ledger-live/commit/da0a5ceb8f889f1bace45ed2d3d4c640cdf24ca8), [`f040998`](https://github.com/LedgerHQ/ledger-live/commit/f04099812f60fc328ee101b5f4f0457b1d1c4bfa), [`5b39a67`](https://github.com/LedgerHQ/ledger-live/commit/5b39a67dd93d4c541a77b0b146881073ca00ed15), [`0807eca`](https://github.com/LedgerHQ/ledger-live/commit/0807ecacfd06057811a3d6f8845b9f4bfc6f693c), [`ca74f9d`](https://github.com/LedgerHQ/ledger-live/commit/ca74f9d50026c4a14657692de9c74c8f1c32f130), [`3dd9308`](https://github.com/LedgerHQ/ledger-live/commit/3dd9308f1a670a56588acbe70f2cbb4eb39d3432), [`fae92bf`](https://github.com/LedgerHQ/ledger-live/commit/fae92bf68e8ac167644aefa9e9d981a7b12cb23a), [`79882e2`](https://github.com/LedgerHQ/ledger-live/commit/79882e26a14f246f1cc969937e011b16e701b8f2)]:
  - @shared/feature-flags@0.19.0
  - @features/platform-contacts@0.3.0
  - @features/flow-contacts-list@0.3.0
  - @domain/entity-contact@0.7.0
  - @features/flow-contacts-add-contact@0.3.0
  - @features/flow-contacts-introduction@0.2.0
  - @domain/entity-currency-token@0.5.0
  - @features/platform-feature-flags@0.6.6

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->

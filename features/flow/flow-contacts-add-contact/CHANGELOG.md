# @features/flow-contacts-add-contact

## 0.9.0-next.0

### Minor Changes

- [#23888](https://github.com/LedgerHQ/ledger-live/pull/23888) [`7ce8446`](https://github.com/LedgerHQ/ledger-live/commit/7ce8446db105f07bf142ab3bba9627875178f065) Thanks [@zel-kass](https://github.com/zel-kass)! - Bump Lumen to lumen-design-core 0.1.34, lumen-ui-react 0.1.67, lumen-ui-rnative 0.1.70, lumen-utils-shared 0.1.18 and lumen-lint-plugin 0.1.1. `cn` now comes from `@ledgerhq/lumen-design-core/cn` (the local helpers re-export it), the `Apex` icon is renamed `NanoGen5`, the removed `BellNotification` and `ShieldCheckNotification` icons are replaced by the plain icon inside a red `DotIndicator`, `FormattedValue` is imported from `@ledgerhq/lumen-ui-react` instead of `@ledgerhq/lumen-utils-shared`, Tailwind font classes that produce no CSS under the Lumen preset are dropped, and the `clsx`, `tailwind-merge`, `@radix-ui/react-switch` and `@radix-ui/react-checkbox` declarations Lumen no longer needs are removed.

- [#23973](https://github.com/LedgerHQ/ledger-live/pull/23973) [`57c72ac`](https://github.com/LedgerHQ/ledger-live/commit/57c72ac92d3c9352b751b21bb96d64f19a2b6cb1) Thanks [@ysitbon](https://github.com/ysitbon)! - Every `@features/platform-contacts` component has one props contract on both platforms. `ContactConfirmationDialog` replaces `ContactConfirmationBottomSheet` on mobile and takes a `tone` (`destructive` or `neutral`), `isConfirming` and `testID`; it reads the sheet's bottom inset itself. `ContactAvatar` takes `testID` instead of `testId` and drops `ariaLabel`, `ContactNameInput` calls `onChangeName`, and `ContactNameDisclaimer` now renders on mobile too. The `.` entry has no `react-native` condition, `./native` is gone, and `./web` exports only `getPastedValue`.

### Patch Changes

- Updated dependencies [[`9a1198f`](https://github.com/LedgerHQ/ledger-live/commit/9a1198fd10a67e2893163985b884c7437b4d036a), [`57c72ac`](https://github.com/LedgerHQ/ledger-live/commit/57c72ac92d3c9352b751b21bb96d64f19a2b6cb1), [`067b492`](https://github.com/LedgerHQ/ledger-live/commit/067b492cafa20166ce080344b7cb2d6c71f43301)]:
  - @features/platform-contacts@0.12.0-next.0
  - @domain/entity-contact@0.12.2-next.0
  - @shared/i18n@0.2.0

## 0.8.0

### Minor Changes

- [#23432](https://github.com/LedgerHQ/ledger-live/pull/23432) [`fc846e5`](https://github.com/LedgerHQ/ledger-live/commit/fc846e53bbe5023223aa847b6e00b68fb22ace4a) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Resolve Add contact copy inside the package with @shared/i18n

### Patch Changes

- Updated dependencies [[`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c), [`4fd1ebc`](https://github.com/LedgerHQ/ledger-live/commit/4fd1ebc94718ead589f235824f0440803341feb9)]:
  - @features/platform-contacts@0.11.0
  - @domain/entity-contact@0.12.1

## 0.8.0-next.0

### Minor Changes

- [#23432](https://github.com/LedgerHQ/ledger-live/pull/23432) [`fc846e5`](https://github.com/LedgerHQ/ledger-live/commit/fc846e53bbe5023223aa847b6e00b68fb22ace4a) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Resolve Add contact copy inside the package with @shared/i18n

### Patch Changes

- Updated dependencies [[`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c), [`4fd1ebc`](https://github.com/LedgerHQ/ledger-live/commit/4fd1ebc94718ead589f235824f0440803341feb9)]:
  - @features/platform-contacts@0.11.0-next.0
  - @domain/entity-contact@0.12.1-next.0

## 0.7.2

### Patch Changes

- Updated dependencies [[`4101467`](https://github.com/LedgerHQ/ledger-live/commit/4101467e60d17f1facfae9c71e5b684bcf9f48e3), [`8376d49`](https://github.com/LedgerHQ/ledger-live/commit/8376d497d552cd4644e806afdfbd5323bf10a695), [`8783545`](https://github.com/LedgerHQ/ledger-live/commit/87835456704c2322a25339ef27ef92a320d02025)]:
  - @domain/entity-contact@0.12.0
  - @features/platform-contacts@0.10.0

## 0.7.2-next.0

### Patch Changes

- Updated dependencies [[`4101467`](https://github.com/LedgerHQ/ledger-live/commit/4101467e60d17f1facfae9c71e5b684bcf9f48e3), [`8376d49`](https://github.com/LedgerHQ/ledger-live/commit/8376d497d552cd4644e806afdfbd5323bf10a695), [`8783545`](https://github.com/LedgerHQ/ledger-live/commit/87835456704c2322a25339ef27ef92a320d02025)]:
  - @domain/entity-contact@0.12.0-next.0
  - @features/platform-contacts@0.10.0-next.0

## 0.7.1

### Patch Changes

- Updated dependencies [[`d5dfa07`](https://github.com/LedgerHQ/ledger-live/commit/d5dfa072c9a724609119c06622004d76a45414d9), [`6e76dda`](https://github.com/LedgerHQ/ledger-live/commit/6e76ddac6370bb60b17971679a857fae7ca83eb9), [`33b4952`](https://github.com/LedgerHQ/ledger-live/commit/33b4952ef04d4e0528d2735ba299b4a8073e447e), [`e9af9cb`](https://github.com/LedgerHQ/ledger-live/commit/e9af9cb415b3ba4038d13ffc2dca7edb0432c830), [`dfd53ad`](https://github.com/LedgerHQ/ledger-live/commit/dfd53adbf0815e2a62f59c1e996bd709bd710ea0), [`c63d0fa`](https://github.com/LedgerHQ/ledger-live/commit/c63d0fa3ad6f181beb5d8ea7b2ef474d82fd1ed7), [`9e54487`](https://github.com/LedgerHQ/ledger-live/commit/9e5448750d57eb92f95ef828b55d80eedd826323)]:
  - @domain/entity-contact@0.11.0
  - @features/platform-contacts@0.9.0

## 0.7.1-next.2

### Patch Changes

- Updated dependencies []:
  - @features/platform-contacts@0.9.0-next.2

## 0.7.1-next.1

### Patch Changes

- Updated dependencies [[`d5dfa07`](https://github.com/LedgerHQ/ledger-live/commit/d5dfa072c9a724609119c06622004d76a45414d9)]:
  - @domain/entity-contact@0.11.0-next.1
  - @features/platform-contacts@0.9.0-next.1

## 0.7.1-next.0

### Patch Changes

- Updated dependencies [[`6e76dda`](https://github.com/LedgerHQ/ledger-live/commit/6e76ddac6370bb60b17971679a857fae7ca83eb9), [`33b4952`](https://github.com/LedgerHQ/ledger-live/commit/33b4952ef04d4e0528d2735ba299b4a8073e447e), [`e9af9cb`](https://github.com/LedgerHQ/ledger-live/commit/e9af9cb415b3ba4038d13ffc2dca7edb0432c830), [`dfd53ad`](https://github.com/LedgerHQ/ledger-live/commit/dfd53adbf0815e2a62f59c1e996bd709bd710ea0), [`c63d0fa`](https://github.com/LedgerHQ/ledger-live/commit/c63d0fa3ad6f181beb5d8ea7b2ef474d82fd1ed7), [`9e54487`](https://github.com/LedgerHQ/ledger-live/commit/9e5448750d57eb92f95ef828b55d80eedd826323)]:
  - @features/platform-contacts@0.9.0-next.0
  - @domain/entity-contact@0.10.1-next.0

## 0.7.0

### Minor Changes

- [#21747](https://github.com/LedgerHQ/ledger-live/pull/21747) [`871e485`](https://github.com/LedgerHQ/ledger-live/commit/871e4854284a0b21e31b53ff0ac312010093d914) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix keyboard handling in the mobile Contacts add, edit, and send flows. Input sheets now open at full height with the keyboard, primary actions remain visible in a keyboard-aware `QueuedBottomSheet` footer, and name fields focus immediately and capitalize each word.

### Patch Changes

- Updated dependencies [[`871e485`](https://github.com/LedgerHQ/ledger-live/commit/871e4854284a0b21e31b53ff0ac312010093d914), [`33e92e8`](https://github.com/LedgerHQ/ledger-live/commit/33e92e8f074ff73a6a3e338c8313ba8bc9066ccf), [`0651158`](https://github.com/LedgerHQ/ledger-live/commit/0651158a2f03f819c2e2770ef4179901768c3c6c)]:
  - @features/platform-contacts@0.8.0
  - @domain/entity-contact@0.10.0

## 0.7.0-next.1

### Patch Changes

- Updated dependencies []:
  - @features/platform-contacts@0.8.0-next.1

## 0.7.0-next.0

### Minor Changes

- [#21747](https://github.com/LedgerHQ/ledger-live/pull/21747) [`871e485`](https://github.com/LedgerHQ/ledger-live/commit/871e4854284a0b21e31b53ff0ac312010093d914) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix keyboard handling in the mobile Contacts add, edit, and send flows. Input sheets now open at full height with the keyboard, primary actions remain visible in a keyboard-aware `QueuedBottomSheet` footer, and name fields focus immediately and capitalize each word.

### Patch Changes

- Updated dependencies [[`871e485`](https://github.com/LedgerHQ/ledger-live/commit/871e4854284a0b21e31b53ff0ac312010093d914), [`33e92e8`](https://github.com/LedgerHQ/ledger-live/commit/33e92e8f074ff73a6a3e338c8313ba8bc9066ccf), [`0651158`](https://github.com/LedgerHQ/ledger-live/commit/0651158a2f03f819c2e2770ef4179901768c3c6c)]:
  - @features/platform-contacts@0.8.0-next.0
  - @domain/entity-contact@0.10.0-next.0

## 0.6.0

### Minor Changes

- [#21921](https://github.com/LedgerHQ/ledger-live/pull/21921) [`036b71d`](https://github.com/LedgerHQ/ledger-live/commit/036b71d678a57c3b1c3156374122fe13bea54f79) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Align the add-contact confirmation CTA with "Add contact" on mobile and desktop

### Patch Changes

- Updated dependencies [[`16a454f`](https://github.com/LedgerHQ/ledger-live/commit/16a454fa79be46df6aec3c50ad40407f36dfdea9), [`96a1ca9`](https://github.com/LedgerHQ/ledger-live/commit/96a1ca9fef1b0acc8113708c148890054dea143d), [`632dd93`](https://github.com/LedgerHQ/ledger-live/commit/632dd9368616a97581d037f1503b2b16f567c02a), [`5b60a96`](https://github.com/LedgerHQ/ledger-live/commit/5b60a968d3292b3897380f2c74c472a51b81e35d)]:
  - @features/platform-contacts@0.7.0
  - @domain/entity-contact@0.9.0

## 0.6.0-next.0

### Minor Changes

- [#21921](https://github.com/LedgerHQ/ledger-live/pull/21921) [`036b71d`](https://github.com/LedgerHQ/ledger-live/commit/036b71d678a57c3b1c3156374122fe13bea54f79) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Align the add-contact confirmation CTA with "Add contact" on mobile and desktop

### Patch Changes

- Updated dependencies [[`16a454f`](https://github.com/LedgerHQ/ledger-live/commit/16a454fa79be46df6aec3c50ad40407f36dfdea9), [`96a1ca9`](https://github.com/LedgerHQ/ledger-live/commit/96a1ca9fef1b0acc8113708c148890054dea143d), [`632dd93`](https://github.com/LedgerHQ/ledger-live/commit/632dd9368616a97581d037f1503b2b16f567c02a), [`5b60a96`](https://github.com/LedgerHQ/ledger-live/commit/5b60a968d3292b3897380f2c74c472a51b81e35d)]:
  - @features/platform-contacts@0.7.0-next.0
  - @domain/entity-contact@0.9.0-next.0

## 0.5.1

### Patch Changes

- Updated dependencies [[`5b79eb3`](https://github.com/LedgerHQ/ledger-live/commit/5b79eb3c5b1e2e7aca86fb0a8c4b7af085e57f9d), [`0089a4b`](https://github.com/LedgerHQ/ledger-live/commit/0089a4b80512c2c8f8eb3a03b9e3245492380647), [`9672658`](https://github.com/LedgerHQ/ledger-live/commit/967265820c38ad0b2f8f45fd0a892ca07c58d23a), [`a55d4ca`](https://github.com/LedgerHQ/ledger-live/commit/a55d4ca3a804f6ab27f039926255f2c410ef7221), [`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d), [`08ae9c2`](https://github.com/LedgerHQ/ledger-live/commit/08ae9c2bf7b2b509fa23d9b4bf33360f18f7f39f)]:
  - @features/platform-contacts@0.6.0
  - @domain/entity-contact@0.8.2

## 0.5.1-next.1

### Patch Changes

- Updated dependencies []:
  - @features/platform-contacts@0.6.0-next.1

## 0.5.1-next.0

### Patch Changes

- Updated dependencies [[`5b79eb3`](https://github.com/LedgerHQ/ledger-live/commit/5b79eb3c5b1e2e7aca86fb0a8c4b7af085e57f9d), [`0089a4b`](https://github.com/LedgerHQ/ledger-live/commit/0089a4b80512c2c8f8eb3a03b9e3245492380647), [`9672658`](https://github.com/LedgerHQ/ledger-live/commit/967265820c38ad0b2f8f45fd0a892ca07c58d23a), [`a55d4ca`](https://github.com/LedgerHQ/ledger-live/commit/a55d4ca3a804f6ab27f039926255f2c410ef7221), [`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d), [`08ae9c2`](https://github.com/LedgerHQ/ledger-live/commit/08ae9c2bf7b2b509fa23d9b4bf33360f18f7f39f)]:
  - @features/platform-contacts@0.6.0-next.0
  - @domain/entity-contact@0.8.2-next.0

## 0.5.0

### Minor Changes

- [#21151](https://github.com/LedgerHQ/ledger-live/pull/21151) [`545e419`](https://github.com/LedgerHQ/ledger-live/commit/545e4191a1b059058a20f30bdd1925b7c78e682c) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix the odd Add contact transition on Mobile by focusing the contact name field only once the drawer has finished opening, so the keyboard no longer resizes the dynamically sized drawer mid-animation. Adds an onOpened callback to QueuedBottomSheet and makes ContactNameInput focus reactively rather than only on mount.

- [#21209](https://github.com/LedgerHQ/ledger-live/pull/21209) [`a334296`](https://github.com/LedgerHQ/ledger-live/commit/a334296eaeca54451650fc3a3d1c36d5c8b93b8d) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Wire the Pay contacts empty state to the shared Add contact dialog, Ledger Sync gate, and a host-injected `createContactCreationPort`.

### Patch Changes

- Updated dependencies [[`545e419`](https://github.com/LedgerHQ/ledger-live/commit/545e4191a1b059058a20f30bdd1925b7c78e682c), [`7fae8f5`](https://github.com/LedgerHQ/ledger-live/commit/7fae8f5f7f22aa84933b734266de73cd9fa8a79c), [`bb44e2c`](https://github.com/LedgerHQ/ledger-live/commit/bb44e2c4f8ce29b88394b15a17f7c698cb647e74), [`31223eb`](https://github.com/LedgerHQ/ledger-live/commit/31223ebdd9335ef14a3ae8712658d17de60924e5), [`c62986b`](https://github.com/LedgerHQ/ledger-live/commit/c62986b76467651009a571d64908405988b13571), [`cef29a0`](https://github.com/LedgerHQ/ledger-live/commit/cef29a0cd39ee1a7cfb6428ae650595b4479e4d6), [`0639bea`](https://github.com/LedgerHQ/ledger-live/commit/0639bea01c594c335fb9b0604ad9ffc331936d54), [`cdbc3ac`](https://github.com/LedgerHQ/ledger-live/commit/cdbc3acac0045ab860206e32062cc5c417d75196), [`34fc080`](https://github.com/LedgerHQ/ledger-live/commit/34fc080bb0c4ec01528404dde38f7c25559ecebe), [`45ea28b`](https://github.com/LedgerHQ/ledger-live/commit/45ea28b19d1e950bf4e705388a06181a9a7543aa), [`f0f9990`](https://github.com/LedgerHQ/ledger-live/commit/f0f999034f698b4e0e35928d5cf43a365ed3fef0)]:
  - @features/platform-contacts@0.5.0
  - @domain/entity-contact@0.8.1

## 0.5.0-next.0

### Minor Changes

- [#21151](https://github.com/LedgerHQ/ledger-live/pull/21151) [`545e419`](https://github.com/LedgerHQ/ledger-live/commit/545e4191a1b059058a20f30bdd1925b7c78e682c) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix the odd Add contact transition on Mobile by focusing the contact name field only once the drawer has finished opening, so the keyboard no longer resizes the dynamically sized drawer mid-animation. Adds an onOpened callback to QueuedBottomSheet and makes ContactNameInput focus reactively rather than only on mount.

- [#21209](https://github.com/LedgerHQ/ledger-live/pull/21209) [`a334296`](https://github.com/LedgerHQ/ledger-live/commit/a334296eaeca54451650fc3a3d1c36d5c8b93b8d) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Wire the Pay contacts empty state to the shared Add contact dialog, Ledger Sync gate, and a host-injected `createContactCreationPort`.

### Patch Changes

- Updated dependencies [[`545e419`](https://github.com/LedgerHQ/ledger-live/commit/545e4191a1b059058a20f30bdd1925b7c78e682c), [`7fae8f5`](https://github.com/LedgerHQ/ledger-live/commit/7fae8f5f7f22aa84933b734266de73cd9fa8a79c), [`bb44e2c`](https://github.com/LedgerHQ/ledger-live/commit/bb44e2c4f8ce29b88394b15a17f7c698cb647e74), [`31223eb`](https://github.com/LedgerHQ/ledger-live/commit/31223ebdd9335ef14a3ae8712658d17de60924e5), [`c62986b`](https://github.com/LedgerHQ/ledger-live/commit/c62986b76467651009a571d64908405988b13571), [`cef29a0`](https://github.com/LedgerHQ/ledger-live/commit/cef29a0cd39ee1a7cfb6428ae650595b4479e4d6), [`0639bea`](https://github.com/LedgerHQ/ledger-live/commit/0639bea01c594c335fb9b0604ad9ffc331936d54), [`cdbc3ac`](https://github.com/LedgerHQ/ledger-live/commit/cdbc3acac0045ab860206e32062cc5c417d75196), [`34fc080`](https://github.com/LedgerHQ/ledger-live/commit/34fc080bb0c4ec01528404dde38f7c25559ecebe), [`45ea28b`](https://github.com/LedgerHQ/ledger-live/commit/45ea28b19d1e950bf4e705388a06181a9a7543aa), [`f0f9990`](https://github.com/LedgerHQ/ledger-live/commit/f0f999034f698b4e0e35928d5cf43a365ed3fef0)]:
  - @features/platform-contacts@0.5.0-next.0
  - @domain/entity-contact@0.8.1-next.0

## 0.4.0

### Minor Changes

- [#20927](https://github.com/LedgerHQ/ledger-live/pull/20927) [`fec3bc8`](https://github.com/LedgerHQ/ledger-live/commit/fec3bc88bacd2705da38c5c5bf5e68e7d734c3b3) Thanks [@deepyjr](https://github.com/deepyjr)! - Expose embeddable Add contact content for Desktop and Mobile consumers.

- [#20963](https://github.com/LedgerHQ/ledger-live/pull/20963) [`55b7e6d`](https://github.com/LedgerHQ/ledger-live/commit/55b7e6d50aa1e97da3b1ae3405263e99b5fe5bde) Thanks [@deepyjr](https://github.com/deepyjr)! - Extract the Edit contact journey, share contact-name input primitives through Platform Contacts, and
  own the contact-name length limit in the Contact entity.

- [#20972](https://github.com/LedgerHQ/ledger-live/pull/20972) [`4c333ad`](https://github.com/LedgerHQ/ledger-live/commit/4c333ad80187596319d6e0042af331770fc1858e) Thanks [@deepyjr](https://github.com/deepyjr)! - Centralize dual-platform Knip configuration.

### Patch Changes

- Updated dependencies [[`f427599`](https://github.com/LedgerHQ/ledger-live/commit/f42759916771b6445544255700082ccdaa3466c4), [`5a630b2`](https://github.com/LedgerHQ/ledger-live/commit/5a630b2cb982168094177d9a3c21fdf163454ef8), [`9470502`](https://github.com/LedgerHQ/ledger-live/commit/947050267c2733e7d0087865d2e9b29edf7f6413), [`b6bb5b5`](https://github.com/LedgerHQ/ledger-live/commit/b6bb5b537c4536890ca1959357cad1ea2ad5f5d5), [`f0f10ca`](https://github.com/LedgerHQ/ledger-live/commit/f0f10cae65f1e2015afbac540ecdcd01548356a8), [`55b7e6d`](https://github.com/LedgerHQ/ledger-live/commit/55b7e6d50aa1e97da3b1ae3405263e99b5fe5bde), [`8003387`](https://github.com/LedgerHQ/ledger-live/commit/80033873ea4628cbf9af189c313f73d54b422fb2), [`4c333ad`](https://github.com/LedgerHQ/ledger-live/commit/4c333ad80187596319d6e0042af331770fc1858e)]:
  - @domain/entity-contact@0.8.0
  - @features/platform-contacts@0.4.0

## 0.4.0-next.0

### Minor Changes

- [#20927](https://github.com/LedgerHQ/ledger-live/pull/20927) [`fec3bc8`](https://github.com/LedgerHQ/ledger-live/commit/fec3bc88bacd2705da38c5c5bf5e68e7d734c3b3) Thanks [@deepyjr](https://github.com/deepyjr)! - Expose embeddable Add contact content for Desktop and Mobile consumers.

- [#20963](https://github.com/LedgerHQ/ledger-live/pull/20963) [`55b7e6d`](https://github.com/LedgerHQ/ledger-live/commit/55b7e6d50aa1e97da3b1ae3405263e99b5fe5bde) Thanks [@deepyjr](https://github.com/deepyjr)! - Extract the Edit contact journey, share contact-name input primitives through Platform Contacts, and
  own the contact-name length limit in the Contact entity.

- [#20972](https://github.com/LedgerHQ/ledger-live/pull/20972) [`4c333ad`](https://github.com/LedgerHQ/ledger-live/commit/4c333ad80187596319d6e0042af331770fc1858e) Thanks [@deepyjr](https://github.com/deepyjr)! - Centralize dual-platform Knip configuration.

### Patch Changes

- Updated dependencies [[`f427599`](https://github.com/LedgerHQ/ledger-live/commit/f42759916771b6445544255700082ccdaa3466c4), [`5a630b2`](https://github.com/LedgerHQ/ledger-live/commit/5a630b2cb982168094177d9a3c21fdf163454ef8), [`9470502`](https://github.com/LedgerHQ/ledger-live/commit/947050267c2733e7d0087865d2e9b29edf7f6413), [`b6bb5b5`](https://github.com/LedgerHQ/ledger-live/commit/b6bb5b537c4536890ca1959357cad1ea2ad5f5d5), [`f0f10ca`](https://github.com/LedgerHQ/ledger-live/commit/f0f10cae65f1e2015afbac540ecdcd01548356a8), [`55b7e6d`](https://github.com/LedgerHQ/ledger-live/commit/55b7e6d50aa1e97da3b1ae3405263e99b5fe5bde), [`8003387`](https://github.com/LedgerHQ/ledger-live/commit/80033873ea4628cbf9af189c313f73d54b422fb2), [`4c333ad`](https://github.com/LedgerHQ/ledger-live/commit/4c333ad80187596319d6e0042af331770fc1858e)]:
  - @domain/entity-contact@0.8.0-next.0
  - @features/platform-contacts@0.4.0-next.0

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->

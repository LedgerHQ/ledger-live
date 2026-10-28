# @features/flow-contacts-add-address

## 0.8.0-next.0

### Minor Changes

- [#23973](https://github.com/LedgerHQ/ledger-live/pull/23973) [`57c72ac`](https://github.com/LedgerHQ/ledger-live/commit/57c72ac92d3c9352b751b21bb96d64f19a2b6cb1) Thanks [@ysitbon](https://github.com/ysitbon)! - Every `@features/platform-contacts` component has one props contract on both platforms. `ContactConfirmationDialog` replaces `ContactConfirmationBottomSheet` on mobile and takes a `tone` (`destructive` or `neutral`), `isConfirming` and `testID`; it reads the sheet's bottom inset itself. `ContactAvatar` takes `testID` instead of `testId` and drops `ariaLabel`, `ContactNameInput` calls `onChangeName`, and `ContactNameDisclaimer` now renders on mobile too. The `.` entry has no `react-native` condition, `./native` is gone, and `./web` exports only `getPastedValue`.

- [#23504](https://github.com/LedgerHQ/ledger-live/pull/23504) [`93e9617`](https://github.com/LedgerHQ/ledger-live/commit/93e961762f1c06f8ed3b6de447e3c61f35945d6d) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Refactor the add-address flow view model to use a typed reducer for flow state transitions

### Patch Changes

- Updated dependencies [[`e3e0f3a`](https://github.com/LedgerHQ/ledger-live/commit/e3e0f3a5fefbdcf08c8c16d7dc2a3d9f6a6922e0), [`08730f5`](https://github.com/LedgerHQ/ledger-live/commit/08730f575a9ec7d9887f9b64ebf492a6d44ac6e8), [`9a1198f`](https://github.com/LedgerHQ/ledger-live/commit/9a1198fd10a67e2893163985b884c7437b4d036a), [`57c72ac`](https://github.com/LedgerHQ/ledger-live/commit/57c72ac92d3c9352b751b21bb96d64f19a2b6cb1), [`2a7ae74`](https://github.com/LedgerHQ/ledger-live/commit/2a7ae7400258f13f2daa1b6fe63149ae7748aaaa), [`067b492`](https://github.com/LedgerHQ/ledger-live/commit/067b492cafa20166ce080344b7cb2d6c71f43301)]:
  - @domain/entity-currency-crypto@0.17.0-next.0
  - @shared/linking@0.4.0-next.0
  - @features/platform-contacts@0.12.0-next.0
  - @domain/entity-contact@0.12.2-next.0
  - @domain/entity-currency-token@0.5.7-next.0
  - @shared/i18n@0.2.0

## 0.7.0

### Minor Changes

- [#23407](https://github.com/LedgerHQ/ledger-live/pull/23407) [`de8fe99`](https://github.com/LedgerHQ/ledger-live/commit/de8fe99f01d9d6248437fc8a914f12fc83d6e470) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Resolve Add address copy inside the package with @shared/i18n

### Patch Changes

- Updated dependencies [[`d6ab47c`](https://github.com/LedgerHQ/ledger-live/commit/d6ab47c28339866ad88ef0deba75d314c2f6c4f0), [`393a02a`](https://github.com/LedgerHQ/ledger-live/commit/393a02a42be9f0410b75c0c34203915bcde27e43), [`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c), [`7da1ea9`](https://github.com/LedgerHQ/ledger-live/commit/7da1ea9534a1bdde063e31545363a27f0fdf5abb), [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574), [`75498cf`](https://github.com/LedgerHQ/ledger-live/commit/75498cf55065bccf17d09b780866ae031c01701a), [`ad58765`](https://github.com/LedgerHQ/ledger-live/commit/ad58765b6151457022f8587d6ddcad3325ce96ac), [`4fd1ebc`](https://github.com/LedgerHQ/ledger-live/commit/4fd1ebc94718ead589f235824f0440803341feb9), [`37a49df`](https://github.com/LedgerHQ/ledger-live/commit/37a49df18649912157d8f269c3b4153d54b7817e)]:
  - @domain/entity-currency-crypto@0.16.0
  - @features/platform-contacts@0.11.0
  - @domain/entity-contact@0.12.1
  - @domain/entity-currency-token@0.5.6

## 0.7.0-next.0

### Minor Changes

- [#23407](https://github.com/LedgerHQ/ledger-live/pull/23407) [`de8fe99`](https://github.com/LedgerHQ/ledger-live/commit/de8fe99f01d9d6248437fc8a914f12fc83d6e470) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Resolve Add address copy inside the package with @shared/i18n

### Patch Changes

- Updated dependencies [[`d6ab47c`](https://github.com/LedgerHQ/ledger-live/commit/d6ab47c28339866ad88ef0deba75d314c2f6c4f0), [`393a02a`](https://github.com/LedgerHQ/ledger-live/commit/393a02a42be9f0410b75c0c34203915bcde27e43), [`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c), [`7da1ea9`](https://github.com/LedgerHQ/ledger-live/commit/7da1ea9534a1bdde063e31545363a27f0fdf5abb), [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574), [`75498cf`](https://github.com/LedgerHQ/ledger-live/commit/75498cf55065bccf17d09b780866ae031c01701a), [`ad58765`](https://github.com/LedgerHQ/ledger-live/commit/ad58765b6151457022f8587d6ddcad3325ce96ac), [`4fd1ebc`](https://github.com/LedgerHQ/ledger-live/commit/4fd1ebc94718ead589f235824f0440803341feb9), [`37a49df`](https://github.com/LedgerHQ/ledger-live/commit/37a49df18649912157d8f269c3b4153d54b7817e)]:
  - @domain/entity-currency-crypto@0.16.0-next.0
  - @features/platform-contacts@0.11.0-next.0
  - @domain/entity-contact@0.12.1-next.0
  - @domain/entity-currency-token@0.5.6-next.0

## 0.6.2

### Patch Changes

- Updated dependencies [[`4101467`](https://github.com/LedgerHQ/ledger-live/commit/4101467e60d17f1facfae9c71e5b684bcf9f48e3), [`8376d49`](https://github.com/LedgerHQ/ledger-live/commit/8376d497d552cd4644e806afdfbd5323bf10a695), [`87de6a7`](https://github.com/LedgerHQ/ledger-live/commit/87de6a72f75df73aab99da6c420de00004bf7692), [`7a2505b`](https://github.com/LedgerHQ/ledger-live/commit/7a2505bd21cc2401e1e887cb5b9713281cb11519), [`90e805d`](https://github.com/LedgerHQ/ledger-live/commit/90e805d9c1b0ef536d1e53489c73b88056731993), [`8783545`](https://github.com/LedgerHQ/ledger-live/commit/87835456704c2322a25339ef27ef92a320d02025), [`6f2ecf8`](https://github.com/LedgerHQ/ledger-live/commit/6f2ecf89dd1d978038f573738d6e85fe1805b5d9)]:
  - @domain/entity-contact@0.12.0
  - @features/platform-contacts@0.10.0
  - @domain/entity-currency-crypto@0.15.0
  - @domain/entity-currency-token@0.5.5
  - @shared/linking@0.3.0

## 0.6.2-next.0

### Patch Changes

- Updated dependencies [[`4101467`](https://github.com/LedgerHQ/ledger-live/commit/4101467e60d17f1facfae9c71e5b684bcf9f48e3), [`8376d49`](https://github.com/LedgerHQ/ledger-live/commit/8376d497d552cd4644e806afdfbd5323bf10a695), [`87de6a7`](https://github.com/LedgerHQ/ledger-live/commit/87de6a72f75df73aab99da6c420de00004bf7692), [`7a2505b`](https://github.com/LedgerHQ/ledger-live/commit/7a2505bd21cc2401e1e887cb5b9713281cb11519), [`90e805d`](https://github.com/LedgerHQ/ledger-live/commit/90e805d9c1b0ef536d1e53489c73b88056731993), [`8783545`](https://github.com/LedgerHQ/ledger-live/commit/87835456704c2322a25339ef27ef92a320d02025), [`6f2ecf8`](https://github.com/LedgerHQ/ledger-live/commit/6f2ecf89dd1d978038f573738d6e85fe1805b5d9)]:
  - @domain/entity-contact@0.12.0-next.0
  - @features/platform-contacts@0.10.0-next.0
  - @domain/entity-currency-crypto@0.15.0-next.0
  - @domain/entity-currency-token@0.5.5-next.0
  - @shared/linking@0.3.0

## 0.6.1

### Patch Changes

- Updated dependencies [[`d5dfa07`](https://github.com/LedgerHQ/ledger-live/commit/d5dfa072c9a724609119c06622004d76a45414d9), [`6e76dda`](https://github.com/LedgerHQ/ledger-live/commit/6e76ddac6370bb60b17971679a857fae7ca83eb9), [`f1d8aac`](https://github.com/LedgerHQ/ledger-live/commit/f1d8aac1c7c0bc0be9beb1508c1a9ef3cf7affae), [`33b4952`](https://github.com/LedgerHQ/ledger-live/commit/33b4952ef04d4e0528d2735ba299b4a8073e447e), [`e9af9cb`](https://github.com/LedgerHQ/ledger-live/commit/e9af9cb415b3ba4038d13ffc2dca7edb0432c830), [`dfd53ad`](https://github.com/LedgerHQ/ledger-live/commit/dfd53adbf0815e2a62f59c1e996bd709bd710ea0), [`c63d0fa`](https://github.com/LedgerHQ/ledger-live/commit/c63d0fa3ad6f181beb5d8ea7b2ef474d82fd1ed7), [`9e54487`](https://github.com/LedgerHQ/ledger-live/commit/9e5448750d57eb92f95ef828b55d80eedd826323), [`a896fca`](https://github.com/LedgerHQ/ledger-live/commit/a896fca1974a46f10e915d1212e0947e2d808ad5)]:
  - @domain/entity-contact@0.11.0
  - @features/platform-contacts@0.9.0
  - @domain/entity-currency-crypto@0.14.0
  - @domain/entity-currency-token@0.5.4

## 0.6.1-next.2

### Patch Changes

- Updated dependencies []:
  - @features/platform-contacts@0.9.0-next.2

## 0.6.1-next.1

### Patch Changes

- Updated dependencies [[`d5dfa07`](https://github.com/LedgerHQ/ledger-live/commit/d5dfa072c9a724609119c06622004d76a45414d9)]:
  - @domain/entity-contact@0.11.0-next.1
  - @features/platform-contacts@0.9.0-next.1

## 0.6.1-next.0

### Patch Changes

- Updated dependencies [[`6e76dda`](https://github.com/LedgerHQ/ledger-live/commit/6e76ddac6370bb60b17971679a857fae7ca83eb9), [`f1d8aac`](https://github.com/LedgerHQ/ledger-live/commit/f1d8aac1c7c0bc0be9beb1508c1a9ef3cf7affae), [`33b4952`](https://github.com/LedgerHQ/ledger-live/commit/33b4952ef04d4e0528d2735ba299b4a8073e447e), [`e9af9cb`](https://github.com/LedgerHQ/ledger-live/commit/e9af9cb415b3ba4038d13ffc2dca7edb0432c830), [`dfd53ad`](https://github.com/LedgerHQ/ledger-live/commit/dfd53adbf0815e2a62f59c1e996bd709bd710ea0), [`c63d0fa`](https://github.com/LedgerHQ/ledger-live/commit/c63d0fa3ad6f181beb5d8ea7b2ef474d82fd1ed7), [`9e54487`](https://github.com/LedgerHQ/ledger-live/commit/9e5448750d57eb92f95ef828b55d80eedd826323), [`a896fca`](https://github.com/LedgerHQ/ledger-live/commit/a896fca1974a46f10e915d1212e0947e2d808ad5)]:
  - @features/platform-contacts@0.9.0-next.0
  - @domain/entity-currency-crypto@0.14.0-next.0
  - @domain/entity-contact@0.10.1-next.0
  - @domain/entity-currency-token@0.5.4-next.0

## 0.6.0

### Minor Changes

- [#21747](https://github.com/LedgerHQ/ledger-live/pull/21747) [`871e485`](https://github.com/LedgerHQ/ledger-live/commit/871e4854284a0b21e31b53ff0ac312010093d914) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix keyboard handling in the mobile Contacts add, edit, and send flows. Input sheets now open at full height with the keyboard, primary actions remain visible in a keyboard-aware `QueuedBottomSheet` footer, and name fields focus immediately and capitalize each word.

### Patch Changes

- Updated dependencies [[`871e485`](https://github.com/LedgerHQ/ledger-live/commit/871e4854284a0b21e31b53ff0ac312010093d914), [`98e3038`](https://github.com/LedgerHQ/ledger-live/commit/98e303872684da47feca343c0db7d83fcce857b2), [`33e92e8`](https://github.com/LedgerHQ/ledger-live/commit/33e92e8f074ff73a6a3e338c8313ba8bc9066ccf), [`0651158`](https://github.com/LedgerHQ/ledger-live/commit/0651158a2f03f819c2e2770ef4179901768c3c6c), [`cb866e1`](https://github.com/LedgerHQ/ledger-live/commit/cb866e1c07252a07fa991abd3dc2d8df68960256)]:
  - @features/platform-contacts@0.8.0
  - @domain/entity-currency-crypto@0.13.0
  - @domain/entity-contact@0.10.0
  - @shared/linking@0.3.0
  - @domain/entity-currency-token@0.5.3

## 0.6.0-next.1

### Patch Changes

- Updated dependencies []:
  - @features/platform-contacts@0.8.0-next.1

## 0.6.0-next.0

### Minor Changes

- [#21747](https://github.com/LedgerHQ/ledger-live/pull/21747) [`871e485`](https://github.com/LedgerHQ/ledger-live/commit/871e4854284a0b21e31b53ff0ac312010093d914) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix keyboard handling in the mobile Contacts add, edit, and send flows. Input sheets now open at full height with the keyboard, primary actions remain visible in a keyboard-aware `QueuedBottomSheet` footer, and name fields focus immediately and capitalize each word.

### Patch Changes

- Updated dependencies [[`871e485`](https://github.com/LedgerHQ/ledger-live/commit/871e4854284a0b21e31b53ff0ac312010093d914), [`98e3038`](https://github.com/LedgerHQ/ledger-live/commit/98e303872684da47feca343c0db7d83fcce857b2), [`33e92e8`](https://github.com/LedgerHQ/ledger-live/commit/33e92e8f074ff73a6a3e338c8313ba8bc9066ccf), [`0651158`](https://github.com/LedgerHQ/ledger-live/commit/0651158a2f03f819c2e2770ef4179901768c3c6c), [`cb866e1`](https://github.com/LedgerHQ/ledger-live/commit/cb866e1c07252a07fa991abd3dc2d8df68960256)]:
  - @features/platform-contacts@0.8.0-next.0
  - @domain/entity-currency-crypto@0.13.0-next.0
  - @domain/entity-contact@0.10.0-next.0
  - @shared/linking@0.3.0-next.0
  - @domain/entity-currency-token@0.5.3-next.0

## 0.5.0

### Minor Changes

- [#21706](https://github.com/LedgerHQ/ledger-live/pull/21706) [`96a1ca9`](https://github.com/LedgerHQ/ledger-live/commit/96a1ca9fef1b0acc8113708c148890054dea143d) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add excludedCurrencyIds param to lwdContacts and lwmContacts feature flags to exclude specific currencies from Contacts

- [#21931](https://github.com/LedgerHQ/ledger-live/pull/21931) [`e8fa868`](https://github.com/LedgerHQ/ledger-live/commit/e8fa86874942249a54884353c6c1b070af80d4b1) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add privacy policy disclaimer link to contacts add address flow on desktop and mobile

### Patch Changes

- Updated dependencies [[`16a454f`](https://github.com/LedgerHQ/ledger-live/commit/16a454fa79be46df6aec3c50ad40407f36dfdea9), [`96a1ca9`](https://github.com/LedgerHQ/ledger-live/commit/96a1ca9fef1b0acc8113708c148890054dea143d), [`632dd93`](https://github.com/LedgerHQ/ledger-live/commit/632dd9368616a97581d037f1503b2b16f567c02a), [`5b60a96`](https://github.com/LedgerHQ/ledger-live/commit/5b60a968d3292b3897380f2c74c472a51b81e35d), [`e31a99e`](https://github.com/LedgerHQ/ledger-live/commit/e31a99e0c1a5449aa1ab8729130e1d123b1ffdad)]:
  - @features/platform-contacts@0.7.0
  - @domain/entity-contact@0.9.0
  - @shared/platform-linking@0.2.0

## 0.5.0-next.0

### Minor Changes

- [#21706](https://github.com/LedgerHQ/ledger-live/pull/21706) [`96a1ca9`](https://github.com/LedgerHQ/ledger-live/commit/96a1ca9fef1b0acc8113708c148890054dea143d) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add excludedCurrencyIds param to lwdContacts and lwmContacts feature flags to exclude specific currencies from Contacts

- [#21931](https://github.com/LedgerHQ/ledger-live/pull/21931) [`e8fa868`](https://github.com/LedgerHQ/ledger-live/commit/e8fa86874942249a54884353c6c1b070af80d4b1) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add privacy policy disclaimer link to contacts add address flow on desktop and mobile

### Patch Changes

- Updated dependencies [[`16a454f`](https://github.com/LedgerHQ/ledger-live/commit/16a454fa79be46df6aec3c50ad40407f36dfdea9), [`96a1ca9`](https://github.com/LedgerHQ/ledger-live/commit/96a1ca9fef1b0acc8113708c148890054dea143d), [`632dd93`](https://github.com/LedgerHQ/ledger-live/commit/632dd9368616a97581d037f1503b2b16f567c02a), [`5b60a96`](https://github.com/LedgerHQ/ledger-live/commit/5b60a968d3292b3897380f2c74c472a51b81e35d), [`e31a99e`](https://github.com/LedgerHQ/ledger-live/commit/e31a99e0c1a5449aa1ab8729130e1d123b1ffdad)]:
  - @features/platform-contacts@0.7.0-next.0
  - @domain/entity-contact@0.9.0-next.0
  - @shared/platform-linking@0.2.0-next.0

## 0.4.0

### Minor Changes

- [#21431](https://github.com/LedgerHQ/ledger-live/pull/21431) [`c06bd2e`](https://github.com/LedgerHQ/ledger-live/commit/c06bd2ee99e9d76609d628a41698a16c37a0c0c7) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix the extra left padding on the address field of the Mobile add address and edit address drawers. Both screens render the address without the "To:" prefix, but Lumen's AddressInput mounts its prefix even when empty, so the prefix still took a slot in the field's inner gap and pushed the address 8px to the right. Add address now drops that gap and keeps the spacing only between the address and the trailing QR code icon, and edit address, which has no trailing icon, uses a plain TextInput instead.

- [#21440](https://github.com/LedgerHQ/ledger-live/pull/21440) [`0089a4b`](https://github.com/LedgerHQ/ledger-live/commit/0089a4b80512c2c8f8eb3a03b9e3245492380647) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Drive Contacts add-address confirmation through the Device Intent Executor instead of mocked Continue screens, including prefill and Send entry points.

- [#21430](https://github.com/LedgerHQ/ledger-live/pull/21430) [`5b546c5`](https://github.com/LedgerHQ/ledger-live/commit/5b546c55ca622f74ae06b867c5118e19009f80a5) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Remove unused PrefillAddAddressFlowRoot and the shared prefill listener store. Send now owns the prefilled add-address session via startWithPrefilled.

### Patch Changes

- Updated dependencies [[`5b79eb3`](https://github.com/LedgerHQ/ledger-live/commit/5b79eb3c5b1e2e7aca86fb0a8c4b7af085e57f9d), [`0089a4b`](https://github.com/LedgerHQ/ledger-live/commit/0089a4b80512c2c8f8eb3a03b9e3245492380647), [`9672658`](https://github.com/LedgerHQ/ledger-live/commit/967265820c38ad0b2f8f45fd0a892ca07c58d23a), [`a55d4ca`](https://github.com/LedgerHQ/ledger-live/commit/a55d4ca3a804f6ab27f039926255f2c410ef7221), [`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d), [`2d42e64`](https://github.com/LedgerHQ/ledger-live/commit/2d42e647d55f79cf2eb821ec30a232cc07891219), [`b7d0367`](https://github.com/LedgerHQ/ledger-live/commit/b7d03671db1aa022d3ff375465c7d8470bf2b215), [`a9e389f`](https://github.com/LedgerHQ/ledger-live/commit/a9e389fc59ca30abf53d0ba8decc6290752ba1db), [`08ae9c2`](https://github.com/LedgerHQ/ledger-live/commit/08ae9c2bf7b2b509fa23d9b4bf33360f18f7f39f)]:
  - @features/platform-contacts@0.6.0
  - @domain/entity-currency-crypto@0.12.0
  - @domain/entity-contact@0.8.2
  - @domain/entity-currency-token@0.5.2

## 0.4.0-next.1

### Patch Changes

- Updated dependencies []:
  - @features/platform-contacts@0.6.0-next.1

## 0.4.0-next.0

### Minor Changes

- [#21431](https://github.com/LedgerHQ/ledger-live/pull/21431) [`c06bd2e`](https://github.com/LedgerHQ/ledger-live/commit/c06bd2ee99e9d76609d628a41698a16c37a0c0c7) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix the extra left padding on the address field of the Mobile add address and edit address drawers. Both screens render the address without the "To:" prefix, but Lumen's AddressInput mounts its prefix even when empty, so the prefix still took a slot in the field's inner gap and pushed the address 8px to the right. Add address now drops that gap and keeps the spacing only between the address and the trailing QR code icon, and edit address, which has no trailing icon, uses a plain TextInput instead.

- [#21440](https://github.com/LedgerHQ/ledger-live/pull/21440) [`0089a4b`](https://github.com/LedgerHQ/ledger-live/commit/0089a4b80512c2c8f8eb3a03b9e3245492380647) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Drive Contacts add-address confirmation through the Device Intent Executor instead of mocked Continue screens, including prefill and Send entry points.

- [#21430](https://github.com/LedgerHQ/ledger-live/pull/21430) [`5b546c5`](https://github.com/LedgerHQ/ledger-live/commit/5b546c55ca622f74ae06b867c5118e19009f80a5) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Remove unused PrefillAddAddressFlowRoot and the shared prefill listener store. Send now owns the prefilled add-address session via startWithPrefilled.

### Patch Changes

- Updated dependencies [[`5b79eb3`](https://github.com/LedgerHQ/ledger-live/commit/5b79eb3c5b1e2e7aca86fb0a8c4b7af085e57f9d), [`0089a4b`](https://github.com/LedgerHQ/ledger-live/commit/0089a4b80512c2c8f8eb3a03b9e3245492380647), [`9672658`](https://github.com/LedgerHQ/ledger-live/commit/967265820c38ad0b2f8f45fd0a892ca07c58d23a), [`a55d4ca`](https://github.com/LedgerHQ/ledger-live/commit/a55d4ca3a804f6ab27f039926255f2c410ef7221), [`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d), [`2d42e64`](https://github.com/LedgerHQ/ledger-live/commit/2d42e647d55f79cf2eb821ec30a232cc07891219), [`b7d0367`](https://github.com/LedgerHQ/ledger-live/commit/b7d03671db1aa022d3ff375465c7d8470bf2b215), [`a9e389f`](https://github.com/LedgerHQ/ledger-live/commit/a9e389fc59ca30abf53d0ba8decc6290752ba1db), [`08ae9c2`](https://github.com/LedgerHQ/ledger-live/commit/08ae9c2bf7b2b509fa23d9b4bf33360f18f7f39f)]:
  - @features/platform-contacts@0.6.0-next.0
  - @domain/entity-currency-crypto@0.12.0-next.0
  - @domain/entity-contact@0.8.2-next.0
  - @domain/entity-currency-token@0.5.2-next.0

## 0.3.0

### Minor Changes

- [#21112](https://github.com/LedgerHQ/ledger-live/pull/21112) [`cdbc3ac`](https://github.com/LedgerHQ/ledger-live/commit/cdbc3acac0045ab860206e32062cc5c417d75196) Thanks [@deepyjr](https://github.com/deepyjr)! - Extract the shared Contacts Edit address journey into an independent flow package.

- [#21085](https://github.com/LedgerHQ/ledger-live/pull/21085) [`60c41bd`](https://github.com/LedgerHQ/ledger-live/commit/60c41bddad7f1d02028d237cd10fc781baf8f674) Thanks [@deepyjr](https://github.com/deepyjr)! - Fix Contacts address drawers so the confirm button stays visible above the keyboard on Android

### Patch Changes

- Updated dependencies [[`545e419`](https://github.com/LedgerHQ/ledger-live/commit/545e4191a1b059058a20f30bdd1925b7c78e682c), [`7fae8f5`](https://github.com/LedgerHQ/ledger-live/commit/7fae8f5f7f22aa84933b734266de73cd9fa8a79c), [`e6d6ed6`](https://github.com/LedgerHQ/ledger-live/commit/e6d6ed6eda460eb614680b31a42ba8067cc28d2a), [`bb44e2c`](https://github.com/LedgerHQ/ledger-live/commit/bb44e2c4f8ce29b88394b15a17f7c698cb647e74), [`31223eb`](https://github.com/LedgerHQ/ledger-live/commit/31223ebdd9335ef14a3ae8712658d17de60924e5), [`c62986b`](https://github.com/LedgerHQ/ledger-live/commit/c62986b76467651009a571d64908405988b13571), [`cef29a0`](https://github.com/LedgerHQ/ledger-live/commit/cef29a0cd39ee1a7cfb6428ae650595b4479e4d6), [`0639bea`](https://github.com/LedgerHQ/ledger-live/commit/0639bea01c594c335fb9b0604ad9ffc331936d54), [`cdbc3ac`](https://github.com/LedgerHQ/ledger-live/commit/cdbc3acac0045ab860206e32062cc5c417d75196), [`34fc080`](https://github.com/LedgerHQ/ledger-live/commit/34fc080bb0c4ec01528404dde38f7c25559ecebe), [`45ea28b`](https://github.com/LedgerHQ/ledger-live/commit/45ea28b19d1e950bf4e705388a06181a9a7543aa), [`f0f9990`](https://github.com/LedgerHQ/ledger-live/commit/f0f999034f698b4e0e35928d5cf43a365ed3fef0)]:
  - @features/platform-contacts@0.5.0
  - @domain/entity-currency-crypto@0.11.0
  - @domain/entity-contact@0.8.1
  - @domain/entity-currency-token@0.5.1

## 0.3.0-next.0

### Minor Changes

- [#21112](https://github.com/LedgerHQ/ledger-live/pull/21112) [`cdbc3ac`](https://github.com/LedgerHQ/ledger-live/commit/cdbc3acac0045ab860206e32062cc5c417d75196) Thanks [@deepyjr](https://github.com/deepyjr)! - Extract the shared Contacts Edit address journey into an independent flow package.

- [#21085](https://github.com/LedgerHQ/ledger-live/pull/21085) [`60c41bd`](https://github.com/LedgerHQ/ledger-live/commit/60c41bddad7f1d02028d237cd10fc781baf8f674) Thanks [@deepyjr](https://github.com/deepyjr)! - Fix Contacts address drawers so the confirm button stays visible above the keyboard on Android

### Patch Changes

- Updated dependencies [[`545e419`](https://github.com/LedgerHQ/ledger-live/commit/545e4191a1b059058a20f30bdd1925b7c78e682c), [`7fae8f5`](https://github.com/LedgerHQ/ledger-live/commit/7fae8f5f7f22aa84933b734266de73cd9fa8a79c), [`e6d6ed6`](https://github.com/LedgerHQ/ledger-live/commit/e6d6ed6eda460eb614680b31a42ba8067cc28d2a), [`bb44e2c`](https://github.com/LedgerHQ/ledger-live/commit/bb44e2c4f8ce29b88394b15a17f7c698cb647e74), [`31223eb`](https://github.com/LedgerHQ/ledger-live/commit/31223ebdd9335ef14a3ae8712658d17de60924e5), [`c62986b`](https://github.com/LedgerHQ/ledger-live/commit/c62986b76467651009a571d64908405988b13571), [`cef29a0`](https://github.com/LedgerHQ/ledger-live/commit/cef29a0cd39ee1a7cfb6428ae650595b4479e4d6), [`0639bea`](https://github.com/LedgerHQ/ledger-live/commit/0639bea01c594c335fb9b0604ad9ffc331936d54), [`cdbc3ac`](https://github.com/LedgerHQ/ledger-live/commit/cdbc3acac0045ab860206e32062cc5c417d75196), [`34fc080`](https://github.com/LedgerHQ/ledger-live/commit/34fc080bb0c4ec01528404dde38f7c25559ecebe), [`45ea28b`](https://github.com/LedgerHQ/ledger-live/commit/45ea28b19d1e950bf4e705388a06181a9a7543aa), [`f0f9990`](https://github.com/LedgerHQ/ledger-live/commit/f0f999034f698b4e0e35928d5cf43a365ed3fef0)]:
  - @features/platform-contacts@0.5.0-next.0
  - @domain/entity-currency-crypto@0.11.0-next.0
  - @domain/entity-contact@0.8.1-next.0
  - @domain/entity-currency-token@0.5.1-next.0

## 0.2.0

### Minor Changes

- [#20910](https://github.com/LedgerHQ/ledger-live/pull/20910) [`a86fe14`](https://github.com/LedgerHQ/ledger-live/commit/a86fe1498de34b86c2a89077a02886a26c6e158a) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add a prefilled Add Address flow that bypasses the Modular Asset Drawer, with a name-only Desktop naming step and a dedicated review step, while keeping the existing MAD path unchanged.

- [#20673](https://github.com/LedgerHQ/ledger-live/pull/20673) [`f0f10ca`](https://github.com/LedgerHQ/ledger-live/commit/f0f10cae65f1e2015afbac540ecdcd01548356a8) Thanks [@deepyjr](https://github.com/deepyjr)! - Extract the Contacts Add address flow and centralize shared Contacts configuration in Platform Contacts.

- [#20972](https://github.com/LedgerHQ/ledger-live/pull/20972) [`4c333ad`](https://github.com/LedgerHQ/ledger-live/commit/4c333ad80187596319d6e0042af331770fc1858e) Thanks [@deepyjr](https://github.com/deepyjr)! - Centralize dual-platform Knip configuration.

### Patch Changes

- Updated dependencies [[`f427599`](https://github.com/LedgerHQ/ledger-live/commit/f42759916771b6445544255700082ccdaa3466c4), [`5a630b2`](https://github.com/LedgerHQ/ledger-live/commit/5a630b2cb982168094177d9a3c21fdf163454ef8), [`9470502`](https://github.com/LedgerHQ/ledger-live/commit/947050267c2733e7d0087865d2e9b29edf7f6413), [`b6bb5b5`](https://github.com/LedgerHQ/ledger-live/commit/b6bb5b537c4536890ca1959357cad1ea2ad5f5d5), [`f0f10ca`](https://github.com/LedgerHQ/ledger-live/commit/f0f10cae65f1e2015afbac540ecdcd01548356a8), [`55b7e6d`](https://github.com/LedgerHQ/ledger-live/commit/55b7e6d50aa1e97da3b1ae3405263e99b5fe5bde), [`8003387`](https://github.com/LedgerHQ/ledger-live/commit/80033873ea4628cbf9af189c313f73d54b422fb2), [`4c333ad`](https://github.com/LedgerHQ/ledger-live/commit/4c333ad80187596319d6e0042af331770fc1858e)]:
  - @domain/entity-contact@0.8.0
  - @features/platform-contacts@0.4.0

## 0.2.0-next.0

### Minor Changes

- [#20910](https://github.com/LedgerHQ/ledger-live/pull/20910) [`a86fe14`](https://github.com/LedgerHQ/ledger-live/commit/a86fe1498de34b86c2a89077a02886a26c6e158a) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add a prefilled Add Address flow that bypasses the Modular Asset Drawer, with a name-only Desktop naming step and a dedicated review step, while keeping the existing MAD path unchanged.

- [#20673](https://github.com/LedgerHQ/ledger-live/pull/20673) [`f0f10ca`](https://github.com/LedgerHQ/ledger-live/commit/f0f10cae65f1e2015afbac540ecdcd01548356a8) Thanks [@deepyjr](https://github.com/deepyjr)! - Extract the Contacts Add address flow and centralize shared Contacts configuration in Platform Contacts.

- [#20972](https://github.com/LedgerHQ/ledger-live/pull/20972) [`4c333ad`](https://github.com/LedgerHQ/ledger-live/commit/4c333ad80187596319d6e0042af331770fc1858e) Thanks [@deepyjr](https://github.com/deepyjr)! - Centralize dual-platform Knip configuration.

### Patch Changes

- Updated dependencies [[`f427599`](https://github.com/LedgerHQ/ledger-live/commit/f42759916771b6445544255700082ccdaa3466c4), [`5a630b2`](https://github.com/LedgerHQ/ledger-live/commit/5a630b2cb982168094177d9a3c21fdf163454ef8), [`9470502`](https://github.com/LedgerHQ/ledger-live/commit/947050267c2733e7d0087865d2e9b29edf7f6413), [`b6bb5b5`](https://github.com/LedgerHQ/ledger-live/commit/b6bb5b537c4536890ca1959357cad1ea2ad5f5d5), [`f0f10ca`](https://github.com/LedgerHQ/ledger-live/commit/f0f10cae65f1e2015afbac540ecdcd01548356a8), [`55b7e6d`](https://github.com/LedgerHQ/ledger-live/commit/55b7e6d50aa1e97da3b1ae3405263e99b5fe5bde), [`8003387`](https://github.com/LedgerHQ/ledger-live/commit/80033873ea4628cbf9af189c313f73d54b422fb2), [`4c333ad`](https://github.com/LedgerHQ/ledger-live/commit/4c333ad80187596319d6e0042af331770fc1858e)]:
  - @domain/entity-contact@0.8.0-next.0
  - @features/platform-contacts@0.4.0-next.0

# live-mobile

## 3.5.0-nightly.4

### Patch Changes

- [#718](https://github.com/LedgerHQ/ledger-live/pull/718) [`14245392b`](https://github.com/LedgerHQ/ledger-live/commit/14245392b30d6ece427bdcbe5bce3aab6ec80dd4) Thanks [@grsoares21](https://github.com/grsoares21)! - Fix the error wording for users trying to update the firmware via bluetooth

## 3.5.0-nightly.3

### Patch Changes

- [#737](https://github.com/LedgerHQ/ledger-live/pull/737) [`8ee5ab993`](https://github.com/LedgerHQ/ledger-live/commit/8ee5ab9937b2abba6837684933dde266a09811cd) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Fix missing import in NFTViewer

## 3.5.0-nightly.2

### Minor Changes

- [#703](https://github.com/LedgerHQ/ledger-live/pull/703) [`aabfe4950`](https://github.com/LedgerHQ/ledger-live/commit/aabfe495061dbf7169945e77c7adb5fdccef6114) Thanks [@mehulcs](https://github.com/mehulcs)! - Rewards balance info banner for Cardanno currency

### Patch Changes

- Updated dependencies [[`aa2794813`](https://github.com/LedgerHQ/ledger-live/commit/aa2794813c05b1b39272814cc803cd662662584c)]:
  - @ledgerhq/live-common@24.1.1-nightly.2

## 3.4.2-nightly.1

### Patch Changes

- Updated dependencies [[`331794cfb`](https://github.com/LedgerHQ/ledger-live/commit/331794cfbdb901f9224fed759c57f419861ec364)]:
  - @ledgerhq/live-common@24.1.1-nightly.1

## 3.4.2-nightly.0

### Patch Changes

- [#633](https://github.com/LedgerHQ/ledger-live/pull/633) [`50fd2243e`](https://github.com/LedgerHQ/ledger-live/commit/50fd2243e0c867c71da2b51387de2f9dc0b32f18) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Integration of storyly-react-native (Storyly SDK)

* [#435](https://github.com/LedgerHQ/ledger-live/pull/435) [`8319ff45a`](https://github.com/LedgerHQ/ledger-live/commit/8319ff45a8dbcdac691097d2ad2039430d18ab87) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - - Upgraded `react-native` to `0.68.2`, following [this guide](https://react-native-community.github.io/upgrade-helper/?from=0.67.3&to=0.68.2) and picked what works for us:
  - we don't upgrade Flipper as it crashes on runtime
  - we don't upgrade gradle as it builds fine like this and v7 didn't work out of the box
  - we don't keep `react-native-gradle-plugin` as it's only necessary for the new architecture..
  - we don't change `AppDelegate.m` to the new `AppDelegate.mm` as it's only useful for the new RN arch which we aren't using yet + it was a pain to migrate the existing config (Firebase, Flipper, splash screen)
  - Upgraded `react-native-reanimated` to `2.8.0`
  - Upgraded `lottie-react-native` to `5.1.3` as it was not building on iOS without upgrading -> I tested the device lotties in the "Debug Lottie" menu and it seems to work fine.
  - Upgraded `react-native-gesture-handler` to `2.5.0` & [Migrating off RNGHEnabledRootView](https://docs.swmansion.com/react-native-gesture-handler/docs/guides/migrating-off-rnghenabledroot) as its setup on Android (in `MainActivity.java`) might conflict with react-native stuff later on
  - Fixed an issue in the portfolio where if there was no assets, scrolling was crashing the app on iOS. This is a mysterious issue and the logs are similar to this issue https://github.com/software-mansion/react-native-reanimated/issues/2285, for now it has been solved by removing the animation of a border width (border which anyway was invisible so the animation was pointless).
* Updated dependencies [[`2de4b99c0`](https://github.com/LedgerHQ/ledger-live/commit/2de4b99c0c36766474d5ea037615f9f69942e905)]:
  - @ledgerhq/live-common@24.1.1-nightly.0

## 3.4.1

### Patch Changes

- [#642](https://github.com/LedgerHQ/ledger-live/pull/642) [`fbb61657d`](https://github.com/LedgerHQ/ledger-live/commit/fbb61657d1204174c31dc37c716e5c837617b60f) Thanks [@porenes](https://github.com/porenes)! - Adding [ L ] Market to the Mobile Discover Landing

## 3.4.1-hotfix.0

### Patch Changes

- [#642](https://github.com/LedgerHQ/ledger-live/pull/642) [`fbb61657d`](https://github.com/LedgerHQ/ledger-live/commit/fbb61657d1204174c31dc37c716e5c837617b60f) Thanks [@porenes](https://github.com/porenes)! - Adding [ L ] Market to the Mobile Discover Landing

## 3.4.0

### Minor Changes

- [#582](https://github.com/LedgerHQ/ledger-live/pull/582) [`8aefbac63`](https://github.com/LedgerHQ/ledger-live/commit/8aefbac63188f72e8c3f6655b2f91fc45bf16004) Thanks [@nparigi-ledger](https://github.com/nparigi-ledger)! - Refresh segment identify to take in account satisfaction user property change

### Patch Changes

- [#574](https://github.com/LedgerHQ/ledger-live/pull/574) [`6a5c9caf4`](https://github.com/LedgerHQ/ledger-live/commit/6a5c9caf4ff5b16830fff254be2b01e427073375) Thanks [@github-actions](https://github.com/apps/github-actions)! - Merge hotfix - Fix deeplinking logic to platform (cold app start deeplink, experimental & private apps always accessible)

* [#562](https://github.com/LedgerHQ/ledger-live/pull/562) [`41aa44fde`](https://github.com/LedgerHQ/ledger-live/commit/41aa44fde2ca4e0d127f82e622c4cdb3e96cfa90) Thanks [@nparigi-ledger](https://github.com/nparigi-ledger)! - Empty analytics overlay when activating it

- [#592](https://github.com/LedgerHQ/ledger-live/pull/592) [`593cd6bc1`](https://github.com/LedgerHQ/ledger-live/commit/593cd6bc1dd146e99c7966aa03a9a20cac5af46a) Thanks [@Justkant](https://github.com/Justkant)! - fix: Inline app install not working [LIVE-2851]

* [#391](https://github.com/LedgerHQ/ledger-live/pull/391) [`d9689451e`](https://github.com/LedgerHQ/ledger-live/commit/d9689451efe39fd7333aafb9aff12df1702e88db) Thanks [@grsoares21](https://github.com/grsoares21)! - Fix bug when navigating to the Manager screen without params

- [#568](https://github.com/LedgerHQ/ledger-live/pull/568) [`2f0f22075`](https://github.com/LedgerHQ/ledger-live/commit/2f0f220756e1c014cb8a8ecf1d62f1a4ddccb1b0) Thanks [@Justkant](https://github.com/Justkant)! - fix: imports should use /lib and not /src

* [#466](https://github.com/LedgerHQ/ledger-live/pull/466) [`026d923ee`](https://github.com/LedgerHQ/ledger-live/commit/026d923ee078169845026a9ab8abbf7cf235599d) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - Update on Ledger Card CTA's (removed some, created one in the portfolio header)

- [#315](https://github.com/LedgerHQ/ledger-live/pull/315) [`093792ebb`](https://github.com/LedgerHQ/ledger-live/commit/093792ebb70704cfcba7f12f1511930d0cd33a05) Thanks [@jules-grenier-ledger](https://github.com/jules-grenier-ledger)! - Reborn analytics

* [#373](https://github.com/LedgerHQ/ledger-live/pull/373) [`da3320c0a`](https://github.com/LedgerHQ/ledger-live/commit/da3320c0a65d6c5479eacf14e3a93ce85a42766c) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Changing the architecture of NftMedia component

* Updated dependencies [[`60fb9efdc`](https://github.com/LedgerHQ/ledger-live/commit/60fb9efdcc9dbf72f651fd7b388d175a12bf859b), [`3969bac02`](https://github.com/LedgerHQ/ledger-live/commit/3969bac02d6028ff543e61d4b67d95a6bfb14dfe), [`414fa596a`](https://github.com/LedgerHQ/ledger-live/commit/414fa596a88aafdce676ac3fb349f41f302ea860), [`4c02cf2e0`](https://github.com/LedgerHQ/ledger-live/commit/4c02cf2e0c393ad8d9cc5339e7b63eefb297e2cb)]:
  - @ledgerhq/live-common@24.1.0

## 3.4.0-next.7

### Patch Changes

- [#574](https://github.com/LedgerHQ/ledger-live/pull/574) [`6a5c9caf4`](https://github.com/LedgerHQ/ledger-live/commit/6a5c9caf4ff5b16830fff254be2b01e427073375) Thanks [@github-actions](https://github.com/apps/github-actions)! - Merge hotfix - Fix deeplinking logic to platform (cold app start deeplink, experimental & private apps always accessible)

## 3.4.0-next.6

### Patch Changes

- [#315](https://github.com/LedgerHQ/ledger-live/pull/315) [`093792ebb`](https://github.com/LedgerHQ/ledger-live/commit/093792ebb70704cfcba7f12f1511930d0cd33a05) Thanks [@jules-grenier-ledger](https://github.com/jules-grenier-ledger)! - Reborn analytics

## 3.5.0-next.5

### Patch Changes

- [#592](https://github.com/LedgerHQ/ledger-live/pull/592) [`593cd6bc1`](https://github.com/LedgerHQ/ledger-live/commit/593cd6bc1dd146e99c7966aa03a9a20cac5af46a) Thanks [@Justkant](https://github.com/Justkant)! - fix: Inline app install not working [LIVE-2851]

## 3.5.0-next.4

### Patch Changes

- [#562](https://github.com/LedgerHQ/ledger-live/pull/562) [`41aa44fde`](https://github.com/LedgerHQ/ledger-live/commit/41aa44fde2ca4e0d127f82e622c4cdb3e96cfa90) Thanks [@nparigi-ledger](https://github.com/nparigi-ledger)! - Empty analytics overlay when activating it

## 3.5.0-next.3

### Patch Changes

- Updated dependencies [[`4c02cf2e0`](https://github.com/LedgerHQ/ledger-live/commit/4c02cf2e0c393ad8d9cc5339e7b63eefb297e2cb)]:
  - @ledgerhq/live-common@24.1.0-next.1

## 3.5.0-next.2

### Patch Changes

- [#373](https://github.com/LedgerHQ/ledger-live/pull/373) [`da3320c0a`](https://github.com/LedgerHQ/ledger-live/commit/da3320c0a65d6c5479eacf14e3a93ce85a42766c) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Changing the architecture of NftMedia component

## 3.5.0-next.1

### Minor Changes

- [#582](https://github.com/LedgerHQ/ledger-live/pull/582) [`8aefbac63`](https://github.com/LedgerHQ/ledger-live/commit/8aefbac63188f72e8c3f6655b2f91fc45bf16004) Thanks [@nparigi-ledger](https://github.com/nparigi-ledger)! - Refresh segment identify to take in account satisfaction user property change

## 3.4.1-next.0

### Patch Changes

- [#391](https://github.com/LedgerHQ/ledger-live/pull/391) [`d9689451e`](https://github.com/LedgerHQ/ledger-live/commit/d9689451efe39fd7333aafb9aff12df1702e88db) Thanks [@grsoares21](https://github.com/grsoares21)! - Fix bug when navigating to the Manager screen without params

* [#568](https://github.com/LedgerHQ/ledger-live/pull/568) [`2f0f22075`](https://github.com/LedgerHQ/ledger-live/commit/2f0f220756e1c014cb8a8ecf1d62f1a4ddccb1b0) Thanks [@Justkant](https://github.com/Justkant)! - fix: imports should use /lib and not /src

- [#466](https://github.com/LedgerHQ/ledger-live/pull/466) [`026d923ee`](https://github.com/LedgerHQ/ledger-live/commit/026d923ee078169845026a9ab8abbf7cf235599d) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - Update on Ledger Card CTA's (removed some, created one in the portfolio header)

- Updated dependencies [[`60fb9efdc`](https://github.com/LedgerHQ/ledger-live/commit/60fb9efdcc9dbf72f651fd7b388d175a12bf859b), [`3969bac02`](https://github.com/LedgerHQ/ledger-live/commit/3969bac02d6028ff543e61d4b67d95a6bfb14dfe), [`414fa596a`](https://github.com/LedgerHQ/ledger-live/commit/414fa596a88aafdce676ac3fb349f41f302ea860)]:
  - @ledgerhq/live-common@24.1.0-next.0

## 3.3.2

### Patch Changes

- [#609](https://github.com/LedgerHQ/ledger-live/pull/609) [`0139d05ab`](https://github.com/LedgerHQ/ledger-live/commit/0139d05ab2adf83f49690e3b6cd93e87707f82d7) Thanks [@github-actions](https://github.com/apps/github-actions)! - Fix deeplinking logic to platform (cold app start deeplink, experimental & private apps always accessible)

## 3.3.2-hotfix.0

### Patch Changes

- [#609](https://github.com/LedgerHQ/ledger-live/pull/609) [`0139d05ab`](https://github.com/LedgerHQ/ledger-live/commit/0139d05ab2adf83f49690e3b6cd93e87707f82d7) Thanks [@github-actions](https://github.com/apps/github-actions)! - Fix deeplinking logic to platform (cold app start deeplink, experimental & private apps always accessible)

## 3.4.0

### Minor Changes

- [#385](https://github.com/LedgerHQ/ledger-live/pull/385) [`5145781e5`](https://github.com/LedgerHQ/ledger-live/commit/5145781e599fcb64be13695620988951bb805a3e) Thanks [@lambertkevin](https://github.com/lambertkevin)! - NFT counter value added on LLM and LLD with feature flagging

### Patch Changes

- [#73](https://github.com/LedgerHQ/ledger-live/pull/73) [`99cc5bbc1`](https://github.com/LedgerHQ/ledger-live/commit/99cc5bbc10d2676ad3e621577fdbcf432d1c91a2) Thanks [@chabroA](https://github.com/chabroA)! - Handle all non final (i.e: non OK nor KO) status as pending

* [#412](https://github.com/LedgerHQ/ledger-live/pull/412) [`fbc32d3e2`](https://github.com/LedgerHQ/ledger-live/commit/fbc32d3e2e229e7a3dbe71bbd8c36ed203c61e34) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - AccountGraphCard : Add rounding when using counter value (to prevent too many decimals in crypto-value)

- [#371](https://github.com/LedgerHQ/ledger-live/pull/371) [`4f43ac0e5`](https://github.com/LedgerHQ/ledger-live/commit/4f43ac0e53e090239dcdc11ae3840cf5abbf401b) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - Add back navigation to NftViewer and fixed style issues on the view

* [#336](https://github.com/LedgerHQ/ledger-live/pull/336) [`6bf75fa20`](https://github.com/LedgerHQ/ledger-live/commit/6bf75fa20e1991964948bf48c01a530a43ba03e1) Thanks [@mlegall-ledger](https://github.com/mlegall-ledger)! - Updated naming for last operations to last transactions

- [#337](https://github.com/LedgerHQ/ledger-live/pull/337) [`7bdf0091f`](https://github.com/LedgerHQ/ledger-live/commit/7bdf0091fef18d6b10e54a74a765f76798640100) Thanks [@gre](https://github.com/gre)! - (internal) Filtering more errors to NOT be reported to Sentry – typically to ignore users-specific cases

- Updated dependencies [[`99cc5bbc1`](https://github.com/LedgerHQ/ledger-live/commit/99cc5bbc10d2676ad3e621577fdbcf432d1c91a2), [`22531f3c3`](https://github.com/LedgerHQ/ledger-live/commit/22531f3c377191d56bc5d5635f1174fb32b01957), [`c5714333b`](https://github.com/LedgerHQ/ledger-live/commit/c5714333bdb1c90a29c20c7e5793184d89967142), [`d22452817`](https://github.com/LedgerHQ/ledger-live/commit/d224528174313bc4975e62d015adf928d4315620), [`5145781e5`](https://github.com/LedgerHQ/ledger-live/commit/5145781e599fcb64be13695620988951bb805a3e), [`bdc76d75f`](https://github.com/LedgerHQ/ledger-live/commit/bdc76d75f9643129384c76ac9868e160c4b52062), [`2012b5477`](https://github.com/LedgerHQ/ledger-live/commit/2012b54773b6391f353903564a247ad02be1a296), [`10440ec3c`](https://github.com/LedgerHQ/ledger-live/commit/10440ec3c2bffa7ce8636a7838680bb3501ffe0d), [`e1f2f07a2`](https://github.com/LedgerHQ/ledger-live/commit/e1f2f07a2ba1de5eab6fa10c4c800b7097c8037d), [`99cc5bbc1`](https://github.com/LedgerHQ/ledger-live/commit/99cc5bbc10d2676ad3e621577fdbcf432d1c91a2), [`1e4a5647b`](https://github.com/LedgerHQ/ledger-live/commit/1e4a5647b39c0f806bc311383b49a246fbe453eb), [`508e4c23b`](https://github.com/LedgerHQ/ledger-live/commit/508e4c23babd04c48e7b626ef4004fb55f3c1ba9), [`b1e396dd8`](https://github.com/LedgerHQ/ledger-live/commit/b1e396dd89ca2787978dc7e53b7ca865133a1961), [`e9decc277`](https://github.com/LedgerHQ/ledger-live/commit/e9decc27785fb07972460494c8ef39e92b0127a1)]:
  - @ledgerhq/live-common@24.0.0
  - @ledgerhq/native-ui@0.8.1

## 3.4.0-next.4

### Patch Changes

- Updated dependencies [[`bdc76d75f`](https://github.com/LedgerHQ/ledger-live/commit/bdc76d75f9643129384c76ac9868e160c4b52062)]:
  - @ledgerhq/live-common@24.0.0-next.4

## 3.4.0-next.3

### Minor Changes

- 5145781e5: NFT counter value added on LLM and LLD with feature flagging

### Patch Changes

- Updated dependencies [5145781e5]
  - @ledgerhq/live-common@24.0.0-next.3

## 3.3.1

### Patch Changes

- c3079243d: Exit readonly mode in multiple places where the user interacts with a device and therefore should have exited readonly mode. Fix a bug where user in "old" readonly mode would crash when pressing an account in MarketPage.
- bda266fc4: Fix an edge case where the readonly example portfolio would show up instead of the real one

## 3.3.1-hotfix.1

### Patch Changes

- bb592ab1d: Exit readonly mode in multiple places where the user interacts with a device and therefore should have exited readonly mode. Fix a bug where user in "old" readonly mode would crash when pressing an account in MarketPage.

## 3.3.1-hotfix.0

### Patch Changes

- b8dad7183: Fix an edge case where the readonly example portfolio would show up instead of the real one

## 3.3.1-next.2

### Patch Changes

- Updated dependencies [c5714333b]
  - @ledgerhq/live-common@24.0.0-next.2

## 3.3.1-next.1

### Patch Changes

- 99cc5bbc1: Handle all non final (i.e: non OK nor KO) status as pending
- Updated dependencies [99cc5bbc1]
- Updated dependencies [99cc5bbc1]
  - @ledgerhq/live-common@24.0.0-next.1

## 3.3.1-next.0

### Patch Changes

- fbc32d3e2: AccountGraphCard : Add rounding when using counter value (to prevent too many decimals in crypto-value)
- 4f43ac0e5: Add back navigation to NftViewer and fixed style issues on the view
- 6bf75fa20: Updated naming for last operations to last transactions
- 7bdf0091f: (internal) Filtering more errors to NOT be reported to Sentry – typically to ignore users-specific cases
- Updated dependencies [22531f3c3]
- Updated dependencies [d22452817]
- Updated dependencies [2012b5477]
- Updated dependencies [10440ec3c]
- Updated dependencies [e1f2f07a2]
- Updated dependencies [1e4a5647b]
- Updated dependencies [508e4c23b]
- Updated dependencies [b1e396dd8]
- Updated dependencies [e9decc277]
  - @ledgerhq/live-common@24.0.0-next.0
  - @ledgerhq/native-ui@0.8.1-next.0

## 3.3.0

### Minor Changes

- 09f79c7b4: Add Cardano to mobile
- 7ba2346a5: feat(LLM): multibuy 1.5 [LIVE-1710]
- 4db0f58ca: Updated learn feature url to be remote configurable
- bf12e0f65: feat: sell and fund flow [LIVE-784]
- d2576ef46: feat(swap): Add Changelly's Terms of Use in the confirmation screen [LIVE-1196]
- 592ad2f7b: Update design on upsell modal in mobile app. Also add new variants and shape to IconBoxList and BoxedIcon components in native UI.
- 608010c9d: Add a purchase device page embedding a webview from the ecommerce team. Also abstract webview pages logic into its own component (include Learn page's webview). Add a delayed tracking provider to send events to Adjust or Segment with an anonymised timestamp for sensible data.
- fe3c7a39c: Add Earn Rewards btn on Solana

### Patch Changes

- 3d71946fb: Fix deep linking logic for platform apps
- 27c947ba4: fix(multibuy): remove fiat filter
- 35737e057: fix(LLM): can't open custom loaded manifest on iOS [LIVE-2481]
- 95b4c2854: Fix hasOrderedNano state with Buy Nano screen
- 3d1ab8511: Behavior fixed when clicking on the "My Ledger" button on the tab bar when on read only mode
- 46994ebfd: Wording - small typos fixed
- 8a973ad0e: fix(LLM): platform manifest can be undefined when no network [LIVE-2571]
- 5bae58815: bugfix - webview reload crash issue related to ui rendering layout shift bugs
- Updated dependencies [8323d2eaa]
- Updated dependencies [bf12e0f65]
- Updated dependencies [8861c4fe0]
- Updated dependencies [592ad2f7b]
- Updated dependencies [ec5c4fa3d]
- Updated dependencies [dd6a12c9b]
- Updated dependencies [608010c9d]
- Updated dependencies [78a64769d]
- Updated dependencies [0c2c6682b]
  - @ledgerhq/live-common@23.1.0
  - @ledgerhq/native-ui@0.8.0

## 3.3.0-next.14

### Patch Changes

- 95b4c2854: Fix hasOrderedNano state with Buy Nano screen

## 3.3.0-next.13

### Patch Changes

- Updated dependencies [78a64769d]
  - @ledgerhq/live-common@23.1.0-next.4

## 3.3.0-next.12

### Patch Changes

- 5bae58815: bugfix - webview reload crash issue related to ui rendering layout shift bugs
- Updated dependencies [0c2c6682b]
  - @ledgerhq/native-ui@0.8.0-next.2

## 3.3.0-next.11

### Patch Changes

- 46994ebfd: Wording - small typos fixed

## 3.3.0-next.10

### Patch Changes

- 3d1ab8511: Behavior fixed when clicking on the "My Ledger" button on the tab bar when on read only mode

## 3.3.0-next.9

### Patch Changes

- Updated dependencies [ec5c4fa3d]
  - @ledgerhq/live-common@23.1.0-next.3

## 3.3.0-next.8

### Patch Changes

- 27c947ba4: fix(multibuy): remove fiat filter

## 3.3.0-next.7

### Minor Changes

- 7ba2346a5: feat(LLM): multibuy 1.5 [LIVE-1710]

## 3.3.0-next.6

### Minor Changes

- bf12e0f65: feat: sell and fund flow [LIVE-784]
- d2576ef46: feat(swap): Add Changelly's Terms of Use in the confirmation screen [LIVE-1196]

## 3.2.1

### Patch Changes

- fea7a4aa1: Fix bug of a conditionally called hook in the firmware retrieval

## 3.2.1-hotfix.0

### Patch Changes

- Updated dependencies [bf12e0f65]
  - @ledgerhq/live-common@23.1.0-next.2

## 3.3.0-next.5

### Patch Changes

- 3d71946fb: Fix deep linking logic for platform apps

## 3.3.0-next.4

### Minor Changes

- 4db0f58ca: Updated learn feature url to be remote configurable

## 3.3.0-next.3

### Minor Changes

- fe3c7a39c: Add Earn Rewards btn on Solana

## 3.3.0-next.2

### Minor Changes

- 09f79c7b4: Add Cardano to mobile

## 3.3.0-next.1

### Minor Changes

- 592ad2f7b: Update design on upsell modal in mobile app. Also add new variants and shape to IconBoxList and BoxedIcon components in native UI.
- 608010c9d: Add a purchase device page embedding a webview from the ecommerce team. Also abstract webview pages logic into its own component (include Learn page's webview). Add a delayed tracking provider to send events to Adjust or Segment with an anonymised timestamp for sensible data.

### Patch Changes

- Updated dependencies [592ad2f7b]
- Updated dependencies [608010c9d]
  - @ledgerhq/native-ui@0.8.0-next.1
  - @ledgerhq/live-common@23.1.0-next.1

## 3.2.1-next.0

### Patch Changes

- 35737e057: fix(LLM): can't open custom loaded manifest on iOS [LIVE-2481]
- 8a973ad0e: fix(LLM): platform manifest can be undefined when no network [LIVE-2571]
- Updated dependencies [8323d2eaa]
- Updated dependencies [8861c4fe0]
- Updated dependencies [dd6a12c9b]
  - @ledgerhq/live-common@23.1.0-next.0
  - @ledgerhq/native-ui@0.7.19-next.0

## 3.2.0

### Minor Changes

- becfc06f9: LIVE-1751 Solana staking on LLM
- d63570a38: Rework Cosmos delegation flow
- c6c127630: We now prompt a modal to ask the user what he thinks of the app at key moments (for example when receiving crypto or claiming rewards) based on some conditions (installed the app for at least x days, has at least x accounts, ...) The purpose of this feature is to increase the ratings of the app on the stores
- 8ea9c2deb: LLM: increase to iOS 13 minimum
- 64c2fdb06: Filecoin integration in LLD and LLM

### Patch Changes

- 09648db7f: refactor of the top perfs filter
- 0f59cfc10: Fix crash related to the way polkadot/crypto handles environments that lack WASM support.
- 68cb59649: Fix overlapped price on the market screen
- 9a86fe231: Fix the click on browse assets button on the market screen
- 54dbab04f: Fix Ledger logo glitch
- 71ad84023: Track in Sentry the uncaught errors thrown in the bridge transaction flow.
- 61116f39f: Disable React Navigation Sentry integration
- a26ee3f54: Fix crash related to the way polkadot/crypto handles environments that lack WASM support.
- 68cb59649: Fix overlapped price on the market screen
- 9a86fe231: Fix the click on browse assets button on the market screen
- cb5814f38: Temporarily remove some device action error tracking due to it causing a crash on iOS while offline
- 3cd734f86: Add firmware update feature for Android via OTG USB
- 54dbab04f: Fix Ledger logo glitch
- Updated dependencies [09648db7f]
- Updated dependencies [a66fbe852]
- Updated dependencies [0f59cfc10]
- Updated dependencies [8ee9c5568]
- Updated dependencies [899aa3300]
- Updated dependencies [89e82ed79]
- Updated dependencies [403ea8efe]
- Updated dependencies [98ecc6272]
- Updated dependencies [9a86fe231]
- Updated dependencies [8b2e24b6c]
- Updated dependencies [64c2fdb06]
- Updated dependencies [f686ec781]
- Updated dependencies [b688a592d]
- Updated dependencies [71ad84023]
- Updated dependencies [64c2fdb06]
  - @ledgerhq/live-common@23.0.0
  - @ledgerhq/native-ui@0.7.18
- Updated dependencies [e0c187073]
- Updated dependencies [ee44ffb17]
- Updated dependencies [3cd734f86]
- Updated dependencies [16be6e5c0]
- Updated dependencies [a26ee3f54]
- Updated dependencies [0252fab71]
- Updated dependencies [3f816efba]
- Updated dependencies [f2574d25d]
- Updated dependencies [f913f6fdb]
- Updated dependencies [403ea8efe]
- Updated dependencies [9a86fe231]

  - @ledgerhq/live-common@22.2.0
  - @ledgerhq/react-native-hid@6.28.3

## 3.2.0-llmnext.6

### Patch Changes

- Updated dependencies [16be6e5c0]
  - @ledgerhq/live-common@22.2.0-llmnext.2

## 3.2.0-llmnext.5

### Patch Changes

- a26ee3f54: Fix crash related to the way polkadot/crypto handles environments that lack WASM support.
- Updated dependencies [a26ee3f54]
  - @ledgerhq/live-common@22.2.0-llmnext.1

## 3.2.0-llmnext.4

### Patch Changes

- cb5814f3: Temporarily remove some device action error tracking due to it causing a crash on iOS while offline

## 3.2.0-llmnext.3

### Minor Changes

- c6c12763: We now prompt a modal to ask the user what he thinks of the app at key moments (for example when receiving crypto or claiming rewards) based on some conditions (installed the app for at least x days, has at least x accounts, ...) The purpose of this feature is to increase the ratings of the app on the stores

## 3.2.0-llmnext.2

### Minor Changes

- becfc06f: LIVE-1751 Solana staking on LLM
- d63570a3: Rework Cosmos delegation flow

## 3.1.3

### Patch Changes

- Updated dependencies [6bcf42ecd]
  - @ledgerhq/live-common@22.2.1

## 3.1.3-hotfix.0

### Patch Changes

- Updated dependencies [6bcf42ecd]
  - @ledgerhq/live-common@22.2.1-hotfix.0

## 3.2.0-next.4

### Patch Changes

- Updated dependencies [8b2e24b6c]
  - @ledgerhq/live-common@23.0.0-next.4

## 3.2.0-next.3

### Patch Changes

- Updated dependencies [a66fbe852]
  - @ledgerhq/live-common@23.0.0-next.3

## 3.2.0-next.2

### Patch Changes

- Updated dependencies [8ee9c5568]
  - @ledgerhq/live-common@23.0.0-next.2

## 3.2.0-next.1

### Patch Changes

- Updated dependencies [98ecc6272]
  - @ledgerhq/live-common@23.0.0-next.1

## 3.2.0-next.0

### Minor Changes

- 8ea9c2deb: LLM: increase to iOS 13 minimum
- 64c2fdb06: Filecoin integration in LLD and LLM

### Patch Changes

- 09648db7f: refactor of the top perfs filter
- 0f59cfc10: Fix crash related to the way polkadot/crypto handles environments that lack WASM support.
- 68cb59649: Fix overlapped price on the market screen
- 9a86fe231: Fix the click on browse assets button on the market screen
- 54dbab04f: Fix Ledger logo glitch
- 71ad84023: Track in Sentry the uncaught errors thrown in the bridge transaction flow.
- 61116f39f: Disable React Navigation Sentry integration
- Updated dependencies [09648db7f]
- Updated dependencies [0f59cfc10]
- Updated dependencies [899aa3300]
- Updated dependencies [89e82ed79]
- Updated dependencies [403ea8efe]
- Updated dependencies [9a86fe231]
- Updated dependencies [64c2fdb06]
- Updated dependencies [f686ec781]
- Updated dependencies [b688a592d]
- Updated dependencies [71ad84023]
- Updated dependencies [64c2fdb06]
  - @ledgerhq/live-common@23.0.0-next.0
  - @ledgerhq/native-ui@0.7.18-next.0

## 3.1.3

### Patch Changes

- Updated dependencies [6bcf42ecd]
  - @ledgerhq/live-common@22.2.1

## 3.1.3-hotfix.0

### Patch Changes

- Updated dependencies [6bcf42ecd]
  - @ledgerhq/live-common@22.2.1-hotfix.0

## 3.1.2

### Patch Changes

- Updated dependencies [e0c187073]
- Updated dependencies [ee44ffb17]
- Updated dependencies [0252fab71]
- Updated dependencies [3f816efba]
- Updated dependencies [f2574d25d]
- Updated dependencies [f913f6fdb]
- Updated dependencies [9dadffa88]
- Updated dependencies [04ad3813d]
  - @ledgerhq/live-common@22.2.0

## 3.1.2-next.2

### Patch Changes

- Updated dependencies [9dadffa88]
  - @ledgerhq/live-common@22.2.0-next.2

## 3.1.2-next.1

### Patch Changes

- Updated dependencies [04ad3813d]
  - @ledgerhq/live-common@22.2.0-next.1

## 3.1.2-next.0

### Patch Changes

- Updated dependencies [e0c18707]
- Updated dependencies [ee44ffb1]
- Updated dependencies [0252fab7]
- Updated dependencies [3f816efb]
- Updated dependencies [f2574d25]
- Updated dependencies [f913f6fd]
  - @ledgerhq/live-common@22.2.0-next.0

## 3.1.2-llmnext.1

### Patch Changes

- 3cd734f8: Add firmware update feature for Android via OTG USB
- Updated dependencies [3cd734f8]
  - @ledgerhq/react-native-hid@6.28.3-llmnext.0

## 3.1.2-llmnext.0

### Patch Changes

- 68cb59649: Fix overlapped price on the market screen
- 9a86fe231: Fix the click on browse assets button on the market screen
- 54dbab04f: Fix Ledger logo glitch
- Updated dependencies [e0c187073]
- Updated dependencies [ee44ffb17]
- Updated dependencies [0252fab71]
- Updated dependencies [3f816efba]
- Updated dependencies [f2574d25d]
- Updated dependencies [f913f6fdb]
- Updated dependencies [403ea8efe]
- Updated dependencies [9a86fe231]
  - @ledgerhq/live-common@22.2.0-llmnext.0

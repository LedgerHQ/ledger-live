# live-mobile

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

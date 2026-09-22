# @features/flow-pay-card-widget

## 0.4.0-next.0

### Minor Changes

- [#22077](https://github.com/LedgerHQ/ledger-live/pull/22077) [`72367fc`](https://github.com/LedgerHQ/ledger-live/commit/72367fcf2343fa488008236f1005da589e6e3054) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Wire the card onboarding widget to real, derived onboarding data and remove the unused stub endpoint and legacy devtool mock path it replaces

- [#22192](https://github.com/LedgerHQ/ledger-live/pull/22192) [`c22ee67`](https://github.com/LedgerHQ/ledger-live/commit/c22ee67d3e0271b382337fe4175170bdabf5dfca) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add reusable Apple/Google Pay add-to-wallet CTA, instructions, and wallet-app opening.

- [#22193](https://github.com/LedgerHQ/ledger-live/pull/22193) [`3d50917`](https://github.com/LedgerHQ/ledger-live/commit/3d50917da2e7c2177f8288bb754d41a7699f27be) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Open Apple/Google Pay add-to-wallet from card onboarding and the Pay Tab CTA.

- [#22216](https://github.com/LedgerHQ/ledger-live/pull/22216) [`cfa249c`](https://github.com/LedgerHQ/ledger-live/commit/cfa249c4c3a30f9eba1ecee1749030121da9291a) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Open Apple Wallet payment-card setup through PassKit.

- [#22218](https://github.com/LedgerHQ/ledger-live/pull/22218) [`285b50d`](https://github.com/LedgerHQ/ledger-live/commit/285b50dc311eef60089f779cffdfe14a0422d2ec) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Open Google Wallet through its launch intent, and show iOS and Android error scenes when the wallet app is unavailable, with a Play Store fallback on Android.

- [#22183](https://github.com/LedgerHQ/ledger-live/pull/22183) [`d9d1111`](https://github.com/LedgerHQ/ledger-live/commit/d9d1111733e757cc58b6249fdda568dd56d40757) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Open the provider's top up page from the card on desktop.

  - `CardTopUpButton` carries the action. On desktop it stays at the bottom of the card panel, above the scrolling content.
  - Desktop opens `/topup` on the hosted live app manifest, the way the signup page already opens.
  - A US card holder gets the US `app_id` on the query, so the page reaches the US tenant.
  - Desktop ends the provider session in the webview on each entry of the Pay tab, so a session left behind by a top up cannot sign the previous holder back in. The login and the signup drop their own wipe: every one of them starts from an entry of the Pay tab.
  - The top up button in the asset details dialog opens the same page, with the asset pre-selected on the query.

- [#22121](https://github.com/LedgerHQ/ledger-live/pull/22121) [`287f042`](https://github.com/LedgerHQ/ledger-live/commit/287f04286e4933e31e31952a3ac6485e145e34f2) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Answer the phone wallet step from the provider alone.

  - Mobile reads `cardAddedToDigitalWallet` from the card status for the onboarding step.
  - The device answer is gone: `hasAddedCardToWallet`, its two actions and its selector leave the widget state. The Add-to-Wallet CTA now hides on the provider's answer, and the instructions scene re-asks the card status instead of recording a local yes.
  - A tenant that does not send the flag leaves the step undone and keeps offering the CTA.
  - The onboarding mock gained `cardAddedToDigitalWallet`, so the dev tool's wallet toggle drives the mocked endpoint and follows request mocking like every other step.

- [#22301](https://github.com/LedgerHQ/ledger-live/pull/22301) [`6fe6efb`](https://github.com/LedgerHQ/ledger-live/commit/6fe6efb9f2c9211d6002dd17f4369f90390021bf) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Consume the shared Pay analytics provider across card flows.

### Patch Changes

- Updated dependencies [[`4d1d640`](https://github.com/LedgerHQ/ledger-live/commit/4d1d64049a0bb0562a1a0c8ad2555fe967acdd7f), [`871e485`](https://github.com/LedgerHQ/ledger-live/commit/871e4854284a0b21e31b53ff0ac312010093d914), [`72367fc`](https://github.com/LedgerHQ/ledger-live/commit/72367fcf2343fa488008236f1005da589e6e3054), [`233e44e`](https://github.com/LedgerHQ/ledger-live/commit/233e44e3dd724cc9d4f14a02c7e62e39d2e9079b), [`6741356`](https://github.com/LedgerHQ/ledger-live/commit/67413566f84b895e6f4ae2b5d646bfc2e82c6926), [`dafadf0`](https://github.com/LedgerHQ/ledger-live/commit/dafadf005a54007d5430203c11b8718c1636a6e4), [`9652494`](https://github.com/LedgerHQ/ledger-live/commit/96524949cbf8fa1d102a0156f40004ff12a30475), [`5492648`](https://github.com/LedgerHQ/ledger-live/commit/5492648988e327c8e3e6e7d5ead1e0fa2bd9929e), [`c52af21`](https://github.com/LedgerHQ/ledger-live/commit/c52af21b622efa62774657e190abb9762cffac1c), [`d0fd787`](https://github.com/LedgerHQ/ledger-live/commit/d0fd787fb0e40b35f9d9c70307694d364f99b858), [`b97a3e5`](https://github.com/LedgerHQ/ledger-live/commit/b97a3e5462588d771a2ea5d628cfef7d564bc886), [`a915d4a`](https://github.com/LedgerHQ/ledger-live/commit/a915d4a577dfe7bb778364c4b0269bc61203075a), [`eb06f77`](https://github.com/LedgerHQ/ledger-live/commit/eb06f77c9548a2e4641c37da90c34b4fcffba667), [`91531f2`](https://github.com/LedgerHQ/ledger-live/commit/91531f29e71e4e186375a5e2908ddca0c351c0ac), [`287f042`](https://github.com/LedgerHQ/ledger-live/commit/287f04286e4933e31e31952a3ac6485e145e34f2), [`6fe6efb`](https://github.com/LedgerHQ/ledger-live/commit/6fe6efb9f2c9211d6002dd17f4369f90390021bf), [`bc43337`](https://github.com/LedgerHQ/ledger-live/commit/bc433372ebed1990d81a87b109eeb4d928271315), [`43e1a21`](https://github.com/LedgerHQ/ledger-live/commit/43e1a21f2060d53875256b001e054cf0b1f7b86a)]:
  - @domain/api-card-management@0.7.0-next.0
  - @shared/ui-queued-bottom-sheet@0.5.0-next.0
  - @features/platform-pay-analytics@0.2.0-next.0
  - @features/flow-pay-card-wallets@0.4.0-next.0
  - @domain/entity-currency@0.4.4-next.0

## 0.3.0

### Minor Changes

- [#21626](https://github.com/LedgerHQ/ledger-live/pull/21626) [`eddc89e`](https://github.com/LedgerHQ/ledger-live/commit/eddc89e7b86a13aeedfc0ae4956c2dcd08494e5f) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Show and drive the derived card onboarding status from the Card / Pay devtool.

  - A "Card onboarding" screen: a `Stepper` for the count, every step by the id the app keys it on, and the derived answer printed raw so a step can be traced to the response behind it.
  - Each step a request decides carries a toggle. It sets what that endpoint answers, so the step follows on the next read and holds until it is cleared. The phone wallet step is answered on the device; the purchase step is read-only while nothing answers it.
  - An endpoint answers from the provider until its toggle is used, so one step can be held while the rest stay real, and "Use the real answers" hands them all back.
  - `@domain/api-card-management/mock/card-onboarding-status` holds those answers and the responses that carry them; the mobile MSW handlers read it before falling back to what they answered before.
  - Mocking is started by an env var, so without it the screen says so instead of offering a toggle that would set an answer nothing reads.
  - The hook gains `refresh`, which re-asks all three sources: the screen asks on open and on demand.

- [#21625](https://github.com/LedgerHQ/ledger-live/pull/21625) [`b976cda`](https://github.com/LedgerHQ/ledger-live/commit/b976cda52320ef3f778fc11b4f95d2c5bf54ffe0) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Add `useCardOnboardingStatus`, which works out where a cardholder is in onboarding.

  - Five steps: account, card, funded wallet, card in the phone's wallet, first purchase.
  - Answered by `getUser`, `getCardStatus` and the linked-wallet join; the phone wallet step from the device; the purchase step reads `false` until the transactions endpoint lands.
  - Each step is an id and a flag. Copy and icons belong to whatever renders them.
  - Mobile lists all five, desktop the four it can answer.
  - `completedCount` comes with the steps.
  - Optional `skip`, so a signed-out host holds the reads.

### Patch Changes

- Updated dependencies [[`8f62cdb`](https://github.com/LedgerHQ/ledger-live/commit/8f62cdbb6d93e207efd7e551af65a41953d28242), [`de19b3e`](https://github.com/LedgerHQ/ledger-live/commit/de19b3e4e56a0c28fcc1a3ca929059e84fc7bebf), [`799219e`](https://github.com/LedgerHQ/ledger-live/commit/799219e262e80a339272113ea164fa506243b438), [`e37413b`](https://github.com/LedgerHQ/ledger-live/commit/e37413b588873a1a2a028ebf4c1971e4fa92ed2a), [`9e61582`](https://github.com/LedgerHQ/ledger-live/commit/9e61582edfcbb98046d0f74111ccf4061ec44bb3), [`3f34609`](https://github.com/LedgerHQ/ledger-live/commit/3f34609edecc5ae85a9a9ac1b76ab47e30a9c66e), [`c6f7bfe`](https://github.com/LedgerHQ/ledger-live/commit/c6f7bfead8593c148fe6e3d177ff8dd734728f5a), [`fcc2ac4`](https://github.com/LedgerHQ/ledger-live/commit/fcc2ac4c5ed270fb63df4c0079068ad6dac94612), [`eddc89e`](https://github.com/LedgerHQ/ledger-live/commit/eddc89e7b86a13aeedfc0ae4956c2dcd08494e5f), [`37f5759`](https://github.com/LedgerHQ/ledger-live/commit/37f57595f11d40562914794645cb3c7f6e55dc8b), [`a2a0288`](https://github.com/LedgerHQ/ledger-live/commit/a2a028844dbfbfa019f1f971bf6fdbed9005b9ec), [`8b3320d`](https://github.com/LedgerHQ/ledger-live/commit/8b3320d7aab0ff25eeb8930dafa536fb94962c79), [`e65a6b3`](https://github.com/LedgerHQ/ledger-live/commit/e65a6b3e67e271343b7029613498176b1da2d7d2), [`9d0b721`](https://github.com/LedgerHQ/ledger-live/commit/9d0b721dbfd8b71d32d2d16db22ad8e54f45f541)]:
  - @domain/api-card-management@0.6.0
  - @shared/ui-queued-bottom-sheet@0.4.0
  - @features/flow-pay-card-wallets@0.3.0
  - @shared/i18n@0.2.0

## 0.3.0-next.0

### Minor Changes

- [#21626](https://github.com/LedgerHQ/ledger-live/pull/21626) [`eddc89e`](https://github.com/LedgerHQ/ledger-live/commit/eddc89e7b86a13aeedfc0ae4956c2dcd08494e5f) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Show and drive the derived card onboarding status from the Card / Pay devtool.

  - A "Card onboarding" screen: a `Stepper` for the count, every step by the id the app keys it on, and the derived answer printed raw so a step can be traced to the response behind it.
  - Each step a request decides carries a toggle. It sets what that endpoint answers, so the step follows on the next read and holds until it is cleared. The phone wallet step is answered on the device; the purchase step is read-only while nothing answers it.
  - An endpoint answers from the provider until its toggle is used, so one step can be held while the rest stay real, and "Use the real answers" hands them all back.
  - `@domain/api-card-management/mock/card-onboarding-status` holds those answers and the responses that carry them; the mobile MSW handlers read it before falling back to what they answered before.
  - Mocking is started by an env var, so without it the screen says so instead of offering a toggle that would set an answer nothing reads.
  - The hook gains `refresh`, which re-asks all three sources: the screen asks on open and on demand.

- [#21625](https://github.com/LedgerHQ/ledger-live/pull/21625) [`b976cda`](https://github.com/LedgerHQ/ledger-live/commit/b976cda52320ef3f778fc11b4f95d2c5bf54ffe0) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Add `useCardOnboardingStatus`, which works out where a cardholder is in onboarding.

  - Five steps: account, card, funded wallet, card in the phone's wallet, first purchase.
  - Answered by `getUser`, `getCardStatus` and the linked-wallet join; the phone wallet step from the device; the purchase step reads `false` until the transactions endpoint lands.
  - Each step is an id and a flag. Copy and icons belong to whatever renders them.
  - Mobile lists all five, desktop the four it can answer.
  - `completedCount` comes with the steps.
  - Optional `skip`, so a signed-out host holds the reads.

### Patch Changes

- Updated dependencies [[`8f62cdb`](https://github.com/LedgerHQ/ledger-live/commit/8f62cdbb6d93e207efd7e551af65a41953d28242), [`de19b3e`](https://github.com/LedgerHQ/ledger-live/commit/de19b3e4e56a0c28fcc1a3ca929059e84fc7bebf), [`799219e`](https://github.com/LedgerHQ/ledger-live/commit/799219e262e80a339272113ea164fa506243b438), [`e37413b`](https://github.com/LedgerHQ/ledger-live/commit/e37413b588873a1a2a028ebf4c1971e4fa92ed2a), [`9e61582`](https://github.com/LedgerHQ/ledger-live/commit/9e61582edfcbb98046d0f74111ccf4061ec44bb3), [`3f34609`](https://github.com/LedgerHQ/ledger-live/commit/3f34609edecc5ae85a9a9ac1b76ab47e30a9c66e), [`c6f7bfe`](https://github.com/LedgerHQ/ledger-live/commit/c6f7bfead8593c148fe6e3d177ff8dd734728f5a), [`fcc2ac4`](https://github.com/LedgerHQ/ledger-live/commit/fcc2ac4c5ed270fb63df4c0079068ad6dac94612), [`eddc89e`](https://github.com/LedgerHQ/ledger-live/commit/eddc89e7b86a13aeedfc0ae4956c2dcd08494e5f), [`37f5759`](https://github.com/LedgerHQ/ledger-live/commit/37f57595f11d40562914794645cb3c7f6e55dc8b), [`a2a0288`](https://github.com/LedgerHQ/ledger-live/commit/a2a028844dbfbfa019f1f971bf6fdbed9005b9ec), [`8b3320d`](https://github.com/LedgerHQ/ledger-live/commit/8b3320d7aab0ff25eeb8930dafa536fb94962c79), [`e65a6b3`](https://github.com/LedgerHQ/ledger-live/commit/e65a6b3e67e271343b7029613498176b1da2d7d2), [`9d0b721`](https://github.com/LedgerHQ/ledger-live/commit/9d0b721dbfd8b71d32d2d16db22ad8e54f45f541)]:
  - @domain/api-card-management@0.6.0-next.0
  - @shared/ui-queued-bottom-sheet@0.4.0-next.0
  - @features/flow-pay-card-wallets@0.3.0-next.0
  - @shared/i18n@0.2.0

## 0.2.0

### Minor Changes

- [#21610](https://github.com/LedgerHQ/ledger-live/pull/21610) [`6b47659`](https://github.com/LedgerHQ/ledger-live/commit/6b4765929e98abbcb08cd5348fddb528a9e674e7) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add native card onboarding widget on mobile with Apple/Google Pay step and wallet persistence

- [#21549](https://github.com/LedgerHQ/ledger-live/pull/21549) [`b1b1e38`](https://github.com/LedgerHQ/ledger-live/commit/b1b1e38d2a8311f935f30c185276c165a6992dbc) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the card onboarding widget view-model, dismiss slice, and shared UI.

- [#21525](https://github.com/LedgerHQ/ledger-live/pull/21525) [`faa8ef1`](https://github.com/LedgerHQ/ledger-live/commit/faa8ef11055a27af3eb7bcf1b662e8bf5c3da77d) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the Pay card onboarding widget package skeleton (dual-platform barrels, tooling, no runtime logic yet)

### Patch Changes

- Updated dependencies [[`55bd216`](https://github.com/LedgerHQ/ledger-live/commit/55bd2166238ab3e03c33226bb5f5eb2e8646a818), [`08ee05c`](https://github.com/LedgerHQ/ledger-live/commit/08ee05cfb66f393b14fdf1377ed6c54c4831a87c), [`543b17d`](https://github.com/LedgerHQ/ledger-live/commit/543b17d7a6b49728001c0311c184c665e8c9bbb2), [`a7d54c0`](https://github.com/LedgerHQ/ledger-live/commit/a7d54c0d6af65abe7aa2170053b3fd07ae9b05ab), [`d60ce38`](https://github.com/LedgerHQ/ledger-live/commit/d60ce38581fe06b7f4fa72ba40259af2eabfe11f), [`7aa3071`](https://github.com/LedgerHQ/ledger-live/commit/7aa3071a532c98804a4357ff36a001b23351da73), [`3ea6abc`](https://github.com/LedgerHQ/ledger-live/commit/3ea6abc7a12a27650caf47551e328ab38c9308d6), [`2bd6a1c`](https://github.com/LedgerHQ/ledger-live/commit/2bd6a1c4b9d0cd229a8c9207108672b1a580968a)]:
  - @domain/api-card-management@0.5.0
  - @shared/ui-queued-bottom-sheet@0.3.0
  - @shared/i18n@0.2.0

## 0.2.0-next.0

### Minor Changes

- [#21610](https://github.com/LedgerHQ/ledger-live/pull/21610) [`6b47659`](https://github.com/LedgerHQ/ledger-live/commit/6b4765929e98abbcb08cd5348fddb528a9e674e7) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add native card onboarding widget on mobile with Apple/Google Pay step and wallet persistence

- [#21549](https://github.com/LedgerHQ/ledger-live/pull/21549) [`b1b1e38`](https://github.com/LedgerHQ/ledger-live/commit/b1b1e38d2a8311f935f30c185276c165a6992dbc) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the card onboarding widget view-model, dismiss slice, and shared UI.

- [#21525](https://github.com/LedgerHQ/ledger-live/pull/21525) [`faa8ef1`](https://github.com/LedgerHQ/ledger-live/commit/faa8ef11055a27af3eb7bcf1b662e8bf5c3da77d) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the Pay card onboarding widget package skeleton (dual-platform barrels, tooling, no runtime logic yet)

### Patch Changes

- Updated dependencies [[`55bd216`](https://github.com/LedgerHQ/ledger-live/commit/55bd2166238ab3e03c33226bb5f5eb2e8646a818), [`08ee05c`](https://github.com/LedgerHQ/ledger-live/commit/08ee05cfb66f393b14fdf1377ed6c54c4831a87c), [`543b17d`](https://github.com/LedgerHQ/ledger-live/commit/543b17d7a6b49728001c0311c184c665e8c9bbb2), [`a7d54c0`](https://github.com/LedgerHQ/ledger-live/commit/a7d54c0d6af65abe7aa2170053b3fd07ae9b05ab), [`d60ce38`](https://github.com/LedgerHQ/ledger-live/commit/d60ce38581fe06b7f4fa72ba40259af2eabfe11f), [`7aa3071`](https://github.com/LedgerHQ/ledger-live/commit/7aa3071a532c98804a4357ff36a001b23351da73), [`3ea6abc`](https://github.com/LedgerHQ/ledger-live/commit/3ea6abc7a12a27650caf47551e328ab38c9308d6), [`2bd6a1c`](https://github.com/LedgerHQ/ledger-live/commit/2bd6a1c4b9d0cd229a8c9207108672b1a580968a)]:
  - @domain/api-card-management@0.5.0-next.0
  - @shared/ui-queued-bottom-sheet@0.3.0-next.0
  - @shared/i18n@0.2.0

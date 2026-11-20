# @features/flow-pay-card-auth

## 0.14.0-next.0

### Minor Changes

- [#25197](https://github.com/LedgerHQ/ledger-live/pull/25197) [`ce2c91d`](https://github.com/LedgerHQ/ledger-live/commit/ce2c91dde08828cc6a213ab19ba1e13efccacc41) Thanks [@deepyjr](https://github.com/deepyjr)! - Open the Baanx manage assets page (`/manage-assets`) from the Pay card Add asset button instead of `/dashboard/accounts/crypto`

- [#24902](https://github.com/LedgerHQ/ledger-live/pull/24902) [`74c967e`](https://github.com/LedgerHQ/ledger-live/commit/74c967eb7dda848648df0db683910140b5d6e906) Thanks [@ysitbon](https://github.com/ysitbon)! - Remove unused exports and move single-platform types into the file that uses them

- [#24818](https://github.com/LedgerHQ/ledger-live/pull/24818) [`2267444`](https://github.com/LedgerHQ/ledger-live/commit/226744400780b00d6468f890d06a821440fb5608) Thanks [@deepyjr](https://github.com/deepyjr)! - Make the card login intro row keys verifiable by the i18n key check

- [#24956](https://github.com/LedgerHQ/ledger-live/pull/24956) [`9300f96`](https://github.com/LedgerHQ/ledger-live/commit/9300f9670ca7e76be132ea6fffc24c04c0f0b3ea) Thanks [@ysitbon](https://github.com/ysitbon)! - Nest the `payCardAuth` and `payCardLoginIntro` selectors in their slices. Export names and signatures are unchanged.

- [#24814](https://github.com/LedgerHQ/ledger-live/pull/24814) [`9f6f480`](https://github.com/LedgerHQ/ledger-live/commit/9f6f48031fad77047e3a6377838816229ba4da5b) Thanks [@deepyjr](https://github.com/deepyjr)! - Translate the web-only Pay wordings in the web views so Mobile no longer needs them

### Patch Changes

- Updated dependencies [[`5af6447`](https://github.com/LedgerHQ/ledger-live/commit/5af6447acb234632ed35feec4735b415d1993ced)]:
  - @domain/api-card-management@0.10.0-next.0
  - @features/platform-card@0.10.1-next.0
  - @features/platform-pay-analytics@0.4.1-next.0

## 0.13.0

### Minor Changes

- [#24660](https://github.com/LedgerHQ/ledger-live/pull/24660) [`8d68514`](https://github.com/LedgerHQ/ledger-live/commit/8d6851405315262fdb54a003dcad1d07f2010c31) Thanks [@ysitbon](https://github.com/ysitbon)! - Import platform files without their `.web` / `.native` suffix and let module resolution pick the twin.

### Patch Changes

- Updated dependencies [[`429170c`](https://github.com/LedgerHQ/ledger-live/commit/429170c6f969a90517696f2d750fc853be91e378), [`2ccdc0f`](https://github.com/LedgerHQ/ledger-live/commit/2ccdc0f0b1020daca45dfbd1444a79e2aae0bd36)]:
  - @shared/ui-info-state@0.8.0
  - @features/platform-card@0.10.0

## 0.13.0-next.0

### Minor Changes

- [#24660](https://github.com/LedgerHQ/ledger-live/pull/24660) [`8d68514`](https://github.com/LedgerHQ/ledger-live/commit/8d6851405315262fdb54a003dcad1d07f2010c31) Thanks [@ysitbon](https://github.com/ysitbon)! - Import platform files without their `.web` / `.native` suffix and let module resolution pick the twin.

### Patch Changes

- Updated dependencies [[`429170c`](https://github.com/LedgerHQ/ledger-live/commit/429170c6f969a90517696f2d750fc853be91e378), [`2ccdc0f`](https://github.com/LedgerHQ/ledger-live/commit/2ccdc0f0b1020daca45dfbd1444a79e2aae0bd36)]:
  - @shared/ui-info-state@0.8.0-next.0
  - @features/platform-card@0.10.0-next.0

## 0.12.0

### Minor Changes

- [#24392](https://github.com/LedgerHQ/ledger-live/pull/24392) [`934970a`](https://github.com/LedgerHQ/ledger-live/commit/934970adec67ed88f1d546d03b1bb555cbfd128f) Thanks [@renovate-operator-ledger](https://github.com/apps/renovate-operator-ledger)! - chore(deps): update dependency @reduxjs/toolkit to v2.13.0

  - Updated `@reduxjs/toolkit` to `2.13.0`

### Patch Changes

- Updated dependencies [[`6196234`](https://github.com/LedgerHQ/ledger-live/commit/61962349d0487b0e1f318d2ab36753befc434624), [`49ae0f6`](https://github.com/LedgerHQ/ledger-live/commit/49ae0f60632ad4ad518b8a7420ab02239f3fa144), [`52622fa`](https://github.com/LedgerHQ/ledger-live/commit/52622fa571b8c7b549d185525f4511dc3ebdfa82), [`934970a`](https://github.com/LedgerHQ/ledger-live/commit/934970adec67ed88f1d546d03b1bb555cbfd128f)]:
  - @shared/ui-info-state@0.7.0
  - @domain/api-card-management@0.9.0
  - @features/platform-card@0.9.0

## 0.12.0-next.0

### Minor Changes

- [#24392](https://github.com/LedgerHQ/ledger-live/pull/24392) [`934970a`](https://github.com/LedgerHQ/ledger-live/commit/934970adec67ed88f1d546d03b1bb555cbfd128f) Thanks [@renovate-operator-ledger](https://github.com/apps/renovate-operator-ledger)! - chore(deps): update dependency @reduxjs/toolkit to v2.13.0

  - Updated `@reduxjs/toolkit` to `2.13.0`

### Patch Changes

- Updated dependencies [[`6196234`](https://github.com/LedgerHQ/ledger-live/commit/61962349d0487b0e1f318d2ab36753befc434624), [`49ae0f6`](https://github.com/LedgerHQ/ledger-live/commit/49ae0f60632ad4ad518b8a7420ab02239f3fa144), [`52622fa`](https://github.com/LedgerHQ/ledger-live/commit/52622fa571b8c7b549d185525f4511dc3ebdfa82), [`934970a`](https://github.com/LedgerHQ/ledger-live/commit/934970adec67ed88f1d546d03b1bb555cbfd128f)]:
  - @shared/ui-info-state@0.7.0-next.0
  - @domain/api-card-management@0.9.0-next.0
  - @features/platform-card@0.9.0-next.0

## 0.11.1

### Patch Changes

- Updated dependencies []:
  - @domain/api-card-management@0.8.4
  - @features/platform-card@0.8.3

## 0.11.1-next.0

### Patch Changes

- Updated dependencies []:
  - @domain/api-card-management@0.8.4-next.0
  - @features/platform-card@0.8.3-next.0

## 0.11.0

### Minor Changes

- [#23965](https://github.com/LedgerHQ/ledger-live/pull/23965) [`4216add`](https://github.com/LedgerHQ/ledger-live/commit/4216addd84f49f073e5bd7c0ae7019f40799955f) Thanks [@ysitbon](https://github.com/ysitbon)! - `InfoState` takes one props contract, `InfoStateProps` from `InfoState.types.ts`, on web and native, and the native `spot` preset now honors `backgroundTone` on its bottom sheet. `DialogBackgroundToneProvider` moves to the web platform entry `@shared/ui-info-state/web`; the gradient, context and tone hooks become internal. The universal entry is one unconditioned `src/index.ts`, imports carry no platform suffix, and the package gets a `lint` script.

### Patch Changes

- Updated dependencies [[`25baf72`](https://github.com/LedgerHQ/ledger-live/commit/25baf72ba4d19425dae6973af5438040e453c234), [`7ce8446`](https://github.com/LedgerHQ/ledger-live/commit/7ce8446db105f07bf142ab3bba9627875178f065), [`4216add`](https://github.com/LedgerHQ/ledger-live/commit/4216addd84f49f073e5bd7c0ae7019f40799955f), [`d4be6b6`](https://github.com/LedgerHQ/ledger-live/commit/d4be6b620102f2c9f65201935646d32cb365f6ac), [`00badce`](https://github.com/LedgerHQ/ledger-live/commit/00badce303d15692c8ff9a91658803da1253af0c), [`9092dc3`](https://github.com/LedgerHQ/ledger-live/commit/9092dc350ccb833de3bd9b4254408a98cd264645), [`5eed48e`](https://github.com/LedgerHQ/ledger-live/commit/5eed48ed200b672ba41afb663c6b648628ebaf3e), [`efc2a52`](https://github.com/LedgerHQ/ledger-live/commit/efc2a525b2416bf7126945361a280ba34a966766)]:
  - @features/platform-pay-analytics@0.4.0
  - @shared/ui-info-state@0.6.0
  - @shared/ui-queued-bottom-sheet@0.8.0
  - @shared/i18n@0.2.0
  - @domain/api-card-management@0.8.3
  - @features/platform-card@0.8.2

## 0.11.0-next.0

### Minor Changes

- [#23965](https://github.com/LedgerHQ/ledger-live/pull/23965) [`4216add`](https://github.com/LedgerHQ/ledger-live/commit/4216addd84f49f073e5bd7c0ae7019f40799955f) Thanks [@ysitbon](https://github.com/ysitbon)! - `InfoState` takes one props contract, `InfoStateProps` from `InfoState.types.ts`, on web and native, and the native `spot` preset now honors `backgroundTone` on its bottom sheet. `DialogBackgroundToneProvider` moves to the web platform entry `@shared/ui-info-state/web`; the gradient, context and tone hooks become internal. The universal entry is one unconditioned `src/index.ts`, imports carry no platform suffix, and the package gets a `lint` script.

### Patch Changes

- Updated dependencies [[`25baf72`](https://github.com/LedgerHQ/ledger-live/commit/25baf72ba4d19425dae6973af5438040e453c234), [`7ce8446`](https://github.com/LedgerHQ/ledger-live/commit/7ce8446db105f07bf142ab3bba9627875178f065), [`4216add`](https://github.com/LedgerHQ/ledger-live/commit/4216addd84f49f073e5bd7c0ae7019f40799955f), [`d4be6b6`](https://github.com/LedgerHQ/ledger-live/commit/d4be6b620102f2c9f65201935646d32cb365f6ac), [`00badce`](https://github.com/LedgerHQ/ledger-live/commit/00badce303d15692c8ff9a91658803da1253af0c), [`9092dc3`](https://github.com/LedgerHQ/ledger-live/commit/9092dc350ccb833de3bd9b4254408a98cd264645), [`5eed48e`](https://github.com/LedgerHQ/ledger-live/commit/5eed48ed200b672ba41afb663c6b648628ebaf3e), [`efc2a52`](https://github.com/LedgerHQ/ledger-live/commit/efc2a525b2416bf7126945361a280ba34a966766)]:
  - @features/platform-pay-analytics@0.4.0-next.0
  - @shared/ui-info-state@0.6.0-next.0
  - @shared/ui-queued-bottom-sheet@0.8.0-next.0
  - @shared/i18n@0.2.0
  - @domain/api-card-management@0.8.3-next.0
  - @features/platform-card@0.8.2-next.0

## 0.10.1

### Patch Changes

- Updated dependencies [[`2ebd029`](https://github.com/LedgerHQ/ledger-live/commit/2ebd029cd006cb89ceb240705247ccf5529c3c50), [`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c), [`4fd1ebc`](https://github.com/LedgerHQ/ledger-live/commit/4fd1ebc94718ead589f235824f0440803341feb9)]:
  - @shared/ui-queued-bottom-sheet@0.7.0
  - @shared/ui-info-state@0.5.0
  - @domain/api-card-management@0.8.2
  - @features/platform-card@0.8.1

## 0.10.1-next.0

### Patch Changes

- Updated dependencies [[`2ebd029`](https://github.com/LedgerHQ/ledger-live/commit/2ebd029cd006cb89ceb240705247ccf5529c3c50), [`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c), [`4fd1ebc`](https://github.com/LedgerHQ/ledger-live/commit/4fd1ebc94718ead589f235824f0440803341feb9)]:
  - @shared/ui-queued-bottom-sheet@0.7.0-next.0
  - @shared/ui-info-state@0.5.0-next.0
  - @domain/api-card-management@0.8.2-next.0
  - @features/platform-card@0.8.1-next.0

## 0.10.0

### Minor Changes

- [#22793](https://github.com/LedgerHQ/ledger-live/pull/22793) [`e7996b4`](https://github.com/LedgerHQ/ledger-live/commit/e7996b4bb9f13726af09cc5202d26d1e471563ef) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Keep the Card session tokens and the PKCE attempt on this device only. The keychain entries move from `AFTER_FIRST_UNLOCK` to `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`, so an iOS backup restored onto another phone no longer carries a signed-in Card session. Background reads still work once the device has been unlocked after boot. Existing entries take the new level the next time they are written.

- [#22879](https://github.com/LedgerHQ/ledger-live/pull/22879) [`77e7162`](https://github.com/LedgerHQ/ledger-live/commit/77e716257785645b79027b580fcef2dfbab7ad3b) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Show the Card login on the desktop Pay tab when the `card_live_app` param of `lwdPayTab` is on. "Create an account" opens the card program live app and "Log in" opens the CL Card live app.

- [#22919](https://github.com/LedgerHQ/ledger-live/pull/22919) [`57921f9`](https://github.com/LedgerHQ/ledger-live/commit/57921f955b6c07389cb78d4c087c881667858dc2) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Restore the bottom padding of the desktop Card intro dialog

- [#22869](https://github.com/LedgerHQ/ledger-live/pull/22869) [`eb65ce4`](https://github.com/LedgerHQ/ledger-live/commit/eb65ce49ea0fa2d2c44f79fd2b0f8de365ae5e53) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add feature-flag scenarios for the native Pay card, Card live app login, and CL Card disclaimer

- [#22659](https://github.com/LedgerHQ/ledger-live/pull/22659) [`bed3cf9`](https://github.com/LedgerHQ/ledger-live/commit/bed3cf9bd880e00d51fc90849dca3741b9ab779f) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Restore the Card sign-in state at app start so the Card history shows a stored session

### Patch Changes

- Updated dependencies [[`e7996b4`](https://github.com/LedgerHQ/ledger-live/commit/e7996b4bb9f13726af09cc5202d26d1e471563ef)]:
  - @features/platform-card@0.8.0
  - @domain/api-card-management@0.8.1
  - @shared/i18n@0.2.0
  - @shared/ui-info-state@0.4.0
  - @shared/ui-queued-bottom-sheet@0.6.0
  - @features/platform-pay-analytics@0.3.0

## 0.10.0-next.0

### Minor Changes

- [#22793](https://github.com/LedgerHQ/ledger-live/pull/22793) [`e7996b4`](https://github.com/LedgerHQ/ledger-live/commit/e7996b4bb9f13726af09cc5202d26d1e471563ef) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Keep the Card session tokens and the PKCE attempt on this device only. The keychain entries move from `AFTER_FIRST_UNLOCK` to `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`, so an iOS backup restored onto another phone no longer carries a signed-in Card session. Background reads still work once the device has been unlocked after boot. Existing entries take the new level the next time they are written.

- [#22879](https://github.com/LedgerHQ/ledger-live/pull/22879) [`77e7162`](https://github.com/LedgerHQ/ledger-live/commit/77e716257785645b79027b580fcef2dfbab7ad3b) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Show the Card login on the desktop Pay tab when the `card_live_app` param of `lwdPayTab` is on. "Create an account" opens the card program live app and "Log in" opens the CL Card live app.

- [#22919](https://github.com/LedgerHQ/ledger-live/pull/22919) [`57921f9`](https://github.com/LedgerHQ/ledger-live/commit/57921f955b6c07389cb78d4c087c881667858dc2) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Restore the bottom padding of the desktop Card intro dialog

- [#22869](https://github.com/LedgerHQ/ledger-live/pull/22869) [`eb65ce4`](https://github.com/LedgerHQ/ledger-live/commit/eb65ce49ea0fa2d2c44f79fd2b0f8de365ae5e53) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add feature-flag scenarios for the native Pay card, Card live app login, and CL Card disclaimer

- [#22659](https://github.com/LedgerHQ/ledger-live/pull/22659) [`bed3cf9`](https://github.com/LedgerHQ/ledger-live/commit/bed3cf9bd880e00d51fc90849dca3741b9ab779f) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Restore the Card sign-in state at app start so the Card history shows a stored session

### Patch Changes

- Updated dependencies [[`e7996b4`](https://github.com/LedgerHQ/ledger-live/commit/e7996b4bb9f13726af09cc5202d26d1e471563ef)]:
  - @features/platform-card@0.8.0-next.0
  - @domain/api-card-management@0.8.1-next.0
  - @shared/i18n@0.2.0
  - @shared/ui-info-state@0.4.0
  - @shared/ui-queued-bottom-sheet@0.6.0
  - @features/platform-pay-analytics@0.3.0

## 0.9.0

### Minor Changes

- [#22790](https://github.com/LedgerHQ/ledger-live/pull/22790) [`cee85b4`](https://github.com/LedgerHQ/ledger-live/commit/cee85b47d7d1f414e23935e77c9ad22d98ddf994) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Keep the Card session tokens and the PKCE attempt on this device only. The keychain entries move from `AFTER_FIRST_UNLOCK` to `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`, so an iOS backup restored onto another phone no longer carries a signed-in Card session. Background reads still work once the device has been unlocked after boot. Existing entries take the new level the next time they are written.

- [#22481](https://github.com/LedgerHQ/ledger-live/pull/22481) [`d6866e7`](https://github.com/LedgerHQ/ledger-live/commit/d6866e7dc7ced8898ac585d4e34d9667d9ad7f17) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - adapt crypto card title to be consistent

- [#22577](https://github.com/LedgerHQ/ledger-live/pull/22577) [`b6a9b53`](https://github.com/LedgerHQ/ledger-live/commit/b6a9b531267360fdca64b8db22dd8781aa414dd9) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix Pay analytics events that never reached Segment, and align the feature-intro page names.

  Pay tracking no longer travels through a React context: `@features/platform-pay-analytics` exposes
  module-level trackers built on `@shared/analytics`, and every Pay flow imports the one it needs.
  The provider could not be reached from inside `@gorhom/bottom-sheet` portals on mobile, so the card
  details sheet and the reward-currencies CTA silently dropped their events. The `onTrackEvent` prop
  is gone from every Pay flow package and from both host apps.

  Card milestone events are now planned from a first-read baseline, so they no longer replay on each
  login. Feature-intro pages report as `Page Feature Intro <flow>`, and the bank transfer flow is
  named `Cash to stable` instead of `C2S`.

- [#22421](https://github.com/LedgerHQ/ledger-live/pull/22421) [`68f4179`](https://github.com/LedgerHQ/ledger-live/commit/68f41798cae68cd1b91f291d5447514b80fd6f49) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Keep the Android Card login browser open when the user switches app

- [#22545](https://github.com/LedgerHQ/ledger-live/pull/22545) [`ea90542`](https://github.com/LedgerHQ/ledger-live/commit/ea90542540f47a76c18cf5f440bb98b9be71c837) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - feat(pay-card): show every login error in a retryable panel

- [#22535](https://github.com/LedgerHQ/ledger-live/pull/22535) [`e8518d7`](https://github.com/LedgerHQ/ledger-live/commit/e8518d7f0b88096552c6a8f74ffe5752bc517a39) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Wait for the app to be active before opening the Card's secure browser, instead of after every biometric prompt.

  A Dynamic Island plays Face ID's success animation for about 2.5 seconds after the system has answered, and the app stays inactive throughout. An `ASWebAuthenticationSession` started in that window never appears, and the web browser module then refuses every later session as one already open, so the login button kept spinning until the app was relaunched.

  The wait for the app to be active now sits in `openHostedUrlInSecureBrowser`, right before the session starts, and resolves on the app's `active` event, bounded at five seconds against a lost event. A biometric prompt answers straight away again, so the "Face ID enabled" sheet shows while the island is still animating and the wait overlaps the time spent reading it, rather than adding to it. The app's prompt wrapper is removed.

- [#22899](https://github.com/LedgerHQ/ledger-live/pull/22899) [`56640ba`](https://github.com/LedgerHQ/ledger-live/commit/56640ba2c03cec8555f7452da785c8dd949ec010) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Show the Card login on the desktop Pay tab when the `card_live_app` param of `lwdPayTab` is on. "Create an account" opens the card program live app and "Log in" opens the CL Card live app.

- [#22918](https://github.com/LedgerHQ/ledger-live/pull/22918) [`5ff6348`](https://github.com/LedgerHQ/ledger-live/commit/5ff6348d1505e805bdbbff64685b0b97bc2a8981) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Restore the bottom padding of the desktop Card intro dialog

- [#22293](https://github.com/LedgerHQ/ledger-live/pull/22293) [`912b087`](https://github.com/LedgerHQ/ledger-live/commit/912b0877538bd06cc7187b90e2eab8182fe55034) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Keep the aspect ratio of the login intro hero image and theme the desktop row icons

- [#22546](https://github.com/LedgerHQ/ledger-live/pull/22546) [`defb949`](https://github.com/LedgerHQ/ledger-live/commit/defb949c02d9d0d935882eb8e8617d000e18b163) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - fix(pay-card): keep the card visible, with a loading balance, while the session resolves

- [#22446](https://github.com/LedgerHQ/ledger-live/pull/22446) [`3d41eab`](https://github.com/LedgerHQ/ledger-live/commit/3d41eab30728e94a21c53d4d4d9fe6eec27a5ce1) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Open the hosted cashback page from the Pay card reward banner

- [#22889](https://github.com/LedgerHQ/ledger-live/pull/22889) [`fe55ea3`](https://github.com/LedgerHQ/ledger-live/commit/fe55ea349a8227d398bd570e68a8756392a4dd21) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add feature-flag scenarios for the native Pay card, Card live app login, and CL Card disclaimer

- [#22382](https://github.com/LedgerHQ/ledger-live/pull/22382) [`c119e0d`](https://github.com/LedgerHQ/ledger-live/commit/c119e0d38f626314cf679bfa06420ce0e4bca03b) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Redirect the "choose card type" onboarding step to the Baanx hosted order-card page, and align pay bottom sheet spacing and tile styles

- [#22327](https://github.com/LedgerHQ/ledger-live/pull/22327) [`df5d8c9`](https://github.com/LedgerHQ/ledger-live/commit/df5d8c96892094fc6faf06992f415e88ff64b5c8) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Open the hosted crypto accounts dashboard when adding a card asset.

### Patch Changes

- Updated dependencies [[`b42673e`](https://github.com/LedgerHQ/ledger-live/commit/b42673eed68aba6b2885486d7294f5f9163f721d), [`8b387f4`](https://github.com/LedgerHQ/ledger-live/commit/8b387f4d1db967288af2f982a78949e0615ebc7e), [`c32cde3`](https://github.com/LedgerHQ/ledger-live/commit/c32cde31461523c72df4f67cd18288c6f65c9951), [`cee85b4`](https://github.com/LedgerHQ/ledger-live/commit/cee85b47d7d1f414e23935e77c9ad22d98ddf994), [`b4599a5`](https://github.com/LedgerHQ/ledger-live/commit/b4599a58f817aa233be256d6f755a0fd4d0fc8a5), [`83fac3e`](https://github.com/LedgerHQ/ledger-live/commit/83fac3e00782840d1f118180dfb9afb9a484952c), [`b6a9b53`](https://github.com/LedgerHQ/ledger-live/commit/b6a9b531267360fdca64b8db22dd8781aa414dd9), [`ae229f2`](https://github.com/LedgerHQ/ledger-live/commit/ae229f27b250d6bdd06af1b06a2912a8c556a27c), [`a39ba90`](https://github.com/LedgerHQ/ledger-live/commit/a39ba900d889155ebc4fe2cab88f82a715e3f605), [`dccea32`](https://github.com/LedgerHQ/ledger-live/commit/dccea322ed808abfa4e6829364fe945cd0a58383), [`909c761`](https://github.com/LedgerHQ/ledger-live/commit/909c761357291f48ac0266d91d6ed563aa4ad833), [`c020110`](https://github.com/LedgerHQ/ledger-live/commit/c02011033bf5ca5bf38f05c487adb3a27c209a7d), [`e19e6cf`](https://github.com/LedgerHQ/ledger-live/commit/e19e6cf36074363d22085b6c85c54ef964eb382c)]:
  - @domain/api-card-management@0.8.0
  - @features/platform-pay-analytics@0.3.0
  - @shared/ui-info-state@0.4.0
  - @shared/ui-queued-bottom-sheet@0.6.0
  - @features/platform-card@0.7.0

## 0.9.0-next.3

### Minor Changes

- [#22918](https://github.com/LedgerHQ/ledger-live/pull/22918) [`5ff6348`](https://github.com/LedgerHQ/ledger-live/commit/5ff6348d1505e805bdbbff64685b0b97bc2a8981) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Restore the bottom padding of the desktop Card intro dialog

## 0.9.0-next.2

### Minor Changes

- [#22899](https://github.com/LedgerHQ/ledger-live/pull/22899) [`56640ba`](https://github.com/LedgerHQ/ledger-live/commit/56640ba2c03cec8555f7452da785c8dd949ec010) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Show the Card login on the desktop Pay tab when the `card_live_app` param of `lwdPayTab` is on. "Create an account" opens the card program live app and "Log in" opens the CL Card live app.

- [#22889](https://github.com/LedgerHQ/ledger-live/pull/22889) [`fe55ea3`](https://github.com/LedgerHQ/ledger-live/commit/fe55ea349a8227d398bd570e68a8756392a4dd21) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add feature-flag scenarios for the native Pay card, Card live app login, and CL Card disclaimer

## 0.9.0-next.1

### Minor Changes

- [#22790](https://github.com/LedgerHQ/ledger-live/pull/22790) [`cee85b4`](https://github.com/LedgerHQ/ledger-live/commit/cee85b47d7d1f414e23935e77c9ad22d98ddf994) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Keep the Card session tokens and the PKCE attempt on this device only. The keychain entries move from `AFTER_FIRST_UNLOCK` to `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`, so an iOS backup restored onto another phone no longer carries a signed-in Card session. Background reads still work once the device has been unlocked after boot. Existing entries take the new level the next time they are written.

### Patch Changes

- Updated dependencies [[`cee85b4`](https://github.com/LedgerHQ/ledger-live/commit/cee85b47d7d1f414e23935e77c9ad22d98ddf994)]:
  - @features/platform-card@0.7.0-next.1

## 0.9.0-next.0

### Minor Changes

- [#22481](https://github.com/LedgerHQ/ledger-live/pull/22481) [`d6866e7`](https://github.com/LedgerHQ/ledger-live/commit/d6866e7dc7ced8898ac585d4e34d9667d9ad7f17) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - adapt crypto card title to be consistent

- [#22577](https://github.com/LedgerHQ/ledger-live/pull/22577) [`b6a9b53`](https://github.com/LedgerHQ/ledger-live/commit/b6a9b531267360fdca64b8db22dd8781aa414dd9) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix Pay analytics events that never reached Segment, and align the feature-intro page names.

  Pay tracking no longer travels through a React context: `@features/platform-pay-analytics` exposes
  module-level trackers built on `@shared/analytics`, and every Pay flow imports the one it needs.
  The provider could not be reached from inside `@gorhom/bottom-sheet` portals on mobile, so the card
  details sheet and the reward-currencies CTA silently dropped their events. The `onTrackEvent` prop
  is gone from every Pay flow package and from both host apps.

  Card milestone events are now planned from a first-read baseline, so they no longer replay on each
  login. Feature-intro pages report as `Page Feature Intro <flow>`, and the bank transfer flow is
  named `Cash to stable` instead of `C2S`.

- [#22421](https://github.com/LedgerHQ/ledger-live/pull/22421) [`68f4179`](https://github.com/LedgerHQ/ledger-live/commit/68f41798cae68cd1b91f291d5447514b80fd6f49) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Keep the Android Card login browser open when the user switches app

- [#22545](https://github.com/LedgerHQ/ledger-live/pull/22545) [`ea90542`](https://github.com/LedgerHQ/ledger-live/commit/ea90542540f47a76c18cf5f440bb98b9be71c837) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - feat(pay-card): show every login error in a retryable panel

- [#22535](https://github.com/LedgerHQ/ledger-live/pull/22535) [`e8518d7`](https://github.com/LedgerHQ/ledger-live/commit/e8518d7f0b88096552c6a8f74ffe5752bc517a39) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Wait for the app to be active before opening the Card's secure browser, instead of after every biometric prompt.

  A Dynamic Island plays Face ID's success animation for about 2.5 seconds after the system has answered, and the app stays inactive throughout. An `ASWebAuthenticationSession` started in that window never appears, and the web browser module then refuses every later session as one already open, so the login button kept spinning until the app was relaunched.

  The wait for the app to be active now sits in `openHostedUrlInSecureBrowser`, right before the session starts, and resolves on the app's `active` event, bounded at five seconds against a lost event. A biometric prompt answers straight away again, so the "Face ID enabled" sheet shows while the island is still animating and the wait overlaps the time spent reading it, rather than adding to it. The app's prompt wrapper is removed.

- [#22293](https://github.com/LedgerHQ/ledger-live/pull/22293) [`912b087`](https://github.com/LedgerHQ/ledger-live/commit/912b0877538bd06cc7187b90e2eab8182fe55034) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Keep the aspect ratio of the login intro hero image and theme the desktop row icons

- [#22546](https://github.com/LedgerHQ/ledger-live/pull/22546) [`defb949`](https://github.com/LedgerHQ/ledger-live/commit/defb949c02d9d0d935882eb8e8617d000e18b163) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - fix(pay-card): keep the card visible, with a loading balance, while the session resolves

- [#22446](https://github.com/LedgerHQ/ledger-live/pull/22446) [`3d41eab`](https://github.com/LedgerHQ/ledger-live/commit/3d41eab30728e94a21c53d4d4d9fe6eec27a5ce1) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Open the hosted cashback page from the Pay card reward banner

- [#22382](https://github.com/LedgerHQ/ledger-live/pull/22382) [`c119e0d`](https://github.com/LedgerHQ/ledger-live/commit/c119e0d38f626314cf679bfa06420ce0e4bca03b) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Redirect the "choose card type" onboarding step to the Baanx hosted order-card page, and align pay bottom sheet spacing and tile styles

- [#22327](https://github.com/LedgerHQ/ledger-live/pull/22327) [`df5d8c9`](https://github.com/LedgerHQ/ledger-live/commit/df5d8c96892094fc6faf06992f415e88ff64b5c8) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Open the hosted crypto accounts dashboard when adding a card asset.

### Patch Changes

- Updated dependencies [[`b42673e`](https://github.com/LedgerHQ/ledger-live/commit/b42673eed68aba6b2885486d7294f5f9163f721d), [`8b387f4`](https://github.com/LedgerHQ/ledger-live/commit/8b387f4d1db967288af2f982a78949e0615ebc7e), [`c32cde3`](https://github.com/LedgerHQ/ledger-live/commit/c32cde31461523c72df4f67cd18288c6f65c9951), [`b4599a5`](https://github.com/LedgerHQ/ledger-live/commit/b4599a58f817aa233be256d6f755a0fd4d0fc8a5), [`83fac3e`](https://github.com/LedgerHQ/ledger-live/commit/83fac3e00782840d1f118180dfb9afb9a484952c), [`b6a9b53`](https://github.com/LedgerHQ/ledger-live/commit/b6a9b531267360fdca64b8db22dd8781aa414dd9), [`ae229f2`](https://github.com/LedgerHQ/ledger-live/commit/ae229f27b250d6bdd06af1b06a2912a8c556a27c), [`a39ba90`](https://github.com/LedgerHQ/ledger-live/commit/a39ba900d889155ebc4fe2cab88f82a715e3f605), [`dccea32`](https://github.com/LedgerHQ/ledger-live/commit/dccea322ed808abfa4e6829364fe945cd0a58383), [`909c761`](https://github.com/LedgerHQ/ledger-live/commit/909c761357291f48ac0266d91d6ed563aa4ad833), [`c020110`](https://github.com/LedgerHQ/ledger-live/commit/c02011033bf5ca5bf38f05c487adb3a27c209a7d), [`e19e6cf`](https://github.com/LedgerHQ/ledger-live/commit/e19e6cf36074363d22085b6c85c54ef964eb382c)]:
  - @domain/api-card-management@0.8.0-next.0
  - @features/platform-pay-analytics@0.3.0-next.0
  - @shared/ui-info-state@0.4.0-next.0
  - @shared/ui-queued-bottom-sheet@0.6.0-next.0
  - @features/platform-card@0.6.1-next.0

## 0.8.0

### Minor Changes

- [#22003](https://github.com/LedgerHQ/ledger-live/pull/22003) [`40d296b`](https://github.com/LedgerHQ/ledger-live/commit/40d296b822381cc5d05616acafa1bca61e500dce) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Record the provider app the Card login redirect names, and send x-us-env on every Card request of a US holder

- [#22257](https://github.com/LedgerHQ/ledger-live/pull/22257) [`510465b`](https://github.com/LedgerHQ/ledger-live/commit/510465b5ac5808a42729dbea99aea081bf759e4a) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Expose settings redirect actions for Manage PIN, Access Baanx and Help on the card's More menu.
  The feature packages take already-resolved host callbacks and never build URLs or read env vars
  themselves — desktop opens Baanx pages through the existing hosted-page opener, mobile through the
  secure browser, and each app opens the Help article externally.

- [#22179](https://github.com/LedgerHQ/ledger-live/pull/22179) [`a1a8b81`](https://github.com/LedgerHQ/ledger-live/commit/a1a8b81b3f9b4eb897ac3d81427a1df0a5e0130b) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Let any part of the app ask for the app to be protected before it continues, and answer for it.

  A feature that needs protection — the Card, first — now awaits one call: `requestProtection()`. The prompt decides what to ask for, so no caller looks at biometry: biometrics if the device has some enrolled, a password otherwise. An already-protected user is never interrupted and their action simply runs.

  The password path opens the existing add-password flow and comes back with a confirmation sheet, so the caller resumes where it left off. Dismissing the prompt, or backing out of the password flow, holds the caller's action instead — a request never resolves as protected unless protection is actually in place.

  Both sheets are mounted once, above the screens, so navigating away no longer closes the prompt the way a screen-owned sheet would.

  The card is the first caller: both ways out of its login lead to the provider, so signing up and logging in each wait for protection. The card flow takes the request as a prop, since a flow package cannot reach the app's prompt, and only the native entry passes one — desktop has no app lock and is unchanged.

- [#22305](https://github.com/LedgerHQ/ledger-live/pull/22305) [`fd6b9d0`](https://github.com/LedgerHQ/ledger-live/commit/fd6b9d0b602e44c5520152c2307bd629f11afc7a) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Open the provider withdrawal page from a card asset.

  - `buildWithdrawalPath` addresses `/withdrawal`, with the same `app_id` and `currency` query as `buildTopUpPath`.
  - Desktop opens it on the hosted manifest, mobile in the secure browser, both with the asset pre-selected.
  - Mobile also pre-selects the asset on the top up page.
  - Every mobile hosted page now opens in the same secure browser session, which shares the cookies of the login. `openHostedLoginInSecureBrowser` becomes `openHostedUrlInSecureBrowser`, and `openHostedPageInSecureBrowser` is removed.
  - Every hosted path now lives in `state/hostedPaths.ts`: signup, top up, withdrawal, manage PIN and the Baanx root. `cardSettingsPaths.ts` is removed, and the package exports the same names as before.

- [#22050](https://github.com/LedgerHQ/ledger-live/pull/22050) [`954ffbd`](https://github.com/LedgerHQ/ledger-live/commit/954ffbdeb8172f555b637599d24cf2a94bcf24db) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - fix(pay-card): keep the session when only the card data fails to load

- [#22320](https://github.com/LedgerHQ/ledger-live/pull/22320) [`853e47d`](https://github.com/LedgerHQ/ledger-live/commit/853e47dac8f42644733686353c3f0f4a3fcc035a) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix the manage PIN hosted page to point at `/set-pin` instead of `/dashboard/card/details`, and name the US app on it for a US card holder, matching the access Baanx and asset pages

- [#22184](https://github.com/LedgerHQ/ledger-live/pull/22184) [`75038d5`](https://github.com/LedgerHQ/ledger-live/commit/75038d59735ac63ab43baf7bd298969890241b3b) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Open the provider's top up page from the card on mobile.

  - The Top up button takes the place of the disabled "Coming soon" action on the card face, and it comes back at the bottom of the card details sheet.
  - Mobile opens `/topup` in the secure browser, which carries the provider session. A US card holder gets the US `app_id` on the query, so the page reaches the US tenant.

- [#22183](https://github.com/LedgerHQ/ledger-live/pull/22183) [`d9d1111`](https://github.com/LedgerHQ/ledger-live/commit/d9d1111733e757cc58b6249fdda568dd56d40757) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Open the provider's top up page from the card on desktop.

  - `CardTopUpButton` carries the action. On desktop it stays at the bottom of the card panel, above the scrolling content.
  - Desktop opens `/topup` on the hosted live app manifest, the way the signup page already opens.
  - A US card holder gets the US `app_id` on the query, so the page reaches the US tenant.
  - Desktop ends the provider session in the webview on each entry of the Pay tab, so a session left behind by a top up cannot sign the previous holder back in. The login and the signup drop their own wipe: every one of them starts from an entry of the Pay tab.
  - The top up button in the asset details dialog opens the same page, with the asset pre-selected on the query.

- [#22301](https://github.com/LedgerHQ/ledger-live/pull/22301) [`6fe6efb`](https://github.com/LedgerHQ/ledger-live/commit/6fe6efb9f2c9211d6002dd17f4369f90390021bf) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Consume the shared Pay analytics provider across card flows.

### Patch Changes

- Updated dependencies [[`40d296b`](https://github.com/LedgerHQ/ledger-live/commit/40d296b822381cc5d05616acafa1bca61e500dce), [`4d1d640`](https://github.com/LedgerHQ/ledger-live/commit/4d1d64049a0bb0562a1a0c8ad2555fe967acdd7f), [`871e485`](https://github.com/LedgerHQ/ledger-live/commit/871e4854284a0b21e31b53ff0ac312010093d914), [`72367fc`](https://github.com/LedgerHQ/ledger-live/commit/72367fcf2343fa488008236f1005da589e6e3054), [`233e44e`](https://github.com/LedgerHQ/ledger-live/commit/233e44e3dd724cc9d4f14a02c7e62e39d2e9079b), [`6741356`](https://github.com/LedgerHQ/ledger-live/commit/67413566f84b895e6f4ae2b5d646bfc2e82c6926), [`dafadf0`](https://github.com/LedgerHQ/ledger-live/commit/dafadf005a54007d5430203c11b8718c1636a6e4), [`9652494`](https://github.com/LedgerHQ/ledger-live/commit/96524949cbf8fa1d102a0156f40004ff12a30475), [`5492648`](https://github.com/LedgerHQ/ledger-live/commit/5492648988e327c8e3e6e7d5ead1e0fa2bd9929e), [`c52af21`](https://github.com/LedgerHQ/ledger-live/commit/c52af21b622efa62774657e190abb9762cffac1c), [`d0fd787`](https://github.com/LedgerHQ/ledger-live/commit/d0fd787fb0e40b35f9d9c70307694d364f99b858), [`b97a3e5`](https://github.com/LedgerHQ/ledger-live/commit/b97a3e5462588d771a2ea5d628cfef7d564bc886), [`a915d4a`](https://github.com/LedgerHQ/ledger-live/commit/a915d4a577dfe7bb778364c4b0269bc61203075a), [`eb06f77`](https://github.com/LedgerHQ/ledger-live/commit/eb06f77c9548a2e4641c37da90c34b4fcffba667), [`75038d5`](https://github.com/LedgerHQ/ledger-live/commit/75038d59735ac63ab43baf7bd298969890241b3b), [`d9d1111`](https://github.com/LedgerHQ/ledger-live/commit/d9d1111733e757cc58b6249fdda568dd56d40757), [`287f042`](https://github.com/LedgerHQ/ledger-live/commit/287f04286e4933e31e31952a3ac6485e145e34f2), [`6fe6efb`](https://github.com/LedgerHQ/ledger-live/commit/6fe6efb9f2c9211d6002dd17f4369f90390021bf), [`48af604`](https://github.com/LedgerHQ/ledger-live/commit/48af6040c2835f067a2dfe38fb8fadde72e0787b), [`bc43337`](https://github.com/LedgerHQ/ledger-live/commit/bc433372ebed1990d81a87b109eeb4d928271315), [`43e1a21`](https://github.com/LedgerHQ/ledger-live/commit/43e1a21f2060d53875256b001e054cf0b1f7b86a)]:
  - @features/platform-card@0.6.0
  - @domain/api-card-management@0.7.0
  - @shared/ui-queued-bottom-sheet@0.5.0
  - @features/platform-pay-analytics@0.2.0

## 0.8.0-next.1

### Patch Changes

- Updated dependencies [[`48af604`](https://github.com/LedgerHQ/ledger-live/commit/48af6040c2835f067a2dfe38fb8fadde72e0787b)]:
  - @shared/ui-queued-bottom-sheet@0.5.0-next.1

## 0.8.0-next.0

### Minor Changes

- [#22003](https://github.com/LedgerHQ/ledger-live/pull/22003) [`40d296b`](https://github.com/LedgerHQ/ledger-live/commit/40d296b822381cc5d05616acafa1bca61e500dce) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Record the provider app the Card login redirect names, and send x-us-env on every Card request of a US holder

- [#22257](https://github.com/LedgerHQ/ledger-live/pull/22257) [`510465b`](https://github.com/LedgerHQ/ledger-live/commit/510465b5ac5808a42729dbea99aea081bf759e4a) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Expose settings redirect actions for Manage PIN, Access Baanx and Help on the card's More menu.
  The feature packages take already-resolved host callbacks and never build URLs or read env vars
  themselves — desktop opens Baanx pages through the existing hosted-page opener, mobile through the
  secure browser, and each app opens the Help article externally.

- [#22179](https://github.com/LedgerHQ/ledger-live/pull/22179) [`a1a8b81`](https://github.com/LedgerHQ/ledger-live/commit/a1a8b81b3f9b4eb897ac3d81427a1df0a5e0130b) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Let any part of the app ask for the app to be protected before it continues, and answer for it.

  A feature that needs protection — the Card, first — now awaits one call: `requestProtection()`. The prompt decides what to ask for, so no caller looks at biometry: biometrics if the device has some enrolled, a password otherwise. An already-protected user is never interrupted and their action simply runs.

  The password path opens the existing add-password flow and comes back with a confirmation sheet, so the caller resumes where it left off. Dismissing the prompt, or backing out of the password flow, holds the caller's action instead — a request never resolves as protected unless protection is actually in place.

  Both sheets are mounted once, above the screens, so navigating away no longer closes the prompt the way a screen-owned sheet would.

  The card is the first caller: both ways out of its login lead to the provider, so signing up and logging in each wait for protection. The card flow takes the request as a prop, since a flow package cannot reach the app's prompt, and only the native entry passes one — desktop has no app lock and is unchanged.

- [#22305](https://github.com/LedgerHQ/ledger-live/pull/22305) [`fd6b9d0`](https://github.com/LedgerHQ/ledger-live/commit/fd6b9d0b602e44c5520152c2307bd629f11afc7a) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Open the provider withdrawal page from a card asset.

  - `buildWithdrawalPath` addresses `/withdrawal`, with the same `app_id` and `currency` query as `buildTopUpPath`.
  - Desktop opens it on the hosted manifest, mobile in the secure browser, both with the asset pre-selected.
  - Mobile also pre-selects the asset on the top up page.
  - Every mobile hosted page now opens in the same secure browser session, which shares the cookies of the login. `openHostedLoginInSecureBrowser` becomes `openHostedUrlInSecureBrowser`, and `openHostedPageInSecureBrowser` is removed.
  - Every hosted path now lives in `state/hostedPaths.ts`: signup, top up, withdrawal, manage PIN and the Baanx root. `cardSettingsPaths.ts` is removed, and the package exports the same names as before.

- [#22050](https://github.com/LedgerHQ/ledger-live/pull/22050) [`954ffbd`](https://github.com/LedgerHQ/ledger-live/commit/954ffbdeb8172f555b637599d24cf2a94bcf24db) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - fix(pay-card): keep the session when only the card data fails to load

- [#22320](https://github.com/LedgerHQ/ledger-live/pull/22320) [`853e47d`](https://github.com/LedgerHQ/ledger-live/commit/853e47dac8f42644733686353c3f0f4a3fcc035a) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix the manage PIN hosted page to point at `/set-pin` instead of `/dashboard/card/details`, and name the US app on it for a US card holder, matching the access Baanx and asset pages

- [#22184](https://github.com/LedgerHQ/ledger-live/pull/22184) [`75038d5`](https://github.com/LedgerHQ/ledger-live/commit/75038d59735ac63ab43baf7bd298969890241b3b) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Open the provider's top up page from the card on mobile.

  - The Top up button takes the place of the disabled "Coming soon" action on the card face, and it comes back at the bottom of the card details sheet.
  - Mobile opens `/topup` in the secure browser, which carries the provider session. A US card holder gets the US `app_id` on the query, so the page reaches the US tenant.

- [#22183](https://github.com/LedgerHQ/ledger-live/pull/22183) [`d9d1111`](https://github.com/LedgerHQ/ledger-live/commit/d9d1111733e757cc58b6249fdda568dd56d40757) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Open the provider's top up page from the card on desktop.

  - `CardTopUpButton` carries the action. On desktop it stays at the bottom of the card panel, above the scrolling content.
  - Desktop opens `/topup` on the hosted live app manifest, the way the signup page already opens.
  - A US card holder gets the US `app_id` on the query, so the page reaches the US tenant.
  - Desktop ends the provider session in the webview on each entry of the Pay tab, so a session left behind by a top up cannot sign the previous holder back in. The login and the signup drop their own wipe: every one of them starts from an entry of the Pay tab.
  - The top up button in the asset details dialog opens the same page, with the asset pre-selected on the query.

- [#22301](https://github.com/LedgerHQ/ledger-live/pull/22301) [`6fe6efb`](https://github.com/LedgerHQ/ledger-live/commit/6fe6efb9f2c9211d6002dd17f4369f90390021bf) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Consume the shared Pay analytics provider across card flows.

### Patch Changes

- Updated dependencies [[`40d296b`](https://github.com/LedgerHQ/ledger-live/commit/40d296b822381cc5d05616acafa1bca61e500dce), [`4d1d640`](https://github.com/LedgerHQ/ledger-live/commit/4d1d64049a0bb0562a1a0c8ad2555fe967acdd7f), [`871e485`](https://github.com/LedgerHQ/ledger-live/commit/871e4854284a0b21e31b53ff0ac312010093d914), [`72367fc`](https://github.com/LedgerHQ/ledger-live/commit/72367fcf2343fa488008236f1005da589e6e3054), [`233e44e`](https://github.com/LedgerHQ/ledger-live/commit/233e44e3dd724cc9d4f14a02c7e62e39d2e9079b), [`6741356`](https://github.com/LedgerHQ/ledger-live/commit/67413566f84b895e6f4ae2b5d646bfc2e82c6926), [`dafadf0`](https://github.com/LedgerHQ/ledger-live/commit/dafadf005a54007d5430203c11b8718c1636a6e4), [`9652494`](https://github.com/LedgerHQ/ledger-live/commit/96524949cbf8fa1d102a0156f40004ff12a30475), [`5492648`](https://github.com/LedgerHQ/ledger-live/commit/5492648988e327c8e3e6e7d5ead1e0fa2bd9929e), [`c52af21`](https://github.com/LedgerHQ/ledger-live/commit/c52af21b622efa62774657e190abb9762cffac1c), [`d0fd787`](https://github.com/LedgerHQ/ledger-live/commit/d0fd787fb0e40b35f9d9c70307694d364f99b858), [`b97a3e5`](https://github.com/LedgerHQ/ledger-live/commit/b97a3e5462588d771a2ea5d628cfef7d564bc886), [`a915d4a`](https://github.com/LedgerHQ/ledger-live/commit/a915d4a577dfe7bb778364c4b0269bc61203075a), [`eb06f77`](https://github.com/LedgerHQ/ledger-live/commit/eb06f77c9548a2e4641c37da90c34b4fcffba667), [`75038d5`](https://github.com/LedgerHQ/ledger-live/commit/75038d59735ac63ab43baf7bd298969890241b3b), [`d9d1111`](https://github.com/LedgerHQ/ledger-live/commit/d9d1111733e757cc58b6249fdda568dd56d40757), [`287f042`](https://github.com/LedgerHQ/ledger-live/commit/287f04286e4933e31e31952a3ac6485e145e34f2), [`6fe6efb`](https://github.com/LedgerHQ/ledger-live/commit/6fe6efb9f2c9211d6002dd17f4369f90390021bf), [`bc43337`](https://github.com/LedgerHQ/ledger-live/commit/bc433372ebed1990d81a87b109eeb4d928271315), [`43e1a21`](https://github.com/LedgerHQ/ledger-live/commit/43e1a21f2060d53875256b001e054cf0b1f7b86a)]:
  - @features/platform-card@0.6.0-next.0
  - @domain/api-card-management@0.7.0-next.0
  - @shared/ui-queued-bottom-sheet@0.5.0-next.0
  - @features/platform-pay-analytics@0.2.0-next.0

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->

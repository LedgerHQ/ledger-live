# @features/flow-pay-card

## 0.4.0-next.0

### Minor Changes

- [#21928](https://github.com/LedgerHQ/ledger-live/pull/21928) [`1995d49`](https://github.com/LedgerHQ/ledger-live/commit/1995d49c63301199aef3e9a079f1d10fd0598f8b) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Render the card transaction history on mobile, inside the card details sheet overview

- [#21707](https://github.com/LedgerHQ/ledger-live/pull/21707) [`8f62cdb`](https://github.com/LedgerHQ/ledger-live/commit/8f62cdbb6d93e207efd7e551af65a41953d28242) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add View/Hide and a 3D flip for card numbers.

- [#21722](https://github.com/LedgerHQ/ledger-live/pull/21722) [`182fae7`](https://github.com/LedgerHQ/ledger-live/commit/182fae7fbfa81b42de061e67da8edf21a7f72281) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add a Card Details container with native artwork, Details sheet, and web composition

- [#21698](https://github.com/LedgerHQ/ledger-live/pull/21698) [`25224f4`](https://github.com/LedgerHQ/ledger-live/commit/25224f463b834dba7a2811d7150aeec6dbd6a3ac) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Move the More menu into card details and put freeze and More on one actions row

- [#21777](https://github.com/LedgerHQ/ledger-live/pull/21777) [`f7fa8f0`](https://github.com/LedgerHQ/ledger-live/commit/f7fa8f0ff23c03a69933f2d6aa6e0b225af9d542) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Resolve a single Pay Card display state so the card face, onboarding widget and login CTA no longer overlap, and hold them back until the stored session is read

- [#21958](https://github.com/LedgerHQ/ledger-live/pull/21958) [`1eb2e00`](https://github.com/LedgerHQ/ledger-live/commit/1eb2e00074fe05f103dd33c3fbf295cfd39e9c2e) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the desktop Pay Card transaction detail dialog.

- [#21790](https://github.com/LedgerHQ/ledger-live/pull/21790) [`e7d79ac`](https://github.com/LedgerHQ/ledger-live/commit/e7d79acf1d91e98e2813755f9bebdbfd83e89f39) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - refactor(pay-card): accept a pending login and a host page opener

  `CardProps`/`CardViewProps` now take one nested `login: CardLoginProps` instead of the loose `oauthConfig`, `callback` and `onTrackEvent` props. `CardLoginProps` carries those three and adds optional `openHostedLogin` and `openHostedPage`, so a host app can supply how the Card flow opens its hosted pages instead of the flow assuming one way to do it.

  The flow also ignores a stray login redirect from an abandoned attempt. A redirect from an attempt the user had already retried away from could still land after a fresh attempt started, get exchanged against the new attempt's verifier, fail, and wipe that new attempt. The authorize URL now carries a local attempt id that the app compares against the current attempt before acting on a redirect.

- [#21934](https://github.com/LedgerHQ/ledger-live/pull/21934) [`c5229d1`](https://github.com/LedgerHQ/ledger-live/commit/c5229d1b2bbf8d8067e036f0a34dda403519e206) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Pass host amount and date formatters as one object, using Desktop's date formatter for transaction dates.

- [#21917](https://github.com/LedgerHQ/ledger-live/pull/21917) [`a2a0288`](https://github.com/LedgerHQ/ledger-live/commit/a2a028844dbfbfa019f1f971bf6fdbed9005b9ec) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Show card transactions on the Pay Card panel as a list of items, with a subheader when the list is not empty.

- [#22023](https://github.com/LedgerHQ/ledger-live/pull/22023) [`0f4b55e`](https://github.com/LedgerHQ/ledger-live/commit/0f4b55e46459492e880a8e5e118b570a934ce4d7) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Polish Pay tab UI: square network icons, verify-address icon size, deposit dialog inset, header/balance spacing, and move card title/balance copy into the flow.

- [#21824](https://github.com/LedgerHQ/ledger-live/pull/21824) [`c88b5c6`](https://github.com/LedgerHQ/ledger-live/commit/c88b5c65b0488097e2a17071ca04ac06ae41763a) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Scroll the whole Pay tab: the content no longer gets clipped and clears the tab bar

- [#21771](https://github.com/LedgerHQ/ledger-live/pull/21771) [`6c1be58`](https://github.com/LedgerHQ/ledger-live/commit/6c1be58b4dbcce00cc114442d2aeb76278248d99) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add a shared CardAssets view-model that reads card-linked wallets (views still render nothing).

- [#21947](https://github.com/LedgerHQ/ledger-live/pull/21947) [`9d0b721`](https://github.com/LedgerHQ/ledger-live/commit/9d0b721dbfd8b71d32d2d16db22ad8e54f45f541) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the mobile Pay Card transaction detail sheet with tracking and copyable transaction IDs.

### Patch Changes

- Updated dependencies [[`9164e8b`](https://github.com/LedgerHQ/ledger-live/commit/9164e8b81ecb84e5d8ba0bb606981c2dc83d04c1), [`1995d49`](https://github.com/LedgerHQ/ledger-live/commit/1995d49c63301199aef3e9a079f1d10fd0598f8b), [`2e47336`](https://github.com/LedgerHQ/ledger-live/commit/2e4733627ccb62c39fdf1e7d4b9f7d22559609bf), [`8f62cdb`](https://github.com/LedgerHQ/ledger-live/commit/8f62cdbb6d93e207efd7e551af65a41953d28242), [`182fae7`](https://github.com/LedgerHQ/ledger-live/commit/182fae7fbfa81b42de061e67da8edf21a7f72281), [`ba31ece`](https://github.com/LedgerHQ/ledger-live/commit/ba31ece3a22febeafbec027840d16ea82c2dad5e), [`de19b3e`](https://github.com/LedgerHQ/ledger-live/commit/de19b3e4e56a0c28fcc1a3ca929059e84fc7bebf), [`25224f4`](https://github.com/LedgerHQ/ledger-live/commit/25224f463b834dba7a2811d7150aeec6dbd6a3ac), [`f7fa8f0`](https://github.com/LedgerHQ/ledger-live/commit/f7fa8f0ff23c03a69933f2d6aa6e0b225af9d542), [`1eb2e00`](https://github.com/LedgerHQ/ledger-live/commit/1eb2e00074fe05f103dd33c3fbf295cfd39e9c2e), [`799219e`](https://github.com/LedgerHQ/ledger-live/commit/799219e262e80a339272113ea164fa506243b438), [`939300a`](https://github.com/LedgerHQ/ledger-live/commit/939300add757537632def29302a24a72a67f84b6), [`cef83ae`](https://github.com/LedgerHQ/ledger-live/commit/cef83ae58ffc5529bebda292737502e78e3b7522), [`a6a7a94`](https://github.com/LedgerHQ/ledger-live/commit/a6a7a946b1c1dbdda1cfa2c049f536f7235ddde2), [`c6f7bfe`](https://github.com/LedgerHQ/ledger-live/commit/c6f7bfead8593c148fe6e3d177ff8dd734728f5a), [`0e1e102`](https://github.com/LedgerHQ/ledger-live/commit/0e1e10227aa5cc0d19e8a142533c54838e3ed57e), [`34f8541`](https://github.com/LedgerHQ/ledger-live/commit/34f8541ae58847dcee784b3fe97f227edd644775), [`eddc89e`](https://github.com/LedgerHQ/ledger-live/commit/eddc89e7b86a13aeedfc0ae4956c2dcd08494e5f), [`b976cda`](https://github.com/LedgerHQ/ledger-live/commit/b976cda52320ef3f778fc11b4f95d2c5bf54ffe0), [`e7d79ac`](https://github.com/LedgerHQ/ledger-live/commit/e7d79acf1d91e98e2813755f9bebdbfd83e89f39), [`c5229d1`](https://github.com/LedgerHQ/ledger-live/commit/c5229d1b2bbf8d8067e036f0a34dda403519e206), [`37f5759`](https://github.com/LedgerHQ/ledger-live/commit/37f57595f11d40562914794645cb3c7f6e55dc8b), [`a2a0288`](https://github.com/LedgerHQ/ledger-live/commit/a2a028844dbfbfa019f1f971bf6fdbed9005b9ec), [`6553e61`](https://github.com/LedgerHQ/ledger-live/commit/6553e61da87bd604a357d5a79eefd3ac17e225d1), [`19314ca`](https://github.com/LedgerHQ/ledger-live/commit/19314cafec3eee0803bee7f9b877c9e9ccc819e8), [`c88b5c6`](https://github.com/LedgerHQ/ledger-live/commit/c88b5c65b0488097e2a17071ca04ac06ae41763a), [`a5d438e`](https://github.com/LedgerHQ/ledger-live/commit/a5d438e3c6cd557e8c77f2f40be2c20540f23cec), [`9d0b721`](https://github.com/LedgerHQ/ledger-live/commit/9d0b721dbfd8b71d32d2d16db22ad8e54f45f541), [`529a7fc`](https://github.com/LedgerHQ/ledger-live/commit/529a7fc909409f4f5740ce8add9abbab1b784157), [`d353658`](https://github.com/LedgerHQ/ledger-live/commit/d353658a0254e49a369ca7481c9680254e9e4851)]:
  - @features/flow-pay-card-details@0.4.0-next.0
  - @features/flow-pay-card-transactions@0.2.0-next.0
  - @features/flow-pay-card-auth@0.7.0-next.0
  - @features/flow-pay-card-wallets@0.3.0-next.0
  - @features/flow-pay-card-widget@0.3.0-next.0
  - @shared/i18n@0.2.0

## 0.3.0

### Minor Changes

- [#21550](https://github.com/LedgerHQ/ledger-live/pull/21550) [`6ed1820`](https://github.com/LedgerHQ/ledger-live/commit/6ed1820776ca6ba59e861da11e4582af406b2188) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Mount and persist the card onboarding widget in Ledger Wallet Desktop.

- [#21610](https://github.com/LedgerHQ/ledger-live/pull/21610) [`6b47659`](https://github.com/LedgerHQ/ledger-live/commit/6b4765929e98abbcb08cd5348fddb528a9e674e7) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add native card onboarding widget on mobile with Apple/Google Pay step and wallet persistence

- [#21632](https://github.com/LedgerHQ/ledger-live/pull/21632) [`5f6b8a8`](https://github.com/LedgerHQ/ledger-live/commit/5f6b8a88709d1fd4a94fccaaab915d5ad322c584) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - add freeze button in desktop app

- [#21428](https://github.com/LedgerHQ/ledger-live/pull/21428) [`c3de11c`](https://github.com/LedgerHQ/ledger-live/commit/c3de11cdf58c4feac701435548bbb96819ae09f6) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Show a Card login intro sheet on the first press of the card's action (LIVE-36793). The sheet has two
  buttons. "Log in to Baanx" runs the OAuth2 hosted login. "Create an account" opens the provider's
  own signup page, `/onboarding/signup` on the new `CARD_BAANX_HOSTED_UI` host, in the same browser. The
  intro shows once: a new persisted `payCardLoginIntro` flag goes up when a login the card holder just
  started reaches `ready`, and it survives an app restart inside the shared `payCard` blob. A hydrated
  session raises nothing. A tester resets the flag from the Pay Card devtool, and the intro shows again
  on the next press.

  The same flag now picks what the login block says, from the app's new `payTab.cardLogin.*` keys. It
  sells the card while the flag is down — "Get 1% cashback every time you spend" under a `Get card`
  button that opens the intro — and offers a login once the flag is up: "Log in to access your card"
  under a `Login` button that starts one. Its title is `Crypto Card`, and on mobile it is a Lumen
  `Subheader` under the card face, so the Pay Card flow no longer draws a section title above it there.
  Desktop keeps its host-provided title.

  The virtual card row names one wallet only: Apple Pay on iOS, Google Pay on Android. Desktop cannot
  see the phone the card will be added to, so it keeps naming both. Each row wraps its title and its
  description over as many lines as the copy needs, instead of cutting both off at the first.

  Hosts inject `onTrackEvent`. Get card, Login, the intro buttons and close fire `button_clicked`;
  opening the intro also fires `Page card login intro`.

  `CARD_BAANX_HOSTED_UI` defaults to `https://ledger-ew1uat.baanxapi.com`. Both apps read it with
  `useEnv` and hand it to the flow as `oauthConfig.hostedUiUrl`, so a new value moves the signup page
  to another tenant without a restart.

### Patch Changes

- Updated dependencies [[`d01e4c0`](https://github.com/LedgerHQ/ledger-live/commit/d01e4c02a513082f6484c405f9a51977f14a6c03), [`6b47659`](https://github.com/LedgerHQ/ledger-live/commit/6b4765929e98abbcb08cd5348fddb528a9e674e7), [`b1b1e38`](https://github.com/LedgerHQ/ledger-live/commit/b1b1e38d2a8311f935f30c185276c165a6992dbc), [`c3de11c`](https://github.com/LedgerHQ/ledger-live/commit/c3de11cdf58c4feac701435548bbb96819ae09f6), [`3de7317`](https://github.com/LedgerHQ/ledger-live/commit/3de7317d858c570600eb0a4297876327fdc2c7b5), [`faa8ef1`](https://github.com/LedgerHQ/ledger-live/commit/faa8ef11055a27af3eb7bcf1b662e8bf5c3da77d), [`2bd6a1c`](https://github.com/LedgerHQ/ledger-live/commit/2bd6a1c4b9d0cd229a8c9207108672b1a580968a)]:
  - @features/flow-pay-card-details@0.3.0
  - @features/flow-pay-card-widget@0.2.0
  - @features/flow-pay-card-auth@0.6.0

## 0.3.0-next.0

### Minor Changes

- [#21550](https://github.com/LedgerHQ/ledger-live/pull/21550) [`6ed1820`](https://github.com/LedgerHQ/ledger-live/commit/6ed1820776ca6ba59e861da11e4582af406b2188) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Mount and persist the card onboarding widget in Ledger Wallet Desktop.

- [#21610](https://github.com/LedgerHQ/ledger-live/pull/21610) [`6b47659`](https://github.com/LedgerHQ/ledger-live/commit/6b4765929e98abbcb08cd5348fddb528a9e674e7) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add native card onboarding widget on mobile with Apple/Google Pay step and wallet persistence

- [#21632](https://github.com/LedgerHQ/ledger-live/pull/21632) [`5f6b8a8`](https://github.com/LedgerHQ/ledger-live/commit/5f6b8a88709d1fd4a94fccaaab915d5ad322c584) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - add freeze button in desktop app

- [#21428](https://github.com/LedgerHQ/ledger-live/pull/21428) [`c3de11c`](https://github.com/LedgerHQ/ledger-live/commit/c3de11cdf58c4feac701435548bbb96819ae09f6) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Show a Card login intro sheet on the first press of the card's action (LIVE-36793). The sheet has two
  buttons. "Log in to Baanx" runs the OAuth2 hosted login. "Create an account" opens the provider's
  own signup page, `/onboarding/signup` on the new `CARD_BAANX_HOSTED_UI` host, in the same browser. The
  intro shows once: a new persisted `payCardLoginIntro` flag goes up when a login the card holder just
  started reaches `ready`, and it survives an app restart inside the shared `payCard` blob. A hydrated
  session raises nothing. A tester resets the flag from the Pay Card devtool, and the intro shows again
  on the next press.

  The same flag now picks what the login block says, from the app's new `payTab.cardLogin.*` keys. It
  sells the card while the flag is down — "Get 1% cashback every time you spend" under a `Get card`
  button that opens the intro — and offers a login once the flag is up: "Log in to access your card"
  under a `Login` button that starts one. Its title is `Crypto Card`, and on mobile it is a Lumen
  `Subheader` under the card face, so the Pay Card flow no longer draws a section title above it there.
  Desktop keeps its host-provided title.

  The virtual card row names one wallet only: Apple Pay on iOS, Google Pay on Android. Desktop cannot
  see the phone the card will be added to, so it keeps naming both. Each row wraps its title and its
  description over as many lines as the copy needs, instead of cutting both off at the first.

  Hosts inject `onTrackEvent`. Get card, Login, the intro buttons and close fire `button_clicked`;
  opening the intro also fires `Page card login intro`.

  `CARD_BAANX_HOSTED_UI` defaults to `https://ledger-ew1uat.baanxapi.com`. Both apps read it with
  `useEnv` and hand it to the flow as `oauthConfig.hostedUiUrl`, so a new value moves the signup page
  to another tenant without a restart.

### Patch Changes

- Updated dependencies [[`d01e4c0`](https://github.com/LedgerHQ/ledger-live/commit/d01e4c02a513082f6484c405f9a51977f14a6c03), [`6b47659`](https://github.com/LedgerHQ/ledger-live/commit/6b4765929e98abbcb08cd5348fddb528a9e674e7), [`b1b1e38`](https://github.com/LedgerHQ/ledger-live/commit/b1b1e38d2a8311f935f30c185276c165a6992dbc), [`c3de11c`](https://github.com/LedgerHQ/ledger-live/commit/c3de11cdf58c4feac701435548bbb96819ae09f6), [`3de7317`](https://github.com/LedgerHQ/ledger-live/commit/3de7317d858c570600eb0a4297876327fdc2c7b5), [`faa8ef1`](https://github.com/LedgerHQ/ledger-live/commit/faa8ef11055a27af3eb7bcf1b662e8bf5c3da77d), [`2bd6a1c`](https://github.com/LedgerHQ/ledger-live/commit/2bd6a1c4b9d0cd229a8c9207108672b1a580968a)]:
  - @features/flow-pay-card-details@0.3.0-next.0
  - @features/flow-pay-card-widget@0.2.0-next.0
  - @features/flow-pay-card-auth@0.6.0-next.0

## 0.2.0

### Minor Changes

- [#21244](https://github.com/LedgerHQ/ledger-live/pull/21244) [`f4986f8`](https://github.com/LedgerHQ/ledger-live/commit/f4986f882385e07dbd531d99a0571c67ca91ada0) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Show a host-provided Crypto card title on the Pay Card web and native views

- [#21363](https://github.com/LedgerHQ/ledger-live/pull/21363) [`ce47443`](https://github.com/LedgerHQ/ledger-live/commit/ce47443e97f559210443547a7948ef61c01f7feb) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Read CARD_API_URL and CARD_BAANX_CLIENT_KEY on every use, and not one time at boot. The debug settings can now change the Card tenant without a restart. The mobile app also applies its `.env` values before the store reads them.

- [#21099](https://github.com/LedgerHQ/ledger-live/pull/21099) [`c8614bf`](https://github.com/LedgerHQ/ledger-live/commit/c8614bfbfd1dc8de12731c2c333b9d137f0f2f93) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add `@features/flow-pay-card`, a Contacts-style orchestrator that aggregates the Pay Card leaf flows behind a single `Card` entry point. It follows the app MVVM split — a `Card` container wires a shared `useCardViewModel` to the platform `CardView` — and composes the card face from `@features/flow-pay-card-details` (`CardVisual` with the balance overlay, or the bare `CardArtwork`) with the authentication controls (`CardLogin` / `CardLogout` from `@features/flow-pay-card-auth`), each of which still decides on its own whether it belongs on screen.

  The flow owns the (currently mocked) card balance and assembles the overlay itself, so hosts no longer pass a pre-built visual: they hand over only what they alone know — `formatCountervalue` (needs the app's locale and counter-value currency) and `balanceLabel` (i18n). Both apps now mount `Card` instead of wiring `CardLogin` / `CardLogout` directly: desktop in the Pay tab's right panel, mobile in the Pay tab body. The package composes rather than re-exports: apps that need a single leaf or its Redux state (`@features/flow-pay-card-auth/state`) keep importing that leaf directly.

### Patch Changes

- Updated dependencies [[`0500726`](https://github.com/LedgerHQ/ledger-live/commit/05007264f5b1726a21c2e545a10c18993fd2fcb5), [`ad1c0ff`](https://github.com/LedgerHQ/ledger-live/commit/ad1c0ff93b94ba9a0b1e7409e5ddbdc2d73bcd30)]:
  - @features/flow-pay-card-auth@0.5.0
  - @features/flow-pay-card-details@0.2.0

## 0.2.0-next.0

### Minor Changes

- [#21244](https://github.com/LedgerHQ/ledger-live/pull/21244) [`f4986f8`](https://github.com/LedgerHQ/ledger-live/commit/f4986f882385e07dbd531d99a0571c67ca91ada0) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Show a host-provided Crypto card title on the Pay Card web and native views

- [#21363](https://github.com/LedgerHQ/ledger-live/pull/21363) [`ce47443`](https://github.com/LedgerHQ/ledger-live/commit/ce47443e97f559210443547a7948ef61c01f7feb) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Read CARD_API_URL and CARD_BAANX_CLIENT_KEY on every use, and not one time at boot. The debug settings can now change the Card tenant without a restart. The mobile app also applies its `.env` values before the store reads them.

- [#21099](https://github.com/LedgerHQ/ledger-live/pull/21099) [`c8614bf`](https://github.com/LedgerHQ/ledger-live/commit/c8614bfbfd1dc8de12731c2c333b9d137f0f2f93) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add `@features/flow-pay-card`, a Contacts-style orchestrator that aggregates the Pay Card leaf flows behind a single `Card` entry point. It follows the app MVVM split — a `Card` container wires a shared `useCardViewModel` to the platform `CardView` — and composes the card face from `@features/flow-pay-card-details` (`CardVisual` with the balance overlay, or the bare `CardArtwork`) with the authentication controls (`CardLogin` / `CardLogout` from `@features/flow-pay-card-auth`), each of which still decides on its own whether it belongs on screen.

  The flow owns the (currently mocked) card balance and assembles the overlay itself, so hosts no longer pass a pre-built visual: they hand over only what they alone know — `formatCountervalue` (needs the app's locale and counter-value currency) and `balanceLabel` (i18n). Both apps now mount `Card` instead of wiring `CardLogin` / `CardLogout` directly: desktop in the Pay tab's right panel, mobile in the Pay tab body. The package composes rather than re-exports: apps that need a single leaf or its Redux state (`@features/flow-pay-card-auth/state`) keep importing that leaf directly.

### Patch Changes

- Updated dependencies [[`0500726`](https://github.com/LedgerHQ/ledger-live/commit/05007264f5b1726a21c2e545a10c18993fd2fcb5), [`ad1c0ff`](https://github.com/LedgerHQ/ledger-live/commit/ad1c0ff93b94ba9a0b1e7409e5ddbdc2d73bcd30)]:
  - @features/flow-pay-card-auth@0.5.0-next.0
  - @features/flow-pay-card-details@0.2.0

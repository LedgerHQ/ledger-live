# @devtools/bindings

## 0.8.0-next.0

### Minor Changes

- [#21569](https://github.com/LedgerHQ/ledger-live/pull/21569) [`799219e`](https://github.com/LedgerHQ/ledger-live/commit/799219e262e80a339272113ea164fa506243b438) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Resolve a card-linked wallet to the Ledger currency it holds.

  - New `@domain/entity-card-asset-mapping` maps a card provider's `{currency}.{network}` id onto a Ledger currency id. `baanxCatalog.ts` holds Baanx's, covering USDT, USDC, BTC, ETH, XRP, SOL and LTC; a second provider is a second catalog beside it.
  - Several of Baanx's keys map onto one currency: its docs name the chain, its sandbox has answered with the ticker repeated, and both resolve.
  - `getCardLinkedWallets` attaches `ledgerId` in its transform, so every consumer reads one answer rather than mapping again.
  - The join and the devtool carry it through; an unmapped pair has no `ledgerId` at all rather than resolving to a wrong currency.
  - A "Currency Mapping" screen in the devtool lists the whole catalog, scrollable both ways, so a gap can be read against it.

- [#21195](https://github.com/LedgerHQ/ledger-live/pull/21195) [`cef83ae`](https://github.com/LedgerHQ/ledger-live/commit/cef83ae58ffc5529bebda292737502e78e3b7522) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Add Card session and MSW renewal controls to the Card / Pay DevTool.

- [#21918](https://github.com/LedgerHQ/ledger-live/pull/21918) [`fcc2ac4`](https://github.com/LedgerHQ/ledger-live/commit/fcc2ac4c5ed270fb63df4c0079068ad6dac94612) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Sign a mock Card session in and out from the Pay Card DevTool, and answer the Card endpoints from the desktop MSW worker, so the Card surfaces can be reached without the hosted login.

- [#21626](https://github.com/LedgerHQ/ledger-live/pull/21626) [`eddc89e`](https://github.com/LedgerHQ/ledger-live/commit/eddc89e7b86a13aeedfc0ae4956c2dcd08494e5f) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Show and drive the derived card onboarding status from the Card / Pay devtool.

  - A "Card onboarding" screen: a `Stepper` for the count, every step by the id the app keys it on, and the derived answer printed raw so a step can be traced to the response behind it.
  - Each step a request decides carries a toggle. It sets what that endpoint answers, so the step follows on the next read and holds until it is cleared. The phone wallet step is answered on the device; the purchase step is read-only while nothing answers it.
  - An endpoint answers from the provider until its toggle is used, so one step can be held while the rest stay real, and "Use the real answers" hands them all back.
  - `@domain/api-card-management/mock/card-onboarding-status` holds those answers and the responses that carry them; the mobile MSW handlers read it before falling back to what they answered before.
  - Mocking is started by an env var, so without it the screen says so instead of offering a toggle that would set an answer nothing reads.
  - The hook gains `refresh`, which re-asks all three sources: the screen asks on open and on demand.

### Patch Changes

- Updated dependencies [[`8f62cdb`](https://github.com/LedgerHQ/ledger-live/commit/8f62cdbb6d93e207efd7e551af65a41953d28242), [`182fae7`](https://github.com/LedgerHQ/ledger-live/commit/182fae7fbfa81b42de061e67da8edf21a7f72281), [`de19b3e`](https://github.com/LedgerHQ/ledger-live/commit/de19b3e4e56a0c28fcc1a3ca929059e84fc7bebf), [`25224f4`](https://github.com/LedgerHQ/ledger-live/commit/25224f463b834dba7a2811d7150aeec6dbd6a3ac), [`96a1ca9`](https://github.com/LedgerHQ/ledger-live/commit/96a1ca9fef1b0acc8113708c148890054dea143d), [`f7fa8f0`](https://github.com/LedgerHQ/ledger-live/commit/f7fa8f0ff23c03a69933f2d6aa6e0b225af9d542), [`85e01c4`](https://github.com/LedgerHQ/ledger-live/commit/85e01c449dab75d75851631a56d292f2cb0c5b36), [`799219e`](https://github.com/LedgerHQ/ledger-live/commit/799219e262e80a339272113ea164fa506243b438), [`e37413b`](https://github.com/LedgerHQ/ledger-live/commit/e37413b588873a1a2a028ebf4c1971e4fa92ed2a), [`9e61582`](https://github.com/LedgerHQ/ledger-live/commit/9e61582edfcbb98046d0f74111ccf4061ec44bb3), [`da3d09d`](https://github.com/LedgerHQ/ledger-live/commit/da3d09d75d7dcae659611cd371c48d75c03f7ae4), [`7e44af4`](https://github.com/LedgerHQ/ledger-live/commit/7e44af495eccab1fac4b0808d6729a595b610c69), [`600d432`](https://github.com/LedgerHQ/ledger-live/commit/600d432657f1c9adf80af6730dd28f2177e05c5a), [`7050652`](https://github.com/LedgerHQ/ledger-live/commit/70506520dafbccca4e014ac30d75647a5b7fe7d0), [`dc204a7`](https://github.com/LedgerHQ/ledger-live/commit/dc204a7633e6f7c9acb66fbb18a6aeaa2e75c4bb), [`903c180`](https://github.com/LedgerHQ/ledger-live/commit/903c1802ea5d4cc3fe1bfe5609b8cf3871152cf0), [`cef83ae`](https://github.com/LedgerHQ/ledger-live/commit/cef83ae58ffc5529bebda292737502e78e3b7522), [`3f34609`](https://github.com/LedgerHQ/ledger-live/commit/3f34609edecc5ae85a9a9ac1b76ab47e30a9c66e), [`a6a7a94`](https://github.com/LedgerHQ/ledger-live/commit/a6a7a946b1c1dbdda1cfa2c049f536f7235ddde2), [`c6f7bfe`](https://github.com/LedgerHQ/ledger-live/commit/c6f7bfead8593c148fe6e3d177ff8dd734728f5a), [`0e1e102`](https://github.com/LedgerHQ/ledger-live/commit/0e1e10227aa5cc0d19e8a142533c54838e3ed57e), [`34f8541`](https://github.com/LedgerHQ/ledger-live/commit/34f8541ae58847dcee784b3fe97f227edd644775), [`fcc2ac4`](https://github.com/LedgerHQ/ledger-live/commit/fcc2ac4c5ed270fb63df4c0079068ad6dac94612), [`eddc89e`](https://github.com/LedgerHQ/ledger-live/commit/eddc89e7b86a13aeedfc0ae4956c2dcd08494e5f), [`b976cda`](https://github.com/LedgerHQ/ledger-live/commit/b976cda52320ef3f778fc11b4f95d2c5bf54ffe0), [`e7d79ac`](https://github.com/LedgerHQ/ledger-live/commit/e7d79acf1d91e98e2813755f9bebdbfd83e89f39), [`37f5759`](https://github.com/LedgerHQ/ledger-live/commit/37f57595f11d40562914794645cb3c7f6e55dc8b), [`a2a0288`](https://github.com/LedgerHQ/ledger-live/commit/a2a028844dbfbfa019f1f971bf6fdbed9005b9ec), [`8b3320d`](https://github.com/LedgerHQ/ledger-live/commit/8b3320d7aab0ff25eeb8930dafa536fb94962c79), [`e65a6b3`](https://github.com/LedgerHQ/ledger-live/commit/e65a6b3e67e271343b7029613498176b1da2d7d2), [`4ac2794`](https://github.com/LedgerHQ/ledger-live/commit/4ac2794b8244b094f2e91563bb7ad8a220d6cba5), [`2edc7c8`](https://github.com/LedgerHQ/ledger-live/commit/2edc7c8d47b1ac8b49194155be8f8b3722574d39), [`0f4b55e`](https://github.com/LedgerHQ/ledger-live/commit/0f4b55e46459492e880a8e5e118b570a934ce4d7), [`c88b5c6`](https://github.com/LedgerHQ/ledger-live/commit/c88b5c65b0488097e2a17071ca04ac06ae41763a), [`9d0b721`](https://github.com/LedgerHQ/ledger-live/commit/9d0b721dbfd8b71d32d2d16db22ad8e54f45f541), [`d353658`](https://github.com/LedgerHQ/ledger-live/commit/d353658a0254e49a369ca7481c9680254e9e4851), [`b49d5b5`](https://github.com/LedgerHQ/ledger-live/commit/b49d5b573e84bd63ac460ae398657f1035613141)]:
  - @domain/api-card-management@0.6.0-next.0
  - @features/flow-pay-card-auth@0.7.0-next.0
  - @shared/feature-flags@0.23.0-next.0
  - @features/platform-feature-flags@0.7.0-next.0
  - @domain/entity-card-asset-mapping@0.6.0-next.0
  - @features/flow-pay-card-wallets@0.3.0-next.0
  - @shared/env@0.7.0-next.0
  - @features/flow-pay-card-widget@0.3.0-next.0
  - @features/flow-pay-request@0.5.0-next.0
  - @features/platform-card@0.5.0-next.0
  - @features/flow-pay-feature-tour@0.5.1-next.0
  - @devtools/registry@0.4.3-next.0
  - @shared/api-services@0.7.0

## 0.7.0

### Minor Changes

- [#21422](https://github.com/LedgerHQ/ledger-live/pull/21422) [`81aa729`](https://github.com/LedgerHQ/ledger-live/commit/81aa7294c94ef114e6e82ec4c277f0a6c0038c92) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add a DevTools reset for the Pay Request verify hint, plus mobile shortcuts to Portfolio and Pay.

- [#21418](https://github.com/LedgerHQ/ledger-live/pull/21418) [`60ee73c`](https://github.com/LedgerHQ/ledger-live/commit/60ee73c7b89b101dde708a04ded260341ef86d44) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Rename `CARD_API_URL` to `CARD_BAANX_API_URL`, keep the production defaults, and drop the Env vars section from the Card / Pay DevTool.

- [#21552](https://github.com/LedgerHQ/ledger-live/pull/21552) [`ef29f07`](https://github.com/LedgerHQ/ledger-live/commit/ef29f0711ecec104e4dd9c9d86d4e4d41c4ddee3) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add controls for card onboarding progress and dismiss state to the Pay Card DevTool.

- [#21368](https://github.com/LedgerHQ/ledger-live/pull/21368) [`d6b290b`](https://github.com/LedgerHQ/ledger-live/commit/d6b290b37b8ad6f677ab382bef53bf05cd394ca2) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Add an "Env vars" section to the Card / Pay DevTool. It shows the value the app reads for CARD_API_URL and CARD_BAANX_CLIENT_KEY, and it sets either one from an input. Each input starts on the Baanx development tenant, so a tester switches with one press.

- [#21448](https://github.com/LedgerHQ/ledger-live/pull/21448) [`0a02a32`](https://github.com/LedgerHQ/ledger-live/commit/0a02a325f99033c086864b0778a8f81c3b4178ae) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Add a "Balance" screen to the Card / Pay devtool.

  - Three sections: "Baanx wallets" and "Card linked wallets" are the two wallet responses exactly as they arrived, "Card linked combined wallets" is the join the app builds from them.
  - Every field is shown unformatted, the provider's own unmapped `currency` and `network` ids included, so a currency-mapping gap can be read off the screen.
  - A joined row with no Baanx wallet behind it says so rather than reading as a zero.
  - Each section counts what it got, so an empty answer does not read as a missing one.
  - Names the endpoint that failed and prints what it answered, rather than reporting that something failed.
  - A refresh button refetches both.
  - Opening the screen is what requests them; the tool mounts without reading anything.

- [#21468](https://github.com/LedgerHQ/ledger-live/pull/21468) [`66c7569`](https://github.com/LedgerHQ/ledger-live/commit/66c7569dcfae90739b369ffb3a92cee75dd2e9cd) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Show the secure card details image in the Card interaction screen.

  - A placeholder stands in for the card until it is pressed, then the provider's image replaces it.
  - The image loads straight from the returned URL: its token is the whole credential, so no headers are needed.
  - Leaving the screen drops the URL, because the provider spends it on first use and a stale one renders nothing.
  - The URL is never rendered as text.
  - The image loads with `cache: "reload"`: the token is spent on first use, so a cache hit is the only way it could be seen twice.
  - Asks for the card and PAN colours per colour scheme, so the card number reads as its own surface against the card body.

- [#21444](https://github.com/LedgerHQ/ledger-live/pull/21444) [`543b17d`](https://github.com/LedgerHQ/ledger-live/commit/543b17d7a6b49728001c0311c184c665e8c9bbb2) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Add a "Card interaction" screen to the Card / Pay devtool.

  - Calls a signed-in cardholder's endpoints on demand and prints what they answer, so the data can be checked before any screen renders it.
  - First probe: card status. Probes are a list, so further endpoints are one entry each.
  - Exports `useLazyGetCardStatusQuery`, which a button-triggered fetch needs.
  - Native only for now.

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

- Updated dependencies [[`3d23fd4`](https://github.com/LedgerHQ/ledger-live/commit/3d23fd471fbb0ba76a0e6997eba995e190a89f7c), [`b7f83a1`](https://github.com/LedgerHQ/ledger-live/commit/b7f83a1c1818e4eff9ffbf19796a71d7242fd5b4), [`c270975`](https://github.com/LedgerHQ/ledger-live/commit/c2709750e007b758fa13f0f717efa897fcc6235d), [`60ee73c`](https://github.com/LedgerHQ/ledger-live/commit/60ee73c7b89b101dde708a04ded260341ef86d44), [`55bd216`](https://github.com/LedgerHQ/ledger-live/commit/55bd2166238ab3e03c33226bb5f5eb2e8646a818), [`6b47659`](https://github.com/LedgerHQ/ledger-live/commit/6b4765929e98abbcb08cd5348fddb528a9e674e7), [`b1b1e38`](https://github.com/LedgerHQ/ledger-live/commit/b1b1e38d2a8311f935f30c185276c165a6992dbc), [`8993c24`](https://github.com/LedgerHQ/ledger-live/commit/8993c242de8ed57617fb74ac9a3b1af047638914), [`ebb1371`](https://github.com/LedgerHQ/ledger-live/commit/ebb13714a6de9c39f290b2ccd51ca78370824f6f), [`5e971b5`](https://github.com/LedgerHQ/ledger-live/commit/5e971b55429cdcab0f69825ce2056fef24d30215), [`b7a8906`](https://github.com/LedgerHQ/ledger-live/commit/b7a89064587bbcd1f758f7b6205a616225ac2317), [`761cf3e`](https://github.com/LedgerHQ/ledger-live/commit/761cf3e359fa197d07f6086d8522fd1785ba575d), [`08ee05c`](https://github.com/LedgerHQ/ledger-live/commit/08ee05cfb66f393b14fdf1377ed6c54c4831a87c), [`543b17d`](https://github.com/LedgerHQ/ledger-live/commit/543b17d7a6b49728001c0311c184c665e8c9bbb2), [`a7d54c0`](https://github.com/LedgerHQ/ledger-live/commit/a7d54c0d6af65abe7aa2170053b3fd07ae9b05ab), [`b053fc7`](https://github.com/LedgerHQ/ledger-live/commit/b053fc79c49c604e765ac7d3d793471196be9ae1), [`c3de11c`](https://github.com/LedgerHQ/ledger-live/commit/c3de11cdf58c4feac701435548bbb96819ae09f6), [`3de7317`](https://github.com/LedgerHQ/ledger-live/commit/3de7317d858c570600eb0a4297876327fdc2c7b5), [`d60ce38`](https://github.com/LedgerHQ/ledger-live/commit/d60ce38581fe06b7f4fa72ba40259af2eabfe11f), [`7aa3071`](https://github.com/LedgerHQ/ledger-live/commit/7aa3071a532c98804a4357ff36a001b23351da73), [`faa8ef1`](https://github.com/LedgerHQ/ledger-live/commit/faa8ef11055a27af3eb7bcf1b662e8bf5c3da77d), [`2bd6a1c`](https://github.com/LedgerHQ/ledger-live/commit/2bd6a1c4b9d0cd229a8c9207108672b1a580968a), [`d54d191`](https://github.com/LedgerHQ/ledger-live/commit/d54d19127a958bb0ac8c9c479bba716ce67041ff)]:
  - @features/flow-pay-request@0.4.0
  - @shared/env@0.6.0
  - @domain/api-card-management@0.5.0
  - @features/flow-pay-card-widget@0.2.0
  - @shared/feature-flags@0.22.0
  - @features/flow-pay-card-wallets@0.2.0
  - @features/flow-pay-card-auth@0.6.0
  - @features/flow-pay-feature-tour@0.5.0
  - @devtools/registry@0.4.2
  - @features/platform-feature-flags@0.6.9

## 0.7.0-next.1

### Patch Changes

- Updated dependencies [[`8993c24`](https://github.com/LedgerHQ/ledger-live/commit/8993c242de8ed57617fb74ac9a3b1af047638914)]:
  - @shared/feature-flags@0.22.0-next.1
  - @features/platform-feature-flags@0.6.9-next.1
  - @devtools/registry@0.4.2-next.1

## 0.7.0-next.0

### Minor Changes

- [#21422](https://github.com/LedgerHQ/ledger-live/pull/21422) [`81aa729`](https://github.com/LedgerHQ/ledger-live/commit/81aa7294c94ef114e6e82ec4c277f0a6c0038c92) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add a DevTools reset for the Pay Request verify hint, plus mobile shortcuts to Portfolio and Pay.

- [#21418](https://github.com/LedgerHQ/ledger-live/pull/21418) [`60ee73c`](https://github.com/LedgerHQ/ledger-live/commit/60ee73c7b89b101dde708a04ded260341ef86d44) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Rename `CARD_API_URL` to `CARD_BAANX_API_URL`, keep the production defaults, and drop the Env vars section from the Card / Pay DevTool.

- [#21552](https://github.com/LedgerHQ/ledger-live/pull/21552) [`ef29f07`](https://github.com/LedgerHQ/ledger-live/commit/ef29f0711ecec104e4dd9c9d86d4e4d41c4ddee3) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add controls for card onboarding progress and dismiss state to the Pay Card DevTool.

- [#21368](https://github.com/LedgerHQ/ledger-live/pull/21368) [`d6b290b`](https://github.com/LedgerHQ/ledger-live/commit/d6b290b37b8ad6f677ab382bef53bf05cd394ca2) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Add an "Env vars" section to the Card / Pay DevTool. It shows the value the app reads for CARD_API_URL and CARD_BAANX_CLIENT_KEY, and it sets either one from an input. Each input starts on the Baanx development tenant, so a tester switches with one press.

- [#21448](https://github.com/LedgerHQ/ledger-live/pull/21448) [`0a02a32`](https://github.com/LedgerHQ/ledger-live/commit/0a02a325f99033c086864b0778a8f81c3b4178ae) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Add a "Balance" screen to the Card / Pay devtool.

  - Three sections: "Baanx wallets" and "Card linked wallets" are the two wallet responses exactly as they arrived, "Card linked combined wallets" is the join the app builds from them.
  - Every field is shown unformatted, the provider's own unmapped `currency` and `network` ids included, so a currency-mapping gap can be read off the screen.
  - A joined row with no Baanx wallet behind it says so rather than reading as a zero.
  - Each section counts what it got, so an empty answer does not read as a missing one.
  - Names the endpoint that failed and prints what it answered, rather than reporting that something failed.
  - A refresh button refetches both.
  - Opening the screen is what requests them; the tool mounts without reading anything.

- [#21468](https://github.com/LedgerHQ/ledger-live/pull/21468) [`66c7569`](https://github.com/LedgerHQ/ledger-live/commit/66c7569dcfae90739b369ffb3a92cee75dd2e9cd) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Show the secure card details image in the Card interaction screen.

  - A placeholder stands in for the card until it is pressed, then the provider's image replaces it.
  - The image loads straight from the returned URL: its token is the whole credential, so no headers are needed.
  - Leaving the screen drops the URL, because the provider spends it on first use and a stale one renders nothing.
  - The URL is never rendered as text.
  - The image loads with `cache: "reload"`: the token is spent on first use, so a cache hit is the only way it could be seen twice.
  - Asks for the card and PAN colours per colour scheme, so the card number reads as its own surface against the card body.

- [#21444](https://github.com/LedgerHQ/ledger-live/pull/21444) [`543b17d`](https://github.com/LedgerHQ/ledger-live/commit/543b17d7a6b49728001c0311c184c665e8c9bbb2) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Add a "Card interaction" screen to the Card / Pay devtool.

  - Calls a signed-in cardholder's endpoints on demand and prints what they answer, so the data can be checked before any screen renders it.
  - First probe: card status. Probes are a list, so further endpoints are one entry each.
  - Exports `useLazyGetCardStatusQuery`, which a button-triggered fetch needs.
  - Native only for now.

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

- Updated dependencies [[`3d23fd4`](https://github.com/LedgerHQ/ledger-live/commit/3d23fd471fbb0ba76a0e6997eba995e190a89f7c), [`b7f83a1`](https://github.com/LedgerHQ/ledger-live/commit/b7f83a1c1818e4eff9ffbf19796a71d7242fd5b4), [`c270975`](https://github.com/LedgerHQ/ledger-live/commit/c2709750e007b758fa13f0f717efa897fcc6235d), [`60ee73c`](https://github.com/LedgerHQ/ledger-live/commit/60ee73c7b89b101dde708a04ded260341ef86d44), [`55bd216`](https://github.com/LedgerHQ/ledger-live/commit/55bd2166238ab3e03c33226bb5f5eb2e8646a818), [`6b47659`](https://github.com/LedgerHQ/ledger-live/commit/6b4765929e98abbcb08cd5348fddb528a9e674e7), [`b1b1e38`](https://github.com/LedgerHQ/ledger-live/commit/b1b1e38d2a8311f935f30c185276c165a6992dbc), [`ebb1371`](https://github.com/LedgerHQ/ledger-live/commit/ebb13714a6de9c39f290b2ccd51ca78370824f6f), [`5e971b5`](https://github.com/LedgerHQ/ledger-live/commit/5e971b55429cdcab0f69825ce2056fef24d30215), [`b7a8906`](https://github.com/LedgerHQ/ledger-live/commit/b7a89064587bbcd1f758f7b6205a616225ac2317), [`761cf3e`](https://github.com/LedgerHQ/ledger-live/commit/761cf3e359fa197d07f6086d8522fd1785ba575d), [`08ee05c`](https://github.com/LedgerHQ/ledger-live/commit/08ee05cfb66f393b14fdf1377ed6c54c4831a87c), [`543b17d`](https://github.com/LedgerHQ/ledger-live/commit/543b17d7a6b49728001c0311c184c665e8c9bbb2), [`a7d54c0`](https://github.com/LedgerHQ/ledger-live/commit/a7d54c0d6af65abe7aa2170053b3fd07ae9b05ab), [`b053fc7`](https://github.com/LedgerHQ/ledger-live/commit/b053fc79c49c604e765ac7d3d793471196be9ae1), [`c3de11c`](https://github.com/LedgerHQ/ledger-live/commit/c3de11cdf58c4feac701435548bbb96819ae09f6), [`3de7317`](https://github.com/LedgerHQ/ledger-live/commit/3de7317d858c570600eb0a4297876327fdc2c7b5), [`d60ce38`](https://github.com/LedgerHQ/ledger-live/commit/d60ce38581fe06b7f4fa72ba40259af2eabfe11f), [`7aa3071`](https://github.com/LedgerHQ/ledger-live/commit/7aa3071a532c98804a4357ff36a001b23351da73), [`faa8ef1`](https://github.com/LedgerHQ/ledger-live/commit/faa8ef11055a27af3eb7bcf1b662e8bf5c3da77d), [`2bd6a1c`](https://github.com/LedgerHQ/ledger-live/commit/2bd6a1c4b9d0cd229a8c9207108672b1a580968a), [`d54d191`](https://github.com/LedgerHQ/ledger-live/commit/d54d19127a958bb0ac8c9c479bba716ce67041ff)]:
  - @features/flow-pay-request@0.4.0-next.0
  - @shared/env@0.6.0-next.0
  - @domain/api-card-management@0.5.0-next.0
  - @features/flow-pay-card-widget@0.2.0-next.0
  - @shared/feature-flags@0.22.0-next.0
  - @features/flow-pay-card-wallets@0.2.0-next.0
  - @features/flow-pay-card-auth@0.6.0-next.0
  - @features/flow-pay-feature-tour@0.5.0-next.0
  - @devtools/registry@0.4.2-next.0
  - @features/platform-feature-flags@0.6.9-next.0

## 0.6.0

### Minor Changes

- [#21131](https://github.com/LedgerHQ/ledger-live/pull/21131) [`09af9b1`](https://github.com/LedgerHQ/ledger-live/commit/09af9b1b9f7c39db4c6d0cbd1a038fd43784240b) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Rename the Pay flow packages to drop the redundant `card` segment: `@features/flow-pay-card-balance` → `@features/flow-pay-balance`, `@features/flow-pay-card-deposit` → `@features/flow-pay-deposit`, and `@features/flow-pay-card-feature-tour` → `@features/flow-pay-feature-tour`. Package paths, npm names and all imports are updated; persisted Redux state keys and component test IDs are unchanged.

### Patch Changes

- Updated dependencies [[`5e45fdd`](https://github.com/LedgerHQ/ledger-live/commit/5e45fddee9f3483ac3daa7b93f58b01e725e6d4b), [`a8c34d0`](https://github.com/LedgerHQ/ledger-live/commit/a8c34d0d9469b4e11339edfbef53445e58194fd8), [`09af9b1`](https://github.com/LedgerHQ/ledger-live/commit/09af9b1b9f7c39db4c6d0cbd1a038fd43784240b), [`5b78670`](https://github.com/LedgerHQ/ledger-live/commit/5b78670b9587b4ebfe47d0743da1be94b6d85193), [`c8bb138`](https://github.com/LedgerHQ/ledger-live/commit/c8bb13851393d4b1a50a5ece62763ba43110ae6f), [`116f006`](https://github.com/LedgerHQ/ledger-live/commit/116f006fb7e1dc3ed7d97c41ec08b2340b66a12e)]:
  - @shared/env@0.5.0
  - @shared/feature-flags@0.21.0
  - @features/flow-pay-feature-tour@0.4.0
  - @devtools/registry@0.4.1
  - @features/platform-feature-flags@0.6.8

## 0.6.0-next.0

### Minor Changes

- [#21131](https://github.com/LedgerHQ/ledger-live/pull/21131) [`09af9b1`](https://github.com/LedgerHQ/ledger-live/commit/09af9b1b9f7c39db4c6d0cbd1a038fd43784240b) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Rename the Pay flow packages to drop the redundant `card` segment: `@features/flow-pay-card-balance` → `@features/flow-pay-balance`, `@features/flow-pay-card-deposit` → `@features/flow-pay-deposit`, and `@features/flow-pay-card-feature-tour` → `@features/flow-pay-feature-tour`. Package paths, npm names and all imports are updated; persisted Redux state keys and component test IDs are unchanged.

### Patch Changes

- Updated dependencies [[`5e45fdd`](https://github.com/LedgerHQ/ledger-live/commit/5e45fddee9f3483ac3daa7b93f58b01e725e6d4b), [`a8c34d0`](https://github.com/LedgerHQ/ledger-live/commit/a8c34d0d9469b4e11339edfbef53445e58194fd8), [`09af9b1`](https://github.com/LedgerHQ/ledger-live/commit/09af9b1b9f7c39db4c6d0cbd1a038fd43784240b), [`5b78670`](https://github.com/LedgerHQ/ledger-live/commit/5b78670b9587b4ebfe47d0743da1be94b6d85193), [`c8bb138`](https://github.com/LedgerHQ/ledger-live/commit/c8bb13851393d4b1a50a5ece62763ba43110ae6f), [`116f006`](https://github.com/LedgerHQ/ledger-live/commit/116f006fb7e1dc3ed7d97c41ec08b2340b66a12e)]:
  - @shared/env@0.5.0-next.0
  - @shared/feature-flags@0.21.0-next.0
  - @features/flow-pay-feature-tour@0.4.0-next.0
  - @devtools/registry@0.4.1-next.0
  - @features/platform-feature-flags@0.6.8-next.0

## 0.5.0

### Minor Changes

- [#21033](https://github.com/LedgerHQ/ledger-live/pull/21033) [`ce4ae4a`](https://github.com/LedgerHQ/ledger-live/commit/ce4ae4a61b4721d8d1ad7b9e8c82a182350d3be4) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - All devtools packages now enforce the `suffix-imports/no-platform-suffix` oxlint rule via a shared `.oxlintrc.json` at the `devtools/` root. Each package gains a `lint` script. Existing `.native` suffix imports in shell test files are fixed.

### Patch Changes

- Updated dependencies [[`ce4ae4a`](https://github.com/LedgerHQ/ledger-live/commit/ce4ae4a61b4721d8d1ad7b9e8c82a182350d3be4), [`aa39333`](https://github.com/LedgerHQ/ledger-live/commit/aa393339789242783b168398cb5122a7f1e3f620), [`01c088d`](https://github.com/LedgerHQ/ledger-live/commit/01c088db6a0597a479f6371c3a3db81157ead41e), [`91dbf02`](https://github.com/LedgerHQ/ledger-live/commit/91dbf023257961c3f15725f57abf273d2190e3c5), [`d6c7592`](https://github.com/LedgerHQ/ledger-live/commit/d6c7592278f2eed430c0451dd1b0a99fdf5b377d), [`132ae4a`](https://github.com/LedgerHQ/ledger-live/commit/132ae4a0776bc04797e0344d7123cef0d1124bb4), [`fbc8036`](https://github.com/LedgerHQ/ledger-live/commit/fbc8036d9bd4e1cc30eea4233f05e8b0498c0e5e)]:
  - @devtools/registry@0.4.0
  - @shared/feature-flags@0.20.0
  - @features/platform-feature-flags@0.6.7

## 0.5.0-next.0

### Minor Changes

- [#21033](https://github.com/LedgerHQ/ledger-live/pull/21033) [`ce4ae4a`](https://github.com/LedgerHQ/ledger-live/commit/ce4ae4a61b4721d8d1ad7b9e8c82a182350d3be4) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - All devtools packages now enforce the `suffix-imports/no-platform-suffix` oxlint rule via a shared `.oxlintrc.json` at the `devtools/` root. Each package gains a `lint` script. Existing `.native` suffix imports in shell test files are fixed.

### Patch Changes

- Updated dependencies [[`ce4ae4a`](https://github.com/LedgerHQ/ledger-live/commit/ce4ae4a61b4721d8d1ad7b9e8c82a182350d3be4), [`aa39333`](https://github.com/LedgerHQ/ledger-live/commit/aa393339789242783b168398cb5122a7f1e3f620), [`01c088d`](https://github.com/LedgerHQ/ledger-live/commit/01c088db6a0597a479f6371c3a3db81157ead41e), [`91dbf02`](https://github.com/LedgerHQ/ledger-live/commit/91dbf023257961c3f15725f57abf273d2190e3c5), [`d6c7592`](https://github.com/LedgerHQ/ledger-live/commit/d6c7592278f2eed430c0451dd1b0a99fdf5b377d), [`132ae4a`](https://github.com/LedgerHQ/ledger-live/commit/132ae4a0776bc04797e0344d7123cef0d1124bb4), [`fbc8036`](https://github.com/LedgerHQ/ledger-live/commit/fbc8036d9bd4e1cc30eea4233f05e8b0498c0e5e)]:
  - @devtools/registry@0.4.0-next.0
  - @shared/feature-flags@0.20.0-next.0
  - @features/platform-feature-flags@0.6.7-next.0

## 0.4.0

### Minor Changes

- [#20784](https://github.com/LedgerHQ/ledger-live/pull/20784) [`19e578a`](https://github.com/LedgerHQ/ledger-live/commit/19e578a92209e96cabe400661757689e73b43005) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Move the Pay Card UI Redux state out of the removed `@domain/entity-pay-card` package into the owning feature flows: the balance filter goes to `@features/flow-pay-card-balance` and the feature-tour seen flag to `@features/flow-pay-card-feature-tour`. The apps keep persisting it under the existing `payCard` key (no data migration). Both flows expose a UI-free `./state` entry so store, persistence and test setup can use the slice without pulling in the flow UI.

- [#20548](https://github.com/LedgerHQ/ledger-live/pull/20548) [`2edf614`](https://github.com/LedgerHQ/ledger-live/commit/2edf614eed7608714821ee54574d8c4d2b6f7d98) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add resetPayCardFeatureTourSeen reducer and expose a "Reset feature tour" control (with a Seen/Not seen tag) in the Pay Card DevTool

### Patch Changes

- Updated dependencies [[`e4e8d08`](https://github.com/LedgerHQ/ledger-live/commit/e4e8d086fc5672e4ce96c30c9a9af3f2022f863a), [`da0a5ce`](https://github.com/LedgerHQ/ledger-live/commit/da0a5ceb8f889f1bace45ed2d3d4c640cdf24ca8), [`19e578a`](https://github.com/LedgerHQ/ledger-live/commit/19e578a92209e96cabe400661757689e73b43005), [`5b39a67`](https://github.com/LedgerHQ/ledger-live/commit/5b39a67dd93d4c541a77b0b146881073ca00ed15), [`0807eca`](https://github.com/LedgerHQ/ledger-live/commit/0807ecacfd06057811a3d6f8845b9f4bfc6f693c), [`2edf614`](https://github.com/LedgerHQ/ledger-live/commit/2edf614eed7608714821ee54574d8c4d2b6f7d98), [`9e45705`](https://github.com/LedgerHQ/ledger-live/commit/9e45705b649513c3f9797c2add485a0ba3ea7a6c), [`dd0e578`](https://github.com/LedgerHQ/ledger-live/commit/dd0e578b82b8fc94fa8690cd8111f5826254b197)]:
  - @shared/feature-flags@0.19.0
  - @features/flow-pay-card-feature-tour@0.3.0
  - @devtools/registry@0.3.0
  - @features/platform-feature-flags@0.6.6

## 0.4.0-next.1

### Patch Changes

- Updated dependencies [[`da0a5ce`](https://github.com/LedgerHQ/ledger-live/commit/da0a5ceb8f889f1bace45ed2d3d4c640cdf24ca8)]:
  - @shared/feature-flags@0.19.0-next.1
  - @features/platform-feature-flags@0.6.6-next.1
  - @devtools/registry@0.3.0-next.1

## 0.4.0-next.0

### Minor Changes

- [#20784](https://github.com/LedgerHQ/ledger-live/pull/20784) [`19e578a`](https://github.com/LedgerHQ/ledger-live/commit/19e578a92209e96cabe400661757689e73b43005) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Move the Pay Card UI Redux state out of the removed `@domain/entity-pay-card` package into the owning feature flows: the balance filter goes to `@features/flow-pay-card-balance` and the feature-tour seen flag to `@features/flow-pay-card-feature-tour`. The apps keep persisting it under the existing `payCard` key (no data migration). Both flows expose a UI-free `./state` entry so store, persistence and test setup can use the slice without pulling in the flow UI.

- [#20548](https://github.com/LedgerHQ/ledger-live/pull/20548) [`2edf614`](https://github.com/LedgerHQ/ledger-live/commit/2edf614eed7608714821ee54574d8c4d2b6f7d98) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add resetPayCardFeatureTourSeen reducer and expose a "Reset feature tour" control (with a Seen/Not seen tag) in the Pay Card DevTool

### Patch Changes

- Updated dependencies [[`e4e8d08`](https://github.com/LedgerHQ/ledger-live/commit/e4e8d086fc5672e4ce96c30c9a9af3f2022f863a), [`19e578a`](https://github.com/LedgerHQ/ledger-live/commit/19e578a92209e96cabe400661757689e73b43005), [`5b39a67`](https://github.com/LedgerHQ/ledger-live/commit/5b39a67dd93d4c541a77b0b146881073ca00ed15), [`0807eca`](https://github.com/LedgerHQ/ledger-live/commit/0807ecacfd06057811a3d6f8845b9f4bfc6f693c), [`2edf614`](https://github.com/LedgerHQ/ledger-live/commit/2edf614eed7608714821ee54574d8c4d2b6f7d98), [`9e45705`](https://github.com/LedgerHQ/ledger-live/commit/9e45705b649513c3f9797c2add485a0ba3ea7a6c), [`dd0e578`](https://github.com/LedgerHQ/ledger-live/commit/dd0e578b82b8fc94fa8690cd8111f5826254b197)]:
  - @shared/feature-flags@0.19.0-next.0
  - @features/flow-pay-card-feature-tour@0.3.0-next.0
  - @devtools/registry@0.3.0-next.0
  - @features/platform-feature-flags@0.6.6-next.0

## 0.3.0

### Minor Changes

- [#20494](https://github.com/LedgerHQ/ledger-live/pull/20494) [`40efdfb`](https://github.com/LedgerHQ/ledger-live/commit/40efdfbb42cdc94b8efb59a9aa45992ff7c64653) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add `usePayCardToolProps` to bridge feature flags and Card onboarding into the pay-card DevTool (LIVE-35497).

- [#20548](https://github.com/LedgerHQ/ledger-live/pull/20548) [`2edf614`](https://github.com/LedgerHQ/ledger-live/commit/2edf614eed7608714821ee54574d8c4d2b6f7d98) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add resetPayCardFeatureTourSeen reducer and expose a "Reset feature tour" control (with a Seen/Not seen tag) in the Pay Card DevTool

### Patch Changes

- Updated dependencies [[`43bf6d8`](https://github.com/LedgerHQ/ledger-live/commit/43bf6d8f6600f70b7c2a85615660e7e150e798bf), [`9708010`](https://github.com/LedgerHQ/ledger-live/commit/970801044529fe978ccbb8c562cc64c00277d1de), [`a61f702`](https://github.com/LedgerHQ/ledger-live/commit/a61f702a6e41f2bf84d5602930e261a708507efa), [`6bb6cb0`](https://github.com/LedgerHQ/ledger-live/commit/6bb6cb058d79074de3d7f23a89074bef3311cf8d), [`2edf614`](https://github.com/LedgerHQ/ledger-live/commit/2edf614eed7608714821ee54574d8c4d2b6f7d98), [`9e45705`](https://github.com/LedgerHQ/ledger-live/commit/9e45705b649513c3f9797c2add485a0ba3ea7a6c)]:
  - @shared/feature-flags@0.18.0
  - @domain/entity-pay-card@0.3.0
  - @devtools/registry@0.2.0
  - @features/platform-feature-flags@0.6.5

## 0.3.0-next.0

### Minor Changes

- [#20494](https://github.com/LedgerHQ/ledger-live/pull/20494) [`40efdfb`](https://github.com/LedgerHQ/ledger-live/commit/40efdfbb42cdc94b8efb59a9aa45992ff7c64653) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add `usePayCardToolProps` to bridge feature flags and Card onboarding into the pay-card DevTool (LIVE-35497).

- [#20548](https://github.com/LedgerHQ/ledger-live/pull/20548) [`2edf614`](https://github.com/LedgerHQ/ledger-live/commit/2edf614eed7608714821ee54574d8c4d2b6f7d98) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add resetPayCardFeatureTourSeen reducer and expose a "Reset feature tour" control (with a Seen/Not seen tag) in the Pay Card DevTool

### Patch Changes

- Updated dependencies [[`43bf6d8`](https://github.com/LedgerHQ/ledger-live/commit/43bf6d8f6600f70b7c2a85615660e7e150e798bf), [`9708010`](https://github.com/LedgerHQ/ledger-live/commit/970801044529fe978ccbb8c562cc64c00277d1de), [`a61f702`](https://github.com/LedgerHQ/ledger-live/commit/a61f702a6e41f2bf84d5602930e261a708507efa), [`6bb6cb0`](https://github.com/LedgerHQ/ledger-live/commit/6bb6cb058d79074de3d7f23a89074bef3311cf8d), [`2edf614`](https://github.com/LedgerHQ/ledger-live/commit/2edf614eed7608714821ee54574d8c4d2b6f7d98), [`9e45705`](https://github.com/LedgerHQ/ledger-live/commit/9e45705b649513c3f9797c2add485a0ba3ea7a6c)]:
  - @shared/feature-flags@0.18.0-next.0
  - @domain/entity-pay-card@0.3.0-next.0
  - @devtools/registry@0.2.0-next.0
  - @features/platform-feature-flags@0.6.5-next.0

## 0.2.3

### Patch Changes

- Updated dependencies [[`2fa6e1f`](https://github.com/LedgerHQ/ledger-live/commit/2fa6e1f3fbcb56ff444ca756135d821e141bc439), [`56cfe0b`](https://github.com/LedgerHQ/ledger-live/commit/56cfe0bc6673f416f739c1593abfec718230952d), [`4015ade`](https://github.com/LedgerHQ/ledger-live/commit/4015ade1f9744d4bb575282060fdb1beb9aafc89), [`d467088`](https://github.com/LedgerHQ/ledger-live/commit/d4670885d7eb77c035d09c225eff9dca0151abb3), [`6a531c5`](https://github.com/LedgerHQ/ledger-live/commit/6a531c54ccd1c65df122286de6f136f9d73b9002), [`5f81208`](https://github.com/LedgerHQ/ledger-live/commit/5f81208308f7e56971cce9329369c12af82185d3)]:
  - @shared/feature-flags@0.17.0
  - @features/platform-feature-flags@0.6.4
  - @devtools/registry@0.1.9

## 0.2.3-next.0

### Patch Changes

- Updated dependencies [[`2fa6e1f`](https://github.com/LedgerHQ/ledger-live/commit/2fa6e1f3fbcb56ff444ca756135d821e141bc439), [`56cfe0b`](https://github.com/LedgerHQ/ledger-live/commit/56cfe0bc6673f416f739c1593abfec718230952d), [`4015ade`](https://github.com/LedgerHQ/ledger-live/commit/4015ade1f9744d4bb575282060fdb1beb9aafc89), [`d467088`](https://github.com/LedgerHQ/ledger-live/commit/d4670885d7eb77c035d09c225eff9dca0151abb3), [`6a531c5`](https://github.com/LedgerHQ/ledger-live/commit/6a531c54ccd1c65df122286de6f136f9d73b9002), [`5f81208`](https://github.com/LedgerHQ/ledger-live/commit/5f81208308f7e56971cce9329369c12af82185d3)]:
  - @shared/feature-flags@0.17.0-next.0
  - @features/platform-feature-flags@0.6.4-next.0
  - @devtools/registry@0.1.9-next.0

## 0.2.2

### Patch Changes

- Updated dependencies [[`452adf8`](https://github.com/LedgerHQ/ledger-live/commit/452adf85380d1cb74f1894478cdd84849b120ef4), [`44798f3`](https://github.com/LedgerHQ/ledger-live/commit/44798f392deb662a5f60123651ece2b320fbf946), [`a534db5`](https://github.com/LedgerHQ/ledger-live/commit/a534db5c41da6957d38a330c1da6f7db1b693763), [`c622459`](https://github.com/LedgerHQ/ledger-live/commit/c622459fcbff5dcc094ee10eb360f2a835036007), [`dfab01f`](https://github.com/LedgerHQ/ledger-live/commit/dfab01f36460bd4e0ea0b0c13aa3d965aef945cd)]:
  - @shared/feature-flags@0.16.0
  - @features/platform-feature-flags@0.6.3
  - @devtools/registry@0.1.8

## 0.2.2-next.0

### Patch Changes

- Updated dependencies [[`452adf8`](https://github.com/LedgerHQ/ledger-live/commit/452adf85380d1cb74f1894478cdd84849b120ef4), [`44798f3`](https://github.com/LedgerHQ/ledger-live/commit/44798f392deb662a5f60123651ece2b320fbf946), [`a534db5`](https://github.com/LedgerHQ/ledger-live/commit/a534db5c41da6957d38a330c1da6f7db1b693763), [`c622459`](https://github.com/LedgerHQ/ledger-live/commit/c622459fcbff5dcc094ee10eb360f2a835036007), [`dfab01f`](https://github.com/LedgerHQ/ledger-live/commit/dfab01f36460bd4e0ea0b0c13aa3d965aef945cd)]:
  - @shared/feature-flags@0.16.0-next.0
  - @features/platform-feature-flags@0.6.3-next.0
  - @devtools/registry@0.1.8-next.0

## 0.2.1

### Patch Changes

- Updated dependencies [[`bb2d2d2`](https://github.com/LedgerHQ/ledger-live/commit/bb2d2d250a1d5b8cde43ba963795d28b10b48be6), [`59a6c82`](https://github.com/LedgerHQ/ledger-live/commit/59a6c82a784b4f484b5fb6a5ea42b6ebb1115818), [`c498e25`](https://github.com/LedgerHQ/ledger-live/commit/c498e25ca9f4b6ef5c4e3dfd370dab44ccdebc0f)]:
  - @shared/feature-flags@0.15.0
  - @features/platform-feature-flags@0.6.2
  - @devtools/registry@0.1.7

## 0.2.1-next.0

### Patch Changes

- Updated dependencies [[`bb2d2d2`](https://github.com/LedgerHQ/ledger-live/commit/bb2d2d250a1d5b8cde43ba963795d28b10b48be6), [`59a6c82`](https://github.com/LedgerHQ/ledger-live/commit/59a6c82a784b4f484b5fb6a5ea42b6ebb1115818), [`c498e25`](https://github.com/LedgerHQ/ledger-live/commit/c498e25ca9f4b6ef5c4e3dfd370dab44ccdebc0f)]:
  - @shared/feature-flags@0.15.0-next.0
  - @features/platform-feature-flags@0.6.2-next.0
  - @devtools/registry@0.1.7-next.0

## 0.2.0

### Minor Changes

- [#19288](https://github.com/LedgerHQ/ledger-live/pull/19288) [`2f7619d`](https://github.com/LedgerHQ/ledger-live/commit/2f7619dc269329c581c83ce982ddd4bc6e3c9abe) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Package init and adds function to build devtools' feature flags

### Patch Changes

- Updated dependencies [[`c75213b`](https://github.com/LedgerHQ/ledger-live/commit/c75213b0c649cc0acfdbabacd62e07848ccee842), [`45584e4`](https://github.com/LedgerHQ/ledger-live/commit/45584e4b87ad8ffea9a0e6ba48e196d14164c84a), [`ea792bc`](https://github.com/LedgerHQ/ledger-live/commit/ea792bc06b9eb9931d75823bff63186202d3e2de), [`75a33a8`](https://github.com/LedgerHQ/ledger-live/commit/75a33a8ef74a6eef6236bb5db873cadd35643705), [`bae43dd`](https://github.com/LedgerHQ/ledger-live/commit/bae43ddc50439d2a7f18852f2b727e24de0169ed), [`9479c28`](https://github.com/LedgerHQ/ledger-live/commit/9479c284321915f7d5139746f3f924b1ad2685c3), [`fd9da5e`](https://github.com/LedgerHQ/ledger-live/commit/fd9da5e2b3a1e5300d012b826f3707535d07b1d9), [`8238860`](https://github.com/LedgerHQ/ledger-live/commit/8238860c893b0688d2c59a3e042d7a227031547a)]:
  - @shared/feature-flags@0.14.0
  - @features/platform-feature-flags@0.6.1
  - @devtools/registry@0.1.6

## 0.2.0-next.0

### Minor Changes

- [#19288](https://github.com/LedgerHQ/ledger-live/pull/19288) [`2f7619d`](https://github.com/LedgerHQ/ledger-live/commit/2f7619dc269329c581c83ce982ddd4bc6e3c9abe) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Package init and adds function to build devtools' feature flags

### Patch Changes

- Updated dependencies [[`c75213b`](https://github.com/LedgerHQ/ledger-live/commit/c75213b0c649cc0acfdbabacd62e07848ccee842), [`45584e4`](https://github.com/LedgerHQ/ledger-live/commit/45584e4b87ad8ffea9a0e6ba48e196d14164c84a), [`ea792bc`](https://github.com/LedgerHQ/ledger-live/commit/ea792bc06b9eb9931d75823bff63186202d3e2de), [`75a33a8`](https://github.com/LedgerHQ/ledger-live/commit/75a33a8ef74a6eef6236bb5db873cadd35643705), [`bae43dd`](https://github.com/LedgerHQ/ledger-live/commit/bae43ddc50439d2a7f18852f2b727e24de0169ed), [`9479c28`](https://github.com/LedgerHQ/ledger-live/commit/9479c284321915f7d5139746f3f924b1ad2685c3), [`fd9da5e`](https://github.com/LedgerHQ/ledger-live/commit/fd9da5e2b3a1e5300d012b826f3707535d07b1d9), [`8238860`](https://github.com/LedgerHQ/ledger-live/commit/8238860c893b0688d2c59a3e042d7a227031547a)]:
  - @shared/feature-flags@0.14.0-next.0
  - @features/platform-feature-flags@0.6.1-next.0
  - @devtools/registry@0.1.6-next.0

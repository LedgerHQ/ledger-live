# @devtools/pay-card

## 0.5.0-next.0

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

- [#21386](https://github.com/LedgerHQ/ledger-live/pull/21386) [`760dab2`](https://github.com/LedgerHQ/ledger-live/commit/760dab246a27d62f0feaa349122164e1c48aa6e4) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Use theme `base` text color in the mobile Pay Card DevTool so labels stay readable in dark mode.

## 0.4.0

### Minor Changes

- [#21033](https://github.com/LedgerHQ/ledger-live/pull/21033) [`ce4ae4a`](https://github.com/LedgerHQ/ledger-live/commit/ce4ae4a61b4721d8d1ad7b9e8c82a182350d3be4) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - All devtools packages now enforce the `suffix-imports/no-platform-suffix` oxlint rule via a shared `.oxlintrc.json` at the `devtools/` root. Each package gains a `lint` script. Existing `.native` suffix imports in shell test files are fixed.

## 0.4.0-next.0

### Minor Changes

- [#21033](https://github.com/LedgerHQ/ledger-live/pull/21033) [`ce4ae4a`](https://github.com/LedgerHQ/ledger-live/commit/ce4ae4a61b4721d8d1ad7b9e8c82a182350d3be4) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - All devtools packages now enforce the `suffix-imports/no-platform-suffix` oxlint rule via a shared `.oxlintrc.json` at the `devtools/` root. Each package gains a `lint` script. Existing `.native` suffix imports in shell test files are fixed.

## 0.3.0

### Minor Changes

- [#20548](https://github.com/LedgerHQ/ledger-live/pull/20548) [`2edf614`](https://github.com/LedgerHQ/ledger-live/commit/2edf614eed7608714821ee54574d8c4d2b6f7d98) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add resetPayCardFeatureTourSeen reducer and expose a "Reset feature tour" control (with a Seen/Not seen tag) in the Pay Card DevTool

- [#20096](https://github.com/LedgerHQ/ledger-live/pull/20096) [`e54d98b`](https://github.com/LedgerHQ/ledger-live/commit/e54d98b123ad8814be57c2f0e0f26689902ab4fd) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Integrate the Card API and give its endpoints a domain owner

  `@domain/api-card-management` gains the Card Auth contract: authorize initiation, authorization-code
  exchange, session refresh, logout and the user read, with their zod wire schemas and inferred types.
  They inject into the shared `cardApi` service, so one reducer, one middleware and one cache serve the
  Card backend, and the base query supplies the base URL, `x-client-key` and the `Authorization: Bearer`
  header from the `@features/platform-card` session.

  `@features/flow-pay-card-auth` owns no network contract any more. It keeps the auth-only `payCardAuth`
  slice and the `CardLogin` component; `useCardLoginViewModel` imports its hook from
  `@domain/api-card-management`, and that import is what triggers the injection. `@domain/api-pay-card`
  and its in-process mock transport are removed, along with the Pay Card mocks.

  Pay Card UI Redux state is owned by the feature flows that use it: the balance filter by
  `@features/flow-pay-card-balance` and the feature-tour flag by `@features/flow-pay-card-feature-tour`.

  Only the login step ships here. The callback code exchange and the card status read stay behind until
  the session has an owner that can store and refresh it.

## 0.3.0-next.0

### Minor Changes

- [#20548](https://github.com/LedgerHQ/ledger-live/pull/20548) [`2edf614`](https://github.com/LedgerHQ/ledger-live/commit/2edf614eed7608714821ee54574d8c4d2b6f7d98) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add resetPayCardFeatureTourSeen reducer and expose a "Reset feature tour" control (with a Seen/Not seen tag) in the Pay Card DevTool

- [#20096](https://github.com/LedgerHQ/ledger-live/pull/20096) [`e54d98b`](https://github.com/LedgerHQ/ledger-live/commit/e54d98b123ad8814be57c2f0e0f26689902ab4fd) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Integrate the Card API and give its endpoints a domain owner

  `@domain/api-card-management` gains the Card Auth contract: authorize initiation, authorization-code
  exchange, session refresh, logout and the user read, with their zod wire schemas and inferred types.
  They inject into the shared `cardApi` service, so one reducer, one middleware and one cache serve the
  Card backend, and the base query supplies the base URL, `x-client-key` and the `Authorization: Bearer`
  header from the `@features/platform-card` session.

  `@features/flow-pay-card-auth` owns no network contract any more. It keeps the auth-only `payCardAuth`
  slice and the `CardLogin` component; `useCardLoginViewModel` imports its hook from
  `@domain/api-card-management`, and that import is what triggers the injection. `@domain/api-pay-card`
  and its in-process mock transport are removed, along with the Pay Card mocks.

  Pay Card UI Redux state is owned by the feature flows that use it: the balance filter by
  `@features/flow-pay-card-balance` and the feature-tour flag by `@features/flow-pay-card-feature-tour`.

  Only the login step ships here. The callback code exchange and the card status read stay behind until
  the session has an owner that can store and refresh it.

## 0.2.0

### Minor Changes

- [#20461](https://github.com/LedgerHQ/ledger-live/pull/20461) [`6bb6cb0`](https://github.com/LedgerHQ/ledger-live/commit/6bb6cb058d79074de3d7f23a89074bef3311cf8d) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the Card / Pay DevTool foundation package (`@devtools/pay-card`): shared `PayCardToolProps` contract, platform-neutral `usePayCardViewModel`, and registry wiring under the Wallet XP team (LIVE-35496).

- [#20463](https://github.com/LedgerHQ/ledger-live/pull/20463) [`1e0edb4`](https://github.com/LedgerHQ/ledger-live/commit/1e0edb42fd2c8c0e6edc4249f4eb3a13162aea2a) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the native UI for the Card / Pay DevTool (`@devtools/pay-card`) built with `@ledgerhq/lumen-ui-rnative`: flags, API mock scenarios, quick states and resets sections (LIVE-35511).

- [#20462](https://github.com/LedgerHQ/ledger-live/pull/20462) [`9c2a85e`](https://github.com/LedgerHQ/ledger-live/commit/9c2a85ef5c1c6a264b53bc3f4581385a250be2ad) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the web UI for the Card / Pay DevTool (`@devtools/pay-card`) built with `@ledgerhq/lumen-ui-react`: flags, API mock scenarios, quick states and resets sections (LIVE-35510).

- [#20548](https://github.com/LedgerHQ/ledger-live/pull/20548) [`2edf614`](https://github.com/LedgerHQ/ledger-live/commit/2edf614eed7608714821ee54574d8c4d2b6f7d98) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add resetPayCardFeatureTourSeen reducer and expose a "Reset feature tour" control (with a Seen/Not seen tag) in the Pay Card DevTool

## 0.2.0-next.0

### Minor Changes

- [#20461](https://github.com/LedgerHQ/ledger-live/pull/20461) [`6bb6cb0`](https://github.com/LedgerHQ/ledger-live/commit/6bb6cb058d79074de3d7f23a89074bef3311cf8d) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the Card / Pay DevTool foundation package (`@devtools/pay-card`): shared `PayCardToolProps` contract, platform-neutral `usePayCardViewModel`, and registry wiring under the Wallet XP team (LIVE-35496).

- [#20463](https://github.com/LedgerHQ/ledger-live/pull/20463) [`1e0edb4`](https://github.com/LedgerHQ/ledger-live/commit/1e0edb42fd2c8c0e6edc4249f4eb3a13162aea2a) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the native UI for the Card / Pay DevTool (`@devtools/pay-card`) built with `@ledgerhq/lumen-ui-rnative`: flags, API mock scenarios, quick states and resets sections (LIVE-35511).

- [#20462](https://github.com/LedgerHQ/ledger-live/pull/20462) [`9c2a85e`](https://github.com/LedgerHQ/ledger-live/commit/9c2a85ef5c1c6a264b53bc3f4581385a250be2ad) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the web UI for the Card / Pay DevTool (`@devtools/pay-card`) built with `@ledgerhq/lumen-ui-react`: flags, API mock scenarios, quick states and resets sections (LIVE-35510).

- [#20548](https://github.com/LedgerHQ/ledger-live/pull/20548) [`2edf614`](https://github.com/LedgerHQ/ledger-live/commit/2edf614eed7608714821ee54574d8c4d2b6f7d98) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add resetPayCardFeatureTourSeen reducer and expose a "Reset feature tour" control (with a Seen/Not seen tag) in the Pay Card DevTool

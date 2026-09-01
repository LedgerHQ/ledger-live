# @features/flow-pay-card-auth

## 0.5.0-next.0

### Minor Changes

- [#21115](https://github.com/LedgerHQ/ledger-live/pull/21115) [`0500726`](https://github.com/LedgerHQ/ledger-live/commit/05007264f5b1726a21c2e545a10c18993fd2fcb5) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Forget the cached Card user when a 401 ends the session, not only on an explicit logout.

  - The logout already dispatched `resetApiState()`; the involuntary path cleared the keychain session
    and left the RTK cache behind.
  - That cache holds the holder name, PAN last 4 and verification state, so the next person to sign in
    on the device could be served the previous holder's data before a refetch landed.
  - `forgetUser` is now a login port too, called wherever the session is cleared.

- [#21258](https://github.com/LedgerHQ/ledger-live/pull/21258) [`ad1c0ff`](https://github.com/LedgerHQ/ledger-live/commit/ad1c0ff93b94ba9a0b1e7409e5ddbdc2d73bcd30) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the contacts section to the Pay tab, with a leading Pay tile opening the send flow. Balance, Contacts and Card now share a s24 gap and inherit their horizontal padding from the Pay tab container.

### Patch Changes

- Updated dependencies [[`6918e5b`](https://github.com/LedgerHQ/ledger-live/commit/6918e5b285afe016d54f95090d44db3c1467fcec), [`e8c2316`](https://github.com/LedgerHQ/ledger-live/commit/e8c23168916415e569b27b530c71785e0dd2f29e), [`9f130fb`](https://github.com/LedgerHQ/ledger-live/commit/9f130fb908ad4596ef5697189633a3470935de75)]:
  - @domain/api-card-management@0.4.0-next.0
  - @features/platform-card@0.3.1-next.0

## 0.4.0

### Minor Changes

- [#20810](https://github.com/LedgerHQ/ledger-live/pull/20810) [`bb045d8`](https://github.com/LedgerHQ/ledger-live/commit/bb045d88e3cbeb411643acfc26252e8cb1ce39ac) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Complete the Pay Card login from the Baanx redirect (LIVE-34742)

  An XState 5 machine now owns the journey: it mints and stores the PKCE attempt, starts the
  authorization, opens the OS browser, compares the `state` on the redirect, exchanges the code, stores
  the session, and reads `GET /v1/user` into the RTK Query cache. On mobile the redirect arrives either
  from the browser session or from the `ledgerlive://paytab?code=…&state=…` deep link, and the first one
  wins. `CardLogin` shows the login action only when there is something to log in to, and renders nothing
  once the user is signed in.

- [#20593](https://github.com/LedgerHQ/ledger-live/pull/20593) [`d5ea888`](https://github.com/LedgerHQ/ledger-live/commit/d5ea888d3a154feeb29b452841749d358629b8c1) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Start the Baanx login with a PKCE challenge and a CSRF state (LIVE-34738)

  Pressing Login now mints a login attempt client-side — a 16-byte `state` and a 32-byte PKCE verifier,
  with `code_challenge = BASE64URL(SHA256(verifier))` — and sends it to
  `GET /v1/auth/oauth/authorize/initiate`, whose `url` answer is opened in the platform
  secure browser as before. The randomness comes from the platform CSPRNG on each side: `expo-crypto`
  on mobile, WebCrypto on desktop.

  The redirect URI now reaches the secure browser too, since that is what ends the session:
  `ASWebAuthenticationSession` matches the callback against it, and so does the Android polyfill. The
  opener only opens the URL; the redirect goes back to the app, so the browser result is not read and
  closing the browser shows no error — a cancelled login is not a failed one.

  The initiation carries `mode=api`. Without it the endpoint answers `302` and redirects to the hosted
  UI, which a `fetch` follows into an HTML page; `api` returns the same URL as JSON instead. That answer
  also carries the JWT of Baanx's programmatic flow, which the hosted UI does not need, so the schema
  drops it instead of parking a short-lived credential in the cache.

  The request goes through `useInitiateAuthorizeMutation` from `@domain/api-card-management`, which owns
  the Card Auth contract and injects it into the shared `cardApi` service. Every endpoint there is
  declarative — `query`, `rawResponseSchema`, `transformResponse`, `responseSchema` — so the wire shape
  is validated at the boundary and mapped in one place. `cardApiExtra` keeps only what the base query
  needs: the base URL, the Baanx client key for the `x-client-key` header, and the session accessors.

  The OAuth client id and redirect URI are the app's, so they reach `CardLogin` as an `oauthConfig`
  prop: one value goes to the initiation and to the secure browser, and the token exchange will send it
  again. Baanx uses the same value for the client key and the OAuth `client_id`, and the provider matches
  `ledgerlive://paytab` verbatim on the token exchange. Each platform container opens the returned URL
  itself, and no host-provided opener is needed. The Baanx secret key stays server-side and is never
  sent from the apps.

  The challenge is spent on the initiation, and nothing keeps the attempt afterwards. Completing the
  callback — holding the `state` and the verifier, verifying the `state`, exchanging the code for
  tokens and storing them in `expo-secure-store` — is the remainder of LIVE-34738 and is not part of
  this change.

- [#20983](https://github.com/LedgerHQ/ledger-live/pull/20983) [`eba4d17`](https://github.com/LedgerHQ/ledger-live/commit/eba4d175ad10f1431a222a4fa98481ea4285e891) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Open the Baanx authorize page directly, and drop the CSRF state (LIVE-36301)

  The login no longer asks the backend where to send the user. It builds the authorize URL itself and
  opens the secure browser on it, and the provider hosts the page and owns the redirect. That removes a
  network call, a machine state and one way a login could fail.

  ```
  GET {CARD_API_URL}/v1/auth/oauth2/authorize
    ?client_id=…&response_type=code
    &scope=openid profile email offline_access
    &redirect_uri=…&code_challenge=…&code_challenge_method=S256&prompt=consent
  ```

  The attempt is now a PKCE pair alone. The redirect carries `code`, and the `state` that used to travel
  with it is gone, because PKCE already ties the code to the verifier on disk: the provider issues the
  code against this attempt's challenge, so no other attempt can exchange it. Both token grants move to
  `/v1/auth/oauth2/token`, and neither repeats `redirect_uri` there: Baanx's contract for that endpoint
  takes only `grant_type`, `code`, and `code_verifier`.

  `oauthConfig` gains `apiUrl`, which is the host the authorize page lives on.

  `prepareAttempt` builds the authorize URL, rather than the transition that follows it. The URL builder
  throws on a misconfigured `apiUrl`, and a throw inside an action stops the machine instead of reaching
  a transition. From the actor it lands on `onError`, which wipes the stored attempt and reports a
  failure the user can retry.

  A live exchange against Baanx's UAT environment answered with no `refresh_token_expires_in`, which
  `PayCardSessionResponseSchema` required. That field is gone from the schema, the session, and the
  stored lifetimes: Baanx's contract carries no lifetime for the refresh token, only for the access
  token, so nothing here can track one.

- [#20816](https://github.com/LedgerHQ/ledger-live/pull/20816) [`cad4f63`](https://github.com/LedgerHQ/ledger-live/commit/cad4f63be4a3b16880ab490195af1f17921e03c2) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Show the signed-in card holder, and let them log out

  `CardLogout` is a new component, and it is the only one that knows about logging out. It shows the
  account id and the verification state, which is everything the user schema holds, beside a logout
  action. Logout tells the provider first, while the session can still authorize that call, then clears
  the session, the login attempt and the Card cache. A logout on a dead network still logs the user out
  on this device.

  The two directions stay apart. `CardLogin` runs the login and shows nothing once somebody is signed
  in; `CardLogout` shows nothing until somebody is. Each one decides that for itself, so the Pay tab
  places both and passes `CardLogout` nothing.

  They agree through one Redux flag, `payCardAuth.isSignedIn`, because two login machines would each
  hydrate the session and neither would agree with the other. The machine writes the flag on entering
  `ready`, `idle` and `error`. `CardLogout` writes it once a logout is through, and the machine takes a
  `SESSION_ENDED` event to put the login back on offer.

  `CARD_OAUTH_REDIRECT_URI` now defaults to `https://go.ledger.com/ledger/card-baanx`. The provider
  whitelists an HTTPS address, and it must match on the token exchange too.

  `oauthConfig` gains `deepLink`, which is what closes the secure browser.
  `ASWebAuthenticationSession` takes the scheme of this value as its `callbackURLScheme`, and the
  Android polyfill matches the incoming link against the whole of it.

  One value cannot serve both jobs. The provider accepts an `https` redirect URI alone, and only a
  custom scheme ends a browser session. With no value that matches, the login still completes through
  the app's own deep link, but nothing closes the browser and it stays on top of the Pay tab.

  Mobile takes the value from `PAY_TAB_DEEP_LINK`, a new constant that sits beside the linking config
  and shares the path that config maps onto the Pay tab, so the two cannot drift. It is not an
  environment variable: the scheme is declared in `AndroidManifest.xml` and `Info.plist`, so it cannot
  change without a release. Desktop passes no `deepLink`, because the user's own browser opens the page
  and reports nothing back (LIVE-34740).

### Patch Changes

- Updated dependencies [[`e732d3e`](https://github.com/LedgerHQ/ledger-live/commit/e732d3e258c653fc83e1474434f3bb02c136ae62), [`f64ceec`](https://github.com/LedgerHQ/ledger-live/commit/f64ceecbdaccec2c56ace4cc459d670db5920b68), [`d5ea888`](https://github.com/LedgerHQ/ledger-live/commit/d5ea888d3a154feeb29b452841749d358629b8c1), [`0ad6182`](https://github.com/LedgerHQ/ledger-live/commit/0ad6182ac7fa955c01a8fd679182f7fe3b83cace), [`eba4d17`](https://github.com/LedgerHQ/ledger-live/commit/eba4d175ad10f1431a222a4fa98481ea4285e891)]:
  - @features/platform-card@0.3.0
  - @domain/api-card-management@0.3.0

## 0.4.0-next.0

### Minor Changes

- [#20810](https://github.com/LedgerHQ/ledger-live/pull/20810) [`bb045d8`](https://github.com/LedgerHQ/ledger-live/commit/bb045d88e3cbeb411643acfc26252e8cb1ce39ac) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Complete the Pay Card login from the Baanx redirect (LIVE-34742)

  An XState 5 machine now owns the journey: it mints and stores the PKCE attempt, starts the
  authorization, opens the OS browser, compares the `state` on the redirect, exchanges the code, stores
  the session, and reads `GET /v1/user` into the RTK Query cache. On mobile the redirect arrives either
  from the browser session or from the `ledgerlive://paytab?code=…&state=…` deep link, and the first one
  wins. `CardLogin` shows the login action only when there is something to log in to, and renders nothing
  once the user is signed in.

- [#20593](https://github.com/LedgerHQ/ledger-live/pull/20593) [`d5ea888`](https://github.com/LedgerHQ/ledger-live/commit/d5ea888d3a154feeb29b452841749d358629b8c1) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Start the Baanx login with a PKCE challenge and a CSRF state (LIVE-34738)

  Pressing Login now mints a login attempt client-side — a 16-byte `state` and a 32-byte PKCE verifier,
  with `code_challenge = BASE64URL(SHA256(verifier))` — and sends it to
  `GET /v1/auth/oauth/authorize/initiate`, whose `url` answer is opened in the platform
  secure browser as before. The randomness comes from the platform CSPRNG on each side: `expo-crypto`
  on mobile, WebCrypto on desktop.

  The redirect URI now reaches the secure browser too, since that is what ends the session:
  `ASWebAuthenticationSession` matches the callback against it, and so does the Android polyfill. The
  opener only opens the URL; the redirect goes back to the app, so the browser result is not read and
  closing the browser shows no error — a cancelled login is not a failed one.

  The initiation carries `mode=api`. Without it the endpoint answers `302` and redirects to the hosted
  UI, which a `fetch` follows into an HTML page; `api` returns the same URL as JSON instead. That answer
  also carries the JWT of Baanx's programmatic flow, which the hosted UI does not need, so the schema
  drops it instead of parking a short-lived credential in the cache.

  The request goes through `useInitiateAuthorizeMutation` from `@domain/api-card-management`, which owns
  the Card Auth contract and injects it into the shared `cardApi` service. Every endpoint there is
  declarative — `query`, `rawResponseSchema`, `transformResponse`, `responseSchema` — so the wire shape
  is validated at the boundary and mapped in one place. `cardApiExtra` keeps only what the base query
  needs: the base URL, the Baanx client key for the `x-client-key` header, and the session accessors.

  The OAuth client id and redirect URI are the app's, so they reach `CardLogin` as an `oauthConfig`
  prop: one value goes to the initiation and to the secure browser, and the token exchange will send it
  again. Baanx uses the same value for the client key and the OAuth `client_id`, and the provider matches
  `ledgerlive://paytab` verbatim on the token exchange. Each platform container opens the returned URL
  itself, and no host-provided opener is needed. The Baanx secret key stays server-side and is never
  sent from the apps.

  The challenge is spent on the initiation, and nothing keeps the attempt afterwards. Completing the
  callback — holding the `state` and the verifier, verifying the `state`, exchanging the code for
  tokens and storing them in `expo-secure-store` — is the remainder of LIVE-34738 and is not part of
  this change.

- [#20983](https://github.com/LedgerHQ/ledger-live/pull/20983) [`eba4d17`](https://github.com/LedgerHQ/ledger-live/commit/eba4d175ad10f1431a222a4fa98481ea4285e891) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Open the Baanx authorize page directly, and drop the CSRF state (LIVE-36301)

  The login no longer asks the backend where to send the user. It builds the authorize URL itself and
  opens the secure browser on it, and the provider hosts the page and owns the redirect. That removes a
  network call, a machine state and one way a login could fail.

  ```
  GET {CARD_API_URL}/v1/auth/oauth2/authorize
    ?client_id=…&response_type=code
    &scope=openid profile email offline_access
    &redirect_uri=…&code_challenge=…&code_challenge_method=S256&prompt=consent
  ```

  The attempt is now a PKCE pair alone. The redirect carries `code`, and the `state` that used to travel
  with it is gone, because PKCE already ties the code to the verifier on disk: the provider issues the
  code against this attempt's challenge, so no other attempt can exchange it. Both token grants move to
  `/v1/auth/oauth2/token`, and neither repeats `redirect_uri` there: Baanx's contract for that endpoint
  takes only `grant_type`, `code`, and `code_verifier`.

  `oauthConfig` gains `apiUrl`, which is the host the authorize page lives on.

  `prepareAttempt` builds the authorize URL, rather than the transition that follows it. The URL builder
  throws on a misconfigured `apiUrl`, and a throw inside an action stops the machine instead of reaching
  a transition. From the actor it lands on `onError`, which wipes the stored attempt and reports a
  failure the user can retry.

  A live exchange against Baanx's UAT environment answered with no `refresh_token_expires_in`, which
  `PayCardSessionResponseSchema` required. That field is gone from the schema, the session, and the
  stored lifetimes: Baanx's contract carries no lifetime for the refresh token, only for the access
  token, so nothing here can track one.

- [#20816](https://github.com/LedgerHQ/ledger-live/pull/20816) [`cad4f63`](https://github.com/LedgerHQ/ledger-live/commit/cad4f63be4a3b16880ab490195af1f17921e03c2) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Show the signed-in card holder, and let them log out

  `CardLogout` is a new component, and it is the only one that knows about logging out. It shows the
  account id and the verification state, which is everything the user schema holds, beside a logout
  action. Logout tells the provider first, while the session can still authorize that call, then clears
  the session, the login attempt and the Card cache. A logout on a dead network still logs the user out
  on this device.

  The two directions stay apart. `CardLogin` runs the login and shows nothing once somebody is signed
  in; `CardLogout` shows nothing until somebody is. Each one decides that for itself, so the Pay tab
  places both and passes `CardLogout` nothing.

  They agree through one Redux flag, `payCardAuth.isSignedIn`, because two login machines would each
  hydrate the session and neither would agree with the other. The machine writes the flag on entering
  `ready`, `idle` and `error`. `CardLogout` writes it once a logout is through, and the machine takes a
  `SESSION_ENDED` event to put the login back on offer.

  `CARD_OAUTH_REDIRECT_URI` now defaults to `https://go.ledger.com/ledger/card-baanx`. The provider
  whitelists an HTTPS address, and it must match on the token exchange too.

  `oauthConfig` gains `deepLink`, which is what closes the secure browser.
  `ASWebAuthenticationSession` takes the scheme of this value as its `callbackURLScheme`, and the
  Android polyfill matches the incoming link against the whole of it.

  One value cannot serve both jobs. The provider accepts an `https` redirect URI alone, and only a
  custom scheme ends a browser session. With no value that matches, the login still completes through
  the app's own deep link, but nothing closes the browser and it stays on top of the Pay tab.

  Mobile takes the value from `PAY_TAB_DEEP_LINK`, a new constant that sits beside the linking config
  and shares the path that config maps onto the Pay tab, so the two cannot drift. It is not an
  environment variable: the scheme is declared in `AndroidManifest.xml` and `Info.plist`, so it cannot
  change without a release. Desktop passes no `deepLink`, because the user's own browser opens the page
  and reports nothing back (LIVE-34740).

### Patch Changes

- Updated dependencies [[`e732d3e`](https://github.com/LedgerHQ/ledger-live/commit/e732d3e258c653fc83e1474434f3bb02c136ae62), [`f64ceec`](https://github.com/LedgerHQ/ledger-live/commit/f64ceecbdaccec2c56ace4cc459d670db5920b68), [`d5ea888`](https://github.com/LedgerHQ/ledger-live/commit/d5ea888d3a154feeb29b452841749d358629b8c1), [`0ad6182`](https://github.com/LedgerHQ/ledger-live/commit/0ad6182ac7fa955c01a8fd679182f7fe3b83cace), [`eba4d17`](https://github.com/LedgerHQ/ledger-live/commit/eba4d175ad10f1431a222a4fa98481ea4285e891)]:
  - @features/platform-card@0.3.0-next.0
  - @domain/api-card-management@0.3.0-next.0

## 0.3.0

### Minor Changes

- [#20784](https://github.com/LedgerHQ/ledger-live/pull/20784) [`19e578a`](https://github.com/LedgerHQ/ledger-live/commit/19e578a92209e96cabe400661757689e73b43005) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Move the Pay Card UI Redux state out of the removed `@domain/entity-pay-card` package into the owning feature flows: the balance filter goes to `@features/flow-pay-card-balance` and the feature-tour seen flag to `@features/flow-pay-card-feature-tour`. The apps keep persisting it under the existing `payCard` key (no data migration). Both flows expose a UI-free `./state` entry so store, persistence and test setup can use the slice without pulling in the flow UI.

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

### Patch Changes

- Updated dependencies [[`e07e0ba`](https://github.com/LedgerHQ/ledger-live/commit/e07e0baca2e4edfe90163367047459257034f7cc), [`19e578a`](https://github.com/LedgerHQ/ledger-live/commit/19e578a92209e96cabe400661757689e73b43005), [`e54d98b`](https://github.com/LedgerHQ/ledger-live/commit/e54d98b123ad8814be57c2f0e0f26689902ab4fd)]:
  - @domain/api-card-management@0.2.0

## 0.3.0-next.0

### Minor Changes

- [#20784](https://github.com/LedgerHQ/ledger-live/pull/20784) [`19e578a`](https://github.com/LedgerHQ/ledger-live/commit/19e578a92209e96cabe400661757689e73b43005) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Move the Pay Card UI Redux state out of the removed `@domain/entity-pay-card` package into the owning feature flows: the balance filter goes to `@features/flow-pay-card-balance` and the feature-tour seen flag to `@features/flow-pay-card-feature-tour`. The apps keep persisting it under the existing `payCard` key (no data migration). Both flows expose a UI-free `./state` entry so store, persistence and test setup can use the slice without pulling in the flow UI.

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

### Patch Changes

- Updated dependencies [[`e07e0ba`](https://github.com/LedgerHQ/ledger-live/commit/e07e0baca2e4edfe90163367047459257034f7cc), [`19e578a`](https://github.com/LedgerHQ/ledger-live/commit/19e578a92209e96cabe400661757689e73b43005), [`e54d98b`](https://github.com/LedgerHQ/ledger-live/commit/e54d98b123ad8814be57c2f0e0f26689902ab4fd)]:
  - @domain/api-card-management@0.2.0-next.0

## 0.2.0

### Minor Changes

- [#20404](https://github.com/LedgerHQ/ledger-live/pull/20404) [`0f89b44`](https://github.com/LedgerHQ/ledger-live/commit/0f89b44de874d3921ff93b323c7db0f00d22cac6) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Replace the legacy Pay Card placeholders with the shared authentication flow on desktop and mobile

- [#20459](https://github.com/LedgerHQ/ledger-live/pull/20459) [`6258380`](https://github.com/LedgerHQ/ledger-live/commit/62583805c47b3af4724f6cf693f209c7744228bc) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Split Pay Card authentication configuration and entry points by platform

- [#20489](https://github.com/LedgerHQ/ledger-live/pull/20489) [`e1e005d`](https://github.com/LedgerHQ/ledger-live/commit/e1e005daff0d3e01ef397ac752cbc711245539a7) Thanks [@ysitbon](https://github.com/ysitbon)! - Take the shared flow jest configuration from `@support/jest-features-flow` instead of `@features/platform-jest-config`. The package moved to the `support/` layer, which is where development-only tooling belongs; its API is unchanged.

- [#20495](https://github.com/LedgerHQ/ledger-live/pull/20495) [`6694d77`](https://github.com/LedgerHQ/ledger-live/commit/6694d77f1fc4a691e2d97a2d44e8bf9513cecb1e) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Fix platform-specific CardLogin entry point detection

### Patch Changes

- Updated dependencies [[`a61f702`](https://github.com/LedgerHQ/ledger-live/commit/a61f702a6e41f2bf84d5602930e261a708507efa), [`2edf614`](https://github.com/LedgerHQ/ledger-live/commit/2edf614eed7608714821ee54574d8c4d2b6f7d98), [`9e45705`](https://github.com/LedgerHQ/ledger-live/commit/9e45705b649513c3f9797c2add485a0ba3ea7a6c)]:
  - @domain/entity-pay-card@0.3.0
  - @domain/api-pay-card@0.2.1

## 0.2.0-next.0

### Minor Changes

- [#20404](https://github.com/LedgerHQ/ledger-live/pull/20404) [`0f89b44`](https://github.com/LedgerHQ/ledger-live/commit/0f89b44de874d3921ff93b323c7db0f00d22cac6) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Replace the legacy Pay Card placeholders with the shared authentication flow on desktop and mobile

- [#20459](https://github.com/LedgerHQ/ledger-live/pull/20459) [`6258380`](https://github.com/LedgerHQ/ledger-live/commit/62583805c47b3af4724f6cf693f209c7744228bc) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Split Pay Card authentication configuration and entry points by platform

- [#20489](https://github.com/LedgerHQ/ledger-live/pull/20489) [`e1e005d`](https://github.com/LedgerHQ/ledger-live/commit/e1e005daff0d3e01ef397ac752cbc711245539a7) Thanks [@ysitbon](https://github.com/ysitbon)! - Take the shared flow jest configuration from `@support/jest-features-flow` instead of `@features/platform-jest-config`. The package moved to the `support/` layer, which is where development-only tooling belongs; its API is unchanged.

- [#20495](https://github.com/LedgerHQ/ledger-live/pull/20495) [`6694d77`](https://github.com/LedgerHQ/ledger-live/commit/6694d77f1fc4a691e2d97a2d44e8bf9513cecb1e) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Fix platform-specific CardLogin entry point detection

### Patch Changes

- Updated dependencies [[`a61f702`](https://github.com/LedgerHQ/ledger-live/commit/a61f702a6e41f2bf84d5602930e261a708507efa), [`2edf614`](https://github.com/LedgerHQ/ledger-live/commit/2edf614eed7608714821ee54574d8c4d2b6f7d98), [`9e45705`](https://github.com/LedgerHQ/ledger-live/commit/9e45705b649513c3f9797c2add485a0ba3ea7a6c)]:
  - @domain/entity-pay-card@0.3.0-next.0
  - @domain/api-pay-card@0.2.1-next.0

# ledger-live-desktop

## 4.18.0-next.2

### Minor Changes

- [#21165](https://github.com/LedgerHQ/ledger-live/pull/21165) [`e903cf0`](https://github.com/LedgerHQ/ledger-live/commit/e903cf05f66c5fbef8e221a1cbe7aa0e8b811257) Thanks [@sarneijim](https://github.com/sarneijim)! - Add missing Touchscreen Upgrade Program tracking for Backup Hub Recovery Key upsell and Lazy Onboarding Banner (LIVE-36494)

## 4.18.0-next.1

### Minor Changes

- [#21116](https://github.com/LedgerHQ/ledger-live/pull/21116) [`6bf8331`](https://github.com/LedgerHQ/ledger-live/commit/6bf833159a6533b2196d9fde9be2533b72c3521b) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Stack the LNS upsell banner above the hardware carousel instead of squeezing it into a tile slot, share a carousel with action cards only on mobile, and stop the Content Cards QA console from collapsing every Top wallet preset into the "alwayson" category

## 4.18.0-next.0

### Minor Changes

- [#20911](https://github.com/LedgerHQ/ledger-live/pull/20911) [`4014093`](https://github.com/LedgerHQ/ledger-live/commit/4014093fe5fb899fdeae22f12b24c07540d2b2bf) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Expose useOpenPrefillAddAddressFlow and mount PrefillAddAddressFlowRoot on Desktop and Mobile so consumers such as Send can open the prefilled Add Address flow without depending on Contacts internals.

- [#21025](https://github.com/LedgerHQ/ledger-live/pull/21025) [`de982e6`](https://github.com/LedgerHQ/ledger-live/commit/de982e6a9ef6e2a27789212bee2729c7141193ad) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix Contacts edit flow so the device connection prompt appears after saving a contact name or address, not before opening the edit form.

- [#20986](https://github.com/LedgerHQ/ledger-live/pull/20986) [`9965d7f`](https://github.com/LedgerHQ/ledger-live/commit/9965d7ffb37efc1a2f50fe49c199afa2f05446bf) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add `@features/platform-verify-address-intent`, a Device Intent that verifies a receive address on the device Secure Screen, and wire it to the desktop Pay tab Verify CTA.

  The host injects a family-agnostic `startAddressVerification` (generic `getAddress` over the DIE DMK transport). When `ldmkTransport` is off, Verify opens the classic Receive modal. Address comparison is encoding-aware (case-insensitive for hex, exact otherwise). `verified` / `cancelled` / `unsupported` return to the request summary; `mismatch` closes the flow.

  Generalize desktop `InfoState` by adding a full-width `content` slot and optional `backgroundTone` support for the `spot` preset.

- [#20962](https://github.com/LedgerHQ/ledger-live/pull/20962) [`6218989`](https://github.com/LedgerHQ/ledger-live/commit/6218989cc9b12b7574660a98c465a3899db0083e) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Wire the desktop Pay tab Request "Verify" action: pressing it closes the receive dialog and opens the shared VerifyAddress overlay (intro then success), tracking the `Page Request Address Verification` page view. The device intent (DIE) is kept behind the exposed `showSuccess` bridge for LIVE-36132.

  Make the request action `onShare` (mobile-only) and `onSave` (desktop-only) callbacks optional, align the request verify tracking button to `verify`, and give the VerifyAddress dialog an InfoState-style muted background with centered next steps.

- [#20727](https://github.com/LedgerHQ/ledger-live/pull/20727) [`53938d6`](https://github.com/LedgerHQ/ledger-live/commit/53938d6669a1e8cbc4e2e21f0e038762da047abe) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwdm): add the contact avatar component in the new send flow

- [#21067](https://github.com/LedgerHQ/ledger-live/pull/21067) [`291f4b7`](https://github.com/LedgerHQ/ledger-live/commit/291f4b77c619521f3413c1146bcfba41aa2000f7) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the Pay tab card container on desktop, rendered through a new right-panel variant system that dispatches between the swap sidebar and the Pay card

- [#20993](https://github.com/LedgerHQ/ledger-live/pull/20993) [`2a4b4b1`](https://github.com/LedgerHQ/ledger-live/commit/2a4b4b195a6074b0197e022f7c3ad3cc51b9cf90) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Move Aptos and crypto_org account migrations out of DataModel into app-level accountModel

- [#20917](https://github.com/LedgerHQ/ledger-live/pull/20917) [`f427599`](https://github.com/LedgerHQ/ledger-live/commit/f42759916771b6445544255700082ccdaa3466c4) Thanks [@deepyjr](https://github.com/deepyjr)! - Allow numbers in contact names and hide add-contact actions when a Contacts search has no results.

- [#20902](https://github.com/LedgerHQ/ledger-live/pull/20902) [`7d473f5`](https://github.com/LedgerHQ/ledger-live/commit/7d473f514bca18b7142dbf706120e057dd49d9cf) Thanks [@deepyjr](https://github.com/deepyjr)! - Use the Contacts address-group resolver without an app-specific currency adapter.

- [#20918](https://github.com/LedgerHQ/ledger-live/pull/20918) [`15a872a`](https://github.com/LedgerHQ/ledger-live/commit/15a872a518b6891252e6e8a6138c6d94bea65e9a) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Add hardware carousel close all control on portfolio

- [#20934](https://github.com/LedgerHQ/ledger-live/pull/20934) [`d8c04dd`](https://github.com/LedgerHQ/ledger-live/commit/d8c04ddf5e8bc7a6994d59475e12381dd28f403a) Thanks [@deepyjr](https://github.com/deepyjr)! - Fix Contacts entry point styling and return navigation to Ledger Wallet addresses.

- [#20909](https://github.com/LedgerHQ/ledger-live/pull/20909) [`c6b6f85`](https://github.com/LedgerHQ/ledger-live/commit/c6b6f853396706d576523186c7a841821974274c) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Fix duplicate WebHID connections when known devices update during device discovery

- [#20922](https://github.com/LedgerHQ/ledger-live/pull/20922) [`e8d823f`](https://github.com/LedgerHQ/ledger-live/commit/e8d823f4178da9f18fdc2df801a77b6cb765a6e7) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Add Device Intent Executor orchestration playground in Developer settings

- [#20966](https://github.com/LedgerHQ/ledger-live/pull/20966) [`9470502`](https://github.com/LedgerHQ/ledger-live/commit/947050267c2733e7d0087865d2e9b29edf7f6413) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Scaffold Contacts Device Intent Executor contracts and colocate platform definitions

- [#20852](https://github.com/LedgerHQ/ledger-live/pull/20852) [`f8a01e0`](https://github.com/LedgerHQ/ledger-live/commit/f8a01e0cc4467867c9bf9ce27885269fe1510aeb) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Default starredMarketCoinsSelector to an empty array so MarketBanner cannot crash on incomplete settings.

- [#20982](https://github.com/LedgerHQ/ledger-live/pull/20982) [`aebea36`](https://github.com/LedgerHQ/ledger-live/commit/aebea3672c0156836bf2b837c9dc7a70b0d9c475) Thanks [@alexstapenka-ledger](https://github.com/alexstapenka-ledger)! - Restore Earn webview focus after the account picker so deposit amount autofocus works

- [#20872](https://github.com/LedgerHQ/ledger-live/pull/20872) [`d4bb463`](https://github.com/LedgerHQ/ledger-live/commit/d4bb46367e40a98a454c72e71ccc73b2dc75b417) Thanks [@deepyjr](https://github.com/deepyjr)! - Fix Contact sharing and align empty address copy

- [#20882](https://github.com/LedgerHQ/ledger-live/pull/20882) [`ed42292`](https://github.com/LedgerHQ/ledger-live/commit/ed42292db6f47e4a2a9f39f8f6c3cd6806dc6fe7) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Wire Contacts edit-address validation and analytics into desktop.

- [#21018](https://github.com/LedgerHQ/ledger-live/pull/21018) [`903e0da`](https://github.com/LedgerHQ/ledger-live/commit/903e0da68917f662f2c801e269b88858a2ac6cf2) Thanks [@ishaba](https://github.com/ishaba)! - fix(canton): fix kiln validator name typo in setup copy

- [#20887](https://github.com/LedgerHQ/ledger-live/pull/20887) [`aa39333`](https://github.com/LedgerHQ/ledger-live/commit/aa393339789242783b168398cb5122a7f1e3f620) Thanks [@fAnselmi-Ledger](https://github.com/fAnselmi-Ledger)! - Add Solana TXC flag

- [#20900](https://github.com/LedgerHQ/ledger-live/pull/20900) [`7fcbc76`](https://github.com/LedgerHQ/ledger-live/commit/7fcbc762030510cbf4be82b32aa4698e8d6f68b1) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Prevent dismissing device intent dialogs while a device action is pending.

- [#21036](https://github.com/LedgerHQ/ledger-live/pull/21036) [`c98a1b9`](https://github.com/LedgerHQ/ledger-live/commit/c98a1b9e3a86f4c9fb6c42e8837aef5ae58af8ea) Thanks [@vpenskyi-ledger](https://github.com/vpenskyi-ledger)! - Fix: sell quotes now correctly shown when returning from a provider via "Back to quote". Previously, BuySellUI defaulted to buy mode because the stored flow name was not passed back during navigation. Desktop also removed a hardcoded `|| "buy"` fallback when saving the flow name to localStorage.

- [#21063](https://github.com/LedgerHQ/ledger-live/pull/21063) [`c566744`](https://github.com/LedgerHQ/ledger-live/commit/c566744a1a52db2843b3edeeb57c22043e704655) Thanks [@deepyjr](https://github.com/deepyjr)! - Persist Contacts locally and synchronize them through Ledger Sync.

- [#20861](https://github.com/LedgerHQ/ledger-live/pull/20861) [`4eb83b2`](https://github.com/LedgerHQ/ledger-live/commit/4eb83b23c37a4d5c7997ee3a3e2645fb900e3b28) Thanks [@deepyjr](https://github.com/deepyjr)! - Show unavailable Contacts asset and network options as disabled in the asset drawer.

- [#20805](https://github.com/LedgerHQ/ledger-live/pull/20805) [`3722c36`](https://github.com/LedgerHQ/ledger-live/commit/3722c36b41ae0347ac4aed55178a1c20840d1d51) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Add the hardware carousel UI component for Braze category cards on desktop.

- [#21044](https://github.com/LedgerHQ/ledger-live/pull/21044) [`b2a2e9e`](https://github.com/LedgerHQ/ledger-live/commit/b2a2e9ecec155c4ff3fdefa0b22e0ac2226bf830) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(send): search by contact name as recipient in the send

- [#20894](https://github.com/LedgerHQ/ledger-live/pull/20894) [`49157dc`](https://github.com/LedgerHQ/ledger-live/commit/49157dcea4e1b4c9d5ba01747ec7276acb795607) Thanks [@LL782](https://github.com/LL782)! - Fix Ledger Sync being wiped on every launch when Password Lock is enabled. `app.trustchain` is an encrypted db path, so before unlock it reads back as a ciphertext string; importing it regenerated member credentials, nulled the trustchain, and persisted that fresh state over the encrypted blob in plaintext. The import is now skipped while the value is still a string, and trustchain writes are suppressed while the app is locked.

- [#20938](https://github.com/LedgerHQ/ledger-live/pull/20938) [`73f303f`](https://github.com/LedgerHQ/ledger-live/commit/73f303fc9eed76b677d322628fe9f211d74807d5) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Show a branded `QrCode` (asset icon in the center) on Pay Card request receive (LIVE-36233).

- [#20876](https://github.com/LedgerHQ/ledger-live/pull/20876) [`1ba0ceb`](https://github.com/LedgerHQ/ledger-live/commit/1ba0ceb64143f29712b8c8d68871e12a4b6ad065) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Block Recover on desktop for Nano S-only wallets with a dismissible upgrade modal (LIVE-35465).

- [#20834](https://github.com/LedgerHQ/ledger-live/pull/20834) [`01c088d`](https://github.com/LedgerHQ/ledger-live/commit/01c088db6a0597a479f6371c3a3db81157ead41e) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add a My Wallet Profile LNS upsell banner gated by `largeScreenUpsell.banners.profile` (LIVE-35481). Require `utmContent` on `buildLargeScreenUpsellCtaLink` and export `LARGE_SCREEN_UPSELL_UTM`.

- [#20925](https://github.com/LedgerHQ/ledger-live/pull/20925) [`91dbf02`](https://github.com/LedgerHQ/ledger-live/commit/91dbf023257961c3f15725f57abf273d2190e3c5) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Gate Recover Nano S intercept and Backup Hub Recovery Key warning with `largeScreenUpsell.params.banners["recover-page-block-nano-s-only"]` and `banners["backup-hub-recovery-key-text-warning"]`.

- [#20799](https://github.com/LedgerHQ/ledger-live/pull/20799) [`585d8d7`](https://github.com/LedgerHQ/ledger-live/commit/585d8d78d5e153186c39ee2abfcdb7dc4a5d06e0) Thanks [@ishaba](https://github.com/ishaba)! - Migrate Tron to the generic coin framework (LIVE-34994).

  Adds a per-family pending-operation `extra` to the generic framework: `OptimisticOperationDescriptor` gains an optional `extra` bag and `describeOptimisticOperation` receives the transaction it describes, with framework-reserved keys stripped so a family cannot shadow them.

- [#20669](https://github.com/LedgerHQ/ledger-live/pull/20669) [`f7e5005`](https://github.com/LedgerHQ/ledger-live/commit/f7e5005f306b306042e3022fcb299ef499e7491a) Thanks [@YazhuEth](https://github.com/YazhuEth)! - feat(lwd): display the contact name and avatar in the send header

  The Amount step now shows the matched contact instead of the truncated address, using the shared `ContactAvatar`. The Recipient card moves to the same component, so both steps render the same colour and initials.

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

- [#20898](https://github.com/LedgerHQ/ledger-live/pull/20898) [`ff7e5e0`](https://github.com/LedgerHQ/ledger-live/commit/ff7e5e0ed085c7fb895eeaad844c3e373e791b8b) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the web RequestReceive dialog (asset icon, network row, highlighted address, action tiles) and wire the Pay tab Request tile on desktop to open it with copy support (LIVE-36120).

- [#21082](https://github.com/LedgerHQ/ledger-live/pull/21082) [`655bcb4`](https://github.com/LedgerHQ/ledger-live/commit/655bcb481d0c5287478f7becaac6444c91dc0325) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Render the Pay card visual with a mock balance in the Pay tab right panel, wiring the new `@features/flow-pay-card-details` `CardVisual` through an MVVM view model.

- [#20942](https://github.com/LedgerHQ/ledger-live/pull/20942) [`8c438f9`](https://github.com/LedgerHQ/ledger-live/commit/8c438f9bec55614174c6faca7ebeb77c8e64aaef) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Plug the Modular Asset Drawer into the Pay tab Request and Add stablecoin actions, filtering selection to the stablecoin category so users can pick asset, network and account without over-long request URLs

- [#21037](https://github.com/LedgerHQ/ledger-live/pull/21037) [`aafb541`](https://github.com/LedgerHQ/ledger-live/commit/aafb54165b7fccf1f861a85735bf71410f1b8b1f) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Wire the Pay tab "New payment" action to open the new Send flow with a stablecoin-filtered account picker and `source: "Pay"`

- [#20953](https://github.com/LedgerHQ/ledger-live/pull/20953) [`fabb26b`](https://github.com/LedgerHQ/ledger-live/commit/fabb26be5baa28c00cfa05b4c94aa6a74d15c2ed) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Save the Pay request card (QR + address) as a PNG image through the native OS save dialog

- [#20868](https://github.com/LedgerHQ/ledger-live/pull/20868) [`7623d4e`](https://github.com/LedgerHQ/ledger-live/commit/7623d4ed803291fc33f8c02a0fe1e27abbf4498a) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Skip the Noah receive options step when depositing from Pay so users are not asked to choose crypto vs bank transfer twice

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

- [#20901](https://github.com/LedgerHQ/ledger-live/pull/20901) [`6e1e0aa`](https://github.com/LedgerHQ/ledger-live/commit/6e1e0aa7b317b7fb5f7c73161198536232b3881e) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Stop using generateAnonymousId for Braze identity

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

- [#20893](https://github.com/LedgerHQ/ledger-live/pull/20893) [`33d89c0`](https://github.com/LedgerHQ/ledger-live/commit/33d89c073b1a299cd964375337031ece8830c9c6) Thanks [@deepyjr](https://github.com/deepyjr)! - Hide balances and preserve market-cap order in the Contacts currency selector.

- [#20865](https://github.com/LedgerHQ/ledger-live/pull/20865) [`5b45a76`](https://github.com/LedgerHQ/ledger-live/commit/5b45a76a008034ee96e668a3299ebd352a879d1e) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Update Device Intent Executor copy to match Figma (LIVE-34689, LIVE-34690)

- [#20974](https://github.com/LedgerHQ/ledger-live/pull/20974) [`97f75d2`](https://github.com/LedgerHQ/ledger-live/commit/97f75d2d85d0072cdb94bb9d26a68b610a27bb81) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Remove the flaky Default analytics consent mount test

- [#21027](https://github.com/LedgerHQ/ledger-live/pull/21027) [`1b3bf54`](https://github.com/LedgerHQ/ledger-live/commit/1b3bf545354b1c12e212b612287591c7daaa1aec) Thanks [@dgreen-ledger](https://github.com/dgreen-ledger)! - Disable Braze user-supplied JavaScript in HTML in-app messages and banners for security hardening

- [#20880](https://github.com/LedgerHQ/ledger-live/pull/20880) [`79bd143`](https://github.com/LedgerHQ/ledger-live/commit/79bd143c2b2fe9dd4036ffbf2f75b82afc6e677f) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Hide accounts that cannot send from the send pickers, and accounts that cannot receive from the receive pickers (HyperCore)

- [#20555](https://github.com/LedgerHQ/ledger-live/pull/20555) [`9e0c703`](https://github.com/LedgerHQ/ledger-live/commit/9e0c703631379409b5a9bee047832e9ac147a249) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Isolate wallet sync module failures instead of failing the whole sync: the aggregator validates each module slice on its own and quarantines a broken one, preserving its raw distant value, while every other module keeps syncing. A quarantine is reported as the module key plus the failure kind only, never the offending data.

  A distant document is now typed as what it is — a `DistantDocument` (`Record<string, unknown>`) whose slices are trusted per module — instead of the aggregate of the module schemas that nothing validates. `parseDistantState` is removed: it cast an unvalidated document to a validated type, and the aggregator already narrows the document at runtime. `CloudSyncSDK` drops its `schema` constructor option, which was never applied to anything and only served to infer that same misleading type; the class is now parameterised by its document type directly.

  `recentAddresses` drops its corrupted-address repair path. `CorruptedNestedAddressDistantSchema` and the lenient `z.array(z.unknown())` wrapper that swallowed every bad entry are removed together: a corrupted distant entry now quarantines the module, so the slice is preserved verbatim and reported, instead of being silently rewritten — or, had only the transform been removed, silently dropped. The local-cache repair in `schema.ts`/`store.ts` is untouched; it migrates data on disk, which quarantine does not cover.

- [#21046](https://github.com/LedgerHQ/ledger-live/pull/21046) [`e11eebe`](https://github.com/LedgerHQ/ledger-live/commit/e11eebedce8093322ce9dd9140be2e1f29817735) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(send): add network-filtered contact selection to the Send recipient step on desktop and mobile

- [#20505](https://github.com/LedgerHQ/ledger-live/pull/20505) [`f4ed19f`](https://github.com/LedgerHQ/ledger-live/commit/f4ed19f310eeb9cfad9e56665b9c2f2b40097925) Thanks [@deepyjr](https://github.com/deepyjr)! - Connect Contacts mutations to Ledger Sync availability and activation on Desktop and Mobile.

- [#20854](https://github.com/LedgerHQ/ledger-live/pull/20854) [`f32bf30`](https://github.com/LedgerHQ/ledger-live/commit/f32bf306ae16af24a98aff16c9c2342f496b905c) Thanks [@ishaba](https://github.com/ishaba)! - fix(coin-sui): map device 0x8 on address-balance send to clear error

- [#21064](https://github.com/LedgerHQ/ledger-live/pull/21064) [`32c64ba`](https://github.com/LedgerHQ/ledger-live/commit/32c64bab5dc9193982c843e5a73358aad5e8fa37) Thanks [@deepyjr](https://github.com/deepyjr)! - Stabilize desktop Playwright settings and DevTools checks.

- [#20978](https://github.com/LedgerHQ/ledger-live/pull/20978) [`ca9496a`](https://github.com/LedgerHQ/ledger-live/commit/ca9496af8ed57da0b395b5abc1a6dcaa265e398e) Thanks [@deepyjr](https://github.com/deepyjr)! - Open the amount step when sending to a saved contact.

- [#20650](https://github.com/LedgerHQ/ledger-live/pull/20650) [`fbc8036`](https://github.com/LedgerHQ/ledger-live/commit/fbc8036d9bd4e1cc30eea4233f05e8b0498c0e5e) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Add a gRPC-web transport to the Sui coin module

  - `coin-sui` gains a third transport on `sui.rpc.v2` over gRPC-web, covering every capability from
    checkpoints to device signing.
  - New tri-state `suiTransport` feature flag (`json` | `grpc` | `graphql`), defaulting to `json`,
    replaces the boolean `suiGraphqlTransport`, which is removed. An unrecognised value resolves to
    `json`.
  - New env vars `API_SUI_GRPC_PROXY` and `API_SUI_TESTNET_GRPC_PROXY`. `@mysten/sui` 2.9.0 → 2.23.1.
  - Operation `blockHash` carries the real checkpoint digest on gRPC.
  - Fix: account sync read a single page of history on GraphQL and gRPC, capping an account at its
    newest 50 operations for good — sync resumes from the newest stored operation and never re-reads
    what it skipped. Both arms now walk up to `TRANSACTIONS_LIMIT` (300), the depth JSON-RPC reached.
  - Fix: a resumed sync on GraphQL and gRPC read backwards from the tip, so when more than
    `TRANSACTIONS_LIMIT` transactions arrived between two syncs, the ones in the middle were skipped
    and the next sync resumed above them — a permanent hole. Both arms now walk forward from the
    cursor, as the JSON-RPC arm already did, leaving anything unread newer than the next resume point.
  - Fix: an account holding no operations resumed from its stored `syncHash`, so a cleared cache came
    back with only the transactions that arrived after it. Such an account now re-reads its history,
    which is also how one truncated by the bug above recovers. Token operations count as history: they
    live in the subaccounts, so a token-only account is no longer treated as empty.
  - Fix: on gRPC, any failure to resolve a cursor's digest — including a transient network error — was
    read as "unknown digest", which falls back to an unbounded page from the tip and made paging report
    the end of history. Only a `NOT_FOUND` does that now; everything else propagates and is retried.
  - Fix: reading history skipped transactions that shared a checkpoint with the resume point, in
    account sync (`getOperations`) as well as paging (`getListOperations`).
  - Fix: paging inferred "more to come" from how many operations survived client-side filtering, which
    ended the walk early. GraphQL now reads `pageInfo`, gRPC the stream's `QueryEnd` reason. A page
    whose transactions were all filtered out now resumes from the page's own boundary instead of
    reporting the end of history.
  - Fix: a gRPC history record with no timestamp became an operation dated 1970 that could not serve as
    a pagination cursor. Those records are now dropped, as the GraphQL arm already did.
  - Fix: ascending paging on GraphQL returned the newest slice of the range instead of walking forward
    from the oldest.
  - Fix: the Sui fetcher dropped `X-Ledger-Client-Version` and all gRPC-web headers when passed a
    `Headers` instance.
  - Fix: GraphQL resolved the latest checkpoint in two queries, so the second could answer null. It is
    now one query.
  - A checkpoint missing its `digest` or `timestamp` now raises on both GraphQL and gRPC, instead of
    reporting a block with an empty hash and a 1970 timestamp.
  - Known limitation: `getListOperations` resumes from a synthesised `timestamp:digest` cursor, so
    within one checkpoint a sibling whose digest sorts earlier can be skipped, and a checkpoint holding
    more than one page is stepped over rather than resumed inside. Account sync is unaffected: it
    resumes from the server's own watermark cursor.

- [#20924](https://github.com/LedgerHQ/ledger-live/pull/20924) [`83a2392`](https://github.com/LedgerHQ/ledger-live/commit/83a2392315107835cb924ee88c3f93816d4a234e) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Reject a SUI unstake above the staking position's principal, and make the remainder error actionable

  A partial unstake calls `staking_pool::split`, which asserts the withdrawn amount is at most the
  principal. Nothing validated that locally, so an amount far above the staked balance passed
  validation and only aborted on chain. It now fails with a dedicated error. The remainder error also
  names the way out — withdraw in full — because a position under 2 SUI cannot be split at all.

- [#20949](https://github.com/LedgerHQ/ledger-live/pull/20949) [`a56baa8`](https://github.com/LedgerHQ/ledger-live/commit/a56baa8d0b71460066bc8173767920049aa50e37) Thanks [@pawell24](https://github.com/pawell24)! - Fold a Zcash account's shielded balance sync into the standard automatic wallet sync instead of requiring a manual trigger, and make that trigger unconditional and spam-proof. The account page's shielded balance now refreshes on launch and on the regular sync interval, the Amount step of a send refreshes it when moving on from the Recipient step, and a completed private transfer triggers a follow-up sync so the account page converges without a manual refresh. The manual "sync balance" action is now offered and enabled in every state, including once a scan has completed, and clicking it while a sync is already running no longer cancels and restarts it.

- [#20955](https://github.com/LedgerHQ/ledger-live/pull/20955) [`39a676d`](https://github.com/LedgerHQ/ledger-live/commit/39a676d2f861d04913264e61100205b4f6044cf9) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix: move hedera envs to config/constants

- [#21052](https://github.com/LedgerHQ/ledger-live/pull/21052) [`acbc7b9`](https://github.com/LedgerHQ/ledger-live/commit/acbc7b91ef8a85b6503a4729fdab367977770a78) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Add type and layout on hardware carousel content card impressions

- [#20956](https://github.com/LedgerHQ/ledger-live/pull/20956) [`41311d6`](https://github.com/LedgerHQ/ledger-live/commit/41311d69b2d29dac534c98f6bd2917f7b558c14e) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Add shop UTMs on hardware carousel card clicks in the desktop portfolio

- [#20860](https://github.com/LedgerHQ/ledger-live/pull/20860) [`60f343c`](https://github.com/LedgerHQ/ledger-live/commit/60f343ce0cbf9edc8ceebaf8c27bba380f58214c) Thanks [@YazhuEth](https://github.com/YazhuEth)! - chore: bump the Lumen packages to the latest pinned set

  `AddressInput` now accepts a `ReactNode` prefix, and `BaseInput` is no longer exported by Lumen. Both apps only consume Lumen internally, so their own public API is unchanged. The Lumen packages pin each other on exact versions, so they move together.

- [#20889](https://github.com/LedgerHQ/ledger-live/pull/20889) [`569d202`](https://github.com/LedgerHQ/ledger-live/commit/569d2026f18489ef96173960c9787197e77e0652) Thanks [@vladyslavchupovskiy-ext-art](https://github.com/vladyslavchupovskiy-ext-art)! - [ZEC] Replace pool-exclusion warning banner with spendable/maturing breakdown; move pool warning into private balance tooltip.

### Patch Changes

- Updated dependencies [[`61b4b5f`](https://github.com/LedgerHQ/ledger-live/commit/61b4b5f293524a51f9d34c11e7113c3c923e8dbd), [`26d8617`](https://github.com/LedgerHQ/ledger-live/commit/26d86172869e47608dd0f0e26dfbc905dafa3588), [`a86fe14`](https://github.com/LedgerHQ/ledger-live/commit/a86fe1498de34b86c2a89077a02886a26c6e158a), [`de982e6`](https://github.com/LedgerHQ/ledger-live/commit/de982e6a9ef6e2a27789212bee2729c7141193ad), [`e6ad2f6`](https://github.com/LedgerHQ/ledger-live/commit/e6ad2f6eed4bf5e587a2880e7fa7be937e2764ee), [`9965d7f`](https://github.com/LedgerHQ/ledger-live/commit/9965d7ffb37efc1a2f50fe49c199afa2f05446bf), [`8ebdb6a`](https://github.com/LedgerHQ/ledger-live/commit/8ebdb6aff25864883e189ebc3206a9901f5798a4), [`6218989`](https://github.com/LedgerHQ/ledger-live/commit/6218989cc9b12b7574660a98c465a3899db0083e), [`17a4154`](https://github.com/LedgerHQ/ledger-live/commit/17a415450136066be114ede1f7e591fa4ec3ee5f), [`1d6c394`](https://github.com/LedgerHQ/ledger-live/commit/1d6c39482047fef5b86a4b9511a3e8a1956e30a1), [`98f4802`](https://github.com/LedgerHQ/ledger-live/commit/98f48028b931c5aabf364988c53488e6124cc42e), [`2a4b4b1`](https://github.com/LedgerHQ/ledger-live/commit/2a4b4b195a6074b0197e022f7c3ad3cc51b9cf90), [`bb045d8`](https://github.com/LedgerHQ/ledger-live/commit/bb045d88e3cbeb411643acfc26252e8cb1ce39ac), [`5a30d71`](https://github.com/LedgerHQ/ledger-live/commit/5a30d71a0910bcfeb75a9cface524d7f942f1a7c), [`6560883`](https://github.com/LedgerHQ/ledger-live/commit/6560883682ff7af5f8e61ae79e29f8560ac3f8e2), [`f427599`](https://github.com/LedgerHQ/ledger-live/commit/f42759916771b6445544255700082ccdaa3466c4), [`e998478`](https://github.com/LedgerHQ/ledger-live/commit/e9984787e3352a399b107fc3d4e889ffb02d4fc2), [`bb58645`](https://github.com/LedgerHQ/ledger-live/commit/bb586459d2412e667e35bbaeb1c61b69d06aedf0), [`5a630b2`](https://github.com/LedgerHQ/ledger-live/commit/5a630b2cb982168094177d9a3c21fdf163454ef8), [`d8c04dd`](https://github.com/LedgerHQ/ledger-live/commit/d8c04ddf5e8bc7a6994d59475e12381dd28f403a), [`9470502`](https://github.com/LedgerHQ/ledger-live/commit/947050267c2733e7d0087865d2e9b29edf7f6413), [`e732d3e`](https://github.com/LedgerHQ/ledger-live/commit/e732d3e258c653fc83e1474434f3bb02c136ae62), [`d4bb463`](https://github.com/LedgerHQ/ledger-live/commit/d4bb46367e40a98a454c72e71ccc73b2dc75b417), [`ce4ae4a`](https://github.com/LedgerHQ/ledger-live/commit/ce4ae4a61b4721d8d1ad7b9e8c82a182350d3be4), [`6084fcd`](https://github.com/LedgerHQ/ledger-live/commit/6084fcd6b848049b5240abf32b9ac940603576c0), [`b6bb5b5`](https://github.com/LedgerHQ/ledger-live/commit/b6bb5b537c4536890ca1959357cad1ea2ad5f5d5), [`f64ceec`](https://github.com/LedgerHQ/ledger-live/commit/f64ceecbdaccec2c56ace4cc459d670db5920b68), [`fec3bc8`](https://github.com/LedgerHQ/ledger-live/commit/fec3bc88bacd2705da38c5c5bf5e68e7d734c3b3), [`9fa2ab5`](https://github.com/LedgerHQ/ledger-live/commit/9fa2ab5eb2003fcade4e5821f1253ae27c1af82d), [`f0f10ca`](https://github.com/LedgerHQ/ledger-live/commit/f0f10cae65f1e2015afbac540ecdcd01548356a8), [`55b7e6d`](https://github.com/LedgerHQ/ledger-live/commit/55b7e6d50aa1e97da3b1ae3405263e99b5fe5bde), [`aa39333`](https://github.com/LedgerHQ/ledger-live/commit/aa393339789242783b168398cb5122a7f1e3f620), [`5125ac7`](https://github.com/LedgerHQ/ledger-live/commit/5125ac7d7c27a76541835d596c122f30d04e759b), [`46a0d30`](https://github.com/LedgerHQ/ledger-live/commit/46a0d30f0134786a0be5d1c1b671a9c7955a81e1), [`c566744`](https://github.com/LedgerHQ/ledger-live/commit/c566744a1a52db2843b3edeeb57c22043e704655), [`e1c2a4b`](https://github.com/LedgerHQ/ledger-live/commit/e1c2a4bf3cabe5f58f8b3f8f226dfc90a0ab0296), [`8003387`](https://github.com/LedgerHQ/ledger-live/commit/80033873ea4628cbf9af189c313f73d54b422fb2), [`c0bdd70`](https://github.com/LedgerHQ/ledger-live/commit/c0bdd7075816b44d245832849b28e16f7a169006), [`b2a2e9e`](https://github.com/LedgerHQ/ledger-live/commit/b2a2e9ecec155c4ff3fdefa0b22e0ac2226bf830), [`6c425e0`](https://github.com/LedgerHQ/ledger-live/commit/6c425e0e869c6feed4bd4c87ee0fef5443617708), [`d1ab42f`](https://github.com/LedgerHQ/ledger-live/commit/d1ab42f2b4db3cef7719d25a7b73a4cf223735dd), [`73f303f`](https://github.com/LedgerHQ/ledger-live/commit/73f303fc9eed76b677d322628fe9f211d74807d5), [`1ba0ceb`](https://github.com/LedgerHQ/ledger-live/commit/1ba0ceb64143f29712b8c8d68871e12a4b6ad065), [`01c088d`](https://github.com/LedgerHQ/ledger-live/commit/01c088db6a0597a479f6371c3a3db81157ead41e), [`91dbf02`](https://github.com/LedgerHQ/ledger-live/commit/91dbf023257961c3f15725f57abf273d2190e3c5), [`585d8d7`](https://github.com/LedgerHQ/ledger-live/commit/585d8d78d5e153186c39ee2abfcdb7dc4a5d06e0), [`32f3b76`](https://github.com/LedgerHQ/ledger-live/commit/32f3b7638dbe8c23fd64f60b8eb5e8dfe8f4c74a), [`d6c7592`](https://github.com/LedgerHQ/ledger-live/commit/d6c7592278f2eed430c0451dd1b0a99fdf5b377d), [`f7e5005`](https://github.com/LedgerHQ/ledger-live/commit/f7e5005f306b306042e3022fcb299ef499e7491a), [`f567f20`](https://github.com/LedgerHQ/ledger-live/commit/f567f20c247b03e6335d90a6ac13dc181722c8cb), [`d5ea888`](https://github.com/LedgerHQ/ledger-live/commit/d5ea888d3a154feeb29b452841749d358629b8c1), [`dd64855`](https://github.com/LedgerHQ/ledger-live/commit/dd648554ba49b37a69888d7cd87354ebdd22db20), [`ff7e5e0`](https://github.com/LedgerHQ/ledger-live/commit/ff7e5e0ed085c7fb895eeaad844c3e373e791b8b), [`33007b1`](https://github.com/LedgerHQ/ledger-live/commit/33007b1c0a68912d2cebecd96edb2fe797df17dd), [`35c12b6`](https://github.com/LedgerHQ/ledger-live/commit/35c12b61d14889fe2863be4e9bfa0db581b206e9), [`8c438f9`](https://github.com/LedgerHQ/ledger-live/commit/8c438f9bec55614174c6faca7ebeb77c8e64aaef), [`fabb26b`](https://github.com/LedgerHQ/ledger-live/commit/fabb26be5baa28c00cfa05b4c94aa6a74d15c2ed), [`eba4d17`](https://github.com/LedgerHQ/ledger-live/commit/eba4d175ad10f1431a222a4fa98481ea4285e891), [`4555355`](https://github.com/LedgerHQ/ledger-live/commit/4555355dc1f4162841917325ffd539260322a54d), [`fb4a5bc`](https://github.com/LedgerHQ/ledger-live/commit/fb4a5bc6d78301182f56572ffedbe28bc995f271), [`6e1e0aa`](https://github.com/LedgerHQ/ledger-live/commit/6e1e0aa7b317b7fb5f7c73161198536232b3881e), [`cad4f63`](https://github.com/LedgerHQ/ledger-live/commit/cad4f63be4a3b16880ab490195af1f17921e03c2), [`306a681`](https://github.com/LedgerHQ/ledger-live/commit/306a6813eaabfd67dc575bb7bdfc2b52892037df), [`9fa2ab5`](https://github.com/LedgerHQ/ledger-live/commit/9fa2ab5eb2003fcade4e5821f1253ae27c1af82d), [`582f422`](https://github.com/LedgerHQ/ledger-live/commit/582f422ec2fbe8bb852c7a847c3ee0ff0a01ab32), [`79bd143`](https://github.com/LedgerHQ/ledger-live/commit/79bd143c2b2fe9dd4036ffbf2f75b82afc6e677f), [`9e0c703`](https://github.com/LedgerHQ/ledger-live/commit/9e0c703631379409b5a9bee047832e9ac147a249), [`e11eebe`](https://github.com/LedgerHQ/ledger-live/commit/e11eebedce8093322ce9dd9140be2e1f29817735), [`8161bac`](https://github.com/LedgerHQ/ledger-live/commit/8161bac542474212dfefc8519e714da345b03f71), [`f4ed19f`](https://github.com/LedgerHQ/ledger-live/commit/f4ed19f310eeb9cfad9e56665b9c2f2b40097925), [`a826856`](https://github.com/LedgerHQ/ledger-live/commit/a826856200049687f4b3b37f85bb588eaa4fb4a2), [`b3095f5`](https://github.com/LedgerHQ/ledger-live/commit/b3095f5500b76110b5ce2ed1f08aee9f346a40f3), [`fbc8036`](https://github.com/LedgerHQ/ledger-live/commit/fbc8036d9bd4e1cc30eea4233f05e8b0498c0e5e), [`d6f0c7d`](https://github.com/LedgerHQ/ledger-live/commit/d6f0c7dc9f85002d17f1fa8156b4dc4c2d94e36d), [`a56baa8`](https://github.com/LedgerHQ/ledger-live/commit/a56baa8d0b71460066bc8173767920049aa50e37), [`39a676d`](https://github.com/LedgerHQ/ledger-live/commit/39a676d2f861d04913264e61100205b4f6044cf9), [`9d84383`](https://github.com/LedgerHQ/ledger-live/commit/9d84383b5197f7509eaf232c9a5f12efb6fa162f), [`3908965`](https://github.com/LedgerHQ/ledger-live/commit/3908965e8872b6502558b669897028d39c492f7e), [`41311d6`](https://github.com/LedgerHQ/ledger-live/commit/41311d69b2d29dac534c98f6bd2917f7b558c14e), [`79ee882`](https://github.com/LedgerHQ/ledger-live/commit/79ee882545ea85c8a17027bd685f4b99f1ec84cd), [`4c333ad`](https://github.com/LedgerHQ/ledger-live/commit/4c333ad80187596319d6e0042af331770fc1858e), [`d7a9847`](https://github.com/LedgerHQ/ledger-live/commit/d7a9847244eeff976b10ae1aee39fadafec3d1e2)]:
  - @ledgerhq/live-common@37.4.0-next.0
  - @ledgerhq/coin-evm@5.1.0-next.0
  - @features/flow-contacts-add-address@0.2.0-next.0
  - @features/flow-contacts@0.8.0-next.0
  - @features/flow-pay-card-request@0.2.0-next.0
  - @features/platform-verify-address-intent@0.2.0-next.0
  - @ledgerhq/coin-zcash@0.5.0-next.0
  - @features/flow-large-screen-upsell@2.0.0-next.0
  - @ledgerhq/coin-casper@3.1.0-next.0
  - @features/flow-pay-card-auth@0.4.0-next.0
  - @domain/entity-contact@0.8.0-next.0
  - @features/flow-contacts-list@0.4.0-next.0
  - @features/platform-contacts@0.4.0-next.0
  - @features/platform-card@0.3.0-next.0
  - @devtools/bindings@0.5.0-next.0
  - @devtools/shell@0.9.0-next.0
  - @devtools/transport-panel@0.6.0-next.0
  - @devtools/wire@0.5.0-next.0
  - @shared/api-services@0.5.0-next.0
  - @features/flow-contacts-add-contact@0.4.0-next.0
  - @features/platform-device-intent@5.1.0-next.0
  - @features/flow-contacts-edit-contact@0.2.0-next.0
  - @shared/feature-flags@0.20.0-next.0
  - @ledgerhq/types-live@6.121.0-next.0
  - @ledgerhq/live-wallet@1.1.0-next.0
  - @features/flow-pay-card-balance@0.3.0-next.0
  - @features/flow-pay-card-deposit@0.3.0-next.0
  - @ledgerhq/ledger-key-ring-protocol@0.21.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.1.0-next.0
  - @features/flow-pay-card-details@0.2.0-next.0
  - @shared/env@0.4.0-next.0
  - @features/platform-aggregated-assets@0.5.0-next.0
  - @shared/cloud-sync@0.2.0-next.0
  - @domain/entity-recent-addresses@0.2.0-next.0
  - @features/flow-contacts-introduction@0.3.0-next.0
  - @ledgerhq/asset-detail@0.11.2-next.0
  - @ledgerhq/live-dmk-desktop@0.20.8-next.0
  - @domain/api-aggregated-assets@0.4.1-next.0
  - @domain/api-altcoins-sentiment@0.3.3-next.0
  - @domain/api-currency-fiat@0.4.2-next.0
  - @domain/api-currency-token@0.5.1-next.0
  - @domain/api-market-sentiment@0.3.3-next.0
  - @domain/api-push-devices@0.2.3-next.0
  - @features/platform-currencies@0.6.2-next.0
  - @features/platform-feature-flags@0.6.7-next.0
  - @ledgerhq/asset-aggregation@0.13.2-next.0
  - @ledgerhq/coin-bitcoin@0.51.2-next.0
  - @ledgerhq/coin-canton@1.0.1-next.0
  - @ledgerhq/coin-cardano@1.0.1-next.0
  - @ledgerhq/coin-concordium@1.0.1-next.0
  - @ledgerhq/coin-cosmos@1.0.1-next.0
  - @ledgerhq/coin-filecoin@2.0.1-next.0
  - @ledgerhq/domain-service@1.8.16-next.0
  - @ledgerhq/live-countervalues@0.24.4-next.0
  - @ledgerhq/live-countervalues-react@0.16.8-next.0
  - @ledgerhq/wallet-analytics@0.3.5-next.0
  - @ledgerhq/wallet-pnl@0.7.8-next.0
  - @features/platform-env@0.2.2-next.0
  - @ledgerhq/live-dmk-speculos@0.10.6-next.0
  - @domain/entity-account-name@0.2.1-next.0
  - @features/platform-wallet-sync@0.1.2-next.0
  - @ledgerhq/live-currency-format@0.14.2-next.0
  - @features/flow-analytics-consent@0.2.3-next.0
  - @ledgerhq/wallet-btc@0.3.0

## 4.17.1

### Patch Changes

- [#21065](https://github.com/LedgerHQ/ledger-live/pull/21065) [`8a6a532`](https://github.com/LedgerHQ/ledger-live/commit/8a6a532c79b865cd9d1814f61ae14e75a63d2ff0) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Fix nsh installer on Windows

## 4.17.1-hotfix.0

### Patch Changes

- [#21065](https://github.com/LedgerHQ/ledger-live/pull/21065) [`8a6a532`](https://github.com/LedgerHQ/ledger-live/commit/8a6a532c79b865cd9d1814f61ae14e75a63d2ff0) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Fix nsh installer on Windows

## 4.17.0

### Minor Changes

- [#20611](https://github.com/LedgerHQ/ledger-live/pull/20611) [`5a87153`](https://github.com/LedgerHQ/ledger-live/commit/5a8715341159ffe80f0e380cff2affb9299406cb) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Mount the first-time Pay tab FeatureTour on the PayTab screen in both apps. Visibility is self-gated by the payCard slice (shown on first visit, hidden after dismissal), copy is injected from app-owned i18n keys (payTab.featureTour.\*), and analytics are wired through the view-model. Adds unit and integration coverage for the conditional rendering.

- [#20655](https://github.com/LedgerHQ/ledger-live/pull/20655) [`ec8baad`](https://github.com/LedgerHQ/ledger-live/commit/ec8baadf5077e3891c488cf669615a52ad4873b1) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the desktop Pay hero for the aggregated stablecoin balance. Introduces the `@features/flow-pay-card-balance` package with props-only empty and funded states, wired into the desktop Pay tab and tracking `Page Pay` with the active `balance_filter` (LIVE-34896).

- [#20713](https://github.com/LedgerHQ/ledger-live/pull/20713) [`a3164d8`](https://github.com/LedgerHQ/ledger-live/commit/a3164d88ed131879b072e0b05668a3e881c61850) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the mobile Pay hero for the aggregated stablecoin balance. The `@features/flow-pay-card-balance` package gains props-only native empty and funded states, and both apps now share the portfolio aggregation through `aggregatePayCardBalance` (LIVE-34898). The hero is mounted at the top of the mobile Pay tab, which tracks `Page Pay` with the active `balance_filter` on view.

- [#20844](https://github.com/LedgerHQ/ledger-live/pull/20844) [`5ff320a`](https://github.com/LedgerHQ/ledger-live/commit/5ff320aaa967388af5d1e3f8d869b42739d0a2ed) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Wire the desktop Pay tab "Add stablecoin" tile to the shared Deposit options dialog: pressing it opens the dialog and each option routes to its desktop flow (bank transfer, swap, buy) or the receive asset flow filtered to stablecoins.

  Render the deposit options as Lumen `ListItem` rows.

- [#20644](https://github.com/LedgerHQ/ledger-live/pull/20644) [`936abf0`](https://github.com/LedgerHQ/ledger-live/commit/936abf0cf6c579171aca42ac54e282f7a4c719a4) Thanks [@LucasWerey](https://github.com/LucasWerey)! - chore(deps): bump Lumen design system to latest and migrate CSS to tailwind v4 style

- [#20815](https://github.com/LedgerHQ/ledger-live/pull/20815) [`54fcd49`](https://github.com/LedgerHQ/ledger-live/commit/54fcd49f48deaed0aec71941c8b9926e6b6aee2e) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Exclude immature Ironwood notes from the spendable pool. A shielded note is only spendable once its transaction is buried deep enough to have a witness at the builder's anchor, so a freshly scanned change note is no longer selected while a second send is prepared within the same confirmation window. The rule is applied wherever the spendable pool is derived — note selection, max-spendable and amount validation — and the send flow now reports insufficient spendable funds instead of failing when the transaction is built. Funds held by maturing notes stay part of the account's total balance.

- [#20735](https://github.com/LedgerHQ/ledger-live/pull/20735) [`c3b8717`](https://github.com/LedgerHQ/ledger-live/commit/c3b87177729f809722127debb8556419f56094c1) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add a stablecoin balance filter picker to the Pay card hero.

- [#20833](https://github.com/LedgerHQ/ledger-live/pull/20833) [`2ab3cb8`](https://github.com/LedgerHQ/ledger-live/commit/2ab3cb881721e73ab3ad2f7ee6d6587e08e78530) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Require `utmContent` on `buildLargeScreenUpsellCtaLink` (breaking) and personalise the Backup Hub Recovery Key row for Nano S / SP / X with a warning and large-screen upsell CTA (LIVE-35484).

- [#20683](https://github.com/LedgerHQ/ledger-live/pull/20683) [`74de0e5`](https://github.com/LedgerHQ/ledger-live/commit/74de0e516d60d3aeb77951e3bed3b016ed9bc8b6) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Show only one portfolio Braze banner when the placement area is too narrow for two readable columns, using CSS container queries instead of JS width measurement.

- [#20702](https://github.com/LedgerHQ/ledger-live/pull/20702) [`e07e0ba`](https://github.com/LedgerHQ/ledger-live/commit/e07e0baca2e4edfe90163367047459257034f7cc) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Scaffold the Card API on a single endpoint-less `cardApi` service (DDD, CMC/DADA pattern): add the `services/card` transport in `@shared/api-services` with Bearer + `x-client-key` (`CARD_BAANX_CLIENT_KEY`) + one 401-refresh, the `@domain/api-card-management` endpoint injector, the `@features/platform-card` in-memory session and `getCardSessionToken`/`refreshCardSession` accessors, the `CARD_API_URL` / `CARD_BAANX_CLIENT_KEY` envs, and register `cardApi` in both apps. The legacy `payCardApi` Card Auth holdout is left untouched pending its migration onto `cardApi` (LIVE-33829).

- [#20684](https://github.com/LedgerHQ/ledger-live/pull/20684) [`ead65e0`](https://github.com/LedgerHQ/ledger-live/commit/ead65e03f9de9081e6b348b1ec89339fbf2a97fc) Thanks [@sarneijim](https://github.com/sarneijim)! - Update LNS upsell banner opt-in/opt-out copy and per-placement images to match mobile.

- [#20571](https://github.com/LedgerHQ/ledger-live/pull/20571) [`7c8d5df`](https://github.com/LedgerHQ/ledger-live/commit/7c8d5dfa862a2e9c3a35251b5d06a3cd4f905d2a) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Thread the coin-module `Context` (ADR-019) explicitly through the coin-evm, coin-vechain and coin-near api and logic layers instead of resolving configuration from the module-level `getCoinConfig` singleton. Exported logic functions now take the context as their first argument, resolve `config` from it (`await context.config(currencyId)`), and pass an explicit, required `config` down to the network layer — no `config?` optionals and no singleton reads on the data path. `getCoinConfig`/`setCoinConfig` remain only as the compatibility surface for the classic account bridge. Ledger Live consumers (live-common, desktop, mobile and coin-celo) are updated to resolve and pass config/context explicitly. Also fixes a coin-polkadot type-inference issue where `getTransactionMaterialWithMetadata`'s cache-key extractor narrowed the cached signature and dropped the `config` argument.

- [#20759](https://github.com/LedgerHQ/ledger-live/pull/20759) [`526ca7b`](https://github.com/LedgerHQ/ledger-live/commit/526ca7be272a78b5cbd48481b6c5120989c0731b) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Extract shared Contacts tracking hooks and move currency analytics resolution to platform-contacts.

- [#20420](https://github.com/LedgerHQ/ledger-live/pull/20420) [`494963b`](https://github.com/LedgerHQ/ledger-live/commit/494963b221aab3c71ad7d0d6564f94b870c51abb) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Fix apps not being restored after a firmware update during Early Security Checks (ESC) in sync onboarding

- [#20856](https://github.com/LedgerHQ/ledger-live/pull/20856) [`d0ac51c`](https://github.com/LedgerHQ/ledger-live/commit/d0ac51c757081a7ac6b5d76899097d3be2c1d07f) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Wire the Pay tab "Add stablecoin" tile to the shared Deposit options overlay on both platforms: pressing it opens the dialog (desktop) or bottom sheet (mobile), and each option routes to its platform flow (bank transfer, swap, buy) or the receive flow filtered to stablecoins.

  Extract a shared `useDepositOptionsAdapter` hook in `@features/flow-pay-card-deposit` so desktop and mobile no longer duplicate the deposit options open/close state and props shape.

- [#20907](https://github.com/LedgerHQ/ledger-live/pull/20907) [`da0a5ce`](https://github.com/LedgerHQ/ledger-live/commit/da0a5ceb8f889f1bace45ed2d3d4c640cdf24ca8) Thanks [@fAnselmi-Ledger](https://github.com/fAnselmi-Ledger)! - Add Solana TXC flag

- [#20784](https://github.com/LedgerHQ/ledger-live/pull/20784) [`19e578a`](https://github.com/LedgerHQ/ledger-live/commit/19e578a92209e96cabe400661757689e73b43005) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Move the Pay Card UI Redux state out of the removed `@domain/entity-pay-card` package into the owning feature flows: the balance filter goes to `@features/flow-pay-card-balance` and the feature-tour seen flag to `@features/flow-pay-card-feature-tour`. The apps keep persisting it under the existing `payCard` key (no data migration). Both flows expose a UI-free `./state` entry so store, persistence and test setup can use the slice without pulling in the flow UI.

- [#20778](https://github.com/LedgerHQ/ledger-live/pull/20778) [`eecf99a`](https://github.com/LedgerHQ/ledger-live/commit/eecf99af5c17ab63724843c31d5f3facc6352dad) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-evm): replace `CryptoCurrency` with `currencyId`

- [#20670](https://github.com/LedgerHQ/ledger-live/pull/20670) [`6165c9d`](https://github.com/LedgerHQ/ledger-live/commit/6165c9d4c3082ed97087543b81e9b79c9d47dfa1) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwd): show recipient action only when no bridge error

- [#20929](https://github.com/LedgerHQ/ledger-live/pull/20929) [`dcb3340`](https://github.com/LedgerHQ/ledger-live/commit/dcb33402b48a86d2e014a3223177812a9510a885) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Skip installed-app listing before the ESC firmware update drawer on unseeded devices (LIVE-36215)

- [#20906](https://github.com/LedgerHQ/ledger-live/pull/20906) [`dbb2ee0`](https://github.com/LedgerHQ/ledger-live/commit/dbb2ee0539d4ff713231530efbc2d5814f039dae) Thanks [@LL782](https://github.com/LL782)! - Fix Ledger Sync being wiped on every launch when Password Lock is enabled. `app.trustchain` is an encrypted db path, so before unlock it reads back as a ciphertext string; importing it regenerated member credentials, nulled the trustchain, and persisted that fresh state over the encrypted blob in plaintext. The import is now skipped while the value is still a string, and trustchain writes are suppressed while the app is locked.

- [#20662](https://github.com/LedgerHQ/ledger-live/pull/20662) [`a736d28`](https://github.com/LedgerHQ/ledger-live/commit/a736d281098100088c757a6e422214705d972ec5) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Add the Braze category content cards data layer on desktop, with single and bulk dismiss

- [#20703](https://github.com/LedgerHQ/ledger-live/pull/20703) [`c8d9b15`](https://github.com/LedgerHQ/ledger-live/commit/c8d9b15fe030d31725c72bd2e34a548005be00c0) Thanks [@amaslakov](https://github.com/amaslakov)! - Surface ICP neuron staking on the account page: a stake banner for accounts that can afford a neuron
  but hold none, a balance summary footer showing total staked and total maturity, and Stake / Manage
  Neurons actions in the account header. The send flow now explains that the memo is protocol-derived
  for `create_neuron` and `increase_stake` instead of offering an editable field. The two neuron flow
  modals are registered but their bodies land separately.

- [#20789](https://github.com/LedgerHQ/ledger-live/pull/20789) [`fe57525`](https://github.com/LedgerHQ/ledger-live/commit/fe57525f64607881552bf8c32edf2e5a78aca641) Thanks [@sarneijim](https://github.com/sarneijim)! - Fix Large Screen Upsell competing-modal handling on desktop: do not consume retriesModal when blocked/preempted, rename persisted retries to retriesModal (legacy reset on LWD only), and track modal_blocked.

- [#20803](https://github.com/LedgerHQ/ledger-live/pull/20803) [`13d6db5`](https://github.com/LedgerHQ/ledger-live/commit/13d6db554a98dbbeed492f90caca8c962ba217d1) Thanks [@sarneijim](https://github.com/sarneijim)! - Extend desktop always-on upsell banners to Nano SP and Nano X using the shared largeScreenUpsell audience and cooldown (LIVE-35397).

- [#20719](https://github.com/LedgerHQ/ledger-live/pull/20719) [`5b39a67`](https://github.com/LedgerHQ/ledger-live/commit/5b39a67dd93d4c541a77b0b146881073ca00ed15) Thanks [@sarneijim](https://github.com/sarneijim)! - Drive desktop LNS upsell banners from `largeScreenUpsell` and remove the legacy `lldNanoSUpsellBanners` flag (LIVE-35487).

- [#20794](https://github.com/LedgerHQ/ledger-live/pull/20794) [`29347c9`](https://github.com/LedgerHQ/ledger-live/commit/29347c96e0d59fb015846bcf8e4eebe4e6676764) Thanks [@LL782](https://github.com/LL782)! - Replace the useTrack hook with the module-level track function

  Internal refactor ahead of the analytics package migration. Every event keeps the properties it emits today: desktop reads the `drawer` name from the drawer context (or passes the custom-lock-screen constant directly) at each call site, and mobile's swap entry point rebuilds its router-derived `page` with `usePageNameFromRoute`.

- [#20731](https://github.com/LedgerHQ/ledger-live/pull/20731) [`69a5644`](https://github.com/LedgerHQ/ledger-live/commit/69a56440f3cd05dc93082de9afdf634c083b8532) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Wire Contacts feature analytics to the shared platform tracking contract.

- [#20795](https://github.com/LedgerHQ/ledger-live/pull/20795) [`b8370ec`](https://github.com/LedgerHQ/ledger-live/commit/b8370ec5c17b7b718aa059d65684c0b2479800ad) Thanks [@lewisd5](https://github.com/lewisd5)! - Add 1024 icon for the mac app store

- [#19581](https://github.com/LedgerHQ/ledger-live/pull/19581) [`6a437fd`](https://github.com/LedgerHQ/ledger-live/commit/6a437fd60cb8d5c197f104a522ce1406da197e51) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(lwdm): improve error context on datadog

- [#20740](https://github.com/LedgerHQ/ledger-live/pull/20740) [`542737c`](https://github.com/LedgerHQ/ledger-live/commit/542737c0015e3a8c5587c1496b5e08e6d7b4a6f2) Thanks [@ishaba](https://github.com/ishaba)! - fix(drawer): don't restore focus to a detached webview on close

- [#20806](https://github.com/LedgerHQ/ledger-live/pull/20806) [`eb4d29e`](https://github.com/LedgerHQ/ledger-live/commit/eb4d29ee1a9879963621168b1e208c53e532d28f) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Drop the redundant `PayCard` prefix from the public API of `@features/flow-pay-card-balance`. The package path already scopes the feature, matching sibling flows (`FeatureTour`, `CardLogin`). The hero is now exported as `Balance`, with `useBalanceData`, `aggregateBalance`, `buildBalanceData` and `Balance*` types.

- [#20642](https://github.com/LedgerHQ/ledger-live/pull/20642) [`a61f702`](https://github.com/LedgerHQ/ledger-live/commit/a61f702a6e41f2bf84d5602930e261a708507efa) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Persist the pay card hero balance filter across app restarts

- [#20755](https://github.com/LedgerHQ/ledger-live/pull/20755) [`e291645`](https://github.com/LedgerHQ/ledger-live/commit/e291645e8acb488323bf2ef8a26f045e6415c3fd) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the mobile stable balance filter (native select under the hero + queued bottom-sheet picker) and share the filter option and stablecoin logic between desktop and mobile

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

- [#20433](https://github.com/LedgerHQ/ledger-live/pull/20433) [`481bc40`](https://github.com/LedgerHQ/ledger-live/commit/481bc40f6e9573ff4c1387e9944cfdb1298e092b) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Hand a perps deposit requested by the live app over to the wallet, and let the asset and account pickers word themselves after the role the selection plays: the account funds land in, the account they are taken from, or the perps pick that predates both

- [#20723](https://github.com/LedgerHQ/ledger-live/pull/20723) [`ab35763`](https://github.com/LedgerHQ/ledger-live/commit/ab3576361469edc987afbd8a9fa8f37748b3a2b1) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Fix the receive flow reporting a verification error (visible on Polkadot) while the address confirmation succeeded on the device: re-renders no longer start a concurrent `confirmAddress` call, and a late result can no longer overwrite a successful verification.

- [#20742](https://github.com/LedgerHQ/ledger-live/pull/20742) [`2d1bded`](https://github.com/LedgerHQ/ledger-live/commit/2d1bded50bc911a87dcf9924e483fbf15eefc379) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Refactor PayTab integration tests: merge describe blocks and use scoped within queries

- [#20668](https://github.com/LedgerHQ/ledger-live/pull/20668) [`0076ce3`](https://github.com/LedgerHQ/ledger-live/commit/0076ce3a0da55f3b5b1f8c1f825ea11a0912bcb5) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwd): no contact screen in recipient screen

- [#20681](https://github.com/LedgerHQ/ledger-live/pull/20681) [`6543cfd`](https://github.com/LedgerHQ/ledger-live/commit/6543cfd37c0db9227621df6dff2b2acd6be482e8) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Add an "add contact" step to the send flow, opened from the recipient card, offering to create a new contact or to add the address to an existing one

- [#20645](https://github.com/LedgerHQ/ledger-live/pull/20645) [`dd3baf3`](https://github.com/LedgerHQ/ledger-live/commit/dd3baf39e2fab7d30d0064e9a10e3e58df2dd6e1) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add shared edit contact signer validation state with mocked signer mismatch handling and wire Desktop and Mobile contact edit flows.

- [#20788](https://github.com/LedgerHQ/ledger-live/pull/20788) [`7c20f72`](https://github.com/LedgerHQ/ledger-live/commit/7c20f72fb4e7cc0c3e728961d5e9823faef6dcb4) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the Pay action tiles to the LWD Card screen: mount the shared ActionTiles view-model under the balance hero (Add stablecoin / Request / New payment), add per-tile `appearance` support to the ActionTiles component, and extract the PayTab action-tiles and balance labels into dedicated hooks.

- [#20945](https://github.com/LedgerHQ/ledger-live/pull/20945) [`e63995d`](https://github.com/LedgerHQ/ledger-live/commit/e63995d1889c4f8f04a7eef731e326e23807def7) Thanks [@benruseau](https://github.com/benruseau)! - LWD 4.17.0 release notes

- [#20796](https://github.com/LedgerHQ/ledger-live/pull/20796) [`320b488`](https://github.com/LedgerHQ/ledger-live/commit/320b4880a45d8ad2ce3f349a0bbae00df563ca84) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(lwd): new send flow keeping the previous recipient after skip memo and edit

- [#20761](https://github.com/LedgerHQ/ledger-live/pull/20761) [`80fb6ae`](https://github.com/LedgerHQ/ledger-live/commit/80fb6ae7b7610635b065d0a9bf8526c935f7222f) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Stabilize the PayTab balance integration test by asserting a settled funded state

- [#20732](https://github.com/LedgerHQ/ledger-live/pull/20732) [`0952b2e`](https://github.com/LedgerHQ/ledger-live/commit/0952b2eac8ba3340bbe8da97b2dd1dca245d7965) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Simplify Welcome analytics opt-in V2 gating to lwdAnalyticsOptInScreenV2 only

- [#20658](https://github.com/LedgerHQ/ledger-live/pull/20658) [`a79b9aa`](https://github.com/LedgerHQ/ledger-live/commit/a79b9aacb2f21c89bd192342bc6b98a4265d4345) Thanks [@semeano](https://github.com/semeano)! - Zcash: add self transfer option on send modal

- [#20798](https://github.com/LedgerHQ/ledger-live/pull/20798) [`1de6156`](https://github.com/LedgerHQ/ledger-live/commit/1de61569d59e56b73a8797397cbdd1a10b069b08) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Name the Ironwood shielded operations and stop listing Zcash self-transfers.

  The Ironwood operation types were declared and given icons but never labelled, so a received or sent Ironwood transaction rendered its raw key in the history. They now carry the same labels, address cells and "Private (Ironwood)" transaction-type detail as the Sapling and Orchard ones.

  A shielded transaction that moved no value across the wallet boundary — every note landing on the account's own internal address — was also emitted as a history row of its own: no counterparty, a value of 0, and, when it was the shielded leg of a transparent-funded sweep, a duplicate of the transparent operation already listing that transaction. Such a transaction now produces an operation typed `NONE`, which keeps it in the account data while leaving it out of the lists. Its classification is unchanged, so the fee and balance logic that reads it is unaffected.

- [#20714](https://github.com/LedgerHQ/ledger-live/pull/20714) [`93406e8`](https://github.com/LedgerHQ/ledger-live/commit/93406e87ae4398e314f899a0b30e54653b73c18b) Thanks [@semeano](https://github.com/semeano)! - Show a warning in the send flow when the Zcash private balance is selected as source and funds were shielded in the last 15 minutes, explaining that recently shielded funds need confirmations and scanning before they are spendable

### Patch Changes

- Updated dependencies [[`061d873`](https://github.com/LedgerHQ/ledger-live/commit/061d873d0311a680d31771127c44e2ff219b65cd), [`ec8baad`](https://github.com/LedgerHQ/ledger-live/commit/ec8baadf5077e3891c488cf669615a52ad4873b1), [`a3164d8`](https://github.com/LedgerHQ/ledger-live/commit/a3164d88ed131879b072e0b05668a3e881c61850), [`9accbb8`](https://github.com/LedgerHQ/ledger-live/commit/9accbb86a0495f8b7b69f0b923ab9f7a133f661d), [`841f7a0`](https://github.com/LedgerHQ/ledger-live/commit/841f7a0991ee0a8036f2144858b5d27d654910bc), [`5ff320a`](https://github.com/LedgerHQ/ledger-live/commit/5ff320aaa967388af5d1e3f8d869b42739d0a2ed), [`54fcd49`](https://github.com/LedgerHQ/ledger-live/commit/54fcd49f48deaed0aec71941c8b9926e6b6aee2e), [`e4e8d08`](https://github.com/LedgerHQ/ledger-live/commit/e4e8d086fc5672e4ce96c30c9a9af3f2022f863a), [`14cf5b8`](https://github.com/LedgerHQ/ledger-live/commit/14cf5b8fad43788bdd7c682f53ab9d4fe03f9a8f), [`0dc2509`](https://github.com/LedgerHQ/ledger-live/commit/0dc2509c9646374755fce5aebc3d07bba17a8feb), [`8605089`](https://github.com/LedgerHQ/ledger-live/commit/8605089242fd91da0ee4c6a7e8ea2f5a9f58962a), [`c3b8717`](https://github.com/LedgerHQ/ledger-live/commit/c3b87177729f809722127debb8556419f56094c1), [`1a2df41`](https://github.com/LedgerHQ/ledger-live/commit/1a2df41eed302864ec2e0b58dc9eef75e8b90eec), [`2ab3cb8`](https://github.com/LedgerHQ/ledger-live/commit/2ab3cb881721e73ab3ad2f7ee6d6587e08e78530), [`55768ad`](https://github.com/LedgerHQ/ledger-live/commit/55768ad9f20ee24b2de8bbbe743b62b3b2e53355), [`696f871`](https://github.com/LedgerHQ/ledger-live/commit/696f871fc89aedd6a2a50fe3f0dd442bbd7ebf07), [`e07e0ba`](https://github.com/LedgerHQ/ledger-live/commit/e07e0baca2e4edfe90163367047459257034f7cc), [`45dc82e`](https://github.com/LedgerHQ/ledger-live/commit/45dc82e7aaf3dbc70a6fb89c673a342b28b3b12c), [`a7b0bae`](https://github.com/LedgerHQ/ledger-live/commit/a7b0baeaa4e7b2fb180e7ab28ce92a6287b46a68), [`7c8d5df`](https://github.com/LedgerHQ/ledger-live/commit/7c8d5dfa862a2e9c3a35251b5d06a3cd4f905d2a), [`f2f3ec9`](https://github.com/LedgerHQ/ledger-live/commit/f2f3ec9ef1f2869c44190e2f6aa16dc362f2891f), [`526ca7b`](https://github.com/LedgerHQ/ledger-live/commit/526ca7be272a78b5cbd48481b6c5120989c0731b), [`89171ea`](https://github.com/LedgerHQ/ledger-live/commit/89171ea0279c94d5a55324c3c7194fa42234828a), [`d0ac51c`](https://github.com/LedgerHQ/ledger-live/commit/d0ac51c757081a7ac6b5d76899097d3be2c1d07f), [`840de0d`](https://github.com/LedgerHQ/ledger-live/commit/840de0d43c75962ab91f0f1dc232dbcef10356a3), [`3c36af2`](https://github.com/LedgerHQ/ledger-live/commit/3c36af2185860d32bfaad670df7c49a3458e44c3), [`46eb674`](https://github.com/LedgerHQ/ledger-live/commit/46eb6748e96782f28499d74cfc930abfbc99a5e4), [`da0a5ce`](https://github.com/LedgerHQ/ledger-live/commit/da0a5ceb8f889f1bace45ed2d3d4c640cdf24ca8), [`84e3f9d`](https://github.com/LedgerHQ/ledger-live/commit/84e3f9d68bdf2e17281da9ba338745a51a90d822), [`19e578a`](https://github.com/LedgerHQ/ledger-live/commit/19e578a92209e96cabe400661757689e73b43005), [`eecf99a`](https://github.com/LedgerHQ/ledger-live/commit/eecf99af5c17ab63724843c31d5f3facc6352dad), [`6165c9d`](https://github.com/LedgerHQ/ledger-live/commit/6165c9d4c3082ed97087543b81e9b79c9d47dfa1), [`d43f03d`](https://github.com/LedgerHQ/ledger-live/commit/d43f03d2ab01e821677227cc2a76ee4ff5d0d7e7), [`21323c6`](https://github.com/LedgerHQ/ledger-live/commit/21323c66d04a25979a09b317014c6007d1c6b368), [`f5b2359`](https://github.com/LedgerHQ/ledger-live/commit/f5b2359ce6aa655b9e39d87c9925cb7469da248c), [`f040998`](https://github.com/LedgerHQ/ledger-live/commit/f04099812f60fc328ee101b5f4f0457b1d1c4bfa), [`77dc4d9`](https://github.com/LedgerHQ/ledger-live/commit/77dc4d93ac293095a023efd41713b35b1c5974bf), [`030fc67`](https://github.com/LedgerHQ/ledger-live/commit/030fc677db03e8a411d3d33d2fa88e1ab04df80b), [`a781abe`](https://github.com/LedgerHQ/ledger-live/commit/a781abec59454ec3bd1cbd4b74b67666aef73aab), [`fe57525`](https://github.com/LedgerHQ/ledger-live/commit/fe57525f64607881552bf8c32edf2e5a78aca641), [`13d6db5`](https://github.com/LedgerHQ/ledger-live/commit/13d6db554a98dbbeed492f90caca8c962ba217d1), [`5b39a67`](https://github.com/LedgerHQ/ledger-live/commit/5b39a67dd93d4c541a77b0b146881073ca00ed15), [`0807eca`](https://github.com/LedgerHQ/ledger-live/commit/0807ecacfd06057811a3d6f8845b9f4bfc6f693c), [`e72d6ff`](https://github.com/LedgerHQ/ledger-live/commit/e72d6ffbd8b1a1ac79d272e1823ecfdfd06ed0ee), [`6a437fd`](https://github.com/LedgerHQ/ledger-live/commit/6a437fd60cb8d5c197f104a522ce1406da197e51), [`352c6a3`](https://github.com/LedgerHQ/ledger-live/commit/352c6a36999c1ee7436bdce218b10f15af0dab5f), [`68448cd`](https://github.com/LedgerHQ/ledger-live/commit/68448cdf5c1fd5a2b6d912f4034d170dbabfc93f), [`d1a01e8`](https://github.com/LedgerHQ/ledger-live/commit/d1a01e81f58f2a31b009235b5c9893ff60e6f353), [`75d0c9b`](https://github.com/LedgerHQ/ledger-live/commit/75d0c9b97aced42be1f465319ee17ccaafcd649d), [`eb4d29e`](https://github.com/LedgerHQ/ledger-live/commit/eb4d29ee1a9879963621168b1e208c53e532d28f), [`42fca4a`](https://github.com/LedgerHQ/ledger-live/commit/42fca4a650043e297b2bcbdd098c6743126d7247), [`a61f702`](https://github.com/LedgerHQ/ledger-live/commit/a61f702a6e41f2bf84d5602930e261a708507efa), [`e291645`](https://github.com/LedgerHQ/ledger-live/commit/e291645e8acb488323bf2ef8a26f045e6415c3fd), [`4faf5cd`](https://github.com/LedgerHQ/ledger-live/commit/4faf5cdcd91e183777a275123bb7d5c3890adbce), [`2edf614`](https://github.com/LedgerHQ/ledger-live/commit/2edf614eed7608714821ee54574d8c4d2b6f7d98), [`9e45705`](https://github.com/LedgerHQ/ledger-live/commit/9e45705b649513c3f9797c2add485a0ba3ea7a6c), [`e54d98b`](https://github.com/LedgerHQ/ledger-live/commit/e54d98b123ad8814be57c2f0e0f26689902ab4fd), [`004c294`](https://github.com/LedgerHQ/ledger-live/commit/004c29415d581626e16548fb96f18f7006128c2e), [`481bc40`](https://github.com/LedgerHQ/ledger-live/commit/481bc40f6e9573ff4c1387e9944cfdb1298e092b), [`b6da6b1`](https://github.com/LedgerHQ/ledger-live/commit/b6da6b1b1c98d022f30985c6103c239bffd0c7df), [`ca74f9d`](https://github.com/LedgerHQ/ledger-live/commit/ca74f9d50026c4a14657692de9c74c8f1c32f130), [`3dd9308`](https://github.com/LedgerHQ/ledger-live/commit/3dd9308f1a670a56588acbe70f2cbb4eb39d3432), [`fae92bf`](https://github.com/LedgerHQ/ledger-live/commit/fae92bf68e8ac167644aefa9e9d981a7b12cb23a), [`0076ce3`](https://github.com/LedgerHQ/ledger-live/commit/0076ce3a0da55f3b5b1f8c1f825ea11a0912bcb5), [`8153370`](https://github.com/LedgerHQ/ledger-live/commit/8153370ced31369208fe14ce8b24c6eb0d899ff4), [`6543cfd`](https://github.com/LedgerHQ/ledger-live/commit/6543cfd37c0db9227621df6dff2b2acd6be482e8), [`dd3baf3`](https://github.com/LedgerHQ/ledger-live/commit/dd3baf39e2fab7d30d0064e9a10e3e58df2dd6e1), [`7c20f72`](https://github.com/LedgerHQ/ledger-live/commit/7c20f72fb4e7cc0c3e728961d5e9823faef6dcb4), [`0fc43c1`](https://github.com/LedgerHQ/ledger-live/commit/0fc43c15841f585c0a9aaa5152587225978f7e2b), [`c8adec3`](https://github.com/LedgerHQ/ledger-live/commit/c8adec33638877b418723ca8473d469afb5be6d2), [`b2896a9`](https://github.com/LedgerHQ/ledger-live/commit/b2896a9b10cf6daaa8f532eaa12f016df606eb8b), [`320b488`](https://github.com/LedgerHQ/ledger-live/commit/320b4880a45d8ad2ce3f349a0bbae00df563ca84), [`e0d646e`](https://github.com/LedgerHQ/ledger-live/commit/e0d646e62345e411e5c3323a8b8af7361db48802), [`e3e7804`](https://github.com/LedgerHQ/ledger-live/commit/e3e7804bff59e1d6e28ec5c94fcbb421ddbbaf71), [`79882e2`](https://github.com/LedgerHQ/ledger-live/commit/79882e26a14f246f1cc969937e011b16e701b8f2), [`96ac61e`](https://github.com/LedgerHQ/ledger-live/commit/96ac61e367eae1da998547f00ae144e7c3947f2b), [`5a96e09`](https://github.com/LedgerHQ/ledger-live/commit/5a96e096169e44731117becf9c204666c4509364), [`a20805c`](https://github.com/LedgerHQ/ledger-live/commit/a20805cebd95f2f620d394c4d7598ec93506c83e), [`030b427`](https://github.com/LedgerHQ/ledger-live/commit/030b42707768af3f9c98a15fc6751f1d64b36fe6), [`a79b9aa`](https://github.com/LedgerHQ/ledger-live/commit/a79b9aacb2f21c89bd192342bc6b98a4265d4345), [`1de6156`](https://github.com/LedgerHQ/ledger-live/commit/1de61569d59e56b73a8797397cbdd1a10b069b08), [`4cc31ec`](https://github.com/LedgerHQ/ledger-live/commit/4cc31ec90cae0a36663b35da3a569222e8e8efdf), [`02ddf7e`](https://github.com/LedgerHQ/ledger-live/commit/02ddf7e9d7542d6f0fcdb18d7f9461c37a8b8ce1), [`93406e8`](https://github.com/LedgerHQ/ledger-live/commit/93406e87ae4398e314f899a0b30e54653b73c18b)]:
  - @ledgerhq/live-common@37.3.0
  - @features/flow-pay-card-balance@0.2.0
  - @features/flow-pay-card-deposit@0.2.0
  - @ledgerhq/coin-zcash@0.4.0
  - @shared/feature-flags@0.19.0
  - @domain/api-aggregated-assets@0.4.0
  - @features/platform-contacts@0.3.0
  - @domain/entity-contact@0.7.0
  - @features/flow-contacts@0.7.0
  - @ledgerhq/live-dmk-shared@0.31.0
  - @features/flow-large-screen-upsell@1.0.0
  - @ledgerhq/ledger-auth@0.4.0
  - @ledgerhq/ledger-key-ring-protocol@0.20.0
  - @shared/auth@0.5.0
  - @shared/api-services@0.4.0
  - @features/platform-card@0.2.0
  - @shared/env@0.3.0
  - @features/flow-contacts-add-contact@0.3.0
  - @ledgerhq/types-devices@7.0.0
  - @ledgerhq/coin-concordium@1.0.0
  - @ledgerhq/coin-filecoin@2.0.0
  - @ledgerhq/coin-cardano@1.0.0
  - @ledgerhq/coin-canton@1.0.0
  - @ledgerhq/coin-casper@3.0.0
  - @ledgerhq/coin-cosmos@1.0.0
  - @ledgerhq/coin-evm@5.0.0
  - @features/flow-contacts-introduction@0.2.0
  - @ledgerhq/types-live@6.120.0
  - @features/flow-pay-card-feature-tour@0.3.0
  - @features/flow-pay-card-auth@0.3.0
  - @devtools/bindings@0.4.0
  - @ledgerhq/ledger-wallet-framework@3.0.0
  - @features/platform-aggregated-assets@0.4.0
  - @devtools/transport-panel@0.5.0
  - @devtools/wire@0.4.0
  - @domain/entity-currency-token@0.5.0
  - @domain/api-currency-token@0.5.0
  - @ledgerhq/asset-detail@0.11.1
  - @ledgerhq/live-dmk-desktop@0.20.7
  - @ledgerhq/coin-bitcoin@0.51.1
  - @features/platform-currencies@0.6.1
  - @features/platform-feature-flags@0.6.6
  - @ledgerhq/asset-aggregation@0.13.1
  - @domain/api-altcoins-sentiment@0.3.2
  - @domain/api-currency-fiat@0.4.1
  - @domain/api-market-sentiment@0.3.2
  - @domain/api-push-devices@0.2.2
  - @features/platform-env@0.2.1
  - @ledgerhq/live-dmk-speculos@0.10.5
  - @ledgerhq/wallet-analytics@0.3.4
  - @ledgerhq/wallet-pnl@0.7.7
  - @ledgerhq/device-intent@6.0.0
  - @ledgerhq/domain-service@1.8.15
  - @ledgerhq/live-countervalues@0.24.3
  - @ledgerhq/live-countervalues-react@0.16.7
  - @ledgerhq/live-wallet@1.0.1
  - @devtools/shell@0.8.1
  - @domain/entity-currency@0.4.1
  - @features/flow-analytics-consent@0.2.2
  - @ledgerhq/wallet-btc@0.3.0

## 4.17.0-next.4

### Minor Changes

- [#20945](https://github.com/LedgerHQ/ledger-live/pull/20945) [`e63995d`](https://github.com/LedgerHQ/ledger-live/commit/e63995d1889c4f8f04a7eef731e326e23807def7) Thanks [@benruseau](https://github.com/benruseau)! - LWD 4.17.0 release notes

## 4.17.0-next.3

### Minor Changes

- [#20929](https://github.com/LedgerHQ/ledger-live/pull/20929) [`dcb3340`](https://github.com/LedgerHQ/ledger-live/commit/dcb33402b48a86d2e014a3223177812a9510a885) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Skip installed-app listing before the ESC firmware update drawer on unseeded devices (LIVE-36215)

## 4.17.0-next.2

### Minor Changes

- [#20906](https://github.com/LedgerHQ/ledger-live/pull/20906) [`dbb2ee0`](https://github.com/LedgerHQ/ledger-live/commit/dbb2ee0539d4ff713231530efbc2d5814f039dae) Thanks [@LL782](https://github.com/LL782)! - Fix Ledger Sync being wiped on every launch when Password Lock is enabled. `app.trustchain` is an encrypted db path, so before unlock it reads back as a ciphertext string; importing it regenerated member credentials, nulled the trustchain, and persisted that fresh state over the encrypted blob in plaintext. The import is now skipped while the value is still a string, and trustchain writes are suppressed while the app is locked.

## 4.17.0-next.1

### Minor Changes

- [#20907](https://github.com/LedgerHQ/ledger-live/pull/20907) [`da0a5ce`](https://github.com/LedgerHQ/ledger-live/commit/da0a5ceb8f889f1bace45ed2d3d4c640cdf24ca8) Thanks [@fAnselmi-Ledger](https://github.com/fAnselmi-Ledger)! - Add Solana TXC flag

### Patch Changes

- Updated dependencies [[`da0a5ce`](https://github.com/LedgerHQ/ledger-live/commit/da0a5ceb8f889f1bace45ed2d3d4c640cdf24ca8)]:
  - @ledgerhq/live-common@37.3.0-next.1
  - @shared/feature-flags@0.19.0-next.1
  - @ledgerhq/types-live@6.120.0-next.1
  - @ledgerhq/asset-detail@0.11.1-next.1
  - @ledgerhq/live-dmk-desktop@0.20.7-next.1
  - @devtools/bindings@0.4.0-next.1
  - @features/flow-contacts@0.7.0-next.1
  - @features/flow-large-screen-upsell@1.0.0-next.1
  - @features/platform-currencies@0.6.1-next.1
  - @features/platform-feature-flags@0.6.6-next.1
  - @ledgerhq/asset-aggregation@0.13.1-next.1
  - @ledgerhq/coin-bitcoin@0.51.1-next.1
  - @ledgerhq/coin-canton@1.0.0-next.1
  - @ledgerhq/coin-cardano@1.0.0-next.1
  - @ledgerhq/coin-casper@3.0.0-next.1
  - @ledgerhq/coin-concordium@1.0.0-next.1
  - @ledgerhq/coin-cosmos@1.0.0-next.1
  - @ledgerhq/coin-evm@5.0.0-next.1
  - @ledgerhq/coin-filecoin@2.0.0-next.1
  - @ledgerhq/coin-zcash@0.4.0-next.1
  - @ledgerhq/domain-service@1.8.15-next.1
  - @ledgerhq/ledger-wallet-framework@3.0.0-next.1
  - @ledgerhq/live-countervalues@0.24.3-next.1
  - @ledgerhq/live-countervalues-react@0.16.7-next.1
  - @ledgerhq/live-wallet@1.0.1-next.1
  - @ledgerhq/wallet-analytics@0.3.4-next.1
  - @ledgerhq/wallet-pnl@0.7.7-next.1
  - @features/flow-analytics-consent@0.2.2-next.1
  - @devtools/shell@0.8.1-next.1
  - @ledgerhq/wallet-btc@0.3.0

## 4.17.0-next.0

### Minor Changes

- [#20611](https://github.com/LedgerHQ/ledger-live/pull/20611) [`5a87153`](https://github.com/LedgerHQ/ledger-live/commit/5a8715341159ffe80f0e380cff2affb9299406cb) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Mount the first-time Pay tab FeatureTour on the PayTab screen in both apps. Visibility is self-gated by the payCard slice (shown on first visit, hidden after dismissal), copy is injected from app-owned i18n keys (payTab.featureTour.\*), and analytics are wired through the view-model. Adds unit and integration coverage for the conditional rendering.

- [#20655](https://github.com/LedgerHQ/ledger-live/pull/20655) [`ec8baad`](https://github.com/LedgerHQ/ledger-live/commit/ec8baadf5077e3891c488cf669615a52ad4873b1) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the desktop Pay hero for the aggregated stablecoin balance. Introduces the `@features/flow-pay-card-balance` package with props-only empty and funded states, wired into the desktop Pay tab and tracking `Page Pay` with the active `balance_filter` (LIVE-34896).

- [#20713](https://github.com/LedgerHQ/ledger-live/pull/20713) [`a3164d8`](https://github.com/LedgerHQ/ledger-live/commit/a3164d88ed131879b072e0b05668a3e881c61850) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the mobile Pay hero for the aggregated stablecoin balance. The `@features/flow-pay-card-balance` package gains props-only native empty and funded states, and both apps now share the portfolio aggregation through `aggregatePayCardBalance` (LIVE-34898). The hero is mounted at the top of the mobile Pay tab, which tracks `Page Pay` with the active `balance_filter` on view.

- [#20844](https://github.com/LedgerHQ/ledger-live/pull/20844) [`5ff320a`](https://github.com/LedgerHQ/ledger-live/commit/5ff320aaa967388af5d1e3f8d869b42739d0a2ed) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Wire the desktop Pay tab "Add stablecoin" tile to the shared Deposit options dialog: pressing it opens the dialog and each option routes to its desktop flow (bank transfer, swap, buy) or the receive asset flow filtered to stablecoins.

  Render the deposit options as Lumen `ListItem` rows.

- [#20644](https://github.com/LedgerHQ/ledger-live/pull/20644) [`936abf0`](https://github.com/LedgerHQ/ledger-live/commit/936abf0cf6c579171aca42ac54e282f7a4c719a4) Thanks [@LucasWerey](https://github.com/LucasWerey)! - chore(deps): bump Lumen design system to latest and migrate CSS to tailwind v4 style

- [#20815](https://github.com/LedgerHQ/ledger-live/pull/20815) [`54fcd49`](https://github.com/LedgerHQ/ledger-live/commit/54fcd49f48deaed0aec71941c8b9926e6b6aee2e) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Exclude immature Ironwood notes from the spendable pool. A shielded note is only spendable once its transaction is buried deep enough to have a witness at the builder's anchor, so a freshly scanned change note is no longer selected while a second send is prepared within the same confirmation window. The rule is applied wherever the spendable pool is derived — note selection, max-spendable and amount validation — and the send flow now reports insufficient spendable funds instead of failing when the transaction is built. Funds held by maturing notes stay part of the account's total balance.

- [#20735](https://github.com/LedgerHQ/ledger-live/pull/20735) [`c3b8717`](https://github.com/LedgerHQ/ledger-live/commit/c3b87177729f809722127debb8556419f56094c1) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add a stablecoin balance filter picker to the Pay card hero.

- [#20833](https://github.com/LedgerHQ/ledger-live/pull/20833) [`2ab3cb8`](https://github.com/LedgerHQ/ledger-live/commit/2ab3cb881721e73ab3ad2f7ee6d6587e08e78530) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Require `utmContent` on `buildLargeScreenUpsellCtaLink` (breaking) and personalise the Backup Hub Recovery Key row for Nano S / SP / X with a warning and large-screen upsell CTA (LIVE-35484).

- [#20683](https://github.com/LedgerHQ/ledger-live/pull/20683) [`74de0e5`](https://github.com/LedgerHQ/ledger-live/commit/74de0e516d60d3aeb77951e3bed3b016ed9bc8b6) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Show only one portfolio Braze banner when the placement area is too narrow for two readable columns, using CSS container queries instead of JS width measurement.

- [#20702](https://github.com/LedgerHQ/ledger-live/pull/20702) [`e07e0ba`](https://github.com/LedgerHQ/ledger-live/commit/e07e0baca2e4edfe90163367047459257034f7cc) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Scaffold the Card API on a single endpoint-less `cardApi` service (DDD, CMC/DADA pattern): add the `services/card` transport in `@shared/api-services` with Bearer + `x-client-key` (`CARD_BAANX_CLIENT_KEY`) + one 401-refresh, the `@domain/api-card-management` endpoint injector, the `@features/platform-card` in-memory session and `getCardSessionToken`/`refreshCardSession` accessors, the `CARD_API_URL` / `CARD_BAANX_CLIENT_KEY` envs, and register `cardApi` in both apps. The legacy `payCardApi` Card Auth holdout is left untouched pending its migration onto `cardApi` (LIVE-33829).

- [#20684](https://github.com/LedgerHQ/ledger-live/pull/20684) [`ead65e0`](https://github.com/LedgerHQ/ledger-live/commit/ead65e03f9de9081e6b348b1ec89339fbf2a97fc) Thanks [@sarneijim](https://github.com/sarneijim)! - Update LNS upsell banner opt-in/opt-out copy and per-placement images to match mobile.

- [#20571](https://github.com/LedgerHQ/ledger-live/pull/20571) [`7c8d5df`](https://github.com/LedgerHQ/ledger-live/commit/7c8d5dfa862a2e9c3a35251b5d06a3cd4f905d2a) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Thread the coin-module `Context` (ADR-019) explicitly through the coin-evm, coin-vechain and coin-near api and logic layers instead of resolving configuration from the module-level `getCoinConfig` singleton. Exported logic functions now take the context as their first argument, resolve `config` from it (`await context.config(currencyId)`), and pass an explicit, required `config` down to the network layer — no `config?` optionals and no singleton reads on the data path. `getCoinConfig`/`setCoinConfig` remain only as the compatibility surface for the classic account bridge. Ledger Live consumers (live-common, desktop, mobile and coin-celo) are updated to resolve and pass config/context explicitly. Also fixes a coin-polkadot type-inference issue where `getTransactionMaterialWithMetadata`'s cache-key extractor narrowed the cached signature and dropped the `config` argument.

- [#20759](https://github.com/LedgerHQ/ledger-live/pull/20759) [`526ca7b`](https://github.com/LedgerHQ/ledger-live/commit/526ca7be272a78b5cbd48481b6c5120989c0731b) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Extract shared Contacts tracking hooks and move currency analytics resolution to platform-contacts.

- [#20420](https://github.com/LedgerHQ/ledger-live/pull/20420) [`494963b`](https://github.com/LedgerHQ/ledger-live/commit/494963b221aab3c71ad7d0d6564f94b870c51abb) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Fix apps not being restored after a firmware update during Early Security Checks (ESC) in sync onboarding

- [#20856](https://github.com/LedgerHQ/ledger-live/pull/20856) [`d0ac51c`](https://github.com/LedgerHQ/ledger-live/commit/d0ac51c757081a7ac6b5d76899097d3be2c1d07f) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Wire the Pay tab "Add stablecoin" tile to the shared Deposit options overlay on both platforms: pressing it opens the dialog (desktop) or bottom sheet (mobile), and each option routes to its platform flow (bank transfer, swap, buy) or the receive flow filtered to stablecoins.

  Extract a shared `useDepositOptionsAdapter` hook in `@features/flow-pay-card-deposit` so desktop and mobile no longer duplicate the deposit options open/close state and props shape.

- [#20784](https://github.com/LedgerHQ/ledger-live/pull/20784) [`19e578a`](https://github.com/LedgerHQ/ledger-live/commit/19e578a92209e96cabe400661757689e73b43005) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Move the Pay Card UI Redux state out of the removed `@domain/entity-pay-card` package into the owning feature flows: the balance filter goes to `@features/flow-pay-card-balance` and the feature-tour seen flag to `@features/flow-pay-card-feature-tour`. The apps keep persisting it under the existing `payCard` key (no data migration). Both flows expose a UI-free `./state` entry so store, persistence and test setup can use the slice without pulling in the flow UI.

- [#20778](https://github.com/LedgerHQ/ledger-live/pull/20778) [`eecf99a`](https://github.com/LedgerHQ/ledger-live/commit/eecf99af5c17ab63724843c31d5f3facc6352dad) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-evm): replace `CryptoCurrency` with `currencyId`

- [#20670](https://github.com/LedgerHQ/ledger-live/pull/20670) [`6165c9d`](https://github.com/LedgerHQ/ledger-live/commit/6165c9d4c3082ed97087543b81e9b79c9d47dfa1) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwd): show recipient action only when no bridge error

- [#20662](https://github.com/LedgerHQ/ledger-live/pull/20662) [`a736d28`](https://github.com/LedgerHQ/ledger-live/commit/a736d281098100088c757a6e422214705d972ec5) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Add the Braze category content cards data layer on desktop, with single and bulk dismiss

- [#20703](https://github.com/LedgerHQ/ledger-live/pull/20703) [`c8d9b15`](https://github.com/LedgerHQ/ledger-live/commit/c8d9b15fe030d31725c72bd2e34a548005be00c0) Thanks [@amaslakov](https://github.com/amaslakov)! - Surface ICP neuron staking on the account page: a stake banner for accounts that can afford a neuron
  but hold none, a balance summary footer showing total staked and total maturity, and Stake / Manage
  Neurons actions in the account header. The send flow now explains that the memo is protocol-derived
  for `create_neuron` and `increase_stake` instead of offering an editable field. The two neuron flow
  modals are registered but their bodies land separately.

- [#20789](https://github.com/LedgerHQ/ledger-live/pull/20789) [`fe57525`](https://github.com/LedgerHQ/ledger-live/commit/fe57525f64607881552bf8c32edf2e5a78aca641) Thanks [@sarneijim](https://github.com/sarneijim)! - Fix Large Screen Upsell competing-modal handling on desktop: do not consume retriesModal when blocked/preempted, rename persisted retries to retriesModal (legacy reset on LWD only), and track modal_blocked.

- [#20803](https://github.com/LedgerHQ/ledger-live/pull/20803) [`13d6db5`](https://github.com/LedgerHQ/ledger-live/commit/13d6db554a98dbbeed492f90caca8c962ba217d1) Thanks [@sarneijim](https://github.com/sarneijim)! - Extend desktop always-on upsell banners to Nano SP and Nano X using the shared largeScreenUpsell audience and cooldown (LIVE-35397).

- [#20719](https://github.com/LedgerHQ/ledger-live/pull/20719) [`5b39a67`](https://github.com/LedgerHQ/ledger-live/commit/5b39a67dd93d4c541a77b0b146881073ca00ed15) Thanks [@sarneijim](https://github.com/sarneijim)! - Drive desktop LNS upsell banners from `largeScreenUpsell` and remove the legacy `lldNanoSUpsellBanners` flag (LIVE-35487).

- [#20794](https://github.com/LedgerHQ/ledger-live/pull/20794) [`29347c9`](https://github.com/LedgerHQ/ledger-live/commit/29347c96e0d59fb015846bcf8e4eebe4e6676764) Thanks [@LL782](https://github.com/LL782)! - Replace the useTrack hook with the module-level track function

  Internal refactor ahead of the analytics package migration. Every event keeps the properties it emits today: desktop reads the `drawer` name from the drawer context (or passes the custom-lock-screen constant directly) at each call site, and mobile's swap entry point rebuilds its router-derived `page` with `usePageNameFromRoute`.

- [#20731](https://github.com/LedgerHQ/ledger-live/pull/20731) [`69a5644`](https://github.com/LedgerHQ/ledger-live/commit/69a56440f3cd05dc93082de9afdf634c083b8532) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Wire Contacts feature analytics to the shared platform tracking contract.

- [#20795](https://github.com/LedgerHQ/ledger-live/pull/20795) [`b8370ec`](https://github.com/LedgerHQ/ledger-live/commit/b8370ec5c17b7b718aa059d65684c0b2479800ad) Thanks [@lewisd5](https://github.com/lewisd5)! - Add 1024 icon for the mac app store

- [#19581](https://github.com/LedgerHQ/ledger-live/pull/19581) [`6a437fd`](https://github.com/LedgerHQ/ledger-live/commit/6a437fd60cb8d5c197f104a522ce1406da197e51) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(lwdm): improve error context on datadog

- [#20740](https://github.com/LedgerHQ/ledger-live/pull/20740) [`542737c`](https://github.com/LedgerHQ/ledger-live/commit/542737c0015e3a8c5587c1496b5e08e6d7b4a6f2) Thanks [@ishaba](https://github.com/ishaba)! - fix(drawer): don't restore focus to a detached webview on close

- [#20806](https://github.com/LedgerHQ/ledger-live/pull/20806) [`eb4d29e`](https://github.com/LedgerHQ/ledger-live/commit/eb4d29ee1a9879963621168b1e208c53e532d28f) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Drop the redundant `PayCard` prefix from the public API of `@features/flow-pay-card-balance`. The package path already scopes the feature, matching sibling flows (`FeatureTour`, `CardLogin`). The hero is now exported as `Balance`, with `useBalanceData`, `aggregateBalance`, `buildBalanceData` and `Balance*` types.

- [#20642](https://github.com/LedgerHQ/ledger-live/pull/20642) [`a61f702`](https://github.com/LedgerHQ/ledger-live/commit/a61f702a6e41f2bf84d5602930e261a708507efa) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Persist the pay card hero balance filter across app restarts

- [#20755](https://github.com/LedgerHQ/ledger-live/pull/20755) [`e291645`](https://github.com/LedgerHQ/ledger-live/commit/e291645e8acb488323bf2ef8a26f045e6415c3fd) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the mobile stable balance filter (native select under the hero + queued bottom-sheet picker) and share the filter option and stablecoin logic between desktop and mobile

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

- [#20433](https://github.com/LedgerHQ/ledger-live/pull/20433) [`481bc40`](https://github.com/LedgerHQ/ledger-live/commit/481bc40f6e9573ff4c1387e9944cfdb1298e092b) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Hand a perps deposit requested by the live app over to the wallet, and let the asset and account pickers word themselves after the role the selection plays: the account funds land in, the account they are taken from, or the perps pick that predates both

- [#20723](https://github.com/LedgerHQ/ledger-live/pull/20723) [`ab35763`](https://github.com/LedgerHQ/ledger-live/commit/ab3576361469edc987afbd8a9fa8f37748b3a2b1) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Fix the receive flow reporting a verification error (visible on Polkadot) while the address confirmation succeeded on the device: re-renders no longer start a concurrent `confirmAddress` call, and a late result can no longer overwrite a successful verification.

- [#20742](https://github.com/LedgerHQ/ledger-live/pull/20742) [`2d1bded`](https://github.com/LedgerHQ/ledger-live/commit/2d1bded50bc911a87dcf9924e483fbf15eefc379) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Refactor PayTab integration tests: merge describe blocks and use scoped within queries

- [#20668](https://github.com/LedgerHQ/ledger-live/pull/20668) [`0076ce3`](https://github.com/LedgerHQ/ledger-live/commit/0076ce3a0da55f3b5b1f8c1f825ea11a0912bcb5) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwd): no contact screen in recipient screen

- [#20681](https://github.com/LedgerHQ/ledger-live/pull/20681) [`6543cfd`](https://github.com/LedgerHQ/ledger-live/commit/6543cfd37c0db9227621df6dff2b2acd6be482e8) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Add an "add contact" step to the send flow, opened from the recipient card, offering to create a new contact or to add the address to an existing one

- [#20645](https://github.com/LedgerHQ/ledger-live/pull/20645) [`dd3baf3`](https://github.com/LedgerHQ/ledger-live/commit/dd3baf39e2fab7d30d0064e9a10e3e58df2dd6e1) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add shared edit contact signer validation state with mocked signer mismatch handling and wire Desktop and Mobile contact edit flows.

- [#20788](https://github.com/LedgerHQ/ledger-live/pull/20788) [`7c20f72`](https://github.com/LedgerHQ/ledger-live/commit/7c20f72fb4e7cc0c3e728961d5e9823faef6dcb4) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the Pay action tiles to the LWD Card screen: mount the shared ActionTiles view-model under the balance hero (Add stablecoin / Request / New payment), add per-tile `appearance` support to the ActionTiles component, and extract the PayTab action-tiles and balance labels into dedicated hooks.

- [#20796](https://github.com/LedgerHQ/ledger-live/pull/20796) [`320b488`](https://github.com/LedgerHQ/ledger-live/commit/320b4880a45d8ad2ce3f349a0bbae00df563ca84) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(lwd): new send flow keeping the previous recipient after skip memo and edit

- [#20761](https://github.com/LedgerHQ/ledger-live/pull/20761) [`80fb6ae`](https://github.com/LedgerHQ/ledger-live/commit/80fb6ae7b7610635b065d0a9bf8526c935f7222f) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Stabilize the PayTab balance integration test by asserting a settled funded state

- [#20732](https://github.com/LedgerHQ/ledger-live/pull/20732) [`0952b2e`](https://github.com/LedgerHQ/ledger-live/commit/0952b2eac8ba3340bbe8da97b2dd1dca245d7965) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Simplify Welcome analytics opt-in V2 gating to lwdAnalyticsOptInScreenV2 only

- [#20658](https://github.com/LedgerHQ/ledger-live/pull/20658) [`a79b9aa`](https://github.com/LedgerHQ/ledger-live/commit/a79b9aacb2f21c89bd192342bc6b98a4265d4345) Thanks [@semeano](https://github.com/semeano)! - Zcash: add self transfer option on send modal

- [#20798](https://github.com/LedgerHQ/ledger-live/pull/20798) [`1de6156`](https://github.com/LedgerHQ/ledger-live/commit/1de61569d59e56b73a8797397cbdd1a10b069b08) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Name the Ironwood shielded operations and stop listing Zcash self-transfers.

  The Ironwood operation types were declared and given icons but never labelled, so a received or sent Ironwood transaction rendered its raw key in the history. They now carry the same labels, address cells and "Private (Ironwood)" transaction-type detail as the Sapling and Orchard ones.

  A shielded transaction that moved no value across the wallet boundary — every note landing on the account's own internal address — was also emitted as a history row of its own: no counterparty, a value of 0, and, when it was the shielded leg of a transparent-funded sweep, a duplicate of the transparent operation already listing that transaction. Such a transaction now produces an operation typed `NONE`, which keeps it in the account data while leaving it out of the lists. Its classification is unchanged, so the fee and balance logic that reads it is unaffected.

- [#20714](https://github.com/LedgerHQ/ledger-live/pull/20714) [`93406e8`](https://github.com/LedgerHQ/ledger-live/commit/93406e87ae4398e314f899a0b30e54653b73c18b) Thanks [@semeano](https://github.com/semeano)! - Show a warning in the send flow when the Zcash private balance is selected as source and funds were shielded in the last 15 minutes, explaining that recently shielded funds need confirmations and scanning before they are spendable

### Patch Changes

- Updated dependencies [[`061d873`](https://github.com/LedgerHQ/ledger-live/commit/061d873d0311a680d31771127c44e2ff219b65cd), [`ec8baad`](https://github.com/LedgerHQ/ledger-live/commit/ec8baadf5077e3891c488cf669615a52ad4873b1), [`a3164d8`](https://github.com/LedgerHQ/ledger-live/commit/a3164d88ed131879b072e0b05668a3e881c61850), [`9accbb8`](https://github.com/LedgerHQ/ledger-live/commit/9accbb86a0495f8b7b69f0b923ab9f7a133f661d), [`841f7a0`](https://github.com/LedgerHQ/ledger-live/commit/841f7a0991ee0a8036f2144858b5d27d654910bc), [`5ff320a`](https://github.com/LedgerHQ/ledger-live/commit/5ff320aaa967388af5d1e3f8d869b42739d0a2ed), [`54fcd49`](https://github.com/LedgerHQ/ledger-live/commit/54fcd49f48deaed0aec71941c8b9926e6b6aee2e), [`e4e8d08`](https://github.com/LedgerHQ/ledger-live/commit/e4e8d086fc5672e4ce96c30c9a9af3f2022f863a), [`14cf5b8`](https://github.com/LedgerHQ/ledger-live/commit/14cf5b8fad43788bdd7c682f53ab9d4fe03f9a8f), [`0dc2509`](https://github.com/LedgerHQ/ledger-live/commit/0dc2509c9646374755fce5aebc3d07bba17a8feb), [`8605089`](https://github.com/LedgerHQ/ledger-live/commit/8605089242fd91da0ee4c6a7e8ea2f5a9f58962a), [`c3b8717`](https://github.com/LedgerHQ/ledger-live/commit/c3b87177729f809722127debb8556419f56094c1), [`1a2df41`](https://github.com/LedgerHQ/ledger-live/commit/1a2df41eed302864ec2e0b58dc9eef75e8b90eec), [`2ab3cb8`](https://github.com/LedgerHQ/ledger-live/commit/2ab3cb881721e73ab3ad2f7ee6d6587e08e78530), [`55768ad`](https://github.com/LedgerHQ/ledger-live/commit/55768ad9f20ee24b2de8bbbe743b62b3b2e53355), [`696f871`](https://github.com/LedgerHQ/ledger-live/commit/696f871fc89aedd6a2a50fe3f0dd442bbd7ebf07), [`e07e0ba`](https://github.com/LedgerHQ/ledger-live/commit/e07e0baca2e4edfe90163367047459257034f7cc), [`45dc82e`](https://github.com/LedgerHQ/ledger-live/commit/45dc82e7aaf3dbc70a6fb89c673a342b28b3b12c), [`a7b0bae`](https://github.com/LedgerHQ/ledger-live/commit/a7b0baeaa4e7b2fb180e7ab28ce92a6287b46a68), [`7c8d5df`](https://github.com/LedgerHQ/ledger-live/commit/7c8d5dfa862a2e9c3a35251b5d06a3cd4f905d2a), [`f2f3ec9`](https://github.com/LedgerHQ/ledger-live/commit/f2f3ec9ef1f2869c44190e2f6aa16dc362f2891f), [`526ca7b`](https://github.com/LedgerHQ/ledger-live/commit/526ca7be272a78b5cbd48481b6c5120989c0731b), [`89171ea`](https://github.com/LedgerHQ/ledger-live/commit/89171ea0279c94d5a55324c3c7194fa42234828a), [`d0ac51c`](https://github.com/LedgerHQ/ledger-live/commit/d0ac51c757081a7ac6b5d76899097d3be2c1d07f), [`840de0d`](https://github.com/LedgerHQ/ledger-live/commit/840de0d43c75962ab91f0f1dc232dbcef10356a3), [`3c36af2`](https://github.com/LedgerHQ/ledger-live/commit/3c36af2185860d32bfaad670df7c49a3458e44c3), [`46eb674`](https://github.com/LedgerHQ/ledger-live/commit/46eb6748e96782f28499d74cfc930abfbc99a5e4), [`84e3f9d`](https://github.com/LedgerHQ/ledger-live/commit/84e3f9d68bdf2e17281da9ba338745a51a90d822), [`19e578a`](https://github.com/LedgerHQ/ledger-live/commit/19e578a92209e96cabe400661757689e73b43005), [`eecf99a`](https://github.com/LedgerHQ/ledger-live/commit/eecf99af5c17ab63724843c31d5f3facc6352dad), [`6165c9d`](https://github.com/LedgerHQ/ledger-live/commit/6165c9d4c3082ed97087543b81e9b79c9d47dfa1), [`d43f03d`](https://github.com/LedgerHQ/ledger-live/commit/d43f03d2ab01e821677227cc2a76ee4ff5d0d7e7), [`21323c6`](https://github.com/LedgerHQ/ledger-live/commit/21323c66d04a25979a09b317014c6007d1c6b368), [`f5b2359`](https://github.com/LedgerHQ/ledger-live/commit/f5b2359ce6aa655b9e39d87c9925cb7469da248c), [`f040998`](https://github.com/LedgerHQ/ledger-live/commit/f04099812f60fc328ee101b5f4f0457b1d1c4bfa), [`77dc4d9`](https://github.com/LedgerHQ/ledger-live/commit/77dc4d93ac293095a023efd41713b35b1c5974bf), [`030fc67`](https://github.com/LedgerHQ/ledger-live/commit/030fc677db03e8a411d3d33d2fa88e1ab04df80b), [`a781abe`](https://github.com/LedgerHQ/ledger-live/commit/a781abec59454ec3bd1cbd4b74b67666aef73aab), [`fe57525`](https://github.com/LedgerHQ/ledger-live/commit/fe57525f64607881552bf8c32edf2e5a78aca641), [`13d6db5`](https://github.com/LedgerHQ/ledger-live/commit/13d6db554a98dbbeed492f90caca8c962ba217d1), [`5b39a67`](https://github.com/LedgerHQ/ledger-live/commit/5b39a67dd93d4c541a77b0b146881073ca00ed15), [`0807eca`](https://github.com/LedgerHQ/ledger-live/commit/0807ecacfd06057811a3d6f8845b9f4bfc6f693c), [`e72d6ff`](https://github.com/LedgerHQ/ledger-live/commit/e72d6ffbd8b1a1ac79d272e1823ecfdfd06ed0ee), [`6a437fd`](https://github.com/LedgerHQ/ledger-live/commit/6a437fd60cb8d5c197f104a522ce1406da197e51), [`352c6a3`](https://github.com/LedgerHQ/ledger-live/commit/352c6a36999c1ee7436bdce218b10f15af0dab5f), [`68448cd`](https://github.com/LedgerHQ/ledger-live/commit/68448cdf5c1fd5a2b6d912f4034d170dbabfc93f), [`d1a01e8`](https://github.com/LedgerHQ/ledger-live/commit/d1a01e81f58f2a31b009235b5c9893ff60e6f353), [`75d0c9b`](https://github.com/LedgerHQ/ledger-live/commit/75d0c9b97aced42be1f465319ee17ccaafcd649d), [`eb4d29e`](https://github.com/LedgerHQ/ledger-live/commit/eb4d29ee1a9879963621168b1e208c53e532d28f), [`42fca4a`](https://github.com/LedgerHQ/ledger-live/commit/42fca4a650043e297b2bcbdd098c6743126d7247), [`a61f702`](https://github.com/LedgerHQ/ledger-live/commit/a61f702a6e41f2bf84d5602930e261a708507efa), [`e291645`](https://github.com/LedgerHQ/ledger-live/commit/e291645e8acb488323bf2ef8a26f045e6415c3fd), [`4faf5cd`](https://github.com/LedgerHQ/ledger-live/commit/4faf5cdcd91e183777a275123bb7d5c3890adbce), [`2edf614`](https://github.com/LedgerHQ/ledger-live/commit/2edf614eed7608714821ee54574d8c4d2b6f7d98), [`9e45705`](https://github.com/LedgerHQ/ledger-live/commit/9e45705b649513c3f9797c2add485a0ba3ea7a6c), [`e54d98b`](https://github.com/LedgerHQ/ledger-live/commit/e54d98b123ad8814be57c2f0e0f26689902ab4fd), [`004c294`](https://github.com/LedgerHQ/ledger-live/commit/004c29415d581626e16548fb96f18f7006128c2e), [`481bc40`](https://github.com/LedgerHQ/ledger-live/commit/481bc40f6e9573ff4c1387e9944cfdb1298e092b), [`b6da6b1`](https://github.com/LedgerHQ/ledger-live/commit/b6da6b1b1c98d022f30985c6103c239bffd0c7df), [`ca74f9d`](https://github.com/LedgerHQ/ledger-live/commit/ca74f9d50026c4a14657692de9c74c8f1c32f130), [`3dd9308`](https://github.com/LedgerHQ/ledger-live/commit/3dd9308f1a670a56588acbe70f2cbb4eb39d3432), [`fae92bf`](https://github.com/LedgerHQ/ledger-live/commit/fae92bf68e8ac167644aefa9e9d981a7b12cb23a), [`0076ce3`](https://github.com/LedgerHQ/ledger-live/commit/0076ce3a0da55f3b5b1f8c1f825ea11a0912bcb5), [`8153370`](https://github.com/LedgerHQ/ledger-live/commit/8153370ced31369208fe14ce8b24c6eb0d899ff4), [`6543cfd`](https://github.com/LedgerHQ/ledger-live/commit/6543cfd37c0db9227621df6dff2b2acd6be482e8), [`dd3baf3`](https://github.com/LedgerHQ/ledger-live/commit/dd3baf39e2fab7d30d0064e9a10e3e58df2dd6e1), [`7c20f72`](https://github.com/LedgerHQ/ledger-live/commit/7c20f72fb4e7cc0c3e728961d5e9823faef6dcb4), [`0fc43c1`](https://github.com/LedgerHQ/ledger-live/commit/0fc43c15841f585c0a9aaa5152587225978f7e2b), [`c8adec3`](https://github.com/LedgerHQ/ledger-live/commit/c8adec33638877b418723ca8473d469afb5be6d2), [`b2896a9`](https://github.com/LedgerHQ/ledger-live/commit/b2896a9b10cf6daaa8f532eaa12f016df606eb8b), [`320b488`](https://github.com/LedgerHQ/ledger-live/commit/320b4880a45d8ad2ce3f349a0bbae00df563ca84), [`e0d646e`](https://github.com/LedgerHQ/ledger-live/commit/e0d646e62345e411e5c3323a8b8af7361db48802), [`e3e7804`](https://github.com/LedgerHQ/ledger-live/commit/e3e7804bff59e1d6e28ec5c94fcbb421ddbbaf71), [`79882e2`](https://github.com/LedgerHQ/ledger-live/commit/79882e26a14f246f1cc969937e011b16e701b8f2), [`96ac61e`](https://github.com/LedgerHQ/ledger-live/commit/96ac61e367eae1da998547f00ae144e7c3947f2b), [`5a96e09`](https://github.com/LedgerHQ/ledger-live/commit/5a96e096169e44731117becf9c204666c4509364), [`a20805c`](https://github.com/LedgerHQ/ledger-live/commit/a20805cebd95f2f620d394c4d7598ec93506c83e), [`030b427`](https://github.com/LedgerHQ/ledger-live/commit/030b42707768af3f9c98a15fc6751f1d64b36fe6), [`a79b9aa`](https://github.com/LedgerHQ/ledger-live/commit/a79b9aacb2f21c89bd192342bc6b98a4265d4345), [`1de6156`](https://github.com/LedgerHQ/ledger-live/commit/1de61569d59e56b73a8797397cbdd1a10b069b08), [`4cc31ec`](https://github.com/LedgerHQ/ledger-live/commit/4cc31ec90cae0a36663b35da3a569222e8e8efdf), [`02ddf7e`](https://github.com/LedgerHQ/ledger-live/commit/02ddf7e9d7542d6f0fcdb18d7f9461c37a8b8ce1), [`93406e8`](https://github.com/LedgerHQ/ledger-live/commit/93406e87ae4398e314f899a0b30e54653b73c18b)]:
  - @ledgerhq/live-common@37.3.0-next.0
  - @features/flow-pay-card-balance@0.2.0-next.0
  - @features/flow-pay-card-deposit@0.2.0-next.0
  - @ledgerhq/coin-zcash@0.4.0-next.0
  - @shared/feature-flags@0.19.0-next.0
  - @domain/api-aggregated-assets@0.4.0-next.0
  - @features/platform-contacts@0.3.0-next.0
  - @domain/entity-contact@0.7.0-next.0
  - @features/flow-contacts@0.7.0-next.0
  - @ledgerhq/live-dmk-shared@0.31.0-next.0
  - @features/flow-large-screen-upsell@1.0.0-next.0
  - @ledgerhq/ledger-auth@0.4.0-next.0
  - @ledgerhq/ledger-key-ring-protocol@0.20.0-next.0
  - @shared/auth@0.5.0-next.0
  - @shared/api-services@0.4.0-next.0
  - @features/platform-card@0.2.0-next.0
  - @shared/env@0.3.0-next.0
  - @features/flow-contacts-add-contact@0.3.0-next.0
  - @ledgerhq/types-devices@7.0.0-next.0
  - @ledgerhq/coin-concordium@1.0.0-next.0
  - @ledgerhq/coin-filecoin@2.0.0-next.0
  - @ledgerhq/coin-cardano@1.0.0-next.0
  - @ledgerhq/coin-canton@1.0.0-next.0
  - @ledgerhq/coin-casper@3.0.0-next.0
  - @ledgerhq/coin-cosmos@1.0.0-next.0
  - @ledgerhq/coin-evm@5.0.0-next.0
  - @features/flow-contacts-introduction@0.2.0-next.0
  - @features/flow-pay-card-feature-tour@0.3.0-next.0
  - @features/flow-pay-card-auth@0.3.0-next.0
  - @devtools/bindings@0.4.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.0.0-next.0
  - @ledgerhq/types-live@6.120.0-next.0
  - @features/platform-aggregated-assets@0.4.0-next.0
  - @devtools/transport-panel@0.5.0-next.0
  - @devtools/wire@0.4.0-next.0
  - @domain/entity-currency-token@0.5.0-next.0
  - @domain/api-currency-token@0.5.0-next.0
  - @ledgerhq/asset-detail@0.11.1-next.0
  - @ledgerhq/live-dmk-desktop@0.20.7-next.0
  - @ledgerhq/coin-bitcoin@0.51.1-next.0
  - @features/platform-currencies@0.6.1-next.0
  - @features/platform-feature-flags@0.6.6-next.0
  - @ledgerhq/asset-aggregation@0.13.1-next.0
  - @domain/api-altcoins-sentiment@0.3.2-next.0
  - @domain/api-currency-fiat@0.4.1-next.0
  - @domain/api-market-sentiment@0.3.2-next.0
  - @domain/api-push-devices@0.2.2-next.0
  - @features/platform-env@0.2.1-next.0
  - @ledgerhq/live-dmk-speculos@0.10.5-next.0
  - @ledgerhq/wallet-analytics@0.3.4-next.0
  - @ledgerhq/wallet-pnl@0.7.7-next.0
  - @ledgerhq/device-intent@6.0.0-next.0
  - @ledgerhq/live-countervalues@0.24.3-next.0
  - @ledgerhq/live-countervalues-react@0.16.7-next.0
  - @ledgerhq/live-wallet@1.0.1-next.0
  - @ledgerhq/domain-service@1.8.15-next.0
  - @devtools/shell@0.8.1-next.0
  - @domain/entity-currency@0.4.1-next.0
  - @features/flow-analytics-consent@0.2.2-next.0
  - @ledgerhq/wallet-btc@0.3.0

## 4.16.0

### Minor Changes

- [#20278](https://github.com/LedgerHQ/ledger-live/pull/20278) [`3d24a89`](https://github.com/LedgerHQ/ledger-live/commit/3d24a898d59de55364ec29de29eaecb7ca14425d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop the `@ledgerhq/errors` dependency, completing the errors sunset (LIVE-32915).

  The `@ledgerhq/errors` package is removed from the monorepo: no workspace source imported it anymore, every error class it held now lives in the package that owns it (`@ledgerhq/ledger-wallet-framework/errors` for the ones shared across coin modules). `createCustomErrorClass` and the `serializeError` / `deserializeError` stack are gone with it — define errors as native classes and branch on `error.name`.

  `@ledgerhq/errors@6.37.0` stays on npm for external consumers, but is no longer published from this repo.

- [#20280](https://github.com/LedgerHQ/ledger-live/pull/20280) [`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Stop depending on `@ledgerhq/errors` (LIVE-32915).

  No workspace package declares it anymore, and none may again: `enforce-boundaries` now fails CI on any manifest that does. The classes it held live in the package that owns them, with `@ledgerhq/ledger-wallet-framework/errors` as the shared home below the coin layer.

  The package itself stays in the repo so it keeps being published for external consumers, and is bridged to the external coin packages that still peer-depend on it via `pnpm.packageExtensions` using `workspace:*` (which reuses the single in-repo copy, so the dependency graph keeps exactly the physical copies it had before). [LedgerHQ/coin-modules#752](https://github.com/LedgerHQ/coin-modules/pull/752) removes that peerDependency upstream; once it is released the bridge can be dropped, but the package still needs publishing.

- [#20315](https://github.com/LedgerHQ/ledger-live/pull/20315) [`4b73f81`](https://github.com/LedgerHQ/ledger-live/commit/4b73f81aca25a92178850b3f7ac7519a7efcac67) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Portfolio upsell banner and Braze content cards can now coexist on Portfolio (Mobile: shared carousel; Desktop: side-by-side grid when Braze placement is enabled, otherwise upsell stacked above the Braze carousel).

- [#20624](https://github.com/LedgerHQ/ledger-live/pull/20624) [`e74a4a3`](https://github.com/LedgerHQ/ledger-live/commit/e74a4a391dd1540c9d09f3e9e86d250422a0df65) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Retarget desktop off the dada-client shims onto @features/platform-aggregated-assets and @domain/api-aggregated-assets

- [#20474](https://github.com/LedgerHQ/ledger-live/pull/20474) [`e73390c`](https://github.com/LedgerHQ/ledger-live/commit/e73390cfa30d2d7ec7a9644875063c77b42f0713) Thanks [@deepyjr](https://github.com/deepyjr)! - Replace the Desktop address name clear action with a help tooltip.

- [#20404](https://github.com/LedgerHQ/ledger-live/pull/20404) [`0f89b44`](https://github.com/LedgerHQ/ledger-live/commit/0f89b44de874d3921ff93b323c7db0f00d22cac6) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Replace the legacy Pay Card placeholders with the shared authentication flow on desktop and mobile

- [#20266](https://github.com/LedgerHQ/ledger-live/pull/20266) [`626c858`](https://github.com/LedgerHQ/ledger-live/commit/626c858672c15198f2315e260f6e033951782c74) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Upgrade analytics consent QA debug screen to scenario parity

- [#20585](https://github.com/LedgerHQ/ledger-live/pull/20585) [`feaf2fc`](https://github.com/LedgerHQ/ledger-live/commit/feaf2fcb8b3d71ab731e0ee52243e8d2a87d5604) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Require signer confirmation before opening address delete confirmation in Contacts.

- [#20423](https://github.com/LedgerHQ/ledger-live/pull/20423) [`44694e5`](https://github.com/LedgerHQ/ledger-live/commit/44694e54fa5b48e47595840638aee94a98213a37) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Complete the WalletSync DDD extraction: apps now compose the DDD slices directly

  `@ledgerhq/live-wallet` no longer owns sync infrastructure. `src/cloudsync/`, `src/walletsync/`,
  `src/accountName.ts` and `src/store.ts` are removed in favour of `@shared/cloud-sync`,
  `@shared/wallet-sync`, `@features/platform-wallet-sync`, `@domain/entity-account-name` and
  `@domain/entity-recent-addresses`. What remains is the account list sync module (`src/accounts/`)
  plus `src/walletSyncComposition.ts`, which assembles the sync modules into the wallet-sync schema.

  Desktop and mobile replace the monolithic `wallet` reducer with a `combineReducers` of the entity
  slices (`accountNames`, `starredAccountIds`, `walletSync`, `recentAddresses`, `nonImportedAccountInfos`)
  and wire the watch loop and trustchain lifecycle from `@features/platform-wallet-sync` at bootstrap.
  `@ledgerhq/live-common` drops its `@ledgerhq/live-wallet` runtime dependency: the wallet-api,
  platform and CSV-export helpers now take an `AccountNamesState` instead of the whole `WalletState`.

- [#19169](https://github.com/LedgerHQ/ledger-live/pull/19169) [`d989af2`](https://github.com/LedgerHQ/ledger-live/commit/d989af214ff55318633fe8756f64bd60e3e4c100) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Add desktop Device Intent Executor context initializer.

- [#20520](https://github.com/LedgerHQ/ledger-live/pull/20520) [`0db9cd3`](https://github.com/LedgerHQ/ledger-live/commit/0db9cd33eeb0175e126046f3113f0bd769155b25) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Add Device Intent Executor shell tracking (lifecycle, errors, dialog dismiss).

- [#20608](https://github.com/LedgerHQ/ledger-live/pull/20608) [`4033c32`](https://github.com/LedgerHQ/ledger-live/commit/4033c32ae5ec08e4af5bdd08aeab0e395e558969) Thanks [@vladyslavchupovskiy-ext-art](https://github.com/vladyslavchupovskiy-ext-art)! - Add `deriveShieldedAddress(ufvk)` to derive the Orchard unified address host-side from a UFVK without requiring a device connection. Persists `shieldedAddress` in `ZcashPrivateInfo` with backward-compatible serialisation (null fallback for legacy accounts).

- [#20595](https://github.com/LedgerHQ/ledger-live/pull/20595) [`43bf6d8`](https://github.com/LedgerHQ/ledger-live/commit/43bf6d8f6600f70b7c2a85615660e7e150e798bf) Thanks [@ysitbon](https://github.com/ysitbon)! - Make every new-architecture barrel a pure regrouping point, and enforce it.

  An `index.*` under `shared/`, `domain/` or `features/` may now contain only `export * from "./x"`
  lines, plus an optional default re-export. Having to sort in the export
  (`export { a, b } from "./x"`) proved the target file mixed public and private code; an `index.*`
  holding actual code proved it more loudly. A new nx plugin infers a `lint:structure` target on each
  of the 49 packages and fails on both, along with two related rules: a barrel may not re-export a
  private `internals` location, and it may not re-export another workspace package.

  That last rule removes the proxies. A package that re-exported a neighbour gave the same symbol two
  import paths and hid who actually provided it. Consumers now import the original provider and
  declare the dependency, which is why the two apps gain `@features/flow-contacts-add-contact` and the
  desktop app gains `@features/platform-contacts`.

  Renamed or relocated, with the import specifier unchanged for consumers in every case except where
  noted:

  - `@domain/entity-account-name` no longer exports the `setAccountNames` alias; use
    `bulkSetAccountNames`, the name the slice actually defines.
  - `@shared/cloud-sync` exports `getCloudSyncApi` as a named export from its api module instead of
    re-exporting a default under a different name.

  Five packages are left untouched behind temporary exclusions, each recording how to remove it:

  - `@shared/env`, the facade over the legacy `@ledgerhq/live-env`, which carries the wrapping in its
    barrel.
  - the `@ledgerhq/engagement` and `@ledgerhq/ptx` packages (`flow-analytics-consent`,
    `flow-large-screen-upsell`, `flow-lazy-onboarding-banner`, `flow-pay-card-auth`), so each owning
    team lands the change on its own schedule. Conformant barrels were prepared and verified for them
    before being reverted, so the work is deferred rather than open.

- [#20627](https://github.com/LedgerHQ/ledger-live/pull/20627) [`7af726b`](https://github.com/LedgerHQ/ledger-live/commit/7af726b50eb7c8a2712bf734aac5618be61911ef) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Explain the higher network fees when sending to an address that does not exist yet. EIP-8037 charges account creation substantially more gas, and nothing in the send flow told the user why the fee jumped. The gas we send is unchanged: `eth_estimateGas` remains the only source.

- [#20646](https://github.com/LedgerHQ/ledger-live/pull/20646) [`fd7152a`](https://github.com/LedgerHQ/ledger-live/commit/fd7152a28ca7b11bf21edba822d8b4ede6e68d7c) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwd): add recipient contact card to the send flow

- [#20439](https://github.com/LedgerHQ/ledger-live/pull/20439) [`65beee5`](https://github.com/LedgerHQ/ledger-live/commit/65beee51d8d203b8d3d0a850546f6866d3cebb2f) Thanks [@deepyjr](https://github.com/deepyjr)! - Fix the Contacts currency selection list so it fills the modal height.

- [#20454](https://github.com/LedgerHQ/ledger-live/pull/20454) [`e1b63ff`](https://github.com/LedgerHQ/ledger-live/commit/e1b63ff4acf13bbb30ddbd7e95627797b5462147) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwd): bip21 and eip681 scan for lwd

- [#20455](https://github.com/LedgerHQ/ledger-live/pull/20455) [`f77b3fa`](https://github.com/LedgerHQ/ledger-live/commit/f77b3fa8954e93a00acdbd3e52210561028fd6b8) Thanks [@deepyjr](https://github.com/deepyjr)! - Add invalid and sanctioned address feedback to the Desktop Contacts flow.

- [#20641](https://github.com/LedgerHQ/ledger-live/pull/20641) [`1dde844`](https://github.com/LedgerHQ/ledger-live/commit/1dde844ac3bbd94659076016e69d3e38ed79ebe0) Thanks [@semeano](https://github.com/semeano)! - Add a warning on Zcash accounts that the private balance excludes Sapling and Orchard shielded funds.

- [#20216](https://github.com/LedgerHQ/ledger-live/pull/20216) [`593231c`](https://github.com/LedgerHQ/ledger-live/commit/593231c81f7f9cdf59b28aa8f88fe7b96752d758) Thanks [@semeano](https://github.com/semeano)! - Restrict the Zcash balance, operations and shielded send flow to the Ironwood pool only.

- [#20207](https://github.com/LedgerHQ/ledger-live/pull/20207) [`aee0e64`](https://github.com/LedgerHQ/ledger-live/commit/aee0e64b491aafc1ca8fea16b1ef124cb183770b) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Add Internet Computer (ICP) neuron staking to the coin module: create and top up neurons, start/stop dissolving, disburse, set/increase dissolve delay, follow, split, spawn, stake maturity, and add/remove hot keys, plus neuron listing. Governance operations are routed through the NNS governance canister via the device's update-call signing, alongside the existing ledger transfer path, and account synchronization now carries neuron data. Adds the `STAKE_NEURON` and `TOP_UP_NEURON` operation types, with matching icons and labels in the desktop and mobile operation history. (LIVE-28469)

- [#20456](https://github.com/LedgerHQ/ledger-live/pull/20456) [`a0f13a2`](https://github.com/LedgerHQ/ledger-live/commit/a0f13a2b5410acc1e03231a94a5af9d77b6dabf6) Thanks [@sarneijim](https://github.com/sarneijim)! - Use fixed legacy onboarding date for backfill instead of app-open date

- [#20458](https://github.com/LedgerHQ/ledger-live/pull/20458) [`9876163`](https://github.com/LedgerHQ/ledger-live/commit/9876163c9686f72fead2004a6388764536c29cfd) Thanks [@sarneijim](https://github.com/sarneijim)! - Use legacy onboarding date fallback in large-screen upsell eligibility

- [#19169](https://github.com/LedgerHQ/ledger-live/pull/19169) [`92b70ef`](https://github.com/LedgerHQ/ledger-live/commit/92b70ef6318741216740d7341f37627c32a3f0d6) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Preserve installed apps in Device Intent Executor last seen device info.

- [#20408](https://github.com/LedgerHQ/ledger-live/pull/20408) [`e9a14f8`](https://github.com/LedgerHQ/ledger-live/commit/e9a14f886532f3ee00dc7f28727c762ec75fc9b3) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Wire send, edit, and delete actions on desktop contact address detail.

- [#20557](https://github.com/LedgerHQ/ledger-live/pull/20557) [`3e0ae80`](https://github.com/LedgerHQ/ledger-live/commit/3e0ae805b065eaa3d5fd3c1ab35c0d7f8e2a170f) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Render Desktop Contacts address edit signer mismatch error from shared flow state.

- [#20539](https://github.com/LedgerHQ/ledger-live/pull/20539) [`60b4626`](https://github.com/LedgerHQ/ledger-live/commit/60b462653bad19429c46ebef439ec2b5bb234140) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Scope `@ledgerhq/live-wallet` down to wallet sync only

  The package now exposes `./accounts` and `./walletSyncComposition` and nothing else.
  `ordering.ts` and `addAccounts.ts` move to `@ledgerhq/live-common/account/*`, and
  `accountRawToAccountUserData` joins `live-common/account/serialization` next to `fromAccountRaw`.
  The `liveqr/` folder is gone: `importAccounts.ts` and `accountToAccountData` were unreachable, and
  `accountDataToAccount` — whose only callers rehydrated a wallet-sync descriptor — becomes
  `accounts/descriptorToAccount`. `live-common` no longer depends on `live-wallet`.

- [#20510](https://github.com/LedgerHQ/ledger-live/pull/20510) [`a1bd49e`](https://github.com/LedgerHQ/ledger-live/commit/a1bd49ec9190a395730b3348fef5c0987e4eaeb7) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Model Me as the default self contact with shared display-name formatting, external address counts, and a Ledger Wallet accounts intent.

- [#20643](https://github.com/LedgerHQ/ledger-live/pull/20643) [`bef9477`](https://github.com/LedgerHQ/ledger-live/commit/bef9477286ba11c0e7eed7af34c1ec7c95204cc9) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(send): validate custom fees against native balance for evm tokens

- [#18764](https://github.com/LedgerHQ/ledger-live/pull/18764) [`d266e13`](https://github.com/LedgerHQ/ledger-live/commit/d266e13aa8e8b34ca74beaa09687b6e8d426f821) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Migrate the swap `fetchQuotes` helper from axios to an RTK Query endpoint (`swapQuotesApi`). The aggregator `/quote` request now flows through the Redux data layer, and the rawQuotes/providerErrors split is unchanged. Desktop and mobile register the new API and inject their store dispatch at startup via `setSwapQuotesStore`; wallet-cli, which has no app store, sets up a standalone one.

  The endpoint itself now lives in the new `@domain/api-swap-quotes` package; live-common re-exports it, so existing call sites are unchanged.

  Two behaviour changes to be aware of:

  - `/quote` now goes through the authenticated base query, where the legacy axios call sent no credentials. Both apps already register an auth provider on their store's `extra`, so whether a request carries an `Authorization` header is controlled entirely by the `lwdAuth`/`lwmAuth` feature flags. They are disabled by default; enabling either one makes `/quote` send the user's bearer token to the aggregator, and makes a 401/403 trigger the adapter's refresh-and-retry.
  - An aggregator HTTP error (4xx/5xx) now resolves to an empty result, so the caller surfaces the `noQuotes` global. Previously the shared axios error interceptor turned these into `LedgerAPI4xx`/`LedgerAPI5xx`, which propagated to the live app as an error. Only transport failures (no HTTP response) still reject, now with a `SwapQuotesRequestFailed` error rather than a bare RTK Query error object.

- [#20638](https://github.com/LedgerHQ/ledger-live/pull/20638) [`120d4eb`](https://github.com/LedgerHQ/ledger-live/commit/120d4eb87fbfe438e56c735e8d34bf6f2a94139c) Thanks [@sarneijim](https://github.com/sarneijim)! - Use full-width LNS upsell MediaBanner in notification center

- [#20642](https://github.com/LedgerHQ/ledger-live/pull/20642) [`a61f702`](https://github.com/LedgerHQ/ledger-live/commit/a61f702a6e41f2bf84d5602930e261a708507efa) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Persist the pay card hero balance filter across app restarts

- [#20551](https://github.com/LedgerHQ/ledger-live/pull/20551) [`488217f`](https://github.com/LedgerHQ/ledger-live/commit/488217fe52d77761bc18b5f0d1a4c9908e6883cd) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Persist the payCard slice on desktop: save and restore only { hasSeenFeatureTour } so the Pay feature tour does not reappear after restarting the app

- [#20628](https://github.com/LedgerHQ/ledger-live/pull/20628) [`8259d4d`](https://github.com/LedgerHQ/ledger-live/commit/8259d4d1617e640e04441644947332936d9fbe81) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwdm): add matched contact lookup for the send recipient flow

- [#20518](https://github.com/LedgerHQ/ledger-live/pull/20518) [`ce46179`](https://github.com/LedgerHQ/ledger-live/commit/ce461796d908185e5ea36b630ba71ff9ef8118b8) Thanks [@dilaouid](https://github.com/dilaouid)! - chore(lwdm): refactoring mvvm recipient screen

- [#20430](https://github.com/LedgerHQ/ledger-live/pull/20430) [`647804e`](https://github.com/LedgerHQ/ledger-live/commit/647804ee755d54776e6b8cd96328bee89fb035e4) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Move the recent-addresses domain model and in-memory store into `@domain/entity-recent-addresses`

  `RecentAddress` and `RecentAddressesState` are no longer declared in `@ledgerhq/types-live`; they are now inferred from the Zod schemas in `@domain/entity-recent-addresses`, which also owns `RecentAddressesStore`, `setupRecentAddressesStore` and `getRecentAddressesStore`. Import them from `@domain/entity-recent-addresses`.

  `@ledgerhq/live-common/account/index` still re-exports the store API unchanged, minus the `RecentAddressesCache` alias — use `RecentAddressesState` instead.

  Also fixes the store mutating its own state in place: once a first mutation had been dispatched, immer had frozen that exact object graph, so the next `addAddress` or `removeAddress` on the same currency threw `TypeError: Cannot assign to read only property`. The store now replaces its state instead of mutating it.

- [#20473](https://github.com/LedgerHQ/ledger-live/pull/20473) [`73948c9`](https://github.com/LedgerHQ/ledger-live/commit/73948c9cfdecd63eee106a9ed9dae1495a1198bd) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(lwdm): fix sanctionned ens address check

- [#20111](https://github.com/LedgerHQ/ledger-live/pull/20111) [`aa3ea09`](https://github.com/LedgerHQ/ledger-live/commit/aa3ea0972205b589d2f92e352ac7154d11f872bc) Thanks [@YazhuEth](https://github.com/YazhuEth)! - chore(coin-solana): remove preload and hydrate - fetch validators on demand

  `CurrencyBridge.preload` / `hydrate` are deprecated, and preloading the validators.app
  list slowed down the scan account flow. Validators are now fetched lazily behind a 15min
  LRU cache (`@ledgerhq/coin-solana/validators`) the first time a screen needs them.

  `useSolanaPreloadData` is removed from `@ledgerhq/live-common/families/solana/react`; use
  `useValidators` instead. `getAccountBannerState` now takes the validators as a third argument.

- [#20371](https://github.com/LedgerHQ/ledger-live/pull/20371) [`0f42c42`](https://github.com/LedgerHQ/ledger-live/commit/0f42c42e9d83aee52414f2e962805480629802f2) Thanks [@deepyjr](https://github.com/deepyjr)! - Add mocked confirmation and saved address rendering to Desktop Contacts.

- [#20333](https://github.com/LedgerHQ/ledger-live/pull/20333) [`4ef4615`](https://github.com/LedgerHQ/ledger-live/commit/4ef461568534f55a5d3242122ffb2d41fefc05ad) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Inline large-screen upsell modal entity state into the flow package

- [#20471](https://github.com/LedgerHQ/ledger-live/pull/20471) [`3aefd3b`](https://github.com/LedgerHQ/ledger-live/commit/3aefd3b23301f693bb5c8b8533c796a9d8fdefe7) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(lwdm): check sanctions for token recipient addresses

- [#20622](https://github.com/LedgerHQ/ledger-live/pull/20622) [`ed79527`](https://github.com/LedgerHQ/ledger-live/commit/ed79527dd83bb950dd6701d1677d6703cec6051c) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - Rename Hedera's `HederaValidator.nodeId` to `id` (string), matching the framework's `Validator.id` and removing the duplicate identity field. Preload caches persisted by earlier versions are migrated on hydration, so upgrading users keep their cached validators. On-chain protocol fields (`Transaction.stakingNodeId`, `HederaDelegation.nodeId`) are unchanged.

- [#20508](https://github.com/LedgerHQ/ledger-live/pull/20508) [`e7c941f`](https://github.com/LedgerHQ/ledger-live/commit/e7c941fbac63f03938fa43f25523e3a6cb33c158) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Extract ghost-click guard logic to shared utility in EditName dialog

- [#20637](https://github.com/LedgerHQ/ledger-live/pull/20637) [`f440c85`](https://github.com/LedgerHQ/ledger-live/commit/f440c85eeb1669f3660ddbff18ae7892bb9f5923) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Retarget the remaining libs consumers and both store roots off the dada-client shims

- [#20597](https://github.com/LedgerHQ/ledger-live/pull/20597) [`8c97aa1`](https://github.com/LedgerHQ/ledger-live/commit/8c97aa11f96af73f13df2416bd603f6cd0f12a30) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Track Device Intent Executor Connect App states on desktop.

- [#20552](https://github.com/LedgerHQ/ledger-live/pull/20552) [`e499f00`](https://github.com/LedgerHQ/ledger-live/commit/e499f0057dded9b25dfed8ce5ec6f58312906537) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Add Device Intent Executor Connect Device tracking.

### Patch Changes

- Updated dependencies [[`3d24a89`](https://github.com/LedgerHQ/ledger-live/commit/3d24a898d59de55364ec29de29eaecb7ca14425d), [`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add), [`8559d54`](https://github.com/LedgerHQ/ledger-live/commit/8559d54293b7854ea2dc900625bdb746720a4a85), [`f080e51`](https://github.com/LedgerHQ/ledger-live/commit/f080e51c682c2ac1239c0417e29b32b79d363eb9), [`9b3fb2a`](https://github.com/LedgerHQ/ledger-live/commit/9b3fb2a98eaa530c12e55eb3391f58a306c80d8f), [`e73390c`](https://github.com/LedgerHQ/ledger-live/commit/e73390cfa30d2d7ec7a9644875063c77b42f0713), [`6f6afe2`](https://github.com/LedgerHQ/ledger-live/commit/6f6afe2b6203b5c46cbe450b254be493689c0cad), [`1de30a9`](https://github.com/LedgerHQ/ledger-live/commit/1de30a98a7a3db27f42de0c9608e1d0be748a10e), [`0f89b44`](https://github.com/LedgerHQ/ledger-live/commit/0f89b44de874d3921ff93b323c7db0f00d22cac6), [`6258380`](https://github.com/LedgerHQ/ledger-live/commit/62583805c47b3af4724f6cf693f209c7744228bc), [`f1e93f7`](https://github.com/LedgerHQ/ledger-live/commit/f1e93f79bedea0b6a2c140271769c37cf4e02407), [`02c6f9e`](https://github.com/LedgerHQ/ledger-live/commit/02c6f9e46152894aa97648f50a52efaad38aa86c), [`c4a8141`](https://github.com/LedgerHQ/ledger-live/commit/c4a8141369e63e875fb5bfc9aef3f53362150338), [`feaf2fc`](https://github.com/LedgerHQ/ledger-live/commit/feaf2fcb8b3d71ab731e0ee52243e8d2a87d5604), [`9ef4440`](https://github.com/LedgerHQ/ledger-live/commit/9ef44402ece2207268361bfe4e2af8fbd1396670), [`5297c79`](https://github.com/LedgerHQ/ledger-live/commit/5297c79823362f5e7584886c8193808988ec46fc), [`cc8b5b9`](https://github.com/LedgerHQ/ledger-live/commit/cc8b5b9af4a2ec488b6912d3fcb08bcc8f4b72c3), [`44694e5`](https://github.com/LedgerHQ/ledger-live/commit/44694e54fa5b48e47595840638aee94a98213a37), [`4033c32`](https://github.com/LedgerHQ/ledger-live/commit/4033c32ae5ec08e4af5bdd08aeab0e395e558969), [`43bf6d8`](https://github.com/LedgerHQ/ledger-live/commit/43bf6d8f6600f70b7c2a85615660e7e150e798bf), [`fd3e81e`](https://github.com/LedgerHQ/ledger-live/commit/fd3e81e80eb5400e739e40e3ed360f40139d2aa4), [`7af726b`](https://github.com/LedgerHQ/ledger-live/commit/7af726b50eb7c8a2712bf734aac5618be61911ef), [`e5ec77b`](https://github.com/LedgerHQ/ledger-live/commit/e5ec77bf92a89c5f9a36a2e5901729e20682ead0), [`fd7152a`](https://github.com/LedgerHQ/ledger-live/commit/fd7152a28ca7b11bf21edba822d8b4ede6e68d7c), [`2ec3de4`](https://github.com/LedgerHQ/ledger-live/commit/2ec3de4f864bc7bccf02f42b04356bb563f9ed91), [`4d27e41`](https://github.com/LedgerHQ/ledger-live/commit/4d27e41c217cfae16526357a1a78db15c6980950), [`2f297f7`](https://github.com/LedgerHQ/ledger-live/commit/2f297f74dcda8113f86196ecd9c61e327f7981e9), [`f77b3fa`](https://github.com/LedgerHQ/ledger-live/commit/f77b3fa8954e93a00acdbd3e52210561028fd6b8), [`d614891`](https://github.com/LedgerHQ/ledger-live/commit/d614891593fe2ce794bd1e6dea8bfb69e89c775b), [`593231c`](https://github.com/LedgerHQ/ledger-live/commit/593231c81f7f9cdf59b28aa8f88fe7b96752d758), [`9e1412e`](https://github.com/LedgerHQ/ledger-live/commit/9e1412e08ccccd4af4a7078a797332ea92f86c63), [`aee0e64`](https://github.com/LedgerHQ/ledger-live/commit/aee0e64b491aafc1ca8fea16b1ef124cb183770b), [`9708010`](https://github.com/LedgerHQ/ledger-live/commit/970801044529fe978ccbb8c562cc64c00277d1de), [`a0f13a2`](https://github.com/LedgerHQ/ledger-live/commit/a0f13a2b5410acc1e03231a94a5af9d77b6dabf6), [`9876163`](https://github.com/LedgerHQ/ledger-live/commit/9876163c9686f72fead2004a6388764536c29cfd), [`92b70ef`](https://github.com/LedgerHQ/ledger-live/commit/92b70ef6318741216740d7341f37627c32a3f0d6), [`5bdffd5`](https://github.com/LedgerHQ/ledger-live/commit/5bdffd5b9590cc65e650fb0d5b28a5fbf2477d00), [`e9a14f8`](https://github.com/LedgerHQ/ledger-live/commit/e9a14f886532f3ee00dc7f28727c762ec75fc9b3), [`91a2953`](https://github.com/LedgerHQ/ledger-live/commit/91a29531167176557194d9adbc6b55ff11363b8d), [`3e0ae80`](https://github.com/LedgerHQ/ledger-live/commit/3e0ae805b065eaa3d5fd3c1ab35c0d7f8e2a170f), [`c904346`](https://github.com/LedgerHQ/ledger-live/commit/c9043466032fab4f9c2ae02d4bd52970ad8fbcfe), [`60b4626`](https://github.com/LedgerHQ/ledger-live/commit/60b462653bad19429c46ebef439ec2b5bb234140), [`28046d3`](https://github.com/LedgerHQ/ledger-live/commit/28046d31707d0290b56522c14b51623860b7a3f8), [`64bb8cf`](https://github.com/LedgerHQ/ledger-live/commit/64bb8cfa5bffde5a1e2c24615f1dd11b864094d2), [`a1bd49e`](https://github.com/LedgerHQ/ledger-live/commit/a1bd49ec9190a395730b3348fef5c0987e4eaeb7), [`bef9477`](https://github.com/LedgerHQ/ledger-live/commit/bef9477286ba11c0e7eed7af34c1ec7c95204cc9), [`d266e13`](https://github.com/LedgerHQ/ledger-live/commit/d266e13aa8e8b34ca74beaa09687b6e8d426f821), [`e1e005d`](https://github.com/LedgerHQ/ledger-live/commit/e1e005daff0d3e01ef397ac752cbc711245539a7), [`1e9db75`](https://github.com/LedgerHQ/ledger-live/commit/1e9db750a4882f9db7f95278e33c00262487b37b), [`7d5cd98`](https://github.com/LedgerHQ/ledger-live/commit/7d5cd9812a7827b3f1b926166a4a3fde20c7b59c), [`cc9d58f`](https://github.com/LedgerHQ/ledger-live/commit/cc9d58f08ae38197ea2bd19115eda870d348f6aa), [`6be80d8`](https://github.com/LedgerHQ/ledger-live/commit/6be80d873a958544f4152348337aae8a0c0c2815), [`0e439a0`](https://github.com/LedgerHQ/ledger-live/commit/0e439a0b73f1ad49aab32e98dfaf4fbd1d0ded04), [`a61f702`](https://github.com/LedgerHQ/ledger-live/commit/a61f702a6e41f2bf84d5602930e261a708507efa), [`40efdfb`](https://github.com/LedgerHQ/ledger-live/commit/40efdfbb42cdc94b8efb59a9aa45992ff7c64653), [`2edf614`](https://github.com/LedgerHQ/ledger-live/commit/2edf614eed7608714821ee54574d8c4d2b6f7d98), [`9e45705`](https://github.com/LedgerHQ/ledger-live/commit/9e45705b649513c3f9797c2add485a0ba3ea7a6c), [`baba728`](https://github.com/LedgerHQ/ledger-live/commit/baba7280d4495fd1c6a80d18cb50412a21ec9a76), [`09c77c1`](https://github.com/LedgerHQ/ledger-live/commit/09c77c1814ddaad1265df5d52f4f6a336bc78ff1), [`8259d4d`](https://github.com/LedgerHQ/ledger-live/commit/8259d4d1617e640e04441644947332936d9fbe81), [`ac57e97`](https://github.com/LedgerHQ/ledger-live/commit/ac57e970074572eb99e989c8f5a1a6bd227c922b), [`6694d77`](https://github.com/LedgerHQ/ledger-live/commit/6694d77f1fc4a691e2d97a2d44e8bf9513cecb1e), [`bbfc8cf`](https://github.com/LedgerHQ/ledger-live/commit/bbfc8cf7929d9bffc1aa1b9a5e3b9593e3016436), [`647804e`](https://github.com/LedgerHQ/ledger-live/commit/647804ee755d54776e6b8cd96328bee89fb035e4), [`6d45e7c`](https://github.com/LedgerHQ/ledger-live/commit/6d45e7c4245be9acaf2f3a86f48d38e5677d8e96), [`79d2278`](https://github.com/LedgerHQ/ledger-live/commit/79d22789896f55d9a7196392632b08488997d937), [`5edd732`](https://github.com/LedgerHQ/ledger-live/commit/5edd732aa9fd1769667a349b513ebdb985a1475c), [`8a3a0bb`](https://github.com/LedgerHQ/ledger-live/commit/8a3a0bbd8361706daac364d4c89894f56431fc57), [`71b1069`](https://github.com/LedgerHQ/ledger-live/commit/71b1069ae8358b4d3fa3a6a5d4fb2d49f1c1c7d7), [`ccbda89`](https://github.com/LedgerHQ/ledger-live/commit/ccbda895d0672222becbe50df61fcf7646618448), [`9ea6eed`](https://github.com/LedgerHQ/ledger-live/commit/9ea6eedc129c4d496ec745a6affeddb136d3680f), [`da86f85`](https://github.com/LedgerHQ/ledger-live/commit/da86f85f2bb1cc94c413a94796e6735ba83eee52), [`aa3ea09`](https://github.com/LedgerHQ/ledger-live/commit/aa3ea0972205b589d2f92e352ac7154d11f872bc), [`aaa67a7`](https://github.com/LedgerHQ/ledger-live/commit/aaa67a733e16cdfcb3f02b22038b0ae5518fb0ec), [`aac9b34`](https://github.com/LedgerHQ/ledger-live/commit/aac9b34feb7a898e16fc98758046c0c3bc9fcbcb), [`c9eab39`](https://github.com/LedgerHQ/ledger-live/commit/c9eab39bff1f46fc63c8717237390aa94fb78dec), [`4ef4615`](https://github.com/LedgerHQ/ledger-live/commit/4ef461568534f55a5d3242122ffb2d41fefc05ad), [`ed79527`](https://github.com/LedgerHQ/ledger-live/commit/ed79527dd83bb950dd6701d1677d6703cec6051c), [`bdd82c4`](https://github.com/LedgerHQ/ledger-live/commit/bdd82c435d01d56397fe0967e92825f0442bf487), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152), [`78ebc73`](https://github.com/LedgerHQ/ledger-live/commit/78ebc736177e9e751f4d7a7a6a3fae97a1913c1f), [`f440c85`](https://github.com/LedgerHQ/ledger-live/commit/f440c85eeb1669f3660ddbff18ae7892bb9f5923), [`b0e81d2`](https://github.com/LedgerHQ/ledger-live/commit/b0e81d2edc7c40e2c81236ea372370859d05d0bc), [`fb1ba1b`](https://github.com/LedgerHQ/ledger-live/commit/fb1ba1b97d0e50d8780e678073d12faaab290722), [`135223e`](https://github.com/LedgerHQ/ledger-live/commit/135223e49d4d927183cf893f563ed583e18f3346), [`4c9af42`](https://github.com/LedgerHQ/ledger-live/commit/4c9af429730f79e04d0f220f03b58565a5660e30), [`b9d4a22`](https://github.com/LedgerHQ/ledger-live/commit/b9d4a2209b5fff587c67ea8868bcf553fcc4ecbd), [`79789ba`](https://github.com/LedgerHQ/ledger-live/commit/79789ba23f1105c033574ae8f8c552a3a757d74c), [`5171877`](https://github.com/LedgerHQ/ledger-live/commit/5171877faeb78ab9efbbf8c20b9fa6697e61872f), [`e664d84`](https://github.com/LedgerHQ/ledger-live/commit/e664d84bc45a0bde9f4794c96d43e8a7eebb83b9)]:
  - @ledgerhq/coin-bitcoin@0.51.0
  - @ledgerhq/coin-canton@0.33.0
  - @ledgerhq/coin-cardano@0.34.0
  - @ledgerhq/coin-casper@2.19.0
  - @ledgerhq/coin-concordium@0.20.0
  - @ledgerhq/coin-cosmos@0.43.0
  - @ledgerhq/coin-evm@4.10.0
  - @ledgerhq/coin-filecoin@1.32.0
  - @ledgerhq/live-common@37.2.0
  - @features/flow-contacts@0.6.0
  - @features/platform-contacts@0.2.0
  - @features/flow-contacts-add-contact@0.2.0
  - @features/flow-pay-card-auth@0.2.0
  - @domain/entity-contact@0.6.0
  - @ledgerhq/ledger-key-ring-protocol@0.19.0
  - @shared/cloud-sync@0.1.0
  - @domain/entity-currency-crypto@0.10.0
  - @domain/entity-currency-token@0.4.0
  - @domain/entity-currency-fiat@0.4.0
  - @ledgerhq/live-wallet@1.0.0
  - @domain/entity-wallet-sync@0.1.0
  - @ledgerhq/coin-zcash@0.3.0
  - @domain/api-currency-fiat@0.4.0
  - @domain/api-currency-token@0.4.0
  - @domain/entity-account-name@0.2.0
  - @domain/entity-client-identity@0.2.0
  - @domain/entity-currency@0.4.0
  - @features/flow-fear-and-greed@0.3.0
  - @features/platform-aggregated-assets@0.3.0
  - @features/platform-currencies@0.6.0
  - @features/platform-env@0.2.0
  - @features/platform-style@0.2.0
  - @shared/api-services@0.3.0
  - @shared/auth@0.4.0
  - @shared/feature-flags@0.18.0
  - @ledgerhq/types-live@6.119.0
  - @ledgerhq/ledger-wallet-framework@2.8.0
  - @features/flow-large-screen-upsell@0.5.0
  - @domain/api-aggregated-assets@0.3.0
  - @domain/entity-interest-rate@0.3.0
  - @ledgerhq/hw-transport-http@6.37.0
  - @ledgerhq/types-devices@6.32.0
  - @domain/entity-pay-card@0.3.0
  - @devtools/bindings@0.3.0
  - @devtools/transport-panel@0.4.0
  - @devtools/shell@0.8.0
  - @ledgerhq/live-dmk-shared@0.30.0
  - @ledgerhq/asset-detail@0.11.0
  - @ledgerhq/asset-aggregation@0.13.0
  - @ledgerhq/live-dmk-desktop@0.20.6
  - @features/platform-wallet-sync@0.1.1
  - @ledgerhq/live-currency-format@0.14.1
  - @ledgerhq/wallet-analytics@0.3.3
  - @ledgerhq/wallet-btc@0.3.0
  - @ledgerhq/wallet-pnl@0.7.6
  - @domain/entity-analytics-consent@0.2.1
  - @domain/api-push-devices@0.2.1
  - @domain/api-altcoins-sentiment@0.3.1
  - @domain/api-market-sentiment@0.3.1
  - @domain/entity-recent-addresses@0.1.1
  - @features/platform-feature-flags@0.6.5
  - @devtools/wire@0.3.1
  - @ledgerhq/domain-service@1.8.14
  - @ledgerhq/live-countervalues@0.24.2
  - @ledgerhq/live-countervalues-react@0.16.6
  - @ledgerhq/hw-transport-vault@1.7.8
  - @ledgerhq/device-intent@5.0.0
  - @domain/api-pay-card@0.2.1
  - @features/flow-analytics-consent@0.2.1

## 4.16.0-next.0

### Minor Changes

- [#20278](https://github.com/LedgerHQ/ledger-live/pull/20278) [`3d24a89`](https://github.com/LedgerHQ/ledger-live/commit/3d24a898d59de55364ec29de29eaecb7ca14425d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop the `@ledgerhq/errors` dependency, completing the errors sunset (LIVE-32915).

  The `@ledgerhq/errors` package is removed from the monorepo: no workspace source imported it anymore, every error class it held now lives in the package that owns it (`@ledgerhq/ledger-wallet-framework/errors` for the ones shared across coin modules). `createCustomErrorClass` and the `serializeError` / `deserializeError` stack are gone with it — define errors as native classes and branch on `error.name`.

  `@ledgerhq/errors@6.37.0` stays on npm for external consumers, but is no longer published from this repo.

- [#20280](https://github.com/LedgerHQ/ledger-live/pull/20280) [`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Stop depending on `@ledgerhq/errors` (LIVE-32915).

  No workspace package declares it anymore, and none may again: `enforce-boundaries` now fails CI on any manifest that does. The classes it held live in the package that owns them, with `@ledgerhq/ledger-wallet-framework/errors` as the shared home below the coin layer.

  The package itself stays in the repo so it keeps being published for external consumers, and is bridged to the external coin packages that still peer-depend on it via `pnpm.packageExtensions` using `workspace:*` (which reuses the single in-repo copy, so the dependency graph keeps exactly the physical copies it had before). [LedgerHQ/coin-modules#752](https://github.com/LedgerHQ/coin-modules/pull/752) removes that peerDependency upstream; once it is released the bridge can be dropped, but the package still needs publishing.

- [#20315](https://github.com/LedgerHQ/ledger-live/pull/20315) [`4b73f81`](https://github.com/LedgerHQ/ledger-live/commit/4b73f81aca25a92178850b3f7ac7519a7efcac67) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Portfolio upsell banner and Braze content cards can now coexist on Portfolio (Mobile: shared carousel; Desktop: side-by-side grid when Braze placement is enabled, otherwise upsell stacked above the Braze carousel).

- [#20624](https://github.com/LedgerHQ/ledger-live/pull/20624) [`e74a4a3`](https://github.com/LedgerHQ/ledger-live/commit/e74a4a391dd1540c9d09f3e9e86d250422a0df65) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Retarget desktop off the dada-client shims onto @features/platform-aggregated-assets and @domain/api-aggregated-assets

- [#20474](https://github.com/LedgerHQ/ledger-live/pull/20474) [`e73390c`](https://github.com/LedgerHQ/ledger-live/commit/e73390cfa30d2d7ec7a9644875063c77b42f0713) Thanks [@deepyjr](https://github.com/deepyjr)! - Replace the Desktop address name clear action with a help tooltip.

- [#20404](https://github.com/LedgerHQ/ledger-live/pull/20404) [`0f89b44`](https://github.com/LedgerHQ/ledger-live/commit/0f89b44de874d3921ff93b323c7db0f00d22cac6) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Replace the legacy Pay Card placeholders with the shared authentication flow on desktop and mobile

- [#20266](https://github.com/LedgerHQ/ledger-live/pull/20266) [`626c858`](https://github.com/LedgerHQ/ledger-live/commit/626c858672c15198f2315e260f6e033951782c74) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Upgrade analytics consent QA debug screen to scenario parity

- [#20585](https://github.com/LedgerHQ/ledger-live/pull/20585) [`feaf2fc`](https://github.com/LedgerHQ/ledger-live/commit/feaf2fcb8b3d71ab731e0ee52243e8d2a87d5604) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Require signer confirmation before opening address delete confirmation in Contacts.

- [#20423](https://github.com/LedgerHQ/ledger-live/pull/20423) [`44694e5`](https://github.com/LedgerHQ/ledger-live/commit/44694e54fa5b48e47595840638aee94a98213a37) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Complete the WalletSync DDD extraction: apps now compose the DDD slices directly

  `@ledgerhq/live-wallet` no longer owns sync infrastructure. `src/cloudsync/`, `src/walletsync/`,
  `src/accountName.ts` and `src/store.ts` are removed in favour of `@shared/cloud-sync`,
  `@shared/wallet-sync`, `@features/platform-wallet-sync`, `@domain/entity-account-name` and
  `@domain/entity-recent-addresses`. What remains is the account list sync module (`src/accounts/`)
  plus `src/walletSyncComposition.ts`, which assembles the sync modules into the wallet-sync schema.

  Desktop and mobile replace the monolithic `wallet` reducer with a `combineReducers` of the entity
  slices (`accountNames`, `starredAccountIds`, `walletSync`, `recentAddresses`, `nonImportedAccountInfos`)
  and wire the watch loop and trustchain lifecycle from `@features/platform-wallet-sync` at bootstrap.
  `@ledgerhq/live-common` drops its `@ledgerhq/live-wallet` runtime dependency: the wallet-api,
  platform and CSV-export helpers now take an `AccountNamesState` instead of the whole `WalletState`.

- [#19169](https://github.com/LedgerHQ/ledger-live/pull/19169) [`d989af2`](https://github.com/LedgerHQ/ledger-live/commit/d989af214ff55318633fe8756f64bd60e3e4c100) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Add desktop Device Intent Executor context initializer.

- [#20520](https://github.com/LedgerHQ/ledger-live/pull/20520) [`0db9cd3`](https://github.com/LedgerHQ/ledger-live/commit/0db9cd33eeb0175e126046f3113f0bd769155b25) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Add Device Intent Executor shell tracking (lifecycle, errors, dialog dismiss).

- [#20608](https://github.com/LedgerHQ/ledger-live/pull/20608) [`4033c32`](https://github.com/LedgerHQ/ledger-live/commit/4033c32ae5ec08e4af5bdd08aeab0e395e558969) Thanks [@vladyslavchupovskiy-ext-art](https://github.com/vladyslavchupovskiy-ext-art)! - Add `deriveShieldedAddress(ufvk)` to derive the Orchard unified address host-side from a UFVK without requiring a device connection. Persists `shieldedAddress` in `ZcashPrivateInfo` with backward-compatible serialisation (null fallback for legacy accounts).

- [#20595](https://github.com/LedgerHQ/ledger-live/pull/20595) [`43bf6d8`](https://github.com/LedgerHQ/ledger-live/commit/43bf6d8f6600f70b7c2a85615660e7e150e798bf) Thanks [@ysitbon](https://github.com/ysitbon)! - Make every new-architecture barrel a pure regrouping point, and enforce it.

  An `index.*` under `shared/`, `domain/` or `features/` may now contain only `export * from "./x"`
  lines, plus an optional default re-export. Having to sort in the export
  (`export { a, b } from "./x"`) proved the target file mixed public and private code; an `index.*`
  holding actual code proved it more loudly. A new nx plugin infers a `lint:structure` target on each
  of the 49 packages and fails on both, along with two related rules: a barrel may not re-export a
  private `internals` location, and it may not re-export another workspace package.

  That last rule removes the proxies. A package that re-exported a neighbour gave the same symbol two
  import paths and hid who actually provided it. Consumers now import the original provider and
  declare the dependency, which is why the two apps gain `@features/flow-contacts-add-contact` and the
  desktop app gains `@features/platform-contacts`.

  Renamed or relocated, with the import specifier unchanged for consumers in every case except where
  noted:

  - `@domain/entity-account-name` no longer exports the `setAccountNames` alias; use
    `bulkSetAccountNames`, the name the slice actually defines.
  - `@shared/cloud-sync` exports `getCloudSyncApi` as a named export from its api module instead of
    re-exporting a default under a different name.

  Five packages are left untouched behind temporary exclusions, each recording how to remove it:

  - `@shared/env`, the facade over the legacy `@ledgerhq/live-env`, which carries the wrapping in its
    barrel.
  - the `@ledgerhq/engagement` and `@ledgerhq/ptx` packages (`flow-analytics-consent`,
    `flow-large-screen-upsell`, `flow-lazy-onboarding-banner`, `flow-pay-card-auth`), so each owning
    team lands the change on its own schedule. Conformant barrels were prepared and verified for them
    before being reverted, so the work is deferred rather than open.

- [#20627](https://github.com/LedgerHQ/ledger-live/pull/20627) [`7af726b`](https://github.com/LedgerHQ/ledger-live/commit/7af726b50eb7c8a2712bf734aac5618be61911ef) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Explain the higher network fees when sending to an address that does not exist yet. EIP-8037 charges account creation substantially more gas, and nothing in the send flow told the user why the fee jumped. The gas we send is unchanged: `eth_estimateGas` remains the only source.

- [#20646](https://github.com/LedgerHQ/ledger-live/pull/20646) [`fd7152a`](https://github.com/LedgerHQ/ledger-live/commit/fd7152a28ca7b11bf21edba822d8b4ede6e68d7c) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwd): add recipient contact card to the send flow

- [#20439](https://github.com/LedgerHQ/ledger-live/pull/20439) [`65beee5`](https://github.com/LedgerHQ/ledger-live/commit/65beee51d8d203b8d3d0a850546f6866d3cebb2f) Thanks [@deepyjr](https://github.com/deepyjr)! - Fix the Contacts currency selection list so it fills the modal height.

- [#20454](https://github.com/LedgerHQ/ledger-live/pull/20454) [`e1b63ff`](https://github.com/LedgerHQ/ledger-live/commit/e1b63ff4acf13bbb30ddbd7e95627797b5462147) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwd): bip21 and eip681 scan for lwd

- [#20455](https://github.com/LedgerHQ/ledger-live/pull/20455) [`f77b3fa`](https://github.com/LedgerHQ/ledger-live/commit/f77b3fa8954e93a00acdbd3e52210561028fd6b8) Thanks [@deepyjr](https://github.com/deepyjr)! - Add invalid and sanctioned address feedback to the Desktop Contacts flow.

- [#20641](https://github.com/LedgerHQ/ledger-live/pull/20641) [`1dde844`](https://github.com/LedgerHQ/ledger-live/commit/1dde844ac3bbd94659076016e69d3e38ed79ebe0) Thanks [@semeano](https://github.com/semeano)! - Add a warning on Zcash accounts that the private balance excludes Sapling and Orchard shielded funds.

- [#20216](https://github.com/LedgerHQ/ledger-live/pull/20216) [`593231c`](https://github.com/LedgerHQ/ledger-live/commit/593231c81f7f9cdf59b28aa8f88fe7b96752d758) Thanks [@semeano](https://github.com/semeano)! - Restrict the Zcash balance, operations and shielded send flow to the Ironwood pool only.

- [#20207](https://github.com/LedgerHQ/ledger-live/pull/20207) [`aee0e64`](https://github.com/LedgerHQ/ledger-live/commit/aee0e64b491aafc1ca8fea16b1ef124cb183770b) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Add Internet Computer (ICP) neuron staking to the coin module: create and top up neurons, start/stop dissolving, disburse, set/increase dissolve delay, follow, split, spawn, stake maturity, and add/remove hot keys, plus neuron listing. Governance operations are routed through the NNS governance canister via the device's update-call signing, alongside the existing ledger transfer path, and account synchronization now carries neuron data. Adds the `STAKE_NEURON` and `TOP_UP_NEURON` operation types, with matching icons and labels in the desktop and mobile operation history. (LIVE-28469)

- [#20456](https://github.com/LedgerHQ/ledger-live/pull/20456) [`a0f13a2`](https://github.com/LedgerHQ/ledger-live/commit/a0f13a2b5410acc1e03231a94a5af9d77b6dabf6) Thanks [@sarneijim](https://github.com/sarneijim)! - Use fixed legacy onboarding date for backfill instead of app-open date

- [#20458](https://github.com/LedgerHQ/ledger-live/pull/20458) [`9876163`](https://github.com/LedgerHQ/ledger-live/commit/9876163c9686f72fead2004a6388764536c29cfd) Thanks [@sarneijim](https://github.com/sarneijim)! - Use legacy onboarding date fallback in large-screen upsell eligibility

- [#19169](https://github.com/LedgerHQ/ledger-live/pull/19169) [`92b70ef`](https://github.com/LedgerHQ/ledger-live/commit/92b70ef6318741216740d7341f37627c32a3f0d6) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Preserve installed apps in Device Intent Executor last seen device info.

- [#20408](https://github.com/LedgerHQ/ledger-live/pull/20408) [`e9a14f8`](https://github.com/LedgerHQ/ledger-live/commit/e9a14f886532f3ee00dc7f28727c762ec75fc9b3) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Wire send, edit, and delete actions on desktop contact address detail.

- [#20557](https://github.com/LedgerHQ/ledger-live/pull/20557) [`3e0ae80`](https://github.com/LedgerHQ/ledger-live/commit/3e0ae805b065eaa3d5fd3c1ab35c0d7f8e2a170f) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Render Desktop Contacts address edit signer mismatch error from shared flow state.

- [#20539](https://github.com/LedgerHQ/ledger-live/pull/20539) [`60b4626`](https://github.com/LedgerHQ/ledger-live/commit/60b462653bad19429c46ebef439ec2b5bb234140) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Scope `@ledgerhq/live-wallet` down to wallet sync only

  The package now exposes `./accounts` and `./walletSyncComposition` and nothing else.
  `ordering.ts` and `addAccounts.ts` move to `@ledgerhq/live-common/account/*`, and
  `accountRawToAccountUserData` joins `live-common/account/serialization` next to `fromAccountRaw`.
  The `liveqr/` folder is gone: `importAccounts.ts` and `accountToAccountData` were unreachable, and
  `accountDataToAccount` — whose only callers rehydrated a wallet-sync descriptor — becomes
  `accounts/descriptorToAccount`. `live-common` no longer depends on `live-wallet`.

- [#20510](https://github.com/LedgerHQ/ledger-live/pull/20510) [`a1bd49e`](https://github.com/LedgerHQ/ledger-live/commit/a1bd49ec9190a395730b3348fef5c0987e4eaeb7) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Model Me as the default self contact with shared display-name formatting, external address counts, and a Ledger Wallet accounts intent.

- [#20643](https://github.com/LedgerHQ/ledger-live/pull/20643) [`bef9477`](https://github.com/LedgerHQ/ledger-live/commit/bef9477286ba11c0e7eed7af34c1ec7c95204cc9) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(send): validate custom fees against native balance for evm tokens

- [#18764](https://github.com/LedgerHQ/ledger-live/pull/18764) [`d266e13`](https://github.com/LedgerHQ/ledger-live/commit/d266e13aa8e8b34ca74beaa09687b6e8d426f821) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Migrate the swap `fetchQuotes` helper from axios to an RTK Query endpoint (`swapQuotesApi`). The aggregator `/quote` request now flows through the Redux data layer, and the rawQuotes/providerErrors split is unchanged. Desktop and mobile register the new API and inject their store dispatch at startup via `setSwapQuotesStore`; wallet-cli, which has no app store, sets up a standalone one.

  The endpoint itself now lives in the new `@domain/api-swap-quotes` package; live-common re-exports it, so existing call sites are unchanged.

  Two behaviour changes to be aware of:

  - `/quote` now goes through the authenticated base query, where the legacy axios call sent no credentials. Both apps already register an auth provider on their store's `extra`, so whether a request carries an `Authorization` header is controlled entirely by the `lwdAuth`/`lwmAuth` feature flags. They are disabled by default; enabling either one makes `/quote` send the user's bearer token to the aggregator, and makes a 401/403 trigger the adapter's refresh-and-retry.
  - An aggregator HTTP error (4xx/5xx) now resolves to an empty result, so the caller surfaces the `noQuotes` global. Previously the shared axios error interceptor turned these into `LedgerAPI4xx`/`LedgerAPI5xx`, which propagated to the live app as an error. Only transport failures (no HTTP response) still reject, now with a `SwapQuotesRequestFailed` error rather than a bare RTK Query error object.

- [#20638](https://github.com/LedgerHQ/ledger-live/pull/20638) [`120d4eb`](https://github.com/LedgerHQ/ledger-live/commit/120d4eb87fbfe438e56c735e8d34bf6f2a94139c) Thanks [@sarneijim](https://github.com/sarneijim)! - Use full-width LNS upsell MediaBanner in notification center

- [#20642](https://github.com/LedgerHQ/ledger-live/pull/20642) [`a61f702`](https://github.com/LedgerHQ/ledger-live/commit/a61f702a6e41f2bf84d5602930e261a708507efa) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Persist the pay card hero balance filter across app restarts

- [#20551](https://github.com/LedgerHQ/ledger-live/pull/20551) [`488217f`](https://github.com/LedgerHQ/ledger-live/commit/488217fe52d77761bc18b5f0d1a4c9908e6883cd) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Persist the payCard slice on desktop: save and restore only { hasSeenFeatureTour } so the Pay feature tour does not reappear after restarting the app

- [#20628](https://github.com/LedgerHQ/ledger-live/pull/20628) [`8259d4d`](https://github.com/LedgerHQ/ledger-live/commit/8259d4d1617e640e04441644947332936d9fbe81) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwdm): add matched contact lookup for the send recipient flow

- [#20518](https://github.com/LedgerHQ/ledger-live/pull/20518) [`ce46179`](https://github.com/LedgerHQ/ledger-live/commit/ce461796d908185e5ea36b630ba71ff9ef8118b8) Thanks [@dilaouid](https://github.com/dilaouid)! - chore(lwdm): refactoring mvvm recipient screen

- [#20430](https://github.com/LedgerHQ/ledger-live/pull/20430) [`647804e`](https://github.com/LedgerHQ/ledger-live/commit/647804ee755d54776e6b8cd96328bee89fb035e4) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Move the recent-addresses domain model and in-memory store into `@domain/entity-recent-addresses`

  `RecentAddress` and `RecentAddressesState` are no longer declared in `@ledgerhq/types-live`; they are now inferred from the Zod schemas in `@domain/entity-recent-addresses`, which also owns `RecentAddressesStore`, `setupRecentAddressesStore` and `getRecentAddressesStore`. Import them from `@domain/entity-recent-addresses`.

  `@ledgerhq/live-common/account/index` still re-exports the store API unchanged, minus the `RecentAddressesCache` alias — use `RecentAddressesState` instead.

  Also fixes the store mutating its own state in place: once a first mutation had been dispatched, immer had frozen that exact object graph, so the next `addAddress` or `removeAddress` on the same currency threw `TypeError: Cannot assign to read only property`. The store now replaces its state instead of mutating it.

- [#20473](https://github.com/LedgerHQ/ledger-live/pull/20473) [`73948c9`](https://github.com/LedgerHQ/ledger-live/commit/73948c9cfdecd63eee106a9ed9dae1495a1198bd) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(lwdm): fix sanctionned ens address check

- [#20111](https://github.com/LedgerHQ/ledger-live/pull/20111) [`aa3ea09`](https://github.com/LedgerHQ/ledger-live/commit/aa3ea0972205b589d2f92e352ac7154d11f872bc) Thanks [@YazhuEth](https://github.com/YazhuEth)! - chore(coin-solana): remove preload and hydrate - fetch validators on demand

  `CurrencyBridge.preload` / `hydrate` are deprecated, and preloading the validators.app
  list slowed down the scan account flow. Validators are now fetched lazily behind a 15min
  LRU cache (`@ledgerhq/coin-solana/validators`) the first time a screen needs them.

  `useSolanaPreloadData` is removed from `@ledgerhq/live-common/families/solana/react`; use
  `useValidators` instead. `getAccountBannerState` now takes the validators as a third argument.

- [#20371](https://github.com/LedgerHQ/ledger-live/pull/20371) [`0f42c42`](https://github.com/LedgerHQ/ledger-live/commit/0f42c42e9d83aee52414f2e962805480629802f2) Thanks [@deepyjr](https://github.com/deepyjr)! - Add mocked confirmation and saved address rendering to Desktop Contacts.

- [#20333](https://github.com/LedgerHQ/ledger-live/pull/20333) [`4ef4615`](https://github.com/LedgerHQ/ledger-live/commit/4ef461568534f55a5d3242122ffb2d41fefc05ad) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Inline large-screen upsell modal entity state into the flow package

- [#20471](https://github.com/LedgerHQ/ledger-live/pull/20471) [`3aefd3b`](https://github.com/LedgerHQ/ledger-live/commit/3aefd3b23301f693bb5c8b8533c796a9d8fdefe7) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(lwdm): check sanctions for token recipient addresses

- [#20622](https://github.com/LedgerHQ/ledger-live/pull/20622) [`ed79527`](https://github.com/LedgerHQ/ledger-live/commit/ed79527dd83bb950dd6701d1677d6703cec6051c) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - Rename Hedera's `HederaValidator.nodeId` to `id` (string), matching the framework's `Validator.id` and removing the duplicate identity field. Preload caches persisted by earlier versions are migrated on hydration, so upgrading users keep their cached validators. On-chain protocol fields (`Transaction.stakingNodeId`, `HederaDelegation.nodeId`) are unchanged.

- [#20508](https://github.com/LedgerHQ/ledger-live/pull/20508) [`e7c941f`](https://github.com/LedgerHQ/ledger-live/commit/e7c941fbac63f03938fa43f25523e3a6cb33c158) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Extract ghost-click guard logic to shared utility in EditName dialog

- [#20637](https://github.com/LedgerHQ/ledger-live/pull/20637) [`f440c85`](https://github.com/LedgerHQ/ledger-live/commit/f440c85eeb1669f3660ddbff18ae7892bb9f5923) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Retarget the remaining libs consumers and both store roots off the dada-client shims

- [#20597](https://github.com/LedgerHQ/ledger-live/pull/20597) [`8c97aa1`](https://github.com/LedgerHQ/ledger-live/commit/8c97aa11f96af73f13df2416bd603f6cd0f12a30) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Track Device Intent Executor Connect App states on desktop.

- [#20552](https://github.com/LedgerHQ/ledger-live/pull/20552) [`e499f00`](https://github.com/LedgerHQ/ledger-live/commit/e499f0057dded9b25dfed8ce5ec6f58312906537) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Add Device Intent Executor Connect Device tracking.

### Patch Changes

- Updated dependencies [[`3d24a89`](https://github.com/LedgerHQ/ledger-live/commit/3d24a898d59de55364ec29de29eaecb7ca14425d), [`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add), [`8559d54`](https://github.com/LedgerHQ/ledger-live/commit/8559d54293b7854ea2dc900625bdb746720a4a85), [`f080e51`](https://github.com/LedgerHQ/ledger-live/commit/f080e51c682c2ac1239c0417e29b32b79d363eb9), [`9b3fb2a`](https://github.com/LedgerHQ/ledger-live/commit/9b3fb2a98eaa530c12e55eb3391f58a306c80d8f), [`e73390c`](https://github.com/LedgerHQ/ledger-live/commit/e73390cfa30d2d7ec7a9644875063c77b42f0713), [`6f6afe2`](https://github.com/LedgerHQ/ledger-live/commit/6f6afe2b6203b5c46cbe450b254be493689c0cad), [`1de30a9`](https://github.com/LedgerHQ/ledger-live/commit/1de30a98a7a3db27f42de0c9608e1d0be748a10e), [`0f89b44`](https://github.com/LedgerHQ/ledger-live/commit/0f89b44de874d3921ff93b323c7db0f00d22cac6), [`6258380`](https://github.com/LedgerHQ/ledger-live/commit/62583805c47b3af4724f6cf693f209c7744228bc), [`f1e93f7`](https://github.com/LedgerHQ/ledger-live/commit/f1e93f79bedea0b6a2c140271769c37cf4e02407), [`02c6f9e`](https://github.com/LedgerHQ/ledger-live/commit/02c6f9e46152894aa97648f50a52efaad38aa86c), [`c4a8141`](https://github.com/LedgerHQ/ledger-live/commit/c4a8141369e63e875fb5bfc9aef3f53362150338), [`feaf2fc`](https://github.com/LedgerHQ/ledger-live/commit/feaf2fcb8b3d71ab731e0ee52243e8d2a87d5604), [`9ef4440`](https://github.com/LedgerHQ/ledger-live/commit/9ef44402ece2207268361bfe4e2af8fbd1396670), [`5297c79`](https://github.com/LedgerHQ/ledger-live/commit/5297c79823362f5e7584886c8193808988ec46fc), [`cc8b5b9`](https://github.com/LedgerHQ/ledger-live/commit/cc8b5b9af4a2ec488b6912d3fcb08bcc8f4b72c3), [`44694e5`](https://github.com/LedgerHQ/ledger-live/commit/44694e54fa5b48e47595840638aee94a98213a37), [`4033c32`](https://github.com/LedgerHQ/ledger-live/commit/4033c32ae5ec08e4af5bdd08aeab0e395e558969), [`43bf6d8`](https://github.com/LedgerHQ/ledger-live/commit/43bf6d8f6600f70b7c2a85615660e7e150e798bf), [`fd3e81e`](https://github.com/LedgerHQ/ledger-live/commit/fd3e81e80eb5400e739e40e3ed360f40139d2aa4), [`7af726b`](https://github.com/LedgerHQ/ledger-live/commit/7af726b50eb7c8a2712bf734aac5618be61911ef), [`e5ec77b`](https://github.com/LedgerHQ/ledger-live/commit/e5ec77bf92a89c5f9a36a2e5901729e20682ead0), [`fd7152a`](https://github.com/LedgerHQ/ledger-live/commit/fd7152a28ca7b11bf21edba822d8b4ede6e68d7c), [`2ec3de4`](https://github.com/LedgerHQ/ledger-live/commit/2ec3de4f864bc7bccf02f42b04356bb563f9ed91), [`4d27e41`](https://github.com/LedgerHQ/ledger-live/commit/4d27e41c217cfae16526357a1a78db15c6980950), [`2f297f7`](https://github.com/LedgerHQ/ledger-live/commit/2f297f74dcda8113f86196ecd9c61e327f7981e9), [`f77b3fa`](https://github.com/LedgerHQ/ledger-live/commit/f77b3fa8954e93a00acdbd3e52210561028fd6b8), [`d614891`](https://github.com/LedgerHQ/ledger-live/commit/d614891593fe2ce794bd1e6dea8bfb69e89c775b), [`593231c`](https://github.com/LedgerHQ/ledger-live/commit/593231c81f7f9cdf59b28aa8f88fe7b96752d758), [`9e1412e`](https://github.com/LedgerHQ/ledger-live/commit/9e1412e08ccccd4af4a7078a797332ea92f86c63), [`aee0e64`](https://github.com/LedgerHQ/ledger-live/commit/aee0e64b491aafc1ca8fea16b1ef124cb183770b), [`9708010`](https://github.com/LedgerHQ/ledger-live/commit/970801044529fe978ccbb8c562cc64c00277d1de), [`a0f13a2`](https://github.com/LedgerHQ/ledger-live/commit/a0f13a2b5410acc1e03231a94a5af9d77b6dabf6), [`9876163`](https://github.com/LedgerHQ/ledger-live/commit/9876163c9686f72fead2004a6388764536c29cfd), [`92b70ef`](https://github.com/LedgerHQ/ledger-live/commit/92b70ef6318741216740d7341f37627c32a3f0d6), [`5bdffd5`](https://github.com/LedgerHQ/ledger-live/commit/5bdffd5b9590cc65e650fb0d5b28a5fbf2477d00), [`e9a14f8`](https://github.com/LedgerHQ/ledger-live/commit/e9a14f886532f3ee00dc7f28727c762ec75fc9b3), [`91a2953`](https://github.com/LedgerHQ/ledger-live/commit/91a29531167176557194d9adbc6b55ff11363b8d), [`3e0ae80`](https://github.com/LedgerHQ/ledger-live/commit/3e0ae805b065eaa3d5fd3c1ab35c0d7f8e2a170f), [`c904346`](https://github.com/LedgerHQ/ledger-live/commit/c9043466032fab4f9c2ae02d4bd52970ad8fbcfe), [`60b4626`](https://github.com/LedgerHQ/ledger-live/commit/60b462653bad19429c46ebef439ec2b5bb234140), [`28046d3`](https://github.com/LedgerHQ/ledger-live/commit/28046d31707d0290b56522c14b51623860b7a3f8), [`64bb8cf`](https://github.com/LedgerHQ/ledger-live/commit/64bb8cfa5bffde5a1e2c24615f1dd11b864094d2), [`a1bd49e`](https://github.com/LedgerHQ/ledger-live/commit/a1bd49ec9190a395730b3348fef5c0987e4eaeb7), [`bef9477`](https://github.com/LedgerHQ/ledger-live/commit/bef9477286ba11c0e7eed7af34c1ec7c95204cc9), [`d266e13`](https://github.com/LedgerHQ/ledger-live/commit/d266e13aa8e8b34ca74beaa09687b6e8d426f821), [`e1e005d`](https://github.com/LedgerHQ/ledger-live/commit/e1e005daff0d3e01ef397ac752cbc711245539a7), [`1e9db75`](https://github.com/LedgerHQ/ledger-live/commit/1e9db750a4882f9db7f95278e33c00262487b37b), [`7d5cd98`](https://github.com/LedgerHQ/ledger-live/commit/7d5cd9812a7827b3f1b926166a4a3fde20c7b59c), [`cc9d58f`](https://github.com/LedgerHQ/ledger-live/commit/cc9d58f08ae38197ea2bd19115eda870d348f6aa), [`6be80d8`](https://github.com/LedgerHQ/ledger-live/commit/6be80d873a958544f4152348337aae8a0c0c2815), [`0e439a0`](https://github.com/LedgerHQ/ledger-live/commit/0e439a0b73f1ad49aab32e98dfaf4fbd1d0ded04), [`a61f702`](https://github.com/LedgerHQ/ledger-live/commit/a61f702a6e41f2bf84d5602930e261a708507efa), [`40efdfb`](https://github.com/LedgerHQ/ledger-live/commit/40efdfbb42cdc94b8efb59a9aa45992ff7c64653), [`2edf614`](https://github.com/LedgerHQ/ledger-live/commit/2edf614eed7608714821ee54574d8c4d2b6f7d98), [`9e45705`](https://github.com/LedgerHQ/ledger-live/commit/9e45705b649513c3f9797c2add485a0ba3ea7a6c), [`baba728`](https://github.com/LedgerHQ/ledger-live/commit/baba7280d4495fd1c6a80d18cb50412a21ec9a76), [`09c77c1`](https://github.com/LedgerHQ/ledger-live/commit/09c77c1814ddaad1265df5d52f4f6a336bc78ff1), [`8259d4d`](https://github.com/LedgerHQ/ledger-live/commit/8259d4d1617e640e04441644947332936d9fbe81), [`ac57e97`](https://github.com/LedgerHQ/ledger-live/commit/ac57e970074572eb99e989c8f5a1a6bd227c922b), [`6694d77`](https://github.com/LedgerHQ/ledger-live/commit/6694d77f1fc4a691e2d97a2d44e8bf9513cecb1e), [`bbfc8cf`](https://github.com/LedgerHQ/ledger-live/commit/bbfc8cf7929d9bffc1aa1b9a5e3b9593e3016436), [`647804e`](https://github.com/LedgerHQ/ledger-live/commit/647804ee755d54776e6b8cd96328bee89fb035e4), [`6d45e7c`](https://github.com/LedgerHQ/ledger-live/commit/6d45e7c4245be9acaf2f3a86f48d38e5677d8e96), [`79d2278`](https://github.com/LedgerHQ/ledger-live/commit/79d22789896f55d9a7196392632b08488997d937), [`5edd732`](https://github.com/LedgerHQ/ledger-live/commit/5edd732aa9fd1769667a349b513ebdb985a1475c), [`8a3a0bb`](https://github.com/LedgerHQ/ledger-live/commit/8a3a0bbd8361706daac364d4c89894f56431fc57), [`71b1069`](https://github.com/LedgerHQ/ledger-live/commit/71b1069ae8358b4d3fa3a6a5d4fb2d49f1c1c7d7), [`ccbda89`](https://github.com/LedgerHQ/ledger-live/commit/ccbda895d0672222becbe50df61fcf7646618448), [`9ea6eed`](https://github.com/LedgerHQ/ledger-live/commit/9ea6eedc129c4d496ec745a6affeddb136d3680f), [`da86f85`](https://github.com/LedgerHQ/ledger-live/commit/da86f85f2bb1cc94c413a94796e6735ba83eee52), [`aa3ea09`](https://github.com/LedgerHQ/ledger-live/commit/aa3ea0972205b589d2f92e352ac7154d11f872bc), [`aaa67a7`](https://github.com/LedgerHQ/ledger-live/commit/aaa67a733e16cdfcb3f02b22038b0ae5518fb0ec), [`aac9b34`](https://github.com/LedgerHQ/ledger-live/commit/aac9b34feb7a898e16fc98758046c0c3bc9fcbcb), [`c9eab39`](https://github.com/LedgerHQ/ledger-live/commit/c9eab39bff1f46fc63c8717237390aa94fb78dec), [`4ef4615`](https://github.com/LedgerHQ/ledger-live/commit/4ef461568534f55a5d3242122ffb2d41fefc05ad), [`ed79527`](https://github.com/LedgerHQ/ledger-live/commit/ed79527dd83bb950dd6701d1677d6703cec6051c), [`bdd82c4`](https://github.com/LedgerHQ/ledger-live/commit/bdd82c435d01d56397fe0967e92825f0442bf487), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152), [`78ebc73`](https://github.com/LedgerHQ/ledger-live/commit/78ebc736177e9e751f4d7a7a6a3fae97a1913c1f), [`f440c85`](https://github.com/LedgerHQ/ledger-live/commit/f440c85eeb1669f3660ddbff18ae7892bb9f5923), [`b0e81d2`](https://github.com/LedgerHQ/ledger-live/commit/b0e81d2edc7c40e2c81236ea372370859d05d0bc), [`fb1ba1b`](https://github.com/LedgerHQ/ledger-live/commit/fb1ba1b97d0e50d8780e678073d12faaab290722), [`135223e`](https://github.com/LedgerHQ/ledger-live/commit/135223e49d4d927183cf893f563ed583e18f3346), [`4c9af42`](https://github.com/LedgerHQ/ledger-live/commit/4c9af429730f79e04d0f220f03b58565a5660e30), [`b9d4a22`](https://github.com/LedgerHQ/ledger-live/commit/b9d4a2209b5fff587c67ea8868bcf553fcc4ecbd), [`79789ba`](https://github.com/LedgerHQ/ledger-live/commit/79789ba23f1105c033574ae8f8c552a3a757d74c), [`5171877`](https://github.com/LedgerHQ/ledger-live/commit/5171877faeb78ab9efbbf8c20b9fa6697e61872f), [`e664d84`](https://github.com/LedgerHQ/ledger-live/commit/e664d84bc45a0bde9f4794c96d43e8a7eebb83b9)]:
  - @ledgerhq/coin-bitcoin@0.51.0-next.0
  - @ledgerhq/coin-canton@0.33.0-next.0
  - @ledgerhq/coin-cardano@0.34.0-next.0
  - @ledgerhq/coin-casper@2.19.0-next.0
  - @ledgerhq/coin-concordium@0.20.0-next.0
  - @ledgerhq/coin-cosmos@0.43.0-next.0
  - @ledgerhq/coin-evm@4.10.0-next.0
  - @ledgerhq/coin-filecoin@1.32.0-next.0
  - @ledgerhq/live-common@37.2.0-next.0
  - @features/flow-contacts@0.6.0-next.0
  - @features/platform-contacts@0.2.0-next.0
  - @features/flow-contacts-add-contact@0.2.0-next.0
  - @features/flow-pay-card-auth@0.2.0-next.0
  - @domain/entity-contact@0.6.0-next.0
  - @ledgerhq/ledger-key-ring-protocol@0.19.0-next.0
  - @shared/cloud-sync@0.1.0-next.0
  - @domain/entity-currency-crypto@0.10.0-next.0
  - @domain/entity-currency-token@0.4.0-next.0
  - @domain/entity-currency-fiat@0.4.0-next.0
  - @ledgerhq/live-wallet@1.0.0-next.0
  - @domain/entity-wallet-sync@0.1.0-next.0
  - @ledgerhq/coin-zcash@0.3.0-next.0
  - @domain/api-currency-fiat@0.4.0-next.0
  - @domain/api-currency-token@0.4.0-next.0
  - @domain/entity-account-name@0.2.0-next.0
  - @domain/entity-client-identity@0.2.0-next.0
  - @domain/entity-currency@0.4.0-next.0
  - @features/flow-fear-and-greed@0.3.0-next.0
  - @features/platform-aggregated-assets@0.3.0-next.0
  - @features/platform-currencies@0.6.0-next.0
  - @features/platform-env@0.2.0-next.0
  - @features/platform-style@0.2.0-next.0
  - @shared/api-services@0.3.0-next.0
  - @shared/auth@0.4.0-next.0
  - @shared/feature-flags@0.18.0-next.0
  - @ledgerhq/types-live@6.119.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.8.0-next.0
  - @features/flow-large-screen-upsell@0.5.0-next.0
  - @domain/api-aggregated-assets@0.3.0-next.0
  - @domain/entity-interest-rate@0.3.0-next.0
  - @ledgerhq/hw-transport-http@6.37.0-next.0
  - @ledgerhq/types-devices@6.32.0-next.0
  - @domain/entity-pay-card@0.3.0-next.0
  - @devtools/bindings@0.3.0-next.0
  - @devtools/transport-panel@0.4.0-next.0
  - @devtools/shell@0.8.0-next.0
  - @ledgerhq/live-dmk-shared@0.30.0-next.0
  - @ledgerhq/asset-detail@0.11.0-next.0
  - @ledgerhq/asset-aggregation@0.13.0-next.0
  - @ledgerhq/live-dmk-desktop@0.20.6-next.0
  - @features/platform-wallet-sync@0.1.1-next.0
  - @ledgerhq/live-currency-format@0.14.1
  - @ledgerhq/wallet-analytics@0.3.3-next.0
  - @ledgerhq/wallet-btc@0.3.0
  - @ledgerhq/wallet-pnl@0.7.6-next.0
  - @domain/entity-analytics-consent@0.2.1-next.0
  - @domain/api-push-devices@0.2.1-next.0
  - @domain/api-altcoins-sentiment@0.3.1-next.0
  - @domain/api-market-sentiment@0.3.1-next.0
  - @domain/entity-recent-addresses@0.1.1-next.0
  - @features/platform-feature-flags@0.6.5-next.0
  - @devtools/wire@0.3.1-next.0
  - @ledgerhq/domain-service@1.8.14-next.0
  - @ledgerhq/live-countervalues@0.24.2-next.0
  - @ledgerhq/live-countervalues-react@0.16.6-next.0
  - @ledgerhq/hw-transport-vault@1.7.8-next.0
  - @ledgerhq/device-intent@5.0.0-next.0
  - @domain/api-pay-card@0.2.1-next.0
  - @features/flow-analytics-consent@0.2.1-next.0

## 4.15.0

### Minor Changes

- [#20280](https://github.com/LedgerHQ/ledger-live/pull/20280) [`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Stop depending on `@ledgerhq/errors` (LIVE-32915).

  No workspace package declares it anymore, and none may again: `enforce-boundaries` now fails CI on any manifest that does. The classes it held live in the package that owns them, with `@ledgerhq/ledger-wallet-framework/errors` as the shared home below the coin layer.

  The package itself stays in the repo so it keeps being published for external consumers, and is bridged to the external coin packages that still peer-depend on it via `pnpm.packageExtensions` using `workspace:*` (which reuses the single in-repo copy, so the dependency graph keeps exactly the physical copies it had before). [LedgerHQ/coin-modules#752](https://github.com/LedgerHQ/coin-modules/pull/752) removes that peerDependency upstream; once it is released the bridge can be dropped, but the package still needs publishing.

- [#20221](https://github.com/LedgerHQ/ledger-live/pull/20221) [`1689e58`](https://github.com/LedgerHQ/ledger-live/commit/1689e583c054bb8ad373bfe9f325b136fe0283bc) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Serve Zcash accounts with a standalone `@ledgerhq/coin-zcash` coin-module (LIVE-34556).

  The module owns all four transfer flows — t→t, t→z, z→t, z→z — and crafts, signs and broadcasts each one as a PCZT through the native `@ledgerhq/zcash-utils` engine, with no legacy PSBT path: it owns the transparent UTXO path itself via `@ledgerhq/wallet-btc` instead of delegating to the Bitcoin bridge. Shielded balances, notes and operations come from the sync engine, so a shielded account reports the balance and history the chain-adapter could only report for its transparent side.

  Which module serves a Zcash account is decided by the existing `zcashShielded` feature flag, mirrored into `live-common` (`src/bridge/zcashRouting.ts`) because a coin-module cannot read React feature flags. OFF (the default) keeps `@ledgerhq/coin-bitcoin`'s Zcash chain-adapter and its legacy transparent path, so nothing changes for users until the flag is turned on; the two implementations are kept accounting-equivalent by differential tests that run both bridges over the same fixtures.

  Desktop hosts the engine in a dedicated utility process, reached over a `zcash:`-prefixed IPC contract owned by the module.

  Two flows do not complete on a NU6.3 chain, where newly shielded value goes to the Ironwood pool: z→z has no builder, since it would need Orchard spends alongside an Ironwood output; and a flow that does build a V6 PCZT cannot be finalized until `@ledgerhq/zcash-utils` exposes a V6 finalizer.

- [#20061](https://github.com/LedgerHQ/ledger-live/pull/20061) [`40ba85b`](https://github.com/LedgerHQ/ledger-live/commit/40ba85b823ed657753ee607d4ab16d1d63b18c45) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Scrub wallet addresses and account IDs from Datadog RUM events

- [#20341](https://github.com/LedgerHQ/ledger-live/pull/20341) [`c016a95`](https://github.com/LedgerHQ/ledger-live/commit/c016a95538dfef2d7ddf1a17914d8cb3e55b644e) Thanks [@ysitbon](https://github.com/ysitbon)! - Split backend access from use case in the RTK Query layer

  `@shared/api-services` now holds one endpoint-less `createApi` per backend (CAL, CoinMarketCap,
  Countervalues, Push Devices), owning its base query, `extraArgument` contract and reducer path.
  `domain/api/*` packages add their endpoints with `injectEndpoints` and their own cache tags with
  `enhanceEndpoints`, so one reducer, middleware and cache now serve every use case on a backend — the two
  CoinMarketCap packages previously had one each. Apps register the service apis.

  `extraArgument` builder names are unchanged, so only import paths move. Reducer paths are renamed after
  their backend (`calApi`, `coinMarketCapApi`, `countervaluesApi`); no persisted data and no endpoint
  behaviour is affected.

- [#20318](https://github.com/LedgerHQ/ledger-live/pull/20318) [`e0d421b`](https://github.com/LedgerHQ/ledger-live/commit/e0d421b5e20323f4e4ea14ec1566f6e9ba0d0189) Thanks [@deepyjr](https://github.com/deepyjr)! - Block sanctioned addresses in the Contacts add-address flow

- [#20263](https://github.com/LedgerHQ/ledger-live/pull/20263) [`6976ff3`](https://github.com/LedgerHQ/ledger-live/commit/6976ff343fb8d999e30cf0963732adb56078e6e4) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Wire desktop analytics consent renewal to shared policyVersion major/minor decision flow

- [#19989](https://github.com/LedgerHQ/ledger-live/pull/19989) [`78d84d4`](https://github.com/LedgerHQ/ledger-live/commit/78d84d44bf18edc337d73554207e9df1002b0f36) Thanks [@deepyjr](https://github.com/deepyjr)! - Prevent Asset Detail history from stacking after Buy and Sell live app navigation

- [#20388](https://github.com/LedgerHQ/ledger-live/pull/20388) [`c0154aa`](https://github.com/LedgerHQ/ledger-live/commit/c0154aaa356e575f563717bea914800469e52c9f) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Fix mismatched Sync Onboarding header background against the page canvas

- [#20240](https://github.com/LedgerHQ/ledger-live/pull/20240) [`15e4608`](https://github.com/LedgerHQ/ledger-live/commit/15e4608db80de6909f96f795d8a888994510e07d) Thanks [@deepyjr](https://github.com/deepyjr)! - Forward Modular Asset Drawer network filters to DADA asset requests.

- [#20197](https://github.com/LedgerHQ/ledger-live/pull/20197) [`507e450`](https://github.com/LedgerHQ/ledger-live/commit/507e450759f95ed42d5ce7f452825b89dba1df7f) Thanks [@ysitbon](https://github.com/ysitbon)! - Drop boot fiat fetch and `InitialQueriesContext`: `supportedCounterValues` is now a derived selector backed by the `supportedFiats` slice. Mobile gains a read-time OFAC guard on `counterValueCurrencyLocalSelector`; desktop removes its boot-time `getSupportedFiats.initiate` dispatch. Both apps now lazy-load the CVS query from the two picker screens.

- [#20078](https://github.com/LedgerHQ/ledger-live/pull/20078) [`baea85e`](https://github.com/LedgerHQ/ledger-live/commit/baea85eab9ee1a0a2068f05176bdcb960a3c39af) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Fix Generic Awareness Modal cascade on mobile and add Braze content card logging on mobile and desktop

- [#20288](https://github.com/LedgerHQ/ledger-live/pull/20288) [`5d139b9`](https://github.com/LedgerHQ/ledger-live/commit/5d139b9f50bbfe2f8c7d6929ced877400047b9ed) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Fix typecheck errors in desktop test files

- [#20222](https://github.com/LedgerHQ/ledger-live/pull/20222) [`c6f620c`](https://github.com/LedgerHQ/ledger-live/commit/c6f620c3a0f7f944cb9de18ac129708dc69ec5a3) Thanks [@deepyjr](https://github.com/deepyjr)! - Model contact address labels with asset defaults and per-contact uniqueness

- [#20243](https://github.com/LedgerHQ/ledger-live/pull/20243) [`63aa4b6`](https://github.com/LedgerHQ/ledger-live/commit/63aa4b638ff662a53a4a7f41e1bade6e026a208b) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove legacy translation keys orphaned by the Wallet 4.0 Q1 cleanup (sidebar/topbar rewrite, legacy dashboard & empty states, Help modal, receive step-options and the sync activity indicator).

- [#20317](https://github.com/LedgerHQ/ledger-live/pull/20317) [`70c33a8`](https://github.com/LedgerHQ/ledger-live/commit/70c33a8ca450482df3fe8bfbbcafabf016b9b3dc) Thanks [@deepyjr](https://github.com/deepyjr)! - Render the Desktop Contacts address label step and move shared add-address flow content into the Contacts Flow feature.

- [#19634](https://github.com/LedgerHQ/ledger-live/pull/19634) [`4015ade`](https://github.com/LedgerHQ/ledger-live/commit/4015ade1f9744d4bb575282060fdb1beb9aafc89) Thanks [@thesan](https://github.com/thesan)! - Connect @ledgerhq/ledger-auth to the Ledger Wallet apps Redux store

- [#20181](https://github.com/LedgerHQ/ledger-live/pull/20181) [`34a8455`](https://github.com/LedgerHQ/ledger-live/commit/34a8455a46382e5663e46b822f54e80530e23533) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Add a QR code scanner to the new send flow recipient field: the QR icon shows while the field is empty and is replaced by the clear button once the user types

- [#20496](https://github.com/LedgerHQ/ledger-live/pull/20496) [`aa367b0`](https://github.com/LedgerHQ/ledger-live/commit/aa367b0d4c042b12c7cd57c69910774062d29422) Thanks [@desirendr](https://github.com/desirendr)! - LWD 4.15.0 release notes

- [#20252](https://github.com/LedgerHQ/ledger-live/pull/20252) [`e709463`](https://github.com/LedgerHQ/ledger-live/commit/e7094633d503367b7ccf4783f24dec7780b04707) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Render Desktop Me contact detail by default with Me display-name formatting and external address CTA.

- [#20189](https://github.com/LedgerHQ/ledger-live/pull/20189) [`4bbd5a4`](https://github.com/LedgerHQ/ledger-live/commit/4bbd5a441f09e3c3d1709abcc9da3a7d1d6ea50c) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Show the network fee in the currency users care about in the new send flow. When the fee is editable the row follows the amount input's fiat/crypto toggle; when it is not, the row shows the fiat value alongside the native amount, since it is the only place that fee is visible. Fee presets now sub-label both amounts, except coins priced by fee rate (Bitcoin, Kaspa) which keep their sat/vB legend.

- [#20232](https://github.com/LedgerHQ/ledger-live/pull/20232) [`d467088`](https://github.com/LedgerHQ/ledger-live/commit/d4670885d7eb77c035d09c225eff9dca0151abb3) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwdm): a/b testing show recent banner

- [#20267](https://github.com/LedgerHQ/ledger-live/pull/20267) [`956d4a1`](https://github.com/LedgerHQ/ledger-live/commit/956d4a152187e6853b23fd72ab24e3f66c6c233d) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Add debug WebSocket transport to DevTools relay

- [#20339](https://github.com/LedgerHQ/ledger-live/pull/20339) [`6a531c5`](https://github.com/LedgerHQ/ledger-live/commit/6a531c54ccd1c65df122286de6f136f9d73b9002) Thanks [@qperrot](https://github.com/qperrot)! - Remove Scroll Sepolia testnet support as it is no longer maintained

- [#20224](https://github.com/LedgerHQ/ledger-live/pull/20224) [`f7e013a`](https://github.com/LedgerHQ/ledger-live/commit/f7e013a174e95461bedbd6cc2754134fbbf791b1) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Add an info disclaimer next to the recipient address in the new send flow, reminding users to verify the full address on their Ledger device

- [#20264](https://github.com/LedgerHQ/ledger-live/pull/20264) [`725b0dd`](https://github.com/LedgerHQ/ledger-live/commit/725b0ddf0c775bdbf9fa775adcfac2d8e4c56e9f) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - chore(aleo): view key warning copy update

- [#20261](https://github.com/LedgerHQ/ledger-live/pull/20261) [`ba6e9c1`](https://github.com/LedgerHQ/ledger-live/commit/ba6e9c1e542ad28a59b0163e3b453e2f047a48b9) Thanks [@ysitbon](https://github.com/ysitbon)! - Import currency accessors from the domain layer instead of the `@ledgerhq/live-common/currencies` barrel.

  Crypto accessors (`getCryptoCurrencyById`, `findCryptoCurrencyById`, `findCryptoCurrencyByKeyword`, `findCryptoCurrencyByTicker`, `listCryptoCurrencies`, `findCryptoCurrency`, `findCryptoCurrencyByScheme`, `hasCryptoCurrencyId`) now come from `@domain/entity-currency-crypto`, and fiat accessors (`getFiatCurrencyByTicker`, `findFiatCurrencyByTicker`, `listFiatCurrencies`, `hasFiatCurrencyTicker`) from `@domain/entity-currency-fiat`. The re-exports that forwarded them through `@ledgerhq/live-common/currencies` are removed; the barrel keeps its formatting, colour, helper, marketcap, support and URI-scheme exports. Behaviour is unchanged — the barrel already delegated to these same domain functions.

- [#20265](https://github.com/LedgerHQ/ledger-live/pull/20265) [`5f81208`](https://github.com/LedgerHQ/ledger-live/commit/5f81208308f7e56971cce9329369c12af82185d3) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Remove analytics consentValidityDays and the unused live-common consent expiry helpers

- [#20230](https://github.com/LedgerHQ/ledger-live/pull/20230) [`36c0e51`](https://github.com/LedgerHQ/ledger-live/commit/36c0e51ea1544d2bc24f29ded5616659a359d274) Thanks [@deepyjr](https://github.com/deepyjr)! - Add the Desktop Contacts address entry flow with embedded currency selection.

- [#20321](https://github.com/LedgerHQ/ledger-live/pull/20321) [`9783675`](https://github.com/LedgerHQ/ledger-live/commit/97836755ebf605f62b5731f696ae66a9270a4c58) Thanks [@deepyjr](https://github.com/deepyjr)! - Block duplicate Contacts names before creation

- [#20217](https://github.com/LedgerHQ/ledger-live/pull/20217) [`9ebc505`](https://github.com/LedgerHQ/ledger-live/commit/9ebc505868dbb6f4155a5985ca87fc4d225c437b) Thanks [@deepyjr](https://github.com/deepyjr)! - Add a reusable dialog flow and an embeddable Modular Dialog presentation.

- [#20350](https://github.com/LedgerHQ/ledger-live/pull/20350) [`51bc3da`](https://github.com/LedgerHQ/ledger-live/commit/51bc3daa6eb6c4b79bc4c14df4872072657277cd) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix hidden assets not appearing in Settings > Accounts. Native coins hidden from the asset detail page are now resolved from the crypto registry and listed alongside hidden tokens, and a single failing token lookup no longer empties the whole list.

### Patch Changes

- Updated dependencies [[`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add), [`1689e58`](https://github.com/LedgerHQ/ledger-live/commit/1689e583c054bb8ad373bfe9f325b136fe0283bc), [`facb60a`](https://github.com/LedgerHQ/ledger-live/commit/facb60a8abbc42b5067fb4d69d68577c6da2f232), [`674ae62`](https://github.com/LedgerHQ/ledger-live/commit/674ae62c25b0db62dd789a31956b776466f39d4d), [`c016a95`](https://github.com/LedgerHQ/ledger-live/commit/c016a95538dfef2d7ddf1a17914d8cb3e55b644e), [`4d3ae1b`](https://github.com/LedgerHQ/ledger-live/commit/4d3ae1bea30b444281698844214072d95665e07a), [`2fa6e1f`](https://github.com/LedgerHQ/ledger-live/commit/2fa6e1f3fbcb56ff444ca756135d821e141bc439), [`12794fa`](https://github.com/LedgerHQ/ledger-live/commit/12794fac12e62fd124a647434d044d51c3081242), [`f7997c9`](https://github.com/LedgerHQ/ledger-live/commit/f7997c90fe24c24a075b51a0f37db1c8e3eeffcd), [`56cfe0b`](https://github.com/LedgerHQ/ledger-live/commit/56cfe0bc6673f416f739c1593abfec718230952d), [`e0d421b`](https://github.com/LedgerHQ/ledger-live/commit/e0d421b5e20323f4e4ea14ec1566f6e9ba0d0189), [`248d24e`](https://github.com/LedgerHQ/ledger-live/commit/248d24e8fb1671878983ad90b0b47281e6773990), [`532d6c4`](https://github.com/LedgerHQ/ledger-live/commit/532d6c421fe25456bea2e169a1fbc095e6b7cf5a), [`9051d74`](https://github.com/LedgerHQ/ledger-live/commit/9051d7495e55706e8fb8801107f9473f505cb395), [`36a08f1`](https://github.com/LedgerHQ/ledger-live/commit/36a08f1aea939fc42e7dafd8d734ef8dce88d7d0), [`15e4608`](https://github.com/LedgerHQ/ledger-live/commit/15e4608db80de6909f96f795d8a888994510e07d), [`a464f7d`](https://github.com/LedgerHQ/ledger-live/commit/a464f7d6092607ff6b81aa6ec0cd29ef6cfcf35a), [`d35298f`](https://github.com/LedgerHQ/ledger-live/commit/d35298f0158e124f12fbdf811c5fdc795898e2c0), [`4e4bf02`](https://github.com/LedgerHQ/ledger-live/commit/4e4bf02352284a821d54b875601e4f7effd8cfbf), [`825f50f`](https://github.com/LedgerHQ/ledger-live/commit/825f50fb9989f929c1462d53d0df58a7242261c0), [`f60f9cb`](https://github.com/LedgerHQ/ledger-live/commit/f60f9cbc79557cfa815ea714b375ace11aea8754), [`72930e9`](https://github.com/LedgerHQ/ledger-live/commit/72930e93e2a01d46012c3e7b72e3e3d4875ae7d7), [`c6f620c`](https://github.com/LedgerHQ/ledger-live/commit/c6f620c3a0f7f944cb9de18ac129708dc69ec5a3), [`70c33a8`](https://github.com/LedgerHQ/ledger-live/commit/70c33a8ca450482df3fe8bfbbcafabf016b9b3dc), [`871f021`](https://github.com/LedgerHQ/ledger-live/commit/871f021405681209eebb7d3dde3ecf5681acdd81), [`4015ade`](https://github.com/LedgerHQ/ledger-live/commit/4015ade1f9744d4bb575282060fdb1beb9aafc89), [`f0e8ea9`](https://github.com/LedgerHQ/ledger-live/commit/f0e8ea93a3c90767dad4b326deeef3d1c48c36cc), [`140575c`](https://github.com/LedgerHQ/ledger-live/commit/140575c987ce5fa6173e7854edeb2c564e71c258), [`e709463`](https://github.com/LedgerHQ/ledger-live/commit/e7094633d503367b7ccf4783f24dec7780b04707), [`b90214c`](https://github.com/LedgerHQ/ledger-live/commit/b90214cf695812b52dc13eabcd930dbdfb6fe081), [`4bbd5a4`](https://github.com/LedgerHQ/ledger-live/commit/4bbd5a441f09e3c3d1709abcc9da3a7d1d6ea50c), [`a93a5ed`](https://github.com/LedgerHQ/ledger-live/commit/a93a5ed6b41e36f1d4e5dbd2028deb4ae35828a7), [`d467088`](https://github.com/LedgerHQ/ledger-live/commit/d4670885d7eb77c035d09c225eff9dca0151abb3), [`42524ad`](https://github.com/LedgerHQ/ledger-live/commit/42524ad0a30bc55ccf3563be35b19cd2c7004199), [`e50980f`](https://github.com/LedgerHQ/ledger-live/commit/e50980fccea5be9b6be8c14d2fd247c6eca6460f), [`9b07695`](https://github.com/LedgerHQ/ledger-live/commit/9b07695cbb7ca58712986dcae15594f6a44b9380), [`6a531c5`](https://github.com/LedgerHQ/ledger-live/commit/6a531c54ccd1c65df122286de6f136f9d73b9002), [`2958ef7`](https://github.com/LedgerHQ/ledger-live/commit/2958ef74bf25df9e612f89ed2fda386c86a60a5d), [`e7a22a6`](https://github.com/LedgerHQ/ledger-live/commit/e7a22a6e3c8c444640cfe8df88637ecad738e26a), [`ba6e9c1`](https://github.com/LedgerHQ/ledger-live/commit/ba6e9c1e542ad28a59b0163e3b453e2f047a48b9), [`5f81208`](https://github.com/LedgerHQ/ledger-live/commit/5f81208308f7e56971cce9329369c12af82185d3), [`94f7c85`](https://github.com/LedgerHQ/ledger-live/commit/94f7c85211c1947302e52fe9165027b83e202823), [`e44d972`](https://github.com/LedgerHQ/ledger-live/commit/e44d97239af10b46ae3ef703e0c6181cc0c87712), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152), [`9d56877`](https://github.com/LedgerHQ/ledger-live/commit/9d568778b657961ef06ba04d5fa616677afec7b8), [`635fa12`](https://github.com/LedgerHQ/ledger-live/commit/635fa12d47f5a98858326f4dd68962dffe82eda9), [`36c0e51`](https://github.com/LedgerHQ/ledger-live/commit/36c0e51ea1544d2bc24f29ded5616659a359d274), [`9783675`](https://github.com/LedgerHQ/ledger-live/commit/97836755ebf605f62b5731f696ae66a9270a4c58), [`b5df122`](https://github.com/LedgerHQ/ledger-live/commit/b5df1223ce9e09766d6f3fecf7e44e2ec3bd3a00), [`51bc3da`](https://github.com/LedgerHQ/ledger-live/commit/51bc3daa6eb6c4b79bc4c14df4872072657277cd)]:
  - @ledgerhq/coin-bitcoin@0.50.0
  - @ledgerhq/coin-canton@0.32.0
  - @ledgerhq/coin-cardano@0.33.0
  - @ledgerhq/coin-casper@2.18.0
  - @ledgerhq/coin-concordium@0.19.0
  - @ledgerhq/coin-cosmos@0.42.0
  - @ledgerhq/coin-evm@4.9.0
  - @ledgerhq/coin-filecoin@1.31.0
  - @ledgerhq/live-common@37.1.0
  - @ledgerhq/coin-zcash@0.2.0
  - @features/flow-contacts@0.5.0
  - @shared/api-services@0.2.0
  - @domain/api-altcoins-sentiment@0.3.0
  - @domain/api-market-sentiment@0.3.0
  - @domain/api-currency-token@0.3.0
  - @domain/api-currency-fiat@0.3.0
  - @domain/api-push-devices@0.2.0
  - @features/platform-currencies@0.5.0
  - @domain/entity-contact@0.5.0
  - @shared/feature-flags@0.17.0
  - @domain/entity-analytics-consent@0.2.0
  - @ledgerhq/types-live@6.118.0
  - @shared/auth@0.3.0
  - @features/flow-analytics-consent@0.2.0
  - @devtools/transport-panel@0.3.0
  - @devtools/shell@0.7.0
  - @devtools/wire@0.3.0
  - @shared/env@0.2.0
  - @ledgerhq/ledger-key-ring-protocol@0.18.0
  - @domain/entity-currency-crypto@0.9.0
  - @ledgerhq/asset-detail@0.10.0
  - @ledgerhq/ledger-wallet-framework@2.7.0
  - @ledgerhq/live-dmk-desktop@0.20.5
  - @devtools/bindings@0.2.3
  - @features/flow-large-screen-upsell@0.4.1
  - @features/platform-feature-flags@0.6.4
  - @ledgerhq/asset-aggregation@0.12.2
  - @ledgerhq/domain-service@1.8.13
  - @ledgerhq/live-countervalues@0.24.1
  - @ledgerhq/live-countervalues-react@0.16.5
  - @ledgerhq/live-wallet@0.30.2
  - @ledgerhq/wallet-analytics@0.3.2
  - @ledgerhq/wallet-pnl@0.7.5
  - @features/platform-env@0.1.2
  - @ledgerhq/live-dmk-speculos@0.10.4
  - @domain/entity-currency@0.3.1
  - @ledgerhq/live-currency-format@0.14.1
  - @ledgerhq/wallet-btc@0.3.0

## 4.15.0-next.1

### Minor Changes

- [#20496](https://github.com/LedgerHQ/ledger-live/pull/20496) [`aa367b0`](https://github.com/LedgerHQ/ledger-live/commit/aa367b0d4c042b12c7cd57c69910774062d29422) Thanks [@desirendr](https://github.com/desirendr)! - LWD 4.15.0 release notes

## 4.15.0-next.0

### Minor Changes

- [#20280](https://github.com/LedgerHQ/ledger-live/pull/20280) [`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Stop depending on `@ledgerhq/errors` (LIVE-32915).

  No workspace package declares it anymore, and none may again: `enforce-boundaries` now fails CI on any manifest that does. The classes it held live in the package that owns them, with `@ledgerhq/ledger-wallet-framework/errors` as the shared home below the coin layer.

  The package itself stays in the repo so it keeps being published for external consumers, and is bridged to the external coin packages that still peer-depend on it via `pnpm.packageExtensions` using `workspace:*` (which reuses the single in-repo copy, so the dependency graph keeps exactly the physical copies it had before). [LedgerHQ/coin-modules#752](https://github.com/LedgerHQ/coin-modules/pull/752) removes that peerDependency upstream; once it is released the bridge can be dropped, but the package still needs publishing.

- [#20221](https://github.com/LedgerHQ/ledger-live/pull/20221) [`1689e58`](https://github.com/LedgerHQ/ledger-live/commit/1689e583c054bb8ad373bfe9f325b136fe0283bc) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Serve Zcash accounts with a standalone `@ledgerhq/coin-zcash` coin-module (LIVE-34556).

  The module owns all four transfer flows — t→t, t→z, z→t, z→z — and crafts, signs and broadcasts each one as a PCZT through the native `@ledgerhq/zcash-utils` engine, with no legacy PSBT path: it owns the transparent UTXO path itself via `@ledgerhq/wallet-btc` instead of delegating to the Bitcoin bridge. Shielded balances, notes and operations come from the sync engine, so a shielded account reports the balance and history the chain-adapter could only report for its transparent side.

  Which module serves a Zcash account is decided by the existing `zcashShielded` feature flag, mirrored into `live-common` (`src/bridge/zcashRouting.ts`) because a coin-module cannot read React feature flags. OFF (the default) keeps `@ledgerhq/coin-bitcoin`'s Zcash chain-adapter and its legacy transparent path, so nothing changes for users until the flag is turned on; the two implementations are kept accounting-equivalent by differential tests that run both bridges over the same fixtures.

  Desktop hosts the engine in a dedicated utility process, reached over a `zcash:`-prefixed IPC contract owned by the module.

  Two flows do not complete on a NU6.3 chain, where newly shielded value goes to the Ironwood pool: z→z has no builder, since it would need Orchard spends alongside an Ironwood output; and a flow that does build a V6 PCZT cannot be finalized until `@ledgerhq/zcash-utils` exposes a V6 finalizer.

- [#20061](https://github.com/LedgerHQ/ledger-live/pull/20061) [`40ba85b`](https://github.com/LedgerHQ/ledger-live/commit/40ba85b823ed657753ee607d4ab16d1d63b18c45) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Scrub wallet addresses and account IDs from Datadog RUM events

- [#20341](https://github.com/LedgerHQ/ledger-live/pull/20341) [`c016a95`](https://github.com/LedgerHQ/ledger-live/commit/c016a95538dfef2d7ddf1a17914d8cb3e55b644e) Thanks [@ysitbon](https://github.com/ysitbon)! - Split backend access from use case in the RTK Query layer

  `@shared/api-services` now holds one endpoint-less `createApi` per backend (CAL, CoinMarketCap,
  Countervalues, Push Devices), owning its base query, `extraArgument` contract and reducer path.
  `domain/api/*` packages add their endpoints with `injectEndpoints` and their own cache tags with
  `enhanceEndpoints`, so one reducer, middleware and cache now serve every use case on a backend — the two
  CoinMarketCap packages previously had one each. Apps register the service apis.

  `extraArgument` builder names are unchanged, so only import paths move. Reducer paths are renamed after
  their backend (`calApi`, `coinMarketCapApi`, `countervaluesApi`); no persisted data and no endpoint
  behaviour is affected.

- [#20318](https://github.com/LedgerHQ/ledger-live/pull/20318) [`e0d421b`](https://github.com/LedgerHQ/ledger-live/commit/e0d421b5e20323f4e4ea14ec1566f6e9ba0d0189) Thanks [@deepyjr](https://github.com/deepyjr)! - Block sanctioned addresses in the Contacts add-address flow

- [#20263](https://github.com/LedgerHQ/ledger-live/pull/20263) [`6976ff3`](https://github.com/LedgerHQ/ledger-live/commit/6976ff343fb8d999e30cf0963732adb56078e6e4) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Wire desktop analytics consent renewal to shared policyVersion major/minor decision flow

- [#19989](https://github.com/LedgerHQ/ledger-live/pull/19989) [`78d84d4`](https://github.com/LedgerHQ/ledger-live/commit/78d84d44bf18edc337d73554207e9df1002b0f36) Thanks [@deepyjr](https://github.com/deepyjr)! - Prevent Asset Detail history from stacking after Buy and Sell live app navigation

- [#20388](https://github.com/LedgerHQ/ledger-live/pull/20388) [`c0154aa`](https://github.com/LedgerHQ/ledger-live/commit/c0154aaa356e575f563717bea914800469e52c9f) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Fix mismatched Sync Onboarding header background against the page canvas

- [#20240](https://github.com/LedgerHQ/ledger-live/pull/20240) [`15e4608`](https://github.com/LedgerHQ/ledger-live/commit/15e4608db80de6909f96f795d8a888994510e07d) Thanks [@deepyjr](https://github.com/deepyjr)! - Forward Modular Asset Drawer network filters to DADA asset requests.

- [#20197](https://github.com/LedgerHQ/ledger-live/pull/20197) [`507e450`](https://github.com/LedgerHQ/ledger-live/commit/507e450759f95ed42d5ce7f452825b89dba1df7f) Thanks [@ysitbon](https://github.com/ysitbon)! - Drop boot fiat fetch and `InitialQueriesContext`: `supportedCounterValues` is now a derived selector backed by the `supportedFiats` slice. Mobile gains a read-time OFAC guard on `counterValueCurrencyLocalSelector`; desktop removes its boot-time `getSupportedFiats.initiate` dispatch. Both apps now lazy-load the CVS query from the two picker screens.

- [#20078](https://github.com/LedgerHQ/ledger-live/pull/20078) [`baea85e`](https://github.com/LedgerHQ/ledger-live/commit/baea85eab9ee1a0a2068f05176bdcb960a3c39af) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Fix Generic Awareness Modal cascade on mobile and add Braze content card logging on mobile and desktop

- [#20288](https://github.com/LedgerHQ/ledger-live/pull/20288) [`5d139b9`](https://github.com/LedgerHQ/ledger-live/commit/5d139b9f50bbfe2f8c7d6929ced877400047b9ed) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Fix typecheck errors in desktop test files

- [#20222](https://github.com/LedgerHQ/ledger-live/pull/20222) [`c6f620c`](https://github.com/LedgerHQ/ledger-live/commit/c6f620c3a0f7f944cb9de18ac129708dc69ec5a3) Thanks [@deepyjr](https://github.com/deepyjr)! - Model contact address labels with asset defaults and per-contact uniqueness

- [#20243](https://github.com/LedgerHQ/ledger-live/pull/20243) [`63aa4b6`](https://github.com/LedgerHQ/ledger-live/commit/63aa4b638ff662a53a4a7f41e1bade6e026a208b) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove legacy translation keys orphaned by the Wallet 4.0 Q1 cleanup (sidebar/topbar rewrite, legacy dashboard & empty states, Help modal, receive step-options and the sync activity indicator).

- [#20317](https://github.com/LedgerHQ/ledger-live/pull/20317) [`70c33a8`](https://github.com/LedgerHQ/ledger-live/commit/70c33a8ca450482df3fe8bfbbcafabf016b9b3dc) Thanks [@deepyjr](https://github.com/deepyjr)! - Render the Desktop Contacts address label step and move shared add-address flow content into the Contacts Flow feature.

- [#19634](https://github.com/LedgerHQ/ledger-live/pull/19634) [`4015ade`](https://github.com/LedgerHQ/ledger-live/commit/4015ade1f9744d4bb575282060fdb1beb9aafc89) Thanks [@thesan](https://github.com/thesan)! - Connect @ledgerhq/ledger-auth to the Ledger Wallet apps Redux store

- [#20181](https://github.com/LedgerHQ/ledger-live/pull/20181) [`34a8455`](https://github.com/LedgerHQ/ledger-live/commit/34a8455a46382e5663e46b822f54e80530e23533) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Add a QR code scanner to the new send flow recipient field: the QR icon shows while the field is empty and is replaced by the clear button once the user types

- [#20252](https://github.com/LedgerHQ/ledger-live/pull/20252) [`e709463`](https://github.com/LedgerHQ/ledger-live/commit/e7094633d503367b7ccf4783f24dec7780b04707) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Render Desktop Me contact detail by default with Me display-name formatting and external address CTA.

- [#20189](https://github.com/LedgerHQ/ledger-live/pull/20189) [`4bbd5a4`](https://github.com/LedgerHQ/ledger-live/commit/4bbd5a441f09e3c3d1709abcc9da3a7d1d6ea50c) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Show the network fee in the currency users care about in the new send flow. When the fee is editable the row follows the amount input's fiat/crypto toggle; when it is not, the row shows the fiat value alongside the native amount, since it is the only place that fee is visible. Fee presets now sub-label both amounts, except coins priced by fee rate (Bitcoin, Kaspa) which keep their sat/vB legend.

- [#20232](https://github.com/LedgerHQ/ledger-live/pull/20232) [`d467088`](https://github.com/LedgerHQ/ledger-live/commit/d4670885d7eb77c035d09c225eff9dca0151abb3) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwdm): a/b testing show recent banner

- [#20267](https://github.com/LedgerHQ/ledger-live/pull/20267) [`956d4a1`](https://github.com/LedgerHQ/ledger-live/commit/956d4a152187e6853b23fd72ab24e3f66c6c233d) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Add debug WebSocket transport to DevTools relay

- [#20339](https://github.com/LedgerHQ/ledger-live/pull/20339) [`6a531c5`](https://github.com/LedgerHQ/ledger-live/commit/6a531c54ccd1c65df122286de6f136f9d73b9002) Thanks [@qperrot](https://github.com/qperrot)! - Remove Scroll Sepolia testnet support as it is no longer maintained

- [#20224](https://github.com/LedgerHQ/ledger-live/pull/20224) [`f7e013a`](https://github.com/LedgerHQ/ledger-live/commit/f7e013a174e95461bedbd6cc2754134fbbf791b1) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Add an info disclaimer next to the recipient address in the new send flow, reminding users to verify the full address on their Ledger device

- [#20264](https://github.com/LedgerHQ/ledger-live/pull/20264) [`725b0dd`](https://github.com/LedgerHQ/ledger-live/commit/725b0ddf0c775bdbf9fa775adcfac2d8e4c56e9f) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - chore(aleo): view key warning copy update

- [#20261](https://github.com/LedgerHQ/ledger-live/pull/20261) [`ba6e9c1`](https://github.com/LedgerHQ/ledger-live/commit/ba6e9c1e542ad28a59b0163e3b453e2f047a48b9) Thanks [@ysitbon](https://github.com/ysitbon)! - Import currency accessors from the domain layer instead of the `@ledgerhq/live-common/currencies` barrel.

  Crypto accessors (`getCryptoCurrencyById`, `findCryptoCurrencyById`, `findCryptoCurrencyByKeyword`, `findCryptoCurrencyByTicker`, `listCryptoCurrencies`, `findCryptoCurrency`, `findCryptoCurrencyByScheme`, `hasCryptoCurrencyId`) now come from `@domain/entity-currency-crypto`, and fiat accessors (`getFiatCurrencyByTicker`, `findFiatCurrencyByTicker`, `listFiatCurrencies`, `hasFiatCurrencyTicker`) from `@domain/entity-currency-fiat`. The re-exports that forwarded them through `@ledgerhq/live-common/currencies` are removed; the barrel keeps its formatting, colour, helper, marketcap, support and URI-scheme exports. Behaviour is unchanged — the barrel already delegated to these same domain functions.

- [#20265](https://github.com/LedgerHQ/ledger-live/pull/20265) [`5f81208`](https://github.com/LedgerHQ/ledger-live/commit/5f81208308f7e56971cce9329369c12af82185d3) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Remove analytics consentValidityDays and the unused live-common consent expiry helpers

- [#20230](https://github.com/LedgerHQ/ledger-live/pull/20230) [`36c0e51`](https://github.com/LedgerHQ/ledger-live/commit/36c0e51ea1544d2bc24f29ded5616659a359d274) Thanks [@deepyjr](https://github.com/deepyjr)! - Add the Desktop Contacts address entry flow with embedded currency selection.

- [#20321](https://github.com/LedgerHQ/ledger-live/pull/20321) [`9783675`](https://github.com/LedgerHQ/ledger-live/commit/97836755ebf605f62b5731f696ae66a9270a4c58) Thanks [@deepyjr](https://github.com/deepyjr)! - Block duplicate Contacts names before creation

- [#20217](https://github.com/LedgerHQ/ledger-live/pull/20217) [`9ebc505`](https://github.com/LedgerHQ/ledger-live/commit/9ebc505868dbb6f4155a5985ca87fc4d225c437b) Thanks [@deepyjr](https://github.com/deepyjr)! - Add a reusable dialog flow and an embeddable Modular Dialog presentation.

- [#20350](https://github.com/LedgerHQ/ledger-live/pull/20350) [`51bc3da`](https://github.com/LedgerHQ/ledger-live/commit/51bc3daa6eb6c4b79bc4c14df4872072657277cd) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix hidden assets not appearing in Settings > Accounts. Native coins hidden from the asset detail page are now resolved from the crypto registry and listed alongside hidden tokens, and a single failing token lookup no longer empties the whole list.

### Patch Changes

- Updated dependencies [[`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add), [`1689e58`](https://github.com/LedgerHQ/ledger-live/commit/1689e583c054bb8ad373bfe9f325b136fe0283bc), [`facb60a`](https://github.com/LedgerHQ/ledger-live/commit/facb60a8abbc42b5067fb4d69d68577c6da2f232), [`674ae62`](https://github.com/LedgerHQ/ledger-live/commit/674ae62c25b0db62dd789a31956b776466f39d4d), [`c016a95`](https://github.com/LedgerHQ/ledger-live/commit/c016a95538dfef2d7ddf1a17914d8cb3e55b644e), [`4d3ae1b`](https://github.com/LedgerHQ/ledger-live/commit/4d3ae1bea30b444281698844214072d95665e07a), [`2fa6e1f`](https://github.com/LedgerHQ/ledger-live/commit/2fa6e1f3fbcb56ff444ca756135d821e141bc439), [`12794fa`](https://github.com/LedgerHQ/ledger-live/commit/12794fac12e62fd124a647434d044d51c3081242), [`f7997c9`](https://github.com/LedgerHQ/ledger-live/commit/f7997c90fe24c24a075b51a0f37db1c8e3eeffcd), [`56cfe0b`](https://github.com/LedgerHQ/ledger-live/commit/56cfe0bc6673f416f739c1593abfec718230952d), [`e0d421b`](https://github.com/LedgerHQ/ledger-live/commit/e0d421b5e20323f4e4ea14ec1566f6e9ba0d0189), [`248d24e`](https://github.com/LedgerHQ/ledger-live/commit/248d24e8fb1671878983ad90b0b47281e6773990), [`532d6c4`](https://github.com/LedgerHQ/ledger-live/commit/532d6c421fe25456bea2e169a1fbc095e6b7cf5a), [`9051d74`](https://github.com/LedgerHQ/ledger-live/commit/9051d7495e55706e8fb8801107f9473f505cb395), [`36a08f1`](https://github.com/LedgerHQ/ledger-live/commit/36a08f1aea939fc42e7dafd8d734ef8dce88d7d0), [`15e4608`](https://github.com/LedgerHQ/ledger-live/commit/15e4608db80de6909f96f795d8a888994510e07d), [`a464f7d`](https://github.com/LedgerHQ/ledger-live/commit/a464f7d6092607ff6b81aa6ec0cd29ef6cfcf35a), [`d35298f`](https://github.com/LedgerHQ/ledger-live/commit/d35298f0158e124f12fbdf811c5fdc795898e2c0), [`4e4bf02`](https://github.com/LedgerHQ/ledger-live/commit/4e4bf02352284a821d54b875601e4f7effd8cfbf), [`825f50f`](https://github.com/LedgerHQ/ledger-live/commit/825f50fb9989f929c1462d53d0df58a7242261c0), [`f60f9cb`](https://github.com/LedgerHQ/ledger-live/commit/f60f9cbc79557cfa815ea714b375ace11aea8754), [`72930e9`](https://github.com/LedgerHQ/ledger-live/commit/72930e93e2a01d46012c3e7b72e3e3d4875ae7d7), [`c6f620c`](https://github.com/LedgerHQ/ledger-live/commit/c6f620c3a0f7f944cb9de18ac129708dc69ec5a3), [`70c33a8`](https://github.com/LedgerHQ/ledger-live/commit/70c33a8ca450482df3fe8bfbbcafabf016b9b3dc), [`871f021`](https://github.com/LedgerHQ/ledger-live/commit/871f021405681209eebb7d3dde3ecf5681acdd81), [`4015ade`](https://github.com/LedgerHQ/ledger-live/commit/4015ade1f9744d4bb575282060fdb1beb9aafc89), [`f0e8ea9`](https://github.com/LedgerHQ/ledger-live/commit/f0e8ea93a3c90767dad4b326deeef3d1c48c36cc), [`140575c`](https://github.com/LedgerHQ/ledger-live/commit/140575c987ce5fa6173e7854edeb2c564e71c258), [`e709463`](https://github.com/LedgerHQ/ledger-live/commit/e7094633d503367b7ccf4783f24dec7780b04707), [`b90214c`](https://github.com/LedgerHQ/ledger-live/commit/b90214cf695812b52dc13eabcd930dbdfb6fe081), [`4bbd5a4`](https://github.com/LedgerHQ/ledger-live/commit/4bbd5a441f09e3c3d1709abcc9da3a7d1d6ea50c), [`a93a5ed`](https://github.com/LedgerHQ/ledger-live/commit/a93a5ed6b41e36f1d4e5dbd2028deb4ae35828a7), [`d467088`](https://github.com/LedgerHQ/ledger-live/commit/d4670885d7eb77c035d09c225eff9dca0151abb3), [`42524ad`](https://github.com/LedgerHQ/ledger-live/commit/42524ad0a30bc55ccf3563be35b19cd2c7004199), [`e50980f`](https://github.com/LedgerHQ/ledger-live/commit/e50980fccea5be9b6be8c14d2fd247c6eca6460f), [`9b07695`](https://github.com/LedgerHQ/ledger-live/commit/9b07695cbb7ca58712986dcae15594f6a44b9380), [`6a531c5`](https://github.com/LedgerHQ/ledger-live/commit/6a531c54ccd1c65df122286de6f136f9d73b9002), [`2958ef7`](https://github.com/LedgerHQ/ledger-live/commit/2958ef74bf25df9e612f89ed2fda386c86a60a5d), [`e7a22a6`](https://github.com/LedgerHQ/ledger-live/commit/e7a22a6e3c8c444640cfe8df88637ecad738e26a), [`ba6e9c1`](https://github.com/LedgerHQ/ledger-live/commit/ba6e9c1e542ad28a59b0163e3b453e2f047a48b9), [`5f81208`](https://github.com/LedgerHQ/ledger-live/commit/5f81208308f7e56971cce9329369c12af82185d3), [`94f7c85`](https://github.com/LedgerHQ/ledger-live/commit/94f7c85211c1947302e52fe9165027b83e202823), [`e44d972`](https://github.com/LedgerHQ/ledger-live/commit/e44d97239af10b46ae3ef703e0c6181cc0c87712), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152), [`9d56877`](https://github.com/LedgerHQ/ledger-live/commit/9d568778b657961ef06ba04d5fa616677afec7b8), [`635fa12`](https://github.com/LedgerHQ/ledger-live/commit/635fa12d47f5a98858326f4dd68962dffe82eda9), [`36c0e51`](https://github.com/LedgerHQ/ledger-live/commit/36c0e51ea1544d2bc24f29ded5616659a359d274), [`9783675`](https://github.com/LedgerHQ/ledger-live/commit/97836755ebf605f62b5731f696ae66a9270a4c58), [`b5df122`](https://github.com/LedgerHQ/ledger-live/commit/b5df1223ce9e09766d6f3fecf7e44e2ec3bd3a00), [`51bc3da`](https://github.com/LedgerHQ/ledger-live/commit/51bc3daa6eb6c4b79bc4c14df4872072657277cd)]:
  - @ledgerhq/coin-bitcoin@0.50.0-next.0
  - @ledgerhq/coin-canton@0.32.0-next.0
  - @ledgerhq/coin-cardano@0.33.0-next.0
  - @ledgerhq/coin-casper@2.18.0-next.0
  - @ledgerhq/coin-concordium@0.19.0-next.0
  - @ledgerhq/coin-cosmos@0.42.0-next.0
  - @ledgerhq/coin-evm@4.9.0-next.0
  - @ledgerhq/coin-filecoin@1.31.0-next.0
  - @ledgerhq/live-common@37.1.0-next.0
  - @ledgerhq/coin-zcash@0.2.0-next.0
  - @features/flow-contacts@0.5.0-next.0
  - @shared/api-services@0.2.0-next.0
  - @domain/api-altcoins-sentiment@0.3.0-next.0
  - @domain/api-market-sentiment@0.3.0-next.0
  - @domain/api-currency-token@0.3.0-next.0
  - @domain/api-currency-fiat@0.3.0-next.0
  - @domain/api-push-devices@0.2.0-next.0
  - @features/platform-currencies@0.5.0-next.0
  - @domain/entity-contact@0.5.0-next.0
  - @shared/feature-flags@0.17.0-next.0
  - @domain/entity-analytics-consent@0.2.0-next.0
  - @ledgerhq/types-live@6.118.0-next.0
  - @shared/auth@0.3.0-next.0
  - @features/flow-analytics-consent@0.2.0-next.0
  - @devtools/transport-panel@0.3.0-next.0
  - @devtools/shell@0.7.0-next.0
  - @devtools/wire@0.3.0-next.0
  - @shared/env@0.2.0-next.0
  - @ledgerhq/ledger-key-ring-protocol@0.18.0-next.0
  - @domain/entity-currency-crypto@0.9.0-next.0
  - @ledgerhq/asset-detail@0.10.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.7.0-next.0
  - @ledgerhq/live-dmk-desktop@0.20.5-next.0
  - @devtools/bindings@0.2.3-next.0
  - @features/flow-large-screen-upsell@0.4.1-next.0
  - @features/platform-feature-flags@0.6.4-next.0
  - @ledgerhq/asset-aggregation@0.12.2-next.0
  - @ledgerhq/domain-service@1.8.13-next.0
  - @ledgerhq/live-countervalues@0.24.1-next.0
  - @ledgerhq/live-countervalues-react@0.16.5-next.0
  - @ledgerhq/live-wallet@0.30.2-next.0
  - @ledgerhq/wallet-analytics@0.3.2-next.0
  - @ledgerhq/wallet-pnl@0.7.5-next.0
  - @features/platform-env@0.1.2-next.0
  - @ledgerhq/live-dmk-speculos@0.10.4-next.0
  - @domain/entity-currency@0.3.1-next.0
  - @ledgerhq/live-currency-format@0.14.1
  - @ledgerhq/wallet-btc@0.3.0

## 4.14.0

### Minor Changes

- [#20129](https://github.com/LedgerHQ/ledger-live/pull/20129) [`ba20e39`](https://github.com/LedgerHQ/ledger-live/commit/ba20e3926e52284c04c9bc4e4b17b7c5e34b3cb5) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Migrate `checkLibs` and its two callers off `@ledgerhq/errors` as part of the errors sunset (LIVE-32915).

  `checkLibs` detects duplicated npm packages by comparing class identity, so `sanityChecks.ts` and both app entrypoints must import `NotEnoughBalance` from the same module. All three now use `@ledgerhq/ledger-wallet-framework/errors`. The duplicate-package warning also names `@ledgerhq/ledger-wallet-framework` so the `pnpm why` hint points at the package actually being checked.

- [#19946](https://github.com/LedgerHQ/ledger-live/pull/19946) [`b35f172`](https://github.com/LedgerHQ/ledger-live/commit/b35f1725617f414f219d1da94c1296f153ffc8f9) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - integration tests for Aleo desktop app

- [#19982](https://github.com/LedgerHQ/ledger-live/pull/19982) [`f5e4e87`](https://github.com/LedgerHQ/ledger-live/commit/f5e4e87a114ca8336f310a4b5e39bff650fc0750) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Display estimated pending rewards for 0G delegations; gate claim-rewards UI to chains that support it.

- [#20099](https://github.com/LedgerHQ/ledger-live/pull/20099) [`37dac39`](https://github.com/LedgerHQ/ledger-live/commit/37dac39463de1a44bdb5bc4b1b6b37b0cff68922) Thanks [@deepyjr](https://github.com/deepyjr)! - Add contact address asset and network selection through the Modular Dialog, with shared asset
  filtering across Desktop and Mobile.

- [#19953](https://github.com/LedgerHQ/ledger-live/pull/19953) [`0c57185`](https://github.com/LedgerHQ/ledger-live/commit/0c571858b3badf4d9e9c706ca0f9aaca3e925310) Thanks [@deepyjr](https://github.com/deepyjr)! - Stabilize Wallet API drawer navigation smoke test.

- [#20146](https://github.com/LedgerHQ/ledger-live/pull/20146) [`8a6b086`](https://github.com/LedgerHQ/ledger-live/commit/8a6b0868b0f0d760d83ece3edafa40716df4fc2f) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix Desktop contacts list scroll so the add contact row stays full size at the end of the list.

- [#20050](https://github.com/LedgerHQ/ledger-live/pull/20050) [`4c34536`](https://github.com/LedgerHQ/ledger-live/commit/4c345363f061fb4a525684ae45ce437ea12e77d7) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Remove Custom Lock Screen step from the post-onboarding widget.

- [#19994](https://github.com/LedgerHQ/ledger-live/pull/19994) [`0f61d63`](https://github.com/LedgerHQ/ledger-live/commit/0f61d637855072b4352cb3e6901a4ed9986a0bbd) Thanks [@sarneijim](https://github.com/sarneijim)! - Update large-screen upsell modal UTM attribution on mobile and desktop

- [#19970](https://github.com/LedgerHQ/ledger-live/pull/19970) [`192273e`](https://github.com/LedgerHQ/ledger-live/commit/192273e07f22435e9cea149a8d82a7aa4f1e481f) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Hide sidebar on Recover and Perps fullscreen webview routes

- [#19904](https://github.com/LedgerHQ/ledger-live/pull/19904) [`5f383b4`](https://github.com/LedgerHQ/ledger-live/commit/5f383b404f53f44a0b3451a04060958181dadc9e) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Fix analytics confidentiality filter to scrub account IDs from tracked events

- [#19995](https://github.com/LedgerHQ/ledger-live/pull/19995) [`281a7f3`](https://github.com/LedgerHQ/ledger-live/commit/281a7f358d6fe176a0cbba349d081942ed32ea64) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Render validation errors in the Desktop add contact dialog.

- [#20009](https://github.com/LedgerHQ/ledger-live/pull/20009) [`341ea10`](https://github.com/LedgerHQ/ledger-live/commit/341ea108e30bf8af9abeb6eed484ee4b2c7c4a43) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Revert Cardano firmware app v8.0.4 support (hw-app-cardano bump to 8.0.0)

- [#19985](https://github.com/LedgerHQ/ledger-live/pull/19985) [`808c4cd`](https://github.com/LedgerHQ/ledger-live/commit/808c4cd479e509210ea9537fe972251cfd8d04f7) Thanks [@deepyjr](https://github.com/deepyjr)! - Reorganize the contacts flow package around a /steps folder (List, AddContact, Introduction, Detail), promote shared helpers to src/utils, curate root barrels, and rename public views to ContactsListView and ContactDetailView. No runtime behavior change.

- [#20070](https://github.com/LedgerHQ/ledger-live/pull/20070) [`52253f7`](https://github.com/LedgerHQ/ledger-live/commit/52253f70c302056cdc6b367cdd8b1db408b5e07d) Thanks [@ysitbon](https://github.com/ysitbon)! - Remove the now-dead `@ledgerhq/cryptoassets` currency/fiat store injection from the app bootstraps. Nothing reads the legacy currency/fiat accessors anymore (the runtime source of truth is the domain-backed wallet-framework currency resolver), so `setCryptoCurrenciesStore` / `setFiatCurrenciesStore` injected a store no consumer queried. Drop the calls, drop the `@ledgerhq/cryptoassets` dependency from the apps, and remove the remaining stale references to the package in comments.

- [#20163](https://github.com/LedgerHQ/ledger-live/pull/20163) [`edab816`](https://github.com/LedgerHQ/ledger-live/commit/edab816584999d93a63d703c0a56238720eae70f) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Round market table row corners on hover (asset discoverability view)

- [#20023](https://github.com/LedgerHQ/ledger-live/pull/20023) [`5ad8f9e`](https://github.com/LedgerHQ/ledger-live/commit/5ad8f9e6b323222b1fe98aec246597da6d540cee) Thanks [@deepyjr](https://github.com/deepyjr)! - Start the shared Add Address flow from Desktop contact details

- [#20118](https://github.com/LedgerHQ/ledger-live/pull/20118) [`5de8391`](https://github.com/LedgerHQ/ledger-live/commit/5de839159cbd681c5a764976197ca4f028195124) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add populated contact detail with network-grouped address rows, crypto icons, and shared address detail dialog.

- [#20116](https://github.com/LedgerHQ/ledger-live/pull/20116) [`fce013c`](https://github.com/LedgerHQ/ledger-live/commit/fce013c5a37df9e300c3b3b147f29e2cf92c9121) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Fix dialog buttons doing nothing while a side drawer is open, by releasing the drawer focus trap when a dialog opens

- [#20091](https://github.com/LedgerHQ/ledger-live/pull/20091) [`ef5945a`](https://github.com/LedgerHQ/ledger-live/commit/ef5945a991c2d93259c414091bb276f527f8cbae) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Bump Lumen design-system packages to latest (design-core 0.1.23, ui-react 0.1.49, ui-rnative 0.1.52, ui-react-visualization 0.1.28, ui-rnative-visualization 0.1.29).

  - Migrate the desktop tables to the new `TableCellContent` compound API (`TableCellItem` / `TableCellContent` / `TableCellContentTitle` / `TableCellContentDescription` / `TableCellContentRow`).
  - Migrate the interactive My Wallet avatar to the new `AvatarButton` component on both apps, and fix the vertical centering of the desktop top-bar trigger.
  - Use the currency image fallback (`MediaImage`, circular) in the market list so it matches the crypto-icon shape.
  - Simplify `getDotIndicatorProps` avatar sizing now that the helper is typed for the full avatar size range.

- [#19892](https://github.com/LedgerHQ/ledger-live/pull/19892) [`66edf4d`](https://github.com/LedgerHQ/ledger-live/commit/66edf4da2d94165a82f36680f3df323f1a62b45e) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add the Desktop Add contact dialog and shared web form wired to add-contact state.

- [#19805](https://github.com/LedgerHQ/ledger-live/pull/19805) [`b1d3f26`](https://github.com/LedgerHQ/ledger-live/commit/b1d3f26cbdf67c439bc125bdda1f1c56c9753f2e) Thanks [@ishaba](https://github.com/ishaba)! - feat(send): add default-fee strategy to the new send flow

- [#20072](https://github.com/LedgerHQ/ledger-live/pull/20072) [`524d763`](https://github.com/LedgerHQ/ledger-live/commit/524d7636d85a79379a9b086323d3121f3199bd1f) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Remove deprecated storyly feature flag, types, and orphaned i18n keys.

- [#19998](https://github.com/LedgerHQ/ledger-live/pull/19998) [`e4e009f`](https://github.com/LedgerHQ/ledger-live/commit/e4e009f60792d3d0c9dd79c19406b02cec66b22b) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Render Desktop contact detail empty state using shared flow-contacts Detail step.

- [#20180](https://github.com/LedgerHQ/ledger-live/pull/20180) [`dd7758b`](https://github.com/LedgerHQ/ledger-live/commit/dd7758bfa16c6b73b60da072a50c22f3b132c1a2) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Show 8 characters on each side of the ellipsis when truncating the recipient address in the new send flow, consistently across mobile and desktop

- [#19996](https://github.com/LedgerHQ/ledger-live/pull/19996) [`c9dddf2`](https://github.com/LedgerHQ/ledger-live/commit/c9dddf21f6e3208a077aa72bd575f56415287074) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwm): changes bottomsheet to sheet info and minor fixes on lwm

- [#20127](https://github.com/LedgerHQ/ledger-live/pull/20127) [`e7b8ddc`](https://github.com/LedgerHQ/ledger-live/commit/e7b8ddc239b88c1fbf0751c468218d9263f56859) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: aleo tokens swap incompatibility warning

- [#19941](https://github.com/LedgerHQ/ledger-live/pull/19941) [`af5ff9e`](https://github.com/LedgerHQ/ledger-live/commit/af5ff9ebd17f3dc4fd4234e48f3fa0dd27af2f94) Thanks [@deepyjr](https://github.com/deepyjr)! - Fix zero price variations in Desktop asset search results.

- [#19925](https://github.com/LedgerHQ/ledger-live/pull/19925) [`72969ec`](https://github.com/LedgerHQ/ledger-live/commit/72969ecd9ae1f6ff8ba380fba1e7f96297f81bbc) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Track input mode (fiat or crypto) when clicking review on the new send flow amount screen

- [#20068](https://github.com/LedgerHQ/ledger-live/pull/20068) [`644aefb`](https://github.com/LedgerHQ/ledger-live/commit/644aefbb471f91eb0be7817b665cf773cf3250b1) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - fix empty asset ledger desktop

- [#20190](https://github.com/LedgerHQ/ledger-live/pull/20190) [`a8d6e25`](https://github.com/LedgerHQ/ledger-live/commit/a8d6e25c0467572fbbc0cd3b35f90d355542b1f7) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(lwdm): new send flow wait for valid address to display memo

- [#20097](https://github.com/LedgerHQ/ledger-live/pull/20097) [`7efe94e`](https://github.com/LedgerHQ/ledger-live/commit/7efe94e4dfa707fb0c23ff819791194d33ac5d8f) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - changes to self transfer label for Aleo

- [#19637](https://github.com/LedgerHQ/ledger-live/pull/19637) [`07c9576`](https://github.com/LedgerHQ/ledger-live/commit/07c957630a5f271ceac66eb0ecde6c2a690e689b) Thanks [@semeano](https://github.com/semeano)! - Zcash send modal updated; add memo field

### Patch Changes

- Updated dependencies [[`1070564`](https://github.com/LedgerHQ/ledger-live/commit/107056410174d3da2d45c468232a8d742aea021f), [`ba20e39`](https://github.com/LedgerHQ/ledger-live/commit/ba20e3926e52284c04c9bc4e4b17b7c5e34b3cb5), [`2e1aecc`](https://github.com/LedgerHQ/ledger-live/commit/2e1aeccf6c91761c5d09c91e4be10dcc8c22eb7b), [`ba69273`](https://github.com/LedgerHQ/ledger-live/commit/ba692732b521c42f934acf540641ecbfdb837004), [`1af9ec9`](https://github.com/LedgerHQ/ledger-live/commit/1af9ec984928e0bf5fd23ce12edcc6131b0302a0), [`f79de59`](https://github.com/LedgerHQ/ledger-live/commit/f79de59f95ed384fc2b2e49dfa28efb1a0493d4a), [`f5e4e87`](https://github.com/LedgerHQ/ledger-live/commit/f5e4e87a114ca8336f310a4b5e39bff650fc0750), [`37dac39`](https://github.com/LedgerHQ/ledger-live/commit/37dac39463de1a44bdb5bc4b1b6b37b0cff68922), [`dbffe41`](https://github.com/LedgerHQ/ledger-live/commit/dbffe417f903844a973b7a284206e7313b7a8e5a), [`86bbd1d`](https://github.com/LedgerHQ/ledger-live/commit/86bbd1d829ee60b76af040c064d93acc15561855), [`54b3d2b`](https://github.com/LedgerHQ/ledger-live/commit/54b3d2b6032f1336d4d9fb2e238fa2347e45cc81), [`8a6b086`](https://github.com/LedgerHQ/ledger-live/commit/8a6b0868b0f0d760d83ece3edafa40716df4fc2f), [`0f61d63`](https://github.com/LedgerHQ/ledger-live/commit/0f61d637855072b4352cb3e6901a4ed9986a0bbd), [`008228e`](https://github.com/LedgerHQ/ledger-live/commit/008228ee22ba86b8aabe50c50d9c2e5e63771add), [`281a7f3`](https://github.com/LedgerHQ/ledger-live/commit/281a7f358d6fe176a0cbba349d081942ed32ea64), [`cee41c4`](https://github.com/LedgerHQ/ledger-live/commit/cee41c4e7a7c7e042d4df39d5a34591d72d723d0), [`341ea10`](https://github.com/LedgerHQ/ledger-live/commit/341ea108e30bf8af9abeb6eed484ee4b2c7c4a43), [`2e410a6`](https://github.com/LedgerHQ/ledger-live/commit/2e410a67f5a88b5cb8d79184b97bcded0d4eaadf), [`808c4cd`](https://github.com/LedgerHQ/ledger-live/commit/808c4cd479e509210ea9537fe972251cfd8d04f7), [`8ab9e50`](https://github.com/LedgerHQ/ledger-live/commit/8ab9e504a5b004e28f5e80f490b837b3c2526f44), [`4148019`](https://github.com/LedgerHQ/ledger-live/commit/414801922232b6d9514270e8876e783c11555c2c), [`1e4e519`](https://github.com/LedgerHQ/ledger-live/commit/1e4e51913a9b1971056789ac24ed05092529d799), [`52253f7`](https://github.com/LedgerHQ/ledger-live/commit/52253f70c302056cdc6b367cdd8b1db408b5e07d), [`4ce5257`](https://github.com/LedgerHQ/ledger-live/commit/4ce52570577d471d4af0609058ac6b9b03ad1949), [`91da072`](https://github.com/LedgerHQ/ledger-live/commit/91da072ea17f564824d6c04d13934ec88d86d348), [`e58258b`](https://github.com/LedgerHQ/ledger-live/commit/e58258b3a130ba606bdf8d882b02d59eb3571082), [`452adf8`](https://github.com/LedgerHQ/ledger-live/commit/452adf85380d1cb74f1894478cdd84849b120ef4), [`112b63f`](https://github.com/LedgerHQ/ledger-live/commit/112b63f8d33a8e26b316ce4542ef23460ae54937), [`44798f3`](https://github.com/LedgerHQ/ledger-live/commit/44798f392deb662a5f60123651ece2b320fbf946), [`d7600fb`](https://github.com/LedgerHQ/ledger-live/commit/d7600fb21e73581fbfb20019a78109b9a5c9abff), [`6131b15`](https://github.com/LedgerHQ/ledger-live/commit/6131b15d376b0ea2677df401564872a9c19d2151), [`f334b43`](https://github.com/LedgerHQ/ledger-live/commit/f334b430c82892f603221fb3ffe5d3964215bcad), [`67df284`](https://github.com/LedgerHQ/ledger-live/commit/67df284e2ccb916cff51896e42ef21846249b3e7), [`18bc180`](https://github.com/LedgerHQ/ledger-live/commit/18bc180446f0d7410a3aedd953e2fb0ce2b43f4c), [`26ee89d`](https://github.com/LedgerHQ/ledger-live/commit/26ee89d7e3bba9b800a7b6f08db52b079fcd8bd5), [`5de8391`](https://github.com/LedgerHQ/ledger-live/commit/5de839159cbd681c5a764976197ca4f028195124), [`66edf4d`](https://github.com/LedgerHQ/ledger-live/commit/66edf4da2d94165a82f36680f3df323f1a62b45e), [`b1d3f26`](https://github.com/LedgerHQ/ledger-live/commit/b1d3f26cbdf67c439bc125bdda1f1c56c9753f2e), [`a534db5`](https://github.com/LedgerHQ/ledger-live/commit/a534db5c41da6957d38a330c1da6f7db1b693763), [`c622459`](https://github.com/LedgerHQ/ledger-live/commit/c622459fcbff5dcc094ee10eb360f2a835036007), [`524d763`](https://github.com/LedgerHQ/ledger-live/commit/524d7636d85a79379a9b086323d3121f3199bd1f), [`e4e009f`](https://github.com/LedgerHQ/ledger-live/commit/e4e009f60792d3d0c9dd79c19406b02cec66b22b), [`dd7758b`](https://github.com/LedgerHQ/ledger-live/commit/dd7758bfa16c6b73b60da072a50c22f3b132c1a2), [`c9dddf2`](https://github.com/LedgerHQ/ledger-live/commit/c9dddf21f6e3208a077aa72bd575f56415287074), [`e7b8ddc`](https://github.com/LedgerHQ/ledger-live/commit/e7b8ddc239b88c1fbf0751c468218d9263f56859), [`e6a9b97`](https://github.com/LedgerHQ/ledger-live/commit/e6a9b973d05af98987c094d591342031f273b31c), [`dbf8acf`](https://github.com/LedgerHQ/ledger-live/commit/dbf8acf27c9405548e7eb559d163a8e0883a20aa), [`dfab01f`](https://github.com/LedgerHQ/ledger-live/commit/dfab01f36460bd4e0ea0b0c13aa3d965aef945cd), [`a8d6e25`](https://github.com/LedgerHQ/ledger-live/commit/a8d6e25c0467572fbbc0cd3b35f90d355542b1f7), [`aa27732`](https://github.com/LedgerHQ/ledger-live/commit/aa2773257ffa4480b33c2a219c9986eb40e293fb), [`aa27732`](https://github.com/LedgerHQ/ledger-live/commit/aa2773257ffa4480b33c2a219c9986eb40e293fb), [`f8b5b51`](https://github.com/LedgerHQ/ledger-live/commit/f8b5b51856c57c68ca50d13b00d124d261c26504)]:
  - @ledgerhq/errors@7.0.0
  - @ledgerhq/live-common@37.0.0
  - @ledgerhq/ledger-wallet-framework@2.6.0
  - @ledgerhq/coin-bitcoin@0.49.0
  - @ledgerhq/coin-canton@0.31.0
  - @ledgerhq/coin-cardano@0.32.0
  - @ledgerhq/coin-casper@2.17.0
  - @ledgerhq/coin-concordium@0.18.0
  - @ledgerhq/coin-cosmos@0.41.0
  - @ledgerhq/coin-evm@4.8.0
  - @ledgerhq/coin-filecoin@1.30.0
  - @ledgerhq/live-network@3.0.0
  - @features/flow-contacts@0.4.0
  - @features/flow-large-screen-upsell@0.4.0
  - @domain/entity-currency-crypto@0.8.0
  - @domain/entity-currency-token@0.3.0
  - @domain/entity-currency@0.3.0
  - @ledgerhq/wallet-btc@0.3.0
  - @ledgerhq/live-countervalues@0.24.0
  - @domain/entity-contact@0.4.0
  - @shared/feature-flags@0.16.0
  - @devtools/shell@0.6.0
  - @ledgerhq/types-live@6.117.0
  - @ledgerhq/domain-service@1.8.12
  - @ledgerhq/hw-transport@6.35.7
  - @ledgerhq/hw-transport-http@6.36.7
  - @ledgerhq/hw-transport-vault@1.7.7
  - @ledgerhq/asset-detail@0.9.3
  - @ledgerhq/live-dmk-desktop@0.20.4
  - @ledgerhq/live-countervalues-react@0.16.4
  - @ledgerhq/live-wallet@0.30.1
  - @ledgerhq/wallet-analytics@0.3.1
  - @ledgerhq/wallet-pnl@0.7.4
  - @ledgerhq/ledger-key-ring-protocol@0.17.2
  - @domain/api-currency-token@0.2.3
  - @features/platform-currencies@0.4.1
  - @ledgerhq/asset-aggregation@0.12.1
  - @ledgerhq/live-currency-format@0.14.1
  - @devtools/bindings@0.2.2
  - @features/platform-feature-flags@0.6.3
  - @ledgerhq/hw-ledger-key-ring-protocol@0.11.2
  - @shared/env@0.1.1
  - @ledgerhq/live-dmk-shared@0.29.1
  - @ledgerhq/live-dmk-speculos@0.10.3
  - @features/platform-env@0.1.1

## 4.14.0-next.1

### Patch Changes

- Updated dependencies [[`f79de59`](https://github.com/LedgerHQ/ledger-live/commit/f79de59f95ed384fc2b2e49dfa28efb1a0493d4a)]:
  - @ledgerhq/coin-bitcoin@0.49.0-next.1
  - @ledgerhq/live-common@37.0.0-next.1
  - @ledgerhq/asset-detail@0.9.3-next.1
  - @ledgerhq/live-dmk-desktop@0.20.4-next.1

## 4.14.0-next.0

### Minor Changes

- [#20129](https://github.com/LedgerHQ/ledger-live/pull/20129) [`ba20e39`](https://github.com/LedgerHQ/ledger-live/commit/ba20e3926e52284c04c9bc4e4b17b7c5e34b3cb5) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Migrate `checkLibs` and its two callers off `@ledgerhq/errors` as part of the errors sunset (LIVE-32915).

  `checkLibs` detects duplicated npm packages by comparing class identity, so `sanityChecks.ts` and both app entrypoints must import `NotEnoughBalance` from the same module. All three now use `@ledgerhq/ledger-wallet-framework/errors`. The duplicate-package warning also names `@ledgerhq/ledger-wallet-framework` so the `pnpm why` hint points at the package actually being checked.

- [#19946](https://github.com/LedgerHQ/ledger-live/pull/19946) [`b35f172`](https://github.com/LedgerHQ/ledger-live/commit/b35f1725617f414f219d1da94c1296f153ffc8f9) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - integration tests for Aleo desktop app

- [#19982](https://github.com/LedgerHQ/ledger-live/pull/19982) [`f5e4e87`](https://github.com/LedgerHQ/ledger-live/commit/f5e4e87a114ca8336f310a4b5e39bff650fc0750) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Display estimated pending rewards for 0G delegations; gate claim-rewards UI to chains that support it.

- [#20099](https://github.com/LedgerHQ/ledger-live/pull/20099) [`37dac39`](https://github.com/LedgerHQ/ledger-live/commit/37dac39463de1a44bdb5bc4b1b6b37b0cff68922) Thanks [@deepyjr](https://github.com/deepyjr)! - Add contact address asset and network selection through the Modular Dialog, with shared asset
  filtering across Desktop and Mobile.

- [#19953](https://github.com/LedgerHQ/ledger-live/pull/19953) [`0c57185`](https://github.com/LedgerHQ/ledger-live/commit/0c571858b3badf4d9e9c706ca0f9aaca3e925310) Thanks [@deepyjr](https://github.com/deepyjr)! - Stabilize Wallet API drawer navigation smoke test.

- [#20146](https://github.com/LedgerHQ/ledger-live/pull/20146) [`8a6b086`](https://github.com/LedgerHQ/ledger-live/commit/8a6b0868b0f0d760d83ece3edafa40716df4fc2f) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix Desktop contacts list scroll so the add contact row stays full size at the end of the list.

- [#20050](https://github.com/LedgerHQ/ledger-live/pull/20050) [`4c34536`](https://github.com/LedgerHQ/ledger-live/commit/4c345363f061fb4a525684ae45ce437ea12e77d7) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Remove Custom Lock Screen step from the post-onboarding widget.

- [#19994](https://github.com/LedgerHQ/ledger-live/pull/19994) [`0f61d63`](https://github.com/LedgerHQ/ledger-live/commit/0f61d637855072b4352cb3e6901a4ed9986a0bbd) Thanks [@sarneijim](https://github.com/sarneijim)! - Update large-screen upsell modal UTM attribution on mobile and desktop

- [#19970](https://github.com/LedgerHQ/ledger-live/pull/19970) [`192273e`](https://github.com/LedgerHQ/ledger-live/commit/192273e07f22435e9cea149a8d82a7aa4f1e481f) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Hide sidebar on Recover and Perps fullscreen webview routes

- [#19904](https://github.com/LedgerHQ/ledger-live/pull/19904) [`5f383b4`](https://github.com/LedgerHQ/ledger-live/commit/5f383b404f53f44a0b3451a04060958181dadc9e) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Fix analytics confidentiality filter to scrub account IDs from tracked events

- [#19995](https://github.com/LedgerHQ/ledger-live/pull/19995) [`281a7f3`](https://github.com/LedgerHQ/ledger-live/commit/281a7f358d6fe176a0cbba349d081942ed32ea64) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Render validation errors in the Desktop add contact dialog.

- [#20009](https://github.com/LedgerHQ/ledger-live/pull/20009) [`341ea10`](https://github.com/LedgerHQ/ledger-live/commit/341ea108e30bf8af9abeb6eed484ee4b2c7c4a43) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Revert Cardano firmware app v8.0.4 support (hw-app-cardano bump to 8.0.0)

- [#19985](https://github.com/LedgerHQ/ledger-live/pull/19985) [`808c4cd`](https://github.com/LedgerHQ/ledger-live/commit/808c4cd479e509210ea9537fe972251cfd8d04f7) Thanks [@deepyjr](https://github.com/deepyjr)! - Reorganize the contacts flow package around a /steps folder (List, AddContact, Introduction, Detail), promote shared helpers to src/utils, curate root barrels, and rename public views to ContactsListView and ContactDetailView. No runtime behavior change.

- [#20070](https://github.com/LedgerHQ/ledger-live/pull/20070) [`52253f7`](https://github.com/LedgerHQ/ledger-live/commit/52253f70c302056cdc6b367cdd8b1db408b5e07d) Thanks [@ysitbon](https://github.com/ysitbon)! - Remove the now-dead `@ledgerhq/cryptoassets` currency/fiat store injection from the app bootstraps. Nothing reads the legacy currency/fiat accessors anymore (the runtime source of truth is the domain-backed wallet-framework currency resolver), so `setCryptoCurrenciesStore` / `setFiatCurrenciesStore` injected a store no consumer queried. Drop the calls, drop the `@ledgerhq/cryptoassets` dependency from the apps, and remove the remaining stale references to the package in comments.

- [#20163](https://github.com/LedgerHQ/ledger-live/pull/20163) [`edab816`](https://github.com/LedgerHQ/ledger-live/commit/edab816584999d93a63d703c0a56238720eae70f) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Round market table row corners on hover (asset discoverability view)

- [#20023](https://github.com/LedgerHQ/ledger-live/pull/20023) [`5ad8f9e`](https://github.com/LedgerHQ/ledger-live/commit/5ad8f9e6b323222b1fe98aec246597da6d540cee) Thanks [@deepyjr](https://github.com/deepyjr)! - Start the shared Add Address flow from Desktop contact details

- [#20118](https://github.com/LedgerHQ/ledger-live/pull/20118) [`5de8391`](https://github.com/LedgerHQ/ledger-live/commit/5de839159cbd681c5a764976197ca4f028195124) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add populated contact detail with network-grouped address rows, crypto icons, and shared address detail dialog.

- [#20116](https://github.com/LedgerHQ/ledger-live/pull/20116) [`fce013c`](https://github.com/LedgerHQ/ledger-live/commit/fce013c5a37df9e300c3b3b147f29e2cf92c9121) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Fix dialog buttons doing nothing while a side drawer is open, by releasing the drawer focus trap when a dialog opens

- [#20091](https://github.com/LedgerHQ/ledger-live/pull/20091) [`ef5945a`](https://github.com/LedgerHQ/ledger-live/commit/ef5945a991c2d93259c414091bb276f527f8cbae) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Bump Lumen design-system packages to latest (design-core 0.1.23, ui-react 0.1.49, ui-rnative 0.1.52, ui-react-visualization 0.1.28, ui-rnative-visualization 0.1.29).

  - Migrate the desktop tables to the new `TableCellContent` compound API (`TableCellItem` / `TableCellContent` / `TableCellContentTitle` / `TableCellContentDescription` / `TableCellContentRow`).
  - Migrate the interactive My Wallet avatar to the new `AvatarButton` component on both apps, and fix the vertical centering of the desktop top-bar trigger.
  - Use the currency image fallback (`MediaImage`, circular) in the market list so it matches the crypto-icon shape.
  - Simplify `getDotIndicatorProps` avatar sizing now that the helper is typed for the full avatar size range.

- [#19892](https://github.com/LedgerHQ/ledger-live/pull/19892) [`66edf4d`](https://github.com/LedgerHQ/ledger-live/commit/66edf4da2d94165a82f36680f3df323f1a62b45e) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add the Desktop Add contact dialog and shared web form wired to add-contact state.

- [#19805](https://github.com/LedgerHQ/ledger-live/pull/19805) [`b1d3f26`](https://github.com/LedgerHQ/ledger-live/commit/b1d3f26cbdf67c439bc125bdda1f1c56c9753f2e) Thanks [@ishaba](https://github.com/ishaba)! - feat(send): add default-fee strategy to the new send flow

- [#20072](https://github.com/LedgerHQ/ledger-live/pull/20072) [`524d763`](https://github.com/LedgerHQ/ledger-live/commit/524d7636d85a79379a9b086323d3121f3199bd1f) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Remove deprecated storyly feature flag, types, and orphaned i18n keys.

- [#19998](https://github.com/LedgerHQ/ledger-live/pull/19998) [`e4e009f`](https://github.com/LedgerHQ/ledger-live/commit/e4e009f60792d3d0c9dd79c19406b02cec66b22b) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Render Desktop contact detail empty state using shared flow-contacts Detail step.

- [#20180](https://github.com/LedgerHQ/ledger-live/pull/20180) [`dd7758b`](https://github.com/LedgerHQ/ledger-live/commit/dd7758bfa16c6b73b60da072a50c22f3b132c1a2) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Show 8 characters on each side of the ellipsis when truncating the recipient address in the new send flow, consistently across mobile and desktop

- [#19996](https://github.com/LedgerHQ/ledger-live/pull/19996) [`c9dddf2`](https://github.com/LedgerHQ/ledger-live/commit/c9dddf21f6e3208a077aa72bd575f56415287074) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwm): changes bottomsheet to sheet info and minor fixes on lwm

- [#20127](https://github.com/LedgerHQ/ledger-live/pull/20127) [`e7b8ddc`](https://github.com/LedgerHQ/ledger-live/commit/e7b8ddc239b88c1fbf0751c468218d9263f56859) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: aleo tokens swap incompatibility warning

- [#19941](https://github.com/LedgerHQ/ledger-live/pull/19941) [`af5ff9e`](https://github.com/LedgerHQ/ledger-live/commit/af5ff9ebd17f3dc4fd4234e48f3fa0dd27af2f94) Thanks [@deepyjr](https://github.com/deepyjr)! - Fix zero price variations in Desktop asset search results.

- [#19925](https://github.com/LedgerHQ/ledger-live/pull/19925) [`72969ec`](https://github.com/LedgerHQ/ledger-live/commit/72969ecd9ae1f6ff8ba380fba1e7f96297f81bbc) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Track input mode (fiat or crypto) when clicking review on the new send flow amount screen

- [#20068](https://github.com/LedgerHQ/ledger-live/pull/20068) [`644aefb`](https://github.com/LedgerHQ/ledger-live/commit/644aefbb471f91eb0be7817b665cf773cf3250b1) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - fix empty asset ledger desktop

- [#20190](https://github.com/LedgerHQ/ledger-live/pull/20190) [`a8d6e25`](https://github.com/LedgerHQ/ledger-live/commit/a8d6e25c0467572fbbc0cd3b35f90d355542b1f7) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(lwdm): new send flow wait for valid address to display memo

- [#20097](https://github.com/LedgerHQ/ledger-live/pull/20097) [`7efe94e`](https://github.com/LedgerHQ/ledger-live/commit/7efe94e4dfa707fb0c23ff819791194d33ac5d8f) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - changes to self transfer label for Aleo

- [#19637](https://github.com/LedgerHQ/ledger-live/pull/19637) [`07c9576`](https://github.com/LedgerHQ/ledger-live/commit/07c957630a5f271ceac66eb0ecde6c2a690e689b) Thanks [@semeano](https://github.com/semeano)! - Zcash send modal updated; add memo field

### Patch Changes

- Updated dependencies [[`1070564`](https://github.com/LedgerHQ/ledger-live/commit/107056410174d3da2d45c468232a8d742aea021f), [`ba20e39`](https://github.com/LedgerHQ/ledger-live/commit/ba20e3926e52284c04c9bc4e4b17b7c5e34b3cb5), [`2e1aecc`](https://github.com/LedgerHQ/ledger-live/commit/2e1aeccf6c91761c5d09c91e4be10dcc8c22eb7b), [`ba69273`](https://github.com/LedgerHQ/ledger-live/commit/ba692732b521c42f934acf540641ecbfdb837004), [`1af9ec9`](https://github.com/LedgerHQ/ledger-live/commit/1af9ec984928e0bf5fd23ce12edcc6131b0302a0), [`f5e4e87`](https://github.com/LedgerHQ/ledger-live/commit/f5e4e87a114ca8336f310a4b5e39bff650fc0750), [`37dac39`](https://github.com/LedgerHQ/ledger-live/commit/37dac39463de1a44bdb5bc4b1b6b37b0cff68922), [`dbffe41`](https://github.com/LedgerHQ/ledger-live/commit/dbffe417f903844a973b7a284206e7313b7a8e5a), [`86bbd1d`](https://github.com/LedgerHQ/ledger-live/commit/86bbd1d829ee60b76af040c064d93acc15561855), [`54b3d2b`](https://github.com/LedgerHQ/ledger-live/commit/54b3d2b6032f1336d4d9fb2e238fa2347e45cc81), [`8a6b086`](https://github.com/LedgerHQ/ledger-live/commit/8a6b0868b0f0d760d83ece3edafa40716df4fc2f), [`0f61d63`](https://github.com/LedgerHQ/ledger-live/commit/0f61d637855072b4352cb3e6901a4ed9986a0bbd), [`008228e`](https://github.com/LedgerHQ/ledger-live/commit/008228ee22ba86b8aabe50c50d9c2e5e63771add), [`281a7f3`](https://github.com/LedgerHQ/ledger-live/commit/281a7f358d6fe176a0cbba349d081942ed32ea64), [`cee41c4`](https://github.com/LedgerHQ/ledger-live/commit/cee41c4e7a7c7e042d4df39d5a34591d72d723d0), [`341ea10`](https://github.com/LedgerHQ/ledger-live/commit/341ea108e30bf8af9abeb6eed484ee4b2c7c4a43), [`2e410a6`](https://github.com/LedgerHQ/ledger-live/commit/2e410a67f5a88b5cb8d79184b97bcded0d4eaadf), [`808c4cd`](https://github.com/LedgerHQ/ledger-live/commit/808c4cd479e509210ea9537fe972251cfd8d04f7), [`8ab9e50`](https://github.com/LedgerHQ/ledger-live/commit/8ab9e504a5b004e28f5e80f490b837b3c2526f44), [`4148019`](https://github.com/LedgerHQ/ledger-live/commit/414801922232b6d9514270e8876e783c11555c2c), [`1e4e519`](https://github.com/LedgerHQ/ledger-live/commit/1e4e51913a9b1971056789ac24ed05092529d799), [`52253f7`](https://github.com/LedgerHQ/ledger-live/commit/52253f70c302056cdc6b367cdd8b1db408b5e07d), [`4ce5257`](https://github.com/LedgerHQ/ledger-live/commit/4ce52570577d471d4af0609058ac6b9b03ad1949), [`91da072`](https://github.com/LedgerHQ/ledger-live/commit/91da072ea17f564824d6c04d13934ec88d86d348), [`e58258b`](https://github.com/LedgerHQ/ledger-live/commit/e58258b3a130ba606bdf8d882b02d59eb3571082), [`452adf8`](https://github.com/LedgerHQ/ledger-live/commit/452adf85380d1cb74f1894478cdd84849b120ef4), [`112b63f`](https://github.com/LedgerHQ/ledger-live/commit/112b63f8d33a8e26b316ce4542ef23460ae54937), [`44798f3`](https://github.com/LedgerHQ/ledger-live/commit/44798f392deb662a5f60123651ece2b320fbf946), [`d7600fb`](https://github.com/LedgerHQ/ledger-live/commit/d7600fb21e73581fbfb20019a78109b9a5c9abff), [`6131b15`](https://github.com/LedgerHQ/ledger-live/commit/6131b15d376b0ea2677df401564872a9c19d2151), [`f334b43`](https://github.com/LedgerHQ/ledger-live/commit/f334b430c82892f603221fb3ffe5d3964215bcad), [`67df284`](https://github.com/LedgerHQ/ledger-live/commit/67df284e2ccb916cff51896e42ef21846249b3e7), [`18bc180`](https://github.com/LedgerHQ/ledger-live/commit/18bc180446f0d7410a3aedd953e2fb0ce2b43f4c), [`26ee89d`](https://github.com/LedgerHQ/ledger-live/commit/26ee89d7e3bba9b800a7b6f08db52b079fcd8bd5), [`5de8391`](https://github.com/LedgerHQ/ledger-live/commit/5de839159cbd681c5a764976197ca4f028195124), [`66edf4d`](https://github.com/LedgerHQ/ledger-live/commit/66edf4da2d94165a82f36680f3df323f1a62b45e), [`b1d3f26`](https://github.com/LedgerHQ/ledger-live/commit/b1d3f26cbdf67c439bc125bdda1f1c56c9753f2e), [`a534db5`](https://github.com/LedgerHQ/ledger-live/commit/a534db5c41da6957d38a330c1da6f7db1b693763), [`c622459`](https://github.com/LedgerHQ/ledger-live/commit/c622459fcbff5dcc094ee10eb360f2a835036007), [`524d763`](https://github.com/LedgerHQ/ledger-live/commit/524d7636d85a79379a9b086323d3121f3199bd1f), [`e4e009f`](https://github.com/LedgerHQ/ledger-live/commit/e4e009f60792d3d0c9dd79c19406b02cec66b22b), [`dd7758b`](https://github.com/LedgerHQ/ledger-live/commit/dd7758bfa16c6b73b60da072a50c22f3b132c1a2), [`c9dddf2`](https://github.com/LedgerHQ/ledger-live/commit/c9dddf21f6e3208a077aa72bd575f56415287074), [`e7b8ddc`](https://github.com/LedgerHQ/ledger-live/commit/e7b8ddc239b88c1fbf0751c468218d9263f56859), [`e6a9b97`](https://github.com/LedgerHQ/ledger-live/commit/e6a9b973d05af98987c094d591342031f273b31c), [`dbf8acf`](https://github.com/LedgerHQ/ledger-live/commit/dbf8acf27c9405548e7eb559d163a8e0883a20aa), [`dfab01f`](https://github.com/LedgerHQ/ledger-live/commit/dfab01f36460bd4e0ea0b0c13aa3d965aef945cd), [`a8d6e25`](https://github.com/LedgerHQ/ledger-live/commit/a8d6e25c0467572fbbc0cd3b35f90d355542b1f7), [`aa27732`](https://github.com/LedgerHQ/ledger-live/commit/aa2773257ffa4480b33c2a219c9986eb40e293fb), [`aa27732`](https://github.com/LedgerHQ/ledger-live/commit/aa2773257ffa4480b33c2a219c9986eb40e293fb), [`f8b5b51`](https://github.com/LedgerHQ/ledger-live/commit/f8b5b51856c57c68ca50d13b00d124d261c26504)]:
  - @ledgerhq/errors@7.0.0-next.0
  - @ledgerhq/live-common@37.0.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.6.0-next.0
  - @ledgerhq/coin-bitcoin@0.49.0-next.0
  - @ledgerhq/coin-canton@0.31.0-next.0
  - @ledgerhq/coin-cardano@0.32.0-next.0
  - @ledgerhq/coin-casper@2.17.0-next.0
  - @ledgerhq/coin-concordium@0.18.0-next.0
  - @ledgerhq/coin-cosmos@0.41.0-next.0
  - @ledgerhq/coin-evm@4.8.0-next.0
  - @ledgerhq/coin-filecoin@1.30.0-next.0
  - @ledgerhq/live-network@3.0.0-next.0
  - @features/flow-contacts@0.4.0-next.0
  - @features/flow-large-screen-upsell@0.4.0-next.0
  - @domain/entity-currency-crypto@0.8.0-next.0
  - @domain/entity-currency-token@0.3.0-next.0
  - @domain/entity-currency@0.3.0-next.0
  - @ledgerhq/wallet-btc@0.3.0-next.0
  - @ledgerhq/live-countervalues@0.24.0-next.0
  - @domain/entity-contact@0.4.0-next.0
  - @shared/feature-flags@0.16.0-next.0
  - @devtools/shell@0.6.0-next.0
  - @ledgerhq/types-live@6.117.0-next.0
  - @ledgerhq/domain-service@1.8.12-next.0
  - @ledgerhq/hw-transport@6.35.7-next.0
  - @ledgerhq/hw-transport-http@6.36.7-next.0
  - @ledgerhq/hw-transport-vault@1.7.7-next.0
  - @ledgerhq/asset-detail@0.9.3-next.0
  - @ledgerhq/live-dmk-desktop@0.20.4-next.0
  - @ledgerhq/live-countervalues-react@0.16.4-next.0
  - @ledgerhq/live-wallet@0.30.1-next.0
  - @ledgerhq/wallet-analytics@0.3.1-next.0
  - @ledgerhq/wallet-pnl@0.7.4-next.0
  - @ledgerhq/ledger-key-ring-protocol@0.17.2-next.0
  - @domain/api-currency-token@0.2.3-next.0
  - @features/platform-currencies@0.4.1-next.0
  - @ledgerhq/asset-aggregation@0.12.1-next.0
  - @ledgerhq/live-currency-format@0.14.1-next.0
  - @devtools/bindings@0.2.2-next.0
  - @features/platform-feature-flags@0.6.3-next.0
  - @ledgerhq/hw-ledger-key-ring-protocol@0.11.2-next.0
  - @shared/env@0.1.1-next.0
  - @ledgerhq/live-dmk-shared@0.29.1-next.0
  - @ledgerhq/live-dmk-speculos@0.10.3-next.0
  - @features/platform-env@0.1.1-next.0

## 4.13.1

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/live-common@36.6.1
  - @ledgerhq/asset-detail@0.9.2
  - @ledgerhq/live-dmk-desktop@0.20.3

## 4.13.1-hotfix.0

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/live-common@36.6.1-hotfix.0
  - @ledgerhq/asset-detail@0.9.2-hotfix.0
  - @ledgerhq/live-dmk-desktop@0.20.3-hotfix.0

## 4.13.0

### Minor Changes

- [#19843](https://github.com/LedgerHQ/ledger-live/pull/19843) [`6f30183`](https://github.com/LedgerHQ/ledger-live/commit/6f30183f9abdd21cf2e732eefacd339cad73b5bc) Thanks [@amaslakov](https://github.com/amaslakov)! - Fix InputCurrency not applying external value updates (e.g. amount presets) when focused after typing

- [#19813](https://github.com/LedgerHQ/ledger-live/pull/19813) [`928f6e2`](https://github.com/LedgerHQ/ledger-live/commit/928f6e2745d9713c12a8986d46bb3d7e31b5918a) Thanks [@aussedatlo](https://github.com/aussedatlo)! - bump @ledgerhq/context-module to 2.3.0

- [#19799](https://github.com/LedgerHQ/ledger-live/pull/19799) [`65b276f`](https://github.com/LedgerHQ/ledger-live/commit/65b276f370586b1e2f76f2425753dd6e3a535599) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Fix double Ledger Recover upsell trigger after re-onboarding post-onboarding navigation

- [#19854](https://github.com/LedgerHQ/ledger-live/pull/19854) [`c3c5329`](https://github.com/LedgerHQ/ledger-live/commit/c3c5329ffe69ed47a1f3a8910ae7fd8b53486f24) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(algo): restore Algorand memo in new send flow with protocol 1024-byte note limit

- [#19927](https://github.com/LedgerHQ/ledger-live/pull/19927) [`c22be1e`](https://github.com/LedgerHQ/ledger-live/commit/c22be1ebd9598f04cbc6c04811832c4811d99b13) Thanks [@sarneijim](https://github.com/sarneijim)! - Update the Desktop large-screen upsell opt-out copy and CTA.

- [#19794](https://github.com/LedgerHQ/ledger-live/pull/19794) [`2388d41`](https://github.com/LedgerHQ/ledger-live/commit/2388d4171bd2e5caa2009e8eadcd06548d2209ef) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Handle non-onboarded devices according to the requirements of each Connect App flow

- [#19759](https://github.com/LedgerHQ/ledger-live/pull/19759) [`9b837a7`](https://github.com/LedgerHQ/ledger-live/commit/9b837a7366ea199b58c0f9d2582f8f557e5c1a92) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Fix InputCurrency not reflecting external value updates when focused without typing

- [#19625](https://github.com/LedgerHQ/ledger-live/pull/19625) [`28c29a1`](https://github.com/LedgerHQ/ledger-live/commit/28c29a1e6f4c28edfeba59483876b130a6e6b97c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove findCryptoCurrencyByTicker re-lookups in market counter-value formatting and detection paths

- [#19787](https://github.com/LedgerHQ/ledger-live/pull/19787) [`b09b30b`](https://github.com/LedgerHQ/ledger-live/commit/b09b30b236ecf0d3668b3bcc460560b4ccd127dc) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Extract NightlyLayer into MVVM component and improve prerelease watermark visibility

- [#19990](https://github.com/LedgerHQ/ledger-live/pull/19990) [`b2fe0f0`](https://github.com/LedgerHQ/ledger-live/commit/b2fe0f0b9bf9cb5976f4d7f21e24654d60acfcf2) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Revert Cardano firmware app v8.0.4 support (hw-app-cardano bump to 8.0.0)

- [#19666](https://github.com/LedgerHQ/ledger-live/pull/19666) [`732faa2`](https://github.com/LedgerHQ/ledger-live/commit/732faa27e81899b49a08e6a9c8fe2c8b75ac17ea) Thanks [@deepyjr](https://github.com/deepyjr)! - Add mock Ledger Sync presentation variants to Desktop Contacts.

- [#19905](https://github.com/LedgerHQ/ledger-live/pull/19905) [`ae9897a`](https://github.com/LedgerHQ/ledger-live/commit/ae9897ad91b89bed89be1d51d73ec5666d337d19) Thanks [@koda-apps](https://github.com/apps/koda-apps)! - fix(send): hide balance in send modal header when discreet mode is enabled

- [#19778](https://github.com/LedgerHQ/ledger-live/pull/19778) [`f6e5b74`](https://github.com/LedgerHQ/ledger-live/commit/f6e5b7453015db453e604052b115dd9996f266fa) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(lwdm): fix wrong memo label i18n id

- [#19893](https://github.com/LedgerHQ/ledger-live/pull/19893) [`47a347b`](https://github.com/LedgerHQ/ledger-live/commit/47a347b17aae8d90527e8eef23bcfcbbdc7df0d1) Thanks [@qperrot](https://github.com/qperrot)! - Fix: no default selection when validator is not a ledger one

- [#19707](https://github.com/LedgerHQ/ledger-live/pull/19707) [`ea28df4`](https://github.com/LedgerHQ/ledger-live/commit/ea28df4a67e1c1f64ab0de5fddf7fc016edffa8c) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Hide Send and Receive for HyperCore accounts on desktop: HyperCore has no on-chain send on Ledger Wallet and a plain receive is misleading (deposits go through bridging). Both actions are now hidden across the account page, the account context menu and the empty-account state. Also drop the HyperCore per-transaction explorer view: the perps proxy exposes no HyperCore tx hash (deposits settle on Arbitrum, withdrawals expose no link), so the `tx` explorer URL was always broken — only the address explorer view is kept. Finally, the currency is renamed from "Hyperliquid (HyperCore)" to "Hyperliquid".

- [#19702](https://github.com/LedgerHQ/ledger-live/pull/19702) [`6935fe0`](https://github.com/LedgerHQ/ledger-live/commit/6935fe04a6304e046fd217350399446194e96d47) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Add HyperCore support by plugging `@ledgerhq/coin-hypercore` into the generic coin framework: register the `hypercore` native currency (USDC, magnitude 6), route the family through the generic bridge, reuse the EVM signer for address derivation (HyperCore shares the Ethereum address), and add the `currencyHypercore` feature flag. HyperCore accounts can be discovered and serve their balance and operations from the coin module. In the history, HyperCore operations are labelled "Deposit"/"Withdraw" instead of "Received"/"Sent" (deposits/withdrawals go through bridging, not a plain transfer).

- [#19864](https://github.com/LedgerHQ/ledger-live/pull/19864) [`83e4f6e`](https://github.com/LedgerHQ/ledger-live/commit/83e4f6e578a4212b302956b270a39b4160704ce4) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Show a currency-specific disabled tooltip on the EVM Undelegate button: 0G explains the 1 Gwei minimum shares threshold; SEI explains the 7-validator limit.

- [#19736](https://github.com/LedgerHQ/ledger-live/pull/19736) [`2eac6a1`](https://github.com/LedgerHQ/ledger-live/commit/2eac6a17b629be3f8ba08cdf650413083b89476e) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Extract the shared UTXO engine (xpub scanning, coin-selection, storage, address crypto) into a standalone `@ledgerhq/wallet-btc` package, dependency-inverted so it no longer imports `@ledgerhq/cryptoassets` or `@ledgerhq/ledger-wallet-framework`: the currency is injected as a typed `WalletBtcCurrency`. Transaction build/sign, RBF fee computation, the device signer, and the `getWalletAccount` resolver stay in `@ledgerhq/coin-bitcoin`. Internal refactor with no behavior change; consumers (`@ledgerhq/live-common`, `ledger-live-desktop`) are rewired to the new import paths.

- [#19903](https://github.com/LedgerHQ/ledger-live/pull/19903) [`2a61c00`](https://github.com/LedgerHQ/ledger-live/commit/2a61c004855f925422e2c674f4bf2a28ba44dd88) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Wire the Contacts feature introduction on Desktop with persisted dismissal, defer navigation, integration coverage, and a dev-menu toggle to reset the intro.

- [#19712](https://github.com/LedgerHQ/ledger-live/pull/19712) [`fd1e33b`](https://github.com/LedgerHQ/ledger-live/commit/fd1e33bb3976c8986e16579a4995c9fcf4dc52aa) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Render the populated Desktop Contacts list and add Dev Tool controls to load mock contacts for testing.

- [#19730](https://github.com/LedgerHQ/ledger-live/pull/19730) [`067b570`](https://github.com/LedgerHQ/ledger-live/commit/067b57005f76858bdaf2699dffde07ada4b5fa86) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Render Desktop Contacts search results and no-result state

- [#19713](https://github.com/LedgerHQ/ledger-live/pull/19713) [`9357647`](https://github.com/LedgerHQ/ledger-live/commit/93576473a2ffc466d06d27f752b8b89de77a64f5) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add large-screen upsell QA debug screen and domain setters for simulating modal state

- [#19734](https://github.com/LedgerHQ/ledger-live/pull/19734) [`bb2d2d2`](https://github.com/LedgerHQ/ledger-live/commit/bb2d2d250a1d5b8cde43ba963795d28b10b48be6) Thanks [@ishaba](https://github.com/ishaba)! - remove umee chain related code

- [#19875](https://github.com/LedgerHQ/ledger-live/pull/19875) [`59a6c82`](https://github.com/LedgerHQ/ledger-live/commit/59a6c82a784b4f484b5fb6a5ea42b6ebb1115818) Thanks [@sarneijim](https://github.com/sarneijim)! - Gate the large-screen upsell modal by the enabled state of the selected opt-in variant

- [#18413](https://github.com/LedgerHQ/ledger-live/pull/18413) [`c498e25`](https://github.com/LedgerHQ/ledger-live/commit/c498e25ca9f4b6ef5c4e3dfd370dab44ccdebc0f) Thanks [@sarneijim](https://github.com/sarneijim)! - Remove lldActionCarousel feature flag (always enabled with variant A)

- [#19745](https://github.com/LedgerHQ/ledger-live/pull/19745) [`6b86a70`](https://github.com/LedgerHQ/ledger-live/commit/6b86a70f0ee2a67b7b967abbf06084d6e0e63bdb) Thanks [@lewisd5](https://github.com/lewisd5)! - Removing update banner for certain distribution channels

- [#19884](https://github.com/LedgerHQ/ledger-live/pull/19884) [`f9f5db4`](https://github.com/LedgerHQ/ledger-live/commit/f9f5db46534f5294fdbb3fe12a971ed4f11e6c2d) Thanks [@qperrot](https://github.com/qperrot)! - Add data-driven delegation-visibility-delay notice on the EVM staking delegate amount step (Somnia: 5 minutes)

- [#19347](https://github.com/LedgerHQ/ledger-live/pull/19347) [`e94170f`](https://github.com/LedgerHQ/ledger-live/commit/e94170fd6014838a721db595b6260bfbde4fbbac) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Upgrade Electron from 42 to 43 for boot-time performance improvements

- [#19847](https://github.com/LedgerHQ/ledger-live/pull/19847) [`6abc9e6`](https://github.com/LedgerHQ/ledger-live/commit/6abc9e6e4e2338a2aa5928fc2c30690eb99e8717) Thanks [@gre-ledger](https://github.com/gre-ledger)! - chore(errors): replace instanceof guards with .name string checks

- [#19359](https://github.com/LedgerHQ/ledger-live/pull/19359) [`a6bdd26`](https://github.com/LedgerHQ/ledger-live/commit/a6bdd265628036e25954ac6a9998ea8296a3bdf3) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - Asset Pre-selection Logic on Asset Page

- [#19918](https://github.com/LedgerHQ/ledger-live/pull/19918) [`b4ecf97`](https://github.com/LedgerHQ/ledger-live/commit/b4ecf97c0d16a686078c995f7218a256916a9e39) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - EVM staking: 0G unbonding table (skip completed entries), rewards column visibility per chain

- [#19533](https://github.com/LedgerHQ/ledger-live/pull/19533) [`d63b9ef`](https://github.com/LedgerHQ/ledger-live/commit/d63b9efdc035ddc33a11fcc6877cd6b63f22ec3e) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Add a TRON send-flow network-fees explanation on the amount screen. The fee row now shows the cost in both fiat and TRX (e.g. `$4.12 • 0.000056 TRX`, or `$0 • 0 TRX` when staked energy and bandwidth cover the transfer), and an info tooltip (desktop) / drawer (mobile) explains whether resources cover the fee or it is paid by burning TRX. Implemented via two family-agnostic send-descriptor accessors (`getNetworkFeesInfo` for the copy, `showFeeCurrencyAmount` for the fee-row display). Other currencies are unchanged.

- [#19956](https://github.com/LedgerHQ/ledger-live/pull/19956) [`3c9a320`](https://github.com/LedgerHQ/ledger-live/commit/3c9a320e5ab6a8483ecf68cd53b31c96798a3a7d) Thanks [@lewisd5](https://github.com/lewisd5)! - Small CI patch

### Patch Changes

- Updated dependencies [[`f57602a`](https://github.com/LedgerHQ/ledger-live/commit/f57602a679ed08b437955a2858f84e3086d6e417), [`0ee3ad8`](https://github.com/LedgerHQ/ledger-live/commit/0ee3ad8ef853baa7b17bb4ca07f41f1bed12268e), [`c3c5329`](https://github.com/LedgerHQ/ledger-live/commit/c3c5329ffe69ed47a1f3a8910ae7fd8b53486f24), [`c22be1e`](https://github.com/LedgerHQ/ledger-live/commit/c22be1ebd9598f04cbc6c04811832c4811d99b13), [`6b6f59e`](https://github.com/LedgerHQ/ledger-live/commit/6b6f59e77df6fc6794c13d12f476733624a53c96), [`a306abb`](https://github.com/LedgerHQ/ledger-live/commit/a306abbb605751b5b8741d8d7d69d2bf7f78a49b), [`7708345`](https://github.com/LedgerHQ/ledger-live/commit/77083455c985349f5a2061db4c22b2fa8ce758f9), [`a128521`](https://github.com/LedgerHQ/ledger-live/commit/a1285211f0482229e5011505fb9e8c9d473cb86a), [`2388d41`](https://github.com/LedgerHQ/ledger-live/commit/2388d4171bd2e5caa2009e8eadcd06548d2209ef), [`28c29a1`](https://github.com/LedgerHQ/ledger-live/commit/28c29a1e6f4c28edfeba59483876b130a6e6b97c), [`6ed8225`](https://github.com/LedgerHQ/ledger-live/commit/6ed8225f2434f70d587aa046e39262c21b538f27), [`f115fc2`](https://github.com/LedgerHQ/ledger-live/commit/f115fc2cd159bd170bee3b9cdcc3f65f521017db), [`b2fe0f0`](https://github.com/LedgerHQ/ledger-live/commit/b2fe0f0b9bf9cb5976f4d7f21e24654d60acfcf2), [`732faa2`](https://github.com/LedgerHQ/ledger-live/commit/732faa27e81899b49a08e6a9c8fe2c8b75ac17ea), [`022f431`](https://github.com/LedgerHQ/ledger-live/commit/022f43122a713f9d4b2e10daaec0d44c91b58c9f), [`ee1f9f3`](https://github.com/LedgerHQ/ledger-live/commit/ee1f9f3ae9f620328a975b7f8ad75a3437f8875b), [`cdf6cf4`](https://github.com/LedgerHQ/ledger-live/commit/cdf6cf40d658b20dd21a7eabe3615c75baf4cb0a), [`d243bd0`](https://github.com/LedgerHQ/ledger-live/commit/d243bd0cd2489a836961a724e60f6049a27f74d6), [`d942108`](https://github.com/LedgerHQ/ledger-live/commit/d9421087b45b4a0febaee63b1f1a097c2f42a2a5), [`d7f59ec`](https://github.com/LedgerHQ/ledger-live/commit/d7f59ecfa0e7a549b0206042738244ec89c68b95), [`35e9528`](https://github.com/LedgerHQ/ledger-live/commit/35e952874f86878788d636d7d362d239374738cd), [`f6e5b74`](https://github.com/LedgerHQ/ledger-live/commit/f6e5b7453015db453e604052b115dd9996f266fa), [`22d4a88`](https://github.com/LedgerHQ/ledger-live/commit/22d4a888228b7e5409593a2d6af072b4ab07bb07), [`105ef90`](https://github.com/LedgerHQ/ledger-live/commit/105ef905bdb80022997d86729ccddbc220841bae), [`54f1527`](https://github.com/LedgerHQ/ledger-live/commit/54f152730b059d48ff2b14394b405606e08a886a), [`ea28df4`](https://github.com/LedgerHQ/ledger-live/commit/ea28df4a67e1c1f64ab0de5fddf7fc016edffa8c), [`6935fe0`](https://github.com/LedgerHQ/ledger-live/commit/6935fe04a6304e046fd217350399446194e96d47), [`9bca613`](https://github.com/LedgerHQ/ledger-live/commit/9bca6135575e4a05db6fdccffa61173b5a438115), [`f8164bd`](https://github.com/LedgerHQ/ledger-live/commit/f8164bdd7fb0dc138c399d424eda1c8c129dd477), [`5c5e022`](https://github.com/LedgerHQ/ledger-live/commit/5c5e022e870e44adcb59215e6a672838b0194310), [`404072e`](https://github.com/LedgerHQ/ledger-live/commit/404072eca7c9fa94ba4da55218504b9a5be07983), [`d43ab1d`](https://github.com/LedgerHQ/ledger-live/commit/d43ab1d5dcc111534b1633f4da051787d0ef3d2f), [`8e21dc0`](https://github.com/LedgerHQ/ledger-live/commit/8e21dc0eee799be29803d63b582da3463f1593b3), [`762b5eb`](https://github.com/LedgerHQ/ledger-live/commit/762b5ebf332566879a10ab1f16ef85a3da360fe7), [`2eac6a1`](https://github.com/LedgerHQ/ledger-live/commit/2eac6a17b629be3f8ba08cdf650413083b89476e), [`e7caf31`](https://github.com/LedgerHQ/ledger-live/commit/e7caf310efbbf82aa777a7e86ceafe60f11e7193), [`f6ac3dd`](https://github.com/LedgerHQ/ledger-live/commit/f6ac3ddb1bc8fdbbe20cb4222b7229296f61bdba), [`ab74170`](https://github.com/LedgerHQ/ledger-live/commit/ab7417038021e37f932bac5551b862dce6a2c39f), [`fd1e33b`](https://github.com/LedgerHQ/ledger-live/commit/fd1e33bb3976c8986e16579a4995c9fcf4dc52aa), [`067b570`](https://github.com/LedgerHQ/ledger-live/commit/067b57005f76858bdaf2699dffde07ada4b5fa86), [`9357647`](https://github.com/LedgerHQ/ledger-live/commit/93576473a2ffc466d06d27f752b8b89de77a64f5), [`a4b09cf`](https://github.com/LedgerHQ/ledger-live/commit/a4b09cf063a0042a4ba31c350327e8d0ac9aa90c), [`bb2d2d2`](https://github.com/LedgerHQ/ledger-live/commit/bb2d2d250a1d5b8cde43ba963795d28b10b48be6), [`bd21084`](https://github.com/LedgerHQ/ledger-live/commit/bd21084eef567c13225adbd613eacc046856f9d7), [`6b75426`](https://github.com/LedgerHQ/ledger-live/commit/6b7542690a99a365c4b80dfd1fe65e2be594494b), [`669a6d4`](https://github.com/LedgerHQ/ledger-live/commit/669a6d42b2178451e27383c746e3f8fd3d34caef), [`03dbe82`](https://github.com/LedgerHQ/ledger-live/commit/03dbe82bcaff5b4f0aedac2e6ea3cca767a0e05c), [`59a6c82`](https://github.com/LedgerHQ/ledger-live/commit/59a6c82a784b4f484b5fb6a5ea42b6ebb1115818), [`c498e25`](https://github.com/LedgerHQ/ledger-live/commit/c498e25ca9f4b6ef5c4e3dfd370dab44ccdebc0f), [`e1496c5`](https://github.com/LedgerHQ/ledger-live/commit/e1496c5a5b4ab0a2378332d945d81434f58ad503), [`a55b810`](https://github.com/LedgerHQ/ledger-live/commit/a55b81007d49369f18b7ff15b6579c9a0d5de876), [`d50d169`](https://github.com/LedgerHQ/ledger-live/commit/d50d16989e968fbb3ff45f6c463cae886e0e566a), [`f9f5db4`](https://github.com/LedgerHQ/ledger-live/commit/f9f5db46534f5294fdbb3fe12a971ed4f11e6c2d), [`887f8c9`](https://github.com/LedgerHQ/ledger-live/commit/887f8c93e66c2730cbecc1adc09b6a2faa95bba6), [`01a7113`](https://github.com/LedgerHQ/ledger-live/commit/01a71130ab7219637d23222de544e97e668bba47), [`729a6f8`](https://github.com/LedgerHQ/ledger-live/commit/729a6f8bce7914da53b0f404ddc8904fa4339d9f), [`93c54da`](https://github.com/LedgerHQ/ledger-live/commit/93c54daf4076e1163a9b7db86107ab2765b81b5d), [`b4ecf97`](https://github.com/LedgerHQ/ledger-live/commit/b4ecf97c0d16a686078c995f7218a256916a9e39), [`36bbe18`](https://github.com/LedgerHQ/ledger-live/commit/36bbe18500ad6f7aeb74b4a5366994ec7495f761), [`b38b0b1`](https://github.com/LedgerHQ/ledger-live/commit/b38b0b13e8e5c01800bf1234c7ee0f454b04f5cc), [`4d99006`](https://github.com/LedgerHQ/ledger-live/commit/4d99006589b6855d1a06a8aa1ece23c3f6f3ddf7), [`132a4f9`](https://github.com/LedgerHQ/ledger-live/commit/132a4f90adc816f69dfbde1b28e120ad501004c5), [`caa76a1`](https://github.com/LedgerHQ/ledger-live/commit/caa76a113979e2d06c6cb2bb950e75a1f33cbe20), [`d63b9ef`](https://github.com/LedgerHQ/ledger-live/commit/d63b9efdc035ddc33a11fcc6877cd6b63f22ec3e)]:
  - @ledgerhq/live-common@36.6.0
  - @ledgerhq/live-countervalues@0.23.0
  - @ledgerhq/asset-aggregation@0.12.0
  - @ledgerhq/live-wallet@0.30.0
  - @ledgerhq/wallet-analytics@0.3.0
  - @features/flow-large-screen-upsell@0.3.0
  - @features/flow-contacts@0.3.0
  - @ledgerhq/coin-evm@4.7.0
  - @ledgerhq/coin-canton@0.30.0
  - @ledgerhq/coin-cardano@0.31.0
  - @ledgerhq/coin-concordium@0.17.0
  - @ledgerhq/coin-filecoin@1.29.0
  - @ledgerhq/live-dmk-shared@0.29.0
  - @ledgerhq/live-currency-format@0.14.0
  - @ledgerhq/cryptoassets@13.56.0
  - @ledgerhq/types-live@6.116.0
  - @domain/entity-contact@0.3.0
  - @domain/entity-currency-crypto@0.7.0
  - @ledgerhq/wallet-btc@0.2.0
  - @ledgerhq/coin-bitcoin@0.48.0
  - @ledgerhq/live-network@2.7.0
  - @domain/entity-large-screen-upsell-modal@0.3.0
  - @ledgerhq/coin-cosmos@0.40.0
  - @features/platform-currencies@0.4.0
  - @shared/feature-flags@0.15.0
  - @ledgerhq/ledger-wallet-framework@2.5.0
  - @ledgerhq/asset-detail@0.9.1
  - @ledgerhq/live-dmk-desktop@0.20.2
  - @ledgerhq/live-countervalues-react@0.16.3
  - @ledgerhq/wallet-pnl@0.7.3
  - @ledgerhq/coin-casper@2.16.1
  - @ledgerhq/domain-service@1.8.11
  - @domain/api-currency-token@0.2.2
  - @ledgerhq/ledger-key-ring-protocol@0.17.1
  - @devtools/bindings@0.2.1
  - @features/platform-feature-flags@0.6.2
  - @devtools/shell@0.5.2

## 4.13.0-next.2

### Minor Changes

- [#19990](https://github.com/LedgerHQ/ledger-live/pull/19990) [`b2fe0f0`](https://github.com/LedgerHQ/ledger-live/commit/b2fe0f0b9bf9cb5976f4d7f21e24654d60acfcf2) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Revert Cardano firmware app v8.0.4 support (hw-app-cardano bump to 8.0.0)

### Patch Changes

- Updated dependencies [[`b2fe0f0`](https://github.com/LedgerHQ/ledger-live/commit/b2fe0f0b9bf9cb5976f4d7f21e24654d60acfcf2)]:
  - @ledgerhq/live-common@36.6.0-next.1
  - @ledgerhq/asset-detail@0.9.1-next.1
  - @ledgerhq/live-dmk-desktop@0.20.2-next.1

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->

# ledger-live-desktop

## 4.22.0-next.0

### Minor Changes

- [#22004](https://github.com/LedgerHQ/ledger-live/pull/22004) [`c60196a`](https://github.com/LedgerHQ/ledger-live/commit/c60196a636e183ed8c61bd26b621b0790dd5cd94) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Carry the provider app id of the Card login redirect through the desktop deep link

- [#22003](https://github.com/LedgerHQ/ledger-live/pull/22003) [`40d296b`](https://github.com/LedgerHQ/ledger-live/commit/40d296b822381cc5d05616acafa1bca61e500dce) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Record the provider app the Card login redirect names, and send x-us-env on every Card request of a US holder

- [#22150](https://github.com/LedgerHQ/ledger-live/pull/22150) [`731ebd2`](https://github.com/LedgerHQ/ledger-live/commit/731ebd22047779093d5821d38ea53f6f9fc1a694) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Display card reward balance in the desktop card details view

- [#21700](https://github.com/LedgerHQ/ledger-live/pull/21700) [`3702460`](https://github.com/LedgerHQ/ledger-live/commit/3702460abca857d04d8d56499d652b495f0b0c10) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Unlock card numbers with the Ledger Wallet password.

- [#22259](https://github.com/LedgerHQ/ledger-live/pull/22259) [`e4ac322`](https://github.com/LedgerHQ/ledger-live/commit/e4ac322154a1d42e2ac84170802ce88549b7623a) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Wire the card's Manage PIN and Access Baanx rows to open the Baanx hosted pages in the Discover
  webview, and the Help row to open the support article externally.

- [#22077](https://github.com/LedgerHQ/ledger-live/pull/22077) [`72367fc`](https://github.com/LedgerHQ/ledger-live/commit/72367fcf2343fa488008236f1005da589e6e3054) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Wire the card onboarding widget to real, derived onboarding data and remove the unused stub endpoint and legacy devtool mock path it replaces

- [#22093](https://github.com/LedgerHQ/ledger-live/pull/22093) [`2e94d90`](https://github.com/LedgerHQ/ledger-live/commit/2e94d909a573f7e52595a6fe38241f171ea7feab) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Fix available balance showing inflated value for DADA cross-network assets (e.g. Tezos + Etherlink)

- [#21999](https://github.com/LedgerHQ/ledger-live/pull/21999) [`724f029`](https://github.com/LedgerHQ/ledger-live/commit/724f02932ccdf8ba5b8f8f0ccc10b9edbe7547cd) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat(aleo): share the bond pieces between Desktop and Mobile

  Replaces the ad-hoc messages `getTransactionStatus` returned for a rejected bond with typed
  error classes, translated on both clients and now distinguishing a closed validator from an
  unbonding one. Adds the `isValidatorBondable` / `getMinBondAmount` helpers to the coin
  module, moves the per-network default validator into the Aleo currency config so every
  client reads the same address, and adds a reusable Aleo bridge mock for Mobile.

- [#22053](https://github.com/LedgerHQ/ledger-live/pull/22053) [`cf09fa6`](https://github.com/LedgerHQ/ledger-live/commit/cf09fa63c7aa509b1958bc594795895089fdf8de) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - feat(aleo): add the claim unbonded staking flow

- [#21975](https://github.com/LedgerHQ/ledger-live/pull/21975) [`0a5c2a0`](https://github.com/LedgerHQ/ledger-live/commit/0a5c2a0e13782aa3d12a2be1466b604436fcb4ad) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - added Aleo staking operations, gated on the `enableStaking` flag

- [#22123](https://github.com/LedgerHQ/ledger-live/pull/22123) [`b5338ec`](https://github.com/LedgerHQ/ledger-live/commit/b5338ec9173a08073a4b8524fe095428bb710a99) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - feat(aleo): add the shared staking hooks the delegation views read

- [#22212](https://github.com/LedgerHQ/ledger-live/pull/22212) [`49b535f`](https://github.com/LedgerHQ/ledger-live/commit/49b535fa6cab495b0b8659c042c743b8f65c2ce2) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - refactor(aleo): serve the validator committee from RTK Query

- [#22228](https://github.com/LedgerHQ/ledger-live/pull/22228) [`1ec8d15`](https://github.com/LedgerHQ/ledger-live/commit/1ec8d15feb3f9339bc09c18c682e140d370c9efe) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Refine the Pay card assets list with loading skeletons, translated states, funding information, and asset values in the details dialog.

- [#22276](https://github.com/LedgerHQ/ledger-live/pull/22276) [`eca09da`](https://github.com/LedgerHQ/ledger-live/commit/eca09dae2b952b43748df64f2121c11d1eb22051) Thanks [@sarneijim](https://github.com/sarneijim)! - Add Braze Tools inspect for local eligibility and requiredStates fetch-cache inject

- [#22164](https://github.com/LedgerHQ/ledger-live/pull/22164) [`386710a`](https://github.com/LedgerHQ/ledger-live/commit/386710a6893f7e17a781b36f29ebe2e08f9b5b20) Thanks [@sarneijim](https://github.com/sarneijim)! - Share Nano S Touchscreen Upgrade Program banner copy keys so Desktop and Mobile can reuse the same model-specific lookup

- [#22231](https://github.com/LedgerHQ/ledger-live/pull/22231) [`c682542`](https://github.com/LedgerHQ/ledger-live/commit/c682542d2adc4066f1c5d6531f781babb0e772b9) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Open card transaction history from an asset, scope it to that asset, and show cashback values.

- [#22312](https://github.com/LedgerHQ/ledger-live/pull/22312) [`319fbe4`](https://github.com/LedgerHQ/ledger-live/commit/319fbe464cbf256b7b3ee57113b6abd6c52ccd55) Thanks [@sarneijim](https://github.com/sarneijim)! - Show the signed-off Touchscreen Upgrade Program copy only to Nano S users

- [#22278](https://github.com/LedgerHQ/ledger-live/pull/22278) [`95a1007`](https://github.com/LedgerHQ/ledger-live/commit/95a1007bb9d4f62d693391a99eca3cb3b12f0e7d) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Reveal card numbers as soon as the image loads and shorten the flip to 300ms

- [#22182](https://github.com/LedgerHQ/ledger-live/pull/22182) [`1557452`](https://github.com/LedgerHQ/ledger-live/commit/1557452f86f214191d2f29e5fca40b5077f90e11) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Reveal card numbers without a password unlock gate

- [#22229](https://github.com/LedgerHQ/ledger-live/pull/22229) [`905d26b`](https://github.com/LedgerHQ/ledger-live/commit/905d26b9ea6f419d3269a376e0f0c9b6ce8b2b82) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add a manage dialog for reordering Pay card funding assets and starting the add-asset flow.

- [#22129](https://github.com/LedgerHQ/ledger-live/pull/22129) [`ea94dd0`](https://github.com/LedgerHQ/ledger-live/commit/ea94dd00d64bae6b7fd9c792da77ffba751a9f01) Thanks [@lysyi3m](https://github.com/lysyi3m)! - fix(concordium): drop the PLT error surface nothing can reach

  `mapPltRejectReason` turned a chain reject reason into a typed `Error` and had no
  caller. It could not gain one: an `Error` is what the pre-send checks return and
  what the signer throws, and neither ever sees a reject reason. A reject reason
  exists only on the wallet-proxy history response, and history renders an
  `Operation`, which carries `failed: true` and no cause. Surfacing the cause means
  a code in `Operation.extra` and a renderer for it, not this function.

  Removed with it: `ConcordiumNonExistentTokenId` and `ConcordiumPltTransferRejected`,
  whose only producer it was, and `ConcordiumAccountNotAllowed` and
  `ConcordiumAccountDenied`, which never had one — `getAccountListStatus` folds both
  list verdicts into one, so reporting the cause means widening the stored
  `transferStatus` first.

  A test in each app now pins that every PLT error a producer can raise has copy of
  its own, so the next one added without it fails rather than reaching a user as a
  class name.

- [#22139](https://github.com/LedgerHQ/ledger-live/pull/22139) [`7848066`](https://github.com/LedgerHQ/ledger-live/commit/7848066f6ba1b803b5a8d3df02ce6d35e46b370e) Thanks [@lysyi3m](https://github.com/lysyi3m)! - feat(concordium): show why the chain rejected a PLT transfer

  A rejected PLT transfer read as a failed row with no explanation. Operation
  details now name the cause, on desktop and mobile.

- [#22147](https://github.com/LedgerHQ/ledger-live/pull/22147) [`1648042`](https://github.com/LedgerHQ/ledger-live/commit/164804200fcd3486d9f364a31b065cb7f7d2a170) Thanks [@lysyi3m](https://github.com/lysyi3m)! - fix(concordium): say which list refused a PLT sender

  A blocked sender was told to contact the issuer for access, which is wrong for a
  deny list. The send flow now reports the two causes separately.

  Removes the unused `PltListStatus` type.

- [#22186](https://github.com/LedgerHQ/ledger-live/pull/22186) [`eb2a2a5`](https://github.com/LedgerHQ/ledger-live/commit/eb2a2a598787555cc05ed7ae105dd1648fbe43f5) Thanks [@lysyi3m](https://github.com/lysyi3m)! - feat(concordium): surface PLT pause and sender restrictions

- [#22187](https://github.com/LedgerHQ/ledger-live/pull/22187) [`31ec33f`](https://github.com/LedgerHQ/ledger-live/commit/31ec33f649209bd2b6971afc173e2e41f53c313f) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - aleo part 2 staking ui

- [#22141](https://github.com/LedgerHQ/ledger-live/pull/22141) [`35105ea`](https://github.com/LedgerHQ/ledger-live/commit/35105ea8a60f5e33109a42cb00eb2887cb532320) Thanks [@sarneijim](https://github.com/sarneijim)! - Filter desktop Braze Content Cards with local eligibility before publishing to Redux

- [#22281](https://github.com/LedgerHQ/ledger-live/pull/22281) [`1a1766d`](https://github.com/LedgerHQ/ledger-live/commit/1a1766d6167cfdbc1e8135551a5e583956414d92) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix(desktop): keep the amount field ungrouped while it is focused

- [#22208](https://github.com/LedgerHQ/ledger-live/pull/22208) [`62a6f6c`](https://github.com/LedgerHQ/ledger-live/commit/62a6f6c516180411942c54ef686219387c41fb95) Thanks [@vladyslavchupovskiy-ext-art](https://github.com/vladyslavchupovskiy-ext-art)! - feat(coin-cosmos): add the Gonka currency configuration

  Points Gonka at the Ledger-hosted LCD, sets its minimum gas price to 0 (the chain's fee
  consensus parameter), and disables delegation, which the runtime rejects. Hides the account-header
  stake action on Desktop and Mobile for any Cosmos chain whose config sets `disableDelegation`, and
  stops a zero minimum gas price being mistaken for a missing config when preloaded data is restored.

- [#22116](https://github.com/LedgerHQ/ledger-live/pull/22116) [`214d382`](https://github.com/LedgerHQ/ledger-live/commit/214d38269add0b4f04c42002e1a42b1e75dc3c6d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Enforce the QR code pairing sequence on both sides of the handshake

  The host and the candidate now run the pairing messages through an explicit single-use state
  machine: each message is only accepted at the one point of the sequence where it is expected,
  and the peer that initiated the handshake is bound for the whole session. Envelopes, keys and
  decrypted bodies are validated before being acted upon, so a duplicate, out-of-order, foreign or
  malformed message ends the session with a `QRCodeProtocolError`: Desktop then asks for a fresh
  QR code, Mobile goes to its existing retry screen.

- [#22063](https://github.com/LedgerHQ/ledger-live/pull/22063) [`8346e6e`](https://github.com/LedgerHQ/ledger-live/commit/8346e6e9f38f79faac3eb11e9dbd65b2589d8bed) Thanks [@lewisd5](https://github.com/lewisd5)! - Make the Baanx card env vars reach packaged desktop builds. `CARD_BAANX_API_URL`, `CARD_BAANX_CLIENT_KEY`, `CARD_BAANX_HOSTED_UI` and `CARD_OAUTH_REDIRECT_URI` are read through `@shared/env` (`getEnv`/`useEnv`), which DefinePlugin cannot reach, so setting them on a CI build step had no effect on the artifact and the Card login always used the `shared/env` defaults. The renderer build now bakes them into a `__BUILD_ENVS__` object that `renderer/env` merges into `process.env` at boot, behind any real runtime value, from where the existing boot-time seeding pushes them into the env store.

- [#22090](https://github.com/LedgerHQ/ledger-live/pull/22090) [`a2e8499`](https://github.com/LedgerHQ/ledger-live/commit/a2e8499f5a77a8bdcc5d50d31812aeaf215fa5cd) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Carry every Baanx card env var into the packaged build. `CARD_BAANX_US_APP_ID`, `CARD_BAANX_LOGIN_MANIFEST_ID` and `CARD_BAANX_HOSTED_MANIFEST_ID` join `BUILD_ENV_NAMES`, so a build step that sets them reaches the app.

- [#21786](https://github.com/LedgerHQ/ledger-live/pull/21786) [`145462c`](https://github.com/LedgerHQ/ledger-live/commit/145462ca4c4b36f1c0a15178bd517dc59e826bb6) Thanks [@henri-ly](https://github.com/henri-ly)! - Add a `send-recipient-display` test id to the read-only "To:" field of the new send flow amount step, so automation can assert the contact name is carried over from the recipient step

- [#22106](https://github.com/LedgerHQ/ledger-live/pull/22106) [`a0ae584`](https://github.com/LedgerHQ/ledger-live/commit/a0ae584c9c6592f6c5139ad20e6b1c8e42452972) Thanks [@vladyslavchupovskiy-ext-art](https://github.com/vladyslavchupovskiy-ext-art)! - Add Gonka (GNK) to the supported currencies

- [#22190](https://github.com/LedgerHQ/ledger-live/pull/22190) [`0651158`](https://github.com/LedgerHQ/ledger-live/commit/0651158a2f03f819c2e2770ef4179901768c3c6c) Thanks [@koda-apps](https://github.com/apps/koda-apps)! - Bump lumen-design-core to 0.1.29, lumen-ui-react to 0.1.59, lumen-ui-rnative to 0.1.62, and lumen-utils-shared to 0.1.13. In lumen-ui-rnative, `OptionList` (and its subcomponents, e.g. `OptionListItem`) is renamed to `SelectList`/`SelectListItem`, and `resolveAvatarColor` is renamed to `useResolveAvatarColor`, now a theme-reactive hook instead of a plain function; call sites in live-mobile and `@features/platform-contacts` are migrated accordingly. `resolveAvatarColor` in lumen-ui-react is unaffected by this bump.

- [#22306](https://github.com/LedgerHQ/ledger-live/pull/22306) [`845ac4a`](https://github.com/LedgerHQ/ledger-live/commit/845ac4a101b405b6c93333e335115ef1105ef824) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Restore translucent status backgrounds with the Lumen `-transparent` tokens after status colors became solid.

- [#21494](https://github.com/LedgerHQ/ledger-live/pull/21494) [`4b1a3af`](https://github.com/LedgerHQ/ledger-live/commit/4b1a3af55579ec09bcea8082cc6710597376832d) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(send): add skip memo confirmation bottomsheet in the lwm send flow

- [#21902](https://github.com/LedgerHQ/ledger-live/pull/21902) [`f8a3d65`](https://github.com/LedgerHQ/ledger-live/commit/f8a3d6534d27654e7c631f9588d84291717b2946) Thanks [@abdurrahman-ledger](https://github.com/abdurrahman-ledger)! - Expose the DMK mock server session token on the renderer's `window.ledger` debug surface. An E2E run can now read the session the app provisioned and edit the emulated device while the app runs — swapping APDU mocks to hold it on a given onboarding step — instead of copying the token out of the developer top bar indicator.

- [#21690](https://github.com/LedgerHQ/ledger-live/pull/21690) [`727cd08`](https://github.com/LedgerHQ/ledger-live/commit/727cd089d9b2a112fd297502417567777dd51871) Thanks [@pawell24](https://github.com/pawell24)! - feat(near): adapt NEAR UI to generic coin framework staking positions

- [#22142](https://github.com/LedgerHQ/ledger-live/pull/22142) [`046f48e`](https://github.com/LedgerHQ/ledger-live/commit/046f48ead1d5dd6c9dc4a6b42655bffe24294a19) Thanks [@dgreen-ledger](https://github.com/dgreen-ledger)! - Harden desktop onboarding to re-validate the connected device if it changes identity mid-flow, and fix a desktop transport bug where every connected device reported the same empty identifier

- [#22305](https://github.com/LedgerHQ/ledger-live/pull/22305) [`fd6b9d0`](https://github.com/LedgerHQ/ledger-live/commit/fd6b9d0b602e44c5520152c2307bd629f11afc7a) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Open the provider withdrawal page from a card asset.

  - `buildWithdrawalPath` addresses `/withdrawal`, with the same `app_id` and `currency` query as `buildTopUpPath`.
  - Desktop opens it on the hosted manifest, mobile in the secure browser, both with the asset pre-selected.
  - Mobile also pre-selects the asset on the top up page.
  - Every mobile hosted page now opens in the same secure browser session, which shares the cookies of the login. `openHostedLoginInSecureBrowser` becomes `openHostedUrlInSecureBrowser`, and `openHostedPageInSecureBrowser` is removed.
  - Every hosted path now lives in `state/hostedPaths.ts`: signup, top up, withdrawal, manage PIN and the Baanx root. `cardSettingsPaths.ts` is removed, and the package exports the same names as before.

- [#22096](https://github.com/LedgerHQ/ledger-live/pull/22096) [`4cd3a25`](https://github.com/LedgerHQ/ledger-live/commit/4cd3a25b16377eaaaaf9f7d360fc723645f38b2d) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Show what each card wallet is worth in the right-panel card.

  - Resolves the card's currencies and prices each wallet against the user's counter value.
  - Registers the pairs through the existing on-demand tracking helper, since no account holds them.
  - Both are gated on the card being signed in.

- [#22048](https://github.com/LedgerHQ/ledger-live/pull/22048) [`42f6ad3`](https://github.com/LedgerHQ/ledger-live/commit/42f6ad357a83b64d590cba5035af94b394e8a640) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add a Crypto and Card tab switcher to desktop History.

- [#22038](https://github.com/LedgerHQ/ledger-live/pull/22038) [`c48d6d7`](https://github.com/LedgerHQ/ledger-live/commit/c48d6d71b7ec0318cfec3277c119284a88d652f7) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - feat(pay-card): read the Baanx login and hosted manifest ids from the env, not from the `lwdPayTab` flag params

- [#22267](https://github.com/LedgerHQ/ledger-live/pull/22267) [`8e556b1`](https://github.com/LedgerHQ/ledger-live/commit/8e556b198bdf546968458347b0cad3e954ed4adb) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Map Baanx's EUROC to its Ledger currency.

  - `euroc.ethereum` and `euroc.euroc` resolve to `ethereum/erc20/euro_coin`.

- [#22308](https://github.com/LedgerHQ/ledger-live/pull/22308) [`9677738`](https://github.com/LedgerHQ/ledger-live/commit/9677738402a28bd494bd782c68fc99467465c2db) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Point the production and release builds at the live Baanx environment

- [#21974](https://github.com/LedgerHQ/ledger-live/pull/21974) [`d4ba10f`](https://github.com/LedgerHQ/ledger-live/commit/d4ba10fc70d8d836c3536e196acb49b0667d202d) Thanks [@martijnhjk](https://github.com/martijnhjk)! - Start the app with an injected Card session for local development and E2E. Desktop cannot finish the Card OAuth login yet — the hosted page opens in the user's own browser and reports nothing back (LIVE-34740) — and the session token lives in renderer memory rather than the persisted redux state, so a `userdata` fixture cannot carry it either.

  `CARD_SESSION_BOOTSTRAP` takes a `PayCardSession` as JSON, read from `process.env` at boot to seed the Card session and mark the app signed in. Keeping it out of `@shared/env` keeps the bearer token out of `getAllEnvs()`. After the read, the process env is cleared; a later launch still receives the value if the parent environment still has it.

  It is honoured in a development build or in any build launched with `PLAYWRIGHT_RUN` — a packaged build included. The gate is a runtime check rather than a build-time constant so that release-mode E2E, which tests the release bundle, can still inject a session; the cost is that setting the variable on a shipped app does work, so it assumes control of that app's launch environment.

- [#22183](https://github.com/LedgerHQ/ledger-live/pull/22183) [`d9d1111`](https://github.com/LedgerHQ/ledger-live/commit/d9d1111733e757cc58b6249fdda568dd56d40757) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Open the provider's top up page from the card on desktop.

  - `CardTopUpButton` carries the action. On desktop it stays at the bottom of the card panel, above the scrolling content.
  - Desktop opens `/topup` on the hosted live app manifest, the way the signup page already opens.
  - A US card holder gets the US `app_id` on the query, so the page reaches the US tenant.
  - Desktop ends the provider session in the webview on each entry of the Pay tab, so a session left behind by a top up cannot sign the previous holder back in. The login and the signup drop their own wipe: every one of them starts from an entry of the Pay tab.
  - The top up button in the asset details dialog opens the same page, with the asset pre-selected on the query.

- [#22046](https://github.com/LedgerHQ/ledger-live/pull/22046) [`2aeb695`](https://github.com/LedgerHQ/ledger-live/commit/2aeb695663cf9a71d2a234ebc38819567f930564) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add a card transaction preview to the Pay card details view.

- [#21752](https://github.com/LedgerHQ/ledger-live/pull/21752) [`2a5d4e9`](https://github.com/LedgerHQ/ledger-live/commit/2a5d4e9582655518968f3c60579d6fa5a7d6c0a7) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Open Pay from a contact address on the amount step after picking the debit account

- [#22064](https://github.com/LedgerHQ/ledger-live/pull/22064) [`d1d0d90`](https://github.com/LedgerHQ/ledger-live/commit/d1d0d90e75648ae1127b5682a6244b8e8268550a) Thanks [@semeano](https://github.com/semeano)! - Show a Zcash shielding transaction as private and display its shielded destination instead of its transparent change, masking that destination under discreet mode

- [#21841](https://github.com/LedgerHQ/ledger-live/pull/21841) [`d59d123`](https://github.com/LedgerHQ/ledger-live/commit/d59d123a2ba037b44507b1f5424e31f05309ec26) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(cosmos): migrate account resources to shared staking aggregate

- [#22214](https://github.com/LedgerHQ/ledger-live/pull/22214) [`72892c5`](https://github.com/LedgerHQ/ledger-live/commit/72892c5b3a7b675506c64f59329041099abbb099) Thanks [@sarneijim](https://github.com/sarneijim)! - Track the Q3 product tour with the Generic Awareness carousel contract on mobile and desktop, including a primary continue CTA and last-step completion.

- [#22158](https://github.com/LedgerHQ/ledger-live/pull/22158) [`6a21fa0`](https://github.com/LedgerHQ/ledger-live/commit/6a21fa0beaee1f76ca840c5240c07e028b077702) Thanks [@LL782](https://github.com/LL782)! - Replace the internal `Track` and `TrackPage` analytics components with the shared implementations from `@shared/analytics-react`

- [#21967](https://github.com/LedgerHQ/ledger-live/pull/21967) [`40251b4`](https://github.com/LedgerHQ/ledger-live/commit/40251b41a62b2381c5c79410073a5f0b3c1fe629) Thanks [@sarneijim](https://github.com/sarneijim)! - Remove the obsolete original Wallet V4 tour

- [#22078](https://github.com/LedgerHQ/ledger-live/pull/22078) [`9734269`](https://github.com/LedgerHQ/ledger-live/commit/97342693708b63fea809523610f9f7b218612cc2) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Show the undelegating amount on the SEI account screen while assets are inside their unbonding period

- [#22159](https://github.com/LedgerHQ/ledger-live/pull/22159) [`b246de7`](https://github.com/LedgerHQ/ledger-live/commit/b246de7a7d4fe378a2154a3d53ec279179318ed9) Thanks [@semeano](https://github.com/semeano)! - Correct the Send memo help text, which repeated the memo label and described memos as an exchange-only requirement. Currencies can now provide their own wording; Zcash describes its memo as optional and encrypted

- [#22299](https://github.com/LedgerHQ/ledger-live/pull/22299) [`470bca7`](https://github.com/LedgerHQ/ledger-live/commit/470bca79315b3bb8242d01dd33e26b2b0da460ba) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Include send flow source in tracking properties on desktop and mobile.

- [#22056](https://github.com/LedgerHQ/ledger-live/pull/22056) [`cb866e1`](https://github.com/LedgerHQ/ledger-live/commit/cb866e1c07252a07fa991abd3dc2d8df68960256) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add @shared/linking package for cross-platform external link handling with URL safety, localization and analytics

- [#22085](https://github.com/LedgerHQ/ledger-live/pull/22085) [`b499c0d`](https://github.com/LedgerHQ/ledger-live/commit/b499c0d64f4257601a92f7d9f945d061aed79d35) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Fix the sidebar navigation bottom edge no longer aligning with the page content

- [#22236](https://github.com/LedgerHQ/ledger-live/pull/22236) [`43e1a21`](https://github.com/LedgerHQ/ledger-live/commit/43e1a21f2060d53875256b001e054cf0b1f7b86a) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add Pay Card devtools controls for transaction and wallet balance fixtures, and answer the mocked wallet reorder with the order alone so linked assets keep the amounts they were showing while the reordered row shows its spinner.

- [#22337](https://github.com/LedgerHQ/ledger-live/pull/22337) [`e1c0c65`](https://github.com/LedgerHQ/ledger-live/commit/e1c0c65f6c2726b29314ec2a7827d97672989ac0) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add legal agreement link to the Pay Card "More" menu

- [#21942](https://github.com/LedgerHQ/ledger-live/pull/21942) [`61362d0`](https://github.com/LedgerHQ/ledger-live/commit/61362d0e482a62c6fe663080c8ce2f4a25ffdb00) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Extract a desktop BrazeProvider and share Braze refresh and identity synchronization lifecycles

- [#22155](https://github.com/LedgerHQ/ledger-live/pull/22155) [`8e97720`](https://github.com/LedgerHQ/ledger-live/commit/8e97720a1fb00f3b90e8cd5b267dbfe4cd7a98f2) Thanks [@LL782](https://github.com/LL782)! - Wire in @shared/analytics for desktop

- [#22159](https://github.com/LedgerHQ/ledger-live/pull/22159) [`b246de7`](https://github.com/LedgerHQ/ledger-live/commit/b246de7a7d4fe378a2154a3d53ec279179318ed9) Thanks [@semeano](https://github.com/semeano)! - Align the Zcash device-confirmation step with every other currency: the signature screen no longer shows the recipient or the amount, which are verified on the device

### Patch Changes

- Updated dependencies [[`40d296b`](https://github.com/LedgerHQ/ledger-live/commit/40d296b822381cc5d05616acafa1bca61e500dce), [`5649787`](https://github.com/LedgerHQ/ledger-live/commit/56497875407fe63148b6dfbf266b778748972c01), [`4d1d640`](https://github.com/LedgerHQ/ledger-live/commit/4d1d64049a0bb0562a1a0c8ad2555fe967acdd7f), [`731ebd2`](https://github.com/LedgerHQ/ledger-live/commit/731ebd22047779093d5821d38ea53f6f9fc1a694), [`250c1c0`](https://github.com/LedgerHQ/ledger-live/commit/250c1c0e4cd081a67f46b37e852291a32e02b05b), [`510465b`](https://github.com/LedgerHQ/ledger-live/commit/510465b5ac5808a42729dbea99aea081bf759e4a), [`c7eb01d`](https://github.com/LedgerHQ/ledger-live/commit/c7eb01d392a1adf04db824cd8602d939985599c7), [`871e485`](https://github.com/LedgerHQ/ledger-live/commit/871e4854284a0b21e31b53ff0ac312010093d914), [`6996290`](https://github.com/LedgerHQ/ledger-live/commit/6996290580691788820aabd70367655f2283ac20), [`72367fc`](https://github.com/LedgerHQ/ledger-live/commit/72367fcf2343fa488008236f1005da589e6e3054), [`2e94d90`](https://github.com/LedgerHQ/ledger-live/commit/2e94d909a573f7e52595a6fe38241f171ea7feab), [`c22ee67`](https://github.com/LedgerHQ/ledger-live/commit/c22ee67d3e0271b382337fe4175170bdabf5dfca), [`3d50917`](https://github.com/LedgerHQ/ledger-live/commit/3d50917da2e7c2177f8288bb754d41a7699f27be), [`cfa249c`](https://github.com/LedgerHQ/ledger-live/commit/cfa249c4c3a30f9eba1ecee1749030121da9291a), [`285b50d`](https://github.com/LedgerHQ/ledger-live/commit/285b50dc311eef60089f779cffdfe14a0422d2ec), [`724f029`](https://github.com/LedgerHQ/ledger-live/commit/724f02932ccdf8ba5b8f8f0ccc10b9edbe7547cd), [`353ed46`](https://github.com/LedgerHQ/ledger-live/commit/353ed46035b09d33eff6b5b76fe7ad3d19510e38), [`b5338ec`](https://github.com/LedgerHQ/ledger-live/commit/b5338ec9173a08073a4b8524fe095428bb710a99), [`49b535f`](https://github.com/LedgerHQ/ledger-live/commit/49b535fa6cab495b0b8659c042c743b8f65c2ce2), [`944bd23`](https://github.com/LedgerHQ/ledger-live/commit/944bd2345899c399bc931144fe46b48d0d1bf55b), [`a1a8b81`](https://github.com/LedgerHQ/ledger-live/commit/a1a8b81b3f9b4eb897ac3d81427a1df0a5e0130b), [`1ec8d15`](https://github.com/LedgerHQ/ledger-live/commit/1ec8d15feb3f9339bc09c18c682e140d370c9efe), [`386710a`](https://github.com/LedgerHQ/ledger-live/commit/386710a6893f7e17a781b36f29ebe2e08f9b5b20), [`84bba64`](https://github.com/LedgerHQ/ledger-live/commit/84bba645bfe85f3bd4d6f03431916226113c7bc5), [`c682542`](https://github.com/LedgerHQ/ledger-live/commit/c682542d2adc4066f1c5d6531f781babb0e772b9), [`319fbe4`](https://github.com/LedgerHQ/ledger-live/commit/319fbe464cbf256b7b3ee57113b6abd6c52ccd55), [`dd155a7`](https://github.com/LedgerHQ/ledger-live/commit/dd155a7608f771f8e9a26007e3ad28a82429a700), [`95a1007`](https://github.com/LedgerHQ/ledger-live/commit/95a1007bb9d4f62d693391a99eca3cb3b12f0e7d), [`233e44e`](https://github.com/LedgerHQ/ledger-live/commit/233e44e3dd724cc9d4f14a02c7e62e39d2e9079b), [`1557452`](https://github.com/LedgerHQ/ledger-live/commit/1557452f86f214191d2f29e5fca40b5077f90e11), [`6741356`](https://github.com/LedgerHQ/ledger-live/commit/67413566f84b895e6f4ae2b5d646bfc2e82c6926), [`dafadf0`](https://github.com/LedgerHQ/ledger-live/commit/dafadf005a54007d5430203c11b8718c1636a6e4), [`9652494`](https://github.com/LedgerHQ/ledger-live/commit/96524949cbf8fa1d102a0156f40004ff12a30475), [`5492648`](https://github.com/LedgerHQ/ledger-live/commit/5492648988e327c8e3e6e7d5ead1e0fa2bd9929e), [`926952b`](https://github.com/LedgerHQ/ledger-live/commit/926952ba724cb42860718c4af553be725d1265a9), [`24865c8`](https://github.com/LedgerHQ/ledger-live/commit/24865c8558cb9f228e18ff5fbe5ef263e41e736f), [`905d26b`](https://github.com/LedgerHQ/ledger-live/commit/905d26b9ea6f419d3269a376e0f0c9b6ce8b2b82), [`98e3038`](https://github.com/LedgerHQ/ledger-live/commit/98e303872684da47feca343c0db7d83fcce857b2), [`ea94dd0`](https://github.com/LedgerHQ/ledger-live/commit/ea94dd00d64bae6b7fd9c792da77ffba751a9f01), [`736a0d5`](https://github.com/LedgerHQ/ledger-live/commit/736a0d5ba692e2342df4fc503056524359d35d65), [`7848066`](https://github.com/LedgerHQ/ledger-live/commit/7848066f6ba1b803b5a8d3df02ce6d35e46b370e), [`1648042`](https://github.com/LedgerHQ/ledger-live/commit/164804200fcd3486d9f364a31b065cb7f7d2a170), [`eb2a2a5`](https://github.com/LedgerHQ/ledger-live/commit/eb2a2a598787555cc05ed7ae105dd1648fbe43f5), [`33e92e8`](https://github.com/LedgerHQ/ledger-live/commit/33e92e8f074ff73a6a3e338c8313ba8bc9066ccf), [`31ec33f`](https://github.com/LedgerHQ/ledger-live/commit/31ec33f649209bd2b6971afc173e2e41f53c313f), [`35c9b91`](https://github.com/LedgerHQ/ledger-live/commit/35c9b91735fb3fd0f2d1dc63a2288c9c7b7ad0ab), [`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68), [`a62ad28`](https://github.com/LedgerHQ/ledger-live/commit/a62ad28e4900a887567fb61fb8f197af4fa5a23b), [`6183efd`](https://github.com/LedgerHQ/ledger-live/commit/6183efddac5de725cb22a013d5a9cdc94e65f756), [`5d2f40f`](https://github.com/LedgerHQ/ledger-live/commit/5d2f40f470f859960e43a2a08755a962796f6beb), [`62a6f6c`](https://github.com/LedgerHQ/ledger-live/commit/62a6f6c516180411942c54ef686219387c41fb95), [`a1108d3`](https://github.com/LedgerHQ/ledger-live/commit/a1108d3f604027d2589fdc31cf90dfb06a4d75ab), [`791c54a`](https://github.com/LedgerHQ/ledger-live/commit/791c54ae44ef1c8301f76e82e427f6f8c04176f1), [`214d382`](https://github.com/LedgerHQ/ledger-live/commit/214d38269add0b4f04c42002e1a42b1e75dc3c6d), [`5df5893`](https://github.com/LedgerHQ/ledger-live/commit/5df5893134ac2db18f758519bb15af8f532e95b4), [`a0ae584`](https://github.com/LedgerHQ/ledger-live/commit/a0ae584c9c6592f6c5139ad20e6b1c8e42452972), [`0651158`](https://github.com/LedgerHQ/ledger-live/commit/0651158a2f03f819c2e2770ef4179901768c3c6c), [`845ac4a`](https://github.com/LedgerHQ/ledger-live/commit/845ac4a101b405b6c93333e335115ef1105ef824), [`d7d2b9a`](https://github.com/LedgerHQ/ledger-live/commit/d7d2b9a0907cb0b16dd481f09c92b8796d80d3a9), [`54a71f6`](https://github.com/LedgerHQ/ledger-live/commit/54a71f63dae4df25bafba99db5562ca2462c9cd7), [`727cd08`](https://github.com/LedgerHQ/ledger-live/commit/727cd089d9b2a112fd297502417567777dd51871), [`29ce771`](https://github.com/LedgerHQ/ledger-live/commit/29ce7712ce93cd27afa97eda2d14a0ff066551fb), [`046f48e`](https://github.com/LedgerHQ/ledger-live/commit/046f48ead1d5dd6c9dc4a6b42655bffe24294a19), [`fd6b9d0`](https://github.com/LedgerHQ/ledger-live/commit/fd6b9d0b602e44c5520152c2307bd629f11afc7a), [`8d073ca`](https://github.com/LedgerHQ/ledger-live/commit/8d073ca6a527a11ce6f10995bb896ae983211f63), [`954ffbd`](https://github.com/LedgerHQ/ledger-live/commit/954ffbdeb8172f555b637599d24cf2a94bcf24db), [`a915d4a`](https://github.com/LedgerHQ/ledger-live/commit/a915d4a577dfe7bb778364c4b0269bc61203075a), [`99bf629`](https://github.com/LedgerHQ/ledger-live/commit/99bf629658121670784047780f74702cfa2c3ebc), [`853e47d`](https://github.com/LedgerHQ/ledger-live/commit/853e47dac8f42644733686353c3f0f4a3fcc035a), [`c48d6d7`](https://github.com/LedgerHQ/ledger-live/commit/c48d6d71b7ec0318cfec3277c119284a88d652f7), [`8e556b1`](https://github.com/LedgerHQ/ledger-live/commit/8e556b198bdf546968458347b0cad3e954ed4adb), [`dbc9655`](https://github.com/LedgerHQ/ledger-live/commit/dbc9655cb61b4999fa6cd52dca25053f9f301dd3), [`afb2750`](https://github.com/LedgerHQ/ledger-live/commit/afb275029ec3aee1c833f1e468c41dc36279ab6f), [`eb06f77`](https://github.com/LedgerHQ/ledger-live/commit/eb06f77c9548a2e4641c37da90c34b4fcffba667), [`8dcb040`](https://github.com/LedgerHQ/ledger-live/commit/8dcb040ccac4abaeba356e76b60dc03802303bf5), [`75038d5`](https://github.com/LedgerHQ/ledger-live/commit/75038d59735ac63ab43baf7bd298969890241b3b), [`d9d1111`](https://github.com/LedgerHQ/ledger-live/commit/d9d1111733e757cc58b6249fdda568dd56d40757), [`4b346a0`](https://github.com/LedgerHQ/ledger-live/commit/4b346a0f90b2c1f7c66df4be38e7c4b6b992ce57), [`2aeb695`](https://github.com/LedgerHQ/ledger-live/commit/2aeb695663cf9a71d2a234ebc38819567f930564), [`91531f2`](https://github.com/LedgerHQ/ledger-live/commit/91531f29e71e4e186375a5e2908ddca0c351c0ac), [`287f042`](https://github.com/LedgerHQ/ledger-live/commit/287f04286e4933e31e31952a3ac6485e145e34f2), [`2a5d4e9`](https://github.com/LedgerHQ/ledger-live/commit/2a5d4e9582655518968f3c60579d6fa5a7d6c0a7), [`6fe6efb`](https://github.com/LedgerHQ/ledger-live/commit/6fe6efb9f2c9211d6002dd17f4369f90390021bf), [`d1d0d90`](https://github.com/LedgerHQ/ledger-live/commit/d1d0d90e75648ae1127b5682a6244b8e8268550a), [`d59d123`](https://github.com/LedgerHQ/ledger-live/commit/d59d123a2ba037b44507b1f5424e31f05309ec26), [`d19e4ae`](https://github.com/LedgerHQ/ledger-live/commit/d19e4aed0efb7e6ff8b8195dd8437cddbd455fe7), [`f44101e`](https://github.com/LedgerHQ/ledger-live/commit/f44101efbe2e3325fb001fcd4a762a619a7cfc77), [`6844ca4`](https://github.com/LedgerHQ/ledger-live/commit/6844ca4e220c98ff99dd5d259dab339223624847), [`40251b4`](https://github.com/LedgerHQ/ledger-live/commit/40251b41a62b2381c5c79410073a5f0b3c1fe629), [`470bca7`](https://github.com/LedgerHQ/ledger-live/commit/470bca79315b3bb8242d01dd33e26b2b0da460ba), [`216ecb7`](https://github.com/LedgerHQ/ledger-live/commit/216ecb720b1f1937ae1a8c10ef40be24ea5d79cf), [`cb866e1`](https://github.com/LedgerHQ/ledger-live/commit/cb866e1c07252a07fa991abd3dc2d8df68960256), [`bb3e182`](https://github.com/LedgerHQ/ledger-live/commit/bb3e1822bfc2cb9ff00089082782d9e2bd229b67), [`43e1a21`](https://github.com/LedgerHQ/ledger-live/commit/43e1a21f2060d53875256b001e054cf0b1f7b86a), [`1603611`](https://github.com/LedgerHQ/ledger-live/commit/1603611179046f098fba526aafb9633466448e05), [`e1c0c65`](https://github.com/LedgerHQ/ledger-live/commit/e1c0c65f6c2726b29314ec2a7827d97672989ac0), [`7f40a5a`](https://github.com/LedgerHQ/ledger-live/commit/7f40a5a1cc84b733ad3a3584b5a14f9fc21c95c8), [`d750b9f`](https://github.com/LedgerHQ/ledger-live/commit/d750b9f8e7353d09d171f1c1f3cd44ab805e6f56), [`61362d0`](https://github.com/LedgerHQ/ledger-live/commit/61362d0e482a62c6fe663080c8ce2f4a25ffdb00), [`e2134f5`](https://github.com/LedgerHQ/ledger-live/commit/e2134f5cffe4669ff5896e2b52904fe22218461b)]:
  - @shared/env@0.8.0-next.0
  - @shared/api-services@0.8.0-next.0
  - @features/platform-card@0.6.0-next.0
  - @features/flow-pay-card-auth@0.8.0-next.0
  - @features/flow-contacts-list@0.8.0-next.0
  - @domain/api-card-management@0.7.0-next.0
  - @features/flow-pay-card-details@0.5.0-next.0
  - @features/flow-pay-card@0.5.0-next.0
  - @features/platform-contacts@0.8.0-next.0
  - @features/flow-contacts-add-contact@0.7.0-next.0
  - @features/flow-contacts-edit-contact@0.6.0-next.0
  - @features/flow-contacts-edit-address@0.4.0-next.0
  - @features/flow-contacts-add-address@0.6.0-next.0
  - @features/flow-contacts@0.12.0-next.0
  - @features/flow-pay-card-widget@0.4.0-next.0
  - @devtools/bindings@0.9.0-next.0
  - @ledgerhq/asset-aggregation@0.16.0-next.0
  - @ledgerhq/live-common@38.1.0-next.0
  - @shared/ui-info-state@0.3.0-next.0
  - @features/flow-pay-card-assets@0.2.0-next.0
  - @features/flow-large-screen-upsell@2.2.0-next.0
  - @features/flow-pay-card-transactions@0.3.0-next.0
  - @domain/entity-currency-crypto@0.13.0-next.0
  - @ledgerhq/coin-concordium@1.4.0-next.0
  - @domain/entity-contact@0.10.0-next.0
  - @ledgerhq/coin-bitcoin@0.53.0-next.0
  - @ledgerhq/coin-canton@1.2.0-next.0
  - @ledgerhq/coin-cardano@1.2.0-next.0
  - @ledgerhq/coin-casper@3.4.0-next.0
  - @ledgerhq/coin-cosmos@1.4.0-next.0
  - @ledgerhq/coin-filecoin@2.2.0-next.0
  - @ledgerhq/coin-zcash@0.9.0-next.0
  - @ledgerhq/hw-transport-http@6.38.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.5.0-next.0
  - @ledgerhq/types-devices@7.1.0-next.0
  - @ledgerhq/types-live@6.125.0-next.0
  - @features/platform-env@0.4.0-next.0
  - @ledgerhq/live-dmk-shared@0.33.0-next.0
  - @ledgerhq/ledger-key-ring-protocol@0.23.0-next.0
  - @devtools/shell@0.10.0-next.0
  - @devtools/transport-panel@0.7.0-next.0
  - @ledgerhq/wallet-btc@0.6.0-next.0
  - @ledgerhq/hw-ledger-key-ring-protocol@0.13.0-next.0
  - @ledgerhq/live-dmk-desktop@0.22.0-next.0
  - @shared/feature-flags@0.24.0-next.0
  - @domain/entity-card-asset-mapping@0.7.0-next.0
  - @features/platform-currencies@0.9.0-next.0
  - @features/flow-pay-balance@0.5.0-next.0
  - @features/flow-pay-feature-tour@0.6.0-next.0
  - @features/flow-pay-request@0.6.0-next.0
  - @features/platform-feature-flags@0.8.0-next.0
  - @shared/analytics@0.3.0-next.0
  - @shared/analytics-react@0.3.0-next.0
  - @shared/linking@0.3.0-next.0
  - @domain/api-aggregated-assets@0.5.2-next.0
  - @features/platform-aggregated-assets@0.5.4-next.0
  - @ledgerhq/asset-detail@0.11.6-next.0
  - @ledgerhq/transaction-observability@0.3.2-next.0
  - @ledgerhq/wallet-analytics@0.4.2-next.0
  - @ledgerhq/wallet-pnl@0.7.12-next.0
  - @domain/api-altcoins-sentiment@0.3.6-next.0
  - @domain/api-currency-fiat@0.4.5-next.0
  - @domain/api-currency-token@0.6.2-next.0
  - @domain/api-market-sentiment@0.3.6-next.0
  - @domain/api-push-devices@0.2.6-next.0
  - @features/flow-contacts-delete-contact@0.2.3-next.0
  - @features/flow-contacts-introduction@1.2.0
  - @features/flow-pay-bank-transfer@0.3.2-next.0
  - @features/flow-pay-contact@0.4.1-next.0
  - @features/flow-pay-deposit@0.4.1-next.0
  - @features/platform-device-action-content@0.2.1
  - @ledgerhq/live-send@0.1.1-next.0
  - @domain/entity-currency@0.4.4-next.0
  - @domain/entity-currency-token@0.5.3-next.0
  - @ledgerhq/live-currency-format@0.15.0
  - @ledgerhq/live-wallet@1.1.4-next.0
  - @ledgerhq/live-signer-evm@0.23.3-next.0
  - @ledgerhq/live-countervalues@0.26.1-next.0
  - @ledgerhq/live-countervalues-react@0.18.1-next.0
  - @ledgerhq/domain-service@1.8.20-next.0
  - @devtools/wire@0.5.1-next.0
  - @features/flow-analytics-consent@0.2.7-next.0

## 4.21.1

### Patch Changes

- [#22339](https://github.com/LedgerHQ/ledger-live/pull/22339) [`d97a9f6`](https://github.com/LedgerHQ/ledger-live/commit/d97a9f6592a971e39daeb8bfd71b536e7b5842b1) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - LWD 4.21.1 release notes

## 4.21.1-hotfix.0

### Patch Changes

- [#22339](https://github.com/LedgerHQ/ledger-live/pull/22339) [`d97a9f6`](https://github.com/LedgerHQ/ledger-live/commit/d97a9f6592a971e39daeb8bfd71b536e7b5842b1) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - LWD 4.21.1 release notes

## 4.21.0

### Minor Changes

- [#21406](https://github.com/LedgerHQ/ledger-live/pull/21406) [`365a1bb`](https://github.com/LedgerHQ/ledger-live/commit/365a1bb557d4da011932a75e612483bacfed5629) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Wait for the mina staking fee before handing the transaction to the device

  Picking a validator only sets the recipient on the transaction; the bridge resolves the fee right
  after. The continue button of the validator step was enabled as soon as a validator was selected, so
  leaving for the device before the fee landed sent it a zero fee — which the mina signer rejects
  outright with `Missing or wrong arguments`, without ever displaying the transaction. The button now
  waits for the bridge, like the other delegation flows do.

  The undelegate flow opens straight on the device step and has no footer to hold it back, so that
  step now waits for the same signal before mounting the device action.

- [#21662](https://github.com/LedgerHQ/ledger-live/pull/21662) [`9164e8b`](https://github.com/LedgerHQ/ledger-live/commit/9164e8b81ecb84e5d8ba0bb606981c2dc83d04c1) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add freeze/unfreeze confirmation dialog and bottom sheet for pay card

- [#21707](https://github.com/LedgerHQ/ledger-live/pull/21707) [`8f62cdb`](https://github.com/LedgerHQ/ledger-live/commit/8f62cdbb6d93e207efd7e551af65a41953d28242) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add View/Hide and a 3D flip for card numbers.

- [#21722](https://github.com/LedgerHQ/ledger-live/pull/21722) [`182fae7`](https://github.com/LedgerHQ/ledger-live/commit/182fae7fbfa81b42de061e67da8edf21a7f72281) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add a Card Details container with native artwork, Details sheet, and web composition

- [#21754](https://github.com/LedgerHQ/ledger-live/pull/21754) [`ba31ece`](https://github.com/LedgerHQ/ledger-live/commit/ba31ece3a22febeafbec027840d16ea82c2dad5e) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Render the native card details overview, freeze confirmation and More menu as scenes inside a single bottom sheet

- [#22037](https://github.com/LedgerHQ/ledger-live/pull/22037) [`785346c`](https://github.com/LedgerHQ/ledger-live/commit/785346c48a01e814ed6715b31a97584fc3bff496) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Fix Zcash shielded send follow-ups in the new Send flow

  The maturing-funds notice on the balance-type step was cut off because its whole sentence was
  packed into the banner title; it now splits into a title and a description like every other
  validation banner.

  Two error cases had no translation and fell back to the raw class name under a "contact support"
  description: sending to a `u1…` address before the private balance's viewing key has been exported,
  and a rare backend drift where a scanned note is not yet spendable by the builder.

  The new flow was also missing two shielded-sync triggers that the legacy Send modal already had: a
  resync right after broadcasting a private transfer, and one when entering the Amount step with the
  private pool selected. Both are wired through the same family-component slots the flow already uses
  for its other Zcash-specific screens.

  Pasting the unified (shielded) address of one of the user's own Zcash accounts did not resolve to
  anything useful -- only the transparent fresh address was recognized, and even then it showed the
  account's name rather than which pool it is. Recipient matching now goes through the coin-families
  contract so a family can declare every address its accounts are recognizable by, and an address that
  is the account's own self-transfer target now shows its pool label ("Private balance") instead,
  matching what the self-transfer shortcut already produces.

  The balance-selection step showed an aggregate balance and an account name that don't belong on a
  screen whose only purpose is picking between two pools; both are gone, matching the design, and the
  step's title now reads "Select balance". Every following step's header now shows which pool was
  picked next to the account name and balance (e.g. "ZEC 1 (Private balance) · 0.2 ZEC") -- resolved
  from the send descriptor, so every other currency's header is unchanged.

- [#21665](https://github.com/LedgerHQ/ledger-live/pull/21665) [`16a454f`](https://github.com/LedgerHQ/ledger-live/commit/16a454fa79be46df6aec3c50ad40407f36dfdea9) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Fix saving a contact address on EVM networks that ship their own coin app, such as Sei, Sonic and Ethereum Classic. The device app to open is now derived from the network family rather than from the network's own `managerAppName`, so EVM networks with an EIP-155 chain ID register through the Ethereum app and are told apart by that chain ID, which is what the Contacts device kit expects. These networks are selectable again, reversing the restriction added in LIVE-36688.

  Address-book eligibility now lives in a single place: `isEligibleAddressCurrency` moves from `@ledgerhq/live-common` to `@features/platform-contacts`, where it checks device capability alongside the network family. The send flow and the Contacts network picker previously answered this question separately, which is how an entry point could be offered for a network the device would refuse.

- [#21882](https://github.com/LedgerHQ/ledger-live/pull/21882) [`782b197`](https://github.com/LedgerHQ/ledger-live/commit/782b197bf61a233f5c6ffe7f68e37267f8546e73) Thanks [@LucasWerey](https://github.com/LucasWerey)! - fix bottom padding missing on the Ledger Sync intro modal in the Add Contact flow

- [#21855](https://github.com/LedgerHQ/ledger-live/pull/21855) [`24d1ff6`](https://github.com/LedgerHQ/ledger-live/commit/24d1ff67f1aea695dfcae2303f8a780feb985964) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Prevent saving duplicate addresses across contacts — show "This address is already used by [Contact Name]." when adding or editing an address that is already saved in another contact

- [#21681](https://github.com/LedgerHQ/ledger-live/pull/21681) [`de19b3e`](https://github.com/LedgerHQ/ledger-live/commit/de19b3e4e56a0c28fcc1a3ca929059e84fc7bebf) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add freeze/unfreeze confirmation error handling with retry

- [#21698](https://github.com/LedgerHQ/ledger-live/pull/21698) [`25224f4`](https://github.com/LedgerHQ/ledger-live/commit/25224f463b834dba7a2811d7150aeec6dbd6a3ac) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Move the More menu into card details and put freeze and More on one actions row

- [#21706](https://github.com/LedgerHQ/ledger-live/pull/21706) [`96a1ca9`](https://github.com/LedgerHQ/ledger-live/commit/96a1ca9fef1b0acc8113708c148890054dea143d) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add excludedCurrencyIds param to lwdContacts and lwmContacts feature flags to exclude specific currencies from Contacts

- [#21777](https://github.com/LedgerHQ/ledger-live/pull/21777) [`f7fa8f0`](https://github.com/LedgerHQ/ledger-live/commit/f7fa8f0ff23c03a69933f2d6aa6e0b225af9d542) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Resolve a single Pay Card display state so the card face, onboarding widget and login CTA no longer overlap, and hold them back until the stored session is read

- [#21931](https://github.com/LedgerHQ/ledger-live/pull/21931) [`e8fa868`](https://github.com/LedgerHQ/ledger-live/commit/e8fa86874942249a54884353c6c1b070af80d4b1) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add privacy policy disclaimer link to contacts add address flow on desktop and mobile

- [#21653](https://github.com/LedgerHQ/ledger-live/pull/21653) [`269d6d4`](https://github.com/LedgerHQ/ledger-live/commit/269d6d404779439d0e98beb2ed3cef82805612ae) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - feat(aleo): add the bond public staking flow

- [#21852](https://github.com/LedgerHQ/ledger-live/pull/21852) [`f6dc62f`](https://github.com/LedgerHQ/ledger-live/commit/f6dc62f7f23be9f46812fc13f00ddc373e5ca1af) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - feat(aleo): add the unbond staking flow

- [#22254](https://github.com/LedgerHQ/ledger-live/pull/22254) [`7cc3e2c`](https://github.com/LedgerHQ/ledger-live/commit/7cc3e2c36608b105956360c1cb1c911c720fd5c9) Thanks [@sarneijim](https://github.com/sarneijim)! - Share Nano S Touchscreen Upgrade Program banner copy keys so Desktop and Mobile can reuse the same model-specific lookup

- [#21958](https://github.com/LedgerHQ/ledger-live/pull/21958) [`1eb2e00`](https://github.com/LedgerHQ/ledger-live/commit/1eb2e00074fe05f103dd33c3fbf295cfd39e9c2e) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the desktop Pay Card transaction detail dialog.

- [#21685](https://github.com/LedgerHQ/ledger-live/pull/21685) [`e0f0e6c`](https://github.com/LedgerHQ/ledger-live/commit/e0f0e6cc170b55472b528a969950caa05ae0a618) Thanks [@amaslakov](https://github.com/amaslakov)! - Add the error message shown when the protocol refuses a Tezos stake amount as too small

- [#21925](https://github.com/LedgerHQ/ledger-live/pull/21925) [`8b89707`](https://github.com/LedgerHQ/ledger-live/commit/8b89707aa9fee5d732cb22f55dbbecd301765b19) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Allow hardware carousel small-card titles to wrap on two lines on desktop, matching mobile layout

- [#21815](https://github.com/LedgerHQ/ledger-live/pull/21815) [`06b7fd3`](https://github.com/LedgerHQ/ledger-live/commit/06b7fd310ad9bc9200352ef5debf9dd2d5fb7a77) Thanks [@zel-kass](https://github.com/zel-kass)! - Fold Lumen visualization into lumen-ui-react and lumen-ui-rnative

- [#21651](https://github.com/LedgerHQ/ledger-live/pull/21651) [`632dd93`](https://github.com/LedgerHQ/ledger-live/commit/632dd9368616a97581d037f1503b2b16f567c02a) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Align Contacts analytics events and properties with the tracking plan on desktop and mobile.

- [#21921](https://github.com/LedgerHQ/ledger-live/pull/21921) [`036b71d`](https://github.com/LedgerHQ/ledger-live/commit/036b71d678a57c3b1c3156374122fe13bea54f79) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Align the add-contact confirmation CTA with "Add contact" on mobile and desktop

- [#21682](https://github.com/LedgerHQ/ledger-live/pull/21682) [`1fc1596`](https://github.com/LedgerHQ/ledger-live/commit/1fc1596773bf094e922433649bd63359961ed848) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Put the paid amount under the You paid title on the Pay success dialog.

- [#21717](https://github.com/LedgerHQ/ledger-live/pull/21717) [`9521860`](https://github.com/LedgerHQ/ledger-live/commit/95218609a18754a6fbbdd6144fc109f6a0c2dbb6) Thanks [@sarneijim](https://github.com/sarneijim)! - Add the Q3 Wallet V4 Tour carousel to the desktop debug tool, gated by releaseTour variants q3_a, q3_b (no Pay) and q3_b2 (Pay without card), with the mobile light and dark assets, copy, navigation, dismissal, and analytics.

- [#21670](https://github.com/LedgerHQ/ledger-live/pull/21670) [`d394600`](https://github.com/LedgerHQ/ledger-live/commit/d39460090faf503f890efeb76f5dc771e1b65c4f) Thanks [@sarneijim](https://github.com/sarneijim)! - Add Q3 tour persisted seen state and Wallet Features debug controls on desktop, gated by releaseTour (q3_a) rather than lwdWallet40. Open Drawer stays disabled.

- [#21720](https://github.com/LedgerHQ/ledger-live/pull/21720) [`05cb97c`](https://github.com/LedgerHQ/ledger-live/commit/05cb97c6986755d87d4c0b3df3d8b4daf9ba77df) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Craft and sign PLT transfers

  `craftPltTransaction` builds a `TokenUpdate` payload from the CAL-resolved token id, the
  CAL unit magnitude as the amount's exponent, and the energy persisted at estimation time,
  and `signOperation` routes a transaction carrying a token sub-account to it. The signer
  interface widens to `AnyTransaction`; its body already serialized both kinds. A PLT send
  now reports the CCD fee on the parent account and the token amount on the sub-account,
  matching the pair sync builds once the transfer is indexed. `updateTransaction` drops the
  persisted energy alongside the fee, so a re-selected token cannot inherit the previous
  token's energy limit. Adds the English error strings for the two signer failures this path
  can surface.

  Signing on a device needs the PLT-capable Concordium app; until it ships, an attempt
  surfaces as a translated "update your Concordium app" error. PLT sub-accounts remain behind
  the `enableTokens` config switch.

- [#21634](https://github.com/LedgerHQ/ledger-live/pull/21634) [`b30f903`](https://github.com/LedgerHQ/ledger-live/commit/b30f903f592c0bafba74a1784d98b9d605c18ccb) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Validate PLT transfers and fix estimateMaxSpendable for tokens

  `getTransactionStatus` checks a PLT amount against the token sub-account and its fee
  against the CCD at the parent's disposal, and blocks on token state and device limits.
  `estimateMaxSpendable` returns the full token balance instead of subtracting µCCD fees.
  A PLT fee is priced from the buffered energy, so it covers the deposit the chain
  requires. `concordium-core` lowers the PLT decimals ceiling to 18. Adds the English
  error strings.

- [#21714](https://github.com/LedgerHQ/ledger-live/pull/21714) [`df401b8`](https://github.com/LedgerHQ/ledger-live/commit/df401b89391deedd5c1688ccd35cac947c8e0367) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Fix Contacts feature copy to match latest version (remove contractions, update disclaimers)

- [#21924](https://github.com/LedgerHQ/ledger-live/pull/21924) [`cdb273b`](https://github.com/LedgerHQ/ledger-live/commit/cdb273b068df78cd5a0dbd4281fb79f22e0a7506) Thanks [@qperrot](https://github.com/qperrot)! - Fix account view crash when cosmos `cosmosResources` is undefined by handling missing resources gracefully in the delegation hook and account UI components

- [#21738](https://github.com/LedgerHQ/ledger-live/pull/21738) [`9e37f58`](https://github.com/LedgerHQ/ledger-live/commit/9e37f58a84f7ee9585142c0a8ac767da58b6d06f) Thanks [@ysitbon](https://github.com/ysitbon)! - Move the account-coupled tracking-pair code out of the countervalues packages and into `live-common`, next to the portfolio code it belongs with. `inferTrackingPairForAccounts` and `inferTrackingPairForAccountsUnresolved` leave `live-countervalues/logic`, and the `useTrackingPairForAccounts` hook that wraps them leaves `live-countervalues-react`.

  These three were the last things in the countervalues core that needed an `Account`, so `@ledgerhq/types-live` is now gone from the package entirely and from its dependency list. The core no longer knows what an account is; it only knows currency pairs and rates.

  The move was blocked until both packages became private: a published package cannot depend on a private one, and the hook re-exported a function that had to land in private `live-common`.

- [#21874](https://github.com/LedgerHQ/ledger-live/pull/21874) [`06b5db9`](https://github.com/LedgerHQ/ledger-live/commit/06b5db9dd2b49bbbf256e9376d67f9c64b3a1a4d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - feat: drop ACRE support

  Nothing consumes ACRE anymore: the live-app catalog serves no `acre` manifest and the mobile BTC stake action pointed at a missing live app.

  Removed:

  - the `@ledgerhq/wallet-api-acre-module` package
  - `wallet-api/ACRE` (server + tracking) and `families/bitcoin/ACRESetup.ts` in live-common
  - the `@blooo/hw-app-acre` dependency
  - every `isACRE` branch in the desktop and mobile sign message / sign transaction flows
  - `useACRECustomHandlers` on both apps
  - the mobile Bitcoin `accountActions` stake entry point

- [#21666](https://github.com/LedgerHQ/ledger-live/pull/21666) [`cb37b83`](https://github.com/LedgerHQ/ledger-live/commit/cb37b8353a60a829a560f90b22a792936d9a2f1b) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Remove the Vault Signer feature and the `@ledgerhq/hw-transport-vault` package behind it, now
  that the Ledger Vault product team has confirmed it is unused.

  Gone with it: the Experimental setting and its modal, the top banner, the `vaultSigner` settings
  slice, and the branch that made `getCurrentDevice` return a synthetic Vault device ahead of every
  other transport. A persisted `vaultSigner` key needs no migration — `filterValidSettings` already
  strips keys absent from the initial state.

- [#21802](https://github.com/LedgerHQ/ledger-live/pull/21802) [`67ba7e2`](https://github.com/LedgerHQ/ledger-live/commit/67ba7e20fdc6e9bbee59b5b029365cf5f871ebe2) Thanks [@ysitbon](https://github.com/ysitbon)! - fix(feature-flags): serve the flags cached on the device at boot

  Both apps read their Firebase feature flags with `getAll()` placed behind
  `await fetchAndActivate()`, so a rejected or still-pending fetch never reached it and every flag
  resolved to its compiled default. Meanwhile the Firebase SDK was holding the config it activated
  in an earlier session on disk, unread.

  Each app now exposes `readCachedFlags()`, which serves that activated config with no network
  access, and the feature-flags middleware primes from it before the first fetch. A device that has
  been online at least once now boots on the values the backend actually sent, even offline.

  Entries the SDK serves from the seeded defaults are excluded from both reads, so a flag missing
  from the Firebase template is no longer recorded as if it had come from the backend. The resolved
  value is unchanged, since the slice falls back to those same defaults.

  On mobile, `setup()` now memoises its success only. Both readers await it, so a rejection kept in
  that memo was handed to `fetchRemoteFlags` too and took remote config off the network for the rest
  of the session. Both of its calls are idempotent, so dropping the memo on failure simply lets the
  next caller retry. The pre-migration code latched the same way, through
  `skip: !initResult.isSuccess` on a mutation fired once, but it cost only freshness back then
  because reads still went through the SDK and the config it holds on disk.

  `whenReady()` is removed from both modules. It had no consumers.

- [#21802](https://github.com/LedgerHQ/ledger-live/pull/21802) [`600d432`](https://github.com/LedgerHQ/ledger-live/commit/600d432657f1c9adf80af6730dd28f2177e05c5a) Thanks [@ysitbon](https://github.com/ysitbon)! - refactor(feature-flags): share the Firebase Remote Config parser between apps

  Both apps carried their own copy of the Firebase-key-to-FeatureId map and the loop that filters
  and JSON-parses a `getAll()` payload. `parseFirebaseFeatures` now lives in
  `@features/platform-feature-flags/firebase`, next to `formatToFirebaseFeatureId`, of which its
  key map is the exact inverse.

  It takes a structural `RemoteConfigValue` (`getSource()` + `asString()`), satisfied by both the
  Firebase JS SDK and `@react-native-firebase`, so the package gains no SDK dependency. Reading the
  SDK stays per-app, where the two platforms are deliberately asymmetric.

- [#21802](https://github.com/LedgerHQ/ledger-live/pull/21802) [`7a18125`](https://github.com/LedgerHQ/ledger-live/commit/7a1812584758a29c935f3ceb15792aaf6a5d4586) Thanks [@ysitbon](https://github.com/ysitbon)! - fix(feature-flags): prime the flag slice from the device cache at store creation

  Both stores now pass `readCachedFlags` to the feature-flags middleware, so the slice resolves on
  the values Firebase last sent to this device before the first network fetch is attempted.

  They also pass an `onRemoteFlagsError` reporter. Failed flag reads used to be swallowed entirely.
  It warns only on a cold failure, when no values are held yet and the session really is running on
  compiled defaults; a failed poll that still has previous values is routine and stays silent.

  On desktop, disabling `fetchRemoteFlags` (as tests do) now disables the cache read too, so opting
  out of the backend opts out of the whole Firebase path.

- [#21633](https://github.com/LedgerHQ/ledger-live/pull/21633) [`60655cd`](https://github.com/LedgerHQ/ledger-live/commit/60655cdf828eebdddd515d52c8fc5876ea50baf8) Thanks [@qperrot](https://github.com/qperrot)! - Add memo on xrp operation details

- [#22022](https://github.com/LedgerHQ/ledger-live/pull/22022) [`2aa4581`](https://github.com/LedgerHQ/ledger-live/commit/2aa45814f2c4eacfb47fc79fdaf336e42087366a) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Bump lumen-ui-react to 0.1.58, lumen-ui-rnative to 0.1.61, crypto-icons to 2.0.6; migrate TransactionalIcon to getDotIconProps

- [#21887](https://github.com/LedgerHQ/ledger-live/pull/21887) [`a62261e`](https://github.com/LedgerHQ/ledger-live/commit/a62261e2e63218affcd3690a70b5a42f355a48a4) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Tell the user a currency is unavailable in their region instead of showing a generic balance error, and bump coin-module-framework to 9.1.0 for the typed checkRegionRestriction flag

- [#21751](https://github.com/LedgerHQ/ledger-live/pull/21751) [`dc204a7`](https://github.com/LedgerHQ/ledger-live/commit/dc204a7633e6f7c9acb66fbb18a6aeaa2e75c4bb) Thanks [@sarneijim](https://github.com/sarneijim)! - Add releaseTour and gate Q2/Q3 tours with it, dropping q2Tour/q3Tour from Wallet 4.0

- [#21977](https://github.com/LedgerHQ/ledger-live/pull/21977) [`8d274de`](https://github.com/LedgerHQ/ledger-live/commit/8d274de51cab8d2cab27a772ba7604c2cf5ee25a) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix Pay Tab receive deposit option to let users pick an existing stablecoin account instead of forcing a new one

- [#22042](https://github.com/LedgerHQ/ledger-live/pull/22042) [`351d14c`](https://github.com/LedgerHQ/ledger-live/commit/351d14c7ee9733e850abfbf4418058ed14e52c0e) Thanks [@smartling-github-connector](https://github.com/apps/smartling-github-connector)! - LWD 4.21.0 release notes

- [#21842](https://github.com/LedgerHQ/ledger-live/pull/21842) [`a4d993a`](https://github.com/LedgerHQ/ledger-live/commit/a4d993a361a612ada130db573f12fef4af38eacb) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Keep the mock server device screen reachable while a device-interaction modal is open, instead of the press dismissing the modal

- [#21966](https://github.com/LedgerHQ/ledger-live/pull/21966) [`38b7dab`](https://github.com/LedgerHQ/ledger-live/commit/38b7dab3436b2e72b4e8642f6c6b0fd9118475bc) Thanks [@sarneijim](https://github.com/sarneijim)! - Move Q2/Q3 debug tours into Features & Flows

- [#21791](https://github.com/LedgerHQ/ledger-live/pull/21791) [`a6a7a94`](https://github.com/LedgerHQ/ledger-live/commit/a6a7a946b1c1dbdda1cfa2c049f536f7235ddde2) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Complete the Card login on desktop. The provider's page opens in the Discover webview, and the
  manifest of the live app owns its origin. The `lwdPayTab` flag carries `baanx_login_manifest_id`
  and `baanx_hosted_manifest_id`, which default to the staging manifests. A redirect that echoes no
  attempt id now passes the callback guards, so the app's own deep link completes the login.

- [#22021](https://github.com/LedgerHQ/ledger-live/pull/22021) [`8dc8e99`](https://github.com/LedgerHQ/ledger-live/commit/8dc8e99e069baafdbde2dfa66b3cc06878012533) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - feat(pay-card): set the seven Baanx configuration values per environment

- [#21663](https://github.com/LedgerHQ/ledger-live/pull/21663) [`c6f7bfe`](https://github.com/LedgerHQ/ledger-live/commit/c6f7bfead8593c148fe6e3d177ff8dd734728f5a) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Mark a frozen pay card on the card visual: the card face fades out behind a centered snow `Spot`, read from the same card status the freeze tile uses. The features/flow jest projects now compile `@ledgerhq/lumen-utils-shared` instead of leaving its ESM untransformed, so views can use `cn`.

- [#21792](https://github.com/LedgerHQ/ledger-live/pull/21792) [`0e1e102`](https://github.com/LedgerHQ/ledger-live/commit/0e1e10227aa5cc0d19e8a142533c54838e3ed57e) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - The desktop Pay tab centres the Card login block, and it offers a login link to a card holder who
  has a card already. The login reads every error message from the copy keys.

- [#21915](https://github.com/LedgerHQ/ledger-live/pull/21915) [`34f8541`](https://github.com/LedgerHQ/ledger-live/commit/34f8541ae58847dcee784b3fe97f227edd644775) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - fix(pay-card): save the Card login intro flag after a redirect login, and give the desktop login block a title before the intro

- [#21918](https://github.com/LedgerHQ/ledger-live/pull/21918) [`fcc2ac4`](https://github.com/LedgerHQ/ledger-live/commit/fcc2ac4c5ed270fb63df4c0079068ad6dac94612) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Sign a mock Card session in and out from the Pay Card DevTool, and answer the Card endpoints from the desktop MSW worker, so the Card surfaces can be reached without the hosted login.

- [#21934](https://github.com/LedgerHQ/ledger-live/pull/21934) [`c5229d1`](https://github.com/LedgerHQ/ledger-live/commit/c5229d1b2bbf8d8067e036f0a34dda403519e206) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Pass host amount and date formatters as one object, using Desktop's date formatter for transaction dates.

- [#21872](https://github.com/LedgerHQ/ledger-live/pull/21872) [`37f5759`](https://github.com/LedgerHQ/ledger-live/commit/37f57595f11d40562914794645cb3c7f6e55dc8b) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Read the card transactions and give each one its spend category.

  - `useCardTransactionsViewModel` reads the first page of `GET /v1/card/transactions` while a session is live, and hands each transaction its category and that category's translated label.
  - `mccCategory` is now the closed set the provider documents (`PayCardTransactionCategory`), and a grouping it never named reads as `MISC` so one new label cannot fail a whole page.
  - `mockPayCardTransactions` answers a page covering every category, served by the desktop and mobile MSW workers on `GET /v1/card/transactions`.

- [#21917](https://github.com/LedgerHQ/ledger-live/pull/21917) [`a2a0288`](https://github.com/LedgerHQ/ledger-live/commit/a2a028844dbfbfa019f1f971bf6fdbed9005b9ec) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Show card transactions on the Pay Card panel as a list of items, with a subheader when the list is not empty.

- [#21793](https://github.com/LedgerHQ/ledger-live/pull/21793) [`e3799dc`](https://github.com/LedgerHQ/ledger-live/commit/e3799dc4028131cfb099ef79cf6750acd610e0fd) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - The provider's browser session no longer outlives the Card login. The Discover webview runs in the app's default session, which keeps cookies on disk, so a restart left the card holder still logged in at the provider and one click could mint a new code. A sign-in state that changes now ends that session: the main process removes the cookies for the hosts the Card manifests name and clears their origin storages. A cookie that Ledger shares across `ledger.com` stays, because the Card login does not own it.

- [#22023](https://github.com/LedgerHQ/ledger-live/pull/22023) [`0f4b55e`](https://github.com/LedgerHQ/ledger-live/commit/0f4b55e46459492e880a8e5e118b570a934ce4d7) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Polish Pay tab UI: square network icons, verify-address icon size, deposit dialog inset, header/balance spacing, and move card title/balance copy into the flow.

- [#21937](https://github.com/LedgerHQ/ledger-live/pull/21937) [`cd32aad`](https://github.com/LedgerHQ/ledger-live/commit/cd32aad899bf91b1843cdbc3e839bbfcdb0f443b) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Explain on a Hyperliquid account that transactions are not supported and offer a way to open Perps

- [#21687](https://github.com/LedgerHQ/ledger-live/pull/21687) [`f891d58`](https://github.com/LedgerHQ/ledger-live/commit/f891d5815f72ae87604494b0ffba8c3d4fafca63) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Render the add-account drawer on the fullscreen Perps route, where the main shell and its drawer are hidden (LIVE-35326).

- [#21929](https://github.com/LedgerHQ/ledger-live/pull/21929) [`47c1dde`](https://github.com/LedgerHQ/ledger-live/commit/47c1ddeb31b0acd87b65fd50218fce65a7d43a42) Thanks [@sarneijim](https://github.com/sarneijim)! - Auto-open the Q3 product tour on Portfolio and include the tour variant in analytics

- [#20774](https://github.com/LedgerHQ/ledger-live/pull/20774) [`c6a569d`](https://github.com/LedgerHQ/ledger-live/commit/c6a569d5848e6c0fd7973cb5ab7241b39d47f77b) Thanks [@amaslakov](https://github.com/amaslakov)! - Add the ICP neuron management and voting-power confirmation flows on Desktop, with the periodic-confirmation decode and neuron helpers they run on.

  An accepted command is reflected as soon as the network accepts it, without waiting for a device-signed refresh, and the account re-syncs after a stake. A command the device has already signed is offered for retry only when the network says nothing ran. Actions a neuron cannot take are not offered — Increase stake without a recoverable stake nonce, Increase dissolve delay with under a day of room, a followee list that changes nothing. Staked maturity counts toward the account's Total Maturity, and a rejected input names the bound it broke rather than an error class name.

- [#21683](https://github.com/LedgerHQ/ledger-live/pull/21683) [`8427ffd`](https://github.com/LedgerHQ/ledger-live/commit/8427ffdf83031f0e119680abecf815f8f4f60cf9) Thanks [@semeano](https://github.com/semeano)! - Move selected send-pool balance helper out of live-common into @ledgerhq/live-send

- [#22188](https://github.com/LedgerHQ/ledger-live/pull/22188) [`22c8acd`](https://github.com/LedgerHQ/ledger-live/commit/22c8acd5b6c192b2190f7b66308cf3b8d0e1871e) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Correct the Send memo help text, which repeated the memo label and described memos as an exchange-only requirement. Currencies can now provide their own wording; Zcash describes its memo as optional and encrypted

- [#21825](https://github.com/LedgerHQ/ledger-live/pull/21825) [`e31a99e`](https://github.com/LedgerHQ/ledger-live/commit/e31a99e0c1a5449aa1ab8729130e1d123b1ffdad) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add @shared/platform-linking package for cross-platform external link handling with URL safety, localization and analytics

- [#22088](https://github.com/LedgerHQ/ledger-live/pull/22088) [`ac2901d`](https://github.com/LedgerHQ/ledger-live/commit/ac2901d8727d0038f7d56e40962538397bfe97b6) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Fix the sidebar navigation bottom edge no longer aligning with the page content

- [#21947](https://github.com/LedgerHQ/ledger-live/pull/21947) [`9d0b721`](https://github.com/LedgerHQ/ledger-live/commit/9d0b721dbfd8b71d32d2d16db22ad8e54f45f541) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the mobile Pay Card transaction detail sheet with tracking and copyable transaction IDs.

- [#21784](https://github.com/LedgerHQ/ledger-live/pull/21784) [`8b04a09`](https://github.com/LedgerHQ/ledger-live/commit/8b04a09d3f9d585e0076037dd5d651697c5764ad) Thanks [@YazhuEth](https://github.com/YazhuEth)! - fix(solana): remove the hardcoded blind signing warning from the transaction summary, the device now warns only when the transaction is actually blind signed

- [#21869](https://github.com/LedgerHQ/ledger-live/pull/21869) [`4c314f4`](https://github.com/LedgerHQ/ledger-live/commit/4c314f4035581de1affaba8419cd062359251c2f) Thanks [@amaslakov](https://github.com/amaslakov)! - Check a PLT recipient against the token's allow and deny lists before signing

  A transfer the lists refuse is rejected on chain after the user has signed and paid the
  fee, so `getTransactionStatus` now resolves the recipient's standing and reports it under
  the recipient field. The token's own state is read first, and a token declaring neither
  list never looks the recipient up. An undecodable state or a failed lookup blocks as
  unverifiable rather than passing as allowed. Adds the English error strings.

- [#21683](https://github.com/LedgerHQ/ledger-live/pull/21683) [`2eb6f5c`](https://github.com/LedgerHQ/ledger-live/commit/2eb6f5c7b3a7694a028bfe62279102188aeac028) Thanks [@semeano](https://github.com/semeano)! - add balance-type pool selection step to Zcash send flow

  The amount step's 25/50/75% selectors now apply to the pool the user picked rather than to the account total, which sums pools the transaction cannot spend from.

  The recipient step's transfer-to-my-other-pool shortcut now records the transfer on the transaction (for Zcash, `selfTransfer`), so the prefilled address keeps its self-transfer semantics instead of looking like a send to a typed address. Picking any other recipient clears it again.

- [#21939](https://github.com/LedgerHQ/ledger-live/pull/21939) [`d1d26de`](https://github.com/LedgerHQ/ledger-live/commit/d1d26def09d28102238b31b684d1745c4f1ad8cc) Thanks [@semeano](https://github.com/semeano)! - Add Zcash shielded send screens (recipient sync notice and family device-signature confirmation) and block the recipient step until shielded sync reports complete

- [#22188](https://github.com/LedgerHQ/ledger-live/pull/22188) [`22c8acd`](https://github.com/LedgerHQ/ledger-live/commit/22c8acd5b6c192b2190f7b66308cf3b8d0e1871e) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Align the Zcash device-confirmation step with every other currency: the signature screen no longer shows the recipient or the amount, which are verified on the device

### Patch Changes

- Updated dependencies [[`9164e8b`](https://github.com/LedgerHQ/ledger-live/commit/9164e8b81ecb84e5d8ba0bb606981c2dc83d04c1), [`e09211c`](https://github.com/LedgerHQ/ledger-live/commit/e09211c3477dc91530c2670a0b34b29fb8d3d943), [`1995d49`](https://github.com/LedgerHQ/ledger-live/commit/1995d49c63301199aef3e9a079f1d10fd0598f8b), [`2e47336`](https://github.com/LedgerHQ/ledger-live/commit/2e4733627ccb62c39fdf1e7d4b9f7d22559609bf), [`8f62cdb`](https://github.com/LedgerHQ/ledger-live/commit/8f62cdbb6d93e207efd7e551af65a41953d28242), [`182fae7`](https://github.com/LedgerHQ/ledger-live/commit/182fae7fbfa81b42de061e67da8edf21a7f72281), [`ba31ece`](https://github.com/LedgerHQ/ledger-live/commit/ba31ece3a22febeafbec027840d16ea82c2dad5e), [`13e3ebb`](https://github.com/LedgerHQ/ledger-live/commit/13e3ebba3ec7f10dcaf7d960f242f14a9853a191), [`16a454f`](https://github.com/LedgerHQ/ledger-live/commit/16a454fa79be46df6aec3c50ad40407f36dfdea9), [`782b197`](https://github.com/LedgerHQ/ledger-live/commit/782b197bf61a233f5c6ffe7f68e37267f8546e73), [`de19b3e`](https://github.com/LedgerHQ/ledger-live/commit/de19b3e4e56a0c28fcc1a3ca929059e84fc7bebf), [`25224f4`](https://github.com/LedgerHQ/ledger-live/commit/25224f463b834dba7a2811d7150aeec6dbd6a3ac), [`96a1ca9`](https://github.com/LedgerHQ/ledger-live/commit/96a1ca9fef1b0acc8113708c148890054dea143d), [`f5d0da5`](https://github.com/LedgerHQ/ledger-live/commit/f5d0da5d43ff492175433453b08533cee324c6e2), [`f7fa8f0`](https://github.com/LedgerHQ/ledger-live/commit/f7fa8f0ff23c03a69933f2d6aa6e0b225af9d542), [`e8fa868`](https://github.com/LedgerHQ/ledger-live/commit/e8fa86874942249a54884353c6c1b070af80d4b1), [`738c0d8`](https://github.com/LedgerHQ/ledger-live/commit/738c0d8a1357e96713bfc0d7a40ca403b5290c35), [`7cc3e2c`](https://github.com/LedgerHQ/ledger-live/commit/7cc3e2c36608b105956360c1cb1c911c720fd5c9), [`1eb2e00`](https://github.com/LedgerHQ/ledger-live/commit/1eb2e00074fe05f103dd33c3fbf295cfd39e9c2e), [`632dd93`](https://github.com/LedgerHQ/ledger-live/commit/632dd9368616a97581d037f1503b2b16f567c02a), [`036b71d`](https://github.com/LedgerHQ/ledger-live/commit/036b71d678a57c3b1c3156374122fe13bea54f79), [`85e01c4`](https://github.com/LedgerHQ/ledger-live/commit/85e01c449dab75d75851631a56d292f2cb0c5b36), [`799219e`](https://github.com/LedgerHQ/ledger-live/commit/799219e262e80a339272113ea164fa506243b438), [`e37413b`](https://github.com/LedgerHQ/ledger-live/commit/e37413b588873a1a2a028ebf4c1971e4fa92ed2a), [`9e61582`](https://github.com/LedgerHQ/ledger-live/commit/9e61582edfcbb98046d0f74111ccf4061ec44bb3), [`e3535da`](https://github.com/LedgerHQ/ledger-live/commit/e3535da7e5c884f8ada75eff52c0c4538142fffb), [`fecfcf7`](https://github.com/LedgerHQ/ledger-live/commit/fecfcf7570ed70213a9c0e32c2822b4eb057eb03), [`05cb97c`](https://github.com/LedgerHQ/ledger-live/commit/05cb97c6986755d87d4c0b3df3d8b4daf9ba77df), [`251af57`](https://github.com/LedgerHQ/ledger-live/commit/251af57e7412e493deaecddf627e3967ba044c09), [`b30f903`](https://github.com/LedgerHQ/ledger-live/commit/b30f903f592c0bafba74a1784d98b9d605c18ccb), [`5b60a96`](https://github.com/LedgerHQ/ledger-live/commit/5b60a968d3292b3897380f2c74c472a51b81e35d), [`da3d09d`](https://github.com/LedgerHQ/ledger-live/commit/da3d09d75d7dcae659611cd371c48d75c03f7ae4), [`cdb273b`](https://github.com/LedgerHQ/ledger-live/commit/cdb273b068df78cd5a0dbd4281fb79f22e0a7506), [`54fce77`](https://github.com/LedgerHQ/ledger-live/commit/54fce77bfa46c3d42d3e39b80804258a91d910f2), [`ee1b919`](https://github.com/LedgerHQ/ledger-live/commit/ee1b9192421545035fb547f27319d7f816d85fe8), [`9e37f58`](https://github.com/LedgerHQ/ledger-live/commit/9e37f58a84f7ee9585142c0a8ac767da58b6d06f), [`06b5db9`](https://github.com/LedgerHQ/ledger-live/commit/06b5db9dd2b49bbbf256e9376d67f9c64b3a1a4d), [`7e44af4`](https://github.com/LedgerHQ/ledger-live/commit/7e44af495eccab1fac4b0808d6729a595b610c69), [`600d432`](https://github.com/LedgerHQ/ledger-live/commit/600d432657f1c9adf80af6730dd28f2177e05c5a), [`7050652`](https://github.com/LedgerHQ/ledger-live/commit/70506520dafbccca4e014ac30d75647a5b7fe7d0), [`7bfbb69`](https://github.com/LedgerHQ/ledger-live/commit/7bfbb69b29d66d1b908cddd4b7cad893f77a8ebc), [`60655cd`](https://github.com/LedgerHQ/ledger-live/commit/60655cdf828eebdddd515d52c8fc5876ea50baf8), [`bb2f03e`](https://github.com/LedgerHQ/ledger-live/commit/bb2f03e41b96b8f95f239acea75428657cdd64fe), [`8146728`](https://github.com/LedgerHQ/ledger-live/commit/814672815a08dd57160d3aa4c28e92c3f508807e), [`b30a8cd`](https://github.com/LedgerHQ/ledger-live/commit/b30a8cd8acfeabb444cd7e2acb1ac5eaa959b221), [`a62261e`](https://github.com/LedgerHQ/ledger-live/commit/a62261e2e63218affcd3690a70b5a42f355a48a4), [`dc204a7`](https://github.com/LedgerHQ/ledger-live/commit/dc204a7633e6f7c9acb66fbb18a6aeaa2e75c4bb), [`939300a`](https://github.com/LedgerHQ/ledger-live/commit/939300add757537632def29302a24a72a67f84b6), [`354486c`](https://github.com/LedgerHQ/ledger-live/commit/354486ca79badb49b9c902b1724a36379c278358), [`73eb9bc`](https://github.com/LedgerHQ/ledger-live/commit/73eb9bc68ed87f07142a1fdf54e4cd68af3a36d4), [`d1a8cb2`](https://github.com/LedgerHQ/ledger-live/commit/d1a8cb2403bbe6771dfee3e43fbc4c4df61d4c7c), [`903c180`](https://github.com/LedgerHQ/ledger-live/commit/903c1802ea5d4cc3fe1bfe5609b8cf3871152cf0), [`30828c2`](https://github.com/LedgerHQ/ledger-live/commit/30828c22cc44c9929d7eda782e9d559a9e0145c3), [`cef83ae`](https://github.com/LedgerHQ/ledger-live/commit/cef83ae58ffc5529bebda292737502e78e3b7522), [`3f34609`](https://github.com/LedgerHQ/ledger-live/commit/3f34609edecc5ae85a9a9ac1b76ab47e30a9c66e), [`a6a7a94`](https://github.com/LedgerHQ/ledger-live/commit/a6a7a946b1c1dbdda1cfa2c049f536f7235ddde2), [`c6f7bfe`](https://github.com/LedgerHQ/ledger-live/commit/c6f7bfead8593c148fe6e3d177ff8dd734728f5a), [`0e1e102`](https://github.com/LedgerHQ/ledger-live/commit/0e1e10227aa5cc0d19e8a142533c54838e3ed57e), [`34f8541`](https://github.com/LedgerHQ/ledger-live/commit/34f8541ae58847dcee784b3fe97f227edd644775), [`fcc2ac4`](https://github.com/LedgerHQ/ledger-live/commit/fcc2ac4c5ed270fb63df4c0079068ad6dac94612), [`eddc89e`](https://github.com/LedgerHQ/ledger-live/commit/eddc89e7b86a13aeedfc0ae4956c2dcd08494e5f), [`b976cda`](https://github.com/LedgerHQ/ledger-live/commit/b976cda52320ef3f778fc11b4f95d2c5bf54ffe0), [`e7d79ac`](https://github.com/LedgerHQ/ledger-live/commit/e7d79acf1d91e98e2813755f9bebdbfd83e89f39), [`c5229d1`](https://github.com/LedgerHQ/ledger-live/commit/c5229d1b2bbf8d8067e036f0a34dda403519e206), [`37f5759`](https://github.com/LedgerHQ/ledger-live/commit/37f57595f11d40562914794645cb3c7f6e55dc8b), [`a2a0288`](https://github.com/LedgerHQ/ledger-live/commit/a2a028844dbfbfa019f1f971bf6fdbed9005b9ec), [`6553e61`](https://github.com/LedgerHQ/ledger-live/commit/6553e61da87bd604a357d5a79eefd3ac17e225d1), [`8b3320d`](https://github.com/LedgerHQ/ledger-live/commit/8b3320d7aab0ff25eeb8930dafa536fb94962c79), [`19314ca`](https://github.com/LedgerHQ/ledger-live/commit/19314cafec3eee0803bee7f9b877c9e9ccc819e8), [`e65a6b3`](https://github.com/LedgerHQ/ledger-live/commit/e65a6b3e67e271343b7029613498176b1da2d7d2), [`4ac2794`](https://github.com/LedgerHQ/ledger-live/commit/4ac2794b8244b094f2e91563bb7ad8a220d6cba5), [`2edc7c8`](https://github.com/LedgerHQ/ledger-live/commit/2edc7c8d47b1ac8b49194155be8f8b3722574d39), [`0f4b55e`](https://github.com/LedgerHQ/ledger-live/commit/0f4b55e46459492e880a8e5e118b570a934ce4d7), [`c88b5c6`](https://github.com/LedgerHQ/ledger-live/commit/c88b5c65b0488097e2a17071ca04ac06ae41763a), [`5ddb9ab`](https://github.com/LedgerHQ/ledger-live/commit/5ddb9ab2874a6715d706042701e8b2242b1c14b9), [`c72a646`](https://github.com/LedgerHQ/ledger-live/commit/c72a646d28a4a5d144808f4a99e80d7788895603), [`6c1be58`](https://github.com/LedgerHQ/ledger-live/commit/6c1be58b4dbcce00cc114442d2aeb76278248d99), [`c6a569d`](https://github.com/LedgerHQ/ledger-live/commit/c6a569d5848e6c0fd7973cb5ab7241b39d47f77b), [`8427ffd`](https://github.com/LedgerHQ/ledger-live/commit/8427ffdf83031f0e119680abecf815f8f4f60cf9), [`a5d438e`](https://github.com/LedgerHQ/ledger-live/commit/a5d438e3c6cd557e8c77f2f40be2c20540f23cec), [`e31a99e`](https://github.com/LedgerHQ/ledger-live/commit/e31a99e0c1a5449aa1ab8729130e1d123b1ffdad), [`9d0b721`](https://github.com/LedgerHQ/ledger-live/commit/9d0b721dbfd8b71d32d2d16db22ad8e54f45f541), [`529a7fc`](https://github.com/LedgerHQ/ledger-live/commit/529a7fc909409f4f5740ce8add9abbab1b784157), [`a9f0a51`](https://github.com/LedgerHQ/ledger-live/commit/a9f0a51f20cf3e7b038cc6e5762557e93760a37e), [`a17ef12`](https://github.com/LedgerHQ/ledger-live/commit/a17ef128d44c9ca9bc85c3c8b8d691981c5e638f), [`d353658`](https://github.com/LedgerHQ/ledger-live/commit/d353658a0254e49a369ca7481c9680254e9e4851), [`b49d5b5`](https://github.com/LedgerHQ/ledger-live/commit/b49d5b573e84bd63ac460ae398657f1035613141), [`4c314f4`](https://github.com/LedgerHQ/ledger-live/commit/4c314f4035581de1affaba8419cd062359251c2f), [`2eb6f5c`](https://github.com/LedgerHQ/ledger-live/commit/2eb6f5c7b3a7694a028bfe62279102188aeac028), [`d1d26de`](https://github.com/LedgerHQ/ledger-live/commit/d1d26def09d28102238b31b684d1745c4f1ad8cc)]:
  - @features/flow-pay-card-details@0.4.0
  - @ledgerhq/live-common@38.0.0
  - @features/flow-pay-card-transactions@0.2.0
  - @features/flow-pay-card@0.4.0
  - @domain/api-card-management@0.6.0
  - @features/flow-pay-card-auth@0.7.0
  - @features/flow-contacts-list@0.7.0
  - @features/platform-contacts@0.7.0
  - @features/flow-contacts-introduction@1.2.0
  - @features/flow-contacts-add-address@0.5.0
  - @shared/feature-flags@0.23.0
  - @ledgerhq/coin-zcash@0.8.0
  - @ledgerhq/coin-concordium@1.3.0
  - @features/flow-large-screen-upsell@2.1.0
  - @features/flow-contacts@0.11.0
  - @features/flow-contacts-add-contact@0.6.0
  - @ledgerhq/types-live@6.124.0
  - @features/platform-feature-flags@0.7.0
  - @devtools/bindings@0.8.0
  - @ledgerhq/react-ui@0.55.0
  - @domain/entity-contact@0.9.0
  - @ledgerhq/live-dmk-speculos@0.11.0
  - @shared/env@0.7.0
  - @ledgerhq/ledger-key-ring-protocol@0.22.0
  - @ledgerhq/coin-cosmos@1.3.0
  - @ledgerhq/live-countervalues@0.26.0
  - @ledgerhq/live-countervalues-react@0.18.0
  - @ledgerhq/wallet-btc@0.5.0
  - @features/flow-pay-card-widget@0.3.0
  - @features/flow-pay-request@0.5.0
  - @features/flow-pay-contact@0.4.0
  - @features/flow-pay-deposit@0.4.0
  - @ledgerhq/ledger-wallet-framework@3.4.0
  - @ledgerhq/live-send@0.1.0
  - @shared/platform-linking@0.2.0
  - @features/flow-contacts-edit-contact@0.5.0
  - @features/platform-card@0.5.0
  - @features/platform-style@0.4.0
  - @ledgerhq/asset-detail@0.11.5
  - @ledgerhq/live-dmk-desktop@0.21.1
  - @features/flow-contacts-delete-contact@0.2.2
  - @features/flow-contacts-edit-address@0.3.1
  - @features/flow-pay-balance@0.4.2
  - @features/flow-pay-bank-transfer@0.3.1
  - @features/flow-pay-feature-tour@0.5.1
  - @features/platform-device-action-content@0.2.1
  - @shared/ui-info-state@0.2.2
  - @features/platform-currencies@0.8.1
  - @ledgerhq/asset-aggregation@0.15.1
  - @ledgerhq/coin-bitcoin@0.52.1
  - @ledgerhq/coin-canton@1.1.2
  - @ledgerhq/coin-cardano@1.1.2
  - @ledgerhq/coin-casper@3.3.1
  - @ledgerhq/coin-filecoin@2.1.2
  - @ledgerhq/domain-service@1.8.19
  - @ledgerhq/live-signer-evm@0.23.2
  - @ledgerhq/live-wallet@1.1.3
  - @ledgerhq/transaction-observability@0.3.1
  - @ledgerhq/wallet-analytics@0.4.1
  - @ledgerhq/wallet-pnl@0.7.11
  - @features/flow-analytics-consent@0.2.6
  - @domain/api-aggregated-assets@0.5.1
  - @features/platform-aggregated-assets@0.5.3
  - @features/platform-env@0.3.1
  - @shared/api-services@0.7.0
  - @shared/auth@0.6.0
  - @shared/cloud-sync@0.3.0
  - @shared/i18n@0.2.0
  - @devtools/shell@0.9.3

## 4.21.0-next.5

### Patch Changes

- Updated dependencies [[`354486c`](https://github.com/LedgerHQ/ledger-live/commit/354486ca79badb49b9c902b1724a36379c278358)]:
  - @ledgerhq/live-common@38.0.0-next.1
  - @ledgerhq/asset-detail@0.11.5-next.1
  - @ledgerhq/live-dmk-desktop@0.21.1-next.1
  - @ledgerhq/live-send@0.1.0-next.1

## 4.21.0-next.4

### Minor Changes

- [#22254](https://github.com/LedgerHQ/ledger-live/pull/22254) [`7cc3e2c`](https://github.com/LedgerHQ/ledger-live/commit/7cc3e2c36608b105956360c1cb1c911c720fd5c9) Thanks [@sarneijim](https://github.com/sarneijim)! - Share Nano S Touchscreen Upgrade Program banner copy keys so Desktop and Mobile can reuse the same model-specific lookup

### Patch Changes

- Updated dependencies [[`7cc3e2c`](https://github.com/LedgerHQ/ledger-live/commit/7cc3e2c36608b105956360c1cb1c911c720fd5c9)]:
  - @features/flow-large-screen-upsell@2.1.0-next.1

## 4.21.0-next.3

### Minor Changes

- [#22188](https://github.com/LedgerHQ/ledger-live/pull/22188) [`22c8acd`](https://github.com/LedgerHQ/ledger-live/commit/22c8acd5b6c192b2190f7b66308cf3b8d0e1871e) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Correct the Send memo help text, which repeated the memo label and described memos as an exchange-only requirement. Currencies can now provide their own wording; Zcash describes its memo as optional and encrypted

- [#22188](https://github.com/LedgerHQ/ledger-live/pull/22188) [`22c8acd`](https://github.com/LedgerHQ/ledger-live/commit/22c8acd5b6c192b2190f7b66308cf3b8d0e1871e) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Align the Zcash device-confirmation step with every other currency: the signature screen no longer shows the recipient or the amount, which are verified on the device

## 4.21.0-next.2

### Minor Changes

- [#22088](https://github.com/LedgerHQ/ledger-live/pull/22088) [`ac2901d`](https://github.com/LedgerHQ/ledger-live/commit/ac2901d8727d0038f7d56e40962538397bfe97b6) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Fix the sidebar navigation bottom edge no longer aligning with the page content

## 4.21.0-next.1

### Minor Changes

- [#22042](https://github.com/LedgerHQ/ledger-live/pull/22042) [`351d14c`](https://github.com/LedgerHQ/ledger-live/commit/351d14c7ee9733e850abfbf4418058ed14e52c0e) Thanks [@smartling-github-connector](https://github.com/apps/smartling-github-connector)! - LWD 4.21.0 release notes

## 4.21.0-next.0

### Minor Changes

- [#21406](https://github.com/LedgerHQ/ledger-live/pull/21406) [`365a1bb`](https://github.com/LedgerHQ/ledger-live/commit/365a1bb557d4da011932a75e612483bacfed5629) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Wait for the mina staking fee before handing the transaction to the device

  Picking a validator only sets the recipient on the transaction; the bridge resolves the fee right
  after. The continue button of the validator step was enabled as soon as a validator was selected, so
  leaving for the device before the fee landed sent it a zero fee — which the mina signer rejects
  outright with `Missing or wrong arguments`, without ever displaying the transaction. The button now
  waits for the bridge, like the other delegation flows do.

  The undelegate flow opens straight on the device step and has no footer to hold it back, so that
  step now waits for the same signal before mounting the device action.

- [#21662](https://github.com/LedgerHQ/ledger-live/pull/21662) [`9164e8b`](https://github.com/LedgerHQ/ledger-live/commit/9164e8b81ecb84e5d8ba0bb606981c2dc83d04c1) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add freeze/unfreeze confirmation dialog and bottom sheet for pay card

- [#21707](https://github.com/LedgerHQ/ledger-live/pull/21707) [`8f62cdb`](https://github.com/LedgerHQ/ledger-live/commit/8f62cdbb6d93e207efd7e551af65a41953d28242) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add View/Hide and a 3D flip for card numbers.

- [#21722](https://github.com/LedgerHQ/ledger-live/pull/21722) [`182fae7`](https://github.com/LedgerHQ/ledger-live/commit/182fae7fbfa81b42de061e67da8edf21a7f72281) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add a Card Details container with native artwork, Details sheet, and web composition

- [#21754](https://github.com/LedgerHQ/ledger-live/pull/21754) [`ba31ece`](https://github.com/LedgerHQ/ledger-live/commit/ba31ece3a22febeafbec027840d16ea82c2dad5e) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Render the native card details overview, freeze confirmation and More menu as scenes inside a single bottom sheet

- [#22037](https://github.com/LedgerHQ/ledger-live/pull/22037) [`785346c`](https://github.com/LedgerHQ/ledger-live/commit/785346c48a01e814ed6715b31a97584fc3bff496) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Fix Zcash shielded send follow-ups in the new Send flow

  The maturing-funds notice on the balance-type step was cut off because its whole sentence was
  packed into the banner title; it now splits into a title and a description like every other
  validation banner.

  Two error cases had no translation and fell back to the raw class name under a "contact support"
  description: sending to a `u1…` address before the private balance's viewing key has been exported,
  and a rare backend drift where a scanned note is not yet spendable by the builder.

  The new flow was also missing two shielded-sync triggers that the legacy Send modal already had: a
  resync right after broadcasting a private transfer, and one when entering the Amount step with the
  private pool selected. Both are wired through the same family-component slots the flow already uses
  for its other Zcash-specific screens.

  Pasting the unified (shielded) address of one of the user's own Zcash accounts did not resolve to
  anything useful -- only the transparent fresh address was recognized, and even then it showed the
  account's name rather than which pool it is. Recipient matching now goes through the coin-families
  contract so a family can declare every address its accounts are recognizable by, and an address that
  is the account's own self-transfer target now shows its pool label ("Private balance") instead,
  matching what the self-transfer shortcut already produces.

  The balance-selection step showed an aggregate balance and an account name that don't belong on a
  screen whose only purpose is picking between two pools; both are gone, matching the design, and the
  step's title now reads "Select balance". Every following step's header now shows which pool was
  picked next to the account name and balance (e.g. "ZEC 1 (Private balance) · 0.2 ZEC") -- resolved
  from the send descriptor, so every other currency's header is unchanged.

- [#21665](https://github.com/LedgerHQ/ledger-live/pull/21665) [`16a454f`](https://github.com/LedgerHQ/ledger-live/commit/16a454fa79be46df6aec3c50ad40407f36dfdea9) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Fix saving a contact address on EVM networks that ship their own coin app, such as Sei, Sonic and Ethereum Classic. The device app to open is now derived from the network family rather than from the network's own `managerAppName`, so EVM networks with an EIP-155 chain ID register through the Ethereum app and are told apart by that chain ID, which is what the Contacts device kit expects. These networks are selectable again, reversing the restriction added in LIVE-36688.

  Address-book eligibility now lives in a single place: `isEligibleAddressCurrency` moves from `@ledgerhq/live-common` to `@features/platform-contacts`, where it checks device capability alongside the network family. The send flow and the Contacts network picker previously answered this question separately, which is how an entry point could be offered for a network the device would refuse.

- [#21882](https://github.com/LedgerHQ/ledger-live/pull/21882) [`782b197`](https://github.com/LedgerHQ/ledger-live/commit/782b197bf61a233f5c6ffe7f68e37267f8546e73) Thanks [@LucasWerey](https://github.com/LucasWerey)! - fix bottom padding missing on the Ledger Sync intro modal in the Add Contact flow

- [#21855](https://github.com/LedgerHQ/ledger-live/pull/21855) [`24d1ff6`](https://github.com/LedgerHQ/ledger-live/commit/24d1ff67f1aea695dfcae2303f8a780feb985964) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Prevent saving duplicate addresses across contacts — show "This address is already used by [Contact Name]." when adding or editing an address that is already saved in another contact

- [#21681](https://github.com/LedgerHQ/ledger-live/pull/21681) [`de19b3e`](https://github.com/LedgerHQ/ledger-live/commit/de19b3e4e56a0c28fcc1a3ca929059e84fc7bebf) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add freeze/unfreeze confirmation error handling with retry

- [#21698](https://github.com/LedgerHQ/ledger-live/pull/21698) [`25224f4`](https://github.com/LedgerHQ/ledger-live/commit/25224f463b834dba7a2811d7150aeec6dbd6a3ac) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Move the More menu into card details and put freeze and More on one actions row

- [#21706](https://github.com/LedgerHQ/ledger-live/pull/21706) [`96a1ca9`](https://github.com/LedgerHQ/ledger-live/commit/96a1ca9fef1b0acc8113708c148890054dea143d) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add excludedCurrencyIds param to lwdContacts and lwmContacts feature flags to exclude specific currencies from Contacts

- [#21777](https://github.com/LedgerHQ/ledger-live/pull/21777) [`f7fa8f0`](https://github.com/LedgerHQ/ledger-live/commit/f7fa8f0ff23c03a69933f2d6aa6e0b225af9d542) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Resolve a single Pay Card display state so the card face, onboarding widget and login CTA no longer overlap, and hold them back until the stored session is read

- [#21931](https://github.com/LedgerHQ/ledger-live/pull/21931) [`e8fa868`](https://github.com/LedgerHQ/ledger-live/commit/e8fa86874942249a54884353c6c1b070af80d4b1) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add privacy policy disclaimer link to contacts add address flow on desktop and mobile

- [#21653](https://github.com/LedgerHQ/ledger-live/pull/21653) [`269d6d4`](https://github.com/LedgerHQ/ledger-live/commit/269d6d404779439d0e98beb2ed3cef82805612ae) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - feat(aleo): add the bond public staking flow

- [#21852](https://github.com/LedgerHQ/ledger-live/pull/21852) [`f6dc62f`](https://github.com/LedgerHQ/ledger-live/commit/f6dc62f7f23be9f46812fc13f00ddc373e5ca1af) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - feat(aleo): add the unbond staking flow

- [#21958](https://github.com/LedgerHQ/ledger-live/pull/21958) [`1eb2e00`](https://github.com/LedgerHQ/ledger-live/commit/1eb2e00074fe05f103dd33c3fbf295cfd39e9c2e) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the desktop Pay Card transaction detail dialog.

- [#21685](https://github.com/LedgerHQ/ledger-live/pull/21685) [`e0f0e6c`](https://github.com/LedgerHQ/ledger-live/commit/e0f0e6cc170b55472b528a969950caa05ae0a618) Thanks [@amaslakov](https://github.com/amaslakov)! - Add the error message shown when the protocol refuses a Tezos stake amount as too small

- [#21925](https://github.com/LedgerHQ/ledger-live/pull/21925) [`8b89707`](https://github.com/LedgerHQ/ledger-live/commit/8b89707aa9fee5d732cb22f55dbbecd301765b19) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Allow hardware carousel small-card titles to wrap on two lines on desktop, matching mobile layout

- [#21815](https://github.com/LedgerHQ/ledger-live/pull/21815) [`06b7fd3`](https://github.com/LedgerHQ/ledger-live/commit/06b7fd310ad9bc9200352ef5debf9dd2d5fb7a77) Thanks [@zel-kass](https://github.com/zel-kass)! - Fold Lumen visualization into lumen-ui-react and lumen-ui-rnative

- [#21651](https://github.com/LedgerHQ/ledger-live/pull/21651) [`632dd93`](https://github.com/LedgerHQ/ledger-live/commit/632dd9368616a97581d037f1503b2b16f567c02a) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Align Contacts analytics events and properties with the tracking plan on desktop and mobile.

- [#21921](https://github.com/LedgerHQ/ledger-live/pull/21921) [`036b71d`](https://github.com/LedgerHQ/ledger-live/commit/036b71d678a57c3b1c3156374122fe13bea54f79) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Align the add-contact confirmation CTA with "Add contact" on mobile and desktop

- [#21682](https://github.com/LedgerHQ/ledger-live/pull/21682) [`1fc1596`](https://github.com/LedgerHQ/ledger-live/commit/1fc1596773bf094e922433649bd63359961ed848) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Put the paid amount under the You paid title on the Pay success dialog.

- [#21717](https://github.com/LedgerHQ/ledger-live/pull/21717) [`9521860`](https://github.com/LedgerHQ/ledger-live/commit/95218609a18754a6fbbdd6144fc109f6a0c2dbb6) Thanks [@sarneijim](https://github.com/sarneijim)! - Add the Q3 Wallet V4 Tour carousel to the desktop debug tool, gated by releaseTour variants q3_a, q3_b (no Pay) and q3_b2 (Pay without card), with the mobile light and dark assets, copy, navigation, dismissal, and analytics.

- [#21670](https://github.com/LedgerHQ/ledger-live/pull/21670) [`d394600`](https://github.com/LedgerHQ/ledger-live/commit/d39460090faf503f890efeb76f5dc771e1b65c4f) Thanks [@sarneijim](https://github.com/sarneijim)! - Add Q3 tour persisted seen state and Wallet Features debug controls on desktop, gated by releaseTour (q3_a) rather than lwdWallet40. Open Drawer stays disabled.

- [#21720](https://github.com/LedgerHQ/ledger-live/pull/21720) [`05cb97c`](https://github.com/LedgerHQ/ledger-live/commit/05cb97c6986755d87d4c0b3df3d8b4daf9ba77df) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Craft and sign PLT transfers

  `craftPltTransaction` builds a `TokenUpdate` payload from the CAL-resolved token id, the
  CAL unit magnitude as the amount's exponent, and the energy persisted at estimation time,
  and `signOperation` routes a transaction carrying a token sub-account to it. The signer
  interface widens to `AnyTransaction`; its body already serialized both kinds. A PLT send
  now reports the CCD fee on the parent account and the token amount on the sub-account,
  matching the pair sync builds once the transfer is indexed. `updateTransaction` drops the
  persisted energy alongside the fee, so a re-selected token cannot inherit the previous
  token's energy limit. Adds the English error strings for the two signer failures this path
  can surface.

  Signing on a device needs the PLT-capable Concordium app; until it ships, an attempt
  surfaces as a translated "update your Concordium app" error. PLT sub-accounts remain behind
  the `enableTokens` config switch.

- [#21634](https://github.com/LedgerHQ/ledger-live/pull/21634) [`b30f903`](https://github.com/LedgerHQ/ledger-live/commit/b30f903f592c0bafba74a1784d98b9d605c18ccb) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Validate PLT transfers and fix estimateMaxSpendable for tokens

  `getTransactionStatus` checks a PLT amount against the token sub-account and its fee
  against the CCD at the parent's disposal, and blocks on token state and device limits.
  `estimateMaxSpendable` returns the full token balance instead of subtracting µCCD fees.
  A PLT fee is priced from the buffered energy, so it covers the deposit the chain
  requires. `concordium-core` lowers the PLT decimals ceiling to 18. Adds the English
  error strings.

- [#21714](https://github.com/LedgerHQ/ledger-live/pull/21714) [`df401b8`](https://github.com/LedgerHQ/ledger-live/commit/df401b89391deedd5c1688ccd35cac947c8e0367) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Fix Contacts feature copy to match latest version (remove contractions, update disclaimers)

- [#21924](https://github.com/LedgerHQ/ledger-live/pull/21924) [`cdb273b`](https://github.com/LedgerHQ/ledger-live/commit/cdb273b068df78cd5a0dbd4281fb79f22e0a7506) Thanks [@qperrot](https://github.com/qperrot)! - Fix account view crash when cosmos `cosmosResources` is undefined by handling missing resources gracefully in the delegation hook and account UI components

- [#21738](https://github.com/LedgerHQ/ledger-live/pull/21738) [`9e37f58`](https://github.com/LedgerHQ/ledger-live/commit/9e37f58a84f7ee9585142c0a8ac767da58b6d06f) Thanks [@ysitbon](https://github.com/ysitbon)! - Move the account-coupled tracking-pair code out of the countervalues packages and into `live-common`, next to the portfolio code it belongs with. `inferTrackingPairForAccounts` and `inferTrackingPairForAccountsUnresolved` leave `live-countervalues/logic`, and the `useTrackingPairForAccounts` hook that wraps them leaves `live-countervalues-react`.

  These three were the last things in the countervalues core that needed an `Account`, so `@ledgerhq/types-live` is now gone from the package entirely and from its dependency list. The core no longer knows what an account is; it only knows currency pairs and rates.

  The move was blocked until both packages became private: a published package cannot depend on a private one, and the hook re-exported a function that had to land in private `live-common`.

- [#21874](https://github.com/LedgerHQ/ledger-live/pull/21874) [`06b5db9`](https://github.com/LedgerHQ/ledger-live/commit/06b5db9dd2b49bbbf256e9376d67f9c64b3a1a4d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - feat: drop ACRE support

  Nothing consumes ACRE anymore: the live-app catalog serves no `acre` manifest and the mobile BTC stake action pointed at a missing live app.

  Removed:

  - the `@ledgerhq/wallet-api-acre-module` package
  - `wallet-api/ACRE` (server + tracking) and `families/bitcoin/ACRESetup.ts` in live-common
  - the `@blooo/hw-app-acre` dependency
  - every `isACRE` branch in the desktop and mobile sign message / sign transaction flows
  - `useACRECustomHandlers` on both apps
  - the mobile Bitcoin `accountActions` stake entry point

- [#21666](https://github.com/LedgerHQ/ledger-live/pull/21666) [`cb37b83`](https://github.com/LedgerHQ/ledger-live/commit/cb37b8353a60a829a560f90b22a792936d9a2f1b) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Remove the Vault Signer feature and the `@ledgerhq/hw-transport-vault` package behind it, now
  that the Ledger Vault product team has confirmed it is unused.

  Gone with it: the Experimental setting and its modal, the top banner, the `vaultSigner` settings
  slice, and the branch that made `getCurrentDevice` return a synthetic Vault device ahead of every
  other transport. A persisted `vaultSigner` key needs no migration — `filterValidSettings` already
  strips keys absent from the initial state.

- [#21802](https://github.com/LedgerHQ/ledger-live/pull/21802) [`67ba7e2`](https://github.com/LedgerHQ/ledger-live/commit/67ba7e20fdc6e9bbee59b5b029365cf5f871ebe2) Thanks [@ysitbon](https://github.com/ysitbon)! - fix(feature-flags): serve the flags cached on the device at boot

  Both apps read their Firebase feature flags with `getAll()` placed behind
  `await fetchAndActivate()`, so a rejected or still-pending fetch never reached it and every flag
  resolved to its compiled default. Meanwhile the Firebase SDK was holding the config it activated
  in an earlier session on disk, unread.

  Each app now exposes `readCachedFlags()`, which serves that activated config with no network
  access, and the feature-flags middleware primes from it before the first fetch. A device that has
  been online at least once now boots on the values the backend actually sent, even offline.

  Entries the SDK serves from the seeded defaults are excluded from both reads, so a flag missing
  from the Firebase template is no longer recorded as if it had come from the backend. The resolved
  value is unchanged, since the slice falls back to those same defaults.

  On mobile, `setup()` now memoises its success only. Both readers await it, so a rejection kept in
  that memo was handed to `fetchRemoteFlags` too and took remote config off the network for the rest
  of the session. Both of its calls are idempotent, so dropping the memo on failure simply lets the
  next caller retry. The pre-migration code latched the same way, through
  `skip: !initResult.isSuccess` on a mutation fired once, but it cost only freshness back then
  because reads still went through the SDK and the config it holds on disk.

  `whenReady()` is removed from both modules. It had no consumers.

- [#21802](https://github.com/LedgerHQ/ledger-live/pull/21802) [`600d432`](https://github.com/LedgerHQ/ledger-live/commit/600d432657f1c9adf80af6730dd28f2177e05c5a) Thanks [@ysitbon](https://github.com/ysitbon)! - refactor(feature-flags): share the Firebase Remote Config parser between apps

  Both apps carried their own copy of the Firebase-key-to-FeatureId map and the loop that filters
  and JSON-parses a `getAll()` payload. `parseFirebaseFeatures` now lives in
  `@features/platform-feature-flags/firebase`, next to `formatToFirebaseFeatureId`, of which its
  key map is the exact inverse.

  It takes a structural `RemoteConfigValue` (`getSource()` + `asString()`), satisfied by both the
  Firebase JS SDK and `@react-native-firebase`, so the package gains no SDK dependency. Reading the
  SDK stays per-app, where the two platforms are deliberately asymmetric.

- [#21802](https://github.com/LedgerHQ/ledger-live/pull/21802) [`7a18125`](https://github.com/LedgerHQ/ledger-live/commit/7a1812584758a29c935f3ceb15792aaf6a5d4586) Thanks [@ysitbon](https://github.com/ysitbon)! - fix(feature-flags): prime the flag slice from the device cache at store creation

  Both stores now pass `readCachedFlags` to the feature-flags middleware, so the slice resolves on
  the values Firebase last sent to this device before the first network fetch is attempted.

  They also pass an `onRemoteFlagsError` reporter. Failed flag reads used to be swallowed entirely.
  It warns only on a cold failure, when no values are held yet and the session really is running on
  compiled defaults; a failed poll that still has previous values is routine and stays silent.

  On desktop, disabling `fetchRemoteFlags` (as tests do) now disables the cache read too, so opting
  out of the backend opts out of the whole Firebase path.

- [#21633](https://github.com/LedgerHQ/ledger-live/pull/21633) [`60655cd`](https://github.com/LedgerHQ/ledger-live/commit/60655cdf828eebdddd515d52c8fc5876ea50baf8) Thanks [@qperrot](https://github.com/qperrot)! - Add memo on xrp operation details

- [#22022](https://github.com/LedgerHQ/ledger-live/pull/22022) [`2aa4581`](https://github.com/LedgerHQ/ledger-live/commit/2aa45814f2c4eacfb47fc79fdaf336e42087366a) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Bump lumen-ui-react to 0.1.58, lumen-ui-rnative to 0.1.61, crypto-icons to 2.0.6; migrate TransactionalIcon to getDotIconProps

- [#21887](https://github.com/LedgerHQ/ledger-live/pull/21887) [`a62261e`](https://github.com/LedgerHQ/ledger-live/commit/a62261e2e63218affcd3690a70b5a42f355a48a4) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Tell the user a currency is unavailable in their region instead of showing a generic balance error, and bump coin-module-framework to 9.1.0 for the typed checkRegionRestriction flag

- [#21751](https://github.com/LedgerHQ/ledger-live/pull/21751) [`dc204a7`](https://github.com/LedgerHQ/ledger-live/commit/dc204a7633e6f7c9acb66fbb18a6aeaa2e75c4bb) Thanks [@sarneijim](https://github.com/sarneijim)! - Add releaseTour and gate Q2/Q3 tours with it, dropping q2Tour/q3Tour from Wallet 4.0

- [#21977](https://github.com/LedgerHQ/ledger-live/pull/21977) [`8d274de`](https://github.com/LedgerHQ/ledger-live/commit/8d274de51cab8d2cab27a772ba7604c2cf5ee25a) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix Pay Tab receive deposit option to let users pick an existing stablecoin account instead of forcing a new one

- [#21842](https://github.com/LedgerHQ/ledger-live/pull/21842) [`a4d993a`](https://github.com/LedgerHQ/ledger-live/commit/a4d993a361a612ada130db573f12fef4af38eacb) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Keep the mock server device screen reachable while a device-interaction modal is open, instead of the press dismissing the modal

- [#21966](https://github.com/LedgerHQ/ledger-live/pull/21966) [`38b7dab`](https://github.com/LedgerHQ/ledger-live/commit/38b7dab3436b2e72b4e8642f6c6b0fd9118475bc) Thanks [@sarneijim](https://github.com/sarneijim)! - Move Q2/Q3 debug tours into Features & Flows

- [#21791](https://github.com/LedgerHQ/ledger-live/pull/21791) [`a6a7a94`](https://github.com/LedgerHQ/ledger-live/commit/a6a7a946b1c1dbdda1cfa2c049f536f7235ddde2) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Complete the Card login on desktop. The provider's page opens in the Discover webview, and the
  manifest of the live app owns its origin. The `lwdPayTab` flag carries `baanx_login_manifest_id`
  and `baanx_hosted_manifest_id`, which default to the staging manifests. A redirect that echoes no
  attempt id now passes the callback guards, so the app's own deep link completes the login.

- [#22021](https://github.com/LedgerHQ/ledger-live/pull/22021) [`8dc8e99`](https://github.com/LedgerHQ/ledger-live/commit/8dc8e99e069baafdbde2dfa66b3cc06878012533) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - feat(pay-card): set the seven Baanx configuration values per environment

- [#21663](https://github.com/LedgerHQ/ledger-live/pull/21663) [`c6f7bfe`](https://github.com/LedgerHQ/ledger-live/commit/c6f7bfead8593c148fe6e3d177ff8dd734728f5a) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Mark a frozen pay card on the card visual: the card face fades out behind a centered snow `Spot`, read from the same card status the freeze tile uses. The features/flow jest projects now compile `@ledgerhq/lumen-utils-shared` instead of leaving its ESM untransformed, so views can use `cn`.

- [#21792](https://github.com/LedgerHQ/ledger-live/pull/21792) [`0e1e102`](https://github.com/LedgerHQ/ledger-live/commit/0e1e10227aa5cc0d19e8a142533c54838e3ed57e) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - The desktop Pay tab centres the Card login block, and it offers a login link to a card holder who
  has a card already. The login reads every error message from the copy keys.

- [#21915](https://github.com/LedgerHQ/ledger-live/pull/21915) [`34f8541`](https://github.com/LedgerHQ/ledger-live/commit/34f8541ae58847dcee784b3fe97f227edd644775) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - fix(pay-card): save the Card login intro flag after a redirect login, and give the desktop login block a title before the intro

- [#21918](https://github.com/LedgerHQ/ledger-live/pull/21918) [`fcc2ac4`](https://github.com/LedgerHQ/ledger-live/commit/fcc2ac4c5ed270fb63df4c0079068ad6dac94612) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Sign a mock Card session in and out from the Pay Card DevTool, and answer the Card endpoints from the desktop MSW worker, so the Card surfaces can be reached without the hosted login.

- [#21934](https://github.com/LedgerHQ/ledger-live/pull/21934) [`c5229d1`](https://github.com/LedgerHQ/ledger-live/commit/c5229d1b2bbf8d8067e036f0a34dda403519e206) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Pass host amount and date formatters as one object, using Desktop's date formatter for transaction dates.

- [#21872](https://github.com/LedgerHQ/ledger-live/pull/21872) [`37f5759`](https://github.com/LedgerHQ/ledger-live/commit/37f57595f11d40562914794645cb3c7f6e55dc8b) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Read the card transactions and give each one its spend category.

  - `useCardTransactionsViewModel` reads the first page of `GET /v1/card/transactions` while a session is live, and hands each transaction its category and that category's translated label.
  - `mccCategory` is now the closed set the provider documents (`PayCardTransactionCategory`), and a grouping it never named reads as `MISC` so one new label cannot fail a whole page.
  - `mockPayCardTransactions` answers a page covering every category, served by the desktop and mobile MSW workers on `GET /v1/card/transactions`.

- [#21917](https://github.com/LedgerHQ/ledger-live/pull/21917) [`a2a0288`](https://github.com/LedgerHQ/ledger-live/commit/a2a028844dbfbfa019f1f971bf6fdbed9005b9ec) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Show card transactions on the Pay Card panel as a list of items, with a subheader when the list is not empty.

- [#21793](https://github.com/LedgerHQ/ledger-live/pull/21793) [`e3799dc`](https://github.com/LedgerHQ/ledger-live/commit/e3799dc4028131cfb099ef79cf6750acd610e0fd) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - The provider's browser session no longer outlives the Card login. The Discover webview runs in the app's default session, which keeps cookies on disk, so a restart left the card holder still logged in at the provider and one click could mint a new code. A sign-in state that changes now ends that session: the main process removes the cookies for the hosts the Card manifests name and clears their origin storages. A cookie that Ledger shares across `ledger.com` stays, because the Card login does not own it.

- [#22023](https://github.com/LedgerHQ/ledger-live/pull/22023) [`0f4b55e`](https://github.com/LedgerHQ/ledger-live/commit/0f4b55e46459492e880a8e5e118b570a934ce4d7) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Polish Pay tab UI: square network icons, verify-address icon size, deposit dialog inset, header/balance spacing, and move card title/balance copy into the flow.

- [#21937](https://github.com/LedgerHQ/ledger-live/pull/21937) [`cd32aad`](https://github.com/LedgerHQ/ledger-live/commit/cd32aad899bf91b1843cdbc3e839bbfcdb0f443b) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Explain on a Hyperliquid account that transactions are not supported and offer a way to open Perps

- [#21687](https://github.com/LedgerHQ/ledger-live/pull/21687) [`f891d58`](https://github.com/LedgerHQ/ledger-live/commit/f891d5815f72ae87604494b0ffba8c3d4fafca63) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Render the add-account drawer on the fullscreen Perps route, where the main shell and its drawer are hidden (LIVE-35326).

- [#21929](https://github.com/LedgerHQ/ledger-live/pull/21929) [`47c1dde`](https://github.com/LedgerHQ/ledger-live/commit/47c1ddeb31b0acd87b65fd50218fce65a7d43a42) Thanks [@sarneijim](https://github.com/sarneijim)! - Auto-open the Q3 product tour on Portfolio and include the tour variant in analytics

- [#20774](https://github.com/LedgerHQ/ledger-live/pull/20774) [`c6a569d`](https://github.com/LedgerHQ/ledger-live/commit/c6a569d5848e6c0fd7973cb5ab7241b39d47f77b) Thanks [@amaslakov](https://github.com/amaslakov)! - Add the ICP neuron management and voting-power confirmation flows on Desktop, with the periodic-confirmation decode and neuron helpers they run on.

  An accepted command is reflected as soon as the network accepts it, without waiting for a device-signed refresh, and the account re-syncs after a stake. A command the device has already signed is offered for retry only when the network says nothing ran. Actions a neuron cannot take are not offered — Increase stake without a recoverable stake nonce, Increase dissolve delay with under a day of room, a followee list that changes nothing. Staked maturity counts toward the account's Total Maturity, and a rejected input names the bound it broke rather than an error class name.

- [#21683](https://github.com/LedgerHQ/ledger-live/pull/21683) [`8427ffd`](https://github.com/LedgerHQ/ledger-live/commit/8427ffdf83031f0e119680abecf815f8f4f60cf9) Thanks [@semeano](https://github.com/semeano)! - Move selected send-pool balance helper out of live-common into @ledgerhq/live-send

- [#21825](https://github.com/LedgerHQ/ledger-live/pull/21825) [`e31a99e`](https://github.com/LedgerHQ/ledger-live/commit/e31a99e0c1a5449aa1ab8729130e1d123b1ffdad) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add @shared/platform-linking package for cross-platform external link handling with URL safety, localization and analytics

- [#21947](https://github.com/LedgerHQ/ledger-live/pull/21947) [`9d0b721`](https://github.com/LedgerHQ/ledger-live/commit/9d0b721dbfd8b71d32d2d16db22ad8e54f45f541) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the mobile Pay Card transaction detail sheet with tracking and copyable transaction IDs.

- [#21784](https://github.com/LedgerHQ/ledger-live/pull/21784) [`8b04a09`](https://github.com/LedgerHQ/ledger-live/commit/8b04a09d3f9d585e0076037dd5d651697c5764ad) Thanks [@YazhuEth](https://github.com/YazhuEth)! - fix(solana): remove the hardcoded blind signing warning from the transaction summary, the device now warns only when the transaction is actually blind signed

- [#21869](https://github.com/LedgerHQ/ledger-live/pull/21869) [`4c314f4`](https://github.com/LedgerHQ/ledger-live/commit/4c314f4035581de1affaba8419cd062359251c2f) Thanks [@amaslakov](https://github.com/amaslakov)! - Check a PLT recipient against the token's allow and deny lists before signing

  A transfer the lists refuse is rejected on chain after the user has signed and paid the
  fee, so `getTransactionStatus` now resolves the recipient's standing and reports it under
  the recipient field. The token's own state is read first, and a token declaring neither
  list never looks the recipient up. An undecodable state or a failed lookup blocks as
  unverifiable rather than passing as allowed. Adds the English error strings.

- [#21683](https://github.com/LedgerHQ/ledger-live/pull/21683) [`2eb6f5c`](https://github.com/LedgerHQ/ledger-live/commit/2eb6f5c7b3a7694a028bfe62279102188aeac028) Thanks [@semeano](https://github.com/semeano)! - add balance-type pool selection step to Zcash send flow

  The amount step's 25/50/75% selectors now apply to the pool the user picked rather than to the account total, which sums pools the transaction cannot spend from.

  The recipient step's transfer-to-my-other-pool shortcut now records the transfer on the transaction (for Zcash, `selfTransfer`), so the prefilled address keeps its self-transfer semantics instead of looking like a send to a typed address. Picking any other recipient clears it again.

- [#21939](https://github.com/LedgerHQ/ledger-live/pull/21939) [`d1d26de`](https://github.com/LedgerHQ/ledger-live/commit/d1d26def09d28102238b31b684d1745c4f1ad8cc) Thanks [@semeano](https://github.com/semeano)! - Add Zcash shielded send screens (recipient sync notice and family device-signature confirmation) and block the recipient step until shielded sync reports complete

### Patch Changes

- Updated dependencies [[`9164e8b`](https://github.com/LedgerHQ/ledger-live/commit/9164e8b81ecb84e5d8ba0bb606981c2dc83d04c1), [`e09211c`](https://github.com/LedgerHQ/ledger-live/commit/e09211c3477dc91530c2670a0b34b29fb8d3d943), [`1995d49`](https://github.com/LedgerHQ/ledger-live/commit/1995d49c63301199aef3e9a079f1d10fd0598f8b), [`2e47336`](https://github.com/LedgerHQ/ledger-live/commit/2e4733627ccb62c39fdf1e7d4b9f7d22559609bf), [`8f62cdb`](https://github.com/LedgerHQ/ledger-live/commit/8f62cdbb6d93e207efd7e551af65a41953d28242), [`182fae7`](https://github.com/LedgerHQ/ledger-live/commit/182fae7fbfa81b42de061e67da8edf21a7f72281), [`ba31ece`](https://github.com/LedgerHQ/ledger-live/commit/ba31ece3a22febeafbec027840d16ea82c2dad5e), [`13e3ebb`](https://github.com/LedgerHQ/ledger-live/commit/13e3ebba3ec7f10dcaf7d960f242f14a9853a191), [`16a454f`](https://github.com/LedgerHQ/ledger-live/commit/16a454fa79be46df6aec3c50ad40407f36dfdea9), [`782b197`](https://github.com/LedgerHQ/ledger-live/commit/782b197bf61a233f5c6ffe7f68e37267f8546e73), [`de19b3e`](https://github.com/LedgerHQ/ledger-live/commit/de19b3e4e56a0c28fcc1a3ca929059e84fc7bebf), [`25224f4`](https://github.com/LedgerHQ/ledger-live/commit/25224f463b834dba7a2811d7150aeec6dbd6a3ac), [`96a1ca9`](https://github.com/LedgerHQ/ledger-live/commit/96a1ca9fef1b0acc8113708c148890054dea143d), [`f5d0da5`](https://github.com/LedgerHQ/ledger-live/commit/f5d0da5d43ff492175433453b08533cee324c6e2), [`f7fa8f0`](https://github.com/LedgerHQ/ledger-live/commit/f7fa8f0ff23c03a69933f2d6aa6e0b225af9d542), [`e8fa868`](https://github.com/LedgerHQ/ledger-live/commit/e8fa86874942249a54884353c6c1b070af80d4b1), [`738c0d8`](https://github.com/LedgerHQ/ledger-live/commit/738c0d8a1357e96713bfc0d7a40ca403b5290c35), [`1eb2e00`](https://github.com/LedgerHQ/ledger-live/commit/1eb2e00074fe05f103dd33c3fbf295cfd39e9c2e), [`632dd93`](https://github.com/LedgerHQ/ledger-live/commit/632dd9368616a97581d037f1503b2b16f567c02a), [`036b71d`](https://github.com/LedgerHQ/ledger-live/commit/036b71d678a57c3b1c3156374122fe13bea54f79), [`85e01c4`](https://github.com/LedgerHQ/ledger-live/commit/85e01c449dab75d75851631a56d292f2cb0c5b36), [`799219e`](https://github.com/LedgerHQ/ledger-live/commit/799219e262e80a339272113ea164fa506243b438), [`e37413b`](https://github.com/LedgerHQ/ledger-live/commit/e37413b588873a1a2a028ebf4c1971e4fa92ed2a), [`9e61582`](https://github.com/LedgerHQ/ledger-live/commit/9e61582edfcbb98046d0f74111ccf4061ec44bb3), [`e3535da`](https://github.com/LedgerHQ/ledger-live/commit/e3535da7e5c884f8ada75eff52c0c4538142fffb), [`fecfcf7`](https://github.com/LedgerHQ/ledger-live/commit/fecfcf7570ed70213a9c0e32c2822b4eb057eb03), [`05cb97c`](https://github.com/LedgerHQ/ledger-live/commit/05cb97c6986755d87d4c0b3df3d8b4daf9ba77df), [`251af57`](https://github.com/LedgerHQ/ledger-live/commit/251af57e7412e493deaecddf627e3967ba044c09), [`b30f903`](https://github.com/LedgerHQ/ledger-live/commit/b30f903f592c0bafba74a1784d98b9d605c18ccb), [`5b60a96`](https://github.com/LedgerHQ/ledger-live/commit/5b60a968d3292b3897380f2c74c472a51b81e35d), [`da3d09d`](https://github.com/LedgerHQ/ledger-live/commit/da3d09d75d7dcae659611cd371c48d75c03f7ae4), [`cdb273b`](https://github.com/LedgerHQ/ledger-live/commit/cdb273b068df78cd5a0dbd4281fb79f22e0a7506), [`54fce77`](https://github.com/LedgerHQ/ledger-live/commit/54fce77bfa46c3d42d3e39b80804258a91d910f2), [`ee1b919`](https://github.com/LedgerHQ/ledger-live/commit/ee1b9192421545035fb547f27319d7f816d85fe8), [`9e37f58`](https://github.com/LedgerHQ/ledger-live/commit/9e37f58a84f7ee9585142c0a8ac767da58b6d06f), [`06b5db9`](https://github.com/LedgerHQ/ledger-live/commit/06b5db9dd2b49bbbf256e9376d67f9c64b3a1a4d), [`7e44af4`](https://github.com/LedgerHQ/ledger-live/commit/7e44af495eccab1fac4b0808d6729a595b610c69), [`600d432`](https://github.com/LedgerHQ/ledger-live/commit/600d432657f1c9adf80af6730dd28f2177e05c5a), [`7050652`](https://github.com/LedgerHQ/ledger-live/commit/70506520dafbccca4e014ac30d75647a5b7fe7d0), [`7bfbb69`](https://github.com/LedgerHQ/ledger-live/commit/7bfbb69b29d66d1b908cddd4b7cad893f77a8ebc), [`60655cd`](https://github.com/LedgerHQ/ledger-live/commit/60655cdf828eebdddd515d52c8fc5876ea50baf8), [`bb2f03e`](https://github.com/LedgerHQ/ledger-live/commit/bb2f03e41b96b8f95f239acea75428657cdd64fe), [`8146728`](https://github.com/LedgerHQ/ledger-live/commit/814672815a08dd57160d3aa4c28e92c3f508807e), [`b30a8cd`](https://github.com/LedgerHQ/ledger-live/commit/b30a8cd8acfeabb444cd7e2acb1ac5eaa959b221), [`a62261e`](https://github.com/LedgerHQ/ledger-live/commit/a62261e2e63218affcd3690a70b5a42f355a48a4), [`dc204a7`](https://github.com/LedgerHQ/ledger-live/commit/dc204a7633e6f7c9acb66fbb18a6aeaa2e75c4bb), [`939300a`](https://github.com/LedgerHQ/ledger-live/commit/939300add757537632def29302a24a72a67f84b6), [`73eb9bc`](https://github.com/LedgerHQ/ledger-live/commit/73eb9bc68ed87f07142a1fdf54e4cd68af3a36d4), [`d1a8cb2`](https://github.com/LedgerHQ/ledger-live/commit/d1a8cb2403bbe6771dfee3e43fbc4c4df61d4c7c), [`903c180`](https://github.com/LedgerHQ/ledger-live/commit/903c1802ea5d4cc3fe1bfe5609b8cf3871152cf0), [`30828c2`](https://github.com/LedgerHQ/ledger-live/commit/30828c22cc44c9929d7eda782e9d559a9e0145c3), [`cef83ae`](https://github.com/LedgerHQ/ledger-live/commit/cef83ae58ffc5529bebda292737502e78e3b7522), [`3f34609`](https://github.com/LedgerHQ/ledger-live/commit/3f34609edecc5ae85a9a9ac1b76ab47e30a9c66e), [`a6a7a94`](https://github.com/LedgerHQ/ledger-live/commit/a6a7a946b1c1dbdda1cfa2c049f536f7235ddde2), [`c6f7bfe`](https://github.com/LedgerHQ/ledger-live/commit/c6f7bfead8593c148fe6e3d177ff8dd734728f5a), [`0e1e102`](https://github.com/LedgerHQ/ledger-live/commit/0e1e10227aa5cc0d19e8a142533c54838e3ed57e), [`34f8541`](https://github.com/LedgerHQ/ledger-live/commit/34f8541ae58847dcee784b3fe97f227edd644775), [`fcc2ac4`](https://github.com/LedgerHQ/ledger-live/commit/fcc2ac4c5ed270fb63df4c0079068ad6dac94612), [`eddc89e`](https://github.com/LedgerHQ/ledger-live/commit/eddc89e7b86a13aeedfc0ae4956c2dcd08494e5f), [`b976cda`](https://github.com/LedgerHQ/ledger-live/commit/b976cda52320ef3f778fc11b4f95d2c5bf54ffe0), [`e7d79ac`](https://github.com/LedgerHQ/ledger-live/commit/e7d79acf1d91e98e2813755f9bebdbfd83e89f39), [`c5229d1`](https://github.com/LedgerHQ/ledger-live/commit/c5229d1b2bbf8d8067e036f0a34dda403519e206), [`37f5759`](https://github.com/LedgerHQ/ledger-live/commit/37f57595f11d40562914794645cb3c7f6e55dc8b), [`a2a0288`](https://github.com/LedgerHQ/ledger-live/commit/a2a028844dbfbfa019f1f971bf6fdbed9005b9ec), [`6553e61`](https://github.com/LedgerHQ/ledger-live/commit/6553e61da87bd604a357d5a79eefd3ac17e225d1), [`8b3320d`](https://github.com/LedgerHQ/ledger-live/commit/8b3320d7aab0ff25eeb8930dafa536fb94962c79), [`19314ca`](https://github.com/LedgerHQ/ledger-live/commit/19314cafec3eee0803bee7f9b877c9e9ccc819e8), [`e65a6b3`](https://github.com/LedgerHQ/ledger-live/commit/e65a6b3e67e271343b7029613498176b1da2d7d2), [`4ac2794`](https://github.com/LedgerHQ/ledger-live/commit/4ac2794b8244b094f2e91563bb7ad8a220d6cba5), [`2edc7c8`](https://github.com/LedgerHQ/ledger-live/commit/2edc7c8d47b1ac8b49194155be8f8b3722574d39), [`0f4b55e`](https://github.com/LedgerHQ/ledger-live/commit/0f4b55e46459492e880a8e5e118b570a934ce4d7), [`c88b5c6`](https://github.com/LedgerHQ/ledger-live/commit/c88b5c65b0488097e2a17071ca04ac06ae41763a), [`5ddb9ab`](https://github.com/LedgerHQ/ledger-live/commit/5ddb9ab2874a6715d706042701e8b2242b1c14b9), [`c72a646`](https://github.com/LedgerHQ/ledger-live/commit/c72a646d28a4a5d144808f4a99e80d7788895603), [`6c1be58`](https://github.com/LedgerHQ/ledger-live/commit/6c1be58b4dbcce00cc114442d2aeb76278248d99), [`c6a569d`](https://github.com/LedgerHQ/ledger-live/commit/c6a569d5848e6c0fd7973cb5ab7241b39d47f77b), [`8427ffd`](https://github.com/LedgerHQ/ledger-live/commit/8427ffdf83031f0e119680abecf815f8f4f60cf9), [`a5d438e`](https://github.com/LedgerHQ/ledger-live/commit/a5d438e3c6cd557e8c77f2f40be2c20540f23cec), [`e31a99e`](https://github.com/LedgerHQ/ledger-live/commit/e31a99e0c1a5449aa1ab8729130e1d123b1ffdad), [`9d0b721`](https://github.com/LedgerHQ/ledger-live/commit/9d0b721dbfd8b71d32d2d16db22ad8e54f45f541), [`529a7fc`](https://github.com/LedgerHQ/ledger-live/commit/529a7fc909409f4f5740ce8add9abbab1b784157), [`a9f0a51`](https://github.com/LedgerHQ/ledger-live/commit/a9f0a51f20cf3e7b038cc6e5762557e93760a37e), [`a17ef12`](https://github.com/LedgerHQ/ledger-live/commit/a17ef128d44c9ca9bc85c3c8b8d691981c5e638f), [`d353658`](https://github.com/LedgerHQ/ledger-live/commit/d353658a0254e49a369ca7481c9680254e9e4851), [`b49d5b5`](https://github.com/LedgerHQ/ledger-live/commit/b49d5b573e84bd63ac460ae398657f1035613141), [`4c314f4`](https://github.com/LedgerHQ/ledger-live/commit/4c314f4035581de1affaba8419cd062359251c2f), [`2eb6f5c`](https://github.com/LedgerHQ/ledger-live/commit/2eb6f5c7b3a7694a028bfe62279102188aeac028), [`d1d26de`](https://github.com/LedgerHQ/ledger-live/commit/d1d26def09d28102238b31b684d1745c4f1ad8cc)]:
  - @features/flow-pay-card-details@0.4.0-next.0
  - @ledgerhq/live-common@38.0.0-next.0
  - @features/flow-pay-card-transactions@0.2.0-next.0
  - @features/flow-pay-card@0.4.0-next.0
  - @domain/api-card-management@0.6.0-next.0
  - @features/flow-pay-card-auth@0.7.0-next.0
  - @features/flow-contacts-list@0.7.0-next.0
  - @features/platform-contacts@0.7.0-next.0
  - @features/flow-contacts-introduction@1.2.0-next.0
  - @features/flow-contacts-add-address@0.5.0-next.0
  - @shared/feature-flags@0.23.0-next.0
  - @ledgerhq/coin-zcash@0.8.0-next.0
  - @ledgerhq/coin-concordium@1.3.0-next.0
  - @features/flow-contacts@0.11.0-next.0
  - @features/flow-contacts-add-contact@0.6.0-next.0
  - @ledgerhq/types-live@6.124.0-next.0
  - @features/platform-feature-flags@0.7.0-next.0
  - @devtools/bindings@0.8.0-next.0
  - @ledgerhq/react-ui@0.55.0-next.0
  - @domain/entity-contact@0.9.0-next.0
  - @ledgerhq/live-dmk-speculos@0.11.0-next.0
  - @shared/env@0.7.0-next.0
  - @ledgerhq/ledger-key-ring-protocol@0.22.0-next.0
  - @ledgerhq/coin-cosmos@1.3.0-next.0
  - @ledgerhq/live-countervalues@0.26.0-next.0
  - @ledgerhq/live-countervalues-react@0.18.0-next.0
  - @ledgerhq/wallet-btc@0.5.0-next.0
  - @features/flow-pay-card-widget@0.3.0-next.0
  - @features/flow-pay-request@0.5.0-next.0
  - @features/flow-pay-contact@0.4.0-next.0
  - @features/flow-pay-deposit@0.4.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.4.0-next.0
  - @ledgerhq/live-send@0.1.0-next.0
  - @shared/platform-linking@0.2.0-next.0
  - @features/flow-contacts-edit-contact@0.5.0-next.0
  - @features/flow-large-screen-upsell@2.1.0-next.0
  - @features/platform-card@0.5.0-next.0
  - @features/platform-style@0.4.0-next.0
  - @ledgerhq/asset-detail@0.11.5-next.0
  - @ledgerhq/live-dmk-desktop@0.21.1-next.0
  - @features/flow-contacts-delete-contact@0.2.2-next.0
  - @features/flow-contacts-edit-address@0.3.1-next.0
  - @features/flow-pay-balance@0.4.2-next.0
  - @features/flow-pay-bank-transfer@0.3.1-next.0
  - @features/flow-pay-feature-tour@0.5.1-next.0
  - @features/platform-device-action-content@0.2.1-next.0
  - @shared/ui-info-state@0.2.2-next.0
  - @features/platform-currencies@0.8.1-next.0
  - @ledgerhq/asset-aggregation@0.15.1-next.0
  - @ledgerhq/coin-bitcoin@0.52.1-next.0
  - @ledgerhq/coin-canton@1.1.2-next.0
  - @ledgerhq/coin-cardano@1.1.2-next.0
  - @ledgerhq/coin-casper@3.3.1-next.0
  - @ledgerhq/coin-filecoin@2.1.2-next.0
  - @ledgerhq/domain-service@1.8.19-next.0
  - @ledgerhq/live-signer-evm@0.23.2-next.0
  - @ledgerhq/live-wallet@1.1.3-next.0
  - @ledgerhq/transaction-observability@0.3.1-next.0
  - @ledgerhq/wallet-analytics@0.4.1-next.0
  - @ledgerhq/wallet-pnl@0.7.11-next.0
  - @features/flow-analytics-consent@0.2.6-next.0
  - @domain/api-aggregated-assets@0.5.1-next.0
  - @features/platform-aggregated-assets@0.5.3-next.0
  - @features/platform-env@0.3.1-next.0
  - @shared/api-services@0.7.0
  - @shared/auth@0.6.0
  - @shared/cloud-sync@0.3.0
  - @shared/i18n@0.2.0
  - @devtools/shell@0.9.3-next.0

## 4.20.0

### Minor Changes

- [#21371](https://github.com/LedgerHQ/ledger-live/pull/21371) [`56bf73c`](https://github.com/LedgerHQ/ledger-live/commit/56bf73ccfa5b1323d380d3eb9bc2f7145bc08a97) Thanks [@vpenskyi-ledger](https://github.com/vpenskyi-ledger)! - Fix NoFundsStake modal passing raw currency object to Swap live-app instead of expected `{ toCurrencyId }` format, causing the Receive field to not be pre-filled when navigating from Earn zero-balance account flow

- [#21042](https://github.com/LedgerHQ/ledger-live/pull/21042) [`d5e1c7d`](https://github.com/LedgerHQ/ledger-live/commit/d5e1c7d985b15adbe230e537e998af2dcf3cff8b) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Tell the two Hyperliquid account-picker states apart.

  The perps receiving step used one description for both states, so users who already had a Hyperliquid account were told to add one. It now reads "Select an account you want to deposit funds into to place your trades" when accounts exist, and keeps "To fund your perps, you need a Hyperliquid account.

- [#21515](https://github.com/LedgerHQ/ledger-live/pull/21515) [`7f4723c`](https://github.com/LedgerHQ/ledger-live/commit/7f4723cf1aa59ec55d172d27000fad438f4833c6) Thanks [@sarneijim](https://github.com/sarneijim)! - Bump Segment analytics SDKs for retry, rate-limit and security fixes (LIVE-35839)

- [#21433](https://github.com/LedgerHQ/ledger-live/pull/21433) [`8f8f1a4`](https://github.com/LedgerHQ/ledger-live/commit/8f8f1a472b5c6142d3ddf682fbc5d991c720aa92) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add a web `ContactAddressPicker` dialog skeleton to the Pay contact flow and open it from the desktop Pay tab when a contact is pressed. The address list UI and the account/send handoff on address selection land in follow-ups.

- [#21355](https://github.com/LedgerHQ/ledger-live/pull/21355) [`fc74af8`](https://github.com/LedgerHQ/ledger-live/commit/fc74af8db6038afd89c64de356e67fe9ba4811a0) Thanks [@semeano](https://github.com/semeano)! - Offer the Zcash memo only to shielded recipients. A memo travels in a shielded output, so a transparent recipient could never receive one, yet the send flow showed the input for every Zcash address and made the user fill or skip it. Send descriptors can now distinguish static memo support from recipient-specific visibility, and a memo left over from an earlier shielded recipient is dropped when the recipient turns transparent, so it can no longer reach the transaction builder.

- [#21434](https://github.com/LedgerHQ/ledger-live/pull/21434) [`b7f83a1`](https://github.com/LedgerHQ/ledger-live/commit/b7f83a1c1818e4eff9ffbf19796a71d7242fd5b4) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add persisted Pay Request verify-hint state in `@features/flow-pay-request`.

- [#21408](https://github.com/LedgerHQ/ledger-live/pull/21408) [`c270975`](https://github.com/LedgerHQ/ledger-live/commit/c2709750e007b758fa13f0f717efa897fcc6235d) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add a first-time Popover on desktop Pay Request Verify.

- [#21367](https://github.com/LedgerHQ/ledger-live/pull/21367) [`d182d46`](https://github.com/LedgerHQ/ledger-live/commit/d182d466275f4c35ec3bf86cadf544de77c27058) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix the Ledger Sync entry point from Contacts: align the introduction copy and artwork with the production design, only show it when the user actually tries to add a contact or an address, start the flow on "Choose your sync method", and return to Contacts instead of the Portfolio once the flow is done on Mobile.

- [#21470](https://github.com/LedgerHQ/ledger-live/pull/21470) [`5b79eb3`](https://github.com/LedgerHQ/ledger-live/commit/5b79eb3c5b1e2e7aca86fb0a8c4b7af085e57f9d) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix the Contacts add address flow stalling on Continue by only offering networks the device can register an address on: EVM networks running their own coin app, such as Ethereum Classic, Sonic and Sei, are no longer selectable

- [#21453](https://github.com/LedgerHQ/ledger-live/pull/21453) [`3b0dbae`](https://github.com/LedgerHQ/ledger-live/commit/3b0dbae4ae5df48bd4eb58146675747d7e3593c2) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the web `ContactAddressPicker` dialog to the Pay contact flow and open it from the desktop Pay tab when a contact is pressed. The picker lists the contact's addresses segmented by network with asset-aware icons, resolved through the view model, and exposes an optional add-address action that routes to the contact's add-address flow. Address grouping, icon resolution and truncation are shared from `@features/flow-contacts`. The account/send handoff on address selection lands in a follow-up.

- [#21587](https://github.com/LedgerHQ/ledger-live/pull/21587) [`46b51dd`](https://github.com/LedgerHQ/ledger-live/commit/46b51ddabe0689bc64b598bcb33f131f4b1c2a22) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix the Contacts feature introduction so closing it counts as seen and keeps you on the Contacts list, instead of navigating back and reopening the introduction on the next visit.

- [#21601](https://github.com/LedgerHQ/ledger-live/pull/21601) [`96661b4`](https://github.com/LedgerHQ/ledger-live/commit/96661b459f66f511de75c62b87b3bcd2519a1814) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - part 1 for Aleo bond flow

- [#21746](https://github.com/LedgerHQ/ledger-live/pull/21746) [`c2e2276`](https://github.com/LedgerHQ/ledger-live/commit/c2e2276459d5e48e938145eb54bae572f5ae7a60) Thanks [@amaslakov](https://github.com/amaslakov)! - Add the error message shown when the protocol refuses a Tezos stake amount as too small

- [#21401](https://github.com/LedgerHQ/ledger-live/pull/21401) [`8c40cc1`](https://github.com/LedgerHQ/ledger-live/commit/8c40cc1c2054d12fc546e341a18e966d6ab23986) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Skip the extra confirmation modal when editing a contact or address name. Apply changes now starts the device action directly when needed, and the Apply CTA shows the Ledger logo in that case.

- [#21440](https://github.com/LedgerHQ/ledger-live/pull/21440) [`0089a4b`](https://github.com/LedgerHQ/ledger-live/commit/0089a4b80512c2c8f8eb3a03b9e3245492380647) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Drive Contacts add-address confirmation through the Device Intent Executor instead of mocked Continue screens, including prefill and Send entry points.

- [#21374](https://github.com/LedgerHQ/ledger-live/pull/21374) [`d6e689f`](https://github.com/LedgerHQ/ledger-live/commit/d6e689fc08c18581ce2a4146b453538665d550db) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Update the desktop Pay feature tour layout and copy to match mockups (LIVE-36499).

- [#21418](https://github.com/LedgerHQ/ledger-live/pull/21418) [`60ee73c`](https://github.com/LedgerHQ/ledger-live/commit/60ee73c7b89b101dde708a04ded260341ef86d44) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Rename `CARD_API_URL` to `CARD_BAANX_API_URL`, keep the production defaults, and drop the Env vars section from the Card / Pay DevTool.

- [#21548](https://github.com/LedgerHQ/ledger-live/pull/21548) [`55bd216`](https://github.com/LedgerHQ/ledger-live/commit/55bd2166238ab3e03c33226bb5f5eb2e8646a818) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add a getCardOnboardingStatus RTK Query endpoint and a schema-validated mock fixture.

- [#21550](https://github.com/LedgerHQ/ledger-live/pull/21550) [`6ed1820`](https://github.com/LedgerHQ/ledger-live/commit/6ed1820776ca6ba59e861da11e4582af406b2188) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Mount and persist the card onboarding widget in Ledger Wallet Desktop.

- [#21546](https://github.com/LedgerHQ/ledger-live/pull/21546) [`85474db`](https://github.com/LedgerHQ/ledger-live/commit/85474db611c17c603b459d17f223880342ecd0ab) Thanks [@semeano](https://github.com/semeano)! - Change show private balance label.

- [#21248](https://github.com/LedgerHQ/ledger-live/pull/21248) [`9672658`](https://github.com/LedgerHQ/ledger-live/commit/967265820c38ad0b2f8f45fd0a892ca07c58d23a) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Edit an external address on the device from Contacts. The device intent now calls `@ledgerhq/device-contacts-kit`'s `ContactsManager.editExternalAddressIdentifier()` and `ContactsManager.editExternalAddressScope()`, each returning the rotated address proof to persist while the group's name proof passes through untouched, and both apps render the confirmation step and one `InfoState` per failure.

  The device serves address and label edits as two separate commands, so an edit changing both asks the user to confirm twice, showing the same waiting screen for each step rather than numbering them. Nothing partial is ever stored: an abandoned or rejected edit leaves the record untouched, and a retry restarts the whole chain.

- [#21247](https://github.com/LedgerHQ/ledger-live/pull/21247) [`a55d4ca`](https://github.com/LedgerHQ/ledger-live/commit/a55d4ca3a804f6ab27f039926255f2c410ef7221) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Rename a contact on the device from Contacts. The device intent now calls `@ledgerhq/device-contacts-kit`'s `ContactsManager.renameContact()`, which returns the rotated name proof to persist, and both apps render the confirmation step and one `InfoState` per failure. A rejection keeps the job open so the user can retry on the same device.

  Rename is a blockchain-agnostic dashboard operation, so it initializes on the dashboard (`BOLOS`) rather than a coin app: a contact with no address is renameable, and an outdated device surfaces as an OS-update screen instead of an app-update one.

- [#21269](https://github.com/LedgerHQ/ledger-live/pull/21269) [`8c83fe6`](https://github.com/LedgerHQ/ledger-live/commit/8c83fe6b93cf1806b551f05b946cb9ad2b7e3531) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Show the emulated device's screen at the foot of the desktop sidebar while the mock server transport is driving it, and let its buttons and touchscreen be pressed.

- [#21269](https://github.com/LedgerHQ/ledger-live/pull/21269) [`9c67330`](https://github.com/LedgerHQ/ledger-live/commit/9c67330ab28a41e38d90e9d07acf1ee19c5598a1) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Let a launch `MOCK_SERVER_TRANSPORT=1` turn the mock server transport on, instead of the developer toggle's stored value always winning.

- [#21269](https://github.com/LedgerHQ/ledger-live/pull/21269) [`8f8d63e`](https://github.com/LedgerHQ/ledger-live/commit/8f8d63ecfeba6a4be8edca7655abf713fc328060) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Add a "Mock server transport" toggle in the desktop developer settings, so the Device Management Kit connects to a device mock server instead of a physical device. Configured by `MOCK_SERVER_TRANSPORT`, `MOCK_SERVER_TRANSPORT_URL`, `MOCK_SERVER_SESSION` and `MOCK_SERVER_SEED`, with a top bar indicator showing whether the server is reachable.

- [#21390](https://github.com/LedgerHQ/ledger-live/pull/21390) [`8c98d3b`](https://github.com/LedgerHQ/ledger-live/commit/8c98d3b1e849a4684bd21861ae56faadf1dc3a28) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Remove Storybook from the desktop app: drop the `.storybook` config, the `rsbuild.storybook.config.js` builder, every `*.stories.*` file and the Storybook-only dependencies (`storybook`, `@storybook/*`, `storybook-react-rsbuild`, `@rsbuild/*`, `@vitest/mocker`, `events`). The `STORYBOOK_ENV` branches around `electron` access are gone, so `clipboard` and `shell` are now imported directly, and the shared Jest `electron` mock exposes `clipboard`. The now-dead `*.stories.tsx` exclusions in the repo Sonar and `@ledgerhq/react-ui` build configs are removed too.

- [#21477](https://github.com/LedgerHQ/ledger-live/pull/21477) [`9175a6d`](https://github.com/LedgerHQ/ledger-live/commit/9175a6d4a94d75b2067246f316bc3ad23fff9712) Thanks [@semeano](https://github.com/semeano)! - Change Zcash private sync button label

- [#21223](https://github.com/LedgerHQ/ledger-live/pull/21223) [`e92cf97`](https://github.com/LedgerHQ/ledger-live/commit/e92cf9742f7d910dea79ca848494b3870b2ae254) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Route Casper through the generic coin-framework bridge (LIVE-35912/35914/35915).

  - `coin-casper`: `createApi()` now returns a `CoinModuleImpl` (dropping the throwing stubs for unsupported capabilities; `withDefaults` fills them). `craftTransactionData` delegates to the framework helper. `getTransferIdFromMemo` bridges the legacy `StringMemo<"transferId">` shape and the new `{type:"transferId"}` framework shape until LIVE-35735 unifies them.
  - `live-common`: Casper added to `genericCoinFrameworkFamilies.json`; LiveConfig key `config_casper_generic_bridge` (default `true`) provides a runtime kill-switch to fall back to the legacy bridge without a deploy.
  - Desktop/Mobile: `useTransferIdChange` hook extracted and shared between `MemoField` / `TransferIdField` / `MemoTagInput` / `ScreenEditTransferId`; now writes both `transferId` (legacy bridge) and `memoType`/`memoValue` (generic path) so both bridges read the same user input correctly.

- [#21513](https://github.com/LedgerHQ/ledger-live/pull/21513) [`9dd7db0`](https://github.com/LedgerHQ/ledger-live/commit/9dd7db0d81362a5d019cd0830bdd336a1f42e7af) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add a Pay success screen to the Send flow. When the flow is launched from the Pay tab and the transaction succeeds, it now routes to a dedicated `PAY_SUCCESS` step that shows the recipient, amount, source account (with network icon) and a link to the transaction details, instead of the standard confirmation step. Exposes a presentational `PaySuccess` component from `@features/flow-pay-contact` and wires it in ledger-live-desktop via an MVVM `PaySuccessScreen` + `usePaySuccessViewModel`.

- [#21372](https://github.com/LedgerHQ/ledger-live/pull/21372) [`961792b`](https://github.com/LedgerHQ/ledger-live/commit/961792b84469e81b8b2160a9bb1db08a2c9a1781) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Gate the Pay tab contacts section behind the contacts feature flag (lwdContacts on desktop, lwmContacts on mobile)

- [#21302](https://github.com/LedgerHQ/ledger-live/pull/21302) [`1e883b3`](https://github.com/LedgerHQ/ledger-live/commit/1e883b36260cb3d78c34251de87a2da1ec353d9f) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: read Hedera staking validators through an on-demand query on desktop, with loading and fetch-error states

- [#21305](https://github.com/LedgerHQ/ledger-live/pull/21305) [`7aca4c8`](https://github.com/LedgerHQ/ledger-live/commit/7aca4c8a806ab270cd990d63b1c651e443b7e149) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - refactor: drop the Hedera preload layer now that no consumer reads it, and fold useHederaEnrichedDelegationV2 back into useHederaEnrichedDelegation

- [#21358](https://github.com/LedgerHQ/ledger-live/pull/21358) [`6561cf0`](https://github.com/LedgerHQ/ledger-live/commit/6561cf003713ab65533bb9476771c0de9b19e634) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - refactor: serve the Hedera validators list from an RTK Query api instead of React Query

- [#21378](https://github.com/LedgerHQ/ledger-live/pull/21378) [`b864c2c`](https://github.com/LedgerHQ/ledger-live/commit/b864c2ced455b2e55d55b8c3e423d2f12d41cd7c) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix MarketBanner/Market list navigation so clicking Arbitrum opens the ARB asset detail instead of the Ethereum one, by passing the market ledger ids in the navigation state and preventing a bare market id from colliding with a same-named chain id

- [#21616](https://github.com/LedgerHQ/ledger-live/pull/21616) [`5e971b5`](https://github.com/LedgerHQ/ledger-live/commit/5e971b55429cdcab0f69825ce2056fef24d30215) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Migrate `BIG_NUMBER_DECIMAL_PLACES` off `@ledgerhq/live-env`: every call site now inlines the constant and the definition is removed. `@ledgerhq/live-currency-format` drops its `@ledgerhq/live-env` dependency altogether.

- [#21269](https://github.com/LedgerHQ/ledger-live/pull/21269) [`63002c4`](https://github.com/LedgerHQ/ledger-live/commit/63002c49322f3b3645a9426fb1c3ce4e008a9a3c) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Open the mock server's configuration UI by right-clicking the top bar indicator, on the session Ledger Live is already using. A left click still copies the session token.

- [#21269](https://github.com/LedgerHQ/ledger-live/pull/21269) [`2a39225`](https://github.com/LedgerHQ/ledger-live/commit/2a39225f15f14c0cc0dbb4980f31b0c6937d93ce) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Reset `BASE_SOCKET_URL` when the mock server transport is turned off, so the legacy scriptrunner flows stop pointing at the mock server.

- [#21269](https://github.com/LedgerHQ/ledger-live/pull/21269) [`778076c`](https://github.com/LedgerHQ/ledger-live/commit/778076cfe739d2ba300a18ab6c336975e9d17bcb) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Keep the mock server session token reactive in the top bar indicator, so a token published after the first render can still be copied.

- [#21474](https://github.com/LedgerHQ/ledger-live/pull/21474) [`54351c2`](https://github.com/LedgerHQ/ledger-live/commit/54351c2f7501362c9323fd835e21b2db37d6b4cd) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Group unavailable assets and networks under a "Not available yet" section in the asset and network selection lists

- [#21458](https://github.com/LedgerHQ/ledger-live/pull/21458) [`40ba77b`](https://github.com/LedgerHQ/ledger-live/commit/40ba77b436486180563c5cd7c9a5624dca1c7353) Thanks [@semeano](https://github.com/semeano)! - Fix Zcash private balance sync staying at 0% when started from the UFVK export modal

- [#21283](https://github.com/LedgerHQ/ledger-live/pull/21283) [`761cf3e`](https://github.com/LedgerHQ/ledger-live/commit/761cf3e359fa197d07f6086d8522fd1785ba575d) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - add earn banner to success transation modal

- [#21359](https://github.com/LedgerHQ/ledger-live/pull/21359) [`36ea18d`](https://github.com/LedgerHQ/ledger-live/commit/36ea18d4f36c757bc6901bfc258af2f11b8ee00d) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Route the Noah webview to signup or signin when noahAuth is set (LIVE-35383).

- [#21299](https://github.com/LedgerHQ/ledger-live/pull/21299) [`ac0311e`](https://github.com/LedgerHQ/ledger-live/commit/ac0311e70c2aabb091a0e4d32deaf1cf6e849a5a) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Present the Pay cash-to-stable intro as a desktop dialog before the Noah handoff (LIVE-35383).

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

- [#21426](https://github.com/LedgerHQ/ledger-live/pull/21426) [`3de7317`](https://github.com/LedgerHQ/ledger-live/commit/3de7317d858c570600eb0a4297876327fdc2c7b5) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Replace the Card logout block with a `More` tile-button (`CardMore`). The tile opens the `More` sheet, and the sheet's `Logout` row ends the Card session.

- [#21438](https://github.com/LedgerHQ/ledger-live/pull/21438) [`8dd19d9`](https://github.com/LedgerHQ/ledger-live/commit/8dd19d9f9e936c0e0fbae5636c856ea681ec4197) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Move Pay contact copy resolution into @features/flow-pay-contact via @shared/i18n so hosts no longer pass translated labels.

- [#21397](https://github.com/LedgerHQ/ledger-live/pull/21397) [`2fe4ef6`](https://github.com/LedgerHQ/ledger-live/commit/2fe4ef6fabb69dbbb38f4bf8517e7d52f9b35b43) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Wire Pay contact tile press to send (prefill a single-address contact), add a desktop View contact overflow action, and render Lumen `MenuTrigger` `render` props in the shared web passthrough stub.

- [#21028](https://github.com/LedgerHQ/ledger-live/pull/21028) [`9b15a72`](https://github.com/LedgerHQ/ledger-live/commit/9b15a7228b9eafb6f627b887c9b950899d79501d) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Add the Perps deposit review step on desktop, reached from the deposit form, showing the swap and deposit details before the user confirms. The amount landing on the perps account now comes from a provider quote, since that balance has no counter value of its own.

- [#21028](https://github.com/LedgerHQ/ledger-live/pull/21028) [`bcf6eef`](https://github.com/LedgerHQ/ledger-live/commit/bcf6eef986320df10bed2a1bb3054e701264421f) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Add the Perps deposit signing step on desktop, reached from the review screen. It runs on the same swap orchestration as the `custom.exchange.swap` handler — now extracted into a shared `executeSwap` — behind the perps screens, and executes against the quote the review priced against. Declining a device prompt returns to the review with the entered amount intact, rather than raising an error screen.

- [#21028](https://github.com/LedgerHQ/ledger-live/pull/21028) [`25b482d`](https://github.com/LedgerHQ/ledger-live/commit/25b482d53eeec610cbac836a5872b03300c67edb) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Title the transaction detail dialog for Perps deposits: the dialog is named "Transaction detail" and its header leads with the deposit being funded, keeping the swapped pair on its own line. Swap opens the same dialog unchanged.

- [#21028](https://github.com/LedgerHQ/ledger-live/pull/21028) [`70036b1`](https://github.com/LedgerHQ/ledger-live/commit/70036b121a60b83588904179e5de438e9b7be39e) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Close the Perps deposit flow with a transaction signed screen, from which the user can follow the deposit on the status of the swap that funds it.

- [#21380](https://github.com/LedgerHQ/ledger-live/pull/21380) [`59ea8fb`](https://github.com/LedgerHQ/ledger-live/commit/59ea8fbd36754199f1c68ab53537460ca31c70b4) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(cosmos): remove Ledger validator as the default one for Osmosis

- [#21295](https://github.com/LedgerHQ/ledger-live/pull/21295) [`6980e49`](https://github.com/LedgerHQ/ledger-live/commit/6980e497d520edeb9cda796afa178f1919660c7a) Thanks [@sarneijim](https://github.com/sarneijim)! - Log Segment identify calls (success or failed) in the desktop analytics debug overlay

- [#21028](https://github.com/LedgerHQ/ledger-live/pull/21028) [`93251f5`](https://github.com/LedgerHQ/ledger-live/commit/93251f5594214aa21a1ab17ae4baba52b227ee8f) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Add the perps deposit amount form, so a deposit requested by the live app collects its funding account and amount before the review step

- [#21240](https://github.com/LedgerHQ/ledger-live/pull/21240) [`1cb4dbe`](https://github.com/LedgerHQ/ledger-live/commit/1cb4dbe4a9b0d556768c3ce18d17eb08935e518f) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Persist Solana `stakingResources` through the generic coin framework, and revive accounts still holding the legacy `solanaResources` blob

- [#21194](https://github.com/LedgerHQ/ledger-live/pull/21194) [`2bd6a1c`](https://github.com/LedgerHQ/ledger-live/commit/2bd6a1c4b9d0cd229a8c9207108672b1a580968a) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Refresh Baanx Pay Card sessions after a 401, and keep the credentials out of every reader of redux.

  The two OAuth2 grants are RTK Query endpoints again. Both opt out of the Bearer and out of the
  renewal, both run with `track: false`, so no session becomes a cache entry, and neither has a hook.

  The desktop redux logger and both DevTools configurations now strip every Card action, which also
  closes a live leak: the code exchange logs its code and its code verifier in production, into the
  file users attach to a support ticket.

- [#21430](https://github.com/LedgerHQ/ledger-live/pull/21430) [`5b546c5`](https://github.com/LedgerHQ/ledger-live/commit/5b546c55ca622f74ae06b867c5118e19009f80a5) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Remove unused PrefillAddAddressFlowRoot and the shared prefill listener store. Send now owns the prefilled add-address session via startWithPrefilled.

- [#21493](https://github.com/LedgerHQ/ledger-live/pull/21493) [`475499d`](https://github.com/LedgerHQ/ledger-live/commit/475499d5784fec1e0034a60f5d969227228a5162) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Extract Pay card persistence from the desktop db middleware into a dedicated helper

- [#21478](https://github.com/LedgerHQ/ledger-live/pull/21478) [`f83a8e2`](https://github.com/LedgerHQ/ledger-live/commit/f83a8e2e8730163591b35c14e55fec208cc8866f) Thanks [@semeano](https://github.com/semeano)! - Update memo tooltip

- [#21650](https://github.com/LedgerHQ/ledger-live/pull/21650) [`349c522`](https://github.com/LedgerHQ/ledger-live/commit/349c522bb86bba744844d80d8521c6d24974d26a) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Add an error message for `UnexpectedGetBalanceError`

  `@ledgerhq/coin-tezos` reports this error when a token balance cannot be retrieved, so Send Max
  no longer claims the account has insufficient funds during an indexer outage. Without a
  translation the send flow fell back to rendering the raw error name.

- [#21392](https://github.com/LedgerHQ/ledger-live/pull/21392) [`2df85eb`](https://github.com/LedgerHQ/ledger-live/commit/2df85ebe83b802749be7f8698008d118fbede53f) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(send): add skip memo screen in the send flow

- [#21411](https://github.com/LedgerHQ/ledger-live/pull/21411) [`f670d92`](https://github.com/LedgerHQ/ledger-live/commit/f670d92b8ac8ac3f94e98406d6677889d43f0dd7) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix theme reverting to dark when navigating from My Ledger to Contacts

- [#21326](https://github.com/LedgerHQ/ledger-live/pull/21326) [`9fb98ab`](https://github.com/LedgerHQ/ledger-live/commit/9fb98ab74e3ca680e686a302b9beaa460a087783) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Drive the XRP app through the Device Management Kit behind the `ldmkXrpSigner` feature flag, keeping `hw-app-xrp` as the fallback

- [#21465](https://github.com/LedgerHQ/ledger-live/pull/21465) [`9683837`](https://github.com/LedgerHQ/ledger-live/commit/9683837e853c8f3784a94d9fc66b9bd57cc4a526) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(tracking): add tracking contact send flow lwd

### Patch Changes

- Updated dependencies [[`7c6a8de`](https://github.com/LedgerHQ/ledger-live/commit/7c6a8de98093e274de57e9ee94c6179541e2120c), [`d01e4c0`](https://github.com/LedgerHQ/ledger-live/commit/d01e4c02a513082f6484c405f9a51977f14a6c03), [`8f8f1a4`](https://github.com/LedgerHQ/ledger-live/commit/8f8f1a472b5c6142d3ddf682fbc5d991c720aa92), [`fc74af8`](https://github.com/LedgerHQ/ledger-live/commit/fc74af8db6038afd89c64de356e67fe9ba4811a0), [`81aa729`](https://github.com/LedgerHQ/ledger-live/commit/81aa7294c94ef114e6e82ec4c277f0a6c0038c92), [`3d23fd4`](https://github.com/LedgerHQ/ledger-live/commit/3d23fd471fbb0ba76a0e6997eba995e190a89f7c), [`b7f83a1`](https://github.com/LedgerHQ/ledger-live/commit/b7f83a1c1818e4eff9ffbf19796a71d7242fd5b4), [`c270975`](https://github.com/LedgerHQ/ledger-live/commit/c2709750e007b758fa13f0f717efa897fcc6235d), [`e1e7cb2`](https://github.com/LedgerHQ/ledger-live/commit/e1e7cb2fa32ef3b413f8e598687f05780ad1c0e8), [`d182d46`](https://github.com/LedgerHQ/ledger-live/commit/d182d466275f4c35ec3bf86cadf544de77c27058), [`5b79eb3`](https://github.com/LedgerHQ/ledger-live/commit/5b79eb3c5b1e2e7aca86fb0a8c4b7af085e57f9d), [`c06bd2e`](https://github.com/LedgerHQ/ledger-live/commit/c06bd2ee99e9d76609d628a41698a16c37a0c0c7), [`eea933c`](https://github.com/LedgerHQ/ledger-live/commit/eea933c21039eab89442a4caae6cf0e121f68cca), [`3b0dbae`](https://github.com/LedgerHQ/ledger-live/commit/3b0dbae4ae5df48bd4eb58146675747d7e3593c2), [`dd134e9`](https://github.com/LedgerHQ/ledger-live/commit/dd134e9c126773d47cd8dfb6aaf677534f2e7b23), [`5c23a76`](https://github.com/LedgerHQ/ledger-live/commit/5c23a7694a8304727c13d7383979d6a0660b1596), [`96661b4`](https://github.com/LedgerHQ/ledger-live/commit/96661b459f66f511de75c62b87b3bcd2519a1814), [`47a1cd0`](https://github.com/LedgerHQ/ledger-live/commit/47a1cd082cc30cd7cc539a8eb0e0fe5466128533), [`8c40cc1`](https://github.com/LedgerHQ/ledger-live/commit/8c40cc1c2054d12fc546e341a18e966d6ab23986), [`0089a4b`](https://github.com/LedgerHQ/ledger-live/commit/0089a4b80512c2c8f8eb3a03b9e3245492380647), [`e601584`](https://github.com/LedgerHQ/ledger-live/commit/e6015847b44e86dd9c4733559d591874099e1f4e), [`000eac0`](https://github.com/LedgerHQ/ledger-live/commit/000eac03eacf0093f241f8a05d9f525bbcf5de13), [`60ee73c`](https://github.com/LedgerHQ/ledger-live/commit/60ee73c7b89b101dde708a04ded260341ef86d44), [`ef29f07`](https://github.com/LedgerHQ/ledger-live/commit/ef29f0711ecec104e4dd9c9d86d4e4d41c4ddee3), [`55bd216`](https://github.com/LedgerHQ/ledger-live/commit/55bd2166238ab3e03c33226bb5f5eb2e8646a818), [`6ed1820`](https://github.com/LedgerHQ/ledger-live/commit/6ed1820776ca6ba59e861da11e4582af406b2188), [`6b47659`](https://github.com/LedgerHQ/ledger-live/commit/6b4765929e98abbcb08cd5348fddb528a9e674e7), [`b1b1e38`](https://github.com/LedgerHQ/ledger-live/commit/b1b1e38d2a8311f935f30c185276c165a6992dbc), [`86fdaa1`](https://github.com/LedgerHQ/ledger-live/commit/86fdaa1929eeaf42d6d3765ce206758f0422c631), [`51a3d3e`](https://github.com/LedgerHQ/ledger-live/commit/51a3d3ef013a9310ed943a17a33ba69ea8d79a6d), [`3a78322`](https://github.com/LedgerHQ/ledger-live/commit/3a783224b6016fce08fa8cb3254057b75882e2c5), [`2b8a4e4`](https://github.com/LedgerHQ/ledger-live/commit/2b8a4e4240a414cbb1bda31b97b70837cb6ac3fe), [`92b90a6`](https://github.com/LedgerHQ/ledger-live/commit/92b90a6eebca959abe0b04aa83c5799d34f9f10a), [`23d2e1e`](https://github.com/LedgerHQ/ledger-live/commit/23d2e1e0a0a83516fb9f5c12f54a2afc15208702), [`9672658`](https://github.com/LedgerHQ/ledger-live/commit/967265820c38ad0b2f8f45fd0a892ca07c58d23a), [`a55d4ca`](https://github.com/LedgerHQ/ledger-live/commit/a55d4ca3a804f6ab27f039926255f2c410ef7221), [`147a290`](https://github.com/LedgerHQ/ledger-live/commit/147a2905d735eee5682d849b3e2c2cde5178f7bb), [`6ccfc64`](https://github.com/LedgerHQ/ledger-live/commit/6ccfc644e6b5c00e2e0bafb10e8519a09d7fb589), [`8993c24`](https://github.com/LedgerHQ/ledger-live/commit/8993c242de8ed57617fb74ac9a3b1af047638914), [`8c83fe6`](https://github.com/LedgerHQ/ledger-live/commit/8c83fe6b93cf1806b551f05b946cb9ad2b7e3531), [`8f8d63e`](https://github.com/LedgerHQ/ledger-live/commit/8f8d63ecfeba6a4be8edca7655abf713fc328060), [`b290a1e`](https://github.com/LedgerHQ/ledger-live/commit/b290a1eb54cace8cfa1f6e5fcd2786cda320a9ec), [`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d), [`2d42e64`](https://github.com/LedgerHQ/ledger-live/commit/2d42e647d55f79cf2eb821ec30a232cc07891219), [`b7d0367`](https://github.com/LedgerHQ/ledger-live/commit/b7d03671db1aa022d3ff375465c7d8470bf2b215), [`8c98d3b`](https://github.com/LedgerHQ/ledger-live/commit/8c98d3b1e849a4684bd21861ae56faadf1dc3a28), [`e42c12a`](https://github.com/LedgerHQ/ledger-live/commit/e42c12a392ba60ee839c9a71f4f0d409ad9430fa), [`73f68cd`](https://github.com/LedgerHQ/ledger-live/commit/73f68cd228569c9d68ab22108aa5ead99adc6706), [`eb62268`](https://github.com/LedgerHQ/ledger-live/commit/eb622688cb7561882cd02b52c2eed569d5dc68f3), [`70b93a0`](https://github.com/LedgerHQ/ledger-live/commit/70b93a037c9217a1f64e66c13085d43c1d4fde2e), [`bed4fe7`](https://github.com/LedgerHQ/ledger-live/commit/bed4fe75210412872bd6c83189ab502b0e1cab24), [`a9e389f`](https://github.com/LedgerHQ/ledger-live/commit/a9e389fc59ca30abf53d0ba8decc6290752ba1db), [`e92cf97`](https://github.com/LedgerHQ/ledger-live/commit/e92cf9742f7d910dea79ca848494b3870b2ae254), [`5f6b8a8`](https://github.com/LedgerHQ/ledger-live/commit/5f6b8a88709d1fd4a94fccaaab915d5ad322c584), [`9dd7db0`](https://github.com/LedgerHQ/ledger-live/commit/9dd7db0d81362a5d019cd0830bdd336a1f42e7af), [`5b7d11d`](https://github.com/LedgerHQ/ledger-live/commit/5b7d11dd9a988f0034b4b5b6168f02429ba5a406), [`ebb1371`](https://github.com/LedgerHQ/ledger-live/commit/ebb13714a6de9c39f290b2ccd51ca78370824f6f), [`3e14841`](https://github.com/LedgerHQ/ledger-live/commit/3e14841c47bf578e6a8c9aabda22a8b59facb83f), [`800e718`](https://github.com/LedgerHQ/ledger-live/commit/800e71806a6b743161ae1eb4f163d6a9ca654f85), [`1e883b3`](https://github.com/LedgerHQ/ledger-live/commit/1e883b36260cb3d78c34251de87a2da1ec353d9f), [`7aca4c8`](https://github.com/LedgerHQ/ledger-live/commit/7aca4c8a806ab270cd990d63b1c651e443b7e149), [`6561cf0`](https://github.com/LedgerHQ/ledger-live/commit/6561cf003713ab65533bb9476771c0de9b19e634), [`53dcdc9`](https://github.com/LedgerHQ/ledger-live/commit/53dcdc9bbef2324b48fac7469c2c1d0e66f7361f), [`2744267`](https://github.com/LedgerHQ/ledger-live/commit/2744267da72f342ca2dc67d95f34d512d7f4c7f6), [`b864c2c`](https://github.com/LedgerHQ/ledger-live/commit/b864c2ced455b2e55d55b8c3e423d2f12d41cd7c), [`5e971b5`](https://github.com/LedgerHQ/ledger-live/commit/5e971b55429cdcab0f69825ce2056fef24d30215), [`b7a8906`](https://github.com/LedgerHQ/ledger-live/commit/b7a89064587bbcd1f758f7b6205a616225ac2317), [`5db7a7d`](https://github.com/LedgerHQ/ledger-live/commit/5db7a7dc517bb23d12532ae07cc947eddff6c10e), [`2c70999`](https://github.com/LedgerHQ/ledger-live/commit/2c709990d3569bc50504822ce90c9e9024210312), [`918e931`](https://github.com/LedgerHQ/ledger-live/commit/918e9318379ec8ed73dfaca58a7dd8ff06dd897b), [`54351c2`](https://github.com/LedgerHQ/ledger-live/commit/54351c2f7501362c9323fd835e21b2db37d6b4cd), [`761cf3e`](https://github.com/LedgerHQ/ledger-live/commit/761cf3e359fa197d07f6086d8522fd1785ba575d), [`36ea18d`](https://github.com/LedgerHQ/ledger-live/commit/36ea18d4f36c757bc6901bfc258af2f11b8ee00d), [`ebeb266`](https://github.com/LedgerHQ/ledger-live/commit/ebeb266bb8091b86a4393497677088b1aa51dee5), [`ac0311e`](https://github.com/LedgerHQ/ledger-live/commit/ac0311e70c2aabb091a0e4d32deaf1cf6e849a5a), [`91bae2a`](https://github.com/LedgerHQ/ledger-live/commit/91bae2a0cf5af0f407b4d797b023d07e4ba95fbf), [`08ee05c`](https://github.com/LedgerHQ/ledger-live/commit/08ee05cfb66f393b14fdf1377ed6c54c4831a87c), [`d6b290b`](https://github.com/LedgerHQ/ledger-live/commit/d6b290b37b8ad6f677ab382bef53bf05cd394ca2), [`0a02a32`](https://github.com/LedgerHQ/ledger-live/commit/0a02a325f99033c086864b0778a8f81c3b4178ae), [`66c7569`](https://github.com/LedgerHQ/ledger-live/commit/66c7569dcfae90739b369ffb3a92cee75dd2e9cd), [`543b17d`](https://github.com/LedgerHQ/ledger-live/commit/543b17d7a6b49728001c0311c184c665e8c9bbb2), [`a7d54c0`](https://github.com/LedgerHQ/ledger-live/commit/a7d54c0d6af65abe7aa2170053b3fd07ae9b05ab), [`c3de11c`](https://github.com/LedgerHQ/ledger-live/commit/c3de11cdf58c4feac701435548bbb96819ae09f6), [`3de7317`](https://github.com/LedgerHQ/ledger-live/commit/3de7317d858c570600eb0a4297876327fdc2c7b5), [`d60ce38`](https://github.com/LedgerHQ/ledger-live/commit/d60ce38581fe06b7f4fa72ba40259af2eabfe11f), [`7aa3071`](https://github.com/LedgerHQ/ledger-live/commit/7aa3071a532c98804a4357ff36a001b23351da73), [`faa8ef1`](https://github.com/LedgerHQ/ledger-live/commit/faa8ef11055a27af3eb7bcf1b662e8bf5c3da77d), [`8dd19d9`](https://github.com/LedgerHQ/ledger-live/commit/8dd19d9f9e936c0e0fbae5636c856ea681ec4197), [`2fe4ef6`](https://github.com/LedgerHQ/ledger-live/commit/2fe4ef6fabb69dbbb38f4bf8517e7d52f9b35b43), [`9b15a72`](https://github.com/LedgerHQ/ledger-live/commit/9b15a7228b9eafb6f627b887c9b950899d79501d), [`bcf6eef`](https://github.com/LedgerHQ/ledger-live/commit/bcf6eef986320df10bed2a1bb3054e701264421f), [`80b27a1`](https://github.com/LedgerHQ/ledger-live/commit/80b27a1349db33bbd7ba3b96aef5260853916bd2), [`59ea8fb`](https://github.com/LedgerHQ/ledger-live/commit/59ea8fbd36754199f1c68ab53537460ca31c70b4), [`6ad68ad`](https://github.com/LedgerHQ/ledger-live/commit/6ad68ad4358d6a1126f300c3855cab33a918c017), [`a6193dc`](https://github.com/LedgerHQ/ledger-live/commit/a6193dcf861890977c3f36dc8b1618c4403dae75), [`30619aa`](https://github.com/LedgerHQ/ledger-live/commit/30619aaa2af784fd917214bb0e4bbd092f883e11), [`93251f5`](https://github.com/LedgerHQ/ledger-live/commit/93251f5594214aa21a1ab17ae4baba52b227ee8f), [`08ae9c2`](https://github.com/LedgerHQ/ledger-live/commit/08ae9c2bf7b2b509fa23d9b4bf33360f18f7f39f), [`1cb4dbe`](https://github.com/LedgerHQ/ledger-live/commit/1cb4dbe4a9b0d556768c3ce18d17eb08935e518f), [`2bd6a1c`](https://github.com/LedgerHQ/ledger-live/commit/2bd6a1c4b9d0cd229a8c9207108672b1a580968a), [`d54d191`](https://github.com/LedgerHQ/ledger-live/commit/d54d19127a958bb0ac8c9c479bba716ce67041ff), [`dcdec92`](https://github.com/LedgerHQ/ledger-live/commit/dcdec92fec41cf5bef0d3f54566e4649b851607f), [`5b546c5`](https://github.com/LedgerHQ/ledger-live/commit/5b546c55ca622f74ae06b867c5118e19009f80a5), [`54124e4`](https://github.com/LedgerHQ/ledger-live/commit/54124e435c7adc3a2c3a9ed6cd1865fc68fa2584), [`db09cfc`](https://github.com/LedgerHQ/ledger-live/commit/db09cfc0a41f71af1dd2f452d7d5ad7865f4ffe7), [`a19ffef`](https://github.com/LedgerHQ/ledger-live/commit/a19ffeff9dd4e173890d75d8634a33e53cc5a5d0), [`1cf5583`](https://github.com/LedgerHQ/ledger-live/commit/1cf55832f785fc57881169092f1190fa7ddfecf9), [`b683a6d`](https://github.com/LedgerHQ/ledger-live/commit/b683a6dc7709dd9b669288e7178414334790ba9e), [`3da476c`](https://github.com/LedgerHQ/ledger-live/commit/3da476c2d4c435c62aa3fe11a0290f56d7283cbe), [`12199a1`](https://github.com/LedgerHQ/ledger-live/commit/12199a1c615ccd21c1f3574b0f1868dbf0800ba2), [`0152cad`](https://github.com/LedgerHQ/ledger-live/commit/0152cade87e061bb2b56fd71f8a404c3dfed21e0), [`1c58fb1`](https://github.com/LedgerHQ/ledger-live/commit/1c58fb15f0b3421d6cf82b53db66f39a21fb7bc0), [`6f39b04`](https://github.com/LedgerHQ/ledger-live/commit/6f39b0411286ed5c82362c9ffafb953abe8b53b7), [`2df85eb`](https://github.com/LedgerHQ/ledger-live/commit/2df85ebe83b802749be7f8698008d118fbede53f), [`9fb98ab`](https://github.com/LedgerHQ/ledger-live/commit/9fb98ab74e3ca680e686a302b9beaa460a087783), [`3a3d2fa`](https://github.com/LedgerHQ/ledger-live/commit/3a3d2fa06b8dbdcc6ad964bb737898a6e35c934d), [`018ee9b`](https://github.com/LedgerHQ/ledger-live/commit/018ee9bdcb993a1b4a203d5664676f7e757b3785), [`6656f90`](https://github.com/LedgerHQ/ledger-live/commit/6656f90769c3419e1f121c0c2368eab4566e48ba)]:
  - @ledgerhq/transaction-observability@0.3.0
  - @ledgerhq/live-common@37.6.0
  - @features/flow-pay-card-details@0.3.0
  - @features/flow-pay-contact@0.3.0
  - @ledgerhq/coin-zcash@0.7.0
  - @devtools/bindings@0.7.0
  - @features/flow-pay-request@0.4.0
  - @features/flow-contacts-introduction@1.1.0
  - @features/flow-contacts@0.10.0
  - @features/platform-contacts@0.6.0
  - @features/flow-contacts-add-address@0.4.0
  - @features/flow-contacts-edit-address@0.3.0
  - @ledgerhq/coin-concordium@1.2.0
  - @features/flow-contacts-edit-contact@0.4.0
  - @features/flow-contacts-list@0.6.0
  - @shared/env@0.6.0
  - @shared/api-services@0.7.0
  - @domain/api-card-management@0.5.0
  - @features/flow-pay-card@0.3.0
  - @features/flow-pay-card-widget@0.2.0
  - @ledgerhq/coin-cosmos@1.2.0
  - @shared/feature-flags@0.22.0
  - @ledgerhq/live-dmk-desktop@0.21.0
  - @domain/entity-currency-crypto@0.12.0
  - @ledgerhq/types-live@6.123.0
  - @ledgerhq/ledger-wallet-framework@3.3.0
  - @domain/api-aggregated-assets@0.5.0
  - @ledgerhq/react-ui@0.54.0
  - @ledgerhq/live-countervalues@0.25.0
  - @ledgerhq/live-countervalues-react@0.17.0
  - @ledgerhq/coin-casper@3.3.0
  - @features/platform-currencies@0.8.0
  - @ledgerhq/wallet-analytics@0.4.0
  - @ledgerhq/asset-aggregation@0.15.0
  - @ledgerhq/live-currency-format@0.15.0
  - @features/platform-env@0.3.0
  - @ledgerhq/hw-ledger-key-ring-protocol@0.12.0
  - @features/flow-pay-bank-transfer@0.3.0
  - @features/flow-pay-card-auth@0.6.0
  - @features/platform-card@0.4.0
  - @features/flow-pay-feature-tour@0.5.0
  - @ledgerhq/wallet-btc@0.4.0
  - @ledgerhq/coin-bitcoin@0.52.0
  - @ledgerhq/asset-detail@0.11.4
  - @features/flow-contacts-add-contact@0.5.1
  - @features/flow-contacts-delete-contact@0.2.1
  - @features/flow-pay-balance@0.4.1
  - @features/flow-pay-deposit@0.3.1
  - @features/platform-device-action-content@0.2.0
  - @features/platform-aggregated-assets@0.5.2
  - @ledgerhq/ledger-key-ring-protocol@0.21.2
  - @ledgerhq/live-dmk-speculos@0.10.8
  - @ledgerhq/wallet-pnl@0.7.10
  - @domain/api-altcoins-sentiment@0.3.5
  - @domain/api-currency-fiat@0.4.4
  - @domain/api-currency-token@0.6.1
  - @domain/api-market-sentiment@0.3.5
  - @domain/api-push-devices@0.2.5
  - @features/flow-large-screen-upsell@2.0.2
  - @features/platform-feature-flags@0.6.9
  - @domain/entity-contact@0.8.2
  - @domain/entity-currency@0.4.3
  - @domain/entity-currency-token@0.5.2
  - @ledgerhq/coin-cardano@1.1.1
  - @ledgerhq/live-wallet@1.1.2
  - @ledgerhq/coin-canton@1.1.1
  - @ledgerhq/coin-filecoin@2.1.1
  - @ledgerhq/domain-service@1.8.18
  - @ledgerhq/live-signer-evm@0.23.1
  - @shared/ui-info-state@0.2.1
  - @shared/auth@0.6.0
  - @shared/cloud-sync@0.3.0
  - @shared/i18n@0.2.0
  - @devtools/shell@0.9.2
  - @features/flow-analytics-consent@0.2.5

## 4.20.0-next.4

### Patch Changes

- Updated dependencies [[`8993c24`](https://github.com/LedgerHQ/ledger-live/commit/8993c242de8ed57617fb74ac9a3b1af047638914)]:
  - @shared/feature-flags@0.22.0-next.1
  - @devtools/bindings@0.7.0-next.1
  - @features/flow-contacts-add-address@0.4.0-next.1
  - @features/flow-large-screen-upsell@2.0.2-next.1
  - @features/platform-contacts@0.6.0-next.1
  - @features/platform-currencies@0.8.0-next.1
  - @features/platform-feature-flags@0.6.9-next.1
  - @ledgerhq/live-common@37.6.0-next.4
  - @features/flow-contacts@0.10.0-next.1
  - @features/flow-contacts-add-contact@0.5.1-next.1
  - @features/flow-contacts-delete-contact@0.2.1-next.1
  - @features/flow-contacts-edit-address@0.3.0-next.1
  - @features/flow-contacts-edit-contact@0.4.0-next.1
  - @features/flow-contacts-list@0.6.0-next.1
  - @features/flow-pay-contact@0.3.0-next.1
  - @features/flow-analytics-consent@0.2.5-next.1
  - @ledgerhq/asset-detail@0.11.4-next.4
  - @ledgerhq/live-dmk-desktop@0.21.0-next.4
  - @devtools/shell@0.9.2-next.1

## 4.20.0-next.3

### Patch Changes

- Updated dependencies [[`6ad68ad`](https://github.com/LedgerHQ/ledger-live/commit/6ad68ad4358d6a1126f300c3855cab33a918c017)]:
  - @ledgerhq/live-common@37.6.0-next.3
  - @ledgerhq/asset-detail@0.11.4-next.3
  - @ledgerhq/live-dmk-desktop@0.21.0-next.3

## 4.20.0-next.2

### Patch Changes

- Updated dependencies [[`800e718`](https://github.com/LedgerHQ/ledger-live/commit/800e71806a6b743161ae1eb4f163d6a9ca654f85)]:
  - @ledgerhq/live-common@37.6.0-next.2
  - @ledgerhq/asset-detail@0.11.4-next.2
  - @ledgerhq/live-dmk-desktop@0.21.0-next.2

## 4.20.0-next.1

### Minor Changes

- [#21746](https://github.com/LedgerHQ/ledger-live/pull/21746) [`c2e2276`](https://github.com/LedgerHQ/ledger-live/commit/c2e2276459d5e48e938145eb54bae572f5ae7a60) Thanks [@amaslakov](https://github.com/amaslakov)! - Add the error message shown when the protocol refuses a Tezos stake amount as too small

### Patch Changes

- Updated dependencies [[`12199a1`](https://github.com/LedgerHQ/ledger-live/commit/12199a1c615ccd21c1f3574b0f1868dbf0800ba2)]:
  - @ledgerhq/live-common@37.6.0-next.1
  - @ledgerhq/asset-detail@0.11.4-next.1
  - @ledgerhq/live-dmk-desktop@0.21.0-next.1

## 4.20.0-next.0

### Minor Changes

- [#21371](https://github.com/LedgerHQ/ledger-live/pull/21371) [`56bf73c`](https://github.com/LedgerHQ/ledger-live/commit/56bf73ccfa5b1323d380d3eb9bc2f7145bc08a97) Thanks [@vpenskyi-ledger](https://github.com/vpenskyi-ledger)! - Fix NoFundsStake modal passing raw currency object to Swap live-app instead of expected `{ toCurrencyId }` format, causing the Receive field to not be pre-filled when navigating from Earn zero-balance account flow

- [#21042](https://github.com/LedgerHQ/ledger-live/pull/21042) [`d5e1c7d`](https://github.com/LedgerHQ/ledger-live/commit/d5e1c7d985b15adbe230e537e998af2dcf3cff8b) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Tell the two Hyperliquid account-picker states apart.

  The perps receiving step used one description for both states, so users who already had a Hyperliquid account were told to add one. It now reads "Select an account you want to deposit funds into to place your trades" when accounts exist, and keeps "To fund your perps, you need a Hyperliquid account.

- [#21515](https://github.com/LedgerHQ/ledger-live/pull/21515) [`7f4723c`](https://github.com/LedgerHQ/ledger-live/commit/7f4723cf1aa59ec55d172d27000fad438f4833c6) Thanks [@sarneijim](https://github.com/sarneijim)! - Bump Segment analytics SDKs for retry, rate-limit and security fixes (LIVE-35839)

- [#21433](https://github.com/LedgerHQ/ledger-live/pull/21433) [`8f8f1a4`](https://github.com/LedgerHQ/ledger-live/commit/8f8f1a472b5c6142d3ddf682fbc5d991c720aa92) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add a web `ContactAddressPicker` dialog skeleton to the Pay contact flow and open it from the desktop Pay tab when a contact is pressed. The address list UI and the account/send handoff on address selection land in follow-ups.

- [#21355](https://github.com/LedgerHQ/ledger-live/pull/21355) [`fc74af8`](https://github.com/LedgerHQ/ledger-live/commit/fc74af8db6038afd89c64de356e67fe9ba4811a0) Thanks [@semeano](https://github.com/semeano)! - Offer the Zcash memo only to shielded recipients. A memo travels in a shielded output, so a transparent recipient could never receive one, yet the send flow showed the input for every Zcash address and made the user fill or skip it. Send descriptors can now distinguish static memo support from recipient-specific visibility, and a memo left over from an earlier shielded recipient is dropped when the recipient turns transparent, so it can no longer reach the transaction builder.

- [#21434](https://github.com/LedgerHQ/ledger-live/pull/21434) [`b7f83a1`](https://github.com/LedgerHQ/ledger-live/commit/b7f83a1c1818e4eff9ffbf19796a71d7242fd5b4) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add persisted Pay Request verify-hint state in `@features/flow-pay-request`.

- [#21408](https://github.com/LedgerHQ/ledger-live/pull/21408) [`c270975`](https://github.com/LedgerHQ/ledger-live/commit/c2709750e007b758fa13f0f717efa897fcc6235d) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add a first-time Popover on desktop Pay Request Verify.

- [#21367](https://github.com/LedgerHQ/ledger-live/pull/21367) [`d182d46`](https://github.com/LedgerHQ/ledger-live/commit/d182d466275f4c35ec3bf86cadf544de77c27058) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix the Ledger Sync entry point from Contacts: align the introduction copy and artwork with the production design, only show it when the user actually tries to add a contact or an address, start the flow on "Choose your sync method", and return to Contacts instead of the Portfolio once the flow is done on Mobile.

- [#21470](https://github.com/LedgerHQ/ledger-live/pull/21470) [`5b79eb3`](https://github.com/LedgerHQ/ledger-live/commit/5b79eb3c5b1e2e7aca86fb0a8c4b7af085e57f9d) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix the Contacts add address flow stalling on Continue by only offering networks the device can register an address on: EVM networks running their own coin app, such as Ethereum Classic, Sonic and Sei, are no longer selectable

- [#21453](https://github.com/LedgerHQ/ledger-live/pull/21453) [`3b0dbae`](https://github.com/LedgerHQ/ledger-live/commit/3b0dbae4ae5df48bd4eb58146675747d7e3593c2) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the web `ContactAddressPicker` dialog to the Pay contact flow and open it from the desktop Pay tab when a contact is pressed. The picker lists the contact's addresses segmented by network with asset-aware icons, resolved through the view model, and exposes an optional add-address action that routes to the contact's add-address flow. Address grouping, icon resolution and truncation are shared from `@features/flow-contacts`. The account/send handoff on address selection lands in a follow-up.

- [#21587](https://github.com/LedgerHQ/ledger-live/pull/21587) [`46b51dd`](https://github.com/LedgerHQ/ledger-live/commit/46b51ddabe0689bc64b598bcb33f131f4b1c2a22) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix the Contacts feature introduction so closing it counts as seen and keeps you on the Contacts list, instead of navigating back and reopening the introduction on the next visit.

- [#21601](https://github.com/LedgerHQ/ledger-live/pull/21601) [`96661b4`](https://github.com/LedgerHQ/ledger-live/commit/96661b459f66f511de75c62b87b3bcd2519a1814) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - part 1 for Aleo bond flow

- [#21401](https://github.com/LedgerHQ/ledger-live/pull/21401) [`8c40cc1`](https://github.com/LedgerHQ/ledger-live/commit/8c40cc1c2054d12fc546e341a18e966d6ab23986) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Skip the extra confirmation modal when editing a contact or address name. Apply changes now starts the device action directly when needed, and the Apply CTA shows the Ledger logo in that case.

- [#21440](https://github.com/LedgerHQ/ledger-live/pull/21440) [`0089a4b`](https://github.com/LedgerHQ/ledger-live/commit/0089a4b80512c2c8f8eb3a03b9e3245492380647) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Drive Contacts add-address confirmation through the Device Intent Executor instead of mocked Continue screens, including prefill and Send entry points.

- [#21374](https://github.com/LedgerHQ/ledger-live/pull/21374) [`d6e689f`](https://github.com/LedgerHQ/ledger-live/commit/d6e689fc08c18581ce2a4146b453538665d550db) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Update the desktop Pay feature tour layout and copy to match mockups (LIVE-36499).

- [#21418](https://github.com/LedgerHQ/ledger-live/pull/21418) [`60ee73c`](https://github.com/LedgerHQ/ledger-live/commit/60ee73c7b89b101dde708a04ded260341ef86d44) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Rename `CARD_API_URL` to `CARD_BAANX_API_URL`, keep the production defaults, and drop the Env vars section from the Card / Pay DevTool.

- [#21548](https://github.com/LedgerHQ/ledger-live/pull/21548) [`55bd216`](https://github.com/LedgerHQ/ledger-live/commit/55bd2166238ab3e03c33226bb5f5eb2e8646a818) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add a getCardOnboardingStatus RTK Query endpoint and a schema-validated mock fixture.

- [#21550](https://github.com/LedgerHQ/ledger-live/pull/21550) [`6ed1820`](https://github.com/LedgerHQ/ledger-live/commit/6ed1820776ca6ba59e861da11e4582af406b2188) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Mount and persist the card onboarding widget in Ledger Wallet Desktop.

- [#21546](https://github.com/LedgerHQ/ledger-live/pull/21546) [`85474db`](https://github.com/LedgerHQ/ledger-live/commit/85474db611c17c603b459d17f223880342ecd0ab) Thanks [@semeano](https://github.com/semeano)! - Change show private balance label.

- [#21248](https://github.com/LedgerHQ/ledger-live/pull/21248) [`9672658`](https://github.com/LedgerHQ/ledger-live/commit/967265820c38ad0b2f8f45fd0a892ca07c58d23a) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Edit an external address on the device from Contacts. The device intent now calls `@ledgerhq/device-contacts-kit`'s `ContactsManager.editExternalAddressIdentifier()` and `ContactsManager.editExternalAddressScope()`, each returning the rotated address proof to persist while the group's name proof passes through untouched, and both apps render the confirmation step and one `InfoState` per failure.

  The device serves address and label edits as two separate commands, so an edit changing both asks the user to confirm twice, showing the same waiting screen for each step rather than numbering them. Nothing partial is ever stored: an abandoned or rejected edit leaves the record untouched, and a retry restarts the whole chain.

- [#21247](https://github.com/LedgerHQ/ledger-live/pull/21247) [`a55d4ca`](https://github.com/LedgerHQ/ledger-live/commit/a55d4ca3a804f6ab27f039926255f2c410ef7221) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Rename a contact on the device from Contacts. The device intent now calls `@ledgerhq/device-contacts-kit`'s `ContactsManager.renameContact()`, which returns the rotated name proof to persist, and both apps render the confirmation step and one `InfoState` per failure. A rejection keeps the job open so the user can retry on the same device.

  Rename is a blockchain-agnostic dashboard operation, so it initializes on the dashboard (`BOLOS`) rather than a coin app: a contact with no address is renameable, and an outdated device surfaces as an OS-update screen instead of an app-update one.

- [#21269](https://github.com/LedgerHQ/ledger-live/pull/21269) [`8c83fe6`](https://github.com/LedgerHQ/ledger-live/commit/8c83fe6b93cf1806b551f05b946cb9ad2b7e3531) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Show the emulated device's screen at the foot of the desktop sidebar while the mock server transport is driving it, and let its buttons and touchscreen be pressed.

- [#21269](https://github.com/LedgerHQ/ledger-live/pull/21269) [`9c67330`](https://github.com/LedgerHQ/ledger-live/commit/9c67330ab28a41e38d90e9d07acf1ee19c5598a1) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Let a launch `MOCK_SERVER_TRANSPORT=1` turn the mock server transport on, instead of the developer toggle's stored value always winning.

- [#21269](https://github.com/LedgerHQ/ledger-live/pull/21269) [`8f8d63e`](https://github.com/LedgerHQ/ledger-live/commit/8f8d63ecfeba6a4be8edca7655abf713fc328060) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Add a "Mock server transport" toggle in the desktop developer settings, so the Device Management Kit connects to a device mock server instead of a physical device. Configured by `MOCK_SERVER_TRANSPORT`, `MOCK_SERVER_TRANSPORT_URL`, `MOCK_SERVER_SESSION` and `MOCK_SERVER_SEED`, with a top bar indicator showing whether the server is reachable.

- [#21390](https://github.com/LedgerHQ/ledger-live/pull/21390) [`8c98d3b`](https://github.com/LedgerHQ/ledger-live/commit/8c98d3b1e849a4684bd21861ae56faadf1dc3a28) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Remove Storybook from the desktop app: drop the `.storybook` config, the `rsbuild.storybook.config.js` builder, every `*.stories.*` file and the Storybook-only dependencies (`storybook`, `@storybook/*`, `storybook-react-rsbuild`, `@rsbuild/*`, `@vitest/mocker`, `events`). The `STORYBOOK_ENV` branches around `electron` access are gone, so `clipboard` and `shell` are now imported directly, and the shared Jest `electron` mock exposes `clipboard`. The now-dead `*.stories.tsx` exclusions in the repo Sonar and `@ledgerhq/react-ui` build configs are removed too.

- [#21477](https://github.com/LedgerHQ/ledger-live/pull/21477) [`9175a6d`](https://github.com/LedgerHQ/ledger-live/commit/9175a6d4a94d75b2067246f316bc3ad23fff9712) Thanks [@semeano](https://github.com/semeano)! - Change Zcash private sync button label

- [#21223](https://github.com/LedgerHQ/ledger-live/pull/21223) [`e92cf97`](https://github.com/LedgerHQ/ledger-live/commit/e92cf9742f7d910dea79ca848494b3870b2ae254) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Route Casper through the generic coin-framework bridge (LIVE-35912/35914/35915).

  - `coin-casper`: `createApi()` now returns a `CoinModuleImpl` (dropping the throwing stubs for unsupported capabilities; `withDefaults` fills them). `craftTransactionData` delegates to the framework helper. `getTransferIdFromMemo` bridges the legacy `StringMemo<"transferId">` shape and the new `{type:"transferId"}` framework shape until LIVE-35735 unifies them.
  - `live-common`: Casper added to `genericCoinFrameworkFamilies.json`; LiveConfig key `config_casper_generic_bridge` (default `true`) provides a runtime kill-switch to fall back to the legacy bridge without a deploy.
  - Desktop/Mobile: `useTransferIdChange` hook extracted and shared between `MemoField` / `TransferIdField` / `MemoTagInput` / `ScreenEditTransferId`; now writes both `transferId` (legacy bridge) and `memoType`/`memoValue` (generic path) so both bridges read the same user input correctly.

- [#21513](https://github.com/LedgerHQ/ledger-live/pull/21513) [`9dd7db0`](https://github.com/LedgerHQ/ledger-live/commit/9dd7db0d81362a5d019cd0830bdd336a1f42e7af) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add a Pay success screen to the Send flow. When the flow is launched from the Pay tab and the transaction succeeds, it now routes to a dedicated `PAY_SUCCESS` step that shows the recipient, amount, source account (with network icon) and a link to the transaction details, instead of the standard confirmation step. Exposes a presentational `PaySuccess` component from `@features/flow-pay-contact` and wires it in ledger-live-desktop via an MVVM `PaySuccessScreen` + `usePaySuccessViewModel`.

- [#21372](https://github.com/LedgerHQ/ledger-live/pull/21372) [`961792b`](https://github.com/LedgerHQ/ledger-live/commit/961792b84469e81b8b2160a9bb1db08a2c9a1781) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Gate the Pay tab contacts section behind the contacts feature flag (lwdContacts on desktop, lwmContacts on mobile)

- [#21302](https://github.com/LedgerHQ/ledger-live/pull/21302) [`1e883b3`](https://github.com/LedgerHQ/ledger-live/commit/1e883b36260cb3d78c34251de87a2da1ec353d9f) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: read Hedera staking validators through an on-demand query on desktop, with loading and fetch-error states

- [#21305](https://github.com/LedgerHQ/ledger-live/pull/21305) [`7aca4c8`](https://github.com/LedgerHQ/ledger-live/commit/7aca4c8a806ab270cd990d63b1c651e443b7e149) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - refactor: drop the Hedera preload layer now that no consumer reads it, and fold useHederaEnrichedDelegationV2 back into useHederaEnrichedDelegation

- [#21358](https://github.com/LedgerHQ/ledger-live/pull/21358) [`6561cf0`](https://github.com/LedgerHQ/ledger-live/commit/6561cf003713ab65533bb9476771c0de9b19e634) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - refactor: serve the Hedera validators list from an RTK Query api instead of React Query

- [#21378](https://github.com/LedgerHQ/ledger-live/pull/21378) [`b864c2c`](https://github.com/LedgerHQ/ledger-live/commit/b864c2ced455b2e55d55b8c3e423d2f12d41cd7c) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix MarketBanner/Market list navigation so clicking Arbitrum opens the ARB asset detail instead of the Ethereum one, by passing the market ledger ids in the navigation state and preventing a bare market id from colliding with a same-named chain id

- [#21616](https://github.com/LedgerHQ/ledger-live/pull/21616) [`5e971b5`](https://github.com/LedgerHQ/ledger-live/commit/5e971b55429cdcab0f69825ce2056fef24d30215) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Migrate `BIG_NUMBER_DECIMAL_PLACES` off `@ledgerhq/live-env`: every call site now inlines the constant and the definition is removed. `@ledgerhq/live-currency-format` drops its `@ledgerhq/live-env` dependency altogether.

- [#21269](https://github.com/LedgerHQ/ledger-live/pull/21269) [`63002c4`](https://github.com/LedgerHQ/ledger-live/commit/63002c49322f3b3645a9426fb1c3ce4e008a9a3c) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Open the mock server's configuration UI by right-clicking the top bar indicator, on the session Ledger Live is already using. A left click still copies the session token.

- [#21269](https://github.com/LedgerHQ/ledger-live/pull/21269) [`2a39225`](https://github.com/LedgerHQ/ledger-live/commit/2a39225f15f14c0cc0dbb4980f31b0c6937d93ce) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Reset `BASE_SOCKET_URL` when the mock server transport is turned off, so the legacy scriptrunner flows stop pointing at the mock server.

- [#21269](https://github.com/LedgerHQ/ledger-live/pull/21269) [`778076c`](https://github.com/LedgerHQ/ledger-live/commit/778076cfe739d2ba300a18ab6c336975e9d17bcb) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Keep the mock server session token reactive in the top bar indicator, so a token published after the first render can still be copied.

- [#21474](https://github.com/LedgerHQ/ledger-live/pull/21474) [`54351c2`](https://github.com/LedgerHQ/ledger-live/commit/54351c2f7501362c9323fd835e21b2db37d6b4cd) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Group unavailable assets and networks under a "Not available yet" section in the asset and network selection lists

- [#21458](https://github.com/LedgerHQ/ledger-live/pull/21458) [`40ba77b`](https://github.com/LedgerHQ/ledger-live/commit/40ba77b436486180563c5cd7c9a5624dca1c7353) Thanks [@semeano](https://github.com/semeano)! - Fix Zcash private balance sync staying at 0% when started from the UFVK export modal

- [#21283](https://github.com/LedgerHQ/ledger-live/pull/21283) [`761cf3e`](https://github.com/LedgerHQ/ledger-live/commit/761cf3e359fa197d07f6086d8522fd1785ba575d) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - add earn banner to success transation modal

- [#21359](https://github.com/LedgerHQ/ledger-live/pull/21359) [`36ea18d`](https://github.com/LedgerHQ/ledger-live/commit/36ea18d4f36c757bc6901bfc258af2f11b8ee00d) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Route the Noah webview to signup or signin when noahAuth is set (LIVE-35383).

- [#21299](https://github.com/LedgerHQ/ledger-live/pull/21299) [`ac0311e`](https://github.com/LedgerHQ/ledger-live/commit/ac0311e70c2aabb091a0e4d32deaf1cf6e849a5a) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Present the Pay cash-to-stable intro as a desktop dialog before the Noah handoff (LIVE-35383).

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

- [#21426](https://github.com/LedgerHQ/ledger-live/pull/21426) [`3de7317`](https://github.com/LedgerHQ/ledger-live/commit/3de7317d858c570600eb0a4297876327fdc2c7b5) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Replace the Card logout block with a `More` tile-button (`CardMore`). The tile opens the `More` sheet, and the sheet's `Logout` row ends the Card session.

- [#21438](https://github.com/LedgerHQ/ledger-live/pull/21438) [`8dd19d9`](https://github.com/LedgerHQ/ledger-live/commit/8dd19d9f9e936c0e0fbae5636c856ea681ec4197) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Move Pay contact copy resolution into @features/flow-pay-contact via @shared/i18n so hosts no longer pass translated labels.

- [#21397](https://github.com/LedgerHQ/ledger-live/pull/21397) [`2fe4ef6`](https://github.com/LedgerHQ/ledger-live/commit/2fe4ef6fabb69dbbb38f4bf8517e7d52f9b35b43) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Wire Pay contact tile press to send (prefill a single-address contact), add a desktop View contact overflow action, and render Lumen `MenuTrigger` `render` props in the shared web passthrough stub.

- [#21028](https://github.com/LedgerHQ/ledger-live/pull/21028) [`9b15a72`](https://github.com/LedgerHQ/ledger-live/commit/9b15a7228b9eafb6f627b887c9b950899d79501d) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Add the Perps deposit review step on desktop, reached from the deposit form, showing the swap and deposit details before the user confirms. The amount landing on the perps account now comes from a provider quote, since that balance has no counter value of its own.

- [#21028](https://github.com/LedgerHQ/ledger-live/pull/21028) [`bcf6eef`](https://github.com/LedgerHQ/ledger-live/commit/bcf6eef986320df10bed2a1bb3054e701264421f) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Add the Perps deposit signing step on desktop, reached from the review screen. It runs on the same swap orchestration as the `custom.exchange.swap` handler — now extracted into a shared `executeSwap` — behind the perps screens, and executes against the quote the review priced against. Declining a device prompt returns to the review with the entered amount intact, rather than raising an error screen.

- [#21028](https://github.com/LedgerHQ/ledger-live/pull/21028) [`25b482d`](https://github.com/LedgerHQ/ledger-live/commit/25b482d53eeec610cbac836a5872b03300c67edb) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Title the transaction detail dialog for Perps deposits: the dialog is named "Transaction detail" and its header leads with the deposit being funded, keeping the swapped pair on its own line. Swap opens the same dialog unchanged.

- [#21028](https://github.com/LedgerHQ/ledger-live/pull/21028) [`70036b1`](https://github.com/LedgerHQ/ledger-live/commit/70036b121a60b83588904179e5de438e9b7be39e) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Close the Perps deposit flow with a transaction signed screen, from which the user can follow the deposit on the status of the swap that funds it.

- [#21380](https://github.com/LedgerHQ/ledger-live/pull/21380) [`59ea8fb`](https://github.com/LedgerHQ/ledger-live/commit/59ea8fbd36754199f1c68ab53537460ca31c70b4) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(cosmos): remove Ledger validator as the default one for Osmosis

- [#21295](https://github.com/LedgerHQ/ledger-live/pull/21295) [`6980e49`](https://github.com/LedgerHQ/ledger-live/commit/6980e497d520edeb9cda796afa178f1919660c7a) Thanks [@sarneijim](https://github.com/sarneijim)! - Log Segment identify calls (success or failed) in the desktop analytics debug overlay

- [#21028](https://github.com/LedgerHQ/ledger-live/pull/21028) [`93251f5`](https://github.com/LedgerHQ/ledger-live/commit/93251f5594214aa21a1ab17ae4baba52b227ee8f) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Add the perps deposit amount form, so a deposit requested by the live app collects its funding account and amount before the review step

- [#21240](https://github.com/LedgerHQ/ledger-live/pull/21240) [`1cb4dbe`](https://github.com/LedgerHQ/ledger-live/commit/1cb4dbe4a9b0d556768c3ce18d17eb08935e518f) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Persist Solana `stakingResources` through the generic coin framework, and revive accounts still holding the legacy `solanaResources` blob

- [#21194](https://github.com/LedgerHQ/ledger-live/pull/21194) [`2bd6a1c`](https://github.com/LedgerHQ/ledger-live/commit/2bd6a1c4b9d0cd229a8c9207108672b1a580968a) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Refresh Baanx Pay Card sessions after a 401, and keep the credentials out of every reader of redux.

  The two OAuth2 grants are RTK Query endpoints again. Both opt out of the Bearer and out of the
  renewal, both run with `track: false`, so no session becomes a cache entry, and neither has a hook.

  The desktop redux logger and both DevTools configurations now strip every Card action, which also
  closes a live leak: the code exchange logs its code and its code verifier in production, into the
  file users attach to a support ticket.

- [#21430](https://github.com/LedgerHQ/ledger-live/pull/21430) [`5b546c5`](https://github.com/LedgerHQ/ledger-live/commit/5b546c55ca622f74ae06b867c5118e19009f80a5) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Remove unused PrefillAddAddressFlowRoot and the shared prefill listener store. Send now owns the prefilled add-address session via startWithPrefilled.

- [#21493](https://github.com/LedgerHQ/ledger-live/pull/21493) [`475499d`](https://github.com/LedgerHQ/ledger-live/commit/475499d5784fec1e0034a60f5d969227228a5162) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Extract Pay card persistence from the desktop db middleware into a dedicated helper

- [#21478](https://github.com/LedgerHQ/ledger-live/pull/21478) [`f83a8e2`](https://github.com/LedgerHQ/ledger-live/commit/f83a8e2e8730163591b35c14e55fec208cc8866f) Thanks [@semeano](https://github.com/semeano)! - Update memo tooltip

- [#21650](https://github.com/LedgerHQ/ledger-live/pull/21650) [`349c522`](https://github.com/LedgerHQ/ledger-live/commit/349c522bb86bba744844d80d8521c6d24974d26a) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Add an error message for `UnexpectedGetBalanceError`

  `@ledgerhq/coin-tezos` reports this error when a token balance cannot be retrieved, so Send Max
  no longer claims the account has insufficient funds during an indexer outage. Without a
  translation the send flow fell back to rendering the raw error name.

- [#21392](https://github.com/LedgerHQ/ledger-live/pull/21392) [`2df85eb`](https://github.com/LedgerHQ/ledger-live/commit/2df85ebe83b802749be7f8698008d118fbede53f) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(send): add skip memo screen in the send flow

- [#21411](https://github.com/LedgerHQ/ledger-live/pull/21411) [`f670d92`](https://github.com/LedgerHQ/ledger-live/commit/f670d92b8ac8ac3f94e98406d6677889d43f0dd7) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix theme reverting to dark when navigating from My Ledger to Contacts

- [#21326](https://github.com/LedgerHQ/ledger-live/pull/21326) [`9fb98ab`](https://github.com/LedgerHQ/ledger-live/commit/9fb98ab74e3ca680e686a302b9beaa460a087783) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Drive the XRP app through the Device Management Kit behind the `ldmkXrpSigner` feature flag, keeping `hw-app-xrp` as the fallback

- [#21465](https://github.com/LedgerHQ/ledger-live/pull/21465) [`9683837`](https://github.com/LedgerHQ/ledger-live/commit/9683837e853c8f3784a94d9fc66b9bd57cc4a526) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(tracking): add tracking contact send flow lwd

### Patch Changes

- Updated dependencies [[`7c6a8de`](https://github.com/LedgerHQ/ledger-live/commit/7c6a8de98093e274de57e9ee94c6179541e2120c), [`d01e4c0`](https://github.com/LedgerHQ/ledger-live/commit/d01e4c02a513082f6484c405f9a51977f14a6c03), [`8f8f1a4`](https://github.com/LedgerHQ/ledger-live/commit/8f8f1a472b5c6142d3ddf682fbc5d991c720aa92), [`fc74af8`](https://github.com/LedgerHQ/ledger-live/commit/fc74af8db6038afd89c64de356e67fe9ba4811a0), [`81aa729`](https://github.com/LedgerHQ/ledger-live/commit/81aa7294c94ef114e6e82ec4c277f0a6c0038c92), [`3d23fd4`](https://github.com/LedgerHQ/ledger-live/commit/3d23fd471fbb0ba76a0e6997eba995e190a89f7c), [`b7f83a1`](https://github.com/LedgerHQ/ledger-live/commit/b7f83a1c1818e4eff9ffbf19796a71d7242fd5b4), [`c270975`](https://github.com/LedgerHQ/ledger-live/commit/c2709750e007b758fa13f0f717efa897fcc6235d), [`e1e7cb2`](https://github.com/LedgerHQ/ledger-live/commit/e1e7cb2fa32ef3b413f8e598687f05780ad1c0e8), [`d182d46`](https://github.com/LedgerHQ/ledger-live/commit/d182d466275f4c35ec3bf86cadf544de77c27058), [`5b79eb3`](https://github.com/LedgerHQ/ledger-live/commit/5b79eb3c5b1e2e7aca86fb0a8c4b7af085e57f9d), [`c06bd2e`](https://github.com/LedgerHQ/ledger-live/commit/c06bd2ee99e9d76609d628a41698a16c37a0c0c7), [`eea933c`](https://github.com/LedgerHQ/ledger-live/commit/eea933c21039eab89442a4caae6cf0e121f68cca), [`3b0dbae`](https://github.com/LedgerHQ/ledger-live/commit/3b0dbae4ae5df48bd4eb58146675747d7e3593c2), [`dd134e9`](https://github.com/LedgerHQ/ledger-live/commit/dd134e9c126773d47cd8dfb6aaf677534f2e7b23), [`5c23a76`](https://github.com/LedgerHQ/ledger-live/commit/5c23a7694a8304727c13d7383979d6a0660b1596), [`96661b4`](https://github.com/LedgerHQ/ledger-live/commit/96661b459f66f511de75c62b87b3bcd2519a1814), [`47a1cd0`](https://github.com/LedgerHQ/ledger-live/commit/47a1cd082cc30cd7cc539a8eb0e0fe5466128533), [`8c40cc1`](https://github.com/LedgerHQ/ledger-live/commit/8c40cc1c2054d12fc546e341a18e966d6ab23986), [`0089a4b`](https://github.com/LedgerHQ/ledger-live/commit/0089a4b80512c2c8f8eb3a03b9e3245492380647), [`e601584`](https://github.com/LedgerHQ/ledger-live/commit/e6015847b44e86dd9c4733559d591874099e1f4e), [`000eac0`](https://github.com/LedgerHQ/ledger-live/commit/000eac03eacf0093f241f8a05d9f525bbcf5de13), [`60ee73c`](https://github.com/LedgerHQ/ledger-live/commit/60ee73c7b89b101dde708a04ded260341ef86d44), [`ef29f07`](https://github.com/LedgerHQ/ledger-live/commit/ef29f0711ecec104e4dd9c9d86d4e4d41c4ddee3), [`55bd216`](https://github.com/LedgerHQ/ledger-live/commit/55bd2166238ab3e03c33226bb5f5eb2e8646a818), [`6ed1820`](https://github.com/LedgerHQ/ledger-live/commit/6ed1820776ca6ba59e861da11e4582af406b2188), [`6b47659`](https://github.com/LedgerHQ/ledger-live/commit/6b4765929e98abbcb08cd5348fddb528a9e674e7), [`b1b1e38`](https://github.com/LedgerHQ/ledger-live/commit/b1b1e38d2a8311f935f30c185276c165a6992dbc), [`86fdaa1`](https://github.com/LedgerHQ/ledger-live/commit/86fdaa1929eeaf42d6d3765ce206758f0422c631), [`51a3d3e`](https://github.com/LedgerHQ/ledger-live/commit/51a3d3ef013a9310ed943a17a33ba69ea8d79a6d), [`3a78322`](https://github.com/LedgerHQ/ledger-live/commit/3a783224b6016fce08fa8cb3254057b75882e2c5), [`2b8a4e4`](https://github.com/LedgerHQ/ledger-live/commit/2b8a4e4240a414cbb1bda31b97b70837cb6ac3fe), [`92b90a6`](https://github.com/LedgerHQ/ledger-live/commit/92b90a6eebca959abe0b04aa83c5799d34f9f10a), [`23d2e1e`](https://github.com/LedgerHQ/ledger-live/commit/23d2e1e0a0a83516fb9f5c12f54a2afc15208702), [`9672658`](https://github.com/LedgerHQ/ledger-live/commit/967265820c38ad0b2f8f45fd0a892ca07c58d23a), [`a55d4ca`](https://github.com/LedgerHQ/ledger-live/commit/a55d4ca3a804f6ab27f039926255f2c410ef7221), [`147a290`](https://github.com/LedgerHQ/ledger-live/commit/147a2905d735eee5682d849b3e2c2cde5178f7bb), [`6ccfc64`](https://github.com/LedgerHQ/ledger-live/commit/6ccfc644e6b5c00e2e0bafb10e8519a09d7fb589), [`8c83fe6`](https://github.com/LedgerHQ/ledger-live/commit/8c83fe6b93cf1806b551f05b946cb9ad2b7e3531), [`8f8d63e`](https://github.com/LedgerHQ/ledger-live/commit/8f8d63ecfeba6a4be8edca7655abf713fc328060), [`b290a1e`](https://github.com/LedgerHQ/ledger-live/commit/b290a1eb54cace8cfa1f6e5fcd2786cda320a9ec), [`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d), [`2d42e64`](https://github.com/LedgerHQ/ledger-live/commit/2d42e647d55f79cf2eb821ec30a232cc07891219), [`b7d0367`](https://github.com/LedgerHQ/ledger-live/commit/b7d03671db1aa022d3ff375465c7d8470bf2b215), [`8c98d3b`](https://github.com/LedgerHQ/ledger-live/commit/8c98d3b1e849a4684bd21861ae56faadf1dc3a28), [`e42c12a`](https://github.com/LedgerHQ/ledger-live/commit/e42c12a392ba60ee839c9a71f4f0d409ad9430fa), [`73f68cd`](https://github.com/LedgerHQ/ledger-live/commit/73f68cd228569c9d68ab22108aa5ead99adc6706), [`eb62268`](https://github.com/LedgerHQ/ledger-live/commit/eb622688cb7561882cd02b52c2eed569d5dc68f3), [`70b93a0`](https://github.com/LedgerHQ/ledger-live/commit/70b93a037c9217a1f64e66c13085d43c1d4fde2e), [`bed4fe7`](https://github.com/LedgerHQ/ledger-live/commit/bed4fe75210412872bd6c83189ab502b0e1cab24), [`a9e389f`](https://github.com/LedgerHQ/ledger-live/commit/a9e389fc59ca30abf53d0ba8decc6290752ba1db), [`e92cf97`](https://github.com/LedgerHQ/ledger-live/commit/e92cf9742f7d910dea79ca848494b3870b2ae254), [`5f6b8a8`](https://github.com/LedgerHQ/ledger-live/commit/5f6b8a88709d1fd4a94fccaaab915d5ad322c584), [`9dd7db0`](https://github.com/LedgerHQ/ledger-live/commit/9dd7db0d81362a5d019cd0830bdd336a1f42e7af), [`5b7d11d`](https://github.com/LedgerHQ/ledger-live/commit/5b7d11dd9a988f0034b4b5b6168f02429ba5a406), [`ebb1371`](https://github.com/LedgerHQ/ledger-live/commit/ebb13714a6de9c39f290b2ccd51ca78370824f6f), [`3e14841`](https://github.com/LedgerHQ/ledger-live/commit/3e14841c47bf578e6a8c9aabda22a8b59facb83f), [`1e883b3`](https://github.com/LedgerHQ/ledger-live/commit/1e883b36260cb3d78c34251de87a2da1ec353d9f), [`7aca4c8`](https://github.com/LedgerHQ/ledger-live/commit/7aca4c8a806ab270cd990d63b1c651e443b7e149), [`6561cf0`](https://github.com/LedgerHQ/ledger-live/commit/6561cf003713ab65533bb9476771c0de9b19e634), [`53dcdc9`](https://github.com/LedgerHQ/ledger-live/commit/53dcdc9bbef2324b48fac7469c2c1d0e66f7361f), [`2744267`](https://github.com/LedgerHQ/ledger-live/commit/2744267da72f342ca2dc67d95f34d512d7f4c7f6), [`b864c2c`](https://github.com/LedgerHQ/ledger-live/commit/b864c2ced455b2e55d55b8c3e423d2f12d41cd7c), [`5e971b5`](https://github.com/LedgerHQ/ledger-live/commit/5e971b55429cdcab0f69825ce2056fef24d30215), [`b7a8906`](https://github.com/LedgerHQ/ledger-live/commit/b7a89064587bbcd1f758f7b6205a616225ac2317), [`5db7a7d`](https://github.com/LedgerHQ/ledger-live/commit/5db7a7dc517bb23d12532ae07cc947eddff6c10e), [`2c70999`](https://github.com/LedgerHQ/ledger-live/commit/2c709990d3569bc50504822ce90c9e9024210312), [`918e931`](https://github.com/LedgerHQ/ledger-live/commit/918e9318379ec8ed73dfaca58a7dd8ff06dd897b), [`54351c2`](https://github.com/LedgerHQ/ledger-live/commit/54351c2f7501362c9323fd835e21b2db37d6b4cd), [`761cf3e`](https://github.com/LedgerHQ/ledger-live/commit/761cf3e359fa197d07f6086d8522fd1785ba575d), [`36ea18d`](https://github.com/LedgerHQ/ledger-live/commit/36ea18d4f36c757bc6901bfc258af2f11b8ee00d), [`ebeb266`](https://github.com/LedgerHQ/ledger-live/commit/ebeb266bb8091b86a4393497677088b1aa51dee5), [`ac0311e`](https://github.com/LedgerHQ/ledger-live/commit/ac0311e70c2aabb091a0e4d32deaf1cf6e849a5a), [`91bae2a`](https://github.com/LedgerHQ/ledger-live/commit/91bae2a0cf5af0f407b4d797b023d07e4ba95fbf), [`08ee05c`](https://github.com/LedgerHQ/ledger-live/commit/08ee05cfb66f393b14fdf1377ed6c54c4831a87c), [`d6b290b`](https://github.com/LedgerHQ/ledger-live/commit/d6b290b37b8ad6f677ab382bef53bf05cd394ca2), [`0a02a32`](https://github.com/LedgerHQ/ledger-live/commit/0a02a325f99033c086864b0778a8f81c3b4178ae), [`66c7569`](https://github.com/LedgerHQ/ledger-live/commit/66c7569dcfae90739b369ffb3a92cee75dd2e9cd), [`543b17d`](https://github.com/LedgerHQ/ledger-live/commit/543b17d7a6b49728001c0311c184c665e8c9bbb2), [`a7d54c0`](https://github.com/LedgerHQ/ledger-live/commit/a7d54c0d6af65abe7aa2170053b3fd07ae9b05ab), [`c3de11c`](https://github.com/LedgerHQ/ledger-live/commit/c3de11cdf58c4feac701435548bbb96819ae09f6), [`3de7317`](https://github.com/LedgerHQ/ledger-live/commit/3de7317d858c570600eb0a4297876327fdc2c7b5), [`d60ce38`](https://github.com/LedgerHQ/ledger-live/commit/d60ce38581fe06b7f4fa72ba40259af2eabfe11f), [`7aa3071`](https://github.com/LedgerHQ/ledger-live/commit/7aa3071a532c98804a4357ff36a001b23351da73), [`faa8ef1`](https://github.com/LedgerHQ/ledger-live/commit/faa8ef11055a27af3eb7bcf1b662e8bf5c3da77d), [`8dd19d9`](https://github.com/LedgerHQ/ledger-live/commit/8dd19d9f9e936c0e0fbae5636c856ea681ec4197), [`2fe4ef6`](https://github.com/LedgerHQ/ledger-live/commit/2fe4ef6fabb69dbbb38f4bf8517e7d52f9b35b43), [`9b15a72`](https://github.com/LedgerHQ/ledger-live/commit/9b15a7228b9eafb6f627b887c9b950899d79501d), [`bcf6eef`](https://github.com/LedgerHQ/ledger-live/commit/bcf6eef986320df10bed2a1bb3054e701264421f), [`80b27a1`](https://github.com/LedgerHQ/ledger-live/commit/80b27a1349db33bbd7ba3b96aef5260853916bd2), [`59ea8fb`](https://github.com/LedgerHQ/ledger-live/commit/59ea8fbd36754199f1c68ab53537460ca31c70b4), [`a6193dc`](https://github.com/LedgerHQ/ledger-live/commit/a6193dcf861890977c3f36dc8b1618c4403dae75), [`30619aa`](https://github.com/LedgerHQ/ledger-live/commit/30619aaa2af784fd917214bb0e4bbd092f883e11), [`93251f5`](https://github.com/LedgerHQ/ledger-live/commit/93251f5594214aa21a1ab17ae4baba52b227ee8f), [`08ae9c2`](https://github.com/LedgerHQ/ledger-live/commit/08ae9c2bf7b2b509fa23d9b4bf33360f18f7f39f), [`1cb4dbe`](https://github.com/LedgerHQ/ledger-live/commit/1cb4dbe4a9b0d556768c3ce18d17eb08935e518f), [`2bd6a1c`](https://github.com/LedgerHQ/ledger-live/commit/2bd6a1c4b9d0cd229a8c9207108672b1a580968a), [`d54d191`](https://github.com/LedgerHQ/ledger-live/commit/d54d19127a958bb0ac8c9c479bba716ce67041ff), [`dcdec92`](https://github.com/LedgerHQ/ledger-live/commit/dcdec92fec41cf5bef0d3f54566e4649b851607f), [`5b546c5`](https://github.com/LedgerHQ/ledger-live/commit/5b546c55ca622f74ae06b867c5118e19009f80a5), [`54124e4`](https://github.com/LedgerHQ/ledger-live/commit/54124e435c7adc3a2c3a9ed6cd1865fc68fa2584), [`db09cfc`](https://github.com/LedgerHQ/ledger-live/commit/db09cfc0a41f71af1dd2f452d7d5ad7865f4ffe7), [`a19ffef`](https://github.com/LedgerHQ/ledger-live/commit/a19ffeff9dd4e173890d75d8634a33e53cc5a5d0), [`1cf5583`](https://github.com/LedgerHQ/ledger-live/commit/1cf55832f785fc57881169092f1190fa7ddfecf9), [`b683a6d`](https://github.com/LedgerHQ/ledger-live/commit/b683a6dc7709dd9b669288e7178414334790ba9e), [`3da476c`](https://github.com/LedgerHQ/ledger-live/commit/3da476c2d4c435c62aa3fe11a0290f56d7283cbe), [`0152cad`](https://github.com/LedgerHQ/ledger-live/commit/0152cade87e061bb2b56fd71f8a404c3dfed21e0), [`1c58fb1`](https://github.com/LedgerHQ/ledger-live/commit/1c58fb15f0b3421d6cf82b53db66f39a21fb7bc0), [`6f39b04`](https://github.com/LedgerHQ/ledger-live/commit/6f39b0411286ed5c82362c9ffafb953abe8b53b7), [`2df85eb`](https://github.com/LedgerHQ/ledger-live/commit/2df85ebe83b802749be7f8698008d118fbede53f), [`9fb98ab`](https://github.com/LedgerHQ/ledger-live/commit/9fb98ab74e3ca680e686a302b9beaa460a087783), [`3a3d2fa`](https://github.com/LedgerHQ/ledger-live/commit/3a3d2fa06b8dbdcc6ad964bb737898a6e35c934d), [`018ee9b`](https://github.com/LedgerHQ/ledger-live/commit/018ee9bdcb993a1b4a203d5664676f7e757b3785), [`6656f90`](https://github.com/LedgerHQ/ledger-live/commit/6656f90769c3419e1f121c0c2368eab4566e48ba)]:
  - @ledgerhq/transaction-observability@0.3.0-next.0
  - @ledgerhq/live-common@37.6.0-next.0
  - @features/flow-pay-card-details@0.3.0-next.0
  - @features/flow-pay-contact@0.3.0-next.0
  - @ledgerhq/coin-zcash@0.7.0-next.0
  - @devtools/bindings@0.7.0-next.0
  - @features/flow-pay-request@0.4.0-next.0
  - @features/flow-contacts-introduction@1.1.0-next.0
  - @features/flow-contacts@0.10.0-next.0
  - @features/platform-contacts@0.6.0-next.0
  - @features/flow-contacts-add-address@0.4.0-next.0
  - @features/flow-contacts-edit-address@0.3.0-next.0
  - @ledgerhq/coin-concordium@1.2.0-next.0
  - @features/flow-contacts-edit-contact@0.4.0-next.0
  - @features/flow-contacts-list@0.6.0-next.0
  - @shared/env@0.6.0-next.0
  - @shared/api-services@0.7.0-next.0
  - @domain/api-card-management@0.5.0-next.0
  - @features/flow-pay-card@0.3.0-next.0
  - @features/flow-pay-card-widget@0.2.0-next.0
  - @ledgerhq/coin-cosmos@1.2.0-next.0
  - @ledgerhq/live-dmk-desktop@0.21.0-next.0
  - @domain/entity-currency-crypto@0.12.0-next.0
  - @ledgerhq/types-live@6.123.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.3.0-next.0
  - @domain/api-aggregated-assets@0.5.0-next.0
  - @ledgerhq/react-ui@0.54.0-next.0
  - @ledgerhq/live-countervalues@0.25.0-next.0
  - @ledgerhq/live-countervalues-react@0.17.0-next.0
  - @ledgerhq/coin-casper@3.3.0-next.0
  - @shared/feature-flags@0.22.0-next.0
  - @features/platform-currencies@0.8.0-next.0
  - @ledgerhq/wallet-analytics@0.4.0-next.0
  - @ledgerhq/asset-aggregation@0.15.0-next.0
  - @ledgerhq/live-currency-format@0.15.0-next.0
  - @features/platform-env@0.3.0-next.0
  - @ledgerhq/hw-ledger-key-ring-protocol@0.12.0-next.0
  - @features/flow-pay-bank-transfer@0.3.0-next.0
  - @features/flow-pay-card-auth@0.6.0-next.0
  - @features/platform-card@0.4.0-next.0
  - @features/flow-pay-feature-tour@0.5.0-next.0
  - @ledgerhq/wallet-btc@0.4.0-next.0
  - @ledgerhq/coin-bitcoin@0.52.0-next.0
  - @ledgerhq/asset-detail@0.11.4-next.0
  - @features/flow-contacts-add-contact@0.5.1-next.0
  - @features/flow-contacts-delete-contact@0.2.1-next.0
  - @features/flow-pay-balance@0.4.1-next.0
  - @features/flow-pay-deposit@0.3.1-next.0
  - @features/platform-device-action-content@0.2.0
  - @features/platform-aggregated-assets@0.5.2-next.0
  - @ledgerhq/ledger-key-ring-protocol@0.21.2-next.0
  - @ledgerhq/live-dmk-speculos@0.10.8-next.0
  - @ledgerhq/wallet-pnl@0.7.10-next.0
  - @domain/api-altcoins-sentiment@0.3.5-next.0
  - @domain/api-currency-fiat@0.4.4-next.0
  - @domain/api-currency-token@0.6.1-next.0
  - @domain/api-market-sentiment@0.3.5-next.0
  - @domain/api-push-devices@0.2.5-next.0
  - @domain/entity-contact@0.8.2-next.0
  - @domain/entity-currency@0.4.3-next.0
  - @domain/entity-currency-token@0.5.2-next.0
  - @ledgerhq/coin-cardano@1.1.1-next.0
  - @ledgerhq/live-wallet@1.1.2-next.0
  - @ledgerhq/coin-canton@1.1.1-next.0
  - @ledgerhq/coin-filecoin@2.1.1-next.0
  - @ledgerhq/domain-service@1.8.18-next.0
  - @ledgerhq/live-signer-evm@0.23.1-next.0
  - @features/flow-large-screen-upsell@2.0.2-next.0
  - @features/platform-feature-flags@0.6.9-next.0
  - @shared/ui-info-state@0.2.1-next.0
  - @shared/auth@0.6.0
  - @shared/cloud-sync@0.3.0
  - @shared/i18n@0.2.0
  - @devtools/shell@0.9.2-next.0
  - @features/flow-analytics-consent@0.2.5-next.0

## 4.19.0

### Minor Changes

- [#20818](https://github.com/LedgerHQ/ledger-live/pull/20818) [`f9be984`](https://github.com/LedgerHQ/ledger-live/commit/f9be984dd27742c065981d4cebf25ba3e564f48a) Thanks [@beths-ledger](https://github.com/beths-ledger)! - Emit `earn_transaction_completed` / `earn_transaction_failed` for native staking, from the account-bridge seam.

  Every transaction route resolves its bridge through `getAccountBridge`, so `wrapAccountBridge` — which already hosts the sanctioned-address check — is the one place that sees them all. It now decorates `signOperation` (emitting a classified failure, then re-raising the original error untouched) and `broadcast` (success or classified failure). The device-action layer adds the one signal the bridge cannot see: closing the sign prompt is an unsubscribe rather than an error, so abandonment is reported from there.

  This replaces UI-inferred bottom-of-funnel tracking for staking, where a user reaching the final screen was counted as converted whether or not a transaction ever landed. No _analytics_ event is produced for non-staking transactions. The seam observes every sign and broadcast outcome, and the Segment mapping is what drops the ones with no derived staking action — so plain sends and swaps reach no analytics sink, and no currency allowlist is needed.

  Desktop and mobile each register a Segment observer at startup; `track` already self-gates on analytics consent. Desktop also registers a dev-only console observer so the whole seam can be watched locally across every staking route and coin. The existing Datadog `useBroadcast` path is untouched.

- [#21045](https://github.com/LedgerHQ/ledger-live/pull/21045) [`4342943`](https://github.com/LedgerHQ/ledger-live/commit/43429435e5411592f61099f1d40712f055578b0c) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Fix missing memo in Zcash shielded operation details. After a shielded send with a memo, the memo is now persisted in the operation extra and displayed in Transaction details.

- [#21243](https://github.com/LedgerHQ/ledger-live/pull/21243) [`2e92399`](https://github.com/LedgerHQ/ledger-live/commit/2e92399407ac7416efbf94681b4336fc21dba1e1) Thanks [@henri-ly](https://github.com/henri-ly)! - Show the Contacts feature introduction in the new Send flow recipient step, for currency families eligible to the address book when the contacts feature flag is on and the user has not dismissed it yet.

- [#21337](https://github.com/LedgerHQ/ledger-live/pull/21337) [`8c98500`](https://github.com/LedgerHQ/ledger-live/commit/8c98500f7d95594eafc554dce31ca755b2479e08) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Anonymize account ids in Desktop routes: `/account/...` paths now carry a non-reversible alias instead of the account id, which embeds an xpub or an address

- [#21162](https://github.com/LedgerHQ/ledger-live/pull/21162) [`dff2a65`](https://github.com/LedgerHQ/ledger-live/commit/dff2a65a976c700dab29bba518cd6f5c4b271adf) Thanks [@sarneijim](https://github.com/sarneijim)! - Add missing Touchscreen Upgrade Program tracking for Backup Hub Recovery Key upsell and Lazy Onboarding Banner (LIVE-36494)

- [#21098](https://github.com/LedgerHQ/ledger-live/pull/21098) [`0f71eeb`](https://github.com/LedgerHQ/ledger-live/commit/0f71eeba4057b32f440b53454075d89514755974) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Upgrade rsbuild to 2.1.13, rspack to 2.1.10, and rslib to 0.23.2

- [#21348](https://github.com/LedgerHQ/ledger-live/pull/21348) [`46f41d2`](https://github.com/LedgerHQ/ledger-live/commit/46f41d2787191684f52e5dc85b0cd629901b13d8) Thanks [@deepyjr](https://github.com/deepyjr)! - Update the Contacts feature introduction image and English copy, and remove its description field from the shared contract.

- [#21346](https://github.com/LedgerHQ/ledger-live/pull/21346) [`23099d3`](https://github.com/LedgerHQ/ledger-live/commit/23099d3b19505782c32b7af85283e4ab4bf51a44) Thanks [@deepyjr](https://github.com/deepyjr)! - Select newly created contacts in the Contacts detail pane.

- [#21244](https://github.com/LedgerHQ/ledger-live/pull/21244) [`f4986f8`](https://github.com/LedgerHQ/ledger-live/commit/f4986f882385e07dbd531d99a0571c67ca91ada0) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Show a host-provided Crypto card title on the Pay Card web and native views

- [#21336](https://github.com/LedgerHQ/ledger-live/pull/21336) [`75f6af6`](https://github.com/LedgerHQ/ledger-live/commit/75f6af6a371e1c8e4aa447218cfbf0647203b860) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Filter desktop History by contact addresses via `?contactId=`.

- [#21113](https://github.com/LedgerHQ/ledger-live/pull/21113) [`a6e4ace`](https://github.com/LedgerHQ/ledger-live/commit/a6e4ace0712d14b9a0465c123ce88bcb04918ca6) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(send): add a contact from an address in the send flow

- [#21289](https://github.com/LedgerHQ/ledger-live/pull/21289) [`3b80e94`](https://github.com/LedgerHQ/ledger-live/commit/3b80e948ab54191faaf5312f60bb6abafd4b94a9) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add a "Load contacts from send history" generator to the desktop Contacts devtool

- [#21363](https://github.com/LedgerHQ/ledger-live/pull/21363) [`ce47443`](https://github.com/LedgerHQ/ledger-live/commit/ce47443e97f559210443547a7948ef61c01f7feb) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Read CARD_API_URL and CARD_BAANX_CLIENT_KEY on every use, and not one time at boot. The debug settings can now change the Card tenant without a restart. The mobile app also applies its `.env` values before the store reads them.

- [#20117](https://github.com/LedgerHQ/ledger-live/pull/20117) [`6780db0`](https://github.com/LedgerHQ/ledger-live/commit/6780db014288dd297ed2d6b9e2133a5d91debc8a) Thanks [@shazzzam](https://github.com/shazzzam)! - Celo: show a clear "temporarily unavailable" message when voting is blocked during on-chain epoch processing, instead of a generic "RPC request failed" error

- [#21220](https://github.com/LedgerHQ/ledger-live/pull/21220) [`bb44e2c`](https://github.com/LedgerHQ/ledger-live/commit/bb44e2c4f8ce29b88394b15a17f7c698cb647e74) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Move the Contacts device intent renderers into the apps.

  `@features/platform-contacts/device/intents` now exports component-less
  `IntentDefinition`s. Each app owns its renderers under
  `src/mvvm/features/Contacts/deviceIntents/`, composes them into
  `IntentPlatformDefinition`s and injects them into `useContactsIntentsOrchestrator`,
  which no longer imports a production intent implementation.

  A `features/` package cannot resolve translations today, so a renderer that shows
  translated copy has to live in the app.

- [#21128](https://github.com/LedgerHQ/ledger-live/pull/21128) [`31223eb`](https://github.com/LedgerHQ/ledger-live/commit/31223ebdd9335ef14a3ae8712658d17de60924e5) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Orchestrate Contacts device confirmations through the Device Intent Executor.

- [#21236](https://github.com/LedgerHQ/ledger-live/pull/21236) [`c62986b`](https://github.com/LedgerHQ/ledger-live/commit/c62986b76467651009a571d64908405988b13571) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Register an external address on the device from Contacts. The device intent now calls `@ledgerhq/device-contacts-kit`'s `ContactsManager.registerExternalAddress()`, each failure gets its own JobState (app version too low, invalid input, device rejected, existing-group verification failed, unsupported operation, device error), and both apps render the confirmation step and one `InfoState` per failure. A rejection keeps the job open so the user can retry on the same device.

- [#21185](https://github.com/LedgerHQ/ledger-live/pull/21185) [`cef29a0`](https://github.com/LedgerHQ/ledger-live/commit/cef29a0cd39ee1a7cfb6428ae650595b4479e4d6) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Add shared Contacts kit wiring: version-requirement wrappers over `@ledgerhq/device-contacts-kit`, composed with each app's app-global floor into the Contacts device intents' minimum app-version floor.

- [#21225](https://github.com/LedgerHQ/ledger-live/pull/21225) [`2c65f71`](https://github.com/LedgerHQ/ledger-live/commit/2c65f7177e9e9f1207258772b1b5e0cc8c486d2e) Thanks [@sarneijim](https://github.com/sarneijim)! - Add inline QA device simulation dev tool in Developer settings (LIVE-33171)

- [#21222](https://github.com/LedgerHQ/ledger-live/pull/21222) [`fcdac1c`](https://github.com/LedgerHQ/ledger-live/commit/fcdac1c74265b2fd9e862a18044032f7b5191a54) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Wire Env, Trustchain and Cloud Sync devtools into LLD and web-tools; wire Env devtool into LLM.

- [#21282](https://github.com/LedgerHQ/ledger-live/pull/21282) [`0c29157`](https://github.com/LedgerHQ/ledger-live/commit/0c291571d1e3faa2f8b03d97d237becdf2eff00d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Stop `logger.critical` from reporting non-Error values to Datadog, where they collapsed into unsearchable `"null"` and `"[object Object]"` issues merged across unrelated callers. Such values are still kept in the local logs.

- [#21089](https://github.com/LedgerHQ/ledger-live/pull/21089) [`803c2db`](https://github.com/LedgerHQ/ledger-live/commit/803c2db07a0cf9fcdf29a494205b88745258aab8) Thanks [@Valentin-Ledger](https://github.com/Valentin-Ledger)! - Add earn/simulate deeplink to open the rewards simulator

- [#21338](https://github.com/LedgerHQ/ledger-live/pull/21338) [`114420e`](https://github.com/LedgerHQ/ledger-live/commit/114420ed119ae6c93969891acf97d61c2af42df4) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add View transactions from Pay contacts to History filtered by contact.

- [#21347](https://github.com/LedgerHQ/ledger-live/pull/21347) [`b3a86f5`](https://github.com/LedgerHQ/ledger-live/commit/b3a86f5ae5ab80d6f09fa4e5f6738e3eacc696c8) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Move Pay balance/action-tile copy resolution into @features/flow-pay-balance via @shared/i18n so hosts no longer pass translated labels.

- [#21365](https://github.com/LedgerHQ/ledger-live/pull/21365) [`77fe9eb`](https://github.com/LedgerHQ/ledger-live/commit/77fe9eb5c1b4214132178b4323e2a81997ceab4a) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Gate History contact features (contactId scoping and From/To contact name resolution) behind the lwdPayTab feature flag

- [#21314](https://github.com/LedgerHQ/ledger-live/pull/21314) [`2cd8167`](https://github.com/LedgerHQ/ledger-live/commit/2cd81671ae34ad83557fa814785ae5a0551e91b9) Thanks [@deepyjr](https://github.com/deepyjr)! - Add explanations for unsupported assets and networks in the modular dialog

- [#21032](https://github.com/LedgerHQ/ledger-live/pull/21032) [`f9f6b71`](https://github.com/LedgerHQ/ledger-live/commit/f9f6b71d91c051b8e611a44f5b564cf5062cedb8) Thanks [@pawell24](https://github.com/pawell24)! - Default the Zcash shielded-balance birthday to Ironwood (NU6.3) mainnet activation
  instead of Orchard/NU5 activation, and reject a birthday dated in the future.

- [#21190](https://github.com/LedgerHQ/ledger-live/pull/21190) [`aafcdb7`](https://github.com/LedgerHQ/ledger-live/commit/aafcdb70e59584d6580f080cfd167cce41e56c19) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Preserve transferId through the generic adapter for Casper

- [#21142](https://github.com/LedgerHQ/ledger-live/pull/21142) [`11a1e34`](https://github.com/LedgerHQ/ledger-live/commit/11a1e34660116e53b0cfa5f66d2aa22c81dd9c25) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(send): add address to an existing account in the send

- [#21532](https://github.com/LedgerHQ/ledger-live/pull/21532) [`173be30`](https://github.com/LedgerHQ/ledger-live/commit/173be30135caf7ffdb26432dac0a6c4f5701e932) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-solana): support v1 transactions

- [#21394](https://github.com/LedgerHQ/ledger-live/pull/21394) [`6046b34`](https://github.com/LedgerHQ/ledger-live/commit/6046b34802da0365fd027b83e48627afd64845ab) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix MarketBanner/Market list navigation so clicking Arbitrum opens the ARB asset detail instead of the Ethereum one, by passing the market ledger ids in the navigation state and preventing a bare market id from colliding with a same-named chain id

- [#21209](https://github.com/LedgerHQ/ledger-live/pull/21209) [`a334296`](https://github.com/LedgerHQ/ledger-live/commit/a334296eaeca54451650fc3a3d1c36d5c8b93b8d) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Wire the Pay contacts empty state to the shared Add contact dialog, Ledger Sync gate, and a host-injected `createContactCreationPort`.

- [#21208](https://github.com/LedgerHQ/ledger-live/pull/21208) [`1b789dc`](https://github.com/LedgerHQ/ledger-live/commit/1b789dc76939a2791e34fefb512652bac71ae4df) Thanks [@amaslakov](https://github.com/amaslakov)! - Celo: add USAT (Tether America USD) to the fee currencies that can be selected to pay gas

- [#21126](https://github.com/LedgerHQ/ledger-live/pull/21126) [`6c97b3f`](https://github.com/LedgerHQ/ledger-live/commit/6c97b3fa795a3cda7c895b2e30f6454b21a4cd44) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Stack the LNS upsell banner above the hardware carousel instead of squeezing it into a tile slot, share a carousel with action cards only on mobile, and stop the Content Cards QA console from collapsing every Top wallet preset into the "alwayson" category

- [#21107](https://github.com/LedgerHQ/ledger-live/pull/21107) [`244ff43`](https://github.com/LedgerHQ/ledger-live/commit/244ff43f227436e5d56161e483dee2c676a96ca8) Thanks [@sarneijim](https://github.com/sarneijim)! - Add missing tracking for touchscreen upsell placements on desktop (LIVE-36428)

- [#21216](https://github.com/LedgerHQ/ledger-live/pull/21216) [`70ae1c8`](https://github.com/LedgerHQ/ledger-live/commit/70ae1c8c73b1001046ea14b73d6898df24dc418b) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Show the Card page background on the Pay page

- [#21175](https://github.com/LedgerHQ/ledger-live/pull/21175) [`911a996`](https://github.com/LedgerHQ/ledger-live/commit/911a996f2a6d999d194cadd4f842235cddbe1361) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Show Pay action tiles in every hero state (LIVE-36422).

- [#21099](https://github.com/LedgerHQ/ledger-live/pull/21099) [`c8614bf`](https://github.com/LedgerHQ/ledger-live/commit/c8614bfbfd1dc8de12731c2c333b9d137f0f2f93) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add `@features/flow-pay-card`, a Contacts-style orchestrator that aggregates the Pay Card leaf flows behind a single `Card` entry point. It follows the app MVVM split — a `Card` container wires a shared `useCardViewModel` to the platform `CardView` — and composes the card face from `@features/flow-pay-card-details` (`CardVisual` with the balance overlay, or the bare `CardArtwork`) with the authentication controls (`CardLogin` / `CardLogout` from `@features/flow-pay-card-auth`), each of which still decides on its own whether it belongs on screen.

  The flow owns the (currently mocked) card balance and assembles the overlay itself, so hosts no longer pass a pre-built visual: they hand over only what they alone know — `formatCountervalue` (needs the app's locale and counter-value currency) and `balanceLabel` (i18n). Both apps now mount `Card` instead of wiring `CardLogin` / `CardLogout` directly: desktop in the Pay tab's right panel, mobile in the Pay tab body. The package composes rather than re-exports: apps that need a single leaf or its Redux state (`@features/flow-pay-card-auth/state`) keep importing that leaf directly.

- [#21310](https://github.com/LedgerHQ/ledger-live/pull/21310) [`1e0763e`](https://github.com/LedgerHQ/ledger-live/commit/1e0763e58c287365325643367a3e4a26ddf5884e) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Display the full list of saved contacts on the desktop Pay tab, ordered by last sent-to then last added

- [#21203](https://github.com/LedgerHQ/ledger-live/pull/21203) [`0127ebd`](https://github.com/LedgerHQ/ledger-live/commit/0127ebd36795e678cd4337b46d38c031d07756c1) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add a web `Contacts` section (title + empty state with an Add contact CTA) and mount it on the desktop Pay tab. The package reads the contacts and derives the empty state itself; the host injects the copy and an `onAddContact` handler. The add-contact flow and the Ledger Sync gate land in a follow-up.

- [#21144](https://github.com/LedgerHQ/ledger-live/pull/21144) [`62008f0`](https://github.com/LedgerHQ/ledger-live/commit/62008f0bcb6b2bcb3a866111c774a66d0f048961) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Keep Pay hero empty vs funded from cached holdings; skeleton the amount only when funded (LIVE-36422).

- [#21242](https://github.com/LedgerHQ/ledger-live/pull/21242) [`3b3c696`](https://github.com/LedgerHQ/ledger-live/commit/3b3c696a3d857f474a64b25cff6389f4df3b2063) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(send): add to an existing contact in send flow lwm

- [#21266](https://github.com/LedgerHQ/ledger-live/pull/21266) [`9faeaf8`](https://github.com/LedgerHQ/ledger-live/commit/9faeaf8f94495bb2b1df1483494cc3979f7cb835) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Rename the request receive save helpers and the summary test id to drop their redundant "card" suffix

- [#21103](https://github.com/LedgerHQ/ledger-live/pull/21103) [`63d7a08`](https://github.com/LedgerHQ/ledger-live/commit/63d7a08b135fe24d04fd5706eed8140b7bf8f1e3) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(lwd): fix layout of security content in recipient step

- [#21145](https://github.com/LedgerHQ/ledger-live/pull/21145) [`5bcc7f1`](https://github.com/LedgerHQ/ledger-live/commit/5bcc7f1bacbe72f86c52548735c15e4a23137ee7) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Rename the Pay request flow package from `@features/flow-pay-card-request` to `@features/flow-pay-request`.

- [#21139](https://github.com/LedgerHQ/ledger-live/pull/21139) [`848b4bd`](https://github.com/LedgerHQ/ledger-live/commit/848b4bd3cccf6cb38f9e31ec39a0d4bc574c3fa2) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Move the InfoState component (and its web-only dialog background tone plumbing) out of ledger-live-desktop and live-mobile into a new shared package, @shared/ui-info-state, so it can be reused in the DDD architecture

- [#21179](https://github.com/LedgerHQ/ledger-live/pull/21179) [`46ed356`](https://github.com/LedgerHQ/ledger-live/commit/46ed356e325028c4e8e461b72f7dce631c7362e3) Thanks [@pawell24](https://github.com/pawell24)! - Fix the Zcash shielded-balance "Stop sync" action, which previously did nothing when the
  running sync was started automatically by the standard wallet sync rather than by the
  manual start button, and could resume on its own shortly after a manual stop otherwise
  succeeded.

- [#20935](https://github.com/LedgerHQ/ledger-live/pull/20935) [`27388a8`](https://github.com/LedgerHQ/ledger-live/commit/27388a894eaac67b8e162a60f6d3368aad0a8682) Thanks [@dilaouid](https://github.com/dilaouid)! - Move Solana staking onto the generic `StakingResources` account attribute.

  **Breaking for `@ledgerhq/coin-solana`.** `SolanaResources`, `SolanaResourcesRaw`, `toSolanaResourcesRaw` and `fromSolanaResourcesRaw` are gone. `SolanaAccount` is now an alias of `StakingAccount`, so read staking data from `account.stakingResources` instead of `account.solanaResources`. A stake is a `StakingDelegation` or a `StakingUnbonding` (`SolanaStakingPosition`) rather than a `SolanaStake`: its stake account address is `positionId`, its validator is `validatorAddress`, and the former `activation.active` / `activation.inactive` / `withdrawable` fields are `activeAmount` / `inactiveAmount` / `withdrawableAmount`. `listSolanaStakingPositions`, `solanaActivationState` and `stakeActions` from `@ledgerhq/coin-solana/logic` cover the common access patterns. Accounts already persisted with a `solanaResources` blob are migrated on hydration, so no resync is needed.

  `@ledgerhq/types-live` gains `StakingPositionDetails`, mixed into `StakingDelegation` and `StakingUnbonding` for chains that materialize each position as its own on-chain account, plus `actionFeeReserve` on `StakingResources`. Both are optional, so other chains are unaffected.

  `@ledgerhq/wallet-cli`'s `earn positions` output changes shape: on `EarnSolanaStake`, `stakeBalance` and `withdrawable` go from `number` to an integer decimal string, so lamport amounts above `Number.MAX_SAFE_INTEGER` stay exact. Anything reading those two fields numerically needs updating.

  `@ledgerhq/ledger-wallet-framework` now exports the generic `StakingResources` serializer (`toStakingResourcesRaw`, `fromStakingResourcesRaw`, `assignStakingResourcesToAccountRaw`, `assignStakingResourcesFromAccountRaw`), moved out of the EVM family in `live-common` so every coin module can use it.

- [#21111](https://github.com/LedgerHQ/ledger-live/pull/21111) [`17b43df`](https://github.com/LedgerHQ/ledger-live/commit/17b43dfa17d3b95aac05c2c52289ebe95bde8397) Thanks [@deepyjr](https://github.com/deepyjr)! - Refresh desktop countervalues when the app regains focus or network connectivity.

- [#21131](https://github.com/LedgerHQ/ledger-live/pull/21131) [`09af9b1`](https://github.com/LedgerHQ/ledger-live/commit/09af9b1b9f7c39db4c6d0cbd1a038fd43784240b) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Rename the Pay flow packages to drop the redundant `card` segment: `@features/flow-pay-card-balance` → `@features/flow-pay-balance`, `@features/flow-pay-card-deposit` → `@features/flow-pay-deposit`, and `@features/flow-pay-card-feature-tour` → `@features/flow-pay-feature-tour`. Package paths, npm names and all imports are updated; persisted Redux state keys and component test IDs are unchanged.

- [#21279](https://github.com/LedgerHQ/ledger-live/pull/21279) [`fe4e836`](https://github.com/LedgerHQ/ledger-live/commit/fe4e836123b6fc978e7292994ec71be3ad9c3f26) Thanks [@deepyjr](https://github.com/deepyjr)! - Use a reliable manifest submit handler and wait for recipient validation before send assertions.

- [#21536](https://github.com/LedgerHQ/ledger-live/pull/21536) [`dab00b6`](https://github.com/LedgerHQ/ledger-live/commit/dab00b64ef4bff300010e258465db60b3c696b9e) Thanks [@ishaba](https://github.com/ishaba)! - fix(coin-tron): restore the TRC20 fee_limit default

- [#21265](https://github.com/LedgerHQ/ledger-live/pull/21265) [`5b78670`](https://github.com/LedgerHQ/ledger-live/commit/5b78670b9587b4ebfe47d0743da1be94b6d85193) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add `@shared/i18n`, a thin i18n context bridge so `features/*` and `domain/*` components can call `useTranslation()` and render `<Trans>` instead of receiving translated strings as props.

  Both apps now build their i18next engine with an explicit `createInstance()` rather than the global singleton, and mount `<I18nProvider>` at their root alongside the existing `<I18nextProvider>`. Non-React call sites import the app instance (`~/renderer/i18n/init` on Desktop, `~/i18n/instance` on Mobile) instead of `i18next`, enforced by a lint rule.

  `@features/flow-pay-feature-tour` is the pilot: it resolves its own `payTab.featureTour.*` copy and no longer takes any copy props.

- [#21132](https://github.com/LedgerHQ/ledger-live/pull/21132) [`6cc7ac6`](https://github.com/LedgerHQ/ledger-live/commit/6cc7ac68b08cdb80b95c597495acd681ec25caca) Thanks [@dilaouid](https://github.com/dilaouid)! - chore(send): remove addressBook property from the coin descriptor

- [#21188](https://github.com/LedgerHQ/ledger-live/pull/21188) [`c8bb138`](https://github.com/LedgerHQ/ledger-live/commit/c8bb13851393d4b1a50a5ece62763ba43110ae6f) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(lwdm): ask ledger sync on add contact

- [#21273](https://github.com/LedgerHQ/ledger-live/pull/21273) [`f141a28`](https://github.com/LedgerHQ/ledger-live/commit/f141a2830859ff7212754336d02d6e7dd46d7809) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Guard Live App webview calls against a detached Electron guest so top bar actions and the network error retry no-op instead of throwing

- [#21040](https://github.com/LedgerHQ/ledger-live/pull/21040) [`55d4fee`](https://github.com/LedgerHQ/ledger-live/commit/55d4feeb8a11c433367659d98077ab60886ac31f) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - fix hint of previous user location tab when entering swap from deeplink

- [#21123](https://github.com/LedgerHQ/ledger-live/pull/21123) [`ebd5766`](https://github.com/LedgerHQ/ledger-live/commit/ebd5766c79b70282339dc3cd6c552e34ee062f06) Thanks [@deepyjr](https://github.com/deepyjr)! - Stabilize local manifest creation in desktop Playwright tests.

- [#21152](https://github.com/LedgerHQ/ledger-live/pull/21152) [`116f006`](https://github.com/LedgerHQ/ledger-live/commit/116f006fb7e1dc3ed7d97c41ec08b2340b66a12e) Thanks [@alexstapenka-ledger](https://github.com/alexstapenka-ledger)! - Add the `stableSavings` feature flag, forward it to Earn on initial load, and send it to Mixpanel as a boolean identify trait on desktop and mobile.

- [#21114](https://github.com/LedgerHQ/ledger-live/pull/21114) [`dc23521`](https://github.com/LedgerHQ/ledger-live/commit/dc23521997b275425c0c7f20c862a8fa48cbd845) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix Market Banner crash when a price-change percentage is missing. The desktop trending tile now uses `getChangePercentage` like mobile, which treats null or undefined values as 0 instead of calling `.toFixed` on them.

- [#21361](https://github.com/LedgerHQ/ledger-live/pull/21361) [`989f22f`](https://github.com/LedgerHQ/ledger-live/commit/989f22f2f8707de393459e2a68ed4d106b047014) Thanks [@vpenskyi-ledger](https://github.com/vpenskyi-ledger)! - Fix swap webview silently reporting ERR_ABORTED as an error and showing a blank screen on ERR_FAILED

- [#21141](https://github.com/LedgerHQ/ledger-live/pull/21141) [`e2f2cfa`](https://github.com/LedgerHQ/ledger-live/commit/e2f2cfa372605742ff6ef29f4e56d9a77fdb86be) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Migrate the DeviceActionContent component into a new `@features/platform-device-action-content` package so DDD flows can render it, decoupling it from the `DeviceModelId` enum. Also render Lumen `Tag` labels and `Banner` titles as text in the shared web/native passthrough test stubs.

  The package now exposes `getDeviceActionAnimation`, and both apps resolve their pin/continue device animations through it instead of keeping byte-identical copies of the same 20 Lottie files each. This drops ~2.5 MB of duplicated animation JSON from the desktop and mobile bundles.

  `@features/platform-style` gains `useThemeVariant()`, returning the active `"light" | "dark"` variant from the style provider both apps already mount, plus a `./hooks` entry point so reading it doesn't pull the providers into a consumer's bundle. DeviceActionContent picks its animation through that hook, so neither app injects a theme any more and the component can be used from deeply nested `features/` trees. It reads the styled-components context directly rather than `useTheme`, which throws when no provider is mounted.

- [#21270](https://github.com/LedgerHQ/ledger-live/pull/21270) [`5b9df59`](https://github.com/LedgerHQ/ledger-live/commit/5b9df5970cb628dbfe592227231b66ff498f480c) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Map the DMK invalid firmware metadata error to a dedicated InvalidProvider blocking state, so the Device Intent Executor shows a clear "Invalid Provider" screen with a "Go to settings" action instead of a raw error

- [#21245](https://github.com/LedgerHQ/ledger-live/pull/21245) [`45ea28b`](https://github.com/LedgerHQ/ledger-live/commit/45ea28b19d1e950bf4e705388a06181a9a7543aa) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Provide the EVM address book to the DMK Ethereum signer, so registered contacts can be clear-signed.

  `toEvmAddressBook` maps the Contacts state to an `EvmAddressBook` snapshot, keeping EVM-family addresses only. Each app registers it on `evmAddressBookProvider` at its composition root, and `DmkSignerEth` reads it once per instance, so the recipient and the signing account are matched against the same snapshot. Records whose proof material does not decode are dropped, and signing is left untouched when no contact is usable.

  Ledger account contacts are not provided yet: the snapshot always carries an empty `ledgerAccounts`.

- [#21357](https://github.com/LedgerHQ/ledger-live/pull/21357) [`9f0b607`](https://github.com/LedgerHQ/ledger-live/commit/9f0b607a0e177c1f7474c649e3b5dd7b7924c8aa) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Resolve Pay deposit-options copy inside `@features/flow-pay-deposit` through `@shared/i18n` instead of receiving translated strings as props. The deposit options view-model now calls `useTranslation()` for its `payTab.deposit.*` keys, so both apps stop building `DepositOptionsLabels` and passing them to `useDepositOptionsAdapter`.

- [#21482](https://github.com/LedgerHQ/ledger-live/pull/21482) [`129c4db`](https://github.com/LedgerHQ/ledger-live/commit/129c4db3a130b39c44a40aeefa987989a81d1219) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix theme reverting to dark when navigating from My Ledger to Contacts

- [#21049](https://github.com/LedgerHQ/ledger-live/pull/21049) [`27ea1f5`](https://github.com/LedgerHQ/ledger-live/commit/27ea1f524b3fd4db75f54ef21d163a0815cb6d5d) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(send): select which address of a contact receives the funds in the Send recipient step

- [#21339](https://github.com/LedgerHQ/ledger-live/pull/21339) [`2a9d2ea`](https://github.com/LedgerHQ/ledger-live/commit/2a9d2ea261259cedb53563384ae7a15a26ab6140) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Show From/To and contact address label in History Address column.

- [#19191](https://github.com/LedgerHQ/ledger-live/pull/19191) [`148d76b`](https://github.com/LedgerHQ/ledger-live/commit/148d76bddfa34c9c6d049e67e7109e222b8432e8) Thanks [@cted-ledger](https://github.com/cted-ledger)! - staking feature for mina blockchain

### Patch Changes

- Updated dependencies [[`dd9fe60`](https://github.com/LedgerHQ/ledger-live/commit/dd9fe60055d1b97a175bb701d98129c79a1ef33b), [`f9be984`](https://github.com/LedgerHQ/ledger-live/commit/f9be984dd27742c065981d4cebf25ba3e564f48a), [`edad3fb`](https://github.com/LedgerHQ/ledger-live/commit/edad3fb2dc1fea0277418374b5ebee9c9860f448), [`0b024e8`](https://github.com/LedgerHQ/ledger-live/commit/0b024e8214eb3635d42c18986aa983bd1501c985), [`244454b`](https://github.com/LedgerHQ/ledger-live/commit/244454ba821c5590a56b4b0e5e5ec6ca2436e6ab), [`7d02f4b`](https://github.com/LedgerHQ/ledger-live/commit/7d02f4bbdc49f57df242d47b55ebd21c5176f4de), [`545e419`](https://github.com/LedgerHQ/ledger-live/commit/545e4191a1b059058a20f30bdd1925b7c78e682c), [`7fae8f5`](https://github.com/LedgerHQ/ledger-live/commit/7fae8f5f7f22aa84933b734266de73cd9fa8a79c), [`a2be85c`](https://github.com/LedgerHQ/ledger-live/commit/a2be85cd773ae59e454cd33b9a38548ea5b003f8), [`4342943`](https://github.com/LedgerHQ/ledger-live/commit/43429435e5411592f61099f1d40712f055578b0c), [`5e45fdd`](https://github.com/LedgerHQ/ledger-live/commit/5e45fddee9f3483ac3daa7b93f58b01e725e6d4b), [`7249fa2`](https://github.com/LedgerHQ/ledger-live/commit/7249fa2564e028a3e557ce97d63a362b0dd96a92), [`e6d6ed6`](https://github.com/LedgerHQ/ledger-live/commit/e6d6ed6eda460eb614680b31a42ba8067cc28d2a), [`8c98500`](https://github.com/LedgerHQ/ledger-live/commit/8c98500f7d95594eafc554dce31ca755b2479e08), [`46f41d2`](https://github.com/LedgerHQ/ledger-live/commit/46f41d2787191684f52e5dc85b0cd629901b13d8), [`f4986f8`](https://github.com/LedgerHQ/ledger-live/commit/f4986f882385e07dbd531d99a0571c67ca91ada0), [`a6e4ace`](https://github.com/LedgerHQ/ledger-live/commit/a6e4ace0712d14b9a0465c123ce88bcb04918ca6), [`ce47443`](https://github.com/LedgerHQ/ledger-live/commit/ce47443e97f559210443547a7948ef61c01f7feb), [`37cc17e`](https://github.com/LedgerHQ/ledger-live/commit/37cc17ea60f5a6c779aa7c5b5b6ae39d0bfea229), [`9a1a1df`](https://github.com/LedgerHQ/ledger-live/commit/9a1a1df2da9b612bd8d5533fba23b0ebc8b1a58f), [`e76361d`](https://github.com/LedgerHQ/ledger-live/commit/e76361de6952dc17336daa0679557fcb7b935430), [`a4f727d`](https://github.com/LedgerHQ/ledger-live/commit/a4f727d0c17d685302cf9ec2a39e752b2c9937fd), [`da47556`](https://github.com/LedgerHQ/ledger-live/commit/da475565799815dd17c4cb941068031e564da9b6), [`beaaa31`](https://github.com/LedgerHQ/ledger-live/commit/beaaa315b5c4d4ccea8145f3a309ba557f961118), [`83b019e`](https://github.com/LedgerHQ/ledger-live/commit/83b019e128b59a289a28184e58c33b108cd3f188), [`36b7fda`](https://github.com/LedgerHQ/ledger-live/commit/36b7fda667ed2bc281291ac25573e36ac7244532), [`f99b720`](https://github.com/LedgerHQ/ledger-live/commit/f99b7205490cb4712eff99519444d7dd6903c02a), [`02c9ccf`](https://github.com/LedgerHQ/ledger-live/commit/02c9ccfb409317a72f0b29d1fb755214adc9e596), [`e723d82`](https://github.com/LedgerHQ/ledger-live/commit/e723d823688cd7f00d4b16549b45c62a500c8a9d), [`bb44e2c`](https://github.com/LedgerHQ/ledger-live/commit/bb44e2c4f8ce29b88394b15a17f7c698cb647e74), [`31223eb`](https://github.com/LedgerHQ/ledger-live/commit/31223ebdd9335ef14a3ae8712658d17de60924e5), [`c62986b`](https://github.com/LedgerHQ/ledger-live/commit/c62986b76467651009a571d64908405988b13571), [`cef29a0`](https://github.com/LedgerHQ/ledger-live/commit/cef29a0cd39ee1a7cfb6428ae650595b4479e4d6), [`076322c`](https://github.com/LedgerHQ/ledger-live/commit/076322c82b0edcba1eda4981902f98cfe6c62b43), [`0639bea`](https://github.com/LedgerHQ/ledger-live/commit/0639bea01c594c335fb9b0604ad9ffc331936d54), [`cdbc3ac`](https://github.com/LedgerHQ/ledger-live/commit/cdbc3acac0045ab860206e32062cc5c417d75196), [`114420e`](https://github.com/LedgerHQ/ledger-live/commit/114420ed119ae6c93969891acf97d61c2af42df4), [`60c41bd`](https://github.com/LedgerHQ/ledger-live/commit/60c41bddad7f1d02028d237cd10fc781baf8f674), [`46d23e1`](https://github.com/LedgerHQ/ledger-live/commit/46d23e1c719201910c0811da2a7a5a6849d93e25), [`b3a86f5`](https://github.com/LedgerHQ/ledger-live/commit/b3a86f5ae5ab80d6f09fa4e5f6738e3eacc696c8), [`e1c2a4b`](https://github.com/LedgerHQ/ledger-live/commit/e1c2a4bf3cabe5f58f8b3f8f226dfc90a0ab0296), [`a8c34d0`](https://github.com/LedgerHQ/ledger-live/commit/a8c34d0d9469b4e11339edfbef53445e58194fd8), [`f9f6b71`](https://github.com/LedgerHQ/ledger-live/commit/f9f6b71d91c051b8e611a44f5b564cf5062cedb8), [`aafcdb7`](https://github.com/LedgerHQ/ledger-live/commit/aafcdb70e59584d6580f080cfd167cce41e56c19), [`9b4214f`](https://github.com/LedgerHQ/ledger-live/commit/9b4214fea8a3d8d8da30cd0b5ba6f9032610527e), [`11a1e34`](https://github.com/LedgerHQ/ledger-live/commit/11a1e34660116e53b0cfa5f66d2aa22c81dd9c25), [`34fc080`](https://github.com/LedgerHQ/ledger-live/commit/34fc080bb0c4ec01528404dde38f7c25559ecebe), [`41faac4`](https://github.com/LedgerHQ/ledger-live/commit/41faac432e8c17e3718d90cc26ce6ae650800681), [`0df32c7`](https://github.com/LedgerHQ/ledger-live/commit/0df32c7f80d190522285002bfa6bffa0539f5b23), [`6046b34`](https://github.com/LedgerHQ/ledger-live/commit/6046b34802da0365fd027b83e48627afd64845ab), [`bf22729`](https://github.com/LedgerHQ/ledger-live/commit/bf22729942b9dc114644dd3dc32962c08012c1cc), [`2ad298a`](https://github.com/LedgerHQ/ledger-live/commit/2ad298ae1f6a60e5d28ca236c17f8eb7d7906c78), [`a334296`](https://github.com/LedgerHQ/ledger-live/commit/a334296eaeca54451650fc3a3d1c36d5c8b93b8d), [`2c70999`](https://github.com/LedgerHQ/ledger-live/commit/2c709990d3569bc50504822ce90c9e9024210312), [`1ef101a`](https://github.com/LedgerHQ/ledger-live/commit/1ef101ab6487c85c8753cccd8bb9adb0dbd2d489), [`9f37206`](https://github.com/LedgerHQ/ledger-live/commit/9f372065ab564bc75960e4d02b8a9cb4e7ac21b0), [`911a996`](https://github.com/LedgerHQ/ledger-live/commit/911a996f2a6d999d194cadd4f842235cddbe1361), [`0500726`](https://github.com/LedgerHQ/ledger-live/commit/05007264f5b1726a21c2e545a10c18993fd2fcb5), [`c8614bf`](https://github.com/LedgerHQ/ledger-live/commit/c8614bfbfd1dc8de12731c2c333b9d137f0f2f93), [`aa8f4bf`](https://github.com/LedgerHQ/ledger-live/commit/aa8f4bff9059c9e462d02efb20a1b02fa426939a), [`1e0763e`](https://github.com/LedgerHQ/ledger-live/commit/1e0763e58c287365325643367a3e4a26ddf5884e), [`0127ebd`](https://github.com/LedgerHQ/ledger-live/commit/0127ebd36795e678cd4337b46d38c031d07756c1), [`3ff0cde`](https://github.com/LedgerHQ/ledger-live/commit/3ff0cde19eea9c76e0737afa023d0dd826bd6ee8), [`62008f0`](https://github.com/LedgerHQ/ledger-live/commit/62008f0bcb6b2bcb3a866111c774a66d0f048961), [`6f8acaf`](https://github.com/LedgerHQ/ledger-live/commit/6f8acaf912c5c515a8fb05382101785fded8bb06), [`3b3c696`](https://github.com/LedgerHQ/ledger-live/commit/3b3c696a3d857f474a64b25cff6389f4df3b2063), [`9faeaf8`](https://github.com/LedgerHQ/ledger-live/commit/9faeaf8f94495bb2b1df1483494cc3979f7cb835), [`71fd65e`](https://github.com/LedgerHQ/ledger-live/commit/71fd65e2bdfd692d1d009f22202d9e7f984826b5), [`5bcc7f1`](https://github.com/LedgerHQ/ledger-live/commit/5bcc7f1bacbe72f86c52548735c15e4a23137ee7), [`848b4bd`](https://github.com/LedgerHQ/ledger-live/commit/848b4bd3cccf6cb38f9e31ec39a0d4bc574c3fa2), [`46ed356`](https://github.com/LedgerHQ/ledger-live/commit/46ed356e325028c4e8e461b72f7dce631c7362e3), [`6f4814b`](https://github.com/LedgerHQ/ledger-live/commit/6f4814b8c0e0c1c06b6729f036d756206ed19d77), [`27388a8`](https://github.com/LedgerHQ/ledger-live/commit/27388a894eaac67b8e162a60f6d3368aad0a8682), [`6cef6b5`](https://github.com/LedgerHQ/ledger-live/commit/6cef6b5341c30850aa74159bdbdea0a18f89de4c), [`09af9b1`](https://github.com/LedgerHQ/ledger-live/commit/09af9b1b9f7c39db4c6d0cbd1a038fd43784240b), [`ad1c0ff`](https://github.com/LedgerHQ/ledger-live/commit/ad1c0ff93b94ba9a0b1e7409e5ddbdc2d73bcd30), [`c20677f`](https://github.com/LedgerHQ/ledger-live/commit/c20677f1b5d13973883196e5665d6dd0ef7c58ba), [`dab00b6`](https://github.com/LedgerHQ/ledger-live/commit/dab00b64ef4bff300010e258465db60b3c696b9e), [`5b78670`](https://github.com/LedgerHQ/ledger-live/commit/5b78670b9587b4ebfe47d0743da1be94b6d85193), [`6cc7ac6`](https://github.com/LedgerHQ/ledger-live/commit/6cc7ac68b08cdb80b95c597495acd681ec25caca), [`6110948`](https://github.com/LedgerHQ/ledger-live/commit/61109484660c79a7ce8ad1e32af1f58276ddad7a), [`1cf5583`](https://github.com/LedgerHQ/ledger-live/commit/1cf55832f785fc57881169092f1190fa7ddfecf9), [`c8bb138`](https://github.com/LedgerHQ/ledger-live/commit/c8bb13851393d4b1a50a5ece62763ba43110ae6f), [`150a151`](https://github.com/LedgerHQ/ledger-live/commit/150a151169e4ef40aa197300a115f17db1aa20c0), [`116f006`](https://github.com/LedgerHQ/ledger-live/commit/116f006fb7e1dc3ed7d97c41ec08b2340b66a12e), [`9a3746d`](https://github.com/LedgerHQ/ledger-live/commit/9a3746d7442c10649e183aaefeca2d7f51d4797f), [`e2f2cfa`](https://github.com/LedgerHQ/ledger-live/commit/e2f2cfa372605742ff6ef29f4e56d9a77fdb86be), [`5b9df59`](https://github.com/LedgerHQ/ledger-live/commit/5b9df5970cb628dbfe592227231b66ff498f480c), [`cf9a982`](https://github.com/LedgerHQ/ledger-live/commit/cf9a9820f9b1ae7405e9bdf3f4947d0f99bb68dd), [`45ea28b`](https://github.com/LedgerHQ/ledger-live/commit/45ea28b19d1e950bf4e705388a06181a9a7543aa), [`f0f9990`](https://github.com/LedgerHQ/ledger-live/commit/f0f999034f698b4e0e35928d5cf43a365ed3fef0), [`9f0b607`](https://github.com/LedgerHQ/ledger-live/commit/9f0b607a0e177c1f7474c649e3b5dd7b7924c8aa), [`27ea1f5`](https://github.com/LedgerHQ/ledger-live/commit/27ea1f524b3fd4db75f54ef21d163a0815cb6d5d), [`9d5a6d9`](https://github.com/LedgerHQ/ledger-live/commit/9d5a6d980442ac78bcc1c3c12fbfee389aa8e0c9)]:
  - @features/flow-pay-request@0.3.0
  - @ledgerhq/live-common@37.5.0
  - @ledgerhq/transaction-observability@0.2.0
  - @features/flow-contacts@0.9.0
  - @features/platform-contacts@0.5.0
  - @features/flow-contacts-add-contact@0.5.0
  - @features/flow-contacts-edit-contact@0.3.0
  - @shared/ui-info-state@0.2.0
  - @features/platform-verify-address-intent@0.3.0
  - @ledgerhq/coin-zcash@0.6.0
  - @shared/env@0.5.0
  - @domain/entity-currency-crypto@0.11.0
  - @domain/entity-account-alias@0.1.0
  - @features/flow-contacts-introduction@1.0.0
  - @features/flow-pay-card@0.2.0
  - @shared/api-services@0.6.0
  - @ledgerhq/coin-canton@1.1.0
  - @ledgerhq/coin-cardano@1.1.0
  - @ledgerhq/coin-casper@3.2.0
  - @ledgerhq/coin-concordium@1.1.0
  - @ledgerhq/coin-cosmos@1.1.0
  - @ledgerhq/coin-evm@5.2.0
  - @ledgerhq/coin-filecoin@2.1.0
  - @features/flow-contacts-list@0.5.0
  - @features/flow-contacts-delete-contact@0.2.0
  - @features/flow-contacts-edit-address@0.2.0
  - @features/flow-contacts-add-address@0.3.0
  - @features/flow-pay-contact@0.2.0
  - @features/flow-pay-balance@0.4.0
  - @features/flow-pay-deposit@0.3.0
  - @shared/auth@0.6.0
  - @shared/cloud-sync@0.3.0
  - @shared/feature-flags@0.21.0
  - @features/platform-currencies@0.7.0
  - @domain/api-currency-token@0.6.0
  - @ledgerhq/asset-aggregation@0.14.0
  - @features/flow-pay-card-auth@0.5.0
  - @ledgerhq/types-live@6.122.0
  - @ledgerhq/ledger-wallet-framework@3.2.0
  - @ledgerhq/live-dmk-shared@0.32.0
  - @features/flow-pay-feature-tour@0.4.0
  - @devtools/bindings@0.6.0
  - @shared/i18n@0.2.0
  - @features/platform-device-action-content@0.2.0
  - @features/platform-style@0.3.0
  - @ledgerhq/live-signer-evm@0.23.0
  - @features/platform-device-intent@5.2.0
  - @ledgerhq/asset-detail@0.11.3
  - @ledgerhq/live-dmk-desktop@0.20.9
  - @domain/api-aggregated-assets@0.4.2
  - @features/platform-aggregated-assets@0.5.1
  - @features/platform-env@0.2.3
  - @ledgerhq/ledger-key-ring-protocol@0.21.1
  - @ledgerhq/live-dmk-speculos@0.10.7
  - @ledgerhq/wallet-analytics@0.3.6
  - @ledgerhq/wallet-pnl@0.7.9
  - @domain/entity-contact@0.8.1
  - @domain/entity-currency@0.4.2
  - @domain/entity-currency-token@0.5.1
  - @ledgerhq/coin-bitcoin@0.51.3
  - @ledgerhq/live-currency-format@0.14.3
  - @ledgerhq/live-wallet@1.1.1
  - @ledgerhq/wallet-btc@0.3.0
  - @domain/api-altcoins-sentiment@0.3.4
  - @domain/api-currency-fiat@0.4.3
  - @domain/api-market-sentiment@0.3.4
  - @domain/api-push-devices@0.2.4
  - @domain/entity-account-name@0.2.2
  - @domain/entity-recent-addresses@0.2.1
  - @features/platform-wallet-sync@0.1.3
  - @features/flow-large-screen-upsell@2.0.1
  - @features/platform-feature-flags@0.6.8
  - @domain/entity-analytics-consent@0.2.2
  - @features/flow-pay-card-details@0.2.0
  - @features/platform-card@0.3.1
  - @ledgerhq/domain-service@1.8.17
  - @ledgerhq/live-countervalues@0.24.5
  - @ledgerhq/live-countervalues-react@0.16.9
  - @devtools/shell@0.9.1
  - @features/flow-analytics-consent@0.2.4

## 4.19.0-next.4

### Minor Changes

- [#21536](https://github.com/LedgerHQ/ledger-live/pull/21536) [`dab00b6`](https://github.com/LedgerHQ/ledger-live/commit/dab00b64ef4bff300010e258465db60b3c696b9e) Thanks [@ishaba](https://github.com/ishaba)! - fix(coin-tron): restore the TRC20 fee_limit default

### Patch Changes

- Updated dependencies [[`dab00b6`](https://github.com/LedgerHQ/ledger-live/commit/dab00b64ef4bff300010e258465db60b3c696b9e)]:
  - @ledgerhq/live-common@37.5.0-next.3
  - @ledgerhq/asset-detail@0.11.3-next.3
  - @ledgerhq/live-dmk-desktop@0.20.9-next.3

## 4.19.0-next.3

### Minor Changes

- [#21532](https://github.com/LedgerHQ/ledger-live/pull/21532) [`173be30`](https://github.com/LedgerHQ/ledger-live/commit/173be30135caf7ffdb26432dac0a6c4f5701e932) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-solana): support v1 transactions

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/live-common@37.5.0-next.2
  - @ledgerhq/asset-detail@0.11.3-next.2
  - @ledgerhq/live-dmk-desktop@0.20.9-next.2

## 4.19.0-next.2

### Minor Changes

- [#21482](https://github.com/LedgerHQ/ledger-live/pull/21482) [`129c4db`](https://github.com/LedgerHQ/ledger-live/commit/129c4db3a130b39c44a40aeefa987989a81d1219) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix theme reverting to dark when navigating from My Ledger to Contacts

## 4.19.0-next.1

### Minor Changes

- [#21394](https://github.com/LedgerHQ/ledger-live/pull/21394) [`6046b34`](https://github.com/LedgerHQ/ledger-live/commit/6046b34802da0365fd027b83e48627afd64845ab) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix MarketBanner/Market list navigation so clicking Arbitrum opens the ARB asset detail instead of the Ethereum one, by passing the market ledger ids in the navigation state and preventing a bare market id from colliding with a same-named chain id

### Patch Changes

- Updated dependencies [[`6046b34`](https://github.com/LedgerHQ/ledger-live/commit/6046b34802da0365fd027b83e48627afd64845ab)]:
  - @ledgerhq/asset-aggregation@0.14.0-next.1
  - @ledgerhq/asset-detail@0.11.3-next.1
  - @ledgerhq/live-common@37.5.0-next.1
  - @ledgerhq/live-dmk-desktop@0.20.9-next.1

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->

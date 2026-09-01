# live-mobile

## 4.19.0-next.0

### Minor Changes

- [#21092](https://github.com/LedgerHQ/ledger-live/pull/21092) [`dd9fe60`](https://github.com/LedgerHQ/ledger-live/commit/dd9fe60055d1b97a175bb701d98129c79a1ef33b) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add the native Pay Request receive stack screen (close, QR, share, copy, verify).

- [#20818](https://github.com/LedgerHQ/ledger-live/pull/20818) [`f9be984`](https://github.com/LedgerHQ/ledger-live/commit/f9be984dd27742c065981d4cebf25ba3e564f48a) Thanks [@beths-ledger](https://github.com/beths-ledger)! - Emit `earn_transaction_completed` / `earn_transaction_failed` for native staking, from the account-bridge seam.

  Every transaction route resolves its bridge through `getAccountBridge`, so `wrapAccountBridge` — which already hosts the sanctioned-address check — is the one place that sees them all. It now decorates `signOperation` (emitting a classified failure, then re-raising the original error untouched) and `broadcast` (success or classified failure). The device-action layer adds the one signal the bridge cannot see: closing the sign prompt is an unsubscribe rather than an error, so abandonment is reported from there.

  This replaces UI-inferred bottom-of-funnel tracking for staking, where a user reaching the final screen was counted as converted whether or not a transaction ever landed. No _analytics_ event is produced for non-staking transactions. The seam observes every sign and broadcast outcome, and the Segment mapping is what drops the ones with no derived staking action — so plain sends and swaps reach no analytics sink, and no currency allowlist is needed.

  Desktop and mobile each register a Segment observer at startup; `track` already self-gates on analytics consent. Desktop also registers a dev-only console observer so the whole seam can be watched locally across every staking route and coin. The existing Datadog `useBroadcast` path is untouched.

- [#20973](https://github.com/LedgerHQ/ledger-live/pull/20973) [`7d02f4b`](https://github.com/LedgerHQ/ledger-live/commit/7d02f4bbdc49f57df242d47b55ebd21c5176f4de) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix mobile bottom sheets that could not be reopened after being closed.

- [#21151](https://github.com/LedgerHQ/ledger-live/pull/21151) [`545e419`](https://github.com/LedgerHQ/ledger-live/commit/545e4191a1b059058a20f30bdd1925b7c78e682c) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix the odd Add contact transition on Mobile by focusing the contact name field only once the drawer has finished opening, so the keyboard no longer resizes the dynamically sized drawer mid-animation. Adds an onOpened callback to QueuedBottomSheet and makes ContactNameInput focus reactively rather than only on mount.

- [#21234](https://github.com/LedgerHQ/ledger-live/pull/21234) [`7fae8f5`](https://github.com/LedgerHQ/ledger-live/commit/7fae8f5f7f22aa84933b734266de73cd9fa8a79c) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix the keyboard flickering open and shut on the Mobile edit contact drawer, which focused its name field as soon as it mounted and so raised the keyboard into a drawer that was still animating. The field now waits for its drawer to settle before taking focus, as the add contact drawer already did, and focus is opt-in so no other drawer can raise the keyboard by accident.

  Also give the add contact, edit contact and Send add new contact drawers the same keyboard clearance as the add address and edit address drawers, so every contact drawer leaves the same gap above the keyboard on iOS instead of sitting flush against it.

- [#21164](https://github.com/LedgerHQ/ledger-live/pull/21164) [`a2be85c`](https://github.com/LedgerHQ/ledger-live/commit/a2be85cd773ae59e454cd33b9a38548ea5b003f8) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Wire Pay Request Verify on mobile (intro sheet, DIE address confirmation, tracking).
  Share `getAddressVerification` (maps refuse / unsupported) in the platform intent package.

- [#21156](https://github.com/LedgerHQ/ledger-live/pull/21156) [`5820213`](https://github.com/LedgerHQ/ledger-live/commit/5820213301fd6fbd8962ce6fe5e1680f04599b70) Thanks [@vpenskyi-ledger](https://github.com/vpenskyi-ledger)! - Refactor `account.request` cancel-navigation out of `useUiHook` and fix premature cancel in the inline add-account flow.

  **Refactor (LIVE-36323):** Remove host-specific `shouldGoBackOnCancelRef` from `useUiHook`. Expose plain `onAccountRequestCancel` / `onAccountRequestSuccess` callbacks instead. Exchange and Buy host screens now own the one-shot dismiss rule directly (`shouldGoBackRef` in `PTX/index.tsx`), eliminating the `goBackOnAccountRequestCancel` boolean→string→boolean round-trip through `inputs`.

  **Bug fix (flagged by Earn team):** Since 6f1e402, `closeDrawer` fired `onCancel` immediately when the user tapped "Add Account" in the modular drawer, breaking Earn's inline add-account flow. Introduce `hideModularDrawer` — a Redux action that sets `isOpen = false` without clearing `callbackId` or `cancelCallbackId`. The navigate-to-device step uses this silent hide so `account.request` stays pending. The real cancel still fires via `onCloseNavigation` if the user abandons the device flow.

- [#21243](https://github.com/LedgerHQ/ledger-live/pull/21243) [`2e92399`](https://github.com/LedgerHQ/ledger-live/commit/2e92399407ac7416efbf94681b4336fc21dba1e1) Thanks [@henri-ly](https://github.com/henri-ly)! - Show the Contacts feature introduction in the new Send flow recipient step, for currency families eligible to the address book when the contacts feature flag is on and the user has not dismissed it yet.

- [#21162](https://github.com/LedgerHQ/ledger-live/pull/21162) [`dff2a65`](https://github.com/LedgerHQ/ledger-live/commit/dff2a65a976c700dab29bba518cd6f5c4b271adf) Thanks [@sarneijim](https://github.com/sarneijim)! - Add missing Touchscreen Upgrade Program tracking for Backup Hub Recovery Key upsell and Lazy Onboarding Banner (LIVE-36494)

- [#21098](https://github.com/LedgerHQ/ledger-live/pull/21098) [`0f71eeb`](https://github.com/LedgerHQ/ledger-live/commit/0f71eeba4057b32f440b53454075d89514755974) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Upgrade rsbuild to 2.1.13, rspack to 2.1.10, and rslib to 0.23.2

- [#21348](https://github.com/LedgerHQ/ledger-live/pull/21348) [`46f41d2`](https://github.com/LedgerHQ/ledger-live/commit/46f41d2787191684f52e5dc85b0cd629901b13d8) Thanks [@deepyjr](https://github.com/deepyjr)! - Update the Contacts feature introduction image and English copy, and remove its description field from the shared contract.

- [#21244](https://github.com/LedgerHQ/ledger-live/pull/21244) [`f4986f8`](https://github.com/LedgerHQ/ledger-live/commit/f4986f882385e07dbd531d99a0571c67ca91ada0) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Show a host-provided Crypto card title on the Pay Card web and native views

- [#21150](https://github.com/LedgerHQ/ledger-live/pull/21150) [`61dc07a`](https://github.com/LedgerHQ/ledger-live/commit/61dc07a884b5e4ccfb2990b96057aacf6fd931a6) Thanks [@deepyjr](https://github.com/deepyjr)! - Refresh countervalues when the mobile app resumes or reconnects

- [#21113](https://github.com/LedgerHQ/ledger-live/pull/21113) [`a6e4ace`](https://github.com/LedgerHQ/ledger-live/commit/a6e4ace0712d14b9a0465c123ce88bcb04918ca6) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(send): add a contact from an address in the send flow

- [#21363](https://github.com/LedgerHQ/ledger-live/pull/21363) [`ce47443`](https://github.com/LedgerHQ/ledger-live/commit/ce47443e97f559210443547a7948ef61c01f7feb) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Read CARD_API_URL and CARD_BAANX_CLIENT_KEY on every use, and not one time at boot. The debug settings can now change the Card tenant without a restart. The mobile app also applies its `.env` values before the store reads them.

- [#20117](https://github.com/LedgerHQ/ledger-live/pull/20117) [`6780db0`](https://github.com/LedgerHQ/ledger-live/commit/6780db014288dd297ed2d6b9e2133a5d91debc8a) Thanks [@shazzzam](https://github.com/shazzzam)! - Celo: show a clear "temporarily unavailable" message when voting is blocked during on-chain epoch processing, instead of a generic "RPC request failed" error

- [#21235](https://github.com/LedgerHQ/ledger-live/pull/21235) [`7ae6040`](https://github.com/LedgerHQ/ledger-live/commit/7ae60405b6237ccf611ea7c953917f6be19467ec) Thanks [@deepyjr](https://github.com/deepyjr)! - Add explicit close controls to Contacts address entry forms on mobile.

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

- [#21226](https://github.com/LedgerHQ/ledger-live/pull/21226) [`a2360f0`](https://github.com/LedgerHQ/ledger-live/commit/a2360f0bbf0777bac083706f85369997e69ba0ec) Thanks [@sarneijim](https://github.com/sarneijim)! - Add QA device simulation dev tool in Debug > Configuration (LIVE-33169)

- [#21222](https://github.com/LedgerHQ/ledger-live/pull/21222) [`fcdac1c`](https://github.com/LedgerHQ/ledger-live/commit/fcdac1c74265b2fd9e862a18044032f7b5191a54) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Wire Env, Trustchain and Cloud Sync devtools into LLD and web-tools; wire Env devtool into LLM.

- [#21142](https://github.com/LedgerHQ/ledger-live/pull/21142) [`a51303c`](https://github.com/LedgerHQ/ledger-live/commit/a51303cceab56366640f66081888fb6b690ee515) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(send): add a contact from an address in the send flow on lwm

- [#21089](https://github.com/LedgerHQ/ledger-live/pull/21089) [`803c2db`](https://github.com/LedgerHQ/ledger-live/commit/803c2db07a0cf9fcdf29a494205b88745258aab8) Thanks [@Valentin-Ledger](https://github.com/Valentin-Ledger)! - Add earn/simulate deeplink to open the rewards simulator

- [#21085](https://github.com/LedgerHQ/ledger-live/pull/21085) [`60c41bd`](https://github.com/LedgerHQ/ledger-live/commit/60c41bddad7f1d02028d237cd10fc781baf8f674) Thanks [@deepyjr](https://github.com/deepyjr)! - Fix Contacts address drawers so the confirm button stays visible above the keyboard on Android

- [#21347](https://github.com/LedgerHQ/ledger-live/pull/21347) [`b3a86f5`](https://github.com/LedgerHQ/ledger-live/commit/b3a86f5ae5ab80d6f09fa4e5f6738e3eacc696c8) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Move Pay balance/action-tile copy resolution into @features/flow-pay-balance via @shared/i18n so hosts no longer pass translated labels.

- [#21014](https://github.com/LedgerHQ/ledger-live/pull/21014) [`e1c2a4b`](https://github.com/LedgerHQ/ledger-live/commit/e1c2a4bf3cabe5f58f8b3f8f226dfc90a0ab0296) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix Pay tab bottom sheets so the filter opens expanded and deposit options stay fully visible

- [#21117](https://github.com/LedgerHQ/ledger-live/pull/21117) [`1190ce1`](https://github.com/LedgerHQ/ledger-live/commit/1190ce10656496de8af6aa893b6cafca6c8a36d8) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Declares `expo-document-picker` as an optional peer dependency (and devDependency) in `@devtools/feature-flags`, removing it from regular dependencies. Adds it as a direct dependency in `ledger-live-mobile` so autolinking resolves correctly on the native side.

- [#21190](https://github.com/LedgerHQ/ledger-live/pull/21190) [`aafcdb7`](https://github.com/LedgerHQ/ledger-live/commit/aafcdb70e59584d6580f080cfd167cce41e56c19) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Preserve transferId through the generic adapter for Casper

- [#21138](https://github.com/LedgerHQ/ledger-live/pull/21138) [`c804d67`](https://github.com/LedgerHQ/ledger-live/commit/c804d67c36fd631769d9a96f99d2c7d6f06d8c74) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(lwm): fix tracking filter for the new send flow

- [#21142](https://github.com/LedgerHQ/ledger-live/pull/21142) [`11a1e34`](https://github.com/LedgerHQ/ledger-live/commit/11a1e34660116e53b0cfa5f66d2aa22c81dd9c25) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(send): add address to an existing account in the send

- [#21306](https://github.com/LedgerHQ/ledger-live/pull/21306) [`40f6c6d`](https://github.com/LedgerHQ/ledger-live/commit/40f6c6d09d01005044f49c42b116436f50495df4) Thanks [@alexstapenka-ledger](https://github.com/alexstapenka-ledger)! - Fix Earn inline add-account: resolve `account.request` before popping the stack, so Wallet API success is not ignored after a premature cancel.

- [#21287](https://github.com/LedgerHQ/ledger-live/pull/21287) [`34fc080`](https://github.com/LedgerHQ/ledger-live/commit/34fc080bb0c4ec01528404dde38f7c25559ecebe) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Order Pay contacts by last sent-to, then last added, derived at read time from account OUT operations

- [#21209](https://github.com/LedgerHQ/ledger-live/pull/21209) [`a334296`](https://github.com/LedgerHQ/ledger-live/commit/a334296eaeca54451650fc3a3d1c36d5c8b93b8d) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Wire the Pay contacts empty state to the shared Add contact dialog, Ledger Sync gate, and a host-injected `createContactCreationPort`.

- [#21208](https://github.com/LedgerHQ/ledger-live/pull/21208) [`1b789dc`](https://github.com/LedgerHQ/ledger-live/commit/1b789dc76939a2791e34fefb512652bac71ae4df) Thanks [@amaslakov](https://github.com/amaslakov)! - Celo: add USAT (Tether America USD) to the fee currencies that can be selected to pay gas

- [#21126](https://github.com/LedgerHQ/ledger-live/pull/21126) [`6c97b3f`](https://github.com/LedgerHQ/ledger-live/commit/6c97b3fa795a3cda7c895b2e30f6454b21a4cd44) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Stack the LNS upsell banner above the hardware carousel instead of squeezing it into a tile slot, share a carousel with action cards only on mobile, and stop the Content Cards QA console from collapsing every Top wallet preset into the "alwayson" category

- [#20931](https://github.com/LedgerHQ/ledger-live/pull/20931) [`75711a2`](https://github.com/LedgerHQ/ledger-live/commit/75711a26b6a6e23a8ee1e9e34e3e574a08f76a95) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Split the Ledger Wallet Mobile Ledger Sync E2E test into five suites, one per Xray ticket, each
  booting the app already a member of a freshly created trustchain and destroying it afterwards. The
  mobile suite now shares the Ledger Sync CLI layer from `live-e2e-shared` instead of keeping a
  near-verbatim copy, and a `TrustchainPage` asserts trustchain contents through the CLI. On the app
  side this adds a Detox-only `importTrustchain` bridge message so a test can pre-seed the trustchain,
  and testIDs on the `TinyCard` CTA and the manage-instances row so the synchronized instances list is
  reachable from tests — the card's testID sat on a non-touchable container, so taps on it did nothing.

  Also fixes `addAccountAtIndex`, which cleared the selection whenever exactly one account was
  discovered: it tapped "deselect all" only for multiple accounts but tapped the account row
  unconditionally, and a lone account arrives already selected, so Confirm was disabled and account
  discovery timed out.

- [#21175](https://github.com/LedgerHQ/ledger-live/pull/21175) [`911a996`](https://github.com/LedgerHQ/ledger-live/commit/911a996f2a6d999d194cadd4f842235cddbe1361) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Show Pay action tiles in every hero state (LIVE-36422).

- [#21099](https://github.com/LedgerHQ/ledger-live/pull/21099) [`c8614bf`](https://github.com/LedgerHQ/ledger-live/commit/c8614bfbfd1dc8de12731c2c333b9d137f0f2f93) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add `@features/flow-pay-card`, a Contacts-style orchestrator that aggregates the Pay Card leaf flows behind a single `Card` entry point. It follows the app MVVM split — a `Card` container wires a shared `useCardViewModel` to the platform `CardView` — and composes the card face from `@features/flow-pay-card-details` (`CardVisual` with the balance overlay, or the bare `CardArtwork`) with the authentication controls (`CardLogin` / `CardLogout` from `@features/flow-pay-card-auth`), each of which still decides on its own whether it belongs on screen.

  The flow owns the (currently mocked) card balance and assembles the overlay itself, so hosts no longer pass a pre-built visual: they hand over only what they alone know — `formatCountervalue` (needs the app's locale and counter-value currency) and `balanceLabel` (i18n). Both apps now mount `Card` instead of wiring `CardLogin` / `CardLogout` directly: desktop in the Pay tab's right panel, mobile in the Pay tab body. The package composes rather than re-exports: apps that need a single leaf or its Redux state (`@features/flow-pay-card-auth/state`) keep importing that leaf directly.

- [#21281](https://github.com/LedgerHQ/ledger-live/pull/21281) [`3ff0cde`](https://github.com/LedgerHQ/ledger-live/commit/3ff0cde19eea9c76e0737afa023d0dd826bd6ee8) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Cap the mobile Pay contacts strip at 8 and add a see-all control that opens the Contacts flow with a "Pay contact" page title.

- [#21144](https://github.com/LedgerHQ/ledger-live/pull/21144) [`62008f0`](https://github.com/LedgerHQ/ledger-live/commit/62008f0bcb6b2bcb3a866111c774a66d0f048961) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Keep Pay hero empty vs funded from cached holdings; skeleton the amount only when funded (LIVE-36422).

- [#21227](https://github.com/LedgerHQ/ledger-live/pull/21227) [`d278ab7`](https://github.com/LedgerHQ/ledger-live/commit/d278ab7e1a99188e67159cffaa24d5110e9631f6) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Fix Pay Request crash when the selected token is not yet a sub-account.

- [#21118](https://github.com/LedgerHQ/ledger-live/pull/21118) [`6f8acaf`](https://github.com/LedgerHQ/ledger-live/commit/6f8acaf912c5c515a8fb05382101785fded8bb06) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Share the Pay request card as a PNG from the native Share action

- [#21242](https://github.com/LedgerHQ/ledger-live/pull/21242) [`3b3c696`](https://github.com/LedgerHQ/ledger-live/commit/3b3c696a3d857f474a64b25cff6389f4df3b2063) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(send): add to an existing contact in send flow lwm

- [#21284](https://github.com/LedgerHQ/ledger-live/pull/21284) [`6cef6b5`](https://github.com/LedgerHQ/ledger-live/commit/6cef6b5341c30850aa74159bdbdea0a18f89de4c) Thanks [@benruseau](https://github.com/benruseau)! - Add an OS updates orchestrator playground in Developer settings

- [#21266](https://github.com/LedgerHQ/ledger-live/pull/21266) [`9faeaf8`](https://github.com/LedgerHQ/ledger-live/commit/9faeaf8f94495bb2b1df1483494cc3979f7cb835) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Rename the request receive save helpers and the summary test id to drop their redundant "card" suffix

- [#21288](https://github.com/LedgerHQ/ledger-live/pull/21288) [`95fae8f`](https://github.com/LedgerHQ/ledger-live/commit/95fae8f6f8b2c1b294b445d0fda540738e1e6d7e) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add a "Load contacts from send history" generator to the mobile Contacts devtool

- [#21324](https://github.com/LedgerHQ/ledger-live/pull/21324) [`1b3e5ad`](https://github.com/LedgerHQ/ledger-live/commit/1b3e5adc7b808f1126fe7f72ea5fdfabde0b8bf8) Thanks [@deepyjr](https://github.com/deepyjr)! - Explain unavailable assets and networks in Contacts currency selection

- [#21217](https://github.com/LedgerHQ/ledger-live/pull/21217) [`7a1a622`](https://github.com/LedgerHQ/ledger-live/commit/7a1a622a258a0f0fba048114cf78dcd29488b111) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Show the Card screen background on the Pay tab

- [#21145](https://github.com/LedgerHQ/ledger-live/pull/21145) [`5bcc7f1`](https://github.com/LedgerHQ/ledger-live/commit/5bcc7f1bacbe72f86c52548735c15e4a23137ee7) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Rename the Pay request flow package from `@features/flow-pay-card-request` to `@features/flow-pay-request`.

- [#21139](https://github.com/LedgerHQ/ledger-live/pull/21139) [`848b4bd`](https://github.com/LedgerHQ/ledger-live/commit/848b4bd3cccf6cb38f9e31ec39a0d4bc574c3fa2) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Move the InfoState component (and its web-only dialog background tone plumbing) out of ledger-live-desktop and live-mobile into a new shared package, @shared/ui-info-state, so it can be reused in the DDD architecture

- [#21177](https://github.com/LedgerHQ/ledger-live/pull/21177) [`6f4814b`](https://github.com/LedgerHQ/ledger-live/commit/6f4814b8c0e0c1c06b6729f036d756206ed19d77) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix the mobile Contacts edit address sheet staying hidden behind the keyboard, and retract the keyboard when a bottom sheet starts closing so the sheet can be reopened afterwards.

- [#20935](https://github.com/LedgerHQ/ledger-live/pull/20935) [`27388a8`](https://github.com/LedgerHQ/ledger-live/commit/27388a894eaac67b8e162a60f6d3368aad0a8682) Thanks [@dilaouid](https://github.com/dilaouid)! - Move Solana staking onto the generic `StakingResources` account attribute.

  **Breaking for `@ledgerhq/coin-solana`.** `SolanaResources`, `SolanaResourcesRaw`, `toSolanaResourcesRaw` and `fromSolanaResourcesRaw` are gone. `SolanaAccount` is now an alias of `StakingAccount`, so read staking data from `account.stakingResources` instead of `account.solanaResources`. A stake is a `StakingDelegation` or a `StakingUnbonding` (`SolanaStakingPosition`) rather than a `SolanaStake`: its stake account address is `positionId`, its validator is `validatorAddress`, and the former `activation.active` / `activation.inactive` / `withdrawable` fields are `activeAmount` / `inactiveAmount` / `withdrawableAmount`. `listSolanaStakingPositions`, `solanaActivationState` and `stakeActions` from `@ledgerhq/coin-solana/logic` cover the common access patterns. Accounts already persisted with a `solanaResources` blob are migrated on hydration, so no resync is needed.

  `@ledgerhq/types-live` gains `StakingPositionDetails`, mixed into `StakingDelegation` and `StakingUnbonding` for chains that materialize each position as its own on-chain account, plus `actionFeeReserve` on `StakingResources`. Both are optional, so other chains are unaffected.

  `@ledgerhq/wallet-cli`'s `earn positions` output changes shape: on `EarnSolanaStake`, `stakeBalance` and `withdrawable` go from `number` to an integer decimal string, so lamport amounts above `Number.MAX_SAFE_INTEGER` stay exact. Anything reading those two fields numerically needs updating.

  `@ledgerhq/ledger-wallet-framework` now exports the generic `StakingResources` serializer (`toStakingResourcesRaw`, `fromStakingResourcesRaw`, `assignStakingResourcesToAccountRaw`, `assignStakingResourcesFromAccountRaw`), moved out of the EVM family in `live-common` so every coin module can use it.

- [#21131](https://github.com/LedgerHQ/ledger-live/pull/21131) [`09af9b1`](https://github.com/LedgerHQ/ledger-live/commit/09af9b1b9f7c39db4c6d0cbd1a038fd43784240b) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Rename the Pay flow packages to drop the redundant `card` segment: `@features/flow-pay-card-balance` → `@features/flow-pay-balance`, `@features/flow-pay-card-deposit` → `@features/flow-pay-deposit`, and `@features/flow-pay-card-feature-tour` → `@features/flow-pay-feature-tour`. Package paths, npm names and all imports are updated; persisted Redux state keys and component test IDs are unchanged.

- [#21258](https://github.com/LedgerHQ/ledger-live/pull/21258) [`ad1c0ff`](https://github.com/LedgerHQ/ledger-live/commit/ad1c0ff93b94ba9a0b1e7409e5ddbdc2d73bcd30) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the contacts section to the Pay tab, with a leading Pay tile opening the send flow. Balance, Contacts and Card now share a s24 gap and inherit their horizontal padding from the Pay tab container.

- [#21265](https://github.com/LedgerHQ/ledger-live/pull/21265) [`5b78670`](https://github.com/LedgerHQ/ledger-live/commit/5b78670b9587b4ebfe47d0743da1be94b6d85193) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add `@shared/i18n`, a thin i18n context bridge so `features/*` and `domain/*` components can call `useTranslation()` and render `<Trans>` instead of receiving translated strings as props.

  Both apps now build their i18next engine with an explicit `createInstance()` rather than the global singleton, and mount `<I18nProvider>` at their root alongside the existing `<I18nextProvider>`. Non-React call sites import the app instance (`~/renderer/i18n/init` on Desktop, `~/i18n/instance` on Mobile) instead of `i18next`, enforced by a lint rule.

  `@features/flow-pay-feature-tour` is the pilot: it resolves its own `payTab.featureTour.*` copy and no longer takes any copy props.

- [#21132](https://github.com/LedgerHQ/ledger-live/pull/21132) [`6cc7ac6`](https://github.com/LedgerHQ/ledger-live/commit/6cc7ac68b08cdb80b95c597495acd681ec25caca) Thanks [@dilaouid](https://github.com/dilaouid)! - chore(send): remove addressBook property from the coin descriptor

- [#21188](https://github.com/LedgerHQ/ledger-live/pull/21188) [`c8bb138`](https://github.com/LedgerHQ/ledger-live/commit/c8bb13851393d4b1a50a5ece62763ba43110ae6f) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(lwdm): ask ledger sync on add contact

- [#21291](https://github.com/LedgerHQ/ledger-live/pull/21291) [`d6b6687`](https://github.com/LedgerHQ/ledger-live/commit/d6b6687634e14f29bb25122d9097cf9a59aa7a17) Thanks [@deepyjr](https://github.com/deepyjr)! - Fix the QR scanner opening animation on mobile.

- [#21130](https://github.com/LedgerHQ/ledger-live/pull/21130) [`45eddc1`](https://github.com/LedgerHQ/ledger-live/commit/45eddc160aa44ac0712b9f99f13c3f20dc4d84cd) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Fix welcome screen story flicker: keep the stepper from snapping full before video durations load, rewind each story when it ends and when it comes on stage, and make the stepper follow playback even when the system asks for reduced motion

- [#21152](https://github.com/LedgerHQ/ledger-live/pull/21152) [`116f006`](https://github.com/LedgerHQ/ledger-live/commit/116f006fb7e1dc3ed7d97c41ec08b2340b66a12e) Thanks [@alexstapenka-ledger](https://github.com/alexstapenka-ledger)! - Add the `stableSavings` feature flag, forward it to Earn on initial load, and send it to Mixpanel as a boolean identify trait on desktop and mobile.

- [#21005](https://github.com/LedgerHQ/ledger-live/pull/21005) [`99533b3`](https://github.com/LedgerHQ/ledger-live/commit/99533b35e893352b45e378e5116c767c788642ed) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Wire mobile Braze consent toggles to the identity lifecycle

- [#21097](https://github.com/LedgerHQ/ledger-live/pull/21097) [`65d468b`](https://github.com/LedgerHQ/ledger-live/commit/65d468b17718b1d4df0e8483bec39a9e87a28fe5) Thanks [@sarneijim](https://github.com/sarneijim)! - Open the Ledger Recover deeplink instead of the intro bottom sheet when tapping Ledger Recover in the Backup hub

- [#21141](https://github.com/LedgerHQ/ledger-live/pull/21141) [`e2f2cfa`](https://github.com/LedgerHQ/ledger-live/commit/e2f2cfa372605742ff6ef29f4e56d9a77fdb86be) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Migrate the DeviceActionContent component into a new `@features/platform-device-action-content` package so DDD flows can render it, decoupling it from the `DeviceModelId` enum. Also render Lumen `Tag` labels and `Banner` titles as text in the shared web/native passthrough test stubs.

  The package now exposes `getDeviceActionAnimation`, and both apps resolve their pin/continue device animations through it instead of keeping byte-identical copies of the same 20 Lottie files each. This drops ~2.5 MB of duplicated animation JSON from the desktop and mobile bundles.

  `@features/platform-style` gains `useThemeVariant()`, returning the active `"light" | "dark"` variant from the style provider both apps already mount, plus a `./hooks` entry point so reading it doesn't pull the providers into a consumer's bundle. DeviceActionContent picks its animation through that hook, so neither app injects a theme any more and the component can be used from deeply nested `features/` trees. It reads the styled-components context directly rather than `useTheme`, which throws when no provider is mounted.

- [#21270](https://github.com/LedgerHQ/ledger-live/pull/21270) [`5b9df59`](https://github.com/LedgerHQ/ledger-live/commit/5b9df5970cb628dbfe592227231b66ff498f480c) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Map the DMK invalid firmware metadata error to a dedicated InvalidProvider blocking state, so the Device Intent Executor shows a clear "Invalid Provider" screen with a "Go to settings" action instead of a raw error

- [#21245](https://github.com/LedgerHQ/ledger-live/pull/21245) [`45ea28b`](https://github.com/LedgerHQ/ledger-live/commit/45ea28b19d1e950bf4e705388a06181a9a7543aa) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Provide the EVM address book to the DMK Ethereum signer, so registered contacts can be clear-signed.

  `toEvmAddressBook` maps the Contacts state to an `EvmAddressBook` snapshot, keeping EVM-family addresses only. Each app registers it on `evmAddressBookProvider` at its composition root, and `DmkSignerEth` reads it once per instance, so the recipient and the signing account are matched against the same snapshot. Records whose proof material does not decode are dropped, and signing is left untouched when no contact is usable.

  Ledger account contacts are not provided yet: the snapshot always carries an empty `ledgerAccounts`.

- [#21357](https://github.com/LedgerHQ/ledger-live/pull/21357) [`9f0b607`](https://github.com/LedgerHQ/ledger-live/commit/9f0b607a0e177c1f7474c649e3b5dd7b7924c8aa) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Resolve Pay deposit-options copy inside `@features/flow-pay-deposit` through `@shared/i18n` instead of receiving translated strings as props. The deposit options view-model now calls `useTranslation()` for its `payTab.deposit.*` keys, so both apps stop building `DepositOptionsLabels` and passing them to `useDepositOptionsAdapter`.

- [#21049](https://github.com/LedgerHQ/ledger-live/pull/21049) [`27ea1f5`](https://github.com/LedgerHQ/ledger-live/commit/27ea1f524b3fd4db75f54ef21d163a0815cb6d5d) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(send): select which address of a contact receives the funds in the Send recipient step

### Patch Changes

- Updated dependencies [[`dd9fe60`](https://github.com/LedgerHQ/ledger-live/commit/dd9fe60055d1b97a175bb701d98129c79a1ef33b), [`edad3fb`](https://github.com/LedgerHQ/ledger-live/commit/edad3fb2dc1fea0277418374b5ebee9c9860f448), [`0b024e8`](https://github.com/LedgerHQ/ledger-live/commit/0b024e8214eb3635d42c18986aa983bd1501c985), [`244454b`](https://github.com/LedgerHQ/ledger-live/commit/244454ba821c5590a56b4b0e5e5ec6ca2436e6ab), [`7d02f4b`](https://github.com/LedgerHQ/ledger-live/commit/7d02f4bbdc49f57df242d47b55ebd21c5176f4de), [`545e419`](https://github.com/LedgerHQ/ledger-live/commit/545e4191a1b059058a20f30bdd1925b7c78e682c), [`7fae8f5`](https://github.com/LedgerHQ/ledger-live/commit/7fae8f5f7f22aa84933b734266de73cd9fa8a79c), [`a2be85c`](https://github.com/LedgerHQ/ledger-live/commit/a2be85cd773ae59e454cd33b9a38548ea5b003f8), [`5e45fdd`](https://github.com/LedgerHQ/ledger-live/commit/5e45fddee9f3483ac3daa7b93f58b01e725e6d4b), [`e6d6ed6`](https://github.com/LedgerHQ/ledger-live/commit/e6d6ed6eda460eb614680b31a42ba8067cc28d2a), [`46f41d2`](https://github.com/LedgerHQ/ledger-live/commit/46f41d2787191684f52e5dc85b0cd629901b13d8), [`f4986f8`](https://github.com/LedgerHQ/ledger-live/commit/f4986f882385e07dbd531d99a0571c67ca91ada0), [`ce47443`](https://github.com/LedgerHQ/ledger-live/commit/ce47443e97f559210443547a7948ef61c01f7feb), [`37cc17e`](https://github.com/LedgerHQ/ledger-live/commit/37cc17ea60f5a6c779aa7c5b5b6ae39d0bfea229), [`9a1a1df`](https://github.com/LedgerHQ/ledger-live/commit/9a1a1df2da9b612bd8d5533fba23b0ebc8b1a58f), [`a4f727d`](https://github.com/LedgerHQ/ledger-live/commit/a4f727d0c17d685302cf9ec2a39e752b2c9937fd), [`da47556`](https://github.com/LedgerHQ/ledger-live/commit/da475565799815dd17c4cb941068031e564da9b6), [`beaaa31`](https://github.com/LedgerHQ/ledger-live/commit/beaaa315b5c4d4ccea8145f3a309ba557f961118), [`83b019e`](https://github.com/LedgerHQ/ledger-live/commit/83b019e128b59a289a28184e58c33b108cd3f188), [`36b7fda`](https://github.com/LedgerHQ/ledger-live/commit/36b7fda667ed2bc281291ac25573e36ac7244532), [`a29f6a0`](https://github.com/LedgerHQ/ledger-live/commit/a29f6a098921d6216596d4c6a0329f39153e3cfa), [`d4d3258`](https://github.com/LedgerHQ/ledger-live/commit/d4d3258b7a5b6d5e7ef9d5c9c6760bf42421c633), [`f99b720`](https://github.com/LedgerHQ/ledger-live/commit/f99b7205490cb4712eff99519444d7dd6903c02a), [`02c9ccf`](https://github.com/LedgerHQ/ledger-live/commit/02c9ccfb409317a72f0b29d1fb755214adc9e596), [`e723d82`](https://github.com/LedgerHQ/ledger-live/commit/e723d823688cd7f00d4b16549b45c62a500c8a9d), [`bb44e2c`](https://github.com/LedgerHQ/ledger-live/commit/bb44e2c4f8ce29b88394b15a17f7c698cb647e74), [`31223eb`](https://github.com/LedgerHQ/ledger-live/commit/31223ebdd9335ef14a3ae8712658d17de60924e5), [`c62986b`](https://github.com/LedgerHQ/ledger-live/commit/c62986b76467651009a571d64908405988b13571), [`cef29a0`](https://github.com/LedgerHQ/ledger-live/commit/cef29a0cd39ee1a7cfb6428ae650595b4479e4d6), [`0639bea`](https://github.com/LedgerHQ/ledger-live/commit/0639bea01c594c335fb9b0604ad9ffc331936d54), [`cdbc3ac`](https://github.com/LedgerHQ/ledger-live/commit/cdbc3acac0045ab860206e32062cc5c417d75196), [`114420e`](https://github.com/LedgerHQ/ledger-live/commit/114420ed119ae6c93969891acf97d61c2af42df4), [`60c41bd`](https://github.com/LedgerHQ/ledger-live/commit/60c41bddad7f1d02028d237cd10fc781baf8f674), [`46d23e1`](https://github.com/LedgerHQ/ledger-live/commit/46d23e1c719201910c0811da2a7a5a6849d93e25), [`b3a86f5`](https://github.com/LedgerHQ/ledger-live/commit/b3a86f5ae5ab80d6f09fa4e5f6738e3eacc696c8), [`e1c2a4b`](https://github.com/LedgerHQ/ledger-live/commit/e1c2a4bf3cabe5f58f8b3f8f226dfc90a0ab0296), [`a8c34d0`](https://github.com/LedgerHQ/ledger-live/commit/a8c34d0d9469b4e11339edfbef53445e58194fd8), [`aafcdb7`](https://github.com/LedgerHQ/ledger-live/commit/aafcdb70e59584d6580f080cfd167cce41e56c19), [`34fc080`](https://github.com/LedgerHQ/ledger-live/commit/34fc080bb0c4ec01528404dde38f7c25559ecebe), [`41faac4`](https://github.com/LedgerHQ/ledger-live/commit/41faac432e8c17e3718d90cc26ce6ae650800681), [`0df32c7`](https://github.com/LedgerHQ/ledger-live/commit/0df32c7f80d190522285002bfa6bffa0539f5b23), [`a334296`](https://github.com/LedgerHQ/ledger-live/commit/a334296eaeca54451650fc3a3d1c36d5c8b93b8d), [`2c70999`](https://github.com/LedgerHQ/ledger-live/commit/2c709990d3569bc50504822ce90c9e9024210312), [`1ef101a`](https://github.com/LedgerHQ/ledger-live/commit/1ef101ab6487c85c8753cccd8bb9adb0dbd2d489), [`911a996`](https://github.com/LedgerHQ/ledger-live/commit/911a996f2a6d999d194cadd4f842235cddbe1361), [`0500726`](https://github.com/LedgerHQ/ledger-live/commit/05007264f5b1726a21c2e545a10c18993fd2fcb5), [`c8614bf`](https://github.com/LedgerHQ/ledger-live/commit/c8614bfbfd1dc8de12731c2c333b9d137f0f2f93), [`aa8f4bf`](https://github.com/LedgerHQ/ledger-live/commit/aa8f4bff9059c9e462d02efb20a1b02fa426939a), [`1e0763e`](https://github.com/LedgerHQ/ledger-live/commit/1e0763e58c287365325643367a3e4a26ddf5884e), [`0127ebd`](https://github.com/LedgerHQ/ledger-live/commit/0127ebd36795e678cd4337b46d38c031d07756c1), [`3ff0cde`](https://github.com/LedgerHQ/ledger-live/commit/3ff0cde19eea9c76e0737afa023d0dd826bd6ee8), [`62008f0`](https://github.com/LedgerHQ/ledger-live/commit/62008f0bcb6b2bcb3a866111c774a66d0f048961), [`6f8acaf`](https://github.com/LedgerHQ/ledger-live/commit/6f8acaf912c5c515a8fb05382101785fded8bb06), [`3b3c696`](https://github.com/LedgerHQ/ledger-live/commit/3b3c696a3d857f474a64b25cff6389f4df3b2063), [`9faeaf8`](https://github.com/LedgerHQ/ledger-live/commit/9faeaf8f94495bb2b1df1483494cc3979f7cb835), [`5bcc7f1`](https://github.com/LedgerHQ/ledger-live/commit/5bcc7f1bacbe72f86c52548735c15e4a23137ee7), [`848b4bd`](https://github.com/LedgerHQ/ledger-live/commit/848b4bd3cccf6cb38f9e31ec39a0d4bc574c3fa2), [`6f4814b`](https://github.com/LedgerHQ/ledger-live/commit/6f4814b8c0e0c1c06b6729f036d756206ed19d77), [`27388a8`](https://github.com/LedgerHQ/ledger-live/commit/27388a894eaac67b8e162a60f6d3368aad0a8682), [`6cef6b5`](https://github.com/LedgerHQ/ledger-live/commit/6cef6b5341c30850aa74159bdbdea0a18f89de4c), [`09af9b1`](https://github.com/LedgerHQ/ledger-live/commit/09af9b1b9f7c39db4c6d0cbd1a038fd43784240b), [`ad1c0ff`](https://github.com/LedgerHQ/ledger-live/commit/ad1c0ff93b94ba9a0b1e7409e5ddbdc2d73bcd30), [`c20677f`](https://github.com/LedgerHQ/ledger-live/commit/c20677f1b5d13973883196e5665d6dd0ef7c58ba), [`5b78670`](https://github.com/LedgerHQ/ledger-live/commit/5b78670b9587b4ebfe47d0743da1be94b6d85193), [`1cf5583`](https://github.com/LedgerHQ/ledger-live/commit/1cf55832f785fc57881169092f1190fa7ddfecf9), [`c8bb138`](https://github.com/LedgerHQ/ledger-live/commit/c8bb13851393d4b1a50a5ece62763ba43110ae6f), [`116f006`](https://github.com/LedgerHQ/ledger-live/commit/116f006fb7e1dc3ed7d97c41ec08b2340b66a12e), [`9a3746d`](https://github.com/LedgerHQ/ledger-live/commit/9a3746d7442c10649e183aaefeca2d7f51d4797f), [`e2f2cfa`](https://github.com/LedgerHQ/ledger-live/commit/e2f2cfa372605742ff6ef29f4e56d9a77fdb86be), [`5b9df59`](https://github.com/LedgerHQ/ledger-live/commit/5b9df5970cb628dbfe592227231b66ff498f480c), [`cf9a982`](https://github.com/LedgerHQ/ledger-live/commit/cf9a9820f9b1ae7405e9bdf3f4947d0f99bb68dd), [`45ea28b`](https://github.com/LedgerHQ/ledger-live/commit/45ea28b19d1e950bf4e705388a06181a9a7543aa), [`f0f9990`](https://github.com/LedgerHQ/ledger-live/commit/f0f999034f698b4e0e35928d5cf43a365ed3fef0), [`9f0b607`](https://github.com/LedgerHQ/ledger-live/commit/9f0b607a0e177c1f7474c649e3b5dd7b7924c8aa), [`9d5a6d9`](https://github.com/LedgerHQ/ledger-live/commit/9d5a6d980442ac78bcc1c3c12fbfee389aa8e0c9)]:
  - @features/flow-pay-request@0.3.0-next.0
  - @ledgerhq/transaction-observability@0.2.0-next.0
  - @shared/ui-queued-bottom-sheet@0.2.0-next.0
  - @features/flow-contacts@0.9.0-next.0
  - @features/platform-contacts@0.5.0-next.0
  - @features/flow-contacts-add-contact@0.5.0-next.0
  - @features/flow-contacts-edit-contact@0.3.0-next.0
  - @shared/ui-info-state@0.2.0-next.0
  - @features/platform-verify-address-intent@0.3.0-next.0
  - @shared/env@0.5.0-next.0
  - @domain/entity-currency-crypto@0.11.0-next.0
  - @features/flow-contacts-introduction@1.0.0-next.0
  - @features/flow-pay-card@0.2.0-next.0
  - @shared/api-services@0.6.0-next.0
  - @ledgerhq/coin-canton@1.1.0-next.0
  - @ledgerhq/coin-casper@3.2.0-next.0
  - @ledgerhq/coin-concordium@1.1.0-next.0
  - @ledgerhq/coin-cosmos@1.1.0-next.0
  - @ledgerhq/coin-evm@5.2.0-next.0
  - @ledgerhq/coin-filecoin@2.1.0-next.0
  - @ledgerhq/coin-multiversx@1.1.0-next.0
  - @ledgerhq/coin-stacks@0.30.0-next.0
  - @features/flow-contacts-list@0.5.0-next.0
  - @features/flow-contacts-delete-contact@0.2.0-next.0
  - @features/flow-contacts-edit-address@0.2.0-next.0
  - @features/flow-contacts-add-address@0.3.0-next.0
  - @features/flow-pay-contact@0.2.0-next.0
  - @features/flow-pay-balance@0.4.0-next.0
  - @features/flow-pay-deposit@0.3.0-next.0
  - @shared/auth@0.6.0-next.0
  - @shared/cloud-sync@0.3.0-next.0
  - @shared/feature-flags@0.21.0-next.0
  - @features/platform-currencies@0.7.0-next.0
  - @domain/api-currency-token@0.6.0-next.0
  - @features/flow-pay-card-auth@0.5.0-next.0
  - @ledgerhq/types-live@6.122.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.2.0-next.0
  - @ledgerhq/live-dmk-shared@0.32.0-next.0
  - @features/flow-pay-feature-tour@0.4.0-next.0
  - @devtools/bindings@0.6.0-next.0
  - @shared/i18n@0.2.0-next.0
  - @features/platform-device-action-content@0.2.0-next.0
  - @features/platform-style@0.3.0-next.0
  - @ledgerhq/live-signer-evm@0.23.0-next.0
  - @features/platform-device-intent@5.2.0-next.0
  - @domain/api-aggregated-assets@0.4.2-next.0
  - @features/platform-aggregated-assets@0.5.1-next.0
  - @features/platform-env@0.2.3-next.0
  - @ledgerhq/ledger-key-ring-protocol@0.21.1-next.0
  - @ledgerhq/live-dmk-mobile@0.29.6-next.0
  - @ledgerhq/live-dmk-speculos@0.10.7-next.0
  - @ledgerhq/wallet-analytics@0.3.6-next.0
  - @ledgerhq/wallet-pnl@0.7.9-next.0
  - @domain/entity-contact@0.8.1-next.0
  - @domain/entity-currency@0.4.2-next.0
  - @domain/entity-currency-token@0.5.1-next.0
  - @ledgerhq/coin-bitcoin@0.51.3-next.0
  - @ledgerhq/live-currency-format@0.14.3-next.0
  - @ledgerhq/live-wallet@1.1.1-next.0
  - @domain/api-altcoins-sentiment@0.3.4-next.0
  - @domain/api-currency-fiat@0.4.3-next.0
  - @domain/api-market-sentiment@0.3.4-next.0
  - @domain/api-push-devices@0.2.4-next.0
  - @domain/entity-account-name@0.2.2-next.0
  - @domain/entity-recent-addresses@0.2.1-next.0
  - @features/platform-wallet-sync@0.1.3-next.0
  - @features/flow-large-screen-upsell@2.0.1-next.0
  - @features/platform-feature-flags@0.6.8-next.0
  - @domain/entity-analytics-consent@0.2.2-next.0
  - @features/flow-app-lock@0.2.0
  - @features/platform-card@0.3.1-next.0
  - @ledgerhq/device-core@0.11.14-next.0
  - @ledgerhq/domain-service@1.8.17-next.0
  - @ledgerhq/live-countervalues@0.24.5-next.0
  - @ledgerhq/live-countervalues-react@0.16.9-next.0
  - @devtools/shell@0.9.1-next.0
  - @features/flow-analytics-consent@0.2.4-next.0

## 4.18.0

### Minor Changes

- [#20911](https://github.com/LedgerHQ/ledger-live/pull/20911) [`4014093`](https://github.com/LedgerHQ/ledger-live/commit/4014093fe5fb899fdeae22f12b24c07540d2b2bf) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Expose useOpenPrefillAddAddressFlow and mount PrefillAddAddressFlowRoot on Desktop and Mobile so consumers such as Send can open the prefilled Add Address flow without depending on Contacts internals.

- [#21025](https://github.com/LedgerHQ/ledger-live/pull/21025) [`de982e6`](https://github.com/LedgerHQ/ledger-live/commit/de982e6a9ef6e2a27789212bee2729c7141193ad) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix Contacts edit flow so the device connection prompt appears after saving a contact name or address, not before opening the edit form.

- [#20874](https://github.com/LedgerHQ/ledger-live/pull/20874) [`1d6c394`](https://github.com/LedgerHQ/ledger-live/commit/1d6c39482047fef5b86a4b9511a3e8a1956e30a1) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Warn Backup Hub Recovery Key for Nano S, SP and X and open the upgrade landing page

- [#20727](https://github.com/LedgerHQ/ledger-live/pull/20727) [`53938d6`](https://github.com/LedgerHQ/ledger-live/commit/53938d6669a1e8cbc4e2e21f0e038762da047abe) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwdm): add the contact avatar component in the new send flow

- [#20847](https://github.com/LedgerHQ/ledger-live/pull/20847) [`197acad`](https://github.com/LedgerHQ/ledger-live/commit/197acad8c74b6fe833ce8dbf78db472643b00819) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the two app lock packages the User App Authentication tickets build on: `@shared/password-verifier` (the verifier record and its constant-time comparison) and `@features/platform-app-lock` (protection state schemas, biometrics status unions and errors).

  No functional change to Ledger Wallet Mobile: `react-native-keychain` now resolves through the pnpm catalog instead of a direct pin, so the app and `@features/platform-app-lock` cannot drift apart. It still resolves to 10.0.0.

- [#20988](https://github.com/LedgerHQ/ledger-live/pull/20988) [`5bd3557`](https://github.com/LedgerHQ/ledger-live/commit/5bd3557bf160876d9a0a392f0bbe1841083560cb) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the two-step form for setting an app lock password, behind `lwmPasswordRevamp`. The legacy screens stay on the flag-off path untouched.

  `@features/flow-app-lock` gains one shared password field that every password surface will use, the two entry steps as ViewModel and View, and a draft that carries the chosen password from the first step to the second in memory — not through navigation state, which is serialisable and gets persisted. `@features/platform-app-lock` gains the minimum-length rule, which the migration off short passwords will need as well.

  Nothing is stored yet: confirming closes the flow and leaves the Settings switch off until the verifier lands.

- [#21165](https://github.com/LedgerHQ/ledger-live/pull/21165) [`e903cf0`](https://github.com/LedgerHQ/ledger-live/commit/e903cf05f66c5fbef8e221a1cbe7aa0e8b811257) Thanks [@sarneijim](https://github.com/sarneijim)! - Add missing Touchscreen Upgrade Program tracking for Backup Hub Recovery Key upsell and Lazy Onboarding Banner (LIVE-36494)

- [#20993](https://github.com/LedgerHQ/ledger-live/pull/20993) [`2a4b4b1`](https://github.com/LedgerHQ/ledger-live/commit/2a4b4b195a6074b0197e022f7c3ad3cc51b9cf90) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Move Aptos and crypto_org account migrations out of DataModel into app-level accountModel

- [#20810](https://github.com/LedgerHQ/ledger-live/pull/20810) [`bb045d8`](https://github.com/LedgerHQ/ledger-live/commit/bb045d88e3cbeb411643acfc26252e8cb1ce39ac) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Complete the Pay Card login from the Baanx redirect (LIVE-34742)

  An XState 5 machine now owns the journey: it mints and stores the PKCE attempt, starts the
  authorization, opens the OS browser, compares the `state` on the redirect, exchanges the code, stores
  the session, and reads `GET /v1/user` into the RTK Query cache. On mobile the redirect arrives either
  from the browser session or from the `ledgerlive://paytab?code=…&state=…` deep link, and the first one
  wins. `CardLogin` shows the login action only when there is something to log in to, and renders nothing
  once the user is signed in.

- [#20899](https://github.com/LedgerHQ/ledger-live/pull/20899) [`5a30d71`](https://github.com/LedgerHQ/ledger-live/commit/5a30d71a0910bcfeb75a9cface524d7f942f1a7c) Thanks [@deepyjr](https://github.com/deepyjr)! - Allow Contacts address groups to be resolved from a contact ID.

- [#20917](https://github.com/LedgerHQ/ledger-live/pull/20917) [`f427599`](https://github.com/LedgerHQ/ledger-live/commit/f42759916771b6445544255700082ccdaa3466c4) Thanks [@deepyjr](https://github.com/deepyjr)! - Allow numbers in contact names and hide add-contact actions when a Contacts search has no results.

- [#21023](https://github.com/LedgerHQ/ledger-live/pull/21023) [`dcd5af5`](https://github.com/LedgerHQ/ledger-live/commit/dcd5af59cf4b3f498af98d1362d5bee246093047) Thanks [@deepyjr](https://github.com/deepyjr)! - Animate transitions between Contacts add-address flow steps.

- [#20991](https://github.com/LedgerHQ/ledger-live/pull/20991) [`3bea41d`](https://github.com/LedgerHQ/ledger-live/commit/3bea41dcb6a5ef8d26547be31dee94bc42448e46) Thanks [@jeportie](https://github.com/jeportie)! - Assert the mobile Buy/Sell handoff instead of the partner's checkout page, matching what
  `e2e/desktop` already does. The app records the `WebPTXPlayer` handoff URL in a
  `Config.DETOX`-guarded store and exposes it over the e2e bridge as `getPtxHandoff`, so the
  specs verify the provider and query parameters without ever loading Transak's or MoonPay's
  site — removing a dependency on a third party's uptime, and the ~70s per test spent waiting
  on it. Parsing lives in `libs/live-e2e-shared/src/buySellHandoff.ts` and handles the
  double-encoded URL that made `new URL()` throw, plus provider aliases such as Mercuryo's
  `mrcr`. Also fixes the sell flow asserting a minimum amount the flow never types, since it
  taps the 75% button, and makes the "Buy and sell query parameters" test actually assert
  query parameters.

- [#20934](https://github.com/LedgerHQ/ledger-live/pull/20934) [`d8c04dd`](https://github.com/LedgerHQ/ledger-live/commit/d8c04ddf5e8bc7a6994d59475e12381dd28f403a) Thanks [@deepyjr](https://github.com/deepyjr)! - Fix Contacts entry point styling and return navigation to Ledger Wallet addresses.

- [#20659](https://github.com/LedgerHQ/ledger-live/pull/20659) [`d6623e5`](https://github.com/LedgerHQ/ledger-live/commit/d6623e5225f62a86226bac1abf253b1edbc248ed) Thanks [@koda-apps](https://github.com/apps/koda-apps)! - Fix post-onboarding hub drawer height to follow its content

- [#20966](https://github.com/LedgerHQ/ledger-live/pull/20966) [`9470502`](https://github.com/LedgerHQ/ledger-live/commit/947050267c2733e7d0087865d2e9b29edf7f6413) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Scaffold Contacts Device Intent Executor contracts and colocate platform definitions

- [#20809](https://github.com/LedgerHQ/ledger-live/pull/20809) [`e732d3e`](https://github.com/LedgerHQ/ledger-live/commit/e732d3e258c653fc83e1474434f3bb02c136ae62) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Keep the Pay Card session in OS secure storage (LIVE-34742)

  `cardSession` now stores the whole session — both tokens and both lifetimes — through
  `react-native-keychain` on native, and through renderer memory on web and desktop. The app already
  uses that library for the app password, so the session needs no second secure-storage package.

  Each key is a keychain `service` of its own, and the access token sits alone in one of them, so the
  base query reads one small value per request. `AFTER_FIRST_UNLOCK` on iOS and `AES_GCM_NO_AUTH` on
  Android state the same rule: no prompt, and a value a background launch can read, but nothing before
  the first unlock after boot.

  `cardSession.get` reads all three keys, so it waits its turn behind a write. A login over a live
  session replaces the two cold keys before the access token, and a read between the two would report
  the previous access token with the new refresh token.

- [#20872](https://github.com/LedgerHQ/ledger-live/pull/20872) [`d4bb463`](https://github.com/LedgerHQ/ledger-live/commit/d4bb46367e40a98a454c72e71ccc73b2dc75b417) Thanks [@deepyjr](https://github.com/deepyjr)! - Fix Contact sharing and align empty address copy

- [#20891](https://github.com/LedgerHQ/ledger-live/pull/20891) [`97f35b3`](https://github.com/LedgerHQ/ledger-live/commit/97f35b35c198475c575be8fc35f55d92a35b7099) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Enable editing a saved contact address value on mobile with validation and analytics.

- [#21018](https://github.com/LedgerHQ/ledger-live/pull/21018) [`903e0da`](https://github.com/LedgerHQ/ledger-live/commit/903e0da68917f662f2c801e269b88858a2ac6cf2) Thanks [@ishaba](https://github.com/ishaba)! - fix(canton): fix kiln validator name typo in setup copy

- [#20992](https://github.com/LedgerHQ/ledger-live/pull/20992) [`4fc5ef0`](https://github.com/LedgerHQ/ledger-live/commit/4fc5ef09554a541cbf6a497f227df4373bb06470) Thanks [@jeportie](https://github.com/jeportie)! - Record `fetch` traffic in the e2e network log alongside axios, so RTK Query — and therefore
  every CAL token lookup — is no longer invisible in CI artifacts, and attach a per-host
  summary with peak concurrency so a fan-out is legible without reading several hundred
  entries. Query strings, fragments and any `user:pass@` userinfo are stripped before a URL is
  recorded, and no bodies or headers are captured.

- [#20887](https://github.com/LedgerHQ/ledger-live/pull/20887) [`aa39333`](https://github.com/LedgerHQ/ledger-live/commit/aa393339789242783b168398cb5122a7f1e3f620) Thanks [@fAnselmi-Ledger](https://github.com/fAnselmi-Ledger)! - Add Solana TXC flag

- [#20776](https://github.com/LedgerHQ/ledger-live/pull/20776) [`14b6b12`](https://github.com/LedgerHQ/ledger-live/commit/14b6b129738f3c54f2c56be2667b2dc7e2d2f97f) Thanks [@cunhabruno](https://github.com/cunhabruno)! - Fix the receive verify-address drawer becoming unusable a few seconds after opening on Android

  The drawer opened correctly, then snapped back off-screen after 3-4 seconds and left an opaque backdrop with nothing tappable. It prevents backdrop dismissal, so the only way out was to force-quit the app mid receive flow.

  `useAnimatedStyle` only writes its initial value into the Fabric shadow tree, which still held the closed position while the drawer was open. Any commit outside Reanimated's commit hook re-applied it, and nothing wrote the transform again because the open animation had long finished. The resting position is now mirrored in React state and declared after the animated style, so such a commit settles on open. The same applies to the backdrop opacity and to the security modal's scroll view height, which collapsed to zero for the same reason.

- [#21036](https://github.com/LedgerHQ/ledger-live/pull/21036) [`c98a1b9`](https://github.com/LedgerHQ/ledger-live/commit/c98a1b9e3a86f4c9fb6c42e8837aef5ae58af8ea) Thanks [@vpenskyi-ledger](https://github.com/vpenskyi-ledger)! - Fix: sell quotes now correctly shown when returning from a provider via "Back to quote". Previously, BuySellUI defaulted to buy mode because the stored flow name was not passed back during navigation. Desktop also removed a hardcoded `|| "buy"` fallback when saving the flow name to localStorage.

- [#21063](https://github.com/LedgerHQ/ledger-live/pull/21063) [`c566744`](https://github.com/LedgerHQ/ledger-live/commit/c566744a1a52db2843b3edeeb57c22043e704655) Thanks [@deepyjr](https://github.com/deepyjr)! - Persist Contacts locally and synchronize them through Ledger Sync.

- [#21014](https://github.com/LedgerHQ/ledger-live/pull/21014) [`e1c2a4b`](https://github.com/LedgerHQ/ledger-live/commit/e1c2a4bf3cabe5f58f8b3f8f226dfc90a0ab0296) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix Pay tab bottom sheets so the filter opens expanded and deposit options stay fully visible

- [#21001](https://github.com/LedgerHQ/ledger-live/pull/21001) [`c0bdd70`](https://github.com/LedgerHQ/ledger-live/commit/c0bdd7075816b44d245832849b28e16f7a169006) Thanks [@KVNLS](https://github.com/KVNLS)! - Prevent keypair generation at each startup and remove zod valdiation which is coslty at startup

- [#21044](https://github.com/LedgerHQ/ledger-live/pull/21044) [`b2a2e9e`](https://github.com/LedgerHQ/ledger-live/commit/b2a2e9ecec155c4ff3fdefa0b22e0ac2226bf830) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(send): search by contact name as recipient in the send

- [#20782](https://github.com/LedgerHQ/ledger-live/pull/20782) [`6c425e0`](https://github.com/LedgerHQ/ledger-live/commit/6c425e0e869c6feed4bd4c87ee0fef5443617708) Thanks [@shazzzam](https://github.com/shazzzam)! - Surface ICP neuron staking entry points on mobile: Stake and Manage Neurons account-header actions,
  gated behind the new `llmIcpStaking` feature flag. The StakingFlow and NeuronManageFlow navigators
  are registered as stubs and their screens land separately.

- [#20730](https://github.com/LedgerHQ/ledger-live/pull/20730) [`eccbacf`](https://github.com/LedgerHQ/ledger-live/commit/eccbacf5d8b167aed4f49418b0bca52100508307) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Wire Mobile Contacts scenario entry points to the shared analytics contract.

- [#20513](https://github.com/LedgerHQ/ledger-live/pull/20513) [`e80c178`](https://github.com/LedgerHQ/ledger-live/commit/e80c1780e29899cdbec2db504370ff1e6e0f7b93) Thanks [@vpenskyi-ledger](https://github.com/vpenskyi-ledger)! - Fix infinite loader on Exchange when closing account selection drawer with no accounts

- [#20799](https://github.com/LedgerHQ/ledger-live/pull/20799) [`585d8d7`](https://github.com/LedgerHQ/ledger-live/commit/585d8d78d5e153186c39ee2abfcdb7dc4a5d06e0) Thanks [@ishaba](https://github.com/ishaba)! - Migrate Tron to the generic coin framework (LIVE-34994).

  Adds a per-family pending-operation `extra` to the generic framework: `OptimisticOperationDescriptor` gains an optional `extra` bag and `describeOptimisticOperation` receives the transaction it describes, with framework-reserved keys stripped so a family cannot shadow them.

- [#21116](https://github.com/LedgerHQ/ledger-live/pull/21116) [`6bf8331`](https://github.com/LedgerHQ/ledger-live/commit/6bf833159a6533b2196d9fde9be2533b72c3521b) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Stack the LNS upsell banner above the hardware carousel instead of squeezing it into a tile slot, share a carousel with action cards only on mobile, and stop the Content Cards QA console from collapsing every Top wallet preset into the "alwayson" category

- [#20996](https://github.com/LedgerHQ/ledger-live/pull/20996) [`d6c7592`](https://github.com/LedgerHQ/ledger-live/commit/d6c7592278f2eed430c0451dd1b0a99fdf5b377d) Thanks [@CremaFR](https://github.com/CremaFR)! - Forward the `llmWalletApiDeviceIntentSign` assignment to the swap live app on mobile as `llmWalletApiDeviceIntentSignVariant` (the `variantId`) and `llmWalletApiDeviceIntentSignEnabled` (the flag state). Resolve that per manifest through `useDeviceIntentSignAssignment`, which also backs the Wallet API UI hook. Report both attributes on Mixpanel via `getRemoteABTestingAttributes`.

- [#20669](https://github.com/LedgerHQ/ledger-live/pull/20669) [`f7e5005`](https://github.com/LedgerHQ/ledger-live/commit/f7e5005f306b306042e3022fcb299ef499e7491a) Thanks [@YazhuEth](https://github.com/YazhuEth)! - feat(lwd): display the contact name and avatar in the send header

  The Amount step now shows the matched contact instead of the truncated address, using the shared `ContactAvatar`. The Recipient card moves to the same component, so both steps render the same colour and initials.

- [#21041](https://github.com/LedgerHQ/ledger-live/pull/21041) [`f056cfc`](https://github.com/LedgerHQ/ledger-live/commit/f056cfc75f57e471b392058521a80c55fb5e0300) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - fix(solana): make default validator option for delegation summary

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

- [#21012](https://github.com/LedgerHQ/ledger-live/pull/21012) [`5e1aa3e`](https://github.com/LedgerHQ/ledger-live/commit/5e1aa3efc66420bce6850c337f94a02ebe0e1185) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix the Pay tab "Add stablecoin" receive flow on mobile to list the full stablecoin catalog by filtering the Modular Asset Drawer on the stablecoin category, instead of pre-selecting only the two default stablecoins (USDC/USDT)

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

- [#20920](https://github.com/LedgerHQ/ledger-live/pull/20920) [`0fda04b`](https://github.com/LedgerHQ/ledger-live/commit/0fda04b868c0c93c6bfaf7cedbe901e896ad176b) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Rename notifications prompt context hook to useNotificationsPrompt

- [#20977](https://github.com/LedgerHQ/ledger-live/pull/20977) [`fb4a5bc`](https://github.com/LedgerHQ/ledger-live/commit/fb4a5bc6d78301182f56572ffedbe28bc995f271) Thanks [@deepyjr](https://github.com/deepyjr)! - Open the amount step when sending to a saved contact.

- [#21056](https://github.com/LedgerHQ/ledger-live/pull/21056) [`9e997b2`](https://github.com/LedgerHQ/ledger-live/commit/9e997b2292a428b015c184381bfe2e17b04e08c6) Thanks [@sarneijim](https://github.com/sarneijim)! - Add missing tracking events for touchscreen upsell placements

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

- [#20921](https://github.com/LedgerHQ/ledger-live/pull/20921) [`cb2ccae`](https://github.com/LedgerHQ/ledger-live/commit/cb2ccaef244de1d6a69b7326dc370e762f987140) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Remove leftover notifications opt-in backward-compat and unused prompt hooks

- [#20862](https://github.com/LedgerHQ/ledger-live/pull/20862) [`c65db86`](https://github.com/LedgerHQ/ledger-live/commit/c65db86dc1cc7ecfc69934b8d624902ab29d91cb) Thanks [@deepyjr](https://github.com/deepyjr)! - Show unavailable Contacts asset and network options as disabled in the asset drawer.

- [#20880](https://github.com/LedgerHQ/ledger-live/pull/20880) [`79bd143`](https://github.com/LedgerHQ/ledger-live/commit/79bd143c2b2fe9dd4036ffbf2f75b82afc6e677f) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Hide accounts that cannot send from the send pickers, and accounts that cannot receive from the receive pickers (HyperCore)

- [#20892](https://github.com/LedgerHQ/ledger-live/pull/20892) [`5b7c2c7`](https://github.com/LedgerHQ/ledger-live/commit/5b7c2c78c0ab1e1b4892a74e9a0510b2b44d4a4b) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Add a Profile upsell banner on My Wallet for Nano S, SP and X

- [#20913](https://github.com/LedgerHQ/ledger-live/pull/20913) [`cbeeb18`](https://github.com/LedgerHQ/ledger-live/commit/cbeeb1823cca2b210f0260e5a879366df5e8bd65) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - select the network then the account on asset page

- [#21007](https://github.com/LedgerHQ/ledger-live/pull/21007) [`8f6e66f`](https://github.com/LedgerHQ/ledger-live/commit/8f6e66f9f3723750ae16e95550b4008cb6a91164) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(send): explain why the address book is unavailable for some families

- [#20555](https://github.com/LedgerHQ/ledger-live/pull/20555) [`9e0c703`](https://github.com/LedgerHQ/ledger-live/commit/9e0c703631379409b5a9bee047832e9ac147a249) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Isolate wallet sync module failures instead of failing the whole sync: the aggregator validates each module slice on its own and quarantines a broken one, preserving its raw distant value, while every other module keeps syncing. A quarantine is reported as the module key plus the failure kind only, never the offending data.

  A distant document is now typed as what it is — a `DistantDocument` (`Record<string, unknown>`) whose slices are trusted per module — instead of the aggregate of the module schemas that nothing validates. `parseDistantState` is removed: it cast an unvalidated document to a validated type, and the aggregator already narrows the document at runtime. `CloudSyncSDK` drops its `schema` constructor option, which was never applied to anything and only served to infer that same misleading type; the class is now parameterised by its document type directly.

  `recentAddresses` drops its corrupted-address repair path. `CorruptedNestedAddressDistantSchema` and the lenient `z.array(z.unknown())` wrapper that swallowed every bad entry are removed together: a corrupted distant entry now quarantines the module, so the slice is preserved verbatim and reported, instead of being silently rewritten — or, had only the transform been removed, silently dropped. The local-cache repair in `schema.ts`/`store.ts` is untouched; it migrates data on disk, which quarantine does not cover.

- [#21046](https://github.com/LedgerHQ/ledger-live/pull/21046) [`e11eebe`](https://github.com/LedgerHQ/ledger-live/commit/e11eebedce8093322ce9dd9140be2e1f29817735) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(send): add network-filtered contact selection to the Send recipient step on desktop and mobile

- [#20505](https://github.com/LedgerHQ/ledger-live/pull/20505) [`f4ed19f`](https://github.com/LedgerHQ/ledger-live/commit/f4ed19f310eeb9cfad9e56665b9c2f2b40097925) Thanks [@deepyjr](https://github.com/deepyjr)! - Connect Contacts mutations to Ledger Sync availability and activation on Desktop and Mobile.

- [#20854](https://github.com/LedgerHQ/ledger-live/pull/20854) [`f32bf30`](https://github.com/LedgerHQ/ledger-live/commit/f32bf306ae16af24a98aff16c9c2342f496b905c) Thanks [@ishaba](https://github.com/ishaba)! - fix(coin-sui): map device 0x8 on address-balance send to clear error

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

- [#20110](https://github.com/LedgerHQ/ledger-live/pull/20110) [`bdcf051`](https://github.com/LedgerHQ/ledger-live/commit/bdcf05147689786a630b124c8374497bc891ceb4) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Fix Swap: pressing "<" from the History screen after a multi-step swap now returns to the initial input form. Opening a Swap sub-screen no longer replaces the Main navigator when the Swap tab is the focused route (which unmounted the tab navigator and left the back button unable to navigate), and the webview reset is re-applied when the Swap tab regains focus if the live app is still on the page it was asked to leave.

- [#20955](https://github.com/LedgerHQ/ledger-live/pull/20955) [`39a676d`](https://github.com/LedgerHQ/ledger-live/commit/39a676d2f861d04913264e61100205b4f6044cf9) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix: move hedera envs to config/constants

- [#20860](https://github.com/LedgerHQ/ledger-live/pull/20860) [`60f343c`](https://github.com/LedgerHQ/ledger-live/commit/60f343ce0cbf9edc8ceebaf8c27bba380f58214c) Thanks [@YazhuEth](https://github.com/YazhuEth)! - chore: bump the Lumen packages to the latest pinned set

  `AddressInput` now accepts a `ReactNode` prefix, and `BaseInput` is no longer exported by Lumen. Both apps only consume Lumen internally, so their own public API is unchanged. The Lumen packages pin each other on exact versions, so they move together.

- [#21038](https://github.com/LedgerHQ/ledger-live/pull/21038) [`2247ceb`](https://github.com/LedgerHQ/ledger-live/commit/2247ceb17f2af64ecf1a23225a7a5a4773a55fce) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Connect the Modular Asset Drawer to the Pay tab Request action, filtered to stablecoins with account selection

### Patch Changes

- Updated dependencies [[`26d8617`](https://github.com/LedgerHQ/ledger-live/commit/26d86172869e47608dd0f0e26dfbc905dafa3588), [`a86fe14`](https://github.com/LedgerHQ/ledger-live/commit/a86fe1498de34b86c2a89077a02886a26c6e158a), [`de982e6`](https://github.com/LedgerHQ/ledger-live/commit/de982e6a9ef6e2a27789212bee2729c7141193ad), [`e6ad2f6`](https://github.com/LedgerHQ/ledger-live/commit/e6ad2f6eed4bf5e587a2880e7fa7be937e2764ee), [`6218989`](https://github.com/LedgerHQ/ledger-live/commit/6218989cc9b12b7574660a98c465a3899db0083e), [`1d6c394`](https://github.com/LedgerHQ/ledger-live/commit/1d6c39482047fef5b86a4b9511a3e8a1956e30a1), [`5bd3557`](https://github.com/LedgerHQ/ledger-live/commit/5bd3557bf160876d9a0a392f0bbe1841083560cb), [`98f4802`](https://github.com/LedgerHQ/ledger-live/commit/98f48028b931c5aabf364988c53488e6124cc42e), [`bb045d8`](https://github.com/LedgerHQ/ledger-live/commit/bb045d88e3cbeb411643acfc26252e8cb1ce39ac), [`5a30d71`](https://github.com/LedgerHQ/ledger-live/commit/5a30d71a0910bcfeb75a9cface524d7f942f1a7c), [`6560883`](https://github.com/LedgerHQ/ledger-live/commit/6560883682ff7af5f8e61ae79e29f8560ac3f8e2), [`f427599`](https://github.com/LedgerHQ/ledger-live/commit/f42759916771b6445544255700082ccdaa3466c4), [`e998478`](https://github.com/LedgerHQ/ledger-live/commit/e9984787e3352a399b107fc3d4e889ffb02d4fc2), [`5a630b2`](https://github.com/LedgerHQ/ledger-live/commit/5a630b2cb982168094177d9a3c21fdf163454ef8), [`d8c04dd`](https://github.com/LedgerHQ/ledger-live/commit/d8c04ddf5e8bc7a6994d59475e12381dd28f403a), [`9470502`](https://github.com/LedgerHQ/ledger-live/commit/947050267c2733e7d0087865d2e9b29edf7f6413), [`e732d3e`](https://github.com/LedgerHQ/ledger-live/commit/e732d3e258c653fc83e1474434f3bb02c136ae62), [`d4bb463`](https://github.com/LedgerHQ/ledger-live/commit/d4bb46367e40a98a454c72e71ccc73b2dc75b417), [`ce4ae4a`](https://github.com/LedgerHQ/ledger-live/commit/ce4ae4a61b4721d8d1ad7b9e8c82a182350d3be4), [`6084fcd`](https://github.com/LedgerHQ/ledger-live/commit/6084fcd6b848049b5240abf32b9ac940603576c0), [`b6bb5b5`](https://github.com/LedgerHQ/ledger-live/commit/b6bb5b537c4536890ca1959357cad1ea2ad5f5d5), [`f64ceec`](https://github.com/LedgerHQ/ledger-live/commit/f64ceecbdaccec2c56ace4cc459d670db5920b68), [`fec3bc8`](https://github.com/LedgerHQ/ledger-live/commit/fec3bc88bacd2705da38c5c5bf5e68e7d734c3b3), [`9fa2ab5`](https://github.com/LedgerHQ/ledger-live/commit/9fa2ab5eb2003fcade4e5821f1253ae27c1af82d), [`f0f10ca`](https://github.com/LedgerHQ/ledger-live/commit/f0f10cae65f1e2015afbac540ecdcd01548356a8), [`55b7e6d`](https://github.com/LedgerHQ/ledger-live/commit/55b7e6d50aa1e97da3b1ae3405263e99b5fe5bde), [`aa39333`](https://github.com/LedgerHQ/ledger-live/commit/aa393339789242783b168398cb5122a7f1e3f620), [`5125ac7`](https://github.com/LedgerHQ/ledger-live/commit/5125ac7d7c27a76541835d596c122f30d04e759b), [`46a0d30`](https://github.com/LedgerHQ/ledger-live/commit/46a0d30f0134786a0be5d1c1b671a9c7955a81e1), [`c566744`](https://github.com/LedgerHQ/ledger-live/commit/c566744a1a52db2843b3edeeb57c22043e704655), [`e1c2a4b`](https://github.com/LedgerHQ/ledger-live/commit/e1c2a4bf3cabe5f58f8b3f8f226dfc90a0ab0296), [`8003387`](https://github.com/LedgerHQ/ledger-live/commit/80033873ea4628cbf9af189c313f73d54b422fb2), [`c0bdd70`](https://github.com/LedgerHQ/ledger-live/commit/c0bdd7075816b44d245832849b28e16f7a169006), [`6c425e0`](https://github.com/LedgerHQ/ledger-live/commit/6c425e0e869c6feed4bd4c87ee0fef5443617708), [`73f303f`](https://github.com/LedgerHQ/ledger-live/commit/73f303fc9eed76b677d322628fe9f211d74807d5), [`1ba0ceb`](https://github.com/LedgerHQ/ledger-live/commit/1ba0ceb64143f29712b8c8d68871e12a4b6ad065), [`01c088d`](https://github.com/LedgerHQ/ledger-live/commit/01c088db6a0597a479f6371c3a3db81157ead41e), [`91dbf02`](https://github.com/LedgerHQ/ledger-live/commit/91dbf023257961c3f15725f57abf273d2190e3c5), [`585d8d7`](https://github.com/LedgerHQ/ledger-live/commit/585d8d78d5e153186c39ee2abfcdb7dc4a5d06e0), [`d6c7592`](https://github.com/LedgerHQ/ledger-live/commit/d6c7592278f2eed430c0451dd1b0a99fdf5b377d), [`d5ea888`](https://github.com/LedgerHQ/ledger-live/commit/d5ea888d3a154feeb29b452841749d358629b8c1), [`dd64855`](https://github.com/LedgerHQ/ledger-live/commit/dd648554ba49b37a69888d7cd87354ebdd22db20), [`ff7e5e0`](https://github.com/LedgerHQ/ledger-live/commit/ff7e5e0ed085c7fb895eeaad844c3e373e791b8b), [`33007b1`](https://github.com/LedgerHQ/ledger-live/commit/33007b1c0a68912d2cebecd96edb2fe797df17dd), [`8c438f9`](https://github.com/LedgerHQ/ledger-live/commit/8c438f9bec55614174c6faca7ebeb77c8e64aaef), [`fabb26b`](https://github.com/LedgerHQ/ledger-live/commit/fabb26be5baa28c00cfa05b4c94aa6a74d15c2ed), [`eba4d17`](https://github.com/LedgerHQ/ledger-live/commit/eba4d175ad10f1431a222a4fa98481ea4285e891), [`cad4f63`](https://github.com/LedgerHQ/ledger-live/commit/cad4f63be4a3b16880ab490195af1f17921e03c2), [`306a681`](https://github.com/LedgerHQ/ledger-live/commit/306a6813eaabfd67dc575bb7bdfc2b52892037df), [`9fa2ab5`](https://github.com/LedgerHQ/ledger-live/commit/9fa2ab5eb2003fcade4e5821f1253ae27c1af82d), [`582f422`](https://github.com/LedgerHQ/ledger-live/commit/582f422ec2fbe8bb852c7a847c3ee0ff0a01ab32), [`9e0c703`](https://github.com/LedgerHQ/ledger-live/commit/9e0c703631379409b5a9bee047832e9ac147a249), [`8161bac`](https://github.com/LedgerHQ/ledger-live/commit/8161bac542474212dfefc8519e714da345b03f71), [`f4ed19f`](https://github.com/LedgerHQ/ledger-live/commit/f4ed19f310eeb9cfad9e56665b9c2f2b40097925), [`a826856`](https://github.com/LedgerHQ/ledger-live/commit/a826856200049687f4b3b37f85bb588eaa4fb4a2), [`b3095f5`](https://github.com/LedgerHQ/ledger-live/commit/b3095f5500b76110b5ce2ed1f08aee9f346a40f3), [`fbc8036`](https://github.com/LedgerHQ/ledger-live/commit/fbc8036d9bd4e1cc30eea4233f05e8b0498c0e5e), [`d6f0c7d`](https://github.com/LedgerHQ/ledger-live/commit/d6f0c7dc9f85002d17f1fa8156b4dc4c2d94e36d), [`39a676d`](https://github.com/LedgerHQ/ledger-live/commit/39a676d2f861d04913264e61100205b4f6044cf9), [`3908965`](https://github.com/LedgerHQ/ledger-live/commit/3908965e8872b6502558b669897028d39c492f7e), [`41311d6`](https://github.com/LedgerHQ/ledger-live/commit/41311d69b2d29dac534c98f6bd2917f7b558c14e), [`79ee882`](https://github.com/LedgerHQ/ledger-live/commit/79ee882545ea85c8a17027bd685f4b99f1ec84cd), [`4c333ad`](https://github.com/LedgerHQ/ledger-live/commit/4c333ad80187596319d6e0042af331770fc1858e)]:
  - @ledgerhq/coin-evm@5.1.0
  - @features/flow-contacts-add-address@0.2.0
  - @features/flow-contacts@0.8.0
  - @features/flow-pay-card-request@0.2.0
  - @features/flow-large-screen-upsell@2.0.0
  - @features/flow-app-lock@0.2.0
  - @ledgerhq/coin-casper@3.1.0
  - @features/flow-pay-card-auth@0.4.0
  - @domain/entity-contact@0.8.0
  - @features/flow-contacts-list@0.4.0
  - @features/platform-contacts@0.4.0
  - @features/platform-card@0.3.0
  - @devtools/bindings@0.5.0
  - @devtools/shell@0.9.0
  - @devtools/transport-panel@0.6.0
  - @devtools/wire@0.5.0
  - @shared/api-services@0.5.0
  - @features/flow-contacts-add-contact@0.4.0
  - @features/platform-device-intent@5.1.0
  - @features/flow-contacts-edit-contact@0.2.0
  - @shared/feature-flags@0.20.0
  - @ledgerhq/types-live@6.121.0
  - @ledgerhq/live-wallet@1.1.0
  - @features/flow-pay-card-balance@0.3.0
  - @features/flow-pay-card-deposit@0.3.0
  - @ledgerhq/ledger-key-ring-protocol@0.21.0
  - @ledgerhq/ledger-wallet-framework@3.1.0
  - @shared/env@0.4.0
  - @features/platform-aggregated-assets@0.5.0
  - @shared/cloud-sync@0.2.0
  - @domain/entity-recent-addresses@0.2.0
  - @ledgerhq/coin-stacks@0.29.0
  - @features/flow-contacts-introduction@0.3.0
  - @domain/api-aggregated-assets@0.4.1
  - @domain/api-altcoins-sentiment@0.3.3
  - @domain/api-currency-fiat@0.4.2
  - @domain/api-currency-token@0.5.1
  - @domain/api-market-sentiment@0.3.3
  - @domain/api-push-devices@0.2.3
  - @features/platform-currencies@0.6.2
  - @features/platform-feature-flags@0.6.7
  - @ledgerhq/coin-bitcoin@0.51.2
  - @ledgerhq/coin-canton@1.0.1
  - @ledgerhq/coin-concordium@1.0.1
  - @ledgerhq/coin-cosmos@1.0.1
  - @ledgerhq/coin-filecoin@2.0.1
  - @ledgerhq/coin-multiversx@1.0.1
  - @ledgerhq/device-core@0.11.13
  - @ledgerhq/domain-service@1.8.16
  - @ledgerhq/live-countervalues@0.24.4
  - @ledgerhq/live-countervalues-react@0.16.8
  - @ledgerhq/wallet-analytics@0.3.5
  - @ledgerhq/wallet-pnl@0.7.8
  - @features/platform-env@0.2.2
  - @ledgerhq/live-dmk-mobile@0.29.5
  - @ledgerhq/live-dmk-speculos@0.10.6
  - @domain/entity-account-name@0.2.1
  - @features/platform-wallet-sync@0.1.2
  - @ledgerhq/live-currency-format@0.14.2
  - @features/flow-analytics-consent@0.2.3

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

- [#20874](https://github.com/LedgerHQ/ledger-live/pull/20874) [`1d6c394`](https://github.com/LedgerHQ/ledger-live/commit/1d6c39482047fef5b86a4b9511a3e8a1956e30a1) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Warn Backup Hub Recovery Key for Nano S, SP and X and open the upgrade landing page

- [#20727](https://github.com/LedgerHQ/ledger-live/pull/20727) [`53938d6`](https://github.com/LedgerHQ/ledger-live/commit/53938d6669a1e8cbc4e2e21f0e038762da047abe) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwdm): add the contact avatar component in the new send flow

- [#20847](https://github.com/LedgerHQ/ledger-live/pull/20847) [`197acad`](https://github.com/LedgerHQ/ledger-live/commit/197acad8c74b6fe833ce8dbf78db472643b00819) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the two app lock packages the User App Authentication tickets build on: `@shared/password-verifier` (the verifier record and its constant-time comparison) and `@features/platform-app-lock` (protection state schemas, biometrics status unions and errors).

  No functional change to Ledger Wallet Mobile: `react-native-keychain` now resolves through the pnpm catalog instead of a direct pin, so the app and `@features/platform-app-lock` cannot drift apart. It still resolves to 10.0.0.

- [#20988](https://github.com/LedgerHQ/ledger-live/pull/20988) [`5bd3557`](https://github.com/LedgerHQ/ledger-live/commit/5bd3557bf160876d9a0a392f0bbe1841083560cb) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the two-step form for setting an app lock password, behind `lwmPasswordRevamp`. The legacy screens stay on the flag-off path untouched.

  `@features/flow-app-lock` gains one shared password field that every password surface will use, the two entry steps as ViewModel and View, and a draft that carries the chosen password from the first step to the second in memory — not through navigation state, which is serialisable and gets persisted. `@features/platform-app-lock` gains the minimum-length rule, which the migration off short passwords will need as well.

  Nothing is stored yet: confirming closes the flow and leaves the Settings switch off until the verifier lands.

- [#20993](https://github.com/LedgerHQ/ledger-live/pull/20993) [`2a4b4b1`](https://github.com/LedgerHQ/ledger-live/commit/2a4b4b195a6074b0197e022f7c3ad3cc51b9cf90) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Move Aptos and crypto_org account migrations out of DataModel into app-level accountModel

- [#20810](https://github.com/LedgerHQ/ledger-live/pull/20810) [`bb045d8`](https://github.com/LedgerHQ/ledger-live/commit/bb045d88e3cbeb411643acfc26252e8cb1ce39ac) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Complete the Pay Card login from the Baanx redirect (LIVE-34742)

  An XState 5 machine now owns the journey: it mints and stores the PKCE attempt, starts the
  authorization, opens the OS browser, compares the `state` on the redirect, exchanges the code, stores
  the session, and reads `GET /v1/user` into the RTK Query cache. On mobile the redirect arrives either
  from the browser session or from the `ledgerlive://paytab?code=…&state=…` deep link, and the first one
  wins. `CardLogin` shows the login action only when there is something to log in to, and renders nothing
  once the user is signed in.

- [#20899](https://github.com/LedgerHQ/ledger-live/pull/20899) [`5a30d71`](https://github.com/LedgerHQ/ledger-live/commit/5a30d71a0910bcfeb75a9cface524d7f942f1a7c) Thanks [@deepyjr](https://github.com/deepyjr)! - Allow Contacts address groups to be resolved from a contact ID.

- [#20917](https://github.com/LedgerHQ/ledger-live/pull/20917) [`f427599`](https://github.com/LedgerHQ/ledger-live/commit/f42759916771b6445544255700082ccdaa3466c4) Thanks [@deepyjr](https://github.com/deepyjr)! - Allow numbers in contact names and hide add-contact actions when a Contacts search has no results.

- [#21023](https://github.com/LedgerHQ/ledger-live/pull/21023) [`dcd5af5`](https://github.com/LedgerHQ/ledger-live/commit/dcd5af59cf4b3f498af98d1362d5bee246093047) Thanks [@deepyjr](https://github.com/deepyjr)! - Animate transitions between Contacts add-address flow steps.

- [#20991](https://github.com/LedgerHQ/ledger-live/pull/20991) [`3bea41d`](https://github.com/LedgerHQ/ledger-live/commit/3bea41dcb6a5ef8d26547be31dee94bc42448e46) Thanks [@jeportie](https://github.com/jeportie)! - Assert the mobile Buy/Sell handoff instead of the partner's checkout page, matching what
  `e2e/desktop` already does. The app records the `WebPTXPlayer` handoff URL in a
  `Config.DETOX`-guarded store and exposes it over the e2e bridge as `getPtxHandoff`, so the
  specs verify the provider and query parameters without ever loading Transak's or MoonPay's
  site — removing a dependency on a third party's uptime, and the ~70s per test spent waiting
  on it. Parsing lives in `libs/live-e2e-shared/src/buySellHandoff.ts` and handles the
  double-encoded URL that made `new URL()` throw, plus provider aliases such as Mercuryo's
  `mrcr`. Also fixes the sell flow asserting a minimum amount the flow never types, since it
  taps the 75% button, and makes the "Buy and sell query parameters" test actually assert
  query parameters.

- [#20934](https://github.com/LedgerHQ/ledger-live/pull/20934) [`d8c04dd`](https://github.com/LedgerHQ/ledger-live/commit/d8c04ddf5e8bc7a6994d59475e12381dd28f403a) Thanks [@deepyjr](https://github.com/deepyjr)! - Fix Contacts entry point styling and return navigation to Ledger Wallet addresses.

- [#20659](https://github.com/LedgerHQ/ledger-live/pull/20659) [`d6623e5`](https://github.com/LedgerHQ/ledger-live/commit/d6623e5225f62a86226bac1abf253b1edbc248ed) Thanks [@koda-apps](https://github.com/apps/koda-apps)! - Fix post-onboarding hub drawer height to follow its content

- [#20966](https://github.com/LedgerHQ/ledger-live/pull/20966) [`9470502`](https://github.com/LedgerHQ/ledger-live/commit/947050267c2733e7d0087865d2e9b29edf7f6413) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Scaffold Contacts Device Intent Executor contracts and colocate platform definitions

- [#20809](https://github.com/LedgerHQ/ledger-live/pull/20809) [`e732d3e`](https://github.com/LedgerHQ/ledger-live/commit/e732d3e258c653fc83e1474434f3bb02c136ae62) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Keep the Pay Card session in OS secure storage (LIVE-34742)

  `cardSession` now stores the whole session — both tokens and both lifetimes — through
  `react-native-keychain` on native, and through renderer memory on web and desktop. The app already
  uses that library for the app password, so the session needs no second secure-storage package.

  Each key is a keychain `service` of its own, and the access token sits alone in one of them, so the
  base query reads one small value per request. `AFTER_FIRST_UNLOCK` on iOS and `AES_GCM_NO_AUTH` on
  Android state the same rule: no prompt, and a value a background launch can read, but nothing before
  the first unlock after boot.

  `cardSession.get` reads all three keys, so it waits its turn behind a write. A login over a live
  session replaces the two cold keys before the access token, and a read between the two would report
  the previous access token with the new refresh token.

- [#20872](https://github.com/LedgerHQ/ledger-live/pull/20872) [`d4bb463`](https://github.com/LedgerHQ/ledger-live/commit/d4bb46367e40a98a454c72e71ccc73b2dc75b417) Thanks [@deepyjr](https://github.com/deepyjr)! - Fix Contact sharing and align empty address copy

- [#20891](https://github.com/LedgerHQ/ledger-live/pull/20891) [`97f35b3`](https://github.com/LedgerHQ/ledger-live/commit/97f35b35c198475c575be8fc35f55d92a35b7099) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Enable editing a saved contact address value on mobile with validation and analytics.

- [#21018](https://github.com/LedgerHQ/ledger-live/pull/21018) [`903e0da`](https://github.com/LedgerHQ/ledger-live/commit/903e0da68917f662f2c801e269b88858a2ac6cf2) Thanks [@ishaba](https://github.com/ishaba)! - fix(canton): fix kiln validator name typo in setup copy

- [#20992](https://github.com/LedgerHQ/ledger-live/pull/20992) [`4fc5ef0`](https://github.com/LedgerHQ/ledger-live/commit/4fc5ef09554a541cbf6a497f227df4373bb06470) Thanks [@jeportie](https://github.com/jeportie)! - Record `fetch` traffic in the e2e network log alongside axios, so RTK Query — and therefore
  every CAL token lookup — is no longer invisible in CI artifacts, and attach a per-host
  summary with peak concurrency so a fan-out is legible without reading several hundred
  entries. Query strings, fragments and any `user:pass@` userinfo are stripped before a URL is
  recorded, and no bodies or headers are captured.

- [#20887](https://github.com/LedgerHQ/ledger-live/pull/20887) [`aa39333`](https://github.com/LedgerHQ/ledger-live/commit/aa393339789242783b168398cb5122a7f1e3f620) Thanks [@fAnselmi-Ledger](https://github.com/fAnselmi-Ledger)! - Add Solana TXC flag

- [#20776](https://github.com/LedgerHQ/ledger-live/pull/20776) [`14b6b12`](https://github.com/LedgerHQ/ledger-live/commit/14b6b129738f3c54f2c56be2667b2dc7e2d2f97f) Thanks [@cunhabruno](https://github.com/cunhabruno)! - Fix the receive verify-address drawer becoming unusable a few seconds after opening on Android

  The drawer opened correctly, then snapped back off-screen after 3-4 seconds and left an opaque backdrop with nothing tappable. It prevents backdrop dismissal, so the only way out was to force-quit the app mid receive flow.

  `useAnimatedStyle` only writes its initial value into the Fabric shadow tree, which still held the closed position while the drawer was open. Any commit outside Reanimated's commit hook re-applied it, and nothing wrote the transform again because the open animation had long finished. The resting position is now mirrored in React state and declared after the animated style, so such a commit settles on open. The same applies to the backdrop opacity and to the security modal's scroll view height, which collapsed to zero for the same reason.

- [#21036](https://github.com/LedgerHQ/ledger-live/pull/21036) [`c98a1b9`](https://github.com/LedgerHQ/ledger-live/commit/c98a1b9e3a86f4c9fb6c42e8837aef5ae58af8ea) Thanks [@vpenskyi-ledger](https://github.com/vpenskyi-ledger)! - Fix: sell quotes now correctly shown when returning from a provider via "Back to quote". Previously, BuySellUI defaulted to buy mode because the stored flow name was not passed back during navigation. Desktop also removed a hardcoded `|| "buy"` fallback when saving the flow name to localStorage.

- [#21063](https://github.com/LedgerHQ/ledger-live/pull/21063) [`c566744`](https://github.com/LedgerHQ/ledger-live/commit/c566744a1a52db2843b3edeeb57c22043e704655) Thanks [@deepyjr](https://github.com/deepyjr)! - Persist Contacts locally and synchronize them through Ledger Sync.

- [#21014](https://github.com/LedgerHQ/ledger-live/pull/21014) [`e1c2a4b`](https://github.com/LedgerHQ/ledger-live/commit/e1c2a4bf3cabe5f58f8b3f8f226dfc90a0ab0296) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix Pay tab bottom sheets so the filter opens expanded and deposit options stay fully visible

- [#21001](https://github.com/LedgerHQ/ledger-live/pull/21001) [`c0bdd70`](https://github.com/LedgerHQ/ledger-live/commit/c0bdd7075816b44d245832849b28e16f7a169006) Thanks [@KVNLS](https://github.com/KVNLS)! - Prevent keypair generation at each startup and remove zod valdiation which is coslty at startup

- [#21044](https://github.com/LedgerHQ/ledger-live/pull/21044) [`b2a2e9e`](https://github.com/LedgerHQ/ledger-live/commit/b2a2e9ecec155c4ff3fdefa0b22e0ac2226bf830) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(send): search by contact name as recipient in the send

- [#20782](https://github.com/LedgerHQ/ledger-live/pull/20782) [`6c425e0`](https://github.com/LedgerHQ/ledger-live/commit/6c425e0e869c6feed4bd4c87ee0fef5443617708) Thanks [@shazzzam](https://github.com/shazzzam)! - Surface ICP neuron staking entry points on mobile: Stake and Manage Neurons account-header actions,
  gated behind the new `llmIcpStaking` feature flag. The StakingFlow and NeuronManageFlow navigators
  are registered as stubs and their screens land separately.

- [#20730](https://github.com/LedgerHQ/ledger-live/pull/20730) [`eccbacf`](https://github.com/LedgerHQ/ledger-live/commit/eccbacf5d8b167aed4f49418b0bca52100508307) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Wire Mobile Contacts scenario entry points to the shared analytics contract.

- [#20513](https://github.com/LedgerHQ/ledger-live/pull/20513) [`e80c178`](https://github.com/LedgerHQ/ledger-live/commit/e80c1780e29899cdbec2db504370ff1e6e0f7b93) Thanks [@vpenskyi-ledger](https://github.com/vpenskyi-ledger)! - Fix infinite loader on Exchange when closing account selection drawer with no accounts

- [#20799](https://github.com/LedgerHQ/ledger-live/pull/20799) [`585d8d7`](https://github.com/LedgerHQ/ledger-live/commit/585d8d78d5e153186c39ee2abfcdb7dc4a5d06e0) Thanks [@ishaba](https://github.com/ishaba)! - Migrate Tron to the generic coin framework (LIVE-34994).

  Adds a per-family pending-operation `extra` to the generic framework: `OptimisticOperationDescriptor` gains an optional `extra` bag and `describeOptimisticOperation` receives the transaction it describes, with framework-reserved keys stripped so a family cannot shadow them.

- [#20996](https://github.com/LedgerHQ/ledger-live/pull/20996) [`d6c7592`](https://github.com/LedgerHQ/ledger-live/commit/d6c7592278f2eed430c0451dd1b0a99fdf5b377d) Thanks [@CremaFR](https://github.com/CremaFR)! - Forward the `llmWalletApiDeviceIntentSign` assignment to the swap live app on mobile as `llmWalletApiDeviceIntentSignVariant` (the `variantId`) and `llmWalletApiDeviceIntentSignEnabled` (the flag state). Resolve that per manifest through `useDeviceIntentSignAssignment`, which also backs the Wallet API UI hook. Report both attributes on Mixpanel via `getRemoteABTestingAttributes`.

- [#20669](https://github.com/LedgerHQ/ledger-live/pull/20669) [`f7e5005`](https://github.com/LedgerHQ/ledger-live/commit/f7e5005f306b306042e3022fcb299ef499e7491a) Thanks [@YazhuEth](https://github.com/YazhuEth)! - feat(lwd): display the contact name and avatar in the send header

  The Amount step now shows the matched contact instead of the truncated address, using the shared `ContactAvatar`. The Recipient card moves to the same component, so both steps render the same colour and initials.

- [#21041](https://github.com/LedgerHQ/ledger-live/pull/21041) [`f056cfc`](https://github.com/LedgerHQ/ledger-live/commit/f056cfc75f57e471b392058521a80c55fb5e0300) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - fix(solana): make default validator option for delegation summary

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

- [#21012](https://github.com/LedgerHQ/ledger-live/pull/21012) [`5e1aa3e`](https://github.com/LedgerHQ/ledger-live/commit/5e1aa3efc66420bce6850c337f94a02ebe0e1185) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix the Pay tab "Add stablecoin" receive flow on mobile to list the full stablecoin catalog by filtering the Modular Asset Drawer on the stablecoin category, instead of pre-selecting only the two default stablecoins (USDC/USDT)

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

- [#20920](https://github.com/LedgerHQ/ledger-live/pull/20920) [`0fda04b`](https://github.com/LedgerHQ/ledger-live/commit/0fda04b868c0c93c6bfaf7cedbe901e896ad176b) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Rename notifications prompt context hook to useNotificationsPrompt

- [#20977](https://github.com/LedgerHQ/ledger-live/pull/20977) [`fb4a5bc`](https://github.com/LedgerHQ/ledger-live/commit/fb4a5bc6d78301182f56572ffedbe28bc995f271) Thanks [@deepyjr](https://github.com/deepyjr)! - Open the amount step when sending to a saved contact.

- [#21056](https://github.com/LedgerHQ/ledger-live/pull/21056) [`9e997b2`](https://github.com/LedgerHQ/ledger-live/commit/9e997b2292a428b015c184381bfe2e17b04e08c6) Thanks [@sarneijim](https://github.com/sarneijim)! - Add missing tracking events for touchscreen upsell placements

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

- [#20921](https://github.com/LedgerHQ/ledger-live/pull/20921) [`cb2ccae`](https://github.com/LedgerHQ/ledger-live/commit/cb2ccaef244de1d6a69b7326dc370e762f987140) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Remove leftover notifications opt-in backward-compat and unused prompt hooks

- [#20862](https://github.com/LedgerHQ/ledger-live/pull/20862) [`c65db86`](https://github.com/LedgerHQ/ledger-live/commit/c65db86dc1cc7ecfc69934b8d624902ab29d91cb) Thanks [@deepyjr](https://github.com/deepyjr)! - Show unavailable Contacts asset and network options as disabled in the asset drawer.

- [#20880](https://github.com/LedgerHQ/ledger-live/pull/20880) [`79bd143`](https://github.com/LedgerHQ/ledger-live/commit/79bd143c2b2fe9dd4036ffbf2f75b82afc6e677f) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Hide accounts that cannot send from the send pickers, and accounts that cannot receive from the receive pickers (HyperCore)

- [#20892](https://github.com/LedgerHQ/ledger-live/pull/20892) [`5b7c2c7`](https://github.com/LedgerHQ/ledger-live/commit/5b7c2c78c0ab1e1b4892a74e9a0510b2b44d4a4b) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Add a Profile upsell banner on My Wallet for Nano S, SP and X

- [#20913](https://github.com/LedgerHQ/ledger-live/pull/20913) [`cbeeb18`](https://github.com/LedgerHQ/ledger-live/commit/cbeeb1823cca2b210f0260e5a879366df5e8bd65) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - select the network then the account on asset page

- [#21007](https://github.com/LedgerHQ/ledger-live/pull/21007) [`8f6e66f`](https://github.com/LedgerHQ/ledger-live/commit/8f6e66f9f3723750ae16e95550b4008cb6a91164) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(send): explain why the address book is unavailable for some families

- [#20555](https://github.com/LedgerHQ/ledger-live/pull/20555) [`9e0c703`](https://github.com/LedgerHQ/ledger-live/commit/9e0c703631379409b5a9bee047832e9ac147a249) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Isolate wallet sync module failures instead of failing the whole sync: the aggregator validates each module slice on its own and quarantines a broken one, preserving its raw distant value, while every other module keeps syncing. A quarantine is reported as the module key plus the failure kind only, never the offending data.

  A distant document is now typed as what it is — a `DistantDocument` (`Record<string, unknown>`) whose slices are trusted per module — instead of the aggregate of the module schemas that nothing validates. `parseDistantState` is removed: it cast an unvalidated document to a validated type, and the aggregator already narrows the document at runtime. `CloudSyncSDK` drops its `schema` constructor option, which was never applied to anything and only served to infer that same misleading type; the class is now parameterised by its document type directly.

  `recentAddresses` drops its corrupted-address repair path. `CorruptedNestedAddressDistantSchema` and the lenient `z.array(z.unknown())` wrapper that swallowed every bad entry are removed together: a corrupted distant entry now quarantines the module, so the slice is preserved verbatim and reported, instead of being silently rewritten — or, had only the transform been removed, silently dropped. The local-cache repair in `schema.ts`/`store.ts` is untouched; it migrates data on disk, which quarantine does not cover.

- [#21046](https://github.com/LedgerHQ/ledger-live/pull/21046) [`e11eebe`](https://github.com/LedgerHQ/ledger-live/commit/e11eebedce8093322ce9dd9140be2e1f29817735) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(send): add network-filtered contact selection to the Send recipient step on desktop and mobile

- [#20505](https://github.com/LedgerHQ/ledger-live/pull/20505) [`f4ed19f`](https://github.com/LedgerHQ/ledger-live/commit/f4ed19f310eeb9cfad9e56665b9c2f2b40097925) Thanks [@deepyjr](https://github.com/deepyjr)! - Connect Contacts mutations to Ledger Sync availability and activation on Desktop and Mobile.

- [#20854](https://github.com/LedgerHQ/ledger-live/pull/20854) [`f32bf30`](https://github.com/LedgerHQ/ledger-live/commit/f32bf306ae16af24a98aff16c9c2342f496b905c) Thanks [@ishaba](https://github.com/ishaba)! - fix(coin-sui): map device 0x8 on address-balance send to clear error

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

- [#20110](https://github.com/LedgerHQ/ledger-live/pull/20110) [`bdcf051`](https://github.com/LedgerHQ/ledger-live/commit/bdcf05147689786a630b124c8374497bc891ceb4) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Fix Swap: pressing "<" from the History screen after a multi-step swap now returns to the initial input form. Opening a Swap sub-screen no longer replaces the Main navigator when the Swap tab is the focused route (which unmounted the tab navigator and left the back button unable to navigate), and the webview reset is re-applied when the Swap tab regains focus if the live app is still on the page it was asked to leave.

- [#20955](https://github.com/LedgerHQ/ledger-live/pull/20955) [`39a676d`](https://github.com/LedgerHQ/ledger-live/commit/39a676d2f861d04913264e61100205b4f6044cf9) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix: move hedera envs to config/constants

- [#20860](https://github.com/LedgerHQ/ledger-live/pull/20860) [`60f343c`](https://github.com/LedgerHQ/ledger-live/commit/60f343ce0cbf9edc8ceebaf8c27bba380f58214c) Thanks [@YazhuEth](https://github.com/YazhuEth)! - chore: bump the Lumen packages to the latest pinned set

  `AddressInput` now accepts a `ReactNode` prefix, and `BaseInput` is no longer exported by Lumen. Both apps only consume Lumen internally, so their own public API is unchanged. The Lumen packages pin each other on exact versions, so they move together.

- [#21038](https://github.com/LedgerHQ/ledger-live/pull/21038) [`2247ceb`](https://github.com/LedgerHQ/ledger-live/commit/2247ceb17f2af64ecf1a23225a7a5a4773a55fce) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Connect the Modular Asset Drawer to the Pay tab Request action, filtered to stablecoins with account selection

### Patch Changes

- Updated dependencies [[`26d8617`](https://github.com/LedgerHQ/ledger-live/commit/26d86172869e47608dd0f0e26dfbc905dafa3588), [`a86fe14`](https://github.com/LedgerHQ/ledger-live/commit/a86fe1498de34b86c2a89077a02886a26c6e158a), [`de982e6`](https://github.com/LedgerHQ/ledger-live/commit/de982e6a9ef6e2a27789212bee2729c7141193ad), [`e6ad2f6`](https://github.com/LedgerHQ/ledger-live/commit/e6ad2f6eed4bf5e587a2880e7fa7be937e2764ee), [`6218989`](https://github.com/LedgerHQ/ledger-live/commit/6218989cc9b12b7574660a98c465a3899db0083e), [`1d6c394`](https://github.com/LedgerHQ/ledger-live/commit/1d6c39482047fef5b86a4b9511a3e8a1956e30a1), [`5bd3557`](https://github.com/LedgerHQ/ledger-live/commit/5bd3557bf160876d9a0a392f0bbe1841083560cb), [`98f4802`](https://github.com/LedgerHQ/ledger-live/commit/98f48028b931c5aabf364988c53488e6124cc42e), [`bb045d8`](https://github.com/LedgerHQ/ledger-live/commit/bb045d88e3cbeb411643acfc26252e8cb1ce39ac), [`5a30d71`](https://github.com/LedgerHQ/ledger-live/commit/5a30d71a0910bcfeb75a9cface524d7f942f1a7c), [`6560883`](https://github.com/LedgerHQ/ledger-live/commit/6560883682ff7af5f8e61ae79e29f8560ac3f8e2), [`f427599`](https://github.com/LedgerHQ/ledger-live/commit/f42759916771b6445544255700082ccdaa3466c4), [`e998478`](https://github.com/LedgerHQ/ledger-live/commit/e9984787e3352a399b107fc3d4e889ffb02d4fc2), [`5a630b2`](https://github.com/LedgerHQ/ledger-live/commit/5a630b2cb982168094177d9a3c21fdf163454ef8), [`d8c04dd`](https://github.com/LedgerHQ/ledger-live/commit/d8c04ddf5e8bc7a6994d59475e12381dd28f403a), [`9470502`](https://github.com/LedgerHQ/ledger-live/commit/947050267c2733e7d0087865d2e9b29edf7f6413), [`e732d3e`](https://github.com/LedgerHQ/ledger-live/commit/e732d3e258c653fc83e1474434f3bb02c136ae62), [`d4bb463`](https://github.com/LedgerHQ/ledger-live/commit/d4bb46367e40a98a454c72e71ccc73b2dc75b417), [`ce4ae4a`](https://github.com/LedgerHQ/ledger-live/commit/ce4ae4a61b4721d8d1ad7b9e8c82a182350d3be4), [`6084fcd`](https://github.com/LedgerHQ/ledger-live/commit/6084fcd6b848049b5240abf32b9ac940603576c0), [`b6bb5b5`](https://github.com/LedgerHQ/ledger-live/commit/b6bb5b537c4536890ca1959357cad1ea2ad5f5d5), [`f64ceec`](https://github.com/LedgerHQ/ledger-live/commit/f64ceecbdaccec2c56ace4cc459d670db5920b68), [`fec3bc8`](https://github.com/LedgerHQ/ledger-live/commit/fec3bc88bacd2705da38c5c5bf5e68e7d734c3b3), [`9fa2ab5`](https://github.com/LedgerHQ/ledger-live/commit/9fa2ab5eb2003fcade4e5821f1253ae27c1af82d), [`f0f10ca`](https://github.com/LedgerHQ/ledger-live/commit/f0f10cae65f1e2015afbac540ecdcd01548356a8), [`55b7e6d`](https://github.com/LedgerHQ/ledger-live/commit/55b7e6d50aa1e97da3b1ae3405263e99b5fe5bde), [`aa39333`](https://github.com/LedgerHQ/ledger-live/commit/aa393339789242783b168398cb5122a7f1e3f620), [`5125ac7`](https://github.com/LedgerHQ/ledger-live/commit/5125ac7d7c27a76541835d596c122f30d04e759b), [`46a0d30`](https://github.com/LedgerHQ/ledger-live/commit/46a0d30f0134786a0be5d1c1b671a9c7955a81e1), [`c566744`](https://github.com/LedgerHQ/ledger-live/commit/c566744a1a52db2843b3edeeb57c22043e704655), [`e1c2a4b`](https://github.com/LedgerHQ/ledger-live/commit/e1c2a4bf3cabe5f58f8b3f8f226dfc90a0ab0296), [`8003387`](https://github.com/LedgerHQ/ledger-live/commit/80033873ea4628cbf9af189c313f73d54b422fb2), [`c0bdd70`](https://github.com/LedgerHQ/ledger-live/commit/c0bdd7075816b44d245832849b28e16f7a169006), [`6c425e0`](https://github.com/LedgerHQ/ledger-live/commit/6c425e0e869c6feed4bd4c87ee0fef5443617708), [`73f303f`](https://github.com/LedgerHQ/ledger-live/commit/73f303fc9eed76b677d322628fe9f211d74807d5), [`1ba0ceb`](https://github.com/LedgerHQ/ledger-live/commit/1ba0ceb64143f29712b8c8d68871e12a4b6ad065), [`01c088d`](https://github.com/LedgerHQ/ledger-live/commit/01c088db6a0597a479f6371c3a3db81157ead41e), [`91dbf02`](https://github.com/LedgerHQ/ledger-live/commit/91dbf023257961c3f15725f57abf273d2190e3c5), [`585d8d7`](https://github.com/LedgerHQ/ledger-live/commit/585d8d78d5e153186c39ee2abfcdb7dc4a5d06e0), [`d6c7592`](https://github.com/LedgerHQ/ledger-live/commit/d6c7592278f2eed430c0451dd1b0a99fdf5b377d), [`d5ea888`](https://github.com/LedgerHQ/ledger-live/commit/d5ea888d3a154feeb29b452841749d358629b8c1), [`dd64855`](https://github.com/LedgerHQ/ledger-live/commit/dd648554ba49b37a69888d7cd87354ebdd22db20), [`ff7e5e0`](https://github.com/LedgerHQ/ledger-live/commit/ff7e5e0ed085c7fb895eeaad844c3e373e791b8b), [`33007b1`](https://github.com/LedgerHQ/ledger-live/commit/33007b1c0a68912d2cebecd96edb2fe797df17dd), [`8c438f9`](https://github.com/LedgerHQ/ledger-live/commit/8c438f9bec55614174c6faca7ebeb77c8e64aaef), [`fabb26b`](https://github.com/LedgerHQ/ledger-live/commit/fabb26be5baa28c00cfa05b4c94aa6a74d15c2ed), [`eba4d17`](https://github.com/LedgerHQ/ledger-live/commit/eba4d175ad10f1431a222a4fa98481ea4285e891), [`cad4f63`](https://github.com/LedgerHQ/ledger-live/commit/cad4f63be4a3b16880ab490195af1f17921e03c2), [`306a681`](https://github.com/LedgerHQ/ledger-live/commit/306a6813eaabfd67dc575bb7bdfc2b52892037df), [`9fa2ab5`](https://github.com/LedgerHQ/ledger-live/commit/9fa2ab5eb2003fcade4e5821f1253ae27c1af82d), [`582f422`](https://github.com/LedgerHQ/ledger-live/commit/582f422ec2fbe8bb852c7a847c3ee0ff0a01ab32), [`9e0c703`](https://github.com/LedgerHQ/ledger-live/commit/9e0c703631379409b5a9bee047832e9ac147a249), [`8161bac`](https://github.com/LedgerHQ/ledger-live/commit/8161bac542474212dfefc8519e714da345b03f71), [`f4ed19f`](https://github.com/LedgerHQ/ledger-live/commit/f4ed19f310eeb9cfad9e56665b9c2f2b40097925), [`a826856`](https://github.com/LedgerHQ/ledger-live/commit/a826856200049687f4b3b37f85bb588eaa4fb4a2), [`b3095f5`](https://github.com/LedgerHQ/ledger-live/commit/b3095f5500b76110b5ce2ed1f08aee9f346a40f3), [`fbc8036`](https://github.com/LedgerHQ/ledger-live/commit/fbc8036d9bd4e1cc30eea4233f05e8b0498c0e5e), [`d6f0c7d`](https://github.com/LedgerHQ/ledger-live/commit/d6f0c7dc9f85002d17f1fa8156b4dc4c2d94e36d), [`39a676d`](https://github.com/LedgerHQ/ledger-live/commit/39a676d2f861d04913264e61100205b4f6044cf9), [`3908965`](https://github.com/LedgerHQ/ledger-live/commit/3908965e8872b6502558b669897028d39c492f7e), [`41311d6`](https://github.com/LedgerHQ/ledger-live/commit/41311d69b2d29dac534c98f6bd2917f7b558c14e), [`79ee882`](https://github.com/LedgerHQ/ledger-live/commit/79ee882545ea85c8a17027bd685f4b99f1ec84cd), [`4c333ad`](https://github.com/LedgerHQ/ledger-live/commit/4c333ad80187596319d6e0042af331770fc1858e)]:
  - @ledgerhq/coin-evm@5.1.0-next.0
  - @features/flow-contacts-add-address@0.2.0-next.0
  - @features/flow-contacts@0.8.0-next.0
  - @features/flow-pay-card-request@0.2.0-next.0
  - @features/flow-large-screen-upsell@2.0.0-next.0
  - @features/flow-app-lock@0.2.0-next.0
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
  - @shared/env@0.4.0-next.0
  - @features/platform-aggregated-assets@0.5.0-next.0
  - @shared/cloud-sync@0.2.0-next.0
  - @domain/entity-recent-addresses@0.2.0-next.0
  - @ledgerhq/coin-stacks@0.29.0-next.0
  - @features/flow-contacts-introduction@0.3.0-next.0
  - @domain/api-aggregated-assets@0.4.1-next.0
  - @domain/api-altcoins-sentiment@0.3.3-next.0
  - @domain/api-currency-fiat@0.4.2-next.0
  - @domain/api-currency-token@0.5.1-next.0
  - @domain/api-market-sentiment@0.3.3-next.0
  - @domain/api-push-devices@0.2.3-next.0
  - @features/platform-currencies@0.6.2-next.0
  - @features/platform-feature-flags@0.6.7-next.0
  - @ledgerhq/coin-bitcoin@0.51.2-next.0
  - @ledgerhq/coin-canton@1.0.1-next.0
  - @ledgerhq/coin-concordium@1.0.1-next.0
  - @ledgerhq/coin-cosmos@1.0.1-next.0
  - @ledgerhq/coin-filecoin@2.0.1-next.0
  - @ledgerhq/coin-multiversx@1.0.1-next.0
  - @ledgerhq/device-core@0.11.13-next.0
  - @ledgerhq/domain-service@1.8.16-next.0
  - @ledgerhq/live-countervalues@0.24.4-next.0
  - @ledgerhq/live-countervalues-react@0.16.8-next.0
  - @ledgerhq/wallet-analytics@0.3.5-next.0
  - @ledgerhq/wallet-pnl@0.7.8-next.0
  - @features/platform-env@0.2.2-next.0
  - @ledgerhq/live-dmk-mobile@0.29.5-next.0
  - @ledgerhq/live-dmk-speculos@0.10.6-next.0
  - @domain/entity-account-name@0.2.1-next.0
  - @features/platform-wallet-sync@0.1.2-next.0
  - @ledgerhq/live-currency-format@0.14.2-next.0
  - @features/flow-analytics-consent@0.2.3-next.0

## 4.17.0

### Minor Changes

- [#20611](https://github.com/LedgerHQ/ledger-live/pull/20611) [`5a87153`](https://github.com/LedgerHQ/ledger-live/commit/5a8715341159ffe80f0e380cff2affb9299406cb) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Mount the first-time Pay tab FeatureTour on the PayTab screen in both apps. Visibility is self-gated by the payCard slice (shown on first visit, hidden after dismissal), copy is injected from app-owned i18n keys (payTab.featureTour.\*), and analytics are wired through the view-model. Adds unit and integration coverage for the conditional rendering.

- [#20713](https://github.com/LedgerHQ/ledger-live/pull/20713) [`a3164d8`](https://github.com/LedgerHQ/ledger-live/commit/a3164d88ed131879b072e0b05668a3e881c61850) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the mobile Pay hero for the aggregated stablecoin balance. The `@features/flow-pay-card-balance` package gains props-only native empty and funded states, and both apps now share the portfolio aggregation through `aggregatePayCardBalance` (LIVE-34898). The hero is mounted at the top of the mobile Pay tab, which tracks `Page Pay` with the active `balance_filter` on view.

- [#20807](https://github.com/LedgerHQ/ledger-live/pull/20807) [`aac2ee0`](https://github.com/LedgerHQ/ledger-live/commit/aac2ee05ac62f91f42158100e93412e2361a7146) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Force a dark background on the Android 12+ system splash screen shown between the launcher tap and the splash screen. It followed the device theme, showing a white background in light mode, because the `windowSplashScreenBackground` it was configured with belongs to `core-splashscreen` and never reached the platform.

- [#20840](https://github.com/LedgerHQ/ledger-live/pull/20840) [`72c8fbf`](https://github.com/LedgerHQ/ledger-live/commit/72c8fbf8622bd023f45318d1ec6c2e24f7feff8e) Thanks [@deepyjr](https://github.com/deepyjr)! - Add a Contacts feature introduction toggle to Mobile Debug settings.

- [#20735](https://github.com/LedgerHQ/ledger-live/pull/20735) [`c3b8717`](https://github.com/LedgerHQ/ledger-live/commit/c3b87177729f809722127debb8556419f56094c1) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add a stablecoin balance filter picker to the Pay card hero.

- [#20704](https://github.com/LedgerHQ/ledger-live/pull/20704) [`d83149c`](https://github.com/LedgerHQ/ledger-live/commit/d83149c9cb7a2fb6fb03ee7e5cb76bb9e01db1e7) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Fix Segment analytics flush on AppState background, show delivery status in analytics console, log Segment flushes to the analytics overlay, and warn once in Datadog when events are skipped with no Segment client

- [#20581](https://github.com/LedgerHQ/ledger-live/pull/20581) [`8ae48ee`](https://github.com/LedgerHQ/ledger-live/commit/8ae48ee4c9bc3b43c2179efad46742b68526a7d8) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Fix the Pay tab navigator route name collision

- [#20702](https://github.com/LedgerHQ/ledger-live/pull/20702) [`e07e0ba`](https://github.com/LedgerHQ/ledger-live/commit/e07e0baca2e4edfe90163367047459257034f7cc) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Scaffold the Card API on a single endpoint-less `cardApi` service (DDD, CMC/DADA pattern): add the `services/card` transport in `@shared/api-services` with Bearer + `x-client-key` (`CARD_BAANX_CLIENT_KEY`) + one 401-refresh, the `@domain/api-card-management` endpoint injector, the `@features/platform-card` in-memory session and `getCardSessionToken`/`refreshCardSession` accessors, the `CARD_API_URL` / `CARD_BAANX_CLIENT_KEY` envs, and register `cardApi` in both apps. The legacy `payCardApi` Card Auth holdout is left untouched pending its migration onto `cardApi` (LIVE-33829).

- [#20674](https://github.com/LedgerHQ/ledger-live/pull/20674) [`81a708d`](https://github.com/LedgerHQ/ledger-live/commit/81a708d94ce06d9b3d4e359fc46a01166441946f) Thanks [@sarneijim](https://github.com/sarneijim)! - Expose lazyOnboardingBanner flag enabled state and mode on Segment identify

- [#20571](https://github.com/LedgerHQ/ledger-live/pull/20571) [`7c8d5df`](https://github.com/LedgerHQ/ledger-live/commit/7c8d5dfa862a2e9c3a35251b5d06a3cd4f905d2a) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Thread the coin-module `Context` (ADR-019) explicitly through the coin-evm, coin-vechain and coin-near api and logic layers instead of resolving configuration from the module-level `getCoinConfig` singleton. Exported logic functions now take the context as their first argument, resolve `config` from it (`await context.config(currencyId)`), and pass an explicit, required `config` down to the network layer — no `config?` optionals and no singleton reads on the data path. `getCoinConfig`/`setCoinConfig` remain only as the compatibility surface for the classic account bridge. Ledger Live consumers (live-common, desktop, mobile and coin-celo) are updated to resolve and pass config/context explicitly. Also fixes a coin-polkadot type-inference issue where `getTransactionMaterialWithMetadata`'s cache-key extractor narrowed the cached signature and dropped the `config` argument.

- [#20077](https://github.com/LedgerHQ/ledger-live/pull/20077) [`89171ea`](https://github.com/LedgerHQ/ledger-live/commit/89171ea0279c94d5a55324c3c7194fa42234828a) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Drop legacy ticker lookup from Large Mover landing page (LIVE-34635)

- [#20856](https://github.com/LedgerHQ/ledger-live/pull/20856) [`d0ac51c`](https://github.com/LedgerHQ/ledger-live/commit/d0ac51c757081a7ac6b5d76899097d3be2c1d07f) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Wire the Pay tab "Add stablecoin" tile to the shared Deposit options overlay on both platforms: pressing it opens the dialog (desktop) or bottom sheet (mobile), and each option routes to its platform flow (bank transfer, swap, buy) or the receive flow filtered to stablecoins.

  Extract a shared `useDepositOptionsAdapter` hook in `@features/flow-pay-card-deposit` so desktop and mobile no longer duplicate the deposit options open/close state and props shape.

- [#20907](https://github.com/LedgerHQ/ledger-live/pull/20907) [`da0a5ce`](https://github.com/LedgerHQ/ledger-live/commit/da0a5ceb8f889f1bace45ed2d3d4c640cdf24ca8) Thanks [@fAnselmi-Ledger](https://github.com/fAnselmi-Ledger)! - Add Solana TXC flag

- [#20784](https://github.com/LedgerHQ/ledger-live/pull/20784) [`19e578a`](https://github.com/LedgerHQ/ledger-live/commit/19e578a92209e96cabe400661757689e73b43005) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Move the Pay Card UI Redux state out of the removed `@domain/entity-pay-card` package into the owning feature flows: the balance filter goes to `@features/flow-pay-card-balance` and the feature-tour seen flag to `@features/flow-pay-card-feature-tour`. The apps keep persisting it under the existing `payCard` key (no data migration). Both flows expose a UI-free `./state` entry so store, persistence and test setup can use the slice without pulling in the flow UI.

- [#20778](https://github.com/LedgerHQ/ledger-live/pull/20778) [`eecf99a`](https://github.com/LedgerHQ/ledger-live/commit/eecf99af5c17ab63724843c31d5f3facc6352dad) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-evm): replace `CryptoCurrency` with `currencyId`

- [#20724](https://github.com/LedgerHQ/ledger-live/pull/20724) [`8eb38c0`](https://github.com/LedgerHQ/ledger-live/commit/8eb38c09cd29531d4acf9902a986a2331250c2c0) Thanks [@deepyjr](https://github.com/deepyjr)! - Fixed reopening an address after cancelling its edit drawer in Contacts.

- [#20745](https://github.com/LedgerHQ/ledger-live/pull/20745) [`ec6fa1b`](https://github.com/LedgerHQ/ledger-live/commit/ec6fa1b6ce67574b43fc58f49d52bf1073ee0a12) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fixed reopening the delete contact confirmation sheet after cancelling it by opening delete only after the actions menu sheet has fully dismissed.

- [#20744](https://github.com/LedgerHQ/ledger-live/pull/20744) [`c65ca3e`](https://github.com/LedgerHQ/ledger-live/commit/c65ca3e5f69e4406bda123390fdb7bc53bba3c19) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Fix "Close all" link color in the top-wallet hardware carousel small cards to match the muted gray used elsewhere on the screen

- [#20589](https://github.com/LedgerHQ/ledger-live/pull/20589) [`bad0305`](https://github.com/LedgerHQ/ledger-live/commit/bad0305b5bb59d7aff49e801daa7934f6793d3f4) Thanks [@sarneijim](https://github.com/sarneijim)! - Add the Lazy Onboarding Tour drawer to the lazy onboarding banner, with updated banner/tour copy and imagery

- [#20751](https://github.com/LedgerHQ/ledger-live/pull/20751) [`7ed4ee1`](https://github.com/LedgerHQ/ledger-live/commit/7ed4ee1888c4bc05251c2c716eba15e5907ee820) Thanks [@sarneijim](https://github.com/sarneijim)! - Refresh lazy onboarding tour slide assets, follow app theme in the tour drawer, and track banner press/dismiss.

- [#20679](https://github.com/LedgerHQ/ledger-live/pull/20679) [`a635bb4`](https://github.com/LedgerHQ/ledger-live/commit/a635bb44ada02d5e4df82d62e26db69fa3d01a20) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwm): show empty contacts state on recipient screen

- [#20794](https://github.com/LedgerHQ/ledger-live/pull/20794) [`29347c9`](https://github.com/LedgerHQ/ledger-live/commit/29347c96e0d59fb015846bcf8e4eebe4e6676764) Thanks [@LL782](https://github.com/LL782)! - Replace the useTrack hook with the module-level track function

  Internal refactor ahead of the analytics package migration. Every event keeps the properties it emits today: desktop reads the `drawer` name from the drawer context (or passes the custom-lock-screen constant directly) at each call site, and mobile's swap entry point rebuilds its router-derived `page` with `usePageNameFromRoute`.

- [#20743](https://github.com/LedgerHQ/ledger-live/pull/20743) [`ac097e6`](https://github.com/LedgerHQ/ledger-live/commit/ac097e6a452e747c4fde117da38da22e9da85ed7) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Fix scroll targeting and silent failures in the Ledger Wallet Mobile E2E suite: target leaf rows
  instead of viewport-tall wrappers so assertions reach the default 75% visibility honestly, delete the
  `visibilityPercentage` parameter so no site can lower the gate, name the scroll container at every
  call site that used to let the engine guess one, replace the unexplained pixel steps with the default,
  count rows by existence rather than by what fits the screen, log the scroll errors `scrollOnce`
  used to swallow and correct its `"bottom"` fallback direction, make the `isIdVisible`/`isIdPresent`
  probes index-safe so a shared id stops being reported as invisible, and assert visibility where the
  suite previously only proved an element existed in the tree. On the app side, the accounts list
  scrollable now carries a stable `accounts-list` testID instead of one keyed on the account count.

- [#19581](https://github.com/LedgerHQ/ledger-live/pull/19581) [`6a437fd`](https://github.com/LedgerHQ/ledger-live/commit/6a437fd60cb8d5c197f104a522ce1406da197e51) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(lwdm): improve error context on datadog

- [#20750](https://github.com/LedgerHQ/ledger-live/pull/20750) [`352c6a3`](https://github.com/LedgerHQ/ledger-live/commit/352c6a36999c1ee7436bdce218b10f15af0dab5f) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-evm): move `getDefaultFeeUnit` and `getMessageProperties` to llc

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

- [#20867](https://github.com/LedgerHQ/ledger-live/pull/20867) [`b7476f4`](https://github.com/LedgerHQ/ledger-live/commit/b7476f442d05fc65b5b28c64901f4126dbc9acb7) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Skip the Noah receive funds options drawer when depositing from Pay so users are not asked to choose crypto vs bank transfer twice

- [#20433](https://github.com/LedgerHQ/ledger-live/pull/20433) [`481bc40`](https://github.com/LedgerHQ/ledger-live/commit/481bc40f6e9573ff4c1387e9944cfdb1298e092b) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Hand a perps deposit requested by the live app over to the wallet, and let the asset and account pickers word themselves after the role the selection plays: the account funds land in, the account they are taken from, or the perps pick that predates both

- [#20753](https://github.com/LedgerHQ/ledger-live/pull/20753) [`560b8d6`](https://github.com/LedgerHQ/ledger-live/commit/560b8d69b7289a3309f46cb9cd78ff1933793be4) Thanks [@LL782](https://github.com/LL782)! - Replace the useAnalytics hook with the module-level track function

  Internal refactor ahead of the analytics package migration. Event property values are unchanged; duplicate `send_modal` "step review device" emissions caused by the hook's route-keyed callback identity no longer fire, so counts for that event may fall slightly.

- [#20645](https://github.com/LedgerHQ/ledger-live/pull/20645) [`dd3baf3`](https://github.com/LedgerHQ/ledger-live/commit/dd3baf39e2fab7d30d0064e9a10e3e58df2dd6e1) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add shared edit contact signer validation state with mocked signer mismatch handling and wire Desktop and Mobile contact edit flows.

- [#19909](https://github.com/LedgerHQ/ledger-live/pull/19909) [`311e79f`](https://github.com/LedgerHQ/ledger-live/commit/311e79f15f334f2a7b0499dbbfe57fa835e8b0b2) Thanks [@henri-ly](https://github.com/henri-ly)! - add new send flow tokens test, and type the amount in crypto (the step opens in fiat) by tagging
  the amount fiat/crypto toggle with a `amount-mode-toggle` testID

- [#20800](https://github.com/LedgerHQ/ledger-live/pull/20800) [`c8adec3`](https://github.com/LedgerHQ/ledger-live/commit/c8adec33638877b418723ca8473d469afb5be6d2) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add Deposit and Request action tiles to the mobile Pay screen hero

- [#20699](https://github.com/LedgerHQ/ledger-live/pull/20699) [`e9e2a48`](https://github.com/LedgerHQ/ledger-live/commit/e9e2a484881eb01ffc2f2e20e86da54333d5e638) Thanks [@deepyjr](https://github.com/deepyjr)! - Fix the Contacts network search drawer crash

- [#20440](https://github.com/LedgerHQ/ledger-live/pull/20440) [`541de50`](https://github.com/LedgerHQ/ledger-live/commit/541de50c543bf95830fa17ba510eb203607d3f2a) Thanks [@vpenskyi-ledger](https://github.com/vpenskyi-ledger)! - Change swap pending operation CTA from "Go to history" to "See details"

- [#20700](https://github.com/LedgerHQ/ledger-live/pull/20700) [`999305d`](https://github.com/LedgerHQ/ledger-live/commit/999305d25006627170a35f3bc537af4dcf1023fd) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Keep memo, tag and comment edits made from the send summary when navigating back to the recipient or amount step, instead of reverting them.

### Patch Changes

- Updated dependencies [[`ec8baad`](https://github.com/LedgerHQ/ledger-live/commit/ec8baadf5077e3891c488cf669615a52ad4873b1), [`a3164d8`](https://github.com/LedgerHQ/ledger-live/commit/a3164d88ed131879b072e0b05668a3e881c61850), [`9accbb8`](https://github.com/LedgerHQ/ledger-live/commit/9accbb86a0495f8b7b69f0b923ab9f7a133f661d), [`841f7a0`](https://github.com/LedgerHQ/ledger-live/commit/841f7a0991ee0a8036f2144858b5d27d654910bc), [`5ff320a`](https://github.com/LedgerHQ/ledger-live/commit/5ff320aaa967388af5d1e3f8d869b42739d0a2ed), [`e4e8d08`](https://github.com/LedgerHQ/ledger-live/commit/e4e8d086fc5672e4ce96c30c9a9af3f2022f863a), [`14cf5b8`](https://github.com/LedgerHQ/ledger-live/commit/14cf5b8fad43788bdd7c682f53ab9d4fe03f9a8f), [`0dc2509`](https://github.com/LedgerHQ/ledger-live/commit/0dc2509c9646374755fce5aebc3d07bba17a8feb), [`8605089`](https://github.com/LedgerHQ/ledger-live/commit/8605089242fd91da0ee4c6a7e8ea2f5a9f58962a), [`c3b8717`](https://github.com/LedgerHQ/ledger-live/commit/c3b87177729f809722127debb8556419f56094c1), [`1a2df41`](https://github.com/LedgerHQ/ledger-live/commit/1a2df41eed302864ec2e0b58dc9eef75e8b90eec), [`55768ad`](https://github.com/LedgerHQ/ledger-live/commit/55768ad9f20ee24b2de8bbbe743b62b3b2e53355), [`696f871`](https://github.com/LedgerHQ/ledger-live/commit/696f871fc89aedd6a2a50fe3f0dd442bbd7ebf07), [`e07e0ba`](https://github.com/LedgerHQ/ledger-live/commit/e07e0baca2e4edfe90163367047459257034f7cc), [`45dc82e`](https://github.com/LedgerHQ/ledger-live/commit/45dc82e7aaf3dbc70a6fb89c673a342b28b3b12c), [`a7b0bae`](https://github.com/LedgerHQ/ledger-live/commit/a7b0baeaa4e7b2fb180e7ab28ce92a6287b46a68), [`7c8d5df`](https://github.com/LedgerHQ/ledger-live/commit/7c8d5dfa862a2e9c3a35251b5d06a3cd4f905d2a), [`f2f3ec9`](https://github.com/LedgerHQ/ledger-live/commit/f2f3ec9ef1f2869c44190e2f6aa16dc362f2891f), [`526ca7b`](https://github.com/LedgerHQ/ledger-live/commit/526ca7be272a78b5cbd48481b6c5120989c0731b), [`d0ac51c`](https://github.com/LedgerHQ/ledger-live/commit/d0ac51c757081a7ac6b5d76899097d3be2c1d07f), [`840de0d`](https://github.com/LedgerHQ/ledger-live/commit/840de0d43c75962ab91f0f1dc232dbcef10356a3), [`3c36af2`](https://github.com/LedgerHQ/ledger-live/commit/3c36af2185860d32bfaad670df7c49a3458e44c3), [`46eb674`](https://github.com/LedgerHQ/ledger-live/commit/46eb6748e96782f28499d74cfc930abfbc99a5e4), [`da0a5ce`](https://github.com/LedgerHQ/ledger-live/commit/da0a5ceb8f889f1bace45ed2d3d4c640cdf24ca8), [`19e578a`](https://github.com/LedgerHQ/ledger-live/commit/19e578a92209e96cabe400661757689e73b43005), [`eecf99a`](https://github.com/LedgerHQ/ledger-live/commit/eecf99af5c17ab63724843c31d5f3facc6352dad), [`d43f03d`](https://github.com/LedgerHQ/ledger-live/commit/d43f03d2ab01e821677227cc2a76ee4ff5d0d7e7), [`21323c6`](https://github.com/LedgerHQ/ledger-live/commit/21323c66d04a25979a09b317014c6007d1c6b368), [`f040998`](https://github.com/LedgerHQ/ledger-live/commit/f04099812f60fc328ee101b5f4f0457b1d1c4bfa), [`030fc67`](https://github.com/LedgerHQ/ledger-live/commit/030fc677db03e8a411d3d33d2fa88e1ab04df80b), [`a781abe`](https://github.com/LedgerHQ/ledger-live/commit/a781abec59454ec3bd1cbd4b74b67666aef73aab), [`bad0305`](https://github.com/LedgerHQ/ledger-live/commit/bad0305b5bb59d7aff49e801daa7934f6793d3f4), [`5b39a67`](https://github.com/LedgerHQ/ledger-live/commit/5b39a67dd93d4c541a77b0b146881073ca00ed15), [`0807eca`](https://github.com/LedgerHQ/ledger-live/commit/0807ecacfd06057811a3d6f8845b9f4bfc6f693c), [`e72d6ff`](https://github.com/LedgerHQ/ledger-live/commit/e72d6ffbd8b1a1ac79d272e1823ecfdfd06ed0ee), [`352c6a3`](https://github.com/LedgerHQ/ledger-live/commit/352c6a36999c1ee7436bdce218b10f15af0dab5f), [`68448cd`](https://github.com/LedgerHQ/ledger-live/commit/68448cdf5c1fd5a2b6d912f4034d170dbabfc93f), [`75d0c9b`](https://github.com/LedgerHQ/ledger-live/commit/75d0c9b97aced42be1f465319ee17ccaafcd649d), [`eb4d29e`](https://github.com/LedgerHQ/ledger-live/commit/eb4d29ee1a9879963621168b1e208c53e532d28f), [`42fca4a`](https://github.com/LedgerHQ/ledger-live/commit/42fca4a650043e297b2bcbdd098c6743126d7247), [`a61f702`](https://github.com/LedgerHQ/ledger-live/commit/a61f702a6e41f2bf84d5602930e261a708507efa), [`e291645`](https://github.com/LedgerHQ/ledger-live/commit/e291645e8acb488323bf2ef8a26f045e6415c3fd), [`4faf5cd`](https://github.com/LedgerHQ/ledger-live/commit/4faf5cdcd91e183777a275123bb7d5c3890adbce), [`2edf614`](https://github.com/LedgerHQ/ledger-live/commit/2edf614eed7608714821ee54574d8c4d2b6f7d98), [`9e45705`](https://github.com/LedgerHQ/ledger-live/commit/9e45705b649513c3f9797c2add485a0ba3ea7a6c), [`e54d98b`](https://github.com/LedgerHQ/ledger-live/commit/e54d98b123ad8814be57c2f0e0f26689902ab4fd), [`b6da6b1`](https://github.com/LedgerHQ/ledger-live/commit/b6da6b1b1c98d022f30985c6103c239bffd0c7df), [`ca74f9d`](https://github.com/LedgerHQ/ledger-live/commit/ca74f9d50026c4a14657692de9c74c8f1c32f130), [`3dd9308`](https://github.com/LedgerHQ/ledger-live/commit/3dd9308f1a670a56588acbe70f2cbb4eb39d3432), [`fae92bf`](https://github.com/LedgerHQ/ledger-live/commit/fae92bf68e8ac167644aefa9e9d981a7b12cb23a), [`8153370`](https://github.com/LedgerHQ/ledger-live/commit/8153370ced31369208fe14ce8b24c6eb0d899ff4), [`dd3baf3`](https://github.com/LedgerHQ/ledger-live/commit/dd3baf39e2fab7d30d0064e9a10e3e58df2dd6e1), [`7c20f72`](https://github.com/LedgerHQ/ledger-live/commit/7c20f72fb4e7cc0c3e728961d5e9823faef6dcb4), [`0fc43c1`](https://github.com/LedgerHQ/ledger-live/commit/0fc43c15841f585c0a9aaa5152587225978f7e2b), [`c8adec3`](https://github.com/LedgerHQ/ledger-live/commit/c8adec33638877b418723ca8473d469afb5be6d2), [`b2896a9`](https://github.com/LedgerHQ/ledger-live/commit/b2896a9b10cf6daaa8f532eaa12f016df606eb8b), [`79882e2`](https://github.com/LedgerHQ/ledger-live/commit/79882e26a14f246f1cc969937e011b16e701b8f2), [`5a96e09`](https://github.com/LedgerHQ/ledger-live/commit/5a96e096169e44731117becf9c204666c4509364), [`a20805c`](https://github.com/LedgerHQ/ledger-live/commit/a20805cebd95f2f620d394c4d7598ec93506c83e), [`030b427`](https://github.com/LedgerHQ/ledger-live/commit/030b42707768af3f9c98a15fc6751f1d64b36fe6)]:
  - @features/flow-pay-card-balance@0.2.0
  - @features/flow-pay-card-deposit@0.2.0
  - @shared/feature-flags@0.19.0
  - @domain/api-aggregated-assets@0.4.0
  - @features/platform-contacts@0.3.0
  - @domain/entity-contact@0.7.0
  - @features/flow-contacts@0.7.0
  - @ledgerhq/live-dmk-shared@0.31.0
  - @ledgerhq/ledger-auth@0.4.0
  - @ledgerhq/ledger-key-ring-protocol@0.20.0
  - @shared/auth@0.5.0
  - @shared/api-services@0.4.0
  - @features/platform-card@0.2.0
  - @shared/env@0.3.0
  - @features/flow-contacts-add-contact@0.3.0
  - @ledgerhq/types-devices@7.0.0
  - @ledgerhq/coin-concordium@1.0.0
  - @ledgerhq/coin-multiversx@1.0.0
  - @ledgerhq/coin-filecoin@2.0.0
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
  - @features/flow-lazy-onboarding-banner@0.3.0
  - @features/platform-aggregated-assets@0.4.0
  - @devtools/transport-panel@0.5.0
  - @devtools/wire@0.4.0
  - @domain/entity-currency-token@0.5.0
  - @domain/api-currency-token@0.5.0
  - @ledgerhq/coin-bitcoin@0.51.1
  - @features/platform-currencies@0.6.1
  - @features/platform-feature-flags@0.6.6
  - @ledgerhq/live-dmk-mobile@0.29.4
  - @domain/api-altcoins-sentiment@0.3.2
  - @domain/api-currency-fiat@0.4.1
  - @domain/api-market-sentiment@0.3.2
  - @domain/api-push-devices@0.2.2
  - @features/platform-env@0.2.1
  - @ledgerhq/live-dmk-speculos@0.10.5
  - @ledgerhq/wallet-analytics@0.3.4
  - @ledgerhq/wallet-pnl@0.7.7
  - @ledgerhq/device-intent@6.0.0
  - @ledgerhq/coin-stacks@0.28.1
  - @ledgerhq/device-core@0.11.12
  - @ledgerhq/domain-service@1.8.15
  - @ledgerhq/live-countervalues@0.24.3
  - @ledgerhq/live-countervalues-react@0.16.7
  - @ledgerhq/live-wallet@1.0.1
  - @devtools/shell@0.8.1
  - @domain/entity-currency@0.4.1
  - @features/flow-analytics-consent@0.2.2

## 4.17.0-next.1

### Minor Changes

- [#20907](https://github.com/LedgerHQ/ledger-live/pull/20907) [`da0a5ce`](https://github.com/LedgerHQ/ledger-live/commit/da0a5ceb8f889f1bace45ed2d3d4c640cdf24ca8) Thanks [@fAnselmi-Ledger](https://github.com/fAnselmi-Ledger)! - Add Solana TXC flag

### Patch Changes

- Updated dependencies [[`da0a5ce`](https://github.com/LedgerHQ/ledger-live/commit/da0a5ceb8f889f1bace45ed2d3d4c640cdf24ca8)]:
  - @shared/feature-flags@0.19.0-next.1
  - @ledgerhq/types-live@6.120.0-next.1
  - @devtools/bindings@0.4.0-next.1
  - @features/flow-contacts@0.7.0-next.1
  - @features/platform-currencies@0.6.1-next.1
  - @features/platform-feature-flags@0.6.6-next.1
  - @ledgerhq/coin-bitcoin@0.51.1-next.1
  - @ledgerhq/coin-canton@1.0.0-next.1
  - @ledgerhq/coin-casper@3.0.0-next.1
  - @ledgerhq/coin-concordium@1.0.0-next.1
  - @ledgerhq/coin-cosmos@1.0.0-next.1
  - @ledgerhq/coin-evm@5.0.0-next.1
  - @ledgerhq/coin-filecoin@2.0.0-next.1
  - @ledgerhq/coin-multiversx@1.0.0-next.1
  - @ledgerhq/coin-stacks@0.28.1-next.1
  - @ledgerhq/device-core@0.11.12-next.1
  - @ledgerhq/domain-service@1.8.15-next.1
  - @ledgerhq/ledger-wallet-framework@3.0.0-next.1
  - @ledgerhq/live-countervalues@0.24.3-next.1
  - @ledgerhq/live-countervalues-react@0.16.7-next.1
  - @ledgerhq/live-wallet@1.0.1-next.1
  - @ledgerhq/wallet-analytics@0.3.4-next.1
  - @ledgerhq/wallet-pnl@0.7.7-next.1
  - @features/flow-analytics-consent@0.2.2-next.1
  - @devtools/shell@0.8.1-next.1

## 4.17.0-next.0

### Minor Changes

- [#20611](https://github.com/LedgerHQ/ledger-live/pull/20611) [`5a87153`](https://github.com/LedgerHQ/ledger-live/commit/5a8715341159ffe80f0e380cff2affb9299406cb) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Mount the first-time Pay tab FeatureTour on the PayTab screen in both apps. Visibility is self-gated by the payCard slice (shown on first visit, hidden after dismissal), copy is injected from app-owned i18n keys (payTab.featureTour.\*), and analytics are wired through the view-model. Adds unit and integration coverage for the conditional rendering.

- [#20713](https://github.com/LedgerHQ/ledger-live/pull/20713) [`a3164d8`](https://github.com/LedgerHQ/ledger-live/commit/a3164d88ed131879b072e0b05668a3e881c61850) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the mobile Pay hero for the aggregated stablecoin balance. The `@features/flow-pay-card-balance` package gains props-only native empty and funded states, and both apps now share the portfolio aggregation through `aggregatePayCardBalance` (LIVE-34898). The hero is mounted at the top of the mobile Pay tab, which tracks `Page Pay` with the active `balance_filter` on view.

- [#20807](https://github.com/LedgerHQ/ledger-live/pull/20807) [`aac2ee0`](https://github.com/LedgerHQ/ledger-live/commit/aac2ee05ac62f91f42158100e93412e2361a7146) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Force a dark background on the Android 12+ system splash screen shown between the launcher tap and the splash screen. It followed the device theme, showing a white background in light mode, because the `windowSplashScreenBackground` it was configured with belongs to `core-splashscreen` and never reached the platform.

- [#20840](https://github.com/LedgerHQ/ledger-live/pull/20840) [`72c8fbf`](https://github.com/LedgerHQ/ledger-live/commit/72c8fbf8622bd023f45318d1ec6c2e24f7feff8e) Thanks [@deepyjr](https://github.com/deepyjr)! - Add a Contacts feature introduction toggle to Mobile Debug settings.

- [#20735](https://github.com/LedgerHQ/ledger-live/pull/20735) [`c3b8717`](https://github.com/LedgerHQ/ledger-live/commit/c3b87177729f809722127debb8556419f56094c1) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add a stablecoin balance filter picker to the Pay card hero.

- [#20704](https://github.com/LedgerHQ/ledger-live/pull/20704) [`d83149c`](https://github.com/LedgerHQ/ledger-live/commit/d83149c9cb7a2fb6fb03ee7e5cb76bb9e01db1e7) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Fix Segment analytics flush on AppState background, show delivery status in analytics console, log Segment flushes to the analytics overlay, and warn once in Datadog when events are skipped with no Segment client

- [#20581](https://github.com/LedgerHQ/ledger-live/pull/20581) [`8ae48ee`](https://github.com/LedgerHQ/ledger-live/commit/8ae48ee4c9bc3b43c2179efad46742b68526a7d8) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Fix the Pay tab navigator route name collision

- [#20702](https://github.com/LedgerHQ/ledger-live/pull/20702) [`e07e0ba`](https://github.com/LedgerHQ/ledger-live/commit/e07e0baca2e4edfe90163367047459257034f7cc) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Scaffold the Card API on a single endpoint-less `cardApi` service (DDD, CMC/DADA pattern): add the `services/card` transport in `@shared/api-services` with Bearer + `x-client-key` (`CARD_BAANX_CLIENT_KEY`) + one 401-refresh, the `@domain/api-card-management` endpoint injector, the `@features/platform-card` in-memory session and `getCardSessionToken`/`refreshCardSession` accessors, the `CARD_API_URL` / `CARD_BAANX_CLIENT_KEY` envs, and register `cardApi` in both apps. The legacy `payCardApi` Card Auth holdout is left untouched pending its migration onto `cardApi` (LIVE-33829).

- [#20674](https://github.com/LedgerHQ/ledger-live/pull/20674) [`81a708d`](https://github.com/LedgerHQ/ledger-live/commit/81a708d94ce06d9b3d4e359fc46a01166441946f) Thanks [@sarneijim](https://github.com/sarneijim)! - Expose lazyOnboardingBanner flag enabled state and mode on Segment identify

- [#20571](https://github.com/LedgerHQ/ledger-live/pull/20571) [`7c8d5df`](https://github.com/LedgerHQ/ledger-live/commit/7c8d5dfa862a2e9c3a35251b5d06a3cd4f905d2a) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Thread the coin-module `Context` (ADR-019) explicitly through the coin-evm, coin-vechain and coin-near api and logic layers instead of resolving configuration from the module-level `getCoinConfig` singleton. Exported logic functions now take the context as their first argument, resolve `config` from it (`await context.config(currencyId)`), and pass an explicit, required `config` down to the network layer — no `config?` optionals and no singleton reads on the data path. `getCoinConfig`/`setCoinConfig` remain only as the compatibility surface for the classic account bridge. Ledger Live consumers (live-common, desktop, mobile and coin-celo) are updated to resolve and pass config/context explicitly. Also fixes a coin-polkadot type-inference issue where `getTransactionMaterialWithMetadata`'s cache-key extractor narrowed the cached signature and dropped the `config` argument.

- [#20077](https://github.com/LedgerHQ/ledger-live/pull/20077) [`89171ea`](https://github.com/LedgerHQ/ledger-live/commit/89171ea0279c94d5a55324c3c7194fa42234828a) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Drop legacy ticker lookup from Large Mover landing page (LIVE-34635)

- [#20856](https://github.com/LedgerHQ/ledger-live/pull/20856) [`d0ac51c`](https://github.com/LedgerHQ/ledger-live/commit/d0ac51c757081a7ac6b5d76899097d3be2c1d07f) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Wire the Pay tab "Add stablecoin" tile to the shared Deposit options overlay on both platforms: pressing it opens the dialog (desktop) or bottom sheet (mobile), and each option routes to its platform flow (bank transfer, swap, buy) or the receive flow filtered to stablecoins.

  Extract a shared `useDepositOptionsAdapter` hook in `@features/flow-pay-card-deposit` so desktop and mobile no longer duplicate the deposit options open/close state and props shape.

- [#20784](https://github.com/LedgerHQ/ledger-live/pull/20784) [`19e578a`](https://github.com/LedgerHQ/ledger-live/commit/19e578a92209e96cabe400661757689e73b43005) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Move the Pay Card UI Redux state out of the removed `@domain/entity-pay-card` package into the owning feature flows: the balance filter goes to `@features/flow-pay-card-balance` and the feature-tour seen flag to `@features/flow-pay-card-feature-tour`. The apps keep persisting it under the existing `payCard` key (no data migration). Both flows expose a UI-free `./state` entry so store, persistence and test setup can use the slice without pulling in the flow UI.

- [#20778](https://github.com/LedgerHQ/ledger-live/pull/20778) [`eecf99a`](https://github.com/LedgerHQ/ledger-live/commit/eecf99af5c17ab63724843c31d5f3facc6352dad) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-evm): replace `CryptoCurrency` with `currencyId`

- [#20724](https://github.com/LedgerHQ/ledger-live/pull/20724) [`8eb38c0`](https://github.com/LedgerHQ/ledger-live/commit/8eb38c09cd29531d4acf9902a986a2331250c2c0) Thanks [@deepyjr](https://github.com/deepyjr)! - Fixed reopening an address after cancelling its edit drawer in Contacts.

- [#20745](https://github.com/LedgerHQ/ledger-live/pull/20745) [`ec6fa1b`](https://github.com/LedgerHQ/ledger-live/commit/ec6fa1b6ce67574b43fc58f49d52bf1073ee0a12) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fixed reopening the delete contact confirmation sheet after cancelling it by opening delete only after the actions menu sheet has fully dismissed.

- [#20744](https://github.com/LedgerHQ/ledger-live/pull/20744) [`c65ca3e`](https://github.com/LedgerHQ/ledger-live/commit/c65ca3e5f69e4406bda123390fdb7bc53bba3c19) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Fix "Close all" link color in the top-wallet hardware carousel small cards to match the muted gray used elsewhere on the screen

- [#20589](https://github.com/LedgerHQ/ledger-live/pull/20589) [`bad0305`](https://github.com/LedgerHQ/ledger-live/commit/bad0305b5bb59d7aff49e801daa7934f6793d3f4) Thanks [@sarneijim](https://github.com/sarneijim)! - Add the Lazy Onboarding Tour drawer to the lazy onboarding banner, with updated banner/tour copy and imagery

- [#20751](https://github.com/LedgerHQ/ledger-live/pull/20751) [`7ed4ee1`](https://github.com/LedgerHQ/ledger-live/commit/7ed4ee1888c4bc05251c2c716eba15e5907ee820) Thanks [@sarneijim](https://github.com/sarneijim)! - Refresh lazy onboarding tour slide assets, follow app theme in the tour drawer, and track banner press/dismiss.

- [#20679](https://github.com/LedgerHQ/ledger-live/pull/20679) [`a635bb4`](https://github.com/LedgerHQ/ledger-live/commit/a635bb44ada02d5e4df82d62e26db69fa3d01a20) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwm): show empty contacts state on recipient screen

- [#20794](https://github.com/LedgerHQ/ledger-live/pull/20794) [`29347c9`](https://github.com/LedgerHQ/ledger-live/commit/29347c96e0d59fb015846bcf8e4eebe4e6676764) Thanks [@LL782](https://github.com/LL782)! - Replace the useTrack hook with the module-level track function

  Internal refactor ahead of the analytics package migration. Every event keeps the properties it emits today: desktop reads the `drawer` name from the drawer context (or passes the custom-lock-screen constant directly) at each call site, and mobile's swap entry point rebuilds its router-derived `page` with `usePageNameFromRoute`.

- [#20743](https://github.com/LedgerHQ/ledger-live/pull/20743) [`ac097e6`](https://github.com/LedgerHQ/ledger-live/commit/ac097e6a452e747c4fde117da38da22e9da85ed7) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Fix scroll targeting and silent failures in the Ledger Wallet Mobile E2E suite: target leaf rows
  instead of viewport-tall wrappers so assertions reach the default 75% visibility honestly, delete the
  `visibilityPercentage` parameter so no site can lower the gate, name the scroll container at every
  call site that used to let the engine guess one, replace the unexplained pixel steps with the default,
  count rows by existence rather than by what fits the screen, log the scroll errors `scrollOnce`
  used to swallow and correct its `"bottom"` fallback direction, make the `isIdVisible`/`isIdPresent`
  probes index-safe so a shared id stops being reported as invisible, and assert visibility where the
  suite previously only proved an element existed in the tree. On the app side, the accounts list
  scrollable now carries a stable `accounts-list` testID instead of one keyed on the account count.

- [#19581](https://github.com/LedgerHQ/ledger-live/pull/19581) [`6a437fd`](https://github.com/LedgerHQ/ledger-live/commit/6a437fd60cb8d5c197f104a522ce1406da197e51) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(lwdm): improve error context on datadog

- [#20750](https://github.com/LedgerHQ/ledger-live/pull/20750) [`352c6a3`](https://github.com/LedgerHQ/ledger-live/commit/352c6a36999c1ee7436bdce218b10f15af0dab5f) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-evm): move `getDefaultFeeUnit` and `getMessageProperties` to llc

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

- [#20867](https://github.com/LedgerHQ/ledger-live/pull/20867) [`b7476f4`](https://github.com/LedgerHQ/ledger-live/commit/b7476f442d05fc65b5b28c64901f4126dbc9acb7) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Skip the Noah receive funds options drawer when depositing from Pay so users are not asked to choose crypto vs bank transfer twice

- [#20433](https://github.com/LedgerHQ/ledger-live/pull/20433) [`481bc40`](https://github.com/LedgerHQ/ledger-live/commit/481bc40f6e9573ff4c1387e9944cfdb1298e092b) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Hand a perps deposit requested by the live app over to the wallet, and let the asset and account pickers word themselves after the role the selection plays: the account funds land in, the account they are taken from, or the perps pick that predates both

- [#20753](https://github.com/LedgerHQ/ledger-live/pull/20753) [`560b8d6`](https://github.com/LedgerHQ/ledger-live/commit/560b8d69b7289a3309f46cb9cd78ff1933793be4) Thanks [@LL782](https://github.com/LL782)! - Replace the useAnalytics hook with the module-level track function

  Internal refactor ahead of the analytics package migration. Event property values are unchanged; duplicate `send_modal` "step review device" emissions caused by the hook's route-keyed callback identity no longer fire, so counts for that event may fall slightly.

- [#20645](https://github.com/LedgerHQ/ledger-live/pull/20645) [`dd3baf3`](https://github.com/LedgerHQ/ledger-live/commit/dd3baf39e2fab7d30d0064e9a10e3e58df2dd6e1) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add shared edit contact signer validation state with mocked signer mismatch handling and wire Desktop and Mobile contact edit flows.

- [#19909](https://github.com/LedgerHQ/ledger-live/pull/19909) [`311e79f`](https://github.com/LedgerHQ/ledger-live/commit/311e79f15f334f2a7b0499dbbfe57fa835e8b0b2) Thanks [@henri-ly](https://github.com/henri-ly)! - add new send flow tokens test, and type the amount in crypto (the step opens in fiat) by tagging
  the amount fiat/crypto toggle with a `amount-mode-toggle` testID

- [#20800](https://github.com/LedgerHQ/ledger-live/pull/20800) [`c8adec3`](https://github.com/LedgerHQ/ledger-live/commit/c8adec33638877b418723ca8473d469afb5be6d2) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add Deposit and Request action tiles to the mobile Pay screen hero

- [#20699](https://github.com/LedgerHQ/ledger-live/pull/20699) [`e9e2a48`](https://github.com/LedgerHQ/ledger-live/commit/e9e2a484881eb01ffc2f2e20e86da54333d5e638) Thanks [@deepyjr](https://github.com/deepyjr)! - Fix the Contacts network search drawer crash

- [#20440](https://github.com/LedgerHQ/ledger-live/pull/20440) [`541de50`](https://github.com/LedgerHQ/ledger-live/commit/541de50c543bf95830fa17ba510eb203607d3f2a) Thanks [@vpenskyi-ledger](https://github.com/vpenskyi-ledger)! - Change swap pending operation CTA from "Go to history" to "See details"

- [#20700](https://github.com/LedgerHQ/ledger-live/pull/20700) [`999305d`](https://github.com/LedgerHQ/ledger-live/commit/999305d25006627170a35f3bc537af4dcf1023fd) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Keep memo, tag and comment edits made from the send summary when navigating back to the recipient or amount step, instead of reverting them.

### Patch Changes

- Updated dependencies [[`ec8baad`](https://github.com/LedgerHQ/ledger-live/commit/ec8baadf5077e3891c488cf669615a52ad4873b1), [`a3164d8`](https://github.com/LedgerHQ/ledger-live/commit/a3164d88ed131879b072e0b05668a3e881c61850), [`9accbb8`](https://github.com/LedgerHQ/ledger-live/commit/9accbb86a0495f8b7b69f0b923ab9f7a133f661d), [`841f7a0`](https://github.com/LedgerHQ/ledger-live/commit/841f7a0991ee0a8036f2144858b5d27d654910bc), [`5ff320a`](https://github.com/LedgerHQ/ledger-live/commit/5ff320aaa967388af5d1e3f8d869b42739d0a2ed), [`e4e8d08`](https://github.com/LedgerHQ/ledger-live/commit/e4e8d086fc5672e4ce96c30c9a9af3f2022f863a), [`14cf5b8`](https://github.com/LedgerHQ/ledger-live/commit/14cf5b8fad43788bdd7c682f53ab9d4fe03f9a8f), [`0dc2509`](https://github.com/LedgerHQ/ledger-live/commit/0dc2509c9646374755fce5aebc3d07bba17a8feb), [`8605089`](https://github.com/LedgerHQ/ledger-live/commit/8605089242fd91da0ee4c6a7e8ea2f5a9f58962a), [`c3b8717`](https://github.com/LedgerHQ/ledger-live/commit/c3b87177729f809722127debb8556419f56094c1), [`1a2df41`](https://github.com/LedgerHQ/ledger-live/commit/1a2df41eed302864ec2e0b58dc9eef75e8b90eec), [`55768ad`](https://github.com/LedgerHQ/ledger-live/commit/55768ad9f20ee24b2de8bbbe743b62b3b2e53355), [`696f871`](https://github.com/LedgerHQ/ledger-live/commit/696f871fc89aedd6a2a50fe3f0dd442bbd7ebf07), [`e07e0ba`](https://github.com/LedgerHQ/ledger-live/commit/e07e0baca2e4edfe90163367047459257034f7cc), [`45dc82e`](https://github.com/LedgerHQ/ledger-live/commit/45dc82e7aaf3dbc70a6fb89c673a342b28b3b12c), [`a7b0bae`](https://github.com/LedgerHQ/ledger-live/commit/a7b0baeaa4e7b2fb180e7ab28ce92a6287b46a68), [`7c8d5df`](https://github.com/LedgerHQ/ledger-live/commit/7c8d5dfa862a2e9c3a35251b5d06a3cd4f905d2a), [`f2f3ec9`](https://github.com/LedgerHQ/ledger-live/commit/f2f3ec9ef1f2869c44190e2f6aa16dc362f2891f), [`526ca7b`](https://github.com/LedgerHQ/ledger-live/commit/526ca7be272a78b5cbd48481b6c5120989c0731b), [`d0ac51c`](https://github.com/LedgerHQ/ledger-live/commit/d0ac51c757081a7ac6b5d76899097d3be2c1d07f), [`840de0d`](https://github.com/LedgerHQ/ledger-live/commit/840de0d43c75962ab91f0f1dc232dbcef10356a3), [`3c36af2`](https://github.com/LedgerHQ/ledger-live/commit/3c36af2185860d32bfaad670df7c49a3458e44c3), [`46eb674`](https://github.com/LedgerHQ/ledger-live/commit/46eb6748e96782f28499d74cfc930abfbc99a5e4), [`19e578a`](https://github.com/LedgerHQ/ledger-live/commit/19e578a92209e96cabe400661757689e73b43005), [`eecf99a`](https://github.com/LedgerHQ/ledger-live/commit/eecf99af5c17ab63724843c31d5f3facc6352dad), [`d43f03d`](https://github.com/LedgerHQ/ledger-live/commit/d43f03d2ab01e821677227cc2a76ee4ff5d0d7e7), [`21323c6`](https://github.com/LedgerHQ/ledger-live/commit/21323c66d04a25979a09b317014c6007d1c6b368), [`f040998`](https://github.com/LedgerHQ/ledger-live/commit/f04099812f60fc328ee101b5f4f0457b1d1c4bfa), [`030fc67`](https://github.com/LedgerHQ/ledger-live/commit/030fc677db03e8a411d3d33d2fa88e1ab04df80b), [`a781abe`](https://github.com/LedgerHQ/ledger-live/commit/a781abec59454ec3bd1cbd4b74b67666aef73aab), [`bad0305`](https://github.com/LedgerHQ/ledger-live/commit/bad0305b5bb59d7aff49e801daa7934f6793d3f4), [`5b39a67`](https://github.com/LedgerHQ/ledger-live/commit/5b39a67dd93d4c541a77b0b146881073ca00ed15), [`0807eca`](https://github.com/LedgerHQ/ledger-live/commit/0807ecacfd06057811a3d6f8845b9f4bfc6f693c), [`e72d6ff`](https://github.com/LedgerHQ/ledger-live/commit/e72d6ffbd8b1a1ac79d272e1823ecfdfd06ed0ee), [`352c6a3`](https://github.com/LedgerHQ/ledger-live/commit/352c6a36999c1ee7436bdce218b10f15af0dab5f), [`68448cd`](https://github.com/LedgerHQ/ledger-live/commit/68448cdf5c1fd5a2b6d912f4034d170dbabfc93f), [`75d0c9b`](https://github.com/LedgerHQ/ledger-live/commit/75d0c9b97aced42be1f465319ee17ccaafcd649d), [`eb4d29e`](https://github.com/LedgerHQ/ledger-live/commit/eb4d29ee1a9879963621168b1e208c53e532d28f), [`42fca4a`](https://github.com/LedgerHQ/ledger-live/commit/42fca4a650043e297b2bcbdd098c6743126d7247), [`a61f702`](https://github.com/LedgerHQ/ledger-live/commit/a61f702a6e41f2bf84d5602930e261a708507efa), [`e291645`](https://github.com/LedgerHQ/ledger-live/commit/e291645e8acb488323bf2ef8a26f045e6415c3fd), [`4faf5cd`](https://github.com/LedgerHQ/ledger-live/commit/4faf5cdcd91e183777a275123bb7d5c3890adbce), [`2edf614`](https://github.com/LedgerHQ/ledger-live/commit/2edf614eed7608714821ee54574d8c4d2b6f7d98), [`9e45705`](https://github.com/LedgerHQ/ledger-live/commit/9e45705b649513c3f9797c2add485a0ba3ea7a6c), [`e54d98b`](https://github.com/LedgerHQ/ledger-live/commit/e54d98b123ad8814be57c2f0e0f26689902ab4fd), [`b6da6b1`](https://github.com/LedgerHQ/ledger-live/commit/b6da6b1b1c98d022f30985c6103c239bffd0c7df), [`ca74f9d`](https://github.com/LedgerHQ/ledger-live/commit/ca74f9d50026c4a14657692de9c74c8f1c32f130), [`3dd9308`](https://github.com/LedgerHQ/ledger-live/commit/3dd9308f1a670a56588acbe70f2cbb4eb39d3432), [`fae92bf`](https://github.com/LedgerHQ/ledger-live/commit/fae92bf68e8ac167644aefa9e9d981a7b12cb23a), [`8153370`](https://github.com/LedgerHQ/ledger-live/commit/8153370ced31369208fe14ce8b24c6eb0d899ff4), [`dd3baf3`](https://github.com/LedgerHQ/ledger-live/commit/dd3baf39e2fab7d30d0064e9a10e3e58df2dd6e1), [`7c20f72`](https://github.com/LedgerHQ/ledger-live/commit/7c20f72fb4e7cc0c3e728961d5e9823faef6dcb4), [`0fc43c1`](https://github.com/LedgerHQ/ledger-live/commit/0fc43c15841f585c0a9aaa5152587225978f7e2b), [`c8adec3`](https://github.com/LedgerHQ/ledger-live/commit/c8adec33638877b418723ca8473d469afb5be6d2), [`b2896a9`](https://github.com/LedgerHQ/ledger-live/commit/b2896a9b10cf6daaa8f532eaa12f016df606eb8b), [`79882e2`](https://github.com/LedgerHQ/ledger-live/commit/79882e26a14f246f1cc969937e011b16e701b8f2), [`5a96e09`](https://github.com/LedgerHQ/ledger-live/commit/5a96e096169e44731117becf9c204666c4509364), [`a20805c`](https://github.com/LedgerHQ/ledger-live/commit/a20805cebd95f2f620d394c4d7598ec93506c83e), [`030b427`](https://github.com/LedgerHQ/ledger-live/commit/030b42707768af3f9c98a15fc6751f1d64b36fe6)]:
  - @features/flow-pay-card-balance@0.2.0-next.0
  - @features/flow-pay-card-deposit@0.2.0-next.0
  - @shared/feature-flags@0.19.0-next.0
  - @domain/api-aggregated-assets@0.4.0-next.0
  - @features/platform-contacts@0.3.0-next.0
  - @domain/entity-contact@0.7.0-next.0
  - @features/flow-contacts@0.7.0-next.0
  - @ledgerhq/live-dmk-shared@0.31.0-next.0
  - @ledgerhq/ledger-auth@0.4.0-next.0
  - @ledgerhq/ledger-key-ring-protocol@0.20.0-next.0
  - @shared/auth@0.5.0-next.0
  - @shared/api-services@0.4.0-next.0
  - @features/platform-card@0.2.0-next.0
  - @shared/env@0.3.0-next.0
  - @features/flow-contacts-add-contact@0.3.0-next.0
  - @ledgerhq/types-devices@7.0.0-next.0
  - @ledgerhq/coin-concordium@1.0.0-next.0
  - @ledgerhq/coin-multiversx@1.0.0-next.0
  - @ledgerhq/coin-filecoin@2.0.0-next.0
  - @ledgerhq/coin-canton@1.0.0-next.0
  - @ledgerhq/coin-casper@3.0.0-next.0
  - @ledgerhq/coin-cosmos@1.0.0-next.0
  - @ledgerhq/coin-evm@5.0.0-next.0
  - @features/flow-contacts-introduction@0.2.0-next.0
  - @features/flow-pay-card-feature-tour@0.3.0-next.0
  - @features/flow-pay-card-auth@0.3.0-next.0
  - @devtools/bindings@0.4.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.0.0-next.0
  - @features/flow-lazy-onboarding-banner@0.3.0-next.0
  - @ledgerhq/types-live@6.120.0-next.0
  - @features/platform-aggregated-assets@0.4.0-next.0
  - @devtools/transport-panel@0.5.0-next.0
  - @devtools/wire@0.4.0-next.0
  - @domain/entity-currency-token@0.5.0-next.0
  - @domain/api-currency-token@0.5.0-next.0
  - @ledgerhq/coin-bitcoin@0.51.1-next.0
  - @features/platform-currencies@0.6.1-next.0
  - @features/platform-feature-flags@0.6.6-next.0
  - @ledgerhq/live-dmk-mobile@0.29.4-next.0
  - @domain/api-altcoins-sentiment@0.3.2-next.0
  - @domain/api-currency-fiat@0.4.1-next.0
  - @domain/api-market-sentiment@0.3.2-next.0
  - @domain/api-push-devices@0.2.2-next.0
  - @features/platform-env@0.2.1-next.0
  - @ledgerhq/live-dmk-speculos@0.10.5-next.0
  - @ledgerhq/wallet-analytics@0.3.4-next.0
  - @ledgerhq/wallet-pnl@0.7.7-next.0
  - @ledgerhq/device-intent@6.0.0-next.0
  - @ledgerhq/coin-stacks@0.28.1-next.0
  - @ledgerhq/live-countervalues@0.24.3-next.0
  - @ledgerhq/live-countervalues-react@0.16.7-next.0
  - @ledgerhq/live-wallet@1.0.1-next.0
  - @ledgerhq/device-core@0.11.12-next.0
  - @ledgerhq/domain-service@1.8.15-next.0
  - @devtools/shell@0.8.1-next.0
  - @domain/entity-currency@0.4.1-next.0
  - @features/flow-analytics-consent@0.2.2-next.0

## 4.16.0

### Minor Changes

- [#20278](https://github.com/LedgerHQ/ledger-live/pull/20278) [`3d24a89`](https://github.com/LedgerHQ/ledger-live/commit/3d24a898d59de55364ec29de29eaecb7ca14425d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop the `@ledgerhq/errors` dependency, completing the errors sunset (LIVE-32915).

  The `@ledgerhq/errors` package is removed from the monorepo: no workspace source imported it anymore, every error class it held now lives in the package that owns it (`@ledgerhq/ledger-wallet-framework/errors` for the ones shared across coin modules). `createCustomErrorClass` and the `serializeError` / `deserializeError` stack are gone with it — define errors as native classes and branch on `error.name`.

  `@ledgerhq/errors@6.37.0` stays on npm for external consumers, but is no longer published from this repo.

- [#20280](https://github.com/LedgerHQ/ledger-live/pull/20280) [`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Stop depending on `@ledgerhq/errors` (LIVE-32915).

  No workspace package declares it anymore, and none may again: `enforce-boundaries` now fails CI on any manifest that does. The classes it held live in the package that owns them, with `@ledgerhq/ledger-wallet-framework/errors` as the shared home below the coin layer.

  The package itself stays in the repo so it keeps being published for external consumers, and is bridged to the external coin packages that still peer-depend on it via `pnpm.packageExtensions` using `workspace:*` (which reuses the single in-repo copy, so the dependency graph keeps exactly the physical copies it had before). [LedgerHQ/coin-modules#752](https://github.com/LedgerHQ/coin-modules/pull/752) removes that peerDependency upstream; once it is released the bridge can be dropped, but the package still needs publishing.

- [#20580](https://github.com/LedgerHQ/ledger-live/pull/20580) [`9b3fb2a`](https://github.com/LedgerHQ/ledger-live/commit/9b3fb2a98eaa530c12e55eb3391f58a306c80d8f) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwm): update lwm init params new send flow recipient

- [#20315](https://github.com/LedgerHQ/ledger-live/pull/20315) [`4b73f81`](https://github.com/LedgerHQ/ledger-live/commit/4b73f81aca25a92178850b3f7ac7519a7efcac67) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Portfolio upsell banner and Braze content cards can now coexist on Portfolio (Mobile: shared carousel; Desktop: side-by-side grid when Braze placement is enabled, otherwise upsell stacked above the Braze carousel).

- [#20404](https://github.com/LedgerHQ/ledger-live/pull/20404) [`0f89b44`](https://github.com/LedgerHQ/ledger-live/commit/0f89b44de874d3921ff93b323c7db0f00d22cac6) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Replace the legacy Pay Card placeholders with the shared authentication flow on desktop and mobile

- [#20633](https://github.com/LedgerHQ/ledger-live/pull/20633) [`67b2d83`](https://github.com/LedgerHQ/ledger-live/commit/67b2d835c65d4827f58580e15c8470ae631a6944) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Stop auto-opening the mobile product tour; open only from hub, deeplink, or debug

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

- [#20619](https://github.com/LedgerHQ/ledger-live/pull/20619) [`0175f1f`](https://github.com/LedgerHQ/ledger-live/commit/0175f1ffab7a31fe882b3538d5a87619c331bf54) Thanks [@qperrot](https://github.com/qperrot)! - Chore: add tests for memo on the new send flow

- [#20207](https://github.com/LedgerHQ/ledger-live/pull/20207) [`aee0e64`](https://github.com/LedgerHQ/ledger-live/commit/aee0e64b491aafc1ca8fea16b1ef124cb183770b) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Add Internet Computer (ICP) neuron staking to the coin module: create and top up neurons, start/stop dissolving, disburse, set/increase dissolve delay, follow, split, spawn, stake maturity, and add/remove hot keys, plus neuron listing. Governance operations are routed through the NNS governance canister via the device's update-call signing, alongside the existing ledger transfer path, and account synchronization now carries neuron data. Adds the `STAKE_NEURON` and `TOP_UP_NEURON` operation types, with matching icons and labels in the desktop and mobile operation history. (LIVE-28469)

- [#20290](https://github.com/LedgerHQ/ledger-live/pull/20290) [`9708010`](https://github.com/LedgerHQ/ledger-live/commit/970801044529fe978ccbb8c562cc64c00277d1de) Thanks [@sarneijim](https://github.com/sarneijim)! - Add the shared lazy onboarding banner flow, its Mobile portfolio view and configurable Shop link feature flag.

- [#20456](https://github.com/LedgerHQ/ledger-live/pull/20456) [`a0f13a2`](https://github.com/LedgerHQ/ledger-live/commit/a0f13a2b5410acc1e03231a94a5af9d77b6dabf6) Thanks [@sarneijim](https://github.com/sarneijim)! - Use fixed legacy onboarding date for backfill instead of app-open date

- [#20458](https://github.com/LedgerHQ/ledger-live/pull/20458) [`9876163`](https://github.com/LedgerHQ/ledger-live/commit/9876163c9686f72fead2004a6388764536c29cfd) Thanks [@sarneijim](https://github.com/sarneijim)! - Use legacy onboarding date fallback in large-screen upsell eligibility

- [#19169](https://github.com/LedgerHQ/ledger-live/pull/19169) [`92b70ef`](https://github.com/LedgerHQ/ledger-live/commit/92b70ef6318741216740d7341f37627c32a3f0d6) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Preserve installed apps in Device Intent Executor last seen device info.

- [#20409](https://github.com/LedgerHQ/ledger-live/pull/20409) [`91a2953`](https://github.com/LedgerHQ/ledger-live/commit/91a29531167176557194d9adbc6b55ff11363b8d) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Wire mobile contact address detail send, edit, and delete actions with confirmation sheets.

- [#20559](https://github.com/LedgerHQ/ledger-live/pull/20559) [`c904346`](https://github.com/LedgerHQ/ledger-live/commit/c9043466032fab4f9c2ae02d4bd52970ad8fbcfe) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Render Mobile Contacts address edit signer mismatch error and extract shared address detail action labels and UI state mapping.

- [#20539](https://github.com/LedgerHQ/ledger-live/pull/20539) [`60b4626`](https://github.com/LedgerHQ/ledger-live/commit/60b462653bad19429c46ebef439ec2b5bb234140) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Scope `@ledgerhq/live-wallet` down to wallet sync only

  The package now exposes `./accounts` and `./walletSyncComposition` and nothing else.
  `ordering.ts` and `addAccounts.ts` move to `@ledgerhq/live-common/account/*`, and
  `accountRawToAccountUserData` joins `live-common/account/serialization` next to `fromAccountRaw`.
  The `liveqr/` folder is gone: `importAccounts.ts` and `accountToAccountData` were unreachable, and
  `accountDataToAccount` — whose only callers rehydrated a wallet-sync descriptor — becomes
  `accounts/descriptorToAccount`. `live-common` no longer depends on `live-wallet`.

- [#20510](https://github.com/LedgerHQ/ledger-live/pull/20510) [`a1bd49e`](https://github.com/LedgerHQ/ledger-live/commit/a1bd49ec9190a395730b3348fef5c0987e4eaeb7) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Model Me as the default self contact with shared display-name formatting, external address counts, and a Ledger Wallet accounts intent.

- [#18764](https://github.com/LedgerHQ/ledger-live/pull/18764) [`d266e13`](https://github.com/LedgerHQ/ledger-live/commit/d266e13aa8e8b34ca74beaa09687b6e8d426f821) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Migrate the swap `fetchQuotes` helper from axios to an RTK Query endpoint (`swapQuotesApi`). The aggregator `/quote` request now flows through the Redux data layer, and the rawQuotes/providerErrors split is unchanged. Desktop and mobile register the new API and inject their store dispatch at startup via `setSwapQuotesStore`; wallet-cli, which has no app store, sets up a standalone one.

  The endpoint itself now lives in the new `@domain/api-swap-quotes` package; live-common re-exports it, so existing call sites are unchanged.

  Two behaviour changes to be aware of:

  - `/quote` now goes through the authenticated base query, where the legacy axios call sent no credentials. Both apps already register an auth provider on their store's `extra`, so whether a request carries an `Authorization` header is controlled entirely by the `lwdAuth`/`lwmAuth` feature flags. They are disabled by default; enabling either one makes `/quote` send the user's bearer token to the aggregator, and makes a 401/403 trigger the adapter's refresh-and-retry.
  - An aggregator HTTP error (4xx/5xx) now resolves to an empty result, so the caller surfaces the `noQuotes` global. Previously the shared axios error interceptor turned these into `LedgerAPI4xx`/`LedgerAPI5xx`, which propagated to the live app as an error. Only transport failures (no HTTP response) still reject, now with a `SwapQuotesRequestFailed` error rather than a bare RTK Query error object.

- [#20642](https://github.com/LedgerHQ/ledger-live/pull/20642) [`a61f702`](https://github.com/LedgerHQ/ledger-live/commit/a61f702a6e41f2bf84d5602930e261a708507efa) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Persist the pay card hero balance filter across app restarts

- [#20536](https://github.com/LedgerHQ/ledger-live/pull/20536) [`a5cf9e5`](https://github.com/LedgerHQ/ledger-live/commit/a5cf9e5a39aa14140a327a91f4becc1bde054e83) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Wire the Card / Pay debug tool (`@devtools/pay-card`) into the mobile DevTools host, surfacing it alongside feature flags with native-platform overrides (LIVE-35498).

- [#20549](https://github.com/LedgerHQ/ledger-live/pull/20549) [`a2a6813`](https://github.com/LedgerHQ/ledger-live/commit/a2a681330a1f50f95437a77fbfa5c0ec603ab73f) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Persist the payCard slice on mobile: save and restore only { hasSeenFeatureTour } so the Pay feature tour does not reappear after killing and reopening the app

- [#20414](https://github.com/LedgerHQ/ledger-live/pull/20414) [`baba728`](https://github.com/LedgerHQ/ledger-live/commit/baba7280d4495fd1c6a80d18cb50412a21ec9a76) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwm): support bip21/eip681 amount in qr code scan new send flow

- [#20628](https://github.com/LedgerHQ/ledger-live/pull/20628) [`8259d4d`](https://github.com/LedgerHQ/ledger-live/commit/8259d4d1617e640e04441644947332936d9fbe81) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwdm): add matched contact lookup for the send recipient flow

- [#20194](https://github.com/LedgerHQ/ledger-live/pull/20194) [`fb1ba1b`](https://github.com/LedgerHQ/ledger-live/commit/fb1ba1b97d0e50d8780e678073d12faaab290722) Thanks [@CremaFR](https://github.com/CremaFR)! - Show the provider terms of use (and privacy policy) as a footer in the wallet-api swap signing bottom sheet, mirroring desktop.

- [#20518](https://github.com/LedgerHQ/ledger-live/pull/20518) [`ce46179`](https://github.com/LedgerHQ/ledger-live/commit/ce461796d908185e5ea36b630ba71ff9ef8118b8) Thanks [@dilaouid](https://github.com/dilaouid)! - chore(lwdm): refactoring mvvm recipient screen

- [#20430](https://github.com/LedgerHQ/ledger-live/pull/20430) [`647804e`](https://github.com/LedgerHQ/ledger-live/commit/647804ee755d54776e6b8cd96328bee89fb035e4) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Move the recent-addresses domain model and in-memory store into `@domain/entity-recent-addresses`

  `RecentAddress` and `RecentAddressesState` are no longer declared in `@ledgerhq/types-live`; they are now inferred from the Zod schemas in `@domain/entity-recent-addresses`, which also owns `RecentAddressesStore`, `setupRecentAddressesStore` and `getRecentAddressesStore`. Import them from `@domain/entity-recent-addresses`.

  `@ledgerhq/live-common/account/index` still re-exports the store API unchanged, minus the `RecentAddressesCache` alias — use `RecentAddressesState` instead.

  Also fixes the store mutating its own state in place: once a first mutation had been dispatched, immer had frozen that exact object graph, so the next `addAddress` or `removeAddress` on the same currency threw `TypeError: Cannot assign to read only property`. The store now replaces its state instead of mutating it.

- [#20565](https://github.com/LedgerHQ/ledger-live/pull/20565) [`26e534b`](https://github.com/LedgerHQ/ledger-live/commit/26e534bb5f808f66b0577adc336b01581c8b16c8) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Move the Lumen `QueuedBottomSheet` into `@shared/ui-queued-bottom-sheet` (app couplings injected as adapters) so DDD feature packages can consume a queue-aware bottom sheet. Queue APIs use bottom-sheet naming (`QueuedBottomSheetsProvider`, `addBottomSheetToQueue`, …). Legacy `QueuedDrawer` stays in the app. No behaviour change.

- [#20413](https://github.com/LedgerHQ/ledger-live/pull/20413) [`ccbda89`](https://github.com/LedgerHQ/ledger-live/commit/ccbda895d0672222becbe50df61fcf7646618448) Thanks [@deepyjr](https://github.com/deepyjr)! - Add sanctioned address feedback to the Mobile Contacts flow.

- [#20473](https://github.com/LedgerHQ/ledger-live/pull/20473) [`73948c9`](https://github.com/LedgerHQ/ledger-live/commit/73948c9cfdecd63eee106a9ed9dae1495a1198bd) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(lwdm): fix sanctionned ens address check

- [#20612](https://github.com/LedgerHQ/ledger-live/pull/20612) [`52b69ac`](https://github.com/LedgerHQ/ledger-live/commit/52b69ac539007a521578eac0da154f887d62e092) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Retarget mobile off the dada-client shims onto @features/platform-aggregated-assets and @domain/api-aggregated-assets

- [#20111](https://github.com/LedgerHQ/ledger-live/pull/20111) [`aa3ea09`](https://github.com/LedgerHQ/ledger-live/commit/aa3ea0972205b589d2f92e352ac7154d11f872bc) Thanks [@YazhuEth](https://github.com/YazhuEth)! - chore(coin-solana): remove preload and hydrate - fetch validators on demand

  `CurrencyBridge.preload` / `hydrate` are deprecated, and preloading the validators.app
  list slowed down the scan account flow. Validators are now fetched lazily behind a 15min
  LRU cache (`@ledgerhq/coin-solana/validators`) the first time a screen needs them.

  `useSolanaPreloadData` is removed from `@ledgerhq/live-common/families/solana/react`; use
  `useValidators` instead. `getAccountBannerState` now takes the validators as a third argument.

- [#20471](https://github.com/LedgerHQ/ledger-live/pull/20471) [`3aefd3b`](https://github.com/LedgerHQ/ledger-live/commit/3aefd3b23301f693bb5c8b8533c796a9d8fdefe7) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(lwdm): check sanctions for token recipient addresses

- [#20622](https://github.com/LedgerHQ/ledger-live/pull/20622) [`ed79527`](https://github.com/LedgerHQ/ledger-live/commit/ed79527dd83bb950dd6701d1677d6703cec6051c) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - Rename Hedera's `HederaValidator.nodeId` to `id` (string), matching the framework's `Validator.id` and removing the duplicate identity field. Preload caches persisted by earlier versions are migrated on hydration, so upgrading users keep their cached validators. On-chain protocol fields (`Transaction.stakingNodeId`, `HederaDelegation.nodeId`) are unchanged.

- [#20637](https://github.com/LedgerHQ/ledger-live/pull/20637) [`f440c85`](https://github.com/LedgerHQ/ledger-live/commit/f440c85eeb1669f3660ddbff18ae7892bb9f5923) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Retarget the remaining libs consumers and both store roots off the dada-client shims

### Patch Changes

- Updated dependencies [[`3d24a89`](https://github.com/LedgerHQ/ledger-live/commit/3d24a898d59de55364ec29de29eaecb7ca14425d), [`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add), [`8559d54`](https://github.com/LedgerHQ/ledger-live/commit/8559d54293b7854ea2dc900625bdb746720a4a85), [`f080e51`](https://github.com/LedgerHQ/ledger-live/commit/f080e51c682c2ac1239c0417e29b32b79d363eb9), [`e73390c`](https://github.com/LedgerHQ/ledger-live/commit/e73390cfa30d2d7ec7a9644875063c77b42f0713), [`6f6afe2`](https://github.com/LedgerHQ/ledger-live/commit/6f6afe2b6203b5c46cbe450b254be493689c0cad), [`1de30a9`](https://github.com/LedgerHQ/ledger-live/commit/1de30a98a7a3db27f42de0c9608e1d0be748a10e), [`0f89b44`](https://github.com/LedgerHQ/ledger-live/commit/0f89b44de874d3921ff93b323c7db0f00d22cac6), [`6258380`](https://github.com/LedgerHQ/ledger-live/commit/62583805c47b3af4724f6cf693f209c7744228bc), [`f1e93f7`](https://github.com/LedgerHQ/ledger-live/commit/f1e93f79bedea0b6a2c140271769c37cf4e02407), [`02c6f9e`](https://github.com/LedgerHQ/ledger-live/commit/02c6f9e46152894aa97648f50a52efaad38aa86c), [`c4a8141`](https://github.com/LedgerHQ/ledger-live/commit/c4a8141369e63e875fb5bfc9aef3f53362150338), [`feaf2fc`](https://github.com/LedgerHQ/ledger-live/commit/feaf2fcb8b3d71ab731e0ee52243e8d2a87d5604), [`9ef4440`](https://github.com/LedgerHQ/ledger-live/commit/9ef44402ece2207268361bfe4e2af8fbd1396670), [`5297c79`](https://github.com/LedgerHQ/ledger-live/commit/5297c79823362f5e7584886c8193808988ec46fc), [`cc8b5b9`](https://github.com/LedgerHQ/ledger-live/commit/cc8b5b9af4a2ec488b6912d3fcb08bcc8f4b72c3), [`44694e5`](https://github.com/LedgerHQ/ledger-live/commit/44694e54fa5b48e47595840638aee94a98213a37), [`43bf6d8`](https://github.com/LedgerHQ/ledger-live/commit/43bf6d8f6600f70b7c2a85615660e7e150e798bf), [`fd3e81e`](https://github.com/LedgerHQ/ledger-live/commit/fd3e81e80eb5400e739e40e3ed360f40139d2aa4), [`7af726b`](https://github.com/LedgerHQ/ledger-live/commit/7af726b50eb7c8a2712bf734aac5618be61911ef), [`e5ec77b`](https://github.com/LedgerHQ/ledger-live/commit/e5ec77bf92a89c5f9a36a2e5901729e20682ead0), [`2ec3de4`](https://github.com/LedgerHQ/ledger-live/commit/2ec3de4f864bc7bccf02f42b04356bb563f9ed91), [`4d27e41`](https://github.com/LedgerHQ/ledger-live/commit/4d27e41c217cfae16526357a1a78db15c6980950), [`2f297f7`](https://github.com/LedgerHQ/ledger-live/commit/2f297f74dcda8113f86196ecd9c61e327f7981e9), [`f77b3fa`](https://github.com/LedgerHQ/ledger-live/commit/f77b3fa8954e93a00acdbd3e52210561028fd6b8), [`9e1412e`](https://github.com/LedgerHQ/ledger-live/commit/9e1412e08ccccd4af4a7078a797332ea92f86c63), [`aee0e64`](https://github.com/LedgerHQ/ledger-live/commit/aee0e64b491aafc1ca8fea16b1ef124cb183770b), [`9708010`](https://github.com/LedgerHQ/ledger-live/commit/970801044529fe978ccbb8c562cc64c00277d1de), [`5bdffd5`](https://github.com/LedgerHQ/ledger-live/commit/5bdffd5b9590cc65e650fb0d5b28a5fbf2477d00), [`e9a14f8`](https://github.com/LedgerHQ/ledger-live/commit/e9a14f886532f3ee00dc7f28727c762ec75fc9b3), [`91a2953`](https://github.com/LedgerHQ/ledger-live/commit/91a29531167176557194d9adbc6b55ff11363b8d), [`3e0ae80`](https://github.com/LedgerHQ/ledger-live/commit/3e0ae805b065eaa3d5fd3c1ab35c0d7f8e2a170f), [`c904346`](https://github.com/LedgerHQ/ledger-live/commit/c9043466032fab4f9c2ae02d4bd52970ad8fbcfe), [`60b4626`](https://github.com/LedgerHQ/ledger-live/commit/60b462653bad19429c46ebef439ec2b5bb234140), [`64bb8cf`](https://github.com/LedgerHQ/ledger-live/commit/64bb8cfa5bffde5a1e2c24615f1dd11b864094d2), [`a1bd49e`](https://github.com/LedgerHQ/ledger-live/commit/a1bd49ec9190a395730b3348fef5c0987e4eaeb7), [`e1e005d`](https://github.com/LedgerHQ/ledger-live/commit/e1e005daff0d3e01ef397ac752cbc711245539a7), [`1e9db75`](https://github.com/LedgerHQ/ledger-live/commit/1e9db750a4882f9db7f95278e33c00262487b37b), [`0e439a0`](https://github.com/LedgerHQ/ledger-live/commit/0e439a0b73f1ad49aab32e98dfaf4fbd1d0ded04), [`a61f702`](https://github.com/LedgerHQ/ledger-live/commit/a61f702a6e41f2bf84d5602930e261a708507efa), [`40efdfb`](https://github.com/LedgerHQ/ledger-live/commit/40efdfbb42cdc94b8efb59a9aa45992ff7c64653), [`2edf614`](https://github.com/LedgerHQ/ledger-live/commit/2edf614eed7608714821ee54574d8c4d2b6f7d98), [`9e45705`](https://github.com/LedgerHQ/ledger-live/commit/9e45705b649513c3f9797c2add485a0ba3ea7a6c), [`ac57e97`](https://github.com/LedgerHQ/ledger-live/commit/ac57e970074572eb99e989c8f5a1a6bd227c922b), [`6694d77`](https://github.com/LedgerHQ/ledger-live/commit/6694d77f1fc4a691e2d97a2d44e8bf9513cecb1e), [`bbfc8cf`](https://github.com/LedgerHQ/ledger-live/commit/bbfc8cf7929d9bffc1aa1b9a5e3b9593e3016436), [`647804e`](https://github.com/LedgerHQ/ledger-live/commit/647804ee755d54776e6b8cd96328bee89fb035e4), [`6d45e7c`](https://github.com/LedgerHQ/ledger-live/commit/6d45e7c4245be9acaf2f3a86f48d38e5677d8e96), [`79d2278`](https://github.com/LedgerHQ/ledger-live/commit/79d22789896f55d9a7196392632b08488997d937), [`5edd732`](https://github.com/LedgerHQ/ledger-live/commit/5edd732aa9fd1769667a349b513ebdb985a1475c), [`8a3a0bb`](https://github.com/LedgerHQ/ledger-live/commit/8a3a0bbd8361706daac364d4c89894f56431fc57), [`71b1069`](https://github.com/LedgerHQ/ledger-live/commit/71b1069ae8358b4d3fa3a6a5d4fb2d49f1c1c7d7), [`ccbda89`](https://github.com/LedgerHQ/ledger-live/commit/ccbda895d0672222becbe50df61fcf7646618448), [`9ea6eed`](https://github.com/LedgerHQ/ledger-live/commit/9ea6eedc129c4d496ec745a6affeddb136d3680f), [`aaa67a7`](https://github.com/LedgerHQ/ledger-live/commit/aaa67a733e16cdfcb3f02b22038b0ae5518fb0ec), [`c9eab39`](https://github.com/LedgerHQ/ledger-live/commit/c9eab39bff1f46fc63c8717237390aa94fb78dec), [`bdd82c4`](https://github.com/LedgerHQ/ledger-live/commit/bdd82c435d01d56397fe0967e92825f0442bf487), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152), [`78ebc73`](https://github.com/LedgerHQ/ledger-live/commit/78ebc736177e9e751f4d7a7a6a3fae97a1913c1f), [`b0e81d2`](https://github.com/LedgerHQ/ledger-live/commit/b0e81d2edc7c40e2c81236ea372370859d05d0bc), [`b9d4a22`](https://github.com/LedgerHQ/ledger-live/commit/b9d4a2209b5fff587c67ea8868bcf553fcc4ecbd), [`e664d84`](https://github.com/LedgerHQ/ledger-live/commit/e664d84bc45a0bde9f4794c96d43e8a7eebb83b9)]:
  - @ledgerhq/coin-bitcoin@0.51.0
  - @ledgerhq/coin-canton@0.33.0
  - @ledgerhq/coin-casper@2.19.0
  - @ledgerhq/coin-concordium@0.20.0
  - @ledgerhq/coin-cosmos@0.43.0
  - @ledgerhq/coin-evm@4.10.0
  - @ledgerhq/coin-filecoin@1.32.0
  - @ledgerhq/coin-multiversx@0.24.0
  - @ledgerhq/coin-stacks@0.28.0
  - @features/flow-contacts@0.6.0
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
  - @features/flow-lazy-onboarding-banner@0.2.0
  - @domain/api-aggregated-assets@0.3.0
  - @domain/entity-interest-rate@0.3.0
  - @ledgerhq/hw-transport-http@6.37.0
  - @ledgerhq/types-devices@6.32.0
  - @domain/entity-pay-card@0.3.0
  - @devtools/bindings@0.3.0
  - @devtools/transport-panel@0.4.0
  - @devtools/shell@0.8.0
  - @ledgerhq/live-dmk-shared@0.30.0
  - @features/platform-wallet-sync@0.1.1
  - @ledgerhq/live-currency-format@0.14.1
  - @ledgerhq/wallet-analytics@0.3.3
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
  - @ledgerhq/device-intent@5.0.0
  - @ledgerhq/live-dmk-mobile@0.29.3
  - @domain/api-pay-card@0.2.1
  - @shared/ui-queued-bottom-sheet@0.1.0
  - @features/flow-analytics-consent@0.2.1

## 4.16.0-next.0

### Minor Changes

- [#20278](https://github.com/LedgerHQ/ledger-live/pull/20278) [`3d24a89`](https://github.com/LedgerHQ/ledger-live/commit/3d24a898d59de55364ec29de29eaecb7ca14425d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop the `@ledgerhq/errors` dependency, completing the errors sunset (LIVE-32915).

  The `@ledgerhq/errors` package is removed from the monorepo: no workspace source imported it anymore, every error class it held now lives in the package that owns it (`@ledgerhq/ledger-wallet-framework/errors` for the ones shared across coin modules). `createCustomErrorClass` and the `serializeError` / `deserializeError` stack are gone with it — define errors as native classes and branch on `error.name`.

  `@ledgerhq/errors@6.37.0` stays on npm for external consumers, but is no longer published from this repo.

- [#20280](https://github.com/LedgerHQ/ledger-live/pull/20280) [`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Stop depending on `@ledgerhq/errors` (LIVE-32915).

  No workspace package declares it anymore, and none may again: `enforce-boundaries` now fails CI on any manifest that does. The classes it held live in the package that owns them, with `@ledgerhq/ledger-wallet-framework/errors` as the shared home below the coin layer.

  The package itself stays in the repo so it keeps being published for external consumers, and is bridged to the external coin packages that still peer-depend on it via `pnpm.packageExtensions` using `workspace:*` (which reuses the single in-repo copy, so the dependency graph keeps exactly the physical copies it had before). [LedgerHQ/coin-modules#752](https://github.com/LedgerHQ/coin-modules/pull/752) removes that peerDependency upstream; once it is released the bridge can be dropped, but the package still needs publishing.

- [#20580](https://github.com/LedgerHQ/ledger-live/pull/20580) [`9b3fb2a`](https://github.com/LedgerHQ/ledger-live/commit/9b3fb2a98eaa530c12e55eb3391f58a306c80d8f) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwm): update lwm init params new send flow recipient

- [#20315](https://github.com/LedgerHQ/ledger-live/pull/20315) [`4b73f81`](https://github.com/LedgerHQ/ledger-live/commit/4b73f81aca25a92178850b3f7ac7519a7efcac67) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Portfolio upsell banner and Braze content cards can now coexist on Portfolio (Mobile: shared carousel; Desktop: side-by-side grid when Braze placement is enabled, otherwise upsell stacked above the Braze carousel).

- [#20404](https://github.com/LedgerHQ/ledger-live/pull/20404) [`0f89b44`](https://github.com/LedgerHQ/ledger-live/commit/0f89b44de874d3921ff93b323c7db0f00d22cac6) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Replace the legacy Pay Card placeholders with the shared authentication flow on desktop and mobile

- [#20633](https://github.com/LedgerHQ/ledger-live/pull/20633) [`67b2d83`](https://github.com/LedgerHQ/ledger-live/commit/67b2d835c65d4827f58580e15c8470ae631a6944) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Stop auto-opening the mobile product tour; open only from hub, deeplink, or debug

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

- [#20619](https://github.com/LedgerHQ/ledger-live/pull/20619) [`0175f1f`](https://github.com/LedgerHQ/ledger-live/commit/0175f1ffab7a31fe882b3538d5a87619c331bf54) Thanks [@qperrot](https://github.com/qperrot)! - Chore: add tests for memo on the new send flow

- [#20207](https://github.com/LedgerHQ/ledger-live/pull/20207) [`aee0e64`](https://github.com/LedgerHQ/ledger-live/commit/aee0e64b491aafc1ca8fea16b1ef124cb183770b) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Add Internet Computer (ICP) neuron staking to the coin module: create and top up neurons, start/stop dissolving, disburse, set/increase dissolve delay, follow, split, spawn, stake maturity, and add/remove hot keys, plus neuron listing. Governance operations are routed through the NNS governance canister via the device's update-call signing, alongside the existing ledger transfer path, and account synchronization now carries neuron data. Adds the `STAKE_NEURON` and `TOP_UP_NEURON` operation types, with matching icons and labels in the desktop and mobile operation history. (LIVE-28469)

- [#20290](https://github.com/LedgerHQ/ledger-live/pull/20290) [`9708010`](https://github.com/LedgerHQ/ledger-live/commit/970801044529fe978ccbb8c562cc64c00277d1de) Thanks [@sarneijim](https://github.com/sarneijim)! - Add the shared lazy onboarding banner flow, its Mobile portfolio view and configurable Shop link feature flag.

- [#20456](https://github.com/LedgerHQ/ledger-live/pull/20456) [`a0f13a2`](https://github.com/LedgerHQ/ledger-live/commit/a0f13a2b5410acc1e03231a94a5af9d77b6dabf6) Thanks [@sarneijim](https://github.com/sarneijim)! - Use fixed legacy onboarding date for backfill instead of app-open date

- [#20458](https://github.com/LedgerHQ/ledger-live/pull/20458) [`9876163`](https://github.com/LedgerHQ/ledger-live/commit/9876163c9686f72fead2004a6388764536c29cfd) Thanks [@sarneijim](https://github.com/sarneijim)! - Use legacy onboarding date fallback in large-screen upsell eligibility

- [#19169](https://github.com/LedgerHQ/ledger-live/pull/19169) [`92b70ef`](https://github.com/LedgerHQ/ledger-live/commit/92b70ef6318741216740d7341f37627c32a3f0d6) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Preserve installed apps in Device Intent Executor last seen device info.

- [#20409](https://github.com/LedgerHQ/ledger-live/pull/20409) [`91a2953`](https://github.com/LedgerHQ/ledger-live/commit/91a29531167176557194d9adbc6b55ff11363b8d) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Wire mobile contact address detail send, edit, and delete actions with confirmation sheets.

- [#20559](https://github.com/LedgerHQ/ledger-live/pull/20559) [`c904346`](https://github.com/LedgerHQ/ledger-live/commit/c9043466032fab4f9c2ae02d4bd52970ad8fbcfe) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Render Mobile Contacts address edit signer mismatch error and extract shared address detail action labels and UI state mapping.

- [#20539](https://github.com/LedgerHQ/ledger-live/pull/20539) [`60b4626`](https://github.com/LedgerHQ/ledger-live/commit/60b462653bad19429c46ebef439ec2b5bb234140) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Scope `@ledgerhq/live-wallet` down to wallet sync only

  The package now exposes `./accounts` and `./walletSyncComposition` and nothing else.
  `ordering.ts` and `addAccounts.ts` move to `@ledgerhq/live-common/account/*`, and
  `accountRawToAccountUserData` joins `live-common/account/serialization` next to `fromAccountRaw`.
  The `liveqr/` folder is gone: `importAccounts.ts` and `accountToAccountData` were unreachable, and
  `accountDataToAccount` — whose only callers rehydrated a wallet-sync descriptor — becomes
  `accounts/descriptorToAccount`. `live-common` no longer depends on `live-wallet`.

- [#20510](https://github.com/LedgerHQ/ledger-live/pull/20510) [`a1bd49e`](https://github.com/LedgerHQ/ledger-live/commit/a1bd49ec9190a395730b3348fef5c0987e4eaeb7) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Model Me as the default self contact with shared display-name formatting, external address counts, and a Ledger Wallet accounts intent.

- [#18764](https://github.com/LedgerHQ/ledger-live/pull/18764) [`d266e13`](https://github.com/LedgerHQ/ledger-live/commit/d266e13aa8e8b34ca74beaa09687b6e8d426f821) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Migrate the swap `fetchQuotes` helper from axios to an RTK Query endpoint (`swapQuotesApi`). The aggregator `/quote` request now flows through the Redux data layer, and the rawQuotes/providerErrors split is unchanged. Desktop and mobile register the new API and inject their store dispatch at startup via `setSwapQuotesStore`; wallet-cli, which has no app store, sets up a standalone one.

  The endpoint itself now lives in the new `@domain/api-swap-quotes` package; live-common re-exports it, so existing call sites are unchanged.

  Two behaviour changes to be aware of:

  - `/quote` now goes through the authenticated base query, where the legacy axios call sent no credentials. Both apps already register an auth provider on their store's `extra`, so whether a request carries an `Authorization` header is controlled entirely by the `lwdAuth`/`lwmAuth` feature flags. They are disabled by default; enabling either one makes `/quote` send the user's bearer token to the aggregator, and makes a 401/403 trigger the adapter's refresh-and-retry.
  - An aggregator HTTP error (4xx/5xx) now resolves to an empty result, so the caller surfaces the `noQuotes` global. Previously the shared axios error interceptor turned these into `LedgerAPI4xx`/`LedgerAPI5xx`, which propagated to the live app as an error. Only transport failures (no HTTP response) still reject, now with a `SwapQuotesRequestFailed` error rather than a bare RTK Query error object.

- [#20642](https://github.com/LedgerHQ/ledger-live/pull/20642) [`a61f702`](https://github.com/LedgerHQ/ledger-live/commit/a61f702a6e41f2bf84d5602930e261a708507efa) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Persist the pay card hero balance filter across app restarts

- [#20536](https://github.com/LedgerHQ/ledger-live/pull/20536) [`a5cf9e5`](https://github.com/LedgerHQ/ledger-live/commit/a5cf9e5a39aa14140a327a91f4becc1bde054e83) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Wire the Card / Pay debug tool (`@devtools/pay-card`) into the mobile DevTools host, surfacing it alongside feature flags with native-platform overrides (LIVE-35498).

- [#20549](https://github.com/LedgerHQ/ledger-live/pull/20549) [`a2a6813`](https://github.com/LedgerHQ/ledger-live/commit/a2a681330a1f50f95437a77fbfa5c0ec603ab73f) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Persist the payCard slice on mobile: save and restore only { hasSeenFeatureTour } so the Pay feature tour does not reappear after killing and reopening the app

- [#20414](https://github.com/LedgerHQ/ledger-live/pull/20414) [`baba728`](https://github.com/LedgerHQ/ledger-live/commit/baba7280d4495fd1c6a80d18cb50412a21ec9a76) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwm): support bip21/eip681 amount in qr code scan new send flow

- [#20628](https://github.com/LedgerHQ/ledger-live/pull/20628) [`8259d4d`](https://github.com/LedgerHQ/ledger-live/commit/8259d4d1617e640e04441644947332936d9fbe81) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwdm): add matched contact lookup for the send recipient flow

- [#20194](https://github.com/LedgerHQ/ledger-live/pull/20194) [`fb1ba1b`](https://github.com/LedgerHQ/ledger-live/commit/fb1ba1b97d0e50d8780e678073d12faaab290722) Thanks [@CremaFR](https://github.com/CremaFR)! - Show the provider terms of use (and privacy policy) as a footer in the wallet-api swap signing bottom sheet, mirroring desktop.

- [#20518](https://github.com/LedgerHQ/ledger-live/pull/20518) [`ce46179`](https://github.com/LedgerHQ/ledger-live/commit/ce461796d908185e5ea36b630ba71ff9ef8118b8) Thanks [@dilaouid](https://github.com/dilaouid)! - chore(lwdm): refactoring mvvm recipient screen

- [#20430](https://github.com/LedgerHQ/ledger-live/pull/20430) [`647804e`](https://github.com/LedgerHQ/ledger-live/commit/647804ee755d54776e6b8cd96328bee89fb035e4) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Move the recent-addresses domain model and in-memory store into `@domain/entity-recent-addresses`

  `RecentAddress` and `RecentAddressesState` are no longer declared in `@ledgerhq/types-live`; they are now inferred from the Zod schemas in `@domain/entity-recent-addresses`, which also owns `RecentAddressesStore`, `setupRecentAddressesStore` and `getRecentAddressesStore`. Import them from `@domain/entity-recent-addresses`.

  `@ledgerhq/live-common/account/index` still re-exports the store API unchanged, minus the `RecentAddressesCache` alias — use `RecentAddressesState` instead.

  Also fixes the store mutating its own state in place: once a first mutation had been dispatched, immer had frozen that exact object graph, so the next `addAddress` or `removeAddress` on the same currency threw `TypeError: Cannot assign to read only property`. The store now replaces its state instead of mutating it.

- [#20565](https://github.com/LedgerHQ/ledger-live/pull/20565) [`26e534b`](https://github.com/LedgerHQ/ledger-live/commit/26e534bb5f808f66b0577adc336b01581c8b16c8) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Move the Lumen `QueuedBottomSheet` into `@shared/ui-queued-bottom-sheet` (app couplings injected as adapters) so DDD feature packages can consume a queue-aware bottom sheet. Queue APIs use bottom-sheet naming (`QueuedBottomSheetsProvider`, `addBottomSheetToQueue`, …). Legacy `QueuedDrawer` stays in the app. No behaviour change.

- [#20413](https://github.com/LedgerHQ/ledger-live/pull/20413) [`ccbda89`](https://github.com/LedgerHQ/ledger-live/commit/ccbda895d0672222becbe50df61fcf7646618448) Thanks [@deepyjr](https://github.com/deepyjr)! - Add sanctioned address feedback to the Mobile Contacts flow.

- [#20473](https://github.com/LedgerHQ/ledger-live/pull/20473) [`73948c9`](https://github.com/LedgerHQ/ledger-live/commit/73948c9cfdecd63eee106a9ed9dae1495a1198bd) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(lwdm): fix sanctionned ens address check

- [#20612](https://github.com/LedgerHQ/ledger-live/pull/20612) [`52b69ac`](https://github.com/LedgerHQ/ledger-live/commit/52b69ac539007a521578eac0da154f887d62e092) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Retarget mobile off the dada-client shims onto @features/platform-aggregated-assets and @domain/api-aggregated-assets

- [#20111](https://github.com/LedgerHQ/ledger-live/pull/20111) [`aa3ea09`](https://github.com/LedgerHQ/ledger-live/commit/aa3ea0972205b589d2f92e352ac7154d11f872bc) Thanks [@YazhuEth](https://github.com/YazhuEth)! - chore(coin-solana): remove preload and hydrate - fetch validators on demand

  `CurrencyBridge.preload` / `hydrate` are deprecated, and preloading the validators.app
  list slowed down the scan account flow. Validators are now fetched lazily behind a 15min
  LRU cache (`@ledgerhq/coin-solana/validators`) the first time a screen needs them.

  `useSolanaPreloadData` is removed from `@ledgerhq/live-common/families/solana/react`; use
  `useValidators` instead. `getAccountBannerState` now takes the validators as a third argument.

- [#20471](https://github.com/LedgerHQ/ledger-live/pull/20471) [`3aefd3b`](https://github.com/LedgerHQ/ledger-live/commit/3aefd3b23301f693bb5c8b8533c796a9d8fdefe7) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(lwdm): check sanctions for token recipient addresses

- [#20622](https://github.com/LedgerHQ/ledger-live/pull/20622) [`ed79527`](https://github.com/LedgerHQ/ledger-live/commit/ed79527dd83bb950dd6701d1677d6703cec6051c) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - Rename Hedera's `HederaValidator.nodeId` to `id` (string), matching the framework's `Validator.id` and removing the duplicate identity field. Preload caches persisted by earlier versions are migrated on hydration, so upgrading users keep their cached validators. On-chain protocol fields (`Transaction.stakingNodeId`, `HederaDelegation.nodeId`) are unchanged.

- [#20637](https://github.com/LedgerHQ/ledger-live/pull/20637) [`f440c85`](https://github.com/LedgerHQ/ledger-live/commit/f440c85eeb1669f3660ddbff18ae7892bb9f5923) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Retarget the remaining libs consumers and both store roots off the dada-client shims

### Patch Changes

- Updated dependencies [[`3d24a89`](https://github.com/LedgerHQ/ledger-live/commit/3d24a898d59de55364ec29de29eaecb7ca14425d), [`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add), [`8559d54`](https://github.com/LedgerHQ/ledger-live/commit/8559d54293b7854ea2dc900625bdb746720a4a85), [`f080e51`](https://github.com/LedgerHQ/ledger-live/commit/f080e51c682c2ac1239c0417e29b32b79d363eb9), [`e73390c`](https://github.com/LedgerHQ/ledger-live/commit/e73390cfa30d2d7ec7a9644875063c77b42f0713), [`6f6afe2`](https://github.com/LedgerHQ/ledger-live/commit/6f6afe2b6203b5c46cbe450b254be493689c0cad), [`1de30a9`](https://github.com/LedgerHQ/ledger-live/commit/1de30a98a7a3db27f42de0c9608e1d0be748a10e), [`0f89b44`](https://github.com/LedgerHQ/ledger-live/commit/0f89b44de874d3921ff93b323c7db0f00d22cac6), [`6258380`](https://github.com/LedgerHQ/ledger-live/commit/62583805c47b3af4724f6cf693f209c7744228bc), [`f1e93f7`](https://github.com/LedgerHQ/ledger-live/commit/f1e93f79bedea0b6a2c140271769c37cf4e02407), [`02c6f9e`](https://github.com/LedgerHQ/ledger-live/commit/02c6f9e46152894aa97648f50a52efaad38aa86c), [`c4a8141`](https://github.com/LedgerHQ/ledger-live/commit/c4a8141369e63e875fb5bfc9aef3f53362150338), [`feaf2fc`](https://github.com/LedgerHQ/ledger-live/commit/feaf2fcb8b3d71ab731e0ee52243e8d2a87d5604), [`9ef4440`](https://github.com/LedgerHQ/ledger-live/commit/9ef44402ece2207268361bfe4e2af8fbd1396670), [`5297c79`](https://github.com/LedgerHQ/ledger-live/commit/5297c79823362f5e7584886c8193808988ec46fc), [`cc8b5b9`](https://github.com/LedgerHQ/ledger-live/commit/cc8b5b9af4a2ec488b6912d3fcb08bcc8f4b72c3), [`44694e5`](https://github.com/LedgerHQ/ledger-live/commit/44694e54fa5b48e47595840638aee94a98213a37), [`43bf6d8`](https://github.com/LedgerHQ/ledger-live/commit/43bf6d8f6600f70b7c2a85615660e7e150e798bf), [`fd3e81e`](https://github.com/LedgerHQ/ledger-live/commit/fd3e81e80eb5400e739e40e3ed360f40139d2aa4), [`7af726b`](https://github.com/LedgerHQ/ledger-live/commit/7af726b50eb7c8a2712bf734aac5618be61911ef), [`e5ec77b`](https://github.com/LedgerHQ/ledger-live/commit/e5ec77bf92a89c5f9a36a2e5901729e20682ead0), [`2ec3de4`](https://github.com/LedgerHQ/ledger-live/commit/2ec3de4f864bc7bccf02f42b04356bb563f9ed91), [`4d27e41`](https://github.com/LedgerHQ/ledger-live/commit/4d27e41c217cfae16526357a1a78db15c6980950), [`2f297f7`](https://github.com/LedgerHQ/ledger-live/commit/2f297f74dcda8113f86196ecd9c61e327f7981e9), [`f77b3fa`](https://github.com/LedgerHQ/ledger-live/commit/f77b3fa8954e93a00acdbd3e52210561028fd6b8), [`9e1412e`](https://github.com/LedgerHQ/ledger-live/commit/9e1412e08ccccd4af4a7078a797332ea92f86c63), [`aee0e64`](https://github.com/LedgerHQ/ledger-live/commit/aee0e64b491aafc1ca8fea16b1ef124cb183770b), [`9708010`](https://github.com/LedgerHQ/ledger-live/commit/970801044529fe978ccbb8c562cc64c00277d1de), [`5bdffd5`](https://github.com/LedgerHQ/ledger-live/commit/5bdffd5b9590cc65e650fb0d5b28a5fbf2477d00), [`e9a14f8`](https://github.com/LedgerHQ/ledger-live/commit/e9a14f886532f3ee00dc7f28727c762ec75fc9b3), [`91a2953`](https://github.com/LedgerHQ/ledger-live/commit/91a29531167176557194d9adbc6b55ff11363b8d), [`3e0ae80`](https://github.com/LedgerHQ/ledger-live/commit/3e0ae805b065eaa3d5fd3c1ab35c0d7f8e2a170f), [`c904346`](https://github.com/LedgerHQ/ledger-live/commit/c9043466032fab4f9c2ae02d4bd52970ad8fbcfe), [`60b4626`](https://github.com/LedgerHQ/ledger-live/commit/60b462653bad19429c46ebef439ec2b5bb234140), [`64bb8cf`](https://github.com/LedgerHQ/ledger-live/commit/64bb8cfa5bffde5a1e2c24615f1dd11b864094d2), [`a1bd49e`](https://github.com/LedgerHQ/ledger-live/commit/a1bd49ec9190a395730b3348fef5c0987e4eaeb7), [`e1e005d`](https://github.com/LedgerHQ/ledger-live/commit/e1e005daff0d3e01ef397ac752cbc711245539a7), [`1e9db75`](https://github.com/LedgerHQ/ledger-live/commit/1e9db750a4882f9db7f95278e33c00262487b37b), [`0e439a0`](https://github.com/LedgerHQ/ledger-live/commit/0e439a0b73f1ad49aab32e98dfaf4fbd1d0ded04), [`a61f702`](https://github.com/LedgerHQ/ledger-live/commit/a61f702a6e41f2bf84d5602930e261a708507efa), [`40efdfb`](https://github.com/LedgerHQ/ledger-live/commit/40efdfbb42cdc94b8efb59a9aa45992ff7c64653), [`2edf614`](https://github.com/LedgerHQ/ledger-live/commit/2edf614eed7608714821ee54574d8c4d2b6f7d98), [`9e45705`](https://github.com/LedgerHQ/ledger-live/commit/9e45705b649513c3f9797c2add485a0ba3ea7a6c), [`ac57e97`](https://github.com/LedgerHQ/ledger-live/commit/ac57e970074572eb99e989c8f5a1a6bd227c922b), [`6694d77`](https://github.com/LedgerHQ/ledger-live/commit/6694d77f1fc4a691e2d97a2d44e8bf9513cecb1e), [`bbfc8cf`](https://github.com/LedgerHQ/ledger-live/commit/bbfc8cf7929d9bffc1aa1b9a5e3b9593e3016436), [`647804e`](https://github.com/LedgerHQ/ledger-live/commit/647804ee755d54776e6b8cd96328bee89fb035e4), [`6d45e7c`](https://github.com/LedgerHQ/ledger-live/commit/6d45e7c4245be9acaf2f3a86f48d38e5677d8e96), [`79d2278`](https://github.com/LedgerHQ/ledger-live/commit/79d22789896f55d9a7196392632b08488997d937), [`5edd732`](https://github.com/LedgerHQ/ledger-live/commit/5edd732aa9fd1769667a349b513ebdb985a1475c), [`8a3a0bb`](https://github.com/LedgerHQ/ledger-live/commit/8a3a0bbd8361706daac364d4c89894f56431fc57), [`71b1069`](https://github.com/LedgerHQ/ledger-live/commit/71b1069ae8358b4d3fa3a6a5d4fb2d49f1c1c7d7), [`ccbda89`](https://github.com/LedgerHQ/ledger-live/commit/ccbda895d0672222becbe50df61fcf7646618448), [`9ea6eed`](https://github.com/LedgerHQ/ledger-live/commit/9ea6eedc129c4d496ec745a6affeddb136d3680f), [`aaa67a7`](https://github.com/LedgerHQ/ledger-live/commit/aaa67a733e16cdfcb3f02b22038b0ae5518fb0ec), [`c9eab39`](https://github.com/LedgerHQ/ledger-live/commit/c9eab39bff1f46fc63c8717237390aa94fb78dec), [`bdd82c4`](https://github.com/LedgerHQ/ledger-live/commit/bdd82c435d01d56397fe0967e92825f0442bf487), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152), [`78ebc73`](https://github.com/LedgerHQ/ledger-live/commit/78ebc736177e9e751f4d7a7a6a3fae97a1913c1f), [`b0e81d2`](https://github.com/LedgerHQ/ledger-live/commit/b0e81d2edc7c40e2c81236ea372370859d05d0bc), [`b9d4a22`](https://github.com/LedgerHQ/ledger-live/commit/b9d4a2209b5fff587c67ea8868bcf553fcc4ecbd), [`e664d84`](https://github.com/LedgerHQ/ledger-live/commit/e664d84bc45a0bde9f4794c96d43e8a7eebb83b9)]:
  - @ledgerhq/coin-bitcoin@0.51.0-next.0
  - @ledgerhq/coin-canton@0.33.0-next.0
  - @ledgerhq/coin-casper@2.19.0-next.0
  - @ledgerhq/coin-concordium@0.20.0-next.0
  - @ledgerhq/coin-cosmos@0.43.0-next.0
  - @ledgerhq/coin-evm@4.10.0-next.0
  - @ledgerhq/coin-filecoin@1.32.0-next.0
  - @ledgerhq/coin-multiversx@0.24.0-next.0
  - @ledgerhq/coin-stacks@0.28.0-next.0
  - @features/flow-contacts@0.6.0-next.0
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
  - @features/flow-lazy-onboarding-banner@0.2.0-next.0
  - @domain/api-aggregated-assets@0.3.0-next.0
  - @domain/entity-interest-rate@0.3.0-next.0
  - @ledgerhq/hw-transport-http@6.37.0-next.0
  - @ledgerhq/types-devices@6.32.0-next.0
  - @domain/entity-pay-card@0.3.0-next.0
  - @devtools/bindings@0.3.0-next.0
  - @devtools/transport-panel@0.4.0-next.0
  - @devtools/shell@0.8.0-next.0
  - @ledgerhq/live-dmk-shared@0.30.0-next.0
  - @features/platform-wallet-sync@0.1.1-next.0
  - @ledgerhq/live-currency-format@0.14.1
  - @ledgerhq/wallet-analytics@0.3.3-next.0
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
  - @ledgerhq/device-intent@5.0.0-next.0
  - @ledgerhq/live-dmk-mobile@0.29.3-next.0
  - @domain/api-pay-card@0.2.1-next.0
  - @shared/ui-queued-bottom-sheet@0.1.0
  - @features/flow-analytics-consent@0.2.1-next.0

## 4.15.0

### Minor Changes

- [#20280](https://github.com/LedgerHQ/ledger-live/pull/20280) [`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Stop depending on `@ledgerhq/errors` (LIVE-32915).

  No workspace package declares it anymore, and none may again: `enforce-boundaries` now fails CI on any manifest that does. The classes it held live in the package that owns them, with `@ledgerhq/ledger-wallet-framework/errors` as the shared home below the coin layer.

  The package itself stays in the repo so it keeps being published for external consumers, and is bridged to the external coin packages that still peer-depend on it via `pnpm.packageExtensions` using `workspace:*` (which reuses the single in-repo copy, so the dependency graph keeps exactly the physical copies it had before). [LedgerHQ/coin-modules#752](https://github.com/LedgerHQ/coin-modules/pull/752) removes that peerDependency upstream; once it is released the bridge can be dropped, but the package still needs publishing.

- [#20262](https://github.com/LedgerHQ/ledger-live/pull/20262) [`03f2ac2`](https://github.com/LedgerHQ/ledger-live/commit/03f2ac27df5c85f6b2218268e6f05a7012462b1a) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove the `CryptoIcon` passthrough component from `@ledgerhq/native-ui/pre-ldls` and consume `@ledgerhq/crypto-icons/native` directly in ledger-live-mobile. `@ledgerhq/crypto-icons` is no longer a dependency of `@ledgerhq/native-ui`, and the `@ledgerhq/lumen-ui-rnative` / `@ledgerhq/lumen-design-core` peer dependencies it required are dropped as well.

- [#20237](https://github.com/LedgerHQ/ledger-live/pull/20237) [`9178d13`](https://github.com/LedgerHQ/ledger-live/commit/9178d13ae8391b900a274621c43ebb242616c5fa) Thanks [@Valentin-Ledger](https://github.com/Valentin-Ledger)! - Align Earn deposit flow header and webview shell with the live-app canvas when swapToEarn is enabled

- [#20341](https://github.com/LedgerHQ/ledger-live/pull/20341) [`c016a95`](https://github.com/LedgerHQ/ledger-live/commit/c016a95538dfef2d7ddf1a17914d8cb3e55b644e) Thanks [@ysitbon](https://github.com/ysitbon)! - Split backend access from use case in the RTK Query layer

  `@shared/api-services` now holds one endpoint-less `createApi` per backend (CAL, CoinMarketCap,
  Countervalues, Push Devices), owning its base query, `extraArgument` contract and reducer path.
  `domain/api/*` packages add their endpoints with `injectEndpoints` and their own cache tags with
  `enhanceEndpoints`, so one reducer, middleware and cache now serve every use case on a backend — the two
  CoinMarketCap packages previously had one each. Apps register the service apis.

  `extraArgument` builder names are unchanged, so only import paths move. Reducer paths are renamed after
  their backend (`calApi`, `coinMarketCapApi`, `countervaluesApi`); no persisted data and no endpoint
  behaviour is affected.

- [#20182](https://github.com/LedgerHQ/ledger-live/pull/20182) [`12794fa`](https://github.com/LedgerHQ/ledger-live/commit/12794fac12e62fd124a647434d044d51c3081242) Thanks [@deepyjr](https://github.com/deepyjr)! - Compose Mobile Contacts currency and address steps in one queued drawer with reusable placeholders.

- [#20093](https://github.com/LedgerHQ/ledger-live/pull/20093) [`56cfe0b`](https://github.com/LedgerHQ/ledger-live/commit/56cfe0bc6673f416f739c1593abfec718230952d) Thanks [@sarneijim](https://github.com/sarneijim)! - Use the shared large-screen upsell configuration and eligibility for mobile upgrade banners.

- [#20318](https://github.com/LedgerHQ/ledger-live/pull/20318) [`e0d421b`](https://github.com/LedgerHQ/ledger-live/commit/e0d421b5e20323f4e4ea14ec1566f6e9ba0d0189) Thanks [@deepyjr](https://github.com/deepyjr)! - Block sanctioned addresses in the Contacts add-address flow

- [#20330](https://github.com/LedgerHQ/ledger-live/pull/20330) [`532d6c4`](https://github.com/LedgerHQ/ledger-live/commit/532d6c421fe25456bea2e169a1fbc095e6b7cf5a) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add shared stored-policy inspector status helper and use it on mobile analytics consent QA

- [#20211](https://github.com/LedgerHQ/ledger-live/pull/20211) [`4cc4000`](https://github.com/LedgerHQ/ledger-live/commit/4cc4000b392291956fc63d2c98295546fcbebc98) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Renew mobile analytics consent from policyVersion major/minor semantics

- [#20185](https://github.com/LedgerHQ/ledger-live/pull/20185) [`f9a1f1f`](https://github.com/LedgerHQ/ledger-live/commit/f9a1f1f9c4f7f4373fe663f92db1567853bc9d13) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Add Close all control to the top-wallet hardware carousel with analytics tracking.

- [#20240](https://github.com/LedgerHQ/ledger-live/pull/20240) [`15e4608`](https://github.com/LedgerHQ/ledger-live/commit/15e4608db80de6909f96f795d8a888994510e07d) Thanks [@deepyjr](https://github.com/deepyjr)! - Forward Modular Asset Drawer network filters to DADA asset requests.

- [#20197](https://github.com/LedgerHQ/ledger-live/pull/20197) [`507e450`](https://github.com/LedgerHQ/ledger-live/commit/507e450759f95ed42d5ce7f452825b89dba1df7f) Thanks [@ysitbon](https://github.com/ysitbon)! - Drop boot fiat fetch and `InitialQueriesContext`: `supportedCounterValues` is now a derived selector backed by the `supportedFiats` slice. Mobile gains a read-time OFAC guard on `counterValueCurrencyLocalSelector`; desktop removes its boot-time `getSupportedFiats.initiate` dispatch. Both apps now lazy-load the CVS query from the two picker screens.

- [#20078](https://github.com/LedgerHQ/ledger-live/pull/20078) [`baea85e`](https://github.com/LedgerHQ/ledger-live/commit/baea85eab9ee1a0a2068f05176bdcb960a3c39af) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Fix Generic Awareness Modal cascade on mobile and add Braze content card logging on mobile and desktop

- [#20344](https://github.com/LedgerHQ/ledger-live/pull/20344) [`857c07a`](https://github.com/LedgerHQ/ledger-live/commit/857c07a12034be3da277b5957841e1ee9c04e112) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(lwm): fix container input memo

- [#20222](https://github.com/LedgerHQ/ledger-live/pull/20222) [`c6f620c`](https://github.com/LedgerHQ/ledger-live/commit/c6f620c3a0f7f944cb9de18ac129708dc69ec5a3) Thanks [@deepyjr](https://github.com/deepyjr)! - Model contact address labels with asset defaults and per-contact uniqueness

- [#20238](https://github.com/LedgerHQ/ledger-live/pull/20238) [`7c20126`](https://github.com/LedgerHQ/ledger-live/commit/7c20126f2e2b5befae8aa0ff22233d9aa11ab1ce) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove legacy translation keys orphaned by the Wallet 4.0 Q1 cleanup (navigation collapse, graph rework, legacy Portfolio screen and Transfer drawer removal).

- [#20158](https://github.com/LedgerHQ/ledger-live/pull/20158) [`871f021`](https://github.com/LedgerHQ/ledger-live/commit/871f021405681209eebb7d3dde3ecf5681acdd81) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add populated mobile contact detail with address rows, QR code sheet, and address detail actions.

- [#20093](https://github.com/LedgerHQ/ledger-live/pull/20093) [`ac59a72`](https://github.com/LedgerHQ/ledger-live/commit/ac59a72cc5702b4ca59d0a2134561a3412de2e11) Thanks [@sarneijim](https://github.com/sarneijim)! - Update copy and per-placement illustrations for the hard-coded large-touchscreen upsell banners (Home, Notification Center, My Ledger).

- [#19634](https://github.com/LedgerHQ/ledger-live/pull/19634) [`4015ade`](https://github.com/LedgerHQ/ledger-live/commit/4015ade1f9744d4bb575282060fdb1beb9aafc89) Thanks [@thesan](https://github.com/thesan)! - Connect @ledgerhq/ledger-auth to the Ledger Wallet apps Redux store

- [#20189](https://github.com/LedgerHQ/ledger-live/pull/20189) [`4bbd5a4`](https://github.com/LedgerHQ/ledger-live/commit/4bbd5a441f09e3c3d1709abcc9da3a7d1d6ea50c) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Show the network fee in the currency users care about in the new send flow. When the fee is editable the row follows the amount input's fiat/crypto toggle; when it is not, the row shows the fiat value alongside the native amount, since it is the only place that fee is visible. Fee presets now sub-label both amounts, except coins priced by fee rate (Bitcoin, Kaspa) which keep their sat/vB legend.

- [#20226](https://github.com/LedgerHQ/ledger-live/pull/20226) [`a93a5ed`](https://github.com/LedgerHQ/ledger-live/commit/a93a5ed6b41e36f1d4e5dbd2028deb4ae35828a7) Thanks [@deepyjr](https://github.com/deepyjr)! - Render the Contacts address name input in the Mobile add-address flow

- [#20232](https://github.com/LedgerHQ/ledger-live/pull/20232) [`d467088`](https://github.com/LedgerHQ/ledger-live/commit/d4670885d7eb77c035d09c225eff9dca0151abb3) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwdm): a/b testing show recent banner

- [#20212](https://github.com/LedgerHQ/ledger-live/pull/20212) [`9b07695`](https://github.com/LedgerHQ/ledger-live/commit/9b07695cbb7ca58712986dcae15594f6a44b9380) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add shared analytics consent QA debug helpers and revamp mobile QA screen

- [#20267](https://github.com/LedgerHQ/ledger-live/pull/20267) [`956d4a1`](https://github.com/LedgerHQ/ledger-live/commit/956d4a152187e6853b23fd72ab24e3f66c6c233d) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Add debug WebSocket transport to DevTools relay

- [#20339](https://github.com/LedgerHQ/ledger-live/pull/20339) [`6a531c5`](https://github.com/LedgerHQ/ledger-live/commit/6a531c54ccd1c65df122286de6f136f9d73b9002) Thanks [@qperrot](https://github.com/qperrot)! - Remove Scroll Sepolia testnet support as it is no longer maintained

- [#20224](https://github.com/LedgerHQ/ledger-live/pull/20224) [`f7e013a`](https://github.com/LedgerHQ/ledger-live/commit/f7e013a174e95461bedbd6cc2754134fbbf791b1) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Add an info disclaimer next to the recipient address in the new send flow, reminding users to verify the full address on their Ledger device

- [#20264](https://github.com/LedgerHQ/ledger-live/pull/20264) [`725b0dd`](https://github.com/LedgerHQ/ledger-live/commit/725b0ddf0c775bdbf9fa775adcfac2d8e4c56e9f) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - chore(aleo): view key warning copy update

- [#20340](https://github.com/LedgerHQ/ledger-live/pull/20340) [`2958ef7`](https://github.com/LedgerHQ/ledger-live/commit/2958ef74bf25df9e612f89ed2fda386c86a60a5d) Thanks [@deepyjr](https://github.com/deepyjr)! - Save a confirmed contact address without placeholder screens

- [#20261](https://github.com/LedgerHQ/ledger-live/pull/20261) [`ba6e9c1`](https://github.com/LedgerHQ/ledger-live/commit/ba6e9c1e542ad28a59b0163e3b453e2f047a48b9) Thanks [@ysitbon](https://github.com/ysitbon)! - Import currency accessors from the domain layer instead of the `@ledgerhq/live-common/currencies` barrel.

  Crypto accessors (`getCryptoCurrencyById`, `findCryptoCurrencyById`, `findCryptoCurrencyByKeyword`, `findCryptoCurrencyByTicker`, `listCryptoCurrencies`, `findCryptoCurrency`, `findCryptoCurrencyByScheme`, `hasCryptoCurrencyId`) now come from `@domain/entity-currency-crypto`, and fiat accessors (`getFiatCurrencyByTicker`, `findFiatCurrencyByTicker`, `listFiatCurrencies`, `hasFiatCurrencyTicker`) from `@domain/entity-currency-fiat`. The re-exports that forwarded them through `@ledgerhq/live-common/currencies` are removed; the barrel keeps its formatting, colour, helper, marketcap, support and URI-scheme exports. Behaviour is unchanged — the barrel already delegated to these same domain functions.

- [#20265](https://github.com/LedgerHQ/ledger-live/pull/20265) [`5f81208`](https://github.com/LedgerHQ/ledger-live/commit/5f81208308f7e56971cce9329369c12af82185d3) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Remove analytics consentValidityDays and the unused live-common consent expiry helpers

- [#20321](https://github.com/LedgerHQ/ledger-live/pull/20321) [`9783675`](https://github.com/LedgerHQ/ledger-live/commit/97836755ebf605f62b5731f696ae66a9270a4c58) Thanks [@deepyjr](https://github.com/deepyjr)! - Block duplicate Contacts names before creation

- [#20350](https://github.com/LedgerHQ/ledger-live/pull/20350) [`51bc3da`](https://github.com/LedgerHQ/ledger-live/commit/51bc3daa6eb6c4b79bc4c14df4872072657277cd) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix hidden assets not appearing in Settings > Accounts. Native coins hidden from the asset detail page are now resolved from the crypto registry and listed alongside hidden tokens, and a single failing token lookup no longer empties the whole list.

### Patch Changes

- Updated dependencies [[`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add), [`facb60a`](https://github.com/LedgerHQ/ledger-live/commit/facb60a8abbc42b5067fb4d69d68577c6da2f232), [`03f2ac2`](https://github.com/LedgerHQ/ledger-live/commit/03f2ac27df5c85f6b2218268e6f05a7012462b1a), [`674ae62`](https://github.com/LedgerHQ/ledger-live/commit/674ae62c25b0db62dd789a31956b776466f39d4d), [`c016a95`](https://github.com/LedgerHQ/ledger-live/commit/c016a95538dfef2d7ddf1a17914d8cb3e55b644e), [`4d3ae1b`](https://github.com/LedgerHQ/ledger-live/commit/4d3ae1bea30b444281698844214072d95665e07a), [`2fa6e1f`](https://github.com/LedgerHQ/ledger-live/commit/2fa6e1f3fbcb56ff444ca756135d821e141bc439), [`12794fa`](https://github.com/LedgerHQ/ledger-live/commit/12794fac12e62fd124a647434d044d51c3081242), [`f7997c9`](https://github.com/LedgerHQ/ledger-live/commit/f7997c90fe24c24a075b51a0f37db1c8e3eeffcd), [`56cfe0b`](https://github.com/LedgerHQ/ledger-live/commit/56cfe0bc6673f416f739c1593abfec718230952d), [`e0d421b`](https://github.com/LedgerHQ/ledger-live/commit/e0d421b5e20323f4e4ea14ec1566f6e9ba0d0189), [`248d24e`](https://github.com/LedgerHQ/ledger-live/commit/248d24e8fb1671878983ad90b0b47281e6773990), [`532d6c4`](https://github.com/LedgerHQ/ledger-live/commit/532d6c421fe25456bea2e169a1fbc095e6b7cf5a), [`9051d74`](https://github.com/LedgerHQ/ledger-live/commit/9051d7495e55706e8fb8801107f9473f505cb395), [`36a08f1`](https://github.com/LedgerHQ/ledger-live/commit/36a08f1aea939fc42e7dafd8d734ef8dce88d7d0), [`a464f7d`](https://github.com/LedgerHQ/ledger-live/commit/a464f7d6092607ff6b81aa6ec0cd29ef6cfcf35a), [`d35298f`](https://github.com/LedgerHQ/ledger-live/commit/d35298f0158e124f12fbdf811c5fdc795898e2c0), [`825f50f`](https://github.com/LedgerHQ/ledger-live/commit/825f50fb9989f929c1462d53d0df58a7242261c0), [`f60f9cb`](https://github.com/LedgerHQ/ledger-live/commit/f60f9cbc79557cfa815ea714b375ace11aea8754), [`c6f620c`](https://github.com/LedgerHQ/ledger-live/commit/c6f620c3a0f7f944cb9de18ac129708dc69ec5a3), [`70c33a8`](https://github.com/LedgerHQ/ledger-live/commit/70c33a8ca450482df3fe8bfbbcafabf016b9b3dc), [`871f021`](https://github.com/LedgerHQ/ledger-live/commit/871f021405681209eebb7d3dde3ecf5681acdd81), [`4015ade`](https://github.com/LedgerHQ/ledger-live/commit/4015ade1f9744d4bb575282060fdb1beb9aafc89), [`e709463`](https://github.com/LedgerHQ/ledger-live/commit/e7094633d503367b7ccf4783f24dec7780b04707), [`b90214c`](https://github.com/LedgerHQ/ledger-live/commit/b90214cf695812b52dc13eabcd930dbdfb6fe081), [`625c6c0`](https://github.com/LedgerHQ/ledger-live/commit/625c6c0628d0c4afe395f45fbb39a988af8aa106), [`a93a5ed`](https://github.com/LedgerHQ/ledger-live/commit/a93a5ed6b41e36f1d4e5dbd2028deb4ae35828a7), [`d467088`](https://github.com/LedgerHQ/ledger-live/commit/d4670885d7eb77c035d09c225eff9dca0151abb3), [`9b07695`](https://github.com/LedgerHQ/ledger-live/commit/9b07695cbb7ca58712986dcae15594f6a44b9380), [`6a531c5`](https://github.com/LedgerHQ/ledger-live/commit/6a531c54ccd1c65df122286de6f136f9d73b9002), [`2958ef7`](https://github.com/LedgerHQ/ledger-live/commit/2958ef74bf25df9e612f89ed2fda386c86a60a5d), [`e7a22a6`](https://github.com/LedgerHQ/ledger-live/commit/e7a22a6e3c8c444640cfe8df88637ecad738e26a), [`5f81208`](https://github.com/LedgerHQ/ledger-live/commit/5f81208308f7e56971cce9329369c12af82185d3), [`94f7c85`](https://github.com/LedgerHQ/ledger-live/commit/94f7c85211c1947302e52fe9165027b83e202823), [`e44d972`](https://github.com/LedgerHQ/ledger-live/commit/e44d97239af10b46ae3ef703e0c6181cc0c87712), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152), [`9d56877`](https://github.com/LedgerHQ/ledger-live/commit/9d568778b657961ef06ba04d5fa616677afec7b8), [`635fa12`](https://github.com/LedgerHQ/ledger-live/commit/635fa12d47f5a98858326f4dd68962dffe82eda9), [`36c0e51`](https://github.com/LedgerHQ/ledger-live/commit/36c0e51ea1544d2bc24f29ded5616659a359d274), [`9783675`](https://github.com/LedgerHQ/ledger-live/commit/97836755ebf605f62b5731f696ae66a9270a4c58)]:
  - @ledgerhq/coin-bitcoin@0.50.0
  - @ledgerhq/coin-canton@0.32.0
  - @ledgerhq/coin-casper@2.18.0
  - @ledgerhq/coin-concordium@0.19.0
  - @ledgerhq/coin-cosmos@0.42.0
  - @ledgerhq/coin-evm@4.9.0
  - @ledgerhq/coin-filecoin@1.31.0
  - @ledgerhq/coin-multiversx@0.23.0
  - @ledgerhq/coin-stacks@0.27.0
  - @ledgerhq/native-ui@0.66.0
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
  - @ledgerhq/ledger-wallet-framework@2.7.0
  - @devtools/bindings@0.2.3
  - @features/platform-feature-flags@0.6.4
  - @ledgerhq/domain-service@1.8.13
  - @ledgerhq/live-countervalues@0.24.1
  - @ledgerhq/live-countervalues-react@0.16.5
  - @ledgerhq/live-wallet@0.30.2
  - @ledgerhq/wallet-analytics@0.3.2
  - @ledgerhq/wallet-pnl@0.7.5
  - @features/platform-env@0.1.2
  - @ledgerhq/live-dmk-mobile@0.29.2
  - @ledgerhq/live-dmk-speculos@0.10.4
  - @domain/entity-currency@0.3.1
  - @ledgerhq/live-currency-format@0.14.1

## 4.15.0-next.0

### Minor Changes

- [#20280](https://github.com/LedgerHQ/ledger-live/pull/20280) [`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Stop depending on `@ledgerhq/errors` (LIVE-32915).

  No workspace package declares it anymore, and none may again: `enforce-boundaries` now fails CI on any manifest that does. The classes it held live in the package that owns them, with `@ledgerhq/ledger-wallet-framework/errors` as the shared home below the coin layer.

  The package itself stays in the repo so it keeps being published for external consumers, and is bridged to the external coin packages that still peer-depend on it via `pnpm.packageExtensions` using `workspace:*` (which reuses the single in-repo copy, so the dependency graph keeps exactly the physical copies it had before). [LedgerHQ/coin-modules#752](https://github.com/LedgerHQ/coin-modules/pull/752) removes that peerDependency upstream; once it is released the bridge can be dropped, but the package still needs publishing.

- [#20262](https://github.com/LedgerHQ/ledger-live/pull/20262) [`03f2ac2`](https://github.com/LedgerHQ/ledger-live/commit/03f2ac27df5c85f6b2218268e6f05a7012462b1a) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove the `CryptoIcon` passthrough component from `@ledgerhq/native-ui/pre-ldls` and consume `@ledgerhq/crypto-icons/native` directly in ledger-live-mobile. `@ledgerhq/crypto-icons` is no longer a dependency of `@ledgerhq/native-ui`, and the `@ledgerhq/lumen-ui-rnative` / `@ledgerhq/lumen-design-core` peer dependencies it required are dropped as well.

- [#20237](https://github.com/LedgerHQ/ledger-live/pull/20237) [`9178d13`](https://github.com/LedgerHQ/ledger-live/commit/9178d13ae8391b900a274621c43ebb242616c5fa) Thanks [@Valentin-Ledger](https://github.com/Valentin-Ledger)! - Align Earn deposit flow header and webview shell with the live-app canvas when swapToEarn is enabled

- [#20341](https://github.com/LedgerHQ/ledger-live/pull/20341) [`c016a95`](https://github.com/LedgerHQ/ledger-live/commit/c016a95538dfef2d7ddf1a17914d8cb3e55b644e) Thanks [@ysitbon](https://github.com/ysitbon)! - Split backend access from use case in the RTK Query layer

  `@shared/api-services` now holds one endpoint-less `createApi` per backend (CAL, CoinMarketCap,
  Countervalues, Push Devices), owning its base query, `extraArgument` contract and reducer path.
  `domain/api/*` packages add their endpoints with `injectEndpoints` and their own cache tags with
  `enhanceEndpoints`, so one reducer, middleware and cache now serve every use case on a backend — the two
  CoinMarketCap packages previously had one each. Apps register the service apis.

  `extraArgument` builder names are unchanged, so only import paths move. Reducer paths are renamed after
  their backend (`calApi`, `coinMarketCapApi`, `countervaluesApi`); no persisted data and no endpoint
  behaviour is affected.

- [#20182](https://github.com/LedgerHQ/ledger-live/pull/20182) [`12794fa`](https://github.com/LedgerHQ/ledger-live/commit/12794fac12e62fd124a647434d044d51c3081242) Thanks [@deepyjr](https://github.com/deepyjr)! - Compose Mobile Contacts currency and address steps in one queued drawer with reusable placeholders.

- [#20093](https://github.com/LedgerHQ/ledger-live/pull/20093) [`56cfe0b`](https://github.com/LedgerHQ/ledger-live/commit/56cfe0bc6673f416f739c1593abfec718230952d) Thanks [@sarneijim](https://github.com/sarneijim)! - Use the shared large-screen upsell configuration and eligibility for mobile upgrade banners.

- [#20318](https://github.com/LedgerHQ/ledger-live/pull/20318) [`e0d421b`](https://github.com/LedgerHQ/ledger-live/commit/e0d421b5e20323f4e4ea14ec1566f6e9ba0d0189) Thanks [@deepyjr](https://github.com/deepyjr)! - Block sanctioned addresses in the Contacts add-address flow

- [#20330](https://github.com/LedgerHQ/ledger-live/pull/20330) [`532d6c4`](https://github.com/LedgerHQ/ledger-live/commit/532d6c421fe25456bea2e169a1fbc095e6b7cf5a) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add shared stored-policy inspector status helper and use it on mobile analytics consent QA

- [#20211](https://github.com/LedgerHQ/ledger-live/pull/20211) [`4cc4000`](https://github.com/LedgerHQ/ledger-live/commit/4cc4000b392291956fc63d2c98295546fcbebc98) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Renew mobile analytics consent from policyVersion major/minor semantics

- [#20185](https://github.com/LedgerHQ/ledger-live/pull/20185) [`f9a1f1f`](https://github.com/LedgerHQ/ledger-live/commit/f9a1f1f9c4f7f4373fe663f92db1567853bc9d13) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Add Close all control to the top-wallet hardware carousel with analytics tracking.

- [#20240](https://github.com/LedgerHQ/ledger-live/pull/20240) [`15e4608`](https://github.com/LedgerHQ/ledger-live/commit/15e4608db80de6909f96f795d8a888994510e07d) Thanks [@deepyjr](https://github.com/deepyjr)! - Forward Modular Asset Drawer network filters to DADA asset requests.

- [#20197](https://github.com/LedgerHQ/ledger-live/pull/20197) [`507e450`](https://github.com/LedgerHQ/ledger-live/commit/507e450759f95ed42d5ce7f452825b89dba1df7f) Thanks [@ysitbon](https://github.com/ysitbon)! - Drop boot fiat fetch and `InitialQueriesContext`: `supportedCounterValues` is now a derived selector backed by the `supportedFiats` slice. Mobile gains a read-time OFAC guard on `counterValueCurrencyLocalSelector`; desktop removes its boot-time `getSupportedFiats.initiate` dispatch. Both apps now lazy-load the CVS query from the two picker screens.

- [#20078](https://github.com/LedgerHQ/ledger-live/pull/20078) [`baea85e`](https://github.com/LedgerHQ/ledger-live/commit/baea85eab9ee1a0a2068f05176bdcb960a3c39af) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Fix Generic Awareness Modal cascade on mobile and add Braze content card logging on mobile and desktop

- [#20344](https://github.com/LedgerHQ/ledger-live/pull/20344) [`857c07a`](https://github.com/LedgerHQ/ledger-live/commit/857c07a12034be3da277b5957841e1ee9c04e112) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(lwm): fix container input memo

- [#20222](https://github.com/LedgerHQ/ledger-live/pull/20222) [`c6f620c`](https://github.com/LedgerHQ/ledger-live/commit/c6f620c3a0f7f944cb9de18ac129708dc69ec5a3) Thanks [@deepyjr](https://github.com/deepyjr)! - Model contact address labels with asset defaults and per-contact uniqueness

- [#20238](https://github.com/LedgerHQ/ledger-live/pull/20238) [`7c20126`](https://github.com/LedgerHQ/ledger-live/commit/7c20126f2e2b5befae8aa0ff22233d9aa11ab1ce) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove legacy translation keys orphaned by the Wallet 4.0 Q1 cleanup (navigation collapse, graph rework, legacy Portfolio screen and Transfer drawer removal).

- [#20158](https://github.com/LedgerHQ/ledger-live/pull/20158) [`871f021`](https://github.com/LedgerHQ/ledger-live/commit/871f021405681209eebb7d3dde3ecf5681acdd81) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add populated mobile contact detail with address rows, QR code sheet, and address detail actions.

- [#20093](https://github.com/LedgerHQ/ledger-live/pull/20093) [`ac59a72`](https://github.com/LedgerHQ/ledger-live/commit/ac59a72cc5702b4ca59d0a2134561a3412de2e11) Thanks [@sarneijim](https://github.com/sarneijim)! - Update copy and per-placement illustrations for the hard-coded large-touchscreen upsell banners (Home, Notification Center, My Ledger).

- [#19634](https://github.com/LedgerHQ/ledger-live/pull/19634) [`4015ade`](https://github.com/LedgerHQ/ledger-live/commit/4015ade1f9744d4bb575282060fdb1beb9aafc89) Thanks [@thesan](https://github.com/thesan)! - Connect @ledgerhq/ledger-auth to the Ledger Wallet apps Redux store

- [#20189](https://github.com/LedgerHQ/ledger-live/pull/20189) [`4bbd5a4`](https://github.com/LedgerHQ/ledger-live/commit/4bbd5a441f09e3c3d1709abcc9da3a7d1d6ea50c) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Show the network fee in the currency users care about in the new send flow. When the fee is editable the row follows the amount input's fiat/crypto toggle; when it is not, the row shows the fiat value alongside the native amount, since it is the only place that fee is visible. Fee presets now sub-label both amounts, except coins priced by fee rate (Bitcoin, Kaspa) which keep their sat/vB legend.

- [#20226](https://github.com/LedgerHQ/ledger-live/pull/20226) [`a93a5ed`](https://github.com/LedgerHQ/ledger-live/commit/a93a5ed6b41e36f1d4e5dbd2028deb4ae35828a7) Thanks [@deepyjr](https://github.com/deepyjr)! - Render the Contacts address name input in the Mobile add-address flow

- [#20232](https://github.com/LedgerHQ/ledger-live/pull/20232) [`d467088`](https://github.com/LedgerHQ/ledger-live/commit/d4670885d7eb77c035d09c225eff9dca0151abb3) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwdm): a/b testing show recent banner

- [#20212](https://github.com/LedgerHQ/ledger-live/pull/20212) [`9b07695`](https://github.com/LedgerHQ/ledger-live/commit/9b07695cbb7ca58712986dcae15594f6a44b9380) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add shared analytics consent QA debug helpers and revamp mobile QA screen

- [#20267](https://github.com/LedgerHQ/ledger-live/pull/20267) [`956d4a1`](https://github.com/LedgerHQ/ledger-live/commit/956d4a152187e6853b23fd72ab24e3f66c6c233d) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Add debug WebSocket transport to DevTools relay

- [#20339](https://github.com/LedgerHQ/ledger-live/pull/20339) [`6a531c5`](https://github.com/LedgerHQ/ledger-live/commit/6a531c54ccd1c65df122286de6f136f9d73b9002) Thanks [@qperrot](https://github.com/qperrot)! - Remove Scroll Sepolia testnet support as it is no longer maintained

- [#20224](https://github.com/LedgerHQ/ledger-live/pull/20224) [`f7e013a`](https://github.com/LedgerHQ/ledger-live/commit/f7e013a174e95461bedbd6cc2754134fbbf791b1) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Add an info disclaimer next to the recipient address in the new send flow, reminding users to verify the full address on their Ledger device

- [#20264](https://github.com/LedgerHQ/ledger-live/pull/20264) [`725b0dd`](https://github.com/LedgerHQ/ledger-live/commit/725b0ddf0c775bdbf9fa775adcfac2d8e4c56e9f) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - chore(aleo): view key warning copy update

- [#20340](https://github.com/LedgerHQ/ledger-live/pull/20340) [`2958ef7`](https://github.com/LedgerHQ/ledger-live/commit/2958ef74bf25df9e612f89ed2fda386c86a60a5d) Thanks [@deepyjr](https://github.com/deepyjr)! - Save a confirmed contact address without placeholder screens

- [#20261](https://github.com/LedgerHQ/ledger-live/pull/20261) [`ba6e9c1`](https://github.com/LedgerHQ/ledger-live/commit/ba6e9c1e542ad28a59b0163e3b453e2f047a48b9) Thanks [@ysitbon](https://github.com/ysitbon)! - Import currency accessors from the domain layer instead of the `@ledgerhq/live-common/currencies` barrel.

  Crypto accessors (`getCryptoCurrencyById`, `findCryptoCurrencyById`, `findCryptoCurrencyByKeyword`, `findCryptoCurrencyByTicker`, `listCryptoCurrencies`, `findCryptoCurrency`, `findCryptoCurrencyByScheme`, `hasCryptoCurrencyId`) now come from `@domain/entity-currency-crypto`, and fiat accessors (`getFiatCurrencyByTicker`, `findFiatCurrencyByTicker`, `listFiatCurrencies`, `hasFiatCurrencyTicker`) from `@domain/entity-currency-fiat`. The re-exports that forwarded them through `@ledgerhq/live-common/currencies` are removed; the barrel keeps its formatting, colour, helper, marketcap, support and URI-scheme exports. Behaviour is unchanged — the barrel already delegated to these same domain functions.

- [#20265](https://github.com/LedgerHQ/ledger-live/pull/20265) [`5f81208`](https://github.com/LedgerHQ/ledger-live/commit/5f81208308f7e56971cce9329369c12af82185d3) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Remove analytics consentValidityDays and the unused live-common consent expiry helpers

- [#20321](https://github.com/LedgerHQ/ledger-live/pull/20321) [`9783675`](https://github.com/LedgerHQ/ledger-live/commit/97836755ebf605f62b5731f696ae66a9270a4c58) Thanks [@deepyjr](https://github.com/deepyjr)! - Block duplicate Contacts names before creation

- [#20350](https://github.com/LedgerHQ/ledger-live/pull/20350) [`51bc3da`](https://github.com/LedgerHQ/ledger-live/commit/51bc3daa6eb6c4b79bc4c14df4872072657277cd) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix hidden assets not appearing in Settings > Accounts. Native coins hidden from the asset detail page are now resolved from the crypto registry and listed alongside hidden tokens, and a single failing token lookup no longer empties the whole list.

### Patch Changes

- Updated dependencies [[`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add), [`facb60a`](https://github.com/LedgerHQ/ledger-live/commit/facb60a8abbc42b5067fb4d69d68577c6da2f232), [`03f2ac2`](https://github.com/LedgerHQ/ledger-live/commit/03f2ac27df5c85f6b2218268e6f05a7012462b1a), [`674ae62`](https://github.com/LedgerHQ/ledger-live/commit/674ae62c25b0db62dd789a31956b776466f39d4d), [`c016a95`](https://github.com/LedgerHQ/ledger-live/commit/c016a95538dfef2d7ddf1a17914d8cb3e55b644e), [`4d3ae1b`](https://github.com/LedgerHQ/ledger-live/commit/4d3ae1bea30b444281698844214072d95665e07a), [`2fa6e1f`](https://github.com/LedgerHQ/ledger-live/commit/2fa6e1f3fbcb56ff444ca756135d821e141bc439), [`12794fa`](https://github.com/LedgerHQ/ledger-live/commit/12794fac12e62fd124a647434d044d51c3081242), [`f7997c9`](https://github.com/LedgerHQ/ledger-live/commit/f7997c90fe24c24a075b51a0f37db1c8e3eeffcd), [`56cfe0b`](https://github.com/LedgerHQ/ledger-live/commit/56cfe0bc6673f416f739c1593abfec718230952d), [`e0d421b`](https://github.com/LedgerHQ/ledger-live/commit/e0d421b5e20323f4e4ea14ec1566f6e9ba0d0189), [`248d24e`](https://github.com/LedgerHQ/ledger-live/commit/248d24e8fb1671878983ad90b0b47281e6773990), [`532d6c4`](https://github.com/LedgerHQ/ledger-live/commit/532d6c421fe25456bea2e169a1fbc095e6b7cf5a), [`9051d74`](https://github.com/LedgerHQ/ledger-live/commit/9051d7495e55706e8fb8801107f9473f505cb395), [`36a08f1`](https://github.com/LedgerHQ/ledger-live/commit/36a08f1aea939fc42e7dafd8d734ef8dce88d7d0), [`a464f7d`](https://github.com/LedgerHQ/ledger-live/commit/a464f7d6092607ff6b81aa6ec0cd29ef6cfcf35a), [`d35298f`](https://github.com/LedgerHQ/ledger-live/commit/d35298f0158e124f12fbdf811c5fdc795898e2c0), [`825f50f`](https://github.com/LedgerHQ/ledger-live/commit/825f50fb9989f929c1462d53d0df58a7242261c0), [`f60f9cb`](https://github.com/LedgerHQ/ledger-live/commit/f60f9cbc79557cfa815ea714b375ace11aea8754), [`c6f620c`](https://github.com/LedgerHQ/ledger-live/commit/c6f620c3a0f7f944cb9de18ac129708dc69ec5a3), [`70c33a8`](https://github.com/LedgerHQ/ledger-live/commit/70c33a8ca450482df3fe8bfbbcafabf016b9b3dc), [`871f021`](https://github.com/LedgerHQ/ledger-live/commit/871f021405681209eebb7d3dde3ecf5681acdd81), [`4015ade`](https://github.com/LedgerHQ/ledger-live/commit/4015ade1f9744d4bb575282060fdb1beb9aafc89), [`e709463`](https://github.com/LedgerHQ/ledger-live/commit/e7094633d503367b7ccf4783f24dec7780b04707), [`b90214c`](https://github.com/LedgerHQ/ledger-live/commit/b90214cf695812b52dc13eabcd930dbdfb6fe081), [`625c6c0`](https://github.com/LedgerHQ/ledger-live/commit/625c6c0628d0c4afe395f45fbb39a988af8aa106), [`a93a5ed`](https://github.com/LedgerHQ/ledger-live/commit/a93a5ed6b41e36f1d4e5dbd2028deb4ae35828a7), [`d467088`](https://github.com/LedgerHQ/ledger-live/commit/d4670885d7eb77c035d09c225eff9dca0151abb3), [`9b07695`](https://github.com/LedgerHQ/ledger-live/commit/9b07695cbb7ca58712986dcae15594f6a44b9380), [`6a531c5`](https://github.com/LedgerHQ/ledger-live/commit/6a531c54ccd1c65df122286de6f136f9d73b9002), [`2958ef7`](https://github.com/LedgerHQ/ledger-live/commit/2958ef74bf25df9e612f89ed2fda386c86a60a5d), [`e7a22a6`](https://github.com/LedgerHQ/ledger-live/commit/e7a22a6e3c8c444640cfe8df88637ecad738e26a), [`5f81208`](https://github.com/LedgerHQ/ledger-live/commit/5f81208308f7e56971cce9329369c12af82185d3), [`94f7c85`](https://github.com/LedgerHQ/ledger-live/commit/94f7c85211c1947302e52fe9165027b83e202823), [`e44d972`](https://github.com/LedgerHQ/ledger-live/commit/e44d97239af10b46ae3ef703e0c6181cc0c87712), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152), [`9d56877`](https://github.com/LedgerHQ/ledger-live/commit/9d568778b657961ef06ba04d5fa616677afec7b8), [`635fa12`](https://github.com/LedgerHQ/ledger-live/commit/635fa12d47f5a98858326f4dd68962dffe82eda9), [`36c0e51`](https://github.com/LedgerHQ/ledger-live/commit/36c0e51ea1544d2bc24f29ded5616659a359d274), [`9783675`](https://github.com/LedgerHQ/ledger-live/commit/97836755ebf605f62b5731f696ae66a9270a4c58)]:
  - @ledgerhq/coin-bitcoin@0.50.0-next.0
  - @ledgerhq/coin-canton@0.32.0-next.0
  - @ledgerhq/coin-casper@2.18.0-next.0
  - @ledgerhq/coin-concordium@0.19.0-next.0
  - @ledgerhq/coin-cosmos@0.42.0-next.0
  - @ledgerhq/coin-evm@4.9.0-next.0
  - @ledgerhq/coin-filecoin@1.31.0-next.0
  - @ledgerhq/coin-multiversx@0.23.0-next.0
  - @ledgerhq/coin-stacks@0.27.0-next.0
  - @ledgerhq/native-ui@0.66.0-next.0
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
  - @ledgerhq/ledger-wallet-framework@2.7.0-next.0
  - @devtools/bindings@0.2.3-next.0
  - @features/platform-feature-flags@0.6.4-next.0
  - @ledgerhq/domain-service@1.8.13-next.0
  - @ledgerhq/live-countervalues@0.24.1-next.0
  - @ledgerhq/live-countervalues-react@0.16.5-next.0
  - @ledgerhq/live-wallet@0.30.2-next.0
  - @ledgerhq/wallet-analytics@0.3.2-next.0
  - @ledgerhq/wallet-pnl@0.7.5-next.0
  - @features/platform-env@0.1.2-next.0
  - @ledgerhq/live-dmk-mobile@0.29.2-next.0
  - @ledgerhq/live-dmk-speculos@0.10.4-next.0
  - @domain/entity-currency@0.3.1-next.0
  - @ledgerhq/live-currency-format@0.14.1

## 4.14.0

### Minor Changes

- [#20129](https://github.com/LedgerHQ/ledger-live/pull/20129) [`ba20e39`](https://github.com/LedgerHQ/ledger-live/commit/ba20e3926e52284c04c9bc4e4b17b7c5e34b3cb5) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Migrate `checkLibs` and its two callers off `@ledgerhq/errors` as part of the errors sunset (LIVE-32915).

  `checkLibs` detects duplicated npm packages by comparing class identity, so `sanityChecks.ts` and both app entrypoints must import `NotEnoughBalance` from the same module. All three now use `@ledgerhq/ledger-wallet-framework/errors`. The duplicate-package warning also names `@ledgerhq/ledger-wallet-framework` so the `pnpm why` hint points at the package actually being checked.

- [#20172](https://github.com/LedgerHQ/ledger-live/pull/20172) [`6dd18aa`](https://github.com/LedgerHQ/ledger-live/commit/6dd18aae6e7a6d9aedc25d491ccd147a44b277a6) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove the legacy Gorhom `QueuedDrawer` implementation (migrating the last consumer, the Cardano DRep delegation drawer, to the Lumen bottom sheet) and rename `QueuedDrawerBottomSheet` to `QueuedBottomSheet`.

- [#20349](https://github.com/LedgerHQ/ledger-live/pull/20349) [`f715aa5`](https://github.com/LedgerHQ/ledger-live/commit/f715aa516225f72124e083e3ffa0f254b9d5df4f) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Fix Zcash sends failing before the device prompt when the coin being spent came from a V4-format transaction (PROD-12599).

  Signing a transparent Zcash transaction whose input came from a V4 (Sapling-format) transaction failed immediately: no review screen appeared on the device, and Ledger Live showed "Something went wrong" with no detail. V4 is still valid on mainnet and still emitted by exchanges and older wallets, while Ledger Live itself emits V5 — so an account funded from within Ledger Live never hit this, which is why the failure looked intermittent. It is in fact deterministic, decided by which software created the funding transaction.

  `serializedPreviousTransactionOverride` carries the source transaction's raw on-chain bytes so the device can compute the correct ZIP-244 txid for a V5 transaction, whose Orchard bundle the signer kit's serialization would otherwise strip. It was being set for every version. The kit chunks a V4 transaction expecting Ledger's internal serialization, whose header carries a consensus branch id absent from the on-chain bytes; given those bytes it read the input count four bytes late and threw while chunking that input. The override is now restricted to the versions that need it, and a V4 source transaction goes back through the serialization path that has always handled it, its Sapling fields travelling in `extraData` as before.

  The decision is made per input, which is what a send spending several coins looks like from the outside: the V5 inputs are chunked and their trusted inputs obtained from the device first, then the transaction dies when the V4 input's turn comes. The device has already answered several times by then, yet no review screen is ever reached — so the failure looks like a device problem rather than a serialization one.

  Untagged device action errors are also no longer flattened into a message-less `Error`, so a failure inside a device action task names itself in the logs instead of surfacing only as "Something went wrong".

- [#19982](https://github.com/LedgerHQ/ledger-live/pull/19982) [`f5e4e87`](https://github.com/LedgerHQ/ledger-live/commit/f5e4e87a114ca8336f310a4b5e39bff650fc0750) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Display estimated pending rewards for 0G delegations; gate claim-rewards UI to chains that support it.

- [#19967](https://github.com/LedgerHQ/ledger-live/pull/19967) [`56f5153`](https://github.com/LedgerHQ/ledger-live/commit/56f5153d7a4c7e277358b1cbb23eb921a351e195) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Fix welcome page first story looping to last on left tap

- [#20099](https://github.com/LedgerHQ/ledger-live/pull/20099) [`37dac39`](https://github.com/LedgerHQ/ledger-live/commit/37dac39463de1a44bdb5bc4b1b6b37b0cff68922) Thanks [@deepyjr](https://github.com/deepyjr)! - Add contact address asset and network selection through the Modular Dialog, with shared asset
  filtering across Desktop and Mobile.

- [#19958](https://github.com/LedgerHQ/ledger-live/pull/19958) [`9773bd3`](https://github.com/LedgerHQ/ledger-live/commit/9773bd3d61db1a740d18dea3d3dca325b3c89ee8) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Propagate contextual analytics properties through Device Intent Executor events.

- [#20032](https://github.com/LedgerHQ/ledger-live/pull/20032) [`dbffe41`](https://github.com/LedgerHQ/ledger-live/commit/dbffe417f903844a973b7a284206e7313b7a8e5a) Thanks [@deepyjr](https://github.com/deepyjr)! - Render Me-specific contact detail actions and copy on mobile.

- [#19964](https://github.com/LedgerHQ/ledger-live/pull/19964) [`86bbd1d`](https://github.com/LedgerHQ/ledger-live/commit/86bbd1d829ee60b76af040c064d93acc15561855) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add the one-time Contacts feature introduction drawer on Mobile with shared native content and dismissal preference.

- [#20107](https://github.com/LedgerHQ/ledger-live/pull/20107) [`54b3d2b`](https://github.com/LedgerHQ/ledger-live/commit/54b3d2b6032f1336d4d9fb2e238fa2347e45cc81) Thanks [@deepyjr](https://github.com/deepyjr)! - Add shared Coin Integration address validation to Contacts

- [#20050](https://github.com/LedgerHQ/ledger-live/pull/20050) [`4c34536`](https://github.com/LedgerHQ/ledger-live/commit/4c345363f061fb4a525684ae45ce437ea12e77d7) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Remove Custom Lock Screen step from the post-onboarding widget.

- [#19994](https://github.com/LedgerHQ/ledger-live/pull/19994) [`0f61d63`](https://github.com/LedgerHQ/ledger-live/commit/0f61d637855072b4352cb3e6901a4ed9986a0bbd) Thanks [@sarneijim](https://github.com/sarneijim)! - Update large-screen upsell modal UTM attribution on mobile and desktop

- [#19807](https://github.com/LedgerHQ/ledger-live/pull/19807) [`2cf4a29`](https://github.com/LedgerHQ/ledger-live/commit/2cf4a2904c8a732cbe732f354be08b5c4e559f3a) Thanks [@sarneijim](https://github.com/sarneijim)! - Reset mobile navigation state for sequential token deeplinks and redirect invalid asset deeplinks to Market

- [#20033](https://github.com/LedgerHQ/ledger-live/pull/20033) [`d390840`](https://github.com/LedgerHQ/ledger-live/commit/d39084070c35bc15cf6d08dba27b8077affd05af) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Loop Product Tour post-onboarding card animations and restart them when revisiting a slide

- [#19374](https://github.com/LedgerHQ/ledger-live/pull/19374) [`079775c`](https://github.com/LedgerHQ/ledger-live/commit/079775cab10840031fd40fc9f54126161654336c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - de-gate lwmWallet40.enabled in WXP-owned drawers, hooks, and screens

- [#20009](https://github.com/LedgerHQ/ledger-live/pull/20009) [`341ea10`](https://github.com/LedgerHQ/ledger-live/commit/341ea108e30bf8af9abeb6eed484ee4b2c7c4a43) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Revert Cardano firmware app v8.0.4 support (hw-app-cardano bump to 8.0.0)

- [#19985](https://github.com/LedgerHQ/ledger-live/pull/19985) [`808c4cd`](https://github.com/LedgerHQ/ledger-live/commit/808c4cd479e509210ea9537fe972251cfd8d04f7) Thanks [@deepyjr](https://github.com/deepyjr)! - Reorganize the contacts flow package around a /steps folder (List, AddContact, Introduction, Detail), promote shared helpers to src/utils, curate root barrels, and rename public views to ContactsListView and ContactDetailView. No runtime behavior change.

- [#20070](https://github.com/LedgerHQ/ledger-live/pull/20070) [`52253f7`](https://github.com/LedgerHQ/ledger-live/commit/52253f70c302056cdc6b367cdd8b1db408b5e07d) Thanks [@ysitbon](https://github.com/ysitbon)! - Remove the now-dead `@ledgerhq/cryptoassets` currency/fiat store injection from the app bootstraps. Nothing reads the legacy currency/fiat accessors anymore (the runtime source of truth is the domain-backed wallet-framework currency resolver), so `setCryptoCurrenciesStore` / `setFiatCurrenciesStore` injected a store no consumer queried. Drop the calls, drop the `@ledgerhq/cryptoassets` dependency from the apps, and remove the remaining stale references to the package in comments.

- [#20175](https://github.com/LedgerHQ/ledger-live/pull/20175) [`b953d34`](https://github.com/LedgerHQ/ledger-live/commit/b953d34622e3b4094c5fa5659ae45d907bc4ce88) Thanks [@deepyjr](https://github.com/deepyjr)! - Add a reusable queued drawer flow and an embeddable Modular Drawer presentation

- [#19992](https://github.com/LedgerHQ/ledger-live/pull/19992) [`452adf8`](https://github.com/LedgerHQ/ledger-live/commit/452adf85380d1cb74f1894478cdd84849b120ef4) Thanks [@sarneijim](https://github.com/sarneijim)! - Gate each existing mobile Nano S upsell banner placement through the shared large-screen upsell flag.

- [#19935](https://github.com/LedgerHQ/ledger-live/pull/19935) [`7ead592`](https://github.com/LedgerHQ/ledger-live/commit/7ead592696db3c052b26babcce734536887bf084) Thanks [@sarneijim](https://github.com/sarneijim)! - Update the Mobile large-screen upsell opt-out copy and CTA.

- [#20042](https://github.com/LedgerHQ/ledger-live/pull/20042) [`467578e`](https://github.com/LedgerHQ/ledger-live/commit/467578eca89c6f4bd8d307dc376ffc385382a199) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(lwm): fix multiple UI tweaks in the new send flow

- [#19715](https://github.com/LedgerHQ/ledger-live/pull/19715) [`cf63f27`](https://github.com/LedgerHQ/ledger-live/commit/cf63f273686aee3d941b8a4ead96f846ee4f483e) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Hide Send and Receive for HyperCore accounts on mobile: HyperCore has no on-chain send on Ledger Wallet and a plain receive is misleading (deposits go through bridging). Both actions are now hidden across the account actions (FAB), the asset actions, the quick-action drawers and the no-funds empty state, reusing the shared `isSendDisabledForFamily` / `isReceiveDisabledForFamily` predicates from `@ledgerhq/live-common`. The account "Quick actions" section is also hidden entirely when it has no actions left (e.g. HyperCore), instead of showing an empty titled section.

- [#20027](https://github.com/LedgerHQ/ledger-live/pull/20027) [`6131b15`](https://github.com/LedgerHQ/ledger-live/commit/6131b15d376b0ea2677df401564872a9c19d2151) Thanks [@deepyjr](https://github.com/deepyjr)! - Add shared Add Address session state and start it from Mobile contact details

- [#20035](https://github.com/LedgerHQ/ledger-live/pull/20035) [`67df284`](https://github.com/LedgerHQ/ledger-live/commit/67df284e2ccb916cff51896e42ef21846249b3e7) Thanks [@deepyjr](https://github.com/deepyjr)! - Select a native asset or token and its eligible network with the Mobile modular drawer before
  entering a contact address.

- [#19880](https://github.com/LedgerHQ/ledger-live/pull/19880) [`26ee89d`](https://github.com/LedgerHQ/ledger-live/commit/26ee89d7e3bba9b800a7b6f08db52b079fcd8bd5) Thanks [@deepyjr](https://github.com/deepyjr)! - Add the shared native empty contact detail page and wire it into Mobile.

- [#20091](https://github.com/LedgerHQ/ledger-live/pull/20091) [`ef5945a`](https://github.com/LedgerHQ/ledger-live/commit/ef5945a991c2d93259c414091bb276f527f8cbae) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Bump Lumen design-system packages to latest (design-core 0.1.23, ui-react 0.1.49, ui-rnative 0.1.52, ui-react-visualization 0.1.28, ui-rnative-visualization 0.1.29).

  - Migrate the desktop tables to the new `TableCellContent` compound API (`TableCellItem` / `TableCellContent` / `TableCellContentTitle` / `TableCellContentDescription` / `TableCellContentRow`).
  - Migrate the interactive My Wallet avatar to the new `AvatarButton` component on both apps, and fix the vertical centering of the desktop top-bar trigger.
  - Use the currency image fallback (`MediaImage`, circular) in the market list so it matches the crypto-icon shape.
  - Simplify `getDotIndicatorProps` avatar sizing now that the helper is typed for the full avatar size range.

- [#19805](https://github.com/LedgerHQ/ledger-live/pull/19805) [`b1d3f26`](https://github.com/LedgerHQ/ledger-live/commit/b1d3f26cbdf67c439bc125bdda1f1c56c9753f2e) Thanks [@ishaba](https://github.com/ishaba)! - feat(send): add default-fee strategy to the new send flow

- [#20159](https://github.com/LedgerHQ/ledger-live/pull/20159) [`534d2c5`](https://github.com/LedgerHQ/ledger-live/commit/534d2c50985051199d1974fdac7c70903ccea95c) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Migrate engagement-scope screens to SafeAreaViewFixed for experimental header compatibility

- [#20122](https://github.com/LedgerHQ/ledger-live/pull/20122) [`8677d5c`](https://github.com/LedgerHQ/ledger-live/commit/8677d5c5a789c257cb02c0f757d883b9a9be328b) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Migrate the mobile Modular Drawer to Lumen components (BottomSheet, ListItem, SearchInput, Banner, CardButton, Trend, Tag, Box/Text) and drop the legacy `native-ui` primitives and the `pre-ldls` composites it used. Removes the now-unused `pre-ldls` staging components (AssetItem, NetworkItem, AccountItem, Address, Tag, Input, Search, AssetTypeList, NetworkList, MarketPriceIndicator, MarketPercentIndicator) and the orphaned `useDebouncedCallback` hook from `@ledgerhq/native-ui` (CryptoIcon and AddAccountButton are kept). Adds the empty-account state (header description + "Add account" CardButton) on the account step.

- [#19955](https://github.com/LedgerHQ/ledger-live/pull/19955) [`0629f02`](https://github.com/LedgerHQ/ledger-live/commit/0629f021e0cb57e724e7e0bd57be724a8a2dab2b) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwm): auto focus address input new send flow

- [#20166](https://github.com/LedgerHQ/ledger-live/pull/20166) [`74ee8f9`](https://github.com/LedgerHQ/ledger-live/commit/74ee8f9e55363eb09623d72247bf2af92dbd17aa) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove two dead navigator screens that were registered but unreachable.

  - `RegionSettings`: orphaned since its only entry point (`RegionRow`) was removed in PR #1000 (2022). Removed the screen registration, `Region` screen, `regions.json` (~36 KB dropped from the bundle), the `ScreenName.RegionSettings` enum member, and the now-unused `setLocale` Redux chain (action, action type, payload type, reducer handler). No behavioral change — `locale` still resolves from the language default and imported settings.
  - `AnalyticsAllocation`: legacy allocation screen superseded by the MVVM Analytics `DetailedAllocation`. Removed the registration and the legacy `Allocation`/`RingChart`/`DistributionCard` component cluster.

- [#20073](https://github.com/LedgerHQ/ledger-live/pull/20073) [`a534db5`](https://github.com/LedgerHQ/ledger-live/commit/a534db5c41da6957d38a330c1da6f7db1b693763) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Remove newsfeedPage feature flag (LIVE-31511)

- [#20054](https://github.com/LedgerHQ/ledger-live/pull/20054) [`c622459`](https://github.com/LedgerHQ/ledger-live/commit/c622459fcbff5dcc094ee10eb360f2a835036007) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Remove the disabled npsRatingsPrompt feature flag and NPS ratings dead code on mobile

- [#20180](https://github.com/LedgerHQ/ledger-live/pull/20180) [`dd7758b`](https://github.com/LedgerHQ/ledger-live/commit/dd7758bfa16c6b73b60da072a50c22f3b132c1a2) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Show 8 characters on each side of the ellipsis when truncating the recipient address in the new send flow, consistently across mobile and desktop

- [#19996](https://github.com/LedgerHQ/ledger-live/pull/19996) [`c9dddf2`](https://github.com/LedgerHQ/ledger-live/commit/c9dddf21f6e3208a077aa72bd575f56415287074) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwm): changes bottomsheet to sheet info and minor fixes on lwm

- [#19945](https://github.com/LedgerHQ/ledger-live/pull/19945) [`0156224`](https://github.com/LedgerHQ/ledger-live/commit/015622450157c5d7f417a8322100ac53edd053f3) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwm): new send flow add qr code scan

- [#20127](https://github.com/LedgerHQ/ledger-live/pull/20127) [`e7b8ddc`](https://github.com/LedgerHQ/ledger-live/commit/e7b8ddc239b88c1fbf0751c468218d9263f56859) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: aleo tokens swap incompatibility warning

- [#20094](https://github.com/LedgerHQ/ledger-live/pull/20094) [`481abc3`](https://github.com/LedgerHQ/ledger-live/commit/481abc3d1daf758066ec95c4117ae37c2f08e949) Thanks [@sarneijim](https://github.com/sarneijim)! - Match the large-screen upsell modal artwork to light and dark themes, use the default modal background, and adapt it to smaller screens

- [#19828](https://github.com/LedgerHQ/ledger-live/pull/19828) [`f08cad1`](https://github.com/LedgerHQ/ledger-live/commit/f08cad15e523a210054d9a10f0bbb69bf42a963a) Thanks [@henri-ly](https://github.com/henri-ly)! - new send flow e2e mobile native send

- [#19925](https://github.com/LedgerHQ/ledger-live/pull/19925) [`72969ec`](https://github.com/LedgerHQ/ledger-live/commit/72969ecd9ae1f6ff8ba380fba1e7f96297f81bbc) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Track input mode (fiat or crypto) when clicking review on the new send flow amount screen

- [#20164](https://github.com/LedgerHQ/ledger-live/pull/20164) [`946ab9e`](https://github.com/LedgerHQ/ledger-live/commit/946ab9e15c04963b20a69eb862303219a4639a43) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Fix countervalue resetting to USD after killing and restarting the app when the selected fiat (e.g. AMD) is not part of the offline fallback list. The boot-time "reset unsupported countervalue" guard ran against the fallback fiats before the CVS supported-fiats query resolved; the reset now lives in the reactive path gated on `fiatsReady`, so it only acts on the authoritative CVS list.

- [#19497](https://github.com/LedgerHQ/ledger-live/pull/19497) [`18eaa24`](https://github.com/LedgerHQ/ledger-live/commit/18eaa246ff06e86024b663b0a86068007f155b13) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - Update Swap Tab with New nav

- [#19215](https://github.com/LedgerHQ/ledger-live/pull/19215) [`dfab01f`](https://github.com/LedgerHQ/ledger-live/commit/dfab01f36460bd4e0ea0b0c13aa3d965aef945cd) Thanks [@CremaFR](https://github.com/CremaFR)! - Add a Device Intent Executor based signing path for Wallet API `transaction.sign` and `message.sign` on Ledger Wallet Mobile, gated behind the new `llmWalletApiDeviceIntentSign` feature flag (per-manifest allow-list, off by default). Introduces the `signMessageIntent` module in live-common.

- [#19215](https://github.com/LedgerHQ/ledger-live/pull/19215) [`1a11c71`](https://github.com/LedgerHQ/ledger-live/commit/1a11c71a5edbc988f27bc41f5ba078641ff8a729) Thanks [@CremaFR](https://github.com/CremaFR)! - Enrich the wallet-api Device Intent Executor deviceUxV2 analytics funnel events (deviceflow_started, app_ready, deviceflow_completed, deviceflow_aborted/failed and the drawer close button_clicked) with the calling live-app's manifestId and manifestName. This keeps sourceFlow="wallet_api" while letting dashboards distinguish the originating app (swap, earn, dApp, ...) via a generic analytics-properties bag threaded through the executor.

- [#19951](https://github.com/LedgerHQ/ledger-live/pull/19951) [`123c13f`](https://github.com/LedgerHQ/ledger-live/commit/123c13f2fa65242ea232a33151f58dec5130552f) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(lwm): keep Learn more visible on recipient with keyboard open

- [#20190](https://github.com/LedgerHQ/ledger-live/pull/20190) [`a8d6e25`](https://github.com/LedgerHQ/ledger-live/commit/a8d6e25c0467572fbbc0cd3b35f90d355542b1f7) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(lwdm): new send flow wait for valid address to display memo

- [#20097](https://github.com/LedgerHQ/ledger-live/pull/20097) [`7efe94e`](https://github.com/LedgerHQ/ledger-live/commit/7efe94e4dfa707fb0c23ff819791194d33ac5d8f) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - changes to self transfer label for Aleo

### Patch Changes

- Updated dependencies [[`1070564`](https://github.com/LedgerHQ/ledger-live/commit/107056410174d3da2d45c468232a8d742aea021f), [`2e1aecc`](https://github.com/LedgerHQ/ledger-live/commit/2e1aeccf6c91761c5d09c91e4be10dcc8c22eb7b), [`ba69273`](https://github.com/LedgerHQ/ledger-live/commit/ba692732b521c42f934acf540641ecbfdb837004), [`24d60d7`](https://github.com/LedgerHQ/ledger-live/commit/24d60d7628696b58764f8fbd4495140a049b3fcc), [`1af9ec9`](https://github.com/LedgerHQ/ledger-live/commit/1af9ec984928e0bf5fd23ce12edcc6131b0302a0), [`f79de59`](https://github.com/LedgerHQ/ledger-live/commit/f79de59f95ed384fc2b2e49dfa28efb1a0493d4a), [`f5e4e87`](https://github.com/LedgerHQ/ledger-live/commit/f5e4e87a114ca8336f310a4b5e39bff650fc0750), [`dbffe41`](https://github.com/LedgerHQ/ledger-live/commit/dbffe417f903844a973b7a284206e7313b7a8e5a), [`86bbd1d`](https://github.com/LedgerHQ/ledger-live/commit/86bbd1d829ee60b76af040c064d93acc15561855), [`54b3d2b`](https://github.com/LedgerHQ/ledger-live/commit/54b3d2b6032f1336d4d9fb2e238fa2347e45cc81), [`8a6b086`](https://github.com/LedgerHQ/ledger-live/commit/8a6b0868b0f0d760d83ece3edafa40716df4fc2f), [`281a7f3`](https://github.com/LedgerHQ/ledger-live/commit/281a7f358d6fe176a0cbba349d081942ed32ea64), [`cee41c4`](https://github.com/LedgerHQ/ledger-live/commit/cee41c4e7a7c7e042d4df39d5a34591d72d723d0), [`2e410a6`](https://github.com/LedgerHQ/ledger-live/commit/2e410a67f5a88b5cb8d79184b97bcded0d4eaadf), [`808c4cd`](https://github.com/LedgerHQ/ledger-live/commit/808c4cd479e509210ea9537fe972251cfd8d04f7), [`8ab9e50`](https://github.com/LedgerHQ/ledger-live/commit/8ab9e504a5b004e28f5e80f490b837b3c2526f44), [`4148019`](https://github.com/LedgerHQ/ledger-live/commit/414801922232b6d9514270e8876e783c11555c2c), [`1e4e519`](https://github.com/LedgerHQ/ledger-live/commit/1e4e51913a9b1971056789ac24ed05092529d799), [`52253f7`](https://github.com/LedgerHQ/ledger-live/commit/52253f70c302056cdc6b367cdd8b1db408b5e07d), [`4ce5257`](https://github.com/LedgerHQ/ledger-live/commit/4ce52570577d471d4af0609058ac6b9b03ad1949), [`91da072`](https://github.com/LedgerHQ/ledger-live/commit/91da072ea17f564824d6c04d13934ec88d86d348), [`e58258b`](https://github.com/LedgerHQ/ledger-live/commit/e58258b3a130ba606bdf8d882b02d59eb3571082), [`452adf8`](https://github.com/LedgerHQ/ledger-live/commit/452adf85380d1cb74f1894478cdd84849b120ef4), [`112b63f`](https://github.com/LedgerHQ/ledger-live/commit/112b63f8d33a8e26b316ce4542ef23460ae54937), [`44798f3`](https://github.com/LedgerHQ/ledger-live/commit/44798f392deb662a5f60123651ece2b320fbf946), [`d7600fb`](https://github.com/LedgerHQ/ledger-live/commit/d7600fb21e73581fbfb20019a78109b9a5c9abff), [`6131b15`](https://github.com/LedgerHQ/ledger-live/commit/6131b15d376b0ea2677df401564872a9c19d2151), [`f334b43`](https://github.com/LedgerHQ/ledger-live/commit/f334b430c82892f603221fb3ffe5d3964215bcad), [`67df284`](https://github.com/LedgerHQ/ledger-live/commit/67df284e2ccb916cff51896e42ef21846249b3e7), [`18bc180`](https://github.com/LedgerHQ/ledger-live/commit/18bc180446f0d7410a3aedd953e2fb0ce2b43f4c), [`26ee89d`](https://github.com/LedgerHQ/ledger-live/commit/26ee89d7e3bba9b800a7b6f08db52b079fcd8bd5), [`5de8391`](https://github.com/LedgerHQ/ledger-live/commit/5de839159cbd681c5a764976197ca4f028195124), [`66edf4d`](https://github.com/LedgerHQ/ledger-live/commit/66edf4da2d94165a82f36680f3df323f1a62b45e), [`8677d5c`](https://github.com/LedgerHQ/ledger-live/commit/8677d5c5a789c257cb02c0f757d883b9a9be328b), [`a534db5`](https://github.com/LedgerHQ/ledger-live/commit/a534db5c41da6957d38a330c1da6f7db1b693763), [`c622459`](https://github.com/LedgerHQ/ledger-live/commit/c622459fcbff5dcc094ee10eb360f2a835036007), [`524d763`](https://github.com/LedgerHQ/ledger-live/commit/524d7636d85a79379a9b086323d3121f3199bd1f), [`e4e009f`](https://github.com/LedgerHQ/ledger-live/commit/e4e009f60792d3d0c9dd79c19406b02cec66b22b), [`dbf8acf`](https://github.com/LedgerHQ/ledger-live/commit/dbf8acf27c9405548e7eb559d163a8e0883a20aa), [`dfab01f`](https://github.com/LedgerHQ/ledger-live/commit/dfab01f36460bd4e0ea0b0c13aa3d965aef945cd), [`aa27732`](https://github.com/LedgerHQ/ledger-live/commit/aa2773257ffa4480b33c2a219c9986eb40e293fb), [`aa27732`](https://github.com/LedgerHQ/ledger-live/commit/aa2773257ffa4480b33c2a219c9986eb40e293fb), [`f8b5b51`](https://github.com/LedgerHQ/ledger-live/commit/f8b5b51856c57c68ca50d13b00d124d261c26504)]:
  - @ledgerhq/errors@7.0.0
  - @ledgerhq/ledger-wallet-framework@2.6.0
  - @ledgerhq/coin-bitcoin@0.49.0
  - @ledgerhq/coin-canton@0.31.0
  - @ledgerhq/coin-casper@2.17.0
  - @ledgerhq/coin-concordium@0.18.0
  - @ledgerhq/coin-cosmos@0.41.0
  - @ledgerhq/coin-evm@4.8.0
  - @ledgerhq/coin-filecoin@1.30.0
  - @ledgerhq/coin-multiversx@0.22.0
  - @ledgerhq/coin-stacks@0.26.0
  - @ledgerhq/live-network@3.0.0
  - @features/flow-contacts@0.4.0
  - @domain/entity-currency-crypto@0.8.0
  - @domain/entity-currency-token@0.3.0
  - @domain/entity-currency@0.3.0
  - @ledgerhq/live-countervalues@0.24.0
  - @domain/entity-contact@0.4.0
  - @shared/feature-flags@0.16.0
  - @devtools/shell@0.6.0
  - @ledgerhq/native-ui@0.65.0
  - @ledgerhq/types-live@6.117.0
  - @ledgerhq/domain-service@1.8.12
  - @ledgerhq/hw-transport@6.35.7
  - @ledgerhq/hw-transport-http@6.36.7
  - @ledgerhq/live-dmk-mobile@0.29.1
  - @ledgerhq/live-countervalues-react@0.16.4
  - @ledgerhq/live-wallet@0.30.1
  - @ledgerhq/wallet-analytics@0.3.1
  - @ledgerhq/wallet-pnl@0.7.4
  - @ledgerhq/ledger-key-ring-protocol@0.17.2
  - @domain/api-currency-token@0.2.3
  - @features/platform-currencies@0.4.1
  - @ledgerhq/live-currency-format@0.14.1
  - @devtools/bindings@0.2.2
  - @features/platform-feature-flags@0.6.3
  - @ledgerhq/hw-ledger-key-ring-protocol@0.11.2
  - @shared/env@0.1.1
  - @ledgerhq/live-dmk-shared@0.29.1
  - @ledgerhq/live-dmk-speculos@0.10.3
  - @features/platform-env@0.1.1

## 4.14.0-next.1

### Minor Changes

- [#20349](https://github.com/LedgerHQ/ledger-live/pull/20349) [`f715aa5`](https://github.com/LedgerHQ/ledger-live/commit/f715aa516225f72124e083e3ffa0f254b9d5df4f) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Fix Zcash sends failing before the device prompt when the coin being spent came from a V4-format transaction (PROD-12599).

  Signing a transparent Zcash transaction whose input came from a V4 (Sapling-format) transaction failed immediately: no review screen appeared on the device, and Ledger Live showed "Something went wrong" with no detail. V4 is still valid on mainnet and still emitted by exchanges and older wallets, while Ledger Live itself emits V5 — so an account funded from within Ledger Live never hit this, which is why the failure looked intermittent. It is in fact deterministic, decided by which software created the funding transaction.

  `serializedPreviousTransactionOverride` carries the source transaction's raw on-chain bytes so the device can compute the correct ZIP-244 txid for a V5 transaction, whose Orchard bundle the signer kit's serialization would otherwise strip. It was being set for every version. The kit chunks a V4 transaction expecting Ledger's internal serialization, whose header carries a consensus branch id absent from the on-chain bytes; given those bytes it read the input count four bytes late and threw while chunking that input. The override is now restricted to the versions that need it, and a V4 source transaction goes back through the serialization path that has always handled it, its Sapling fields travelling in `extraData` as before.

  The decision is made per input, which is what a send spending several coins looks like from the outside: the V5 inputs are chunked and their trusted inputs obtained from the device first, then the transaction dies when the V4 input's turn comes. The device has already answered several times by then, yet no review screen is ever reached — so the failure looks like a device problem rather than a serialization one.

  Untagged device action errors are also no longer flattened into a message-less `Error`, so a failure inside a device action task names itself in the logs instead of surfacing only as "Something went wrong".

### Patch Changes

- Updated dependencies [[`f79de59`](https://github.com/LedgerHQ/ledger-live/commit/f79de59f95ed384fc2b2e49dfa28efb1a0493d4a)]:
  - @ledgerhq/coin-bitcoin@0.49.0-next.1

## 4.14.0-next.0

### Minor Changes

- [#20129](https://github.com/LedgerHQ/ledger-live/pull/20129) [`ba20e39`](https://github.com/LedgerHQ/ledger-live/commit/ba20e3926e52284c04c9bc4e4b17b7c5e34b3cb5) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Migrate `checkLibs` and its two callers off `@ledgerhq/errors` as part of the errors sunset (LIVE-32915).

  `checkLibs` detects duplicated npm packages by comparing class identity, so `sanityChecks.ts` and both app entrypoints must import `NotEnoughBalance` from the same module. All three now use `@ledgerhq/ledger-wallet-framework/errors`. The duplicate-package warning also names `@ledgerhq/ledger-wallet-framework` so the `pnpm why` hint points at the package actually being checked.

- [#20172](https://github.com/LedgerHQ/ledger-live/pull/20172) [`6dd18aa`](https://github.com/LedgerHQ/ledger-live/commit/6dd18aae6e7a6d9aedc25d491ccd147a44b277a6) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove the legacy Gorhom `QueuedDrawer` implementation (migrating the last consumer, the Cardano DRep delegation drawer, to the Lumen bottom sheet) and rename `QueuedDrawerBottomSheet` to `QueuedBottomSheet`.

- [#19982](https://github.com/LedgerHQ/ledger-live/pull/19982) [`f5e4e87`](https://github.com/LedgerHQ/ledger-live/commit/f5e4e87a114ca8336f310a4b5e39bff650fc0750) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Display estimated pending rewards for 0G delegations; gate claim-rewards UI to chains that support it.

- [#19967](https://github.com/LedgerHQ/ledger-live/pull/19967) [`56f5153`](https://github.com/LedgerHQ/ledger-live/commit/56f5153d7a4c7e277358b1cbb23eb921a351e195) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Fix welcome page first story looping to last on left tap

- [#20099](https://github.com/LedgerHQ/ledger-live/pull/20099) [`37dac39`](https://github.com/LedgerHQ/ledger-live/commit/37dac39463de1a44bdb5bc4b1b6b37b0cff68922) Thanks [@deepyjr](https://github.com/deepyjr)! - Add contact address asset and network selection through the Modular Dialog, with shared asset
  filtering across Desktop and Mobile.

- [#19958](https://github.com/LedgerHQ/ledger-live/pull/19958) [`9773bd3`](https://github.com/LedgerHQ/ledger-live/commit/9773bd3d61db1a740d18dea3d3dca325b3c89ee8) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Propagate contextual analytics properties through Device Intent Executor events.

- [#20032](https://github.com/LedgerHQ/ledger-live/pull/20032) [`dbffe41`](https://github.com/LedgerHQ/ledger-live/commit/dbffe417f903844a973b7a284206e7313b7a8e5a) Thanks [@deepyjr](https://github.com/deepyjr)! - Render Me-specific contact detail actions and copy on mobile.

- [#19964](https://github.com/LedgerHQ/ledger-live/pull/19964) [`86bbd1d`](https://github.com/LedgerHQ/ledger-live/commit/86bbd1d829ee60b76af040c064d93acc15561855) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add the one-time Contacts feature introduction drawer on Mobile with shared native content and dismissal preference.

- [#20107](https://github.com/LedgerHQ/ledger-live/pull/20107) [`54b3d2b`](https://github.com/LedgerHQ/ledger-live/commit/54b3d2b6032f1336d4d9fb2e238fa2347e45cc81) Thanks [@deepyjr](https://github.com/deepyjr)! - Add shared Coin Integration address validation to Contacts

- [#20050](https://github.com/LedgerHQ/ledger-live/pull/20050) [`4c34536`](https://github.com/LedgerHQ/ledger-live/commit/4c345363f061fb4a525684ae45ce437ea12e77d7) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Remove Custom Lock Screen step from the post-onboarding widget.

- [#19994](https://github.com/LedgerHQ/ledger-live/pull/19994) [`0f61d63`](https://github.com/LedgerHQ/ledger-live/commit/0f61d637855072b4352cb3e6901a4ed9986a0bbd) Thanks [@sarneijim](https://github.com/sarneijim)! - Update large-screen upsell modal UTM attribution on mobile and desktop

- [#19807](https://github.com/LedgerHQ/ledger-live/pull/19807) [`2cf4a29`](https://github.com/LedgerHQ/ledger-live/commit/2cf4a2904c8a732cbe732f354be08b5c4e559f3a) Thanks [@sarneijim](https://github.com/sarneijim)! - Reset mobile navigation state for sequential token deeplinks and redirect invalid asset deeplinks to Market

- [#20033](https://github.com/LedgerHQ/ledger-live/pull/20033) [`d390840`](https://github.com/LedgerHQ/ledger-live/commit/d39084070c35bc15cf6d08dba27b8077affd05af) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Loop Product Tour post-onboarding card animations and restart them when revisiting a slide

- [#19374](https://github.com/LedgerHQ/ledger-live/pull/19374) [`079775c`](https://github.com/LedgerHQ/ledger-live/commit/079775cab10840031fd40fc9f54126161654336c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - de-gate lwmWallet40.enabled in WXP-owned drawers, hooks, and screens

- [#20009](https://github.com/LedgerHQ/ledger-live/pull/20009) [`341ea10`](https://github.com/LedgerHQ/ledger-live/commit/341ea108e30bf8af9abeb6eed484ee4b2c7c4a43) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Revert Cardano firmware app v8.0.4 support (hw-app-cardano bump to 8.0.0)

- [#19985](https://github.com/LedgerHQ/ledger-live/pull/19985) [`808c4cd`](https://github.com/LedgerHQ/ledger-live/commit/808c4cd479e509210ea9537fe972251cfd8d04f7) Thanks [@deepyjr](https://github.com/deepyjr)! - Reorganize the contacts flow package around a /steps folder (List, AddContact, Introduction, Detail), promote shared helpers to src/utils, curate root barrels, and rename public views to ContactsListView and ContactDetailView. No runtime behavior change.

- [#20070](https://github.com/LedgerHQ/ledger-live/pull/20070) [`52253f7`](https://github.com/LedgerHQ/ledger-live/commit/52253f70c302056cdc6b367cdd8b1db408b5e07d) Thanks [@ysitbon](https://github.com/ysitbon)! - Remove the now-dead `@ledgerhq/cryptoassets` currency/fiat store injection from the app bootstraps. Nothing reads the legacy currency/fiat accessors anymore (the runtime source of truth is the domain-backed wallet-framework currency resolver), so `setCryptoCurrenciesStore` / `setFiatCurrenciesStore` injected a store no consumer queried. Drop the calls, drop the `@ledgerhq/cryptoassets` dependency from the apps, and remove the remaining stale references to the package in comments.

- [#20175](https://github.com/LedgerHQ/ledger-live/pull/20175) [`b953d34`](https://github.com/LedgerHQ/ledger-live/commit/b953d34622e3b4094c5fa5659ae45d907bc4ce88) Thanks [@deepyjr](https://github.com/deepyjr)! - Add a reusable queued drawer flow and an embeddable Modular Drawer presentation

- [#19992](https://github.com/LedgerHQ/ledger-live/pull/19992) [`452adf8`](https://github.com/LedgerHQ/ledger-live/commit/452adf85380d1cb74f1894478cdd84849b120ef4) Thanks [@sarneijim](https://github.com/sarneijim)! - Gate each existing mobile Nano S upsell banner placement through the shared large-screen upsell flag.

- [#19935](https://github.com/LedgerHQ/ledger-live/pull/19935) [`7ead592`](https://github.com/LedgerHQ/ledger-live/commit/7ead592696db3c052b26babcce734536887bf084) Thanks [@sarneijim](https://github.com/sarneijim)! - Update the Mobile large-screen upsell opt-out copy and CTA.

- [#20042](https://github.com/LedgerHQ/ledger-live/pull/20042) [`467578e`](https://github.com/LedgerHQ/ledger-live/commit/467578eca89c6f4bd8d307dc376ffc385382a199) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(lwm): fix multiple UI tweaks in the new send flow

- [#19715](https://github.com/LedgerHQ/ledger-live/pull/19715) [`cf63f27`](https://github.com/LedgerHQ/ledger-live/commit/cf63f273686aee3d941b8a4ead96f846ee4f483e) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Hide Send and Receive for HyperCore accounts on mobile: HyperCore has no on-chain send on Ledger Wallet and a plain receive is misleading (deposits go through bridging). Both actions are now hidden across the account actions (FAB), the asset actions, the quick-action drawers and the no-funds empty state, reusing the shared `isSendDisabledForFamily` / `isReceiveDisabledForFamily` predicates from `@ledgerhq/live-common`. The account "Quick actions" section is also hidden entirely when it has no actions left (e.g. HyperCore), instead of showing an empty titled section.

- [#20027](https://github.com/LedgerHQ/ledger-live/pull/20027) [`6131b15`](https://github.com/LedgerHQ/ledger-live/commit/6131b15d376b0ea2677df401564872a9c19d2151) Thanks [@deepyjr](https://github.com/deepyjr)! - Add shared Add Address session state and start it from Mobile contact details

- [#20035](https://github.com/LedgerHQ/ledger-live/pull/20035) [`67df284`](https://github.com/LedgerHQ/ledger-live/commit/67df284e2ccb916cff51896e42ef21846249b3e7) Thanks [@deepyjr](https://github.com/deepyjr)! - Select a native asset or token and its eligible network with the Mobile modular drawer before
  entering a contact address.

- [#19880](https://github.com/LedgerHQ/ledger-live/pull/19880) [`26ee89d`](https://github.com/LedgerHQ/ledger-live/commit/26ee89d7e3bba9b800a7b6f08db52b079fcd8bd5) Thanks [@deepyjr](https://github.com/deepyjr)! - Add the shared native empty contact detail page and wire it into Mobile.

- [#20091](https://github.com/LedgerHQ/ledger-live/pull/20091) [`ef5945a`](https://github.com/LedgerHQ/ledger-live/commit/ef5945a991c2d93259c414091bb276f527f8cbae) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Bump Lumen design-system packages to latest (design-core 0.1.23, ui-react 0.1.49, ui-rnative 0.1.52, ui-react-visualization 0.1.28, ui-rnative-visualization 0.1.29).

  - Migrate the desktop tables to the new `TableCellContent` compound API (`TableCellItem` / `TableCellContent` / `TableCellContentTitle` / `TableCellContentDescription` / `TableCellContentRow`).
  - Migrate the interactive My Wallet avatar to the new `AvatarButton` component on both apps, and fix the vertical centering of the desktop top-bar trigger.
  - Use the currency image fallback (`MediaImage`, circular) in the market list so it matches the crypto-icon shape.
  - Simplify `getDotIndicatorProps` avatar sizing now that the helper is typed for the full avatar size range.

- [#19805](https://github.com/LedgerHQ/ledger-live/pull/19805) [`b1d3f26`](https://github.com/LedgerHQ/ledger-live/commit/b1d3f26cbdf67c439bc125bdda1f1c56c9753f2e) Thanks [@ishaba](https://github.com/ishaba)! - feat(send): add default-fee strategy to the new send flow

- [#20159](https://github.com/LedgerHQ/ledger-live/pull/20159) [`534d2c5`](https://github.com/LedgerHQ/ledger-live/commit/534d2c50985051199d1974fdac7c70903ccea95c) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Migrate engagement-scope screens to SafeAreaViewFixed for experimental header compatibility

- [#20122](https://github.com/LedgerHQ/ledger-live/pull/20122) [`8677d5c`](https://github.com/LedgerHQ/ledger-live/commit/8677d5c5a789c257cb02c0f757d883b9a9be328b) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Migrate the mobile Modular Drawer to Lumen components (BottomSheet, ListItem, SearchInput, Banner, CardButton, Trend, Tag, Box/Text) and drop the legacy `native-ui` primitives and the `pre-ldls` composites it used. Removes the now-unused `pre-ldls` staging components (AssetItem, NetworkItem, AccountItem, Address, Tag, Input, Search, AssetTypeList, NetworkList, MarketPriceIndicator, MarketPercentIndicator) and the orphaned `useDebouncedCallback` hook from `@ledgerhq/native-ui` (CryptoIcon and AddAccountButton are kept). Adds the empty-account state (header description + "Add account" CardButton) on the account step.

- [#19955](https://github.com/LedgerHQ/ledger-live/pull/19955) [`0629f02`](https://github.com/LedgerHQ/ledger-live/commit/0629f021e0cb57e724e7e0bd57be724a8a2dab2b) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwm): auto focus address input new send flow

- [#20166](https://github.com/LedgerHQ/ledger-live/pull/20166) [`74ee8f9`](https://github.com/LedgerHQ/ledger-live/commit/74ee8f9e55363eb09623d72247bf2af92dbd17aa) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove two dead navigator screens that were registered but unreachable.

  - `RegionSettings`: orphaned since its only entry point (`RegionRow`) was removed in PR #1000 (2022). Removed the screen registration, `Region` screen, `regions.json` (~36 KB dropped from the bundle), the `ScreenName.RegionSettings` enum member, and the now-unused `setLocale` Redux chain (action, action type, payload type, reducer handler). No behavioral change — `locale` still resolves from the language default and imported settings.
  - `AnalyticsAllocation`: legacy allocation screen superseded by the MVVM Analytics `DetailedAllocation`. Removed the registration and the legacy `Allocation`/`RingChart`/`DistributionCard` component cluster.

- [#20073](https://github.com/LedgerHQ/ledger-live/pull/20073) [`a534db5`](https://github.com/LedgerHQ/ledger-live/commit/a534db5c41da6957d38a330c1da6f7db1b693763) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Remove newsfeedPage feature flag (LIVE-31511)

- [#20054](https://github.com/LedgerHQ/ledger-live/pull/20054) [`c622459`](https://github.com/LedgerHQ/ledger-live/commit/c622459fcbff5dcc094ee10eb360f2a835036007) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Remove the disabled npsRatingsPrompt feature flag and NPS ratings dead code on mobile

- [#20180](https://github.com/LedgerHQ/ledger-live/pull/20180) [`dd7758b`](https://github.com/LedgerHQ/ledger-live/commit/dd7758bfa16c6b73b60da072a50c22f3b132c1a2) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Show 8 characters on each side of the ellipsis when truncating the recipient address in the new send flow, consistently across mobile and desktop

- [#19996](https://github.com/LedgerHQ/ledger-live/pull/19996) [`c9dddf2`](https://github.com/LedgerHQ/ledger-live/commit/c9dddf21f6e3208a077aa72bd575f56415287074) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwm): changes bottomsheet to sheet info and minor fixes on lwm

- [#19945](https://github.com/LedgerHQ/ledger-live/pull/19945) [`0156224`](https://github.com/LedgerHQ/ledger-live/commit/015622450157c5d7f417a8322100ac53edd053f3) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwm): new send flow add qr code scan

- [#20127](https://github.com/LedgerHQ/ledger-live/pull/20127) [`e7b8ddc`](https://github.com/LedgerHQ/ledger-live/commit/e7b8ddc239b88c1fbf0751c468218d9263f56859) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: aleo tokens swap incompatibility warning

- [#20094](https://github.com/LedgerHQ/ledger-live/pull/20094) [`481abc3`](https://github.com/LedgerHQ/ledger-live/commit/481abc3d1daf758066ec95c4117ae37c2f08e949) Thanks [@sarneijim](https://github.com/sarneijim)! - Match the large-screen upsell modal artwork to light and dark themes, use the default modal background, and adapt it to smaller screens

- [#19828](https://github.com/LedgerHQ/ledger-live/pull/19828) [`f08cad1`](https://github.com/LedgerHQ/ledger-live/commit/f08cad15e523a210054d9a10f0bbb69bf42a963a) Thanks [@henri-ly](https://github.com/henri-ly)! - new send flow e2e mobile native send

- [#19925](https://github.com/LedgerHQ/ledger-live/pull/19925) [`72969ec`](https://github.com/LedgerHQ/ledger-live/commit/72969ecd9ae1f6ff8ba380fba1e7f96297f81bbc) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Track input mode (fiat or crypto) when clicking review on the new send flow amount screen

- [#20164](https://github.com/LedgerHQ/ledger-live/pull/20164) [`946ab9e`](https://github.com/LedgerHQ/ledger-live/commit/946ab9e15c04963b20a69eb862303219a4639a43) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Fix countervalue resetting to USD after killing and restarting the app when the selected fiat (e.g. AMD) is not part of the offline fallback list. The boot-time "reset unsupported countervalue" guard ran against the fallback fiats before the CVS supported-fiats query resolved; the reset now lives in the reactive path gated on `fiatsReady`, so it only acts on the authoritative CVS list.

- [#19497](https://github.com/LedgerHQ/ledger-live/pull/19497) [`18eaa24`](https://github.com/LedgerHQ/ledger-live/commit/18eaa246ff06e86024b663b0a86068007f155b13) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - Update Swap Tab with New nav

- [#19215](https://github.com/LedgerHQ/ledger-live/pull/19215) [`dfab01f`](https://github.com/LedgerHQ/ledger-live/commit/dfab01f36460bd4e0ea0b0c13aa3d965aef945cd) Thanks [@CremaFR](https://github.com/CremaFR)! - Add a Device Intent Executor based signing path for Wallet API `transaction.sign` and `message.sign` on Ledger Wallet Mobile, gated behind the new `llmWalletApiDeviceIntentSign` feature flag (per-manifest allow-list, off by default). Introduces the `signMessageIntent` module in live-common.

- [#19215](https://github.com/LedgerHQ/ledger-live/pull/19215) [`1a11c71`](https://github.com/LedgerHQ/ledger-live/commit/1a11c71a5edbc988f27bc41f5ba078641ff8a729) Thanks [@CremaFR](https://github.com/CremaFR)! - Enrich the wallet-api Device Intent Executor deviceUxV2 analytics funnel events (deviceflow_started, app_ready, deviceflow_completed, deviceflow_aborted/failed and the drawer close button_clicked) with the calling live-app's manifestId and manifestName. This keeps sourceFlow="wallet_api" while letting dashboards distinguish the originating app (swap, earn, dApp, ...) via a generic analytics-properties bag threaded through the executor.

- [#19951](https://github.com/LedgerHQ/ledger-live/pull/19951) [`123c13f`](https://github.com/LedgerHQ/ledger-live/commit/123c13f2fa65242ea232a33151f58dec5130552f) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(lwm): keep Learn more visible on recipient with keyboard open

- [#20190](https://github.com/LedgerHQ/ledger-live/pull/20190) [`a8d6e25`](https://github.com/LedgerHQ/ledger-live/commit/a8d6e25c0467572fbbc0cd3b35f90d355542b1f7) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(lwdm): new send flow wait for valid address to display memo

- [#20097](https://github.com/LedgerHQ/ledger-live/pull/20097) [`7efe94e`](https://github.com/LedgerHQ/ledger-live/commit/7efe94e4dfa707fb0c23ff819791194d33ac5d8f) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - changes to self transfer label for Aleo

### Patch Changes

- Updated dependencies [[`1070564`](https://github.com/LedgerHQ/ledger-live/commit/107056410174d3da2d45c468232a8d742aea021f), [`2e1aecc`](https://github.com/LedgerHQ/ledger-live/commit/2e1aeccf6c91761c5d09c91e4be10dcc8c22eb7b), [`ba69273`](https://github.com/LedgerHQ/ledger-live/commit/ba692732b521c42f934acf540641ecbfdb837004), [`24d60d7`](https://github.com/LedgerHQ/ledger-live/commit/24d60d7628696b58764f8fbd4495140a049b3fcc), [`1af9ec9`](https://github.com/LedgerHQ/ledger-live/commit/1af9ec984928e0bf5fd23ce12edcc6131b0302a0), [`f5e4e87`](https://github.com/LedgerHQ/ledger-live/commit/f5e4e87a114ca8336f310a4b5e39bff650fc0750), [`dbffe41`](https://github.com/LedgerHQ/ledger-live/commit/dbffe417f903844a973b7a284206e7313b7a8e5a), [`86bbd1d`](https://github.com/LedgerHQ/ledger-live/commit/86bbd1d829ee60b76af040c064d93acc15561855), [`54b3d2b`](https://github.com/LedgerHQ/ledger-live/commit/54b3d2b6032f1336d4d9fb2e238fa2347e45cc81), [`8a6b086`](https://github.com/LedgerHQ/ledger-live/commit/8a6b0868b0f0d760d83ece3edafa40716df4fc2f), [`281a7f3`](https://github.com/LedgerHQ/ledger-live/commit/281a7f358d6fe176a0cbba349d081942ed32ea64), [`cee41c4`](https://github.com/LedgerHQ/ledger-live/commit/cee41c4e7a7c7e042d4df39d5a34591d72d723d0), [`2e410a6`](https://github.com/LedgerHQ/ledger-live/commit/2e410a67f5a88b5cb8d79184b97bcded0d4eaadf), [`808c4cd`](https://github.com/LedgerHQ/ledger-live/commit/808c4cd479e509210ea9537fe972251cfd8d04f7), [`8ab9e50`](https://github.com/LedgerHQ/ledger-live/commit/8ab9e504a5b004e28f5e80f490b837b3c2526f44), [`4148019`](https://github.com/LedgerHQ/ledger-live/commit/414801922232b6d9514270e8876e783c11555c2c), [`1e4e519`](https://github.com/LedgerHQ/ledger-live/commit/1e4e51913a9b1971056789ac24ed05092529d799), [`52253f7`](https://github.com/LedgerHQ/ledger-live/commit/52253f70c302056cdc6b367cdd8b1db408b5e07d), [`4ce5257`](https://github.com/LedgerHQ/ledger-live/commit/4ce52570577d471d4af0609058ac6b9b03ad1949), [`91da072`](https://github.com/LedgerHQ/ledger-live/commit/91da072ea17f564824d6c04d13934ec88d86d348), [`e58258b`](https://github.com/LedgerHQ/ledger-live/commit/e58258b3a130ba606bdf8d882b02d59eb3571082), [`452adf8`](https://github.com/LedgerHQ/ledger-live/commit/452adf85380d1cb74f1894478cdd84849b120ef4), [`112b63f`](https://github.com/LedgerHQ/ledger-live/commit/112b63f8d33a8e26b316ce4542ef23460ae54937), [`44798f3`](https://github.com/LedgerHQ/ledger-live/commit/44798f392deb662a5f60123651ece2b320fbf946), [`d7600fb`](https://github.com/LedgerHQ/ledger-live/commit/d7600fb21e73581fbfb20019a78109b9a5c9abff), [`6131b15`](https://github.com/LedgerHQ/ledger-live/commit/6131b15d376b0ea2677df401564872a9c19d2151), [`f334b43`](https://github.com/LedgerHQ/ledger-live/commit/f334b430c82892f603221fb3ffe5d3964215bcad), [`67df284`](https://github.com/LedgerHQ/ledger-live/commit/67df284e2ccb916cff51896e42ef21846249b3e7), [`18bc180`](https://github.com/LedgerHQ/ledger-live/commit/18bc180446f0d7410a3aedd953e2fb0ce2b43f4c), [`26ee89d`](https://github.com/LedgerHQ/ledger-live/commit/26ee89d7e3bba9b800a7b6f08db52b079fcd8bd5), [`5de8391`](https://github.com/LedgerHQ/ledger-live/commit/5de839159cbd681c5a764976197ca4f028195124), [`66edf4d`](https://github.com/LedgerHQ/ledger-live/commit/66edf4da2d94165a82f36680f3df323f1a62b45e), [`8677d5c`](https://github.com/LedgerHQ/ledger-live/commit/8677d5c5a789c257cb02c0f757d883b9a9be328b), [`a534db5`](https://github.com/LedgerHQ/ledger-live/commit/a534db5c41da6957d38a330c1da6f7db1b693763), [`c622459`](https://github.com/LedgerHQ/ledger-live/commit/c622459fcbff5dcc094ee10eb360f2a835036007), [`524d763`](https://github.com/LedgerHQ/ledger-live/commit/524d7636d85a79379a9b086323d3121f3199bd1f), [`e4e009f`](https://github.com/LedgerHQ/ledger-live/commit/e4e009f60792d3d0c9dd79c19406b02cec66b22b), [`dbf8acf`](https://github.com/LedgerHQ/ledger-live/commit/dbf8acf27c9405548e7eb559d163a8e0883a20aa), [`dfab01f`](https://github.com/LedgerHQ/ledger-live/commit/dfab01f36460bd4e0ea0b0c13aa3d965aef945cd), [`aa27732`](https://github.com/LedgerHQ/ledger-live/commit/aa2773257ffa4480b33c2a219c9986eb40e293fb), [`aa27732`](https://github.com/LedgerHQ/ledger-live/commit/aa2773257ffa4480b33c2a219c9986eb40e293fb), [`f8b5b51`](https://github.com/LedgerHQ/ledger-live/commit/f8b5b51856c57c68ca50d13b00d124d261c26504)]:
  - @ledgerhq/errors@7.0.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.6.0-next.0
  - @ledgerhq/coin-bitcoin@0.49.0-next.0
  - @ledgerhq/coin-canton@0.31.0-next.0
  - @ledgerhq/coin-casper@2.17.0-next.0
  - @ledgerhq/coin-concordium@0.18.0-next.0
  - @ledgerhq/coin-cosmos@0.41.0-next.0
  - @ledgerhq/coin-evm@4.8.0-next.0
  - @ledgerhq/coin-filecoin@1.30.0-next.0
  - @ledgerhq/coin-multiversx@0.22.0-next.0
  - @ledgerhq/coin-stacks@0.26.0-next.0
  - @ledgerhq/live-network@3.0.0-next.0
  - @features/flow-contacts@0.4.0-next.0
  - @domain/entity-currency-crypto@0.8.0-next.0
  - @domain/entity-currency-token@0.3.0-next.0
  - @domain/entity-currency@0.3.0-next.0
  - @ledgerhq/live-countervalues@0.24.0-next.0
  - @domain/entity-contact@0.4.0-next.0
  - @shared/feature-flags@0.16.0-next.0
  - @devtools/shell@0.6.0-next.0
  - @ledgerhq/native-ui@0.65.0-next.0
  - @ledgerhq/types-live@6.117.0-next.0
  - @ledgerhq/domain-service@1.8.12-next.0
  - @ledgerhq/hw-transport@6.35.7-next.0
  - @ledgerhq/hw-transport-http@6.36.7-next.0
  - @ledgerhq/live-dmk-mobile@0.29.1-next.0
  - @ledgerhq/live-countervalues-react@0.16.4-next.0
  - @ledgerhq/live-wallet@0.30.1-next.0
  - @ledgerhq/wallet-analytics@0.3.1-next.0
  - @ledgerhq/wallet-pnl@0.7.4-next.0
  - @ledgerhq/ledger-key-ring-protocol@0.17.2-next.0
  - @domain/api-currency-token@0.2.3-next.0
  - @features/platform-currencies@0.4.1-next.0
  - @ledgerhq/live-currency-format@0.14.1-next.0
  - @devtools/bindings@0.2.2-next.0
  - @features/platform-feature-flags@0.6.3-next.0
  - @ledgerhq/hw-ledger-key-ring-protocol@0.11.2-next.0
  - @shared/env@0.1.1-next.0
  - @ledgerhq/live-dmk-shared@0.29.1-next.0
  - @ledgerhq/live-dmk-speculos@0.10.3-next.0
  - @features/platform-env@0.1.1-next.0

## 4.13.0

### Minor Changes

- [#19666](https://github.com/LedgerHQ/ledger-live/pull/19666) [`b842501`](https://github.com/LedgerHQ/ledger-live/commit/b8425019b0649ddaf37f875ea78ae9425016c728) Thanks [@deepyjr](https://github.com/deepyjr)! - Add Ledger Sync introduction translations to Mobile Contacts.

- [#19813](https://github.com/LedgerHQ/ledger-live/pull/19813) [`928f6e2`](https://github.com/LedgerHQ/ledger-live/commit/928f6e2745d9713c12a8986d46bb3d7e31b5918a) Thanks [@aussedatlo](https://github.com/aussedatlo)! - bump @ledgerhq/context-module to 2.3.0

- [#19854](https://github.com/LedgerHQ/ledger-live/pull/19854) [`c3c5329`](https://github.com/LedgerHQ/ledger-live/commit/c3c5329ffe69ed47a1f3a8910ae7fd8b53486f24) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(algo): restore Algorand memo in new send flow with protocol 1024-byte note limit

- [#19865](https://github.com/LedgerHQ/ledger-live/pull/19865) [`7708345`](https://github.com/LedgerHQ/ledger-live/commit/77083455c985349f5a2061db4c22b2fa8ce758f9) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Remove partial app preparation from Device Intent Executor flows

- [#19794](https://github.com/LedgerHQ/ledger-live/pull/19794) [`2388d41`](https://github.com/LedgerHQ/ledger-live/commit/2388d4171bd2e5caa2009e8eadcd06548d2209ef) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Handle non-onboarded devices according to the requirements of each Connect App flow

- [#19820](https://github.com/LedgerHQ/ledger-live/pull/19820) [`6bd9b00`](https://github.com/LedgerHQ/ledger-live/commit/6bd9b00cf4f87b520d4c1f70f5b9f3de95392a36) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Fix device selection drawer layout and scrolling for long device lists

- [#19755](https://github.com/LedgerHQ/ledger-live/pull/19755) [`5945c33`](https://github.com/LedgerHQ/ledger-live/commit/5945c3311ad3ae9584d6cafa65007b3be16face6) Thanks [@LucasWerey](https://github.com/LucasWerey)! - remove lumen debug and visualization debug tools

- [#19625](https://github.com/LedgerHQ/ledger-live/pull/19625) [`28c29a1`](https://github.com/LedgerHQ/ledger-live/commit/28c29a1e6f4c28edfeba59483876b130a6e6b97c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove findCryptoCurrencyByTicker re-lookups in market counter-value formatting and detection paths

- [#19765](https://github.com/LedgerHQ/ledger-live/pull/19765) [`2818fc1`](https://github.com/LedgerHQ/ledger-live/commit/2818fc1a7603f295154053b3a62f19ae81fdccac) Thanks [@LucasWerey](https://github.com/LucasWerey)! - fix: remove SafeAreaInsetsContext.Provider global override, replace with useAdjustedSafeAreaInsets hook

- [#19883](https://github.com/LedgerHQ/ledger-live/pull/19883) [`2884af7`](https://github.com/LedgerHQ/ledger-live/commit/2884af77f887912ceb9f6686f2718cc71c148756) Thanks [@deepyjr](https://github.com/deepyjr)! - Render validation errors in the add contact form.

- [#19990](https://github.com/LedgerHQ/ledger-live/pull/19990) [`b2fe0f0`](https://github.com/LedgerHQ/ledger-live/commit/b2fe0f0b9bf9cb5976f4d7f21e24654d60acfcf2) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Revert Cardano firmware app v8.0.4 support (hw-app-cardano bump to 8.0.0)

- [#19742](https://github.com/LedgerHQ/ledger-live/pull/19742) [`022f431`](https://github.com/LedgerHQ/ledger-live/commit/022f43122a713f9d4b2e10daaec0d44c91b58c9f) Thanks [@deepyjr](https://github.com/deepyjr)! - Add Ledger Sync checking and introduction presentation variants to Mobile Contacts.

- [#19905](https://github.com/LedgerHQ/ledger-live/pull/19905) [`ae9897a`](https://github.com/LedgerHQ/ledger-live/commit/ae9897ad91b89bed89be1d51d73ec5666d337d19) Thanks [@koda-apps](https://github.com/apps/koda-apps)! - fix(send): hide balance in send modal header when discreet mode is enabled

- [#19778](https://github.com/LedgerHQ/ledger-live/pull/19778) [`f6e5b74`](https://github.com/LedgerHQ/ledger-live/commit/f6e5b7453015db453e604052b115dd9996f266fa) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(lwdm): fix wrong memo label i18n id

- [#19809](https://github.com/LedgerHQ/ledger-live/pull/19809) [`26db6f1`](https://github.com/LedgerHQ/ledger-live/commit/26db6f111d86e861c8509249c4b40b765ac567c3) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - updated bottom spacing for summary step

- [#19838](https://github.com/LedgerHQ/ledger-live/pull/19838) [`82f1850`](https://github.com/LedgerHQ/ledger-live/commit/82f1850f5086e549e17f1218d7e21dbf16041ea7) Thanks [@sarneijim](https://github.com/sarneijim)! - Update large-screen upsell modal hero images for light and dark themes.

- [#19890](https://github.com/LedgerHQ/ledger-live/pull/19890) [`6d2a928`](https://github.com/LedgerHQ/ledger-live/commit/6d2a928e42ea64cdb14a2d860f4b0019180c594a) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix: show all digits in aleo send flow

- [#19702](https://github.com/LedgerHQ/ledger-live/pull/19702) [`6935fe0`](https://github.com/LedgerHQ/ledger-live/commit/6935fe04a6304e046fd217350399446194e96d47) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Add HyperCore support by plugging `@ledgerhq/coin-hypercore` into the generic coin framework: register the `hypercore` native currency (USDC, magnitude 6), route the family through the generic bridge, reuse the EVM signer for address derivation (HyperCore shares the Ethereum address), and add the `currencyHypercore` feature flag. HyperCore accounts can be discovered and serve their balance and operations from the coin module. In the history, HyperCore operations are labelled "Deposit"/"Withdraw" instead of "Received"/"Sent" (deposits/withdrawals go through bridging, not a plain transfer).

- [#19810](https://github.com/LedgerHQ/ledger-live/pull/19810) [`dd105d5`](https://github.com/LedgerHQ/ledger-live/commit/dd105d5f16857576279a176aec1965b6b915b9e4) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Fix mobile Swap Live App balance masking in discreet mode

- [#19895](https://github.com/LedgerHQ/ledger-live/pull/19895) [`31b6b8d`](https://github.com/LedgerHQ/ledger-live/commit/31b6b8d88c39a8ff2f2a4f252450270216e964b3) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Allow Help section descriptions in the new Profile to wrap onto two lines instead of being truncated in longer languages.

- [#19776](https://github.com/LedgerHQ/ledger-live/pull/19776) [`d43ab1d`](https://github.com/LedgerHQ/ledger-live/commit/d43ab1d5dcc111534b1633f4da051787d0ef3d2f) Thanks [@deepyjr](https://github.com/deepyjr)! - Render Contacts search results in Ledger Wallet Mobile.

- [#19681](https://github.com/LedgerHQ/ledger-live/pull/19681) [`762b5eb`](https://github.com/LedgerHQ/ledger-live/commit/762b5ebf332566879a10ab1f16ef85a3da360fe7) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Fix USB transport routing for Device Intent Executor legacy `withDevice` intents.

- [#19939](https://github.com/LedgerHQ/ledger-live/pull/19939) [`edc21b1`](https://github.com/LedgerHQ/ledger-live/commit/edc21b1251b82b03ee777e493b3e21a4e67104f3) Thanks [@deepyjr](https://github.com/deepyjr)! - Center empty placeholders in the Mobile Market screen.

- [#19857](https://github.com/LedgerHQ/ledger-live/pull/19857) [`51775d7`](https://github.com/LedgerHQ/ledger-live/commit/51775d79933c4953ecc4e3bf5c22cb3a0735d357) Thanks [@deepyjr](https://github.com/deepyjr)! - Add the Mobile Contacts name form with keyboard avoidance.

- [#19936](https://github.com/LedgerHQ/ledger-live/pull/19936) [`2b9d248`](https://github.com/LedgerHQ/ledger-live/commit/2b9d248a102962e2deac7b2ed6a99b8013683772) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix: aleo empty accounts handling in mobile

- [#19816](https://github.com/LedgerHQ/ledger-live/pull/19816) [`64ddc3b`](https://github.com/LedgerHQ/ledger-live/commit/64ddc3b0d521383805fa8bbf2a93a216481a6d41) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix: unique account key in aleo add account flow
  fix: missing getParentCurrencyId in quick actions

- [#19811](https://github.com/LedgerHQ/ledger-live/pull/19811) [`d499954`](https://github.com/LedgerHQ/ledger-live/commit/d4999548fc2356741b04a5fcb960735babb76b2b) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - prevent go back from view key approve screen for Aleo

- [#19740](https://github.com/LedgerHQ/ledger-live/pull/19740) [`03dbe82`](https://github.com/LedgerHQ/ledger-live/commit/03dbe82bcaff5b4f0aedac2e6ea3cca767a0e05c) Thanks [@deepyjr](https://github.com/deepyjr)! - Render grouped populated Contacts lists on mobile.

- [#19795](https://github.com/LedgerHQ/ledger-live/pull/19795) [`674f301`](https://github.com/LedgerHQ/ledger-live/commit/674f301451dd1412a09b2a67d58d8678863bb519) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Fix quick amount selector not showing for token transfers

- [#19330](https://github.com/LedgerHQ/ledger-live/pull/19330) [`b85140a`](https://github.com/LedgerHQ/ledger-live/commit/b85140a3a4f84ebc5568994f298df9180e2ce36d) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Add LWM notifications prompt QA debug screen with reprompt tooling

- [#19875](https://github.com/LedgerHQ/ledger-live/pull/19875) [`59a6c82`](https://github.com/LedgerHQ/ledger-live/commit/59a6c82a784b4f484b5fb6a5ea42b6ebb1115818) Thanks [@sarneijim](https://github.com/sarneijim)! - Gate the large-screen upsell modal by the enabled state of the selected opt-in variant

- [#19798](https://github.com/LedgerHQ/ledger-live/pull/19798) [`a55b810`](https://github.com/LedgerHQ/ledger-live/commit/a55b81007d49369f18b7ff15b6579c9a0d5de876) Thanks [@ysitbon](https://github.com/ysitbon)! - Add useCurrencyById and useTokenByAddressInCurrency hooks; repoint mobile from @ledgerhq/cryptoassets to @features/platform-currencies and @domain/entity-currency-crypto

- [#19779](https://github.com/LedgerHQ/ledger-live/pull/19779) [`9c39cc4`](https://github.com/LedgerHQ/ledger-live/commit/9c39cc479c579c13f5bc9221105a75ba384e42ab) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Fix android navigation bar inset on read-only portfolio screen bottom padding

- [#19884](https://github.com/LedgerHQ/ledger-live/pull/19884) [`f9f5db4`](https://github.com/LedgerHQ/ledger-live/commit/f9f5db46534f5294fdbb3fe12a971ed4f11e6c2d) Thanks [@qperrot](https://github.com/qperrot)! - Add data-driven delegation-visibility-delay notice on the EVM staking delegate amount step (Somnia: 5 minutes)

- [#19812](https://github.com/LedgerHQ/ledger-live/pull/19812) [`729a6f8`](https://github.com/LedgerHQ/ledger-live/commit/729a6f8bce7914da53b0f404ddc8904fa4339d9f) Thanks [@deepyjr](https://github.com/deepyjr)! - Keep the Mobile Contacts search input visible while the populated list scrolls.

- [#19899](https://github.com/LedgerHQ/ledger-live/pull/19899) [`c441c90`](https://github.com/LedgerHQ/ledger-live/commit/c441c9002865019c8447fdc6c4caeba379d7a496) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Fix Swap: pressing "<" from the History screen after a multi-step swap now returns to the initial input form instead of the transaction success screen. The webview is remounted when redirecting to History so the success screen is no longer left mounted underneath.

- [#19822](https://github.com/LedgerHQ/ledger-live/pull/19822) [`233a26f`](https://github.com/LedgerHQ/ledger-live/commit/233a26f3a1f885efa3ba248e191ffdbed316bb86) Thanks [@deepyjr](https://github.com/deepyjr)! - Add Contacts sample data controls to Mobile Debug settings.

- [#19847](https://github.com/LedgerHQ/ledger-live/pull/19847) [`6abc9e6`](https://github.com/LedgerHQ/ledger-live/commit/6abc9e6e4e2338a2aa5928fc2c30690eb99e8717) Thanks [@gre-ledger](https://github.com/gre-ledger)! - chore(errors): replace instanceof guards with .name string checks

- [#19900](https://github.com/LedgerHQ/ledger-live/pull/19900) [`a34db0e`](https://github.com/LedgerHQ/ledger-live/commit/a34db0e363551da3842fb3f3fafd35e2495fff06) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Add integration tests for Aleo add account and send flows

- [#19796](https://github.com/LedgerHQ/ledger-live/pull/19796) [`36bbe18`](https://github.com/LedgerHQ/ledger-live/commit/36bbe18500ad6f7aeb74b4a5366994ec7495f761) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Fix custom fees on iOS in the new send flow: accept a comma decimal separator (normalized to a dot so the value is valid and can be confirmed), and dismiss the keyboard by tapping outside the inputs so the Confirm button is reachable

- [#19819](https://github.com/LedgerHQ/ledger-live/pull/19819) [`4151f1d`](https://github.com/LedgerHQ/ledger-live/commit/4151f1d6cbb673e2a82183b904ae0776744f1ef1) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Migrate coin-integration screens to the custom `~/components/SafeAreaView`, which handles the experimental header and avoids double safe-area insets.

- [#19533](https://github.com/LedgerHQ/ledger-live/pull/19533) [`d63b9ef`](https://github.com/LedgerHQ/ledger-live/commit/d63b9efdc035ddc33a11fcc6877cd6b63f22ec3e) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Add a TRON send-flow network-fees explanation on the amount screen. The fee row now shows the cost in both fiat and TRX (e.g. `$4.12 • 0.000056 TRX`, or `$0 • 0 TRX` when staked energy and bandwidth cover the transfer), and an info tooltip (desktop) / drawer (mobile) explains whether resources cover the fee or it is paid by burning TRX. Implemented via two family-agnostic send-descriptor accessors (`getNetworkFeesInfo` for the copy, `showFeeCurrencyAmount` for the fee-row display). Other currencies are unchanged.

### Patch Changes

- Updated dependencies [[`f57602a`](https://github.com/LedgerHQ/ledger-live/commit/f57602a679ed08b437955a2858f84e3086d6e417), [`0ee3ad8`](https://github.com/LedgerHQ/ledger-live/commit/0ee3ad8ef853baa7b17bb4ca07f41f1bed12268e), [`6b6f59e`](https://github.com/LedgerHQ/ledger-live/commit/6b6f59e77df6fc6794c13d12f476733624a53c96), [`a306abb`](https://github.com/LedgerHQ/ledger-live/commit/a306abbb605751b5b8741d8d7d69d2bf7f78a49b), [`a128521`](https://github.com/LedgerHQ/ledger-live/commit/a1285211f0482229e5011505fb9e8c9d473cb86a), [`2388d41`](https://github.com/LedgerHQ/ledger-live/commit/2388d4171bd2e5caa2009e8eadcd06548d2209ef), [`6ed8225`](https://github.com/LedgerHQ/ledger-live/commit/6ed8225f2434f70d587aa046e39262c21b538f27), [`f115fc2`](https://github.com/LedgerHQ/ledger-live/commit/f115fc2cd159bd170bee3b9cdcc3f65f521017db), [`732faa2`](https://github.com/LedgerHQ/ledger-live/commit/732faa27e81899b49a08e6a9c8fe2c8b75ac17ea), [`022f431`](https://github.com/LedgerHQ/ledger-live/commit/022f43122a713f9d4b2e10daaec0d44c91b58c9f), [`ee1f9f3`](https://github.com/LedgerHQ/ledger-live/commit/ee1f9f3ae9f620328a975b7f8ad75a3437f8875b), [`cdf6cf4`](https://github.com/LedgerHQ/ledger-live/commit/cdf6cf40d658b20dd21a7eabe3615c75baf4cb0a), [`d942108`](https://github.com/LedgerHQ/ledger-live/commit/d9421087b45b4a0febaee63b1f1a097c2f42a2a5), [`d7f59ec`](https://github.com/LedgerHQ/ledger-live/commit/d7f59ecfa0e7a549b0206042738244ec89c68b95), [`35e9528`](https://github.com/LedgerHQ/ledger-live/commit/35e952874f86878788d636d7d362d239374738cd), [`22d4a88`](https://github.com/LedgerHQ/ledger-live/commit/22d4a888228b7e5409593a2d6af072b4ab07bb07), [`105ef90`](https://github.com/LedgerHQ/ledger-live/commit/105ef905bdb80022997d86729ccddbc220841bae), [`54f1527`](https://github.com/LedgerHQ/ledger-live/commit/54f152730b059d48ff2b14394b405606e08a886a), [`ea28df4`](https://github.com/LedgerHQ/ledger-live/commit/ea28df4a67e1c1f64ab0de5fddf7fc016edffa8c), [`6935fe0`](https://github.com/LedgerHQ/ledger-live/commit/6935fe04a6304e046fd217350399446194e96d47), [`f8164bd`](https://github.com/LedgerHQ/ledger-live/commit/f8164bdd7fb0dc138c399d424eda1c8c129dd477), [`d43ab1d`](https://github.com/LedgerHQ/ledger-live/commit/d43ab1d5dcc111534b1633f4da051787d0ef3d2f), [`8e21dc0`](https://github.com/LedgerHQ/ledger-live/commit/8e21dc0eee799be29803d63b582da3463f1593b3), [`762b5eb`](https://github.com/LedgerHQ/ledger-live/commit/762b5ebf332566879a10ab1f16ef85a3da360fe7), [`2eac6a1`](https://github.com/LedgerHQ/ledger-live/commit/2eac6a17b629be3f8ba08cdf650413083b89476e), [`e7caf31`](https://github.com/LedgerHQ/ledger-live/commit/e7caf310efbbf82aa777a7e86ceafe60f11e7193), [`ab74170`](https://github.com/LedgerHQ/ledger-live/commit/ab7417038021e37f932bac5551b862dce6a2c39f), [`fd1e33b`](https://github.com/LedgerHQ/ledger-live/commit/fd1e33bb3976c8986e16579a4995c9fcf4dc52aa), [`067b570`](https://github.com/LedgerHQ/ledger-live/commit/067b57005f76858bdaf2699dffde07ada4b5fa86), [`a4b09cf`](https://github.com/LedgerHQ/ledger-live/commit/a4b09cf063a0042a4ba31c350327e8d0ac9aa90c), [`bb2d2d2`](https://github.com/LedgerHQ/ledger-live/commit/bb2d2d250a1d5b8cde43ba963795d28b10b48be6), [`6b75426`](https://github.com/LedgerHQ/ledger-live/commit/6b7542690a99a365c4b80dfd1fe65e2be594494b), [`669a6d4`](https://github.com/LedgerHQ/ledger-live/commit/669a6d42b2178451e27383c746e3f8fd3d34caef), [`03dbe82`](https://github.com/LedgerHQ/ledger-live/commit/03dbe82bcaff5b4f0aedac2e6ea3cca767a0e05c), [`59a6c82`](https://github.com/LedgerHQ/ledger-live/commit/59a6c82a784b4f484b5fb6a5ea42b6ebb1115818), [`c498e25`](https://github.com/LedgerHQ/ledger-live/commit/c498e25ca9f4b6ef5c4e3dfd370dab44ccdebc0f), [`a55b810`](https://github.com/LedgerHQ/ledger-live/commit/a55b81007d49369f18b7ff15b6579c9a0d5de876), [`d50d169`](https://github.com/LedgerHQ/ledger-live/commit/d50d16989e968fbb3ff45f6c463cae886e0e566a), [`f9f5db4`](https://github.com/LedgerHQ/ledger-live/commit/f9f5db46534f5294fdbb3fe12a971ed4f11e6c2d), [`887f8c9`](https://github.com/LedgerHQ/ledger-live/commit/887f8c93e66c2730cbecc1adc09b6a2faa95bba6), [`01a7113`](https://github.com/LedgerHQ/ledger-live/commit/01a71130ab7219637d23222de544e97e668bba47), [`729a6f8`](https://github.com/LedgerHQ/ledger-live/commit/729a6f8bce7914da53b0f404ddc8904fa4339d9f), [`b4ecf97`](https://github.com/LedgerHQ/ledger-live/commit/b4ecf97c0d16a686078c995f7218a256916a9e39), [`b38b0b1`](https://github.com/LedgerHQ/ledger-live/commit/b38b0b13e8e5c01800bf1234c7ee0f454b04f5cc), [`4d99006`](https://github.com/LedgerHQ/ledger-live/commit/4d99006589b6855d1a06a8aa1ece23c3f6f3ddf7), [`132a4f9`](https://github.com/LedgerHQ/ledger-live/commit/132a4f90adc816f69dfbde1b28e120ad501004c5)]:
  - @ledgerhq/live-countervalues@0.23.0
  - @ledgerhq/live-wallet@0.30.0
  - @ledgerhq/wallet-analytics@0.3.0
  - @features/flow-contacts@0.3.0
  - @ledgerhq/coin-evm@4.7.0
  - @ledgerhq/coin-canton@0.30.0
  - @ledgerhq/coin-concordium@0.17.0
  - @ledgerhq/coin-filecoin@1.29.0
  - @ledgerhq/coin-multiversx@0.21.0
  - @ledgerhq/live-dmk-shared@0.29.0
  - @ledgerhq/live-currency-format@0.14.0
  - @ledgerhq/cryptoassets@13.56.0
  - @ledgerhq/types-live@6.116.0
  - @domain/entity-contact@0.3.0
  - @domain/entity-currency-crypto@0.7.0
  - @ledgerhq/live-dmk-mobile@0.29.0
  - @ledgerhq/coin-bitcoin@0.48.0
  - @ledgerhq/live-network@2.7.0
  - @ledgerhq/coin-cosmos@0.40.0
  - @features/platform-currencies@0.4.0
  - @shared/feature-flags@0.15.0
  - @ledgerhq/coin-stacks@0.25.0
  - @ledgerhq/ledger-wallet-framework@2.5.0
  - @ledgerhq/live-countervalues-react@0.16.3
  - @ledgerhq/wallet-pnl@0.7.3
  - @ledgerhq/coin-casper@2.16.1
  - @ledgerhq/domain-service@1.8.11
  - @domain/api-currency-token@0.2.2
  - @ledgerhq/ledger-key-ring-protocol@0.17.1
  - @devtools/bindings@0.2.1
  - @features/platform-feature-flags@0.6.2
  - @devtools/shell@0.5.2

## 4.13.0-next.1

### Minor Changes

- [#19990](https://github.com/LedgerHQ/ledger-live/pull/19990) [`b2fe0f0`](https://github.com/LedgerHQ/ledger-live/commit/b2fe0f0b9bf9cb5976f4d7f21e24654d60acfcf2) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Revert Cardano firmware app v8.0.4 support (hw-app-cardano bump to 8.0.0)

## 4.13.0-next.0

### Minor Changes

- [#19666](https://github.com/LedgerHQ/ledger-live/pull/19666) [`b842501`](https://github.com/LedgerHQ/ledger-live/commit/b8425019b0649ddaf37f875ea78ae9425016c728) Thanks [@deepyjr](https://github.com/deepyjr)! - Add Ledger Sync introduction translations to Mobile Contacts.

- [#19813](https://github.com/LedgerHQ/ledger-live/pull/19813) [`928f6e2`](https://github.com/LedgerHQ/ledger-live/commit/928f6e2745d9713c12a8986d46bb3d7e31b5918a) Thanks [@aussedatlo](https://github.com/aussedatlo)! - bump @ledgerhq/context-module to 2.3.0

- [#19854](https://github.com/LedgerHQ/ledger-live/pull/19854) [`c3c5329`](https://github.com/LedgerHQ/ledger-live/commit/c3c5329ffe69ed47a1f3a8910ae7fd8b53486f24) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(algo): restore Algorand memo in new send flow with protocol 1024-byte note limit

- [#19865](https://github.com/LedgerHQ/ledger-live/pull/19865) [`7708345`](https://github.com/LedgerHQ/ledger-live/commit/77083455c985349f5a2061db4c22b2fa8ce758f9) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Remove partial app preparation from Device Intent Executor flows

- [#19794](https://github.com/LedgerHQ/ledger-live/pull/19794) [`2388d41`](https://github.com/LedgerHQ/ledger-live/commit/2388d4171bd2e5caa2009e8eadcd06548d2209ef) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Handle non-onboarded devices according to the requirements of each Connect App flow

- [#19820](https://github.com/LedgerHQ/ledger-live/pull/19820) [`6bd9b00`](https://github.com/LedgerHQ/ledger-live/commit/6bd9b00cf4f87b520d4c1f70f5b9f3de95392a36) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Fix device selection drawer layout and scrolling for long device lists

- [#19755](https://github.com/LedgerHQ/ledger-live/pull/19755) [`5945c33`](https://github.com/LedgerHQ/ledger-live/commit/5945c3311ad3ae9584d6cafa65007b3be16face6) Thanks [@LucasWerey](https://github.com/LucasWerey)! - remove lumen debug and visualization debug tools

- [#19625](https://github.com/LedgerHQ/ledger-live/pull/19625) [`28c29a1`](https://github.com/LedgerHQ/ledger-live/commit/28c29a1e6f4c28edfeba59483876b130a6e6b97c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove findCryptoCurrencyByTicker re-lookups in market counter-value formatting and detection paths

- [#19765](https://github.com/LedgerHQ/ledger-live/pull/19765) [`2818fc1`](https://github.com/LedgerHQ/ledger-live/commit/2818fc1a7603f295154053b3a62f19ae81fdccac) Thanks [@LucasWerey](https://github.com/LucasWerey)! - fix: remove SafeAreaInsetsContext.Provider global override, replace with useAdjustedSafeAreaInsets hook

- [#19883](https://github.com/LedgerHQ/ledger-live/pull/19883) [`2884af7`](https://github.com/LedgerHQ/ledger-live/commit/2884af77f887912ceb9f6686f2718cc71c148756) Thanks [@deepyjr](https://github.com/deepyjr)! - Render validation errors in the add contact form.

- [#19742](https://github.com/LedgerHQ/ledger-live/pull/19742) [`022f431`](https://github.com/LedgerHQ/ledger-live/commit/022f43122a713f9d4b2e10daaec0d44c91b58c9f) Thanks [@deepyjr](https://github.com/deepyjr)! - Add Ledger Sync checking and introduction presentation variants to Mobile Contacts.

- [#19905](https://github.com/LedgerHQ/ledger-live/pull/19905) [`ae9897a`](https://github.com/LedgerHQ/ledger-live/commit/ae9897ad91b89bed89be1d51d73ec5666d337d19) Thanks [@koda-apps](https://github.com/apps/koda-apps)! - fix(send): hide balance in send modal header when discreet mode is enabled

- [#19778](https://github.com/LedgerHQ/ledger-live/pull/19778) [`f6e5b74`](https://github.com/LedgerHQ/ledger-live/commit/f6e5b7453015db453e604052b115dd9996f266fa) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(lwdm): fix wrong memo label i18n id

- [#19809](https://github.com/LedgerHQ/ledger-live/pull/19809) [`26db6f1`](https://github.com/LedgerHQ/ledger-live/commit/26db6f111d86e861c8509249c4b40b765ac567c3) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - updated bottom spacing for summary step

- [#19838](https://github.com/LedgerHQ/ledger-live/pull/19838) [`82f1850`](https://github.com/LedgerHQ/ledger-live/commit/82f1850f5086e549e17f1218d7e21dbf16041ea7) Thanks [@sarneijim](https://github.com/sarneijim)! - Update large-screen upsell modal hero images for light and dark themes.

- [#19890](https://github.com/LedgerHQ/ledger-live/pull/19890) [`6d2a928`](https://github.com/LedgerHQ/ledger-live/commit/6d2a928e42ea64cdb14a2d860f4b0019180c594a) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix: show all digits in aleo send flow

- [#19702](https://github.com/LedgerHQ/ledger-live/pull/19702) [`6935fe0`](https://github.com/LedgerHQ/ledger-live/commit/6935fe04a6304e046fd217350399446194e96d47) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Add HyperCore support by plugging `@ledgerhq/coin-hypercore` into the generic coin framework: register the `hypercore` native currency (USDC, magnitude 6), route the family through the generic bridge, reuse the EVM signer for address derivation (HyperCore shares the Ethereum address), and add the `currencyHypercore` feature flag. HyperCore accounts can be discovered and serve their balance and operations from the coin module. In the history, HyperCore operations are labelled "Deposit"/"Withdraw" instead of "Received"/"Sent" (deposits/withdrawals go through bridging, not a plain transfer).

- [#19810](https://github.com/LedgerHQ/ledger-live/pull/19810) [`dd105d5`](https://github.com/LedgerHQ/ledger-live/commit/dd105d5f16857576279a176aec1965b6b915b9e4) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Fix mobile Swap Live App balance masking in discreet mode

- [#19895](https://github.com/LedgerHQ/ledger-live/pull/19895) [`31b6b8d`](https://github.com/LedgerHQ/ledger-live/commit/31b6b8d88c39a8ff2f2a4f252450270216e964b3) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Allow Help section descriptions in the new Profile to wrap onto two lines instead of being truncated in longer languages.

- [#19776](https://github.com/LedgerHQ/ledger-live/pull/19776) [`d43ab1d`](https://github.com/LedgerHQ/ledger-live/commit/d43ab1d5dcc111534b1633f4da051787d0ef3d2f) Thanks [@deepyjr](https://github.com/deepyjr)! - Render Contacts search results in Ledger Wallet Mobile.

- [#19681](https://github.com/LedgerHQ/ledger-live/pull/19681) [`762b5eb`](https://github.com/LedgerHQ/ledger-live/commit/762b5ebf332566879a10ab1f16ef85a3da360fe7) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Fix USB transport routing for Device Intent Executor legacy `withDevice` intents.

- [#19939](https://github.com/LedgerHQ/ledger-live/pull/19939) [`edc21b1`](https://github.com/LedgerHQ/ledger-live/commit/edc21b1251b82b03ee777e493b3e21a4e67104f3) Thanks [@deepyjr](https://github.com/deepyjr)! - Center empty placeholders in the Mobile Market screen.

- [#19857](https://github.com/LedgerHQ/ledger-live/pull/19857) [`51775d7`](https://github.com/LedgerHQ/ledger-live/commit/51775d79933c4953ecc4e3bf5c22cb3a0735d357) Thanks [@deepyjr](https://github.com/deepyjr)! - Add the Mobile Contacts name form with keyboard avoidance.

- [#19936](https://github.com/LedgerHQ/ledger-live/pull/19936) [`2b9d248`](https://github.com/LedgerHQ/ledger-live/commit/2b9d248a102962e2deac7b2ed6a99b8013683772) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix: aleo empty accounts handling in mobile

- [#19816](https://github.com/LedgerHQ/ledger-live/pull/19816) [`64ddc3b`](https://github.com/LedgerHQ/ledger-live/commit/64ddc3b0d521383805fa8bbf2a93a216481a6d41) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix: unique account key in aleo add account flow
  fix: missing getParentCurrencyId in quick actions

- [#19811](https://github.com/LedgerHQ/ledger-live/pull/19811) [`d499954`](https://github.com/LedgerHQ/ledger-live/commit/d4999548fc2356741b04a5fcb960735babb76b2b) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - prevent go back from view key approve screen for Aleo

- [#19740](https://github.com/LedgerHQ/ledger-live/pull/19740) [`03dbe82`](https://github.com/LedgerHQ/ledger-live/commit/03dbe82bcaff5b4f0aedac2e6ea3cca767a0e05c) Thanks [@deepyjr](https://github.com/deepyjr)! - Render grouped populated Contacts lists on mobile.

- [#19795](https://github.com/LedgerHQ/ledger-live/pull/19795) [`674f301`](https://github.com/LedgerHQ/ledger-live/commit/674f301451dd1412a09b2a67d58d8678863bb519) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Fix quick amount selector not showing for token transfers

- [#19330](https://github.com/LedgerHQ/ledger-live/pull/19330) [`b85140a`](https://github.com/LedgerHQ/ledger-live/commit/b85140a3a4f84ebc5568994f298df9180e2ce36d) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Add LWM notifications prompt QA debug screen with reprompt tooling

- [#19875](https://github.com/LedgerHQ/ledger-live/pull/19875) [`59a6c82`](https://github.com/LedgerHQ/ledger-live/commit/59a6c82a784b4f484b5fb6a5ea42b6ebb1115818) Thanks [@sarneijim](https://github.com/sarneijim)! - Gate the large-screen upsell modal by the enabled state of the selected opt-in variant

- [#19798](https://github.com/LedgerHQ/ledger-live/pull/19798) [`a55b810`](https://github.com/LedgerHQ/ledger-live/commit/a55b81007d49369f18b7ff15b6579c9a0d5de876) Thanks [@ysitbon](https://github.com/ysitbon)! - Add useCurrencyById and useTokenByAddressInCurrency hooks; repoint mobile from @ledgerhq/cryptoassets to @features/platform-currencies and @domain/entity-currency-crypto

- [#19779](https://github.com/LedgerHQ/ledger-live/pull/19779) [`9c39cc4`](https://github.com/LedgerHQ/ledger-live/commit/9c39cc479c579c13f5bc9221105a75ba384e42ab) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Fix android navigation bar inset on read-only portfolio screen bottom padding

- [#19884](https://github.com/LedgerHQ/ledger-live/pull/19884) [`f9f5db4`](https://github.com/LedgerHQ/ledger-live/commit/f9f5db46534f5294fdbb3fe12a971ed4f11e6c2d) Thanks [@qperrot](https://github.com/qperrot)! - Add data-driven delegation-visibility-delay notice on the EVM staking delegate amount step (Somnia: 5 minutes)

- [#19812](https://github.com/LedgerHQ/ledger-live/pull/19812) [`729a6f8`](https://github.com/LedgerHQ/ledger-live/commit/729a6f8bce7914da53b0f404ddc8904fa4339d9f) Thanks [@deepyjr](https://github.com/deepyjr)! - Keep the Mobile Contacts search input visible while the populated list scrolls.

- [#19899](https://github.com/LedgerHQ/ledger-live/pull/19899) [`c441c90`](https://github.com/LedgerHQ/ledger-live/commit/c441c9002865019c8447fdc6c4caeba379d7a496) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Fix Swap: pressing "<" from the History screen after a multi-step swap now returns to the initial input form instead of the transaction success screen. The webview is remounted when redirecting to History so the success screen is no longer left mounted underneath.

- [#19822](https://github.com/LedgerHQ/ledger-live/pull/19822) [`233a26f`](https://github.com/LedgerHQ/ledger-live/commit/233a26f3a1f885efa3ba248e191ffdbed316bb86) Thanks [@deepyjr](https://github.com/deepyjr)! - Add Contacts sample data controls to Mobile Debug settings.

- [#19847](https://github.com/LedgerHQ/ledger-live/pull/19847) [`6abc9e6`](https://github.com/LedgerHQ/ledger-live/commit/6abc9e6e4e2338a2aa5928fc2c30690eb99e8717) Thanks [@gre-ledger](https://github.com/gre-ledger)! - chore(errors): replace instanceof guards with .name string checks

- [#19900](https://github.com/LedgerHQ/ledger-live/pull/19900) [`a34db0e`](https://github.com/LedgerHQ/ledger-live/commit/a34db0e363551da3842fb3f3fafd35e2495fff06) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Add integration tests for Aleo add account and send flows

- [#19796](https://github.com/LedgerHQ/ledger-live/pull/19796) [`36bbe18`](https://github.com/LedgerHQ/ledger-live/commit/36bbe18500ad6f7aeb74b4a5366994ec7495f761) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Fix custom fees on iOS in the new send flow: accept a comma decimal separator (normalized to a dot so the value is valid and can be confirmed), and dismiss the keyboard by tapping outside the inputs so the Confirm button is reachable

- [#19819](https://github.com/LedgerHQ/ledger-live/pull/19819) [`4151f1d`](https://github.com/LedgerHQ/ledger-live/commit/4151f1d6cbb673e2a82183b904ae0776744f1ef1) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Migrate coin-integration screens to the custom `~/components/SafeAreaView`, which handles the experimental header and avoids double safe-area insets.

- [#19533](https://github.com/LedgerHQ/ledger-live/pull/19533) [`d63b9ef`](https://github.com/LedgerHQ/ledger-live/commit/d63b9efdc035ddc33a11fcc6877cd6b63f22ec3e) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Add a TRON send-flow network-fees explanation on the amount screen. The fee row now shows the cost in both fiat and TRX (e.g. `$4.12 • 0.000056 TRX`, or `$0 • 0 TRX` when staked energy and bandwidth cover the transfer), and an info tooltip (desktop) / drawer (mobile) explains whether resources cover the fee or it is paid by burning TRX. Implemented via two family-agnostic send-descriptor accessors (`getNetworkFeesInfo` for the copy, `showFeeCurrencyAmount` for the fee-row display). Other currencies are unchanged.

### Patch Changes

- Updated dependencies [[`f57602a`](https://github.com/LedgerHQ/ledger-live/commit/f57602a679ed08b437955a2858f84e3086d6e417), [`0ee3ad8`](https://github.com/LedgerHQ/ledger-live/commit/0ee3ad8ef853baa7b17bb4ca07f41f1bed12268e), [`6b6f59e`](https://github.com/LedgerHQ/ledger-live/commit/6b6f59e77df6fc6794c13d12f476733624a53c96), [`a306abb`](https://github.com/LedgerHQ/ledger-live/commit/a306abbb605751b5b8741d8d7d69d2bf7f78a49b), [`a128521`](https://github.com/LedgerHQ/ledger-live/commit/a1285211f0482229e5011505fb9e8c9d473cb86a), [`2388d41`](https://github.com/LedgerHQ/ledger-live/commit/2388d4171bd2e5caa2009e8eadcd06548d2209ef), [`6ed8225`](https://github.com/LedgerHQ/ledger-live/commit/6ed8225f2434f70d587aa046e39262c21b538f27), [`f115fc2`](https://github.com/LedgerHQ/ledger-live/commit/f115fc2cd159bd170bee3b9cdcc3f65f521017db), [`732faa2`](https://github.com/LedgerHQ/ledger-live/commit/732faa27e81899b49a08e6a9c8fe2c8b75ac17ea), [`022f431`](https://github.com/LedgerHQ/ledger-live/commit/022f43122a713f9d4b2e10daaec0d44c91b58c9f), [`ee1f9f3`](https://github.com/LedgerHQ/ledger-live/commit/ee1f9f3ae9f620328a975b7f8ad75a3437f8875b), [`cdf6cf4`](https://github.com/LedgerHQ/ledger-live/commit/cdf6cf40d658b20dd21a7eabe3615c75baf4cb0a), [`d942108`](https://github.com/LedgerHQ/ledger-live/commit/d9421087b45b4a0febaee63b1f1a097c2f42a2a5), [`d7f59ec`](https://github.com/LedgerHQ/ledger-live/commit/d7f59ecfa0e7a549b0206042738244ec89c68b95), [`35e9528`](https://github.com/LedgerHQ/ledger-live/commit/35e952874f86878788d636d7d362d239374738cd), [`22d4a88`](https://github.com/LedgerHQ/ledger-live/commit/22d4a888228b7e5409593a2d6af072b4ab07bb07), [`105ef90`](https://github.com/LedgerHQ/ledger-live/commit/105ef905bdb80022997d86729ccddbc220841bae), [`54f1527`](https://github.com/LedgerHQ/ledger-live/commit/54f152730b059d48ff2b14394b405606e08a886a), [`ea28df4`](https://github.com/LedgerHQ/ledger-live/commit/ea28df4a67e1c1f64ab0de5fddf7fc016edffa8c), [`6935fe0`](https://github.com/LedgerHQ/ledger-live/commit/6935fe04a6304e046fd217350399446194e96d47), [`f8164bd`](https://github.com/LedgerHQ/ledger-live/commit/f8164bdd7fb0dc138c399d424eda1c8c129dd477), [`d43ab1d`](https://github.com/LedgerHQ/ledger-live/commit/d43ab1d5dcc111534b1633f4da051787d0ef3d2f), [`8e21dc0`](https://github.com/LedgerHQ/ledger-live/commit/8e21dc0eee799be29803d63b582da3463f1593b3), [`762b5eb`](https://github.com/LedgerHQ/ledger-live/commit/762b5ebf332566879a10ab1f16ef85a3da360fe7), [`2eac6a1`](https://github.com/LedgerHQ/ledger-live/commit/2eac6a17b629be3f8ba08cdf650413083b89476e), [`e7caf31`](https://github.com/LedgerHQ/ledger-live/commit/e7caf310efbbf82aa777a7e86ceafe60f11e7193), [`ab74170`](https://github.com/LedgerHQ/ledger-live/commit/ab7417038021e37f932bac5551b862dce6a2c39f), [`fd1e33b`](https://github.com/LedgerHQ/ledger-live/commit/fd1e33bb3976c8986e16579a4995c9fcf4dc52aa), [`067b570`](https://github.com/LedgerHQ/ledger-live/commit/067b57005f76858bdaf2699dffde07ada4b5fa86), [`a4b09cf`](https://github.com/LedgerHQ/ledger-live/commit/a4b09cf063a0042a4ba31c350327e8d0ac9aa90c), [`bb2d2d2`](https://github.com/LedgerHQ/ledger-live/commit/bb2d2d250a1d5b8cde43ba963795d28b10b48be6), [`6b75426`](https://github.com/LedgerHQ/ledger-live/commit/6b7542690a99a365c4b80dfd1fe65e2be594494b), [`669a6d4`](https://github.com/LedgerHQ/ledger-live/commit/669a6d42b2178451e27383c746e3f8fd3d34caef), [`03dbe82`](https://github.com/LedgerHQ/ledger-live/commit/03dbe82bcaff5b4f0aedac2e6ea3cca767a0e05c), [`59a6c82`](https://github.com/LedgerHQ/ledger-live/commit/59a6c82a784b4f484b5fb6a5ea42b6ebb1115818), [`c498e25`](https://github.com/LedgerHQ/ledger-live/commit/c498e25ca9f4b6ef5c4e3dfd370dab44ccdebc0f), [`a55b810`](https://github.com/LedgerHQ/ledger-live/commit/a55b81007d49369f18b7ff15b6579c9a0d5de876), [`d50d169`](https://github.com/LedgerHQ/ledger-live/commit/d50d16989e968fbb3ff45f6c463cae886e0e566a), [`f9f5db4`](https://github.com/LedgerHQ/ledger-live/commit/f9f5db46534f5294fdbb3fe12a971ed4f11e6c2d), [`887f8c9`](https://github.com/LedgerHQ/ledger-live/commit/887f8c93e66c2730cbecc1adc09b6a2faa95bba6), [`01a7113`](https://github.com/LedgerHQ/ledger-live/commit/01a71130ab7219637d23222de544e97e668bba47), [`729a6f8`](https://github.com/LedgerHQ/ledger-live/commit/729a6f8bce7914da53b0f404ddc8904fa4339d9f), [`b4ecf97`](https://github.com/LedgerHQ/ledger-live/commit/b4ecf97c0d16a686078c995f7218a256916a9e39), [`b38b0b1`](https://github.com/LedgerHQ/ledger-live/commit/b38b0b13e8e5c01800bf1234c7ee0f454b04f5cc), [`4d99006`](https://github.com/LedgerHQ/ledger-live/commit/4d99006589b6855d1a06a8aa1ece23c3f6f3ddf7), [`132a4f9`](https://github.com/LedgerHQ/ledger-live/commit/132a4f90adc816f69dfbde1b28e120ad501004c5)]:
  - @ledgerhq/live-countervalues@0.23.0-next.0
  - @ledgerhq/live-wallet@0.30.0-next.0
  - @ledgerhq/wallet-analytics@0.3.0-next.0
  - @features/flow-contacts@0.3.0-next.0
  - @ledgerhq/coin-evm@4.7.0-next.0
  - @ledgerhq/coin-canton@0.30.0-next.0
  - @ledgerhq/coin-concordium@0.17.0-next.0
  - @ledgerhq/coin-filecoin@1.29.0-next.0
  - @ledgerhq/coin-multiversx@0.21.0-next.0
  - @ledgerhq/live-dmk-shared@0.29.0-next.0
  - @ledgerhq/live-currency-format@0.14.0-next.0
  - @ledgerhq/cryptoassets@13.56.0-next.0
  - @ledgerhq/types-live@6.116.0-next.0
  - @domain/entity-contact@0.3.0-next.0
  - @domain/entity-currency-crypto@0.7.0-next.0
  - @ledgerhq/live-dmk-mobile@0.29.0-next.0
  - @ledgerhq/coin-bitcoin@0.48.0-next.0
  - @ledgerhq/live-network@2.7.0-next.0
  - @ledgerhq/coin-cosmos@0.40.0-next.0
  - @features/platform-currencies@0.4.0-next.0
  - @shared/feature-flags@0.15.0-next.0
  - @ledgerhq/coin-stacks@0.25.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.5.0-next.0
  - @ledgerhq/live-countervalues-react@0.16.3-next.0
  - @ledgerhq/wallet-pnl@0.7.3-next.0
  - @ledgerhq/coin-casper@2.16.1-next.0
  - @ledgerhq/domain-service@1.8.11-next.0
  - @domain/api-currency-token@0.2.2-next.0
  - @ledgerhq/ledger-key-ring-protocol@0.17.1-next.0
  - @devtools/bindings@0.2.1-next.0
  - @features/platform-feature-flags@0.6.2-next.0
  - @devtools/shell@0.5.2-next.0

## 4.12.0

### Minor Changes

- [#19309](https://github.com/LedgerHQ/ledger-live/pull/19309) [`27da624`](https://github.com/LedgerHQ/ledger-live/commit/27da6249452d911a9666d60b4a04a4ff4d9735d6) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - Private sync flow for Aleo (mobile)

- [#19411](https://github.com/LedgerHQ/ledger-live/pull/19411) [`ca37cfe`](https://github.com/LedgerHQ/ledger-live/commit/ca37cfe7f451b88ebd76a9da7af70fcc6577cc53) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(algorand): not opt in asa error message

- [#19393](https://github.com/LedgerHQ/ledger-live/pull/19393) [`4a9eade`](https://github.com/LedgerHQ/ledger-live/commit/4a9eade8c74c948acab3955eca83c734d13776a1) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - test: e2e test aleo add account flow on mobile

- [#19373](https://github.com/LedgerHQ/ledger-live/pull/19373) [`1f34a90`](https://github.com/LedgerHQ/ledger-live/commit/1f34a9055ccaea91ee2ab98a7b10ef1afc968e85) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Fix GAM CTA visibility and empty-link click behavior on desktop and mobile

- [#19396](https://github.com/LedgerHQ/ledger-live/pull/19396) [`25fd71b`](https://github.com/LedgerHQ/ledger-live/commit/25fd71b4caaa8781101dad205669773b234d86c0) Thanks [@amaslakov](https://github.com/amaslakov)! - Hide the "Compound" claim-rewards option for Cosmos-family chains that use epoching (wrapped) staking messages, such as Babylon. Compound restaking is not supported on those chains yet — its embedded delegate is not epoching-wrapped — so only "Cash in" (claim rewards) is offered, preventing the "claimRewardCompound is not supported" error.

- [#19319](https://github.com/LedgerHQ/ledger-live/pull/19319) [`484b715`](https://github.com/LedgerHQ/ledger-live/commit/484b71559719873025197c7289ab422d1bcd8af0) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Fix market category resetting to entry value when navigating back from asset detail

- [#19674](https://github.com/LedgerHQ/ledger-live/pull/19674) [`12614f3`](https://github.com/LedgerHQ/ledger-live/commit/12614f3dcb7215af667a337815f58279a0c88f7b) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Fix extra spacing between experimental header and wallet 4.0 top bar

- [#19628](https://github.com/LedgerHQ/ledger-live/pull/19628) [`8df21c9`](https://github.com/LedgerHQ/ledger-live/commit/8df21c94922550dd6dfe5448afa79b32cfa94a92) Thanks [@qperrot](https://github.com/qperrot)! - Fix coin control not showing selected coins after entering an amount, and refine the coin control screen layout (subheader sizing, header spacing, and scrollbar gutter)

- [#19469](https://github.com/LedgerHQ/ledger-live/pull/19469) [`a8a1e70`](https://github.com/LedgerHQ/ledger-live/commit/a8a1e7088dc97e7e7b41fbe26d1d850d3d9af080) Thanks [@deepyjr](https://github.com/deepyjr)! - Fix Contacts entry config test expectations

- [#19252](https://github.com/LedgerHQ/ledger-live/pull/19252) [`c75213b`](https://github.com/LedgerHQ/ledger-live/commit/c75213b0c649cc0acfdbabacd62e07848ccee842) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwm): switch to deviceaction instead of die with FF on new send flow

- [#19525](https://github.com/LedgerHQ/ledger-live/pull/19525) [`859b960`](https://github.com/LedgerHQ/ledger-live/commit/859b9603f5a213d6b7a30e0a32790ecb9636ad9b) Thanks [@sarneijim](https://github.com/sarneijim)! - Add large screen upsell modal analytics tracking

- [#19548](https://github.com/LedgerHQ/ledger-live/pull/19548) [`3934168`](https://github.com/LedgerHQ/ledger-live/commit/3934168232c3e6e27e58a928a992391d1e5fb7bd) Thanks [@deepyjr](https://github.com/deepyjr)! - Fix asset favourites to preserve canonical Market identifiers and migrate DAI V2 favourites.

- [#19279](https://github.com/LedgerHQ/ledger-live/pull/19279) [`2c28696`](https://github.com/LedgerHQ/ledger-live/commit/2c2869679a266a0a330547db0dfb6a13d11b19aa) Thanks [@deepyjr](https://github.com/deepyjr)! - Fix the dust filter option copy and wrapping on mobile transaction history, and share the dust threshold formatter across apps.

- [#19568](https://github.com/LedgerHQ/ledger-live/pull/19568) [`45584e4`](https://github.com/LedgerHQ/ledger-live/commit/45584e4b87ad8ffea9a0e6ba48e196d14164c84a) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Show an estimated label for configured providers on completed mobile swaps.

- [#19672](https://github.com/LedgerHQ/ledger-live/pull/19672) [`d7ce552`](https://github.com/LedgerHQ/ledger-live/commit/d7ce5521ad9fa82427ef0f9996c1c657c0709e7a) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix mobile Jest resolution for @features/flow-contacts via a logic-only `jest.native.ts` stub, Lumen RN source mappings, and updated integration testing docs.

- [#19217](https://github.com/LedgerHQ/ledger-live/pull/19217) [`e26e68e`](https://github.com/LedgerHQ/ledger-live/commit/e26e68e854ecea6ebbe5e26196c8d8e899329c7d) Thanks [@qperrot](https://github.com/qperrot)! - families/bitcoin/bridgeExtensions.ts now implements the full edit-transaction contract: getEditTransactionPatch, getEditTransactionStatus, getFormattedFeeFields, hasMinimumFundsToCancel, hasMinimumFundsToSpeedUp, isStrategyDisabled, isTransactionConfirmed.
  The Bitcoin edit-transaction helpers (RBF replace/cancel, fee formatting, strategy validation) live under ledger-live-common/src/families/bitcoin/editTransaction/, with unit tests.
  Desktop & mobile Bitcoin edit flows (Body.tsx, StepFees, StepMethod, MethodSelection, EditTransactionSummary) reach these helpers through getAccountBridge(account) instead of importing them directly.

  hasMinimumFundsToCancel / hasMinimumFundsToSpeedUp now return Promise<boolean>. Bitcoin's minimum-funds checks are inherently async (RBF fee lookup) and all call sites already await them; EVM's implementations were updated accordingly.

  Bitcoin's isStrategyDisabled uses a slightly different shape than the generic contract, adapted via a thin wrapper (same pattern as EVM): it maps the contract's feeData to Bitcoin's feesStrategy, and its transaction param was widened to accept the real (nullable) feePerByte with a guard. isTransactionConfirmed follows the { account, hash } contract signature directly.

- [#19614](https://github.com/LedgerHQ/ledger-live/pull/19614) [`8998c72`](https://github.com/LedgerHQ/ledger-live/commit/8998c720d2a3e525430be9a41761c06f446a21ad) Thanks [@jeportie](https://github.com/jeportie)! - Expose the swap transaction-details provider link URL via test/accessibility attributes so E2E can conditionally verify the provider link only when a provider URL exists (QAA-721)

- [#19549](https://github.com/LedgerHQ/ledger-live/pull/19549) [`195c4e2`](https://github.com/LedgerHQ/ledger-live/commit/195c4e25777f61652cbad9bfb6ff9a9d8a908419) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - feat(LLM): add large-screen upsell debug tool

- [#19621](https://github.com/LedgerHQ/ledger-live/pull/19621) [`bc0573e`](https://github.com/LedgerHQ/ledger-live/commit/bc0573e3bf73e47ad4f8a58e228a3e11e0866e6e) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Fix EVM staking operation history showing the user's own address instead of the staking contract as recipient

- [#19264](https://github.com/LedgerHQ/ledger-live/pull/19264) [`821c926`](https://github.com/LedgerHQ/ledger-live/commit/821c926b465d641d0e0c6ea470596fe0ff5bcc1c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - test(mobile): remove mocked Detox e2e suite

- [#19572](https://github.com/LedgerHQ/ledger-live/pull/19572) [`1513e87`](https://github.com/LedgerHQ/ledger-live/commit/1513e8791af483a9a60c29f75625c724dd146b59) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Refine coin control screen UI: set the header title to "Coin control" and force its balance to crypto, move strategy/amount labels into their components, add info icon on "Coin to send", disable coin selection when no amount is entered, and fix the custom fees selection failing silently from the coin control screen

- [#19362](https://github.com/LedgerHQ/ledger-live/pull/19362) [`5b3187a`](https://github.com/LedgerHQ/ledger-live/commit/5b3187aeed7d6cf78d5c8c51c353ec729c6c938a) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - feat(lwm): upsell eligibility gate (audience + cooldown)

- [#19532](https://github.com/LedgerHQ/ledger-live/pull/19532) [`12cdc19`](https://github.com/LedgerHQ/ledger-live/commit/12cdc1957db5c47663a3a1cec15b9d80c2875de5) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: aleo tokens support in mobile send flows

- [#19519](https://github.com/LedgerHQ/ledger-live/pull/19519) [`63792ba`](https://github.com/LedgerHQ/ledger-live/commit/63792bae54e2ff58dc39df157385f7206cdd6be5) Thanks [@cfloume](https://github.com/cfloume)! - fix: prevent Q2 tour from showing to users who haven't onboarded

- [#19220](https://github.com/LedgerHQ/ledger-live/pull/19220) [`996c76b`](https://github.com/LedgerHQ/ledger-live/commit/996c76b157553c547f83d877d25199b311ee0f63) Thanks [@ysitbon](https://github.com/ysitbon)! - Make the `@ledgerhq/cryptoassets` fiat registry injectable (`setFiatCurrenciesStore`) and inject the `@domain/entity-currency-fiat` registry at each app's bootstrap, so the domain registry is the single runtime source of truth for fiat currency data. The bundled fiat list stays as the fallback and is kept in sync by the existing parity test.

- [#19331](https://github.com/LedgerHQ/ledger-live/pull/19331) [`71884d7`](https://github.com/LedgerHQ/ledger-live/commit/71884d759a86bc36ce3f6776ed1c59a2b984343b) Thanks [@ysitbon](https://github.com/ysitbon)! - Activate the RTK Query supported-fiats flow and retire the legacy CVS polling path: boot-time query populates the Redux slice; settings and countervalue selectors read from the slice synchronously.

- [#19553](https://github.com/LedgerHQ/ledger-live/pull/19553) [`68dffc1`](https://github.com/LedgerHQ/ledger-live/commit/68dffc18a73915e67739b9206112233574358304) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - Aleo UI changes for mobile

- [#19486](https://github.com/LedgerHQ/ledger-live/pull/19486) [`b3557c0`](https://github.com/LedgerHQ/ledger-live/commit/b3557c0c7c2b1388f5e0a7270ee4847b1cf53ff6) Thanks [@deepyjr](https://github.com/deepyjr)! - Filter incoming and outgoing dust transactions in history.

- [#18924](https://github.com/LedgerHQ/ledger-live/pull/18924) [`b2f4ae6`](https://github.com/LedgerHQ/ledger-live/commit/b2f4ae6f1c73971b6158e98a7cc8411e9c0a9f56) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Fix the endless loading state when navigating back from the Swap success screen. React Navigation v7 pushed a new SwapPendingOperation on top of SwapLoading instead of reusing the existing one, leaving SwapLoading beneath the success screen. Any back gesture — Android system back, iOS swipe-back, or the close (X) button — would pop to SwapLoading and get stuck. The fix replaces the SwapSubScreensNavigator via BaseNavigator so the success screen always starts with a clean [SwapPendingOperation] stack, making all back paths (back button, close button, and via Swap history) return correctly to the Swap input.

- [#19414](https://github.com/LedgerHQ/ledger-live/pull/19414) [`05a5f76`](https://github.com/LedgerHQ/ledger-live/commit/05a5f76f645be0eb775dc50e4a2669e6bb6b4005) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Stabilize large screen upsell eligibility integration test.

- [#19419](https://github.com/LedgerHQ/ledger-live/pull/19419) [`0040b67`](https://github.com/LedgerHQ/ledger-live/commit/0040b67ca4d65ebf2fede15f625e5958f507d879) Thanks [@deepyjr](https://github.com/deepyjr)! - Filter incoming native dust transactions in operation histories.

- [#19536](https://github.com/LedgerHQ/ledger-live/pull/19536) [`f854c29`](https://github.com/LedgerHQ/ledger-live/commit/f854c29bf164948ff2a38c01a1dc88e8fb297bc1) Thanks [@amaslakov](https://github.com/amaslakov)! - Warn and explain when Tezos staking is blocked by an unfinalizable unstake to another validator: translate the raw fee-estimation error into a clear message, and show an inline warning on the change-validator summary while a pending unstake is still unfinalizable

- [#18901](https://github.com/LedgerHQ/ledger-live/pull/18901) [`78efe69`](https://github.com/LedgerHQ/ledger-live/commit/78efe6957a6e941063c8b83c2fe76a26bbdc0191) Thanks [@amaslakov](https://github.com/amaslakov)! - Add test ids to the Tezos staking-section rows (staked and unstaking) so e2e can target them distinctly from the delegation card

- [#19589](https://github.com/LedgerHQ/ledger-live/pull/19589) [`9479c28`](https://github.com/LedgerHQ/ledger-live/commit/9479c284321915f7d5139746f3f924b1ad2685c3) Thanks [@sarneijim](https://github.com/sarneijim)! - Keep large-screen upsell eligibility read-only and align the fallback CTA link

- [#19452](https://github.com/LedgerHQ/ledger-live/pull/19452) [`5fb2345`](https://github.com/LedgerHQ/ledger-live/commit/5fb2345f166f429def3f58ba6bb73b81036a9a58) Thanks [@LucasWerey](https://github.com/LucasWerey)! - fix multi-network asset countervalues and Asset Detail CTA placement

- [#19199](https://github.com/LedgerHQ/ledger-live/pull/19199) [`446e2b8`](https://github.com/LedgerHQ/ledger-live/commit/446e2b80847623efba039a44eb8dea1b6f395c69) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Persist the large-screen upsell modal's frequency state (`retries`, `lastSeenAt`) across app restarts on mobile, via a new shared `@ledgerhq/live-engagement` Redux slice

- [#19718](https://github.com/LedgerHQ/ledger-live/pull/19718) [`b5540fb`](https://github.com/LedgerHQ/ledger-live/commit/b5540fb844df1779c8583190a11c42ab5bf6c57b) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Fix Aleo mobile send summary to reuse shared UI components and show the Records used / Signing time rows for private transactions

- [#19228](https://github.com/LedgerHQ/ledger-live/pull/19228) [`3fc5836`](https://github.com/LedgerHQ/ledger-live/commit/3fc583609116bcf40956ccafeaadc733e11040b0) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Fix Tezos `account.getPublicKey` (Wallet API): resolve the account public key from `xpub` instead of `seedIdentifier`, which is derived from a different path (`44'/1729'/0'`) and returned the same wrong address for every Tezos account. When `xpub` does not contain a valid base58 Tezos public key (edpk/sppk/p2pk), the request is rejected with a dedicated `AccountPublicKeyUnavailable` error and Ledger Live surfaces it natively (error modal on desktop, bottom modal on mobile), prompting the user to re-add the account instead of failing silently. The per-family resolver map is retained for chains that need bespoke retrieval. Also stop seeding `xpub` with the address on Tezos QR import.

- [#19370](https://github.com/LedgerHQ/ledger-live/pull/19370) [`cd43e66`](https://github.com/LedgerHQ/ledger-live/commit/cd43e6689983aefdc3548ac6dcfb86521a1535ff) Thanks [@pawell24](https://github.com/pawell24)! - Rename "Ledger by Chorus One" to "Ledger by Bitwise" following Bitwise's acquisition of Chorus One

- [#19397](https://github.com/LedgerHQ/ledger-live/pull/19397) [`b95ee6f`](https://github.com/LedgerHQ/ledger-live/commit/b95ee6ff27ea52b52f69fab867aea89e3d81acd4) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add `ledgerlive://paytab` deeplink to open the Pay Tab when the `lwmPayTab` feature flag is enabled. Falls back to the Card page when the flag is off.

- [#19606](https://github.com/LedgerHQ/ledger-live/pull/19606) [`65999f4`](https://github.com/LedgerHQ/ledger-live/commit/65999f46b13b4f8bc63f3eb47c8d7d77fae9d13f) Thanks [@cfloume](https://github.com/cfloume)! - chore: update copy for large screen upsell

- [#19593](https://github.com/LedgerHQ/ledger-live/pull/19593) [`821dcb1`](https://github.com/LedgerHQ/ledger-live/commit/821dcb1f170886e6d7d57865f6273d47f6d8ea64) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix Analytics chart header to show Total balance label, scaled cents, scrub-driven balance and date updates, and remove the chart scrubber tooltip.

- [#19478](https://github.com/LedgerHQ/ledger-live/pull/19478) [`96bcef8`](https://github.com/LedgerHQ/ledger-live/commit/96bcef8cf6ddfd2b8a8ea11e1e24c14467e5da8a) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add Contacts feature flag debug controls in Settings > Debug.

- [#19672](https://github.com/LedgerHQ/ledger-live/pull/19672) [`2b676ff`](https://github.com/LedgerHQ/ledger-live/commit/2b676ff4d544bc60ae8c2860c0494e6f6d79f85f) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add My Wallet Contacts entry and gated empty Contacts page shell backed by domain contacts state.

- [#19390](https://github.com/LedgerHQ/ledger-live/pull/19390) [`7a59137`](https://github.com/LedgerHQ/ledger-live/commit/7a59137c068dfb2007d31f671c0df96b8a5f47ac) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add Mobile Contacts MVVM feature flag gate for `lwmContacts` entry configuration.

- [#19349](https://github.com/LedgerHQ/ledger-live/pull/19349) [`b3651ff`](https://github.com/LedgerHQ/ledger-live/commit/b3651ff1caaf4c612176cd7eb41040fa833ca65b) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Display percentage evolution alongside absolute values in the LWM PnL detail drawer on Asset Detail and Analytics pages.

- [#19429](https://github.com/LedgerHQ/ledger-live/pull/19429) [`4668086`](https://github.com/LedgerHQ/ledger-live/commit/4668086ebe172654fab32e9f01b7fd548bba0ced) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add sell button to asset detail footer — expose availableOnSell in useTradeAvailability and wire sell CTA through useFooterViewModel and MoreOptionsBottomSheet

- [#19611](https://github.com/LedgerHQ/ledger-live/pull/19611) [`85f1dc1`](https://github.com/LedgerHQ/ledger-live/commit/85f1dc1c8a620fa68afd419baeb3fc304566f137) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - updated useAleoPrivateSync wrapper for mobile Aleo

- [#19074](https://github.com/LedgerHQ/ledger-live/pull/19074) [`dcacbc9`](https://github.com/LedgerHQ/ledger-live/commit/dcacbc9b7a21ba36f54c1f9872918cd374b0e4e3) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(solana): add a cause to network error

- [#19569](https://github.com/LedgerHQ/ledger-live/pull/19569) [`fcc75ef`](https://github.com/LedgerHQ/ledger-live/commit/fcc75ef6c3e584b5b73b20335af5e6dcb95e73c7) Thanks [@deepyjr](https://github.com/deepyjr)! - Add the routed Mobile empty Contacts list.

- [#19665](https://github.com/LedgerHQ/ledger-live/pull/19665) [`c023e46`](https://github.com/LedgerHQ/ledger-live/commit/c023e46e54201a093e405796f6ac0c21aa4fd097) Thanks [@qperrot](https://github.com/qperrot)! - Block the send Summary CTA on any transaction-status error.

  The Summary screen previously gated its Continue button on a named allowlist of error keys (`transaction`, `NotEnoughGas`, `NotEnoughBalance`, sender/recipient) that omitted others such as `gasLimit`. As a result a `FeeNotLoaded` error — raised by `getTransactionStatus` when gas estimation fails (e.g. an EVM `eth_estimateGas` revert leaving `gasLimit = 0`) — was not enforced, letting the user proceed to sign an unexecutable transaction. Desktop already disables on any error; the Summary CTA now does the same, so every current and future status error blocks the flow by default.

- [#19277](https://github.com/LedgerHQ/ledger-live/pull/19277) [`77c8a26`](https://github.com/LedgerHQ/ledger-live/commit/77c8a264f2c50fc1d10a5267afb2290b24f4f572) Thanks [@ishaba](https://github.com/ishaba)! - Celo Custom-fees "Pay fees in" options now show a currency icon and held balance for native CELO and each allowlisted fee token, on desktop and mobile. The generic `FeeAssetOption` contract gains two optional fields (`currency`, `balance`); the UI formats the raw balance with the user's locale. Coins that don't set them render exactly as before.

- [#19285](https://github.com/LedgerHQ/ledger-live/pull/19285) [`5266e9e`](https://github.com/LedgerHQ/ledger-live/commit/5266e9ef679ff6cc77c0002d315afe7e635e5e47) Thanks [@qperrot](https://github.com/qperrot)! - Fix: double error when edit transaction is failing, and show the correct "Invalid transaction" error (instead of "Transaction already validated") when editing an EVM or Bitcoin transaction fails at broadcast, to match the desktop behavior

- [#19504](https://github.com/LedgerHQ/ledger-live/pull/19504) [`4318712`](https://github.com/LedgerHQ/ledger-live/commit/43187123ecee2f1b392c5735b173be628e26631e) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - fix(mobile): product tour sheet cut off on small screens

- [#19653](https://github.com/LedgerHQ/ledger-live/pull/19653) [`5bd897e`](https://github.com/LedgerHQ/ledger-live/commit/5bd897e56556a5a07d2ef44c8ff7c9b636545e47) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - added balance summary header for Aleo tokens

- [#19685](https://github.com/LedgerHQ/ledger-live/pull/19685) [`c9f7d49`](https://github.com/LedgerHQ/ledger-live/commit/c9f7d494158be380622b156d09e5cd16dc6a693e) Thanks [@koda-apps](https://github.com/apps/koda-apps)! - BUmp to lumen latest versions

- [#19552](https://github.com/LedgerHQ/ledger-live/pull/19552) [`279b755`](https://github.com/LedgerHQ/ledger-live/commit/279b755ce19d8157c75295d21ad18d1cc2503e79) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Migrate @ledgerhq/client-ids to DDD domain packages: @domain/entity-client-identity and @domain/api-push-devices

- [#19406](https://github.com/LedgerHQ/ledger-live/pull/19406) [`eefaded`](https://github.com/LedgerHQ/ledger-live/commit/eefaded9e81566898f1551e144a805efe60390fe) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - migrate cmc-client from @ledgerhq/live-common to DDD architecture, introducing dedicated domain packages for market-sentiment and altcoins-sentiment entities, APIs, and fear-and-greed flow utilities

- [#19682](https://github.com/LedgerHQ/ledger-live/pull/19682) [`eb2a360`](https://github.com/LedgerHQ/ledger-live/commit/eb2a3600b171e57067d7061a3df453e943ed3e59) Thanks [@cfloume](https://github.com/cfloume)! - Include LWD and LWM product tour feature flags in analytics attributes.

- [#19499](https://github.com/LedgerHQ/ledger-live/pull/19499) [`54c5680`](https://github.com/LedgerHQ/ledger-live/commit/54c5680dd6a949334471ee50c9ed725308716d3e) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Fix duplicate `contentcard_clicked` events by deduping in-flight click tracking and isolating top-wallet banner dismiss from CTA presses

- [#19586](https://github.com/LedgerHQ/ledger-live/pull/19586) [`82732bd`](https://github.com/LedgerHQ/ledger-live/commit/82732bd1b92f7dfb6b170267d36ffee2a08ea956) Thanks [@sarneijim](https://github.com/sarneijim)! - Fix a typecheck failure in large-screen upsell modal content tests by replacing optional-call resolver invocation with a safely narrowed function reference.

- [#19650](https://github.com/LedgerHQ/ledger-live/pull/19650) [`ee5241c`](https://github.com/LedgerHQ/ledger-live/commit/ee5241ce9d4e9c4dc9a38c45389d63b8d30bdbd3) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Add the Aleo private-send quick amount selector (Fast/Balanced/Full record tiers and spendable balance summary) to the mobile Amount screen, matching desktop.

- [#19554](https://github.com/LedgerHQ/ledger-live/pull/19554) [`c07faa6`](https://github.com/LedgerHQ/ledger-live/commit/c07faa66234e15ef7c96572de218ef96218c1368) Thanks [@sarneijim](https://github.com/sarneijim)! - Align large-screen upsell app-start modal tracking names with the corrected plan while keeping retries and throttling analytics properties.

- [#19566](https://github.com/LedgerHQ/ledger-live/pull/19566) [`4bd171f`](https://github.com/LedgerHQ/ledger-live/commit/4bd171f28cc0190f2bb4bb78130eae3c5081e5b5) Thanks [@sarneijim](https://github.com/sarneijim)! - Fix large-screen upsell CTA to reset retries only after successful URL navigation

- [#19442](https://github.com/LedgerHQ/ledger-live/pull/19442) [`6893f21`](https://github.com/LedgerHQ/ledger-live/commit/6893f217e6446f1f7f1397b18c7687477898cc17) Thanks [@qperrot](https://github.com/qperrot)! - Fix: solana amount when withdraw from a desactivated delegation

- [#19307](https://github.com/LedgerHQ/ledger-live/pull/19307) [`36ffa3a`](https://github.com/LedgerHQ/ledger-live/commit/36ffa3acad09b721024273260b1dc0b7b7b64a6f) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - fix: post onboarding hub auto dismiss

- [#19641](https://github.com/LedgerHQ/ledger-live/pull/19641) [`a2b1a97`](https://github.com/LedgerHQ/ledger-live/commit/a2b1a9736558a38c961da16712ebb4aeb81db04a) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add card domain entity with dedicated Redux slice plugged into the store

- [#19522](https://github.com/LedgerHQ/ledger-live/pull/19522) [`9972485`](https://github.com/LedgerHQ/ledger-live/commit/997248553d4d84964e25a79f98a7acbc933ecafb) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add testIDs to CryptoAddressesListItem, AddressAccountItem, CryptoAddressesButton, OperationsListItem, and CryptoAddressesEmptyState for e2e test targeting

- [#19391](https://github.com/LedgerHQ/ledger-live/pull/19391) [`8e9d34c`](https://github.com/LedgerHQ/ledger-live/commit/8e9d34c10c9ecd017984822995134c9193337c19) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Fix the Aleo add-account Cancel confirmation not navigating away once confirmed, and add the same confirm-before-quit modal to the ViewKeyApprove screen's Cancel button

- [#19475](https://github.com/LedgerHQ/ledger-live/pull/19475) [`d2c3ffa`](https://github.com/LedgerHQ/ledger-live/commit/d2c3ffa8814e4d1921206f2f140292f734ff8f69) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Add SUI delegate and undelegate e2e tests for LWD and LWM, with supporting testIds

- [#19306](https://github.com/LedgerHQ/ledger-live/pull/19306) [`fe81e9a`](https://github.com/LedgerHQ/ledger-live/commit/fe81e9a11e08c48fa2cfc9ef60d2c763df44bdea) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Add a "No Accounts Added" screen to the Aleo mobile add-account flow, shown when view-key approval resolves zero accounts to add

- [#19518](https://github.com/LedgerHQ/ledger-live/pull/19518) [`1452ab7`](https://github.com/LedgerHQ/ledger-live/commit/1452ab73b27468f7894eb3e0ecc5cdb2da838112) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwm): open MAD on send on asset detail page

- [#18831](https://github.com/LedgerHQ/ledger-live/pull/18831) [`17a58a8`](https://github.com/LedgerHQ/ledger-live/commit/17a58a8589b703a956f867f8cdcddba4a7d3d867) Thanks [@deepyjr](https://github.com/deepyjr)! - Add Wallet 4.0 asset aggregation and detail mobile E2E coverage.

- [#19535](https://github.com/LedgerHQ/ledger-live/pull/19535) [`aad4488`](https://github.com/LedgerHQ/ledger-live/commit/aad44883836496c7c9db645a769ed708139df923) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - refactor: navigation and route from hooks in aleo mobile screens

- [#19496](https://github.com/LedgerHQ/ledger-live/pull/19496) [`0b48c73`](https://github.com/LedgerHQ/ledger-live/commit/0b48c737ee15bc74cfd60fdbdba5269eacefb136) Thanks [@deepyjr](https://github.com/deepyjr)! - Move Contacts feature flag parameter normalization and updates into the shared flow package for both debug tools.

- [#19526](https://github.com/LedgerHQ/ledger-live/pull/19526) [`03c1e65`](https://github.com/LedgerHQ/ledger-live/commit/03c1e65a6dd76c3e304bd3196169ef9af4cafc40) Thanks [@sarneijim](https://github.com/sarneijim)! - Fix Recover intro bottomsheet button tracking to use stable analytics identifiers.

- [#19495](https://github.com/LedgerHQ/ledger-live/pull/19495) [`c9aec57`](https://github.com/LedgerHQ/ledger-live/commit/c9aec577c2aeaf80592c643e95f0fda31f2a7bfa) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Fix Stellar "Issuer is invalid" (and wrong lowercase asset code) when adding an asset. The add-asset screens parsed the case-sensitive Stellar code and issuer out of the CAL token id, which CAL lowercases; read them from the case-preserved token fields (name and contractAddress) instead. Also disable the desktop "Continue" button until an asset is selected.

- [#19221](https://github.com/LedgerHQ/ledger-live/pull/19221) [`090ed18`](https://github.com/LedgerHQ/ledger-live/commit/090ed1836041ced737095f4518e0a3b82a7b4f9d) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Add a new page in the debug menu to open DevTools

- [#19345](https://github.com/LedgerHQ/ledger-live/pull/19345) [`6777c99`](https://github.com/LedgerHQ/ledger-live/commit/6777c99df94a2f87a95975f900072a999aaad5db) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: aleo public send flow

- [#19449](https://github.com/LedgerHQ/ledger-live/pull/19449) [`65e8b15`](https://github.com/LedgerHQ/ledger-live/commit/65e8b15f2f9928e08c8d2b9eab1b7bd0f1b16433) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Fix minor UI issues on the Swap transaction status dialog on Desktop (canvas-sheet background and spacing below the main button). Forward a `swapId` from the `swapRedirectToHistory` handler to the Swap History screen on both Desktop and Mobile so the transaction status dialog/drawer opens automatically for the matching operation.

- [#19232](https://github.com/LedgerHQ/ledger-live/pull/19232) [`91771ee`](https://github.com/LedgerHQ/ledger-live/commit/91771eee45d56a2c2ab854e9234b06eb7a32feac) Thanks [@beths-ledger](https://github.com/beths-ledger)! - Pass the `swapToEarn` feature flag to the Earn app as a `{ enabled, params? }` object, consistent with how other flags are forwarded

- [#19458](https://github.com/LedgerHQ/ledger-live/pull/19458) [`a9f802d`](https://github.com/LedgerHQ/ledger-live/commit/a9f802d7fb334105c7843abe9838e91dc020ece3) Thanks [@ysitbon](https://github.com/ysitbon)! - Repoint mobile currency reads to @features/platform-currencies, @domain/entity-currency-crypto and @domain/entity-currency-fiat

- [#19479](https://github.com/LedgerHQ/ledger-live/pull/19479) [`b2fb16f`](https://github.com/LedgerHQ/ledger-live/commit/b2fb16f638664489876887ceb5d8a4391740044e) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Wire real private sync into the Aleo mandatory private sync screen, replacing the fixed 2s mock delay with an actual refresh of unspentPrivateRecords before a private send

- [#19571](https://github.com/LedgerHQ/ledger-live/pull/19571) [`436ca20`](https://github.com/LedgerHQ/ledger-live/commit/436ca200aff90b95d701a9fe1b15b0e8db2e010f) Thanks [@sarneijim](https://github.com/sarneijim)! - Backfill missing onboarding date to enforce large-screen upsell cooldown

- [#19513](https://github.com/LedgerHQ/ledger-live/pull/19513) [`6e7c51a`](https://github.com/LedgerHQ/ledger-live/commit/6e7c51a179119ca0cb183c8d359291dd2400538b) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add `@features/flow-card` package with `CardScreen` component integrated into the PayTab on desktop and mobile.

- [#19275](https://github.com/LedgerHQ/ledger-live/pull/19275) [`2c79418`](https://github.com/LedgerHQ/ledger-live/commit/2c794187db6994e7d6941956fd465e0472a46047) Thanks [@sarneijim](https://github.com/sarneijim)! - Support token asset detail deeplinks safely: parse and sanitize market/asset deeplink URLs (preserving token id case and avoiding ReDoS)

- [#19350](https://github.com/LedgerHQ/ledger-live/pull/19350) [`39fd558`](https://github.com/LedgerHQ/ledger-live/commit/39fd5588b96d3bb7b3492a4eaaebf273804f36a0) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix: aleo fmt

- [#19363](https://github.com/LedgerHQ/ledger-live/pull/19363) [`e2beecc`](https://github.com/LedgerHQ/ledger-live/commit/e2beecc4863ba4bb3a2e6f19b81946513c6d0863) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - Fix iOS errors by polyfilling AbortSignal.throwIfAborted

- [#19381](https://github.com/LedgerHQ/ledger-live/pull/19381) [`d3ae2f5`](https://github.com/LedgerHQ/ledger-live/commit/d3ae2f5206f62ceeb6818cc8bb69c215cfa1e0c5) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - feat(mobile): add Pay tab to main navigation bar (Wallet 4.0) behind `lwmPayTab` feature flag

- [#19298](https://github.com/LedgerHQ/ledger-live/pull/19298) [`43d4872`](https://github.com/LedgerHQ/ledger-live/commit/43d487261dfb0681b561e4b114b2179acba5e2a8) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: aleo mobile send flow customization

- [#19265](https://github.com/LedgerHQ/ledger-live/pull/19265) [`3de7f74`](https://github.com/LedgerHQ/ledger-live/commit/3de7f742e33df3a973cc9ac4a9327386bfbd8381) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Improve mobile content card QA diagnostics and debug card handling

- [#19354](https://github.com/LedgerHQ/ledger-live/pull/19354) [`0ed0273`](https://github.com/LedgerHQ/ledger-live/commit/0ed0273aec17d8aafa846ae5456d196728259903) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - add a private/public transaction type badge to Aleo operation status icons on mobile

### Patch Changes

- Updated dependencies [[`4b73f23`](https://github.com/LedgerHQ/ledger-live/commit/4b73f23260ecc28574f46a7fd0f5cd7627d6d13f), [`8f30c75`](https://github.com/LedgerHQ/ledger-live/commit/8f30c75ecb553a720722f1e039b4aec53fce2a87), [`25fd71b`](https://github.com/LedgerHQ/ledger-live/commit/25fd71b4caaa8781101dad205669773b234d86c0), [`9824fc8`](https://github.com/LedgerHQ/ledger-live/commit/9824fc8e03b55afe020e87a7f55fe44104f69e1b), [`0f85077`](https://github.com/LedgerHQ/ledger-live/commit/0f850774ae3b46fd4a06c0da5762d3d4211b26af), [`e478b6e`](https://github.com/LedgerHQ/ledger-live/commit/e478b6ee02a1ef105f07b2ba0d1f04292855bc91), [`c75213b`](https://github.com/LedgerHQ/ledger-live/commit/c75213b0c649cc0acfdbabacd62e07848ccee842), [`e379f4d`](https://github.com/LedgerHQ/ledger-live/commit/e379f4d8176d823d068b34d0249e5cb2fe48d0ce), [`a15b864`](https://github.com/LedgerHQ/ledger-live/commit/a15b864576d901f15d480070b475314c3b23c1dd), [`681cd06`](https://github.com/LedgerHQ/ledger-live/commit/681cd06095cd2aa3f6cbaa7305e4437cde9ee241), [`5bada3c`](https://github.com/LedgerHQ/ledger-live/commit/5bada3c49491daa95ee59cf06df1022141b864a2), [`45584e4`](https://github.com/LedgerHQ/ledger-live/commit/45584e4b87ad8ffea9a0e6ba48e196d14164c84a), [`d7ce552`](https://github.com/LedgerHQ/ledger-live/commit/d7ce5521ad9fa82427ef0f9996c1c657c0709e7a), [`e26e68e`](https://github.com/LedgerHQ/ledger-live/commit/e26e68e854ecea6ebbe5e26196c8d8e899329c7d), [`195c4e2`](https://github.com/LedgerHQ/ledger-live/commit/195c4e25777f61652cbad9bfb6ff9a9d8a908419), [`bc0573e`](https://github.com/LedgerHQ/ledger-live/commit/bc0573e3bf73e47ad4f8a58e228a3e11e0866e6e), [`fad98a1`](https://github.com/LedgerHQ/ledger-live/commit/fad98a1d33675605d646959a1b1a2b648b2f59f2), [`293720f`](https://github.com/LedgerHQ/ledger-live/commit/293720fb12143028da875fb1d2e169d2bacc6e57), [`e89bc86`](https://github.com/LedgerHQ/ledger-live/commit/e89bc86cc3daa0e38c43fbd933c233c840a9a657), [`5890c95`](https://github.com/LedgerHQ/ledger-live/commit/5890c951b33708923b6ae646ec5a2ea278f6982f), [`ea792bc`](https://github.com/LedgerHQ/ledger-live/commit/ea792bc06b9eb9931d75823bff63186202d3e2de), [`75a33a8`](https://github.com/LedgerHQ/ledger-live/commit/75a33a8ef74a6eef6236bb5db873cadd35643705), [`2d58d35`](https://github.com/LedgerHQ/ledger-live/commit/2d58d3505af6592b25be177ea05c56ecc561d422), [`47b8889`](https://github.com/LedgerHQ/ledger-live/commit/47b8889b362204d565b0ad06c8862cdb9bf048b7), [`bde85a7`](https://github.com/LedgerHQ/ledger-live/commit/bde85a7ef50cf7990efd2f9bcd7ccc34c0764fb7), [`2b4a016`](https://github.com/LedgerHQ/ledger-live/commit/2b4a016a8c2f2a635c50928bb2f78b63d96ff67f), [`bae43dd`](https://github.com/LedgerHQ/ledger-live/commit/bae43ddc50439d2a7f18852f2b727e24de0169ed), [`d3862bb`](https://github.com/LedgerHQ/ledger-live/commit/d3862bb82e8084b624f65ef6d22d3eb151e0f18f), [`07c4724`](https://github.com/LedgerHQ/ledger-live/commit/07c47249db7aa923af0a29a6dc8fb0c0264a08c7), [`47b8889`](https://github.com/LedgerHQ/ledger-live/commit/47b8889b362204d565b0ad06c8862cdb9bf048b7), [`996c76b`](https://github.com/LedgerHQ/ledger-live/commit/996c76b157553c547f83d877d25199b311ee0f63), [`68dffc1`](https://github.com/LedgerHQ/ledger-live/commit/68dffc18a73915e67739b9206112233574358304), [`b48b348`](https://github.com/LedgerHQ/ledger-live/commit/b48b3485eb7ddbc6733435099b39fa641bfad8d1), [`9479c28`](https://github.com/LedgerHQ/ledger-live/commit/9479c284321915f7d5139746f3f924b1ad2685c3), [`682c34b`](https://github.com/LedgerHQ/ledger-live/commit/682c34b48b800e4963a06e2731ff16d116af42f9), [`446e2b8`](https://github.com/LedgerHQ/ledger-live/commit/446e2b80847623efba039a44eb8dea1b6f395c69), [`083452c`](https://github.com/LedgerHQ/ledger-live/commit/083452c72359a52c363e7de95e53b98f0c6ed906), [`3fc5836`](https://github.com/LedgerHQ/ledger-live/commit/3fc583609116bcf40956ccafeaadc733e11040b0), [`2ee5ac1`](https://github.com/LedgerHQ/ledger-live/commit/2ee5ac15540a462143b61f2d546063ed9c8cfe40), [`2f7619d`](https://github.com/LedgerHQ/ledger-live/commit/2f7619dc269329c581c83ce982ddd4bc6e3c9abe), [`07bfc2c`](https://github.com/LedgerHQ/ledger-live/commit/07bfc2cbcf3c63b55224dec2aef1818d22c2315c), [`16edbea`](https://github.com/LedgerHQ/ledger-live/commit/16edbea121ac5c033c185606183c2d857e1debe5), [`2b676ff`](https://github.com/LedgerHQ/ledger-live/commit/2b676ff4d544bc60ae8c2860c0494e6f6d79f85f), [`fcc75ef`](https://github.com/LedgerHQ/ledger-live/commit/fcc75ef6c3e584b5b73b20335af5e6dcb95e73c7), [`3e127f7`](https://github.com/LedgerHQ/ledger-live/commit/3e127f7385f5da907d4a08447c3f7582a9ac4f3f), [`35f0138`](https://github.com/LedgerHQ/ledger-live/commit/35f0138542fbd98f664b24ee786fc662d7223e10), [`452be85`](https://github.com/LedgerHQ/ledger-live/commit/452be85b27378f9240041119296ffa8c580fe071), [`eefaded`](https://github.com/LedgerHQ/ledger-live/commit/eefaded9e81566898f1551e144a805efe60390fe), [`d9dc6e6`](https://github.com/LedgerHQ/ledger-live/commit/d9dc6e621df877b13148688adec0b038983574e0), [`50660af`](https://github.com/LedgerHQ/ledger-live/commit/50660af751c2306802f1fefb2499cbf353f79cc4), [`94b454b`](https://github.com/LedgerHQ/ledger-live/commit/94b454bd9676198c49ee4c4c0c49063e87175f70), [`a952f84`](https://github.com/LedgerHQ/ledger-live/commit/a952f84063e5f791b9c757827570d59d048c43bf), [`edc897d`](https://github.com/LedgerHQ/ledger-live/commit/edc897d25e91f426065ce4eab89882192cb1327c), [`ff9d1d2`](https://github.com/LedgerHQ/ledger-live/commit/ff9d1d29fbc3d6a4d75e3ca145e3a9df0dda50c5), [`fc44f1e`](https://github.com/LedgerHQ/ledger-live/commit/fc44f1e6ddcca939c117e0cb8bc49c404163b003), [`d631f0d`](https://github.com/LedgerHQ/ledger-live/commit/d631f0dd2480950c5f20dec0c9b4aca515ec63f8), [`ddc6499`](https://github.com/LedgerHQ/ledger-live/commit/ddc6499ebc483a853d82ca3c00d0927169c8e0ed), [`fd9da5e`](https://github.com/LedgerHQ/ledger-live/commit/fd9da5e2b3a1e5300d012b826f3707535d07b1d9), [`0b48c73`](https://github.com/LedgerHQ/ledger-live/commit/0b48c737ee15bc74cfd60fdbdba5269eacefb136), [`deaa7ba`](https://github.com/LedgerHQ/ledger-live/commit/deaa7ba622776b95b87aee9926b34e20a0dc818b), [`6e7c51a`](https://github.com/LedgerHQ/ledger-live/commit/6e7c51a179119ca0cb183c8d359291dd2400538b), [`c12485a`](https://github.com/LedgerHQ/ledger-live/commit/c12485ab346a02db79d864e8ecf7837d724a4575), [`6ef44af`](https://github.com/LedgerHQ/ledger-live/commit/6ef44afa6807ace32b3f6620173868f2ef20e158), [`6ef44af`](https://github.com/LedgerHQ/ledger-live/commit/6ef44afa6807ace32b3f6620173868f2ef20e158), [`8238860`](https://github.com/LedgerHQ/ledger-live/commit/8238860c893b0688d2c59a3e042d7a227031547a)]:
  - @ledgerhq/coin-bitcoin@0.47.0
  - @ledgerhq/coin-canton@0.29.0
  - @ledgerhq/coin-casper@2.16.0
  - @ledgerhq/coin-concordium@0.16.0
  - @ledgerhq/coin-cosmos@0.39.0
  - @ledgerhq/coin-evm@4.6.0
  - @ledgerhq/coin-filecoin@1.28.0
  - @ledgerhq/coin-multiversx@0.20.0
  - @ledgerhq/coin-stacks@0.24.0
  - @ledgerhq/ledger-wallet-framework@2.4.0
  - @ledgerhq/cryptoassets@13.55.0
  - @shared/feature-flags@0.14.0
  - @features/flow-contacts@0.2.0
  - @ledgerhq/live-env@2.42.0
  - @domain/api-pay-card@0.2.0
  - @domain/entity-pay-card@0.2.0
  - @features/flow-card@0.2.0
  - @domain/entity-contact@0.2.0
  - @ledgerhq/types-live@6.115.0
  - @ledgerhq/live-engagement@0.1.0
  - @domain/entity-currency-crypto@0.6.0
  - @domain/entity-currency-fiat@0.3.0
  - @ledgerhq/live-wallet@0.29.0
  - @ledgerhq/ledger-key-ring-protocol@0.17.0
  - @devtools/bindings@0.2.0
  - @ledgerhq/live-currency-format@0.13.0
  - @domain/entity-altcoins-sentiment@0.2.0
  - @domain/entity-market-sentiment@0.2.0
  - @domain/api-altcoins-sentiment@0.2.0
  - @features/flow-fear-and-greed@0.2.0
  - @domain/api-market-sentiment@0.2.0
  - @features/platform-currencies@0.3.0
  - @ledgerhq/live-countervalues@0.22.1
  - @ledgerhq/live-countervalues-react@0.16.2
  - @ledgerhq/wallet-analytics@0.2.1
  - @ledgerhq/wallet-pnl@0.7.2
  - @features/platform-feature-flags@0.6.1
  - @ledgerhq/hw-ledger-key-ring-protocol@0.11.1
  - @ledgerhq/live-dmk-mobile@0.28.1
  - @ledgerhq/live-dmk-speculos@0.10.2
  - @ledgerhq/live-network@2.6.8
  - @ledgerhq/domain-service@1.8.10
  - @domain/api-currency-token@0.2.1
  - @domain/api-currency-fiat@0.2.1
  - @devtools/shell@0.5.1

## 4.12.0-next.0

### Minor Changes

- [#19309](https://github.com/LedgerHQ/ledger-live/pull/19309) [`27da624`](https://github.com/LedgerHQ/ledger-live/commit/27da6249452d911a9666d60b4a04a4ff4d9735d6) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - Private sync flow for Aleo (mobile)

- [#19411](https://github.com/LedgerHQ/ledger-live/pull/19411) [`ca37cfe`](https://github.com/LedgerHQ/ledger-live/commit/ca37cfe7f451b88ebd76a9da7af70fcc6577cc53) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(algorand): not opt in asa error message

- [#19393](https://github.com/LedgerHQ/ledger-live/pull/19393) [`4a9eade`](https://github.com/LedgerHQ/ledger-live/commit/4a9eade8c74c948acab3955eca83c734d13776a1) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - test: e2e test aleo add account flow on mobile

- [#19373](https://github.com/LedgerHQ/ledger-live/pull/19373) [`1f34a90`](https://github.com/LedgerHQ/ledger-live/commit/1f34a9055ccaea91ee2ab98a7b10ef1afc968e85) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Fix GAM CTA visibility and empty-link click behavior on desktop and mobile

- [#19396](https://github.com/LedgerHQ/ledger-live/pull/19396) [`25fd71b`](https://github.com/LedgerHQ/ledger-live/commit/25fd71b4caaa8781101dad205669773b234d86c0) Thanks [@amaslakov](https://github.com/amaslakov)! - Hide the "Compound" claim-rewards option for Cosmos-family chains that use epoching (wrapped) staking messages, such as Babylon. Compound restaking is not supported on those chains yet — its embedded delegate is not epoching-wrapped — so only "Cash in" (claim rewards) is offered, preventing the "claimRewardCompound is not supported" error.

- [#19319](https://github.com/LedgerHQ/ledger-live/pull/19319) [`484b715`](https://github.com/LedgerHQ/ledger-live/commit/484b71559719873025197c7289ab422d1bcd8af0) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Fix market category resetting to entry value when navigating back from asset detail

- [#19674](https://github.com/LedgerHQ/ledger-live/pull/19674) [`12614f3`](https://github.com/LedgerHQ/ledger-live/commit/12614f3dcb7215af667a337815f58279a0c88f7b) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Fix extra spacing between experimental header and wallet 4.0 top bar

- [#19628](https://github.com/LedgerHQ/ledger-live/pull/19628) [`8df21c9`](https://github.com/LedgerHQ/ledger-live/commit/8df21c94922550dd6dfe5448afa79b32cfa94a92) Thanks [@qperrot](https://github.com/qperrot)! - Fix coin control not showing selected coins after entering an amount, and refine the coin control screen layout (subheader sizing, header spacing, and scrollbar gutter)

- [#19469](https://github.com/LedgerHQ/ledger-live/pull/19469) [`a8a1e70`](https://github.com/LedgerHQ/ledger-live/commit/a8a1e7088dc97e7e7b41fbe26d1d850d3d9af080) Thanks [@deepyjr](https://github.com/deepyjr)! - Fix Contacts entry config test expectations

- [#19252](https://github.com/LedgerHQ/ledger-live/pull/19252) [`c75213b`](https://github.com/LedgerHQ/ledger-live/commit/c75213b0c649cc0acfdbabacd62e07848ccee842) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwm): switch to deviceaction instead of die with FF on new send flow

- [#19525](https://github.com/LedgerHQ/ledger-live/pull/19525) [`859b960`](https://github.com/LedgerHQ/ledger-live/commit/859b9603f5a213d6b7a30e0a32790ecb9636ad9b) Thanks [@sarneijim](https://github.com/sarneijim)! - Add large screen upsell modal analytics tracking

- [#19548](https://github.com/LedgerHQ/ledger-live/pull/19548) [`3934168`](https://github.com/LedgerHQ/ledger-live/commit/3934168232c3e6e27e58a928a992391d1e5fb7bd) Thanks [@deepyjr](https://github.com/deepyjr)! - Fix asset favourites to preserve canonical Market identifiers and migrate DAI V2 favourites.

- [#19279](https://github.com/LedgerHQ/ledger-live/pull/19279) [`2c28696`](https://github.com/LedgerHQ/ledger-live/commit/2c2869679a266a0a330547db0dfb6a13d11b19aa) Thanks [@deepyjr](https://github.com/deepyjr)! - Fix the dust filter option copy and wrapping on mobile transaction history, and share the dust threshold formatter across apps.

- [#19568](https://github.com/LedgerHQ/ledger-live/pull/19568) [`45584e4`](https://github.com/LedgerHQ/ledger-live/commit/45584e4b87ad8ffea9a0e6ba48e196d14164c84a) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Show an estimated label for configured providers on completed mobile swaps.

- [#19672](https://github.com/LedgerHQ/ledger-live/pull/19672) [`d7ce552`](https://github.com/LedgerHQ/ledger-live/commit/d7ce5521ad9fa82427ef0f9996c1c657c0709e7a) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix mobile Jest resolution for @features/flow-contacts via a logic-only `jest.native.ts` stub, Lumen RN source mappings, and updated integration testing docs.

- [#19217](https://github.com/LedgerHQ/ledger-live/pull/19217) [`e26e68e`](https://github.com/LedgerHQ/ledger-live/commit/e26e68e854ecea6ebbe5e26196c8d8e899329c7d) Thanks [@qperrot](https://github.com/qperrot)! - families/bitcoin/bridgeExtensions.ts now implements the full edit-transaction contract: getEditTransactionPatch, getEditTransactionStatus, getFormattedFeeFields, hasMinimumFundsToCancel, hasMinimumFundsToSpeedUp, isStrategyDisabled, isTransactionConfirmed.
  The Bitcoin edit-transaction helpers (RBF replace/cancel, fee formatting, strategy validation) live under ledger-live-common/src/families/bitcoin/editTransaction/, with unit tests.
  Desktop & mobile Bitcoin edit flows (Body.tsx, StepFees, StepMethod, MethodSelection, EditTransactionSummary) reach these helpers through getAccountBridge(account) instead of importing them directly.

  hasMinimumFundsToCancel / hasMinimumFundsToSpeedUp now return Promise<boolean>. Bitcoin's minimum-funds checks are inherently async (RBF fee lookup) and all call sites already await them; EVM's implementations were updated accordingly.

  Bitcoin's isStrategyDisabled uses a slightly different shape than the generic contract, adapted via a thin wrapper (same pattern as EVM): it maps the contract's feeData to Bitcoin's feesStrategy, and its transaction param was widened to accept the real (nullable) feePerByte with a guard. isTransactionConfirmed follows the { account, hash } contract signature directly.

- [#19614](https://github.com/LedgerHQ/ledger-live/pull/19614) [`8998c72`](https://github.com/LedgerHQ/ledger-live/commit/8998c720d2a3e525430be9a41761c06f446a21ad) Thanks [@jeportie](https://github.com/jeportie)! - Expose the swap transaction-details provider link URL via test/accessibility attributes so E2E can conditionally verify the provider link only when a provider URL exists (QAA-721)

- [#19549](https://github.com/LedgerHQ/ledger-live/pull/19549) [`195c4e2`](https://github.com/LedgerHQ/ledger-live/commit/195c4e25777f61652cbad9bfb6ff9a9d8a908419) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - feat(LLM): add large-screen upsell debug tool

- [#19621](https://github.com/LedgerHQ/ledger-live/pull/19621) [`bc0573e`](https://github.com/LedgerHQ/ledger-live/commit/bc0573e3bf73e47ad4f8a58e228a3e11e0866e6e) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Fix EVM staking operation history showing the user's own address instead of the staking contract as recipient

- [#19264](https://github.com/LedgerHQ/ledger-live/pull/19264) [`821c926`](https://github.com/LedgerHQ/ledger-live/commit/821c926b465d641d0e0c6ea470596fe0ff5bcc1c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - test(mobile): remove mocked Detox e2e suite

- [#19572](https://github.com/LedgerHQ/ledger-live/pull/19572) [`1513e87`](https://github.com/LedgerHQ/ledger-live/commit/1513e8791af483a9a60c29f75625c724dd146b59) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Refine coin control screen UI: set the header title to "Coin control" and force its balance to crypto, move strategy/amount labels into their components, add info icon on "Coin to send", disable coin selection when no amount is entered, and fix the custom fees selection failing silently from the coin control screen

- [#19362](https://github.com/LedgerHQ/ledger-live/pull/19362) [`5b3187a`](https://github.com/LedgerHQ/ledger-live/commit/5b3187aeed7d6cf78d5c8c51c353ec729c6c938a) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - feat(lwm): upsell eligibility gate (audience + cooldown)

- [#19532](https://github.com/LedgerHQ/ledger-live/pull/19532) [`12cdc19`](https://github.com/LedgerHQ/ledger-live/commit/12cdc1957db5c47663a3a1cec15b9d80c2875de5) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: aleo tokens support in mobile send flows

- [#19519](https://github.com/LedgerHQ/ledger-live/pull/19519) [`63792ba`](https://github.com/LedgerHQ/ledger-live/commit/63792bae54e2ff58dc39df157385f7206cdd6be5) Thanks [@cfloume](https://github.com/cfloume)! - fix: prevent Q2 tour from showing to users who haven't onboarded

- [#19220](https://github.com/LedgerHQ/ledger-live/pull/19220) [`996c76b`](https://github.com/LedgerHQ/ledger-live/commit/996c76b157553c547f83d877d25199b311ee0f63) Thanks [@ysitbon](https://github.com/ysitbon)! - Make the `@ledgerhq/cryptoassets` fiat registry injectable (`setFiatCurrenciesStore`) and inject the `@domain/entity-currency-fiat` registry at each app's bootstrap, so the domain registry is the single runtime source of truth for fiat currency data. The bundled fiat list stays as the fallback and is kept in sync by the existing parity test.

- [#19331](https://github.com/LedgerHQ/ledger-live/pull/19331) [`71884d7`](https://github.com/LedgerHQ/ledger-live/commit/71884d759a86bc36ce3f6776ed1c59a2b984343b) Thanks [@ysitbon](https://github.com/ysitbon)! - Activate the RTK Query supported-fiats flow and retire the legacy CVS polling path: boot-time query populates the Redux slice; settings and countervalue selectors read from the slice synchronously.

- [#19553](https://github.com/LedgerHQ/ledger-live/pull/19553) [`68dffc1`](https://github.com/LedgerHQ/ledger-live/commit/68dffc18a73915e67739b9206112233574358304) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - Aleo UI changes for mobile

- [#19486](https://github.com/LedgerHQ/ledger-live/pull/19486) [`b3557c0`](https://github.com/LedgerHQ/ledger-live/commit/b3557c0c7c2b1388f5e0a7270ee4847b1cf53ff6) Thanks [@deepyjr](https://github.com/deepyjr)! - Filter incoming and outgoing dust transactions in history.

- [#18924](https://github.com/LedgerHQ/ledger-live/pull/18924) [`b2f4ae6`](https://github.com/LedgerHQ/ledger-live/commit/b2f4ae6f1c73971b6158e98a7cc8411e9c0a9f56) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Fix the endless loading state when navigating back from the Swap success screen. React Navigation v7 pushed a new SwapPendingOperation on top of SwapLoading instead of reusing the existing one, leaving SwapLoading beneath the success screen. Any back gesture — Android system back, iOS swipe-back, or the close (X) button — would pop to SwapLoading and get stuck. The fix replaces the SwapSubScreensNavigator via BaseNavigator so the success screen always starts with a clean [SwapPendingOperation] stack, making all back paths (back button, close button, and via Swap history) return correctly to the Swap input.

- [#19414](https://github.com/LedgerHQ/ledger-live/pull/19414) [`05a5f76`](https://github.com/LedgerHQ/ledger-live/commit/05a5f76f645be0eb775dc50e4a2669e6bb6b4005) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Stabilize large screen upsell eligibility integration test.

- [#19419](https://github.com/LedgerHQ/ledger-live/pull/19419) [`0040b67`](https://github.com/LedgerHQ/ledger-live/commit/0040b67ca4d65ebf2fede15f625e5958f507d879) Thanks [@deepyjr](https://github.com/deepyjr)! - Filter incoming native dust transactions in operation histories.

- [#19536](https://github.com/LedgerHQ/ledger-live/pull/19536) [`f854c29`](https://github.com/LedgerHQ/ledger-live/commit/f854c29bf164948ff2a38c01a1dc88e8fb297bc1) Thanks [@amaslakov](https://github.com/amaslakov)! - Warn and explain when Tezos staking is blocked by an unfinalizable unstake to another validator: translate the raw fee-estimation error into a clear message, and show an inline warning on the change-validator summary while a pending unstake is still unfinalizable

- [#18901](https://github.com/LedgerHQ/ledger-live/pull/18901) [`78efe69`](https://github.com/LedgerHQ/ledger-live/commit/78efe6957a6e941063c8b83c2fe76a26bbdc0191) Thanks [@amaslakov](https://github.com/amaslakov)! - Add test ids to the Tezos staking-section rows (staked and unstaking) so e2e can target them distinctly from the delegation card

- [#19589](https://github.com/LedgerHQ/ledger-live/pull/19589) [`9479c28`](https://github.com/LedgerHQ/ledger-live/commit/9479c284321915f7d5139746f3f924b1ad2685c3) Thanks [@sarneijim](https://github.com/sarneijim)! - Keep large-screen upsell eligibility read-only and align the fallback CTA link

- [#19452](https://github.com/LedgerHQ/ledger-live/pull/19452) [`5fb2345`](https://github.com/LedgerHQ/ledger-live/commit/5fb2345f166f429def3f58ba6bb73b81036a9a58) Thanks [@LucasWerey](https://github.com/LucasWerey)! - fix multi-network asset countervalues and Asset Detail CTA placement

- [#19199](https://github.com/LedgerHQ/ledger-live/pull/19199) [`446e2b8`](https://github.com/LedgerHQ/ledger-live/commit/446e2b80847623efba039a44eb8dea1b6f395c69) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Persist the large-screen upsell modal's frequency state (`retries`, `lastSeenAt`) across app restarts on mobile, via a new shared `@ledgerhq/live-engagement` Redux slice

- [#19718](https://github.com/LedgerHQ/ledger-live/pull/19718) [`b5540fb`](https://github.com/LedgerHQ/ledger-live/commit/b5540fb844df1779c8583190a11c42ab5bf6c57b) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Fix Aleo mobile send summary to reuse shared UI components and show the Records used / Signing time rows for private transactions

- [#19228](https://github.com/LedgerHQ/ledger-live/pull/19228) [`3fc5836`](https://github.com/LedgerHQ/ledger-live/commit/3fc583609116bcf40956ccafeaadc733e11040b0) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Fix Tezos `account.getPublicKey` (Wallet API): resolve the account public key from `xpub` instead of `seedIdentifier`, which is derived from a different path (`44'/1729'/0'`) and returned the same wrong address for every Tezos account. When `xpub` does not contain a valid base58 Tezos public key (edpk/sppk/p2pk), the request is rejected with a dedicated `AccountPublicKeyUnavailable` error and Ledger Live surfaces it natively (error modal on desktop, bottom modal on mobile), prompting the user to re-add the account instead of failing silently. The per-family resolver map is retained for chains that need bespoke retrieval. Also stop seeding `xpub` with the address on Tezos QR import.

- [#19370](https://github.com/LedgerHQ/ledger-live/pull/19370) [`cd43e66`](https://github.com/LedgerHQ/ledger-live/commit/cd43e6689983aefdc3548ac6dcfb86521a1535ff) Thanks [@pawell24](https://github.com/pawell24)! - Rename "Ledger by Chorus One" to "Ledger by Bitwise" following Bitwise's acquisition of Chorus One

- [#19397](https://github.com/LedgerHQ/ledger-live/pull/19397) [`b95ee6f`](https://github.com/LedgerHQ/ledger-live/commit/b95ee6ff27ea52b52f69fab867aea89e3d81acd4) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add `ledgerlive://paytab` deeplink to open the Pay Tab when the `lwmPayTab` feature flag is enabled. Falls back to the Card page when the flag is off.

- [#19606](https://github.com/LedgerHQ/ledger-live/pull/19606) [`65999f4`](https://github.com/LedgerHQ/ledger-live/commit/65999f46b13b4f8bc63f3eb47c8d7d77fae9d13f) Thanks [@cfloume](https://github.com/cfloume)! - chore: update copy for large screen upsell

- [#19593](https://github.com/LedgerHQ/ledger-live/pull/19593) [`821dcb1`](https://github.com/LedgerHQ/ledger-live/commit/821dcb1f170886e6d7d57865f6273d47f6d8ea64) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix Analytics chart header to show Total balance label, scaled cents, scrub-driven balance and date updates, and remove the chart scrubber tooltip.

- [#19478](https://github.com/LedgerHQ/ledger-live/pull/19478) [`96bcef8`](https://github.com/LedgerHQ/ledger-live/commit/96bcef8cf6ddfd2b8a8ea11e1e24c14467e5da8a) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add Contacts feature flag debug controls in Settings > Debug.

- [#19672](https://github.com/LedgerHQ/ledger-live/pull/19672) [`2b676ff`](https://github.com/LedgerHQ/ledger-live/commit/2b676ff4d544bc60ae8c2860c0494e6f6d79f85f) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add My Wallet Contacts entry and gated empty Contacts page shell backed by domain contacts state.

- [#19390](https://github.com/LedgerHQ/ledger-live/pull/19390) [`7a59137`](https://github.com/LedgerHQ/ledger-live/commit/7a59137c068dfb2007d31f671c0df96b8a5f47ac) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add Mobile Contacts MVVM feature flag gate for `lwmContacts` entry configuration.

- [#19349](https://github.com/LedgerHQ/ledger-live/pull/19349) [`b3651ff`](https://github.com/LedgerHQ/ledger-live/commit/b3651ff1caaf4c612176cd7eb41040fa833ca65b) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Display percentage evolution alongside absolute values in the LWM PnL detail drawer on Asset Detail and Analytics pages.

- [#19429](https://github.com/LedgerHQ/ledger-live/pull/19429) [`4668086`](https://github.com/LedgerHQ/ledger-live/commit/4668086ebe172654fab32e9f01b7fd548bba0ced) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add sell button to asset detail footer — expose availableOnSell in useTradeAvailability and wire sell CTA through useFooterViewModel and MoreOptionsBottomSheet

- [#19611](https://github.com/LedgerHQ/ledger-live/pull/19611) [`85f1dc1`](https://github.com/LedgerHQ/ledger-live/commit/85f1dc1c8a620fa68afd419baeb3fc304566f137) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - updated useAleoPrivateSync wrapper for mobile Aleo

- [#19074](https://github.com/LedgerHQ/ledger-live/pull/19074) [`dcacbc9`](https://github.com/LedgerHQ/ledger-live/commit/dcacbc9b7a21ba36f54c1f9872918cd374b0e4e3) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(solana): add a cause to network error

- [#19569](https://github.com/LedgerHQ/ledger-live/pull/19569) [`fcc75ef`](https://github.com/LedgerHQ/ledger-live/commit/fcc75ef6c3e584b5b73b20335af5e6dcb95e73c7) Thanks [@deepyjr](https://github.com/deepyjr)! - Add the routed Mobile empty Contacts list.

- [#19665](https://github.com/LedgerHQ/ledger-live/pull/19665) [`c023e46`](https://github.com/LedgerHQ/ledger-live/commit/c023e46e54201a093e405796f6ac0c21aa4fd097) Thanks [@qperrot](https://github.com/qperrot)! - Block the send Summary CTA on any transaction-status error.

  The Summary screen previously gated its Continue button on a named allowlist of error keys (`transaction`, `NotEnoughGas`, `NotEnoughBalance`, sender/recipient) that omitted others such as `gasLimit`. As a result a `FeeNotLoaded` error — raised by `getTransactionStatus` when gas estimation fails (e.g. an EVM `eth_estimateGas` revert leaving `gasLimit = 0`) — was not enforced, letting the user proceed to sign an unexecutable transaction. Desktop already disables on any error; the Summary CTA now does the same, so every current and future status error blocks the flow by default.

- [#19277](https://github.com/LedgerHQ/ledger-live/pull/19277) [`77c8a26`](https://github.com/LedgerHQ/ledger-live/commit/77c8a264f2c50fc1d10a5267afb2290b24f4f572) Thanks [@ishaba](https://github.com/ishaba)! - Celo Custom-fees "Pay fees in" options now show a currency icon and held balance for native CELO and each allowlisted fee token, on desktop and mobile. The generic `FeeAssetOption` contract gains two optional fields (`currency`, `balance`); the UI formats the raw balance with the user's locale. Coins that don't set them render exactly as before.

- [#19285](https://github.com/LedgerHQ/ledger-live/pull/19285) [`5266e9e`](https://github.com/LedgerHQ/ledger-live/commit/5266e9ef679ff6cc77c0002d315afe7e635e5e47) Thanks [@qperrot](https://github.com/qperrot)! - Fix: double error when edit transaction is failing, and show the correct "Invalid transaction" error (instead of "Transaction already validated") when editing an EVM or Bitcoin transaction fails at broadcast, to match the desktop behavior

- [#19504](https://github.com/LedgerHQ/ledger-live/pull/19504) [`4318712`](https://github.com/LedgerHQ/ledger-live/commit/43187123ecee2f1b392c5735b173be628e26631e) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - fix(mobile): product tour sheet cut off on small screens

- [#19653](https://github.com/LedgerHQ/ledger-live/pull/19653) [`5bd897e`](https://github.com/LedgerHQ/ledger-live/commit/5bd897e56556a5a07d2ef44c8ff7c9b636545e47) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - added balance summary header for Aleo tokens

- [#19685](https://github.com/LedgerHQ/ledger-live/pull/19685) [`c9f7d49`](https://github.com/LedgerHQ/ledger-live/commit/c9f7d494158be380622b156d09e5cd16dc6a693e) Thanks [@koda-apps](https://github.com/apps/koda-apps)! - BUmp to lumen latest versions

- [#19552](https://github.com/LedgerHQ/ledger-live/pull/19552) [`279b755`](https://github.com/LedgerHQ/ledger-live/commit/279b755ce19d8157c75295d21ad18d1cc2503e79) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Migrate @ledgerhq/client-ids to DDD domain packages: @domain/entity-client-identity and @domain/api-push-devices

- [#19406](https://github.com/LedgerHQ/ledger-live/pull/19406) [`eefaded`](https://github.com/LedgerHQ/ledger-live/commit/eefaded9e81566898f1551e144a805efe60390fe) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - migrate cmc-client from @ledgerhq/live-common to DDD architecture, introducing dedicated domain packages for market-sentiment and altcoins-sentiment entities, APIs, and fear-and-greed flow utilities

- [#19682](https://github.com/LedgerHQ/ledger-live/pull/19682) [`eb2a360`](https://github.com/LedgerHQ/ledger-live/commit/eb2a3600b171e57067d7061a3df453e943ed3e59) Thanks [@cfloume](https://github.com/cfloume)! - Include LWD and LWM product tour feature flags in analytics attributes.

- [#19499](https://github.com/LedgerHQ/ledger-live/pull/19499) [`54c5680`](https://github.com/LedgerHQ/ledger-live/commit/54c5680dd6a949334471ee50c9ed725308716d3e) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Fix duplicate `contentcard_clicked` events by deduping in-flight click tracking and isolating top-wallet banner dismiss from CTA presses

- [#19586](https://github.com/LedgerHQ/ledger-live/pull/19586) [`82732bd`](https://github.com/LedgerHQ/ledger-live/commit/82732bd1b92f7dfb6b170267d36ffee2a08ea956) Thanks [@sarneijim](https://github.com/sarneijim)! - Fix a typecheck failure in large-screen upsell modal content tests by replacing optional-call resolver invocation with a safely narrowed function reference.

- [#19650](https://github.com/LedgerHQ/ledger-live/pull/19650) [`ee5241c`](https://github.com/LedgerHQ/ledger-live/commit/ee5241ce9d4e9c4dc9a38c45389d63b8d30bdbd3) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Add the Aleo private-send quick amount selector (Fast/Balanced/Full record tiers and spendable balance summary) to the mobile Amount screen, matching desktop.

- [#19554](https://github.com/LedgerHQ/ledger-live/pull/19554) [`c07faa6`](https://github.com/LedgerHQ/ledger-live/commit/c07faa66234e15ef7c96572de218ef96218c1368) Thanks [@sarneijim](https://github.com/sarneijim)! - Align large-screen upsell app-start modal tracking names with the corrected plan while keeping retries and throttling analytics properties.

- [#19566](https://github.com/LedgerHQ/ledger-live/pull/19566) [`4bd171f`](https://github.com/LedgerHQ/ledger-live/commit/4bd171f28cc0190f2bb4bb78130eae3c5081e5b5) Thanks [@sarneijim](https://github.com/sarneijim)! - Fix large-screen upsell CTA to reset retries only after successful URL navigation

- [#19442](https://github.com/LedgerHQ/ledger-live/pull/19442) [`6893f21`](https://github.com/LedgerHQ/ledger-live/commit/6893f217e6446f1f7f1397b18c7687477898cc17) Thanks [@qperrot](https://github.com/qperrot)! - Fix: solana amount when withdraw from a desactivated delegation

- [#19307](https://github.com/LedgerHQ/ledger-live/pull/19307) [`36ffa3a`](https://github.com/LedgerHQ/ledger-live/commit/36ffa3acad09b721024273260b1dc0b7b7b64a6f) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - fix: post onboarding hub auto dismiss

- [#19641](https://github.com/LedgerHQ/ledger-live/pull/19641) [`a2b1a97`](https://github.com/LedgerHQ/ledger-live/commit/a2b1a9736558a38c961da16712ebb4aeb81db04a) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add card domain entity with dedicated Redux slice plugged into the store

- [#19522](https://github.com/LedgerHQ/ledger-live/pull/19522) [`9972485`](https://github.com/LedgerHQ/ledger-live/commit/997248553d4d84964e25a79f98a7acbc933ecafb) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add testIDs to CryptoAddressesListItem, AddressAccountItem, CryptoAddressesButton, OperationsListItem, and CryptoAddressesEmptyState for e2e test targeting

- [#19391](https://github.com/LedgerHQ/ledger-live/pull/19391) [`8e9d34c`](https://github.com/LedgerHQ/ledger-live/commit/8e9d34c10c9ecd017984822995134c9193337c19) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Fix the Aleo add-account Cancel confirmation not navigating away once confirmed, and add the same confirm-before-quit modal to the ViewKeyApprove screen's Cancel button

- [#19475](https://github.com/LedgerHQ/ledger-live/pull/19475) [`d2c3ffa`](https://github.com/LedgerHQ/ledger-live/commit/d2c3ffa8814e4d1921206f2f140292f734ff8f69) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Add SUI delegate and undelegate e2e tests for LWD and LWM, with supporting testIds

- [#19306](https://github.com/LedgerHQ/ledger-live/pull/19306) [`fe81e9a`](https://github.com/LedgerHQ/ledger-live/commit/fe81e9a11e08c48fa2cfc9ef60d2c763df44bdea) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Add a "No Accounts Added" screen to the Aleo mobile add-account flow, shown when view-key approval resolves zero accounts to add

- [#19518](https://github.com/LedgerHQ/ledger-live/pull/19518) [`1452ab7`](https://github.com/LedgerHQ/ledger-live/commit/1452ab73b27468f7894eb3e0ecc5cdb2da838112) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwm): open MAD on send on asset detail page

- [#18831](https://github.com/LedgerHQ/ledger-live/pull/18831) [`17a58a8`](https://github.com/LedgerHQ/ledger-live/commit/17a58a8589b703a956f867f8cdcddba4a7d3d867) Thanks [@deepyjr](https://github.com/deepyjr)! - Add Wallet 4.0 asset aggregation and detail mobile E2E coverage.

- [#19535](https://github.com/LedgerHQ/ledger-live/pull/19535) [`aad4488`](https://github.com/LedgerHQ/ledger-live/commit/aad44883836496c7c9db645a769ed708139df923) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - refactor: navigation and route from hooks in aleo mobile screens

- [#19496](https://github.com/LedgerHQ/ledger-live/pull/19496) [`0b48c73`](https://github.com/LedgerHQ/ledger-live/commit/0b48c737ee15bc74cfd60fdbdba5269eacefb136) Thanks [@deepyjr](https://github.com/deepyjr)! - Move Contacts feature flag parameter normalization and updates into the shared flow package for both debug tools.

- [#19526](https://github.com/LedgerHQ/ledger-live/pull/19526) [`03c1e65`](https://github.com/LedgerHQ/ledger-live/commit/03c1e65a6dd76c3e304bd3196169ef9af4cafc40) Thanks [@sarneijim](https://github.com/sarneijim)! - Fix Recover intro bottomsheet button tracking to use stable analytics identifiers.

- [#19495](https://github.com/LedgerHQ/ledger-live/pull/19495) [`c9aec57`](https://github.com/LedgerHQ/ledger-live/commit/c9aec577c2aeaf80592c643e95f0fda31f2a7bfa) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Fix Stellar "Issuer is invalid" (and wrong lowercase asset code) when adding an asset. The add-asset screens parsed the case-sensitive Stellar code and issuer out of the CAL token id, which CAL lowercases; read them from the case-preserved token fields (name and contractAddress) instead. Also disable the desktop "Continue" button until an asset is selected.

- [#19221](https://github.com/LedgerHQ/ledger-live/pull/19221) [`090ed18`](https://github.com/LedgerHQ/ledger-live/commit/090ed1836041ced737095f4518e0a3b82a7b4f9d) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Add a new page in the debug menu to open DevTools

- [#19345](https://github.com/LedgerHQ/ledger-live/pull/19345) [`6777c99`](https://github.com/LedgerHQ/ledger-live/commit/6777c99df94a2f87a95975f900072a999aaad5db) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: aleo public send flow

- [#19449](https://github.com/LedgerHQ/ledger-live/pull/19449) [`65e8b15`](https://github.com/LedgerHQ/ledger-live/commit/65e8b15f2f9928e08c8d2b9eab1b7bd0f1b16433) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Fix minor UI issues on the Swap transaction status dialog on Desktop (canvas-sheet background and spacing below the main button). Forward a `swapId` from the `swapRedirectToHistory` handler to the Swap History screen on both Desktop and Mobile so the transaction status dialog/drawer opens automatically for the matching operation.

- [#19232](https://github.com/LedgerHQ/ledger-live/pull/19232) [`91771ee`](https://github.com/LedgerHQ/ledger-live/commit/91771eee45d56a2c2ab854e9234b06eb7a32feac) Thanks [@beths-ledger](https://github.com/beths-ledger)! - Pass the `swapToEarn` feature flag to the Earn app as a `{ enabled, params? }` object, consistent with how other flags are forwarded

- [#19458](https://github.com/LedgerHQ/ledger-live/pull/19458) [`a9f802d`](https://github.com/LedgerHQ/ledger-live/commit/a9f802d7fb334105c7843abe9838e91dc020ece3) Thanks [@ysitbon](https://github.com/ysitbon)! - Repoint mobile currency reads to @features/platform-currencies, @domain/entity-currency-crypto and @domain/entity-currency-fiat

- [#19479](https://github.com/LedgerHQ/ledger-live/pull/19479) [`b2fb16f`](https://github.com/LedgerHQ/ledger-live/commit/b2fb16f638664489876887ceb5d8a4391740044e) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Wire real private sync into the Aleo mandatory private sync screen, replacing the fixed 2s mock delay with an actual refresh of unspentPrivateRecords before a private send

- [#19571](https://github.com/LedgerHQ/ledger-live/pull/19571) [`436ca20`](https://github.com/LedgerHQ/ledger-live/commit/436ca200aff90b95d701a9fe1b15b0e8db2e010f) Thanks [@sarneijim](https://github.com/sarneijim)! - Backfill missing onboarding date to enforce large-screen upsell cooldown

- [#19513](https://github.com/LedgerHQ/ledger-live/pull/19513) [`6e7c51a`](https://github.com/LedgerHQ/ledger-live/commit/6e7c51a179119ca0cb183c8d359291dd2400538b) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add `@features/flow-card` package with `CardScreen` component integrated into the PayTab on desktop and mobile.

- [#19275](https://github.com/LedgerHQ/ledger-live/pull/19275) [`2c79418`](https://github.com/LedgerHQ/ledger-live/commit/2c794187db6994e7d6941956fd465e0472a46047) Thanks [@sarneijim](https://github.com/sarneijim)! - Support token asset detail deeplinks safely: parse and sanitize market/asset deeplink URLs (preserving token id case and avoiding ReDoS)

- [#19350](https://github.com/LedgerHQ/ledger-live/pull/19350) [`39fd558`](https://github.com/LedgerHQ/ledger-live/commit/39fd5588b96d3bb7b3492a4eaaebf273804f36a0) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix: aleo fmt

- [#19363](https://github.com/LedgerHQ/ledger-live/pull/19363) [`e2beecc`](https://github.com/LedgerHQ/ledger-live/commit/e2beecc4863ba4bb3a2e6f19b81946513c6d0863) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - Fix iOS errors by polyfilling AbortSignal.throwIfAborted

- [#19381](https://github.com/LedgerHQ/ledger-live/pull/19381) [`d3ae2f5`](https://github.com/LedgerHQ/ledger-live/commit/d3ae2f5206f62ceeb6818cc8bb69c215cfa1e0c5) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - feat(mobile): add Pay tab to main navigation bar (Wallet 4.0) behind `lwmPayTab` feature flag

- [#19298](https://github.com/LedgerHQ/ledger-live/pull/19298) [`43d4872`](https://github.com/LedgerHQ/ledger-live/commit/43d487261dfb0681b561e4b114b2179acba5e2a8) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: aleo mobile send flow customization

- [#19265](https://github.com/LedgerHQ/ledger-live/pull/19265) [`3de7f74`](https://github.com/LedgerHQ/ledger-live/commit/3de7f742e33df3a973cc9ac4a9327386bfbd8381) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Improve mobile content card QA diagnostics and debug card handling

- [#19354](https://github.com/LedgerHQ/ledger-live/pull/19354) [`0ed0273`](https://github.com/LedgerHQ/ledger-live/commit/0ed0273aec17d8aafa846ae5456d196728259903) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - add a private/public transaction type badge to Aleo operation status icons on mobile

### Patch Changes

- Updated dependencies [[`4b73f23`](https://github.com/LedgerHQ/ledger-live/commit/4b73f23260ecc28574f46a7fd0f5cd7627d6d13f), [`8f30c75`](https://github.com/LedgerHQ/ledger-live/commit/8f30c75ecb553a720722f1e039b4aec53fce2a87), [`25fd71b`](https://github.com/LedgerHQ/ledger-live/commit/25fd71b4caaa8781101dad205669773b234d86c0), [`9824fc8`](https://github.com/LedgerHQ/ledger-live/commit/9824fc8e03b55afe020e87a7f55fe44104f69e1b), [`0f85077`](https://github.com/LedgerHQ/ledger-live/commit/0f850774ae3b46fd4a06c0da5762d3d4211b26af), [`e478b6e`](https://github.com/LedgerHQ/ledger-live/commit/e478b6ee02a1ef105f07b2ba0d1f04292855bc91), [`c75213b`](https://github.com/LedgerHQ/ledger-live/commit/c75213b0c649cc0acfdbabacd62e07848ccee842), [`e379f4d`](https://github.com/LedgerHQ/ledger-live/commit/e379f4d8176d823d068b34d0249e5cb2fe48d0ce), [`a15b864`](https://github.com/LedgerHQ/ledger-live/commit/a15b864576d901f15d480070b475314c3b23c1dd), [`681cd06`](https://github.com/LedgerHQ/ledger-live/commit/681cd06095cd2aa3f6cbaa7305e4437cde9ee241), [`5bada3c`](https://github.com/LedgerHQ/ledger-live/commit/5bada3c49491daa95ee59cf06df1022141b864a2), [`45584e4`](https://github.com/LedgerHQ/ledger-live/commit/45584e4b87ad8ffea9a0e6ba48e196d14164c84a), [`d7ce552`](https://github.com/LedgerHQ/ledger-live/commit/d7ce5521ad9fa82427ef0f9996c1c657c0709e7a), [`e26e68e`](https://github.com/LedgerHQ/ledger-live/commit/e26e68e854ecea6ebbe5e26196c8d8e899329c7d), [`195c4e2`](https://github.com/LedgerHQ/ledger-live/commit/195c4e25777f61652cbad9bfb6ff9a9d8a908419), [`bc0573e`](https://github.com/LedgerHQ/ledger-live/commit/bc0573e3bf73e47ad4f8a58e228a3e11e0866e6e), [`fad98a1`](https://github.com/LedgerHQ/ledger-live/commit/fad98a1d33675605d646959a1b1a2b648b2f59f2), [`293720f`](https://github.com/LedgerHQ/ledger-live/commit/293720fb12143028da875fb1d2e169d2bacc6e57), [`e89bc86`](https://github.com/LedgerHQ/ledger-live/commit/e89bc86cc3daa0e38c43fbd933c233c840a9a657), [`5890c95`](https://github.com/LedgerHQ/ledger-live/commit/5890c951b33708923b6ae646ec5a2ea278f6982f), [`ea792bc`](https://github.com/LedgerHQ/ledger-live/commit/ea792bc06b9eb9931d75823bff63186202d3e2de), [`75a33a8`](https://github.com/LedgerHQ/ledger-live/commit/75a33a8ef74a6eef6236bb5db873cadd35643705), [`2d58d35`](https://github.com/LedgerHQ/ledger-live/commit/2d58d3505af6592b25be177ea05c56ecc561d422), [`47b8889`](https://github.com/LedgerHQ/ledger-live/commit/47b8889b362204d565b0ad06c8862cdb9bf048b7), [`bde85a7`](https://github.com/LedgerHQ/ledger-live/commit/bde85a7ef50cf7990efd2f9bcd7ccc34c0764fb7), [`2b4a016`](https://github.com/LedgerHQ/ledger-live/commit/2b4a016a8c2f2a635c50928bb2f78b63d96ff67f), [`bae43dd`](https://github.com/LedgerHQ/ledger-live/commit/bae43ddc50439d2a7f18852f2b727e24de0169ed), [`d3862bb`](https://github.com/LedgerHQ/ledger-live/commit/d3862bb82e8084b624f65ef6d22d3eb151e0f18f), [`07c4724`](https://github.com/LedgerHQ/ledger-live/commit/07c47249db7aa923af0a29a6dc8fb0c0264a08c7), [`47b8889`](https://github.com/LedgerHQ/ledger-live/commit/47b8889b362204d565b0ad06c8862cdb9bf048b7), [`996c76b`](https://github.com/LedgerHQ/ledger-live/commit/996c76b157553c547f83d877d25199b311ee0f63), [`68dffc1`](https://github.com/LedgerHQ/ledger-live/commit/68dffc18a73915e67739b9206112233574358304), [`b48b348`](https://github.com/LedgerHQ/ledger-live/commit/b48b3485eb7ddbc6733435099b39fa641bfad8d1), [`9479c28`](https://github.com/LedgerHQ/ledger-live/commit/9479c284321915f7d5139746f3f924b1ad2685c3), [`682c34b`](https://github.com/LedgerHQ/ledger-live/commit/682c34b48b800e4963a06e2731ff16d116af42f9), [`446e2b8`](https://github.com/LedgerHQ/ledger-live/commit/446e2b80847623efba039a44eb8dea1b6f395c69), [`083452c`](https://github.com/LedgerHQ/ledger-live/commit/083452c72359a52c363e7de95e53b98f0c6ed906), [`3fc5836`](https://github.com/LedgerHQ/ledger-live/commit/3fc583609116bcf40956ccafeaadc733e11040b0), [`2ee5ac1`](https://github.com/LedgerHQ/ledger-live/commit/2ee5ac15540a462143b61f2d546063ed9c8cfe40), [`2f7619d`](https://github.com/LedgerHQ/ledger-live/commit/2f7619dc269329c581c83ce982ddd4bc6e3c9abe), [`07bfc2c`](https://github.com/LedgerHQ/ledger-live/commit/07bfc2cbcf3c63b55224dec2aef1818d22c2315c), [`16edbea`](https://github.com/LedgerHQ/ledger-live/commit/16edbea121ac5c033c185606183c2d857e1debe5), [`2b676ff`](https://github.com/LedgerHQ/ledger-live/commit/2b676ff4d544bc60ae8c2860c0494e6f6d79f85f), [`fcc75ef`](https://github.com/LedgerHQ/ledger-live/commit/fcc75ef6c3e584b5b73b20335af5e6dcb95e73c7), [`3e127f7`](https://github.com/LedgerHQ/ledger-live/commit/3e127f7385f5da907d4a08447c3f7582a9ac4f3f), [`35f0138`](https://github.com/LedgerHQ/ledger-live/commit/35f0138542fbd98f664b24ee786fc662d7223e10), [`452be85`](https://github.com/LedgerHQ/ledger-live/commit/452be85b27378f9240041119296ffa8c580fe071), [`eefaded`](https://github.com/LedgerHQ/ledger-live/commit/eefaded9e81566898f1551e144a805efe60390fe), [`d9dc6e6`](https://github.com/LedgerHQ/ledger-live/commit/d9dc6e621df877b13148688adec0b038983574e0), [`50660af`](https://github.com/LedgerHQ/ledger-live/commit/50660af751c2306802f1fefb2499cbf353f79cc4), [`94b454b`](https://github.com/LedgerHQ/ledger-live/commit/94b454bd9676198c49ee4c4c0c49063e87175f70), [`a952f84`](https://github.com/LedgerHQ/ledger-live/commit/a952f84063e5f791b9c757827570d59d048c43bf), [`edc897d`](https://github.com/LedgerHQ/ledger-live/commit/edc897d25e91f426065ce4eab89882192cb1327c), [`ff9d1d2`](https://github.com/LedgerHQ/ledger-live/commit/ff9d1d29fbc3d6a4d75e3ca145e3a9df0dda50c5), [`fc44f1e`](https://github.com/LedgerHQ/ledger-live/commit/fc44f1e6ddcca939c117e0cb8bc49c404163b003), [`d631f0d`](https://github.com/LedgerHQ/ledger-live/commit/d631f0dd2480950c5f20dec0c9b4aca515ec63f8), [`ddc6499`](https://github.com/LedgerHQ/ledger-live/commit/ddc6499ebc483a853d82ca3c00d0927169c8e0ed), [`fd9da5e`](https://github.com/LedgerHQ/ledger-live/commit/fd9da5e2b3a1e5300d012b826f3707535d07b1d9), [`0b48c73`](https://github.com/LedgerHQ/ledger-live/commit/0b48c737ee15bc74cfd60fdbdba5269eacefb136), [`deaa7ba`](https://github.com/LedgerHQ/ledger-live/commit/deaa7ba622776b95b87aee9926b34e20a0dc818b), [`6e7c51a`](https://github.com/LedgerHQ/ledger-live/commit/6e7c51a179119ca0cb183c8d359291dd2400538b), [`c12485a`](https://github.com/LedgerHQ/ledger-live/commit/c12485ab346a02db79d864e8ecf7837d724a4575), [`6ef44af`](https://github.com/LedgerHQ/ledger-live/commit/6ef44afa6807ace32b3f6620173868f2ef20e158), [`6ef44af`](https://github.com/LedgerHQ/ledger-live/commit/6ef44afa6807ace32b3f6620173868f2ef20e158), [`8238860`](https://github.com/LedgerHQ/ledger-live/commit/8238860c893b0688d2c59a3e042d7a227031547a)]:
  - @ledgerhq/coin-bitcoin@0.47.0-next.0
  - @ledgerhq/coin-canton@0.29.0-next.0
  - @ledgerhq/coin-casper@2.16.0-next.0
  - @ledgerhq/coin-concordium@0.16.0-next.0
  - @ledgerhq/coin-cosmos@0.39.0-next.0
  - @ledgerhq/coin-evm@4.6.0-next.0
  - @ledgerhq/coin-filecoin@1.28.0-next.0
  - @ledgerhq/coin-multiversx@0.20.0-next.0
  - @ledgerhq/coin-stacks@0.24.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.4.0-next.0
  - @ledgerhq/cryptoassets@13.55.0-next.0
  - @shared/feature-flags@0.14.0-next.0
  - @features/flow-contacts@0.2.0-next.0
  - @ledgerhq/live-env@2.42.0-next.0
  - @domain/api-pay-card@0.2.0-next.0
  - @domain/entity-pay-card@0.2.0-next.0
  - @features/flow-card@0.2.0-next.0
  - @domain/entity-contact@0.2.0-next.0
  - @ledgerhq/types-live@6.115.0-next.0
  - @ledgerhq/live-engagement@0.1.0-next.0
  - @domain/entity-currency-crypto@0.6.0-next.0
  - @domain/entity-currency-fiat@0.3.0-next.0
  - @ledgerhq/live-wallet@0.29.0-next.0
  - @ledgerhq/ledger-key-ring-protocol@0.17.0-next.0
  - @devtools/bindings@0.2.0-next.0
  - @ledgerhq/live-currency-format@0.13.0-next.0
  - @domain/entity-altcoins-sentiment@0.2.0-next.0
  - @domain/entity-market-sentiment@0.2.0-next.0
  - @domain/api-altcoins-sentiment@0.2.0-next.0
  - @features/flow-fear-and-greed@0.2.0-next.0
  - @domain/api-market-sentiment@0.2.0-next.0
  - @features/platform-currencies@0.3.0-next.0
  - @ledgerhq/live-countervalues@0.22.1-next.0
  - @ledgerhq/live-countervalues-react@0.16.2-next.0
  - @ledgerhq/wallet-analytics@0.2.1-next.0
  - @ledgerhq/wallet-pnl@0.7.2-next.0
  - @features/platform-feature-flags@0.6.1-next.0
  - @ledgerhq/hw-ledger-key-ring-protocol@0.11.1-next.0
  - @ledgerhq/live-dmk-mobile@0.28.1-next.0
  - @ledgerhq/live-dmk-speculos@0.10.2-next.0
  - @ledgerhq/live-network@2.6.8-next.0
  - @ledgerhq/domain-service@1.8.10-next.0
  - @domain/api-currency-token@0.2.1-next.0
  - @domain/api-currency-fiat@0.2.1-next.0
  - @devtools/shell@0.5.1-next.0

## 4.11.0

### Minor Changes

- [#19030](https://github.com/LedgerHQ/ledger-live/pull/19030) [`9af0e8a`](https://github.com/LedgerHQ/ledger-live/commit/9af0e8a926ac4d0c7b7dccd43c0d913b3d805f42) Thanks [@mitchellv-ledger](https://github.com/mitchellv-ledger)! - Fix hasEnabledOsNotifications being intermittently tracked as false after the user enabled OS notifications

- [#19029](https://github.com/LedgerHQ/ledger-live/pull/19029) [`a832b69`](https://github.com/LedgerHQ/ledger-live/commit/a832b69720b286c106002c5ef8b6742c76900b30) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - selfTransfer button for Aleo (without any logic)

- [#19180](https://github.com/LedgerHQ/ledger-live/pull/19180) [`343208d`](https://github.com/LedgerHQ/ledger-live/commit/343208d92d0ca0d6b0c23e1c4df39a6e8cf43463) Thanks [@Valentin-Ledger](https://github.com/Valentin-Ledger)! - Update borrow entry point copy and icon in Portfolio, and move the borrow section into the Wallet Assets group on mobile

- [#18987](https://github.com/LedgerHQ/ledger-live/pull/18987) [`98ee95c`](https://github.com/LedgerHQ/ledger-live/commit/98ee95c139df6ecbaa9b5198a4e7dee3a2d0cad4) Thanks [@Valentin-Ledger](https://github.com/Valentin-Ledger)! - Add `borrowFeature` analytics property derived from the `ptxBorrowLiveApp` feature flag, included in identify traits and track events on both desktop and mobile.

- [#19079](https://github.com/LedgerHQ/ledger-live/pull/19079) [`b713054`](https://github.com/LedgerHQ/ledger-live/commit/b713054cc2170462f8c1bdef709c3379da6a8048) Thanks [@Valentin-Ledger](https://github.com/Valentin-Ledger)! - Forward device safe-area insets (top/bottom/left/right) as query params to the Borrow live app webview so the embedded app can offset notches and the home indicator, and add a safe-area-aware bottom padding to the Borrow card on the Portfolio screen when the operations list owns the screen footer.

- [#19101](https://github.com/LedgerHQ/ledger-live/pull/19101) [`4b615c2`](https://github.com/LedgerHQ/ledger-live/commit/4b615c242a3b4d8ecb2ebf4e039a46e2bbfe5e19) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(lwdm): fix countervalue magnitude in the new send flow

- [#19015](https://github.com/LedgerHQ/ledger-live/pull/19015) [`a2621e2`](https://github.com/LedgerHQ/ledger-live/commit/a2621e2c6c6369c7109af72e1cb59df2448951ff) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - feat: lwm ledger sync feature flag clean up

- [#19087](https://github.com/LedgerHQ/ledger-live/pull/19087) [`b98cce3`](https://github.com/LedgerHQ/ledger-live/commit/b98cce3ff564ab8499876b124a4a5f3a08e0066f) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Use the node's min relay fee as the minimum for manual Bitcoin-family fees in the send flow (BTC falls back to 1 sat/vB). A fee below it is now rejected in the form instead of at broadcast.

- [#19142](https://github.com/LedgerHQ/ledger-live/pull/19142) [`2abe834`](https://github.com/LedgerHQ/ledger-live/commit/2abe834cc3ef112824e5ecc0c10162bb46625cad) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add Lumen portfolio chart to mobile Analytics when PnL is enabled, with balance header and range-aware variation (first receive baseline for all-time).

- [#18910](https://github.com/LedgerHQ/ledger-live/pull/18910) [`b73e553`](https://github.com/LedgerHQ/ledger-live/commit/b73e553930d0c8365a15d3dc8ee7dda40f57f836) Thanks [@deepyjr](https://github.com/deepyjr)! - Set the Wallet 4.0 portfolio balance amount display to small for long balances.

- [#18854](https://github.com/LedgerHQ/ledger-live/pull/18854) [`f1f4094`](https://github.com/LedgerHQ/ledger-live/commit/f1f4094474e77101d37045ceced1d10d1f3632c8) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Fix analytics consent privacy policy footer link wrapping with inline Trans markup

- [#19627](https://github.com/LedgerHQ/ledger-live/pull/19627) [`8e3b521`](https://github.com/LedgerHQ/ledger-live/commit/8e3b521c9604cf0b753f056a2c65556d9f91ae79) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Merge release branch into hotfix support branch, resolving version and changelog conflicts

- [#18917](https://github.com/LedgerHQ/ledger-live/pull/18917) [`3b9ad8e`](https://github.com/LedgerHQ/ledger-live/commit/3b9ad8e33408679af1a3737c6cb3a2473a044c07) Thanks [@YazhuEth](https://github.com/YazhuEth)! - celo: deprecate the "Ledger by Figment" validator. It is no longer shown or selectable in the vote flow and is never the default — the validator list is now ranked by TVL with none selected by default. Existing delegations remain fully manageable (unvote / unlock / withdraw).

- [#18856](https://github.com/LedgerHQ/ledger-live/pull/18856) [`c0c3a63`](https://github.com/LedgerHQ/ledger-live/commit/c0c3a63f631f2806829038faab342dc8888c3451) Thanks [@dilaouid](https://github.com/dilaouid)! - chore(lwdm): remove all evm mention in the new send flow

- [#19231](https://github.com/LedgerHQ/ledger-live/pull/19231) [`70a706e`](https://github.com/LedgerHQ/ledger-live/commit/70a706e4efe3a6fa176f9827a4a06949ba185f11) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Remove unused USE_LEARN_STAGING_URL env var

- [#18887](https://github.com/LedgerHQ/ledger-live/pull/18887) [`8b6614e`](https://github.com/LedgerHQ/ledger-live/commit/8b6614eaff423aaeb50b7eb44ba5916a941a573d) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Remove the `concordiumVerifyAddress` feature flag and its "address verification unavailable" fallback. On-device address verification is now the unconditional path for all Concordium accounts.

- [#19324](https://github.com/LedgerHQ/ledger-live/pull/19324) [`5c5064f`](https://github.com/LedgerHQ/ledger-live/commit/5c5064f76ac922bb57dc8f7cbacc27c2acb7bb00) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Resolve crypto counter-values by Ledger id instead of ticker, and migrate existing users' persisted crypto counterValue (BTC/ETH) to ids. Fiats keep ticker-based resolution.

- [#19256](https://github.com/LedgerHQ/ledger-live/pull/19256) [`7a3c4a5`](https://github.com/LedgerHQ/ledger-live/commit/7a3c4a5a2dd0c1ca7382d4bc9c27d2e3bfc671a9) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - private sync for mobile Aleo part 1

- [#19037](https://github.com/LedgerHQ/ledger-live/pull/19037) [`e1dfe0d`](https://github.com/LedgerHQ/ledger-live/commit/e1dfe0d51cac5eb463eb31aff52311467803f994) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: mobile operation details parser for aleo

- [#19062](https://github.com/LedgerHQ/ledger-live/pull/19062) [`5ccd2a9`](https://github.com/LedgerHQ/ledger-live/commit/5ccd2a9c229e8007851c6eb8b01c866c8e605932) Thanks [@abdurrahman-ledger](https://github.com/abdurrahman-ledger)! - Extract E2E test-support code out of `@ledgerhq/live-common`

  Moved the E2E enums, models, family helpers and speculos/device utilities that lived under
  `@ledgerhq/live-common/e2e/*` into a new dedicated, private package `@ledgerhq/live-e2e-shared`
  (located under `e2e/`, alongside the Desktop and Mobile E2E suites). This keeps test-only code
  out of `live-common`, which is in maintenance mode.

  - `@ledgerhq/live-common`: removed the internal `./e2e` export.
  - `@shared/feature-flags`: now exports `getAllFeatureFlags` (previously in the live-common e2e
    module), so production debug tooling no longer depends on test code.
  - `ledger-live-desktop`: the `devices` reducer now derives the Speculos device model from a small
    local map instead of importing from the e2e module.
  - Desktop/Mobile apps and E2E suites now import from `@ledgerhq/live-e2e-shared`.

- [#19184](https://github.com/LedgerHQ/ledger-live/pull/19184) [`6400154`](https://github.com/LedgerHQ/ledger-live/commit/6400154daa131b225c6ec62c9134f1cd06370729) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Promote the EVM edit-transaction (speed-up / cancel) helpers to the bridge contract.

  `AccountBridgeExtensions` is now generic over the transaction type and exposes the app-facing edit-transaction methods (`getEditTransactionPatch`, `getEditTransactionStatus`, `getFormattedFeeFields`, `hasMinimumFundsToCancel`, `hasMinimumFundsToSpeedUp`, `isStrategyDisabled`, `isTransactionConfirmed`). The implementations move out of `@ledgerhq/coin-evm` into `ledger-live-common` (`families/evm`), and every app/LLC call site now reaches them through `getAccountBridge(account)` instead of importing `@ledgerhq/coin-evm/editTransaction/*`. The contract uses only base types so other families (e.g. Bitcoin RBF) can implement the same surface later.

- [#18795](https://github.com/LedgerHQ/ledger-live/pull/18795) [`fae5dd7`](https://github.com/LedgerHQ/ledger-live/commit/fae5dd758a69eba05f400fb66d526196b9ff6225) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwm): remove step signature

- [#18630](https://github.com/LedgerHQ/ledger-live/pull/18630) [`e6566ff`](https://github.com/LedgerHQ/ledger-live/commit/e6566ff55d95ff36832d5f77899d67d80842f418) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - [LWM] feat(mobile): add tracking part 1

- [#18934](https://github.com/LedgerHQ/ledger-live/pull/18934) [`edebe91`](https://github.com/LedgerHQ/ledger-live/commit/edebe91895773e4e2c9f29bc0a991885d2f44a77) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwdm): restore recent address store for lwdm

- [#19220](https://github.com/LedgerHQ/ledger-live/pull/19220) [`996c76b`](https://github.com/LedgerHQ/ledger-live/commit/996c76b157553c547f83d877d25199b311ee0f63) Thanks [@ysitbon](https://github.com/ysitbon)! - Make the `@ledgerhq/cryptoassets` fiat registry injectable (`setFiatCurrenciesStore`) and inject the `@domain/entity-currency-fiat` registry at each app's bootstrap, so the domain registry is the single runtime source of truth for fiat currency data. The bundled fiat list stays as the fallback and is kept in sync by the existing parity test.

- [#19220](https://github.com/LedgerHQ/ledger-live/pull/19220) [`2ac4833`](https://github.com/LedgerHQ/ledger-live/commit/2ac4833b004b8b818cf7eb4d32abcd8dd3b0fc4a) Thanks [@ysitbon](https://github.com/ysitbon)! - Add supported-fiats RTK slice to @domain/entity-currency-fiat; wire currencyFiatApi onQueryStarted to dispatch it; register currencyFiatApi in desktop and mobile stores with cvsApiExtra extraArgument composition.

- [#19141](https://github.com/LedgerHQ/ledger-live/pull/19141) [`2caa65c`](https://github.com/LedgerHQ/ledger-live/commit/2caa65c2ada66ef20c76950b5a2b01c49845f8eb) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Fix content card displayedPosition analytics by stripping Braze string values in sanitizeExtras and finalizing numeric indices at the tracking gateway (mobile trackContentCardEvent, desktop trackContentCard) instead of at each call site.

- [#18034](https://github.com/LedgerHQ/ledger-live/pull/18034) [`b5e3155`](https://github.com/LedgerHQ/ledger-live/commit/b5e31556d03e97ca0d28c28da52849399fc8e8fd) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Fix the Swap history "Previous" button playing the forward (push) transition instead of the back (pop) one in Wallet 4.0. The history sub-screen is pushed on top of Main, so we now pop the parent navigator instead of resetting it, restoring the correct left-to-right back animation.

- [#18786](https://github.com/LedgerHQ/ledger-live/pull/18786) [`8d7f2b3`](https://github.com/LedgerHQ/ledger-live/commit/8d7f2b3d517780578799cc83152f6434381b2e26) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Fix top_wallet content card canvas_name and canvas_step_name tracking

- [#18484](https://github.com/LedgerHQ/ledger-live/pull/18484) [`ed4e13f`](https://github.com/LedgerHQ/ledger-live/commit/ed4e13f51245b8677b953fbafc610a03d17cce40) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Fix top_wallet content card tracking location (page/location) for contentcard click & dismiss events

- [#18996](https://github.com/LedgerHQ/ledger-live/pull/18996) [`3f92956`](https://github.com/LedgerHQ/ledger-live/commit/3f92956edf8c9439b22464a2eb608c68dde49012) Thanks [@deepyjr](https://github.com/deepyjr)! - Add Mobile transaction history dust filtering controls behind a feature flag.

- [#19272](https://github.com/LedgerHQ/ledger-live/pull/19272) [`e2d74f7`](https://github.com/LedgerHQ/ledger-live/commit/e2d74f7c5fe9883d6a141ce790a0b0aa92d7e53a) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-evm): raise an error if gas price is less than the network minimum

- [#19036](https://github.com/LedgerHQ/ledger-live/pull/19036) [`addef52`](https://github.com/LedgerHQ/ledger-live/commit/addef52ed445008c16e3f94d66f46222c8c535f7) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - remove marketbanner param from wallet4.0 FF

- [#19063](https://github.com/LedgerHQ/ledger-live/pull/19063) [`eab9b13`](https://github.com/LedgerHQ/ledger-live/commit/eab9b130e0a809d6dead08bbd1a588112da94e0c) Thanks [@dilaouid](https://github.com/dilaouid)! - chore(llc): refactor useFeePresetFiatValues to use in both LWDM

- [#18931](https://github.com/LedgerHQ/ledger-live/pull/18931) [`c20552b`](https://github.com/LedgerHQ/ledger-live/commit/c20552bb6cea8f1049521e0a65198e558a677e96) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Global Search now surfaces testnets when developer mode is enabled, mirroring the Receive flow's DADA query logic (`includeTestNetworks` + staging environment). Fixes LIVE-33199.

- [#17924](https://github.com/LedgerHQ/ledger-live/pull/17924) [`b5562ca`](https://github.com/LedgerHQ/ledger-live/commit/b5562cafc88195790dcc3377f686a288d66e429f) Thanks [@iqbalibrahim-ledger](https://github.com/iqbalibrahim-ledger)! - [LIVE-30528] Unnest FlatList in SelectableAccountsList to fix account rows disappearing on the "Select the accounts you want to add" screen after RN 0.81 / React 19 upgrade.

- [#18953](https://github.com/LedgerHQ/ledger-live/pull/18953) [`81373c1`](https://github.com/LedgerHQ/ledger-live/commit/81373c1ca46cf2094cfd4f98958eff2114f02cea) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - opt-in notification feature flag clean up

- [#19088](https://github.com/LedgerHQ/ledger-live/pull/19088) [`6d8f705`](https://github.com/LedgerHQ/ledger-live/commit/6d8f705939f710f2533cc20158aac452601f2702) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Add view key warning screen to Aleo add-account flow on mobile

- [#18837](https://github.com/LedgerHQ/ledger-live/pull/18837) [`cdcbce9`](https://github.com/LedgerHQ/ledger-live/commit/cdcbce9fc9a677bbdfe9276681e3f64da447877d) Thanks [@mitchellv-ledger](https://github.com/mitchellv-ledger)! - Migrate DesyncOverlay to mvvm in lwm

- [#18981](https://github.com/LedgerHQ/ledger-live/pull/18981) [`ac5a7fa`](https://github.com/LedgerHQ/ledger-live/commit/ac5a7fa58cf47e89d84d478e7386ceb69ce5ca00) Thanks [@koda-apps](https://github.com/apps/koda-apps)! - Fix Large Movers supply values showing duplicated ticker and missing space between value and ticker.

- [#19072](https://github.com/LedgerHQ/ledger-live/pull/19072) [`cca8dc3`](https://github.com/LedgerHQ/ledger-live/commit/cca8dc34720c50c35b9bbb662b7e612d2d184bfa) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove the WalletTabNavigator: with the Market tab gone, the wallet tab was a navigator wrapping a single Portfolio screen. The Portfolio screen is now rendered directly under the `ScreenName.Portfolio` route via the new `PortfolioRootScreen` wrapper (which keeps the portfolio chrome — header, gradient, balance sync, scroll manager), and the route is reclassified from a `NavigatorName` to the existing `ScreenName.Portfolio` screen. Also removes the dead `NavigatorName.Market` references left under the wallet tab (param list, deeplink linking config, transfer drawer analytics), routes the bare `market` deeplink fallbacks through `handleMarketBannerDeeplink`, and renames the `navigateToPortfolioWalletTab` helper to `navigateToPortfolio`.

- [#18965](https://github.com/LedgerHQ/ledger-live/pull/18965) [`cc01b77`](https://github.com/LedgerHQ/ledger-live/commit/cc01b777c9b54ccf2a9f2b34f0281d3d7123b157) Thanks [@ishaba](https://github.com/ishaba)! - perf(sui): populate staking extras at sync, drop per-drawer transaction(digest:) re-fetch

- [#19007](https://github.com/LedgerHQ/ledger-live/pull/19007) [`f495213`](https://github.com/LedgerHQ/ledger-live/commit/f495213e811477c99d62f0d93cc7c513b951a303) Thanks [@ysitbon](https://github.com/ysitbon)! - Inject the domain-backed crypto-currency registry (`@domain/entity-currency-crypto`) at app bootstrap via `setCryptoCurrenciesStore`, making the domain registry the runtime source of truth for currency data. The bundled data in `@ledgerhq/cryptoassets` stays as the fallback.

- [#18568](https://github.com/LedgerHQ/ledger-live/pull/18568) [`6ddd641`](https://github.com/LedgerHQ/ledger-live/commit/6ddd64113a4c360a091fc1fd54256cfabaab5220) Thanks [@gre-ledger](https://github.com/gre-ledger)! - feat(lkrp): per-application close on Wallet Sync deactivation

  Deactivating Wallet Sync now closes only the current application's stream instead of destroying the whole trustchain root, so other applications sharing the same root (e.g. wallet-cli `ring`) keep working. If the application being closed is the last open one, the whole trustchain is still destroyed (previous behaviour).

  - `CommandStreamResolver` now observes `CloseStream` (`ResolvedCommandStream.isClosed()`).
  - `StreamTree.getApplicationStreams()` / `hasAnotherOpenApplication()` enumerate application streams to detect the last open application.
  - New `TrustchainSDK.destroyApplication()` primitive, software-key signed (no hardware device): closes only the current application's stream, or destroys the whole trustchain when it is the last open application (`{ trustchainDestroyed }`).
  - `restoreTrustchain` throws `TrustchainEjected` when the application stream is closed, and `getOrCreateTrustchain` reopens on the next index after a close.
  - LLD/LLM `useDestroyTrustchain` hooks now call `destroyApplication`.
  - web-tools trustchain playground exposes a `sdk.destroyApplication` action to exercise the per-application close.

- [#19181](https://github.com/LedgerHQ/ledger-live/pull/19181) [`d23bb3e`](https://github.com/LedgerHQ/ledger-live/commit/d23bb3e59a2180d660c1636ede1143329a0ddff0) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Bump Lumen design-system dependencies to the 6/26/2026 release

- [#18960](https://github.com/LedgerHQ/ledger-live/pull/18960) [`79e28d5`](https://github.com/LedgerHQ/ledger-live/commit/79e28d5ed0d878e3b7b884ebb8c3f219b58bf971) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Only show the Robinhood disclaimer banner on the Wallet 4.0 asset detail screen when the user holds a positive balance for the asset, matching the desktop behaviour and the LIVE-32756 spec (LIVE-32758).

- [#17458](https://github.com/LedgerHQ/ledger-live/pull/17458) [`8a9a49b`](https://github.com/LedgerHQ/ledger-live/commit/8a9a49b9836a14c1477782af2565efe32cfd0244) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Add the mobile swap transaction status drawer with provider details, status tracking, and explorer links.

- [#18864](https://github.com/LedgerHQ/ledger-live/pull/18864) [`a4f9955`](https://github.com/LedgerHQ/ledger-live/commit/a4f9955b6cdedfb8d30644bcc074c96e1c20c873) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Add mobile swap transaction status drawer infrastructure.

- [#19023](https://github.com/LedgerHQ/ledger-live/pull/19023) [`3f71b7a`](https://github.com/LedgerHQ/ledger-live/commit/3f71b7af8419e92e907be029b7fed052288561b7) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Monad staking: pin the Ledger validator ("Ledger by P2P.org") to the top of the validator list so it is selected by default when delegating

- [#18633](https://github.com/LedgerHQ/ledger-live/pull/18633) [`e9b1707`](https://github.com/LedgerHQ/ledger-live/commit/e9b17073cdf3266692adc4348c9a54f5597da4c8) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwdm): move the Celo "Pay fees in" selector from the Amount step to the Custom fees step using a generic, family-agnostic fee asset descriptor

- [#17564](https://github.com/LedgerHQ/ledger-live/pull/17564) [`babad68`](https://github.com/LedgerHQ/ledger-live/commit/babad685139d06343f6a647686c713992ad1ac1a) Thanks [@dilaouid](https://github.com/dilaouid)! - tests(e2e): add detox for evm native staking (sei_evm) and mock smoke under `apps/ledger-live-mobile/e2e` and Speculos delegate flow under `e2e/mobile`

- [#19187](https://github.com/LedgerHQ/ledger-live/pull/19187) [`0e30cdc`](https://github.com/LedgerHQ/ledger-live/commit/0e30cdc29d7fb3cab5bf1f2ef7c24cf0a152516e) Thanks [@sarneijim](https://github.com/sarneijim)! - Persist onboardingDate in the shared post-onboarding store to power the post-onboarding upsell cooldown. It is preserved when reopening or hiding the wallet entry point for the same device, refreshed when a different device is onboarded, and backfilled to today once for legacy users on first launch.

- [#18891](https://github.com/LedgerHQ/ledger-live/pull/18891) [`b10ca6a`](https://github.com/LedgerHQ/ledger-live/commit/b10ca6ab5e80889b24805b460f81eff5748f0170) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - flexibleContentCards feature flag cleanup

- [#19246](https://github.com/LedgerHQ/ledger-live/pull/19246) [`bfcf591`](https://github.com/LedgerHQ/ledger-live/commit/bfcf591cc51b3db6e45022d46a2a278584a75ec7) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(lwm): fix wording signature lwm

- [#18906](https://github.com/LedgerHQ/ledger-live/pull/18906) [`df96477`](https://github.com/LedgerHQ/ledger-live/commit/df964774bdaccd897e5e7414c172e9c26ff21f67) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Add `getProductName` to `@ledgerhq/devices` returning the plain, canonical device product name (e.g. "Ledger Flex"), and deprecate the app-level `getProductName` utils that strip the "Ledger" prefix.

- [#18858](https://github.com/LedgerHQ/ledger-live/pull/18858) [`583dd79`](https://github.com/LedgerHQ/ledger-live/commit/583dd79cec1711c28f2034eae1c081977e498260) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Remove address suggestions from the new send flow recipient screen, while keeping the first-seen-address warning

- [#18904](https://github.com/LedgerHQ/ledger-live/pull/18904) [`a84a1ca`](https://github.com/LedgerHQ/ledger-live/commit/a84a1ca609d2048b9896a1f75fcc531e099165e9) Thanks [@deepyjr](https://github.com/deepyjr)! - Fix slow mobile transition from Discover catalog to Wallet.

- [#19102](https://github.com/LedgerHQ/ledger-live/pull/19102) [`f559623`](https://github.com/LedgerHQ/ledger-live/commit/f55962376b0b117fd957ca073e3dafbaa1eaf77e) Thanks [@sarneijim](https://github.com/sarneijim)! - Fix duplicate `contentcard_impression` events: keep `InViewContext` visibility memory keyed by the stable target ref so impressions no longer re-fire when a content card re-subscribes (e.g. carousel rebuilding its items) while still in view

- [#19000](https://github.com/LedgerHQ/ledger-live/pull/19000) [`5d4cc7a`](https://github.com/LedgerHQ/ledger-live/commit/5d4cc7a8056d3f8ad59058091d4378328a960468) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Translate the "To:" prefix label in the new Send flow recipient input

- [#19009](https://github.com/LedgerHQ/ledger-live/pull/19009) [`1f25437`](https://github.com/LedgerHQ/ledger-live/commit/1f254373fedec85e50364fdbc6bb9ec4fd5256b2) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Track Funds received analytics when a new receive operation is synced on desktop and mobile.

- [#18962](https://github.com/LedgerHQ/ledger-live/pull/18962) [`cf3aad1`](https://github.com/LedgerHQ/ledger-live/commit/cf3aad160bd9d2002a3154fbc70018fb1f7a6171) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Remove llmRebornABtest feature flag and legacy NoLedgerYetModal onboarding path

- [#18855](https://github.com/LedgerHQ/ledger-live/pull/18855) [`df6ca42`](https://github.com/LedgerHQ/ledger-live/commit/df6ca422fa70171162974ea71519da5c5eeb55d8) Thanks [@sarneijim](https://github.com/sarneijim)! - Remove the `llmRebornLP` feature flag (always enabled with variant A) and inline the enabled behavior

- [#19008](https://github.com/LedgerHQ/ledger-live/pull/19008) [`c572468`](https://github.com/LedgerHQ/ledger-live/commit/c572468002ff4ca88c1d22a5f806357e7e07c990) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove the `marketBanner` feature flag gating on mobile so the standalone Market experience and the portfolio market banner are always enabled. Also removes the now-unused `walletTabNavigatorLastVisitedTab` setting that only the tab-based layout relied on.

- [#18932](https://github.com/LedgerHQ/ledger-live/pull/18932) [`628f21f`](https://github.com/LedgerHQ/ledger-live/commit/628f21f5acf7d5866c0c956d41d69c760caf0caa) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add an informational disclaimer banner on the Wallet 4.0 asset detail screen for assets supported exclusively on a Robinhood chain (e.g. tokenized stocks on robinhood_testnet). The banner is gated by the `llRobinhoodDisclaimer` feature flag, which is simplified to a plain boolean flag (its unused `url` param is removed).

- [#18778](https://github.com/LedgerHQ/ledger-live/pull/18778) [`b9ffdc9`](https://github.com/LedgerHQ/ledger-live/commit/b9ffdc91708686ca1d6c126894b9481b0ffb0305) Thanks [@qperrot](https://github.com/qperrot)! - Fix: add a check for minimum staking amount on solana

- [#18928](https://github.com/LedgerHQ/ledger-live/pull/18928) [`b2e12ce`](https://github.com/LedgerHQ/ledger-live/commit/b2e12ce7b72de43efe8c8ff5290d617fff7f8e31) Thanks [@qperrot](https://github.com/qperrot)! - fix(sei): determine Sei EVM account association via on-chain RPC

  `isSeiAccountUnassociated` now resolves whether a Sei EVM (0x) address is linked
  on-chain to its Cosmos (sei1) address by querying the chain's address precompile
  (`getSeiAddr`) instead of inferring it from the local operation history. The
  function is now async and no longer takes an `operations` argument; the delegation
  flow screens (desktop & mobile) resolve the warning asynchronously.

- [#17606](https://github.com/LedgerHQ/ledger-live/pull/17606) [`e82ab44`](https://github.com/LedgerHQ/ledger-live/commit/e82ab440a379cb78187396fe5dd624c0c78aa8fe) Thanks [@iqbalibrahim-ledger](https://github.com/iqbalibrahim-ledger)! - chore(lwm): remove deprecated SafeAreaView

- [#18884](https://github.com/LedgerHQ/ledger-live/pull/18884) [`b534149`](https://github.com/LedgerHQ/ledger-live/commit/b534149608efadef5551f24ee42895e44020b74e) Thanks [@KVNLS](https://github.com/KVNLS)! - Update MMKV to V4 and activate NitroModules

- [#17924](https://github.com/LedgerHQ/ledger-live/pull/17924) [`360cea4`](https://github.com/LedgerHQ/ledger-live/commit/360cea435daf7093d853f4ad6402327c6a285895) Thanks [@iqbalibrahim-ledger](https://github.com/iqbalibrahim-ledger)! - Upgrade React Native to 0.81.6, Expo SDK 54 for LWM; React 19.1.4 for LWM and LWD

- [#19293](https://github.com/LedgerHQ/ledger-live/pull/19293) [`41b8ed7`](https://github.com/LedgerHQ/ledger-live/commit/41b8ed717f6205c50bfe08b72248c67999fac8fc) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Fix BTC fee rate unit label from "sat/bytes" to "sat/vByte"

- [#19176](https://github.com/LedgerHQ/ledger-live/pull/19176) [`16f7a29`](https://github.com/LedgerHQ/ledger-live/commit/16f7a29af078e32cab47a8440952cf42c1a3d92c) Thanks [@ysitbon](https://github.com/ysitbon)! - Register a single crypto-assets token cache per app store, backed by the new domain token api and its persistence, and inject the legacy getCryptoAssetsStore singleton over it. This guarantees one runtime source of token data: the UI and coin-modules share the same cache.

- [#18803](https://github.com/LedgerHQ/ledger-live/pull/18803) [`00cee6f`](https://github.com/LedgerHQ/ledger-live/commit/00cee6fd0e36641d1f40b4363750f3dd233051c1) Thanks [@deepyjr](https://github.com/deepyjr)! - Fix PnL card title wrapping on mobile

- [#19034](https://github.com/LedgerHQ/ledger-live/pull/19034) [`696a1ee`](https://github.com/LedgerHQ/ledger-live/commit/696a1ee0333d7c2e6d11285aa18f8dd54cd4f57a) Thanks [@VicAlbr](https://github.com/VicAlbr)! - chore(e2e): use ETH instead of SOL/XRP/XLM/SUI for smoke tests where possible (BTC kept)

- [#18085](https://github.com/LedgerHQ/ledger-live/pull/18085) [`63b9b10`](https://github.com/LedgerHQ/ledger-live/commit/63b9b10ae44064f388174725dbff9d021d735fc8) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Add non-mandatory mobile smoke tests to PR CI pipeline

- [#18966](https://github.com/LedgerHQ/ledger-live/pull/18966) [`924bb83`](https://github.com/LedgerHQ/ledger-live/commit/924bb839b59c8d8f07747a80c5ae956cb59240f4) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwm): recipient step bottomsheet recent information

- [#18829](https://github.com/LedgerHQ/ledger-live/pull/18829) [`b3ffa2f`](https://github.com/LedgerHQ/ledger-live/commit/b3ffa2f4bf735f2cfeed2a8028ea92d4bc3588e3) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Sunset the `CryptoCurrency.terminated` field: remove it from the type/schema, delete the 5 currencies it marked (clubcoin, hcash, poswallet, stakenet, stratis), drop the now-unused `withTerminated` parameter from `listCryptoCurrencies`, and clean up the dead code orphaned by those deletions.

- [#18955](https://github.com/LedgerHQ/ledger-live/pull/18955) [`376915c`](https://github.com/LedgerHQ/ledger-live/commit/376915ca520ecc1708090ed9b3eba1ff7e780540) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(mobile): add tracking on new send flow part 2

- [#19165](https://github.com/LedgerHQ/ledger-live/pull/19165) [`f530884`](https://github.com/LedgerHQ/ledger-live/commit/f530884a72e8e2f01bd57c49f2252ff4e743c453) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - Added support for mobile balance component with transparent and shielded variants

- [#19044](https://github.com/LedgerHQ/ledger-live/pull/19044) [`ed6c3dd`](https://github.com/LedgerHQ/ledger-live/commit/ed6c3dda2a5ae28f4e15522d32f1a0333e068910) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Restore Android permission retry behavior after the React Native permission fix

- [#19257](https://github.com/LedgerHQ/ledger-live/pull/19257) [`a5afb77`](https://github.com/LedgerHQ/ledger-live/commit/a5afb7741f2cd6c9b4e32a624b14908873f0c20a) Thanks [@kentoforik](https://github.com/kentoforik)! - Add testIDs to SwapTransactionStatus drawer components for e2e coverage

- [#19289](https://github.com/LedgerHQ/ledger-live/pull/19289) [`da6eb76`](https://github.com/LedgerHQ/ledger-live/commit/da6eb768dd294c7e5e4020ebd19b7c3b7d78a40d) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Add Aleo view key approve screen and extend custom add-account flow API with onImportAccounts, onScanDeviceAccountsBack, and per-family CTA label support

- [#19112](https://github.com/LedgerHQ/ledger-live/pull/19112) [`8169225`](https://github.com/LedgerHQ/ledger-live/commit/81692256d96fd47acf288c0f646b15c92fe8d7be) Thanks [@dilaouid](https://github.com/dilaouid)! - chore(lwdm): refacto gas and memo in the new send flow

- [#19178](https://github.com/LedgerHQ/ledger-live/pull/19178) [`3da6b44`](https://github.com/LedgerHQ/ledger-live/commit/3da6b4439d61a7ad7f06e04be12aa1e92b9cdb55) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove the balanceRefreshRework param of the wallet 4.0 feature flag everywhere; the reworked balance refresh is now always used on mobile

- [#18905](https://github.com/LedgerHQ/ledger-live/pull/18905) [`cd52815`](https://github.com/LedgerHQ/ledger-live/commit/cd52815abf9d92fd11469f49b0b857f99b0225b5) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(lwm): fix cosmos android layout

- [#19224](https://github.com/LedgerHQ/ledger-live/pull/19224) [`29ac004`](https://github.com/LedgerHQ/ledger-live/commit/29ac004173ed650b9350fdaea905f7b79e27e09a) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Extract shared Analytics chart utils into @ledgerhq/wallet-analytics

- [#19302](https://github.com/LedgerHQ/ledger-live/pull/19302) [`f9411d1`](https://github.com/LedgerHQ/ledger-live/commit/f9411d1e2a06b031555cda9e26ecba37b4cf045e) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove the `graphRework` param of the Wallet 4.0 feature flag on both platforms. The param is no longer consumed on desktop (LIVE-33502) nor mobile, so it is dropped entirely: from the `lwmWallet40` / `lwdWallet40` schemas, the shared `Feature_Wallet40_Params` type, the analytics helper, the `shouldDisplayGraphRework` getter in `useWalletFeaturesConfig`, and both platforms' debug dev-tool lists.

  On mobile the Wallet 4.0 balance hero is now always rendered: the legacy portfolio graph card is dropped from the portfolio header and read-only screens (the `GraphCard` / `GraphCardContainer` / `PortfolioGraphCard` components stay, still used by the Analytics screen), and the graphRework gating is removed from every mobile call site (Portfolio screen/VM, `Delta`, settings reducer, WalletAssets VM).

- [#19203](https://github.com/LedgerHQ/ledger-live/pull/19203) [`6eea36b`](https://github.com/LedgerHQ/ledger-live/commit/6eea36bfafeba265672a96b37981e2c7e629ef33) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove the mainNavigation param of the wallet 4.0 feature flag; the wallet 4.0 main navigation is now always used on mobile and the legacy tab-bar/top-bar code paths are removed

- [#19261](https://github.com/LedgerHQ/ledger-live/pull/19261) [`35d4af9`](https://github.com/LedgerHQ/ledger-live/commit/35d4af90e7bee849814cd98358c80e20ef4e4f2a) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Wallet 4.0 Q1 cleanup on mobile:

  - Remove the `quickActionCtas` param of the `lwmWallet40` feature flag. The quick-action CTAs are now always enabled; the `shouldDisplayQuickActionCtas` getter and the legacy `PortfolioQuickActionsBar` are removed.
  - Remove the legacy (pre-4.0) Portfolio screen. `PortfolioRootScreen` now always renders the MVVM `Portfolio` / `ReadOnlyPortfolio`, and the dead legacy screen files are deleted.

- [#19068](https://github.com/LedgerHQ/ledger-live/pull/19068) [`0e302a5`](https://github.com/LedgerHQ/ledger-live/commit/0e302a5a2e71a63af7e79d9a195e5e2cca36642c) Thanks [@dilaouid](https://github.com/dilaouid)! - chore(llc): share useNetworkFee hooks through lwd and lwm in common

- [#18874](https://github.com/LedgerHQ/ledger-live/pull/18874) [`e0b2f53`](https://github.com/LedgerHQ/ledger-live/commit/e0b2f53c10d88554f6e9082f728fb3cfff7e805c) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Block XRP send and show an error when the recipient requires a destination tag and none is provided (bumps @ledgerhq/coin-xrp to 7.23.5)

### Patch Changes

- Updated dependencies [[`b837f65`](https://github.com/LedgerHQ/ledger-live/commit/b837f65b79b2d27b0b29d4037b18837c5a1b7ca5), [`bb1bbc3`](https://github.com/LedgerHQ/ledger-live/commit/bb1bbc36d9c182ac2cefb92ec5e87f226bfc76fd), [`6df2017`](https://github.com/LedgerHQ/ledger-live/commit/6df20171a84b54e5b67eabefc938a98d7e3c3e43), [`a7734c2`](https://github.com/LedgerHQ/ledger-live/commit/a7734c23a635ddde880176ee04ff409a67eae613), [`a2621e2`](https://github.com/LedgerHQ/ledger-live/commit/a2621e2c6c6369c7109af72e1cb59df2448951ff), [`e18fe2d`](https://github.com/LedgerHQ/ledger-live/commit/e18fe2d81d86650e816b8b5da9ea311048a3e30e), [`b98cce3`](https://github.com/LedgerHQ/ledger-live/commit/b98cce3ff564ab8499876b124a4a5f3a08e0066f), [`19aa0b4`](https://github.com/LedgerHQ/ledger-live/commit/19aa0b499c3c4a9f6348f4af367636492a8023d1), [`70a706e`](https://github.com/LedgerHQ/ledger-live/commit/70a706e4efe3a6fa176f9827a4a06949ba185f11), [`8b6614e`](https://github.com/LedgerHQ/ledger-live/commit/8b6614eaff423aaeb50b7eb44ba5916a941a573d), [`f9caf32`](https://github.com/LedgerHQ/ledger-live/commit/f9caf322be2e3b652e8ec06fb40aeb8e02e08c8a), [`3cb6159`](https://github.com/LedgerHQ/ledger-live/commit/3cb615918166922059304724f560c566d2671ac3), [`c5763f6`](https://github.com/LedgerHQ/ledger-live/commit/c5763f6171f49d2b9e679b982804e68843800450), [`3b35b5e`](https://github.com/LedgerHQ/ledger-live/commit/3b35b5ea8a0c67c215150f2aee008fd1c1993463), [`38728f9`](https://github.com/LedgerHQ/ledger-live/commit/38728f9d9ac879c276def56ce88c5e49549e4b9d), [`d91f849`](https://github.com/LedgerHQ/ledger-live/commit/d91f849185c7a30514349be655bba69dd77bb8c8), [`86ca231`](https://github.com/LedgerHQ/ledger-live/commit/86ca231ea9e0ec5996258b1abfa9742a7df3f9ec), [`714411f`](https://github.com/LedgerHQ/ledger-live/commit/714411fcbf054244444ec97f2e53039417cba54e), [`1e17c12`](https://github.com/LedgerHQ/ledger-live/commit/1e17c127178a871b665b25d6f4208d4613826dd1), [`ca07aac`](https://github.com/LedgerHQ/ledger-live/commit/ca07aac857c58e3d85beab71b246d8af687431f3), [`5ccd2a9`](https://github.com/LedgerHQ/ledger-live/commit/5ccd2a9c229e8007851c6eb8b01c866c8e605932), [`6400154`](https://github.com/LedgerHQ/ledger-live/commit/6400154daa131b225c6ec62c9134f1cd06370729), [`9f8ab96`](https://github.com/LedgerHQ/ledger-live/commit/9f8ab9672ababc02909e7553d433ee326c37762e), [`e6566ff`](https://github.com/LedgerHQ/ledger-live/commit/e6566ff55d95ff36832d5f77899d67d80842f418), [`7914bd1`](https://github.com/LedgerHQ/ledger-live/commit/7914bd123d4f3b990db035f28dca4904420562ec), [`996c76b`](https://github.com/LedgerHQ/ledger-live/commit/996c76b157553c547f83d877d25199b311ee0f63), [`2ac4833`](https://github.com/LedgerHQ/ledger-live/commit/2ac4833b004b8b818cf7eb4d32abcd8dd3b0fc4a), [`4f541c2`](https://github.com/LedgerHQ/ledger-live/commit/4f541c2f45d508dd12b4d4ff92dec294e6005865), [`e2d74f7`](https://github.com/LedgerHQ/ledger-live/commit/e2d74f7c5fe9883d6a141ce790a0b0aa92d7e53a), [`973118a`](https://github.com/LedgerHQ/ledger-live/commit/973118a511dbdf862387c94272a89739a011e797), [`addef52`](https://github.com/LedgerHQ/ledger-live/commit/addef52ed445008c16e3f94d66f46222c8c535f7), [`81373c1`](https://github.com/LedgerHQ/ledger-live/commit/81373c1ca46cf2094cfd4f98958eff2114f02cea), [`7fe5f11`](https://github.com/LedgerHQ/ledger-live/commit/7fe5f1129d6ac218ad274f2187a1a3dd83b8855a), [`34bccb5`](https://github.com/LedgerHQ/ledger-live/commit/34bccb5268c8b27f87f2ab0395e372d4f1d5d926), [`966d6a1`](https://github.com/LedgerHQ/ledger-live/commit/966d6a198412c12548575516a2ac72456c380181), [`b1d2ae6`](https://github.com/LedgerHQ/ledger-live/commit/b1d2ae681e8dade5fc193911f1de0a898f65af1c), [`7c39ea3`](https://github.com/LedgerHQ/ledger-live/commit/7c39ea39ca8999bcb8ce2294f4884430b6d1b2dc), [`d686e93`](https://github.com/LedgerHQ/ledger-live/commit/d686e93f8a548ff4e9ab3c877ad1f815510b35d9), [`e97314e`](https://github.com/LedgerHQ/ledger-live/commit/e97314e0d8201195a91e5eeb0fcde9e2b1dfff76), [`f495213`](https://github.com/LedgerHQ/ledger-live/commit/f495213e811477c99d62f0d93cc7c513b951a303), [`f495213`](https://github.com/LedgerHQ/ledger-live/commit/f495213e811477c99d62f0d93cc7c513b951a303), [`0225804`](https://github.com/LedgerHQ/ledger-live/commit/0225804cd0f39b90050f52b14e1b159340f0530e), [`c8b4ee7`](https://github.com/LedgerHQ/ledger-live/commit/c8b4ee77c03ca2117cbad039331b7b52e50d9620), [`6ddd641`](https://github.com/LedgerHQ/ledger-live/commit/6ddd64113a4c360a091fc1fd54256cfabaab5220), [`e820e40`](https://github.com/LedgerHQ/ledger-live/commit/e820e402fb57d52b31dcd6de26f8d31d9564e2a4), [`007f27e`](https://github.com/LedgerHQ/ledger-live/commit/007f27e81cce353a3ee6648543d54d06ae6e7a11), [`ba433a1`](https://github.com/LedgerHQ/ledger-live/commit/ba433a1a08fa65ce3d376bb0d60fe1d4241b422d), [`c22afcb`](https://github.com/LedgerHQ/ledger-live/commit/c22afcba4dda045b2be9294abc67c5a96e5f4016), [`0e30cdc`](https://github.com/LedgerHQ/ledger-live/commit/0e30cdc29d7fb3cab5bf1f2ef7c24cf0a152516e), [`b10ca6a`](https://github.com/LedgerHQ/ledger-live/commit/b10ca6ab5e80889b24805b460f81eff5748f0170), [`fa25271`](https://github.com/LedgerHQ/ledger-live/commit/fa252719220ca27fa4556ce9a02b84ccfca835c3), [`df96477`](https://github.com/LedgerHQ/ledger-live/commit/df964774bdaccd897e5e7414c172e9c26ff21f67), [`c4ee26d`](https://github.com/LedgerHQ/ledger-live/commit/c4ee26d18dacfcee597357de4b9dbab9fda01dbb), [`edacd7c`](https://github.com/LedgerHQ/ledger-live/commit/edacd7c60413812e13a20d6451d5870ff5ced34e), [`cf3aad1`](https://github.com/LedgerHQ/ledger-live/commit/cf3aad160bd9d2002a3154fbc70018fb1f7a6171), [`df6ca42`](https://github.com/LedgerHQ/ledger-live/commit/df6ca422fa70171162974ea71519da5c5eeb55d8), [`e3c0327`](https://github.com/LedgerHQ/ledger-live/commit/e3c032795a0432500a447b756503ce0aefd8c0f6), [`628f21f`](https://github.com/LedgerHQ/ledger-live/commit/628f21f5acf7d5866c0c956d41d69c760caf0caa), [`b2e12ce`](https://github.com/LedgerHQ/ledger-live/commit/b2e12ce7b72de43efe8c8ff5290d617fff7f8e31), [`360cea4`](https://github.com/LedgerHQ/ledger-live/commit/360cea435daf7093d853f4ad6402327c6a285895), [`b3ffa2f`](https://github.com/LedgerHQ/ledger-live/commit/b3ffa2f4bf735f2cfeed2a8028ea92d4bc3588e3), [`376915c`](https://github.com/LedgerHQ/ledger-live/commit/376915ca520ecc1708090ed9b3eba1ff7e780540), [`b9f3ba5`](https://github.com/LedgerHQ/ledger-live/commit/b9f3ba5707e25d4ef50a7f7ffd4471678aa836ef), [`ed6c3dd`](https://github.com/LedgerHQ/ledger-live/commit/ed6c3dda2a5ae28f4e15522d32f1a0333e068910), [`5aada6f`](https://github.com/LedgerHQ/ledger-live/commit/5aada6f1a72df070770f4b67112f51b5ced58cff), [`69b201e`](https://github.com/LedgerHQ/ledger-live/commit/69b201e2b1e01b2c6bfb6eaf9e0aa60088f175fc), [`3da6b44`](https://github.com/LedgerHQ/ledger-live/commit/3da6b4439d61a7ad7f06e04be12aa1e92b9cdb55), [`607b032`](https://github.com/LedgerHQ/ledger-live/commit/607b03228d5e648a0611c316c6ab71a60365f349), [`29ac004`](https://github.com/LedgerHQ/ledger-live/commit/29ac004173ed650b9350fdaea905f7b79e27e09a), [`9c42adf`](https://github.com/LedgerHQ/ledger-live/commit/9c42adf9e20ac7c9b4418652a40b5552afe6106d), [`f9411d1`](https://github.com/LedgerHQ/ledger-live/commit/f9411d1e2a06b031555cda9e26ecba37b4cf045e), [`6eea36b`](https://github.com/LedgerHQ/ledger-live/commit/6eea36bfafeba265672a96b37981e2c7e629ef33), [`35d4af9`](https://github.com/LedgerHQ/ledger-live/commit/35d4af90e7bee849814cd98358c80e20ef4e4f2a), [`363ac4d`](https://github.com/LedgerHQ/ledger-live/commit/363ac4d27f4e71b1e6e00b1c128bc199d1170839), [`aea723c`](https://github.com/LedgerHQ/ledger-live/commit/aea723cac83a43596f1940ed4fc6ecbad49074e0), [`1c1e25d`](https://github.com/LedgerHQ/ledger-live/commit/1c1e25d866e8ad9bf8d29c4bd102ebd5fd02c2b3)]:
  - @domain/api-currency-fiat@0.2.0
  - @domain/entity-currency-fiat@0.2.0
  - @domain/api-currency-token@0.2.0
  - @ledgerhq/cryptoassets@13.54.0
  - @ledgerhq/coin-evm@4.5.0
  - @ledgerhq/types-live@6.114.0
  - @shared/feature-flags@0.13.0
  - @ledgerhq/coin-bitcoin@0.46.0
  - @ledgerhq/live-env@2.41.0
  - @ledgerhq/coin-cosmos@0.38.0
  - @ledgerhq/live-dmk-shared@0.28.0
  - @domain/entity-currency-crypto@0.5.0
  - @features/platform-feature-flags@0.6.0
  - @ledgerhq/coin-multiversx@0.19.0
  - @ledgerhq/coin-concordium@0.15.0
  - @ledgerhq/coin-filecoin@1.27.0
  - @ledgerhq/coin-stacks@0.23.0
  - @ledgerhq/coin-canton@0.28.0
  - @ledgerhq/coin-casper@2.15.0
  - @ledgerhq/ledger-wallet-framework@2.3.0
  - @features/platform-currencies@0.2.0
  - @ledgerhq/live-currency-format@0.12.0
  - @ledgerhq/types-cryptoassets@7.39.0
  - @ledgerhq/live-dmk-mobile@0.28.0
  - @ledgerhq/hw-ledger-key-ring-protocol@0.11.0
  - @ledgerhq/ledger-key-ring-protocol@0.16.0
  - @ledgerhq/live-countervalues@0.22.0
  - @ledgerhq/devices@8.17.0
  - @ledgerhq/native-ui@0.64.0
  - @ledgerhq/wallet-analytics@0.2.0
  - @ledgerhq/live-wallet@0.28.0
  - @ledgerhq/wallet-pnl@0.7.1
  - @ledgerhq/domain-service@1.8.9
  - @ledgerhq/live-countervalues-react@0.16.1
  - @ledgerhq/client-ids@0.11.1
  - @ledgerhq/live-dmk-speculos@0.10.1
  - @ledgerhq/live-network@2.6.7
  - @ledgerhq/hw-transport@6.35.6
  - @ledgerhq/device-intent@4.0.1
  - @ledgerhq/hw-transport-http@6.36.6

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->

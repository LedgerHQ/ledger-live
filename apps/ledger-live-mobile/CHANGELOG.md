# live-mobile

## 4.23.0-next.1

### Patch Changes

- Updated dependencies [[`d5dfa07`](https://github.com/LedgerHQ/ledger-live/commit/d5dfa072c9a724609119c06622004d76a45414d9)]:
  - @domain/entity-contact@0.11.0-next.1
  - @features/flow-contacts@0.13.0-next.1
  - @features/flow-contacts-add-address@0.6.1-next.1
  - @features/flow-contacts-add-contact@0.7.1-next.1
  - @features/flow-contacts-delete-contact@0.2.4-next.1
  - @features/flow-contacts-edit-address@0.4.1-next.1
  - @features/flow-contacts-edit-contact@0.6.1-next.1
  - @features/flow-contacts-list@0.9.0-next.1
  - @features/flow-pay-contact@0.5.0-next.1
  - @features/platform-contacts@0.9.0-next.1
  - @ledgerhq/live-wallet@1.1.5-next.1

## 4.23.0-next.0

### Minor Changes

- [#22217](https://github.com/LedgerHQ/ledger-live/pull/22217) [`63960b1`](https://github.com/LedgerHQ/ledger-live/commit/63960b12982ace30544a058c3128a13046f0bddb) Thanks [@vpenskyi-ledger](https://github.com/vpenskyi-ledger)! - Fix the Swap receive field staying empty when reaching Swap from the Earn no-funds screen. Desktop now always identifies a token by `toTokenId` (plus its `toToken` alias), which `toCurrencyId` alone could not do; mobile passed no parameters at all and now forwards the asset. On both, an account the Earn live app synthesised for a token the user does not hold is no longer sent as an unresolvable id

- [#22404](https://github.com/LedgerHQ/ledger-live/pull/22404) [`b42673e`](https://github.com/LedgerHQ/ledger-live/commit/b42673eed68aba6b2885486d7294f5f9163f721d) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Read the card cashback banner from `GET /v1/card/cashback`

  - Add `getCardCashback` endpoint, resolving the asset's `currency`/`network` pair (both nullable) to its `ledgerId`
  - Remove `getRewardWallet` (`GET /v1/wallet/reward`), its schema, types, mock and handlers
  - `useCardCashback` replaces `useCardRewardWallet` in the reward banner
  - Banner subtitle now shows the rate and ticker: "Total cashback · 1% in BTC"
  - `cardRewardsAvailable` / `cardRewardCurrency` analytics now read the cashback (amount > 0)

- [#22450](https://github.com/LedgerHQ/ledger-live/pull/22450) [`2d869a5`](https://github.com/LedgerHQ/ledger-live/commit/2d869a596a4562a00003de01cc657d7277dc6b7c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - fix(i18n): keep Thai selected across app restarts

  Removes the `llmThai` / `lldThai` feature flags. Flags resolve on their `enabled: false` default
  until the first remote fetch settles, so on every cold start the locale guard saw Thai as
  unsupported and persisted English over the user's choice.

- [#22667](https://github.com/LedgerHQ/ledger-live/pull/22667) [`d90780a`](https://github.com/LedgerHQ/ledger-live/commit/d90780af0ae85fe9e71d3ad2b87dbd5ea1eb5932) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Fix the receive screen "Need a Tag/Memo?" link hit area overlapping the Copy address button (LIVE-38004).

- [#22401](https://github.com/LedgerHQ/ledger-live/pull/22401) [`b239a21`](https://github.com/LedgerHQ/ledger-live/commit/b239a216452f504bb8cfb025ea9b0828f96ec07f) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(lwm): object in operation extra malformatted

- [#22381](https://github.com/LedgerHQ/ledger-live/pull/22381) [`c5964f8`](https://github.com/LedgerHQ/ledger-live/commit/c5964f8c6348028d97832dd46cd8554d813d48db) Thanks [@ysitbon](https://github.com/ysitbon)! - Rename `@domain/api-market-sentiment` to `@domain/api-market-index-fear-and-greed`, and its exported api from `marketSentimentApi` to `fearAndGreedApi`, so the name states which CoinMarketCap index the package serves

- [#22453](https://github.com/LedgerHQ/ledger-live/pull/22453) [`370f955`](https://github.com/LedgerHQ/ledger-live/commit/370f95583baf604e3d0e9db3c7c7dadbc6a0c608) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Track the add-password flow through `@shared/analytics`, per the Password tracking plan.

  The protection drawer reports its enable button as `button_clicked` with the variant it offers, and a stored password reports `encryption_activated` with `type: "password"` and the entry point it came from. That `source` is passed by each caller — `settings` from the Settings row, `card` from the Pay tab — and carried through the flow's route params instead of being guessed from where the user happens to be. `password_enabled` and `biometrics_enabled` join every event and the user's traits, read from whichever scheme protects the app, and the traits are refreshed as soon as a password is stored. No payload carries the password or anything derived from it.

  The Settings password and biometrics toggles report `toggle_clicked` with `enabled` set to the state the toggle had when it was tapped, on both the revamped and the legacy rows, and the revamped rows now track through `@shared/analytics` too.

- [#22629](https://github.com/LedgerHQ/ledger-live/pull/22629) [`5f20e00`](https://github.com/LedgerHQ/ledger-live/commit/5f20e0019eef057db0fd8235ce687fa176f26c3e) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Lock the app only after it has been away for 15 seconds.

  The gate used to lock the moment the app left. It now notes when the app leaves and decides when it comes back: away for 15 seconds or more, the app locks; back sooner, it opens where the user left it. The lock on launch is unchanged, so an app the system ended while away still asks on the way back.

  While the app is away, protected content is covered, so the app switcher and the moment of return show a cover rather than the wallet. Under Detox the grace is one second, so e2e specs do not wait out the real one. On Android the return comes from the process lifecycle, like the departure, through a new `appDidEnterForeground` event on `AppVisibilityModule`; on iOS it is `AppState` turning active.

- [#22287](https://github.com/LedgerHQ/ledger-live/pull/22287) [`5f34cb6`](https://github.com/LedgerHQ/ledger-live/commit/5f34cb6848f92e1b520a474a2b779caad6f88804) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Stop a card holder from leaving the app with nothing protecting it.

  Both protection rows in Settings let anyone turn protection off, so someone holding a card could strip the app of its last lock. Without a card that stays allowed — the app lock is opt-in — but a card turns "at least one protection" into a rule.

  Removing the last one is now refused, and a sheet says why at the moment the user asks, rather than a disabled row that explains nothing. Removing one of two is still allowed: at least one protection is the invariant, and which one is the user's choice — so a password can still be swapped for biometrics, or the reverse.

  What counts as holding a card is the **card session stored on the device**, which `@features/platform-card` owns — not Pay's feature flag, and not whether the Pay tab has been opened. A holder who has not been near Pay on this launch is still a holder, and turning Pay's flag off does not turn the rule off. The session is read when the user asks to remove a protection, not when Settings opens, so a tap can never land before the answer, and a session that started or ended with Settings open is seen. A session that cannot be read counts as a card: a refusal can be retried, while a removal cannot be taken back.

  The rule applies to the revamped rows. The legacy rows shown while `lwmPasswordRevamp` is off are left as they are.

- [#22347](https://github.com/LedgerHQ/ledger-live/pull/22347) [`e012138`](https://github.com/LedgerHQ/ledger-live/commit/e012138a1531a651ae62515bed2cada9dbfcfa8c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Require a password of at least six characters from users who set a shorter one, the next time they get in.

  Any length was accepted before this epic — `"1"` among them — so the minimum the new screens enforce would otherwise apply to new passwords only. The prompt cannot be dismissed: there is no close button, the backdrop does not take a press, and the Android back button is swallowed while it holds the screen. A prompt that can be put off is one that short passwords outlive.

  It runs after a successful unlock, not at boot, because that is when the password has been proven and its length is known. Four steps: a sheet that says why, the new password, its confirmation, and a sheet that says it worked. The old password is never asked for again — they just typed it to get in.

  **The requirement is stored, beside the verifier it describes.** The protection state is deliberately not persisted, since a second source of truth about whether a password exists is a lockout risk, and this mark cannot be recomputed from a digest: a verifier says nothing about the length of the password behind it. So it rides in the same keychain record, written and cleared by the single write that sets the password it describes, and the two cannot disagree.

  It is also **re-derived at every password unlock**, which is what heals a record written before the mark existed, and what corrects one whose password was changed elsewhere. The stored mark still earns its place: a biometric unlock never sees a password, and the prompt is owed on that boot too.

  A write the keychain declines is reported as a failure rather than as a password change, so the confirmation holds instead of sending the user off with a verifier that is still the old one. The mark's own repair at unlock is best-effort by contrast: metadata must never cost somebody an unlock they have just earned.

  An overlay rather than a route: a route is presented over the app in its own window, and the sheets — which present into the app's window — would be visible through it while taking none of the taps aimed at them.

- [#22556](https://github.com/LedgerHQ/ledger-live/pull/22556) [`2074967`](https://github.com/LedgerHQ/ledger-live/commit/2074967c2c084e05de67597ae353c783b0b10f92) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Stop locking the app on Android for flows the app itself starts.

  Clearing the cache reboots the React tree without restarting the process, and the gate took its remount for a launch and locked again. Whether the launch lock was decided now lives in the app-lock state, which a reboot leaves in place, so it is decided once per process.

  Sharing an address or logs, or saving a file from the share sheet, hands the screen to another app, which Android reports as the app leaving. Those flows now go through `leaveAppFor`, which holds the background lock off until Android resumes the app. The share promise settles before the user is back, so the hold ends on the resume rather than on the promise, and at once if the task fails before anything was shown. iOS keeps its share sheet inside the app and is unaffected.

- [#22435](https://github.com/LedgerHQ/ledger-live/pull/22435) [`1647f38`](https://github.com/LedgerHQ/ledger-live/commit/1647f38343baf93fbe8333d9abec403797489859) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Stop locking the app behind a permission prompt on Android.

  React Native's `AppState` reports `background` on Android as soon as the activity pauses, and a permission dialog is enough to pause it, so the app lock read a prompt shown over the app as the user leaving. Granting the camera put the user back on the unlock screen instead of the camera.

  On Android, the lock now follows the process lifecycle, which only stops once no screen of the app is visible — the signal native apps use for "the app went to the background". iOS keeps `AppState`, whose `background` already means the app has left. The platform split lives in one adapter, so the gate asks a single question on both.

  `isAppBackgrounded`, which only the gate used, is removed from `@features/platform-app-lock`.

- [#22417](https://github.com/LedgerHQ/ledger-live/pull/22417) [`8b387f4`](https://github.com/LedgerHQ/ledger-live/commit/8b387f4d1db967288af2f982a78949e0615ebc7e) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Resume after a biometric prompt only once the app is active again, and let the enable button show it is waiting.

  On iOS the system answers the prompt while the Face ID sheet is still leaving, with the app not yet back in the foreground, and native UI presented in that window never appears. The Card login hit it first: pressing Continue straight after enabling Face ID opened no browser, and the web browser module then refused every later attempt until the app was relaunched, because it had recorded a session that never started.

  Every biometric prompt in the app now waits for the app to be active before answering, whatever the answer. The wait is bounded, so an event that never arrives cannot hold anyone up, and it does not apply to an app the user has sent to the background.

  The system prompt also leaves the app pressable, so pressing "Enable Face ID" again while it was up opened a second one. The button now shows its spinner while the prompt is pending and ignores further presses. `InfoState` CTAs gain a `loading` flag for it.

- [#22653](https://github.com/LedgerHQ/ledger-live/pull/22653) [`e8d5e1b`](https://github.com/LedgerHQ/ledger-live/commit/e8d5e1bf6eec2a47072ad59762064b24a89701cf) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Bump DMK dependencies: device-management-kit 1.10.0, device-signer-kit-solana 1.13.3, device-signer-kit-ethereum 1.18.1, context-module 2.6.0, dmk-ledger-wallet 0.6.0, device-contacts-kit 0.5.0, signer-utils 1.3.0, device-transport-kit-mockserver 1.1.2

- [#22615](https://github.com/LedgerHQ/ledger-live/pull/22615) [`7bc8d65`](https://github.com/LedgerHQ/ledger-live/commit/7bc8d65f5565f881094751204475f7e3d0b16106) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Open the Pay request flow from the Add stablecoin "Crypto address" option instead of the standard Receive flow

- [#22563](https://github.com/LedgerHQ/ledger-live/pull/22563) [`3e7af98`](https://github.com/LedgerHQ/ledger-live/commit/3e7af98196476c04a97522109fded33cc17dc868) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump react-native-config to 1.7.2 and drop its pnpmfile peer patch

- [#21976](https://github.com/LedgerHQ/ledger-live/pull/21976) [`26e51d9`](https://github.com/LedgerHQ/ledger-live/commit/26e51d98fde1c080e09f566e0dbeb4f2c2e9f382) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add mobile E2E coverage for creating a contact, registering EVM addresses on the device and deleting both, and let device intents run against Speculos by registering it as a discoverable transport. Speculos specs can now pin an OS version so the run uses the Ethereum build the contacts intents require, which the app catalog does not serve yet.

- [#22523](https://github.com/LedgerHQ/ledger-live/pull/22523) [`774877b`](https://github.com/LedgerHQ/ledger-live/commit/774877b04b07e7a960cb4971ead5c353a0583c7e) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Drive the shared device onboarding flow from mobile DevTools

- [#22492](https://github.com/LedgerHQ/ledger-live/pull/22492) [`d883e5b`](https://github.com/LedgerHQ/ledger-live/commit/d883e5b38219585fa38a7c5bb446637856dceeb9) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add 16px horizontal inset to the History crypto/card type switcher.

- [#22568](https://github.com/LedgerHQ/ledger-live/pull/22568) [`c1f5830`](https://github.com/LedgerHQ/ledger-live/commit/c1f5830bc23997b2b965b2619d6a79935b3f5ba5) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add a "Pay contact success (Me)" dev tools quick action, and use valid EVM addresses in the Me contact mock so its seeded addresses can be sent to.

- [#22470](https://github.com/LedgerHQ/ledger-live/pull/22470) [`6a5972d`](https://github.com/LedgerHQ/ledger-live/commit/6a5972df49e243bbb36cd973e405302d0d8925bc) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Close the card details sheet when an asset top up opens.

- [#22319](https://github.com/LedgerHQ/ledger-live/pull/22319) [`94e86c6`](https://github.com/LedgerHQ/ledger-live/commit/94e86c64f1700e6ab8424a05117773fad6146747) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add long-press and accessibility controls for reordering card assets, with the add-asset footer pinned to the sheet's own footer slot, a bigger drag-handle touch target, and fixes for a stuck-elevated drag row and a spinner flash on a same-position drop

- [#22379](https://github.com/LedgerHQ/ledger-live/pull/22379) [`ad2f1de`](https://github.com/LedgerHQ/ledger-live/commit/ad2f1deb73d1fd6fed1383133a7f2b259630cd06) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Let the card transaction history read past its first page.

  - Both platforms read on by scrolling: native through the list's `onEndReached`, web through an observer on a sentinel at the end of the table.
  - A spinner marks the page in flight; no new copy, so nothing to translate.
  - Both take `loadMore`/`isLoadingMore` from the shared view model, so the three-row previews on the Pay surfaces are unaffected.

- [#22432](https://github.com/LedgerHQ/ledger-live/pull/22432) [`cfb7566`](https://github.com/LedgerHQ/ledger-live/commit/cfb756682290e9940d65f3b6417d6b111449e546) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Show the cashback a card transaction earned in its detail view

- [#22370](https://github.com/LedgerHQ/ledger-live/pull/22370) [`c2c4de5`](https://github.com/LedgerHQ/ledger-live/commit/c2c4de513d0d122df0128f5440c8eb143709a503) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Replace the react-native-level-fs based `fs` polyfill with a stub and drop asyncstorage-down, its pnpmfile peer extension and its patch

- [#22474](https://github.com/LedgerHQ/ledger-live/pull/22474) [`1a26e59`](https://github.com/LedgerHQ/ledger-live/commit/1a26e599a47d52854cf05081a386e6090d8677f2) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Update coin module dependencies (coin-evm, coin-module-framework, coin-stellar, coin-tezos) and rebuild the lockfile

- [#22572](https://github.com/LedgerHQ/ledger-live/pull/22572) [`6e76dda`](https://github.com/LedgerHQ/ledger-live/commit/6e76ddac6370bb60b17971679a857fae7ca83eb9) Thanks [@tonykhaov](https://github.com/tonykhaov)! - `ContactAvatar` takes `isMe` and is the only avatar that formats the Me label, so a Me avatar is announced once as "<name> (Me)". `MeAvatar` takes a display-ready `label` and is no longer exported; `ME_AVATAR_URL` stays exported. `PaySuccessRecipient.isMe` is now required.

- [#22656](https://github.com/LedgerHQ/ledger-live/pull/22656) [`486a1a4`](https://github.com/LedgerHQ/ledger-live/commit/486a1a45027e8104ae824d77bd34b298788c9b04) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Only mention ENS in the contact address input placeholder for networks that support domain resolution (LIVE-38284).

- [#22527](https://github.com/LedgerHQ/ledger-live/pull/22527) [`c5cdada`](https://github.com/LedgerHQ/ledger-live/commit/c5cdada5a87be6b197b37234c0880f52b6730985) Thanks [@qperrot](https://github.com/qperrot)! - Fix Cosmos claim rewards showing a generic loader instead of the transaction confirmation screen while signing on the device

- [#22348](https://github.com/LedgerHQ/ledger-live/pull/22348) [`f7cd861`](https://github.com/LedgerHQ/ledger-live/commit/f7cd8616265d3f94fef24332626402efe39eb83f) Thanks [@ysitbon](https://github.com/ysitbon)! - Let asset-aggregation and wallet-analytics declare the countervalues interface they need

  Both packages only ever needed one countervalues operation, `calculate`, over a state they
  receive as a parameter and never inspect. They now declare that operation themselves as a
  `RateLookup` interface, treat the state as an opaque `RateSnapshot`, and drop
  `@ledgerhq/live-countervalues` from their dependencies entirely. The apps fill the interface
  at startup, beside the crypto-assets store and the currencies resolver.

  No caller changes: the exported signatures keep their arity and the state argument is
  assignable as before, so the 41 files consuming these two packages are untouched.

  Tests get simpler as a side effect. Mocking countervalues was a module mock reaching across a
  package boundary; it is now an injected fake passed to `setRateLookup`.

- [#22268](https://github.com/LedgerHQ/ledger-live/pull/22268) [`87a0aa7`](https://github.com/LedgerHQ/ledger-live/commit/87a0aa781d48c6c4b5321712c8c9fc8296df392f) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Upgrade Datadog React Native SDK to 3.7.0 (`@datadog/mobile-react-native` and `@datadog/mobile-react-navigation`). The v3 configuration is restructured into nested `rumConfiguration` / `logsConfiguration` / `traceConfiguration` objects; the remote `llmDatadog` feature-flag params (kept in the flat v2 shape) are remapped to the v3 shape at initialization, and `startTrackingViews` now takes a `{ viewNamePredicate }` options object.

- [#22503](https://github.com/LedgerHQ/ledger-live/pull/22503) [`33b4952`](https://github.com/LedgerHQ/ledger-live/commit/33b4952ef04d4e0528d2735ba299b4a8073e447e) Thanks [@daniel-choinski-ledger](https://github.com/daniel-choinski-ledger)! - Inject the Tron address book into the DMK Tron signer so Tron transactions can clear-sign saved contact names.

  Adds a generic `AddressBookProvider<T>` in `live-dmk-shared` (the EVM provider is refactored onto it), a `tronAddressBookProvider` instance, a pure `toTronAddressBook` mapper (`Contact[] -> TronAddressBook`, Tron-family only, no chain id, `ledgerAccounts` always empty), and registers the source at each app's composition root. An absent or empty book leaves signing behavior unchanged.

- [#22481](https://github.com/LedgerHQ/ledger-live/pull/22481) [`d6866e7`](https://github.com/LedgerHQ/ledger-live/commit/d6866e7dc7ced8898ac585d4e34d9667d9ad7f17) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - adapt crypto card title to be consistent

- [#22058](https://github.com/LedgerHQ/ledger-live/pull/22058) [`f8c92f9`](https://github.com/LedgerHQ/ledger-live/commit/f8c92f9300d4b8268949ed7aff5a6781ed7f60a8) Thanks [@alexstapenka-ledger](https://github.com/alexstapenka-ledger)! - Instrument the shared sign/broadcast bridge defensively and dispatch consent-independent Earn
  transaction lifecycle events for native staking and allow-listed dApps on Desktop and Mobile.

- [#22473](https://github.com/LedgerHQ/ledger-live/pull/22473) [`03058f9`](https://github.com/LedgerHQ/ledger-live/commit/03058f928e1ea19cc44acd3b3e78fed443d80e2f) Thanks [@qperrot](https://github.com/qperrot)! - Fix: update external app warning

- [#21137](https://github.com/LedgerHQ/ledger-live/pull/21137) [`8959a04`](https://github.com/LedgerHQ/ledger-live/commit/8959a0409c3d9f2dbd44ae6947dbd23beab4cfe6) Thanks [@amaslakov](https://github.com/amaslakov)! - Add the Internet Computer staking and neuron management flows, the account staking banner and the staked balance footer, behind the llmIcpStaking flag

- [#22614](https://github.com/LedgerHQ/ledger-live/pull/22614) [`b4599a5`](https://github.com/LedgerHQ/ledger-live/commit/b4599a58f817aa233be256d6f755a0fd4d0fc8a5) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Update the verify address next steps copy, add a third step, and size the mobile shield spot to match desktop

- [#22495](https://github.com/LedgerHQ/ledger-live/pull/22495) [`7d246d2`](https://github.com/LedgerHQ/ledger-live/commit/7d246d21be871b803ac916570a67b6dd5518a387) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(send): retract the keyboard before the skip-memo warning opens in the new send flow LWM

- [#22290](https://github.com/LedgerHQ/ledger-live/pull/22290) [`e6c39d9`](https://github.com/LedgerHQ/ledger-live/commit/e6c39d9e9ce830afab1ad816a791db5a595bdf8a) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Add aleo staking unbond flow

- [#22498](https://github.com/LedgerHQ/ledger-live/pull/22498) [`917815d`](https://github.com/LedgerHQ/ledger-live/commit/917815de670a8971138c64957de865abe5888f31) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop the unused detox pnpmfile dependency extension

- [#22369](https://github.com/LedgerHQ/ledger-live/pull/22369) [`8475c70`](https://github.com/LedgerHQ/ledger-live/commit/8475c704ed5cc75bcfddc9789130281ad0c2aca5) Thanks [@ysitbon](https://github.com/ysitbon)! - refactor(domain): rename the altcoins-sentiment entity to market-index-altcoin-season

  `@domain/entity-altcoins-sentiment` becomes `@domain/entity-market-index-altcoin-season`. The
  package holds the CoinMarketCap Altcoin Season Index, so the new name puts it in a
  `market-index-*` namespace alongside the other CoinMarketCap index rather than using
  `sentiment` as a second top-level name for the same kind of thing.

  Pure rename: the exported `AltcoinSeasonIndexSchema` and `AltcoinSeasonIndex` are unchanged,
  and every call site now imports from the new specifier.

- [#22571](https://github.com/LedgerHQ/ledger-live/pull/22571) [`e3c51c5`](https://github.com/LedgerHQ/ledger-live/commit/e3c51c57487a765391677073d78fb9ce275374b6) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Show a matched Me contact as "<name> (Me)" in Send: the recipient card, the "Address matched" row, the amount step "To" header, the Pay success title and the History counterparty. `MatchedContact` and `RecipientHeaderContact` now carry `isMe`, and `RecipientHeaderPresentation.label` is renamed `recipientDisplayValue` and never holds a contact name.

- [#22409](https://github.com/LedgerHQ/ledger-live/pull/22409) [`632b767`](https://github.com/LedgerHQ/ledger-live/commit/632b767e03919334b18feaa1cf5d4dc1c816b3ee) Thanks [@martijnhjk](https://github.com/martijnhjk)! - Start the mobile app with an injected Card session for local development and E2E. `CARD_SESSION_BOOTSTRAP` takes a `PayCardSession` as JSON: Detox passes it as a launch argument, and Metro local reads `process.env` only in `__DEV__`. A Detox launch with no payload clears any leftover keychain session so a no-card run cannot inherit the previous one. Keeping it out of `@shared/env` and committed `.env` files keeps the bearer token out of `getAllEnvs()` and out of the shipped artifact. The app seeds `cardSession` and marks signed in when the build is development or launched with `DETOX`.

- [#22534](https://github.com/LedgerHQ/ledger-live/pull/22534) [`db76f12`](https://github.com/LedgerHQ/ledger-live/commit/db76f1271841b69c154e94c9604ce918efc42265) Thanks [@ysitbon](https://github.com/ysitbon)! - fix(feature-flags): wait for the flag cache before the first render

  `LedgerStoreProvider` now waits for the feature-flags cache read, in parallel with the storage
  reads it already awaits, before flipping `ready`. Providers rendered above `WaitForAppReady` used
  to mount on the compiled defaults when they won the race against the cache, which is how a
  flag-gated language could be persisted back to English.

  A feature-flags re-resolution that throws at boot is now reported, with `console.error` and an
  explicit `DdRum.addError`, since it happens before Datadog starts intercepting console errors.

- [#22570](https://github.com/LedgerHQ/ledger-live/pull/22570) [`dfd53ad`](https://github.com/LedgerHQ/ledger-live/commit/dfd53adbf0815e2a62f59c1e996bd709bd710ea0) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Show the Me contact as "<name> (Me)", or "My addresses (Me)" when it was never renamed, through one rule: `formatContactDisplayName`, wrapped by `useContactDisplayName`. It replaces `createMeDisplayNameFormatter`, `resolveMeContactDisplayName`, `identityFormatMeDisplayName` and every `formatMeDisplayName` label. Contact list items keep the raw name plus `isMe`, and rows render through the hook. Fixes the Me name in the Send recipient list, Pay contacts, the History scope and the address dialog. The Me address picker says "Select my address". Adds `@features/platform-contacts/testing`.

- [#22512](https://github.com/LedgerHQ/ledger-live/pull/22512) [`c63d0fa`](https://github.com/LedgerHQ/ledger-live/commit/c63d0fa3ad6f181beb5d8ea7b2ef474d82fd1ed7) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Always show Me in the Send recipient contact list, with only its addresses on the account network, ordered like the other contacts (last sent to first). Draw Me with one `MeAvatar` everywhere: `ContactAvatar` renders it for the Me contact, so the `meAvatarSrc`, `avatarSrc` and `isMe` avatar props are gone.

- [#22573](https://github.com/LedgerHQ/ledger-live/pull/22573) [`9e54487`](https://github.com/LedgerHQ/ledger-live/commit/9e5448750d57eb92f95ef828b55d80eedd826323) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add `useOtherContactsAddresses(excludeContactId?)` so the duplicate-address list is built in one place, with each owner's display name: "This address is already used for My addresses (Me)." It replaces five copies in the Contacts and Send view models.

- [#22321](https://github.com/LedgerHQ/ledger-live/pull/22321) [`83fac3e`](https://github.com/LedgerHQ/ledger-live/commit/83fac3e00782840d1f118180dfb9afb9a484952c) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Read the Pay Card transaction history one page at a time.

  - `getCardTransactions` is an infinite query; `useGetCardTransactionsQuery` becomes `useGetCardTransactionsInfiniteQuery`.
  - `page` moves off the filters onto the query's page param, so `PayCardTransactionsRequest` is filters only.
  - The provider answers a page past the end with an empty array, so an empty page ends the reading. No page size is documented, so a short page is read past at the cost of one further request.
  - A failure over pages already read no longer blanks the list — a later page or a failed refresh alike. Such a failure is not announced anywhere yet.
  - `useCardTransactionsViewModel` exposes `loadMore` and `isLoadingMore`; no surface calls them yet.
  - The joined list is ordered by `dateTime`, newest first, with repeats dropped, because a charge landing between two reads shifts the paging. The ordering applies to callers that only ever read one page.
  - `toPayGlobalProperties` takes `hasCardTransactions: boolean` in place of the transaction list, so analytics reads the first page through `hasCardTransactions` rather than joining the cached history on every `track()`.
  - `loadMore` is not offered once a read has failed, so a scroll-driven caller cannot turn one failure into a request loop.
  - The MSW mock pages, and its page size drops from the 10 #22236 sliced at to 6 — 10 exceeded the eight-charge fixture, so that mock never paged.

- [#22303](https://github.com/LedgerHQ/ledger-live/pull/22303) [`0cb7653`](https://github.com/LedgerHQ/ledger-live/commit/0cb7653939634fc2a576a6b8a8eb84f0dacf4365) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Attach Pay Mixpanel user properties when the Pay flag is on.

- [#22577](https://github.com/LedgerHQ/ledger-live/pull/22577) [`b6a9b53`](https://github.com/LedgerHQ/ledger-live/commit/b6a9b531267360fdca64b8db22dd8781aa414dd9) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix Pay analytics events that never reached Segment, and align the feature-intro page names.

  Pay tracking no longer travels through a React context: `@features/platform-pay-analytics` exposes
  module-level trackers built on `@shared/analytics`, and every Pay flow imports the one it needs.
  The provider could not be reached from inside `@gorhom/bottom-sheet` portals on mobile, so the card
  details sheet and the reward-currencies CTA silently dropped their events. The `onTrackEvent` prop
  is gone from every Pay flow package and from both host apps.

  Card milestone events are now planned from a first-read baseline, so they no longer replay on each
  login. Feature-intro pages report as `Page Feature Intro <flow>`, and the bank transfer flow is
  named `Cash to stable` instead of `C2S`.

- [#22592](https://github.com/LedgerHQ/ledger-live/pull/22592) [`46f0f94`](https://github.com/LedgerHQ/ledger-live/commit/46f0f9447e12faa953268bf2a19fbdfd85a43da9) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Show a dedicated empty and error state in Pay card assets and hide Manage until the list is ready.

- [#22545](https://github.com/LedgerHQ/ledger-live/pull/22545) [`ea90542`](https://github.com/LedgerHQ/ledger-live/commit/ea90542540f47a76c18cf5f440bb98b9be71c837) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - feat(pay-card): show every login error in a retryable panel

- [#22535](https://github.com/LedgerHQ/ledger-live/pull/22535) [`e8518d7`](https://github.com/LedgerHQ/ledger-live/commit/e8518d7f0b88096552c6a8f74ffe5752bc517a39) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Wait for the app to be active before opening the Card's secure browser, instead of after every biometric prompt.

  A Dynamic Island plays Face ID's success animation for about 2.5 seconds after the system has answered, and the app stays inactive throughout. An `ASWebAuthenticationSession` started in that window never appears, and the web browser module then refuses every later session as one already open, so the login button kept spinning until the app was relaunched.

  The wait for the app to be active now sits in `openHostedUrlInSecureBrowser`, right before the session starts, and resolves on the app's `active` event, bounded at five seconds against a lost event. A biometric prompt answers straight away again, so the "Face ID enabled" sheet shows while the island is still animating and the wait overlaps the time spent reading it, rather than adding to it. The app's prompt wrapper is removed.

- [#22391](https://github.com/LedgerHQ/ledger-live/pull/22391) [`99449b1`](https://github.com/LedgerHQ/ledger-live/commit/99449b1152ea712213db5c95fd0eace3eb5bf03b) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Share one hosted-page opener on the Pay Tab card.

  - Bind PIN, Baanx, order-card, add-asset, and asset top-up/withdraw through a single helper.
  - Pass host card props through to `@features/flow-pay-card` instead of listing each field.

- [#22328](https://github.com/LedgerHQ/ledger-live/pull/22328) [`41eca65`](https://github.com/LedgerHQ/ledger-live/commit/41eca657432071ba1d22029b79be85ca3eff6a94) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Open top-up in the legacy `cl-card` live app when the new `legacyTopUp` param of `lwdPayTab` or `lwmPayTab` is on.

- [#22293](https://github.com/LedgerHQ/ledger-live/pull/22293) [`912b087`](https://github.com/LedgerHQ/ledger-live/commit/912b0877538bd06cc7187b90e2eab8182fe55034) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Keep the aspect ratio of the login intro hero image and theme the desktop row icons

- [#22546](https://github.com/LedgerHQ/ledger-live/pull/22546) [`defb949`](https://github.com/LedgerHQ/ledger-live/commit/defb949c02d9d0d935882eb8e8617d000e18b163) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - fix(pay-card): keep the card visible, with a loading balance, while the session resolves

- [#22359](https://github.com/LedgerHQ/ledger-live/pull/22359) [`8c8defd`](https://github.com/LedgerHQ/ledger-live/commit/8c8defd01b5d76e7bcf23ea3a1797f1bc0384dbc) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Open every Baanx hosted page on the card manifest in the Discover webview, as desktop does, instead of the secure browser.

- [#22414](https://github.com/LedgerHQ/ledger-live/pull/22414) [`9e0d43d`](https://github.com/LedgerHQ/ledger-live/commit/9e0d43d7df2e367cfcebc7b8f4dc1e0dfdca4a99) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Open only the top-up page in the Discover webview; send the other hosted pages back to the secure browser.

- [#22469](https://github.com/LedgerHQ/ledger-live/pull/22469) [`5957a79`](https://github.com/LedgerHQ/ledger-live/commit/5957a79527ed38f0167537be26dcf471c96bcf28) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Open withdraw like top-up: in the Discover webview, or in the legacy cl-card app when legacyTopUp is on.

- [#22682](https://github.com/LedgerHQ/ledger-live/pull/22682) [`f678cbd`](https://github.com/LedgerHQ/ledger-live/commit/f678cbd3c4ac2a5028d98142e076380c1dc2f216) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Mention Monavate instead of Baanx in the Pay card add asset and withdraw copy.

- [#22446](https://github.com/LedgerHQ/ledger-live/pull/22446) [`3d41eab`](https://github.com/LedgerHQ/ledger-live/commit/3d41eab30728e94a21c53d4d4d9fe6eec27a5ce1) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Open the hosted cashback page from the Pay card reward banner

- [#22353](https://github.com/LedgerHQ/ledger-live/pull/22353) [`ae229f2`](https://github.com/LedgerHQ/ledger-live/commit/ae229f27b250d6bdd06af1b06a2912a8c556a27c) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Show a counter-value on the card rewards banner.

  - The reward wallet now carries the currency it is denominated in, like a linked wallet does.
  - The banner prices it with the host's rates and leads with the counter-value.
  - The amount is formatted as a token, not as fiat.
  - A reward nothing can price shows the asset amount alone.
  - `priceWallet` is renamed `getCounterValue`: it converts an amount, it does not price a wallet.

- [#22424](https://github.com/LedgerHQ/ledger-live/pull/22424) [`3fdebf4`](https://github.com/LedgerHQ/ledger-live/commit/3fdebf4a84f5630192e50aef9a0a60b0c56f6a2f) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Refetch card wallet status when returning from Apple or Google Pay so the add-to-wallet CTA can hide.

- [#22241](https://github.com/LedgerHQ/ledger-live/pull/22241) [`3b95cbb`](https://github.com/LedgerHQ/ledger-live/commit/3b95cbb5968a4484966233313ca8e2781b720ae8) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Include the Me contact in Pay contact strips and contact selection, keeping the existing order.

- [#22358](https://github.com/LedgerHQ/ledger-live/pull/22358) [`973a613`](https://github.com/LedgerHQ/ledger-live/commit/973a6136087e8e78eeffd0e761ed3828f9f81691) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Show a Pay disclaimer at the bottom of the desktop Card panel and the mobile Pay tab.

- [#22440](https://github.com/LedgerHQ/ledger-live/pull/22440) [`a39ba90`](https://github.com/LedgerHQ/ledger-live/commit/a39ba900d889155ebc4fe2cab88f82a715e3f605) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix remaining Pay Mixpanel events and user properties from the tracking plan

- [#22479](https://github.com/LedgerHQ/ledger-live/pull/22479) [`b809e60`](https://github.com/LedgerHQ/ledger-live/commit/b809e60d62e2706e0a3f41d377e04a64cd0009e0) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Open the stablecoin Send flow from the Pay New tile. Going back from amount after picking a contact shows the full contact list instead of a prefilled search.

- [#22240](https://github.com/LedgerHQ/ledger-live/pull/22240) [`b2c3742`](https://github.com/LedgerHQ/ledger-live/commit/b2c3742dabf62702a85c8710421bce8ae80dc1fd) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Show an empty-search state in Pay contact selection and dismiss the keyboard before opening a contact.

- [#22427](https://github.com/LedgerHQ/ledger-live/pull/22427) [`b9742c4`](https://github.com/LedgerHQ/ledger-live/commit/b9742c46b56860cc572643b25abfe64660082968) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Drop brackets around the recipient name on the Pay send confirmation screen.

- [#22402](https://github.com/LedgerHQ/ledger-live/pull/22402) [`dccea32`](https://github.com/LedgerHQ/ledger-live/commit/dccea322ed808abfa4e6829364fe945cd0a58383) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Polish the Pay tab: keep the last row of every Pay bottom sheet clear of the Android navigation bar and the iOS home indicator, size the card action buttons to `md`, make the desktop contacts table responsive with a wider name column, wrap the address-picker title, add 32px of scroll padding, widen the history tabs, fix the disclaimer copy and use the shield icon on verify address

- [#22478](https://github.com/LedgerHQ/ledger-live/pull/22478) [`006991d`](https://github.com/LedgerHQ/ledger-live/commit/006991d2a5c7ea7431cb66d13a972c4aafd90258) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Align the Pay tab with the Home screen: its background fades out on scroll, and the balance and action tiles use the same hero spacing as Home. The Home, Pay, Swap and Earn tabs now share one Reanimated-based background.

- [#22031](https://github.com/LedgerHQ/ledger-live/pull/22031) [`f28215d`](https://github.com/LedgerHQ/ledger-live/commit/f28215d4b314c2a2dd32b5f2355aacc4776ee1f5) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Reserve height for the Perps deposit quoted-amount and status rows so the form no longer jumps when switching between the provider notice, the quote, and the error message

- [#22033](https://github.com/LedgerHQ/ledger-live/pull/22033) [`db7b972`](https://github.com/LedgerHQ/ledger-live/commit/db7b972bd6328a2bd215a7adec3bd5353a727a81) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Keep the entered Perps deposit amount when switching the funding asset/account instead of resetting it

- [#22488](https://github.com/LedgerHQ/ledger-live/pull/22488) [`1302bc7`](https://github.com/LedgerHQ/ledger-live/commit/1302bc7968a7d3bf9cd3d556057b662444b22608) Thanks [@LL782](https://github.com/LL782)! - Replace mutable analytics screen refs with a function-only tracking-page API.

- [#22550](https://github.com/LedgerHQ/ledger-live/pull/22550) [`86dbc48`](https://github.com/LedgerHQ/ledger-live/commit/86dbc48147fa1a16aa79c81f844ffe5117b29494) Thanks [@alexstapenka-ledger](https://github.com/alexstapenka-ledger)! - Add the `ptxEarnCtaOnMobile` feature flag and send it to Mixpanel as a boolean identify trait. Earn reads it via Wallet API.

- [#22549](https://github.com/LedgerHQ/ledger-live/pull/22549) [`24e881b`](https://github.com/LedgerHQ/ledger-live/commit/24e881b41d4199d9cf257a7450d139aa5f076a1d) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Hide Pay and card history amounts when discreet mode is enabled, and toggle it from the Pay balance

- [#22501](https://github.com/LedgerHQ/ledger-live/pull/22501) [`909c761`](https://github.com/LedgerHQ/ledger-live/commit/909c761357291f48ac0266d91d6ed563aa4ad833) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Fix a bottom sheet reopening right after being swiped down before its entrance animation finished. Only a dismissal started for a previous presentation now puts the sheet back on screen.

- [#22562](https://github.com/LedgerHQ/ledger-live/pull/22562) [`b8a4056`](https://github.com/LedgerHQ/ledger-live/commit/b8a405658b70b0ca43ec94bff53c5d13e2c16487) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Keep re-reading the Pay Card status after the holder returns from Apple or Google Wallet, and when the app comes back to the foreground

- [#22543](https://github.com/LedgerHQ/ledger-live/pull/22543) [`f13b830`](https://github.com/LedgerHQ/ledger-live/commit/f13b83086f3128575b9bc55af2ba0b3aa9e6d965) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop unmaintained rn-fetch-blob dependency, use expo-file-system for exporting logs

- [#22498](https://github.com/LedgerHQ/ledger-live/pull/22498) [`2a2cee9`](https://github.com/LedgerHQ/ledger-live/commit/2a2cee9e2bae13b7840a0db0bb53477607c6c233) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Replace react-native-easy-markdown with @ronradtke/react-native-markdown-display

- [#22378](https://github.com/LedgerHQ/ledger-live/pull/22378) [`87de096`](https://github.com/LedgerHQ/ledger-live/commit/87de096183309fa2152abe838f09a537b681e8eb) Thanks [@ysitbon](https://github.com/ysitbon)! - refactor(domain): rename `@domain/api-altcoins-sentiment` to `@domain/api-market-index-altcoin-season`

  The package wraps one specific CoinMarketCap product, the Altcoin Season Index, so the old name
  used `sentiment` as a top-level leaf for something that measures capital rotation rather than
  sentiment. The new name places it in the `market-index-*` namespace alongside its Fear and Greed
  sibling and uses the provider's own product name for the leaf.

  The exported api follows the package leaf: `altcoinsSentimentApi` becomes `altcoinSeasonApi` and
  the `AltcoinsSentimentApi` type becomes `AltcoinSeasonApi`. `ALTCOIN_SEASON_INDEX_TAGS`,
  `transformAltcoinSeasonIndexResponse` and `useGetAltcoinSeasonIndexLatestQuery` are unchanged.
  The README, which documented an implementation the package never had, is rewritten against the
  code. No behaviour change.

- [#22376](https://github.com/LedgerHQ/ledger-live/pull/22376) [`cdcb834`](https://github.com/LedgerHQ/ledger-live/commit/cdcb83446d2a70c910fee7cded0b03f3ab325b30) Thanks [@ysitbon](https://github.com/ysitbon)! - refactor(market): rename the Fear & Greed entity package to the `market-index-*` namespace

  `@domain/entity-market-sentiment` becomes `@domain/entity-market-index-fear-and-greed`, and
  `domain/entity/market-sentiment` becomes `domain/entity/market-index-fear-and-greed`. The old
  name used a namespace as a leaf: it holds one specific CoinMarketCap index, not market sentiment
  in general, which left the sibling Altcoin Season index with nowhere to sit.

  Pure rename. No behaviour change, and no symbol changes inside the package: `FearAndGreedIndexSchema`
  and `FearAndGreedIndex` already carried the index's real name.

- [#22510](https://github.com/LedgerHQ/ledger-live/pull/22510) [`d7287f3`](https://github.com/LedgerHQ/ledger-live/commit/d7287f3703314644bac7ffd8ffbceda2b4aa8df8) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Stop the Send header from jumping down when the Send flow opens.

- [#22579](https://github.com/LedgerHQ/ledger-live/pull/22579) [`0e98a58`](https://github.com/LedgerHQ/ledger-live/commit/0e98a58c4f313f55c088be010a360c6d85ea7d43) Thanks [@vpenskyi-ledger](https://github.com/vpenskyi-ledger)! - Re-read `SWAP_API_BASE` on every swap/Perps quote request instead of baking it into the store at startup, so a debug-menu override reaches the aggregator without an app restart

- [#22392](https://github.com/LedgerHQ/ledger-live/pull/22392) [`a6b6959`](https://github.com/LedgerHQ/ledger-live/commit/a6b6959a9540ad1fb7037f9f8cfd76b56e81d02d) Thanks [@CremaFR](https://github.com/CremaFR)! - Include Exchange and signing app versions on swap cancel payloads

- [#22382](https://github.com/LedgerHQ/ledger-live/pull/22382) [`c119e0d`](https://github.com/LedgerHQ/ledger-live/commit/c119e0d38f626314cf679bfa06420ce0e4bca03b) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Redirect the "choose card type" onboarding step to the Baanx hosted order-card page, and align pay bottom sheet spacing and tile styles

- [#22522](https://github.com/LedgerHQ/ledger-live/pull/22522) [`e19e6cf`](https://github.com/LedgerHQ/ledger-live/commit/e19e6cf36074363d22085b6c85c54ef964eb382c) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix the cropped transaction name and date on a card charge funded by several assets, and round card crypto amounts like the rest of the product. A devtool action and a mock fixture now produce such a charge.

- [#22330](https://github.com/LedgerHQ/ledger-live/pull/22330) [`1b1a6ae`](https://github.com/LedgerHQ/ledger-live/commit/1b1a6ae0b098d6d6b81d3e93967d12d162d7e7c2) Thanks [@henri-ly](https://github.com/henri-ly)! - Add `send-recipient-card-title` and `recipient-contact-name` test ids to the new send flow's recipient card and amount step header, so automation can assert the matched contact is carried through the flow

- [#22054](https://github.com/LedgerHQ/ledger-live/pull/22054) [`8c486aa`](https://github.com/LedgerHQ/ledger-live/commit/8c486aabe3dbd100b21e43d3f344fda5142858ed) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Add `@ledgerhq/live-signer-tron`, wrapping `@ledgerhq/device-signer-kit-tron` as `DmkSignerTron`
  alongside the legacy `hw-app-trx` path as `LegacySignerTron`. `families/tron/setup.ts` picks
  between them, using the DMK signer only on a DMK transport with the new `ldmkTronSigner` feature
  flag on. The flag is disabled by default, so Tron keeps signing through `hw-app-trx`.

- [#22471](https://github.com/LedgerHQ/ledger-live/pull/22471) [`0d6407c`](https://github.com/LedgerHQ/ledger-live/commit/0d6407c6a97e0365de546d06f5862397f62f81a8) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - aleo operation details extended with staking details

- [#22524](https://github.com/LedgerHQ/ledger-live/pull/22524) [`720f918`](https://github.com/LedgerHQ/ledger-live/commit/720f91832171f0d0edb69dea91cf730d6c84d9e6) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - fix(wallet-api): close the exchange screen after a live app exchange on mobile

- [#22360](https://github.com/LedgerHQ/ledger-live/pull/22360) [`f153062`](https://github.com/LedgerHQ/ledger-live/commit/f153062440ae90f11f95b7e69ca2e5c1795e9335) Thanks [@LL782](https://github.com/LL782)! - Wire mobile analytics through the shared analytics packages

### Patch Changes

- Updated dependencies [[`b42673e`](https://github.com/LedgerHQ/ledger-live/commit/b42673eed68aba6b2885486d7294f5f9163f721d), [`e8d72da`](https://github.com/LedgerHQ/ledger-live/commit/e8d72dad9cd8aca2bf11b1768d10f2c7553e4cba), [`2d869a5`](https://github.com/LedgerHQ/ledger-live/commit/2d869a596a4562a00003de01cc657d7277dc6b7c), [`c5964f8`](https://github.com/LedgerHQ/ledger-live/commit/c5964f8c6348028d97832dd46cd8554d813d48db), [`370f955`](https://github.com/LedgerHQ/ledger-live/commit/370f95583baf604e3d0e9db3c7c7dadbc6a0c608), [`5f34cb6`](https://github.com/LedgerHQ/ledger-live/commit/5f34cb6848f92e1b520a474a2b779caad6f88804), [`e012138`](https://github.com/LedgerHQ/ledger-live/commit/e012138a1531a651ae62515bed2cada9dbfcfa8c), [`2074967`](https://github.com/LedgerHQ/ledger-live/commit/2074967c2c084e05de67597ae353c783b0b10f92), [`1647f38`](https://github.com/LedgerHQ/ledger-live/commit/1647f38343baf93fbe8333d9abec403797489859), [`8b387f4`](https://github.com/LedgerHQ/ledger-live/commit/8b387f4d1db967288af2f982a78949e0615ebc7e), [`e8d5e1b`](https://github.com/LedgerHQ/ledger-live/commit/e8d5e1bf6eec2a47072ad59762064b24a89701cf), [`c95a00f`](https://github.com/LedgerHQ/ledger-live/commit/c95a00f06cf5e8891e843c0a2cdc17e6d97c85f1), [`3e7af98`](https://github.com/LedgerHQ/ledger-live/commit/3e7af98196476c04a97522109fded33cc17dc868), [`26e51d9`](https://github.com/LedgerHQ/ledger-live/commit/26e51d98fde1c080e09f566e0dbeb4f2c2e9f382), [`eddfcd4`](https://github.com/LedgerHQ/ledger-live/commit/eddfcd47ba49d55715ed9dc7a619867cd5a636d5), [`6a5972d`](https://github.com/LedgerHQ/ledger-live/commit/6a5972df49e243bbb36cd973e405302d0d8925bc), [`3e7bbe9`](https://github.com/LedgerHQ/ledger-live/commit/3e7bbe93f6075a2a6783e05d36459c166366c910), [`c32cde3`](https://github.com/LedgerHQ/ledger-live/commit/c32cde31461523c72df4f67cd18288c6f65c9951), [`ad2f1de`](https://github.com/LedgerHQ/ledger-live/commit/ad2f1deb73d1fd6fed1383133a7f2b259630cd06), [`6baab2e`](https://github.com/LedgerHQ/ledger-live/commit/6baab2e7989b00bec4c361cee3535f76cb919915), [`cfb7566`](https://github.com/LedgerHQ/ledger-live/commit/cfb756682290e9940d65f3b6417d6b111449e546), [`bc28500`](https://github.com/LedgerHQ/ledger-live/commit/bc2850004d7cbc59aac8093b3739bfcc351daf43), [`4d84f2b`](https://github.com/LedgerHQ/ledger-live/commit/4d84f2b23f3bc04c06770e390e22cd4e35ee3fe3), [`5adf8f3`](https://github.com/LedgerHQ/ledger-live/commit/5adf8f3b844e21895aa17f96a620a2dfa6b679ad), [`6e76dda`](https://github.com/LedgerHQ/ledger-live/commit/6e76ddac6370bb60b17971679a857fae7ca83eb9), [`486a1a4`](https://github.com/LedgerHQ/ledger-live/commit/486a1a45027e8104ae824d77bd34b298788c9b04), [`f7cd861`](https://github.com/LedgerHQ/ledger-live/commit/f7cd8616265d3f94fef24332626402efe39eb83f), [`f1d8aac`](https://github.com/LedgerHQ/ledger-live/commit/f1d8aac1c7c0bc0be9beb1508c1a9ef3cf7affae), [`33b4952`](https://github.com/LedgerHQ/ledger-live/commit/33b4952ef04d4e0528d2735ba299b4a8073e447e), [`e9af9cb`](https://github.com/LedgerHQ/ledger-live/commit/e9af9cb415b3ba4038d13ffc2dca7edb0432c830), [`d6866e7`](https://github.com/LedgerHQ/ledger-live/commit/d6866e7dc7ced8898ac585d4e34d9667d9ad7f17), [`f8c92f9`](https://github.com/LedgerHQ/ledger-live/commit/f8c92f9300d4b8268949ed7aff5a6781ed7f60a8), [`7fd570c`](https://github.com/LedgerHQ/ledger-live/commit/7fd570cd3868a675dad0d77136734eab63f11bd1), [`e046686`](https://github.com/LedgerHQ/ledger-live/commit/e046686befa308188170ac9950eae394863c76a5), [`b4599a5`](https://github.com/LedgerHQ/ledger-live/commit/b4599a58f817aa233be256d6f755a0fd4d0fc8a5), [`8475c70`](https://github.com/LedgerHQ/ledger-live/commit/8475c704ed5cc75bcfddc9789130281ad0c2aca5), [`381bd0b`](https://github.com/LedgerHQ/ledger-live/commit/381bd0befb6a09f20f13f65c233f0e1479e7051d), [`dfd53ad`](https://github.com/LedgerHQ/ledger-live/commit/dfd53adbf0815e2a62f59c1e996bd709bd710ea0), [`c63d0fa`](https://github.com/LedgerHQ/ledger-live/commit/c63d0fa3ad6f181beb5d8ea7b2ef474d82fd1ed7), [`9e54487`](https://github.com/LedgerHQ/ledger-live/commit/9e5448750d57eb92f95ef828b55d80eedd826323), [`83fac3e`](https://github.com/LedgerHQ/ledger-live/commit/83fac3e00782840d1f118180dfb9afb9a484952c), [`b6a9b53`](https://github.com/LedgerHQ/ledger-live/commit/b6a9b531267360fdca64b8db22dd8781aa414dd9), [`68f4179`](https://github.com/LedgerHQ/ledger-live/commit/68f41798cae68cd1b91f291d5447514b80fd6f49), [`8ecbe06`](https://github.com/LedgerHQ/ledger-live/commit/8ecbe0676b614fed535900aa6085ddebabc8d85c), [`46f0f94`](https://github.com/LedgerHQ/ledger-live/commit/46f0f9447e12faa953268bf2a19fbdfd85a43da9), [`ea90542`](https://github.com/LedgerHQ/ledger-live/commit/ea90542540f47a76c18cf5f440bb98b9be71c837), [`e8518d7`](https://github.com/LedgerHQ/ledger-live/commit/e8518d7f0b88096552c6a8f74ffe5752bc517a39), [`41eca65`](https://github.com/LedgerHQ/ledger-live/commit/41eca657432071ba1d22029b79be85ca3eff6a94), [`912b087`](https://github.com/LedgerHQ/ledger-live/commit/912b0877538bd06cc7187b90e2eab8182fe55034), [`defb949`](https://github.com/LedgerHQ/ledger-live/commit/defb949c02d9d0d935882eb8e8617d000e18b163), [`70d0b90`](https://github.com/LedgerHQ/ledger-live/commit/70d0b90b67ff013f19318378c78a3f3d442f773b), [`887561b`](https://github.com/LedgerHQ/ledger-live/commit/887561bb56c7bbe4c5ff3d62a3309ce3d449a72c), [`aee5fe8`](https://github.com/LedgerHQ/ledger-live/commit/aee5fe897519c1bc39f0d4891bbc1ee4a7aaaaa1), [`3d41eab`](https://github.com/LedgerHQ/ledger-live/commit/3d41eab30728e94a21c53d4d4d9fe6eec27a5ce1), [`ae229f2`](https://github.com/LedgerHQ/ledger-live/commit/ae229f27b250d6bdd06af1b06a2912a8c556a27c), [`3fdebf4`](https://github.com/LedgerHQ/ledger-live/commit/3fdebf4a84f5630192e50aef9a0a60b0c56f6a2f), [`3b95cbb`](https://github.com/LedgerHQ/ledger-live/commit/3b95cbb5968a4484966233313ca8e2781b720ae8), [`973a613`](https://github.com/LedgerHQ/ledger-live/commit/973a6136087e8e78eeffd0e761ed3828f9f81691), [`a39ba90`](https://github.com/LedgerHQ/ledger-live/commit/a39ba900d889155ebc4fe2cab88f82a715e3f605), [`fc6f187`](https://github.com/LedgerHQ/ledger-live/commit/fc6f1878bb1fa7f0c87c18478abbb194c6edee0d), [`6fa8121`](https://github.com/LedgerHQ/ledger-live/commit/6fa81215cdeade45495994d5dc7dc0477c097e2c), [`b2c3742`](https://github.com/LedgerHQ/ledger-live/commit/b2c3742dabf62702a85c8710421bce8ae80dc1fd), [`dccea32`](https://github.com/LedgerHQ/ledger-live/commit/dccea322ed808abfa4e6829364fe945cd0a58383), [`006991d`](https://github.com/LedgerHQ/ledger-live/commit/006991d2a5c7ea7431cb66d13a972c4aafd90258), [`a025d7a`](https://github.com/LedgerHQ/ledger-live/commit/a025d7a872b7b1e4681d16b2bfb54f8949bf6626), [`1302bc7`](https://github.com/LedgerHQ/ledger-live/commit/1302bc7968a7d3bf9cd3d556057b662444b22608), [`86dbc48`](https://github.com/LedgerHQ/ledger-live/commit/86dbc48147fa1a16aa79c81f844ffe5117b29494), [`24e881b`](https://github.com/LedgerHQ/ledger-live/commit/24e881b41d4199d9cf257a7450d139aa5f076a1d), [`909c761`](https://github.com/LedgerHQ/ledger-live/commit/909c761357291f48ac0266d91d6ed563aa4ad833), [`b8a4056`](https://github.com/LedgerHQ/ledger-live/commit/b8a405658b70b0ca43ec94bff53c5d13e2c16487), [`9cafda0`](https://github.com/LedgerHQ/ledger-live/commit/9cafda098001d1912b872e341c4568386b70ed75), [`b4a23ea`](https://github.com/LedgerHQ/ledger-live/commit/b4a23ea27edbc4a3e8aeaee1da6f0e7aecefab92), [`a896fca`](https://github.com/LedgerHQ/ledger-live/commit/a896fca1974a46f10e915d1212e0947e2d808ad5), [`87de096`](https://github.com/LedgerHQ/ledger-live/commit/87de096183309fa2152abe838f09a537b681e8eb), [`cdcb834`](https://github.com/LedgerHQ/ledger-live/commit/cdcb83446d2a70c910fee7cded0b03f3ab325b30), [`4f0fdc3`](https://github.com/LedgerHQ/ledger-live/commit/4f0fdc3d78ac46e4396106eaf10e20ca6c0ed3cf), [`3fdfcc0`](https://github.com/LedgerHQ/ledger-live/commit/3fdfcc07ffb1d8e0b5ef39c830a5e7204ced77e3), [`93e6db2`](https://github.com/LedgerHQ/ledger-live/commit/93e6db2db85721b483173e781db9f53db3699715), [`8a305ed`](https://github.com/LedgerHQ/ledger-live/commit/8a305edb307d0a4cd30ad615ccd98ef5d7caf523), [`c020110`](https://github.com/LedgerHQ/ledger-live/commit/c02011033bf5ca5bf38f05c487adb3a27c209a7d), [`0e98a58`](https://github.com/LedgerHQ/ledger-live/commit/0e98a58c4f313f55c088be010a360c6d85ea7d43), [`c119e0d`](https://github.com/LedgerHQ/ledger-live/commit/c119e0d38f626314cf679bfa06420ce0e4bca03b), [`e19e6cf`](https://github.com/LedgerHQ/ledger-live/commit/e19e6cf36074363d22085b6c85c54ef964eb382c), [`8c486aa`](https://github.com/LedgerHQ/ledger-live/commit/8c486aabe3dbd100b21e43d3f344fda5142858ed), [`88bae04`](https://github.com/LedgerHQ/ledger-live/commit/88bae04e2f7e7a3de8d55c340fe32b48e37bd78d), [`df5d8c9`](https://github.com/LedgerHQ/ledger-live/commit/df5d8c96892094fc6faf06992f415e88ff64b5c8), [`f7ba21f`](https://github.com/LedgerHQ/ledger-live/commit/f7ba21f7df883e71102a0949c8a3d23e20fb4cbd), [`62cc42f`](https://github.com/LedgerHQ/ledger-live/commit/62cc42f32d041e0e1081e7fdaca04169581429ec)]:
  - @domain/api-card-management@0.8.0-next.0
  - @features/flow-pay-card-details@0.6.0-next.0
  - @features/platform-pay-analytics@0.3.0-next.0
  - @features/flow-contacts-list@0.9.0-next.0
  - @ledgerhq/types-live@6.126.0-next.0
  - @domain/api-market-index-fear-and-greed@0.4.0-next.0
  - @features/flow-app-lock@0.6.0-next.0
  - @features/platform-app-lock@0.5.0-next.0
  - @shared/ui-info-state@0.4.0-next.0
  - @ledgerhq/live-dmk-shared@0.34.0-next.0
  - @ledgerhq/live-dmk-mobile@0.30.0-next.0
  - @ledgerhq/live-signer-evm@0.24.0-next.0
  - @ledgerhq/device-onboarding@0.4.0-next.0
  - @ledgerhq/coin-casper@3.5.0-next.0
  - @features/platform-device-action-content@0.3.0-next.0
  - @features/flow-contacts@0.13.0-next.0
  - @features/flow-pay-card-assets@0.3.0-next.0
  - @shared/ui-queued-bottom-sheet@0.6.0-next.0
  - @features/flow-pay-balance@0.6.0-next.0
  - @features/flow-pay-card-transactions@0.4.0-next.0
  - @features/flow-pay-card@0.6.0-next.0
  - @features/flow-pay-card-widget@0.5.0-next.0
  - @shared/feature-flags@0.25.0-next.0
  - @shared/env@0.9.0-next.0
  - @features/platform-contacts@0.9.0-next.0
  - @features/flow-pay-contact@0.5.0-next.0
  - @ledgerhq/wallet-analytics@0.5.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.6.0-next.0
  - @domain/entity-currency-crypto@0.14.0-next.0
  - @ledgerhq/coin-bitcoin@0.54.0-next.0
  - @ledgerhq/live-signer-tron@0.2.0-next.0
  - @features/flow-pay-card-auth@0.9.0-next.0
  - @ledgerhq/transaction-observability@0.4.0-next.0
  - @ledgerhq/coin-cosmos@1.5.0-next.0
  - @features/flow-pay-request@0.7.0-next.0
  - @domain/entity-market-index-altcoin-season@0.3.0-next.0
  - @ledgerhq/coin-canton@1.3.0-next.0
  - @ledgerhq/coin-concordium@1.5.0-next.0
  - @ledgerhq/coin-filecoin@2.3.0-next.0
  - @ledgerhq/coin-multiversx@1.3.0-next.0
  - @ledgerhq/coin-stacks@0.32.0-next.0
  - @features/flow-pay-feature-tour@0.7.0-next.0
  - @features/flow-pay-bank-transfer@0.4.0-next.0
  - @features/flow-pay-deposit@0.5.0-next.0
  - @devtools/bindings@0.10.0-next.0
  - @shared/analytics@0.4.0-next.0
  - @domain/api-market-index-altcoin-season@0.4.0-next.0
  - @domain/entity-market-index-fear-and-greed@0.3.0-next.0
  - @shared/analytics-react@0.4.0-next.0
  - @shared/api-services@0.9.0-next.0
  - @features/platform-card@0.6.1-next.0
  - @ledgerhq/device-core@0.11.18-next.0
  - @ledgerhq/live-countervalues-react@0.18.2-next.0
  - @ledgerhq/live-send@0.1.2-next.0
  - @ledgerhq/live-wallet@1.1.5-next.0
  - @ledgerhq/wallet-pnl@0.7.13-next.0
  - @features/flow-contacts-edit-address@0.4.1-next.0
  - @features/flow-contacts-add-address@0.6.1-next.0
  - @features/flow-large-screen-upsell@2.2.1-next.0
  - @features/platform-currencies@0.9.1-next.0
  - @features/platform-feature-flags@0.8.1-next.0
  - @domain/api-aggregated-assets@0.5.3-next.0
  - @features/platform-aggregated-assets@0.5.5-next.0
  - @features/platform-env@0.4.1-next.0
  - @features/flow-contacts-add-contact@0.7.1-next.0
  - @features/flow-contacts-delete-contact@0.2.4-next.0
  - @features/flow-contacts-edit-contact@0.6.1-next.0
  - @ledgerhq/live-countervalues@0.26.2-next.0
  - @domain/api-currency-token@0.6.3-next.0
  - @domain/entity-contact@0.10.1-next.0
  - @domain/entity-currency@0.4.5-next.0
  - @domain/entity-currency-token@0.5.4-next.0
  - @features/flow-contacts-introduction@1.2.0
  - @domain/api-currency-fiat@0.4.6-next.0
  - @domain/api-push-devices@0.2.7-next.0
  - @devtools/shell@0.10.1-next.0
  - @features/flow-analytics-consent@0.2.8-next.0

## 4.22.0

### Minor Changes

- [#22003](https://github.com/LedgerHQ/ledger-live/pull/22003) [`40d296b`](https://github.com/LedgerHQ/ledger-live/commit/40d296b822381cc5d05616acafa1bca61e500dce) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Record the provider app the Card login redirect names, and send x-us-env on every Card request of a US holder

- [#22149](https://github.com/LedgerHQ/ledger-live/pull/22149) [`4d1d640`](https://github.com/LedgerHQ/ledger-live/commit/4d1d64049a0bb0562a1a0c8ad2555fe967acdd7f) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add card reward wallet endpoint and mobile reward balance view

- [#21741](https://github.com/LedgerHQ/ledger-live/pull/21741) [`250c1c0`](https://github.com/LedgerHQ/ledger-live/commit/250c1c0e4cd081a67f46b37e852291a32e02b05b) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add a mobile card-numbers View/Hide control that flips to the provider numbers image

- [#22258](https://github.com/LedgerHQ/ledger-live/pull/22258) [`e82ab0c`](https://github.com/LedgerHQ/ledger-live/commit/e82ab0cba1624965b625b12a6bd51c785c1b21df) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Wire the card's Manage PIN and Access Baanx rows to open the Baanx hosted pages in the secure
  browser, and the Help row to open the support article externally.

- [#21520](https://github.com/LedgerHQ/ledger-live/pull/21520) [`0d90780`](https://github.com/LedgerHQ/ledger-live/commit/0d907805cebbd0916e27f94bcf3685be2a4ef872) Thanks [@pawell24](https://github.com/pawell24)! - Announce the receive QR code to screen readers

  The QR container on the shared receive confirmation screen carried a `testID` but no
  `accessible` prop, so it never joined the accessibility tree. It is now a focusable
  element with a role and a localized label, instead of being skipped or announced as
  an unlabeled node.

- [#21747](https://github.com/LedgerHQ/ledger-live/pull/21747) [`871e485`](https://github.com/LedgerHQ/ledger-live/commit/871e4854284a0b21e31b53ff0ac312010093d914) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix keyboard handling in the mobile Contacts add, edit, and send flows. Input sheets now open at full height with the keyboard, primary actions remain visible in a keyboard-aware `QueuedBottomSheet` footer, and name fields focus immediately and capitalize each word.

- [#22077](https://github.com/LedgerHQ/ledger-live/pull/22077) [`72367fc`](https://github.com/LedgerHQ/ledger-live/commit/72367fcf2343fa488008236f1005da589e6e3054) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Wire the card onboarding widget to real, derived onboarding data and remove the unused stub endpoint and legacy devtool mock path it replaces

- [#22093](https://github.com/LedgerHQ/ledger-live/pull/22093) [`2e94d90`](https://github.com/LedgerHQ/ledger-live/commit/2e94d909a573f7e52595a6fe38241f171ea7feab) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Fix available balance showing inflated value for DADA cross-network assets (e.g. Tezos + Etherlink)

- [#22192](https://github.com/LedgerHQ/ledger-live/pull/22192) [`c22ee67`](https://github.com/LedgerHQ/ledger-live/commit/c22ee67d3e0271b382337fe4175170bdabf5dfca) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add reusable Apple/Google Pay add-to-wallet CTA, instructions, and wallet-app opening.

- [#22218](https://github.com/LedgerHQ/ledger-live/pull/22218) [`285b50d`](https://github.com/LedgerHQ/ledger-live/commit/285b50dc311eef60089f779cffdfe14a0422d2ec) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Open Google Wallet through its launch intent, and show iOS and Android error scenes when the wallet app is unavailable, with a Play Store fallback on Android.

- [#21999](https://github.com/LedgerHQ/ledger-live/pull/21999) [`724f029`](https://github.com/LedgerHQ/ledger-live/commit/724f02932ccdf8ba5b8f8f0ccc10b9edbe7547cd) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat(aleo): share the bond pieces between Desktop and Mobile

  Replaces the ad-hoc messages `getTransactionStatus` returned for a rejected bond with typed
  error classes, translated on both clients and now distinguishing a closed validator from an
  unbonding one. Adds the `isValidatorBondable` / `getMinBondAmount` helpers to the coin
  module, moves the per-network default validator into the Aleo currency config so every
  client reads the same address, and adds a reusable Aleo bridge mock for Mobile.

- [#22336](https://github.com/LedgerHQ/ledger-live/pull/22336) [`b5d2be9`](https://github.com/LedgerHQ/ledger-live/commit/b5d2be9040f0f36f5c83c9f502105d1c96df2344) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - feat(aleo): add the claim unbonded staking flow on Mobile

- [#22137](https://github.com/LedgerHQ/ledger-live/pull/22137) [`353ed46`](https://github.com/LedgerHQ/ledger-live/commit/353ed46035b09d33eff6b5b76fe7ad3d19510e38) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat(aleo): show the staking position and its status on the Mobile account page

- [#22123](https://github.com/LedgerHQ/ledger-live/pull/22123) [`b5338ec`](https://github.com/LedgerHQ/ledger-live/commit/b5338ec9173a08073a4b8524fe095428bb710a99) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - feat(aleo): add the shared staking hooks the delegation views read

- [#22212](https://github.com/LedgerHQ/ledger-live/pull/22212) [`49b535f`](https://github.com/LedgerHQ/ledger-live/commit/49b535fa6cab495b0b8659c042c743b8f65c2ce2) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - refactor(aleo): serve the validator committee from RTK Query

- [#22211](https://github.com/LedgerHQ/ledger-live/pull/22211) [`d137f01`](https://github.com/LedgerHQ/ledger-live/commit/d137f01ed03877ca783d8b97eb303bde6e3ff998) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Offer biometrics on the unlock screen with the symbol the device actually uses.

  The field asked for biometrics with a generic touch symbol, because Lumen had no biometric one when the screen was built. It has since gained `FaceId` and `Fingerprint`, so a face device now shows a face and a fingerprint device a fingerprint.

  The device reports six kinds and there are two symbols: a touch is a fingertip on either platform, and everything the device reads from the face — iris and Optic ID included — takes the face symbol, since there is no iris symbol and an eye read is nearer a face than a fingertip. The capability is read asynchronously while the affordance comes from stored state, so the generic touch symbol still stands in for the moment before the device has answered, and for a read that fails.

- [#22275](https://github.com/LedgerHQ/ledger-live/pull/22275) [`35a5198`](https://github.com/LedgerHQ/ledger-live/commit/35a51980fc4d32efd7fd8440e5f5e9ef6a7348db) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Give a user protected by biometrics alone a way back when their face goes unread.

  The unlock screen already retried the prompt when tapped, but nothing said so: with no password set, a face the camera never saw left the Ledger mark on black and no visible way forward. The whole screen being the button is no help to someone who cannot tell there is a button.

  A real call to action now sits under the mark — "Unlock Ledger Wallet" — and it appears only once the prompt has gone. While the prompt is up the system dialog owns the screen, and at boot the bare mark is what keeps the handover from the launch screen invisible.

  The other half is the OS's and already works: while its dialog is up, the device credential the app asks for makes iOS draw "Try Face ID Again" and "Enter Passcode" itself. It is only after that dialog is cancelled, when nothing will reopen it, that the app has to offer the way back.

- [#22125](https://github.com/LedgerHQ/ledger-live/pull/22125) [`795e693`](https://github.com/LedgerHQ/ledger-live/commit/795e693bd67a942bc3c272183476ef470d3c8605) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Make biometrics a protection in its own right: password and biometrics become independent, and either one alone is enough to lock the app.

  Biometrics used to require a password. Its Settings row was disabled until one existed and reset itself whenever the password went away, and the legacy lock returned early without a password, so a biometrics-only user was never locked at all. The revamped path now derives the lock from both protections, so enabling biometrics alone locks the app — and Settings offers it with no password set.

  The row is hidden where the device has no biometrics, or has the hardware with nothing enrolled, rather than shown disabled: there is nothing the user could do about it from that screen.

  Biometrics is asked for **before** the unlock screen draws a field, so it is the first thing the user meets and the password is the fallback. While the prompt is up the screen stands in for the splash, with the mark at the splash's own size so the handover moves nothing. Only a refusal reveals the password field — and a user protected by biometrics alone never sees it: pressing the screen asks again, which is their only way in.

  The prompt is an explicit owner check through `BiometricPrompt` / `LAContext`, not a side effect of reading a protected keychain item. A biometry-gated read can resolve without the OS ever showing anything, and Android reports a correct device PIN as a success the keystore item cannot consume — either way the caller is told the user proved something they were never asked for. On Android 11 and above the OS draws its own "use PIN" button in place of the negative one, and every label it shows comes from the app rather than the library's English defaults.

  The keychain item is therefore a plain marker, not an authentication step: it records that biometrics is on, which the protection state cannot do on its own, being held in memory only. Enabling proves before it records, and a refusal stores nothing.

  The device credential is accepted, because biometrics can now be the only protection: a lockout after failed attempts would otherwise leave the owner with nothing to try. The consequence to accept is that someone who knows the device passcode can open the app — for a user who also set a password, the weaker path.

  Protection that outlived its install is destroyed at boot. iOS keeps keychain items when an app is deleted while Android wipes them, so a reinstall found the previous password and demanded it — for data that went with the uninstall, leaving an owner who had forgotten it locked out of an empty app, advised to reinstall, which is what they had just done. A marker in app storage settles which install the protection belongs to, since an uninstall clears that and not the keychain. The cost, worth stating: clearing app data now clears the lock too, which follows from the threat model this epic assumes — opportunistic access control, not data protection — since anyone who can wipe the data can reinstall anyway.

  Removing biometrics asks for it too. Removing a password requires typing it, so removing biometrics must cost as much: an unlocked phone in someone else's hands would otherwise strip the protection in one tap, with nothing asked. A refused prompt leaves both the canary and the switch as they were.

  **The canary accepts the device passcode** (`BIOMETRY_ANY_OR_DEVICE_PASSCODE`), superseding the earlier `BIOMETRY_CURRENT_SET` choice. That choice was made when biometrics released a key, where invalidating the item on re-enrolment was the right trade. With no key involved, its only remaining effect would be to shut a biometrics-only user out of their own app with nothing left to try — no password to fall back on and no material to recover. The consequence to accept is that someone who knows the device passcode can open the app; for a user who also set a password, that is a weaker path than the password itself.

- [#22163](https://github.com/LedgerHQ/ledger-live/pull/22163) [`944bd23`](https://github.com/LedgerHQ/ledger-live/commit/944bd2345899c399bc931144fe46b48d0d1bf55b) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Tell a user who has forgotten their app-lock password what their options are, from the unlock screen.

  The link was already on the unlock screen and the flow package already accepted the callback, but nothing in the app provided it — so the link never rendered and there was no answer to give.

  There is no recovery to offer, and that is the point of the scheme: the password is not stored, only a verifier derived from it, so nothing can reverse it. The sheet says so and names the one way back — reinstalling the app, which drops the lock along with the app's data. That advice is only true now that protection outliving its install is destroyed at boot; before, on iOS the keychain survived an uninstall and the reinstall demanded the very password the user had forgotten.

  The sheet is absent for a user protected by biometrics alone, who has no password to forget.

  The sheet lives in the flow package with the screen that raises it, which needed `@shared/ui-info-state` to offer `./native` and `./web` entries beside its conditional root: a `features/flow` package can only reach the root through the `react-native` condition, and that condition resolves Lumen to source and demands its whole native peer graph. Existing consumers keep importing the root, and keep the conditions they had.

- [#22045](https://github.com/LedgerHQ/ledger-live/pull/22045) [`1badf50`](https://github.com/LedgerHQ/ledger-live/commit/1badf50ec0c225f93b46ed5b1368257cc9b8e88d) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Hold the app behind the lock on boot and when it comes back from the background, behind `lwmPasswordRevamp`.

  `AppLockGate` sits above the app, decides once on boot whether protection is configured, and locks again whenever the app is backgrounded. The unlock screen renders over the app rather than replacing it, so nothing below unmounts and the user lands where they left off.

  Two details carry more weight than they look:

  The protection state is read back from the keychain at startup — until now it only lived in memory, so a relaunch reported no password at all. The Settings row renders nothing until that read answers, rather than showing "off" and correcting itself a moment later. A read that fails counts as protected: the app would otherwise open itself on a keychain error.

  Backgrounding is judged per platform. On iOS only `background` locks, because the biometric prompt itself pushes the app to `inactive` — locking there would mean the prompt locks the app it was about to open.

  Which path the app takes is decided by the stored state, not only by the flag: a user who already holds a verifier keeps the revamped screens even if `lwmPasswordRevamp` is rolled back, since the legacy ones cannot remove it and ignoring it would silently drop their protection. That resolved scheme now governs the add and modify navigators too, which read the raw flag until now — on a rollback they sent a verifier holder to the legacy removal screen, which clears the legacy keychain entry and leaves the verifier in place, so the lock could not be turned off.

  Removing the last protection also releases the lock. A removal takes a slow derivation, and backgrounding during it locks the app; the removal then destroyed the verifier while the lock stood, leaving an unlock screen with nothing left to open it.

  While that read is in flight the app is covered rather than shown: the state starts unlocked, so rendering it would hand the app to whoever holds the phone for as long as the keychain takes. Once locked, the app below stays mounted — unlocking returns the user where they were — but leaves the accessibility tree, or a screen reader would walk into it.

- [#22098](https://github.com/LedgerHQ/ledger-live/pull/22098) [`8d1a795`](https://github.com/LedgerHQ/ledger-live/commit/8d1a79550afabc570b2d3b7867432d5a9f1d4e87) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Move existing passwords off the plaintext scheme onto a verifier, without asking the user anything.

  Every user with a password today is on a scheme that stores it in plaintext and verifies it by string comparison — not only the short ones. The migration derives a digest from the password they already have, so it needs the plaintext: it runs right after a successful **legacy** unlock, the one moment the password has been proven and is in hand, and not at boot.

  Write, prove, only then delete. A crash between the write and the delete leaves the user a way in through the legacy entry; after the delete, through the verifier. Never through neither. That also makes it resumable: a verifier already present means an earlier run got that far, so the next one proves it and finishes rather than deriving a second time. A stored verifier the proven password will not open is derived over, since it can only be a half-written record or one this migration never put there, and the plaintext in hand at that moment restores a credential that works. Only a keychain that will not hold the record defers, leaving the legacy entry as the way in — as does one that declines to delete the legacy entry, since the plaintext is still there and needs the lock that stands over it.

  A run that died between the delete and retiring the legacy lock is repaired on the next boot: the entry gone with a verifier in its place can only mean the sequence reached its last step, so that verifier is what opens the app and the legacy flag is released. Without that the legacy screen asked for a password nothing could check.

  A completed migration retires the legacy lock, clearing `privacy.hasPassword`. Without it the app carries two independent guards: the old `AuthPass` screen renders over the new unlock screen, and the revamped Settings row hides the legacy toggle that could remove the old credential.

  Whether the password is under the six-character minimum is recorded as it migrates, because nothing can tell afterwards — a verifier says nothing about the length of the password behind it. The prompt that acts on it is LIVE-35981.

  The derivation queue is held for exactly one turn across the whole sequence. This shipped broken once: the migration took a turn and then called a password check that asked for another, so the inner call waited on the outer, the outer on the inner, and every later check waited on both — the app could not be unlocked at all. The check is now the unserialised primitive the public checks are built on, and a test fails if anything asks for a second turn.

- [#22179](https://github.com/LedgerHQ/ledger-live/pull/22179) [`a1a8b81`](https://github.com/LedgerHQ/ledger-live/commit/a1a8b81b3f9b4eb897ac3d81427a1df0a5e0130b) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Let any part of the app ask for the app to be protected before it continues, and answer for it.

  A feature that needs protection — the Card, first — now awaits one call: `requestProtection()`. The prompt decides what to ask for, so no caller looks at biometry: biometrics if the device has some enrolled, a password otherwise. An already-protected user is never interrupted and their action simply runs.

  The password path opens the existing add-password flow and comes back with a confirmation sheet, so the caller resumes where it left off. Dismissing the prompt, or backing out of the password flow, holds the caller's action instead — a request never resolves as protected unless protection is actually in place.

  Both sheets are mounted once, above the screens, so navigating away no longer closes the prompt the way a screen-owned sheet would.

  The card is the first caller: both ways out of its login lead to the provider, so signing up and logging in each wait for protection. The card flow takes the request as a prop, since a flow package cannot reach the app's prompt, and only the native entry passes one — desktop has no app lock and is unchanged.

- [#22220](https://github.com/LedgerHQ/ledger-live/pull/22220) [`b837ca4`](https://github.com/LedgerHQ/ledger-live/commit/b837ca423c9f1f115a9e40c8b3504bdf2750b11e) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Let a reinstall actually clear an app-lock password, as it is meant to.

  Protection that outlives its install is destroyed at boot, which is the only way out for someone who has forgotten their password — the sheet on the unlock screen tells them so. Deciding whether protection belongs to this install fell back to "does app storage hold settings", for users whose protection predates the marker that now records an install. The app writes settings within a second of any launch, though, so a fresh install could read its own footprint as history and keep the protection the uninstall was supposed to take away.

  The fallback now asks whether onboarding was ever completed, which is the one thing a reinstalled user has not done yet by the time the lock decides, whatever else has already been written to storage.

- [#21984](https://github.com/LedgerHQ/ledger-live/pull/21984) [`675564f`](https://github.com/LedgerHQ/ledger-live/commit/675564fc759b896ffcc26c99fc4d9d0a0a3bd344) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the unlock screen and route every password check through one place.

  `checkPassword` becomes the only function that verifies a password, used by both unlock and deactivation, so neither can drift into comparing against something stored. It derives with the parameters carried by the verifier rather than the current defaults, which is what lets a password set before a cost change still be proven.

  The screen itself follows Figma: black full-bleed with the Ledger mark near the top, the shared password field under it, and the CTA labelled Confirm. It is forced to the dark palette rather than following the user's theme — the splash is black and this screen takes over from it with the mark in the same place, so a light rendering would flash on handover. It also carries no minimum-length rule, since the password may predate the six-character one.

  Nothing mounts it yet: the orchestration, the biometric path and the forgot-password sheet are the gate.

- [#22228](https://github.com/LedgerHQ/ledger-live/pull/22228) [`1ec8d15`](https://github.com/LedgerHQ/ledger-live/commit/1ec8d15feb3f9339bc09c18c682e140d370c9efe) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Refine the Pay card assets list with loading skeletons, translated states, funding information, and asset values in the details dialog.

- [#22312](https://github.com/LedgerHQ/ledger-live/pull/22312) [`319fbe4`](https://github.com/LedgerHQ/ledger-live/commit/319fbe464cbf256b7b3ee57113b6abd6c52ccd55) Thanks [@sarneijim](https://github.com/sarneijim)! - Show the signed-off Touchscreen Upgrade Program copy only to Nano S users

- [#22278](https://github.com/LedgerHQ/ledger-live/pull/22278) [`95a1007`](https://github.com/LedgerHQ/ledger-live/commit/95a1007bb9d4f62d693391a99eca3cb3b12f0e7d) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Reveal card numbers as soon as the image loads and shorten the flip to 300ms

- [#22200](https://github.com/LedgerHQ/ledger-live/pull/22200) [`843f033`](https://github.com/LedgerHQ/ledger-live/commit/843f03312cd4258f078c59bc9ed4e830a4d19917) Thanks [@alexstapenka-ledger](https://github.com/alexstapenka-ledger)! - Preserve protocol selection in Earn deposit deeplinks

- [#22182](https://github.com/LedgerHQ/ledger-live/pull/22182) [`1557452`](https://github.com/LedgerHQ/ledger-live/commit/1557452f86f214191d2f29e5fca40b5077f90e11) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Reveal card numbers without a password unlock gate

- [#22076](https://github.com/LedgerHQ/ledger-live/pull/22076) [`83fd219`](https://github.com/LedgerHQ/ledger-live/commit/83fd2190c658f4604e87cbe55f380f5d5caed88e) Thanks [@0xMM-L](https://github.com/0xMM-L)! - Fix the Casper device confirmation step where the Fee and Amount values were blank: they are now rendered inside a Text node via `DataRowUnitValue` instead of being passed as a raw element to `TextValueField`.

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

- [#22271](https://github.com/LedgerHQ/ledger-live/pull/22271) [`c52af21`](https://github.com/LedgerHQ/ledger-live/commit/c52af21b622efa62774657e190abb9762cffac1c) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix the blank sheet that could appear when adding contacts one after another on iOS. A sheet is now dismissed once per presentation, and a dismissal nobody asked for puts the sheet back on screen instead of hiding the content of the presentation the user has just opened. A sheet that reaches the screen after being considered closed is dismissed once it animates, which is the point gorhom stops ignoring the request.

- [#22000](https://github.com/LedgerHQ/ledger-live/pull/22000) [`ed407de`](https://github.com/LedgerHQ/ledger-live/commit/ed407de125dcb8d022cd528e8e7ddf8f59977b2d) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: aleo staking bond flow

- [#22187](https://github.com/LedgerHQ/ledger-live/pull/22187) [`31ec33f`](https://github.com/LedgerHQ/ledger-live/commit/31ec33f649209bd2b6971afc173e2e41f53c313f) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - aleo part 2 staking ui

- [#22089](https://github.com/LedgerHQ/ledger-live/pull/22089) [`6183efd`](https://github.com/LedgerHQ/ledger-live/commit/6183efddac5de725cb22a013d5a9cdc94e65f756) Thanks [@benruseau](https://github.com/benruseau)! - Add the create backup sub-step to the OS updates orchestrator

  Extract the device error cause recovery into a state machine shared by all sub-steps

  Refactor the OS updates debug screen

- [#22208](https://github.com/LedgerHQ/ledger-live/pull/22208) [`62a6f6c`](https://github.com/LedgerHQ/ledger-live/commit/62a6f6c516180411942c54ef686219387c41fb95) Thanks [@vladyslavchupovskiy-ext-art](https://github.com/vladyslavchupovskiy-ext-art)! - feat(coin-cosmos): add the Gonka currency configuration

  Points Gonka at the Ledger-hosted LCD, sets its minimum gas price to 0 (the chain's fee
  consensus parameter), and disables delegation, which the runtime rejects. Hides the account-header
  stake action on Desktop and Mobile for any Cosmos chain whose config sets `disableDelegation`, and
  stops a zero minimum gas price being mistaken for a missing config when preloaded data is restored.

- [#22310](https://github.com/LedgerHQ/ledger-live/pull/22310) [`89a445a`](https://github.com/LedgerHQ/ledger-live/commit/89a445a2a5285a9cefbcff903eee873a4998ae55) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Rename Ledger Live to Ledger Wallet in iOS permission prompts

- [#22497](https://github.com/LedgerHQ/ledger-live/pull/22497) [`80fa82a`](https://github.com/LedgerHQ/ledger-live/commit/80fa82a8cdd20df5b39509691443f9d72bf932a2) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(send): retract the keyboard before the skip-memo warning opens in the new send flow LWM

- [#22261](https://github.com/LedgerHQ/ledger-live/pull/22261) [`791c54a`](https://github.com/LedgerHQ/ledger-live/commit/791c54ae44ef1c8301f76e82e427f6f8c04176f1) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Support Cardano firmware app v8.0.8 by bumping @cardano-foundation/ledgerjs-hw-app-cardano from 7.x to 8.0.0. The v7 host binding used an older APDU protocol incompatible with the rewritten v8 device app, breaking account scan, receive and signing flows on firmware 8.0.x. Also raise the Cardano nano app minVersion to 8.0.8 so users on an incompatible older app are prompted to update instead of hitting broken flows.

- [#22263](https://github.com/LedgerHQ/ledger-live/pull/22263) [`3bcd040`](https://github.com/LedgerHQ/ledger-live/commit/3bcd04045cfa1bba7b1ae7d4751bd643cd8f5e0e) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump @react-native-community/netinfo to 12.0.1

- [#22116](https://github.com/LedgerHQ/ledger-live/pull/22116) [`214d382`](https://github.com/LedgerHQ/ledger-live/commit/214d38269add0b4f04c42002e1a42b1e75dc3c6d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Enforce the QR code pairing sequence on both sides of the handshake

  The host and the candidate now run the pairing messages through an explicit single-use state
  machine: each message is only accepted at the one point of the sequence where it is expected,
  and the peer that initiated the handshake is bound for the whole session. Envelopes, keys and
  decrypted bodies are validated before being acted upon, so a duplicate, out-of-order, foreign or
  malformed message ends the session with a `QRCodeProtocolError`: Desktop then asks for a fresh
  QR code, Mobile goes to its existing retry screen.

- [#22190](https://github.com/LedgerHQ/ledger-live/pull/22190) [`0651158`](https://github.com/LedgerHQ/ledger-live/commit/0651158a2f03f819c2e2770ef4179901768c3c6c) Thanks [@koda-apps](https://github.com/apps/koda-apps)! - Bump lumen-design-core to 0.1.29, lumen-ui-react to 0.1.59, lumen-ui-rnative to 0.1.62, and lumen-utils-shared to 0.1.13. In lumen-ui-rnative, `OptionList` (and its subcomponents, e.g. `OptionListItem`) is renamed to `SelectList`/`SelectListItem`, and `resolveAvatarColor` is renamed to `useResolveAvatarColor`, now a theme-reactive hook instead of a plain function; call sites in live-mobile and `@features/platform-contacts` are migrated accordingly. `resolveAvatarColor` in lumen-ui-react is unaffected by this bump.

- [#22306](https://github.com/LedgerHQ/ledger-live/pull/22306) [`845ac4a`](https://github.com/LedgerHQ/ledger-live/commit/845ac4a101b405b6c93333e335115ef1105ef824) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Restore translucent status backgrounds with the Lumen `-transparent` tokens after status colors became solid.

- [#21494](https://github.com/LedgerHQ/ledger-live/pull/21494) [`4b1a3af`](https://github.com/LedgerHQ/ledger-live/commit/4b1a3af55579ec09bcea8082cc6710597376832d) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(send): add skip memo confirmation bottomsheet in the lwm send flow

- [#22232](https://github.com/LedgerHQ/ledger-live/pull/22232) [`d7d2b9a`](https://github.com/LedgerHQ/ledger-live/commit/d7d2b9a0907cb0b16dd481f09c92b8796d80d3a9) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add mobile card asset details and withdraw scenes.

- [#21690](https://github.com/LedgerHQ/ledger-live/pull/21690) [`727cd08`](https://github.com/LedgerHQ/ledger-live/commit/727cd089d9b2a112fd297502417567777dd51871) Thanks [@pawell24](https://github.com/pawell24)! - feat(near): adapt NEAR UI to generic coin framework staking positions

- [#22305](https://github.com/LedgerHQ/ledger-live/pull/22305) [`fd6b9d0`](https://github.com/LedgerHQ/ledger-live/commit/fd6b9d0b602e44c5520152c2307bd629f11afc7a) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Open the provider withdrawal page from a card asset.

  - `buildWithdrawalPath` addresses `/withdrawal`, with the same `app_id` and `currency` query as `buildTopUpPath`.
  - Desktop opens it on the hosted manifest, mobile in the secure browser, both with the asset pre-selected.
  - Mobile also pre-selects the asset on the top up page.
  - Every mobile hosted page now opens in the same secure browser session, which shares the cookies of the login. `openHostedLoginInSecureBrowser` becomes `openHostedUrlInSecureBrowser`, and `openHostedPageInSecureBrowser` is removed.
  - Every hosted path now lives in `state/hostedPaths.ts`: signup, top up, withdrawal, manage PIN and the Baanx root. `cardSettingsPaths.ts` is removed, and the package exports the same names as before.

- [#22095](https://github.com/LedgerHQ/ledger-live/pull/22095) [`dc043f8`](https://github.com/LedgerHQ/ledger-live/commit/dc043f897838d62a9955f927421b33ca909d16ce) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Price the card wallets in the Pay tab's Assets list.

  - Resolves the card's currencies and prices each wallet against the user's counter value.
  - Registers those pairs for the session, since no account holds a card wallet's currency.
  - Both are gated on the card being signed in, so a visitor who never opens it is charged neither.

- [#22267](https://github.com/LedgerHQ/ledger-live/pull/22267) [`8e556b1`](https://github.com/LedgerHQ/ledger-live/commit/8e556b198bdf546968458347b0cad3e954ed4adb) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Map Baanx's EUROC to its Ledger currency.

  - `euroc.ethereum` and `euroc.euroc` resolve to `ethereum/erc20/euro_coin`.

- [#22114](https://github.com/LedgerHQ/ledger-live/pull/22114) [`afb2750`](https://github.com/LedgerHQ/ledger-live/commit/afb275029ec3aee1c833f1e468c41dc36279ab6f) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add Crypto and Card tabs to mobile transaction history.

- [#22308](https://github.com/LedgerHQ/ledger-live/pull/22308) [`9677738`](https://github.com/LedgerHQ/ledger-live/commit/9677738402a28bd494bd782c68fc99467465c2db) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Point the production and release builds at the live Baanx environment

- [#22184](https://github.com/LedgerHQ/ledger-live/pull/22184) [`75038d5`](https://github.com/LedgerHQ/ledger-live/commit/75038d59735ac63ab43baf7bd298969890241b3b) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Open the provider's top up page from the card on mobile.

  - The Top up button takes the place of the disabled "Coming soon" action on the card face, and it comes back at the bottom of the card details sheet.
  - Mobile opens `/topup` in the secure browser, which carries the provider session. A US card holder gets the US `app_id` on the query, so the page reaches the US tenant.

- [#22102](https://github.com/LedgerHQ/ledger-live/pull/22102) [`4b346a0`](https://github.com/LedgerHQ/ledger-live/commit/4b346a0f90b2c1f7c66df4be38e7c4b6b992ce57) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Show the card's balance on the Pay tab's card face.

  - The Pay tab passes the countervalue formatter the flow needs, so the face replaces the bare artwork.
  - Adds the `payTab.card.balanceLabel` copy the face reads; only desktop had it.

- [#22046](https://github.com/LedgerHQ/ledger-live/pull/22046) [`2aeb695`](https://github.com/LedgerHQ/ledger-live/commit/2aeb695663cf9a71d2a234ebc38819567f930564) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add a card transaction preview to the Pay card details view.

- [#22068](https://github.com/LedgerHQ/ledger-live/pull/22068) [`91531f2`](https://github.com/LedgerHQ/ledger-live/commit/91531f29e71e4e186375a5e2908ddca0c351c0ac) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Carry each card wallet's Ledger currency, so the app can price it.

  - `useCurrenciesByIds` resolves a list of Ledger ids to currencies: coins from the crypto registry, tokens from CAL. The lookups are dispatched rather than hooked, so the list can be any length.
  - A card wallet now carries `ledgerCurrency` instead of a counter value. Converting needs the app's rates, so it happens in platform code.
  - `BAANX_LEDGER_CURRENCY_IDS` lists every Ledger id the card catalog resolves to.
  - The Pay card devtool shows `ledgerCurrencyId` per joined wallet.

- [#22121](https://github.com/LedgerHQ/ledger-live/pull/22121) [`287f042`](https://github.com/LedgerHQ/ledger-live/commit/287f04286e4933e31e31952a3ac6485e145e34f2) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Answer the phone wallet step from the provider alone.

  - Mobile reads `cardAddedToDigitalWallet` from the card status for the onboarding step.
  - The device answer is gone: `hasAddedCardToWallet`, its two actions and its selector leave the widget state. The Add-to-Wallet CTA now hides on the provider's answer, and the instructions scene re-asks the card status instead of recording a local yes.
  - A tenant that does not send the flag leaves the step undone and keeps offering the CTA.
  - The onboarding mock gained `cardAddedToDigitalWallet`, so the dev tool's wallet toggle drives the mocked endpoint and follows request mocking like every other step.

- [#21841](https://github.com/LedgerHQ/ledger-live/pull/21841) [`d59d123`](https://github.com/LedgerHQ/ledger-live/commit/d59d123a2ba037b44507b1f5424e31f05309ec26) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(cosmos): migrate account resources to shared staking aggregate

- [#22214](https://github.com/LedgerHQ/ledger-live/pull/22214) [`72892c5`](https://github.com/LedgerHQ/ledger-live/commit/72892c5b3a7b675506c64f59329041099abbb099) Thanks [@sarneijim](https://github.com/sarneijim)! - Track the Q3 product tour with the Generic Awareness carousel contract on mobile and desktop, including a primary continue CTA and last-step completion.

- [#22489](https://github.com/LedgerHQ/ledger-live/pull/22489) [`48af604`](https://github.com/LedgerHQ/ledger-live/commit/48af6040c2835f067a2dfe38fb8fadde72e0787b) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Fix a bottom sheet reopening right after being swiped down before its entrance animation finished. Only a dismissal started for a previous presentation now puts the sheet back on screen.

- [#22234](https://github.com/LedgerHQ/ledger-live/pull/22234) [`b77b8f0`](https://github.com/LedgerHQ/ledger-live/commit/b77b8f0646bc4c29b7c54df861b9e16b64c307b3) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add asset-filtered mobile card transaction history.

- [#21945](https://github.com/LedgerHQ/ledger-live/pull/21945) [`1247cbc`](https://github.com/LedgerHQ/ledger-live/commit/1247cbc86a6cb0e653850a0b13535ef2109acc12) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Filter Braze Content Cards by local eligibility before Redux and re-evaluate on app state changes

- [#21967](https://github.com/LedgerHQ/ledger-live/pull/21967) [`40251b4`](https://github.com/LedgerHQ/ledger-live/commit/40251b41a62b2381c5c79410073a5f0b3c1fe629) Thanks [@sarneijim](https://github.com/sarneijim)! - Remove the obsolete original Wallet V4 tour

- [#22299](https://github.com/LedgerHQ/ledger-live/pull/22299) [`470bca7`](https://github.com/LedgerHQ/ledger-live/commit/470bca79315b3bb8242d01dd33e26b2b0da460ba) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Include send flow source in tracking properties on desktop and mobile.

- [#22056](https://github.com/LedgerHQ/ledger-live/pull/22056) [`cb866e1`](https://github.com/LedgerHQ/ledger-live/commit/cb866e1c07252a07fa991abd3dc2d8df68960256) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add @shared/linking package for cross-platform external link handling with URL safety, localization and analytics

- [#22248](https://github.com/LedgerHQ/ledger-live/pull/22248) [`0164fac`](https://github.com/LedgerHQ/ledger-live/commit/0164fac986bc066f5602f26069cd2c51128d7102) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(send): minor adjustement ui new send flow lwm

- [#22236](https://github.com/LedgerHQ/ledger-live/pull/22236) [`43e1a21`](https://github.com/LedgerHQ/ledger-live/commit/43e1a21f2060d53875256b001e054cf0b1f7b86a) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add Pay Card devtools controls for transaction and wallet balance fixtures, and answer the mocked wallet reorder with the order alone so linked assets keep the amounts they were showing while the reordered row shows its spinner.

- [#21377](https://github.com/LedgerHQ/ledger-live/pull/21377) [`1603611`](https://github.com/LedgerHQ/ledger-live/commit/1603611179046f098fba526aafb9633466448e05) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Align Stellar coin family with @ledgerhq/coin-stellar 9.7.2 export subpaths: import the API from `@ledgerhq/coin-stellar/api` and expose memo validation through the new `@ledgerhq/coin-stellar/logic-public` encapsulation

- [#22337](https://github.com/LedgerHQ/ledger-live/pull/22337) [`e1c0c65`](https://github.com/LedgerHQ/ledger-live/commit/e1c0c65f6c2726b29314ec2a7827d97672989ac0) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add legal agreement link to the Pay Card "More" menu

- [#21942](https://github.com/LedgerHQ/ledger-live/pull/21942) [`61362d0`](https://github.com/LedgerHQ/ledger-live/commit/61362d0e482a62c6fe663080c8ce2f4a25ffdb00) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Extract a desktop BrazeProvider and share Braze refresh and identity synchronization lifecycles

### Patch Changes

- Updated dependencies [[`40d296b`](https://github.com/LedgerHQ/ledger-live/commit/40d296b822381cc5d05616acafa1bca61e500dce), [`5649787`](https://github.com/LedgerHQ/ledger-live/commit/56497875407fe63148b6dfbf266b778748972c01), [`4d1d640`](https://github.com/LedgerHQ/ledger-live/commit/4d1d64049a0bb0562a1a0c8ad2555fe967acdd7f), [`731ebd2`](https://github.com/LedgerHQ/ledger-live/commit/731ebd22047779093d5821d38ea53f6f9fc1a694), [`250c1c0`](https://github.com/LedgerHQ/ledger-live/commit/250c1c0e4cd081a67f46b37e852291a32e02b05b), [`510465b`](https://github.com/LedgerHQ/ledger-live/commit/510465b5ac5808a42729dbea99aea081bf759e4a), [`c7eb01d`](https://github.com/LedgerHQ/ledger-live/commit/c7eb01d392a1adf04db824cd8602d939985599c7), [`871e485`](https://github.com/LedgerHQ/ledger-live/commit/871e4854284a0b21e31b53ff0ac312010093d914), [`6996290`](https://github.com/LedgerHQ/ledger-live/commit/6996290580691788820aabd70367655f2283ac20), [`72367fc`](https://github.com/LedgerHQ/ledger-live/commit/72367fcf2343fa488008236f1005da589e6e3054), [`c22ee67`](https://github.com/LedgerHQ/ledger-live/commit/c22ee67d3e0271b382337fe4175170bdabf5dfca), [`3d50917`](https://github.com/LedgerHQ/ledger-live/commit/3d50917da2e7c2177f8288bb754d41a7699f27be), [`cfa249c`](https://github.com/LedgerHQ/ledger-live/commit/cfa249c4c3a30f9eba1ecee1749030121da9291a), [`285b50d`](https://github.com/LedgerHQ/ledger-live/commit/285b50dc311eef60089f779cffdfe14a0422d2ec), [`d137f01`](https://github.com/LedgerHQ/ledger-live/commit/d137f01ed03877ca783d8b97eb303bde6e3ff998), [`35a5198`](https://github.com/LedgerHQ/ledger-live/commit/35a51980fc4d32efd7fd8440e5f5e9ef6a7348db), [`795e693`](https://github.com/LedgerHQ/ledger-live/commit/795e693bd67a942bc3c272183476ef470d3c8605), [`944bd23`](https://github.com/LedgerHQ/ledger-live/commit/944bd2345899c399bc931144fe46b48d0d1bf55b), [`1badf50`](https://github.com/LedgerHQ/ledger-live/commit/1badf50ec0c225f93b46ed5b1368257cc9b8e88d), [`8d1a795`](https://github.com/LedgerHQ/ledger-live/commit/8d1a79550afabc570b2d3b7867432d5a9f1d4e87), [`a1a8b81`](https://github.com/LedgerHQ/ledger-live/commit/a1a8b81b3f9b4eb897ac3d81427a1df0a5e0130b), [`675564f`](https://github.com/LedgerHQ/ledger-live/commit/675564fc759b896ffcc26c99fc4d9d0a0a3bd344), [`1ec8d15`](https://github.com/LedgerHQ/ledger-live/commit/1ec8d15feb3f9339bc09c18c682e140d370c9efe), [`386710a`](https://github.com/LedgerHQ/ledger-live/commit/386710a6893f7e17a781b36f29ebe2e08f9b5b20), [`84bba64`](https://github.com/LedgerHQ/ledger-live/commit/84bba645bfe85f3bd4d6f03431916226113c7bc5), [`c682542`](https://github.com/LedgerHQ/ledger-live/commit/c682542d2adc4066f1c5d6531f781babb0e772b9), [`319fbe4`](https://github.com/LedgerHQ/ledger-live/commit/319fbe464cbf256b7b3ee57113b6abd6c52ccd55), [`dd155a7`](https://github.com/LedgerHQ/ledger-live/commit/dd155a7608f771f8e9a26007e3ad28a82429a700), [`95a1007`](https://github.com/LedgerHQ/ledger-live/commit/95a1007bb9d4f62d693391a99eca3cb3b12f0e7d), [`233e44e`](https://github.com/LedgerHQ/ledger-live/commit/233e44e3dd724cc9d4f14a02c7e62e39d2e9079b), [`1557452`](https://github.com/LedgerHQ/ledger-live/commit/1557452f86f214191d2f29e5fca40b5077f90e11), [`6741356`](https://github.com/LedgerHQ/ledger-live/commit/67413566f84b895e6f4ae2b5d646bfc2e82c6926), [`dafadf0`](https://github.com/LedgerHQ/ledger-live/commit/dafadf005a54007d5430203c11b8718c1636a6e4), [`9652494`](https://github.com/LedgerHQ/ledger-live/commit/96524949cbf8fa1d102a0156f40004ff12a30475), [`5492648`](https://github.com/LedgerHQ/ledger-live/commit/5492648988e327c8e3e6e7d5ead1e0fa2bd9929e), [`905d26b`](https://github.com/LedgerHQ/ledger-live/commit/905d26b9ea6f419d3269a376e0f0c9b6ce8b2b82), [`98e3038`](https://github.com/LedgerHQ/ledger-live/commit/98e303872684da47feca343c0db7d83fcce857b2), [`ea94dd0`](https://github.com/LedgerHQ/ledger-live/commit/ea94dd00d64bae6b7fd9c792da77ffba751a9f01), [`736a0d5`](https://github.com/LedgerHQ/ledger-live/commit/736a0d5ba692e2342df4fc503056524359d35d65), [`7848066`](https://github.com/LedgerHQ/ledger-live/commit/7848066f6ba1b803b5a8d3df02ce6d35e46b370e), [`1648042`](https://github.com/LedgerHQ/ledger-live/commit/164804200fcd3486d9f364a31b065cb7f7d2a170), [`eb2a2a5`](https://github.com/LedgerHQ/ledger-live/commit/eb2a2a598787555cc05ed7ae105dd1648fbe43f5), [`c52af21`](https://github.com/LedgerHQ/ledger-live/commit/c52af21b622efa62774657e190abb9762cffac1c), [`33e92e8`](https://github.com/LedgerHQ/ledger-live/commit/33e92e8f074ff73a6a3e338c8313ba8bc9066ccf), [`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68), [`a62ad28`](https://github.com/LedgerHQ/ledger-live/commit/a62ad28e4900a887567fb61fb8f197af4fa5a23b), [`6183efd`](https://github.com/LedgerHQ/ledger-live/commit/6183efddac5de725cb22a013d5a9cdc94e65f756), [`5d2f40f`](https://github.com/LedgerHQ/ledger-live/commit/5d2f40f470f859960e43a2a08755a962796f6beb), [`62a6f6c`](https://github.com/LedgerHQ/ledger-live/commit/62a6f6c516180411942c54ef686219387c41fb95), [`214d382`](https://github.com/LedgerHQ/ledger-live/commit/214d38269add0b4f04c42002e1a42b1e75dc3c6d), [`0651158`](https://github.com/LedgerHQ/ledger-live/commit/0651158a2f03f819c2e2770ef4179901768c3c6c), [`845ac4a`](https://github.com/LedgerHQ/ledger-live/commit/845ac4a101b405b6c93333e335115ef1105ef824), [`d7d2b9a`](https://github.com/LedgerHQ/ledger-live/commit/d7d2b9a0907cb0b16dd481f09c92b8796d80d3a9), [`29ce771`](https://github.com/LedgerHQ/ledger-live/commit/29ce7712ce93cd27afa97eda2d14a0ff066551fb), [`fd6b9d0`](https://github.com/LedgerHQ/ledger-live/commit/fd6b9d0b602e44c5520152c2307bd629f11afc7a), [`8d073ca`](https://github.com/LedgerHQ/ledger-live/commit/8d073ca6a527a11ce6f10995bb896ae983211f63), [`954ffbd`](https://github.com/LedgerHQ/ledger-live/commit/954ffbdeb8172f555b637599d24cf2a94bcf24db), [`a915d4a`](https://github.com/LedgerHQ/ledger-live/commit/a915d4a577dfe7bb778364c4b0269bc61203075a), [`99bf629`](https://github.com/LedgerHQ/ledger-live/commit/99bf629658121670784047780f74702cfa2c3ebc), [`853e47d`](https://github.com/LedgerHQ/ledger-live/commit/853e47dac8f42644733686353c3f0f4a3fcc035a), [`c48d6d7`](https://github.com/LedgerHQ/ledger-live/commit/c48d6d71b7ec0318cfec3277c119284a88d652f7), [`8e556b1`](https://github.com/LedgerHQ/ledger-live/commit/8e556b198bdf546968458347b0cad3e954ed4adb), [`dbc9655`](https://github.com/LedgerHQ/ledger-live/commit/dbc9655cb61b4999fa6cd52dca25053f9f301dd3), [`afb2750`](https://github.com/LedgerHQ/ledger-live/commit/afb275029ec3aee1c833f1e468c41dc36279ab6f), [`eb06f77`](https://github.com/LedgerHQ/ledger-live/commit/eb06f77c9548a2e4641c37da90c34b4fcffba667), [`8dcb040`](https://github.com/LedgerHQ/ledger-live/commit/8dcb040ccac4abaeba356e76b60dc03802303bf5), [`75038d5`](https://github.com/LedgerHQ/ledger-live/commit/75038d59735ac63ab43baf7bd298969890241b3b), [`d9d1111`](https://github.com/LedgerHQ/ledger-live/commit/d9d1111733e757cc58b6249fdda568dd56d40757), [`4b346a0`](https://github.com/LedgerHQ/ledger-live/commit/4b346a0f90b2c1f7c66df4be38e7c4b6b992ce57), [`2aeb695`](https://github.com/LedgerHQ/ledger-live/commit/2aeb695663cf9a71d2a234ebc38819567f930564), [`91531f2`](https://github.com/LedgerHQ/ledger-live/commit/91531f29e71e4e186375a5e2908ddca0c351c0ac), [`287f042`](https://github.com/LedgerHQ/ledger-live/commit/287f04286e4933e31e31952a3ac6485e145e34f2), [`6fe6efb`](https://github.com/LedgerHQ/ledger-live/commit/6fe6efb9f2c9211d6002dd17f4369f90390021bf), [`d59d123`](https://github.com/LedgerHQ/ledger-live/commit/d59d123a2ba037b44507b1f5424e31f05309ec26), [`48af604`](https://github.com/LedgerHQ/ledger-live/commit/48af6040c2835f067a2dfe38fb8fadde72e0787b), [`bc43337`](https://github.com/LedgerHQ/ledger-live/commit/bc433372ebed1990d81a87b109eeb4d928271315), [`d19e4ae`](https://github.com/LedgerHQ/ledger-live/commit/d19e4aed0efb7e6ff8b8195dd8437cddbd455fe7), [`6844ca4`](https://github.com/LedgerHQ/ledger-live/commit/6844ca4e220c98ff99dd5d259dab339223624847), [`40251b4`](https://github.com/LedgerHQ/ledger-live/commit/40251b41a62b2381c5c79410073a5f0b3c1fe629), [`cb866e1`](https://github.com/LedgerHQ/ledger-live/commit/cb866e1c07252a07fa991abd3dc2d8df68960256), [`bb3e182`](https://github.com/LedgerHQ/ledger-live/commit/bb3e1822bfc2cb9ff00089082782d9e2bd229b67), [`43e1a21`](https://github.com/LedgerHQ/ledger-live/commit/43e1a21f2060d53875256b001e054cf0b1f7b86a), [`e1c0c65`](https://github.com/LedgerHQ/ledger-live/commit/e1c0c65f6c2726b29314ec2a7827d97672989ac0), [`e2134f5`](https://github.com/LedgerHQ/ledger-live/commit/e2134f5cffe4669ff5896e2b52904fe22218461b)]:
  - @shared/env@0.8.0
  - @shared/api-services@0.8.0
  - @features/platform-card@0.6.0
  - @features/flow-pay-card-auth@0.8.0
  - @features/flow-contacts-list@0.8.0
  - @domain/api-card-management@0.7.0
  - @features/flow-pay-card-details@0.5.0
  - @features/flow-pay-card@0.5.0
  - @shared/ui-queued-bottom-sheet@0.5.0
  - @features/platform-contacts@0.8.0
  - @features/flow-contacts-add-contact@0.7.0
  - @features/flow-contacts-edit-contact@0.6.0
  - @features/flow-contacts-edit-address@0.4.0
  - @features/flow-contacts-add-address@0.6.0
  - @features/flow-contacts@0.12.0
  - @features/flow-pay-card-widget@0.4.0
  - @devtools/bindings@0.9.0
  - @features/flow-app-lock@0.5.0
  - @features/platform-app-lock@0.4.0
  - @shared/ui-info-state@0.3.0
  - @features/flow-pay-card-assets@0.2.0
  - @features/flow-large-screen-upsell@2.2.0
  - @features/flow-pay-card-transactions@0.3.0
  - @domain/entity-currency-crypto@0.13.0
  - @ledgerhq/coin-concordium@1.4.0
  - @domain/entity-contact@0.10.0
  - @ledgerhq/coin-bitcoin@0.53.0
  - @ledgerhq/coin-canton@1.2.0
  - @ledgerhq/coin-casper@3.4.0
  - @ledgerhq/coin-cosmos@1.4.0
  - @ledgerhq/coin-filecoin@2.2.0
  - @ledgerhq/coin-multiversx@1.2.0
  - @ledgerhq/coin-stacks@0.31.0
  - @ledgerhq/hw-transport-http@6.38.0
  - @ledgerhq/ledger-wallet-framework@3.5.0
  - @ledgerhq/types-devices@7.1.0
  - @ledgerhq/types-live@6.125.0
  - @features/platform-env@0.4.0
  - @ledgerhq/live-dmk-shared@0.33.0
  - @ledgerhq/ledger-key-ring-protocol@0.23.0
  - @devtools/shell@0.10.0
  - @devtools/transport-panel@0.7.0
  - @ledgerhq/hw-ledger-key-ring-protocol@0.13.0
  - @shared/feature-flags@0.24.0
  - @domain/entity-card-asset-mapping@0.7.0
  - @features/platform-currencies@0.9.0
  - @features/flow-pay-balance@0.5.0
  - @features/flow-pay-feature-tour@0.6.0
  - @features/flow-pay-request@0.6.0
  - @features/platform-feature-flags@0.8.0
  - @shared/linking@0.3.0
  - @domain/api-aggregated-assets@0.5.2
  - @features/platform-aggregated-assets@0.5.4
  - @ledgerhq/live-dmk-mobile@0.29.9
  - @ledgerhq/transaction-observability@0.3.2
  - @ledgerhq/wallet-analytics@0.4.2
  - @ledgerhq/wallet-pnl@0.7.12
  - @domain/api-altcoins-sentiment@0.3.6
  - @domain/api-currency-fiat@0.4.5
  - @domain/api-currency-token@0.6.2
  - @domain/api-market-sentiment@0.3.6
  - @domain/api-push-devices@0.2.6
  - @features/flow-contacts-delete-contact@0.2.3
  - @features/flow-contacts-introduction@1.2.0
  - @features/flow-pay-bank-transfer@0.3.2
  - @features/flow-pay-contact@0.4.1
  - @features/flow-pay-deposit@0.4.1
  - @features/platform-device-action-content@0.2.1
  - @ledgerhq/live-send@0.1.1
  - @domain/entity-currency@0.4.4
  - @domain/entity-currency-token@0.5.3
  - @ledgerhq/live-currency-format@0.15.0
  - @ledgerhq/live-wallet@1.1.4
  - @ledgerhq/live-signer-evm@0.23.3
  - @ledgerhq/live-countervalues@0.26.1
  - @ledgerhq/live-countervalues-react@0.18.1
  - @ledgerhq/device-core@0.11.17
  - @ledgerhq/domain-service@1.8.20
  - @devtools/wire@0.5.1
  - @features/flow-analytics-consent@0.2.7

## 4.22.0-next.2

### Minor Changes

- [#22489](https://github.com/LedgerHQ/ledger-live/pull/22489) [`48af604`](https://github.com/LedgerHQ/ledger-live/commit/48af6040c2835f067a2dfe38fb8fadde72e0787b) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Fix a bottom sheet reopening right after being swiped down before its entrance animation finished. Only a dismissal started for a previous presentation now puts the sheet back on screen.

### Patch Changes

- Updated dependencies [[`48af604`](https://github.com/LedgerHQ/ledger-live/commit/48af6040c2835f067a2dfe38fb8fadde72e0787b)]:
  - @shared/ui-queued-bottom-sheet@0.5.0-next.1
  - @features/flow-app-lock@0.5.0-next.1
  - @features/flow-contacts-edit-address@0.4.0-next.1
  - @features/flow-pay-balance@0.5.0-next.1
  - @features/flow-pay-bank-transfer@0.3.2-next.1
  - @features/flow-pay-card-auth@0.8.0-next.1
  - @features/flow-pay-card-details@0.5.0-next.1
  - @features/flow-pay-card-transactions@0.3.0-next.1
  - @features/flow-pay-card-widget@0.4.0-next.1
  - @features/flow-pay-contact@0.4.1-next.1
  - @features/flow-pay-deposit@0.4.1-next.1
  - @features/flow-pay-feature-tour@0.6.0-next.1
  - @features/flow-pay-request@0.6.0-next.1
  - @features/platform-contacts@0.8.0-next.1
  - @shared/ui-info-state@0.3.0-next.1
  - @features/flow-contacts@0.12.0-next.1
  - @devtools/bindings@0.9.0-next.1
  - @features/flow-pay-card@0.5.0-next.1
  - @features/flow-pay-card-assets@0.2.0-next.1
  - @features/flow-contacts-add-address@0.6.0-next.1
  - @features/flow-contacts-add-contact@0.7.0-next.1
  - @features/flow-contacts-delete-contact@0.2.3-next.1
  - @features/flow-contacts-edit-contact@0.6.0-next.1
  - @features/flow-contacts-list@0.8.0-next.1

## 4.22.0-next.1

### Minor Changes

- [#22497](https://github.com/LedgerHQ/ledger-live/pull/22497) [`80fa82a`](https://github.com/LedgerHQ/ledger-live/commit/80fa82a8cdd20df5b39509691443f9d72bf932a2) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(send): retract the keyboard before the skip-memo warning opens in the new send flow LWM

## 4.22.0-next.0

### Minor Changes

- [#22003](https://github.com/LedgerHQ/ledger-live/pull/22003) [`40d296b`](https://github.com/LedgerHQ/ledger-live/commit/40d296b822381cc5d05616acafa1bca61e500dce) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Record the provider app the Card login redirect names, and send x-us-env on every Card request of a US holder

- [#22149](https://github.com/LedgerHQ/ledger-live/pull/22149) [`4d1d640`](https://github.com/LedgerHQ/ledger-live/commit/4d1d64049a0bb0562a1a0c8ad2555fe967acdd7f) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add card reward wallet endpoint and mobile reward balance view

- [#21741](https://github.com/LedgerHQ/ledger-live/pull/21741) [`250c1c0`](https://github.com/LedgerHQ/ledger-live/commit/250c1c0e4cd081a67f46b37e852291a32e02b05b) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add a mobile card-numbers View/Hide control that flips to the provider numbers image

- [#22258](https://github.com/LedgerHQ/ledger-live/pull/22258) [`e82ab0c`](https://github.com/LedgerHQ/ledger-live/commit/e82ab0cba1624965b625b12a6bd51c785c1b21df) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Wire the card's Manage PIN and Access Baanx rows to open the Baanx hosted pages in the secure
  browser, and the Help row to open the support article externally.

- [#21520](https://github.com/LedgerHQ/ledger-live/pull/21520) [`0d90780`](https://github.com/LedgerHQ/ledger-live/commit/0d907805cebbd0916e27f94bcf3685be2a4ef872) Thanks [@pawell24](https://github.com/pawell24)! - Announce the receive QR code to screen readers

  The QR container on the shared receive confirmation screen carried a `testID` but no
  `accessible` prop, so it never joined the accessibility tree. It is now a focusable
  element with a role and a localized label, instead of being skipped or announced as
  an unlabeled node.

- [#21747](https://github.com/LedgerHQ/ledger-live/pull/21747) [`871e485`](https://github.com/LedgerHQ/ledger-live/commit/871e4854284a0b21e31b53ff0ac312010093d914) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix keyboard handling in the mobile Contacts add, edit, and send flows. Input sheets now open at full height with the keyboard, primary actions remain visible in a keyboard-aware `QueuedBottomSheet` footer, and name fields focus immediately and capitalize each word.

- [#22077](https://github.com/LedgerHQ/ledger-live/pull/22077) [`72367fc`](https://github.com/LedgerHQ/ledger-live/commit/72367fcf2343fa488008236f1005da589e6e3054) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Wire the card onboarding widget to real, derived onboarding data and remove the unused stub endpoint and legacy devtool mock path it replaces

- [#22093](https://github.com/LedgerHQ/ledger-live/pull/22093) [`2e94d90`](https://github.com/LedgerHQ/ledger-live/commit/2e94d909a573f7e52595a6fe38241f171ea7feab) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Fix available balance showing inflated value for DADA cross-network assets (e.g. Tezos + Etherlink)

- [#22192](https://github.com/LedgerHQ/ledger-live/pull/22192) [`c22ee67`](https://github.com/LedgerHQ/ledger-live/commit/c22ee67d3e0271b382337fe4175170bdabf5dfca) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add reusable Apple/Google Pay add-to-wallet CTA, instructions, and wallet-app opening.

- [#22218](https://github.com/LedgerHQ/ledger-live/pull/22218) [`285b50d`](https://github.com/LedgerHQ/ledger-live/commit/285b50dc311eef60089f779cffdfe14a0422d2ec) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Open Google Wallet through its launch intent, and show iOS and Android error scenes when the wallet app is unavailable, with a Play Store fallback on Android.

- [#21999](https://github.com/LedgerHQ/ledger-live/pull/21999) [`724f029`](https://github.com/LedgerHQ/ledger-live/commit/724f02932ccdf8ba5b8f8f0ccc10b9edbe7547cd) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat(aleo): share the bond pieces between Desktop and Mobile

  Replaces the ad-hoc messages `getTransactionStatus` returned for a rejected bond with typed
  error classes, translated on both clients and now distinguishing a closed validator from an
  unbonding one. Adds the `isValidatorBondable` / `getMinBondAmount` helpers to the coin
  module, moves the per-network default validator into the Aleo currency config so every
  client reads the same address, and adds a reusable Aleo bridge mock for Mobile.

- [#22336](https://github.com/LedgerHQ/ledger-live/pull/22336) [`b5d2be9`](https://github.com/LedgerHQ/ledger-live/commit/b5d2be9040f0f36f5c83c9f502105d1c96df2344) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - feat(aleo): add the claim unbonded staking flow on Mobile

- [#22137](https://github.com/LedgerHQ/ledger-live/pull/22137) [`353ed46`](https://github.com/LedgerHQ/ledger-live/commit/353ed46035b09d33eff6b5b76fe7ad3d19510e38) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat(aleo): show the staking position and its status on the Mobile account page

- [#22123](https://github.com/LedgerHQ/ledger-live/pull/22123) [`b5338ec`](https://github.com/LedgerHQ/ledger-live/commit/b5338ec9173a08073a4b8524fe095428bb710a99) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - feat(aleo): add the shared staking hooks the delegation views read

- [#22212](https://github.com/LedgerHQ/ledger-live/pull/22212) [`49b535f`](https://github.com/LedgerHQ/ledger-live/commit/49b535fa6cab495b0b8659c042c743b8f65c2ce2) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - refactor(aleo): serve the validator committee from RTK Query

- [#22211](https://github.com/LedgerHQ/ledger-live/pull/22211) [`d137f01`](https://github.com/LedgerHQ/ledger-live/commit/d137f01ed03877ca783d8b97eb303bde6e3ff998) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Offer biometrics on the unlock screen with the symbol the device actually uses.

  The field asked for biometrics with a generic touch symbol, because Lumen had no biometric one when the screen was built. It has since gained `FaceId` and `Fingerprint`, so a face device now shows a face and a fingerprint device a fingerprint.

  The device reports six kinds and there are two symbols: a touch is a fingertip on either platform, and everything the device reads from the face — iris and Optic ID included — takes the face symbol, since there is no iris symbol and an eye read is nearer a face than a fingertip. The capability is read asynchronously while the affordance comes from stored state, so the generic touch symbol still stands in for the moment before the device has answered, and for a read that fails.

- [#22275](https://github.com/LedgerHQ/ledger-live/pull/22275) [`35a5198`](https://github.com/LedgerHQ/ledger-live/commit/35a51980fc4d32efd7fd8440e5f5e9ef6a7348db) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Give a user protected by biometrics alone a way back when their face goes unread.

  The unlock screen already retried the prompt when tapped, but nothing said so: with no password set, a face the camera never saw left the Ledger mark on black and no visible way forward. The whole screen being the button is no help to someone who cannot tell there is a button.

  A real call to action now sits under the mark — "Unlock Ledger Wallet" — and it appears only once the prompt has gone. While the prompt is up the system dialog owns the screen, and at boot the bare mark is what keeps the handover from the launch screen invisible.

  The other half is the OS's and already works: while its dialog is up, the device credential the app asks for makes iOS draw "Try Face ID Again" and "Enter Passcode" itself. It is only after that dialog is cancelled, when nothing will reopen it, that the app has to offer the way back.

- [#22125](https://github.com/LedgerHQ/ledger-live/pull/22125) [`795e693`](https://github.com/LedgerHQ/ledger-live/commit/795e693bd67a942bc3c272183476ef470d3c8605) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Make biometrics a protection in its own right: password and biometrics become independent, and either one alone is enough to lock the app.

  Biometrics used to require a password. Its Settings row was disabled until one existed and reset itself whenever the password went away, and the legacy lock returned early without a password, so a biometrics-only user was never locked at all. The revamped path now derives the lock from both protections, so enabling biometrics alone locks the app — and Settings offers it with no password set.

  The row is hidden where the device has no biometrics, or has the hardware with nothing enrolled, rather than shown disabled: there is nothing the user could do about it from that screen.

  Biometrics is asked for **before** the unlock screen draws a field, so it is the first thing the user meets and the password is the fallback. While the prompt is up the screen stands in for the splash, with the mark at the splash's own size so the handover moves nothing. Only a refusal reveals the password field — and a user protected by biometrics alone never sees it: pressing the screen asks again, which is their only way in.

  The prompt is an explicit owner check through `BiometricPrompt` / `LAContext`, not a side effect of reading a protected keychain item. A biometry-gated read can resolve without the OS ever showing anything, and Android reports a correct device PIN as a success the keystore item cannot consume — either way the caller is told the user proved something they were never asked for. On Android 11 and above the OS draws its own "use PIN" button in place of the negative one, and every label it shows comes from the app rather than the library's English defaults.

  The keychain item is therefore a plain marker, not an authentication step: it records that biometrics is on, which the protection state cannot do on its own, being held in memory only. Enabling proves before it records, and a refusal stores nothing.

  The device credential is accepted, because biometrics can now be the only protection: a lockout after failed attempts would otherwise leave the owner with nothing to try. The consequence to accept is that someone who knows the device passcode can open the app — for a user who also set a password, the weaker path.

  Protection that outlived its install is destroyed at boot. iOS keeps keychain items when an app is deleted while Android wipes them, so a reinstall found the previous password and demanded it — for data that went with the uninstall, leaving an owner who had forgotten it locked out of an empty app, advised to reinstall, which is what they had just done. A marker in app storage settles which install the protection belongs to, since an uninstall clears that and not the keychain. The cost, worth stating: clearing app data now clears the lock too, which follows from the threat model this epic assumes — opportunistic access control, not data protection — since anyone who can wipe the data can reinstall anyway.

  Removing biometrics asks for it too. Removing a password requires typing it, so removing biometrics must cost as much: an unlocked phone in someone else's hands would otherwise strip the protection in one tap, with nothing asked. A refused prompt leaves both the canary and the switch as they were.

  **The canary accepts the device passcode** (`BIOMETRY_ANY_OR_DEVICE_PASSCODE`), superseding the earlier `BIOMETRY_CURRENT_SET` choice. That choice was made when biometrics released a key, where invalidating the item on re-enrolment was the right trade. With no key involved, its only remaining effect would be to shut a biometrics-only user out of their own app with nothing left to try — no password to fall back on and no material to recover. The consequence to accept is that someone who knows the device passcode can open the app; for a user who also set a password, that is a weaker path than the password itself.

- [#22163](https://github.com/LedgerHQ/ledger-live/pull/22163) [`944bd23`](https://github.com/LedgerHQ/ledger-live/commit/944bd2345899c399bc931144fe46b48d0d1bf55b) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Tell a user who has forgotten their app-lock password what their options are, from the unlock screen.

  The link was already on the unlock screen and the flow package already accepted the callback, but nothing in the app provided it — so the link never rendered and there was no answer to give.

  There is no recovery to offer, and that is the point of the scheme: the password is not stored, only a verifier derived from it, so nothing can reverse it. The sheet says so and names the one way back — reinstalling the app, which drops the lock along with the app's data. That advice is only true now that protection outliving its install is destroyed at boot; before, on iOS the keychain survived an uninstall and the reinstall demanded the very password the user had forgotten.

  The sheet is absent for a user protected by biometrics alone, who has no password to forget.

  The sheet lives in the flow package with the screen that raises it, which needed `@shared/ui-info-state` to offer `./native` and `./web` entries beside its conditional root: a `features/flow` package can only reach the root through the `react-native` condition, and that condition resolves Lumen to source and demands its whole native peer graph. Existing consumers keep importing the root, and keep the conditions they had.

- [#22045](https://github.com/LedgerHQ/ledger-live/pull/22045) [`1badf50`](https://github.com/LedgerHQ/ledger-live/commit/1badf50ec0c225f93b46ed5b1368257cc9b8e88d) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Hold the app behind the lock on boot and when it comes back from the background, behind `lwmPasswordRevamp`.

  `AppLockGate` sits above the app, decides once on boot whether protection is configured, and locks again whenever the app is backgrounded. The unlock screen renders over the app rather than replacing it, so nothing below unmounts and the user lands where they left off.

  Two details carry more weight than they look:

  The protection state is read back from the keychain at startup — until now it only lived in memory, so a relaunch reported no password at all. The Settings row renders nothing until that read answers, rather than showing "off" and correcting itself a moment later. A read that fails counts as protected: the app would otherwise open itself on a keychain error.

  Backgrounding is judged per platform. On iOS only `background` locks, because the biometric prompt itself pushes the app to `inactive` — locking there would mean the prompt locks the app it was about to open.

  Which path the app takes is decided by the stored state, not only by the flag: a user who already holds a verifier keeps the revamped screens even if `lwmPasswordRevamp` is rolled back, since the legacy ones cannot remove it and ignoring it would silently drop their protection. That resolved scheme now governs the add and modify navigators too, which read the raw flag until now — on a rollback they sent a verifier holder to the legacy removal screen, which clears the legacy keychain entry and leaves the verifier in place, so the lock could not be turned off.

  Removing the last protection also releases the lock. A removal takes a slow derivation, and backgrounding during it locks the app; the removal then destroyed the verifier while the lock stood, leaving an unlock screen with nothing left to open it.

  While that read is in flight the app is covered rather than shown: the state starts unlocked, so rendering it would hand the app to whoever holds the phone for as long as the keychain takes. Once locked, the app below stays mounted — unlocking returns the user where they were — but leaves the accessibility tree, or a screen reader would walk into it.

- [#22098](https://github.com/LedgerHQ/ledger-live/pull/22098) [`8d1a795`](https://github.com/LedgerHQ/ledger-live/commit/8d1a79550afabc570b2d3b7867432d5a9f1d4e87) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Move existing passwords off the plaintext scheme onto a verifier, without asking the user anything.

  Every user with a password today is on a scheme that stores it in plaintext and verifies it by string comparison — not only the short ones. The migration derives a digest from the password they already have, so it needs the plaintext: it runs right after a successful **legacy** unlock, the one moment the password has been proven and is in hand, and not at boot.

  Write, prove, only then delete. A crash between the write and the delete leaves the user a way in through the legacy entry; after the delete, through the verifier. Never through neither. That also makes it resumable: a verifier already present means an earlier run got that far, so the next one proves it and finishes rather than deriving a second time. A stored verifier the proven password will not open is derived over, since it can only be a half-written record or one this migration never put there, and the plaintext in hand at that moment restores a credential that works. Only a keychain that will not hold the record defers, leaving the legacy entry as the way in — as does one that declines to delete the legacy entry, since the plaintext is still there and needs the lock that stands over it.

  A run that died between the delete and retiring the legacy lock is repaired on the next boot: the entry gone with a verifier in its place can only mean the sequence reached its last step, so that verifier is what opens the app and the legacy flag is released. Without that the legacy screen asked for a password nothing could check.

  A completed migration retires the legacy lock, clearing `privacy.hasPassword`. Without it the app carries two independent guards: the old `AuthPass` screen renders over the new unlock screen, and the revamped Settings row hides the legacy toggle that could remove the old credential.

  Whether the password is under the six-character minimum is recorded as it migrates, because nothing can tell afterwards — a verifier says nothing about the length of the password behind it. The prompt that acts on it is LIVE-35981.

  The derivation queue is held for exactly one turn across the whole sequence. This shipped broken once: the migration took a turn and then called a password check that asked for another, so the inner call waited on the outer, the outer on the inner, and every later check waited on both — the app could not be unlocked at all. The check is now the unserialised primitive the public checks are built on, and a test fails if anything asks for a second turn.

- [#22179](https://github.com/LedgerHQ/ledger-live/pull/22179) [`a1a8b81`](https://github.com/LedgerHQ/ledger-live/commit/a1a8b81b3f9b4eb897ac3d81427a1df0a5e0130b) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Let any part of the app ask for the app to be protected before it continues, and answer for it.

  A feature that needs protection — the Card, first — now awaits one call: `requestProtection()`. The prompt decides what to ask for, so no caller looks at biometry: biometrics if the device has some enrolled, a password otherwise. An already-protected user is never interrupted and their action simply runs.

  The password path opens the existing add-password flow and comes back with a confirmation sheet, so the caller resumes where it left off. Dismissing the prompt, or backing out of the password flow, holds the caller's action instead — a request never resolves as protected unless protection is actually in place.

  Both sheets are mounted once, above the screens, so navigating away no longer closes the prompt the way a screen-owned sheet would.

  The card is the first caller: both ways out of its login lead to the provider, so signing up and logging in each wait for protection. The card flow takes the request as a prop, since a flow package cannot reach the app's prompt, and only the native entry passes one — desktop has no app lock and is unchanged.

- [#22220](https://github.com/LedgerHQ/ledger-live/pull/22220) [`b837ca4`](https://github.com/LedgerHQ/ledger-live/commit/b837ca423c9f1f115a9e40c8b3504bdf2750b11e) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Let a reinstall actually clear an app-lock password, as it is meant to.

  Protection that outlives its install is destroyed at boot, which is the only way out for someone who has forgotten their password — the sheet on the unlock screen tells them so. Deciding whether protection belongs to this install fell back to "does app storage hold settings", for users whose protection predates the marker that now records an install. The app writes settings within a second of any launch, though, so a fresh install could read its own footprint as history and keep the protection the uninstall was supposed to take away.

  The fallback now asks whether onboarding was ever completed, which is the one thing a reinstalled user has not done yet by the time the lock decides, whatever else has already been written to storage.

- [#21984](https://github.com/LedgerHQ/ledger-live/pull/21984) [`675564f`](https://github.com/LedgerHQ/ledger-live/commit/675564fc759b896ffcc26c99fc4d9d0a0a3bd344) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the unlock screen and route every password check through one place.

  `checkPassword` becomes the only function that verifies a password, used by both unlock and deactivation, so neither can drift into comparing against something stored. It derives with the parameters carried by the verifier rather than the current defaults, which is what lets a password set before a cost change still be proven.

  The screen itself follows Figma: black full-bleed with the Ledger mark near the top, the shared password field under it, and the CTA labelled Confirm. It is forced to the dark palette rather than following the user's theme — the splash is black and this screen takes over from it with the mark in the same place, so a light rendering would flash on handover. It also carries no minimum-length rule, since the password may predate the six-character one.

  Nothing mounts it yet: the orchestration, the biometric path and the forgot-password sheet are the gate.

- [#22228](https://github.com/LedgerHQ/ledger-live/pull/22228) [`1ec8d15`](https://github.com/LedgerHQ/ledger-live/commit/1ec8d15feb3f9339bc09c18c682e140d370c9efe) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Refine the Pay card assets list with loading skeletons, translated states, funding information, and asset values in the details dialog.

- [#22312](https://github.com/LedgerHQ/ledger-live/pull/22312) [`319fbe4`](https://github.com/LedgerHQ/ledger-live/commit/319fbe464cbf256b7b3ee57113b6abd6c52ccd55) Thanks [@sarneijim](https://github.com/sarneijim)! - Show the signed-off Touchscreen Upgrade Program copy only to Nano S users

- [#22278](https://github.com/LedgerHQ/ledger-live/pull/22278) [`95a1007`](https://github.com/LedgerHQ/ledger-live/commit/95a1007bb9d4f62d693391a99eca3cb3b12f0e7d) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Reveal card numbers as soon as the image loads and shorten the flip to 300ms

- [#22200](https://github.com/LedgerHQ/ledger-live/pull/22200) [`843f033`](https://github.com/LedgerHQ/ledger-live/commit/843f03312cd4258f078c59bc9ed4e830a4d19917) Thanks [@alexstapenka-ledger](https://github.com/alexstapenka-ledger)! - Preserve protocol selection in Earn deposit deeplinks

- [#22182](https://github.com/LedgerHQ/ledger-live/pull/22182) [`1557452`](https://github.com/LedgerHQ/ledger-live/commit/1557452f86f214191d2f29e5fca40b5077f90e11) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Reveal card numbers without a password unlock gate

- [#22076](https://github.com/LedgerHQ/ledger-live/pull/22076) [`83fd219`](https://github.com/LedgerHQ/ledger-live/commit/83fd2190c658f4604e87cbe55f380f5d5caed88e) Thanks [@0xMM-L](https://github.com/0xMM-L)! - Fix the Casper device confirmation step where the Fee and Amount values were blank: they are now rendered inside a Text node via `DataRowUnitValue` instead of being passed as a raw element to `TextValueField`.

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

- [#22271](https://github.com/LedgerHQ/ledger-live/pull/22271) [`c52af21`](https://github.com/LedgerHQ/ledger-live/commit/c52af21b622efa62774657e190abb9762cffac1c) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix the blank sheet that could appear when adding contacts one after another on iOS. A sheet is now dismissed once per presentation, and a dismissal nobody asked for puts the sheet back on screen instead of hiding the content of the presentation the user has just opened. A sheet that reaches the screen after being considered closed is dismissed once it animates, which is the point gorhom stops ignoring the request.

- [#22000](https://github.com/LedgerHQ/ledger-live/pull/22000) [`ed407de`](https://github.com/LedgerHQ/ledger-live/commit/ed407de125dcb8d022cd528e8e7ddf8f59977b2d) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: aleo staking bond flow

- [#22187](https://github.com/LedgerHQ/ledger-live/pull/22187) [`31ec33f`](https://github.com/LedgerHQ/ledger-live/commit/31ec33f649209bd2b6971afc173e2e41f53c313f) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - aleo part 2 staking ui

- [#22089](https://github.com/LedgerHQ/ledger-live/pull/22089) [`6183efd`](https://github.com/LedgerHQ/ledger-live/commit/6183efddac5de725cb22a013d5a9cdc94e65f756) Thanks [@benruseau](https://github.com/benruseau)! - Add the create backup sub-step to the OS updates orchestrator

  Extract the device error cause recovery into a state machine shared by all sub-steps

  Refactor the OS updates debug screen

- [#22208](https://github.com/LedgerHQ/ledger-live/pull/22208) [`62a6f6c`](https://github.com/LedgerHQ/ledger-live/commit/62a6f6c516180411942c54ef686219387c41fb95) Thanks [@vladyslavchupovskiy-ext-art](https://github.com/vladyslavchupovskiy-ext-art)! - feat(coin-cosmos): add the Gonka currency configuration

  Points Gonka at the Ledger-hosted LCD, sets its minimum gas price to 0 (the chain's fee
  consensus parameter), and disables delegation, which the runtime rejects. Hides the account-header
  stake action on Desktop and Mobile for any Cosmos chain whose config sets `disableDelegation`, and
  stops a zero minimum gas price being mistaken for a missing config when preloaded data is restored.

- [#22310](https://github.com/LedgerHQ/ledger-live/pull/22310) [`89a445a`](https://github.com/LedgerHQ/ledger-live/commit/89a445a2a5285a9cefbcff903eee873a4998ae55) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Rename Ledger Live to Ledger Wallet in iOS permission prompts

- [#22261](https://github.com/LedgerHQ/ledger-live/pull/22261) [`791c54a`](https://github.com/LedgerHQ/ledger-live/commit/791c54ae44ef1c8301f76e82e427f6f8c04176f1) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Support Cardano firmware app v8.0.8 by bumping @cardano-foundation/ledgerjs-hw-app-cardano from 7.x to 8.0.0. The v7 host binding used an older APDU protocol incompatible with the rewritten v8 device app, breaking account scan, receive and signing flows on firmware 8.0.x. Also raise the Cardano nano app minVersion to 8.0.8 so users on an incompatible older app are prompted to update instead of hitting broken flows.

- [#22263](https://github.com/LedgerHQ/ledger-live/pull/22263) [`3bcd040`](https://github.com/LedgerHQ/ledger-live/commit/3bcd04045cfa1bba7b1ae7d4751bd643cd8f5e0e) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump @react-native-community/netinfo to 12.0.1

- [#22116](https://github.com/LedgerHQ/ledger-live/pull/22116) [`214d382`](https://github.com/LedgerHQ/ledger-live/commit/214d38269add0b4f04c42002e1a42b1e75dc3c6d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Enforce the QR code pairing sequence on both sides of the handshake

  The host and the candidate now run the pairing messages through an explicit single-use state
  machine: each message is only accepted at the one point of the sequence where it is expected,
  and the peer that initiated the handshake is bound for the whole session. Envelopes, keys and
  decrypted bodies are validated before being acted upon, so a duplicate, out-of-order, foreign or
  malformed message ends the session with a `QRCodeProtocolError`: Desktop then asks for a fresh
  QR code, Mobile goes to its existing retry screen.

- [#22190](https://github.com/LedgerHQ/ledger-live/pull/22190) [`0651158`](https://github.com/LedgerHQ/ledger-live/commit/0651158a2f03f819c2e2770ef4179901768c3c6c) Thanks [@koda-apps](https://github.com/apps/koda-apps)! - Bump lumen-design-core to 0.1.29, lumen-ui-react to 0.1.59, lumen-ui-rnative to 0.1.62, and lumen-utils-shared to 0.1.13. In lumen-ui-rnative, `OptionList` (and its subcomponents, e.g. `OptionListItem`) is renamed to `SelectList`/`SelectListItem`, and `resolveAvatarColor` is renamed to `useResolveAvatarColor`, now a theme-reactive hook instead of a plain function; call sites in live-mobile and `@features/platform-contacts` are migrated accordingly. `resolveAvatarColor` in lumen-ui-react is unaffected by this bump.

- [#22306](https://github.com/LedgerHQ/ledger-live/pull/22306) [`845ac4a`](https://github.com/LedgerHQ/ledger-live/commit/845ac4a101b405b6c93333e335115ef1105ef824) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Restore translucent status backgrounds with the Lumen `-transparent` tokens after status colors became solid.

- [#21494](https://github.com/LedgerHQ/ledger-live/pull/21494) [`4b1a3af`](https://github.com/LedgerHQ/ledger-live/commit/4b1a3af55579ec09bcea8082cc6710597376832d) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(send): add skip memo confirmation bottomsheet in the lwm send flow

- [#22232](https://github.com/LedgerHQ/ledger-live/pull/22232) [`d7d2b9a`](https://github.com/LedgerHQ/ledger-live/commit/d7d2b9a0907cb0b16dd481f09c92b8796d80d3a9) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add mobile card asset details and withdraw scenes.

- [#21690](https://github.com/LedgerHQ/ledger-live/pull/21690) [`727cd08`](https://github.com/LedgerHQ/ledger-live/commit/727cd089d9b2a112fd297502417567777dd51871) Thanks [@pawell24](https://github.com/pawell24)! - feat(near): adapt NEAR UI to generic coin framework staking positions

- [#22305](https://github.com/LedgerHQ/ledger-live/pull/22305) [`fd6b9d0`](https://github.com/LedgerHQ/ledger-live/commit/fd6b9d0b602e44c5520152c2307bd629f11afc7a) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Open the provider withdrawal page from a card asset.

  - `buildWithdrawalPath` addresses `/withdrawal`, with the same `app_id` and `currency` query as `buildTopUpPath`.
  - Desktop opens it on the hosted manifest, mobile in the secure browser, both with the asset pre-selected.
  - Mobile also pre-selects the asset on the top up page.
  - Every mobile hosted page now opens in the same secure browser session, which shares the cookies of the login. `openHostedLoginInSecureBrowser` becomes `openHostedUrlInSecureBrowser`, and `openHostedPageInSecureBrowser` is removed.
  - Every hosted path now lives in `state/hostedPaths.ts`: signup, top up, withdrawal, manage PIN and the Baanx root. `cardSettingsPaths.ts` is removed, and the package exports the same names as before.

- [#22095](https://github.com/LedgerHQ/ledger-live/pull/22095) [`dc043f8`](https://github.com/LedgerHQ/ledger-live/commit/dc043f897838d62a9955f927421b33ca909d16ce) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Price the card wallets in the Pay tab's Assets list.

  - Resolves the card's currencies and prices each wallet against the user's counter value.
  - Registers those pairs for the session, since no account holds a card wallet's currency.
  - Both are gated on the card being signed in, so a visitor who never opens it is charged neither.

- [#22267](https://github.com/LedgerHQ/ledger-live/pull/22267) [`8e556b1`](https://github.com/LedgerHQ/ledger-live/commit/8e556b198bdf546968458347b0cad3e954ed4adb) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Map Baanx's EUROC to its Ledger currency.

  - `euroc.ethereum` and `euroc.euroc` resolve to `ethereum/erc20/euro_coin`.

- [#22114](https://github.com/LedgerHQ/ledger-live/pull/22114) [`afb2750`](https://github.com/LedgerHQ/ledger-live/commit/afb275029ec3aee1c833f1e468c41dc36279ab6f) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add Crypto and Card tabs to mobile transaction history.

- [#22308](https://github.com/LedgerHQ/ledger-live/pull/22308) [`9677738`](https://github.com/LedgerHQ/ledger-live/commit/9677738402a28bd494bd782c68fc99467465c2db) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Point the production and release builds at the live Baanx environment

- [#22184](https://github.com/LedgerHQ/ledger-live/pull/22184) [`75038d5`](https://github.com/LedgerHQ/ledger-live/commit/75038d59735ac63ab43baf7bd298969890241b3b) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Open the provider's top up page from the card on mobile.

  - The Top up button takes the place of the disabled "Coming soon" action on the card face, and it comes back at the bottom of the card details sheet.
  - Mobile opens `/topup` in the secure browser, which carries the provider session. A US card holder gets the US `app_id` on the query, so the page reaches the US tenant.

- [#22102](https://github.com/LedgerHQ/ledger-live/pull/22102) [`4b346a0`](https://github.com/LedgerHQ/ledger-live/commit/4b346a0f90b2c1f7c66df4be38e7c4b6b992ce57) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Show the card's balance on the Pay tab's card face.

  - The Pay tab passes the countervalue formatter the flow needs, so the face replaces the bare artwork.
  - Adds the `payTab.card.balanceLabel` copy the face reads; only desktop had it.

- [#22046](https://github.com/LedgerHQ/ledger-live/pull/22046) [`2aeb695`](https://github.com/LedgerHQ/ledger-live/commit/2aeb695663cf9a71d2a234ebc38819567f930564) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add a card transaction preview to the Pay card details view.

- [#22068](https://github.com/LedgerHQ/ledger-live/pull/22068) [`91531f2`](https://github.com/LedgerHQ/ledger-live/commit/91531f29e71e4e186375a5e2908ddca0c351c0ac) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Carry each card wallet's Ledger currency, so the app can price it.

  - `useCurrenciesByIds` resolves a list of Ledger ids to currencies: coins from the crypto registry, tokens from CAL. The lookups are dispatched rather than hooked, so the list can be any length.
  - A card wallet now carries `ledgerCurrency` instead of a counter value. Converting needs the app's rates, so it happens in platform code.
  - `BAANX_LEDGER_CURRENCY_IDS` lists every Ledger id the card catalog resolves to.
  - The Pay card devtool shows `ledgerCurrencyId` per joined wallet.

- [#22121](https://github.com/LedgerHQ/ledger-live/pull/22121) [`287f042`](https://github.com/LedgerHQ/ledger-live/commit/287f04286e4933e31e31952a3ac6485e145e34f2) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Answer the phone wallet step from the provider alone.

  - Mobile reads `cardAddedToDigitalWallet` from the card status for the onboarding step.
  - The device answer is gone: `hasAddedCardToWallet`, its two actions and its selector leave the widget state. The Add-to-Wallet CTA now hides on the provider's answer, and the instructions scene re-asks the card status instead of recording a local yes.
  - A tenant that does not send the flag leaves the step undone and keeps offering the CTA.
  - The onboarding mock gained `cardAddedToDigitalWallet`, so the dev tool's wallet toggle drives the mocked endpoint and follows request mocking like every other step.

- [#21841](https://github.com/LedgerHQ/ledger-live/pull/21841) [`d59d123`](https://github.com/LedgerHQ/ledger-live/commit/d59d123a2ba037b44507b1f5424e31f05309ec26) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(cosmos): migrate account resources to shared staking aggregate

- [#22214](https://github.com/LedgerHQ/ledger-live/pull/22214) [`72892c5`](https://github.com/LedgerHQ/ledger-live/commit/72892c5b3a7b675506c64f59329041099abbb099) Thanks [@sarneijim](https://github.com/sarneijim)! - Track the Q3 product tour with the Generic Awareness carousel contract on mobile and desktop, including a primary continue CTA and last-step completion.

- [#22234](https://github.com/LedgerHQ/ledger-live/pull/22234) [`b77b8f0`](https://github.com/LedgerHQ/ledger-live/commit/b77b8f0646bc4c29b7c54df861b9e16b64c307b3) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add asset-filtered mobile card transaction history.

- [#21945](https://github.com/LedgerHQ/ledger-live/pull/21945) [`1247cbc`](https://github.com/LedgerHQ/ledger-live/commit/1247cbc86a6cb0e653850a0b13535ef2109acc12) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Filter Braze Content Cards by local eligibility before Redux and re-evaluate on app state changes

- [#21967](https://github.com/LedgerHQ/ledger-live/pull/21967) [`40251b4`](https://github.com/LedgerHQ/ledger-live/commit/40251b41a62b2381c5c79410073a5f0b3c1fe629) Thanks [@sarneijim](https://github.com/sarneijim)! - Remove the obsolete original Wallet V4 tour

- [#22299](https://github.com/LedgerHQ/ledger-live/pull/22299) [`470bca7`](https://github.com/LedgerHQ/ledger-live/commit/470bca79315b3bb8242d01dd33e26b2b0da460ba) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Include send flow source in tracking properties on desktop and mobile.

- [#22056](https://github.com/LedgerHQ/ledger-live/pull/22056) [`cb866e1`](https://github.com/LedgerHQ/ledger-live/commit/cb866e1c07252a07fa991abd3dc2d8df68960256) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add @shared/linking package for cross-platform external link handling with URL safety, localization and analytics

- [#22248](https://github.com/LedgerHQ/ledger-live/pull/22248) [`0164fac`](https://github.com/LedgerHQ/ledger-live/commit/0164fac986bc066f5602f26069cd2c51128d7102) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(send): minor adjustement ui new send flow lwm

- [#22236](https://github.com/LedgerHQ/ledger-live/pull/22236) [`43e1a21`](https://github.com/LedgerHQ/ledger-live/commit/43e1a21f2060d53875256b001e054cf0b1f7b86a) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add Pay Card devtools controls for transaction and wallet balance fixtures, and answer the mocked wallet reorder with the order alone so linked assets keep the amounts they were showing while the reordered row shows its spinner.

- [#21377](https://github.com/LedgerHQ/ledger-live/pull/21377) [`1603611`](https://github.com/LedgerHQ/ledger-live/commit/1603611179046f098fba526aafb9633466448e05) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Align Stellar coin family with @ledgerhq/coin-stellar 9.7.2 export subpaths: import the API from `@ledgerhq/coin-stellar/api` and expose memo validation through the new `@ledgerhq/coin-stellar/logic-public` encapsulation

- [#22337](https://github.com/LedgerHQ/ledger-live/pull/22337) [`e1c0c65`](https://github.com/LedgerHQ/ledger-live/commit/e1c0c65f6c2726b29314ec2a7827d97672989ac0) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add legal agreement link to the Pay Card "More" menu

- [#21942](https://github.com/LedgerHQ/ledger-live/pull/21942) [`61362d0`](https://github.com/LedgerHQ/ledger-live/commit/61362d0e482a62c6fe663080c8ce2f4a25ffdb00) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Extract a desktop BrazeProvider and share Braze refresh and identity synchronization lifecycles

### Patch Changes

- Updated dependencies [[`40d296b`](https://github.com/LedgerHQ/ledger-live/commit/40d296b822381cc5d05616acafa1bca61e500dce), [`5649787`](https://github.com/LedgerHQ/ledger-live/commit/56497875407fe63148b6dfbf266b778748972c01), [`4d1d640`](https://github.com/LedgerHQ/ledger-live/commit/4d1d64049a0bb0562a1a0c8ad2555fe967acdd7f), [`731ebd2`](https://github.com/LedgerHQ/ledger-live/commit/731ebd22047779093d5821d38ea53f6f9fc1a694), [`250c1c0`](https://github.com/LedgerHQ/ledger-live/commit/250c1c0e4cd081a67f46b37e852291a32e02b05b), [`510465b`](https://github.com/LedgerHQ/ledger-live/commit/510465b5ac5808a42729dbea99aea081bf759e4a), [`c7eb01d`](https://github.com/LedgerHQ/ledger-live/commit/c7eb01d392a1adf04db824cd8602d939985599c7), [`871e485`](https://github.com/LedgerHQ/ledger-live/commit/871e4854284a0b21e31b53ff0ac312010093d914), [`6996290`](https://github.com/LedgerHQ/ledger-live/commit/6996290580691788820aabd70367655f2283ac20), [`72367fc`](https://github.com/LedgerHQ/ledger-live/commit/72367fcf2343fa488008236f1005da589e6e3054), [`c22ee67`](https://github.com/LedgerHQ/ledger-live/commit/c22ee67d3e0271b382337fe4175170bdabf5dfca), [`3d50917`](https://github.com/LedgerHQ/ledger-live/commit/3d50917da2e7c2177f8288bb754d41a7699f27be), [`cfa249c`](https://github.com/LedgerHQ/ledger-live/commit/cfa249c4c3a30f9eba1ecee1749030121da9291a), [`285b50d`](https://github.com/LedgerHQ/ledger-live/commit/285b50dc311eef60089f779cffdfe14a0422d2ec), [`d137f01`](https://github.com/LedgerHQ/ledger-live/commit/d137f01ed03877ca783d8b97eb303bde6e3ff998), [`35a5198`](https://github.com/LedgerHQ/ledger-live/commit/35a51980fc4d32efd7fd8440e5f5e9ef6a7348db), [`795e693`](https://github.com/LedgerHQ/ledger-live/commit/795e693bd67a942bc3c272183476ef470d3c8605), [`944bd23`](https://github.com/LedgerHQ/ledger-live/commit/944bd2345899c399bc931144fe46b48d0d1bf55b), [`1badf50`](https://github.com/LedgerHQ/ledger-live/commit/1badf50ec0c225f93b46ed5b1368257cc9b8e88d), [`8d1a795`](https://github.com/LedgerHQ/ledger-live/commit/8d1a79550afabc570b2d3b7867432d5a9f1d4e87), [`a1a8b81`](https://github.com/LedgerHQ/ledger-live/commit/a1a8b81b3f9b4eb897ac3d81427a1df0a5e0130b), [`675564f`](https://github.com/LedgerHQ/ledger-live/commit/675564fc759b896ffcc26c99fc4d9d0a0a3bd344), [`1ec8d15`](https://github.com/LedgerHQ/ledger-live/commit/1ec8d15feb3f9339bc09c18c682e140d370c9efe), [`386710a`](https://github.com/LedgerHQ/ledger-live/commit/386710a6893f7e17a781b36f29ebe2e08f9b5b20), [`84bba64`](https://github.com/LedgerHQ/ledger-live/commit/84bba645bfe85f3bd4d6f03431916226113c7bc5), [`c682542`](https://github.com/LedgerHQ/ledger-live/commit/c682542d2adc4066f1c5d6531f781babb0e772b9), [`319fbe4`](https://github.com/LedgerHQ/ledger-live/commit/319fbe464cbf256b7b3ee57113b6abd6c52ccd55), [`dd155a7`](https://github.com/LedgerHQ/ledger-live/commit/dd155a7608f771f8e9a26007e3ad28a82429a700), [`95a1007`](https://github.com/LedgerHQ/ledger-live/commit/95a1007bb9d4f62d693391a99eca3cb3b12f0e7d), [`233e44e`](https://github.com/LedgerHQ/ledger-live/commit/233e44e3dd724cc9d4f14a02c7e62e39d2e9079b), [`1557452`](https://github.com/LedgerHQ/ledger-live/commit/1557452f86f214191d2f29e5fca40b5077f90e11), [`6741356`](https://github.com/LedgerHQ/ledger-live/commit/67413566f84b895e6f4ae2b5d646bfc2e82c6926), [`dafadf0`](https://github.com/LedgerHQ/ledger-live/commit/dafadf005a54007d5430203c11b8718c1636a6e4), [`9652494`](https://github.com/LedgerHQ/ledger-live/commit/96524949cbf8fa1d102a0156f40004ff12a30475), [`5492648`](https://github.com/LedgerHQ/ledger-live/commit/5492648988e327c8e3e6e7d5ead1e0fa2bd9929e), [`905d26b`](https://github.com/LedgerHQ/ledger-live/commit/905d26b9ea6f419d3269a376e0f0c9b6ce8b2b82), [`98e3038`](https://github.com/LedgerHQ/ledger-live/commit/98e303872684da47feca343c0db7d83fcce857b2), [`ea94dd0`](https://github.com/LedgerHQ/ledger-live/commit/ea94dd00d64bae6b7fd9c792da77ffba751a9f01), [`736a0d5`](https://github.com/LedgerHQ/ledger-live/commit/736a0d5ba692e2342df4fc503056524359d35d65), [`7848066`](https://github.com/LedgerHQ/ledger-live/commit/7848066f6ba1b803b5a8d3df02ce6d35e46b370e), [`1648042`](https://github.com/LedgerHQ/ledger-live/commit/164804200fcd3486d9f364a31b065cb7f7d2a170), [`eb2a2a5`](https://github.com/LedgerHQ/ledger-live/commit/eb2a2a598787555cc05ed7ae105dd1648fbe43f5), [`c52af21`](https://github.com/LedgerHQ/ledger-live/commit/c52af21b622efa62774657e190abb9762cffac1c), [`33e92e8`](https://github.com/LedgerHQ/ledger-live/commit/33e92e8f074ff73a6a3e338c8313ba8bc9066ccf), [`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68), [`a62ad28`](https://github.com/LedgerHQ/ledger-live/commit/a62ad28e4900a887567fb61fb8f197af4fa5a23b), [`6183efd`](https://github.com/LedgerHQ/ledger-live/commit/6183efddac5de725cb22a013d5a9cdc94e65f756), [`5d2f40f`](https://github.com/LedgerHQ/ledger-live/commit/5d2f40f470f859960e43a2a08755a962796f6beb), [`62a6f6c`](https://github.com/LedgerHQ/ledger-live/commit/62a6f6c516180411942c54ef686219387c41fb95), [`214d382`](https://github.com/LedgerHQ/ledger-live/commit/214d38269add0b4f04c42002e1a42b1e75dc3c6d), [`0651158`](https://github.com/LedgerHQ/ledger-live/commit/0651158a2f03f819c2e2770ef4179901768c3c6c), [`845ac4a`](https://github.com/LedgerHQ/ledger-live/commit/845ac4a101b405b6c93333e335115ef1105ef824), [`d7d2b9a`](https://github.com/LedgerHQ/ledger-live/commit/d7d2b9a0907cb0b16dd481f09c92b8796d80d3a9), [`29ce771`](https://github.com/LedgerHQ/ledger-live/commit/29ce7712ce93cd27afa97eda2d14a0ff066551fb), [`fd6b9d0`](https://github.com/LedgerHQ/ledger-live/commit/fd6b9d0b602e44c5520152c2307bd629f11afc7a), [`8d073ca`](https://github.com/LedgerHQ/ledger-live/commit/8d073ca6a527a11ce6f10995bb896ae983211f63), [`954ffbd`](https://github.com/LedgerHQ/ledger-live/commit/954ffbdeb8172f555b637599d24cf2a94bcf24db), [`a915d4a`](https://github.com/LedgerHQ/ledger-live/commit/a915d4a577dfe7bb778364c4b0269bc61203075a), [`99bf629`](https://github.com/LedgerHQ/ledger-live/commit/99bf629658121670784047780f74702cfa2c3ebc), [`853e47d`](https://github.com/LedgerHQ/ledger-live/commit/853e47dac8f42644733686353c3f0f4a3fcc035a), [`c48d6d7`](https://github.com/LedgerHQ/ledger-live/commit/c48d6d71b7ec0318cfec3277c119284a88d652f7), [`8e556b1`](https://github.com/LedgerHQ/ledger-live/commit/8e556b198bdf546968458347b0cad3e954ed4adb), [`dbc9655`](https://github.com/LedgerHQ/ledger-live/commit/dbc9655cb61b4999fa6cd52dca25053f9f301dd3), [`afb2750`](https://github.com/LedgerHQ/ledger-live/commit/afb275029ec3aee1c833f1e468c41dc36279ab6f), [`eb06f77`](https://github.com/LedgerHQ/ledger-live/commit/eb06f77c9548a2e4641c37da90c34b4fcffba667), [`8dcb040`](https://github.com/LedgerHQ/ledger-live/commit/8dcb040ccac4abaeba356e76b60dc03802303bf5), [`75038d5`](https://github.com/LedgerHQ/ledger-live/commit/75038d59735ac63ab43baf7bd298969890241b3b), [`d9d1111`](https://github.com/LedgerHQ/ledger-live/commit/d9d1111733e757cc58b6249fdda568dd56d40757), [`4b346a0`](https://github.com/LedgerHQ/ledger-live/commit/4b346a0f90b2c1f7c66df4be38e7c4b6b992ce57), [`2aeb695`](https://github.com/LedgerHQ/ledger-live/commit/2aeb695663cf9a71d2a234ebc38819567f930564), [`91531f2`](https://github.com/LedgerHQ/ledger-live/commit/91531f29e71e4e186375a5e2908ddca0c351c0ac), [`287f042`](https://github.com/LedgerHQ/ledger-live/commit/287f04286e4933e31e31952a3ac6485e145e34f2), [`6fe6efb`](https://github.com/LedgerHQ/ledger-live/commit/6fe6efb9f2c9211d6002dd17f4369f90390021bf), [`d59d123`](https://github.com/LedgerHQ/ledger-live/commit/d59d123a2ba037b44507b1f5424e31f05309ec26), [`bc43337`](https://github.com/LedgerHQ/ledger-live/commit/bc433372ebed1990d81a87b109eeb4d928271315), [`d19e4ae`](https://github.com/LedgerHQ/ledger-live/commit/d19e4aed0efb7e6ff8b8195dd8437cddbd455fe7), [`6844ca4`](https://github.com/LedgerHQ/ledger-live/commit/6844ca4e220c98ff99dd5d259dab339223624847), [`40251b4`](https://github.com/LedgerHQ/ledger-live/commit/40251b41a62b2381c5c79410073a5f0b3c1fe629), [`cb866e1`](https://github.com/LedgerHQ/ledger-live/commit/cb866e1c07252a07fa991abd3dc2d8df68960256), [`bb3e182`](https://github.com/LedgerHQ/ledger-live/commit/bb3e1822bfc2cb9ff00089082782d9e2bd229b67), [`43e1a21`](https://github.com/LedgerHQ/ledger-live/commit/43e1a21f2060d53875256b001e054cf0b1f7b86a), [`e1c0c65`](https://github.com/LedgerHQ/ledger-live/commit/e1c0c65f6c2726b29314ec2a7827d97672989ac0), [`e2134f5`](https://github.com/LedgerHQ/ledger-live/commit/e2134f5cffe4669ff5896e2b52904fe22218461b)]:
  - @shared/env@0.8.0-next.0
  - @shared/api-services@0.8.0-next.0
  - @features/platform-card@0.6.0-next.0
  - @features/flow-pay-card-auth@0.8.0-next.0
  - @features/flow-contacts-list@0.8.0-next.0
  - @domain/api-card-management@0.7.0-next.0
  - @features/flow-pay-card-details@0.5.0-next.0
  - @features/flow-pay-card@0.5.0-next.0
  - @shared/ui-queued-bottom-sheet@0.5.0-next.0
  - @features/platform-contacts@0.8.0-next.0
  - @features/flow-contacts-add-contact@0.7.0-next.0
  - @features/flow-contacts-edit-contact@0.6.0-next.0
  - @features/flow-contacts-edit-address@0.4.0-next.0
  - @features/flow-contacts-add-address@0.6.0-next.0
  - @features/flow-contacts@0.12.0-next.0
  - @features/flow-pay-card-widget@0.4.0-next.0
  - @devtools/bindings@0.9.0-next.0
  - @features/flow-app-lock@0.5.0-next.0
  - @features/platform-app-lock@0.4.0-next.0
  - @shared/ui-info-state@0.3.0-next.0
  - @features/flow-pay-card-assets@0.2.0-next.0
  - @features/flow-large-screen-upsell@2.2.0-next.0
  - @features/flow-pay-card-transactions@0.3.0-next.0
  - @domain/entity-currency-crypto@0.13.0-next.0
  - @ledgerhq/coin-concordium@1.4.0-next.0
  - @domain/entity-contact@0.10.0-next.0
  - @ledgerhq/coin-bitcoin@0.53.0-next.0
  - @ledgerhq/coin-canton@1.2.0-next.0
  - @ledgerhq/coin-casper@3.4.0-next.0
  - @ledgerhq/coin-cosmos@1.4.0-next.0
  - @ledgerhq/coin-filecoin@2.2.0-next.0
  - @ledgerhq/coin-multiversx@1.2.0-next.0
  - @ledgerhq/coin-stacks@0.31.0-next.0
  - @ledgerhq/hw-transport-http@6.38.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.5.0-next.0
  - @ledgerhq/types-devices@7.1.0-next.0
  - @ledgerhq/types-live@6.125.0-next.0
  - @features/platform-env@0.4.0-next.0
  - @ledgerhq/live-dmk-shared@0.33.0-next.0
  - @ledgerhq/ledger-key-ring-protocol@0.23.0-next.0
  - @devtools/shell@0.10.0-next.0
  - @devtools/transport-panel@0.7.0-next.0
  - @ledgerhq/hw-ledger-key-ring-protocol@0.13.0-next.0
  - @shared/feature-flags@0.24.0-next.0
  - @domain/entity-card-asset-mapping@0.7.0-next.0
  - @features/platform-currencies@0.9.0-next.0
  - @features/flow-pay-balance@0.5.0-next.0
  - @features/flow-pay-feature-tour@0.6.0-next.0
  - @features/flow-pay-request@0.6.0-next.0
  - @features/platform-feature-flags@0.8.0-next.0
  - @shared/linking@0.3.0-next.0
  - @domain/api-aggregated-assets@0.5.2-next.0
  - @features/platform-aggregated-assets@0.5.4-next.0
  - @ledgerhq/live-dmk-mobile@0.29.9-next.0
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
  - @ledgerhq/device-core@0.11.17-next.0
  - @ledgerhq/domain-service@1.8.20-next.0
  - @devtools/wire@0.5.1-next.0
  - @features/flow-analytics-consent@0.2.7-next.0

## 4.21.0

### Minor Changes

- [#21662](https://github.com/LedgerHQ/ledger-live/pull/21662) [`9164e8b`](https://github.com/LedgerHQ/ledger-live/commit/9164e8b81ecb84e5d8ba0bb606981c2dc83d04c1) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add freeze/unfreeze confirmation dialog and bottom sheet for pay card

- [#21928](https://github.com/LedgerHQ/ledger-live/pull/21928) [`1995d49`](https://github.com/LedgerHQ/ledger-live/commit/1995d49c63301199aef3e9a079f1d10fd0598f8b) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Render the card transaction history on mobile, inside the card details sheet overview

- [#21707](https://github.com/LedgerHQ/ledger-live/pull/21707) [`8f62cdb`](https://github.com/LedgerHQ/ledger-live/commit/8f62cdbb6d93e207efd7e551af65a41953d28242) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add View/Hide and a 3D flip for card numbers.

- [#21722](https://github.com/LedgerHQ/ledger-live/pull/21722) [`182fae7`](https://github.com/LedgerHQ/ledger-live/commit/182fae7fbfa81b42de061e67da8edf21a7f72281) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add a Card Details container with native artwork, Details sheet, and web composition

- [#21754](https://github.com/LedgerHQ/ledger-live/pull/21754) [`ba31ece`](https://github.com/LedgerHQ/ledger-live/commit/ba31ece3a22febeafbec027840d16ea82c2dad5e) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Render the native card details overview, freeze confirmation and More menu as scenes inside a single bottom sheet

- [#21584](https://github.com/LedgerHQ/ledger-live/pull/21584) [`13e3ebb`](https://github.com/LedgerHQ/ledger-live/commit/13e3ebba3ec7f10dcaf7d960f242f14a9853a191) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix the Contacts alphabetical index on Mobile not scrolling the list to the tapped or dragged letter. The index container now owns the gesture so touch coordinates resolve against it instead of against the tapped letter, which always resolved to the first section, and it keeps the responder instead of losing it to the list underneath on the first drag move. The list supplies `getItemLayout`, so `scrollToLocation` reaches sections below the render window instead of silently giving up on a long contact list. Dragging jumps without animating so a scrub no longer queues one cancelled scroll animation per letter.

- [#21665](https://github.com/LedgerHQ/ledger-live/pull/21665) [`16a454f`](https://github.com/LedgerHQ/ledger-live/commit/16a454fa79be46df6aec3c50ad40407f36dfdea9) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Fix saving a contact address on EVM networks that ship their own coin app, such as Sei, Sonic and Ethereum Classic. The device app to open is now derived from the network family rather than from the network's own `managerAppName`, so EVM networks with an EIP-155 chain ID register through the Ethereum app and are told apart by that chain ID, which is what the Contacts device kit expects. These networks are selectable again, reversing the restriction added in LIVE-36688.

  Address-book eligibility now lives in a single place: `isEligibleAddressCurrency` moves from `@ledgerhq/live-common` to `@features/platform-contacts`, where it checks device capability alongside the network family. The send flow and the Contacts network picker previously answered this question separately, which is how an entry point could be offered for a network the device would refuse.

- [#21855](https://github.com/LedgerHQ/ledger-live/pull/21855) [`24d1ff6`](https://github.com/LedgerHQ/ledger-live/commit/24d1ff67f1aea695dfcae2303f8a780feb985964) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Prevent saving duplicate addresses across contacts — show "This address is already used by [Contact Name]." when adding or editing an address that is already saved in another contact

- [#21681](https://github.com/LedgerHQ/ledger-live/pull/21681) [`de19b3e`](https://github.com/LedgerHQ/ledger-live/commit/de19b3e4e56a0c28fcc1a3ca929059e84fc7bebf) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add freeze/unfreeze confirmation error handling with retry

- [#21698](https://github.com/LedgerHQ/ledger-live/pull/21698) [`25224f4`](https://github.com/LedgerHQ/ledger-live/commit/25224f463b834dba7a2811d7150aeec6dbd6a3ac) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Move the More menu into card details and put freeze and More on one actions row

- [#21706](https://github.com/LedgerHQ/ledger-live/pull/21706) [`96a1ca9`](https://github.com/LedgerHQ/ledger-live/commit/96a1ca9fef1b0acc8113708c148890054dea143d) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add excludedCurrencyIds param to lwdContacts and lwmContacts feature flags to exclude specific currencies from Contacts

- [#21777](https://github.com/LedgerHQ/ledger-live/pull/21777) [`f7fa8f0`](https://github.com/LedgerHQ/ledger-live/commit/f7fa8f0ff23c03a69933f2d6aa6e0b225af9d542) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Resolve a single Pay Card display state so the card face, onboarding widget and login CTA no longer overlap, and hold them back until the stored session is read

- [#21931](https://github.com/LedgerHQ/ledger-live/pull/21931) [`e8fa868`](https://github.com/LedgerHQ/ledger-live/commit/e8fa86874942249a54884353c6c1b070af80d4b1) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add privacy policy disclaimer link to contacts add address flow on desktop and mobile

- [#21716](https://github.com/LedgerHQ/ledger-live/pull/21716) [`641fdb7`](https://github.com/LedgerHQ/ledger-live/commit/641fdb7b392aff50d4bfa206e2435f75cb610227) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Let the mobile Ledger Sync e2e suites run against the PROD trustchain during a release validation. The environment now reaches the app as a Detox launch arg, which the e2e bridge applies before the app tree mounts — the only point where the trustchain SDK singleton can still be pinned — so it no longer has to be refused outright.

- [#21961](https://github.com/LedgerHQ/ledger-live/pull/21961) [`2b976be`](https://github.com/LedgerHQ/ledger-live/commit/2b976be3c7d61accd0911b439263be9d66f50508) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Let someone remove their app lock password, behind `lwmPasswordRevamp`.

  Turning the switch off used to reach the legacy removal screen, which reads the default keychain item and compares plaintext. A revamped password lives under its own service as a verifier, so that screen could never succeed — and its `if (credentials)` guard skipped the comparison entirely when it found nothing, clearing legacy state without ever checking the password.

  The new screen derives with the parameters stored in the verifier rather than today's defaults, compares in constant time, and destroys the verifier before flipping the protection state. A wrong password and a keychain that will not answer are reported differently, since a single boolean forced one to be shown as the other.

  The screens also stop taking their strings as a `labels` object built by the app: each one now calls `useTranslation` from `@shared/i18n` where it renders, as the `pay-*` flows already do. That removes the `*Labels` types and the per-screen `useMemo` that rebuilt them, and turns the failure props into booleans so the state stays in the view model while the message lives in the view.

- [#21957](https://github.com/LedgerHQ/ledger-live/pull/21957) [`ba09b32`](https://github.com/LedgerHQ/ledger-live/commit/ba09b327c19394d13c1494c66a71f3ded36fd182) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Derive the Settings password switch from the stored protection state instead of flipping it on tap, behind `lwmPasswordRevamp`.

  The legacy row moved its own local state as soon as the switch was touched, so cancelling the add or the removal flow left the switch disagreeing with reality until the screen regained focus. The revamped row reads `hasPassword` and lets the flow decide.

  This is also what makes setting a password visible: the verifier already landed, but nothing in Settings reflected it.

- [#21860](https://github.com/LedgerHQ/ledger-live/pull/21860) [`6dfb512`](https://github.com/LedgerHQ/ledger-live/commit/6dfb512e7bd2d1f78203594ee167e60d77a81443) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Replace react-native-haptic-feedback with expo-haptics, already present as a Lumen peer

- [#21685](https://github.com/LedgerHQ/ledger-live/pull/21685) [`e0f0e6c`](https://github.com/LedgerHQ/ledger-live/commit/e0f0e6cc170b55472b528a969950caa05ae0a618) Thanks [@amaslakov](https://github.com/amaslakov)! - Add the error message shown when the protocol refuses a Tezos stake amount as too small

- [#21859](https://github.com/LedgerHQ/ledger-live/pull/21859) [`9ec3490`](https://github.com/LedgerHQ/ledger-live/commit/9ec34909c3110e1e1c62f47cd6d97d5eefaa8202) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump react-native-restart from 0.0.24 to 0.0.29 and migrate to the non-deprecated `restart()` API (LIVE-37285)

- [#21815](https://github.com/LedgerHQ/ledger-live/pull/21815) [`06b7fd3`](https://github.com/LedgerHQ/ledger-live/commit/06b7fd310ad9bc9200352ef5debf9dd2d5fb7a77) Thanks [@zel-kass](https://github.com/zel-kass)! - Fold Lumen visualization into lumen-ui-react and lumen-ui-rnative

- [#21651](https://github.com/LedgerHQ/ledger-live/pull/21651) [`632dd93`](https://github.com/LedgerHQ/ledger-live/commit/632dd9368616a97581d037f1503b2b16f567c02a) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Align Contacts analytics events and properties with the tracking plan on desktop and mobile.

- [#21921](https://github.com/LedgerHQ/ledger-live/pull/21921) [`036b71d`](https://github.com/LedgerHQ/ledger-live/commit/036b71d678a57c3b1c3156374122fe13bea54f79) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Align the add-contact confirmation CTA with "Add contact" on mobile and desktop

- [#21576](https://github.com/LedgerHQ/ledger-live/pull/21576) [`12b5956`](https://github.com/LedgerHQ/ledger-live/commit/12b59564abef3021e2e75cec9727e603e1d133c2) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Show the Pay contact success screen after a Pay send.

- [#21691](https://github.com/LedgerHQ/ledger-live/pull/21691) [`a091234`](https://github.com/LedgerHQ/ledger-live/commit/a0912345b11a06da31086d2923cd47525a94610c) Thanks [@sarneijim](https://github.com/sarneijim)! - Add the Q3 Wallet V4 Tour drawer carousel on mobile, gated by releaseTour Q3 variants (q3_a, q3_b, q3_b2), without Portfolio auto-open. The carousel now lives in a shared WalletV4TourDrawer component that both the Q2 and Q3 tours configure.

- [#21656](https://github.com/LedgerHQ/ledger-live/pull/21656) [`85e01c4`](https://github.com/LedgerHQ/ledger-live/commit/85e01c449dab75d75851631a56d292f2cb0c5b36) Thanks [@sarneijim](https://github.com/sarneijim)! - Add the Q3 Wallet V4 Tour feature flag, persisted seen state, mobile debug setup, and Segment wallet40Attributes.q3Tour

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

- [#21595](https://github.com/LedgerHQ/ledger-live/pull/21595) [`a18539e`](https://github.com/LedgerHQ/ledger-live/commit/a18539e885fdfe379c77623a448256fb4602b6c0) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Read the sub-account id from the screen in `navigateToSubAccount` instead of rebuilding it. Rebuilding meant hardcoding one of the two id formats in the wild: an account synced before the generic coin framework keeps the format it was stored under, a newer one gets `encodeTokenAccountId`. The helper now opens the sub-account from the flat accounts list and returns the id the app gave it, with an identity assertion that does not depend on the id it just read.

  `navigateToTokenInAccount` expands the token list when the "see more" button is present. The list shows three tokens while collapsed, so a fourth one was never on screen to scroll to. Adds a `testID` to that button in `SubAccountsList`.

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

- [#21726](https://github.com/LedgerHQ/ledger-live/pull/21726) [`bc5aa43`](https://github.com/LedgerHQ/ledger-live/commit/bc5aa43e2abc011e2ce8d9f4817ed09aaeac1195) Thanks [@alexstapenka-ledger](https://github.com/alexstapenka-ledger)! - Forward llmWalletApiDeviceIntentSignEnabled to the Earn live-app on mobile

- [#21633](https://github.com/LedgerHQ/ledger-live/pull/21633) [`60655cd`](https://github.com/LedgerHQ/ledger-live/commit/60655cdf828eebdddd515d52c8fc5876ea50baf8) Thanks [@qperrot](https://github.com/qperrot)! - Add memo on xrp operation details

- [#22022](https://github.com/LedgerHQ/ledger-live/pull/22022) [`2aa4581`](https://github.com/LedgerHQ/ledger-live/commit/2aa45814f2c4eacfb47fc79fdaf336e42087366a) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Bump lumen-ui-react to 0.1.58, lumen-ui-rnative to 0.1.61, crypto-icons to 2.0.6; migrate TransactionalIcon to getDotIconProps

- [#21887](https://github.com/LedgerHQ/ledger-live/pull/21887) [`a62261e`](https://github.com/LedgerHQ/ledger-live/commit/a62261e2e63218affcd3690a70b5a42f355a48a4) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Tell the user a currency is unavailable in their region instead of showing a generic balance error, and bump coin-module-framework to 9.1.0 for the typed checkRegionRestriction flag

- [#21751](https://github.com/LedgerHQ/ledger-live/pull/21751) [`dc204a7`](https://github.com/LedgerHQ/ledger-live/commit/dc204a7633e6f7c9acb66fbb18a6aeaa2e75c4bb) Thanks [@sarneijim](https://github.com/sarneijim)! - Add releaseTour and gate Q2/Q3 tours with it, dropping q2Tour/q3Tour from Wallet 4.0

- [#22270](https://github.com/LedgerHQ/ledger-live/pull/22270) [`354486c`](https://github.com/LedgerHQ/ledger-live/commit/354486ca79badb49b9c902b1724a36379c278358) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Support Cardano firmware app v8.0.8 by bumping @cardano-foundation/ledgerjs-hw-app-cardano from 7.x to 8.0.0. The v7 host binding used an older APDU protocol incompatible with the rewritten v8 device app, breaking account scan, receive and signing flows on firmware 8.0.x. Also raise the Cardano nano app minVersion to 8.0.8 so users on an incompatible older app are prompted to update instead of hitting broken flows.

- [#21857](https://github.com/LedgerHQ/ledger-live/pull/21857) [`32a8351`](https://github.com/LedgerHQ/ledger-live/commit/32a83510ee567f3f44d07638a33e6ba1ea632d48) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump react-native-tcp-socket from 6.0.6 to 6.4.2 (LIVE-37286)

- [#21966](https://github.com/LedgerHQ/ledger-live/pull/21966) [`38b7dab`](https://github.com/LedgerHQ/ledger-live/commit/38b7dab3436b2e72b4e8642f6c6b0fd9118475bc) Thanks [@sarneijim](https://github.com/sarneijim)! - Move Q2/Q3 debug tours into Features & Flows

- [#21195](https://github.com/LedgerHQ/ledger-live/pull/21195) [`cef83ae`](https://github.com/LedgerHQ/ledger-live/commit/cef83ae58ffc5529bebda292737502e78e3b7522) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Add Card session and MSW renewal controls to the Card / Pay DevTool.

- [#21688](https://github.com/LedgerHQ/ledger-live/pull/21688) [`5cd48fc`](https://github.com/LedgerHQ/ledger-live/commit/5cd48fc06a19cc2e0c0a732ac212fd4cd92869e8) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Close the contacts add address drawer before the device intent executor runs

- [#22021](https://github.com/LedgerHQ/ledger-live/pull/22021) [`8dc8e99`](https://github.com/LedgerHQ/ledger-live/commit/8dc8e99e069baafdbde2dfa66b3cc06878012533) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - feat(pay-card): set the seven Baanx configuration values per environment

- [#21663](https://github.com/LedgerHQ/ledger-live/pull/21663) [`c6f7bfe`](https://github.com/LedgerHQ/ledger-live/commit/c6f7bfead8593c148fe6e3d177ff8dd734728f5a) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Mark a frozen pay card on the card visual: the card face fades out behind a centered snow `Spot`, read from the same card status the freeze tile uses. The features/flow jest projects now compile `@ledgerhq/lumen-utils-shared` instead of leaving its ESM untransformed, so views can use `cn`.

- [#21792](https://github.com/LedgerHQ/ledger-live/pull/21792) [`0e1e102`](https://github.com/LedgerHQ/ledger-live/commit/0e1e10227aa5cc0d19e8a142533c54838e3ed57e) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - The desktop Pay tab centres the Card login block, and it offers a login link to a card holder who
  has a card already. The login reads every error message from the copy keys.

- [#21915](https://github.com/LedgerHQ/ledger-live/pull/21915) [`34f8541`](https://github.com/LedgerHQ/ledger-live/commit/34f8541ae58847dcee784b3fe97f227edd644775) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - fix(pay-card): save the Card login intro flag after a redirect login, and give the desktop login block a title before the intro

- [#21916](https://github.com/LedgerHQ/ledger-live/pull/21916) [`8c393ed`](https://github.com/LedgerHQ/ledger-live/commit/8c393ed10e61da587716269bf0dc7324e89bef4b) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - The Card login intro sheet now opens at full height instead of the height of its content.

- [#21918](https://github.com/LedgerHQ/ledger-live/pull/21918) [`fcc2ac4`](https://github.com/LedgerHQ/ledger-live/commit/fcc2ac4c5ed270fb63df4c0079068ad6dac94612) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Sign a mock Card session in and out from the Pay Card DevTool, and answer the Card endpoints from the desktop MSW worker, so the Card surfaces can be reached without the hosted login.

- [#21626](https://github.com/LedgerHQ/ledger-live/pull/21626) [`eddc89e`](https://github.com/LedgerHQ/ledger-live/commit/eddc89e7b86a13aeedfc0ae4956c2dcd08494e5f) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Show and drive the derived card onboarding status from the Card / Pay devtool.

  - A "Card onboarding" screen: a `Stepper` for the count, every step by the id the app keys it on, and the derived answer printed raw so a step can be traced to the response behind it.
  - Each step a request decides carries a toggle. It sets what that endpoint answers, so the step follows on the next read and holds until it is cleared. The phone wallet step is answered on the device; the purchase step is read-only while nothing answers it.
  - An endpoint answers from the provider until its toggle is used, so one step can be held while the rest stay real, and "Use the real answers" hands them all back.
  - `@domain/api-card-management/mock/card-onboarding-status` holds those answers and the responses that carry them; the mobile MSW handlers read it before falling back to what they answered before.
  - Mocking is started by an env var, so without it the screen says so instead of offering a toggle that would set an answer nothing reads.
  - The hook gains `refresh`, which re-asks all three sources: the screen asks on open and on demand.

- [#21872](https://github.com/LedgerHQ/ledger-live/pull/21872) [`37f5759`](https://github.com/LedgerHQ/ledger-live/commit/37f57595f11d40562914794645cb3c7f6e55dc8b) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Read the card transactions and give each one its spend category.

  - `useCardTransactionsViewModel` reads the first page of `GET /v1/card/transactions` while a session is live, and hands each transaction its category and that category's translated label.
  - `mccCategory` is now the closed set the provider documents (`PayCardTransactionCategory`), and a grouping it never named reads as `MISC` so one new label cannot fail a whole page.
  - `mockPayCardTransactions` answers a page covering every category, served by the desktop and mobile MSW workers on `GET /v1/card/transactions`.

- [#21917](https://github.com/LedgerHQ/ledger-live/pull/21917) [`a2a0288`](https://github.com/LedgerHQ/ledger-live/commit/a2a028844dbfbfa019f1f971bf6fdbed9005b9ec) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Show card transactions on the Pay Card panel as a list of items, with a subheader when the list is not empty.

- [#21637](https://github.com/LedgerHQ/ledger-live/pull/21637) [`cbf1f54`](https://github.com/LedgerHQ/ledger-live/commit/cbf1f54cb06de374474ed0d2bac7cb155bc935ef) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Open the Pay contact success screen from the Pay Card DevTool

- [#21710](https://github.com/LedgerHQ/ledger-live/pull/21710) [`4ac2794`](https://github.com/LedgerHQ/ledger-live/commit/4ac2794b8244b094f2e91563bb7ad8a220d6cba5) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Align request-receive with Figma. Mobile Share sends the rounded card PNG plus the address as text. Desktop Save writes one PNG.

- [#21668](https://github.com/LedgerHQ/ledger-live/pull/21668) [`2edc7c8`](https://github.com/LedgerHQ/ledger-live/commit/2edc7c8d47b1ac8b49194155be8f8b3722574d39) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Keep the Pay Request receive QR scannable in light on mobile (white card, black modules) and use base color for Pay tab contact names (LIVE-37096).

- [#21824](https://github.com/LedgerHQ/ledger-live/pull/21824) [`c88b5c6`](https://github.com/LedgerHQ/ledger-live/commit/c88b5c65b0488097e2a17071ca04ac06ae41763a) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Scroll the whole Pay tab: the content no longer gets clipped and clears the tab bar

- [#21937](https://github.com/LedgerHQ/ledger-live/pull/21937) [`cd32aad`](https://github.com/LedgerHQ/ledger-live/commit/cd32aad899bf91b1843cdbc3e839bbfcdb0f443b) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Explain on a Hyperliquid account that transactions are not supported and offer a way to open Perps

- [#21031](https://github.com/LedgerHQ/ledger-live/pull/21031) [`b8a768a`](https://github.com/LedgerHQ/ledger-live/commit/b8a768a0205d337f0b626df91d55b9477453415a) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Add the Perps deposit review step on mobile, reached from the deposit form, showing the swap and deposit details before the user confirms. The amount landing on the perps account now comes from a provider quote, since that balance has no counter value of its own.

- [#21457](https://github.com/LedgerHQ/ledger-live/pull/21457) [`7ca6525`](https://github.com/LedgerHQ/ledger-live/commit/7ca6525507fd7546037009a0a69ee830676a2748) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Add the Perps deposit signing step on mobile, as a bottom sheet on the deposit screen that the review hands over to. It runs on the shared `executeSwap` orchestration behind the perps screens, and executes against the quote the review priced against. Declining a device prompt returns to the review with the entered amount intact, rather than raising an error screen.

- [#21473](https://github.com/LedgerHQ/ledger-live/pull/21473) [`1fd8973`](https://github.com/LedgerHQ/ledger-live/commit/1fd897384bd98c9bcb8010f367d2874949c19512) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Name the transaction detail drawer after the Perps deposit it is funding, keeping the swapped pair on its own line, and offer a way back to Perps from it. Swap opens the same drawer unchanged.

- [#21472](https://github.com/LedgerHQ/ledger-live/pull/21472) [`a6ac81b`](https://github.com/LedgerHQ/ledger-live/commit/a6ac81baa35a4a14e1ebe14568d1baaf3293747e) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Close the Perps deposit flow on mobile with a transaction signed screen, from which the user can follow the deposit on the status of the swap that funds it. It replaces the deposit form once the transaction is broadcast, so going back leaves the flow rather than returning to a form that has nothing left to do.

- [#21930](https://github.com/LedgerHQ/ledger-live/pull/21930) [`dc33716`](https://github.com/LedgerHQ/ledger-live/commit/dc3371629ca58f8b17a16ca7ed2e3077c2acb95c) Thanks [@sarneijim](https://github.com/sarneijim)! - Auto-open the Q3 product tour on Portfolio and include the tour variant in analytics

- [#21691](https://github.com/LedgerHQ/ledger-live/pull/21691) [`065f674`](https://github.com/LedgerHQ/ledger-live/commit/065f674214ad3cef32496f107148e2c1618bd5c9) Thanks [@sarneijim](https://github.com/sarneijim)! - Add Q3 Wallet V4 Tour variants q3_b (no Pay) and q3_b2 (Pay without card), selected from releaseTour.params.variant on the same drawer as q3_a.

- [#21029](https://github.com/LedgerHQ/ledger-live/pull/21029) [`2a7ffde`](https://github.com/LedgerHQ/ledger-live/commit/2a7ffde7c4f9c55f1b681f33ff5b9aac4fd714e8) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Add the perps deposit amount form, so a deposit requested by the live app collects its funding account and amount before the review step

- [#21776](https://github.com/LedgerHQ/ledger-live/pull/21776) [`c0ac275`](https://github.com/LedgerHQ/ledger-live/commit/c0ac275b6e39ccb29978d9343b663cba3717999b) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Remove three unused mobile dependencies: `react-native-udp`, which had no imports and was unreachable because `dgram` is disabled in the bundler config yet was still autolinked into both binaries, plus the obsolete `jetifier` and `react-native-debugger-open` dev dependencies and the `DEBUG_RNDEBUGGER` postinstall hook that invoked the latter.

- [#21881](https://github.com/LedgerHQ/ledger-live/pull/21881) [`0a6ec98`](https://github.com/LedgerHQ/ledger-live/commit/0a6ec98c08bbecdd28658af1c13456bc5fa55152) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Remove unused react-native-performance dependency (LIVE-37307)

- [#21683](https://github.com/LedgerHQ/ledger-live/pull/21683) [`8427ffd`](https://github.com/LedgerHQ/ledger-live/commit/8427ffdf83031f0e119680abecf815f8f4f60cf9) Thanks [@semeano](https://github.com/semeano)! - Move selected send-pool balance helper out of live-common into @ledgerhq/live-send

- [#21825](https://github.com/LedgerHQ/ledger-live/pull/21825) [`e31a99e`](https://github.com/LedgerHQ/ledger-live/commit/e31a99e0c1a5449aa1ab8729130e1d123b1ffdad) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add @shared/platform-linking package for cross-platform external link handling with URL safety, localization and analytics

- [#21947](https://github.com/LedgerHQ/ledger-live/pull/21947) [`9d0b721`](https://github.com/LedgerHQ/ledger-live/commit/9d0b721dbfd8b71d32d2d16db22ad8e54f45f541) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the mobile Pay Card transaction detail sheet with tracking and copyable transaction IDs.

- [#21784](https://github.com/LedgerHQ/ledger-live/pull/21784) [`8b04a09`](https://github.com/LedgerHQ/ledger-live/commit/8b04a09d3f9d585e0076037dd5d651697c5764ad) Thanks [@YazhuEth](https://github.com/YazhuEth)! - fix(solana): remove the hardcoded blind signing warning from the transaction summary, the device now warns only when the transaction is actually blind signed

- [#21856](https://github.com/LedgerHQ/ledger-live/pull/21856) [`214ae59`](https://github.com/LedgerHQ/ledger-live/commit/214ae599baedb52907f0105dcac6ed56650cb3f1) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump react-native-splash-screen from 3.2.0 to 3.3.0 (LIVE-37287)

- [#21850](https://github.com/LedgerHQ/ledger-live/pull/21850) [`e1423c3`](https://github.com/LedgerHQ/ledger-live/commit/e1423c3b3b4e6e5c2645401de597b314ce67c3ab) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Upgrade react-native-url-polyfill 1.3.0 → 4.0.0: 65% smaller bundle impact, 2–8× faster URL/URLSearchParams on Hermes, no transitive dependencies

- [#21869](https://github.com/LedgerHQ/ledger-live/pull/21869) [`4c314f4`](https://github.com/LedgerHQ/ledger-live/commit/4c314f4035581de1affaba8419cd062359251c2f) Thanks [@amaslakov](https://github.com/amaslakov)! - Check a PLT recipient against the token's allow and deny lists before signing

  A transfer the lists refuse is rejected on chain after the user has signed and paid the
  fee, so `getTransactionStatus` now resolves the recipient's standing and reports it under
  the recipient field. The token's own state is read first, and a token declaring neither
  list never looks the recipient up. An undecodable state or a failed lookup blocks as
  unverifiable rather than passing as allowed. Adds the English error strings.

- [#21683](https://github.com/LedgerHQ/ledger-live/pull/21683) [`2eb6f5c`](https://github.com/LedgerHQ/ledger-live/commit/2eb6f5c7b3a7694a028bfe62279102188aeac028) Thanks [@semeano](https://github.com/semeano)! - add balance-type pool selection step to Zcash send flow

  The amount step's 25/50/75% selectors now apply to the pool the user picked rather than to the account total, which sums pools the transaction cannot spend from.

  The recipient step's transfer-to-my-other-pool shortcut now records the transfer on the transaction (for Zcash, `selfTransfer`), so the prefilled address keeps its self-transfer semantics instead of looking like a send to a typed address. Picking any other recipient clears it again.

### Patch Changes

- Updated dependencies [[`1995d49`](https://github.com/LedgerHQ/ledger-live/commit/1995d49c63301199aef3e9a079f1d10fd0598f8b), [`8f62cdb`](https://github.com/LedgerHQ/ledger-live/commit/8f62cdbb6d93e207efd7e551af65a41953d28242), [`182fae7`](https://github.com/LedgerHQ/ledger-live/commit/182fae7fbfa81b42de061e67da8edf21a7f72281), [`13e3ebb`](https://github.com/LedgerHQ/ledger-live/commit/13e3ebba3ec7f10dcaf7d960f242f14a9853a191), [`16a454f`](https://github.com/LedgerHQ/ledger-live/commit/16a454fa79be46df6aec3c50ad40407f36dfdea9), [`782b197`](https://github.com/LedgerHQ/ledger-live/commit/782b197bf61a233f5c6ffe7f68e37267f8546e73), [`de19b3e`](https://github.com/LedgerHQ/ledger-live/commit/de19b3e4e56a0c28fcc1a3ca929059e84fc7bebf), [`25224f4`](https://github.com/LedgerHQ/ledger-live/commit/25224f463b834dba7a2811d7150aeec6dbd6a3ac), [`96a1ca9`](https://github.com/LedgerHQ/ledger-live/commit/96a1ca9fef1b0acc8113708c148890054dea143d), [`f7fa8f0`](https://github.com/LedgerHQ/ledger-live/commit/f7fa8f0ff23c03a69933f2d6aa6e0b225af9d542), [`e8fa868`](https://github.com/LedgerHQ/ledger-live/commit/e8fa86874942249a54884353c6c1b070af80d4b1), [`738c0d8`](https://github.com/LedgerHQ/ledger-live/commit/738c0d8a1357e96713bfc0d7a40ca403b5290c35), [`2b976be`](https://github.com/LedgerHQ/ledger-live/commit/2b976be3c7d61accd0911b439263be9d66f50508), [`7cc3e2c`](https://github.com/LedgerHQ/ledger-live/commit/7cc3e2c36608b105956360c1cb1c911c720fd5c9), [`1eb2e00`](https://github.com/LedgerHQ/ledger-live/commit/1eb2e00074fe05f103dd33c3fbf295cfd39e9c2e), [`632dd93`](https://github.com/LedgerHQ/ledger-live/commit/632dd9368616a97581d037f1503b2b16f567c02a), [`036b71d`](https://github.com/LedgerHQ/ledger-live/commit/036b71d678a57c3b1c3156374122fe13bea54f79), [`85e01c4`](https://github.com/LedgerHQ/ledger-live/commit/85e01c449dab75d75851631a56d292f2cb0c5b36), [`799219e`](https://github.com/LedgerHQ/ledger-live/commit/799219e262e80a339272113ea164fa506243b438), [`e37413b`](https://github.com/LedgerHQ/ledger-live/commit/e37413b588873a1a2a028ebf4c1971e4fa92ed2a), [`9e61582`](https://github.com/LedgerHQ/ledger-live/commit/9e61582edfcbb98046d0f74111ccf4061ec44bb3), [`e3535da`](https://github.com/LedgerHQ/ledger-live/commit/e3535da7e5c884f8ada75eff52c0c4538142fffb), [`05cb97c`](https://github.com/LedgerHQ/ledger-live/commit/05cb97c6986755d87d4c0b3df3d8b4daf9ba77df), [`251af57`](https://github.com/LedgerHQ/ledger-live/commit/251af57e7412e493deaecddf627e3967ba044c09), [`b30f903`](https://github.com/LedgerHQ/ledger-live/commit/b30f903f592c0bafba74a1784d98b9d605c18ccb), [`5b60a96`](https://github.com/LedgerHQ/ledger-live/commit/5b60a968d3292b3897380f2c74c472a51b81e35d), [`da3d09d`](https://github.com/LedgerHQ/ledger-live/commit/da3d09d75d7dcae659611cd371c48d75c03f7ae4), [`cdb273b`](https://github.com/LedgerHQ/ledger-live/commit/cdb273b068df78cd5a0dbd4281fb79f22e0a7506), [`54fce77`](https://github.com/LedgerHQ/ledger-live/commit/54fce77bfa46c3d42d3e39b80804258a91d910f2), [`ee1b919`](https://github.com/LedgerHQ/ledger-live/commit/ee1b9192421545035fb547f27319d7f816d85fe8), [`9e37f58`](https://github.com/LedgerHQ/ledger-live/commit/9e37f58a84f7ee9585142c0a8ac767da58b6d06f), [`7e44af4`](https://github.com/LedgerHQ/ledger-live/commit/7e44af495eccab1fac4b0808d6729a595b610c69), [`600d432`](https://github.com/LedgerHQ/ledger-live/commit/600d432657f1c9adf80af6730dd28f2177e05c5a), [`7050652`](https://github.com/LedgerHQ/ledger-live/commit/70506520dafbccca4e014ac30d75647a5b7fe7d0), [`bb2f03e`](https://github.com/LedgerHQ/ledger-live/commit/bb2f03e41b96b8f95f239acea75428657cdd64fe), [`dc204a7`](https://github.com/LedgerHQ/ledger-live/commit/dc204a7633e6f7c9acb66fbb18a6aeaa2e75c4bb), [`73eb9bc`](https://github.com/LedgerHQ/ledger-live/commit/73eb9bc68ed87f07142a1fdf54e4cd68af3a36d4), [`903c180`](https://github.com/LedgerHQ/ledger-live/commit/903c1802ea5d4cc3fe1bfe5609b8cf3871152cf0), [`cef83ae`](https://github.com/LedgerHQ/ledger-live/commit/cef83ae58ffc5529bebda292737502e78e3b7522), [`3f34609`](https://github.com/LedgerHQ/ledger-live/commit/3f34609edecc5ae85a9a9ac1b76ab47e30a9c66e), [`a6a7a94`](https://github.com/LedgerHQ/ledger-live/commit/a6a7a946b1c1dbdda1cfa2c049f536f7235ddde2), [`c6f7bfe`](https://github.com/LedgerHQ/ledger-live/commit/c6f7bfead8593c148fe6e3d177ff8dd734728f5a), [`0e1e102`](https://github.com/LedgerHQ/ledger-live/commit/0e1e10227aa5cc0d19e8a142533c54838e3ed57e), [`34f8541`](https://github.com/LedgerHQ/ledger-live/commit/34f8541ae58847dcee784b3fe97f227edd644775), [`fcc2ac4`](https://github.com/LedgerHQ/ledger-live/commit/fcc2ac4c5ed270fb63df4c0079068ad6dac94612), [`eddc89e`](https://github.com/LedgerHQ/ledger-live/commit/eddc89e7b86a13aeedfc0ae4956c2dcd08494e5f), [`b976cda`](https://github.com/LedgerHQ/ledger-live/commit/b976cda52320ef3f778fc11b4f95d2c5bf54ffe0), [`e7d79ac`](https://github.com/LedgerHQ/ledger-live/commit/e7d79acf1d91e98e2813755f9bebdbfd83e89f39), [`c5229d1`](https://github.com/LedgerHQ/ledger-live/commit/c5229d1b2bbf8d8067e036f0a34dda403519e206), [`37f5759`](https://github.com/LedgerHQ/ledger-live/commit/37f57595f11d40562914794645cb3c7f6e55dc8b), [`a2a0288`](https://github.com/LedgerHQ/ledger-live/commit/a2a028844dbfbfa019f1f971bf6fdbed9005b9ec), [`8b3320d`](https://github.com/LedgerHQ/ledger-live/commit/8b3320d7aab0ff25eeb8930dafa536fb94962c79), [`e65a6b3`](https://github.com/LedgerHQ/ledger-live/commit/e65a6b3e67e271343b7029613498176b1da2d7d2), [`4ac2794`](https://github.com/LedgerHQ/ledger-live/commit/4ac2794b8244b094f2e91563bb7ad8a220d6cba5), [`2edc7c8`](https://github.com/LedgerHQ/ledger-live/commit/2edc7c8d47b1ac8b49194155be8f8b3722574d39), [`0f4b55e`](https://github.com/LedgerHQ/ledger-live/commit/0f4b55e46459492e880a8e5e118b570a934ce4d7), [`c88b5c6`](https://github.com/LedgerHQ/ledger-live/commit/c88b5c65b0488097e2a17071ca04ac06ae41763a), [`5ddb9ab`](https://github.com/LedgerHQ/ledger-live/commit/5ddb9ab2874a6715d706042701e8b2242b1c14b9), [`6c1be58`](https://github.com/LedgerHQ/ledger-live/commit/6c1be58b4dbcce00cc114442d2aeb76278248d99), [`8427ffd`](https://github.com/LedgerHQ/ledger-live/commit/8427ffdf83031f0e119680abecf815f8f4f60cf9), [`e31a99e`](https://github.com/LedgerHQ/ledger-live/commit/e31a99e0c1a5449aa1ab8729130e1d123b1ffdad), [`9d0b721`](https://github.com/LedgerHQ/ledger-live/commit/9d0b721dbfd8b71d32d2d16db22ad8e54f45f541), [`d353658`](https://github.com/LedgerHQ/ledger-live/commit/d353658a0254e49a369ca7481c9680254e9e4851), [`b49d5b5`](https://github.com/LedgerHQ/ledger-live/commit/b49d5b573e84bd63ac460ae398657f1035613141), [`4c314f4`](https://github.com/LedgerHQ/ledger-live/commit/4c314f4035581de1affaba8419cd062359251c2f)]:
  - @features/flow-pay-card@0.4.0
  - @domain/api-card-management@0.6.0
  - @features/flow-pay-card-auth@0.7.0
  - @features/flow-contacts-list@0.7.0
  - @features/platform-contacts@0.7.0
  - @features/flow-contacts-introduction@1.2.0
  - @shared/ui-queued-bottom-sheet@0.4.0
  - @features/flow-contacts-add-address@0.5.0
  - @shared/feature-flags@0.23.0
  - @ledgerhq/coin-concordium@1.3.0
  - @features/flow-app-lock@0.4.0
  - @features/flow-large-screen-upsell@2.1.0
  - @features/flow-contacts@0.11.0
  - @features/flow-contacts-add-contact@0.6.0
  - @ledgerhq/types-live@6.124.0
  - @features/platform-feature-flags@0.7.0
  - @devtools/bindings@0.8.0
  - @ledgerhq/icons-ui@0.21.0
  - @ledgerhq/native-ui@0.67.0
  - @domain/entity-contact@0.9.0
  - @ledgerhq/live-dmk-speculos@0.11.0
  - @shared/env@0.7.0
  - @ledgerhq/ledger-key-ring-protocol@0.22.0
  - @ledgerhq/coin-cosmos@1.3.0
  - @ledgerhq/live-countervalues@0.26.0
  - @ledgerhq/live-countervalues-react@0.18.0
  - @features/flow-pay-card-widget@0.3.0
  - @features/flow-pay-request@0.5.0
  - @features/flow-pay-contact@0.4.0
  - @features/flow-pay-deposit@0.4.0
  - @ledgerhq/ledger-wallet-framework@3.4.0
  - @ledgerhq/live-send@0.1.0
  - @shared/platform-linking@0.2.0
  - @features/flow-contacts-edit-contact@0.5.0
  - @features/flow-lazy-onboarding-banner@0.4.0
  - @features/platform-card@0.5.0
  - @features/platform-style@0.4.0
  - @features/flow-contacts-delete-contact@0.2.2
  - @features/flow-contacts-edit-address@0.3.1
  - @features/flow-pay-balance@0.4.2
  - @features/flow-pay-bank-transfer@0.3.1
  - @features/flow-pay-feature-tour@0.5.1
  - @features/platform-device-action-content@0.2.1
  - @shared/ui-info-state@0.2.2
  - @features/platform-currencies@0.8.1
  - @ledgerhq/coin-bitcoin@0.52.1
  - @ledgerhq/coin-canton@1.1.2
  - @ledgerhq/coin-casper@3.3.1
  - @ledgerhq/coin-filecoin@2.1.2
  - @ledgerhq/coin-multiversx@1.1.2
  - @ledgerhq/coin-stacks@0.30.2
  - @ledgerhq/device-core@0.11.16
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
  - @ledgerhq/live-dmk-mobile@0.29.8
  - @shared/api-services@0.7.0
  - @shared/auth@0.6.0
  - @shared/cloud-sync@0.3.0
  - @shared/i18n@0.2.0
  - @shared/password-verifier@0.3.0
  - @devtools/shell@0.9.3

## 4.21.0-next.2

### Minor Changes

- [#22270](https://github.com/LedgerHQ/ledger-live/pull/22270) [`354486c`](https://github.com/LedgerHQ/ledger-live/commit/354486ca79badb49b9c902b1724a36379c278358) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Support Cardano firmware app v8.0.8 by bumping @cardano-foundation/ledgerjs-hw-app-cardano from 7.x to 8.0.0. The v7 host binding used an older APDU protocol incompatible with the rewritten v8 device app, breaking account scan, receive and signing flows on firmware 8.0.x. Also raise the Cardano nano app minVersion to 8.0.8 so users on an incompatible older app are prompted to update instead of hitting broken flows.

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/live-send@0.1.0-next.1

## 4.21.0-next.1

### Patch Changes

- Updated dependencies [[`7cc3e2c`](https://github.com/LedgerHQ/ledger-live/commit/7cc3e2c36608b105956360c1cb1c911c720fd5c9)]:
  - @features/flow-large-screen-upsell@2.1.0-next.1

## 4.21.0-next.0

### Minor Changes

- [#21662](https://github.com/LedgerHQ/ledger-live/pull/21662) [`9164e8b`](https://github.com/LedgerHQ/ledger-live/commit/9164e8b81ecb84e5d8ba0bb606981c2dc83d04c1) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add freeze/unfreeze confirmation dialog and bottom sheet for pay card

- [#21928](https://github.com/LedgerHQ/ledger-live/pull/21928) [`1995d49`](https://github.com/LedgerHQ/ledger-live/commit/1995d49c63301199aef3e9a079f1d10fd0598f8b) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Render the card transaction history on mobile, inside the card details sheet overview

- [#21707](https://github.com/LedgerHQ/ledger-live/pull/21707) [`8f62cdb`](https://github.com/LedgerHQ/ledger-live/commit/8f62cdbb6d93e207efd7e551af65a41953d28242) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add View/Hide and a 3D flip for card numbers.

- [#21722](https://github.com/LedgerHQ/ledger-live/pull/21722) [`182fae7`](https://github.com/LedgerHQ/ledger-live/commit/182fae7fbfa81b42de061e67da8edf21a7f72281) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add a Card Details container with native artwork, Details sheet, and web composition

- [#21754](https://github.com/LedgerHQ/ledger-live/pull/21754) [`ba31ece`](https://github.com/LedgerHQ/ledger-live/commit/ba31ece3a22febeafbec027840d16ea82c2dad5e) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Render the native card details overview, freeze confirmation and More menu as scenes inside a single bottom sheet

- [#21584](https://github.com/LedgerHQ/ledger-live/pull/21584) [`13e3ebb`](https://github.com/LedgerHQ/ledger-live/commit/13e3ebba3ec7f10dcaf7d960f242f14a9853a191) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix the Contacts alphabetical index on Mobile not scrolling the list to the tapped or dragged letter. The index container now owns the gesture so touch coordinates resolve against it instead of against the tapped letter, which always resolved to the first section, and it keeps the responder instead of losing it to the list underneath on the first drag move. The list supplies `getItemLayout`, so `scrollToLocation` reaches sections below the render window instead of silently giving up on a long contact list. Dragging jumps without animating so a scrub no longer queues one cancelled scroll animation per letter.

- [#21665](https://github.com/LedgerHQ/ledger-live/pull/21665) [`16a454f`](https://github.com/LedgerHQ/ledger-live/commit/16a454fa79be46df6aec3c50ad40407f36dfdea9) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Fix saving a contact address on EVM networks that ship their own coin app, such as Sei, Sonic and Ethereum Classic. The device app to open is now derived from the network family rather than from the network's own `managerAppName`, so EVM networks with an EIP-155 chain ID register through the Ethereum app and are told apart by that chain ID, which is what the Contacts device kit expects. These networks are selectable again, reversing the restriction added in LIVE-36688.

  Address-book eligibility now lives in a single place: `isEligibleAddressCurrency` moves from `@ledgerhq/live-common` to `@features/platform-contacts`, where it checks device capability alongside the network family. The send flow and the Contacts network picker previously answered this question separately, which is how an entry point could be offered for a network the device would refuse.

- [#21855](https://github.com/LedgerHQ/ledger-live/pull/21855) [`24d1ff6`](https://github.com/LedgerHQ/ledger-live/commit/24d1ff67f1aea695dfcae2303f8a780feb985964) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Prevent saving duplicate addresses across contacts — show "This address is already used by [Contact Name]." when adding or editing an address that is already saved in another contact

- [#21681](https://github.com/LedgerHQ/ledger-live/pull/21681) [`de19b3e`](https://github.com/LedgerHQ/ledger-live/commit/de19b3e4e56a0c28fcc1a3ca929059e84fc7bebf) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add freeze/unfreeze confirmation error handling with retry

- [#21698](https://github.com/LedgerHQ/ledger-live/pull/21698) [`25224f4`](https://github.com/LedgerHQ/ledger-live/commit/25224f463b834dba7a2811d7150aeec6dbd6a3ac) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Move the More menu into card details and put freeze and More on one actions row

- [#21706](https://github.com/LedgerHQ/ledger-live/pull/21706) [`96a1ca9`](https://github.com/LedgerHQ/ledger-live/commit/96a1ca9fef1b0acc8113708c148890054dea143d) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add excludedCurrencyIds param to lwdContacts and lwmContacts feature flags to exclude specific currencies from Contacts

- [#21777](https://github.com/LedgerHQ/ledger-live/pull/21777) [`f7fa8f0`](https://github.com/LedgerHQ/ledger-live/commit/f7fa8f0ff23c03a69933f2d6aa6e0b225af9d542) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Resolve a single Pay Card display state so the card face, onboarding widget and login CTA no longer overlap, and hold them back until the stored session is read

- [#21931](https://github.com/LedgerHQ/ledger-live/pull/21931) [`e8fa868`](https://github.com/LedgerHQ/ledger-live/commit/e8fa86874942249a54884353c6c1b070af80d4b1) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add privacy policy disclaimer link to contacts add address flow on desktop and mobile

- [#21716](https://github.com/LedgerHQ/ledger-live/pull/21716) [`641fdb7`](https://github.com/LedgerHQ/ledger-live/commit/641fdb7b392aff50d4bfa206e2435f75cb610227) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Let the mobile Ledger Sync e2e suites run against the PROD trustchain during a release validation. The environment now reaches the app as a Detox launch arg, which the e2e bridge applies before the app tree mounts — the only point where the trustchain SDK singleton can still be pinned — so it no longer has to be refused outright.

- [#21961](https://github.com/LedgerHQ/ledger-live/pull/21961) [`2b976be`](https://github.com/LedgerHQ/ledger-live/commit/2b976be3c7d61accd0911b439263be9d66f50508) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Let someone remove their app lock password, behind `lwmPasswordRevamp`.

  Turning the switch off used to reach the legacy removal screen, which reads the default keychain item and compares plaintext. A revamped password lives under its own service as a verifier, so that screen could never succeed — and its `if (credentials)` guard skipped the comparison entirely when it found nothing, clearing legacy state without ever checking the password.

  The new screen derives with the parameters stored in the verifier rather than today's defaults, compares in constant time, and destroys the verifier before flipping the protection state. A wrong password and a keychain that will not answer are reported differently, since a single boolean forced one to be shown as the other.

  The screens also stop taking their strings as a `labels` object built by the app: each one now calls `useTranslation` from `@shared/i18n` where it renders, as the `pay-*` flows already do. That removes the `*Labels` types and the per-screen `useMemo` that rebuilt them, and turns the failure props into booleans so the state stays in the view model while the message lives in the view.

- [#21957](https://github.com/LedgerHQ/ledger-live/pull/21957) [`ba09b32`](https://github.com/LedgerHQ/ledger-live/commit/ba09b327c19394d13c1494c66a71f3ded36fd182) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Derive the Settings password switch from the stored protection state instead of flipping it on tap, behind `lwmPasswordRevamp`.

  The legacy row moved its own local state as soon as the switch was touched, so cancelling the add or the removal flow left the switch disagreeing with reality until the screen regained focus. The revamped row reads `hasPassword` and lets the flow decide.

  This is also what makes setting a password visible: the verifier already landed, but nothing in Settings reflected it.

- [#21860](https://github.com/LedgerHQ/ledger-live/pull/21860) [`6dfb512`](https://github.com/LedgerHQ/ledger-live/commit/6dfb512e7bd2d1f78203594ee167e60d77a81443) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Replace react-native-haptic-feedback with expo-haptics, already present as a Lumen peer

- [#21685](https://github.com/LedgerHQ/ledger-live/pull/21685) [`e0f0e6c`](https://github.com/LedgerHQ/ledger-live/commit/e0f0e6cc170b55472b528a969950caa05ae0a618) Thanks [@amaslakov](https://github.com/amaslakov)! - Add the error message shown when the protocol refuses a Tezos stake amount as too small

- [#21859](https://github.com/LedgerHQ/ledger-live/pull/21859) [`9ec3490`](https://github.com/LedgerHQ/ledger-live/commit/9ec34909c3110e1e1c62f47cd6d97d5eefaa8202) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump react-native-restart from 0.0.24 to 0.0.29 and migrate to the non-deprecated `restart()` API (LIVE-37285)

- [#21815](https://github.com/LedgerHQ/ledger-live/pull/21815) [`06b7fd3`](https://github.com/LedgerHQ/ledger-live/commit/06b7fd310ad9bc9200352ef5debf9dd2d5fb7a77) Thanks [@zel-kass](https://github.com/zel-kass)! - Fold Lumen visualization into lumen-ui-react and lumen-ui-rnative

- [#21651](https://github.com/LedgerHQ/ledger-live/pull/21651) [`632dd93`](https://github.com/LedgerHQ/ledger-live/commit/632dd9368616a97581d037f1503b2b16f567c02a) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Align Contacts analytics events and properties with the tracking plan on desktop and mobile.

- [#21921](https://github.com/LedgerHQ/ledger-live/pull/21921) [`036b71d`](https://github.com/LedgerHQ/ledger-live/commit/036b71d678a57c3b1c3156374122fe13bea54f79) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Align the add-contact confirmation CTA with "Add contact" on mobile and desktop

- [#21576](https://github.com/LedgerHQ/ledger-live/pull/21576) [`12b5956`](https://github.com/LedgerHQ/ledger-live/commit/12b59564abef3021e2e75cec9727e603e1d133c2) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Show the Pay contact success screen after a Pay send.

- [#21691](https://github.com/LedgerHQ/ledger-live/pull/21691) [`a091234`](https://github.com/LedgerHQ/ledger-live/commit/a0912345b11a06da31086d2923cd47525a94610c) Thanks [@sarneijim](https://github.com/sarneijim)! - Add the Q3 Wallet V4 Tour drawer carousel on mobile, gated by releaseTour Q3 variants (q3_a, q3_b, q3_b2), without Portfolio auto-open. The carousel now lives in a shared WalletV4TourDrawer component that both the Q2 and Q3 tours configure.

- [#21656](https://github.com/LedgerHQ/ledger-live/pull/21656) [`85e01c4`](https://github.com/LedgerHQ/ledger-live/commit/85e01c449dab75d75851631a56d292f2cb0c5b36) Thanks [@sarneijim](https://github.com/sarneijim)! - Add the Q3 Wallet V4 Tour feature flag, persisted seen state, mobile debug setup, and Segment wallet40Attributes.q3Tour

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

- [#21595](https://github.com/LedgerHQ/ledger-live/pull/21595) [`a18539e`](https://github.com/LedgerHQ/ledger-live/commit/a18539e885fdfe379c77623a448256fb4602b6c0) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Read the sub-account id from the screen in `navigateToSubAccount` instead of rebuilding it. Rebuilding meant hardcoding one of the two id formats in the wild: an account synced before the generic coin framework keeps the format it was stored under, a newer one gets `encodeTokenAccountId`. The helper now opens the sub-account from the flat accounts list and returns the id the app gave it, with an identity assertion that does not depend on the id it just read.

  `navigateToTokenInAccount` expands the token list when the "see more" button is present. The list shows three tokens while collapsed, so a fourth one was never on screen to scroll to. Adds a `testID` to that button in `SubAccountsList`.

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

- [#21726](https://github.com/LedgerHQ/ledger-live/pull/21726) [`bc5aa43`](https://github.com/LedgerHQ/ledger-live/commit/bc5aa43e2abc011e2ce8d9f4817ed09aaeac1195) Thanks [@alexstapenka-ledger](https://github.com/alexstapenka-ledger)! - Forward llmWalletApiDeviceIntentSignEnabled to the Earn live-app on mobile

- [#21633](https://github.com/LedgerHQ/ledger-live/pull/21633) [`60655cd`](https://github.com/LedgerHQ/ledger-live/commit/60655cdf828eebdddd515d52c8fc5876ea50baf8) Thanks [@qperrot](https://github.com/qperrot)! - Add memo on xrp operation details

- [#22022](https://github.com/LedgerHQ/ledger-live/pull/22022) [`2aa4581`](https://github.com/LedgerHQ/ledger-live/commit/2aa45814f2c4eacfb47fc79fdaf336e42087366a) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Bump lumen-ui-react to 0.1.58, lumen-ui-rnative to 0.1.61, crypto-icons to 2.0.6; migrate TransactionalIcon to getDotIconProps

- [#21887](https://github.com/LedgerHQ/ledger-live/pull/21887) [`a62261e`](https://github.com/LedgerHQ/ledger-live/commit/a62261e2e63218affcd3690a70b5a42f355a48a4) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Tell the user a currency is unavailable in their region instead of showing a generic balance error, and bump coin-module-framework to 9.1.0 for the typed checkRegionRestriction flag

- [#21751](https://github.com/LedgerHQ/ledger-live/pull/21751) [`dc204a7`](https://github.com/LedgerHQ/ledger-live/commit/dc204a7633e6f7c9acb66fbb18a6aeaa2e75c4bb) Thanks [@sarneijim](https://github.com/sarneijim)! - Add releaseTour and gate Q2/Q3 tours with it, dropping q2Tour/q3Tour from Wallet 4.0

- [#21857](https://github.com/LedgerHQ/ledger-live/pull/21857) [`32a8351`](https://github.com/LedgerHQ/ledger-live/commit/32a83510ee567f3f44d07638a33e6ba1ea632d48) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump react-native-tcp-socket from 6.0.6 to 6.4.2 (LIVE-37286)

- [#21966](https://github.com/LedgerHQ/ledger-live/pull/21966) [`38b7dab`](https://github.com/LedgerHQ/ledger-live/commit/38b7dab3436b2e72b4e8642f6c6b0fd9118475bc) Thanks [@sarneijim](https://github.com/sarneijim)! - Move Q2/Q3 debug tours into Features & Flows

- [#21195](https://github.com/LedgerHQ/ledger-live/pull/21195) [`cef83ae`](https://github.com/LedgerHQ/ledger-live/commit/cef83ae58ffc5529bebda292737502e78e3b7522) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Add Card session and MSW renewal controls to the Card / Pay DevTool.

- [#21688](https://github.com/LedgerHQ/ledger-live/pull/21688) [`5cd48fc`](https://github.com/LedgerHQ/ledger-live/commit/5cd48fc06a19cc2e0c0a732ac212fd4cd92869e8) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Close the contacts add address drawer before the device intent executor runs

- [#22021](https://github.com/LedgerHQ/ledger-live/pull/22021) [`8dc8e99`](https://github.com/LedgerHQ/ledger-live/commit/8dc8e99e069baafdbde2dfa66b3cc06878012533) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - feat(pay-card): set the seven Baanx configuration values per environment

- [#21663](https://github.com/LedgerHQ/ledger-live/pull/21663) [`c6f7bfe`](https://github.com/LedgerHQ/ledger-live/commit/c6f7bfead8593c148fe6e3d177ff8dd734728f5a) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Mark a frozen pay card on the card visual: the card face fades out behind a centered snow `Spot`, read from the same card status the freeze tile uses. The features/flow jest projects now compile `@ledgerhq/lumen-utils-shared` instead of leaving its ESM untransformed, so views can use `cn`.

- [#21792](https://github.com/LedgerHQ/ledger-live/pull/21792) [`0e1e102`](https://github.com/LedgerHQ/ledger-live/commit/0e1e10227aa5cc0d19e8a142533c54838e3ed57e) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - The desktop Pay tab centres the Card login block, and it offers a login link to a card holder who
  has a card already. The login reads every error message from the copy keys.

- [#21915](https://github.com/LedgerHQ/ledger-live/pull/21915) [`34f8541`](https://github.com/LedgerHQ/ledger-live/commit/34f8541ae58847dcee784b3fe97f227edd644775) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - fix(pay-card): save the Card login intro flag after a redirect login, and give the desktop login block a title before the intro

- [#21916](https://github.com/LedgerHQ/ledger-live/pull/21916) [`8c393ed`](https://github.com/LedgerHQ/ledger-live/commit/8c393ed10e61da587716269bf0dc7324e89bef4b) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - The Card login intro sheet now opens at full height instead of the height of its content.

- [#21918](https://github.com/LedgerHQ/ledger-live/pull/21918) [`fcc2ac4`](https://github.com/LedgerHQ/ledger-live/commit/fcc2ac4c5ed270fb63df4c0079068ad6dac94612) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Sign a mock Card session in and out from the Pay Card DevTool, and answer the Card endpoints from the desktop MSW worker, so the Card surfaces can be reached without the hosted login.

- [#21626](https://github.com/LedgerHQ/ledger-live/pull/21626) [`eddc89e`](https://github.com/LedgerHQ/ledger-live/commit/eddc89e7b86a13aeedfc0ae4956c2dcd08494e5f) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Show and drive the derived card onboarding status from the Card / Pay devtool.

  - A "Card onboarding" screen: a `Stepper` for the count, every step by the id the app keys it on, and the derived answer printed raw so a step can be traced to the response behind it.
  - Each step a request decides carries a toggle. It sets what that endpoint answers, so the step follows on the next read and holds until it is cleared. The phone wallet step is answered on the device; the purchase step is read-only while nothing answers it.
  - An endpoint answers from the provider until its toggle is used, so one step can be held while the rest stay real, and "Use the real answers" hands them all back.
  - `@domain/api-card-management/mock/card-onboarding-status` holds those answers and the responses that carry them; the mobile MSW handlers read it before falling back to what they answered before.
  - Mocking is started by an env var, so without it the screen says so instead of offering a toggle that would set an answer nothing reads.
  - The hook gains `refresh`, which re-asks all three sources: the screen asks on open and on demand.

- [#21872](https://github.com/LedgerHQ/ledger-live/pull/21872) [`37f5759`](https://github.com/LedgerHQ/ledger-live/commit/37f57595f11d40562914794645cb3c7f6e55dc8b) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Read the card transactions and give each one its spend category.

  - `useCardTransactionsViewModel` reads the first page of `GET /v1/card/transactions` while a session is live, and hands each transaction its category and that category's translated label.
  - `mccCategory` is now the closed set the provider documents (`PayCardTransactionCategory`), and a grouping it never named reads as `MISC` so one new label cannot fail a whole page.
  - `mockPayCardTransactions` answers a page covering every category, served by the desktop and mobile MSW workers on `GET /v1/card/transactions`.

- [#21917](https://github.com/LedgerHQ/ledger-live/pull/21917) [`a2a0288`](https://github.com/LedgerHQ/ledger-live/commit/a2a028844dbfbfa019f1f971bf6fdbed9005b9ec) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Show card transactions on the Pay Card panel as a list of items, with a subheader when the list is not empty.

- [#21637](https://github.com/LedgerHQ/ledger-live/pull/21637) [`cbf1f54`](https://github.com/LedgerHQ/ledger-live/commit/cbf1f54cb06de374474ed0d2bac7cb155bc935ef) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Open the Pay contact success screen from the Pay Card DevTool

- [#21710](https://github.com/LedgerHQ/ledger-live/pull/21710) [`4ac2794`](https://github.com/LedgerHQ/ledger-live/commit/4ac2794b8244b094f2e91563bb7ad8a220d6cba5) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Align request-receive with Figma. Mobile Share sends the rounded card PNG plus the address as text. Desktop Save writes one PNG.

- [#21668](https://github.com/LedgerHQ/ledger-live/pull/21668) [`2edc7c8`](https://github.com/LedgerHQ/ledger-live/commit/2edc7c8d47b1ac8b49194155be8f8b3722574d39) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Keep the Pay Request receive QR scannable in light on mobile (white card, black modules) and use base color for Pay tab contact names (LIVE-37096).

- [#21824](https://github.com/LedgerHQ/ledger-live/pull/21824) [`c88b5c6`](https://github.com/LedgerHQ/ledger-live/commit/c88b5c65b0488097e2a17071ca04ac06ae41763a) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Scroll the whole Pay tab: the content no longer gets clipped and clears the tab bar

- [#21937](https://github.com/LedgerHQ/ledger-live/pull/21937) [`cd32aad`](https://github.com/LedgerHQ/ledger-live/commit/cd32aad899bf91b1843cdbc3e839bbfcdb0f443b) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Explain on a Hyperliquid account that transactions are not supported and offer a way to open Perps

- [#21031](https://github.com/LedgerHQ/ledger-live/pull/21031) [`b8a768a`](https://github.com/LedgerHQ/ledger-live/commit/b8a768a0205d337f0b626df91d55b9477453415a) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Add the Perps deposit review step on mobile, reached from the deposit form, showing the swap and deposit details before the user confirms. The amount landing on the perps account now comes from a provider quote, since that balance has no counter value of its own.

- [#21457](https://github.com/LedgerHQ/ledger-live/pull/21457) [`7ca6525`](https://github.com/LedgerHQ/ledger-live/commit/7ca6525507fd7546037009a0a69ee830676a2748) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Add the Perps deposit signing step on mobile, as a bottom sheet on the deposit screen that the review hands over to. It runs on the shared `executeSwap` orchestration behind the perps screens, and executes against the quote the review priced against. Declining a device prompt returns to the review with the entered amount intact, rather than raising an error screen.

- [#21473](https://github.com/LedgerHQ/ledger-live/pull/21473) [`1fd8973`](https://github.com/LedgerHQ/ledger-live/commit/1fd897384bd98c9bcb8010f367d2874949c19512) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Name the transaction detail drawer after the Perps deposit it is funding, keeping the swapped pair on its own line, and offer a way back to Perps from it. Swap opens the same drawer unchanged.

- [#21472](https://github.com/LedgerHQ/ledger-live/pull/21472) [`a6ac81b`](https://github.com/LedgerHQ/ledger-live/commit/a6ac81baa35a4a14e1ebe14568d1baaf3293747e) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Close the Perps deposit flow on mobile with a transaction signed screen, from which the user can follow the deposit on the status of the swap that funds it. It replaces the deposit form once the transaction is broadcast, so going back leaves the flow rather than returning to a form that has nothing left to do.

- [#21930](https://github.com/LedgerHQ/ledger-live/pull/21930) [`dc33716`](https://github.com/LedgerHQ/ledger-live/commit/dc3371629ca58f8b17a16ca7ed2e3077c2acb95c) Thanks [@sarneijim](https://github.com/sarneijim)! - Auto-open the Q3 product tour on Portfolio and include the tour variant in analytics

- [#21691](https://github.com/LedgerHQ/ledger-live/pull/21691) [`065f674`](https://github.com/LedgerHQ/ledger-live/commit/065f674214ad3cef32496f107148e2c1618bd5c9) Thanks [@sarneijim](https://github.com/sarneijim)! - Add Q3 Wallet V4 Tour variants q3_b (no Pay) and q3_b2 (Pay without card), selected from releaseTour.params.variant on the same drawer as q3_a.

- [#21029](https://github.com/LedgerHQ/ledger-live/pull/21029) [`2a7ffde`](https://github.com/LedgerHQ/ledger-live/commit/2a7ffde7c4f9c55f1b681f33ff5b9aac4fd714e8) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Add the perps deposit amount form, so a deposit requested by the live app collects its funding account and amount before the review step

- [#21776](https://github.com/LedgerHQ/ledger-live/pull/21776) [`c0ac275`](https://github.com/LedgerHQ/ledger-live/commit/c0ac275b6e39ccb29978d9343b663cba3717999b) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Remove three unused mobile dependencies: `react-native-udp`, which had no imports and was unreachable because `dgram` is disabled in the bundler config yet was still autolinked into both binaries, plus the obsolete `jetifier` and `react-native-debugger-open` dev dependencies and the `DEBUG_RNDEBUGGER` postinstall hook that invoked the latter.

- [#21881](https://github.com/LedgerHQ/ledger-live/pull/21881) [`0a6ec98`](https://github.com/LedgerHQ/ledger-live/commit/0a6ec98c08bbecdd28658af1c13456bc5fa55152) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Remove unused react-native-performance dependency (LIVE-37307)

- [#21683](https://github.com/LedgerHQ/ledger-live/pull/21683) [`8427ffd`](https://github.com/LedgerHQ/ledger-live/commit/8427ffdf83031f0e119680abecf815f8f4f60cf9) Thanks [@semeano](https://github.com/semeano)! - Move selected send-pool balance helper out of live-common into @ledgerhq/live-send

- [#21825](https://github.com/LedgerHQ/ledger-live/pull/21825) [`e31a99e`](https://github.com/LedgerHQ/ledger-live/commit/e31a99e0c1a5449aa1ab8729130e1d123b1ffdad) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add @shared/platform-linking package for cross-platform external link handling with URL safety, localization and analytics

- [#21947](https://github.com/LedgerHQ/ledger-live/pull/21947) [`9d0b721`](https://github.com/LedgerHQ/ledger-live/commit/9d0b721dbfd8b71d32d2d16db22ad8e54f45f541) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add the mobile Pay Card transaction detail sheet with tracking and copyable transaction IDs.

- [#21784](https://github.com/LedgerHQ/ledger-live/pull/21784) [`8b04a09`](https://github.com/LedgerHQ/ledger-live/commit/8b04a09d3f9d585e0076037dd5d651697c5764ad) Thanks [@YazhuEth](https://github.com/YazhuEth)! - fix(solana): remove the hardcoded blind signing warning from the transaction summary, the device now warns only when the transaction is actually blind signed

- [#21856](https://github.com/LedgerHQ/ledger-live/pull/21856) [`214ae59`](https://github.com/LedgerHQ/ledger-live/commit/214ae599baedb52907f0105dcac6ed56650cb3f1) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump react-native-splash-screen from 3.2.0 to 3.3.0 (LIVE-37287)

- [#21850](https://github.com/LedgerHQ/ledger-live/pull/21850) [`e1423c3`](https://github.com/LedgerHQ/ledger-live/commit/e1423c3b3b4e6e5c2645401de597b314ce67c3ab) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Upgrade react-native-url-polyfill 1.3.0 → 4.0.0: 65% smaller bundle impact, 2–8× faster URL/URLSearchParams on Hermes, no transitive dependencies

- [#21869](https://github.com/LedgerHQ/ledger-live/pull/21869) [`4c314f4`](https://github.com/LedgerHQ/ledger-live/commit/4c314f4035581de1affaba8419cd062359251c2f) Thanks [@amaslakov](https://github.com/amaslakov)! - Check a PLT recipient against the token's allow and deny lists before signing

  A transfer the lists refuse is rejected on chain after the user has signed and paid the
  fee, so `getTransactionStatus` now resolves the recipient's standing and reports it under
  the recipient field. The token's own state is read first, and a token declaring neither
  list never looks the recipient up. An undecodable state or a failed lookup blocks as
  unverifiable rather than passing as allowed. Adds the English error strings.

- [#21683](https://github.com/LedgerHQ/ledger-live/pull/21683) [`2eb6f5c`](https://github.com/LedgerHQ/ledger-live/commit/2eb6f5c7b3a7694a028bfe62279102188aeac028) Thanks [@semeano](https://github.com/semeano)! - add balance-type pool selection step to Zcash send flow

  The amount step's 25/50/75% selectors now apply to the pool the user picked rather than to the account total, which sums pools the transaction cannot spend from.

  The recipient step's transfer-to-my-other-pool shortcut now records the transfer on the transaction (for Zcash, `selfTransfer`), so the prefilled address keeps its self-transfer semantics instead of looking like a send to a typed address. Picking any other recipient clears it again.

### Patch Changes

- Updated dependencies [[`1995d49`](https://github.com/LedgerHQ/ledger-live/commit/1995d49c63301199aef3e9a079f1d10fd0598f8b), [`8f62cdb`](https://github.com/LedgerHQ/ledger-live/commit/8f62cdbb6d93e207efd7e551af65a41953d28242), [`182fae7`](https://github.com/LedgerHQ/ledger-live/commit/182fae7fbfa81b42de061e67da8edf21a7f72281), [`13e3ebb`](https://github.com/LedgerHQ/ledger-live/commit/13e3ebba3ec7f10dcaf7d960f242f14a9853a191), [`16a454f`](https://github.com/LedgerHQ/ledger-live/commit/16a454fa79be46df6aec3c50ad40407f36dfdea9), [`782b197`](https://github.com/LedgerHQ/ledger-live/commit/782b197bf61a233f5c6ffe7f68e37267f8546e73), [`de19b3e`](https://github.com/LedgerHQ/ledger-live/commit/de19b3e4e56a0c28fcc1a3ca929059e84fc7bebf), [`25224f4`](https://github.com/LedgerHQ/ledger-live/commit/25224f463b834dba7a2811d7150aeec6dbd6a3ac), [`96a1ca9`](https://github.com/LedgerHQ/ledger-live/commit/96a1ca9fef1b0acc8113708c148890054dea143d), [`f7fa8f0`](https://github.com/LedgerHQ/ledger-live/commit/f7fa8f0ff23c03a69933f2d6aa6e0b225af9d542), [`e8fa868`](https://github.com/LedgerHQ/ledger-live/commit/e8fa86874942249a54884353c6c1b070af80d4b1), [`738c0d8`](https://github.com/LedgerHQ/ledger-live/commit/738c0d8a1357e96713bfc0d7a40ca403b5290c35), [`2b976be`](https://github.com/LedgerHQ/ledger-live/commit/2b976be3c7d61accd0911b439263be9d66f50508), [`1eb2e00`](https://github.com/LedgerHQ/ledger-live/commit/1eb2e00074fe05f103dd33c3fbf295cfd39e9c2e), [`632dd93`](https://github.com/LedgerHQ/ledger-live/commit/632dd9368616a97581d037f1503b2b16f567c02a), [`036b71d`](https://github.com/LedgerHQ/ledger-live/commit/036b71d678a57c3b1c3156374122fe13bea54f79), [`85e01c4`](https://github.com/LedgerHQ/ledger-live/commit/85e01c449dab75d75851631a56d292f2cb0c5b36), [`799219e`](https://github.com/LedgerHQ/ledger-live/commit/799219e262e80a339272113ea164fa506243b438), [`e37413b`](https://github.com/LedgerHQ/ledger-live/commit/e37413b588873a1a2a028ebf4c1971e4fa92ed2a), [`9e61582`](https://github.com/LedgerHQ/ledger-live/commit/9e61582edfcbb98046d0f74111ccf4061ec44bb3), [`e3535da`](https://github.com/LedgerHQ/ledger-live/commit/e3535da7e5c884f8ada75eff52c0c4538142fffb), [`05cb97c`](https://github.com/LedgerHQ/ledger-live/commit/05cb97c6986755d87d4c0b3df3d8b4daf9ba77df), [`251af57`](https://github.com/LedgerHQ/ledger-live/commit/251af57e7412e493deaecddf627e3967ba044c09), [`b30f903`](https://github.com/LedgerHQ/ledger-live/commit/b30f903f592c0bafba74a1784d98b9d605c18ccb), [`5b60a96`](https://github.com/LedgerHQ/ledger-live/commit/5b60a968d3292b3897380f2c74c472a51b81e35d), [`da3d09d`](https://github.com/LedgerHQ/ledger-live/commit/da3d09d75d7dcae659611cd371c48d75c03f7ae4), [`cdb273b`](https://github.com/LedgerHQ/ledger-live/commit/cdb273b068df78cd5a0dbd4281fb79f22e0a7506), [`54fce77`](https://github.com/LedgerHQ/ledger-live/commit/54fce77bfa46c3d42d3e39b80804258a91d910f2), [`ee1b919`](https://github.com/LedgerHQ/ledger-live/commit/ee1b9192421545035fb547f27319d7f816d85fe8), [`9e37f58`](https://github.com/LedgerHQ/ledger-live/commit/9e37f58a84f7ee9585142c0a8ac767da58b6d06f), [`7e44af4`](https://github.com/LedgerHQ/ledger-live/commit/7e44af495eccab1fac4b0808d6729a595b610c69), [`600d432`](https://github.com/LedgerHQ/ledger-live/commit/600d432657f1c9adf80af6730dd28f2177e05c5a), [`7050652`](https://github.com/LedgerHQ/ledger-live/commit/70506520dafbccca4e014ac30d75647a5b7fe7d0), [`bb2f03e`](https://github.com/LedgerHQ/ledger-live/commit/bb2f03e41b96b8f95f239acea75428657cdd64fe), [`dc204a7`](https://github.com/LedgerHQ/ledger-live/commit/dc204a7633e6f7c9acb66fbb18a6aeaa2e75c4bb), [`73eb9bc`](https://github.com/LedgerHQ/ledger-live/commit/73eb9bc68ed87f07142a1fdf54e4cd68af3a36d4), [`903c180`](https://github.com/LedgerHQ/ledger-live/commit/903c1802ea5d4cc3fe1bfe5609b8cf3871152cf0), [`cef83ae`](https://github.com/LedgerHQ/ledger-live/commit/cef83ae58ffc5529bebda292737502e78e3b7522), [`3f34609`](https://github.com/LedgerHQ/ledger-live/commit/3f34609edecc5ae85a9a9ac1b76ab47e30a9c66e), [`a6a7a94`](https://github.com/LedgerHQ/ledger-live/commit/a6a7a946b1c1dbdda1cfa2c049f536f7235ddde2), [`c6f7bfe`](https://github.com/LedgerHQ/ledger-live/commit/c6f7bfead8593c148fe6e3d177ff8dd734728f5a), [`0e1e102`](https://github.com/LedgerHQ/ledger-live/commit/0e1e10227aa5cc0d19e8a142533c54838e3ed57e), [`34f8541`](https://github.com/LedgerHQ/ledger-live/commit/34f8541ae58847dcee784b3fe97f227edd644775), [`fcc2ac4`](https://github.com/LedgerHQ/ledger-live/commit/fcc2ac4c5ed270fb63df4c0079068ad6dac94612), [`eddc89e`](https://github.com/LedgerHQ/ledger-live/commit/eddc89e7b86a13aeedfc0ae4956c2dcd08494e5f), [`b976cda`](https://github.com/LedgerHQ/ledger-live/commit/b976cda52320ef3f778fc11b4f95d2c5bf54ffe0), [`e7d79ac`](https://github.com/LedgerHQ/ledger-live/commit/e7d79acf1d91e98e2813755f9bebdbfd83e89f39), [`c5229d1`](https://github.com/LedgerHQ/ledger-live/commit/c5229d1b2bbf8d8067e036f0a34dda403519e206), [`37f5759`](https://github.com/LedgerHQ/ledger-live/commit/37f57595f11d40562914794645cb3c7f6e55dc8b), [`a2a0288`](https://github.com/LedgerHQ/ledger-live/commit/a2a028844dbfbfa019f1f971bf6fdbed9005b9ec), [`8b3320d`](https://github.com/LedgerHQ/ledger-live/commit/8b3320d7aab0ff25eeb8930dafa536fb94962c79), [`e65a6b3`](https://github.com/LedgerHQ/ledger-live/commit/e65a6b3e67e271343b7029613498176b1da2d7d2), [`4ac2794`](https://github.com/LedgerHQ/ledger-live/commit/4ac2794b8244b094f2e91563bb7ad8a220d6cba5), [`2edc7c8`](https://github.com/LedgerHQ/ledger-live/commit/2edc7c8d47b1ac8b49194155be8f8b3722574d39), [`0f4b55e`](https://github.com/LedgerHQ/ledger-live/commit/0f4b55e46459492e880a8e5e118b570a934ce4d7), [`c88b5c6`](https://github.com/LedgerHQ/ledger-live/commit/c88b5c65b0488097e2a17071ca04ac06ae41763a), [`5ddb9ab`](https://github.com/LedgerHQ/ledger-live/commit/5ddb9ab2874a6715d706042701e8b2242b1c14b9), [`6c1be58`](https://github.com/LedgerHQ/ledger-live/commit/6c1be58b4dbcce00cc114442d2aeb76278248d99), [`8427ffd`](https://github.com/LedgerHQ/ledger-live/commit/8427ffdf83031f0e119680abecf815f8f4f60cf9), [`e31a99e`](https://github.com/LedgerHQ/ledger-live/commit/e31a99e0c1a5449aa1ab8729130e1d123b1ffdad), [`9d0b721`](https://github.com/LedgerHQ/ledger-live/commit/9d0b721dbfd8b71d32d2d16db22ad8e54f45f541), [`d353658`](https://github.com/LedgerHQ/ledger-live/commit/d353658a0254e49a369ca7481c9680254e9e4851), [`b49d5b5`](https://github.com/LedgerHQ/ledger-live/commit/b49d5b573e84bd63ac460ae398657f1035613141), [`4c314f4`](https://github.com/LedgerHQ/ledger-live/commit/4c314f4035581de1affaba8419cd062359251c2f)]:
  - @features/flow-pay-card@0.4.0-next.0
  - @domain/api-card-management@0.6.0-next.0
  - @features/flow-pay-card-auth@0.7.0-next.0
  - @features/flow-contacts-list@0.7.0-next.0
  - @features/platform-contacts@0.7.0-next.0
  - @features/flow-contacts-introduction@1.2.0-next.0
  - @shared/ui-queued-bottom-sheet@0.4.0-next.0
  - @features/flow-contacts-add-address@0.5.0-next.0
  - @shared/feature-flags@0.23.0-next.0
  - @ledgerhq/coin-concordium@1.3.0-next.0
  - @features/flow-app-lock@0.4.0-next.0
  - @features/flow-contacts@0.11.0-next.0
  - @features/flow-contacts-add-contact@0.6.0-next.0
  - @ledgerhq/types-live@6.124.0-next.0
  - @features/platform-feature-flags@0.7.0-next.0
  - @devtools/bindings@0.8.0-next.0
  - @ledgerhq/icons-ui@0.21.0-next.0
  - @ledgerhq/native-ui@0.67.0-next.0
  - @domain/entity-contact@0.9.0-next.0
  - @ledgerhq/live-dmk-speculos@0.11.0-next.0
  - @shared/env@0.7.0-next.0
  - @ledgerhq/ledger-key-ring-protocol@0.22.0-next.0
  - @ledgerhq/coin-cosmos@1.3.0-next.0
  - @ledgerhq/live-countervalues@0.26.0-next.0
  - @ledgerhq/live-countervalues-react@0.18.0-next.0
  - @features/flow-pay-card-widget@0.3.0-next.0
  - @features/flow-pay-request@0.5.0-next.0
  - @features/flow-pay-contact@0.4.0-next.0
  - @features/flow-pay-deposit@0.4.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.4.0-next.0
  - @ledgerhq/live-send@0.1.0-next.0
  - @shared/platform-linking@0.2.0-next.0
  - @features/flow-contacts-edit-contact@0.5.0-next.0
  - @features/flow-large-screen-upsell@2.1.0-next.0
  - @features/flow-lazy-onboarding-banner@0.4.0-next.0
  - @features/platform-card@0.5.0-next.0
  - @features/platform-style@0.4.0-next.0
  - @features/flow-contacts-delete-contact@0.2.2-next.0
  - @features/flow-contacts-edit-address@0.3.1-next.0
  - @features/flow-pay-balance@0.4.2-next.0
  - @features/flow-pay-bank-transfer@0.3.1-next.0
  - @features/flow-pay-feature-tour@0.5.1-next.0
  - @features/platform-device-action-content@0.2.1-next.0
  - @shared/ui-info-state@0.2.2-next.0
  - @features/platform-currencies@0.8.1-next.0
  - @ledgerhq/coin-bitcoin@0.52.1-next.0
  - @ledgerhq/coin-canton@1.1.2-next.0
  - @ledgerhq/coin-casper@3.3.1-next.0
  - @ledgerhq/coin-filecoin@2.1.2-next.0
  - @ledgerhq/coin-multiversx@1.1.2-next.0
  - @ledgerhq/coin-stacks@0.30.2-next.0
  - @ledgerhq/device-core@0.11.16-next.0
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
  - @ledgerhq/live-dmk-mobile@0.29.8-next.0
  - @shared/api-services@0.7.0
  - @shared/auth@0.6.0
  - @shared/cloud-sync@0.3.0
  - @shared/i18n@0.2.0
  - @shared/password-verifier@0.3.0
  - @devtools/shell@0.9.3-next.0

## 4.20.0

### Minor Changes

- [#21206](https://github.com/LedgerHQ/ledger-live/pull/21206) [`750bdd4`](https://github.com/LedgerHQ/ledger-live/commit/750bdd4bbaaf7a1c591c8a8f21479f6c64fc9c95) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Add mobile E2E for the post-onboarding hub mock flow (LIVE-31323).

- [#21042](https://github.com/LedgerHQ/ledger-live/pull/21042) [`d5e1c7d`](https://github.com/LedgerHQ/ledger-live/commit/d5e1c7d985b15adbe230e537e998af2dcf3cff8b) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Tell the two Hyperliquid account-picker states apart.

  The perps receiving step used one description for both states, so users who already had a Hyperliquid account were told to add one. It now reads "Select an account you want to deposit funds into to place your trades" when accounts exist, and keeps "To fund your perps, you need a Hyperliquid account.

- [#21515](https://github.com/LedgerHQ/ledger-live/pull/21515) [`7f4723c`](https://github.com/LedgerHQ/ledger-live/commit/7f4723cf1aa59ec55d172d27000fad438f4833c6) Thanks [@sarneijim](https://github.com/sarneijim)! - Bump Segment analytics SDKs for retry, rate-limit and security fixes (LIVE-35839)

- [#21237](https://github.com/LedgerHQ/ledger-live/pull/21237) [`db835f9`](https://github.com/LedgerHQ/ledger-live/commit/db835f9f8b91d7accdd0eea942339b3f71826470) Thanks [@vpenskyi-ledger](https://github.com/vpenskyi-ledger)! - Remove native navbar title on Select Quote page in Swap wallet40 header

- [#21355](https://github.com/LedgerHQ/ledger-live/pull/21355) [`fc74af8`](https://github.com/LedgerHQ/ledger-live/commit/fc74af8db6038afd89c64de356e67fe9ba4811a0) Thanks [@semeano](https://github.com/semeano)! - Offer the Zcash memo only to shielded recipients. A memo travels in a shielded output, so a transparent recipient could never receive one, yet the send flow showed the input for every Zcash address and made the user fill or skip it. Send descriptors can now distinguish static memo support from recipient-specific visibility, and a memo left over from an earlier shielded recipient is dropped when the recipient turns transparent, so it can no longer reach the transaction builder.

- [#21421](https://github.com/LedgerHQ/ledger-live/pull/21421) [`3d23fd4`](https://github.com/LedgerHQ/ledger-live/commit/3d23fd471fbb0ba76a0e6997eba995e190a89f7c) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add a first-time verify hint on mobile Pay Request, persisted once dismissed.

- [#21434](https://github.com/LedgerHQ/ledger-live/pull/21434) [`b7f83a1`](https://github.com/LedgerHQ/ledger-live/commit/b7f83a1c1818e4eff9ffbf19796a71d7242fd5b4) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add persisted Pay Request verify-hint state in `@features/flow-pay-request`.

- [#21367](https://github.com/LedgerHQ/ledger-live/pull/21367) [`d182d46`](https://github.com/LedgerHQ/ledger-live/commit/d182d466275f4c35ec3bf86cadf544de77c27058) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix the Ledger Sync entry point from Contacts: align the introduction copy and artwork with the production design, only show it when the user actually tries to add a contact or an address, start the flow on "Choose your sync method", and return to Contacts instead of the Portfolio once the flow is done on Mobile.

- [#21470](https://github.com/LedgerHQ/ledger-live/pull/21470) [`5b79eb3`](https://github.com/LedgerHQ/ledger-live/commit/5b79eb3c5b1e2e7aca86fb0a8c4b7af085e57f9d) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix the Contacts add address flow stalling on Continue by only offering networks the device can register an address on: EVM networks running their own coin app, such as Ethereum Classic, Sonic and Sei, are no longer selectable

- [#21431](https://github.com/LedgerHQ/ledger-live/pull/21431) [`c06bd2e`](https://github.com/LedgerHQ/ledger-live/commit/c06bd2ee99e9d76609d628a41698a16c37a0c0c7) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix the extra left padding on the address field of the Mobile add address and edit address drawers. Both screens render the address without the "To:" prefix, but Lumen's AddressInput mounts its prefix even when empty, so the prefix still took a slot in the field's inner gap and pushed the address 8px to the right. Add address now drops that gap and keeps the spacing only between the address and the trailing QR code icon, and edit address, which has no trailing icon, uses a plain TextInput instead.

- [#21543](https://github.com/LedgerHQ/ledger-live/pull/21543) [`eea933c`](https://github.com/LedgerHQ/ledger-live/commit/eea933c21039eab89442a4caae6cf0e121f68cca) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix the trash icon of the contact "Delete contact" action rendering white instead of red.

- [#21587](https://github.com/LedgerHQ/ledger-live/pull/21587) [`46b51dd`](https://github.com/LedgerHQ/ledger-live/commit/46b51ddabe0689bc64b598bcb33f131f4b1c2a22) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix the Contacts feature introduction so closing it counts as seen and keeps you on the Contacts list, instead of navigating back and reopening the introduction on the next visit.

- [#21592](https://github.com/LedgerHQ/ledger-live/pull/21592) [`9e0d7eb`](https://github.com/LedgerHQ/ledger-live/commit/9e0d7eb43bfcfee06ccfa566f131dec9dd2118f6) Thanks [@koda-apps](https://github.com/apps/koda-apps)! - Fix misaligned "Maybe later" link on the notifications opt-in prompt drawer

- [#21393](https://github.com/LedgerHQ/ledger-live/pull/21393) [`406f56f`](https://github.com/LedgerHQ/ledger-live/commit/406f56fee95db771054d2d7b0efe18990f8eb231) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Align the content card tag and dismiss cross with their desktop counterparts by using the Lumen UI Tag and InteractiveIcon components.

- [#21026](https://github.com/LedgerHQ/ledger-live/pull/21026) [`4f514c9`](https://github.com/LedgerHQ/ledger-live/commit/4f514c97491277ea63524e299904fe5e5711d897) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Store a scrypt verifier instead of the password itself. Confirming a password now derives a digest and persists `{version, scrypt, salt, digest}` in the keychain, so nothing that can be replayed as a password is kept anywhere.

  The protection state lands with it: two independent flags plus a session lock, keyed off "any protection is enabled" rather than on having a password, which is the coupling that makes biometrics-only impossible today.

  Ordering is the safety argument throughout — the whole verifier is one keychain item, so an interrupted write leaves the previous verifier or none, never a half-written pairing, and the state flips only once the write has landed. Derivations are serialised: two concurrent setups would otherwise interleave and store a verifier whose salt belongs to the other run.

  The password field also gains a length cap. It sits far above anything anyone types, and exists because deriving a digest is deliberately slow.

- [#21746](https://github.com/LedgerHQ/ledger-live/pull/21746) [`c2e2276`](https://github.com/LedgerHQ/ledger-live/commit/c2e2276459d5e48e938145eb54bae572f5ae7a60) Thanks [@amaslakov](https://github.com/amaslakov)! - Add the error message shown when the protocol refuses a Tezos stake amount as too small

- [#21401](https://github.com/LedgerHQ/ledger-live/pull/21401) [`8c40cc1`](https://github.com/LedgerHQ/ledger-live/commit/8c40cc1c2054d12fc546e341a18e966d6ab23986) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Skip the extra confirmation modal when editing a contact or address name. Apply changes now starts the device action directly when needed, and the Apply CTA shows the Ledger logo in that case.

- [#21440](https://github.com/LedgerHQ/ledger-live/pull/21440) [`0089a4b`](https://github.com/LedgerHQ/ledger-live/commit/0089a4b80512c2c8f8eb3a03b9e3245492380647) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Drive Contacts add-address confirmation through the Device Intent Executor instead of mocked Continue screens, including prefill and Send entry points.

- [#21599](https://github.com/LedgerHQ/ledger-live/pull/21599) [`e601584`](https://github.com/LedgerHQ/ledger-live/commit/e6015847b44e86dd9c4733559d591874099e1f4e) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Pin the Contacts feature introduction CTA to the bottom of the mobile sheet

- [#21277](https://github.com/LedgerHQ/ledger-live/pull/21277) [`37dde9f`](https://github.com/LedgerHQ/ledger-live/commit/37dde9f9343769c63078aa82a955048a4f631e98) Thanks [@sarneijim](https://github.com/sarneijim)! - Log Segment identify calls (enqueued or failed) in the mobile analytics debug overlay

- [#21606](https://github.com/LedgerHQ/ledger-live/pull/21606) [`000eac0`](https://github.com/LedgerHQ/ledger-live/commit/000eac03eacf0093f241f8a05d9f525bbcf5de13) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Fix missing 8px spacing between items in the mobile contacts list

- [#21526](https://github.com/LedgerHQ/ledger-live/pull/21526) [`4494817`](https://github.com/LedgerHQ/ledger-live/commit/44948173b1b1d90adcb1bf833194054871f2f542) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Open the contact address sheet from the Pay strip and continue to MAD with the chosen recipient.

- [#21418](https://github.com/LedgerHQ/ledger-live/pull/21418) [`60ee73c`](https://github.com/LedgerHQ/ledger-live/commit/60ee73c7b89b101dde708a04ded260341ef86d44) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Rename `CARD_API_URL` to `CARD_BAANX_API_URL`, keep the production defaults, and drop the Env vars section from the Card / Pay DevTool.

- [#21551](https://github.com/LedgerHQ/ledger-live/pull/21551) [`727b9e5`](https://github.com/LedgerHQ/ledger-live/commit/727b9e5d40ebec83366a2dd7939713a1adc874a9) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Register and persist the card onboarding widget state in Ledger Wallet Mobile.

- [#21610](https://github.com/LedgerHQ/ledger-live/pull/21610) [`6b47659`](https://github.com/LedgerHQ/ledger-live/commit/6b4765929e98abbcb08cd5348fddb528a9e674e7) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add native card onboarding widget on mobile with Apple/Google Pay step and wallet persistence

- [#21619](https://github.com/LedgerHQ/ledger-live/pull/21619) [`23d2e1e`](https://github.com/LedgerHQ/ledger-live/commit/23d2e1e0a0a83516fb9f5c12f54a2afc15208702) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Keep mobile contact address detail action buttons full width by applying horizontal padding only to the summary.

- [#21248](https://github.com/LedgerHQ/ledger-live/pull/21248) [`9672658`](https://github.com/LedgerHQ/ledger-live/commit/967265820c38ad0b2f8f45fd0a892ca07c58d23a) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Edit an external address on the device from Contacts. The device intent now calls `@ledgerhq/device-contacts-kit`'s `ContactsManager.editExternalAddressIdentifier()` and `ContactsManager.editExternalAddressScope()`, each returning the rotated address proof to persist while the group's name proof passes through untouched, and both apps render the confirmation step and one `InfoState` per failure.

  The device serves address and label edits as two separate commands, so an edit changing both asks the user to confirm twice, showing the same waiting screen for each step rather than numbering them. Nothing partial is ever stored: an abandoned or rejected edit leaves the record untouched, and a retry restarts the whole chain.

- [#21609](https://github.com/LedgerHQ/ledger-live/pull/21609) [`094e919`](https://github.com/LedgerHQ/ledger-live/commit/094e919fdfc117164f41c48d0c40bff7d4e84609) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Use the horizontal more icon on the mobile contact detail page

- [#21247](https://github.com/LedgerHQ/ledger-live/pull/21247) [`a55d4ca`](https://github.com/LedgerHQ/ledger-live/commit/a55d4ca3a804f6ab27f039926255f2c410ef7221) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Rename a contact on the device from Contacts. The device intent now calls `@ledgerhq/device-contacts-kit`'s `ContactsManager.renameContact()`, which returns the rotated name proof to persist, and both apps render the confirmation step and one `InfoState` per failure. A rejection keeps the job open so the user can retry on the same device.

  Rename is a blockchain-agnostic dashboard operation, so it initializes on the dashboard (`BOLOS`) rather than a coin app: a contact with no address is renameable, and an outdated device surfaces as an OS-update screen instead of an app-update one.

- [#21351](https://github.com/LedgerHQ/ledger-live/pull/21351) [`51c44eb`](https://github.com/LedgerHQ/ledger-live/commit/51c44eb2f189217b4da350680333b3dcbaa4c196) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Wire the contacts device intents in the remaining add address flows: adding an external address from the new send flow now goes through the Device Intent Executor instead of the mocked device intents port. The calling drawer closes so the executor can take the queue, and the add address flow closes as it hands the review over to the device

- [#21833](https://github.com/LedgerHQ/ledger-live/pull/21833) [`8993c24`](https://github.com/LedgerHQ/ledger-live/commit/8993c242de8ed57617fb74ac9a3b1af047638914) Thanks [@koda-apps](https://github.com/apps/koda-apps)! - Fix walletsync feature flags (lldWalletSync, llmWalletSync) to default to the PROD environment instead of STAGING.

- [#21490](https://github.com/LedgerHQ/ledger-live/pull/21490) [`c5dfbed`](https://github.com/LedgerHQ/ledger-live/commit/c5dfbed0b111cbe375b0d83f35e64c7a06d14267) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(send): picking a contact on the recipient step now goes straight to the amount step, matching desktop

- [#21487](https://github.com/LedgerHQ/ledger-live/pull/21487) [`b7d0367`](https://github.com/LedgerHQ/ledger-live/commit/b7d03671db1aa022d3ff375465c7d8470bf2b215) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop `disableCountervalue` from `CryptoCurrency`. Nothing read it on a crypto currency; it stays on `TokenCurrency`, where the assets API drives it, and on `FiatCurrency`.

- [#21492](https://github.com/LedgerHQ/ledger-live/pull/21492) [`f8dc454`](https://github.com/LedgerHQ/ledger-live/commit/f8dc454c962d991346c813e557f42c2fb78491a7) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Add a `provider-row-<name>` testID to the Cosmos family validator row so automation can select a validator explicitly, which Osmosis now requires since it has no pre-selected Ledger validator

- [#21223](https://github.com/LedgerHQ/ledger-live/pull/21223) [`e92cf97`](https://github.com/LedgerHQ/ledger-live/commit/e92cf9742f7d910dea79ca848494b3870b2ae254) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Route Casper through the generic coin-framework bridge (LIVE-35912/35914/35915).

  - `coin-casper`: `createApi()` now returns a `CoinModuleImpl` (dropping the throwing stubs for unsupported capabilities; `withDefaults` fills them). `craftTransactionData` delegates to the framework helper. `getTransferIdFromMemo` bridges the legacy `StringMemo<"transferId">` shape and the new `{type:"transferId"}` framework shape until LIVE-35735 unifies them.
  - `live-common`: Casper added to `genericCoinFrameworkFamilies.json`; LiveConfig key `config_casper_generic_bridge` (default `true`) provides a runtime kill-switch to fall back to the legacy bridge without a deploy.
  - Desktop/Mobile: `useTransferIdChange` hook extracted and shared between `MemoField` / `TransferIdField` / `MemoTagInput` / `ScreenEditTransferId`; now writes both `transferId` (legacy bridge) and `memoType`/`memoValue` (generic path) so both bridges read the same user input correctly.

- [#21135](https://github.com/LedgerHQ/ledger-live/pull/21135) [`2566c81`](https://github.com/LedgerHQ/ledger-live/commit/2566c8111c3818418a2ac3b4397abb8cccf6db36) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Consolidate mobile Braze Content Card refreshes under one lifecycle provider

- [#21513](https://github.com/LedgerHQ/ledger-live/pull/21513) [`9dd7db0`](https://github.com/LedgerHQ/ledger-live/commit/9dd7db0d81362a5d019cd0830bdd336a1f42e7af) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add a Pay success screen to the Send flow. When the flow is launched from the Pay tab and the transaction succeeds, it now routes to a dedicated `PAY_SUCCESS` step that shows the recipient, amount, source account (with network icon) and a link to the transaction details, instead of the standard confirmation step. Exposes a presentational `PaySuccess` component from `@features/flow-pay-contact` and wires it in ledger-live-desktop via an MVVM `PaySuccessScreen` + `usePaySuccessViewModel`.

- [#21372](https://github.com/LedgerHQ/ledger-live/pull/21372) [`961792b`](https://github.com/LedgerHQ/ledger-live/commit/961792b84469e81b8b2160a9bb1db08a2c9a1781) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Gate the Pay tab contacts section behind the contacts feature flag (lwdContacts on desktop, lwmContacts on mobile)

- [#21332](https://github.com/LedgerHQ/ledger-live/pull/21332) [`08201e0`](https://github.com/LedgerHQ/ledger-live/commit/08201e0c9e14ed5436972d544bffc7484fad3703) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(send): open the MAD for the new send flow on LWM

- [#21806](https://github.com/LedgerHQ/ledger-live/pull/21806) [`04445dc`](https://github.com/LedgerHQ/ledger-live/commit/04445dc07c17323d9c9bdeb2a5dac139d0ccd40a) Thanks [@henri-ly](https://github.com/henri-ly)! - Add missing changeset for Aleo bugfix LIVE-37189

- [#21305](https://github.com/LedgerHQ/ledger-live/pull/21305) [`7aca4c8`](https://github.com/LedgerHQ/ledger-live/commit/7aca4c8a806ab270cd990d63b1c651e443b7e149) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - refactor: drop the Hedera preload layer now that no consumer reads it, and fold useHederaEnrichedDelegationV2 back into useHederaEnrichedDelegation

- [#21304](https://github.com/LedgerHQ/ledger-live/pull/21304) [`17862f6`](https://github.com/LedgerHQ/ledger-live/commit/17862f681b8a9a1d14c4fd50924a0dfc7de79949) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - refactor: read Hedera staking validators through an on-demand query on mobile, with loading and fetch-error states

- [#21358](https://github.com/LedgerHQ/ledger-live/pull/21358) [`6561cf0`](https://github.com/LedgerHQ/ledger-live/commit/6561cf003713ab65533bb9476771c0de9b19e634) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - refactor: serve the Hedera validators list from an RTK Query api instead of React Query

- [#21528](https://github.com/LedgerHQ/ledger-live/pull/21528) [`2744267`](https://github.com/LedgerHQ/ledger-live/commit/2744267da72f342ca2dc67d95f34d512d7f4c7f6) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Open Pay New on a dedicated contact list, including people with no address.

- [#21616](https://github.com/LedgerHQ/ledger-live/pull/21616) [`5e971b5`](https://github.com/LedgerHQ/ledger-live/commit/5e971b55429cdcab0f69825ce2056fef24d30215) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Migrate `BIG_NUMBER_DECIMAL_PLACES` off `@ledgerhq/live-env`: every call site now inlines the constant and the definition is removed. `@ledgerhq/live-currency-format` drops its `@ledgerhq/live-env` dependency altogether.

- [#21557](https://github.com/LedgerHQ/ledger-live/pull/21557) [`0122aa8`](https://github.com/LedgerHQ/ledger-live/commit/0122aa87e4b5d651b25b29d941275fd33adb2cae) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Title the pay-contact MAD account step “Select account to pay from”.

- [#21474](https://github.com/LedgerHQ/ledger-live/pull/21474) [`54351c2`](https://github.com/LedgerHQ/ledger-live/commit/54351c2f7501362c9323fd835e21b2db37d6b4cd) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Group unavailable assets and networks under a "Not available yet" section in the asset and network selection lists

- [#21636](https://github.com/LedgerHQ/ledger-live/pull/21636) [`d3b658b`](https://github.com/LedgerHQ/ledger-live/commit/d3b658bb5a051a33647e3c5d752f441d610f1256) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - add freeze to mobile

- [#21483](https://github.com/LedgerHQ/ledger-live/pull/21483) [`a35c7b9`](https://github.com/LedgerHQ/ledger-live/commit/a35c7b900ce39bdd69895514f983ae9ad087562a) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(send): the send recipient AddressInput taking then losing the keyboard,it now only focuses once the step shows nothing at all, not when contacts are in the list

- [#21345](https://github.com/LedgerHQ/ledger-live/pull/21345) [`07410d0`](https://github.com/LedgerHQ/ledger-live/commit/07410d015aec7f516b2c63ace3e2a419cc04f96d) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Add MINA staking (delegation) support to Ledger Live Mobile

- [#21283](https://github.com/LedgerHQ/ledger-live/pull/21283) [`761cf3e`](https://github.com/LedgerHQ/ledger-live/commit/761cf3e359fa197d07f6086d8522fd1785ba575d) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - add earn banner to success transation modal

- [#21359](https://github.com/LedgerHQ/ledger-live/pull/21359) [`36ea18d`](https://github.com/LedgerHQ/ledger-live/commit/36ea18d4f36c757bc6901bfc258af2f11b8ee00d) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Route the Noah webview to signup or signin when noahAuth is set (LIVE-35383).

- [#21450](https://github.com/LedgerHQ/ledger-live/pull/21450) [`4bc8559`](https://github.com/LedgerHQ/ledger-live/commit/4bc8559bb8ca25631eabb4cc1845935076cffc04) Thanks [@sarneijim](https://github.com/sarneijim)! - Make the notifications prompt debug screen QA-readable with named scenarios, plain-English verdicts and an in-place drawer preview (LIVE-35955)

- [#21298](https://github.com/LedgerHQ/ledger-live/pull/21298) [`91bae2a`](https://github.com/LedgerHQ/ledger-live/commit/91bae2a0cf5af0f407b4d797b023d07e4ba95fbf) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Present the Pay cash-to-stable intro as a mobile bottom sheet, then hand off create/login to Noah (LIVE-35382).

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

- [#21564](https://github.com/LedgerHQ/ledger-live/pull/21564) [`c92234c`](https://github.com/LedgerHQ/ledger-live/commit/c92234c533e415678787d4cec6512f01ae7a5ed7) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Open Pay see-all on the Pay contact list (Me, A–Z, add) instead of MyWallet Contacts

- [#21380](https://github.com/LedgerHQ/ledger-live/pull/21380) [`59ea8fb`](https://github.com/LedgerHQ/ledger-live/commit/59ea8fbd36754199f1c68ab53537460ca31c70b4) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(cosmos): remove Ledger validator as the default one for Osmosis

- [#21496](https://github.com/LedgerHQ/ledger-live/pull/21496) [`9e93f16`](https://github.com/LedgerHQ/ledger-live/commit/9e93f16593ffb9ef2658b107cdcceed5d032f2a7) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(tracking): add tracking contact send flow lwm

- [#21854](https://github.com/LedgerHQ/ledger-live/pull/21854) [`6ad68ad`](https://github.com/LedgerHQ/ledger-live/commit/6ad68ad4358d6a1126f300c3855cab33a918c017) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(llc): update Arc mainnet native contract address

- [#21353](https://github.com/LedgerHQ/ledger-live/pull/21353) [`f3de6fb`](https://github.com/LedgerHQ/ledger-live/commit/f3de6fb6b1c7fe5fbb57a8dd7cbea7899eb2d45d) Thanks [@jeportie](https://github.com/jeportie)! - Clean up mobile E2E Allure after-hook attachments: filter network noise, failure-only feature flags, warn/error-only console logs, aligned attachment names

- [#21555](https://github.com/LedgerHQ/ledger-live/pull/21555) [`a83aff5`](https://github.com/LedgerHQ/ledger-live/commit/a83aff5f46332fcde6c0792a71a1b2ac9738d583) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Open Send recipient from the amount header instead of leaving to Pay.

- [#21240](https://github.com/LedgerHQ/ledger-live/pull/21240) [`1cb4dbe`](https://github.com/LedgerHQ/ledger-live/commit/1cb4dbe4a9b0d556768c3ce18d17eb08935e518f) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Persist Solana `stakingResources` through the generic coin framework, and revive accounts still holding the legacy `solanaResources` blob

- [#21605](https://github.com/LedgerHQ/ledger-live/pull/21605) [`39115cb`](https://github.com/LedgerHQ/ledger-live/commit/39115cbf86afe42c8c71acdf18e1f6f990587410) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Fix app crash on the first APDU exchange over USB HID in minified Android builds

- [#21194](https://github.com/LedgerHQ/ledger-live/pull/21194) [`2bd6a1c`](https://github.com/LedgerHQ/ledger-live/commit/2bd6a1c4b9d0cd229a8c9207108672b1a580968a) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Refresh Baanx Pay Card sessions after a 401, and keep the credentials out of every reader of redux.

  The two OAuth2 grants are RTK Query endpoints again. Both opt out of the Bearer and out of the
  renewal, both run with `track: false`, so no session becomes a cache entry, and neither has a hook.

  The desktop redux logger and both DevTools configurations now strip every Card action, which also
  closes a live leak: the code exchange logs its code and its code verifier in production, into the
  file users attach to a support ticket.

- [#21373](https://github.com/LedgerHQ/ledger-live/pull/21373) [`d54d191`](https://github.com/LedgerHQ/ledger-live/commit/d54d19127a958bb0ac8c9c479bba716ce67041ff) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Update the Pay feature tour copy, icons, and hero to match mockups (LIVE-36497).

- [#21522](https://github.com/LedgerHQ/ledger-live/pull/21522) [`64a7c3c`](https://github.com/LedgerHQ/ledger-live/commit/64a7c3cc25b2ba00ba36dd259928dcf40cec8569) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Open the contact address sheet from Send recipient.

- [#21527](https://github.com/LedgerHQ/ledger-live/pull/21527) [`f7fad4d`](https://github.com/LedgerHQ/ledger-live/commit/f7fad4de2815be6f800da4611fed2e0aa5b989a0) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Open the contact address sheet from Pay see-all with the title Pay contact.

- [#21430](https://github.com/LedgerHQ/ledger-live/pull/21430) [`5b546c5`](https://github.com/LedgerHQ/ledger-live/commit/5b546c55ca622f74ae06b867c5118e19009f80a5) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Remove unused PrefillAddAddressFlowRoot and the shared prefill listener store. Send now owns the prefilled add-address session via startWithPrefilled.

- [#21439](https://github.com/LedgerHQ/ledger-live/pull/21439) [`90ba96b`](https://github.com/LedgerHQ/ledger-live/commit/90ba96bcf6c96f698d168b75f02dc5a83b92cfbe) Thanks [@semeano](https://github.com/semeano)! - Add missing label for transaction inputs

- [#21650](https://github.com/LedgerHQ/ledger-live/pull/21650) [`349c522`](https://github.com/LedgerHQ/ledger-live/commit/349c522bb86bba744844d80d8521c6d24974d26a) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Add an error message for `UnexpectedGetBalanceError`

  `@ledgerhq/coin-tezos` reports this error when a token balance cannot be retrieved, so Send Max
  no longer claims the account has insufficient funds during an indexer outage. Without a
  translation the send flow fell back to rendering the raw error name.

- [#21392](https://github.com/LedgerHQ/ledger-live/pull/21392) [`2df85eb`](https://github.com/LedgerHQ/ledger-live/commit/2df85ebe83b802749be7f8698008d118fbede53f) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(send): add skip memo screen in the send flow

- [#21645](https://github.com/LedgerHQ/ledger-live/pull/21645) [`cf71736`](https://github.com/LedgerHQ/ledger-live/commit/cf717368749338fe457f280cbc219fd832b022e3) Thanks [@henri-ly](https://github.com/henri-ly)! - fix(send): stop reading the send-flow contexts from `SigningBody`

  `SigningBody` renders inside the signature bottom sheet, whose children are mounted by a portal at
  the app root — outside `SendFlowProvider`. Reading the send-flow contexts from there threw
  `useSendFlowData must be used within a SendFlowProvider` and crashed the app on the device-signing
  step. The tracking properties and the recipient type are now passed down from
  `SignatureDeviceActionView`, which sits in the send-flow tree.

- [#21326](https://github.com/LedgerHQ/ledger-live/pull/21326) [`9fb98ab`](https://github.com/LedgerHQ/ledger-live/commit/9fb98ab74e3ca680e686a302b9beaa460a087783) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Drive the XRP app through the Device Management Kit behind the `ldmkXrpSigner` feature flag, keeping `hw-app-xrp` as the fallback

### Patch Changes

- Updated dependencies [[`7c6a8de`](https://github.com/LedgerHQ/ledger-live/commit/7c6a8de98093e274de57e9ee94c6179541e2120c), [`8f8f1a4`](https://github.com/LedgerHQ/ledger-live/commit/8f8f1a472b5c6142d3ddf682fbc5d991c720aa92), [`81aa729`](https://github.com/LedgerHQ/ledger-live/commit/81aa7294c94ef114e6e82ec4c277f0a6c0038c92), [`3d23fd4`](https://github.com/LedgerHQ/ledger-live/commit/3d23fd471fbb0ba76a0e6997eba995e190a89f7c), [`b7f83a1`](https://github.com/LedgerHQ/ledger-live/commit/b7f83a1c1818e4eff9ffbf19796a71d7242fd5b4), [`c270975`](https://github.com/LedgerHQ/ledger-live/commit/c2709750e007b758fa13f0f717efa897fcc6235d), [`d182d46`](https://github.com/LedgerHQ/ledger-live/commit/d182d466275f4c35ec3bf86cadf544de77c27058), [`5b79eb3`](https://github.com/LedgerHQ/ledger-live/commit/5b79eb3c5b1e2e7aca86fb0a8c4b7af085e57f9d), [`c06bd2e`](https://github.com/LedgerHQ/ledger-live/commit/c06bd2ee99e9d76609d628a41698a16c37a0c0c7), [`eea933c`](https://github.com/LedgerHQ/ledger-live/commit/eea933c21039eab89442a4caae6cf0e121f68cca), [`3b0dbae`](https://github.com/LedgerHQ/ledger-live/commit/3b0dbae4ae5df48bd4eb58146675747d7e3593c2), [`4f514c9`](https://github.com/LedgerHQ/ledger-live/commit/4f514c97491277ea63524e299904fe5e5711d897), [`47a1cd0`](https://github.com/LedgerHQ/ledger-live/commit/47a1cd082cc30cd7cc539a8eb0e0fe5466128533), [`8c40cc1`](https://github.com/LedgerHQ/ledger-live/commit/8c40cc1c2054d12fc546e341a18e966d6ab23986), [`0089a4b`](https://github.com/LedgerHQ/ledger-live/commit/0089a4b80512c2c8f8eb3a03b9e3245492380647), [`e601584`](https://github.com/LedgerHQ/ledger-live/commit/e6015847b44e86dd9c4733559d591874099e1f4e), [`000eac0`](https://github.com/LedgerHQ/ledger-live/commit/000eac03eacf0093f241f8a05d9f525bbcf5de13), [`60ee73c`](https://github.com/LedgerHQ/ledger-live/commit/60ee73c7b89b101dde708a04ded260341ef86d44), [`ef29f07`](https://github.com/LedgerHQ/ledger-live/commit/ef29f0711ecec104e4dd9c9d86d4e4d41c4ddee3), [`55bd216`](https://github.com/LedgerHQ/ledger-live/commit/55bd2166238ab3e03c33226bb5f5eb2e8646a818), [`6ed1820`](https://github.com/LedgerHQ/ledger-live/commit/6ed1820776ca6ba59e861da11e4582af406b2188), [`6b47659`](https://github.com/LedgerHQ/ledger-live/commit/6b4765929e98abbcb08cd5348fddb528a9e674e7), [`b1b1e38`](https://github.com/LedgerHQ/ledger-live/commit/b1b1e38d2a8311f935f30c185276c165a6992dbc), [`3a78322`](https://github.com/LedgerHQ/ledger-live/commit/3a783224b6016fce08fa8cb3254057b75882e2c5), [`2b8a4e4`](https://github.com/LedgerHQ/ledger-live/commit/2b8a4e4240a414cbb1bda31b97b70837cb6ac3fe), [`92b90a6`](https://github.com/LedgerHQ/ledger-live/commit/92b90a6eebca959abe0b04aa83c5799d34f9f10a), [`23d2e1e`](https://github.com/LedgerHQ/ledger-live/commit/23d2e1e0a0a83516fb9f5c12f54a2afc15208702), [`9672658`](https://github.com/LedgerHQ/ledger-live/commit/967265820c38ad0b2f8f45fd0a892ca07c58d23a), [`a55d4ca`](https://github.com/LedgerHQ/ledger-live/commit/a55d4ca3a804f6ab27f039926255f2c410ef7221), [`147a290`](https://github.com/LedgerHQ/ledger-live/commit/147a2905d735eee5682d849b3e2c2cde5178f7bb), [`6ccfc64`](https://github.com/LedgerHQ/ledger-live/commit/6ccfc644e6b5c00e2e0bafb10e8519a09d7fb589), [`8993c24`](https://github.com/LedgerHQ/ledger-live/commit/8993c242de8ed57617fb74ac9a3b1af047638914), [`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d), [`2d42e64`](https://github.com/LedgerHQ/ledger-live/commit/2d42e647d55f79cf2eb821ec30a232cc07891219), [`b7d0367`](https://github.com/LedgerHQ/ledger-live/commit/b7d03671db1aa022d3ff375465c7d8470bf2b215), [`e42c12a`](https://github.com/LedgerHQ/ledger-live/commit/e42c12a392ba60ee839c9a71f4f0d409ad9430fa), [`eb62268`](https://github.com/LedgerHQ/ledger-live/commit/eb622688cb7561882cd02b52c2eed569d5dc68f3), [`bed4fe7`](https://github.com/LedgerHQ/ledger-live/commit/bed4fe75210412872bd6c83189ab502b0e1cab24), [`a9e389f`](https://github.com/LedgerHQ/ledger-live/commit/a9e389fc59ca30abf53d0ba8decc6290752ba1db), [`e92cf97`](https://github.com/LedgerHQ/ledger-live/commit/e92cf9742f7d910dea79ca848494b3870b2ae254), [`5f6b8a8`](https://github.com/LedgerHQ/ledger-live/commit/5f6b8a88709d1fd4a94fccaaab915d5ad322c584), [`9dd7db0`](https://github.com/LedgerHQ/ledger-live/commit/9dd7db0d81362a5d019cd0830bdd336a1f42e7af), [`5b7d11d`](https://github.com/LedgerHQ/ledger-live/commit/5b7d11dd9a988f0034b4b5b6168f02429ba5a406), [`ebb1371`](https://github.com/LedgerHQ/ledger-live/commit/ebb13714a6de9c39f290b2ccd51ca78370824f6f), [`53dcdc9`](https://github.com/LedgerHQ/ledger-live/commit/53dcdc9bbef2324b48fac7469c2c1d0e66f7361f), [`2744267`](https://github.com/LedgerHQ/ledger-live/commit/2744267da72f342ca2dc67d95f34d512d7f4c7f6), [`5e971b5`](https://github.com/LedgerHQ/ledger-live/commit/5e971b55429cdcab0f69825ce2056fef24d30215), [`b7a8906`](https://github.com/LedgerHQ/ledger-live/commit/b7a89064587bbcd1f758f7b6205a616225ac2317), [`5db7a7d`](https://github.com/LedgerHQ/ledger-live/commit/5db7a7dc517bb23d12532ae07cc947eddff6c10e), [`761cf3e`](https://github.com/LedgerHQ/ledger-live/commit/761cf3e359fa197d07f6086d8522fd1785ba575d), [`36ea18d`](https://github.com/LedgerHQ/ledger-live/commit/36ea18d4f36c757bc6901bfc258af2f11b8ee00d), [`ac0311e`](https://github.com/LedgerHQ/ledger-live/commit/ac0311e70c2aabb091a0e4d32deaf1cf6e849a5a), [`91bae2a`](https://github.com/LedgerHQ/ledger-live/commit/91bae2a0cf5af0f407b4d797b023d07e4ba95fbf), [`08ee05c`](https://github.com/LedgerHQ/ledger-live/commit/08ee05cfb66f393b14fdf1377ed6c54c4831a87c), [`d6b290b`](https://github.com/LedgerHQ/ledger-live/commit/d6b290b37b8ad6f677ab382bef53bf05cd394ca2), [`0a02a32`](https://github.com/LedgerHQ/ledger-live/commit/0a02a325f99033c086864b0778a8f81c3b4178ae), [`66c7569`](https://github.com/LedgerHQ/ledger-live/commit/66c7569dcfae90739b369ffb3a92cee75dd2e9cd), [`543b17d`](https://github.com/LedgerHQ/ledger-live/commit/543b17d7a6b49728001c0311c184c665e8c9bbb2), [`a7d54c0`](https://github.com/LedgerHQ/ledger-live/commit/a7d54c0d6af65abe7aa2170053b3fd07ae9b05ab), [`c3de11c`](https://github.com/LedgerHQ/ledger-live/commit/c3de11cdf58c4feac701435548bbb96819ae09f6), [`3de7317`](https://github.com/LedgerHQ/ledger-live/commit/3de7317d858c570600eb0a4297876327fdc2c7b5), [`d60ce38`](https://github.com/LedgerHQ/ledger-live/commit/d60ce38581fe06b7f4fa72ba40259af2eabfe11f), [`7aa3071`](https://github.com/LedgerHQ/ledger-live/commit/7aa3071a532c98804a4357ff36a001b23351da73), [`faa8ef1`](https://github.com/LedgerHQ/ledger-live/commit/faa8ef11055a27af3eb7bcf1b662e8bf5c3da77d), [`8dd19d9`](https://github.com/LedgerHQ/ledger-live/commit/8dd19d9f9e936c0e0fbae5636c856ea681ec4197), [`2fe4ef6`](https://github.com/LedgerHQ/ledger-live/commit/2fe4ef6fabb69dbbb38f4bf8517e7d52f9b35b43), [`80b27a1`](https://github.com/LedgerHQ/ledger-live/commit/80b27a1349db33bbd7ba3b96aef5260853916bd2), [`59ea8fb`](https://github.com/LedgerHQ/ledger-live/commit/59ea8fbd36754199f1c68ab53537460ca31c70b4), [`3ea6abc`](https://github.com/LedgerHQ/ledger-live/commit/3ea6abc7a12a27650caf47551e328ab38c9308d6), [`a6193dc`](https://github.com/LedgerHQ/ledger-live/commit/a6193dcf861890977c3f36dc8b1618c4403dae75), [`30619aa`](https://github.com/LedgerHQ/ledger-live/commit/30619aaa2af784fd917214bb0e4bbd092f883e11), [`08ae9c2`](https://github.com/LedgerHQ/ledger-live/commit/08ae9c2bf7b2b509fa23d9b4bf33360f18f7f39f), [`2bd6a1c`](https://github.com/LedgerHQ/ledger-live/commit/2bd6a1c4b9d0cd229a8c9207108672b1a580968a), [`d54d191`](https://github.com/LedgerHQ/ledger-live/commit/d54d19127a958bb0ac8c9c479bba716ce67041ff), [`5b546c5`](https://github.com/LedgerHQ/ledger-live/commit/5b546c55ca622f74ae06b867c5118e19009f80a5), [`54124e4`](https://github.com/LedgerHQ/ledger-live/commit/54124e435c7adc3a2c3a9ed6cd1865fc68fa2584), [`a19ffef`](https://github.com/LedgerHQ/ledger-live/commit/a19ffeff9dd4e173890d75d8634a33e53cc5a5d0), [`0152cad`](https://github.com/LedgerHQ/ledger-live/commit/0152cade87e061bb2b56fd71f8a404c3dfed21e0), [`9fb98ab`](https://github.com/LedgerHQ/ledger-live/commit/9fb98ab74e3ca680e686a302b9beaa460a087783), [`018ee9b`](https://github.com/LedgerHQ/ledger-live/commit/018ee9bdcb993a1b4a203d5664676f7e757b3785)]:
  - @ledgerhq/transaction-observability@0.3.0
  - @features/flow-pay-contact@0.3.0
  - @devtools/bindings@0.7.0
  - @features/flow-pay-request@0.4.0
  - @features/flow-contacts-introduction@1.1.0
  - @features/flow-contacts@0.10.0
  - @features/platform-contacts@0.6.0
  - @features/flow-contacts-add-address@0.4.0
  - @features/flow-contacts-edit-address@0.3.0
  - @features/platform-app-lock@0.3.0
  - @features/flow-app-lock@0.3.0
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
  - @domain/entity-currency-crypto@0.12.0
  - @ledgerhq/types-live@6.123.0
  - @ledgerhq/ledger-wallet-framework@3.3.0
  - @domain/api-aggregated-assets@0.5.0
  - @ledgerhq/live-countervalues@0.25.0
  - @ledgerhq/live-countervalues-react@0.17.0
  - @ledgerhq/coin-casper@3.3.0
  - @features/platform-currencies@0.8.0
  - @ledgerhq/wallet-analytics@0.4.0
  - @ledgerhq/live-currency-format@0.15.0
  - @features/platform-env@0.3.0
  - @ledgerhq/hw-ledger-key-ring-protocol@0.12.0
  - @features/flow-pay-bank-transfer@0.3.0
  - @features/flow-pay-card-auth@0.6.0
  - @shared/ui-queued-bottom-sheet@0.3.0
  - @features/platform-card@0.4.0
  - @features/flow-pay-feature-tour@0.5.0
  - @ledgerhq/coin-bitcoin@0.52.0
  - @features/flow-contacts-add-contact@0.5.1
  - @features/flow-contacts-delete-contact@0.2.1
  - @features/flow-pay-balance@0.4.1
  - @features/flow-pay-deposit@0.3.1
  - @features/platform-device-action-content@0.2.0
  - @features/platform-aggregated-assets@0.5.2
  - @ledgerhq/ledger-key-ring-protocol@0.21.2
  - @ledgerhq/live-dmk-mobile@0.29.7
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
  - @ledgerhq/live-wallet@1.1.2
  - @ledgerhq/coin-canton@1.1.1
  - @ledgerhq/coin-filecoin@2.1.1
  - @ledgerhq/coin-multiversx@1.1.1
  - @ledgerhq/coin-stacks@0.30.1
  - @ledgerhq/device-core@0.11.15
  - @ledgerhq/domain-service@1.8.18
  - @ledgerhq/live-signer-evm@0.23.1
  - @shared/ui-info-state@0.2.1
  - @shared/auth@0.6.0
  - @shared/cloud-sync@0.3.0
  - @shared/i18n@0.2.0
  - @shared/password-verifier@0.3.0
  - @devtools/shell@0.9.2
  - @features/flow-analytics-consent@0.2.5

## 4.20.0-next.4

### Minor Changes

- [#21833](https://github.com/LedgerHQ/ledger-live/pull/21833) [`8993c24`](https://github.com/LedgerHQ/ledger-live/commit/8993c242de8ed57617fb74ac9a3b1af047638914) Thanks [@koda-apps](https://github.com/apps/koda-apps)! - Fix walletsync feature flags (lldWalletSync, llmWalletSync) to default to the PROD environment instead of STAGING.

### Patch Changes

- Updated dependencies [[`8993c24`](https://github.com/LedgerHQ/ledger-live/commit/8993c242de8ed57617fb74ac9a3b1af047638914)]:
  - @shared/feature-flags@0.22.0-next.1
  - @devtools/bindings@0.7.0-next.1
  - @features/flow-contacts-add-address@0.4.0-next.1
  - @features/flow-large-screen-upsell@2.0.2-next.1
  - @features/platform-contacts@0.6.0-next.1
  - @features/platform-currencies@0.8.0-next.1
  - @features/platform-feature-flags@0.6.9-next.1
  - @features/flow-contacts@0.10.0-next.1
  - @features/flow-contacts-add-contact@0.5.1-next.1
  - @features/flow-contacts-delete-contact@0.2.1-next.1
  - @features/flow-contacts-edit-address@0.3.0-next.1
  - @features/flow-contacts-edit-contact@0.4.0-next.1
  - @features/flow-contacts-list@0.6.0-next.1
  - @features/flow-pay-contact@0.3.0-next.1
  - @features/flow-analytics-consent@0.2.5-next.1
  - @devtools/shell@0.9.2-next.1

## 4.20.0-next.3

### Minor Changes

- [#21854](https://github.com/LedgerHQ/ledger-live/pull/21854) [`6ad68ad`](https://github.com/LedgerHQ/ledger-live/commit/6ad68ad4358d6a1126f300c3855cab33a918c017) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(llc): update Arc mainnet native contract address

## 4.20.0-next.2

### Minor Changes

- [#21806](https://github.com/LedgerHQ/ledger-live/pull/21806) [`04445dc`](https://github.com/LedgerHQ/ledger-live/commit/04445dc07c17323d9c9bdeb2a5dac139d0ccd40a) Thanks [@henri-ly](https://github.com/henri-ly)! - Add missing changeset for Aleo bugfix LIVE-37189

## 4.20.0-next.1

### Minor Changes

- [#21746](https://github.com/LedgerHQ/ledger-live/pull/21746) [`c2e2276`](https://github.com/LedgerHQ/ledger-live/commit/c2e2276459d5e48e938145eb54bae572f5ae7a60) Thanks [@amaslakov](https://github.com/amaslakov)! - Add the error message shown when the protocol refuses a Tezos stake amount as too small

## 4.20.0-next.0

### Minor Changes

- [#21206](https://github.com/LedgerHQ/ledger-live/pull/21206) [`750bdd4`](https://github.com/LedgerHQ/ledger-live/commit/750bdd4bbaaf7a1c591c8a8f21479f6c64fc9c95) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Add mobile E2E for the post-onboarding hub mock flow (LIVE-31323).

- [#21042](https://github.com/LedgerHQ/ledger-live/pull/21042) [`d5e1c7d`](https://github.com/LedgerHQ/ledger-live/commit/d5e1c7d985b15adbe230e537e998af2dcf3cff8b) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Tell the two Hyperliquid account-picker states apart.

  The perps receiving step used one description for both states, so users who already had a Hyperliquid account were told to add one. It now reads "Select an account you want to deposit funds into to place your trades" when accounts exist, and keeps "To fund your perps, you need a Hyperliquid account.

- [#21515](https://github.com/LedgerHQ/ledger-live/pull/21515) [`7f4723c`](https://github.com/LedgerHQ/ledger-live/commit/7f4723cf1aa59ec55d172d27000fad438f4833c6) Thanks [@sarneijim](https://github.com/sarneijim)! - Bump Segment analytics SDKs for retry, rate-limit and security fixes (LIVE-35839)

- [#21237](https://github.com/LedgerHQ/ledger-live/pull/21237) [`db835f9`](https://github.com/LedgerHQ/ledger-live/commit/db835f9f8b91d7accdd0eea942339b3f71826470) Thanks [@vpenskyi-ledger](https://github.com/vpenskyi-ledger)! - Remove native navbar title on Select Quote page in Swap wallet40 header

- [#21355](https://github.com/LedgerHQ/ledger-live/pull/21355) [`fc74af8`](https://github.com/LedgerHQ/ledger-live/commit/fc74af8db6038afd89c64de356e67fe9ba4811a0) Thanks [@semeano](https://github.com/semeano)! - Offer the Zcash memo only to shielded recipients. A memo travels in a shielded output, so a transparent recipient could never receive one, yet the send flow showed the input for every Zcash address and made the user fill or skip it. Send descriptors can now distinguish static memo support from recipient-specific visibility, and a memo left over from an earlier shielded recipient is dropped when the recipient turns transparent, so it can no longer reach the transaction builder.

- [#21421](https://github.com/LedgerHQ/ledger-live/pull/21421) [`3d23fd4`](https://github.com/LedgerHQ/ledger-live/commit/3d23fd471fbb0ba76a0e6997eba995e190a89f7c) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add a first-time verify hint on mobile Pay Request, persisted once dismissed.

- [#21434](https://github.com/LedgerHQ/ledger-live/pull/21434) [`b7f83a1`](https://github.com/LedgerHQ/ledger-live/commit/b7f83a1c1818e4eff9ffbf19796a71d7242fd5b4) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add persisted Pay Request verify-hint state in `@features/flow-pay-request`.

- [#21367](https://github.com/LedgerHQ/ledger-live/pull/21367) [`d182d46`](https://github.com/LedgerHQ/ledger-live/commit/d182d466275f4c35ec3bf86cadf544de77c27058) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix the Ledger Sync entry point from Contacts: align the introduction copy and artwork with the production design, only show it when the user actually tries to add a contact or an address, start the flow on "Choose your sync method", and return to Contacts instead of the Portfolio once the flow is done on Mobile.

- [#21470](https://github.com/LedgerHQ/ledger-live/pull/21470) [`5b79eb3`](https://github.com/LedgerHQ/ledger-live/commit/5b79eb3c5b1e2e7aca86fb0a8c4b7af085e57f9d) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix the Contacts add address flow stalling on Continue by only offering networks the device can register an address on: EVM networks running their own coin app, such as Ethereum Classic, Sonic and Sei, are no longer selectable

- [#21431](https://github.com/LedgerHQ/ledger-live/pull/21431) [`c06bd2e`](https://github.com/LedgerHQ/ledger-live/commit/c06bd2ee99e9d76609d628a41698a16c37a0c0c7) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix the extra left padding on the address field of the Mobile add address and edit address drawers. Both screens render the address without the "To:" prefix, but Lumen's AddressInput mounts its prefix even when empty, so the prefix still took a slot in the field's inner gap and pushed the address 8px to the right. Add address now drops that gap and keeps the spacing only between the address and the trailing QR code icon, and edit address, which has no trailing icon, uses a plain TextInput instead.

- [#21543](https://github.com/LedgerHQ/ledger-live/pull/21543) [`eea933c`](https://github.com/LedgerHQ/ledger-live/commit/eea933c21039eab89442a4caae6cf0e121f68cca) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix the trash icon of the contact "Delete contact" action rendering white instead of red.

- [#21587](https://github.com/LedgerHQ/ledger-live/pull/21587) [`46b51dd`](https://github.com/LedgerHQ/ledger-live/commit/46b51ddabe0689bc64b598bcb33f131f4b1c2a22) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix the Contacts feature introduction so closing it counts as seen and keeps you on the Contacts list, instead of navigating back and reopening the introduction on the next visit.

- [#21592](https://github.com/LedgerHQ/ledger-live/pull/21592) [`9e0d7eb`](https://github.com/LedgerHQ/ledger-live/commit/9e0d7eb43bfcfee06ccfa566f131dec9dd2118f6) Thanks [@koda-apps](https://github.com/apps/koda-apps)! - Fix misaligned "Maybe later" link on the notifications opt-in prompt drawer

- [#21393](https://github.com/LedgerHQ/ledger-live/pull/21393) [`406f56f`](https://github.com/LedgerHQ/ledger-live/commit/406f56fee95db771054d2d7b0efe18990f8eb231) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Align the content card tag and dismiss cross with their desktop counterparts by using the Lumen UI Tag and InteractiveIcon components.

- [#21026](https://github.com/LedgerHQ/ledger-live/pull/21026) [`4f514c9`](https://github.com/LedgerHQ/ledger-live/commit/4f514c97491277ea63524e299904fe5e5711d897) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Store a scrypt verifier instead of the password itself. Confirming a password now derives a digest and persists `{version, scrypt, salt, digest}` in the keychain, so nothing that can be replayed as a password is kept anywhere.

  The protection state lands with it: two independent flags plus a session lock, keyed off "any protection is enabled" rather than on having a password, which is the coupling that makes biometrics-only impossible today.

  Ordering is the safety argument throughout — the whole verifier is one keychain item, so an interrupted write leaves the previous verifier or none, never a half-written pairing, and the state flips only once the write has landed. Derivations are serialised: two concurrent setups would otherwise interleave and store a verifier whose salt belongs to the other run.

  The password field also gains a length cap. It sits far above anything anyone types, and exists because deriving a digest is deliberately slow.

- [#21401](https://github.com/LedgerHQ/ledger-live/pull/21401) [`8c40cc1`](https://github.com/LedgerHQ/ledger-live/commit/8c40cc1c2054d12fc546e341a18e966d6ab23986) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Skip the extra confirmation modal when editing a contact or address name. Apply changes now starts the device action directly when needed, and the Apply CTA shows the Ledger logo in that case.

- [#21440](https://github.com/LedgerHQ/ledger-live/pull/21440) [`0089a4b`](https://github.com/LedgerHQ/ledger-live/commit/0089a4b80512c2c8f8eb3a03b9e3245492380647) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Drive Contacts add-address confirmation through the Device Intent Executor instead of mocked Continue screens, including prefill and Send entry points.

- [#21599](https://github.com/LedgerHQ/ledger-live/pull/21599) [`e601584`](https://github.com/LedgerHQ/ledger-live/commit/e6015847b44e86dd9c4733559d591874099e1f4e) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Pin the Contacts feature introduction CTA to the bottom of the mobile sheet

- [#21277](https://github.com/LedgerHQ/ledger-live/pull/21277) [`37dde9f`](https://github.com/LedgerHQ/ledger-live/commit/37dde9f9343769c63078aa82a955048a4f631e98) Thanks [@sarneijim](https://github.com/sarneijim)! - Log Segment identify calls (enqueued or failed) in the mobile analytics debug overlay

- [#21606](https://github.com/LedgerHQ/ledger-live/pull/21606) [`000eac0`](https://github.com/LedgerHQ/ledger-live/commit/000eac03eacf0093f241f8a05d9f525bbcf5de13) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Fix missing 8px spacing between items in the mobile contacts list

- [#21526](https://github.com/LedgerHQ/ledger-live/pull/21526) [`4494817`](https://github.com/LedgerHQ/ledger-live/commit/44948173b1b1d90adcb1bf833194054871f2f542) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Open the contact address sheet from the Pay strip and continue to MAD with the chosen recipient.

- [#21418](https://github.com/LedgerHQ/ledger-live/pull/21418) [`60ee73c`](https://github.com/LedgerHQ/ledger-live/commit/60ee73c7b89b101dde708a04ded260341ef86d44) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Rename `CARD_API_URL` to `CARD_BAANX_API_URL`, keep the production defaults, and drop the Env vars section from the Card / Pay DevTool.

- [#21551](https://github.com/LedgerHQ/ledger-live/pull/21551) [`727b9e5`](https://github.com/LedgerHQ/ledger-live/commit/727b9e5d40ebec83366a2dd7939713a1adc874a9) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Register and persist the card onboarding widget state in Ledger Wallet Mobile.

- [#21610](https://github.com/LedgerHQ/ledger-live/pull/21610) [`6b47659`](https://github.com/LedgerHQ/ledger-live/commit/6b4765929e98abbcb08cd5348fddb528a9e674e7) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add native card onboarding widget on mobile with Apple/Google Pay step and wallet persistence

- [#21619](https://github.com/LedgerHQ/ledger-live/pull/21619) [`23d2e1e`](https://github.com/LedgerHQ/ledger-live/commit/23d2e1e0a0a83516fb9f5c12f54a2afc15208702) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Keep mobile contact address detail action buttons full width by applying horizontal padding only to the summary.

- [#21248](https://github.com/LedgerHQ/ledger-live/pull/21248) [`9672658`](https://github.com/LedgerHQ/ledger-live/commit/967265820c38ad0b2f8f45fd0a892ca07c58d23a) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Edit an external address on the device from Contacts. The device intent now calls `@ledgerhq/device-contacts-kit`'s `ContactsManager.editExternalAddressIdentifier()` and `ContactsManager.editExternalAddressScope()`, each returning the rotated address proof to persist while the group's name proof passes through untouched, and both apps render the confirmation step and one `InfoState` per failure.

  The device serves address and label edits as two separate commands, so an edit changing both asks the user to confirm twice, showing the same waiting screen for each step rather than numbering them. Nothing partial is ever stored: an abandoned or rejected edit leaves the record untouched, and a retry restarts the whole chain.

- [#21609](https://github.com/LedgerHQ/ledger-live/pull/21609) [`094e919`](https://github.com/LedgerHQ/ledger-live/commit/094e919fdfc117164f41c48d0c40bff7d4e84609) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Use the horizontal more icon on the mobile contact detail page

- [#21247](https://github.com/LedgerHQ/ledger-live/pull/21247) [`a55d4ca`](https://github.com/LedgerHQ/ledger-live/commit/a55d4ca3a804f6ab27f039926255f2c410ef7221) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Rename a contact on the device from Contacts. The device intent now calls `@ledgerhq/device-contacts-kit`'s `ContactsManager.renameContact()`, which returns the rotated name proof to persist, and both apps render the confirmation step and one `InfoState` per failure. A rejection keeps the job open so the user can retry on the same device.

  Rename is a blockchain-agnostic dashboard operation, so it initializes on the dashboard (`BOLOS`) rather than a coin app: a contact with no address is renameable, and an outdated device surfaces as an OS-update screen instead of an app-update one.

- [#21351](https://github.com/LedgerHQ/ledger-live/pull/21351) [`51c44eb`](https://github.com/LedgerHQ/ledger-live/commit/51c44eb2f189217b4da350680333b3dcbaa4c196) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Wire the contacts device intents in the remaining add address flows: adding an external address from the new send flow now goes through the Device Intent Executor instead of the mocked device intents port. The calling drawer closes so the executor can take the queue, and the add address flow closes as it hands the review over to the device

- [#21490](https://github.com/LedgerHQ/ledger-live/pull/21490) [`c5dfbed`](https://github.com/LedgerHQ/ledger-live/commit/c5dfbed0b111cbe375b0d83f35e64c7a06d14267) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(send): picking a contact on the recipient step now goes straight to the amount step, matching desktop

- [#21487](https://github.com/LedgerHQ/ledger-live/pull/21487) [`b7d0367`](https://github.com/LedgerHQ/ledger-live/commit/b7d03671db1aa022d3ff375465c7d8470bf2b215) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop `disableCountervalue` from `CryptoCurrency`. Nothing read it on a crypto currency; it stays on `TokenCurrency`, where the assets API drives it, and on `FiatCurrency`.

- [#21492](https://github.com/LedgerHQ/ledger-live/pull/21492) [`f8dc454`](https://github.com/LedgerHQ/ledger-live/commit/f8dc454c962d991346c813e557f42c2fb78491a7) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Add a `provider-row-<name>` testID to the Cosmos family validator row so automation can select a validator explicitly, which Osmosis now requires since it has no pre-selected Ledger validator

- [#21223](https://github.com/LedgerHQ/ledger-live/pull/21223) [`e92cf97`](https://github.com/LedgerHQ/ledger-live/commit/e92cf9742f7d910dea79ca848494b3870b2ae254) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Route Casper through the generic coin-framework bridge (LIVE-35912/35914/35915).

  - `coin-casper`: `createApi()` now returns a `CoinModuleImpl` (dropping the throwing stubs for unsupported capabilities; `withDefaults` fills them). `craftTransactionData` delegates to the framework helper. `getTransferIdFromMemo` bridges the legacy `StringMemo<"transferId">` shape and the new `{type:"transferId"}` framework shape until LIVE-35735 unifies them.
  - `live-common`: Casper added to `genericCoinFrameworkFamilies.json`; LiveConfig key `config_casper_generic_bridge` (default `true`) provides a runtime kill-switch to fall back to the legacy bridge without a deploy.
  - Desktop/Mobile: `useTransferIdChange` hook extracted and shared between `MemoField` / `TransferIdField` / `MemoTagInput` / `ScreenEditTransferId`; now writes both `transferId` (legacy bridge) and `memoType`/`memoValue` (generic path) so both bridges read the same user input correctly.

- [#21135](https://github.com/LedgerHQ/ledger-live/pull/21135) [`2566c81`](https://github.com/LedgerHQ/ledger-live/commit/2566c8111c3818418a2ac3b4397abb8cccf6db36) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Consolidate mobile Braze Content Card refreshes under one lifecycle provider

- [#21513](https://github.com/LedgerHQ/ledger-live/pull/21513) [`9dd7db0`](https://github.com/LedgerHQ/ledger-live/commit/9dd7db0d81362a5d019cd0830bdd336a1f42e7af) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add a Pay success screen to the Send flow. When the flow is launched from the Pay tab and the transaction succeeds, it now routes to a dedicated `PAY_SUCCESS` step that shows the recipient, amount, source account (with network icon) and a link to the transaction details, instead of the standard confirmation step. Exposes a presentational `PaySuccess` component from `@features/flow-pay-contact` and wires it in ledger-live-desktop via an MVVM `PaySuccessScreen` + `usePaySuccessViewModel`.

- [#21372](https://github.com/LedgerHQ/ledger-live/pull/21372) [`961792b`](https://github.com/LedgerHQ/ledger-live/commit/961792b84469e81b8b2160a9bb1db08a2c9a1781) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Gate the Pay tab contacts section behind the contacts feature flag (lwdContacts on desktop, lwmContacts on mobile)

- [#21332](https://github.com/LedgerHQ/ledger-live/pull/21332) [`08201e0`](https://github.com/LedgerHQ/ledger-live/commit/08201e0c9e14ed5436972d544bffc7484fad3703) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(send): open the MAD for the new send flow on LWM

- [#21305](https://github.com/LedgerHQ/ledger-live/pull/21305) [`7aca4c8`](https://github.com/LedgerHQ/ledger-live/commit/7aca4c8a806ab270cd990d63b1c651e443b7e149) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - refactor: drop the Hedera preload layer now that no consumer reads it, and fold useHederaEnrichedDelegationV2 back into useHederaEnrichedDelegation

- [#21304](https://github.com/LedgerHQ/ledger-live/pull/21304) [`17862f6`](https://github.com/LedgerHQ/ledger-live/commit/17862f681b8a9a1d14c4fd50924a0dfc7de79949) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - refactor: read Hedera staking validators through an on-demand query on mobile, with loading and fetch-error states

- [#21358](https://github.com/LedgerHQ/ledger-live/pull/21358) [`6561cf0`](https://github.com/LedgerHQ/ledger-live/commit/6561cf003713ab65533bb9476771c0de9b19e634) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - refactor: serve the Hedera validators list from an RTK Query api instead of React Query

- [#21528](https://github.com/LedgerHQ/ledger-live/pull/21528) [`2744267`](https://github.com/LedgerHQ/ledger-live/commit/2744267da72f342ca2dc67d95f34d512d7f4c7f6) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Open Pay New on a dedicated contact list, including people with no address.

- [#21616](https://github.com/LedgerHQ/ledger-live/pull/21616) [`5e971b5`](https://github.com/LedgerHQ/ledger-live/commit/5e971b55429cdcab0f69825ce2056fef24d30215) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Migrate `BIG_NUMBER_DECIMAL_PLACES` off `@ledgerhq/live-env`: every call site now inlines the constant and the definition is removed. `@ledgerhq/live-currency-format` drops its `@ledgerhq/live-env` dependency altogether.

- [#21557](https://github.com/LedgerHQ/ledger-live/pull/21557) [`0122aa8`](https://github.com/LedgerHQ/ledger-live/commit/0122aa87e4b5d651b25b29d941275fd33adb2cae) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Title the pay-contact MAD account step “Select account to pay from”.

- [#21474](https://github.com/LedgerHQ/ledger-live/pull/21474) [`54351c2`](https://github.com/LedgerHQ/ledger-live/commit/54351c2f7501362c9323fd835e21b2db37d6b4cd) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Group unavailable assets and networks under a "Not available yet" section in the asset and network selection lists

- [#21636](https://github.com/LedgerHQ/ledger-live/pull/21636) [`d3b658b`](https://github.com/LedgerHQ/ledger-live/commit/d3b658bb5a051a33647e3c5d752f441d610f1256) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - add freeze to mobile

- [#21483](https://github.com/LedgerHQ/ledger-live/pull/21483) [`a35c7b9`](https://github.com/LedgerHQ/ledger-live/commit/a35c7b900ce39bdd69895514f983ae9ad087562a) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(send): the send recipient AddressInput taking then losing the keyboard,it now only focuses once the step shows nothing at all, not when contacts are in the list

- [#21345](https://github.com/LedgerHQ/ledger-live/pull/21345) [`07410d0`](https://github.com/LedgerHQ/ledger-live/commit/07410d015aec7f516b2c63ace3e2a419cc04f96d) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Add MINA staking (delegation) support to Ledger Live Mobile

- [#21283](https://github.com/LedgerHQ/ledger-live/pull/21283) [`761cf3e`](https://github.com/LedgerHQ/ledger-live/commit/761cf3e359fa197d07f6086d8522fd1785ba575d) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - add earn banner to success transation modal

- [#21359](https://github.com/LedgerHQ/ledger-live/pull/21359) [`36ea18d`](https://github.com/LedgerHQ/ledger-live/commit/36ea18d4f36c757bc6901bfc258af2f11b8ee00d) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Route the Noah webview to signup or signin when noahAuth is set (LIVE-35383).

- [#21450](https://github.com/LedgerHQ/ledger-live/pull/21450) [`4bc8559`](https://github.com/LedgerHQ/ledger-live/commit/4bc8559bb8ca25631eabb4cc1845935076cffc04) Thanks [@sarneijim](https://github.com/sarneijim)! - Make the notifications prompt debug screen QA-readable with named scenarios, plain-English verdicts and an in-place drawer preview (LIVE-35955)

- [#21298](https://github.com/LedgerHQ/ledger-live/pull/21298) [`91bae2a`](https://github.com/LedgerHQ/ledger-live/commit/91bae2a0cf5af0f407b4d797b023d07e4ba95fbf) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Present the Pay cash-to-stable intro as a mobile bottom sheet, then hand off create/login to Noah (LIVE-35382).

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

- [#21564](https://github.com/LedgerHQ/ledger-live/pull/21564) [`c92234c`](https://github.com/LedgerHQ/ledger-live/commit/c92234c533e415678787d4cec6512f01ae7a5ed7) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Open Pay see-all on the Pay contact list (Me, A–Z, add) instead of MyWallet Contacts

- [#21380](https://github.com/LedgerHQ/ledger-live/pull/21380) [`59ea8fb`](https://github.com/LedgerHQ/ledger-live/commit/59ea8fbd36754199f1c68ab53537460ca31c70b4) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(cosmos): remove Ledger validator as the default one for Osmosis

- [#21496](https://github.com/LedgerHQ/ledger-live/pull/21496) [`9e93f16`](https://github.com/LedgerHQ/ledger-live/commit/9e93f16593ffb9ef2658b107cdcceed5d032f2a7) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(tracking): add tracking contact send flow lwm

- [#21353](https://github.com/LedgerHQ/ledger-live/pull/21353) [`f3de6fb`](https://github.com/LedgerHQ/ledger-live/commit/f3de6fb6b1c7fe5fbb57a8dd7cbea7899eb2d45d) Thanks [@jeportie](https://github.com/jeportie)! - Clean up mobile E2E Allure after-hook attachments: filter network noise, failure-only feature flags, warn/error-only console logs, aligned attachment names

- [#21555](https://github.com/LedgerHQ/ledger-live/pull/21555) [`a83aff5`](https://github.com/LedgerHQ/ledger-live/commit/a83aff5f46332fcde6c0792a71a1b2ac9738d583) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Open Send recipient from the amount header instead of leaving to Pay.

- [#21240](https://github.com/LedgerHQ/ledger-live/pull/21240) [`1cb4dbe`](https://github.com/LedgerHQ/ledger-live/commit/1cb4dbe4a9b0d556768c3ce18d17eb08935e518f) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Persist Solana `stakingResources` through the generic coin framework, and revive accounts still holding the legacy `solanaResources` blob

- [#21605](https://github.com/LedgerHQ/ledger-live/pull/21605) [`39115cb`](https://github.com/LedgerHQ/ledger-live/commit/39115cbf86afe42c8c71acdf18e1f6f990587410) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Fix app crash on the first APDU exchange over USB HID in minified Android builds

- [#21194](https://github.com/LedgerHQ/ledger-live/pull/21194) [`2bd6a1c`](https://github.com/LedgerHQ/ledger-live/commit/2bd6a1c4b9d0cd229a8c9207108672b1a580968a) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Refresh Baanx Pay Card sessions after a 401, and keep the credentials out of every reader of redux.

  The two OAuth2 grants are RTK Query endpoints again. Both opt out of the Bearer and out of the
  renewal, both run with `track: false`, so no session becomes a cache entry, and neither has a hook.

  The desktop redux logger and both DevTools configurations now strip every Card action, which also
  closes a live leak: the code exchange logs its code and its code verifier in production, into the
  file users attach to a support ticket.

- [#21373](https://github.com/LedgerHQ/ledger-live/pull/21373) [`d54d191`](https://github.com/LedgerHQ/ledger-live/commit/d54d19127a958bb0ac8c9c479bba716ce67041ff) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Update the Pay feature tour copy, icons, and hero to match mockups (LIVE-36497).

- [#21522](https://github.com/LedgerHQ/ledger-live/pull/21522) [`64a7c3c`](https://github.com/LedgerHQ/ledger-live/commit/64a7c3cc25b2ba00ba36dd259928dcf40cec8569) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Open the contact address sheet from Send recipient.

- [#21527](https://github.com/LedgerHQ/ledger-live/pull/21527) [`f7fad4d`](https://github.com/LedgerHQ/ledger-live/commit/f7fad4de2815be6f800da4611fed2e0aa5b989a0) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Open the contact address sheet from Pay see-all with the title Pay contact.

- [#21430](https://github.com/LedgerHQ/ledger-live/pull/21430) [`5b546c5`](https://github.com/LedgerHQ/ledger-live/commit/5b546c55ca622f74ae06b867c5118e19009f80a5) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Remove unused PrefillAddAddressFlowRoot and the shared prefill listener store. Send now owns the prefilled add-address session via startWithPrefilled.

- [#21439](https://github.com/LedgerHQ/ledger-live/pull/21439) [`90ba96b`](https://github.com/LedgerHQ/ledger-live/commit/90ba96bcf6c96f698d168b75f02dc5a83b92cfbe) Thanks [@semeano](https://github.com/semeano)! - Add missing label for transaction inputs

- [#21650](https://github.com/LedgerHQ/ledger-live/pull/21650) [`349c522`](https://github.com/LedgerHQ/ledger-live/commit/349c522bb86bba744844d80d8521c6d24974d26a) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Add an error message for `UnexpectedGetBalanceError`

  `@ledgerhq/coin-tezos` reports this error when a token balance cannot be retrieved, so Send Max
  no longer claims the account has insufficient funds during an indexer outage. Without a
  translation the send flow fell back to rendering the raw error name.

- [#21392](https://github.com/LedgerHQ/ledger-live/pull/21392) [`2df85eb`](https://github.com/LedgerHQ/ledger-live/commit/2df85ebe83b802749be7f8698008d118fbede53f) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(send): add skip memo screen in the send flow

- [#21645](https://github.com/LedgerHQ/ledger-live/pull/21645) [`cf71736`](https://github.com/LedgerHQ/ledger-live/commit/cf717368749338fe457f280cbc219fd832b022e3) Thanks [@henri-ly](https://github.com/henri-ly)! - fix(send): stop reading the send-flow contexts from `SigningBody`

  `SigningBody` renders inside the signature bottom sheet, whose children are mounted by a portal at
  the app root — outside `SendFlowProvider`. Reading the send-flow contexts from there threw
  `useSendFlowData must be used within a SendFlowProvider` and crashed the app on the device-signing
  step. The tracking properties and the recipient type are now passed down from
  `SignatureDeviceActionView`, which sits in the send-flow tree.

- [#21326](https://github.com/LedgerHQ/ledger-live/pull/21326) [`9fb98ab`](https://github.com/LedgerHQ/ledger-live/commit/9fb98ab74e3ca680e686a302b9beaa460a087783) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Drive the XRP app through the Device Management Kit behind the `ldmkXrpSigner` feature flag, keeping `hw-app-xrp` as the fallback

### Patch Changes

- Updated dependencies [[`7c6a8de`](https://github.com/LedgerHQ/ledger-live/commit/7c6a8de98093e274de57e9ee94c6179541e2120c), [`8f8f1a4`](https://github.com/LedgerHQ/ledger-live/commit/8f8f1a472b5c6142d3ddf682fbc5d991c720aa92), [`81aa729`](https://github.com/LedgerHQ/ledger-live/commit/81aa7294c94ef114e6e82ec4c277f0a6c0038c92), [`3d23fd4`](https://github.com/LedgerHQ/ledger-live/commit/3d23fd471fbb0ba76a0e6997eba995e190a89f7c), [`b7f83a1`](https://github.com/LedgerHQ/ledger-live/commit/b7f83a1c1818e4eff9ffbf19796a71d7242fd5b4), [`c270975`](https://github.com/LedgerHQ/ledger-live/commit/c2709750e007b758fa13f0f717efa897fcc6235d), [`d182d46`](https://github.com/LedgerHQ/ledger-live/commit/d182d466275f4c35ec3bf86cadf544de77c27058), [`5b79eb3`](https://github.com/LedgerHQ/ledger-live/commit/5b79eb3c5b1e2e7aca86fb0a8c4b7af085e57f9d), [`c06bd2e`](https://github.com/LedgerHQ/ledger-live/commit/c06bd2ee99e9d76609d628a41698a16c37a0c0c7), [`eea933c`](https://github.com/LedgerHQ/ledger-live/commit/eea933c21039eab89442a4caae6cf0e121f68cca), [`3b0dbae`](https://github.com/LedgerHQ/ledger-live/commit/3b0dbae4ae5df48bd4eb58146675747d7e3593c2), [`4f514c9`](https://github.com/LedgerHQ/ledger-live/commit/4f514c97491277ea63524e299904fe5e5711d897), [`47a1cd0`](https://github.com/LedgerHQ/ledger-live/commit/47a1cd082cc30cd7cc539a8eb0e0fe5466128533), [`8c40cc1`](https://github.com/LedgerHQ/ledger-live/commit/8c40cc1c2054d12fc546e341a18e966d6ab23986), [`0089a4b`](https://github.com/LedgerHQ/ledger-live/commit/0089a4b80512c2c8f8eb3a03b9e3245492380647), [`e601584`](https://github.com/LedgerHQ/ledger-live/commit/e6015847b44e86dd9c4733559d591874099e1f4e), [`000eac0`](https://github.com/LedgerHQ/ledger-live/commit/000eac03eacf0093f241f8a05d9f525bbcf5de13), [`60ee73c`](https://github.com/LedgerHQ/ledger-live/commit/60ee73c7b89b101dde708a04ded260341ef86d44), [`ef29f07`](https://github.com/LedgerHQ/ledger-live/commit/ef29f0711ecec104e4dd9c9d86d4e4d41c4ddee3), [`55bd216`](https://github.com/LedgerHQ/ledger-live/commit/55bd2166238ab3e03c33226bb5f5eb2e8646a818), [`6ed1820`](https://github.com/LedgerHQ/ledger-live/commit/6ed1820776ca6ba59e861da11e4582af406b2188), [`6b47659`](https://github.com/LedgerHQ/ledger-live/commit/6b4765929e98abbcb08cd5348fddb528a9e674e7), [`b1b1e38`](https://github.com/LedgerHQ/ledger-live/commit/b1b1e38d2a8311f935f30c185276c165a6992dbc), [`3a78322`](https://github.com/LedgerHQ/ledger-live/commit/3a783224b6016fce08fa8cb3254057b75882e2c5), [`2b8a4e4`](https://github.com/LedgerHQ/ledger-live/commit/2b8a4e4240a414cbb1bda31b97b70837cb6ac3fe), [`92b90a6`](https://github.com/LedgerHQ/ledger-live/commit/92b90a6eebca959abe0b04aa83c5799d34f9f10a), [`23d2e1e`](https://github.com/LedgerHQ/ledger-live/commit/23d2e1e0a0a83516fb9f5c12f54a2afc15208702), [`9672658`](https://github.com/LedgerHQ/ledger-live/commit/967265820c38ad0b2f8f45fd0a892ca07c58d23a), [`a55d4ca`](https://github.com/LedgerHQ/ledger-live/commit/a55d4ca3a804f6ab27f039926255f2c410ef7221), [`147a290`](https://github.com/LedgerHQ/ledger-live/commit/147a2905d735eee5682d849b3e2c2cde5178f7bb), [`6ccfc64`](https://github.com/LedgerHQ/ledger-live/commit/6ccfc644e6b5c00e2e0bafb10e8519a09d7fb589), [`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d), [`2d42e64`](https://github.com/LedgerHQ/ledger-live/commit/2d42e647d55f79cf2eb821ec30a232cc07891219), [`b7d0367`](https://github.com/LedgerHQ/ledger-live/commit/b7d03671db1aa022d3ff375465c7d8470bf2b215), [`e42c12a`](https://github.com/LedgerHQ/ledger-live/commit/e42c12a392ba60ee839c9a71f4f0d409ad9430fa), [`eb62268`](https://github.com/LedgerHQ/ledger-live/commit/eb622688cb7561882cd02b52c2eed569d5dc68f3), [`bed4fe7`](https://github.com/LedgerHQ/ledger-live/commit/bed4fe75210412872bd6c83189ab502b0e1cab24), [`a9e389f`](https://github.com/LedgerHQ/ledger-live/commit/a9e389fc59ca30abf53d0ba8decc6290752ba1db), [`e92cf97`](https://github.com/LedgerHQ/ledger-live/commit/e92cf9742f7d910dea79ca848494b3870b2ae254), [`5f6b8a8`](https://github.com/LedgerHQ/ledger-live/commit/5f6b8a88709d1fd4a94fccaaab915d5ad322c584), [`9dd7db0`](https://github.com/LedgerHQ/ledger-live/commit/9dd7db0d81362a5d019cd0830bdd336a1f42e7af), [`5b7d11d`](https://github.com/LedgerHQ/ledger-live/commit/5b7d11dd9a988f0034b4b5b6168f02429ba5a406), [`ebb1371`](https://github.com/LedgerHQ/ledger-live/commit/ebb13714a6de9c39f290b2ccd51ca78370824f6f), [`53dcdc9`](https://github.com/LedgerHQ/ledger-live/commit/53dcdc9bbef2324b48fac7469c2c1d0e66f7361f), [`2744267`](https://github.com/LedgerHQ/ledger-live/commit/2744267da72f342ca2dc67d95f34d512d7f4c7f6), [`5e971b5`](https://github.com/LedgerHQ/ledger-live/commit/5e971b55429cdcab0f69825ce2056fef24d30215), [`b7a8906`](https://github.com/LedgerHQ/ledger-live/commit/b7a89064587bbcd1f758f7b6205a616225ac2317), [`5db7a7d`](https://github.com/LedgerHQ/ledger-live/commit/5db7a7dc517bb23d12532ae07cc947eddff6c10e), [`761cf3e`](https://github.com/LedgerHQ/ledger-live/commit/761cf3e359fa197d07f6086d8522fd1785ba575d), [`36ea18d`](https://github.com/LedgerHQ/ledger-live/commit/36ea18d4f36c757bc6901bfc258af2f11b8ee00d), [`ac0311e`](https://github.com/LedgerHQ/ledger-live/commit/ac0311e70c2aabb091a0e4d32deaf1cf6e849a5a), [`91bae2a`](https://github.com/LedgerHQ/ledger-live/commit/91bae2a0cf5af0f407b4d797b023d07e4ba95fbf), [`08ee05c`](https://github.com/LedgerHQ/ledger-live/commit/08ee05cfb66f393b14fdf1377ed6c54c4831a87c), [`d6b290b`](https://github.com/LedgerHQ/ledger-live/commit/d6b290b37b8ad6f677ab382bef53bf05cd394ca2), [`0a02a32`](https://github.com/LedgerHQ/ledger-live/commit/0a02a325f99033c086864b0778a8f81c3b4178ae), [`66c7569`](https://github.com/LedgerHQ/ledger-live/commit/66c7569dcfae90739b369ffb3a92cee75dd2e9cd), [`543b17d`](https://github.com/LedgerHQ/ledger-live/commit/543b17d7a6b49728001c0311c184c665e8c9bbb2), [`a7d54c0`](https://github.com/LedgerHQ/ledger-live/commit/a7d54c0d6af65abe7aa2170053b3fd07ae9b05ab), [`c3de11c`](https://github.com/LedgerHQ/ledger-live/commit/c3de11cdf58c4feac701435548bbb96819ae09f6), [`3de7317`](https://github.com/LedgerHQ/ledger-live/commit/3de7317d858c570600eb0a4297876327fdc2c7b5), [`d60ce38`](https://github.com/LedgerHQ/ledger-live/commit/d60ce38581fe06b7f4fa72ba40259af2eabfe11f), [`7aa3071`](https://github.com/LedgerHQ/ledger-live/commit/7aa3071a532c98804a4357ff36a001b23351da73), [`faa8ef1`](https://github.com/LedgerHQ/ledger-live/commit/faa8ef11055a27af3eb7bcf1b662e8bf5c3da77d), [`8dd19d9`](https://github.com/LedgerHQ/ledger-live/commit/8dd19d9f9e936c0e0fbae5636c856ea681ec4197), [`2fe4ef6`](https://github.com/LedgerHQ/ledger-live/commit/2fe4ef6fabb69dbbb38f4bf8517e7d52f9b35b43), [`80b27a1`](https://github.com/LedgerHQ/ledger-live/commit/80b27a1349db33bbd7ba3b96aef5260853916bd2), [`59ea8fb`](https://github.com/LedgerHQ/ledger-live/commit/59ea8fbd36754199f1c68ab53537460ca31c70b4), [`3ea6abc`](https://github.com/LedgerHQ/ledger-live/commit/3ea6abc7a12a27650caf47551e328ab38c9308d6), [`a6193dc`](https://github.com/LedgerHQ/ledger-live/commit/a6193dcf861890977c3f36dc8b1618c4403dae75), [`30619aa`](https://github.com/LedgerHQ/ledger-live/commit/30619aaa2af784fd917214bb0e4bbd092f883e11), [`08ae9c2`](https://github.com/LedgerHQ/ledger-live/commit/08ae9c2bf7b2b509fa23d9b4bf33360f18f7f39f), [`2bd6a1c`](https://github.com/LedgerHQ/ledger-live/commit/2bd6a1c4b9d0cd229a8c9207108672b1a580968a), [`d54d191`](https://github.com/LedgerHQ/ledger-live/commit/d54d19127a958bb0ac8c9c479bba716ce67041ff), [`5b546c5`](https://github.com/LedgerHQ/ledger-live/commit/5b546c55ca622f74ae06b867c5118e19009f80a5), [`54124e4`](https://github.com/LedgerHQ/ledger-live/commit/54124e435c7adc3a2c3a9ed6cd1865fc68fa2584), [`a19ffef`](https://github.com/LedgerHQ/ledger-live/commit/a19ffeff9dd4e173890d75d8634a33e53cc5a5d0), [`0152cad`](https://github.com/LedgerHQ/ledger-live/commit/0152cade87e061bb2b56fd71f8a404c3dfed21e0), [`9fb98ab`](https://github.com/LedgerHQ/ledger-live/commit/9fb98ab74e3ca680e686a302b9beaa460a087783), [`018ee9b`](https://github.com/LedgerHQ/ledger-live/commit/018ee9bdcb993a1b4a203d5664676f7e757b3785)]:
  - @ledgerhq/transaction-observability@0.3.0-next.0
  - @features/flow-pay-contact@0.3.0-next.0
  - @devtools/bindings@0.7.0-next.0
  - @features/flow-pay-request@0.4.0-next.0
  - @features/flow-contacts-introduction@1.1.0-next.0
  - @features/flow-contacts@0.10.0-next.0
  - @features/platform-contacts@0.6.0-next.0
  - @features/flow-contacts-add-address@0.4.0-next.0
  - @features/flow-contacts-edit-address@0.3.0-next.0
  - @features/platform-app-lock@0.3.0-next.0
  - @features/flow-app-lock@0.3.0-next.0
  - @ledgerhq/coin-concordium@1.2.0-next.0
  - @features/flow-contacts-edit-contact@0.4.0-next.0
  - @features/flow-contacts-list@0.6.0-next.0
  - @shared/env@0.6.0-next.0
  - @shared/api-services@0.7.0-next.0
  - @domain/api-card-management@0.5.0-next.0
  - @features/flow-pay-card@0.3.0-next.0
  - @features/flow-pay-card-widget@0.2.0-next.0
  - @ledgerhq/coin-cosmos@1.2.0-next.0
  - @domain/entity-currency-crypto@0.12.0-next.0
  - @ledgerhq/types-live@6.123.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.3.0-next.0
  - @domain/api-aggregated-assets@0.5.0-next.0
  - @ledgerhq/live-countervalues@0.25.0-next.0
  - @ledgerhq/live-countervalues-react@0.17.0-next.0
  - @ledgerhq/coin-casper@3.3.0-next.0
  - @shared/feature-flags@0.22.0-next.0
  - @features/platform-currencies@0.8.0-next.0
  - @ledgerhq/wallet-analytics@0.4.0-next.0
  - @ledgerhq/live-currency-format@0.15.0-next.0
  - @features/platform-env@0.3.0-next.0
  - @ledgerhq/hw-ledger-key-ring-protocol@0.12.0-next.0
  - @features/flow-pay-bank-transfer@0.3.0-next.0
  - @features/flow-pay-card-auth@0.6.0-next.0
  - @shared/ui-queued-bottom-sheet@0.3.0-next.0
  - @features/platform-card@0.4.0-next.0
  - @features/flow-pay-feature-tour@0.5.0-next.0
  - @ledgerhq/coin-bitcoin@0.52.0-next.0
  - @features/flow-contacts-add-contact@0.5.1-next.0
  - @features/flow-contacts-delete-contact@0.2.1-next.0
  - @features/flow-pay-balance@0.4.1-next.0
  - @features/flow-pay-deposit@0.3.1-next.0
  - @features/platform-device-action-content@0.2.0
  - @features/platform-aggregated-assets@0.5.2-next.0
  - @ledgerhq/ledger-key-ring-protocol@0.21.2-next.0
  - @ledgerhq/live-dmk-mobile@0.29.7-next.0
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
  - @ledgerhq/live-wallet@1.1.2-next.0
  - @ledgerhq/coin-canton@1.1.1-next.0
  - @ledgerhq/coin-filecoin@2.1.1-next.0
  - @ledgerhq/coin-multiversx@1.1.1-next.0
  - @ledgerhq/coin-stacks@0.30.1-next.0
  - @ledgerhq/device-core@0.11.15-next.0
  - @ledgerhq/domain-service@1.8.18-next.0
  - @ledgerhq/live-signer-evm@0.23.1-next.0
  - @features/flow-large-screen-upsell@2.0.2-next.0
  - @features/platform-feature-flags@0.6.9-next.0
  - @shared/ui-info-state@0.2.1-next.0
  - @shared/auth@0.6.0
  - @shared/cloud-sync@0.3.0
  - @shared/i18n@0.2.0
  - @shared/password-verifier@0.3.0
  - @devtools/shell@0.9.2-next.0
  - @features/flow-analytics-consent@0.2.5-next.0

## 4.19.0

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
  - @features/flow-pay-request@0.3.0
  - @ledgerhq/transaction-observability@0.2.0
  - @shared/ui-queued-bottom-sheet@0.2.0
  - @features/flow-contacts@0.9.0
  - @features/platform-contacts@0.5.0
  - @features/flow-contacts-add-contact@0.5.0
  - @features/flow-contacts-edit-contact@0.3.0
  - @shared/ui-info-state@0.2.0
  - @features/platform-verify-address-intent@0.3.0
  - @shared/env@0.5.0
  - @domain/entity-currency-crypto@0.11.0
  - @features/flow-contacts-introduction@1.0.0
  - @features/flow-pay-card@0.2.0
  - @shared/api-services@0.6.0
  - @ledgerhq/coin-canton@1.1.0
  - @ledgerhq/coin-casper@3.2.0
  - @ledgerhq/coin-concordium@1.1.0
  - @ledgerhq/coin-cosmos@1.1.0
  - @ledgerhq/coin-evm@5.2.0
  - @ledgerhq/coin-filecoin@2.1.0
  - @ledgerhq/coin-multiversx@1.1.0
  - @ledgerhq/coin-stacks@0.30.0
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
  - @domain/api-aggregated-assets@0.4.2
  - @features/platform-aggregated-assets@0.5.1
  - @features/platform-env@0.2.3
  - @ledgerhq/ledger-key-ring-protocol@0.21.1
  - @ledgerhq/live-dmk-mobile@0.29.6
  - @ledgerhq/live-dmk-speculos@0.10.7
  - @ledgerhq/wallet-analytics@0.3.6
  - @ledgerhq/wallet-pnl@0.7.9
  - @domain/entity-contact@0.8.1
  - @domain/entity-currency@0.4.2
  - @domain/entity-currency-token@0.5.1
  - @ledgerhq/coin-bitcoin@0.51.3
  - @ledgerhq/live-currency-format@0.14.3
  - @ledgerhq/live-wallet@1.1.1
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
  - @features/flow-app-lock@0.2.0
  - @features/platform-card@0.3.1
  - @ledgerhq/device-core@0.11.14
  - @ledgerhq/domain-service@1.8.17
  - @ledgerhq/live-countervalues@0.24.5
  - @ledgerhq/live-countervalues-react@0.16.9
  - @devtools/shell@0.9.1
  - @features/flow-analytics-consent@0.2.4

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

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->

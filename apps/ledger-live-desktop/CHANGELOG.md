# ledger-live-desktop

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

## 4.19.0-next.0

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

- [#21049](https://github.com/LedgerHQ/ledger-live/pull/21049) [`27ea1f5`](https://github.com/LedgerHQ/ledger-live/commit/27ea1f524b3fd4db75f54ef21d163a0815cb6d5d) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(send): select which address of a contact receives the funds in the Send recipient step

- [#21339](https://github.com/LedgerHQ/ledger-live/pull/21339) [`2a9d2ea`](https://github.com/LedgerHQ/ledger-live/commit/2a9d2ea261259cedb53563384ae7a15a26ab6140) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Show From/To and contact address label in History Address column.

- [#19191](https://github.com/LedgerHQ/ledger-live/pull/19191) [`148d76b`](https://github.com/LedgerHQ/ledger-live/commit/148d76bddfa34c9c6d049e67e7109e222b8432e8) Thanks [@cted-ledger](https://github.com/cted-ledger)! - staking feature for mina blockchain

### Patch Changes

- Updated dependencies [[`dd9fe60`](https://github.com/LedgerHQ/ledger-live/commit/dd9fe60055d1b97a175bb701d98129c79a1ef33b), [`f9be984`](https://github.com/LedgerHQ/ledger-live/commit/f9be984dd27742c065981d4cebf25ba3e564f48a), [`edad3fb`](https://github.com/LedgerHQ/ledger-live/commit/edad3fb2dc1fea0277418374b5ebee9c9860f448), [`0b024e8`](https://github.com/LedgerHQ/ledger-live/commit/0b024e8214eb3635d42c18986aa983bd1501c985), [`244454b`](https://github.com/LedgerHQ/ledger-live/commit/244454ba821c5590a56b4b0e5e5ec6ca2436e6ab), [`7d02f4b`](https://github.com/LedgerHQ/ledger-live/commit/7d02f4bbdc49f57df242d47b55ebd21c5176f4de), [`545e419`](https://github.com/LedgerHQ/ledger-live/commit/545e4191a1b059058a20f30bdd1925b7c78e682c), [`7fae8f5`](https://github.com/LedgerHQ/ledger-live/commit/7fae8f5f7f22aa84933b734266de73cd9fa8a79c), [`a2be85c`](https://github.com/LedgerHQ/ledger-live/commit/a2be85cd773ae59e454cd33b9a38548ea5b003f8), [`4342943`](https://github.com/LedgerHQ/ledger-live/commit/43429435e5411592f61099f1d40712f055578b0c), [`5e45fdd`](https://github.com/LedgerHQ/ledger-live/commit/5e45fddee9f3483ac3daa7b93f58b01e725e6d4b), [`7249fa2`](https://github.com/LedgerHQ/ledger-live/commit/7249fa2564e028a3e557ce97d63a362b0dd96a92), [`e6d6ed6`](https://github.com/LedgerHQ/ledger-live/commit/e6d6ed6eda460eb614680b31a42ba8067cc28d2a), [`8c98500`](https://github.com/LedgerHQ/ledger-live/commit/8c98500f7d95594eafc554dce31ca755b2479e08), [`46f41d2`](https://github.com/LedgerHQ/ledger-live/commit/46f41d2787191684f52e5dc85b0cd629901b13d8), [`f4986f8`](https://github.com/LedgerHQ/ledger-live/commit/f4986f882385e07dbd531d99a0571c67ca91ada0), [`a6e4ace`](https://github.com/LedgerHQ/ledger-live/commit/a6e4ace0712d14b9a0465c123ce88bcb04918ca6), [`ce47443`](https://github.com/LedgerHQ/ledger-live/commit/ce47443e97f559210443547a7948ef61c01f7feb), [`37cc17e`](https://github.com/LedgerHQ/ledger-live/commit/37cc17ea60f5a6c779aa7c5b5b6ae39d0bfea229), [`9a1a1df`](https://github.com/LedgerHQ/ledger-live/commit/9a1a1df2da9b612bd8d5533fba23b0ebc8b1a58f), [`e76361d`](https://github.com/LedgerHQ/ledger-live/commit/e76361de6952dc17336daa0679557fcb7b935430), [`a4f727d`](https://github.com/LedgerHQ/ledger-live/commit/a4f727d0c17d685302cf9ec2a39e752b2c9937fd), [`da47556`](https://github.com/LedgerHQ/ledger-live/commit/da475565799815dd17c4cb941068031e564da9b6), [`beaaa31`](https://github.com/LedgerHQ/ledger-live/commit/beaaa315b5c4d4ccea8145f3a309ba557f961118), [`83b019e`](https://github.com/LedgerHQ/ledger-live/commit/83b019e128b59a289a28184e58c33b108cd3f188), [`36b7fda`](https://github.com/LedgerHQ/ledger-live/commit/36b7fda667ed2bc281291ac25573e36ac7244532), [`f99b720`](https://github.com/LedgerHQ/ledger-live/commit/f99b7205490cb4712eff99519444d7dd6903c02a), [`02c9ccf`](https://github.com/LedgerHQ/ledger-live/commit/02c9ccfb409317a72f0b29d1fb755214adc9e596), [`e723d82`](https://github.com/LedgerHQ/ledger-live/commit/e723d823688cd7f00d4b16549b45c62a500c8a9d), [`bb44e2c`](https://github.com/LedgerHQ/ledger-live/commit/bb44e2c4f8ce29b88394b15a17f7c698cb647e74), [`31223eb`](https://github.com/LedgerHQ/ledger-live/commit/31223ebdd9335ef14a3ae8712658d17de60924e5), [`c62986b`](https://github.com/LedgerHQ/ledger-live/commit/c62986b76467651009a571d64908405988b13571), [`cef29a0`](https://github.com/LedgerHQ/ledger-live/commit/cef29a0cd39ee1a7cfb6428ae650595b4479e4d6), [`076322c`](https://github.com/LedgerHQ/ledger-live/commit/076322c82b0edcba1eda4981902f98cfe6c62b43), [`0639bea`](https://github.com/LedgerHQ/ledger-live/commit/0639bea01c594c335fb9b0604ad9ffc331936d54), [`cdbc3ac`](https://github.com/LedgerHQ/ledger-live/commit/cdbc3acac0045ab860206e32062cc5c417d75196), [`114420e`](https://github.com/LedgerHQ/ledger-live/commit/114420ed119ae6c93969891acf97d61c2af42df4), [`60c41bd`](https://github.com/LedgerHQ/ledger-live/commit/60c41bddad7f1d02028d237cd10fc781baf8f674), [`46d23e1`](https://github.com/LedgerHQ/ledger-live/commit/46d23e1c719201910c0811da2a7a5a6849d93e25), [`b3a86f5`](https://github.com/LedgerHQ/ledger-live/commit/b3a86f5ae5ab80d6f09fa4e5f6738e3eacc696c8), [`e1c2a4b`](https://github.com/LedgerHQ/ledger-live/commit/e1c2a4bf3cabe5f58f8b3f8f226dfc90a0ab0296), [`a8c34d0`](https://github.com/LedgerHQ/ledger-live/commit/a8c34d0d9469b4e11339edfbef53445e58194fd8), [`f9f6b71`](https://github.com/LedgerHQ/ledger-live/commit/f9f6b71d91c051b8e611a44f5b564cf5062cedb8), [`aafcdb7`](https://github.com/LedgerHQ/ledger-live/commit/aafcdb70e59584d6580f080cfd167cce41e56c19), [`9b4214f`](https://github.com/LedgerHQ/ledger-live/commit/9b4214fea8a3d8d8da30cd0b5ba6f9032610527e), [`11a1e34`](https://github.com/LedgerHQ/ledger-live/commit/11a1e34660116e53b0cfa5f66d2aa22c81dd9c25), [`34fc080`](https://github.com/LedgerHQ/ledger-live/commit/34fc080bb0c4ec01528404dde38f7c25559ecebe), [`41faac4`](https://github.com/LedgerHQ/ledger-live/commit/41faac432e8c17e3718d90cc26ce6ae650800681), [`0df32c7`](https://github.com/LedgerHQ/ledger-live/commit/0df32c7f80d190522285002bfa6bffa0539f5b23), [`bf22729`](https://github.com/LedgerHQ/ledger-live/commit/bf22729942b9dc114644dd3dc32962c08012c1cc), [`2ad298a`](https://github.com/LedgerHQ/ledger-live/commit/2ad298ae1f6a60e5d28ca236c17f8eb7d7906c78), [`a334296`](https://github.com/LedgerHQ/ledger-live/commit/a334296eaeca54451650fc3a3d1c36d5c8b93b8d), [`2c70999`](https://github.com/LedgerHQ/ledger-live/commit/2c709990d3569bc50504822ce90c9e9024210312), [`1ef101a`](https://github.com/LedgerHQ/ledger-live/commit/1ef101ab6487c85c8753cccd8bb9adb0dbd2d489), [`9f37206`](https://github.com/LedgerHQ/ledger-live/commit/9f372065ab564bc75960e4d02b8a9cb4e7ac21b0), [`911a996`](https://github.com/LedgerHQ/ledger-live/commit/911a996f2a6d999d194cadd4f842235cddbe1361), [`0500726`](https://github.com/LedgerHQ/ledger-live/commit/05007264f5b1726a21c2e545a10c18993fd2fcb5), [`c8614bf`](https://github.com/LedgerHQ/ledger-live/commit/c8614bfbfd1dc8de12731c2c333b9d137f0f2f93), [`aa8f4bf`](https://github.com/LedgerHQ/ledger-live/commit/aa8f4bff9059c9e462d02efb20a1b02fa426939a), [`1e0763e`](https://github.com/LedgerHQ/ledger-live/commit/1e0763e58c287365325643367a3e4a26ddf5884e), [`0127ebd`](https://github.com/LedgerHQ/ledger-live/commit/0127ebd36795e678cd4337b46d38c031d07756c1), [`3ff0cde`](https://github.com/LedgerHQ/ledger-live/commit/3ff0cde19eea9c76e0737afa023d0dd826bd6ee8), [`62008f0`](https://github.com/LedgerHQ/ledger-live/commit/62008f0bcb6b2bcb3a866111c774a66d0f048961), [`6f8acaf`](https://github.com/LedgerHQ/ledger-live/commit/6f8acaf912c5c515a8fb05382101785fded8bb06), [`3b3c696`](https://github.com/LedgerHQ/ledger-live/commit/3b3c696a3d857f474a64b25cff6389f4df3b2063), [`9faeaf8`](https://github.com/LedgerHQ/ledger-live/commit/9faeaf8f94495bb2b1df1483494cc3979f7cb835), [`71fd65e`](https://github.com/LedgerHQ/ledger-live/commit/71fd65e2bdfd692d1d009f22202d9e7f984826b5), [`5bcc7f1`](https://github.com/LedgerHQ/ledger-live/commit/5bcc7f1bacbe72f86c52548735c15e4a23137ee7), [`848b4bd`](https://github.com/LedgerHQ/ledger-live/commit/848b4bd3cccf6cb38f9e31ec39a0d4bc574c3fa2), [`46ed356`](https://github.com/LedgerHQ/ledger-live/commit/46ed356e325028c4e8e461b72f7dce631c7362e3), [`6f4814b`](https://github.com/LedgerHQ/ledger-live/commit/6f4814b8c0e0c1c06b6729f036d756206ed19d77), [`27388a8`](https://github.com/LedgerHQ/ledger-live/commit/27388a894eaac67b8e162a60f6d3368aad0a8682), [`6cef6b5`](https://github.com/LedgerHQ/ledger-live/commit/6cef6b5341c30850aa74159bdbdea0a18f89de4c), [`09af9b1`](https://github.com/LedgerHQ/ledger-live/commit/09af9b1b9f7c39db4c6d0cbd1a038fd43784240b), [`ad1c0ff`](https://github.com/LedgerHQ/ledger-live/commit/ad1c0ff93b94ba9a0b1e7409e5ddbdc2d73bcd30), [`c20677f`](https://github.com/LedgerHQ/ledger-live/commit/c20677f1b5d13973883196e5665d6dd0ef7c58ba), [`5b78670`](https://github.com/LedgerHQ/ledger-live/commit/5b78670b9587b4ebfe47d0743da1be94b6d85193), [`6cc7ac6`](https://github.com/LedgerHQ/ledger-live/commit/6cc7ac68b08cdb80b95c597495acd681ec25caca), [`6110948`](https://github.com/LedgerHQ/ledger-live/commit/61109484660c79a7ce8ad1e32af1f58276ddad7a), [`1cf5583`](https://github.com/LedgerHQ/ledger-live/commit/1cf55832f785fc57881169092f1190fa7ddfecf9), [`c8bb138`](https://github.com/LedgerHQ/ledger-live/commit/c8bb13851393d4b1a50a5ece62763ba43110ae6f), [`150a151`](https://github.com/LedgerHQ/ledger-live/commit/150a151169e4ef40aa197300a115f17db1aa20c0), [`116f006`](https://github.com/LedgerHQ/ledger-live/commit/116f006fb7e1dc3ed7d97c41ec08b2340b66a12e), [`9a3746d`](https://github.com/LedgerHQ/ledger-live/commit/9a3746d7442c10649e183aaefeca2d7f51d4797f), [`e2f2cfa`](https://github.com/LedgerHQ/ledger-live/commit/e2f2cfa372605742ff6ef29f4e56d9a77fdb86be), [`5b9df59`](https://github.com/LedgerHQ/ledger-live/commit/5b9df5970cb628dbfe592227231b66ff498f480c), [`cf9a982`](https://github.com/LedgerHQ/ledger-live/commit/cf9a9820f9b1ae7405e9bdf3f4947d0f99bb68dd), [`45ea28b`](https://github.com/LedgerHQ/ledger-live/commit/45ea28b19d1e950bf4e705388a06181a9a7543aa), [`f0f9990`](https://github.com/LedgerHQ/ledger-live/commit/f0f999034f698b4e0e35928d5cf43a365ed3fef0), [`9f0b607`](https://github.com/LedgerHQ/ledger-live/commit/9f0b607a0e177c1f7474c649e3b5dd7b7924c8aa), [`27ea1f5`](https://github.com/LedgerHQ/ledger-live/commit/27ea1f524b3fd4db75f54ef21d163a0815cb6d5d), [`9d5a6d9`](https://github.com/LedgerHQ/ledger-live/commit/9d5a6d980442ac78bcc1c3c12fbfee389aa8e0c9)]:
  - @features/flow-pay-request@0.3.0-next.0
  - @ledgerhq/live-common@37.5.0-next.0
  - @ledgerhq/transaction-observability@0.2.0-next.0
  - @features/flow-contacts@0.9.0-next.0
  - @features/platform-contacts@0.5.0-next.0
  - @features/flow-contacts-add-contact@0.5.0-next.0
  - @features/flow-contacts-edit-contact@0.3.0-next.0
  - @shared/ui-info-state@0.2.0-next.0
  - @features/platform-verify-address-intent@0.3.0-next.0
  - @ledgerhq/coin-zcash@0.6.0-next.0
  - @shared/env@0.5.0-next.0
  - @domain/entity-currency-crypto@0.11.0-next.0
  - @domain/entity-account-alias@0.1.0-next.0
  - @features/flow-contacts-introduction@1.0.0-next.0
  - @features/flow-pay-card@0.2.0-next.0
  - @shared/api-services@0.6.0-next.0
  - @ledgerhq/coin-canton@1.1.0-next.0
  - @ledgerhq/coin-cardano@1.1.0-next.0
  - @ledgerhq/coin-casper@3.2.0-next.0
  - @ledgerhq/coin-concordium@1.1.0-next.0
  - @ledgerhq/coin-cosmos@1.1.0-next.0
  - @ledgerhq/coin-evm@5.2.0-next.0
  - @ledgerhq/coin-filecoin@2.1.0-next.0
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
  - @ledgerhq/asset-detail@0.11.3-next.0
  - @ledgerhq/live-dmk-desktop@0.20.9-next.0
  - @domain/api-aggregated-assets@0.4.2-next.0
  - @features/platform-aggregated-assets@0.5.1-next.0
  - @features/platform-env@0.2.3-next.0
  - @ledgerhq/ledger-key-ring-protocol@0.21.1-next.0
  - @ledgerhq/live-dmk-speculos@0.10.7-next.0
  - @ledgerhq/wallet-analytics@0.3.6-next.0
  - @ledgerhq/wallet-pnl@0.7.9-next.0
  - @domain/entity-contact@0.8.1-next.0
  - @domain/entity-currency@0.4.2-next.0
  - @domain/entity-currency-token@0.5.1-next.0
  - @ledgerhq/asset-aggregation@0.13.3-next.0
  - @ledgerhq/coin-bitcoin@0.51.3-next.0
  - @ledgerhq/live-currency-format@0.14.3-next.0
  - @ledgerhq/live-wallet@1.1.1-next.0
  - @ledgerhq/wallet-btc@0.3.0
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
  - @features/flow-pay-card-details@0.2.0
  - @features/platform-card@0.3.1-next.0
  - @ledgerhq/domain-service@1.8.17-next.0
  - @ledgerhq/live-countervalues@0.24.5-next.0
  - @ledgerhq/live-countervalues-react@0.16.9-next.0
  - @devtools/shell@0.9.1-next.0
  - @features/flow-analytics-consent@0.2.4-next.0

## 4.18.0

### Minor Changes

- [#20911](https://github.com/LedgerHQ/ledger-live/pull/20911) [`4014093`](https://github.com/LedgerHQ/ledger-live/commit/4014093fe5fb899fdeae22f12b24c07540d2b2bf) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Expose useOpenPrefillAddAddressFlow and mount PrefillAddAddressFlowRoot on Desktop and Mobile so consumers such as Send can open the prefilled Add Address flow without depending on Contacts internals.

- [#21025](https://github.com/LedgerHQ/ledger-live/pull/21025) [`de982e6`](https://github.com/LedgerHQ/ledger-live/commit/de982e6a9ef6e2a27789212bee2729c7141193ad) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Fix Contacts edit flow so the device connection prompt appears after saving a contact name or address, not before opening the edit form.

- [#20986](https://github.com/LedgerHQ/ledger-live/pull/20986) [`9965d7f`](https://github.com/LedgerHQ/ledger-live/commit/9965d7ffb37efc1a2f50fe49c199afa2f05446bf) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add `@features/platform-verify-address-intent`, a Device Intent that verifies a receive address on the device Secure Screen, and wire it to the desktop Pay tab Verify CTA.

  The host injects a family-agnostic `startAddressVerification` (generic `getAddress` over the DIE DMK transport). When `ldmkTransport` is off, Verify opens the classic Receive modal. Address comparison is encoding-aware (case-insensitive for hex, exact otherwise). `verified` / `cancelled` / `unsupported` return to the request summary; `mismatch` closes the flow.

  Generalize desktop `InfoState` by adding a full-width `content` slot and optional `backgroundTone` support for the `spot` preset.

- [#20962](https://github.com/LedgerHQ/ledger-live/pull/20962) [`6218989`](https://github.com/LedgerHQ/ledger-live/commit/6218989cc9b12b7574660a98c465a3899db0083e) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Wire the desktop Pay tab Request "Verify" action: pressing it closes the receive dialog and opens the shared VerifyAddress overlay (intro then success), tracking the `Page Request Address Verification` page view. The device intent (DIE) is kept behind the exposed `showSuccess` bridge for LIVE-36132.

  Make the request action `onShare` (mobile-only) and `onSave` (desktop-only) callbacks optional, align the request verify tracking button to `verify`, and give the VerifyAddress dialog an InfoState-style muted background with centered next steps.

- [#20727](https://github.com/LedgerHQ/ledger-live/pull/20727) [`53938d6`](https://github.com/LedgerHQ/ledger-live/commit/53938d6669a1e8cbc4e2e21f0e038762da047abe) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwdm): add the contact avatar component in the new send flow

- [#21165](https://github.com/LedgerHQ/ledger-live/pull/21165) [`e903cf0`](https://github.com/LedgerHQ/ledger-live/commit/e903cf05f66c5fbef8e221a1cbe7aa0e8b811257) Thanks [@sarneijim](https://github.com/sarneijim)! - Add missing Touchscreen Upgrade Program tracking for Backup Hub Recovery Key upsell and Lazy Onboarding Banner (LIVE-36494)

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

- [#21116](https://github.com/LedgerHQ/ledger-live/pull/21116) [`6bf8331`](https://github.com/LedgerHQ/ledger-live/commit/6bf833159a6533b2196d9fde9be2533b72c3521b) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Stack the LNS upsell banner above the hardware carousel instead of squeezing it into a tile slot, share a carousel with action cards only on mobile, and stop the Content Cards QA console from collapsing every Top wallet preset into the "alwayson" category

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
  - @ledgerhq/live-common@37.4.0
  - @ledgerhq/coin-evm@5.1.0
  - @features/flow-contacts-add-address@0.2.0
  - @features/flow-contacts@0.8.0
  - @features/flow-pay-card-request@0.2.0
  - @features/platform-verify-address-intent@0.2.0
  - @ledgerhq/coin-zcash@0.5.0
  - @features/flow-large-screen-upsell@2.0.0
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
  - @features/flow-pay-card-details@0.2.0
  - @shared/env@0.4.0
  - @features/platform-aggregated-assets@0.5.0
  - @shared/cloud-sync@0.2.0
  - @domain/entity-recent-addresses@0.2.0
  - @features/flow-contacts-introduction@0.3.0
  - @ledgerhq/asset-detail@0.11.2
  - @ledgerhq/live-dmk-desktop@0.20.8
  - @domain/api-aggregated-assets@0.4.1
  - @domain/api-altcoins-sentiment@0.3.3
  - @domain/api-currency-fiat@0.4.2
  - @domain/api-currency-token@0.5.1
  - @domain/api-market-sentiment@0.3.3
  - @domain/api-push-devices@0.2.3
  - @features/platform-currencies@0.6.2
  - @features/platform-feature-flags@0.6.7
  - @ledgerhq/asset-aggregation@0.13.2
  - @ledgerhq/coin-bitcoin@0.51.2
  - @ledgerhq/coin-canton@1.0.1
  - @ledgerhq/coin-cardano@1.0.1
  - @ledgerhq/coin-concordium@1.0.1
  - @ledgerhq/coin-cosmos@1.0.1
  - @ledgerhq/coin-filecoin@2.0.1
  - @ledgerhq/domain-service@1.8.16
  - @ledgerhq/live-countervalues@0.24.4
  - @ledgerhq/live-countervalues-react@0.16.8
  - @ledgerhq/wallet-analytics@0.3.5
  - @ledgerhq/wallet-pnl@0.7.8
  - @features/platform-env@0.2.2
  - @ledgerhq/live-dmk-speculos@0.10.6
  - @domain/entity-account-name@0.2.1
  - @features/platform-wallet-sync@0.1.2
  - @ledgerhq/live-currency-format@0.14.2
  - @features/flow-analytics-consent@0.2.3
  - @ledgerhq/wallet-btc@0.3.0

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

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->

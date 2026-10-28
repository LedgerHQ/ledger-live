# live-mobile

## 4.25.0

### Minor Changes

- [#23341](https://github.com/LedgerHQ/ledger-live/pull/23341) [`a86963c`](https://github.com/LedgerHQ/ledger-live/commit/a86963c2401573e3d5fef6b9623bae1e23126178) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the `accountDetail` feature flag (with `excludedCurrencyIds`) for the new Account Detail page and send its state to analytics.

- [#23293](https://github.com/LedgerHQ/ledger-live/pull/23293) [`1d3e404`](https://github.com/LedgerHQ/ledger-live/commit/1d3e4041f4adaeddf981200cf649ecf64414fa50) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Stop swap entry points from stacking a new Main navigator, and open each swap entry on a fresh webview history.

- [#23322](https://github.com/LedgerHQ/ledger-live/pull/23322) [`1349df3`](https://github.com/LedgerHQ/ledger-live/commit/1349df3f6e9a27eeecc8495ca99a453341d7bf70) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Extract the Contact Detail journey into `@features/flow-contacts-detail` so Desktop and Mobile can reuse it, while the Contacts aggregate keeps cross-journey orchestration

- [#23004](https://github.com/LedgerHQ/ledger-live/pull/23004) [`505eea9`](https://github.com/LedgerHQ/ledger-live/commit/505eea91332a042c158fdca7a36ebeddff379da3) Thanks [@vpenskyi-ledger](https://github.com/vpenskyi-ledger)! - Fix a second account drawer opening in Swap when the receive token is a token the user does not hold yet. The parent account is now sent with `toTokenId` instead of the unresolvable synthetic token account, so the Swap live app builds the token account itself.

- [#23346](https://github.com/LedgerHQ/ledger-live/pull/23346) [`80a62ae`](https://github.com/LedgerHQ/ledger-live/commit/80a62ae9b54253c0059abf236ca486f8a6bbc9ca) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Show perps deposit device errors with the new error state and a retry.

- [#23134](https://github.com/LedgerHQ/ledger-live/pull/23134) [`2ebd029`](https://github.com/LedgerHQ/ledger-live/commit/2ebd029cd006cb89ceb240705247ccf5529c3c50) Thanks [@ovoronkov-ledger](https://github.com/ovoronkov-ledger)! - fix(bottom-sheet): hold reopen content until the sheet has closed (LIVE-37745)

- [#23215](https://github.com/LedgerHQ/ledger-live/pull/23215) [`08169a3`](https://github.com/LedgerHQ/ledger-live/commit/08169a3450bc1764abafe08ab08bea098ea80bee) Thanks [@cted-ledger](https://github.com/cted-ledger)! - do not show the bitcoin fee picker on a zcash send, whose fee zip-317 sets

- [#23391](https://github.com/LedgerHQ/ledger-live/pull/23391) [`ee508db`](https://github.com/LedgerHQ/ledger-live/commit/ee508db35d572d43e03cf58e811177cc3b2389a9) Thanks [@thesan](https://github.com/thesan)! - Resolve the app configuration once, when the store is created, with `resolveAppConfig` from `@shared/app-config`. Keycloak is the first service to read it: its base URL comes from the `ledgerKeyRing` switch, which resolves to the option persisted under `appConfigSelections`, or to the `CONFIG_PROFILE` of the build's `.env` file: `staging` for dev, adhoc and nightly builds, `prod` for prerelease and release builds. The configuration stays the same for the whole session, by design: a new selection applies after an app reload. `@shared/env` drops the `LEDGER_AUTH_*` definitions.

- [#23485](https://github.com/LedgerHQ/ledger-live/pull/23485) [`623f8e6`](https://github.com/LedgerHQ/ledger-live/commit/623f8e6181d92aed3a49aa993be9d4fe0bbd8e39) Thanks [@thesan](https://github.com/thesan)! - `@shared/auth` drops the `authEnvironment` slice: Keycloak reads its base URL from the app config, so nothing reads it any more.

- [#23385](https://github.com/LedgerHQ/ledger-live/pull/23385) [`2ec955a`](https://github.com/LedgerHQ/ledger-live/commit/2ec955a5928085cff093d5c9a167f2761a055dcc) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the shared Account Detail settings contents: settings menu, advanced logs (with copy) and remove account confirmation, plus `buildAdvancedLogs`.

- [#23378](https://github.com/LedgerHQ/ledger-live/pull/23378) [`fc5e597`](https://github.com/LedgerHQ/ledger-live/commit/fc5e597d59c57092c14f6fc9a81a2f8993cd0384) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the Account Detail screen shell behind the `accountDetail` flag: `ScreenName.Account` switches per account to the new screen (token sub-accounts open their parent), the legacy screen otherwise.

- [#23380](https://github.com/LedgerHQ/ledger-live/pull/23380) [`92d5032`](https://github.com/LedgerHQ/ledger-live/commit/92d5032870cc9c37ede60a40db088fa267fb8a66) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the Account Detail nav bar on LWM: account name, shortened address with the network icon, and a settings button.

- [#23393](https://github.com/LedgerHQ/ledger-live/pull/23393) [`0902ebf`](https://github.com/LedgerHQ/ledger-live/commit/0902ebf68277918c2aaed83c868403a1c674b052) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the Account Detail settings sheet on LWM: the settings button opens the account settings menu and the remove account confirmation.

- [#23450](https://github.com/LedgerHQ/ledger-live/pull/23450) [`b0c722a`](https://github.com/LedgerHQ/ledger-live/commit/b0c722adc2665c1552b787636292314d03734c0b) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the Account Detail change name screen on LWM, opened from the settings sheet once it has closed (keeps the name field focused). Long account names are truncated in the settings menu.

- [#23435](https://github.com/LedgerHQ/ledger-live/pull/23435) [`e4e90c0`](https://github.com/LedgerHQ/ledger-live/commit/e4e90c06160288d2b6aa70706b741c410b413af6) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the Account Detail advanced logs screen on LWM, opened from the settings sheet. Copy logs now shows a "Copied" state for 2 seconds.

- [#23438](https://github.com/LedgerHQ/ledger-live/pull/23438) [`987dffa`](https://github.com/LedgerHQ/ledger-live/commit/987dffae42cd7d73eb0856178d615766ff0a02e8) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove account from the LWM Account Detail settings sheet: confirming removes the account and goes back to the previous screen.

- [#23512](https://github.com/LedgerHQ/ledger-live/pull/23512) [`e8ede36`](https://github.com/LedgerHQ/ledger-live/commit/e8ede3687d02ce1ea90f19aa643d0e4f7d94e08f) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the Assets section to the Account Detail screen: the coin and its tokens sorted by value, with the same filters as the Portfolio. `AssetListItem` rows are not pressable when no `onPress` is passed.

- [#23415](https://github.com/LedgerHQ/ledger-live/pull/23415) [`c568dc6`](https://github.com/LedgerHQ/ledger-live/commit/c568dc6f340cba5a322b79742274208cb8dec111) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the Transactions section to the LWM Account Detail screen: the 3 latest operations of the account and its tokens, opening the operations history scoped to the account. The Asset Detail section now uses the same shared component.

- [#23439](https://github.com/LedgerHQ/ledger-live/pull/23439) [`722c6f3`](https://github.com/LedgerHQ/ledger-live/commit/722c6f312e9fd8c33c932ef2f4df15d9062ade31) Thanks [@ovoronkov-ledger](https://github.com/ovoronkov-ledger)! - chore(rn-upgrade): replace absoluteFillObject with absoluteFill (LIVE-39313)

- [#23429](https://github.com/LedgerHQ/ledger-live/pull/23429) [`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Bump Lumen to lumen-design-core 0.1.32, lumen-ui-react 0.1.64, lumen-ui-rnative 0.1.67 and lumen-utils-shared 0.1.16, and migrate `Spot` to its palette API (`icon` required, `appearance="icon"` dropped, `check`/`info`/`error`/`warning`/`loader` mapped to explicit icons, `number` moved to `SpotNumber`). The devtools native jest preset now mocks `react-native-gesture-handler`, which the new lumen `Toaster` imports.

- [#23426](https://github.com/LedgerHQ/ledger-live/pull/23426) [`8b6190f`](https://github.com/LedgerHQ/ledger-live/commit/8b6190fbd979a4e15abc065bad424050067c8062) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the bottom fade gradient to the LWM Account Detail screen, like Transaction History and Market.

- [#23559](https://github.com/LedgerHQ/ledger-live/pull/23559) [`ead8b59`](https://github.com/LedgerHQ/ledger-live/commit/ead8b59eafe301b82efbe38bf6d2379b6e77b233) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Expose the recoverV2 feature flag to Mixpanel on mobile and desktop.

- [#23543](https://github.com/LedgerHQ/ledger-live/pull/23543) [`257305f`](https://github.com/LedgerHQ/ledger-live/commit/257305f907b207ac54e4e9bd9ace6a78ce554bb1) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - feat(account-balance): add the balance entity

  Crypto balances of an account, one row per asset, keyed by AccountUUID. Both apps mount the slice. Fiat stays a view.

- [#23400](https://github.com/LedgerHQ/ledger-live/pull/23400) [`beea4cd`](https://github.com/LedgerHQ/ledger-live/commit/beea4cd9cccfbfa99a03bfb878f83353ef89d41c) Thanks [@gre-ledger](https://github.com/gre-ledger)! - feat(account-data): add the account data framework

  Kind registry and `accountData` status slice, source contract and router (ranking, batching, concurrency, pagination affinity), `fetchAccountData` / `fetchMoreAccountData` and the `useAccountData` hook. Both apps register the status slice and inject the router into the thunk `extraArgument`, with no source yet.

- [#23436](https://github.com/LedgerHQ/ledger-live/pull/23436) [`f51fe16`](https://github.com/LedgerHQ/ledger-live/commit/f51fe16f67f2c50f36d772a60121ed3d7ae12c6a) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add the accounts slice, keyed by AccountUUID and kept in sync with the legacy accounts

- [#23422](https://github.com/LedgerHQ/ledger-live/pull/23422) [`b97096c`](https://github.com/LedgerHQ/ledger-live/commit/b97096ca3622ffa57e76423081b8855300f7a70d) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - End the Asset Detail chart on the header price so the line matches the live spot

- [#23213](https://github.com/LedgerHQ/ledger-live/pull/23213) [`6ce41e8`](https://github.com/LedgerHQ/ledger-live/commit/6ce41e89e4af226cefdcedd53763f1b5c8988d5b) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(send): add the Descriptionitem component for the new send flow

- [#23495](https://github.com/LedgerHQ/ledger-live/pull/23495) [`3c062fc`](https://github.com/LedgerHQ/ledger-live/commit/3c062fccd90c705eee581800c0dd416f1b61ebe2) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - feat(analytics): add the `blockchainWithFunds` user property (blockchain names, e.g. Arbitrum) next to `accountsWithFunds`, which reports the native ticker (ETH for L2s)

- [#23210](https://github.com/LedgerHQ/ledger-live/pull/23210) [`a2ef1bf`](https://github.com/LedgerHQ/ledger-live/commit/a2ef1bf1a96b8f59795897fcd9dcd0f0e6fd3295) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - The discovery error for an undetermined Bluetooth state (`BluetoothStateUnknownCheckOnly`) no longer shows a spinner with no action. It now shows "Bluetooth isn’t responding" with a retry CTA and, on Android, the "Continue with USB instead" CTA. Before, nothing checked the Bluetooth state again, so the sheet stayed stuck.

- [#23631](https://github.com/LedgerHQ/ledger-live/pull/23631) [`19e5335`](https://github.com/LedgerHQ/ledger-live/commit/19e5335bcb3d6017d6c875fc1fd66704f0f5a8be) Thanks [@henri-ly](https://github.com/henri-ly)! - Restore name and unit on the transaction intent asset so XRP and Stellar amount errors show the currency unit instead of "Unknown unit"

- [#23386](https://github.com/LedgerHQ/ledger-live/pull/23386) [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574) Thanks [@dilaouid](https://github.com/dilaouid)! - Remove the Zenrock and Quicksilver integrations, including their chain adapters, currency definitions, feature flags and LCD endpoints

- [#23418](https://github.com/LedgerHQ/ledger-live/pull/23418) [`2621f1e`](https://github.com/LedgerHQ/ledger-live/commit/2621f1ebe6c1a8f8cff0a797740771ae5fc084be) Thanks [@ysitbon](https://github.com/ysitbon)! - Stop re-rendering every amount on a countervalues load that changes no rate

  A load now keeps a pair's rate Map and cache entry when every fetched value equals the stored one, and
  keeps the whole cache object when no pair changed. The conversions read the cache alone, through
  `useCountervaluesCache`, so a load that only stamps the fetch status no longer re-renders them. The
  conversions and the persisted export are the same as before.

- [#23154](https://github.com/LedgerHQ/ledger-live/pull/23154) [`3ad1a61`](https://github.com/LedgerHQ/ledger-live/commit/3ad1a619eb1244d9adb8e4e67c250a2687716175) Thanks [@ysitbon](https://github.com/ysitbon)! - Move the countervalues polling loop into a Redux middleware and drop the countervalues React context.

  - After changing the countervalue currency, adding an account or tracking a new asset, amounts no longer briefly fall back to the last daily rate before the new rates land.
  - On mobile, changing the countervalue currency or adding an account no longer re-renders every amount on screen several times, and loads the rates once instead of up to three times.
  - `@features/platform-market-countervalues`: `useCountervaluesState`, `useCountervaluesPolling`, `useCalculate`, `useCalculateCountervalueCallback` and `useSendAmount` keep their names and signatures and read the `countervalues` slice with `useSelector`. The loop moves into `createCountervaluesMiddleware`, started with `startCountervaluesSync({ savedState })`. `CountervaluesProvider`, `CountervaluesBridge`, `Props`, `PollingState` and `useCountervaluesUserSettings` are removed.
  - Desktop: the store installs the middleware; boot starts it right before the first render, so the saved rates show from the first frame. The window focus and blur events, the network changes and the saving to disk move into the middleware's configuration.
  - Mobile: the store installs the middleware; boot starts it when the app is let through, and a reboot starts it again from the saved state. The extra session tracking pairs move from an RxJS subject into the store.

- [#23211](https://github.com/LedgerHQ/ledger-live/pull/23211) [`bcf98ff`](https://github.com/LedgerHQ/ledger-live/commit/bcf98ffbb1d119fba86c53e4c005abdad251b62a) Thanks [@ysitbon](https://github.com/ysitbon)! - Split the countervalues Redux slice by owner. The rates now have their own slice in `@domain/entity-market-countervalues` (`countervaluesRatesSlice`, with `setCountervaluesState` and `wipeCountervalues`), stored with a shallow freeze so a load never pays for a deep freeze of every rate. `@features/platform-market-countervalues` keeps the loop's state in `countervaluesSyncSlice` (`load`, `error`, `isPolling`; `load` is one of `idle`, `requested`, `loading`, `loadingThenRequested`, replacing the former `pending` and `triggerLoad` flags) and mounts both under the same `countervalues` store key through `countervaluesReducer`, typed `CountervaluesStoreState`, which replaces `CountervaluesState`. The store reads `countervalues.rates` and `countervalues.sync` instead of `countervalues.countervalues.state` and `countervalues.polling`; persistence and the saved data are unchanged. Each slice now declares its own actions, so the `COUNTERVALUES_*` type strings are gone: `setCountervaluesState` and `wipeCountervalues` keep their names, typed `countervaluesRates/set` and `countervaluesRates/wipe`, and the loop's setters `setCountervaluesPollingTriggerLoad`, `setCountervaluesStatePending`, `setCountervaluesStateError` and `setCountervaluesPollingIsPolling` become the events `countervaluesLoadRequested`, `countervaluesLoadStarted`, `countervaluesLoadSucceeded`, `countervaluesLoadFailed` and `countervaluesPollingSet`, typed `countervaluesSync/...`. A load start and a load failure now dispatch one action each instead of two. The sync selectors are the slice's own `selectors`, and `countervaluesSyncTriggerLoadSelector` is gone. `useCountervaluesPolling` now returns only the `poll`, `start`, `stop` and `wipe` commands and no longer re-renders its callers on every load; `pending` and `error` come from the new `useCountervaluesLoadStatus`, which live-common's `useSyncSources` now reads.

- [#23335](https://github.com/LedgerHQ/ledger-live/pull/23335) [`246438d`](https://github.com/LedgerHQ/ledger-live/commit/246438dc16e4021db0ec9456fa6092742c81c6d6) Thanks [@ysitbon](https://github.com/ysitbon)! - Release the countervalues startup wait's timer and store subscription once it ends

  The countervalues loop starts when the currencies are hydrated and the remote flags are ready, or
  after a second at most. The two sides raced as separate promises, so whichever lost kept running:
  the remote flags subscription stayed registered until the first fetch settled, and the timer fired
  for nothing when the app was ready first. One wait now owns both and releases both as soon as it
  settles. The loop starts at the same moment as before.

- [#23353](https://github.com/LedgerHQ/ledger-live/pull/23353) [`48d5c85`](https://github.com/LedgerHQ/ledger-live/commit/48d5c8543e70d0e4ee2fa30ea12590439f01f510) Thanks [@LL782](https://github.com/LL782)! - Remove the legacy `ofacGeoBlockApi` after Desktop and Mobile use `@features/flow-app-availability`

- [#23376](https://github.com/LedgerHQ/ledger-live/pull/23376) [`4ee8f78`](https://github.com/LedgerHQ/ledger-live/commit/4ee8f78997ca79d841bf0ba5642a4f2229cdbc46) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - Add a balance type sync step to the new send flow, used by Aleo to refresh private records after the pool pick

- [#23361](https://github.com/LedgerHQ/ledger-live/pull/23361) [`a02d06c`](https://github.com/LedgerHQ/ledger-live/commit/a02d06c1556ac855233d3b9b427cd812628a7aba) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Move the mobile Fear and Greed UI into the flow package

- [#22508](https://github.com/LedgerHQ/ledger-live/pull/22508) [`ad58765`](https://github.com/LedgerHQ/ledger-live/commit/ad58765b6151457022f8587d6ddcad3325ce96ac) Thanks [@pawell24](https://github.com/pawell24)! - fix(filecoin): open transactions on Blockscout from operation details

  Blockscout identifies a Filecoin message by its Ethereum-style hash, so the explorer link is now
  built from the message CID's digest instead of the CID itself.

- [#23423](https://github.com/LedgerHQ/ledger-live/pull/23423) [`c61cbe8`](https://github.com/LedgerHQ/ledger-live/commit/c61cbe8c4c383ff720812398f58907b5b6c3e982) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - fix(portfolio): show the Market 24h variation on assets whose balance did not change over the day (LIVE-39259)

- [#23389](https://github.com/LedgerHQ/ledger-live/pull/23389) [`03f4e70`](https://github.com/LedgerHQ/ledger-live/commit/03f4e70f38efc9362beae2e8ef12567cced3d3c6) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Extract address deletion into `@features/flow-contacts-delete-address` so Desktop and Mobile can reuse it without going through Contact Detail. Confirmation UI stays in `@features/platform-contacts`. Apps still own modal mounting, navigation, translations, and analytics.

- [#23023](https://github.com/LedgerHQ/ledger-live/pull/23023) [`7b01c45`](https://github.com/LedgerHQ/ledger-live/commit/7b01c45b4a1a00f240cfd9b8880146a95565f721) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(send): fix the send amount screen layout when the text size increases

- [#23459](https://github.com/LedgerHQ/ledger-live/pull/23459) [`2f9b7e9`](https://github.com/LedgerHQ/ledger-live/commit/2f9b7e97b8afee033e5fa194c5ca40a1f82a9b89) Thanks [@gre-ledger](https://github.com/gre-ledger)! - feat(account-data): full sync source on AccountBridge, serving no kind yet

- [#23302](https://github.com/LedgerHQ/ledger-live/pull/23302) [`ac7d243`](https://github.com/LedgerHQ/ledger-live/commit/ac7d243f75e6d4c00406c326f20713af1f80ca2f) Thanks [@sarneijim](https://github.com/sarneijim)! - Show genuine check error drawers during device onboarding

- [#23285](https://github.com/LedgerHQ/ledger-live/pull/23285) [`4fd1ebc`](https://github.com/LedgerHQ/ledger-live/commit/4fd1ebc94718ead589f235824f0440803341feb9) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Keep a contacts device sheet mounted until iOS has closed it, and close it once the device step is finished.

- [#23315](https://github.com/LedgerHQ/ledger-live/pull/23315) [`68cebc0`](https://github.com/LedgerHQ/ledger-live/commit/68cebc06f2ec8f4cc38ac1caca779317a8fe0711) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fetch LargeMover chart and market rows through RTK Query by ledger id, and drop the unused CoinGecko mapping client.

- [#23058](https://github.com/LedgerHQ/ledger-live/pull/23058) [`214f7f1`](https://github.com/LedgerHQ/ledger-live/commit/214f7f183ea42a7b37663251db944ad61a3ad799) Thanks [@ishaba](https://github.com/ishaba)! - feat(tron): track the sponsored send funnel in Segment

- [#23247](https://github.com/LedgerHQ/ledger-live/pull/23247) [`c18097b`](https://github.com/LedgerHQ/ledger-live/commit/c18097b2ae6fb06a530dc8a29fbfaac99ad7e942) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Load the market list with an RTK infinite query instead of React Query.

- [#23233](https://github.com/LedgerHQ/ledger-live/pull/23233) [`2cb9ecd`](https://github.com/LedgerHQ/ledger-live/commit/2cb9ecdc8baa46248716d80eb4eb68e7855c36b3) Thanks [@LL782](https://github.com/LL782)! - Switch mobile launch gating to `@features/flow-app-availability` and drop the legacy OFAC geo-block api

- [#23279](https://github.com/LedgerHQ/ledger-live/pull/23279) [`34cffc5`](https://github.com/LedgerHQ/ledger-live/commit/34cffc55056bd6759d658a3deb4d2fe63dc3abb9) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Declare `@lottiefiles/dotlottie-react` so `lottie-react-native` resolves to a single peer variant and `Podfile.lock` stops breaking on unrelated full installs.

- [#23151](https://github.com/LedgerHQ/ledger-live/pull/23151) [`004d896`](https://github.com/LedgerHQ/ledger-live/commit/004d8965c325b6ff60d5a2ebcc1c763b7a7bf4d1) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Show and export QA onboarding logs with the device answers and the machine context, and toggle the deviceOnboarding flag from the devtool

- [#23280](https://github.com/LedgerHQ/ledger-live/pull/23280) [`6a3d5ad`](https://github.com/LedgerHQ/ledger-live/commit/6a3d5ad39819c0212a6a3444954c8421fd8277b4) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Remove the Card login code from the Pay tab route after the login reads it, so a logout shows the login screen and not a login error

- [#23102](https://github.com/LedgerHQ/ledger-live/pull/23102) [`4d77514`](https://github.com/LedgerHQ/ledger-live/commit/4d775144f5032153be92d736a2f029aeb1223280) Thanks [@sarneijim](https://github.com/sarneijim)! - Move the shared device onboarding machine to features/platform

- [#23333](https://github.com/LedgerHQ/ledger-live/pull/23333) [`99efa90`](https://github.com/LedgerHQ/ledger-live/commit/99efa909f2c2d15b9d0acb23d7de5ba0b26a07dc) Thanks [@vladyslavchupovskiy-ext-art](https://github.com/vladyslavchupovskiy-ext-art)! - Load Expo's runtime before react-native-url-polyfill so the polyfill's URLSearchParams (with `size`) stays installed; fixes Aptos sends to an unfunded account failing with "insufficient funds"

- [#23424](https://github.com/LedgerHQ/ledger-live/pull/23424) [`b78f271`](https://github.com/LedgerHQ/ledger-live/commit/b78f27100786be5b0da9e8f91e6dcb791342b036) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add a script generating Podfile.lock without installing pods, usable on Linux

- [#23230](https://github.com/LedgerHQ/ledger-live/pull/23230) [`b4241c5`](https://github.com/LedgerHQ/ledger-live/commit/b4241c5fd67aa29cad563c24149d4a9a3ef5a08f) Thanks [@sarneijim](https://github.com/sarneijim)! - Add the seeded-device checks screen, its animations, and a sync offer preview

- [#23328](https://github.com/LedgerHQ/ledger-live/pull/23328) [`e1ba29a`](https://github.com/LedgerHQ/ledger-live/commit/e1ba29a3b2d57f519914d64faf59e55834a9ed2c) Thanks [@sarneijim](https://github.com/sarneijim)! - Open the existing Ledger Sync skip confirmation from the seeded offer

- [#23226](https://github.com/LedgerHQ/ledger-live/pull/23226) [`dd34e1b`](https://github.com/LedgerHQ/ledger-live/commit/dd34e1b8929faff2869d6d3a2366acc16c649229) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Shorten the device intent executor component names

- [#23672](https://github.com/LedgerHQ/ledger-live/pull/23672) [`fe74104`](https://github.com/LedgerHQ/ledger-live/commit/fe74104174a41357be9cb911d9b762e4360cbf46) Thanks [@henri-ly](https://github.com/henri-ly)! - fix(coin-solana): check the stake minimum before a validator is picked

  The mobile delegation flow asks for the amount before the validator, so the recipient is still empty when the amount is validated. The minimum-delegation check was skipped in that case, which let an amount below 1 SOL through to the summary. The summary now also shows its validation error in the alert colour.

- [#23220](https://github.com/LedgerHQ/ledger-live/pull/23220) [`a8d48a9`](https://github.com/LedgerHQ/ledger-live/commit/a8d48a97f1bae0c2adad5d2790c9cc8ab5d7c2b0) Thanks [@abdurrahman-ledger](https://github.com/abdurrahman-ledger)! - Support protected Speculinho sessions in E2E. Speculos transports take the session's `bearerToken` (`SpeculosHttpTransportOpts`, `SpeculosSessionTarget`, the mobile `SpeculosTarget`; `DeviceManagementKitTransportSpeculos` and the desktop transport default to `SPECULOS_SESSION_TOKEN`) and keep a separate DMK per token. E2E acquires sessions with `protected: true` and authenticates every operator and Speculos request; the mobile e2e bridge passes the token to the app and now requires a per-run connection token. Bumps `@ledgerhq/device-transport-kit-speculos` to 1.3.0 and `@ledgerhq/speculos-device-controller` to 0.4.0.

- [#23511](https://github.com/LedgerHQ/ledger-live/pull/23511) [`874b720`](https://github.com/LedgerHQ/ledger-live/commit/874b720315f63da00d714b0575dfacecbe122e34) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Align @react-native/community-cli-plugin with react-native 0.81.6 and drop the stale 0.77.3 tree

- [#23003](https://github.com/LedgerHQ/ledger-live/pull/23003) [`57b4652`](https://github.com/LedgerHQ/ledger-live/commit/57b4652a1d0ae95af20419210139039642cedb9c) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Adapt to `@ledgerhq/coin-evm` 15

- [#23472](https://github.com/LedgerHQ/ledger-live/pull/23472) [`b88647d`](https://github.com/LedgerHQ/ledger-live/commit/b88647dca4c613663bca4ba0d62c2296b95ac083) Thanks [@sarneijim](https://github.com/sarneijim)! - Add connectUnseededDevice to deviceOnboarding and edit that mock from the mobile onboarding devtool

- [#23261](https://github.com/LedgerHQ/ledger-live/pull/23261) [`02b383b`](https://github.com/LedgerHQ/ledger-live/commit/02b383b7d11352d121556bb6f0a076c2b960b9eb) Thanks [@alexstapenka-ledger](https://github.com/alexstapenka-ledger)! - Add a withdraw icon to the earn action confirmation dialog, a `custom.dialog.menu` action menu dialog on desktop for the Earn "Earn more" / "Withdraw all" choice, and the `earnWithdrawV2` feature flag that gates the Earn full withdraw flow

### Patch Changes

- Updated dependencies [[`a86963c`](https://github.com/LedgerHQ/ledger-live/commit/a86963c2401573e3d5fef6b9623bae1e23126178), [`68c2837`](https://github.com/LedgerHQ/ledger-live/commit/68c2837d114092c6f421cfe5d5a97ce48d69667c), [`ec7b8b9`](https://github.com/LedgerHQ/ledger-live/commit/ec7b8b9f1c0821ffb9973a174bc2f693719215ab), [`1349df3`](https://github.com/LedgerHQ/ledger-live/commit/1349df3f6e9a27eeecc8495ca99a453341d7bf70), [`c9beaff`](https://github.com/LedgerHQ/ledger-live/commit/c9beaff3b51d3a50f310be73a830bf6e944e61fa), [`4831311`](https://github.com/LedgerHQ/ledger-live/commit/4831311fd859631a9248441e469f52c18fb42c52), [`2ebd029`](https://github.com/LedgerHQ/ledger-live/commit/2ebd029cd006cb89ceb240705247ccf5529c3c50), [`d6ab47c`](https://github.com/LedgerHQ/ledger-live/commit/d6ab47c28339866ad88ef0deba75d314c2f6c4f0), [`393a02a`](https://github.com/LedgerHQ/ledger-live/commit/393a02a42be9f0410b75c0c34203915bcde27e43), [`ee508db`](https://github.com/LedgerHQ/ledger-live/commit/ee508db35d572d43e03cf58e811177cc3b2389a9), [`623f8e6`](https://github.com/LedgerHQ/ledger-live/commit/623f8e6181d92aed3a49aa993be9d4fe0bbd8e39), [`d2b8471`](https://github.com/LedgerHQ/ledger-live/commit/d2b84711b137f42930f006f7a079fc104c92633d), [`6032338`](https://github.com/LedgerHQ/ledger-live/commit/60323388dea6a0957aa836c73657b58d26765321), [`2ec955a`](https://github.com/LedgerHQ/ledger-live/commit/2ec955a5928085cff093d5c9a167f2761a055dcc), [`b0c722a`](https://github.com/LedgerHQ/ledger-live/commit/b0c722adc2665c1552b787636292314d03734c0b), [`e4e90c0`](https://github.com/LedgerHQ/ledger-live/commit/e4e90c06160288d2b6aa70706b741c410b413af6), [`722c6f3`](https://github.com/LedgerHQ/ledger-live/commit/722c6f312e9fd8c33c932ef2f4df15d9062ade31), [`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c), [`c32fa7b`](https://github.com/LedgerHQ/ledger-live/commit/c32fa7be07b04ef0db38e0877f18d613d32d087e), [`ead8b59`](https://github.com/LedgerHQ/ledger-live/commit/ead8b59eafe301b82efbe38bf6d2379b6e77b233), [`257305f`](https://github.com/LedgerHQ/ledger-live/commit/257305f907b207ac54e4e9bd9ace6a78ce554bb1), [`beea4cd`](https://github.com/LedgerHQ/ledger-live/commit/beea4cd9cccfbfa99a03bfb878f83353ef89d41c), [`f51fe16`](https://github.com/LedgerHQ/ledger-live/commit/f51fe16f67f2c50f36d772a60121ed3d7ae12c6a), [`fc846e5`](https://github.com/LedgerHQ/ledger-live/commit/fc846e53bbe5023223aa847b6e00b68fb22ace4a), [`b79ccab`](https://github.com/LedgerHQ/ledger-live/commit/b79ccab839cc7916ff3ecd910479904f87a6e59d), [`7b3040a`](https://github.com/LedgerHQ/ledger-live/commit/7b3040ad872c183fd2beb81a965037b5310ab87a), [`b599cb2`](https://github.com/LedgerHQ/ledger-live/commit/b599cb25afbc5ce2dbdcd0cc1b6126a49bba8068), [`3c062fc`](https://github.com/LedgerHQ/ledger-live/commit/3c062fccd90c705eee581800c0dd416f1b61ebe2), [`de8fe99`](https://github.com/LedgerHQ/ledger-live/commit/de8fe99f01d9d6248437fc8a914f12fc83d6e470), [`3527dbc`](https://github.com/LedgerHQ/ledger-live/commit/3527dbc69a05745b272741566b20634d79462cb8), [`80f99a8`](https://github.com/LedgerHQ/ledger-live/commit/80f99a819b13d3ec2bd39d896de46e0a433b9954), [`7da1ea9`](https://github.com/LedgerHQ/ledger-live/commit/7da1ea9534a1bdde063e31545363a27f0fdf5abb), [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574), [`2f9c159`](https://github.com/LedgerHQ/ledger-live/commit/2f9c1598145b8a7dadab43b12a5deb4ab9dc91c9), [`a654488`](https://github.com/LedgerHQ/ledger-live/commit/a654488d68942852ffa880a60ae674ff44a18918), [`6abfd98`](https://github.com/LedgerHQ/ledger-live/commit/6abfd98fd3d0359864687b2fc125390f3643a6db), [`2621f1e`](https://github.com/LedgerHQ/ledger-live/commit/2621f1ebe6c1a8f8cff0a797740771ae5fc084be), [`3ad1a61`](https://github.com/LedgerHQ/ledger-live/commit/3ad1a619eb1244d9adb8e4e67c250a2687716175), [`bcf98ff`](https://github.com/LedgerHQ/ledger-live/commit/bcf98ffbb1d119fba86c53e4c005abdad251b62a), [`75498cf`](https://github.com/LedgerHQ/ledger-live/commit/75498cf55065bccf17d09b780866ae031c01701a), [`ad6aad8`](https://github.com/LedgerHQ/ledger-live/commit/ad6aad8eec3a718da9359ad683350360f745d0d5), [`47e5b74`](https://github.com/LedgerHQ/ledger-live/commit/47e5b740cf64f177fd1cbbfa7f5bf74de3d45661), [`ff33162`](https://github.com/LedgerHQ/ledger-live/commit/ff331621a49337b1065c373f16aa479fa0ab5c8b), [`5e9a60a`](https://github.com/LedgerHQ/ledger-live/commit/5e9a60ac27b41be43d1ea24b0d11acec92260c49), [`7e54483`](https://github.com/LedgerHQ/ledger-live/commit/7e544837b934b55e0743faaabacfc89d922e9435), [`e5762fc`](https://github.com/LedgerHQ/ledger-live/commit/e5762fc3dc7bb36007c8133efefeeb6523cebf05), [`a782d57`](https://github.com/LedgerHQ/ledger-live/commit/a782d57262cda0475c54417c8b769955df316e78), [`a02d06c`](https://github.com/LedgerHQ/ledger-live/commit/a02d06c1556ac855233d3b9b427cd812628a7aba), [`ad58765`](https://github.com/LedgerHQ/ledger-live/commit/ad58765b6151457022f8587d6ddcad3325ce96ac), [`03f4e70`](https://github.com/LedgerHQ/ledger-live/commit/03f4e70f38efc9362beae2e8ef12567cced3d3c6), [`ff14496`](https://github.com/LedgerHQ/ledger-live/commit/ff14496257201991b52f0dd140e351fca3e84d4d), [`e66d21e`](https://github.com/LedgerHQ/ledger-live/commit/e66d21ea7ccb706d718703b69d2133ede3294c1a), [`4fd1ebc`](https://github.com/LedgerHQ/ledger-live/commit/4fd1ebc94718ead589f235824f0440803341feb9), [`68cebc0`](https://github.com/LedgerHQ/ledger-live/commit/68cebc06f2ec8f4cc38ac1caca779317a8fe0711), [`ed10647`](https://github.com/LedgerHQ/ledger-live/commit/ed10647dedd2642ac5316f89595b618180097e33), [`bcea51b`](https://github.com/LedgerHQ/ledger-live/commit/bcea51b0b2c9ef09b9e068f97ed3c67a0e45e188), [`2e198e2`](https://github.com/LedgerHQ/ledger-live/commit/2e198e2394723873a79e56635cfe21a2ab763454), [`3fadda7`](https://github.com/LedgerHQ/ledger-live/commit/3fadda73d3131279b8a318cf15a29778f62d15cd), [`004d896`](https://github.com/LedgerHQ/ledger-live/commit/004d8965c325b6ff60d5a2ebcc1c763b7a7bf4d1), [`98c994b`](https://github.com/LedgerHQ/ledger-live/commit/98c994bc1f46a03366096531afac2471f07f397b), [`6639142`](https://github.com/LedgerHQ/ledger-live/commit/6639142cc619d0758ba7873dafbc3e32944f250f), [`2cd35c5`](https://github.com/LedgerHQ/ledger-live/commit/2cd35c5e21a9dfe58ca58349280f33266143ca51), [`4d77514`](https://github.com/LedgerHQ/ledger-live/commit/4d775144f5032153be92d736a2f029aeb1223280), [`307d5c0`](https://github.com/LedgerHQ/ledger-live/commit/307d5c0da2fc42ee1699e6b48073255276456dd6), [`37a49df`](https://github.com/LedgerHQ/ledger-live/commit/37a49df18649912157d8f269c3b4153d54b7817e), [`0ace271`](https://github.com/LedgerHQ/ledger-live/commit/0ace2718ac29bc9926858af41424177ff3363d47), [`ca063c4`](https://github.com/LedgerHQ/ledger-live/commit/ca063c4cfad79f12118c5af5bc0ef323857f90bd), [`2c6e74a`](https://github.com/LedgerHQ/ledger-live/commit/2c6e74a12a542cb47507ec98ae85ace8fa526171), [`e345c82`](https://github.com/LedgerHQ/ledger-live/commit/e345c829b04e28d489b9cf4d8384ed57dbad0321), [`696357f`](https://github.com/LedgerHQ/ledger-live/commit/696357f754751853758d67c88bf34df9302b9b97), [`a2ef1bf`](https://github.com/LedgerHQ/ledger-live/commit/a2ef1bf1a96b8f59795897fcd9dcd0f0e6fd3295), [`a8d48a9`](https://github.com/LedgerHQ/ledger-live/commit/a8d48a97f1bae0c2adad5d2790c9cc8ab5d7c2b0), [`ed89930`](https://github.com/LedgerHQ/ledger-live/commit/ed89930df1e705c535e5c4cccd62033654f5a145), [`0d5c35d`](https://github.com/LedgerHQ/ledger-live/commit/0d5c35d9f29e17c3ad7bcb7632dcaea83d47e7d3), [`b88647d`](https://github.com/LedgerHQ/ledger-live/commit/b88647dca4c613663bca4ba0d62c2296b95ac083), [`02b383b`](https://github.com/LedgerHQ/ledger-live/commit/02b383b7d11352d121556bb6f0a076c2b960b9eb)]:
  - @shared/feature-flags@0.27.0
  - @features/flow-account-detail-settings@0.1.0
  - @features/flow-contacts-detail@0.2.0
  - @features/flow-contacts@0.15.0
  - @features/flow-pay-contact@0.7.0
  - @ledgerhq/coin-concordium@1.6.0
  - @shared/ui-queued-bottom-sheet@0.7.0
  - @domain/entity-currency-crypto@0.16.0
  - @shared/app-config@0.1.0
  - @shared/env@0.11.0
  - @shared/auth@0.7.0
  - @ledgerhq/coin-bitcoin@1.0.0
  - @features/flow-account-detail@0.1.0
  - @features/flow-pay-card-details@0.8.0
  - @ledgerhq/native-ui@0.69.0
  - @devtools/shell@0.11.0
  - @features/flow-fear-and-greed@0.4.0
  - @features/flow-contacts-introduction@1.5.0
  - @features/flow-contacts-list@0.10.0
  - @features/flow-pay-balance@0.8.0
  - @features/flow-pay-card-assets@0.4.0
  - @features/flow-pay-card-transactions@0.6.0
  - @features/flow-pay-card-widget@0.6.0
  - @features/flow-pay-deposit@0.6.0
  - @features/flow-pay-request@0.9.0
  - @features/platform-contacts@0.11.0
  - @shared/ui-info-state@0.5.0
  - @domain/entity-account-balance@0.2.0
  - @domain/entity-account-data@0.2.0
  - @domain/api-account-data@0.2.0
  - @domain/entity-account@0.1.0
  - @features/flow-contacts-add-contact@0.8.0
  - @features/platform-currencies@0.10.0
  - @features/platform-account-analytics@0.2.0
  - @features/flow-contacts-add-address@0.7.0
  - @ledgerhq/coin-stacks@0.34.0
  - @ledgerhq/ledger-wallet-framework@3.8.0
  - @ledgerhq/types-live@6.128.0
  - @ledgerhq/coin-cosmos@2.0.0
  - @features/flow-contacts-edit-address@0.5.0
  - @domain/entity-market-countervalues@0.4.0
  - @features/platform-market-countervalues@0.3.0
  - @features/flow-contacts-delete-address@0.2.0
  - @features/flow-contacts-delete-contact@0.3.0
  - @features/flow-contacts-edit-contact@0.7.0
  - @ledgerhq/coin-filecoin@2.5.0
  - @features/platform-device-onboarding@0.2.0
  - @devtools/bindings@0.12.0
  - @ledgerhq/coin-casper@3.6.0
  - @ledgerhq/live-dmk-speculos@0.12.0
  - @features/flow-app-availability@0.2.0
  - @ledgerhq/live-dmk-mobile@0.32.0
  - @ledgerhq/live-dmk-shared@0.36.0
  - @ledgerhq/coin-canton@1.5.0
  - @features/flow-large-screen-upsell@2.2.3
  - @features/flow-pay-feature-tour@0.8.1
  - @features/platform-feature-flags@0.9.1
  - @features/platform-feature-flags-firebase@0.1.1
  - @features/flow-app-longer-password@0.1.1
  - @features/flow-app-password-removal@0.1.1
  - @features/flow-app-protection-prompt@0.1.1
  - @features/flow-pay-bank-transfer@0.4.1
  - @features/flow-pay-card-auth@0.10.1
  - @ledgerhq/live-send@0.1.4
  - @domain/api-aggregated-assets@0.6.1
  - @domain/api-currency-token@0.6.5
  - @domain/api-market-countervalues@0.2.1
  - @domain/entity-contact@0.12.1
  - @domain/entity-currency@0.4.7
  - @domain/entity-currency-token@0.5.6
  - @ledgerhq/live-wallet@1.1.7
  - @ledgerhq/wallet-analytics@0.5.2
  - @ledgerhq/wallet-pnl@0.8.1
  - @features/platform-aggregated-assets@0.5.7
  - @features/platform-env@0.4.3
  - @ledgerhq/transaction-observability@0.5.1
  - @shared/api-services@0.10.1
  - @features/flow-pay-card@0.7.1
  - @features/flow-app-unlock@0.1.1
  - @devtools/transport-panel@0.7.0
  - @domain/entity-account-name@0.2.3
  - @domain/entity-starred-account@0.0.2
  - @ledgerhq/coin-multiversx@1.4.1
  - @ledgerhq/live-signer-evm@0.24.2
  - @ledgerhq/device-core@0.11.20
  - @ledgerhq/live-signer-tron@0.2.2
  - @features/flow-analytics-consent@0.2.10
  - @features/platform-content-ab-tests@0.2.1
  - @domain/api-card-management@0.8.2
  - @domain/api-currency-fiat@0.4.8
  - @domain/api-market-index-altcoin-season@0.4.2
  - @domain/api-market-index-fear-and-greed@0.4.2
  - @domain/api-push-devices@0.2.9
  - @features/platform-card@0.8.1

## 4.25.0-next.2

### Minor Changes

- [#23672](https://github.com/LedgerHQ/ledger-live/pull/23672) [`fe74104`](https://github.com/LedgerHQ/ledger-live/commit/fe74104174a41357be9cb911d9b762e4360cbf46) Thanks [@henri-ly](https://github.com/henri-ly)! - fix(coin-solana): check the stake minimum before a validator is picked

  The mobile delegation flow asks for the amount before the validator, so the recipient is still empty when the amount is validated. The minimum-delegation check was skipped in that case, which let an amount below 1 SOL through to the summary. The summary now also shows its validation error in the alert colour.

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/live-send@0.1.4-next.2

## 4.25.0-next.1

### Minor Changes

- [#23631](https://github.com/LedgerHQ/ledger-live/pull/23631) [`19e5335`](https://github.com/LedgerHQ/ledger-live/commit/19e5335bcb3d6017d6c875fc1fd66704f0f5a8be) Thanks [@henri-ly](https://github.com/henri-ly)! - Restore name and unit on the transaction intent asset so XRP and Stellar amount errors show the currency unit instead of "Unknown unit"

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/live-send@0.1.4-next.1

## 4.25.0-next.0

### Minor Changes

- [#23341](https://github.com/LedgerHQ/ledger-live/pull/23341) [`a86963c`](https://github.com/LedgerHQ/ledger-live/commit/a86963c2401573e3d5fef6b9623bae1e23126178) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the `accountDetail` feature flag (with `excludedCurrencyIds`) for the new Account Detail page and send its state to analytics.

- [#23293](https://github.com/LedgerHQ/ledger-live/pull/23293) [`1d3e404`](https://github.com/LedgerHQ/ledger-live/commit/1d3e4041f4adaeddf981200cf649ecf64414fa50) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Stop swap entry points from stacking a new Main navigator, and open each swap entry on a fresh webview history.

- [#23322](https://github.com/LedgerHQ/ledger-live/pull/23322) [`1349df3`](https://github.com/LedgerHQ/ledger-live/commit/1349df3f6e9a27eeecc8495ca99a453341d7bf70) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Extract the Contact Detail journey into `@features/flow-contacts-detail` so Desktop and Mobile can reuse it, while the Contacts aggregate keeps cross-journey orchestration

- [#23004](https://github.com/LedgerHQ/ledger-live/pull/23004) [`505eea9`](https://github.com/LedgerHQ/ledger-live/commit/505eea91332a042c158fdca7a36ebeddff379da3) Thanks [@vpenskyi-ledger](https://github.com/vpenskyi-ledger)! - Fix a second account drawer opening in Swap when the receive token is a token the user does not hold yet. The parent account is now sent with `toTokenId` instead of the unresolvable synthetic token account, so the Swap live app builds the token account itself.

- [#23346](https://github.com/LedgerHQ/ledger-live/pull/23346) [`80a62ae`](https://github.com/LedgerHQ/ledger-live/commit/80a62ae9b54253c0059abf236ca486f8a6bbc9ca) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Show perps deposit device errors with the new error state and a retry.

- [#23134](https://github.com/LedgerHQ/ledger-live/pull/23134) [`2ebd029`](https://github.com/LedgerHQ/ledger-live/commit/2ebd029cd006cb89ceb240705247ccf5529c3c50) Thanks [@ovoronkov-ledger](https://github.com/ovoronkov-ledger)! - fix(bottom-sheet): hold reopen content until the sheet has closed (LIVE-37745)

- [#23215](https://github.com/LedgerHQ/ledger-live/pull/23215) [`08169a3`](https://github.com/LedgerHQ/ledger-live/commit/08169a3450bc1764abafe08ab08bea098ea80bee) Thanks [@cted-ledger](https://github.com/cted-ledger)! - do not show the bitcoin fee picker on a zcash send, whose fee zip-317 sets

- [#23391](https://github.com/LedgerHQ/ledger-live/pull/23391) [`ee508db`](https://github.com/LedgerHQ/ledger-live/commit/ee508db35d572d43e03cf58e811177cc3b2389a9) Thanks [@thesan](https://github.com/thesan)! - Resolve the app configuration once, when the store is created, with `resolveAppConfig` from `@shared/app-config`. Keycloak is the first service to read it: its base URL comes from the `ledgerKeyRing` switch, which resolves to the option persisted under `appConfigSelections`, or to the `CONFIG_PROFILE` of the build's `.env` file: `staging` for dev, adhoc and nightly builds, `prod` for prerelease and release builds. The configuration stays the same for the whole session, by design: a new selection applies after an app reload. `@shared/env` drops the `LEDGER_AUTH_*` definitions.

- [#23485](https://github.com/LedgerHQ/ledger-live/pull/23485) [`623f8e6`](https://github.com/LedgerHQ/ledger-live/commit/623f8e6181d92aed3a49aa993be9d4fe0bbd8e39) Thanks [@thesan](https://github.com/thesan)! - `@shared/auth` drops the `authEnvironment` slice: Keycloak reads its base URL from the app config, so nothing reads it any more.

- [#23385](https://github.com/LedgerHQ/ledger-live/pull/23385) [`2ec955a`](https://github.com/LedgerHQ/ledger-live/commit/2ec955a5928085cff093d5c9a167f2761a055dcc) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the shared Account Detail settings contents: settings menu, advanced logs (with copy) and remove account confirmation, plus `buildAdvancedLogs`.

- [#23378](https://github.com/LedgerHQ/ledger-live/pull/23378) [`fc5e597`](https://github.com/LedgerHQ/ledger-live/commit/fc5e597d59c57092c14f6fc9a81a2f8993cd0384) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the Account Detail screen shell behind the `accountDetail` flag: `ScreenName.Account` switches per account to the new screen (token sub-accounts open their parent), the legacy screen otherwise.

- [#23380](https://github.com/LedgerHQ/ledger-live/pull/23380) [`92d5032`](https://github.com/LedgerHQ/ledger-live/commit/92d5032870cc9c37ede60a40db088fa267fb8a66) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the Account Detail nav bar on LWM: account name, shortened address with the network icon, and a settings button.

- [#23393](https://github.com/LedgerHQ/ledger-live/pull/23393) [`0902ebf`](https://github.com/LedgerHQ/ledger-live/commit/0902ebf68277918c2aaed83c868403a1c674b052) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the Account Detail settings sheet on LWM: the settings button opens the account settings menu and the remove account confirmation.

- [#23450](https://github.com/LedgerHQ/ledger-live/pull/23450) [`b0c722a`](https://github.com/LedgerHQ/ledger-live/commit/b0c722adc2665c1552b787636292314d03734c0b) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the Account Detail change name screen on LWM, opened from the settings sheet once it has closed (keeps the name field focused). Long account names are truncated in the settings menu.

- [#23435](https://github.com/LedgerHQ/ledger-live/pull/23435) [`e4e90c0`](https://github.com/LedgerHQ/ledger-live/commit/e4e90c06160288d2b6aa70706b741c410b413af6) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the Account Detail advanced logs screen on LWM, opened from the settings sheet. Copy logs now shows a "Copied" state for 2 seconds.

- [#23438](https://github.com/LedgerHQ/ledger-live/pull/23438) [`987dffa`](https://github.com/LedgerHQ/ledger-live/commit/987dffae42cd7d73eb0856178d615766ff0a02e8) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove account from the LWM Account Detail settings sheet: confirming removes the account and goes back to the previous screen.

- [#23512](https://github.com/LedgerHQ/ledger-live/pull/23512) [`e8ede36`](https://github.com/LedgerHQ/ledger-live/commit/e8ede3687d02ce1ea90f19aa643d0e4f7d94e08f) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the Assets section to the Account Detail screen: the coin and its tokens sorted by value, with the same filters as the Portfolio. `AssetListItem` rows are not pressable when no `onPress` is passed.

- [#23415](https://github.com/LedgerHQ/ledger-live/pull/23415) [`c568dc6`](https://github.com/LedgerHQ/ledger-live/commit/c568dc6f340cba5a322b79742274208cb8dec111) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the Transactions section to the LWM Account Detail screen: the 3 latest operations of the account and its tokens, opening the operations history scoped to the account. The Asset Detail section now uses the same shared component.

- [#23439](https://github.com/LedgerHQ/ledger-live/pull/23439) [`722c6f3`](https://github.com/LedgerHQ/ledger-live/commit/722c6f312e9fd8c33c932ef2f4df15d9062ade31) Thanks [@ovoronkov-ledger](https://github.com/ovoronkov-ledger)! - chore(rn-upgrade): replace absoluteFillObject with absoluteFill (LIVE-39313)

- [#23429](https://github.com/LedgerHQ/ledger-live/pull/23429) [`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Bump Lumen to lumen-design-core 0.1.32, lumen-ui-react 0.1.64, lumen-ui-rnative 0.1.67 and lumen-utils-shared 0.1.16, and migrate `Spot` to its palette API (`icon` required, `appearance="icon"` dropped, `check`/`info`/`error`/`warning`/`loader` mapped to explicit icons, `number` moved to `SpotNumber`). The devtools native jest preset now mocks `react-native-gesture-handler`, which the new lumen `Toaster` imports.

- [#23426](https://github.com/LedgerHQ/ledger-live/pull/23426) [`8b6190f`](https://github.com/LedgerHQ/ledger-live/commit/8b6190fbd979a4e15abc065bad424050067c8062) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the bottom fade gradient to the LWM Account Detail screen, like Transaction History and Market.

- [#23559](https://github.com/LedgerHQ/ledger-live/pull/23559) [`ead8b59`](https://github.com/LedgerHQ/ledger-live/commit/ead8b59eafe301b82efbe38bf6d2379b6e77b233) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Expose the recoverV2 feature flag to Mixpanel on mobile and desktop.

- [#23543](https://github.com/LedgerHQ/ledger-live/pull/23543) [`257305f`](https://github.com/LedgerHQ/ledger-live/commit/257305f907b207ac54e4e9bd9ace6a78ce554bb1) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - feat(account-balance): add the balance entity

  Crypto balances of an account, one row per asset, keyed by AccountUUID. Both apps mount the slice. Fiat stays a view.

- [#23400](https://github.com/LedgerHQ/ledger-live/pull/23400) [`beea4cd`](https://github.com/LedgerHQ/ledger-live/commit/beea4cd9cccfbfa99a03bfb878f83353ef89d41c) Thanks [@gre-ledger](https://github.com/gre-ledger)! - feat(account-data): add the account data framework

  Kind registry and `accountData` status slice, source contract and router (ranking, batching, concurrency, pagination affinity), `fetchAccountData` / `fetchMoreAccountData` and the `useAccountData` hook. Both apps register the status slice and inject the router into the thunk `extraArgument`, with no source yet.

- [#23436](https://github.com/LedgerHQ/ledger-live/pull/23436) [`f51fe16`](https://github.com/LedgerHQ/ledger-live/commit/f51fe16f67f2c50f36d772a60121ed3d7ae12c6a) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add the accounts slice, keyed by AccountUUID and kept in sync with the legacy accounts

- [#23422](https://github.com/LedgerHQ/ledger-live/pull/23422) [`b97096c`](https://github.com/LedgerHQ/ledger-live/commit/b97096ca3622ffa57e76423081b8855300f7a70d) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - End the Asset Detail chart on the header price so the line matches the live spot

- [#23213](https://github.com/LedgerHQ/ledger-live/pull/23213) [`6ce41e8`](https://github.com/LedgerHQ/ledger-live/commit/6ce41e89e4af226cefdcedd53763f1b5c8988d5b) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(send): add the Descriptionitem component for the new send flow

- [#23495](https://github.com/LedgerHQ/ledger-live/pull/23495) [`3c062fc`](https://github.com/LedgerHQ/ledger-live/commit/3c062fccd90c705eee581800c0dd416f1b61ebe2) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - feat(analytics): add the `blockchainWithFunds` user property (blockchain names, e.g. Arbitrum) next to `accountsWithFunds`, which reports the native ticker (ETH for L2s)

- [#23210](https://github.com/LedgerHQ/ledger-live/pull/23210) [`a2ef1bf`](https://github.com/LedgerHQ/ledger-live/commit/a2ef1bf1a96b8f59795897fcd9dcd0f0e6fd3295) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - The discovery error for an undetermined Bluetooth state (`BluetoothStateUnknownCheckOnly`) no longer shows a spinner with no action. It now shows "Bluetooth isn’t responding" with a retry CTA and, on Android, the "Continue with USB instead" CTA. Before, nothing checked the Bluetooth state again, so the sheet stayed stuck.

- [#23386](https://github.com/LedgerHQ/ledger-live/pull/23386) [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574) Thanks [@dilaouid](https://github.com/dilaouid)! - Remove the Zenrock and Quicksilver integrations, including their chain adapters, currency definitions, feature flags and LCD endpoints

- [#23418](https://github.com/LedgerHQ/ledger-live/pull/23418) [`2621f1e`](https://github.com/LedgerHQ/ledger-live/commit/2621f1ebe6c1a8f8cff0a797740771ae5fc084be) Thanks [@ysitbon](https://github.com/ysitbon)! - Stop re-rendering every amount on a countervalues load that changes no rate

  A load now keeps a pair's rate Map and cache entry when every fetched value equals the stored one, and
  keeps the whole cache object when no pair changed. The conversions read the cache alone, through
  `useCountervaluesCache`, so a load that only stamps the fetch status no longer re-renders them. The
  conversions and the persisted export are the same as before.

- [#23154](https://github.com/LedgerHQ/ledger-live/pull/23154) [`3ad1a61`](https://github.com/LedgerHQ/ledger-live/commit/3ad1a619eb1244d9adb8e4e67c250a2687716175) Thanks [@ysitbon](https://github.com/ysitbon)! - Move the countervalues polling loop into a Redux middleware and drop the countervalues React context.

  - After changing the countervalue currency, adding an account or tracking a new asset, amounts no longer briefly fall back to the last daily rate before the new rates land.
  - On mobile, changing the countervalue currency or adding an account no longer re-renders every amount on screen several times, and loads the rates once instead of up to three times.
  - `@features/platform-market-countervalues`: `useCountervaluesState`, `useCountervaluesPolling`, `useCalculate`, `useCalculateCountervalueCallback` and `useSendAmount` keep their names and signatures and read the `countervalues` slice with `useSelector`. The loop moves into `createCountervaluesMiddleware`, started with `startCountervaluesSync({ savedState })`. `CountervaluesProvider`, `CountervaluesBridge`, `Props`, `PollingState` and `useCountervaluesUserSettings` are removed.
  - Desktop: the store installs the middleware; boot starts it right before the first render, so the saved rates show from the first frame. The window focus and blur events, the network changes and the saving to disk move into the middleware's configuration.
  - Mobile: the store installs the middleware; boot starts it when the app is let through, and a reboot starts it again from the saved state. The extra session tracking pairs move from an RxJS subject into the store.

- [#23211](https://github.com/LedgerHQ/ledger-live/pull/23211) [`bcf98ff`](https://github.com/LedgerHQ/ledger-live/commit/bcf98ffbb1d119fba86c53e4c005abdad251b62a) Thanks [@ysitbon](https://github.com/ysitbon)! - Split the countervalues Redux slice by owner. The rates now have their own slice in `@domain/entity-market-countervalues` (`countervaluesRatesSlice`, with `setCountervaluesState` and `wipeCountervalues`), stored with a shallow freeze so a load never pays for a deep freeze of every rate. `@features/platform-market-countervalues` keeps the loop's state in `countervaluesSyncSlice` (`load`, `error`, `isPolling`; `load` is one of `idle`, `requested`, `loading`, `loadingThenRequested`, replacing the former `pending` and `triggerLoad` flags) and mounts both under the same `countervalues` store key through `countervaluesReducer`, typed `CountervaluesStoreState`, which replaces `CountervaluesState`. The store reads `countervalues.rates` and `countervalues.sync` instead of `countervalues.countervalues.state` and `countervalues.polling`; persistence and the saved data are unchanged. Each slice now declares its own actions, so the `COUNTERVALUES_*` type strings are gone: `setCountervaluesState` and `wipeCountervalues` keep their names, typed `countervaluesRates/set` and `countervaluesRates/wipe`, and the loop's setters `setCountervaluesPollingTriggerLoad`, `setCountervaluesStatePending`, `setCountervaluesStateError` and `setCountervaluesPollingIsPolling` become the events `countervaluesLoadRequested`, `countervaluesLoadStarted`, `countervaluesLoadSucceeded`, `countervaluesLoadFailed` and `countervaluesPollingSet`, typed `countervaluesSync/...`. A load start and a load failure now dispatch one action each instead of two. The sync selectors are the slice's own `selectors`, and `countervaluesSyncTriggerLoadSelector` is gone. `useCountervaluesPolling` now returns only the `poll`, `start`, `stop` and `wipe` commands and no longer re-renders its callers on every load; `pending` and `error` come from the new `useCountervaluesLoadStatus`, which live-common's `useSyncSources` now reads.

- [#23335](https://github.com/LedgerHQ/ledger-live/pull/23335) [`246438d`](https://github.com/LedgerHQ/ledger-live/commit/246438dc16e4021db0ec9456fa6092742c81c6d6) Thanks [@ysitbon](https://github.com/ysitbon)! - Release the countervalues startup wait's timer and store subscription once it ends

  The countervalues loop starts when the currencies are hydrated and the remote flags are ready, or
  after a second at most. The two sides raced as separate promises, so whichever lost kept running:
  the remote flags subscription stayed registered until the first fetch settled, and the timer fired
  for nothing when the app was ready first. One wait now owns both and releases both as soon as it
  settles. The loop starts at the same moment as before.

- [#23353](https://github.com/LedgerHQ/ledger-live/pull/23353) [`48d5c85`](https://github.com/LedgerHQ/ledger-live/commit/48d5c8543e70d0e4ee2fa30ea12590439f01f510) Thanks [@LL782](https://github.com/LL782)! - Remove the legacy `ofacGeoBlockApi` after Desktop and Mobile use `@features/flow-app-availability`

- [#23376](https://github.com/LedgerHQ/ledger-live/pull/23376) [`4ee8f78`](https://github.com/LedgerHQ/ledger-live/commit/4ee8f78997ca79d841bf0ba5642a4f2229cdbc46) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - Add a balance type sync step to the new send flow, used by Aleo to refresh private records after the pool pick

- [#23361](https://github.com/LedgerHQ/ledger-live/pull/23361) [`a02d06c`](https://github.com/LedgerHQ/ledger-live/commit/a02d06c1556ac855233d3b9b427cd812628a7aba) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Move the mobile Fear and Greed UI into the flow package

- [#22508](https://github.com/LedgerHQ/ledger-live/pull/22508) [`ad58765`](https://github.com/LedgerHQ/ledger-live/commit/ad58765b6151457022f8587d6ddcad3325ce96ac) Thanks [@pawell24](https://github.com/pawell24)! - fix(filecoin): open transactions on Blockscout from operation details

  Blockscout identifies a Filecoin message by its Ethereum-style hash, so the explorer link is now
  built from the message CID's digest instead of the CID itself.

- [#23423](https://github.com/LedgerHQ/ledger-live/pull/23423) [`c61cbe8`](https://github.com/LedgerHQ/ledger-live/commit/c61cbe8c4c383ff720812398f58907b5b6c3e982) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - fix(portfolio): show the Market 24h variation on assets whose balance did not change over the day (LIVE-39259)

- [#23389](https://github.com/LedgerHQ/ledger-live/pull/23389) [`03f4e70`](https://github.com/LedgerHQ/ledger-live/commit/03f4e70f38efc9362beae2e8ef12567cced3d3c6) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Extract address deletion into `@features/flow-contacts-delete-address` so Desktop and Mobile can reuse it without going through Contact Detail. Confirmation UI stays in `@features/platform-contacts`. Apps still own modal mounting, navigation, translations, and analytics.

- [#23023](https://github.com/LedgerHQ/ledger-live/pull/23023) [`7b01c45`](https://github.com/LedgerHQ/ledger-live/commit/7b01c45b4a1a00f240cfd9b8880146a95565f721) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(send): fix the send amount screen layout when the text size increases

- [#23459](https://github.com/LedgerHQ/ledger-live/pull/23459) [`2f9b7e9`](https://github.com/LedgerHQ/ledger-live/commit/2f9b7e97b8afee033e5fa194c5ca40a1f82a9b89) Thanks [@gre-ledger](https://github.com/gre-ledger)! - feat(account-data): full sync source on AccountBridge, serving no kind yet

- [#23302](https://github.com/LedgerHQ/ledger-live/pull/23302) [`ac7d243`](https://github.com/LedgerHQ/ledger-live/commit/ac7d243f75e6d4c00406c326f20713af1f80ca2f) Thanks [@sarneijim](https://github.com/sarneijim)! - Show genuine check error drawers during device onboarding

- [#23285](https://github.com/LedgerHQ/ledger-live/pull/23285) [`4fd1ebc`](https://github.com/LedgerHQ/ledger-live/commit/4fd1ebc94718ead589f235824f0440803341feb9) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Keep a contacts device sheet mounted until iOS has closed it, and close it once the device step is finished.

- [#23315](https://github.com/LedgerHQ/ledger-live/pull/23315) [`68cebc0`](https://github.com/LedgerHQ/ledger-live/commit/68cebc06f2ec8f4cc38ac1caca779317a8fe0711) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fetch LargeMover chart and market rows through RTK Query by ledger id, and drop the unused CoinGecko mapping client.

- [#23058](https://github.com/LedgerHQ/ledger-live/pull/23058) [`214f7f1`](https://github.com/LedgerHQ/ledger-live/commit/214f7f183ea42a7b37663251db944ad61a3ad799) Thanks [@ishaba](https://github.com/ishaba)! - feat(tron): track the sponsored send funnel in Segment

- [#23247](https://github.com/LedgerHQ/ledger-live/pull/23247) [`c18097b`](https://github.com/LedgerHQ/ledger-live/commit/c18097b2ae6fb06a530dc8a29fbfaac99ad7e942) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Load the market list with an RTK infinite query instead of React Query.

- [#23233](https://github.com/LedgerHQ/ledger-live/pull/23233) [`2cb9ecd`](https://github.com/LedgerHQ/ledger-live/commit/2cb9ecdc8baa46248716d80eb4eb68e7855c36b3) Thanks [@LL782](https://github.com/LL782)! - Switch mobile launch gating to `@features/flow-app-availability` and drop the legacy OFAC geo-block api

- [#23279](https://github.com/LedgerHQ/ledger-live/pull/23279) [`34cffc5`](https://github.com/LedgerHQ/ledger-live/commit/34cffc55056bd6759d658a3deb4d2fe63dc3abb9) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Declare `@lottiefiles/dotlottie-react` so `lottie-react-native` resolves to a single peer variant and `Podfile.lock` stops breaking on unrelated full installs.

- [#23151](https://github.com/LedgerHQ/ledger-live/pull/23151) [`004d896`](https://github.com/LedgerHQ/ledger-live/commit/004d8965c325b6ff60d5a2ebcc1c763b7a7bf4d1) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Show and export QA onboarding logs with the device answers and the machine context, and toggle the deviceOnboarding flag from the devtool

- [#23280](https://github.com/LedgerHQ/ledger-live/pull/23280) [`6a3d5ad`](https://github.com/LedgerHQ/ledger-live/commit/6a3d5ad39819c0212a6a3444954c8421fd8277b4) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Remove the Card login code from the Pay tab route after the login reads it, so a logout shows the login screen and not a login error

- [#23102](https://github.com/LedgerHQ/ledger-live/pull/23102) [`4d77514`](https://github.com/LedgerHQ/ledger-live/commit/4d775144f5032153be92d736a2f029aeb1223280) Thanks [@sarneijim](https://github.com/sarneijim)! - Move the shared device onboarding machine to features/platform

- [#23333](https://github.com/LedgerHQ/ledger-live/pull/23333) [`99efa90`](https://github.com/LedgerHQ/ledger-live/commit/99efa909f2c2d15b9d0acb23d7de5ba0b26a07dc) Thanks [@vladyslavchupovskiy-ext-art](https://github.com/vladyslavchupovskiy-ext-art)! - Load Expo's runtime before react-native-url-polyfill so the polyfill's URLSearchParams (with `size`) stays installed; fixes Aptos sends to an unfunded account failing with "insufficient funds"

- [#23424](https://github.com/LedgerHQ/ledger-live/pull/23424) [`b78f271`](https://github.com/LedgerHQ/ledger-live/commit/b78f27100786be5b0da9e8f91e6dcb791342b036) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add a script generating Podfile.lock without installing pods, usable on Linux

- [#23230](https://github.com/LedgerHQ/ledger-live/pull/23230) [`b4241c5`](https://github.com/LedgerHQ/ledger-live/commit/b4241c5fd67aa29cad563c24149d4a9a3ef5a08f) Thanks [@sarneijim](https://github.com/sarneijim)! - Add the seeded-device checks screen, its animations, and a sync offer preview

- [#23328](https://github.com/LedgerHQ/ledger-live/pull/23328) [`e1ba29a`](https://github.com/LedgerHQ/ledger-live/commit/e1ba29a3b2d57f519914d64faf59e55834a9ed2c) Thanks [@sarneijim](https://github.com/sarneijim)! - Open the existing Ledger Sync skip confirmation from the seeded offer

- [#23226](https://github.com/LedgerHQ/ledger-live/pull/23226) [`dd34e1b`](https://github.com/LedgerHQ/ledger-live/commit/dd34e1b8929faff2869d6d3a2366acc16c649229) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Shorten the device intent executor component names

- [#23220](https://github.com/LedgerHQ/ledger-live/pull/23220) [`a8d48a9`](https://github.com/LedgerHQ/ledger-live/commit/a8d48a97f1bae0c2adad5d2790c9cc8ab5d7c2b0) Thanks [@abdurrahman-ledger](https://github.com/abdurrahman-ledger)! - Support protected Speculinho sessions in E2E. Speculos transports take the session's `bearerToken` (`SpeculosHttpTransportOpts`, `SpeculosSessionTarget`, the mobile `SpeculosTarget`; `DeviceManagementKitTransportSpeculos` and the desktop transport default to `SPECULOS_SESSION_TOKEN`) and keep a separate DMK per token. E2E acquires sessions with `protected: true` and authenticates every operator and Speculos request; the mobile e2e bridge passes the token to the app and now requires a per-run connection token. Bumps `@ledgerhq/device-transport-kit-speculos` to 1.3.0 and `@ledgerhq/speculos-device-controller` to 0.4.0.

- [#23511](https://github.com/LedgerHQ/ledger-live/pull/23511) [`874b720`](https://github.com/LedgerHQ/ledger-live/commit/874b720315f63da00d714b0575dfacecbe122e34) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Align @react-native/community-cli-plugin with react-native 0.81.6 and drop the stale 0.77.3 tree

- [#23003](https://github.com/LedgerHQ/ledger-live/pull/23003) [`57b4652`](https://github.com/LedgerHQ/ledger-live/commit/57b4652a1d0ae95af20419210139039642cedb9c) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Adapt to `@ledgerhq/coin-evm` 15

- [#23472](https://github.com/LedgerHQ/ledger-live/pull/23472) [`b88647d`](https://github.com/LedgerHQ/ledger-live/commit/b88647dca4c613663bca4ba0d62c2296b95ac083) Thanks [@sarneijim](https://github.com/sarneijim)! - Add connectUnseededDevice to deviceOnboarding and edit that mock from the mobile onboarding devtool

- [#23261](https://github.com/LedgerHQ/ledger-live/pull/23261) [`02b383b`](https://github.com/LedgerHQ/ledger-live/commit/02b383b7d11352d121556bb6f0a076c2b960b9eb) Thanks [@alexstapenka-ledger](https://github.com/alexstapenka-ledger)! - Add a withdraw icon to the earn action confirmation dialog, a `custom.dialog.menu` action menu dialog on desktop for the Earn "Earn more" / "Withdraw all" choice, and the `earnWithdrawV2` feature flag that gates the Earn full withdraw flow

### Patch Changes

- Updated dependencies [[`a86963c`](https://github.com/LedgerHQ/ledger-live/commit/a86963c2401573e3d5fef6b9623bae1e23126178), [`68c2837`](https://github.com/LedgerHQ/ledger-live/commit/68c2837d114092c6f421cfe5d5a97ce48d69667c), [`ec7b8b9`](https://github.com/LedgerHQ/ledger-live/commit/ec7b8b9f1c0821ffb9973a174bc2f693719215ab), [`1349df3`](https://github.com/LedgerHQ/ledger-live/commit/1349df3f6e9a27eeecc8495ca99a453341d7bf70), [`c9beaff`](https://github.com/LedgerHQ/ledger-live/commit/c9beaff3b51d3a50f310be73a830bf6e944e61fa), [`4831311`](https://github.com/LedgerHQ/ledger-live/commit/4831311fd859631a9248441e469f52c18fb42c52), [`2ebd029`](https://github.com/LedgerHQ/ledger-live/commit/2ebd029cd006cb89ceb240705247ccf5529c3c50), [`d6ab47c`](https://github.com/LedgerHQ/ledger-live/commit/d6ab47c28339866ad88ef0deba75d314c2f6c4f0), [`393a02a`](https://github.com/LedgerHQ/ledger-live/commit/393a02a42be9f0410b75c0c34203915bcde27e43), [`ee508db`](https://github.com/LedgerHQ/ledger-live/commit/ee508db35d572d43e03cf58e811177cc3b2389a9), [`623f8e6`](https://github.com/LedgerHQ/ledger-live/commit/623f8e6181d92aed3a49aa993be9d4fe0bbd8e39), [`d2b8471`](https://github.com/LedgerHQ/ledger-live/commit/d2b84711b137f42930f006f7a079fc104c92633d), [`6032338`](https://github.com/LedgerHQ/ledger-live/commit/60323388dea6a0957aa836c73657b58d26765321), [`2ec955a`](https://github.com/LedgerHQ/ledger-live/commit/2ec955a5928085cff093d5c9a167f2761a055dcc), [`b0c722a`](https://github.com/LedgerHQ/ledger-live/commit/b0c722adc2665c1552b787636292314d03734c0b), [`e4e90c0`](https://github.com/LedgerHQ/ledger-live/commit/e4e90c06160288d2b6aa70706b741c410b413af6), [`722c6f3`](https://github.com/LedgerHQ/ledger-live/commit/722c6f312e9fd8c33c932ef2f4df15d9062ade31), [`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c), [`c32fa7b`](https://github.com/LedgerHQ/ledger-live/commit/c32fa7be07b04ef0db38e0877f18d613d32d087e), [`ead8b59`](https://github.com/LedgerHQ/ledger-live/commit/ead8b59eafe301b82efbe38bf6d2379b6e77b233), [`257305f`](https://github.com/LedgerHQ/ledger-live/commit/257305f907b207ac54e4e9bd9ace6a78ce554bb1), [`beea4cd`](https://github.com/LedgerHQ/ledger-live/commit/beea4cd9cccfbfa99a03bfb878f83353ef89d41c), [`f51fe16`](https://github.com/LedgerHQ/ledger-live/commit/f51fe16f67f2c50f36d772a60121ed3d7ae12c6a), [`fc846e5`](https://github.com/LedgerHQ/ledger-live/commit/fc846e53bbe5023223aa847b6e00b68fb22ace4a), [`b79ccab`](https://github.com/LedgerHQ/ledger-live/commit/b79ccab839cc7916ff3ecd910479904f87a6e59d), [`7b3040a`](https://github.com/LedgerHQ/ledger-live/commit/7b3040ad872c183fd2beb81a965037b5310ab87a), [`b599cb2`](https://github.com/LedgerHQ/ledger-live/commit/b599cb25afbc5ce2dbdcd0cc1b6126a49bba8068), [`3c062fc`](https://github.com/LedgerHQ/ledger-live/commit/3c062fccd90c705eee581800c0dd416f1b61ebe2), [`de8fe99`](https://github.com/LedgerHQ/ledger-live/commit/de8fe99f01d9d6248437fc8a914f12fc83d6e470), [`3527dbc`](https://github.com/LedgerHQ/ledger-live/commit/3527dbc69a05745b272741566b20634d79462cb8), [`80f99a8`](https://github.com/LedgerHQ/ledger-live/commit/80f99a819b13d3ec2bd39d896de46e0a433b9954), [`7da1ea9`](https://github.com/LedgerHQ/ledger-live/commit/7da1ea9534a1bdde063e31545363a27f0fdf5abb), [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574), [`2f9c159`](https://github.com/LedgerHQ/ledger-live/commit/2f9c1598145b8a7dadab43b12a5deb4ab9dc91c9), [`a654488`](https://github.com/LedgerHQ/ledger-live/commit/a654488d68942852ffa880a60ae674ff44a18918), [`6abfd98`](https://github.com/LedgerHQ/ledger-live/commit/6abfd98fd3d0359864687b2fc125390f3643a6db), [`2621f1e`](https://github.com/LedgerHQ/ledger-live/commit/2621f1ebe6c1a8f8cff0a797740771ae5fc084be), [`3ad1a61`](https://github.com/LedgerHQ/ledger-live/commit/3ad1a619eb1244d9adb8e4e67c250a2687716175), [`bcf98ff`](https://github.com/LedgerHQ/ledger-live/commit/bcf98ffbb1d119fba86c53e4c005abdad251b62a), [`75498cf`](https://github.com/LedgerHQ/ledger-live/commit/75498cf55065bccf17d09b780866ae031c01701a), [`ad6aad8`](https://github.com/LedgerHQ/ledger-live/commit/ad6aad8eec3a718da9359ad683350360f745d0d5), [`47e5b74`](https://github.com/LedgerHQ/ledger-live/commit/47e5b740cf64f177fd1cbbfa7f5bf74de3d45661), [`ff33162`](https://github.com/LedgerHQ/ledger-live/commit/ff331621a49337b1065c373f16aa479fa0ab5c8b), [`5e9a60a`](https://github.com/LedgerHQ/ledger-live/commit/5e9a60ac27b41be43d1ea24b0d11acec92260c49), [`7e54483`](https://github.com/LedgerHQ/ledger-live/commit/7e544837b934b55e0743faaabacfc89d922e9435), [`e5762fc`](https://github.com/LedgerHQ/ledger-live/commit/e5762fc3dc7bb36007c8133efefeeb6523cebf05), [`a782d57`](https://github.com/LedgerHQ/ledger-live/commit/a782d57262cda0475c54417c8b769955df316e78), [`a02d06c`](https://github.com/LedgerHQ/ledger-live/commit/a02d06c1556ac855233d3b9b427cd812628a7aba), [`ad58765`](https://github.com/LedgerHQ/ledger-live/commit/ad58765b6151457022f8587d6ddcad3325ce96ac), [`03f4e70`](https://github.com/LedgerHQ/ledger-live/commit/03f4e70f38efc9362beae2e8ef12567cced3d3c6), [`ff14496`](https://github.com/LedgerHQ/ledger-live/commit/ff14496257201991b52f0dd140e351fca3e84d4d), [`e66d21e`](https://github.com/LedgerHQ/ledger-live/commit/e66d21ea7ccb706d718703b69d2133ede3294c1a), [`4fd1ebc`](https://github.com/LedgerHQ/ledger-live/commit/4fd1ebc94718ead589f235824f0440803341feb9), [`68cebc0`](https://github.com/LedgerHQ/ledger-live/commit/68cebc06f2ec8f4cc38ac1caca779317a8fe0711), [`ed10647`](https://github.com/LedgerHQ/ledger-live/commit/ed10647dedd2642ac5316f89595b618180097e33), [`bcea51b`](https://github.com/LedgerHQ/ledger-live/commit/bcea51b0b2c9ef09b9e068f97ed3c67a0e45e188), [`2e198e2`](https://github.com/LedgerHQ/ledger-live/commit/2e198e2394723873a79e56635cfe21a2ab763454), [`3fadda7`](https://github.com/LedgerHQ/ledger-live/commit/3fadda73d3131279b8a318cf15a29778f62d15cd), [`004d896`](https://github.com/LedgerHQ/ledger-live/commit/004d8965c325b6ff60d5a2ebcc1c763b7a7bf4d1), [`98c994b`](https://github.com/LedgerHQ/ledger-live/commit/98c994bc1f46a03366096531afac2471f07f397b), [`6639142`](https://github.com/LedgerHQ/ledger-live/commit/6639142cc619d0758ba7873dafbc3e32944f250f), [`2cd35c5`](https://github.com/LedgerHQ/ledger-live/commit/2cd35c5e21a9dfe58ca58349280f33266143ca51), [`4d77514`](https://github.com/LedgerHQ/ledger-live/commit/4d775144f5032153be92d736a2f029aeb1223280), [`307d5c0`](https://github.com/LedgerHQ/ledger-live/commit/307d5c0da2fc42ee1699e6b48073255276456dd6), [`37a49df`](https://github.com/LedgerHQ/ledger-live/commit/37a49df18649912157d8f269c3b4153d54b7817e), [`0ace271`](https://github.com/LedgerHQ/ledger-live/commit/0ace2718ac29bc9926858af41424177ff3363d47), [`ca063c4`](https://github.com/LedgerHQ/ledger-live/commit/ca063c4cfad79f12118c5af5bc0ef323857f90bd), [`2c6e74a`](https://github.com/LedgerHQ/ledger-live/commit/2c6e74a12a542cb47507ec98ae85ace8fa526171), [`e345c82`](https://github.com/LedgerHQ/ledger-live/commit/e345c829b04e28d489b9cf4d8384ed57dbad0321), [`696357f`](https://github.com/LedgerHQ/ledger-live/commit/696357f754751853758d67c88bf34df9302b9b97), [`a2ef1bf`](https://github.com/LedgerHQ/ledger-live/commit/a2ef1bf1a96b8f59795897fcd9dcd0f0e6fd3295), [`a8d48a9`](https://github.com/LedgerHQ/ledger-live/commit/a8d48a97f1bae0c2adad5d2790c9cc8ab5d7c2b0), [`ed89930`](https://github.com/LedgerHQ/ledger-live/commit/ed89930df1e705c535e5c4cccd62033654f5a145), [`0d5c35d`](https://github.com/LedgerHQ/ledger-live/commit/0d5c35d9f29e17c3ad7bcb7632dcaea83d47e7d3), [`b88647d`](https://github.com/LedgerHQ/ledger-live/commit/b88647dca4c613663bca4ba0d62c2296b95ac083), [`02b383b`](https://github.com/LedgerHQ/ledger-live/commit/02b383b7d11352d121556bb6f0a076c2b960b9eb)]:
  - @shared/feature-flags@0.27.0-next.0
  - @features/flow-account-detail-settings@0.1.0-next.0
  - @features/flow-contacts-detail@0.2.0-next.0
  - @features/flow-contacts@0.15.0-next.0
  - @features/flow-pay-contact@0.7.0-next.0
  - @ledgerhq/coin-concordium@1.6.0-next.0
  - @shared/ui-queued-bottom-sheet@0.7.0-next.0
  - @domain/entity-currency-crypto@0.16.0-next.0
  - @shared/app-config@0.1.0-next.0
  - @shared/env@0.11.0-next.0
  - @shared/auth@0.7.0-next.0
  - @ledgerhq/coin-bitcoin@1.0.0-next.0
  - @features/flow-account-detail@0.1.0-next.0
  - @features/flow-pay-card-details@0.8.0-next.0
  - @ledgerhq/native-ui@0.69.0-next.0
  - @devtools/shell@0.11.0-next.0
  - @features/flow-fear-and-greed@0.4.0-next.0
  - @features/flow-contacts-introduction@1.5.0-next.0
  - @features/flow-contacts-list@0.10.0-next.0
  - @features/flow-pay-balance@0.8.0-next.0
  - @features/flow-pay-card-assets@0.4.0-next.0
  - @features/flow-pay-card-transactions@0.6.0-next.0
  - @features/flow-pay-card-widget@0.6.0-next.0
  - @features/flow-pay-deposit@0.6.0-next.0
  - @features/flow-pay-request@0.9.0-next.0
  - @features/platform-contacts@0.11.0-next.0
  - @shared/ui-info-state@0.5.0-next.0
  - @domain/entity-account-balance@0.2.0-next.0
  - @domain/entity-account-data@0.2.0-next.0
  - @domain/api-account-data@0.2.0-next.0
  - @domain/entity-account@0.1.0-next.0
  - @features/flow-contacts-add-contact@0.8.0-next.0
  - @features/platform-currencies@0.10.0-next.0
  - @features/platform-account-analytics@0.2.0-next.0
  - @features/flow-contacts-add-address@0.7.0-next.0
  - @ledgerhq/coin-stacks@0.34.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.8.0-next.0
  - @ledgerhq/types-live@6.128.0-next.0
  - @ledgerhq/coin-cosmos@2.0.0-next.0
  - @features/flow-contacts-edit-address@0.5.0-next.0
  - @domain/entity-market-countervalues@0.4.0-next.0
  - @features/platform-market-countervalues@0.3.0-next.0
  - @features/flow-contacts-delete-address@0.2.0-next.0
  - @features/flow-contacts-delete-contact@0.3.0-next.0
  - @features/flow-contacts-edit-contact@0.7.0-next.0
  - @ledgerhq/coin-filecoin@2.5.0-next.0
  - @features/platform-device-onboarding@0.2.0-next.0
  - @devtools/bindings@0.12.0-next.0
  - @ledgerhq/coin-casper@3.6.0-next.0
  - @ledgerhq/live-dmk-speculos@0.12.0-next.0
  - @features/flow-app-availability@0.2.0-next.0
  - @ledgerhq/live-dmk-mobile@0.32.0-next.0
  - @ledgerhq/live-dmk-shared@0.36.0-next.0
  - @ledgerhq/coin-canton@1.5.0-next.0
  - @features/flow-large-screen-upsell@2.2.3-next.0
  - @features/flow-pay-feature-tour@0.8.1-next.0
  - @features/platform-feature-flags@0.9.1-next.0
  - @features/platform-feature-flags-firebase@0.1.1-next.0
  - @features/flow-app-longer-password@0.1.1-next.0
  - @features/flow-app-password-removal@0.1.1-next.0
  - @features/flow-app-protection-prompt@0.1.1-next.0
  - @features/flow-pay-bank-transfer@0.4.1-next.0
  - @features/flow-pay-card-auth@0.10.1-next.0
  - @ledgerhq/live-send@0.1.4-next.0
  - @domain/api-aggregated-assets@0.6.1-next.0
  - @domain/api-currency-token@0.6.5-next.0
  - @domain/api-market-countervalues@0.2.1-next.0
  - @domain/entity-contact@0.12.1-next.0
  - @domain/entity-currency@0.4.7-next.0
  - @domain/entity-currency-token@0.5.6-next.0
  - @ledgerhq/live-wallet@1.1.7-next.0
  - @ledgerhq/wallet-analytics@0.5.2-next.0
  - @ledgerhq/wallet-pnl@0.8.1-next.0
  - @features/platform-aggregated-assets@0.5.7-next.0
  - @features/platform-env@0.4.3-next.0
  - @ledgerhq/transaction-observability@0.5.1-next.0
  - @shared/api-services@0.10.1-next.0
  - @features/flow-pay-card@0.7.1-next.0
  - @features/flow-app-unlock@0.1.1-next.0
  - @devtools/transport-panel@0.7.0
  - @domain/entity-account-name@0.2.3-next.0
  - @domain/entity-starred-account@0.0.2-next.0
  - @ledgerhq/coin-multiversx@1.4.1-next.0
  - @ledgerhq/live-signer-evm@0.24.2-next.0
  - @ledgerhq/device-core@0.11.20-next.0
  - @ledgerhq/live-signer-tron@0.2.2-next.0
  - @features/flow-analytics-consent@0.2.10-next.0
  - @features/platform-content-ab-tests@0.2.1-next.0
  - @domain/api-card-management@0.8.2-next.0
  - @domain/api-currency-fiat@0.4.8-next.0
  - @domain/api-market-index-altcoin-season@0.4.2-next.0
  - @domain/api-market-index-fear-and-greed@0.4.2-next.0
  - @domain/api-push-devices@0.2.9-next.0
  - @features/platform-card@0.8.1-next.0

## 4.24.0

### Minor Changes

- [#23139](https://github.com/LedgerHQ/ledger-live/pull/23139) [`320d2a1`](https://github.com/LedgerHQ/ledger-live/commit/320d2a1fbbe0d661681913d75f76bd70c4698115) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Resolve the market id of an asset from the ledger ids when needed, so favorites added from search show up in the Market banner

- [#22843](https://github.com/LedgerHQ/ledger-live/pull/22843) [`c954015`](https://github.com/LedgerHQ/ledger-live/commit/c954015d149a86adc8a1cdfcda41a71313171b68) Thanks [@semeano](https://github.com/semeano)! - feat(stacks): add mobile stake and unstake flows

- [#23025](https://github.com/LedgerHQ/ledger-live/pull/23025) [`6ec6cb7`](https://github.com/LedgerHQ/ledger-live/commit/6ec6cb7a760cb9da3762c7f3afc467675894e743) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Align the Contacts search no-results state with the design and update its copy

- [#23143](https://github.com/LedgerHQ/ledger-live/pull/23143) [`4101467`](https://github.com/LedgerHQ/ledger-live/commit/4101467e60d17f1facfae9c71e5b684bcf9f48e3) Thanks [@LucasWerey](https://github.com/LucasWerey)! - refactor(contacts): clean up the Contacts debug tools

  The send-history contacts builder was copied in both apps. It now lives once in
  `@domain/entity-contact/schema.mock` as `mockContactsFromSendHistory`. `@features/platform-contacts`
  adds `parseExcludedCurrencyIdsInput`, which works like `parseEligibleAddressFamiliesInput`. The
  desktop tool no longer copies flag params into local state with effects. Its inputs show the flag
  value unless you are editing them, use `cn`, and have no hard-coded strings left. The mobile tool
  drops its `StyleSheet`, shows the families as tags, and builds the flag preview in its view model.

- [#23101](https://github.com/LedgerHQ/ledger-live/pull/23101) [`6da6010`](https://github.com/LedgerHQ/ledger-live/commit/6da6010c5a783ed2957251f7f5d86df3b3c44138) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Replace react-native-linear-gradient with Lumen LinearGradient

- [#23064](https://github.com/LedgerHQ/ledger-live/pull/23064) [`82e9e1e`](https://github.com/LedgerHQ/ledger-live/commit/82e9e1e8feaf31b34916d0ea99f83fb1880d02a4) Thanks [@koda-apps](https://github.com/apps/koda-apps)! - Replace react-native-device-info and react-native-version-number with expo-device and expo-application

- [#23062](https://github.com/LedgerHQ/ledger-live/pull/23062) [`3bd2949`](https://github.com/LedgerHQ/ledger-live/commit/3bd294966d19cdd2ff0e8a06609d386d55aeb14e) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Replace react-native-image-picker with expo-image-picker for the custom lock screen gallery import

- [#23035](https://github.com/LedgerHQ/ledger-live/pull/23035) [`20bf9b0`](https://github.com/LedgerHQ/ledger-live/commit/20bf9b0c8694e9a3c873da1e81fd6b310410205c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Route every copy/paste through the new @shared/clipboard package (expo-clipboard replaces @react-native-clipboard/clipboard on mobile) and enforce it with lint rules; copy feedback now only shows once the copy succeeded

- [#23043](https://github.com/LedgerHQ/ledger-live/pull/23043) [`4028b7e`](https://github.com/LedgerHQ/ledger-live/commit/4028b7e53019ef07b2e94a6559c5f8a6ba54b82f) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Hold back a per-currency fee buffer when depositing the max of a native coin into perps, configured by the new `ptxTradeMaxConstant` flag (`feature_ptx_trade_max_constant`). Only the MAX ratio is reduced; token accounts and other ratios are unchanged.

- [#22860](https://github.com/LedgerHQ/ledger-live/pull/22860) [`21fa5a5`](https://github.com/LedgerHQ/ledger-live/commit/21fa5a533d3369db9586a38d6fa869f8c03121af) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Send the user back to the perps deposit form when they retry after a "not enough balance" error. Retrying re-ran the same deposit, which could only fail again; the form now reopens with the draft amount and funding account so the amount can be lowered. Other errors still retry in place

- [#22856](https://github.com/LedgerHQ/ledger-live/pull/22856) [`438c7b3`](https://github.com/LedgerHQ/ledger-live/commit/438c7b3035ac460e702d294a3c17db2843962d21) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Hide accounts that cannot send, such as HyperCore, from the perps deposit funding picker. The receiving HyperCore account was still offered as a funding source even though a deposit cannot be sent from it. The picker now opens in the `perpetuals:fund` flow, which rejects send-disabled families, so modular dialog analytics from that picker report `flow: "perpetuals:fund"`

- [#22890](https://github.com/LedgerHQ/ledger-live/pull/22890) [`ee95a8e`](https://github.com/LedgerHQ/ledger-live/commit/ee95a8e0c4cdce091dfc1cb0e9b54445030f079c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - fix(cg-client): remove the unused CoinGecko supported coins list query

  Removes `getSupportedCoinsList`, `useGetSupportedCoinsListQuery`, `useSupportedCurrencies`, `MarketCoinSchema`, `SupportedCoinsSchema` and the `MarketCoin` / `SupportedCoins` types. `useMarketDataProvider` now only returns `supportedCounterCurrencies`.

- [#23228](https://github.com/LedgerHQ/ledger-live/pull/23228) [`27d0cc9`](https://github.com/LedgerHQ/ledger-live/commit/27d0cc934120f4a57f3a63fe6a791cc74fee106e) Thanks [@ovoronkov-ledger](https://github.com/ovoronkov-ledger)! - fix(receive): keep network warning above verify address cta (LIVE-38002)

- [#22866](https://github.com/LedgerHQ/ledger-live/pull/22866) [`52747b3`](https://github.com/LedgerHQ/ledger-live/commit/52747b3d876e34712619bd17206cd4aa23e07636) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Name the default Me contact "Me" in the Pay tab contacts list instead of "My addresses (Me)"

- [#23053](https://github.com/LedgerHQ/ledger-live/pull/23053) [`2a09181`](https://github.com/LedgerHQ/ledger-live/commit/2a091816a8ec716c0bba802767671052c75843e8) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Show each stablecoin as its own Pay balance filter option, including testnet holdings

- [#23126](https://github.com/LedgerHQ/ledger-live/pull/23126) [`f0210f9`](https://github.com/LedgerHQ/ledger-live/commit/f0210f97c54a1bd452eacbca278d4b7dbed2fff5) Thanks [@dgreen-ledger](https://github.com/dgreen-ledger)! - fix(notifications): request POST_NOTIFICATIONS on Android 13+

  Firebase's `requestPermission` is a no-op on Android, so since #13457 the system notification
  prompt was never shown on Android 13 and above: tapping allow opened App info and push
  notifications stayed blocked. The app now requests `POST_NOTIFICATIONS` through
  `PermissionsAndroid` on Android 13+, and only opens the settings once the permission can no
  longer be requested.

- [#22436](https://github.com/LedgerHQ/ledger-live/pull/22436) [`23455ab`](https://github.com/LedgerHQ/ledger-live/commit/23455abfdc26b44eedd77a1c990a6721dadd3f5c) Thanks [@ysitbon](https://github.com/ysitbon)! - Add the countervalues domain api: rate fetching, and the orchestration that folds rates into the entity state.

  - `@domain/api-market-countervalues` owns the Countervalues Service endpoints and `loadCountervalues`, which moves out of `@ledgerhq/live-countervalues`.
  - The endpoints are injected into the shared countervalues api from `@shared/api-services` instead of standing up a second slice. The duplicate client in live-common is removed, so each app registers one countervalues reducer where it previously registered two against the same host. That slice is an RTK Query cache and is not persisted, so there is no stored state to migrate.
  - `loadCountervalues` takes its rates as an argument rather than reaching for a module-level client. The apps compose one in the countervalues bridge they already own; tests pass a mock directly, which removes the `MOCK_COUNTERVALUES` dispatcher hidden inside the fetch path.
  - Rate failures carry the HTTP status through unchanged, so an unsupported pair still clears its cache on 422, an HTTP failure still increments the per-pair backoff, and an offline period still does not.
  - Rate requests keep the previous request policy: a 60s timeout, so a hung connection can no longer stall countervalues polling, and the same retries as before. The two endpoints moved out of live-common keep not retrying.
  - `@ledgerhq/live-countervalues` drops `loadCountervalues`, its `api` entry point and the fetch contract types, and with them its dependencies on `@ledgerhq/logs`, `@ledgerhq/live-network`, `@ledgerhq/live-promise` and `@ledgerhq/live-env`. It no longer reaches the network.
  - web-tools now registers the shared countervalues api, which its portfolio countervalues loading dispatches through.
  - `cvsApiExtra` takes `getCountervaluesServiceUrl`, a getter read on every request, in place of the `countervaluesServiceUrl` string read once at store creation. Switching the developer staging toggle now applies to the next countervalues request again, as it did before the rates moved onto the shared api.

- [#22689](https://github.com/LedgerHQ/ledger-live/pull/22689) [`011766d`](https://github.com/LedgerHQ/ledger-live/commit/011766dd9d888920fe07db040eb4421d98b02160) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Report revamped protection clicks as `button_clicked` and completed activation, deactivation, and migration as `encryption_updated`

- [#22648](https://github.com/LedgerHQ/ledger-live/pull/22648) [`15491fb`](https://github.com/LedgerHQ/ledger-live/commit/15491fb3b72f27c41e24f076d23c4c83dc69abe5) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Move the app lock UI shared by several journeys into `@features/platform-app-lock`.

  `PasswordField` and the password draft (`PasswordDraftProvider`, `usePasswordDraft`) leave `@features/flow-app-lock`, which no longer exports them, for `@features/platform-app-lock`, exported from its native entry only. This is the first step of splitting the app lock flow into one package per journey: unlock, password setup and removal, longer password and the protection prompt each need these pieces, and none of them should depend on another journey to get them. No behaviour changes.

- [#22817](https://github.com/LedgerHQ/ledger-live/pull/22817) [`57b333d`](https://github.com/LedgerHQ/ledger-live/commit/57b333de5cab7b3e387aab8cb45de0a7705bd8ec) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Move the mandatory longer-password journey out of `@features/flow-app-lock` into a new `@features/flow-app-longer-password` package: `useLongerPasswordViewModel`, `LongerPasswordView` and its enter and confirm steps, `ChangePasswordSheet` and `PasswordChangedSheet`. The app's longer-password gate imports them from there, and the enter and confirm steps still reuse `@features/flow-app-password-setup`, which `@features/flow-app-lock` no longer depends on. No behaviour change.

- [#22792](https://github.com/LedgerHQ/ledger-live/pull/22792) [`9894c78`](https://github.com/LedgerHQ/ledger-live/commit/9894c78c32b055686c15db66e8369a7a3b12748a) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Move the password removal journey — the Deactivate password step and the sheet that keeps the last protection while a card is active — out of `@features/flow-app-lock` into a new `@features/flow-app-password-removal` package. The Settings password and biometrics rows and the Deactivate password screen import it from there. No behaviour change.

- [#22785](https://github.com/LedgerHQ/ledger-live/pull/22785) [`6225945`](https://github.com/LedgerHQ/ledger-live/commit/6225945749be628b088bbb65a102a40f984a569c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Move the app password setup steps into their own flow package, `@features/flow-app-password-setup`.

  The Setup password and Confirm password steps (`useSetupPasswordViewModel`, `SetupPasswordView`, `useConfirmPasswordViewModel`, `ConfirmPasswordView`) leave `@features/flow-app-lock`, which no longer exports them, for `steps/SetupPassword` and `steps/ConfirmPassword` in the new package. The app's add-password screens import them from there, and the longer-password journey, still in `@features/flow-app-lock`, reuses them through the new package. Third step of splitting the app lock flow into one package per journey. No behaviour changes.

- [#22828](https://github.com/LedgerHQ/ledger-live/pull/22828) [`9a947ef`](https://github.com/LedgerHQ/ledger-live/commit/9a947ef9a6cab8dc20865369676b13129fa7bf99) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Move the app protection prompt — `useProtectionPromptViewModel`, `EnableProtectionSheet` and `ProtectionEnabledSheet` — into a new `@features/flow-app-protection-prompt` package, and delete `@features/flow-app-lock`, now empty. The app's protection prompt imports from the new package. Last step of splitting the app lock flow into one package per journey. No behaviour change.

- [#22693](https://github.com/LedgerHQ/ledger-live/pull/22693) [`b18cbdb`](https://github.com/LedgerHQ/ledger-live/commit/b18cbdbabb25a9ffd1e44f7289f17fea4aba1266) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Move the app unlock journey into its own flow package, `@features/flow-app-unlock`.

  The unlock screen (`useUnlockViewModel`, `UnlockView`, the splash and focus rules) and the forgotten password sheet leave `@features/flow-app-lock`, which no longer exports them. They follow the flow layout, `steps/Unlock` with the sheet under `steps/Unlock/components`, and the app's unlock screen imports them from the new package. Second step of splitting the app lock flow into one package per journey. No behaviour changes.

- [#22993](https://github.com/LedgerHQ/ledger-live/pull/22993) [`6b2c0c6`](https://github.com/LedgerHQ/ledger-live/commit/6b2c0c6a4439e365ec3c58aa388619f44623a047) Thanks [@ovoronkov-ledger](https://github.com/ovoronkov-ledger)! - fix(asset-detail): stop cropping translated time range labels in the chart selector (LIVE-33383)

- [#22759](https://github.com/LedgerHQ/ledger-live/pull/22759) [`bf29f88`](https://github.com/LedgerHQ/ledger-live/commit/bf29f888316e5d8d9049b763a8c77ce9850f07df) Thanks [@qperrot](https://github.com/qperrot)! - fix(coin-bitcoin): read the explorer and tuning values from the injected coin config

  The module no longer keeps configuration in module state. `createBridges` takes a `Context`
  (ADR-019) and every bridge method resolves `config_currency_<id>` from `context.config()` at call
  time. The endpoint `explorer.url` is required and defaults to today's production host in each
  served `config_currency_<id>` (`http://localhost:9876` for `bitcoin_regtest`, whose `btc_regtest`
  explorer id also moves to its config). The optional fields fall back to named module defaults:
  `explorer.batchSize` (`DEFAULT_EXPLORER_BATCH_SIZE`, 1000), `fees.stuckTransactionTimeoutMs`
  (`DEFAULT_STUCK_TRANSACTION_TIMEOUT_MS`, 20 min), `fees.rbfMinBumpRatio`
  (`DEFAULT_RBF_MIN_BUMP_RATIO`, 0.1), `fees.calculationCacheTtlMs` and `fees.feeRatesCacheTtlMs`
  (5 min each) and `sync.replacedOperationExpiryMs` (`DEFAULT_REPLACED_OPERATION_EXPIRY_MS`, 2 h).
  The explorer is bound to a wallet-btc account from the config at use, so deserialization stays
  config-free and a remote change applies on the next call. wallet-btc still reads no configuration:
  the batch size is injected through `WalletBtcCurrency.explorerBatchSize`, and the RBF ratio and
  the unconfirmed-operation expiry are parameters.

  Breaking: `createBridges(signerContext, context)` takes a `Context` instead of a config getter;
  `setCoinConfig`, `getCoinConfig`, `CoinConfig`, `BitcoinConfigInfo`, `makeAssignFromAccountRaw`
  and `getMinRelayFee` are removed in favour of `BitcoinCoinConfig` / `BitcoinContext` and
  `assignFromAccountRaw`, and `postSync` becomes `makePostSync(context)`. The module logs only
  through `context.logger`: `buildTransaction`, `getTransactionStatus`, `prepareTransaction`,
  `calculateFees`, `signAccountTx`, `ChainAdapter.resolveFeePerByte`, `buildSignRawOperation` and the
  `hw-getAddress` / `hw-getFullViewingKey` resolvers take a `Logger`. `prepareTransaction`, `getTransactionStatus`, `buildTransaction`,
  `buildAccountTx`, `getOriginalTxFeeContext`, `getMinReplacementFeeSat`,
  `getMinReplacementFeeRateSatVb` and `getRbfContext` take the coin config as first parameter. The
  `getEditTransactionStatus` and `isStrategyDisabled` bridge extensions require the `mainAccount`. The `EXPLORER_REGTEST` and `BITCOIN_STUCK_TRANSACTION_TIMEOUT` envs are
  removed, as are the `config_currency_<id>` defaults of the bitcoin-family currencies no loader
  serves (`bitcoin_private`, `game_credits`, `gochain`, `lbry`, `nix`, `ravencoin`, `resistance`,
  `zclassic`, `zcoin`).

- [#22938](https://github.com/LedgerHQ/ledger-live/pull/22938) [`7a2505b`](https://github.com/LedgerHQ/ledger-live/commit/7a2505bd21cc2401e1e887cb5b9713281cb11519) Thanks [@qperrot](https://github.com/qperrot)! - Rename BNB Chain to BNB Smart Chain

- [#22599](https://github.com/LedgerHQ/ledger-live/pull/22599) [`d819300`](https://github.com/LedgerHQ/ledger-live/commit/d819300df11d1e58ad33dbb8d0dbdb6f20c8dd93) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Add failureType and subError properties to Device Intent Executor deviceflow_failed and deviceflow_aborted events

- [#23080](https://github.com/LedgerHQ/ledger-live/pull/23080) [`4e7c1ae`](https://github.com/LedgerHQ/ledger-live/commit/4e7c1ae11a76a078d027dac7584fd68bd0a82811) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Migrate mobile Add Account off pre-ldls onto Lumen and remove the native pre-ldls entry

- [#22995](https://github.com/LedgerHQ/ledger-live/pull/22995) [`3444d16`](https://github.com/LedgerHQ/ledger-live/commit/3444d16d5159b6e415b4dd0ab4fedfbf4cbeb260) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Implement the final Discovering, Connecting and Connected views of `ConnectNewDevice`, on a true black background. The animations come from the Figma Symbols Library in a light and a dark version, and they include their animated spot. The Discovering copy and animation depend on the scanned transports: Bluetooth, Bluetooth and USB, or USB only. Each discovered device shows in a card with a Connect button. For a USB device, the Connecting and Connected views say "connecting" and "connected" instead of "pairing" and "paired".

  The Connect New Device debug screen now mounts the component alone, as a caller does, and unmounts it when `onConnected`, `onDeviceNotFound` or `onClose` ends the flow. Its log also shows each mount and unmount.

  `onDeviceNotFound` is now optional: the "I don't see my device" button shows only when the caller passes it.

  A Connect New Device animations debug screen previews each of these Lotties, in the light and the dark theme.

- [#23021](https://github.com/LedgerHQ/ledger-live/pull/23021) [`3dacfc2`](https://github.com/LedgerHQ/ledger-live/commit/3dacfc29377ad8a8ac25ad51f2207c882491bb7e) Thanks [@fAnselmi-Ledger](https://github.com/fAnselmi-Ledger)! - Bump `@ledgerhq/device-management-kit` to 1.11.0 and `@ledgerhq/dmk-ledger-wallet` to 0.7.0.

- [#23246](https://github.com/LedgerHQ/ledger-live/pull/23246) [`71c5860`](https://github.com/LedgerHQ/ledger-live/commit/71c58602037e7dc69e35b99fb648c11e365adcd1) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Bump `@ledgerhq/dmk-ledger-wallet` to 0.7.1, `@ledgerhq/device-transport-kit-speculos` to 1.3.0 and `@ledgerhq/speculos-device-controller` to 0.4.0.

- [#23000](https://github.com/LedgerHQ/ledger-live/pull/23000) [`0710383`](https://github.com/LedgerHQ/ledger-live/commit/07103836533d3bc4ea9b2525d3f11df10791ef58) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Bump `react-native-reanimated` to 4.3.4 so animated views no longer revert to their initial values after a heavy JS-thread load at startup, which left the portfolio gauge cursor at 0 and the `AmountDisplay` digits overlapping.

- [#23083](https://github.com/LedgerHQ/ledger-live/pull/23083) [`4c28d72`](https://github.com/LedgerHQ/ledger-live/commit/4c28d726d50493ed3967c1a7eb84392442dfbeb9) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump `@ledgerhq/ledger-key-ring-protocol`, `@ledgerhq/hw-ledger-key-ring-protocol` to 1.0.0 and `@ledgerhq/evm-tools` to 2.0.0 (ts-libs). No API change.

- [#22984](https://github.com/LedgerHQ/ledger-live/pull/22984) [`2680cb0`](https://github.com/LedgerHQ/ledger-live/commit/2680cb0ba9badf37b769b81d856657f0aa923386) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Move the discovery, connection and unknown error UI of the Device Intent Executor to `mvvm/components/DeviceConnection`, so that connectNewDevice can reuse it. The moved components take the shared connectivity UI states and do no tracking. The executor keeps thin containers that add the screen and button tracking. The UI and the analytics events are unchanged.

- [#23178](https://github.com/LedgerHQ/ledger-live/pull/23178) [`e308deb`](https://github.com/LedgerHQ/ledger-live/commit/e308deb3e4f812f01166de17bb28c587a290b9bb) Thanks [@benruseau](https://github.com/benruseau)! - Add the OS updates orchestrator React layer: a generic `OsUpdatesOrchestratorComponent` and `useOsUpdatesOrchestrator` hook in live-common that render platform-injected components for each step

  Add the mobile pre-checks, create backup, apply updates and restore backup components, and persist the device backup in the app storage

  Use the real components in the OS updates orchestrator debug screen

  Fix the OS updates apply step after a bootloader recovery: when the device comes back on an OS, install the first update of the resolved path from its OSU firmware instead of its final firmware, which skipped an update

- [#22598](https://github.com/LedgerHQ/ledger-live/pull/22598) [`01ee590`](https://github.com/LedgerHQ/ledger-live/commit/01ee5909821c32b21577295f03f57a970e8fad2f) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Handle firmware handover and onboarding exits, and drive every Nano S through the shared flow

- [#22770](https://github.com/LedgerHQ/ledger-live/pull/22770) [`2cf2dfe`](https://github.com/LedgerHQ/ledger-live/commit/2cf2dfeccf79e36f0e8f233dab453e0ca9e8161a) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Settle the Perps deposit request from the mobile deposit flow with the swap ID and quoted amount, and reject it when the user leaves the deposit screen

- [#23148](https://github.com/LedgerHQ/ledger-live/pull/23148) [`cdd2446`](https://github.com/LedgerHQ/ledger-live/commit/cdd2446429b2a972d434863212ccceff2531901b) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Replace react-native-splash-screen with expo-splash-screen

- [#23184](https://github.com/LedgerHQ/ledger-live/pull/23184) [`3dda070`](https://github.com/LedgerHQ/ledger-live/commit/3dda0705f09d0e0da75ebde9a76b17ba7a9f65e6) Thanks [@CremaFR](https://github.com/CremaFR)! - Retry a swap up to twice, without showing the error, when the Exchange app rejects the provider signature (`signVerificationFail` at `CHECK_TRANSACTION_SIGNATURE`). `executeSwap` requests a new nonce and calls `/swap` again with the same parameters. Each rejected attempt is still reported to `/swap/cancelled`, with the attempt in the error message: `Signature verification failed Code: R0` for the first attempt, then `R1` and `R2` for the retries. This replaces the `[diagnostic=…]` signature classification, which is removed

- [#22745](https://github.com/LedgerHQ/ledger-live/pull/22745) [`db3bde1`](https://github.com/LedgerHQ/ledger-live/commit/db3bde1a0ea2435389260b012d9759dd26f7b174) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Canton: hide Accept once an offer expires while the screen is open, and show a clear message instead of retry when accepting an expired offer

- [#23008](https://github.com/LedgerHQ/ledger-live/pull/23008) [`ac0379e`](https://github.com/LedgerHQ/ledger-live/commit/ac0379ea0511dd457d6bba6a540d48b8358f4f93) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(send): show a broadcast error on the new send flow confirmation and only offer to try again for temporary errors (network, server, locked device)

- [#22811](https://github.com/LedgerHQ/ledger-live/pull/22811) [`3132a4a`](https://github.com/LedgerHQ/ledger-live/commit/3132a4aba419be9a91320295d8c0260f3509f9bd) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Consume `@ledgerhq/ledger-key-ring-protocol` and `@ledgerhq/hw-ledger-key-ring-protocol` from npm (they now live in `ts-libs`), and bump `axios` to 1.20.0. No API change.

- [#22604](https://github.com/LedgerHQ/ledger-live/pull/22604) [`ca82e70`](https://github.com/LedgerHQ/ledger-live/commit/ca82e703691d6e9716b522180d402d7eed9abc5f) Thanks [@sarneijim](https://github.com/sarneijim)! - Add an `ab_tests` attribute to desktop and mobile analytics events with the `trackingConfiguration` of each enabled English copy experiment, or `{}` when none applies

- [#22603](https://github.com/LedgerHQ/ledger-live/pull/22603) [`9c0feca`](https://github.com/LedgerHQ/ledger-live/commit/9c0feca47571b81e45c8dc3f0f1132583801ea95) Thanks [@sarneijim](https://github.com/sarneijim)! - Add `feature_copy_*` experiments to the feature flags debug screen so `enabled` and `copy` can be mocked locally

- [#22413](https://github.com/LedgerHQ/ledger-live/pull/22413) [`0f401bb`](https://github.com/LedgerHQ/ledger-live/commit/0f401bb6289b6e78fbd05b6f98977bde4999d22a) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(cosmos): move the Cosmos memo onto the shared generic-adapter memo fields (LIVE-36108)

  Prep work for the Cosmos generic-coin-framework migration (depends on LIVE-35735, already fixed):
  the shared `transactionToIntent` only reads `memoType`/`memoValue`, fields the four Cosmos memo
  write sites (desktop send field, mobile memo-tag input, mobile edit-memo screen, wallet-api
  adapter) never set — they only wrote the legacy `memo` field. Left as is, flipping Cosmos into
  `genericCoinFrameworkFamilies.json` in a later ticket would silently drop every memo, with no
  error anywhere.

  Adds a `cosmos` entry to the shared memo-application registry, adds `memoType`/`memoValue` to
  `CosmosLikeTransaction` alongside the existing `memo` field (read unchanged by the live legacy
  bridge), and centralizes the three-field patch in a single `cosmosMemoPatch` helper all four
  write sites now call, so they can't drift out of sync. Also adds the memo length check
  (`CosmosMemoTooLong`) to the Alpaca `validateIntent`, which nothing previously enforced outside
  the UI's `maxLength` truncation.

- [#23001](https://github.com/LedgerHQ/ledger-live/pull/23001) [`21ab07f`](https://github.com/LedgerHQ/ledger-live/commit/21ab07f8912d9c7fa9fb7e438e4e7873ca674f02) Thanks [@ysitbon](https://github.com/ysitbon)! - Move the countervalues Redux slice into `@features/platform-market-countervalues`: its reducer, action creators, initial state, state type and selectors. Both apps now mount `countervaluesReducer` at the same `countervalues` store key and keep their own `useSelector` hooks, persistence, polling and user-settings computation. The action types keep the desktop strings, so mobile's pending, error and wipe actions are now named `COUNTERVALUES_STATE_SET_PENDING`, `COUNTERVALUES_STATE_SET_ERROR` and `COUNTERVALUES_WIPE`. The reducer stays a plain function rather than `createSlice`, because immer would freeze the rate maps that `loadCountervalues` updates in place.

- [#23107](https://github.com/LedgerHQ/ledger-live/pull/23107) [`fa2c070`](https://github.com/LedgerHQ/ledger-live/commit/fa2c070913fb13e530c65d901151c2766c46caf6) Thanks [@ysitbon](https://github.com/ysitbon)! - Countervalues user settings are no longer stored in Redux: each app computes them and hands them to the provider through the bridge's `useUserSettings`.

  - `@features/platform-market-countervalues`: the slice loses its `userSettings` field, `setCountervaluesUserSettings` (`COUNTERVALUES_USER_SETTINGS_SET`) and `countervaluesUserSettingsSelector`.
  - Desktop: `useCalculateCountervaluesUserSettings` returns the memoized settings instead of dispatching them, and the bridge calls it directly. The provider sees the real tracking pairs and refresh rate from the first render instead of one render late, so the saved rates are restored once and the boot loads once.
  - Mobile: no runtime change; its tests read a shared test settings constant instead of the removed slice field.

- [#23071](https://github.com/LedgerHQ/ledger-live/pull/23071) [`eb23867`](https://github.com/LedgerHQ/ledger-live/commit/eb23867603dc4e80723cdfe5486c28bc88d57014) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Offer Ledger Sync during device onboarding from the single `deviceOnboarding` feature flag

- [#23131](https://github.com/LedgerHQ/ledger-live/pull/23131) [`a653da5`](https://github.com/LedgerHQ/ledger-live/commit/a653da51b91400a189831180f538d6ff6f432ba1) Thanks [@tonykhaov](https://github.com/tonykhaov)! - feat(device-onboarding): keep the screen awake while the device onboarding connects or runs

- [#22996](https://github.com/LedgerHQ/ledger-live/pull/22996) [`1f50e41`](https://github.com/LedgerHQ/ledger-live/commit/1f50e41fc85d46eec8ffdec4d27ab573a5cbb28e) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop `@ledgerhq/live-hooks`: `useDebounce` and a simpler `useThrottledValues` now live in `@ledgerhq/live-common/hooks`.

- [#23056](https://github.com/LedgerHQ/ledger-live/pull/23056) [`9a39ad5`](https://github.com/LedgerHQ/ledger-live/commit/9a39ad5eeeaefff74791ec01db8c62c102b6e54a) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - `ConnectNewDevice` keeps a device that is no longer discovered in its list, with a disabled card and a disabled Connect button.

- [#22803](https://github.com/LedgerHQ/ledger-live/pull/22803) [`0e3e7b0`](https://github.com/LedgerHQ/ledger-live/commit/0e3e7b023b7b285a955bb2aabb308d143d47bfba) Thanks [@ysitbon](https://github.com/ysitbon)! - fix(feature-flags): show the Firebase project the build actually targets

  The debug feature flags screen read the project name from the `firebaseEnvironmentReadOnly`
  remote flag, a value set by hand in each Firebase project, so a staging build reported
  `ledger-live-production`. It now reads the project id from the Firebase config bundled in the
  build.

- [#22795](https://github.com/LedgerHQ/ledger-live/pull/22795) [`ff5e1b0`](https://github.com/LedgerHQ/ledger-live/commit/ff5e1b0f5a315aaccd3e23aeb8ccd2c7d48730f4) Thanks [@ysitbon](https://github.com/ysitbon)! - refactor(feature-flags): move the Firebase Remote Config mapping to `@features/platform-feature-flags-firebase`

  `@features/platform-feature-flags` now only exposes resolved flag state (hooks and `FeatureToggle`). `formatToFirebaseFeatureId`, `formatDefaultFeatures`, `parseFirebaseFeatures` and `RemoteConfigValue` are imported from `@features/platform-feature-flags-firebase` instead; the `./firebase` subpath is removed. No behavior change.

- [#22352](https://github.com/LedgerHQ/ledger-live/pull/22352) [`c7e76f3`](https://github.com/LedgerHQ/ledger-live/commit/c7e76f3a015cf00cfdb1d057d1eee85ea6e99dc0) Thanks [@ishaba](https://github.com/ishaba)! - fix(babylon): remove pre-selected validator, default to show all

- [#22950](https://github.com/LedgerHQ/ledger-live/pull/22950) [`dccba0c`](https://github.com/LedgerHQ/ledger-live/commit/dccba0c7481c705b4a295942171891deff1c0e85) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Compute the firmware distribution salt of the non-DMK firmware update checks from the identities store instead of the USER_ID env, so they use the same salt as the DMK

- [#22520](https://github.com/LedgerHQ/ledger-live/pull/22520) [`d042881`](https://github.com/LedgerHQ/ledger-live/commit/d042881256ec1df83e426e3959cffb204cb2ab01) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Fix perps deposit quotes returning empty on mobile: read `SWAP_API_BASE` from `react-native-config` at store setup so the swap aggregator URL is resolved before the store captures it

- [#22939](https://github.com/LedgerHQ/ledger-live/pull/22939) [`c59fbf4`](https://github.com/LedgerHQ/ledger-live/commit/c59fbf41212398e3d0c1000c776d33c6344290a3) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - chore(hedera): migrate from @hashgraph/sdk 2.78.0 to @hiero-ledger/sdk 2.84.0
  fix(hedera): keep the nonce when serializing generic transactions

- [#22911](https://github.com/LedgerHQ/ledger-live/pull/22911) [`e2c3771`](https://github.com/LedgerHQ/ledger-live/commit/e2c3771fff768f1c83c2cfc99886999fa89fac46) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat(hedera): migrate mobile Hedera flows to the generic transaction shape

- [#22784](https://github.com/LedgerHQ/ledger-live/pull/22784) [`e72683b`](https://github.com/LedgerHQ/ledger-live/commit/e72683b8ed45df73659811db2ef15a18b4e0927c) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Hide the Pay tab card and its history when the pay-tab flag's card param is false

- [#22985](https://github.com/LedgerHQ/ledger-live/pull/22985) [`4182256`](https://github.com/LedgerHQ/ledger-live/commit/4182256c2213208e330861b904a6d8859d1b3e60) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix(hedera): generic adapter fixes for fee estimation, wallet API memo, token association wording, token receive and swap history saved by the legacy bridge

- [#23009](https://github.com/LedgerHQ/ledger-live/pull/23009) [`2bb0ec2`](https://github.com/LedgerHQ/ledger-live/commit/2bb0ec286a4fa825c26cbc8db3d6588383fd3a07) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Large Mover: screen readers only read the front card, and swiping up/down on the coin shows the next or previous one. The swipe integration test no longer relies on gesture-handler jest-utils, which made it flaky.

- [#22640](https://github.com/LedgerHQ/ledger-live/pull/22640) [`8783545`](https://github.com/LedgerHQ/ledger-live/commit/87835456704c2322a25339ef27ef92a320d02025) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(contacts): stop reading `ethereumLikeInfo` and promote `chainId` from coin config

- [#22395](https://github.com/LedgerHQ/ledger-live/pull/22395) [`39d91b6`](https://github.com/LedgerHQ/ledger-live/commit/39d91b68fa8b7ad7625887fee6ff126c131eaf34) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(tracking): tracking error and warning in new send flow lwm

- [#22743](https://github.com/LedgerHQ/ledger-live/pull/22743) [`4d9cfbd`](https://github.com/LedgerHQ/ledger-live/commit/4d9cfbd7eff1fb20fb2052b0a2f2b21ea87ba052) Thanks [@ysitbon](https://github.com/ysitbon)! - Import the countervalues logic, types, helpers and mocks from `@domain/entity-market-countervalues` instead of `@ledgerhq/live-countervalues`, and depend on the entity package in place of the legacy one. Specifier change only, no behaviour change.

  Three app tests move with live-common because the `calculate` they mock is called inside live-common: desktop's `useHistoryOperations` and mobile's `useOperationsListViewModel` and `useOperationsV1`. Their mock has to name the same module live-common imports.

- [#23020](https://github.com/LedgerHQ/ledger-live/pull/23020) [`e1f1bed`](https://github.com/LedgerHQ/ledger-live/commit/e1f1bedeb3de6bee0c290312472a083ad804519b) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - fix(asset-detail): show asset ticker and icon in the header when no Ledger currency resolves (e.g. Firo)

- [#22703](https://github.com/LedgerHQ/ledger-live/pull/22703) [`a09b259`](https://github.com/LedgerHQ/ledger-live/commit/a09b25924769c567406ede58b9575f3552427a74) Thanks [@LL782](https://github.com/LL782)! - Import mobile analytics from the shared packages instead of app barrel shims

- [#22749](https://github.com/LedgerHQ/ledger-live/pull/22749) [`bde5ee6`](https://github.com/LedgerHQ/ledger-live/commit/bde5ee6bf47643c76b98236cb5a4e13340ca2bea) Thanks [@ysitbon](https://github.com/ysitbon)! - Import the countervalues logic, types and helpers from `@domain/entity-market-countervalues` instead of `@ledgerhq/live-countervalues`, and drop the legacy dependency. Specifier change only, no behaviour change.

- [#22816](https://github.com/LedgerHQ/ledger-live/pull/22816) [`7b17793`](https://github.com/LedgerHQ/ledger-live/commit/7b17793574ca6a21aacd78b4da3cc4a74cf27073) Thanks [@lewisd5](https://github.com/lewisd5)! - fix(lwm): declare babel-loader and @babel/plugin-syntax-typescript so the iOS bundle builds without @babel/\* hoisting

- [#22635](https://github.com/LedgerHQ/ledger-live/pull/22635) [`bfebf6b`](https://github.com/LedgerHQ/ledger-live/commit/bfebf6bfd3bde69afa46b73bbf5a4382f88233ad) Thanks [@sarneijim](https://github.com/sarneijim)! - Apply enabled `feature_copy_*` Remote Config values as English copy overrides, reusing the feature-flag fetch

- [#23086](https://github.com/LedgerHQ/ledger-live/pull/23086) [`5532cc2`](https://github.com/LedgerHQ/ledger-live/commit/5532cc2a358403d808ba32f74a6cddb3c2277404) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Fix unreadable text on the feature flags debug screen in dark mode

- [#22933](https://github.com/LedgerHQ/ledger-live/pull/22933) [`c24108f`](https://github.com/LedgerHQ/ledger-live/commit/c24108f31f66d6d930f0f838e7005b07a6398a97) Thanks [@ysitbon](https://github.com/ysitbon)! - Import the countervalues provider and hooks from `@features/platform-market-countervalues` instead of `@ledgerhq/live-countervalues-react`, and `useUsdToFiatRate` and `useGetCounterValueIdsPolling` from it instead of live-common. The app and the test renderer mount the platform provider. Mobile no longer depends on `@ledgerhq/live-countervalues-react`. Specifier change only, no behaviour change.

- [#22796](https://github.com/LedgerHQ/ledger-live/pull/22796) [`faccddb`](https://github.com/LedgerHQ/ledger-live/commit/faccddb71d46cbc34818f9a1fd4fbc810c1bf908) Thanks [@LL782](https://github.com/LL782)! - fix(analytics): send language as a flat property on the Discoverability - Prompt event

- [#22943](https://github.com/LedgerHQ/ledger-live/pull/22943) [`dad0153`](https://github.com/LedgerHQ/ledger-live/commit/dad01537ce5e0263964adcfaf762246003c527b4) Thanks [@LucasWerey](https://github.com/LucasWerey)! - fix(my-wallet): show Help and Referral as tiles and Wallet backups as a list item (LIVE-38059)

- [#22765](https://github.com/LedgerHQ/ledger-live/pull/22765) [`e3e6c22`](https://github.com/LedgerHQ/ledger-live/commit/e3e6c222ddba748a7e9e03e85f5919ce8e5c28bd) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Extract the device discovery service and the connectivity types shared by device connection flows into a `deviceConnectivity` folder. The discovery, connection and unknown error UI states now use the shared `ConnectivityUIStateTypes` enum. `ConnectDeviceUIStateTypes` becomes a const object that includes these shared members, so type positions use `typeof ConnectDeviceUIStateTypes.X` or the new `ConnectDeviceUIStateType` type. The device type moves to the shared part as `Device`, and connectDevice keeps `KnownDevice` as an alias of it. connectDevice behaviour is unchanged.

- [#23055](https://github.com/LedgerHQ/ledger-live/pull/23055) [`c7cf8b4`](https://github.com/LedgerHQ/ledger-live/commit/c7cf8b4f3231d55d829a3b1d1a62a529b85ae356) Thanks [@Valentin-Ledger](https://github.com/Valentin-Ledger)! - Open the Borrow screen from the ledgerlive://borrow deeplink

- [#22910](https://github.com/LedgerHQ/ledger-live/pull/22910) [`177a5b4`](https://github.com/LedgerHQ/ledger-live/commit/177a5b413ca0348c78aca5cbdfca9340355f4b23) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Pay card login: name Monavate instead of Baanx in "Log in to" and "Card provided by".

- [#22649](https://github.com/LedgerHQ/ledger-live/pull/22649) [`514d6f9`](https://github.com/LedgerHQ/ledger-live/commit/514d6f937e082fa8b86d87bcf170cc2ec57d51e0) Thanks [@koda-apps](https://github.com/apps/koda-apps)! - Show a newly linked Card asset when the user comes back to Pay from Baanx.

- [#22723](https://github.com/LedgerHQ/ledger-live/pull/22723) [`a92f75f`](https://github.com/LedgerHQ/ledger-live/commit/a92f75faea8c76b1e650a57edfc76a7f0e44ae75) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Closing Buy opened from the Pay tab returns to the Pay tab instead of the portfolio

- [#22869](https://github.com/LedgerHQ/ledger-live/pull/22869) [`eb65ce4`](https://github.com/LedgerHQ/ledger-live/commit/eb65ce49ea0fa2d2c44f79fd2b0f8de365ae5e53) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add feature-flag scenarios for the native Pay card, Card live app login, and CL Card disclaimer

- [#22027](https://github.com/LedgerHQ/ledger-live/pull/22027) [`10e4a67`](https://github.com/LedgerHQ/ledger-live/commit/10e4a67f1aeffc909e8f5153b9720f568140323b) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Default the Perps deposit funding account to the USDC account with the highest non-zero spendable balance

- [#22865](https://github.com/LedgerHQ/ledger-live/pull/22865) [`667d378`](https://github.com/LedgerHQ/ledger-live/commit/667d378b97e9102df009015e01fed6b49fd88b82) Thanks [@ysitbon](https://github.com/ysitbon)! - Add `@features/platform-market-countervalues`, the countervalues React glue: the provider, its context and the hooks reading it, plus `useUsdToFiatRate` and `useGetCounterValueIdsPolling`. It is a copy of `@ledgerhq/live-countervalues-react` and of the two live-common hooks, which keep their own until their consumers move over.

  - `@ledgerhq/live-countervalues-react` reads the platform package's `CountervaluesContext` instead of creating its own, so a provider from either package serves the hooks of both. It stops exporting `CountervaluesContext`, which nothing imported, and drops its unused `@ledgerhq/types-live` dependency.
  - The platform package depends on no logging library. Desktop and mobile hand it their logger with `setCountervaluesLogger` at app setup, next to the rate lookups.

- [#23121](https://github.com/LedgerHQ/ledger-live/pull/23121) [`3a45eb3`](https://github.com/LedgerHQ/ledger-live/commit/3a45eb3e29f417f24570787e76d977cefa5090d9) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - `ConnectNewDevice` shows only the available USB devices when a USB device is available, and only the devices on the other transports otherwise, so that the same device does not show over USB and over Bluetooth.

- [#22654](https://github.com/LedgerHQ/ledger-live/pull/22654) [`78b38fb`](https://github.com/LedgerHQ/ledger-live/commit/78b38fb3820d3391c5c04812fee88c1c2a6e9289) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(send): sync account at the start of a send

- [#23150](https://github.com/LedgerHQ/ledger-live/pull/23150) [`4dec481`](https://github.com/LedgerHQ/ledger-live/commit/4dec481cf274c6db74c334e5a74df574a8d04f54) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Keep the device onboarding session in the machine context, follow a new session on reconnect, and let the host run the exit actions

- [#22766](https://github.com/LedgerHQ/ledger-live/pull/22766) [`b2792d8`](https://github.com/LedgerHQ/ledger-live/commit/b2792d8806411c2a35e1622109bee830c44a6cbc) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Show a setup state on the History card tab when the signed-in holder has not claimed a card yet.

- [#22960](https://github.com/LedgerHQ/ledger-live/pull/22960) [`ddd2bce`](https://github.com/LedgerHQ/ledger-live/commit/ddd2bce6afff10166987d05cebb4b60721bb30dc) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(contact): display contact in tx details lwm

- [#22673](https://github.com/LedgerHQ/ledger-live/pull/22673) [`08e85b2`](https://github.com/LedgerHQ/ledger-live/commit/08e85b261d6dc1a808c7fe438982bec65a74ac07) Thanks [@LucHebrard](https://github.com/LucHebrard)! - Remove the bottom safe-area padding on the Ledger Recover webview and show a themed loader until it loads

- [#22661](https://github.com/LedgerHQ/ledger-live/pull/22661) [`ea1ae2d`](https://github.com/LedgerHQ/ledger-live/commit/ea1ae2def97f41c602b4c4c78e2749496eda1293) Thanks [@qperrot](https://github.com/qperrot)! - Fix Earn banner on Asset Detail not opening the SEI delegation validator selection

- [#23044](https://github.com/LedgerHQ/ledger-live/pull/23044) [`dce4fb6`](https://github.com/LedgerHQ/ledger-live/commit/dce4fb6a4ec291153cc5b4d5a0d5000f777007e1) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove the lwmQuickActionsCtasVariant feature flag and its Receive/Send quick action CTAs variant

- [#22659](https://github.com/LedgerHQ/ledger-live/pull/22659) [`bed3cf9`](https://github.com/LedgerHQ/ledger-live/commit/bed3cf9bd880e00d51fc90849dca3741b9ab779f) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Restore the Card sign-in state at app start so the Card history shows a stored session

- [#22820](https://github.com/LedgerHQ/ledger-live/pull/22820) [`f4bfc96`](https://github.com/LedgerHQ/ledger-live/commit/f4bfc9672830fb3e9c76dd4826c963ab8be501cf) Thanks [@gre-ledger](https://github.com/gre-ledger)! - chore(lwm): replace @rozenite/mmkv-plugin with @rozenite/storage-plugin

- [#23221](https://github.com/LedgerHQ/ledger-live/pull/23221) [`91ad9a0`](https://github.com/LedgerHQ/ledger-live/commit/91ad9a0e481e3935f80089a800293a4733aef450) Thanks [@sarneijim](https://github.com/sarneijim)! - Add `connectSeededDevice` to the `deviceOnboarding` flag and send a non-seeded device to legacy onboarding unless the host can run seed setup

- [#23140](https://github.com/LedgerHQ/ledger-live/pull/23140) [`b99f923`](https://github.com/LedgerHQ/ledger-live/commit/b99f923997846b785c348006c5b434104c04f4a2) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Play Lottie animations through the new `@shared/lottie` package: dotlottie on web (replacing the unmaintained `react-lottie` / `lottie-web`), `lottie-react-native` on mobile.

- [#22702](https://github.com/LedgerHQ/ledger-live/pull/22702) [`c4f0be9`](https://github.com/LedgerHQ/ledger-live/commit/c4f0be97f4d86b2bd5e7dcee9be840a25c72b2ef) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - updated translation for claim operations for Aleo

- [#22950](https://github.com/LedgerHQ/ledger-live/pull/22950) [`8737f89`](https://github.com/LedgerHQ/ledger-live/commit/8737f89e2b515ab518cbcdeacc064641c6f595be) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Keep the DMK firmware distribution salt in sync with the user ID of the identities store, so DMK flows follow the progressive OS rollout on desktop and mobile

- [#22846](https://github.com/LedgerHQ/ledger-live/pull/22846) [`42d4dc2`](https://github.com/LedgerHQ/ledger-live/commit/42d4dc25044dceb9936c1907fb5ea0838fa0a64b) Thanks [@benruseau](https://github.com/benruseau)! - Add the apply updates sub-step to the OS updates orchestrator, covering the OSU install, the MCU flash loop and the final firmware install

  Wait out the device reboots each install and flash leaves behind, reconnecting under the same session id

  Add the restore backup step, which runs as the last tenth of the bar when it follows an update and on its own when there is nothing left to update

  Sync `BASE_SOCKET_URL` to the DMK secure channel WebSocket URL

- [#21839](https://github.com/LedgerHQ/ledger-live/pull/21839) [`6d744e0`](https://github.com/LedgerHQ/ledger-live/commit/6d744e0d30b4480282d35c359d096f3f6d6602af) Thanks [@YazhuEth](https://github.com/YazhuEth)! - `estimateFees` now returns the recipient token account, wallet address and input type of an SPL transfer alongside its fee, so the device screen names the destination; a recipient token account holding another token throws `SolanaTokenAccountHoldsAnotherToken`.

  `makeEmptyTokenAccount` now builds its id with `encodeTokenAccountId`, like the fourteen families that already do: the wallet-API placeholder previously used the contract address, so it matched no real sub-account id.

  Solana runs on the generic coin framework. The send and staking screens move onto the generic transaction shape, which names what it does — a mode, a memo, a stake account seed — instead of the nested command model the legacy bridge carried, and the apps now read it through one family module rather than reaching into the transaction themselves.

  The behaviours the legacy bridge produced are restored on the generic path: an incoming SPL transfer produces an operation, a stake withdrawal empties the account rather than signing a stale amount, opening a token account is charged its rent, sending the maximum to a new stake account leaves enough to unstake it later, the device confirmation screen lists every row the device itself shows, and a token account's frozen state and Token-2022 extensions are back on screen.

  A live app can again submit the four token and stake commands the wallet API defines, and a raw signature it gets back is hex, as the field it arrives in says. The device signer is selected through the family's own factory, so the `ldmkSolanaSigner` flag and the transaction-check option it carries keep deciding, as they did before. The mock bridge is rewritten on the coin module, so a mocked signature still yields a transaction the wallet API can deserialize.

- [#23112](https://github.com/LedgerHQ/ledger-live/pull/23112) [`7f0d867`](https://github.com/LedgerHQ/ledger-live/commit/7f0d867cc9f8715b9244979e42a035babe43d2ab) Thanks [@amaslakov](https://github.com/amaslakov)! - Harden the Tronify rent payment: Retry stays locked until a payment that may still land has expired, a rent price rise is shown and must be accepted before ordering again, a signed payment about to expire is refused before broadcast, and the unreachable contract-data failure is removed.

- [#22979](https://github.com/LedgerHQ/ledger-live/pull/22979) [`69284e8`](https://github.com/LedgerHQ/ledger-live/commit/69284e8fff6db3afdf4b0c05254214baa8e4762b) Thanks [@sarneijim](https://github.com/sarneijim)! - Keep the Ledger Recovery Key backup as its own onboarding step

- [#23032](https://github.com/LedgerHQ/ledger-live/pull/23032) [`bcd25fd`](https://github.com/LedgerHQ/ledger-live/commit/bcd25fd87bda9e7e8b7c3ee2a243d3e241adc0b0) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - chore(live-dmk): remove the ldmkTransport feature flag

  `DeviceManagementKitProvider` on desktop no longer takes `ldmkTransportEnabled` and always provides
  the Device Management Kit. `useDeviceManagementKit` now returns a non-null `DeviceManagementKit` and
  throws outside the provider. The PayTab address verification always uses the Device Intent Executor,
  and the `isLDMKTransportEnabled` analytics property is removed.

- [#23031](https://github.com/LedgerHQ/ledger-live/pull/23031) [`3264580`](https://github.com/LedgerHQ/ledger-live/commit/3264580e247bbd35d774b33eae21cc7c2e87d105) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Pass `swapApiEnv` (`stg` | `prd`) to the Swap live app so it follows Wallet's Swap backend

  - Derived from the `SWAP_API_BASE` url via new `getSwapAPIEnv` helper in live-common
  - Unknown hosts (e.g. localhost) send nothing; the live app keeps its own default
  - Stop passing the full `swapApiBase` url; the live app no longer reads it

- [#22891](https://github.com/LedgerHQ/ledger-live/pull/22891) [`cc764ec`](https://github.com/LedgerHQ/ledger-live/commit/cc764ec269edef9640fb58ff4aa26b70bff8d3c7) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Open swap history from the `swap/history` deeplink, with the swap matching `swapId` opened

- [#23127](https://github.com/LedgerHQ/ledger-live/pull/23127) [`7f7eeab`](https://github.com/LedgerHQ/ledger-live/commit/7f7eeaba851655f40c4583d1f8a08ece168a75f0) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Replace react-native-get-random-values with expo-crypto for crypto.getRandomValues

- [#23185](https://github.com/LedgerHQ/ledger-live/pull/23185) [`437d666`](https://github.com/LedgerHQ/ledger-live/commit/437d66634fd97401a91637013ceca7d473ea32fb) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Replace @react-native-community/netinfo with expo-network behind the new @shared/network-status package, and use it for the desktop network status

- [#22990](https://github.com/LedgerHQ/ledger-live/pull/22990) [`67dbab2`](https://github.com/LedgerHQ/ledger-live/commit/67dbab258571b96d67cfda3fa421917b9a179da6) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Add the `ConnectNewDevice` component. It runs connectNewDevice, shows one view for each UI state and shows the discovery, connection and unknown errors in a bottom sheet over the last view. The Discovering, Connecting and Connected views are placeholders. The device intent executor and `ConnectNewDevice` now save the connected device with the same `useSaveConnectedDevice` hook. `ConnectNewDevice` also adds a new Bluetooth device to the BLE known devices.

  Add a Connect New Device debug screen in Settings > Debug > Features > Device Intent Executor. It runs the `ConnectNewDevice` component, logs its `onConnected`, `onDeviceNotFound` and `onClose` calls, and can restart the flow with other delays.

- [#22384](https://github.com/LedgerHQ/ledger-live/pull/22384) [`bc6383a`](https://github.com/LedgerHQ/ledger-live/commit/bc6383a216f5bf72aa48219542f958cc778e4c29) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - Migrate the mobile Cosmos staking UI (delegate, undelegate, redelegate, claim/compound) onto the generic staking transaction shape

- [#22953](https://github.com/LedgerHQ/ledger-live/pull/22953) [`f482212`](https://github.com/LedgerHQ/ledger-live/commit/f48221278738b5b3accf7199c23e6dd84c48c27e) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - chore(device): remove the legacy connectApp and the ldmkConnectApp feature flag

  `connectApp` and `connectManager` now always use the Device Management Kit device actions and fail
  with `DmkTransportRequired` on a non-DMK transport. `apps/inlineAppInstall`, `hw/isUpdateAvailable`
  and `DeviceManagementKitTransport.listenLegacyConnectApp` are removed.

- [#23022](https://github.com/LedgerHQ/ledger-live/pull/23022) [`ebc1ab9`](https://github.com/LedgerHQ/ledger-live/commit/ebc1ab939711ff7851a1456ec015d492af6e19d4) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Fix Receive confirmation header so the help button no longer overlaps the title or triggers close

- [#21764](https://github.com/LedgerHQ/ledger-live/pull/21764) [`b014537`](https://github.com/LedgerHQ/ledger-live/commit/b01453792d10e8ccb157c65661e123b2f1cbc963) Thanks [@shazzzam](https://github.com/shazzzam)! - Add the Tronify sponsored send to the mobile Send flow behind the `gasSponsorship` flag: a USDT transfer can pay its network fee with rented energy, signing the rent payment first, then the transfer once the energy is delivered on-chain.

- [#22818](https://github.com/LedgerHQ/ledger-live/pull/22818) [`c56dcb3`](https://github.com/LedgerHQ/ledger-live/commit/c56dcb3804eb00b1a2d8dc47aa586de28e353e94) Thanks [@ysitbon](https://github.com/ysitbon)! - `useSendAmount` takes the `cryptoCurrency` to convert instead of the `account` holding it. Callers resolve it with `getAccountCurrency` on the same account they passed before, so a token account still converts with its token. The hook no longer imports any account type or helper.

- [#22989](https://github.com/LedgerHQ/ledger-live/pull/22989) [`8312d68`](https://github.com/LedgerHQ/ledger-live/commit/8312d6818aa5fa37f523352f81f51a61dd502bf2) Thanks [@gre-ledger](https://github.com/gre-ledger)! - chore: take `uuid` from the pnpm catalog (11.1.0)

  `uuid` was spread over 8.3.2, 9.0.1 and 11.1.0. Every package now uses the catalog entry. `@types/uuid` is dropped: 11 ships its own types. The repo only imports `v4`, `v5` and `parse` (`parse` in a coin-solana test fixture), which behave the same across these majors. 11 types `v4` with overloads, so passing it directly as a callback (`useState(uuid)`) no longer typechecks and is now wrapped (`useState(() => uuid())`).

- [#22383](https://github.com/LedgerHQ/ledger-live/pull/22383) [`33094bc`](https://github.com/LedgerHQ/ledger-live/commit/33094bc31d9d8cd7a80b8eae3cf2b4afe3afa500) Thanks [@ysitbon](https://github.com/ysitbon)! - Let wallet-pnl declare the countervalues interface it needs

  The package computed profit and loss straight against the countervalues implementation, which
  tied a pure pricing calculation to a concrete state shape. It now declares the three operations
  it uses as a `RateLookup` interface, treats the state as an opaque snapshot, and drops
  `@ledgerhq/live-countervalues` from its dependencies. The apps fill the interface at startup,
  beside the crypto-assets store and the two lookups already registered there.

  The exported signatures keep their arity and the state argument is assignable as before, so no
  caller needs a change for the interface.

  The third operation is a cache key. `getCostBasis` memoises against a fingerprint of the rate
  history relevant to a pair, which it used to compute inline from three countervalues helpers.
  That computation moves to `@domain/entity-market-countervalues` as `historyKey`, beside the
  `lenseRateMap` it is built on, so the three apps share one copy instead of each carrying its own
  and risking drift. A drifted key serves a stale cost basis silently. The key string is unchanged,
  and the existing cache tests pin it without being modified.

  The synthetic state builder moves with it. `buildCV`, `buildMultiCV` and `dailyHistory`
  construct countervalues state rather than reading it, so they cannot work against an opaque
  snapshot; they now live behind `@domain/entity-market-countervalues/mock`, and
  `@ledgerhq/wallet-pnl/scenarios` no longer exports them. The web-tools pnl-calculator imports them
  from the entity directly.

  web-tools registers the interface too. It renders profit and loss through the same package but
  was never a consumer of the two lookups registered previously, so it needed wiring of its own.

### Patch Changes

- Updated dependencies [[`5b62ecb`](https://github.com/LedgerHQ/ledger-live/commit/5b62ecb5c84b36099b4f29fcca9665431a468fb7), [`d60f240`](https://github.com/LedgerHQ/ledger-live/commit/d60f240af5f814d887bb2df19db8415425b52317), [`c954015`](https://github.com/LedgerHQ/ledger-live/commit/c954015d149a86adc8a1cdfcda41a71313171b68), [`4101467`](https://github.com/LedgerHQ/ledger-live/commit/4101467e60d17f1facfae9c71e5b684bcf9f48e3), [`20bf9b0`](https://github.com/LedgerHQ/ledger-live/commit/20bf9b0c8694e9a3c873da1e81fd6b310410205c), [`4028b7e`](https://github.com/LedgerHQ/ledger-live/commit/4028b7e53019ef07b2e94a6559c5f8a6ba54b82f), [`1bf1044`](https://github.com/LedgerHQ/ledger-live/commit/1bf1044e3eb3b57187bf6c837b17b4ed00f870cc), [`8376d49`](https://github.com/LedgerHQ/ledger-live/commit/8376d497d552cd4644e806afdfbd5323bf10a695), [`75e55ba`](https://github.com/LedgerHQ/ledger-live/commit/75e55ba31bb763cfae2e0d850fb76930854abb39), [`52747b3`](https://github.com/LedgerHQ/ledger-live/commit/52747b3d876e34712619bd17206cd4aa23e07636), [`2a09181`](https://github.com/LedgerHQ/ledger-live/commit/2a091816a8ec716c0bba802767671052c75843e8), [`5eca063`](https://github.com/LedgerHQ/ledger-live/commit/5eca063fe675ec5cb59cc96fffe4b67fcd7f3061), [`d6e7695`](https://github.com/LedgerHQ/ledger-live/commit/d6e7695bf15852c7b0cd2a97aa0a3a0c4d047d74), [`87de6a7`](https://github.com/LedgerHQ/ledger-live/commit/87de6a72f75df73aab99da6c420de00004bf7692), [`ef84a7c`](https://github.com/LedgerHQ/ledger-live/commit/ef84a7cac52080143934ebf01511d24a4dcaa0f3), [`20484ff`](https://github.com/LedgerHQ/ledger-live/commit/20484ff8d7cc0aab2e4b8448c7e8ce9ebf6840fe), [`f047501`](https://github.com/LedgerHQ/ledger-live/commit/f047501381efde857b48c1314d2de637fdce8ade), [`23455ab`](https://github.com/LedgerHQ/ledger-live/commit/23455abfdc26b44eedd77a1c990a6721dadd3f5c), [`15491fb`](https://github.com/LedgerHQ/ledger-live/commit/15491fb3b72f27c41e24f076d23c4c83dc69abe5), [`57b333d`](https://github.com/LedgerHQ/ledger-live/commit/57b333de5cab7b3e387aab8cb45de0a7705bd8ec), [`9894c78`](https://github.com/LedgerHQ/ledger-live/commit/9894c78c32b055686c15db66e8369a7a3b12748a), [`6225945`](https://github.com/LedgerHQ/ledger-live/commit/6225945749be628b088bbb65a102a40f984a569c), [`9a947ef`](https://github.com/LedgerHQ/ledger-live/commit/9a947ef9a6cab8dc20865369676b13129fa7bf99), [`b18cbdb`](https://github.com/LedgerHQ/ledger-live/commit/b18cbdbabb25a9ffd1e44f7289f17fea4aba1266), [`bf29f88`](https://github.com/LedgerHQ/ledger-live/commit/bf29f888316e5d8d9049b763a8c77ce9850f07df), [`c9b7594`](https://github.com/LedgerHQ/ledger-live/commit/c9b75949c8f01cade6b061bd5b6ecb0af5b0ec5f), [`7a2505b`](https://github.com/LedgerHQ/ledger-live/commit/7a2505bd21cc2401e1e887cb5b9713281cb11519), [`d33fd72`](https://github.com/LedgerHQ/ledger-live/commit/d33fd721a5d1a9363f820738f6aadbeb0a8b3cad), [`d819300`](https://github.com/LedgerHQ/ledger-live/commit/d819300df11d1e58ad33dbb8d0dbdb6f20c8dd93), [`4e7c1ae`](https://github.com/LedgerHQ/ledger-live/commit/4e7c1ae11a76a078d027dac7584fd68bd0a82811), [`48874b3`](https://github.com/LedgerHQ/ledger-live/commit/48874b3b33c83b40f7c2c389f7a84ebe96d58816), [`4c28d72`](https://github.com/LedgerHQ/ledger-live/commit/4c28d726d50493ed3967c1a7eb84392442dfbeb9), [`e308deb`](https://github.com/LedgerHQ/ledger-live/commit/e308deb3e4f812f01166de17bb28c587a290b9bb), [`01ee590`](https://github.com/LedgerHQ/ledger-live/commit/01ee5909821c32b21577295f03f57a970e8fad2f), [`db3bde1`](https://github.com/LedgerHQ/ledger-live/commit/db3bde1a0ea2435389260b012d9759dd26f7b174), [`e7996b4`](https://github.com/LedgerHQ/ledger-live/commit/e7996b4bb9f13726af09cc5202d26d1e471563ef), [`5f07a43`](https://github.com/LedgerHQ/ledger-live/commit/5f07a4399d54e6ebccb953045324d8ec5b571ad3), [`ca82e70`](https://github.com/LedgerHQ/ledger-live/commit/ca82e703691d6e9716b522180d402d7eed9abc5f), [`0f401bb`](https://github.com/LedgerHQ/ledger-live/commit/0f401bb6289b6e78fbd05b6f98977bde4999d22a), [`3347eb8`](https://github.com/LedgerHQ/ledger-live/commit/3347eb88f282e2286b43493dadb0a9dd3d1f81d5), [`21ab07f`](https://github.com/LedgerHQ/ledger-live/commit/21ab07f8912d9c7fa9fb7e438e4e7873ca674f02), [`9ddaa97`](https://github.com/LedgerHQ/ledger-live/commit/9ddaa970d609f4b54f0cdbbda0609242cca54cf7), [`e80d009`](https://github.com/LedgerHQ/ledger-live/commit/e80d009b57fbec125c43649fcc0b21edc60cb473), [`fa2c070`](https://github.com/LedgerHQ/ledger-live/commit/fa2c070913fb13e530c65d901151c2766c46caf6), [`d1eeaab`](https://github.com/LedgerHQ/ledger-live/commit/d1eeaabf43a54a3d2c4796ea1c5b11a0b9202814), [`eb23867`](https://github.com/LedgerHQ/ledger-live/commit/eb23867603dc4e80723cdfe5486c28bc88d57014), [`90e805d`](https://github.com/LedgerHQ/ledger-live/commit/90e805d9c1b0ef536d1e53489c73b88056731993), [`ff5e1b0`](https://github.com/LedgerHQ/ledger-live/commit/ff5e1b0f5a315aaccd3e23aeb8ccd2c7d48730f4), [`f5fa6e1`](https://github.com/LedgerHQ/ledger-live/commit/f5fa6e18fe429074cda26578f8b0c4642927e0d6), [`7ff8f5b`](https://github.com/LedgerHQ/ledger-live/commit/7ff8f5b518a19e73005ef974121ce21e593a8e99), [`9c9cae5`](https://github.com/LedgerHQ/ledger-live/commit/9c9cae5ab492b74d52b13e0a5b0673bd681f8d9d), [`3a45eb3`](https://github.com/LedgerHQ/ledger-live/commit/3a45eb3e29f417f24570787e76d977cefa5090d9), [`29b0e0c`](https://github.com/LedgerHQ/ledger-live/commit/29b0e0c324494c21d82f5deb26f6774c3c5aca6f), [`0a65851`](https://github.com/LedgerHQ/ledger-live/commit/0a65851ea6de6228030a2c94f0cad2234903db2b), [`3444d16`](https://github.com/LedgerHQ/ledger-live/commit/3444d16d5159b6e415b4dd0ab4fedfbf4cbeb260), [`8783545`](https://github.com/LedgerHQ/ledger-live/commit/87835456704c2322a25339ef27ef92a320d02025), [`f3b3c1c`](https://github.com/LedgerHQ/ledger-live/commit/f3b3c1c8479c2ae12d6a57eef030b04b2e665483), [`dad0153`](https://github.com/LedgerHQ/ledger-live/commit/dad01537ce5e0263964adcfaf762246003c527b4), [`e3e6c22`](https://github.com/LedgerHQ/ledger-live/commit/e3e6c222ddba748a7e9e03e85f5919ce8e5c28bd), [`77e7162`](https://github.com/LedgerHQ/ledger-live/commit/77e716257785645b79027b580fcef2dfbab7ad3b), [`77e7162`](https://github.com/LedgerHQ/ledger-live/commit/77e716257785645b79027b580fcef2dfbab7ad3b), [`57921f9`](https://github.com/LedgerHQ/ledger-live/commit/57921f955b6c07389cb78d4c087c881667858dc2), [`1b78e74`](https://github.com/LedgerHQ/ledger-live/commit/1b78e7406cc6b871ebf50590a03f47848c1718a9), [`a99d63a`](https://github.com/LedgerHQ/ledger-live/commit/a99d63a75a8d02a14bdfef0eaaa249c3f92d1ced), [`4aa7793`](https://github.com/LedgerHQ/ledger-live/commit/4aa77939cec43fd1aac459689c372868dece3496), [`0e7d80a`](https://github.com/LedgerHQ/ledger-live/commit/0e7d80ad750683fd37a150fe36ef5add632072cd), [`5f7cc73`](https://github.com/LedgerHQ/ledger-live/commit/5f7cc73ec88df6e84e970818668adca6cf7e5fe2), [`eb65ce4`](https://github.com/LedgerHQ/ledger-live/commit/eb65ce49ea0fa2d2c44f79fd2b0f8de365ae5e53), [`aaedf56`](https://github.com/LedgerHQ/ledger-live/commit/aaedf5692e9c1407327d009fea8133e51ca48f26), [`c26bbea`](https://github.com/LedgerHQ/ledger-live/commit/c26bbea7477d27f6042657c3a3c48c05f85b1f59), [`667d378`](https://github.com/LedgerHQ/ledger-live/commit/667d378b97e9102df009015e01fed6b49fd88b82), [`f45fc80`](https://github.com/LedgerHQ/ledger-live/commit/f45fc8027562e53cdbd3500a2884084df6a4af8e), [`1731458`](https://github.com/LedgerHQ/ledger-live/commit/17314582789efaad9ba35a5cf5e434a3140d6132), [`4dec481`](https://github.com/LedgerHQ/ledger-live/commit/4dec481cf274c6db74c334e5a74df574a8d04f54), [`2989e37`](https://github.com/LedgerHQ/ledger-live/commit/2989e37b80b8bfcaae549cc02aa6de189a69dfef), [`b2792d8`](https://github.com/LedgerHQ/ledger-live/commit/b2792d8806411c2a35e1622109bee830c44a6cbc), [`6f2ecf8`](https://github.com/LedgerHQ/ledger-live/commit/6f2ecf89dd1d978038f573738d6e85fe1805b5d9), [`18166fb`](https://github.com/LedgerHQ/ledger-live/commit/18166fbe8719d50c911aa0ab349e68c414f8fc62), [`1a9b21e`](https://github.com/LedgerHQ/ledger-live/commit/1a9b21e6cc971d5e5b069cab968826b15332024b), [`dce4fb6`](https://github.com/LedgerHQ/ledger-live/commit/dce4fb6a4ec291153cc5b4d5a0d5000f777007e1), [`6c8bd31`](https://github.com/LedgerHQ/ledger-live/commit/6c8bd31900a6b6aa8987cc82f6d907bbc3611fc1), [`bed3cf9`](https://github.com/LedgerHQ/ledger-live/commit/bed3cf9bd880e00d51fc90849dca3741b9ab779f), [`91ad9a0`](https://github.com/LedgerHQ/ledger-live/commit/91ad9a0e481e3935f80089a800293a4733aef450), [`2b2eee6`](https://github.com/LedgerHQ/ledger-live/commit/2b2eee6a4abfb86615f3e5a628f518b5a9c58dad), [`b99f923`](https://github.com/LedgerHQ/ledger-live/commit/b99f923997846b785c348006c5b434104c04f4a2), [`9717369`](https://github.com/LedgerHQ/ledger-live/commit/97173699dce7021d1c78713a72c4d79406324877), [`63c700c`](https://github.com/LedgerHQ/ledger-live/commit/63c700c28652b8a48e4ef57a6b73380b12434e61), [`8737f89`](https://github.com/LedgerHQ/ledger-live/commit/8737f89e2b515ab518cbcdeacc064641c6f595be), [`42d4dc2`](https://github.com/LedgerHQ/ledger-live/commit/42d4dc25044dceb9936c1907fb5ea0838fa0a64b), [`6d744e0`](https://github.com/LedgerHQ/ledger-live/commit/6d744e0d30b4480282d35c359d096f3f6d6602af), [`35d9396`](https://github.com/LedgerHQ/ledger-live/commit/35d9396f690292ae8efda27b24ac4143f03cd00b), [`c92c32e`](https://github.com/LedgerHQ/ledger-live/commit/c92c32e66d20de8a85454bf1fc444dadd3a51e76), [`77d202b`](https://github.com/LedgerHQ/ledger-live/commit/77d202b1930715ed30b62521fbc5692969b6ec47), [`9a39ad5`](https://github.com/LedgerHQ/ledger-live/commit/9a39ad5eeeaefff74791ec01db8c62c102b6e54a), [`69284e8`](https://github.com/LedgerHQ/ledger-live/commit/69284e8fff6db3afdf4b0c05254214baa8e4762b), [`bcd25fd`](https://github.com/LedgerHQ/ledger-live/commit/bcd25fd87bda9e7e8b7c3ee2a243d3e241adc0b0), [`91ac227`](https://github.com/LedgerHQ/ledger-live/commit/91ac22740fbf677ca481382eb55d2e4e12336d2a), [`99b54cd`](https://github.com/LedgerHQ/ledger-live/commit/99b54cdac46807286d75caa1a94e61a37606c18f), [`f482212`](https://github.com/LedgerHQ/ledger-live/commit/f48221278738b5b3accf7199c23e6dd84c48c27e), [`3cdcba9`](https://github.com/LedgerHQ/ledger-live/commit/3cdcba9252780b413452cb100682cf08041d966e), [`3a45eb3`](https://github.com/LedgerHQ/ledger-live/commit/3a45eb3e29f417f24570787e76d977cefa5090d9), [`8312d68`](https://github.com/LedgerHQ/ledger-live/commit/8312d6818aa5fa37f523352f81f51a61dd502bf2), [`c5c2815`](https://github.com/LedgerHQ/ledger-live/commit/c5c2815ec53dbf88804e558952f1451f13c37bb4), [`33094bc`](https://github.com/LedgerHQ/ledger-live/commit/33094bc31d9d8cd7a80b8eae3cf2b4afe3afa500)]:
  - @ledgerhq/transaction-observability@0.5.0
  - @ledgerhq/coin-stacks@0.33.0
  - @domain/entity-contact@0.12.0
  - @features/platform-contacts@0.10.0
  - @shared/clipboard@0.1.0
  - @features/flow-pay-card-transactions@0.5.0
  - @features/flow-contacts@0.14.0
  - @features/flow-pay-request@0.8.0
  - @shared/feature-flags@0.26.0
  - @features/flow-contacts-introduction@1.4.0
  - @features/flow-pay-contact@0.6.0
  - @features/flow-pay-balance@0.7.0
  - @ledgerhq/coin-bitcoin@0.55.0
  - @domain/entity-currency-crypto@0.15.0
  - @ledgerhq/ledger-wallet-framework@3.7.0
  - @domain/api-market-countervalues@0.2.0
  - @domain/entity-market-countervalues@0.3.0
  - @shared/api-services@0.10.0
  - @features/platform-app-lock@0.6.0
  - @features/flow-app-longer-password@0.1.0
  - @features/flow-app-password-removal@0.1.0
  - @features/flow-app-password-setup@0.1.0
  - @features/flow-app-protection-prompt@0.1.0
  - @features/flow-app-unlock@0.1.0
  - @ledgerhq/types-live@6.127.0
  - @shared/env@0.10.0
  - @ledgerhq/live-dmk-shared@0.35.0
  - @ledgerhq/native-ui@0.68.0
  - @ledgerhq/device-onboarding@0.5.0
  - @ledgerhq/coin-canton@1.4.0
  - @features/platform-card@0.8.0
  - @features/flow-pay-card-auth@0.10.0
  - @features/platform-content-ab-tests@0.2.0
  - @ledgerhq/coin-cosmos@1.6.0
  - @features/platform-market-countervalues@0.2.0
  - @ledgerhq/wallet-pnl@0.8.0
  - @domain/entity-client-identity@0.3.0
  - @features/platform-feature-flags-firebase@0.1.0
  - @features/platform-feature-flags@0.9.0
  - @domain/api-aggregated-assets@0.6.0
  - @features/flow-pay-feature-tour@0.8.0
  - @ledgerhq/live-dmk-mobile@0.31.0
  - @devtools/bindings@0.11.0
  - @features/flow-pay-card-details@0.7.0
  - @features/flow-pay-card@0.7.0
  - @ledgerhq/coin-multiversx@1.4.0
  - @features/platform-device-action-content@0.4.0
  - @ledgerhq/coin-filecoin@2.4.0
  - @ledgerhq/live-send@0.1.3
  - @features/flow-contacts-add-address@0.6.2
  - @features/flow-contacts-add-contact@0.7.2
  - @features/flow-contacts-delete-contact@0.2.5
  - @features/flow-contacts-edit-address@0.4.2
  - @features/flow-contacts-edit-contact@0.6.2
  - @features/flow-contacts-list@0.9.1
  - @ledgerhq/live-wallet@1.1.6
  - @features/flow-pay-card-assets@0.3.1
  - @features/flow-large-screen-upsell@2.2.2
  - @features/platform-currencies@0.9.2
  - @domain/api-currency-token@0.6.4
  - @domain/entity-currency@0.4.6
  - @domain/entity-currency-token@0.5.5
  - @ledgerhq/wallet-analytics@0.5.1
  - @ledgerhq/coin-casper@3.5.1
  - @ledgerhq/coin-concordium@1.5.1
  - @ledgerhq/live-signer-evm@0.24.1
  - @domain/api-card-management@0.8.1
  - @domain/api-currency-fiat@0.4.7
  - @domain/api-market-index-altcoin-season@0.4.1
  - @domain/api-market-index-fear-and-greed@0.4.1
  - @domain/api-push-devices@0.2.8
  - @ledgerhq/device-core@0.11.19
  - @features/platform-aggregated-assets@0.5.6
  - @features/platform-env@0.4.2
  - @ledgerhq/live-signer-tron@0.2.1
  - @features/flow-analytics-consent@0.2.9
  - @shared/analytics@0.4.0
  - @shared/analytics-react@0.4.0
  - @shared/auth@0.6.0
  - @shared/cloud-sync@0.3.0
  - @shared/i18n@0.2.0
  - @shared/linking@0.3.0
  - @shared/lottie@0.0.0
  - @shared/network-status@0.0.0
  - @shared/ui-info-state@0.4.0
  - @shared/ui-queued-bottom-sheet@0.6.0
  - @features/flow-pay-card-widget@0.5.1
  - @devtools/wire@0.5.1
  - @domain/entity-account@0.0.1
  - @domain/entity-account-name@0.2.2
  - @domain/entity-analytics-consent@0.2.2
  - @domain/entity-card-asset-mapping@0.7.0
  - @domain/entity-currency-fiat@0.4.0
  - @domain/entity-currency-unit@0.3.0
  - @domain/entity-interest-rate@0.3.0
  - @domain/entity-market-index-altcoin-season@0.3.0
  - @domain/entity-market-index-fear-and-greed@0.3.0
  - @domain/entity-recent-addresses@0.2.1
  - @domain/entity-starred-account@0.0.1
  - @domain/entity-wallet-sync@0.1.0
  - @features/flow-fear-and-greed@0.3.0
  - @features/flow-lazy-onboarding-banner@0.4.0
  - @features/platform-device-intent@5.2.0
  - @features/platform-pay-analytics@0.3.0
  - @features/platform-style@0.4.0
  - @features/platform-wallet-sync@0.1.3
  - @ledgerhq/ethereum-provider@0.8.0
  - @ledgerhq/hw-transport-http@6.38.0
  - @ledgerhq/live-dmk-speculos@0.11.0
  - @ledgerhq/live-engagement@0.1.0
  - @ledgerhq/types-devices@7.1.0
  - @devtools/shell@0.10.2

## 4.24.0-next.1

### Patch Changes

- Updated dependencies [[`2989e37`](https://github.com/LedgerHQ/ledger-live/commit/2989e37b80b8bfcaae549cc02aa6de189a69dfef)]:
  - @ledgerhq/ledger-wallet-framework@3.7.0-next.1
  - @ledgerhq/live-send@0.1.3-next.1
  - @ledgerhq/coin-bitcoin@0.55.0-next.1
  - @ledgerhq/coin-canton@1.4.0-next.1
  - @ledgerhq/coin-casper@3.5.1-next.1
  - @ledgerhq/coin-concordium@1.5.1-next.1
  - @ledgerhq/coin-cosmos@1.6.0-next.1
  - @ledgerhq/coin-filecoin@2.4.0-next.1
  - @ledgerhq/coin-multiversx@1.4.0-next.1
  - @ledgerhq/coin-stacks@0.33.0-next.1
  - @ledgerhq/live-signer-evm@0.24.1-next.1
  - @ledgerhq/live-wallet@1.1.6-next.1
  - @ledgerhq/wallet-analytics@0.5.1-next.1
  - @ledgerhq/wallet-pnl@0.8.0-next.1

## 4.24.0-next.0

### Minor Changes

- [#23139](https://github.com/LedgerHQ/ledger-live/pull/23139) [`320d2a1`](https://github.com/LedgerHQ/ledger-live/commit/320d2a1fbbe0d661681913d75f76bd70c4698115) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Resolve the market id of an asset from the ledger ids when needed, so favorites added from search show up in the Market banner

- [#22843](https://github.com/LedgerHQ/ledger-live/pull/22843) [`c954015`](https://github.com/LedgerHQ/ledger-live/commit/c954015d149a86adc8a1cdfcda41a71313171b68) Thanks [@semeano](https://github.com/semeano)! - feat(stacks): add mobile stake and unstake flows

- [#23025](https://github.com/LedgerHQ/ledger-live/pull/23025) [`6ec6cb7`](https://github.com/LedgerHQ/ledger-live/commit/6ec6cb7a760cb9da3762c7f3afc467675894e743) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Align the Contacts search no-results state with the design and update its copy

- [#23143](https://github.com/LedgerHQ/ledger-live/pull/23143) [`4101467`](https://github.com/LedgerHQ/ledger-live/commit/4101467e60d17f1facfae9c71e5b684bcf9f48e3) Thanks [@LucasWerey](https://github.com/LucasWerey)! - refactor(contacts): clean up the Contacts debug tools

  The send-history contacts builder was copied in both apps. It now lives once in
  `@domain/entity-contact/schema.mock` as `mockContactsFromSendHistory`. `@features/platform-contacts`
  adds `parseExcludedCurrencyIdsInput`, which works like `parseEligibleAddressFamiliesInput`. The
  desktop tool no longer copies flag params into local state with effects. Its inputs show the flag
  value unless you are editing them, use `cn`, and have no hard-coded strings left. The mobile tool
  drops its `StyleSheet`, shows the families as tags, and builds the flag preview in its view model.

- [#23101](https://github.com/LedgerHQ/ledger-live/pull/23101) [`6da6010`](https://github.com/LedgerHQ/ledger-live/commit/6da6010c5a783ed2957251f7f5d86df3b3c44138) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Replace react-native-linear-gradient with Lumen LinearGradient

- [#23064](https://github.com/LedgerHQ/ledger-live/pull/23064) [`82e9e1e`](https://github.com/LedgerHQ/ledger-live/commit/82e9e1e8feaf31b34916d0ea99f83fb1880d02a4) Thanks [@koda-apps](https://github.com/apps/koda-apps)! - Replace react-native-device-info and react-native-version-number with expo-device and expo-application

- [#23062](https://github.com/LedgerHQ/ledger-live/pull/23062) [`3bd2949`](https://github.com/LedgerHQ/ledger-live/commit/3bd294966d19cdd2ff0e8a06609d386d55aeb14e) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Replace react-native-image-picker with expo-image-picker for the custom lock screen gallery import

- [#23035](https://github.com/LedgerHQ/ledger-live/pull/23035) [`20bf9b0`](https://github.com/LedgerHQ/ledger-live/commit/20bf9b0c8694e9a3c873da1e81fd6b310410205c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Route every copy/paste through the new @shared/clipboard package (expo-clipboard replaces @react-native-clipboard/clipboard on mobile) and enforce it with lint rules; copy feedback now only shows once the copy succeeded

- [#23043](https://github.com/LedgerHQ/ledger-live/pull/23043) [`4028b7e`](https://github.com/LedgerHQ/ledger-live/commit/4028b7e53019ef07b2e94a6559c5f8a6ba54b82f) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Hold back a per-currency fee buffer when depositing the max of a native coin into perps, configured by the new `ptxTradeMaxConstant` flag (`feature_ptx_trade_max_constant`). Only the MAX ratio is reduced; token accounts and other ratios are unchanged.

- [#22860](https://github.com/LedgerHQ/ledger-live/pull/22860) [`21fa5a5`](https://github.com/LedgerHQ/ledger-live/commit/21fa5a533d3369db9586a38d6fa869f8c03121af) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Send the user back to the perps deposit form when they retry after a "not enough balance" error. Retrying re-ran the same deposit, which could only fail again; the form now reopens with the draft amount and funding account so the amount can be lowered. Other errors still retry in place

- [#22856](https://github.com/LedgerHQ/ledger-live/pull/22856) [`438c7b3`](https://github.com/LedgerHQ/ledger-live/commit/438c7b3035ac460e702d294a3c17db2843962d21) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Hide accounts that cannot send, such as HyperCore, from the perps deposit funding picker. The receiving HyperCore account was still offered as a funding source even though a deposit cannot be sent from it. The picker now opens in the `perpetuals:fund` flow, which rejects send-disabled families, so modular dialog analytics from that picker report `flow: "perpetuals:fund"`

- [#22890](https://github.com/LedgerHQ/ledger-live/pull/22890) [`ee95a8e`](https://github.com/LedgerHQ/ledger-live/commit/ee95a8e0c4cdce091dfc1cb0e9b54445030f079c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - fix(cg-client): remove the unused CoinGecko supported coins list query

  Removes `getSupportedCoinsList`, `useGetSupportedCoinsListQuery`, `useSupportedCurrencies`, `MarketCoinSchema`, `SupportedCoinsSchema` and the `MarketCoin` / `SupportedCoins` types. `useMarketDataProvider` now only returns `supportedCounterCurrencies`.

- [#23228](https://github.com/LedgerHQ/ledger-live/pull/23228) [`27d0cc9`](https://github.com/LedgerHQ/ledger-live/commit/27d0cc934120f4a57f3a63fe6a791cc74fee106e) Thanks [@ovoronkov-ledger](https://github.com/ovoronkov-ledger)! - fix(receive): keep network warning above verify address cta (LIVE-38002)

- [#22866](https://github.com/LedgerHQ/ledger-live/pull/22866) [`52747b3`](https://github.com/LedgerHQ/ledger-live/commit/52747b3d876e34712619bd17206cd4aa23e07636) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Name the default Me contact "Me" in the Pay tab contacts list instead of "My addresses (Me)"

- [#23053](https://github.com/LedgerHQ/ledger-live/pull/23053) [`2a09181`](https://github.com/LedgerHQ/ledger-live/commit/2a091816a8ec716c0bba802767671052c75843e8) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Show each stablecoin as its own Pay balance filter option, including testnet holdings

- [#23126](https://github.com/LedgerHQ/ledger-live/pull/23126) [`f0210f9`](https://github.com/LedgerHQ/ledger-live/commit/f0210f97c54a1bd452eacbca278d4b7dbed2fff5) Thanks [@dgreen-ledger](https://github.com/dgreen-ledger)! - fix(notifications): request POST_NOTIFICATIONS on Android 13+

  Firebase's `requestPermission` is a no-op on Android, so since #13457 the system notification
  prompt was never shown on Android 13 and above: tapping allow opened App info and push
  notifications stayed blocked. The app now requests `POST_NOTIFICATIONS` through
  `PermissionsAndroid` on Android 13+, and only opens the settings once the permission can no
  longer be requested.

- [#22436](https://github.com/LedgerHQ/ledger-live/pull/22436) [`23455ab`](https://github.com/LedgerHQ/ledger-live/commit/23455abfdc26b44eedd77a1c990a6721dadd3f5c) Thanks [@ysitbon](https://github.com/ysitbon)! - Add the countervalues domain api: rate fetching, and the orchestration that folds rates into the entity state.

  - `@domain/api-market-countervalues` owns the Countervalues Service endpoints and `loadCountervalues`, which moves out of `@ledgerhq/live-countervalues`.
  - The endpoints are injected into the shared countervalues api from `@shared/api-services` instead of standing up a second slice. The duplicate client in live-common is removed, so each app registers one countervalues reducer where it previously registered two against the same host. That slice is an RTK Query cache and is not persisted, so there is no stored state to migrate.
  - `loadCountervalues` takes its rates as an argument rather than reaching for a module-level client. The apps compose one in the countervalues bridge they already own; tests pass a mock directly, which removes the `MOCK_COUNTERVALUES` dispatcher hidden inside the fetch path.
  - Rate failures carry the HTTP status through unchanged, so an unsupported pair still clears its cache on 422, an HTTP failure still increments the per-pair backoff, and an offline period still does not.
  - Rate requests keep the previous request policy: a 60s timeout, so a hung connection can no longer stall countervalues polling, and the same retries as before. The two endpoints moved out of live-common keep not retrying.
  - `@ledgerhq/live-countervalues` drops `loadCountervalues`, its `api` entry point and the fetch contract types, and with them its dependencies on `@ledgerhq/logs`, `@ledgerhq/live-network`, `@ledgerhq/live-promise` and `@ledgerhq/live-env`. It no longer reaches the network.
  - web-tools now registers the shared countervalues api, which its portfolio countervalues loading dispatches through.
  - `cvsApiExtra` takes `getCountervaluesServiceUrl`, a getter read on every request, in place of the `countervaluesServiceUrl` string read once at store creation. Switching the developer staging toggle now applies to the next countervalues request again, as it did before the rates moved onto the shared api.

- [#22689](https://github.com/LedgerHQ/ledger-live/pull/22689) [`011766d`](https://github.com/LedgerHQ/ledger-live/commit/011766dd9d888920fe07db040eb4421d98b02160) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Report revamped protection clicks as `button_clicked` and completed activation, deactivation, and migration as `encryption_updated`

- [#22648](https://github.com/LedgerHQ/ledger-live/pull/22648) [`15491fb`](https://github.com/LedgerHQ/ledger-live/commit/15491fb3b72f27c41e24f076d23c4c83dc69abe5) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Move the app lock UI shared by several journeys into `@features/platform-app-lock`.

  `PasswordField` and the password draft (`PasswordDraftProvider`, `usePasswordDraft`) leave `@features/flow-app-lock`, which no longer exports them, for `@features/platform-app-lock`, exported from its native entry only. This is the first step of splitting the app lock flow into one package per journey: unlock, password setup and removal, longer password and the protection prompt each need these pieces, and none of them should depend on another journey to get them. No behaviour changes.

- [#22817](https://github.com/LedgerHQ/ledger-live/pull/22817) [`57b333d`](https://github.com/LedgerHQ/ledger-live/commit/57b333de5cab7b3e387aab8cb45de0a7705bd8ec) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Move the mandatory longer-password journey out of `@features/flow-app-lock` into a new `@features/flow-app-longer-password` package: `useLongerPasswordViewModel`, `LongerPasswordView` and its enter and confirm steps, `ChangePasswordSheet` and `PasswordChangedSheet`. The app's longer-password gate imports them from there, and the enter and confirm steps still reuse `@features/flow-app-password-setup`, which `@features/flow-app-lock` no longer depends on. No behaviour change.

- [#22792](https://github.com/LedgerHQ/ledger-live/pull/22792) [`9894c78`](https://github.com/LedgerHQ/ledger-live/commit/9894c78c32b055686c15db66e8369a7a3b12748a) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Move the password removal journey — the Deactivate password step and the sheet that keeps the last protection while a card is active — out of `@features/flow-app-lock` into a new `@features/flow-app-password-removal` package. The Settings password and biometrics rows and the Deactivate password screen import it from there. No behaviour change.

- [#22785](https://github.com/LedgerHQ/ledger-live/pull/22785) [`6225945`](https://github.com/LedgerHQ/ledger-live/commit/6225945749be628b088bbb65a102a40f984a569c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Move the app password setup steps into their own flow package, `@features/flow-app-password-setup`.

  The Setup password and Confirm password steps (`useSetupPasswordViewModel`, `SetupPasswordView`, `useConfirmPasswordViewModel`, `ConfirmPasswordView`) leave `@features/flow-app-lock`, which no longer exports them, for `steps/SetupPassword` and `steps/ConfirmPassword` in the new package. The app's add-password screens import them from there, and the longer-password journey, still in `@features/flow-app-lock`, reuses them through the new package. Third step of splitting the app lock flow into one package per journey. No behaviour changes.

- [#22828](https://github.com/LedgerHQ/ledger-live/pull/22828) [`9a947ef`](https://github.com/LedgerHQ/ledger-live/commit/9a947ef9a6cab8dc20865369676b13129fa7bf99) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Move the app protection prompt — `useProtectionPromptViewModel`, `EnableProtectionSheet` and `ProtectionEnabledSheet` — into a new `@features/flow-app-protection-prompt` package, and delete `@features/flow-app-lock`, now empty. The app's protection prompt imports from the new package. Last step of splitting the app lock flow into one package per journey. No behaviour change.

- [#22693](https://github.com/LedgerHQ/ledger-live/pull/22693) [`b18cbdb`](https://github.com/LedgerHQ/ledger-live/commit/b18cbdbabb25a9ffd1e44f7289f17fea4aba1266) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Move the app unlock journey into its own flow package, `@features/flow-app-unlock`.

  The unlock screen (`useUnlockViewModel`, `UnlockView`, the splash and focus rules) and the forgotten password sheet leave `@features/flow-app-lock`, which no longer exports them. They follow the flow layout, `steps/Unlock` with the sheet under `steps/Unlock/components`, and the app's unlock screen imports them from the new package. Second step of splitting the app lock flow into one package per journey. No behaviour changes.

- [#22993](https://github.com/LedgerHQ/ledger-live/pull/22993) [`6b2c0c6`](https://github.com/LedgerHQ/ledger-live/commit/6b2c0c6a4439e365ec3c58aa388619f44623a047) Thanks [@ovoronkov-ledger](https://github.com/ovoronkov-ledger)! - fix(asset-detail): stop cropping translated time range labels in the chart selector (LIVE-33383)

- [#22759](https://github.com/LedgerHQ/ledger-live/pull/22759) [`bf29f88`](https://github.com/LedgerHQ/ledger-live/commit/bf29f888316e5d8d9049b763a8c77ce9850f07df) Thanks [@qperrot](https://github.com/qperrot)! - fix(coin-bitcoin): read the explorer and tuning values from the injected coin config

  The module no longer keeps configuration in module state. `createBridges` takes a `Context`
  (ADR-019) and every bridge method resolves `config_currency_<id>` from `context.config()` at call
  time. The endpoint `explorer.url` is required and defaults to today's production host in each
  served `config_currency_<id>` (`http://localhost:9876` for `bitcoin_regtest`, whose `btc_regtest`
  explorer id also moves to its config). The optional fields fall back to named module defaults:
  `explorer.batchSize` (`DEFAULT_EXPLORER_BATCH_SIZE`, 1000), `fees.stuckTransactionTimeoutMs`
  (`DEFAULT_STUCK_TRANSACTION_TIMEOUT_MS`, 20 min), `fees.rbfMinBumpRatio`
  (`DEFAULT_RBF_MIN_BUMP_RATIO`, 0.1), `fees.calculationCacheTtlMs` and `fees.feeRatesCacheTtlMs`
  (5 min each) and `sync.replacedOperationExpiryMs` (`DEFAULT_REPLACED_OPERATION_EXPIRY_MS`, 2 h).
  The explorer is bound to a wallet-btc account from the config at use, so deserialization stays
  config-free and a remote change applies on the next call. wallet-btc still reads no configuration:
  the batch size is injected through `WalletBtcCurrency.explorerBatchSize`, and the RBF ratio and
  the unconfirmed-operation expiry are parameters.

  Breaking: `createBridges(signerContext, context)` takes a `Context` instead of a config getter;
  `setCoinConfig`, `getCoinConfig`, `CoinConfig`, `BitcoinConfigInfo`, `makeAssignFromAccountRaw`
  and `getMinRelayFee` are removed in favour of `BitcoinCoinConfig` / `BitcoinContext` and
  `assignFromAccountRaw`, and `postSync` becomes `makePostSync(context)`. The module logs only
  through `context.logger`: `buildTransaction`, `getTransactionStatus`, `prepareTransaction`,
  `calculateFees`, `signAccountTx`, `ChainAdapter.resolveFeePerByte`, `buildSignRawOperation` and the
  `hw-getAddress` / `hw-getFullViewingKey` resolvers take a `Logger`. `prepareTransaction`, `getTransactionStatus`, `buildTransaction`,
  `buildAccountTx`, `getOriginalTxFeeContext`, `getMinReplacementFeeSat`,
  `getMinReplacementFeeRateSatVb` and `getRbfContext` take the coin config as first parameter. The
  `getEditTransactionStatus` and `isStrategyDisabled` bridge extensions require the `mainAccount`. The `EXPLORER_REGTEST` and `BITCOIN_STUCK_TRANSACTION_TIMEOUT` envs are
  removed, as are the `config_currency_<id>` defaults of the bitcoin-family currencies no loader
  serves (`bitcoin_private`, `game_credits`, `gochain`, `lbry`, `nix`, `ravencoin`, `resistance`,
  `zclassic`, `zcoin`).

- [#22938](https://github.com/LedgerHQ/ledger-live/pull/22938) [`7a2505b`](https://github.com/LedgerHQ/ledger-live/commit/7a2505bd21cc2401e1e887cb5b9713281cb11519) Thanks [@qperrot](https://github.com/qperrot)! - Rename BNB Chain to BNB Smart Chain

- [#22599](https://github.com/LedgerHQ/ledger-live/pull/22599) [`d819300`](https://github.com/LedgerHQ/ledger-live/commit/d819300df11d1e58ad33dbb8d0dbdb6f20c8dd93) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Add failureType and subError properties to Device Intent Executor deviceflow_failed and deviceflow_aborted events

- [#23080](https://github.com/LedgerHQ/ledger-live/pull/23080) [`4e7c1ae`](https://github.com/LedgerHQ/ledger-live/commit/4e7c1ae11a76a078d027dac7584fd68bd0a82811) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Migrate mobile Add Account off pre-ldls onto Lumen and remove the native pre-ldls entry

- [#22995](https://github.com/LedgerHQ/ledger-live/pull/22995) [`3444d16`](https://github.com/LedgerHQ/ledger-live/commit/3444d16d5159b6e415b4dd0ab4fedfbf4cbeb260) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Implement the final Discovering, Connecting and Connected views of `ConnectNewDevice`, on a true black background. The animations come from the Figma Symbols Library in a light and a dark version, and they include their animated spot. The Discovering copy and animation depend on the scanned transports: Bluetooth, Bluetooth and USB, or USB only. Each discovered device shows in a card with a Connect button. For a USB device, the Connecting and Connected views say "connecting" and "connected" instead of "pairing" and "paired".

  The Connect New Device debug screen now mounts the component alone, as a caller does, and unmounts it when `onConnected`, `onDeviceNotFound` or `onClose` ends the flow. Its log also shows each mount and unmount.

  `onDeviceNotFound` is now optional: the "I don't see my device" button shows only when the caller passes it.

  A Connect New Device animations debug screen previews each of these Lotties, in the light and the dark theme.

- [#23021](https://github.com/LedgerHQ/ledger-live/pull/23021) [`3dacfc2`](https://github.com/LedgerHQ/ledger-live/commit/3dacfc29377ad8a8ac25ad51f2207c882491bb7e) Thanks [@fAnselmi-Ledger](https://github.com/fAnselmi-Ledger)! - Bump `@ledgerhq/device-management-kit` to 1.11.0 and `@ledgerhq/dmk-ledger-wallet` to 0.7.0.

- [#23246](https://github.com/LedgerHQ/ledger-live/pull/23246) [`71c5860`](https://github.com/LedgerHQ/ledger-live/commit/71c58602037e7dc69e35b99fb648c11e365adcd1) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Bump `@ledgerhq/dmk-ledger-wallet` to 0.7.1, `@ledgerhq/device-transport-kit-speculos` to 1.3.0 and `@ledgerhq/speculos-device-controller` to 0.4.0.

- [#23000](https://github.com/LedgerHQ/ledger-live/pull/23000) [`0710383`](https://github.com/LedgerHQ/ledger-live/commit/07103836533d3bc4ea9b2525d3f11df10791ef58) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Bump `react-native-reanimated` to 4.3.4 so animated views no longer revert to their initial values after a heavy JS-thread load at startup, which left the portfolio gauge cursor at 0 and the `AmountDisplay` digits overlapping.

- [#23083](https://github.com/LedgerHQ/ledger-live/pull/23083) [`4c28d72`](https://github.com/LedgerHQ/ledger-live/commit/4c28d726d50493ed3967c1a7eb84392442dfbeb9) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump `@ledgerhq/ledger-key-ring-protocol`, `@ledgerhq/hw-ledger-key-ring-protocol` to 1.0.0 and `@ledgerhq/evm-tools` to 2.0.0 (ts-libs). No API change.

- [#22984](https://github.com/LedgerHQ/ledger-live/pull/22984) [`2680cb0`](https://github.com/LedgerHQ/ledger-live/commit/2680cb0ba9badf37b769b81d856657f0aa923386) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Move the discovery, connection and unknown error UI of the Device Intent Executor to `mvvm/components/DeviceConnection`, so that connectNewDevice can reuse it. The moved components take the shared connectivity UI states and do no tracking. The executor keeps thin containers that add the screen and button tracking. The UI and the analytics events are unchanged.

- [#23178](https://github.com/LedgerHQ/ledger-live/pull/23178) [`e308deb`](https://github.com/LedgerHQ/ledger-live/commit/e308deb3e4f812f01166de17bb28c587a290b9bb) Thanks [@benruseau](https://github.com/benruseau)! - Add the OS updates orchestrator React layer: a generic `OsUpdatesOrchestratorComponent` and `useOsUpdatesOrchestrator` hook in live-common that render platform-injected components for each step

  Add the mobile pre-checks, create backup, apply updates and restore backup components, and persist the device backup in the app storage

  Use the real components in the OS updates orchestrator debug screen

  Fix the OS updates apply step after a bootloader recovery: when the device comes back on an OS, install the first update of the resolved path from its OSU firmware instead of its final firmware, which skipped an update

- [#22598](https://github.com/LedgerHQ/ledger-live/pull/22598) [`01ee590`](https://github.com/LedgerHQ/ledger-live/commit/01ee5909821c32b21577295f03f57a970e8fad2f) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Handle firmware handover and onboarding exits, and drive every Nano S through the shared flow

- [#22770](https://github.com/LedgerHQ/ledger-live/pull/22770) [`2cf2dfe`](https://github.com/LedgerHQ/ledger-live/commit/2cf2dfeccf79e36f0e8f233dab453e0ca9e8161a) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Settle the Perps deposit request from the mobile deposit flow with the swap ID and quoted amount, and reject it when the user leaves the deposit screen

- [#23148](https://github.com/LedgerHQ/ledger-live/pull/23148) [`cdd2446`](https://github.com/LedgerHQ/ledger-live/commit/cdd2446429b2a972d434863212ccceff2531901b) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Replace react-native-splash-screen with expo-splash-screen

- [#23184](https://github.com/LedgerHQ/ledger-live/pull/23184) [`3dda070`](https://github.com/LedgerHQ/ledger-live/commit/3dda0705f09d0e0da75ebde9a76b17ba7a9f65e6) Thanks [@CremaFR](https://github.com/CremaFR)! - Retry a swap up to twice, without showing the error, when the Exchange app rejects the provider signature (`signVerificationFail` at `CHECK_TRANSACTION_SIGNATURE`). `executeSwap` requests a new nonce and calls `/swap` again with the same parameters. Each rejected attempt is still reported to `/swap/cancelled`, with the attempt in the error message: `Signature verification failed Code: R0` for the first attempt, then `R1` and `R2` for the retries. This replaces the `[diagnostic=…]` signature classification, which is removed

- [#22745](https://github.com/LedgerHQ/ledger-live/pull/22745) [`db3bde1`](https://github.com/LedgerHQ/ledger-live/commit/db3bde1a0ea2435389260b012d9759dd26f7b174) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Canton: hide Accept once an offer expires while the screen is open, and show a clear message instead of retry when accepting an expired offer

- [#23008](https://github.com/LedgerHQ/ledger-live/pull/23008) [`ac0379e`](https://github.com/LedgerHQ/ledger-live/commit/ac0379ea0511dd457d6bba6a540d48b8358f4f93) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(send): show a broadcast error on the new send flow confirmation and only offer to try again for temporary errors (network, server, locked device)

- [#22811](https://github.com/LedgerHQ/ledger-live/pull/22811) [`3132a4a`](https://github.com/LedgerHQ/ledger-live/commit/3132a4aba419be9a91320295d8c0260f3509f9bd) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Consume `@ledgerhq/ledger-key-ring-protocol` and `@ledgerhq/hw-ledger-key-ring-protocol` from npm (they now live in `ts-libs`), and bump `axios` to 1.20.0. No API change.

- [#22604](https://github.com/LedgerHQ/ledger-live/pull/22604) [`ca82e70`](https://github.com/LedgerHQ/ledger-live/commit/ca82e703691d6e9716b522180d402d7eed9abc5f) Thanks [@sarneijim](https://github.com/sarneijim)! - Add an `ab_tests` attribute to desktop and mobile analytics events with the `trackingConfiguration` of each enabled English copy experiment, or `{}` when none applies

- [#22603](https://github.com/LedgerHQ/ledger-live/pull/22603) [`9c0feca`](https://github.com/LedgerHQ/ledger-live/commit/9c0feca47571b81e45c8dc3f0f1132583801ea95) Thanks [@sarneijim](https://github.com/sarneijim)! - Add `feature_copy_*` experiments to the feature flags debug screen so `enabled` and `copy` can be mocked locally

- [#22413](https://github.com/LedgerHQ/ledger-live/pull/22413) [`0f401bb`](https://github.com/LedgerHQ/ledger-live/commit/0f401bb6289b6e78fbd05b6f98977bde4999d22a) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(cosmos): move the Cosmos memo onto the shared generic-adapter memo fields (LIVE-36108)

  Prep work for the Cosmos generic-coin-framework migration (depends on LIVE-35735, already fixed):
  the shared `transactionToIntent` only reads `memoType`/`memoValue`, fields the four Cosmos memo
  write sites (desktop send field, mobile memo-tag input, mobile edit-memo screen, wallet-api
  adapter) never set — they only wrote the legacy `memo` field. Left as is, flipping Cosmos into
  `genericCoinFrameworkFamilies.json` in a later ticket would silently drop every memo, with no
  error anywhere.

  Adds a `cosmos` entry to the shared memo-application registry, adds `memoType`/`memoValue` to
  `CosmosLikeTransaction` alongside the existing `memo` field (read unchanged by the live legacy
  bridge), and centralizes the three-field patch in a single `cosmosMemoPatch` helper all four
  write sites now call, so they can't drift out of sync. Also adds the memo length check
  (`CosmosMemoTooLong`) to the Alpaca `validateIntent`, which nothing previously enforced outside
  the UI's `maxLength` truncation.

- [#23001](https://github.com/LedgerHQ/ledger-live/pull/23001) [`21ab07f`](https://github.com/LedgerHQ/ledger-live/commit/21ab07f8912d9c7fa9fb7e438e4e7873ca674f02) Thanks [@ysitbon](https://github.com/ysitbon)! - Move the countervalues Redux slice into `@features/platform-market-countervalues`: its reducer, action creators, initial state, state type and selectors. Both apps now mount `countervaluesReducer` at the same `countervalues` store key and keep their own `useSelector` hooks, persistence, polling and user-settings computation. The action types keep the desktop strings, so mobile's pending, error and wipe actions are now named `COUNTERVALUES_STATE_SET_PENDING`, `COUNTERVALUES_STATE_SET_ERROR` and `COUNTERVALUES_WIPE`. The reducer stays a plain function rather than `createSlice`, because immer would freeze the rate maps that `loadCountervalues` updates in place.

- [#23107](https://github.com/LedgerHQ/ledger-live/pull/23107) [`fa2c070`](https://github.com/LedgerHQ/ledger-live/commit/fa2c070913fb13e530c65d901151c2766c46caf6) Thanks [@ysitbon](https://github.com/ysitbon)! - Countervalues user settings are no longer stored in Redux: each app computes them and hands them to the provider through the bridge's `useUserSettings`.

  - `@features/platform-market-countervalues`: the slice loses its `userSettings` field, `setCountervaluesUserSettings` (`COUNTERVALUES_USER_SETTINGS_SET`) and `countervaluesUserSettingsSelector`.
  - Desktop: `useCalculateCountervaluesUserSettings` returns the memoized settings instead of dispatching them, and the bridge calls it directly. The provider sees the real tracking pairs and refresh rate from the first render instead of one render late, so the saved rates are restored once and the boot loads once.
  - Mobile: no runtime change; its tests read a shared test settings constant instead of the removed slice field.

- [#23071](https://github.com/LedgerHQ/ledger-live/pull/23071) [`eb23867`](https://github.com/LedgerHQ/ledger-live/commit/eb23867603dc4e80723cdfe5486c28bc88d57014) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Offer Ledger Sync during device onboarding from the single `deviceOnboarding` feature flag

- [#23131](https://github.com/LedgerHQ/ledger-live/pull/23131) [`a653da5`](https://github.com/LedgerHQ/ledger-live/commit/a653da51b91400a189831180f538d6ff6f432ba1) Thanks [@tonykhaov](https://github.com/tonykhaov)! - feat(device-onboarding): keep the screen awake while the device onboarding connects or runs

- [#22996](https://github.com/LedgerHQ/ledger-live/pull/22996) [`1f50e41`](https://github.com/LedgerHQ/ledger-live/commit/1f50e41fc85d46eec8ffdec4d27ab573a5cbb28e) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop `@ledgerhq/live-hooks`: `useDebounce` and a simpler `useThrottledValues` now live in `@ledgerhq/live-common/hooks`.

- [#23056](https://github.com/LedgerHQ/ledger-live/pull/23056) [`9a39ad5`](https://github.com/LedgerHQ/ledger-live/commit/9a39ad5eeeaefff74791ec01db8c62c102b6e54a) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - `ConnectNewDevice` keeps a device that is no longer discovered in its list, with a disabled card and a disabled Connect button.

- [#22803](https://github.com/LedgerHQ/ledger-live/pull/22803) [`0e3e7b0`](https://github.com/LedgerHQ/ledger-live/commit/0e3e7b023b7b285a955bb2aabb308d143d47bfba) Thanks [@ysitbon](https://github.com/ysitbon)! - fix(feature-flags): show the Firebase project the build actually targets

  The debug feature flags screen read the project name from the `firebaseEnvironmentReadOnly`
  remote flag, a value set by hand in each Firebase project, so a staging build reported
  `ledger-live-production`. It now reads the project id from the Firebase config bundled in the
  build.

- [#22795](https://github.com/LedgerHQ/ledger-live/pull/22795) [`ff5e1b0`](https://github.com/LedgerHQ/ledger-live/commit/ff5e1b0f5a315aaccd3e23aeb8ccd2c7d48730f4) Thanks [@ysitbon](https://github.com/ysitbon)! - refactor(feature-flags): move the Firebase Remote Config mapping to `@features/platform-feature-flags-firebase`

  `@features/platform-feature-flags` now only exposes resolved flag state (hooks and `FeatureToggle`). `formatToFirebaseFeatureId`, `formatDefaultFeatures`, `parseFirebaseFeatures` and `RemoteConfigValue` are imported from `@features/platform-feature-flags-firebase` instead; the `./firebase` subpath is removed. No behavior change.

- [#22352](https://github.com/LedgerHQ/ledger-live/pull/22352) [`c7e76f3`](https://github.com/LedgerHQ/ledger-live/commit/c7e76f3a015cf00cfdb1d057d1eee85ea6e99dc0) Thanks [@ishaba](https://github.com/ishaba)! - fix(babylon): remove pre-selected validator, default to show all

- [#22950](https://github.com/LedgerHQ/ledger-live/pull/22950) [`dccba0c`](https://github.com/LedgerHQ/ledger-live/commit/dccba0c7481c705b4a295942171891deff1c0e85) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Compute the firmware distribution salt of the non-DMK firmware update checks from the identities store instead of the USER_ID env, so they use the same salt as the DMK

- [#22520](https://github.com/LedgerHQ/ledger-live/pull/22520) [`d042881`](https://github.com/LedgerHQ/ledger-live/commit/d042881256ec1df83e426e3959cffb204cb2ab01) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Fix perps deposit quotes returning empty on mobile: read `SWAP_API_BASE` from `react-native-config` at store setup so the swap aggregator URL is resolved before the store captures it

- [#22939](https://github.com/LedgerHQ/ledger-live/pull/22939) [`c59fbf4`](https://github.com/LedgerHQ/ledger-live/commit/c59fbf41212398e3d0c1000c776d33c6344290a3) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - chore(hedera): migrate from @hashgraph/sdk 2.78.0 to @hiero-ledger/sdk 2.84.0
  fix(hedera): keep the nonce when serializing generic transactions

- [#22911](https://github.com/LedgerHQ/ledger-live/pull/22911) [`e2c3771`](https://github.com/LedgerHQ/ledger-live/commit/e2c3771fff768f1c83c2cfc99886999fa89fac46) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat(hedera): migrate mobile Hedera flows to the generic transaction shape

- [#22784](https://github.com/LedgerHQ/ledger-live/pull/22784) [`e72683b`](https://github.com/LedgerHQ/ledger-live/commit/e72683b8ed45df73659811db2ef15a18b4e0927c) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Hide the Pay tab card and its history when the pay-tab flag's card param is false

- [#22985](https://github.com/LedgerHQ/ledger-live/pull/22985) [`4182256`](https://github.com/LedgerHQ/ledger-live/commit/4182256c2213208e330861b904a6d8859d1b3e60) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix(hedera): generic adapter fixes for fee estimation, wallet API memo, token association wording, token receive and swap history saved by the legacy bridge

- [#23009](https://github.com/LedgerHQ/ledger-live/pull/23009) [`2bb0ec2`](https://github.com/LedgerHQ/ledger-live/commit/2bb0ec286a4fa825c26cbc8db3d6588383fd3a07) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Large Mover: screen readers only read the front card, and swiping up/down on the coin shows the next or previous one. The swipe integration test no longer relies on gesture-handler jest-utils, which made it flaky.

- [#22640](https://github.com/LedgerHQ/ledger-live/pull/22640) [`8783545`](https://github.com/LedgerHQ/ledger-live/commit/87835456704c2322a25339ef27ef92a320d02025) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(contacts): stop reading `ethereumLikeInfo` and promote `chainId` from coin config

- [#22395](https://github.com/LedgerHQ/ledger-live/pull/22395) [`39d91b6`](https://github.com/LedgerHQ/ledger-live/commit/39d91b68fa8b7ad7625887fee6ff126c131eaf34) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(tracking): tracking error and warning in new send flow lwm

- [#22743](https://github.com/LedgerHQ/ledger-live/pull/22743) [`4d9cfbd`](https://github.com/LedgerHQ/ledger-live/commit/4d9cfbd7eff1fb20fb2052b0a2f2b21ea87ba052) Thanks [@ysitbon](https://github.com/ysitbon)! - Import the countervalues logic, types, helpers and mocks from `@domain/entity-market-countervalues` instead of `@ledgerhq/live-countervalues`, and depend on the entity package in place of the legacy one. Specifier change only, no behaviour change.

  Three app tests move with live-common because the `calculate` they mock is called inside live-common: desktop's `useHistoryOperations` and mobile's `useOperationsListViewModel` and `useOperationsV1`. Their mock has to name the same module live-common imports.

- [#23020](https://github.com/LedgerHQ/ledger-live/pull/23020) [`e1f1bed`](https://github.com/LedgerHQ/ledger-live/commit/e1f1bedeb3de6bee0c290312472a083ad804519b) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - fix(asset-detail): show asset ticker and icon in the header when no Ledger currency resolves (e.g. Firo)

- [#22703](https://github.com/LedgerHQ/ledger-live/pull/22703) [`a09b259`](https://github.com/LedgerHQ/ledger-live/commit/a09b25924769c567406ede58b9575f3552427a74) Thanks [@LL782](https://github.com/LL782)! - Import mobile analytics from the shared packages instead of app barrel shims

- [#22749](https://github.com/LedgerHQ/ledger-live/pull/22749) [`bde5ee6`](https://github.com/LedgerHQ/ledger-live/commit/bde5ee6bf47643c76b98236cb5a4e13340ca2bea) Thanks [@ysitbon](https://github.com/ysitbon)! - Import the countervalues logic, types and helpers from `@domain/entity-market-countervalues` instead of `@ledgerhq/live-countervalues`, and drop the legacy dependency. Specifier change only, no behaviour change.

- [#22816](https://github.com/LedgerHQ/ledger-live/pull/22816) [`7b17793`](https://github.com/LedgerHQ/ledger-live/commit/7b17793574ca6a21aacd78b4da3cc4a74cf27073) Thanks [@lewisd5](https://github.com/lewisd5)! - fix(lwm): declare babel-loader and @babel/plugin-syntax-typescript so the iOS bundle builds without @babel/\* hoisting

- [#22635](https://github.com/LedgerHQ/ledger-live/pull/22635) [`bfebf6b`](https://github.com/LedgerHQ/ledger-live/commit/bfebf6bfd3bde69afa46b73bbf5a4382f88233ad) Thanks [@sarneijim](https://github.com/sarneijim)! - Apply enabled `feature_copy_*` Remote Config values as English copy overrides, reusing the feature-flag fetch

- [#23086](https://github.com/LedgerHQ/ledger-live/pull/23086) [`5532cc2`](https://github.com/LedgerHQ/ledger-live/commit/5532cc2a358403d808ba32f74a6cddb3c2277404) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Fix unreadable text on the feature flags debug screen in dark mode

- [#22933](https://github.com/LedgerHQ/ledger-live/pull/22933) [`c24108f`](https://github.com/LedgerHQ/ledger-live/commit/c24108f31f66d6d930f0f838e7005b07a6398a97) Thanks [@ysitbon](https://github.com/ysitbon)! - Import the countervalues provider and hooks from `@features/platform-market-countervalues` instead of `@ledgerhq/live-countervalues-react`, and `useUsdToFiatRate` and `useGetCounterValueIdsPolling` from it instead of live-common. The app and the test renderer mount the platform provider. Mobile no longer depends on `@ledgerhq/live-countervalues-react`. Specifier change only, no behaviour change.

- [#22796](https://github.com/LedgerHQ/ledger-live/pull/22796) [`faccddb`](https://github.com/LedgerHQ/ledger-live/commit/faccddb71d46cbc34818f9a1fd4fbc810c1bf908) Thanks [@LL782](https://github.com/LL782)! - fix(analytics): send language as a flat property on the Discoverability - Prompt event

- [#22943](https://github.com/LedgerHQ/ledger-live/pull/22943) [`dad0153`](https://github.com/LedgerHQ/ledger-live/commit/dad01537ce5e0263964adcfaf762246003c527b4) Thanks [@LucasWerey](https://github.com/LucasWerey)! - fix(my-wallet): show Help and Referral as tiles and Wallet backups as a list item (LIVE-38059)

- [#22765](https://github.com/LedgerHQ/ledger-live/pull/22765) [`e3e6c22`](https://github.com/LedgerHQ/ledger-live/commit/e3e6c222ddba748a7e9e03e85f5919ce8e5c28bd) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Extract the device discovery service and the connectivity types shared by device connection flows into a `deviceConnectivity` folder. The discovery, connection and unknown error UI states now use the shared `ConnectivityUIStateTypes` enum. `ConnectDeviceUIStateTypes` becomes a const object that includes these shared members, so type positions use `typeof ConnectDeviceUIStateTypes.X` or the new `ConnectDeviceUIStateType` type. The device type moves to the shared part as `Device`, and connectDevice keeps `KnownDevice` as an alias of it. connectDevice behaviour is unchanged.

- [#23055](https://github.com/LedgerHQ/ledger-live/pull/23055) [`c7cf8b4`](https://github.com/LedgerHQ/ledger-live/commit/c7cf8b4f3231d55d829a3b1d1a62a529b85ae356) Thanks [@Valentin-Ledger](https://github.com/Valentin-Ledger)! - Open the Borrow screen from the ledgerlive://borrow deeplink

- [#22910](https://github.com/LedgerHQ/ledger-live/pull/22910) [`177a5b4`](https://github.com/LedgerHQ/ledger-live/commit/177a5b413ca0348c78aca5cbdfca9340355f4b23) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Pay card login: name Monavate instead of Baanx in "Log in to" and "Card provided by".

- [#22649](https://github.com/LedgerHQ/ledger-live/pull/22649) [`514d6f9`](https://github.com/LedgerHQ/ledger-live/commit/514d6f937e082fa8b86d87bcf170cc2ec57d51e0) Thanks [@koda-apps](https://github.com/apps/koda-apps)! - Show a newly linked Card asset when the user comes back to Pay from Baanx.

- [#22723](https://github.com/LedgerHQ/ledger-live/pull/22723) [`a92f75f`](https://github.com/LedgerHQ/ledger-live/commit/a92f75faea8c76b1e650a57edfc76a7f0e44ae75) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Closing Buy opened from the Pay tab returns to the Pay tab instead of the portfolio

- [#22869](https://github.com/LedgerHQ/ledger-live/pull/22869) [`eb65ce4`](https://github.com/LedgerHQ/ledger-live/commit/eb65ce49ea0fa2d2c44f79fd2b0f8de365ae5e53) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add feature-flag scenarios for the native Pay card, Card live app login, and CL Card disclaimer

- [#22027](https://github.com/LedgerHQ/ledger-live/pull/22027) [`10e4a67`](https://github.com/LedgerHQ/ledger-live/commit/10e4a67f1aeffc909e8f5153b9720f568140323b) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Default the Perps deposit funding account to the USDC account with the highest non-zero spendable balance

- [#22865](https://github.com/LedgerHQ/ledger-live/pull/22865) [`667d378`](https://github.com/LedgerHQ/ledger-live/commit/667d378b97e9102df009015e01fed6b49fd88b82) Thanks [@ysitbon](https://github.com/ysitbon)! - Add `@features/platform-market-countervalues`, the countervalues React glue: the provider, its context and the hooks reading it, plus `useUsdToFiatRate` and `useGetCounterValueIdsPolling`. It is a copy of `@ledgerhq/live-countervalues-react` and of the two live-common hooks, which keep their own until their consumers move over.

  - `@ledgerhq/live-countervalues-react` reads the platform package's `CountervaluesContext` instead of creating its own, so a provider from either package serves the hooks of both. It stops exporting `CountervaluesContext`, which nothing imported, and drops its unused `@ledgerhq/types-live` dependency.
  - The platform package depends on no logging library. Desktop and mobile hand it their logger with `setCountervaluesLogger` at app setup, next to the rate lookups.

- [#23121](https://github.com/LedgerHQ/ledger-live/pull/23121) [`3a45eb3`](https://github.com/LedgerHQ/ledger-live/commit/3a45eb3e29f417f24570787e76d977cefa5090d9) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - `ConnectNewDevice` shows only the available USB devices when a USB device is available, and only the devices on the other transports otherwise, so that the same device does not show over USB and over Bluetooth.

- [#22654](https://github.com/LedgerHQ/ledger-live/pull/22654) [`78b38fb`](https://github.com/LedgerHQ/ledger-live/commit/78b38fb3820d3391c5c04812fee88c1c2a6e9289) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(send): sync account at the start of a send

- [#23150](https://github.com/LedgerHQ/ledger-live/pull/23150) [`4dec481`](https://github.com/LedgerHQ/ledger-live/commit/4dec481cf274c6db74c334e5a74df574a8d04f54) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Keep the device onboarding session in the machine context, follow a new session on reconnect, and let the host run the exit actions

- [#22766](https://github.com/LedgerHQ/ledger-live/pull/22766) [`b2792d8`](https://github.com/LedgerHQ/ledger-live/commit/b2792d8806411c2a35e1622109bee830c44a6cbc) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Show a setup state on the History card tab when the signed-in holder has not claimed a card yet.

- [#22960](https://github.com/LedgerHQ/ledger-live/pull/22960) [`ddd2bce`](https://github.com/LedgerHQ/ledger-live/commit/ddd2bce6afff10166987d05cebb4b60721bb30dc) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(contact): display contact in tx details lwm

- [#22673](https://github.com/LedgerHQ/ledger-live/pull/22673) [`08e85b2`](https://github.com/LedgerHQ/ledger-live/commit/08e85b261d6dc1a808c7fe438982bec65a74ac07) Thanks [@LucHebrard](https://github.com/LucHebrard)! - Remove the bottom safe-area padding on the Ledger Recover webview and show a themed loader until it loads

- [#22661](https://github.com/LedgerHQ/ledger-live/pull/22661) [`ea1ae2d`](https://github.com/LedgerHQ/ledger-live/commit/ea1ae2def97f41c602b4c4c78e2749496eda1293) Thanks [@qperrot](https://github.com/qperrot)! - Fix Earn banner on Asset Detail not opening the SEI delegation validator selection

- [#23044](https://github.com/LedgerHQ/ledger-live/pull/23044) [`dce4fb6`](https://github.com/LedgerHQ/ledger-live/commit/dce4fb6a4ec291153cc5b4d5a0d5000f777007e1) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove the lwmQuickActionsCtasVariant feature flag and its Receive/Send quick action CTAs variant

- [#22659](https://github.com/LedgerHQ/ledger-live/pull/22659) [`bed3cf9`](https://github.com/LedgerHQ/ledger-live/commit/bed3cf9bd880e00d51fc90849dca3741b9ab779f) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Restore the Card sign-in state at app start so the Card history shows a stored session

- [#22820](https://github.com/LedgerHQ/ledger-live/pull/22820) [`f4bfc96`](https://github.com/LedgerHQ/ledger-live/commit/f4bfc9672830fb3e9c76dd4826c963ab8be501cf) Thanks [@gre-ledger](https://github.com/gre-ledger)! - chore(lwm): replace @rozenite/mmkv-plugin with @rozenite/storage-plugin

- [#23221](https://github.com/LedgerHQ/ledger-live/pull/23221) [`91ad9a0`](https://github.com/LedgerHQ/ledger-live/commit/91ad9a0e481e3935f80089a800293a4733aef450) Thanks [@sarneijim](https://github.com/sarneijim)! - Add `connectSeededDevice` to the `deviceOnboarding` flag and send a non-seeded device to legacy onboarding unless the host can run seed setup

- [#23140](https://github.com/LedgerHQ/ledger-live/pull/23140) [`b99f923`](https://github.com/LedgerHQ/ledger-live/commit/b99f923997846b785c348006c5b434104c04f4a2) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Play Lottie animations through the new `@shared/lottie` package: dotlottie on web (replacing the unmaintained `react-lottie` / `lottie-web`), `lottie-react-native` on mobile.

- [#22702](https://github.com/LedgerHQ/ledger-live/pull/22702) [`c4f0be9`](https://github.com/LedgerHQ/ledger-live/commit/c4f0be97f4d86b2bd5e7dcee9be840a25c72b2ef) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - updated translation for claim operations for Aleo

- [#22950](https://github.com/LedgerHQ/ledger-live/pull/22950) [`8737f89`](https://github.com/LedgerHQ/ledger-live/commit/8737f89e2b515ab518cbcdeacc064641c6f595be) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Keep the DMK firmware distribution salt in sync with the user ID of the identities store, so DMK flows follow the progressive OS rollout on desktop and mobile

- [#22846](https://github.com/LedgerHQ/ledger-live/pull/22846) [`42d4dc2`](https://github.com/LedgerHQ/ledger-live/commit/42d4dc25044dceb9936c1907fb5ea0838fa0a64b) Thanks [@benruseau](https://github.com/benruseau)! - Add the apply updates sub-step to the OS updates orchestrator, covering the OSU install, the MCU flash loop and the final firmware install

  Wait out the device reboots each install and flash leaves behind, reconnecting under the same session id

  Add the restore backup step, which runs as the last tenth of the bar when it follows an update and on its own when there is nothing left to update

  Sync `BASE_SOCKET_URL` to the DMK secure channel WebSocket URL

- [#21839](https://github.com/LedgerHQ/ledger-live/pull/21839) [`6d744e0`](https://github.com/LedgerHQ/ledger-live/commit/6d744e0d30b4480282d35c359d096f3f6d6602af) Thanks [@YazhuEth](https://github.com/YazhuEth)! - `estimateFees` now returns the recipient token account, wallet address and input type of an SPL transfer alongside its fee, so the device screen names the destination; a recipient token account holding another token throws `SolanaTokenAccountHoldsAnotherToken`.

  `makeEmptyTokenAccount` now builds its id with `encodeTokenAccountId`, like the fourteen families that already do: the wallet-API placeholder previously used the contract address, so it matched no real sub-account id.

  Solana runs on the generic coin framework. The send and staking screens move onto the generic transaction shape, which names what it does — a mode, a memo, a stake account seed — instead of the nested command model the legacy bridge carried, and the apps now read it through one family module rather than reaching into the transaction themselves.

  The behaviours the legacy bridge produced are restored on the generic path: an incoming SPL transfer produces an operation, a stake withdrawal empties the account rather than signing a stale amount, opening a token account is charged its rent, sending the maximum to a new stake account leaves enough to unstake it later, the device confirmation screen lists every row the device itself shows, and a token account's frozen state and Token-2022 extensions are back on screen.

  A live app can again submit the four token and stake commands the wallet API defines, and a raw signature it gets back is hex, as the field it arrives in says. The device signer is selected through the family's own factory, so the `ldmkSolanaSigner` flag and the transaction-check option it carries keep deciding, as they did before. The mock bridge is rewritten on the coin module, so a mocked signature still yields a transaction the wallet API can deserialize.

- [#23112](https://github.com/LedgerHQ/ledger-live/pull/23112) [`7f0d867`](https://github.com/LedgerHQ/ledger-live/commit/7f0d867cc9f8715b9244979e42a035babe43d2ab) Thanks [@amaslakov](https://github.com/amaslakov)! - Harden the Tronify rent payment: Retry stays locked until a payment that may still land has expired, a rent price rise is shown and must be accepted before ordering again, a signed payment about to expire is refused before broadcast, and the unreachable contract-data failure is removed.

- [#22979](https://github.com/LedgerHQ/ledger-live/pull/22979) [`69284e8`](https://github.com/LedgerHQ/ledger-live/commit/69284e8fff6db3afdf4b0c05254214baa8e4762b) Thanks [@sarneijim](https://github.com/sarneijim)! - Keep the Ledger Recovery Key backup as its own onboarding step

- [#23032](https://github.com/LedgerHQ/ledger-live/pull/23032) [`bcd25fd`](https://github.com/LedgerHQ/ledger-live/commit/bcd25fd87bda9e7e8b7c3ee2a243d3e241adc0b0) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - chore(live-dmk): remove the ldmkTransport feature flag

  `DeviceManagementKitProvider` on desktop no longer takes `ldmkTransportEnabled` and always provides
  the Device Management Kit. `useDeviceManagementKit` now returns a non-null `DeviceManagementKit` and
  throws outside the provider. The PayTab address verification always uses the Device Intent Executor,
  and the `isLDMKTransportEnabled` analytics property is removed.

- [#23031](https://github.com/LedgerHQ/ledger-live/pull/23031) [`3264580`](https://github.com/LedgerHQ/ledger-live/commit/3264580e247bbd35d774b33eae21cc7c2e87d105) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Pass `swapApiEnv` (`stg` | `prd`) to the Swap live app so it follows Wallet's Swap backend

  - Derived from the `SWAP_API_BASE` url via new `getSwapAPIEnv` helper in live-common
  - Unknown hosts (e.g. localhost) send nothing; the live app keeps its own default
  - Stop passing the full `swapApiBase` url; the live app no longer reads it

- [#22891](https://github.com/LedgerHQ/ledger-live/pull/22891) [`cc764ec`](https://github.com/LedgerHQ/ledger-live/commit/cc764ec269edef9640fb58ff4aa26b70bff8d3c7) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Open swap history from the `swap/history` deeplink, with the swap matching `swapId` opened

- [#23127](https://github.com/LedgerHQ/ledger-live/pull/23127) [`7f7eeab`](https://github.com/LedgerHQ/ledger-live/commit/7f7eeaba851655f40c4583d1f8a08ece168a75f0) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Replace react-native-get-random-values with expo-crypto for crypto.getRandomValues

- [#23185](https://github.com/LedgerHQ/ledger-live/pull/23185) [`437d666`](https://github.com/LedgerHQ/ledger-live/commit/437d66634fd97401a91637013ceca7d473ea32fb) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Replace @react-native-community/netinfo with expo-network behind the new @shared/network-status package, and use it for the desktop network status

- [#22990](https://github.com/LedgerHQ/ledger-live/pull/22990) [`67dbab2`](https://github.com/LedgerHQ/ledger-live/commit/67dbab258571b96d67cfda3fa421917b9a179da6) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Add the `ConnectNewDevice` component. It runs connectNewDevice, shows one view for each UI state and shows the discovery, connection and unknown errors in a bottom sheet over the last view. The Discovering, Connecting and Connected views are placeholders. The device intent executor and `ConnectNewDevice` now save the connected device with the same `useSaveConnectedDevice` hook. `ConnectNewDevice` also adds a new Bluetooth device to the BLE known devices.

  Add a Connect New Device debug screen in Settings > Debug > Features > Device Intent Executor. It runs the `ConnectNewDevice` component, logs its `onConnected`, `onDeviceNotFound` and `onClose` calls, and can restart the flow with other delays.

- [#22384](https://github.com/LedgerHQ/ledger-live/pull/22384) [`bc6383a`](https://github.com/LedgerHQ/ledger-live/commit/bc6383a216f5bf72aa48219542f958cc778e4c29) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - Migrate the mobile Cosmos staking UI (delegate, undelegate, redelegate, claim/compound) onto the generic staking transaction shape

- [#22953](https://github.com/LedgerHQ/ledger-live/pull/22953) [`f482212`](https://github.com/LedgerHQ/ledger-live/commit/f48221278738b5b3accf7199c23e6dd84c48c27e) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - chore(device): remove the legacy connectApp and the ldmkConnectApp feature flag

  `connectApp` and `connectManager` now always use the Device Management Kit device actions and fail
  with `DmkTransportRequired` on a non-DMK transport. `apps/inlineAppInstall`, `hw/isUpdateAvailable`
  and `DeviceManagementKitTransport.listenLegacyConnectApp` are removed.

- [#23022](https://github.com/LedgerHQ/ledger-live/pull/23022) [`ebc1ab9`](https://github.com/LedgerHQ/ledger-live/commit/ebc1ab939711ff7851a1456ec015d492af6e19d4) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Fix Receive confirmation header so the help button no longer overlaps the title or triggers close

- [#21764](https://github.com/LedgerHQ/ledger-live/pull/21764) [`b014537`](https://github.com/LedgerHQ/ledger-live/commit/b01453792d10e8ccb157c65661e123b2f1cbc963) Thanks [@shazzzam](https://github.com/shazzzam)! - Add the Tronify sponsored send to the mobile Send flow behind the `gasSponsorship` flag: a USDT transfer can pay its network fee with rented energy, signing the rent payment first, then the transfer once the energy is delivered on-chain.

- [#22818](https://github.com/LedgerHQ/ledger-live/pull/22818) [`c56dcb3`](https://github.com/LedgerHQ/ledger-live/commit/c56dcb3804eb00b1a2d8dc47aa586de28e353e94) Thanks [@ysitbon](https://github.com/ysitbon)! - `useSendAmount` takes the `cryptoCurrency` to convert instead of the `account` holding it. Callers resolve it with `getAccountCurrency` on the same account they passed before, so a token account still converts with its token. The hook no longer imports any account type or helper.

- [#22989](https://github.com/LedgerHQ/ledger-live/pull/22989) [`8312d68`](https://github.com/LedgerHQ/ledger-live/commit/8312d6818aa5fa37f523352f81f51a61dd502bf2) Thanks [@gre-ledger](https://github.com/gre-ledger)! - chore: take `uuid` from the pnpm catalog (11.1.0)

  `uuid` was spread over 8.3.2, 9.0.1 and 11.1.0. Every package now uses the catalog entry. `@types/uuid` is dropped: 11 ships its own types. The repo only imports `v4`, `v5` and `parse` (`parse` in a coin-solana test fixture), which behave the same across these majors. 11 types `v4` with overloads, so passing it directly as a callback (`useState(uuid)`) no longer typechecks and is now wrapped (`useState(() => uuid())`).

- [#22383](https://github.com/LedgerHQ/ledger-live/pull/22383) [`33094bc`](https://github.com/LedgerHQ/ledger-live/commit/33094bc31d9d8cd7a80b8eae3cf2b4afe3afa500) Thanks [@ysitbon](https://github.com/ysitbon)! - Let wallet-pnl declare the countervalues interface it needs

  The package computed profit and loss straight against the countervalues implementation, which
  tied a pure pricing calculation to a concrete state shape. It now declares the three operations
  it uses as a `RateLookup` interface, treats the state as an opaque snapshot, and drops
  `@ledgerhq/live-countervalues` from its dependencies. The apps fill the interface at startup,
  beside the crypto-assets store and the two lookups already registered there.

  The exported signatures keep their arity and the state argument is assignable as before, so no
  caller needs a change for the interface.

  The third operation is a cache key. `getCostBasis` memoises against a fingerprint of the rate
  history relevant to a pair, which it used to compute inline from three countervalues helpers.
  That computation moves to `@domain/entity-market-countervalues` as `historyKey`, beside the
  `lenseRateMap` it is built on, so the three apps share one copy instead of each carrying its own
  and risking drift. A drifted key serves a stale cost basis silently. The key string is unchanged,
  and the existing cache tests pin it without being modified.

  The synthetic state builder moves with it. `buildCV`, `buildMultiCV` and `dailyHistory`
  construct countervalues state rather than reading it, so they cannot work against an opaque
  snapshot; they now live behind `@domain/entity-market-countervalues/mock`, and
  `@ledgerhq/wallet-pnl/scenarios` no longer exports them. The web-tools pnl-calculator imports them
  from the entity directly.

  web-tools registers the interface too. It renders profit and loss through the same package but
  was never a consumer of the two lookups registered previously, so it needed wiring of its own.

### Patch Changes

- Updated dependencies [[`5b62ecb`](https://github.com/LedgerHQ/ledger-live/commit/5b62ecb5c84b36099b4f29fcca9665431a468fb7), [`d60f240`](https://github.com/LedgerHQ/ledger-live/commit/d60f240af5f814d887bb2df19db8415425b52317), [`c954015`](https://github.com/LedgerHQ/ledger-live/commit/c954015d149a86adc8a1cdfcda41a71313171b68), [`4101467`](https://github.com/LedgerHQ/ledger-live/commit/4101467e60d17f1facfae9c71e5b684bcf9f48e3), [`20bf9b0`](https://github.com/LedgerHQ/ledger-live/commit/20bf9b0c8694e9a3c873da1e81fd6b310410205c), [`4028b7e`](https://github.com/LedgerHQ/ledger-live/commit/4028b7e53019ef07b2e94a6559c5f8a6ba54b82f), [`1bf1044`](https://github.com/LedgerHQ/ledger-live/commit/1bf1044e3eb3b57187bf6c837b17b4ed00f870cc), [`8376d49`](https://github.com/LedgerHQ/ledger-live/commit/8376d497d552cd4644e806afdfbd5323bf10a695), [`75e55ba`](https://github.com/LedgerHQ/ledger-live/commit/75e55ba31bb763cfae2e0d850fb76930854abb39), [`52747b3`](https://github.com/LedgerHQ/ledger-live/commit/52747b3d876e34712619bd17206cd4aa23e07636), [`2a09181`](https://github.com/LedgerHQ/ledger-live/commit/2a091816a8ec716c0bba802767671052c75843e8), [`5eca063`](https://github.com/LedgerHQ/ledger-live/commit/5eca063fe675ec5cb59cc96fffe4b67fcd7f3061), [`d6e7695`](https://github.com/LedgerHQ/ledger-live/commit/d6e7695bf15852c7b0cd2a97aa0a3a0c4d047d74), [`87de6a7`](https://github.com/LedgerHQ/ledger-live/commit/87de6a72f75df73aab99da6c420de00004bf7692), [`ef84a7c`](https://github.com/LedgerHQ/ledger-live/commit/ef84a7cac52080143934ebf01511d24a4dcaa0f3), [`20484ff`](https://github.com/LedgerHQ/ledger-live/commit/20484ff8d7cc0aab2e4b8448c7e8ce9ebf6840fe), [`f047501`](https://github.com/LedgerHQ/ledger-live/commit/f047501381efde857b48c1314d2de637fdce8ade), [`23455ab`](https://github.com/LedgerHQ/ledger-live/commit/23455abfdc26b44eedd77a1c990a6721dadd3f5c), [`15491fb`](https://github.com/LedgerHQ/ledger-live/commit/15491fb3b72f27c41e24f076d23c4c83dc69abe5), [`57b333d`](https://github.com/LedgerHQ/ledger-live/commit/57b333de5cab7b3e387aab8cb45de0a7705bd8ec), [`9894c78`](https://github.com/LedgerHQ/ledger-live/commit/9894c78c32b055686c15db66e8369a7a3b12748a), [`6225945`](https://github.com/LedgerHQ/ledger-live/commit/6225945749be628b088bbb65a102a40f984a569c), [`9a947ef`](https://github.com/LedgerHQ/ledger-live/commit/9a947ef9a6cab8dc20865369676b13129fa7bf99), [`b18cbdb`](https://github.com/LedgerHQ/ledger-live/commit/b18cbdbabb25a9ffd1e44f7289f17fea4aba1266), [`bf29f88`](https://github.com/LedgerHQ/ledger-live/commit/bf29f888316e5d8d9049b763a8c77ce9850f07df), [`c9b7594`](https://github.com/LedgerHQ/ledger-live/commit/c9b75949c8f01cade6b061bd5b6ecb0af5b0ec5f), [`7a2505b`](https://github.com/LedgerHQ/ledger-live/commit/7a2505bd21cc2401e1e887cb5b9713281cb11519), [`d33fd72`](https://github.com/LedgerHQ/ledger-live/commit/d33fd721a5d1a9363f820738f6aadbeb0a8b3cad), [`d819300`](https://github.com/LedgerHQ/ledger-live/commit/d819300df11d1e58ad33dbb8d0dbdb6f20c8dd93), [`4e7c1ae`](https://github.com/LedgerHQ/ledger-live/commit/4e7c1ae11a76a078d027dac7584fd68bd0a82811), [`48874b3`](https://github.com/LedgerHQ/ledger-live/commit/48874b3b33c83b40f7c2c389f7a84ebe96d58816), [`4c28d72`](https://github.com/LedgerHQ/ledger-live/commit/4c28d726d50493ed3967c1a7eb84392442dfbeb9), [`e308deb`](https://github.com/LedgerHQ/ledger-live/commit/e308deb3e4f812f01166de17bb28c587a290b9bb), [`01ee590`](https://github.com/LedgerHQ/ledger-live/commit/01ee5909821c32b21577295f03f57a970e8fad2f), [`db3bde1`](https://github.com/LedgerHQ/ledger-live/commit/db3bde1a0ea2435389260b012d9759dd26f7b174), [`e7996b4`](https://github.com/LedgerHQ/ledger-live/commit/e7996b4bb9f13726af09cc5202d26d1e471563ef), [`5f07a43`](https://github.com/LedgerHQ/ledger-live/commit/5f07a4399d54e6ebccb953045324d8ec5b571ad3), [`ca82e70`](https://github.com/LedgerHQ/ledger-live/commit/ca82e703691d6e9716b522180d402d7eed9abc5f), [`0f401bb`](https://github.com/LedgerHQ/ledger-live/commit/0f401bb6289b6e78fbd05b6f98977bde4999d22a), [`3347eb8`](https://github.com/LedgerHQ/ledger-live/commit/3347eb88f282e2286b43493dadb0a9dd3d1f81d5), [`21ab07f`](https://github.com/LedgerHQ/ledger-live/commit/21ab07f8912d9c7fa9fb7e438e4e7873ca674f02), [`9ddaa97`](https://github.com/LedgerHQ/ledger-live/commit/9ddaa970d609f4b54f0cdbbda0609242cca54cf7), [`e80d009`](https://github.com/LedgerHQ/ledger-live/commit/e80d009b57fbec125c43649fcc0b21edc60cb473), [`fa2c070`](https://github.com/LedgerHQ/ledger-live/commit/fa2c070913fb13e530c65d901151c2766c46caf6), [`d1eeaab`](https://github.com/LedgerHQ/ledger-live/commit/d1eeaabf43a54a3d2c4796ea1c5b11a0b9202814), [`eb23867`](https://github.com/LedgerHQ/ledger-live/commit/eb23867603dc4e80723cdfe5486c28bc88d57014), [`90e805d`](https://github.com/LedgerHQ/ledger-live/commit/90e805d9c1b0ef536d1e53489c73b88056731993), [`ff5e1b0`](https://github.com/LedgerHQ/ledger-live/commit/ff5e1b0f5a315aaccd3e23aeb8ccd2c7d48730f4), [`f5fa6e1`](https://github.com/LedgerHQ/ledger-live/commit/f5fa6e18fe429074cda26578f8b0c4642927e0d6), [`7ff8f5b`](https://github.com/LedgerHQ/ledger-live/commit/7ff8f5b518a19e73005ef974121ce21e593a8e99), [`9c9cae5`](https://github.com/LedgerHQ/ledger-live/commit/9c9cae5ab492b74d52b13e0a5b0673bd681f8d9d), [`3a45eb3`](https://github.com/LedgerHQ/ledger-live/commit/3a45eb3e29f417f24570787e76d977cefa5090d9), [`29b0e0c`](https://github.com/LedgerHQ/ledger-live/commit/29b0e0c324494c21d82f5deb26f6774c3c5aca6f), [`0a65851`](https://github.com/LedgerHQ/ledger-live/commit/0a65851ea6de6228030a2c94f0cad2234903db2b), [`3444d16`](https://github.com/LedgerHQ/ledger-live/commit/3444d16d5159b6e415b4dd0ab4fedfbf4cbeb260), [`8783545`](https://github.com/LedgerHQ/ledger-live/commit/87835456704c2322a25339ef27ef92a320d02025), [`f3b3c1c`](https://github.com/LedgerHQ/ledger-live/commit/f3b3c1c8479c2ae12d6a57eef030b04b2e665483), [`dad0153`](https://github.com/LedgerHQ/ledger-live/commit/dad01537ce5e0263964adcfaf762246003c527b4), [`e3e6c22`](https://github.com/LedgerHQ/ledger-live/commit/e3e6c222ddba748a7e9e03e85f5919ce8e5c28bd), [`77e7162`](https://github.com/LedgerHQ/ledger-live/commit/77e716257785645b79027b580fcef2dfbab7ad3b), [`77e7162`](https://github.com/LedgerHQ/ledger-live/commit/77e716257785645b79027b580fcef2dfbab7ad3b), [`57921f9`](https://github.com/LedgerHQ/ledger-live/commit/57921f955b6c07389cb78d4c087c881667858dc2), [`1b78e74`](https://github.com/LedgerHQ/ledger-live/commit/1b78e7406cc6b871ebf50590a03f47848c1718a9), [`a99d63a`](https://github.com/LedgerHQ/ledger-live/commit/a99d63a75a8d02a14bdfef0eaaa249c3f92d1ced), [`4aa7793`](https://github.com/LedgerHQ/ledger-live/commit/4aa77939cec43fd1aac459689c372868dece3496), [`0e7d80a`](https://github.com/LedgerHQ/ledger-live/commit/0e7d80ad750683fd37a150fe36ef5add632072cd), [`5f7cc73`](https://github.com/LedgerHQ/ledger-live/commit/5f7cc73ec88df6e84e970818668adca6cf7e5fe2), [`eb65ce4`](https://github.com/LedgerHQ/ledger-live/commit/eb65ce49ea0fa2d2c44f79fd2b0f8de365ae5e53), [`aaedf56`](https://github.com/LedgerHQ/ledger-live/commit/aaedf5692e9c1407327d009fea8133e51ca48f26), [`c26bbea`](https://github.com/LedgerHQ/ledger-live/commit/c26bbea7477d27f6042657c3a3c48c05f85b1f59), [`667d378`](https://github.com/LedgerHQ/ledger-live/commit/667d378b97e9102df009015e01fed6b49fd88b82), [`f45fc80`](https://github.com/LedgerHQ/ledger-live/commit/f45fc8027562e53cdbd3500a2884084df6a4af8e), [`1731458`](https://github.com/LedgerHQ/ledger-live/commit/17314582789efaad9ba35a5cf5e434a3140d6132), [`4dec481`](https://github.com/LedgerHQ/ledger-live/commit/4dec481cf274c6db74c334e5a74df574a8d04f54), [`b2792d8`](https://github.com/LedgerHQ/ledger-live/commit/b2792d8806411c2a35e1622109bee830c44a6cbc), [`6f2ecf8`](https://github.com/LedgerHQ/ledger-live/commit/6f2ecf89dd1d978038f573738d6e85fe1805b5d9), [`18166fb`](https://github.com/LedgerHQ/ledger-live/commit/18166fbe8719d50c911aa0ab349e68c414f8fc62), [`1a9b21e`](https://github.com/LedgerHQ/ledger-live/commit/1a9b21e6cc971d5e5b069cab968826b15332024b), [`dce4fb6`](https://github.com/LedgerHQ/ledger-live/commit/dce4fb6a4ec291153cc5b4d5a0d5000f777007e1), [`6c8bd31`](https://github.com/LedgerHQ/ledger-live/commit/6c8bd31900a6b6aa8987cc82f6d907bbc3611fc1), [`bed3cf9`](https://github.com/LedgerHQ/ledger-live/commit/bed3cf9bd880e00d51fc90849dca3741b9ab779f), [`91ad9a0`](https://github.com/LedgerHQ/ledger-live/commit/91ad9a0e481e3935f80089a800293a4733aef450), [`2b2eee6`](https://github.com/LedgerHQ/ledger-live/commit/2b2eee6a4abfb86615f3e5a628f518b5a9c58dad), [`b99f923`](https://github.com/LedgerHQ/ledger-live/commit/b99f923997846b785c348006c5b434104c04f4a2), [`9717369`](https://github.com/LedgerHQ/ledger-live/commit/97173699dce7021d1c78713a72c4d79406324877), [`63c700c`](https://github.com/LedgerHQ/ledger-live/commit/63c700c28652b8a48e4ef57a6b73380b12434e61), [`8737f89`](https://github.com/LedgerHQ/ledger-live/commit/8737f89e2b515ab518cbcdeacc064641c6f595be), [`42d4dc2`](https://github.com/LedgerHQ/ledger-live/commit/42d4dc25044dceb9936c1907fb5ea0838fa0a64b), [`6d744e0`](https://github.com/LedgerHQ/ledger-live/commit/6d744e0d30b4480282d35c359d096f3f6d6602af), [`35d9396`](https://github.com/LedgerHQ/ledger-live/commit/35d9396f690292ae8efda27b24ac4143f03cd00b), [`c92c32e`](https://github.com/LedgerHQ/ledger-live/commit/c92c32e66d20de8a85454bf1fc444dadd3a51e76), [`77d202b`](https://github.com/LedgerHQ/ledger-live/commit/77d202b1930715ed30b62521fbc5692969b6ec47), [`9a39ad5`](https://github.com/LedgerHQ/ledger-live/commit/9a39ad5eeeaefff74791ec01db8c62c102b6e54a), [`69284e8`](https://github.com/LedgerHQ/ledger-live/commit/69284e8fff6db3afdf4b0c05254214baa8e4762b), [`bcd25fd`](https://github.com/LedgerHQ/ledger-live/commit/bcd25fd87bda9e7e8b7c3ee2a243d3e241adc0b0), [`91ac227`](https://github.com/LedgerHQ/ledger-live/commit/91ac22740fbf677ca481382eb55d2e4e12336d2a), [`99b54cd`](https://github.com/LedgerHQ/ledger-live/commit/99b54cdac46807286d75caa1a94e61a37606c18f), [`f482212`](https://github.com/LedgerHQ/ledger-live/commit/f48221278738b5b3accf7199c23e6dd84c48c27e), [`3cdcba9`](https://github.com/LedgerHQ/ledger-live/commit/3cdcba9252780b413452cb100682cf08041d966e), [`3a45eb3`](https://github.com/LedgerHQ/ledger-live/commit/3a45eb3e29f417f24570787e76d977cefa5090d9), [`8312d68`](https://github.com/LedgerHQ/ledger-live/commit/8312d6818aa5fa37f523352f81f51a61dd502bf2), [`c5c2815`](https://github.com/LedgerHQ/ledger-live/commit/c5c2815ec53dbf88804e558952f1451f13c37bb4), [`33094bc`](https://github.com/LedgerHQ/ledger-live/commit/33094bc31d9d8cd7a80b8eae3cf2b4afe3afa500)]:
  - @ledgerhq/transaction-observability@0.5.0-next.0
  - @ledgerhq/coin-stacks@0.33.0-next.0
  - @domain/entity-contact@0.12.0-next.0
  - @features/platform-contacts@0.10.0-next.0
  - @shared/clipboard@0.1.0-next.0
  - @features/flow-pay-card-transactions@0.5.0-next.0
  - @features/flow-contacts@0.14.0-next.0
  - @features/flow-pay-request@0.8.0-next.0
  - @shared/feature-flags@0.26.0-next.0
  - @features/flow-contacts-introduction@1.4.0-next.0
  - @features/flow-pay-contact@0.6.0-next.0
  - @features/flow-pay-balance@0.7.0-next.0
  - @ledgerhq/coin-bitcoin@0.55.0-next.0
  - @domain/entity-currency-crypto@0.15.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.7.0-next.0
  - @domain/api-market-countervalues@0.2.0-next.0
  - @domain/entity-market-countervalues@0.3.0-next.0
  - @shared/api-services@0.10.0-next.0
  - @features/platform-app-lock@0.6.0-next.0
  - @features/flow-app-longer-password@0.1.0-next.0
  - @features/flow-app-password-removal@0.1.0-next.0
  - @features/flow-app-password-setup@0.1.0-next.0
  - @features/flow-app-protection-prompt@0.1.0-next.0
  - @features/flow-app-unlock@0.1.0-next.0
  - @ledgerhq/types-live@6.127.0-next.0
  - @shared/env@0.10.0-next.0
  - @ledgerhq/live-dmk-shared@0.35.0-next.0
  - @ledgerhq/native-ui@0.68.0-next.0
  - @ledgerhq/device-onboarding@0.5.0-next.0
  - @ledgerhq/coin-canton@1.4.0-next.0
  - @features/platform-card@0.8.0-next.0
  - @features/flow-pay-card-auth@0.10.0-next.0
  - @features/platform-content-ab-tests@0.2.0-next.0
  - @ledgerhq/coin-cosmos@1.6.0-next.0
  - @features/platform-market-countervalues@0.2.0-next.0
  - @ledgerhq/wallet-pnl@0.8.0-next.0
  - @domain/entity-client-identity@0.3.0-next.0
  - @features/platform-feature-flags-firebase@0.1.0-next.0
  - @features/platform-feature-flags@0.9.0-next.0
  - @domain/api-aggregated-assets@0.6.0-next.0
  - @features/flow-pay-feature-tour@0.8.0-next.0
  - @ledgerhq/live-dmk-mobile@0.31.0-next.0
  - @devtools/bindings@0.11.0-next.0
  - @features/flow-pay-card-details@0.7.0-next.0
  - @features/flow-pay-card@0.7.0-next.0
  - @ledgerhq/coin-multiversx@1.4.0-next.0
  - @features/platform-device-action-content@0.4.0-next.0
  - @ledgerhq/coin-filecoin@2.4.0-next.0
  - @ledgerhq/live-send@0.1.3-next.0
  - @features/flow-contacts-add-address@0.6.2-next.0
  - @features/flow-contacts-add-contact@0.7.2-next.0
  - @features/flow-contacts-delete-contact@0.2.5-next.0
  - @features/flow-contacts-edit-address@0.4.2-next.0
  - @features/flow-contacts-edit-contact@0.6.2-next.0
  - @features/flow-contacts-list@0.9.1-next.0
  - @ledgerhq/live-wallet@1.1.6-next.0
  - @features/flow-pay-card-assets@0.3.1-next.0
  - @features/flow-large-screen-upsell@2.2.2-next.0
  - @features/platform-currencies@0.9.2-next.0
  - @domain/api-currency-token@0.6.4-next.0
  - @domain/entity-currency@0.4.6-next.0
  - @domain/entity-currency-token@0.5.5-next.0
  - @ledgerhq/wallet-analytics@0.5.1-next.0
  - @ledgerhq/coin-casper@3.5.1-next.0
  - @ledgerhq/coin-concordium@1.5.1-next.0
  - @ledgerhq/live-signer-evm@0.24.1-next.0
  - @domain/api-card-management@0.8.1-next.0
  - @domain/api-currency-fiat@0.4.7-next.0
  - @domain/api-market-index-altcoin-season@0.4.1-next.0
  - @domain/api-market-index-fear-and-greed@0.4.1-next.0
  - @domain/api-push-devices@0.2.8-next.0
  - @ledgerhq/device-core@0.11.19-next.0
  - @features/platform-aggregated-assets@0.5.6-next.0
  - @features/platform-env@0.4.2-next.0
  - @ledgerhq/live-signer-tron@0.2.1-next.0
  - @features/flow-analytics-consent@0.2.9-next.0
  - @shared/analytics@0.4.0
  - @shared/analytics-react@0.4.0
  - @shared/auth@0.6.0
  - @shared/cloud-sync@0.3.0
  - @shared/i18n@0.2.0
  - @shared/linking@0.3.0
  - @shared/lottie@0.0.0
  - @shared/network-status@0.0.0
  - @shared/ui-info-state@0.4.0
  - @shared/ui-queued-bottom-sheet@0.6.0
  - @features/flow-pay-card-widget@0.5.1-next.0
  - @devtools/wire@0.5.1
  - @domain/entity-account@0.0.1
  - @domain/entity-account-name@0.2.2
  - @domain/entity-analytics-consent@0.2.2
  - @domain/entity-card-asset-mapping@0.7.0
  - @domain/entity-currency-fiat@0.4.0
  - @domain/entity-currency-unit@0.3.0
  - @domain/entity-interest-rate@0.3.0
  - @domain/entity-market-index-altcoin-season@0.3.0
  - @domain/entity-market-index-fear-and-greed@0.3.0
  - @domain/entity-recent-addresses@0.2.1
  - @domain/entity-starred-account@0.0.1
  - @domain/entity-wallet-sync@0.1.0
  - @features/flow-fear-and-greed@0.3.0
  - @features/flow-lazy-onboarding-banner@0.4.0
  - @features/platform-device-intent@5.2.0
  - @features/platform-pay-analytics@0.3.0
  - @features/platform-style@0.4.0
  - @features/platform-wallet-sync@0.1.3
  - @ledgerhq/ethereum-provider@0.8.0
  - @ledgerhq/hw-transport-http@6.38.0
  - @ledgerhq/live-dmk-speculos@0.11.0
  - @ledgerhq/live-engagement@0.1.0
  - @ledgerhq/types-devices@7.1.0
  - @devtools/shell@0.10.2-next.0

## 4.23.0

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

- [#22840](https://github.com/LedgerHQ/ledger-live/pull/22840) [`e4c24f3`](https://github.com/LedgerHQ/ledger-live/commit/e4c24f3ebd7fe5838a6639e70b10b12863088e10) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Name the default Me contact "Me" in the Pay tab contacts list instead of "My addresses (Me)"

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

- [#22788](https://github.com/LedgerHQ/ledger-live/pull/22788) [`3699ef4`](https://github.com/LedgerHQ/ledger-live/commit/3699ef4a5d48c99dcf9892324ef1ed6bc7cccdbc) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Hide the Pay tab card and its history when the pay-tab flag's card param is false

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

- [#22908](https://github.com/LedgerHQ/ledger-live/pull/22908) [`23ee31c`](https://github.com/LedgerHQ/ledger-live/commit/23ee31c0ebf892ea7924e18dc43ad947e7810782) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Pay card login: name Monavate instead of Baanx in "Log in to" and "Card provided by".

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

- [#22889](https://github.com/LedgerHQ/ledger-live/pull/22889) [`fe55ea3`](https://github.com/LedgerHQ/ledger-live/commit/fe55ea349a8227d398bd570e68a8756392a4dd21) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add feature-flag scenarios for the native Pay card, Card live app login, and CL Card disclaimer

- [#22402](https://github.com/LedgerHQ/ledger-live/pull/22402) [`dccea32`](https://github.com/LedgerHQ/ledger-live/commit/dccea322ed808abfa4e6829364fe945cd0a58383) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Polish the Pay tab: keep the last row of every Pay bottom sheet clear of the Android navigation bar and the iOS home indicator, size the card action buttons to `md`, make the desktop contacts table responsive with a wider name column, wrap the address-picker title, add 32px of scroll padding, widen the history tabs, fix the disclaimer copy and use the shield icon on verify address

- [#22478](https://github.com/LedgerHQ/ledger-live/pull/22478) [`006991d`](https://github.com/LedgerHQ/ledger-live/commit/006991d2a5c7ea7431cb66d13a972c4aafd90258) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Align the Pay tab with the Home screen: its background fades out on scroll, and the balance and action tiles use the same hero spacing as Home. The Home, Pay, Swap and Earn tabs now share one Reanimated-based background.

- [#22031](https://github.com/LedgerHQ/ledger-live/pull/22031) [`f28215d`](https://github.com/LedgerHQ/ledger-live/commit/f28215d4b314c2a2dd32b5f2355aacc4776ee1f5) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Reserve height for the Perps deposit quoted-amount and status rows so the form no longer jumps when switching between the provider notice, the quote, and the error message

- [#22033](https://github.com/LedgerHQ/ledger-live/pull/22033) [`db7b972`](https://github.com/LedgerHQ/ledger-live/commit/db7b972bd6328a2bd215a7adec3bd5353a727a81) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Keep the entered Perps deposit amount when switching the funding asset/account instead of resetting it

- [#22488](https://github.com/LedgerHQ/ledger-live/pull/22488) [`1302bc7`](https://github.com/LedgerHQ/ledger-live/commit/1302bc7968a7d3bf9cd3d556057b662444b22608) Thanks [@LL782](https://github.com/LL782)! - Replace mutable analytics screen refs with a function-only tracking-page API.

- [#22550](https://github.com/LedgerHQ/ledger-live/pull/22550) [`86dbc48`](https://github.com/LedgerHQ/ledger-live/commit/86dbc48147fa1a16aa79c81f844ffe5117b29494) Thanks [@alexstapenka-ledger](https://github.com/alexstapenka-ledger)! - Add the `ptxEarnCtaOnMobile` feature flag and send it to Mixpanel as a boolean identify trait. Earn reads it via Wallet API.

- [#22549](https://github.com/LedgerHQ/ledger-live/pull/22549) [`24e881b`](https://github.com/LedgerHQ/ledger-live/commit/24e881b41d4199d9cf257a7450d139aa5f076a1d) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Hide Pay and card history amounts when discreet mode is enabled, and toggle it from the Pay balance

- [#22501](https://github.com/LedgerHQ/ledger-live/pull/22501) [`909c761`](https://github.com/LedgerHQ/ledger-live/commit/909c761357291f48ac0266d91d6ed563aa4ad833) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Fix a bottom sheet reopening right after being swiped down before its entrance animation finished. Only a dismissal started for a previous presentation now puts the sheet back on screen.

- [#22767](https://github.com/LedgerHQ/ledger-live/pull/22767) [`8947c0b`](https://github.com/LedgerHQ/ledger-live/commit/8947c0b97fa0d5abd017d880bfc3089a74d9cc77) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Show a setup state on the History card tab when the signed-in holder has not claimed a card yet.

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

- Updated dependencies [[`b42673e`](https://github.com/LedgerHQ/ledger-live/commit/b42673eed68aba6b2885486d7294f5f9163f721d), [`e8d72da`](https://github.com/LedgerHQ/ledger-live/commit/e8d72dad9cd8aca2bf11b1768d10f2c7553e4cba), [`2d869a5`](https://github.com/LedgerHQ/ledger-live/commit/2d869a596a4562a00003de01cc657d7277dc6b7c), [`d5dfa07`](https://github.com/LedgerHQ/ledger-live/commit/d5dfa072c9a724609119c06622004d76a45414d9), [`4fc2063`](https://github.com/LedgerHQ/ledger-live/commit/4fc2063b0e49a445ebb660f750214e69d5c4355a), [`e4c24f3`](https://github.com/LedgerHQ/ledger-live/commit/e4c24f3ebd7fe5838a6639e70b10b12863088e10), [`c5964f8`](https://github.com/LedgerHQ/ledger-live/commit/c5964f8c6348028d97832dd46cd8554d813d48db), [`370f955`](https://github.com/LedgerHQ/ledger-live/commit/370f95583baf604e3d0e9db3c7c7dadbc6a0c608), [`5f34cb6`](https://github.com/LedgerHQ/ledger-live/commit/5f34cb6848f92e1b520a474a2b779caad6f88804), [`e012138`](https://github.com/LedgerHQ/ledger-live/commit/e012138a1531a651ae62515bed2cada9dbfcfa8c), [`2074967`](https://github.com/LedgerHQ/ledger-live/commit/2074967c2c084e05de67597ae353c783b0b10f92), [`1647f38`](https://github.com/LedgerHQ/ledger-live/commit/1647f38343baf93fbe8333d9abec403797489859), [`8b387f4`](https://github.com/LedgerHQ/ledger-live/commit/8b387f4d1db967288af2f982a78949e0615ebc7e), [`e8d5e1b`](https://github.com/LedgerHQ/ledger-live/commit/e8d5e1bf6eec2a47072ad59762064b24a89701cf), [`c95a00f`](https://github.com/LedgerHQ/ledger-live/commit/c95a00f06cf5e8891e843c0a2cdc17e6d97c85f1), [`3e7af98`](https://github.com/LedgerHQ/ledger-live/commit/3e7af98196476c04a97522109fded33cc17dc868), [`26e51d9`](https://github.com/LedgerHQ/ledger-live/commit/26e51d98fde1c080e09f566e0dbeb4f2c2e9f382), [`eddfcd4`](https://github.com/LedgerHQ/ledger-live/commit/eddfcd47ba49d55715ed9dc7a619867cd5a636d5), [`6a5972d`](https://github.com/LedgerHQ/ledger-live/commit/6a5972df49e243bbb36cd973e405302d0d8925bc), [`3e7bbe9`](https://github.com/LedgerHQ/ledger-live/commit/3e7bbe93f6075a2a6783e05d36459c166366c910), [`c32cde3`](https://github.com/LedgerHQ/ledger-live/commit/c32cde31461523c72df4f67cd18288c6f65c9951), [`ad2f1de`](https://github.com/LedgerHQ/ledger-live/commit/ad2f1deb73d1fd6fed1383133a7f2b259630cd06), [`cee85b4`](https://github.com/LedgerHQ/ledger-live/commit/cee85b47d7d1f414e23935e77c9ad22d98ddf994), [`6baab2e`](https://github.com/LedgerHQ/ledger-live/commit/6baab2e7989b00bec4c361cee3535f76cb919915), [`cfb7566`](https://github.com/LedgerHQ/ledger-live/commit/cfb756682290e9940d65f3b6417d6b111449e546), [`bc28500`](https://github.com/LedgerHQ/ledger-live/commit/bc2850004d7cbc59aac8093b3739bfcc351daf43), [`4d84f2b`](https://github.com/LedgerHQ/ledger-live/commit/4d84f2b23f3bc04c06770e390e22cd4e35ee3fe3), [`5adf8f3`](https://github.com/LedgerHQ/ledger-live/commit/5adf8f3b844e21895aa17f96a620a2dfa6b679ad), [`6e76dda`](https://github.com/LedgerHQ/ledger-live/commit/6e76ddac6370bb60b17971679a857fae7ca83eb9), [`486a1a4`](https://github.com/LedgerHQ/ledger-live/commit/486a1a45027e8104ae824d77bd34b298788c9b04), [`f7cd861`](https://github.com/LedgerHQ/ledger-live/commit/f7cd8616265d3f94fef24332626402efe39eb83f), [`f1d8aac`](https://github.com/LedgerHQ/ledger-live/commit/f1d8aac1c7c0bc0be9beb1508c1a9ef3cf7affae), [`33b4952`](https://github.com/LedgerHQ/ledger-live/commit/33b4952ef04d4e0528d2735ba299b4a8073e447e), [`e9af9cb`](https://github.com/LedgerHQ/ledger-live/commit/e9af9cb415b3ba4038d13ffc2dca7edb0432c830), [`d6866e7`](https://github.com/LedgerHQ/ledger-live/commit/d6866e7dc7ced8898ac585d4e34d9667d9ad7f17), [`f8c92f9`](https://github.com/LedgerHQ/ledger-live/commit/f8c92f9300d4b8268949ed7aff5a6781ed7f60a8), [`7fd570c`](https://github.com/LedgerHQ/ledger-live/commit/7fd570cd3868a675dad0d77136734eab63f11bd1), [`e046686`](https://github.com/LedgerHQ/ledger-live/commit/e046686befa308188170ac9950eae394863c76a5), [`739334b`](https://github.com/LedgerHQ/ledger-live/commit/739334b0d854a3b11d9a2b6ba47ce022dc0797d9), [`b4599a5`](https://github.com/LedgerHQ/ledger-live/commit/b4599a58f817aa233be256d6f755a0fd4d0fc8a5), [`8475c70`](https://github.com/LedgerHQ/ledger-live/commit/8475c704ed5cc75bcfddc9789130281ad0c2aca5), [`381bd0b`](https://github.com/LedgerHQ/ledger-live/commit/381bd0befb6a09f20f13f65c233f0e1479e7051d), [`dfd53ad`](https://github.com/LedgerHQ/ledger-live/commit/dfd53adbf0815e2a62f59c1e996bd709bd710ea0), [`c63d0fa`](https://github.com/LedgerHQ/ledger-live/commit/c63d0fa3ad6f181beb5d8ea7b2ef474d82fd1ed7), [`9e54487`](https://github.com/LedgerHQ/ledger-live/commit/9e5448750d57eb92f95ef828b55d80eedd826323), [`83fac3e`](https://github.com/LedgerHQ/ledger-live/commit/83fac3e00782840d1f118180dfb9afb9a484952c), [`56640ba`](https://github.com/LedgerHQ/ledger-live/commit/56640ba2c03cec8555f7452da785c8dd949ec010), [`b6a9b53`](https://github.com/LedgerHQ/ledger-live/commit/b6a9b531267360fdca64b8db22dd8781aa414dd9), [`68f4179`](https://github.com/LedgerHQ/ledger-live/commit/68f41798cae68cd1b91f291d5447514b80fd6f49), [`8ecbe06`](https://github.com/LedgerHQ/ledger-live/commit/8ecbe0676b614fed535900aa6085ddebabc8d85c), [`46f0f94`](https://github.com/LedgerHQ/ledger-live/commit/46f0f9447e12faa953268bf2a19fbdfd85a43da9), [`ea90542`](https://github.com/LedgerHQ/ledger-live/commit/ea90542540f47a76c18cf5f440bb98b9be71c837), [`e8518d7`](https://github.com/LedgerHQ/ledger-live/commit/e8518d7f0b88096552c6a8f74ffe5752bc517a39), [`56640ba`](https://github.com/LedgerHQ/ledger-live/commit/56640ba2c03cec8555f7452da785c8dd949ec010), [`5ff6348`](https://github.com/LedgerHQ/ledger-live/commit/5ff6348d1505e805bdbbff64685b0b97bc2a8981), [`3b5a959`](https://github.com/LedgerHQ/ledger-live/commit/3b5a959ffd24bc06a91bb608924c0575d62eb753), [`41eca65`](https://github.com/LedgerHQ/ledger-live/commit/41eca657432071ba1d22029b79be85ca3eff6a94), [`912b087`](https://github.com/LedgerHQ/ledger-live/commit/912b0877538bd06cc7187b90e2eab8182fe55034), [`defb949`](https://github.com/LedgerHQ/ledger-live/commit/defb949c02d9d0d935882eb8e8617d000e18b163), [`70d0b90`](https://github.com/LedgerHQ/ledger-live/commit/70d0b90b67ff013f19318378c78a3f3d442f773b), [`887561b`](https://github.com/LedgerHQ/ledger-live/commit/887561bb56c7bbe4c5ff3d62a3309ce3d449a72c), [`aee5fe8`](https://github.com/LedgerHQ/ledger-live/commit/aee5fe897519c1bc39f0d4891bbc1ee4a7aaaaa1), [`3d41eab`](https://github.com/LedgerHQ/ledger-live/commit/3d41eab30728e94a21c53d4d4d9fe6eec27a5ce1), [`ae229f2`](https://github.com/LedgerHQ/ledger-live/commit/ae229f27b250d6bdd06af1b06a2912a8c556a27c), [`3fdebf4`](https://github.com/LedgerHQ/ledger-live/commit/3fdebf4a84f5630192e50aef9a0a60b0c56f6a2f), [`3b95cbb`](https://github.com/LedgerHQ/ledger-live/commit/3b95cbb5968a4484966233313ca8e2781b720ae8), [`973a613`](https://github.com/LedgerHQ/ledger-live/commit/973a6136087e8e78eeffd0e761ed3828f9f81691), [`a39ba90`](https://github.com/LedgerHQ/ledger-live/commit/a39ba900d889155ebc4fe2cab88f82a715e3f605), [`fc6f187`](https://github.com/LedgerHQ/ledger-live/commit/fc6f1878bb1fa7f0c87c18478abbb194c6edee0d), [`6fa8121`](https://github.com/LedgerHQ/ledger-live/commit/6fa81215cdeade45495994d5dc7dc0477c097e2c), [`b2c3742`](https://github.com/LedgerHQ/ledger-live/commit/b2c3742dabf62702a85c8710421bce8ae80dc1fd), [`fe55ea3`](https://github.com/LedgerHQ/ledger-live/commit/fe55ea349a8227d398bd570e68a8756392a4dd21), [`dccea32`](https://github.com/LedgerHQ/ledger-live/commit/dccea322ed808abfa4e6829364fe945cd0a58383), [`006991d`](https://github.com/LedgerHQ/ledger-live/commit/006991d2a5c7ea7431cb66d13a972c4aafd90258), [`a025d7a`](https://github.com/LedgerHQ/ledger-live/commit/a025d7a872b7b1e4681d16b2bfb54f8949bf6626), [`1302bc7`](https://github.com/LedgerHQ/ledger-live/commit/1302bc7968a7d3bf9cd3d556057b662444b22608), [`86dbc48`](https://github.com/LedgerHQ/ledger-live/commit/86dbc48147fa1a16aa79c81f844ffe5117b29494), [`24e881b`](https://github.com/LedgerHQ/ledger-live/commit/24e881b41d4199d9cf257a7450d139aa5f076a1d), [`909c761`](https://github.com/LedgerHQ/ledger-live/commit/909c761357291f48ac0266d91d6ed563aa4ad833), [`8947c0b`](https://github.com/LedgerHQ/ledger-live/commit/8947c0b97fa0d5abd017d880bfc3089a74d9cc77), [`b8a4056`](https://github.com/LedgerHQ/ledger-live/commit/b8a405658b70b0ca43ec94bff53c5d13e2c16487), [`9cafda0`](https://github.com/LedgerHQ/ledger-live/commit/9cafda098001d1912b872e341c4568386b70ed75), [`b4a23ea`](https://github.com/LedgerHQ/ledger-live/commit/b4a23ea27edbc4a3e8aeaee1da6f0e7aecefab92), [`a896fca`](https://github.com/LedgerHQ/ledger-live/commit/a896fca1974a46f10e915d1212e0947e2d808ad5), [`87de096`](https://github.com/LedgerHQ/ledger-live/commit/87de096183309fa2152abe838f09a537b681e8eb), [`cdcb834`](https://github.com/LedgerHQ/ledger-live/commit/cdcb83446d2a70c910fee7cded0b03f3ab325b30), [`4f0fdc3`](https://github.com/LedgerHQ/ledger-live/commit/4f0fdc3d78ac46e4396106eaf10e20ca6c0ed3cf), [`3fdfcc0`](https://github.com/LedgerHQ/ledger-live/commit/3fdfcc07ffb1d8e0b5ef39c830a5e7204ced77e3), [`93e6db2`](https://github.com/LedgerHQ/ledger-live/commit/93e6db2db85721b483173e781db9f53db3699715), [`8a305ed`](https://github.com/LedgerHQ/ledger-live/commit/8a305edb307d0a4cd30ad615ccd98ef5d7caf523), [`c020110`](https://github.com/LedgerHQ/ledger-live/commit/c02011033bf5ca5bf38f05c487adb3a27c209a7d), [`0e98a58`](https://github.com/LedgerHQ/ledger-live/commit/0e98a58c4f313f55c088be010a360c6d85ea7d43), [`c119e0d`](https://github.com/LedgerHQ/ledger-live/commit/c119e0d38f626314cf679bfa06420ce0e4bca03b), [`e19e6cf`](https://github.com/LedgerHQ/ledger-live/commit/e19e6cf36074363d22085b6c85c54ef964eb382c), [`8c486aa`](https://github.com/LedgerHQ/ledger-live/commit/8c486aabe3dbd100b21e43d3f344fda5142858ed), [`88bae04`](https://github.com/LedgerHQ/ledger-live/commit/88bae04e2f7e7a3de8d55c340fe32b48e37bd78d), [`df5d8c9`](https://github.com/LedgerHQ/ledger-live/commit/df5d8c96892094fc6faf06992f415e88ff64b5c8), [`f7ba21f`](https://github.com/LedgerHQ/ledger-live/commit/f7ba21f7df883e71102a0949c8a3d23e20fb4cbd), [`62cc42f`](https://github.com/LedgerHQ/ledger-live/commit/62cc42f32d041e0e1081e7fdaca04169581429ec)]:
  - @domain/api-card-management@0.8.0
  - @features/flow-pay-card-details@0.6.0
  - @features/platform-pay-analytics@0.3.0
  - @features/flow-contacts-list@0.9.0
  - @ledgerhq/types-live@6.126.0
  - @domain/entity-contact@0.11.0
  - @features/flow-contacts-introduction@1.3.0
  - @features/flow-pay-contact@0.5.0
  - @domain/api-market-index-fear-and-greed@0.4.0
  - @features/flow-app-lock@0.6.0
  - @features/platform-app-lock@0.5.0
  - @shared/ui-info-state@0.4.0
  - @ledgerhq/live-dmk-shared@0.34.0
  - @ledgerhq/live-dmk-mobile@0.30.0
  - @ledgerhq/live-signer-evm@0.24.0
  - @ledgerhq/device-onboarding@0.4.0
  - @ledgerhq/coin-casper@3.5.0
  - @features/platform-device-action-content@0.3.0
  - @features/flow-contacts@0.13.0
  - @features/flow-pay-card-assets@0.3.0
  - @shared/ui-queued-bottom-sheet@0.6.0
  - @features/flow-pay-balance@0.6.0
  - @features/flow-pay-card-transactions@0.4.0
  - @features/platform-card@0.7.0
  - @features/flow-pay-card-auth@0.9.0
  - @features/flow-pay-card@0.6.0
  - @features/flow-pay-card-widget@0.5.0
  - @shared/feature-flags@0.25.0
  - @shared/env@0.9.0
  - @features/platform-contacts@0.9.0
  - @ledgerhq/wallet-analytics@0.5.0
  - @ledgerhq/ledger-wallet-framework@3.6.0
  - @domain/entity-currency-crypto@0.14.0
  - @ledgerhq/coin-bitcoin@0.54.0
  - @ledgerhq/live-signer-tron@0.2.0
  - @ledgerhq/transaction-observability@0.4.0
  - @ledgerhq/coin-cosmos@1.5.0
  - @features/flow-pay-feature-tour@0.7.0
  - @features/flow-pay-request@0.7.0
  - @domain/entity-market-index-altcoin-season@0.3.0
  - @ledgerhq/coin-canton@1.3.0
  - @ledgerhq/coin-concordium@1.5.0
  - @ledgerhq/coin-filecoin@2.3.0
  - @ledgerhq/coin-multiversx@1.3.0
  - @ledgerhq/coin-stacks@0.32.0
  - @features/flow-pay-bank-transfer@0.4.0
  - @features/flow-pay-deposit@0.5.0
  - @devtools/bindings@0.10.0
  - @shared/analytics@0.4.0
  - @domain/api-market-index-altcoin-season@0.4.0
  - @domain/entity-market-index-fear-and-greed@0.3.0
  - @shared/analytics-react@0.4.0
  - @shared/api-services@0.9.0
  - @ledgerhq/device-core@0.11.18
  - @ledgerhq/live-countervalues-react@0.18.2
  - @ledgerhq/live-send@0.1.2
  - @ledgerhq/live-wallet@1.1.5
  - @ledgerhq/wallet-pnl@0.7.13
  - @features/flow-contacts-add-address@0.6.1
  - @features/flow-contacts-add-contact@0.7.1
  - @features/flow-contacts-delete-contact@0.2.4
  - @features/flow-contacts-edit-address@0.4.1
  - @features/flow-contacts-edit-contact@0.6.1
  - @features/flow-large-screen-upsell@2.2.1
  - @features/platform-currencies@0.9.1
  - @features/platform-feature-flags@0.8.1
  - @domain/api-aggregated-assets@0.5.3
  - @features/platform-aggregated-assets@0.5.5
  - @features/platform-env@0.4.1
  - @ledgerhq/live-countervalues@0.26.2
  - @domain/api-currency-token@0.6.3
  - @domain/entity-currency@0.4.5
  - @domain/entity-currency-token@0.5.4
  - @domain/api-currency-fiat@0.4.6
  - @domain/api-push-devices@0.2.7
  - @devtools/shell@0.10.1
  - @features/flow-analytics-consent@0.2.8

## 4.23.0-next.9

### Patch Changes

- Updated dependencies [[`5ff6348`](https://github.com/LedgerHQ/ledger-live/commit/5ff6348d1505e805bdbbff64685b0b97bc2a8981)]:
  - @features/flow-pay-card-auth@0.9.0-next.3
  - @devtools/bindings@0.10.0-next.4
  - @features/flow-pay-card@0.6.0-next.4
  - @features/flow-pay-card-assets@0.3.0-next.4
  - @features/flow-pay-card-details@0.6.0-next.4
  - @features/flow-pay-card-transactions@0.4.0-next.4

## 4.23.0-next.8

### Minor Changes

- [#22908](https://github.com/LedgerHQ/ledger-live/pull/22908) [`23ee31c`](https://github.com/LedgerHQ/ledger-live/commit/23ee31c0ebf892ea7924e18dc43ad947e7810782) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Pay card login: name Monavate instead of Baanx in "Log in to" and "Card provided by".

- [#22889](https://github.com/LedgerHQ/ledger-live/pull/22889) [`fe55ea3`](https://github.com/LedgerHQ/ledger-live/commit/fe55ea349a8227d398bd570e68a8756392a4dd21) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add feature-flag scenarios for the native Pay card, Card live app login, and CL Card disclaimer

### Patch Changes

- Updated dependencies [[`56640ba`](https://github.com/LedgerHQ/ledger-live/commit/56640ba2c03cec8555f7452da785c8dd949ec010), [`56640ba`](https://github.com/LedgerHQ/ledger-live/commit/56640ba2c03cec8555f7452da785c8dd949ec010), [`3b5a959`](https://github.com/LedgerHQ/ledger-live/commit/3b5a959ffd24bc06a91bb608924c0575d62eb753), [`fe55ea3`](https://github.com/LedgerHQ/ledger-live/commit/fe55ea349a8227d398bd570e68a8756392a4dd21)]:
  - @features/flow-pay-balance@0.6.0-next.1
  - @features/flow-pay-card-auth@0.9.0-next.2
  - @devtools/bindings@0.10.0-next.3
  - @features/flow-pay-card@0.6.0-next.3
  - @features/flow-pay-feature-tour@0.7.0-next.2
  - @shared/feature-flags@0.25.0-next.1
  - @features/flow-pay-card-assets@0.3.0-next.3
  - @features/flow-pay-card-details@0.6.0-next.3
  - @features/flow-pay-card-transactions@0.4.0-next.3
  - @features/flow-contacts-add-address@0.6.1-next.2
  - @features/flow-large-screen-upsell@2.2.1-next.1
  - @features/platform-contacts@0.9.0-next.2
  - @features/platform-currencies@0.9.1-next.1
  - @features/platform-feature-flags@0.8.1-next.1
  - @devtools/shell@0.10.1-next.1
  - @features/flow-contacts@0.13.0-next.3
  - @features/flow-contacts-add-contact@0.7.1-next.2
  - @features/flow-contacts-delete-contact@0.2.4-next.2
  - @features/flow-contacts-edit-address@0.4.1-next.2
  - @features/flow-contacts-edit-contact@0.6.1-next.2
  - @features/flow-contacts-list@0.9.0-next.2
  - @features/flow-pay-contact@0.5.0-next.4
  - @features/flow-analytics-consent@0.2.8-next.1
  - @ledgerhq/live-send@0.1.2-next.1

## 4.23.0-next.7

### Patch Changes

- Updated dependencies [[`739334b`](https://github.com/LedgerHQ/ledger-live/commit/739334b0d854a3b11d9a2b6ba47ce022dc0797d9)]:
  - @features/flow-pay-feature-tour@0.7.0-next.1
  - @devtools/bindings@0.10.0-next.2

## 4.23.0-next.6

### Minor Changes

- [#22840](https://github.com/LedgerHQ/ledger-live/pull/22840) [`e4c24f3`](https://github.com/LedgerHQ/ledger-live/commit/e4c24f3ebd7fe5838a6639e70b10b12863088e10) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Name the default Me contact "Me" in the Pay tab contacts list instead of "My addresses (Me)"

### Patch Changes

- Updated dependencies [[`e4c24f3`](https://github.com/LedgerHQ/ledger-live/commit/e4c24f3ebd7fe5838a6639e70b10b12863088e10)]:
  - @features/flow-pay-contact@0.5.0-next.3

## 4.23.0-next.5

### Patch Changes

- Updated dependencies [[`4fc2063`](https://github.com/LedgerHQ/ledger-live/commit/4fc2063b0e49a445ebb660f750214e69d5c4355a)]:
  - @features/flow-contacts-introduction@1.3.0-next.0
  - @features/flow-contacts@0.13.0-next.2
  - @features/flow-pay-contact@0.5.0-next.2

## 4.23.0-next.4

### Patch Changes

- Updated dependencies [[`cee85b4`](https://github.com/LedgerHQ/ledger-live/commit/cee85b47d7d1f414e23935e77c9ad22d98ddf994)]:
  - @features/platform-card@0.7.0-next.1
  - @features/flow-pay-card-auth@0.9.0-next.1
  - @devtools/bindings@0.10.0-next.1
  - @features/flow-pay-card@0.6.0-next.2
  - @features/flow-pay-card-assets@0.3.0-next.2
  - @features/flow-pay-card-details@0.6.0-next.2
  - @features/flow-pay-card-transactions@0.4.0-next.2

## 4.23.0-next.3

### Minor Changes

- [#22788](https://github.com/LedgerHQ/ledger-live/pull/22788) [`3699ef4`](https://github.com/LedgerHQ/ledger-live/commit/3699ef4a5d48c99dcf9892324ef1ed6bc7cccdbc) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Hide the Pay tab card and its history when the pay-tab flag's card param is false

## 4.23.0-next.2

### Minor Changes

- [#22767](https://github.com/LedgerHQ/ledger-live/pull/22767) [`8947c0b`](https://github.com/LedgerHQ/ledger-live/commit/8947c0b97fa0d5abd017d880bfc3089a74d9cc77) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Show a setup state on the History card tab when the signed-in holder has not claimed a card yet.

### Patch Changes

- Updated dependencies [[`8947c0b`](https://github.com/LedgerHQ/ledger-live/commit/8947c0b97fa0d5abd017d880bfc3089a74d9cc77)]:
  - @features/flow-pay-card-transactions@0.4.0-next.1
  - @features/flow-pay-card-details@0.6.0-next.1
  - @features/flow-pay-card@0.6.0-next.1
  - @features/flow-pay-card-assets@0.3.0-next.1

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

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->

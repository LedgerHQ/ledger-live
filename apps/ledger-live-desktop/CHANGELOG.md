# ledger-live-desktop

## 4.25.0

### Minor Changes

- [#23341](https://github.com/LedgerHQ/ledger-live/pull/23341) [`a86963c`](https://github.com/LedgerHQ/ledger-live/commit/a86963c2401573e3d5fef6b9623bae1e23126178) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the `accountDetail` feature flag (with `excludedCurrencyIds`) for the new Account Detail page and send its state to analytics.

- [#23367](https://github.com/LedgerHQ/ledger-live/pull/23367) [`bc0a9e1`](https://github.com/LedgerHQ/ledger-live/commit/bc0a9e149eef9dc38769df14dadc46ff115e7c1b) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the Account Detail page shell behind the `accountDetail` flag: `/account` routes switch per account to the new page (token sub-accounts redirect to their parent), the legacy page otherwise.

- [#23381](https://github.com/LedgerHQ/ledger-live/pull/23381) [`755532d`](https://github.com/LedgerHQ/ledger-live/commit/755532d67c3b03f886c08fe297bce61ccf8df5de) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the Account Detail header on LWD: back button, account name, shortened address with the network icon, and an "Account settings" button.

- [#23401](https://github.com/LedgerHQ/ledger-live/pull/23401) [`0c0f9b2`](https://github.com/LedgerHQ/ledger-live/commit/0c0f9b2634a979bd97df53ff8cc85a6a86f736f0) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the Account Detail settings dialog on LWD: the settings button opens the account settings menu and the remove account confirmation.

- [#23463](https://github.com/LedgerHQ/ledger-live/pull/23463) [`68c2837`](https://github.com/LedgerHQ/ledger-live/commit/68c2837d114092c6f421cfe5d5a97ce48d69667c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Change the account name from the LWD Account Detail settings dialog: new change name step (back to the menu, name field, Change name button), disabled while accounts are syncing.

- [#23486](https://github.com/LedgerHQ/ledger-live/pull/23486) [`ec7b8b9`](https://github.com/LedgerHQ/ledger-live/commit/ec7b8b9f1c0821ffb9973a174bc2f693719215ab) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Show the advanced logs from the LWD Account Detail settings dialog: new advanced logs step (back to the menu, derivation tip, sync date, account JSON, Copy logs with a Copied state).

- [#23496](https://github.com/LedgerHQ/ledger-live/pull/23496) [`914c8b7`](https://github.com/LedgerHQ/ledger-live/commit/914c8b74e3baeb9aaf9ac086ead5a6369d0fd5cf) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Show the assets of the account on the LWD Account Detail page: native coin and tokens with balance, value and trend, sorted by value. The assets table moves to `mvvm/components/AssetsTable` and can hide its price column.

- [#23412](https://github.com/LedgerHQ/ledger-live/pull/23412) [`7644e3f`](https://github.com/LedgerHQ/ledger-live/commit/7644e3fb6195adceaf9e2f6cb1f527cd0f5bc33b) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the Transactions section to the LWD Account Detail page: the 3 latest operations of the account and its tokens, opening the full history scoped to the account. The Asset Detail section now uses the same shared component.

- [#23322](https://github.com/LedgerHQ/ledger-live/pull/23322) [`1349df3`](https://github.com/LedgerHQ/ledger-live/commit/1349df3f6e9a27eeecc8495ca99a453341d7bf70) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Extract the Contact Detail journey into `@features/flow-contacts-detail` so Desktop and Mobile can reuse it, while the Contacts aggregate keeps cross-journey orchestration

- [#23004](https://github.com/LedgerHQ/ledger-live/pull/23004) [`505eea9`](https://github.com/LedgerHQ/ledger-live/commit/505eea91332a042c158fdca7a36ebeddff379da3) Thanks [@vpenskyi-ledger](https://github.com/vpenskyi-ledger)! - Fix a second account drawer opening in Swap when the receive token is a token the user does not hold yet. The parent account is now sent with `toTokenId` instead of the unresolvable synthetic token account, so the Swap live app builds the token account itself.

- [#23346](https://github.com/LedgerHQ/ledger-live/pull/23346) [`80a62ae`](https://github.com/LedgerHQ/ledger-live/commit/80a62ae9b54253c0059abf236ca486f8a6bbc9ca) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Show perps deposit device errors with the new error state and a retry.

- [#23195](https://github.com/LedgerHQ/ledger-live/pull/23195) [`490496e`](https://github.com/LedgerHQ/ledger-live/commit/490496e5eb52c62830b8e843c21c14662404b89e) Thanks [@cted-ledger](https://github.com/cted-ledger)! - zcash: the spendable-balance warning no longer quotes a wait time that changes with the block spacing

- [#23344](https://github.com/LedgerHQ/ledger-live/pull/23344) [`e15a91d`](https://github.com/LedgerHQ/ledger-live/commit/e15a91dca7d490f5c8d6d0dfdc8152a6f6e7ef0b) Thanks [@cted-ledger](https://github.com/cted-ledger)! - give zcash testnet accounts the zcash screens and shielded sync, by recognising every zcash currency rather than the mainnet id only

- [#23391](https://github.com/LedgerHQ/ledger-live/pull/23391) [`ee508db`](https://github.com/LedgerHQ/ledger-live/commit/ee508db35d572d43e03cf58e811177cc3b2389a9) Thanks [@thesan](https://github.com/thesan)! - Resolve the app configuration once, when the store is created, with `resolveAppConfig` from `@shared/app-config`. Keycloak is the first service to read it: its base URL comes from the `ledgerKeyRing` switch, which resolves to the option persisted under `appConfigSelections`, or to the `CONFIG_PROFILE` of the build's `.env` file: `staging` for dev, adhoc and nightly builds, `prod` for prerelease and release builds. The configuration stays the same for the whole session, by design: a new selection applies after an app reload. `@shared/env` drops the `LEDGER_AUTH_*` definitions.

- [#23485](https://github.com/LedgerHQ/ledger-live/pull/23485) [`623f8e6`](https://github.com/LedgerHQ/ledger-live/commit/623f8e6181d92aed3a49aa993be9d4fe0bbd8e39) Thanks [@thesan](https://github.com/thesan)! - `@shared/auth` drops the `authEnvironment` slice: Keycloak reads its base URL from the app config, so nothing reads it any more.

- [#23283](https://github.com/LedgerHQ/ledger-live/pull/23283) [`d2b8471`](https://github.com/LedgerHQ/ledger-live/commit/d2b84711b137f42930f006f7a079fc104c92633d) Thanks [@cted-ledger](https://github.com/cted-ledger)! - take the zcash account type from coin-zcash instead of the bitcoin family types

- [#23385](https://github.com/LedgerHQ/ledger-live/pull/23385) [`2ec955a`](https://github.com/LedgerHQ/ledger-live/commit/2ec955a5928085cff093d5c9a167f2761a055dcc) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the shared Account Detail settings contents: settings menu, advanced logs (with copy) and remove account confirmation, plus `buildAdvancedLogs`.

- [#23450](https://github.com/LedgerHQ/ledger-live/pull/23450) [`b0c722a`](https://github.com/LedgerHQ/ledger-live/commit/b0c722adc2665c1552b787636292314d03734c0b) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the Account Detail change name screen on LWM, opened from the settings sheet once it has closed (keeps the name field focused). Long account names are truncated in the settings menu.

- [#23435](https://github.com/LedgerHQ/ledger-live/pull/23435) [`e4e90c0`](https://github.com/LedgerHQ/ledger-live/commit/e4e90c06160288d2b6aa70706b741c410b413af6) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the Account Detail advanced logs screen on LWM, opened from the settings sheet. Copy logs now shows a "Copied" state for 2 seconds.

- [#23417](https://github.com/LedgerHQ/ledger-live/pull/23417) [`56c8c10`](https://github.com/LedgerHQ/ledger-live/commit/56c8c102f4d6a89e2da1c9517006bcc9f109918b) Thanks [@LucasWerey](https://github.com/LucasWerey)! - fix(wallet-sync): show every Ledger Sync instance and scroll the list when there are many instances

- [#23390](https://github.com/LedgerHQ/ledger-live/pull/23390) [`6582ee6`](https://github.com/LedgerHQ/ledger-live/commit/6582ee63c343dd6f64a31068fddd038af4eb9bd2) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Sign Nano S transparent Zcash sends through the legacy device path when the shielded engine is on, with the inputs and fee shown at review.

- [#23429](https://github.com/LedgerHQ/ledger-live/pull/23429) [`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Bump Lumen to lumen-design-core 0.1.32, lumen-ui-react 0.1.64, lumen-ui-rnative 0.1.67 and lumen-utils-shared 0.1.16, and migrate `Spot` to its palette API (`icon` required, `appearance="icon"` dropped, `check`/`info`/`error`/`warning`/`loader` mapped to explicit icons, `number` moved to `SpotNumber`). The devtools native jest preset now mocks `react-native-gesture-handler`, which the new lumen `Toaster` imports.

- [#23502](https://github.com/LedgerHQ/ledger-live/pull/23502) [`c32fa7b`](https://github.com/LedgerHQ/ledger-live/commit/c32fa7be07b04ef0db38e0877f18d613d32d087e) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Open the Account settings dialog from the Crypto addresses rows when the Account Detail page is enabled for the account's currency; other rows keep the Edit name button. New `AccountSettings` component (web): the settings logic lives in the package and the app only provides an `AccountSettingsAdapter` (account name, rename, sync state, locale, derivation tag).

- [#23489](https://github.com/LedgerHQ/ledger-live/pull/23489) [`53d3149`](https://github.com/LedgerHQ/ledger-live/commit/53d314969d2711da75471e7aef870038105e5092) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Keep the LWD Account Detail page header pinned at the top while scrolling, like the Asset Detail header (`PageHeader` accepts a `className`).

- [#23559](https://github.com/LedgerHQ/ledger-live/pull/23559) [`ead8b59`](https://github.com/LedgerHQ/ledger-live/commit/ead8b59eafe301b82efbe38bf6d2379b6e77b233) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Expose the recoverV2 feature flag to Mixpanel on mobile and desktop.

- [#23543](https://github.com/LedgerHQ/ledger-live/pull/23543) [`257305f`](https://github.com/LedgerHQ/ledger-live/commit/257305f907b207ac54e4e9bd9ace6a78ce554bb1) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - feat(account-balance): add the balance entity

  Crypto balances of an account, one row per asset, keyed by AccountUUID. Both apps mount the slice. Fiat stays a view.

- [#23400](https://github.com/LedgerHQ/ledger-live/pull/23400) [`beea4cd`](https://github.com/LedgerHQ/ledger-live/commit/beea4cd9cccfbfa99a03bfb878f83353ef89d41c) Thanks [@gre-ledger](https://github.com/gre-ledger)! - feat(account-data): add the account data framework

  Kind registry and `accountData` status slice, source contract and router (ranking, batching, concurrency, pagination affinity), `fetchAccountData` / `fetchMoreAccountData` and the `useAccountData` hook. Both apps register the status slice and inject the router into the thunk `extraArgument`, with no source yet.

- [#23436](https://github.com/LedgerHQ/ledger-live/pull/23436) [`f51fe16`](https://github.com/LedgerHQ/ledger-live/commit/f51fe16f67f2c50f36d772a60121ed3d7ae12c6a) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add the accounts slice, keyed by AccountUUID and kept in sync with the legacy accounts

- [#23422](https://github.com/LedgerHQ/ledger-live/pull/23422) [`b97096c`](https://github.com/LedgerHQ/ledger-live/commit/b97096ca3622ffa57e76423081b8855300f7a70d) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - End the Asset Detail chart on the header price so the line matches the live spot

- [#23213](https://github.com/LedgerHQ/ledger-live/pull/23213) [`6ce41e8`](https://github.com/LedgerHQ/ledger-live/commit/6ce41e89e4af226cefdcedd53763f1b5c8988d5b) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(send): add the Descriptionitem component for the new send flow

- [#23495](https://github.com/LedgerHQ/ledger-live/pull/23495) [`3c062fc`](https://github.com/LedgerHQ/ledger-live/commit/3c062fccd90c705eee581800c0dd416f1b61ebe2) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - feat(analytics): add the `blockchainWithFunds` user property (blockchain names, e.g. Arbitrum) next to `accountsWithFunds`, which reports the native ticker (ETH for L2s)

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

- [#23353](https://github.com/LedgerHQ/ledger-live/pull/23353) [`48d5c85`](https://github.com/LedgerHQ/ledger-live/commit/48d5c8543e70d0e4ee2fa30ea12590439f01f510) Thanks [@LL782](https://github.com/LL782)! - Remove the legacy `ofacGeoBlockApi` after Desktop and Mobile use `@features/flow-app-availability`

- [#23421](https://github.com/LedgerHQ/ledger-live/pull/23421) [`cb527aa`](https://github.com/LedgerHQ/ledger-live/commit/cb527aafdf311c6764a14d931bdb49d2bae6afcd) Thanks [@ysitbon](https://github.com/ysitbon)! - fix(desktop): persist the CAL token cache again

  The persistence middleware matched CAL actions on the hardcoded `cryptoAssetsApi/` prefix, which stopped matching when the CAL api moved to the `calApi` reducer path. It now derives the prefix from `cryptoAssetsApi.reducerPath`.

- [#23365](https://github.com/LedgerHQ/ledger-live/pull/23365) [`c3e735a`](https://github.com/LedgerHQ/ledger-live/commit/c3e735ae6199bba5d1c1e45e6fbc455cb18d8602) Thanks [@abdurrahman-ledger](https://github.com/abdurrahman-ledger)! - Run desktop E2E against Speculinho (remote Speculos). The app passes the Speculos address and session token to its Speculos transport at each open, and exposes `window.ledger.setSpeculosTarget` so a relaunched remote device (new URL and token) reaches the running app. The full desktop suite uses Speculinho, the smoke job does once its caller passes `SPECULINHO_URL`, and failed tests attach the Speculinho logs.

- [#23518](https://github.com/LedgerHQ/ledger-live/pull/23518) [`03274f1`](https://github.com/LedgerHQ/ledger-live/commit/03274f1c639bc9f50bafd53dfa136b5b1844f734) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump firebase from 9.23.0 to 12.19.0

- [#23376](https://github.com/LedgerHQ/ledger-live/pull/23376) [`4ee8f78`](https://github.com/LedgerHQ/ledger-live/commit/4ee8f78997ca79d841bf0ba5642a4f2229cdbc46) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - Add a balance type sync step to the new send flow, used by Aleo to refresh private records after the pool pick

- [#23360](https://github.com/LedgerHQ/ledger-live/pull/23360) [`a782d57`](https://github.com/LedgerHQ/ledger-live/commit/a782d57262cda0475c54417c8b769955df316e78) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Move the desktop Fear and Greed UI into the flow package

- [#22508](https://github.com/LedgerHQ/ledger-live/pull/22508) [`ad58765`](https://github.com/LedgerHQ/ledger-live/commit/ad58765b6151457022f8587d6ddcad3325ce96ac) Thanks [@pawell24](https://github.com/pawell24)! - fix(filecoin): open transactions on Blockscout from operation details

  Blockscout identifies a Filecoin message by its Ethereum-style hash, so the explorer link is now
  built from the message CID's digest instead of the CID itself.

- [#23423](https://github.com/LedgerHQ/ledger-live/pull/23423) [`c61cbe8`](https://github.com/LedgerHQ/ledger-live/commit/c61cbe8c4c383ff720812398f58907b5b6c3e982) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - fix(portfolio): show the Market 24h variation on assets whose balance did not change over the day (LIVE-39259)

- [#23389](https://github.com/LedgerHQ/ledger-live/pull/23389) [`03f4e70`](https://github.com/LedgerHQ/ledger-live/commit/03f4e70f38efc9362beae2e8ef12567cced3d3c6) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Extract address deletion into `@features/flow-contacts-delete-address` so Desktop and Mobile can reuse it without going through Contact Detail. Confirmation UI stays in `@features/platform-contacts`. Apps still own modal mounting, navigation, translations, and analytics.

- [#23459](https://github.com/LedgerHQ/ledger-live/pull/23459) [`2f9b7e9`](https://github.com/LedgerHQ/ledger-live/commit/2f9b7e97b8afee033e5fa194c5ca40a1f82a9b89) Thanks [@gre-ledger](https://github.com/gre-ledger)! - feat(account-data): full sync source on AccountBridge, serving no kind yet

- [#23270](https://github.com/LedgerHQ/ledger-live/pull/23270) [`8c5a730`](https://github.com/LedgerHQ/ledger-live/commit/8c5a730bd1e38e9305a1e99177b42e12011cd79f) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Remove the dev-only BYPASS_CORS workaround

- [#23058](https://github.com/LedgerHQ/ledger-live/pull/23058) [`214f7f1`](https://github.com/LedgerHQ/ledger-live/commit/214f7f183ea42a7b37663251db944ad61a3ad799) Thanks [@ishaba](https://github.com/ishaba)! - feat(tron): track the sponsored send funnel in Segment

- [#23240](https://github.com/LedgerHQ/ledger-live/pull/23240) [`ed10647`](https://github.com/LedgerHQ/ledger-live/commit/ed10647dedd2642ac5316f89595b618180097e33) Thanks [@dgreen-ledger](https://github.com/dgreen-ledger)! - feat(onboarding): show the onboarding warning modal on touchscreen devices

- [#23247](https://github.com/LedgerHQ/ledger-live/pull/23247) [`c18097b`](https://github.com/LedgerHQ/ledger-live/commit/c18097b2ae6fb06a530dc8a29fbfaac99ad7e942) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Load the market list with an RTK infinite query instead of React Query.

- [#23239](https://github.com/LedgerHQ/ledger-live/pull/23239) [`ade02b9`](https://github.com/LedgerHQ/ledger-live/commit/ade02b942ed12320573f0dab67f0a286b4c47533) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - Aleo new send flow descriptor and extended self transfer flow

- [#23425](https://github.com/LedgerHQ/ledger-live/pull/23425) [`8ebcf5c`](https://github.com/LedgerHQ/ledger-live/commit/8ebcf5c5507558750fb9f7980e9de4f0f5a637ce) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Aleo estimated signing time row on the new send flow Amount step

- [#23151](https://github.com/LedgerHQ/ledger-live/pull/23151) [`004d896`](https://github.com/LedgerHQ/ledger-live/commit/004d8965c325b6ff60d5a2ebcc1c763b7a7bf4d1) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Show and export QA onboarding logs with the device answers and the machine context, and toggle the deviceOnboarding flag from the devtool

- [#23234](https://github.com/LedgerHQ/ledger-live/pull/23234) [`c2c2f0a`](https://github.com/LedgerHQ/ledger-live/commit/c2c2f0a1b289dcef8e51f45ef6fe3c9f8418f045) Thanks [@LL782](https://github.com/LL782)! - Gate desktop launch on the shared app availability flow

- [#23510](https://github.com/LedgerHQ/ledger-live/pull/23510) [`cc970db`](https://github.com/LedgerHQ/ledger-live/commit/cc970db42cb0da0d21c6d862ac0eb5d3886bc80b) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Replace unmaintained listr with a minimal task runner in the dist script

- [#23102](https://github.com/LedgerHQ/ledger-live/pull/23102) [`4d77514`](https://github.com/LedgerHQ/ledger-live/commit/4d775144f5032153be92d736a2f029aeb1223280) Thanks [@sarneijim](https://github.com/sarneijim)! - Move the shared device onboarding machine to features/platform

- [#23509](https://github.com/LedgerHQ/ledger-live/pull/23509) [`3df619d`](https://github.com/LedgerHQ/ledger-live/commit/3df619dafffd7aea45cacb18d705aa291c4dcb47) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Remove unused allure-commandline dependency

- [#23503](https://github.com/LedgerHQ/ledger-live/pull/23503) [`bd6dbc5`](https://github.com/LedgerHQ/ledger-live/commit/bd6dbc515c1f64214be60c76498452ff9bd2e119) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - Allow Aleo token accounts to self-transfer between their public and private balances in the new send flow

- [#22782](https://github.com/LedgerHQ/ledger-live/pull/22782) [`014d4fd`](https://github.com/LedgerHQ/ledger-live/commit/014d4fd1d40ac1de41e55b0fb0bcef19be148367) Thanks [@KVNLS](https://github.com/KVNLS)! - Run the desktop renderer with `contextIsolation` and `sandbox` enabled, and without `nodeIntegration`.

  Previously any XSS, Live App escape or compromised dependency executing in the renderer had full Node available: `child_process`, arbitrary filesystem access, and unrestricted access to the account database files. The renderer now has none of that. It runs in its own JavaScript world inside an OS-level sandbox, and reaches the main process only through the allow-listed preload bridge, which exposes one method per operation rather than a generic `invoke(channel, ...)` passthrough. The renderer can still read and write its own `app` data through the bridge, as it must to work, and password attempts against the database are throttled in the main process; making encrypted fields unreadable while the app is locked is a separate follow-up.

  Live App `<webview>`s are checked before they are created: isolation, sandbox and web security are pinned, only the two webview preloads are accepted, and a disallowed `src` scheme blocks the webview. They also can no longer load local files, which the renderer could otherwise read back through `webview.loadURL()`.

  The three flags have to move together: `sandbox` has defaulted to true since Electron 20 and is auto-disabled only by `nodeIntegration`, so changing that one alone would silently sandbox the renderer _and_ strip Node from the preload.

  No data migration: `localStorage` is keyed by an origin that does not change, and both `app.json` and `lld.json` live in the main process either way.

- [#23550](https://github.com/LedgerHQ/ledger-live/pull/23550) [`589bae3`](https://github.com/LedgerHQ/ledger-live/commit/589bae35869b822c6337dd99b15f474119ea828c) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Revert the network selection when swapping from Market (#23182, #23299).

- [#23226](https://github.com/LedgerHQ/ledger-live/pull/23226) [`dd34e1b`](https://github.com/LedgerHQ/ledger-live/commit/dd34e1b8929faff2869d6d3a2366acc16c649229) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Shorten the device intent executor component names

- [#23003](https://github.com/LedgerHQ/ledger-live/pull/23003) [`57b4652`](https://github.com/LedgerHQ/ledger-live/commit/57b4652a1d0ae95af20419210139039642cedb9c) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Adapt to `@ledgerhq/coin-evm` 15

- [#23261](https://github.com/LedgerHQ/ledger-live/pull/23261) [`02b383b`](https://github.com/LedgerHQ/ledger-live/commit/02b383b7d11352d121556bb6f0a076c2b960b9eb) Thanks [@alexstapenka-ledger](https://github.com/alexstapenka-ledger)! - Add a withdraw icon to the earn action confirmation dialog, a `custom.dialog.menu` action menu dialog on desktop for the Earn "Earn more" / "Withdraw all" choice, and the `earnWithdrawV2` feature flag that gates the Earn full withdraw flow

### Patch Changes

- Updated dependencies [[`a86963c`](https://github.com/LedgerHQ/ledger-live/commit/a86963c2401573e3d5fef6b9623bae1e23126178), [`68c2837`](https://github.com/LedgerHQ/ledger-live/commit/68c2837d114092c6f421cfe5d5a97ce48d69667c), [`ec7b8b9`](https://github.com/LedgerHQ/ledger-live/commit/ec7b8b9f1c0821ffb9973a174bc2f693719215ab), [`1349df3`](https://github.com/LedgerHQ/ledger-live/commit/1349df3f6e9a27eeecc8495ca99a453341d7bf70), [`c9beaff`](https://github.com/LedgerHQ/ledger-live/commit/c9beaff3b51d3a50f310be73a830bf6e944e61fa), [`4831311`](https://github.com/LedgerHQ/ledger-live/commit/4831311fd859631a9248441e469f52c18fb42c52), [`9365d3a`](https://github.com/LedgerHQ/ledger-live/commit/9365d3ad499ac5c80d445e7816c30adbfe05ffd8), [`e15a91d`](https://github.com/LedgerHQ/ledger-live/commit/e15a91dca7d490f5c8d6d0dfdc8152a6f6e7ef0b), [`d6ab47c`](https://github.com/LedgerHQ/ledger-live/commit/d6ab47c28339866ad88ef0deba75d314c2f6c4f0), [`393a02a`](https://github.com/LedgerHQ/ledger-live/commit/393a02a42be9f0410b75c0c34203915bcde27e43), [`ef80ee4`](https://github.com/LedgerHQ/ledger-live/commit/ef80ee46eb564e25090ce08d8459212739158117), [`d1fb4fd`](https://github.com/LedgerHQ/ledger-live/commit/d1fb4fd3b5cdd83eaf479f9d09dca154099c90b4), [`a6e1e6a`](https://github.com/LedgerHQ/ledger-live/commit/a6e1e6a6049d43228224aba5df18ca3eab873b62), [`b641da8`](https://github.com/LedgerHQ/ledger-live/commit/b641da86d889e6e81278c5af70b16da216a19f92), [`ee508db`](https://github.com/LedgerHQ/ledger-live/commit/ee508db35d572d43e03cf58e811177cc3b2389a9), [`623f8e6`](https://github.com/LedgerHQ/ledger-live/commit/623f8e6181d92aed3a49aa993be9d4fe0bbd8e39), [`d2b8471`](https://github.com/LedgerHQ/ledger-live/commit/d2b84711b137f42930f006f7a079fc104c92633d), [`d2b8471`](https://github.com/LedgerHQ/ledger-live/commit/d2b84711b137f42930f006f7a079fc104c92633d), [`6032338`](https://github.com/LedgerHQ/ledger-live/commit/60323388dea6a0957aa836c73657b58d26765321), [`2ec955a`](https://github.com/LedgerHQ/ledger-live/commit/2ec955a5928085cff093d5c9a167f2761a055dcc), [`b0c722a`](https://github.com/LedgerHQ/ledger-live/commit/b0c722adc2665c1552b787636292314d03734c0b), [`e4e90c0`](https://github.com/LedgerHQ/ledger-live/commit/e4e90c06160288d2b6aa70706b741c410b413af6), [`05e5823`](https://github.com/LedgerHQ/ledger-live/commit/05e58230918a0d271774998c7bede69c88e6a186), [`6b23210`](https://github.com/LedgerHQ/ledger-live/commit/6b232105c11b8b8b86fcb6a715ef19a0b3453b74), [`bef895f`](https://github.com/LedgerHQ/ledger-live/commit/bef895fca53783545c564e6842b9069f936becf5), [`6582ee6`](https://github.com/LedgerHQ/ledger-live/commit/6582ee63c343dd6f64a31068fddd038af4eb9bd2), [`722c6f3`](https://github.com/LedgerHQ/ledger-live/commit/722c6f312e9fd8c33c932ef2f4df15d9062ade31), [`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c), [`c32fa7b`](https://github.com/LedgerHQ/ledger-live/commit/c32fa7be07b04ef0db38e0877f18d613d32d087e), [`ead8b59`](https://github.com/LedgerHQ/ledger-live/commit/ead8b59eafe301b82efbe38bf6d2379b6e77b233), [`257305f`](https://github.com/LedgerHQ/ledger-live/commit/257305f907b207ac54e4e9bd9ace6a78ce554bb1), [`beea4cd`](https://github.com/LedgerHQ/ledger-live/commit/beea4cd9cccfbfa99a03bfb878f83353ef89d41c), [`f51fe16`](https://github.com/LedgerHQ/ledger-live/commit/f51fe16f67f2c50f36d772a60121ed3d7ae12c6a), [`fc846e5`](https://github.com/LedgerHQ/ledger-live/commit/fc846e53bbe5023223aa847b6e00b68fb22ace4a), [`b97096c`](https://github.com/LedgerHQ/ledger-live/commit/b97096ca3622ffa57e76423081b8855300f7a70d), [`b79ccab`](https://github.com/LedgerHQ/ledger-live/commit/b79ccab839cc7916ff3ecd910479904f87a6e59d), [`7b3040a`](https://github.com/LedgerHQ/ledger-live/commit/7b3040ad872c183fd2beb81a965037b5310ab87a), [`b599cb2`](https://github.com/LedgerHQ/ledger-live/commit/b599cb25afbc5ce2dbdcd0cc1b6126a49bba8068), [`3c062fc`](https://github.com/LedgerHQ/ledger-live/commit/3c062fccd90c705eee581800c0dd416f1b61ebe2), [`a5a6fa6`](https://github.com/LedgerHQ/ledger-live/commit/a5a6fa6267d17dcb3843358cd5b1f3b42e91ea4c), [`de8fe99`](https://github.com/LedgerHQ/ledger-live/commit/de8fe99f01d9d6248437fc8a914f12fc83d6e470), [`3527dbc`](https://github.com/LedgerHQ/ledger-live/commit/3527dbc69a05745b272741566b20634d79462cb8), [`80f99a8`](https://github.com/LedgerHQ/ledger-live/commit/80f99a819b13d3ec2bd39d896de46e0a433b9954), [`19e5335`](https://github.com/LedgerHQ/ledger-live/commit/19e5335bcb3d6017d6c875fc1fd66704f0f5a8be), [`87b812e`](https://github.com/LedgerHQ/ledger-live/commit/87b812eb975719f788abb4fd315b6229259e8d6e), [`7da1ea9`](https://github.com/LedgerHQ/ledger-live/commit/7da1ea9534a1bdde063e31545363a27f0fdf5abb), [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574), [`2f9c159`](https://github.com/LedgerHQ/ledger-live/commit/2f9c1598145b8a7dadab43b12a5deb4ab9dc91c9), [`a654488`](https://github.com/LedgerHQ/ledger-live/commit/a654488d68942852ffa880a60ae674ff44a18918), [`6abfd98`](https://github.com/LedgerHQ/ledger-live/commit/6abfd98fd3d0359864687b2fc125390f3643a6db), [`2621f1e`](https://github.com/LedgerHQ/ledger-live/commit/2621f1ebe6c1a8f8cff0a797740771ae5fc084be), [`3ad1a61`](https://github.com/LedgerHQ/ledger-live/commit/3ad1a619eb1244d9adb8e4e67c250a2687716175), [`bcf98ff`](https://github.com/LedgerHQ/ledger-live/commit/bcf98ffbb1d119fba86c53e4c005abdad251b62a), [`75498cf`](https://github.com/LedgerHQ/ledger-live/commit/75498cf55065bccf17d09b780866ae031c01701a), [`ad6aad8`](https://github.com/LedgerHQ/ledger-live/commit/ad6aad8eec3a718da9359ad683350360f745d0d5), [`47e5b74`](https://github.com/LedgerHQ/ledger-live/commit/47e5b740cf64f177fd1cbbfa7f5bf74de3d45661), [`48d5c85`](https://github.com/LedgerHQ/ledger-live/commit/48d5c8543e70d0e4ee2fa30ea12590439f01f510), [`ff33162`](https://github.com/LedgerHQ/ledger-live/commit/ff331621a49337b1065c373f16aa479fa0ab5c8b), [`5e9a60a`](https://github.com/LedgerHQ/ledger-live/commit/5e9a60ac27b41be43d1ea24b0d11acec92260c49), [`7e54483`](https://github.com/LedgerHQ/ledger-live/commit/7e544837b934b55e0743faaabacfc89d922e9435), [`4ee8f78`](https://github.com/LedgerHQ/ledger-live/commit/4ee8f78997ca79d841bf0ba5642a4f2229cdbc46), [`e5762fc`](https://github.com/LedgerHQ/ledger-live/commit/e5762fc3dc7bb36007c8133efefeeb6523cebf05), [`a782d57`](https://github.com/LedgerHQ/ledger-live/commit/a782d57262cda0475c54417c8b769955df316e78), [`a02d06c`](https://github.com/LedgerHQ/ledger-live/commit/a02d06c1556ac855233d3b9b427cd812628a7aba), [`ad58765`](https://github.com/LedgerHQ/ledger-live/commit/ad58765b6151457022f8587d6ddcad3325ce96ac), [`c61cbe8`](https://github.com/LedgerHQ/ledger-live/commit/c61cbe8c4c383ff720812398f58907b5b6c3e982), [`03f4e70`](https://github.com/LedgerHQ/ledger-live/commit/03f4e70f38efc9362beae2e8ef12567cced3d3c6), [`2f9b7e9`](https://github.com/LedgerHQ/ledger-live/commit/2f9b7e97b8afee033e5fa194c5ca40a1f82a9b89), [`ff14496`](https://github.com/LedgerHQ/ledger-live/commit/ff14496257201991b52f0dd140e351fca3e84d4d), [`c9c482e`](https://github.com/LedgerHQ/ledger-live/commit/c9c482e9d4ec30bb05e60d00548c471f2d124163), [`e66d21e`](https://github.com/LedgerHQ/ledger-live/commit/e66d21ea7ccb706d718703b69d2133ede3294c1a), [`4fd1ebc`](https://github.com/LedgerHQ/ledger-live/commit/4fd1ebc94718ead589f235824f0440803341feb9), [`68cebc0`](https://github.com/LedgerHQ/ledger-live/commit/68cebc06f2ec8f4cc38ac1caca779317a8fe0711), [`214f7f1`](https://github.com/LedgerHQ/ledger-live/commit/214f7f183ea42a7b37663251db944ad61a3ad799), [`ed10647`](https://github.com/LedgerHQ/ledger-live/commit/ed10647dedd2642ac5316f89595b618180097e33), [`c18097b`](https://github.com/LedgerHQ/ledger-live/commit/c18097b2ae6fb06a530dc8a29fbfaac99ad7e942), [`ade02b9`](https://github.com/LedgerHQ/ledger-live/commit/ade02b942ed12320573f0dab67f0a286b4c47533), [`bcea51b`](https://github.com/LedgerHQ/ledger-live/commit/bcea51b0b2c9ef09b9e068f97ed3c67a0e45e188), [`2e198e2`](https://github.com/LedgerHQ/ledger-live/commit/2e198e2394723873a79e56635cfe21a2ab763454), [`3fadda7`](https://github.com/LedgerHQ/ledger-live/commit/3fadda73d3131279b8a318cf15a29778f62d15cd), [`8daaded`](https://github.com/LedgerHQ/ledger-live/commit/8daaded1316cb30dc1b3a8634301acc176ca97af), [`004d896`](https://github.com/LedgerHQ/ledger-live/commit/004d8965c325b6ff60d5a2ebcc1c763b7a7bf4d1), [`98c994b`](https://github.com/LedgerHQ/ledger-live/commit/98c994bc1f46a03366096531afac2471f07f397b), [`9887c8f`](https://github.com/LedgerHQ/ledger-live/commit/9887c8ffdb22ba87ccce7e8f1780e91ac78af640), [`df2068c`](https://github.com/LedgerHQ/ledger-live/commit/df2068c73926db98e3d0073abf3606db0df878eb), [`6639142`](https://github.com/LedgerHQ/ledger-live/commit/6639142cc619d0758ba7873dafbc3e32944f250f), [`96f2f30`](https://github.com/LedgerHQ/ledger-live/commit/96f2f30c368cf471698d4b48b18ac33a57c7b19a), [`2cd35c5`](https://github.com/LedgerHQ/ledger-live/commit/2cd35c5e21a9dfe58ca58349280f33266143ca51), [`4d77514`](https://github.com/LedgerHQ/ledger-live/commit/4d775144f5032153be92d736a2f029aeb1223280), [`307d5c0`](https://github.com/LedgerHQ/ledger-live/commit/307d5c0da2fc42ee1699e6b48073255276456dd6), [`37a49df`](https://github.com/LedgerHQ/ledger-live/commit/37a49df18649912157d8f269c3b4153d54b7817e), [`bd6dbc5`](https://github.com/LedgerHQ/ledger-live/commit/bd6dbc515c1f64214be60c76498452ff9bd2e119), [`0ace271`](https://github.com/LedgerHQ/ledger-live/commit/0ace2718ac29bc9926858af41424177ff3363d47), [`ca063c4`](https://github.com/LedgerHQ/ledger-live/commit/ca063c4cfad79f12118c5af5bc0ef323857f90bd), [`2c6e74a`](https://github.com/LedgerHQ/ledger-live/commit/2c6e74a12a542cb47507ec98ae85ace8fa526171), [`e345c82`](https://github.com/LedgerHQ/ledger-live/commit/e345c829b04e28d489b9cf4d8384ed57dbad0321), [`fb0ac6a`](https://github.com/LedgerHQ/ledger-live/commit/fb0ac6ab7d2e2b8c41c7b012b563c1286313ca70), [`696357f`](https://github.com/LedgerHQ/ledger-live/commit/696357f754751853758d67c88bf34df9302b9b97), [`a8d48a9`](https://github.com/LedgerHQ/ledger-live/commit/a8d48a97f1bae0c2adad5d2790c9cc8ab5d7c2b0), [`ed89930`](https://github.com/LedgerHQ/ledger-live/commit/ed89930df1e705c535e5c4cccd62033654f5a145), [`0d5c35d`](https://github.com/LedgerHQ/ledger-live/commit/0d5c35d9f29e17c3ad7bcb7632dcaea83d47e7d3), [`57b4652`](https://github.com/LedgerHQ/ledger-live/commit/57b4652a1d0ae95af20419210139039642cedb9c), [`b88647d`](https://github.com/LedgerHQ/ledger-live/commit/b88647dca4c613663bca4ba0d62c2296b95ac083), [`06b6724`](https://github.com/LedgerHQ/ledger-live/commit/06b672492a5c6a60c7ad181710a2411744c43d3f), [`4905dd1`](https://github.com/LedgerHQ/ledger-live/commit/4905dd1fc2625a07d2aa4e73461a12875466bbd6), [`02b383b`](https://github.com/LedgerHQ/ledger-live/commit/02b383b7d11352d121556bb6f0a076c2b960b9eb)]:
  - @shared/feature-flags@0.27.0
  - @features/flow-account-detail-settings@0.1.0
  - @features/flow-contacts-detail@0.2.0
  - @features/flow-contacts@0.15.0
  - @features/flow-pay-contact@0.7.0
  - @ledgerhq/coin-concordium@1.6.0
  - @ledgerhq/coin-zcash@1.0.0
  - @ledgerhq/live-common@38.4.0
  - @domain/entity-currency-crypto@0.16.0
  - @shared/app-config@0.1.0
  - @shared/env@0.11.0
  - @shared/auth@0.7.0
  - @ledgerhq/coin-bitcoin@1.0.0
  - @features/flow-account-detail@0.1.0
  - @features/flow-pay-card-details@0.8.0
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
  - @ledgerhq/wallet-btc@1.0.0
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
  - @features/platform-app-update@0.1.0
  - @features/platform-device-onboarding@0.2.0
  - @devtools/bindings@0.12.0
  - @ledgerhq/coin-casper@3.6.0
  - @ledgerhq/live-dmk-speculos@0.12.0
  - @features/flow-app-availability@0.2.0
  - @ledgerhq/live-dmk-shared@0.36.0
  - @ledgerhq/live-dmk-desktop@0.25.0
  - @ledgerhq/coin-canton@1.5.0
  - @features/flow-large-screen-upsell@2.2.3
  - @features/flow-pay-feature-tour@0.8.1
  - @features/platform-feature-flags@0.9.1
  - @features/platform-feature-flags-firebase@0.1.1
  - @features/flow-pay-bank-transfer@0.4.1
  - @features/flow-pay-card-auth@0.10.1
  - @ledgerhq/asset-detail@0.12.1
  - @ledgerhq/live-send@0.1.4
  - @domain/api-aggregated-assets@0.6.1
  - @domain/api-currency-token@0.6.5
  - @domain/api-market-countervalues@0.2.1
  - @domain/entity-contact@0.12.1
  - @domain/entity-currency@0.4.7
  - @domain/entity-currency-token@0.5.6
  - @ledgerhq/asset-aggregation@0.18.1
  - @ledgerhq/coin-cardano@2.0.1
  - @ledgerhq/live-wallet@1.1.7
  - @ledgerhq/wallet-analytics@0.5.2
  - @ledgerhq/wallet-pnl@0.8.1
  - @features/platform-aggregated-assets@0.5.7
  - @features/platform-env@0.4.3
  - @ledgerhq/transaction-observability@0.5.1
  - @shared/api-services@0.10.1
  - @features/flow-pay-card@0.7.1
  - @devtools/transport-panel@0.7.0
  - @domain/entity-account-alias@0.1.1
  - @domain/entity-account-name@0.2.3
  - @domain/entity-starred-account@0.0.2
  - @ledgerhq/live-signer-evm@0.24.2
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

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/coin-zcash@1.0.0-next.1
  - @ledgerhq/live-common@38.4.0-next.2
  - @ledgerhq/asset-detail@0.12.1-next.2
  - @ledgerhq/live-dmk-desktop@0.25.0-next.2
  - @ledgerhq/live-send@0.1.4-next.2

## 4.25.0-next.1

### Minor Changes

- [#23631](https://github.com/LedgerHQ/ledger-live/pull/23631) [`19e5335`](https://github.com/LedgerHQ/ledger-live/commit/19e5335bcb3d6017d6c875fc1fd66704f0f5a8be) Thanks [@henri-ly](https://github.com/henri-ly)! - Restore name and unit on the transaction intent asset so XRP and Stellar amount errors show the currency unit instead of "Unknown unit"

### Patch Changes

- Updated dependencies [[`19e5335`](https://github.com/LedgerHQ/ledger-live/commit/19e5335bcb3d6017d6c875fc1fd66704f0f5a8be)]:
  - @ledgerhq/live-common@38.4.0-next.1
  - @ledgerhq/asset-detail@0.12.1-next.1
  - @ledgerhq/live-dmk-desktop@0.25.0-next.1
  - @ledgerhq/live-send@0.1.4-next.1

## 4.25.0-next.0

### Minor Changes

- [#23341](https://github.com/LedgerHQ/ledger-live/pull/23341) [`a86963c`](https://github.com/LedgerHQ/ledger-live/commit/a86963c2401573e3d5fef6b9623bae1e23126178) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the `accountDetail` feature flag (with `excludedCurrencyIds`) for the new Account Detail page and send its state to analytics.

- [#23367](https://github.com/LedgerHQ/ledger-live/pull/23367) [`bc0a9e1`](https://github.com/LedgerHQ/ledger-live/commit/bc0a9e149eef9dc38769df14dadc46ff115e7c1b) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the Account Detail page shell behind the `accountDetail` flag: `/account` routes switch per account to the new page (token sub-accounts redirect to their parent), the legacy page otherwise.

- [#23381](https://github.com/LedgerHQ/ledger-live/pull/23381) [`755532d`](https://github.com/LedgerHQ/ledger-live/commit/755532d67c3b03f886c08fe297bce61ccf8df5de) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the Account Detail header on LWD: back button, account name, shortened address with the network icon, and an "Account settings" button.

- [#23401](https://github.com/LedgerHQ/ledger-live/pull/23401) [`0c0f9b2`](https://github.com/LedgerHQ/ledger-live/commit/0c0f9b2634a979bd97df53ff8cc85a6a86f736f0) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the Account Detail settings dialog on LWD: the settings button opens the account settings menu and the remove account confirmation.

- [#23463](https://github.com/LedgerHQ/ledger-live/pull/23463) [`68c2837`](https://github.com/LedgerHQ/ledger-live/commit/68c2837d114092c6f421cfe5d5a97ce48d69667c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Change the account name from the LWD Account Detail settings dialog: new change name step (back to the menu, name field, Change name button), disabled while accounts are syncing.

- [#23486](https://github.com/LedgerHQ/ledger-live/pull/23486) [`ec7b8b9`](https://github.com/LedgerHQ/ledger-live/commit/ec7b8b9f1c0821ffb9973a174bc2f693719215ab) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Show the advanced logs from the LWD Account Detail settings dialog: new advanced logs step (back to the menu, derivation tip, sync date, account JSON, Copy logs with a Copied state).

- [#23496](https://github.com/LedgerHQ/ledger-live/pull/23496) [`914c8b7`](https://github.com/LedgerHQ/ledger-live/commit/914c8b74e3baeb9aaf9ac086ead5a6369d0fd5cf) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Show the assets of the account on the LWD Account Detail page: native coin and tokens with balance, value and trend, sorted by value. The assets table moves to `mvvm/components/AssetsTable` and can hide its price column.

- [#23412](https://github.com/LedgerHQ/ledger-live/pull/23412) [`7644e3f`](https://github.com/LedgerHQ/ledger-live/commit/7644e3fb6195adceaf9e2f6cb1f527cd0f5bc33b) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the Transactions section to the LWD Account Detail page: the 3 latest operations of the account and its tokens, opening the full history scoped to the account. The Asset Detail section now uses the same shared component.

- [#23322](https://github.com/LedgerHQ/ledger-live/pull/23322) [`1349df3`](https://github.com/LedgerHQ/ledger-live/commit/1349df3f6e9a27eeecc8495ca99a453341d7bf70) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Extract the Contact Detail journey into `@features/flow-contacts-detail` so Desktop and Mobile can reuse it, while the Contacts aggregate keeps cross-journey orchestration

- [#23004](https://github.com/LedgerHQ/ledger-live/pull/23004) [`505eea9`](https://github.com/LedgerHQ/ledger-live/commit/505eea91332a042c158fdca7a36ebeddff379da3) Thanks [@vpenskyi-ledger](https://github.com/vpenskyi-ledger)! - Fix a second account drawer opening in Swap when the receive token is a token the user does not hold yet. The parent account is now sent with `toTokenId` instead of the unresolvable synthetic token account, so the Swap live app builds the token account itself.

- [#23346](https://github.com/LedgerHQ/ledger-live/pull/23346) [`80a62ae`](https://github.com/LedgerHQ/ledger-live/commit/80a62ae9b54253c0059abf236ca486f8a6bbc9ca) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Show perps deposit device errors with the new error state and a retry.

- [#23195](https://github.com/LedgerHQ/ledger-live/pull/23195) [`490496e`](https://github.com/LedgerHQ/ledger-live/commit/490496e5eb52c62830b8e843c21c14662404b89e) Thanks [@cted-ledger](https://github.com/cted-ledger)! - zcash: the spendable-balance warning no longer quotes a wait time that changes with the block spacing

- [#23344](https://github.com/LedgerHQ/ledger-live/pull/23344) [`e15a91d`](https://github.com/LedgerHQ/ledger-live/commit/e15a91dca7d490f5c8d6d0dfdc8152a6f6e7ef0b) Thanks [@cted-ledger](https://github.com/cted-ledger)! - give zcash testnet accounts the zcash screens and shielded sync, by recognising every zcash currency rather than the mainnet id only

- [#23391](https://github.com/LedgerHQ/ledger-live/pull/23391) [`ee508db`](https://github.com/LedgerHQ/ledger-live/commit/ee508db35d572d43e03cf58e811177cc3b2389a9) Thanks [@thesan](https://github.com/thesan)! - Resolve the app configuration once, when the store is created, with `resolveAppConfig` from `@shared/app-config`. Keycloak is the first service to read it: its base URL comes from the `ledgerKeyRing` switch, which resolves to the option persisted under `appConfigSelections`, or to the `CONFIG_PROFILE` of the build's `.env` file: `staging` for dev, adhoc and nightly builds, `prod` for prerelease and release builds. The configuration stays the same for the whole session, by design: a new selection applies after an app reload. `@shared/env` drops the `LEDGER_AUTH_*` definitions.

- [#23485](https://github.com/LedgerHQ/ledger-live/pull/23485) [`623f8e6`](https://github.com/LedgerHQ/ledger-live/commit/623f8e6181d92aed3a49aa993be9d4fe0bbd8e39) Thanks [@thesan](https://github.com/thesan)! - `@shared/auth` drops the `authEnvironment` slice: Keycloak reads its base URL from the app config, so nothing reads it any more.

- [#23283](https://github.com/LedgerHQ/ledger-live/pull/23283) [`d2b8471`](https://github.com/LedgerHQ/ledger-live/commit/d2b84711b137f42930f006f7a079fc104c92633d) Thanks [@cted-ledger](https://github.com/cted-ledger)! - take the zcash account type from coin-zcash instead of the bitcoin family types

- [#23385](https://github.com/LedgerHQ/ledger-live/pull/23385) [`2ec955a`](https://github.com/LedgerHQ/ledger-live/commit/2ec955a5928085cff093d5c9a167f2761a055dcc) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the shared Account Detail settings contents: settings menu, advanced logs (with copy) and remove account confirmation, plus `buildAdvancedLogs`.

- [#23450](https://github.com/LedgerHQ/ledger-live/pull/23450) [`b0c722a`](https://github.com/LedgerHQ/ledger-live/commit/b0c722adc2665c1552b787636292314d03734c0b) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the Account Detail change name screen on LWM, opened from the settings sheet once it has closed (keeps the name field focused). Long account names are truncated in the settings menu.

- [#23435](https://github.com/LedgerHQ/ledger-live/pull/23435) [`e4e90c0`](https://github.com/LedgerHQ/ledger-live/commit/e4e90c06160288d2b6aa70706b741c410b413af6) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the Account Detail advanced logs screen on LWM, opened from the settings sheet. Copy logs now shows a "Copied" state for 2 seconds.

- [#23417](https://github.com/LedgerHQ/ledger-live/pull/23417) [`56c8c10`](https://github.com/LedgerHQ/ledger-live/commit/56c8c102f4d6a89e2da1c9517006bcc9f109918b) Thanks [@LucasWerey](https://github.com/LucasWerey)! - fix(wallet-sync): show every Ledger Sync instance and scroll the list when there are many instances

- [#23390](https://github.com/LedgerHQ/ledger-live/pull/23390) [`6582ee6`](https://github.com/LedgerHQ/ledger-live/commit/6582ee63c343dd6f64a31068fddd038af4eb9bd2) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Sign Nano S transparent Zcash sends through the legacy device path when the shielded engine is on, with the inputs and fee shown at review.

- [#23429](https://github.com/LedgerHQ/ledger-live/pull/23429) [`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Bump Lumen to lumen-design-core 0.1.32, lumen-ui-react 0.1.64, lumen-ui-rnative 0.1.67 and lumen-utils-shared 0.1.16, and migrate `Spot` to its palette API (`icon` required, `appearance="icon"` dropped, `check`/`info`/`error`/`warning`/`loader` mapped to explicit icons, `number` moved to `SpotNumber`). The devtools native jest preset now mocks `react-native-gesture-handler`, which the new lumen `Toaster` imports.

- [#23502](https://github.com/LedgerHQ/ledger-live/pull/23502) [`c32fa7b`](https://github.com/LedgerHQ/ledger-live/commit/c32fa7be07b04ef0db38e0877f18d613d32d087e) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Open the Account settings dialog from the Crypto addresses rows when the Account Detail page is enabled for the account's currency; other rows keep the Edit name button. New `AccountSettings` component (web): the settings logic lives in the package and the app only provides an `AccountSettingsAdapter` (account name, rename, sync state, locale, derivation tag).

- [#23489](https://github.com/LedgerHQ/ledger-live/pull/23489) [`53d3149`](https://github.com/LedgerHQ/ledger-live/commit/53d314969d2711da75471e7aef870038105e5092) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Keep the LWD Account Detail page header pinned at the top while scrolling, like the Asset Detail header (`PageHeader` accepts a `className`).

- [#23559](https://github.com/LedgerHQ/ledger-live/pull/23559) [`ead8b59`](https://github.com/LedgerHQ/ledger-live/commit/ead8b59eafe301b82efbe38bf6d2379b6e77b233) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Expose the recoverV2 feature flag to Mixpanel on mobile and desktop.

- [#23543](https://github.com/LedgerHQ/ledger-live/pull/23543) [`257305f`](https://github.com/LedgerHQ/ledger-live/commit/257305f907b207ac54e4e9bd9ace6a78ce554bb1) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - feat(account-balance): add the balance entity

  Crypto balances of an account, one row per asset, keyed by AccountUUID. Both apps mount the slice. Fiat stays a view.

- [#23400](https://github.com/LedgerHQ/ledger-live/pull/23400) [`beea4cd`](https://github.com/LedgerHQ/ledger-live/commit/beea4cd9cccfbfa99a03bfb878f83353ef89d41c) Thanks [@gre-ledger](https://github.com/gre-ledger)! - feat(account-data): add the account data framework

  Kind registry and `accountData` status slice, source contract and router (ranking, batching, concurrency, pagination affinity), `fetchAccountData` / `fetchMoreAccountData` and the `useAccountData` hook. Both apps register the status slice and inject the router into the thunk `extraArgument`, with no source yet.

- [#23436](https://github.com/LedgerHQ/ledger-live/pull/23436) [`f51fe16`](https://github.com/LedgerHQ/ledger-live/commit/f51fe16f67f2c50f36d772a60121ed3d7ae12c6a) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add the accounts slice, keyed by AccountUUID and kept in sync with the legacy accounts

- [#23422](https://github.com/LedgerHQ/ledger-live/pull/23422) [`b97096c`](https://github.com/LedgerHQ/ledger-live/commit/b97096ca3622ffa57e76423081b8855300f7a70d) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - End the Asset Detail chart on the header price so the line matches the live spot

- [#23213](https://github.com/LedgerHQ/ledger-live/pull/23213) [`6ce41e8`](https://github.com/LedgerHQ/ledger-live/commit/6ce41e89e4af226cefdcedd53763f1b5c8988d5b) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(send): add the Descriptionitem component for the new send flow

- [#23495](https://github.com/LedgerHQ/ledger-live/pull/23495) [`3c062fc`](https://github.com/LedgerHQ/ledger-live/commit/3c062fccd90c705eee581800c0dd416f1b61ebe2) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - feat(analytics): add the `blockchainWithFunds` user property (blockchain names, e.g. Arbitrum) next to `accountsWithFunds`, which reports the native ticker (ETH for L2s)

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

- [#23353](https://github.com/LedgerHQ/ledger-live/pull/23353) [`48d5c85`](https://github.com/LedgerHQ/ledger-live/commit/48d5c8543e70d0e4ee2fa30ea12590439f01f510) Thanks [@LL782](https://github.com/LL782)! - Remove the legacy `ofacGeoBlockApi` after Desktop and Mobile use `@features/flow-app-availability`

- [#23421](https://github.com/LedgerHQ/ledger-live/pull/23421) [`cb527aa`](https://github.com/LedgerHQ/ledger-live/commit/cb527aafdf311c6764a14d931bdb49d2bae6afcd) Thanks [@ysitbon](https://github.com/ysitbon)! - fix(desktop): persist the CAL token cache again

  The persistence middleware matched CAL actions on the hardcoded `cryptoAssetsApi/` prefix, which stopped matching when the CAL api moved to the `calApi` reducer path. It now derives the prefix from `cryptoAssetsApi.reducerPath`.

- [#23365](https://github.com/LedgerHQ/ledger-live/pull/23365) [`c3e735a`](https://github.com/LedgerHQ/ledger-live/commit/c3e735ae6199bba5d1c1e45e6fbc455cb18d8602) Thanks [@abdurrahman-ledger](https://github.com/abdurrahman-ledger)! - Run desktop E2E against Speculinho (remote Speculos). The app passes the Speculos address and session token to its Speculos transport at each open, and exposes `window.ledger.setSpeculosTarget` so a relaunched remote device (new URL and token) reaches the running app. The full desktop suite uses Speculinho, the smoke job does once its caller passes `SPECULINHO_URL`, and failed tests attach the Speculinho logs.

- [#23518](https://github.com/LedgerHQ/ledger-live/pull/23518) [`03274f1`](https://github.com/LedgerHQ/ledger-live/commit/03274f1c639bc9f50bafd53dfa136b5b1844f734) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump firebase from 9.23.0 to 12.19.0

- [#23376](https://github.com/LedgerHQ/ledger-live/pull/23376) [`4ee8f78`](https://github.com/LedgerHQ/ledger-live/commit/4ee8f78997ca79d841bf0ba5642a4f2229cdbc46) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - Add a balance type sync step to the new send flow, used by Aleo to refresh private records after the pool pick

- [#23360](https://github.com/LedgerHQ/ledger-live/pull/23360) [`a782d57`](https://github.com/LedgerHQ/ledger-live/commit/a782d57262cda0475c54417c8b769955df316e78) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Move the desktop Fear and Greed UI into the flow package

- [#22508](https://github.com/LedgerHQ/ledger-live/pull/22508) [`ad58765`](https://github.com/LedgerHQ/ledger-live/commit/ad58765b6151457022f8587d6ddcad3325ce96ac) Thanks [@pawell24](https://github.com/pawell24)! - fix(filecoin): open transactions on Blockscout from operation details

  Blockscout identifies a Filecoin message by its Ethereum-style hash, so the explorer link is now
  built from the message CID's digest instead of the CID itself.

- [#23423](https://github.com/LedgerHQ/ledger-live/pull/23423) [`c61cbe8`](https://github.com/LedgerHQ/ledger-live/commit/c61cbe8c4c383ff720812398f58907b5b6c3e982) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - fix(portfolio): show the Market 24h variation on assets whose balance did not change over the day (LIVE-39259)

- [#23389](https://github.com/LedgerHQ/ledger-live/pull/23389) [`03f4e70`](https://github.com/LedgerHQ/ledger-live/commit/03f4e70f38efc9362beae2e8ef12567cced3d3c6) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Extract address deletion into `@features/flow-contacts-delete-address` so Desktop and Mobile can reuse it without going through Contact Detail. Confirmation UI stays in `@features/platform-contacts`. Apps still own modal mounting, navigation, translations, and analytics.

- [#23459](https://github.com/LedgerHQ/ledger-live/pull/23459) [`2f9b7e9`](https://github.com/LedgerHQ/ledger-live/commit/2f9b7e97b8afee033e5fa194c5ca40a1f82a9b89) Thanks [@gre-ledger](https://github.com/gre-ledger)! - feat(account-data): full sync source on AccountBridge, serving no kind yet

- [#23270](https://github.com/LedgerHQ/ledger-live/pull/23270) [`8c5a730`](https://github.com/LedgerHQ/ledger-live/commit/8c5a730bd1e38e9305a1e99177b42e12011cd79f) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Remove the dev-only BYPASS_CORS workaround

- [#23058](https://github.com/LedgerHQ/ledger-live/pull/23058) [`214f7f1`](https://github.com/LedgerHQ/ledger-live/commit/214f7f183ea42a7b37663251db944ad61a3ad799) Thanks [@ishaba](https://github.com/ishaba)! - feat(tron): track the sponsored send funnel in Segment

- [#23240](https://github.com/LedgerHQ/ledger-live/pull/23240) [`ed10647`](https://github.com/LedgerHQ/ledger-live/commit/ed10647dedd2642ac5316f89595b618180097e33) Thanks [@dgreen-ledger](https://github.com/dgreen-ledger)! - feat(onboarding): show the onboarding warning modal on touchscreen devices

- [#23247](https://github.com/LedgerHQ/ledger-live/pull/23247) [`c18097b`](https://github.com/LedgerHQ/ledger-live/commit/c18097b2ae6fb06a530dc8a29fbfaac99ad7e942) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Load the market list with an RTK infinite query instead of React Query.

- [#23239](https://github.com/LedgerHQ/ledger-live/pull/23239) [`ade02b9`](https://github.com/LedgerHQ/ledger-live/commit/ade02b942ed12320573f0dab67f0a286b4c47533) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - Aleo new send flow descriptor and extended self transfer flow

- [#23425](https://github.com/LedgerHQ/ledger-live/pull/23425) [`8ebcf5c`](https://github.com/LedgerHQ/ledger-live/commit/8ebcf5c5507558750fb9f7980e9de4f0f5a637ce) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Aleo estimated signing time row on the new send flow Amount step

- [#23151](https://github.com/LedgerHQ/ledger-live/pull/23151) [`004d896`](https://github.com/LedgerHQ/ledger-live/commit/004d8965c325b6ff60d5a2ebcc1c763b7a7bf4d1) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Show and export QA onboarding logs with the device answers and the machine context, and toggle the deviceOnboarding flag from the devtool

- [#23234](https://github.com/LedgerHQ/ledger-live/pull/23234) [`c2c2f0a`](https://github.com/LedgerHQ/ledger-live/commit/c2c2f0a1b289dcef8e51f45ef6fe3c9f8418f045) Thanks [@LL782](https://github.com/LL782)! - Gate desktop launch on the shared app availability flow

- [#23510](https://github.com/LedgerHQ/ledger-live/pull/23510) [`cc970db`](https://github.com/LedgerHQ/ledger-live/commit/cc970db42cb0da0d21c6d862ac0eb5d3886bc80b) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Replace unmaintained listr with a minimal task runner in the dist script

- [#23102](https://github.com/LedgerHQ/ledger-live/pull/23102) [`4d77514`](https://github.com/LedgerHQ/ledger-live/commit/4d775144f5032153be92d736a2f029aeb1223280) Thanks [@sarneijim](https://github.com/sarneijim)! - Move the shared device onboarding machine to features/platform

- [#23509](https://github.com/LedgerHQ/ledger-live/pull/23509) [`3df619d`](https://github.com/LedgerHQ/ledger-live/commit/3df619dafffd7aea45cacb18d705aa291c4dcb47) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Remove unused allure-commandline dependency

- [#23503](https://github.com/LedgerHQ/ledger-live/pull/23503) [`bd6dbc5`](https://github.com/LedgerHQ/ledger-live/commit/bd6dbc515c1f64214be60c76498452ff9bd2e119) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - Allow Aleo token accounts to self-transfer between their public and private balances in the new send flow

- [#22782](https://github.com/LedgerHQ/ledger-live/pull/22782) [`014d4fd`](https://github.com/LedgerHQ/ledger-live/commit/014d4fd1d40ac1de41e55b0fb0bcef19be148367) Thanks [@KVNLS](https://github.com/KVNLS)! - Run the desktop renderer with `contextIsolation` and `sandbox` enabled, and without `nodeIntegration`.

  Previously any XSS, Live App escape or compromised dependency executing in the renderer had full Node available: `child_process`, arbitrary filesystem access, and unrestricted access to the account database files. The renderer now has none of that. It runs in its own JavaScript world inside an OS-level sandbox, and reaches the main process only through the allow-listed preload bridge, which exposes one method per operation rather than a generic `invoke(channel, ...)` passthrough. The renderer can still read and write its own `app` data through the bridge, as it must to work, and password attempts against the database are throttled in the main process; making encrypted fields unreadable while the app is locked is a separate follow-up.

  Live App `<webview>`s are checked before they are created: isolation, sandbox and web security are pinned, only the two webview preloads are accepted, and a disallowed `src` scheme blocks the webview. They also can no longer load local files, which the renderer could otherwise read back through `webview.loadURL()`.

  The three flags have to move together: `sandbox` has defaulted to true since Electron 20 and is auto-disabled only by `nodeIntegration`, so changing that one alone would silently sandbox the renderer _and_ strip Node from the preload.

  No data migration: `localStorage` is keyed by an origin that does not change, and both `app.json` and `lld.json` live in the main process either way.

- [#23550](https://github.com/LedgerHQ/ledger-live/pull/23550) [`589bae3`](https://github.com/LedgerHQ/ledger-live/commit/589bae35869b822c6337dd99b15f474119ea828c) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Revert the network selection when swapping from Market (#23182, #23299).

- [#23226](https://github.com/LedgerHQ/ledger-live/pull/23226) [`dd34e1b`](https://github.com/LedgerHQ/ledger-live/commit/dd34e1b8929faff2869d6d3a2366acc16c649229) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Shorten the device intent executor component names

- [#23003](https://github.com/LedgerHQ/ledger-live/pull/23003) [`57b4652`](https://github.com/LedgerHQ/ledger-live/commit/57b4652a1d0ae95af20419210139039642cedb9c) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Adapt to `@ledgerhq/coin-evm` 15

- [#23261](https://github.com/LedgerHQ/ledger-live/pull/23261) [`02b383b`](https://github.com/LedgerHQ/ledger-live/commit/02b383b7d11352d121556bb6f0a076c2b960b9eb) Thanks [@alexstapenka-ledger](https://github.com/alexstapenka-ledger)! - Add a withdraw icon to the earn action confirmation dialog, a `custom.dialog.menu` action menu dialog on desktop for the Earn "Earn more" / "Withdraw all" choice, and the `earnWithdrawV2` feature flag that gates the Earn full withdraw flow

### Patch Changes

- Updated dependencies [[`a86963c`](https://github.com/LedgerHQ/ledger-live/commit/a86963c2401573e3d5fef6b9623bae1e23126178), [`68c2837`](https://github.com/LedgerHQ/ledger-live/commit/68c2837d114092c6f421cfe5d5a97ce48d69667c), [`ec7b8b9`](https://github.com/LedgerHQ/ledger-live/commit/ec7b8b9f1c0821ffb9973a174bc2f693719215ab), [`1349df3`](https://github.com/LedgerHQ/ledger-live/commit/1349df3f6e9a27eeecc8495ca99a453341d7bf70), [`c9beaff`](https://github.com/LedgerHQ/ledger-live/commit/c9beaff3b51d3a50f310be73a830bf6e944e61fa), [`4831311`](https://github.com/LedgerHQ/ledger-live/commit/4831311fd859631a9248441e469f52c18fb42c52), [`9365d3a`](https://github.com/LedgerHQ/ledger-live/commit/9365d3ad499ac5c80d445e7816c30adbfe05ffd8), [`e15a91d`](https://github.com/LedgerHQ/ledger-live/commit/e15a91dca7d490f5c8d6d0dfdc8152a6f6e7ef0b), [`d6ab47c`](https://github.com/LedgerHQ/ledger-live/commit/d6ab47c28339866ad88ef0deba75d314c2f6c4f0), [`393a02a`](https://github.com/LedgerHQ/ledger-live/commit/393a02a42be9f0410b75c0c34203915bcde27e43), [`ef80ee4`](https://github.com/LedgerHQ/ledger-live/commit/ef80ee46eb564e25090ce08d8459212739158117), [`d1fb4fd`](https://github.com/LedgerHQ/ledger-live/commit/d1fb4fd3b5cdd83eaf479f9d09dca154099c90b4), [`a6e1e6a`](https://github.com/LedgerHQ/ledger-live/commit/a6e1e6a6049d43228224aba5df18ca3eab873b62), [`b641da8`](https://github.com/LedgerHQ/ledger-live/commit/b641da86d889e6e81278c5af70b16da216a19f92), [`ee508db`](https://github.com/LedgerHQ/ledger-live/commit/ee508db35d572d43e03cf58e811177cc3b2389a9), [`623f8e6`](https://github.com/LedgerHQ/ledger-live/commit/623f8e6181d92aed3a49aa993be9d4fe0bbd8e39), [`d2b8471`](https://github.com/LedgerHQ/ledger-live/commit/d2b84711b137f42930f006f7a079fc104c92633d), [`d2b8471`](https://github.com/LedgerHQ/ledger-live/commit/d2b84711b137f42930f006f7a079fc104c92633d), [`6032338`](https://github.com/LedgerHQ/ledger-live/commit/60323388dea6a0957aa836c73657b58d26765321), [`2ec955a`](https://github.com/LedgerHQ/ledger-live/commit/2ec955a5928085cff093d5c9a167f2761a055dcc), [`b0c722a`](https://github.com/LedgerHQ/ledger-live/commit/b0c722adc2665c1552b787636292314d03734c0b), [`e4e90c0`](https://github.com/LedgerHQ/ledger-live/commit/e4e90c06160288d2b6aa70706b741c410b413af6), [`05e5823`](https://github.com/LedgerHQ/ledger-live/commit/05e58230918a0d271774998c7bede69c88e6a186), [`6b23210`](https://github.com/LedgerHQ/ledger-live/commit/6b232105c11b8b8b86fcb6a715ef19a0b3453b74), [`bef895f`](https://github.com/LedgerHQ/ledger-live/commit/bef895fca53783545c564e6842b9069f936becf5), [`6582ee6`](https://github.com/LedgerHQ/ledger-live/commit/6582ee63c343dd6f64a31068fddd038af4eb9bd2), [`722c6f3`](https://github.com/LedgerHQ/ledger-live/commit/722c6f312e9fd8c33c932ef2f4df15d9062ade31), [`39529a8`](https://github.com/LedgerHQ/ledger-live/commit/39529a8a0df1a57d4e75218f098a4b367452627c), [`c32fa7b`](https://github.com/LedgerHQ/ledger-live/commit/c32fa7be07b04ef0db38e0877f18d613d32d087e), [`ead8b59`](https://github.com/LedgerHQ/ledger-live/commit/ead8b59eafe301b82efbe38bf6d2379b6e77b233), [`257305f`](https://github.com/LedgerHQ/ledger-live/commit/257305f907b207ac54e4e9bd9ace6a78ce554bb1), [`beea4cd`](https://github.com/LedgerHQ/ledger-live/commit/beea4cd9cccfbfa99a03bfb878f83353ef89d41c), [`f51fe16`](https://github.com/LedgerHQ/ledger-live/commit/f51fe16f67f2c50f36d772a60121ed3d7ae12c6a), [`fc846e5`](https://github.com/LedgerHQ/ledger-live/commit/fc846e53bbe5023223aa847b6e00b68fb22ace4a), [`b97096c`](https://github.com/LedgerHQ/ledger-live/commit/b97096ca3622ffa57e76423081b8855300f7a70d), [`b79ccab`](https://github.com/LedgerHQ/ledger-live/commit/b79ccab839cc7916ff3ecd910479904f87a6e59d), [`7b3040a`](https://github.com/LedgerHQ/ledger-live/commit/7b3040ad872c183fd2beb81a965037b5310ab87a), [`b599cb2`](https://github.com/LedgerHQ/ledger-live/commit/b599cb25afbc5ce2dbdcd0cc1b6126a49bba8068), [`3c062fc`](https://github.com/LedgerHQ/ledger-live/commit/3c062fccd90c705eee581800c0dd416f1b61ebe2), [`a5a6fa6`](https://github.com/LedgerHQ/ledger-live/commit/a5a6fa6267d17dcb3843358cd5b1f3b42e91ea4c), [`de8fe99`](https://github.com/LedgerHQ/ledger-live/commit/de8fe99f01d9d6248437fc8a914f12fc83d6e470), [`3527dbc`](https://github.com/LedgerHQ/ledger-live/commit/3527dbc69a05745b272741566b20634d79462cb8), [`80f99a8`](https://github.com/LedgerHQ/ledger-live/commit/80f99a819b13d3ec2bd39d896de46e0a433b9954), [`87b812e`](https://github.com/LedgerHQ/ledger-live/commit/87b812eb975719f788abb4fd315b6229259e8d6e), [`7da1ea9`](https://github.com/LedgerHQ/ledger-live/commit/7da1ea9534a1bdde063e31545363a27f0fdf5abb), [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574), [`2f9c159`](https://github.com/LedgerHQ/ledger-live/commit/2f9c1598145b8a7dadab43b12a5deb4ab9dc91c9), [`a654488`](https://github.com/LedgerHQ/ledger-live/commit/a654488d68942852ffa880a60ae674ff44a18918), [`6abfd98`](https://github.com/LedgerHQ/ledger-live/commit/6abfd98fd3d0359864687b2fc125390f3643a6db), [`2621f1e`](https://github.com/LedgerHQ/ledger-live/commit/2621f1ebe6c1a8f8cff0a797740771ae5fc084be), [`3ad1a61`](https://github.com/LedgerHQ/ledger-live/commit/3ad1a619eb1244d9adb8e4e67c250a2687716175), [`bcf98ff`](https://github.com/LedgerHQ/ledger-live/commit/bcf98ffbb1d119fba86c53e4c005abdad251b62a), [`75498cf`](https://github.com/LedgerHQ/ledger-live/commit/75498cf55065bccf17d09b780866ae031c01701a), [`ad6aad8`](https://github.com/LedgerHQ/ledger-live/commit/ad6aad8eec3a718da9359ad683350360f745d0d5), [`47e5b74`](https://github.com/LedgerHQ/ledger-live/commit/47e5b740cf64f177fd1cbbfa7f5bf74de3d45661), [`48d5c85`](https://github.com/LedgerHQ/ledger-live/commit/48d5c8543e70d0e4ee2fa30ea12590439f01f510), [`ff33162`](https://github.com/LedgerHQ/ledger-live/commit/ff331621a49337b1065c373f16aa479fa0ab5c8b), [`5e9a60a`](https://github.com/LedgerHQ/ledger-live/commit/5e9a60ac27b41be43d1ea24b0d11acec92260c49), [`7e54483`](https://github.com/LedgerHQ/ledger-live/commit/7e544837b934b55e0743faaabacfc89d922e9435), [`4ee8f78`](https://github.com/LedgerHQ/ledger-live/commit/4ee8f78997ca79d841bf0ba5642a4f2229cdbc46), [`e5762fc`](https://github.com/LedgerHQ/ledger-live/commit/e5762fc3dc7bb36007c8133efefeeb6523cebf05), [`a782d57`](https://github.com/LedgerHQ/ledger-live/commit/a782d57262cda0475c54417c8b769955df316e78), [`a02d06c`](https://github.com/LedgerHQ/ledger-live/commit/a02d06c1556ac855233d3b9b427cd812628a7aba), [`ad58765`](https://github.com/LedgerHQ/ledger-live/commit/ad58765b6151457022f8587d6ddcad3325ce96ac), [`c61cbe8`](https://github.com/LedgerHQ/ledger-live/commit/c61cbe8c4c383ff720812398f58907b5b6c3e982), [`03f4e70`](https://github.com/LedgerHQ/ledger-live/commit/03f4e70f38efc9362beae2e8ef12567cced3d3c6), [`2f9b7e9`](https://github.com/LedgerHQ/ledger-live/commit/2f9b7e97b8afee033e5fa194c5ca40a1f82a9b89), [`ff14496`](https://github.com/LedgerHQ/ledger-live/commit/ff14496257201991b52f0dd140e351fca3e84d4d), [`c9c482e`](https://github.com/LedgerHQ/ledger-live/commit/c9c482e9d4ec30bb05e60d00548c471f2d124163), [`e66d21e`](https://github.com/LedgerHQ/ledger-live/commit/e66d21ea7ccb706d718703b69d2133ede3294c1a), [`4fd1ebc`](https://github.com/LedgerHQ/ledger-live/commit/4fd1ebc94718ead589f235824f0440803341feb9), [`68cebc0`](https://github.com/LedgerHQ/ledger-live/commit/68cebc06f2ec8f4cc38ac1caca779317a8fe0711), [`214f7f1`](https://github.com/LedgerHQ/ledger-live/commit/214f7f183ea42a7b37663251db944ad61a3ad799), [`ed10647`](https://github.com/LedgerHQ/ledger-live/commit/ed10647dedd2642ac5316f89595b618180097e33), [`c18097b`](https://github.com/LedgerHQ/ledger-live/commit/c18097b2ae6fb06a530dc8a29fbfaac99ad7e942), [`ade02b9`](https://github.com/LedgerHQ/ledger-live/commit/ade02b942ed12320573f0dab67f0a286b4c47533), [`bcea51b`](https://github.com/LedgerHQ/ledger-live/commit/bcea51b0b2c9ef09b9e068f97ed3c67a0e45e188), [`2e198e2`](https://github.com/LedgerHQ/ledger-live/commit/2e198e2394723873a79e56635cfe21a2ab763454), [`3fadda7`](https://github.com/LedgerHQ/ledger-live/commit/3fadda73d3131279b8a318cf15a29778f62d15cd), [`8daaded`](https://github.com/LedgerHQ/ledger-live/commit/8daaded1316cb30dc1b3a8634301acc176ca97af), [`004d896`](https://github.com/LedgerHQ/ledger-live/commit/004d8965c325b6ff60d5a2ebcc1c763b7a7bf4d1), [`98c994b`](https://github.com/LedgerHQ/ledger-live/commit/98c994bc1f46a03366096531afac2471f07f397b), [`9887c8f`](https://github.com/LedgerHQ/ledger-live/commit/9887c8ffdb22ba87ccce7e8f1780e91ac78af640), [`df2068c`](https://github.com/LedgerHQ/ledger-live/commit/df2068c73926db98e3d0073abf3606db0df878eb), [`6639142`](https://github.com/LedgerHQ/ledger-live/commit/6639142cc619d0758ba7873dafbc3e32944f250f), [`96f2f30`](https://github.com/LedgerHQ/ledger-live/commit/96f2f30c368cf471698d4b48b18ac33a57c7b19a), [`2cd35c5`](https://github.com/LedgerHQ/ledger-live/commit/2cd35c5e21a9dfe58ca58349280f33266143ca51), [`4d77514`](https://github.com/LedgerHQ/ledger-live/commit/4d775144f5032153be92d736a2f029aeb1223280), [`307d5c0`](https://github.com/LedgerHQ/ledger-live/commit/307d5c0da2fc42ee1699e6b48073255276456dd6), [`37a49df`](https://github.com/LedgerHQ/ledger-live/commit/37a49df18649912157d8f269c3b4153d54b7817e), [`bd6dbc5`](https://github.com/LedgerHQ/ledger-live/commit/bd6dbc515c1f64214be60c76498452ff9bd2e119), [`0ace271`](https://github.com/LedgerHQ/ledger-live/commit/0ace2718ac29bc9926858af41424177ff3363d47), [`ca063c4`](https://github.com/LedgerHQ/ledger-live/commit/ca063c4cfad79f12118c5af5bc0ef323857f90bd), [`2c6e74a`](https://github.com/LedgerHQ/ledger-live/commit/2c6e74a12a542cb47507ec98ae85ace8fa526171), [`e345c82`](https://github.com/LedgerHQ/ledger-live/commit/e345c829b04e28d489b9cf4d8384ed57dbad0321), [`fb0ac6a`](https://github.com/LedgerHQ/ledger-live/commit/fb0ac6ab7d2e2b8c41c7b012b563c1286313ca70), [`696357f`](https://github.com/LedgerHQ/ledger-live/commit/696357f754751853758d67c88bf34df9302b9b97), [`a8d48a9`](https://github.com/LedgerHQ/ledger-live/commit/a8d48a97f1bae0c2adad5d2790c9cc8ab5d7c2b0), [`ed89930`](https://github.com/LedgerHQ/ledger-live/commit/ed89930df1e705c535e5c4cccd62033654f5a145), [`0d5c35d`](https://github.com/LedgerHQ/ledger-live/commit/0d5c35d9f29e17c3ad7bcb7632dcaea83d47e7d3), [`57b4652`](https://github.com/LedgerHQ/ledger-live/commit/57b4652a1d0ae95af20419210139039642cedb9c), [`b88647d`](https://github.com/LedgerHQ/ledger-live/commit/b88647dca4c613663bca4ba0d62c2296b95ac083), [`06b6724`](https://github.com/LedgerHQ/ledger-live/commit/06b672492a5c6a60c7ad181710a2411744c43d3f), [`4905dd1`](https://github.com/LedgerHQ/ledger-live/commit/4905dd1fc2625a07d2aa4e73461a12875466bbd6), [`02b383b`](https://github.com/LedgerHQ/ledger-live/commit/02b383b7d11352d121556bb6f0a076c2b960b9eb)]:
  - @shared/feature-flags@0.27.0-next.0
  - @features/flow-account-detail-settings@0.1.0-next.0
  - @features/flow-contacts-detail@0.2.0-next.0
  - @features/flow-contacts@0.15.0-next.0
  - @features/flow-pay-contact@0.7.0-next.0
  - @ledgerhq/coin-concordium@1.6.0-next.0
  - @ledgerhq/coin-zcash@1.0.0-next.0
  - @ledgerhq/live-common@38.4.0-next.0
  - @domain/entity-currency-crypto@0.16.0-next.0
  - @shared/app-config@0.1.0-next.0
  - @shared/env@0.11.0-next.0
  - @shared/auth@0.7.0-next.0
  - @ledgerhq/coin-bitcoin@1.0.0-next.0
  - @features/flow-account-detail@0.1.0-next.0
  - @features/flow-pay-card-details@0.8.0-next.0
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
  - @ledgerhq/wallet-btc@1.0.0-next.0
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
  - @features/platform-app-update@0.1.0-next.0
  - @features/platform-device-onboarding@0.2.0-next.0
  - @devtools/bindings@0.12.0-next.0
  - @ledgerhq/coin-casper@3.6.0-next.0
  - @ledgerhq/live-dmk-speculos@0.12.0-next.0
  - @features/flow-app-availability@0.2.0-next.0
  - @ledgerhq/live-dmk-shared@0.36.0-next.0
  - @ledgerhq/live-dmk-desktop@0.25.0-next.0
  - @ledgerhq/coin-canton@1.5.0-next.0
  - @features/flow-large-screen-upsell@2.2.3-next.0
  - @features/flow-pay-feature-tour@0.8.1-next.0
  - @features/platform-feature-flags@0.9.1-next.0
  - @features/platform-feature-flags-firebase@0.1.1-next.0
  - @features/flow-pay-bank-transfer@0.4.1-next.0
  - @features/flow-pay-card-auth@0.10.1-next.0
  - @ledgerhq/asset-detail@0.12.1-next.0
  - @ledgerhq/live-send@0.1.4-next.0
  - @domain/api-aggregated-assets@0.6.1-next.0
  - @domain/api-currency-token@0.6.5-next.0
  - @domain/api-market-countervalues@0.2.1-next.0
  - @domain/entity-contact@0.12.1-next.0
  - @domain/entity-currency@0.4.7-next.0
  - @domain/entity-currency-token@0.5.6-next.0
  - @ledgerhq/asset-aggregation@0.18.1-next.0
  - @ledgerhq/coin-cardano@2.0.1-next.0
  - @ledgerhq/live-wallet@1.1.7-next.0
  - @ledgerhq/wallet-analytics@0.5.2-next.0
  - @ledgerhq/wallet-pnl@0.8.1-next.0
  - @features/platform-aggregated-assets@0.5.7-next.0
  - @features/platform-env@0.4.3-next.0
  - @ledgerhq/transaction-observability@0.5.1-next.0
  - @shared/api-services@0.10.1-next.0
  - @features/flow-pay-card@0.7.1-next.0
  - @devtools/transport-panel@0.7.0
  - @domain/entity-account-alias@0.1.1-next.0
  - @domain/entity-account-name@0.2.3-next.0
  - @domain/entity-starred-account@0.0.2-next.0
  - @ledgerhq/live-signer-evm@0.24.2-next.0
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

- [#23017](https://github.com/LedgerHQ/ledger-live/pull/23017) [`eaff720`](https://github.com/LedgerHQ/ledger-live/commit/eaff72056535cd3d78ac4b0266fa9933b54c9a6e) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Show a concise message when adding an account fails because the provider returns a server or network error

- [#22909](https://github.com/LedgerHQ/ledger-live/pull/22909) [`29ead28`](https://github.com/LedgerHQ/ledger-live/commit/29ead2847f8227440eb1752984068a85cd0ab51e) Thanks [@LucasWerey](https://github.com/LucasWerey)! - fix(add-account): allow creating other BTC address types when the existing account is empty

- [#22981](https://github.com/LedgerHQ/ledger-live/pull/22981) [`3faf47c`](https://github.com/LedgerHQ/ledger-live/commit/3faf47c8c7d8daecb352f7dd32ef72c8d064ba0e) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Rename the market banner "View all" tile to "More" so it no longer gets cropped in longer languages.

- [#22971](https://github.com/LedgerHQ/ledger-live/pull/22971) [`f8a4b3e`](https://github.com/LedgerHQ/ledger-live/commit/f8a4b3e5f6e68cd507c74b7538247e0e5efc7a3a) Thanks [@LucasWerey](https://github.com/LucasWerey)! - fix(top-bar): keep a minimum width for the search and truncate the update pills on narrow windows

- [#23139](https://github.com/LedgerHQ/ledger-live/pull/23139) [`320d2a1`](https://github.com/LedgerHQ/ledger-live/commit/320d2a1fbbe0d661681913d75f76bd70c4698115) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Resolve the market id of an asset from the ledger ids when needed, so favorites added from search show up in the Market banner

- [#22519](https://github.com/LedgerHQ/ledger-live/pull/22519) [`d60f240`](https://github.com/LedgerHQ/ledger-live/commit/d60f240af5f814d887bb2df19db8415425b52317) Thanks [@semeano](https://github.com/semeano)! - feat(stacks): add desktop stake and unstake flows

  coin-stacks: `spendableBalance` now excludes locked (staked) STX for every Stacks account, matching `getBalance`, which lowers the Send max for accounts with a stake.

  coin-stacks: `validateIntent` rejects a stake during the pox-5 prepare phase (`StacksStakeInPreparePhase`), which the chain would abort while still charging the fee.

- [#22843](https://github.com/LedgerHQ/ledger-live/pull/22843) [`c954015`](https://github.com/LedgerHQ/ledger-live/commit/c954015d149a86adc8a1cdfcda41a71313171b68) Thanks [@semeano](https://github.com/semeano)! - feat(stacks): add mobile stake and unstake flows

- [#23143](https://github.com/LedgerHQ/ledger-live/pull/23143) [`4101467`](https://github.com/LedgerHQ/ledger-live/commit/4101467e60d17f1facfae9c71e5b684bcf9f48e3) Thanks [@LucasWerey](https://github.com/LucasWerey)! - refactor(contacts): clean up the Contacts debug tools

  The send-history contacts builder was copied in both apps. It now lives once in
  `@domain/entity-contact/schema.mock` as `mockContactsFromSendHistory`. `@features/platform-contacts`
  adds `parseExcludedCurrencyIdsInput`, which works like `parseEligibleAddressFamiliesInput`. The
  desktop tool no longer copies flag params into local state with effects. Its inputs show the flag
  value unless you are editing them, use `cn`, and have no hard-coded strings left. The mobile tool
  drops its `StyleSheet`, shows the families as tags, and builds the flag preview in its view model.

- [#23035](https://github.com/LedgerHQ/ledger-live/pull/23035) [`20bf9b0`](https://github.com/LedgerHQ/ledger-live/commit/20bf9b0c8694e9a3c873da1e81fd6b310410205c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Route every copy/paste through the new @shared/clipboard package (expo-clipboard replaces @react-native-clipboard/clipboard on mobile) and enforce it with lint rules; copy feedback now only shows once the copy succeeded

- [#23043](https://github.com/LedgerHQ/ledger-live/pull/23043) [`4028b7e`](https://github.com/LedgerHQ/ledger-live/commit/4028b7e53019ef07b2e94a6559c5f8a6ba54b82f) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Hold back a per-currency fee buffer when depositing the max of a native coin into perps, configured by the new `ptxTradeMaxConstant` flag (`feature_ptx_trade_max_constant`). Only the MAX ratio is reduced; token accounts and other ratios are unchanged.

- [#22860](https://github.com/LedgerHQ/ledger-live/pull/22860) [`21fa5a5`](https://github.com/LedgerHQ/ledger-live/commit/21fa5a533d3369db9586a38d6fa869f8c03121af) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Send the user back to the perps deposit form when they retry after a "not enough balance" error. Retrying re-ran the same deposit, which could only fail again; the form now reopens with the draft amount and funding account so the amount can be lowered. Other errors still retry in place

- [#22856](https://github.com/LedgerHQ/ledger-live/pull/22856) [`438c7b3`](https://github.com/LedgerHQ/ledger-live/commit/438c7b3035ac460e702d294a3c17db2843962d21) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Hide accounts that cannot send, such as HyperCore, from the perps deposit funding picker. The receiving HyperCore account was still offered as a funding source even though a deposit cannot be sent from it. The picker now opens in the `perpetuals:fund` flow, which rejects send-disabled families, so modular dialog analytics from that picker report `flow: "perpetuals:fund"`

- [#23182](https://github.com/LedgerHQ/ledger-live/pull/23182) [`0d31c6b`](https://github.com/LedgerHQ/ledger-live/commit/0d31c6b7e2b5cf09376d1e59fe025be5968ae560) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Open swap from Market only after the user has picked the network and account to swap from, whenever they hold an account on any of the asset's networks.

- [#22904](https://github.com/LedgerHQ/ledger-live/pull/22904) [`1696c5d`](https://github.com/LedgerHQ/ledger-live/commit/1696c5dd3149b658d71a51470ba1a723e1cff940) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Wrap Analytics PnL cards and balance header on narrow windows instead of overflowing horizontally

- [#22890](https://github.com/LedgerHQ/ledger-live/pull/22890) [`ee95a8e`](https://github.com/LedgerHQ/ledger-live/commit/ee95a8e0c4cdce091dfc1cb0e9b54445030f079c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - fix(cg-client): remove the unused CoinGecko supported coins list query

  Removes `getSupportedCoinsList`, `useGetSupportedCoinsListQuery`, `useSupportedCurrencies`, `MarketCoinSchema`, `SupportedCoinsSchema` and the `MarketCoin` / `SupportedCoins` types. `useMarketDataProvider` now only returns `supportedCounterCurrencies`.

- [#22920](https://github.com/LedgerHQ/ledger-live/pull/22920) [`c45454e`](https://github.com/LedgerHQ/ledger-live/commit/c45454e9d53bdb7fc8632dbe857a2cc80fac8aa6) Thanks [@LucasWerey](https://github.com/LucasWerey)! - fix(errors): stop reporting DMK and empty errors as TranslatedError invalid usage

- [#22866](https://github.com/LedgerHQ/ledger-live/pull/22866) [`52747b3`](https://github.com/LedgerHQ/ledger-live/commit/52747b3d876e34712619bd17206cd4aa23e07636) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Name the default Me contact "Me" in the Pay tab contacts list instead of "My addresses (Me)"

- [#23053](https://github.com/LedgerHQ/ledger-live/pull/23053) [`2a09181`](https://github.com/LedgerHQ/ledger-live/commit/2a091816a8ec716c0bba802767671052c75843e8) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Show each stablecoin as its own Pay balance filter option, including testnet holdings

- [#22988](https://github.com/LedgerHQ/ledger-live/pull/22988) [`7cfa427`](https://github.com/LedgerHQ/ledger-live/commit/7cfa427f8df0405cf6499657cbe3d5957d1e3509) Thanks [@LucasWerey](https://github.com/LucasWerey)! - fix(crypto-addresses): keep the rename dialog open while accounts sync or countervalues refresh

- [#23172](https://github.com/LedgerHQ/ledger-live/pull/23172) [`37f6895`](https://github.com/LedgerHQ/ledger-live/commit/37f68959c13c69794d734a66c143106f9b446a8f) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - fix(sidebar): reopen the sidebar after an automatic collapse

- [#22436](https://github.com/LedgerHQ/ledger-live/pull/22436) [`23455ab`](https://github.com/LedgerHQ/ledger-live/commit/23455abfdc26b44eedd77a1c990a6721dadd3f5c) Thanks [@ysitbon](https://github.com/ysitbon)! - Add the countervalues domain api: rate fetching, and the orchestration that folds rates into the entity state.

  - `@domain/api-market-countervalues` owns the Countervalues Service endpoints and `loadCountervalues`, which moves out of `@ledgerhq/live-countervalues`.
  - The endpoints are injected into the shared countervalues api from `@shared/api-services` instead of standing up a second slice. The duplicate client in live-common is removed, so each app registers one countervalues reducer where it previously registered two against the same host. That slice is an RTK Query cache and is not persisted, so there is no stored state to migrate.
  - `loadCountervalues` takes its rates as an argument rather than reaching for a module-level client. The apps compose one in the countervalues bridge they already own; tests pass a mock directly, which removes the `MOCK_COUNTERVALUES` dispatcher hidden inside the fetch path.
  - Rate failures carry the HTTP status through unchanged, so an unsupported pair still clears its cache on 422, an HTTP failure still increments the per-pair backoff, and an offline period still does not.
  - Rate requests keep the previous request policy: a 60s timeout, so a hung connection can no longer stall countervalues polling, and the same retries as before. The two endpoints moved out of live-common keep not retrying.
  - `@ledgerhq/live-countervalues` drops `loadCountervalues`, its `api` entry point and the fetch contract types, and with them its dependencies on `@ledgerhq/logs`, `@ledgerhq/live-network`, `@ledgerhq/live-promise` and `@ledgerhq/live-env`. It no longer reaches the network.
  - web-tools now registers the shared countervalues api, which its portfolio countervalues loading dispatches through.
  - `cvsApiExtra` takes `getCountervaluesServiceUrl`, a getter read on every request, in place of the `countervaluesServiceUrl` string read once at store creation. Switching the developer staging toggle now applies to the next countervalues request again, as it did before the rates moved onto the shared api.

- [#23173](https://github.com/LedgerHQ/ledger-live/pull/23173) [`55e5d67`](https://github.com/LedgerHQ/ledger-live/commit/55e5d67e920dbce854c5db338e1fa0b146da5181) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Show the full Assets column label in a tooltip when it is truncated

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

- [#22639](https://github.com/LedgerHQ/ledger-live/pull/22639) [`0c507ff`](https://github.com/LedgerHQ/ledger-live/commit/0c507ffb0964a6bfbd221ecd83f00d0259921ada) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Update @ledgerhq/coin-evm to 9.0.1 and pass a logger to its APIs

- [#22599](https://github.com/LedgerHQ/ledger-live/pull/22599) [`d819300`](https://github.com/LedgerHQ/ledger-live/commit/d819300df11d1e58ad33dbb8d0dbdb6f20c8dd93) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Add failureType and subError properties to Device Intent Executor deviceflow_failed and deviceflow_aborted events

- [#22418](https://github.com/LedgerHQ/ledger-live/pull/22418) [`48874b3`](https://github.com/LedgerHQ/ledger-live/commit/48874b3b33c83b40f7c2c389f7a84ebe96d58816) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add desktop E2E coverage for creating a contact, registering Ethereum addresses on the device and deleting both, and let device intents discover Speculos.

- [#23021](https://github.com/LedgerHQ/ledger-live/pull/23021) [`3dacfc2`](https://github.com/LedgerHQ/ledger-live/commit/3dacfc29377ad8a8ac25ad51f2207c882491bb7e) Thanks [@fAnselmi-Ledger](https://github.com/fAnselmi-Ledger)! - Bump `@ledgerhq/device-management-kit` to 1.11.0 and `@ledgerhq/dmk-ledger-wallet` to 0.7.0.

- [#23246](https://github.com/LedgerHQ/ledger-live/pull/23246) [`71c5860`](https://github.com/LedgerHQ/ledger-live/commit/71c58602037e7dc69e35b99fb648c11e365adcd1) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Bump `@ledgerhq/dmk-ledger-wallet` to 0.7.1, `@ledgerhq/device-transport-kit-speculos` to 1.3.0 and `@ledgerhq/speculos-device-controller` to 0.4.0.

- [#23083](https://github.com/LedgerHQ/ledger-live/pull/23083) [`4c28d72`](https://github.com/LedgerHQ/ledger-live/commit/4c28d726d50493ed3967c1a7eb84392442dfbeb9) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump `@ledgerhq/ledger-key-ring-protocol`, `@ledgerhq/hw-ledger-key-ring-protocol` to 1.0.0 and `@ledgerhq/evm-tools` to 2.0.0 (ts-libs). No API change.

- [#23184](https://github.com/LedgerHQ/ledger-live/pull/23184) [`3dda070`](https://github.com/LedgerHQ/ledger-live/commit/3dda0705f09d0e0da75ebde9a76b17ba7a9f65e6) Thanks [@CremaFR](https://github.com/CremaFR)! - Retry a swap up to twice, without showing the error, when the Exchange app rejects the provider signature (`signVerificationFail` at `CHECK_TRANSACTION_SIGNATURE`). `executeSwap` requests a new nonce and calls `/swap` again with the same parameters. Each rejected attempt is still reported to `/swap/cancelled`, with the attempt in the error message: `Signature verification failed Code: R0` for the first attempt, then `R1` and `R2` for the retries. This replaces the `[diagnostic=…]` signature classification, which is removed

- [#22745](https://github.com/LedgerHQ/ledger-live/pull/22745) [`db3bde1`](https://github.com/LedgerHQ/ledger-live/commit/db3bde1a0ea2435389260b012d9759dd26f7b174) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Canton: hide Accept once an offer expires while the screen is open, and show a clear message instead of retry when accepting an expired offer

- [#23008](https://github.com/LedgerHQ/ledger-live/pull/23008) [`ac0379e`](https://github.com/LedgerHQ/ledger-live/commit/ac0379ea0511dd457d6bba6a540d48b8358f4f93) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(send): show a broadcast error on the new send flow confirmation and only offer to try again for temporary errors (network, server, locked device)

- [#22387](https://github.com/LedgerHQ/ledger-live/pull/22387) [`3dd4ee2`](https://github.com/LedgerHQ/ledger-live/commit/3dd4ee274f5743d62820d1c37f7b1ac8830bf4ea) Thanks [@lysyi3m](https://github.com/lysyi3m)! - feat(concordium): link the PLT support article from the token list and Receive alert

- [#22811](https://github.com/LedgerHQ/ledger-live/pull/22811) [`3132a4a`](https://github.com/LedgerHQ/ledger-live/commit/3132a4aba419be9a91320295d8c0260f3509f9bd) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Consume `@ledgerhq/ledger-key-ring-protocol` and `@ledgerhq/hw-ledger-key-ring-protocol` from npm (they now live in `ts-libs`), and bump `axios` to 1.20.0. No API change.

- [#22657](https://github.com/LedgerHQ/ledger-live/pull/22657) [`932097d`](https://github.com/LedgerHQ/ledger-live/commit/932097d4a1a5c9e26848a8de0120667f8c14557a) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Cover on-device contact rename in desktop E2E against the mock server, which keeps the OS available after the device leaves the Ethereum app.

- [#22930](https://github.com/LedgerHQ/ledger-live/pull/22930) [`5f07a43`](https://github.com/LedgerHQ/ledger-live/commit/5f07a4399d54e6ebccb953045324d8ec5b571ad3) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Keep the Ledger Wallet addresses entry at full height in the desktop contact detail on small windows, and let the empty detail scroll with the custom scrollbar (LIVE-38297).

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

- [#21799](https://github.com/LedgerHQ/ledger-live/pull/21799) [`2c4e8cb`](https://github.com/LedgerHQ/ledger-live/commit/2c4e8cb37989c3fb5e2b986983172d18179f4fe8) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(lwd): fix modal height on send flow

- [#22722](https://github.com/LedgerHQ/ledger-live/pull/22722) [`03aa2c9`](https://github.com/LedgerHQ/ledger-live/commit/03aa2c92492d3056d04d7e5b7f6e92504771aded) Thanks [@LL782](https://github.com/LL782)! - Import shared analytics directly in Desktop, coin-integration code

- [#22744](https://github.com/LedgerHQ/ledger-live/pull/22744) [`5879819`](https://github.com/LedgerHQ/ledger-live/commit/58798197564fb4a6599ab214a3dde6211af98758) Thanks [@ysitbon](https://github.com/ysitbon)! - Import the countervalues logic, types and helpers from `@domain/entity-market-countervalues` instead of `@ledgerhq/live-countervalues`, and drop the legacy dependency. Specifier change only, no behaviour change.

- [#22950](https://github.com/LedgerHQ/ledger-live/pull/22950) [`d1eeaab`](https://github.com/LedgerHQ/ledger-live/commit/d1eeaabf43a54a3d2c4796ea1c5b11a0b9202814) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Stop setting the USER_ID env on desktop, now that the firmware checks read the user ID from the identities store

- [#22789](https://github.com/LedgerHQ/ledger-live/pull/22789) [`8569110`](https://github.com/LedgerHQ/ledger-live/commit/856911057bd1309ae676157825f46f6277968758) Thanks [@LL782](https://github.com/LL782)! - Remove stale analytics shim mocks and docs

- [#22726](https://github.com/LedgerHQ/ledger-live/pull/22726) [`e21564c`](https://github.com/LedgerHQ/ledger-live/commit/e21564cb145e409a90b18806f8b4acbda0da0aca) Thanks [@LL782](https://github.com/LL782)! - Import shared analytics directly in engagement Desktop code

- [#22724](https://github.com/LedgerHQ/ledger-live/pull/22724) [`46fe382`](https://github.com/LedgerHQ/ledger-live/commit/46fe382b4e7bff37473591e62ae81834ec58da4d) Thanks [@LL782](https://github.com/LL782)! - Import shared analytics directly in live-devices Desktop code

- [#22804](https://github.com/LedgerHQ/ledger-live/pull/22804) [`948cc81`](https://github.com/LedgerHQ/ledger-live/commit/948cc8108b5be9f55a11f1f74705deab442f0069) Thanks [@ysitbon](https://github.com/ysitbon)! - fix(desktop): build nightlies against the production Firebase project

  Desktop nightlies compiled the whole `.env.staging`, so they read feature flags from the Firebase
  staging project while mobile nightlies read production. Nightlies keep the staging services (Braze,
  Segment, Earn, Card, Datadog) but now take their `FIREBASE_*` values from `.env.production`.

- [#22859](https://github.com/LedgerHQ/ledger-live/pull/22859) [`c4cf243`](https://github.com/LedgerHQ/ledger-live/commit/c4cf243161fafa9c1a77ec661983e780e505ba87) Thanks [@sarneijim](https://github.com/sarneijim)! - Port device onboarding into desktop DevTools

- [#22727](https://github.com/LedgerHQ/ledger-live/pull/22727) [`5b11a5a`](https://github.com/LedgerHQ/ledger-live/commit/5b11a5ae9e06003fc7bae51b6799eaacedba69c6) Thanks [@LL782](https://github.com/LL782)! - Import shared analytics directly in platform Desktop code

- [#22935](https://github.com/LedgerHQ/ledger-live/pull/22935) [`8e427a6`](https://github.com/LedgerHQ/ledger-live/commit/8e427a6392d28ec9b79c3f805e8da3fb70e13f54) Thanks [@ysitbon](https://github.com/ysitbon)! - Read the countervalues provider and hooks, `useUsdToFiatRate` and `useGetCounterValueIdsPolling` from `@features/platform-market-countervalues` instead of `@ledgerhq/live-countervalues-react` and live-common, and drop the `@ledgerhq/live-countervalues-react` dependency. The app and the test wrapper now mount the platform provider in place of the old one.

- [#22662](https://github.com/LedgerHQ/ledger-live/pull/22662) [`487620c`](https://github.com/LedgerHQ/ledger-live/commit/487620c67a0ffa66fbcb401fed42bddcc150c24e) Thanks [@LL782](https://github.com/LL782)! - Import shared analytics directly in ptx Desktop code

- [#22725](https://github.com/LedgerHQ/ledger-live/pull/22725) [`a4c1969`](https://github.com/LedgerHQ/ledger-live/commit/a4c19695650db22bcf3bded692bc1e71bd03f785) Thanks [@LL782](https://github.com/LL782)! - Import shared analytics directly in recover-software Desktop code

- [#23012](https://github.com/LedgerHQ/ledger-live/pull/23012) [`1289c30`](https://github.com/LedgerHQ/ledger-live/commit/1289c30bce53f7713e666329818893a11f866277) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Remove the HTTP proxy device transport (`DEVICE_PROXY_URL`) from the desktop app, together with its IPC transport and the `window.lld.transport` bridge. Real devices and Speculos connect from the renderer through the Device Management Kit.

- [#22694](https://github.com/LedgerHQ/ledger-live/pull/22694) [`d9d44dc`](https://github.com/LedgerHQ/ledger-live/commit/d9d44dcb6c7584d9e135c5732eef7ff0f97beb82) Thanks [@LL782](https://github.com/LL782)! - Import shared analytics directly in wallet-xp Desktop code

- [#23219](https://github.com/LedgerHQ/ledger-live/pull/23219) [`c50dc4d`](https://github.com/LedgerHQ/ledger-live/commit/c50dc4d1551af01e4eb9e2fe912608e245ef1ead) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(send): resizeobserver amount fix

- [#22803](https://github.com/LedgerHQ/ledger-live/pull/22803) [`0e3e7b0`](https://github.com/LedgerHQ/ledger-live/commit/0e3e7b023b7b285a955bb2aabb308d143d47bfba) Thanks [@ysitbon](https://github.com/ysitbon)! - fix(feature-flags): show the Firebase project the build actually targets

  The debug feature flags screen read the project name from the `firebaseEnvironmentReadOnly`
  remote flag, a value set by hand in each Firebase project, so a staging build reported
  `ledger-live-production`. It now reads the project id from the Firebase config bundled in the
  build.

- [#22795](https://github.com/LedgerHQ/ledger-live/pull/22795) [`ff5e1b0`](https://github.com/LedgerHQ/ledger-live/commit/ff5e1b0f5a315aaccd3e23aeb8ccd2c7d48730f4) Thanks [@ysitbon](https://github.com/ysitbon)! - refactor(feature-flags): move the Firebase Remote Config mapping to `@features/platform-feature-flags-firebase`

  `@features/platform-feature-flags` now only exposes resolved flag state (hooks and `FeatureToggle`). `formatToFirebaseFeatureId`, `formatDefaultFeatures`, `parseFirebaseFeatures` and `RemoteConfigValue` are imported from `@features/platform-feature-flags-firebase` instead; the `./firebase` subpath is removed. No behavior change.

- [#22352](https://github.com/LedgerHQ/ledger-live/pull/22352) [`c7e76f3`](https://github.com/LedgerHQ/ledger-live/commit/c7e76f3a015cf00cfdb1d057d1eee85ea6e99dc0) Thanks [@ishaba](https://github.com/ishaba)! - fix(babylon): remove pre-selected validator, default to show all

- [#22950](https://github.com/LedgerHQ/ledger-live/pull/22950) [`dccba0c`](https://github.com/LedgerHQ/ledger-live/commit/dccba0c7481c705b4a295942171891deff1c0e85) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Compute the firmware distribution salt of the non-DMK firmware update checks from the identities store instead of the USER_ID env, so they use the same salt as the DMK

- [#22591](https://github.com/LedgerHQ/ledger-live/pull/22591) [`828c892`](https://github.com/LedgerHQ/ledger-live/commit/828c892019cab180b5a5024b03dc82987af695b2) Thanks [@sarneijim](https://github.com/sarneijim)! - Apply enabled `feature_copy_*` Remote Config values as English copy overrides, reusing the feature-flag fetch

- [#22913](https://github.com/LedgerHQ/ledger-live/pull/22913) [`6bb4b44`](https://github.com/LedgerHQ/ledger-live/commit/6bb4b44d94a29c3eb8eaffaafda55ca9d6934e2b) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat(hedera): migrate desktop Hedera flows to the generic transaction shape and enable generic adapter

- [#22784](https://github.com/LedgerHQ/ledger-live/pull/22784) [`e72683b`](https://github.com/LedgerHQ/ledger-live/commit/e72683b8ed45df73659811db2ef15a18b4e0927c) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Hide the Pay tab card and its history when the pay-tab flag's card param is false

- [#22985](https://github.com/LedgerHQ/ledger-live/pull/22985) [`4182256`](https://github.com/LedgerHQ/ledger-live/commit/4182256c2213208e330861b904a6d8859d1b3e60) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix(hedera): generic adapter fixes for fee estimation, wallet API memo, token association wording, token receive and swap history saved by the legacy bridge

- [#22640](https://github.com/LedgerHQ/ledger-live/pull/22640) [`8783545`](https://github.com/LedgerHQ/ledger-live/commit/87835456704c2322a25339ef27ef92a320d02025) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(contacts): stop reading `ethereumLikeInfo` and promote `chainId` from coin config

- [#22779](https://github.com/LedgerHQ/ledger-live/pull/22779) [`9c8a8f3`](https://github.com/LedgerHQ/ledger-live/commit/9c8a8f3c8952094908a8593c5f8894266f22d0a7) Thanks [@KVNLS](https://github.com/KVNLS)! - The desktop app's own device animations are code-split per device model and loaded lazily instead of being read back through a runtime `require()`. The shared pin/continue animations are still bundled with the renderer.

- [#22395](https://github.com/LedgerHQ/ledger-live/pull/22395) [`39d91b6`](https://github.com/LedgerHQ/ledger-live/commit/39d91b68fa8b7ad7625887fee6ff126c131eaf34) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(tracking): tracking error and warning in new send flow lwm

- [#22743](https://github.com/LedgerHQ/ledger-live/pull/22743) [`4d9cfbd`](https://github.com/LedgerHQ/ledger-live/commit/4d9cfbd7eff1fb20fb2052b0a2f2b21ea87ba052) Thanks [@ysitbon](https://github.com/ysitbon)! - Import the countervalues logic, types, helpers and mocks from `@domain/entity-market-countervalues` instead of `@ledgerhq/live-countervalues`, and depend on the entity package in place of the legacy one. Specifier change only, no behaviour change.

  Three app tests move with live-common because the `calculate` they mock is called inside live-common: desktop's `useHistoryOperations` and mobile's `useOperationsListViewModel` and `useOperationsV1`. Their mock has to name the same module live-common imports.

- [#23097](https://github.com/LedgerHQ/ledger-live/pull/23097) [`9bffec1`](https://github.com/LedgerHQ/ledger-live/commit/9bffec14b310816bb0091c04f3c220a173de74e8) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Move the updater signature check to `@features/platform-app-update`, so desktop no longer depends on `@noble/curves` directly.

- [#22975](https://github.com/LedgerHQ/ledger-live/pull/22975) [`11cc5fc`](https://github.com/LedgerHQ/ledger-live/commit/11cc5fcefd5c493d15dde20dd60f113211adaacd) Thanks [@ovoronkov-ledger](https://github.com/ovoronkov-ledger)! - Fix Market list and coin page showing the Settings currency symbol next to prices fetched in the currency picked from the Market dropdown

- [#22969](https://github.com/LedgerHQ/ledger-live/pull/22969) [`fb02fb0`](https://github.com/LedgerHQ/ledger-live/commit/fb02fb00d21b2fda4c1e0d6194db33b7fe0d2f93) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Show the mock server device as a floating window from `@ledgerhq/device-mockserver-react`, replacing the sidebar device screen.

- [#22808](https://github.com/LedgerHQ/ledger-live/pull/22808) [`bac3334`](https://github.com/LedgerHQ/ledger-live/commit/bac3334a1c58495722e2c5a123c7d2a26b0c8d7d) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Upgrade @ledgerhq/coin-evm to version 10.0.0 and remove obsolete gas tracker parameters

- [#22765](https://github.com/LedgerHQ/ledger-live/pull/22765) [`e3e6c22`](https://github.com/LedgerHQ/ledger-live/commit/e3e6c222ddba748a7e9e03e85f5919ce8e5c28bd) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Extract the device discovery service and the connectivity types shared by device connection flows into a `deviceConnectivity` folder. The discovery, connection and unknown error UI states now use the shared `ConnectivityUIStateTypes` enum. `ConnectDeviceUIStateTypes` becomes a const object that includes these shared members, so type positions use `typeof ConnectDeviceUIStateTypes.X` or the new `ConnectDeviceUIStateType` type. The device type moves to the shared part as `Device`, and connectDevice keeps `KnownDevice` as an alias of it. connectDevice behaviour is unchanged.

- [#22915](https://github.com/LedgerHQ/ledger-live/pull/22915) [`957f451`](https://github.com/LedgerHQ/ledger-live/commit/957f4516e6446f8179de0021b1c0265ef2bcd615) Thanks [@dgreen-ledger](https://github.com/dgreen-ledger)! - Require a genuine-checked device ID before the sync onboarding companion

- [#22695](https://github.com/LedgerHQ/ledger-live/pull/22695) [`570a8a0`](https://github.com/LedgerHQ/ledger-live/commit/570a8a0827e524ae18a7d216263d8ccb5a2c17b8) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add a Pay tab screen test id and cover the stablecoin balance, filter, and deposit options

- [#22878](https://github.com/LedgerHQ/ledger-live/pull/22878) [`d098cd3`](https://github.com/LedgerHQ/ledger-live/commit/d098cd3ce7f0009de59bab78cba0d8f397bb6b4d) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Show a "Go to CL Card" disclaimer below the Pay contacts when the `card_disclaimer` param of `lwdPayTab` is on. It opens the same CL Card webview as "I have a card" on the Card screen.

- [#22879](https://github.com/LedgerHQ/ledger-live/pull/22879) [`77e7162`](https://github.com/LedgerHQ/ledger-live/commit/77e716257785645b79027b580fcef2dfbab7ad3b) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Show the Card login on the desktop Pay tab when the `card_live_app` param of `lwdPayTab` is on. "Create an account" opens the card program live app and "Log in" opens the CL Card live app.

- [#22876](https://github.com/LedgerHQ/ledger-live/pull/22876) [`d5de868`](https://github.com/LedgerHQ/ledger-live/commit/d5de8686938f48fb517060a23fcba8f54558a2cb) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Read the desktop Pay card face (native, live app, disclaimer) from one `usePayCardFace` hook.

- [#22910](https://github.com/LedgerHQ/ledger-live/pull/22910) [`177a5b4`](https://github.com/LedgerHQ/ledger-live/commit/177a5b413ca0348c78aca5cbdfca9340355f4b23) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Pay card login: name Monavate instead of Baanx in "Log in to" and "Card provided by".

- [#22649](https://github.com/LedgerHQ/ledger-live/pull/22649) [`514d6f9`](https://github.com/LedgerHQ/ledger-live/commit/514d6f937e082fa8b86d87bcf170cc2ec57d51e0) Thanks [@koda-apps](https://github.com/apps/koda-apps)! - Show a newly linked Card asset when the user comes back to Pay from Baanx.

- [#22877](https://github.com/LedgerHQ/ledger-live/pull/22877) [`f49824c`](https://github.com/LedgerHQ/ledger-live/commit/f49824c51b04078d3715daf6a03f40f046bc3272) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Send the live app webview Back button to Pay when the webview was opened from Pay with `fromPayTab` state.

- [#22869](https://github.com/LedgerHQ/ledger-live/pull/22869) [`eb65ce4`](https://github.com/LedgerHQ/ledger-live/commit/eb65ce49ea0fa2d2c44f79fd2b0f8de365ae5e53) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add feature-flag scenarios for the native Pay card, Card live app login, and CL Card disclaimer

- [#22027](https://github.com/LedgerHQ/ledger-live/pull/22027) [`10e4a67`](https://github.com/LedgerHQ/ledger-live/commit/10e4a67f1aeffc909e8f5153b9720f568140323b) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Default the Perps deposit funding account to the USDC account with the highest non-zero spendable balance

- [#22865](https://github.com/LedgerHQ/ledger-live/pull/22865) [`667d378`](https://github.com/LedgerHQ/ledger-live/commit/667d378b97e9102df009015e01fed6b49fd88b82) Thanks [@ysitbon](https://github.com/ysitbon)! - Add `@features/platform-market-countervalues`, the countervalues React glue: the provider, its context and the hooks reading it, plus `useUsdToFiatRate` and `useGetCounterValueIdsPolling`. It is a copy of `@ledgerhq/live-countervalues-react` and of the two live-common hooks, which keep their own until their consumers move over.

  - `@ledgerhq/live-countervalues-react` reads the platform package's `CountervaluesContext` instead of creating its own, so a provider from either package serves the hooks of both. It stops exporting `CountervaluesContext`, which nothing imported, and drops its unused `@ledgerhq/types-live` dependency.
  - The platform package depends on no logging library. Desktop and mobile hand it their logger with `setCountervaluesLogger` at app setup, next to the rate lookups.

- [#22654](https://github.com/LedgerHQ/ledger-live/pull/22654) [`78b38fb`](https://github.com/LedgerHQ/ledger-live/commit/78b38fb3820d3391c5c04812fee88c1c2a6e9289) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(send): sync account at the start of a send

- [#23150](https://github.com/LedgerHQ/ledger-live/pull/23150) [`4dec481`](https://github.com/LedgerHQ/ledger-live/commit/4dec481cf274c6db74c334e5a74df574a8d04f54) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Keep the device onboarding session in the machine context, follow a new session on reconnect, and let the host run the exit actions

- [#23297](https://github.com/LedgerHQ/ledger-live/pull/23297) [`2989e37`](https://github.com/LedgerHQ/ledger-live/commit/2989e37b80b8bfcaae549cc02aa6de189a69dfef) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(solana): refresh the blockhash after the device review to avoid "Blockhash not found"

- [#22766](https://github.com/LedgerHQ/ledger-live/pull/22766) [`b2792d8`](https://github.com/LedgerHQ/ledger-live/commit/b2792d8806411c2a35e1622109bee830c44a6cbc) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Show a setup state on the History card tab when the signed-in holder has not claimed a card yet.

- [#22978](https://github.com/LedgerHQ/ledger-live/pull/22978) [`8102f7d`](https://github.com/LedgerHQ/ledger-live/commit/8102f7dab7cea81bd30e74e19a3ee6fce9e47fe0) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Close the modular dialog, modals and drawer before handling any deeplink

- [#23114](https://github.com/LedgerHQ/ledger-live/pull/23114) [`bdf552d`](https://github.com/LedgerHQ/ledger-live/commit/bdf552d00d5cd02e392637749d6384c4ff0919e7) Thanks [@ypolishchuk-ledger](https://github.com/ypolishchuk-ledger)! - Bump Playwright from 1.60.0 to 1.63.0 and allure-playwright / allure-js-commons from 3.9.0 to 3.13.0

- [#22770](https://github.com/LedgerHQ/ledger-live/pull/22770) [`812d03f`](https://github.com/LedgerHQ/ledger-live/commit/812d03f74d4324c2b165d4fb67fb3b31834d2b67) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Resolve the Perps `custom.perps.deposit` request with the swap ID and quoted amount once the deposit is broadcast, and reject it when the user cancels. The deposit request now lives in `wallet-api/Perps/depositRequest` and is shared by desktop and mobile

- [#23024](https://github.com/LedgerHQ/ledger-live/pull/23024) [`c037aa8`](https://github.com/LedgerHQ/ledger-live/commit/c037aa854190763e8654b7bb38a4486f4207caa8) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Migrate desktop Add Account off pre-ldls onto Lumen and remove the React pre-ldls entry

- [#22896](https://github.com/LedgerHQ/ledger-live/pull/22896) [`a663e23`](https://github.com/LedgerHQ/ledger-live/commit/a663e23f97df77ee25be5c9b5f7abfa3649bcde1) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Remove unused react-ui components and switch the desktop token list checkbox to Lumen

- [#22830](https://github.com/LedgerHQ/ledger-live/pull/22830) [`8509abf`](https://github.com/LedgerHQ/ledger-live/commit/8509abfd9f96a5e845e9a5e6392081366d31760c) Thanks [@KVNLS](https://github.com/KVNLS)! - Move the desktop renderer's application database and device transport (HTTP proxy) access onto the preload bridge (`window.lld.db`, `window.lld.transport`), with one named method per operation. Password attempts against the account database are now throttled in the main process after five consecutive failures.

- [#22831](https://github.com/LedgerHQ/ledger-live/pull/22831) [`fa15dfc`](https://github.com/LedgerHQ/ledger-live/commit/fa15dfcb7c71eeacc13a98a3dd57d5bc5117406a) Thanks [@KVNLS](https://github.com/KVNLS)! - Move the auto-updater and deep-link channels and the remaining renderer IPC onto the preload bridge, in preparation for enabling `contextIsolation`.

  Updater status and deep links are pushed to the renderer through `on*` subscriptions that return an unsubscribe closure. App lifecycle, native dialogs, file operations, the screen-awake blocker and the `lld.json` store writes go through named bridge methods instead of `ipcRenderer`. Channel names and main-side payloads are unchanged.

  With this, the only renderer `ipcRenderer` call left is the Pay card PNG save, which moves onto the bridge with the other save dialogs in the next change. The only other `electron` imports outside main and the preload scripts are the three chokepoints introduced earlier — clipboard, `webFrame` and `shell.openExternal`, none of which are IPC — plus one type-only import.

  Log export now checks whether the save dialog was cancelled. `showSaveDialog` always resolves to an object, so the previous `if (path)` guard was always true and the export ran on cancel, relying on the main process to ignore a cancelled target. The observable behaviour is unchanged; the check now says what it means.

- [#22832](https://github.com/LedgerHQ/ledger-live/pull/22832) [`20dccb1`](https://github.com/LedgerHQ/ledger-live/commit/20dccb15b91c13f1e31a29f34bc4db4762f2bf0b) Thanks [@KVNLS](https://github.com/KVNLS)! - Move the desktop renderer's last Electron chokepoints (clipboard, `webFrame`, `shell.openExternal`) onto the preload bridge, and run the save dialogs in the main process. Main now keeps the chosen path for the log export, the operations CSV export and the Pay card PNG save, so the renderer can no longer hand an arbitrary path back to be written. The write handlers return `"saved" | "canceled" | "failed"`, so cancelling an export is no longer reported as an error. Main registers every IPC handler through the shared `CHANNELS` contract.

- [#22829](https://github.com/LedgerHQ/ledger-live/pull/22829) [`8c4ccbe`](https://github.com/LedgerHQ/ledger-live/commit/8c4ccbe0172c4cc1dc08e0384980545819a082c3) Thanks [@KVNLS](https://github.com/KVNLS)! - Prepare the desktop renderer for running without Node integration: remove dead IPC channels and Node-only globals (`global.localStorage`, `setImmediate` in the post-onboarding redirect), replace winston in the renderer with a minimal logger of the same surface, route clipboard, `webFrame`, dialogs and `os` through single-purpose modules, import and export local Live App manifests with a file input and a download instead of the filesystem, and give the dev-only Firebase diagnostic its per-project configs from the build instead of reading `.env` files at runtime. No behaviour change.

- [#22780](https://github.com/LedgerHQ/ledger-live/pull/22780) [`8d10218`](https://github.com/LedgerHQ/ledger-live/commit/8d10218395571eeed1ea4921fbae95b0e8c0ab2d) Thanks [@KVNLS](https://github.com/KVNLS)! - Add an explicit, allow-listed preload bridge (`window.lld`) for the desktop renderer, declared once in `src/bridge/contract.ts` and imported by both sides. Main captures a bootstrap snapshot (env, `os`, paths, distribution channel) that the renderer reads synchronously, `electron-store` moves into the main process, and the Datadog anonymizer reads its paths from the snapshot. The `CARD_SESSION_BOOTSTRAP` credential is kept out of the snapshot and handed over once per page load. The renderer still runs with `nodeIntegration` on; the bridge works in both modes, so this changes no behaviour on its own.

- [#22781](https://github.com/LedgerHQ/ledger-live/pull/22781) [`6c8bd31`](https://github.com/LedgerHQ/ledger-live/commit/6c8bd31900a6b6aa8987cc82f6d907bbc3611fc1) Thanks [@KVNLS](https://github.com/KVNLS)! - Build the desktop renderer as a web target instead of `electron-renderer`: Node builtins resolve at build time rather than as runtime `require()` calls, and the bundle has no externals. `process` reads are supplied from a snapshot captured in main at startup, deliberately not a `process/browser` polyfill, which would report `platform === "browser"`. A build-time guard fails the build on an unguarded `process` read or a bare `setImmediate`/`clearImmediate`, rather than letting it surface as a runtime crash.

  ZCash shielded sync receives its IPC channel through `setZCashIpcRenderer` instead of reaching for `electron`; the desktop app supplies it over the preload bridge.

  `@ledgerhq/transaction-observability` (the dApp intent's `app_version`) and `@features/platform-device-action-content` (the E2E animation switch) read `process.env` directly instead of `globalThis.process`, which the web-target renderer does not have.

- [#22902](https://github.com/LedgerHQ/ledger-live/pull/22902) [`240ce9c`](https://github.com/LedgerHQ/ledger-live/commit/240ce9cae739d97023cd9abebd5470b6dff2ed8d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - chore: replace react-key-handler with an in-house hook for the Ctrl+E logs export shortcut, which behaves the same and drops about 21 MB of dependencies.

- [#23140](https://github.com/LedgerHQ/ledger-live/pull/23140) [`b99f923`](https://github.com/LedgerHQ/ledger-live/commit/b99f923997846b785c348006c5b434104c04f4a2) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Play Lottie animations through the new `@shared/lottie` package: dotlottie on web (replacing the unmaintained `react-lottie` / `lottie-web`), `lottie-react-native` on mobile.

- [#22950](https://github.com/LedgerHQ/ledger-live/pull/22950) [`8737f89`](https://github.com/LedgerHQ/ledger-live/commit/8737f89e2b515ab518cbcdeacc064641c6f595be) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Keep the DMK firmware distribution salt in sync with the user ID of the identities store, so DMK flows follow the progressive OS rollout on desktop and mobile

- [#23183](https://github.com/LedgerHQ/ledger-live/pull/23183) [`271861f`](https://github.com/LedgerHQ/ledger-live/commit/271861f9a26c5a26fe82d0b1ccefd9f339e547d0) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - fix(sidebar): always start fully open after a reload or app restart

- [#22846](https://github.com/LedgerHQ/ledger-live/pull/22846) [`42d4dc2`](https://github.com/LedgerHQ/ledger-live/commit/42d4dc25044dceb9936c1907fb5ea0838fa0a64b) Thanks [@benruseau](https://github.com/benruseau)! - Add the apply updates sub-step to the OS updates orchestrator, covering the OSU install, the MCU flash loop and the final firmware install

  Wait out the device reboots each install and flash leaves behind, reconnecting under the same session id

  Add the restore backup step, which runs as the last tenth of the bar when it follows an update and on its own when there is nothing left to update

  Sync `BASE_SOCKET_URL` to the DMK secure channel WebSocket URL

- [#21839](https://github.com/LedgerHQ/ledger-live/pull/21839) [`6d744e0`](https://github.com/LedgerHQ/ledger-live/commit/6d744e0d30b4480282d35c359d096f3f6d6602af) Thanks [@YazhuEth](https://github.com/YazhuEth)! - `estimateFees` now returns the recipient token account, wallet address and input type of an SPL transfer alongside its fee, so the device screen names the destination; a recipient token account holding another token throws `SolanaTokenAccountHoldsAnotherToken`.

  `makeEmptyTokenAccount` now builds its id with `encodeTokenAccountId`, like the fourteen families that already do: the wallet-API placeholder previously used the contract address, so it matched no real sub-account id.

  Solana runs on the generic coin framework. The send and staking screens move onto the generic transaction shape, which names what it does — a mode, a memo, a stake account seed — instead of the nested command model the legacy bridge carried, and the apps now read it through one family module rather than reaching into the transaction themselves.

  The behaviours the legacy bridge produced are restored on the generic path: an incoming SPL transfer produces an operation, a stake withdrawal empties the account rather than signing a stale amount, opening a token account is charged its rent, sending the maximum to a new stake account leaves enough to unstake it later, the device confirmation screen lists every row the device itself shows, and a token account's frozen state and Token-2022 extensions are back on screen.

  A live app can again submit the four token and stake commands the wallet API defines, and a raw signature it gets back is hex, as the field it arrives in says. The device signer is selected through the family's own factory, so the `ldmkSolanaSigner` flag and the transaction-check option it carries keep deciding, as they did before. The mock bridge is rewritten on the coin module, so a mocked signature still yields a transaction the wallet API can deserialize.

- [#22304](https://github.com/LedgerHQ/ledger-live/pull/22304) [`e11e449`](https://github.com/LedgerHQ/ledger-live/commit/e11e449b3be2cd309d3d22769a8f8ac44422dc7a) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(tracking): tracking error and warning in new send flow lwd

- [#23112](https://github.com/LedgerHQ/ledger-live/pull/23112) [`7f0d867`](https://github.com/LedgerHQ/ledger-live/commit/7f0d867cc9f8715b9244979e42a035babe43d2ab) Thanks [@amaslakov](https://github.com/amaslakov)! - Harden the Tronify rent payment: Retry stays locked until a payment that may still land has expired, a rent price rise is shown and must be accepted before ordering again, a signed payment about to expire is refused before broadcast, and the unreachable contract-data failure is removed.

- [#23032](https://github.com/LedgerHQ/ledger-live/pull/23032) [`bcd25fd`](https://github.com/LedgerHQ/ledger-live/commit/bcd25fd87bda9e7e8b7c3ee2a243d3e241adc0b0) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - chore(live-dmk): remove the ldmkTransport feature flag

  `DeviceManagementKitProvider` on desktop no longer takes `ldmkTransportEnabled` and always provides
  the Device Management Kit. `useDeviceManagementKit` now returns a non-null `DeviceManagementKit` and
  throws outside the provider. The PayTab address verification always uses the Device Intent Executor,
  and the `isLDMKTransportEnabled` analytics property is removed.

- [#22710](https://github.com/LedgerHQ/ledger-live/pull/22710) [`da9651f`](https://github.com/LedgerHQ/ledger-live/commit/da9651fa484c969369df12d777003093b0f02d9c) Thanks [@jcchevalier-ledger](https://github.com/jcchevalier-ledger)! - Keep explorer requests on the same Cloudflare load-balancer origin by replaying the `__cflb` affinity cookie

- [#22059](https://github.com/LedgerHQ/ledger-live/pull/22059) [`91ac227`](https://github.com/LedgerHQ/ledger-live/commit/91ac22740fbf677ca481382eb55d2e4e12336d2a) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(cosmos): Migrate the desktop staking UI onto the generic path

- [#22760](https://github.com/LedgerHQ/ledger-live/pull/22760) [`4bab512`](https://github.com/LedgerHQ/ledger-live/commit/4bab512f050d8f4d49a7745104b278ec94dd1d20) Thanks [@ishaba](https://github.com/ishaba)! - Add the Tronify sponsored send to the desktop Send flow behind the `gasSponsorship` flag: a USDT transfer can pay its network fee with rented energy, signing the rent payment first, then the transfer once the energy is delivered on-chain.

- [#23031](https://github.com/LedgerHQ/ledger-live/pull/23031) [`3264580`](https://github.com/LedgerHQ/ledger-live/commit/3264580e247bbd35d774b33eae21cc7c2e87d105) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Pass `swapApiEnv` (`stg` | `prd`) to the Swap live app so it follows Wallet's Swap backend

  - Derived from the `SWAP_API_BASE` url via new `getSwapAPIEnv` helper in live-common
  - Unknown hosts (e.g. localhost) send nothing; the live app keeps its own default
  - Stop passing the full `swapApiBase` url; the live app no longer reads it

- [#22891](https://github.com/LedgerHQ/ledger-live/pull/22891) [`cc764ec`](https://github.com/LedgerHQ/ledger-live/commit/cc764ec269edef9640fb58ff4aa26b70bff8d3c7) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Open swap history from the `swap/history` deeplink, with the swap matching `swapId` opened

- [#23185](https://github.com/LedgerHQ/ledger-live/pull/23185) [`437d666`](https://github.com/LedgerHQ/ledger-live/commit/437d66634fd97401a91637013ceca7d473ea32fb) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Replace @react-native-community/netinfo with expo-network behind the new @shared/network-status package, and use it for the desktop network status

- [#22708](https://github.com/LedgerHQ/ledger-live/pull/22708) [`ad3303b`](https://github.com/LedgerHQ/ledger-live/commit/ad3303b835078606b3d3f87d66879263ed3cddfb) Thanks [@qperrot](https://github.com/qperrot)! - Let the Send flow dialog grow to fit its content so the Review button stays visible with long amount messages

- [#22959](https://github.com/LedgerHQ/ledger-live/pull/22959) [`b46294e`](https://github.com/LedgerHQ/ledger-live/commit/b46294ea1eae6f65647973efc8161b23e31ae668) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(contact): display contact in tx details lwd

- [#22953](https://github.com/LedgerHQ/ledger-live/pull/22953) [`f482212`](https://github.com/LedgerHQ/ledger-live/commit/f48221278738b5b3accf7199c23e6dd84c48c27e) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - chore(device): remove the legacy connectApp and the ldmkConnectApp feature flag

  `connectApp` and `connectManager` now always use the Device Management Kit device actions and fail
  with `DmkTransportRequired` on a non-DMK transport. `apps/inlineAppInstall`, `hw/isUpdateAvailable`
  and `DeviceManagementKitTransport.listenLegacyConnectApp` are removed.

- [#23223](https://github.com/LedgerHQ/ledger-live/pull/23223) [`0a5b68d`](https://github.com/LedgerHQ/ledger-live/commit/0a5b68d609355af795c6176a4ac30c5b7142c2eb) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix(hedera): skip association for erc-20 tokens in ReceiveWithAssociationModal and resolve the new association token in the legacy adapter

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

- Updated dependencies [[`320d2a1`](https://github.com/LedgerHQ/ledger-live/commit/320d2a1fbbe0d661681913d75f76bd70c4698115), [`5b62ecb`](https://github.com/LedgerHQ/ledger-live/commit/5b62ecb5c84b36099b4f29fcca9665431a468fb7), [`d60f240`](https://github.com/LedgerHQ/ledger-live/commit/d60f240af5f814d887bb2df19db8415425b52317), [`c954015`](https://github.com/LedgerHQ/ledger-live/commit/c954015d149a86adc8a1cdfcda41a71313171b68), [`4101467`](https://github.com/LedgerHQ/ledger-live/commit/4101467e60d17f1facfae9c71e5b684bcf9f48e3), [`20bf9b0`](https://github.com/LedgerHQ/ledger-live/commit/20bf9b0c8694e9a3c873da1e81fd6b310410205c), [`4028b7e`](https://github.com/LedgerHQ/ledger-live/commit/4028b7e53019ef07b2e94a6559c5f8a6ba54b82f), [`21fa5a5`](https://github.com/LedgerHQ/ledger-live/commit/21fa5a533d3369db9586a38d6fa869f8c03121af), [`438c7b3`](https://github.com/LedgerHQ/ledger-live/commit/438c7b3035ac460e702d294a3c17db2843962d21), [`ee95a8e`](https://github.com/LedgerHQ/ledger-live/commit/ee95a8e0c4cdce091dfc1cb0e9b54445030f079c), [`1bf1044`](https://github.com/LedgerHQ/ledger-live/commit/1bf1044e3eb3b57187bf6c837b17b4ed00f870cc), [`8376d49`](https://github.com/LedgerHQ/ledger-live/commit/8376d497d552cd4644e806afdfbd5323bf10a695), [`75e55ba`](https://github.com/LedgerHQ/ledger-live/commit/75e55ba31bb763cfae2e0d850fb76930854abb39), [`52747b3`](https://github.com/LedgerHQ/ledger-live/commit/52747b3d876e34712619bd17206cd4aa23e07636), [`2a09181`](https://github.com/LedgerHQ/ledger-live/commit/2a091816a8ec716c0bba802767671052c75843e8), [`5eca063`](https://github.com/LedgerHQ/ledger-live/commit/5eca063fe675ec5cb59cc96fffe4b67fcd7f3061), [`d6e7695`](https://github.com/LedgerHQ/ledger-live/commit/d6e7695bf15852c7b0cd2a97aa0a3a0c4d047d74), [`3f4e740`](https://github.com/LedgerHQ/ledger-live/commit/3f4e7409bfc66544165598c23cbc826001632f16), [`87de6a7`](https://github.com/LedgerHQ/ledger-live/commit/87de6a72f75df73aab99da6c420de00004bf7692), [`b9da45c`](https://github.com/LedgerHQ/ledger-live/commit/b9da45cd99b74603ac760b08cf748d60f9bb4a2f), [`6e3211f`](https://github.com/LedgerHQ/ledger-live/commit/6e3211f6c887211d4ecfbf58d909f49c31df6179), [`ef84a7c`](https://github.com/LedgerHQ/ledger-live/commit/ef84a7cac52080143934ebf01511d24a4dcaa0f3), [`20484ff`](https://github.com/LedgerHQ/ledger-live/commit/20484ff8d7cc0aab2e4b8448c7e8ce9ebf6840fe), [`f047501`](https://github.com/LedgerHQ/ledger-live/commit/f047501381efde857b48c1314d2de637fdce8ade), [`23455ab`](https://github.com/LedgerHQ/ledger-live/commit/23455abfdc26b44eedd77a1c990a6721dadd3f5c), [`94e247b`](https://github.com/LedgerHQ/ledger-live/commit/94e247bcaa49bd601951be6f39182ee26ed67ecc), [`bf29f88`](https://github.com/LedgerHQ/ledger-live/commit/bf29f888316e5d8d9049b763a8c77ce9850f07df), [`c9b7594`](https://github.com/LedgerHQ/ledger-live/commit/c9b75949c8f01cade6b061bd5b6ecb0af5b0ec5f), [`7a2505b`](https://github.com/LedgerHQ/ledger-live/commit/7a2505bd21cc2401e1e887cb5b9713281cb11519), [`abf8d33`](https://github.com/LedgerHQ/ledger-live/commit/abf8d33f65a4177d2ab8c727c2b53c2b4439c676), [`d33fd72`](https://github.com/LedgerHQ/ledger-live/commit/d33fd721a5d1a9363f820738f6aadbeb0a8b3cad), [`bc85ada`](https://github.com/LedgerHQ/ledger-live/commit/bc85ada15c9403d1180d5af23f730196fd0cc672), [`0c507ff`](https://github.com/LedgerHQ/ledger-live/commit/0c507ffb0964a6bfbd221ecd83f00d0259921ada), [`d819300`](https://github.com/LedgerHQ/ledger-live/commit/d819300df11d1e58ad33dbb8d0dbdb6f20c8dd93), [`48874b3`](https://github.com/LedgerHQ/ledger-live/commit/48874b3b33c83b40f7c2c389f7a84ebe96d58816), [`4c28d72`](https://github.com/LedgerHQ/ledger-live/commit/4c28d726d50493ed3967c1a7eb84392442dfbeb9), [`e308deb`](https://github.com/LedgerHQ/ledger-live/commit/e308deb3e4f812f01166de17bb28c587a290b9bb), [`01ee590`](https://github.com/LedgerHQ/ledger-live/commit/01ee5909821c32b21577295f03f57a970e8fad2f), [`3dda070`](https://github.com/LedgerHQ/ledger-live/commit/3dda0705f09d0e0da75ebde9a76b17ba7a9f65e6), [`db3bde1`](https://github.com/LedgerHQ/ledger-live/commit/db3bde1a0ea2435389260b012d9759dd26f7b174), [`e7996b4`](https://github.com/LedgerHQ/ledger-live/commit/e7996b4bb9f13726af09cc5202d26d1e471563ef), [`ac0379e`](https://github.com/LedgerHQ/ledger-live/commit/ac0379ea0511dd457d6bba6a540d48b8358f4f93), [`33467b2`](https://github.com/LedgerHQ/ledger-live/commit/33467b29525ab06b0abce96ed8489a61a01429c5), [`932097d`](https://github.com/LedgerHQ/ledger-live/commit/932097d4a1a5c9e26848a8de0120667f8c14557a), [`5f07a43`](https://github.com/LedgerHQ/ledger-live/commit/5f07a4399d54e6ebccb953045324d8ec5b571ad3), [`ca82e70`](https://github.com/LedgerHQ/ledger-live/commit/ca82e703691d6e9716b522180d402d7eed9abc5f), [`0f401bb`](https://github.com/LedgerHQ/ledger-live/commit/0f401bb6289b6e78fbd05b6f98977bde4999d22a), [`3347eb8`](https://github.com/LedgerHQ/ledger-live/commit/3347eb88f282e2286b43493dadb0a9dd3d1f81d5), [`21ab07f`](https://github.com/LedgerHQ/ledger-live/commit/21ab07f8912d9c7fa9fb7e438e4e7873ca674f02), [`9ddaa97`](https://github.com/LedgerHQ/ledger-live/commit/9ddaa970d609f4b54f0cdbbda0609242cca54cf7), [`e80d009`](https://github.com/LedgerHQ/ledger-live/commit/e80d009b57fbec125c43649fcc0b21edc60cb473), [`fa2c070`](https://github.com/LedgerHQ/ledger-live/commit/fa2c070913fb13e530c65d901151c2766c46caf6), [`d1eeaab`](https://github.com/LedgerHQ/ledger-live/commit/d1eeaabf43a54a3d2c4796ea1c5b11a0b9202814), [`eb23867`](https://github.com/LedgerHQ/ledger-live/commit/eb23867603dc4e80723cdfe5486c28bc88d57014), [`90e805d`](https://github.com/LedgerHQ/ledger-live/commit/90e805d9c1b0ef536d1e53489c73b88056731993), [`1f50e41`](https://github.com/LedgerHQ/ledger-live/commit/1f50e41fc85d46eec8ffdec4d27ab573a5cbb28e), [`3dae3bb`](https://github.com/LedgerHQ/ledger-live/commit/3dae3bb200941b7e8ed4e56485e401fda188de8b), [`ff5e1b0`](https://github.com/LedgerHQ/ledger-live/commit/ff5e1b0f5a315aaccd3e23aeb8ccd2c7d48730f4), [`7bf8668`](https://github.com/LedgerHQ/ledger-live/commit/7bf8668bea3ae36c1a5c176bc5538311bafbee3d), [`f5fa6e1`](https://github.com/LedgerHQ/ledger-live/commit/f5fa6e18fe429074cda26578f8b0c4642927e0d6), [`dccba0c`](https://github.com/LedgerHQ/ledger-live/commit/dccba0c7481c705b4a295942171891deff1c0e85), [`7ff8f5b`](https://github.com/LedgerHQ/ledger-live/commit/7ff8f5b518a19e73005ef974121ce21e593a8e99), [`826a87c`](https://github.com/LedgerHQ/ledger-live/commit/826a87c08f3757ed3b1fd63f217ed9493082811d), [`6bb4b44`](https://github.com/LedgerHQ/ledger-live/commit/6bb4b44d94a29c3eb8eaffaafda55ca9d6934e2b), [`9c9cae5`](https://github.com/LedgerHQ/ledger-live/commit/9c9cae5ab492b74d52b13e0a5b0673bd681f8d9d), [`c59fbf4`](https://github.com/LedgerHQ/ledger-live/commit/c59fbf41212398e3d0c1000c776d33c6344290a3), [`dd2d1f8`](https://github.com/LedgerHQ/ledger-live/commit/dd2d1f8965897befc6e49f041eeccc51deb9578c), [`b8fc9af`](https://github.com/LedgerHQ/ledger-live/commit/b8fc9af53fc59427695bb0fe81d11d46ef74742e), [`3a45eb3`](https://github.com/LedgerHQ/ledger-live/commit/3a45eb3e29f417f24570787e76d977cefa5090d9), [`29b0e0c`](https://github.com/LedgerHQ/ledger-live/commit/29b0e0c324494c21d82f5deb26f6774c3c5aca6f), [`4182256`](https://github.com/LedgerHQ/ledger-live/commit/4182256c2213208e330861b904a6d8859d1b3e60), [`0a65851`](https://github.com/LedgerHQ/ledger-live/commit/0a65851ea6de6228030a2c94f0cad2234903db2b), [`3444d16`](https://github.com/LedgerHQ/ledger-live/commit/3444d16d5159b6e415b4dd0ab4fedfbf4cbeb260), [`8783545`](https://github.com/LedgerHQ/ledger-live/commit/87835456704c2322a25339ef27ef92a320d02025), [`f3b3c1c`](https://github.com/LedgerHQ/ledger-live/commit/f3b3c1c8479c2ae12d6a57eef030b04b2e665483), [`4d9cfbd`](https://github.com/LedgerHQ/ledger-live/commit/4d9cfbd7eff1fb20fb2052b0a2f2b21ea87ba052), [`09db449`](https://github.com/LedgerHQ/ledger-live/commit/09db4497ad5e67c6510e87608d694bd06963213e), [`fb02fb0`](https://github.com/LedgerHQ/ledger-live/commit/fb02fb00d21b2fda4c1e0d6194db33b7fe0d2f93), [`bac3334`](https://github.com/LedgerHQ/ledger-live/commit/bac3334a1c58495722e2c5a123c7d2a26b0c8d7d), [`dad0153`](https://github.com/LedgerHQ/ledger-live/commit/dad01537ce5e0263964adcfaf762246003c527b4), [`82946e5`](https://github.com/LedgerHQ/ledger-live/commit/82946e53e676943851a8a9e153bafc641a40778b), [`f9ebcf6`](https://github.com/LedgerHQ/ledger-live/commit/f9ebcf6d2b79758ea43554977a8997df25c4e3b4), [`e3e6c22`](https://github.com/LedgerHQ/ledger-live/commit/e3e6c222ddba748a7e9e03e85f5919ce8e5c28bd), [`99f7c87`](https://github.com/LedgerHQ/ledger-live/commit/99f7c87afc8029eca9bf574df03123bf07ca7810), [`77e7162`](https://github.com/LedgerHQ/ledger-live/commit/77e716257785645b79027b580fcef2dfbab7ad3b), [`77e7162`](https://github.com/LedgerHQ/ledger-live/commit/77e716257785645b79027b580fcef2dfbab7ad3b), [`57921f9`](https://github.com/LedgerHQ/ledger-live/commit/57921f955b6c07389cb78d4c087c881667858dc2), [`1b78e74`](https://github.com/LedgerHQ/ledger-live/commit/1b78e7406cc6b871ebf50590a03f47848c1718a9), [`a99d63a`](https://github.com/LedgerHQ/ledger-live/commit/a99d63a75a8d02a14bdfef0eaaa249c3f92d1ced), [`4aa7793`](https://github.com/LedgerHQ/ledger-live/commit/4aa77939cec43fd1aac459689c372868dece3496), [`0e7d80a`](https://github.com/LedgerHQ/ledger-live/commit/0e7d80ad750683fd37a150fe36ef5add632072cd), [`5f7cc73`](https://github.com/LedgerHQ/ledger-live/commit/5f7cc73ec88df6e84e970818668adca6cf7e5fe2), [`eb65ce4`](https://github.com/LedgerHQ/ledger-live/commit/eb65ce49ea0fa2d2c44f79fd2b0f8de365ae5e53), [`aaedf56`](https://github.com/LedgerHQ/ledger-live/commit/aaedf5692e9c1407327d009fea8133e51ca48f26), [`c26bbea`](https://github.com/LedgerHQ/ledger-live/commit/c26bbea7477d27f6042657c3a3c48c05f85b1f59), [`667d378`](https://github.com/LedgerHQ/ledger-live/commit/667d378b97e9102df009015e01fed6b49fd88b82), [`f45fc80`](https://github.com/LedgerHQ/ledger-live/commit/f45fc8027562e53cdbd3500a2884084df6a4af8e), [`78b38fb`](https://github.com/LedgerHQ/ledger-live/commit/78b38fb3820d3391c5c04812fee88c1c2a6e9289), [`4dec481`](https://github.com/LedgerHQ/ledger-live/commit/4dec481cf274c6db74c334e5a74df574a8d04f54), [`2989e37`](https://github.com/LedgerHQ/ledger-live/commit/2989e37b80b8bfcaae549cc02aa6de189a69dfef), [`b2792d8`](https://github.com/LedgerHQ/ledger-live/commit/b2792d8806411c2a35e1622109bee830c44a6cbc), [`6f2ecf8`](https://github.com/LedgerHQ/ledger-live/commit/6f2ecf89dd1d978038f573738d6e85fe1805b5d9), [`18166fb`](https://github.com/LedgerHQ/ledger-live/commit/18166fbe8719d50c911aa0ab349e68c414f8fc62), [`339d174`](https://github.com/LedgerHQ/ledger-live/commit/339d17482fba108dfca790c2500c697a818f7a1c), [`3160fa7`](https://github.com/LedgerHQ/ledger-live/commit/3160fa7a2f2a6e121d15766609902e83f4efc71f), [`1a9b21e`](https://github.com/LedgerHQ/ledger-live/commit/1a9b21e6cc971d5e5b069cab968826b15332024b), [`812d03f`](https://github.com/LedgerHQ/ledger-live/commit/812d03f74d4324c2b165d4fb67fb3b31834d2b67), [`c037aa8`](https://github.com/LedgerHQ/ledger-live/commit/c037aa854190763e8654b7bb38a4486f4207caa8), [`dce4fb6`](https://github.com/LedgerHQ/ledger-live/commit/dce4fb6a4ec291153cc5b4d5a0d5000f777007e1), [`a663e23`](https://github.com/LedgerHQ/ledger-live/commit/a663e23f97df77ee25be5c9b5f7abfa3649bcde1), [`6c8bd31`](https://github.com/LedgerHQ/ledger-live/commit/6c8bd31900a6b6aa8987cc82f6d907bbc3611fc1), [`bed3cf9`](https://github.com/LedgerHQ/ledger-live/commit/bed3cf9bd880e00d51fc90849dca3741b9ab779f), [`5e611ff`](https://github.com/LedgerHQ/ledger-live/commit/5e611ffffdcf2c73fb55c8b673693dfa88d1077c), [`91ad9a0`](https://github.com/LedgerHQ/ledger-live/commit/91ad9a0e481e3935f80089a800293a4733aef450), [`2b2eee6`](https://github.com/LedgerHQ/ledger-live/commit/2b2eee6a4abfb86615f3e5a628f518b5a9c58dad), [`b99f923`](https://github.com/LedgerHQ/ledger-live/commit/b99f923997846b785c348006c5b434104c04f4a2), [`9717369`](https://github.com/LedgerHQ/ledger-live/commit/97173699dce7021d1c78713a72c4d79406324877), [`63c700c`](https://github.com/LedgerHQ/ledger-live/commit/63c700c28652b8a48e4ef57a6b73380b12434e61), [`8737f89`](https://github.com/LedgerHQ/ledger-live/commit/8737f89e2b515ab518cbcdeacc064641c6f595be), [`42d4dc2`](https://github.com/LedgerHQ/ledger-live/commit/42d4dc25044dceb9936c1907fb5ea0838fa0a64b), [`6d744e0`](https://github.com/LedgerHQ/ledger-live/commit/6d744e0d30b4480282d35c359d096f3f6d6602af), [`644071b`](https://github.com/LedgerHQ/ledger-live/commit/644071ba1aba85cdce57c423934be80f91639155), [`6756f58`](https://github.com/LedgerHQ/ledger-live/commit/6756f5881526607858dbc2ba3d8065e5453b2d5a), [`7073e2d`](https://github.com/LedgerHQ/ledger-live/commit/7073e2d835a79e3e014ca1a9631e73c1f21989c6), [`35d9396`](https://github.com/LedgerHQ/ledger-live/commit/35d9396f690292ae8efda27b24ac4143f03cd00b), [`c92c32e`](https://github.com/LedgerHQ/ledger-live/commit/c92c32e66d20de8a85454bf1fc444dadd3a51e76), [`77d202b`](https://github.com/LedgerHQ/ledger-live/commit/77d202b1930715ed30b62521fbc5692969b6ec47), [`9a39ad5`](https://github.com/LedgerHQ/ledger-live/commit/9a39ad5eeeaefff74791ec01db8c62c102b6e54a), [`7f0d867`](https://github.com/LedgerHQ/ledger-live/commit/7f0d867cc9f8715b9244979e42a035babe43d2ab), [`69284e8`](https://github.com/LedgerHQ/ledger-live/commit/69284e8fff6db3afdf4b0c05254214baa8e4762b), [`bcd25fd`](https://github.com/LedgerHQ/ledger-live/commit/bcd25fd87bda9e7e8b7c3ee2a243d3e241adc0b0), [`91ac227`](https://github.com/LedgerHQ/ledger-live/commit/91ac22740fbf677ca481382eb55d2e4e12336d2a), [`4bab512`](https://github.com/LedgerHQ/ledger-live/commit/4bab512f050d8f4d49a7745104b278ec94dd1d20), [`99b54cd`](https://github.com/LedgerHQ/ledger-live/commit/99b54cdac46807286d75caa1a94e61a37606c18f), [`3264580`](https://github.com/LedgerHQ/ledger-live/commit/3264580e247bbd35d774b33eae21cc7c2e87d105), [`f482212`](https://github.com/LedgerHQ/ledger-live/commit/f48221278738b5b3accf7199c23e6dd84c48c27e), [`766d1eb`](https://github.com/LedgerHQ/ledger-live/commit/766d1ebf51eccbbaefd0b3d47b07f3e3b8672775), [`3cdcba9`](https://github.com/LedgerHQ/ledger-live/commit/3cdcba9252780b413452cb100682cf08041d966e), [`0a5b68d`](https://github.com/LedgerHQ/ledger-live/commit/0a5b68d609355af795c6176a4ac30c5b7142c2eb), [`8312d68`](https://github.com/LedgerHQ/ledger-live/commit/8312d6818aa5fa37f523352f81f51a61dd502bf2), [`c5c2815`](https://github.com/LedgerHQ/ledger-live/commit/c5c2815ec53dbf88804e558952f1451f13c37bb4), [`b7cc410`](https://github.com/LedgerHQ/ledger-live/commit/b7cc41062a66145da018db31722d0df45ed98b1c), [`74a7067`](https://github.com/LedgerHQ/ledger-live/commit/74a706756e9009886a490052d0f3005c6837e8b1), [`33094bc`](https://github.com/LedgerHQ/ledger-live/commit/33094bc31d9d8cd7a80b8eae3cf2b4afe3afa500)]:
  - @ledgerhq/asset-detail@0.12.0
  - @ledgerhq/transaction-observability@0.5.0
  - @ledgerhq/coin-stacks@0.33.0
  - @ledgerhq/live-common@38.3.0
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
  - @ledgerhq/coin-zcash@0.11.0
  - @domain/entity-currency-crypto@0.15.0
  - @ledgerhq/wallet-btc@0.7.0
  - @ledgerhq/ledger-wallet-framework@3.7.0
  - @domain/api-market-countervalues@0.2.0
  - @domain/entity-market-countervalues@0.3.0
  - @shared/api-services@0.10.0
  - @ledgerhq/coin-cardano@2.0.0
  - @ledgerhq/types-live@6.127.0
  - @shared/env@0.10.0
  - @ledgerhq/live-dmk-shared@0.35.0
  - @ledgerhq/live-dmk-desktop@0.24.0
  - @ledgerhq/device-onboarding@0.5.0
  - @ledgerhq/coin-canton@1.4.0
  - @features/platform-card@0.8.0
  - @features/flow-pay-card-auth@0.10.0
  - @features/platform-content-ab-tests@0.2.0
  - @ledgerhq/coin-cosmos@1.6.0
  - @features/platform-market-countervalues@0.2.0
  - @ledgerhq/asset-aggregation@0.18.0
  - @ledgerhq/wallet-pnl@0.8.0
  - @domain/entity-client-identity@0.3.0
  - @features/platform-feature-flags-firebase@0.1.0
  - @features/platform-feature-flags@0.9.0
  - @domain/api-aggregated-assets@0.6.0
  - @features/flow-pay-feature-tour@0.8.0
  - @devtools/bindings@0.11.0
  - @features/flow-pay-card-details@0.7.0
  - @features/flow-pay-card@0.7.0
  - @ledgerhq/react-ui@0.56.0
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
  - @features/flow-pay-card-widget@0.5.1
  - @devtools/wire@0.5.1
  - @domain/entity-account@0.0.1
  - @domain/entity-account-alias@0.1.0
  - @domain/entity-account-name@0.2.2
  - @domain/entity-analytics-consent@0.2.2
  - @domain/entity-card-asset-mapping@0.7.0
  - @domain/entity-currency-fiat@0.4.0
  - @domain/entity-currency-unit@0.3.0
  - @domain/entity-interest-rate@0.3.0
  - @domain/entity-market-index-fear-and-greed@0.3.0
  - @domain/entity-recent-addresses@0.2.1
  - @domain/entity-starred-account@0.0.1
  - @domain/entity-wallet-sync@0.1.0
  - @features/flow-fear-and-greed@0.3.0
  - @features/platform-app-update@0.0.0
  - @features/platform-device-intent@5.2.0
  - @features/platform-pay-analytics@0.3.0
  - @features/platform-style@0.4.0
  - @features/platform-wallet-sync@0.1.3
  - @ledgerhq/ethereum-provider@0.8.0
  - @ledgerhq/live-dmk-speculos@0.11.0
  - @ledgerhq/types-devices@7.1.0
  - @devtools/shell@0.10.2

## 4.24.0-next.1

### Minor Changes

- [#23297](https://github.com/LedgerHQ/ledger-live/pull/23297) [`2989e37`](https://github.com/LedgerHQ/ledger-live/commit/2989e37b80b8bfcaae549cc02aa6de189a69dfef) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(solana): refresh the blockhash after the device review to avoid "Blockhash not found"

### Patch Changes

- Updated dependencies [[`2989e37`](https://github.com/LedgerHQ/ledger-live/commit/2989e37b80b8bfcaae549cc02aa6de189a69dfef)]:
  - @ledgerhq/live-common@38.3.0-next.1
  - @ledgerhq/ledger-wallet-framework@3.7.0-next.1
  - @ledgerhq/asset-detail@0.12.0-next.1
  - @ledgerhq/live-dmk-desktop@0.24.0-next.1
  - @ledgerhq/live-send@0.1.3-next.1
  - @ledgerhq/asset-aggregation@0.18.0-next.1
  - @ledgerhq/coin-bitcoin@0.55.0-next.1
  - @ledgerhq/coin-canton@1.4.0-next.1
  - @ledgerhq/coin-cardano@2.0.0-next.1
  - @ledgerhq/coin-casper@3.5.1-next.1
  - @ledgerhq/coin-concordium@1.5.1-next.1
  - @ledgerhq/coin-cosmos@1.6.0-next.1
  - @ledgerhq/coin-filecoin@2.4.0-next.1
  - @ledgerhq/coin-stacks@0.33.0-next.1
  - @ledgerhq/coin-zcash@0.11.0-next.1
  - @ledgerhq/live-signer-evm@0.24.1-next.1
  - @ledgerhq/live-wallet@1.1.6-next.1
  - @ledgerhq/wallet-analytics@0.5.1-next.1
  - @ledgerhq/wallet-pnl@0.8.0-next.1
  - @ledgerhq/wallet-btc@0.7.0-next.0

## 4.24.0-next.0

### Minor Changes

- [#23017](https://github.com/LedgerHQ/ledger-live/pull/23017) [`eaff720`](https://github.com/LedgerHQ/ledger-live/commit/eaff72056535cd3d78ac4b0266fa9933b54c9a6e) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Show a concise message when adding an account fails because the provider returns a server or network error

- [#22909](https://github.com/LedgerHQ/ledger-live/pull/22909) [`29ead28`](https://github.com/LedgerHQ/ledger-live/commit/29ead2847f8227440eb1752984068a85cd0ab51e) Thanks [@LucasWerey](https://github.com/LucasWerey)! - fix(add-account): allow creating other BTC address types when the existing account is empty

- [#22981](https://github.com/LedgerHQ/ledger-live/pull/22981) [`3faf47c`](https://github.com/LedgerHQ/ledger-live/commit/3faf47c8c7d8daecb352f7dd32ef72c8d064ba0e) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Rename the market banner "View all" tile to "More" so it no longer gets cropped in longer languages.

- [#22971](https://github.com/LedgerHQ/ledger-live/pull/22971) [`f8a4b3e`](https://github.com/LedgerHQ/ledger-live/commit/f8a4b3e5f6e68cd507c74b7538247e0e5efc7a3a) Thanks [@LucasWerey](https://github.com/LucasWerey)! - fix(top-bar): keep a minimum width for the search and truncate the update pills on narrow windows

- [#23139](https://github.com/LedgerHQ/ledger-live/pull/23139) [`320d2a1`](https://github.com/LedgerHQ/ledger-live/commit/320d2a1fbbe0d661681913d75f76bd70c4698115) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Resolve the market id of an asset from the ledger ids when needed, so favorites added from search show up in the Market banner

- [#22519](https://github.com/LedgerHQ/ledger-live/pull/22519) [`d60f240`](https://github.com/LedgerHQ/ledger-live/commit/d60f240af5f814d887bb2df19db8415425b52317) Thanks [@semeano](https://github.com/semeano)! - feat(stacks): add desktop stake and unstake flows

  coin-stacks: `spendableBalance` now excludes locked (staked) STX for every Stacks account, matching `getBalance`, which lowers the Send max for accounts with a stake.

  coin-stacks: `validateIntent` rejects a stake during the pox-5 prepare phase (`StacksStakeInPreparePhase`), which the chain would abort while still charging the fee.

- [#22843](https://github.com/LedgerHQ/ledger-live/pull/22843) [`c954015`](https://github.com/LedgerHQ/ledger-live/commit/c954015d149a86adc8a1cdfcda41a71313171b68) Thanks [@semeano](https://github.com/semeano)! - feat(stacks): add mobile stake and unstake flows

- [#23143](https://github.com/LedgerHQ/ledger-live/pull/23143) [`4101467`](https://github.com/LedgerHQ/ledger-live/commit/4101467e60d17f1facfae9c71e5b684bcf9f48e3) Thanks [@LucasWerey](https://github.com/LucasWerey)! - refactor(contacts): clean up the Contacts debug tools

  The send-history contacts builder was copied in both apps. It now lives once in
  `@domain/entity-contact/schema.mock` as `mockContactsFromSendHistory`. `@features/platform-contacts`
  adds `parseExcludedCurrencyIdsInput`, which works like `parseEligibleAddressFamiliesInput`. The
  desktop tool no longer copies flag params into local state with effects. Its inputs show the flag
  value unless you are editing them, use `cn`, and have no hard-coded strings left. The mobile tool
  drops its `StyleSheet`, shows the families as tags, and builds the flag preview in its view model.

- [#23035](https://github.com/LedgerHQ/ledger-live/pull/23035) [`20bf9b0`](https://github.com/LedgerHQ/ledger-live/commit/20bf9b0c8694e9a3c873da1e81fd6b310410205c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Route every copy/paste through the new @shared/clipboard package (expo-clipboard replaces @react-native-clipboard/clipboard on mobile) and enforce it with lint rules; copy feedback now only shows once the copy succeeded

- [#23043](https://github.com/LedgerHQ/ledger-live/pull/23043) [`4028b7e`](https://github.com/LedgerHQ/ledger-live/commit/4028b7e53019ef07b2e94a6559c5f8a6ba54b82f) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Hold back a per-currency fee buffer when depositing the max of a native coin into perps, configured by the new `ptxTradeMaxConstant` flag (`feature_ptx_trade_max_constant`). Only the MAX ratio is reduced; token accounts and other ratios are unchanged.

- [#22860](https://github.com/LedgerHQ/ledger-live/pull/22860) [`21fa5a5`](https://github.com/LedgerHQ/ledger-live/commit/21fa5a533d3369db9586a38d6fa869f8c03121af) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Send the user back to the perps deposit form when they retry after a "not enough balance" error. Retrying re-ran the same deposit, which could only fail again; the form now reopens with the draft amount and funding account so the amount can be lowered. Other errors still retry in place

- [#22856](https://github.com/LedgerHQ/ledger-live/pull/22856) [`438c7b3`](https://github.com/LedgerHQ/ledger-live/commit/438c7b3035ac460e702d294a3c17db2843962d21) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Hide accounts that cannot send, such as HyperCore, from the perps deposit funding picker. The receiving HyperCore account was still offered as a funding source even though a deposit cannot be sent from it. The picker now opens in the `perpetuals:fund` flow, which rejects send-disabled families, so modular dialog analytics from that picker report `flow: "perpetuals:fund"`

- [#23182](https://github.com/LedgerHQ/ledger-live/pull/23182) [`0d31c6b`](https://github.com/LedgerHQ/ledger-live/commit/0d31c6b7e2b5cf09376d1e59fe025be5968ae560) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Open swap from Market only after the user has picked the network and account to swap from, whenever they hold an account on any of the asset's networks.

- [#22904](https://github.com/LedgerHQ/ledger-live/pull/22904) [`1696c5d`](https://github.com/LedgerHQ/ledger-live/commit/1696c5dd3149b658d71a51470ba1a723e1cff940) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Wrap Analytics PnL cards and balance header on narrow windows instead of overflowing horizontally

- [#22890](https://github.com/LedgerHQ/ledger-live/pull/22890) [`ee95a8e`](https://github.com/LedgerHQ/ledger-live/commit/ee95a8e0c4cdce091dfc1cb0e9b54445030f079c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - fix(cg-client): remove the unused CoinGecko supported coins list query

  Removes `getSupportedCoinsList`, `useGetSupportedCoinsListQuery`, `useSupportedCurrencies`, `MarketCoinSchema`, `SupportedCoinsSchema` and the `MarketCoin` / `SupportedCoins` types. `useMarketDataProvider` now only returns `supportedCounterCurrencies`.

- [#22920](https://github.com/LedgerHQ/ledger-live/pull/22920) [`c45454e`](https://github.com/LedgerHQ/ledger-live/commit/c45454e9d53bdb7fc8632dbe857a2cc80fac8aa6) Thanks [@LucasWerey](https://github.com/LucasWerey)! - fix(errors): stop reporting DMK and empty errors as TranslatedError invalid usage

- [#22866](https://github.com/LedgerHQ/ledger-live/pull/22866) [`52747b3`](https://github.com/LedgerHQ/ledger-live/commit/52747b3d876e34712619bd17206cd4aa23e07636) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Name the default Me contact "Me" in the Pay tab contacts list instead of "My addresses (Me)"

- [#23053](https://github.com/LedgerHQ/ledger-live/pull/23053) [`2a09181`](https://github.com/LedgerHQ/ledger-live/commit/2a091816a8ec716c0bba802767671052c75843e8) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Show each stablecoin as its own Pay balance filter option, including testnet holdings

- [#22988](https://github.com/LedgerHQ/ledger-live/pull/22988) [`7cfa427`](https://github.com/LedgerHQ/ledger-live/commit/7cfa427f8df0405cf6499657cbe3d5957d1e3509) Thanks [@LucasWerey](https://github.com/LucasWerey)! - fix(crypto-addresses): keep the rename dialog open while accounts sync or countervalues refresh

- [#23172](https://github.com/LedgerHQ/ledger-live/pull/23172) [`37f6895`](https://github.com/LedgerHQ/ledger-live/commit/37f68959c13c69794d734a66c143106f9b446a8f) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - fix(sidebar): reopen the sidebar after an automatic collapse

- [#22436](https://github.com/LedgerHQ/ledger-live/pull/22436) [`23455ab`](https://github.com/LedgerHQ/ledger-live/commit/23455abfdc26b44eedd77a1c990a6721dadd3f5c) Thanks [@ysitbon](https://github.com/ysitbon)! - Add the countervalues domain api: rate fetching, and the orchestration that folds rates into the entity state.

  - `@domain/api-market-countervalues` owns the Countervalues Service endpoints and `loadCountervalues`, which moves out of `@ledgerhq/live-countervalues`.
  - The endpoints are injected into the shared countervalues api from `@shared/api-services` instead of standing up a second slice. The duplicate client in live-common is removed, so each app registers one countervalues reducer where it previously registered two against the same host. That slice is an RTK Query cache and is not persisted, so there is no stored state to migrate.
  - `loadCountervalues` takes its rates as an argument rather than reaching for a module-level client. The apps compose one in the countervalues bridge they already own; tests pass a mock directly, which removes the `MOCK_COUNTERVALUES` dispatcher hidden inside the fetch path.
  - Rate failures carry the HTTP status through unchanged, so an unsupported pair still clears its cache on 422, an HTTP failure still increments the per-pair backoff, and an offline period still does not.
  - Rate requests keep the previous request policy: a 60s timeout, so a hung connection can no longer stall countervalues polling, and the same retries as before. The two endpoints moved out of live-common keep not retrying.
  - `@ledgerhq/live-countervalues` drops `loadCountervalues`, its `api` entry point and the fetch contract types, and with them its dependencies on `@ledgerhq/logs`, `@ledgerhq/live-network`, `@ledgerhq/live-promise` and `@ledgerhq/live-env`. It no longer reaches the network.
  - web-tools now registers the shared countervalues api, which its portfolio countervalues loading dispatches through.
  - `cvsApiExtra` takes `getCountervaluesServiceUrl`, a getter read on every request, in place of the `countervaluesServiceUrl` string read once at store creation. Switching the developer staging toggle now applies to the next countervalues request again, as it did before the rates moved onto the shared api.

- [#23173](https://github.com/LedgerHQ/ledger-live/pull/23173) [`55e5d67`](https://github.com/LedgerHQ/ledger-live/commit/55e5d67e920dbce854c5db338e1fa0b146da5181) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Show the full Assets column label in a tooltip when it is truncated

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

- [#22639](https://github.com/LedgerHQ/ledger-live/pull/22639) [`0c507ff`](https://github.com/LedgerHQ/ledger-live/commit/0c507ffb0964a6bfbd221ecd83f00d0259921ada) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Update @ledgerhq/coin-evm to 9.0.1 and pass a logger to its APIs

- [#22599](https://github.com/LedgerHQ/ledger-live/pull/22599) [`d819300`](https://github.com/LedgerHQ/ledger-live/commit/d819300df11d1e58ad33dbb8d0dbdb6f20c8dd93) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Add failureType and subError properties to Device Intent Executor deviceflow_failed and deviceflow_aborted events

- [#22418](https://github.com/LedgerHQ/ledger-live/pull/22418) [`48874b3`](https://github.com/LedgerHQ/ledger-live/commit/48874b3b33c83b40f7c2c389f7a84ebe96d58816) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Add desktop E2E coverage for creating a contact, registering Ethereum addresses on the device and deleting both, and let device intents discover Speculos.

- [#23021](https://github.com/LedgerHQ/ledger-live/pull/23021) [`3dacfc2`](https://github.com/LedgerHQ/ledger-live/commit/3dacfc29377ad8a8ac25ad51f2207c882491bb7e) Thanks [@fAnselmi-Ledger](https://github.com/fAnselmi-Ledger)! - Bump `@ledgerhq/device-management-kit` to 1.11.0 and `@ledgerhq/dmk-ledger-wallet` to 0.7.0.

- [#23246](https://github.com/LedgerHQ/ledger-live/pull/23246) [`71c5860`](https://github.com/LedgerHQ/ledger-live/commit/71c58602037e7dc69e35b99fb648c11e365adcd1) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Bump `@ledgerhq/dmk-ledger-wallet` to 0.7.1, `@ledgerhq/device-transport-kit-speculos` to 1.3.0 and `@ledgerhq/speculos-device-controller` to 0.4.0.

- [#23083](https://github.com/LedgerHQ/ledger-live/pull/23083) [`4c28d72`](https://github.com/LedgerHQ/ledger-live/commit/4c28d726d50493ed3967c1a7eb84392442dfbeb9) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump `@ledgerhq/ledger-key-ring-protocol`, `@ledgerhq/hw-ledger-key-ring-protocol` to 1.0.0 and `@ledgerhq/evm-tools` to 2.0.0 (ts-libs). No API change.

- [#23184](https://github.com/LedgerHQ/ledger-live/pull/23184) [`3dda070`](https://github.com/LedgerHQ/ledger-live/commit/3dda0705f09d0e0da75ebde9a76b17ba7a9f65e6) Thanks [@CremaFR](https://github.com/CremaFR)! - Retry a swap up to twice, without showing the error, when the Exchange app rejects the provider signature (`signVerificationFail` at `CHECK_TRANSACTION_SIGNATURE`). `executeSwap` requests a new nonce and calls `/swap` again with the same parameters. Each rejected attempt is still reported to `/swap/cancelled`, with the attempt in the error message: `Signature verification failed Code: R0` for the first attempt, then `R1` and `R2` for the retries. This replaces the `[diagnostic=…]` signature classification, which is removed

- [#22745](https://github.com/LedgerHQ/ledger-live/pull/22745) [`db3bde1`](https://github.com/LedgerHQ/ledger-live/commit/db3bde1a0ea2435389260b012d9759dd26f7b174) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Canton: hide Accept once an offer expires while the screen is open, and show a clear message instead of retry when accepting an expired offer

- [#23008](https://github.com/LedgerHQ/ledger-live/pull/23008) [`ac0379e`](https://github.com/LedgerHQ/ledger-live/commit/ac0379ea0511dd457d6bba6a540d48b8358f4f93) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(send): show a broadcast error on the new send flow confirmation and only offer to try again for temporary errors (network, server, locked device)

- [#22387](https://github.com/LedgerHQ/ledger-live/pull/22387) [`3dd4ee2`](https://github.com/LedgerHQ/ledger-live/commit/3dd4ee274f5743d62820d1c37f7b1ac8830bf4ea) Thanks [@lysyi3m](https://github.com/lysyi3m)! - feat(concordium): link the PLT support article from the token list and Receive alert

- [#22811](https://github.com/LedgerHQ/ledger-live/pull/22811) [`3132a4a`](https://github.com/LedgerHQ/ledger-live/commit/3132a4aba419be9a91320295d8c0260f3509f9bd) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Consume `@ledgerhq/ledger-key-ring-protocol` and `@ledgerhq/hw-ledger-key-ring-protocol` from npm (they now live in `ts-libs`), and bump `axios` to 1.20.0. No API change.

- [#22657](https://github.com/LedgerHQ/ledger-live/pull/22657) [`932097d`](https://github.com/LedgerHQ/ledger-live/commit/932097d4a1a5c9e26848a8de0120667f8c14557a) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Cover on-device contact rename in desktop E2E against the mock server, which keeps the OS available after the device leaves the Ethereum app.

- [#22930](https://github.com/LedgerHQ/ledger-live/pull/22930) [`5f07a43`](https://github.com/LedgerHQ/ledger-live/commit/5f07a4399d54e6ebccb953045324d8ec5b571ad3) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Keep the Ledger Wallet addresses entry at full height in the desktop contact detail on small windows, and let the empty detail scroll with the custom scrollbar (LIVE-38297).

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

- [#21799](https://github.com/LedgerHQ/ledger-live/pull/21799) [`2c4e8cb`](https://github.com/LedgerHQ/ledger-live/commit/2c4e8cb37989c3fb5e2b986983172d18179f4fe8) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(lwd): fix modal height on send flow

- [#22722](https://github.com/LedgerHQ/ledger-live/pull/22722) [`03aa2c9`](https://github.com/LedgerHQ/ledger-live/commit/03aa2c92492d3056d04d7e5b7f6e92504771aded) Thanks [@LL782](https://github.com/LL782)! - Import shared analytics directly in Desktop, coin-integration code

- [#22744](https://github.com/LedgerHQ/ledger-live/pull/22744) [`5879819`](https://github.com/LedgerHQ/ledger-live/commit/58798197564fb4a6599ab214a3dde6211af98758) Thanks [@ysitbon](https://github.com/ysitbon)! - Import the countervalues logic, types and helpers from `@domain/entity-market-countervalues` instead of `@ledgerhq/live-countervalues`, and drop the legacy dependency. Specifier change only, no behaviour change.

- [#22950](https://github.com/LedgerHQ/ledger-live/pull/22950) [`d1eeaab`](https://github.com/LedgerHQ/ledger-live/commit/d1eeaabf43a54a3d2c4796ea1c5b11a0b9202814) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Stop setting the USER_ID env on desktop, now that the firmware checks read the user ID from the identities store

- [#22789](https://github.com/LedgerHQ/ledger-live/pull/22789) [`8569110`](https://github.com/LedgerHQ/ledger-live/commit/856911057bd1309ae676157825f46f6277968758) Thanks [@LL782](https://github.com/LL782)! - Remove stale analytics shim mocks and docs

- [#22726](https://github.com/LedgerHQ/ledger-live/pull/22726) [`e21564c`](https://github.com/LedgerHQ/ledger-live/commit/e21564cb145e409a90b18806f8b4acbda0da0aca) Thanks [@LL782](https://github.com/LL782)! - Import shared analytics directly in engagement Desktop code

- [#22724](https://github.com/LedgerHQ/ledger-live/pull/22724) [`46fe382`](https://github.com/LedgerHQ/ledger-live/commit/46fe382b4e7bff37473591e62ae81834ec58da4d) Thanks [@LL782](https://github.com/LL782)! - Import shared analytics directly in live-devices Desktop code

- [#22804](https://github.com/LedgerHQ/ledger-live/pull/22804) [`948cc81`](https://github.com/LedgerHQ/ledger-live/commit/948cc8108b5be9f55a11f1f74705deab442f0069) Thanks [@ysitbon](https://github.com/ysitbon)! - fix(desktop): build nightlies against the production Firebase project

  Desktop nightlies compiled the whole `.env.staging`, so they read feature flags from the Firebase
  staging project while mobile nightlies read production. Nightlies keep the staging services (Braze,
  Segment, Earn, Card, Datadog) but now take their `FIREBASE_*` values from `.env.production`.

- [#22859](https://github.com/LedgerHQ/ledger-live/pull/22859) [`c4cf243`](https://github.com/LedgerHQ/ledger-live/commit/c4cf243161fafa9c1a77ec661983e780e505ba87) Thanks [@sarneijim](https://github.com/sarneijim)! - Port device onboarding into desktop DevTools

- [#22727](https://github.com/LedgerHQ/ledger-live/pull/22727) [`5b11a5a`](https://github.com/LedgerHQ/ledger-live/commit/5b11a5ae9e06003fc7bae51b6799eaacedba69c6) Thanks [@LL782](https://github.com/LL782)! - Import shared analytics directly in platform Desktop code

- [#22935](https://github.com/LedgerHQ/ledger-live/pull/22935) [`8e427a6`](https://github.com/LedgerHQ/ledger-live/commit/8e427a6392d28ec9b79c3f805e8da3fb70e13f54) Thanks [@ysitbon](https://github.com/ysitbon)! - Read the countervalues provider and hooks, `useUsdToFiatRate` and `useGetCounterValueIdsPolling` from `@features/platform-market-countervalues` instead of `@ledgerhq/live-countervalues-react` and live-common, and drop the `@ledgerhq/live-countervalues-react` dependency. The app and the test wrapper now mount the platform provider in place of the old one.

- [#22662](https://github.com/LedgerHQ/ledger-live/pull/22662) [`487620c`](https://github.com/LedgerHQ/ledger-live/commit/487620c67a0ffa66fbcb401fed42bddcc150c24e) Thanks [@LL782](https://github.com/LL782)! - Import shared analytics directly in ptx Desktop code

- [#22725](https://github.com/LedgerHQ/ledger-live/pull/22725) [`a4c1969`](https://github.com/LedgerHQ/ledger-live/commit/a4c19695650db22bcf3bded692bc1e71bd03f785) Thanks [@LL782](https://github.com/LL782)! - Import shared analytics directly in recover-software Desktop code

- [#23012](https://github.com/LedgerHQ/ledger-live/pull/23012) [`1289c30`](https://github.com/LedgerHQ/ledger-live/commit/1289c30bce53f7713e666329818893a11f866277) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Remove the HTTP proxy device transport (`DEVICE_PROXY_URL`) from the desktop app, together with its IPC transport and the `window.lld.transport` bridge. Real devices and Speculos connect from the renderer through the Device Management Kit.

- [#22694](https://github.com/LedgerHQ/ledger-live/pull/22694) [`d9d44dc`](https://github.com/LedgerHQ/ledger-live/commit/d9d44dcb6c7584d9e135c5732eef7ff0f97beb82) Thanks [@LL782](https://github.com/LL782)! - Import shared analytics directly in wallet-xp Desktop code

- [#23219](https://github.com/LedgerHQ/ledger-live/pull/23219) [`c50dc4d`](https://github.com/LedgerHQ/ledger-live/commit/c50dc4d1551af01e4eb9e2fe912608e245ef1ead) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(send): resizeobserver amount fix

- [#22803](https://github.com/LedgerHQ/ledger-live/pull/22803) [`0e3e7b0`](https://github.com/LedgerHQ/ledger-live/commit/0e3e7b023b7b285a955bb2aabb308d143d47bfba) Thanks [@ysitbon](https://github.com/ysitbon)! - fix(feature-flags): show the Firebase project the build actually targets

  The debug feature flags screen read the project name from the `firebaseEnvironmentReadOnly`
  remote flag, a value set by hand in each Firebase project, so a staging build reported
  `ledger-live-production`. It now reads the project id from the Firebase config bundled in the
  build.

- [#22795](https://github.com/LedgerHQ/ledger-live/pull/22795) [`ff5e1b0`](https://github.com/LedgerHQ/ledger-live/commit/ff5e1b0f5a315aaccd3e23aeb8ccd2c7d48730f4) Thanks [@ysitbon](https://github.com/ysitbon)! - refactor(feature-flags): move the Firebase Remote Config mapping to `@features/platform-feature-flags-firebase`

  `@features/platform-feature-flags` now only exposes resolved flag state (hooks and `FeatureToggle`). `formatToFirebaseFeatureId`, `formatDefaultFeatures`, `parseFirebaseFeatures` and `RemoteConfigValue` are imported from `@features/platform-feature-flags-firebase` instead; the `./firebase` subpath is removed. No behavior change.

- [#22352](https://github.com/LedgerHQ/ledger-live/pull/22352) [`c7e76f3`](https://github.com/LedgerHQ/ledger-live/commit/c7e76f3a015cf00cfdb1d057d1eee85ea6e99dc0) Thanks [@ishaba](https://github.com/ishaba)! - fix(babylon): remove pre-selected validator, default to show all

- [#22950](https://github.com/LedgerHQ/ledger-live/pull/22950) [`dccba0c`](https://github.com/LedgerHQ/ledger-live/commit/dccba0c7481c705b4a295942171891deff1c0e85) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Compute the firmware distribution salt of the non-DMK firmware update checks from the identities store instead of the USER_ID env, so they use the same salt as the DMK

- [#22591](https://github.com/LedgerHQ/ledger-live/pull/22591) [`828c892`](https://github.com/LedgerHQ/ledger-live/commit/828c892019cab180b5a5024b03dc82987af695b2) Thanks [@sarneijim](https://github.com/sarneijim)! - Apply enabled `feature_copy_*` Remote Config values as English copy overrides, reusing the feature-flag fetch

- [#22913](https://github.com/LedgerHQ/ledger-live/pull/22913) [`6bb4b44`](https://github.com/LedgerHQ/ledger-live/commit/6bb4b44d94a29c3eb8eaffaafda55ca9d6934e2b) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat(hedera): migrate desktop Hedera flows to the generic transaction shape and enable generic adapter

- [#22784](https://github.com/LedgerHQ/ledger-live/pull/22784) [`e72683b`](https://github.com/LedgerHQ/ledger-live/commit/e72683b8ed45df73659811db2ef15a18b4e0927c) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Hide the Pay tab card and its history when the pay-tab flag's card param is false

- [#22985](https://github.com/LedgerHQ/ledger-live/pull/22985) [`4182256`](https://github.com/LedgerHQ/ledger-live/commit/4182256c2213208e330861b904a6d8859d1b3e60) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix(hedera): generic adapter fixes for fee estimation, wallet API memo, token association wording, token receive and swap history saved by the legacy bridge

- [#22640](https://github.com/LedgerHQ/ledger-live/pull/22640) [`8783545`](https://github.com/LedgerHQ/ledger-live/commit/87835456704c2322a25339ef27ef92a320d02025) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(contacts): stop reading `ethereumLikeInfo` and promote `chainId` from coin config

- [#22779](https://github.com/LedgerHQ/ledger-live/pull/22779) [`9c8a8f3`](https://github.com/LedgerHQ/ledger-live/commit/9c8a8f3c8952094908a8593c5f8894266f22d0a7) Thanks [@KVNLS](https://github.com/KVNLS)! - The desktop app's own device animations are code-split per device model and loaded lazily instead of being read back through a runtime `require()`. The shared pin/continue animations are still bundled with the renderer.

- [#22395](https://github.com/LedgerHQ/ledger-live/pull/22395) [`39d91b6`](https://github.com/LedgerHQ/ledger-live/commit/39d91b68fa8b7ad7625887fee6ff126c131eaf34) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(tracking): tracking error and warning in new send flow lwm

- [#22743](https://github.com/LedgerHQ/ledger-live/pull/22743) [`4d9cfbd`](https://github.com/LedgerHQ/ledger-live/commit/4d9cfbd7eff1fb20fb2052b0a2f2b21ea87ba052) Thanks [@ysitbon](https://github.com/ysitbon)! - Import the countervalues logic, types, helpers and mocks from `@domain/entity-market-countervalues` instead of `@ledgerhq/live-countervalues`, and depend on the entity package in place of the legacy one. Specifier change only, no behaviour change.

  Three app tests move with live-common because the `calculate` they mock is called inside live-common: desktop's `useHistoryOperations` and mobile's `useOperationsListViewModel` and `useOperationsV1`. Their mock has to name the same module live-common imports.

- [#23097](https://github.com/LedgerHQ/ledger-live/pull/23097) [`9bffec1`](https://github.com/LedgerHQ/ledger-live/commit/9bffec14b310816bb0091c04f3c220a173de74e8) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Move the updater signature check to `@features/platform-app-update`, so desktop no longer depends on `@noble/curves` directly.

- [#22975](https://github.com/LedgerHQ/ledger-live/pull/22975) [`11cc5fc`](https://github.com/LedgerHQ/ledger-live/commit/11cc5fcefd5c493d15dde20dd60f113211adaacd) Thanks [@ovoronkov-ledger](https://github.com/ovoronkov-ledger)! - Fix Market list and coin page showing the Settings currency symbol next to prices fetched in the currency picked from the Market dropdown

- [#22969](https://github.com/LedgerHQ/ledger-live/pull/22969) [`fb02fb0`](https://github.com/LedgerHQ/ledger-live/commit/fb02fb00d21b2fda4c1e0d6194db33b7fe0d2f93) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Show the mock server device as a floating window from `@ledgerhq/device-mockserver-react`, replacing the sidebar device screen.

- [#22808](https://github.com/LedgerHQ/ledger-live/pull/22808) [`bac3334`](https://github.com/LedgerHQ/ledger-live/commit/bac3334a1c58495722e2c5a123c7d2a26b0c8d7d) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Upgrade @ledgerhq/coin-evm to version 10.0.0 and remove obsolete gas tracker parameters

- [#22765](https://github.com/LedgerHQ/ledger-live/pull/22765) [`e3e6c22`](https://github.com/LedgerHQ/ledger-live/commit/e3e6c222ddba748a7e9e03e85f5919ce8e5c28bd) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Extract the device discovery service and the connectivity types shared by device connection flows into a `deviceConnectivity` folder. The discovery, connection and unknown error UI states now use the shared `ConnectivityUIStateTypes` enum. `ConnectDeviceUIStateTypes` becomes a const object that includes these shared members, so type positions use `typeof ConnectDeviceUIStateTypes.X` or the new `ConnectDeviceUIStateType` type. The device type moves to the shared part as `Device`, and connectDevice keeps `KnownDevice` as an alias of it. connectDevice behaviour is unchanged.

- [#22915](https://github.com/LedgerHQ/ledger-live/pull/22915) [`957f451`](https://github.com/LedgerHQ/ledger-live/commit/957f4516e6446f8179de0021b1c0265ef2bcd615) Thanks [@dgreen-ledger](https://github.com/dgreen-ledger)! - Require a genuine-checked device ID before the sync onboarding companion

- [#22695](https://github.com/LedgerHQ/ledger-live/pull/22695) [`570a8a0`](https://github.com/LedgerHQ/ledger-live/commit/570a8a0827e524ae18a7d216263d8ccb5a2c17b8) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add a Pay tab screen test id and cover the stablecoin balance, filter, and deposit options

- [#22878](https://github.com/LedgerHQ/ledger-live/pull/22878) [`d098cd3`](https://github.com/LedgerHQ/ledger-live/commit/d098cd3ce7f0009de59bab78cba0d8f397bb6b4d) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Show a "Go to CL Card" disclaimer below the Pay contacts when the `card_disclaimer` param of `lwdPayTab` is on. It opens the same CL Card webview as "I have a card" on the Card screen.

- [#22879](https://github.com/LedgerHQ/ledger-live/pull/22879) [`77e7162`](https://github.com/LedgerHQ/ledger-live/commit/77e716257785645b79027b580fcef2dfbab7ad3b) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Show the Card login on the desktop Pay tab when the `card_live_app` param of `lwdPayTab` is on. "Create an account" opens the card program live app and "Log in" opens the CL Card live app.

- [#22876](https://github.com/LedgerHQ/ledger-live/pull/22876) [`d5de868`](https://github.com/LedgerHQ/ledger-live/commit/d5de8686938f48fb517060a23fcba8f54558a2cb) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Read the desktop Pay card face (native, live app, disclaimer) from one `usePayCardFace` hook.

- [#22910](https://github.com/LedgerHQ/ledger-live/pull/22910) [`177a5b4`](https://github.com/LedgerHQ/ledger-live/commit/177a5b413ca0348c78aca5cbdfca9340355f4b23) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Pay card login: name Monavate instead of Baanx in "Log in to" and "Card provided by".

- [#22649](https://github.com/LedgerHQ/ledger-live/pull/22649) [`514d6f9`](https://github.com/LedgerHQ/ledger-live/commit/514d6f937e082fa8b86d87bcf170cc2ec57d51e0) Thanks [@koda-apps](https://github.com/apps/koda-apps)! - Show a newly linked Card asset when the user comes back to Pay from Baanx.

- [#22877](https://github.com/LedgerHQ/ledger-live/pull/22877) [`f49824c`](https://github.com/LedgerHQ/ledger-live/commit/f49824c51b04078d3715daf6a03f40f046bc3272) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Send the live app webview Back button to Pay when the webview was opened from Pay with `fromPayTab` state.

- [#22869](https://github.com/LedgerHQ/ledger-live/pull/22869) [`eb65ce4`](https://github.com/LedgerHQ/ledger-live/commit/eb65ce49ea0fa2d2c44f79fd2b0f8de365ae5e53) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add feature-flag scenarios for the native Pay card, Card live app login, and CL Card disclaimer

- [#22027](https://github.com/LedgerHQ/ledger-live/pull/22027) [`10e4a67`](https://github.com/LedgerHQ/ledger-live/commit/10e4a67f1aeffc909e8f5153b9720f568140323b) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Default the Perps deposit funding account to the USDC account with the highest non-zero spendable balance

- [#22865](https://github.com/LedgerHQ/ledger-live/pull/22865) [`667d378`](https://github.com/LedgerHQ/ledger-live/commit/667d378b97e9102df009015e01fed6b49fd88b82) Thanks [@ysitbon](https://github.com/ysitbon)! - Add `@features/platform-market-countervalues`, the countervalues React glue: the provider, its context and the hooks reading it, plus `useUsdToFiatRate` and `useGetCounterValueIdsPolling`. It is a copy of `@ledgerhq/live-countervalues-react` and of the two live-common hooks, which keep their own until their consumers move over.

  - `@ledgerhq/live-countervalues-react` reads the platform package's `CountervaluesContext` instead of creating its own, so a provider from either package serves the hooks of both. It stops exporting `CountervaluesContext`, which nothing imported, and drops its unused `@ledgerhq/types-live` dependency.
  - The platform package depends on no logging library. Desktop and mobile hand it their logger with `setCountervaluesLogger` at app setup, next to the rate lookups.

- [#22654](https://github.com/LedgerHQ/ledger-live/pull/22654) [`78b38fb`](https://github.com/LedgerHQ/ledger-live/commit/78b38fb3820d3391c5c04812fee88c1c2a6e9289) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(send): sync account at the start of a send

- [#23150](https://github.com/LedgerHQ/ledger-live/pull/23150) [`4dec481`](https://github.com/LedgerHQ/ledger-live/commit/4dec481cf274c6db74c334e5a74df574a8d04f54) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Keep the device onboarding session in the machine context, follow a new session on reconnect, and let the host run the exit actions

- [#22766](https://github.com/LedgerHQ/ledger-live/pull/22766) [`b2792d8`](https://github.com/LedgerHQ/ledger-live/commit/b2792d8806411c2a35e1622109bee830c44a6cbc) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Show a setup state on the History card tab when the signed-in holder has not claimed a card yet.

- [#22978](https://github.com/LedgerHQ/ledger-live/pull/22978) [`8102f7d`](https://github.com/LedgerHQ/ledger-live/commit/8102f7dab7cea81bd30e74e19a3ee6fce9e47fe0) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Close the modular dialog, modals and drawer before handling any deeplink

- [#23114](https://github.com/LedgerHQ/ledger-live/pull/23114) [`bdf552d`](https://github.com/LedgerHQ/ledger-live/commit/bdf552d00d5cd02e392637749d6384c4ff0919e7) Thanks [@ypolishchuk-ledger](https://github.com/ypolishchuk-ledger)! - Bump Playwright from 1.60.0 to 1.63.0 and allure-playwright / allure-js-commons from 3.9.0 to 3.13.0

- [#22770](https://github.com/LedgerHQ/ledger-live/pull/22770) [`812d03f`](https://github.com/LedgerHQ/ledger-live/commit/812d03f74d4324c2b165d4fb67fb3b31834d2b67) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Resolve the Perps `custom.perps.deposit` request with the swap ID and quoted amount once the deposit is broadcast, and reject it when the user cancels. The deposit request now lives in `wallet-api/Perps/depositRequest` and is shared by desktop and mobile

- [#23024](https://github.com/LedgerHQ/ledger-live/pull/23024) [`c037aa8`](https://github.com/LedgerHQ/ledger-live/commit/c037aa854190763e8654b7bb38a4486f4207caa8) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Migrate desktop Add Account off pre-ldls onto Lumen and remove the React pre-ldls entry

- [#22896](https://github.com/LedgerHQ/ledger-live/pull/22896) [`a663e23`](https://github.com/LedgerHQ/ledger-live/commit/a663e23f97df77ee25be5c9b5f7abfa3649bcde1) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Remove unused react-ui components and switch the desktop token list checkbox to Lumen

- [#22830](https://github.com/LedgerHQ/ledger-live/pull/22830) [`8509abf`](https://github.com/LedgerHQ/ledger-live/commit/8509abfd9f96a5e845e9a5e6392081366d31760c) Thanks [@KVNLS](https://github.com/KVNLS)! - Move the desktop renderer's application database and device transport (HTTP proxy) access onto the preload bridge (`window.lld.db`, `window.lld.transport`), with one named method per operation. Password attempts against the account database are now throttled in the main process after five consecutive failures.

- [#22831](https://github.com/LedgerHQ/ledger-live/pull/22831) [`fa15dfc`](https://github.com/LedgerHQ/ledger-live/commit/fa15dfcb7c71eeacc13a98a3dd57d5bc5117406a) Thanks [@KVNLS](https://github.com/KVNLS)! - Move the auto-updater and deep-link channels and the remaining renderer IPC onto the preload bridge, in preparation for enabling `contextIsolation`.

  Updater status and deep links are pushed to the renderer through `on*` subscriptions that return an unsubscribe closure. App lifecycle, native dialogs, file operations, the screen-awake blocker and the `lld.json` store writes go through named bridge methods instead of `ipcRenderer`. Channel names and main-side payloads are unchanged.

  With this, the only renderer `ipcRenderer` call left is the Pay card PNG save, which moves onto the bridge with the other save dialogs in the next change. The only other `electron` imports outside main and the preload scripts are the three chokepoints introduced earlier — clipboard, `webFrame` and `shell.openExternal`, none of which are IPC — plus one type-only import.

  Log export now checks whether the save dialog was cancelled. `showSaveDialog` always resolves to an object, so the previous `if (path)` guard was always true and the export ran on cancel, relying on the main process to ignore a cancelled target. The observable behaviour is unchanged; the check now says what it means.

- [#22832](https://github.com/LedgerHQ/ledger-live/pull/22832) [`20dccb1`](https://github.com/LedgerHQ/ledger-live/commit/20dccb15b91c13f1e31a29f34bc4db4762f2bf0b) Thanks [@KVNLS](https://github.com/KVNLS)! - Move the desktop renderer's last Electron chokepoints (clipboard, `webFrame`, `shell.openExternal`) onto the preload bridge, and run the save dialogs in the main process. Main now keeps the chosen path for the log export, the operations CSV export and the Pay card PNG save, so the renderer can no longer hand an arbitrary path back to be written. The write handlers return `"saved" | "canceled" | "failed"`, so cancelling an export is no longer reported as an error. Main registers every IPC handler through the shared `CHANNELS` contract.

- [#22829](https://github.com/LedgerHQ/ledger-live/pull/22829) [`8c4ccbe`](https://github.com/LedgerHQ/ledger-live/commit/8c4ccbe0172c4cc1dc08e0384980545819a082c3) Thanks [@KVNLS](https://github.com/KVNLS)! - Prepare the desktop renderer for running without Node integration: remove dead IPC channels and Node-only globals (`global.localStorage`, `setImmediate` in the post-onboarding redirect), replace winston in the renderer with a minimal logger of the same surface, route clipboard, `webFrame`, dialogs and `os` through single-purpose modules, import and export local Live App manifests with a file input and a download instead of the filesystem, and give the dev-only Firebase diagnostic its per-project configs from the build instead of reading `.env` files at runtime. No behaviour change.

- [#22780](https://github.com/LedgerHQ/ledger-live/pull/22780) [`8d10218`](https://github.com/LedgerHQ/ledger-live/commit/8d10218395571eeed1ea4921fbae95b0e8c0ab2d) Thanks [@KVNLS](https://github.com/KVNLS)! - Add an explicit, allow-listed preload bridge (`window.lld`) for the desktop renderer, declared once in `src/bridge/contract.ts` and imported by both sides. Main captures a bootstrap snapshot (env, `os`, paths, distribution channel) that the renderer reads synchronously, `electron-store` moves into the main process, and the Datadog anonymizer reads its paths from the snapshot. The `CARD_SESSION_BOOTSTRAP` credential is kept out of the snapshot and handed over once per page load. The renderer still runs with `nodeIntegration` on; the bridge works in both modes, so this changes no behaviour on its own.

- [#22781](https://github.com/LedgerHQ/ledger-live/pull/22781) [`6c8bd31`](https://github.com/LedgerHQ/ledger-live/commit/6c8bd31900a6b6aa8987cc82f6d907bbc3611fc1) Thanks [@KVNLS](https://github.com/KVNLS)! - Build the desktop renderer as a web target instead of `electron-renderer`: Node builtins resolve at build time rather than as runtime `require()` calls, and the bundle has no externals. `process` reads are supplied from a snapshot captured in main at startup, deliberately not a `process/browser` polyfill, which would report `platform === "browser"`. A build-time guard fails the build on an unguarded `process` read or a bare `setImmediate`/`clearImmediate`, rather than letting it surface as a runtime crash.

  ZCash shielded sync receives its IPC channel through `setZCashIpcRenderer` instead of reaching for `electron`; the desktop app supplies it over the preload bridge.

  `@ledgerhq/transaction-observability` (the dApp intent's `app_version`) and `@features/platform-device-action-content` (the E2E animation switch) read `process.env` directly instead of `globalThis.process`, which the web-target renderer does not have.

- [#22902](https://github.com/LedgerHQ/ledger-live/pull/22902) [`240ce9c`](https://github.com/LedgerHQ/ledger-live/commit/240ce9cae739d97023cd9abebd5470b6dff2ed8d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - chore: replace react-key-handler with an in-house hook for the Ctrl+E logs export shortcut, which behaves the same and drops about 21 MB of dependencies.

- [#23140](https://github.com/LedgerHQ/ledger-live/pull/23140) [`b99f923`](https://github.com/LedgerHQ/ledger-live/commit/b99f923997846b785c348006c5b434104c04f4a2) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Play Lottie animations through the new `@shared/lottie` package: dotlottie on web (replacing the unmaintained `react-lottie` / `lottie-web`), `lottie-react-native` on mobile.

- [#22950](https://github.com/LedgerHQ/ledger-live/pull/22950) [`8737f89`](https://github.com/LedgerHQ/ledger-live/commit/8737f89e2b515ab518cbcdeacc064641c6f595be) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Keep the DMK firmware distribution salt in sync with the user ID of the identities store, so DMK flows follow the progressive OS rollout on desktop and mobile

- [#23183](https://github.com/LedgerHQ/ledger-live/pull/23183) [`271861f`](https://github.com/LedgerHQ/ledger-live/commit/271861f9a26c5a26fe82d0b1ccefd9f339e547d0) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - fix(sidebar): always start fully open after a reload or app restart

- [#22846](https://github.com/LedgerHQ/ledger-live/pull/22846) [`42d4dc2`](https://github.com/LedgerHQ/ledger-live/commit/42d4dc25044dceb9936c1907fb5ea0838fa0a64b) Thanks [@benruseau](https://github.com/benruseau)! - Add the apply updates sub-step to the OS updates orchestrator, covering the OSU install, the MCU flash loop and the final firmware install

  Wait out the device reboots each install and flash leaves behind, reconnecting under the same session id

  Add the restore backup step, which runs as the last tenth of the bar when it follows an update and on its own when there is nothing left to update

  Sync `BASE_SOCKET_URL` to the DMK secure channel WebSocket URL

- [#21839](https://github.com/LedgerHQ/ledger-live/pull/21839) [`6d744e0`](https://github.com/LedgerHQ/ledger-live/commit/6d744e0d30b4480282d35c359d096f3f6d6602af) Thanks [@YazhuEth](https://github.com/YazhuEth)! - `estimateFees` now returns the recipient token account, wallet address and input type of an SPL transfer alongside its fee, so the device screen names the destination; a recipient token account holding another token throws `SolanaTokenAccountHoldsAnotherToken`.

  `makeEmptyTokenAccount` now builds its id with `encodeTokenAccountId`, like the fourteen families that already do: the wallet-API placeholder previously used the contract address, so it matched no real sub-account id.

  Solana runs on the generic coin framework. The send and staking screens move onto the generic transaction shape, which names what it does — a mode, a memo, a stake account seed — instead of the nested command model the legacy bridge carried, and the apps now read it through one family module rather than reaching into the transaction themselves.

  The behaviours the legacy bridge produced are restored on the generic path: an incoming SPL transfer produces an operation, a stake withdrawal empties the account rather than signing a stale amount, opening a token account is charged its rent, sending the maximum to a new stake account leaves enough to unstake it later, the device confirmation screen lists every row the device itself shows, and a token account's frozen state and Token-2022 extensions are back on screen.

  A live app can again submit the four token and stake commands the wallet API defines, and a raw signature it gets back is hex, as the field it arrives in says. The device signer is selected through the family's own factory, so the `ldmkSolanaSigner` flag and the transaction-check option it carries keep deciding, as they did before. The mock bridge is rewritten on the coin module, so a mocked signature still yields a transaction the wallet API can deserialize.

- [#22304](https://github.com/LedgerHQ/ledger-live/pull/22304) [`e11e449`](https://github.com/LedgerHQ/ledger-live/commit/e11e449b3be2cd309d3d22769a8f8ac44422dc7a) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(tracking): tracking error and warning in new send flow lwd

- [#23112](https://github.com/LedgerHQ/ledger-live/pull/23112) [`7f0d867`](https://github.com/LedgerHQ/ledger-live/commit/7f0d867cc9f8715b9244979e42a035babe43d2ab) Thanks [@amaslakov](https://github.com/amaslakov)! - Harden the Tronify rent payment: Retry stays locked until a payment that may still land has expired, a rent price rise is shown and must be accepted before ordering again, a signed payment about to expire is refused before broadcast, and the unreachable contract-data failure is removed.

- [#23032](https://github.com/LedgerHQ/ledger-live/pull/23032) [`bcd25fd`](https://github.com/LedgerHQ/ledger-live/commit/bcd25fd87bda9e7e8b7c3ee2a243d3e241adc0b0) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - chore(live-dmk): remove the ldmkTransport feature flag

  `DeviceManagementKitProvider` on desktop no longer takes `ldmkTransportEnabled` and always provides
  the Device Management Kit. `useDeviceManagementKit` now returns a non-null `DeviceManagementKit` and
  throws outside the provider. The PayTab address verification always uses the Device Intent Executor,
  and the `isLDMKTransportEnabled` analytics property is removed.

- [#22710](https://github.com/LedgerHQ/ledger-live/pull/22710) [`da9651f`](https://github.com/LedgerHQ/ledger-live/commit/da9651fa484c969369df12d777003093b0f02d9c) Thanks [@jcchevalier-ledger](https://github.com/jcchevalier-ledger)! - Keep explorer requests on the same Cloudflare load-balancer origin by replaying the `__cflb` affinity cookie

- [#22059](https://github.com/LedgerHQ/ledger-live/pull/22059) [`91ac227`](https://github.com/LedgerHQ/ledger-live/commit/91ac22740fbf677ca481382eb55d2e4e12336d2a) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(cosmos): Migrate the desktop staking UI onto the generic path

- [#22760](https://github.com/LedgerHQ/ledger-live/pull/22760) [`4bab512`](https://github.com/LedgerHQ/ledger-live/commit/4bab512f050d8f4d49a7745104b278ec94dd1d20) Thanks [@ishaba](https://github.com/ishaba)! - Add the Tronify sponsored send to the desktop Send flow behind the `gasSponsorship` flag: a USDT transfer can pay its network fee with rented energy, signing the rent payment first, then the transfer once the energy is delivered on-chain.

- [#23031](https://github.com/LedgerHQ/ledger-live/pull/23031) [`3264580`](https://github.com/LedgerHQ/ledger-live/commit/3264580e247bbd35d774b33eae21cc7c2e87d105) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Pass `swapApiEnv` (`stg` | `prd`) to the Swap live app so it follows Wallet's Swap backend

  - Derived from the `SWAP_API_BASE` url via new `getSwapAPIEnv` helper in live-common
  - Unknown hosts (e.g. localhost) send nothing; the live app keeps its own default
  - Stop passing the full `swapApiBase` url; the live app no longer reads it

- [#22891](https://github.com/LedgerHQ/ledger-live/pull/22891) [`cc764ec`](https://github.com/LedgerHQ/ledger-live/commit/cc764ec269edef9640fb58ff4aa26b70bff8d3c7) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Open swap history from the `swap/history` deeplink, with the swap matching `swapId` opened

- [#23185](https://github.com/LedgerHQ/ledger-live/pull/23185) [`437d666`](https://github.com/LedgerHQ/ledger-live/commit/437d66634fd97401a91637013ceca7d473ea32fb) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Replace @react-native-community/netinfo with expo-network behind the new @shared/network-status package, and use it for the desktop network status

- [#22708](https://github.com/LedgerHQ/ledger-live/pull/22708) [`ad3303b`](https://github.com/LedgerHQ/ledger-live/commit/ad3303b835078606b3d3f87d66879263ed3cddfb) Thanks [@qperrot](https://github.com/qperrot)! - Let the Send flow dialog grow to fit its content so the Review button stays visible with long amount messages

- [#22959](https://github.com/LedgerHQ/ledger-live/pull/22959) [`b46294e`](https://github.com/LedgerHQ/ledger-live/commit/b46294ea1eae6f65647973efc8161b23e31ae668) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(contact): display contact in tx details lwd

- [#22953](https://github.com/LedgerHQ/ledger-live/pull/22953) [`f482212`](https://github.com/LedgerHQ/ledger-live/commit/f48221278738b5b3accf7199c23e6dd84c48c27e) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - chore(device): remove the legacy connectApp and the ldmkConnectApp feature flag

  `connectApp` and `connectManager` now always use the Device Management Kit device actions and fail
  with `DmkTransportRequired` on a non-DMK transport. `apps/inlineAppInstall`, `hw/isUpdateAvailable`
  and `DeviceManagementKitTransport.listenLegacyConnectApp` are removed.

- [#23223](https://github.com/LedgerHQ/ledger-live/pull/23223) [`0a5b68d`](https://github.com/LedgerHQ/ledger-live/commit/0a5b68d609355af795c6176a4ac30c5b7142c2eb) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix(hedera): skip association for erc-20 tokens in ReceiveWithAssociationModal and resolve the new association token in the legacy adapter

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

- Updated dependencies [[`320d2a1`](https://github.com/LedgerHQ/ledger-live/commit/320d2a1fbbe0d661681913d75f76bd70c4698115), [`5b62ecb`](https://github.com/LedgerHQ/ledger-live/commit/5b62ecb5c84b36099b4f29fcca9665431a468fb7), [`d60f240`](https://github.com/LedgerHQ/ledger-live/commit/d60f240af5f814d887bb2df19db8415425b52317), [`c954015`](https://github.com/LedgerHQ/ledger-live/commit/c954015d149a86adc8a1cdfcda41a71313171b68), [`4101467`](https://github.com/LedgerHQ/ledger-live/commit/4101467e60d17f1facfae9c71e5b684bcf9f48e3), [`20bf9b0`](https://github.com/LedgerHQ/ledger-live/commit/20bf9b0c8694e9a3c873da1e81fd6b310410205c), [`4028b7e`](https://github.com/LedgerHQ/ledger-live/commit/4028b7e53019ef07b2e94a6559c5f8a6ba54b82f), [`21fa5a5`](https://github.com/LedgerHQ/ledger-live/commit/21fa5a533d3369db9586a38d6fa869f8c03121af), [`438c7b3`](https://github.com/LedgerHQ/ledger-live/commit/438c7b3035ac460e702d294a3c17db2843962d21), [`ee95a8e`](https://github.com/LedgerHQ/ledger-live/commit/ee95a8e0c4cdce091dfc1cb0e9b54445030f079c), [`1bf1044`](https://github.com/LedgerHQ/ledger-live/commit/1bf1044e3eb3b57187bf6c837b17b4ed00f870cc), [`8376d49`](https://github.com/LedgerHQ/ledger-live/commit/8376d497d552cd4644e806afdfbd5323bf10a695), [`75e55ba`](https://github.com/LedgerHQ/ledger-live/commit/75e55ba31bb763cfae2e0d850fb76930854abb39), [`52747b3`](https://github.com/LedgerHQ/ledger-live/commit/52747b3d876e34712619bd17206cd4aa23e07636), [`2a09181`](https://github.com/LedgerHQ/ledger-live/commit/2a091816a8ec716c0bba802767671052c75843e8), [`5eca063`](https://github.com/LedgerHQ/ledger-live/commit/5eca063fe675ec5cb59cc96fffe4b67fcd7f3061), [`d6e7695`](https://github.com/LedgerHQ/ledger-live/commit/d6e7695bf15852c7b0cd2a97aa0a3a0c4d047d74), [`3f4e740`](https://github.com/LedgerHQ/ledger-live/commit/3f4e7409bfc66544165598c23cbc826001632f16), [`87de6a7`](https://github.com/LedgerHQ/ledger-live/commit/87de6a72f75df73aab99da6c420de00004bf7692), [`b9da45c`](https://github.com/LedgerHQ/ledger-live/commit/b9da45cd99b74603ac760b08cf748d60f9bb4a2f), [`6e3211f`](https://github.com/LedgerHQ/ledger-live/commit/6e3211f6c887211d4ecfbf58d909f49c31df6179), [`ef84a7c`](https://github.com/LedgerHQ/ledger-live/commit/ef84a7cac52080143934ebf01511d24a4dcaa0f3), [`20484ff`](https://github.com/LedgerHQ/ledger-live/commit/20484ff8d7cc0aab2e4b8448c7e8ce9ebf6840fe), [`f047501`](https://github.com/LedgerHQ/ledger-live/commit/f047501381efde857b48c1314d2de637fdce8ade), [`23455ab`](https://github.com/LedgerHQ/ledger-live/commit/23455abfdc26b44eedd77a1c990a6721dadd3f5c), [`94e247b`](https://github.com/LedgerHQ/ledger-live/commit/94e247bcaa49bd601951be6f39182ee26ed67ecc), [`bf29f88`](https://github.com/LedgerHQ/ledger-live/commit/bf29f888316e5d8d9049b763a8c77ce9850f07df), [`c9b7594`](https://github.com/LedgerHQ/ledger-live/commit/c9b75949c8f01cade6b061bd5b6ecb0af5b0ec5f), [`7a2505b`](https://github.com/LedgerHQ/ledger-live/commit/7a2505bd21cc2401e1e887cb5b9713281cb11519), [`abf8d33`](https://github.com/LedgerHQ/ledger-live/commit/abf8d33f65a4177d2ab8c727c2b53c2b4439c676), [`d33fd72`](https://github.com/LedgerHQ/ledger-live/commit/d33fd721a5d1a9363f820738f6aadbeb0a8b3cad), [`bc85ada`](https://github.com/LedgerHQ/ledger-live/commit/bc85ada15c9403d1180d5af23f730196fd0cc672), [`0c507ff`](https://github.com/LedgerHQ/ledger-live/commit/0c507ffb0964a6bfbd221ecd83f00d0259921ada), [`d819300`](https://github.com/LedgerHQ/ledger-live/commit/d819300df11d1e58ad33dbb8d0dbdb6f20c8dd93), [`48874b3`](https://github.com/LedgerHQ/ledger-live/commit/48874b3b33c83b40f7c2c389f7a84ebe96d58816), [`4c28d72`](https://github.com/LedgerHQ/ledger-live/commit/4c28d726d50493ed3967c1a7eb84392442dfbeb9), [`e308deb`](https://github.com/LedgerHQ/ledger-live/commit/e308deb3e4f812f01166de17bb28c587a290b9bb), [`01ee590`](https://github.com/LedgerHQ/ledger-live/commit/01ee5909821c32b21577295f03f57a970e8fad2f), [`3dda070`](https://github.com/LedgerHQ/ledger-live/commit/3dda0705f09d0e0da75ebde9a76b17ba7a9f65e6), [`db3bde1`](https://github.com/LedgerHQ/ledger-live/commit/db3bde1a0ea2435389260b012d9759dd26f7b174), [`e7996b4`](https://github.com/LedgerHQ/ledger-live/commit/e7996b4bb9f13726af09cc5202d26d1e471563ef), [`ac0379e`](https://github.com/LedgerHQ/ledger-live/commit/ac0379ea0511dd457d6bba6a540d48b8358f4f93), [`33467b2`](https://github.com/LedgerHQ/ledger-live/commit/33467b29525ab06b0abce96ed8489a61a01429c5), [`932097d`](https://github.com/LedgerHQ/ledger-live/commit/932097d4a1a5c9e26848a8de0120667f8c14557a), [`5f07a43`](https://github.com/LedgerHQ/ledger-live/commit/5f07a4399d54e6ebccb953045324d8ec5b571ad3), [`ca82e70`](https://github.com/LedgerHQ/ledger-live/commit/ca82e703691d6e9716b522180d402d7eed9abc5f), [`0f401bb`](https://github.com/LedgerHQ/ledger-live/commit/0f401bb6289b6e78fbd05b6f98977bde4999d22a), [`3347eb8`](https://github.com/LedgerHQ/ledger-live/commit/3347eb88f282e2286b43493dadb0a9dd3d1f81d5), [`21ab07f`](https://github.com/LedgerHQ/ledger-live/commit/21ab07f8912d9c7fa9fb7e438e4e7873ca674f02), [`9ddaa97`](https://github.com/LedgerHQ/ledger-live/commit/9ddaa970d609f4b54f0cdbbda0609242cca54cf7), [`e80d009`](https://github.com/LedgerHQ/ledger-live/commit/e80d009b57fbec125c43649fcc0b21edc60cb473), [`fa2c070`](https://github.com/LedgerHQ/ledger-live/commit/fa2c070913fb13e530c65d901151c2766c46caf6), [`d1eeaab`](https://github.com/LedgerHQ/ledger-live/commit/d1eeaabf43a54a3d2c4796ea1c5b11a0b9202814), [`eb23867`](https://github.com/LedgerHQ/ledger-live/commit/eb23867603dc4e80723cdfe5486c28bc88d57014), [`90e805d`](https://github.com/LedgerHQ/ledger-live/commit/90e805d9c1b0ef536d1e53489c73b88056731993), [`1f50e41`](https://github.com/LedgerHQ/ledger-live/commit/1f50e41fc85d46eec8ffdec4d27ab573a5cbb28e), [`3dae3bb`](https://github.com/LedgerHQ/ledger-live/commit/3dae3bb200941b7e8ed4e56485e401fda188de8b), [`ff5e1b0`](https://github.com/LedgerHQ/ledger-live/commit/ff5e1b0f5a315aaccd3e23aeb8ccd2c7d48730f4), [`7bf8668`](https://github.com/LedgerHQ/ledger-live/commit/7bf8668bea3ae36c1a5c176bc5538311bafbee3d), [`f5fa6e1`](https://github.com/LedgerHQ/ledger-live/commit/f5fa6e18fe429074cda26578f8b0c4642927e0d6), [`dccba0c`](https://github.com/LedgerHQ/ledger-live/commit/dccba0c7481c705b4a295942171891deff1c0e85), [`7ff8f5b`](https://github.com/LedgerHQ/ledger-live/commit/7ff8f5b518a19e73005ef974121ce21e593a8e99), [`826a87c`](https://github.com/LedgerHQ/ledger-live/commit/826a87c08f3757ed3b1fd63f217ed9493082811d), [`6bb4b44`](https://github.com/LedgerHQ/ledger-live/commit/6bb4b44d94a29c3eb8eaffaafda55ca9d6934e2b), [`9c9cae5`](https://github.com/LedgerHQ/ledger-live/commit/9c9cae5ab492b74d52b13e0a5b0673bd681f8d9d), [`c59fbf4`](https://github.com/LedgerHQ/ledger-live/commit/c59fbf41212398e3d0c1000c776d33c6344290a3), [`dd2d1f8`](https://github.com/LedgerHQ/ledger-live/commit/dd2d1f8965897befc6e49f041eeccc51deb9578c), [`b8fc9af`](https://github.com/LedgerHQ/ledger-live/commit/b8fc9af53fc59427695bb0fe81d11d46ef74742e), [`3a45eb3`](https://github.com/LedgerHQ/ledger-live/commit/3a45eb3e29f417f24570787e76d977cefa5090d9), [`29b0e0c`](https://github.com/LedgerHQ/ledger-live/commit/29b0e0c324494c21d82f5deb26f6774c3c5aca6f), [`4182256`](https://github.com/LedgerHQ/ledger-live/commit/4182256c2213208e330861b904a6d8859d1b3e60), [`0a65851`](https://github.com/LedgerHQ/ledger-live/commit/0a65851ea6de6228030a2c94f0cad2234903db2b), [`3444d16`](https://github.com/LedgerHQ/ledger-live/commit/3444d16d5159b6e415b4dd0ab4fedfbf4cbeb260), [`8783545`](https://github.com/LedgerHQ/ledger-live/commit/87835456704c2322a25339ef27ef92a320d02025), [`f3b3c1c`](https://github.com/LedgerHQ/ledger-live/commit/f3b3c1c8479c2ae12d6a57eef030b04b2e665483), [`4d9cfbd`](https://github.com/LedgerHQ/ledger-live/commit/4d9cfbd7eff1fb20fb2052b0a2f2b21ea87ba052), [`09db449`](https://github.com/LedgerHQ/ledger-live/commit/09db4497ad5e67c6510e87608d694bd06963213e), [`fb02fb0`](https://github.com/LedgerHQ/ledger-live/commit/fb02fb00d21b2fda4c1e0d6194db33b7fe0d2f93), [`bac3334`](https://github.com/LedgerHQ/ledger-live/commit/bac3334a1c58495722e2c5a123c7d2a26b0c8d7d), [`dad0153`](https://github.com/LedgerHQ/ledger-live/commit/dad01537ce5e0263964adcfaf762246003c527b4), [`82946e5`](https://github.com/LedgerHQ/ledger-live/commit/82946e53e676943851a8a9e153bafc641a40778b), [`f9ebcf6`](https://github.com/LedgerHQ/ledger-live/commit/f9ebcf6d2b79758ea43554977a8997df25c4e3b4), [`e3e6c22`](https://github.com/LedgerHQ/ledger-live/commit/e3e6c222ddba748a7e9e03e85f5919ce8e5c28bd), [`99f7c87`](https://github.com/LedgerHQ/ledger-live/commit/99f7c87afc8029eca9bf574df03123bf07ca7810), [`77e7162`](https://github.com/LedgerHQ/ledger-live/commit/77e716257785645b79027b580fcef2dfbab7ad3b), [`77e7162`](https://github.com/LedgerHQ/ledger-live/commit/77e716257785645b79027b580fcef2dfbab7ad3b), [`57921f9`](https://github.com/LedgerHQ/ledger-live/commit/57921f955b6c07389cb78d4c087c881667858dc2), [`1b78e74`](https://github.com/LedgerHQ/ledger-live/commit/1b78e7406cc6b871ebf50590a03f47848c1718a9), [`a99d63a`](https://github.com/LedgerHQ/ledger-live/commit/a99d63a75a8d02a14bdfef0eaaa249c3f92d1ced), [`4aa7793`](https://github.com/LedgerHQ/ledger-live/commit/4aa77939cec43fd1aac459689c372868dece3496), [`0e7d80a`](https://github.com/LedgerHQ/ledger-live/commit/0e7d80ad750683fd37a150fe36ef5add632072cd), [`5f7cc73`](https://github.com/LedgerHQ/ledger-live/commit/5f7cc73ec88df6e84e970818668adca6cf7e5fe2), [`eb65ce4`](https://github.com/LedgerHQ/ledger-live/commit/eb65ce49ea0fa2d2c44f79fd2b0f8de365ae5e53), [`aaedf56`](https://github.com/LedgerHQ/ledger-live/commit/aaedf5692e9c1407327d009fea8133e51ca48f26), [`c26bbea`](https://github.com/LedgerHQ/ledger-live/commit/c26bbea7477d27f6042657c3a3c48c05f85b1f59), [`667d378`](https://github.com/LedgerHQ/ledger-live/commit/667d378b97e9102df009015e01fed6b49fd88b82), [`f45fc80`](https://github.com/LedgerHQ/ledger-live/commit/f45fc8027562e53cdbd3500a2884084df6a4af8e), [`78b38fb`](https://github.com/LedgerHQ/ledger-live/commit/78b38fb3820d3391c5c04812fee88c1c2a6e9289), [`4dec481`](https://github.com/LedgerHQ/ledger-live/commit/4dec481cf274c6db74c334e5a74df574a8d04f54), [`b2792d8`](https://github.com/LedgerHQ/ledger-live/commit/b2792d8806411c2a35e1622109bee830c44a6cbc), [`6f2ecf8`](https://github.com/LedgerHQ/ledger-live/commit/6f2ecf89dd1d978038f573738d6e85fe1805b5d9), [`18166fb`](https://github.com/LedgerHQ/ledger-live/commit/18166fbe8719d50c911aa0ab349e68c414f8fc62), [`339d174`](https://github.com/LedgerHQ/ledger-live/commit/339d17482fba108dfca790c2500c697a818f7a1c), [`3160fa7`](https://github.com/LedgerHQ/ledger-live/commit/3160fa7a2f2a6e121d15766609902e83f4efc71f), [`1a9b21e`](https://github.com/LedgerHQ/ledger-live/commit/1a9b21e6cc971d5e5b069cab968826b15332024b), [`812d03f`](https://github.com/LedgerHQ/ledger-live/commit/812d03f74d4324c2b165d4fb67fb3b31834d2b67), [`c037aa8`](https://github.com/LedgerHQ/ledger-live/commit/c037aa854190763e8654b7bb38a4486f4207caa8), [`dce4fb6`](https://github.com/LedgerHQ/ledger-live/commit/dce4fb6a4ec291153cc5b4d5a0d5000f777007e1), [`a663e23`](https://github.com/LedgerHQ/ledger-live/commit/a663e23f97df77ee25be5c9b5f7abfa3649bcde1), [`6c8bd31`](https://github.com/LedgerHQ/ledger-live/commit/6c8bd31900a6b6aa8987cc82f6d907bbc3611fc1), [`bed3cf9`](https://github.com/LedgerHQ/ledger-live/commit/bed3cf9bd880e00d51fc90849dca3741b9ab779f), [`5e611ff`](https://github.com/LedgerHQ/ledger-live/commit/5e611ffffdcf2c73fb55c8b673693dfa88d1077c), [`91ad9a0`](https://github.com/LedgerHQ/ledger-live/commit/91ad9a0e481e3935f80089a800293a4733aef450), [`2b2eee6`](https://github.com/LedgerHQ/ledger-live/commit/2b2eee6a4abfb86615f3e5a628f518b5a9c58dad), [`b99f923`](https://github.com/LedgerHQ/ledger-live/commit/b99f923997846b785c348006c5b434104c04f4a2), [`9717369`](https://github.com/LedgerHQ/ledger-live/commit/97173699dce7021d1c78713a72c4d79406324877), [`63c700c`](https://github.com/LedgerHQ/ledger-live/commit/63c700c28652b8a48e4ef57a6b73380b12434e61), [`8737f89`](https://github.com/LedgerHQ/ledger-live/commit/8737f89e2b515ab518cbcdeacc064641c6f595be), [`42d4dc2`](https://github.com/LedgerHQ/ledger-live/commit/42d4dc25044dceb9936c1907fb5ea0838fa0a64b), [`6d744e0`](https://github.com/LedgerHQ/ledger-live/commit/6d744e0d30b4480282d35c359d096f3f6d6602af), [`644071b`](https://github.com/LedgerHQ/ledger-live/commit/644071ba1aba85cdce57c423934be80f91639155), [`6756f58`](https://github.com/LedgerHQ/ledger-live/commit/6756f5881526607858dbc2ba3d8065e5453b2d5a), [`7073e2d`](https://github.com/LedgerHQ/ledger-live/commit/7073e2d835a79e3e014ca1a9631e73c1f21989c6), [`35d9396`](https://github.com/LedgerHQ/ledger-live/commit/35d9396f690292ae8efda27b24ac4143f03cd00b), [`c92c32e`](https://github.com/LedgerHQ/ledger-live/commit/c92c32e66d20de8a85454bf1fc444dadd3a51e76), [`77d202b`](https://github.com/LedgerHQ/ledger-live/commit/77d202b1930715ed30b62521fbc5692969b6ec47), [`9a39ad5`](https://github.com/LedgerHQ/ledger-live/commit/9a39ad5eeeaefff74791ec01db8c62c102b6e54a), [`7f0d867`](https://github.com/LedgerHQ/ledger-live/commit/7f0d867cc9f8715b9244979e42a035babe43d2ab), [`69284e8`](https://github.com/LedgerHQ/ledger-live/commit/69284e8fff6db3afdf4b0c05254214baa8e4762b), [`bcd25fd`](https://github.com/LedgerHQ/ledger-live/commit/bcd25fd87bda9e7e8b7c3ee2a243d3e241adc0b0), [`91ac227`](https://github.com/LedgerHQ/ledger-live/commit/91ac22740fbf677ca481382eb55d2e4e12336d2a), [`4bab512`](https://github.com/LedgerHQ/ledger-live/commit/4bab512f050d8f4d49a7745104b278ec94dd1d20), [`99b54cd`](https://github.com/LedgerHQ/ledger-live/commit/99b54cdac46807286d75caa1a94e61a37606c18f), [`3264580`](https://github.com/LedgerHQ/ledger-live/commit/3264580e247bbd35d774b33eae21cc7c2e87d105), [`f482212`](https://github.com/LedgerHQ/ledger-live/commit/f48221278738b5b3accf7199c23e6dd84c48c27e), [`766d1eb`](https://github.com/LedgerHQ/ledger-live/commit/766d1ebf51eccbbaefd0b3d47b07f3e3b8672775), [`3cdcba9`](https://github.com/LedgerHQ/ledger-live/commit/3cdcba9252780b413452cb100682cf08041d966e), [`0a5b68d`](https://github.com/LedgerHQ/ledger-live/commit/0a5b68d609355af795c6176a4ac30c5b7142c2eb), [`8312d68`](https://github.com/LedgerHQ/ledger-live/commit/8312d6818aa5fa37f523352f81f51a61dd502bf2), [`c5c2815`](https://github.com/LedgerHQ/ledger-live/commit/c5c2815ec53dbf88804e558952f1451f13c37bb4), [`b7cc410`](https://github.com/LedgerHQ/ledger-live/commit/b7cc41062a66145da018db31722d0df45ed98b1c), [`74a7067`](https://github.com/LedgerHQ/ledger-live/commit/74a706756e9009886a490052d0f3005c6837e8b1), [`33094bc`](https://github.com/LedgerHQ/ledger-live/commit/33094bc31d9d8cd7a80b8eae3cf2b4afe3afa500)]:
  - @ledgerhq/asset-detail@0.12.0-next.0
  - @ledgerhq/transaction-observability@0.5.0-next.0
  - @ledgerhq/coin-stacks@0.33.0-next.0
  - @ledgerhq/live-common@38.3.0-next.0
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
  - @ledgerhq/coin-zcash@0.11.0-next.0
  - @domain/entity-currency-crypto@0.15.0-next.0
  - @ledgerhq/wallet-btc@0.7.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.7.0-next.0
  - @domain/api-market-countervalues@0.2.0-next.0
  - @domain/entity-market-countervalues@0.3.0-next.0
  - @shared/api-services@0.10.0-next.0
  - @ledgerhq/coin-cardano@2.0.0-next.0
  - @ledgerhq/types-live@6.127.0-next.0
  - @shared/env@0.10.0-next.0
  - @ledgerhq/live-dmk-shared@0.35.0-next.0
  - @ledgerhq/live-dmk-desktop@0.24.0-next.0
  - @ledgerhq/device-onboarding@0.5.0-next.0
  - @ledgerhq/coin-canton@1.4.0-next.0
  - @features/platform-card@0.8.0-next.0
  - @features/flow-pay-card-auth@0.10.0-next.0
  - @features/platform-content-ab-tests@0.2.0-next.0
  - @ledgerhq/coin-cosmos@1.6.0-next.0
  - @features/platform-market-countervalues@0.2.0-next.0
  - @ledgerhq/asset-aggregation@0.18.0-next.0
  - @ledgerhq/wallet-pnl@0.8.0-next.0
  - @domain/entity-client-identity@0.3.0-next.0
  - @features/platform-feature-flags-firebase@0.1.0-next.0
  - @features/platform-feature-flags@0.9.0-next.0
  - @domain/api-aggregated-assets@0.6.0-next.0
  - @features/flow-pay-feature-tour@0.8.0-next.0
  - @devtools/bindings@0.11.0-next.0
  - @features/flow-pay-card-details@0.7.0-next.0
  - @features/flow-pay-card@0.7.0-next.0
  - @ledgerhq/react-ui@0.56.0-next.0
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
  - @features/flow-pay-card-widget@0.5.1-next.0
  - @devtools/wire@0.5.1
  - @domain/entity-account@0.0.1
  - @domain/entity-account-alias@0.1.0
  - @domain/entity-account-name@0.2.2
  - @domain/entity-analytics-consent@0.2.2
  - @domain/entity-card-asset-mapping@0.7.0
  - @domain/entity-currency-fiat@0.4.0
  - @domain/entity-currency-unit@0.3.0
  - @domain/entity-interest-rate@0.3.0
  - @domain/entity-market-index-fear-and-greed@0.3.0
  - @domain/entity-recent-addresses@0.2.1
  - @domain/entity-starred-account@0.0.1
  - @domain/entity-wallet-sync@0.1.0
  - @features/flow-fear-and-greed@0.3.0
  - @features/platform-app-update@0.0.0
  - @features/platform-device-intent@5.2.0
  - @features/platform-pay-analytics@0.3.0
  - @features/platform-style@0.4.0
  - @features/platform-wallet-sync@0.1.3
  - @ledgerhq/ethereum-provider@0.8.0
  - @ledgerhq/live-dmk-speculos@0.11.0
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

- [#22840](https://github.com/LedgerHQ/ledger-live/pull/22840) [`e4c24f3`](https://github.com/LedgerHQ/ledger-live/commit/e4c24f3ebd7fe5838a6639e70b10b12863088e10) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Name the default Me contact "Me" in the Pay tab contacts list instead of "My addresses (Me)"

- [#22634](https://github.com/LedgerHQ/ledger-live/pull/22634) [`e3b6f7a`](https://github.com/LedgerHQ/ledger-live/commit/e3b6f7a8549cbbbdb74dcca483f58bf3d0f4cc80) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - fix(aleo): keep the newer public and private sync fields when both syncs overlap

- [#22381](https://github.com/LedgerHQ/ledger-live/pull/22381) [`c5964f8`](https://github.com/LedgerHQ/ledger-live/commit/c5964f8c6348028d97832dd46cd8554d813d48db) Thanks [@ysitbon](https://github.com/ysitbon)! - Rename `@domain/api-market-sentiment` to `@domain/api-market-index-fear-and-greed`, and its exported api from `marketSentimentApi` to `fearAndGreedApi`, so the name states which CoinMarketCap index the package serves

- [#22653](https://github.com/LedgerHQ/ledger-live/pull/22653) [`e8d5e1b`](https://github.com/LedgerHQ/ledger-live/commit/e8d5e1bf6eec2a47072ad59762064b24a89701cf) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Bump DMK dependencies: device-management-kit 1.10.0, device-signer-kit-solana 1.13.3, device-signer-kit-ethereum 1.18.1, context-module 2.6.0, dmk-ledger-wallet 0.6.0, device-contacts-kit 0.5.0, signer-utils 1.3.0, device-transport-kit-mockserver 1.1.2

- [#22567](https://github.com/LedgerHQ/ledger-live/pull/22567) [`3ee4143`](https://github.com/LedgerHQ/ledger-live/commit/3ee4143819b419d07642d06f073d0019ebfc5dca) Thanks [@tonykhaov](https://github.com/tonykhaov)! - List the Me contact in the desktop Send recipient contacts, like mobile, with only its addresses on the selected network.

- [#22615](https://github.com/LedgerHQ/ledger-live/pull/22615) [`7bc8d65`](https://github.com/LedgerHQ/ledger-live/commit/7bc8d65f5565f881094751204475f7e3d0b16106) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Open the Pay request flow from the Add stablecoin "Crypto address" option instead of the standard Receive flow

- [#22318](https://github.com/LedgerHQ/ledger-live/pull/22318) [`83b8a5c`](https://github.com/LedgerHQ/ledger-live/commit/83b8a5c95bed52ad2ba5ffef866f978596b855fc) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Use dnd-kit to reorder card assets in the desktop manage-assets dialog

- [#22379](https://github.com/LedgerHQ/ledger-live/pull/22379) [`ad2f1de`](https://github.com/LedgerHQ/ledger-live/commit/ad2f1deb73d1fd6fed1383133a7f2b259630cd06) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Let the card transaction history read past its first page.

  - Both platforms read on by scrolling: native through the list's `onEndReached`, web through an observer on a sentinel at the end of the table.
  - A spinner marks the page in flight; no new copy, so nothing to translate.
  - Both take `loadMore`/`isLoadingMore` from the shared view model, so the three-row previews on the Pay surfaces are unaffected.

- [#22432](https://github.com/LedgerHQ/ledger-live/pull/22432) [`cfb7566`](https://github.com/LedgerHQ/ledger-live/commit/cfb756682290e9940d65f3b6417d6b111449e546) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Show the cashback a card transaction earned in its detail view

- [#22665](https://github.com/LedgerHQ/ledger-live/pull/22665) [`46cfd43`](https://github.com/LedgerHQ/ledger-live/commit/46cfd437c30624c37b3d89478eba43aa1391ef92) Thanks [@lysyi3m](https://github.com/lysyi3m)! - fix(celo): label pending withdrawal rows with their unlock date

- [#22474](https://github.com/LedgerHQ/ledger-live/pull/22474) [`1a26e59`](https://github.com/LedgerHQ/ledger-live/commit/1a26e599a47d52854cf05081a386e6090d8677f2) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Update coin module dependencies (coin-evm, coin-module-framework, coin-stellar, coin-tezos) and rebuild the lockfile

- [#22572](https://github.com/LedgerHQ/ledger-live/pull/22572) [`6e76dda`](https://github.com/LedgerHQ/ledger-live/commit/6e76ddac6370bb60b17971679a857fae7ca83eb9) Thanks [@tonykhaov](https://github.com/tonykhaov)! - `ContactAvatar` takes `isMe` and is the only avatar that formats the Me label, so a Me avatar is announced once as "<name> (Me)". `MeAvatar` takes a display-ready `label` and is no longer exported; `ME_AVATAR_URL` stays exported. `PaySuccessRecipient.isMe` is now required.

- [#22656](https://github.com/LedgerHQ/ledger-live/pull/22656) [`486a1a4`](https://github.com/LedgerHQ/ledger-live/commit/486a1a45027e8104ae824d77bd34b298788c9b04) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Only mention ENS in the contact address input placeholder for networks that support domain resolution (LIVE-38284).

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

- [#22534](https://github.com/LedgerHQ/ledger-live/pull/22534) [`c5a6a7e`](https://github.com/LedgerHQ/ledger-live/commit/c5a6a7e7d62b867a443346b152ca5b1d801f6a66) Thanks [@ysitbon](https://github.com/ysitbon)! - fix(feature-flags): report a re-resolution that throws

  A feature-flags re-resolution that throws at boot is now reported through `logger.critical`,
  whatever the state of the remote-flag cache.

- [#22503](https://github.com/LedgerHQ/ledger-live/pull/22503) [`33b4952`](https://github.com/LedgerHQ/ledger-live/commit/33b4952ef04d4e0528d2735ba299b4a8073e447e) Thanks [@daniel-choinski-ledger](https://github.com/daniel-choinski-ledger)! - Inject the Tron address book into the DMK Tron signer so Tron transactions can clear-sign saved contact names.

  Adds a generic `AddressBookProvider<T>` in `live-dmk-shared` (the EVM provider is refactored onto it), a `tronAddressBookProvider` instance, a pure `toTronAddressBook` mapper (`Contact[] -> TronAddressBook`, Tron-family only, no chain id, `ledgerAccounts` always empty), and registers the source at each app's composition root. An absent or empty book leaves signing behavior unchanged.

- [#22481](https://github.com/LedgerHQ/ledger-live/pull/22481) [`d6866e7`](https://github.com/LedgerHQ/ledger-live/commit/d6866e7dc7ced8898ac585d4e34d9667d9ad7f17) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - adapt crypto card title to be consistent

- [#22058](https://github.com/LedgerHQ/ledger-live/pull/22058) [`f8c92f9`](https://github.com/LedgerHQ/ledger-live/commit/f8c92f9300d4b8268949ed7aff5a6781ed7f60a8) Thanks [@alexstapenka-ledger](https://github.com/alexstapenka-ledger)! - Instrument the shared sign/broadcast bridge defensively and dispatch consent-independent Earn
  transaction lifecycle events for native staking and allow-listed dApps on Desktop and Mobile.

- [#22558](https://github.com/LedgerHQ/ledger-live/pull/22558) [`e046686`](https://github.com/LedgerHQ/ledger-live/commit/e046686befa308188170ac9950eae394863c76a5) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(cosmos): staking validation rule in the generic path

- [#22788](https://github.com/LedgerHQ/ledger-live/pull/22788) [`3699ef4`](https://github.com/LedgerHQ/ledger-live/commit/3699ef4a5d48c99dcf9892324ef1ed6bc7cccdbc) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Hide the Pay tab card and its history when the pay-tab flag's card param is false

- [#22614](https://github.com/LedgerHQ/ledger-live/pull/22614) [`b4599a5`](https://github.com/LedgerHQ/ledger-live/commit/b4599a58f817aa233be256d6f755a0fd4d0fc8a5) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Update the verify address next steps copy, add a third step, and size the mobile shield spot to match desktop

- [#22433](https://github.com/LedgerHQ/ledger-live/pull/22433) [`8c787ee`](https://github.com/LedgerHQ/ledger-live/commit/8c787eec93a4d8155cea02c46c426acd50b163e5) Thanks [@jeportie](https://github.com/jeportie)! - Add test IDs to the My Ledger values that automation has to read.

  The device storage figures and the install success banner render their values as bare text nodes, so a test can see the containers but cannot assert what they show. This adds them to the used, capacity, apps count and free space figures in the storage card, and to the install success banner's title and its manage accounts button.

  No behaviour changes: every addition is a `data-testid` attribute.

- [#22322](https://github.com/LedgerHQ/ledger-live/pull/22322) [`08e23bb`](https://github.com/LedgerHQ/ledger-live/commit/08e23bb00577065206a028365d18b7e509cbdca4) Thanks [@jeportie](https://github.com/jeportie)! - Add test IDs to the My Ledger controls that automation has to click.

  The manager screen already exposes test IDs for its containers, inputs and success states, but not for several triggers and submit buttons, so those flows could not be driven from a test. This adds them to the app catalog's Show and Sort dropdowns, the device rename entry point and its submit button, the custom lock screen removal link and its success state, and the OS version and genuine badge values.

  No behaviour changes: every addition is a `data-testid` attribute.

- [#22571](https://github.com/LedgerHQ/ledger-live/pull/22571) [`e3c51c5`](https://github.com/LedgerHQ/ledger-live/commit/e3c51c57487a765391677073d78fb9ce275374b6) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Show a matched Me contact as "<name> (Me)" in Send: the recipient card, the "Address matched" row, the amount step "To" header, the Pay success title and the History counterparty. `MatchedContact` and `RecipientHeaderContact` now carry `isMe`, and `RecipientHeaderPresentation.label` is renamed `recipientDisplayValue` and never holds a contact name.

- [#22438](https://github.com/LedgerHQ/ledger-live/pull/22438) [`f9b43be`](https://github.com/LedgerHQ/ledger-live/commit/f9b43beb27558199ac97c56a7787e49c49c8b204) Thanks [@pawell24](https://github.com/pawell24)! - fix(near): size staking gas from measured usage and price it the way the chain does

  Staking fees priced the attached gas at the current gas price. nearcore buys the gas attached
  to a receipt at `max(current_gas_price, min_gas_purchase_price)`, and that floor is an order of
  magnitude above the current price on mainnet, so every stake, unstake and withdraw quoted about a
  tenth of what the account had to hold. A withdraw quoted at 0.02 NEAR was rejected on broadcast
  with `NotEnoughBalance` naming a cost of 0.1759 NEAR.

  The fee now uses the same floor the runtime does, and the attached gas drops from 125 TGas (175
  for withdraw_all) to 50 TGas for every staking call. The heaviest poolv1 path, the first call in
  a new epoch which also restakes and runs the pool's 20 TGas `on_stake_action` callback, was
  measured across five mainnet pools: at most 13.64 TGas charged, and 30 TGas attached succeeds on
  it. The old budget, bought at the floor, locked 0.2 NEAR for a call that burns about 0.001;
  the new one locks 0.055.

  Unstake and withdraw are validated against the balance left above storage staking, which is what
  the chain checks, instead of the spendable balance that also subtracts the minimum-balance
  reserve. The withdraw flow gains the NotEnoughFundsToUnstake banner the unstake flow already
  shows, so a real shortfall is explained with the available balance and Buy/Swap/Deposit actions.

  The NEAR coin-tester scenario's withdraw step now requires the withdrawn amount itself to have
  landed before the send-max step sizes its amount: the pool pays out through a Transfer receipt
  that lands a block after the call, and the smaller gas refund alone used to satisfy the step.

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

- [#22302](https://github.com/LedgerHQ/ledger-live/pull/22302) [`e81a3d8`](https://github.com/LedgerHQ/ledger-live/commit/e81a3d863b0cc83ed021c23938bc1348ce615a46) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Attach Pay Mixpanel user properties when the Pay flag is on.

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

- [#22899](https://github.com/LedgerHQ/ledger-live/pull/22899) [`40b22c1`](https://github.com/LedgerHQ/ledger-live/commit/40b22c1c98b985d025e370475bcd13964b578b6e) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Show a "Go to CL Card" disclaimer below the Pay contacts when the `card_disclaimer` param of `lwdPayTab` is on. It opens the same CL Card webview as "I have a card" on the Card screen.

- [#22899](https://github.com/LedgerHQ/ledger-live/pull/22899) [`56640ba`](https://github.com/LedgerHQ/ledger-live/commit/56640ba2c03cec8555f7452da785c8dd949ec010) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Show the Card login on the desktop Pay tab when the `card_live_app` param of `lwdPayTab` is on. "Create an account" opens the card program live app and "Log in" opens the CL Card live app.

- [#22389](https://github.com/LedgerHQ/ledger-live/pull/22389) [`9c98732`](https://github.com/LedgerHQ/ledger-live/commit/9c98732967950e28d44e2d3d065d44e208dad9b5) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Collapse the Pay Tab card hosted-page openers into one helper and pass the host view model through to the card flow

- [#22899](https://github.com/LedgerHQ/ledger-live/pull/22899) [`87f8ce0`](https://github.com/LedgerHQ/ledger-live/commit/87f8ce0cccbfeffd8865d7d33130298e8e3c2e81) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Read the desktop Pay card face (native, live app, disclaimer) from one `usePayCardFace` hook.

- [#22507](https://github.com/LedgerHQ/ledger-live/pull/22507) [`219049d`](https://github.com/LedgerHQ/ledger-live/commit/219049db91c6b01ec53bc80c9d70434bd6d0c1ce) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Keep the Baanx session when the user leaves and opens the Pay tab again.

- [#22328](https://github.com/LedgerHQ/ledger-live/pull/22328) [`41eca65`](https://github.com/LedgerHQ/ledger-live/commit/41eca657432071ba1d22029b79be85ca3eff6a94) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Open top-up in the legacy `cl-card` live app when the new `legacyTopUp` param of `lwdPayTab` or `lwmPayTab` is on.

- [#22293](https://github.com/LedgerHQ/ledger-live/pull/22293) [`912b087`](https://github.com/LedgerHQ/ledger-live/commit/912b0877538bd06cc7187b90e2eab8182fe55034) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Keep the aspect ratio of the login intro hero image and theme the desktop row icons

- [#22546](https://github.com/LedgerHQ/ledger-live/pull/22546) [`defb949`](https://github.com/LedgerHQ/ledger-live/commit/defb949c02d9d0d935882eb8e8617d000e18b163) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - fix(pay-card): keep the card visible, with a loading balance, while the session resolves

- [#22682](https://github.com/LedgerHQ/ledger-live/pull/22682) [`f678cbd`](https://github.com/LedgerHQ/ledger-live/commit/f678cbd3c4ac2a5028d98142e076380c1dc2f216) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Mention Monavate instead of Baanx in the Pay card add asset and withdraw copy.

- [#22908](https://github.com/LedgerHQ/ledger-live/pull/22908) [`23ee31c`](https://github.com/LedgerHQ/ledger-live/commit/23ee31c0ebf892ea7924e18dc43ad947e7810782) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Pay card login: name Monavate instead of Baanx in "Log in to" and "Card provided by".

- [#22446](https://github.com/LedgerHQ/ledger-live/pull/22446) [`3d41eab`](https://github.com/LedgerHQ/ledger-live/commit/3d41eab30728e94a21c53d4d4d9fe6eec27a5ce1) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Open the hosted cashback page from the Pay card reward banner

- [#22353](https://github.com/LedgerHQ/ledger-live/pull/22353) [`ae229f2`](https://github.com/LedgerHQ/ledger-live/commit/ae229f27b250d6bdd06af1b06a2912a8c556a27c) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Show a counter-value on the card rewards banner.

  - The reward wallet now carries the currency it is denominated in, like a linked wallet does.
  - The banner prices it with the host's rates and leads with the counter-value.
  - The amount is formatted as a token, not as fiat.
  - A reward nothing can price shows the asset amount alone.
  - `priceWallet` is renamed `getCounterValue`: it converts an amount, it does not price a wallet.

- [#22899](https://github.com/LedgerHQ/ledger-live/pull/22899) [`8369030`](https://github.com/LedgerHQ/ledger-live/commit/836903036462a9524c834f5b6c3e8d7873bcf2e6) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Send the live app webview Back button to Pay when the webview was opened from Pay with `fromPayTab` state.

- [#22241](https://github.com/LedgerHQ/ledger-live/pull/22241) [`3b95cbb`](https://github.com/LedgerHQ/ledger-live/commit/3b95cbb5968a4484966233313ca8e2781b720ae8) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Include the Me contact in Pay contact strips and contact selection, keeping the existing order.

- [#22358](https://github.com/LedgerHQ/ledger-live/pull/22358) [`973a613`](https://github.com/LedgerHQ/ledger-live/commit/973a6136087e8e78eeffd0e761ed3828f9f81691) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Show a Pay disclaimer at the bottom of the desktop Card panel and the mobile Pay tab.

- [#22440](https://github.com/LedgerHQ/ledger-live/pull/22440) [`a39ba90`](https://github.com/LedgerHQ/ledger-live/commit/a39ba900d889155ebc4fe2cab88f82a715e3f605) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix remaining Pay Mixpanel events and user properties from the tracking plan

- [#22427](https://github.com/LedgerHQ/ledger-live/pull/22427) [`b9742c4`](https://github.com/LedgerHQ/ledger-live/commit/b9742c46b56860cc572643b25abfe64660082968) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Drop brackets around the recipient name on the Pay send confirmation screen.

- [#22889](https://github.com/LedgerHQ/ledger-live/pull/22889) [`fe55ea3`](https://github.com/LedgerHQ/ledger-live/commit/fe55ea349a8227d398bd570e68a8756392a4dd21) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add feature-flag scenarios for the native Pay card, Card live app login, and CL Card disclaimer

- [#22402](https://github.com/LedgerHQ/ledger-live/pull/22402) [`dccea32`](https://github.com/LedgerHQ/ledger-live/commit/dccea322ed808abfa4e6829364fe945cd0a58383) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Polish the Pay tab: keep the last row of every Pay bottom sheet clear of the Android navigation bar and the iOS home indicator, size the card action buttons to `md`, make the desktop contacts table responsive with a wider name column, wrap the address-picker title, add 32px of scroll padding, widen the history tabs, fix the disclaimer copy and use the shield icon on verify address

- [#22031](https://github.com/LedgerHQ/ledger-live/pull/22031) [`f28215d`](https://github.com/LedgerHQ/ledger-live/commit/f28215d4b314c2a2dd32b5f2355aacc4776ee1f5) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Reserve height for the Perps deposit quoted-amount and status rows so the form no longer jumps when switching between the provider notice, the quote, and the error message

- [#22033](https://github.com/LedgerHQ/ledger-live/pull/22033) [`db7b972`](https://github.com/LedgerHQ/ledger-live/commit/db7b972bd6328a2bd215a7adec3bd5353a727a81) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Keep the entered Perps deposit amount when switching the funding asset/account instead of resetting it

- [#22488](https://github.com/LedgerHQ/ledger-live/pull/22488) [`1302bc7`](https://github.com/LedgerHQ/ledger-live/commit/1302bc7968a7d3bf9cd3d556057b662444b22608) Thanks [@LL782](https://github.com/LL782)! - Replace mutable analytics screen refs with a function-only tracking-page API.

- [#22550](https://github.com/LedgerHQ/ledger-live/pull/22550) [`86dbc48`](https://github.com/LedgerHQ/ledger-live/commit/86dbc48147fa1a16aa79c81f844ffe5117b29494) Thanks [@alexstapenka-ledger](https://github.com/alexstapenka-ledger)! - Add the `ptxEarnCtaOnMobile` feature flag and send it to Mixpanel as a boolean identify trait. Earn reads it via Wallet API.

- [#22549](https://github.com/LedgerHQ/ledger-live/pull/22549) [`24e881b`](https://github.com/LedgerHQ/ledger-live/commit/24e881b41d4199d9cf257a7450d139aa5f076a1d) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Hide Pay and card history amounts when discreet mode is enabled, and toggle it from the Pay balance

- [#22767](https://github.com/LedgerHQ/ledger-live/pull/22767) [`8947c0b`](https://github.com/LedgerHQ/ledger-live/commit/8947c0b97fa0d5abd017d880bfc3089a74d9cc77) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Show a setup state on the History card tab when the signed-in holder has not claimed a card yet.

- [#22562](https://github.com/LedgerHQ/ledger-live/pull/22562) [`b8a4056`](https://github.com/LedgerHQ/ledger-live/commit/b8a405658b70b0ca43ec94bff53c5d13e2c16487) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Keep re-reading the Pay Card status after the holder returns from Apple or Google Wallet, and when the app comes back to the foreground

- [#22491](https://github.com/LedgerHQ/ledger-live/pull/22491) [`c8d3949`](https://github.com/LedgerHQ/ledger-live/commit/c8d39499a8f21e7b4d7f27d4c4f55d3b75c96983) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Hide the redundant Card extra in the History navbar when the type switcher is visible.

- [#22631](https://github.com/LedgerHQ/ledger-live/pull/22631) [`9be4635`](https://github.com/LedgerHQ/ledger-live/commit/9be4635d76d6d649be51a001d39b08c3bfd52af1) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Keep the Pay tab active in the sidebar while a Card live app is open

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

- [#22238](https://github.com/LedgerHQ/ledger-live/pull/22238) [`62fb052`](https://github.com/LedgerHQ/ledger-live/commit/62fb052d74dd4f8ee80ac74ffe7d1e1473752766) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Keep the selected contact in Send and open the recipient picker from the To bar.

- [#22407](https://github.com/LedgerHQ/ledger-live/pull/22407) [`4efaa4f`](https://github.com/LedgerHQ/ledger-live/commit/4efaa4fa4aefee20dc446eb6b19ab65be2e95f95) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Remove the Ledger by Figment T&Cs link from the Sui delegation validator step

- [#22579](https://github.com/LedgerHQ/ledger-live/pull/22579) [`0e98a58`](https://github.com/LedgerHQ/ledger-live/commit/0e98a58c4f313f55c088be010a360c6d85ea7d43) Thanks [@vpenskyi-ledger](https://github.com/vpenskyi-ledger)! - Re-read `SWAP_API_BASE` on every swap/Perps quote request instead of baking it into the store at startup, so a debug-menu override reaches the aggregator without an app restart

- [#22392](https://github.com/LedgerHQ/ledger-live/pull/22392) [`a6b6959`](https://github.com/LedgerHQ/ledger-live/commit/a6b6959a9540ad1fb7037f9f8cfd76b56e81d02d) Thanks [@CremaFR](https://github.com/CremaFR)! - Include Exchange and signing app versions on swap cancel payloads

- [#22382](https://github.com/LedgerHQ/ledger-live/pull/22382) [`c119e0d`](https://github.com/LedgerHQ/ledger-live/commit/c119e0d38f626314cf679bfa06420ce0e4bca03b) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Redirect the "choose card type" onboarding step to the Baanx hosted order-card page, and align pay bottom sheet spacing and tile styles

- [#22522](https://github.com/LedgerHQ/ledger-live/pull/22522) [`e19e6cf`](https://github.com/LedgerHQ/ledger-live/commit/e19e6cf36074363d22085b6c85c54ef964eb382c) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix the cropped transaction name and date on a card charge funded by several assets, and round card crypto amounts like the rest of the product. A devtool action and a mock fixture now produce such a charge.

- [#22054](https://github.com/LedgerHQ/ledger-live/pull/22054) [`8c486aa`](https://github.com/LedgerHQ/ledger-live/commit/8c486aabe3dbd100b21e43d3f344fda5142858ed) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Add `@ledgerhq/live-signer-tron`, wrapping `@ledgerhq/device-signer-kit-tron` as `DmkSignerTron`
  alongside the legacy `hw-app-trx` path as `LegacySignerTron`. `families/tron/setup.ts` picks
  between them, using the DMK signer only on a DMK transport with the new `ldmkTronSigner` feature
  flag on. The flag is disabled by default, so Tron keeps signing through `hw-app-trx`.

- [#22664](https://github.com/LedgerHQ/ledger-live/pull/22664) [`f96e346`](https://github.com/LedgerHQ/ledger-live/commit/f96e3461de843bb89127c7e9ac5578e85140025f) Thanks [@semeano](https://github.com/semeano)! - Add Zcash privacy/transfer-flow attributes to the new send flow's Segment tracking, and a first page event for the balance-type step, so a private vs public Zcash send is distinguishable in analytics (LIVE-38009).

### Patch Changes

- Updated dependencies [[`b42673e`](https://github.com/LedgerHQ/ledger-live/commit/b42673eed68aba6b2885486d7294f5f9163f721d), [`e8d72da`](https://github.com/LedgerHQ/ledger-live/commit/e8d72dad9cd8aca2bf11b1768d10f2c7553e4cba), [`2d869a5`](https://github.com/LedgerHQ/ledger-live/commit/2d869a596a4562a00003de01cc657d7277dc6b7c), [`d5dfa07`](https://github.com/LedgerHQ/ledger-live/commit/d5dfa072c9a724609119c06622004d76a45414d9), [`4fc2063`](https://github.com/LedgerHQ/ledger-live/commit/4fc2063b0e49a445ebb660f750214e69d5c4355a), [`e4c24f3`](https://github.com/LedgerHQ/ledger-live/commit/e4c24f3ebd7fe5838a6639e70b10b12863088e10), [`c5964f8`](https://github.com/LedgerHQ/ledger-live/commit/c5964f8c6348028d97832dd46cd8554d813d48db), [`8b387f4`](https://github.com/LedgerHQ/ledger-live/commit/8b387f4d1db967288af2f982a78949e0615ebc7e), [`e8d5e1b`](https://github.com/LedgerHQ/ledger-live/commit/e8d5e1bf6eec2a47072ad59762064b24a89701cf), [`c95a00f`](https://github.com/LedgerHQ/ledger-live/commit/c95a00f06cf5e8891e843c0a2cdc17e6d97c85f1), [`3e7af98`](https://github.com/LedgerHQ/ledger-live/commit/3e7af98196476c04a97522109fded33cc17dc868), [`26e51d9`](https://github.com/LedgerHQ/ledger-live/commit/26e51d98fde1c080e09f566e0dbeb4f2c2e9f382), [`6a5972d`](https://github.com/LedgerHQ/ledger-live/commit/6a5972df49e243bbb36cd973e405302d0d8925bc), [`3e7bbe9`](https://github.com/LedgerHQ/ledger-live/commit/3e7bbe93f6075a2a6783e05d36459c166366c910), [`c32cde3`](https://github.com/LedgerHQ/ledger-live/commit/c32cde31461523c72df4f67cd18288c6f65c9951), [`ad2f1de`](https://github.com/LedgerHQ/ledger-live/commit/ad2f1deb73d1fd6fed1383133a7f2b259630cd06), [`cee85b4`](https://github.com/LedgerHQ/ledger-live/commit/cee85b47d7d1f414e23935e77c9ad22d98ddf994), [`6baab2e`](https://github.com/LedgerHQ/ledger-live/commit/6baab2e7989b00bec4c361cee3535f76cb919915), [`cfb7566`](https://github.com/LedgerHQ/ledger-live/commit/cfb756682290e9940d65f3b6417d6b111449e546), [`bc28500`](https://github.com/LedgerHQ/ledger-live/commit/bc2850004d7cbc59aac8093b3739bfcc351daf43), [`4d84f2b`](https://github.com/LedgerHQ/ledger-live/commit/4d84f2b23f3bc04c06770e390e22cd4e35ee3fe3), [`1a26e59`](https://github.com/LedgerHQ/ledger-live/commit/1a26e599a47d52854cf05081a386e6090d8677f2), [`5adf8f3`](https://github.com/LedgerHQ/ledger-live/commit/5adf8f3b844e21895aa17f96a620a2dfa6b679ad), [`6e76dda`](https://github.com/LedgerHQ/ledger-live/commit/6e76ddac6370bb60b17971679a857fae7ca83eb9), [`486a1a4`](https://github.com/LedgerHQ/ledger-live/commit/486a1a45027e8104ae824d77bd34b298788c9b04), [`f7cd861`](https://github.com/LedgerHQ/ledger-live/commit/f7cd8616265d3f94fef24332626402efe39eb83f), [`a503ca1`](https://github.com/LedgerHQ/ledger-live/commit/a503ca185ae15738cd8ec77949d0964baa8c679b), [`f1d8aac`](https://github.com/LedgerHQ/ledger-live/commit/f1d8aac1c7c0bc0be9beb1508c1a9ef3cf7affae), [`33b4952`](https://github.com/LedgerHQ/ledger-live/commit/33b4952ef04d4e0528d2735ba299b4a8073e447e), [`e9af9cb`](https://github.com/LedgerHQ/ledger-live/commit/e9af9cb415b3ba4038d13ffc2dca7edb0432c830), [`d6866e7`](https://github.com/LedgerHQ/ledger-live/commit/d6866e7dc7ced8898ac585d4e34d9667d9ad7f17), [`f8c92f9`](https://github.com/LedgerHQ/ledger-live/commit/f8c92f9300d4b8268949ed7aff5a6781ed7f60a8), [`96754dc`](https://github.com/LedgerHQ/ledger-live/commit/96754dc5cfec3487fe04b9202ddffe69fff476a4), [`7fd570c`](https://github.com/LedgerHQ/ledger-live/commit/7fd570cd3868a675dad0d77136734eab63f11bd1), [`e046686`](https://github.com/LedgerHQ/ledger-live/commit/e046686befa308188170ac9950eae394863c76a5), [`739334b`](https://github.com/LedgerHQ/ledger-live/commit/739334b0d854a3b11d9a2b6ba47ce022dc0797d9), [`b4599a5`](https://github.com/LedgerHQ/ledger-live/commit/b4599a58f817aa233be256d6f755a0fd4d0fc8a5), [`e3c51c5`](https://github.com/LedgerHQ/ledger-live/commit/e3c51c57487a765391677073d78fb9ce275374b6), [`381bd0b`](https://github.com/LedgerHQ/ledger-live/commit/381bd0befb6a09f20f13f65c233f0e1479e7051d), [`dfd53ad`](https://github.com/LedgerHQ/ledger-live/commit/dfd53adbf0815e2a62f59c1e996bd709bd710ea0), [`c63d0fa`](https://github.com/LedgerHQ/ledger-live/commit/c63d0fa3ad6f181beb5d8ea7b2ef474d82fd1ed7), [`9e54487`](https://github.com/LedgerHQ/ledger-live/commit/9e5448750d57eb92f95ef828b55d80eedd826323), [`83fac3e`](https://github.com/LedgerHQ/ledger-live/commit/83fac3e00782840d1f118180dfb9afb9a484952c), [`56640ba`](https://github.com/LedgerHQ/ledger-live/commit/56640ba2c03cec8555f7452da785c8dd949ec010), [`b6a9b53`](https://github.com/LedgerHQ/ledger-live/commit/b6a9b531267360fdca64b8db22dd8781aa414dd9), [`68f4179`](https://github.com/LedgerHQ/ledger-live/commit/68f41798cae68cd1b91f291d5447514b80fd6f49), [`8ecbe06`](https://github.com/LedgerHQ/ledger-live/commit/8ecbe0676b614fed535900aa6085ddebabc8d85c), [`46f0f94`](https://github.com/LedgerHQ/ledger-live/commit/46f0f9447e12faa953268bf2a19fbdfd85a43da9), [`ea90542`](https://github.com/LedgerHQ/ledger-live/commit/ea90542540f47a76c18cf5f440bb98b9be71c837), [`e8518d7`](https://github.com/LedgerHQ/ledger-live/commit/e8518d7f0b88096552c6a8f74ffe5752bc517a39), [`56640ba`](https://github.com/LedgerHQ/ledger-live/commit/56640ba2c03cec8555f7452da785c8dd949ec010), [`5ff6348`](https://github.com/LedgerHQ/ledger-live/commit/5ff6348d1505e805bdbbff64685b0b97bc2a8981), [`3b5a959`](https://github.com/LedgerHQ/ledger-live/commit/3b5a959ffd24bc06a91bb608924c0575d62eb753), [`41eca65`](https://github.com/LedgerHQ/ledger-live/commit/41eca657432071ba1d22029b79be85ca3eff6a94), [`912b087`](https://github.com/LedgerHQ/ledger-live/commit/912b0877538bd06cc7187b90e2eab8182fe55034), [`defb949`](https://github.com/LedgerHQ/ledger-live/commit/defb949c02d9d0d935882eb8e8617d000e18b163), [`70d0b90`](https://github.com/LedgerHQ/ledger-live/commit/70d0b90b67ff013f19318378c78a3f3d442f773b), [`887561b`](https://github.com/LedgerHQ/ledger-live/commit/887561bb56c7bbe4c5ff3d62a3309ce3d449a72c), [`aee5fe8`](https://github.com/LedgerHQ/ledger-live/commit/aee5fe897519c1bc39f0d4891bbc1ee4a7aaaaa1), [`3d41eab`](https://github.com/LedgerHQ/ledger-live/commit/3d41eab30728e94a21c53d4d4d9fe6eec27a5ce1), [`ae229f2`](https://github.com/LedgerHQ/ledger-live/commit/ae229f27b250d6bdd06af1b06a2912a8c556a27c), [`3fdebf4`](https://github.com/LedgerHQ/ledger-live/commit/3fdebf4a84f5630192e50aef9a0a60b0c56f6a2f), [`3b95cbb`](https://github.com/LedgerHQ/ledger-live/commit/3b95cbb5968a4484966233313ca8e2781b720ae8), [`973a613`](https://github.com/LedgerHQ/ledger-live/commit/973a6136087e8e78eeffd0e761ed3828f9f81691), [`a39ba90`](https://github.com/LedgerHQ/ledger-live/commit/a39ba900d889155ebc4fe2cab88f82a715e3f605), [`fc6f187`](https://github.com/LedgerHQ/ledger-live/commit/fc6f1878bb1fa7f0c87c18478abbb194c6edee0d), [`6fa8121`](https://github.com/LedgerHQ/ledger-live/commit/6fa81215cdeade45495994d5dc7dc0477c097e2c), [`b2c3742`](https://github.com/LedgerHQ/ledger-live/commit/b2c3742dabf62702a85c8710421bce8ae80dc1fd), [`fe55ea3`](https://github.com/LedgerHQ/ledger-live/commit/fe55ea349a8227d398bd570e68a8756392a4dd21), [`dccea32`](https://github.com/LedgerHQ/ledger-live/commit/dccea322ed808abfa4e6829364fe945cd0a58383), [`006991d`](https://github.com/LedgerHQ/ledger-live/commit/006991d2a5c7ea7431cb66d13a972c4aafd90258), [`a025d7a`](https://github.com/LedgerHQ/ledger-live/commit/a025d7a872b7b1e4681d16b2bfb54f8949bf6626), [`1302bc7`](https://github.com/LedgerHQ/ledger-live/commit/1302bc7968a7d3bf9cd3d556057b662444b22608), [`86dbc48`](https://github.com/LedgerHQ/ledger-live/commit/86dbc48147fa1a16aa79c81f844ffe5117b29494), [`24e881b`](https://github.com/LedgerHQ/ledger-live/commit/24e881b41d4199d9cf257a7450d139aa5f076a1d), [`8947c0b`](https://github.com/LedgerHQ/ledger-live/commit/8947c0b97fa0d5abd017d880bfc3089a74d9cc77), [`b8a4056`](https://github.com/LedgerHQ/ledger-live/commit/b8a405658b70b0ca43ec94bff53c5d13e2c16487), [`b4a23ea`](https://github.com/LedgerHQ/ledger-live/commit/b4a23ea27edbc4a3e8aeaee1da6f0e7aecefab92), [`a896fca`](https://github.com/LedgerHQ/ledger-live/commit/a896fca1974a46f10e915d1212e0947e2d808ad5), [`87de096`](https://github.com/LedgerHQ/ledger-live/commit/87de096183309fa2152abe838f09a537b681e8eb), [`cdcb834`](https://github.com/LedgerHQ/ledger-live/commit/cdcb83446d2a70c910fee7cded0b03f3ab325b30), [`4f0fdc3`](https://github.com/LedgerHQ/ledger-live/commit/4f0fdc3d78ac46e4396106eaf10e20ca6c0ed3cf), [`62fb052`](https://github.com/LedgerHQ/ledger-live/commit/62fb052d74dd4f8ee80ac74ffe7d1e1473752766), [`3fdfcc0`](https://github.com/LedgerHQ/ledger-live/commit/3fdfcc07ffb1d8e0b5ef39c830a5e7204ced77e3), [`93e6db2`](https://github.com/LedgerHQ/ledger-live/commit/93e6db2db85721b483173e781db9f53db3699715), [`8a305ed`](https://github.com/LedgerHQ/ledger-live/commit/8a305edb307d0a4cd30ad615ccd98ef5d7caf523), [`b34159a`](https://github.com/LedgerHQ/ledger-live/commit/b34159af9fe5b26d5d7bfb04f881fca55246e83c), [`c020110`](https://github.com/LedgerHQ/ledger-live/commit/c02011033bf5ca5bf38f05c487adb3a27c209a7d), [`0ce2853`](https://github.com/LedgerHQ/ledger-live/commit/0ce2853042f94314e9255ab06eeccbb994a1f04e), [`0e98a58`](https://github.com/LedgerHQ/ledger-live/commit/0e98a58c4f313f55c088be010a360c6d85ea7d43), [`a6b6959`](https://github.com/LedgerHQ/ledger-live/commit/a6b6959a9540ad1fb7037f9f8cfd76b56e81d02d), [`c35b103`](https://github.com/LedgerHQ/ledger-live/commit/c35b10307731ef8910eac0be4de14abe4e7b0643), [`c119e0d`](https://github.com/LedgerHQ/ledger-live/commit/c119e0d38f626314cf679bfa06420ce0e4bca03b), [`e19e6cf`](https://github.com/LedgerHQ/ledger-live/commit/e19e6cf36074363d22085b6c85c54ef964eb382c), [`8c486aa`](https://github.com/LedgerHQ/ledger-live/commit/8c486aabe3dbd100b21e43d3f344fda5142858ed), [`88bae04`](https://github.com/LedgerHQ/ledger-live/commit/88bae04e2f7e7a3de8d55c340fe32b48e37bd78d), [`df5d8c9`](https://github.com/LedgerHQ/ledger-live/commit/df5d8c96892094fc6faf06992f415e88ff64b5c8), [`f7ba21f`](https://github.com/LedgerHQ/ledger-live/commit/f7ba21f7df883e71102a0949c8a3d23e20fb4cbd), [`62cc42f`](https://github.com/LedgerHQ/ledger-live/commit/62cc42f32d041e0e1081e7fdaca04169581429ec), [`f96e346`](https://github.com/LedgerHQ/ledger-live/commit/f96e3461de843bb89127c7e9ac5578e85140025f), [`06c71d1`](https://github.com/LedgerHQ/ledger-live/commit/06c71d101fb664b50202f6ddc09dd1abbcb76a3a)]:
  - @domain/api-card-management@0.8.0
  - @features/flow-pay-card-details@0.6.0
  - @features/platform-pay-analytics@0.3.0
  - @features/flow-contacts-list@0.9.0
  - @ledgerhq/types-live@6.126.0
  - @domain/entity-contact@0.11.0
  - @features/flow-contacts-introduction@1.3.0
  - @features/flow-pay-contact@0.5.0
  - @domain/api-market-index-fear-and-greed@0.4.0
  - @shared/ui-info-state@0.4.0
  - @ledgerhq/live-dmk-shared@0.34.0
  - @ledgerhq/live-dmk-desktop@0.23.0
  - @ledgerhq/live-signer-evm@0.24.0
  - @ledgerhq/live-common@38.2.0
  - @ledgerhq/coin-casper@3.5.0
  - @features/platform-device-action-content@0.3.0
  - @features/flow-contacts@0.13.0
  - @features/flow-pay-card-assets@0.3.0
  - @features/flow-pay-balance@0.6.0
  - @features/flow-pay-card-transactions@0.4.0
  - @features/platform-card@0.7.0
  - @features/flow-pay-card-auth@0.9.0
  - @features/flow-pay-card@0.6.0
  - @features/flow-pay-card-widget@0.5.0
  - @shared/feature-flags@0.25.0
  - @shared/env@0.9.0
  - @features/platform-contacts@0.9.0
  - @ledgerhq/asset-aggregation@0.17.0
  - @ledgerhq/wallet-analytics@0.5.0
  - @ledgerhq/ledger-wallet-framework@3.6.0
  - @domain/entity-currency-crypto@0.14.0
  - @ledgerhq/coin-bitcoin@0.54.0
  - @ledgerhq/coin-zcash@0.10.0
  - @ledgerhq/live-signer-tron@0.2.0
  - @ledgerhq/transaction-observability@0.4.0
  - @ledgerhq/coin-cosmos@1.5.0
  - @features/flow-pay-feature-tour@0.7.0
  - @features/flow-pay-request@0.7.0
  - @ledgerhq/coin-canton@1.3.0
  - @ledgerhq/coin-cardano@1.3.0
  - @ledgerhq/coin-concordium@1.5.0
  - @ledgerhq/coin-filecoin@2.3.0
  - @features/flow-pay-bank-transfer@0.4.0
  - @features/flow-pay-deposit@0.5.0
  - @devtools/bindings@0.10.0
  - @shared/analytics@0.4.0
  - @domain/api-market-index-altcoin-season@0.4.0
  - @domain/entity-market-index-fear-and-greed@0.3.0
  - @shared/analytics-react@0.4.0
  - @shared/api-services@0.9.0
  - @ledgerhq/live-countervalues-react@0.18.2
  - @ledgerhq/live-send@0.1.2
  - @ledgerhq/live-wallet@1.1.5
  - @ledgerhq/wallet-pnl@0.7.13
  - @features/flow-contacts-add-address@0.6.1
  - @features/flow-contacts-add-contact@0.7.1
  - @features/flow-contacts-delete-contact@0.2.4
  - @features/flow-contacts-edit-address@0.4.1
  - @features/flow-contacts-edit-contact@0.6.1
  - @ledgerhq/asset-detail@0.11.7
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
  - @ledgerhq/wallet-btc@0.6.0

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

- [#22899](https://github.com/LedgerHQ/ledger-live/pull/22899) [`40b22c1`](https://github.com/LedgerHQ/ledger-live/commit/40b22c1c98b985d025e370475bcd13964b578b6e) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Show a "Go to CL Card" disclaimer below the Pay contacts when the `card_disclaimer` param of `lwdPayTab` is on. It opens the same CL Card webview as "I have a card" on the Card screen.

- [#22899](https://github.com/LedgerHQ/ledger-live/pull/22899) [`56640ba`](https://github.com/LedgerHQ/ledger-live/commit/56640ba2c03cec8555f7452da785c8dd949ec010) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Show the Card login on the desktop Pay tab when the `card_live_app` param of `lwdPayTab` is on. "Create an account" opens the card program live app and "Log in" opens the CL Card live app.

- [#22899](https://github.com/LedgerHQ/ledger-live/pull/22899) [`87f8ce0`](https://github.com/LedgerHQ/ledger-live/commit/87f8ce0cccbfeffd8865d7d33130298e8e3c2e81) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Read the desktop Pay card face (native, live app, disclaimer) from one `usePayCardFace` hook.

- [#22908](https://github.com/LedgerHQ/ledger-live/pull/22908) [`23ee31c`](https://github.com/LedgerHQ/ledger-live/commit/23ee31c0ebf892ea7924e18dc43ad947e7810782) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Pay card login: name Monavate instead of Baanx in "Log in to" and "Card provided by".

- [#22899](https://github.com/LedgerHQ/ledger-live/pull/22899) [`8369030`](https://github.com/LedgerHQ/ledger-live/commit/836903036462a9524c834f5b6c3e8d7873bcf2e6) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Send the live app webview Back button to Pay when the webview was opened from Pay with `fromPayTab` state.

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
  - @ledgerhq/live-common@38.2.0-next.1
  - @devtools/shell@0.10.1-next.1
  - @features/flow-contacts@0.13.0-next.3
  - @features/flow-contacts-add-contact@0.7.1-next.2
  - @features/flow-contacts-delete-contact@0.2.4-next.2
  - @features/flow-contacts-edit-address@0.4.1-next.2
  - @features/flow-contacts-edit-contact@0.6.1-next.2
  - @features/flow-contacts-list@0.9.0-next.2
  - @features/flow-pay-contact@0.5.0-next.4
  - @features/flow-analytics-consent@0.2.8-next.1
  - @ledgerhq/asset-detail@0.11.7-next.1
  - @ledgerhq/live-dmk-desktop@0.23.0-next.1
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

- [#22634](https://github.com/LedgerHQ/ledger-live/pull/22634) [`e3b6f7a`](https://github.com/LedgerHQ/ledger-live/commit/e3b6f7a8549cbbbdb74dcca483f58bf3d0f4cc80) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - fix(aleo): keep the newer public and private sync fields when both syncs overlap

- [#22381](https://github.com/LedgerHQ/ledger-live/pull/22381) [`c5964f8`](https://github.com/LedgerHQ/ledger-live/commit/c5964f8c6348028d97832dd46cd8554d813d48db) Thanks [@ysitbon](https://github.com/ysitbon)! - Rename `@domain/api-market-sentiment` to `@domain/api-market-index-fear-and-greed`, and its exported api from `marketSentimentApi` to `fearAndGreedApi`, so the name states which CoinMarketCap index the package serves

- [#22653](https://github.com/LedgerHQ/ledger-live/pull/22653) [`e8d5e1b`](https://github.com/LedgerHQ/ledger-live/commit/e8d5e1bf6eec2a47072ad59762064b24a89701cf) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Bump DMK dependencies: device-management-kit 1.10.0, device-signer-kit-solana 1.13.3, device-signer-kit-ethereum 1.18.1, context-module 2.6.0, dmk-ledger-wallet 0.6.0, device-contacts-kit 0.5.0, signer-utils 1.3.0, device-transport-kit-mockserver 1.1.2

- [#22567](https://github.com/LedgerHQ/ledger-live/pull/22567) [`3ee4143`](https://github.com/LedgerHQ/ledger-live/commit/3ee4143819b419d07642d06f073d0019ebfc5dca) Thanks [@tonykhaov](https://github.com/tonykhaov)! - List the Me contact in the desktop Send recipient contacts, like mobile, with only its addresses on the selected network.

- [#22615](https://github.com/LedgerHQ/ledger-live/pull/22615) [`7bc8d65`](https://github.com/LedgerHQ/ledger-live/commit/7bc8d65f5565f881094751204475f7e3d0b16106) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Open the Pay request flow from the Add stablecoin "Crypto address" option instead of the standard Receive flow

- [#22318](https://github.com/LedgerHQ/ledger-live/pull/22318) [`83b8a5c`](https://github.com/LedgerHQ/ledger-live/commit/83b8a5c95bed52ad2ba5ffef866f978596b855fc) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Use dnd-kit to reorder card assets in the desktop manage-assets dialog

- [#22379](https://github.com/LedgerHQ/ledger-live/pull/22379) [`ad2f1de`](https://github.com/LedgerHQ/ledger-live/commit/ad2f1deb73d1fd6fed1383133a7f2b259630cd06) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Let the card transaction history read past its first page.

  - Both platforms read on by scrolling: native through the list's `onEndReached`, web through an observer on a sentinel at the end of the table.
  - A spinner marks the page in flight; no new copy, so nothing to translate.
  - Both take `loadMore`/`isLoadingMore` from the shared view model, so the three-row previews on the Pay surfaces are unaffected.

- [#22432](https://github.com/LedgerHQ/ledger-live/pull/22432) [`cfb7566`](https://github.com/LedgerHQ/ledger-live/commit/cfb756682290e9940d65f3b6417d6b111449e546) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Show the cashback a card transaction earned in its detail view

- [#22665](https://github.com/LedgerHQ/ledger-live/pull/22665) [`46cfd43`](https://github.com/LedgerHQ/ledger-live/commit/46cfd437c30624c37b3d89478eba43aa1391ef92) Thanks [@lysyi3m](https://github.com/lysyi3m)! - fix(celo): label pending withdrawal rows with their unlock date

- [#22474](https://github.com/LedgerHQ/ledger-live/pull/22474) [`1a26e59`](https://github.com/LedgerHQ/ledger-live/commit/1a26e599a47d52854cf05081a386e6090d8677f2) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Update coin module dependencies (coin-evm, coin-module-framework, coin-stellar, coin-tezos) and rebuild the lockfile

- [#22572](https://github.com/LedgerHQ/ledger-live/pull/22572) [`6e76dda`](https://github.com/LedgerHQ/ledger-live/commit/6e76ddac6370bb60b17971679a857fae7ca83eb9) Thanks [@tonykhaov](https://github.com/tonykhaov)! - `ContactAvatar` takes `isMe` and is the only avatar that formats the Me label, so a Me avatar is announced once as "<name> (Me)". `MeAvatar` takes a display-ready `label` and is no longer exported; `ME_AVATAR_URL` stays exported. `PaySuccessRecipient.isMe` is now required.

- [#22656](https://github.com/LedgerHQ/ledger-live/pull/22656) [`486a1a4`](https://github.com/LedgerHQ/ledger-live/commit/486a1a45027e8104ae824d77bd34b298788c9b04) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Only mention ENS in the contact address input placeholder for networks that support domain resolution (LIVE-38284).

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

- [#22534](https://github.com/LedgerHQ/ledger-live/pull/22534) [`c5a6a7e`](https://github.com/LedgerHQ/ledger-live/commit/c5a6a7e7d62b867a443346b152ca5b1d801f6a66) Thanks [@ysitbon](https://github.com/ysitbon)! - fix(feature-flags): report a re-resolution that throws

  A feature-flags re-resolution that throws at boot is now reported through `logger.critical`,
  whatever the state of the remote-flag cache.

- [#22503](https://github.com/LedgerHQ/ledger-live/pull/22503) [`33b4952`](https://github.com/LedgerHQ/ledger-live/commit/33b4952ef04d4e0528d2735ba299b4a8073e447e) Thanks [@daniel-choinski-ledger](https://github.com/daniel-choinski-ledger)! - Inject the Tron address book into the DMK Tron signer so Tron transactions can clear-sign saved contact names.

  Adds a generic `AddressBookProvider<T>` in `live-dmk-shared` (the EVM provider is refactored onto it), a `tronAddressBookProvider` instance, a pure `toTronAddressBook` mapper (`Contact[] -> TronAddressBook`, Tron-family only, no chain id, `ledgerAccounts` always empty), and registers the source at each app's composition root. An absent or empty book leaves signing behavior unchanged.

- [#22481](https://github.com/LedgerHQ/ledger-live/pull/22481) [`d6866e7`](https://github.com/LedgerHQ/ledger-live/commit/d6866e7dc7ced8898ac585d4e34d9667d9ad7f17) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - adapt crypto card title to be consistent

- [#22058](https://github.com/LedgerHQ/ledger-live/pull/22058) [`f8c92f9`](https://github.com/LedgerHQ/ledger-live/commit/f8c92f9300d4b8268949ed7aff5a6781ed7f60a8) Thanks [@alexstapenka-ledger](https://github.com/alexstapenka-ledger)! - Instrument the shared sign/broadcast bridge defensively and dispatch consent-independent Earn
  transaction lifecycle events for native staking and allow-listed dApps on Desktop and Mobile.

- [#22558](https://github.com/LedgerHQ/ledger-live/pull/22558) [`e046686`](https://github.com/LedgerHQ/ledger-live/commit/e046686befa308188170ac9950eae394863c76a5) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(cosmos): staking validation rule in the generic path

- [#22614](https://github.com/LedgerHQ/ledger-live/pull/22614) [`b4599a5`](https://github.com/LedgerHQ/ledger-live/commit/b4599a58f817aa233be256d6f755a0fd4d0fc8a5) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Update the verify address next steps copy, add a third step, and size the mobile shield spot to match desktop

- [#22433](https://github.com/LedgerHQ/ledger-live/pull/22433) [`8c787ee`](https://github.com/LedgerHQ/ledger-live/commit/8c787eec93a4d8155cea02c46c426acd50b163e5) Thanks [@jeportie](https://github.com/jeportie)! - Add test IDs to the My Ledger values that automation has to read.

  The device storage figures and the install success banner render their values as bare text nodes, so a test can see the containers but cannot assert what they show. This adds them to the used, capacity, apps count and free space figures in the storage card, and to the install success banner's title and its manage accounts button.

  No behaviour changes: every addition is a `data-testid` attribute.

- [#22322](https://github.com/LedgerHQ/ledger-live/pull/22322) [`08e23bb`](https://github.com/LedgerHQ/ledger-live/commit/08e23bb00577065206a028365d18b7e509cbdca4) Thanks [@jeportie](https://github.com/jeportie)! - Add test IDs to the My Ledger controls that automation has to click.

  The manager screen already exposes test IDs for its containers, inputs and success states, but not for several triggers and submit buttons, so those flows could not be driven from a test. This adds them to the app catalog's Show and Sort dropdowns, the device rename entry point and its submit button, the custom lock screen removal link and its success state, and the OS version and genuine badge values.

  No behaviour changes: every addition is a `data-testid` attribute.

- [#22571](https://github.com/LedgerHQ/ledger-live/pull/22571) [`e3c51c5`](https://github.com/LedgerHQ/ledger-live/commit/e3c51c57487a765391677073d78fb9ce275374b6) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Show a matched Me contact as "<name> (Me)" in Send: the recipient card, the "Address matched" row, the amount step "To" header, the Pay success title and the History counterparty. `MatchedContact` and `RecipientHeaderContact` now carry `isMe`, and `RecipientHeaderPresentation.label` is renamed `recipientDisplayValue` and never holds a contact name.

- [#22438](https://github.com/LedgerHQ/ledger-live/pull/22438) [`f9b43be`](https://github.com/LedgerHQ/ledger-live/commit/f9b43beb27558199ac97c56a7787e49c49c8b204) Thanks [@pawell24](https://github.com/pawell24)! - fix(near): size staking gas from measured usage and price it the way the chain does

  Staking fees priced the attached gas at the current gas price. nearcore buys the gas attached
  to a receipt at `max(current_gas_price, min_gas_purchase_price)`, and that floor is an order of
  magnitude above the current price on mainnet, so every stake, unstake and withdraw quoted about a
  tenth of what the account had to hold. A withdraw quoted at 0.02 NEAR was rejected on broadcast
  with `NotEnoughBalance` naming a cost of 0.1759 NEAR.

  The fee now uses the same floor the runtime does, and the attached gas drops from 125 TGas (175
  for withdraw_all) to 50 TGas for every staking call. The heaviest poolv1 path, the first call in
  a new epoch which also restakes and runs the pool's 20 TGas `on_stake_action` callback, was
  measured across five mainnet pools: at most 13.64 TGas charged, and 30 TGas attached succeeds on
  it. The old budget, bought at the floor, locked 0.2 NEAR for a call that burns about 0.001;
  the new one locks 0.055.

  Unstake and withdraw are validated against the balance left above storage staking, which is what
  the chain checks, instead of the spendable balance that also subtracts the minimum-balance
  reserve. The withdraw flow gains the NotEnoughFundsToUnstake banner the unstake flow already
  shows, so a real shortfall is explained with the available balance and Buy/Swap/Deposit actions.

  The NEAR coin-tester scenario's withdraw step now requires the withdrawn amount itself to have
  landed before the send-max step sizes its amount: the pool pays out through a Transfer receipt
  that lands a block after the call, and the smaller gas refund alone used to satisfy the step.

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

- [#22302](https://github.com/LedgerHQ/ledger-live/pull/22302) [`e81a3d8`](https://github.com/LedgerHQ/ledger-live/commit/e81a3d863b0cc83ed021c23938bc1348ce615a46) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Attach Pay Mixpanel user properties when the Pay flag is on.

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

- [#22389](https://github.com/LedgerHQ/ledger-live/pull/22389) [`9c98732`](https://github.com/LedgerHQ/ledger-live/commit/9c98732967950e28d44e2d3d065d44e208dad9b5) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Collapse the Pay Tab card hosted-page openers into one helper and pass the host view model through to the card flow

- [#22507](https://github.com/LedgerHQ/ledger-live/pull/22507) [`219049d`](https://github.com/LedgerHQ/ledger-live/commit/219049db91c6b01ec53bc80c9d70434bd6d0c1ce) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Keep the Baanx session when the user leaves and opens the Pay tab again.

- [#22328](https://github.com/LedgerHQ/ledger-live/pull/22328) [`41eca65`](https://github.com/LedgerHQ/ledger-live/commit/41eca657432071ba1d22029b79be85ca3eff6a94) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Open top-up in the legacy `cl-card` live app when the new `legacyTopUp` param of `lwdPayTab` or `lwmPayTab` is on.

- [#22293](https://github.com/LedgerHQ/ledger-live/pull/22293) [`912b087`](https://github.com/LedgerHQ/ledger-live/commit/912b0877538bd06cc7187b90e2eab8182fe55034) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Keep the aspect ratio of the login intro hero image and theme the desktop row icons

- [#22546](https://github.com/LedgerHQ/ledger-live/pull/22546) [`defb949`](https://github.com/LedgerHQ/ledger-live/commit/defb949c02d9d0d935882eb8e8617d000e18b163) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - fix(pay-card): keep the card visible, with a loading balance, while the session resolves

- [#22682](https://github.com/LedgerHQ/ledger-live/pull/22682) [`f678cbd`](https://github.com/LedgerHQ/ledger-live/commit/f678cbd3c4ac2a5028d98142e076380c1dc2f216) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Mention Monavate instead of Baanx in the Pay card add asset and withdraw copy.

- [#22446](https://github.com/LedgerHQ/ledger-live/pull/22446) [`3d41eab`](https://github.com/LedgerHQ/ledger-live/commit/3d41eab30728e94a21c53d4d4d9fe6eec27a5ce1) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Open the hosted cashback page from the Pay card reward banner

- [#22353](https://github.com/LedgerHQ/ledger-live/pull/22353) [`ae229f2`](https://github.com/LedgerHQ/ledger-live/commit/ae229f27b250d6bdd06af1b06a2912a8c556a27c) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Show a counter-value on the card rewards banner.

  - The reward wallet now carries the currency it is denominated in, like a linked wallet does.
  - The banner prices it with the host's rates and leads with the counter-value.
  - The amount is formatted as a token, not as fiat.
  - A reward nothing can price shows the asset amount alone.
  - `priceWallet` is renamed `getCounterValue`: it converts an amount, it does not price a wallet.

- [#22241](https://github.com/LedgerHQ/ledger-live/pull/22241) [`3b95cbb`](https://github.com/LedgerHQ/ledger-live/commit/3b95cbb5968a4484966233313ca8e2781b720ae8) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Include the Me contact in Pay contact strips and contact selection, keeping the existing order.

- [#22358](https://github.com/LedgerHQ/ledger-live/pull/22358) [`973a613`](https://github.com/LedgerHQ/ledger-live/commit/973a6136087e8e78eeffd0e761ed3828f9f81691) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Show a Pay disclaimer at the bottom of the desktop Card panel and the mobile Pay tab.

- [#22440](https://github.com/LedgerHQ/ledger-live/pull/22440) [`a39ba90`](https://github.com/LedgerHQ/ledger-live/commit/a39ba900d889155ebc4fe2cab88f82a715e3f605) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix remaining Pay Mixpanel events and user properties from the tracking plan

- [#22427](https://github.com/LedgerHQ/ledger-live/pull/22427) [`b9742c4`](https://github.com/LedgerHQ/ledger-live/commit/b9742c46b56860cc572643b25abfe64660082968) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Drop brackets around the recipient name on the Pay send confirmation screen.

- [#22402](https://github.com/LedgerHQ/ledger-live/pull/22402) [`dccea32`](https://github.com/LedgerHQ/ledger-live/commit/dccea322ed808abfa4e6829364fe945cd0a58383) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Polish the Pay tab: keep the last row of every Pay bottom sheet clear of the Android navigation bar and the iOS home indicator, size the card action buttons to `md`, make the desktop contacts table responsive with a wider name column, wrap the address-picker title, add 32px of scroll padding, widen the history tabs, fix the disclaimer copy and use the shield icon on verify address

- [#22031](https://github.com/LedgerHQ/ledger-live/pull/22031) [`f28215d`](https://github.com/LedgerHQ/ledger-live/commit/f28215d4b314c2a2dd32b5f2355aacc4776ee1f5) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Reserve height for the Perps deposit quoted-amount and status rows so the form no longer jumps when switching between the provider notice, the quote, and the error message

- [#22033](https://github.com/LedgerHQ/ledger-live/pull/22033) [`db7b972`](https://github.com/LedgerHQ/ledger-live/commit/db7b972bd6328a2bd215a7adec3bd5353a727a81) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Keep the entered Perps deposit amount when switching the funding asset/account instead of resetting it

- [#22488](https://github.com/LedgerHQ/ledger-live/pull/22488) [`1302bc7`](https://github.com/LedgerHQ/ledger-live/commit/1302bc7968a7d3bf9cd3d556057b662444b22608) Thanks [@LL782](https://github.com/LL782)! - Replace mutable analytics screen refs with a function-only tracking-page API.

- [#22550](https://github.com/LedgerHQ/ledger-live/pull/22550) [`86dbc48`](https://github.com/LedgerHQ/ledger-live/commit/86dbc48147fa1a16aa79c81f844ffe5117b29494) Thanks [@alexstapenka-ledger](https://github.com/alexstapenka-ledger)! - Add the `ptxEarnCtaOnMobile` feature flag and send it to Mixpanel as a boolean identify trait. Earn reads it via Wallet API.

- [#22549](https://github.com/LedgerHQ/ledger-live/pull/22549) [`24e881b`](https://github.com/LedgerHQ/ledger-live/commit/24e881b41d4199d9cf257a7450d139aa5f076a1d) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Hide Pay and card history amounts when discreet mode is enabled, and toggle it from the Pay balance

- [#22562](https://github.com/LedgerHQ/ledger-live/pull/22562) [`b8a4056`](https://github.com/LedgerHQ/ledger-live/commit/b8a405658b70b0ca43ec94bff53c5d13e2c16487) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Keep re-reading the Pay Card status after the holder returns from Apple or Google Wallet, and when the app comes back to the foreground

- [#22491](https://github.com/LedgerHQ/ledger-live/pull/22491) [`c8d3949`](https://github.com/LedgerHQ/ledger-live/commit/c8d39499a8f21e7b4d7f27d4c4f55d3b75c96983) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Hide the redundant Card extra in the History navbar when the type switcher is visible.

- [#22631](https://github.com/LedgerHQ/ledger-live/pull/22631) [`9be4635`](https://github.com/LedgerHQ/ledger-live/commit/9be4635d76d6d649be51a001d39b08c3bfd52af1) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Keep the Pay tab active in the sidebar while a Card live app is open

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

- [#22238](https://github.com/LedgerHQ/ledger-live/pull/22238) [`62fb052`](https://github.com/LedgerHQ/ledger-live/commit/62fb052d74dd4f8ee80ac74ffe7d1e1473752766) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Keep the selected contact in Send and open the recipient picker from the To bar.

- [#22407](https://github.com/LedgerHQ/ledger-live/pull/22407) [`4efaa4f`](https://github.com/LedgerHQ/ledger-live/commit/4efaa4fa4aefee20dc446eb6b19ab65be2e95f95) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Remove the Ledger by Figment T&Cs link from the Sui delegation validator step

- [#22579](https://github.com/LedgerHQ/ledger-live/pull/22579) [`0e98a58`](https://github.com/LedgerHQ/ledger-live/commit/0e98a58c4f313f55c088be010a360c6d85ea7d43) Thanks [@vpenskyi-ledger](https://github.com/vpenskyi-ledger)! - Re-read `SWAP_API_BASE` on every swap/Perps quote request instead of baking it into the store at startup, so a debug-menu override reaches the aggregator without an app restart

- [#22392](https://github.com/LedgerHQ/ledger-live/pull/22392) [`a6b6959`](https://github.com/LedgerHQ/ledger-live/commit/a6b6959a9540ad1fb7037f9f8cfd76b56e81d02d) Thanks [@CremaFR](https://github.com/CremaFR)! - Include Exchange and signing app versions on swap cancel payloads

- [#22382](https://github.com/LedgerHQ/ledger-live/pull/22382) [`c119e0d`](https://github.com/LedgerHQ/ledger-live/commit/c119e0d38f626314cf679bfa06420ce0e4bca03b) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Redirect the "choose card type" onboarding step to the Baanx hosted order-card page, and align pay bottom sheet spacing and tile styles

- [#22522](https://github.com/LedgerHQ/ledger-live/pull/22522) [`e19e6cf`](https://github.com/LedgerHQ/ledger-live/commit/e19e6cf36074363d22085b6c85c54ef964eb382c) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix the cropped transaction name and date on a card charge funded by several assets, and round card crypto amounts like the rest of the product. A devtool action and a mock fixture now produce such a charge.

- [#22054](https://github.com/LedgerHQ/ledger-live/pull/22054) [`8c486aa`](https://github.com/LedgerHQ/ledger-live/commit/8c486aabe3dbd100b21e43d3f344fda5142858ed) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Add `@ledgerhq/live-signer-tron`, wrapping `@ledgerhq/device-signer-kit-tron` as `DmkSignerTron`
  alongside the legacy `hw-app-trx` path as `LegacySignerTron`. `families/tron/setup.ts` picks
  between them, using the DMK signer only on a DMK transport with the new `ldmkTronSigner` feature
  flag on. The flag is disabled by default, so Tron keeps signing through `hw-app-trx`.

- [#22664](https://github.com/LedgerHQ/ledger-live/pull/22664) [`f96e346`](https://github.com/LedgerHQ/ledger-live/commit/f96e3461de843bb89127c7e9ac5578e85140025f) Thanks [@semeano](https://github.com/semeano)! - Add Zcash privacy/transfer-flow attributes to the new send flow's Segment tracking, and a first page event for the balance-type step, so a private vs public Zcash send is distinguishable in analytics (LIVE-38009).

### Patch Changes

- Updated dependencies [[`b42673e`](https://github.com/LedgerHQ/ledger-live/commit/b42673eed68aba6b2885486d7294f5f9163f721d), [`e8d72da`](https://github.com/LedgerHQ/ledger-live/commit/e8d72dad9cd8aca2bf11b1768d10f2c7553e4cba), [`2d869a5`](https://github.com/LedgerHQ/ledger-live/commit/2d869a596a4562a00003de01cc657d7277dc6b7c), [`c5964f8`](https://github.com/LedgerHQ/ledger-live/commit/c5964f8c6348028d97832dd46cd8554d813d48db), [`8b387f4`](https://github.com/LedgerHQ/ledger-live/commit/8b387f4d1db967288af2f982a78949e0615ebc7e), [`e8d5e1b`](https://github.com/LedgerHQ/ledger-live/commit/e8d5e1bf6eec2a47072ad59762064b24a89701cf), [`c95a00f`](https://github.com/LedgerHQ/ledger-live/commit/c95a00f06cf5e8891e843c0a2cdc17e6d97c85f1), [`3e7af98`](https://github.com/LedgerHQ/ledger-live/commit/3e7af98196476c04a97522109fded33cc17dc868), [`26e51d9`](https://github.com/LedgerHQ/ledger-live/commit/26e51d98fde1c080e09f566e0dbeb4f2c2e9f382), [`6a5972d`](https://github.com/LedgerHQ/ledger-live/commit/6a5972df49e243bbb36cd973e405302d0d8925bc), [`3e7bbe9`](https://github.com/LedgerHQ/ledger-live/commit/3e7bbe93f6075a2a6783e05d36459c166366c910), [`c32cde3`](https://github.com/LedgerHQ/ledger-live/commit/c32cde31461523c72df4f67cd18288c6f65c9951), [`ad2f1de`](https://github.com/LedgerHQ/ledger-live/commit/ad2f1deb73d1fd6fed1383133a7f2b259630cd06), [`6baab2e`](https://github.com/LedgerHQ/ledger-live/commit/6baab2e7989b00bec4c361cee3535f76cb919915), [`cfb7566`](https://github.com/LedgerHQ/ledger-live/commit/cfb756682290e9940d65f3b6417d6b111449e546), [`bc28500`](https://github.com/LedgerHQ/ledger-live/commit/bc2850004d7cbc59aac8093b3739bfcc351daf43), [`4d84f2b`](https://github.com/LedgerHQ/ledger-live/commit/4d84f2b23f3bc04c06770e390e22cd4e35ee3fe3), [`1a26e59`](https://github.com/LedgerHQ/ledger-live/commit/1a26e599a47d52854cf05081a386e6090d8677f2), [`5adf8f3`](https://github.com/LedgerHQ/ledger-live/commit/5adf8f3b844e21895aa17f96a620a2dfa6b679ad), [`6e76dda`](https://github.com/LedgerHQ/ledger-live/commit/6e76ddac6370bb60b17971679a857fae7ca83eb9), [`486a1a4`](https://github.com/LedgerHQ/ledger-live/commit/486a1a45027e8104ae824d77bd34b298788c9b04), [`f7cd861`](https://github.com/LedgerHQ/ledger-live/commit/f7cd8616265d3f94fef24332626402efe39eb83f), [`a503ca1`](https://github.com/LedgerHQ/ledger-live/commit/a503ca185ae15738cd8ec77949d0964baa8c679b), [`f1d8aac`](https://github.com/LedgerHQ/ledger-live/commit/f1d8aac1c7c0bc0be9beb1508c1a9ef3cf7affae), [`33b4952`](https://github.com/LedgerHQ/ledger-live/commit/33b4952ef04d4e0528d2735ba299b4a8073e447e), [`e9af9cb`](https://github.com/LedgerHQ/ledger-live/commit/e9af9cb415b3ba4038d13ffc2dca7edb0432c830), [`d6866e7`](https://github.com/LedgerHQ/ledger-live/commit/d6866e7dc7ced8898ac585d4e34d9667d9ad7f17), [`f8c92f9`](https://github.com/LedgerHQ/ledger-live/commit/f8c92f9300d4b8268949ed7aff5a6781ed7f60a8), [`96754dc`](https://github.com/LedgerHQ/ledger-live/commit/96754dc5cfec3487fe04b9202ddffe69fff476a4), [`7fd570c`](https://github.com/LedgerHQ/ledger-live/commit/7fd570cd3868a675dad0d77136734eab63f11bd1), [`e046686`](https://github.com/LedgerHQ/ledger-live/commit/e046686befa308188170ac9950eae394863c76a5), [`b4599a5`](https://github.com/LedgerHQ/ledger-live/commit/b4599a58f817aa233be256d6f755a0fd4d0fc8a5), [`e3c51c5`](https://github.com/LedgerHQ/ledger-live/commit/e3c51c57487a765391677073d78fb9ce275374b6), [`381bd0b`](https://github.com/LedgerHQ/ledger-live/commit/381bd0befb6a09f20f13f65c233f0e1479e7051d), [`dfd53ad`](https://github.com/LedgerHQ/ledger-live/commit/dfd53adbf0815e2a62f59c1e996bd709bd710ea0), [`c63d0fa`](https://github.com/LedgerHQ/ledger-live/commit/c63d0fa3ad6f181beb5d8ea7b2ef474d82fd1ed7), [`9e54487`](https://github.com/LedgerHQ/ledger-live/commit/9e5448750d57eb92f95ef828b55d80eedd826323), [`83fac3e`](https://github.com/LedgerHQ/ledger-live/commit/83fac3e00782840d1f118180dfb9afb9a484952c), [`b6a9b53`](https://github.com/LedgerHQ/ledger-live/commit/b6a9b531267360fdca64b8db22dd8781aa414dd9), [`68f4179`](https://github.com/LedgerHQ/ledger-live/commit/68f41798cae68cd1b91f291d5447514b80fd6f49), [`8ecbe06`](https://github.com/LedgerHQ/ledger-live/commit/8ecbe0676b614fed535900aa6085ddebabc8d85c), [`46f0f94`](https://github.com/LedgerHQ/ledger-live/commit/46f0f9447e12faa953268bf2a19fbdfd85a43da9), [`ea90542`](https://github.com/LedgerHQ/ledger-live/commit/ea90542540f47a76c18cf5f440bb98b9be71c837), [`e8518d7`](https://github.com/LedgerHQ/ledger-live/commit/e8518d7f0b88096552c6a8f74ffe5752bc517a39), [`41eca65`](https://github.com/LedgerHQ/ledger-live/commit/41eca657432071ba1d22029b79be85ca3eff6a94), [`912b087`](https://github.com/LedgerHQ/ledger-live/commit/912b0877538bd06cc7187b90e2eab8182fe55034), [`defb949`](https://github.com/LedgerHQ/ledger-live/commit/defb949c02d9d0d935882eb8e8617d000e18b163), [`70d0b90`](https://github.com/LedgerHQ/ledger-live/commit/70d0b90b67ff013f19318378c78a3f3d442f773b), [`887561b`](https://github.com/LedgerHQ/ledger-live/commit/887561bb56c7bbe4c5ff3d62a3309ce3d449a72c), [`aee5fe8`](https://github.com/LedgerHQ/ledger-live/commit/aee5fe897519c1bc39f0d4891bbc1ee4a7aaaaa1), [`3d41eab`](https://github.com/LedgerHQ/ledger-live/commit/3d41eab30728e94a21c53d4d4d9fe6eec27a5ce1), [`ae229f2`](https://github.com/LedgerHQ/ledger-live/commit/ae229f27b250d6bdd06af1b06a2912a8c556a27c), [`3fdebf4`](https://github.com/LedgerHQ/ledger-live/commit/3fdebf4a84f5630192e50aef9a0a60b0c56f6a2f), [`3b95cbb`](https://github.com/LedgerHQ/ledger-live/commit/3b95cbb5968a4484966233313ca8e2781b720ae8), [`973a613`](https://github.com/LedgerHQ/ledger-live/commit/973a6136087e8e78eeffd0e761ed3828f9f81691), [`a39ba90`](https://github.com/LedgerHQ/ledger-live/commit/a39ba900d889155ebc4fe2cab88f82a715e3f605), [`fc6f187`](https://github.com/LedgerHQ/ledger-live/commit/fc6f1878bb1fa7f0c87c18478abbb194c6edee0d), [`6fa8121`](https://github.com/LedgerHQ/ledger-live/commit/6fa81215cdeade45495994d5dc7dc0477c097e2c), [`b2c3742`](https://github.com/LedgerHQ/ledger-live/commit/b2c3742dabf62702a85c8710421bce8ae80dc1fd), [`dccea32`](https://github.com/LedgerHQ/ledger-live/commit/dccea322ed808abfa4e6829364fe945cd0a58383), [`006991d`](https://github.com/LedgerHQ/ledger-live/commit/006991d2a5c7ea7431cb66d13a972c4aafd90258), [`a025d7a`](https://github.com/LedgerHQ/ledger-live/commit/a025d7a872b7b1e4681d16b2bfb54f8949bf6626), [`1302bc7`](https://github.com/LedgerHQ/ledger-live/commit/1302bc7968a7d3bf9cd3d556057b662444b22608), [`86dbc48`](https://github.com/LedgerHQ/ledger-live/commit/86dbc48147fa1a16aa79c81f844ffe5117b29494), [`24e881b`](https://github.com/LedgerHQ/ledger-live/commit/24e881b41d4199d9cf257a7450d139aa5f076a1d), [`b8a4056`](https://github.com/LedgerHQ/ledger-live/commit/b8a405658b70b0ca43ec94bff53c5d13e2c16487), [`b4a23ea`](https://github.com/LedgerHQ/ledger-live/commit/b4a23ea27edbc4a3e8aeaee1da6f0e7aecefab92), [`a896fca`](https://github.com/LedgerHQ/ledger-live/commit/a896fca1974a46f10e915d1212e0947e2d808ad5), [`87de096`](https://github.com/LedgerHQ/ledger-live/commit/87de096183309fa2152abe838f09a537b681e8eb), [`cdcb834`](https://github.com/LedgerHQ/ledger-live/commit/cdcb83446d2a70c910fee7cded0b03f3ab325b30), [`4f0fdc3`](https://github.com/LedgerHQ/ledger-live/commit/4f0fdc3d78ac46e4396106eaf10e20ca6c0ed3cf), [`62fb052`](https://github.com/LedgerHQ/ledger-live/commit/62fb052d74dd4f8ee80ac74ffe7d1e1473752766), [`3fdfcc0`](https://github.com/LedgerHQ/ledger-live/commit/3fdfcc07ffb1d8e0b5ef39c830a5e7204ced77e3), [`93e6db2`](https://github.com/LedgerHQ/ledger-live/commit/93e6db2db85721b483173e781db9f53db3699715), [`8a305ed`](https://github.com/LedgerHQ/ledger-live/commit/8a305edb307d0a4cd30ad615ccd98ef5d7caf523), [`b34159a`](https://github.com/LedgerHQ/ledger-live/commit/b34159af9fe5b26d5d7bfb04f881fca55246e83c), [`c020110`](https://github.com/LedgerHQ/ledger-live/commit/c02011033bf5ca5bf38f05c487adb3a27c209a7d), [`0ce2853`](https://github.com/LedgerHQ/ledger-live/commit/0ce2853042f94314e9255ab06eeccbb994a1f04e), [`0e98a58`](https://github.com/LedgerHQ/ledger-live/commit/0e98a58c4f313f55c088be010a360c6d85ea7d43), [`a6b6959`](https://github.com/LedgerHQ/ledger-live/commit/a6b6959a9540ad1fb7037f9f8cfd76b56e81d02d), [`c35b103`](https://github.com/LedgerHQ/ledger-live/commit/c35b10307731ef8910eac0be4de14abe4e7b0643), [`c119e0d`](https://github.com/LedgerHQ/ledger-live/commit/c119e0d38f626314cf679bfa06420ce0e4bca03b), [`e19e6cf`](https://github.com/LedgerHQ/ledger-live/commit/e19e6cf36074363d22085b6c85c54ef964eb382c), [`8c486aa`](https://github.com/LedgerHQ/ledger-live/commit/8c486aabe3dbd100b21e43d3f344fda5142858ed), [`88bae04`](https://github.com/LedgerHQ/ledger-live/commit/88bae04e2f7e7a3de8d55c340fe32b48e37bd78d), [`df5d8c9`](https://github.com/LedgerHQ/ledger-live/commit/df5d8c96892094fc6faf06992f415e88ff64b5c8), [`f7ba21f`](https://github.com/LedgerHQ/ledger-live/commit/f7ba21f7df883e71102a0949c8a3d23e20fb4cbd), [`62cc42f`](https://github.com/LedgerHQ/ledger-live/commit/62cc42f32d041e0e1081e7fdaca04169581429ec), [`f96e346`](https://github.com/LedgerHQ/ledger-live/commit/f96e3461de843bb89127c7e9ac5578e85140025f), [`06c71d1`](https://github.com/LedgerHQ/ledger-live/commit/06c71d101fb664b50202f6ddc09dd1abbcb76a3a)]:
  - @domain/api-card-management@0.8.0-next.0
  - @features/flow-pay-card-details@0.6.0-next.0
  - @features/platform-pay-analytics@0.3.0-next.0
  - @features/flow-contacts-list@0.9.0-next.0
  - @ledgerhq/types-live@6.126.0-next.0
  - @domain/api-market-index-fear-and-greed@0.4.0-next.0
  - @shared/ui-info-state@0.4.0-next.0
  - @ledgerhq/live-dmk-shared@0.34.0-next.0
  - @ledgerhq/live-dmk-desktop@0.23.0-next.0
  - @ledgerhq/live-signer-evm@0.24.0-next.0
  - @ledgerhq/live-common@38.2.0-next.0
  - @ledgerhq/coin-casper@3.5.0-next.0
  - @features/platform-device-action-content@0.3.0-next.0
  - @features/flow-contacts@0.13.0-next.0
  - @features/flow-pay-card-assets@0.3.0-next.0
  - @features/flow-pay-balance@0.6.0-next.0
  - @features/flow-pay-card-transactions@0.4.0-next.0
  - @features/flow-pay-card@0.6.0-next.0
  - @features/flow-pay-card-widget@0.5.0-next.0
  - @shared/feature-flags@0.25.0-next.0
  - @shared/env@0.9.0-next.0
  - @features/platform-contacts@0.9.0-next.0
  - @features/flow-pay-contact@0.5.0-next.0
  - @ledgerhq/asset-aggregation@0.17.0-next.0
  - @ledgerhq/wallet-analytics@0.5.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.6.0-next.0
  - @domain/entity-currency-crypto@0.14.0-next.0
  - @ledgerhq/coin-bitcoin@0.54.0-next.0
  - @ledgerhq/coin-zcash@0.10.0-next.0
  - @ledgerhq/live-signer-tron@0.2.0-next.0
  - @features/flow-pay-card-auth@0.9.0-next.0
  - @ledgerhq/transaction-observability@0.4.0-next.0
  - @ledgerhq/coin-cosmos@1.5.0-next.0
  - @features/flow-pay-request@0.7.0-next.0
  - @ledgerhq/coin-canton@1.3.0-next.0
  - @ledgerhq/coin-cardano@1.3.0-next.0
  - @ledgerhq/coin-concordium@1.5.0-next.0
  - @ledgerhq/coin-filecoin@2.3.0-next.0
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
  - @ledgerhq/live-countervalues-react@0.18.2-next.0
  - @ledgerhq/live-send@0.1.2-next.0
  - @ledgerhq/live-wallet@1.1.5-next.0
  - @ledgerhq/wallet-pnl@0.7.13-next.0
  - @ledgerhq/asset-detail@0.11.7-next.0
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
  - @ledgerhq/wallet-btc@0.6.0

## 4.22.0

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
  - @shared/env@0.8.0
  - @shared/api-services@0.8.0
  - @features/platform-card@0.6.0
  - @features/flow-pay-card-auth@0.8.0
  - @features/flow-contacts-list@0.8.0
  - @domain/api-card-management@0.7.0
  - @features/flow-pay-card-details@0.5.0
  - @features/flow-pay-card@0.5.0
  - @features/platform-contacts@0.8.0
  - @features/flow-contacts-add-contact@0.7.0
  - @features/flow-contacts-edit-contact@0.6.0
  - @features/flow-contacts-edit-address@0.4.0
  - @features/flow-contacts-add-address@0.6.0
  - @features/flow-contacts@0.12.0
  - @features/flow-pay-card-widget@0.4.0
  - @devtools/bindings@0.9.0
  - @ledgerhq/asset-aggregation@0.16.0
  - @ledgerhq/live-common@38.1.0
  - @shared/ui-info-state@0.3.0
  - @features/flow-pay-card-assets@0.2.0
  - @features/flow-large-screen-upsell@2.2.0
  - @features/flow-pay-card-transactions@0.3.0
  - @domain/entity-currency-crypto@0.13.0
  - @ledgerhq/coin-concordium@1.4.0
  - @domain/entity-contact@0.10.0
  - @ledgerhq/coin-bitcoin@0.53.0
  - @ledgerhq/coin-canton@1.2.0
  - @ledgerhq/coin-cardano@1.2.0
  - @ledgerhq/coin-casper@3.4.0
  - @ledgerhq/coin-cosmos@1.4.0
  - @ledgerhq/coin-filecoin@2.2.0
  - @ledgerhq/coin-zcash@0.9.0
  - @ledgerhq/hw-transport-http@6.38.0
  - @ledgerhq/ledger-wallet-framework@3.5.0
  - @ledgerhq/types-devices@7.1.0
  - @ledgerhq/types-live@6.125.0
  - @features/platform-env@0.4.0
  - @ledgerhq/live-dmk-shared@0.33.0
  - @ledgerhq/ledger-key-ring-protocol@0.23.0
  - @devtools/shell@0.10.0
  - @devtools/transport-panel@0.7.0
  - @ledgerhq/wallet-btc@0.6.0
  - @ledgerhq/hw-ledger-key-ring-protocol@0.13.0
  - @ledgerhq/live-dmk-desktop@0.22.0
  - @shared/feature-flags@0.24.0
  - @domain/entity-card-asset-mapping@0.7.0
  - @features/platform-currencies@0.9.0
  - @features/flow-pay-balance@0.5.0
  - @features/flow-pay-feature-tour@0.6.0
  - @features/flow-pay-request@0.6.0
  - @features/platform-feature-flags@0.8.0
  - @shared/analytics@0.3.0
  - @shared/analytics-react@0.3.0
  - @shared/linking@0.3.0
  - @domain/api-aggregated-assets@0.5.2
  - @features/platform-aggregated-assets@0.5.4
  - @ledgerhq/asset-detail@0.11.6
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
  - @ledgerhq/domain-service@1.8.20
  - @devtools/wire@0.5.1
  - @features/flow-analytics-consent@0.2.7

## 4.22.0-next.1

### Patch Changes

- Updated dependencies []:
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

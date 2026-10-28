# @ledgerhq/live-common

## 38.5.0-next.1

### Minor Changes

- [#24014](https://github.com/LedgerHQ/ledger-live/pull/24014) [`5b7bcf7`](https://github.com/LedgerHQ/ledger-live/commit/5b7bcf7b75d380d098eb990220383a02103e4319) Thanks [@Justkant](https://github.com/Justkant)! - Log manifest domain check violations, rejected `goToURL` fallbacks and rejected `loadURL` calls to the exported logs, once per distinct violation. Add `resolveInitialURL`, which returns the initial URL along with the `goToURL` it rejected

## 38.5.0-next.0

### Minor Changes

- [#23811](https://github.com/LedgerHQ/ledger-live/pull/23811) [`7077a0a`](https://github.com/LedgerHQ/ledger-live/commit/7077a0ac3e17ba9922562ca286232bd7c475a4f4) Thanks [@LucasWerey](https://github.com/LucasWerey)! - `useAPI` shares one in-flight request between hooks asking for the same data, so concurrent callers no longer fetch it twice. `useFetchCurrencyAll` exposes `isResolved`, which tells a catalog still loading apart from a resolved empty one.

- [#23863](https://github.com/LedgerHQ/ledger-live/pull/23863) [`4883e43`](https://github.com/LedgerHQ/ledger-live/commit/4883e4316f186755d65348e6648cbc846c62f2bf) Thanks [@LL782](https://github.com/LL782)! - The OFAC-sanctioned fiat list now has one owner, `@domain/entity-currency-fiat`, behind `isSanctionedFiatTicker(ticker)`. The package no longer exports `OFAC_FIAT_TICKERS`, and `@ledgerhq/live-common/currencies` no longer exports `OFAC_CURRENCIES`. Both apps and `@domain/api-currency-fiat` call the new function.

- [#23583](https://github.com/LedgerHQ/ledger-live/pull/23583) [`54fd19d`](https://github.com/LedgerHQ/ledger-live/commit/54fd19d8fc32c8aa886afca9e750db5163ce20e6) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Track the Zcash private balance activation funnel and whether Zcash accounts have their shielded balance enabled.

- [#23721](https://github.com/LedgerHQ/ledger-live/pull/23721) [`2f49d10`](https://github.com/LedgerHQ/ledger-live/commit/2f49d10deab5f44e7468ffdc4577f0804235824c) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Add the SwapKit withdraw API client and the `custom.perps.withdraw` wallet API method for Perps, which takes only the HyperCore `sourceAccountId` (the available balance is derived in Ledger Wallet). Add the `perpetuals:withdraw` and `perpetuals:withdrawFrom` drawer use cases. Withdraw quotes use the existing swap quotes endpoint (`swapkit_hyperliquid`) and withdraw destinations come from swap's supported currencies. Quotes carry the NEAR (`hyperCoreAction`) or Mayan (`typedData`) payload to sign, submitted with its signature to `/swapkit_hyperliquid/submit`.

  Perps deposit modules moved: `wallet-api/Perps/depositQuote`, `depositRequest` and `depositMaxBuffer` are now `wallet-api/Perps/deposit/quote`, `deposit/request` and `deposit/maxBuffer`.

- [#23723](https://github.com/LedgerHQ/ledger-live/pull/23723) [`605f361`](https://github.com/LedgerHQ/ledger-live/commit/605f361c7af36373d28dd7c5020bcfd9fa1ee21c) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Add the Perps withdraw input screen on desktop (amount, Max, destination account and live SwapKit quote), with shared Perps components, the `perpetuals:withdraw` drawer use case and the withdraw amount and default account helpers.

- [#23975](https://github.com/LedgerHQ/ledger-live/pull/23975) [`d94b2e8`](https://github.com/LedgerHQ/ledger-live/commit/d94b2e8643c76f4b231b5cb21184ac76a3bdff15) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Add the Perps withdraw input screen on mobile (amount keypad, Max, destination account and live SwapKit quote), with the shared withdraw form, drawer use case and amount helpers in live-common, shared Perps account selector and keypad helpers, and drawer copy for the withdraw use cases.

- [#23611](https://github.com/LedgerHQ/ledger-live/pull/23611) [`0c04ab2`](https://github.com/LedgerHQ/ledger-live/commit/0c04ab223b387417a27eebbf64459bcd17ea3dc2) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Move the coin-module call event, its observer registry and the transmission policy out of live-common into `@features/platform-coin-observability`; live-common keeps only the `withMetrics` resolver adapter.

- [#23611](https://github.com/LedgerHQ/ledger-live/pull/23611) [`0c04ab2`](https://github.com/LedgerHQ/ledger-live/commit/0c04ab223b387417a27eebbf64459bcd17ea3dc2) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Report coin-module calls and every broadcast outcome to Datadog logs behind the new `coinObservability` flag: `withMetrics` wraps the resolved coin-module API and reports each call to registered observers, sampled on the sync path and capped on failures, and the bridge seam's broadcast events are forwarded as `tx_broadcast` for every family and route.

- [#23681](https://github.com/LedgerHQ/ledger-live/pull/23681) [`e3e0f3a`](https://github.com/LedgerHQ/ledger-live/commit/e3e0f3a5fefbdcf08c8c16d7dc2a3d9f6a6922e0) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Move the explorer URL helpers (`getDefaultExplorerView`, `getTransactionExplorer`, `getAddressExplorer`, `getTokenExplorer`, `getStakePoolExplorer`) from `@ledgerhq/live-common/explorers` to `@domain/entity-currency-crypto`. `getAccountContractExplorer` becomes `getTokenExplorer(view, contractAddress, ownerAddress)` and takes plain strings. All usages are migrated and `@ledgerhq/live-common/explorers` is removed.

- [#23706](https://github.com/LedgerHQ/ledger-live/pull/23706) [`c43b0f9`](https://github.com/LedgerHQ/ledger-live/commit/c43b0f9ff55c39a5a137e210949419263207d322) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Show the block height of a Zcash operation, label its confirmation count, and show the block height the birthday date resolves to in the private balance flow.

- [#23710](https://github.com/LedgerHQ/ledger-live/pull/23710) [`fd6a3a3`](https://github.com/LedgerHQ/ledger-live/commit/fd6a3a341b07baa2849a9e79e3a05b73863034b7) Thanks [@gre-ledger](https://github.com/gre-ledger)! - feat(account-descriptor): identify the network by its CAL network_id

  The descriptor becomes `account:2:<type>:<network_id>:<key>:<path>` and the entity only reads version 2.

  wallet-cli, breaking:

  - The upgrade is one-way: `session.yaml` is rewritten to version 2 on the next write (e.g. `account discover`), and an older wallet-cli can no longer read it. Don't roll back, pin an older install or run two versions on the same session.
  - `network` in the JSON envelope and in analytics events is now the network id (`ethereum`, `bitcoin_testnet`), no longer `<name>:<env>` (`ethereum:main`).

- [#23500](https://github.com/LedgerHQ/ledger-live/pull/23500) [`4e9e4f6`](https://github.com/LedgerHQ/ledger-live/commit/4e9e4f65f4a8c22ebcb270a8886c50ebe289c705) Thanks [@semeano](https://github.com/semeano)! - Price Alpen Testnet transactions as legacy with a 0.002 gwei gas price floor instead of a 1 gwei default tip

- [#23632](https://github.com/LedgerHQ/ledger-live/pull/23632) [`cdfa0c9`](https://github.com/LedgerHQ/ledger-live/commit/cdfa0c93d31ebdefdbc6bfc5f8deee7135623a3e) Thanks [@qperrot](https://github.com/qperrot)! - Set a 375 gwei minGasPrice floor on Cronos so transactions meet the network's global minimum fee

- [#23526](https://github.com/LedgerHQ/ledger-live/pull/23526) [`e8f69f6`](https://github.com/LedgerHQ/ledger-live/commit/e8f69f6cecfb104cddd8438ca6fcbd8995f1d488) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Remove the desktop `operationsList` flag and always show transaction history

- [#23708](https://github.com/LedgerHQ/ledger-live/pull/23708) [`dd056b8`](https://github.com/LedgerHQ/ledger-live/commit/dd056b8a4c6c7c28879cfb1c44139b2479281987) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump ts-libs packages (`@ledgerhq/auth` 0.1.1, `@ledgerhq/devices` 8.18.1, `@ledgerhq/hw-transport` 6.36.1, `@ledgerhq/hw-transport-mocker` 6.35.1, `@ledgerhq/hw-ledger-key-ring-protocol` 1.0.1, `@ledgerhq/ledger-key-ring-protocol` 1.1.0, `@ledgerhq/live-config` 3.9.1, `@ledgerhq/psbtv2` 0.6.2), `zod` 4.6.7, `semver` 7.8.5, `lodash` 4.18.1, and catalog `bitcoinjs-lib` 7.0.4.

- [#23047](https://github.com/LedgerHQ/ledger-live/pull/23047) [`95fb249`](https://github.com/LedgerHQ/ledger-live/commit/95fb249c5f08f7a3602a210bfcbf89e19c988a8b) Thanks [@qperrot](https://github.com/qperrot)! - test(coin-tester-bitcoin): run a send scenario through coin-bitcoin's alpaca api with the generic coin framework

- [#23061](https://github.com/LedgerHQ/ledger-live/pull/23061) [`5b1443e`](https://github.com/LedgerHQ/ledger-live/commit/5b1443e8dd056a5c7c0d34a82abb0b1b5ff8d5a0) Thanks [@ishaba](https://github.com/ishaba)! - Let users pick the Tronify sponsored fee from the send flow on mobile, and link the fee payment disclaimer to a Learn more article

- [#23596](https://github.com/LedgerHQ/ledger-live/pull/23596) [`dbaf56d`](https://github.com/LedgerHQ/ledger-live/commit/dbaf56ddb47f5a43221feba193700cf40f4a46df) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Always show desktop My Wallet and drop the lwdWallet40 myWallet param

- [#23700](https://github.com/LedgerHQ/ledger-live/pull/23700) [`07a548b`](https://github.com/LedgerHQ/ledger-live/commit/07a548bb67cfd5dff60f4554bfdfd386856e97e9) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(llc): update Unichain RPC endpoint

- [#23416](https://github.com/LedgerHQ/ledger-live/pull/23416) [`d4be6b6`](https://github.com/LedgerHQ/ledger-live/commit/d4be6b620102f2c9f65201935646d32cb365f6ac) Thanks [@ishaba](https://github.com/ishaba)! - Ask the family send descriptor whether an arriving rent changes the fee, so the Amount step no longer checks Tron's TRC-20 token type itself

- [#23572](https://github.com/LedgerHQ/ledger-live/pull/23572) [`01ed754`](https://github.com/LedgerHQ/ledger-live/commit/01ed754cd80959b8e9ec3d73a02b1b8d5289e0be) Thanks [@gre-ledger](https://github.com/gre-ledger)! - feat(account-data): the FullSync source reads the balance kind

- [#23605](https://github.com/LedgerHQ/ledger-live/pull/23605) [`4a5b346`](https://github.com/LedgerHQ/ledger-live/commit/4a5b346480bff9d945274149cca8ed1175cc30eb) Thanks [@gre-ledger](https://github.com/gre-ledger)! - feat(account-data): share one full sync between BridgeSync and the FullSync source

  `syncLegacyAccount` writes each update into the legacy store and shares the sync in flight per account, so the background sync and account data reads never sync one account twice. The FullSync source skips the sync of an account whose last sync completed within the default max age, and answers it from the store.

- [#23992](https://github.com/LedgerHQ/ledger-live/pull/23992) [`9fcce41`](https://github.com/LedgerHQ/ledger-live/commit/9fcce4124460578380778520016adccaf576980d) Thanks [@Justkant](https://github.com/Justkant)! - Send platform, llVersion and lang in the unfiltered live-app catalog request, so manifest overrides also apply to private apps

- [#23288](https://github.com/LedgerHQ/ledger-live/pull/23288) [`6ea7918`](https://github.com/LedgerHQ/ledger-live/commit/6ea791860eef5b92cc6041ba171e8846e88ef2c8) Thanks [@benruseau](https://github.com/benruseau)! - Plug the OS Update Orchestrator into My Ledger on mobile, behind the `ldmkOsUpdates` feature flag.

  - Connecting to My Ledger resolves the OS update path and stores the updates in a new `osUpdate` slice, while the connect bottom sheet stays in its loading state. A resolve failure still lands on My Ledger.
  - The OS update banner (portfolio and My Ledger) is driven by that slice and gated by device model, firmware version and USB/BLE connection. From the portfolio, it redirects to My Ledger, which reconnects the device and opens the What's new page through the `firmwareUpdate` param.
  - Confirming What's new starts the orchestrator. Once the updates are applied the slice is cleared, and a cancel or a crash reconnects through My Ledger, which resolves the path again.
  - `@ledgerhq/live-dmk-mobile` adds `getActiveConnectedDevice`, which returns the connected device of the session the transports are using, as the DMK can hold several sessions at once.
  - `@ledgerhq/live-dmk-shared` exports the `OsUpdate` type.
  - `@ledgerhq/live-common` adds an optional `onCompleted` callback to `OsUpdatesOrchestratorComponent`.

- [#23593](https://github.com/LedgerHQ/ledger-live/pull/23593) [`e647907`](https://github.com/LedgerHQ/ledger-live/commit/e647907efc9ef15a3bba21ec5acdbbe6cbae658a) Thanks [@benruseau](https://github.com/benruseau)! - Add analytics tracking to the mobile OS update flow.

- [#23901](https://github.com/LedgerHQ/ledger-live/pull/23901) [`4583067`](https://github.com/LedgerHQ/ledger-live/commit/4583067f4eca55d70079fa6347b21c48f304bf54) Thanks [@LL782](https://github.com/LL782)! - Improve the broadcast log events sent to Datadog

- [#23527](https://github.com/LedgerHQ/ledger-live/pull/23527) [`a389665`](https://github.com/LedgerHQ/ledger-live/commit/a389665d6256a750f539ec54516f667cca1fb011) Thanks [@qperrot](https://github.com/qperrot)! - Stop setting name / unit on returned assets

- [#23690](https://github.com/LedgerHQ/ledger-live/pull/23690) [`750d4bf`](https://github.com/LedgerHQ/ledger-live/commit/750d4bf2f8c70aa114e98222e25770a9a2cdfa70) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Update @ledgerhq/coin-evm to 16.0.0 and drop the removed currencyId argument from its API and logic calls

- [#23255](https://github.com/LedgerHQ/ledger-live/pull/23255) [`0240a0c`](https://github.com/LedgerHQ/ledger-live/commit/0240a0c9a069f895516199995483af5f12993277) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(cosmos): slim the account model (sequence, staking resources with validators, mode-based transaction type)

- [#23613](https://github.com/LedgerHQ/ledger-live/pull/23613) [`9c7d59d`](https://github.com/LedgerHQ/ledger-live/commit/9c7d59d0ffcc72ba746bc20e9ff744db9730503b) Thanks [@jnicoulaud-ledger](https://github.com/jnicoulaud-ledger)! - A Solana account no longer resyncs its whole history when the CAL token list changes. The sync resumes from its watermark unless the account holds a token that just became listed (or is no longer blacklisted), the only case where the stored history misses operations a sub-account needs.

  A family opts in with the new `BridgeApi.balanceListsEveryToken` flag, which declares that `getBalance` lists every token the address holds without scanning its history. Solana is the only family that sets it.

- [#23705](https://github.com/LedgerHQ/ledger-live/pull/23705) [`5ef3bbd`](https://github.com/LedgerHQ/ledger-live/commit/5ef3bbd09001975fcbfc21dfd283495e74c9e70a) Thanks [@semeano](https://github.com/semeano)! - Include the Stacks memo in sent transactions on the generic coin framework. The memo fields now also set `memoType`/`memoValue`, which the generic bridge turns into the intent's memo, and coin-stacks writes it into STX and SIP-010 transfers and rejects one longer than 34 bytes (LIVE-39478).

- [#23609](https://github.com/LedgerHQ/ledger-live/pull/23609) [`6ef743c`](https://github.com/LedgerHQ/ledger-live/commit/6ef743cbd058ce0a43363d01b6dadc0f2674a8e3) Thanks [@semeano](https://github.com/semeano)! - fix(coin-stacks): show stake details on the device step, map device rejection to UserRefusedOnDevice, type pox stake/unstake as DELEGATE/UNDELEGATE, reject boot contracts as pools, estimate a stake before its data is complete, validate the stake form inline, retype stored contract-call operations on load (as CONTRACT_CALL: a stored row has no contract id, so stakes synced before this change stay "Contract call" while new ones are DELEGATE/UNDELEGATE), and fall back to the transfer fee rate when the node proxy has no POST /v2/fees/transaction route

- [#23588](https://github.com/LedgerHQ/ledger-live/pull/23588) [`ffd02a9`](https://github.com/LedgerHQ/ledger-live/commit/ffd02a95c452560d606ad30588f15ff5d2182763) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Always show Wallet 4.0 PnL and drop the `pnl` feature flag param

- [#23600](https://github.com/LedgerHQ/ledger-live/pull/23600) [`2929c6e`](https://github.com/LedgerHQ/ledger-live/commit/2929c6ebe1647bb011d37ebe3f6bd7a920045754) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Add `enabledTokenStandards` (IOU / MPT) to the XRP currency config, empty by default, and bump `@ledgerhq/coin-xrp` to 12.1.0

- [#23416](https://github.com/LedgerHQ/ledger-live/pull/23416) [`d4be6b6`](https://github.com/LedgerHQ/ledger-live/commit/d4be6b620102f2c9f65201935646d32cb365f6ac) Thanks [@ishaba](https://github.com/ishaba)! - Keep a paid Tronify rental in mind after Send is closed: a reopened USDT send no longer offers a second rental while the energy is arriving, tells the user it is on its way, and re-estimates the fee on the amount step once it lands

- [#23638](https://github.com/LedgerHQ/ledger-live/pull/23638) [`4031174`](https://github.com/LedgerHQ/ledger-live/commit/40311746f2633cf914b42999781266e64d54dc7c) Thanks [@dilaouid](https://github.com/dilaouid)! - Enforce manifest origins on the Live App bridges: the Wallet API and Platform API are served on a bridge session bound to the main-frame origin, desktop bridge messages go through main, mobile WebViews answer only the main frame on a manifest origin, manifest domains are enforced on every main-frame load (mobile check on by default), and violations are reported to Datadog

### Patch Changes

- Updated dependencies [[`7e54eae`](https://github.com/LedgerHQ/ledger-live/commit/7e54eaee779cb013a7941bda37a773c33c2f2205), [`4883e43`](https://github.com/LedgerHQ/ledger-live/commit/4883e4316f186755d65348e6648cbc846c62f2bf), [`bf9665d`](https://github.com/LedgerHQ/ledger-live/commit/bf9665df5c5cbd287d740afb4d51933943d99284), [`ed45de0`](https://github.com/LedgerHQ/ledger-live/commit/ed45de0004d46f408dac35d2d7522d7697189288), [`9d96483`](https://github.com/LedgerHQ/ledger-live/commit/9d96483342e32c626abd69143b3cd24a075254bf), [`0c04ab2`](https://github.com/LedgerHQ/ledger-live/commit/0c04ab223b387417a27eebbf64459bcd17ea3dc2), [`a405f99`](https://github.com/LedgerHQ/ledger-live/commit/a405f99bb6bf9b2c88a4f28f7f0ef3339bac63cd), [`e3e0f3a`](https://github.com/LedgerHQ/ledger-live/commit/e3e0f3a5fefbdcf08c8c16d7dc2a3d9f6a6922e0), [`08730f5`](https://github.com/LedgerHQ/ledger-live/commit/08730f575a9ec7d9887f9b64ebf492a6d44ac6e8), [`c43b0f9`](https://github.com/LedgerHQ/ledger-live/commit/c43b0f9ff55c39a5a137e210949419263207d322), [`6b445da`](https://github.com/LedgerHQ/ledger-live/commit/6b445da2f92d7c630424faa7cc31a01bc67db0b9), [`20102d3`](https://github.com/LedgerHQ/ledger-live/commit/20102d3d6f99cdfa8e8e14f9c3b86f960adef64c), [`f51f724`](https://github.com/LedgerHQ/ledger-live/commit/f51f72470d118331f3c3219ed28f13039df309cb), [`fd6a3a3`](https://github.com/LedgerHQ/ledger-live/commit/fd6a3a341b07baa2849a9e79e3a05b73863034b7), [`8e941a7`](https://github.com/LedgerHQ/ledger-live/commit/8e941a7a7bcb09f8e2f18180a797ba11c1dcb1e3), [`845c564`](https://github.com/LedgerHQ/ledger-live/commit/845c56427b3696371d978a71d1e83e5d2bf2922f), [`8654ca0`](https://github.com/LedgerHQ/ledger-live/commit/8654ca0db8912b41e7f6d74df7df3f67a9d5866c), [`e172fe1`](https://github.com/LedgerHQ/ledger-live/commit/e172fe16313acac61b59b7114061bb6c52f0cb67), [`d81d157`](https://github.com/LedgerHQ/ledger-live/commit/d81d157753173799377cf7c2c612394bd50263bf), [`9a1198f`](https://github.com/LedgerHQ/ledger-live/commit/9a1198fd10a67e2893163985b884c7437b4d036a), [`e8f69f6`](https://github.com/LedgerHQ/ledger-live/commit/e8f69f6cecfb104cddd8438ca6fcbd8995f1d488), [`4c672f6`](https://github.com/LedgerHQ/ledger-live/commit/4c672f6a9278217ddaea38038cb8c81af5fa7edc), [`d37d80e`](https://github.com/LedgerHQ/ledger-live/commit/d37d80e128d89fcd80630fd4ef13c66587e3bebe), [`dd056b8`](https://github.com/LedgerHQ/ledger-live/commit/dd056b8a4c6c7c28879cfb1c44139b2479281987), [`3a1e006`](https://github.com/LedgerHQ/ledger-live/commit/3a1e0066dfdeaa93e5b087396ee84100a607098a), [`5e2a324`](https://github.com/LedgerHQ/ledger-live/commit/5e2a3245cc163b6cc13ef5fd2b7faa85c84ca153), [`3d47846`](https://github.com/LedgerHQ/ledger-live/commit/3d47846307baebb9f7dbca75764650bf9c11506c), [`6ba7d71`](https://github.com/LedgerHQ/ledger-live/commit/6ba7d7194f8f8e3c96303537ccdf944ac7bf53a7), [`c4b7982`](https://github.com/LedgerHQ/ledger-live/commit/c4b79825af9468fbb8f5325e77e47536d6b392e9), [`2218721`](https://github.com/LedgerHQ/ledger-live/commit/2218721c96a5d03a8f4078245bf0bbca238a1f8d), [`b44c3d6`](https://github.com/LedgerHQ/ledger-live/commit/b44c3d64ae0be535b0de64e95ce64fd253fab018), [`dbaf56d`](https://github.com/LedgerHQ/ledger-live/commit/dbaf56ddb47f5a43221feba193700cf40f4a46df), [`5b2d7d9`](https://github.com/LedgerHQ/ledger-live/commit/5b2d7d9b4369e56196c8c70889b701df7225da7a), [`8fd06da`](https://github.com/LedgerHQ/ledger-live/commit/8fd06da45f7c15ed712e8e1f15719e3165fa6f94), [`8c888c4`](https://github.com/LedgerHQ/ledger-live/commit/8c888c4cfd699dc24b8e0522818feaac98698eb1), [`2dc1bee`](https://github.com/LedgerHQ/ledger-live/commit/2dc1beef8479530302204a9563b541ba9f7dbc2c), [`5049882`](https://github.com/LedgerHQ/ledger-live/commit/5049882121946e88e75f75536a6b206ea2e38e9f), [`4493b36`](https://github.com/LedgerHQ/ledger-live/commit/4493b361834b7e0cec1e90fd543a53188648ad1e), [`f048349`](https://github.com/LedgerHQ/ledger-live/commit/f048349f45a007200c4416b56c1b4f15194481be), [`5039dc5`](https://github.com/LedgerHQ/ledger-live/commit/5039dc56c41865e705de7eca774a0fd9df8d01cc), [`145efd9`](https://github.com/LedgerHQ/ledger-live/commit/145efd90c1b8deb7fd1d40c7c15bdc5d8183c02c), [`96aabc0`](https://github.com/LedgerHQ/ledger-live/commit/96aabc0b90a7e6996747c36adc3b2eb5df9ce41d), [`48a4694`](https://github.com/LedgerHQ/ledger-live/commit/48a4694811129461a0992a571970138e2b42302a), [`bee4751`](https://github.com/LedgerHQ/ledger-live/commit/bee47518fe1af95de18b32620e9db2d181cc0169), [`d274455`](https://github.com/LedgerHQ/ledger-live/commit/d27445594da9f804cae72abe911624a58d2ee587), [`a7a4679`](https://github.com/LedgerHQ/ledger-live/commit/a7a467956b0be1b087d630705ab5823025c8795d), [`bfaac14`](https://github.com/LedgerHQ/ledger-live/commit/bfaac14201bb12b1f4b6e6a6d68ab4a0daa55b5c), [`29ae68a`](https://github.com/LedgerHQ/ledger-live/commit/29ae68a1ad2429a224106f355f35d1190c0f7359), [`6ea7918`](https://github.com/LedgerHQ/ledger-live/commit/6ea791860eef5b92cc6041ba171e8846e88ef2c8), [`b977dbb`](https://github.com/LedgerHQ/ledger-live/commit/b977dbb2d8d6459295210b491b33af6e8bace1da), [`77bc92f`](https://github.com/LedgerHQ/ledger-live/commit/77bc92ff77d029d570f7b2553919222ee0e598ca), [`16c5384`](https://github.com/LedgerHQ/ledger-live/commit/16c53841ba22597fa03608205c7ccac9c121e844), [`6ea25da`](https://github.com/LedgerHQ/ledger-live/commit/6ea25da0c6060df6aa5056eceacaeedf3d76d2ba), [`112cce0`](https://github.com/LedgerHQ/ledger-live/commit/112cce00f8132dc4a0d7287ee3a321fb436cb77f), [`a389665`](https://github.com/LedgerHQ/ledger-live/commit/a389665d6256a750f539ec54516f667cca1fb011), [`c69f396`](https://github.com/LedgerHQ/ledger-live/commit/c69f39674c9df9046c0dee22c536250c7b8ef05f), [`8ed93a7`](https://github.com/LedgerHQ/ledger-live/commit/8ed93a7ac010ddaf756b868e9c8bd5c8d515e2f4), [`6c6fd48`](https://github.com/LedgerHQ/ledger-live/commit/6c6fd486fbb642bac383e13fdd88ab67397e4bd6), [`750d4bf`](https://github.com/LedgerHQ/ledger-live/commit/750d4bf2f8c70aa114e98222e25770a9a2cdfa70), [`7ea1bad`](https://github.com/LedgerHQ/ledger-live/commit/7ea1bad0c360229ef6caaacbd2ad08b8a4166035), [`0240a0c`](https://github.com/LedgerHQ/ledger-live/commit/0240a0c9a069f895516199995483af5f12993277), [`9c7d59d`](https://github.com/LedgerHQ/ledger-live/commit/9c7d59d0ffcc72ba746bc20e9ff744db9730503b), [`2ff0e49`](https://github.com/LedgerHQ/ledger-live/commit/2ff0e493b0acfcfa8efe841a984bc779b5333aba), [`5ef3bbd`](https://github.com/LedgerHQ/ledger-live/commit/5ef3bbd09001975fcbfc21dfd283495e74c9e70a), [`6ef743c`](https://github.com/LedgerHQ/ledger-live/commit/6ef743cbd058ce0a43363d01b6dadc0f2674a8e3), [`ffd02a9`](https://github.com/LedgerHQ/ledger-live/commit/ffd02a95c452560d606ad30588f15ff5d2182763), [`ee87c0b`](https://github.com/LedgerHQ/ledger-live/commit/ee87c0b14321eddf15dba99423d71aed4bc74986), [`4031174`](https://github.com/LedgerHQ/ledger-live/commit/40311746f2633cf914b42999781266e64d54dc7c)]:
  - @ledgerhq/coin-solana@2.6.0-next.0
  - @domain/entity-currency-fiat@0.5.0-next.0
  - @shared/feature-flags@0.28.0-next.0
  - @ledgerhq/coin-zcash@1.1.0-next.0
  - @ledgerhq/live-signer-zcash@0.12.0-next.0
  - @features/platform-coin-observability@0.2.0-next.0
  - @ledgerhq/transaction-observability@0.6.0-next.0
  - @domain/entity-currency-crypto@0.17.0-next.0
  - @ledgerhq/live-dmk-shared@0.37.0-next.0
  - @domain/api-account-data@0.3.0-next.0
  - @domain/entity-account-descriptor@0.3.0-next.0
  - @ledgerhq/coin-aleo@2.9.0-next.0
  - @ledgerhq/coin-ton@0.40.0-next.0
  - @ledgerhq/coin-aptos@4.6.0-next.0
  - @features/platform-market-countervalues@0.4.0-next.0
  - @features/platform-device-intent@5.3.0-next.0
  - @ledgerhq/coin-cosmos@2.1.0-next.0
  - @ledgerhq/coin-bitcoin@1.1.0-next.0
  - @ledgerhq/wallet-btc@1.1.0-next.0
  - @ledgerhq/hw-app-btc@12.1.0-next.0
  - @domain/api-currency-token@0.7.0-next.0
  - @ledgerhq/coin-canton@1.6.0-next.0
  - @domain/entity-client-identity@0.4.0-next.0
  - @ledgerhq/coin-concordium@1.7.0-next.0
  - @features/platform-feature-flags@0.10.0-next.0
  - @domain/entity-account-data@0.3.0-next.0
  - @domain/entity-account-name@0.3.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.9.0-next.0
  - @ledgerhq/coin-polkadot@9.1.0-next.0
  - @ledgerhq/coin-icon@0.32.0-next.0
  - @ledgerhq/coin-internet_computer@2.0.0-next.0
  - @ledgerhq/coin-kaspa@2.6.0-next.0
  - @ledgerhq/coin-algorand@2.4.0-next.0
  - @ledgerhq/coin-cardano@2.1.0-next.0
  - @ledgerhq/coin-casper@3.7.0-next.0
  - @ledgerhq/coin-celo@3.7.0-next.0
  - @ledgerhq/coin-filecoin@2.6.0-next.0
  - @ledgerhq/coin-hedera@3.1.0-next.0
  - @ledgerhq/coin-mina@1.25.0-next.0
  - @ledgerhq/coin-multiversx@1.5.0-next.0
  - @ledgerhq/coin-near@1.5.0-next.0
  - @ledgerhq/coin-stacks@0.35.0-next.0
  - @ledgerhq/coin-sui@2.2.0-next.0
  - @ledgerhq/coin-tron@10.2.0-next.0
  - @ledgerhq/coin-vechain@4.4.0-next.0
  - @ledgerhq/hw-app-algorand@6.37.0-next.0
  - @ledgerhq/hw-app-aptos@6.40.0-next.0
  - @ledgerhq/hw-app-eth@7.12.0-next.0
  - @ledgerhq/hw-app-exchange@0.31.0-next.0
  - @ledgerhq/hw-app-hedera@1.8.0-next.0
  - @ledgerhq/hw-app-icon@1.9.0-next.0
  - @ledgerhq/hw-app-kaspa@1.8.0-next.0
  - @ledgerhq/hw-app-multiversx@6.33.0-next.0
  - @ledgerhq/hw-app-near@6.38.0-next.0
  - @ledgerhq/hw-app-polkadot@6.40.0-next.0
  - @ledgerhq/hw-app-str@7.9.0-next.0
  - @ledgerhq/hw-app-sui@1.13.0-next.0
  - @ledgerhq/hw-app-tezos@6.38.0-next.0
  - @ledgerhq/hw-app-trx@6.38.0-next.0
  - @ledgerhq/hw-app-vet@0.15.0-next.0
  - @ledgerhq/hw-app-xrp@6.39.0-next.0
  - @ledgerhq/live-signer-solana@0.22.3-next.0
  - @domain/api-market-countervalues@0.2.2-next.0
  - @domain/entity-currency@0.4.8-next.0
  - @domain/entity-market-countervalues@0.4.1-next.0
  - @features/platform-feature-flags-firebase@0.1.2-next.0
  - @domain/api-aggregated-assets@0.6.2-next.0
  - @domain/entity-account-balance@0.2.1-next.0
  - @domain/entity-currency-token@0.5.7-next.0
  - @features/platform-account-analytics@0.2.0
  - @ledgerhq/asset-aggregation@0.18.2-next.0
  - @ledgerhq/live-signer-celo@1.2.12-next.0
  - @ledgerhq/live-signer-evm@0.24.3-next.0
  - @shared/env@0.11.0
  - @ledgerhq/live-signer-tron@0.2.3-next.0
  - @ledgerhq/live-signer-aleo@0.19.16-next.0
  - @ledgerhq/live-signer-cosmos@0.6.3-next.0
  - @domain/api-swap-quotes@0.3.2-next.0
  - @ledgerhq/live-signer-canton@0.9.25-next.0
  - @ledgerhq/live-signer-concordium@0.9.4-next.0
  - @ledgerhq/live-signer-icp@0.1.11-next.0
  - @ledgerhq/live-signer-polkadot@0.1.3-next.0
  - @ledgerhq/live-signer-xrp@0.2.2-next.0
  - @ledgerhq/device-core@0.11.21-next.0
  - @features/platform-aggregated-assets@0.5.8-next.0

## 38.4.0

### Minor Changes

- [#23344](https://github.com/LedgerHQ/ledger-live/pull/23344) [`e15a91d`](https://github.com/LedgerHQ/ledger-live/commit/e15a91dca7d490f5c8d6d0dfdc8152a6f6e7ef0b) Thanks [@cted-ledger](https://github.com/cted-ledger)! - give zcash testnet accounts the zcash screens and shielded sync, by recognising every zcash currency rather than the mainnet id only

- [#23332](https://github.com/LedgerHQ/ledger-live/pull/23332) [`d6ab47c`](https://github.com/LedgerHQ/ledger-live/commit/d6ab47c28339866ad88ef0deba75d314c2f6c4f0) Thanks [@henri-ly](https://github.com/henri-ly)! - feat(xrp): add the ripple_devnet currency (XRPL devnet)

- [#23278](https://github.com/LedgerHQ/ledger-live/pull/23278) [`393a02a`](https://github.com/LedgerHQ/ledger-live/commit/393a02a42be9f0410b75c0c34203915bcde27e43) Thanks [@henri-ly](https://github.com/henri-ly)! - feat(xrp): add the ripple_testnet currency (XRPL altnet); send memo labels of testnets resolve to their mainnet

- [#23215](https://github.com/LedgerHQ/ledger-live/pull/23215) [`d1fb4fd`](https://github.com/LedgerHQ/ledger-live/commit/d1fb4fd3b5cdd83eaf479f9d09dca154099c90b4) Thanks [@cted-ledger](https://github.com/cted-ledger)! - serve every zcash account from coin-zcash, transparent-only when shielded zcash is off, and move the zcash currency configs to the zcash family

- [#23215](https://github.com/LedgerHQ/ledger-live/pull/23215) [`a6e1e6a`](https://github.com/LedgerHQ/ledger-live/commit/a6e1e6a6049d43228224aba5df18ca3eab873b62) Thanks [@cted-ledger](https://github.com/cted-ledger)! - turn a live app's transaction on a zcash account into a zcash send through a zcash wallet api adapter

- [#23306](https://github.com/LedgerHQ/ledger-live/pull/23306) [`b641da8`](https://github.com/LedgerHQ/ledger-live/commit/b641da86d889e6e81278c5af70b16da216a19f92) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Coin modules declare their AccountDescriptor type; the legacy account converters read it instead of the bitcoin family, so Cardano, Kaspa and Zcash map to utxo descriptors

- [#23283](https://github.com/LedgerHQ/ledger-live/pull/23283) [`d2b8471`](https://github.com/LedgerHQ/ledger-live/commit/d2b84711b137f42930f006f7a079fc104c92633d) Thanks [@cted-ledger](https://github.com/cted-ledger)! - stop listing the zcash currencies in the bitcoin coin module loader and build the bitcoin signer without a chain adapter

- [#23324](https://github.com/LedgerHQ/ledger-live/pull/23324) [`05e5823`](https://github.com/LedgerHQ/ledger-live/commit/05e58230918a0d271774998c7bede69c88e6a186) Thanks [@cted-ledger](https://github.com/cted-ledger)! - The Zcash mock bridge builds `getTransactionStatus`, `prepareTransaction` and `estimateMaxSpendable` with the currency's coin config, like the real bridge.

- [#23379](https://github.com/LedgerHQ/ledger-live/pull/23379) [`bef895f`](https://github.com/LedgerHQ/ledger-live/commit/bef895fca53783545c564e6842b9069f936becf5) Thanks [@cted-ledger](https://github.com/cted-ledger)! - zcash: with the shielded engine on, live apps are offered at most what one transaction can spend (the largest transparent UTXOs up to the device input limit), so a swap no longer fails with "too large to send in one transaction"

- [#23559](https://github.com/LedgerHQ/ledger-live/pull/23559) [`ead8b59`](https://github.com/LedgerHQ/ledger-live/commit/ead8b59eafe301b82efbe38bf6d2379b6e77b233) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Expose the recoverV2 feature flag to Mixpanel on mobile and desktop.

- [#23422](https://github.com/LedgerHQ/ledger-live/pull/23422) [`b97096c`](https://github.com/LedgerHQ/ledger-live/commit/b97096ca3622ffa57e76423081b8855300f7a70d) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - End the Asset Detail chart on the header price so the line matches the live spot

- [#23442](https://github.com/LedgerHQ/ledger-live/pull/23442) [`b79ccab`](https://github.com/LedgerHQ/ledger-live/commit/b79ccab839cc7916ff3ecd910479904f87a6e59d) Thanks [@semeano](https://github.com/semeano)! - Register the alpen_testnet EVM currency behind the currencyAlpenTestnet feature flag, disabled by default

- [#23046](https://github.com/LedgerHQ/ledger-live/pull/23046) [`7b3040a`](https://github.com/LedgerHQ/ledger-live/commit/7b3040ad872c183fd2beb81a965037b5310ab87a) Thanks [@qperrot](https://github.com/qperrot)! - feat(coin-bitcoin): add a stateless single-address alpaca api (balance, history, blocks, fees, crafting, combine, intent validation, broadcast) for every bitcoin-family currency, with the hw-app-btc createPaymentTransaction parameters of what it crafts; each currency's transaction and address format comes from its coin config; dash and qtum get an explicit explorerId. `validateAddress` moves to `@ledgerhq/coin-bitcoin/logic/validateAddress` (the root `@ledgerhq/coin-bitcoin/validateAddress` subpath is removed)

- [#23214](https://github.com/LedgerHQ/ledger-live/pull/23214) [`b599cb2`](https://github.com/LedgerHQ/ledger-live/commit/b599cb25afbc5ce2dbdcd0cc1b6126a49bba8068) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Migrate bitcoinjs-lib to v7 (Uint8Array, bigint amounts) and varuint-bitcoin to v2

- [#23495](https://github.com/LedgerHQ/ledger-live/pull/23495) [`3c062fc`](https://github.com/LedgerHQ/ledger-live/commit/3c062fccd90c705eee581800c0dd416f1b61ebe2) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - feat(analytics): add the `blockchainWithFunds` user property (blockchain names, e.g. Arbitrum) next to `accountsWithFunds`, which reports the native ticker (ETH for L2s)

- [#21914](https://github.com/LedgerHQ/ledger-live/pull/21914) [`a5a6fa6`](https://github.com/LedgerHQ/ledger-live/commit/a5a6fa6267d17dcb3843358cd5b1f3b42e91ea4c) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Bound the synchronised operation history for generic-coin-framework accounts, fix a truncation bug where an empty-but-continuable page silently ended the sync early, and stop a sync from scratch from merging back stored operations the walk no longer returns.

- [#23249](https://github.com/LedgerHQ/ledger-live/pull/23249) [`80f99a8`](https://github.com/LedgerHQ/ledger-live/commit/80f99a819b13d3ec2bd39d896de46e0a433b9954) Thanks [@dilaouid](https://github.com/dilaouid)! - Add generic account sequence synchronization and persist it on the account

- [#23631](https://github.com/LedgerHQ/ledger-live/pull/23631) [`19e5335`](https://github.com/LedgerHQ/ledger-live/commit/19e5335bcb3d6017d6c875fc1fd66704f0f5a8be) Thanks [@henri-ly](https://github.com/henri-ly)! - Restore name and unit on the transaction intent asset so XRP and Stellar amount errors show the currency unit instead of "Unknown unit"

- [#23327](https://github.com/LedgerHQ/ledger-live/pull/23327) [`87b812e`](https://github.com/LedgerHQ/ledger-live/commit/87b812eb975719f788abb4fd315b6229259e8d6e) Thanks [@lysyi3m](https://github.com/lysyi3m)! - fix(cardano): map generic-bridge token references to CAL's split policyId/assetName shape

- [#23386](https://github.com/LedgerHQ/ledger-live/pull/23386) [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574) Thanks [@dilaouid](https://github.com/dilaouid)! - Remove the Zenrock and Quicksilver integrations, including their chain adapters, currency definitions, feature flags and LCD endpoints

- [#23418](https://github.com/LedgerHQ/ledger-live/pull/23418) [`2621f1e`](https://github.com/LedgerHQ/ledger-live/commit/2621f1ebe6c1a8f8cff0a797740771ae5fc084be) Thanks [@ysitbon](https://github.com/ysitbon)! - Stop re-rendering every amount on a countervalues load that changes no rate

  A load now keeps a pair's rate Map and cache entry when every fetched value equals the stored one, and
  keeps the whole cache object when no pair changed. The conversions read the cache alone, through
  `useCountervaluesCache`, so a load that only stamps the fetch status no longer re-renders them. The
  conversions and the persisted export are the same as before.

- [#23211](https://github.com/LedgerHQ/ledger-live/pull/23211) [`bcf98ff`](https://github.com/LedgerHQ/ledger-live/commit/bcf98ffbb1d119fba86c53e4c005abdad251b62a) Thanks [@ysitbon](https://github.com/ysitbon)! - Split the countervalues Redux slice by owner. The rates now have their own slice in `@domain/entity-market-countervalues` (`countervaluesRatesSlice`, with `setCountervaluesState` and `wipeCountervalues`), stored with a shallow freeze so a load never pays for a deep freeze of every rate. `@features/platform-market-countervalues` keeps the loop's state in `countervaluesSyncSlice` (`load`, `error`, `isPolling`; `load` is one of `idle`, `requested`, `loading`, `loadingThenRequested`, replacing the former `pending` and `triggerLoad` flags) and mounts both under the same `countervalues` store key through `countervaluesReducer`, typed `CountervaluesStoreState`, which replaces `CountervaluesState`. The store reads `countervalues.rates` and `countervalues.sync` instead of `countervalues.countervalues.state` and `countervalues.polling`; persistence and the saved data are unchanged. Each slice now declares its own actions, so the `COUNTERVALUES_*` type strings are gone: `setCountervaluesState` and `wipeCountervalues` keep their names, typed `countervaluesRates/set` and `countervaluesRates/wipe`, and the loop's setters `setCountervaluesPollingTriggerLoad`, `setCountervaluesStatePending`, `setCountervaluesStateError` and `setCountervaluesPollingIsPolling` become the events `countervaluesLoadRequested`, `countervaluesLoadStarted`, `countervaluesLoadSucceeded`, `countervaluesLoadFailed` and `countervaluesPollingSet`, typed `countervaluesSync/...`. A load start and a load failure now dispatch one action each instead of two. The sync selectors are the slice's own `selectors`, and `countervaluesSyncTriggerLoadSelector` is gone. `useCountervaluesPolling` now returns only the `poll`, `start`, `stop` and `wipe` commands and no longer re-renders its callers on every load; `pending` and `error` come from the new `useCountervaluesLoadStatus`, which live-common's `useSyncSources` now reads.

- [#23331](https://github.com/LedgerHQ/ledger-live/pull/23331) [`75498cf`](https://github.com/LedgerHQ/ledger-live/commit/75498cf55065bccf17d09b780866ae031c01701a) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - remove velas_evm and its feature flag

- [#23353](https://github.com/LedgerHQ/ledger-live/pull/23353) [`48d5c85`](https://github.com/LedgerHQ/ledger-live/commit/48d5c8543e70d0e4ee2fa30ea12590439f01f510) Thanks [@LL782](https://github.com/LL782)! - Remove the legacy `ofacGeoBlockApi` after Desktop and Mobile use `@features/flow-app-availability`

- [#23376](https://github.com/LedgerHQ/ledger-live/pull/23376) [`4ee8f78`](https://github.com/LedgerHQ/ledger-live/commit/4ee8f78997ca79d841bf0ba5642a4f2229cdbc46) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - Add a balance type sync step to the new send flow, used by Aleo to refresh private records after the pool pick

- [#23423](https://github.com/LedgerHQ/ledger-live/pull/23423) [`c61cbe8`](https://github.com/LedgerHQ/ledger-live/commit/c61cbe8c4c383ff720812398f58907b5b6c3e982) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - fix(portfolio): show the Market 24h variation on assets whose balance did not change over the day (LIVE-39259)

- [#23459](https://github.com/LedgerHQ/ledger-live/pull/23459) [`2f9b7e9`](https://github.com/LedgerHQ/ledger-live/commit/2f9b7e97b8afee033e5fa194c5ca40a1f82a9b89) Thanks [@gre-ledger](https://github.com/gre-ledger)! - feat(account-data): full sync source on AccountBridge, serving no kind yet

- [#23303](https://github.com/LedgerHQ/ledger-live/pull/23303) [`c9c482e`](https://github.com/LedgerHQ/ledger-live/commit/c9c482e9d4ec30bb05e60d00548c471f2d124163) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix(hedera): exclude a fee paid by another account from native operation values

- [#21914](https://github.com/LedgerHQ/ledger-live/pull/21914) [`e66d21e`](https://github.com/LedgerHQ/ledger-live/commit/e66d21ea7ccb706d718703b69d2133ede3294c1a) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Index the per-hash and per-token operation lookups used when assembling an account, replacing repeated full scans.

- [#23315](https://github.com/LedgerHQ/ledger-live/pull/23315) [`68cebc0`](https://github.com/LedgerHQ/ledger-live/commit/68cebc06f2ec8f4cc38ac1caca779317a8fe0711) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fetch LargeMover chart and market rows through RTK Query by ledger id, and drop the unused CoinGecko mapping client.

- [#23058](https://github.com/LedgerHQ/ledger-live/pull/23058) [`214f7f1`](https://github.com/LedgerHQ/ledger-live/commit/214f7f183ea42a7b37663251db944ad61a3ad799) Thanks [@ishaba](https://github.com/ishaba)! - feat(tron): track the sponsored send funnel in Segment

- [#23247](https://github.com/LedgerHQ/ledger-live/pull/23247) [`c18097b`](https://github.com/LedgerHQ/ledger-live/commit/c18097b2ae6fb06a530dc8a29fbfaac99ad7e942) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Load the market list with an RTK infinite query instead of React Query.

- [#23239](https://github.com/LedgerHQ/ledger-live/pull/23239) [`ade02b9`](https://github.com/LedgerHQ/ledger-live/commit/ade02b942ed12320573f0dab67f0a286b4c47533) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - Aleo new send flow descriptor and extended self transfer flow

- [#23108](https://github.com/LedgerHQ/ledger-live/pull/23108) [`bcea51b`](https://github.com/LedgerHQ/ledger-live/commit/bcea51b0b2c9ef09b9e068f97ed3c67a0e45e188) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump `@noble/curves` to 2.4.0 (ESM-only), use the `.js` subpaths and pass `prehash: false` where a digest is signed or verified. CommonJS consumers of `@ledgerhq/hw-app-btc` and `@ledgerhq/wallet-btc` now need Node >= 20.19 (synchronous `require(esm)`) or an ESM-capable bundler.

- [#23276](https://github.com/LedgerHQ/ledger-live/pull/23276) [`8daaded`](https://github.com/LedgerHQ/ledger-live/commit/8daaded1316cb30dc1b3a8634301acc176ca97af) Thanks [@qperrot](https://github.com/qperrot)! - fix(coin-hedera): stop resolving the currency with `getCryptoCurrencyById` / `findCryptoCurrencyById`

  The module no longer needs the host currencies resolver. Fee estimation and token-association
  validation use the input `currencyId` instead of looking the currency up: the countervalues request
  sends it as `froms`, and the rate cache is keyed by it instead of the ticker. The `InvalidAddress`
  message of `safeParseAccountId` takes the name of the resolved config. The API's `validateAddress` parses with the context config instead of a currency id.

  Breaking: `getCurrencyToUSDRate` takes a currency id instead of a `Currency`, and `getTokenFromAsset`
  takes `(currencyId, asset)` instead of `(currency, asset)`.

- [#23295](https://github.com/LedgerHQ/ledger-live/pull/23295) [`98c994b`](https://github.com/LedgerHQ/ledger-live/commit/98c994bc1f46a03366096531afac2471f07f397b) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(solana): refresh the blockhash after the device review to avoid "Blockhash not found"

- [#23384](https://github.com/LedgerHQ/ledger-live/pull/23384) [`9887c8f`](https://github.com/LedgerHQ/ledger-live/commit/9887c8ffdb22ba87ccce7e8f1780e91ac78af640) Thanks [@semeano](https://github.com/semeano)! - feat: add alpen testnet evm currency config

- [#23461](https://github.com/LedgerHQ/ledger-live/pull/23461) [`df2068c`](https://github.com/LedgerHQ/ledger-live/commit/df2068c73926db98e3d0073abf3606db0df878eb) Thanks [@qperrot](https://github.com/qperrot)! - Drop name and unit from intent and token assets built by the generic coin framework and family bridges

- [#22952](https://github.com/LedgerHQ/ledger-live/pull/22952) [`96f2f30`](https://github.com/LedgerHQ/ledger-live/commit/96f2f30c368cf471698d4b48b18ac33a57c7b19a) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Disable A4 register-only mode by default in the `config_generic_a4` live config

- [#23229](https://github.com/LedgerHQ/ledger-live/pull/23229) [`2cd35c5`](https://github.com/LedgerHQ/ledger-live/commit/2cd35c5e21a9dfe58ca58349280f33266143ca51) Thanks [@qperrot](https://github.com/qperrot)! - fix(coin-cosmos): stop resolving the currency with `getCryptoCurrencyById`

  The module no longer needs the host currencies resolver. The on-chain base denom (e.g. `uatom`),
  formerly read from the currency's `units[1].code`, comes from a new required `denom` field of the
  Cosmos coin config, served in every `config_currency_<id>`. `createApi(currencyId)` uses its
  `currencyId` directly where the id is needed. The bridge passes `account.currency.units[1].code`,
  `preload` reuses the currency it receives, and `getTransactionStatus` drops its registry lookup by
  name while keeping the same prefix check. `CosmosCoinConfig` is now typed as
  `CurrencyConfig & { denom: string }` instead of reusing the live-config map type.

  Breaking: `CosmosAPI.getCurrency()` is removed. `CosmosAPI.getAccountInfo`, `getAllBalances`,
  `getDelegations`, `getStakingPositions` and `getRedelegationsWithQueued` take a denom string instead
  of a `CryptoCurrency`. `getBalance`, `getStakes`, `listOperations` and `craftTransaction` take the
  coin config as first parameter; `estimateFees` takes `(config, currencyId, intent)`; and
  `getRedelegations` takes `(currencyId, denom, address)`.

- [#23503](https://github.com/LedgerHQ/ledger-live/pull/23503) [`bd6dbc5`](https://github.com/LedgerHQ/ledger-live/commit/bd6dbc515c1f64214be60c76498452ff9bd2e119) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - Allow Aleo token accounts to self-transfer between their public and private balances in the new send flow

- [#21914](https://github.com/LedgerHQ/ledger-live/pull/21914) [`fb0ac6a`](https://github.com/LedgerHQ/ledger-live/commit/fb0ac6ab7d2e2b8c41c7b012b563c1286313ca70) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Resume EVM token discovery from the sync watermark instead of rewalking the whole history on every sync.

- [#23190](https://github.com/LedgerHQ/ledger-live/pull/23190) [`696357f`](https://github.com/LedgerHQ/ledger-live/commit/696357f754751853758d67c88bf34df9302b9b97) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(coin-solana): partition the native balance between the system account and the stake accounts, summed by the generic adapter through `partitionsNativeBalance` and the family's `getHeldNativeAmount`, so delegated SOL is counted once

- [#23319](https://github.com/LedgerHQ/ledger-live/pull/23319) [`0d5c35d`](https://github.com/LedgerHQ/ledger-live/commit/0d5c35d9f29e17c3ad7bcb7632dcaea83d47e7d3) Thanks [@qperrot](https://github.com/qperrot)! - Remove the unused `parseAPIValue` export of Canton, a boilerplate leftover that read the units of `ripple`

- [#23003](https://github.com/LedgerHQ/ledger-live/pull/23003) [`57b4652`](https://github.com/LedgerHQ/ledger-live/commit/57b4652a1d0ae95af20419210139039642cedb9c) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Adapt to `@ledgerhq/coin-evm` 15

- [#23373](https://github.com/LedgerHQ/ledger-live/pull/23373) [`06b6724`](https://github.com/LedgerHQ/ledger-live/commit/06b672492a5c6a60c7ad181710a2411744c43d3f) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Drop the unused TanStack Query dependency from live-common.

- [#23372](https://github.com/LedgerHQ/ledger-live/pull/23372) [`4905dd1`](https://github.com/LedgerHQ/ledger-live/commit/4905dd1fc2625a07d2aa4e73461a12875466bbd6) Thanks [@CremaFR](https://github.com/CremaFR)! - Return 0 from account.getMaxSpendable when pending operations already commit the whole token balance

- [#23261](https://github.com/LedgerHQ/ledger-live/pull/23261) [`02b383b`](https://github.com/LedgerHQ/ledger-live/commit/02b383b7d11352d121556bb6f0a076c2b960b9eb) Thanks [@alexstapenka-ledger](https://github.com/alexstapenka-ledger)! - Add a withdraw icon to the earn action confirmation dialog, a `custom.dialog.menu` action menu dialog on desktop for the Earn "Earn more" / "Withdraw all" choice, and the `earnWithdrawV2` feature flag that gates the Earn full withdraw flow

### Patch Changes

- Updated dependencies [[`a86963c`](https://github.com/LedgerHQ/ledger-live/commit/a86963c2401573e3d5fef6b9623bae1e23126178), [`c9beaff`](https://github.com/LedgerHQ/ledger-live/commit/c9beaff3b51d3a50f310be73a830bf6e944e61fa), [`4831311`](https://github.com/LedgerHQ/ledger-live/commit/4831311fd859631a9248441e469f52c18fb42c52), [`9365d3a`](https://github.com/LedgerHQ/ledger-live/commit/9365d3ad499ac5c80d445e7816c30adbfe05ffd8), [`d6ab47c`](https://github.com/LedgerHQ/ledger-live/commit/d6ab47c28339866ad88ef0deba75d314c2f6c4f0), [`393a02a`](https://github.com/LedgerHQ/ledger-live/commit/393a02a42be9f0410b75c0c34203915bcde27e43), [`ef80ee4`](https://github.com/LedgerHQ/ledger-live/commit/ef80ee46eb564e25090ce08d8459212739158117), [`ee508db`](https://github.com/LedgerHQ/ledger-live/commit/ee508db35d572d43e03cf58e811177cc3b2389a9), [`d2b8471`](https://github.com/LedgerHQ/ledger-live/commit/d2b84711b137f42930f006f7a079fc104c92633d), [`6b23210`](https://github.com/LedgerHQ/ledger-live/commit/6b232105c11b8b8b86fcb6a715ef19a0b3453b74), [`6582ee6`](https://github.com/LedgerHQ/ledger-live/commit/6582ee63c343dd6f64a31068fddd038af4eb9bd2), [`e505c53`](https://github.com/LedgerHQ/ledger-live/commit/e505c537cafd5f44999f201cfe0a773a90cf5671), [`ead8b59`](https://github.com/LedgerHQ/ledger-live/commit/ead8b59eafe301b82efbe38bf6d2379b6e77b233), [`beea4cd`](https://github.com/LedgerHQ/ledger-live/commit/beea4cd9cccfbfa99a03bfb878f83353ef89d41c), [`3d5d5c7`](https://github.com/LedgerHQ/ledger-live/commit/3d5d5c7582f6e93c4bd0eeae217eedc068409846), [`b79ccab`](https://github.com/LedgerHQ/ledger-live/commit/b79ccab839cc7916ff3ecd910479904f87a6e59d), [`7b3040a`](https://github.com/LedgerHQ/ledger-live/commit/7b3040ad872c183fd2beb81a965037b5310ab87a), [`b599cb2`](https://github.com/LedgerHQ/ledger-live/commit/b599cb25afbc5ce2dbdcd0cc1b6126a49bba8068), [`3c062fc`](https://github.com/LedgerHQ/ledger-live/commit/3c062fccd90c705eee581800c0dd416f1b61ebe2), [`d7017e3`](https://github.com/LedgerHQ/ledger-live/commit/d7017e3ac831a9078845b2deea86a2f852522ed9), [`4282168`](https://github.com/LedgerHQ/ledger-live/commit/42821688658007954e94c223b10522706b8e56aa), [`3527dbc`](https://github.com/LedgerHQ/ledger-live/commit/3527dbc69a05745b272741566b20634d79462cb8), [`80f99a8`](https://github.com/LedgerHQ/ledger-live/commit/80f99a819b13d3ec2bd39d896de46e0a433b9954), [`7da1ea9`](https://github.com/LedgerHQ/ledger-live/commit/7da1ea9534a1bdde063e31545363a27f0fdf5abb), [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574), [`2621f1e`](https://github.com/LedgerHQ/ledger-live/commit/2621f1ebe6c1a8f8cff0a797740771ae5fc084be), [`3ad1a61`](https://github.com/LedgerHQ/ledger-live/commit/3ad1a619eb1244d9adb8e4e67c250a2687716175), [`bcf98ff`](https://github.com/LedgerHQ/ledger-live/commit/bcf98ffbb1d119fba86c53e4c005abdad251b62a), [`75498cf`](https://github.com/LedgerHQ/ledger-live/commit/75498cf55065bccf17d09b780866ae031c01701a), [`ad58765`](https://github.com/LedgerHQ/ledger-live/commit/ad58765b6151457022f8587d6ddcad3325ce96ac), [`ff14496`](https://github.com/LedgerHQ/ledger-live/commit/ff14496257201991b52f0dd140e351fca3e84d4d), [`e66d21e`](https://github.com/LedgerHQ/ledger-live/commit/e66d21ea7ccb706d718703b69d2133ede3294c1a), [`68cebc0`](https://github.com/LedgerHQ/ledger-live/commit/68cebc06f2ec8f4cc38ac1caca779317a8fe0711), [`ed10647`](https://github.com/LedgerHQ/ledger-live/commit/ed10647dedd2642ac5316f89595b618180097e33), [`bc0aa4f`](https://github.com/LedgerHQ/ledger-live/commit/bc0aa4ff32efa315ab4dfaf756bb562db4400df3), [`bcea51b`](https://github.com/LedgerHQ/ledger-live/commit/bcea51b0b2c9ef09b9e068f97ed3c67a0e45e188), [`c1cbfec`](https://github.com/LedgerHQ/ledger-live/commit/c1cbfececf814d382ad6319806b966cb341eb1fd), [`8daaded`](https://github.com/LedgerHQ/ledger-live/commit/8daaded1316cb30dc1b3a8634301acc176ca97af), [`8ebcf5c`](https://github.com/LedgerHQ/ledger-live/commit/8ebcf5c5507558750fb9f7980e9de4f0f5a637ce), [`98c994b`](https://github.com/LedgerHQ/ledger-live/commit/98c994bc1f46a03366096531afac2471f07f397b), [`6639142`](https://github.com/LedgerHQ/ledger-live/commit/6639142cc619d0758ba7873dafbc3e32944f250f), [`2cd35c5`](https://github.com/LedgerHQ/ledger-live/commit/2cd35c5e21a9dfe58ca58349280f33266143ca51), [`37a49df`](https://github.com/LedgerHQ/ledger-live/commit/37a49df18649912157d8f269c3b4153d54b7817e), [`0ace271`](https://github.com/LedgerHQ/ledger-live/commit/0ace2718ac29bc9926858af41424177ff3363d47), [`ca063c4`](https://github.com/LedgerHQ/ledger-live/commit/ca063c4cfad79f12118c5af5bc0ef323857f90bd), [`696357f`](https://github.com/LedgerHQ/ledger-live/commit/696357f754751853758d67c88bf34df9302b9b97), [`5aa4154`](https://github.com/LedgerHQ/ledger-live/commit/5aa41540bc68cb4fedfe45d4cc8d0105ba36cb66), [`dbed44c`](https://github.com/LedgerHQ/ledger-live/commit/dbed44ca28d6bdb0291bb66247cce0a524f6c805), [`fe74104`](https://github.com/LedgerHQ/ledger-live/commit/fe74104174a41357be9cb911d9b762e4360cbf46), [`a8d48a9`](https://github.com/LedgerHQ/ledger-live/commit/a8d48a97f1bae0c2adad5d2790c9cc8ab5d7c2b0), [`ba07b05`](https://github.com/LedgerHQ/ledger-live/commit/ba07b0562bf91bb0e5468d4806bc5d7781785248), [`0d5c35d`](https://github.com/LedgerHQ/ledger-live/commit/0d5c35d9f29e17c3ad7bcb7632dcaea83d47e7d3), [`57b4652`](https://github.com/LedgerHQ/ledger-live/commit/57b4652a1d0ae95af20419210139039642cedb9c), [`b88647d`](https://github.com/LedgerHQ/ledger-live/commit/b88647dca4c613663bca4ba0d62c2296b95ac083), [`02b383b`](https://github.com/LedgerHQ/ledger-live/commit/02b383b7d11352d121556bb6f0a076c2b960b9eb)]:
  - @shared/feature-flags@0.27.0
  - @ledgerhq/coin-concordium@1.6.0
  - @ledgerhq/coin-zcash@1.0.0
  - @ledgerhq/live-signer-zcash@0.11.0
  - @domain/entity-currency-crypto@0.16.0
  - @shared/env@0.11.0
  - @ledgerhq/coin-bitcoin@1.0.0
  - @domain/entity-account-data@0.2.0
  - @domain/api-account-data@0.2.0
  - @ledgerhq/coin-aleo@2.8.0
  - @ledgerhq/hw-app-btc@12.0.0
  - @ledgerhq/wallet-btc@1.0.0
  - @features/platform-account-analytics@0.2.0
  - @ledgerhq/coin-hedera@3.0.0
  - @ledgerhq/coin-aptos@4.5.0
  - @ledgerhq/coin-stacks@0.34.0
  - @ledgerhq/ledger-wallet-framework@3.8.0
  - @ledgerhq/coin-cosmos@2.0.0
  - @domain/entity-market-countervalues@0.4.0
  - @features/platform-market-countervalues@0.3.0
  - @ledgerhq/coin-filecoin@2.5.0
  - @ledgerhq/hw-app-exchange@0.30.0
  - @ledgerhq/coin-polkadot@9.0.0
  - @ledgerhq/coin-solana@2.5.0
  - @ledgerhq/coin-casper@3.6.0
  - @ledgerhq/live-dmk-shared@0.36.0
  - @ledgerhq/speculos-transport@0.13.0
  - @ledgerhq/coin-canton@1.5.0
  - @ledgerhq/coin-celo@3.6.0
  - @features/platform-feature-flags@0.9.1
  - @features/platform-feature-flags-firebase@0.1.1
  - @ledgerhq/live-signer-concordium@0.9.3
  - @domain/api-aggregated-assets@0.6.1
  - @domain/api-currency-token@0.6.5
  - @domain/api-market-countervalues@0.2.1
  - @domain/entity-account-descriptor@0.2.1
  - @domain/entity-currency@0.4.7
  - @domain/entity-currency-token@0.5.6
  - @ledgerhq/asset-aggregation@0.18.1
  - @ledgerhq/coin-cardano@2.0.1
  - @features/platform-aggregated-assets@0.5.7
  - @features/platform-env@0.4.3
  - @ledgerhq/ledger-cal-service@1.19.10
  - @ledgerhq/ledger-trust-service@0.8.21
  - @ledgerhq/live-signer-solana@0.22.2
  - @ledgerhq/transaction-observability@0.5.1
  - @domain/entity-account-name@0.2.3
  - @ledgerhq/live-signer-aleo@0.19.15
  - @ledgerhq/coin-algorand@2.3.2
  - @ledgerhq/coin-icon@0.31.2
  - @ledgerhq/coin-internet_computer@1.32.2
  - @ledgerhq/coin-kaspa@2.5.1
  - @ledgerhq/coin-mina@1.24.3
  - @ledgerhq/coin-multiversx@1.4.1
  - @ledgerhq/coin-near@1.4.1
  - @ledgerhq/coin-sui@2.1.1
  - @ledgerhq/coin-ton@0.39.2
  - @ledgerhq/coin-vechain@4.3.3
  - @ledgerhq/live-signer-evm@0.24.2
  - @ledgerhq/live-signer-icp@0.1.10
  - @ledgerhq/device-core@0.11.20
  - @ledgerhq/hw-app-eth@7.11.1
  - @ledgerhq/live-signer-canton@0.9.24
  - @ledgerhq/live-signer-celo@1.2.11
  - @ledgerhq/live-signer-cosmos@0.6.2
  - @ledgerhq/live-signer-polkadot@0.1.2
  - @ledgerhq/live-signer-tron@0.2.2
  - @ledgerhq/coin-tron@10.1.0
  - @ledgerhq/hw-app-sui@1.12.0
  - @domain/api-swap-quotes@0.3.1

## 38.4.0-next.2

### Patch Changes

- Updated dependencies [[`e505c53`](https://github.com/LedgerHQ/ledger-live/commit/e505c537cafd5f44999f201cfe0a773a90cf5671), [`fe74104`](https://github.com/LedgerHQ/ledger-live/commit/fe74104174a41357be9cb911d9b762e4360cbf46)]:
  - @ledgerhq/live-signer-zcash@0.11.0-next.1
  - @ledgerhq/coin-solana@2.5.0-next.1
  - @ledgerhq/coin-zcash@1.0.0-next.1
  - @ledgerhq/live-signer-solana@0.22.2-next.1

## 38.4.0-next.1

### Minor Changes

- [#23631](https://github.com/LedgerHQ/ledger-live/pull/23631) [`19e5335`](https://github.com/LedgerHQ/ledger-live/commit/19e5335bcb3d6017d6c875fc1fd66704f0f5a8be) Thanks [@henri-ly](https://github.com/henri-ly)! - Restore name and unit on the transaction intent asset so XRP and Stellar amount errors show the currency unit instead of "Unknown unit"

## 38.4.0-next.0

### Minor Changes

- [#23344](https://github.com/LedgerHQ/ledger-live/pull/23344) [`e15a91d`](https://github.com/LedgerHQ/ledger-live/commit/e15a91dca7d490f5c8d6d0dfdc8152a6f6e7ef0b) Thanks [@cted-ledger](https://github.com/cted-ledger)! - give zcash testnet accounts the zcash screens and shielded sync, by recognising every zcash currency rather than the mainnet id only

- [#23332](https://github.com/LedgerHQ/ledger-live/pull/23332) [`d6ab47c`](https://github.com/LedgerHQ/ledger-live/commit/d6ab47c28339866ad88ef0deba75d314c2f6c4f0) Thanks [@henri-ly](https://github.com/henri-ly)! - feat(xrp): add the ripple_devnet currency (XRPL devnet)

- [#23278](https://github.com/LedgerHQ/ledger-live/pull/23278) [`393a02a`](https://github.com/LedgerHQ/ledger-live/commit/393a02a42be9f0410b75c0c34203915bcde27e43) Thanks [@henri-ly](https://github.com/henri-ly)! - feat(xrp): add the ripple_testnet currency (XRPL altnet); send memo labels of testnets resolve to their mainnet

- [#23215](https://github.com/LedgerHQ/ledger-live/pull/23215) [`d1fb4fd`](https://github.com/LedgerHQ/ledger-live/commit/d1fb4fd3b5cdd83eaf479f9d09dca154099c90b4) Thanks [@cted-ledger](https://github.com/cted-ledger)! - serve every zcash account from coin-zcash, transparent-only when shielded zcash is off, and move the zcash currency configs to the zcash family

- [#23215](https://github.com/LedgerHQ/ledger-live/pull/23215) [`a6e1e6a`](https://github.com/LedgerHQ/ledger-live/commit/a6e1e6a6049d43228224aba5df18ca3eab873b62) Thanks [@cted-ledger](https://github.com/cted-ledger)! - turn a live app's transaction on a zcash account into a zcash send through a zcash wallet api adapter

- [#23306](https://github.com/LedgerHQ/ledger-live/pull/23306) [`b641da8`](https://github.com/LedgerHQ/ledger-live/commit/b641da86d889e6e81278c5af70b16da216a19f92) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Coin modules declare their AccountDescriptor type; the legacy account converters read it instead of the bitcoin family, so Cardano, Kaspa and Zcash map to utxo descriptors

- [#23283](https://github.com/LedgerHQ/ledger-live/pull/23283) [`d2b8471`](https://github.com/LedgerHQ/ledger-live/commit/d2b84711b137f42930f006f7a079fc104c92633d) Thanks [@cted-ledger](https://github.com/cted-ledger)! - stop listing the zcash currencies in the bitcoin coin module loader and build the bitcoin signer without a chain adapter

- [#23324](https://github.com/LedgerHQ/ledger-live/pull/23324) [`05e5823`](https://github.com/LedgerHQ/ledger-live/commit/05e58230918a0d271774998c7bede69c88e6a186) Thanks [@cted-ledger](https://github.com/cted-ledger)! - The Zcash mock bridge builds `getTransactionStatus`, `prepareTransaction` and `estimateMaxSpendable` with the currency's coin config, like the real bridge.

- [#23379](https://github.com/LedgerHQ/ledger-live/pull/23379) [`bef895f`](https://github.com/LedgerHQ/ledger-live/commit/bef895fca53783545c564e6842b9069f936becf5) Thanks [@cted-ledger](https://github.com/cted-ledger)! - zcash: with the shielded engine on, live apps are offered at most what one transaction can spend (the largest transparent UTXOs up to the device input limit), so a swap no longer fails with "too large to send in one transaction"

- [#23559](https://github.com/LedgerHQ/ledger-live/pull/23559) [`ead8b59`](https://github.com/LedgerHQ/ledger-live/commit/ead8b59eafe301b82efbe38bf6d2379b6e77b233) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Expose the recoverV2 feature flag to Mixpanel on mobile and desktop.

- [#23422](https://github.com/LedgerHQ/ledger-live/pull/23422) [`b97096c`](https://github.com/LedgerHQ/ledger-live/commit/b97096ca3622ffa57e76423081b8855300f7a70d) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - End the Asset Detail chart on the header price so the line matches the live spot

- [#23442](https://github.com/LedgerHQ/ledger-live/pull/23442) [`b79ccab`](https://github.com/LedgerHQ/ledger-live/commit/b79ccab839cc7916ff3ecd910479904f87a6e59d) Thanks [@semeano](https://github.com/semeano)! - Register the alpen_testnet EVM currency behind the currencyAlpenTestnet feature flag, disabled by default

- [#23046](https://github.com/LedgerHQ/ledger-live/pull/23046) [`7b3040a`](https://github.com/LedgerHQ/ledger-live/commit/7b3040ad872c183fd2beb81a965037b5310ab87a) Thanks [@qperrot](https://github.com/qperrot)! - feat(coin-bitcoin): add a stateless single-address alpaca api (balance, history, blocks, fees, crafting, combine, intent validation, broadcast) for every bitcoin-family currency, with the hw-app-btc createPaymentTransaction parameters of what it crafts; each currency's transaction and address format comes from its coin config; dash and qtum get an explicit explorerId. `validateAddress` moves to `@ledgerhq/coin-bitcoin/logic/validateAddress` (the root `@ledgerhq/coin-bitcoin/validateAddress` subpath is removed)

- [#23214](https://github.com/LedgerHQ/ledger-live/pull/23214) [`b599cb2`](https://github.com/LedgerHQ/ledger-live/commit/b599cb25afbc5ce2dbdcd0cc1b6126a49bba8068) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Migrate bitcoinjs-lib to v7 (Uint8Array, bigint amounts) and varuint-bitcoin to v2

- [#23495](https://github.com/LedgerHQ/ledger-live/pull/23495) [`3c062fc`](https://github.com/LedgerHQ/ledger-live/commit/3c062fccd90c705eee581800c0dd416f1b61ebe2) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - feat(analytics): add the `blockchainWithFunds` user property (blockchain names, e.g. Arbitrum) next to `accountsWithFunds`, which reports the native ticker (ETH for L2s)

- [#21914](https://github.com/LedgerHQ/ledger-live/pull/21914) [`a5a6fa6`](https://github.com/LedgerHQ/ledger-live/commit/a5a6fa6267d17dcb3843358cd5b1f3b42e91ea4c) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Bound the synchronised operation history for generic-coin-framework accounts, fix a truncation bug where an empty-but-continuable page silently ended the sync early, and stop a sync from scratch from merging back stored operations the walk no longer returns.

- [#23249](https://github.com/LedgerHQ/ledger-live/pull/23249) [`80f99a8`](https://github.com/LedgerHQ/ledger-live/commit/80f99a819b13d3ec2bd39d896de46e0a433b9954) Thanks [@dilaouid](https://github.com/dilaouid)! - Add generic account sequence synchronization and persist it on the account

- [#23327](https://github.com/LedgerHQ/ledger-live/pull/23327) [`87b812e`](https://github.com/LedgerHQ/ledger-live/commit/87b812eb975719f788abb4fd315b6229259e8d6e) Thanks [@lysyi3m](https://github.com/lysyi3m)! - fix(cardano): map generic-bridge token references to CAL's split policyId/assetName shape

- [#23386](https://github.com/LedgerHQ/ledger-live/pull/23386) [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574) Thanks [@dilaouid](https://github.com/dilaouid)! - Remove the Zenrock and Quicksilver integrations, including their chain adapters, currency definitions, feature flags and LCD endpoints

- [#23418](https://github.com/LedgerHQ/ledger-live/pull/23418) [`2621f1e`](https://github.com/LedgerHQ/ledger-live/commit/2621f1ebe6c1a8f8cff0a797740771ae5fc084be) Thanks [@ysitbon](https://github.com/ysitbon)! - Stop re-rendering every amount on a countervalues load that changes no rate

  A load now keeps a pair's rate Map and cache entry when every fetched value equals the stored one, and
  keeps the whole cache object when no pair changed. The conversions read the cache alone, through
  `useCountervaluesCache`, so a load that only stamps the fetch status no longer re-renders them. The
  conversions and the persisted export are the same as before.

- [#23211](https://github.com/LedgerHQ/ledger-live/pull/23211) [`bcf98ff`](https://github.com/LedgerHQ/ledger-live/commit/bcf98ffbb1d119fba86c53e4c005abdad251b62a) Thanks [@ysitbon](https://github.com/ysitbon)! - Split the countervalues Redux slice by owner. The rates now have their own slice in `@domain/entity-market-countervalues` (`countervaluesRatesSlice`, with `setCountervaluesState` and `wipeCountervalues`), stored with a shallow freeze so a load never pays for a deep freeze of every rate. `@features/platform-market-countervalues` keeps the loop's state in `countervaluesSyncSlice` (`load`, `error`, `isPolling`; `load` is one of `idle`, `requested`, `loading`, `loadingThenRequested`, replacing the former `pending` and `triggerLoad` flags) and mounts both under the same `countervalues` store key through `countervaluesReducer`, typed `CountervaluesStoreState`, which replaces `CountervaluesState`. The store reads `countervalues.rates` and `countervalues.sync` instead of `countervalues.countervalues.state` and `countervalues.polling`; persistence and the saved data are unchanged. Each slice now declares its own actions, so the `COUNTERVALUES_*` type strings are gone: `setCountervaluesState` and `wipeCountervalues` keep their names, typed `countervaluesRates/set` and `countervaluesRates/wipe`, and the loop's setters `setCountervaluesPollingTriggerLoad`, `setCountervaluesStatePending`, `setCountervaluesStateError` and `setCountervaluesPollingIsPolling` become the events `countervaluesLoadRequested`, `countervaluesLoadStarted`, `countervaluesLoadSucceeded`, `countervaluesLoadFailed` and `countervaluesPollingSet`, typed `countervaluesSync/...`. A load start and a load failure now dispatch one action each instead of two. The sync selectors are the slice's own `selectors`, and `countervaluesSyncTriggerLoadSelector` is gone. `useCountervaluesPolling` now returns only the `poll`, `start`, `stop` and `wipe` commands and no longer re-renders its callers on every load; `pending` and `error` come from the new `useCountervaluesLoadStatus`, which live-common's `useSyncSources` now reads.

- [#23331](https://github.com/LedgerHQ/ledger-live/pull/23331) [`75498cf`](https://github.com/LedgerHQ/ledger-live/commit/75498cf55065bccf17d09b780866ae031c01701a) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - remove velas_evm and its feature flag

- [#23353](https://github.com/LedgerHQ/ledger-live/pull/23353) [`48d5c85`](https://github.com/LedgerHQ/ledger-live/commit/48d5c8543e70d0e4ee2fa30ea12590439f01f510) Thanks [@LL782](https://github.com/LL782)! - Remove the legacy `ofacGeoBlockApi` after Desktop and Mobile use `@features/flow-app-availability`

- [#23376](https://github.com/LedgerHQ/ledger-live/pull/23376) [`4ee8f78`](https://github.com/LedgerHQ/ledger-live/commit/4ee8f78997ca79d841bf0ba5642a4f2229cdbc46) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - Add a balance type sync step to the new send flow, used by Aleo to refresh private records after the pool pick

- [#23423](https://github.com/LedgerHQ/ledger-live/pull/23423) [`c61cbe8`](https://github.com/LedgerHQ/ledger-live/commit/c61cbe8c4c383ff720812398f58907b5b6c3e982) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - fix(portfolio): show the Market 24h variation on assets whose balance did not change over the day (LIVE-39259)

- [#23459](https://github.com/LedgerHQ/ledger-live/pull/23459) [`2f9b7e9`](https://github.com/LedgerHQ/ledger-live/commit/2f9b7e97b8afee033e5fa194c5ca40a1f82a9b89) Thanks [@gre-ledger](https://github.com/gre-ledger)! - feat(account-data): full sync source on AccountBridge, serving no kind yet

- [#23303](https://github.com/LedgerHQ/ledger-live/pull/23303) [`c9c482e`](https://github.com/LedgerHQ/ledger-live/commit/c9c482e9d4ec30bb05e60d00548c471f2d124163) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix(hedera): exclude a fee paid by another account from native operation values

- [#21914](https://github.com/LedgerHQ/ledger-live/pull/21914) [`e66d21e`](https://github.com/LedgerHQ/ledger-live/commit/e66d21ea7ccb706d718703b69d2133ede3294c1a) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Index the per-hash and per-token operation lookups used when assembling an account, replacing repeated full scans.

- [#23315](https://github.com/LedgerHQ/ledger-live/pull/23315) [`68cebc0`](https://github.com/LedgerHQ/ledger-live/commit/68cebc06f2ec8f4cc38ac1caca779317a8fe0711) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fetch LargeMover chart and market rows through RTK Query by ledger id, and drop the unused CoinGecko mapping client.

- [#23058](https://github.com/LedgerHQ/ledger-live/pull/23058) [`214f7f1`](https://github.com/LedgerHQ/ledger-live/commit/214f7f183ea42a7b37663251db944ad61a3ad799) Thanks [@ishaba](https://github.com/ishaba)! - feat(tron): track the sponsored send funnel in Segment

- [#23247](https://github.com/LedgerHQ/ledger-live/pull/23247) [`c18097b`](https://github.com/LedgerHQ/ledger-live/commit/c18097b2ae6fb06a530dc8a29fbfaac99ad7e942) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Load the market list with an RTK infinite query instead of React Query.

- [#23239](https://github.com/LedgerHQ/ledger-live/pull/23239) [`ade02b9`](https://github.com/LedgerHQ/ledger-live/commit/ade02b942ed12320573f0dab67f0a286b4c47533) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - Aleo new send flow descriptor and extended self transfer flow

- [#23108](https://github.com/LedgerHQ/ledger-live/pull/23108) [`bcea51b`](https://github.com/LedgerHQ/ledger-live/commit/bcea51b0b2c9ef09b9e068f97ed3c67a0e45e188) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump `@noble/curves` to 2.4.0 (ESM-only), use the `.js` subpaths and pass `prehash: false` where a digest is signed or verified. CommonJS consumers of `@ledgerhq/hw-app-btc` and `@ledgerhq/wallet-btc` now need Node >= 20.19 (synchronous `require(esm)`) or an ESM-capable bundler.

- [#23276](https://github.com/LedgerHQ/ledger-live/pull/23276) [`8daaded`](https://github.com/LedgerHQ/ledger-live/commit/8daaded1316cb30dc1b3a8634301acc176ca97af) Thanks [@qperrot](https://github.com/qperrot)! - fix(coin-hedera): stop resolving the currency with `getCryptoCurrencyById` / `findCryptoCurrencyById`

  The module no longer needs the host currencies resolver. Fee estimation and token-association
  validation use the input `currencyId` instead of looking the currency up: the countervalues request
  sends it as `froms`, and the rate cache is keyed by it instead of the ticker. The `InvalidAddress`
  message of `safeParseAccountId` takes the name of the resolved config. The API's `validateAddress` parses with the context config instead of a currency id.

  Breaking: `getCurrencyToUSDRate` takes a currency id instead of a `Currency`, and `getTokenFromAsset`
  takes `(currencyId, asset)` instead of `(currency, asset)`.

- [#23295](https://github.com/LedgerHQ/ledger-live/pull/23295) [`98c994b`](https://github.com/LedgerHQ/ledger-live/commit/98c994bc1f46a03366096531afac2471f07f397b) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(solana): refresh the blockhash after the device review to avoid "Blockhash not found"

- [#23384](https://github.com/LedgerHQ/ledger-live/pull/23384) [`9887c8f`](https://github.com/LedgerHQ/ledger-live/commit/9887c8ffdb22ba87ccce7e8f1780e91ac78af640) Thanks [@semeano](https://github.com/semeano)! - feat: add alpen testnet evm currency config

- [#23461](https://github.com/LedgerHQ/ledger-live/pull/23461) [`df2068c`](https://github.com/LedgerHQ/ledger-live/commit/df2068c73926db98e3d0073abf3606db0df878eb) Thanks [@qperrot](https://github.com/qperrot)! - Drop name and unit from intent and token assets built by the generic coin framework and family bridges

- [#22952](https://github.com/LedgerHQ/ledger-live/pull/22952) [`96f2f30`](https://github.com/LedgerHQ/ledger-live/commit/96f2f30c368cf471698d4b48b18ac33a57c7b19a) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Disable A4 register-only mode by default in the `config_generic_a4` live config

- [#23229](https://github.com/LedgerHQ/ledger-live/pull/23229) [`2cd35c5`](https://github.com/LedgerHQ/ledger-live/commit/2cd35c5e21a9dfe58ca58349280f33266143ca51) Thanks [@qperrot](https://github.com/qperrot)! - fix(coin-cosmos): stop resolving the currency with `getCryptoCurrencyById`

  The module no longer needs the host currencies resolver. The on-chain base denom (e.g. `uatom`),
  formerly read from the currency's `units[1].code`, comes from a new required `denom` field of the
  Cosmos coin config, served in every `config_currency_<id>`. `createApi(currencyId)` uses its
  `currencyId` directly where the id is needed. The bridge passes `account.currency.units[1].code`,
  `preload` reuses the currency it receives, and `getTransactionStatus` drops its registry lookup by
  name while keeping the same prefix check. `CosmosCoinConfig` is now typed as
  `CurrencyConfig & { denom: string }` instead of reusing the live-config map type.

  Breaking: `CosmosAPI.getCurrency()` is removed. `CosmosAPI.getAccountInfo`, `getAllBalances`,
  `getDelegations`, `getStakingPositions` and `getRedelegationsWithQueued` take a denom string instead
  of a `CryptoCurrency`. `getBalance`, `getStakes`, `listOperations` and `craftTransaction` take the
  coin config as first parameter; `estimateFees` takes `(config, currencyId, intent)`; and
  `getRedelegations` takes `(currencyId, denom, address)`.

- [#23503](https://github.com/LedgerHQ/ledger-live/pull/23503) [`bd6dbc5`](https://github.com/LedgerHQ/ledger-live/commit/bd6dbc515c1f64214be60c76498452ff9bd2e119) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - Allow Aleo token accounts to self-transfer between their public and private balances in the new send flow

- [#21914](https://github.com/LedgerHQ/ledger-live/pull/21914) [`fb0ac6a`](https://github.com/LedgerHQ/ledger-live/commit/fb0ac6ab7d2e2b8c41c7b012b563c1286313ca70) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Resume EVM token discovery from the sync watermark instead of rewalking the whole history on every sync.

- [#23190](https://github.com/LedgerHQ/ledger-live/pull/23190) [`696357f`](https://github.com/LedgerHQ/ledger-live/commit/696357f754751853758d67c88bf34df9302b9b97) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(coin-solana): partition the native balance between the system account and the stake accounts, summed by the generic adapter through `partitionsNativeBalance` and the family's `getHeldNativeAmount`, so delegated SOL is counted once

- [#23319](https://github.com/LedgerHQ/ledger-live/pull/23319) [`0d5c35d`](https://github.com/LedgerHQ/ledger-live/commit/0d5c35d9f29e17c3ad7bcb7632dcaea83d47e7d3) Thanks [@qperrot](https://github.com/qperrot)! - Remove the unused `parseAPIValue` export of Canton, a boilerplate leftover that read the units of `ripple`

- [#23003](https://github.com/LedgerHQ/ledger-live/pull/23003) [`57b4652`](https://github.com/LedgerHQ/ledger-live/commit/57b4652a1d0ae95af20419210139039642cedb9c) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Adapt to `@ledgerhq/coin-evm` 15

- [#23373](https://github.com/LedgerHQ/ledger-live/pull/23373) [`06b6724`](https://github.com/LedgerHQ/ledger-live/commit/06b672492a5c6a60c7ad181710a2411744c43d3f) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Drop the unused TanStack Query dependency from live-common.

- [#23372](https://github.com/LedgerHQ/ledger-live/pull/23372) [`4905dd1`](https://github.com/LedgerHQ/ledger-live/commit/4905dd1fc2625a07d2aa4e73461a12875466bbd6) Thanks [@CremaFR](https://github.com/CremaFR)! - Return 0 from account.getMaxSpendable when pending operations already commit the whole token balance

- [#23261](https://github.com/LedgerHQ/ledger-live/pull/23261) [`02b383b`](https://github.com/LedgerHQ/ledger-live/commit/02b383b7d11352d121556bb6f0a076c2b960b9eb) Thanks [@alexstapenka-ledger](https://github.com/alexstapenka-ledger)! - Add a withdraw icon to the earn action confirmation dialog, a `custom.dialog.menu` action menu dialog on desktop for the Earn "Earn more" / "Withdraw all" choice, and the `earnWithdrawV2` feature flag that gates the Earn full withdraw flow

### Patch Changes

- Updated dependencies [[`a86963c`](https://github.com/LedgerHQ/ledger-live/commit/a86963c2401573e3d5fef6b9623bae1e23126178), [`c9beaff`](https://github.com/LedgerHQ/ledger-live/commit/c9beaff3b51d3a50f310be73a830bf6e944e61fa), [`4831311`](https://github.com/LedgerHQ/ledger-live/commit/4831311fd859631a9248441e469f52c18fb42c52), [`9365d3a`](https://github.com/LedgerHQ/ledger-live/commit/9365d3ad499ac5c80d445e7816c30adbfe05ffd8), [`d6ab47c`](https://github.com/LedgerHQ/ledger-live/commit/d6ab47c28339866ad88ef0deba75d314c2f6c4f0), [`393a02a`](https://github.com/LedgerHQ/ledger-live/commit/393a02a42be9f0410b75c0c34203915bcde27e43), [`ef80ee4`](https://github.com/LedgerHQ/ledger-live/commit/ef80ee46eb564e25090ce08d8459212739158117), [`ee508db`](https://github.com/LedgerHQ/ledger-live/commit/ee508db35d572d43e03cf58e811177cc3b2389a9), [`d2b8471`](https://github.com/LedgerHQ/ledger-live/commit/d2b84711b137f42930f006f7a079fc104c92633d), [`6b23210`](https://github.com/LedgerHQ/ledger-live/commit/6b232105c11b8b8b86fcb6a715ef19a0b3453b74), [`6582ee6`](https://github.com/LedgerHQ/ledger-live/commit/6582ee63c343dd6f64a31068fddd038af4eb9bd2), [`ead8b59`](https://github.com/LedgerHQ/ledger-live/commit/ead8b59eafe301b82efbe38bf6d2379b6e77b233), [`beea4cd`](https://github.com/LedgerHQ/ledger-live/commit/beea4cd9cccfbfa99a03bfb878f83353ef89d41c), [`3d5d5c7`](https://github.com/LedgerHQ/ledger-live/commit/3d5d5c7582f6e93c4bd0eeae217eedc068409846), [`b79ccab`](https://github.com/LedgerHQ/ledger-live/commit/b79ccab839cc7916ff3ecd910479904f87a6e59d), [`7b3040a`](https://github.com/LedgerHQ/ledger-live/commit/7b3040ad872c183fd2beb81a965037b5310ab87a), [`b599cb2`](https://github.com/LedgerHQ/ledger-live/commit/b599cb25afbc5ce2dbdcd0cc1b6126a49bba8068), [`3c062fc`](https://github.com/LedgerHQ/ledger-live/commit/3c062fccd90c705eee581800c0dd416f1b61ebe2), [`d7017e3`](https://github.com/LedgerHQ/ledger-live/commit/d7017e3ac831a9078845b2deea86a2f852522ed9), [`4282168`](https://github.com/LedgerHQ/ledger-live/commit/42821688658007954e94c223b10522706b8e56aa), [`3527dbc`](https://github.com/LedgerHQ/ledger-live/commit/3527dbc69a05745b272741566b20634d79462cb8), [`80f99a8`](https://github.com/LedgerHQ/ledger-live/commit/80f99a819b13d3ec2bd39d896de46e0a433b9954), [`7da1ea9`](https://github.com/LedgerHQ/ledger-live/commit/7da1ea9534a1bdde063e31545363a27f0fdf5abb), [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574), [`2621f1e`](https://github.com/LedgerHQ/ledger-live/commit/2621f1ebe6c1a8f8cff0a797740771ae5fc084be), [`3ad1a61`](https://github.com/LedgerHQ/ledger-live/commit/3ad1a619eb1244d9adb8e4e67c250a2687716175), [`bcf98ff`](https://github.com/LedgerHQ/ledger-live/commit/bcf98ffbb1d119fba86c53e4c005abdad251b62a), [`75498cf`](https://github.com/LedgerHQ/ledger-live/commit/75498cf55065bccf17d09b780866ae031c01701a), [`ad58765`](https://github.com/LedgerHQ/ledger-live/commit/ad58765b6151457022f8587d6ddcad3325ce96ac), [`ff14496`](https://github.com/LedgerHQ/ledger-live/commit/ff14496257201991b52f0dd140e351fca3e84d4d), [`e66d21e`](https://github.com/LedgerHQ/ledger-live/commit/e66d21ea7ccb706d718703b69d2133ede3294c1a), [`68cebc0`](https://github.com/LedgerHQ/ledger-live/commit/68cebc06f2ec8f4cc38ac1caca779317a8fe0711), [`ed10647`](https://github.com/LedgerHQ/ledger-live/commit/ed10647dedd2642ac5316f89595b618180097e33), [`bc0aa4f`](https://github.com/LedgerHQ/ledger-live/commit/bc0aa4ff32efa315ab4dfaf756bb562db4400df3), [`bcea51b`](https://github.com/LedgerHQ/ledger-live/commit/bcea51b0b2c9ef09b9e068f97ed3c67a0e45e188), [`c1cbfec`](https://github.com/LedgerHQ/ledger-live/commit/c1cbfececf814d382ad6319806b966cb341eb1fd), [`8daaded`](https://github.com/LedgerHQ/ledger-live/commit/8daaded1316cb30dc1b3a8634301acc176ca97af), [`8ebcf5c`](https://github.com/LedgerHQ/ledger-live/commit/8ebcf5c5507558750fb9f7980e9de4f0f5a637ce), [`98c994b`](https://github.com/LedgerHQ/ledger-live/commit/98c994bc1f46a03366096531afac2471f07f397b), [`6639142`](https://github.com/LedgerHQ/ledger-live/commit/6639142cc619d0758ba7873dafbc3e32944f250f), [`2cd35c5`](https://github.com/LedgerHQ/ledger-live/commit/2cd35c5e21a9dfe58ca58349280f33266143ca51), [`37a49df`](https://github.com/LedgerHQ/ledger-live/commit/37a49df18649912157d8f269c3b4153d54b7817e), [`0ace271`](https://github.com/LedgerHQ/ledger-live/commit/0ace2718ac29bc9926858af41424177ff3363d47), [`ca063c4`](https://github.com/LedgerHQ/ledger-live/commit/ca063c4cfad79f12118c5af5bc0ef323857f90bd), [`696357f`](https://github.com/LedgerHQ/ledger-live/commit/696357f754751853758d67c88bf34df9302b9b97), [`5aa4154`](https://github.com/LedgerHQ/ledger-live/commit/5aa41540bc68cb4fedfe45d4cc8d0105ba36cb66), [`dbed44c`](https://github.com/LedgerHQ/ledger-live/commit/dbed44ca28d6bdb0291bb66247cce0a524f6c805), [`a8d48a9`](https://github.com/LedgerHQ/ledger-live/commit/a8d48a97f1bae0c2adad5d2790c9cc8ab5d7c2b0), [`ba07b05`](https://github.com/LedgerHQ/ledger-live/commit/ba07b0562bf91bb0e5468d4806bc5d7781785248), [`0d5c35d`](https://github.com/LedgerHQ/ledger-live/commit/0d5c35d9f29e17c3ad7bcb7632dcaea83d47e7d3), [`57b4652`](https://github.com/LedgerHQ/ledger-live/commit/57b4652a1d0ae95af20419210139039642cedb9c), [`b88647d`](https://github.com/LedgerHQ/ledger-live/commit/b88647dca4c613663bca4ba0d62c2296b95ac083), [`02b383b`](https://github.com/LedgerHQ/ledger-live/commit/02b383b7d11352d121556bb6f0a076c2b960b9eb)]:
  - @shared/feature-flags@0.27.0-next.0
  - @ledgerhq/coin-concordium@1.6.0-next.0
  - @ledgerhq/coin-zcash@1.0.0-next.0
  - @ledgerhq/live-signer-zcash@0.11.0-next.0
  - @domain/entity-currency-crypto@0.16.0-next.0
  - @shared/env@0.11.0-next.0
  - @ledgerhq/coin-bitcoin@1.0.0-next.0
  - @domain/entity-account-data@0.2.0-next.0
  - @domain/api-account-data@0.2.0-next.0
  - @ledgerhq/coin-aleo@2.8.0-next.0
  - @ledgerhq/hw-app-btc@12.0.0-next.0
  - @ledgerhq/wallet-btc@1.0.0-next.0
  - @features/platform-account-analytics@0.2.0-next.0
  - @ledgerhq/coin-hedera@3.0.0-next.0
  - @ledgerhq/coin-aptos@4.5.0-next.0
  - @ledgerhq/coin-stacks@0.34.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.8.0-next.0
  - @ledgerhq/coin-cosmos@2.0.0-next.0
  - @domain/entity-market-countervalues@0.4.0-next.0
  - @features/platform-market-countervalues@0.3.0-next.0
  - @ledgerhq/coin-filecoin@2.5.0-next.0
  - @ledgerhq/hw-app-exchange@0.30.0-next.0
  - @ledgerhq/coin-polkadot@9.0.0-next.0
  - @ledgerhq/coin-solana@2.5.0-next.0
  - @ledgerhq/coin-casper@3.6.0-next.0
  - @ledgerhq/live-dmk-shared@0.36.0-next.0
  - @ledgerhq/speculos-transport@0.13.0-next.0
  - @ledgerhq/coin-canton@1.5.0-next.0
  - @ledgerhq/coin-celo@3.6.0-next.0
  - @features/platform-feature-flags@0.9.1-next.0
  - @features/platform-feature-flags-firebase@0.1.1-next.0
  - @ledgerhq/live-signer-concordium@0.9.3-next.0
  - @domain/api-aggregated-assets@0.6.1-next.0
  - @domain/api-currency-token@0.6.5-next.0
  - @domain/api-market-countervalues@0.2.1-next.0
  - @domain/entity-account-descriptor@0.2.1-next.0
  - @domain/entity-currency@0.4.7-next.0
  - @domain/entity-currency-token@0.5.6-next.0
  - @ledgerhq/asset-aggregation@0.18.1-next.0
  - @ledgerhq/coin-cardano@2.0.1-next.0
  - @features/platform-aggregated-assets@0.5.7-next.0
  - @features/platform-env@0.4.3-next.0
  - @ledgerhq/ledger-cal-service@1.19.10-next.0
  - @ledgerhq/ledger-trust-service@0.8.21-next.0
  - @ledgerhq/live-signer-solana@0.22.2-next.0
  - @ledgerhq/transaction-observability@0.5.1-next.0
  - @domain/entity-account-name@0.2.3-next.0
  - @ledgerhq/live-signer-aleo@0.19.15-next.0
  - @ledgerhq/coin-algorand@2.3.2-next.0
  - @ledgerhq/coin-icon@0.31.2-next.0
  - @ledgerhq/coin-internet_computer@1.32.2-next.0
  - @ledgerhq/coin-kaspa@2.5.1-next.0
  - @ledgerhq/coin-mina@1.24.3-next.0
  - @ledgerhq/coin-multiversx@1.4.1-next.0
  - @ledgerhq/coin-near@1.4.1-next.0
  - @ledgerhq/coin-sui@2.1.1-next.0
  - @ledgerhq/coin-ton@0.39.2-next.0
  - @ledgerhq/coin-vechain@4.3.3-next.0
  - @ledgerhq/live-signer-evm@0.24.2-next.0
  - @ledgerhq/live-signer-icp@0.1.10-next.0
  - @ledgerhq/device-core@0.11.20-next.0
  - @ledgerhq/hw-app-eth@7.11.1-next.0
  - @ledgerhq/live-signer-canton@0.9.24-next.0
  - @ledgerhq/live-signer-celo@1.2.11-next.0
  - @ledgerhq/live-signer-cosmos@0.6.2-next.0
  - @ledgerhq/live-signer-polkadot@0.1.2-next.0
  - @ledgerhq/live-signer-tron@0.2.2-next.0
  - @ledgerhq/coin-tron@10.1.0
  - @ledgerhq/hw-app-sui@1.12.0
  - @domain/api-swap-quotes@0.3.1-next.0

## 38.3.0

### Minor Changes

- [#22519](https://github.com/LedgerHQ/ledger-live/pull/22519) [`d60f240`](https://github.com/LedgerHQ/ledger-live/commit/d60f240af5f814d887bb2df19db8415425b52317) Thanks [@semeano](https://github.com/semeano)! - feat(stacks): add desktop stake and unstake flows

  coin-stacks: `spendableBalance` now excludes locked (staked) STX for every Stacks account, matching `getBalance`, which lowers the Send max for accounts with a stake.

  coin-stacks: `validateIntent` rejects a stake during the pox-5 prepare phase (`StacksStakeInPreparePhase`), which the chain would abort while still charging the fee.

- [#22843](https://github.com/LedgerHQ/ledger-live/pull/22843) [`c954015`](https://github.com/LedgerHQ/ledger-live/commit/c954015d149a86adc8a1cdfcda41a71313171b68) Thanks [@semeano](https://github.com/semeano)! - feat(stacks): add mobile stake and unstake flows

- [#23043](https://github.com/LedgerHQ/ledger-live/pull/23043) [`4028b7e`](https://github.com/LedgerHQ/ledger-live/commit/4028b7e53019ef07b2e94a6559c5f8a6ba54b82f) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Hold back a per-currency fee buffer when depositing the max of a native coin into perps, configured by the new `ptxTradeMaxConstant` flag (`feature_ptx_trade_max_constant`). Only the MAX ratio is reduced; token accounts and other ratios are unchanged.

- [#22860](https://github.com/LedgerHQ/ledger-live/pull/22860) [`21fa5a5`](https://github.com/LedgerHQ/ledger-live/commit/21fa5a533d3369db9586a38d6fa869f8c03121af) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Send the user back to the perps deposit form when they retry after a "not enough balance" error. Retrying re-ran the same deposit, which could only fail again; the form now reopens with the draft amount and funding account so the amount can be lowered. Other errors still retry in place

- [#22856](https://github.com/LedgerHQ/ledger-live/pull/22856) [`438c7b3`](https://github.com/LedgerHQ/ledger-live/commit/438c7b3035ac460e702d294a3c17db2843962d21) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Hide accounts that cannot send, such as HyperCore, from the perps deposit funding picker. The receiving HyperCore account was still offered as a funding source even though a deposit cannot be sent from it. The picker now opens in the `perpetuals:fund` flow, which rejects send-disabled families, so modular dialog analytics from that picker report `flow: "perpetuals:fund"`

- [#22890](https://github.com/LedgerHQ/ledger-live/pull/22890) [`ee95a8e`](https://github.com/LedgerHQ/ledger-live/commit/ee95a8e0c4cdce091dfc1cb0e9b54445030f079c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - fix(cg-client): remove the unused CoinGecko supported coins list query

  Removes `getSupportedCoinsList`, `useGetSupportedCoinsListQuery`, `useSupportedCurrencies`, `MarketCoinSchema`, `SupportedCoinsSchema` and the `MarketCoin` / `SupportedCoins` types. `useMarketDataProvider` now only returns `supportedCounterCurrencies`.

- [#23189](https://github.com/LedgerHQ/ledger-live/pull/23189) [`b9da45c`](https://github.com/LedgerHQ/ledger-live/commit/b9da45cd99b74603ac760b08cf748d60f9bb4a2f) Thanks [@cted-ledger](https://github.com/cted-ledger)! - add the zcash testnet currency config and register it with the bitcoin family

- [#22973](https://github.com/LedgerHQ/ledger-live/pull/22973) [`20484ff`](https://github.com/LedgerHQ/ledger-live/commit/20484ff8d7cc0aab2e4b8448c7e8ce9ebf6840fe) Thanks [@semeano](https://github.com/semeano)! - feat(stacks): keep public-key account ids and persist staking positions on the generic bridge

  - New `BridgeApi.accountIdFromPublicKey` opt-in: a synced account keeps the id it was stored under, and a scanned one is keyed on the device public key, so a family whose legacy bridge keyed ids on the public key is not re-keyed by the generic bridge. Stacks opts in.
  - Stacks registers generic-bridge hooks for its estimation recipient and for persisting `stakingPositions`, which gates the Stake action.

- [#23179](https://github.com/LedgerHQ/ledger-live/pull/23179) [`f047501`](https://github.com/LedgerHQ/ledger-live/commit/f047501381efde857b48c1314d2de637fdce8ade) Thanks [@amaslakov](https://github.com/amaslakov)! - Sum Tezos native balance partitions in the generic adapter, behind a new opt-in `partitionsNativeBalance` bridge flag

- [#22436](https://github.com/LedgerHQ/ledger-live/pull/22436) [`23455ab`](https://github.com/LedgerHQ/ledger-live/commit/23455abfdc26b44eedd77a1c990a6721dadd3f5c) Thanks [@ysitbon](https://github.com/ysitbon)! - Add the countervalues domain api: rate fetching, and the orchestration that folds rates into the entity state.

  - `@domain/api-market-countervalues` owns the Countervalues Service endpoints and `loadCountervalues`, which moves out of `@ledgerhq/live-countervalues`.
  - The endpoints are injected into the shared countervalues api from `@shared/api-services` instead of standing up a second slice. The duplicate client in live-common is removed, so each app registers one countervalues reducer where it previously registered two against the same host. That slice is an RTK Query cache and is not persisted, so there is no stored state to migrate.
  - `loadCountervalues` takes its rates as an argument rather than reaching for a module-level client. The apps compose one in the countervalues bridge they already own; tests pass a mock directly, which removes the `MOCK_COUNTERVALUES` dispatcher hidden inside the fetch path.
  - Rate failures carry the HTTP status through unchanged, so an unsupported pair still clears its cache on 422, an HTTP failure still increments the per-pair backoff, and an offline period still does not.
  - Rate requests keep the previous request policy: a 60s timeout, so a hung connection can no longer stall countervalues polling, and the same retries as before. The two endpoints moved out of live-common keep not retrying.
  - `@ledgerhq/live-countervalues` drops `loadCountervalues`, its `api` entry point and the fetch contract types, and with them its dependencies on `@ledgerhq/logs`, `@ledgerhq/live-network`, `@ledgerhq/live-promise` and `@ledgerhq/live-env`. It no longer reaches the network.
  - web-tools now registers the shared countervalues api, which its portfolio countervalues loading dispatches through.
  - `cvsApiExtra` takes `getCountervaluesServiceUrl`, a getter read on every request, in place of the `countervaluesServiceUrl` string read once at store creation. Switching the developer staging toggle now applies to the next countervalues request again, as it did before the rates moved onto the shared api.

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

- [#22760](https://github.com/LedgerHQ/ledger-live/pull/22760) [`abf8d33`](https://github.com/LedgerHQ/ledger-live/commit/abf8d33f65a4177d2ab8c727c2b53c2b4439c676) Thanks [@ishaba](https://github.com/ishaba)! - Pay the Tronify energy rent in USDT instead of TRX: coin-tron offers it on USDT transfers only and rejects a rent payment that stays valid past the delivery window, and the default Tron config points at the Ledger Tronify proxy.

- [#23209](https://github.com/LedgerHQ/ledger-live/pull/23209) [`bc85ada`](https://github.com/LedgerHQ/ledger-live/commit/bc85ada15c9403d1180d5af23f730196fd0cc672) Thanks [@qperrot](https://github.com/qperrot)! - fix(coin-cardano): stop resolving the currency with `getCryptoCurrencyById`

  The module no longer needs the host currencies resolver. The network is read from a new required
  `testnet` field of the Cardano coin config, served `false` in `config_currency_cardano` and `true` in
  a new `config_currency_cardano_testnet`. `createApi(currencyId)` resolves the config with
  `context.config()` and uses its `currencyId` directly where the id itself is needed (operation ids,
  TTL, network parameters, pool bech32 ids), so no `id` is added to the config. The bridge resolves the
  config for the account's currency instead of always reading `cardano`.

  Breaking: `CardanoConfig` requires `testnet`. `isTestnet`, `lastBlock`, `getValidators`, `getBalance`,
  `getStakes`, `broadcast`, `validateIntent`, `fetchDelegation`, `getTransactions` and the api fetchers
  (`fetchNetworkInfo`, `fetchLatestBlock`, `fetchEpochInfo`, `fetchPoolList`, `fetchPoolDetails`,
  `getDelegationInfo`, `getAllTransactionsByKeys`, `submitTransaction`) take the coin config instead of
  a currency, as first parameter. `listOperations`, `craftTransaction`, `buildUnsignedTransaction` and
  `estimateFees` take `(config, currencyId, ...)`. The live-common `fetchPoolDetails` and
  `useCardanoFamilyPools` keep taking a currency and resolve its config.

- [#22639](https://github.com/LedgerHQ/ledger-live/pull/22639) [`0c507ff`](https://github.com/LedgerHQ/ledger-live/commit/0c507ffb0964a6bfbd221ecd83f00d0259921ada) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Update @ledgerhq/coin-evm to 9.0.1 and pass a logger to its APIs

- [#23083](https://github.com/LedgerHQ/ledger-live/pull/23083) [`4c28d72`](https://github.com/LedgerHQ/ledger-live/commit/4c28d726d50493ed3967c1a7eb84392442dfbeb9) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump `@ledgerhq/ledger-key-ring-protocol`, `@ledgerhq/hw-ledger-key-ring-protocol` to 1.0.0 and `@ledgerhq/evm-tools` to 2.0.0 (ts-libs). No API change.

- [#23178](https://github.com/LedgerHQ/ledger-live/pull/23178) [`e308deb`](https://github.com/LedgerHQ/ledger-live/commit/e308deb3e4f812f01166de17bb28c587a290b9bb) Thanks [@benruseau](https://github.com/benruseau)! - Add the OS updates orchestrator React layer: a generic `OsUpdatesOrchestratorComponent` and `useOsUpdatesOrchestrator` hook in live-common that render platform-injected components for each step

  Add the mobile pre-checks, create backup, apply updates and restore backup components, and persist the device backup in the app storage

  Use the real components in the OS updates orchestrator debug screen

  Fix the OS updates apply step after a bootloader recovery: when the device comes back on an OS, install the first update of the resolved path from its OSU firmware instead of its final firmware, which skipped an update

- [#23184](https://github.com/LedgerHQ/ledger-live/pull/23184) [`3dda070`](https://github.com/LedgerHQ/ledger-live/commit/3dda0705f09d0e0da75ebde9a76b17ba7a9f65e6) Thanks [@CremaFR](https://github.com/CremaFR)! - Retry a swap up to twice, without showing the error, when the Exchange app rejects the provider signature (`signVerificationFail` at `CHECK_TRANSACTION_SIGNATURE`). `executeSwap` requests a new nonce and calls `/swap` again with the same parameters. Each rejected attempt is still reported to `/swap/cancelled`, with the attempt in the error message: `Signature verification failed Code: R0` for the first attempt, then `R1` and `R2` for the retries. This replaces the `[diagnostic=…]` signature classification, which is removed

- [#22745](https://github.com/LedgerHQ/ledger-live/pull/22745) [`db3bde1`](https://github.com/LedgerHQ/ledger-live/commit/db3bde1a0ea2435389260b012d9759dd26f7b174) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Canton: hide Accept once an offer expires while the screen is open, and show a clear message instead of retry when accepting an expired offer

- [#23008](https://github.com/LedgerHQ/ledger-live/pull/23008) [`ac0379e`](https://github.com/LedgerHQ/ledger-live/commit/ac0379ea0511dd457d6bba6a540d48b8358f4f93) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(send): show a broadcast error on the new send flow confirmation and only offer to try again for temporary errors (network, server, locked device)

- [#22583](https://github.com/LedgerHQ/ledger-live/pull/22583) [`33467b2`](https://github.com/LedgerHQ/ledger-live/commit/33467b29525ab06b0abce96ed8489a61a01429c5) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Implement getStakes and getValidators on the CoinModuleApi surface, and report the bonded/unbonding portions from getBalance

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

- [#22620](https://github.com/LedgerHQ/ledger-live/pull/22620) [`3347eb8`](https://github.com/LedgerHQ/ledger-live/commit/3347eb88f282e2286b43493dadb0a9dd3d1f81d5) Thanks [@henri-ly](https://github.com/henri-ly)! - Keep WalletConnect `cosmos_signAmino` working on the generic bridge: `BridgeApi.signRawOperation` lets a family replace the generic raw signing (craft, sign, combine) with its own. Cosmos registers its verbatim, detached-signature implementation there, the one its legacy bridge already uses. `account.getPublicKey` now returns the Cosmos account public key instead of the address legacy accounts keep in `xpub`.

- [#22786](https://github.com/LedgerHQ/ledger-live/pull/22786) [`e80d009`](https://github.com/LedgerHQ/ledger-live/commit/e80d009b57fbec125c43649fcc0b21edc60cb473) Thanks [@ysitbon](https://github.com/ysitbon)! - Docs and comments only: stop naming `@ledgerhq/live-countervalues`, which has been removed. READMEs and comments now point at `@domain/entity-market-countervalues`, or at live-common for `getPortfolio`. No code change.

- [#23194](https://github.com/LedgerHQ/ledger-live/pull/23194) [`90e805d`](https://github.com/LedgerHQ/ledger-live/commit/90e805d9c1b0ef536d1e53489c73b88056731993) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Remove 20 dead EVM chains (akroma, atheios, callisto, dexon, ellaism, ether1, ethergem, ethersocial, expanse, gochain, hpb, mix, musicoin, pirl, poa, reosc, thundercore, tomo, ubiq, wanchain)

- [#22996](https://github.com/LedgerHQ/ledger-live/pull/22996) [`1f50e41`](https://github.com/LedgerHQ/ledger-live/commit/1f50e41fc85d46eec8ffdec4d27ab573a5cbb28e) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop `@ledgerhq/live-hooks`: `useDebounce` and a simpler `useThrottledValues` now live in `@ledgerhq/live-common/hooks`.

- [#22967](https://github.com/LedgerHQ/ledger-live/pull/22967) [`3dae3bb`](https://github.com/LedgerHQ/ledger-live/commit/3dae3bb200941b7e8ed4e56485e401fda188de8b) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(llc): import Stellar burn address from the SDK

- [#22795](https://github.com/LedgerHQ/ledger-live/pull/22795) [`ff5e1b0`](https://github.com/LedgerHQ/ledger-live/commit/ff5e1b0f5a315aaccd3e23aeb8ccd2c7d48730f4) Thanks [@ysitbon](https://github.com/ysitbon)! - refactor(feature-flags): move the Firebase Remote Config mapping to `@features/platform-feature-flags-firebase`

  `@features/platform-feature-flags` now only exposes resolved flag state (hooks and `FeatureToggle`). `formatToFirebaseFeatureId`, `formatDefaultFeatures`, `parseFirebaseFeatures` and `RemoteConfigValue` are imported from `@features/platform-feature-flags-firebase` instead; the `./firebase` subpath is removed. No behavior change.

- [#22835](https://github.com/LedgerHQ/ledger-live/pull/22835) [`7bf8668`](https://github.com/LedgerHQ/ledger-live/commit/7bf8668bea3ae36c1a5c176bc5538311bafbee3d) Thanks [@qperrot](https://github.com/qperrot)! - Fix: new unichain and zksync explorer endpoint

- [#22950](https://github.com/LedgerHQ/ledger-live/pull/22950) [`dccba0c`](https://github.com/LedgerHQ/ledger-live/commit/dccba0c7481c705b4a295942171891deff1c0e85) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Compute the firmware distribution salt of the non-DMK firmware update checks from the identities store instead of the USER_ID env, so they use the same salt as the DMK

- [#22596](https://github.com/LedgerHQ/ledger-live/pull/22596) [`7ff8f5b`](https://github.com/LedgerHQ/ledger-live/commit/7ff8f5b518a19e73005ef974121ce21e593a8e99) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(llc): read `chainId` from config

- [#22609](https://github.com/LedgerHQ/ledger-live/pull/22609) [`826a87c`](https://github.com/LedgerHQ/ledger-live/commit/826a87c08f3757ed3b1fd63f217ed9493082811d) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat(hedera): persist hederaResources on the generic adapter

- [#22913](https://github.com/LedgerHQ/ledger-live/pull/22913) [`6bb4b44`](https://github.com/LedgerHQ/ledger-live/commit/6bb4b44d94a29c3eb8eaffaafda55ca9d6934e2b) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat(hedera): migrate desktop Hedera flows to the generic transaction shape and enable generic adapter

- [#22564](https://github.com/LedgerHQ/ledger-live/pull/22564) [`9c9cae5`](https://github.com/LedgerHQ/ledger-live/commit/9c9cae5ab492b74d52b13e0a5b0673bd681f8d9d) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat(hedera): add the family layer for the generic adapter

- [#22939](https://github.com/LedgerHQ/ledger-live/pull/22939) [`c59fbf4`](https://github.com/LedgerHQ/ledger-live/commit/c59fbf41212398e3d0c1000c776d33c6344290a3) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - chore(hedera): migrate from @hashgraph/sdk 2.78.0 to @hiero-ledger/sdk 2.84.0
  fix(hedera): keep the nonce when serializing generic transactions

- [#22610](https://github.com/LedgerHQ/ledger-live/pull/22610) [`dd2d1f8`](https://github.com/LedgerHQ/ledger-live/commit/dd2d1f8965897befc6e49f041eeccc51deb9578c) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat(hedera): restore legacy prepare-transaction parity on the generic adapter

- [#22608](https://github.com/LedgerHQ/ledger-live/pull/22608) [`b8fc9af`](https://github.com/LedgerHQ/ledger-live/commit/b8fc9af53fc59427695bb0fe81d11d46ef74742e) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat(hedera): add the tokenAssociate mode to the generic adapter

- [#22985](https://github.com/LedgerHQ/ledger-live/pull/22985) [`4182256`](https://github.com/LedgerHQ/ledger-live/commit/4182256c2213208e330861b904a6d8859d1b3e60) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix(hedera): generic adapter fixes for fee estimation, wallet API memo, token association wording, token receive and swap history saved by the legacy bridge

- [#22593](https://github.com/LedgerHQ/ledger-live/pull/22593) [`0a65851`](https://github.com/LedgerHQ/ledger-live/commit/0a65851ea6de6228030a2c94f0cad2234903db2b) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - chore(llc): Backfill the now-mandatory `name`/`unit` fields

- [#22743](https://github.com/LedgerHQ/ledger-live/pull/22743) [`4d9cfbd`](https://github.com/LedgerHQ/ledger-live/commit/4d9cfbd7eff1fb20fb2052b0a2f2b21ea87ba052) Thanks [@ysitbon](https://github.com/ysitbon)! - Import the countervalues logic, types, helpers and mocks from `@domain/entity-market-countervalues` instead of `@ledgerhq/live-countervalues`, and depend on the entity package in place of the legacy one. Specifier change only, no behaviour change.

  Three app tests move with live-common because the `calculate` they mock is called inside live-common: desktop's `useHistoryOperations` and mobile's `useOperationsListViewModel` and `useOperationsV1`. Their mock has to name the same module live-common imports.

- [#22932](https://github.com/LedgerHQ/ledger-live/pull/22932) [`09db449`](https://github.com/LedgerHQ/ledger-live/commit/09db4497ad5e67c6510e87608d694bd06963213e) Thanks [@ysitbon](https://github.com/ysitbon)! - Read the countervalues hooks from `@features/platform-market-countervalues`. In live-common, `useSyncSources`, the portfolio hooks and `useAssetDistribution` take `useCountervaluesPolling` and `useCountervaluesState` from it instead of `@ledgerhq/live-countervalues-react`, and `useAssetChartDataInCounterValue` and the right market trend module take its `useUsdToFiatRate` instead of live-common's own. asset-detail's `useAssetMarketData` does the same. live-common drops its `@ledgerhq/live-countervalues-react` dependency and keeps exporting `counterValues/*` while the apps still import it. Specifier change only, no behaviour change.

- [#22808](https://github.com/LedgerHQ/ledger-live/pull/22808) [`bac3334`](https://github.com/LedgerHQ/ledger-live/commit/bac3334a1c58495722e2c5a123c7d2a26b0c8d7d) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Upgrade @ledgerhq/coin-evm to version 10.0.0 and remove obsolete gas tracker parameters

- [#21849](https://github.com/LedgerHQ/ledger-live/pull/21849) [`82946e5`](https://github.com/LedgerHQ/ledger-live/commit/82946e53e676943851a8a9e153bafc641a40778b) Thanks [@pawell24](https://github.com/pawell24)! - Prepare NEAR for the generic coin-framework bridge (LIVE-36413).

  - `live-common`: new LiveConfig key `config_near_generic_bridge` (default `false`) gates the NEAR generic route, so it ships dormant and can be enabled or rolled back remotely. `families/near/accountRawAssign.ts` carries both `stakingPositions` and the legacy `nearResources` blob through serialization, in each direction, so an account persisted before the migration keeps the data the UI falls back to. `families/near/bridgeExtensions.ts` exposes the estimation recipient. `families/near/bridge/api.ts` declares `describeOptimisticOperation`, typing a pending withdrawal `WITHDRAW_UNSTAKED` to match what the indexer produces rather than the generic `WITHDRAW_UNBONDED`, which `getMaxAmount` would not have netted out.
  - `coin-near`: `Transaction.fees` widened to `BigNumber | null` and `nonce` added, both round-tripping through `transaction.ts`. Fees serialize with `toFixed`, so a yocto-denominated fee no longer persists in exponential notation, and a missing nonce revives as zero instead of sending `signOperation` into the unimplemented `getNextSequence`. `preload-data.ts` seeds the gas price and the `min_gas_purchase_price` floor with their mainnet values, so `canStake` prices staking at what the chain charges — rather than at zero, or at a tenth of it — on a route that never runs `preload()`.

- [#22606](https://github.com/LedgerHQ/ledger-live/pull/22606) [`f9ebcf6`](https://github.com/LedgerHQ/ledger-live/commit/f9ebcf6d2b79758ea43554977a8997df25c4e3b4) Thanks [@pawell24](https://github.com/pawell24)! - Add NEAR to `genericCoinFrameworkFamilies.json` (LIVE-36413). The route stays behind the `config_near_generic_bridge` LiveConfig key, which defaults to `false`, so NEAR keeps running on the legacy bridge until the key is enabled remotely.

- [#21731](https://github.com/LedgerHQ/ledger-live/pull/21731) [`99f7c87`](https://github.com/LedgerHQ/ledger-live/commit/99f7c87afc8029eca9bf574df03123bf07ca7810) Thanks [@ishaba](https://github.com/ishaba)! - feat(tron): sponsored-send energy-rent logic and the SponsoredCoinApi seam

- [#22977](https://github.com/LedgerHQ/ledger-live/pull/22977) [`c26bbea`](https://github.com/LedgerHQ/ledger-live/commit/c26bbea7477d27f6042657c3a3c48c05f85b1f59) Thanks [@ysitbon](https://github.com/ysitbon)! - `@features/platform-market-countervalues` is now the only countervalues React glue in the monorepo.

  - The platform package no longer exports `CountervaluesContext`. It was public only so the old React package could share one context during the migration. Read countervalues through the package hooks, under a `CountervaluesProvider`.
  - live-common no longer has `counterValues/*`: its own `useUsdToFiatRate` and `useGetCounterValueIdsPolling` are removed. Import both from `@features/platform-market-countervalues`.

- [#22858](https://github.com/LedgerHQ/ledger-live/pull/22858) [`f45fc80`](https://github.com/LedgerHQ/ledger-live/commit/f45fc8027562e53cdbd3500a2884084df6a4af8e) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Make coin-polkadot stateless: `createBridges` takes a `Context`, endpoints, tuning and cache TTLs come from `config_currency_polkadot`, logs go through `context.logger`, and the Polkadot env variables are removed.

- [#22654](https://github.com/LedgerHQ/ledger-live/pull/22654) [`78b38fb`](https://github.com/LedgerHQ/ledger-live/commit/78b38fb3820d3391c5c04812fee88c1c2a6e9289) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(send): sync account at the start of a send

- [#23297](https://github.com/LedgerHQ/ledger-live/pull/23297) [`2989e37`](https://github.com/LedgerHQ/ledger-live/commit/2989e37b80b8bfcaae549cc02aa6de189a69dfef) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(solana): refresh the blockhash after the device review to avoid "Blockhash not found"

- [#22560](https://github.com/LedgerHQ/ledger-live/pull/22560) [`18166fb`](https://github.com/LedgerHQ/ledger-live/commit/18166fbe8719d50c911aa0ab349e68c414f8fc62) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat(framework): optional `addressLookup` bridge hook for network-assigned addresses + wire Hedera's lookup and local coin module API

- [#22704](https://github.com/LedgerHQ/ledger-live/pull/22704) [`339d174`](https://github.com/LedgerHQ/ledger-live/commit/339d17482fba108dfca790c2500c697a818f7a1c) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - Support minHeight in Hedera listOperations for incremental sync, return finalized operations only and revive stakedAmount as BigNumber on the generic adapter

- [#23115](https://github.com/LedgerHQ/ledger-live/pull/23115) [`3160fa7`](https://github.com/LedgerHQ/ledger-live/commit/3160fa7a2f2a6e121d15766609902e83f4efc71f) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add fromLegacyAccount and toLegacyAccount to convert between a legacy account and an AccountDescriptor

- [#22770](https://github.com/LedgerHQ/ledger-live/pull/22770) [`812d03f`](https://github.com/LedgerHQ/ledger-live/commit/812d03f74d4324c2b165d4fb67fb3b31834d2b67) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Resolve the Perps `custom.perps.deposit` request with the swap ID and quoted amount once the deposit is broadcast, and reject it when the user cancels. The deposit request now lives in `wallet-api/Perps/depositRequest` and is shared by desktop and mobile

- [#22801](https://github.com/LedgerHQ/ledger-live/pull/22801) [`5e611ff`](https://github.com/LedgerHQ/ledger-live/commit/5e611ffffdcf2c73fb55c8b673693dfa88d1077c) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(llc): send ERC-20 transactions on Arc swap with CEX

- [#21839](https://github.com/LedgerHQ/ledger-live/pull/21839) [`6d744e0`](https://github.com/LedgerHQ/ledger-live/commit/6d744e0d30b4480282d35c359d096f3f6d6602af) Thanks [@YazhuEth](https://github.com/YazhuEth)! - `estimateFees` now returns the recipient token account, wallet address and input type of an SPL transfer alongside its fee, so the device screen names the destination; a recipient token account holding another token throws `SolanaTokenAccountHoldsAnotherToken`.

  `makeEmptyTokenAccount` now builds its id with `encodeTokenAccountId`, like the fourteen families that already do: the wallet-API placeholder previously used the contract address, so it matched no real sub-account id.

  Solana runs on the generic coin framework. The send and staking screens move onto the generic transaction shape, which names what it does — a mode, a memo, a stake account seed — instead of the nested command model the legacy bridge carried, and the apps now read it through one family module rather than reaching into the transaction themselves.

  The behaviours the legacy bridge produced are restored on the generic path: an incoming SPL transfer produces an operation, a stake withdrawal empties the account rather than signing a stale amount, opening a token account is charged its rent, sending the maximum to a new stake account leaves enough to unstake it later, the device confirmation screen lists every row the device itself shows, and a token account's frozen state and Token-2022 extensions are back on screen.

  A live app can again submit the four token and stake commands the wallet API defines, and a raw signature it gets back is hex, as the field it arrives in says. The device signer is selected through the family's own factory, so the `ldmkSolanaSigner` flag and the transaction-check option it carries keep deciding, as they did before. The mock bridge is rewritten on the coin module, so a mocked signature still yields a transaction the wallet API can deserialize.

- [#22897](https://github.com/LedgerHQ/ledger-live/pull/22897) [`644071b`](https://github.com/LedgerHQ/ledger-live/commit/644071ba1aba85cdce57c423934be80f91639155) Thanks [@henri-ly](https://github.com/henri-ly)! - fix(coin-solana): seed `useAllAmount` on the generic Solana transaction so the legacy send flows show the Max switch again

- [#22852](https://github.com/LedgerHQ/ledger-live/pull/22852) [`6756f58`](https://github.com/LedgerHQ/ledger-live/commit/6756f5881526607858dbc2ba3d8065e5453b2d5a) Thanks [@koda-apps](https://github.com/apps/koda-apps)! - Enable Token-2022 by default for Solana

- [#23085](https://github.com/LedgerHQ/ledger-live/pull/23085) [`7073e2d`](https://github.com/LedgerHQ/ledger-live/commit/7073e2d835a79e3e014ca1a9631e73c1f21989c6) Thanks [@semeano](https://github.com/semeano)! - Route Stacks through the generic coin framework by adding it to `genericCoinFrameworkFamilies.json` (LIVE-36417). The `config_stacks_generic_bridge` LiveConfig key defaults to `true` and can be turned off remotely to fall back to the legacy bridge.

- [#23085](https://github.com/LedgerHQ/ledger-live/pull/23085) [`35d9396`](https://github.com/LedgerHQ/ledger-live/commit/35d9396f690292ae8efda27b24ac4143f03cd00b) Thanks [@semeano](https://github.com/semeano)! - Align Stacks operations synced through the generic coin framework with the legacy bridge: a native STX send is no longer valued with its fee counted twice, a send-many is one OUT for the whole batch with a sub-operation per recipient, operations carry their nonce and fee payer, and an account switched back to the legacy bridge rebuilds its history instead of merging it.

- [#23112](https://github.com/LedgerHQ/ledger-live/pull/23112) [`7f0d867`](https://github.com/LedgerHQ/ledger-live/commit/7f0d867cc9f8715b9244979e42a035babe43d2ab) Thanks [@amaslakov](https://github.com/amaslakov)! - Harden the Tronify rent payment: Retry stays locked until a payment that may still land has expired, a rent price rise is shown and must be accepted before ordering again, a signed payment about to expire is refused before broadcast, and the unreachable contract-data failure is removed.

- [#22059](https://github.com/LedgerHQ/ledger-live/pull/22059) [`91ac227`](https://github.com/LedgerHQ/ledger-live/commit/91ac22740fbf677ca481382eb55d2e4e12336d2a) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(cosmos): Migrate the desktop staking UI onto the generic path

- [#22760](https://github.com/LedgerHQ/ledger-live/pull/22760) [`4bab512`](https://github.com/LedgerHQ/ledger-live/commit/4bab512f050d8f4d49a7745104b278ec94dd1d20) Thanks [@ishaba](https://github.com/ishaba)! - Add the Tronify sponsored send to the desktop Send flow behind the `gasSponsorship` flag: a USDT transfer can pay its network fee with rented energy, signing the rent payment first, then the transfer once the energy is delivered on-chain.

- [#23031](https://github.com/LedgerHQ/ledger-live/pull/23031) [`3264580`](https://github.com/LedgerHQ/ledger-live/commit/3264580e247bbd35d774b33eae21cc7c2e87d105) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Pass `swapApiEnv` (`stg` | `prd`) to the Swap live app so it follows Wallet's Swap backend

  - Derived from the `SWAP_API_BASE` url via new `getSwapAPIEnv` helper in live-common
  - Unknown hosts (e.g. localhost) send nothing; the live app keeps its own default
  - Stop passing the full `swapApiBase` url; the live app no longer reads it

- [#22953](https://github.com/LedgerHQ/ledger-live/pull/22953) [`f482212`](https://github.com/LedgerHQ/ledger-live/commit/f48221278738b5b3accf7199c23e6dd84c48c27e) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - chore(device): remove the legacy connectApp and the ldmkConnectApp feature flag

  `connectApp` and `connectManager` now always use the Device Management Kit device actions and fail
  with `DmkTransportRequired` on a non-DMK transport. `apps/inlineAppInstall`, `hw/isUpdateAvailable`
  and `DeviceManagementKitTransport.listenLegacyConnectApp` are removed.

- [#22582](https://github.com/LedgerHQ/ledger-live/pull/22582) [`766d1eb`](https://github.com/LedgerHQ/ledger-live/commit/766d1ebf51eccbbaefd0b3d47b07f3e3b8672775) Thanks [@michalmisiejuk-ext-collab](https://github.com/michalmisiejuk-ext-collab)! - Remove the unused unauthenticated standalone swap quotes store

- [#22775](https://github.com/LedgerHQ/ledger-live/pull/22775) [`3cdcba9`](https://github.com/LedgerHQ/ledger-live/commit/3cdcba9252780b413452cb100682cf08041d966e) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(coin-cosmos): surface validator bond status

- [#23223](https://github.com/LedgerHQ/ledger-live/pull/23223) [`0a5b68d`](https://github.com/LedgerHQ/ledger-live/commit/0a5b68d609355af795c6176a4ac30c5b7142c2eb) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix(hedera): skip association for erc-20 tokens in ReceiveWithAssociationModal and resolve the new association token in the legacy adapter

- [#22989](https://github.com/LedgerHQ/ledger-live/pull/22989) [`8312d68`](https://github.com/LedgerHQ/ledger-live/commit/8312d6818aa5fa37f523352f81f51a61dd502bf2) Thanks [@gre-ledger](https://github.com/gre-ledger)! - chore: take `uuid` from the pnpm catalog (11.1.0)

  `uuid` was spread over 8.3.2, 9.0.1 and 11.1.0. Every package now uses the catalog entry. `@types/uuid` is dropped: 11 ships its own types. The repo only imports `v4`, `v5` and `parse` (`parse` in a coin-solana test fixture), which behave the same across these majors. 11 types `v4` with overloads, so passing it directly as a callback (`useState(uuid)`) no longer typechecks and is now wrapped (`useState(() => uuid())`).

- [#22906](https://github.com/LedgerHQ/ledger-live/pull/22906) [`c5c2815`](https://github.com/LedgerHQ/ledger-live/commit/c5c2815ec53dbf88804e558952f1451f13c37bb4) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: hedera legacy bridge adapter with fixes and optimizations

- [#22632](https://github.com/LedgerHQ/ledger-live/pull/22632) [`b7cc410`](https://github.com/LedgerHQ/ledger-live/commit/b7cc41062a66145da018db31722d0df45ed98b1c) Thanks [@CremaFR](https://github.com/CremaFR)! - Add account.getMaxSpendable so live apps can request a single-account send-max estimate

- [#22949](https://github.com/LedgerHQ/ledger-live/pull/22949) [`74a7067`](https://github.com/LedgerHQ/ledger-live/commit/74a706756e9009886a490052d0f3005c6837e8b1) Thanks [@CremaFR](https://github.com/CremaFR)! - Return 0 from account.getMaxSpendable for Zcash accounts that only hold shielded funds

### Patch Changes

- Updated dependencies [[`5b62ecb`](https://github.com/LedgerHQ/ledger-live/commit/5b62ecb5c84b36099b4f29fcca9665431a468fb7), [`d60f240`](https://github.com/LedgerHQ/ledger-live/commit/d60f240af5f814d887bb2df19db8415425b52317), [`c954015`](https://github.com/LedgerHQ/ledger-live/commit/c954015d149a86adc8a1cdfcda41a71313171b68), [`4028b7e`](https://github.com/LedgerHQ/ledger-live/commit/4028b7e53019ef07b2e94a6559c5f8a6ba54b82f), [`1bf1044`](https://github.com/LedgerHQ/ledger-live/commit/1bf1044e3eb3b57187bf6c837b17b4ed00f870cc), [`5eca063`](https://github.com/LedgerHQ/ledger-live/commit/5eca063fe675ec5cb59cc96fffe4b67fcd7f3061), [`d6e7695`](https://github.com/LedgerHQ/ledger-live/commit/d6e7695bf15852c7b0cd2a97aa0a3a0c4d047d74), [`3f4e740`](https://github.com/LedgerHQ/ledger-live/commit/3f4e7409bfc66544165598c23cbc826001632f16), [`87de6a7`](https://github.com/LedgerHQ/ledger-live/commit/87de6a72f75df73aab99da6c420de00004bf7692), [`6e3211f`](https://github.com/LedgerHQ/ledger-live/commit/6e3211f6c887211d4ecfbf58d909f49c31df6179), [`ef84a7c`](https://github.com/LedgerHQ/ledger-live/commit/ef84a7cac52080143934ebf01511d24a4dcaa0f3), [`20484ff`](https://github.com/LedgerHQ/ledger-live/commit/20484ff8d7cc0aab2e4b8448c7e8ce9ebf6840fe), [`77e1044`](https://github.com/LedgerHQ/ledger-live/commit/77e10442de4ec10827edb16ecc1583490c8da7e1), [`06757be`](https://github.com/LedgerHQ/ledger-live/commit/06757be8aa253d449e4bb5b0959cf2919d14a3b8), [`e3bb812`](https://github.com/LedgerHQ/ledger-live/commit/e3bb81244302b04cf278bdd4d01f726c0190b167), [`f047501`](https://github.com/LedgerHQ/ledger-live/commit/f047501381efde857b48c1314d2de637fdce8ade), [`23455ab`](https://github.com/LedgerHQ/ledger-live/commit/23455abfdc26b44eedd77a1c990a6721dadd3f5c), [`94e247b`](https://github.com/LedgerHQ/ledger-live/commit/94e247bcaa49bd601951be6f39182ee26ed67ecc), [`bf29f88`](https://github.com/LedgerHQ/ledger-live/commit/bf29f888316e5d8d9049b763a8c77ce9850f07df), [`c9b7594`](https://github.com/LedgerHQ/ledger-live/commit/c9b75949c8f01cade6b061bd5b6ecb0af5b0ec5f), [`7a2505b`](https://github.com/LedgerHQ/ledger-live/commit/7a2505bd21cc2401e1e887cb5b9713281cb11519), [`abf8d33`](https://github.com/LedgerHQ/ledger-live/commit/abf8d33f65a4177d2ab8c727c2b53c2b4439c676), [`d33fd72`](https://github.com/LedgerHQ/ledger-live/commit/d33fd721a5d1a9363f820738f6aadbeb0a8b3cad), [`05d636b`](https://github.com/LedgerHQ/ledger-live/commit/05d636b6722285001b62bb4ea30bad32a65c5a9a), [`bc85ada`](https://github.com/LedgerHQ/ledger-live/commit/bc85ada15c9403d1180d5af23f730196fd0cc672), [`d819300`](https://github.com/LedgerHQ/ledger-live/commit/d819300df11d1e58ad33dbb8d0dbdb6f20c8dd93), [`708a1f2`](https://github.com/LedgerHQ/ledger-live/commit/708a1f22cbdb566ceed47b2277e976a66b802333), [`3dacfc2`](https://github.com/LedgerHQ/ledger-live/commit/3dacfc29377ad8a8ac25ad51f2207c882491bb7e), [`4c28d72`](https://github.com/LedgerHQ/ledger-live/commit/4c28d726d50493ed3967c1a7eb84392442dfbeb9), [`e308deb`](https://github.com/LedgerHQ/ledger-live/commit/e308deb3e4f812f01166de17bb28c587a290b9bb), [`4864e53`](https://github.com/LedgerHQ/ledger-live/commit/4864e53391f1c544e13b7593c2464f55737ccae8), [`db3bde1`](https://github.com/LedgerHQ/ledger-live/commit/db3bde1a0ea2435389260b012d9759dd26f7b174), [`33467b2`](https://github.com/LedgerHQ/ledger-live/commit/33467b29525ab06b0abce96ed8489a61a01429c5), [`0f401bb`](https://github.com/LedgerHQ/ledger-live/commit/0f401bb6289b6e78fbd05b6f98977bde4999d22a), [`3347eb8`](https://github.com/LedgerHQ/ledger-live/commit/3347eb88f282e2286b43493dadb0a9dd3d1f81d5), [`21ab07f`](https://github.com/LedgerHQ/ledger-live/commit/21ab07f8912d9c7fa9fb7e438e4e7873ca674f02), [`9ddaa97`](https://github.com/LedgerHQ/ledger-live/commit/9ddaa970d609f4b54f0cdbbda0609242cca54cf7), [`e80d009`](https://github.com/LedgerHQ/ledger-live/commit/e80d009b57fbec125c43649fcc0b21edc60cb473), [`fa2c070`](https://github.com/LedgerHQ/ledger-live/commit/fa2c070913fb13e530c65d901151c2766c46caf6), [`d1eeaab`](https://github.com/LedgerHQ/ledger-live/commit/d1eeaabf43a54a3d2c4796ea1c5b11a0b9202814), [`eb23867`](https://github.com/LedgerHQ/ledger-live/commit/eb23867603dc4e80723cdfe5486c28bc88d57014), [`90e805d`](https://github.com/LedgerHQ/ledger-live/commit/90e805d9c1b0ef536d1e53489c73b88056731993), [`e1742ea`](https://github.com/LedgerHQ/ledger-live/commit/e1742ea357bd113d34c0b29c701fd6080b9614a1), [`ff5e1b0`](https://github.com/LedgerHQ/ledger-live/commit/ff5e1b0f5a315aaccd3e23aeb8ccd2c7d48730f4), [`7ff8f5b`](https://github.com/LedgerHQ/ledger-live/commit/7ff8f5b518a19e73005ef974121ce21e593a8e99), [`63a0ec8`](https://github.com/LedgerHQ/ledger-live/commit/63a0ec8c8d20ace5ed278f21d72286dd8d75094b), [`826a87c`](https://github.com/LedgerHQ/ledger-live/commit/826a87c08f3757ed3b1fd63f217ed9493082811d), [`9c9cae5`](https://github.com/LedgerHQ/ledger-live/commit/9c9cae5ab492b74d52b13e0a5b0673bd681f8d9d), [`e294828`](https://github.com/LedgerHQ/ledger-live/commit/e294828087e36263fd917c7514d8a4583063b2b6), [`c59fbf4`](https://github.com/LedgerHQ/ledger-live/commit/c59fbf41212398e3d0c1000c776d33c6344290a3), [`dd2d1f8`](https://github.com/LedgerHQ/ledger-live/commit/dd2d1f8965897befc6e49f041eeccc51deb9578c), [`b8fc9af`](https://github.com/LedgerHQ/ledger-live/commit/b8fc9af53fc59427695bb0fe81d11d46ef74742e), [`3a45eb3`](https://github.com/LedgerHQ/ledger-live/commit/3a45eb3e29f417f24570787e76d977cefa5090d9), [`569dceb`](https://github.com/LedgerHQ/ledger-live/commit/569dceb7cdfbd97844c6a426fe421a89128b584e), [`4182256`](https://github.com/LedgerHQ/ledger-live/commit/4182256c2213208e330861b904a6d8859d1b3e60), [`5d4af5a`](https://github.com/LedgerHQ/ledger-live/commit/5d4af5acdc7e57aedd3597575a91590917acae6c), [`0a65851`](https://github.com/LedgerHQ/ledger-live/commit/0a65851ea6de6228030a2c94f0cad2234903db2b), [`3444d16`](https://github.com/LedgerHQ/ledger-live/commit/3444d16d5159b6e415b4dd0ab4fedfbf4cbeb260), [`f3b3c1c`](https://github.com/LedgerHQ/ledger-live/commit/f3b3c1c8479c2ae12d6a57eef030b04b2e665483), [`32da4ab`](https://github.com/LedgerHQ/ledger-live/commit/32da4ab268e9e9b4622604bdd6657416b128aa56), [`82946e5`](https://github.com/LedgerHQ/ledger-live/commit/82946e53e676943851a8a9e153bafc641a40778b), [`e3e6c22`](https://github.com/LedgerHQ/ledger-live/commit/e3e6c222ddba748a7e9e03e85f5919ce8e5c28bd), [`99f7c87`](https://github.com/LedgerHQ/ledger-live/commit/99f7c87afc8029eca9bf574df03123bf07ca7810), [`eb65ce4`](https://github.com/LedgerHQ/ledger-live/commit/eb65ce49ea0fa2d2c44f79fd2b0f8de365ae5e53), [`c26bbea`](https://github.com/LedgerHQ/ledger-live/commit/c26bbea7477d27f6042657c3a3c48c05f85b1f59), [`667d378`](https://github.com/LedgerHQ/ledger-live/commit/667d378b97e9102df009015e01fed6b49fd88b82), [`f45fc80`](https://github.com/LedgerHQ/ledger-live/commit/f45fc8027562e53cdbd3500a2884084df6a4af8e), [`1731458`](https://github.com/LedgerHQ/ledger-live/commit/17314582789efaad9ba35a5cf5e434a3140d6132), [`2989e37`](https://github.com/LedgerHQ/ledger-live/commit/2989e37b80b8bfcaae549cc02aa6de189a69dfef), [`0680bcd`](https://github.com/LedgerHQ/ledger-live/commit/0680bcd3514e31d8479c4f8ceafe7cf4438a2ec1), [`6f2ecf8`](https://github.com/LedgerHQ/ledger-live/commit/6f2ecf89dd1d978038f573738d6e85fe1805b5d9), [`ff72be2`](https://github.com/LedgerHQ/ledger-live/commit/ff72be2d42151873c3a1a9a24828593bee9847ef), [`18166fb`](https://github.com/LedgerHQ/ledger-live/commit/18166fbe8719d50c911aa0ab349e68c414f8fc62), [`ef32df5`](https://github.com/LedgerHQ/ledger-live/commit/ef32df54a788270d9d01e84f05868902e82ef3c0), [`339d174`](https://github.com/LedgerHQ/ledger-live/commit/339d17482fba108dfca790c2500c697a818f7a1c), [`1a9b21e`](https://github.com/LedgerHQ/ledger-live/commit/1a9b21e6cc971d5e5b069cab968826b15332024b), [`dce4fb6`](https://github.com/LedgerHQ/ledger-live/commit/dce4fb6a4ec291153cc5b4d5a0d5000f777007e1), [`406eab8`](https://github.com/LedgerHQ/ledger-live/commit/406eab877fd65339b4e7c6272beb3daa54b3b192), [`6c8bd31`](https://github.com/LedgerHQ/ledger-live/commit/6c8bd31900a6b6aa8987cc82f6d907bbc3611fc1), [`91ad9a0`](https://github.com/LedgerHQ/ledger-live/commit/91ad9a0e481e3935f80089a800293a4733aef450), [`2b2eee6`](https://github.com/LedgerHQ/ledger-live/commit/2b2eee6a4abfb86615f3e5a628f518b5a9c58dad), [`8737f89`](https://github.com/LedgerHQ/ledger-live/commit/8737f89e2b515ab518cbcdeacc064641c6f595be), [`42d4dc2`](https://github.com/LedgerHQ/ledger-live/commit/42d4dc25044dceb9936c1907fb5ea0838fa0a64b), [`6d744e0`](https://github.com/LedgerHQ/ledger-live/commit/6d744e0d30b4480282d35c359d096f3f6d6602af), [`35d9396`](https://github.com/LedgerHQ/ledger-live/commit/35d9396f690292ae8efda27b24ac4143f03cd00b), [`c92c32e`](https://github.com/LedgerHQ/ledger-live/commit/c92c32e66d20de8a85454bf1fc444dadd3a51e76), [`77d202b`](https://github.com/LedgerHQ/ledger-live/commit/77d202b1930715ed30b62521fbc5692969b6ec47), [`9a39ad5`](https://github.com/LedgerHQ/ledger-live/commit/9a39ad5eeeaefff74791ec01db8c62c102b6e54a), [`7f0d867`](https://github.com/LedgerHQ/ledger-live/commit/7f0d867cc9f8715b9244979e42a035babe43d2ab), [`bcd25fd`](https://github.com/LedgerHQ/ledger-live/commit/bcd25fd87bda9e7e8b7c3ee2a243d3e241adc0b0), [`91ac227`](https://github.com/LedgerHQ/ledger-live/commit/91ac22740fbf677ca481382eb55d2e4e12336d2a), [`99b54cd`](https://github.com/LedgerHQ/ledger-live/commit/99b54cdac46807286d75caa1a94e61a37606c18f), [`e3c1e7b`](https://github.com/LedgerHQ/ledger-live/commit/e3c1e7b8b8d3aece13860059e593fd4489ca777d), [`f482212`](https://github.com/LedgerHQ/ledger-live/commit/f48221278738b5b3accf7199c23e6dd84c48c27e), [`766d1eb`](https://github.com/LedgerHQ/ledger-live/commit/766d1ebf51eccbbaefd0b3d47b07f3e3b8672775), [`3ac5d88`](https://github.com/LedgerHQ/ledger-live/commit/3ac5d880557971ef69834eeccbdef83d381cd801), [`3cdcba9`](https://github.com/LedgerHQ/ledger-live/commit/3cdcba9252780b413452cb100682cf08041d966e), [`8312d68`](https://github.com/LedgerHQ/ledger-live/commit/8312d6818aa5fa37f523352f81f51a61dd502bf2), [`c5c2815`](https://github.com/LedgerHQ/ledger-live/commit/c5c2815ec53dbf88804e558952f1451f13c37bb4), [`33094bc`](https://github.com/LedgerHQ/ledger-live/commit/33094bc31d9d8cd7a80b8eae3cf2b4afe3afa500)]:
  - @ledgerhq/transaction-observability@0.5.0
  - @ledgerhq/coin-stacks@0.33.0
  - @shared/feature-flags@0.26.0
  - @ledgerhq/coin-bitcoin@0.55.0
  - @ledgerhq/coin-zcash@0.11.0
  - @domain/entity-currency-crypto@0.15.0
  - @ledgerhq/wallet-btc@0.7.0
  - @ledgerhq/ledger-wallet-framework@3.7.0
  - @ledgerhq/coin-aleo@2.7.0
  - @domain/api-market-countervalues@0.2.0
  - @domain/entity-market-countervalues@0.3.0
  - @ledgerhq/coin-cardano@2.0.0
  - @shared/env@0.10.0
  - @ledgerhq/coin-tron@10.1.0
  - @ledgerhq/live-dmk-shared@0.35.0
  - @ledgerhq/coin-near@1.4.0
  - @ledgerhq/hw-app-near@6.37.0
  - @ledgerhq/hw-app-exchange@0.29.0
  - @ledgerhq/hw-app-eth@7.11.0
  - @domain/entity-account-descriptor@0.2.0
  - @ledgerhq/coin-canton@1.4.0
  - @ledgerhq/coin-cosmos@1.6.0
  - @features/platform-market-countervalues@0.2.0
  - @ledgerhq/asset-aggregation@0.18.0
  - @domain/entity-client-identity@0.3.0
  - @features/platform-feature-flags-firebase@0.1.0
  - @features/platform-feature-flags@0.9.0
  - @domain/api-aggregated-assets@0.6.0
  - @ledgerhq/coin-hedera@2.7.0
  - @ledgerhq/coin-kaspa@2.5.0
  - @ledgerhq/coin-celo@3.5.0
  - @ledgerhq/coin-polkadot@8.0.0
  - @ledgerhq/hw-app-multiversx@6.32.0
  - @ledgerhq/coin-multiversx@1.4.0
  - @ledgerhq/coin-solana@2.4.0
  - @ledgerhq/coin-aptos@4.4.0
  - @ledgerhq/coin-filecoin@2.4.0
  - @ledgerhq/coin-sui@2.1.0
  - @domain/api-swap-quotes@0.3.0
  - @domain/api-currency-token@0.6.4
  - @domain/entity-currency@0.4.6
  - @domain/entity-currency-token@0.5.5
  - @ledgerhq/coin-algorand@2.3.1
  - @ledgerhq/coin-casper@3.5.1
  - @ledgerhq/coin-concordium@1.5.1
  - @ledgerhq/coin-icon@0.31.1
  - @ledgerhq/coin-internet_computer@1.32.1
  - @ledgerhq/coin-mina@1.24.2
  - @ledgerhq/coin-ton@0.39.1
  - @ledgerhq/coin-vechain@4.3.2
  - @ledgerhq/live-signer-evm@0.24.1
  - @ledgerhq/live-signer-icp@0.1.9
  - @ledgerhq/live-signer-solana@0.22.1
  - @ledgerhq/live-signer-aleo@0.19.14
  - @ledgerhq/device-core@0.11.19
  - @ledgerhq/live-signer-canton@0.9.23
  - @ledgerhq/live-signer-celo@1.2.10
  - @ledgerhq/live-signer-cosmos@0.6.1
  - @ledgerhq/live-signer-polkadot@0.1.1
  - @ledgerhq/live-signer-zcash@0.10.0
  - @features/platform-aggregated-assets@0.5.6
  - @features/platform-env@0.4.2
  - @ledgerhq/ledger-cal-service@1.19.9
  - @ledgerhq/ledger-trust-service@0.8.20
  - @ledgerhq/live-signer-tron@0.2.1
  - @domain/entity-account-name@0.2.2
  - @domain/entity-currency-fiat@0.4.0
  - @domain/entity-currency-unit@0.3.0
  - @domain/entity-interest-rate@0.3.0
  - @domain/entity-recent-addresses@0.2.1
  - @features/platform-device-intent@5.2.0
  - @ledgerhq/hw-app-algorand@6.36.0
  - @ledgerhq/hw-app-aptos@6.39.0
  - @ledgerhq/hw-app-btc@11.6.0
  - @ledgerhq/hw-app-hedera@1.7.0
  - @ledgerhq/hw-app-icon@1.8.0
  - @ledgerhq/hw-app-kaspa@1.7.7
  - @ledgerhq/hw-app-polkadot@6.39.0
  - @ledgerhq/hw-app-str@7.8.0
  - @ledgerhq/hw-app-tezos@6.37.0
  - @ledgerhq/hw-app-trx@6.37.0
  - @ledgerhq/hw-app-vet@0.14.0
  - @ledgerhq/hw-app-xrp@6.38.0
  - @ledgerhq/live-signer-concordium@0.9.2
  - @ledgerhq/live-signer-hyperliquid@1.3.2
  - @ledgerhq/live-signer-xrp@0.2.1

## 38.3.0-next.1

### Minor Changes

- [#23297](https://github.com/LedgerHQ/ledger-live/pull/23297) [`2989e37`](https://github.com/LedgerHQ/ledger-live/commit/2989e37b80b8bfcaae549cc02aa6de189a69dfef) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(solana): refresh the blockhash after the device review to avoid "Blockhash not found"

### Patch Changes

- Updated dependencies [[`2989e37`](https://github.com/LedgerHQ/ledger-live/commit/2989e37b80b8bfcaae549cc02aa6de189a69dfef)]:
  - @ledgerhq/ledger-wallet-framework@3.7.0-next.1
  - @ledgerhq/coin-solana@2.4.0-next.1
  - @ledgerhq/asset-aggregation@0.18.0-next.1
  - @ledgerhq/coin-aleo@2.7.0-next.1
  - @ledgerhq/coin-algorand@2.3.1-next.1
  - @ledgerhq/coin-aptos@4.4.0-next.1
  - @ledgerhq/coin-bitcoin@0.55.0-next.1
  - @ledgerhq/coin-canton@1.4.0-next.1
  - @ledgerhq/coin-cardano@2.0.0-next.1
  - @ledgerhq/coin-casper@3.5.1-next.1
  - @ledgerhq/coin-celo@3.5.0-next.1
  - @ledgerhq/coin-concordium@1.5.1-next.1
  - @ledgerhq/coin-cosmos@1.6.0-next.1
  - @ledgerhq/coin-filecoin@2.4.0-next.1
  - @ledgerhq/coin-hedera@2.7.0-next.1
  - @ledgerhq/coin-icon@0.31.1-next.1
  - @ledgerhq/coin-internet_computer@1.32.1-next.1
  - @ledgerhq/coin-kaspa@2.5.0-next.1
  - @ledgerhq/coin-mina@1.24.2-next.1
  - @ledgerhq/coin-multiversx@1.4.0-next.1
  - @ledgerhq/coin-near@1.4.0-next.1
  - @ledgerhq/coin-polkadot@8.0.0-next.1
  - @ledgerhq/coin-stacks@0.33.0-next.1
  - @ledgerhq/coin-sui@2.1.0-next.1
  - @ledgerhq/coin-ton@0.39.1-next.1
  - @ledgerhq/coin-vechain@4.3.2-next.1
  - @ledgerhq/coin-zcash@0.11.0-next.1
  - @ledgerhq/live-signer-evm@0.24.1-next.1
  - @ledgerhq/live-signer-icp@0.1.9-next.1
  - @ledgerhq/live-signer-solana@0.22.1-next.1
  - @ledgerhq/live-signer-aleo@0.19.14-next.1
  - @ledgerhq/live-signer-canton@0.9.23-next.1
  - @ledgerhq/live-signer-celo@1.2.10-next.1
  - @ledgerhq/live-signer-concordium@0.9.2-next.1
  - @ledgerhq/live-signer-cosmos@0.6.1-next.1
  - @ledgerhq/live-signer-polkadot@0.1.1-next.1
  - @ledgerhq/coin-tron@10.1.0-next.0
  - @ledgerhq/wallet-btc@0.7.0-next.0

## 38.3.0-next.0

### Minor Changes

- [#22519](https://github.com/LedgerHQ/ledger-live/pull/22519) [`d60f240`](https://github.com/LedgerHQ/ledger-live/commit/d60f240af5f814d887bb2df19db8415425b52317) Thanks [@semeano](https://github.com/semeano)! - feat(stacks): add desktop stake and unstake flows

  coin-stacks: `spendableBalance` now excludes locked (staked) STX for every Stacks account, matching `getBalance`, which lowers the Send max for accounts with a stake.

  coin-stacks: `validateIntent` rejects a stake during the pox-5 prepare phase (`StacksStakeInPreparePhase`), which the chain would abort while still charging the fee.

- [#22843](https://github.com/LedgerHQ/ledger-live/pull/22843) [`c954015`](https://github.com/LedgerHQ/ledger-live/commit/c954015d149a86adc8a1cdfcda41a71313171b68) Thanks [@semeano](https://github.com/semeano)! - feat(stacks): add mobile stake and unstake flows

- [#23043](https://github.com/LedgerHQ/ledger-live/pull/23043) [`4028b7e`](https://github.com/LedgerHQ/ledger-live/commit/4028b7e53019ef07b2e94a6559c5f8a6ba54b82f) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Hold back a per-currency fee buffer when depositing the max of a native coin into perps, configured by the new `ptxTradeMaxConstant` flag (`feature_ptx_trade_max_constant`). Only the MAX ratio is reduced; token accounts and other ratios are unchanged.

- [#22860](https://github.com/LedgerHQ/ledger-live/pull/22860) [`21fa5a5`](https://github.com/LedgerHQ/ledger-live/commit/21fa5a533d3369db9586a38d6fa869f8c03121af) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Send the user back to the perps deposit form when they retry after a "not enough balance" error. Retrying re-ran the same deposit, which could only fail again; the form now reopens with the draft amount and funding account so the amount can be lowered. Other errors still retry in place

- [#22856](https://github.com/LedgerHQ/ledger-live/pull/22856) [`438c7b3`](https://github.com/LedgerHQ/ledger-live/commit/438c7b3035ac460e702d294a3c17db2843962d21) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Hide accounts that cannot send, such as HyperCore, from the perps deposit funding picker. The receiving HyperCore account was still offered as a funding source even though a deposit cannot be sent from it. The picker now opens in the `perpetuals:fund` flow, which rejects send-disabled families, so modular dialog analytics from that picker report `flow: "perpetuals:fund"`

- [#22890](https://github.com/LedgerHQ/ledger-live/pull/22890) [`ee95a8e`](https://github.com/LedgerHQ/ledger-live/commit/ee95a8e0c4cdce091dfc1cb0e9b54445030f079c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - fix(cg-client): remove the unused CoinGecko supported coins list query

  Removes `getSupportedCoinsList`, `useGetSupportedCoinsListQuery`, `useSupportedCurrencies`, `MarketCoinSchema`, `SupportedCoinsSchema` and the `MarketCoin` / `SupportedCoins` types. `useMarketDataProvider` now only returns `supportedCounterCurrencies`.

- [#23189](https://github.com/LedgerHQ/ledger-live/pull/23189) [`b9da45c`](https://github.com/LedgerHQ/ledger-live/commit/b9da45cd99b74603ac760b08cf748d60f9bb4a2f) Thanks [@cted-ledger](https://github.com/cted-ledger)! - add the zcash testnet currency config and register it with the bitcoin family

- [#22973](https://github.com/LedgerHQ/ledger-live/pull/22973) [`20484ff`](https://github.com/LedgerHQ/ledger-live/commit/20484ff8d7cc0aab2e4b8448c7e8ce9ebf6840fe) Thanks [@semeano](https://github.com/semeano)! - feat(stacks): keep public-key account ids and persist staking positions on the generic bridge

  - New `BridgeApi.accountIdFromPublicKey` opt-in: a synced account keeps the id it was stored under, and a scanned one is keyed on the device public key, so a family whose legacy bridge keyed ids on the public key is not re-keyed by the generic bridge. Stacks opts in.
  - Stacks registers generic-bridge hooks for its estimation recipient and for persisting `stakingPositions`, which gates the Stake action.

- [#23179](https://github.com/LedgerHQ/ledger-live/pull/23179) [`f047501`](https://github.com/LedgerHQ/ledger-live/commit/f047501381efde857b48c1314d2de637fdce8ade) Thanks [@amaslakov](https://github.com/amaslakov)! - Sum Tezos native balance partitions in the generic adapter, behind a new opt-in `partitionsNativeBalance` bridge flag

- [#22436](https://github.com/LedgerHQ/ledger-live/pull/22436) [`23455ab`](https://github.com/LedgerHQ/ledger-live/commit/23455abfdc26b44eedd77a1c990a6721dadd3f5c) Thanks [@ysitbon](https://github.com/ysitbon)! - Add the countervalues domain api: rate fetching, and the orchestration that folds rates into the entity state.

  - `@domain/api-market-countervalues` owns the Countervalues Service endpoints and `loadCountervalues`, which moves out of `@ledgerhq/live-countervalues`.
  - The endpoints are injected into the shared countervalues api from `@shared/api-services` instead of standing up a second slice. The duplicate client in live-common is removed, so each app registers one countervalues reducer where it previously registered two against the same host. That slice is an RTK Query cache and is not persisted, so there is no stored state to migrate.
  - `loadCountervalues` takes its rates as an argument rather than reaching for a module-level client. The apps compose one in the countervalues bridge they already own; tests pass a mock directly, which removes the `MOCK_COUNTERVALUES` dispatcher hidden inside the fetch path.
  - Rate failures carry the HTTP status through unchanged, so an unsupported pair still clears its cache on 422, an HTTP failure still increments the per-pair backoff, and an offline period still does not.
  - Rate requests keep the previous request policy: a 60s timeout, so a hung connection can no longer stall countervalues polling, and the same retries as before. The two endpoints moved out of live-common keep not retrying.
  - `@ledgerhq/live-countervalues` drops `loadCountervalues`, its `api` entry point and the fetch contract types, and with them its dependencies on `@ledgerhq/logs`, `@ledgerhq/live-network`, `@ledgerhq/live-promise` and `@ledgerhq/live-env`. It no longer reaches the network.
  - web-tools now registers the shared countervalues api, which its portfolio countervalues loading dispatches through.
  - `cvsApiExtra` takes `getCountervaluesServiceUrl`, a getter read on every request, in place of the `countervaluesServiceUrl` string read once at store creation. Switching the developer staging toggle now applies to the next countervalues request again, as it did before the rates moved onto the shared api.

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

- [#22760](https://github.com/LedgerHQ/ledger-live/pull/22760) [`abf8d33`](https://github.com/LedgerHQ/ledger-live/commit/abf8d33f65a4177d2ab8c727c2b53c2b4439c676) Thanks [@ishaba](https://github.com/ishaba)! - Pay the Tronify energy rent in USDT instead of TRX: coin-tron offers it on USDT transfers only and rejects a rent payment that stays valid past the delivery window, and the default Tron config points at the Ledger Tronify proxy.

- [#23209](https://github.com/LedgerHQ/ledger-live/pull/23209) [`bc85ada`](https://github.com/LedgerHQ/ledger-live/commit/bc85ada15c9403d1180d5af23f730196fd0cc672) Thanks [@qperrot](https://github.com/qperrot)! - fix(coin-cardano): stop resolving the currency with `getCryptoCurrencyById`

  The module no longer needs the host currencies resolver. The network is read from a new required
  `testnet` field of the Cardano coin config, served `false` in `config_currency_cardano` and `true` in
  a new `config_currency_cardano_testnet`. `createApi(currencyId)` resolves the config with
  `context.config()` and uses its `currencyId` directly where the id itself is needed (operation ids,
  TTL, network parameters, pool bech32 ids), so no `id` is added to the config. The bridge resolves the
  config for the account's currency instead of always reading `cardano`.

  Breaking: `CardanoConfig` requires `testnet`. `isTestnet`, `lastBlock`, `getValidators`, `getBalance`,
  `getStakes`, `broadcast`, `validateIntent`, `fetchDelegation`, `getTransactions` and the api fetchers
  (`fetchNetworkInfo`, `fetchLatestBlock`, `fetchEpochInfo`, `fetchPoolList`, `fetchPoolDetails`,
  `getDelegationInfo`, `getAllTransactionsByKeys`, `submitTransaction`) take the coin config instead of
  a currency, as first parameter. `listOperations`, `craftTransaction`, `buildUnsignedTransaction` and
  `estimateFees` take `(config, currencyId, ...)`. The live-common `fetchPoolDetails` and
  `useCardanoFamilyPools` keep taking a currency and resolve its config.

- [#22639](https://github.com/LedgerHQ/ledger-live/pull/22639) [`0c507ff`](https://github.com/LedgerHQ/ledger-live/commit/0c507ffb0964a6bfbd221ecd83f00d0259921ada) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Update @ledgerhq/coin-evm to 9.0.1 and pass a logger to its APIs

- [#23083](https://github.com/LedgerHQ/ledger-live/pull/23083) [`4c28d72`](https://github.com/LedgerHQ/ledger-live/commit/4c28d726d50493ed3967c1a7eb84392442dfbeb9) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump `@ledgerhq/ledger-key-ring-protocol`, `@ledgerhq/hw-ledger-key-ring-protocol` to 1.0.0 and `@ledgerhq/evm-tools` to 2.0.0 (ts-libs). No API change.

- [#23178](https://github.com/LedgerHQ/ledger-live/pull/23178) [`e308deb`](https://github.com/LedgerHQ/ledger-live/commit/e308deb3e4f812f01166de17bb28c587a290b9bb) Thanks [@benruseau](https://github.com/benruseau)! - Add the OS updates orchestrator React layer: a generic `OsUpdatesOrchestratorComponent` and `useOsUpdatesOrchestrator` hook in live-common that render platform-injected components for each step

  Add the mobile pre-checks, create backup, apply updates and restore backup components, and persist the device backup in the app storage

  Use the real components in the OS updates orchestrator debug screen

  Fix the OS updates apply step after a bootloader recovery: when the device comes back on an OS, install the first update of the resolved path from its OSU firmware instead of its final firmware, which skipped an update

- [#23184](https://github.com/LedgerHQ/ledger-live/pull/23184) [`3dda070`](https://github.com/LedgerHQ/ledger-live/commit/3dda0705f09d0e0da75ebde9a76b17ba7a9f65e6) Thanks [@CremaFR](https://github.com/CremaFR)! - Retry a swap up to twice, without showing the error, when the Exchange app rejects the provider signature (`signVerificationFail` at `CHECK_TRANSACTION_SIGNATURE`). `executeSwap` requests a new nonce and calls `/swap` again with the same parameters. Each rejected attempt is still reported to `/swap/cancelled`, with the attempt in the error message: `Signature verification failed Code: R0` for the first attempt, then `R1` and `R2` for the retries. This replaces the `[diagnostic=…]` signature classification, which is removed

- [#22745](https://github.com/LedgerHQ/ledger-live/pull/22745) [`db3bde1`](https://github.com/LedgerHQ/ledger-live/commit/db3bde1a0ea2435389260b012d9759dd26f7b174) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Canton: hide Accept once an offer expires while the screen is open, and show a clear message instead of retry when accepting an expired offer

- [#23008](https://github.com/LedgerHQ/ledger-live/pull/23008) [`ac0379e`](https://github.com/LedgerHQ/ledger-live/commit/ac0379ea0511dd457d6bba6a540d48b8358f4f93) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(send): show a broadcast error on the new send flow confirmation and only offer to try again for temporary errors (network, server, locked device)

- [#22583](https://github.com/LedgerHQ/ledger-live/pull/22583) [`33467b2`](https://github.com/LedgerHQ/ledger-live/commit/33467b29525ab06b0abce96ed8489a61a01429c5) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Implement getStakes and getValidators on the CoinModuleApi surface, and report the bonded/unbonding portions from getBalance

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

- [#22620](https://github.com/LedgerHQ/ledger-live/pull/22620) [`3347eb8`](https://github.com/LedgerHQ/ledger-live/commit/3347eb88f282e2286b43493dadb0a9dd3d1f81d5) Thanks [@henri-ly](https://github.com/henri-ly)! - Keep WalletConnect `cosmos_signAmino` working on the generic bridge: `BridgeApi.signRawOperation` lets a family replace the generic raw signing (craft, sign, combine) with its own. Cosmos registers its verbatim, detached-signature implementation there, the one its legacy bridge already uses. `account.getPublicKey` now returns the Cosmos account public key instead of the address legacy accounts keep in `xpub`.

- [#22786](https://github.com/LedgerHQ/ledger-live/pull/22786) [`e80d009`](https://github.com/LedgerHQ/ledger-live/commit/e80d009b57fbec125c43649fcc0b21edc60cb473) Thanks [@ysitbon](https://github.com/ysitbon)! - Docs and comments only: stop naming `@ledgerhq/live-countervalues`, which has been removed. READMEs and comments now point at `@domain/entity-market-countervalues`, or at live-common for `getPortfolio`. No code change.

- [#23194](https://github.com/LedgerHQ/ledger-live/pull/23194) [`90e805d`](https://github.com/LedgerHQ/ledger-live/commit/90e805d9c1b0ef536d1e53489c73b88056731993) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Remove 20 dead EVM chains (akroma, atheios, callisto, dexon, ellaism, ether1, ethergem, ethersocial, expanse, gochain, hpb, mix, musicoin, pirl, poa, reosc, thundercore, tomo, ubiq, wanchain)

- [#22996](https://github.com/LedgerHQ/ledger-live/pull/22996) [`1f50e41`](https://github.com/LedgerHQ/ledger-live/commit/1f50e41fc85d46eec8ffdec4d27ab573a5cbb28e) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop `@ledgerhq/live-hooks`: `useDebounce` and a simpler `useThrottledValues` now live in `@ledgerhq/live-common/hooks`.

- [#22967](https://github.com/LedgerHQ/ledger-live/pull/22967) [`3dae3bb`](https://github.com/LedgerHQ/ledger-live/commit/3dae3bb200941b7e8ed4e56485e401fda188de8b) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(llc): import Stellar burn address from the SDK

- [#22795](https://github.com/LedgerHQ/ledger-live/pull/22795) [`ff5e1b0`](https://github.com/LedgerHQ/ledger-live/commit/ff5e1b0f5a315aaccd3e23aeb8ccd2c7d48730f4) Thanks [@ysitbon](https://github.com/ysitbon)! - refactor(feature-flags): move the Firebase Remote Config mapping to `@features/platform-feature-flags-firebase`

  `@features/platform-feature-flags` now only exposes resolved flag state (hooks and `FeatureToggle`). `formatToFirebaseFeatureId`, `formatDefaultFeatures`, `parseFirebaseFeatures` and `RemoteConfigValue` are imported from `@features/platform-feature-flags-firebase` instead; the `./firebase` subpath is removed. No behavior change.

- [#22835](https://github.com/LedgerHQ/ledger-live/pull/22835) [`7bf8668`](https://github.com/LedgerHQ/ledger-live/commit/7bf8668bea3ae36c1a5c176bc5538311bafbee3d) Thanks [@qperrot](https://github.com/qperrot)! - Fix: new unichain and zksync explorer endpoint

- [#22950](https://github.com/LedgerHQ/ledger-live/pull/22950) [`dccba0c`](https://github.com/LedgerHQ/ledger-live/commit/dccba0c7481c705b4a295942171891deff1c0e85) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Compute the firmware distribution salt of the non-DMK firmware update checks from the identities store instead of the USER_ID env, so they use the same salt as the DMK

- [#22596](https://github.com/LedgerHQ/ledger-live/pull/22596) [`7ff8f5b`](https://github.com/LedgerHQ/ledger-live/commit/7ff8f5b518a19e73005ef974121ce21e593a8e99) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(llc): read `chainId` from config

- [#22609](https://github.com/LedgerHQ/ledger-live/pull/22609) [`826a87c`](https://github.com/LedgerHQ/ledger-live/commit/826a87c08f3757ed3b1fd63f217ed9493082811d) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat(hedera): persist hederaResources on the generic adapter

- [#22913](https://github.com/LedgerHQ/ledger-live/pull/22913) [`6bb4b44`](https://github.com/LedgerHQ/ledger-live/commit/6bb4b44d94a29c3eb8eaffaafda55ca9d6934e2b) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat(hedera): migrate desktop Hedera flows to the generic transaction shape and enable generic adapter

- [#22564](https://github.com/LedgerHQ/ledger-live/pull/22564) [`9c9cae5`](https://github.com/LedgerHQ/ledger-live/commit/9c9cae5ab492b74d52b13e0a5b0673bd681f8d9d) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat(hedera): add the family layer for the generic adapter

- [#22939](https://github.com/LedgerHQ/ledger-live/pull/22939) [`c59fbf4`](https://github.com/LedgerHQ/ledger-live/commit/c59fbf41212398e3d0c1000c776d33c6344290a3) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - chore(hedera): migrate from @hashgraph/sdk 2.78.0 to @hiero-ledger/sdk 2.84.0
  fix(hedera): keep the nonce when serializing generic transactions

- [#22610](https://github.com/LedgerHQ/ledger-live/pull/22610) [`dd2d1f8`](https://github.com/LedgerHQ/ledger-live/commit/dd2d1f8965897befc6e49f041eeccc51deb9578c) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat(hedera): restore legacy prepare-transaction parity on the generic adapter

- [#22608](https://github.com/LedgerHQ/ledger-live/pull/22608) [`b8fc9af`](https://github.com/LedgerHQ/ledger-live/commit/b8fc9af53fc59427695bb0fe81d11d46ef74742e) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat(hedera): add the tokenAssociate mode to the generic adapter

- [#22985](https://github.com/LedgerHQ/ledger-live/pull/22985) [`4182256`](https://github.com/LedgerHQ/ledger-live/commit/4182256c2213208e330861b904a6d8859d1b3e60) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix(hedera): generic adapter fixes for fee estimation, wallet API memo, token association wording, token receive and swap history saved by the legacy bridge

- [#22593](https://github.com/LedgerHQ/ledger-live/pull/22593) [`0a65851`](https://github.com/LedgerHQ/ledger-live/commit/0a65851ea6de6228030a2c94f0cad2234903db2b) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - chore(llc): Backfill the now-mandatory `name`/`unit` fields

- [#22743](https://github.com/LedgerHQ/ledger-live/pull/22743) [`4d9cfbd`](https://github.com/LedgerHQ/ledger-live/commit/4d9cfbd7eff1fb20fb2052b0a2f2b21ea87ba052) Thanks [@ysitbon](https://github.com/ysitbon)! - Import the countervalues logic, types, helpers and mocks from `@domain/entity-market-countervalues` instead of `@ledgerhq/live-countervalues`, and depend on the entity package in place of the legacy one. Specifier change only, no behaviour change.

  Three app tests move with live-common because the `calculate` they mock is called inside live-common: desktop's `useHistoryOperations` and mobile's `useOperationsListViewModel` and `useOperationsV1`. Their mock has to name the same module live-common imports.

- [#22932](https://github.com/LedgerHQ/ledger-live/pull/22932) [`09db449`](https://github.com/LedgerHQ/ledger-live/commit/09db4497ad5e67c6510e87608d694bd06963213e) Thanks [@ysitbon](https://github.com/ysitbon)! - Read the countervalues hooks from `@features/platform-market-countervalues`. In live-common, `useSyncSources`, the portfolio hooks and `useAssetDistribution` take `useCountervaluesPolling` and `useCountervaluesState` from it instead of `@ledgerhq/live-countervalues-react`, and `useAssetChartDataInCounterValue` and the right market trend module take its `useUsdToFiatRate` instead of live-common's own. asset-detail's `useAssetMarketData` does the same. live-common drops its `@ledgerhq/live-countervalues-react` dependency and keeps exporting `counterValues/*` while the apps still import it. Specifier change only, no behaviour change.

- [#22808](https://github.com/LedgerHQ/ledger-live/pull/22808) [`bac3334`](https://github.com/LedgerHQ/ledger-live/commit/bac3334a1c58495722e2c5a123c7d2a26b0c8d7d) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Upgrade @ledgerhq/coin-evm to version 10.0.0 and remove obsolete gas tracker parameters

- [#21849](https://github.com/LedgerHQ/ledger-live/pull/21849) [`82946e5`](https://github.com/LedgerHQ/ledger-live/commit/82946e53e676943851a8a9e153bafc641a40778b) Thanks [@pawell24](https://github.com/pawell24)! - Prepare NEAR for the generic coin-framework bridge (LIVE-36413).

  - `live-common`: new LiveConfig key `config_near_generic_bridge` (default `false`) gates the NEAR generic route, so it ships dormant and can be enabled or rolled back remotely. `families/near/accountRawAssign.ts` carries both `stakingPositions` and the legacy `nearResources` blob through serialization, in each direction, so an account persisted before the migration keeps the data the UI falls back to. `families/near/bridgeExtensions.ts` exposes the estimation recipient. `families/near/bridge/api.ts` declares `describeOptimisticOperation`, typing a pending withdrawal `WITHDRAW_UNSTAKED` to match what the indexer produces rather than the generic `WITHDRAW_UNBONDED`, which `getMaxAmount` would not have netted out.
  - `coin-near`: `Transaction.fees` widened to `BigNumber | null` and `nonce` added, both round-tripping through `transaction.ts`. Fees serialize with `toFixed`, so a yocto-denominated fee no longer persists in exponential notation, and a missing nonce revives as zero instead of sending `signOperation` into the unimplemented `getNextSequence`. `preload-data.ts` seeds the gas price and the `min_gas_purchase_price` floor with their mainnet values, so `canStake` prices staking at what the chain charges — rather than at zero, or at a tenth of it — on a route that never runs `preload()`.

- [#22606](https://github.com/LedgerHQ/ledger-live/pull/22606) [`f9ebcf6`](https://github.com/LedgerHQ/ledger-live/commit/f9ebcf6d2b79758ea43554977a8997df25c4e3b4) Thanks [@pawell24](https://github.com/pawell24)! - Add NEAR to `genericCoinFrameworkFamilies.json` (LIVE-36413). The route stays behind the `config_near_generic_bridge` LiveConfig key, which defaults to `false`, so NEAR keeps running on the legacy bridge until the key is enabled remotely.

- [#21731](https://github.com/LedgerHQ/ledger-live/pull/21731) [`99f7c87`](https://github.com/LedgerHQ/ledger-live/commit/99f7c87afc8029eca9bf574df03123bf07ca7810) Thanks [@ishaba](https://github.com/ishaba)! - feat(tron): sponsored-send energy-rent logic and the SponsoredCoinApi seam

- [#22977](https://github.com/LedgerHQ/ledger-live/pull/22977) [`c26bbea`](https://github.com/LedgerHQ/ledger-live/commit/c26bbea7477d27f6042657c3a3c48c05f85b1f59) Thanks [@ysitbon](https://github.com/ysitbon)! - `@features/platform-market-countervalues` is now the only countervalues React glue in the monorepo.

  - The platform package no longer exports `CountervaluesContext`. It was public only so the old React package could share one context during the migration. Read countervalues through the package hooks, under a `CountervaluesProvider`.
  - live-common no longer has `counterValues/*`: its own `useUsdToFiatRate` and `useGetCounterValueIdsPolling` are removed. Import both from `@features/platform-market-countervalues`.

- [#22858](https://github.com/LedgerHQ/ledger-live/pull/22858) [`f45fc80`](https://github.com/LedgerHQ/ledger-live/commit/f45fc8027562e53cdbd3500a2884084df6a4af8e) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Make coin-polkadot stateless: `createBridges` takes a `Context`, endpoints, tuning and cache TTLs come from `config_currency_polkadot`, logs go through `context.logger`, and the Polkadot env variables are removed.

- [#22654](https://github.com/LedgerHQ/ledger-live/pull/22654) [`78b38fb`](https://github.com/LedgerHQ/ledger-live/commit/78b38fb3820d3391c5c04812fee88c1c2a6e9289) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(send): sync account at the start of a send

- [#22560](https://github.com/LedgerHQ/ledger-live/pull/22560) [`18166fb`](https://github.com/LedgerHQ/ledger-live/commit/18166fbe8719d50c911aa0ab349e68c414f8fc62) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat(framework): optional `addressLookup` bridge hook for network-assigned addresses + wire Hedera's lookup and local coin module API

- [#22704](https://github.com/LedgerHQ/ledger-live/pull/22704) [`339d174`](https://github.com/LedgerHQ/ledger-live/commit/339d17482fba108dfca790c2500c697a818f7a1c) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - Support minHeight in Hedera listOperations for incremental sync, return finalized operations only and revive stakedAmount as BigNumber on the generic adapter

- [#23115](https://github.com/LedgerHQ/ledger-live/pull/23115) [`3160fa7`](https://github.com/LedgerHQ/ledger-live/commit/3160fa7a2f2a6e121d15766609902e83f4efc71f) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add fromLegacyAccount and toLegacyAccount to convert between a legacy account and an AccountDescriptor

- [#22770](https://github.com/LedgerHQ/ledger-live/pull/22770) [`812d03f`](https://github.com/LedgerHQ/ledger-live/commit/812d03f74d4324c2b165d4fb67fb3b31834d2b67) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Resolve the Perps `custom.perps.deposit` request with the swap ID and quoted amount once the deposit is broadcast, and reject it when the user cancels. The deposit request now lives in `wallet-api/Perps/depositRequest` and is shared by desktop and mobile

- [#22801](https://github.com/LedgerHQ/ledger-live/pull/22801) [`5e611ff`](https://github.com/LedgerHQ/ledger-live/commit/5e611ffffdcf2c73fb55c8b673693dfa88d1077c) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(llc): send ERC-20 transactions on Arc swap with CEX

- [#21839](https://github.com/LedgerHQ/ledger-live/pull/21839) [`6d744e0`](https://github.com/LedgerHQ/ledger-live/commit/6d744e0d30b4480282d35c359d096f3f6d6602af) Thanks [@YazhuEth](https://github.com/YazhuEth)! - `estimateFees` now returns the recipient token account, wallet address and input type of an SPL transfer alongside its fee, so the device screen names the destination; a recipient token account holding another token throws `SolanaTokenAccountHoldsAnotherToken`.

  `makeEmptyTokenAccount` now builds its id with `encodeTokenAccountId`, like the fourteen families that already do: the wallet-API placeholder previously used the contract address, so it matched no real sub-account id.

  Solana runs on the generic coin framework. The send and staking screens move onto the generic transaction shape, which names what it does — a mode, a memo, a stake account seed — instead of the nested command model the legacy bridge carried, and the apps now read it through one family module rather than reaching into the transaction themselves.

  The behaviours the legacy bridge produced are restored on the generic path: an incoming SPL transfer produces an operation, a stake withdrawal empties the account rather than signing a stale amount, opening a token account is charged its rent, sending the maximum to a new stake account leaves enough to unstake it later, the device confirmation screen lists every row the device itself shows, and a token account's frozen state and Token-2022 extensions are back on screen.

  A live app can again submit the four token and stake commands the wallet API defines, and a raw signature it gets back is hex, as the field it arrives in says. The device signer is selected through the family's own factory, so the `ldmkSolanaSigner` flag and the transaction-check option it carries keep deciding, as they did before. The mock bridge is rewritten on the coin module, so a mocked signature still yields a transaction the wallet API can deserialize.

- [#22897](https://github.com/LedgerHQ/ledger-live/pull/22897) [`644071b`](https://github.com/LedgerHQ/ledger-live/commit/644071ba1aba85cdce57c423934be80f91639155) Thanks [@henri-ly](https://github.com/henri-ly)! - fix(coin-solana): seed `useAllAmount` on the generic Solana transaction so the legacy send flows show the Max switch again

- [#22852](https://github.com/LedgerHQ/ledger-live/pull/22852) [`6756f58`](https://github.com/LedgerHQ/ledger-live/commit/6756f5881526607858dbc2ba3d8065e5453b2d5a) Thanks [@koda-apps](https://github.com/apps/koda-apps)! - Enable Token-2022 by default for Solana

- [#23085](https://github.com/LedgerHQ/ledger-live/pull/23085) [`7073e2d`](https://github.com/LedgerHQ/ledger-live/commit/7073e2d835a79e3e014ca1a9631e73c1f21989c6) Thanks [@semeano](https://github.com/semeano)! - Route Stacks through the generic coin framework by adding it to `genericCoinFrameworkFamilies.json` (LIVE-36417). The `config_stacks_generic_bridge` LiveConfig key defaults to `true` and can be turned off remotely to fall back to the legacy bridge.

- [#23085](https://github.com/LedgerHQ/ledger-live/pull/23085) [`35d9396`](https://github.com/LedgerHQ/ledger-live/commit/35d9396f690292ae8efda27b24ac4143f03cd00b) Thanks [@semeano](https://github.com/semeano)! - Align Stacks operations synced through the generic coin framework with the legacy bridge: a native STX send is no longer valued with its fee counted twice, a send-many is one OUT for the whole batch with a sub-operation per recipient, operations carry their nonce and fee payer, and an account switched back to the legacy bridge rebuilds its history instead of merging it.

- [#23112](https://github.com/LedgerHQ/ledger-live/pull/23112) [`7f0d867`](https://github.com/LedgerHQ/ledger-live/commit/7f0d867cc9f8715b9244979e42a035babe43d2ab) Thanks [@amaslakov](https://github.com/amaslakov)! - Harden the Tronify rent payment: Retry stays locked until a payment that may still land has expired, a rent price rise is shown and must be accepted before ordering again, a signed payment about to expire is refused before broadcast, and the unreachable contract-data failure is removed.

- [#22059](https://github.com/LedgerHQ/ledger-live/pull/22059) [`91ac227`](https://github.com/LedgerHQ/ledger-live/commit/91ac22740fbf677ca481382eb55d2e4e12336d2a) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(cosmos): Migrate the desktop staking UI onto the generic path

- [#22760](https://github.com/LedgerHQ/ledger-live/pull/22760) [`4bab512`](https://github.com/LedgerHQ/ledger-live/commit/4bab512f050d8f4d49a7745104b278ec94dd1d20) Thanks [@ishaba](https://github.com/ishaba)! - Add the Tronify sponsored send to the desktop Send flow behind the `gasSponsorship` flag: a USDT transfer can pay its network fee with rented energy, signing the rent payment first, then the transfer once the energy is delivered on-chain.

- [#23031](https://github.com/LedgerHQ/ledger-live/pull/23031) [`3264580`](https://github.com/LedgerHQ/ledger-live/commit/3264580e247bbd35d774b33eae21cc7c2e87d105) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Pass `swapApiEnv` (`stg` | `prd`) to the Swap live app so it follows Wallet's Swap backend

  - Derived from the `SWAP_API_BASE` url via new `getSwapAPIEnv` helper in live-common
  - Unknown hosts (e.g. localhost) send nothing; the live app keeps its own default
  - Stop passing the full `swapApiBase` url; the live app no longer reads it

- [#22953](https://github.com/LedgerHQ/ledger-live/pull/22953) [`f482212`](https://github.com/LedgerHQ/ledger-live/commit/f48221278738b5b3accf7199c23e6dd84c48c27e) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - chore(device): remove the legacy connectApp and the ldmkConnectApp feature flag

  `connectApp` and `connectManager` now always use the Device Management Kit device actions and fail
  with `DmkTransportRequired` on a non-DMK transport. `apps/inlineAppInstall`, `hw/isUpdateAvailable`
  and `DeviceManagementKitTransport.listenLegacyConnectApp` are removed.

- [#22582](https://github.com/LedgerHQ/ledger-live/pull/22582) [`766d1eb`](https://github.com/LedgerHQ/ledger-live/commit/766d1ebf51eccbbaefd0b3d47b07f3e3b8672775) Thanks [@michalmisiejuk-ext-collab](https://github.com/michalmisiejuk-ext-collab)! - Remove the unused unauthenticated standalone swap quotes store

- [#22775](https://github.com/LedgerHQ/ledger-live/pull/22775) [`3cdcba9`](https://github.com/LedgerHQ/ledger-live/commit/3cdcba9252780b413452cb100682cf08041d966e) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(coin-cosmos): surface validator bond status

- [#23223](https://github.com/LedgerHQ/ledger-live/pull/23223) [`0a5b68d`](https://github.com/LedgerHQ/ledger-live/commit/0a5b68d609355af795c6176a4ac30c5b7142c2eb) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix(hedera): skip association for erc-20 tokens in ReceiveWithAssociationModal and resolve the new association token in the legacy adapter

- [#22989](https://github.com/LedgerHQ/ledger-live/pull/22989) [`8312d68`](https://github.com/LedgerHQ/ledger-live/commit/8312d6818aa5fa37f523352f81f51a61dd502bf2) Thanks [@gre-ledger](https://github.com/gre-ledger)! - chore: take `uuid` from the pnpm catalog (11.1.0)

  `uuid` was spread over 8.3.2, 9.0.1 and 11.1.0. Every package now uses the catalog entry. `@types/uuid` is dropped: 11 ships its own types. The repo only imports `v4`, `v5` and `parse` (`parse` in a coin-solana test fixture), which behave the same across these majors. 11 types `v4` with overloads, so passing it directly as a callback (`useState(uuid)`) no longer typechecks and is now wrapped (`useState(() => uuid())`).

- [#22906](https://github.com/LedgerHQ/ledger-live/pull/22906) [`c5c2815`](https://github.com/LedgerHQ/ledger-live/commit/c5c2815ec53dbf88804e558952f1451f13c37bb4) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: hedera legacy bridge adapter with fixes and optimizations

- [#22632](https://github.com/LedgerHQ/ledger-live/pull/22632) [`b7cc410`](https://github.com/LedgerHQ/ledger-live/commit/b7cc41062a66145da018db31722d0df45ed98b1c) Thanks [@CremaFR](https://github.com/CremaFR)! - Add account.getMaxSpendable so live apps can request a single-account send-max estimate

- [#22949](https://github.com/LedgerHQ/ledger-live/pull/22949) [`74a7067`](https://github.com/LedgerHQ/ledger-live/commit/74a706756e9009886a490052d0f3005c6837e8b1) Thanks [@CremaFR](https://github.com/CremaFR)! - Return 0 from account.getMaxSpendable for Zcash accounts that only hold shielded funds

### Patch Changes

- Updated dependencies [[`5b62ecb`](https://github.com/LedgerHQ/ledger-live/commit/5b62ecb5c84b36099b4f29fcca9665431a468fb7), [`d60f240`](https://github.com/LedgerHQ/ledger-live/commit/d60f240af5f814d887bb2df19db8415425b52317), [`c954015`](https://github.com/LedgerHQ/ledger-live/commit/c954015d149a86adc8a1cdfcda41a71313171b68), [`4028b7e`](https://github.com/LedgerHQ/ledger-live/commit/4028b7e53019ef07b2e94a6559c5f8a6ba54b82f), [`1bf1044`](https://github.com/LedgerHQ/ledger-live/commit/1bf1044e3eb3b57187bf6c837b17b4ed00f870cc), [`5eca063`](https://github.com/LedgerHQ/ledger-live/commit/5eca063fe675ec5cb59cc96fffe4b67fcd7f3061), [`d6e7695`](https://github.com/LedgerHQ/ledger-live/commit/d6e7695bf15852c7b0cd2a97aa0a3a0c4d047d74), [`3f4e740`](https://github.com/LedgerHQ/ledger-live/commit/3f4e7409bfc66544165598c23cbc826001632f16), [`87de6a7`](https://github.com/LedgerHQ/ledger-live/commit/87de6a72f75df73aab99da6c420de00004bf7692), [`6e3211f`](https://github.com/LedgerHQ/ledger-live/commit/6e3211f6c887211d4ecfbf58d909f49c31df6179), [`ef84a7c`](https://github.com/LedgerHQ/ledger-live/commit/ef84a7cac52080143934ebf01511d24a4dcaa0f3), [`20484ff`](https://github.com/LedgerHQ/ledger-live/commit/20484ff8d7cc0aab2e4b8448c7e8ce9ebf6840fe), [`77e1044`](https://github.com/LedgerHQ/ledger-live/commit/77e10442de4ec10827edb16ecc1583490c8da7e1), [`06757be`](https://github.com/LedgerHQ/ledger-live/commit/06757be8aa253d449e4bb5b0959cf2919d14a3b8), [`e3bb812`](https://github.com/LedgerHQ/ledger-live/commit/e3bb81244302b04cf278bdd4d01f726c0190b167), [`f047501`](https://github.com/LedgerHQ/ledger-live/commit/f047501381efde857b48c1314d2de637fdce8ade), [`23455ab`](https://github.com/LedgerHQ/ledger-live/commit/23455abfdc26b44eedd77a1c990a6721dadd3f5c), [`94e247b`](https://github.com/LedgerHQ/ledger-live/commit/94e247bcaa49bd601951be6f39182ee26ed67ecc), [`bf29f88`](https://github.com/LedgerHQ/ledger-live/commit/bf29f888316e5d8d9049b763a8c77ce9850f07df), [`c9b7594`](https://github.com/LedgerHQ/ledger-live/commit/c9b75949c8f01cade6b061bd5b6ecb0af5b0ec5f), [`7a2505b`](https://github.com/LedgerHQ/ledger-live/commit/7a2505bd21cc2401e1e887cb5b9713281cb11519), [`abf8d33`](https://github.com/LedgerHQ/ledger-live/commit/abf8d33f65a4177d2ab8c727c2b53c2b4439c676), [`d33fd72`](https://github.com/LedgerHQ/ledger-live/commit/d33fd721a5d1a9363f820738f6aadbeb0a8b3cad), [`05d636b`](https://github.com/LedgerHQ/ledger-live/commit/05d636b6722285001b62bb4ea30bad32a65c5a9a), [`bc85ada`](https://github.com/LedgerHQ/ledger-live/commit/bc85ada15c9403d1180d5af23f730196fd0cc672), [`d819300`](https://github.com/LedgerHQ/ledger-live/commit/d819300df11d1e58ad33dbb8d0dbdb6f20c8dd93), [`708a1f2`](https://github.com/LedgerHQ/ledger-live/commit/708a1f22cbdb566ceed47b2277e976a66b802333), [`3dacfc2`](https://github.com/LedgerHQ/ledger-live/commit/3dacfc29377ad8a8ac25ad51f2207c882491bb7e), [`4c28d72`](https://github.com/LedgerHQ/ledger-live/commit/4c28d726d50493ed3967c1a7eb84392442dfbeb9), [`e308deb`](https://github.com/LedgerHQ/ledger-live/commit/e308deb3e4f812f01166de17bb28c587a290b9bb), [`4864e53`](https://github.com/LedgerHQ/ledger-live/commit/4864e53391f1c544e13b7593c2464f55737ccae8), [`db3bde1`](https://github.com/LedgerHQ/ledger-live/commit/db3bde1a0ea2435389260b012d9759dd26f7b174), [`33467b2`](https://github.com/LedgerHQ/ledger-live/commit/33467b29525ab06b0abce96ed8489a61a01429c5), [`0f401bb`](https://github.com/LedgerHQ/ledger-live/commit/0f401bb6289b6e78fbd05b6f98977bde4999d22a), [`3347eb8`](https://github.com/LedgerHQ/ledger-live/commit/3347eb88f282e2286b43493dadb0a9dd3d1f81d5), [`21ab07f`](https://github.com/LedgerHQ/ledger-live/commit/21ab07f8912d9c7fa9fb7e438e4e7873ca674f02), [`9ddaa97`](https://github.com/LedgerHQ/ledger-live/commit/9ddaa970d609f4b54f0cdbbda0609242cca54cf7), [`e80d009`](https://github.com/LedgerHQ/ledger-live/commit/e80d009b57fbec125c43649fcc0b21edc60cb473), [`fa2c070`](https://github.com/LedgerHQ/ledger-live/commit/fa2c070913fb13e530c65d901151c2766c46caf6), [`d1eeaab`](https://github.com/LedgerHQ/ledger-live/commit/d1eeaabf43a54a3d2c4796ea1c5b11a0b9202814), [`eb23867`](https://github.com/LedgerHQ/ledger-live/commit/eb23867603dc4e80723cdfe5486c28bc88d57014), [`90e805d`](https://github.com/LedgerHQ/ledger-live/commit/90e805d9c1b0ef536d1e53489c73b88056731993), [`e1742ea`](https://github.com/LedgerHQ/ledger-live/commit/e1742ea357bd113d34c0b29c701fd6080b9614a1), [`ff5e1b0`](https://github.com/LedgerHQ/ledger-live/commit/ff5e1b0f5a315aaccd3e23aeb8ccd2c7d48730f4), [`7ff8f5b`](https://github.com/LedgerHQ/ledger-live/commit/7ff8f5b518a19e73005ef974121ce21e593a8e99), [`63a0ec8`](https://github.com/LedgerHQ/ledger-live/commit/63a0ec8c8d20ace5ed278f21d72286dd8d75094b), [`826a87c`](https://github.com/LedgerHQ/ledger-live/commit/826a87c08f3757ed3b1fd63f217ed9493082811d), [`9c9cae5`](https://github.com/LedgerHQ/ledger-live/commit/9c9cae5ab492b74d52b13e0a5b0673bd681f8d9d), [`e294828`](https://github.com/LedgerHQ/ledger-live/commit/e294828087e36263fd917c7514d8a4583063b2b6), [`c59fbf4`](https://github.com/LedgerHQ/ledger-live/commit/c59fbf41212398e3d0c1000c776d33c6344290a3), [`dd2d1f8`](https://github.com/LedgerHQ/ledger-live/commit/dd2d1f8965897befc6e49f041eeccc51deb9578c), [`b8fc9af`](https://github.com/LedgerHQ/ledger-live/commit/b8fc9af53fc59427695bb0fe81d11d46ef74742e), [`3a45eb3`](https://github.com/LedgerHQ/ledger-live/commit/3a45eb3e29f417f24570787e76d977cefa5090d9), [`569dceb`](https://github.com/LedgerHQ/ledger-live/commit/569dceb7cdfbd97844c6a426fe421a89128b584e), [`4182256`](https://github.com/LedgerHQ/ledger-live/commit/4182256c2213208e330861b904a6d8859d1b3e60), [`5d4af5a`](https://github.com/LedgerHQ/ledger-live/commit/5d4af5acdc7e57aedd3597575a91590917acae6c), [`0a65851`](https://github.com/LedgerHQ/ledger-live/commit/0a65851ea6de6228030a2c94f0cad2234903db2b), [`3444d16`](https://github.com/LedgerHQ/ledger-live/commit/3444d16d5159b6e415b4dd0ab4fedfbf4cbeb260), [`f3b3c1c`](https://github.com/LedgerHQ/ledger-live/commit/f3b3c1c8479c2ae12d6a57eef030b04b2e665483), [`32da4ab`](https://github.com/LedgerHQ/ledger-live/commit/32da4ab268e9e9b4622604bdd6657416b128aa56), [`82946e5`](https://github.com/LedgerHQ/ledger-live/commit/82946e53e676943851a8a9e153bafc641a40778b), [`e3e6c22`](https://github.com/LedgerHQ/ledger-live/commit/e3e6c222ddba748a7e9e03e85f5919ce8e5c28bd), [`99f7c87`](https://github.com/LedgerHQ/ledger-live/commit/99f7c87afc8029eca9bf574df03123bf07ca7810), [`eb65ce4`](https://github.com/LedgerHQ/ledger-live/commit/eb65ce49ea0fa2d2c44f79fd2b0f8de365ae5e53), [`c26bbea`](https://github.com/LedgerHQ/ledger-live/commit/c26bbea7477d27f6042657c3a3c48c05f85b1f59), [`667d378`](https://github.com/LedgerHQ/ledger-live/commit/667d378b97e9102df009015e01fed6b49fd88b82), [`f45fc80`](https://github.com/LedgerHQ/ledger-live/commit/f45fc8027562e53cdbd3500a2884084df6a4af8e), [`1731458`](https://github.com/LedgerHQ/ledger-live/commit/17314582789efaad9ba35a5cf5e434a3140d6132), [`0680bcd`](https://github.com/LedgerHQ/ledger-live/commit/0680bcd3514e31d8479c4f8ceafe7cf4438a2ec1), [`6f2ecf8`](https://github.com/LedgerHQ/ledger-live/commit/6f2ecf89dd1d978038f573738d6e85fe1805b5d9), [`ff72be2`](https://github.com/LedgerHQ/ledger-live/commit/ff72be2d42151873c3a1a9a24828593bee9847ef), [`18166fb`](https://github.com/LedgerHQ/ledger-live/commit/18166fbe8719d50c911aa0ab349e68c414f8fc62), [`ef32df5`](https://github.com/LedgerHQ/ledger-live/commit/ef32df54a788270d9d01e84f05868902e82ef3c0), [`339d174`](https://github.com/LedgerHQ/ledger-live/commit/339d17482fba108dfca790c2500c697a818f7a1c), [`1a9b21e`](https://github.com/LedgerHQ/ledger-live/commit/1a9b21e6cc971d5e5b069cab968826b15332024b), [`dce4fb6`](https://github.com/LedgerHQ/ledger-live/commit/dce4fb6a4ec291153cc5b4d5a0d5000f777007e1), [`406eab8`](https://github.com/LedgerHQ/ledger-live/commit/406eab877fd65339b4e7c6272beb3daa54b3b192), [`6c8bd31`](https://github.com/LedgerHQ/ledger-live/commit/6c8bd31900a6b6aa8987cc82f6d907bbc3611fc1), [`91ad9a0`](https://github.com/LedgerHQ/ledger-live/commit/91ad9a0e481e3935f80089a800293a4733aef450), [`2b2eee6`](https://github.com/LedgerHQ/ledger-live/commit/2b2eee6a4abfb86615f3e5a628f518b5a9c58dad), [`8737f89`](https://github.com/LedgerHQ/ledger-live/commit/8737f89e2b515ab518cbcdeacc064641c6f595be), [`42d4dc2`](https://github.com/LedgerHQ/ledger-live/commit/42d4dc25044dceb9936c1907fb5ea0838fa0a64b), [`6d744e0`](https://github.com/LedgerHQ/ledger-live/commit/6d744e0d30b4480282d35c359d096f3f6d6602af), [`35d9396`](https://github.com/LedgerHQ/ledger-live/commit/35d9396f690292ae8efda27b24ac4143f03cd00b), [`c92c32e`](https://github.com/LedgerHQ/ledger-live/commit/c92c32e66d20de8a85454bf1fc444dadd3a51e76), [`77d202b`](https://github.com/LedgerHQ/ledger-live/commit/77d202b1930715ed30b62521fbc5692969b6ec47), [`9a39ad5`](https://github.com/LedgerHQ/ledger-live/commit/9a39ad5eeeaefff74791ec01db8c62c102b6e54a), [`7f0d867`](https://github.com/LedgerHQ/ledger-live/commit/7f0d867cc9f8715b9244979e42a035babe43d2ab), [`bcd25fd`](https://github.com/LedgerHQ/ledger-live/commit/bcd25fd87bda9e7e8b7c3ee2a243d3e241adc0b0), [`91ac227`](https://github.com/LedgerHQ/ledger-live/commit/91ac22740fbf677ca481382eb55d2e4e12336d2a), [`99b54cd`](https://github.com/LedgerHQ/ledger-live/commit/99b54cdac46807286d75caa1a94e61a37606c18f), [`e3c1e7b`](https://github.com/LedgerHQ/ledger-live/commit/e3c1e7b8b8d3aece13860059e593fd4489ca777d), [`f482212`](https://github.com/LedgerHQ/ledger-live/commit/f48221278738b5b3accf7199c23e6dd84c48c27e), [`766d1eb`](https://github.com/LedgerHQ/ledger-live/commit/766d1ebf51eccbbaefd0b3d47b07f3e3b8672775), [`3ac5d88`](https://github.com/LedgerHQ/ledger-live/commit/3ac5d880557971ef69834eeccbdef83d381cd801), [`3cdcba9`](https://github.com/LedgerHQ/ledger-live/commit/3cdcba9252780b413452cb100682cf08041d966e), [`8312d68`](https://github.com/LedgerHQ/ledger-live/commit/8312d6818aa5fa37f523352f81f51a61dd502bf2), [`c5c2815`](https://github.com/LedgerHQ/ledger-live/commit/c5c2815ec53dbf88804e558952f1451f13c37bb4), [`33094bc`](https://github.com/LedgerHQ/ledger-live/commit/33094bc31d9d8cd7a80b8eae3cf2b4afe3afa500)]:
  - @ledgerhq/transaction-observability@0.5.0-next.0
  - @ledgerhq/coin-stacks@0.33.0-next.0
  - @shared/feature-flags@0.26.0-next.0
  - @ledgerhq/coin-bitcoin@0.55.0-next.0
  - @ledgerhq/coin-zcash@0.11.0-next.0
  - @domain/entity-currency-crypto@0.15.0-next.0
  - @ledgerhq/wallet-btc@0.7.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.7.0-next.0
  - @ledgerhq/coin-aleo@2.7.0-next.0
  - @domain/api-market-countervalues@0.2.0-next.0
  - @domain/entity-market-countervalues@0.3.0-next.0
  - @ledgerhq/coin-cardano@2.0.0-next.0
  - @shared/env@0.10.0-next.0
  - @ledgerhq/coin-tron@10.1.0-next.0
  - @ledgerhq/live-dmk-shared@0.35.0-next.0
  - @ledgerhq/coin-near@1.4.0-next.0
  - @ledgerhq/hw-app-near@6.37.0-next.0
  - @ledgerhq/hw-app-exchange@0.29.0-next.0
  - @ledgerhq/hw-app-eth@7.11.0-next.0
  - @domain/entity-account-descriptor@0.2.0-next.0
  - @ledgerhq/coin-canton@1.4.0-next.0
  - @ledgerhq/coin-cosmos@1.6.0-next.0
  - @features/platform-market-countervalues@0.2.0-next.0
  - @ledgerhq/asset-aggregation@0.18.0-next.0
  - @domain/entity-client-identity@0.3.0-next.0
  - @features/platform-feature-flags-firebase@0.1.0-next.0
  - @features/platform-feature-flags@0.9.0-next.0
  - @domain/api-aggregated-assets@0.6.0-next.0
  - @ledgerhq/coin-hedera@2.7.0-next.0
  - @ledgerhq/coin-kaspa@2.5.0-next.0
  - @ledgerhq/coin-celo@3.5.0-next.0
  - @ledgerhq/coin-polkadot@8.0.0-next.0
  - @ledgerhq/hw-app-multiversx@6.32.0-next.0
  - @ledgerhq/coin-multiversx@1.4.0-next.0
  - @ledgerhq/coin-aptos@4.4.0-next.0
  - @ledgerhq/coin-solana@2.4.0-next.0
  - @ledgerhq/coin-filecoin@2.4.0-next.0
  - @ledgerhq/coin-sui@2.1.0-next.0
  - @domain/api-swap-quotes@0.3.0-next.0
  - @domain/api-currency-token@0.6.4-next.0
  - @domain/entity-currency@0.4.6-next.0
  - @domain/entity-currency-token@0.5.5-next.0
  - @ledgerhq/coin-algorand@2.3.1-next.0
  - @ledgerhq/coin-casper@3.5.1-next.0
  - @ledgerhq/coin-concordium@1.5.1-next.0
  - @ledgerhq/coin-icon@0.31.1-next.0
  - @ledgerhq/coin-internet_computer@1.32.1-next.0
  - @ledgerhq/coin-mina@1.24.2-next.0
  - @ledgerhq/coin-ton@0.39.1-next.0
  - @ledgerhq/coin-vechain@4.3.2-next.0
  - @ledgerhq/live-signer-evm@0.24.1-next.0
  - @ledgerhq/live-signer-icp@0.1.9-next.0
  - @ledgerhq/live-signer-solana@0.22.1-next.0
  - @ledgerhq/live-signer-aleo@0.19.14-next.0
  - @ledgerhq/device-core@0.11.19-next.0
  - @ledgerhq/live-signer-canton@0.9.23-next.0
  - @ledgerhq/live-signer-celo@1.2.10-next.0
  - @ledgerhq/live-signer-cosmos@0.6.1-next.0
  - @ledgerhq/live-signer-polkadot@0.1.1-next.0
  - @ledgerhq/live-signer-zcash@0.10.0
  - @features/platform-aggregated-assets@0.5.6-next.0
  - @features/platform-env@0.4.2-next.0
  - @ledgerhq/ledger-cal-service@1.19.9-next.0
  - @ledgerhq/ledger-trust-service@0.8.20-next.0
  - @ledgerhq/live-signer-tron@0.2.1-next.0
  - @domain/entity-account-name@0.2.2
  - @domain/entity-currency-fiat@0.4.0
  - @domain/entity-currency-unit@0.3.0
  - @domain/entity-interest-rate@0.3.0
  - @domain/entity-recent-addresses@0.2.1
  - @features/platform-device-intent@5.2.0
  - @ledgerhq/hw-app-algorand@6.36.0
  - @ledgerhq/hw-app-aptos@6.39.0
  - @ledgerhq/hw-app-btc@11.6.0
  - @ledgerhq/hw-app-hedera@1.7.0
  - @ledgerhq/hw-app-icon@1.8.0
  - @ledgerhq/hw-app-kaspa@1.7.7
  - @ledgerhq/hw-app-polkadot@6.39.0
  - @ledgerhq/hw-app-str@7.8.0
  - @ledgerhq/hw-app-tezos@6.37.0
  - @ledgerhq/hw-app-trx@6.37.0
  - @ledgerhq/hw-app-vet@0.14.0
  - @ledgerhq/hw-app-xrp@6.38.0
  - @ledgerhq/live-signer-concordium@0.9.2-next.0
  - @ledgerhq/live-signer-hyperliquid@1.3.2
  - @ledgerhq/live-signer-xrp@0.2.1

## 38.2.0

### Minor Changes

- [#22653](https://github.com/LedgerHQ/ledger-live/pull/22653) [`e8d5e1b`](https://github.com/LedgerHQ/ledger-live/commit/e8d5e1bf6eec2a47072ad59762064b24a89701cf) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Bump DMK dependencies: device-management-kit 1.10.0, device-signer-kit-solana 1.13.3, device-signer-kit-ethereum 1.18.1, context-module 2.6.0, dmk-ledger-wallet 0.6.0, device-contacts-kit 0.5.0, signer-utils 1.3.0, device-transport-kit-mockserver 1.1.2

- [#22474](https://github.com/LedgerHQ/ledger-live/pull/22474) [`1a26e59`](https://github.com/LedgerHQ/ledger-live/commit/1a26e599a47d52854cf05081a386e6090d8677f2) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Update coin module dependencies (coin-evm, coin-module-framework, coin-stellar, coin-tezos) and rebuild the lockfile

- [#22612](https://github.com/LedgerHQ/ledger-live/pull/22612) [`5adf8f3`](https://github.com/LedgerHQ/ledger-live/commit/5adf8f3b844e21895aa17f96a620a2dfa6b679ad) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Drop the Sui JSON-RPC transport, which the Sui Foundation retires, and make gRPC the default; GraphQL stays selectable through the `suiTransport` flag. coin-sui now owns the chain types it previously borrowed from `@mysten/sui/jsonRpc`.

- [#22226](https://github.com/LedgerHQ/ledger-live/pull/22226) [`a503ca1`](https://github.com/LedgerHQ/ledger-live/commit/a503ca185ae15738cd8ec77949d0964baa8c679b) Thanks [@ishaba](https://github.com/ishaba)! - Fix broken TRC10 sends on Tron

  A TRC10 transfer is crafted with the token's numeric asset id (encoded into the
  TransferAssetContract `asset_name`), but the Tron family's `getAssetFromToken` returned the token's
  `contractAddress` — which, for a TRC10 token from CAL, is the issuer address, not the asset id. The
  crafted transfer then named a non-existent asset and the send failed. TRC10 now derives its asset
  reference from the token id (`tron/trc10/<id>`), mirroring `getTokenFromAsset`; TRC20 keeps using its
  contract address.

- [#22058](https://github.com/LedgerHQ/ledger-live/pull/22058) [`f8c92f9`](https://github.com/LedgerHQ/ledger-live/commit/f8c92f9300d4b8268949ed7aff5a6781ed7f60a8) Thanks [@alexstapenka-ledger](https://github.com/alexstapenka-ledger)! - Instrument the shared sign/broadcast bridge defensively and dispatch consent-independent Earn
  transaction lifecycle events for native staking and allow-listed dApps on Desktop and Mobile.

- [#22335](https://github.com/LedgerHQ/ledger-live/pull/22335) [`96754dc`](https://github.com/LedgerHQ/ledger-live/commit/96754dc5cfec3487fe04b9202ddffe69fff476a4) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(llc): update default `config_nanoapp_ethereum`

- [#22558](https://github.com/LedgerHQ/ledger-live/pull/22558) [`e046686`](https://github.com/LedgerHQ/ledger-live/commit/e046686befa308188170ac9950eae394863c76a5) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(cosmos): staking validation rule in the generic path

- [#22571](https://github.com/LedgerHQ/ledger-live/pull/22571) [`e3c51c5`](https://github.com/LedgerHQ/ledger-live/commit/e3c51c57487a765391677073d78fb9ce275374b6) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Show a matched Me contact as "<name> (Me)" in Send: the recipient card, the "Address matched" row, the amount step "To" header, the Pay success title and the History counterparty. `MatchedContact` and `RecipientHeaderContact` now carry `isMe`, and `RecipientHeaderPresentation.label` is renamed `recipientDisplayValue` and never holds a contact name.

- [#22512](https://github.com/LedgerHQ/ledger-live/pull/22512) [`c63d0fa`](https://github.com/LedgerHQ/ledger-live/commit/c63d0fa3ad6f181beb5d8ea7b2ef474d82fd1ed7) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Always show Me in the Send recipient contact list, with only its addresses on the account network, ordered like the other contacts (last sent to first). Draw Me with one `MeAvatar` everywhere: `ContactAvatar` renders it for the Me contact, so the `meAvatarSrc`, `avatarSrc` and `isMe` avatar props are gone.

- [#22361](https://github.com/LedgerHQ/ledger-live/pull/22361) [`a025d7a`](https://github.com/LedgerHQ/ledger-live/commit/a025d7a872b7b1e4681d16b2bfb54f8949bf6626) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Add the DMK-backed Polkadot signer wrapper behind the `ldmkPolkadotSigner` feature flag

  `@ledgerhq/live-signer-polkadot` exports a DMK-backed and a legacy `hw-app-polkadot`-backed
  implementation of `PolkadotSigner`. The polkadot family's signer factory now returns the DMK
  implementation when the transport carries a DMK session and the `ldmkPolkadotSigner` flag is
  enabled, and falls back to the legacy implementation otherwise — with the flag off, every
  polkadot-family currency (polkadot, assethub_polkadot, westend, assethub_westend, bittensor)
  keeps its current behaviour unchanged.

- [#22589](https://github.com/LedgerHQ/ledger-live/pull/22589) [`a896fca`](https://github.com/LedgerHQ/ledger-live/commit/a896fca1974a46f10e915d1212e0947e2d808ad5) Thanks [@qperrot](https://github.com/qperrot)! - Remove the deprecated `CryptoCurrency.explorerId` field and the `LedgerExplorerId` type.

  Bitcoin-like explorer ids now come from the coin config (`config_currency_<id>.explorerId`), as EVM already does, and fall back to the currency id. The config is passed in rather than read from a module global: `toWalletBtcCurrency`, `walletBtcCurrencyById` and coin-bitcoin's `blockchainBaseURL` take it as an argument, the sync functions take the `coinConfig` resolver given to `createBridges`, and `assignFromAccountRaw` is now built with `makeAssignFromAccountRaw(coinConfig)`.

  Adds `config_currency_bitcoin_testnet`, `config_currency_bitcoin_regtest` and `config_currency_zcash_regtest` so every bitcoin-like currency resolves a config entry.

- [#22238](https://github.com/LedgerHQ/ledger-live/pull/22238) [`62fb052`](https://github.com/LedgerHQ/ledger-live/commit/62fb052d74dd4f8ee80ac74ffe7d1e1473752766) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Keep the selected contact in Send and open the recipient picker from the To bar.

- [#22372](https://github.com/LedgerHQ/ledger-live/pull/22372) [`b34159a`](https://github.com/LedgerHQ/ledger-live/commit/b34159af9fe5b26d5d7bfb04f881fca55246e83c) Thanks [@semeano](https://github.com/semeano)! - feat(coin-stacks): enable staking positions in Stacks BridgeApi

- [#22375](https://github.com/LedgerHQ/ledger-live/pull/22375) [`0ce2853`](https://github.com/LedgerHQ/ledger-live/commit/0ce2853042f94314e9255ab06eeccbb994a1f04e) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Remove unused @svgr/core from live-common

- [#22392](https://github.com/LedgerHQ/ledger-live/pull/22392) [`a6b6959`](https://github.com/LedgerHQ/ledger-live/commit/a6b6959a9540ad1fb7037f9f8cfd76b56e81d02d) Thanks [@CremaFR](https://github.com/CremaFR)! - Include Exchange and signing app versions on swap cancel payloads

- [#22428](https://github.com/LedgerHQ/ledger-live/pull/22428) [`c35b103`](https://github.com/LedgerHQ/ledger-live/commit/c35b10307731ef8910eac0be4de14abe4e7b0643) Thanks [@CremaFR](https://github.com/CremaFR)! - Send balance, spendable balance, pending operation count, and EVM gas diagnostics when a swap is cancelled

- [#22054](https://github.com/LedgerHQ/ledger-live/pull/22054) [`8c486aa`](https://github.com/LedgerHQ/ledger-live/commit/8c486aabe3dbd100b21e43d3f344fda5142858ed) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Add `@ledgerhq/live-signer-tron`, wrapping `@ledgerhq/device-signer-kit-tron` as `DmkSignerTron`
  alongside the legacy `hw-app-trx` path as `LegacySignerTron`. `families/tron/setup.ts` picks
  between them, using the DMK signer only on a DMK transport with the new `ldmkTronSigner` feature
  flag on. The flag is disabled by default, so Tron keeps signing through `hw-app-trx`.

- [#22026](https://github.com/LedgerHQ/ledger-live/pull/22026) [`88bae04`](https://github.com/LedgerHQ/ledger-live/commit/88bae04e2f7e7a3de8d55c340fe32b48e37bd78d) Thanks [@ishaba](https://github.com/ishaba)! - fix(coin-tron): take the TRC20 fee_limit from the estimate's ceiling

- [#22279](https://github.com/LedgerHQ/ledger-live/pull/22279) [`62cc42f`](https://github.com/LedgerHQ/ledger-live/commit/62cc42f32d041e0e1081e7fdaca04169581429ec) Thanks [@semeano](https://github.com/semeano)! - Fix Zcash mock-bridge and serialization so shielded send still works

  Persisting a _mock_ Zcash account (under `MOCK=true`) routed `toAccountRaw` through coin-bitcoin's mock bridge, which declares no assign hooks at all and so dropped both the viewing key/`privateInfo` and the transparent `bitcoinResources` the load path had just restored. A real account was never affected: coin-bitcoin's real bridge already round-trips `privateInfo` unconditionally via its Zcash chain-adapter. Mock account ids now resolve through the standalone Zcash serialization family instead — unless the host never registered that coin module (wallet-cli registers bitcoin, evm and solana only), in which case they keep coin-bitcoin's adapter instead of failing to resolve a bridge. A real account id keeps resolving through `currency.family` as before, so it never eager-loads the standalone module merely by being deserialized.

  The mock bridge also omitted `getFullViewingKey`, `deriveShieldedAddress`, and `getShieldedAddress`, so activating the private balance under `MOCK=true` threw a TypeError. Those methods now return device-free stand-ins, including a well-formed unified address so the send flow still classifies a self-transfer as a private recipient.

  `@ledgerhq/coin-bitcoin`'s Zcash chain-adapter (`chain-adapters/zcash/serialization.ts`, the bridge a real account id always resolves to) also dropped `lastSyncError` on every round-trip: the field exists on `ZcashPrivateInfoRaw` but neither `toZcashPrivateInfoRaw` nor `fromZcashPrivateInfoRaw` mapped it, so a failed shielded sync lost its retry marker on save/load. Both directions now carry it, matching `@ledgerhq/coin-zcash`'s own serializer.

- [#22664](https://github.com/LedgerHQ/ledger-live/pull/22664) [`f96e346`](https://github.com/LedgerHQ/ledger-live/commit/f96e3461de843bb89127c7e9ac5578e85140025f) Thanks [@semeano](https://github.com/semeano)! - Add Zcash privacy/transfer-flow attributes to the new send flow's Segment tracking, and a first page event for the balance-type step, so a private vs public Zcash send is distinguishable in analytics (LIVE-38009).

- [#22542](https://github.com/LedgerHQ/ledger-live/pull/22542) [`06c71d1`](https://github.com/LedgerHQ/ledger-live/commit/06c71d101fb664b50202f6ddc09dd1abbcb76a3a) Thanks [@cted-ledger](https://github.com/cted-ledger)! - fix(coin-zcash): read endpoints and sync limits from the injected coin config

  The module no longer keeps configuration in module state. `createBridges` takes a `Context`
  (ADR-019) and sync, sign and broadcast resolve `config_currency_zcash` from `context.config()` on
  every call. The endpoints `zaino.url` and `explorer.url` are required and default to the production
  hosts in `config_currency_zcash`; the mainnet Zaino default no longer points at staging. The
  optional tuning fields `zaino.timeoutMs` (per-chunk budget of the automatic shielded sync) and
  `zaino.batchSize` (blocks per shielded scan chunk) fall back to the module defaults
  `ZCASH_SHIELDED_CHUNK_TIMEOUT_MS` (120000) and `ZCASH_SHIELDED_BATCH_SIZE` (5000). All of them can
  be changed through the remote currency config without a release. The explorer (`explorer.url` and
  the optional `explorerId`) is bound from the config at use, so deserialization stays config-free.

  Breaking: `createBridges(signerContext, context)` takes a `Context` instead of a config getter;
  `setCoinConfig`, `getCoinConfig`, `setZainoGrpcUrl`, the `ZCASH_GRPC_URL_*` and
  `ZCASH_AUTO_SYNC_TIMEOUT_MS` constants and the `ZcashConfigInfo` type are removed in favour of
  `ZcashCoinConfig` / `ZcashContext`.

### Patch Changes

- Updated dependencies [[`e3b6f7a`](https://github.com/LedgerHQ/ledger-live/commit/e3b6f7a8549cbbbdb74dcca483f58bf3d0f4cc80), [`e8d5e1b`](https://github.com/LedgerHQ/ledger-live/commit/e8d5e1bf6eec2a47072ad59762064b24a89701cf), [`c95a00f`](https://github.com/LedgerHQ/ledger-live/commit/c95a00f06cf5e8891e843c0a2cdc17e6d97c85f1), [`084013e`](https://github.com/LedgerHQ/ledger-live/commit/084013e91394c76a89c961defbc80de19dfbad2d), [`830d7d7`](https://github.com/LedgerHQ/ledger-live/commit/830d7d7e86acce1c561666ebeef2f2e7469ffa0c), [`1a26e59`](https://github.com/LedgerHQ/ledger-live/commit/1a26e599a47d52854cf05081a386e6090d8677f2), [`5adf8f3`](https://github.com/LedgerHQ/ledger-live/commit/5adf8f3b844e21895aa17f96a620a2dfa6b679ad), [`f7cd861`](https://github.com/LedgerHQ/ledger-live/commit/f7cd8616265d3f94fef24332626402efe39eb83f), [`a503ca1`](https://github.com/LedgerHQ/ledger-live/commit/a503ca185ae15738cd8ec77949d0964baa8c679b), [`f1d8aac`](https://github.com/LedgerHQ/ledger-live/commit/f1d8aac1c7c0bc0be9beb1508c1a9ef3cf7affae), [`33b4952`](https://github.com/LedgerHQ/ledger-live/commit/33b4952ef04d4e0528d2735ba299b4a8073e447e), [`b68f4c9`](https://github.com/LedgerHQ/ledger-live/commit/b68f4c9f6b1459f3432d3992bc78daec1648c504), [`f8c92f9`](https://github.com/LedgerHQ/ledger-live/commit/f8c92f9300d4b8268949ed7aff5a6781ed7f60a8), [`7fd570c`](https://github.com/LedgerHQ/ledger-live/commit/7fd570cd3868a675dad0d77136734eab63f11bd1), [`e046686`](https://github.com/LedgerHQ/ledger-live/commit/e046686befa308188170ac9950eae394863c76a5), [`952bcf6`](https://github.com/LedgerHQ/ledger-live/commit/952bcf6855a1166ce70cb3d007d95f00c24e4ff3), [`381bd0b`](https://github.com/LedgerHQ/ledger-live/commit/381bd0befb6a09f20f13f65c233f0e1479e7051d), [`f9b43be`](https://github.com/LedgerHQ/ledger-live/commit/f9b43beb27558199ac97c56a7787e49c49c8b204), [`41eca65`](https://github.com/LedgerHQ/ledger-live/commit/41eca657432071ba1d22029b79be85ca3eff6a94), [`fe55ea3`](https://github.com/LedgerHQ/ledger-live/commit/fe55ea349a8227d398bd570e68a8756392a4dd21), [`a025d7a`](https://github.com/LedgerHQ/ledger-live/commit/a025d7a872b7b1e4681d16b2bfb54f8949bf6626), [`86dbc48`](https://github.com/LedgerHQ/ledger-live/commit/86dbc48147fa1a16aa79c81f844ffe5117b29494), [`4f8d10f`](https://github.com/LedgerHQ/ledger-live/commit/4f8d10f35d421e460720edc5e26dc4aa70889744), [`9cafda0`](https://github.com/LedgerHQ/ledger-live/commit/9cafda098001d1912b872e341c4568386b70ed75), [`a896fca`](https://github.com/LedgerHQ/ledger-live/commit/a896fca1974a46f10e915d1212e0947e2d808ad5), [`4efbefe`](https://github.com/LedgerHQ/ledger-live/commit/4efbefe6bf557124596a33f4a94849056953c391), [`2bc48af`](https://github.com/LedgerHQ/ledger-live/commit/2bc48af37bde7d5d66cba4f48dc186d06e4b08df), [`8c486aa`](https://github.com/LedgerHQ/ledger-live/commit/8c486aabe3dbd100b21e43d3f344fda5142858ed), [`88bae04`](https://github.com/LedgerHQ/ledger-live/commit/88bae04e2f7e7a3de8d55c340fe32b48e37bd78d), [`62cc42f`](https://github.com/LedgerHQ/ledger-live/commit/62cc42f32d041e0e1081e7fdaca04169581429ec), [`06c71d1`](https://github.com/LedgerHQ/ledger-live/commit/06c71d101fb664b50202f6ddc09dd1abbcb76a3a)]:
  - @ledgerhq/coin-aleo@2.6.0
  - @ledgerhq/live-dmk-shared@0.34.0
  - @ledgerhq/live-signer-evm@0.24.0
  - @ledgerhq/live-signer-solana@0.22.0
  - @ledgerhq/coin-casper@3.5.0
  - @ledgerhq/coin-internet_computer@1.32.0
  - @ledgerhq/coin-celo@3.4.0
  - @ledgerhq/coin-sui@2.0.0
  - @shared/feature-flags@0.25.0
  - @shared/env@0.9.0
  - @ledgerhq/asset-aggregation@0.17.0
  - @ledgerhq/coin-tron@10.0.0
  - @ledgerhq/ledger-wallet-framework@3.6.0
  - @domain/entity-currency-crypto@0.14.0
  - @ledgerhq/coin-bitcoin@0.54.0
  - @ledgerhq/coin-zcash@0.10.0
  - @ledgerhq/live-signer-tron@0.2.0
  - @ledgerhq/transaction-observability@0.4.0
  - @ledgerhq/coin-cosmos@1.5.0
  - @ledgerhq/coin-hedera@2.6.0
  - @ledgerhq/coin-algorand@2.3.0
  - @ledgerhq/coin-aptos@4.3.0
  - @ledgerhq/coin-canton@1.3.0
  - @ledgerhq/coin-cardano@1.3.0
  - @ledgerhq/coin-concordium@1.5.0
  - @ledgerhq/coin-filecoin@2.3.0
  - @ledgerhq/coin-icon@0.31.0
  - @ledgerhq/coin-kaspa@2.4.0
  - @ledgerhq/coin-multiversx@1.3.0
  - @ledgerhq/coin-solana@2.3.0
  - @ledgerhq/coin-stacks@0.32.0
  - @ledgerhq/coin-ton@0.39.0
  - @ledgerhq/hw-app-eth@7.10.0
  - @ledgerhq/coin-near@1.3.0
  - @ledgerhq/live-signer-polkadot@0.1.0
  - @ledgerhq/live-signer-cosmos@0.6.0
  - @ledgerhq/coin-mina@1.24.1
  - @ledgerhq/coin-polkadot@7.3.1
  - @ledgerhq/coin-vechain@4.3.1
  - @ledgerhq/device-core@0.11.18
  - @ledgerhq/live-countervalues-react@0.18.2
  - @ledgerhq/live-signer-aleo@0.19.13
  - @ledgerhq/live-signer-canton@0.9.22
  - @ledgerhq/live-signer-celo@1.2.9
  - @ledgerhq/live-signer-icp@0.1.8
  - @ledgerhq/live-signer-zcash@0.10.0
  - @features/platform-feature-flags@0.8.1
  - @domain/api-aggregated-assets@0.5.3
  - @features/platform-aggregated-assets@0.5.5
  - @features/platform-env@0.4.1
  - @ledgerhq/ledger-cal-service@1.19.8
  - @ledgerhq/ledger-trust-service@0.8.19
  - @ledgerhq/live-countervalues@0.26.2
  - @domain/api-currency-token@0.6.3
  - @domain/entity-currency@0.4.5
  - @domain/entity-currency-token@0.5.4
  - @ledgerhq/live-signer-concordium@0.9.1
  - @domain/api-swap-quotes@0.2.6
  - @ledgerhq/wallet-btc@0.6.0

## 38.2.0-next.1

### Patch Changes

- Updated dependencies [[`fe55ea3`](https://github.com/LedgerHQ/ledger-live/commit/fe55ea349a8227d398bd570e68a8756392a4dd21)]:
  - @shared/feature-flags@0.25.0-next.1
  - @features/platform-feature-flags@0.8.1-next.1
  - @ledgerhq/coin-aleo@2.6.0-next.0
  - @ledgerhq/coin-hedera@2.6.0-next.0

## 38.2.0-next.0

### Minor Changes

- [#22653](https://github.com/LedgerHQ/ledger-live/pull/22653) [`e8d5e1b`](https://github.com/LedgerHQ/ledger-live/commit/e8d5e1bf6eec2a47072ad59762064b24a89701cf) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Bump DMK dependencies: device-management-kit 1.10.0, device-signer-kit-solana 1.13.3, device-signer-kit-ethereum 1.18.1, context-module 2.6.0, dmk-ledger-wallet 0.6.0, device-contacts-kit 0.5.0, signer-utils 1.3.0, device-transport-kit-mockserver 1.1.2

- [#22474](https://github.com/LedgerHQ/ledger-live/pull/22474) [`1a26e59`](https://github.com/LedgerHQ/ledger-live/commit/1a26e599a47d52854cf05081a386e6090d8677f2) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Update coin module dependencies (coin-evm, coin-module-framework, coin-stellar, coin-tezos) and rebuild the lockfile

- [#22612](https://github.com/LedgerHQ/ledger-live/pull/22612) [`5adf8f3`](https://github.com/LedgerHQ/ledger-live/commit/5adf8f3b844e21895aa17f96a620a2dfa6b679ad) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Drop the Sui JSON-RPC transport, which the Sui Foundation retires, and make gRPC the default; GraphQL stays selectable through the `suiTransport` flag. coin-sui now owns the chain types it previously borrowed from `@mysten/sui/jsonRpc`.

- [#22226](https://github.com/LedgerHQ/ledger-live/pull/22226) [`a503ca1`](https://github.com/LedgerHQ/ledger-live/commit/a503ca185ae15738cd8ec77949d0964baa8c679b) Thanks [@ishaba](https://github.com/ishaba)! - Fix broken TRC10 sends on Tron

  A TRC10 transfer is crafted with the token's numeric asset id (encoded into the
  TransferAssetContract `asset_name`), but the Tron family's `getAssetFromToken` returned the token's
  `contractAddress` — which, for a TRC10 token from CAL, is the issuer address, not the asset id. The
  crafted transfer then named a non-existent asset and the send failed. TRC10 now derives its asset
  reference from the token id (`tron/trc10/<id>`), mirroring `getTokenFromAsset`; TRC20 keeps using its
  contract address.

- [#22058](https://github.com/LedgerHQ/ledger-live/pull/22058) [`f8c92f9`](https://github.com/LedgerHQ/ledger-live/commit/f8c92f9300d4b8268949ed7aff5a6781ed7f60a8) Thanks [@alexstapenka-ledger](https://github.com/alexstapenka-ledger)! - Instrument the shared sign/broadcast bridge defensively and dispatch consent-independent Earn
  transaction lifecycle events for native staking and allow-listed dApps on Desktop and Mobile.

- [#22335](https://github.com/LedgerHQ/ledger-live/pull/22335) [`96754dc`](https://github.com/LedgerHQ/ledger-live/commit/96754dc5cfec3487fe04b9202ddffe69fff476a4) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(llc): update default `config_nanoapp_ethereum`

- [#22558](https://github.com/LedgerHQ/ledger-live/pull/22558) [`e046686`](https://github.com/LedgerHQ/ledger-live/commit/e046686befa308188170ac9950eae394863c76a5) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(cosmos): staking validation rule in the generic path

- [#22571](https://github.com/LedgerHQ/ledger-live/pull/22571) [`e3c51c5`](https://github.com/LedgerHQ/ledger-live/commit/e3c51c57487a765391677073d78fb9ce275374b6) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Show a matched Me contact as "<name> (Me)" in Send: the recipient card, the "Address matched" row, the amount step "To" header, the Pay success title and the History counterparty. `MatchedContact` and `RecipientHeaderContact` now carry `isMe`, and `RecipientHeaderPresentation.label` is renamed `recipientDisplayValue` and never holds a contact name.

- [#22512](https://github.com/LedgerHQ/ledger-live/pull/22512) [`c63d0fa`](https://github.com/LedgerHQ/ledger-live/commit/c63d0fa3ad6f181beb5d8ea7b2ef474d82fd1ed7) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Always show Me in the Send recipient contact list, with only its addresses on the account network, ordered like the other contacts (last sent to first). Draw Me with one `MeAvatar` everywhere: `ContactAvatar` renders it for the Me contact, so the `meAvatarSrc`, `avatarSrc` and `isMe` avatar props are gone.

- [#22361](https://github.com/LedgerHQ/ledger-live/pull/22361) [`a025d7a`](https://github.com/LedgerHQ/ledger-live/commit/a025d7a872b7b1e4681d16b2bfb54f8949bf6626) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Add the DMK-backed Polkadot signer wrapper behind the `ldmkPolkadotSigner` feature flag

  `@ledgerhq/live-signer-polkadot` exports a DMK-backed and a legacy `hw-app-polkadot`-backed
  implementation of `PolkadotSigner`. The polkadot family's signer factory now returns the DMK
  implementation when the transport carries a DMK session and the `ldmkPolkadotSigner` flag is
  enabled, and falls back to the legacy implementation otherwise — with the flag off, every
  polkadot-family currency (polkadot, assethub_polkadot, westend, assethub_westend, bittensor)
  keeps its current behaviour unchanged.

- [#22589](https://github.com/LedgerHQ/ledger-live/pull/22589) [`a896fca`](https://github.com/LedgerHQ/ledger-live/commit/a896fca1974a46f10e915d1212e0947e2d808ad5) Thanks [@qperrot](https://github.com/qperrot)! - Remove the deprecated `CryptoCurrency.explorerId` field and the `LedgerExplorerId` type.

  Bitcoin-like explorer ids now come from the coin config (`config_currency_<id>.explorerId`), as EVM already does, and fall back to the currency id. The config is passed in rather than read from a module global: `toWalletBtcCurrency`, `walletBtcCurrencyById` and coin-bitcoin's `blockchainBaseURL` take it as an argument, the sync functions take the `coinConfig` resolver given to `createBridges`, and `assignFromAccountRaw` is now built with `makeAssignFromAccountRaw(coinConfig)`.

  Adds `config_currency_bitcoin_testnet`, `config_currency_bitcoin_regtest` and `config_currency_zcash_regtest` so every bitcoin-like currency resolves a config entry.

- [#22238](https://github.com/LedgerHQ/ledger-live/pull/22238) [`62fb052`](https://github.com/LedgerHQ/ledger-live/commit/62fb052d74dd4f8ee80ac74ffe7d1e1473752766) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Keep the selected contact in Send and open the recipient picker from the To bar.

- [#22372](https://github.com/LedgerHQ/ledger-live/pull/22372) [`b34159a`](https://github.com/LedgerHQ/ledger-live/commit/b34159af9fe5b26d5d7bfb04f881fca55246e83c) Thanks [@semeano](https://github.com/semeano)! - feat(coin-stacks): enable staking positions in Stacks BridgeApi

- [#22375](https://github.com/LedgerHQ/ledger-live/pull/22375) [`0ce2853`](https://github.com/LedgerHQ/ledger-live/commit/0ce2853042f94314e9255ab06eeccbb994a1f04e) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Remove unused @svgr/core from live-common

- [#22392](https://github.com/LedgerHQ/ledger-live/pull/22392) [`a6b6959`](https://github.com/LedgerHQ/ledger-live/commit/a6b6959a9540ad1fb7037f9f8cfd76b56e81d02d) Thanks [@CremaFR](https://github.com/CremaFR)! - Include Exchange and signing app versions on swap cancel payloads

- [#22428](https://github.com/LedgerHQ/ledger-live/pull/22428) [`c35b103`](https://github.com/LedgerHQ/ledger-live/commit/c35b10307731ef8910eac0be4de14abe4e7b0643) Thanks [@CremaFR](https://github.com/CremaFR)! - Send balance, spendable balance, pending operation count, and EVM gas diagnostics when a swap is cancelled

- [#22054](https://github.com/LedgerHQ/ledger-live/pull/22054) [`8c486aa`](https://github.com/LedgerHQ/ledger-live/commit/8c486aabe3dbd100b21e43d3f344fda5142858ed) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Add `@ledgerhq/live-signer-tron`, wrapping `@ledgerhq/device-signer-kit-tron` as `DmkSignerTron`
  alongside the legacy `hw-app-trx` path as `LegacySignerTron`. `families/tron/setup.ts` picks
  between them, using the DMK signer only on a DMK transport with the new `ldmkTronSigner` feature
  flag on. The flag is disabled by default, so Tron keeps signing through `hw-app-trx`.

- [#22026](https://github.com/LedgerHQ/ledger-live/pull/22026) [`88bae04`](https://github.com/LedgerHQ/ledger-live/commit/88bae04e2f7e7a3de8d55c340fe32b48e37bd78d) Thanks [@ishaba](https://github.com/ishaba)! - fix(coin-tron): take the TRC20 fee_limit from the estimate's ceiling

- [#22279](https://github.com/LedgerHQ/ledger-live/pull/22279) [`62cc42f`](https://github.com/LedgerHQ/ledger-live/commit/62cc42f32d041e0e1081e7fdaca04169581429ec) Thanks [@semeano](https://github.com/semeano)! - Fix Zcash mock-bridge and serialization so shielded send still works

  Persisting a _mock_ Zcash account (under `MOCK=true`) routed `toAccountRaw` through coin-bitcoin's mock bridge, which declares no assign hooks at all and so dropped both the viewing key/`privateInfo` and the transparent `bitcoinResources` the load path had just restored. A real account was never affected: coin-bitcoin's real bridge already round-trips `privateInfo` unconditionally via its Zcash chain-adapter. Mock account ids now resolve through the standalone Zcash serialization family instead — unless the host never registered that coin module (wallet-cli registers bitcoin, evm and solana only), in which case they keep coin-bitcoin's adapter instead of failing to resolve a bridge. A real account id keeps resolving through `currency.family` as before, so it never eager-loads the standalone module merely by being deserialized.

  The mock bridge also omitted `getFullViewingKey`, `deriveShieldedAddress`, and `getShieldedAddress`, so activating the private balance under `MOCK=true` threw a TypeError. Those methods now return device-free stand-ins, including a well-formed unified address so the send flow still classifies a self-transfer as a private recipient.

  `@ledgerhq/coin-bitcoin`'s Zcash chain-adapter (`chain-adapters/zcash/serialization.ts`, the bridge a real account id always resolves to) also dropped `lastSyncError` on every round-trip: the field exists on `ZcashPrivateInfoRaw` but neither `toZcashPrivateInfoRaw` nor `fromZcashPrivateInfoRaw` mapped it, so a failed shielded sync lost its retry marker on save/load. Both directions now carry it, matching `@ledgerhq/coin-zcash`'s own serializer.

- [#22664](https://github.com/LedgerHQ/ledger-live/pull/22664) [`f96e346`](https://github.com/LedgerHQ/ledger-live/commit/f96e3461de843bb89127c7e9ac5578e85140025f) Thanks [@semeano](https://github.com/semeano)! - Add Zcash privacy/transfer-flow attributes to the new send flow's Segment tracking, and a first page event for the balance-type step, so a private vs public Zcash send is distinguishable in analytics (LIVE-38009).

- [#22542](https://github.com/LedgerHQ/ledger-live/pull/22542) [`06c71d1`](https://github.com/LedgerHQ/ledger-live/commit/06c71d101fb664b50202f6ddc09dd1abbcb76a3a) Thanks [@cted-ledger](https://github.com/cted-ledger)! - fix(coin-zcash): read endpoints and sync limits from the injected coin config

  The module no longer keeps configuration in module state. `createBridges` takes a `Context`
  (ADR-019) and sync, sign and broadcast resolve `config_currency_zcash` from `context.config()` on
  every call. The endpoints `zaino.url` and `explorer.url` are required and default to the production
  hosts in `config_currency_zcash`; the mainnet Zaino default no longer points at staging. The
  optional tuning fields `zaino.timeoutMs` (per-chunk budget of the automatic shielded sync) and
  `zaino.batchSize` (blocks per shielded scan chunk) fall back to the module defaults
  `ZCASH_SHIELDED_CHUNK_TIMEOUT_MS` (120000) and `ZCASH_SHIELDED_BATCH_SIZE` (5000). All of them can
  be changed through the remote currency config without a release. The explorer (`explorer.url` and
  the optional `explorerId`) is bound from the config at use, so deserialization stays config-free.

  Breaking: `createBridges(signerContext, context)` takes a `Context` instead of a config getter;
  `setCoinConfig`, `getCoinConfig`, `setZainoGrpcUrl`, the `ZCASH_GRPC_URL_*` and
  `ZCASH_AUTO_SYNC_TIMEOUT_MS` constants and the `ZcashConfigInfo` type are removed in favour of
  `ZcashCoinConfig` / `ZcashContext`.

### Patch Changes

- Updated dependencies [[`e3b6f7a`](https://github.com/LedgerHQ/ledger-live/commit/e3b6f7a8549cbbbdb74dcca483f58bf3d0f4cc80), [`e8d5e1b`](https://github.com/LedgerHQ/ledger-live/commit/e8d5e1bf6eec2a47072ad59762064b24a89701cf), [`c95a00f`](https://github.com/LedgerHQ/ledger-live/commit/c95a00f06cf5e8891e843c0a2cdc17e6d97c85f1), [`084013e`](https://github.com/LedgerHQ/ledger-live/commit/084013e91394c76a89c961defbc80de19dfbad2d), [`830d7d7`](https://github.com/LedgerHQ/ledger-live/commit/830d7d7e86acce1c561666ebeef2f2e7469ffa0c), [`1a26e59`](https://github.com/LedgerHQ/ledger-live/commit/1a26e599a47d52854cf05081a386e6090d8677f2), [`5adf8f3`](https://github.com/LedgerHQ/ledger-live/commit/5adf8f3b844e21895aa17f96a620a2dfa6b679ad), [`f7cd861`](https://github.com/LedgerHQ/ledger-live/commit/f7cd8616265d3f94fef24332626402efe39eb83f), [`a503ca1`](https://github.com/LedgerHQ/ledger-live/commit/a503ca185ae15738cd8ec77949d0964baa8c679b), [`f1d8aac`](https://github.com/LedgerHQ/ledger-live/commit/f1d8aac1c7c0bc0be9beb1508c1a9ef3cf7affae), [`33b4952`](https://github.com/LedgerHQ/ledger-live/commit/33b4952ef04d4e0528d2735ba299b4a8073e447e), [`b68f4c9`](https://github.com/LedgerHQ/ledger-live/commit/b68f4c9f6b1459f3432d3992bc78daec1648c504), [`f8c92f9`](https://github.com/LedgerHQ/ledger-live/commit/f8c92f9300d4b8268949ed7aff5a6781ed7f60a8), [`7fd570c`](https://github.com/LedgerHQ/ledger-live/commit/7fd570cd3868a675dad0d77136734eab63f11bd1), [`e046686`](https://github.com/LedgerHQ/ledger-live/commit/e046686befa308188170ac9950eae394863c76a5), [`952bcf6`](https://github.com/LedgerHQ/ledger-live/commit/952bcf6855a1166ce70cb3d007d95f00c24e4ff3), [`381bd0b`](https://github.com/LedgerHQ/ledger-live/commit/381bd0befb6a09f20f13f65c233f0e1479e7051d), [`f9b43be`](https://github.com/LedgerHQ/ledger-live/commit/f9b43beb27558199ac97c56a7787e49c49c8b204), [`41eca65`](https://github.com/LedgerHQ/ledger-live/commit/41eca657432071ba1d22029b79be85ca3eff6a94), [`a025d7a`](https://github.com/LedgerHQ/ledger-live/commit/a025d7a872b7b1e4681d16b2bfb54f8949bf6626), [`86dbc48`](https://github.com/LedgerHQ/ledger-live/commit/86dbc48147fa1a16aa79c81f844ffe5117b29494), [`4f8d10f`](https://github.com/LedgerHQ/ledger-live/commit/4f8d10f35d421e460720edc5e26dc4aa70889744), [`9cafda0`](https://github.com/LedgerHQ/ledger-live/commit/9cafda098001d1912b872e341c4568386b70ed75), [`a896fca`](https://github.com/LedgerHQ/ledger-live/commit/a896fca1974a46f10e915d1212e0947e2d808ad5), [`4efbefe`](https://github.com/LedgerHQ/ledger-live/commit/4efbefe6bf557124596a33f4a94849056953c391), [`2bc48af`](https://github.com/LedgerHQ/ledger-live/commit/2bc48af37bde7d5d66cba4f48dc186d06e4b08df), [`8c486aa`](https://github.com/LedgerHQ/ledger-live/commit/8c486aabe3dbd100b21e43d3f344fda5142858ed), [`88bae04`](https://github.com/LedgerHQ/ledger-live/commit/88bae04e2f7e7a3de8d55c340fe32b48e37bd78d), [`62cc42f`](https://github.com/LedgerHQ/ledger-live/commit/62cc42f32d041e0e1081e7fdaca04169581429ec), [`06c71d1`](https://github.com/LedgerHQ/ledger-live/commit/06c71d101fb664b50202f6ddc09dd1abbcb76a3a)]:
  - @ledgerhq/coin-aleo@2.6.0-next.0
  - @ledgerhq/live-dmk-shared@0.34.0-next.0
  - @ledgerhq/live-signer-evm@0.24.0-next.0
  - @ledgerhq/live-signer-solana@0.22.0-next.0
  - @ledgerhq/coin-casper@3.5.0-next.0
  - @ledgerhq/coin-internet_computer@1.32.0-next.0
  - @ledgerhq/coin-celo@3.4.0-next.0
  - @ledgerhq/coin-sui@2.0.0-next.0
  - @shared/feature-flags@0.25.0-next.0
  - @shared/env@0.9.0-next.0
  - @ledgerhq/asset-aggregation@0.17.0-next.0
  - @ledgerhq/coin-tron@10.0.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.6.0-next.0
  - @domain/entity-currency-crypto@0.14.0-next.0
  - @ledgerhq/coin-bitcoin@0.54.0-next.0
  - @ledgerhq/coin-zcash@0.10.0-next.0
  - @ledgerhq/live-signer-tron@0.2.0-next.0
  - @ledgerhq/transaction-observability@0.4.0-next.0
  - @ledgerhq/coin-cosmos@1.5.0-next.0
  - @ledgerhq/coin-hedera@2.6.0-next.0
  - @ledgerhq/coin-algorand@2.3.0-next.0
  - @ledgerhq/coin-aptos@4.3.0-next.0
  - @ledgerhq/coin-canton@1.3.0-next.0
  - @ledgerhq/coin-cardano@1.3.0-next.0
  - @ledgerhq/coin-concordium@1.5.0-next.0
  - @ledgerhq/coin-filecoin@2.3.0-next.0
  - @ledgerhq/coin-icon@0.31.0-next.0
  - @ledgerhq/coin-kaspa@2.4.0-next.0
  - @ledgerhq/coin-multiversx@1.3.0-next.0
  - @ledgerhq/coin-solana@2.3.0-next.0
  - @ledgerhq/coin-stacks@0.32.0-next.0
  - @ledgerhq/coin-ton@0.39.0-next.0
  - @ledgerhq/hw-app-eth@7.10.0-next.0
  - @ledgerhq/coin-near@1.3.0-next.0
  - @ledgerhq/live-signer-polkadot@0.1.0-next.0
  - @ledgerhq/live-signer-cosmos@0.6.0-next.0
  - @ledgerhq/coin-mina@1.24.1-next.0
  - @ledgerhq/coin-polkadot@7.3.1-next.0
  - @ledgerhq/coin-vechain@4.3.1-next.0
  - @ledgerhq/device-core@0.11.18-next.0
  - @ledgerhq/live-countervalues-react@0.18.2-next.0
  - @ledgerhq/live-signer-aleo@0.19.13-next.0
  - @ledgerhq/live-signer-canton@0.9.22-next.0
  - @ledgerhq/live-signer-celo@1.2.9-next.0
  - @ledgerhq/live-signer-icp@0.1.8-next.0
  - @ledgerhq/live-signer-zcash@0.10.0
  - @features/platform-feature-flags@0.8.1-next.0
  - @domain/api-aggregated-assets@0.5.3-next.0
  - @features/platform-aggregated-assets@0.5.5-next.0
  - @features/platform-env@0.4.1-next.0
  - @ledgerhq/ledger-cal-service@1.19.8-next.0
  - @ledgerhq/ledger-trust-service@0.8.19-next.0
  - @ledgerhq/live-countervalues@0.26.2-next.0
  - @domain/api-currency-token@0.6.3-next.0
  - @domain/entity-currency@0.4.5-next.0
  - @domain/entity-currency-token@0.5.4-next.0
  - @ledgerhq/live-signer-concordium@0.9.1-next.0
  - @domain/api-swap-quotes@0.2.6-next.0
  - @ledgerhq/wallet-btc@0.6.0

## 38.1.0

### Minor Changes

- [#21999](https://github.com/LedgerHQ/ledger-live/pull/21999) [`724f029`](https://github.com/LedgerHQ/ledger-live/commit/724f02932ccdf8ba5b8f8f0ccc10b9edbe7547cd) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat(aleo): share the bond pieces between Desktop and Mobile

  Replaces the ad-hoc messages `getTransactionStatus` returned for a rejected bond with typed
  error classes, translated on both clients and now distinguishing a closed validator from an
  unbonding one. Adds the `isValidatorBondable` / `getMinBondAmount` helpers to the coin
  module, moves the per-network default validator into the Aleo currency config so every
  client reads the same address, and adds a reusable Aleo bridge mock for Mobile.

- [#22137](https://github.com/LedgerHQ/ledger-live/pull/22137) [`353ed46`](https://github.com/LedgerHQ/ledger-live/commit/353ed46035b09d33eff6b5b76fe7ad3d19510e38) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat(aleo): show the staking position and its status on the Mobile account page

- [#22123](https://github.com/LedgerHQ/ledger-live/pull/22123) [`b5338ec`](https://github.com/LedgerHQ/ledger-live/commit/b5338ec9173a08073a4b8524fe095428bb710a99) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - feat(aleo): add the shared staking hooks the delegation views read

- [#22212](https://github.com/LedgerHQ/ledger-live/pull/22212) [`49b535f`](https://github.com/LedgerHQ/ledger-live/commit/49b535fa6cab495b0b8659c042c743b8f65c2ce2) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - refactor(aleo): serve the validator committee from RTK Query

- [#22057](https://github.com/LedgerHQ/ledger-live/pull/22057) [`926952b`](https://github.com/LedgerHQ/ledger-live/commit/926952ba724cb42860718c4af553be725d1265a9) Thanks [@0xMM-L](https://github.com/0xMM-L)! - Rebuild the typed device errors that `@zondax/ledger-casper` flattens into a raw return code, so a Casper transaction or address rejected on device shows the "Action rejected" copy and a locked device shows the unlock screen, instead of a raw `27014 - ...` / `21781 - Unknown Status Code` error.

- [#22180](https://github.com/LedgerHQ/ledger-live/pull/22180) [`24865c8`](https://github.com/LedgerHQ/ledger-live/commit/24865c8558cb9f228e18ff5fbe5ef263e41e736f) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - fix(coin-evm): fix cors-breaking evm explorer defaults

- [#22187](https://github.com/LedgerHQ/ledger-live/pull/22187) [`31ec33f`](https://github.com/LedgerHQ/ledger-live/commit/31ec33f649209bd2b6971afc173e2e41f53c313f) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - aleo part 2 staking ui

- [#21905](https://github.com/LedgerHQ/ledger-live/pull/21905) [`35c9b91`](https://github.com/LedgerHQ/ledger-live/commit/35c9b91735fb3fd0f2d1dc63a2288c9c7b7ad0ab) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(llc): add `contextLogger` adapter around `log`

- [#21835](https://github.com/LedgerHQ/ledger-live/pull/21835) [`5d2f40f`](https://github.com/LedgerHQ/ledger-live/commit/5d2f40f470f859960e43a2a08755a962796f6beb) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Casper fee estimation now names a valid dummy recipient, which a new test asserts for every family enabled on the generic coin framework.

  Three additions on the way, in preparation for enabling Solana: a family can contribute its own fields to a token sub-account through the new `buildTokenAccountShapes` bridge hook; a fee estimation can propagate a transfer fee, a stake account rent and an owner token account onto the transaction, and a transfer fee is now assigned even when absent, so a fee kept from a previously selected asset can no longer reach the device screen; and a staking position's locked reserve counts towards the staked balance.

  `asset-aggregation` now declares its transitive dependency on `ledger-wallet-framework`, like every other consumer of `live-countervalues`, so its build waits for the framework's declarations.

  No family declares the new hook yet, and no coin module emits the new fee parameters or a locked reserve, so nothing changes on screen beyond the Casper fix.

- [#22092](https://github.com/LedgerHQ/ledger-live/pull/22092) [`a1108d3`](https://github.com/LedgerHQ/ledger-live/commit/a1108d3f604027d2589fdc31cf90dfb06a4d75ab) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(llc): update default config for Arc mainnet

- [#22261](https://github.com/LedgerHQ/ledger-live/pull/22261) [`791c54a`](https://github.com/LedgerHQ/ledger-live/commit/791c54ae44ef1c8301f76e82e427f6f8c04176f1) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Support Cardano firmware app v8.0.8 by bumping @cardano-foundation/ledgerjs-hw-app-cardano from 7.x to 8.0.0. The v7 host binding used an older APDU protocol incompatible with the rewritten v8 device app, breaking account scan, receive and signing flows on firmware 8.0.x. Also raise the Cardano nano app minVersion to 8.0.8 so users on an incompatible older app are prompted to update instead of hitting broken flows.

- [#21948](https://github.com/LedgerHQ/ledger-live/pull/21948) [`5df5893`](https://github.com/LedgerHQ/ledger-live/commit/5df5893134ac2db18f758519bb15af8f532e95b4) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - chore(llc): bump `coin-hypercore`, `coin-xrp`, `coin-stellar`, `coin-tezos`

- [#22106](https://github.com/LedgerHQ/ledger-live/pull/22106) [`a0ae584`](https://github.com/LedgerHQ/ledger-live/commit/a0ae584c9c6592f6c5139ad20e6b1c8e42452972) Thanks [@vladyslavchupovskiy-ext-art](https://github.com/vladyslavchupovskiy-ext-art)! - Add Gonka (GNK) to the supported currencies

- [#21657](https://github.com/LedgerHQ/ledger-live/pull/21657) [`54a71f6`](https://github.com/LedgerHQ/ledger-live/commit/54a71f63dae4df25bafba99db5562ca2462c9cd7) Thanks [@pawell24](https://github.com/pawell24)! - feat(near): wire NEAR signer to generic coin framework

- [#21690](https://github.com/LedgerHQ/ledger-live/pull/21690) [`727cd08`](https://github.com/LedgerHQ/ledger-live/commit/727cd089d9b2a112fd297502417567777dd51871) Thanks [@pawell24](https://github.com/pawell24)! - feat(near): adapt NEAR UI to generic coin framework staking positions

- [#22143](https://github.com/LedgerHQ/ledger-live/pull/22143) [`29ce771`](https://github.com/LedgerHQ/ledger-live/commit/29ce7712ce93cd27afa97eda2d14a0ff066551fb) Thanks [@gre-ledger](https://github.com/gre-ledger)! - refactor(noble-curves): replace the APIs @noble/curves 2.x renames away

- [#21752](https://github.com/LedgerHQ/ledger-live/pull/21752) [`2a5d4e9`](https://github.com/LedgerHQ/ledger-live/commit/2a5d4e9582655518968f3c60579d6fa5a7d6c0a7) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Open Pay from a contact address on the amount step after picking the debit account

- [#21841](https://github.com/LedgerHQ/ledger-live/pull/21841) [`d59d123`](https://github.com/LedgerHQ/ledger-live/commit/d59d123a2ba037b44507b1f5424e31f05309ec26) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(cosmos): migrate account resources to shared staking aggregate

- [#22083](https://github.com/LedgerHQ/ledger-live/pull/22083) [`f44101e`](https://github.com/LedgerHQ/ledger-live/commit/f44101efbe2e3325fb001fcd4a762a619a7cfc77) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Drop coin-evm's legacy stateful config singleton usage from EVM swap/approval signing and coin-testers

- [#21967](https://github.com/LedgerHQ/ledger-live/pull/21967) [`40251b4`](https://github.com/LedgerHQ/ledger-live/commit/40251b41a62b2381c5c79410073a5f0b3c1fe629) Thanks [@sarneijim](https://github.com/sarneijim)! - Remove the obsolete original Wallet V4 tour

- [#22299](https://github.com/LedgerHQ/ledger-live/pull/22299) [`470bca7`](https://github.com/LedgerHQ/ledger-live/commit/470bca79315b3bb8242d01dd33e26b2b0da460ba) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Include send flow source in tracking properties on desktop and mobile.

- [#22069](https://github.com/LedgerHQ/ledger-live/pull/22069) [`bb3e182`](https://github.com/LedgerHQ/ledger-live/commit/bb3e1822bfc2cb9ff00089082782d9e2bd229b67) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(coin-cosmos): Add the Cosmos CoinFrameworkSigner adapter so the generic account bridge can construct, receive, and sign without extra device address confirmation

- [#21377](https://github.com/LedgerHQ/ledger-live/pull/21377) [`1603611`](https://github.com/LedgerHQ/ledger-live/commit/1603611179046f098fba526aafb9633466448e05) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Align Stellar coin family with @ledgerhq/coin-stellar 9.7.2 export subpaths: import the API from `@ledgerhq/coin-stellar/api` and expose memo validation through the new `@ledgerhq/coin-stellar/logic-public` encapsulation

- [#22036](https://github.com/LedgerHQ/ledger-live/pull/22036) [`7f40a5a`](https://github.com/LedgerHQ/ledger-live/commit/7f40a5a1cc84b733ad3a3584b5a14f9fc21c95c8) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Add structured, PII-free A4 observability logs for registration, read-vs-delegate decisions, and DC-roam failover

- [#22177](https://github.com/LedgerHQ/ledger-live/pull/22177) [`d750b9f`](https://github.com/LedgerHQ/ledger-live/commit/d750b9f8e7353d09d171f1c1f3cd44ab805e6f56) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Update @ledgerhq/coin-tezos to 12.0.1 and migrate the tezos family to its locked-down public API (`api`, `types`, `config`, `logic-public`, `network`, `constants`); the staking position predicates (isDelegationPosition/isStakePosition/isUnstakingPosition/isFinalizablePosition) are now owned by Ledger Live

- [#21942](https://github.com/LedgerHQ/ledger-live/pull/21942) [`61362d0`](https://github.com/LedgerHQ/ledger-live/commit/61362d0e482a62c6fe663080c8ce2f4a25ffdb00) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Extract a desktop BrazeProvider and share Braze refresh and identity synchronization lifecycles

### Patch Changes

- Updated dependencies [[`40d296b`](https://github.com/LedgerHQ/ledger-live/commit/40d296b822381cc5d05616acafa1bca61e500dce), [`2e94d90`](https://github.com/LedgerHQ/ledger-live/commit/2e94d909a573f7e52595a6fe38241f171ea7feab), [`724f029`](https://github.com/LedgerHQ/ledger-live/commit/724f02932ccdf8ba5b8f8f0ccc10b9edbe7547cd), [`cf09fa6`](https://github.com/LedgerHQ/ledger-live/commit/cf09fa63c7aa509b1958bc594795895089fdf8de), [`0a5c2a0`](https://github.com/LedgerHQ/ledger-live/commit/0a5c2a0e13782aa3d12a2be1466b604436fcb4ad), [`b5338ec`](https://github.com/LedgerHQ/ledger-live/commit/b5338ec9173a08073a4b8524fe095428bb710a99), [`49b535f`](https://github.com/LedgerHQ/ledger-live/commit/49b535fa6cab495b0b8659c042c743b8f65c2ce2), [`f1cd6f5`](https://github.com/LedgerHQ/ledger-live/commit/f1cd6f5c5b4b8c5da27f5603ef564c6a819de9f2), [`98e3038`](https://github.com/LedgerHQ/ledger-live/commit/98e303872684da47feca343c0db7d83fcce857b2), [`ea94dd0`](https://github.com/LedgerHQ/ledger-live/commit/ea94dd00d64bae6b7fd9c792da77ffba751a9f01), [`736a0d5`](https://github.com/LedgerHQ/ledger-live/commit/736a0d5ba692e2342df4fc503056524359d35d65), [`7848066`](https://github.com/LedgerHQ/ledger-live/commit/7848066f6ba1b803b5a8d3df02ce6d35e46b370e), [`1648042`](https://github.com/LedgerHQ/ledger-live/commit/164804200fcd3486d9f364a31b065cb7f7d2a170), [`eb2a2a5`](https://github.com/LedgerHQ/ledger-live/commit/eb2a2a598787555cc05ed7ae105dd1648fbe43f5), [`31ec33f`](https://github.com/LedgerHQ/ledger-live/commit/31ec33f649209bd2b6971afc173e2e41f53c313f), [`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68), [`a62ad28`](https://github.com/LedgerHQ/ledger-live/commit/a62ad28e4900a887567fb61fb8f197af4fa5a23b), [`6183efd`](https://github.com/LedgerHQ/ledger-live/commit/6183efddac5de725cb22a013d5a9cdc94e65f756), [`5d2f40f`](https://github.com/LedgerHQ/ledger-live/commit/5d2f40f470f859960e43a2a08755a962796f6beb), [`62a6f6c`](https://github.com/LedgerHQ/ledger-live/commit/62a6f6c516180411942c54ef686219387c41fb95), [`bf2987f`](https://github.com/LedgerHQ/ledger-live/commit/bf2987f5dfdb90062c453b02f0512d89c0c55693), [`3ad1c58`](https://github.com/LedgerHQ/ledger-live/commit/3ad1c58b2d2da192b8178e17c759a9d4e1558c4f), [`727cd08`](https://github.com/LedgerHQ/ledger-live/commit/727cd089d9b2a112fd297502417567777dd51871), [`29ce771`](https://github.com/LedgerHQ/ledger-live/commit/29ce7712ce93cd27afa97eda2d14a0ff066551fb), [`c48d6d7`](https://github.com/LedgerHQ/ledger-live/commit/c48d6d71b7ec0318cfec3277c119284a88d652f7), [`d6739d7`](https://github.com/LedgerHQ/ledger-live/commit/d6739d7fdc0b02ea26d2a29f6512f28b45c4ac38), [`d1d0d90`](https://github.com/LedgerHQ/ledger-live/commit/d1d0d90e75648ae1127b5682a6244b8e8268550a), [`d59d123`](https://github.com/LedgerHQ/ledger-live/commit/d59d123a2ba037b44507b1f5424e31f05309ec26), [`a304cfe`](https://github.com/LedgerHQ/ledger-live/commit/a304cfe5d6ea2ad27e0a4cb1fd6bc5761b951585), [`40251b4`](https://github.com/LedgerHQ/ledger-live/commit/40251b41a62b2381c5c79410073a5f0b3c1fe629), [`bb3e182`](https://github.com/LedgerHQ/ledger-live/commit/bb3e1822bfc2cb9ff00089082782d9e2bd229b67), [`31208bf`](https://github.com/LedgerHQ/ledger-live/commit/31208bfbd73f45dbdd817802e6468211cba77de6), [`c55b967`](https://github.com/LedgerHQ/ledger-live/commit/c55b967ed644a1639fb385281b75923532f7f0b7), [`8dead4f`](https://github.com/LedgerHQ/ledger-live/commit/8dead4fcb776189c366401305586323ee9df0525), [`809cf40`](https://github.com/LedgerHQ/ledger-live/commit/809cf40a737cd79ee0da09fcc8c541955b11eb66), [`e2134f5`](https://github.com/LedgerHQ/ledger-live/commit/e2134f5cffe4669ff5896e2b52904fe22218461b)]:
  - @shared/env@0.8.0
  - @ledgerhq/asset-aggregation@0.16.0
  - @ledgerhq/coin-aleo@2.5.0
  - @ledgerhq/coin-vechain@4.3.0
  - @domain/entity-currency-crypto@0.13.0
  - @ledgerhq/coin-concordium@1.4.0
  - @ledgerhq/coin-algorand@2.2.0
  - @ledgerhq/coin-aptos@4.2.0
  - @ledgerhq/coin-bitcoin@0.53.0
  - @ledgerhq/coin-canton@1.2.0
  - @ledgerhq/coin-cardano@1.2.0
  - @ledgerhq/coin-casper@3.4.0
  - @ledgerhq/coin-celo@3.3.0
  - @ledgerhq/coin-cosmos@1.4.0
  - @ledgerhq/coin-filecoin@2.2.0
  - @ledgerhq/coin-hedera@2.5.0
  - @ledgerhq/coin-icon@0.30.0
  - @ledgerhq/coin-internet_computer@1.31.0
  - @ledgerhq/coin-kaspa@2.3.0
  - @ledgerhq/coin-mina@1.24.0
  - @ledgerhq/coin-multiversx@1.2.0
  - @ledgerhq/coin-near@1.2.0
  - @ledgerhq/coin-polkadot@7.3.0
  - @ledgerhq/coin-solana@2.2.0
  - @ledgerhq/coin-stacks@0.31.0
  - @ledgerhq/coin-sui@1.3.0
  - @ledgerhq/coin-ton@0.38.0
  - @ledgerhq/coin-tron@9.0.0
  - @ledgerhq/coin-zcash@0.9.0
  - @ledgerhq/evm-tools@1.15.0
  - @ledgerhq/hw-app-algorand@6.36.0
  - @ledgerhq/hw-app-aptos@6.39.0
  - @ledgerhq/hw-app-btc@11.6.0
  - @ledgerhq/hw-app-eth@7.9.0
  - @ledgerhq/hw-app-exchange@0.28.0
  - @ledgerhq/hw-app-hedera@1.7.0
  - @ledgerhq/hw-app-icon@1.8.0
  - @ledgerhq/hw-app-multiversx@6.31.0
  - @ledgerhq/hw-app-near@6.36.0
  - @ledgerhq/hw-app-polkadot@6.39.0
  - @ledgerhq/hw-app-str@7.8.0
  - @ledgerhq/hw-app-sui@1.12.0
  - @ledgerhq/hw-app-tezos@6.37.0
  - @ledgerhq/hw-app-trx@6.37.0
  - @ledgerhq/hw-app-vet@0.14.0
  - @ledgerhq/hw-app-xrp@6.38.0
  - @ledgerhq/hw-bolos@6.37.0
  - @ledgerhq/ledger-wallet-framework@3.5.0
  - @ledgerhq/speculos-transport@0.12.0
  - @ledgerhq/live-env@4.1.0
  - @features/platform-env@0.4.0
  - @ledgerhq/live-dmk-shared@0.33.0
  - @ledgerhq/wallet-btc@0.6.0
  - @shared/feature-flags@0.24.0
  - @ledgerhq/live-signer-concordium@0.9.0
  - @features/platform-feature-flags@0.8.0
  - @domain/api-aggregated-assets@0.5.2
  - @features/platform-aggregated-assets@0.5.4
  - @ledgerhq/ledger-cal-service@1.19.7
  - @ledgerhq/ledger-trust-service@0.8.18
  - @ledgerhq/live-signer-solana@0.21.4
  - @ledgerhq/transaction-observability@0.3.2
  - @domain/api-currency-token@0.6.2
  - @domain/api-swap-quotes@0.2.5
  - @ledgerhq/live-signer-aleo@0.19.12
  - @domain/entity-currency@0.4.4
  - @domain/entity-currency-token@0.5.3
  - @ledgerhq/live-currency-format@0.15.0
  - @ledgerhq/live-signer-canton@0.9.21
  - @ledgerhq/live-signer-celo@1.2.8
  - @ledgerhq/live-signer-cosmos@0.5.1
  - @ledgerhq/live-signer-icp@0.1.7
  - @ledgerhq/live-signer-evm@0.23.3
  - @ledgerhq/live-signer-xrp@0.2.1
  - @ledgerhq/live-countervalues@0.26.1
  - @ledgerhq/live-countervalues-react@0.18.1
  - @ledgerhq/device-core@0.11.17
  - @ledgerhq/domain-service@1.8.20
  - @ledgerhq/live-signer-zcash@0.10.0

## 38.1.0-next.0

### Minor Changes

- [#21999](https://github.com/LedgerHQ/ledger-live/pull/21999) [`724f029`](https://github.com/LedgerHQ/ledger-live/commit/724f02932ccdf8ba5b8f8f0ccc10b9edbe7547cd) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat(aleo): share the bond pieces between Desktop and Mobile

  Replaces the ad-hoc messages `getTransactionStatus` returned for a rejected bond with typed
  error classes, translated on both clients and now distinguishing a closed validator from an
  unbonding one. Adds the `isValidatorBondable` / `getMinBondAmount` helpers to the coin
  module, moves the per-network default validator into the Aleo currency config so every
  client reads the same address, and adds a reusable Aleo bridge mock for Mobile.

- [#22137](https://github.com/LedgerHQ/ledger-live/pull/22137) [`353ed46`](https://github.com/LedgerHQ/ledger-live/commit/353ed46035b09d33eff6b5b76fe7ad3d19510e38) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat(aleo): show the staking position and its status on the Mobile account page

- [#22123](https://github.com/LedgerHQ/ledger-live/pull/22123) [`b5338ec`](https://github.com/LedgerHQ/ledger-live/commit/b5338ec9173a08073a4b8524fe095428bb710a99) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - feat(aleo): add the shared staking hooks the delegation views read

- [#22212](https://github.com/LedgerHQ/ledger-live/pull/22212) [`49b535f`](https://github.com/LedgerHQ/ledger-live/commit/49b535fa6cab495b0b8659c042c743b8f65c2ce2) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - refactor(aleo): serve the validator committee from RTK Query

- [#22057](https://github.com/LedgerHQ/ledger-live/pull/22057) [`926952b`](https://github.com/LedgerHQ/ledger-live/commit/926952ba724cb42860718c4af553be725d1265a9) Thanks [@0xMM-L](https://github.com/0xMM-L)! - Rebuild the typed device errors that `@zondax/ledger-casper` flattens into a raw return code, so a Casper transaction or address rejected on device shows the "Action rejected" copy and a locked device shows the unlock screen, instead of a raw `27014 - ...` / `21781 - Unknown Status Code` error.

- [#22180](https://github.com/LedgerHQ/ledger-live/pull/22180) [`24865c8`](https://github.com/LedgerHQ/ledger-live/commit/24865c8558cb9f228e18ff5fbe5ef263e41e736f) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - fix(coin-evm): fix cors-breaking evm explorer defaults

- [#22187](https://github.com/LedgerHQ/ledger-live/pull/22187) [`31ec33f`](https://github.com/LedgerHQ/ledger-live/commit/31ec33f649209bd2b6971afc173e2e41f53c313f) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - aleo part 2 staking ui

- [#21905](https://github.com/LedgerHQ/ledger-live/pull/21905) [`35c9b91`](https://github.com/LedgerHQ/ledger-live/commit/35c9b91735fb3fd0f2d1dc63a2288c9c7b7ad0ab) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(llc): add `contextLogger` adapter around `log`

- [#21835](https://github.com/LedgerHQ/ledger-live/pull/21835) [`5d2f40f`](https://github.com/LedgerHQ/ledger-live/commit/5d2f40f470f859960e43a2a08755a962796f6beb) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Casper fee estimation now names a valid dummy recipient, which a new test asserts for every family enabled on the generic coin framework.

  Three additions on the way, in preparation for enabling Solana: a family can contribute its own fields to a token sub-account through the new `buildTokenAccountShapes` bridge hook; a fee estimation can propagate a transfer fee, a stake account rent and an owner token account onto the transaction, and a transfer fee is now assigned even when absent, so a fee kept from a previously selected asset can no longer reach the device screen; and a staking position's locked reserve counts towards the staked balance.

  `asset-aggregation` now declares its transitive dependency on `ledger-wallet-framework`, like every other consumer of `live-countervalues`, so its build waits for the framework's declarations.

  No family declares the new hook yet, and no coin module emits the new fee parameters or a locked reserve, so nothing changes on screen beyond the Casper fix.

- [#22092](https://github.com/LedgerHQ/ledger-live/pull/22092) [`a1108d3`](https://github.com/LedgerHQ/ledger-live/commit/a1108d3f604027d2589fdc31cf90dfb06a4d75ab) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(llc): update default config for Arc mainnet

- [#22261](https://github.com/LedgerHQ/ledger-live/pull/22261) [`791c54a`](https://github.com/LedgerHQ/ledger-live/commit/791c54ae44ef1c8301f76e82e427f6f8c04176f1) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Support Cardano firmware app v8.0.8 by bumping @cardano-foundation/ledgerjs-hw-app-cardano from 7.x to 8.0.0. The v7 host binding used an older APDU protocol incompatible with the rewritten v8 device app, breaking account scan, receive and signing flows on firmware 8.0.x. Also raise the Cardano nano app minVersion to 8.0.8 so users on an incompatible older app are prompted to update instead of hitting broken flows.

- [#21948](https://github.com/LedgerHQ/ledger-live/pull/21948) [`5df5893`](https://github.com/LedgerHQ/ledger-live/commit/5df5893134ac2db18f758519bb15af8f532e95b4) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - chore(llc): bump `coin-hypercore`, `coin-xrp`, `coin-stellar`, `coin-tezos`

- [#22106](https://github.com/LedgerHQ/ledger-live/pull/22106) [`a0ae584`](https://github.com/LedgerHQ/ledger-live/commit/a0ae584c9c6592f6c5139ad20e6b1c8e42452972) Thanks [@vladyslavchupovskiy-ext-art](https://github.com/vladyslavchupovskiy-ext-art)! - Add Gonka (GNK) to the supported currencies

- [#21657](https://github.com/LedgerHQ/ledger-live/pull/21657) [`54a71f6`](https://github.com/LedgerHQ/ledger-live/commit/54a71f63dae4df25bafba99db5562ca2462c9cd7) Thanks [@pawell24](https://github.com/pawell24)! - feat(near): wire NEAR signer to generic coin framework

- [#21690](https://github.com/LedgerHQ/ledger-live/pull/21690) [`727cd08`](https://github.com/LedgerHQ/ledger-live/commit/727cd089d9b2a112fd297502417567777dd51871) Thanks [@pawell24](https://github.com/pawell24)! - feat(near): adapt NEAR UI to generic coin framework staking positions

- [#22143](https://github.com/LedgerHQ/ledger-live/pull/22143) [`29ce771`](https://github.com/LedgerHQ/ledger-live/commit/29ce7712ce93cd27afa97eda2d14a0ff066551fb) Thanks [@gre-ledger](https://github.com/gre-ledger)! - refactor(noble-curves): replace the APIs @noble/curves 2.x renames away

- [#21752](https://github.com/LedgerHQ/ledger-live/pull/21752) [`2a5d4e9`](https://github.com/LedgerHQ/ledger-live/commit/2a5d4e9582655518968f3c60579d6fa5a7d6c0a7) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Open Pay from a contact address on the amount step after picking the debit account

- [#21841](https://github.com/LedgerHQ/ledger-live/pull/21841) [`d59d123`](https://github.com/LedgerHQ/ledger-live/commit/d59d123a2ba037b44507b1f5424e31f05309ec26) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(cosmos): migrate account resources to shared staking aggregate

- [#22083](https://github.com/LedgerHQ/ledger-live/pull/22083) [`f44101e`](https://github.com/LedgerHQ/ledger-live/commit/f44101efbe2e3325fb001fcd4a762a619a7cfc77) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Drop coin-evm's legacy stateful config singleton usage from EVM swap/approval signing and coin-testers

- [#21967](https://github.com/LedgerHQ/ledger-live/pull/21967) [`40251b4`](https://github.com/LedgerHQ/ledger-live/commit/40251b41a62b2381c5c79410073a5f0b3c1fe629) Thanks [@sarneijim](https://github.com/sarneijim)! - Remove the obsolete original Wallet V4 tour

- [#22299](https://github.com/LedgerHQ/ledger-live/pull/22299) [`470bca7`](https://github.com/LedgerHQ/ledger-live/commit/470bca79315b3bb8242d01dd33e26b2b0da460ba) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Include send flow source in tracking properties on desktop and mobile.

- [#22069](https://github.com/LedgerHQ/ledger-live/pull/22069) [`bb3e182`](https://github.com/LedgerHQ/ledger-live/commit/bb3e1822bfc2cb9ff00089082782d9e2bd229b67) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(coin-cosmos): Add the Cosmos CoinFrameworkSigner adapter so the generic account bridge can construct, receive, and sign without extra device address confirmation

- [#21377](https://github.com/LedgerHQ/ledger-live/pull/21377) [`1603611`](https://github.com/LedgerHQ/ledger-live/commit/1603611179046f098fba526aafb9633466448e05) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Align Stellar coin family with @ledgerhq/coin-stellar 9.7.2 export subpaths: import the API from `@ledgerhq/coin-stellar/api` and expose memo validation through the new `@ledgerhq/coin-stellar/logic-public` encapsulation

- [#22036](https://github.com/LedgerHQ/ledger-live/pull/22036) [`7f40a5a`](https://github.com/LedgerHQ/ledger-live/commit/7f40a5a1cc84b733ad3a3584b5a14f9fc21c95c8) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Add structured, PII-free A4 observability logs for registration, read-vs-delegate decisions, and DC-roam failover

- [#22177](https://github.com/LedgerHQ/ledger-live/pull/22177) [`d750b9f`](https://github.com/LedgerHQ/ledger-live/commit/d750b9f8e7353d09d171f1c1f3cd44ab805e6f56) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Update @ledgerhq/coin-tezos to 12.0.1 and migrate the tezos family to its locked-down public API (`api`, `types`, `config`, `logic-public`, `network`, `constants`); the staking position predicates (isDelegationPosition/isStakePosition/isUnstakingPosition/isFinalizablePosition) are now owned by Ledger Live

- [#21942](https://github.com/LedgerHQ/ledger-live/pull/21942) [`61362d0`](https://github.com/LedgerHQ/ledger-live/commit/61362d0e482a62c6fe663080c8ce2f4a25ffdb00) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Extract a desktop BrazeProvider and share Braze refresh and identity synchronization lifecycles

### Patch Changes

- Updated dependencies [[`40d296b`](https://github.com/LedgerHQ/ledger-live/commit/40d296b822381cc5d05616acafa1bca61e500dce), [`2e94d90`](https://github.com/LedgerHQ/ledger-live/commit/2e94d909a573f7e52595a6fe38241f171ea7feab), [`724f029`](https://github.com/LedgerHQ/ledger-live/commit/724f02932ccdf8ba5b8f8f0ccc10b9edbe7547cd), [`cf09fa6`](https://github.com/LedgerHQ/ledger-live/commit/cf09fa63c7aa509b1958bc594795895089fdf8de), [`0a5c2a0`](https://github.com/LedgerHQ/ledger-live/commit/0a5c2a0e13782aa3d12a2be1466b604436fcb4ad), [`b5338ec`](https://github.com/LedgerHQ/ledger-live/commit/b5338ec9173a08073a4b8524fe095428bb710a99), [`49b535f`](https://github.com/LedgerHQ/ledger-live/commit/49b535fa6cab495b0b8659c042c743b8f65c2ce2), [`f1cd6f5`](https://github.com/LedgerHQ/ledger-live/commit/f1cd6f5c5b4b8c5da27f5603ef564c6a819de9f2), [`98e3038`](https://github.com/LedgerHQ/ledger-live/commit/98e303872684da47feca343c0db7d83fcce857b2), [`ea94dd0`](https://github.com/LedgerHQ/ledger-live/commit/ea94dd00d64bae6b7fd9c792da77ffba751a9f01), [`736a0d5`](https://github.com/LedgerHQ/ledger-live/commit/736a0d5ba692e2342df4fc503056524359d35d65), [`7848066`](https://github.com/LedgerHQ/ledger-live/commit/7848066f6ba1b803b5a8d3df02ce6d35e46b370e), [`1648042`](https://github.com/LedgerHQ/ledger-live/commit/164804200fcd3486d9f364a31b065cb7f7d2a170), [`eb2a2a5`](https://github.com/LedgerHQ/ledger-live/commit/eb2a2a598787555cc05ed7ae105dd1648fbe43f5), [`31ec33f`](https://github.com/LedgerHQ/ledger-live/commit/31ec33f649209bd2b6971afc173e2e41f53c313f), [`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68), [`a62ad28`](https://github.com/LedgerHQ/ledger-live/commit/a62ad28e4900a887567fb61fb8f197af4fa5a23b), [`6183efd`](https://github.com/LedgerHQ/ledger-live/commit/6183efddac5de725cb22a013d5a9cdc94e65f756), [`5d2f40f`](https://github.com/LedgerHQ/ledger-live/commit/5d2f40f470f859960e43a2a08755a962796f6beb), [`62a6f6c`](https://github.com/LedgerHQ/ledger-live/commit/62a6f6c516180411942c54ef686219387c41fb95), [`bf2987f`](https://github.com/LedgerHQ/ledger-live/commit/bf2987f5dfdb90062c453b02f0512d89c0c55693), [`3ad1c58`](https://github.com/LedgerHQ/ledger-live/commit/3ad1c58b2d2da192b8178e17c759a9d4e1558c4f), [`727cd08`](https://github.com/LedgerHQ/ledger-live/commit/727cd089d9b2a112fd297502417567777dd51871), [`29ce771`](https://github.com/LedgerHQ/ledger-live/commit/29ce7712ce93cd27afa97eda2d14a0ff066551fb), [`c48d6d7`](https://github.com/LedgerHQ/ledger-live/commit/c48d6d71b7ec0318cfec3277c119284a88d652f7), [`d6739d7`](https://github.com/LedgerHQ/ledger-live/commit/d6739d7fdc0b02ea26d2a29f6512f28b45c4ac38), [`d1d0d90`](https://github.com/LedgerHQ/ledger-live/commit/d1d0d90e75648ae1127b5682a6244b8e8268550a), [`d59d123`](https://github.com/LedgerHQ/ledger-live/commit/d59d123a2ba037b44507b1f5424e31f05309ec26), [`a304cfe`](https://github.com/LedgerHQ/ledger-live/commit/a304cfe5d6ea2ad27e0a4cb1fd6bc5761b951585), [`40251b4`](https://github.com/LedgerHQ/ledger-live/commit/40251b41a62b2381c5c79410073a5f0b3c1fe629), [`bb3e182`](https://github.com/LedgerHQ/ledger-live/commit/bb3e1822bfc2cb9ff00089082782d9e2bd229b67), [`31208bf`](https://github.com/LedgerHQ/ledger-live/commit/31208bfbd73f45dbdd817802e6468211cba77de6), [`c55b967`](https://github.com/LedgerHQ/ledger-live/commit/c55b967ed644a1639fb385281b75923532f7f0b7), [`8dead4f`](https://github.com/LedgerHQ/ledger-live/commit/8dead4fcb776189c366401305586323ee9df0525), [`809cf40`](https://github.com/LedgerHQ/ledger-live/commit/809cf40a737cd79ee0da09fcc8c541955b11eb66), [`e2134f5`](https://github.com/LedgerHQ/ledger-live/commit/e2134f5cffe4669ff5896e2b52904fe22218461b)]:
  - @shared/env@0.8.0-next.0
  - @ledgerhq/asset-aggregation@0.16.0-next.0
  - @ledgerhq/coin-aleo@2.5.0-next.0
  - @ledgerhq/coin-vechain@4.3.0-next.0
  - @domain/entity-currency-crypto@0.13.0-next.0
  - @ledgerhq/coin-concordium@1.4.0-next.0
  - @ledgerhq/coin-algorand@2.2.0-next.0
  - @ledgerhq/coin-aptos@4.2.0-next.0
  - @ledgerhq/coin-bitcoin@0.53.0-next.0
  - @ledgerhq/coin-canton@1.2.0-next.0
  - @ledgerhq/coin-cardano@1.2.0-next.0
  - @ledgerhq/coin-casper@3.4.0-next.0
  - @ledgerhq/coin-celo@3.3.0-next.0
  - @ledgerhq/coin-cosmos@1.4.0-next.0
  - @ledgerhq/coin-filecoin@2.2.0-next.0
  - @ledgerhq/coin-hedera@2.5.0-next.0
  - @ledgerhq/coin-icon@0.30.0-next.0
  - @ledgerhq/coin-internet_computer@1.31.0-next.0
  - @ledgerhq/coin-kaspa@2.3.0-next.0
  - @ledgerhq/coin-mina@1.24.0-next.0
  - @ledgerhq/coin-multiversx@1.2.0-next.0
  - @ledgerhq/coin-near@1.2.0-next.0
  - @ledgerhq/coin-polkadot@7.3.0-next.0
  - @ledgerhq/coin-solana@2.2.0-next.0
  - @ledgerhq/coin-stacks@0.31.0-next.0
  - @ledgerhq/coin-sui@1.3.0-next.0
  - @ledgerhq/coin-ton@0.38.0-next.0
  - @ledgerhq/coin-tron@9.0.0-next.0
  - @ledgerhq/coin-zcash@0.9.0-next.0
  - @ledgerhq/evm-tools@1.15.0-next.0
  - @ledgerhq/hw-app-algorand@6.36.0-next.0
  - @ledgerhq/hw-app-aptos@6.39.0-next.0
  - @ledgerhq/hw-app-btc@11.6.0-next.0
  - @ledgerhq/hw-app-eth@7.9.0-next.0
  - @ledgerhq/hw-app-exchange@0.28.0-next.0
  - @ledgerhq/hw-app-hedera@1.7.0-next.0
  - @ledgerhq/hw-app-icon@1.8.0-next.0
  - @ledgerhq/hw-app-multiversx@6.31.0-next.0
  - @ledgerhq/hw-app-near@6.36.0-next.0
  - @ledgerhq/hw-app-polkadot@6.39.0-next.0
  - @ledgerhq/hw-app-str@7.8.0-next.0
  - @ledgerhq/hw-app-sui@1.12.0-next.0
  - @ledgerhq/hw-app-tezos@6.37.0-next.0
  - @ledgerhq/hw-app-trx@6.37.0-next.0
  - @ledgerhq/hw-app-vet@0.14.0-next.0
  - @ledgerhq/hw-app-xrp@6.38.0-next.0
  - @ledgerhq/hw-bolos@6.37.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.5.0-next.0
  - @ledgerhq/speculos-transport@0.12.0-next.0
  - @ledgerhq/live-env@4.1.0-next.0
  - @features/platform-env@0.4.0-next.0
  - @ledgerhq/live-dmk-shared@0.33.0-next.0
  - @ledgerhq/wallet-btc@0.6.0-next.0
  - @shared/feature-flags@0.24.0-next.0
  - @ledgerhq/live-signer-concordium@0.9.0-next.0
  - @features/platform-feature-flags@0.8.0-next.0
  - @domain/api-aggregated-assets@0.5.2-next.0
  - @features/platform-aggregated-assets@0.5.4-next.0
  - @ledgerhq/ledger-cal-service@1.19.7-next.0
  - @ledgerhq/ledger-trust-service@0.8.18-next.0
  - @ledgerhq/live-signer-solana@0.21.4-next.0
  - @ledgerhq/transaction-observability@0.3.2-next.0
  - @domain/api-currency-token@0.6.2-next.0
  - @domain/api-swap-quotes@0.2.5-next.0
  - @ledgerhq/live-signer-aleo@0.19.12-next.0
  - @domain/entity-currency@0.4.4-next.0
  - @domain/entity-currency-token@0.5.3-next.0
  - @ledgerhq/live-currency-format@0.15.0
  - @ledgerhq/live-signer-canton@0.9.21-next.0
  - @ledgerhq/live-signer-celo@1.2.8-next.0
  - @ledgerhq/live-signer-cosmos@0.5.1-next.0
  - @ledgerhq/live-signer-icp@0.1.7-next.0
  - @ledgerhq/live-signer-evm@0.23.3-next.0
  - @ledgerhq/live-signer-xrp@0.2.1-next.0
  - @ledgerhq/live-countervalues@0.26.1-next.0
  - @ledgerhq/live-countervalues-react@0.18.1-next.0
  - @ledgerhq/device-core@0.11.17-next.0
  - @ledgerhq/domain-service@1.8.20-next.0
  - @ledgerhq/live-signer-zcash@0.10.0

## 38.0.0

### Major Changes

- [#21874](https://github.com/LedgerHQ/ledger-live/pull/21874) [`06b5db9`](https://github.com/LedgerHQ/ledger-live/commit/06b5db9dd2b49bbbf256e9376d67f9c64b3a1a4d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - feat: drop ACRE support

  Nothing consumes ACRE anymore: the live-app catalog serves no `acre` manifest and the mobile BTC stake action pointed at a missing live app.

  Removed:

  - the `@ledgerhq/wallet-api-acre-module` package
  - `wallet-api/ACRE` (server + tracking) and `families/bitcoin/ACRESetup.ts` in live-common
  - the `@blooo/hw-app-acre` dependency
  - every `isACRE` branch in the desktop and mobile sign message / sign transaction flows
  - `useACRECustomHandlers` on both apps
  - the mobile Bitcoin `accountActions` stake entry point

### Minor Changes

- [#21704](https://github.com/LedgerHQ/ledger-live/pull/21704) [`e09211c`](https://github.com/LedgerHQ/ledger-live/commit/e09211c3477dc91530c2670a0b34b29fb8d3d943) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Add a shared local eligibility engine for Braze Content Cards (`braze/localEligibility`). It parses the `extras.requiredStates` campaign contract (semicolon-separated) and evaluates a card against a boolean snapshot of the current app state, returning `{ eligible: true }` or `{ eligible: false, blockedBy, reason }`. The evaluator is pure and platform-agnostic; unknown/misspelled states fail safely (card hidden) with a debug signal. Platform integrations (mobile/desktop) consume it after fetch, before Redux dispatch.

- [#21665](https://github.com/LedgerHQ/ledger-live/pull/21665) [`16a454f`](https://github.com/LedgerHQ/ledger-live/commit/16a454fa79be46df6aec3c50ad40407f36dfdea9) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Fix saving a contact address on EVM networks that ship their own coin app, such as Sei, Sonic and Ethereum Classic. The device app to open is now derived from the network family rather than from the network's own `managerAppName`, so EVM networks with an EIP-155 chain ID register through the Ethereum app and are told apart by that chain ID, which is what the Contacts device kit expects. These networks are selectable again, reversing the restriction added in LIVE-36688.

  Address-book eligibility now lives in a single place: `isEligibleAddressCurrency` moves from `@ledgerhq/live-common` to `@features/platform-contacts`, where it checks device capability alongside the network family. The send flow and the Contacts network picker previously answered this question separately, which is how an entry point could be offered for a network the device would refuse.

- [#21656](https://github.com/LedgerHQ/ledger-live/pull/21656) [`85e01c4`](https://github.com/LedgerHQ/ledger-live/commit/85e01c449dab75d75851631a56d292f2cb0c5b36) Thanks [@sarneijim](https://github.com/sarneijim)! - Add the Q3 Wallet V4 Tour feature flag, persisted seen state, mobile debug setup, and Segment wallet40Attributes.q3Tour

- [#21924](https://github.com/LedgerHQ/ledger-live/pull/21924) [`cdb273b`](https://github.com/LedgerHQ/ledger-live/commit/cdb273b068df78cd5a0dbd4281fb79f22e0a7506) Thanks [@qperrot](https://github.com/qperrot)! - Fix account view crash when cosmos `cosmosResources` is undefined by handling missing resources gracefully in the delegation hook and account UI components

- [#21738](https://github.com/LedgerHQ/ledger-live/pull/21738) [`9e37f58`](https://github.com/LedgerHQ/ledger-live/commit/9e37f58a84f7ee9585142c0a8ac767da58b6d06f) Thanks [@ysitbon](https://github.com/ysitbon)! - Move the account-coupled tracking-pair code out of the countervalues packages and into `live-common`, next to the portfolio code it belongs with. `inferTrackingPairForAccounts` and `inferTrackingPairForAccountsUnresolved` leave `live-countervalues/logic`, and the `useTrackingPairForAccounts` hook that wraps them leaves `live-countervalues-react`.

  These three were the last things in the countervalues core that needed an `Account`, so `@ledgerhq/types-live` is now gone from the package entirely and from its dependency list. The core no longer knows what an account is; it only knows currency pairs and rates.

  The move was blocked until both packages became private: a published package cannot depend on a private one, and the hook re-exported a function that had to land in private `live-common`.

- [#21956](https://github.com/LedgerHQ/ledger-live/pull/21956) [`7bfbb69`](https://github.com/LedgerHQ/ledger-live/commit/7bfbb69b29d66d1b908cddd4b7cad893f77a8ebc) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Fix a race in the swap exchange flow where a stale/late cancel callback (e.g. a `DrawerClosedError`) could fire after the swap had already succeeded, causing the backend to receive both a swap accepted and a swap cancelled report for the same swap.

- [#21633](https://github.com/LedgerHQ/ledger-live/pull/21633) [`60655cd`](https://github.com/LedgerHQ/ledger-live/commit/60655cdf828eebdddd515d52c8fc5876ea50baf8) Thanks [@qperrot](https://github.com/qperrot)! - Add memo on xrp operation details

- [#21830](https://github.com/LedgerHQ/ledger-live/pull/21830) [`8146728`](https://github.com/LedgerHQ/ledger-live/commit/814672815a08dd57160d3aa4c28e92c3f508807e) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(llc): Wire A4 as the primary operations source in getAccountShape with transparent fallback to the coin-module delegate on error

- [#21732](https://github.com/LedgerHQ/ledger-live/pull/21732) [`b30a8cd`](https://github.com/LedgerHQ/ledger-live/commit/b30a8cd8acfeabb444cd7e2acb1ac5eaa959b221) Thanks [@henri-ly](https://github.com/henri-ly)! - Guard against a bridge extension returning an undefined spendable balance, which crashed the wallet-api serializer when selecting an Aleo token with no synced sub-account

- [#21887](https://github.com/LedgerHQ/ledger-live/pull/21887) [`a62261e`](https://github.com/LedgerHQ/ledger-live/commit/a62261e2e63218affcd3690a70b5a42f355a48a4) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Tell the user a currency is unavailable in their region instead of showing a generic balance error, and bump coin-module-framework to 9.1.0 for the typed checkRegionRestriction flag

- [#21751](https://github.com/LedgerHQ/ledger-live/pull/21751) [`dc204a7`](https://github.com/LedgerHQ/ledger-live/commit/dc204a7633e6f7c9acb66fbb18a6aeaa2e75c4bb) Thanks [@sarneijim](https://github.com/sarneijim)! - Add releaseTour and gate Q2/Q3 tours with it, dropping q2Tour/q3Tour from Wallet 4.0

- [#22270](https://github.com/LedgerHQ/ledger-live/pull/22270) [`354486c`](https://github.com/LedgerHQ/ledger-live/commit/354486ca79badb49b9c902b1724a36379c278358) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Support Cardano firmware app v8.0.8 by bumping @cardano-foundation/ledgerjs-hw-app-cardano from 7.x to 8.0.0. The v7 host binding used an older APDU protocol incompatible with the rewritten v8 device app, breaking account scan, receive and signing flows on firmware 8.0.x. Also raise the Cardano nano app minVersion to 8.0.8 so users on an incompatible older app are prompted to update instead of hitting broken flows.

- [#21884](https://github.com/LedgerHQ/ledger-live/pull/21884) [`d1a8cb2`](https://github.com/LedgerHQ/ledger-live/commit/d1a8cb2403bbe6771dfee3e43fbc4c4df61d4c7c) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-celo): move `stakingSupported` to `BridgeApi`

- [#21596](https://github.com/LedgerHQ/ledger-live/pull/21596) [`5ddb9ab`](https://github.com/LedgerHQ/ledger-live/commit/5ddb9ab2874a6715d706042701e8b2242b1c14b9) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Carry a chain's staking positions through the generic coin framework, and keep sub-accounts
  aligned with what the chain reports:

  - an unbonding position with no validator is no longer dropped from the account's list
  - `extractBalances` rebuilds staking positions, so a family validating a staking intent finds them
  - a position reads as withdrawable only when the chain offers a withdraw on it
  - `mergeSubAccounts` keeps only the sub-accounts the chain still reports, instead of letting a pruned one survive with a stale balance
  - a pending operation shows the user's memo only on a plain transfer

- [#21844](https://github.com/LedgerHQ/ledger-live/pull/21844) [`c72a646`](https://github.com/LedgerHQ/ledger-live/commit/c72a646d28a4a5d144808f4a99e80d7788895603) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(llc): update Arc mainnet native contract address

- [#20774](https://github.com/LedgerHQ/ledger-live/pull/20774) [`c6a569d`](https://github.com/LedgerHQ/ledger-live/commit/c6a569d5848e6c0fd7973cb5ab7241b39d47f77b) Thanks [@amaslakov](https://github.com/amaslakov)! - Add the ICP neuron management and voting-power confirmation flows on Desktop, with the periodic-confirmation decode and neuron helpers they run on.

  An accepted command is reflected as soon as the network accepts it, without waiting for a device-signed refresh, and the account re-syncs after a stake. A command the device has already signed is offered for retry only when the network says nothing ran. Actions a neuron cannot take are not offered — Increase stake without a recoverable stake nonce, Increase dissolve delay with under a day of room, a followee list that changes nothing. Staked maturity counts toward the account's Total Maturity, and a rejected input names the bound it broke rather than an error class name.

- [#21742](https://github.com/LedgerHQ/ledger-live/pull/21742) [`a9f0a51`](https://github.com/LedgerHQ/ledger-live/commit/a9f0a51f20cf3e7b038cc6e5762557e93760a37e) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - A4 pagination, ordering and incremental-sync continuity: drain all pages via `paginateOperations` with explicit `order:"DESC"` and `blocks=[minHeight,"latest"]` mapping.

- [#21735](https://github.com/LedgerHQ/ledger-live/pull/21735) [`a17ef12`](https://github.com/LedgerHQ/ledger-live/commit/a17ef128d44c9ca9bc85c3c8b8d691981c5e638f) Thanks [@amaslakov](https://github.com/amaslakov)! - Pass the coin-tezos context to the baker lookups, which now resolve the config themselves instead of taking a resolved one

- [#21683](https://github.com/LedgerHQ/ledger-live/pull/21683) [`2eb6f5c`](https://github.com/LedgerHQ/ledger-live/commit/2eb6f5c7b3a7694a028bfe62279102188aeac028) Thanks [@semeano](https://github.com/semeano)! - add balance-type pool selection step to Zcash send flow

  The amount step's 25/50/75% selectors now apply to the pool the user picked rather than to the account total, which sums pools the transaction cannot spend from.

  The recipient step's transfer-to-my-other-pool shortcut now records the transfer on the transaction (for Zcash, `selfTransfer`), so the prefilled address keeps its self-transfer semantics instead of looking like a send to a typed address. Picking any other recipient clears it again.

- [#21939](https://github.com/LedgerHQ/ledger-live/pull/21939) [`d1d26de`](https://github.com/LedgerHQ/ledger-live/commit/d1d26def09d28102238b31b684d1745c4f1ad8cc) Thanks [@semeano](https://github.com/semeano)! - Add Zcash shielded send screens (recipient sync notice and family device-signature confirmation) and block the recipient step until shielded sync reports complete

### Patch Changes

- Updated dependencies [[`92c97cf`](https://github.com/LedgerHQ/ledger-live/commit/92c97cf5ee26cbac54f0db25fcdc19336c2318a2), [`96a1ca9`](https://github.com/LedgerHQ/ledger-live/commit/96a1ca9fef1b0acc8113708c148890054dea143d), [`f5d0da5`](https://github.com/LedgerHQ/ledger-live/commit/f5d0da5d43ff492175433453b08533cee324c6e2), [`269d6d4`](https://github.com/LedgerHQ/ledger-live/commit/269d6d404779439d0e98beb2ed3cef82805612ae), [`4c64bdc`](https://github.com/LedgerHQ/ledger-live/commit/4c64bdc31d29b21c9ea31732ade8f6ba277b9107), [`452041f`](https://github.com/LedgerHQ/ledger-live/commit/452041f8123bc887534048ed94167c81ca54c2b6), [`81456c8`](https://github.com/LedgerHQ/ledger-live/commit/81456c8a3c1e4359f4697cced7c89e9be744f3f6), [`95b4e92`](https://github.com/LedgerHQ/ledger-live/commit/95b4e92bd6ba76987e0f1b540d21312a37c015b0), [`f6dc62f`](https://github.com/LedgerHQ/ledger-live/commit/f6dc62f7f23be9f46812fc13f00ddc373e5ca1af), [`738c0d8`](https://github.com/LedgerHQ/ledger-live/commit/738c0d8a1357e96713bfc0d7a40ca403b5290c35), [`85e01c4`](https://github.com/LedgerHQ/ledger-live/commit/85e01c449dab75d75851631a56d292f2cb0c5b36), [`fecfcf7`](https://github.com/LedgerHQ/ledger-live/commit/fecfcf7570ed70213a9c0e32c2822b4eb057eb03), [`05cb97c`](https://github.com/LedgerHQ/ledger-live/commit/05cb97c6986755d87d4c0b3df3d8b4daf9ba77df), [`251af57`](https://github.com/LedgerHQ/ledger-live/commit/251af57e7412e493deaecddf627e3967ba044c09), [`b30f903`](https://github.com/LedgerHQ/ledger-live/commit/b30f903f592c0bafba74a1784d98b9d605c18ccb), [`da3d09d`](https://github.com/LedgerHQ/ledger-live/commit/da3d09d75d7dcae659611cd371c48d75c03f7ae4), [`cdb273b`](https://github.com/LedgerHQ/ledger-live/commit/cdb273b068df78cd5a0dbd4281fb79f22e0a7506), [`54fce77`](https://github.com/LedgerHQ/ledger-live/commit/54fce77bfa46c3d42d3e39b80804258a91d910f2), [`ee1b919`](https://github.com/LedgerHQ/ledger-live/commit/ee1b9192421545035fb547f27319d7f816d85fe8), [`9e37f58`](https://github.com/LedgerHQ/ledger-live/commit/9e37f58a84f7ee9585142c0a8ac767da58b6d06f), [`7e44af4`](https://github.com/LedgerHQ/ledger-live/commit/7e44af495eccab1fac4b0808d6729a595b610c69), [`600d432`](https://github.com/LedgerHQ/ledger-live/commit/600d432657f1c9adf80af6730dd28f2177e05c5a), [`7050652`](https://github.com/LedgerHQ/ledger-live/commit/70506520dafbccca4e014ac30d75647a5b7fe7d0), [`bb2f03e`](https://github.com/LedgerHQ/ledger-live/commit/bb2f03e41b96b8f95f239acea75428657cdd64fe), [`2706dda`](https://github.com/LedgerHQ/ledger-live/commit/2706ddad88ea10d117093bba8775b6aef655fbda), [`c6df5b6`](https://github.com/LedgerHQ/ledger-live/commit/c6df5b65aa66f44d8dff124e4e1d089d53e1d1a6), [`a62261e`](https://github.com/LedgerHQ/ledger-live/commit/a62261e2e63218affcd3690a70b5a42f355a48a4), [`dc204a7`](https://github.com/LedgerHQ/ledger-live/commit/dc204a7633e6f7c9acb66fbb18a6aeaa2e75c4bb), [`d1a8cb2`](https://github.com/LedgerHQ/ledger-live/commit/d1a8cb2403bbe6771dfee3e43fbc4c4df61d4c7c), [`903c180`](https://github.com/LedgerHQ/ledger-live/commit/903c1802ea5d4cc3fe1bfe5609b8cf3871152cf0), [`30828c2`](https://github.com/LedgerHQ/ledger-live/commit/30828c22cc44c9929d7eda782e9d559a9e0145c3), [`0c413f3`](https://github.com/LedgerHQ/ledger-live/commit/0c413f3dcf65071bf963933f446fc24c9711a996), [`a6a7a94`](https://github.com/LedgerHQ/ledger-live/commit/a6a7a946b1c1dbdda1cfa2c049f536f7235ddde2), [`5ddb9ab`](https://github.com/LedgerHQ/ledger-live/commit/5ddb9ab2874a6715d706042701e8b2242b1c14b9), [`c6a569d`](https://github.com/LedgerHQ/ledger-live/commit/c6a569d5848e6c0fd7973cb5ab7241b39d47f77b), [`46340c1`](https://github.com/LedgerHQ/ledger-live/commit/46340c151a0d7854c65e78af3a7e6d839c349e3a), [`4c314f4`](https://github.com/LedgerHQ/ledger-live/commit/4c314f4035581de1affaba8419cd062359251c2f)]:
  - @ledgerhq/coin-vechain@4.2.0
  - @shared/feature-flags@0.23.0
  - @ledgerhq/coin-zcash@0.8.0
  - @ledgerhq/coin-aleo@2.4.0
  - @ledgerhq/coin-concordium@1.3.0
  - @features/platform-feature-flags@0.7.0
  - @ledgerhq/live-signer-concordium@0.8.0
  - @ledgerhq/speculos-transport@0.11.0
  - @ledgerhq/hw-app-btc@11.5.0
  - @shared/env@0.7.0
  - @ledgerhq/coin-cosmos@1.3.0
  - @ledgerhq/live-countervalues@0.26.0
  - @ledgerhq/live-countervalues-react@0.18.0
  - @ledgerhq/live-signer-cosmos@0.5.0
  - @ledgerhq/coin-hedera@2.4.0
  - @ledgerhq/coin-tron@8.1.0
  - @ledgerhq/coin-celo@3.2.0
  - @ledgerhq/wallet-btc@0.5.0
  - @ledgerhq/coin-internet_computer@1.30.0
  - @ledgerhq/ledger-wallet-framework@3.4.0
  - @ledgerhq/live-signer-aleo@0.19.11
  - @ledgerhq/asset-aggregation@0.15.1
  - @ledgerhq/coin-algorand@2.1.2
  - @ledgerhq/coin-aptos@4.1.2
  - @ledgerhq/coin-bitcoin@0.52.1
  - @ledgerhq/coin-canton@1.1.2
  - @ledgerhq/coin-cardano@1.1.2
  - @ledgerhq/coin-casper@3.3.1
  - @ledgerhq/coin-filecoin@2.1.2
  - @ledgerhq/coin-icon@0.29.5
  - @ledgerhq/coin-kaspa@2.2.2
  - @ledgerhq/coin-mina@1.23.1
  - @ledgerhq/coin-multiversx@1.1.2
  - @ledgerhq/coin-near@1.1.2
  - @ledgerhq/coin-polkadot@7.2.2
  - @ledgerhq/coin-solana@2.1.1
  - @ledgerhq/coin-stacks@0.30.2
  - @ledgerhq/coin-sui@1.2.2
  - @ledgerhq/coin-ton@0.37.4
  - @ledgerhq/device-core@0.11.16
  - @ledgerhq/domain-service@1.8.19
  - @ledgerhq/evm-tools@1.14.3
  - @ledgerhq/hw-app-eth@7.8.19
  - @ledgerhq/live-signer-canton@0.9.20
  - @ledgerhq/live-signer-celo@1.2.7
  - @ledgerhq/live-signer-evm@0.23.2
  - @ledgerhq/live-signer-icp@0.1.6
  - @ledgerhq/live-signer-solana@0.21.3
  - @ledgerhq/live-signer-zcash@0.10.0
  - @ledgerhq/transaction-observability@0.3.1
  - @ledgerhq/hw-app-exchange@0.27.0
  - @domain/api-aggregated-assets@0.5.1
  - @features/platform-aggregated-assets@0.5.3
  - @features/platform-env@0.3.1
  - @ledgerhq/ledger-cal-service@1.19.6
  - @ledgerhq/ledger-trust-service@0.8.17

## 38.0.0-next.1

### Minor Changes

- [#22270](https://github.com/LedgerHQ/ledger-live/pull/22270) [`354486c`](https://github.com/LedgerHQ/ledger-live/commit/354486ca79badb49b9c902b1724a36379c278358) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Support Cardano firmware app v8.0.8 by bumping @cardano-foundation/ledgerjs-hw-app-cardano from 7.x to 8.0.0. The v7 host binding used an older APDU protocol incompatible with the rewritten v8 device app, breaking account scan, receive and signing flows on firmware 8.0.x. Also raise the Cardano nano app minVersion to 8.0.8 so users on an incompatible older app are prompted to update instead of hitting broken flows.

## 38.0.0-next.0

### Major Changes

- [#21874](https://github.com/LedgerHQ/ledger-live/pull/21874) [`06b5db9`](https://github.com/LedgerHQ/ledger-live/commit/06b5db9dd2b49bbbf256e9376d67f9c64b3a1a4d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - feat: drop ACRE support

  Nothing consumes ACRE anymore: the live-app catalog serves no `acre` manifest and the mobile BTC stake action pointed at a missing live app.

  Removed:

  - the `@ledgerhq/wallet-api-acre-module` package
  - `wallet-api/ACRE` (server + tracking) and `families/bitcoin/ACRESetup.ts` in live-common
  - the `@blooo/hw-app-acre` dependency
  - every `isACRE` branch in the desktop and mobile sign message / sign transaction flows
  - `useACRECustomHandlers` on both apps
  - the mobile Bitcoin `accountActions` stake entry point

### Minor Changes

- [#21704](https://github.com/LedgerHQ/ledger-live/pull/21704) [`e09211c`](https://github.com/LedgerHQ/ledger-live/commit/e09211c3477dc91530c2670a0b34b29fb8d3d943) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Add a shared local eligibility engine for Braze Content Cards (`braze/localEligibility`). It parses the `extras.requiredStates` campaign contract (semicolon-separated) and evaluates a card against a boolean snapshot of the current app state, returning `{ eligible: true }` or `{ eligible: false, blockedBy, reason }`. The evaluator is pure and platform-agnostic; unknown/misspelled states fail safely (card hidden) with a debug signal. Platform integrations (mobile/desktop) consume it after fetch, before Redux dispatch.

- [#21665](https://github.com/LedgerHQ/ledger-live/pull/21665) [`16a454f`](https://github.com/LedgerHQ/ledger-live/commit/16a454fa79be46df6aec3c50ad40407f36dfdea9) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Fix saving a contact address on EVM networks that ship their own coin app, such as Sei, Sonic and Ethereum Classic. The device app to open is now derived from the network family rather than from the network's own `managerAppName`, so EVM networks with an EIP-155 chain ID register through the Ethereum app and are told apart by that chain ID, which is what the Contacts device kit expects. These networks are selectable again, reversing the restriction added in LIVE-36688.

  Address-book eligibility now lives in a single place: `isEligibleAddressCurrency` moves from `@ledgerhq/live-common` to `@features/platform-contacts`, where it checks device capability alongside the network family. The send flow and the Contacts network picker previously answered this question separately, which is how an entry point could be offered for a network the device would refuse.

- [#21656](https://github.com/LedgerHQ/ledger-live/pull/21656) [`85e01c4`](https://github.com/LedgerHQ/ledger-live/commit/85e01c449dab75d75851631a56d292f2cb0c5b36) Thanks [@sarneijim](https://github.com/sarneijim)! - Add the Q3 Wallet V4 Tour feature flag, persisted seen state, mobile debug setup, and Segment wallet40Attributes.q3Tour

- [#21924](https://github.com/LedgerHQ/ledger-live/pull/21924) [`cdb273b`](https://github.com/LedgerHQ/ledger-live/commit/cdb273b068df78cd5a0dbd4281fb79f22e0a7506) Thanks [@qperrot](https://github.com/qperrot)! - Fix account view crash when cosmos `cosmosResources` is undefined by handling missing resources gracefully in the delegation hook and account UI components

- [#21738](https://github.com/LedgerHQ/ledger-live/pull/21738) [`9e37f58`](https://github.com/LedgerHQ/ledger-live/commit/9e37f58a84f7ee9585142c0a8ac767da58b6d06f) Thanks [@ysitbon](https://github.com/ysitbon)! - Move the account-coupled tracking-pair code out of the countervalues packages and into `live-common`, next to the portfolio code it belongs with. `inferTrackingPairForAccounts` and `inferTrackingPairForAccountsUnresolved` leave `live-countervalues/logic`, and the `useTrackingPairForAccounts` hook that wraps them leaves `live-countervalues-react`.

  These three were the last things in the countervalues core that needed an `Account`, so `@ledgerhq/types-live` is now gone from the package entirely and from its dependency list. The core no longer knows what an account is; it only knows currency pairs and rates.

  The move was blocked until both packages became private: a published package cannot depend on a private one, and the hook re-exported a function that had to land in private `live-common`.

- [#21956](https://github.com/LedgerHQ/ledger-live/pull/21956) [`7bfbb69`](https://github.com/LedgerHQ/ledger-live/commit/7bfbb69b29d66d1b908cddd4b7cad893f77a8ebc) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Fix a race in the swap exchange flow where a stale/late cancel callback (e.g. a `DrawerClosedError`) could fire after the swap had already succeeded, causing the backend to receive both a swap accepted and a swap cancelled report for the same swap.

- [#21633](https://github.com/LedgerHQ/ledger-live/pull/21633) [`60655cd`](https://github.com/LedgerHQ/ledger-live/commit/60655cdf828eebdddd515d52c8fc5876ea50baf8) Thanks [@qperrot](https://github.com/qperrot)! - Add memo on xrp operation details

- [#21830](https://github.com/LedgerHQ/ledger-live/pull/21830) [`8146728`](https://github.com/LedgerHQ/ledger-live/commit/814672815a08dd57160d3aa4c28e92c3f508807e) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(llc): Wire A4 as the primary operations source in getAccountShape with transparent fallback to the coin-module delegate on error

- [#21732](https://github.com/LedgerHQ/ledger-live/pull/21732) [`b30a8cd`](https://github.com/LedgerHQ/ledger-live/commit/b30a8cd8acfeabb444cd7e2acb1ac5eaa959b221) Thanks [@henri-ly](https://github.com/henri-ly)! - Guard against a bridge extension returning an undefined spendable balance, which crashed the wallet-api serializer when selecting an Aleo token with no synced sub-account

- [#21887](https://github.com/LedgerHQ/ledger-live/pull/21887) [`a62261e`](https://github.com/LedgerHQ/ledger-live/commit/a62261e2e63218affcd3690a70b5a42f355a48a4) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Tell the user a currency is unavailable in their region instead of showing a generic balance error, and bump coin-module-framework to 9.1.0 for the typed checkRegionRestriction flag

- [#21751](https://github.com/LedgerHQ/ledger-live/pull/21751) [`dc204a7`](https://github.com/LedgerHQ/ledger-live/commit/dc204a7633e6f7c9acb66fbb18a6aeaa2e75c4bb) Thanks [@sarneijim](https://github.com/sarneijim)! - Add releaseTour and gate Q2/Q3 tours with it, dropping q2Tour/q3Tour from Wallet 4.0

- [#21884](https://github.com/LedgerHQ/ledger-live/pull/21884) [`d1a8cb2`](https://github.com/LedgerHQ/ledger-live/commit/d1a8cb2403bbe6771dfee3e43fbc4c4df61d4c7c) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-celo): move `stakingSupported` to `BridgeApi`

- [#21596](https://github.com/LedgerHQ/ledger-live/pull/21596) [`5ddb9ab`](https://github.com/LedgerHQ/ledger-live/commit/5ddb9ab2874a6715d706042701e8b2242b1c14b9) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Carry a chain's staking positions through the generic coin framework, and keep sub-accounts
  aligned with what the chain reports:

  - an unbonding position with no validator is no longer dropped from the account's list
  - `extractBalances` rebuilds staking positions, so a family validating a staking intent finds them
  - a position reads as withdrawable only when the chain offers a withdraw on it
  - `mergeSubAccounts` keeps only the sub-accounts the chain still reports, instead of letting a pruned one survive with a stale balance
  - a pending operation shows the user's memo only on a plain transfer

- [#21844](https://github.com/LedgerHQ/ledger-live/pull/21844) [`c72a646`](https://github.com/LedgerHQ/ledger-live/commit/c72a646d28a4a5d144808f4a99e80d7788895603) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(llc): update Arc mainnet native contract address

- [#20774](https://github.com/LedgerHQ/ledger-live/pull/20774) [`c6a569d`](https://github.com/LedgerHQ/ledger-live/commit/c6a569d5848e6c0fd7973cb5ab7241b39d47f77b) Thanks [@amaslakov](https://github.com/amaslakov)! - Add the ICP neuron management and voting-power confirmation flows on Desktop, with the periodic-confirmation decode and neuron helpers they run on.

  An accepted command is reflected as soon as the network accepts it, without waiting for a device-signed refresh, and the account re-syncs after a stake. A command the device has already signed is offered for retry only when the network says nothing ran. Actions a neuron cannot take are not offered — Increase stake without a recoverable stake nonce, Increase dissolve delay with under a day of room, a followee list that changes nothing. Staked maturity counts toward the account's Total Maturity, and a rejected input names the bound it broke rather than an error class name.

- [#21742](https://github.com/LedgerHQ/ledger-live/pull/21742) [`a9f0a51`](https://github.com/LedgerHQ/ledger-live/commit/a9f0a51f20cf3e7b038cc6e5762557e93760a37e) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - A4 pagination, ordering and incremental-sync continuity: drain all pages via `paginateOperations` with explicit `order:"DESC"` and `blocks=[minHeight,"latest"]` mapping.

- [#21735](https://github.com/LedgerHQ/ledger-live/pull/21735) [`a17ef12`](https://github.com/LedgerHQ/ledger-live/commit/a17ef128d44c9ca9bc85c3c8b8d691981c5e638f) Thanks [@amaslakov](https://github.com/amaslakov)! - Pass the coin-tezos context to the baker lookups, which now resolve the config themselves instead of taking a resolved one

- [#21683](https://github.com/LedgerHQ/ledger-live/pull/21683) [`2eb6f5c`](https://github.com/LedgerHQ/ledger-live/commit/2eb6f5c7b3a7694a028bfe62279102188aeac028) Thanks [@semeano](https://github.com/semeano)! - add balance-type pool selection step to Zcash send flow

  The amount step's 25/50/75% selectors now apply to the pool the user picked rather than to the account total, which sums pools the transaction cannot spend from.

  The recipient step's transfer-to-my-other-pool shortcut now records the transfer on the transaction (for Zcash, `selfTransfer`), so the prefilled address keeps its self-transfer semantics instead of looking like a send to a typed address. Picking any other recipient clears it again.

- [#21939](https://github.com/LedgerHQ/ledger-live/pull/21939) [`d1d26de`](https://github.com/LedgerHQ/ledger-live/commit/d1d26def09d28102238b31b684d1745c4f1ad8cc) Thanks [@semeano](https://github.com/semeano)! - Add Zcash shielded send screens (recipient sync notice and family device-signature confirmation) and block the recipient step until shielded sync reports complete

### Patch Changes

- Updated dependencies [[`92c97cf`](https://github.com/LedgerHQ/ledger-live/commit/92c97cf5ee26cbac54f0db25fcdc19336c2318a2), [`96a1ca9`](https://github.com/LedgerHQ/ledger-live/commit/96a1ca9fef1b0acc8113708c148890054dea143d), [`f5d0da5`](https://github.com/LedgerHQ/ledger-live/commit/f5d0da5d43ff492175433453b08533cee324c6e2), [`269d6d4`](https://github.com/LedgerHQ/ledger-live/commit/269d6d404779439d0e98beb2ed3cef82805612ae), [`4c64bdc`](https://github.com/LedgerHQ/ledger-live/commit/4c64bdc31d29b21c9ea31732ade8f6ba277b9107), [`452041f`](https://github.com/LedgerHQ/ledger-live/commit/452041f8123bc887534048ed94167c81ca54c2b6), [`81456c8`](https://github.com/LedgerHQ/ledger-live/commit/81456c8a3c1e4359f4697cced7c89e9be744f3f6), [`95b4e92`](https://github.com/LedgerHQ/ledger-live/commit/95b4e92bd6ba76987e0f1b540d21312a37c015b0), [`f6dc62f`](https://github.com/LedgerHQ/ledger-live/commit/f6dc62f7f23be9f46812fc13f00ddc373e5ca1af), [`738c0d8`](https://github.com/LedgerHQ/ledger-live/commit/738c0d8a1357e96713bfc0d7a40ca403b5290c35), [`85e01c4`](https://github.com/LedgerHQ/ledger-live/commit/85e01c449dab75d75851631a56d292f2cb0c5b36), [`fecfcf7`](https://github.com/LedgerHQ/ledger-live/commit/fecfcf7570ed70213a9c0e32c2822b4eb057eb03), [`05cb97c`](https://github.com/LedgerHQ/ledger-live/commit/05cb97c6986755d87d4c0b3df3d8b4daf9ba77df), [`251af57`](https://github.com/LedgerHQ/ledger-live/commit/251af57e7412e493deaecddf627e3967ba044c09), [`b30f903`](https://github.com/LedgerHQ/ledger-live/commit/b30f903f592c0bafba74a1784d98b9d605c18ccb), [`da3d09d`](https://github.com/LedgerHQ/ledger-live/commit/da3d09d75d7dcae659611cd371c48d75c03f7ae4), [`cdb273b`](https://github.com/LedgerHQ/ledger-live/commit/cdb273b068df78cd5a0dbd4281fb79f22e0a7506), [`54fce77`](https://github.com/LedgerHQ/ledger-live/commit/54fce77bfa46c3d42d3e39b80804258a91d910f2), [`ee1b919`](https://github.com/LedgerHQ/ledger-live/commit/ee1b9192421545035fb547f27319d7f816d85fe8), [`9e37f58`](https://github.com/LedgerHQ/ledger-live/commit/9e37f58a84f7ee9585142c0a8ac767da58b6d06f), [`7e44af4`](https://github.com/LedgerHQ/ledger-live/commit/7e44af495eccab1fac4b0808d6729a595b610c69), [`600d432`](https://github.com/LedgerHQ/ledger-live/commit/600d432657f1c9adf80af6730dd28f2177e05c5a), [`7050652`](https://github.com/LedgerHQ/ledger-live/commit/70506520dafbccca4e014ac30d75647a5b7fe7d0), [`bb2f03e`](https://github.com/LedgerHQ/ledger-live/commit/bb2f03e41b96b8f95f239acea75428657cdd64fe), [`2706dda`](https://github.com/LedgerHQ/ledger-live/commit/2706ddad88ea10d117093bba8775b6aef655fbda), [`c6df5b6`](https://github.com/LedgerHQ/ledger-live/commit/c6df5b65aa66f44d8dff124e4e1d089d53e1d1a6), [`a62261e`](https://github.com/LedgerHQ/ledger-live/commit/a62261e2e63218affcd3690a70b5a42f355a48a4), [`dc204a7`](https://github.com/LedgerHQ/ledger-live/commit/dc204a7633e6f7c9acb66fbb18a6aeaa2e75c4bb), [`d1a8cb2`](https://github.com/LedgerHQ/ledger-live/commit/d1a8cb2403bbe6771dfee3e43fbc4c4df61d4c7c), [`903c180`](https://github.com/LedgerHQ/ledger-live/commit/903c1802ea5d4cc3fe1bfe5609b8cf3871152cf0), [`30828c2`](https://github.com/LedgerHQ/ledger-live/commit/30828c22cc44c9929d7eda782e9d559a9e0145c3), [`0c413f3`](https://github.com/LedgerHQ/ledger-live/commit/0c413f3dcf65071bf963933f446fc24c9711a996), [`a6a7a94`](https://github.com/LedgerHQ/ledger-live/commit/a6a7a946b1c1dbdda1cfa2c049f536f7235ddde2), [`5ddb9ab`](https://github.com/LedgerHQ/ledger-live/commit/5ddb9ab2874a6715d706042701e8b2242b1c14b9), [`c6a569d`](https://github.com/LedgerHQ/ledger-live/commit/c6a569d5848e6c0fd7973cb5ab7241b39d47f77b), [`46340c1`](https://github.com/LedgerHQ/ledger-live/commit/46340c151a0d7854c65e78af3a7e6d839c349e3a), [`4c314f4`](https://github.com/LedgerHQ/ledger-live/commit/4c314f4035581de1affaba8419cd062359251c2f)]:
  - @ledgerhq/coin-vechain@4.2.0-next.0
  - @shared/feature-flags@0.23.0-next.0
  - @ledgerhq/coin-zcash@0.8.0-next.0
  - @ledgerhq/coin-aleo@2.4.0-next.0
  - @ledgerhq/coin-concordium@1.3.0-next.0
  - @features/platform-feature-flags@0.7.0-next.0
  - @ledgerhq/live-signer-concordium@0.8.0-next.0
  - @ledgerhq/speculos-transport@0.11.0-next.0
  - @ledgerhq/hw-app-btc@11.5.0-next.0
  - @shared/env@0.7.0-next.0
  - @ledgerhq/coin-cosmos@1.3.0-next.0
  - @ledgerhq/live-countervalues@0.26.0-next.0
  - @ledgerhq/live-countervalues-react@0.18.0-next.0
  - @ledgerhq/live-signer-cosmos@0.5.0-next.0
  - @ledgerhq/coin-hedera@2.4.0-next.0
  - @ledgerhq/coin-tron@8.1.0-next.0
  - @ledgerhq/coin-celo@3.2.0-next.0
  - @ledgerhq/wallet-btc@0.5.0-next.0
  - @ledgerhq/coin-internet_computer@1.30.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.4.0-next.0
  - @ledgerhq/live-signer-aleo@0.19.11-next.0
  - @ledgerhq/asset-aggregation@0.15.1-next.0
  - @ledgerhq/coin-algorand@2.1.2-next.0
  - @ledgerhq/coin-aptos@4.1.2-next.0
  - @ledgerhq/coin-bitcoin@0.52.1-next.0
  - @ledgerhq/coin-canton@1.1.2-next.0
  - @ledgerhq/coin-cardano@1.1.2-next.0
  - @ledgerhq/coin-casper@3.3.1-next.0
  - @ledgerhq/coin-filecoin@2.1.2-next.0
  - @ledgerhq/coin-icon@0.29.5-next.0
  - @ledgerhq/coin-kaspa@2.2.2-next.0
  - @ledgerhq/coin-mina@1.23.1-next.0
  - @ledgerhq/coin-multiversx@1.1.2-next.0
  - @ledgerhq/coin-near@1.1.2-next.0
  - @ledgerhq/coin-polkadot@7.2.2-next.0
  - @ledgerhq/coin-solana@2.1.1-next.0
  - @ledgerhq/coin-stacks@0.30.2-next.0
  - @ledgerhq/coin-sui@1.2.2-next.0
  - @ledgerhq/coin-ton@0.37.4-next.0
  - @ledgerhq/device-core@0.11.16-next.0
  - @ledgerhq/domain-service@1.8.19-next.0
  - @ledgerhq/evm-tools@1.14.3
  - @ledgerhq/hw-app-eth@7.8.19-next.0
  - @ledgerhq/live-signer-canton@0.9.20-next.0
  - @ledgerhq/live-signer-celo@1.2.7-next.0
  - @ledgerhq/live-signer-evm@0.23.2-next.0
  - @ledgerhq/live-signer-icp@0.1.6-next.0
  - @ledgerhq/live-signer-solana@0.21.3-next.0
  - @ledgerhq/live-signer-zcash@0.10.0
  - @ledgerhq/transaction-observability@0.3.1-next.0
  - @ledgerhq/hw-app-exchange@0.27.0
  - @domain/api-aggregated-assets@0.5.1-next.0
  - @features/platform-aggregated-assets@0.5.3-next.0
  - @features/platform-env@0.3.1-next.0
  - @ledgerhq/ledger-cal-service@1.19.6-next.0
  - @ledgerhq/ledger-trust-service@0.8.17-next.0

## 37.6.0

### Minor Changes

- [#21250](https://github.com/LedgerHQ/ledger-live/pull/21250) [`7c6a8de`](https://github.com/LedgerHQ/ledger-live/commit/7c6a8de98093e274de57e9ee94c6179541e2120c) Thanks [@beths-ledger](https://github.com/beths-ledger)! - Report `earn_transaction_*` for ETH dApp and live-app staking.

  A contract call carries no staking `mode`, so the action came back undefined and every Lido, Kiln, Stader, Kelp, Coinbase, Chorus One, Figment and P2P transaction was dropped. Two signals now classify it, each read at the stage that has it: the action from the call data at sign, the originating app from the manifest.

  Neither works alone. A selector is the keccak hash of a function signature, not a statement of intent — `0xd0e30db0` is `deposit()` on WETH, wrapping ETH, as readily as it is a vault entry — so call data is only ever read inside a known staking app. The manifest, in turn, says the user was in Lido but not whether they staked or withdrew.

  The two vocabularies are kept in separate maps because they disagree: a generic-framework `mode` of `stake` picks a validator and means `delegate`, while a function named `stake` enters a pool and means `deposit`. A family mode always wins, so EVM chains that stake natively — sei_evm, monad, somnia, zero_gravity — keep their own wording and never fall through to call data.

  An allow-listed app calling a function the map does not cover is reported with `transaction_type: "unknown"` and the selector in `raw_transaction_type`, rather than dropped. A silent drop is the failure this project exists to remove: this way the gap is countable and the next mapping is obvious.

  Adds `staking_method` (`liquid`, `pooling`, `restaking`, `dedicated`) and restores `redeem` for share-exact ERC-4626 exits. `approve` stays out: ETH staking needs no approval before delegating, so counting one would inflate the funnel's denominator. `kiln-staking` reports no method, because one manifest serves both a pooled and a dedicated product and only a `queryParams.focus` the bridge never sees tells them apart.

  The allow list is held in code, because a gate must not depend on a network call. `stakingApps.integration.test.ts` reads the real Earn API and fails when a provider appears that the list has never heard of, or when a method stops matching its category.

  Reports `contract_address` and `output_currency` too. One lookup on the called contract answers both which token comes out and, for `kiln-staking`, which of its two products this was — a distinction its manifest cannot make, since both share one manifest id.

  The contracts were confirmed by signing and rejecting on device against each provider, which found two things assumption would have missed.

  **The deposit target is usually not the receipt token.** Only Lido mints on its own token. Kelp, Chorus One and Stader all deposit into a pool contract that mints the token at a different address, so a token address is no evidence of a deposit target. That inference was tried and was wrong three times out of five — Kelp most clearly, where the real target turned out to be `0x036676389e…` rather than rsETH.

  **Chorus One calls `deposit_all`**, which the selector list carries separately from `depositAll`. The map lacked that spelling, and it surfaced in the first test because an unmapped call inside a staking app is reported rather than dropped.

  Observed: Lido, Kiln pooled, Coinbase, Chorus One, Kelp. Published but unobserved: Stader, whose wallet connection does not complete.

  A contract is public infrastructure and identical for every user, and it is only ever read for a call inside a known staking app, never for a plain send whose recipient is the user's own payee.

  An unrecognised contract reports neither field rather than defaulting. Guessing `dedicated` for whatever is unmapped would turn one unknown pool into silently wrong data; an absent field is visible, and `contract_address` says exactly what to add.

  Classification also works at the broadcast stage without the sign stage's help. The generic coin framework copies the transaction onto the optimistic operation, so `recipients[0]` is the contract and `transactionRaw` carries the mode plus the call data — confirmed on a completed Lido deposit, where the data arrives as an unprefixed hex string. Correlation stays as enrichment rather than a dependency, which matters on the split wallet-api route, where a signed operation is serialised and object identity is lost.

  Note for anyone querying this: `tx_pathway` is not one value across these providers. Lido is a live app, so it reads `wallet-api/transaction.signAndBroadcast`; the other seven are dApps and read `dApp/eth_sendTransaction`. Both routes go through the same account bridge, so the classification is identical either way — but a query that filters on one pathway will silently miss the rest.

- [#21355](https://github.com/LedgerHQ/ledger-live/pull/21355) [`fc74af8`](https://github.com/LedgerHQ/ledger-live/commit/fc74af8db6038afd89c64de356e67fe9ba4811a0) Thanks [@semeano](https://github.com/semeano)! - Offer the Zcash memo only to shielded recipients. A memo travels in a shielded output, so a transparent recipient could never receive one, yet the send flow showed the input for every Zcash address and made the user fill or skip it. Send descriptors can now distinguish static memo support from recipient-specific visibility, and a memo left over from an earlier shielded recipient is dropped when the recipient turns transparent, so it can no longer reach the transaction builder.

- [#21318](https://github.com/LedgerHQ/ledger-live/pull/21318) [`e1e7cb2`](https://github.com/LedgerHQ/ledger-live/commit/e1e7cb2fa32ef3b413f8e598687f05780ad1c0e8) Thanks [@henri-ly](https://github.com/henri-ly)! - Fix Solana account synchronization failing when the RPC provider deprioritizes stake
  account discovery. Stake accounts are now enumerated with the paginated
  getProgramAccountsV2, falling back to getProgramAccounts on endpoints that do not
  implement it (devnet, testnet and the local test validator run vanilla agave).

- [#21611](https://github.com/LedgerHQ/ledger-live/pull/21611) [`dd134e9`](https://github.com/LedgerHQ/ledger-live/commit/dd134e9c126773d47cd8dfb6aaf677534f2e7b23) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-tron): outsource wallet types

- [#21601](https://github.com/LedgerHQ/ledger-live/pull/21601) [`96661b4`](https://github.com/LedgerHQ/ledger-live/commit/96661b459f66f511de75c62b87b3bcd2519a1814) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - part 1 for Aleo bond flow

- [#21504](https://github.com/LedgerHQ/ledger-live/pull/21504) [`92b90a6`](https://github.com/LedgerHQ/ledger-live/commit/92b90a6eebca959abe0b04aa83c5799d34f9f10a) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Build PLT token sub-accounts during Concordium account sync, behind the new `enableTokens` coin config flag (off by default). Tokens are resolved from the CAL by on-chain address, per-token pause and allow/deny state is cached on the account, and PLT balances are reported on the `api/` surface.

- [#21572](https://github.com/LedgerHQ/ledger-live/pull/21572) [`147a290`](https://github.com/LedgerHQ/ledger-live/commit/147a2905d735eee5682d849b3e2c2cde5178f7bb) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(cosmos): carry operation extras through the familyExtra slot

- [#21486](https://github.com/LedgerHQ/ledger-live/pull/21486) [`2d42e64`](https://github.com/LedgerHQ/ledger-live/commit/2d42e647d55f79cf2eb821ec30a232cc07891219) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop `deviceTicker` from `CryptoCurrency`. The field was declared in three places and set by 17 testnet/L2 registry entries, but nothing ever read it.

- [#21507](https://github.com/LedgerHQ/ledger-live/pull/21507) [`eb62268`](https://github.com/LedgerHQ/ledger-live/commit/eb622688cb7561882cd02b52c2eed569d5dc68f3) Thanks [@ysitbon](https://github.com/ysitbon)! - Move portfolio and account-coupled logic to live-common

  `portfolio.ts`, the React `portfolioReact.tsx`, the internal `ranges.ts` and `assetsDistribution.ts`
  helpers, and the `inferTrackingPairForAccounts*` tests migrate from the countervalues packages into
  `libs/ledger-live-common/src/portfolio/`. This removes the account-entity blocker from the
  countervalues epic: `live-countervalues` is now rate logic only.

  `live-countervalues`: `portfolio` entry point removed; `src/internal/` directory removed.
  `live-countervalues-react`: `portfolio` entry point removed; package now contains only `index.tsx`.
  `live-common`: `portfolio/portfolio` and `portfolio/portfolioReact` entry points added.

- [#21443](https://github.com/LedgerHQ/ledger-live/pull/21443) [`70b93a0`](https://github.com/LedgerHQ/ledger-live/commit/70b93a037c9217a1f64e66c13085d43c1d4fde2e) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(common): add missing property on Solana test

- [#21580](https://github.com/LedgerHQ/ledger-live/pull/21580) [`a9e389f`](https://github.com/LedgerHQ/ledger-live/commit/a9e389fc59ca30abf53d0ba8decc6290752ba1db) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Stop calling the decommissioned Fantom explorer. Fantom Opera migrated to Sonic and its explorer infrastructure is gone: ftmscout.com returns HTTP 522 and ftmscan.com no longer resolves, which made adding a Fantom account fail with "Invalid Response from Fantom explorer".

  Fantom now uses `explorer: { type: "none" }`, so accounts sync balances through the still-live RPC node instead of erroring, with an empty operation history. The user-facing explorer links point to the OKX explorer.

- [#21223](https://github.com/LedgerHQ/ledger-live/pull/21223) [`e92cf97`](https://github.com/LedgerHQ/ledger-live/commit/e92cf9742f7d910dea79ca848494b3870b2ae254) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Route Casper through the generic coin-framework bridge (LIVE-35912/35914/35915).

  - `coin-casper`: `createApi()` now returns a `CoinModuleImpl` (dropping the throwing stubs for unsupported capabilities; `withDefaults` fills them). `craftTransactionData` delegates to the framework helper. `getTransferIdFromMemo` bridges the legacy `StringMemo<"transferId">` shape and the new `{type:"transferId"}` framework shape until LIVE-35735 unifies them.
  - `live-common`: Casper added to `genericCoinFrameworkFamilies.json`; LiveConfig key `config_casper_generic_bridge` (default `true`) provides a runtime kill-switch to fall back to the legacy bridge without a deploy.
  - Desktop/Mobile: `useTransferIdChange` hook extracted and shared between `MemoField` / `TransferIdField` / `MemoTagInput` / `ScreenEditTransferId`; now writes both `transferId` (legacy bridge) and `memoType`/`memoValue` (generic path) so both bridges read the same user input correctly.

- [#21513](https://github.com/LedgerHQ/ledger-live/pull/21513) [`9dd7db0`](https://github.com/LedgerHQ/ledger-live/commit/9dd7db0d81362a5d019cd0830bdd336a1f42e7af) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add a Pay success screen to the Send flow. When the flow is launched from the Pay tab and the transaction succeeds, it now routes to a dedicated `PAY_SUCCESS` step that shows the recipient, amount, source account (with network icon) and a link to the transaction details, instead of the standard confirmation step. Exposes a presentational `PaySuccess` component from `@features/flow-pay-contact` and wires it in ledger-live-desktop via an MVVM `PaySuccessScreen` + `usePaySuccessViewModel`.

- [#21396](https://github.com/LedgerHQ/ledger-live/pull/21396) [`ebb1371`](https://github.com/LedgerHQ/ledger-live/commit/ebb13714a6de9c39f290b2ccd51ca78370824f6f) Thanks [@vladyslavchupovskiy-ext-art](https://github.com/vladyslavchupovskiy-ext-art)! - Add the Gonka (GNK) currency feature flag, disabled by default

- [#21316](https://github.com/LedgerHQ/ledger-live/pull/21316) [`3e14841`](https://github.com/LedgerHQ/ledger-live/commit/3e14841c47bf578e6a8c9aabda22a8b59facb83f) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Add Casper default transaction case for the generic coin-framework adapter

- [#21800](https://github.com/LedgerHQ/ledger-live/pull/21800) [`800e718`](https://github.com/LedgerHQ/ledger-live/commit/800e71806a6b743161ae1eb4f163d6a9ca654f85) Thanks [@henri-ly](https://github.com/henri-ly)! - Guard against a bridge extension returning an undefined spendable balance, which crashed the wallet-api serializer when selecting an Aleo token with no synced sub-account

- [#21302](https://github.com/LedgerHQ/ledger-live/pull/21302) [`1e883b3`](https://github.com/LedgerHQ/ledger-live/commit/1e883b36260cb3d78c34251de87a2da1ec353d9f) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: read Hedera staking validators through an on-demand query on desktop, with loading and fetch-error states

- [#21305](https://github.com/LedgerHQ/ledger-live/pull/21305) [`7aca4c8`](https://github.com/LedgerHQ/ledger-live/commit/7aca4c8a806ab270cd990d63b1c651e443b7e149) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - refactor: drop the Hedera preload layer now that no consumer reads it, and fold useHederaEnrichedDelegationV2 back into useHederaEnrichedDelegation

- [#21358](https://github.com/LedgerHQ/ledger-live/pull/21358) [`6561cf0`](https://github.com/LedgerHQ/ledger-live/commit/6561cf003713ab65533bb9476771c0de9b19e634) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - refactor: serve the Hedera validators list from an RTK Query api instead of React Query

- [#21015](https://github.com/LedgerHQ/ledger-live/pull/21015) [`2c70999`](https://github.com/LedgerHQ/ledger-live/commit/2c709990d3569bc50504822ce90c9e9024210312) Thanks [@YazhuEth](https://github.com/YazhuEth)! - fix(coin-framework): follow the listOperations cursor so account history is no longer truncated to one page

  getAccountShape called listOperations once and discarded the returned `next`, so any account with
  more operations than one explorer page never received the rest, and no later sync recovered the
  tail: the walk is newest-first and `minHeight` only ever moves forward, so the pages below the
  first were lost for good.

  It now walks the cursor chain within a sync, treating a falsy cursor as end of stream. The walk is
  unbounded — only a module that cannot progress ends it early: an empty page, or a cursor already
  followed (a repeat, or a longer cycle). The `extra.pagingToken` resume read is removed:
  nothing could ever write it, and `minHeight` is the resume position across syncs.

  On the coin-evm side, the Ledger explorer's `fetchPaginatedOpsWithRetries` appends each batch in
  place instead of rebuilding the whole accumulator (`[...previous, ...batch]`) once per page.

- [#21461](https://github.com/LedgerHQ/ledger-live/pull/21461) [`918e931`](https://github.com/LedgerHQ/ledger-live/commit/918e9318379ec8ed73dfaca58a7dd8ff06dd897b) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Fix prerelease coin-app builds being rejected as unsupported when they satisfy the required version

- [#21474](https://github.com/LedgerHQ/ledger-live/pull/21474) [`54351c2`](https://github.com/LedgerHQ/ledger-live/commit/54351c2f7501362c9323fd835e21b2db37d6b4cd) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Group unavailable assets and networks under a "Not available yet" section in the asset and network selection lists

- [#21283](https://github.com/LedgerHQ/ledger-live/pull/21283) [`761cf3e`](https://github.com/LedgerHQ/ledger-live/commit/761cf3e359fa197d07f6086d8522fd1785ba575d) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - add earn banner to success transation modal

- [#21480](https://github.com/LedgerHQ/ledger-live/pull/21480) [`ebeb266`](https://github.com/LedgerHQ/ledger-live/commit/ebeb266bb8091b86a4393497677088b1aa51dee5) Thanks [@henri-ly](https://github.com/henri-ly)! - Move the Tron `getAddress` signer out of coin-tron into `families/tron/`, so coin-tron no
  longer depends on the ledger-wallet-framework signer, derivation and bridge entry points.
  The `@ledgerhq/coin-tron/signer` sub-path export is removed.

- [#21028](https://github.com/LedgerHQ/ledger-live/pull/21028) [`9b15a72`](https://github.com/LedgerHQ/ledger-live/commit/9b15a7228b9eafb6f627b887c9b950899d79501d) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Add the Perps deposit review step on desktop, reached from the deposit form, showing the swap and deposit details before the user confirms. The amount landing on the perps account now comes from a provider quote, since that balance has no counter value of its own.

- [#21028](https://github.com/LedgerHQ/ledger-live/pull/21028) [`bcf6eef`](https://github.com/LedgerHQ/ledger-live/commit/bcf6eef986320df10bed2a1bb3054e701264421f) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Add the Perps deposit signing step on desktop, reached from the review screen. It runs on the same swap orchestration as the `custom.exchange.swap` handler — now extracted into a shared `executeSwap` — behind the perps screens, and executes against the quote the review priced against. Declining a device prompt returns to the review with the entered amount intact, rather than raising an error screen.

- [#21315](https://github.com/LedgerHQ/ledger-live/pull/21315) [`80b27a1`](https://github.com/LedgerHQ/ledger-live/commit/80b27a1349db33bbd7ba3b96aef5260853916bd2) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Wire Casper coin-module loader API and implement craftTransactionData

- [#21854](https://github.com/LedgerHQ/ledger-live/pull/21854) [`6ad68ad`](https://github.com/LedgerHQ/ledger-live/commit/6ad68ad4358d6a1126f300c3855cab33a918c017) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(llc): update Arc mainnet native contract address

- [#21028](https://github.com/LedgerHQ/ledger-live/pull/21028) [`93251f5`](https://github.com/LedgerHQ/ledger-live/commit/93251f5594214aa21a1ab17ae4baba52b227ee8f) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Add the perps deposit amount form, so a deposit requested by the live app collects its funding account and amount before the review step

- [#21240](https://github.com/LedgerHQ/ledger-live/pull/21240) [`1cb4dbe`](https://github.com/LedgerHQ/ledger-live/commit/1cb4dbe4a9b0d556768c3ce18d17eb08935e518f) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Persist Solana `stakingResources` through the generic coin framework, and revive accounts still holding the legacy `solanaResources` blob

- [#21624](https://github.com/LedgerHQ/ledger-live/pull/21624) [`dcdec92`](https://github.com/LedgerHQ/ledger-live/commit/dcdec92fec41cf5bef0d3f54566e4649b851607f) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(llc): wrap `getBalance` exceptions inside `UnexpectedGetBalanceError`

- [#21510](https://github.com/LedgerHQ/ledger-live/pull/21510) [`db09cfc`](https://github.com/LedgerHQ/ledger-live/commit/db09cfc0a41f71af1dd2f452d7d5ad7865f4ffe7) Thanks [@ysitbon](https://github.com/ysitbon)! - Repoint `fetchMarketcapIds` in `sortByMarketcap.ts` from the
  `live-countervalues` package API to a direct call to the Counter Value
  Service (`/v3/supported/crypto`).

  The function signature, fallback behaviour (`() => currencies` on
  network error), and all callers are unchanged.

  The `MOCK_COUNTERVALUES` dispatch is preserved: when the env is set,
  `fetchMarketcapIds` returns ids from `TICKER_TO_ID_AND_VALUE` (the same
  fixture source the old `api.mock.ts` used) without making a network
  call. This keeps mocked desktop and mobile e2e runs on fixtures rather
  than hitting the live network.

  `fetchIdsSortedByMarketcap` in `live-countervalues` now has zero
  callers outside its own package.

- [#20802](https://github.com/LedgerHQ/ledger-live/pull/20802) [`1cf5583`](https://github.com/LedgerHQ/ledger-live/commit/1cf55832f785fc57881169092f1190fa7ddfecf9) Thanks [@qperrot](https://github.com/qperrot)! - Drive EVM NFT activation from the `supportedTokens` config field instead of `isNFTActive` and the `showNfts` boolean. `EvmConfig.showNfts` is replaced by `supportedTokens: ("erc721" | "erc1155")[]`, so each NFT standard is enabled independently, and coin-evm no longer depends on `@ledgerhq/ledger-wallet-framework/nft`. Activation is checked via explicit standard membership (`supportedTokens.includes("erc721" | "erc1155")`).

- [#21269](https://github.com/LedgerHQ/ledger-live/pull/21269) [`b683a6d`](https://github.com/LedgerHQ/ledger-live/commit/b683a6dc7709dd9b669288e7178414334790ba9e) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Keep a secure channel session token out of `createDeviceSocket` traces and error metadata.

- [#21269](https://github.com/LedgerHQ/ledger-live/pull/21269) [`3da476c`](https://github.com/LedgerHQ/ledger-live/commit/3da476c2d4c435c62aa3fe11a0290f56d7283cbe) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Keep a secure channel session token out of the network troubleshooting description.

- [#21746](https://github.com/LedgerHQ/ledger-live/pull/21746) [`12199a1`](https://github.com/LedgerHQ/ledger-live/commit/12199a1c615ccd21c1f3574b0f1868dbf0800ba2) Thanks [@amaslakov](https://github.com/amaslakov)! - Pass the coin-tezos context to the baker lookups, which now resolve the config themselves instead of taking a resolved one

- [#21355](https://github.com/LedgerHQ/ledger-live/pull/21355) [`1c58fb1`](https://github.com/LedgerHQ/ledger-live/commit/1c58fb15f0b3421d6cf82b53db66f39a21fb7bc0) Thanks [@semeano](https://github.com/semeano)! - Add a Zcash send descriptor declaring the ZIP-317 fee model and a shielded memo input

- [#21383](https://github.com/LedgerHQ/ledger-live/pull/21383) [`6f39b04`](https://github.com/LedgerHQ/ledger-live/commit/6f39b0411286ed5c82362c9ffafb953abe8b53b7) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: implement `validateIntent` in coin-hedera's logic layer, replacing the "not supported" throw

- [#21392](https://github.com/LedgerHQ/ledger-live/pull/21392) [`2df85eb`](https://github.com/LedgerHQ/ledger-live/commit/2df85ebe83b802749be7f8698008d118fbede53f) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(send): add skip memo screen in the send flow

- [#21326](https://github.com/LedgerHQ/ledger-live/pull/21326) [`9fb98ab`](https://github.com/LedgerHQ/ledger-live/commit/9fb98ab74e3ca680e686a302b9beaa460a087783) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Drive the XRP app through the Device Management Kit behind the `ldmkXrpSigner` feature flag, keeping `hw-app-xrp` as the fallback

- [#21391](https://github.com/LedgerHQ/ledger-live/pull/21391) [`3a3d2fa`](https://github.com/LedgerHQ/ledger-live/commit/3a3d2fa06b8dbdcc6ad964bb737898a6e35c934d) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: add the enableStaking feature flag and measured default fees for Aleo's bond_public/unbond_public/claim_unbond_public transaction types, gating the upcoming staking feature

### Patch Changes

- Updated dependencies [[`dee33d1`](https://github.com/LedgerHQ/ledger-live/commit/dee33d173c7d10b1145b8dbba95b31d044100559), [`dea88f1`](https://github.com/LedgerHQ/ledger-live/commit/dea88f1874017d5b3d32a376a8bc8eb2e0eb75ba), [`7c6a8de`](https://github.com/LedgerHQ/ledger-live/commit/7c6a8de98093e274de57e9ee94c6179541e2120c), [`fc74af8`](https://github.com/LedgerHQ/ledger-live/commit/fc74af8db6038afd89c64de356e67fe9ba4811a0), [`e1e7cb2`](https://github.com/LedgerHQ/ledger-live/commit/e1e7cb2fa32ef3b413f8e598687f05780ad1c0e8), [`dd134e9`](https://github.com/LedgerHQ/ledger-live/commit/dd134e9c126773d47cd8dfb6aaf677534f2e7b23), [`5c23a76`](https://github.com/LedgerHQ/ledger-live/commit/5c23a7694a8304727c13d7383979d6a0660b1596), [`96661b4`](https://github.com/LedgerHQ/ledger-live/commit/96661b459f66f511de75c62b87b3bcd2519a1814), [`47a1cd0`](https://github.com/LedgerHQ/ledger-live/commit/47a1cd082cc30cd7cc539a8eb0e0fe5466128533), [`60ee73c`](https://github.com/LedgerHQ/ledger-live/commit/60ee73c7b89b101dde708a04ded260341ef86d44), [`86fdaa1`](https://github.com/LedgerHQ/ledger-live/commit/86fdaa1929eeaf42d6d3765ce206758f0422c631), [`51a3d3e`](https://github.com/LedgerHQ/ledger-live/commit/51a3d3ef013a9310ed943a17a33ba69ea8d79a6d), [`3a78322`](https://github.com/LedgerHQ/ledger-live/commit/3a783224b6016fce08fa8cb3254057b75882e2c5), [`2b8a4e4`](https://github.com/LedgerHQ/ledger-live/commit/2b8a4e4240a414cbb1bda31b97b70837cb6ac3fe), [`92b90a6`](https://github.com/LedgerHQ/ledger-live/commit/92b90a6eebca959abe0b04aa83c5799d34f9f10a), [`147a290`](https://github.com/LedgerHQ/ledger-live/commit/147a2905d735eee5682d849b3e2c2cde5178f7bb), [`8993c24`](https://github.com/LedgerHQ/ledger-live/commit/8993c242de8ed57617fb74ac9a3b1af047638914), [`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d), [`2d42e64`](https://github.com/LedgerHQ/ledger-live/commit/2d42e647d55f79cf2eb821ec30a232cc07891219), [`b7d0367`](https://github.com/LedgerHQ/ledger-live/commit/b7d03671db1aa022d3ff375465c7d8470bf2b215), [`e42c12a`](https://github.com/LedgerHQ/ledger-live/commit/e42c12a392ba60ee839c9a71f4f0d409ad9430fa), [`eb62268`](https://github.com/LedgerHQ/ledger-live/commit/eb622688cb7561882cd02b52c2eed569d5dc68f3), [`bed4fe7`](https://github.com/LedgerHQ/ledger-live/commit/bed4fe75210412872bd6c83189ab502b0e1cab24), [`a9e389f`](https://github.com/LedgerHQ/ledger-live/commit/a9e389fc59ca30abf53d0ba8decc6290752ba1db), [`e92cf97`](https://github.com/LedgerHQ/ledger-live/commit/e92cf9742f7d910dea79ca848494b3870b2ae254), [`5b7d11d`](https://github.com/LedgerHQ/ledger-live/commit/5b7d11dd9a988f0034b4b5b6168f02429ba5a406), [`ebb1371`](https://github.com/LedgerHQ/ledger-live/commit/ebb13714a6de9c39f290b2ccd51ca78370824f6f), [`1e883b3`](https://github.com/LedgerHQ/ledger-live/commit/1e883b36260cb3d78c34251de87a2da1ec353d9f), [`7aca4c8`](https://github.com/LedgerHQ/ledger-live/commit/7aca4c8a806ab270cd990d63b1c651e443b7e149), [`34767ef`](https://github.com/LedgerHQ/ledger-live/commit/34767ef352530bb832c95e10c63b8688648d6a5f), [`53dcdc9`](https://github.com/LedgerHQ/ledger-live/commit/53dcdc9bbef2324b48fac7469c2c1d0e66f7361f), [`0dc37f4`](https://github.com/LedgerHQ/ledger-live/commit/0dc37f464793d07436854e14bd358fd0bb7a9225), [`b864c2c`](https://github.com/LedgerHQ/ledger-live/commit/b864c2ced455b2e55d55b8c3e423d2f12d41cd7c), [`5e971b5`](https://github.com/LedgerHQ/ledger-live/commit/5e971b55429cdcab0f69825ce2056fef24d30215), [`b7a8906`](https://github.com/LedgerHQ/ledger-live/commit/b7a89064587bbcd1f758f7b6205a616225ac2317), [`4d295a4`](https://github.com/LedgerHQ/ledger-live/commit/4d295a4f41290cb7cd50a0b221e6956362443f2c), [`761cf3e`](https://github.com/LedgerHQ/ledger-live/commit/761cf3e359fa197d07f6086d8522fd1785ba575d), [`ebeb266`](https://github.com/LedgerHQ/ledger-live/commit/ebeb266bb8091b86a4393497677088b1aa51dee5), [`c3de11c`](https://github.com/LedgerHQ/ledger-live/commit/c3de11cdf58c4feac701435548bbb96819ae09f6), [`80b27a1`](https://github.com/LedgerHQ/ledger-live/commit/80b27a1349db33bbd7ba3b96aef5260853916bd2), [`59ea8fb`](https://github.com/LedgerHQ/ledger-live/commit/59ea8fbd36754199f1c68ab53537460ca31c70b4), [`0c46f58`](https://github.com/LedgerHQ/ledger-live/commit/0c46f58fe1aab809579e5639d9c754ea223e2b51), [`30619aa`](https://github.com/LedgerHQ/ledger-live/commit/30619aaa2af784fd917214bb0e4bbd092f883e11), [`54124e4`](https://github.com/LedgerHQ/ledger-live/commit/54124e435c7adc3a2c3a9ed6cd1865fc68fa2584), [`b9e15ac`](https://github.com/LedgerHQ/ledger-live/commit/b9e15ac78e2b89919c605511f333282610e57225), [`a19ffef`](https://github.com/LedgerHQ/ledger-live/commit/a19ffeff9dd4e173890d75d8634a33e53cc5a5d0), [`0152cad`](https://github.com/LedgerHQ/ledger-live/commit/0152cade87e061bb2b56fd71f8a404c3dfed21e0), [`6f39b04`](https://github.com/LedgerHQ/ledger-live/commit/6f39b0411286ed5c82362c9ffafb953abe8b53b7), [`6dfa950`](https://github.com/LedgerHQ/ledger-live/commit/6dfa9501d8125f88d986105882f3f3fc72b8b371), [`9fb98ab`](https://github.com/LedgerHQ/ledger-live/commit/9fb98ab74e3ca680e686a302b9beaa460a087783), [`3a3d2fa`](https://github.com/LedgerHQ/ledger-live/commit/3a3d2fa06b8dbdcc6ad964bb737898a6e35c934d), [`018ee9b`](https://github.com/LedgerHQ/ledger-live/commit/018ee9bdcb993a1b4a203d5664676f7e757b3785), [`6656f90`](https://github.com/LedgerHQ/ledger-live/commit/6656f90769c3419e1f121c0c2368eab4566e48ba)]:
  - @ledgerhq/coin-tron@8.0.0
  - @ledgerhq/transaction-observability@0.3.0
  - @ledgerhq/coin-zcash@0.7.0
  - @ledgerhq/coin-solana@2.1.0
  - @ledgerhq/coin-aleo@2.3.0
  - @ledgerhq/coin-concordium@1.2.0
  - @shared/env@0.6.0
  - @ledgerhq/live-signer-concordium@0.7.0
  - @ledgerhq/coin-cosmos@1.2.0
  - @shared/feature-flags@0.22.0
  - @domain/entity-currency-crypto@0.12.0
  - @ledgerhq/ledger-wallet-framework@3.3.0
  - @domain/api-aggregated-assets@0.5.0
  - @ledgerhq/live-countervalues@0.25.0
  - @ledgerhq/live-countervalues-react@0.17.0
  - @ledgerhq/coin-casper@3.3.0
  - @ledgerhq/coin-hedera@2.3.0
  - @ledgerhq/hw-app-exchange@0.27.0
  - @ledgerhq/asset-aggregation@0.15.0
  - @ledgerhq/live-currency-format@0.15.0
  - @ledgerhq/live-env@4.0.0
  - @features/platform-env@0.3.0
  - @ledgerhq/coin-mina@1.23.0
  - @ledgerhq/wallet-btc@0.4.0
  - @ledgerhq/coin-bitcoin@0.52.0
  - @ledgerhq/live-signer-xrp@0.2.0
  - @ledgerhq/live-signer-solana@0.21.2
  - @ledgerhq/live-signer-aleo@0.19.10
  - @features/platform-aggregated-assets@0.5.2
  - @ledgerhq/ledger-cal-service@1.19.5
  - @ledgerhq/ledger-trust-service@0.8.16
  - @ledgerhq/speculos-transport@0.10.14
  - @domain/api-currency-token@0.6.1
  - @domain/api-swap-quotes@0.2.4
  - @ledgerhq/live-signer-cosmos@0.4.9
  - @features/platform-feature-flags@0.6.9
  - @domain/entity-currency@0.4.3
  - @domain/entity-currency-token@0.5.2
  - @ledgerhq/coin-cardano@1.1.1
  - @ledgerhq/coin-algorand@2.1.1
  - @ledgerhq/coin-aptos@4.1.1
  - @ledgerhq/coin-canton@1.1.1
  - @ledgerhq/coin-celo@3.1.1
  - @ledgerhq/coin-filecoin@2.1.1
  - @ledgerhq/coin-icon@0.29.4
  - @ledgerhq/coin-internet_computer@1.29.4
  - @ledgerhq/coin-kaspa@2.2.1
  - @ledgerhq/coin-multiversx@1.1.1
  - @ledgerhq/coin-near@1.1.1
  - @ledgerhq/coin-polkadot@7.2.1
  - @ledgerhq/coin-stacks@0.30.1
  - @ledgerhq/coin-sui@1.2.1
  - @ledgerhq/coin-ton@0.37.3
  - @ledgerhq/coin-vechain@4.1.1
  - @ledgerhq/device-core@0.11.15
  - @ledgerhq/domain-service@1.8.18
  - @ledgerhq/evm-tools@1.14.3
  - @ledgerhq/hw-app-eth@7.8.18
  - @ledgerhq/live-signer-canton@0.9.19
  - @ledgerhq/live-signer-celo@1.2.6
  - @ledgerhq/live-signer-evm@0.23.1
  - @ledgerhq/live-signer-icp@0.1.5
  - @ledgerhq/live-signer-zcash@0.10.0

## 37.6.0-next.4

### Patch Changes

- Updated dependencies [[`8993c24`](https://github.com/LedgerHQ/ledger-live/commit/8993c242de8ed57617fb74ac9a3b1af047638914)]:
  - @shared/feature-flags@0.22.0-next.1
  - @features/platform-feature-flags@0.6.9-next.1
  - @ledgerhq/coin-aleo@2.3.0-next.0
  - @ledgerhq/coin-hedera@2.3.0-next.0

## 37.6.0-next.3

### Minor Changes

- [#21854](https://github.com/LedgerHQ/ledger-live/pull/21854) [`6ad68ad`](https://github.com/LedgerHQ/ledger-live/commit/6ad68ad4358d6a1126f300c3855cab33a918c017) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(llc): update Arc mainnet native contract address

## 37.6.0-next.2

### Minor Changes

- [#21800](https://github.com/LedgerHQ/ledger-live/pull/21800) [`800e718`](https://github.com/LedgerHQ/ledger-live/commit/800e71806a6b743161ae1eb4f163d6a9ca654f85) Thanks [@henri-ly](https://github.com/henri-ly)! - Guard against a bridge extension returning an undefined spendable balance, which crashed the wallet-api serializer when selecting an Aleo token with no synced sub-account

## 37.6.0-next.1

### Minor Changes

- [#21746](https://github.com/LedgerHQ/ledger-live/pull/21746) [`12199a1`](https://github.com/LedgerHQ/ledger-live/commit/12199a1c615ccd21c1f3574b0f1868dbf0800ba2) Thanks [@amaslakov](https://github.com/amaslakov)! - Pass the coin-tezos context to the baker lookups, which now resolve the config themselves instead of taking a resolved one

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->

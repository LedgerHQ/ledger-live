# ledger-live-mobile-e2e-tests

## 0.37.0-next.0

### Minor Changes

- [#21331](https://github.com/LedgerHQ/ledger-live/pull/21331) [`7e9416b`](https://github.com/LedgerHQ/ledger-live/commit/7e9416b629ae3cf4cf6da97b5a50e1197a2a101c) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Remove dead code from the e2e test suites: page-object methods and locators with no callers are deleted, members used only inside their own class are made `private`, and symbols exported but only referenced in their own file lose the `export`. Two empty page classes left behind by the sweep (`portfolioEmptyState.page.ts`, `transferMenu.drawer.ts`) are removed along with their `Application` wiring.

  Also fixes `e2e/mobile/scripts/typecheck.js`, which passed the raw `tsconfig.json` to `parseJsonConfigFileContent` and so never resolved the `extends` chain. It reported 466 phantom errors on a clean tree, which hid real ones — including the `app.<page>.<method>()` calls that break at runtime with `TypeError: ... is not a function` when a page-object method is deleted while a caller in `e2e/mobile/models/` remains. It now uses `getParsedCommandLineOfConfigFile` and reports clean.

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

## 0.36.0

### Minor Changes

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

- [#20964](https://github.com/LedgerHQ/ledger-live/pull/20964) [`183706d`](https://github.com/LedgerHQ/ledger-live/commit/183706d1664336ef9798e3bebc06551803fe00bd) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Disable the large-screen upsell modal in E2E defaults so "Spot scams before signing" cannot cover Wallet 4.0 navigation.

- [#20992](https://github.com/LedgerHQ/ledger-live/pull/20992) [`4fc5ef0`](https://github.com/LedgerHQ/ledger-live/commit/4fc5ef09554a541cbf6a497f227df4373bb06470) Thanks [@jeportie](https://github.com/jeportie)! - Record `fetch` traffic in the e2e network log alongside axios, so RTK Query — and therefore
  every CAL token lookup — is no longer invisible in CI artifacts, and attach a per-host
  summary with peak concurrency so a fan-out is legible without reading several hundred
  entries. Query strings, fragments and any `user:pass@` userinfo are stripped before a URL is
  recorded, and no bodies or headers are captured.

- [#20959](https://github.com/LedgerHQ/ledger-live/pull/20959) [`6bbb468`](https://github.com/LedgerHQ/ledger-live/commit/6bbb4682ec313ea2d4b8fba2261a05e84386ba7d) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Add the Borrow cold-start E2E test to the Ledger Wallet Mobile suite (B2CQA-6062): the portfolio
  entry point opens the Borrow live app and shows the "Introducing Crypto Loan" modal. Broadcasts
  nothing and runs on an isolated seed, so it needs no device and is safe to run in parallel.
  Verified on Android and iOS. The portfolio entry point taps the card that was scrolled into view
  rather than the CTA nested inside it — both share the same `onPress`, but only the card is
  guaranteed on screen after the scroll.

## 0.36.0-next.0

### Minor Changes

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

- [#20964](https://github.com/LedgerHQ/ledger-live/pull/20964) [`183706d`](https://github.com/LedgerHQ/ledger-live/commit/183706d1664336ef9798e3bebc06551803fe00bd) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Disable the large-screen upsell modal in E2E defaults so "Spot scams before signing" cannot cover Wallet 4.0 navigation.

- [#20992](https://github.com/LedgerHQ/ledger-live/pull/20992) [`4fc5ef0`](https://github.com/LedgerHQ/ledger-live/commit/4fc5ef09554a541cbf6a497f227df4373bb06470) Thanks [@jeportie](https://github.com/jeportie)! - Record `fetch` traffic in the e2e network log alongside axios, so RTK Query — and therefore
  every CAL token lookup — is no longer invisible in CI artifacts, and attach a per-host
  summary with peak concurrency so a fan-out is legible without reading several hundred
  entries. Query strings, fragments and any `user:pass@` userinfo are stripped before a URL is
  recorded, and no bodies or headers are captured.

- [#20959](https://github.com/LedgerHQ/ledger-live/pull/20959) [`6bbb468`](https://github.com/LedgerHQ/ledger-live/commit/6bbb4682ec313ea2d4b8fba2261a05e84386ba7d) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Add the Borrow cold-start E2E test to the Ledger Wallet Mobile suite (B2CQA-6062): the portfolio
  entry point opens the Borrow live app and shows the "Introducing Crypto Loan" modal. Broadcasts
  nothing and runs on an isolated seed, so it needs no device and is safe to run in parallel.
  Verified on Android and iOS. The portfolio entry point taps the card that was scrolled into view
  rather than the CTA nested inside it — both share the same `onPress`, but only the card is
  guaranteed on screen after the scroll.

## 0.35.0

### Minor Changes

- [#20571](https://github.com/LedgerHQ/ledger-live/pull/20571) [`7c8d5df`](https://github.com/LedgerHQ/ledger-live/commit/7c8d5dfa862a2e9c3a35251b5d06a3cd4f905d2a) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Thread the coin-module `Context` (ADR-019) explicitly through the coin-evm, coin-vechain and coin-near api and logic layers instead of resolving configuration from the module-level `getCoinConfig` singleton. Exported logic functions now take the context as their first argument, resolve `config` from it (`await context.config(currencyId)`), and pass an explicit, required `config` down to the network layer — no `config?` optionals and no singleton reads on the data path. `getCoinConfig`/`setCoinConfig` remain only as the compatibility surface for the classic account bridge. Ledger Live consumers (live-common, desktop, mobile and coin-celo) are updated to resolve and pass config/context explicitly. Also fixes a coin-polkadot type-inference issue where `getTransactionMaterialWithMetadata`'s cache-key extractor narrowed the cached signature and dropped the `config` argument.

- [#20743](https://github.com/LedgerHQ/ledger-live/pull/20743) [`ac097e6`](https://github.com/LedgerHQ/ledger-live/commit/ac097e6a452e747c4fde117da38da22e9da85ed7) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Fix scroll targeting and silent failures in the Ledger Wallet Mobile E2E suite: target leaf rows
  instead of viewport-tall wrappers so assertions reach the default 75% visibility honestly, delete the
  `visibilityPercentage` parameter so no site can lower the gate, name the scroll container at every
  call site that used to let the engine guess one, replace the unexplained pixel steps with the default,
  count rows by existence rather than by what fits the screen, log the scroll errors `scrollOnce`
  used to swallow and correct its `"bottom"` fallback direction, make the `isIdVisible`/`isIdPresent`
  probes index-safe so a shared id stops being reported as invisible, and assert visibility where the
  suite previously only proved an element existed in the tree. On the app side, the accounts list
  scrollable now carries a stable `accounts-list` testID instead of one keyed on the account count.

- [#20716](https://github.com/LedgerHQ/ledger-live/pull/20716) [`7277426`](https://github.com/LedgerHQ/ledger-live/commit/7277426ab6387ba6faff6d06eefa1a25125f3734) Thanks [@jeportie](https://github.com/jeportie)! - Fix mobile swap cross-account warning E2E: pin the send account (Ethereum 1) so it can't collapse onto the receive account when the drawer re-orders USDT accounts by balance

- [#19909](https://github.com/LedgerHQ/ledger-live/pull/19909) [`311e79f`](https://github.com/LedgerHQ/ledger-live/commit/311e79f15f334f2a7b0499dbbfe57fa835e8b0b2) Thanks [@henri-ly](https://github.com/henri-ly)! - add new send flow tokens test, and type the amount in crypto (the step opens in fiat) by tagging
  the amount fiat/crypto toggle with a `amount-mode-toggle` testID

## 0.35.0-next.0

### Minor Changes

- [#20571](https://github.com/LedgerHQ/ledger-live/pull/20571) [`7c8d5df`](https://github.com/LedgerHQ/ledger-live/commit/7c8d5dfa862a2e9c3a35251b5d06a3cd4f905d2a) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Thread the coin-module `Context` (ADR-019) explicitly through the coin-evm, coin-vechain and coin-near api and logic layers instead of resolving configuration from the module-level `getCoinConfig` singleton. Exported logic functions now take the context as their first argument, resolve `config` from it (`await context.config(currencyId)`), and pass an explicit, required `config` down to the network layer — no `config?` optionals and no singleton reads on the data path. `getCoinConfig`/`setCoinConfig` remain only as the compatibility surface for the classic account bridge. Ledger Live consumers (live-common, desktop, mobile and coin-celo) are updated to resolve and pass config/context explicitly. Also fixes a coin-polkadot type-inference issue where `getTransactionMaterialWithMetadata`'s cache-key extractor narrowed the cached signature and dropped the `config` argument.

- [#20743](https://github.com/LedgerHQ/ledger-live/pull/20743) [`ac097e6`](https://github.com/LedgerHQ/ledger-live/commit/ac097e6a452e747c4fde117da38da22e9da85ed7) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Fix scroll targeting and silent failures in the Ledger Wallet Mobile E2E suite: target leaf rows
  instead of viewport-tall wrappers so assertions reach the default 75% visibility honestly, delete the
  `visibilityPercentage` parameter so no site can lower the gate, name the scroll container at every
  call site that used to let the engine guess one, replace the unexplained pixel steps with the default,
  count rows by existence rather than by what fits the screen, log the scroll errors `scrollOnce`
  used to swallow and correct its `"bottom"` fallback direction, make the `isIdVisible`/`isIdPresent`
  probes index-safe so a shared id stops being reported as invisible, and assert visibility where the
  suite previously only proved an element existed in the tree. On the app side, the accounts list
  scrollable now carries a stable `accounts-list` testID instead of one keyed on the account count.

- [#20716](https://github.com/LedgerHQ/ledger-live/pull/20716) [`7277426`](https://github.com/LedgerHQ/ledger-live/commit/7277426ab6387ba6faff6d06eefa1a25125f3734) Thanks [@jeportie](https://github.com/jeportie)! - Fix mobile swap cross-account warning E2E: pin the send account (Ethereum 1) so it can't collapse onto the receive account when the drawer re-orders USDT accounts by balance

- [#19909](https://github.com/LedgerHQ/ledger-live/pull/19909) [`311e79f`](https://github.com/LedgerHQ/ledger-live/commit/311e79f15f334f2a7b0499dbbfe57fa835e8b0b2) Thanks [@henri-ly](https://github.com/henri-ly)! - add new send flow tokens test, and type the amount in crypto (the step opens in fiat) by tagging
  the amount fiat/crypto toggle with a `amount-mode-toggle` testID

## 0.34.0

### Minor Changes

- [#20619](https://github.com/LedgerHQ/ledger-live/pull/20619) [`0175f1f`](https://github.com/LedgerHQ/ledger-live/commit/0175f1ffab7a31fe882b3538d5a87619c331bf54) Thanks [@qperrot](https://github.com/qperrot)! - Chore: add tests for memo on the new send flow

## 0.34.0-next.0

### Minor Changes

- [#20619](https://github.com/LedgerHQ/ledger-live/pull/20619) [`0175f1f`](https://github.com/LedgerHQ/ledger-live/commit/0175f1ffab7a31fe882b3538d5a87619c331bf54) Thanks [@qperrot](https://github.com/qperrot)! - Chore: add tests for memo on the new send flow

## 0.33.0

### Minor Changes

- [#20232](https://github.com/LedgerHQ/ledger-live/pull/20232) [`d467088`](https://github.com/LedgerHQ/ledger-live/commit/d4670885d7eb77c035d09c225eff9dca0151abb3) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwdm): a/b testing show recent banner

- [#20273](https://github.com/LedgerHQ/ledger-live/pull/20273) [`6e1f9f3`](https://github.com/LedgerHQ/ledger-live/commit/6e1f9f3e5301d4e64dcde807e836924f9359dc5a) Thanks [@VicAlbr](https://github.com/VicAlbr)! - test(e2e): harmonize LWD and LWM test names for Allure reports

- [#20214](https://github.com/LedgerHQ/ledger-live/pull/20214) [`be5e007`](https://github.com/LedgerHQ/ledger-live/commit/be5e007ce64443de9a139e304f005d507dc34f0b) Thanks [@kentoforik](https://github.com/kentoforik)! - Revert temporary hardcoded HBAR to XRP swap amount workaround (LIVE-33611); provider-side minimum amount bug is now fixed.

- [#20261](https://github.com/LedgerHQ/ledger-live/pull/20261) [`ba6e9c1`](https://github.com/LedgerHQ/ledger-live/commit/ba6e9c1e542ad28a59b0163e3b453e2f047a48b9) Thanks [@ysitbon](https://github.com/ysitbon)! - Import currency accessors from the domain layer instead of the `@ledgerhq/live-common/currencies` barrel.

  Crypto accessors (`getCryptoCurrencyById`, `findCryptoCurrencyById`, `findCryptoCurrencyByKeyword`, `findCryptoCurrencyByTicker`, `listCryptoCurrencies`, `findCryptoCurrency`, `findCryptoCurrencyByScheme`, `hasCryptoCurrencyId`) now come from `@domain/entity-currency-crypto`, and fiat accessors (`getFiatCurrencyByTicker`, `findFiatCurrencyByTicker`, `listFiatCurrencies`, `hasFiatCurrencyTicker`) from `@domain/entity-currency-fiat`. The re-exports that forwarded them through `@ledgerhq/live-common/currencies` are removed; the barrel keeps its formatting, colour, helper, marketcap, support and URI-scheme exports. Behaviour is unchanged — the barrel already delegated to these same domain functions.

## 0.33.0-next.0

### Minor Changes

- [#20232](https://github.com/LedgerHQ/ledger-live/pull/20232) [`d467088`](https://github.com/LedgerHQ/ledger-live/commit/d4670885d7eb77c035d09c225eff9dca0151abb3) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwdm): a/b testing show recent banner

- [#20273](https://github.com/LedgerHQ/ledger-live/pull/20273) [`6e1f9f3`](https://github.com/LedgerHQ/ledger-live/commit/6e1f9f3e5301d4e64dcde807e836924f9359dc5a) Thanks [@VicAlbr](https://github.com/VicAlbr)! - test(e2e): harmonize LWD and LWM test names for Allure reports

- [#20214](https://github.com/LedgerHQ/ledger-live/pull/20214) [`be5e007`](https://github.com/LedgerHQ/ledger-live/commit/be5e007ce64443de9a139e304f005d507dc34f0b) Thanks [@kentoforik](https://github.com/kentoforik)! - Revert temporary hardcoded HBAR to XRP swap amount workaround (LIVE-33611); provider-side minimum amount bug is now fixed.

- [#20261](https://github.com/LedgerHQ/ledger-live/pull/20261) [`ba6e9c1`](https://github.com/LedgerHQ/ledger-live/commit/ba6e9c1e542ad28a59b0163e3b453e2f047a48b9) Thanks [@ysitbon](https://github.com/ysitbon)! - Import currency accessors from the domain layer instead of the `@ledgerhq/live-common/currencies` barrel.

  Crypto accessors (`getCryptoCurrencyById`, `findCryptoCurrencyById`, `findCryptoCurrencyByKeyword`, `findCryptoCurrencyByTicker`, `listCryptoCurrencies`, `findCryptoCurrency`, `findCryptoCurrencyByScheme`, `hasCryptoCurrencyId`) now come from `@domain/entity-currency-crypto`, and fiat accessors (`getFiatCurrencyByTicker`, `findFiatCurrencyByTicker`, `listFiatCurrencies`, `hasFiatCurrencyTicker`) from `@domain/entity-currency-fiat`. The re-exports that forwarded them through `@ledgerhq/live-common/currencies` are removed; the barrel keeps its formatting, colour, helper, marketcap, support and URI-scheme exports. Behaviour is unchanged — the barrel already delegated to these same domain functions.

## 0.32.0

### Minor Changes

- [#19828](https://github.com/LedgerHQ/ledger-live/pull/19828) [`f08cad1`](https://github.com/LedgerHQ/ledger-live/commit/f08cad15e523a210054d9a10f0bbb69bf42a963a) Thanks [@henri-ly](https://github.com/henri-ly)! - new send flow e2e mobile native send

## 0.32.0-next.0

### Minor Changes

- [#19828](https://github.com/LedgerHQ/ledger-live/pull/19828) [`f08cad1`](https://github.com/LedgerHQ/ledger-live/commit/f08cad15e523a210054d9a10f0bbb69bf42a963a) Thanks [@henri-ly](https://github.com/henri-ly)! - new send flow e2e mobile native send

## 0.31.0

### Minor Changes

- [#19888](https://github.com/LedgerHQ/ledger-live/pull/19888) [`f8a6ef6`](https://github.com/LedgerHQ/ledger-live/commit/f8a6ef66a6548c3d729e6db985cc05067013b962) Thanks [@VicAlbr](https://github.com/VicAlbr)! - test(e2e): hardcode the HBAR to XRP swap amount to 500 as a temporary workaround for LIVE-33611; revert once the swap "min amount for quotes" bug is fixed.

- [#19724](https://github.com/LedgerHQ/ledger-live/pull/19724) [`06138af`](https://github.com/LedgerHQ/ledger-live/commit/06138af41298aec793f5dcab5bc5bdb686296c4a) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Review buySell.spec (QAA-1107): pick the buy/sell provider from the available quotes via a shared deterministic weekly rotation helper (`pickRotatingProvider` in live-e2e-shared, used by both desktop and mobile) instead of hardcoded MoonPay, and expand sell coverage to BTC, ETH and USDT. Align the mobile BTC sell TMS link accordingly.

## 0.31.0-next.0

### Minor Changes

- [#19888](https://github.com/LedgerHQ/ledger-live/pull/19888) [`f8a6ef6`](https://github.com/LedgerHQ/ledger-live/commit/f8a6ef66a6548c3d729e6db985cc05067013b962) Thanks [@VicAlbr](https://github.com/VicAlbr)! - test(e2e): hardcode the HBAR to XRP swap amount to 500 as a temporary workaround for LIVE-33611; revert once the swap "min amount for quotes" bug is fixed.

- [#19724](https://github.com/LedgerHQ/ledger-live/pull/19724) [`06138af`](https://github.com/LedgerHQ/ledger-live/commit/06138af41298aec793f5dcab5bc5bdb686296c4a) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Review buySell.spec (QAA-1107): pick the buy/sell provider from the available quotes via a shared deterministic weekly rotation helper (`pickRotatingProvider` in live-e2e-shared, used by both desktop and mobile) instead of hardcoded MoonPay, and expand sell coverage to BTC, ETH and USDT. Align the mobile BTC sell TMS link accordingly.

## 0.30.0

### Minor Changes

- [#19393](https://github.com/LedgerHQ/ledger-live/pull/19393) [`4a9eade`](https://github.com/LedgerHQ/ledger-live/commit/4a9eade8c74c948acab3955eca83c734d13776a1) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - test: e2e test aleo add account flow on mobile

- [#19281](https://github.com/LedgerHQ/ledger-live/pull/19281) [`35ab018`](https://github.com/LedgerHQ/ledger-live/commit/35ab0186be129e4366e9b07197c26b6c6c1b596c) Thanks [@jeportie](https://github.com/jeportie)! - Clean up Wallet 4.0 E2E feature flags: remove the shared `WALLET_40_FEATURE_FLAGS` constant and have each spec rely on the merged e2e defaults, the canonical `FF_LWM_WALLET_40_Q2` preset, or an explicit per-spec flag set. Widen the `featureFlags` init option from `PartialFeatures` to `OptionalFeatureMap`.

- [#19315](https://github.com/LedgerHQ/ledger-live/pull/19315) [`e9329c2`](https://github.com/LedgerHQ/ledger-live/commit/e9329c22c2353119d8ccba9a2a2deaff76858bbd) Thanks [@jeportie](https://github.com/jeportie)! - Add E2E coverage for the swap cross-account warning across DEX providers (1inch, Velora, Uniswap, OKX) on Desktop (Playwright) and Mobile (Detox): swapping a token to a different account of the destination currency must surface the "Cross-account swaps are not currently supported" message. Mobile now selects a specific destination account via `modularDrawer.selectAssetAndAccount` / the opt-in `selectSpecificToAccount` flag in `performSwapUntilQuoteSelectionStep` (previously the drawer always kept the first account), and relaunches a fresh app per provider for test isolation. `@ledgerhq/live-e2e-shared` exports `keepRunningProviders` for provider-health skipping.

- [#19475](https://github.com/LedgerHQ/ledger-live/pull/19475) [`d2c3ffa`](https://github.com/LedgerHQ/ledger-live/commit/d2c3ffa8814e4d1921206f2f140292f734ff8f69) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Add SUI delegate and undelegate e2e tests for LWD and LWM, with supporting testIds

- [#18831](https://github.com/LedgerHQ/ledger-live/pull/18831) [`17a58a8`](https://github.com/LedgerHQ/ledger-live/commit/17a58a8589b703a956f867f8cdcddba4a7d3d867) Thanks [@deepyjr](https://github.com/deepyjr)! - Add Wallet 4.0 asset aggregation and detail mobile E2E coverage.

## 0.30.0-next.0

### Minor Changes

- [#19393](https://github.com/LedgerHQ/ledger-live/pull/19393) [`4a9eade`](https://github.com/LedgerHQ/ledger-live/commit/4a9eade8c74c948acab3955eca83c734d13776a1) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - test: e2e test aleo add account flow on mobile

- [#19281](https://github.com/LedgerHQ/ledger-live/pull/19281) [`35ab018`](https://github.com/LedgerHQ/ledger-live/commit/35ab0186be129e4366e9b07197c26b6c6c1b596c) Thanks [@jeportie](https://github.com/jeportie)! - Clean up Wallet 4.0 E2E feature flags: remove the shared `WALLET_40_FEATURE_FLAGS` constant and have each spec rely on the merged e2e defaults, the canonical `FF_LWM_WALLET_40_Q2` preset, or an explicit per-spec flag set. Widen the `featureFlags` init option from `PartialFeatures` to `OptionalFeatureMap`.

- [#19315](https://github.com/LedgerHQ/ledger-live/pull/19315) [`e9329c2`](https://github.com/LedgerHQ/ledger-live/commit/e9329c22c2353119d8ccba9a2a2deaff76858bbd) Thanks [@jeportie](https://github.com/jeportie)! - Add E2E coverage for the swap cross-account warning across DEX providers (1inch, Velora, Uniswap, OKX) on Desktop (Playwright) and Mobile (Detox): swapping a token to a different account of the destination currency must surface the "Cross-account swaps are not currently supported" message. Mobile now selects a specific destination account via `modularDrawer.selectAssetAndAccount` / the opt-in `selectSpecificToAccount` flag in `performSwapUntilQuoteSelectionStep` (previously the drawer always kept the first account), and relaunches a fresh app per provider for test isolation. `@ledgerhq/live-e2e-shared` exports `keepRunningProviders` for provider-health skipping.

- [#19475](https://github.com/LedgerHQ/ledger-live/pull/19475) [`d2c3ffa`](https://github.com/LedgerHQ/ledger-live/commit/d2c3ffa8814e4d1921206f2f140292f734ff8f69) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Add SUI delegate and undelegate e2e tests for LWD and LWM, with supporting testIds

- [#18831](https://github.com/LedgerHQ/ledger-live/pull/18831) [`17a58a8`](https://github.com/LedgerHQ/ledger-live/commit/17a58a8589b703a956f867f8cdcddba4a7d3d867) Thanks [@deepyjr](https://github.com/deepyjr)! - Add Wallet 4.0 asset aggregation and detail mobile E2E coverage.

## 0.29.0

### Minor Changes

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

- [#17564](https://github.com/LedgerHQ/ledger-live/pull/17564) [`babad68`](https://github.com/LedgerHQ/ledger-live/commit/babad685139d06343f6a647686c713992ad1ac1a) Thanks [@dilaouid](https://github.com/dilaouid)! - tests(e2e): add detox for evm native staking (sei_evm) and mock smoke under `apps/ledger-live-mobile/e2e` and Speculos delegate flow under `e2e/mobile`

- [#19084](https://github.com/LedgerHQ/ledger-live/pull/19084) [`01034a2`](https://github.com/LedgerHQ/ledger-live/commit/01034a299c997d6696af00d28a8a485ea9e089ca) Thanks [@VicAlbr](https://github.com/VicAlbr)! - E2E Allure report overview now reflects the feature flags actually applied at runtime (e2e defaults + workflow `E2E_FEATURE_FLAGS_JSON` overrides, with JSON taking precedence), instead of Firebase-only values. FF resolution is centralised per platform via a shared `getMergedFeatureFlags()` used by both the test setup and the report teardown, so the overview and per-test data share one source of truth.

- [#18760](https://github.com/LedgerHQ/ledger-live/pull/18760) [`a286589`](https://github.com/LedgerHQ/ledger-live/commit/a286589723c65406c33b8f4a964a6d9d23cb725f) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add mobile E2E coverage for Wallet 4.0 asset discoverability: stocks empty-discovery and holdings sections on the portfolio, and the global search categories and result ranking.

- [#18889](https://github.com/LedgerHQ/ledger-live/pull/18889) [`487f2f2`](https://github.com/LedgerHQ/ledger-live/commit/487f2f25505c304a71fd7a42072c3f492ea98f67) Thanks [@semeano](https://github.com/semeano)! - Disable TON E2E tests

## 0.29.0-next.0

### Minor Changes

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

- [#17564](https://github.com/LedgerHQ/ledger-live/pull/17564) [`babad68`](https://github.com/LedgerHQ/ledger-live/commit/babad685139d06343f6a647686c713992ad1ac1a) Thanks [@dilaouid](https://github.com/dilaouid)! - tests(e2e): add detox for evm native staking (sei_evm) and mock smoke under `apps/ledger-live-mobile/e2e` and Speculos delegate flow under `e2e/mobile`

- [#19084](https://github.com/LedgerHQ/ledger-live/pull/19084) [`01034a2`](https://github.com/LedgerHQ/ledger-live/commit/01034a299c997d6696af00d28a8a485ea9e089ca) Thanks [@VicAlbr](https://github.com/VicAlbr)! - E2E Allure report overview now reflects the feature flags actually applied at runtime (e2e defaults + workflow `E2E_FEATURE_FLAGS_JSON` overrides, with JSON taking precedence), instead of Firebase-only values. FF resolution is centralised per platform via a shared `getMergedFeatureFlags()` used by both the test setup and the report teardown, so the overview and per-test data share one source of truth.

- [#18760](https://github.com/LedgerHQ/ledger-live/pull/18760) [`a286589`](https://github.com/LedgerHQ/ledger-live/commit/a286589723c65406c33b8f4a964a6d9d23cb725f) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add mobile E2E coverage for Wallet 4.0 asset discoverability: stocks empty-discovery and holdings sections on the portfolio, and the global search categories and result ranking.

- [#18889](https://github.com/LedgerHQ/ledger-live/pull/18889) [`487f2f2`](https://github.com/LedgerHQ/ledger-live/commit/487f2f25505c304a71fd7a42072c3f492ea98f67) Thanks [@semeano](https://github.com/semeano)! - Disable TON E2E tests

## 0.28.0

### Minor Changes

- [#18681](https://github.com/LedgerHQ/ledger-live/pull/18681) [`ad68778`](https://github.com/LedgerHQ/ledger-live/commit/ad68778ad71686c9e4f397276917e606a099f573) Thanks [@mitchellv-ledger](https://github.com/mitchellv-ledger)! - Remove llmAnalyticsOptInPrompt feature flag and unused variant B code

## 0.28.0-next.0

### Minor Changes

- [#18681](https://github.com/LedgerHQ/ledger-live/pull/18681) [`ad68778`](https://github.com/LedgerHQ/ledger-live/commit/ad68778ad71686c9e4f397276917e606a099f573) Thanks [@mitchellv-ledger](https://github.com/mitchellv-ledger)! - Remove llmAnalyticsOptInPrompt feature flag and unused variant B code

## 0.27.0

### Minor Changes

- [#18421](https://github.com/LedgerHQ/ledger-live/pull/18421) [`8b3c998`](https://github.com/LedgerHQ/ledger-live/commit/8b3c99867c109bd6502cf10ecd2d15b0c2f4680a) Thanks [@jeportie](https://github.com/jeportie)! - Use a dynamic minimum sell amount in the buy/sell E2E specs: fetch the live per-currency `maxOfMin` from the sell `cryptoLimitations` API (with a USD-countervalues fallback) instead of hardcoded amounts, so sell flows always clear every provider's threshold. Extract `getAmountFromUSD` into a shared `currencyUtils` helper.

- [#18386](https://github.com/LedgerHQ/ledger-live/pull/18386) [`24d19cc`](https://github.com/LedgerHQ/ledger-live/commit/24d19ccd6aad7603d022ac17e025e7ea343f8e21) Thanks [@ysitbon](https://github.com/ysitbon)! - Repoint the remaining `@ledgerhq/types-live` feature-type consumers (desktop app + desktop/mobile e2e) onto `@shared/feature-flags`, taking in-repo usage of the legacy types-live feature types to zero. Also drop now-dead feature-flag tooling config: the `@ledgerhq/live-common/featureFlags/index` `unimported` entry in `live-dmk-desktop`, and the deleted `FeatureFlagsContextBridge` eslint-guardrail exemptions in both apps (the block rules against re-introducing the deleted module are kept).

- [#18435](https://github.com/LedgerHQ/ledger-live/pull/18435) [`136ca7c`](https://github.com/LedgerHQ/ledger-live/commit/136ca7c3bc4a489e49a8df647e2f87585cd705c5) Thanks [@beths-ledger](https://github.com/beths-ledger)! - Align delegate and earn v2 e2e tests (desktop and mobile) with the versioned stakePrograms feature-flag values. ETH staking now redirects into the earn deposit webview instead of a native staking flow, so the affected cold-start, inline add-account, partner-dapp CTA and delegate assertions drive the deposit webview for ETH (amount → provider → partner dapp) while other assets keep the native staking checks. Keeps the test environment in sync with production.

## 0.27.0-next.0

### Minor Changes

- [#18421](https://github.com/LedgerHQ/ledger-live/pull/18421) [`8b3c998`](https://github.com/LedgerHQ/ledger-live/commit/8b3c99867c109bd6502cf10ecd2d15b0c2f4680a) Thanks [@jeportie](https://github.com/jeportie)! - Use a dynamic minimum sell amount in the buy/sell E2E specs: fetch the live per-currency `maxOfMin` from the sell `cryptoLimitations` API (with a USD-countervalues fallback) instead of hardcoded amounts, so sell flows always clear every provider's threshold. Extract `getAmountFromUSD` into a shared `currencyUtils` helper.

- [#18386](https://github.com/LedgerHQ/ledger-live/pull/18386) [`24d19cc`](https://github.com/LedgerHQ/ledger-live/commit/24d19ccd6aad7603d022ac17e025e7ea343f8e21) Thanks [@ysitbon](https://github.com/ysitbon)! - Repoint the remaining `@ledgerhq/types-live` feature-type consumers (desktop app + desktop/mobile e2e) onto `@shared/feature-flags`, taking in-repo usage of the legacy types-live feature types to zero. Also drop now-dead feature-flag tooling config: the `@ledgerhq/live-common/featureFlags/index` `unimported` entry in `live-dmk-desktop`, and the deleted `FeatureFlagsContextBridge` eslint-guardrail exemptions in both apps (the block rules against re-introducing the deleted module are kept).

- [#18435](https://github.com/LedgerHQ/ledger-live/pull/18435) [`136ca7c`](https://github.com/LedgerHQ/ledger-live/commit/136ca7c3bc4a489e49a8df647e2f87585cd705c5) Thanks [@beths-ledger](https://github.com/beths-ledger)! - Align delegate and earn v2 e2e tests (desktop and mobile) with the versioned stakePrograms feature-flag values. ETH staking now redirects into the earn deposit webview instead of a native staking flow, so the affected cold-start, inline add-account, partner-dapp CTA and delegate assertions drive the deposit webview for ETH (amount → provider → partner dapp) while other assets keep the native staking checks. Keeps the test environment in sync with production.

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->

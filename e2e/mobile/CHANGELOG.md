# ledger-live-mobile-e2e-tests

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

## 0.26.0

### Minor Changes

- [#18246](https://github.com/LedgerHQ/ledger-live/pull/18246) [`dcd0ed9`](https://github.com/LedgerHQ/ledger-live/commit/dcd0ed903aa7f5a455dacc2259ac7ca1e5d26491) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Assign an owning team to every mobile e2e test via Allure `owner`/`parentSuite` labels (new `setTeamOwner` helper), mirroring the desktop team system so reports can be grouped and filtered by team.

- [#17814](https://github.com/LedgerHQ/ledger-live/pull/17814) [`b16aa2c`](https://github.com/LedgerHQ/ledger-live/commit/b16aa2c4ba83aa9f67e6ba24a6f522de3956e16d) Thanks [@LucasWerey](https://github.com/LucasWerey)! - add wallet 4.0 my wallet e2e tests

- [#18076](https://github.com/LedgerHQ/ledger-live/pull/18076) [`a3025cf`](https://github.com/LedgerHQ/ledger-live/commit/a3025cffe9bef6c082dd45a75523cadfe6677001) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Update data-testId

- [#18149](https://github.com/LedgerHQ/ledger-live/pull/18149) [`7ee8538`](https://github.com/LedgerHQ/ledger-live/commit/7ee8538247a0d48c587354f04c05fff4e69bb3b4) Thanks [@cunhabruno](https://github.com/cunhabruno)! - Declare `@babel/plugin-transform-dynamic-import` and `@babel/plugin-transform-modules-commonjs` as explicit devDependencies. They were referenced by `babel.config.js` since #18119 but resolved via pnpm hoist luck, causing `Cannot find module '@babel/plugin-transform-dynamic-import'` on jest globalSetup.

- [#18119](https://github.com/LedgerHQ/ledger-live/pull/18119) [`537e45b`](https://github.com/LedgerHQ/ledger-live/commit/537e45b1dac506a7cee61485f22e560f27fa274c) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Fix mobile e2e jest loading of ESM-only live-common: transpile `lib-es` to CommonJS in the jest main process (config/globalSetup/reporters) via an swc require-hook, and transform `@ledgerhq` packages in jest workers (`ESM_PACKAGES` + babel `modules-commonjs`/`dynamic-import`). Resolves `ERR_MODULE_NOT_FOUND` on extensionless `device-core` imports after live-common became ESM-only.

## 0.26.0-next.0

### Minor Changes

- [#18246](https://github.com/LedgerHQ/ledger-live/pull/18246) [`dcd0ed9`](https://github.com/LedgerHQ/ledger-live/commit/dcd0ed903aa7f5a455dacc2259ac7ca1e5d26491) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Assign an owning team to every mobile e2e test via Allure `owner`/`parentSuite` labels (new `setTeamOwner` helper), mirroring the desktop team system so reports can be grouped and filtered by team.

- [#17814](https://github.com/LedgerHQ/ledger-live/pull/17814) [`b16aa2c`](https://github.com/LedgerHQ/ledger-live/commit/b16aa2c4ba83aa9f67e6ba24a6f522de3956e16d) Thanks [@LucasWerey](https://github.com/LucasWerey)! - add wallet 4.0 my wallet e2e tests

- [#18076](https://github.com/LedgerHQ/ledger-live/pull/18076) [`a3025cf`](https://github.com/LedgerHQ/ledger-live/commit/a3025cffe9bef6c082dd45a75523cadfe6677001) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Update data-testId

- [#18149](https://github.com/LedgerHQ/ledger-live/pull/18149) [`7ee8538`](https://github.com/LedgerHQ/ledger-live/commit/7ee8538247a0d48c587354f04c05fff4e69bb3b4) Thanks [@cunhabruno](https://github.com/cunhabruno)! - Declare `@babel/plugin-transform-dynamic-import` and `@babel/plugin-transform-modules-commonjs` as explicit devDependencies. They were referenced by `babel.config.js` since #18119 but resolved via pnpm hoist luck, causing `Cannot find module '@babel/plugin-transform-dynamic-import'` on jest globalSetup.

- [#18119](https://github.com/LedgerHQ/ledger-live/pull/18119) [`537e45b`](https://github.com/LedgerHQ/ledger-live/commit/537e45b1dac506a7cee61485f22e560f27fa274c) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Fix mobile e2e jest loading of ESM-only live-common: transpile `lib-es` to CommonJS in the jest main process (config/globalSetup/reporters) via an swc require-hook, and transform `@ledgerhq` packages in jest workers (`ESM_PACKAGES` + babel `modules-commonjs`/`dynamic-import`). Resolves `ERR_MODULE_NOT_FOUND` on extensionless `device-core` imports after live-common became ESM-only.

## 0.25.0

### Minor Changes

- [#17775](https://github.com/LedgerHQ/ledger-live/pull/17775) [`1d39f17`](https://github.com/LedgerHQ/ledger-live/commit/1d39f1747ce2004248e7df36901fccb6c5d79654) Thanks [@abdurrahman-ledger](https://github.com/abdurrahman-ledger)! - Defer pending operation account updates until after broadcast success navigation transitions complete

- [#17802](https://github.com/LedgerHQ/ledger-live/pull/17802) [`b61e421`](https://github.com/LedgerHQ/ledger-live/commit/b61e42102019c04ee5d7df1aca22e30ba4a69e7d) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Add `E2E_FEATURE_FLAGS_JSON` env override for Mobile E2E feature flags, exposed as a `feature_flags_json` input on the Mobile E2E workflow (parity with Desktop).

## 0.25.0-next.0

### Minor Changes

- [#17775](https://github.com/LedgerHQ/ledger-live/pull/17775) [`1d39f17`](https://github.com/LedgerHQ/ledger-live/commit/1d39f1747ce2004248e7df36901fccb6c5d79654) Thanks [@abdurrahman-ledger](https://github.com/abdurrahman-ledger)! - Defer pending operation account updates until after broadcast success navigation transitions complete

- [#17802](https://github.com/LedgerHQ/ledger-live/pull/17802) [`b61e421`](https://github.com/LedgerHQ/ledger-live/commit/b61e42102019c04ee5d7df1aca22e30ba4a69e7d) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Add `E2E_FEATURE_FLAGS_JSON` env override for Mobile E2E feature flags, exposed as a `feature_flags_json` input on the Mobile E2E workflow (parity with Desktop).

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->

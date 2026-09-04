# @ledgerhq/wallet-cli

## 2.5.0-next.0

### Minor Changes

- [#20935](https://github.com/LedgerHQ/ledger-live/pull/20935) [`27388a8`](https://github.com/LedgerHQ/ledger-live/commit/27388a894eaac67b8e162a60f6d3368aad0a8682) Thanks [@dilaouid](https://github.com/dilaouid)! - Move Solana staking onto the generic `StakingResources` account attribute.

  **Breaking for `@ledgerhq/coin-solana`.** `SolanaResources`, `SolanaResourcesRaw`, `toSolanaResourcesRaw` and `fromSolanaResourcesRaw` are gone. `SolanaAccount` is now an alias of `StakingAccount`, so read staking data from `account.stakingResources` instead of `account.solanaResources`. A stake is a `StakingDelegation` or a `StakingUnbonding` (`SolanaStakingPosition`) rather than a `SolanaStake`: its stake account address is `positionId`, its validator is `validatorAddress`, and the former `activation.active` / `activation.inactive` / `withdrawable` fields are `activeAmount` / `inactiveAmount` / `withdrawableAmount`. `listSolanaStakingPositions`, `solanaActivationState` and `stakeActions` from `@ledgerhq/coin-solana/logic` cover the common access patterns. Accounts already persisted with a `solanaResources` blob are migrated on hydration, so no resync is needed.

  `@ledgerhq/types-live` gains `StakingPositionDetails`, mixed into `StakingDelegation` and `StakingUnbonding` for chains that materialize each position as its own on-chain account, plus `actionFeeReserve` on `StakingResources`. Both are optional, so other chains are unaffected.

  `@ledgerhq/wallet-cli`'s `earn positions` output changes shape: on `EarnSolanaStake`, `stakeBalance` and `withdrawable` go from `number` to an integer decimal string, so lamport amounts above `Number.MAX_SAFE_INTEGER` stay exact. Anything reading those two fields numerically needs updating.

  `@ledgerhq/ledger-wallet-framework` now exports the generic `StakingResources` serializer (`toStakingResourcesRaw`, `fromStakingResourcesRaw`, `assignStakingResourcesToAccountRaw`, `assignStakingResourcesFromAccountRaw`), moved out of the EVM family in `live-common` so every coin module can use it.

- [#21184](https://github.com/LedgerHQ/ledger-live/pull/21184) [`e2fb93a`](https://github.com/LedgerHQ/ledger-live/commit/e2fb93a55655d4741d645c8dfe9bb8eb3e3b8a9f) Thanks [@koda-apps](https://github.com/apps/koda-apps)! - Document the `send --data` flag in the wallet-cli skill and add a worked WETH wrap/unwrap example (`deposit()` / `withdraw(uint256)` selectors), so agents no longer need to hand-derive raw calldata for common contract calls.

## 2.4.0

### Minor Changes

- [#20571](https://github.com/LedgerHQ/ledger-live/pull/20571) [`7c8d5df`](https://github.com/LedgerHQ/ledger-live/commit/7c8d5dfa862a2e9c3a35251b5d06a3cd4f905d2a) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Thread the coin-module `Context` (ADR-019) explicitly through the coin-evm, coin-vechain and coin-near api and logic layers instead of resolving configuration from the module-level `getCoinConfig` singleton. Exported logic functions now take the context as their first argument, resolve `config` from it (`await context.config(currencyId)`), and pass an explicit, required `config` down to the network layer — no `config?` optionals and no singleton reads on the data path. `getCoinConfig`/`setCoinConfig` remain only as the compatibility surface for the classic account bridge. Ledger Live consumers (live-common, desktop, mobile and coin-celo) are updated to resolve and pass config/context explicitly. Also fixes a coin-polkadot type-inference issue where `getTransactionMaterialWithMetadata`'s cache-key extractor narrowed the cached signature and dropped the `config` argument.

## 2.4.0-next.0

### Minor Changes

- [#20571](https://github.com/LedgerHQ/ledger-live/pull/20571) [`7c8d5df`](https://github.com/LedgerHQ/ledger-live/commit/7c8d5dfa862a2e9c3a35251b5d06a3cd4f905d2a) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Thread the coin-module `Context` (ADR-019) explicitly through the coin-evm, coin-vechain and coin-near api and logic layers instead of resolving configuration from the module-level `getCoinConfig` singleton. Exported logic functions now take the context as their first argument, resolve `config` from it (`await context.config(currencyId)`), and pass an explicit, required `config` down to the network layer — no `config?` optionals and no singleton reads on the data path. `getCoinConfig`/`setCoinConfig` remain only as the compatibility surface for the classic account bridge. Ledger Live consumers (live-common, desktop, mobile and coin-celo) are updated to resolve and pass config/context explicitly. Also fixes a coin-polkadot type-inference issue where `getTransactionMaterialWithMetadata`'s cache-key extractor narrowed the cached signature and dropped the `config` argument.

## 2.3.0

### Minor Changes

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

- [#20539](https://github.com/LedgerHQ/ledger-live/pull/20539) [`60b4626`](https://github.com/LedgerHQ/ledger-live/commit/60b462653bad19429c46ebef439ec2b5bb234140) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Scope `@ledgerhq/live-wallet` down to wallet sync only

  The package now exposes `./accounts` and `./walletSyncComposition` and nothing else.
  `ordering.ts` and `addAccounts.ts` move to `@ledgerhq/live-common/account/*`, and
  `accountRawToAccountUserData` joins `live-common/account/serialization` next to `fromAccountRaw`.
  The `liveqr/` folder is gone: `importAccounts.ts` and `accountToAccountData` were unreachable, and
  `accountDataToAccount` — whose only callers rehydrated a wallet-sync descriptor — becomes
  `accounts/descriptorToAccount`. `live-common` no longer depends on `live-wallet`.

- [#18764](https://github.com/LedgerHQ/ledger-live/pull/18764) [`d266e13`](https://github.com/LedgerHQ/ledger-live/commit/d266e13aa8e8b34ca74beaa09687b6e8d426f821) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Migrate the swap `fetchQuotes` helper from axios to an RTK Query endpoint (`swapQuotesApi`). The aggregator `/quote` request now flows through the Redux data layer, and the rawQuotes/providerErrors split is unchanged. Desktop and mobile register the new API and inject their store dispatch at startup via `setSwapQuotesStore`; wallet-cli, which has no app store, sets up a standalone one.

  The endpoint itself now lives in the new `@domain/api-swap-quotes` package; live-common re-exports it, so existing call sites are unchanged.

  Two behaviour changes to be aware of:

  - `/quote` now goes through the authenticated base query, where the legacy axios call sent no credentials. Both apps already register an auth provider on their store's `extra`, so whether a request carries an `Authorization` header is controlled entirely by the `lwdAuth`/`lwmAuth` feature flags. They are disabled by default; enabling either one makes `/quote` send the user's bearer token to the aggregator, and makes a 401/403 trigger the adapter's refresh-and-retry.
  - An aggregator HTTP error (4xx/5xx) now resolves to an empty result, so the caller surfaces the `noQuotes` global. Previously the shared axios error interceptor turned these into `LedgerAPI4xx`/`LedgerAPI5xx`, which propagated to the live app as an error. Only transport failures (no HTTP response) still reject, now with a `SwapQuotesRequestFailed` error rather than a bare RTK Query error object.

## 2.3.0-next.0

### Minor Changes

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

- [#20539](https://github.com/LedgerHQ/ledger-live/pull/20539) [`60b4626`](https://github.com/LedgerHQ/ledger-live/commit/60b462653bad19429c46ebef439ec2b5bb234140) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Scope `@ledgerhq/live-wallet` down to wallet sync only

  The package now exposes `./accounts` and `./walletSyncComposition` and nothing else.
  `ordering.ts` and `addAccounts.ts` move to `@ledgerhq/live-common/account/*`, and
  `accountRawToAccountUserData` joins `live-common/account/serialization` next to `fromAccountRaw`.
  The `liveqr/` folder is gone: `importAccounts.ts` and `accountToAccountData` were unreachable, and
  `accountDataToAccount` — whose only callers rehydrated a wallet-sync descriptor — becomes
  `accounts/descriptorToAccount`. `live-common` no longer depends on `live-wallet`.

- [#18764](https://github.com/LedgerHQ/ledger-live/pull/18764) [`d266e13`](https://github.com/LedgerHQ/ledger-live/commit/d266e13aa8e8b34ca74beaa09687b6e8d426f821) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Migrate the swap `fetchQuotes` helper from axios to an RTK Query endpoint (`swapQuotesApi`). The aggregator `/quote` request now flows through the Redux data layer, and the rawQuotes/providerErrors split is unchanged. Desktop and mobile register the new API and inject their store dispatch at startup via `setSwapQuotesStore`; wallet-cli, which has no app store, sets up a standalone one.

  The endpoint itself now lives in the new `@domain/api-swap-quotes` package; live-common re-exports it, so existing call sites are unchanged.

  Two behaviour changes to be aware of:

  - `/quote` now goes through the authenticated base query, where the legacy axios call sent no credentials. Both apps already register an auth provider on their store's `extra`, so whether a request carries an `Authorization` header is controlled entirely by the `lwdAuth`/`lwmAuth` feature flags. They are disabled by default; enabling either one makes `/quote` send the user's bearer token to the aggregator, and makes a 401/403 trigger the adapter's refresh-and-retry.
  - An aggregator HTTP error (4xx/5xx) now resolves to an empty result, so the caller surfaces the `noQuotes` global. Previously the shared axios error interceptor turned these into `LedgerAPI4xx`/`LedgerAPI5xx`, which propagated to the live app as an error. Only transport failures (no HTTP response) still reject, now with a `SwapQuotesRequestFailed` error rather than a bare RTK Query error object.

## 2.2.0

### Minor Changes

- [#20261](https://github.com/LedgerHQ/ledger-live/pull/20261) [`ba6e9c1`](https://github.com/LedgerHQ/ledger-live/commit/ba6e9c1e542ad28a59b0163e3b453e2f047a48b9) Thanks [@ysitbon](https://github.com/ysitbon)! - Import currency accessors from the domain layer instead of the `@ledgerhq/live-common/currencies` barrel.

  Crypto accessors (`getCryptoCurrencyById`, `findCryptoCurrencyById`, `findCryptoCurrencyByKeyword`, `findCryptoCurrencyByTicker`, `listCryptoCurrencies`, `findCryptoCurrency`, `findCryptoCurrencyByScheme`, `hasCryptoCurrencyId`) now come from `@domain/entity-currency-crypto`, and fiat accessors (`getFiatCurrencyByTicker`, `findFiatCurrencyByTicker`, `listFiatCurrencies`, `hasFiatCurrencyTicker`) from `@domain/entity-currency-fiat`. The re-exports that forwarded them through `@ledgerhq/live-common/currencies` are removed; the barrel keeps its formatting, colour, helper, marketcap, support and URI-scheme exports. Behaviour is unchanged — the barrel already delegated to these same domain functions.

## 2.2.0-next.0

### Minor Changes

- [#20261](https://github.com/LedgerHQ/ledger-live/pull/20261) [`ba6e9c1`](https://github.com/LedgerHQ/ledger-live/commit/ba6e9c1e542ad28a59b0163e3b453e2f047a48b9) Thanks [@ysitbon](https://github.com/ysitbon)! - Import currency accessors from the domain layer instead of the `@ledgerhq/live-common/currencies` barrel.

  Crypto accessors (`getCryptoCurrencyById`, `findCryptoCurrencyById`, `findCryptoCurrencyByKeyword`, `findCryptoCurrencyByTicker`, `listCryptoCurrencies`, `findCryptoCurrency`, `findCryptoCurrencyByScheme`, `hasCryptoCurrencyId`) now come from `@domain/entity-currency-crypto`, and fiat accessors (`getFiatCurrencyByTicker`, `findFiatCurrencyByTicker`, `listFiatCurrencies`, `hasFiatCurrencyTicker`) from `@domain/entity-currency-fiat`. The re-exports that forwarded them through `@ledgerhq/live-common/currencies` are removed; the barrel keeps its formatting, colour, helper, marketcap, support and URI-scheme exports. Behaviour is unchanged — the barrel already delegated to these same domain functions.

## 2.1.0

### Minor Changes

- [#19159](https://github.com/LedgerHQ/ledger-live/pull/19159) [`7096cea`](https://github.com/LedgerHQ/ledger-live/commit/7096cea26156431db96ff5ab977cfb04885211e7) Thanks [@Justkant](https://github.com/Justkant)! - Add a `skill` command group (`list`, `retrieve`, `install`) that ships the Ledger wallet-cli agent skill embedded inside the compiled binary, so `wallet-cli skill install` works with zero prior setup. Installs into the right location for most agents via `--agent` (`claude`, `cursor`, `codex`, or the generic `agents` → `.agents/skills`), with `--global` and `--dir` overrides.

- [#19160](https://github.com/LedgerHQ/ledger-live/pull/19160) [`d56837e`](https://github.com/LedgerHQ/ledger-live/commit/d56837e6a6063120931595f5c775fdb1521b79ac) Thanks [@Justkant](https://github.com/Justkant)! - Add `wallet-cli skill doctor` to detect drift between installed agent skills and the skills shipped in the running binary (`up-to-date`, `outdated`, `modified-locally`, `missing`), with a conservative `--fix` self-heal that reinstalls outdated/missing skills and only overwrites locally modified ones under `--force`. Skills are now version-locked via a `.wallet-cli-skill.json` provenance sidecar written on install, and the `skill install` JSON envelope surfaces the wallet-cli version and per-skill content hashes.

- [#19161](https://github.com/LedgerHQ/ledger-live/pull/19161) [`4d5b3fb`](https://github.com/LedgerHQ/ledger-live/commit/4d5b3fbdf65100d34027d2140eff5478c97b3ac2) Thanks [@Justkant](https://github.com/Justkant)! - Add a one-time, agent-aware first-run nudge that prints a tailored hint to stderr (e.g. `wallet-cli skill install --agent claude`) on the first real command, so agents discover the embedded skill. It is shown at most once per user (persisted via an XDG state marker), silent under `--output json` and for `skill *` commands, opt-out via `WALLET_CLI_NO_NUDGE=1`, and fully best-effort (never throws or changes exit codes). Agent detection is centralized in a new `agent-detection` helper that `isAgentEnvironment()` now delegates to.

- [#19773](https://github.com/LedgerHQ/ledger-live/pull/19773) [`2a532b7`](https://github.com/LedgerHQ/ledger-live/commit/2a532b7a27f2536ae64b2e6e35829b91046ad968) Thanks [@koda-apps](https://github.com/apps/koda-apps)! - `swap execute` now reports `amountExpectedTo` in display units (e.g. `1.2345` ETH) instead of atomic units, both in the human output and the JSON envelope, and sends the same display-unit value as the `toAmount` analytics property. The atomic value is still available under the new `amountExpectedToAtomic` field for scripts that relied on the previous behaviour. `magnitudeAwareRate` is unchanged and stays an atomic-to over atomic-from ratio, matching live-common's convention.

- [#19598](https://github.com/LedgerHQ/ledger-live/pull/19598) [`9dc6491`](https://github.com/LedgerHQ/ledger-live/commit/9dc6491192f071285315c4b48340e1a02688dae9) Thanks [@koda-apps](https://github.com/apps/koda-apps)! - fix: add missing provider field to swap_completed analytics event

- [#19871](https://github.com/LedgerHQ/ledger-live/pull/19871) [`d243bd0`](https://github.com/LedgerHQ/ledger-live/commit/d243bd0cd2489a836961a724e60f6049a27f74d6) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(llc): consume `validateAddress` through `CoinModuleApi` instance

- [#19797](https://github.com/LedgerHQ/ledger-live/pull/19797) [`93c54da`](https://github.com/LedgerHQ/ledger-live/commit/93c54daf4076e1163a9b7db86107ab2765b81b5d) Thanks [@ysitbon](https://github.com/ysitbon)! - Repoint remaining @ledgerhq/cryptoassets value-barrel imports to @domain/entity-currency-crypto and @domain/entity-currency-fiat; inline ApiAsset wire-type into the dada-client entities module; drop @ledgerhq/cryptoassets from wallet-cli devDependencies

## 2.0.1

### Patch Changes

- Refresh README documentation for the `2.0.0` release: bump the version, retitle the status section to v2, and document the `earn` (staking & DeFi yield) and `ring` (Ledger Key Ring / LKRP encryption) command groups in the commands table, `--help` list, and prerequisites.

## 2.0.0

> This is a manual major version bump. There are no breaking changes; the `2.0.0` release marks the addition of the `earn` and `ring` command groups as a product milestone. All entries below are additive (minor) or fixes (patch).

### Minor Changes

- Add `ring` command group: a developer surface to your Ledger Key Ring (LKRP) for trustless, hardware-rooted encryption of files and text.

  Commands: `ring init`, `ring encrypt`, `ring decrypt`, `ring keys`, `ring destroy`. Files via `-i/-o`, text via stdin/stdout. Keys are AES-256-GCM, derived per-name with HKDF-SHA256 from the LKRP-shared root key; the ring is recoverable from your Ledger.

- Earn: add `earn deposit`, `earn withdraw`, and `earn positions` commands. `earn deposit`/`earn withdraw` support EVM ERC-4626 Kiln vaults (the backend-built approve→deposit / redeem calldata is run through the EVM bridge, opening the Ethereum app with the `Kiln` clear-signing app as a dependency, with a gas-limit buffer for the gas-heavy vault calls and on-chain status polling) and Solana native staking (`stake.createAccount` to delegate; a two-phase unstake that undelegates first and then withdraws the inactive lamports with `--finalize`). `earn positions` lists backend stake views and enriches Solana with on-chain stake accounts so `earn withdraw --stake-account` has a concrete target. Positions still being refreshed are flagged with a `(stale)` marker, and `--fresh` triggers a background refresh whose results show up on a re-run. All three accept `--output json`, and deposit/withdraw accept `--dry-run` to prepare and validate without signing or broadcasting.

  Earn yields: source Solana validators from the validator-details endpoint and merge Figment APY (Net APY now shown for validators), surface more validators with a configurable `--limit`, and separate informational grow/provider rows from concrete `earn deposit --product` targets in the output. Without `--network`, the listing is now restricted to CLI-supported earn networks (ethereum, solana) and narrowed to the user's discovered accounts, with `--all` to bypass the account filter. Rows the CLI cannot deposit into directly now carry a `ledgerlive://` deeplink to act on in the wallet: provider rows link to their live app (`ledgerlive://discover/<liveAppId>`), and grow rows link to the Earn deposit flow for the asset (`ledgerlive://earn/deposit?cryptoAssetId=<deposit_token>&accountId=<walletApiId>`, defaulting to the first discovered account per network with `--account` to override). For ERC-20 deposit tokens the deeplink targets the token sub-account id (not the parent) so the deposit page selects the right token. Solana delegation does not go through a live app (the Earn live app itself opens the native modal), so SOL rows instead link to the native delegation modal (`ledgerlive://earn?action=stake-account&accountId=<walletApiId>`, falling back to `action=stake` when no account is known). Deeplinks render as OSC 8 hyperlinks (clickable in terminals that support it, plain copy-pasteable URL when piped or unsupported)

- Make the `@ledgerhq/cryptoassets` fiat registry injectable (`setFiatCurrenciesStore`) and inject the `@domain/entity-currency-fiat` registry at each app's bootstrap, so the domain registry is the single runtime source of truth for fiat currency data. The bundled fiat list stays as the fallback and is kept in sync by the existing parity test.

### Patch Changes

- `ring destroy` now handles the non-destructive application deactivation introduced by the LKRP per-application close: it calls `destroyApplication` directly (which is idempotent on an already-closed stream) and, when the member has been ejected from the ring (`TrustchainEjected` — removed by another owner, or the trustchain destroyed remotely), treats the remote as already gone and proceeds to the local credential wipe instead of aborting as a transient network failure. `ring encrypt`/`ring decrypt` now surface actionable guidance when the wallet-cli application has been deactivated on the ring.

- Add `fromCurrency` and `toCurrency` fields to the `swap_completed` analytics event.

- Add tests for the Device Intent Executor (DIE).

## 1.1.0

### Minor Changes

- [#18670](https://github.com/LedgerHQ/ledger-live/pull/18670) [`8de4c1a`](https://github.com/LedgerHQ/ledger-live/commit/8de4c1a112ad768b767ddbecfbc7c2d49bbdce8c) Thanks [@CremaFR](https://github.com/CremaFR)! - Fix swap execution into token accounts that do not exist yet

- [#18627](https://github.com/LedgerHQ/ledger-live/pull/18627) [`7fcf623`](https://github.com/LedgerHQ/ledger-live/commit/7fcf62387e642e10b23503a786e230b11d051cb6) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Bump Device Management Kit to 1.7.1

- [#18215](https://github.com/LedgerHQ/ledger-live/pull/18215) [`b1c20cf`](https://github.com/LedgerHQ/ledger-live/commit/b1c20cfc2595e8ec2019e94ef15238852e4e9fea) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - Fix Solana `send --memo` failing before the signing prompt. The wallet-cli bridge was projecting `--memo` as a top-level transaction field, but `@ledgerhq/coin-solana` only reads it from `tx.model.uiState.memo`. The memo never reached the command descriptor, no Memo program instruction was added to the message, and the resulting half-prepared transaction broke the USB/DMK transport. `--memo` is now projected into `tx.model.uiState.memo` for both native and SPL-token transfers.

- [#18203](https://github.com/LedgerHQ/ledger-live/pull/18203) [`0322baa`](https://github.com/LedgerHQ/ledger-live/commit/0322baa8ab7ad8ac5c45c805e7159653047ee7bf) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - remove to fresh address

- [#18256](https://github.com/LedgerHQ/ledger-live/pull/18256) [`eb1dae8`](https://github.com/LedgerHQ/ledger-live/commit/eb1dae8fc14ff8e0bc1e1ce040712492a0328451) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Derive "supported currencies" from the coin-modules registry instead of `setSupportedCurrencies`.

  Each `CoinModuleLoader` now declares a `supportedCoins: CryptoCurrencyId[]` field, and a currency is supported when it appears in a registered loader's `supportedCoins`. The framework `setSupportedCurrencies` / `listSupportedCurrencies` / `isCurrencySupported` and the `EXPERIMENTAL_CURRENCIES` env are removed; `listSupportedCurrencies` / `isCurrencySupported` are now exported from `@ledgerhq/live-common/currencies` backed by the registry. Apps no longer maintain a supported-currencies list — registering the coin modules is what makes their currencies supported.

- Inject the domain-backed crypto-currency registry (`@domain/entity-currency-crypto`) at app bootstrap via `setCryptoCurrenciesStore`, making the domain registry the runtime source of truth for currency data. The bundled data in `@ledgerhq/cryptoassets` stays as the fallback.

- add swap cli die

- add init segment analytics

- add lifecycle analytics

- add analytics to help command

- add account analytics

- add send analytics

- add analytics for swap cli

- Add swap analytics tracking (started, completed, rejected) to the DIE swap pipeline

### Patch Changes

- remove mention of die

## 1.0.2

### Patch Changes

- [#17664](https://github.com/LedgerHQ/ledger-live/pull/17664) [`8056a28`](https://github.com/LedgerHQ/ledger-live/commit/8056a28b60e14ec6764343131364e2e82c54b188) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - add /accepted and /cancelled to swap cli

- Emit a plain greppable `hash: <txHash>` line to stdout on broadcast (human output) so scripts can capture the transaction hash without parsing ANSI-styled status lines.

## 1.0.1

### Patch Changes

- Refresh README documentation for the stable v1 release and add agent guidance for wallet-cli command usage.

## 1.0.0

### Major Changes

- Promote wallet-cli to its first stable `1.0.0` release.
- Add npm binary publishing support for the wallet-cli wrapper and platform packages.
- Add swap quote and execute flows, including session management, `from`/`to` execution inputs, provider filtering, Changelly mapping to `changelly_v2`, token-to-token swaps, and supported currency data in quotes.
- `account discover` no longer exposes the raw V1 descriptor. Human output shows the session label in bold as the primary identifier; JSON output replaces descriptor strings with `{ label, freshAddress }` objects.
- Reject raw account descriptors as CLI arguments, require session labels from `account discover`, and reject extended private keys in descriptor parsing.
- Add token support for supported currencies.
- Add status and genuine check commands.
- Update wallet-cli for the `alpaca` to `coin-service` rename.
- Rename `AlpacaApi` references to `CoinModuleApi`.
- Await async operation serialization bridge calls.
- Update the wallet-cli skill file with swap coverage.
- Fix wallet CLI USB interruption and DMK teardown handling.

### Patch Changes

- Fix swap execution to keep the Exchange app session open across the full pipeline.
- Harden swap execute flags and zero-amount rate output.
- Fix `--no-verify` and other `--no-<flag>` negations being silently ignored.
- Route human stderr messages through the shared writer for consistent capture.
- Remove provider fee and network fee fields from swap CLI quotes.
- Remove dry-run mode from swap execute.
- Bundle `THIRD_PARTY_NOTICES.md` to satisfy upstream attribution.
- Ship the Apache-2.0 `LICENSE` file in wrapper and platform tarballs.

## 0.4.0

### Minor Changes

- [#17284](https://github.com/LedgerHQ/ledger-live/pull/17284) [`446020d`](https://github.com/LedgerHQ/ledger-live/commit/446020d273d19f761920b57cefec85b5dabe2921) Thanks [@gre-ledger](https://github.com/gre-ledger)! - chore: async prep — toOperationRaw, toSignedOperationRaw and remaining bridge callers (LIVE-29186)

  Make `toOperationRaw`, `toSignedOperationRaw` and `toSignOperationEventRaw` async in `@ledgerhq/live-common`,
  widen `WalletSyncDataManagerResolutionContext.getAccountBridge` in `@ledgerhq/live-wallet` to accept a Promise,
  and update remaining callers (apps/cli, apps/wallet-cli, apps/web-tools, mobile concordium, coin-tester-evm/solana,
  coin-modules-monitoring) to `await` the bridge.

- [#17087](https://github.com/LedgerHQ/ledger-live/pull/17087) [`f661909`](https://github.com/LedgerHQ/ledger-live/commit/f6619097fb95a83377d981b40031de555e2c1855) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - add status command to cli

- [#17280](https://github.com/LedgerHQ/ledger-live/pull/17280) [`37241be`](https://github.com/LedgerHQ/ledger-live/commit/37241be0225443a836511580ae64a1a3f68b90bd) Thanks [@Justkant](https://github.com/Justkant)! - Fix wallet-cli swap execution to keep the Exchange app session open across the full pipeline

- [#17379](https://github.com/LedgerHQ/ledger-live/pull/17379) [`08e4ec2`](https://github.com/LedgerHQ/ledger-live/commit/08e4ec282be330d6c8ec378dfc7d75d7a69f8a5c) Thanks [@Justkant](https://github.com/Justkant)! - Fix wallet CLI USB interruption and DMK teardown handling

- [#17441](https://github.com/LedgerHQ/ledger-live/pull/17441) [`24a6911`](https://github.com/LedgerHQ/ledger-live/commit/24a691176bd63bfb028d66ebedc5c0013d5c1c3a) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - limit providers for swap execute and map changelly to changelly_v2

- [#17259](https://github.com/LedgerHQ/ledger-live/pull/17259) [`0d39a62`](https://github.com/LedgerHQ/ledger-live/commit/0d39a621818651365f3a4a28681493b0104802c6) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Reject raw account descriptors as CLI arguments (use session labels from `account discover`) and reject extended private keys (xprv/yprv/zprv/tprv/uprv/vprv) in descriptor parsing.

- [#17370](https://github.com/LedgerHQ/ledger-live/pull/17370) [`b009632`](https://github.com/LedgerHQ/ledger-live/commit/b009632b52cf2c1a9e99122a89f1f7ee7e0737f2) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - add supported currency to quote

- [#17435](https://github.com/LedgerHQ/ledger-live/pull/17435) [`5f3b163`](https://github.com/LedgerHQ/ledger-live/commit/5f3b16310ce7f6c2a34066ec8f24d252e0e7b13f) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - remove Provider fee and Network fee fields from quote in swap CLI

- [#16952](https://github.com/LedgerHQ/ledger-live/pull/16952) [`483bc1c`](https://github.com/LedgerHQ/ledger-live/commit/483bc1c5aa432dac9ab0413d7b7ee27e5ebb0b34) Thanks [@jnicoulaud-ledger](https://github.com/jnicoulaud-ledger)! - chore(BACK-11212): update code base after `alpaca` -> `coin-service` renaming

- [#17366](https://github.com/LedgerHQ/ledger-live/pull/17366) [`334c280`](https://github.com/LedgerHQ/ledger-live/commit/334c2804622f46d7ec536e937419217c07dea97d) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - add from and to to swap execute

- [#17200](https://github.com/LedgerHQ/ledger-live/pull/17200) [`44f72d8`](https://github.com/LedgerHQ/ledger-live/commit/44f72d86c17234506dc2f7ef27377590d4bcee6f) Thanks [@Justkant](https://github.com/Justkant)! - Add genuine check command to wallet-cli

- [#17281](https://github.com/LedgerHQ/ledger-live/pull/17281) [`24044ef`](https://github.com/LedgerHQ/ledger-live/commit/24044efdd32e46416a45ef522edfb98f3799858c) Thanks [@Justkant](https://github.com/Justkant)! - Harden wallet-cli swap execute flags and zero-amount rate output

- [#17282](https://github.com/LedgerHQ/ledger-live/pull/17282) [`82045d4`](https://github.com/LedgerHQ/ledger-live/commit/82045d4e485b39fdedf7614929090b148e8b1d1f) Thanks [@Justkant](https://github.com/Justkant)! - Route human stderr messages through the shared writer for consistent capture.

- [#17365](https://github.com/LedgerHQ/ledger-live/pull/17365) [`184d0f8`](https://github.com/LedgerHQ/ledger-live/commit/184d0f8c79ac7b0fe34257f3ff7b6c970cc2e876) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - remove dry run from swap execute

- [#17311](https://github.com/LedgerHQ/ledger-live/pull/17311) [`7326427`](https://github.com/LedgerHQ/ledger-live/commit/7326427983098d96694f0decf9cc492cc1f12f10) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - add session management with quote command

- [#16948](https://github.com/LedgerHQ/ledger-live/pull/16948) [`aa545d0`](https://github.com/LedgerHQ/ledger-live/commit/aa545d07d60f68810b1aafcbf1621782f69363cf) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - add swap execute to cli

- [#17434](https://github.com/LedgerHQ/ledger-live/pull/17434) [`9a9611a`](https://github.com/LedgerHQ/ledger-live/commit/9a9611ac9df3e37be86ee673d3619105f382746f) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - support tokens for supported currencies

- [#17367](https://github.com/LedgerHQ/ledger-live/pull/17367) [`ae62d2d`](https://github.com/LedgerHQ/ledger-live/commit/ae62d2df1e995d195d844674c8e4c21234caa3ec) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Fix `--no-verify` (and other `--no-<flag>` negations) being silently ignored. bunli's parser drops unknown flags, so `--no-verify` was a no-op and the device verification screen still appeared. argv is now pre-processed to rewrite `--no-<flag>` to `--<flag>=false`.

- [#17189](https://github.com/LedgerHQ/ledger-live/pull/17189) [`d4314da`](https://github.com/LedgerHQ/ledger-live/commit/d4314daa9177c526456e0583c4e445383d656c55) Thanks [@Justkant](https://github.com/Justkant)! - Add npm binary publishing support for wallet-cli

- [#17317](https://github.com/LedgerHQ/ledger-live/pull/17317) [`6935e56`](https://github.com/LedgerHQ/ledger-live/commit/6935e56e7634523c10cc1e2ef935f7d6a68b7f79) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - add swap skill to skill file

## 0.4.0-next.0

### Minor Changes

- [#17284](https://github.com/LedgerHQ/ledger-live/pull/17284) [`446020d`](https://github.com/LedgerHQ/ledger-live/commit/446020d273d19f761920b57cefec85b5dabe2921) Thanks [@gre-ledger](https://github.com/gre-ledger)! - chore: async prep — toOperationRaw, toSignedOperationRaw and remaining bridge callers (LIVE-29186)

  Make `toOperationRaw`, `toSignedOperationRaw` and `toSignOperationEventRaw` async in `@ledgerhq/live-common`,
  widen `WalletSyncDataManagerResolutionContext.getAccountBridge` in `@ledgerhq/live-wallet` to accept a Promise,
  and update remaining callers (apps/cli, apps/wallet-cli, apps/web-tools, mobile concordium, coin-tester-evm/solana,
  coin-modules-monitoring) to `await` the bridge.

- [#17087](https://github.com/LedgerHQ/ledger-live/pull/17087) [`f661909`](https://github.com/LedgerHQ/ledger-live/commit/f6619097fb95a83377d981b40031de555e2c1855) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - add status command to cli

- [#17280](https://github.com/LedgerHQ/ledger-live/pull/17280) [`37241be`](https://github.com/LedgerHQ/ledger-live/commit/37241be0225443a836511580ae64a1a3f68b90bd) Thanks [@Justkant](https://github.com/Justkant)! - Fix wallet-cli swap execution to keep the Exchange app session open across the full pipeline

- [#17379](https://github.com/LedgerHQ/ledger-live/pull/17379) [`08e4ec2`](https://github.com/LedgerHQ/ledger-live/commit/08e4ec282be330d6c8ec378dfc7d75d7a69f8a5c) Thanks [@Justkant](https://github.com/Justkant)! - Fix wallet CLI USB interruption and DMK teardown handling

- [#17441](https://github.com/LedgerHQ/ledger-live/pull/17441) [`24a6911`](https://github.com/LedgerHQ/ledger-live/commit/24a691176bd63bfb028d66ebedc5c0013d5c1c3a) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - limit providers for swap execute and map changelly to changelly_v2

- [#17259](https://github.com/LedgerHQ/ledger-live/pull/17259) [`0d39a62`](https://github.com/LedgerHQ/ledger-live/commit/0d39a621818651365f3a4a28681493b0104802c6) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Reject raw account descriptors as CLI arguments (use session labels from `account discover`) and reject extended private keys (xprv/yprv/zprv/tprv/uprv/vprv) in descriptor parsing.

- [#17370](https://github.com/LedgerHQ/ledger-live/pull/17370) [`b009632`](https://github.com/LedgerHQ/ledger-live/commit/b009632b52cf2c1a9e99122a89f1f7ee7e0737f2) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - add supported currency to quote

- [#17435](https://github.com/LedgerHQ/ledger-live/pull/17435) [`5f3b163`](https://github.com/LedgerHQ/ledger-live/commit/5f3b16310ce7f6c2a34066ec8f24d252e0e7b13f) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - remove Provider fee and Network fee fields from quote in swap CLI

- [#16952](https://github.com/LedgerHQ/ledger-live/pull/16952) [`483bc1c`](https://github.com/LedgerHQ/ledger-live/commit/483bc1c5aa432dac9ab0413d7b7ee27e5ebb0b34) Thanks [@jnicoulaud-ledger](https://github.com/jnicoulaud-ledger)! - chore(BACK-11212): update code base after `alpaca` -> `coin-service` renaming

- [#17366](https://github.com/LedgerHQ/ledger-live/pull/17366) [`334c280`](https://github.com/LedgerHQ/ledger-live/commit/334c2804622f46d7ec536e937419217c07dea97d) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - add from and to to swap execute

- [#17200](https://github.com/LedgerHQ/ledger-live/pull/17200) [`44f72d8`](https://github.com/LedgerHQ/ledger-live/commit/44f72d86c17234506dc2f7ef27377590d4bcee6f) Thanks [@Justkant](https://github.com/Justkant)! - Add genuine check command to wallet-cli

- [#17281](https://github.com/LedgerHQ/ledger-live/pull/17281) [`24044ef`](https://github.com/LedgerHQ/ledger-live/commit/24044efdd32e46416a45ef522edfb98f3799858c) Thanks [@Justkant](https://github.com/Justkant)! - Harden wallet-cli swap execute flags and zero-amount rate output

- [#17282](https://github.com/LedgerHQ/ledger-live/pull/17282) [`82045d4`](https://github.com/LedgerHQ/ledger-live/commit/82045d4e485b39fdedf7614929090b148e8b1d1f) Thanks [@Justkant](https://github.com/Justkant)! - Route human stderr messages through the shared writer for consistent capture.

- [#17365](https://github.com/LedgerHQ/ledger-live/pull/17365) [`184d0f8`](https://github.com/LedgerHQ/ledger-live/commit/184d0f8c79ac7b0fe34257f3ff7b6c970cc2e876) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - remove dry run from swap execute

- [#17311](https://github.com/LedgerHQ/ledger-live/pull/17311) [`7326427`](https://github.com/LedgerHQ/ledger-live/commit/7326427983098d96694f0decf9cc492cc1f12f10) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - add session management with quote command

- [#16948](https://github.com/LedgerHQ/ledger-live/pull/16948) [`aa545d0`](https://github.com/LedgerHQ/ledger-live/commit/aa545d07d60f68810b1aafcbf1621782f69363cf) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - add swap execute to cli

- [#17434](https://github.com/LedgerHQ/ledger-live/pull/17434) [`9a9611a`](https://github.com/LedgerHQ/ledger-live/commit/9a9611ac9df3e37be86ee673d3619105f382746f) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - support tokens for supported currencies

- [#17367](https://github.com/LedgerHQ/ledger-live/pull/17367) [`ae62d2d`](https://github.com/LedgerHQ/ledger-live/commit/ae62d2df1e995d195d844674c8e4c21234caa3ec) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Fix `--no-verify` (and other `--no-<flag>` negations) being silently ignored. bunli's parser drops unknown flags, so `--no-verify` was a no-op and the device verification screen still appeared. argv is now pre-processed to rewrite `--no-<flag>` to `--<flag>=false`.

- [#17189](https://github.com/LedgerHQ/ledger-live/pull/17189) [`d4314da`](https://github.com/LedgerHQ/ledger-live/commit/d4314daa9177c526456e0583c4e445383d656c55) Thanks [@Justkant](https://github.com/Justkant)! - Add npm binary publishing support for wallet-cli

- [#17317](https://github.com/LedgerHQ/ledger-live/pull/17317) [`6935e56`](https://github.com/LedgerHQ/ledger-live/commit/6935e56e7634523c10cc1e2ef935f7d6a68b7f79) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - add swap skill to skill file

## 0.3.0

### Minor Changes

- [#16756](https://github.com/LedgerHQ/ledger-live/pull/16756) [`c36f57c`](https://github.com/LedgerHQ/ledger-live/commit/c36f57cc1b0ab17d2234beb5ab971cc3aa0babd0) Thanks [@Justkant](https://github.com/Justkant)! - Fix Windows WebUSB reconnect handling in wallet-cli

- [#16435](https://github.com/LedgerHQ/ledger-live/pull/16435) [`7d06007`](https://github.com/LedgerHQ/ledger-live/commit/7d06007c5ac3ba52551f7d602eb1dcd24759cb41) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Fix `send --dry-run` and `--rbf` boolean flag parsing; add `--data` option for EVM calldata

- [#16886](https://github.com/LedgerHQ/ledger-live/pull/16886) [`ce53342`](https://github.com/LedgerHQ/ledger-live/commit/ce53342114bded3d66f1b5668f03d4dcd81d8bce) Thanks [@Justkant](https://github.com/Justkant)! - Fix Windows WebUSB discovery when devices are connected after wallet-cli startup

- [#16881](https://github.com/LedgerHQ/ledger-live/pull/16881) [`c28ab41`](https://github.com/LedgerHQ/ledger-live/commit/c28ab4147ab73fec30bb9bb63df6d8d84f894410) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Fix Solana token send (e.g. USDC) crashing with "Resolution provided without a deviceModelId"

- [#16683](https://github.com/LedgerHQ/ledger-live/pull/16683) [`72ae5ec`](https://github.com/LedgerHQ/ledger-live/commit/72ae5ec62aa2457e99b2cb11444b8d7aeb1fc3b6) Thanks [@Justkant](https://github.com/Justkant)! - Improve wallet-cli device state handling and output consistency

- [#16906](https://github.com/LedgerHQ/ledger-live/pull/16906) [`da54ba3`](https://github.com/LedgerHQ/ledger-live/commit/da54ba3c89c7d83a49286d784b1abc27ba1bf32b) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - fix getQuote types

- [#16598](https://github.com/LedgerHQ/ledger-live/pull/16598) [`509e3fc`](https://github.com/LedgerHQ/ledger-live/commit/509e3fc04ccb3ecf9279c68c6c8d008b9473db21) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add session layer: `account discover` now persists found accounts to `~/.local/state/ledger-wallet-cli/session.yaml`. All `--account` flags accept session labels (e.g. `ethereum-1`) in addition to full descriptors. New `session view` and `session reset` commands.

### Patch Changes

- Updated dependencies [[`5ddf2f0`](https://github.com/LedgerHQ/ledger-live/commit/5ddf2f01fed8d74275aeeb292a7c5ec3e346af04), [`ec88011`](https://github.com/LedgerHQ/ledger-live/commit/ec88011f8ac95632d218e1a78ecfe93f7a4f20ab), [`53182fc`](https://github.com/LedgerHQ/ledger-live/commit/53182fc7a44263443775420afee4a12f29369870), [`ee83c6b`](https://github.com/LedgerHQ/ledger-live/commit/ee83c6bc4e0a449a7db517987a857c54b6b9c53c), [`ed0dc8a`](https://github.com/LedgerHQ/ledger-live/commit/ed0dc8abc2c8f5054e655c4e12efe6fb433fbaca), [`7b63096`](https://github.com/LedgerHQ/ledger-live/commit/7b630968f16eeb18f04d499441a23e5587e59137), [`2def56d`](https://github.com/LedgerHQ/ledger-live/commit/2def56d641c0d08f5b1c57d35b068c114faf7c24), [`4ddd97a`](https://github.com/LedgerHQ/ledger-live/commit/4ddd97a99bab5b581ad5ccfd36eb420ec4ee6352), [`7fafa10`](https://github.com/LedgerHQ/ledger-live/commit/7fafa10d8af581f4433a60ea908980a726d3a777), [`ac26c8b`](https://github.com/LedgerHQ/ledger-live/commit/ac26c8bffa9b5cc9f28bed5ce3d44e32982d655c), [`177494c`](https://github.com/LedgerHQ/ledger-live/commit/177494c5020375e49eaea26cead9cbbd14cd63be), [`fb79639`](https://github.com/LedgerHQ/ledger-live/commit/fb79639eb81258bae4830ed6ffe375ae625054ad), [`05b5ea0`](https://github.com/LedgerHQ/ledger-live/commit/05b5ea0579f0325c669805711b298f2eb0bd6434), [`e9886ec`](https://github.com/LedgerHQ/ledger-live/commit/e9886ec8f6a5835a745b4e3c25920cae4f1bb11f), [`054a8e8`](https://github.com/LedgerHQ/ledger-live/commit/054a8e8c7d4e1be511232a53a015d0bcc111e62e), [`aa867e1`](https://github.com/LedgerHQ/ledger-live/commit/aa867e1f5191569c13daf0261572ee0e976f58f2), [`78557fd`](https://github.com/LedgerHQ/ledger-live/commit/78557fdbee0b7c7702fc20d8a89ac62525c9aef7), [`0d11df6`](https://github.com/LedgerHQ/ledger-live/commit/0d11df6ef8dc781171071824ad1c39e3beed7730), [`5457ea4`](https://github.com/LedgerHQ/ledger-live/commit/5457ea4d13f10341403fdfec2d1fbef64cc14682), [`b866ea6`](https://github.com/LedgerHQ/ledger-live/commit/b866ea67bcbd408a33dbc9233ef55298e2a8ef25), [`add6026`](https://github.com/LedgerHQ/ledger-live/commit/add60262f879ec9288802a687f31fcc476b81ff9), [`263f6f5`](https://github.com/LedgerHQ/ledger-live/commit/263f6f5d4a5586adfff0e8a9c89de7e0276430d5), [`321a0e2`](https://github.com/LedgerHQ/ledger-live/commit/321a0e2ce948fac11f7bdf0e106eb0af57168caa), [`8bf2ba7`](https://github.com/LedgerHQ/ledger-live/commit/8bf2ba7039d42a8c50394e3ac10685be79698f91), [`7915844`](https://github.com/LedgerHQ/ledger-live/commit/7915844a237bfa98db947c42c8c0085a40840dd7), [`46b7bc6`](https://github.com/LedgerHQ/ledger-live/commit/46b7bc6c78f316c75feabb7172665b1c1a6b87e7), [`bc99a32`](https://github.com/LedgerHQ/ledger-live/commit/bc99a32703ac5b4a30de79c2eebac0f1936a7f83), [`5690acc`](https://github.com/LedgerHQ/ledger-live/commit/5690accdbdfd6939eb4e91f6b0b93e351cb33e5c), [`82a3565`](https://github.com/LedgerHQ/ledger-live/commit/82a35656fe999624004b7f166339433d024f1619), [`d308b1a`](https://github.com/LedgerHQ/ledger-live/commit/d308b1a6b9c629839f051cf367a527f4232120c7), [`8e645a0`](https://github.com/LedgerHQ/ledger-live/commit/8e645a06e3e5037812e920d462d51ae615bd6ae7), [`ab344cb`](https://github.com/LedgerHQ/ledger-live/commit/ab344cb9b820fd96fd36c04077cbbb34b7d765d5), [`a0106e4`](https://github.com/LedgerHQ/ledger-live/commit/a0106e4302776fccc0381125d4e5be4fee0e409b), [`8ddc772`](https://github.com/LedgerHQ/ledger-live/commit/8ddc772661cdfb9e89df3e7954532658dddf35ca), [`561b86b`](https://github.com/LedgerHQ/ledger-live/commit/561b86be1f972908ae950e362912519e3904917d), [`d0e4008`](https://github.com/LedgerHQ/ledger-live/commit/d0e40084a958eddb422954f37b8bbf406910d3c6), [`21e69fe`](https://github.com/LedgerHQ/ledger-live/commit/21e69fea49cffc0b1204903e539a64b83e4b28f0), [`e4f79db`](https://github.com/LedgerHQ/ledger-live/commit/e4f79dbd58b47a02f2cc8229f9fe2866f3c8dbec), [`4135055`](https://github.com/LedgerHQ/ledger-live/commit/4135055cd19e68b064f27454c536fcc5b047ffbb), [`537b277`](https://github.com/LedgerHQ/ledger-live/commit/537b277c998887dd762887f1102e50f9791c6152), [`8097fbc`](https://github.com/LedgerHQ/ledger-live/commit/8097fbc6d8bc422c42f74d92877bb5bed300a2e2), [`a22ac3e`](https://github.com/LedgerHQ/ledger-live/commit/a22ac3e225f7de60a6bc1906922a60080d1a8dcb), [`c323402`](https://github.com/LedgerHQ/ledger-live/commit/c3234025d77a1acefdbf57c7774f0d12bf34f63f), [`4daea73`](https://github.com/LedgerHQ/ledger-live/commit/4daea739d928bbd0c3c3c575ad97e30907acaeb5), [`9f50129`](https://github.com/LedgerHQ/ledger-live/commit/9f50129d6b4d7769524fcb6cd4f86bd0597418d6), [`772a16e`](https://github.com/LedgerHQ/ledger-live/commit/772a16eb188ac03fb9c3c509282ea58b7a840831), [`e6dc658`](https://github.com/LedgerHQ/ledger-live/commit/e6dc658b83ebd2102e19a1fead021443457c05d9), [`7f80800`](https://github.com/LedgerHQ/ledger-live/commit/7f80800b3949541e54a6000cfe9398844e23ccff), [`ef08282`](https://github.com/LedgerHQ/ledger-live/commit/ef08282513f27162b3ebc411315b29f6bd1a367d), [`05c7997`](https://github.com/LedgerHQ/ledger-live/commit/05c7997780ff8aa30ab7c16eb1e8a59563b44482), [`3fee08f`](https://github.com/LedgerHQ/ledger-live/commit/3fee08faa998082e23de114574920d0c6d1ea84d), [`02d837c`](https://github.com/LedgerHQ/ledger-live/commit/02d837c6cbb4387e3957eee11cc8b4512a70fe97), [`2d5ee2b`](https://github.com/LedgerHQ/ledger-live/commit/2d5ee2bc8380e1ec8e30f2818d234527b0f2b006), [`fb4d165`](https://github.com/LedgerHQ/ledger-live/commit/fb4d1656be8dc8e933e55600970a2e991fbaeebb), [`df992ba`](https://github.com/LedgerHQ/ledger-live/commit/df992ba149c629f70290506045e11944821874a5), [`b8800ee`](https://github.com/LedgerHQ/ledger-live/commit/b8800ee391b24bd878a2a5e8b86008b9f3142786), [`73bfe05`](https://github.com/LedgerHQ/ledger-live/commit/73bfe055ec23e0d630f2da9f4dbc9731b6fe5190)]:
  - @ledgerhq/live-common@34.71.0
  - @ledgerhq/types-live@6.107.0
  - @ledgerhq/coin-evm@3.6.0
  - @ledgerhq/coin-bitcoin@0.40.0
  - @ledgerhq/ledger-wallet-framework@1.4.0
  - @ledgerhq/coin-solana@0.52.0
  - @ledgerhq/live-env@2.34.0
  - @ledgerhq/errors@6.35.0
  - @ledgerhq/live-dmk-shared@0.23.0
  - @shared/schema-primitives@0.2.0
  - @ledgerhq/cryptoassets@13.47.0
  - @ledgerhq/live-wallet@0.25.3
  - @ledgerhq/hw-transport@6.35.2

## 0.3.0-next.1

### Patch Changes

- Updated dependencies [[`e6dc658`](https://github.com/LedgerHQ/ledger-live/commit/e6dc658b83ebd2102e19a1fead021443457c05d9)]:
  - @ledgerhq/cryptoassets@13.47.0-next.1
  - @ledgerhq/ledger-wallet-framework@1.4.0-next.1
  - @ledgerhq/live-common@34.71.0-next.1
  - @ledgerhq/coin-bitcoin@0.40.0-next.1
  - @ledgerhq/coin-evm@3.6.0-next.1
  - @ledgerhq/coin-solana@0.52.0-next.1
  - @ledgerhq/live-wallet@0.25.3-next.1

## 0.3.0-next.0

### Minor Changes

- [#16756](https://github.com/LedgerHQ/ledger-live/pull/16756) [`c36f57c`](https://github.com/LedgerHQ/ledger-live/commit/c36f57cc1b0ab17d2234beb5ab971cc3aa0babd0) Thanks [@Justkant](https://github.com/Justkant)! - Fix Windows WebUSB reconnect handling in wallet-cli

- [#16435](https://github.com/LedgerHQ/ledger-live/pull/16435) [`7d06007`](https://github.com/LedgerHQ/ledger-live/commit/7d06007c5ac3ba52551f7d602eb1dcd24759cb41) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Fix `send --dry-run` and `--rbf` boolean flag parsing; add `--data` option for EVM calldata

- [#16886](https://github.com/LedgerHQ/ledger-live/pull/16886) [`ce53342`](https://github.com/LedgerHQ/ledger-live/commit/ce53342114bded3d66f1b5668f03d4dcd81d8bce) Thanks [@Justkant](https://github.com/Justkant)! - Fix Windows WebUSB discovery when devices are connected after wallet-cli startup

- [#16881](https://github.com/LedgerHQ/ledger-live/pull/16881) [`c28ab41`](https://github.com/LedgerHQ/ledger-live/commit/c28ab4147ab73fec30bb9bb63df6d8d84f894410) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Fix Solana token send (e.g. USDC) crashing with "Resolution provided without a deviceModelId"

- [#16683](https://github.com/LedgerHQ/ledger-live/pull/16683) [`72ae5ec`](https://github.com/LedgerHQ/ledger-live/commit/72ae5ec62aa2457e99b2cb11444b8d7aeb1fc3b6) Thanks [@Justkant](https://github.com/Justkant)! - Improve wallet-cli device state handling and output consistency

- [#16906](https://github.com/LedgerHQ/ledger-live/pull/16906) [`da54ba3`](https://github.com/LedgerHQ/ledger-live/commit/da54ba3c89c7d83a49286d784b1abc27ba1bf32b) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - fix getQuote types

- [#16598](https://github.com/LedgerHQ/ledger-live/pull/16598) [`509e3fc`](https://github.com/LedgerHQ/ledger-live/commit/509e3fc04ccb3ecf9279c68c6c8d008b9473db21) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add session layer: `account discover` now persists found accounts to `~/.local/state/ledger-wallet-cli/session.yaml`. All `--account` flags accept session labels (e.g. `ethereum-1`) in addition to full descriptors. New `session view` and `session reset` commands.

### Patch Changes

- Updated dependencies [[`5ddf2f0`](https://github.com/LedgerHQ/ledger-live/commit/5ddf2f01fed8d74275aeeb292a7c5ec3e346af04), [`ec88011`](https://github.com/LedgerHQ/ledger-live/commit/ec88011f8ac95632d218e1a78ecfe93f7a4f20ab), [`53182fc`](https://github.com/LedgerHQ/ledger-live/commit/53182fc7a44263443775420afee4a12f29369870), [`ee83c6b`](https://github.com/LedgerHQ/ledger-live/commit/ee83c6bc4e0a449a7db517987a857c54b6b9c53c), [`ed0dc8a`](https://github.com/LedgerHQ/ledger-live/commit/ed0dc8abc2c8f5054e655c4e12efe6fb433fbaca), [`7b63096`](https://github.com/LedgerHQ/ledger-live/commit/7b630968f16eeb18f04d499441a23e5587e59137), [`2def56d`](https://github.com/LedgerHQ/ledger-live/commit/2def56d641c0d08f5b1c57d35b068c114faf7c24), [`4ddd97a`](https://github.com/LedgerHQ/ledger-live/commit/4ddd97a99bab5b581ad5ccfd36eb420ec4ee6352), [`7fafa10`](https://github.com/LedgerHQ/ledger-live/commit/7fafa10d8af581f4433a60ea908980a726d3a777), [`ac26c8b`](https://github.com/LedgerHQ/ledger-live/commit/ac26c8bffa9b5cc9f28bed5ce3d44e32982d655c), [`177494c`](https://github.com/LedgerHQ/ledger-live/commit/177494c5020375e49eaea26cead9cbbd14cd63be), [`fb79639`](https://github.com/LedgerHQ/ledger-live/commit/fb79639eb81258bae4830ed6ffe375ae625054ad), [`05b5ea0`](https://github.com/LedgerHQ/ledger-live/commit/05b5ea0579f0325c669805711b298f2eb0bd6434), [`e9886ec`](https://github.com/LedgerHQ/ledger-live/commit/e9886ec8f6a5835a745b4e3c25920cae4f1bb11f), [`054a8e8`](https://github.com/LedgerHQ/ledger-live/commit/054a8e8c7d4e1be511232a53a015d0bcc111e62e), [`aa867e1`](https://github.com/LedgerHQ/ledger-live/commit/aa867e1f5191569c13daf0261572ee0e976f58f2), [`78557fd`](https://github.com/LedgerHQ/ledger-live/commit/78557fdbee0b7c7702fc20d8a89ac62525c9aef7), [`0d11df6`](https://github.com/LedgerHQ/ledger-live/commit/0d11df6ef8dc781171071824ad1c39e3beed7730), [`5457ea4`](https://github.com/LedgerHQ/ledger-live/commit/5457ea4d13f10341403fdfec2d1fbef64cc14682), [`b866ea6`](https://github.com/LedgerHQ/ledger-live/commit/b866ea67bcbd408a33dbc9233ef55298e2a8ef25), [`add6026`](https://github.com/LedgerHQ/ledger-live/commit/add60262f879ec9288802a687f31fcc476b81ff9), [`263f6f5`](https://github.com/LedgerHQ/ledger-live/commit/263f6f5d4a5586adfff0e8a9c89de7e0276430d5), [`321a0e2`](https://github.com/LedgerHQ/ledger-live/commit/321a0e2ce948fac11f7bdf0e106eb0af57168caa), [`8bf2ba7`](https://github.com/LedgerHQ/ledger-live/commit/8bf2ba7039d42a8c50394e3ac10685be79698f91), [`7915844`](https://github.com/LedgerHQ/ledger-live/commit/7915844a237bfa98db947c42c8c0085a40840dd7), [`46b7bc6`](https://github.com/LedgerHQ/ledger-live/commit/46b7bc6c78f316c75feabb7172665b1c1a6b87e7), [`bc99a32`](https://github.com/LedgerHQ/ledger-live/commit/bc99a32703ac5b4a30de79c2eebac0f1936a7f83), [`5690acc`](https://github.com/LedgerHQ/ledger-live/commit/5690accdbdfd6939eb4e91f6b0b93e351cb33e5c), [`82a3565`](https://github.com/LedgerHQ/ledger-live/commit/82a35656fe999624004b7f166339433d024f1619), [`d308b1a`](https://github.com/LedgerHQ/ledger-live/commit/d308b1a6b9c629839f051cf367a527f4232120c7), [`8e645a0`](https://github.com/LedgerHQ/ledger-live/commit/8e645a06e3e5037812e920d462d51ae615bd6ae7), [`ab344cb`](https://github.com/LedgerHQ/ledger-live/commit/ab344cb9b820fd96fd36c04077cbbb34b7d765d5), [`a0106e4`](https://github.com/LedgerHQ/ledger-live/commit/a0106e4302776fccc0381125d4e5be4fee0e409b), [`8ddc772`](https://github.com/LedgerHQ/ledger-live/commit/8ddc772661cdfb9e89df3e7954532658dddf35ca), [`561b86b`](https://github.com/LedgerHQ/ledger-live/commit/561b86be1f972908ae950e362912519e3904917d), [`d0e4008`](https://github.com/LedgerHQ/ledger-live/commit/d0e40084a958eddb422954f37b8bbf406910d3c6), [`21e69fe`](https://github.com/LedgerHQ/ledger-live/commit/21e69fea49cffc0b1204903e539a64b83e4b28f0), [`e4f79db`](https://github.com/LedgerHQ/ledger-live/commit/e4f79dbd58b47a02f2cc8229f9fe2866f3c8dbec), [`4135055`](https://github.com/LedgerHQ/ledger-live/commit/4135055cd19e68b064f27454c536fcc5b047ffbb), [`537b277`](https://github.com/LedgerHQ/ledger-live/commit/537b277c998887dd762887f1102e50f9791c6152), [`8097fbc`](https://github.com/LedgerHQ/ledger-live/commit/8097fbc6d8bc422c42f74d92877bb5bed300a2e2), [`a22ac3e`](https://github.com/LedgerHQ/ledger-live/commit/a22ac3e225f7de60a6bc1906922a60080d1a8dcb), [`c323402`](https://github.com/LedgerHQ/ledger-live/commit/c3234025d77a1acefdbf57c7774f0d12bf34f63f), [`4daea73`](https://github.com/LedgerHQ/ledger-live/commit/4daea739d928bbd0c3c3c575ad97e30907acaeb5), [`9f50129`](https://github.com/LedgerHQ/ledger-live/commit/9f50129d6b4d7769524fcb6cd4f86bd0597418d6), [`772a16e`](https://github.com/LedgerHQ/ledger-live/commit/772a16eb188ac03fb9c3c509282ea58b7a840831), [`7f80800`](https://github.com/LedgerHQ/ledger-live/commit/7f80800b3949541e54a6000cfe9398844e23ccff), [`ef08282`](https://github.com/LedgerHQ/ledger-live/commit/ef08282513f27162b3ebc411315b29f6bd1a367d), [`05c7997`](https://github.com/LedgerHQ/ledger-live/commit/05c7997780ff8aa30ab7c16eb1e8a59563b44482), [`3fee08f`](https://github.com/LedgerHQ/ledger-live/commit/3fee08faa998082e23de114574920d0c6d1ea84d), [`02d837c`](https://github.com/LedgerHQ/ledger-live/commit/02d837c6cbb4387e3957eee11cc8b4512a70fe97), [`2d5ee2b`](https://github.com/LedgerHQ/ledger-live/commit/2d5ee2bc8380e1ec8e30f2818d234527b0f2b006), [`fb4d165`](https://github.com/LedgerHQ/ledger-live/commit/fb4d1656be8dc8e933e55600970a2e991fbaeebb), [`df992ba`](https://github.com/LedgerHQ/ledger-live/commit/df992ba149c629f70290506045e11944821874a5), [`b8800ee`](https://github.com/LedgerHQ/ledger-live/commit/b8800ee391b24bd878a2a5e8b86008b9f3142786), [`73bfe05`](https://github.com/LedgerHQ/ledger-live/commit/73bfe055ec23e0d630f2da9f4dbc9731b6fe5190)]:
  - @ledgerhq/live-common@34.71.0-next.0
  - @ledgerhq/types-live@6.107.0-next.0
  - @ledgerhq/coin-evm@3.6.0-next.0
  - @ledgerhq/coin-bitcoin@0.40.0-next.0
  - @ledgerhq/ledger-wallet-framework@1.4.0-next.0
  - @ledgerhq/coin-solana@0.52.0-next.0
  - @ledgerhq/live-env@2.34.0-next.0
  - @ledgerhq/errors@6.35.0-next.0
  - @ledgerhq/live-dmk-shared@0.23.0-next.0
  - @shared/schema-primitives@0.2.0-next.0
  - @ledgerhq/cryptoassets@13.47.0-next.0
  - @ledgerhq/live-wallet@0.25.3-next.0
  - @ledgerhq/hw-transport@6.35.2-next.0

## 0.2.1

### Patch Changes

- Updated dependencies [[`202cc42`](https://github.com/LedgerHQ/ledger-live/commit/202cc423b09662b5b25012b84124aecd4dc7245d)]:
  - @ledgerhq/errors@6.34.1
  - @ledgerhq/live-common@34.70.1
  - @ledgerhq/coin-bitcoin@0.39.1
  - @ledgerhq/coin-evm@3.5.1
  - @ledgerhq/coin-solana@0.51.2
  - @ledgerhq/ledger-wallet-framework@1.3.2
  - @ledgerhq/cryptoassets@13.46.2
  - @ledgerhq/hw-transport@6.35.2
  - @ledgerhq/live-wallet@0.25.3
  - @ledgerhq/live-dmk-shared@0.22.3

## 0.2.1-hotfix.0

### Patch Changes

- Updated dependencies [[`202cc42`](https://github.com/LedgerHQ/ledger-live/commit/202cc423b09662b5b25012b84124aecd4dc7245d)]:
  - @ledgerhq/errors@6.34.1-hotfix.0
  - @ledgerhq/live-common@34.70.1-hotfix.0
  - @ledgerhq/coin-bitcoin@0.39.1-hotfix.0
  - @ledgerhq/coin-evm@3.5.1-hotfix.0
  - @ledgerhq/coin-solana@0.51.2-hotfix.0
  - @ledgerhq/ledger-wallet-framework@1.3.2-hotfix.0
  - @ledgerhq/cryptoassets@13.46.2-hotfix.0
  - @ledgerhq/hw-transport@6.35.2-hotfix.0
  - @ledgerhq/live-wallet@0.25.3-hotfix.0
  - @ledgerhq/live-dmk-shared@0.22.3-hotfix.0

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->

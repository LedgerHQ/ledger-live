# @ledgerhq/wallet-cli

## 2.7.0

### Minor Changes

- [#21841](https://github.com/LedgerHQ/ledger-live/pull/21841) [`d59d123`](https://github.com/LedgerHQ/ledger-live/commit/d59d123a2ba037b44507b1f5424e31f05309ec26) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(cosmos): migrate account resources to shared staking aggregate

## 2.7.0-next.0

### Minor Changes

- [#21841](https://github.com/LedgerHQ/ledger-live/pull/21841) [`d59d123`](https://github.com/LedgerHQ/ledger-live/commit/d59d123a2ba037b44507b1f5424e31f05309ec26) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(cosmos): migrate account resources to shared staking aggregate

## 2.6.0

### Minor Changes

- [#21182](https://github.com/LedgerHQ/ledger-live/pull/21182) [`7d7c26e`](https://github.com/LedgerHQ/ledger-live/commit/7d7c26e546e470ada7e061bf2d3845c45b428b83) Thanks [@koda-apps](https://github.com/apps/koda-apps)! - Fix the embedded agent skill diverging from the copy published to `agent-skills`, and make the two artifacts share one transform.

  - `wallet-cli skill retrieve` no longer returns stale examples prefixed with `pnpm --silent wallet-cli start`. The canonical `SKILL.md` is authored for monorepo contributors; the standalone rewrite to plain `wallet-cli <command>` (already applied when syncing to `agent-skills`) was missing from the codegen that inlines the skill into the binary.
  - The embedded skill is now consistently named `wallet-cli-usage` — the name the published copy already used — across `skill list`, the manifest, `skill retrieve`, install directories and the `.wallet-cli-skill.json` sidecar, instead of the monorepo source's directory name.
  - `ledger-wallet-cli` keeps working as a lookup alias in `skill retrieve` and `skill install`, so previously documented commands don't break. It resolves to the canonical skill and never installs a second copy under the old name; `skill list` shows only `wallet-cli-usage`. `skill doctor` now reports a pre-rename install directory as superseded rather than ignoring it (it never deletes it).
  - The transform is implemented once in `scripts/standalone-skill-transform.mjs` and used by both the binary codegen and the `agent-skills` sync workflow, which previously duplicated it as a `sed` pipeline. It now asserts its own output — expected input markers present, nothing monorepo-only surviving — so a reworded source fails the build instead of silently shipping instructions a standalone user cannot follow.
  - Skill collection now refuses any symlink resolving outside the skills tree, in both the binary codegen and the `agent-skills` export, so a symlink committed inside a skill directory cannot pull unrelated repo content into a published artifact.

## 2.6.0-next.0

### Minor Changes

- [#21182](https://github.com/LedgerHQ/ledger-live/pull/21182) [`7d7c26e`](https://github.com/LedgerHQ/ledger-live/commit/7d7c26e546e470ada7e061bf2d3845c45b428b83) Thanks [@koda-apps](https://github.com/apps/koda-apps)! - Fix the embedded agent skill diverging from the copy published to `agent-skills`, and make the two artifacts share one transform.

  - `wallet-cli skill retrieve` no longer returns stale examples prefixed with `pnpm --silent wallet-cli start`. The canonical `SKILL.md` is authored for monorepo contributors; the standalone rewrite to plain `wallet-cli <command>` (already applied when syncing to `agent-skills`) was missing from the codegen that inlines the skill into the binary.
  - The embedded skill is now consistently named `wallet-cli-usage` — the name the published copy already used — across `skill list`, the manifest, `skill retrieve`, install directories and the `.wallet-cli-skill.json` sidecar, instead of the monorepo source's directory name.
  - `ledger-wallet-cli` keeps working as a lookup alias in `skill retrieve` and `skill install`, so previously documented commands don't break. It resolves to the canonical skill and never installs a second copy under the old name; `skill list` shows only `wallet-cli-usage`. `skill doctor` now reports a pre-rename install directory as superseded rather than ignoring it (it never deletes it).
  - The transform is implemented once in `scripts/standalone-skill-transform.mjs` and used by both the binary codegen and the `agent-skills` sync workflow, which previously duplicated it as a `sed` pipeline. It now asserts its own output — expected input markers present, nothing monorepo-only surviving — so a reworded source fails the build instead of silently shipping instructions a standalone user cannot follow.
  - Skill collection now refuses any symlink resolving outside the skills tree, in both the binary codegen and the `agent-skills` export, so a symlink committed inside a skill directory cannot pull unrelated repo content into a published artifact.

## 2.5.0

### Minor Changes

- [#20935](https://github.com/LedgerHQ/ledger-live/pull/20935) [`27388a8`](https://github.com/LedgerHQ/ledger-live/commit/27388a894eaac67b8e162a60f6d3368aad0a8682) Thanks [@dilaouid](https://github.com/dilaouid)! - Move Solana staking onto the generic `StakingResources` account attribute.

  **Breaking for `@ledgerhq/coin-solana`.** `SolanaResources`, `SolanaResourcesRaw`, `toSolanaResourcesRaw` and `fromSolanaResourcesRaw` are gone. `SolanaAccount` is now an alias of `StakingAccount`, so read staking data from `account.stakingResources` instead of `account.solanaResources`. A stake is a `StakingDelegation` or a `StakingUnbonding` (`SolanaStakingPosition`) rather than a `SolanaStake`: its stake account address is `positionId`, its validator is `validatorAddress`, and the former `activation.active` / `activation.inactive` / `withdrawable` fields are `activeAmount` / `inactiveAmount` / `withdrawableAmount`. `listSolanaStakingPositions`, `solanaActivationState` and `stakeActions` from `@ledgerhq/coin-solana/logic` cover the common access patterns. Accounts already persisted with a `solanaResources` blob are migrated on hydration, so no resync is needed.

  `@ledgerhq/types-live` gains `StakingPositionDetails`, mixed into `StakingDelegation` and `StakingUnbonding` for chains that materialize each position as its own on-chain account, plus `actionFeeReserve` on `StakingResources`. Both are optional, so other chains are unaffected.

  `@ledgerhq/wallet-cli`'s `earn positions` output changes shape: on `EarnSolanaStake`, `stakeBalance` and `withdrawable` go from `number` to an integer decimal string, so lamport amounts above `Number.MAX_SAFE_INTEGER` stay exact. Anything reading those two fields numerically needs updating.

  `@ledgerhq/ledger-wallet-framework` now exports the generic `StakingResources` serializer (`toStakingResourcesRaw`, `fromStakingResourcesRaw`, `assignStakingResourcesToAccountRaw`, `assignStakingResourcesFromAccountRaw`), moved out of the EVM family in `live-common` so every coin module can use it.

- [#21184](https://github.com/LedgerHQ/ledger-live/pull/21184) [`e2fb93a`](https://github.com/LedgerHQ/ledger-live/commit/e2fb93a55655d4741d645c8dfe9bb8eb3e3b8a9f) Thanks [@koda-apps](https://github.com/apps/koda-apps)! - Document the `send --data` flag in the wallet-cli skill and add a worked WETH wrap/unwrap example (`deposit()` / `withdraw(uint256)` selectors), so agents no longer need to hand-derive raw calldata for common contract calls.

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

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->

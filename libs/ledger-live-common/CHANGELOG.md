# @ledgerhq/live-common

## 37.2.0

### Minor Changes

- [#20278](https://github.com/LedgerHQ/ledger-live/pull/20278) [`3d24a89`](https://github.com/LedgerHQ/ledger-live/commit/3d24a898d59de55364ec29de29eaecb7ca14425d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop the `@ledgerhq/errors` dependency, completing the errors sunset (LIVE-32915).

  The `@ledgerhq/errors` package is removed from the monorepo: no workspace source imported it anymore, every error class it held now lives in the package that owns it (`@ledgerhq/ledger-wallet-framework/errors` for the ones shared across coin modules). `createCustomErrorClass` and the `serializeError` / `deserializeError` stack are gone with it — define errors as native classes and branch on `error.name`.

  `@ledgerhq/errors@6.37.0` stays on npm for external consumers, but is no longer published from this repo.

- [#20280](https://github.com/LedgerHQ/ledger-live/pull/20280) [`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Stop depending on `@ledgerhq/errors` (LIVE-32915).

  No workspace package declares it anymore, and none may again: `enforce-boundaries` now fails CI on any manifest that does. The classes it held live in the package that owns them, with `@ledgerhq/ledger-wallet-framework/errors` as the shared home below the coin layer.

  The package itself stays in the repo so it keeps being published for external consumers, and is bridged to the external coin packages that still peer-depend on it via `pnpm.packageExtensions` using `workspace:*` (which reuses the single in-repo copy, so the dependency graph keeps exactly the physical copies it had before). [LedgerHQ/coin-modules#752](https://github.com/LedgerHQ/coin-modules/pull/752) removes that peerDependency upstream; once it is released the bridge can be dropped, but the package still needs publishing.

- [#20580](https://github.com/LedgerHQ/ledger-live/pull/20580) [`9b3fb2a`](https://github.com/LedgerHQ/ledger-live/commit/9b3fb2a98eaa530c12e55eb3391f58a306c80d8f) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwm): update lwm init params new send flow recipient

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

- [#20627](https://github.com/LedgerHQ/ledger-live/pull/20627) [`7af726b`](https://github.com/LedgerHQ/ledger-live/commit/7af726b50eb7c8a2712bf734aac5618be61911ef) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Explain the higher network fees when sending to an address that does not exist yet. EIP-8037 charges account creation substantially more gas, and nothing in the send flow told the user why the fee jumped. The gas we send is unchanged: `eth_estimateGas` remains the only source.

- [#20646](https://github.com/LedgerHQ/ledger-live/pull/20646) [`fd7152a`](https://github.com/LedgerHQ/ledger-live/commit/fd7152a28ca7b11bf21edba822d8b4ede6e68d7c) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwd): add recipient contact card to the send flow

- [#20395](https://github.com/LedgerHQ/ledger-live/pull/20395) [`d614891`](https://github.com/LedgerHQ/ledger-live/commit/d614891593fe2ce794bd1e6dea8bfb69e89c775b) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(llc): add a deterministic account id derivation method for A4

- [#20216](https://github.com/LedgerHQ/ledger-live/pull/20216) [`593231c`](https://github.com/LedgerHQ/ledger-live/commit/593231c81f7f9cdf59b28aa8f88fe7b96752d758) Thanks [@semeano](https://github.com/semeano)! - Restrict the Zcash balance, operations and shielded send flow to the Ironwood pool only.

- [#20456](https://github.com/LedgerHQ/ledger-live/pull/20456) [`a0f13a2`](https://github.com/LedgerHQ/ledger-live/commit/a0f13a2b5410acc1e03231a94a5af9d77b6dabf6) Thanks [@sarneijim](https://github.com/sarneijim)! - Use fixed legacy onboarding date for backfill instead of app-open date

- [#19169](https://github.com/LedgerHQ/ledger-live/pull/19169) [`92b70ef`](https://github.com/LedgerHQ/ledger-live/commit/92b70ef6318741216740d7341f37627c32a3f0d6) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Preserve installed apps in Device Intent Executor last seen device info.

- [#20539](https://github.com/LedgerHQ/ledger-live/pull/20539) [`60b4626`](https://github.com/LedgerHQ/ledger-live/commit/60b462653bad19429c46ebef439ec2b5bb234140) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Scope `@ledgerhq/live-wallet` down to wallet sync only

  The package now exposes `./accounts` and `./walletSyncComposition` and nothing else.
  `ordering.ts` and `addAccounts.ts` move to `@ledgerhq/live-common/account/*`, and
  `accountRawToAccountUserData` joins `live-common/account/serialization` next to `fromAccountRaw`.
  The `liveqr/` folder is gone: `importAccounts.ts` and `accountToAccountData` were unreachable, and
  `accountDataToAccount` — whose only callers rehydrated a wallet-sync descriptor — becomes
  `accounts/descriptorToAccount`. `live-common` no longer depends on `live-wallet`.

- [#20527](https://github.com/LedgerHQ/ledger-live/pull/20527) [`28046d3`](https://github.com/LedgerHQ/ledger-live/commit/28046d31707d0290b56522c14b51623860b7a3f8) Thanks [@amaslakov](https://github.com/amaslakov)! - Add Internet Computer neuron staking hooks and narrow the ICP bridge account types

- [#20540](https://github.com/LedgerHQ/ledger-live/pull/20540) [`64bb8cf`](https://github.com/LedgerHQ/ledger-live/commit/64bb8cfa5bffde5a1e2c24615f1dd11b864094d2) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Move the dada-client platform layer (hooks, cache selectors, discovery and currency selection) into
  @features/platform-aggregated-assets, leaving re-export shims at the old paths so no consumer changes

- [#20643](https://github.com/LedgerHQ/ledger-live/pull/20643) [`bef9477`](https://github.com/LedgerHQ/ledger-live/commit/bef9477286ba11c0e7eed7af34c1ec7c95204cc9) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(send): validate custom fees against native balance for evm tokens

- [#18764](https://github.com/LedgerHQ/ledger-live/pull/18764) [`d266e13`](https://github.com/LedgerHQ/ledger-live/commit/d266e13aa8e8b34ca74beaa09687b6e8d426f821) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Migrate the swap `fetchQuotes` helper from axios to an RTK Query endpoint (`swapQuotesApi`). The aggregator `/quote` request now flows through the Redux data layer, and the rawQuotes/providerErrors split is unchanged. Desktop and mobile register the new API and inject their store dispatch at startup via `setSwapQuotesStore`; wallet-cli, which has no app store, sets up a standalone one.

  The endpoint itself now lives in the new `@domain/api-swap-quotes` package; live-common re-exports it, so existing call sites are unchanged.

  Two behaviour changes to be aware of:

  - `/quote` now goes through the authenticated base query, where the legacy axios call sent no credentials. Both apps already register an auth provider on their store's `extra`, so whether a request carries an `Authorization` header is controlled entirely by the `lwdAuth`/`lwmAuth` feature flags. They are disabled by default; enabling either one makes `/quote` send the user's bearer token to the aggregator, and makes a 401/403 trigger the adapter's refresh-and-retry.
  - An aggregator HTTP error (4xx/5xx) now resolves to an empty result, so the caller surfaces the `noQuotes` global. Previously the shared axios error interceptor turned these into `LedgerAPI4xx`/`LedgerAPI5xx`, which propagated to the live app as an error. Only transport failures (no HTTP response) still reject, now with a `SwapQuotesRequestFailed` error rather than a bare RTK Query error object.

- [#20297](https://github.com/LedgerHQ/ledger-live/pull/20297) [`7d5cd98`](https://github.com/LedgerHQ/ledger-live/commit/7d5cd9812a7827b3f1b926166a4a3fde20c7b59c) Thanks [@pawell24](https://github.com/pawell24)! - Add the NEAR coin-tester

- [#20296](https://github.com/LedgerHQ/ledger-live/pull/20296) [`cc9d58f`](https://github.com/LedgerHQ/ledger-live/commit/cc9d58f08ae38197ea2bd19115eda870d348f6aa) Thanks [@pawell24](https://github.com/pawell24)! - Expose the CoinModuleApi for NEAR (native asset and staking)

- [#20553](https://github.com/LedgerHQ/ledger-live/pull/20553) [`6be80d8`](https://github.com/LedgerHQ/ledger-live/commit/6be80d873a958544f4152348337aae8a0c0c2815) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - Extract Tezos and remove types-live dependency

- [#20431](https://github.com/LedgerHQ/ledger-live/pull/20431) [`0e439a0`](https://github.com/LedgerHQ/ledger-live/commit/0e439a0b73f1ad49aab32e98dfaf4fbd1d0ded04) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-evm): migrate EVM staking types from `@ledgerhq/types-live` to `@ledgerhq/coin-module-framework`; move staking helpers (mapDelegations, serialization) to ledger-live-common evm family

- [#20414](https://github.com/LedgerHQ/ledger-live/pull/20414) [`baba728`](https://github.com/LedgerHQ/ledger-live/commit/baba7280d4495fd1c6a80d18cb50412a21ec9a76) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwm): support bip21/eip681 amount in qr code scan new send flow

- [#20407](https://github.com/LedgerHQ/ledger-live/pull/20407) [`09c77c1`](https://github.com/LedgerHQ/ledger-live/commit/09c77c1814ddaad1265df5d52f4f6a336bc78ff1) Thanks [@amaslakov](https://github.com/amaslakov)! - Fix TON send flow hanging when the comment field is left empty

- [#20628](https://github.com/LedgerHQ/ledger-live/pull/20628) [`8259d4d`](https://github.com/LedgerHQ/ledger-live/commit/8259d4d1617e640e04441644947332936d9fbe81) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwdm): add matched contact lookup for the send recipient flow

- [#20345](https://github.com/LedgerHQ/ledger-live/pull/20345) [`bbfc8cf`](https://github.com/LedgerHQ/ledger-live/commit/bbfc8cf7929d9bffc1aa1b9a5e3b9593e3016436) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Move the dada-client domain layer into the aggregated-assets DDD packages, leaving re-export shims at the old paths so no consumer changes

- [#20430](https://github.com/LedgerHQ/ledger-live/pull/20430) [`647804e`](https://github.com/LedgerHQ/ledger-live/commit/647804ee755d54776e6b8cd96328bee89fb035e4) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Move the recent-addresses domain model and in-memory store into `@domain/entity-recent-addresses`

  `RecentAddress` and `RecentAddressesState` are no longer declared in `@ledgerhq/types-live`; they are now inferred from the Zod schemas in `@domain/entity-recent-addresses`, which also owns `RecentAddressesStore`, `setupRecentAddressesStore` and `getRecentAddressesStore`. Import them from `@domain/entity-recent-addresses`.

  `@ledgerhq/live-common/account/index` still re-exports the store API unchanged, minus the `RecentAddressesCache` alias — use `RecentAddressesState` instead.

  Also fixes the store mutating its own state in place: once a first mutation had been dispatched, immer had frozen that exact object graph, so the next `addAddress` or `removeAddress` on the same currency threw `TypeError: Cannot assign to read only property`. The store now replaces its state instead of mutating it.

- [#20375](https://github.com/LedgerHQ/ledger-live/pull/20375) [`6d45e7c`](https://github.com/LedgerHQ/ledger-live/commit/6d45e7c4245be9acaf2f3a86f48d38e5677d8e96) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - coinModuleApi init for Casper with base folders structure cleanup

- [#20468](https://github.com/LedgerHQ/ledger-live/pull/20468) [`da86f85`](https://github.com/LedgerHQ/ledger-live/commit/da86f85f2bb1cc94c413a94796e6735ba83eee52) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(llc): add hasAddressBook feature registry descriptor

- [#20111](https://github.com/LedgerHQ/ledger-live/pull/20111) [`aa3ea09`](https://github.com/LedgerHQ/ledger-live/commit/aa3ea0972205b589d2f92e352ac7154d11f872bc) Thanks [@YazhuEth](https://github.com/YazhuEth)! - chore(coin-solana): remove preload and hydrate - fetch validators on demand

  `CurrencyBridge.preload` / `hydrate` are deprecated, and preloading the validators.app
  list slowed down the scan account flow. Validators are now fetched lazily behind a 15min
  LRU cache (`@ledgerhq/coin-solana/validators`) the first time a screen needs them.

  `useSolanaPreloadData` is removed from `@ledgerhq/live-common/families/solana/react`; use
  `useValidators` instead. `getAccountBannerState` now takes the validators as a third argument.

- [#20425](https://github.com/LedgerHQ/ledger-live/pull/20425) [`aac9b34`](https://github.com/LedgerHQ/ledger-live/commit/aac9b34feb7a898e16fc98758046c0c3bc9fcbcb) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(llc): compute A4 account version

- [#20622](https://github.com/LedgerHQ/ledger-live/pull/20622) [`ed79527`](https://github.com/LedgerHQ/ledger-live/commit/ed79527dd83bb950dd6701d1677d6703cec6051c) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - Rename Hedera's `HederaValidator.nodeId` to `id` (string), matching the framework's `Validator.id` and removing the duplicate identity field. Preload caches persisted by earlier versions are migrated on hydration, so upgrading users keep their cached validators. On-chain protocol fields (`Transaction.stakingNodeId`, `HederaDelegation.nodeId`) are unchanged.

- [#19645](https://github.com/LedgerHQ/ledger-live/pull/19645) [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152) Thanks [@amaslakov](https://github.com/amaslakov)! - Add an optional `readiness` attribute to the base `Account` type (`{ ready: boolean; reason?: string }`), a generic cross-chain projection of whether an account is fully operational. It is persisted through account serialization and populated during sync via a new optional `BridgeApi.getAccountReadiness` hook. Tezos implements the hook: an account whose public key is not revealed on-chain is reported as `{ ready: false, reason: "unrevealed" }`. Families that do not provide the hook leave `readiness` undefined. coin-tezos `getAccountByAddress` now coalesces concurrent same-address calls into a single request, so surfacing readiness during sync adds no redundant tzkt call.

- [#20637](https://github.com/LedgerHQ/ledger-live/pull/20637) [`f440c85`](https://github.com/LedgerHQ/ledger-live/commit/f440c85eeb1669f3660ddbff18ae7892bb9f5923) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Retarget the remaining libs consumers and both store roots off the dada-client shims

- [#20194](https://github.com/LedgerHQ/ledger-live/pull/20194) [`fb1ba1b`](https://github.com/LedgerHQ/ledger-live/commit/fb1ba1b97d0e50d8780e678073d12faaab290722) Thanks [@CremaFR](https://github.com/CremaFR)! - Map the newer Uniswap Universal Router addresses (v2.0 and v2.1.1 on Ethereum mainnet) to the Uniswap provider so the swap terms of use / privacy policy resolve correctly for recent Uniswap swaps on both desktop and mobile.

- [#20019](https://github.com/LedgerHQ/ledger-live/pull/20019) [`135223e`](https://github.com/LedgerHQ/ledger-live/commit/135223e49d4d927183cf893f563ed583e18f3346) Thanks [@pawell24](https://github.com/pawell24)! - Make the VeChain chain tag configurable through the currency LiveConfig (`config_currency_vechain.chainTag`) instead of hardcoding mainnet. The value is read via a single `getChainTag()` helper that validates it to an integer single byte (0–255) and falls back to the mainnet tag (74) on an invalid remote override; live-common ships the mainnet tag as the production default. This lets the coin-tester drive a Thor solo network's generated genesis tag without patching the coin module.

- [#20019](https://github.com/LedgerHQ/ledger-live/pull/20019) [`4c9af42`](https://github.com/LedgerHQ/ledger-live/commit/4c9af429730f79e04d0f220f03b58565a5660e30) Thanks [@pawell24](https://github.com/pawell24)! - **Breaking change**: the Thor endpoint is now supplied through the coin config as `node.url` instead of being resolved inside the module from `@ledgerhq/live-env`.

  `coin-vechain` read its endpoint from `getEnv("API_VECHAIN_THOREST")` into a module-level constant. That made the package depend on `@ledgerhq/live-env`, which is a wallet-side concern and is unavailable in environments such as the standalone coin-service, and it froze the URL at import time, so a consumer had to set the environment before the module was ever loaded. The endpoint now travels on the currency config, as it already does in `coin-stellar` (`explorer.url`) and `coin-xrp` (`node.url`), and is read per call.

  `@ledgerhq/live-env` has been dropped from the package dependencies entirely.

  **What breaks**

  - `VechainCurrencyConfig` gains a required `node: { url: string }`.
  - `createBridges(signerContext, coinConfig)` no longer defaults its second argument; a config must be passed, so a missing endpoint fails loudly instead of silently pointing at mainnet.
  - `VECHAIN_NODE_URL` is no longer exported from `src/constants`. Use `getNodeUrl()` from `src/config`.

  **Migration**

  ```ts
  // before — endpoint came from the environment
  setEnv("API_VECHAIN_THOREST", "https://vechain.coin.ledger.com");
  const { accountBridge } = createBridges(signerContext);

  // after — endpoint is part of the config
  const { accountBridge } = createBridges(signerContext, () => ({
    status: { type: "active" },
    node: { url: "https://vechain.coin.ledger.com" },
  }));
  ```

  Ledger Live consumers need no change: `families/vechain/config.ts` fills `node.url` from `getEnv("API_VECHAIN_THOREST")`, so that environment override keeps working at the wallet layer, where `live-env` belongs.

- [#20435](https://github.com/LedgerHQ/ledger-live/pull/20435) [`e664d84`](https://github.com/LedgerHQ/ledger-live/commit/e664d84bc45a0bde9f4794c96d43e8a7eebb83b9) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - Casper folder structure cleanup part 2

### Patch Changes

- Updated dependencies [[`a3ef727`](https://github.com/LedgerHQ/ledger-live/commit/a3ef72734361f30f90704fda76e27a45a3afd9db), [`3d24a89`](https://github.com/LedgerHQ/ledger-live/commit/3d24a898d59de55364ec29de29eaecb7ca14425d), [`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add), [`d0d0802`](https://github.com/LedgerHQ/ledger-live/commit/d0d080296b51d28c7b3550c1af9652067767e8f3), [`8559d54`](https://github.com/LedgerHQ/ledger-live/commit/8559d54293b7854ea2dc900625bdb746720a4a85), [`f1e93f7`](https://github.com/LedgerHQ/ledger-live/commit/f1e93f79bedea0b6a2c140271769c37cf4e02407), [`cc8b5b9`](https://github.com/LedgerHQ/ledger-live/commit/cc8b5b9af4a2ec488b6912d3fcb08bcc8f4b72c3), [`4033c32`](https://github.com/LedgerHQ/ledger-live/commit/4033c32ae5ec08e4af5bdd08aeab0e395e558969), [`43bf6d8`](https://github.com/LedgerHQ/ledger-live/commit/43bf6d8f6600f70b7c2a85615660e7e150e798bf), [`fd3e81e`](https://github.com/LedgerHQ/ledger-live/commit/fd3e81e80eb5400e739e40e3ed360f40139d2aa4), [`7af726b`](https://github.com/LedgerHQ/ledger-live/commit/7af726b50eb7c8a2712bf734aac5618be61911ef), [`e5ec77b`](https://github.com/LedgerHQ/ledger-live/commit/e5ec77bf92a89c5f9a36a2e5901729e20682ead0), [`2ec3de4`](https://github.com/LedgerHQ/ledger-live/commit/2ec3de4f864bc7bccf02f42b04356bb563f9ed91), [`4d27e41`](https://github.com/LedgerHQ/ledger-live/commit/4d27e41c217cfae16526357a1a78db15c6980950), [`2f297f7`](https://github.com/LedgerHQ/ledger-live/commit/2f297f74dcda8113f86196ecd9c61e327f7981e9), [`04a4ea2`](https://github.com/LedgerHQ/ledger-live/commit/04a4ea23d789d334b0938637f49c08e5616b98c1), [`593231c`](https://github.com/LedgerHQ/ledger-live/commit/593231c81f7f9cdf59b28aa8f88fe7b96752d758), [`9e1412e`](https://github.com/LedgerHQ/ledger-live/commit/9e1412e08ccccd4af4a7078a797332ea92f86c63), [`aee0e64`](https://github.com/LedgerHQ/ledger-live/commit/aee0e64b491aafc1ca8fea16b1ef124cb183770b), [`9708010`](https://github.com/LedgerHQ/ledger-live/commit/970801044529fe978ccbb8c562cc64c00277d1de), [`ec0be9c`](https://github.com/LedgerHQ/ledger-live/commit/ec0be9c545259dd0dc2d2578dfabef3211f72e76), [`28046d3`](https://github.com/LedgerHQ/ledger-live/commit/28046d31707d0290b56522c14b51623860b7a3f8), [`64bb8cf`](https://github.com/LedgerHQ/ledger-live/commit/64bb8cfa5bffde5a1e2c24615f1dd11b864094d2), [`cc9d58f`](https://github.com/LedgerHQ/ledger-live/commit/cc9d58f08ae38197ea2bd19115eda870d348f6aa), [`0e439a0`](https://github.com/LedgerHQ/ledger-live/commit/0e439a0b73f1ad49aab32e98dfaf4fbd1d0ded04), [`09c77c1`](https://github.com/LedgerHQ/ledger-live/commit/09c77c1814ddaad1265df5d52f4f6a336bc78ff1), [`ac57e97`](https://github.com/LedgerHQ/ledger-live/commit/ac57e970074572eb99e989c8f5a1a6bd227c922b), [`bbfc8cf`](https://github.com/LedgerHQ/ledger-live/commit/bbfc8cf7929d9bffc1aa1b9a5e3b9593e3016436), [`5497b24`](https://github.com/LedgerHQ/ledger-live/commit/5497b244085b85297404b6ac90fac4432f7e8a67), [`6d45e7c`](https://github.com/LedgerHQ/ledger-live/commit/6d45e7c4245be9acaf2f3a86f48d38e5677d8e96), [`8a3a0bb`](https://github.com/LedgerHQ/ledger-live/commit/8a3a0bbd8361706daac364d4c89894f56431fc57), [`9ea6eed`](https://github.com/LedgerHQ/ledger-live/commit/9ea6eedc129c4d496ec745a6affeddb136d3680f), [`2e8b946`](https://github.com/LedgerHQ/ledger-live/commit/2e8b94664bb7b6aba049915cad35b51766874696), [`aa3ea09`](https://github.com/LedgerHQ/ledger-live/commit/aa3ea0972205b589d2f92e352ac7154d11f872bc), [`c9eab39`](https://github.com/LedgerHQ/ledger-live/commit/c9eab39bff1f46fc63c8717237390aa94fb78dec), [`ed79527`](https://github.com/LedgerHQ/ledger-live/commit/ed79527dd83bb950dd6701d1677d6703cec6051c), [`bdd82c4`](https://github.com/LedgerHQ/ledger-live/commit/bdd82c435d01d56397fe0967e92825f0442bf487), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152), [`02984f9`](https://github.com/LedgerHQ/ledger-live/commit/02984f92bb92144eba9452c892d6d9da870232d9), [`21dd56a`](https://github.com/LedgerHQ/ledger-live/commit/21dd56afd20f9c113f90697d9e76b37cde699716), [`135223e`](https://github.com/LedgerHQ/ledger-live/commit/135223e49d4d927183cf893f563ed583e18f3346), [`4c9af42`](https://github.com/LedgerHQ/ledger-live/commit/4c9af429730f79e04d0f220f03b58565a5660e30), [`b9d4a22`](https://github.com/LedgerHQ/ledger-live/commit/b9d4a2209b5fff587c67ea8868bcf553fcc4ecbd), [`79789ba`](https://github.com/LedgerHQ/ledger-live/commit/79789ba23f1105c033574ae8f8c552a3a757d74c), [`5171877`](https://github.com/LedgerHQ/ledger-live/commit/5171877faeb78ab9efbbf8c20b9fa6697e61872f), [`e664d84`](https://github.com/LedgerHQ/ledger-live/commit/e664d84bc45a0bde9f4794c96d43e8a7eebb83b9)]:
  - @ledgerhq/coin-tron@6.10.0
  - @ledgerhq/coin-aleo@1.22.0
  - @ledgerhq/coin-algorand@1.13.0
  - @ledgerhq/coin-aptos@3.27.0
  - @ledgerhq/coin-bitcoin@0.51.0
  - @ledgerhq/coin-canton@0.33.0
  - @ledgerhq/coin-cardano@0.34.0
  - @ledgerhq/coin-casper@2.19.0
  - @ledgerhq/coin-celo@2.13.0
  - @ledgerhq/coin-concordium@0.20.0
  - @ledgerhq/coin-cosmos@0.43.0
  - @ledgerhq/coin-evm@4.10.0
  - @ledgerhq/coin-filecoin@1.32.0
  - @ledgerhq/coin-hedera@1.42.0
  - @ledgerhq/coin-icon@0.29.0
  - @ledgerhq/coin-internet_computer@1.29.0
  - @ledgerhq/coin-kaspa@1.23.0
  - @ledgerhq/coin-mina@1.21.0
  - @ledgerhq/coin-multiversx@0.24.0
  - @ledgerhq/coin-near@0.31.0
  - @ledgerhq/coin-polkadot@6.34.0
  - @ledgerhq/coin-solana@0.62.0
  - @ledgerhq/coin-stacks@0.28.0
  - @ledgerhq/coin-sui@0.44.0
  - @ledgerhq/coin-ton@0.36.0
  - @ledgerhq/coin-vechain@3.0.0
  - @domain/entity-currency-crypto@0.10.0
  - @domain/entity-currency-token@0.4.0
  - @domain/entity-currency-fiat@0.4.0
  - @ledgerhq/coin-zcash@0.3.0
  - @domain/api-currency-token@0.4.0
  - @domain/api-swap-quotes@0.2.0
  - @domain/entity-account-name@0.2.0
  - @domain/entity-client-identity@0.2.0
  - @domain/entity-currency@0.4.0
  - @features/platform-aggregated-assets@0.3.0
  - @features/platform-env@0.2.0
  - @shared/feature-flags@0.18.0
  - @ledgerhq/hw-app-exchange@0.25.0
  - @ledgerhq/ledger-wallet-framework@2.8.0
  - @ledgerhq/live-signer-zcash@0.9.0
  - @domain/api-aggregated-assets@0.3.0
  - @domain/entity-interest-rate@0.3.0
  - @domain/entity-aggregated-asset@0.3.0
  - @ledgerhq/live-dmk-shared@0.30.0
  - @ledgerhq/asset-aggregation@0.13.0
  - @ledgerhq/live-signer-aleo@0.19.6
  - @ledgerhq/live-signer-canton@0.9.15
  - @ledgerhq/live-signer-celo@1.2.2
  - @ledgerhq/live-signer-concordium@0.6.5
  - @ledgerhq/live-signer-cosmos@0.4.5
  - @ledgerhq/live-signer-icp@0.1.1
  - @ledgerhq/live-signer-solana@0.19.1
  - @ledgerhq/live-currency-format@0.14.1
  - @ledgerhq/wallet-btc@0.3.0
  - @domain/entity-recent-addresses@0.1.1
  - @features/platform-feature-flags@0.6.5
  - @ledgerhq/device-core@0.11.11
  - @ledgerhq/domain-service@1.8.14
  - @ledgerhq/evm-tools@1.13.2
  - @ledgerhq/hw-app-eth@7.8.14
  - @ledgerhq/live-countervalues@0.24.2
  - @ledgerhq/live-countervalues-react@0.16.6
  - @ledgerhq/live-signer-evm@0.22.2
  - @ledgerhq/device-intent@5.0.0

## 37.2.0-next.0

### Minor Changes

- [#20278](https://github.com/LedgerHQ/ledger-live/pull/20278) [`3d24a89`](https://github.com/LedgerHQ/ledger-live/commit/3d24a898d59de55364ec29de29eaecb7ca14425d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop the `@ledgerhq/errors` dependency, completing the errors sunset (LIVE-32915).

  The `@ledgerhq/errors` package is removed from the monorepo: no workspace source imported it anymore, every error class it held now lives in the package that owns it (`@ledgerhq/ledger-wallet-framework/errors` for the ones shared across coin modules). `createCustomErrorClass` and the `serializeError` / `deserializeError` stack are gone with it — define errors as native classes and branch on `error.name`.

  `@ledgerhq/errors@6.37.0` stays on npm for external consumers, but is no longer published from this repo.

- [#20280](https://github.com/LedgerHQ/ledger-live/pull/20280) [`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Stop depending on `@ledgerhq/errors` (LIVE-32915).

  No workspace package declares it anymore, and none may again: `enforce-boundaries` now fails CI on any manifest that does. The classes it held live in the package that owns them, with `@ledgerhq/ledger-wallet-framework/errors` as the shared home below the coin layer.

  The package itself stays in the repo so it keeps being published for external consumers, and is bridged to the external coin packages that still peer-depend on it via `pnpm.packageExtensions` using `workspace:*` (which reuses the single in-repo copy, so the dependency graph keeps exactly the physical copies it had before). [LedgerHQ/coin-modules#752](https://github.com/LedgerHQ/coin-modules/pull/752) removes that peerDependency upstream; once it is released the bridge can be dropped, but the package still needs publishing.

- [#20580](https://github.com/LedgerHQ/ledger-live/pull/20580) [`9b3fb2a`](https://github.com/LedgerHQ/ledger-live/commit/9b3fb2a98eaa530c12e55eb3391f58a306c80d8f) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwm): update lwm init params new send flow recipient

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

- [#20627](https://github.com/LedgerHQ/ledger-live/pull/20627) [`7af726b`](https://github.com/LedgerHQ/ledger-live/commit/7af726b50eb7c8a2712bf734aac5618be61911ef) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Explain the higher network fees when sending to an address that does not exist yet. EIP-8037 charges account creation substantially more gas, and nothing in the send flow told the user why the fee jumped. The gas we send is unchanged: `eth_estimateGas` remains the only source.

- [#20646](https://github.com/LedgerHQ/ledger-live/pull/20646) [`fd7152a`](https://github.com/LedgerHQ/ledger-live/commit/fd7152a28ca7b11bf21edba822d8b4ede6e68d7c) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwd): add recipient contact card to the send flow

- [#20395](https://github.com/LedgerHQ/ledger-live/pull/20395) [`d614891`](https://github.com/LedgerHQ/ledger-live/commit/d614891593fe2ce794bd1e6dea8bfb69e89c775b) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(llc): add a deterministic account id derivation method for A4

- [#20216](https://github.com/LedgerHQ/ledger-live/pull/20216) [`593231c`](https://github.com/LedgerHQ/ledger-live/commit/593231c81f7f9cdf59b28aa8f88fe7b96752d758) Thanks [@semeano](https://github.com/semeano)! - Restrict the Zcash balance, operations and shielded send flow to the Ironwood pool only.

- [#20456](https://github.com/LedgerHQ/ledger-live/pull/20456) [`a0f13a2`](https://github.com/LedgerHQ/ledger-live/commit/a0f13a2b5410acc1e03231a94a5af9d77b6dabf6) Thanks [@sarneijim](https://github.com/sarneijim)! - Use fixed legacy onboarding date for backfill instead of app-open date

- [#19169](https://github.com/LedgerHQ/ledger-live/pull/19169) [`92b70ef`](https://github.com/LedgerHQ/ledger-live/commit/92b70ef6318741216740d7341f37627c32a3f0d6) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Preserve installed apps in Device Intent Executor last seen device info.

- [#20539](https://github.com/LedgerHQ/ledger-live/pull/20539) [`60b4626`](https://github.com/LedgerHQ/ledger-live/commit/60b462653bad19429c46ebef439ec2b5bb234140) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Scope `@ledgerhq/live-wallet` down to wallet sync only

  The package now exposes `./accounts` and `./walletSyncComposition` and nothing else.
  `ordering.ts` and `addAccounts.ts` move to `@ledgerhq/live-common/account/*`, and
  `accountRawToAccountUserData` joins `live-common/account/serialization` next to `fromAccountRaw`.
  The `liveqr/` folder is gone: `importAccounts.ts` and `accountToAccountData` were unreachable, and
  `accountDataToAccount` — whose only callers rehydrated a wallet-sync descriptor — becomes
  `accounts/descriptorToAccount`. `live-common` no longer depends on `live-wallet`.

- [#20527](https://github.com/LedgerHQ/ledger-live/pull/20527) [`28046d3`](https://github.com/LedgerHQ/ledger-live/commit/28046d31707d0290b56522c14b51623860b7a3f8) Thanks [@amaslakov](https://github.com/amaslakov)! - Add Internet Computer neuron staking hooks and narrow the ICP bridge account types

- [#20540](https://github.com/LedgerHQ/ledger-live/pull/20540) [`64bb8cf`](https://github.com/LedgerHQ/ledger-live/commit/64bb8cfa5bffde5a1e2c24615f1dd11b864094d2) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Move the dada-client platform layer (hooks, cache selectors, discovery and currency selection) into
  @features/platform-aggregated-assets, leaving re-export shims at the old paths so no consumer changes

- [#20643](https://github.com/LedgerHQ/ledger-live/pull/20643) [`bef9477`](https://github.com/LedgerHQ/ledger-live/commit/bef9477286ba11c0e7eed7af34c1ec7c95204cc9) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(send): validate custom fees against native balance for evm tokens

- [#18764](https://github.com/LedgerHQ/ledger-live/pull/18764) [`d266e13`](https://github.com/LedgerHQ/ledger-live/commit/d266e13aa8e8b34ca74beaa09687b6e8d426f821) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Migrate the swap `fetchQuotes` helper from axios to an RTK Query endpoint (`swapQuotesApi`). The aggregator `/quote` request now flows through the Redux data layer, and the rawQuotes/providerErrors split is unchanged. Desktop and mobile register the new API and inject their store dispatch at startup via `setSwapQuotesStore`; wallet-cli, which has no app store, sets up a standalone one.

  The endpoint itself now lives in the new `@domain/api-swap-quotes` package; live-common re-exports it, so existing call sites are unchanged.

  Two behaviour changes to be aware of:

  - `/quote` now goes through the authenticated base query, where the legacy axios call sent no credentials. Both apps already register an auth provider on their store's `extra`, so whether a request carries an `Authorization` header is controlled entirely by the `lwdAuth`/`lwmAuth` feature flags. They are disabled by default; enabling either one makes `/quote` send the user's bearer token to the aggregator, and makes a 401/403 trigger the adapter's refresh-and-retry.
  - An aggregator HTTP error (4xx/5xx) now resolves to an empty result, so the caller surfaces the `noQuotes` global. Previously the shared axios error interceptor turned these into `LedgerAPI4xx`/`LedgerAPI5xx`, which propagated to the live app as an error. Only transport failures (no HTTP response) still reject, now with a `SwapQuotesRequestFailed` error rather than a bare RTK Query error object.

- [#20297](https://github.com/LedgerHQ/ledger-live/pull/20297) [`7d5cd98`](https://github.com/LedgerHQ/ledger-live/commit/7d5cd9812a7827b3f1b926166a4a3fde20c7b59c) Thanks [@pawell24](https://github.com/pawell24)! - Add the NEAR coin-tester

- [#20296](https://github.com/LedgerHQ/ledger-live/pull/20296) [`cc9d58f`](https://github.com/LedgerHQ/ledger-live/commit/cc9d58f08ae38197ea2bd19115eda870d348f6aa) Thanks [@pawell24](https://github.com/pawell24)! - Expose the CoinModuleApi for NEAR (native asset and staking)

- [#20553](https://github.com/LedgerHQ/ledger-live/pull/20553) [`6be80d8`](https://github.com/LedgerHQ/ledger-live/commit/6be80d873a958544f4152348337aae8a0c0c2815) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - Extract Tezos and remove types-live dependency

- [#20431](https://github.com/LedgerHQ/ledger-live/pull/20431) [`0e439a0`](https://github.com/LedgerHQ/ledger-live/commit/0e439a0b73f1ad49aab32e98dfaf4fbd1d0ded04) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-evm): migrate EVM staking types from `@ledgerhq/types-live` to `@ledgerhq/coin-module-framework`; move staking helpers (mapDelegations, serialization) to ledger-live-common evm family

- [#20414](https://github.com/LedgerHQ/ledger-live/pull/20414) [`baba728`](https://github.com/LedgerHQ/ledger-live/commit/baba7280d4495fd1c6a80d18cb50412a21ec9a76) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwm): support bip21/eip681 amount in qr code scan new send flow

- [#20407](https://github.com/LedgerHQ/ledger-live/pull/20407) [`09c77c1`](https://github.com/LedgerHQ/ledger-live/commit/09c77c1814ddaad1265df5d52f4f6a336bc78ff1) Thanks [@amaslakov](https://github.com/amaslakov)! - Fix TON send flow hanging when the comment field is left empty

- [#20628](https://github.com/LedgerHQ/ledger-live/pull/20628) [`8259d4d`](https://github.com/LedgerHQ/ledger-live/commit/8259d4d1617e640e04441644947332936d9fbe81) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwdm): add matched contact lookup for the send recipient flow

- [#20345](https://github.com/LedgerHQ/ledger-live/pull/20345) [`bbfc8cf`](https://github.com/LedgerHQ/ledger-live/commit/bbfc8cf7929d9bffc1aa1b9a5e3b9593e3016436) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Move the dada-client domain layer into the aggregated-assets DDD packages, leaving re-export shims at the old paths so no consumer changes

- [#20430](https://github.com/LedgerHQ/ledger-live/pull/20430) [`647804e`](https://github.com/LedgerHQ/ledger-live/commit/647804ee755d54776e6b8cd96328bee89fb035e4) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Move the recent-addresses domain model and in-memory store into `@domain/entity-recent-addresses`

  `RecentAddress` and `RecentAddressesState` are no longer declared in `@ledgerhq/types-live`; they are now inferred from the Zod schemas in `@domain/entity-recent-addresses`, which also owns `RecentAddressesStore`, `setupRecentAddressesStore` and `getRecentAddressesStore`. Import them from `@domain/entity-recent-addresses`.

  `@ledgerhq/live-common/account/index` still re-exports the store API unchanged, minus the `RecentAddressesCache` alias — use `RecentAddressesState` instead.

  Also fixes the store mutating its own state in place: once a first mutation had been dispatched, immer had frozen that exact object graph, so the next `addAddress` or `removeAddress` on the same currency threw `TypeError: Cannot assign to read only property`. The store now replaces its state instead of mutating it.

- [#20375](https://github.com/LedgerHQ/ledger-live/pull/20375) [`6d45e7c`](https://github.com/LedgerHQ/ledger-live/commit/6d45e7c4245be9acaf2f3a86f48d38e5677d8e96) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - coinModuleApi init for Casper with base folders structure cleanup

- [#20468](https://github.com/LedgerHQ/ledger-live/pull/20468) [`da86f85`](https://github.com/LedgerHQ/ledger-live/commit/da86f85f2bb1cc94c413a94796e6735ba83eee52) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(llc): add hasAddressBook feature registry descriptor

- [#20111](https://github.com/LedgerHQ/ledger-live/pull/20111) [`aa3ea09`](https://github.com/LedgerHQ/ledger-live/commit/aa3ea0972205b589d2f92e352ac7154d11f872bc) Thanks [@YazhuEth](https://github.com/YazhuEth)! - chore(coin-solana): remove preload and hydrate - fetch validators on demand

  `CurrencyBridge.preload` / `hydrate` are deprecated, and preloading the validators.app
  list slowed down the scan account flow. Validators are now fetched lazily behind a 15min
  LRU cache (`@ledgerhq/coin-solana/validators`) the first time a screen needs them.

  `useSolanaPreloadData` is removed from `@ledgerhq/live-common/families/solana/react`; use
  `useValidators` instead. `getAccountBannerState` now takes the validators as a third argument.

- [#20425](https://github.com/LedgerHQ/ledger-live/pull/20425) [`aac9b34`](https://github.com/LedgerHQ/ledger-live/commit/aac9b34feb7a898e16fc98758046c0c3bc9fcbcb) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(llc): compute A4 account version

- [#20622](https://github.com/LedgerHQ/ledger-live/pull/20622) [`ed79527`](https://github.com/LedgerHQ/ledger-live/commit/ed79527dd83bb950dd6701d1677d6703cec6051c) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - Rename Hedera's `HederaValidator.nodeId` to `id` (string), matching the framework's `Validator.id` and removing the duplicate identity field. Preload caches persisted by earlier versions are migrated on hydration, so upgrading users keep their cached validators. On-chain protocol fields (`Transaction.stakingNodeId`, `HederaDelegation.nodeId`) are unchanged.

- [#19645](https://github.com/LedgerHQ/ledger-live/pull/19645) [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152) Thanks [@amaslakov](https://github.com/amaslakov)! - Add an optional `readiness` attribute to the base `Account` type (`{ ready: boolean; reason?: string }`), a generic cross-chain projection of whether an account is fully operational. It is persisted through account serialization and populated during sync via a new optional `BridgeApi.getAccountReadiness` hook. Tezos implements the hook: an account whose public key is not revealed on-chain is reported as `{ ready: false, reason: "unrevealed" }`. Families that do not provide the hook leave `readiness` undefined. coin-tezos `getAccountByAddress` now coalesces concurrent same-address calls into a single request, so surfacing readiness during sync adds no redundant tzkt call.

- [#20637](https://github.com/LedgerHQ/ledger-live/pull/20637) [`f440c85`](https://github.com/LedgerHQ/ledger-live/commit/f440c85eeb1669f3660ddbff18ae7892bb9f5923) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Retarget the remaining libs consumers and both store roots off the dada-client shims

- [#20194](https://github.com/LedgerHQ/ledger-live/pull/20194) [`fb1ba1b`](https://github.com/LedgerHQ/ledger-live/commit/fb1ba1b97d0e50d8780e678073d12faaab290722) Thanks [@CremaFR](https://github.com/CremaFR)! - Map the newer Uniswap Universal Router addresses (v2.0 and v2.1.1 on Ethereum mainnet) to the Uniswap provider so the swap terms of use / privacy policy resolve correctly for recent Uniswap swaps on both desktop and mobile.

- [#20019](https://github.com/LedgerHQ/ledger-live/pull/20019) [`135223e`](https://github.com/LedgerHQ/ledger-live/commit/135223e49d4d927183cf893f563ed583e18f3346) Thanks [@pawell24](https://github.com/pawell24)! - Make the VeChain chain tag configurable through the currency LiveConfig (`config_currency_vechain.chainTag`) instead of hardcoding mainnet. The value is read via a single `getChainTag()` helper that validates it to an integer single byte (0–255) and falls back to the mainnet tag (74) on an invalid remote override; live-common ships the mainnet tag as the production default. This lets the coin-tester drive a Thor solo network's generated genesis tag without patching the coin module.

- [#20019](https://github.com/LedgerHQ/ledger-live/pull/20019) [`4c9af42`](https://github.com/LedgerHQ/ledger-live/commit/4c9af429730f79e04d0f220f03b58565a5660e30) Thanks [@pawell24](https://github.com/pawell24)! - **Breaking change**: the Thor endpoint is now supplied through the coin config as `node.url` instead of being resolved inside the module from `@ledgerhq/live-env`.

  `coin-vechain` read its endpoint from `getEnv("API_VECHAIN_THOREST")` into a module-level constant. That made the package depend on `@ledgerhq/live-env`, which is a wallet-side concern and is unavailable in environments such as the standalone coin-service, and it froze the URL at import time, so a consumer had to set the environment before the module was ever loaded. The endpoint now travels on the currency config, as it already does in `coin-stellar` (`explorer.url`) and `coin-xrp` (`node.url`), and is read per call.

  `@ledgerhq/live-env` has been dropped from the package dependencies entirely.

  **What breaks**

  - `VechainCurrencyConfig` gains a required `node: { url: string }`.
  - `createBridges(signerContext, coinConfig)` no longer defaults its second argument; a config must be passed, so a missing endpoint fails loudly instead of silently pointing at mainnet.
  - `VECHAIN_NODE_URL` is no longer exported from `src/constants`. Use `getNodeUrl()` from `src/config`.

  **Migration**

  ```ts
  // before — endpoint came from the environment
  setEnv("API_VECHAIN_THOREST", "https://vechain.coin.ledger.com");
  const { accountBridge } = createBridges(signerContext);

  // after — endpoint is part of the config
  const { accountBridge } = createBridges(signerContext, () => ({
    status: { type: "active" },
    node: { url: "https://vechain.coin.ledger.com" },
  }));
  ```

  Ledger Live consumers need no change: `families/vechain/config.ts` fills `node.url` from `getEnv("API_VECHAIN_THOREST")`, so that environment override keeps working at the wallet layer, where `live-env` belongs.

- [#20435](https://github.com/LedgerHQ/ledger-live/pull/20435) [`e664d84`](https://github.com/LedgerHQ/ledger-live/commit/e664d84bc45a0bde9f4794c96d43e8a7eebb83b9) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - Casper folder structure cleanup part 2

### Patch Changes

- Updated dependencies [[`a3ef727`](https://github.com/LedgerHQ/ledger-live/commit/a3ef72734361f30f90704fda76e27a45a3afd9db), [`3d24a89`](https://github.com/LedgerHQ/ledger-live/commit/3d24a898d59de55364ec29de29eaecb7ca14425d), [`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add), [`d0d0802`](https://github.com/LedgerHQ/ledger-live/commit/d0d080296b51d28c7b3550c1af9652067767e8f3), [`8559d54`](https://github.com/LedgerHQ/ledger-live/commit/8559d54293b7854ea2dc900625bdb746720a4a85), [`f1e93f7`](https://github.com/LedgerHQ/ledger-live/commit/f1e93f79bedea0b6a2c140271769c37cf4e02407), [`cc8b5b9`](https://github.com/LedgerHQ/ledger-live/commit/cc8b5b9af4a2ec488b6912d3fcb08bcc8f4b72c3), [`4033c32`](https://github.com/LedgerHQ/ledger-live/commit/4033c32ae5ec08e4af5bdd08aeab0e395e558969), [`43bf6d8`](https://github.com/LedgerHQ/ledger-live/commit/43bf6d8f6600f70b7c2a85615660e7e150e798bf), [`fd3e81e`](https://github.com/LedgerHQ/ledger-live/commit/fd3e81e80eb5400e739e40e3ed360f40139d2aa4), [`7af726b`](https://github.com/LedgerHQ/ledger-live/commit/7af726b50eb7c8a2712bf734aac5618be61911ef), [`e5ec77b`](https://github.com/LedgerHQ/ledger-live/commit/e5ec77bf92a89c5f9a36a2e5901729e20682ead0), [`2ec3de4`](https://github.com/LedgerHQ/ledger-live/commit/2ec3de4f864bc7bccf02f42b04356bb563f9ed91), [`4d27e41`](https://github.com/LedgerHQ/ledger-live/commit/4d27e41c217cfae16526357a1a78db15c6980950), [`2f297f7`](https://github.com/LedgerHQ/ledger-live/commit/2f297f74dcda8113f86196ecd9c61e327f7981e9), [`04a4ea2`](https://github.com/LedgerHQ/ledger-live/commit/04a4ea23d789d334b0938637f49c08e5616b98c1), [`593231c`](https://github.com/LedgerHQ/ledger-live/commit/593231c81f7f9cdf59b28aa8f88fe7b96752d758), [`9e1412e`](https://github.com/LedgerHQ/ledger-live/commit/9e1412e08ccccd4af4a7078a797332ea92f86c63), [`aee0e64`](https://github.com/LedgerHQ/ledger-live/commit/aee0e64b491aafc1ca8fea16b1ef124cb183770b), [`9708010`](https://github.com/LedgerHQ/ledger-live/commit/970801044529fe978ccbb8c562cc64c00277d1de), [`ec0be9c`](https://github.com/LedgerHQ/ledger-live/commit/ec0be9c545259dd0dc2d2578dfabef3211f72e76), [`28046d3`](https://github.com/LedgerHQ/ledger-live/commit/28046d31707d0290b56522c14b51623860b7a3f8), [`64bb8cf`](https://github.com/LedgerHQ/ledger-live/commit/64bb8cfa5bffde5a1e2c24615f1dd11b864094d2), [`cc9d58f`](https://github.com/LedgerHQ/ledger-live/commit/cc9d58f08ae38197ea2bd19115eda870d348f6aa), [`0e439a0`](https://github.com/LedgerHQ/ledger-live/commit/0e439a0b73f1ad49aab32e98dfaf4fbd1d0ded04), [`09c77c1`](https://github.com/LedgerHQ/ledger-live/commit/09c77c1814ddaad1265df5d52f4f6a336bc78ff1), [`ac57e97`](https://github.com/LedgerHQ/ledger-live/commit/ac57e970074572eb99e989c8f5a1a6bd227c922b), [`bbfc8cf`](https://github.com/LedgerHQ/ledger-live/commit/bbfc8cf7929d9bffc1aa1b9a5e3b9593e3016436), [`5497b24`](https://github.com/LedgerHQ/ledger-live/commit/5497b244085b85297404b6ac90fac4432f7e8a67), [`6d45e7c`](https://github.com/LedgerHQ/ledger-live/commit/6d45e7c4245be9acaf2f3a86f48d38e5677d8e96), [`8a3a0bb`](https://github.com/LedgerHQ/ledger-live/commit/8a3a0bbd8361706daac364d4c89894f56431fc57), [`9ea6eed`](https://github.com/LedgerHQ/ledger-live/commit/9ea6eedc129c4d496ec745a6affeddb136d3680f), [`2e8b946`](https://github.com/LedgerHQ/ledger-live/commit/2e8b94664bb7b6aba049915cad35b51766874696), [`aa3ea09`](https://github.com/LedgerHQ/ledger-live/commit/aa3ea0972205b589d2f92e352ac7154d11f872bc), [`c9eab39`](https://github.com/LedgerHQ/ledger-live/commit/c9eab39bff1f46fc63c8717237390aa94fb78dec), [`ed79527`](https://github.com/LedgerHQ/ledger-live/commit/ed79527dd83bb950dd6701d1677d6703cec6051c), [`bdd82c4`](https://github.com/LedgerHQ/ledger-live/commit/bdd82c435d01d56397fe0967e92825f0442bf487), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152), [`02984f9`](https://github.com/LedgerHQ/ledger-live/commit/02984f92bb92144eba9452c892d6d9da870232d9), [`21dd56a`](https://github.com/LedgerHQ/ledger-live/commit/21dd56afd20f9c113f90697d9e76b37cde699716), [`135223e`](https://github.com/LedgerHQ/ledger-live/commit/135223e49d4d927183cf893f563ed583e18f3346), [`4c9af42`](https://github.com/LedgerHQ/ledger-live/commit/4c9af429730f79e04d0f220f03b58565a5660e30), [`b9d4a22`](https://github.com/LedgerHQ/ledger-live/commit/b9d4a2209b5fff587c67ea8868bcf553fcc4ecbd), [`79789ba`](https://github.com/LedgerHQ/ledger-live/commit/79789ba23f1105c033574ae8f8c552a3a757d74c), [`5171877`](https://github.com/LedgerHQ/ledger-live/commit/5171877faeb78ab9efbbf8c20b9fa6697e61872f), [`e664d84`](https://github.com/LedgerHQ/ledger-live/commit/e664d84bc45a0bde9f4794c96d43e8a7eebb83b9)]:
  - @ledgerhq/coin-tron@6.10.0-next.0
  - @ledgerhq/coin-aleo@1.22.0-next.0
  - @ledgerhq/coin-algorand@1.13.0-next.0
  - @ledgerhq/coin-aptos@3.27.0-next.0
  - @ledgerhq/coin-bitcoin@0.51.0-next.0
  - @ledgerhq/coin-canton@0.33.0-next.0
  - @ledgerhq/coin-cardano@0.34.0-next.0
  - @ledgerhq/coin-casper@2.19.0-next.0
  - @ledgerhq/coin-celo@2.13.0-next.0
  - @ledgerhq/coin-concordium@0.20.0-next.0
  - @ledgerhq/coin-cosmos@0.43.0-next.0
  - @ledgerhq/coin-evm@4.10.0-next.0
  - @ledgerhq/coin-filecoin@1.32.0-next.0
  - @ledgerhq/coin-hedera@1.42.0-next.0
  - @ledgerhq/coin-icon@0.29.0-next.0
  - @ledgerhq/coin-internet_computer@1.29.0-next.0
  - @ledgerhq/coin-kaspa@1.23.0-next.0
  - @ledgerhq/coin-mina@1.21.0-next.0
  - @ledgerhq/coin-multiversx@0.24.0-next.0
  - @ledgerhq/coin-near@0.31.0-next.0
  - @ledgerhq/coin-polkadot@6.34.0-next.0
  - @ledgerhq/coin-solana@0.62.0-next.0
  - @ledgerhq/coin-stacks@0.28.0-next.0
  - @ledgerhq/coin-sui@0.44.0-next.0
  - @ledgerhq/coin-ton@0.36.0-next.0
  - @ledgerhq/coin-vechain@3.0.0-next.0
  - @domain/entity-currency-crypto@0.10.0-next.0
  - @domain/entity-currency-token@0.4.0-next.0
  - @domain/entity-currency-fiat@0.4.0-next.0
  - @ledgerhq/coin-zcash@0.3.0-next.0
  - @domain/api-currency-token@0.4.0-next.0
  - @domain/api-swap-quotes@0.2.0-next.0
  - @domain/entity-account-name@0.2.0-next.0
  - @domain/entity-client-identity@0.2.0-next.0
  - @domain/entity-currency@0.4.0-next.0
  - @features/platform-aggregated-assets@0.3.0-next.0
  - @features/platform-env@0.2.0-next.0
  - @shared/feature-flags@0.18.0-next.0
  - @ledgerhq/hw-app-exchange@0.25.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.8.0-next.0
  - @ledgerhq/live-signer-zcash@0.9.0-next.0
  - @domain/api-aggregated-assets@0.3.0-next.0
  - @domain/entity-interest-rate@0.3.0-next.0
  - @domain/entity-aggregated-asset@0.3.0-next.0
  - @ledgerhq/live-dmk-shared@0.30.0-next.0
  - @ledgerhq/asset-aggregation@0.13.0-next.0
  - @ledgerhq/live-signer-aleo@0.19.6-next.0
  - @ledgerhq/live-signer-canton@0.9.15-next.0
  - @ledgerhq/live-signer-celo@1.2.2-next.0
  - @ledgerhq/live-signer-concordium@0.6.5-next.0
  - @ledgerhq/live-signer-cosmos@0.4.5-next.0
  - @ledgerhq/live-signer-icp@0.1.1-next.0
  - @ledgerhq/live-signer-solana@0.19.1-next.0
  - @ledgerhq/live-currency-format@0.14.1
  - @ledgerhq/wallet-btc@0.3.0
  - @domain/entity-recent-addresses@0.1.1-next.0
  - @features/platform-feature-flags@0.6.5-next.0
  - @ledgerhq/device-core@0.11.11-next.0
  - @ledgerhq/domain-service@1.8.14-next.0
  - @ledgerhq/evm-tools@1.13.2
  - @ledgerhq/hw-app-eth@7.8.14-next.0
  - @ledgerhq/live-countervalues@0.24.2-next.0
  - @ledgerhq/live-countervalues-react@0.16.6-next.0
  - @ledgerhq/live-signer-evm@0.22.2-next.0
  - @ledgerhq/device-intent@5.0.0-next.0

## 37.1.0

### Minor Changes

- [#20280](https://github.com/LedgerHQ/ledger-live/pull/20280) [`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Stop depending on `@ledgerhq/errors` (LIVE-32915).

  No workspace package declares it anymore, and none may again: `enforce-boundaries` now fails CI on any manifest that does. The classes it held live in the package that owns them, with `@ledgerhq/ledger-wallet-framework/errors` as the shared home below the coin layer.

  The package itself stays in the repo so it keeps being published for external consumers, and is bridged to the external coin packages that still peer-depend on it via `pnpm.packageExtensions` using `workspace:*` (which reuses the single in-repo copy, so the dependency graph keeps exactly the physical copies it had before). [LedgerHQ/coin-modules#752](https://github.com/LedgerHQ/coin-modules/pull/752) removes that peerDependency upstream; once it is released the bridge can be dropped, but the package still needs publishing.

- [#20221](https://github.com/LedgerHQ/ledger-live/pull/20221) [`1689e58`](https://github.com/LedgerHQ/ledger-live/commit/1689e583c054bb8ad373bfe9f325b136fe0283bc) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Serve Zcash accounts with a standalone `@ledgerhq/coin-zcash` coin-module (LIVE-34556).

  The module owns all four transfer flows — t→t, t→z, z→t, z→z — and crafts, signs and broadcasts each one as a PCZT through the native `@ledgerhq/zcash-utils` engine, with no legacy PSBT path: it owns the transparent UTXO path itself via `@ledgerhq/wallet-btc` instead of delegating to the Bitcoin bridge. Shielded balances, notes and operations come from the sync engine, so a shielded account reports the balance and history the chain-adapter could only report for its transparent side.

  Which module serves a Zcash account is decided by the existing `zcashShielded` feature flag, mirrored into `live-common` (`src/bridge/zcashRouting.ts`) because a coin-module cannot read React feature flags. OFF (the default) keeps `@ledgerhq/coin-bitcoin`'s Zcash chain-adapter and its legacy transparent path, so nothing changes for users until the flag is turned on; the two implementations are kept accounting-equivalent by differential tests that run both bridges over the same fixtures.

  Desktop hosts the engine in a dedicated utility process, reached over a `zcash:`-prefixed IPC contract owned by the module.

  Two flows do not complete on a NU6.3 chain, where newly shielded value goes to the Ironwood pool: z→z has no builder, since it would need Orchard spends alongside an Ironwood output; and a flow that does build a V6 PCZT cannot be finalized until `@ledgerhq/zcash-utils` exposes a V6 finalizer.

- [#20240](https://github.com/LedgerHQ/ledger-live/pull/20240) [`15e4608`](https://github.com/LedgerHQ/ledger-live/commit/15e4608db80de6909f96f795d8a888994510e07d) Thanks [@deepyjr](https://github.com/deepyjr)! - Forward Modular Asset Drawer network filters to DADA asset requests.

- [#20298](https://github.com/LedgerHQ/ledger-live/pull/20298) [`4e4bf02`](https://github.com/LedgerHQ/ledger-live/commit/4e4bf02352284a821d54b875601e4f7effd8cfbf) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(llc): add `config_generic_a4` live config

- [#19737](https://github.com/LedgerHQ/ledger-live/pull/19737) [`825f50f`](https://github.com/LedgerHQ/ledger-live/commit/825f50fb9989f929c1462d53d0df58a7242261c0) Thanks [@ishaba](https://github.com/ishaba)! - feat(cosmos): integrate coin module alpaca api and cover by coin tester

- [#20074](https://github.com/LedgerHQ/ledger-live/pull/20074) [`72930e9`](https://github.com/LedgerHQ/ledger-live/commit/72930e93e2a01d46012c3e7b72e3e3d4875ae7d7) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Add a DMK-based Internet Computer signer and use it as the sole device signer, replacing the legacy `@zondax/ledger-icp` transport.

  The new `@ledgerhq/live-signer-icp` package provides `DmkSignerICP` (built on `@ledgerhq/device-signer-kit-icp`), and the `internet_computer` family now requires a DMK transport — mirroring the aleo and concordium signers. `@zondax/ledger-icp` is removed from Ledger Live.

  The ICP signer contract also exposes the neuron-management signing surface: `signUpdateCall` (signs a governance update call together with its read-state request, returning both signatures and the read-state body) and a `stake` flag on `sign` for neuron-creation transfers.

- [#20366](https://github.com/LedgerHQ/ledger-live/pull/20366) [`f0e8ea9`](https://github.com/LedgerHQ/ledger-live/commit/f0e8ea93a3c90767dad4b326deeef3d1c48c36cc) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(llc): add HTTP client for A4

- [#20276](https://github.com/LedgerHQ/ledger-live/pull/20276) [`140575c`](https://github.com/LedgerHQ/ledger-live/commit/140575c987ce5fa6173e7854edeb2c564e71c258) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add characterization tests for the previously untested dada-client cache selectors, query hooks and API transforms

- [#20189](https://github.com/LedgerHQ/ledger-live/pull/20189) [`4bbd5a4`](https://github.com/LedgerHQ/ledger-live/commit/4bbd5a441f09e3c3d1709abcc9da3a7d1d6ea50c) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Show the network fee in the currency users care about in the new send flow. When the fee is editable the row follows the amount input's fiat/crypto toggle; when it is not, the row shows the fiat value alongside the native amount, since it is the only place that fee is visible. Fee presets now sub-label both amounts, except coins priced by fee rate (Bitcoin, Kaspa) which keep their sat/vB legend.

- [#19919](https://github.com/LedgerHQ/ledger-live/pull/19919) [`42524ad`](https://github.com/LedgerHQ/ledger-live/commit/42524ad0a30bc55ccf3563be35b19cd2c7004199) Thanks [@amaslakov](https://github.com/amaslakov)! - Expose account readiness status to live-apps via the wallet API

- [#20289](https://github.com/LedgerHQ/ledger-live/pull/20289) [`e50980f`](https://github.com/LedgerHQ/ledger-live/commit/e50980fccea5be9b6be8c14d2fd247c6eca6460f) Thanks [@qperrot](https://github.com/qperrot)! - Prevent "nonce too low" errors on rapid consecutive sends by deriving the next sequence from both the network source and locally-tracked pending operations.

- [#20339](https://github.com/LedgerHQ/ledger-live/pull/20339) [`6a531c5`](https://github.com/LedgerHQ/ledger-live/commit/6a531c54ccd1c65df122286de6f136f9d73b9002) Thanks [@qperrot](https://github.com/qperrot)! - Remove Scroll Sepolia testnet support as it is no longer maintained

- [#20261](https://github.com/LedgerHQ/ledger-live/pull/20261) [`ba6e9c1`](https://github.com/LedgerHQ/ledger-live/commit/ba6e9c1e542ad28a59b0163e3b453e2f047a48b9) Thanks [@ysitbon](https://github.com/ysitbon)! - Import currency accessors from the domain layer instead of the `@ledgerhq/live-common/currencies` barrel.

  Crypto accessors (`getCryptoCurrencyById`, `findCryptoCurrencyById`, `findCryptoCurrencyByKeyword`, `findCryptoCurrencyByTicker`, `listCryptoCurrencies`, `findCryptoCurrency`, `findCryptoCurrencyByScheme`, `hasCryptoCurrencyId`) now come from `@domain/entity-currency-crypto`, and fiat accessors (`getFiatCurrencyByTicker`, `findFiatCurrencyByTicker`, `listFiatCurrencies`, `hasFiatCurrencyTicker`) from `@domain/entity-currency-fiat`. The re-exports that forwarded them through `@ledgerhq/live-common/currencies` are removed; the barrel keeps its formatting, colour, helper, marketcap, support and URI-scheme exports. Behaviour is unchanged — the barrel already delegated to these same domain functions.

- [#20265](https://github.com/LedgerHQ/ledger-live/pull/20265) [`5f81208`](https://github.com/LedgerHQ/ledger-live/commit/5f81208308f7e56971cce9329369c12af82185d3) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Remove analytics consentValidityDays and the unused live-common consent expiry helpers

- [#20299](https://github.com/LedgerHQ/ledger-live/pull/20299) [`e44d972`](https://github.com/LedgerHQ/ledger-live/commit/e44d97239af10b46ae3ef703e0c6181cc0c87712) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(llc): add base URLs and network mapping for A4

- [#19645](https://github.com/LedgerHQ/ledger-live/pull/19645) [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152) Thanks [@amaslakov](https://github.com/amaslakov)! - Add an optional `readiness` attribute to the base `Account` type (`{ ready: boolean; reason?: string }`), a generic cross-chain projection of whether an account is fully operational. It is persisted through account serialization and populated during sync via a new optional `BridgeApi.getAccountReadiness` hook. Tezos implements the hook: an account whose public key is not revealed on-chain is reported as `{ ready: false, reason: "unrevealed" }`. Families that do not provide the hook leave `readiness` undefined. coin-tezos `getAccountByAddress` now coalesces concurrent same-address calls into a single request, so surfacing readiness during sync adds no redundant tzkt call.

- [#20018](https://github.com/LedgerHQ/ledger-live/pull/20018) [`b5df122`](https://github.com/LedgerHQ/ledger-live/commit/b5df1223ce9e09766d6f3fecf7e44e2ec3bd3a00) Thanks [@pawell24](https://github.com/pawell24)! - Add the CoinModuleApi (Alpaca) implementation for VET + VTHO to coin-vechain (getBalance, listOperations, lastBlock, getBlock, getBlockInfo, craftTransaction, estimateFees, combine, broadcast, validateIntent), registered in live-common alongside the existing account bridge.

- [#20350](https://github.com/LedgerHQ/ledger-live/pull/20350) [`51bc3da`](https://github.com/LedgerHQ/ledger-live/commit/51bc3daa6eb6c4b79bc4c14df4872072657277cd) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix hidden assets not appearing in Settings > Accounts. Native coins hidden from the asset detail page are now resolved from the crypto registry and listed alongside hidden tokens, and a single failing token lookup no longer empties the whole list.

### Patch Changes

- Updated dependencies [[`4dcfb04`](https://github.com/LedgerHQ/ledger-live/commit/4dcfb045e7cb5c27395bb10b1feea10f206da66f), [`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add), [`1689e58`](https://github.com/LedgerHQ/ledger-live/commit/1689e583c054bb8ad373bfe9f325b136fe0283bc), [`facb60a`](https://github.com/LedgerHQ/ledger-live/commit/facb60a8abbc42b5067fb4d69d68577c6da2f232), [`7b4b965`](https://github.com/LedgerHQ/ledger-live/commit/7b4b965ce521cc6289ebeba50cca1a317f3417cd), [`c016a95`](https://github.com/LedgerHQ/ledger-live/commit/c016a95538dfef2d7ddf1a17914d8cb3e55b644e), [`2fa6e1f`](https://github.com/LedgerHQ/ledger-live/commit/2fa6e1f3fbcb56ff444ca756135d821e141bc439), [`56cfe0b`](https://github.com/LedgerHQ/ledger-live/commit/56cfe0bc6673f416f739c1593abfec718230952d), [`e630ac7`](https://github.com/LedgerHQ/ledger-live/commit/e630ac7b3dd4523aa050a1316de98814c0daa5b2), [`ec6f940`](https://github.com/LedgerHQ/ledger-live/commit/ec6f9402e65a366bcab2a0a3f845a98c5cbd576d), [`825f50f`](https://github.com/LedgerHQ/ledger-live/commit/825f50fb9989f929c1462d53d0df58a7242261c0), [`f60f9cb`](https://github.com/LedgerHQ/ledger-live/commit/f60f9cbc79557cfa815ea714b375ace11aea8754), [`72930e9`](https://github.com/LedgerHQ/ledger-live/commit/72930e93e2a01d46012c3e7b72e3e3d4875ae7d7), [`de041b8`](https://github.com/LedgerHQ/ledger-live/commit/de041b89c67dcacea7bc4eeffab75b76ab1d4bd7), [`4015ade`](https://github.com/LedgerHQ/ledger-live/commit/4015ade1f9744d4bb575282060fdb1beb9aafc89), [`9a32a74`](https://github.com/LedgerHQ/ledger-live/commit/9a32a748b3fcc088b65e89e265c51349f3f3135d), [`b90214c`](https://github.com/LedgerHQ/ledger-live/commit/b90214cf695812b52dc13eabcd930dbdfb6fe081), [`1a5daed`](https://github.com/LedgerHQ/ledger-live/commit/1a5daedee23b55327e2d82b118b802125b0ca1f4), [`46ad2f4`](https://github.com/LedgerHQ/ledger-live/commit/46ad2f40ca5e8acd891a2492c4f126cacf3e9e20), [`d467088`](https://github.com/LedgerHQ/ledger-live/commit/d4670885d7eb77c035d09c225eff9dca0151abb3), [`6a531c5`](https://github.com/LedgerHQ/ledger-live/commit/6a531c54ccd1c65df122286de6f136f9d73b9002), [`c82c09a`](https://github.com/LedgerHQ/ledger-live/commit/c82c09abc5f7f814b68d6db44021d915bc9bc0d7), [`5f81208`](https://github.com/LedgerHQ/ledger-live/commit/5f81208308f7e56971cce9329369c12af82185d3), [`e44d972`](https://github.com/LedgerHQ/ledger-live/commit/e44d97239af10b46ae3ef703e0c6181cc0c87712), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152), [`635fa12`](https://github.com/LedgerHQ/ledger-live/commit/635fa12d47f5a98858326f4dd68962dffe82eda9), [`b5df122`](https://github.com/LedgerHQ/ledger-live/commit/b5df1223ce9e09766d6f3fecf7e44e2ec3bd3a00)]:
  - @ledgerhq/coin-tron@6.9.0
  - @ledgerhq/coin-aleo@1.21.0
  - @ledgerhq/coin-algorand@1.12.0
  - @ledgerhq/coin-aptos@3.26.0
  - @ledgerhq/coin-bitcoin@0.50.0
  - @ledgerhq/coin-canton@0.32.0
  - @ledgerhq/coin-cardano@0.33.0
  - @ledgerhq/coin-casper@2.18.0
  - @ledgerhq/coin-celo@2.12.0
  - @ledgerhq/coin-concordium@0.19.0
  - @ledgerhq/coin-cosmos@0.42.0
  - @ledgerhq/coin-evm@4.9.0
  - @ledgerhq/coin-filecoin@1.31.0
  - @ledgerhq/coin-hedera@1.41.0
  - @ledgerhq/coin-icon@0.28.0
  - @ledgerhq/coin-internet_computer@1.28.0
  - @ledgerhq/coin-kaspa@1.22.0
  - @ledgerhq/coin-mina@1.20.0
  - @ledgerhq/coin-multiversx@0.23.0
  - @ledgerhq/coin-near@0.30.0
  - @ledgerhq/coin-polkadot@6.33.0
  - @ledgerhq/coin-solana@0.61.0
  - @ledgerhq/coin-stacks@0.27.0
  - @ledgerhq/coin-sui@0.43.0
  - @ledgerhq/coin-tezos@7.12.0
  - @ledgerhq/coin-ton@0.35.0
  - @ledgerhq/coin-vechain@2.28.0
  - @ledgerhq/coin-zcash@0.2.0
  - @ledgerhq/live-signer-zcash@0.8.0
  - @domain/api-currency-token@0.3.0
  - @shared/feature-flags@0.17.0
  - @ledgerhq/live-signer-solana@0.19.0
  - @shared/env@0.2.0
  - @ledgerhq/live-signer-icp@0.1.0
  - @domain/entity-currency-crypto@0.9.0
  - @ledgerhq/ledger-wallet-framework@2.7.0
  - @ledgerhq/live-signer-aleo@0.19.5
  - @ledgerhq/live-signer-canton@0.9.14
  - @ledgerhq/live-signer-celo@1.2.1
  - @ledgerhq/live-signer-concordium@0.6.4
  - @ledgerhq/live-signer-cosmos@0.4.4
  - @features/platform-feature-flags@0.6.4
  - @ledgerhq/asset-aggregation@0.12.2
  - @ledgerhq/device-core@0.11.10
  - @ledgerhq/domain-service@1.8.13
  - @ledgerhq/evm-tools@1.13.2
  - @ledgerhq/hw-app-eth@7.8.13
  - @ledgerhq/live-countervalues@0.24.1
  - @ledgerhq/live-countervalues-react@0.16.5
  - @ledgerhq/live-signer-evm@0.22.1
  - @ledgerhq/live-wallet@0.30.2
  - @features/platform-env@0.1.2
  - @ledgerhq/ledger-cal-service@1.19.1
  - @ledgerhq/ledger-trust-service@0.8.12
  - @ledgerhq/speculos-transport@0.10.10
  - @domain/entity-currency@0.3.1
  - @ledgerhq/live-currency-format@0.14.1
  - @ledgerhq/wallet-btc@0.3.0
  - @ledgerhq/hw-app-exchange@0.24.0

## 37.1.0-next.0

### Minor Changes

- [#20280](https://github.com/LedgerHQ/ledger-live/pull/20280) [`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Stop depending on `@ledgerhq/errors` (LIVE-32915).

  No workspace package declares it anymore, and none may again: `enforce-boundaries` now fails CI on any manifest that does. The classes it held live in the package that owns them, with `@ledgerhq/ledger-wallet-framework/errors` as the shared home below the coin layer.

  The package itself stays in the repo so it keeps being published for external consumers, and is bridged to the external coin packages that still peer-depend on it via `pnpm.packageExtensions` using `workspace:*` (which reuses the single in-repo copy, so the dependency graph keeps exactly the physical copies it had before). [LedgerHQ/coin-modules#752](https://github.com/LedgerHQ/coin-modules/pull/752) removes that peerDependency upstream; once it is released the bridge can be dropped, but the package still needs publishing.

- [#20221](https://github.com/LedgerHQ/ledger-live/pull/20221) [`1689e58`](https://github.com/LedgerHQ/ledger-live/commit/1689e583c054bb8ad373bfe9f325b136fe0283bc) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Serve Zcash accounts with a standalone `@ledgerhq/coin-zcash` coin-module (LIVE-34556).

  The module owns all four transfer flows — t→t, t→z, z→t, z→z — and crafts, signs and broadcasts each one as a PCZT through the native `@ledgerhq/zcash-utils` engine, with no legacy PSBT path: it owns the transparent UTXO path itself via `@ledgerhq/wallet-btc` instead of delegating to the Bitcoin bridge. Shielded balances, notes and operations come from the sync engine, so a shielded account reports the balance and history the chain-adapter could only report for its transparent side.

  Which module serves a Zcash account is decided by the existing `zcashShielded` feature flag, mirrored into `live-common` (`src/bridge/zcashRouting.ts`) because a coin-module cannot read React feature flags. OFF (the default) keeps `@ledgerhq/coin-bitcoin`'s Zcash chain-adapter and its legacy transparent path, so nothing changes for users until the flag is turned on; the two implementations are kept accounting-equivalent by differential tests that run both bridges over the same fixtures.

  Desktop hosts the engine in a dedicated utility process, reached over a `zcash:`-prefixed IPC contract owned by the module.

  Two flows do not complete on a NU6.3 chain, where newly shielded value goes to the Ironwood pool: z→z has no builder, since it would need Orchard spends alongside an Ironwood output; and a flow that does build a V6 PCZT cannot be finalized until `@ledgerhq/zcash-utils` exposes a V6 finalizer.

- [#20240](https://github.com/LedgerHQ/ledger-live/pull/20240) [`15e4608`](https://github.com/LedgerHQ/ledger-live/commit/15e4608db80de6909f96f795d8a888994510e07d) Thanks [@deepyjr](https://github.com/deepyjr)! - Forward Modular Asset Drawer network filters to DADA asset requests.

- [#20298](https://github.com/LedgerHQ/ledger-live/pull/20298) [`4e4bf02`](https://github.com/LedgerHQ/ledger-live/commit/4e4bf02352284a821d54b875601e4f7effd8cfbf) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(llc): add `config_generic_a4` live config

- [#19737](https://github.com/LedgerHQ/ledger-live/pull/19737) [`825f50f`](https://github.com/LedgerHQ/ledger-live/commit/825f50fb9989f929c1462d53d0df58a7242261c0) Thanks [@ishaba](https://github.com/ishaba)! - feat(cosmos): integrate coin module alpaca api and cover by coin tester

- [#20074](https://github.com/LedgerHQ/ledger-live/pull/20074) [`72930e9`](https://github.com/LedgerHQ/ledger-live/commit/72930e93e2a01d46012c3e7b72e3e3d4875ae7d7) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Add a DMK-based Internet Computer signer and use it as the sole device signer, replacing the legacy `@zondax/ledger-icp` transport.

  The new `@ledgerhq/live-signer-icp` package provides `DmkSignerICP` (built on `@ledgerhq/device-signer-kit-icp`), and the `internet_computer` family now requires a DMK transport — mirroring the aleo and concordium signers. `@zondax/ledger-icp` is removed from Ledger Live.

  The ICP signer contract also exposes the neuron-management signing surface: `signUpdateCall` (signs a governance update call together with its read-state request, returning both signatures and the read-state body) and a `stake` flag on `sign` for neuron-creation transfers.

- [#20366](https://github.com/LedgerHQ/ledger-live/pull/20366) [`f0e8ea9`](https://github.com/LedgerHQ/ledger-live/commit/f0e8ea93a3c90767dad4b326deeef3d1c48c36cc) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(llc): add HTTP client for A4

- [#20276](https://github.com/LedgerHQ/ledger-live/pull/20276) [`140575c`](https://github.com/LedgerHQ/ledger-live/commit/140575c987ce5fa6173e7854edeb2c564e71c258) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add characterization tests for the previously untested dada-client cache selectors, query hooks and API transforms

- [#20189](https://github.com/LedgerHQ/ledger-live/pull/20189) [`4bbd5a4`](https://github.com/LedgerHQ/ledger-live/commit/4bbd5a441f09e3c3d1709abcc9da3a7d1d6ea50c) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Show the network fee in the currency users care about in the new send flow. When the fee is editable the row follows the amount input's fiat/crypto toggle; when it is not, the row shows the fiat value alongside the native amount, since it is the only place that fee is visible. Fee presets now sub-label both amounts, except coins priced by fee rate (Bitcoin, Kaspa) which keep their sat/vB legend.

- [#19919](https://github.com/LedgerHQ/ledger-live/pull/19919) [`42524ad`](https://github.com/LedgerHQ/ledger-live/commit/42524ad0a30bc55ccf3563be35b19cd2c7004199) Thanks [@amaslakov](https://github.com/amaslakov)! - Expose account readiness status to live-apps via the wallet API

- [#20289](https://github.com/LedgerHQ/ledger-live/pull/20289) [`e50980f`](https://github.com/LedgerHQ/ledger-live/commit/e50980fccea5be9b6be8c14d2fd247c6eca6460f) Thanks [@qperrot](https://github.com/qperrot)! - Prevent "nonce too low" errors on rapid consecutive sends by deriving the next sequence from both the network source and locally-tracked pending operations.

- [#20339](https://github.com/LedgerHQ/ledger-live/pull/20339) [`6a531c5`](https://github.com/LedgerHQ/ledger-live/commit/6a531c54ccd1c65df122286de6f136f9d73b9002) Thanks [@qperrot](https://github.com/qperrot)! - Remove Scroll Sepolia testnet support as it is no longer maintained

- [#20261](https://github.com/LedgerHQ/ledger-live/pull/20261) [`ba6e9c1`](https://github.com/LedgerHQ/ledger-live/commit/ba6e9c1e542ad28a59b0163e3b453e2f047a48b9) Thanks [@ysitbon](https://github.com/ysitbon)! - Import currency accessors from the domain layer instead of the `@ledgerhq/live-common/currencies` barrel.

  Crypto accessors (`getCryptoCurrencyById`, `findCryptoCurrencyById`, `findCryptoCurrencyByKeyword`, `findCryptoCurrencyByTicker`, `listCryptoCurrencies`, `findCryptoCurrency`, `findCryptoCurrencyByScheme`, `hasCryptoCurrencyId`) now come from `@domain/entity-currency-crypto`, and fiat accessors (`getFiatCurrencyByTicker`, `findFiatCurrencyByTicker`, `listFiatCurrencies`, `hasFiatCurrencyTicker`) from `@domain/entity-currency-fiat`. The re-exports that forwarded them through `@ledgerhq/live-common/currencies` are removed; the barrel keeps its formatting, colour, helper, marketcap, support and URI-scheme exports. Behaviour is unchanged — the barrel already delegated to these same domain functions.

- [#20265](https://github.com/LedgerHQ/ledger-live/pull/20265) [`5f81208`](https://github.com/LedgerHQ/ledger-live/commit/5f81208308f7e56971cce9329369c12af82185d3) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Remove analytics consentValidityDays and the unused live-common consent expiry helpers

- [#20299](https://github.com/LedgerHQ/ledger-live/pull/20299) [`e44d972`](https://github.com/LedgerHQ/ledger-live/commit/e44d97239af10b46ae3ef703e0c6181cc0c87712) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(llc): add base URLs and network mapping for A4

- [#19645](https://github.com/LedgerHQ/ledger-live/pull/19645) [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152) Thanks [@amaslakov](https://github.com/amaslakov)! - Add an optional `readiness` attribute to the base `Account` type (`{ ready: boolean; reason?: string }`), a generic cross-chain projection of whether an account is fully operational. It is persisted through account serialization and populated during sync via a new optional `BridgeApi.getAccountReadiness` hook. Tezos implements the hook: an account whose public key is not revealed on-chain is reported as `{ ready: false, reason: "unrevealed" }`. Families that do not provide the hook leave `readiness` undefined. coin-tezos `getAccountByAddress` now coalesces concurrent same-address calls into a single request, so surfacing readiness during sync adds no redundant tzkt call.

- [#20018](https://github.com/LedgerHQ/ledger-live/pull/20018) [`b5df122`](https://github.com/LedgerHQ/ledger-live/commit/b5df1223ce9e09766d6f3fecf7e44e2ec3bd3a00) Thanks [@pawell24](https://github.com/pawell24)! - Add the CoinModuleApi (Alpaca) implementation for VET + VTHO to coin-vechain (getBalance, listOperations, lastBlock, getBlock, getBlockInfo, craftTransaction, estimateFees, combine, broadcast, validateIntent), registered in live-common alongside the existing account bridge.

- [#20350](https://github.com/LedgerHQ/ledger-live/pull/20350) [`51bc3da`](https://github.com/LedgerHQ/ledger-live/commit/51bc3daa6eb6c4b79bc4c14df4872072657277cd) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Fix hidden assets not appearing in Settings > Accounts. Native coins hidden from the asset detail page are now resolved from the crypto registry and listed alongside hidden tokens, and a single failing token lookup no longer empties the whole list.

### Patch Changes

- Updated dependencies [[`4dcfb04`](https://github.com/LedgerHQ/ledger-live/commit/4dcfb045e7cb5c27395bb10b1feea10f206da66f), [`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add), [`1689e58`](https://github.com/LedgerHQ/ledger-live/commit/1689e583c054bb8ad373bfe9f325b136fe0283bc), [`facb60a`](https://github.com/LedgerHQ/ledger-live/commit/facb60a8abbc42b5067fb4d69d68577c6da2f232), [`7b4b965`](https://github.com/LedgerHQ/ledger-live/commit/7b4b965ce521cc6289ebeba50cca1a317f3417cd), [`c016a95`](https://github.com/LedgerHQ/ledger-live/commit/c016a95538dfef2d7ddf1a17914d8cb3e55b644e), [`2fa6e1f`](https://github.com/LedgerHQ/ledger-live/commit/2fa6e1f3fbcb56ff444ca756135d821e141bc439), [`56cfe0b`](https://github.com/LedgerHQ/ledger-live/commit/56cfe0bc6673f416f739c1593abfec718230952d), [`e630ac7`](https://github.com/LedgerHQ/ledger-live/commit/e630ac7b3dd4523aa050a1316de98814c0daa5b2), [`ec6f940`](https://github.com/LedgerHQ/ledger-live/commit/ec6f9402e65a366bcab2a0a3f845a98c5cbd576d), [`825f50f`](https://github.com/LedgerHQ/ledger-live/commit/825f50fb9989f929c1462d53d0df58a7242261c0), [`f60f9cb`](https://github.com/LedgerHQ/ledger-live/commit/f60f9cbc79557cfa815ea714b375ace11aea8754), [`72930e9`](https://github.com/LedgerHQ/ledger-live/commit/72930e93e2a01d46012c3e7b72e3e3d4875ae7d7), [`de041b8`](https://github.com/LedgerHQ/ledger-live/commit/de041b89c67dcacea7bc4eeffab75b76ab1d4bd7), [`4015ade`](https://github.com/LedgerHQ/ledger-live/commit/4015ade1f9744d4bb575282060fdb1beb9aafc89), [`9a32a74`](https://github.com/LedgerHQ/ledger-live/commit/9a32a748b3fcc088b65e89e265c51349f3f3135d), [`b90214c`](https://github.com/LedgerHQ/ledger-live/commit/b90214cf695812b52dc13eabcd930dbdfb6fe081), [`1a5daed`](https://github.com/LedgerHQ/ledger-live/commit/1a5daedee23b55327e2d82b118b802125b0ca1f4), [`46ad2f4`](https://github.com/LedgerHQ/ledger-live/commit/46ad2f40ca5e8acd891a2492c4f126cacf3e9e20), [`d467088`](https://github.com/LedgerHQ/ledger-live/commit/d4670885d7eb77c035d09c225eff9dca0151abb3), [`6a531c5`](https://github.com/LedgerHQ/ledger-live/commit/6a531c54ccd1c65df122286de6f136f9d73b9002), [`c82c09a`](https://github.com/LedgerHQ/ledger-live/commit/c82c09abc5f7f814b68d6db44021d915bc9bc0d7), [`5f81208`](https://github.com/LedgerHQ/ledger-live/commit/5f81208308f7e56971cce9329369c12af82185d3), [`e44d972`](https://github.com/LedgerHQ/ledger-live/commit/e44d97239af10b46ae3ef703e0c6181cc0c87712), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152), [`635fa12`](https://github.com/LedgerHQ/ledger-live/commit/635fa12d47f5a98858326f4dd68962dffe82eda9), [`b5df122`](https://github.com/LedgerHQ/ledger-live/commit/b5df1223ce9e09766d6f3fecf7e44e2ec3bd3a00)]:
  - @ledgerhq/coin-tron@6.9.0-next.0
  - @ledgerhq/coin-aleo@1.21.0-next.0
  - @ledgerhq/coin-algorand@1.12.0-next.0
  - @ledgerhq/coin-aptos@3.26.0-next.0
  - @ledgerhq/coin-bitcoin@0.50.0-next.0
  - @ledgerhq/coin-canton@0.32.0-next.0
  - @ledgerhq/coin-cardano@0.33.0-next.0
  - @ledgerhq/coin-casper@2.18.0-next.0
  - @ledgerhq/coin-celo@2.12.0-next.0
  - @ledgerhq/coin-concordium@0.19.0-next.0
  - @ledgerhq/coin-cosmos@0.42.0-next.0
  - @ledgerhq/coin-evm@4.9.0-next.0
  - @ledgerhq/coin-filecoin@1.31.0-next.0
  - @ledgerhq/coin-hedera@1.41.0-next.0
  - @ledgerhq/coin-icon@0.28.0-next.0
  - @ledgerhq/coin-internet_computer@1.28.0-next.0
  - @ledgerhq/coin-kaspa@1.22.0-next.0
  - @ledgerhq/coin-mina@1.20.0-next.0
  - @ledgerhq/coin-multiversx@0.23.0-next.0
  - @ledgerhq/coin-near@0.30.0-next.0
  - @ledgerhq/coin-polkadot@6.33.0-next.0
  - @ledgerhq/coin-solana@0.61.0-next.0
  - @ledgerhq/coin-stacks@0.27.0-next.0
  - @ledgerhq/coin-sui@0.43.0-next.0
  - @ledgerhq/coin-tezos@7.12.0-next.0
  - @ledgerhq/coin-ton@0.35.0-next.0
  - @ledgerhq/coin-vechain@2.28.0-next.0
  - @ledgerhq/coin-zcash@0.2.0-next.0
  - @ledgerhq/live-signer-zcash@0.8.0-next.0
  - @domain/api-currency-token@0.3.0-next.0
  - @shared/feature-flags@0.17.0-next.0
  - @ledgerhq/live-signer-solana@0.19.0-next.0
  - @shared/env@0.2.0-next.0
  - @ledgerhq/live-signer-icp@0.1.0-next.0
  - @domain/entity-currency-crypto@0.9.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.7.0-next.0
  - @ledgerhq/live-signer-aleo@0.19.5-next.0
  - @ledgerhq/live-signer-canton@0.9.14-next.0
  - @ledgerhq/live-signer-celo@1.2.1-next.0
  - @ledgerhq/live-signer-concordium@0.6.4-next.0
  - @ledgerhq/live-signer-cosmos@0.4.4-next.0
  - @features/platform-feature-flags@0.6.4-next.0
  - @ledgerhq/asset-aggregation@0.12.2-next.0
  - @ledgerhq/device-core@0.11.10-next.0
  - @ledgerhq/domain-service@1.8.13-next.0
  - @ledgerhq/evm-tools@1.13.2
  - @ledgerhq/hw-app-eth@7.8.13-next.0
  - @ledgerhq/live-countervalues@0.24.1-next.0
  - @ledgerhq/live-countervalues-react@0.16.5-next.0
  - @ledgerhq/live-signer-evm@0.22.1-next.0
  - @ledgerhq/live-wallet@0.30.2-next.0
  - @features/platform-env@0.1.2-next.0
  - @ledgerhq/ledger-cal-service@1.19.1-next.0
  - @ledgerhq/ledger-trust-service@0.8.12-next.0
  - @ledgerhq/speculos-transport@0.10.10-next.0
  - @domain/entity-currency@0.3.1-next.0
  - @ledgerhq/live-currency-format@0.14.1
  - @ledgerhq/wallet-btc@0.3.0
  - @ledgerhq/hw-app-exchange@0.24.0

## 37.0.0

### Major Changes

- [#19670](https://github.com/LedgerHQ/ledger-live/pull/19670) [`008228e`](https://github.com/LedgerHQ/ledger-live/commit/008228ee22ba86b8aabe50c50d9c2e5e63771add) Thanks [@jcchevalier-ledger](https://github.com/jcchevalier-ledger)! - Replace transaction alert address updates with account reconciliation

### Minor Changes

- [#20129](https://github.com/LedgerHQ/ledger-live/pull/20129) [`ba20e39`](https://github.com/LedgerHQ/ledger-live/commit/ba20e3926e52284c04c9bc4e4b17b7c5e34b3cb5) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Migrate `checkLibs` and its two callers off `@ledgerhq/errors` as part of the errors sunset (LIVE-32915).

  `checkLibs` detects duplicated npm packages by comparing class identity, so `sanityChecks.ts` and both app entrypoints must import `NotEnoughBalance` from the same module. All three now use `@ledgerhq/ledger-wallet-framework/errors`. The duplicate-package warning also names `@ledgerhq/ledger-wallet-framework` so the `pnpm why` hint points at the package actually being checked.

- [#20099](https://github.com/LedgerHQ/ledger-live/pull/20099) [`37dac39`](https://github.com/LedgerHQ/ledger-live/commit/37dac39463de1a44bdb5bc4b1b6b37b0cff68922) Thanks [@deepyjr](https://github.com/deepyjr)! - Add contact address asset and network selection through the Modular Dialog, with shared asset
  filtering across Desktop and Mobile.

- [#20139](https://github.com/LedgerHQ/ledger-live/pull/20139) [`cee41c4`](https://github.com/LedgerHQ/ledger-live/commit/cee41c4e7a7c7e042d4df39d5a34591d72d723d0) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(evm): keep legacy custom fees on non-EIP-1559 chains like Ethereum Classic

- [#20009](https://github.com/LedgerHQ/ledger-live/pull/20009) [`341ea10`](https://github.com/LedgerHQ/ledger-live/commit/341ea108e30bf8af9abeb6eed484ee4b2c7c4a43) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Revert Cardano firmware app v8.0.4 support (hw-app-cardano bump to 8.0.0)

- [#19805](https://github.com/LedgerHQ/ledger-live/pull/19805) [`b1d3f26`](https://github.com/LedgerHQ/ledger-live/commit/b1d3f26cbdf67c439bc125bdda1f1c56c9753f2e) Thanks [@ishaba](https://github.com/ishaba)! - feat(send): add default-fee strategy to the new send flow

- [#20180](https://github.com/LedgerHQ/ledger-live/pull/20180) [`dd7758b`](https://github.com/LedgerHQ/ledger-live/commit/dd7758bfa16c6b73b60da072a50c22f3b132c1a2) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Show 8 characters on each side of the ellipsis when truncating the recipient address in the new send flow, consistently across mobile and desktop

- [#19996](https://github.com/LedgerHQ/ledger-live/pull/19996) [`c9dddf2`](https://github.com/LedgerHQ/ledger-live/commit/c9dddf21f6e3208a077aa72bd575f56415287074) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwm): changes bottomsheet to sheet info and minor fixes on lwm

- [#20127](https://github.com/LedgerHQ/ledger-live/pull/20127) [`e7b8ddc`](https://github.com/LedgerHQ/ledger-live/commit/e7b8ddc239b88c1fbf0751c468218d9263f56859) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: aleo tokens swap incompatibility warning

- [#19690](https://github.com/LedgerHQ/ledger-live/pull/19690) [`e6a9b97`](https://github.com/LedgerHQ/ledger-live/commit/e6a9b973d05af98987c094d591342031f273b31c) Thanks [@CremaFR](https://github.com/CremaFR)! - feat(swap): enrich the device's generic payload deserialization error with the exact Exchange app protobuf field that exceeds its limit

  When the Exchange device app rejects a swap `NewTransactionResponse` with the generic `DESERIALIZATION_FAILED` (0x6a81) status, we now decode the payload locally and, if a field is larger than the device's protobuf `max_size` (mirrored from app-exchange `protocol.options`), surface a precise `SwapPayloadFieldExceedsLimit` carrying the field name, limit and actual size (e.g. an oversized `payin_extra_id`).

  The device remains the source of truth: this check only runs **after** the device has already rejected the payload, never gates the flow, and silently falls back to the device's error if our hardcoded limits ever drift from the app. The user-facing flow and step (`PROCESS_TRANSACTION`) are unchanged; the added precision is only meant to speed up investigations.

- [#19215](https://github.com/LedgerHQ/ledger-live/pull/19215) [`dfab01f`](https://github.com/LedgerHQ/ledger-live/commit/dfab01f36460bd4e0ea0b0c13aa3d965aef945cd) Thanks [@CremaFR](https://github.com/CremaFR)! - Add a Device Intent Executor based signing path for Wallet API `transaction.sign` and `message.sign` on Ledger Wallet Mobile, gated behind the new `llmWalletApiDeviceIntentSign` feature flag (per-manifest allow-list, off by default). Introduces the `signMessageIntent` module in live-common.

- [#20190](https://github.com/LedgerHQ/ledger-live/pull/20190) [`a8d6e25`](https://github.com/LedgerHQ/ledger-live/commit/a8d6e25c0467572fbbc0cd3b35f90d355542b1f7) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(lwdm): new send flow wait for valid address to display memo

### Patch Changes

- Updated dependencies [[`1070564`](https://github.com/LedgerHQ/ledger-live/commit/107056410174d3da2d45c468232a8d742aea021f), [`2e1aecc`](https://github.com/LedgerHQ/ledger-live/commit/2e1aeccf6c91761c5d09c91e4be10dcc8c22eb7b), [`ba69273`](https://github.com/LedgerHQ/ledger-live/commit/ba692732b521c42f934acf540641ecbfdb837004), [`24d60d7`](https://github.com/LedgerHQ/ledger-live/commit/24d60d7628696b58764f8fbd4495140a049b3fcc), [`1af9ec9`](https://github.com/LedgerHQ/ledger-live/commit/1af9ec984928e0bf5fd23ce12edcc6131b0302a0), [`f79de59`](https://github.com/LedgerHQ/ledger-live/commit/f79de59f95ed384fc2b2e49dfa28efb1a0493d4a), [`f5e4e87`](https://github.com/LedgerHQ/ledger-live/commit/f5e4e87a114ca8336f310a4b5e39bff650fc0750), [`6ac54ab`](https://github.com/LedgerHQ/ledger-live/commit/6ac54abe700847501356adc11231f8437d4a5817), [`cee41c4`](https://github.com/LedgerHQ/ledger-live/commit/cee41c4e7a7c7e042d4df39d5a34591d72d723d0), [`8ab9e50`](https://github.com/LedgerHQ/ledger-live/commit/8ab9e504a5b004e28f5e80f490b837b3c2526f44), [`4148019`](https://github.com/LedgerHQ/ledger-live/commit/414801922232b6d9514270e8876e783c11555c2c), [`1e4e519`](https://github.com/LedgerHQ/ledger-live/commit/1e4e51913a9b1971056789ac24ed05092529d799), [`52253f7`](https://github.com/LedgerHQ/ledger-live/commit/52253f70c302056cdc6b367cdd8b1db408b5e07d), [`4ce5257`](https://github.com/LedgerHQ/ledger-live/commit/4ce52570577d471d4af0609058ac6b9b03ad1949), [`452adf8`](https://github.com/LedgerHQ/ledger-live/commit/452adf85380d1cb74f1894478cdd84849b120ef4), [`44798f3`](https://github.com/LedgerHQ/ledger-live/commit/44798f392deb662a5f60123651ece2b320fbf946), [`d7600fb`](https://github.com/LedgerHQ/ledger-live/commit/d7600fb21e73581fbfb20019a78109b9a5c9abff), [`a534db5`](https://github.com/LedgerHQ/ledger-live/commit/a534db5c41da6957d38a330c1da6f7db1b693763), [`c622459`](https://github.com/LedgerHQ/ledger-live/commit/c622459fcbff5dcc094ee10eb360f2a835036007), [`d08f2bc`](https://github.com/LedgerHQ/ledger-live/commit/d08f2bccae5f94a339206ec703c8d16139f6cbc9), [`9fe07f0`](https://github.com/LedgerHQ/ledger-live/commit/9fe07f0f618e6cde963c922f271ad5d7b29dbce7), [`e6a9b97`](https://github.com/LedgerHQ/ledger-live/commit/e6a9b973d05af98987c094d591342031f273b31c), [`dbf8acf`](https://github.com/LedgerHQ/ledger-live/commit/dbf8acf27c9405548e7eb559d163a8e0883a20aa), [`51e7153`](https://github.com/LedgerHQ/ledger-live/commit/51e715314f2f89fbe76db1b69d878b4b250872e1), [`fb0f177`](https://github.com/LedgerHQ/ledger-live/commit/fb0f17772d553ebe985fd59240b24d9fdbf0e0db), [`6e72b5a`](https://github.com/LedgerHQ/ledger-live/commit/6e72b5a2532eae19e6cc54405acab4c28f4f2f20), [`dfab01f`](https://github.com/LedgerHQ/ledger-live/commit/dfab01f36460bd4e0ea0b0c13aa3d965aef945cd), [`aa27732`](https://github.com/LedgerHQ/ledger-live/commit/aa2773257ffa4480b33c2a219c9986eb40e293fb), [`aa27732`](https://github.com/LedgerHQ/ledger-live/commit/aa2773257ffa4480b33c2a219c9986eb40e293fb), [`f8b5b51`](https://github.com/LedgerHQ/ledger-live/commit/f8b5b51856c57c68ca50d13b00d124d261c26504)]:
  - @ledgerhq/errors@7.0.0
  - @ledgerhq/ledger-wallet-framework@2.6.0
  - @ledgerhq/coin-aleo@1.20.0
  - @ledgerhq/coin-algorand@1.11.0
  - @ledgerhq/coin-aptos@3.25.0
  - @ledgerhq/coin-bitcoin@0.49.0
  - @ledgerhq/coin-canton@0.31.0
  - @ledgerhq/coin-cardano@0.32.0
  - @ledgerhq/coin-casper@2.17.0
  - @ledgerhq/coin-celo@2.11.0
  - @ledgerhq/coin-concordium@0.18.0
  - @ledgerhq/coin-cosmos@0.41.0
  - @ledgerhq/coin-evm@4.8.0
  - @ledgerhq/coin-filecoin@1.30.0
  - @ledgerhq/coin-hedera@1.40.0
  - @ledgerhq/coin-icon@0.27.0
  - @ledgerhq/coin-internet_computer@1.27.0
  - @ledgerhq/coin-kaspa@1.21.0
  - @ledgerhq/coin-mina@1.19.0
  - @ledgerhq/coin-multiversx@0.22.0
  - @ledgerhq/coin-near@0.29.0
  - @ledgerhq/coin-polkadot@6.32.0
  - @ledgerhq/coin-solana@0.60.0
  - @ledgerhq/coin-stacks@0.26.0
  - @ledgerhq/coin-sui@0.42.0
  - @ledgerhq/coin-tezos@7.11.0
  - @ledgerhq/coin-ton@0.34.0
  - @ledgerhq/coin-tron@6.8.0
  - @ledgerhq/coin-vechain@2.27.0
  - @ledgerhq/live-network@3.0.0
  - @ledgerhq/ledger-cal-service@1.19.0
  - @domain/entity-currency-crypto@0.8.0
  - @domain/entity-currency-token@0.3.0
  - @domain/entity-currency@0.3.0
  - @ledgerhq/wallet-btc@0.3.0
  - @ledgerhq/live-countervalues@0.24.0
  - @shared/feature-flags@0.16.0
  - @ledgerhq/live-signer-evm@0.22.0
  - @ledgerhq/hw-app-exchange@0.24.0
  - @ledgerhq/live-signer-celo@1.2.0
  - @ledgerhq/device-core@0.11.9
  - @ledgerhq/domain-service@1.8.12
  - @ledgerhq/hw-app-algorand@6.35.7
  - @ledgerhq/hw-app-aptos@6.38.7
  - @ledgerhq/hw-app-hedera@1.6.7
  - @ledgerhq/hw-app-icon@1.7.7
  - @ledgerhq/hw-app-kaspa@1.7.7
  - @ledgerhq/hw-app-polkadot@6.38.7
  - @ledgerhq/hw-app-vet@0.13.3
  - @ledgerhq/hw-transport@6.35.7
  - @ledgerhq/live-signer-aleo@0.19.4
  - @ledgerhq/live-signer-canton@0.9.13
  - @ledgerhq/live-signer-concordium@0.6.3
  - @ledgerhq/live-signer-cosmos@0.4.3
  - @ledgerhq/live-signer-hyperliquid@1.3.2
  - @ledgerhq/live-signer-solana@0.18.2
  - @ledgerhq/live-countervalues-react@0.16.4
  - @ledgerhq/live-wallet@0.30.1
  - @ledgerhq/ledger-trust-service@0.8.11
  - @domain/api-currency-token@0.2.3
  - @ledgerhq/asset-aggregation@0.12.1
  - @ledgerhq/live-currency-format@0.14.1
  - @features/platform-feature-flags@0.6.3
  - @ledgerhq/evm-tools@1.13.2
  - @shared/env@0.1.1
  - @ledgerhq/hw-app-eth@7.8.12
  - @ledgerhq/hw-app-btc@11.3.1
  - @ledgerhq/hw-app-multiversx@6.30.7
  - @ledgerhq/hw-app-near@6.35.7
  - @ledgerhq/hw-app-str@7.7.7
  - @ledgerhq/hw-app-tezos@6.36.7
  - @ledgerhq/hw-app-trx@6.36.6
  - @ledgerhq/hw-app-xrp@6.37.7
  - @ledgerhq/hw-bolos@6.36.7
  - @ledgerhq/hw-transport-mocker@6.34.7
  - @ledgerhq/live-dmk-shared@0.29.1
  - @ledgerhq/speculos-transport@0.10.9
  - @features/platform-env@0.1.1
  - @ledgerhq/hw-app-sui@1.11.4

## 37.0.0-next.1

### Patch Changes

- Updated dependencies [[`f79de59`](https://github.com/LedgerHQ/ledger-live/commit/f79de59f95ed384fc2b2e49dfa28efb1a0493d4a)]:
  - @ledgerhq/coin-bitcoin@0.49.0-next.1

## 37.0.0-next.0

### Major Changes

- [#19670](https://github.com/LedgerHQ/ledger-live/pull/19670) [`008228e`](https://github.com/LedgerHQ/ledger-live/commit/008228ee22ba86b8aabe50c50d9c2e5e63771add) Thanks [@jcchevalier-ledger](https://github.com/jcchevalier-ledger)! - Replace transaction alert address updates with account reconciliation

### Minor Changes

- [#20129](https://github.com/LedgerHQ/ledger-live/pull/20129) [`ba20e39`](https://github.com/LedgerHQ/ledger-live/commit/ba20e3926e52284c04c9bc4e4b17b7c5e34b3cb5) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Migrate `checkLibs` and its two callers off `@ledgerhq/errors` as part of the errors sunset (LIVE-32915).

  `checkLibs` detects duplicated npm packages by comparing class identity, so `sanityChecks.ts` and both app entrypoints must import `NotEnoughBalance` from the same module. All three now use `@ledgerhq/ledger-wallet-framework/errors`. The duplicate-package warning also names `@ledgerhq/ledger-wallet-framework` so the `pnpm why` hint points at the package actually being checked.

- [#20099](https://github.com/LedgerHQ/ledger-live/pull/20099) [`37dac39`](https://github.com/LedgerHQ/ledger-live/commit/37dac39463de1a44bdb5bc4b1b6b37b0cff68922) Thanks [@deepyjr](https://github.com/deepyjr)! - Add contact address asset and network selection through the Modular Dialog, with shared asset
  filtering across Desktop and Mobile.

- [#20139](https://github.com/LedgerHQ/ledger-live/pull/20139) [`cee41c4`](https://github.com/LedgerHQ/ledger-live/commit/cee41c4e7a7c7e042d4df39d5a34591d72d723d0) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(evm): keep legacy custom fees on non-EIP-1559 chains like Ethereum Classic

- [#20009](https://github.com/LedgerHQ/ledger-live/pull/20009) [`341ea10`](https://github.com/LedgerHQ/ledger-live/commit/341ea108e30bf8af9abeb6eed484ee4b2c7c4a43) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Revert Cardano firmware app v8.0.4 support (hw-app-cardano bump to 8.0.0)

- [#19805](https://github.com/LedgerHQ/ledger-live/pull/19805) [`b1d3f26`](https://github.com/LedgerHQ/ledger-live/commit/b1d3f26cbdf67c439bc125bdda1f1c56c9753f2e) Thanks [@ishaba](https://github.com/ishaba)! - feat(send): add default-fee strategy to the new send flow

- [#20180](https://github.com/LedgerHQ/ledger-live/pull/20180) [`dd7758b`](https://github.com/LedgerHQ/ledger-live/commit/dd7758bfa16c6b73b60da072a50c22f3b132c1a2) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Show 8 characters on each side of the ellipsis when truncating the recipient address in the new send flow, consistently across mobile and desktop

- [#19996](https://github.com/LedgerHQ/ledger-live/pull/19996) [`c9dddf2`](https://github.com/LedgerHQ/ledger-live/commit/c9dddf21f6e3208a077aa72bd575f56415287074) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwm): changes bottomsheet to sheet info and minor fixes on lwm

- [#20127](https://github.com/LedgerHQ/ledger-live/pull/20127) [`e7b8ddc`](https://github.com/LedgerHQ/ledger-live/commit/e7b8ddc239b88c1fbf0751c468218d9263f56859) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: aleo tokens swap incompatibility warning

- [#19690](https://github.com/LedgerHQ/ledger-live/pull/19690) [`e6a9b97`](https://github.com/LedgerHQ/ledger-live/commit/e6a9b973d05af98987c094d591342031f273b31c) Thanks [@CremaFR](https://github.com/CremaFR)! - feat(swap): enrich the device's generic payload deserialization error with the exact Exchange app protobuf field that exceeds its limit

  When the Exchange device app rejects a swap `NewTransactionResponse` with the generic `DESERIALIZATION_FAILED` (0x6a81) status, we now decode the payload locally and, if a field is larger than the device's protobuf `max_size` (mirrored from app-exchange `protocol.options`), surface a precise `SwapPayloadFieldExceedsLimit` carrying the field name, limit and actual size (e.g. an oversized `payin_extra_id`).

  The device remains the source of truth: this check only runs **after** the device has already rejected the payload, never gates the flow, and silently falls back to the device's error if our hardcoded limits ever drift from the app. The user-facing flow and step (`PROCESS_TRANSACTION`) are unchanged; the added precision is only meant to speed up investigations.

- [#19215](https://github.com/LedgerHQ/ledger-live/pull/19215) [`dfab01f`](https://github.com/LedgerHQ/ledger-live/commit/dfab01f36460bd4e0ea0b0c13aa3d965aef945cd) Thanks [@CremaFR](https://github.com/CremaFR)! - Add a Device Intent Executor based signing path for Wallet API `transaction.sign` and `message.sign` on Ledger Wallet Mobile, gated behind the new `llmWalletApiDeviceIntentSign` feature flag (per-manifest allow-list, off by default). Introduces the `signMessageIntent` module in live-common.

- [#20190](https://github.com/LedgerHQ/ledger-live/pull/20190) [`a8d6e25`](https://github.com/LedgerHQ/ledger-live/commit/a8d6e25c0467572fbbc0cd3b35f90d355542b1f7) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(lwdm): new send flow wait for valid address to display memo

### Patch Changes

- Updated dependencies [[`1070564`](https://github.com/LedgerHQ/ledger-live/commit/107056410174d3da2d45c468232a8d742aea021f), [`2e1aecc`](https://github.com/LedgerHQ/ledger-live/commit/2e1aeccf6c91761c5d09c91e4be10dcc8c22eb7b), [`ba69273`](https://github.com/LedgerHQ/ledger-live/commit/ba692732b521c42f934acf540641ecbfdb837004), [`24d60d7`](https://github.com/LedgerHQ/ledger-live/commit/24d60d7628696b58764f8fbd4495140a049b3fcc), [`1af9ec9`](https://github.com/LedgerHQ/ledger-live/commit/1af9ec984928e0bf5fd23ce12edcc6131b0302a0), [`f5e4e87`](https://github.com/LedgerHQ/ledger-live/commit/f5e4e87a114ca8336f310a4b5e39bff650fc0750), [`6ac54ab`](https://github.com/LedgerHQ/ledger-live/commit/6ac54abe700847501356adc11231f8437d4a5817), [`cee41c4`](https://github.com/LedgerHQ/ledger-live/commit/cee41c4e7a7c7e042d4df39d5a34591d72d723d0), [`8ab9e50`](https://github.com/LedgerHQ/ledger-live/commit/8ab9e504a5b004e28f5e80f490b837b3c2526f44), [`4148019`](https://github.com/LedgerHQ/ledger-live/commit/414801922232b6d9514270e8876e783c11555c2c), [`1e4e519`](https://github.com/LedgerHQ/ledger-live/commit/1e4e51913a9b1971056789ac24ed05092529d799), [`52253f7`](https://github.com/LedgerHQ/ledger-live/commit/52253f70c302056cdc6b367cdd8b1db408b5e07d), [`4ce5257`](https://github.com/LedgerHQ/ledger-live/commit/4ce52570577d471d4af0609058ac6b9b03ad1949), [`452adf8`](https://github.com/LedgerHQ/ledger-live/commit/452adf85380d1cb74f1894478cdd84849b120ef4), [`44798f3`](https://github.com/LedgerHQ/ledger-live/commit/44798f392deb662a5f60123651ece2b320fbf946), [`d7600fb`](https://github.com/LedgerHQ/ledger-live/commit/d7600fb21e73581fbfb20019a78109b9a5c9abff), [`a534db5`](https://github.com/LedgerHQ/ledger-live/commit/a534db5c41da6957d38a330c1da6f7db1b693763), [`c622459`](https://github.com/LedgerHQ/ledger-live/commit/c622459fcbff5dcc094ee10eb360f2a835036007), [`d08f2bc`](https://github.com/LedgerHQ/ledger-live/commit/d08f2bccae5f94a339206ec703c8d16139f6cbc9), [`9fe07f0`](https://github.com/LedgerHQ/ledger-live/commit/9fe07f0f618e6cde963c922f271ad5d7b29dbce7), [`e6a9b97`](https://github.com/LedgerHQ/ledger-live/commit/e6a9b973d05af98987c094d591342031f273b31c), [`dbf8acf`](https://github.com/LedgerHQ/ledger-live/commit/dbf8acf27c9405548e7eb559d163a8e0883a20aa), [`51e7153`](https://github.com/LedgerHQ/ledger-live/commit/51e715314f2f89fbe76db1b69d878b4b250872e1), [`fb0f177`](https://github.com/LedgerHQ/ledger-live/commit/fb0f17772d553ebe985fd59240b24d9fdbf0e0db), [`6e72b5a`](https://github.com/LedgerHQ/ledger-live/commit/6e72b5a2532eae19e6cc54405acab4c28f4f2f20), [`dfab01f`](https://github.com/LedgerHQ/ledger-live/commit/dfab01f36460bd4e0ea0b0c13aa3d965aef945cd), [`aa27732`](https://github.com/LedgerHQ/ledger-live/commit/aa2773257ffa4480b33c2a219c9986eb40e293fb), [`aa27732`](https://github.com/LedgerHQ/ledger-live/commit/aa2773257ffa4480b33c2a219c9986eb40e293fb), [`f8b5b51`](https://github.com/LedgerHQ/ledger-live/commit/f8b5b51856c57c68ca50d13b00d124d261c26504)]:
  - @ledgerhq/errors@7.0.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.6.0-next.0
  - @ledgerhq/coin-aleo@1.20.0-next.0
  - @ledgerhq/coin-algorand@1.11.0-next.0
  - @ledgerhq/coin-aptos@3.25.0-next.0
  - @ledgerhq/coin-bitcoin@0.49.0-next.0
  - @ledgerhq/coin-canton@0.31.0-next.0
  - @ledgerhq/coin-cardano@0.32.0-next.0
  - @ledgerhq/coin-casper@2.17.0-next.0
  - @ledgerhq/coin-celo@2.11.0-next.0
  - @ledgerhq/coin-concordium@0.18.0-next.0
  - @ledgerhq/coin-cosmos@0.41.0-next.0
  - @ledgerhq/coin-evm@4.8.0-next.0
  - @ledgerhq/coin-filecoin@1.30.0-next.0
  - @ledgerhq/coin-hedera@1.40.0-next.0
  - @ledgerhq/coin-icon@0.27.0-next.0
  - @ledgerhq/coin-internet_computer@1.27.0-next.0
  - @ledgerhq/coin-kaspa@1.21.0-next.0
  - @ledgerhq/coin-mina@1.19.0-next.0
  - @ledgerhq/coin-multiversx@0.22.0-next.0
  - @ledgerhq/coin-near@0.29.0-next.0
  - @ledgerhq/coin-polkadot@6.32.0-next.0
  - @ledgerhq/coin-solana@0.60.0-next.0
  - @ledgerhq/coin-stacks@0.26.0-next.0
  - @ledgerhq/coin-sui@0.42.0-next.0
  - @ledgerhq/coin-tezos@7.11.0-next.0
  - @ledgerhq/coin-ton@0.34.0-next.0
  - @ledgerhq/coin-tron@6.8.0-next.0
  - @ledgerhq/coin-vechain@2.27.0-next.0
  - @ledgerhq/live-network@3.0.0-next.0
  - @ledgerhq/ledger-cal-service@1.19.0-next.0
  - @domain/entity-currency-crypto@0.8.0-next.0
  - @domain/entity-currency-token@0.3.0-next.0
  - @domain/entity-currency@0.3.0-next.0
  - @ledgerhq/wallet-btc@0.3.0-next.0
  - @ledgerhq/live-countervalues@0.24.0-next.0
  - @shared/feature-flags@0.16.0-next.0
  - @ledgerhq/live-signer-evm@0.22.0-next.0
  - @ledgerhq/hw-app-exchange@0.24.0-next.0
  - @ledgerhq/live-signer-celo@1.2.0-next.0
  - @ledgerhq/device-core@0.11.9-next.0
  - @ledgerhq/domain-service@1.8.12-next.0
  - @ledgerhq/hw-app-algorand@6.35.7-next.0
  - @ledgerhq/hw-app-aptos@6.38.7-next.0
  - @ledgerhq/hw-app-hedera@1.6.7-next.0
  - @ledgerhq/hw-app-icon@1.7.7-next.0
  - @ledgerhq/hw-app-kaspa@1.7.7-next.0
  - @ledgerhq/hw-app-polkadot@6.38.7-next.0
  - @ledgerhq/hw-app-vet@0.13.3-next.0
  - @ledgerhq/hw-transport@6.35.7-next.0
  - @ledgerhq/live-signer-aleo@0.19.4-next.0
  - @ledgerhq/live-signer-canton@0.9.13-next.0
  - @ledgerhq/live-signer-concordium@0.6.3-next.0
  - @ledgerhq/live-signer-cosmos@0.4.3-next.0
  - @ledgerhq/live-signer-hyperliquid@1.3.2-next.0
  - @ledgerhq/live-signer-solana@0.18.2-next.0
  - @ledgerhq/live-countervalues-react@0.16.4-next.0
  - @ledgerhq/live-wallet@0.30.1-next.0
  - @ledgerhq/ledger-trust-service@0.8.11-next.0
  - @domain/api-currency-token@0.2.3-next.0
  - @ledgerhq/asset-aggregation@0.12.1-next.0
  - @ledgerhq/live-currency-format@0.14.1-next.0
  - @features/platform-feature-flags@0.6.3-next.0
  - @ledgerhq/evm-tools@1.13.2-next.0
  - @shared/env@0.1.1-next.0
  - @ledgerhq/hw-app-eth@7.8.12-next.0
  - @ledgerhq/hw-app-btc@11.3.1-next.0
  - @ledgerhq/hw-app-multiversx@6.30.7-next.0
  - @ledgerhq/hw-app-near@6.35.7-next.0
  - @ledgerhq/hw-app-str@7.7.7-next.0
  - @ledgerhq/hw-app-tezos@6.36.7-next.0
  - @ledgerhq/hw-app-trx@6.36.6-next.0
  - @ledgerhq/hw-app-xrp@6.37.7-next.0
  - @ledgerhq/hw-bolos@6.36.7-next.0
  - @ledgerhq/hw-transport-mocker@6.34.7-next.0
  - @ledgerhq/live-dmk-shared@0.29.1-next.0
  - @ledgerhq/speculos-transport@0.10.9-next.0
  - @features/platform-env@0.1.1-next.0
  - @ledgerhq/hw-app-sui@1.11.4

## 36.6.1

### Patch Changes

- Updated dependencies [[`d8cb7de`](https://github.com/LedgerHQ/ledger-live/commit/d8cb7deff30c3c1a88ae873d7bcddd6ce0d7375f)]:
  - @ledgerhq/coin-solana@0.59.1
  - @ledgerhq/live-signer-solana@0.18.1

## 36.6.1-hotfix.0

### Patch Changes

- Updated dependencies [[`d8cb7de`](https://github.com/LedgerHQ/ledger-live/commit/d8cb7deff30c3c1a88ae873d7bcddd6ce0d7375f)]:
  - @ledgerhq/coin-solana@0.59.1-hotfix.0
  - @ledgerhq/live-signer-solana@0.18.1-hotfix.0

## 36.6.0

### Minor Changes

- [#19818](https://github.com/LedgerHQ/ledger-live/pull/19818) [`f57602a`](https://github.com/LedgerHQ/ledger-live/commit/f57602a679ed08b437955a2858f84e3086d6e417) Thanks [@0xMM-L](https://github.com/0xMM-L)! - Enable Aleo as a swap currency. Register Aleo as Nano S–incompatible for swap (`INCOMPATIBLE_NANO_S_CURRENCY_KEYS`) with its incompatibility copy, and add Aleo to the live-countervalues mock registry so mocked countervalues cover it. Aleo becomes selectable as a swap source because the `aleo` family is present in `WALLET_API_FAMILIES` (via `@ledgerhq/wallet-api-core` `^1.35.0`, already a dependency), so it resolves through `currency.list`.

- [#19854](https://github.com/LedgerHQ/ledger-live/pull/19854) [`c3c5329`](https://github.com/LedgerHQ/ledger-live/commit/c3c5329ffe69ed47a1f3a8910ae7fd8b53486f24) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(algo): restore Algorand memo in new send flow with protocol 1024-byte note limit

- [#19865](https://github.com/LedgerHQ/ledger-live/pull/19865) [`7708345`](https://github.com/LedgerHQ/ledger-live/commit/77083455c985349f5a2061db4c22b2fa8ce758f9) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Remove partial app preparation from Device Intent Executor flows

- [#19540](https://github.com/LedgerHQ/ledger-live/pull/19540) [`a128521`](https://github.com/LedgerHQ/ledger-live/commit/a1285211f0482229e5011505fb9e8c9d473cb86a) Thanks [@adussarps](https://github.com/adussarps)! - Expose the read-only smart-contract call API on EVM external RPC nodes and explicitly reject it on unsupported coin modules.

- [#19794](https://github.com/LedgerHQ/ledger-live/pull/19794) [`2388d41`](https://github.com/LedgerHQ/ledger-live/commit/2388d4171bd2e5caa2009e8eadcd06548d2209ef) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Handle non-onboarded devices according to the requirements of each Connect App flow

- [#19625](https://github.com/LedgerHQ/ledger-live/pull/19625) [`28c29a1`](https://github.com/LedgerHQ/ledger-live/commit/28c29a1e6f4c28edfeba59483876b130a6e6b97c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove findCryptoCurrencyByTicker re-lookups in market counter-value formatting and detection paths

- [#19990](https://github.com/LedgerHQ/ledger-live/pull/19990) [`b2fe0f0`](https://github.com/LedgerHQ/ledger-live/commit/b2fe0f0b9bf9cb5976f4d7f21e24654d60acfcf2) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Revert Cardano firmware app v8.0.4 support (hw-app-cardano bump to 8.0.0)

- [#19762](https://github.com/LedgerHQ/ledger-live/pull/19762) [`cdf6cf4`](https://github.com/LedgerHQ/ledger-live/commit/cdf6cf40d658b20dd21a7eabe3615c75baf4cb0a) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: limit aleo swaps to public balance only

- [#19871](https://github.com/LedgerHQ/ledger-live/pull/19871) [`d243bd0`](https://github.com/LedgerHQ/ledger-live/commit/d243bd0cd2489a836961a724e60f6049a27f74d6) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(llc): consume `validateAddress` through `CoinModuleApi` instance

- [#19778](https://github.com/LedgerHQ/ledger-live/pull/19778) [`f6e5b74`](https://github.com/LedgerHQ/ledger-live/commit/f6e5b7453015db453e604052b115dd9996f266fa) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(lwdm): fix wrong memo label i18n id

- [#19738](https://github.com/LedgerHQ/ledger-live/pull/19738) [`22d4a88`](https://github.com/LedgerHQ/ledger-live/commit/22d4a888228b7e5409593a2d6af072b4ab07bb07) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-evm): store delegation shares

- [#19707](https://github.com/LedgerHQ/ledger-live/pull/19707) [`ea28df4`](https://github.com/LedgerHQ/ledger-live/commit/ea28df4a67e1c1f64ab0de5fddf7fc016edffa8c) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Hide Send and Receive for HyperCore accounts on desktop: HyperCore has no on-chain send on Ledger Wallet and a plain receive is misleading (deposits go through bridging). Both actions are now hidden across the account page, the account context menu and the empty-account state. Also drop the HyperCore per-transaction explorer view: the perps proxy exposes no HyperCore tx hash (deposits settle on Arbitrum, withdrawals expose no link), so the `tx` explorer URL was always broken — only the address explorer view is kept. Finally, the currency is renamed from "Hyperliquid (HyperCore)" to "Hyperliquid".

- [#19702](https://github.com/LedgerHQ/ledger-live/pull/19702) [`6935fe0`](https://github.com/LedgerHQ/ledger-live/commit/6935fe04a6304e046fd217350399446194e96d47) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Add HyperCore support by plugging `@ledgerhq/coin-hypercore` into the generic coin framework: register the `hypercore` native currency (USDC, magnitude 6), route the family through the generic bridge, reuse the EVM signer for address derivation (HyperCore shares the Ethereum address), and add the `currencyHypercore` feature flag. HyperCore accounts can be discovered and serve their balance and operations from the coin module. In the history, HyperCore operations are labelled "Deposit"/"Withdraw" instead of "Received"/"Sent" (deposits/withdrawals go through bridging, not a plain transfer).

- [#19896](https://github.com/LedgerHQ/ledger-live/pull/19896) [`9bca613`](https://github.com/LedgerHQ/ledger-live/commit/9bca6135575e4a05db6fdccffa61173b5a438115) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Give HyperCore its own lightweight setup/signer instead of reusing the EVM family's. HyperCore only derives an Ethereum-format address and never signs (no send flow), so its setup/signer now expose address derivation only (reusing the EVM getAddress resolver + the eth device signer's `getAddress`), keeping `ethers` and the transaction/message-signing code out of HyperCore's runtime graph.

- [#19592](https://github.com/LedgerHQ/ledger-live/pull/19592) [`5c5e022`](https://github.com/LedgerHQ/ledger-live/commit/5c5e022e870e44adcb59215e6a672838b0194310) Thanks [@vladyslavchupovskiy-ext-art](https://github.com/vladyslavchupovskiy-ext-art)! - Add the CoinModuleApi (Alpaca) implementation for native KAS to coin-kaspa (getBalance, lastBlock, listOperations, craftTransaction, estimateFees, combine, broadcast, validateIntent), registered in live-common alongside the existing account bridge.

- [#19858](https://github.com/LedgerHQ/ledger-live/pull/19858) [`404072e`](https://github.com/LedgerHQ/ledger-live/commit/404072eca7c9fa94ba4da55218504b9a5be07983) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - fix hedera url explorer

- [#19736](https://github.com/LedgerHQ/ledger-live/pull/19736) [`2eac6a1`](https://github.com/LedgerHQ/ledger-live/commit/2eac6a17b629be3f8ba08cdf650413083b89476e) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Extract the shared UTXO engine (xpub scanning, coin-selection, storage, address crypto) into a standalone `@ledgerhq/wallet-btc` package, dependency-inverted so it no longer imports `@ledgerhq/cryptoassets` or `@ledgerhq/ledger-wallet-framework`: the currency is injected as a typed `WalletBtcCurrency`. Transaction build/sign, RBF fee computation, the device signer, and the `getWalletAccount` resolver stay in `@ledgerhq/coin-bitcoin`. Internal refactor with no behavior change; consumers (`@ledgerhq/live-common`, `ledger-live-desktop`) are rewired to the new import paths.

- [#19760](https://github.com/LedgerHQ/ledger-live/pull/19760) [`f6ac3dd`](https://github.com/LedgerHQ/ledger-live/commit/f6ac3ddb1bc8fdbbe20cb4222b7229296f61bdba) Thanks [@ysitbon](https://github.com/ysitbon)! - Repoint all @ledgerhq/cryptoassets value imports in live-common to domain packages (@domain/entity-currency-crypto, @domain/entity-currency-fiat, @domain/api-currency-token) and @ledgerhq/ledger-wallet-framework/cryptoAssetsStore.

- [#19734](https://github.com/LedgerHQ/ledger-live/pull/19734) [`bb2d2d2`](https://github.com/LedgerHQ/ledger-live/commit/bb2d2d250a1d5b8cde43ba963795d28b10b48be6) Thanks [@ishaba](https://github.com/ishaba)! - remove umee chain related code

- [#19792](https://github.com/LedgerHQ/ledger-live/pull/19792) [`bd21084`](https://github.com/LedgerHQ/ledger-live/commit/bd21084eef567c13225adbd613eacc046856f9d7) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - change velora URLs

- [#19884](https://github.com/LedgerHQ/ledger-live/pull/19884) [`f9f5db4`](https://github.com/LedgerHQ/ledger-live/commit/f9f5db46534f5294fdbb3fe12a971ed4f11e6c2d) Thanks [@qperrot](https://github.com/qperrot)! - Add data-driven delegation-visibility-delay notice on the EVM staking delegate amount step (Somnia: 5 minutes)

- [#19797](https://github.com/LedgerHQ/ledger-live/pull/19797) [`93c54da`](https://github.com/LedgerHQ/ledger-live/commit/93c54daf4076e1163a9b7db86107ab2765b81b5d) Thanks [@ysitbon](https://github.com/ysitbon)! - Repoint remaining @ledgerhq/cryptoassets value-barrel imports to @domain/entity-currency-crypto and @domain/entity-currency-fiat; inline ApiAsset wire-type into the dada-client entities module; drop @ledgerhq/cryptoassets from wallet-cli devDependencies

- [#19918](https://github.com/LedgerHQ/ledger-live/pull/19918) [`b4ecf97`](https://github.com/LedgerHQ/ledger-live/commit/b4ecf97c0d16a686078c995f7218a256916a9e39) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - EVM staking: 0G unbonding table (skip completed entries), rewards column visibility per chain

- [#19796](https://github.com/LedgerHQ/ledger-live/pull/19796) [`36bbe18`](https://github.com/LedgerHQ/ledger-live/commit/36bbe18500ad6f7aeb74b4a5366994ec7495f761) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Fix custom fees on iOS in the new send flow: accept a comma decimal separator (normalized to a dot so the value is valid and can be confirmed), and dismiss the keyboard by tapping outside the inputs so the Confirm button is reachable

- [#19557](https://github.com/LedgerHQ/ledger-live/pull/19557) [`caa76a1`](https://github.com/LedgerHQ/ledger-live/commit/caa76a113979e2d06c6cb2bb950e75a1f33cbe20) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Integrate Tron tokens (TRC10/TRC20) into the generic coin framework so the same flows work through both the legacy bridge and the generic bridge:

  - Add a Tron family bridge API (`getTokenFromAsset`, `getAssetFromToken`, `computeIntentType`) and register it, so the generic framework can build token sub-accounts and craft token transfer intents.
  - Surface the token `assetOwner` from `getBalance` and the per-operation `ledgerOpType` from the TronGrid operation adapter, so token balances and operations attach to their sub-account.
  - Broadcast the generic-framework signed transaction as a byte-preserving full-transaction hex (`/wallet/broadcasthex`) instead of re-decoding `raw_data`, which was lossy for `TransferAssetContract` (TRC10) and `TriggerSmartContract` (TRC20).
  - Implement `validateIntent` and `getNextSequence` in the Tron coin-module API and add Tron native send support to the generic coin framework default transaction.

- [#19533](https://github.com/LedgerHQ/ledger-live/pull/19533) [`d63b9ef`](https://github.com/LedgerHQ/ledger-live/commit/d63b9efdc035ddc33a11fcc6877cd6b63f22ec3e) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Add a TRON send-flow network-fees explanation on the amount screen. The fee row now shows the cost in both fiat and TRX (e.g. `$4.12 • 0.000056 TRX`, or `$0 • 0 TRX` when staked energy and bandwidth cover the transfer), and an info tooltip (desktop) / drawer (mobile) explains whether resources cover the fee or it is paid by burning TRX. Implemented via two family-agnostic send-descriptor accessors (`getNetworkFeesInfo` for the copy, `showFeeCurrencyAmount` for the fee-row display). Other currencies are unchanged.

### Patch Changes

- Updated dependencies [[`f57602a`](https://github.com/LedgerHQ/ledger-live/commit/f57602a679ed08b437955a2858f84e3086d6e417), [`0ee3ad8`](https://github.com/LedgerHQ/ledger-live/commit/0ee3ad8ef853baa7b17bb4ca07f41f1bed12268e), [`c3c5329`](https://github.com/LedgerHQ/ledger-live/commit/c3c5329ffe69ed47a1f3a8910ae7fd8b53486f24), [`a306abb`](https://github.com/LedgerHQ/ledger-live/commit/a306abbb605751b5b8741d8d7d69d2bf7f78a49b), [`12941eb`](https://github.com/LedgerHQ/ledger-live/commit/12941eb6e717314c98a779f3ea499600fa23b213), [`a128521`](https://github.com/LedgerHQ/ledger-live/commit/a1285211f0482229e5011505fb9e8c9d473cb86a), [`2388d41`](https://github.com/LedgerHQ/ledger-live/commit/2388d4171bd2e5caa2009e8eadcd06548d2209ef), [`6ed8225`](https://github.com/LedgerHQ/ledger-live/commit/6ed8225f2434f70d587aa046e39262c21b538f27), [`a63d12c`](https://github.com/LedgerHQ/ledger-live/commit/a63d12c528c77bbd5d092cacfbabf576582ba13c), [`84e1dd9`](https://github.com/LedgerHQ/ledger-live/commit/84e1dd9f8bcba585aba241b0cacb63893af75093), [`d243bd0`](https://github.com/LedgerHQ/ledger-live/commit/d243bd0cd2489a836961a724e60f6049a27f74d6), [`22d4a88`](https://github.com/LedgerHQ/ledger-live/commit/22d4a888228b7e5409593a2d6af072b4ab07bb07), [`105ef90`](https://github.com/LedgerHQ/ledger-live/commit/105ef905bdb80022997d86729ccddbc220841bae), [`54f1527`](https://github.com/LedgerHQ/ledger-live/commit/54f152730b059d48ff2b14394b405606e08a886a), [`ea28df4`](https://github.com/LedgerHQ/ledger-live/commit/ea28df4a67e1c1f64ab0de5fddf7fc016edffa8c), [`6935fe0`](https://github.com/LedgerHQ/ledger-live/commit/6935fe04a6304e046fd217350399446194e96d47), [`ecab681`](https://github.com/LedgerHQ/ledger-live/commit/ecab68164ad6401d91569e2eecaeb8d12d126126), [`5c5e022`](https://github.com/LedgerHQ/ledger-live/commit/5c5e022e870e44adcb59215e6a672838b0194310), [`762b5eb`](https://github.com/LedgerHQ/ledger-live/commit/762b5ebf332566879a10ab1f16ef85a3da360fe7), [`2eac6a1`](https://github.com/LedgerHQ/ledger-live/commit/2eac6a17b629be3f8ba08cdf650413083b89476e), [`e7caf31`](https://github.com/LedgerHQ/ledger-live/commit/e7caf310efbbf82aa777a7e86ceafe60f11e7193), [`a4b09cf`](https://github.com/LedgerHQ/ledger-live/commit/a4b09cf063a0042a4ba31c350327e8d0ac9aa90c), [`bb2d2d2`](https://github.com/LedgerHQ/ledger-live/commit/bb2d2d250a1d5b8cde43ba963795d28b10b48be6), [`e2e5982`](https://github.com/LedgerHQ/ledger-live/commit/e2e59825b0b216e3b21deb51ae4170486ce7bc4b), [`669a6d4`](https://github.com/LedgerHQ/ledger-live/commit/669a6d42b2178451e27383c746e3f8fd3d34caef), [`59a6c82`](https://github.com/LedgerHQ/ledger-live/commit/59a6c82a784b4f484b5fb6a5ea42b6ebb1115818), [`c498e25`](https://github.com/LedgerHQ/ledger-live/commit/c498e25ca9f4b6ef5c4e3dfd370dab44ccdebc0f), [`e1496c5`](https://github.com/LedgerHQ/ledger-live/commit/e1496c5a5b4ab0a2378332d945d81434f58ad503), [`3d5b0a3`](https://github.com/LedgerHQ/ledger-live/commit/3d5b0a3a005a0f341e1ce49c2c33668d7fdfe9c6), [`d50d169`](https://github.com/LedgerHQ/ledger-live/commit/d50d16989e968fbb3ff45f6c463cae886e0e566a), [`93194e4`](https://github.com/LedgerHQ/ledger-live/commit/93194e4a6efbdb3ae54c0784e604edaa76e342c7), [`f9f5db4`](https://github.com/LedgerHQ/ledger-live/commit/f9f5db46534f5294fdbb3fe12a971ed4f11e6c2d), [`887f8c9`](https://github.com/LedgerHQ/ledger-live/commit/887f8c93e66c2730cbecc1adc09b6a2faa95bba6), [`01a7113`](https://github.com/LedgerHQ/ledger-live/commit/01a71130ab7219637d23222de544e97e668bba47), [`b4ecf97`](https://github.com/LedgerHQ/ledger-live/commit/b4ecf97c0d16a686078c995f7218a256916a9e39), [`b38b0b1`](https://github.com/LedgerHQ/ledger-live/commit/b38b0b13e8e5c01800bf1234c7ee0f454b04f5cc), [`4d99006`](https://github.com/LedgerHQ/ledger-live/commit/4d99006589b6855d1a06a8aa1ece23c3f6f3ddf7), [`132a4f9`](https://github.com/LedgerHQ/ledger-live/commit/132a4f90adc816f69dfbde1b28e120ad501004c5), [`caa76a1`](https://github.com/LedgerHQ/ledger-live/commit/caa76a113979e2d06c6cb2bb950e75a1f33cbe20)]:
  - @ledgerhq/live-countervalues@0.23.0
  - @ledgerhq/asset-aggregation@0.12.0
  - @ledgerhq/live-wallet@0.30.0
  - @ledgerhq/coin-algorand@1.10.0
  - @ledgerhq/coin-evm@4.7.0
  - @ledgerhq/coin-hedera@1.39.0
  - @ledgerhq/coin-aleo@1.19.0
  - @ledgerhq/coin-aptos@3.24.0
  - @ledgerhq/coin-canton@0.30.0
  - @ledgerhq/coin-cardano@0.31.0
  - @ledgerhq/coin-celo@2.10.0
  - @ledgerhq/coin-concordium@0.17.0
  - @ledgerhq/coin-filecoin@1.29.0
  - @ledgerhq/coin-multiversx@0.21.0
  - @ledgerhq/coin-polkadot@6.31.0
  - @ledgerhq/coin-solana@0.59.0
  - @ledgerhq/coin-sui@0.41.0
  - @ledgerhq/coin-tezos@7.10.0
  - @ledgerhq/coin-tron@6.7.0
  - @ledgerhq/live-dmk-shared@0.29.0
  - @ledgerhq/live-currency-format@0.14.0
  - @domain/entity-currency-crypto@0.7.0
  - @ledgerhq/coin-internet_computer@1.26.0
  - @ledgerhq/coin-kaspa@1.20.0
  - @ledgerhq/wallet-btc@0.2.0
  - @ledgerhq/coin-bitcoin@0.48.0
  - @ledgerhq/live-network@2.7.0
  - @ledgerhq/coin-cosmos@0.40.0
  - @shared/feature-flags@0.15.0
  - @ledgerhq/live-signer-solana@0.18.0
  - @ledgerhq/coin-stacks@0.25.0
  - @ledgerhq/coin-ton@0.33.0
  - @ledgerhq/coin-vechain@2.26.0
  - @ledgerhq/ledger-wallet-framework@2.5.0
  - @ledgerhq/live-countervalues-react@0.16.3
  - @ledgerhq/live-signer-aleo@0.19.3
  - @ledgerhq/live-signer-canton@0.9.12
  - @ledgerhq/live-signer-celo@1.1.8
  - @ledgerhq/live-signer-concordium@0.6.2
  - @ledgerhq/live-signer-evm@0.21.2
  - @ledgerhq/coin-casper@2.16.1
  - @ledgerhq/coin-icon@0.26.1
  - @ledgerhq/coin-mina@1.18.1
  - @ledgerhq/coin-near@0.28.1
  - @ledgerhq/device-core@0.11.8
  - @ledgerhq/domain-service@1.8.11
  - @ledgerhq/evm-tools@1.13.1
  - @ledgerhq/hw-app-eth@7.8.11
  - @ledgerhq/live-signer-cosmos@0.4.2
  - @domain/api-currency-token@0.2.2
  - @ledgerhq/ledger-cal-service@1.18.5
  - @ledgerhq/ledger-trust-service@0.8.10
  - @features/platform-feature-flags@0.6.2

## 36.6.0-next.1

### Minor Changes

- [#19990](https://github.com/LedgerHQ/ledger-live/pull/19990) [`b2fe0f0`](https://github.com/LedgerHQ/ledger-live/commit/b2fe0f0b9bf9cb5976f4d7f21e24654d60acfcf2) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Revert Cardano firmware app v8.0.4 support (hw-app-cardano bump to 8.0.0)

## 36.6.0-next.0

### Minor Changes

- [#19818](https://github.com/LedgerHQ/ledger-live/pull/19818) [`f57602a`](https://github.com/LedgerHQ/ledger-live/commit/f57602a679ed08b437955a2858f84e3086d6e417) Thanks [@0xMM-L](https://github.com/0xMM-L)! - Enable Aleo as a swap currency. Register Aleo as Nano S–incompatible for swap (`INCOMPATIBLE_NANO_S_CURRENCY_KEYS`) with its incompatibility copy, and add Aleo to the live-countervalues mock registry so mocked countervalues cover it. Aleo becomes selectable as a swap source because the `aleo` family is present in `WALLET_API_FAMILIES` (via `@ledgerhq/wallet-api-core` `^1.35.0`, already a dependency), so it resolves through `currency.list`.

- [#19854](https://github.com/LedgerHQ/ledger-live/pull/19854) [`c3c5329`](https://github.com/LedgerHQ/ledger-live/commit/c3c5329ffe69ed47a1f3a8910ae7fd8b53486f24) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(algo): restore Algorand memo in new send flow with protocol 1024-byte note limit

- [#19865](https://github.com/LedgerHQ/ledger-live/pull/19865) [`7708345`](https://github.com/LedgerHQ/ledger-live/commit/77083455c985349f5a2061db4c22b2fa8ce758f9) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Remove partial app preparation from Device Intent Executor flows

- [#19540](https://github.com/LedgerHQ/ledger-live/pull/19540) [`a128521`](https://github.com/LedgerHQ/ledger-live/commit/a1285211f0482229e5011505fb9e8c9d473cb86a) Thanks [@adussarps](https://github.com/adussarps)! - Expose the read-only smart-contract call API on EVM external RPC nodes and explicitly reject it on unsupported coin modules.

- [#19794](https://github.com/LedgerHQ/ledger-live/pull/19794) [`2388d41`](https://github.com/LedgerHQ/ledger-live/commit/2388d4171bd2e5caa2009e8eadcd06548d2209ef) Thanks [@OlivierFreyssinet](https://github.com/OlivierFreyssinet)! - Handle non-onboarded devices according to the requirements of each Connect App flow

- [#19625](https://github.com/LedgerHQ/ledger-live/pull/19625) [`28c29a1`](https://github.com/LedgerHQ/ledger-live/commit/28c29a1e6f4c28edfeba59483876b130a6e6b97c) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove findCryptoCurrencyByTicker re-lookups in market counter-value formatting and detection paths

- [#19762](https://github.com/LedgerHQ/ledger-live/pull/19762) [`cdf6cf4`](https://github.com/LedgerHQ/ledger-live/commit/cdf6cf40d658b20dd21a7eabe3615c75baf4cb0a) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: limit aleo swaps to public balance only

- [#19871](https://github.com/LedgerHQ/ledger-live/pull/19871) [`d243bd0`](https://github.com/LedgerHQ/ledger-live/commit/d243bd0cd2489a836961a724e60f6049a27f74d6) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(llc): consume `validateAddress` through `CoinModuleApi` instance

- [#19778](https://github.com/LedgerHQ/ledger-live/pull/19778) [`f6e5b74`](https://github.com/LedgerHQ/ledger-live/commit/f6e5b7453015db453e604052b115dd9996f266fa) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(lwdm): fix wrong memo label i18n id

- [#19738](https://github.com/LedgerHQ/ledger-live/pull/19738) [`22d4a88`](https://github.com/LedgerHQ/ledger-live/commit/22d4a888228b7e5409593a2d6af072b4ab07bb07) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-evm): store delegation shares

- [#19707](https://github.com/LedgerHQ/ledger-live/pull/19707) [`ea28df4`](https://github.com/LedgerHQ/ledger-live/commit/ea28df4a67e1c1f64ab0de5fddf7fc016edffa8c) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Hide Send and Receive for HyperCore accounts on desktop: HyperCore has no on-chain send on Ledger Wallet and a plain receive is misleading (deposits go through bridging). Both actions are now hidden across the account page, the account context menu and the empty-account state. Also drop the HyperCore per-transaction explorer view: the perps proxy exposes no HyperCore tx hash (deposits settle on Arbitrum, withdrawals expose no link), so the `tx` explorer URL was always broken — only the address explorer view is kept. Finally, the currency is renamed from "Hyperliquid (HyperCore)" to "Hyperliquid".

- [#19702](https://github.com/LedgerHQ/ledger-live/pull/19702) [`6935fe0`](https://github.com/LedgerHQ/ledger-live/commit/6935fe04a6304e046fd217350399446194e96d47) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Add HyperCore support by plugging `@ledgerhq/coin-hypercore` into the generic coin framework: register the `hypercore` native currency (USDC, magnitude 6), route the family through the generic bridge, reuse the EVM signer for address derivation (HyperCore shares the Ethereum address), and add the `currencyHypercore` feature flag. HyperCore accounts can be discovered and serve their balance and operations from the coin module. In the history, HyperCore operations are labelled "Deposit"/"Withdraw" instead of "Received"/"Sent" (deposits/withdrawals go through bridging, not a plain transfer).

- [#19896](https://github.com/LedgerHQ/ledger-live/pull/19896) [`9bca613`](https://github.com/LedgerHQ/ledger-live/commit/9bca6135575e4a05db6fdccffa61173b5a438115) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Give HyperCore its own lightweight setup/signer instead of reusing the EVM family's. HyperCore only derives an Ethereum-format address and never signs (no send flow), so its setup/signer now expose address derivation only (reusing the EVM getAddress resolver + the eth device signer's `getAddress`), keeping `ethers` and the transaction/message-signing code out of HyperCore's runtime graph.

- [#19592](https://github.com/LedgerHQ/ledger-live/pull/19592) [`5c5e022`](https://github.com/LedgerHQ/ledger-live/commit/5c5e022e870e44adcb59215e6a672838b0194310) Thanks [@vladyslavchupovskiy-ext-art](https://github.com/vladyslavchupovskiy-ext-art)! - Add the CoinModuleApi (Alpaca) implementation for native KAS to coin-kaspa (getBalance, lastBlock, listOperations, craftTransaction, estimateFees, combine, broadcast, validateIntent), registered in live-common alongside the existing account bridge.

- [#19858](https://github.com/LedgerHQ/ledger-live/pull/19858) [`404072e`](https://github.com/LedgerHQ/ledger-live/commit/404072eca7c9fa94ba4da55218504b9a5be07983) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - fix hedera url explorer

- [#19587](https://github.com/LedgerHQ/ledger-live/pull/19587) [`22afc34`](https://github.com/LedgerHQ/ledger-live/commit/22afc34ac1ff55448414e85227c2d6da96395153) Thanks [@shazzzam](https://github.com/shazzzam)! - Support Cardano firmware app v8.0.4 by bumping @cardano-foundation/ledgerjs-hw-app-cardano from 7.x to 8.0.0. The v7 host binding used an older APDU protocol incompatible with the rewritten v8 device app, breaking account scan, receive and signing flows on firmware 8.0.4. Also raise the Cardano nano app minVersion to 8.0.4 so users on an incompatible older app are prompted to update instead of hitting broken flows.

- [#19736](https://github.com/LedgerHQ/ledger-live/pull/19736) [`2eac6a1`](https://github.com/LedgerHQ/ledger-live/commit/2eac6a17b629be3f8ba08cdf650413083b89476e) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Extract the shared UTXO engine (xpub scanning, coin-selection, storage, address crypto) into a standalone `@ledgerhq/wallet-btc` package, dependency-inverted so it no longer imports `@ledgerhq/cryptoassets` or `@ledgerhq/ledger-wallet-framework`: the currency is injected as a typed `WalletBtcCurrency`. Transaction build/sign, RBF fee computation, the device signer, and the `getWalletAccount` resolver stay in `@ledgerhq/coin-bitcoin`. Internal refactor with no behavior change; consumers (`@ledgerhq/live-common`, `ledger-live-desktop`) are rewired to the new import paths.

- [#19760](https://github.com/LedgerHQ/ledger-live/pull/19760) [`f6ac3dd`](https://github.com/LedgerHQ/ledger-live/commit/f6ac3ddb1bc8fdbbe20cb4222b7229296f61bdba) Thanks [@ysitbon](https://github.com/ysitbon)! - Repoint all @ledgerhq/cryptoassets value imports in live-common to domain packages (@domain/entity-currency-crypto, @domain/entity-currency-fiat, @domain/api-currency-token) and @ledgerhq/ledger-wallet-framework/cryptoAssetsStore.

- [#19734](https://github.com/LedgerHQ/ledger-live/pull/19734) [`bb2d2d2`](https://github.com/LedgerHQ/ledger-live/commit/bb2d2d250a1d5b8cde43ba963795d28b10b48be6) Thanks [@ishaba](https://github.com/ishaba)! - remove umee chain related code

- [#19792](https://github.com/LedgerHQ/ledger-live/pull/19792) [`bd21084`](https://github.com/LedgerHQ/ledger-live/commit/bd21084eef567c13225adbd613eacc046856f9d7) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - change velora URLs

- [#19884](https://github.com/LedgerHQ/ledger-live/pull/19884) [`f9f5db4`](https://github.com/LedgerHQ/ledger-live/commit/f9f5db46534f5294fdbb3fe12a971ed4f11e6c2d) Thanks [@qperrot](https://github.com/qperrot)! - Add data-driven delegation-visibility-delay notice on the EVM staking delegate amount step (Somnia: 5 minutes)

- [#19797](https://github.com/LedgerHQ/ledger-live/pull/19797) [`93c54da`](https://github.com/LedgerHQ/ledger-live/commit/93c54daf4076e1163a9b7db86107ab2765b81b5d) Thanks [@ysitbon](https://github.com/ysitbon)! - Repoint remaining @ledgerhq/cryptoassets value-barrel imports to @domain/entity-currency-crypto and @domain/entity-currency-fiat; inline ApiAsset wire-type into the dada-client entities module; drop @ledgerhq/cryptoassets from wallet-cli devDependencies

- [#19918](https://github.com/LedgerHQ/ledger-live/pull/19918) [`b4ecf97`](https://github.com/LedgerHQ/ledger-live/commit/b4ecf97c0d16a686078c995f7218a256916a9e39) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - EVM staking: 0G unbonding table (skip completed entries), rewards column visibility per chain

- [#19796](https://github.com/LedgerHQ/ledger-live/pull/19796) [`36bbe18`](https://github.com/LedgerHQ/ledger-live/commit/36bbe18500ad6f7aeb74b4a5366994ec7495f761) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Fix custom fees on iOS in the new send flow: accept a comma decimal separator (normalized to a dot so the value is valid and can be confirmed), and dismiss the keyboard by tapping outside the inputs so the Confirm button is reachable

- [#19557](https://github.com/LedgerHQ/ledger-live/pull/19557) [`caa76a1`](https://github.com/LedgerHQ/ledger-live/commit/caa76a113979e2d06c6cb2bb950e75a1f33cbe20) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Integrate Tron tokens (TRC10/TRC20) into the generic coin framework so the same flows work through both the legacy bridge and the generic bridge:

  - Add a Tron family bridge API (`getTokenFromAsset`, `getAssetFromToken`, `computeIntentType`) and register it, so the generic framework can build token sub-accounts and craft token transfer intents.
  - Surface the token `assetOwner` from `getBalance` and the per-operation `ledgerOpType` from the TronGrid operation adapter, so token balances and operations attach to their sub-account.
  - Broadcast the generic-framework signed transaction as a byte-preserving full-transaction hex (`/wallet/broadcasthex`) instead of re-decoding `raw_data`, which was lossy for `TransferAssetContract` (TRC10) and `TriggerSmartContract` (TRC20).
  - Implement `validateIntent` and `getNextSequence` in the Tron coin-module API and add Tron native send support to the generic coin framework default transaction.

- [#19533](https://github.com/LedgerHQ/ledger-live/pull/19533) [`d63b9ef`](https://github.com/LedgerHQ/ledger-live/commit/d63b9efdc035ddc33a11fcc6877cd6b63f22ec3e) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Add a TRON send-flow network-fees explanation on the amount screen. The fee row now shows the cost in both fiat and TRX (e.g. `$4.12 • 0.000056 TRX`, or `$0 • 0 TRX` when staked energy and bandwidth cover the transfer), and an info tooltip (desktop) / drawer (mobile) explains whether resources cover the fee or it is paid by burning TRX. Implemented via two family-agnostic send-descriptor accessors (`getNetworkFeesInfo` for the copy, `showFeeCurrencyAmount` for the fee-row display). Other currencies are unchanged.

### Patch Changes

- Updated dependencies [[`f57602a`](https://github.com/LedgerHQ/ledger-live/commit/f57602a679ed08b437955a2858f84e3086d6e417), [`0ee3ad8`](https://github.com/LedgerHQ/ledger-live/commit/0ee3ad8ef853baa7b17bb4ca07f41f1bed12268e), [`c3c5329`](https://github.com/LedgerHQ/ledger-live/commit/c3c5329ffe69ed47a1f3a8910ae7fd8b53486f24), [`a306abb`](https://github.com/LedgerHQ/ledger-live/commit/a306abbb605751b5b8741d8d7d69d2bf7f78a49b), [`12941eb`](https://github.com/LedgerHQ/ledger-live/commit/12941eb6e717314c98a779f3ea499600fa23b213), [`a128521`](https://github.com/LedgerHQ/ledger-live/commit/a1285211f0482229e5011505fb9e8c9d473cb86a), [`2388d41`](https://github.com/LedgerHQ/ledger-live/commit/2388d4171bd2e5caa2009e8eadcd06548d2209ef), [`6ed8225`](https://github.com/LedgerHQ/ledger-live/commit/6ed8225f2434f70d587aa046e39262c21b538f27), [`a63d12c`](https://github.com/LedgerHQ/ledger-live/commit/a63d12c528c77bbd5d092cacfbabf576582ba13c), [`84e1dd9`](https://github.com/LedgerHQ/ledger-live/commit/84e1dd9f8bcba585aba241b0cacb63893af75093), [`d243bd0`](https://github.com/LedgerHQ/ledger-live/commit/d243bd0cd2489a836961a724e60f6049a27f74d6), [`22d4a88`](https://github.com/LedgerHQ/ledger-live/commit/22d4a888228b7e5409593a2d6af072b4ab07bb07), [`105ef90`](https://github.com/LedgerHQ/ledger-live/commit/105ef905bdb80022997d86729ccddbc220841bae), [`54f1527`](https://github.com/LedgerHQ/ledger-live/commit/54f152730b059d48ff2b14394b405606e08a886a), [`ea28df4`](https://github.com/LedgerHQ/ledger-live/commit/ea28df4a67e1c1f64ab0de5fddf7fc016edffa8c), [`6935fe0`](https://github.com/LedgerHQ/ledger-live/commit/6935fe04a6304e046fd217350399446194e96d47), [`ecab681`](https://github.com/LedgerHQ/ledger-live/commit/ecab68164ad6401d91569e2eecaeb8d12d126126), [`5c5e022`](https://github.com/LedgerHQ/ledger-live/commit/5c5e022e870e44adcb59215e6a672838b0194310), [`762b5eb`](https://github.com/LedgerHQ/ledger-live/commit/762b5ebf332566879a10ab1f16ef85a3da360fe7), [`2eac6a1`](https://github.com/LedgerHQ/ledger-live/commit/2eac6a17b629be3f8ba08cdf650413083b89476e), [`e7caf31`](https://github.com/LedgerHQ/ledger-live/commit/e7caf310efbbf82aa777a7e86ceafe60f11e7193), [`a4b09cf`](https://github.com/LedgerHQ/ledger-live/commit/a4b09cf063a0042a4ba31c350327e8d0ac9aa90c), [`bb2d2d2`](https://github.com/LedgerHQ/ledger-live/commit/bb2d2d250a1d5b8cde43ba963795d28b10b48be6), [`e2e5982`](https://github.com/LedgerHQ/ledger-live/commit/e2e59825b0b216e3b21deb51ae4170486ce7bc4b), [`669a6d4`](https://github.com/LedgerHQ/ledger-live/commit/669a6d42b2178451e27383c746e3f8fd3d34caef), [`59a6c82`](https://github.com/LedgerHQ/ledger-live/commit/59a6c82a784b4f484b5fb6a5ea42b6ebb1115818), [`c498e25`](https://github.com/LedgerHQ/ledger-live/commit/c498e25ca9f4b6ef5c4e3dfd370dab44ccdebc0f), [`e1496c5`](https://github.com/LedgerHQ/ledger-live/commit/e1496c5a5b4ab0a2378332d945d81434f58ad503), [`3d5b0a3`](https://github.com/LedgerHQ/ledger-live/commit/3d5b0a3a005a0f341e1ce49c2c33668d7fdfe9c6), [`d50d169`](https://github.com/LedgerHQ/ledger-live/commit/d50d16989e968fbb3ff45f6c463cae886e0e566a), [`93194e4`](https://github.com/LedgerHQ/ledger-live/commit/93194e4a6efbdb3ae54c0784e604edaa76e342c7), [`f9f5db4`](https://github.com/LedgerHQ/ledger-live/commit/f9f5db46534f5294fdbb3fe12a971ed4f11e6c2d), [`887f8c9`](https://github.com/LedgerHQ/ledger-live/commit/887f8c93e66c2730cbecc1adc09b6a2faa95bba6), [`01a7113`](https://github.com/LedgerHQ/ledger-live/commit/01a71130ab7219637d23222de544e97e668bba47), [`b4ecf97`](https://github.com/LedgerHQ/ledger-live/commit/b4ecf97c0d16a686078c995f7218a256916a9e39), [`b38b0b1`](https://github.com/LedgerHQ/ledger-live/commit/b38b0b13e8e5c01800bf1234c7ee0f454b04f5cc), [`4d99006`](https://github.com/LedgerHQ/ledger-live/commit/4d99006589b6855d1a06a8aa1ece23c3f6f3ddf7), [`132a4f9`](https://github.com/LedgerHQ/ledger-live/commit/132a4f90adc816f69dfbde1b28e120ad501004c5), [`caa76a1`](https://github.com/LedgerHQ/ledger-live/commit/caa76a113979e2d06c6cb2bb950e75a1f33cbe20)]:
  - @ledgerhq/live-countervalues@0.23.0-next.0
  - @ledgerhq/asset-aggregation@0.12.0-next.0
  - @ledgerhq/live-wallet@0.30.0-next.0
  - @ledgerhq/coin-algorand@1.10.0-next.0
  - @ledgerhq/coin-evm@4.7.0-next.0
  - @ledgerhq/coin-hedera@1.39.0-next.0
  - @ledgerhq/coin-aleo@1.19.0-next.0
  - @ledgerhq/coin-aptos@3.24.0-next.0
  - @ledgerhq/coin-canton@0.30.0-next.0
  - @ledgerhq/coin-cardano@0.31.0-next.0
  - @ledgerhq/coin-celo@2.10.0-next.0
  - @ledgerhq/coin-concordium@0.17.0-next.0
  - @ledgerhq/coin-filecoin@1.29.0-next.0
  - @ledgerhq/coin-multiversx@0.21.0-next.0
  - @ledgerhq/coin-polkadot@6.31.0-next.0
  - @ledgerhq/coin-solana@0.59.0-next.0
  - @ledgerhq/coin-sui@0.41.0-next.0
  - @ledgerhq/coin-tezos@7.10.0-next.0
  - @ledgerhq/coin-tron@6.7.0-next.0
  - @ledgerhq/live-dmk-shared@0.29.0-next.0
  - @ledgerhq/live-currency-format@0.14.0-next.0
  - @domain/entity-currency-crypto@0.7.0-next.0
  - @ledgerhq/coin-internet_computer@1.26.0-next.0
  - @ledgerhq/coin-kaspa@1.20.0-next.0
  - @ledgerhq/wallet-btc@0.2.0-next.0
  - @ledgerhq/coin-bitcoin@0.48.0-next.0
  - @ledgerhq/live-network@2.7.0-next.0
  - @ledgerhq/coin-cosmos@0.40.0-next.0
  - @shared/feature-flags@0.15.0-next.0
  - @ledgerhq/live-signer-solana@0.18.0-next.0
  - @ledgerhq/coin-stacks@0.25.0-next.0
  - @ledgerhq/coin-ton@0.33.0-next.0
  - @ledgerhq/coin-vechain@2.26.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.5.0-next.0
  - @ledgerhq/live-countervalues-react@0.16.3-next.0
  - @ledgerhq/live-signer-aleo@0.19.3-next.0
  - @ledgerhq/live-signer-canton@0.9.12-next.0
  - @ledgerhq/live-signer-celo@1.1.8-next.0
  - @ledgerhq/live-signer-concordium@0.6.2-next.0
  - @ledgerhq/live-signer-evm@0.21.2-next.0
  - @ledgerhq/coin-casper@2.16.1-next.0
  - @ledgerhq/coin-icon@0.26.1-next.0
  - @ledgerhq/coin-mina@1.18.1-next.0
  - @ledgerhq/coin-near@0.28.1-next.0
  - @ledgerhq/device-core@0.11.8-next.0
  - @ledgerhq/domain-service@1.8.11-next.0
  - @ledgerhq/evm-tools@1.13.1
  - @ledgerhq/hw-app-eth@7.8.11-next.0
  - @ledgerhq/live-signer-cosmos@0.4.2-next.0
  - @domain/api-currency-token@0.2.2-next.0
  - @ledgerhq/ledger-cal-service@1.18.5-next.0
  - @ledgerhq/ledger-trust-service@0.8.10-next.0
  - @features/platform-feature-flags@0.6.2-next.0

## 36.5.0

### Minor Changes

- [#19411](https://github.com/LedgerHQ/ledger-live/pull/19411) [`ca37cfe`](https://github.com/LedgerHQ/ledger-live/commit/ca37cfe7f451b88ebd76a9da7af70fcc6577cc53) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(algorand): not opt in asa error message

- [#19373](https://github.com/LedgerHQ/ledger-live/pull/19373) [`1f34a90`](https://github.com/LedgerHQ/ledger-live/commit/1f34a9055ccaea91ee2ab98a7b10ef1afc968e85) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Fix GAM CTA visibility and empty-link click behavior on desktop and mobile

- [#19628](https://github.com/LedgerHQ/ledger-live/pull/19628) [`8df21c9`](https://github.com/LedgerHQ/ledger-live/commit/8df21c94922550dd6dfe5448afa79b32cfa94a92) Thanks [@qperrot](https://github.com/qperrot)! - Fix coin control not showing selected coins after entering an amount, and refine the coin control screen layout (subheader sizing, header spacing, and scrollbar gutter)

- [#19279](https://github.com/LedgerHQ/ledger-live/pull/19279) [`2c28696`](https://github.com/LedgerHQ/ledger-live/commit/2c2869679a266a0a330547db0dfb6a13d11b19aa) Thanks [@deepyjr](https://github.com/deepyjr)! - Fix the dust filter option copy and wrapping on mobile transaction history, and share the dust threshold formatter across apps.

- [#19103](https://github.com/LedgerHQ/ledger-live/pull/19103) [`39ed467`](https://github.com/LedgerHQ/ledger-live/commit/39ed467b46543e040bb1d16002f90ff1ec1ef172) Thanks [@shazzzam](https://github.com/shazzzam)! - cardano: fix Send Max showing a ~10× inflated network fee (the whole low balance) and instead report the real protocol fee; surface a clear min-UTXO error when the balance is below the sendable dust threshold (both the account bridge and the CoinModule API paths). Also warn (non-blocking) on a self-send: the bridge `getTransactionStatus` and the CoinModule `validateIntent` now flag a recipient that is one of the account's own addresses, and the cardano family descriptor `selfTransfer` policy is set to "warning" so the new send flow surfaces it without blocking (matches vechain/near) (LIVE-33176).

- [#19217](https://github.com/LedgerHQ/ledger-live/pull/19217) [`e26e68e`](https://github.com/LedgerHQ/ledger-live/commit/e26e68e854ecea6ebbe5e26196c8d8e899329c7d) Thanks [@qperrot](https://github.com/qperrot)! - families/bitcoin/bridgeExtensions.ts now implements the full edit-transaction contract: getEditTransactionPatch, getEditTransactionStatus, getFormattedFeeFields, hasMinimumFundsToCancel, hasMinimumFundsToSpeedUp, isStrategyDisabled, isTransactionConfirmed.
  The Bitcoin edit-transaction helpers (RBF replace/cancel, fee formatting, strategy validation) live under ledger-live-common/src/families/bitcoin/editTransaction/, with unit tests.
  Desktop & mobile Bitcoin edit flows (Body.tsx, StepFees, StepMethod, MethodSelection, EditTransactionSummary) reach these helpers through getAccountBridge(account) instead of importing them directly.

  hasMinimumFundsToCancel / hasMinimumFundsToSpeedUp now return Promise<boolean>. Bitcoin's minimum-funds checks are inherently async (RBF fee lookup) and all call sites already await them; EVM's implementations were updated accordingly.

  Bitcoin's isStrategyDisabled uses a slightly different shape than the generic contract, adapted via a thin wrapper (same pattern as EVM): it maps the contract's feeData to Bitcoin's feesStrategy, and its transaction param was widened to accept the real (nullable) feePerByte with a guard. isTransactionConfirmed follows the { account, hash } contract signature directly.

- [#19621](https://github.com/LedgerHQ/ledger-live/pull/19621) [`bc0573e`](https://github.com/LedgerHQ/ledger-live/commit/bc0573e3bf73e47ad4f8a58e228a3e11e0866e6e) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Fix EVM staking operation history showing the user's own address instead of the staking contract as recipient

- [#19331](https://github.com/LedgerHQ/ledger-live/pull/19331) [`71884d7`](https://github.com/LedgerHQ/ledger-live/commit/71884d759a86bc36ce3f6776ed1c59a2b984343b) Thanks [@ysitbon](https://github.com/ysitbon)! - Activate the RTK Query supported-fiats flow and retire the legacy CVS polling path: boot-time query populates the Redux slice; settings and countervalue selectors read from the slice synchronously.

- [#19486](https://github.com/LedgerHQ/ledger-live/pull/19486) [`b3557c0`](https://github.com/LedgerHQ/ledger-live/commit/b3557c0c7c2b1388f5e0a7270ee4847b1cf53ff6) Thanks [@deepyjr](https://github.com/deepyjr)! - Filter incoming and outgoing dust transactions in history.

- [#19570](https://github.com/LedgerHQ/ledger-live/pull/19570) [`8fd4f90`](https://github.com/LedgerHQ/ledger-live/commit/8fd4f9019c1b3015eaa74ddad62dd786976913f7) Thanks [@LucasWerey](https://github.com/LucasWerey)! - fix selectCurrencyForMetaId returning Arbitrum One chain instead of ARB ERC-20 token

- [#19419](https://github.com/LedgerHQ/ledger-live/pull/19419) [`0040b67`](https://github.com/LedgerHQ/ledger-live/commit/0040b67ca4d65ebf2fede15f625e5958f507d879) Thanks [@deepyjr](https://github.com/deepyjr)! - Filter incoming native dust transactions in operation histories.

- [#19392](https://github.com/LedgerHQ/ledger-live/pull/19392) [`6627cb7`](https://github.com/LedgerHQ/ledger-live/commit/6627cb7ef2627c6e3ac520d01db6b2deefdfe7f3) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(lwm): cancel message new send flow fix

- [#19401](https://github.com/LedgerHQ/ledger-live/pull/19401) [`083452c`](https://github.com/LedgerHQ/ledger-live/commit/083452c72359a52c363e7de95e53b98f0c6ed906) Thanks [@YazhuEth](https://github.com/YazhuEth)! - coin-evm now reads `feesStrategy` and `sponsored` from the `customFees` fee-estimation parameters instead of the transaction intent. The generic-coin-framework bridge and the EVM swap job fold these fields into `customFees.parameters` accordingly, aligning with the coin-module framework where both are deprecated on `TransactionIntent`.

- [#19228](https://github.com/LedgerHQ/ledger-live/pull/19228) [`3fc5836`](https://github.com/LedgerHQ/ledger-live/commit/3fc583609116bcf40956ccafeaadc733e11040b0) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Fix Tezos `account.getPublicKey` (Wallet API): resolve the account public key from `xpub` instead of `seedIdentifier`, which is derived from a different path (`44'/1729'/0'`) and returned the same wrong address for every Tezos account. When `xpub` does not contain a valid base58 Tezos public key (edpk/sppk/p2pk), the request is rejected with a dedicated `AccountPublicKeyUnavailable` error and Ledger Live surfaces it natively (error modal on desktop, bottom modal on mobile), prompting the user to re-add the account instead of failing silently. The per-family resolver map is retained for chains that need bespoke retrieval. Also stop seeding `xpub` with the address on Tezos QR import.

- [#19370](https://github.com/LedgerHQ/ledger-live/pull/19370) [`cd43e66`](https://github.com/LedgerHQ/ledger-live/commit/cd43e6689983aefdc3548ac6dcfb86521a1535ff) Thanks [@pawell24](https://github.com/pawell24)! - Rename "Ledger by Chorus One" to "Ledger by Bitwise" following Bitwise's acquisition of Chorus One

- [#19403](https://github.com/LedgerHQ/ledger-live/pull/19403) [`47b8889`](https://github.com/LedgerHQ/ledger-live/commit/47b8889b362204d565b0ad06c8862cdb9bf048b7) Thanks [@ysitbon](https://github.com/ysitbon)! - Repoint the `currencies` barrel re-exports off `@ledgerhq/cryptoassets` onto domain entity packages: crypto currency accessors now come from `@domain/entity-currency-crypto` and fiat currency accessors from `@domain/entity-currency-fiat`. Runtime behaviour is unchanged — the domain registry is already the single source of truth via the injected crypto store and the fiat domain seed.

- [#19035](https://github.com/LedgerHQ/ledger-live/pull/19035) [`07bfc2c`](https://github.com/LedgerHQ/ledger-live/commit/07bfc2cbcf3c63b55224dec2aef1818d22c2315c) Thanks [@YazhuEth](https://github.com/YazhuEth)! - generic coin-framework bridge: compute the send-max (`useAllAmount`) amount once in `prepareTransaction` and reuse it in `signOperation`, instead of recomputing it via `validateIntent` in `prepareTransaction`, `signOperation` and `estimateMaxSpendable`. The amount is `parameters.amount` when the coin exposes it (Tezos), the token sub-account balance for token sends, otherwise `spendableBalance - max(reserve, fees)` (coin-evm now exposes `reserve`/`amountScale` for delegate). Pending operations are subtracted so the amount stays consistent with `getTransactionStatus` (LIVE-22227, LIVE-22228, LIVE-22229).

- [#19277](https://github.com/LedgerHQ/ledger-live/pull/19277) [`77c8a26`](https://github.com/LedgerHQ/ledger-live/commit/77c8a264f2c50fc1d10a5267afb2290b24f4f572) Thanks [@ishaba](https://github.com/ishaba)! - Celo Custom-fees "Pay fees in" options now show a currency icon and held balance for native CELO and each allowlisted fee token, on desktop and mobile. The generic `FeeAssetOption` contract gains two optional fields (`currency`, `balance`); the UI formats the raw balance with the user's locale. Coins that don't set them render exactly as before.

- [#19253](https://github.com/LedgerHQ/ledger-live/pull/19253) [`3e127f7`](https://github.com/LedgerHQ/ledger-live/commit/3e127f7385f5da907d4a08447c3f7582a9ac4f3f) Thanks [@qperrot](https://github.com/qperrot)! - Add the CoinModuleApi (Alpaca) `createApi` factory to `coin-multiversx` alongside the existing `createBridges`. Business logic is extracted into a flat `src/logic/`, HTTP moves to `src/network/`, and `createApi` implements the Standard API for the native EGLD asset, ESDT tokens, and delegation staking. Registers the local MultiversX coin-module API in `live-common`.

- [#19425](https://github.com/LedgerHQ/ledger-live/pull/19425) [`35f0138`](https://github.com/LedgerHQ/ledger-live/commit/35f0138542fbd98f664b24ee786fc662d7223e10) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(xion): rebrand Xion to Verona (display name/ticker XION -> VERONA, main unit code XION -> VERONA, base denom uxion unchanged) and backport the coin-cosmos default LCD to verona-api.polkachu.com

- [#19552](https://github.com/LedgerHQ/ledger-live/pull/19552) [`279b755`](https://github.com/LedgerHQ/ledger-live/commit/279b755ce19d8157c75295d21ad18d1cc2503e79) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Migrate @ledgerhq/client-ids to DDD domain packages: @domain/entity-client-identity and @domain/api-push-devices

- [#19406](https://github.com/LedgerHQ/ledger-live/pull/19406) [`eefaded`](https://github.com/LedgerHQ/ledger-live/commit/eefaded9e81566898f1551e144a805efe60390fe) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - migrate cmc-client from @ledgerhq/live-common to DDD architecture, introducing dedicated domain packages for market-sentiment and altcoins-sentiment entities, APIs, and fear-and-greed flow utilities

- [#19357](https://github.com/LedgerHQ/ledger-live/pull/19357) [`ad38c6d`](https://github.com/LedgerHQ/ledger-live/commit/ad38c6da54e35e14c53237f9ca4369091f15e8a0) Thanks [@henri-ly](https://github.com/henri-ly)! - chore(llc): isolate flaky network-dependent integration tests into a weekly CI run

  Several integration tests depend on flaky third-party/external nodes and explorers that
  are intermittently unreachable (cosmos public RPC nodes, the Mina ledger explorer),
  causing spurious failures on PRs and the daily integration run.
  They are now excluded from those runs (via a `weeklyIntegrationTests` list in
  `jest.config.ts`) and executed by a new weekly workflow through the
  `ci-test-integration-weekly` script. The isolated suites are the cosmos `lastBlock` +
  `datasets/{persistence,stargaze,quicksilver,xion}` and `mina/bridge` integration tests.

- [#19119](https://github.com/LedgerHQ/ledger-live/pull/19119) [`edc897d`](https://github.com/LedgerHQ/ledger-live/commit/edc897d25e91f426065ce4eab89882192cb1327c) Thanks [@qperrot](https://github.com/qperrot)! - Feat: coin tester multiversx implementation

- [#19460](https://github.com/LedgerHQ/ledger-live/pull/19460) [`44a08fa`](https://github.com/LedgerHQ/ledger-live/commit/44a08fa1cbbd560da60cee496af1ffa49dc380da) Thanks [@ysitbon](https://github.com/ysitbon)! - Repoint currencies/helpers.ts and currencies/color.ts off @ledgerhq/cryptoassets onto @domain/entity-currency-crypto

- [#19662](https://github.com/LedgerHQ/ledger-live/pull/19662) [`26e7fbd`](https://github.com/LedgerHQ/ledger-live/commit/26e7fbd02929042b3f32c6d8cb73db6e3d070709) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Extract the Aleo private-send quick amount tier selection logic (Fast/Balanced/Full record boundaries) into `@ledgerhq/coin-aleo` and a shared `useAleoQuickAmountSelector` hook in `@ledgerhq/live-common`, and refactor the desktop QuickAmountSelector to consume it instead of duplicating the logic locally.

- [#19422](https://github.com/LedgerHQ/ledger-live/pull/19422) [`92b234f`](https://github.com/LedgerHQ/ledger-live/commit/92b234fb80a0fdeb9a36ed8917d542a912e817ed) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(llc): support `REDELEGATE` optimistic operations

- [#19461](https://github.com/LedgerHQ/ledger-live/pull/19461) [`f2de6f4`](https://github.com/LedgerHQ/ledger-live/commit/f2de6f4813889b9450266aa90d8436569107185d) Thanks [@ysitbon](https://github.com/ysitbon)! - repoint families direct @ledgerhq/cryptoassets currency-accessor imports to @domain/entity-currency-crypto

- [#19615](https://github.com/LedgerHQ/ledger-live/pull/19615) [`e56f1b5`](https://github.com/LedgerHQ/ledger-live/commit/e56f1b53b0ddcde7dc517aad7bf2bb1a33346d76) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(llc): bump 0g `minGasPrice`

### Patch Changes

- Updated dependencies [[`4b73f23`](https://github.com/LedgerHQ/ledger-live/commit/4b73f23260ecc28574f46a7fd0f5cd7627d6d13f), [`8f30c75`](https://github.com/LedgerHQ/ledger-live/commit/8f30c75ecb553a720722f1e039b4aec53fce2a87), [`25fd71b`](https://github.com/LedgerHQ/ledger-live/commit/25fd71b4caaa8781101dad205669773b234d86c0), [`9824fc8`](https://github.com/LedgerHQ/ledger-live/commit/9824fc8e03b55afe020e87a7f55fe44104f69e1b), [`0f85077`](https://github.com/LedgerHQ/ledger-live/commit/0f850774ae3b46fd4a06c0da5762d3d4211b26af), [`e478b6e`](https://github.com/LedgerHQ/ledger-live/commit/e478b6ee02a1ef105f07b2ba0d1f04292855bc91), [`cf45a7d`](https://github.com/LedgerHQ/ledger-live/commit/cf45a7d1d247596a2fbaf872ae3c981e685082fc), [`c75213b`](https://github.com/LedgerHQ/ledger-live/commit/c75213b0c649cc0acfdbabacd62e07848ccee842), [`a15b864`](https://github.com/LedgerHQ/ledger-live/commit/a15b864576d901f15d480070b475314c3b23c1dd), [`45584e4`](https://github.com/LedgerHQ/ledger-live/commit/45584e4b87ad8ffea9a0e6ba48e196d14164c84a), [`39ed467`](https://github.com/LedgerHQ/ledger-live/commit/39ed467b46543e040bb1d16002f90ff1ec1ef172), [`e26e68e`](https://github.com/LedgerHQ/ledger-live/commit/e26e68e854ecea6ebbe5e26196c8d8e899329c7d), [`dd89180`](https://github.com/LedgerHQ/ledger-live/commit/dd891801f1829506b004c383fa230cf9507ff283), [`bc0573e`](https://github.com/LedgerHQ/ledger-live/commit/bc0573e3bf73e47ad4f8a58e228a3e11e0866e6e), [`fad98a1`](https://github.com/LedgerHQ/ledger-live/commit/fad98a1d33675605d646959a1b1a2b648b2f59f2), [`ea792bc`](https://github.com/LedgerHQ/ledger-live/commit/ea792bc06b9eb9931d75823bff63186202d3e2de), [`75a33a8`](https://github.com/LedgerHQ/ledger-live/commit/75a33a8ef74a6eef6236bb5db873cadd35643705), [`47b8889`](https://github.com/LedgerHQ/ledger-live/commit/47b8889b362204d565b0ad06c8862cdb9bf048b7), [`2b4a016`](https://github.com/LedgerHQ/ledger-live/commit/2b4a016a8c2f2a635c50928bb2f78b63d96ff67f), [`bae43dd`](https://github.com/LedgerHQ/ledger-live/commit/bae43ddc50439d2a7f18852f2b727e24de0169ed), [`d3862bb`](https://github.com/LedgerHQ/ledger-live/commit/d3862bb82e8084b624f65ef6d22d3eb151e0f18f), [`07c4724`](https://github.com/LedgerHQ/ledger-live/commit/07c47249db7aa923af0a29a6dc8fb0c0264a08c7), [`417f23f`](https://github.com/LedgerHQ/ledger-live/commit/417f23f6f2933182a4466764b71c6f3443688ca9), [`47b8889`](https://github.com/LedgerHQ/ledger-live/commit/47b8889b362204d565b0ad06c8862cdb9bf048b7), [`996c76b`](https://github.com/LedgerHQ/ledger-live/commit/996c76b157553c547f83d877d25199b311ee0f63), [`68dffc1`](https://github.com/LedgerHQ/ledger-live/commit/68dffc18a73915e67739b9206112233574358304), [`f854c29`](https://github.com/LedgerHQ/ledger-live/commit/f854c29bf164948ff2a38c01a1dc88e8fb297bc1), [`9479c28`](https://github.com/LedgerHQ/ledger-live/commit/9479c284321915f7d5139746f3f924b1ad2685c3), [`c052fc7`](https://github.com/LedgerHQ/ledger-live/commit/c052fc707a359fefbda3acc6bea7200ede805f45), [`682c34b`](https://github.com/LedgerHQ/ledger-live/commit/682c34b48b800e4963a06e2731ff16d116af42f9), [`691624c`](https://github.com/LedgerHQ/ledger-live/commit/691624c1c6110de5a89d92b850b4ea7fb26ea9d8), [`083452c`](https://github.com/LedgerHQ/ledger-live/commit/083452c72359a52c363e7de95e53b98f0c6ed906), [`3fc5836`](https://github.com/LedgerHQ/ledger-live/commit/3fc583609116bcf40956ccafeaadc733e11040b0), [`cd43e66`](https://github.com/LedgerHQ/ledger-live/commit/cd43e6689983aefdc3548ac6dcfb86521a1535ff), [`07bfc2c`](https://github.com/LedgerHQ/ledger-live/commit/07bfc2cbcf3c63b55224dec2aef1818d22c2315c), [`dcacbc9`](https://github.com/LedgerHQ/ledger-live/commit/dcacbc9b7a21ba36f54c1f9872918cd374b0e4e3), [`3e127f7`](https://github.com/LedgerHQ/ledger-live/commit/3e127f7385f5da907d4a08447c3f7582a9ac4f3f), [`35f0138`](https://github.com/LedgerHQ/ledger-live/commit/35f0138542fbd98f664b24ee786fc662d7223e10), [`50660af`](https://github.com/LedgerHQ/ledger-live/commit/50660af751c2306802f1fefb2499cbf353f79cc4), [`a952f84`](https://github.com/LedgerHQ/ledger-live/commit/a952f84063e5f791b9c757827570d59d048c43bf), [`edc897d`](https://github.com/LedgerHQ/ledger-live/commit/edc897d25e91f426065ce4eab89882192cb1327c), [`ff9d1d2`](https://github.com/LedgerHQ/ledger-live/commit/ff9d1d29fbc3d6a4d75e3ca145e3a9df0dda50c5), [`fc44f1e`](https://github.com/LedgerHQ/ledger-live/commit/fc44f1e6ddcca939c117e0cb8bc49c404163b003), [`26e7fbd`](https://github.com/LedgerHQ/ledger-live/commit/26e7fbd02929042b3f32c6d8cb73db6e3d070709), [`ddc6499`](https://github.com/LedgerHQ/ledger-live/commit/ddc6499ebc483a853d82ca3c00d0927169c8e0ed), [`fd9da5e`](https://github.com/LedgerHQ/ledger-live/commit/fd9da5e2b3a1e5300d012b826f3707535d07b1d9), [`f7d68bb`](https://github.com/LedgerHQ/ledger-live/commit/f7d68bb85919a8029536993b6b6ffa93f20c7683), [`2549817`](https://github.com/LedgerHQ/ledger-live/commit/2549817d9f629f0e5d8ea1e0f267c688aedd2c5e), [`457d12c`](https://github.com/LedgerHQ/ledger-live/commit/457d12c949c317d495ba7c391a80fa4b8ee956ee), [`43d4872`](https://github.com/LedgerHQ/ledger-live/commit/43d487261dfb0681b561e4b114b2179acba5e2a8), [`6ef44af`](https://github.com/LedgerHQ/ledger-live/commit/6ef44afa6807ace32b3f6620173868f2ef20e158), [`6ef44af`](https://github.com/LedgerHQ/ledger-live/commit/6ef44afa6807ace32b3f6620173868f2ef20e158), [`8238860`](https://github.com/LedgerHQ/ledger-live/commit/8238860c893b0688d2c59a3e042d7a227031547a), [`d7edc6e`](https://github.com/LedgerHQ/ledger-live/commit/d7edc6ee38776dcbc6da341f734b42d78dc05836)]:
  - @ledgerhq/coin-aleo@1.18.0
  - @ledgerhq/coin-algorand@1.9.0
  - @ledgerhq/coin-aptos@3.23.0
  - @ledgerhq/coin-bitcoin@0.47.0
  - @ledgerhq/coin-canton@0.29.0
  - @ledgerhq/coin-cardano@0.30.0
  - @ledgerhq/coin-casper@2.16.0
  - @ledgerhq/coin-celo@2.9.0
  - @ledgerhq/coin-concordium@0.16.0
  - @ledgerhq/coin-cosmos@0.39.0
  - @ledgerhq/coin-evm@4.6.0
  - @ledgerhq/coin-filecoin@1.28.0
  - @ledgerhq/coin-hedera@1.38.0
  - @ledgerhq/coin-icon@0.26.0
  - @ledgerhq/coin-internet_computer@1.25.0
  - @ledgerhq/coin-kaspa@1.19.0
  - @ledgerhq/coin-mina@1.18.0
  - @ledgerhq/coin-multiversx@0.20.0
  - @ledgerhq/coin-near@0.28.0
  - @ledgerhq/coin-polkadot@6.30.0
  - @ledgerhq/coin-solana@0.58.0
  - @ledgerhq/coin-stacks@0.24.0
  - @ledgerhq/coin-sui@0.40.0
  - @ledgerhq/coin-ton@0.32.0
  - @ledgerhq/coin-tron@6.6.0
  - @ledgerhq/coin-vechain@2.25.0
  - @ledgerhq/ledger-wallet-framework@2.4.0
  - @ledgerhq/cryptoassets@13.55.0
  - @ledgerhq/coin-tezos@7.9.0
  - @shared/feature-flags@0.14.0
  - @ledgerhq/live-env@2.42.0
  - @domain/entity-currency-crypto@0.6.0
  - @domain/entity-currency-fiat@0.3.0
  - @ledgerhq/live-wallet@0.29.0
  - @ledgerhq/live-currency-format@0.13.0
  - @ledgerhq/asset-aggregation@0.11.0
  - @ledgerhq/hw-app-btc@11.3.0
  - @ledgerhq/live-signer-aleo@0.19.2
  - @ledgerhq/live-signer-canton@0.9.11
  - @ledgerhq/live-signer-celo@1.1.7
  - @ledgerhq/live-signer-concordium@0.6.1
  - @ledgerhq/live-signer-cosmos@0.4.1
  - @ledgerhq/live-signer-solana@0.17.1
  - @ledgerhq/live-countervalues@0.22.1
  - @ledgerhq/live-countervalues-react@0.16.2
  - @features/platform-feature-flags@0.6.1
  - @ledgerhq/evm-tools@1.13.1
  - @ledgerhq/ledger-cal-service@1.18.4
  - @ledgerhq/ledger-trust-service@0.8.9
  - @ledgerhq/live-network@2.6.8
  - @ledgerhq/speculos-transport@0.10.8
  - @ledgerhq/device-core@0.11.7
  - @ledgerhq/domain-service@1.8.10
  - @ledgerhq/hw-app-eth@7.8.10
  - @ledgerhq/live-signer-evm@0.21.1
  - @ledgerhq/hw-app-exchange@0.23.1

## 36.5.0-next.0

### Minor Changes

- [#19411](https://github.com/LedgerHQ/ledger-live/pull/19411) [`ca37cfe`](https://github.com/LedgerHQ/ledger-live/commit/ca37cfe7f451b88ebd76a9da7af70fcc6577cc53) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(algorand): not opt in asa error message

- [#19373](https://github.com/LedgerHQ/ledger-live/pull/19373) [`1f34a90`](https://github.com/LedgerHQ/ledger-live/commit/1f34a9055ccaea91ee2ab98a7b10ef1afc968e85) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Fix GAM CTA visibility and empty-link click behavior on desktop and mobile

- [#19628](https://github.com/LedgerHQ/ledger-live/pull/19628) [`8df21c9`](https://github.com/LedgerHQ/ledger-live/commit/8df21c94922550dd6dfe5448afa79b32cfa94a92) Thanks [@qperrot](https://github.com/qperrot)! - Fix coin control not showing selected coins after entering an amount, and refine the coin control screen layout (subheader sizing, header spacing, and scrollbar gutter)

- [#19279](https://github.com/LedgerHQ/ledger-live/pull/19279) [`2c28696`](https://github.com/LedgerHQ/ledger-live/commit/2c2869679a266a0a330547db0dfb6a13d11b19aa) Thanks [@deepyjr](https://github.com/deepyjr)! - Fix the dust filter option copy and wrapping on mobile transaction history, and share the dust threshold formatter across apps.

- [#19103](https://github.com/LedgerHQ/ledger-live/pull/19103) [`39ed467`](https://github.com/LedgerHQ/ledger-live/commit/39ed467b46543e040bb1d16002f90ff1ec1ef172) Thanks [@shazzzam](https://github.com/shazzzam)! - cardano: fix Send Max showing a ~10× inflated network fee (the whole low balance) and instead report the real protocol fee; surface a clear min-UTXO error when the balance is below the sendable dust threshold (both the account bridge and the CoinModule API paths). Also warn (non-blocking) on a self-send: the bridge `getTransactionStatus` and the CoinModule `validateIntent` now flag a recipient that is one of the account's own addresses, and the cardano family descriptor `selfTransfer` policy is set to "warning" so the new send flow surfaces it without blocking (matches vechain/near) (LIVE-33176).

- [#19217](https://github.com/LedgerHQ/ledger-live/pull/19217) [`e26e68e`](https://github.com/LedgerHQ/ledger-live/commit/e26e68e854ecea6ebbe5e26196c8d8e899329c7d) Thanks [@qperrot](https://github.com/qperrot)! - families/bitcoin/bridgeExtensions.ts now implements the full edit-transaction contract: getEditTransactionPatch, getEditTransactionStatus, getFormattedFeeFields, hasMinimumFundsToCancel, hasMinimumFundsToSpeedUp, isStrategyDisabled, isTransactionConfirmed.
  The Bitcoin edit-transaction helpers (RBF replace/cancel, fee formatting, strategy validation) live under ledger-live-common/src/families/bitcoin/editTransaction/, with unit tests.
  Desktop & mobile Bitcoin edit flows (Body.tsx, StepFees, StepMethod, MethodSelection, EditTransactionSummary) reach these helpers through getAccountBridge(account) instead of importing them directly.

  hasMinimumFundsToCancel / hasMinimumFundsToSpeedUp now return Promise<boolean>. Bitcoin's minimum-funds checks are inherently async (RBF fee lookup) and all call sites already await them; EVM's implementations were updated accordingly.

  Bitcoin's isStrategyDisabled uses a slightly different shape than the generic contract, adapted via a thin wrapper (same pattern as EVM): it maps the contract's feeData to Bitcoin's feesStrategy, and its transaction param was widened to accept the real (nullable) feePerByte with a guard. isTransactionConfirmed follows the { account, hash } contract signature directly.

- [#19621](https://github.com/LedgerHQ/ledger-live/pull/19621) [`bc0573e`](https://github.com/LedgerHQ/ledger-live/commit/bc0573e3bf73e47ad4f8a58e228a3e11e0866e6e) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Fix EVM staking operation history showing the user's own address instead of the staking contract as recipient

- [#19331](https://github.com/LedgerHQ/ledger-live/pull/19331) [`71884d7`](https://github.com/LedgerHQ/ledger-live/commit/71884d759a86bc36ce3f6776ed1c59a2b984343b) Thanks [@ysitbon](https://github.com/ysitbon)! - Activate the RTK Query supported-fiats flow and retire the legacy CVS polling path: boot-time query populates the Redux slice; settings and countervalue selectors read from the slice synchronously.

- [#19486](https://github.com/LedgerHQ/ledger-live/pull/19486) [`b3557c0`](https://github.com/LedgerHQ/ledger-live/commit/b3557c0c7c2b1388f5e0a7270ee4847b1cf53ff6) Thanks [@deepyjr](https://github.com/deepyjr)! - Filter incoming and outgoing dust transactions in history.

- [#19570](https://github.com/LedgerHQ/ledger-live/pull/19570) [`8fd4f90`](https://github.com/LedgerHQ/ledger-live/commit/8fd4f9019c1b3015eaa74ddad62dd786976913f7) Thanks [@LucasWerey](https://github.com/LucasWerey)! - fix selectCurrencyForMetaId returning Arbitrum One chain instead of ARB ERC-20 token

- [#19419](https://github.com/LedgerHQ/ledger-live/pull/19419) [`0040b67`](https://github.com/LedgerHQ/ledger-live/commit/0040b67ca4d65ebf2fede15f625e5958f507d879) Thanks [@deepyjr](https://github.com/deepyjr)! - Filter incoming native dust transactions in operation histories.

- [#19392](https://github.com/LedgerHQ/ledger-live/pull/19392) [`6627cb7`](https://github.com/LedgerHQ/ledger-live/commit/6627cb7ef2627c6e3ac520d01db6b2deefdfe7f3) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(lwm): cancel message new send flow fix

- [#19401](https://github.com/LedgerHQ/ledger-live/pull/19401) [`083452c`](https://github.com/LedgerHQ/ledger-live/commit/083452c72359a52c363e7de95e53b98f0c6ed906) Thanks [@YazhuEth](https://github.com/YazhuEth)! - coin-evm now reads `feesStrategy` and `sponsored` from the `customFees` fee-estimation parameters instead of the transaction intent. The generic-coin-framework bridge and the EVM swap job fold these fields into `customFees.parameters` accordingly, aligning with the coin-module framework where both are deprecated on `TransactionIntent`.

- [#19228](https://github.com/LedgerHQ/ledger-live/pull/19228) [`3fc5836`](https://github.com/LedgerHQ/ledger-live/commit/3fc583609116bcf40956ccafeaadc733e11040b0) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Fix Tezos `account.getPublicKey` (Wallet API): resolve the account public key from `xpub` instead of `seedIdentifier`, which is derived from a different path (`44'/1729'/0'`) and returned the same wrong address for every Tezos account. When `xpub` does not contain a valid base58 Tezos public key (edpk/sppk/p2pk), the request is rejected with a dedicated `AccountPublicKeyUnavailable` error and Ledger Live surfaces it natively (error modal on desktop, bottom modal on mobile), prompting the user to re-add the account instead of failing silently. The per-family resolver map is retained for chains that need bespoke retrieval. Also stop seeding `xpub` with the address on Tezos QR import.

- [#19370](https://github.com/LedgerHQ/ledger-live/pull/19370) [`cd43e66`](https://github.com/LedgerHQ/ledger-live/commit/cd43e6689983aefdc3548ac6dcfb86521a1535ff) Thanks [@pawell24](https://github.com/pawell24)! - Rename "Ledger by Chorus One" to "Ledger by Bitwise" following Bitwise's acquisition of Chorus One

- [#19403](https://github.com/LedgerHQ/ledger-live/pull/19403) [`47b8889`](https://github.com/LedgerHQ/ledger-live/commit/47b8889b362204d565b0ad06c8862cdb9bf048b7) Thanks [@ysitbon](https://github.com/ysitbon)! - Repoint the `currencies` barrel re-exports off `@ledgerhq/cryptoassets` onto domain entity packages: crypto currency accessors now come from `@domain/entity-currency-crypto` and fiat currency accessors from `@domain/entity-currency-fiat`. Runtime behaviour is unchanged — the domain registry is already the single source of truth via the injected crypto store and the fiat domain seed.

- [#19035](https://github.com/LedgerHQ/ledger-live/pull/19035) [`07bfc2c`](https://github.com/LedgerHQ/ledger-live/commit/07bfc2cbcf3c63b55224dec2aef1818d22c2315c) Thanks [@YazhuEth](https://github.com/YazhuEth)! - generic coin-framework bridge: compute the send-max (`useAllAmount`) amount once in `prepareTransaction` and reuse it in `signOperation`, instead of recomputing it via `validateIntent` in `prepareTransaction`, `signOperation` and `estimateMaxSpendable`. The amount is `parameters.amount` when the coin exposes it (Tezos), the token sub-account balance for token sends, otherwise `spendableBalance - max(reserve, fees)` (coin-evm now exposes `reserve`/`amountScale` for delegate). Pending operations are subtracted so the amount stays consistent with `getTransactionStatus` (LIVE-22227, LIVE-22228, LIVE-22229).

- [#19277](https://github.com/LedgerHQ/ledger-live/pull/19277) [`77c8a26`](https://github.com/LedgerHQ/ledger-live/commit/77c8a264f2c50fc1d10a5267afb2290b24f4f572) Thanks [@ishaba](https://github.com/ishaba)! - Celo Custom-fees "Pay fees in" options now show a currency icon and held balance for native CELO and each allowlisted fee token, on desktop and mobile. The generic `FeeAssetOption` contract gains two optional fields (`currency`, `balance`); the UI formats the raw balance with the user's locale. Coins that don't set them render exactly as before.

- [#19253](https://github.com/LedgerHQ/ledger-live/pull/19253) [`3e127f7`](https://github.com/LedgerHQ/ledger-live/commit/3e127f7385f5da907d4a08447c3f7582a9ac4f3f) Thanks [@qperrot](https://github.com/qperrot)! - Add the CoinModuleApi (Alpaca) `createApi` factory to `coin-multiversx` alongside the existing `createBridges`. Business logic is extracted into a flat `src/logic/`, HTTP moves to `src/network/`, and `createApi` implements the Standard API for the native EGLD asset, ESDT tokens, and delegation staking. Registers the local MultiversX coin-module API in `live-common`.

- [#19425](https://github.com/LedgerHQ/ledger-live/pull/19425) [`35f0138`](https://github.com/LedgerHQ/ledger-live/commit/35f0138542fbd98f664b24ee786fc662d7223e10) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(xion): rebrand Xion to Verona (display name/ticker XION -> VERONA, main unit code XION -> VERONA, base denom uxion unchanged) and backport the coin-cosmos default LCD to verona-api.polkachu.com

- [#19552](https://github.com/LedgerHQ/ledger-live/pull/19552) [`279b755`](https://github.com/LedgerHQ/ledger-live/commit/279b755ce19d8157c75295d21ad18d1cc2503e79) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Migrate @ledgerhq/client-ids to DDD domain packages: @domain/entity-client-identity and @domain/api-push-devices

- [#19406](https://github.com/LedgerHQ/ledger-live/pull/19406) [`eefaded`](https://github.com/LedgerHQ/ledger-live/commit/eefaded9e81566898f1551e144a805efe60390fe) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - migrate cmc-client from @ledgerhq/live-common to DDD architecture, introducing dedicated domain packages for market-sentiment and altcoins-sentiment entities, APIs, and fear-and-greed flow utilities

- [#19357](https://github.com/LedgerHQ/ledger-live/pull/19357) [`ad38c6d`](https://github.com/LedgerHQ/ledger-live/commit/ad38c6da54e35e14c53237f9ca4369091f15e8a0) Thanks [@henri-ly](https://github.com/henri-ly)! - chore(llc): isolate flaky network-dependent integration tests into a weekly CI run

  Several integration tests depend on flaky third-party/external nodes and explorers that
  are intermittently unreachable (cosmos public RPC nodes, the Mina ledger explorer),
  causing spurious failures on PRs and the daily integration run.
  They are now excluded from those runs (via a `weeklyIntegrationTests` list in
  `jest.config.ts`) and executed by a new weekly workflow through the
  `ci-test-integration-weekly` script. The isolated suites are the cosmos `lastBlock` +
  `datasets/{persistence,stargaze,quicksilver,xion}` and `mina/bridge` integration tests.

- [#19119](https://github.com/LedgerHQ/ledger-live/pull/19119) [`edc897d`](https://github.com/LedgerHQ/ledger-live/commit/edc897d25e91f426065ce4eab89882192cb1327c) Thanks [@qperrot](https://github.com/qperrot)! - Feat: coin tester multiversx implementation

- [#19460](https://github.com/LedgerHQ/ledger-live/pull/19460) [`44a08fa`](https://github.com/LedgerHQ/ledger-live/commit/44a08fa1cbbd560da60cee496af1ffa49dc380da) Thanks [@ysitbon](https://github.com/ysitbon)! - Repoint currencies/helpers.ts and currencies/color.ts off @ledgerhq/cryptoassets onto @domain/entity-currency-crypto

- [#19662](https://github.com/LedgerHQ/ledger-live/pull/19662) [`26e7fbd`](https://github.com/LedgerHQ/ledger-live/commit/26e7fbd02929042b3f32c6d8cb73db6e3d070709) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Extract the Aleo private-send quick amount tier selection logic (Fast/Balanced/Full record boundaries) into `@ledgerhq/coin-aleo` and a shared `useAleoQuickAmountSelector` hook in `@ledgerhq/live-common`, and refactor the desktop QuickAmountSelector to consume it instead of duplicating the logic locally.

- [#19422](https://github.com/LedgerHQ/ledger-live/pull/19422) [`92b234f`](https://github.com/LedgerHQ/ledger-live/commit/92b234fb80a0fdeb9a36ed8917d542a912e817ed) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(llc): support `REDELEGATE` optimistic operations

- [#19461](https://github.com/LedgerHQ/ledger-live/pull/19461) [`f2de6f4`](https://github.com/LedgerHQ/ledger-live/commit/f2de6f4813889b9450266aa90d8436569107185d) Thanks [@ysitbon](https://github.com/ysitbon)! - repoint families direct @ledgerhq/cryptoassets currency-accessor imports to @domain/entity-currency-crypto

- [#19615](https://github.com/LedgerHQ/ledger-live/pull/19615) [`e56f1b5`](https://github.com/LedgerHQ/ledger-live/commit/e56f1b53b0ddcde7dc517aad7bf2bb1a33346d76) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(llc): bump 0g `minGasPrice`

### Patch Changes

- Updated dependencies [[`4b73f23`](https://github.com/LedgerHQ/ledger-live/commit/4b73f23260ecc28574f46a7fd0f5cd7627d6d13f), [`8f30c75`](https://github.com/LedgerHQ/ledger-live/commit/8f30c75ecb553a720722f1e039b4aec53fce2a87), [`25fd71b`](https://github.com/LedgerHQ/ledger-live/commit/25fd71b4caaa8781101dad205669773b234d86c0), [`9824fc8`](https://github.com/LedgerHQ/ledger-live/commit/9824fc8e03b55afe020e87a7f55fe44104f69e1b), [`0f85077`](https://github.com/LedgerHQ/ledger-live/commit/0f850774ae3b46fd4a06c0da5762d3d4211b26af), [`e478b6e`](https://github.com/LedgerHQ/ledger-live/commit/e478b6ee02a1ef105f07b2ba0d1f04292855bc91), [`cf45a7d`](https://github.com/LedgerHQ/ledger-live/commit/cf45a7d1d247596a2fbaf872ae3c981e685082fc), [`c75213b`](https://github.com/LedgerHQ/ledger-live/commit/c75213b0c649cc0acfdbabacd62e07848ccee842), [`a15b864`](https://github.com/LedgerHQ/ledger-live/commit/a15b864576d901f15d480070b475314c3b23c1dd), [`45584e4`](https://github.com/LedgerHQ/ledger-live/commit/45584e4b87ad8ffea9a0e6ba48e196d14164c84a), [`39ed467`](https://github.com/LedgerHQ/ledger-live/commit/39ed467b46543e040bb1d16002f90ff1ec1ef172), [`e26e68e`](https://github.com/LedgerHQ/ledger-live/commit/e26e68e854ecea6ebbe5e26196c8d8e899329c7d), [`dd89180`](https://github.com/LedgerHQ/ledger-live/commit/dd891801f1829506b004c383fa230cf9507ff283), [`bc0573e`](https://github.com/LedgerHQ/ledger-live/commit/bc0573e3bf73e47ad4f8a58e228a3e11e0866e6e), [`fad98a1`](https://github.com/LedgerHQ/ledger-live/commit/fad98a1d33675605d646959a1b1a2b648b2f59f2), [`ea792bc`](https://github.com/LedgerHQ/ledger-live/commit/ea792bc06b9eb9931d75823bff63186202d3e2de), [`75a33a8`](https://github.com/LedgerHQ/ledger-live/commit/75a33a8ef74a6eef6236bb5db873cadd35643705), [`47b8889`](https://github.com/LedgerHQ/ledger-live/commit/47b8889b362204d565b0ad06c8862cdb9bf048b7), [`2b4a016`](https://github.com/LedgerHQ/ledger-live/commit/2b4a016a8c2f2a635c50928bb2f78b63d96ff67f), [`bae43dd`](https://github.com/LedgerHQ/ledger-live/commit/bae43ddc50439d2a7f18852f2b727e24de0169ed), [`d3862bb`](https://github.com/LedgerHQ/ledger-live/commit/d3862bb82e8084b624f65ef6d22d3eb151e0f18f), [`07c4724`](https://github.com/LedgerHQ/ledger-live/commit/07c47249db7aa923af0a29a6dc8fb0c0264a08c7), [`417f23f`](https://github.com/LedgerHQ/ledger-live/commit/417f23f6f2933182a4466764b71c6f3443688ca9), [`47b8889`](https://github.com/LedgerHQ/ledger-live/commit/47b8889b362204d565b0ad06c8862cdb9bf048b7), [`996c76b`](https://github.com/LedgerHQ/ledger-live/commit/996c76b157553c547f83d877d25199b311ee0f63), [`68dffc1`](https://github.com/LedgerHQ/ledger-live/commit/68dffc18a73915e67739b9206112233574358304), [`f854c29`](https://github.com/LedgerHQ/ledger-live/commit/f854c29bf164948ff2a38c01a1dc88e8fb297bc1), [`9479c28`](https://github.com/LedgerHQ/ledger-live/commit/9479c284321915f7d5139746f3f924b1ad2685c3), [`c052fc7`](https://github.com/LedgerHQ/ledger-live/commit/c052fc707a359fefbda3acc6bea7200ede805f45), [`682c34b`](https://github.com/LedgerHQ/ledger-live/commit/682c34b48b800e4963a06e2731ff16d116af42f9), [`691624c`](https://github.com/LedgerHQ/ledger-live/commit/691624c1c6110de5a89d92b850b4ea7fb26ea9d8), [`083452c`](https://github.com/LedgerHQ/ledger-live/commit/083452c72359a52c363e7de95e53b98f0c6ed906), [`3fc5836`](https://github.com/LedgerHQ/ledger-live/commit/3fc583609116bcf40956ccafeaadc733e11040b0), [`cd43e66`](https://github.com/LedgerHQ/ledger-live/commit/cd43e6689983aefdc3548ac6dcfb86521a1535ff), [`07bfc2c`](https://github.com/LedgerHQ/ledger-live/commit/07bfc2cbcf3c63b55224dec2aef1818d22c2315c), [`dcacbc9`](https://github.com/LedgerHQ/ledger-live/commit/dcacbc9b7a21ba36f54c1f9872918cd374b0e4e3), [`3e127f7`](https://github.com/LedgerHQ/ledger-live/commit/3e127f7385f5da907d4a08447c3f7582a9ac4f3f), [`35f0138`](https://github.com/LedgerHQ/ledger-live/commit/35f0138542fbd98f664b24ee786fc662d7223e10), [`50660af`](https://github.com/LedgerHQ/ledger-live/commit/50660af751c2306802f1fefb2499cbf353f79cc4), [`a952f84`](https://github.com/LedgerHQ/ledger-live/commit/a952f84063e5f791b9c757827570d59d048c43bf), [`edc897d`](https://github.com/LedgerHQ/ledger-live/commit/edc897d25e91f426065ce4eab89882192cb1327c), [`ff9d1d2`](https://github.com/LedgerHQ/ledger-live/commit/ff9d1d29fbc3d6a4d75e3ca145e3a9df0dda50c5), [`fc44f1e`](https://github.com/LedgerHQ/ledger-live/commit/fc44f1e6ddcca939c117e0cb8bc49c404163b003), [`26e7fbd`](https://github.com/LedgerHQ/ledger-live/commit/26e7fbd02929042b3f32c6d8cb73db6e3d070709), [`ddc6499`](https://github.com/LedgerHQ/ledger-live/commit/ddc6499ebc483a853d82ca3c00d0927169c8e0ed), [`fd9da5e`](https://github.com/LedgerHQ/ledger-live/commit/fd9da5e2b3a1e5300d012b826f3707535d07b1d9), [`f7d68bb`](https://github.com/LedgerHQ/ledger-live/commit/f7d68bb85919a8029536993b6b6ffa93f20c7683), [`2549817`](https://github.com/LedgerHQ/ledger-live/commit/2549817d9f629f0e5d8ea1e0f267c688aedd2c5e), [`457d12c`](https://github.com/LedgerHQ/ledger-live/commit/457d12c949c317d495ba7c391a80fa4b8ee956ee), [`43d4872`](https://github.com/LedgerHQ/ledger-live/commit/43d487261dfb0681b561e4b114b2179acba5e2a8), [`6ef44af`](https://github.com/LedgerHQ/ledger-live/commit/6ef44afa6807ace32b3f6620173868f2ef20e158), [`6ef44af`](https://github.com/LedgerHQ/ledger-live/commit/6ef44afa6807ace32b3f6620173868f2ef20e158), [`8238860`](https://github.com/LedgerHQ/ledger-live/commit/8238860c893b0688d2c59a3e042d7a227031547a), [`d7edc6e`](https://github.com/LedgerHQ/ledger-live/commit/d7edc6ee38776dcbc6da341f734b42d78dc05836)]:
  - @ledgerhq/coin-aleo@1.18.0-next.0
  - @ledgerhq/coin-algorand@1.9.0-next.0
  - @ledgerhq/coin-aptos@3.23.0-next.0
  - @ledgerhq/coin-bitcoin@0.47.0-next.0
  - @ledgerhq/coin-canton@0.29.0-next.0
  - @ledgerhq/coin-cardano@0.30.0-next.0
  - @ledgerhq/coin-casper@2.16.0-next.0
  - @ledgerhq/coin-celo@2.9.0-next.0
  - @ledgerhq/coin-concordium@0.16.0-next.0
  - @ledgerhq/coin-cosmos@0.39.0-next.0
  - @ledgerhq/coin-evm@4.6.0-next.0
  - @ledgerhq/coin-filecoin@1.28.0-next.0
  - @ledgerhq/coin-hedera@1.38.0-next.0
  - @ledgerhq/coin-icon@0.26.0-next.0
  - @ledgerhq/coin-internet_computer@1.25.0-next.0
  - @ledgerhq/coin-kaspa@1.19.0-next.0
  - @ledgerhq/coin-mina@1.18.0-next.0
  - @ledgerhq/coin-multiversx@0.20.0-next.0
  - @ledgerhq/coin-near@0.28.0-next.0
  - @ledgerhq/coin-polkadot@6.30.0-next.0
  - @ledgerhq/coin-solana@0.58.0-next.0
  - @ledgerhq/coin-stacks@0.24.0-next.0
  - @ledgerhq/coin-sui@0.40.0-next.0
  - @ledgerhq/coin-ton@0.32.0-next.0
  - @ledgerhq/coin-tron@6.6.0-next.0
  - @ledgerhq/coin-vechain@2.25.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.4.0-next.0
  - @ledgerhq/cryptoassets@13.55.0-next.0
  - @ledgerhq/coin-tezos@7.9.0-next.0
  - @shared/feature-flags@0.14.0-next.0
  - @ledgerhq/live-env@2.42.0-next.0
  - @domain/entity-currency-crypto@0.6.0-next.0
  - @domain/entity-currency-fiat@0.3.0-next.0
  - @ledgerhq/live-wallet@0.29.0-next.0
  - @ledgerhq/live-currency-format@0.13.0-next.0
  - @ledgerhq/asset-aggregation@0.11.0-next.0
  - @ledgerhq/hw-app-btc@11.3.0-next.0
  - @ledgerhq/live-signer-aleo@0.19.2-next.0
  - @ledgerhq/live-signer-canton@0.9.11-next.0
  - @ledgerhq/live-signer-celo@1.1.7-next.0
  - @ledgerhq/live-signer-concordium@0.6.1-next.0
  - @ledgerhq/live-signer-cosmos@0.4.1-next.0
  - @ledgerhq/live-signer-solana@0.17.1-next.0
  - @ledgerhq/live-countervalues@0.22.1-next.0
  - @ledgerhq/live-countervalues-react@0.16.2-next.0
  - @features/platform-feature-flags@0.6.1-next.0
  - @ledgerhq/evm-tools@1.13.1-next.0
  - @ledgerhq/ledger-cal-service@1.18.4-next.0
  - @ledgerhq/ledger-trust-service@0.8.9-next.0
  - @ledgerhq/live-network@2.6.8-next.0
  - @ledgerhq/speculos-transport@0.10.8-next.0
  - @ledgerhq/device-core@0.11.7-next.0
  - @ledgerhq/domain-service@1.8.10-next.0
  - @ledgerhq/hw-app-eth@7.8.10-next.0
  - @ledgerhq/live-signer-evm@0.21.1-next.0
  - @ledgerhq/hw-app-exchange@0.23.1

## 36.4.0

### Minor Changes

- [#18897](https://github.com/LedgerHQ/ledger-live/pull/18897) [`80d44ad`](https://github.com/LedgerHQ/ledger-live/commit/80d44ade41f3bcb02a2b657c0fe3ca5e3bbdd0b3) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(llc): use Arc native USDC's ERC20 token CAL descriptor for the exchange config, so the device shows the correct (6-decimal) swap amount

- [#17552](https://github.com/LedgerHQ/ledger-live/pull/17552) [`20efcc6`](https://github.com/LedgerHQ/ledger-live/commit/20efcc67fd38bbba793e23abc1f62a14e29a1104) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - sort wallet-api swap quotes by net countervalue

- [#19101](https://github.com/LedgerHQ/ledger-live/pull/19101) [`4b615c2`](https://github.com/LedgerHQ/ledger-live/commit/4b615c242a3b4d8ecb2ebf4e039a46e2bbfe5e19) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(lwdm): fix countervalue magnitude in the new send flow

- [#19087](https://github.com/LedgerHQ/ledger-live/pull/19087) [`b98cce3`](https://github.com/LedgerHQ/ledger-live/commit/b98cce3ff564ab8499876b124a4a5f3a08e0066f) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Use the node's min relay fee as the minimum for manual Bitcoin-family fees in the send flow (BTC falls back to 1 sat/vB). A fee below it is now rejected in the form instead of at broadcast.

- [#19200](https://github.com/LedgerHQ/ledger-live/pull/19200) [`fe580b7`](https://github.com/LedgerHQ/ledger-live/commit/fe580b7a6205b5fe6e73ee7d67a93e8815b24295) Thanks [@gre-ledger](https://github.com/gre-ledger)! - evm: source the EVM signer `calServiceURL` from `getEnv("CAL_SERVICE_URL")` instead of relying on the hw-app-eth hardcoded default, so the CAL base URL has a single env-driven source of truth

- [#19627](https://github.com/LedgerHQ/ledger-live/pull/19627) [`8e3b521`](https://github.com/LedgerHQ/ledger-live/commit/8e3b521c9604cf0b753f056a2c65556d9f91ae79) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Merge release branch into hotfix support branch, resolving version and changelog conflicts

- [#19155](https://github.com/LedgerHQ/ledger-live/pull/19155) [`bb4e6db`](https://github.com/LedgerHQ/ledger-live/commit/bb4e6dbda83a6738d6ac375615f690e579ce4527) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Fix Concordium e2e app.json generation resolving to the mainnet currency instead of testnet, by giving the testnet its own Speculos app identity (mirroring Ethereum Sepolia).

- [#19113](https://github.com/LedgerHQ/ledger-live/pull/19113) [`f9caf32`](https://github.com/LedgerHQ/ledger-live/commit/f9caf322be2e3b652e8ec06fb40aeb8e02e08c8a) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - coin-evm: createApi returns a pure CoinModuleApi; move refreshOperations/validateTransaction/stakingSupported to the ledger-live-common EVM bridge api

- [#19238](https://github.com/LedgerHQ/ledger-live/pull/19238) [`3cb6159`](https://github.com/LedgerHQ/ledger-live/commit/3cb615918166922059304724f560c566d2671ac3) Thanks [@amaslakov](https://github.com/amaslakov)! - Persist the per-account compressed secp256k1 public key (hex) in `cosmosResources`, captured from the device at scan, and expose it via the Wallet API `account.getPublicKey` resolver for the cosmos family. Enables WalletConnect `cosmos_getAccounts`. Accounts synced before this change return no public key until re-synced.

- [#19256](https://github.com/LedgerHQ/ledger-live/pull/19256) [`7a3c4a5`](https://github.com/LedgerHQ/ledger-live/commit/7a3c4a5a2dd0c1ca7382d4bc9c27d2e3bfc671a9) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - private sync for mobile Aleo part 1

- [#19071](https://github.com/LedgerHQ/ledger-live/pull/19071) [`3b35b5e`](https://github.com/LedgerHQ/ledger-live/commit/3b35b5ea8a0c67c215150f2aee008fd1c1993463) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - coin-evm: move the EVM signer (types + getAddress/signMessage) out to live-signer-evm and ledger-live-common

- [#19292](https://github.com/LedgerHQ/ledger-live/pull/19292) [`7c27a44`](https://github.com/LedgerHQ/ledger-live/commit/7c27a446680a2e014e3154bbdd5e69673dd3e07c) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - chore: update default node robinhood

- [#19194](https://github.com/LedgerHQ/ledger-live/pull/19194) [`1838412`](https://github.com/LedgerHQ/ledger-live/commit/18384123adca558b00323f169dffc0daf117b822) Thanks [@ishaba](https://github.com/ishaba)! - feat(celo): implement coin-module api

- [#19145](https://github.com/LedgerHQ/ledger-live/pull/19145) [`1e17c12`](https://github.com/LedgerHQ/ledger-live/commit/1e17c127178a871b665b25d6f4208d4613826dd1) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop the per-coin `cli.ts` / `cli-transaction.ts` / `test/cli.ts` (`makeCliTools`) contract from coin families and the `cliTools` field of `FamilySetup`. The only consumer was the `apps/cli` `send` command, and the only e2e path that used it was the EVM ERC20 token approval. That flow is now a dedicated, self-contained `tokenApproval` CLI command; the generic `send` command keeps the cross-family options only.

- [#18787](https://github.com/LedgerHQ/ledger-live/pull/18787) [`63dcc63`](https://github.com/LedgerHQ/ledger-live/commit/63dcc636c4a1c360beb7ece0a3ee32ba7550b693) Thanks [@VicAlbr](https://github.com/VicAlbr)! - e2e: pre-generate and reuse app.json userdata and receive addresses (account + dedicated UTXO caches) so desktop and mobile E2E skip live Speculos account scanning. Adds a daily cache-generation workflow, CLI generator commands, and a release-validation guard that keeps release runs (desktop build_type=js, mobile production_firebase) on the legacy live scan; coins missing from the cache fall back to the live scan (QAA-1285).

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

- [#18817](https://github.com/LedgerHQ/ledger-live/pull/18817) [`9f8ab96`](https://github.com/LedgerHQ/ledger-live/commit/9f8ab9672ababc02909e7553d433ee326c37762e) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Remove the `newReceiveDialog` feature flag and make the new Lumen receive options dialog the permanent default on desktop. This drops the legacy `StepOptions` receive step, the `useLegacyReceiveOptions` path, and the related `shouldDisplayNewReceiveDialog` config across the feature-flags packages and types.

- [#18934](https://github.com/LedgerHQ/ledger-live/pull/18934) [`edebe91`](https://github.com/LedgerHQ/ledger-live/commit/edebe91895773e4e2c9f29bc0a991885d2f44a77) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwdm): restore recent address store for lwdm

- [#18911](https://github.com/LedgerHQ/ledger-live/pull/18911) [`acaf6d9`](https://github.com/LedgerHQ/ledger-live/commit/acaf6d991aec6bfcc7b6a0906d873f7d8e57eded) Thanks [@qperrot](https://github.com/qperrot)! - Fix "send max" offering already-committed funds while a previous send is still pending. Optimistic pending operations are now subtracted from the spendable balance used by the generic coin framework (send max, amount and gas validation), preventing on-chain "Insufficient funds for gas \* price + value" errors when sending again before the next account sync. Affects EVM and other coins built on the generic coin framework. Sponsored (gasless) pending transactions no longer lock their fee against the native balance, since the fee is paid by a third party and not by the account.

- [#19575](https://github.com/LedgerHQ/ledger-live/pull/19575) [`50ab44f`](https://github.com/LedgerHQ/ledger-live/commit/50ab44f07f628fd819dff28d8cdd14b1ca5e4962) Thanks [@LucasWerey](https://github.com/LucasWerey)! - fix selectCurrencyForMetaId returning Arbitrum One chain instead of ARB ERC-20 token

- [#19141](https://github.com/LedgerHQ/ledger-live/pull/19141) [`2caa65c`](https://github.com/LedgerHQ/ledger-live/commit/2caa65c2ada66ef20c76950b5a2b01c49845f8eb) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Fix content card displayedPosition analytics by stripping Braze string values in sanitizeExtras and finalizing numeric indices at the tracking gateway (mobile trackContentCardEvent, desktop trackContentCard) instead of at each call site.

- [#18786](https://github.com/LedgerHQ/ledger-live/pull/18786) [`8d7f2b3`](https://github.com/LedgerHQ/ledger-live/commit/8d7f2b3d517780578799cc83152f6434381b2e26) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Fix top_wallet content card canvas_name and canvas_step_name tracking

- [#18632](https://github.com/LedgerHQ/ledger-live/pull/18632) [`8dd5685`](https://github.com/LedgerHQ/ledger-live/commit/8dd5685a0a42b8277846754f0251eaf38a12fa51) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(llc): syncGasOptionsEffect for evm descriptor

- [#18951](https://github.com/LedgerHQ/ledger-live/pull/18951) [`bfb5437`](https://github.com/LedgerHQ/ledger-live/commit/bfb543708a32256379067903c3f1c3ab46a323d3) Thanks [@deepyjr](https://github.com/deepyjr)! - Add Desktop transaction history dust filtering controls.

- [#19272](https://github.com/LedgerHQ/ledger-live/pull/19272) [`e2d74f7`](https://github.com/LedgerHQ/ledger-live/commit/e2d74f7c5fe9883d6a141ce790a0b0aa92d7e53a) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-evm): raise an error if gas price is less than the network minimum

- [#19036](https://github.com/LedgerHQ/ledger-live/pull/19036) [`addef52`](https://github.com/LedgerHQ/ledger-live/commit/addef52ed445008c16e3f94d66f46222c8c535f7) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - remove marketbanner param from wallet4.0 FF

- [#19063](https://github.com/LedgerHQ/ledger-live/pull/19063) [`eab9b13`](https://github.com/LedgerHQ/ledger-live/commit/eab9b130e0a809d6dead08bbd1a588112da94e0c) Thanks [@dilaouid](https://github.com/dilaouid)! - chore(llc): refactor useFeePresetFiatValues to use in both LWDM

- [#19245](https://github.com/LedgerHQ/ledger-live/pull/19245) [`b5699a5`](https://github.com/LedgerHQ/ledger-live/commit/b5699a54d7edd5b3579a7f35d77a03d2b0506d19) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(algo): remove memo algorand in new send flow lwdm

- [#19164](https://github.com/LedgerHQ/ledger-live/pull/19164) [`c1e9aa3`](https://github.com/LedgerHQ/ledger-live/commit/c1e9aa3a8851a85cf0ec9b0718177baf39cc9db8) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(llc): fix celo pays with tokens unit wrong value

- [#19260](https://github.com/LedgerHQ/ledger-live/pull/19260) [`5c2bc46`](https://github.com/LedgerHQ/ledger-live/commit/5c2bc46ce7e0dac5a9bfbf4089ca14868126bc96) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Add pure `isCooldownElapsed` and `shouldThrottle` helpers for the large-screen upsell timing.

- [#18965](https://github.com/LedgerHQ/ledger-live/pull/18965) [`cc01b77`](https://github.com/LedgerHQ/ledger-live/commit/cc01b777c9b54ccf2a9f2b34f0281d3d7123b157) Thanks [@ishaba](https://github.com/ishaba)! - perf(sui): populate staking extras at sync, drop per-drawer transaction(digest:) re-fetch

- [#19197](https://github.com/LedgerHQ/ledger-live/pull/19197) [`c8b4ee7`](https://github.com/LedgerHQ/ledger-live/commit/c8b4ee77c03ca2117cbad039331b7b52e50d9620) Thanks [@lysyi3m](https://github.com/lysyi3m)! - generic-coin-framework: store the account public key in `Account.xpub` (previously the address) for the evm/xrp/stellar/tezos families. Derive `makeSync`'s account-id identity from the immutable account id instead of the mutable `xpub` field, so healing `xpub` to the public key never re-keys or clears accounts. Account ids remain address-based; existing accounts populate `xpub` on the next device-connected scan.

- [#18862](https://github.com/LedgerHQ/ledger-live/pull/18862) [`8ecbdde`](https://github.com/LedgerHQ/ledger-live/commit/8ecbdde35c80f7c363f1511fa8463155437b9612) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Extract shared swap transaction status logic for LIVE-29443 while preserving the existing transaction status import paths.

- [#19023](https://github.com/LedgerHQ/ledger-live/pull/19023) [`3f71b7a`](https://github.com/LedgerHQ/ledger-live/commit/3f71b7af8419e92e907be029b7fed052288561b7) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Monad staking: pin the Ledger validator ("Ledger by P2P.org") to the top of the validator list so it is selected by default when delegating

- [#18633](https://github.com/LedgerHQ/ledger-live/pull/18633) [`e9b1707`](https://github.com/LedgerHQ/ledger-live/commit/e9b17073cdf3266692adc4348c9a54f5597da4c8) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwdm): move the Celo "Pay fees in" selector from the Amount step to the Custom fees step using a generic, family-agnostic fee asset descriptor

- [#17564](https://github.com/LedgerHQ/ledger-live/pull/17564) [`babad68`](https://github.com/LedgerHQ/ledger-live/commit/babad685139d06343f6a647686c713992ad1ac1a) Thanks [@dilaouid](https://github.com/dilaouid)! - tests(e2e): add detox for evm native staking (sei_evm) and mock smoke under `apps/ledger-live-mobile/e2e` and Speculos delegate flow under `e2e/mobile`

- [#18814](https://github.com/LedgerHQ/ledger-live/pull/18814) [`fa0123a`](https://github.com/LedgerHQ/ledger-live/commit/fa0123a1da7b053d58afab498266cf830958e2ff) Thanks [@ysitbon](https://github.com/ysitbon)! - Migrate remaining lint scripts from ESLint to oxlint and drop Prettier (oxfmt is now the sole formatter)

- [#19187](https://github.com/LedgerHQ/ledger-live/pull/19187) [`0e30cdc`](https://github.com/LedgerHQ/ledger-live/commit/0e30cdc29d7fb3cab5bf1f2ef7c24cf0a152516e) Thanks [@sarneijim](https://github.com/sarneijim)! - Persist onboardingDate in the shared post-onboarding store to power the post-onboarding upsell cooldown. It is preserved when reopening or hiding the wallet entry point for the same device, refreshed when a different device is onboarded, and backfilled to today once for legacy users on first launch.

- [#19092](https://github.com/LedgerHQ/ledger-live/pull/19092) [`fa25271`](https://github.com/LedgerHQ/ledger-live/commit/fa252719220ca27fa4556ce9a02b84ccfca835c3) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - coin-evm: move deviceTransactionConfig, bot specs and speculos device actions to ledger-live-common families/evm

- [#18624](https://github.com/LedgerHQ/ledger-live/pull/18624) [`5a64d39`](https://github.com/LedgerHQ/ledger-live/commit/5a64d39ac89a125331c6d937642bf50d44255082) Thanks [@jeportie](https://github.com/jeportie)! - fix(e2e): give swap flows a larger "Review transaction" device-wait budget (~120s) to reduce flaky "Review transaction not found" timeouts on nanoSP under heavy parallel Speculos load (QAA-1322)

- [#18913](https://github.com/LedgerHQ/ledger-live/pull/18913) [`c6cf445`](https://github.com/LedgerHQ/ledger-live/commit/c6cf445c9bac5a56bcbf84ccda6b2b269d1ee61a) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Remove the legacy add-account modal, DataSelector drawers and modular drawer visibility gating now that the Modular Drawer is the only flow. All Live App, stake, send and account-selection entry points use the modular flows unconditionally, and the `useModularDrawerVisibility` hook is removed in favor of a dedicated `ModularDrawerVisibleParams` type.

- [#19009](https://github.com/LedgerHQ/ledger-live/pull/19009) [`1f25437`](https://github.com/LedgerHQ/ledger-live/commit/1f254373fedec85e50364fdbc6bb9ec4fd5256b2) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Track Funds received analytics when a new receive operation is synced on desktop and mobile.

- [#19196](https://github.com/LedgerHQ/ledger-live/pull/19196) [`edacd7c`](https://github.com/LedgerHQ/ledger-live/commit/edacd7c60413812e13a20d6451d5870ff5ced34e) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Relocate EVM operation helpers (`isEditableOperation`, `isStuckOperation`, `getStuckAccountAndOperation`) from `@ledgerhq/coin-evm/operation` to `families/evm/editTransaction/` in `ledger-live-common`

- [#18885](https://github.com/LedgerHQ/ledger-live/pull/18885) [`0fa8c6c`](https://github.com/LedgerHQ/ledger-live/commit/0fa8c6c7daf524f075623287418bc8ad74e464f3) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: enable aleo auto record picking strategy

- [#19058](https://github.com/LedgerHQ/ledger-live/pull/19058) [`5fc438e`](https://github.com/LedgerHQ/ledger-live/commit/5fc438ec9357c406717f4e4e8c136533198a38b7) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Extract useAleoViewKeyApproval hook and buildAccountsWithViewKeys utility to live-common for shared Desktop and Mobile use

- [#18829](https://github.com/LedgerHQ/ledger-live/pull/18829) [`b3ffa2f`](https://github.com/LedgerHQ/ledger-live/commit/b3ffa2f4bf735f2cfeed2a8028ea92d4bc3588e3) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Sunset the `CryptoCurrency.terminated` field: remove it from the type/schema, delete the 5 currencies it marked (clubcoin, hcash, poswallet, stakenet, stratis), drop the now-unused `withTerminated` parameter from `listCryptoCurrencies`, and clean up the dead code orphaned by those deletions.

- [#18013](https://github.com/LedgerHQ/ledger-live/pull/18013) [`57a48a5`](https://github.com/LedgerHQ/ledger-live/commit/57a48a5fb17e47c6ce686fe297344c2a580d84d7) Thanks [@CremaFR](https://github.com/CremaFR)! - Add `customSwap` to the wallet-api exchange SDK and expose the matching `CustomSwapParams` / `CustomSwapResult` types (also re-exported from `@ledgerhq/live-common/wallet-api/Exchange/swapFlow/types`). This is the live-app entry point for the new device-intent-based swap flow on mobile, which currently runs the EVM token-approval step (sign on device, broadcast, wait for the receipt). Submit-swap and broadcast-swap will follow on the wallet side, reusing this same wire shape.

- [#19166](https://github.com/LedgerHQ/ledger-live/pull/19166) [`4b2f537`](https://github.com/LedgerHQ/ledger-live/commit/4b2f537cf6ffd1ed20d2df63f6940dc13f68fbee) Thanks [@CremaFR](https://github.com/CremaFR)! - Show the real on-chain received amount for finished DEX swaps in swap history. `getCompleteSwapHistory` now derives `finalAmount` from the receiving account's incoming operation (including native receives via internal operations) instead of always falling back to the quoted `toAmount`, so both the history rows and the transaction status detail/drawer reflect what was actually received.

- [#18013](https://github.com/LedgerHQ/ledger-live/pull/18013) [`57a48a5`](https://github.com/LedgerHQ/ledger-live/commit/57a48a5fb17e47c6ce686fe297344c2a580d84d7) Thanks [@CremaFR](https://github.com/CremaFR)! - Move the cross-platform parts of the swap device-intent stack (`signApprovalEvm`, `signSwapEvm`, `broadcastEvm` jobs, definitions and types) from `apps/ledger-live-mobile` into `@ledgerhq/live-common/wallet-api/Exchange/intents` so the same logic can later be reused by the desktop wallet. The mobile side now only owns the LWM React components and `intentLWMDefinition.ts` thin wrappers that attach those components to the shared cross-platform definitions.

- [#18013](https://github.com/LedgerHQ/ledger-live/pull/18013) [`57a48a5`](https://github.com/LedgerHQ/ledger-live/commit/57a48a5fb17e47c6ce686fe297344c2a580d84d7) Thanks [@CremaFR](https://github.com/CremaFR)! - Add support for Permit2 + classic AMM swap quotes (Uniswap with
  `permitData`, non-RFQ) and RFQ swap quotes (UniswapX, 1inch Fusion) in
  the wallet-side `custom.swap` device-intent flow. A new cross-platform
  `signPermit2Evm` intent signs the EIP-712 typed-data payload via DMK's
  `signTypedData` device action, and the shared `swapFlow` machine grows
  four new plan kinds (`permit-then-swap`, `approval-then-permit-then-swap`,
  `rfq-order`, `approval-then-rfq-order`) plus the matching `signPermit2`,
  `signRfqOrder`, and `submitRfqOrder` states. The Permit2 path threads the
  resulting signature into the DEX builder's `buildContext.permitSignature`;
  the RFQ path signs an off-chain EIP-712 order then submits and polls it
  against the partner's swap-api endpoints. The planner refuses to silently
  downgrade to a direct swap when a DEX quote claims approval is required
  but ships no approval blob (`reason: "dex-approval-blob-missing"`),
  skip-guards RFQ quotes that are missing the EIP-712 payload we need to
  sign (`reason: "rfq-typed-data-missing"`), and surfaces the
  USDT-on-Ethereum revoke edge case as `reason: "usdt-revoke-needed"` so
  hosts can fall back to the legacy swap pipeline for that flow.

- [#18013](https://github.com/LedgerHQ/ledger-live/pull/18013) [`57a48a5`](https://github.com/LedgerHQ/ledger-live/commit/57a48a5fb17e47c6ce686fe297344c2a580d84d7) Thanks [@CremaFR](https://github.com/CremaFR)! - Extract a headless XState machine + flow planner for the wallet-side
  `custom.swap` device-intent flow into
  `@ledgerhq/live-common/wallet-api/Exchange/swapFlow`. The machine ports
  the swap-live-app `_stepMachine` step vocabulary (`approve_token` ->
  `swap`) onto the wallet-side phases (`signApproval`, `broadcastApproval`,
  `buildSwap`, `signSwap`, `broadcastSwap`) and runs them through injected
  `SwapFlowPorts` with no React, Lumen, or DMK imports. Already-approved
  DEX quotes now go through a wallet-driven direct-swap path instead of
  short-circuiting to `{}`. The mobile orchestration hook becomes a thin
  adapter that builds LWM ports, runs the shared machine via
  `@xstate/react#useMachine`, and derives `executorProps` /
  `successScreen` / `enabled` from machine state. A future CLI adapter can
  reuse the same machine by implementing the `SwapFlowPorts` contract.

- [#18955](https://github.com/LedgerHQ/ledger-live/pull/18955) [`376915c`](https://github.com/LedgerHQ/ledger-live/commit/376915ca520ecc1708090ed9b3eba1ff7e780540) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(mobile): add tracking on new send flow part 2

- [#19125](https://github.com/LedgerHQ/ledger-live/pull/19125) [`154ff71`](https://github.com/LedgerHQ/ledger-live/commit/154ff7146a642d7953a91394022eeda5d437c450) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Point the Concordium Speculos e2e spec at the concordium_testnet currency it actually tests

- [#19112](https://github.com/LedgerHQ/ledger-live/pull/19112) [`8169225`](https://github.com/LedgerHQ/ledger-live/commit/81692256d96fd47acf288c0f646b15c92fe8d7be) Thanks [@dilaouid](https://github.com/dilaouid)! - chore(lwdm): refacto gas and memo in the new send flow

- [#17890](https://github.com/LedgerHQ/ledger-live/pull/17890) [`df088d2`](https://github.com/LedgerHQ/ledger-live/commit/df088d26908b24e936bc8d6f508a438d151222f0) Thanks [@cted-ledger](https://github.com/cted-ledger)! - feat(coin-tezos): support multi-asset FA2 contracts (wrapped tokens)

  Remove the tokenId=0 filter in TzKT queries so balances and operations
  for all FA2 tokens are returned, including multi-asset contracts like
  the Wrapped Tokens Contract (KT18fp5rc…).

  Parse the assetReference (contract:tokenId) in the Tezos bridge to pass
  tokenIdentifier to findTokenByAddressInCurrency, enabling correct CAL
  token resolution for multi-asset contracts.

- [#18426](https://github.com/LedgerHQ/ledger-live/pull/18426) [`2160260`](https://github.com/LedgerHQ/ledger-live/commit/2160260cc0d660331c05f1bfdb0a4f28d486e275) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Handle the Wallet API `account.getPublicKey` method. The wallet resolves the account public key per family, fail-closed: Tezos returns its base58 public key (from `seedIdentifier`) and every other family rejects with "not implemented". Enables dApp flows that need the public key up front (e.g. `tezos_getAccounts`).

- [#19178](https://github.com/LedgerHQ/ledger-live/pull/19178) [`3da6b44`](https://github.com/LedgerHQ/ledger-live/commit/3da6b4439d61a7ad7f06e04be12aa1e92b9cdb55) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove the balanceRefreshRework param of the wallet 4.0 feature flag everywhere; the reworked balance refresh is now always used on mobile

- [#19302](https://github.com/LedgerHQ/ledger-live/pull/19302) [`f9411d1`](https://github.com/LedgerHQ/ledger-live/commit/f9411d1e2a06b031555cda9e26ecba37b4cf045e) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove the `graphRework` param of the Wallet 4.0 feature flag on both platforms. The param is no longer consumed on desktop (LIVE-33502) nor mobile, so it is dropped entirely: from the `lwmWallet40` / `lwdWallet40` schemas, the shared `Feature_Wallet40_Params` type, the analytics helper, the `shouldDisplayGraphRework` getter in `useWalletFeaturesConfig`, and both platforms' debug dev-tool lists.

  On mobile the Wallet 4.0 balance hero is now always rendered: the legacy portfolio graph card is dropped from the portfolio header and read-only screens (the `GraphCard` / `GraphCardContainer` / `PortfolioGraphCard` components stay, still used by the Analytics screen), and the graphRework gating is removed from every mobile call site (Portfolio screen/VM, `Delta`, settings reducer, WalletAssets VM).

- [#19203](https://github.com/LedgerHQ/ledger-live/pull/19203) [`6eea36b`](https://github.com/LedgerHQ/ledger-live/commit/6eea36bfafeba265672a96b37981e2c7e629ef33) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove the mainNavigation param of the wallet 4.0 feature flag; the wallet 4.0 main navigation is now always used on mobile and the legacy tab-bar/top-bar code paths are removed

- [#19261](https://github.com/LedgerHQ/ledger-live/pull/19261) [`35d4af9`](https://github.com/LedgerHQ/ledger-live/commit/35d4af90e7bee849814cd98358c80e20ef4e4f2a) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Wallet 4.0 Q1 cleanup on mobile:

  - Remove the `quickActionCtas` param of the `lwmWallet40` feature flag. The quick-action CTAs are now always enabled; the `shouldDisplayQuickActionCtas` getter and the legacy `PortfolioQuickActionsBar` are removed.
  - Remove the legacy (pre-4.0) Portfolio screen. `PortfolioRootScreen` now always renders the MVVM `Portfolio` / `ReadOnlyPortfolio`, and the dead legacy screen files are deleted.

- [#18615](https://github.com/LedgerHQ/ledger-live/pull/18615) [`596a445`](https://github.com/LedgerHQ/ledger-live/commit/596a4452f04afbffdf0935e946e691f7775cb80c) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - [LWDM] feat(swap): forward lifi data to the device

- [#19068](https://github.com/LedgerHQ/ledger-live/pull/19068) [`0e302a5`](https://github.com/LedgerHQ/ledger-live/commit/0e302a5a2e71a63af7e79d9a195e5e2cca36642c) Thanks [@dilaouid](https://github.com/dilaouid)! - chore(llc): share useNetworkFee hooks through lwd and lwm in common

- [#19078](https://github.com/LedgerHQ/ledger-live/pull/19078) [`363ac4d`](https://github.com/LedgerHQ/ledger-live/commit/363ac4d27f4e71b1e6e00b1c128bc199d1170839) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - coin-evm: move transaction serialization helpers and CLI tools to ledger-live-common families/evm

- [#18874](https://github.com/LedgerHQ/ledger-live/pull/18874) [`e0b2f53`](https://github.com/LedgerHQ/ledger-live/commit/e0b2f53c10d88554f6e9082f728fb3cfff7e805c) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Block XRP send and show an error when the recipient requires a destination tag and none is provided (bumps @ledgerhq/coin-xrp to 7.23.5)

- [#19123](https://github.com/LedgerHQ/ledger-live/pull/19123) [`e9a51af`](https://github.com/LedgerHQ/ledger-live/commit/e9a51afa1d2a79d856e1487ab3bd77670ccc5e86) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - add swap cli die

### Patch Changes

- Updated dependencies [[`7a11615`](https://github.com/LedgerHQ/ledger-live/commit/7a11615e8a37a35a0410e4f89f18f064e7ac2ee5), [`41e0064`](https://github.com/LedgerHQ/ledger-live/commit/41e0064e837c2b99750b563d219748d40305b304), [`6df2017`](https://github.com/LedgerHQ/ledger-live/commit/6df20171a84b54e5b67eabefc938a98d7e3c3e43), [`a7734c2`](https://github.com/LedgerHQ/ledger-live/commit/a7734c23a635ddde880176ee04ff409a67eae613), [`20efcc6`](https://github.com/LedgerHQ/ledger-live/commit/20efcc67fd38bbba793e23abc1f62a14e29a1104), [`a2621e2`](https://github.com/LedgerHQ/ledger-live/commit/a2621e2c6c6369c7109af72e1cb59df2448951ff), [`e18fe2d`](https://github.com/LedgerHQ/ledger-live/commit/e18fe2d81d86650e816b8b5da9ea311048a3e30e), [`b98cce3`](https://github.com/LedgerHQ/ledger-live/commit/b98cce3ff564ab8499876b124a4a5f3a08e0066f), [`8e3b521`](https://github.com/LedgerHQ/ledger-live/commit/8e3b521c9604cf0b753f056a2c65556d9f91ae79), [`6d9da62`](https://github.com/LedgerHQ/ledger-live/commit/6d9da62546cd54bf562f09542141635aab6c95dd), [`3b9ad8e`](https://github.com/LedgerHQ/ledger-live/commit/3b9ad8e33408679af1a3737c6cb3a2473a044c07), [`cd26957`](https://github.com/LedgerHQ/ledger-live/commit/cd26957e4147e438dab908f0cc700115dd95b422), [`19aa0b4`](https://github.com/LedgerHQ/ledger-live/commit/19aa0b499c3c4a9f6348f4af367636492a8023d1), [`0c9b5fc`](https://github.com/LedgerHQ/ledger-live/commit/0c9b5fc79922a62a2ca124d1c251f177ac3a3969), [`70a706e`](https://github.com/LedgerHQ/ledger-live/commit/70a706e4efe3a6fa176f9827a4a06949ba185f11), [`94fcc69`](https://github.com/LedgerHQ/ledger-live/commit/94fcc69009b7e07aab43afdc7214b486b2c7811a), [`8b6614e`](https://github.com/LedgerHQ/ledger-live/commit/8b6614eaff423aaeb50b7eb44ba5916a941a573d), [`f9caf32`](https://github.com/LedgerHQ/ledger-live/commit/f9caf322be2e3b652e8ec06fb40aeb8e02e08c8a), [`3cb6159`](https://github.com/LedgerHQ/ledger-live/commit/3cb615918166922059304724f560c566d2671ac3), [`c5763f6`](https://github.com/LedgerHQ/ledger-live/commit/c5763f6171f49d2b9e679b982804e68843800450), [`1d40088`](https://github.com/LedgerHQ/ledger-live/commit/1d40088e095cc064d9f3020e2fa6dd787aaca671), [`3b35b5e`](https://github.com/LedgerHQ/ledger-live/commit/3b35b5ea8a0c67c215150f2aee008fd1c1993463), [`38728f9`](https://github.com/LedgerHQ/ledger-live/commit/38728f9d9ac879c276def56ce88c5e49549e4b9d), [`d91f849`](https://github.com/LedgerHQ/ledger-live/commit/d91f849185c7a30514349be655bba69dd77bb8c8), [`1838412`](https://github.com/LedgerHQ/ledger-live/commit/18384123adca558b00323f169dffc0daf117b822), [`86ca231`](https://github.com/LedgerHQ/ledger-live/commit/86ca231ea9e0ec5996258b1abfa9742a7df3f9ec), [`714411f`](https://github.com/LedgerHQ/ledger-live/commit/714411fcbf054244444ec97f2e53039417cba54e), [`1e17c12`](https://github.com/LedgerHQ/ledger-live/commit/1e17c127178a871b665b25d6f4208d4613826dd1), [`ca07aac`](https://github.com/LedgerHQ/ledger-live/commit/ca07aac857c58e3d85beab71b246d8af687431f3), [`5ccd2a9`](https://github.com/LedgerHQ/ledger-live/commit/5ccd2a9c229e8007851c6eb8b01c866c8e605932), [`6400154`](https://github.com/LedgerHQ/ledger-live/commit/6400154daa131b225c6ec62c9134f1cd06370729), [`43fc364`](https://github.com/LedgerHQ/ledger-live/commit/43fc36426f23a838e2b3c74692dbad29e54b4088), [`3973f11`](https://github.com/LedgerHQ/ledger-live/commit/3973f1109d66996b728ecb63489eced25b967838), [`9f8ab96`](https://github.com/LedgerHQ/ledger-live/commit/9f8ab9672ababc02909e7553d433ee326c37762e), [`e6566ff`](https://github.com/LedgerHQ/ledger-live/commit/e6566ff55d95ff36832d5f77899d67d80842f418), [`c304640`](https://github.com/LedgerHQ/ledger-live/commit/c30464053e6f54f194db6adbe1ff41f06658108e), [`7914bd1`](https://github.com/LedgerHQ/ledger-live/commit/7914bd123d4f3b990db035f28dca4904420562ec), [`996c76b`](https://github.com/LedgerHQ/ledger-live/commit/996c76b157553c547f83d877d25199b311ee0f63), [`4f541c2`](https://github.com/LedgerHQ/ledger-live/commit/4f541c2f45d508dd12b4d4ff92dec294e6005865), [`e2d74f7`](https://github.com/LedgerHQ/ledger-live/commit/e2d74f7c5fe9883d6a141ce790a0b0aa92d7e53a), [`973118a`](https://github.com/LedgerHQ/ledger-live/commit/973118a511dbdf862387c94272a89739a011e797), [`addef52`](https://github.com/LedgerHQ/ledger-live/commit/addef52ed445008c16e3f94d66f46222c8c535f7), [`559f694`](https://github.com/LedgerHQ/ledger-live/commit/559f694fa73a2f68ac3fc867291a0fce99969552), [`ab6aa6e`](https://github.com/LedgerHQ/ledger-live/commit/ab6aa6e50184b17247719741a2db23adf4475665), [`81373c1`](https://github.com/LedgerHQ/ledger-live/commit/81373c1ca46cf2094cfd4f98958eff2114f02cea), [`7fe5f11`](https://github.com/LedgerHQ/ledger-live/commit/7fe5f1129d6ac218ad274f2187a1a3dd83b8855a), [`10dd123`](https://github.com/LedgerHQ/ledger-live/commit/10dd123758a49b38266984540a05cd52d07e00a3), [`34bccb5`](https://github.com/LedgerHQ/ledger-live/commit/34bccb5268c8b27f87f2ab0395e372d4f1d5d926), [`cc01b77`](https://github.com/LedgerHQ/ledger-live/commit/cc01b777c9b54ccf2a9f2b34f0281d3d7123b157), [`966d6a1`](https://github.com/LedgerHQ/ledger-live/commit/966d6a198412c12548575516a2ac72456c380181), [`7c39ea3`](https://github.com/LedgerHQ/ledger-live/commit/7c39ea39ca8999bcb8ce2294f4884430b6d1b2dc), [`d686e93`](https://github.com/LedgerHQ/ledger-live/commit/d686e93f8a548ff4e9ab3c877ad1f815510b35d9), [`e97314e`](https://github.com/LedgerHQ/ledger-live/commit/e97314e0d8201195a91e5eeb0fcde9e2b1dfff76), [`f495213`](https://github.com/LedgerHQ/ledger-live/commit/f495213e811477c99d62f0d93cc7c513b951a303), [`0225804`](https://github.com/LedgerHQ/ledger-live/commit/0225804cd0f39b90050f52b14e1b159340f0530e), [`c8b4ee7`](https://github.com/LedgerHQ/ledger-live/commit/c8b4ee77c03ca2117cbad039331b7b52e50d9620), [`e820e40`](https://github.com/LedgerHQ/ledger-live/commit/e820e402fb57d52b31dcd6de26f8d31d9564e2a4), [`007f27e`](https://github.com/LedgerHQ/ledger-live/commit/007f27e81cce353a3ee6648543d54d06ae6e7a11), [`ba433a1`](https://github.com/LedgerHQ/ledger-live/commit/ba433a1a08fa65ce3d376bb0d60fe1d4241b422d), [`fa0123a`](https://github.com/LedgerHQ/ledger-live/commit/fa0123a1da7b053d58afab498266cf830958e2ff), [`b10ca6a`](https://github.com/LedgerHQ/ledger-live/commit/b10ca6ab5e80889b24805b460f81eff5748f0170), [`73b6013`](https://github.com/LedgerHQ/ledger-live/commit/73b60134a199c19606a7d1be3d0fc41f15cf99c2), [`fa25271`](https://github.com/LedgerHQ/ledger-live/commit/fa252719220ca27fa4556ce9a02b84ccfca835c3), [`df96477`](https://github.com/LedgerHQ/ledger-live/commit/df964774bdaccd897e5e7414c172e9c26ff21f67), [`c4ee26d`](https://github.com/LedgerHQ/ledger-live/commit/c4ee26d18dacfcee597357de4b9dbab9fda01dbb), [`237b721`](https://github.com/LedgerHQ/ledger-live/commit/237b7217d7447be97c88030eb86542bcfcff1e38), [`edacd7c`](https://github.com/LedgerHQ/ledger-live/commit/edacd7c60413812e13a20d6451d5870ff5ced34e), [`df6ca42`](https://github.com/LedgerHQ/ledger-live/commit/df6ca422fa70171162974ea71519da5c5eeb55d8), [`e3c0327`](https://github.com/LedgerHQ/ledger-live/commit/e3c032795a0432500a447b756503ce0aefd8c0f6), [`628f21f`](https://github.com/LedgerHQ/ledger-live/commit/628f21f5acf7d5866c0c956d41d69c760caf0caa), [`b9ffdc9`](https://github.com/LedgerHQ/ledger-live/commit/b9ffdc91708686ca1d6c126894b9481b0ffb0305), [`b2e12ce`](https://github.com/LedgerHQ/ledger-live/commit/b2e12ce7b72de43efe8c8ff5290d617fff7f8e31), [`0ebf1f8`](https://github.com/LedgerHQ/ledger-live/commit/0ebf1f8896c1397edd213ae820917394604be0b0), [`b3ffa2f`](https://github.com/LedgerHQ/ledger-live/commit/b3ffa2f4bf735f2cfeed2a8028ea92d4bc3588e3), [`57a48a5`](https://github.com/LedgerHQ/ledger-live/commit/57a48a5fb17e47c6ce686fe297344c2a580d84d7), [`376915c`](https://github.com/LedgerHQ/ledger-live/commit/376915ca520ecc1708090ed9b3eba1ff7e780540), [`b9f3ba5`](https://github.com/LedgerHQ/ledger-live/commit/b9f3ba5707e25d4ef50a7f7ffd4471678aa836ef), [`5aada6f`](https://github.com/LedgerHQ/ledger-live/commit/5aada6f1a72df070770f4b67112f51b5ced58cff), [`dff6ecf`](https://github.com/LedgerHQ/ledger-live/commit/dff6ecff5201a942a9dc61a51c729c47b53052dc), [`69b201e`](https://github.com/LedgerHQ/ledger-live/commit/69b201e2b1e01b2c6bfb6eaf9e0aa60088f175fc), [`df088d2`](https://github.com/LedgerHQ/ledger-live/commit/df088d26908b24e936bc8d6f508a438d151222f0), [`3da6b44`](https://github.com/LedgerHQ/ledger-live/commit/3da6b4439d61a7ad7f06e04be12aa1e92b9cdb55), [`607b032`](https://github.com/LedgerHQ/ledger-live/commit/607b03228d5e648a0611c316c6ab71a60365f349), [`9c42adf`](https://github.com/LedgerHQ/ledger-live/commit/9c42adf9e20ac7c9b4418652a40b5552afe6106d), [`f9411d1`](https://github.com/LedgerHQ/ledger-live/commit/f9411d1e2a06b031555cda9e26ecba37b4cf045e), [`6eea36b`](https://github.com/LedgerHQ/ledger-live/commit/6eea36bfafeba265672a96b37981e2c7e629ef33), [`35d4af9`](https://github.com/LedgerHQ/ledger-live/commit/35d4af90e7bee849814cd98358c80e20ef4e4f2a), [`596a445`](https://github.com/LedgerHQ/ledger-live/commit/596a4452f04afbffdf0935e946e691f7775cb80c), [`363ac4d`](https://github.com/LedgerHQ/ledger-live/commit/363ac4d27f4e71b1e6e00b1c128bc199d1170839), [`aea723c`](https://github.com/LedgerHQ/ledger-live/commit/aea723cac83a43596f1940ed4fc6ecbad49074e0), [`1c1e25d`](https://github.com/LedgerHQ/ledger-live/commit/1c1e25d866e8ad9bf8d29c4bd102ebd5fd02c2b3)]:
  - @ledgerhq/coin-tezos@7.8.0
  - @ledgerhq/coin-aptos@3.22.0
  - @ledgerhq/cryptoassets@13.54.0
  - @ledgerhq/coin-evm@4.5.0
  - @ledgerhq/wallet-api-exchange-module@0.33.0
  - @shared/feature-flags@0.13.0
  - @ledgerhq/coin-bitcoin@0.46.0
  - @ledgerhq/asset-aggregation@0.10.0
  - @ledgerhq/coin-solana@0.57.0
  - @ledgerhq/live-signer-solana@0.17.0
  - @ledgerhq/coin-cardano@0.29.0
  - @ledgerhq/coin-celo@2.8.0
  - @ledgerhq/live-env@2.41.0
  - @ledgerhq/coin-cosmos@0.38.0
  - @ledgerhq/coin-aleo@1.17.0
  - @ledgerhq/live-signer-evm@0.21.0
  - @ledgerhq/live-dmk-shared@0.28.0
  - @features/platform-feature-flags@0.6.0
  - @ledgerhq/coin-multiversx@0.19.0
  - @ledgerhq/coin-algorand@1.8.0
  - @ledgerhq/coin-near@0.27.0
  - @ledgerhq/coin-icon@0.25.0
  - @ledgerhq/coin-ton@0.31.0
  - @ledgerhq/coin-tron@6.5.0
  - @ledgerhq/coin-concordium@0.15.0
  - @ledgerhq/coin-filecoin@1.27.0
  - @ledgerhq/coin-kaspa@1.18.0
  - @ledgerhq/coin-mina@1.17.0
  - @ledgerhq/coin-polkadot@6.29.0
  - @ledgerhq/coin-hedera@1.37.0
  - @ledgerhq/coin-stacks@0.23.0
  - @ledgerhq/coin-sui@0.39.0
  - @ledgerhq/coin-internet_computer@1.24.0
  - @ledgerhq/coin-canton@0.28.0
  - @ledgerhq/coin-casper@2.15.0
  - @ledgerhq/coin-vechain@2.24.0
  - @ledgerhq/ledger-wallet-framework@2.3.0
  - @ledgerhq/live-currency-format@0.12.0
  - @ledgerhq/live-countervalues@0.22.0
  - @ledgerhq/evm-tools@1.13.0
  - @ledgerhq/live-promise@0.3.0
  - @ledgerhq/live-signer-concordium@0.6.0
  - @ledgerhq/live-signer-cosmos@0.4.0
  - @ledgerhq/devices@8.17.0
  - @ledgerhq/live-wallet@0.28.0
  - @ledgerhq/device-core@0.11.6
  - @ledgerhq/domain-service@1.8.9
  - @ledgerhq/hw-app-eth@7.8.9
  - @ledgerhq/live-countervalues-react@0.16.1
  - @ledgerhq/live-signer-aleo@0.19.1
  - @ledgerhq/live-signer-canton@0.9.10
  - @ledgerhq/live-signer-celo@1.1.6
  - @ledgerhq/client-ids@0.11.1
  - @ledgerhq/ledger-cal-service@1.18.3
  - @ledgerhq/ledger-trust-service@0.8.8
  - @ledgerhq/live-network@2.6.7
  - @ledgerhq/speculos-transport@0.10.7
  - @ledgerhq/hw-app-sui@1.11.4
  - @ledgerhq/hw-transport@6.35.6
  - @ledgerhq/live-signer-hyperliquid@1.3.1
  - @ledgerhq/device-intent@4.0.1
  - @ledgerhq/hw-app-exchange@0.23.1
  - @ledgerhq/hw-app-algorand@6.35.6
  - @ledgerhq/hw-app-aptos@6.38.6
  - @ledgerhq/hw-app-btc@11.2.2
  - @ledgerhq/hw-app-hedera@1.6.6
  - @ledgerhq/hw-app-icon@1.7.6
  - @ledgerhq/hw-app-kaspa@1.7.6
  - @ledgerhq/hw-app-multiversx@6.30.6
  - @ledgerhq/hw-app-near@6.35.6
  - @ledgerhq/hw-app-polkadot@6.38.6
  - @ledgerhq/hw-app-str@7.7.6
  - @ledgerhq/hw-app-tezos@6.36.6
  - @ledgerhq/hw-app-trx@6.36.5
  - @ledgerhq/hw-app-vet@0.13.2
  - @ledgerhq/hw-app-xrp@6.37.6
  - @ledgerhq/hw-bolos@6.36.6
  - @ledgerhq/hw-transport-mocker@6.34.6

## 36.4.0-next.0

### Minor Changes

- [#19627](https://github.com/LedgerHQ/ledger-live/pull/19627) [`8e3b521`](https://github.com/LedgerHQ/ledger-live/commit/8e3b521c9604cf0b753f056a2c65556d9f91ae79) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Merge release branch into hotfix support branch, resolving version and changelog conflicts

### Patch Changes

- Updated dependencies [[`8e3b521`](https://github.com/LedgerHQ/ledger-live/commit/8e3b521c9604cf0b753f056a2c65556d9f91ae79)]:
  - @ledgerhq/asset-aggregation@0.10.0-next.0
  - @ledgerhq/coin-solana@0.57.0-next.0
  - @ledgerhq/live-signer-solana@0.17.0-next.0

## 36.4.0-next.1

### Minor Changes

- [#19575](https://github.com/LedgerHQ/ledger-live/pull/19575) [`50ab44f`](https://github.com/LedgerHQ/ledger-live/commit/50ab44f07f628fd819dff28d8cdd14b1ca5e4962) Thanks [@LucasWerey](https://github.com/LucasWerey)! - fix selectCurrencyForMetaId returning Arbitrum One chain instead of ARB ERC-20 token

## 36.4.0-next.0

### Minor Changes

- [#18897](https://github.com/LedgerHQ/ledger-live/pull/18897) [`80d44ad`](https://github.com/LedgerHQ/ledger-live/commit/80d44ade41f3bcb02a2b657c0fe3ca5e3bbdd0b3) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(llc): use Arc native USDC's ERC20 token CAL descriptor for the exchange config, so the device shows the correct (6-decimal) swap amount

- [#17552](https://github.com/LedgerHQ/ledger-live/pull/17552) [`20efcc6`](https://github.com/LedgerHQ/ledger-live/commit/20efcc67fd38bbba793e23abc1f62a14e29a1104) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - sort wallet-api swap quotes by net countervalue

- [#19101](https://github.com/LedgerHQ/ledger-live/pull/19101) [`4b615c2`](https://github.com/LedgerHQ/ledger-live/commit/4b615c242a3b4d8ecb2ebf4e039a46e2bbfe5e19) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(lwdm): fix countervalue magnitude in the new send flow

- [#19087](https://github.com/LedgerHQ/ledger-live/pull/19087) [`b98cce3`](https://github.com/LedgerHQ/ledger-live/commit/b98cce3ff564ab8499876b124a4a5f3a08e0066f) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Use the node's min relay fee as the minimum for manual Bitcoin-family fees in the send flow (BTC falls back to 1 sat/vB). A fee below it is now rejected in the form instead of at broadcast.

- [#19200](https://github.com/LedgerHQ/ledger-live/pull/19200) [`fe580b7`](https://github.com/LedgerHQ/ledger-live/commit/fe580b7a6205b5fe6e73ee7d67a93e8815b24295) Thanks [@gre-ledger](https://github.com/gre-ledger)! - evm: source the EVM signer `calServiceURL` from `getEnv("CAL_SERVICE_URL")` instead of relying on the hw-app-eth hardcoded default, so the CAL base URL has a single env-driven source of truth

- [#19155](https://github.com/LedgerHQ/ledger-live/pull/19155) [`bb4e6db`](https://github.com/LedgerHQ/ledger-live/commit/bb4e6dbda83a6738d6ac375615f690e579ce4527) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Fix Concordium e2e app.json generation resolving to the mainnet currency instead of testnet, by giving the testnet its own Speculos app identity (mirroring Ethereum Sepolia).

- [#19113](https://github.com/LedgerHQ/ledger-live/pull/19113) [`f9caf32`](https://github.com/LedgerHQ/ledger-live/commit/f9caf322be2e3b652e8ec06fb40aeb8e02e08c8a) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - coin-evm: createApi returns a pure CoinModuleApi; move refreshOperations/validateTransaction/stakingSupported to the ledger-live-common EVM bridge api

- [#19238](https://github.com/LedgerHQ/ledger-live/pull/19238) [`3cb6159`](https://github.com/LedgerHQ/ledger-live/commit/3cb615918166922059304724f560c566d2671ac3) Thanks [@amaslakov](https://github.com/amaslakov)! - Persist the per-account compressed secp256k1 public key (hex) in `cosmosResources`, captured from the device at scan, and expose it via the Wallet API `account.getPublicKey` resolver for the cosmos family. Enables WalletConnect `cosmos_getAccounts`. Accounts synced before this change return no public key until re-synced.

- [#19256](https://github.com/LedgerHQ/ledger-live/pull/19256) [`7a3c4a5`](https://github.com/LedgerHQ/ledger-live/commit/7a3c4a5a2dd0c1ca7382d4bc9c27d2e3bfc671a9) Thanks [@mateuszpalosz-ext](https://github.com/mateuszpalosz-ext)! - private sync for mobile Aleo part 1

- [#19071](https://github.com/LedgerHQ/ledger-live/pull/19071) [`3b35b5e`](https://github.com/LedgerHQ/ledger-live/commit/3b35b5ea8a0c67c215150f2aee008fd1c1993463) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - coin-evm: move the EVM signer (types + getAddress/signMessage) out to live-signer-evm and ledger-live-common

- [#19292](https://github.com/LedgerHQ/ledger-live/pull/19292) [`7c27a44`](https://github.com/LedgerHQ/ledger-live/commit/7c27a446680a2e014e3154bbdd5e69673dd3e07c) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - chore: update default node robinhood

- [#19194](https://github.com/LedgerHQ/ledger-live/pull/19194) [`1838412`](https://github.com/LedgerHQ/ledger-live/commit/18384123adca558b00323f169dffc0daf117b822) Thanks [@ishaba](https://github.com/ishaba)! - feat(celo): implement coin-module api

- [#19145](https://github.com/LedgerHQ/ledger-live/pull/19145) [`1e17c12`](https://github.com/LedgerHQ/ledger-live/commit/1e17c127178a871b665b25d6f4208d4613826dd1) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop the per-coin `cli.ts` / `cli-transaction.ts` / `test/cli.ts` (`makeCliTools`) contract from coin families and the `cliTools` field of `FamilySetup`. The only consumer was the `apps/cli` `send` command, and the only e2e path that used it was the EVM ERC20 token approval. That flow is now a dedicated, self-contained `tokenApproval` CLI command; the generic `send` command keeps the cross-family options only.

- [#18787](https://github.com/LedgerHQ/ledger-live/pull/18787) [`63dcc63`](https://github.com/LedgerHQ/ledger-live/commit/63dcc636c4a1c360beb7ece0a3ee32ba7550b693) Thanks [@VicAlbr](https://github.com/VicAlbr)! - e2e: pre-generate and reuse app.json userdata and receive addresses (account + dedicated UTXO caches) so desktop and mobile E2E skip live Speculos account scanning. Adds a daily cache-generation workflow, CLI generator commands, and a release-validation guard that keeps release runs (desktop build_type=js, mobile production_firebase) on the legacy live scan; coins missing from the cache fall back to the live scan (QAA-1285).

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

- [#18817](https://github.com/LedgerHQ/ledger-live/pull/18817) [`9f8ab96`](https://github.com/LedgerHQ/ledger-live/commit/9f8ab9672ababc02909e7553d433ee326c37762e) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Remove the `newReceiveDialog` feature flag and make the new Lumen receive options dialog the permanent default on desktop. This drops the legacy `StepOptions` receive step, the `useLegacyReceiveOptions` path, and the related `shouldDisplayNewReceiveDialog` config across the feature-flags packages and types.

- [#18934](https://github.com/LedgerHQ/ledger-live/pull/18934) [`edebe91`](https://github.com/LedgerHQ/ledger-live/commit/edebe91895773e4e2c9f29bc0a991885d2f44a77) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwdm): restore recent address store for lwdm

- [#18911](https://github.com/LedgerHQ/ledger-live/pull/18911) [`acaf6d9`](https://github.com/LedgerHQ/ledger-live/commit/acaf6d991aec6bfcc7b6a0906d873f7d8e57eded) Thanks [@qperrot](https://github.com/qperrot)! - Fix "send max" offering already-committed funds while a previous send is still pending. Optimistic pending operations are now subtracted from the spendable balance used by the generic coin framework (send max, amount and gas validation), preventing on-chain "Insufficient funds for gas \* price + value" errors when sending again before the next account sync. Affects EVM and other coins built on the generic coin framework. Sponsored (gasless) pending transactions no longer lock their fee against the native balance, since the fee is paid by a third party and not by the account.

- [#19141](https://github.com/LedgerHQ/ledger-live/pull/19141) [`2caa65c`](https://github.com/LedgerHQ/ledger-live/commit/2caa65c2ada66ef20c76950b5a2b01c49845f8eb) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Fix content card displayedPosition analytics by stripping Braze string values in sanitizeExtras and finalizing numeric indices at the tracking gateway (mobile trackContentCardEvent, desktop trackContentCard) instead of at each call site.

- [#18786](https://github.com/LedgerHQ/ledger-live/pull/18786) [`8d7f2b3`](https://github.com/LedgerHQ/ledger-live/commit/8d7f2b3d517780578799cc83152f6434381b2e26) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Fix top_wallet content card canvas_name and canvas_step_name tracking

- [#18632](https://github.com/LedgerHQ/ledger-live/pull/18632) [`8dd5685`](https://github.com/LedgerHQ/ledger-live/commit/8dd5685a0a42b8277846754f0251eaf38a12fa51) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(llc): syncGasOptionsEffect for evm descriptor

- [#18951](https://github.com/LedgerHQ/ledger-live/pull/18951) [`bfb5437`](https://github.com/LedgerHQ/ledger-live/commit/bfb543708a32256379067903c3f1c3ab46a323d3) Thanks [@deepyjr](https://github.com/deepyjr)! - Add Desktop transaction history dust filtering controls.

- [#19272](https://github.com/LedgerHQ/ledger-live/pull/19272) [`e2d74f7`](https://github.com/LedgerHQ/ledger-live/commit/e2d74f7c5fe9883d6a141ce790a0b0aa92d7e53a) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-evm): raise an error if gas price is less than the network minimum

- [#19036](https://github.com/LedgerHQ/ledger-live/pull/19036) [`addef52`](https://github.com/LedgerHQ/ledger-live/commit/addef52ed445008c16e3f94d66f46222c8c535f7) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - remove marketbanner param from wallet4.0 FF

- [#19063](https://github.com/LedgerHQ/ledger-live/pull/19063) [`eab9b13`](https://github.com/LedgerHQ/ledger-live/commit/eab9b130e0a809d6dead08bbd1a588112da94e0c) Thanks [@dilaouid](https://github.com/dilaouid)! - chore(llc): refactor useFeePresetFiatValues to use in both LWDM

- [#19245](https://github.com/LedgerHQ/ledger-live/pull/19245) [`b5699a5`](https://github.com/LedgerHQ/ledger-live/commit/b5699a54d7edd5b3579a7f35d77a03d2b0506d19) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(algo): remove memo algorand in new send flow lwdm

- [#19164](https://github.com/LedgerHQ/ledger-live/pull/19164) [`c1e9aa3`](https://github.com/LedgerHQ/ledger-live/commit/c1e9aa3a8851a85cf0ec9b0718177baf39cc9db8) Thanks [@dilaouid](https://github.com/dilaouid)! - fix(llc): fix celo pays with tokens unit wrong value

- [#19260](https://github.com/LedgerHQ/ledger-live/pull/19260) [`5c2bc46`](https://github.com/LedgerHQ/ledger-live/commit/5c2bc46ce7e0dac5a9bfbf4089ca14868126bc96) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Add pure `isCooldownElapsed` and `shouldThrottle` helpers for the large-screen upsell timing.

- [#18965](https://github.com/LedgerHQ/ledger-live/pull/18965) [`cc01b77`](https://github.com/LedgerHQ/ledger-live/commit/cc01b777c9b54ccf2a9f2b34f0281d3d7123b157) Thanks [@ishaba](https://github.com/ishaba)! - perf(sui): populate staking extras at sync, drop per-drawer transaction(digest:) re-fetch

- [#19197](https://github.com/LedgerHQ/ledger-live/pull/19197) [`c8b4ee7`](https://github.com/LedgerHQ/ledger-live/commit/c8b4ee77c03ca2117cbad039331b7b52e50d9620) Thanks [@lysyi3m](https://github.com/lysyi3m)! - generic-coin-framework: store the account public key in `Account.xpub` (previously the address) for the evm/xrp/stellar/tezos families. Derive `makeSync`'s account-id identity from the immutable account id instead of the mutable `xpub` field, so healing `xpub` to the public key never re-keys or clears accounts. Account ids remain address-based; existing accounts populate `xpub` on the next device-connected scan.

- [#18862](https://github.com/LedgerHQ/ledger-live/pull/18862) [`8ecbdde`](https://github.com/LedgerHQ/ledger-live/commit/8ecbdde35c80f7c363f1511fa8463155437b9612) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Extract shared swap transaction status logic for LIVE-29443 while preserving the existing transaction status import paths.

- [#19023](https://github.com/LedgerHQ/ledger-live/pull/19023) [`3f71b7a`](https://github.com/LedgerHQ/ledger-live/commit/3f71b7af8419e92e907be029b7fed052288561b7) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Monad staking: pin the Ledger validator ("Ledger by P2P.org") to the top of the validator list so it is selected by default when delegating

- [#18633](https://github.com/LedgerHQ/ledger-live/pull/18633) [`e9b1707`](https://github.com/LedgerHQ/ledger-live/commit/e9b17073cdf3266692adc4348c9a54f5597da4c8) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwdm): move the Celo "Pay fees in" selector from the Amount step to the Custom fees step using a generic, family-agnostic fee asset descriptor

- [#17564](https://github.com/LedgerHQ/ledger-live/pull/17564) [`babad68`](https://github.com/LedgerHQ/ledger-live/commit/babad685139d06343f6a647686c713992ad1ac1a) Thanks [@dilaouid](https://github.com/dilaouid)! - tests(e2e): add detox for evm native staking (sei_evm) and mock smoke under `apps/ledger-live-mobile/e2e` and Speculos delegate flow under `e2e/mobile`

- [#18814](https://github.com/LedgerHQ/ledger-live/pull/18814) [`fa0123a`](https://github.com/LedgerHQ/ledger-live/commit/fa0123a1da7b053d58afab498266cf830958e2ff) Thanks [@ysitbon](https://github.com/ysitbon)! - Migrate remaining lint scripts from ESLint to oxlint and drop Prettier (oxfmt is now the sole formatter)

- [#19187](https://github.com/LedgerHQ/ledger-live/pull/19187) [`0e30cdc`](https://github.com/LedgerHQ/ledger-live/commit/0e30cdc29d7fb3cab5bf1f2ef7c24cf0a152516e) Thanks [@sarneijim](https://github.com/sarneijim)! - Persist onboardingDate in the shared post-onboarding store to power the post-onboarding upsell cooldown. It is preserved when reopening or hiding the wallet entry point for the same device, refreshed when a different device is onboarded, and backfilled to today once for legacy users on first launch.

- [#19092](https://github.com/LedgerHQ/ledger-live/pull/19092) [`fa25271`](https://github.com/LedgerHQ/ledger-live/commit/fa252719220ca27fa4556ce9a02b84ccfca835c3) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - coin-evm: move deviceTransactionConfig, bot specs and speculos device actions to ledger-live-common families/evm

- [#18624](https://github.com/LedgerHQ/ledger-live/pull/18624) [`5a64d39`](https://github.com/LedgerHQ/ledger-live/commit/5a64d39ac89a125331c6d937642bf50d44255082) Thanks [@jeportie](https://github.com/jeportie)! - fix(e2e): give swap flows a larger "Review transaction" device-wait budget (~120s) to reduce flaky "Review transaction not found" timeouts on nanoSP under heavy parallel Speculos load (QAA-1322)

- [#18913](https://github.com/LedgerHQ/ledger-live/pull/18913) [`c6cf445`](https://github.com/LedgerHQ/ledger-live/commit/c6cf445c9bac5a56bcbf84ccda6b2b269d1ee61a) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Remove the legacy add-account modal, DataSelector drawers and modular drawer visibility gating now that the Modular Drawer is the only flow. All Live App, stake, send and account-selection entry points use the modular flows unconditionally, and the `useModularDrawerVisibility` hook is removed in favor of a dedicated `ModularDrawerVisibleParams` type.

- [#19009](https://github.com/LedgerHQ/ledger-live/pull/19009) [`1f25437`](https://github.com/LedgerHQ/ledger-live/commit/1f254373fedec85e50364fdbc6bb9ec4fd5256b2) Thanks [@claudiiafg](https://github.com/claudiiafg)! - Track Funds received analytics when a new receive operation is synced on desktop and mobile.

- [#19196](https://github.com/LedgerHQ/ledger-live/pull/19196) [`edacd7c`](https://github.com/LedgerHQ/ledger-live/commit/edacd7c60413812e13a20d6451d5870ff5ced34e) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Relocate EVM operation helpers (`isEditableOperation`, `isStuckOperation`, `getStuckAccountAndOperation`) from `@ledgerhq/coin-evm/operation` to `families/evm/editTransaction/` in `ledger-live-common`

- [#18885](https://github.com/LedgerHQ/ledger-live/pull/18885) [`0fa8c6c`](https://github.com/LedgerHQ/ledger-live/commit/0fa8c6c7daf524f075623287418bc8ad74e464f3) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: enable aleo auto record picking strategy

- [#19058](https://github.com/LedgerHQ/ledger-live/pull/19058) [`5fc438e`](https://github.com/LedgerHQ/ledger-live/commit/5fc438ec9357c406717f4e4e8c136533198a38b7) Thanks [@vtaranushenko-ext-ledger](https://github.com/vtaranushenko-ext-ledger)! - Extract useAleoViewKeyApproval hook and buildAccountsWithViewKeys utility to live-common for shared Desktop and Mobile use

- [#18829](https://github.com/LedgerHQ/ledger-live/pull/18829) [`b3ffa2f`](https://github.com/LedgerHQ/ledger-live/commit/b3ffa2f4bf735f2cfeed2a8028ea92d4bc3588e3) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Sunset the `CryptoCurrency.terminated` field: remove it from the type/schema, delete the 5 currencies it marked (clubcoin, hcash, poswallet, stakenet, stratis), drop the now-unused `withTerminated` parameter from `listCryptoCurrencies`, and clean up the dead code orphaned by those deletions.

- [#18013](https://github.com/LedgerHQ/ledger-live/pull/18013) [`57a48a5`](https://github.com/LedgerHQ/ledger-live/commit/57a48a5fb17e47c6ce686fe297344c2a580d84d7) Thanks [@CremaFR](https://github.com/CremaFR)! - Add `customSwap` to the wallet-api exchange SDK and expose the matching `CustomSwapParams` / `CustomSwapResult` types (also re-exported from `@ledgerhq/live-common/wallet-api/Exchange/swapFlow/types`). This is the live-app entry point for the new device-intent-based swap flow on mobile, which currently runs the EVM token-approval step (sign on device, broadcast, wait for the receipt). Submit-swap and broadcast-swap will follow on the wallet side, reusing this same wire shape.

- [#19166](https://github.com/LedgerHQ/ledger-live/pull/19166) [`4b2f537`](https://github.com/LedgerHQ/ledger-live/commit/4b2f537cf6ffd1ed20d2df63f6940dc13f68fbee) Thanks [@CremaFR](https://github.com/CremaFR)! - Show the real on-chain received amount for finished DEX swaps in swap history. `getCompleteSwapHistory` now derives `finalAmount` from the receiving account's incoming operation (including native receives via internal operations) instead of always falling back to the quoted `toAmount`, so both the history rows and the transaction status detail/drawer reflect what was actually received.

- [#18013](https://github.com/LedgerHQ/ledger-live/pull/18013) [`57a48a5`](https://github.com/LedgerHQ/ledger-live/commit/57a48a5fb17e47c6ce686fe297344c2a580d84d7) Thanks [@CremaFR](https://github.com/CremaFR)! - Move the cross-platform parts of the swap device-intent stack (`signApprovalEvm`, `signSwapEvm`, `broadcastEvm` jobs, definitions and types) from `apps/ledger-live-mobile` into `@ledgerhq/live-common/wallet-api/Exchange/intents` so the same logic can later be reused by the desktop wallet. The mobile side now only owns the LWM React components and `intentLWMDefinition.ts` thin wrappers that attach those components to the shared cross-platform definitions.

- [#18013](https://github.com/LedgerHQ/ledger-live/pull/18013) [`57a48a5`](https://github.com/LedgerHQ/ledger-live/commit/57a48a5fb17e47c6ce686fe297344c2a580d84d7) Thanks [@CremaFR](https://github.com/CremaFR)! - Add support for Permit2 + classic AMM swap quotes (Uniswap with
  `permitData`, non-RFQ) and RFQ swap quotes (UniswapX, 1inch Fusion) in
  the wallet-side `custom.swap` device-intent flow. A new cross-platform
  `signPermit2Evm` intent signs the EIP-712 typed-data payload via DMK's
  `signTypedData` device action, and the shared `swapFlow` machine grows
  four new plan kinds (`permit-then-swap`, `approval-then-permit-then-swap`,
  `rfq-order`, `approval-then-rfq-order`) plus the matching `signPermit2`,
  `signRfqOrder`, and `submitRfqOrder` states. The Permit2 path threads the
  resulting signature into the DEX builder's `buildContext.permitSignature`;
  the RFQ path signs an off-chain EIP-712 order then submits and polls it
  against the partner's swap-api endpoints. The planner refuses to silently
  downgrade to a direct swap when a DEX quote claims approval is required
  but ships no approval blob (`reason: "dex-approval-blob-missing"`),
  skip-guards RFQ quotes that are missing the EIP-712 payload we need to
  sign (`reason: "rfq-typed-data-missing"`), and surfaces the
  USDT-on-Ethereum revoke edge case as `reason: "usdt-revoke-needed"` so
  hosts can fall back to the legacy swap pipeline for that flow.

- [#18013](https://github.com/LedgerHQ/ledger-live/pull/18013) [`57a48a5`](https://github.com/LedgerHQ/ledger-live/commit/57a48a5fb17e47c6ce686fe297344c2a580d84d7) Thanks [@CremaFR](https://github.com/CremaFR)! - Extract a headless XState machine + flow planner for the wallet-side
  `custom.swap` device-intent flow into
  `@ledgerhq/live-common/wallet-api/Exchange/swapFlow`. The machine ports
  the swap-live-app `_stepMachine` step vocabulary (`approve_token` ->
  `swap`) onto the wallet-side phases (`signApproval`, `broadcastApproval`,
  `buildSwap`, `signSwap`, `broadcastSwap`) and runs them through injected
  `SwapFlowPorts` with no React, Lumen, or DMK imports. Already-approved
  DEX quotes now go through a wallet-driven direct-swap path instead of
  short-circuiting to `{}`. The mobile orchestration hook becomes a thin
  adapter that builds LWM ports, runs the shared machine via
  `@xstate/react#useMachine`, and derives `executorProps` /
  `successScreen` / `enabled` from machine state. A future CLI adapter can
  reuse the same machine by implementing the `SwapFlowPorts` contract.

- [#18955](https://github.com/LedgerHQ/ledger-live/pull/18955) [`376915c`](https://github.com/LedgerHQ/ledger-live/commit/376915ca520ecc1708090ed9b3eba1ff7e780540) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(mobile): add tracking on new send flow part 2

- [#19125](https://github.com/LedgerHQ/ledger-live/pull/19125) [`154ff71`](https://github.com/LedgerHQ/ledger-live/commit/154ff7146a642d7953a91394022eeda5d437c450) Thanks [@VicAlbr](https://github.com/VicAlbr)! - Point the Concordium Speculos e2e spec at the concordium_testnet currency it actually tests

- [#19112](https://github.com/LedgerHQ/ledger-live/pull/19112) [`8169225`](https://github.com/LedgerHQ/ledger-live/commit/81692256d96fd47acf288c0f646b15c92fe8d7be) Thanks [@dilaouid](https://github.com/dilaouid)! - chore(lwdm): refacto gas and memo in the new send flow

- [#17890](https://github.com/LedgerHQ/ledger-live/pull/17890) [`df088d2`](https://github.com/LedgerHQ/ledger-live/commit/df088d26908b24e936bc8d6f508a438d151222f0) Thanks [@cted-ledger](https://github.com/cted-ledger)! - feat(coin-tezos): support multi-asset FA2 contracts (wrapped tokens)

  Remove the tokenId=0 filter in TzKT queries so balances and operations
  for all FA2 tokens are returned, including multi-asset contracts like
  the Wrapped Tokens Contract (KT18fp5rc…).

  Parse the assetReference (contract:tokenId) in the Tezos bridge to pass
  tokenIdentifier to findTokenByAddressInCurrency, enabling correct CAL
  token resolution for multi-asset contracts.

- [#18426](https://github.com/LedgerHQ/ledger-live/pull/18426) [`2160260`](https://github.com/LedgerHQ/ledger-live/commit/2160260cc0d660331c05f1bfdb0a4f28d486e275) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Handle the Wallet API `account.getPublicKey` method. The wallet resolves the account public key per family, fail-closed: Tezos returns its base58 public key (from `seedIdentifier`) and every other family rejects with "not implemented". Enables dApp flows that need the public key up front (e.g. `tezos_getAccounts`).

- [#19178](https://github.com/LedgerHQ/ledger-live/pull/19178) [`3da6b44`](https://github.com/LedgerHQ/ledger-live/commit/3da6b4439d61a7ad7f06e04be12aa1e92b9cdb55) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove the balanceRefreshRework param of the wallet 4.0 feature flag everywhere; the reworked balance refresh is now always used on mobile

- [#19302](https://github.com/LedgerHQ/ledger-live/pull/19302) [`f9411d1`](https://github.com/LedgerHQ/ledger-live/commit/f9411d1e2a06b031555cda9e26ecba37b4cf045e) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove the `graphRework` param of the Wallet 4.0 feature flag on both platforms. The param is no longer consumed on desktop (LIVE-33502) nor mobile, so it is dropped entirely: from the `lwmWallet40` / `lwdWallet40` schemas, the shared `Feature_Wallet40_Params` type, the analytics helper, the `shouldDisplayGraphRework` getter in `useWalletFeaturesConfig`, and both platforms' debug dev-tool lists.

  On mobile the Wallet 4.0 balance hero is now always rendered: the legacy portfolio graph card is dropped from the portfolio header and read-only screens (the `GraphCard` / `GraphCardContainer` / `PortfolioGraphCard` components stay, still used by the Analytics screen), and the graphRework gating is removed from every mobile call site (Portfolio screen/VM, `Delta`, settings reducer, WalletAssets VM).

- [#19203](https://github.com/LedgerHQ/ledger-live/pull/19203) [`6eea36b`](https://github.com/LedgerHQ/ledger-live/commit/6eea36bfafeba265672a96b37981e2c7e629ef33) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove the mainNavigation param of the wallet 4.0 feature flag; the wallet 4.0 main navigation is now always used on mobile and the legacy tab-bar/top-bar code paths are removed

- [#19261](https://github.com/LedgerHQ/ledger-live/pull/19261) [`35d4af9`](https://github.com/LedgerHQ/ledger-live/commit/35d4af90e7bee849814cd98358c80e20ef4e4f2a) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Wallet 4.0 Q1 cleanup on mobile:

  - Remove the `quickActionCtas` param of the `lwmWallet40` feature flag. The quick-action CTAs are now always enabled; the `shouldDisplayQuickActionCtas` getter and the legacy `PortfolioQuickActionsBar` are removed.
  - Remove the legacy (pre-4.0) Portfolio screen. `PortfolioRootScreen` now always renders the MVVM `Portfolio` / `ReadOnlyPortfolio`, and the dead legacy screen files are deleted.

- [#18615](https://github.com/LedgerHQ/ledger-live/pull/18615) [`596a445`](https://github.com/LedgerHQ/ledger-live/commit/596a4452f04afbffdf0935e946e691f7775cb80c) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - [LWDM] feat(swap): forward lifi data to the device

- [#19068](https://github.com/LedgerHQ/ledger-live/pull/19068) [`0e302a5`](https://github.com/LedgerHQ/ledger-live/commit/0e302a5a2e71a63af7e79d9a195e5e2cca36642c) Thanks [@dilaouid](https://github.com/dilaouid)! - chore(llc): share useNetworkFee hooks through lwd and lwm in common

- [#19078](https://github.com/LedgerHQ/ledger-live/pull/19078) [`363ac4d`](https://github.com/LedgerHQ/ledger-live/commit/363ac4d27f4e71b1e6e00b1c128bc199d1170839) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - coin-evm: move transaction serialization helpers and CLI tools to ledger-live-common families/evm

- [#18874](https://github.com/LedgerHQ/ledger-live/pull/18874) [`e0b2f53`](https://github.com/LedgerHQ/ledger-live/commit/e0b2f53c10d88554f6e9082f728fb3cfff7e805c) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Block XRP send and show an error when the recipient requires a destination tag and none is provided (bumps @ledgerhq/coin-xrp to 7.23.5)

- [#19123](https://github.com/LedgerHQ/ledger-live/pull/19123) [`e9a51af`](https://github.com/LedgerHQ/ledger-live/commit/e9a51afa1d2a79d856e1487ab3bd77670ccc5e86) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - add swap cli die

### Patch Changes

- Updated dependencies [[`7a11615`](https://github.com/LedgerHQ/ledger-live/commit/7a11615e8a37a35a0410e4f89f18f064e7ac2ee5), [`41e0064`](https://github.com/LedgerHQ/ledger-live/commit/41e0064e837c2b99750b563d219748d40305b304), [`6df2017`](https://github.com/LedgerHQ/ledger-live/commit/6df20171a84b54e5b67eabefc938a98d7e3c3e43), [`a7734c2`](https://github.com/LedgerHQ/ledger-live/commit/a7734c23a635ddde880176ee04ff409a67eae613), [`20efcc6`](https://github.com/LedgerHQ/ledger-live/commit/20efcc67fd38bbba793e23abc1f62a14e29a1104), [`a2621e2`](https://github.com/LedgerHQ/ledger-live/commit/a2621e2c6c6369c7109af72e1cb59df2448951ff), [`e18fe2d`](https://github.com/LedgerHQ/ledger-live/commit/e18fe2d81d86650e816b8b5da9ea311048a3e30e), [`b98cce3`](https://github.com/LedgerHQ/ledger-live/commit/b98cce3ff564ab8499876b124a4a5f3a08e0066f), [`6d9da62`](https://github.com/LedgerHQ/ledger-live/commit/6d9da62546cd54bf562f09542141635aab6c95dd), [`3b9ad8e`](https://github.com/LedgerHQ/ledger-live/commit/3b9ad8e33408679af1a3737c6cb3a2473a044c07), [`cd26957`](https://github.com/LedgerHQ/ledger-live/commit/cd26957e4147e438dab908f0cc700115dd95b422), [`19aa0b4`](https://github.com/LedgerHQ/ledger-live/commit/19aa0b499c3c4a9f6348f4af367636492a8023d1), [`0c9b5fc`](https://github.com/LedgerHQ/ledger-live/commit/0c9b5fc79922a62a2ca124d1c251f177ac3a3969), [`70a706e`](https://github.com/LedgerHQ/ledger-live/commit/70a706e4efe3a6fa176f9827a4a06949ba185f11), [`94fcc69`](https://github.com/LedgerHQ/ledger-live/commit/94fcc69009b7e07aab43afdc7214b486b2c7811a), [`8b6614e`](https://github.com/LedgerHQ/ledger-live/commit/8b6614eaff423aaeb50b7eb44ba5916a941a573d), [`f9caf32`](https://github.com/LedgerHQ/ledger-live/commit/f9caf322be2e3b652e8ec06fb40aeb8e02e08c8a), [`3cb6159`](https://github.com/LedgerHQ/ledger-live/commit/3cb615918166922059304724f560c566d2671ac3), [`c5763f6`](https://github.com/LedgerHQ/ledger-live/commit/c5763f6171f49d2b9e679b982804e68843800450), [`1d40088`](https://github.com/LedgerHQ/ledger-live/commit/1d40088e095cc064d9f3020e2fa6dd787aaca671), [`3b35b5e`](https://github.com/LedgerHQ/ledger-live/commit/3b35b5ea8a0c67c215150f2aee008fd1c1993463), [`38728f9`](https://github.com/LedgerHQ/ledger-live/commit/38728f9d9ac879c276def56ce88c5e49549e4b9d), [`d91f849`](https://github.com/LedgerHQ/ledger-live/commit/d91f849185c7a30514349be655bba69dd77bb8c8), [`1838412`](https://github.com/LedgerHQ/ledger-live/commit/18384123adca558b00323f169dffc0daf117b822), [`86ca231`](https://github.com/LedgerHQ/ledger-live/commit/86ca231ea9e0ec5996258b1abfa9742a7df3f9ec), [`714411f`](https://github.com/LedgerHQ/ledger-live/commit/714411fcbf054244444ec97f2e53039417cba54e), [`1e17c12`](https://github.com/LedgerHQ/ledger-live/commit/1e17c127178a871b665b25d6f4208d4613826dd1), [`ca07aac`](https://github.com/LedgerHQ/ledger-live/commit/ca07aac857c58e3d85beab71b246d8af687431f3), [`5ccd2a9`](https://github.com/LedgerHQ/ledger-live/commit/5ccd2a9c229e8007851c6eb8b01c866c8e605932), [`6400154`](https://github.com/LedgerHQ/ledger-live/commit/6400154daa131b225c6ec62c9134f1cd06370729), [`43fc364`](https://github.com/LedgerHQ/ledger-live/commit/43fc36426f23a838e2b3c74692dbad29e54b4088), [`3973f11`](https://github.com/LedgerHQ/ledger-live/commit/3973f1109d66996b728ecb63489eced25b967838), [`9f8ab96`](https://github.com/LedgerHQ/ledger-live/commit/9f8ab9672ababc02909e7553d433ee326c37762e), [`e6566ff`](https://github.com/LedgerHQ/ledger-live/commit/e6566ff55d95ff36832d5f77899d67d80842f418), [`c304640`](https://github.com/LedgerHQ/ledger-live/commit/c30464053e6f54f194db6adbe1ff41f06658108e), [`7914bd1`](https://github.com/LedgerHQ/ledger-live/commit/7914bd123d4f3b990db035f28dca4904420562ec), [`996c76b`](https://github.com/LedgerHQ/ledger-live/commit/996c76b157553c547f83d877d25199b311ee0f63), [`4f541c2`](https://github.com/LedgerHQ/ledger-live/commit/4f541c2f45d508dd12b4d4ff92dec294e6005865), [`e2d74f7`](https://github.com/LedgerHQ/ledger-live/commit/e2d74f7c5fe9883d6a141ce790a0b0aa92d7e53a), [`973118a`](https://github.com/LedgerHQ/ledger-live/commit/973118a511dbdf862387c94272a89739a011e797), [`addef52`](https://github.com/LedgerHQ/ledger-live/commit/addef52ed445008c16e3f94d66f46222c8c535f7), [`559f694`](https://github.com/LedgerHQ/ledger-live/commit/559f694fa73a2f68ac3fc867291a0fce99969552), [`ab6aa6e`](https://github.com/LedgerHQ/ledger-live/commit/ab6aa6e50184b17247719741a2db23adf4475665), [`81373c1`](https://github.com/LedgerHQ/ledger-live/commit/81373c1ca46cf2094cfd4f98958eff2114f02cea), [`7fe5f11`](https://github.com/LedgerHQ/ledger-live/commit/7fe5f1129d6ac218ad274f2187a1a3dd83b8855a), [`10dd123`](https://github.com/LedgerHQ/ledger-live/commit/10dd123758a49b38266984540a05cd52d07e00a3), [`34bccb5`](https://github.com/LedgerHQ/ledger-live/commit/34bccb5268c8b27f87f2ab0395e372d4f1d5d926), [`cc01b77`](https://github.com/LedgerHQ/ledger-live/commit/cc01b777c9b54ccf2a9f2b34f0281d3d7123b157), [`966d6a1`](https://github.com/LedgerHQ/ledger-live/commit/966d6a198412c12548575516a2ac72456c380181), [`7c39ea3`](https://github.com/LedgerHQ/ledger-live/commit/7c39ea39ca8999bcb8ce2294f4884430b6d1b2dc), [`d686e93`](https://github.com/LedgerHQ/ledger-live/commit/d686e93f8a548ff4e9ab3c877ad1f815510b35d9), [`e97314e`](https://github.com/LedgerHQ/ledger-live/commit/e97314e0d8201195a91e5eeb0fcde9e2b1dfff76), [`f495213`](https://github.com/LedgerHQ/ledger-live/commit/f495213e811477c99d62f0d93cc7c513b951a303), [`0225804`](https://github.com/LedgerHQ/ledger-live/commit/0225804cd0f39b90050f52b14e1b159340f0530e), [`c8b4ee7`](https://github.com/LedgerHQ/ledger-live/commit/c8b4ee77c03ca2117cbad039331b7b52e50d9620), [`e820e40`](https://github.com/LedgerHQ/ledger-live/commit/e820e402fb57d52b31dcd6de26f8d31d9564e2a4), [`007f27e`](https://github.com/LedgerHQ/ledger-live/commit/007f27e81cce353a3ee6648543d54d06ae6e7a11), [`ba433a1`](https://github.com/LedgerHQ/ledger-live/commit/ba433a1a08fa65ce3d376bb0d60fe1d4241b422d), [`fa0123a`](https://github.com/LedgerHQ/ledger-live/commit/fa0123a1da7b053d58afab498266cf830958e2ff), [`b10ca6a`](https://github.com/LedgerHQ/ledger-live/commit/b10ca6ab5e80889b24805b460f81eff5748f0170), [`73b6013`](https://github.com/LedgerHQ/ledger-live/commit/73b60134a199c19606a7d1be3d0fc41f15cf99c2), [`fa25271`](https://github.com/LedgerHQ/ledger-live/commit/fa252719220ca27fa4556ce9a02b84ccfca835c3), [`df96477`](https://github.com/LedgerHQ/ledger-live/commit/df964774bdaccd897e5e7414c172e9c26ff21f67), [`c4ee26d`](https://github.com/LedgerHQ/ledger-live/commit/c4ee26d18dacfcee597357de4b9dbab9fda01dbb), [`237b721`](https://github.com/LedgerHQ/ledger-live/commit/237b7217d7447be97c88030eb86542bcfcff1e38), [`edacd7c`](https://github.com/LedgerHQ/ledger-live/commit/edacd7c60413812e13a20d6451d5870ff5ced34e), [`df6ca42`](https://github.com/LedgerHQ/ledger-live/commit/df6ca422fa70171162974ea71519da5c5eeb55d8), [`e3c0327`](https://github.com/LedgerHQ/ledger-live/commit/e3c032795a0432500a447b756503ce0aefd8c0f6), [`628f21f`](https://github.com/LedgerHQ/ledger-live/commit/628f21f5acf7d5866c0c956d41d69c760caf0caa), [`b9ffdc9`](https://github.com/LedgerHQ/ledger-live/commit/b9ffdc91708686ca1d6c126894b9481b0ffb0305), [`b2e12ce`](https://github.com/LedgerHQ/ledger-live/commit/b2e12ce7b72de43efe8c8ff5290d617fff7f8e31), [`0ebf1f8`](https://github.com/LedgerHQ/ledger-live/commit/0ebf1f8896c1397edd213ae820917394604be0b0), [`b3ffa2f`](https://github.com/LedgerHQ/ledger-live/commit/b3ffa2f4bf735f2cfeed2a8028ea92d4bc3588e3), [`57a48a5`](https://github.com/LedgerHQ/ledger-live/commit/57a48a5fb17e47c6ce686fe297344c2a580d84d7), [`376915c`](https://github.com/LedgerHQ/ledger-live/commit/376915ca520ecc1708090ed9b3eba1ff7e780540), [`b9f3ba5`](https://github.com/LedgerHQ/ledger-live/commit/b9f3ba5707e25d4ef50a7f7ffd4471678aa836ef), [`5aada6f`](https://github.com/LedgerHQ/ledger-live/commit/5aada6f1a72df070770f4b67112f51b5ced58cff), [`dff6ecf`](https://github.com/LedgerHQ/ledger-live/commit/dff6ecff5201a942a9dc61a51c729c47b53052dc), [`69b201e`](https://github.com/LedgerHQ/ledger-live/commit/69b201e2b1e01b2c6bfb6eaf9e0aa60088f175fc), [`df088d2`](https://github.com/LedgerHQ/ledger-live/commit/df088d26908b24e936bc8d6f508a438d151222f0), [`3da6b44`](https://github.com/LedgerHQ/ledger-live/commit/3da6b4439d61a7ad7f06e04be12aa1e92b9cdb55), [`607b032`](https://github.com/LedgerHQ/ledger-live/commit/607b03228d5e648a0611c316c6ab71a60365f349), [`9c42adf`](https://github.com/LedgerHQ/ledger-live/commit/9c42adf9e20ac7c9b4418652a40b5552afe6106d), [`f9411d1`](https://github.com/LedgerHQ/ledger-live/commit/f9411d1e2a06b031555cda9e26ecba37b4cf045e), [`6eea36b`](https://github.com/LedgerHQ/ledger-live/commit/6eea36bfafeba265672a96b37981e2c7e629ef33), [`35d4af9`](https://github.com/LedgerHQ/ledger-live/commit/35d4af90e7bee849814cd98358c80e20ef4e4f2a), [`596a445`](https://github.com/LedgerHQ/ledger-live/commit/596a4452f04afbffdf0935e946e691f7775cb80c), [`363ac4d`](https://github.com/LedgerHQ/ledger-live/commit/363ac4d27f4e71b1e6e00b1c128bc199d1170839), [`aea723c`](https://github.com/LedgerHQ/ledger-live/commit/aea723cac83a43596f1940ed4fc6ecbad49074e0), [`1c1e25d`](https://github.com/LedgerHQ/ledger-live/commit/1c1e25d866e8ad9bf8d29c4bd102ebd5fd02c2b3)]:
  - @ledgerhq/coin-tezos@7.8.0-next.0
  - @ledgerhq/coin-aptos@3.22.0-next.0
  - @ledgerhq/cryptoassets@13.54.0-next.0
  - @ledgerhq/coin-evm@4.5.0-next.0
  - @ledgerhq/wallet-api-exchange-module@0.33.0-next.0
  - @shared/feature-flags@0.13.0-next.0
  - @ledgerhq/coin-bitcoin@0.46.0-next.0
  - @ledgerhq/coin-cardano@0.29.0-next.0
  - @ledgerhq/coin-celo@2.8.0-next.0
  - @ledgerhq/live-env@2.41.0-next.0
  - @ledgerhq/coin-cosmos@0.38.0-next.0
  - @ledgerhq/coin-aleo@1.17.0-next.0
  - @ledgerhq/live-signer-evm@0.21.0-next.0
  - @ledgerhq/live-dmk-shared@0.28.0-next.0
  - @features/platform-feature-flags@0.6.0-next.0
  - @ledgerhq/coin-multiversx@0.19.0-next.0
  - @ledgerhq/coin-algorand@1.8.0-next.0
  - @ledgerhq/coin-solana@0.57.0-next.0
  - @ledgerhq/coin-near@0.27.0-next.0
  - @ledgerhq/coin-icon@0.25.0-next.0
  - @ledgerhq/coin-ton@0.31.0-next.0
  - @ledgerhq/coin-tron@6.5.0-next.0
  - @ledgerhq/coin-concordium@0.15.0-next.0
  - @ledgerhq/coin-filecoin@1.27.0-next.0
  - @ledgerhq/coin-kaspa@1.18.0-next.0
  - @ledgerhq/coin-mina@1.17.0-next.0
  - @ledgerhq/coin-polkadot@6.29.0-next.0
  - @ledgerhq/coin-hedera@1.37.0-next.0
  - @ledgerhq/coin-stacks@0.23.0-next.0
  - @ledgerhq/coin-sui@0.39.0-next.0
  - @ledgerhq/coin-internet_computer@1.24.0-next.0
  - @ledgerhq/coin-canton@0.28.0-next.0
  - @ledgerhq/coin-casper@2.15.0-next.0
  - @ledgerhq/coin-vechain@2.24.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.3.0-next.0
  - @ledgerhq/live-currency-format@0.12.0-next.0
  - @ledgerhq/live-countervalues@0.22.0-next.0
  - @ledgerhq/evm-tools@1.13.0-next.0
  - @ledgerhq/live-promise@0.3.0-next.0
  - @ledgerhq/live-signer-concordium@0.6.0-next.0
  - @ledgerhq/live-signer-cosmos@0.4.0-next.0
  - @ledgerhq/devices@8.17.0-next.0
  - @ledgerhq/live-wallet@0.28.0-next.0
  - @ledgerhq/asset-aggregation@0.9.1-next.0
  - @ledgerhq/device-core@0.11.6-next.0
  - @ledgerhq/domain-service@1.8.9-next.0
  - @ledgerhq/hw-app-eth@7.8.9-next.0
  - @ledgerhq/live-countervalues-react@0.16.1-next.0
  - @ledgerhq/live-signer-aleo@0.19.1-next.0
  - @ledgerhq/live-signer-canton@0.9.10-next.0
  - @ledgerhq/live-signer-celo@1.1.6-next.0
  - @ledgerhq/live-signer-solana@0.16.1-next.0
  - @ledgerhq/client-ids@0.11.1-next.0
  - @ledgerhq/ledger-cal-service@1.18.3-next.0
  - @ledgerhq/ledger-trust-service@0.8.8-next.0
  - @ledgerhq/live-network@2.6.7-next.0
  - @ledgerhq/speculos-transport@0.10.7-next.0
  - @ledgerhq/hw-app-sui@1.11.4-next.0
  - @ledgerhq/hw-transport@6.35.6-next.0
  - @ledgerhq/live-signer-hyperliquid@1.3.1-next.0
  - @ledgerhq/device-intent@4.0.1-next.0
  - @ledgerhq/hw-app-exchange@0.23.1-next.0
  - @ledgerhq/hw-app-algorand@6.35.6-next.0
  - @ledgerhq/hw-app-aptos@6.38.6-next.0
  - @ledgerhq/hw-app-btc@11.2.2-next.0
  - @ledgerhq/hw-app-hedera@1.6.6-next.0
  - @ledgerhq/hw-app-icon@1.7.6-next.0
  - @ledgerhq/hw-app-kaspa@1.7.6-next.0
  - @ledgerhq/hw-app-multiversx@6.30.6-next.0
  - @ledgerhq/hw-app-near@6.35.6-next.0
  - @ledgerhq/hw-app-polkadot@6.38.6-next.0
  - @ledgerhq/hw-app-str@7.7.6-next.0
  - @ledgerhq/hw-app-tezos@6.36.6-next.0
  - @ledgerhq/hw-app-trx@6.36.5-next.0
  - @ledgerhq/hw-app-vet@0.13.2-next.0
  - @ledgerhq/hw-app-xrp@6.37.6-next.0
  - @ledgerhq/hw-bolos@6.36.6-next.0
  - @ledgerhq/hw-transport-mocker@6.34.6-next.0

## 36.3.1

### Patch Changes

- [#19580](https://github.com/LedgerHQ/ledger-live/pull/19580) [`91b83cf`](https://github.com/LedgerHQ/ledger-live/commit/91b83cf8af507a92d2ff535af4e62264a7c142a1) Thanks [@LucasWerey](https://github.com/LucasWerey)! - fix selectCurrencyForMetaId returning Arbitrum One chain instead of ARB ERC-20 token

- Updated dependencies [[`7c0729b`](https://github.com/LedgerHQ/ledger-live/commit/7c0729b140c2d1e7bfb929eac701a4c6bba2f9a9), [`641779c`](https://github.com/LedgerHQ/ledger-live/commit/641779c220abf623cfbe95e2980e131ec1f3300c)]:
  - @ledgerhq/coin-solana@0.56.1
  - @ledgerhq/asset-aggregation@0.9.1
  - @ledgerhq/live-signer-solana@0.16.1

## 36.3.1-hotfix.1

### Patch Changes

- [#19580](https://github.com/LedgerHQ/ledger-live/pull/19580) [`91b83cf`](https://github.com/LedgerHQ/ledger-live/commit/91b83cf8af507a92d2ff535af4e62264a7c142a1) Thanks [@LucasWerey](https://github.com/LucasWerey)! - fix selectCurrencyForMetaId returning Arbitrum One chain instead of ARB ERC-20 token

- Updated dependencies [[`641779c`](https://github.com/LedgerHQ/ledger-live/commit/641779c220abf623cfbe95e2980e131ec1f3300c)]:
  - @ledgerhq/asset-aggregation@0.9.1-hotfix.0

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->

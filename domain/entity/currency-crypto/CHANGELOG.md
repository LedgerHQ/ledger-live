# @domain/entity-currency-crypto

## 0.17.0-next.0

### Minor Changes

- [#23681](https://github.com/LedgerHQ/ledger-live/pull/23681) [`e3e0f3a`](https://github.com/LedgerHQ/ledger-live/commit/e3e0f3a5fefbdcf08c8c16d7dc2a3d9f6a6922e0) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Move the explorer URL helpers (`getDefaultExplorerView`, `getTransactionExplorer`, `getAddressExplorer`, `getTokenExplorer`, `getStakePoolExplorer`) from `@ledgerhq/live-common/explorers` to `@domain/entity-currency-crypto`. `getAccountContractExplorer` becomes `getTokenExplorer(view, contractAddress, ownerAddress)` and takes plain strings. All usages are migrated and `@ledgerhq/live-common/explorers` is removed.

- [#23713](https://github.com/LedgerHQ/ledger-live/pull/23713) [`08730f5`](https://github.com/LedgerHQ/ledger-live/commit/08730f575a9ec7d9887f9b64ebf492a6d44ac6e8) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Account settings (LWM bottom sheet, LWD dialog) show a **View in explorer** entry under Advanced logs that opens the account's address in the currency's block explorer, hidden when the currency has none. The package builds the URL from the account's currency and address with `@domain/entity-currency-crypto` and opens it through `@shared/linking` as a sensitive link: `openLink(url, { sensitive: true })` still opens the full URL but only reports its origin to `onLinkOpened`, so the address never reaches analytics; `getDefaultExplorerView` accepts any object carrying `explorerViews`.

## 0.16.0

### Minor Changes

- [#23332](https://github.com/LedgerHQ/ledger-live/pull/23332) [`d6ab47c`](https://github.com/LedgerHQ/ledger-live/commit/d6ab47c28339866ad88ef0deba75d314c2f6c4f0) Thanks [@henri-ly](https://github.com/henri-ly)! - feat(xrp): add the ripple_devnet currency (XRPL devnet)

- [#23278](https://github.com/LedgerHQ/ledger-live/pull/23278) [`393a02a`](https://github.com/LedgerHQ/ledger-live/commit/393a02a42be9f0410b75c0c34203915bcde27e43) Thanks [@henri-ly](https://github.com/henri-ly)! - feat(xrp): add the ripple_testnet currency (XRPL altnet); send memo labels of testnets resolve to their mainnet

- [#23327](https://github.com/LedgerHQ/ledger-live/pull/23327) [`7da1ea9`](https://github.com/LedgerHQ/ledger-live/commit/7da1ea9534a1bdde063e31545363a27f0fdf5abb) Thanks [@lysyi3m](https://github.com/lysyi3m)! - fix(currencies): correct the cardano_testnet address explorer URL

- [#23386](https://github.com/LedgerHQ/ledger-live/pull/23386) [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574) Thanks [@dilaouid](https://github.com/dilaouid)! - Remove the Zenrock and Quicksilver integrations, including their chain adapters, currency definitions, feature flags and LCD endpoints

- [#23331](https://github.com/LedgerHQ/ledger-live/pull/23331) [`75498cf`](https://github.com/LedgerHQ/ledger-live/commit/75498cf55065bccf17d09b780866ae031c01701a) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - remove velas_evm and its feature flag

- [#22508](https://github.com/LedgerHQ/ledger-live/pull/22508) [`ad58765`](https://github.com/LedgerHQ/ledger-live/commit/ad58765b6151457022f8587d6ddcad3325ce96ac) Thanks [@pawell24](https://github.com/pawell24)! - fix(filecoin): open transactions on Blockscout from operation details

  Blockscout identifies a Filecoin message by its Ethereum-style hash, so the explorer link is now
  built from the message CID's digest instead of the CID itself.

- [#23405](https://github.com/LedgerHQ/ledger-live/pull/23405) [`37a49df`](https://github.com/LedgerHQ/ledger-live/commit/37a49df18649912157d8f269c3b4153d54b7817e) Thanks [@semeano](https://github.com/semeano)! - add the alpen_testnet evm currency

## 0.16.0-next.0

### Minor Changes

- [#23332](https://github.com/LedgerHQ/ledger-live/pull/23332) [`d6ab47c`](https://github.com/LedgerHQ/ledger-live/commit/d6ab47c28339866ad88ef0deba75d314c2f6c4f0) Thanks [@henri-ly](https://github.com/henri-ly)! - feat(xrp): add the ripple_devnet currency (XRPL devnet)

- [#23278](https://github.com/LedgerHQ/ledger-live/pull/23278) [`393a02a`](https://github.com/LedgerHQ/ledger-live/commit/393a02a42be9f0410b75c0c34203915bcde27e43) Thanks [@henri-ly](https://github.com/henri-ly)! - feat(xrp): add the ripple_testnet currency (XRPL altnet); send memo labels of testnets resolve to their mainnet

- [#23327](https://github.com/LedgerHQ/ledger-live/pull/23327) [`7da1ea9`](https://github.com/LedgerHQ/ledger-live/commit/7da1ea9534a1bdde063e31545363a27f0fdf5abb) Thanks [@lysyi3m](https://github.com/lysyi3m)! - fix(currencies): correct the cardano_testnet address explorer URL

- [#23386](https://github.com/LedgerHQ/ledger-live/pull/23386) [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574) Thanks [@dilaouid](https://github.com/dilaouid)! - Remove the Zenrock and Quicksilver integrations, including their chain adapters, currency definitions, feature flags and LCD endpoints

- [#23331](https://github.com/LedgerHQ/ledger-live/pull/23331) [`75498cf`](https://github.com/LedgerHQ/ledger-live/commit/75498cf55065bccf17d09b780866ae031c01701a) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - remove velas_evm and its feature flag

- [#22508](https://github.com/LedgerHQ/ledger-live/pull/22508) [`ad58765`](https://github.com/LedgerHQ/ledger-live/commit/ad58765b6151457022f8587d6ddcad3325ce96ac) Thanks [@pawell24](https://github.com/pawell24)! - fix(filecoin): open transactions on Blockscout from operation details

  Blockscout identifies a Filecoin message by its Ethereum-style hash, so the explorer link is now
  built from the message CID's digest instead of the CID itself.

- [#23405](https://github.com/LedgerHQ/ledger-live/pull/23405) [`37a49df`](https://github.com/LedgerHQ/ledger-live/commit/37a49df18649912157d8f269c3b4153d54b7817e) Thanks [@semeano](https://github.com/semeano)! - add the alpen_testnet evm currency

## 0.15.0

### Minor Changes

- [#23189](https://github.com/LedgerHQ/ledger-live/pull/23189) [`87de6a7`](https://github.com/LedgerHQ/ledger-live/commit/87de6a72f75df73aab99da6c420de00004bf7692) Thanks [@cted-ledger](https://github.com/cted-ledger)! - add the zcash_testnet currency

- [#22938](https://github.com/LedgerHQ/ledger-live/pull/22938) [`7a2505b`](https://github.com/LedgerHQ/ledger-live/commit/7a2505bd21cc2401e1e887cb5b9713281cb11519) Thanks [@qperrot](https://github.com/qperrot)! - Rename BNB Chain to BNB Smart Chain

- [#23194](https://github.com/LedgerHQ/ledger-live/pull/23194) [`90e805d`](https://github.com/LedgerHQ/ledger-live/commit/90e805d9c1b0ef536d1e53489c73b88056731993) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Remove 20 dead EVM chains (akroma, atheios, callisto, dexon, ellaism, ether1, ethergem, ethersocial, expanse, gochain, hpb, mix, musicoin, pirl, poa, reosc, thundercore, tomo, ubiq, wanchain)

- [#22750](https://github.com/LedgerHQ/ledger-live/pull/22750) [`6f2ecf8`](https://github.com/LedgerHQ/ledger-live/commit/6f2ecf89dd1d978038f573738d6e85fe1805b5d9) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(currency): drop `CryptoCurrency#ethereumLikeInfo`

  The EVM `chainId` is now read from the coin config. The unused `ethereumLikeInfo` field (and `EthereumLikeInfoSchema`) is removed from the currency types and registry.

### Patch Changes

- Updated dependencies []:
  - @domain/entity-currency-unit@0.3.0

## 0.15.0-next.0

### Minor Changes

- [#23189](https://github.com/LedgerHQ/ledger-live/pull/23189) [`87de6a7`](https://github.com/LedgerHQ/ledger-live/commit/87de6a72f75df73aab99da6c420de00004bf7692) Thanks [@cted-ledger](https://github.com/cted-ledger)! - add the zcash_testnet currency

- [#22938](https://github.com/LedgerHQ/ledger-live/pull/22938) [`7a2505b`](https://github.com/LedgerHQ/ledger-live/commit/7a2505bd21cc2401e1e887cb5b9713281cb11519) Thanks [@qperrot](https://github.com/qperrot)! - Rename BNB Chain to BNB Smart Chain

- [#23194](https://github.com/LedgerHQ/ledger-live/pull/23194) [`90e805d`](https://github.com/LedgerHQ/ledger-live/commit/90e805d9c1b0ef536d1e53489c73b88056731993) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Remove 20 dead EVM chains (akroma, atheios, callisto, dexon, ellaism, ether1, ethergem, ethersocial, expanse, gochain, hpb, mix, musicoin, pirl, poa, reosc, thundercore, tomo, ubiq, wanchain)

- [#22750](https://github.com/LedgerHQ/ledger-live/pull/22750) [`6f2ecf8`](https://github.com/LedgerHQ/ledger-live/commit/6f2ecf89dd1d978038f573738d6e85fe1805b5d9) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(currency): drop `CryptoCurrency#ethereumLikeInfo`

  The EVM `chainId` is now read from the coin config. The unused `ethereumLikeInfo` field (and `EthereumLikeInfoSchema`) is removed from the currency types and registry.

### Patch Changes

- Updated dependencies []:
  - @domain/entity-currency-unit@0.3.0

## 0.14.0

### Minor Changes

- [#22561](https://github.com/LedgerHQ/ledger-live/pull/22561) [`f1d8aac`](https://github.com/LedgerHQ/ledger-live/commit/f1d8aac1c7c0bc0be9beb1508c1a9ef3cf7affae) Thanks [@YazhuEth](https://github.com/YazhuEth)! - chore(currency): drop `CryptoCurrency#bitcoinLikeInfo`

  coin-bitcoin now reads the xpub version from its own `getNetworkParameters`, and coin-zcash from a local `ZCASH_XPUB_VERSION` constant. The unused `bitcoinLikeInfo` field (and `BitcoinLikeInfoSchema`) is removed from the currency types and registry.

- [#22589](https://github.com/LedgerHQ/ledger-live/pull/22589) [`a896fca`](https://github.com/LedgerHQ/ledger-live/commit/a896fca1974a46f10e915d1212e0947e2d808ad5) Thanks [@qperrot](https://github.com/qperrot)! - Remove the deprecated `CryptoCurrency.explorerId` field and the `LedgerExplorerId` type.

  Bitcoin-like explorer ids now come from the coin config (`config_currency_<id>.explorerId`), as EVM already does, and fall back to the currency id. The config is passed in rather than read from a module global: `toWalletBtcCurrency`, `walletBtcCurrencyById` and coin-bitcoin's `blockchainBaseURL` take it as an argument, the sync functions take the `coinConfig` resolver given to `createBridges`, and `assignFromAccountRaw` is now built with `makeAssignFromAccountRaw(coinConfig)`.

  Adds `config_currency_bitcoin_testnet`, `config_currency_bitcoin_regtest` and `config_currency_zcash_regtest` so every bitcoin-like currency resolves a config entry.

## 0.14.0-next.0

### Minor Changes

- [#22561](https://github.com/LedgerHQ/ledger-live/pull/22561) [`f1d8aac`](https://github.com/LedgerHQ/ledger-live/commit/f1d8aac1c7c0bc0be9beb1508c1a9ef3cf7affae) Thanks [@YazhuEth](https://github.com/YazhuEth)! - chore(currency): drop `CryptoCurrency#bitcoinLikeInfo`

  coin-bitcoin now reads the xpub version from its own `getNetworkParameters`, and coin-zcash from a local `ZCASH_XPUB_VERSION` constant. The unused `bitcoinLikeInfo` field (and `BitcoinLikeInfoSchema`) is removed from the currency types and registry.

- [#22589](https://github.com/LedgerHQ/ledger-live/pull/22589) [`a896fca`](https://github.com/LedgerHQ/ledger-live/commit/a896fca1974a46f10e915d1212e0947e2d808ad5) Thanks [@qperrot](https://github.com/qperrot)! - Remove the deprecated `CryptoCurrency.explorerId` field and the `LedgerExplorerId` type.

  Bitcoin-like explorer ids now come from the coin config (`config_currency_<id>.explorerId`), as EVM already does, and fall back to the currency id. The config is passed in rather than read from a module global: `toWalletBtcCurrency`, `walletBtcCurrencyById` and coin-bitcoin's `blockchainBaseURL` take it as an argument, the sync functions take the `coinConfig` resolver given to `createBridges`, and `assignFromAccountRaw` is now built with `makeAssignFromAccountRaw(coinConfig)`.

  Adds `config_currency_bitcoin_testnet`, `config_currency_bitcoin_regtest` and `config_currency_zcash_regtest` so every bitcoin-like currency resolves a config entry.

## 0.13.0

### Minor Changes

- [#22162](https://github.com/LedgerHQ/ledger-live/pull/22162) [`98e3038`](https://github.com/LedgerHQ/ledger-live/commit/98e303872684da47feca343c0db7d83fcce857b2) Thanks [@lysyi3m](https://github.com/lysyi3m)! - feat(concordium): declare the PLT token standard on both networks

  Concordium sub-accounts are now labelled as tokens, and the Receive step warns
  that the address takes CCD and PLT only.

## 0.13.0-next.0

### Minor Changes

- [#22162](https://github.com/LedgerHQ/ledger-live/pull/22162) [`98e3038`](https://github.com/LedgerHQ/ledger-live/commit/98e303872684da47feca343c0db7d83fcce857b2) Thanks [@lysyi3m](https://github.com/lysyi3m)! - feat(concordium): declare the PLT token standard on both networks

  Concordium sub-accounts are now labelled as tokens, and the Receive step warns
  that the address takes CCD and PLT only.

## 0.12.0

### Minor Changes

- [#21488](https://github.com/LedgerHQ/ledger-live/pull/21488) [`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop `delisted` from `CryptoCurrency`. No registry entry ever set it, so the `listCryptoCurrencies()` production filter was testing a dead branch. It stays on `TokenCurrency`, where CAL drives it.

- [#21486](https://github.com/LedgerHQ/ledger-live/pull/21486) [`2d42e64`](https://github.com/LedgerHQ/ledger-live/commit/2d42e647d55f79cf2eb821ec30a232cc07891219) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop `deviceTicker` from `CryptoCurrency`. The field was declared in three places and set by 17 testnet/L2 registry entries, but nothing ever read it.

- [#21487](https://github.com/LedgerHQ/ledger-live/pull/21487) [`b7d0367`](https://github.com/LedgerHQ/ledger-live/commit/b7d03671db1aa022d3ff375465c7d8470bf2b215) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop `disableCountervalue` from `CryptoCurrency`. Nothing read it on a crypto currency; it stays on `TokenCurrency`, where the assets API drives it, and on `FiatCurrency`.

- [#21580](https://github.com/LedgerHQ/ledger-live/pull/21580) [`a9e389f`](https://github.com/LedgerHQ/ledger-live/commit/a9e389fc59ca30abf53d0ba8decc6290752ba1db) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Stop calling the decommissioned Fantom explorer. Fantom Opera migrated to Sonic and its explorer infrastructure is gone: ftmscout.com returns HTTP 522 and ftmscan.com no longer resolves, which made adding a Fantom account fail with "Invalid Response from Fantom explorer".

  Fantom now uses `explorer: { type: "none" }`, so accounts sync balances through the still-live RPC node instead of erroring, with an empty operation history. The user-facing explorer links point to the OKX explorer.

## 0.12.0-next.0

### Minor Changes

- [#21488](https://github.com/LedgerHQ/ledger-live/pull/21488) [`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop `delisted` from `CryptoCurrency`. No registry entry ever set it, so the `listCryptoCurrencies()` production filter was testing a dead branch. It stays on `TokenCurrency`, where CAL drives it.

- [#21486](https://github.com/LedgerHQ/ledger-live/pull/21486) [`2d42e64`](https://github.com/LedgerHQ/ledger-live/commit/2d42e647d55f79cf2eb821ec30a232cc07891219) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop `deviceTicker` from `CryptoCurrency`. The field was declared in three places and set by 17 testnet/L2 registry entries, but nothing ever read it.

- [#21487](https://github.com/LedgerHQ/ledger-live/pull/21487) [`b7d0367`](https://github.com/LedgerHQ/ledger-live/commit/b7d03671db1aa022d3ff375465c7d8470bf2b215) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop `disableCountervalue` from `CryptoCurrency`. Nothing read it on a crypto currency; it stays on `TokenCurrency`, where the assets API drives it, and on `FiatCurrency`.

- [#21580](https://github.com/LedgerHQ/ledger-live/pull/21580) [`a9e389f`](https://github.com/LedgerHQ/ledger-live/commit/a9e389fc59ca30abf53d0ba8decc6290752ba1db) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Stop calling the decommissioned Fantom explorer. Fantom Opera migrated to Sonic and its explorer infrastructure is gone: ftmscout.com returns HTTP 522 and ftmscan.com no longer resolves, which made adding a Fantom account fail with "Invalid Response from Fantom explorer".

  Fantom now uses `explorer: { type: "none" }`, so accounts sync balances through the still-live RPC node instead of erroring, with an empty operation history. The user-facing explorer links point to the OKX explorer.

## 0.11.0

### Minor Changes

- [#21224](https://github.com/LedgerHQ/ledger-live/pull/21224) [`e6d6ed6`](https://github.com/LedgerHQ/ledger-live/commit/e6d6ed6eda460eb614680b31a42ba8067cc28d2a) Thanks [@vladyslavchupovskiy-ext-art](https://github.com/vladyslavchupovskiy-ext-art)! - add Gonka (GNK) as a new Cosmos-family currency with coin type 1200

## 0.11.0-next.0

### Minor Changes

- [#21224](https://github.com/LedgerHQ/ledger-live/pull/21224) [`e6d6ed6`](https://github.com/LedgerHQ/ledger-live/commit/e6d6ed6eda460eb614680b31a42ba8067cc28d2a) Thanks [@vladyslavchupovskiy-ext-art](https://github.com/vladyslavchupovskiy-ext-art)! - add Gonka (GNK) as a new Cosmos-family currency with coin type 1200

## 0.10.0

### Minor Changes

- [#20582](https://github.com/LedgerHQ/ledger-live/pull/20582) [`cc8b5b9`](https://github.com/LedgerHQ/ledger-live/commit/cc8b5b9af4a2ec488b6912d3fcb08bcc8f4b72c3) Thanks [@ysitbon](https://github.com/ysitbon)! - Move the currency id schemas to the packages that own them.

  `CryptoCurrencyIdSchema`, `TokenCurrencyIdSchema` and `FiatCurrencyIdSchema` (and their inferred
  types) now live in `@domain/entity-currency-crypto`, `@domain/entity-currency-token` and
  `@domain/entity-currency-fiat` respectively, instead of `@shared/schema-primitives`. A primitives
  package has no business knowing about crypto, tokens or fiat.

  The crypto and token packages used to re-export these symbols from primitives, which made them
  proxies: two import paths for the same thing, and no obvious original provider. Consumers already
  importing from `@domain/entity-currency-*` are unaffected, since the symbols genuinely moved there.
  Anything importing them from `@shared/schema-primitives` must now import the owning domain package.

## 0.10.0-next.0

### Minor Changes

- [#20582](https://github.com/LedgerHQ/ledger-live/pull/20582) [`cc8b5b9`](https://github.com/LedgerHQ/ledger-live/commit/cc8b5b9af4a2ec488b6912d3fcb08bcc8f4b72c3) Thanks [@ysitbon](https://github.com/ysitbon)! - Move the currency id schemas to the packages that own them.

  `CryptoCurrencyIdSchema`, `TokenCurrencyIdSchema` and `FiatCurrencyIdSchema` (and their inferred
  types) now live in `@domain/entity-currency-crypto`, `@domain/entity-currency-token` and
  `@domain/entity-currency-fiat` respectively, instead of `@shared/schema-primitives`. A primitives
  package has no business knowing about crypto, tokens or fiat.

  The crypto and token packages used to re-export these symbols from primitives, which made them
  proxies: two import paths for the same thing, and no obvious original provider. Consumers already
  importing from `@domain/entity-currency-*` are unaffected, since the symbols genuinely moved there.
  Anything importing them from `@shared/schema-primitives` must now import the owning domain package.

## 0.9.0

### Minor Changes

- [#20339](https://github.com/LedgerHQ/ledger-live/pull/20339) [`6a531c5`](https://github.com/LedgerHQ/ledger-live/commit/6a531c54ccd1c65df122286de6f136f9d73b9002) Thanks [@qperrot](https://github.com/qperrot)! - Remove Scroll Sepolia testnet support as it is no longer maintained

## 0.9.0-next.0

### Minor Changes

- [#20339](https://github.com/LedgerHQ/ledger-live/pull/20339) [`6a531c5`](https://github.com/LedgerHQ/ledger-live/commit/6a531c54ccd1c65df122286de6f136f9d73b9002) Thanks [@qperrot](https://github.com/qperrot)! - Remove Scroll Sepolia testnet support as it is no longer maintained

## 0.8.0

### Minor Changes

- [#20048](https://github.com/LedgerHQ/ledger-live/pull/20048) [`4148019`](https://github.com/LedgerHQ/ledger-live/commit/414801922232b6d9514270e8876e783c11555c2c) Thanks [@ysitbon](https://github.com/ysitbon)! - Re-export CryptoCurrencyId / CryptoCurrencyIdSchema from @domain/entity-currency-crypto and TokenCurrencyId / TokenCurrencyIdSchema from @domain/entity-currency-token

## 0.8.0-next.0

### Minor Changes

- [#20048](https://github.com/LedgerHQ/ledger-live/pull/20048) [`4148019`](https://github.com/LedgerHQ/ledger-live/commit/414801922232b6d9514270e8876e783c11555c2c) Thanks [@ysitbon](https://github.com/ysitbon)! - Re-export CryptoCurrencyId / CryptoCurrencyIdSchema from @domain/entity-currency-crypto and TokenCurrencyId / TokenCurrencyIdSchema from @domain/entity-currency-token

## 0.7.0

### Minor Changes

- [#19707](https://github.com/LedgerHQ/ledger-live/pull/19707) [`ea28df4`](https://github.com/LedgerHQ/ledger-live/commit/ea28df4a67e1c1f64ab0de5fddf7fc016edffa8c) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Hide Send and Receive for HyperCore accounts on desktop: HyperCore has no on-chain send on Ledger Wallet and a plain receive is misleading (deposits go through bridging). Both actions are now hidden across the account page, the account context menu and the empty-account state. Also drop the HyperCore per-transaction explorer view: the perps proxy exposes no HyperCore tx hash (deposits settle on Arbitrum, withdrawals expose no link), so the `tx` explorer URL was always broken — only the address explorer view is kept. Finally, the currency is renamed from "Hyperliquid (HyperCore)" to "Hyperliquid".

- [#19702](https://github.com/LedgerHQ/ledger-live/pull/19702) [`6935fe0`](https://github.com/LedgerHQ/ledger-live/commit/6935fe04a6304e046fd217350399446194e96d47) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Add HyperCore support by plugging `@ledgerhq/coin-hypercore` into the generic coin framework: register the `hypercore` native currency (USDC, magnitude 6), route the family through the generic bridge, reuse the EVM signer for address derivation (HyperCore shares the Ethereum address), and add the `currencyHypercore` feature flag. HyperCore accounts can be discovered and serve their balance and operations from the coin module. In the history, HyperCore operations are labelled "Deposit"/"Withdraw" instead of "Received"/"Sent" (deposits/withdrawals go through bridging, not a plain transfer).

- [#19734](https://github.com/LedgerHQ/ledger-live/pull/19734) [`bb2d2d2`](https://github.com/LedgerHQ/ledger-live/commit/bb2d2d250a1d5b8cde43ba963795d28b10b48be6) Thanks [@ishaba](https://github.com/ishaba)! - remove umee chain related code

## 0.7.0-next.0

### Minor Changes

- [#19707](https://github.com/LedgerHQ/ledger-live/pull/19707) [`ea28df4`](https://github.com/LedgerHQ/ledger-live/commit/ea28df4a67e1c1f64ab0de5fddf7fc016edffa8c) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Hide Send and Receive for HyperCore accounts on desktop: HyperCore has no on-chain send on Ledger Wallet and a plain receive is misleading (deposits go through bridging). Both actions are now hidden across the account page, the account context menu and the empty-account state. Also drop the HyperCore per-transaction explorer view: the perps proxy exposes no HyperCore tx hash (deposits settle on Arbitrum, withdrawals expose no link), so the `tx` explorer URL was always broken — only the address explorer view is kept. Finally, the currency is renamed from "Hyperliquid (HyperCore)" to "Hyperliquid".

- [#19702](https://github.com/LedgerHQ/ledger-live/pull/19702) [`6935fe0`](https://github.com/LedgerHQ/ledger-live/commit/6935fe04a6304e046fd217350399446194e96d47) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Add HyperCore support by plugging `@ledgerhq/coin-hypercore` into the generic coin framework: register the `hypercore` native currency (USDC, magnitude 6), route the family through the generic bridge, reuse the EVM signer for address derivation (HyperCore shares the Ethereum address), and add the `currencyHypercore` feature flag. HyperCore accounts can be discovered and serve their balance and operations from the coin module. In the history, HyperCore operations are labelled "Deposit"/"Withdraw" instead of "Received"/"Sent" (deposits/withdrawals go through bridging, not a plain transfer).

- [#19734](https://github.com/LedgerHQ/ledger-live/pull/19734) [`bb2d2d2`](https://github.com/LedgerHQ/ledger-live/commit/bb2d2d250a1d5b8cde43ba963795d28b10b48be6) Thanks [@ishaba](https://github.com/ishaba)! - remove umee chain related code

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->

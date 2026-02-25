# EVM family integration process

_How to integrate a new EVM family currency in the Ledger Live application._

This document will outline the different steps needed to implement a new EVM family currency in the Ledger Live application.
Depending on the specifications, some steps might not be needed for all currencies.

## Specifications

Most EVM coin integrations are quite similar. The main specs will be outlined below.
But each coin may have its specificities and more information can be found on the specific coin integration Jira Epic created for each integration, based on this template https://ledgerhq.atlassian.net/browse/LIVE-10187

- Integration is done in Ledger Live desktop and Ledger Live mobile
- Supported features:
  - Sending and receiving coins
  - Viewing transaction history
  - Token support, enabling interactions with the blockchain tokens
- Use of public RPC node and explorer (etherscan-like). This should be specified in the corresponding Jira Epic
  - To find a public node, you can use https://chainlist.org/ for example
  - To find a public explorer, you can use https://blockscan.com/ (etherscan-like) for example
- The [Ethereum embedded app](https://github.com/LedgerHQ/app-ethereum) must handle this new network

## Live codebase update

Here is an example PR of an EVM currency integration: https://github.com/LedgerHQ/ledger-live/pull/4008

### Main steps

_Common steps for all new EVM currency integration_

1. Add a new config entry for the new currency under [`libs/ledgerjs/packages/cryptoassets/src/currencies.ts`](https://github.com/LedgerHQ/ledger-live/blob/develop/libs/ledgerjs/packages/cryptoassets/src/currencies.ts) (the `CryptoCurrencyId` type is auto-generated)
2. Add an entry for the new currency in the `abandonSeedAddresses` (using the currency ID as key and `EVM_DEAD_ADDRESS` as value) under [`libs/ledgerjs/packages/cryptoassets/src/abandonseed.ts`](https://github.com/LedgerHQ/ledger-live/blob/develop/libs/ledgerjs/packages/cryptoassets/src/abandonseed.ts)
3. Add the new currency ID to the `setSupportedCurrencies` function param on each relevant project ([CLI](https://github.com/LedgerHQ/ledger-live/blob/develop/apps/cli/src/live-common-setup-base.ts), [LLD](https://github.com/LedgerHQ/ledger-live/blob/develop/apps/ledger-live-desktop/src/live-common-set-supported-currencies.ts), [LLM](https://github.com/LedgerHQ/ledger-live/blob/develop/apps/ledger-live-mobile/src/live-common-setup.ts), [LLC test environment](https://github.com/LedgerHQ/ledger-live/blob/develop/libs/ledger-live-common/src/__tests__/test-helpers/environment.ts), [web-tools](https://github.com/LedgerHQ/ledger-live/blob/develop/apps/web-tools/src/live-common-setup.ts) and [account-migration tests](https://github.com/LedgerHQ/ledger-live/blob/develop/libs/ledger-live-common/src/__tests__/migration/account-migration.ts))
4. Add a new feature flag config for this currency:
   1. The new feature flag type in the [`CurrencyFeatures`](https://github.com/LedgerHQ/ledger-live/blob/develop/libs/ledgerjs/packages/types-live/src/feature.ts) type under `libs/ledgerjs/packages/types-live/src/feature.ts`
   2. The new feature flag definition with default value in the [`CURRENCY_DEFAULT_FEATURES`](https://github.com/LedgerHQ/ledger-live/blob/develop/libs/ledger-live-common/src/featureFlags/defaultFeatures.ts) mapping under `libs/ledger-live-common/src/featureFlags/defaultFeatures.ts`
   3. Use this new feature flag in [`useCurrenciesUnderFeatureFlag.ts`](https://github.com/LedgerHQ/ledger-live/blob/develop/libs/ledger-live-common/src/modularDrawer/hooks/useCurrenciesUnderFeatureFlag.ts)
5. Add the EVM config for RPC node and explorer under [`libs/ledger-live-common/src/families/evm/config.ts`](https://github.com/LedgerHQ/ledger-live/blob/develop/libs/ledger-live-common/src/families/evm/config.ts)
6. Update snapshot files:
   1. `pnpm test -- -u` from `libs/coin-framework` to update `formatCurrencyUnit.test.ts` snapshots
   2. `pnpm test:playwright tests/specs/services/wallet-api.spec.ts` from `apps/ledger-live-desktop` and update `tests/fixtures/wallet-api.ts` with new currencies
7. Add the related currency icon to the [crypto-icons](https://github.com/LedgerHQ/crypto-icons) repository (see its README for instructions)

### Optional steps

_Optional / extra steps that might be needed on a case-by-case basis depending on the integration_

- If the related currency public explorer is not an etherscan-like, you might need to add a new implementation for this currency explorer
  - If needed, create a new explorer implementation of this explorer API in a new file under the [`libs/coin-modules/coin-evm/src/network/explorer`](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/coin-modules/coin-evm/src/network/explorer) folder
  - Add the new explorer type to:
    - the `getExplorerApi` function under [`libs/coin-modules/coin-evm/src/network/explorer/index.ts`](https://github.com/LedgerHQ/ledger-live/blob/develop/libs/coin-modules/coin-evm/src/network/explorer/index.ts)
    - the `EthereumLikeInfo.explorer.type` type under [`libs/ledgerjs/packages/types-cryptoassets/src/index.ts`](https://github.com/LedgerHQ/ledger-live/blob/develop/libs/ledgerjs/packages/types-cryptoassets/src/index.ts)
    - if the new explorer type follows the etherscan-like API, add it to the `isEtherscanLikeExplorerConfig` type guard under [`libs/coin-modules/coin-evm/src/network/explorer/types.ts`](https://github.com/LedgerHQ/ledger-live/blob/develop/libs/coin-modules/coin-evm/src/network/explorer/types.ts) (this is the case for some custom made explorers that are not blockscan white label implementation, but are still compatible with the blockscan/etherscan API)

## Tokens support

Here are the steps to handle the new currencies (ERC20) tokens, if relevant:

- add the new tokens config to the [CAL](https://github.com/LedgerHQ/crypto-assets) (historically handled by @adrienlacombe-ledger)
- after this update of the CAL, check that the tokens are present on the CDN, replacing `{chainId}` with the actual currency chain ID, specified under `ethereumLikeInfo.chainId` in the currency config (under [libs/ledgerjs/packages/cryptoassets/src/currencies.ts](https://github.com/LedgerHQ/ledger-live/blob/develop/libs/ledgerjs/packages/cryptoassets/src/currencies.ts)) which would be `1` for ethereum mainnet for example, using https://cdn.live.ledger.com/cryptoassets/evm/{chainId}/erc20.json

No change should be needed on Ledger Live side since tokens are automatically imported from CAL at the release stage, cf:

- this GitHub Action [`.github/workflows/test-release-create.yml`](https://github.com/LedgerHQ/ledger-live/blob/develop/.github/workflows/test-release-create.yml)
- the `import:cal-tokens` job in the [`ledger-js` package](https://github.com/LedgerHQ/ledger-live/blob/develop/libs/ledgerjs/package.json)

## Counter values support (fiat prices)

To have the associated market (fiat) price supported for the network being added, some config updates are needed on the `CAL` and `countervalue service` sides.

The process for this can be found here: https://ledgerhq.atlassian.net/wiki/spaces/WALLETCO/pages/4354769042/Adding+price+support+for+a+currency

## Ethereum app firmware update

The new network being added needs to be handled by the [nano ethereum app](https://github.com/LedgerHQ/app-ethereum).

Make sure the network being added is present under the `network_info_t` mapping in `src_common/network.c` ([here](https://github.com/LedgerHQ/app-ethereum/blob/develop/src_common/network.c) for staging and [here](https://github.com/LedgerHQ/app-ethereum/blob/master/src_common/network.c) for prod).

In Ledger Live, make sure the ethereum nano app version requirements match the latest version of the ethereum app handling the network being added:

- `appVersion` in `getAppQuery` under [`libs/coin-modules/coin-evm/src/specs.ts`](https://github.com/LedgerHQ/ledger-live/blob/develop/libs/coin-modules/coin-evm/src/specs.ts)
- `Ethereum` in `appVersionsRequired` under [`libs/ledger-live-common/src/apps/support.ts`](https://github.com/LedgerHQ/ledger-live/blob/develop/libs/ledger-live-common/src/apps/support.ts)
- related tests for the ethereum app version under [`libs/ledger-live-common/src/apps/support.test.ts`](https://github.com/LedgerHQ/ledger-live/blob/develop/libs/ledger-live-common/src/apps/support.test.ts)

## Tests

### Bot

- Make sure to fund the appropriate bot(s) with coins and tokens of the new network being added (cf. [The different bots](https://github.com/LedgerHQ/ledger-live/wiki/LLC:bot#the-different-bots))
- Make sure to make the bot run multiple times on your PR to make sure everything works fine with the new network
- If the coin related to the network you are adding is somewhat expensive, you can tailor the minimum balance needed to test this coin by updating `minBalancePerCurrencyId` under [`libs/coin-modules/coin-evm/src/specs.ts`](https://github.com/LedgerHQ/ledger-live/blob/develop/libs/coin-modules/coin-evm/src/specs.ts)

### Manual testing

The bare minimum to test in terms of flows is, on both LLD and LLM:

- Add account
- Send funds (coins) from one account to another
- Add (receive) token (if supported)
- Send token (if supported)

## Firebase Feature Flag config

Make sure to add the newly created currency feature flag to the Firebase config

# @ledgerhq/wallet-api-exchange-module

## 0.19.0-next.0

### Minor Changes

- [#12775](https://github.com/LedgerHQ/ledger-live/pull/12775) [`6d0c6b2`](https://github.com/LedgerHQ/ledger-live/commit/6d0c6b2eda60049d8eebda5de2c54e8f0be7d009) Thanks [@Justkant](https://github.com/Justkant)! - refactor(wallet-api): migrate to lazy account/currency loading pattern

  Refactor Wallet & Platform APIs to lazy-load currencies/accounts via CAL API.

  Highlights:

  - Replace precomputed currency/account datasets with on-demand fetching (pagination supported).
  - account.request: now uses currencyIds: string[]; removes Observable parameter; upfront ID mapping helper added.
  - currency.list: dynamic token retrieval; supports patterns (** / family/** / specific); adds delisted warnings.
  - Remove legacy hooks (useWalletAPIAccounts, useWalletAPICurrencies, useGetAccountIds); introduce useSetWalletAPIAccounts & useDAppManifestCurrencyIds.
  - Async token/address lookup; simplified modular drawer (no accounts$ / observable registry).
  - Desktop/mobile components now operate on currencyIds; streamlined account/currency selection flows.
  - Platform API: async listing with minimatch filtering; dropped multiple filtering helpers.
  - Added tracking for currency.list & account.list; fixed areCurrenciesFiltered logic (LIVE-23089).
  - Package bumps: wallet-api-client ^1.12.5, wallet-api-core ^1.26.1, wallet-api-server ^2.0.0; unify bignumber.js 9.1.2.
    Impact: lower memory, faster startup, improved scalability, clearer API surface.

## 0.18.0

### Minor Changes

- [#12252](https://github.com/LedgerHQ/ledger-live/pull/12252) [`958aaa4`](https://github.com/LedgerHQ/ledger-live/commit/958aaa480d9d42d71bf4dc46b2e5710ad9848152) Thanks [@Justkant](https://github.com/Justkant)! - feat(coin-ton): support new TON payload types (tonwhales deposit/withdraw, vesting comment)

  Adds typed payload variants and serialization/deserialization for:

  - tonwhales-pool-deposit
  - tonwhales-pool-withdraw
  - vesting-send-msg-comment

  Updates unit tests to cover new payloads and retains an explicit unsupported payload test case (lint-suppressed locally). Also bumps TON-related and wallet-api dependencies and replaces the @ton/core patch file reference.

- [#12197](https://github.com/LedgerHQ/ledger-live/pull/12197) [`7744980`](https://github.com/LedgerHQ/ledger-live/commit/774498090411f1a6d6c06395dda1fc7cd24adf24) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Adding sponsored transactions to evm based swap transactions

## 0.18.0-next.0

### Minor Changes

- [#12252](https://github.com/LedgerHQ/ledger-live/pull/12252) [`958aaa4`](https://github.com/LedgerHQ/ledger-live/commit/958aaa480d9d42d71bf4dc46b2e5710ad9848152) Thanks [@Justkant](https://github.com/Justkant)! - feat(coin-ton): support new TON payload types (tonwhales deposit/withdraw, vesting comment)

  Adds typed payload variants and serialization/deserialization for:

  - tonwhales-pool-deposit
  - tonwhales-pool-withdraw
  - vesting-send-msg-comment

  Updates unit tests to cover new payloads and retains an explicit unsupported payload test case (lint-suppressed locally). Also bumps TON-related and wallet-api dependencies and replaces the @ton/core patch file reference.

- [#12197](https://github.com/LedgerHQ/ledger-live/pull/12197) [`7744980`](https://github.com/LedgerHQ/ledger-live/commit/774498090411f1a6d6c06395dda1fc7cd24adf24) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Adding sponsored transactions to evm based swap transactions

## 0.17.0

### Minor Changes

- [#12015](https://github.com/LedgerHQ/ledger-live/pull/12015) [`03af552`](https://github.com/LedgerHQ/ledger-live/commit/03af552b621e19e31747a65b1870dfe8d3bb005b) Thanks [@Justkant](https://github.com/Justkant)! - feat: new signRawTransaction to support any XRP transaction with wallet-api

- [#12030](https://github.com/LedgerHQ/ledger-live/pull/12030) [`c56dece`](https://github.com/LedgerHQ/ledger-live/commit/c56dece6b87835d55baf90277c9141d40df2d92a) Thanks [@semeano](https://github.com/semeano)! - Update wallet API dependencies

## 0.17.0-next.0

### Minor Changes

- [#12015](https://github.com/LedgerHQ/ledger-live/pull/12015) [`03af552`](https://github.com/LedgerHQ/ledger-live/commit/03af552b621e19e31747a65b1870dfe8d3bb005b) Thanks [@Justkant](https://github.com/Justkant)! - feat: new signRawTransaction to support any XRP transaction with wallet-api

- [#12030](https://github.com/LedgerHQ/ledger-live/pull/12030) [`c56dece`](https://github.com/LedgerHQ/ledger-live/commit/c56dece6b87835d55baf90277c9141d40df2d92a) Thanks [@semeano](https://github.com/semeano)! - Update wallet API dependencies

## 0.16.0

### Minor Changes

- [#11390](https://github.com/LedgerHQ/ledger-live/pull/11390) [`64dcecb`](https://github.com/LedgerHQ/ledger-live/commit/64dcecb1a971fc250e80344ba6d42b815ddd18c9) Thanks [@hhumphrey-ledger](https://github.com/hhumphrey-ledger)! - Updates to support exchangeSDK fund flow in LL

- [#11319](https://github.com/LedgerHQ/ledger-live/pull/11319) [`23cd759`](https://github.com/LedgerHQ/ledger-live/commit/23cd7596d34692e5ca75b1aebaedb7c8d5f34927) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - fix: llc swap change amountInAtomicUnit type to BigNumber for better precision

## 0.16.0-next.0

### Minor Changes

- [#11390](https://github.com/LedgerHQ/ledger-live/pull/11390) [`64dcecb`](https://github.com/LedgerHQ/ledger-live/commit/64dcecb1a971fc250e80344ba6d42b815ddd18c9) Thanks [@hhumphrey-ledger](https://github.com/hhumphrey-ledger)! - Updates to support exchangeSDK fund flow in LL

- [#11319](https://github.com/LedgerHQ/ledger-live/pull/11319) [`23cd759`](https://github.com/LedgerHQ/ledger-live/commit/23cd7596d34692e5ca75b1aebaedb7c8d5f34927) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - fix: llc swap change amountInAtomicUnit type to BigNumber for better precision

## 0.15.0

### Minor Changes

- [#10895](https://github.com/LedgerHQ/ledger-live/pull/10895) [`67e2a7c`](https://github.com/LedgerHQ/ledger-live/commit/67e2a7c5a74d000f22684254778dfec5b8b5163d) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Support Apex

## 0.15.0-next.0

### Minor Changes

- [#10895](https://github.com/LedgerHQ/ledger-live/pull/10895) [`67e2a7c`](https://github.com/LedgerHQ/ledger-live/commit/67e2a7c5a74d000f22684254778dfec5b8b5163d) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Support Apex

## 0.14.0

### Minor Changes

- [#10789](https://github.com/LedgerHQ/ledger-live/pull/10789) [`6e8ef64`](https://github.com/LedgerHQ/ledger-live/commit/6e8ef645cbb33ae4ce98c1d39c3b54d076d61b9b) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - track swap-live-app version in api calls headers

- [#10119](https://github.com/LedgerHQ/ledger-live/pull/10119) [`f5105d2`](https://github.com/LedgerHQ/ledger-live/commit/f5105d216264b2fd59fc66cf2b9b71f9ef6eb818) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Swap - Create custom method "custom.exchange.swap"

## 0.14.0-next.0

### Minor Changes

- [#10789](https://github.com/LedgerHQ/ledger-live/pull/10789) [`6e8ef64`](https://github.com/LedgerHQ/ledger-live/commit/6e8ef645cbb33ae4ce98c1d39c3b54d076d61b9b) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - track swap-live-app version in api calls headers

- [#10119](https://github.com/LedgerHQ/ledger-live/pull/10119) [`f5105d2`](https://github.com/LedgerHQ/ledger-live/commit/f5105d216264b2fd59fc66cf2b9b71f9ef6eb818) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Swap - Create custom method "custom.exchange.swap"

## 0.13.0

### Minor Changes

- [#9837](https://github.com/LedgerHQ/ledger-live/pull/9837) [`1488235`](https://github.com/LedgerHQ/ledger-live/commit/1488235ee13fd1f6e71b7bae0da88142986e6c6d) Thanks [@Justkant](https://github.com/Justkant)! - chore: bump wallet-api versions

- [#10146](https://github.com/LedgerHQ/ledger-live/pull/10146) [`ff447b4`](https://github.com/LedgerHQ/ledger-live/commit/ff447b4ded74469b3e9599068951c7f4f2aa4dc5) Thanks [@Justkant](https://github.com/Justkant)! - chore: bump wallet-api versions

## 0.13.0-next.0

### Minor Changes

- [#9837](https://github.com/LedgerHQ/ledger-live/pull/9837) [`1488235`](https://github.com/LedgerHQ/ledger-live/commit/1488235ee13fd1f6e71b7bae0da88142986e6c6d) Thanks [@Justkant](https://github.com/Justkant)! - chore: bump wallet-api versions

- [#10146](https://github.com/LedgerHQ/ledger-live/pull/10146) [`ff447b4`](https://github.com/LedgerHQ/ledger-live/commit/ff447b4ded74469b3e9599068951c7f4f2aa4dc5) Thanks [@Justkant](https://github.com/Justkant)! - chore: bump wallet-api versions

## 0.12.0

### Minor Changes

- [#9811](https://github.com/LedgerHQ/ledger-live/pull/9811) [`7456a97`](https://github.com/LedgerHQ/ledger-live/commit/7456a97e358afa5d59e0d394dfa29cb80dee65d1) Thanks [@qperrot](https://github.com/qperrot)! - Add approve and revoke commande and upgarde wallet api versions

## 0.12.0-next.0

### Minor Changes

- [#9811](https://github.com/LedgerHQ/ledger-live/pull/9811) [`7456a97`](https://github.com/LedgerHQ/ledger-live/commit/7456a97e358afa5d59e0d394dfa29cb80dee65d1) Thanks [@qperrot](https://github.com/qperrot)! - Add approve and revoke commande and upgarde wallet api versions

## 0.11.0

### Minor Changes

- [#9660](https://github.com/LedgerHQ/ledger-live/pull/9660) [`ad6d873`](https://github.com/LedgerHQ/ledger-live/commit/ad6d87394cf53f7912a1aa7a5392635570b8374f) Thanks [@jonezque](https://github.com/jonezque)! - chore: bumped wallet-api with sui integration

## 0.11.0-next.0

### Minor Changes

- [#9660](https://github.com/LedgerHQ/ledger-live/pull/9660) [`ad6d873`](https://github.com/LedgerHQ/ledger-live/commit/ad6d87394cf53f7912a1aa7a5392635570b8374f) Thanks [@jonezque](https://github.com/jonezque)! - chore: bumped wallet-api with sui integration

## 0.10.0

### Minor Changes

- [#9147](https://github.com/LedgerHQ/ledger-live/pull/9147) [`1bd0955`](https://github.com/LedgerHQ/ledger-live/commit/1bd0955280a92fab7cf800b49d0ca5314ecbbdc9) Thanks [@semeano](https://github.com/semeano)! - Update wallet api dependencies

- [#9096](https://github.com/LedgerHQ/ledger-live/pull/9096) [`49cb00c`](https://github.com/LedgerHQ/ledger-live/commit/49cb00cca4ac96634a4e052ec6a007a19cb73ed5) Thanks [@semeano](https://github.com/semeano)! - Update WalletAPI dependencies

## 0.10.0-next.0

### Minor Changes

- [#9147](https://github.com/LedgerHQ/ledger-live/pull/9147) [`1bd0955`](https://github.com/LedgerHQ/ledger-live/commit/1bd0955280a92fab7cf800b49d0ca5314ecbbdc9) Thanks [@semeano](https://github.com/semeano)! - Update wallet api dependencies

- [#9096](https://github.com/LedgerHQ/ledger-live/pull/9096) [`49cb00c`](https://github.com/LedgerHQ/ledger-live/commit/49cb00cca4ac96634a4e052ec6a007a19cb73ed5) Thanks [@semeano](https://github.com/semeano)! - Update WalletAPI dependencies

## 0.9.0

### Minor Changes

- [#8938](https://github.com/LedgerHQ/ledger-live/pull/8938) [`59af83f`](https://github.com/LedgerHQ/ledger-live/commit/59af83f6fa6787c055646ec65d17fe6773eab38e) Thanks [@CremaFR](https://github.com/CremaFR)! - fixed incorrect fee strategy types

## 0.9.0-next.0

### Minor Changes

- [#8938](https://github.com/LedgerHQ/ledger-live/pull/8938) [`59af83f`](https://github.com/LedgerHQ/ledger-live/commit/59af83f6fa6787c055646ec65d17fe6773eab38e) Thanks [@CremaFR](https://github.com/CremaFR)! - fixed incorrect fee strategy types

## 0.8.0

### Minor Changes

- [#8401](https://github.com/LedgerHQ/ledger-live/pull/8401) [`5c4455f`](https://github.com/LedgerHQ/ledger-live/commit/5c4455f80b03991843e16c80c5af5a019db25227) Thanks [@chrisduma-ledger](https://github.com/chrisduma-ledger)! - Fixes app install and refactors logic

## 0.8.0-next.0

### Minor Changes

- [#8401](https://github.com/LedgerHQ/ledger-live/pull/8401) [`5c4455f`](https://github.com/LedgerHQ/ledger-live/commit/5c4455f80b03991843e16c80c5af5a019db25227) Thanks [@chrisduma-ledger](https://github.com/chrisduma-ledger)! - Fixes app install and refactors logic

## 0.7.1

### Patch Changes

- [#7634](https://github.com/LedgerHQ/ledger-live/pull/7634) [`940d807`](https://github.com/LedgerHQ/ledger-live/commit/940d8073f6395cbcc2369f46aa6ad30216b00198) Thanks [@Justkant](https://github.com/Justkant)! - chore: bump wallet-api deps

## 0.7.1-next.0

### Patch Changes

- [#7634](https://github.com/LedgerHQ/ledger-live/pull/7634) [`940d807`](https://github.com/LedgerHQ/ledger-live/commit/940d8073f6395cbcc2369f46aa6ad30216b00198) Thanks [@Justkant](https://github.com/Justkant)! - chore: bump wallet-api deps

## 0.7.0

### Minor Changes

- [#6596](https://github.com/LedgerHQ/ledger-live/pull/6596) [`77fa530`](https://github.com/LedgerHQ/ledger-live/commit/77fa530c8626df94fa7f9c0a8b3a99f2efa7cb11) Thanks [@KVNLS](https://github.com/KVNLS)! - Upgrade React Native to version 0.73.6

- [#6799](https://github.com/LedgerHQ/ledger-live/pull/6799) [`b099b70`](https://github.com/LedgerHQ/ledger-live/commit/b099b70c0c5b8b23cae7c9bee6580ad22ace6f4a) Thanks [@andreicovaciu](https://github.com/andreicovaciu)! - Track swap cancel and accept with by returning device property from custom.exchange.start handler

### Patch Changes

- [#6766](https://github.com/LedgerHQ/ledger-live/pull/6766) [`5d18b4f`](https://github.com/LedgerHQ/ledger-live/commit/5d18b4ff4d1745e7c32993a8d94bb1dc5529391f) Thanks [@CremaFR](https://github.com/CremaFR)! - fixed error message for rate expired

- [#6796](https://github.com/LedgerHQ/ledger-live/pull/6796) [`6552679`](https://github.com/LedgerHQ/ledger-live/commit/65526794bb4d1fbc7e286c0e1c0b6d021413fc8c) Thanks [@gre](https://github.com/gre)! - Drop technical Account#name and Account#starred fields and replace it with a new architecture: a wallet store that contains all user's data.

- [#6840](https://github.com/LedgerHQ/ledger-live/pull/6840) [`77d60e6`](https://github.com/LedgerHQ/ledger-live/commit/77d60e6f61f04b0650947fc56db5052dd4ff7e00) Thanks [@Justkant](https://github.com/Justkant)! - chore: bump wallet-api versions

## 0.7.0-next.0

### Minor Changes

- [#6596](https://github.com/LedgerHQ/ledger-live/pull/6596) [`77fa530`](https://github.com/LedgerHQ/ledger-live/commit/77fa530c8626df94fa7f9c0a8b3a99f2efa7cb11) Thanks [@KVNLS](https://github.com/KVNLS)! - Upgrade React Native to version 0.73.6

- [#6799](https://github.com/LedgerHQ/ledger-live/pull/6799) [`b099b70`](https://github.com/LedgerHQ/ledger-live/commit/b099b70c0c5b8b23cae7c9bee6580ad22ace6f4a) Thanks [@andreicovaciu](https://github.com/andreicovaciu)! - Track swap cancel and accept with by returning device property from custom.exchange.start handler

### Patch Changes

- [#6766](https://github.com/LedgerHQ/ledger-live/pull/6766) [`5d18b4f`](https://github.com/LedgerHQ/ledger-live/commit/5d18b4ff4d1745e7c32993a8d94bb1dc5529391f) Thanks [@CremaFR](https://github.com/CremaFR)! - fixed error message for rate expired

- [#6796](https://github.com/LedgerHQ/ledger-live/pull/6796) [`6552679`](https://github.com/LedgerHQ/ledger-live/commit/65526794bb4d1fbc7e286c0e1c0b6d021413fc8c) Thanks [@gre](https://github.com/gre)! - Drop technical Account#name and Account#starred fields and replace it with a new architecture: a wallet store that contains all user's data.

- [#6840](https://github.com/LedgerHQ/ledger-live/pull/6840) [`77d60e6`](https://github.com/LedgerHQ/ledger-live/commit/77d60e6f61f04b0650947fc56db5052dd4ff7e00) Thanks [@Justkant](https://github.com/Justkant)! - chore: bump wallet-api versions

## 0.6.0

### Minor Changes

- [#6605](https://github.com/LedgerHQ/ledger-live/pull/6605) [`d766a94`](https://github.com/LedgerHQ/ledger-live/commit/d766a94232dab571f01f4622679f65d651faef3c) Thanks [@CremaFR](https://github.com/CremaFR)! - removed unused params that prevent the module from being used

- [#6654](https://github.com/LedgerHQ/ledger-live/pull/6654) [`d9d8902`](https://github.com/LedgerHQ/ledger-live/commit/d9d890272167aec86db19f028b64314f65a9bf14) Thanks [@CremaFR](https://github.com/CremaFR)! - added error management

### Patch Changes

- [#6610](https://github.com/LedgerHQ/ledger-live/pull/6610) [`06f4606`](https://github.com/LedgerHQ/ledger-live/commit/06f4606f354496bc322be34932260eb9a1cdac42) Thanks [@Wozacosta](https://github.com/Wozacosta)! - chore: bump wallet-api packages

## 0.6.0-next.0

### Minor Changes

- [#6605](https://github.com/LedgerHQ/ledger-live/pull/6605) [`d766a94`](https://github.com/LedgerHQ/ledger-live/commit/d766a94232dab571f01f4622679f65d651faef3c) Thanks [@CremaFR](https://github.com/CremaFR)! - removed unused params that prevent the module from being used

- [#6654](https://github.com/LedgerHQ/ledger-live/pull/6654) [`d9d8902`](https://github.com/LedgerHQ/ledger-live/commit/d9d890272167aec86db19f028b64314f65a9bf14) Thanks [@CremaFR](https://github.com/CremaFR)! - added error management

### Patch Changes

- [#6610](https://github.com/LedgerHQ/ledger-live/pull/6610) [`06f4606`](https://github.com/LedgerHQ/ledger-live/commit/06f4606f354496bc322be34932260eb9a1cdac42) Thanks [@Wozacosta](https://github.com/Wozacosta)! - chore: bump wallet-api packages

## 0.5.0

### Minor Changes

- [#6154](https://github.com/LedgerHQ/ledger-live/pull/6154) [`f0ab3d9`](https://github.com/LedgerHQ/ledger-live/commit/f0ab3d9df5a70368226b1b466fcaadaa21715827) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Add Sell NG support

### Patch Changes

- [#6420](https://github.com/LedgerHQ/ledger-live/pull/6420) [`2b5c3bb`](https://github.com/LedgerHQ/ledger-live/commit/2b5c3bb7c31445f840b66f7e0f51e9e2b07b0c49) Thanks [@sarneijim](https://github.com/sarneijim)! - Use bk payload as source of true for swap

- [#6588](https://github.com/LedgerHQ/ledger-live/pull/6588) [`370b3b1`](https://github.com/LedgerHQ/ledger-live/commit/370b3b13c1c0d9e3f985ea3d546d5f9cad03ae31) Thanks [@Justkant](https://github.com/Justkant)! - chore: bump wallet-api packages

- [#6261](https://github.com/LedgerHQ/ledger-live/pull/6261) [`d3f0681`](https://github.com/LedgerHQ/ledger-live/commit/d3f06813d6e001b9954455247d56ca6833a0d7de) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Bump wallet-api packages to support DeviceModelId.Europa

## 0.5.0-next.0

### Minor Changes

- [#6154](https://github.com/LedgerHQ/ledger-live/pull/6154) [`f0ab3d9`](https://github.com/LedgerHQ/ledger-live/commit/f0ab3d9df5a70368226b1b466fcaadaa21715827) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Add Sell NG support

### Patch Changes

- [#6420](https://github.com/LedgerHQ/ledger-live/pull/6420) [`2b5c3bb`](https://github.com/LedgerHQ/ledger-live/commit/2b5c3bb7c31445f840b66f7e0f51e9e2b07b0c49) Thanks [@sarneijim](https://github.com/sarneijim)! - Use bk payload as source of true for swap

- [#6588](https://github.com/LedgerHQ/ledger-live/pull/6588) [`370b3b1`](https://github.com/LedgerHQ/ledger-live/commit/370b3b13c1c0d9e3f985ea3d546d5f9cad03ae31) Thanks [@Justkant](https://github.com/Justkant)! - chore: bump wallet-api packages

- [#6261](https://github.com/LedgerHQ/ledger-live/pull/6261) [`d3f0681`](https://github.com/LedgerHQ/ledger-live/commit/d3f06813d6e001b9954455247d56ca6833a0d7de) Thanks [@ofreyssinet-ledger](https://github.com/ofreyssinet-ledger)! - Bump wallet-api packages to support DeviceModelId.Europa

## 0.4.0

### Minor Changes

- [#6009](https://github.com/LedgerHQ/ledger-live/pull/6009) [`67da88e`](https://github.com/LedgerHQ/ledger-live/commit/67da88e89dfdddf570d1256586447501632b3d03) Thanks [@CremaFR](https://github.com/CremaFR)! - update start exchange to support swap based on provider

### Patch Changes

- [#6218](https://github.com/LedgerHQ/ledger-live/pull/6218) [`3b6b538`](https://github.com/LedgerHQ/ledger-live/commit/3b6b53800e29a47ff5792c17221fbfba31cd8500) Thanks [@Wozacosta](https://github.com/Wozacosta)! - use latest version of wallet api packages to handle parentAccountId being passed when requesting accounts

## 0.4.0-next.0

### Minor Changes

- [#6009](https://github.com/LedgerHQ/ledger-live/pull/6009) [`67da88e`](https://github.com/LedgerHQ/ledger-live/commit/67da88e89dfdddf570d1256586447501632b3d03) Thanks [@CremaFR](https://github.com/CremaFR)! - update start exchange to support swap based on provider

### Patch Changes

- [#6218](https://github.com/LedgerHQ/ledger-live/pull/6218) [`3b6b538`](https://github.com/LedgerHQ/ledger-live/commit/3b6b53800e29a47ff5792c17221fbfba31cd8500) Thanks [@Wozacosta](https://github.com/Wozacosta)! - use latest version of wallet api packages to handle parentAccountId being passed when requesting accounts

## 0.3.0

### Minor Changes

- [#6165](https://github.com/LedgerHQ/ledger-live/pull/6165) [`23d9911`](https://github.com/LedgerHQ/ledger-live/commit/23d991193313f49d25d5011c0f9fb1310fd97e69) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - update start exchange to support swap based on provider

## 0.3.0-next.0

### Minor Changes

- [#6009](https://github.com/LedgerHQ/ledger-live/pull/6009) [`67da88e`](https://github.com/LedgerHQ/ledger-live/commit/67da88e89dfdddf570d1256586447501632b3d03) Thanks [@CremaFR](https://github.com/CremaFR)! - update start exchange to support swap based on provider

## 0.2.0

### Minor Changes

- [#5648](https://github.com/LedgerHQ/ledger-live/pull/5648) [`6f012ed`](https://github.com/LedgerHQ/ledger-live/commit/6f012eda136d641836e839721a8ffba6bdc3d93f) Thanks [@Justkant](https://github.com/Justkant)! - feat: wallet-api custom echange

## 0.2.0-next.0

### Minor Changes

- [#5648](https://github.com/LedgerHQ/ledger-live/pull/5648) [`6f012ed`](https://github.com/LedgerHQ/ledger-live/commit/6f012eda136d641836e839721a8ffba6bdc3d93f) Thanks [@Justkant](https://github.com/Justkant)! - feat: wallet-api custom echange

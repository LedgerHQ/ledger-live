# @ledgerhq/coin-stellar

## 5.1.1

### Patch Changes

- Updated dependencies [[`4ddfe60`](https://github.com/LedgerHQ/ledger-live/commit/4ddfe6060ab8e4e5c0bb89da91e08a02d8ca50e6), [`f42f353`](https://github.com/LedgerHQ/ledger-live/commit/f42f353a593d0a1cd0a237648765080c85d0eea7), [`ebbbd47`](https://github.com/LedgerHQ/ledger-live/commit/ebbbd47efe76d82047a956cb5849be5831f58772), [`f29e4ba`](https://github.com/LedgerHQ/ledger-live/commit/f29e4bae00a4bf470a0c1ca143e505b731543f95), [`1a4e5e5`](https://github.com/LedgerHQ/ledger-live/commit/1a4e5e5913fe5e12d6127b36f3849e4c81e5e50e)]:
  - @ledgerhq/types-live@6.72.0
  - @ledgerhq/coin-framework@5.2.0
  - @ledgerhq/logs@6.13.0
  - @ledgerhq/devices@8.4.6
  - @ledgerhq/live-network@2.0.9

## 5.1.1-next.2

### Patch Changes

- Updated dependencies [[`ebbbd47`](https://github.com/LedgerHQ/ledger-live/commit/ebbbd47efe76d82047a956cb5849be5831f58772)]:
  - @ledgerhq/logs@6.13.0-next.1
  - @ledgerhq/coin-framework@5.2.0-next.2
  - @ledgerhq/devices@8.4.6-next.1
  - @ledgerhq/live-network@2.0.9-next.1

## 5.1.1-next.1

### Patch Changes

- Updated dependencies [[`f29e4ba`](https://github.com/LedgerHQ/ledger-live/commit/f29e4bae00a4bf470a0c1ca143e505b731543f95)]:
  - @ledgerhq/logs@6.13.0-next.0
  - @ledgerhq/coin-framework@5.2.0-next.1
  - @ledgerhq/devices@8.4.6-next.0
  - @ledgerhq/live-network@2.0.9-next.0

## 5.1.1-next.0

### Patch Changes

- Updated dependencies [[`4ddfe60`](https://github.com/LedgerHQ/ledger-live/commit/4ddfe6060ab8e4e5c0bb89da91e08a02d8ca50e6), [`f42f353`](https://github.com/LedgerHQ/ledger-live/commit/f42f353a593d0a1cd0a237648765080c85d0eea7), [`1a4e5e5`](https://github.com/LedgerHQ/ledger-live/commit/1a4e5e5913fe5e12d6127b36f3849e4c81e5e50e)]:
  - @ledgerhq/types-live@6.72.0-next.0
  - @ledgerhq/coin-framework@5.2.0-next.0

## 5.1.0

### Minor Changes

- [#9929](https://github.com/LedgerHQ/ledger-live/pull/9929) [`107f35a`](https://github.com/LedgerHQ/ledger-live/commit/107f35a0650412716b088a3503b86435e6d9cf47) Thanks [@semeano](https://github.com/semeano)! - Add aptos tokens functionality

- [#10283](https://github.com/LedgerHQ/ledger-live/pull/10283) [`0aa48e8`](https://github.com/LedgerHQ/ledger-live/commit/0aa48e8f52b7f91174f34c7db596ae8d783e7e30) Thanks [@jnicoulaud-ledger](https://github.com/jnicoulaud-ledger)! - fix(BACK-8848): [coin-modules][stellar] push down filtering predicate

  - `listOperations` uses N+1 RPC requests instead of just 1, because it fetches block metadata for each transaction
  - `minHeight` is only applied after doing all this, so when requesting operations on an up to date address we do the
    N+1 requests for the whole first page (200 txs), then throw out everything
  - => push down predicate to the inner level so that we do only 1 RPC request

### Patch Changes

- Updated dependencies [[`107f35a`](https://github.com/LedgerHQ/ledger-live/commit/107f35a0650412716b088a3503b86435e6d9cf47), [`6253e0e`](https://github.com/LedgerHQ/ledger-live/commit/6253e0e3efcd1a29543cda55c9a5269f97aa770f), [`9081c26`](https://github.com/LedgerHQ/ledger-live/commit/9081c2648490f977469a33762a3c67bb2c2a0be5), [`eff3c94`](https://github.com/LedgerHQ/ledger-live/commit/eff3c94c1eded61518097a4544c3f5b25db1e28a)]:
  - @ledgerhq/cryptoassets@13.18.0
  - @ledgerhq/errors@6.21.0
  - @ledgerhq/coin-framework@5.1.0
  - @ledgerhq/live-env@2.9.0
  - @ledgerhq/types-live@6.71.0
  - @ledgerhq/devices@8.4.5
  - @ledgerhq/live-network@2.0.8

## 5.1.0-next.0

### Minor Changes

- [#9929](https://github.com/LedgerHQ/ledger-live/pull/9929) [`107f35a`](https://github.com/LedgerHQ/ledger-live/commit/107f35a0650412716b088a3503b86435e6d9cf47) Thanks [@semeano](https://github.com/semeano)! - Add aptos tokens functionality

- [#10283](https://github.com/LedgerHQ/ledger-live/pull/10283) [`0aa48e8`](https://github.com/LedgerHQ/ledger-live/commit/0aa48e8f52b7f91174f34c7db596ae8d783e7e30) Thanks [@jnicoulaud-ledger](https://github.com/jnicoulaud-ledger)! - fix(BACK-8848): [coin-modules][stellar] push down filtering predicate

  - `listOperations` uses N+1 RPC requests instead of just 1, because it fetches block metadata for each transaction
  - `minHeight` is only applied after doing all this, so when requesting operations on an up to date address we do the
    N+1 requests for the whole first page (200 txs), then throw out everything
  - => push down predicate to the inner level so that we do only 1 RPC request

### Patch Changes

- Updated dependencies [[`107f35a`](https://github.com/LedgerHQ/ledger-live/commit/107f35a0650412716b088a3503b86435e6d9cf47), [`6253e0e`](https://github.com/LedgerHQ/ledger-live/commit/6253e0e3efcd1a29543cda55c9a5269f97aa770f), [`9081c26`](https://github.com/LedgerHQ/ledger-live/commit/9081c2648490f977469a33762a3c67bb2c2a0be5), [`eff3c94`](https://github.com/LedgerHQ/ledger-live/commit/eff3c94c1eded61518097a4544c3f5b25db1e28a)]:
  - @ledgerhq/cryptoassets@13.18.0-next.0
  - @ledgerhq/errors@6.21.0-next.0
  - @ledgerhq/coin-framework@5.1.0-next.0
  - @ledgerhq/live-env@2.9.0-next.0
  - @ledgerhq/types-live@6.71.0-next.0
  - @ledgerhq/devices@8.4.5-next.0
  - @ledgerhq/live-network@2.0.8-next.0

## 5.0.2

### Patch Changes

- Updated dependencies [[`f92f49a`](https://github.com/LedgerHQ/ledger-live/commit/f92f49a003767b83b94955e920cfac8cd565c162)]:
  - @ledgerhq/cryptoassets@13.17.0
  - @ledgerhq/coin-framework@5.0.2

## 5.0.2-next.0

### Patch Changes

- Updated dependencies [[`f92f49a`](https://github.com/LedgerHQ/ledger-live/commit/f92f49a003767b83b94955e920cfac8cd565c162)]:
  - @ledgerhq/cryptoassets@13.17.0-next.0
  - @ledgerhq/coin-framework@5.0.2-next.0

## 5.0.1

### Patch Changes

- Updated dependencies [[`a7ba19c`](https://github.com/LedgerHQ/ledger-live/commit/a7ba19cfa5a895572edfcf036a10d2af83efdf38), [`91fe526`](https://github.com/LedgerHQ/ledger-live/commit/91fe526be2710f0fb18b4d035a5d8de630b3d4b5)]:
  - @ledgerhq/types-live@6.70.0
  - @ledgerhq/coin-framework@5.0.1

## 5.0.1-next.0

### Patch Changes

- Updated dependencies [[`a7ba19c`](https://github.com/LedgerHQ/ledger-live/commit/a7ba19cfa5a895572edfcf036a10d2af83efdf38), [`91fe526`](https://github.com/LedgerHQ/ledger-live/commit/91fe526be2710f0fb18b4d035a5d8de630b3d4b5)]:
  - @ledgerhq/types-live@6.70.0-next.0
  - @ledgerhq/coin-framework@5.0.1-next.0

## 5.0.0

### Major Changes

- [#9993](https://github.com/LedgerHQ/ledger-live/pull/9993) [`b599ac4`](https://github.com/LedgerHQ/ledger-live/commit/b599ac4697688459aad15371f9efea58f331dc33) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Change alpaca estimate signature

### Minor Changes

- [#10066](https://github.com/LedgerHQ/ledger-live/pull/10066) [`6b29491`](https://github.com/LedgerHQ/ledger-live/commit/6b294915b022551a6eb23e1edf6d59e43b896310) Thanks [@Wozacosta](https://github.com/Wozacosta)! - fix: isolate stellar polyfill and revert it once used

### Patch Changes

- Updated dependencies [[`de92b67`](https://github.com/LedgerHQ/ledger-live/commit/de92b67ab9c8a553a817a245cecbfe292249d431), [`b599ac4`](https://github.com/LedgerHQ/ledger-live/commit/b599ac4697688459aad15371f9efea58f331dc33), [`1d72da9`](https://github.com/LedgerHQ/ledger-live/commit/1d72da911a56d5b25fb6464e60ac236927823ce4)]:
  - @ledgerhq/types-cryptoassets@7.23.0
  - @ledgerhq/cryptoassets@13.16.0
  - @ledgerhq/types-live@6.69.0
  - @ledgerhq/coin-framework@5.0.0

## 5.0.0-next.0

### Major Changes

- [#9993](https://github.com/LedgerHQ/ledger-live/pull/9993) [`b599ac4`](https://github.com/LedgerHQ/ledger-live/commit/b599ac4697688459aad15371f9efea58f331dc33) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Change alpaca estimate signature

### Minor Changes

- [#10066](https://github.com/LedgerHQ/ledger-live/pull/10066) [`6b29491`](https://github.com/LedgerHQ/ledger-live/commit/6b294915b022551a6eb23e1edf6d59e43b896310) Thanks [@Wozacosta](https://github.com/Wozacosta)! - fix: isolate stellar polyfill and revert it once used

### Patch Changes

- Updated dependencies [[`de92b67`](https://github.com/LedgerHQ/ledger-live/commit/de92b67ab9c8a553a817a245cecbfe292249d431), [`b599ac4`](https://github.com/LedgerHQ/ledger-live/commit/b599ac4697688459aad15371f9efea58f331dc33), [`1d72da9`](https://github.com/LedgerHQ/ledger-live/commit/1d72da911a56d5b25fb6464e60ac236927823ce4)]:
  - @ledgerhq/types-cryptoassets@7.23.0-next.0
  - @ledgerhq/cryptoassets@13.16.0-next.0
  - @ledgerhq/types-live@6.69.0-next.0
  - @ledgerhq/coin-framework@5.0.0-next.0

## 4.0.0

### Major Changes

- [#10009](https://github.com/LedgerHQ/ledger-live/pull/10009) [`cf2bf99`](https://github.com/LedgerHQ/ledger-live/commit/cf2bf99ba44e6eaf20e16cb320c0b22068340601) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - feat(coin-framework): replace operation index with operation id

### Minor Changes

- [#9974](https://github.com/LedgerHQ/ledger-live/pull/9974) [`ec758f8`](https://github.com/LedgerHQ/ledger-live/commit/ec758f83186efa79972389971dd365dfca51b886) Thanks [@jnicoulaud-ledger](https://github.com/jnicoulaud-ledger)! - stellar coin module API: make craft return signature payload instead of transaction envelope

### Patch Changes

- Updated dependencies [[`cf2bf99`](https://github.com/LedgerHQ/ledger-live/commit/cf2bf99ba44e6eaf20e16cb320c0b22068340601)]:
  - @ledgerhq/coin-framework@4.0.0

## 4.0.0-next.0

### Major Changes

- [#10009](https://github.com/LedgerHQ/ledger-live/pull/10009) [`cf2bf99`](https://github.com/LedgerHQ/ledger-live/commit/cf2bf99ba44e6eaf20e16cb320c0b22068340601) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - feat(coin-framework): replace operation index with operation id

### Minor Changes

- [#9974](https://github.com/LedgerHQ/ledger-live/pull/9974) [`ec758f8`](https://github.com/LedgerHQ/ledger-live/commit/ec758f83186efa79972389971dd365dfca51b886) Thanks [@jnicoulaud-ledger](https://github.com/jnicoulaud-ledger)! - stellar coin module API: make craft return signature payload instead of transaction envelope

### Patch Changes

- Updated dependencies [[`cf2bf99`](https://github.com/LedgerHQ/ledger-live/commit/cf2bf99ba44e6eaf20e16cb320c0b22068340601)]:
  - @ledgerhq/coin-framework@4.0.0-next.0

## 3.0.1

### Patch Changes

- Updated dependencies [[`9a208c3`](https://github.com/LedgerHQ/ledger-live/commit/9a208c39aec129b3aff2105991ffc18be05fd3f5), [`9009235`](https://github.com/LedgerHQ/ledger-live/commit/9009235cf52e83c0626acaec0959bfb3837404aa), [`95dbd60`](https://github.com/LedgerHQ/ledger-live/commit/95dbd60c06b02fe6fd50bc2ec0883096858d1f23)]:
  - @ledgerhq/types-live@6.68.0
  - @ledgerhq/coin-framework@3.0.1

## 3.0.1-next.0

### Patch Changes

- Updated dependencies [[`9a208c3`](https://github.com/LedgerHQ/ledger-live/commit/9a208c39aec129b3aff2105991ffc18be05fd3f5), [`9009235`](https://github.com/LedgerHQ/ledger-live/commit/9009235cf52e83c0626acaec0959bfb3837404aa), [`95dbd60`](https://github.com/LedgerHQ/ledger-live/commit/95dbd60c06b02fe6fd50bc2ec0883096858d1f23)]:
  - @ledgerhq/types-live@6.68.0-next.0
  - @ledgerhq/coin-framework@3.0.1-next.0

## 3.0.0

### Major Changes

- [#9835](https://github.com/LedgerHQ/ledger-live/pull/9835) [`8d36e9b`](https://github.com/LedgerHQ/ledger-live/commit/8d36e9b2474a4c600427f357adad04f99a89e13d) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - feat(coin-framework): return token balances in `getBalance`

### Minor Changes

- [#9755](https://github.com/LedgerHQ/ledger-live/pull/9755) [`c3c847b`](https://github.com/LedgerHQ/ledger-live/commit/c3c847bab4d01ec7cc1078344b519218806340ed) Thanks [@jnicoulaud-ledger](https://github.com/jnicoulaud-ledger)! - Fix stellar and tezos using static global variables, preventing multiple instances with different settings

- [#9760](https://github.com/LedgerHQ/ledger-live/pull/9760) [`8bad17b`](https://github.com/LedgerHQ/ledger-live/commit/8bad17b3718dfb151e2dfd3287516f38326435af) Thanks [@jnicoulaud-ledger](https://github.com/jnicoulaud-ledger)! - fix stellar coin-module ignoring `memo` craft parameter

### Patch Changes

- Updated dependencies [[`6f61972`](https://github.com/LedgerHQ/ledger-live/commit/6f619728e200270a674ffb13b10375765b55ae4b), [`3f8a531`](https://github.com/LedgerHQ/ledger-live/commit/3f8a53196dfb80d084056e0d896e09869c8ff949), [`8d36e9b`](https://github.com/LedgerHQ/ledger-live/commit/8d36e9b2474a4c600427f357adad04f99a89e13d), [`b580b04`](https://github.com/LedgerHQ/ledger-live/commit/b580b04e02392a706534c2fceba192ae3b6242ef), [`1e56618`](https://github.com/LedgerHQ/ledger-live/commit/1e56618a3c31e7980074072e0aae9422c145f4b3), [`4c6b682`](https://github.com/LedgerHQ/ledger-live/commit/4c6b682b9929334a7be13212a69f2c6a614f372c), [`bf3dec3`](https://github.com/LedgerHQ/ledger-live/commit/bf3dec3eb166f80e066f466e0e03291c9a141a81)]:
  - @ledgerhq/types-live@6.67.0
  - @ledgerhq/coin-framework@3.0.0
  - @ledgerhq/cryptoassets@13.15.0
  - @ledgerhq/types-cryptoassets@7.22.0

## 3.0.0-next.0

### Major Changes

- [#9835](https://github.com/LedgerHQ/ledger-live/pull/9835) [`8d36e9b`](https://github.com/LedgerHQ/ledger-live/commit/8d36e9b2474a4c600427f357adad04f99a89e13d) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - feat(coin-framework): return token balances in `getBalance`

### Minor Changes

- [#9755](https://github.com/LedgerHQ/ledger-live/pull/9755) [`c3c847b`](https://github.com/LedgerHQ/ledger-live/commit/c3c847bab4d01ec7cc1078344b519218806340ed) Thanks [@jnicoulaud-ledger](https://github.com/jnicoulaud-ledger)! - Fix stellar and tezos using static global variables, preventing multiple instances with different settings

- [#9760](https://github.com/LedgerHQ/ledger-live/pull/9760) [`8bad17b`](https://github.com/LedgerHQ/ledger-live/commit/8bad17b3718dfb151e2dfd3287516f38326435af) Thanks [@jnicoulaud-ledger](https://github.com/jnicoulaud-ledger)! - fix stellar coin-module ignoring `memo` craft parameter

### Patch Changes

- Updated dependencies [[`6f61972`](https://github.com/LedgerHQ/ledger-live/commit/6f619728e200270a674ffb13b10375765b55ae4b), [`3f8a531`](https://github.com/LedgerHQ/ledger-live/commit/3f8a53196dfb80d084056e0d896e09869c8ff949), [`8d36e9b`](https://github.com/LedgerHQ/ledger-live/commit/8d36e9b2474a4c600427f357adad04f99a89e13d), [`b580b04`](https://github.com/LedgerHQ/ledger-live/commit/b580b04e02392a706534c2fceba192ae3b6242ef), [`1e56618`](https://github.com/LedgerHQ/ledger-live/commit/1e56618a3c31e7980074072e0aae9422c145f4b3), [`4c6b682`](https://github.com/LedgerHQ/ledger-live/commit/4c6b682b9929334a7be13212a69f2c6a614f372c), [`bf3dec3`](https://github.com/LedgerHQ/ledger-live/commit/bf3dec3eb166f80e066f466e0e03291c9a141a81)]:
  - @ledgerhq/types-live@6.67.0-next.0
  - @ledgerhq/coin-framework@3.0.0-next.0
  - @ledgerhq/cryptoassets@13.15.0-next.0
  - @ledgerhq/types-cryptoassets@7.22.0-next.0

## 2.2.0

### Minor Changes

- [#9666](https://github.com/LedgerHQ/ledger-live/pull/9666) [`8ce7b0a`](https://github.com/LedgerHQ/ledger-live/commit/8ce7b0ab2d1d73ef071102f795e7c868c676b1f4) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - update the following modules for an optional fees parameter on craft transaction functions: coin-stellar, coin-tezos, coin-tron, coin-xrp, coin-framework

- [#9648](https://github.com/LedgerHQ/ledger-live/pull/9648) [`f1732a7`](https://github.com/LedgerHQ/ledger-live/commit/f1732a795e54f666b67e7686d59926037412caca) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Remove SubAccount as it is an alias to TokenAccount

- [#9758](https://github.com/LedgerHQ/ledger-live/pull/9758) [`3ef0a3e`](https://github.com/LedgerHQ/ledger-live/commit/3ef0a3e29eb2a1cb0b2c9b01cc5dd97af6d0a894) Thanks [@jprudent](https://github.com/jprudent)! - make stellar sync more reliable against 429

### Patch Changes

- Updated dependencies [[`44ae74c`](https://github.com/LedgerHQ/ledger-live/commit/44ae74c272ba803bed7c9f4fc3351e3ce8a15531), [`71bb6a9`](https://github.com/LedgerHQ/ledger-live/commit/71bb6a9adb4ac83172be5def5b25d2836380df1d), [`8ce7b0a`](https://github.com/LedgerHQ/ledger-live/commit/8ce7b0ab2d1d73ef071102f795e7c868c676b1f4), [`46a9620`](https://github.com/LedgerHQ/ledger-live/commit/46a9620b4ea6343efc28792d3b57bf84ee2a23e8), [`1e7d454`](https://github.com/LedgerHQ/ledger-live/commit/1e7d454d99f1f39880f39a120c59020725d26475), [`f1732a7`](https://github.com/LedgerHQ/ledger-live/commit/f1732a795e54f666b67e7686d59926037412caca), [`32d46cc`](https://github.com/LedgerHQ/ledger-live/commit/32d46cc77debe059ae0bcd848a21065dec7ee091), [`d694069`](https://github.com/LedgerHQ/ledger-live/commit/d6940698a49b7a0ed48f84d6e8184d80760cca4f)]:
  - @ledgerhq/coin-framework@2.6.0
  - @ledgerhq/types-live@6.66.0
  - @ledgerhq/live-env@2.8.0
  - @ledgerhq/cryptoassets@13.14.1
  - @ledgerhq/live-network@2.0.7

## 2.2.0-next.0

### Minor Changes

- [#9666](https://github.com/LedgerHQ/ledger-live/pull/9666) [`8ce7b0a`](https://github.com/LedgerHQ/ledger-live/commit/8ce7b0ab2d1d73ef071102f795e7c868c676b1f4) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - update the following modules for an optional fees parameter on craft transaction functions: coin-stellar, coin-tezos, coin-tron, coin-xrp, coin-framework

- [#9648](https://github.com/LedgerHQ/ledger-live/pull/9648) [`f1732a7`](https://github.com/LedgerHQ/ledger-live/commit/f1732a795e54f666b67e7686d59926037412caca) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Remove SubAccount as it is an alias to TokenAccount

- [#9758](https://github.com/LedgerHQ/ledger-live/pull/9758) [`3ef0a3e`](https://github.com/LedgerHQ/ledger-live/commit/3ef0a3e29eb2a1cb0b2c9b01cc5dd97af6d0a894) Thanks [@jprudent](https://github.com/jprudent)! - make stellar sync more reliable against 429

### Patch Changes

- Updated dependencies [[`44ae74c`](https://github.com/LedgerHQ/ledger-live/commit/44ae74c272ba803bed7c9f4fc3351e3ce8a15531), [`71bb6a9`](https://github.com/LedgerHQ/ledger-live/commit/71bb6a9adb4ac83172be5def5b25d2836380df1d), [`8ce7b0a`](https://github.com/LedgerHQ/ledger-live/commit/8ce7b0ab2d1d73ef071102f795e7c868c676b1f4), [`46a9620`](https://github.com/LedgerHQ/ledger-live/commit/46a9620b4ea6343efc28792d3b57bf84ee2a23e8), [`1e7d454`](https://github.com/LedgerHQ/ledger-live/commit/1e7d454d99f1f39880f39a120c59020725d26475), [`f1732a7`](https://github.com/LedgerHQ/ledger-live/commit/f1732a795e54f666b67e7686d59926037412caca), [`32d46cc`](https://github.com/LedgerHQ/ledger-live/commit/32d46cc77debe059ae0bcd848a21065dec7ee091), [`d694069`](https://github.com/LedgerHQ/ledger-live/commit/d6940698a49b7a0ed48f84d6e8184d80760cca4f)]:
  - @ledgerhq/coin-framework@2.6.0-next.0
  - @ledgerhq/types-live@6.66.0-next.0
  - @ledgerhq/live-env@2.8.0-next.0
  - @ledgerhq/cryptoassets@13.14.1-next.0
  - @ledgerhq/live-network@2.0.7-next.0

## 2.1.0

### Minor Changes

- [#9298](https://github.com/LedgerHQ/ledger-live/pull/9298) [`2785d49`](https://github.com/LedgerHQ/ledger-live/commit/2785d49ac320498f98ed39b4eccc48310ad35fe1) Thanks [@Canestin](https://github.com/Canestin)! - config coin-integration env for sonarqube

- [#9584](https://github.com/LedgerHQ/ledger-live/pull/9584) [`32f2a0c`](https://github.com/LedgerHQ/ledger-live/commit/32f2a0cf073e5c1a5d65cbe44e69660f8f510dd7) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - perf: set a limit on the number of operations retrieved during the initial synchronization of the Stellar account to improve sync performance.

- [#9708](https://github.com/LedgerHQ/ledger-live/pull/9708) [`ba8015d`](https://github.com/LedgerHQ/ledger-live/commit/ba8015dbc77b62fb340004b25f70962474ed11b5) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix (coin-stellar): operation identifiers are wrong

### Patch Changes

- Updated dependencies [[`2785d49`](https://github.com/LedgerHQ/ledger-live/commit/2785d49ac320498f98ed39b4eccc48310ad35fe1), [`2effe04`](https://github.com/LedgerHQ/ledger-live/commit/2effe04d9d4b3e407ed25da3b9f11324a82126d3), [`32f2a0c`](https://github.com/LedgerHQ/ledger-live/commit/32f2a0cf073e5c1a5d65cbe44e69660f8f510dd7), [`2407a6e`](https://github.com/LedgerHQ/ledger-live/commit/2407a6e1f3153c30c52d4bac4c9334fa95c351da), [`40e98c3`](https://github.com/LedgerHQ/ledger-live/commit/40e98c392bd9192570e46c2d62cf0779bdfe01ec), [`a656e47`](https://github.com/LedgerHQ/ledger-live/commit/a656e47c1dc3ac8b578debf9cf80eab370c7086f)]:
  - @ledgerhq/coin-framework@2.5.0
  - @ledgerhq/types-live@6.65.0
  - @ledgerhq/live-env@2.7.0
  - @ledgerhq/types-cryptoassets@7.21.0
  - @ledgerhq/cryptoassets@13.14.0
  - @ledgerhq/live-network@2.0.6

## 2.1.0-next.1

### Patch Changes

- [#9708](https://github.com/LedgerHQ/ledger-live/pull/9708) [`ba8015d`](https://github.com/LedgerHQ/ledger-live/commit/ba8015dbc77b62fb340004b25f70962474ed11b5) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix (coin-stellar): operation identifiers are wrong

## 2.1.0-next.0

### Minor Changes

- [#9298](https://github.com/LedgerHQ/ledger-live/pull/9298) [`2785d49`](https://github.com/LedgerHQ/ledger-live/commit/2785d49ac320498f98ed39b4eccc48310ad35fe1) Thanks [@Canestin](https://github.com/Canestin)! - config coin-integration env for sonarqube

- [#9584](https://github.com/LedgerHQ/ledger-live/pull/9584) [`32f2a0c`](https://github.com/LedgerHQ/ledger-live/commit/32f2a0cf073e5c1a5d65cbe44e69660f8f510dd7) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - perf: set a limit on the number of operations retrieved during the initial synchronization of the Stellar account to improve sync performance.

### Patch Changes

- Updated dependencies [[`2785d49`](https://github.com/LedgerHQ/ledger-live/commit/2785d49ac320498f98ed39b4eccc48310ad35fe1), [`2effe04`](https://github.com/LedgerHQ/ledger-live/commit/2effe04d9d4b3e407ed25da3b9f11324a82126d3), [`32f2a0c`](https://github.com/LedgerHQ/ledger-live/commit/32f2a0cf073e5c1a5d65cbe44e69660f8f510dd7), [`2407a6e`](https://github.com/LedgerHQ/ledger-live/commit/2407a6e1f3153c30c52d4bac4c9334fa95c351da), [`40e98c3`](https://github.com/LedgerHQ/ledger-live/commit/40e98c392bd9192570e46c2d62cf0779bdfe01ec), [`a656e47`](https://github.com/LedgerHQ/ledger-live/commit/a656e47c1dc3ac8b578debf9cf80eab370c7086f)]:
  - @ledgerhq/coin-framework@2.5.0-next.0
  - @ledgerhq/types-live@6.65.0-next.0
  - @ledgerhq/live-env@2.7.0-next.0
  - @ledgerhq/types-cryptoassets@7.21.0-next.0
  - @ledgerhq/cryptoassets@13.14.0-next.0
  - @ledgerhq/live-network@2.0.6-next.0

## 2.0.0

### Major Changes

- [#9275](https://github.com/LedgerHQ/ledger-live/pull/9275) [`b8fca38`](https://github.com/LedgerHQ/ledger-live/commit/b8fca386fa07cf393109a1928e92dfc790f9c286) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Update Alpaca api to include generic token type and update list operations

### Minor Changes

- [#9561](https://github.com/LedgerHQ/ledger-live/pull/9561) [`b379c83`](https://github.com/LedgerHQ/ledger-live/commit/b379c83cf6d8523a786b791d4d341d89bddf48cb) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Update integration tests

- [#9440](https://github.com/LedgerHQ/ledger-live/pull/9440) [`5f27549`](https://github.com/LedgerHQ/ledger-live/commit/5f275498e80060f98238a54e8ae3e2c94bfd7c91) Thanks [@qperrot](https://github.com/qperrot)! - feat estimateFees for alpacha

- [#9466](https://github.com/LedgerHQ/ledger-live/pull/9466) [`e2630cb`](https://github.com/LedgerHQ/ledger-live/commit/e2630cbec8d94ae037b2bf85cfa200a277ae739f) Thanks [@qperrot](https://github.com/qperrot)! - Tron craftTransaction alpaca implementation

### Patch Changes

- Updated dependencies [[`5f27549`](https://github.com/LedgerHQ/ledger-live/commit/5f275498e80060f98238a54e8ae3e2c94bfd7c91), [`fa8b10c`](https://github.com/LedgerHQ/ledger-live/commit/fa8b10cac5603eedd7c2309d2bb544a7d2d1a1a8), [`e2630cb`](https://github.com/LedgerHQ/ledger-live/commit/e2630cbec8d94ae037b2bf85cfa200a277ae739f), [`c15d7ea`](https://github.com/LedgerHQ/ledger-live/commit/c15d7ea48e41168726a90a17809175aee5bfa940), [`b8fca38`](https://github.com/LedgerHQ/ledger-live/commit/b8fca386fa07cf393109a1928e92dfc790f9c286)]:
  - @ledgerhq/coin-framework@2.4.0
  - @ledgerhq/types-live@6.64.0

## 2.0.0-next.0

### Major Changes

- [#9275](https://github.com/LedgerHQ/ledger-live/pull/9275) [`b8fca38`](https://github.com/LedgerHQ/ledger-live/commit/b8fca386fa07cf393109a1928e92dfc790f9c286) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Update Alpaca api to include generic token type and update list operations

### Minor Changes

- [#9561](https://github.com/LedgerHQ/ledger-live/pull/9561) [`b379c83`](https://github.com/LedgerHQ/ledger-live/commit/b379c83cf6d8523a786b791d4d341d89bddf48cb) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Update integration tests

- [#9440](https://github.com/LedgerHQ/ledger-live/pull/9440) [`5f27549`](https://github.com/LedgerHQ/ledger-live/commit/5f275498e80060f98238a54e8ae3e2c94bfd7c91) Thanks [@qperrot](https://github.com/qperrot)! - feat estimateFees for alpacha

- [#9466](https://github.com/LedgerHQ/ledger-live/pull/9466) [`e2630cb`](https://github.com/LedgerHQ/ledger-live/commit/e2630cbec8d94ae037b2bf85cfa200a277ae739f) Thanks [@qperrot](https://github.com/qperrot)! - Tron craftTransaction alpaca implementation

### Patch Changes

- Updated dependencies [[`5f27549`](https://github.com/LedgerHQ/ledger-live/commit/5f275498e80060f98238a54e8ae3e2c94bfd7c91), [`fa8b10c`](https://github.com/LedgerHQ/ledger-live/commit/fa8b10cac5603eedd7c2309d2bb544a7d2d1a1a8), [`e2630cb`](https://github.com/LedgerHQ/ledger-live/commit/e2630cbec8d94ae037b2bf85cfa200a277ae739f), [`c15d7ea`](https://github.com/LedgerHQ/ledger-live/commit/c15d7ea48e41168726a90a17809175aee5bfa940), [`b8fca38`](https://github.com/LedgerHQ/ledger-live/commit/b8fca386fa07cf393109a1928e92dfc790f9c286)]:
  - @ledgerhq/coin-framework@2.4.0-next.0
  - @ledgerhq/types-live@6.64.0-next.0

## 1.1.2

### Patch Changes

- Updated dependencies [[`5abde51`](https://github.com/LedgerHQ/ledger-live/commit/5abde5192d32f493ece2f99aec0e2de0c411f9e5), [`cc00249`](https://github.com/LedgerHQ/ledger-live/commit/cc002495f3e107aba283a3aa4abca90954de6d76)]:
  - @ledgerhq/types-live@6.63.0
  - @ledgerhq/coin-framework@2.3.0

## 1.1.2-next.0

### Patch Changes

- Updated dependencies [[`5abde51`](https://github.com/LedgerHQ/ledger-live/commit/5abde5192d32f493ece2f99aec0e2de0c411f9e5), [`cc00249`](https://github.com/LedgerHQ/ledger-live/commit/cc002495f3e107aba283a3aa4abca90954de6d76)]:
  - @ledgerhq/types-live@6.63.0-next.0
  - @ledgerhq/coin-framework@2.3.0-next.0

## 1.1.1

### Patch Changes

- Updated dependencies [[`8675df1`](https://github.com/LedgerHQ/ledger-live/commit/8675df12c24067877358f27e1e7c66f739ff0c78), [`0a59343`](https://github.com/LedgerHQ/ledger-live/commit/0a59343b591dab4e886c21cb47f7339231997331), [`ede6db0`](https://github.com/LedgerHQ/ledger-live/commit/ede6db0b94193cc9072aeb87e90f4098f0434af0), [`1461449`](https://github.com/LedgerHQ/ledger-live/commit/146144941c13e60182da8d79592f706d12a6f00e)]:
  - @ledgerhq/types-live@6.62.0
  - @ledgerhq/coin-framework@2.2.0
  - @ledgerhq/types-cryptoassets@7.20.0
  - @ledgerhq/cryptoassets@13.13.0
  - @ledgerhq/live-network@2.0.5

## 1.1.1-next.0

### Patch Changes

- Updated dependencies [[`8675df1`](https://github.com/LedgerHQ/ledger-live/commit/8675df12c24067877358f27e1e7c66f739ff0c78), [`0a59343`](https://github.com/LedgerHQ/ledger-live/commit/0a59343b591dab4e886c21cb47f7339231997331), [`ede6db0`](https://github.com/LedgerHQ/ledger-live/commit/ede6db0b94193cc9072aeb87e90f4098f0434af0), [`1461449`](https://github.com/LedgerHQ/ledger-live/commit/146144941c13e60182da8d79592f706d12a6f00e)]:
  - @ledgerhq/types-live@6.62.0-next.0
  - @ledgerhq/coin-framework@2.2.0-next.0
  - @ledgerhq/types-cryptoassets@7.20.0-next.0
  - @ledgerhq/cryptoassets@13.13.0-next.0
  - @ledgerhq/live-network@2.0.5-next.0

## 1.1.0

### Minor Changes

- [#9175](https://github.com/LedgerHQ/ledger-live/pull/9175) [`bcff898`](https://github.com/LedgerHQ/ledger-live/commit/bcff89879272a42c4a68b8395ead975febfa96d0) Thanks [@jprudent](https://github.com/jprudent)! - Stellar api get all operations from 0

### Patch Changes

- Updated dependencies [[`e4d9a5c`](https://github.com/LedgerHQ/ledger-live/commit/e4d9a5ce6c3e8f2b3829f8f5772e7ba712a4a50c)]:
  - @ledgerhq/types-live@6.61.0
  - @ledgerhq/coin-framework@2.1.1

## 1.1.0-next.0

### Minor Changes

- [#9175](https://github.com/LedgerHQ/ledger-live/pull/9175) [`bcff898`](https://github.com/LedgerHQ/ledger-live/commit/bcff89879272a42c4a68b8395ead975febfa96d0) Thanks [@jprudent](https://github.com/jprudent)! - Stellar api get all operations from 0

### Patch Changes

- Updated dependencies [[`e4d9a5c`](https://github.com/LedgerHQ/ledger-live/commit/e4d9a5ce6c3e8f2b3829f8f5772e7ba712a4a50c)]:
  - @ledgerhq/types-live@6.61.0-next.0
  - @ledgerhq/coin-framework@2.1.1-next.0

## 1.0.2

### Patch Changes

- Updated dependencies [[`da67b55`](https://github.com/LedgerHQ/ledger-live/commit/da67b5511b22553f7e3e089eca2e363a5e3cbffe), [`0a4413d`](https://github.com/LedgerHQ/ledger-live/commit/0a4413dd5cf50967c27b39bbd7dd9222e6322a60)]:
  - @ledgerhq/cryptoassets@13.12.0
  - @ledgerhq/coin-framework@2.1.0
  - @ledgerhq/types-live@6.60.0

## 1.0.2-next.0

### Patch Changes

- Updated dependencies [[`da67b55`](https://github.com/LedgerHQ/ledger-live/commit/da67b5511b22553f7e3e089eca2e363a5e3cbffe), [`0a4413d`](https://github.com/LedgerHQ/ledger-live/commit/0a4413dd5cf50967c27b39bbd7dd9222e6322a60)]:
  - @ledgerhq/cryptoassets@13.12.0-next.0
  - @ledgerhq/coin-framework@2.1.0-next.0
  - @ledgerhq/types-live@6.60.0-next.0

## 1.0.1

### Patch Changes

- Updated dependencies [[`58c1a9c`](https://github.com/LedgerHQ/ledger-live/commit/58c1a9c68b2ce2ebef9dbd7af00ae09efd7a29dc), [`ff40e9a`](https://github.com/LedgerHQ/ledger-live/commit/ff40e9a00d325e5b46cb069936ba2a5781c601b5)]:
  - @ledgerhq/coin-framework@2.0.0
  - @ledgerhq/cryptoassets@13.11.0

## 1.0.1-next.0

### Patch Changes

- Updated dependencies [[`58c1a9c`](https://github.com/LedgerHQ/ledger-live/commit/58c1a9c68b2ce2ebef9dbd7af00ae09efd7a29dc), [`ff40e9a`](https://github.com/LedgerHQ/ledger-live/commit/ff40e9a00d325e5b46cb069936ba2a5781c601b5)]:
  - @ledgerhq/coin-framework@2.0.0-next.0
  - @ledgerhq/cryptoassets@13.11.0-next.0

## 1.0.0

### Major Changes

- [#9092](https://github.com/LedgerHQ/ledger-live/pull/9092) [`5e18866`](https://github.com/LedgerHQ/ledger-live/commit/5e18866320b843632699659ee66f6c410c108c1e) Thanks [@jprudent](https://github.com/jprudent)! - Change coin-framework/api types for list operations

### Patch Changes

- Updated dependencies [[`5e18866`](https://github.com/LedgerHQ/ledger-live/commit/5e18866320b843632699659ee66f6c410c108c1e)]:
  - @ledgerhq/coin-framework@1.0.0

## 1.0.0-next.0

### Major Changes

- [#9092](https://github.com/LedgerHQ/ledger-live/pull/9092) [`5e18866`](https://github.com/LedgerHQ/ledger-live/commit/5e18866320b843632699659ee66f6c410c108c1e) Thanks [@jprudent](https://github.com/jprudent)! - Change coin-framework/api types for list operations

### Patch Changes

- Updated dependencies [[`5e18866`](https://github.com/LedgerHQ/ledger-live/commit/5e18866320b843632699659ee66f6c410c108c1e)]:
  - @ledgerhq/coin-framework@1.0.0-next.0

## 0.7.0

### Minor Changes

- [#8946](https://github.com/LedgerHQ/ledger-live/pull/8946) [`dcf4c42`](https://github.com/LedgerHQ/ledger-live/commit/dcf4c422be682128c2337a94e7b4bc656fdfe099) Thanks [@qperrot](https://github.com/qperrot)! - Fix device actions

### Patch Changes

- Updated dependencies [[`11c3b8b`](https://github.com/LedgerHQ/ledger-live/commit/11c3b8b27bc4fa996757c58ec7f5beac90c7a425), [`a231c50`](https://github.com/LedgerHQ/ledger-live/commit/a231c5084a24acb0e49efeb3c7ab1f5dbc6fd94b), [`41b153a`](https://github.com/LedgerHQ/ledger-live/commit/41b153adb98ce8de3336563694204d83905dba0e), [`d15a240`](https://github.com/LedgerHQ/ledger-live/commit/d15a2402bbd7f39353059c1cc2f74b9ac0876d3d), [`9534f17`](https://github.com/LedgerHQ/ledger-live/commit/9534f17247e1472b0fee8b993a83264f4e4ab363), [`1524353`](https://github.com/LedgerHQ/ledger-live/commit/152435384370b729183b7898308cbc1f8b61e451)]:
  - @ledgerhq/types-live@6.59.0
  - @ledgerhq/cryptoassets@13.10.0
  - @ledgerhq/coin-framework@0.25.0

## 0.7.0-next.0

### Minor Changes

- [#8946](https://github.com/LedgerHQ/ledger-live/pull/8946) [`dcf4c42`](https://github.com/LedgerHQ/ledger-live/commit/dcf4c422be682128c2337a94e7b4bc656fdfe099) Thanks [@qperrot](https://github.com/qperrot)! - Fix device actions

### Patch Changes

- Updated dependencies [[`11c3b8b`](https://github.com/LedgerHQ/ledger-live/commit/11c3b8b27bc4fa996757c58ec7f5beac90c7a425), [`a231c50`](https://github.com/LedgerHQ/ledger-live/commit/a231c5084a24acb0e49efeb3c7ab1f5dbc6fd94b), [`41b153a`](https://github.com/LedgerHQ/ledger-live/commit/41b153adb98ce8de3336563694204d83905dba0e), [`d15a240`](https://github.com/LedgerHQ/ledger-live/commit/d15a2402bbd7f39353059c1cc2f74b9ac0876d3d), [`9534f17`](https://github.com/LedgerHQ/ledger-live/commit/9534f17247e1472b0fee8b993a83264f4e4ab363), [`1524353`](https://github.com/LedgerHQ/ledger-live/commit/152435384370b729183b7898308cbc1f8b61e451)]:
  - @ledgerhq/types-live@6.59.0-next.0
  - @ledgerhq/cryptoassets@13.10.0-next.0
  - @ledgerhq/coin-framework@0.25.0-next.0

## 0.6.1

### Patch Changes

- Updated dependencies [[`670776e`](https://github.com/LedgerHQ/ledger-live/commit/670776e3a34859a18d6de1470de4195cf2094a81)]:
  - @ledgerhq/coin-framework@0.24.0

## 0.6.1-hotfix.0

### Patch Changes

- Updated dependencies [[`670776e`](https://github.com/LedgerHQ/ledger-live/commit/670776e3a34859a18d6de1470de4195cf2094a81)]:
  - @ledgerhq/coin-framework@0.23.1-hotfix.0

## 0.6.0

### Minor Changes

- [#8914](https://github.com/LedgerHQ/ledger-live/pull/8914) [`537141a`](https://github.com/LedgerHQ/ledger-live/commit/537141ab549b8dab57d3eb117e875faa67b54f4b) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Bot feature : Add filter for features

### Patch Changes

- Updated dependencies [[`f5196c5`](https://github.com/LedgerHQ/ledger-live/commit/f5196c52453b971a3327d09966edb62bb3d6a293), [`3a65633`](https://github.com/LedgerHQ/ledger-live/commit/3a6563309c8cacbd6e9a73e3044b1ff7c3966f87), [`537141a`](https://github.com/LedgerHQ/ledger-live/commit/537141ab549b8dab57d3eb117e875faa67b54f4b)]:
  - @ledgerhq/types-live@6.58.0
  - @ledgerhq/coin-framework@0.23.0

## 0.6.0-next.0

### Minor Changes

- [#8914](https://github.com/LedgerHQ/ledger-live/pull/8914) [`537141a`](https://github.com/LedgerHQ/ledger-live/commit/537141ab549b8dab57d3eb117e875faa67b54f4b) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Bot feature : Add filter for features

### Patch Changes

- Updated dependencies [[`f5196c5`](https://github.com/LedgerHQ/ledger-live/commit/f5196c52453b971a3327d09966edb62bb3d6a293), [`3a65633`](https://github.com/LedgerHQ/ledger-live/commit/3a6563309c8cacbd6e9a73e3044b1ff7c3966f87), [`537141a`](https://github.com/LedgerHQ/ledger-live/commit/537141ab549b8dab57d3eb117e875faa67b54f4b)]:
  - @ledgerhq/types-live@6.58.0-next.0
  - @ledgerhq/coin-framework@0.23.0-next.0

## 0.5.1

### Patch Changes

- Updated dependencies [[`5e01938`](https://github.com/LedgerHQ/ledger-live/commit/5e01938ece3dc1ccf7bea6c2805b6558c846db80), [`d98a964`](https://github.com/LedgerHQ/ledger-live/commit/d98a96476c3d44eab1575f6c7c58ec03b5daf890), [`c2d24cd`](https://github.com/LedgerHQ/ledger-live/commit/c2d24cd0299ea04e39306279b6f833696bc4f4fb)]:
  - @ledgerhq/coin-framework@0.22.0
  - @ledgerhq/types-cryptoassets@7.19.0
  - @ledgerhq/cryptoassets@13.9.0
  - @ledgerhq/types-live@6.57.0
  - @ledgerhq/live-network@2.0.4

## 0.5.1-next.0

### Patch Changes

- Updated dependencies [[`5e01938`](https://github.com/LedgerHQ/ledger-live/commit/5e01938ece3dc1ccf7bea6c2805b6558c846db80), [`d98a964`](https://github.com/LedgerHQ/ledger-live/commit/d98a96476c3d44eab1575f6c7c58ec03b5daf890), [`c2d24cd`](https://github.com/LedgerHQ/ledger-live/commit/c2d24cd0299ea04e39306279b6f833696bc4f4fb)]:
  - @ledgerhq/coin-framework@0.22.0-next.0
  - @ledgerhq/types-cryptoassets@7.19.0-next.0
  - @ledgerhq/cryptoassets@13.9.0-next.0
  - @ledgerhq/types-live@6.57.0-next.0
  - @ledgerhq/live-network@2.0.4-next.0

## 0.5.0

### Minor Changes

- [#8499](https://github.com/LedgerHQ/ledger-live/pull/8499) [`9820a8f`](https://github.com/LedgerHQ/ledger-live/commit/9820a8f8ec66cf114b23c3c3b92474d250b8bf01) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Exchange function is now in coin-modules

- [#8723](https://github.com/LedgerHQ/ledger-live/pull/8723) [`2ae713b`](https://github.com/LedgerHQ/ledger-live/commit/2ae713b20c1da18ef33beb730f41fb3ea2990e44) Thanks [@Salim-belkhir](https://github.com/Salim-belkhir)! - Add block informations to an operation (hash, time and height of a block)

- [#8673](https://github.com/LedgerHQ/ledger-live/pull/8673) [`9d8e34e`](https://github.com/LedgerHQ/ledger-live/commit/9d8e34eee5d77c6620298def250e85eda6b606b7) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Add pagination to listOperations for Alpaca

### Patch Changes

- Updated dependencies [[`9820a8f`](https://github.com/LedgerHQ/ledger-live/commit/9820a8f8ec66cf114b23c3c3b92474d250b8bf01), [`50b00c7`](https://github.com/LedgerHQ/ledger-live/commit/50b00c73e39af99c7d749bf57d5ef2f2e4942f2d), [`6cd5ecd`](https://github.com/LedgerHQ/ledger-live/commit/6cd5ecdedaed090d47a4df18db3c36f990de60e5), [`6d050fd`](https://github.com/LedgerHQ/ledger-live/commit/6d050fda707a63cff15cee797ea1167a0219aa32), [`1fa754d`](https://github.com/LedgerHQ/ledger-live/commit/1fa754deed730bb3dd8d05cb4e83e8c8d1b33ad1), [`be4233c`](https://github.com/LedgerHQ/ledger-live/commit/be4233ce713b90dc3ad335c330ca9d6509bf23e3), [`2ae713b`](https://github.com/LedgerHQ/ledger-live/commit/2ae713b20c1da18ef33beb730f41fb3ea2990e44), [`1f62290`](https://github.com/LedgerHQ/ledger-live/commit/1f622907dd108fced66a36be1d8d8738d41303c9), [`fe81150`](https://github.com/LedgerHQ/ledger-live/commit/fe811500ae626cab1995ccf8bd8cb8aa8e74bb40), [`9d8e34e`](https://github.com/LedgerHQ/ledger-live/commit/9d8e34eee5d77c6620298def250e85eda6b606b7)]:
  - @ledgerhq/types-live@6.56.0
  - @ledgerhq/coin-framework@0.21.0
  - @ledgerhq/cryptoassets@13.8.0
  - @ledgerhq/types-cryptoassets@7.18.0

## 0.5.0-next.1

### Patch Changes

- Updated dependencies [[`6d050fd`](https://github.com/LedgerHQ/ledger-live/commit/6d050fda707a63cff15cee797ea1167a0219aa32)]:
  - @ledgerhq/types-live@6.56.0-next.1
  - @ledgerhq/coin-framework@0.21.0-next.1

## 0.5.0-next.0

### Minor Changes

- [#8499](https://github.com/LedgerHQ/ledger-live/pull/8499) [`9820a8f`](https://github.com/LedgerHQ/ledger-live/commit/9820a8f8ec66cf114b23c3c3b92474d250b8bf01) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Exchange function is now in coin-modules

- [#8723](https://github.com/LedgerHQ/ledger-live/pull/8723) [`2ae713b`](https://github.com/LedgerHQ/ledger-live/commit/2ae713b20c1da18ef33beb730f41fb3ea2990e44) Thanks [@Salim-belkhir](https://github.com/Salim-belkhir)! - Add block informations to an operation (hash, time and height of a block)

- [#8673](https://github.com/LedgerHQ/ledger-live/pull/8673) [`9d8e34e`](https://github.com/LedgerHQ/ledger-live/commit/9d8e34eee5d77c6620298def250e85eda6b606b7) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Add pagination to listOperations for Alpaca

### Patch Changes

- Updated dependencies [[`9820a8f`](https://github.com/LedgerHQ/ledger-live/commit/9820a8f8ec66cf114b23c3c3b92474d250b8bf01), [`50b00c7`](https://github.com/LedgerHQ/ledger-live/commit/50b00c73e39af99c7d749bf57d5ef2f2e4942f2d), [`6cd5ecd`](https://github.com/LedgerHQ/ledger-live/commit/6cd5ecdedaed090d47a4df18db3c36f990de60e5), [`1fa754d`](https://github.com/LedgerHQ/ledger-live/commit/1fa754deed730bb3dd8d05cb4e83e8c8d1b33ad1), [`be4233c`](https://github.com/LedgerHQ/ledger-live/commit/be4233ce713b90dc3ad335c330ca9d6509bf23e3), [`2ae713b`](https://github.com/LedgerHQ/ledger-live/commit/2ae713b20c1da18ef33beb730f41fb3ea2990e44), [`1f62290`](https://github.com/LedgerHQ/ledger-live/commit/1f622907dd108fced66a36be1d8d8738d41303c9), [`fe81150`](https://github.com/LedgerHQ/ledger-live/commit/fe811500ae626cab1995ccf8bd8cb8aa8e74bb40), [`9d8e34e`](https://github.com/LedgerHQ/ledger-live/commit/9d8e34eee5d77c6620298def250e85eda6b606b7)]:
  - @ledgerhq/types-live@6.56.0-next.0
  - @ledgerhq/coin-framework@0.21.0-next.0
  - @ledgerhq/cryptoassets@13.8.0-next.0
  - @ledgerhq/types-cryptoassets@7.18.0-next.0

## 0.4.1

### Patch Changes

- Updated dependencies [[`40f1cd4`](https://github.com/LedgerHQ/ledger-live/commit/40f1cd4c22d17480dcf86c73e90a07866667b0ba), [`c45ee45`](https://github.com/LedgerHQ/ledger-live/commit/c45ee457a9f5500ae42f2a8fb7f0cfb7926f319b), [`322fd58`](https://github.com/LedgerHQ/ledger-live/commit/322fd58ffcde6d592eb27af1fd93f8c45d33205c), [`61aedb7`](https://github.com/LedgerHQ/ledger-live/commit/61aedb7bbd45e73d6bc2b53e55f562262d5c5fa7)]:
  - @ledgerhq/types-live@6.55.0
  - @ledgerhq/coin-framework@0.20.1

## 0.4.1-next.1

### Patch Changes

- Updated dependencies [[`61aedb7`](https://github.com/LedgerHQ/ledger-live/commit/61aedb7bbd45e73d6bc2b53e55f562262d5c5fa7)]:
  - @ledgerhq/types-live@6.55.0-next.1
  - @ledgerhq/coin-framework@0.20.1-next.1

## 0.4.1-next.0

### Patch Changes

- Updated dependencies [[`40f1cd4`](https://github.com/LedgerHQ/ledger-live/commit/40f1cd4c22d17480dcf86c73e90a07866667b0ba), [`c45ee45`](https://github.com/LedgerHQ/ledger-live/commit/c45ee457a9f5500ae42f2a8fb7f0cfb7926f319b), [`322fd58`](https://github.com/LedgerHQ/ledger-live/commit/322fd58ffcde6d592eb27af1fd93f8c45d33205c)]:
  - @ledgerhq/types-live@6.55.0-next.0
  - @ledgerhq/coin-framework@0.20.1-next.0

## 0.4.0

### Minor Changes

- [#8432](https://github.com/LedgerHQ/ledger-live/pull/8432) [`daa059a`](https://github.com/LedgerHQ/ledger-live/commit/daa059a90eb4381a0936c4a3703e8061db24072a) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Alpaca allows delegate and undelegate tx crafting

### Patch Changes

- Updated dependencies [[`0b51d37`](https://github.com/LedgerHQ/ledger-live/commit/0b51d37762c73a88d7204d1fcc3bb60a110568ed), [`724fa8b`](https://github.com/LedgerHQ/ledger-live/commit/724fa8b29cbda74a729c5756f91c5c9b745fdbdb), [`daa059a`](https://github.com/LedgerHQ/ledger-live/commit/daa059a90eb4381a0936c4a3703e8061db24072a)]:
  - @ledgerhq/coin-framework@0.20.0
  - @ledgerhq/types-live@6.54.0

## 0.4.0-next.0

### Minor Changes

- [#8432](https://github.com/LedgerHQ/ledger-live/pull/8432) [`daa059a`](https://github.com/LedgerHQ/ledger-live/commit/daa059a90eb4381a0936c4a3703e8061db24072a) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Alpaca allows delegate and undelegate tx crafting

### Patch Changes

- Updated dependencies [[`0b51d37`](https://github.com/LedgerHQ/ledger-live/commit/0b51d37762c73a88d7204d1fcc3bb60a110568ed), [`724fa8b`](https://github.com/LedgerHQ/ledger-live/commit/724fa8b29cbda74a729c5756f91c5c9b745fdbdb), [`daa059a`](https://github.com/LedgerHQ/ledger-live/commit/daa059a90eb4381a0936c4a3703e8061db24072a)]:
  - @ledgerhq/coin-framework@0.20.0-next.0
  - @ledgerhq/types-live@6.54.0-next.0

## 0.3.8

### Patch Changes

- Updated dependencies [[`5ce33a4`](https://github.com/LedgerHQ/ledger-live/commit/5ce33a417ecc87face54c1864aa49476c5f394b9), [`a52f6ae`](https://github.com/LedgerHQ/ledger-live/commit/a52f6ae3d49ea8daea42d9cdc24e9dd0d6d0f371), [`748cf14`](https://github.com/LedgerHQ/ledger-live/commit/748cf146b3e903172831e7e5ddbc29a3565c8932), [`61f8b03`](https://github.com/LedgerHQ/ledger-live/commit/61f8b033f710369171e277f5c0faede636207160)]:
  - @ledgerhq/types-live@6.53.1
  - @ledgerhq/coin-framework@0.19.1

## 0.3.8-next.0

### Patch Changes

- Updated dependencies [[`5ce33a4`](https://github.com/LedgerHQ/ledger-live/commit/5ce33a417ecc87face54c1864aa49476c5f394b9), [`a52f6ae`](https://github.com/LedgerHQ/ledger-live/commit/a52f6ae3d49ea8daea42d9cdc24e9dd0d6d0f371), [`748cf14`](https://github.com/LedgerHQ/ledger-live/commit/748cf146b3e903172831e7e5ddbc29a3565c8932), [`61f8b03`](https://github.com/LedgerHQ/ledger-live/commit/61f8b033f710369171e277f5c0faede636207160)]:
  - @ledgerhq/types-live@6.53.1-next.0
  - @ledgerhq/coin-framework@0.19.1-next.0

## 0.3.7

### Patch Changes

- [#8178](https://github.com/LedgerHQ/ledger-live/pull/8178) [`96094ea`](https://github.com/LedgerHQ/ledger-live/commit/96094ea41a9a7f82500e1cb91feea103cb5b4438) Thanks [@thesan](https://github.com/thesan)! - Add Stellar memo input on the recipient selection step

- Updated dependencies [[`2013b0f`](https://github.com/LedgerHQ/ledger-live/commit/2013b0f23d7f5bccff58dfd93fd45333194b8ae0), [`2013b0f`](https://github.com/LedgerHQ/ledger-live/commit/2013b0f23d7f5bccff58dfd93fd45333194b8ae0), [`63e5392`](https://github.com/LedgerHQ/ledger-live/commit/63e5392a108f1bec7cfc9c413db1550e7b5c9a25), [`87218b1`](https://github.com/LedgerHQ/ledger-live/commit/87218b17b86eaea9daa23c4c9cdf644c7ad2f65a), [`42e27f2`](https://github.com/LedgerHQ/ledger-live/commit/42e27f229ee2c1302258b6cc27d165c7b638cf3b), [`a40c525`](https://github.com/LedgerHQ/ledger-live/commit/a40c5256b80574aaaf17651d195832668b9796f5)]:
  - @ledgerhq/coin-framework@0.19.0
  - @ledgerhq/types-cryptoassets@7.17.0
  - @ledgerhq/cryptoassets@13.7.0
  - @ledgerhq/types-live@6.53.0
  - @ledgerhq/live-network@2.0.3

## 0.3.7-next.0

### Patch Changes

- [#8178](https://github.com/LedgerHQ/ledger-live/pull/8178) [`96094ea`](https://github.com/LedgerHQ/ledger-live/commit/96094ea41a9a7f82500e1cb91feea103cb5b4438) Thanks [@thesan](https://github.com/thesan)! - Add Stellar memo input on the recipient selection step

- Updated dependencies [[`2013b0f`](https://github.com/LedgerHQ/ledger-live/commit/2013b0f23d7f5bccff58dfd93fd45333194b8ae0), [`2013b0f`](https://github.com/LedgerHQ/ledger-live/commit/2013b0f23d7f5bccff58dfd93fd45333194b8ae0), [`35d6de2`](https://github.com/LedgerHQ/ledger-live/commit/35d6de2ace269f30fc39a3f022673a82d0c48193), [`63e5392`](https://github.com/LedgerHQ/ledger-live/commit/63e5392a108f1bec7cfc9c413db1550e7b5c9a25), [`87218b1`](https://github.com/LedgerHQ/ledger-live/commit/87218b17b86eaea9daa23c4c9cdf644c7ad2f65a), [`42e27f2`](https://github.com/LedgerHQ/ledger-live/commit/42e27f229ee2c1302258b6cc27d165c7b638cf3b), [`a40c525`](https://github.com/LedgerHQ/ledger-live/commit/a40c5256b80574aaaf17651d195832668b9796f5)]:
  - @ledgerhq/coin-framework@0.19.0-next.0
  - @ledgerhq/types-cryptoassets@7.17.0-next.0
  - @ledgerhq/cryptoassets@13.7.0-next.0
  - @ledgerhq/types-live@6.53.0-next.0
  - @ledgerhq/live-network@2.0.3-next.0

## 0.3.6

### Patch Changes

- Updated dependencies [[`65c3322`](https://github.com/LedgerHQ/ledger-live/commit/65c3322bf3871659f078148ab4b5c12b0fd53dc1)]:
  - @ledgerhq/types-live@6.52.4
  - @ledgerhq/coin-framework@0.18.6

## 0.3.6-next.0

### Patch Changes

- Updated dependencies [[`65c3322`](https://github.com/LedgerHQ/ledger-live/commit/65c3322bf3871659f078148ab4b5c12b0fd53dc1)]:
  - @ledgerhq/types-live@6.52.4-next.0
  - @ledgerhq/coin-framework@0.18.6-next.0

## 0.3.5

### Patch Changes

- [#8070](https://github.com/LedgerHQ/ledger-live/pull/8070) [`bfbbe66`](https://github.com/LedgerHQ/ledger-live/commit/bfbbe6611eb1f6e10272a8accce31d24779da533) Thanks [@Wozacosta](https://github.com/Wozacosta)! - test: update stellar and tron bridge expected values

- Updated dependencies [[`81cd773`](https://github.com/LedgerHQ/ledger-live/commit/81cd7735a3c94628b6d4825b736ef12a0b74d3a3), [`f275f48`](https://github.com/LedgerHQ/ledger-live/commit/f275f48a17eeba2bdd3119e478975c8d4c7183be), [`1a0fa20`](https://github.com/LedgerHQ/ledger-live/commit/1a0fa20da7509cdde1141002a2be8e9d8458b27d)]:
  - @ledgerhq/types-live@6.52.3
  - @ledgerhq/cryptoassets@13.6.2
  - @ledgerhq/coin-framework@0.18.5

## 0.3.5-next.0

### Patch Changes

- [#8070](https://github.com/LedgerHQ/ledger-live/pull/8070) [`bfbbe66`](https://github.com/LedgerHQ/ledger-live/commit/bfbbe6611eb1f6e10272a8accce31d24779da533) Thanks [@Wozacosta](https://github.com/Wozacosta)! - test: update stellar and tron bridge expected values

- Updated dependencies [[`81cd773`](https://github.com/LedgerHQ/ledger-live/commit/81cd7735a3c94628b6d4825b736ef12a0b74d3a3), [`f275f48`](https://github.com/LedgerHQ/ledger-live/commit/f275f48a17eeba2bdd3119e478975c8d4c7183be), [`1a0fa20`](https://github.com/LedgerHQ/ledger-live/commit/1a0fa20da7509cdde1141002a2be8e9d8458b27d)]:
  - @ledgerhq/types-live@6.52.3-next.0
  - @ledgerhq/cryptoassets@13.6.2-next.0
  - @ledgerhq/coin-framework@0.18.5-next.0

## 0.3.4

### Patch Changes

- Updated dependencies [[`80e333c`](https://github.com/LedgerHQ/ledger-live/commit/80e333c30afdc7d14f1b5fd3e92c9fb10372e2c1), [`d8c171a`](https://github.com/LedgerHQ/ledger-live/commit/d8c171a6ed32012733786bde29b5493b1106cf56)]:
  - @ledgerhq/types-live@6.52.2
  - @ledgerhq/coin-framework@0.18.4

## 0.3.4-hotfix.0

### Patch Changes

- Updated dependencies [[`80e333c`](https://github.com/LedgerHQ/ledger-live/commit/80e333c30afdc7d14f1b5fd3e92c9fb10372e2c1), [`d8c171a`](https://github.com/LedgerHQ/ledger-live/commit/d8c171a6ed32012733786bde29b5493b1106cf56)]:
  - @ledgerhq/types-live@6.52.2-hotfix.0
  - @ledgerhq/coin-framework@0.18.4-hotfix.0

## 0.3.3

### Patch Changes

- Updated dependencies [[`642c714`](https://github.com/LedgerHQ/ledger-live/commit/642c714d52eaaccb1b8ac3a2ee0391b641d19303), [`1b3a21d`](https://github.com/LedgerHQ/ledger-live/commit/1b3a21d5d8496c42f4dec4116fdcf59ad6f038cd), [`0a16ae4`](https://github.com/LedgerHQ/ledger-live/commit/0a16ae4cb58ad9f2e67c7f3494b0dc52cb7423a1), [`00cab1d`](https://github.com/LedgerHQ/ledger-live/commit/00cab1db1d67eb0cf35059eeeb9e2d8bd328f8f3)]:
  - @ledgerhq/types-live@6.52.1
  - @ledgerhq/coin-framework@0.18.3
  - @ledgerhq/cryptoassets@13.6.1
  - @ledgerhq/live-network@2.0.2

## 0.3.3-next.0

### Patch Changes

- Updated dependencies [[`642c714`](https://github.com/LedgerHQ/ledger-live/commit/642c714d52eaaccb1b8ac3a2ee0391b641d19303), [`1b3a21d`](https://github.com/LedgerHQ/ledger-live/commit/1b3a21d5d8496c42f4dec4116fdcf59ad6f038cd), [`0a16ae4`](https://github.com/LedgerHQ/ledger-live/commit/0a16ae4cb58ad9f2e67c7f3494b0dc52cb7423a1), [`00cab1d`](https://github.com/LedgerHQ/ledger-live/commit/00cab1db1d67eb0cf35059eeeb9e2d8bd328f8f3)]:
  - @ledgerhq/types-live@6.52.1-next.0
  - @ledgerhq/coin-framework@0.18.3-next.0
  - @ledgerhq/cryptoassets@13.6.1-next.0
  - @ledgerhq/live-network@2.0.2-next.0

## 0.3.2

### Patch Changes

- Updated dependencies [[`c83af75`](https://github.com/LedgerHQ/ledger-live/commit/c83af756fb388043c9f5a3862cae1231ec99a02c)]:
  - @ledgerhq/types-cryptoassets@7.16.0
  - @ledgerhq/cryptoassets@13.6.0
  - @ledgerhq/types-live@6.52.0
  - @ledgerhq/coin-framework@0.18.2

## 0.3.2-next.0

### Patch Changes

- Updated dependencies [[`c83af75`](https://github.com/LedgerHQ/ledger-live/commit/c83af756fb388043c9f5a3862cae1231ec99a02c)]:
  - @ledgerhq/types-cryptoassets@7.16.0-next.0
  - @ledgerhq/cryptoassets@13.6.0-next.0
  - @ledgerhq/types-live@6.52.0-next.0
  - @ledgerhq/coin-framework@0.18.2-next.0

## 0.3.1

### Patch Changes

- Updated dependencies [[`1605678`](https://github.com/LedgerHQ/ledger-live/commit/1605678a4c43ce85b19bd549b295f3c67ff1dcb9), [`1605678`](https://github.com/LedgerHQ/ledger-live/commit/1605678a4c43ce85b19bd549b295f3c67ff1dcb9), [`f805d14`](https://github.com/LedgerHQ/ledger-live/commit/f805d1470f927824233f94eaba065b00d7af18cf), [`461ddc5`](https://github.com/LedgerHQ/ledger-live/commit/461ddc56fbbe862789fe9a06db8a7e7a894e4bdd), [`672875f`](https://github.com/LedgerHQ/ledger-live/commit/672875feb9876edacf06aaea6c7bb47f4bb7d993), [`0a71c43`](https://github.com/LedgerHQ/ledger-live/commit/0a71c4344b7bb2c6640f3e5dda152ae815573330), [`7865dcb`](https://github.com/LedgerHQ/ledger-live/commit/7865dcb1891b89a0d9fe28efeea3a6284f3d87c5), [`1605678`](https://github.com/LedgerHQ/ledger-live/commit/1605678a4c43ce85b19bd549b295f3c67ff1dcb9)]:
  - @ledgerhq/cryptoassets@13.5.0
  - @ledgerhq/types-cryptoassets@7.15.2
  - @ledgerhq/live-network@2.0.1
  - @ledgerhq/types-live@6.51.1
  - @ledgerhq/errors@6.19.1
  - @ledgerhq/coin-framework@0.18.1
  - @ledgerhq/devices@8.4.4

## 0.3.1-next.1

### Patch Changes

- Updated dependencies [[`f805d14`](https://github.com/LedgerHQ/ledger-live/commit/f805d1470f927824233f94eaba065b00d7af18cf)]:
  - @ledgerhq/cryptoassets@13.5.0-next.1
  - @ledgerhq/live-network@2.0.1-next.1
  - @ledgerhq/coin-framework@0.18.1-next.1

## 0.3.1-next.0

### Patch Changes

- Updated dependencies [[`1605678`](https://github.com/LedgerHQ/ledger-live/commit/1605678a4c43ce85b19bd549b295f3c67ff1dcb9), [`1605678`](https://github.com/LedgerHQ/ledger-live/commit/1605678a4c43ce85b19bd549b295f3c67ff1dcb9), [`461ddc5`](https://github.com/LedgerHQ/ledger-live/commit/461ddc56fbbe862789fe9a06db8a7e7a894e4bdd), [`672875f`](https://github.com/LedgerHQ/ledger-live/commit/672875feb9876edacf06aaea6c7bb47f4bb7d993), [`0a71c43`](https://github.com/LedgerHQ/ledger-live/commit/0a71c4344b7bb2c6640f3e5dda152ae815573330), [`7865dcb`](https://github.com/LedgerHQ/ledger-live/commit/7865dcb1891b89a0d9fe28efeea3a6284f3d87c5), [`1605678`](https://github.com/LedgerHQ/ledger-live/commit/1605678a4c43ce85b19bd549b295f3c67ff1dcb9)]:
  - @ledgerhq/cryptoassets@13.5.0-next.0
  - @ledgerhq/types-cryptoassets@7.15.2-next.0
  - @ledgerhq/types-live@6.51.1-next.0
  - @ledgerhq/errors@6.19.1-next.0
  - @ledgerhq/coin-framework@0.18.1-next.0
  - @ledgerhq/devices@8.4.4-next.0
  - @ledgerhq/live-network@2.0.1-next.0

## 0.3.0

### Minor Changes

- [#7268](https://github.com/LedgerHQ/ledger-live/pull/7268) [`9c2f1b3`](https://github.com/LedgerHQ/ledger-live/commit/9c2f1b3b6e11a37a6b5ecf02d1e1ae7f0258e3ae) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Prepare CoinModule Stellar for Alpaca

### Patch Changes

- Updated dependencies [[`5c738cb`](https://github.com/LedgerHQ/ledger-live/commit/5c738cbd35ce5d0ca39ad3b86a61cc6234d1bdf7), [`9c55e81`](https://github.com/LedgerHQ/ledger-live/commit/9c55e81c84d3372f2a7fd36248f970376aec905a), [`187293c`](https://github.com/LedgerHQ/ledger-live/commit/187293c6cf6093f15f07d5effc1ded0843a9e6ab), [`187293c`](https://github.com/LedgerHQ/ledger-live/commit/187293c6cf6093f15f07d5effc1ded0843a9e6ab), [`cc291f5`](https://github.com/LedgerHQ/ledger-live/commit/cc291f5466d80a2b7e9394338ab588ecd3db4623), [`fb9466a`](https://github.com/LedgerHQ/ledger-live/commit/fb9466a4d7827fd4759c726ad3ae0b43dddcacd3), [`5758950`](https://github.com/LedgerHQ/ledger-live/commit/5758950841fbf8018dd848e745017484aec67333), [`0c80144`](https://github.com/LedgerHQ/ledger-live/commit/0c80144b8c16fc3729baa6503875d21af87b2752), [`ef82161`](https://github.com/LedgerHQ/ledger-live/commit/ef82161688fc49bf32cbc88f1837b15490e5d2b4), [`d13e7b9`](https://github.com/LedgerHQ/ledger-live/commit/d13e7b9f55d92098cacc9384fd7fab24033c040f), [`a3fd728`](https://github.com/LedgerHQ/ledger-live/commit/a3fd72861f2a7df676bd793062b3816fdb9d1f57), [`a0bb74b`](https://github.com/LedgerHQ/ledger-live/commit/a0bb74b8f3704ab9d5567c9d14c16cab9e0872f7), [`6815f6f`](https://github.com/LedgerHQ/ledger-live/commit/6815f6fccb9bca627a2e51ab954dc3f9b8f7c710), [`9c2f1b3`](https://github.com/LedgerHQ/ledger-live/commit/9c2f1b3b6e11a37a6b5ecf02d1e1ae7f0258e3ae), [`9a650da`](https://github.com/LedgerHQ/ledger-live/commit/9a650da9a147d6881f7082278d2bf764c37e1451)]:
  - @ledgerhq/errors@6.19.0
  - @ledgerhq/cryptoassets@13.4.0
  - @ledgerhq/live-network@2.0.0
  - @ledgerhq/coin-framework@0.18.0
  - @ledgerhq/types-live@6.51.0
  - @ledgerhq/types-cryptoassets@7.15.1
  - @ledgerhq/devices@8.4.3

## 0.3.0-next.0

### Minor Changes

- [#7268](https://github.com/LedgerHQ/ledger-live/pull/7268) [`9c2f1b3`](https://github.com/LedgerHQ/ledger-live/commit/9c2f1b3b6e11a37a6b5ecf02d1e1ae7f0258e3ae) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Prepare CoinModule Stellar for Alpaca

### Patch Changes

- Updated dependencies [[`5c738cb`](https://github.com/LedgerHQ/ledger-live/commit/5c738cbd35ce5d0ca39ad3b86a61cc6234d1bdf7), [`9c55e81`](https://github.com/LedgerHQ/ledger-live/commit/9c55e81c84d3372f2a7fd36248f970376aec905a), [`187293c`](https://github.com/LedgerHQ/ledger-live/commit/187293c6cf6093f15f07d5effc1ded0843a9e6ab), [`187293c`](https://github.com/LedgerHQ/ledger-live/commit/187293c6cf6093f15f07d5effc1ded0843a9e6ab), [`cc291f5`](https://github.com/LedgerHQ/ledger-live/commit/cc291f5466d80a2b7e9394338ab588ecd3db4623), [`fb9466a`](https://github.com/LedgerHQ/ledger-live/commit/fb9466a4d7827fd4759c726ad3ae0b43dddcacd3), [`5758950`](https://github.com/LedgerHQ/ledger-live/commit/5758950841fbf8018dd848e745017484aec67333), [`0c80144`](https://github.com/LedgerHQ/ledger-live/commit/0c80144b8c16fc3729baa6503875d21af87b2752), [`ef82161`](https://github.com/LedgerHQ/ledger-live/commit/ef82161688fc49bf32cbc88f1837b15490e5d2b4), [`d13e7b9`](https://github.com/LedgerHQ/ledger-live/commit/d13e7b9f55d92098cacc9384fd7fab24033c040f), [`a3fd728`](https://github.com/LedgerHQ/ledger-live/commit/a3fd72861f2a7df676bd793062b3816fdb9d1f57), [`a0bb74b`](https://github.com/LedgerHQ/ledger-live/commit/a0bb74b8f3704ab9d5567c9d14c16cab9e0872f7), [`6815f6f`](https://github.com/LedgerHQ/ledger-live/commit/6815f6fccb9bca627a2e51ab954dc3f9b8f7c710), [`9c2f1b3`](https://github.com/LedgerHQ/ledger-live/commit/9c2f1b3b6e11a37a6b5ecf02d1e1ae7f0258e3ae), [`9a650da`](https://github.com/LedgerHQ/ledger-live/commit/9a650da9a147d6881f7082278d2bf764c37e1451)]:
  - @ledgerhq/errors@6.19.0-next.0
  - @ledgerhq/cryptoassets@13.4.0-next.0
  - @ledgerhq/live-network@2.0.0-next.0
  - @ledgerhq/coin-framework@0.18.0-next.0
  - @ledgerhq/types-live@6.51.0-next.0
  - @ledgerhq/types-cryptoassets@7.15.1-next.0
  - @ledgerhq/devices@8.4.3-next.0

## 0.2.2

### Patch Changes

- Updated dependencies [[`afa03ae`](https://github.com/LedgerHQ/ledger-live/commit/afa03ae921ad1ca7df83dc0ba717c1cc27cb08cd), [`df9b4b7`](https://github.com/LedgerHQ/ledger-live/commit/df9b4b7b699503bb3aab1dc791b28e11ef0d51b9), [`db9c2d7`](https://github.com/LedgerHQ/ledger-live/commit/db9c2d78fb74df586c3ea1b9fb75ce3b014a0f4b), [`87d6bb2`](https://github.com/LedgerHQ/ledger-live/commit/87d6bb2501eac654dc10f45a0f591b28569b3d9f), [`4bd91de`](https://github.com/LedgerHQ/ledger-live/commit/4bd91de13442d12acce3ee83d5f2fd5f087570cf), [`53ff78c`](https://github.com/LedgerHQ/ledger-live/commit/53ff78c541d3ed69a3e74854d77f58a7e0d93978), [`8553b3e`](https://github.com/LedgerHQ/ledger-live/commit/8553b3eef10132396ec580a2d5f20b616f5b18a0), [`52daa39`](https://github.com/LedgerHQ/ledger-live/commit/52daa3998709ac3538afd447fe771faa3e3441be), [`60f1b5c`](https://github.com/LedgerHQ/ledger-live/commit/60f1b5c6cab125f5281468bb3e36f1abfae2d70c), [`60f1b5c`](https://github.com/LedgerHQ/ledger-live/commit/60f1b5c6cab125f5281468bb3e36f1abfae2d70c), [`50b6db6`](https://github.com/LedgerHQ/ledger-live/commit/50b6db67d374a23ba040043aa93e7fbc52685297)]:
  - @ledgerhq/coin-framework@0.17.0
  - @ledgerhq/types-live@6.50.0
  - @ledgerhq/cryptoassets@13.3.0
  - @ledgerhq/types-cryptoassets@7.15.0
  - @ledgerhq/live-env@2.2.0
  - @ledgerhq/live-network@1.4.0

## 0.2.2-next.1

### Patch Changes

- Updated dependencies [[`50b6db6`](https://github.com/LedgerHQ/ledger-live/commit/50b6db67d374a23ba040043aa93e7fbc52685297)]:
  - @ledgerhq/cryptoassets@13.3.0-next.1
  - @ledgerhq/coin-framework@0.17.0-next.1

## 0.2.2-next.0

### Patch Changes

- Updated dependencies [[`afa03ae`](https://github.com/LedgerHQ/ledger-live/commit/afa03ae921ad1ca7df83dc0ba717c1cc27cb08cd), [`df9b4b7`](https://github.com/LedgerHQ/ledger-live/commit/df9b4b7b699503bb3aab1dc791b28e11ef0d51b9), [`db9c2d7`](https://github.com/LedgerHQ/ledger-live/commit/db9c2d78fb74df586c3ea1b9fb75ce3b014a0f4b), [`87d6bb2`](https://github.com/LedgerHQ/ledger-live/commit/87d6bb2501eac654dc10f45a0f591b28569b3d9f), [`4bd91de`](https://github.com/LedgerHQ/ledger-live/commit/4bd91de13442d12acce3ee83d5f2fd5f087570cf), [`53ff78c`](https://github.com/LedgerHQ/ledger-live/commit/53ff78c541d3ed69a3e74854d77f58a7e0d93978), [`8553b3e`](https://github.com/LedgerHQ/ledger-live/commit/8553b3eef10132396ec580a2d5f20b616f5b18a0), [`52daa39`](https://github.com/LedgerHQ/ledger-live/commit/52daa3998709ac3538afd447fe771faa3e3441be), [`60f1b5c`](https://github.com/LedgerHQ/ledger-live/commit/60f1b5c6cab125f5281468bb3e36f1abfae2d70c), [`60f1b5c`](https://github.com/LedgerHQ/ledger-live/commit/60f1b5c6cab125f5281468bb3e36f1abfae2d70c)]:
  - @ledgerhq/coin-framework@0.17.0-next.0
  - @ledgerhq/types-live@6.50.0-next.0
  - @ledgerhq/cryptoassets@13.3.0-next.0
  - @ledgerhq/types-cryptoassets@7.15.0-next.0
  - @ledgerhq/live-env@2.2.0-next.0
  - @ledgerhq/live-network@1.4.0-next.0

## 0.2.1

### Patch Changes

- Updated dependencies [[`0b12c90`](https://github.com/LedgerHQ/ledger-live/commit/0b12c9040d6ee0a326b1d5effd261ddee2db452f)]:
  - @ledgerhq/devices@8.4.2
  - @ledgerhq/coin-framework@0.16.1
  - @ledgerhq/types-live@6.49.0

## 0.2.1-hotfix.0

### Patch Changes

- Updated dependencies [[`5d508e5`](https://github.com/LedgerHQ/ledger-live/commit/5d508e5cfd296e458746adf176dd292aa884f7ea)]:
  - @ledgerhq/devices@8.4.2-hotfix.0
  - @ledgerhq/coin-framework@0.16.1-hotfix.0

## 0.2.0

### Minor Changes

- [#7189](https://github.com/LedgerHQ/ledger-live/pull/7189) [`a0e3a56`](https://github.com/LedgerHQ/ledger-live/commit/a0e3a56244d92ca62e5c0b3899d0ca18c54e5df9) Thanks [@lvndry](https://github.com/lvndry)! - Creation of coin-stellar package

### Patch Changes

- Updated dependencies [[`ef2d53d`](https://github.com/LedgerHQ/ledger-live/commit/ef2d53d514f1f4e6f18fc79fa3423bd9b0208a04), [`b77ab8e`](https://github.com/LedgerHQ/ledger-live/commit/b77ab8e718ee8e10b74dc15370e8a19d2597d39e), [`52db252`](https://github.com/LedgerHQ/ledger-live/commit/52db252757870398cba5366d595b4d5fe8099b90), [`f819703`](https://github.com/LedgerHQ/ledger-live/commit/f81970347d139e63a547ab809be425d6f4d464a4), [`fe8a26b`](https://github.com/LedgerHQ/ledger-live/commit/fe8a26b04206df64e50220c3e9249c9a1bd057a6), [`1cbf767`](https://github.com/LedgerHQ/ledger-live/commit/1cbf767465d9e1f7bed5de79c5b5a0a5ca06e1b5), [`e78f3b7`](https://github.com/LedgerHQ/ledger-live/commit/e78f3b75296c7a063f6cddbeae44c36d236055f3), [`f979216`](https://github.com/LedgerHQ/ledger-live/commit/f9792160293fc8215c6d099f02e1b136c6655f9b), [`c1d2bb0`](https://github.com/LedgerHQ/ledger-live/commit/c1d2bb0866723c10d6e2899d40ddd9b9801189f4), [`c59adf2`](https://github.com/LedgerHQ/ledger-live/commit/c59adf2b0d49ea3c72b94fcb356eb72bcbfc4a6b)]:
  - @ledgerhq/types-cryptoassets@7.14.0
  - @ledgerhq/cryptoassets@13.2.0
  - @ledgerhq/types-live@6.49.0
  - @ledgerhq/coin-framework@0.16.0
  - @ledgerhq/errors@6.18.0
  - @ledgerhq/devices@8.4.1
  - @ledgerhq/live-network@1.3.1

## 0.2.0-next.0

### Minor Changes

- [#7189](https://github.com/LedgerHQ/ledger-live/pull/7189) [`a0e3a56`](https://github.com/LedgerHQ/ledger-live/commit/a0e3a56244d92ca62e5c0b3899d0ca18c54e5df9) Thanks [@lvndry](https://github.com/lvndry)! - Creation of coin-stellar package

### Patch Changes

- Updated dependencies [[`ef2d53d`](https://github.com/LedgerHQ/ledger-live/commit/ef2d53d514f1f4e6f18fc79fa3423bd9b0208a04), [`b77ab8e`](https://github.com/LedgerHQ/ledger-live/commit/b77ab8e718ee8e10b74dc15370e8a19d2597d39e), [`52db252`](https://github.com/LedgerHQ/ledger-live/commit/52db252757870398cba5366d595b4d5fe8099b90), [`f819703`](https://github.com/LedgerHQ/ledger-live/commit/f81970347d139e63a547ab809be425d6f4d464a4), [`fe8a26b`](https://github.com/LedgerHQ/ledger-live/commit/fe8a26b04206df64e50220c3e9249c9a1bd057a6), [`1cbf767`](https://github.com/LedgerHQ/ledger-live/commit/1cbf767465d9e1f7bed5de79c5b5a0a5ca06e1b5), [`e78f3b7`](https://github.com/LedgerHQ/ledger-live/commit/e78f3b75296c7a063f6cddbeae44c36d236055f3), [`f979216`](https://github.com/LedgerHQ/ledger-live/commit/f9792160293fc8215c6d099f02e1b136c6655f9b), [`c1d2bb0`](https://github.com/LedgerHQ/ledger-live/commit/c1d2bb0866723c10d6e2899d40ddd9b9801189f4), [`c59adf2`](https://github.com/LedgerHQ/ledger-live/commit/c59adf2b0d49ea3c72b94fcb356eb72bcbfc4a6b)]:
  - @ledgerhq/types-cryptoassets@7.14.0-next.0
  - @ledgerhq/cryptoassets@13.2.0-next.0
  - @ledgerhq/types-live@6.49.0-next.0
  - @ledgerhq/coin-framework@0.16.0-next.0
  - @ledgerhq/errors@6.18.0-next.0
  - @ledgerhq/devices@8.4.1-next.0
  - @ledgerhq/live-network@1.3.1-next.0

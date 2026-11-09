# @ledgerhq/ledger-wallet-framework

## 3.11.0-next.0

### Minor Changes

- [#24226](https://github.com/LedgerHQ/ledger-live/pull/24226) [`d701bc7`](https://github.com/LedgerHQ/ledger-live/commit/d701bc7564f9f479e0cc867ef76ec40b73f5c49c) Thanks [@qperrot](https://github.com/qperrot)! - fix(coin-bitcoin): do not spend the inputs of pending operations

  `prepareTransaction` and `estimateMaxSpendable` exclude the UTXOs spent by the account's own
  pending operations. When the explorer does not report mempool spends, a sync listed them as
  spendable again and the next send was rejected with `txn-mempool-conflict`. An RBF edit keeps
  the inputs of the operation it replaces.

  `addPendingOperation` keeps every pending UTXO operation (those with `extra.inputs`) instead of
  only the latest one, and removes one only when the new operation spends one of its inputs (an RBF
  replacement). Operations of other coins are unchanged.

  `isOldestBitcoinPendingOperation` takes the operation instead of its date: a pending operation
  can be sped up unless it spends an output of another unconfirmed operation of the account. Pending
  sends of unrelated UTXOs no longer block each other's speed-up.

- [#24522](https://github.com/LedgerHQ/ledger-live/pull/24522) [`e67063f`](https://github.com/LedgerHQ/ledger-live/commit/e67063fc1fdb96c419c42a452433870b588f201e) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Import bignumber.js through its default export, the form bignumber.js 11 types support

- [#24424](https://github.com/LedgerHQ/ledger-live/pull/24424) [`d3f59ae`](https://github.com/LedgerHQ/ledger-live/commit/d3f59ae3fc6b9d9240bd81df9f93c1223cb64ddb) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - Sync XRP token accounts for the enabled token standards, with each IOU's lock, trust limit and rippling state, and opt in to an IOU

### Patch Changes

- Updated dependencies [[`b77803f`](https://github.com/LedgerHQ/ledger-live/commit/b77803ffbca90848d55bca56b9d8cd3547464620), [`d36ed0a`](https://github.com/LedgerHQ/ledger-live/commit/d36ed0a5b624f1842e2ad3a857d502621dfb5fb9), [`e051c84`](https://github.com/LedgerHQ/ledger-live/commit/e051c84a8486b78327ea49500c38b6e2138bbc21), [`3a0d8aa`](https://github.com/LedgerHQ/ledger-live/commit/3a0d8aa1d4904fa0ccc53528ec092bc32a63dcd4), [`96fac1e`](https://github.com/LedgerHQ/ledger-live/commit/96fac1eb64856beb33cc68594e98c25e8b308898), [`0d83181`](https://github.com/LedgerHQ/ledger-live/commit/0d83181e9a96f55811f2ce5532527739bdb7e62a), [`e186896`](https://github.com/LedgerHQ/ledger-live/commit/e186896213df32feb1e6a80e38f45cf189655866), [`e7b21f8`](https://github.com/LedgerHQ/ledger-live/commit/e7b21f816021dbbe7314ff51bf32cc4d87291b98), [`e67063f`](https://github.com/LedgerHQ/ledger-live/commit/e67063fc1fdb96c419c42a452433870b588f201e)]:
  - @ledgerhq/types-live@6.131.0-next.0

## 3.10.0

### Minor Changes

- [#24072](https://github.com/LedgerHQ/ledger-live/pull/24072) [`8854aff`](https://github.com/LedgerHQ/ledger-live/commit/8854aff9cace72ad17c6d9fd7ee98a4dcd65ecb1) Thanks [@vpenskyi-ledger](https://github.com/vpenskyi-ledger)! - Find Hyperliquid accounts sitting after up to 10 empty indexes when scanning

- [#24003](https://github.com/LedgerHQ/ledger-live/pull/24003) [`c50f3fa`](https://github.com/LedgerHQ/ledger-live/commit/c50f3fac1c822d61332dbb512b21cdda6bb57210) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Let a family opt into `validatesRefusedEstimation`, so a refused fee estimation reaches `getTransactionStatus` as a field error instead of rejecting `prepareTransaction`. Tezos opts in and bumps `@ledgerhq/coin-tezos` to 13.1.0, which throws on refused estimations.

### Patch Changes

- Updated dependencies [[`9907890`](https://github.com/LedgerHQ/ledger-live/commit/9907890790bf8b804d7cc454a067508df0969137), [`77a85a3`](https://github.com/LedgerHQ/ledger-live/commit/77a85a30abe7b42e5f5b4e0478bec14fa39033cf)]:
  - @ledgerhq/types-live@6.130.0

## 3.10.0-next.0

### Minor Changes

- [#24072](https://github.com/LedgerHQ/ledger-live/pull/24072) [`8854aff`](https://github.com/LedgerHQ/ledger-live/commit/8854aff9cace72ad17c6d9fd7ee98a4dcd65ecb1) Thanks [@vpenskyi-ledger](https://github.com/vpenskyi-ledger)! - Find Hyperliquid accounts sitting after up to 10 empty indexes when scanning

- [#24003](https://github.com/LedgerHQ/ledger-live/pull/24003) [`c50f3fa`](https://github.com/LedgerHQ/ledger-live/commit/c50f3fac1c822d61332dbb512b21cdda6bb57210) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Let a family opt into `validatesRefusedEstimation`, so a refused fee estimation reaches `getTransactionStatus` as a field error instead of rejecting `prepareTransaction`. Tezos opts in and bumps `@ledgerhq/coin-tezos` to 13.1.0, which throws on refused estimations.

### Patch Changes

- Updated dependencies [[`9907890`](https://github.com/LedgerHQ/ledger-live/commit/9907890790bf8b804d7cc454a067508df0969137), [`77a85a3`](https://github.com/LedgerHQ/ledger-live/commit/77a85a30abe7b42e5f5b4e0478bec14fa39033cf)]:
  - @ledgerhq/types-live@6.130.0-next.0

## 3.9.0

### Minor Changes

- [#23171](https://github.com/LedgerHQ/ledger-live/pull/23171) [`8c888c4`](https://github.com/LedgerHQ/ledger-live/commit/8c888c4cfd699dc24b8e0522818feaac98698eb1) Thanks [@KVNLS](https://github.com/KVNLS)! - chore: replace node `querystring` with `URLSearchParams` / `encodeURIComponent` and drop the `querystring-es3` renderer fallback

- [#23846](https://github.com/LedgerHQ/ledger-live/pull/23846) [`29ae68a`](https://github.com/LedgerHQ/ledger-live/commit/29ae68a1ad2429a224106f355f35d1190c0f7359) Thanks [@gre-ledger](https://github.com/gre-ledger)! - fix: ship lib and lib-es in the npm tarballs again, which pnpm 11 dropped

- [#23613](https://github.com/LedgerHQ/ledger-live/pull/23613) [`9c7d59d`](https://github.com/LedgerHQ/ledger-live/commit/9c7d59d0ffcc72ba746bc20e9ff744db9730503b) Thanks [@jnicoulaud-ledger](https://github.com/jnicoulaud-ledger)! - A Solana account no longer resyncs its whole history when the CAL token list changes. The sync resumes from its watermark unless the account holds a token that just became listed (or is no longer blacklisted), the only case where the stored history misses operations a sub-account needs.

  A family opts in with the new `BridgeApi.balanceListsEveryToken` flag, which declares that `getBalance` lists every token the address holds without scanning its history. Solana is the only family that sets it.

### Patch Changes

- Updated dependencies [[`29ae68a`](https://github.com/LedgerHQ/ledger-live/commit/29ae68a1ad2429a224106f355f35d1190c0f7359)]:
  - @ledgerhq/types-live@6.129.0

## 3.9.0-next.0

### Minor Changes

- [#23171](https://github.com/LedgerHQ/ledger-live/pull/23171) [`8c888c4`](https://github.com/LedgerHQ/ledger-live/commit/8c888c4cfd699dc24b8e0522818feaac98698eb1) Thanks [@KVNLS](https://github.com/KVNLS)! - chore: replace node `querystring` with `URLSearchParams` / `encodeURIComponent` and drop the `querystring-es3` renderer fallback

- [#23846](https://github.com/LedgerHQ/ledger-live/pull/23846) [`29ae68a`](https://github.com/LedgerHQ/ledger-live/commit/29ae68a1ad2429a224106f355f35d1190c0f7359) Thanks [@gre-ledger](https://github.com/gre-ledger)! - fix: ship lib and lib-es in the npm tarballs again, which pnpm 11 dropped

- [#23613](https://github.com/LedgerHQ/ledger-live/pull/23613) [`9c7d59d`](https://github.com/LedgerHQ/ledger-live/commit/9c7d59d0ffcc72ba746bc20e9ff744db9730503b) Thanks [@jnicoulaud-ledger](https://github.com/jnicoulaud-ledger)! - A Solana account no longer resyncs its whole history when the CAL token list changes. The sync resumes from its watermark unless the account holds a token that just became listed (or is no longer blacklisted), the only case where the stored history misses operations a sub-account needs.

  A family opts in with the new `BridgeApi.balanceListsEveryToken` flag, which declares that `getBalance` lists every token the address holds without scanning its history. Solana is the only family that sets it.

### Patch Changes

- Updated dependencies [[`29ae68a`](https://github.com/LedgerHQ/ledger-live/commit/29ae68a1ad2429a224106f355f35d1190c0f7359)]:
  - @ledgerhq/types-live@6.129.0-next.0

## 3.8.0

### Minor Changes

- [#23249](https://github.com/LedgerHQ/ledger-live/pull/23249) [`80f99a8`](https://github.com/LedgerHQ/ledger-live/commit/80f99a819b13d3ec2bd39d896de46e0a433b9954) Thanks [@dilaouid](https://github.com/dilaouid)! - Add generic account sequence synchronization and persist it on the account

- [#21914](https://github.com/LedgerHQ/ledger-live/pull/21914) [`e66d21e`](https://github.com/LedgerHQ/ledger-live/commit/e66d21ea7ccb706d718703b69d2133ede3294c1a) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Index the per-hash and per-token operation lookups used when assembling an account, replacing repeated full scans.

- [#23295](https://github.com/LedgerHQ/ledger-live/pull/23295) [`98c994b`](https://github.com/LedgerHQ/ledger-live/commit/98c994bc1f46a03366096531afac2471f07f397b) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(solana): refresh the blockhash after the device review to avoid "Blockhash not found"

- [#23190](https://github.com/LedgerHQ/ledger-live/pull/23190) [`696357f`](https://github.com/LedgerHQ/ledger-live/commit/696357f754751853758d67c88bf34df9302b9b97) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(coin-solana): partition the native balance between the system account and the stake accounts, summed by the generic adapter through `partitionsNativeBalance` and the family's `getHeldNativeAmount`, so delegated SOL is counted once

### Patch Changes

- Updated dependencies [[`80f99a8`](https://github.com/LedgerHQ/ledger-live/commit/80f99a819b13d3ec2bd39d896de46e0a433b9954), [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574), [`75498cf`](https://github.com/LedgerHQ/ledger-live/commit/75498cf55065bccf17d09b780866ae031c01701a)]:
  - @ledgerhq/types-live@6.128.0

## 3.8.0-next.0

### Minor Changes

- [#23249](https://github.com/LedgerHQ/ledger-live/pull/23249) [`80f99a8`](https://github.com/LedgerHQ/ledger-live/commit/80f99a819b13d3ec2bd39d896de46e0a433b9954) Thanks [@dilaouid](https://github.com/dilaouid)! - Add generic account sequence synchronization and persist it on the account

- [#21914](https://github.com/LedgerHQ/ledger-live/pull/21914) [`e66d21e`](https://github.com/LedgerHQ/ledger-live/commit/e66d21ea7ccb706d718703b69d2133ede3294c1a) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Index the per-hash and per-token operation lookups used when assembling an account, replacing repeated full scans.

- [#23295](https://github.com/LedgerHQ/ledger-live/pull/23295) [`98c994b`](https://github.com/LedgerHQ/ledger-live/commit/98c994bc1f46a03366096531afac2471f07f397b) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(solana): refresh the blockhash after the device review to avoid "Blockhash not found"

- [#23190](https://github.com/LedgerHQ/ledger-live/pull/23190) [`696357f`](https://github.com/LedgerHQ/ledger-live/commit/696357f754751853758d67c88bf34df9302b9b97) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(coin-solana): partition the native balance between the system account and the stake accounts, summed by the generic adapter through `partitionsNativeBalance` and the family's `getHeldNativeAmount`, so delegated SOL is counted once

### Patch Changes

- Updated dependencies [[`80f99a8`](https://github.com/LedgerHQ/ledger-live/commit/80f99a819b13d3ec2bd39d896de46e0a433b9954), [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574), [`75498cf`](https://github.com/LedgerHQ/ledger-live/commit/75498cf55065bccf17d09b780866ae031c01701a)]:
  - @ledgerhq/types-live@6.128.0-next.0

## 3.7.0

### Minor Changes

- [#22973](https://github.com/LedgerHQ/ledger-live/pull/22973) [`20484ff`](https://github.com/LedgerHQ/ledger-live/commit/20484ff8d7cc0aab2e4b8448c7e8ce9ebf6840fe) Thanks [@semeano](https://github.com/semeano)! - feat(stacks): keep public-key account ids and persist staking positions on the generic bridge

  - New `BridgeApi.accountIdFromPublicKey` opt-in: a synced account keeps the id it was stored under, and a scanned one is keyed on the device public key, so a family whose legacy bridge keyed ids on the public key is not re-keyed by the generic bridge. Stacks opts in.
  - Stacks registers generic-bridge hooks for its estimation recipient and for persisting `stakingPositions`, which gates the Stake action.

- [#23179](https://github.com/LedgerHQ/ledger-live/pull/23179) [`f047501`](https://github.com/LedgerHQ/ledger-live/commit/f047501381efde857b48c1314d2de637fdce8ade) Thanks [@amaslakov](https://github.com/amaslakov)! - Sum Tezos native balance partitions in the generic adapter, behind a new opt-in `partitionsNativeBalance` bridge flag

- [#22620](https://github.com/LedgerHQ/ledger-live/pull/22620) [`3347eb8`](https://github.com/LedgerHQ/ledger-live/commit/3347eb88f282e2286b43493dadb0a9dd3d1f81d5) Thanks [@henri-ly](https://github.com/henri-ly)! - Keep WalletConnect `cosmos_signAmino` working on the generic bridge: `BridgeApi.signRawOperation` lets a family replace the generic raw signing (craft, sign, combine) with its own. Cosmos registers its verbatim, detached-signature implementation there, the one its legacy bridge already uses. `account.getPublicKey` now returns the Cosmos account public key instead of the address legacy accounts keep in `xpub`.

- [#23194](https://github.com/LedgerHQ/ledger-live/pull/23194) [`90e805d`](https://github.com/LedgerHQ/ledger-live/commit/90e805d9c1b0ef536d1e53489c73b88056731993) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Remove 20 dead EVM chains (akroma, atheios, callisto, dexon, ellaism, ether1, ethergem, ethersocial, expanse, gochain, hpb, mix, musicoin, pirl, poa, reosc, thundercore, tomo, ubiq, wanchain)

- [#22564](https://github.com/LedgerHQ/ledger-live/pull/22564) [`9c9cae5`](https://github.com/LedgerHQ/ledger-live/commit/9c9cae5ab492b74d52b13e0a5b0673bd681f8d9d) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat(hedera): add the family layer for the generic adapter

- [#23297](https://github.com/LedgerHQ/ledger-live/pull/23297) [`2989e37`](https://github.com/LedgerHQ/ledger-live/commit/2989e37b80b8bfcaae549cc02aa6de189a69dfef) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(solana): refresh the blockhash after the device review to avoid "Blockhash not found"

- [#22750](https://github.com/LedgerHQ/ledger-live/pull/22750) [`6f2ecf8`](https://github.com/LedgerHQ/ledger-live/commit/6f2ecf89dd1d978038f573738d6e85fe1805b5d9) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(currency): drop `CryptoCurrency#ethereumLikeInfo`

  The EVM `chainId` is now read from the coin config. The unused `ethereumLikeInfo` field (and `EthereumLikeInfoSchema`) is removed from the currency types and registry.

- [#22560](https://github.com/LedgerHQ/ledger-live/pull/22560) [`18166fb`](https://github.com/LedgerHQ/ledger-live/commit/18166fbe8719d50c911aa0ab349e68c414f8fc62) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat(framework): optional `addressLookup` bridge hook for network-assigned addresses + wire Hedera's lookup and local coin module API

- [#21839](https://github.com/LedgerHQ/ledger-live/pull/21839) [`6d744e0`](https://github.com/LedgerHQ/ledger-live/commit/6d744e0d30b4480282d35c359d096f3f6d6602af) Thanks [@YazhuEth](https://github.com/YazhuEth)! - `estimateFees` now returns the recipient token account, wallet address and input type of an SPL transfer alongside its fee, so the device screen names the destination; a recipient token account holding another token throws `SolanaTokenAccountHoldsAnotherToken`.

  `makeEmptyTokenAccount` now builds its id with `encodeTokenAccountId`, like the fourteen families that already do: the wallet-API placeholder previously used the contract address, so it matched no real sub-account id.

  Solana runs on the generic coin framework. The send and staking screens move onto the generic transaction shape, which names what it does — a mode, a memo, a stake account seed — instead of the nested command model the legacy bridge carried, and the apps now read it through one family module rather than reaching into the transaction themselves.

  The behaviours the legacy bridge produced are restored on the generic path: an incoming SPL transfer produces an operation, a stake withdrawal empties the account rather than signing a stale amount, opening a token account is charged its rent, sending the maximum to a new stake account leaves enough to unstake it later, the device confirmation screen lists every row the device itself shows, and a token account's frozen state and Token-2022 extensions are back on screen.

  A live app can again submit the four token and stake commands the wallet API defines, and a raw signature it gets back is hex, as the field it arrives in says. The device signer is selected through the family's own factory, so the `ldmkSolanaSigner` flag and the transaction-check option it carries keep deciding, as they did before. The mock bridge is rewritten on the coin module, so a mocked signature still yields a transaction the wallet API can deserialize.

- [#22989](https://github.com/LedgerHQ/ledger-live/pull/22989) [`8312d68`](https://github.com/LedgerHQ/ledger-live/commit/8312d6818aa5fa37f523352f81f51a61dd502bf2) Thanks [@gre-ledger](https://github.com/gre-ledger)! - chore: take `uuid` from the pnpm catalog (11.1.0)

  `uuid` was spread over 8.3.2, 9.0.1 and 11.1.0. Every package now uses the catalog entry. `@types/uuid` is dropped: 11 ships its own types. The repo only imports `v4`, `v5` and `parse` (`parse` in a coin-solana test fixture), which behave the same across these majors. 11 types `v4` with overloads, so passing it directly as a callback (`useState(uuid)`) no longer typechecks and is now wrapped (`useState(() => uuid())`).

- [#22906](https://github.com/LedgerHQ/ledger-live/pull/22906) [`c5c2815`](https://github.com/LedgerHQ/ledger-live/commit/c5c2815ec53dbf88804e558952f1451f13c37bb4) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: hedera legacy bridge adapter with fixes and optimizations

### Patch Changes

- Updated dependencies [[`bf29f88`](https://github.com/LedgerHQ/ledger-live/commit/bf29f888316e5d8d9049b763a8c77ce9850f07df), [`90e805d`](https://github.com/LedgerHQ/ledger-live/commit/90e805d9c1b0ef536d1e53489c73b88056731993), [`6f2ecf8`](https://github.com/LedgerHQ/ledger-live/commit/6f2ecf89dd1d978038f573738d6e85fe1805b5d9), [`dce4fb6`](https://github.com/LedgerHQ/ledger-live/commit/dce4fb6a4ec291153cc5b4d5a0d5000f777007e1), [`2b2eee6`](https://github.com/LedgerHQ/ledger-live/commit/2b2eee6a4abfb86615f3e5a628f518b5a9c58dad), [`bcd25fd`](https://github.com/LedgerHQ/ledger-live/commit/bcd25fd87bda9e7e8b7c3ee2a243d3e241adc0b0), [`91ac227`](https://github.com/LedgerHQ/ledger-live/commit/91ac22740fbf677ca481382eb55d2e4e12336d2a), [`f482212`](https://github.com/LedgerHQ/ledger-live/commit/f48221278738b5b3accf7199c23e6dd84c48c27e)]:
  - @ledgerhq/types-live@6.127.0

## 3.7.0-next.1

### Minor Changes

- [#23297](https://github.com/LedgerHQ/ledger-live/pull/23297) [`2989e37`](https://github.com/LedgerHQ/ledger-live/commit/2989e37b80b8bfcaae549cc02aa6de189a69dfef) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(solana): refresh the blockhash after the device review to avoid "Blockhash not found"

## 3.7.0-next.0

### Minor Changes

- [#22973](https://github.com/LedgerHQ/ledger-live/pull/22973) [`20484ff`](https://github.com/LedgerHQ/ledger-live/commit/20484ff8d7cc0aab2e4b8448c7e8ce9ebf6840fe) Thanks [@semeano](https://github.com/semeano)! - feat(stacks): keep public-key account ids and persist staking positions on the generic bridge

  - New `BridgeApi.accountIdFromPublicKey` opt-in: a synced account keeps the id it was stored under, and a scanned one is keyed on the device public key, so a family whose legacy bridge keyed ids on the public key is not re-keyed by the generic bridge. Stacks opts in.
  - Stacks registers generic-bridge hooks for its estimation recipient and for persisting `stakingPositions`, which gates the Stake action.

- [#23179](https://github.com/LedgerHQ/ledger-live/pull/23179) [`f047501`](https://github.com/LedgerHQ/ledger-live/commit/f047501381efde857b48c1314d2de637fdce8ade) Thanks [@amaslakov](https://github.com/amaslakov)! - Sum Tezos native balance partitions in the generic adapter, behind a new opt-in `partitionsNativeBalance` bridge flag

- [#22620](https://github.com/LedgerHQ/ledger-live/pull/22620) [`3347eb8`](https://github.com/LedgerHQ/ledger-live/commit/3347eb88f282e2286b43493dadb0a9dd3d1f81d5) Thanks [@henri-ly](https://github.com/henri-ly)! - Keep WalletConnect `cosmos_signAmino` working on the generic bridge: `BridgeApi.signRawOperation` lets a family replace the generic raw signing (craft, sign, combine) with its own. Cosmos registers its verbatim, detached-signature implementation there, the one its legacy bridge already uses. `account.getPublicKey` now returns the Cosmos account public key instead of the address legacy accounts keep in `xpub`.

- [#23194](https://github.com/LedgerHQ/ledger-live/pull/23194) [`90e805d`](https://github.com/LedgerHQ/ledger-live/commit/90e805d9c1b0ef536d1e53489c73b88056731993) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - Remove 20 dead EVM chains (akroma, atheios, callisto, dexon, ellaism, ether1, ethergem, ethersocial, expanse, gochain, hpb, mix, musicoin, pirl, poa, reosc, thundercore, tomo, ubiq, wanchain)

- [#22564](https://github.com/LedgerHQ/ledger-live/pull/22564) [`9c9cae5`](https://github.com/LedgerHQ/ledger-live/commit/9c9cae5ab492b74d52b13e0a5b0673bd681f8d9d) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat(hedera): add the family layer for the generic adapter

- [#22750](https://github.com/LedgerHQ/ledger-live/pull/22750) [`6f2ecf8`](https://github.com/LedgerHQ/ledger-live/commit/6f2ecf89dd1d978038f573738d6e85fe1805b5d9) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(currency): drop `CryptoCurrency#ethereumLikeInfo`

  The EVM `chainId` is now read from the coin config. The unused `ethereumLikeInfo` field (and `EthereumLikeInfoSchema`) is removed from the currency types and registry.

- [#22560](https://github.com/LedgerHQ/ledger-live/pull/22560) [`18166fb`](https://github.com/LedgerHQ/ledger-live/commit/18166fbe8719d50c911aa0ab349e68c414f8fc62) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat(framework): optional `addressLookup` bridge hook for network-assigned addresses + wire Hedera's lookup and local coin module API

- [#21839](https://github.com/LedgerHQ/ledger-live/pull/21839) [`6d744e0`](https://github.com/LedgerHQ/ledger-live/commit/6d744e0d30b4480282d35c359d096f3f6d6602af) Thanks [@YazhuEth](https://github.com/YazhuEth)! - `estimateFees` now returns the recipient token account, wallet address and input type of an SPL transfer alongside its fee, so the device screen names the destination; a recipient token account holding another token throws `SolanaTokenAccountHoldsAnotherToken`.

  `makeEmptyTokenAccount` now builds its id with `encodeTokenAccountId`, like the fourteen families that already do: the wallet-API placeholder previously used the contract address, so it matched no real sub-account id.

  Solana runs on the generic coin framework. The send and staking screens move onto the generic transaction shape, which names what it does — a mode, a memo, a stake account seed — instead of the nested command model the legacy bridge carried, and the apps now read it through one family module rather than reaching into the transaction themselves.

  The behaviours the legacy bridge produced are restored on the generic path: an incoming SPL transfer produces an operation, a stake withdrawal empties the account rather than signing a stale amount, opening a token account is charged its rent, sending the maximum to a new stake account leaves enough to unstake it later, the device confirmation screen lists every row the device itself shows, and a token account's frozen state and Token-2022 extensions are back on screen.

  A live app can again submit the four token and stake commands the wallet API defines, and a raw signature it gets back is hex, as the field it arrives in says. The device signer is selected through the family's own factory, so the `ldmkSolanaSigner` flag and the transaction-check option it carries keep deciding, as they did before. The mock bridge is rewritten on the coin module, so a mocked signature still yields a transaction the wallet API can deserialize.

- [#22989](https://github.com/LedgerHQ/ledger-live/pull/22989) [`8312d68`](https://github.com/LedgerHQ/ledger-live/commit/8312d6818aa5fa37f523352f81f51a61dd502bf2) Thanks [@gre-ledger](https://github.com/gre-ledger)! - chore: take `uuid` from the pnpm catalog (11.1.0)

  `uuid` was spread over 8.3.2, 9.0.1 and 11.1.0. Every package now uses the catalog entry. `@types/uuid` is dropped: 11 ships its own types. The repo only imports `v4`, `v5` and `parse` (`parse` in a coin-solana test fixture), which behave the same across these majors. 11 types `v4` with overloads, so passing it directly as a callback (`useState(uuid)`) no longer typechecks and is now wrapped (`useState(() => uuid())`).

- [#22906](https://github.com/LedgerHQ/ledger-live/pull/22906) [`c5c2815`](https://github.com/LedgerHQ/ledger-live/commit/c5c2815ec53dbf88804e558952f1451f13c37bb4) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: hedera legacy bridge adapter with fixes and optimizations

### Patch Changes

- Updated dependencies [[`bf29f88`](https://github.com/LedgerHQ/ledger-live/commit/bf29f888316e5d8d9049b763a8c77ce9850f07df), [`90e805d`](https://github.com/LedgerHQ/ledger-live/commit/90e805d9c1b0ef536d1e53489c73b88056731993), [`6f2ecf8`](https://github.com/LedgerHQ/ledger-live/commit/6f2ecf89dd1d978038f573738d6e85fe1805b5d9), [`dce4fb6`](https://github.com/LedgerHQ/ledger-live/commit/dce4fb6a4ec291153cc5b4d5a0d5000f777007e1), [`2b2eee6`](https://github.com/LedgerHQ/ledger-live/commit/2b2eee6a4abfb86615f3e5a628f518b5a9c58dad), [`bcd25fd`](https://github.com/LedgerHQ/ledger-live/commit/bcd25fd87bda9e7e8b7c3ee2a243d3e241adc0b0), [`91ac227`](https://github.com/LedgerHQ/ledger-live/commit/91ac22740fbf677ca481382eb55d2e4e12336d2a), [`f482212`](https://github.com/LedgerHQ/ledger-live/commit/f48221278738b5b3accf7199c23e6dd84c48c27e)]:
  - @ledgerhq/types-live@6.127.0-next.0

## 3.6.0

### Minor Changes

- [#22561](https://github.com/LedgerHQ/ledger-live/pull/22561) [`f1d8aac`](https://github.com/LedgerHQ/ledger-live/commit/f1d8aac1c7c0bc0be9beb1508c1a9ef3cf7affae) Thanks [@YazhuEth](https://github.com/YazhuEth)! - chore(currency): drop `CryptoCurrency#bitcoinLikeInfo`

  coin-bitcoin now reads the xpub version from its own `getNetworkParameters`, and coin-zcash from a local `ZCASH_XPUB_VERSION` constant. The unused `bitcoinLikeInfo` field (and `BitcoinLikeInfoSchema`) is removed from the currency types and registry.

- [#21953](https://github.com/LedgerHQ/ledger-live/pull/21953) [`381bd0b`](https://github.com/LedgerHQ/ledger-live/commit/381bd0befb6a09f20f13f65c233f0e1479e7051d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Consume `@ledgerhq/live-config`, `@ledgerhq/live-env`, `@ledgerhq/live-currency-format`,
  `@ledgerhq/domain-service` and `@ledgerhq/evm-tools` from npm instead of the workspace — they
  now live in the `ts-libs` repository. No API change.

- [#22589](https://github.com/LedgerHQ/ledger-live/pull/22589) [`a896fca`](https://github.com/LedgerHQ/ledger-live/commit/a896fca1974a46f10e915d1212e0947e2d808ad5) Thanks [@qperrot](https://github.com/qperrot)! - Remove the deprecated `CryptoCurrency.explorerId` field and the `LedgerExplorerId` type.

  Bitcoin-like explorer ids now come from the coin config (`config_currency_<id>.explorerId`), as EVM already does, and fall back to the currency id. The config is passed in rather than read from a module global: `toWalletBtcCurrency`, `walletBtcCurrencyById` and coin-bitcoin's `blockchainBaseURL` take it as an argument, the sync functions take the `coinConfig` resolver given to `createBridges`, and `assignFromAccountRaw` is now built with `makeAssignFromAccountRaw(coinConfig)`.

  Adds `config_currency_bitcoin_testnet`, `config_currency_bitcoin_regtest` and `config_currency_zcash_regtest` so every bitcoin-like currency resolves a config entry.

- [#22026](https://github.com/LedgerHQ/ledger-live/pull/22026) [`88bae04`](https://github.com/LedgerHQ/ledger-live/commit/88bae04e2f7e7a3de8d55c340fe32b48e37bd78d) Thanks [@ishaba](https://github.com/ishaba)! - fix(coin-tron): take the TRC20 fee_limit from the estimate's ceiling

### Patch Changes

- Updated dependencies [[`2d869a5`](https://github.com/LedgerHQ/ledger-live/commit/2d869a596a4562a00003de01cc657d7277dc6b7c), [`f1d8aac`](https://github.com/LedgerHQ/ledger-live/commit/f1d8aac1c7c0bc0be9beb1508c1a9ef3cf7affae), [`a025d7a`](https://github.com/LedgerHQ/ledger-live/commit/a025d7a872b7b1e4681d16b2bfb54f8949bf6626), [`a896fca`](https://github.com/LedgerHQ/ledger-live/commit/a896fca1974a46f10e915d1212e0947e2d808ad5), [`8c486aa`](https://github.com/LedgerHQ/ledger-live/commit/8c486aabe3dbd100b21e43d3f344fda5142858ed)]:
  - @ledgerhq/types-live@6.126.0

## 3.6.0-next.0

### Minor Changes

- [#22561](https://github.com/LedgerHQ/ledger-live/pull/22561) [`f1d8aac`](https://github.com/LedgerHQ/ledger-live/commit/f1d8aac1c7c0bc0be9beb1508c1a9ef3cf7affae) Thanks [@YazhuEth](https://github.com/YazhuEth)! - chore(currency): drop `CryptoCurrency#bitcoinLikeInfo`

  coin-bitcoin now reads the xpub version from its own `getNetworkParameters`, and coin-zcash from a local `ZCASH_XPUB_VERSION` constant. The unused `bitcoinLikeInfo` field (and `BitcoinLikeInfoSchema`) is removed from the currency types and registry.

- [#21953](https://github.com/LedgerHQ/ledger-live/pull/21953) [`381bd0b`](https://github.com/LedgerHQ/ledger-live/commit/381bd0befb6a09f20f13f65c233f0e1479e7051d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Consume `@ledgerhq/live-config`, `@ledgerhq/live-env`, `@ledgerhq/live-currency-format`,
  `@ledgerhq/domain-service` and `@ledgerhq/evm-tools` from npm instead of the workspace — they
  now live in the `ts-libs` repository. No API change.

- [#22589](https://github.com/LedgerHQ/ledger-live/pull/22589) [`a896fca`](https://github.com/LedgerHQ/ledger-live/commit/a896fca1974a46f10e915d1212e0947e2d808ad5) Thanks [@qperrot](https://github.com/qperrot)! - Remove the deprecated `CryptoCurrency.explorerId` field and the `LedgerExplorerId` type.

  Bitcoin-like explorer ids now come from the coin config (`config_currency_<id>.explorerId`), as EVM already does, and fall back to the currency id. The config is passed in rather than read from a module global: `toWalletBtcCurrency`, `walletBtcCurrencyById` and coin-bitcoin's `blockchainBaseURL` take it as an argument, the sync functions take the `coinConfig` resolver given to `createBridges`, and `assignFromAccountRaw` is now built with `makeAssignFromAccountRaw(coinConfig)`.

  Adds `config_currency_bitcoin_testnet`, `config_currency_bitcoin_regtest` and `config_currency_zcash_regtest` so every bitcoin-like currency resolves a config entry.

- [#22026](https://github.com/LedgerHQ/ledger-live/pull/22026) [`88bae04`](https://github.com/LedgerHQ/ledger-live/commit/88bae04e2f7e7a3de8d55c340fe32b48e37bd78d) Thanks [@ishaba](https://github.com/ishaba)! - fix(coin-tron): take the TRC20 fee_limit from the estimate's ceiling

### Patch Changes

- Updated dependencies [[`2d869a5`](https://github.com/LedgerHQ/ledger-live/commit/2d869a596a4562a00003de01cc657d7277dc6b7c), [`f1d8aac`](https://github.com/LedgerHQ/ledger-live/commit/f1d8aac1c7c0bc0be9beb1508c1a9ef3cf7affae), [`a025d7a`](https://github.com/LedgerHQ/ledger-live/commit/a025d7a872b7b1e4681d16b2bfb54f8949bf6626), [`a896fca`](https://github.com/LedgerHQ/ledger-live/commit/a896fca1974a46f10e915d1212e0947e2d808ad5), [`8c486aa`](https://github.com/LedgerHQ/ledger-live/commit/8c486aabe3dbd100b21e43d3f344fda5142858ed)]:
  - @ledgerhq/types-live@6.126.0-next.0

## 3.5.0

### Minor Changes

- [#22343](https://github.com/LedgerHQ/ledger-live/pull/22343) [`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop the `documentation` doc-gen CLI: remove the `doc` script and `documentation` devDependency, and the related `micromark` patch in `.pnpmfile.cjs`

- [#21835](https://github.com/LedgerHQ/ledger-live/pull/21835) [`5d2f40f`](https://github.com/LedgerHQ/ledger-live/commit/5d2f40f470f859960e43a2a08755a962796f6beb) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Casper fee estimation now names a valid dummy recipient, which a new test asserts for every family enabled on the generic coin framework.

  Three additions on the way, in preparation for enabling Solana: a family can contribute its own fields to a token sub-account through the new `buildTokenAccountShapes` bridge hook; a fee estimation can propagate a transfer fee, a stake account rent and an owner token account onto the transaction, and a transfer fee is now assigned even when absent, so a fee kept from a previously selected asset can no longer reach the device screen; and a staking position's locked reserve counts towards the staked balance.

  `asset-aggregation` now declares its transitive dependency on `ledger-wallet-framework`, like every other consumer of `live-countervalues`, so its build waits for the framework's declarations.

  No family declares the new hook yet, and no coin module emits the new fee parameters or a locked reserve, so nothing changes on screen beyond the Casper fix.

- [#22272](https://github.com/LedgerHQ/ledger-live/pull/22272) [`e2134f5`](https://github.com/LedgerHQ/ledger-live/commit/e2134f5cffe4669ff5896e2b52904fe22218461b) Thanks [@gre-ledger](https://github.com/gre-ledger)! - chore: align the zod catalog on 4.4.3

  `@ledgerhq/auth` and `@ledgerhq/wallet-api-core` both depend on zod 4.4.3, so the
  workspace catalog pin at 4.3.6 resolved a second copy of zod into the desktop and
  mobile bundles. Moving the catalog to 4.4.3 collapses the two into one.

### Patch Changes

- Updated dependencies [[`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68), [`a62ad28`](https://github.com/LedgerHQ/ledger-live/commit/a62ad28e4900a887567fb61fb8f197af4fa5a23b), [`d59d123`](https://github.com/LedgerHQ/ledger-live/commit/d59d123a2ba037b44507b1f5424e31f05309ec26), [`40251b4`](https://github.com/LedgerHQ/ledger-live/commit/40251b41a62b2381c5c79410073a5f0b3c1fe629)]:
  - @ledgerhq/types-live@6.125.0
  - @ledgerhq/live-env@4.1.0
  - @ledgerhq/live-currency-format@0.15.0

## 3.5.0-next.0

### Minor Changes

- [#22343](https://github.com/LedgerHQ/ledger-live/pull/22343) [`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop the `documentation` doc-gen CLI: remove the `doc` script and `documentation` devDependency, and the related `micromark` patch in `.pnpmfile.cjs`

- [#21835](https://github.com/LedgerHQ/ledger-live/pull/21835) [`5d2f40f`](https://github.com/LedgerHQ/ledger-live/commit/5d2f40f470f859960e43a2a08755a962796f6beb) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Casper fee estimation now names a valid dummy recipient, which a new test asserts for every family enabled on the generic coin framework.

  Three additions on the way, in preparation for enabling Solana: a family can contribute its own fields to a token sub-account through the new `buildTokenAccountShapes` bridge hook; a fee estimation can propagate a transfer fee, a stake account rent and an owner token account onto the transaction, and a transfer fee is now assigned even when absent, so a fee kept from a previously selected asset can no longer reach the device screen; and a staking position's locked reserve counts towards the staked balance.

  `asset-aggregation` now declares its transitive dependency on `ledger-wallet-framework`, like every other consumer of `live-countervalues`, so its build waits for the framework's declarations.

  No family declares the new hook yet, and no coin module emits the new fee parameters or a locked reserve, so nothing changes on screen beyond the Casper fix.

- [#22272](https://github.com/LedgerHQ/ledger-live/pull/22272) [`e2134f5`](https://github.com/LedgerHQ/ledger-live/commit/e2134f5cffe4669ff5896e2b52904fe22218461b) Thanks [@gre-ledger](https://github.com/gre-ledger)! - chore: align the zod catalog on 4.4.3

  `@ledgerhq/auth` and `@ledgerhq/wallet-api-core` both depend on zod 4.4.3, so the
  workspace catalog pin at 4.3.6 resolved a second copy of zod into the desktop and
  mobile bundles. Moving the catalog to 4.4.3 collapses the two into one.

### Patch Changes

- Updated dependencies [[`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68), [`a62ad28`](https://github.com/LedgerHQ/ledger-live/commit/a62ad28e4900a887567fb61fb8f197af4fa5a23b), [`d59d123`](https://github.com/LedgerHQ/ledger-live/commit/d59d123a2ba037b44507b1f5424e31f05309ec26), [`40251b4`](https://github.com/LedgerHQ/ledger-live/commit/40251b41a62b2381c5c79410073a5f0b3c1fe629)]:
  - @ledgerhq/types-live@6.125.0-next.0
  - @ledgerhq/live-env@4.1.0-next.0
  - @ledgerhq/live-currency-format@0.15.0

## 3.4.0

### Minor Changes

- [#21596](https://github.com/LedgerHQ/ledger-live/pull/21596) [`5ddb9ab`](https://github.com/LedgerHQ/ledger-live/commit/5ddb9ab2874a6715d706042701e8b2242b1c14b9) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Carry a chain's staking positions through the generic coin framework, and keep sub-accounts
  aligned with what the chain reports:

  - an unbonding position with no validator is no longer dropped from the account's list
  - `extractBalances` rebuilds staking positions, so a family validating a staking intent finds them
  - a position reads as withdrawable only when the chain offers a withdraw on it
  - `mergeSubAccounts` keeps only the sub-accounts the chain still reports, instead of letting a pruned one survive with a stale balance
  - a pending operation shows the user's memo only on a plain transfer

### Patch Changes

- Updated dependencies [[`85e01c4`](https://github.com/LedgerHQ/ledger-live/commit/85e01c449dab75d75851631a56d292f2cb0c5b36), [`dc204a7`](https://github.com/LedgerHQ/ledger-live/commit/dc204a7633e6f7c9acb66fbb18a6aeaa2e75c4bb)]:
  - @ledgerhq/types-live@6.124.0

## 3.4.0-next.0

### Minor Changes

- [#21596](https://github.com/LedgerHQ/ledger-live/pull/21596) [`5ddb9ab`](https://github.com/LedgerHQ/ledger-live/commit/5ddb9ab2874a6715d706042701e8b2242b1c14b9) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Carry a chain's staking positions through the generic coin framework, and keep sub-accounts
  aligned with what the chain reports:

  - an unbonding position with no validator is no longer dropped from the account's list
  - `extractBalances` rebuilds staking positions, so a family validating a staking intent finds them
  - a position reads as withdrawable only when the chain offers a withdraw on it
  - `mergeSubAccounts` keeps only the sub-accounts the chain still reports, instead of letting a pruned one survive with a stale balance
  - a pending operation shows the user's memo only on a plain transfer

### Patch Changes

- Updated dependencies [[`85e01c4`](https://github.com/LedgerHQ/ledger-live/commit/85e01c449dab75d75851631a56d292f2cb0c5b36), [`dc204a7`](https://github.com/LedgerHQ/ledger-live/commit/dc204a7633e6f7c9acb66fbb18a6aeaa2e75c4bb)]:
  - @ledgerhq/types-live@6.124.0-next.0

## 3.3.0

### Minor Changes

- [#21488](https://github.com/LedgerHQ/ledger-live/pull/21488) [`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop `delisted` from `CryptoCurrency`. No registry entry ever set it, so the `listCryptoCurrencies()` production filter was testing a dead branch. It stays on `TokenCurrency`, where CAL drives it.

- [#21486](https://github.com/LedgerHQ/ledger-live/pull/21486) [`2d42e64`](https://github.com/LedgerHQ/ledger-live/commit/2d42e647d55f79cf2eb821ec30a232cc07891219) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop `deviceTicker` from `CryptoCurrency`. The field was declared in three places and set by 17 testnet/L2 registry entries, but nothing ever read it.

- [#21487](https://github.com/LedgerHQ/ledger-live/pull/21487) [`b7d0367`](https://github.com/LedgerHQ/ledger-live/commit/b7d03671db1aa022d3ff375465c7d8470bf2b215) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop `disableCountervalue` from `CryptoCurrency`. Nothing read it on a crypto currency; it stays on `TokenCurrency`, where the assets API drives it, and on `FiatCurrency`.

- [#21485](https://github.com/LedgerHQ/ledger-live/pull/21485) [`5b7d11d`](https://github.com/LedgerHQ/ledger-live/commit/5b7d11dd9a988f0034b4b5b6168f02429ba5a406) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(framework): align Solana testnet / devnet derivation with mainnet

- [#21616](https://github.com/LedgerHQ/ledger-live/pull/21616) [`5e971b5`](https://github.com/LedgerHQ/ledger-live/commit/5e971b55429cdcab0f69825ce2056fef24d30215) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Migrate `BIG_NUMBER_DECIMAL_PLACES` off `@ledgerhq/live-env`: every call site now inlines the constant and the definition is removed. `@ledgerhq/live-currency-format` drops its `@ledgerhq/live-env` dependency altogether.

### Patch Changes

- Updated dependencies [[`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d), [`2d42e64`](https://github.com/LedgerHQ/ledger-live/commit/2d42e647d55f79cf2eb821ec30a232cc07891219), [`b7d0367`](https://github.com/LedgerHQ/ledger-live/commit/b7d03671db1aa022d3ff375465c7d8470bf2b215), [`5e971b5`](https://github.com/LedgerHQ/ledger-live/commit/5e971b55429cdcab0f69825ce2056fef24d30215), [`b7a8906`](https://github.com/LedgerHQ/ledger-live/commit/b7a89064587bbcd1f758f7b6205a616225ac2317), [`b9e15ac`](https://github.com/LedgerHQ/ledger-live/commit/b9e15ac78e2b89919c605511f333282610e57225), [`9fb98ab`](https://github.com/LedgerHQ/ledger-live/commit/9fb98ab74e3ca680e686a302b9beaa460a087783)]:
  - @ledgerhq/types-live@6.123.0
  - @ledgerhq/live-currency-format@0.15.0
  - @ledgerhq/live-env@4.0.0

## 3.3.0-next.0

### Minor Changes

- [#21488](https://github.com/LedgerHQ/ledger-live/pull/21488) [`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop `delisted` from `CryptoCurrency`. No registry entry ever set it, so the `listCryptoCurrencies()` production filter was testing a dead branch. It stays on `TokenCurrency`, where CAL drives it.

- [#21486](https://github.com/LedgerHQ/ledger-live/pull/21486) [`2d42e64`](https://github.com/LedgerHQ/ledger-live/commit/2d42e647d55f79cf2eb821ec30a232cc07891219) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop `deviceTicker` from `CryptoCurrency`. The field was declared in three places and set by 17 testnet/L2 registry entries, but nothing ever read it.

- [#21487](https://github.com/LedgerHQ/ledger-live/pull/21487) [`b7d0367`](https://github.com/LedgerHQ/ledger-live/commit/b7d03671db1aa022d3ff375465c7d8470bf2b215) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop `disableCountervalue` from `CryptoCurrency`. Nothing read it on a crypto currency; it stays on `TokenCurrency`, where the assets API drives it, and on `FiatCurrency`.

- [#21485](https://github.com/LedgerHQ/ledger-live/pull/21485) [`5b7d11d`](https://github.com/LedgerHQ/ledger-live/commit/5b7d11dd9a988f0034b4b5b6168f02429ba5a406) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(framework): align Solana testnet / devnet derivation with mainnet

- [#21616](https://github.com/LedgerHQ/ledger-live/pull/21616) [`5e971b5`](https://github.com/LedgerHQ/ledger-live/commit/5e971b55429cdcab0f69825ce2056fef24d30215) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Migrate `BIG_NUMBER_DECIMAL_PLACES` off `@ledgerhq/live-env`: every call site now inlines the constant and the definition is removed. `@ledgerhq/live-currency-format` drops its `@ledgerhq/live-env` dependency altogether.

### Patch Changes

- Updated dependencies [[`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d), [`2d42e64`](https://github.com/LedgerHQ/ledger-live/commit/2d42e647d55f79cf2eb821ec30a232cc07891219), [`b7d0367`](https://github.com/LedgerHQ/ledger-live/commit/b7d03671db1aa022d3ff375465c7d8470bf2b215), [`5e971b5`](https://github.com/LedgerHQ/ledger-live/commit/5e971b55429cdcab0f69825ce2056fef24d30215), [`b7a8906`](https://github.com/LedgerHQ/ledger-live/commit/b7a89064587bbcd1f758f7b6205a616225ac2317), [`b9e15ac`](https://github.com/LedgerHQ/ledger-live/commit/b9e15ac78e2b89919c605511f333282610e57225), [`9fb98ab`](https://github.com/LedgerHQ/ledger-live/commit/9fb98ab74e3ca680e686a302b9beaa460a087783)]:
  - @ledgerhq/types-live@6.123.0-next.0
  - @ledgerhq/live-currency-format@0.15.0-next.0
  - @ledgerhq/live-env@4.0.0-next.0

## 3.2.0

### Minor Changes

- [#20935](https://github.com/LedgerHQ/ledger-live/pull/20935) [`27388a8`](https://github.com/LedgerHQ/ledger-live/commit/27388a894eaac67b8e162a60f6d3368aad0a8682) Thanks [@dilaouid](https://github.com/dilaouid)! - Move Solana staking onto the generic `StakingResources` account attribute.

  **Breaking for `@ledgerhq/coin-solana`.** `SolanaResources`, `SolanaResourcesRaw`, `toSolanaResourcesRaw` and `fromSolanaResourcesRaw` are gone. `SolanaAccount` is now an alias of `StakingAccount`, so read staking data from `account.stakingResources` instead of `account.solanaResources`. A stake is a `StakingDelegation` or a `StakingUnbonding` (`SolanaStakingPosition`) rather than a `SolanaStake`: its stake account address is `positionId`, its validator is `validatorAddress`, and the former `activation.active` / `activation.inactive` / `withdrawable` fields are `activeAmount` / `inactiveAmount` / `withdrawableAmount`. `listSolanaStakingPositions`, `solanaActivationState` and `stakeActions` from `@ledgerhq/coin-solana/logic` cover the common access patterns. Accounts already persisted with a `solanaResources` blob are migrated on hydration, so no resync is needed.

  `@ledgerhq/types-live` gains `StakingPositionDetails`, mixed into `StakingDelegation` and `StakingUnbonding` for chains that materialize each position as its own on-chain account, plus `actionFeeReserve` on `StakingResources`. Both are optional, so other chains are unaffected.

  `@ledgerhq/wallet-cli`'s `earn positions` output changes shape: on `EarnSolanaStake`, `stakeBalance` and `withdrawable` go from `number` to an integer decimal string, so lamport amounts above `Number.MAX_SAFE_INTEGER` stay exact. Anything reading those two fields numerically needs updating.

  `@ledgerhq/ledger-wallet-framework` now exports the generic `StakingResources` serializer (`toStakingResourcesRaw`, `fromStakingResourcesRaw`, `assignStakingResourcesToAccountRaw`, `assignStakingResourcesFromAccountRaw`), moved out of the EVM family in `live-common` so every coin module can use it.

### Patch Changes

- Updated dependencies [[`27388a8`](https://github.com/LedgerHQ/ledger-live/commit/27388a894eaac67b8e162a60f6d3368aad0a8682), [`e21305a`](https://github.com/LedgerHQ/ledger-live/commit/e21305abce18f0a9408bf6c0e2bb47d5c992e06a)]:
  - @ledgerhq/types-live@6.122.0
  - @ledgerhq/live-env@3.2.0
  - @ledgerhq/live-currency-format@0.14.3

## 3.2.0-next.0

### Minor Changes

- [#20935](https://github.com/LedgerHQ/ledger-live/pull/20935) [`27388a8`](https://github.com/LedgerHQ/ledger-live/commit/27388a894eaac67b8e162a60f6d3368aad0a8682) Thanks [@dilaouid](https://github.com/dilaouid)! - Move Solana staking onto the generic `StakingResources` account attribute.

  **Breaking for `@ledgerhq/coin-solana`.** `SolanaResources`, `SolanaResourcesRaw`, `toSolanaResourcesRaw` and `fromSolanaResourcesRaw` are gone. `SolanaAccount` is now an alias of `StakingAccount`, so read staking data from `account.stakingResources` instead of `account.solanaResources`. A stake is a `StakingDelegation` or a `StakingUnbonding` (`SolanaStakingPosition`) rather than a `SolanaStake`: its stake account address is `positionId`, its validator is `validatorAddress`, and the former `activation.active` / `activation.inactive` / `withdrawable` fields are `activeAmount` / `inactiveAmount` / `withdrawableAmount`. `listSolanaStakingPositions`, `solanaActivationState` and `stakeActions` from `@ledgerhq/coin-solana/logic` cover the common access patterns. Accounts already persisted with a `solanaResources` blob are migrated on hydration, so no resync is needed.

  `@ledgerhq/types-live` gains `StakingPositionDetails`, mixed into `StakingDelegation` and `StakingUnbonding` for chains that materialize each position as its own on-chain account, plus `actionFeeReserve` on `StakingResources`. Both are optional, so other chains are unaffected.

  `@ledgerhq/wallet-cli`'s `earn positions` output changes shape: on `EarnSolanaStake`, `stakeBalance` and `withdrawable` go from `number` to an integer decimal string, so lamport amounts above `Number.MAX_SAFE_INTEGER` stay exact. Anything reading those two fields numerically needs updating.

  `@ledgerhq/ledger-wallet-framework` now exports the generic `StakingResources` serializer (`toStakingResourcesRaw`, `fromStakingResourcesRaw`, `assignStakingResourcesToAccountRaw`, `assignStakingResourcesFromAccountRaw`), moved out of the EVM family in `live-common` so every coin module can use it.

### Patch Changes

- Updated dependencies [[`27388a8`](https://github.com/LedgerHQ/ledger-live/commit/27388a894eaac67b8e162a60f6d3368aad0a8682), [`e21305a`](https://github.com/LedgerHQ/ledger-live/commit/e21305abce18f0a9408bf6c0e2bb47d5c992e06a)]:
  - @ledgerhq/types-live@6.122.0-next.0
  - @ledgerhq/live-env@3.2.0-next.0
  - @ledgerhq/live-currency-format@0.14.3-next.0

## 3.1.0

### Minor Changes

- [#20799](https://github.com/LedgerHQ/ledger-live/pull/20799) [`585d8d7`](https://github.com/LedgerHQ/ledger-live/commit/585d8d78d5e153186c39ee2abfcdb7dc4a5d06e0) Thanks [@ishaba](https://github.com/ishaba)! - Migrate Tron to the generic coin framework (LIVE-34994).

  Adds a per-family pending-operation `extra` to the generic framework: `OptimisticOperationDescriptor` gains an optional `extra` bag and `describeOptimisticOperation` receives the transaction it describes, with framework-reserved keys stripped so a family cannot shadow them.

### Patch Changes

- Updated dependencies [[`aa39333`](https://github.com/LedgerHQ/ledger-live/commit/aa393339789242783b168398cb5122a7f1e3f620), [`6c425e0`](https://github.com/LedgerHQ/ledger-live/commit/6c425e0e869c6feed4bd4c87ee0fef5443617708), [`8161bac`](https://github.com/LedgerHQ/ledger-live/commit/8161bac542474212dfefc8519e714da345b03f71), [`fbc8036`](https://github.com/LedgerHQ/ledger-live/commit/fbc8036d9bd4e1cc30eea4233f05e8b0498c0e5e), [`39a676d`](https://github.com/LedgerHQ/ledger-live/commit/39a676d2f861d04913264e61100205b4f6044cf9)]:
  - @ledgerhq/types-live@6.121.0
  - @ledgerhq/live-env@3.1.0
  - @ledgerhq/live-currency-format@0.14.2

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->

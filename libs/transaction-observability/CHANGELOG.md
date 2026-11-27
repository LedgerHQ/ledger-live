# @ledgerhq/transaction-observability

## 0.7.0

### Minor Changes

- [#24861](https://github.com/LedgerHQ/ledger-live/pull/24861) [`16bc82a`](https://github.com/LedgerHQ/ledger-live/commit/16bc82a772d61b5c2ca659922ffa8e74eab283d7) Thanks [@henri-ly](https://github.com/henri-ly)! - Check a Solana transaction's blockhash before simulating it and report an expired one as `SolanaTxBlockhashExpired`, shown as is in the send flows with wording that asks the user to try again. Durable-nonce transactions skip the check, and a simulation that cannot find the blockhash runs once more after 500 ms

### Patch Changes

- Updated dependencies [[`081c422`](https://github.com/LedgerHQ/ledger-live/commit/081c422494180f04d0fbaf9de4d59370d7927863), [`a869e8b`](https://github.com/LedgerHQ/ledger-live/commit/a869e8b37d098ba06c01d36516ad7a6abb9aa0a5), [`4ea6c56`](https://github.com/LedgerHQ/ledger-live/commit/4ea6c566069a55a0345df95add6dc62e37a30b01), [`90af53f`](https://github.com/LedgerHQ/ledger-live/commit/90af53fdcab2448e07ced5f4cc8d37efad261c6b), [`e516034`](https://github.com/LedgerHQ/ledger-live/commit/e5160345b50c0dc9e7c490da72d641c631d2ef7f)]:
  - @ledgerhq/types-live@6.133.0

## 0.7.0-next.0

### Minor Changes

- [#24861](https://github.com/LedgerHQ/ledger-live/pull/24861) [`16bc82a`](https://github.com/LedgerHQ/ledger-live/commit/16bc82a772d61b5c2ca659922ffa8e74eab283d7) Thanks [@henri-ly](https://github.com/henri-ly)! - Check a Solana transaction's blockhash before simulating it and report an expired one as `SolanaTxBlockhashExpired`, shown as is in the send flows with wording that asks the user to try again. Durable-nonce transactions skip the check, and a simulation that cannot find the blockhash runs once more after 500 ms

### Patch Changes

- Updated dependencies [[`081c422`](https://github.com/LedgerHQ/ledger-live/commit/081c422494180f04d0fbaf9de4d59370d7927863), [`a869e8b`](https://github.com/LedgerHQ/ledger-live/commit/a869e8b37d098ba06c01d36516ad7a6abb9aa0a5), [`4ea6c56`](https://github.com/LedgerHQ/ledger-live/commit/4ea6c566069a55a0345df95add6dc62e37a30b01), [`90af53f`](https://github.com/LedgerHQ/ledger-live/commit/90af53fdcab2448e07ced5f4cc8d37efad261c6b), [`e516034`](https://github.com/LedgerHQ/ledger-live/commit/e5160345b50c0dc9e7c490da72d641c631d2ef7f)]:
  - @ledgerhq/types-live@6.133.0-next.0

## 0.6.3

### Patch Changes

- Updated dependencies [[`4aa3244`](https://github.com/LedgerHQ/ledger-live/commit/4aa32442c63cd17bd2894d63ad0721d51e0ca41a), [`5a9de42`](https://github.com/LedgerHQ/ledger-live/commit/5a9de42cd3a598f1f8954d58b9536280f5fd2927), [`120891d`](https://github.com/LedgerHQ/ledger-live/commit/120891d4dbd9e9bba22dbf552f1bbe0ab34685cc), [`0cf44d5`](https://github.com/LedgerHQ/ledger-live/commit/0cf44d56a449fb0f4448cd6f8e02c880fc47adb2)]:
  - @ledgerhq/types-live@6.132.0
  - @shared/env@0.14.0

## 0.6.3-next.0

### Patch Changes

- Updated dependencies [[`4aa3244`](https://github.com/LedgerHQ/ledger-live/commit/4aa32442c63cd17bd2894d63ad0721d51e0ca41a), [`5a9de42`](https://github.com/LedgerHQ/ledger-live/commit/5a9de42cd3a598f1f8954d58b9536280f5fd2927), [`120891d`](https://github.com/LedgerHQ/ledger-live/commit/120891d4dbd9e9bba22dbf552f1bbe0ab34685cc), [`0cf44d5`](https://github.com/LedgerHQ/ledger-live/commit/0cf44d56a449fb0f4448cd6f8e02c880fc47adb2)]:
  - @ledgerhq/types-live@6.132.0-next.0
  - @shared/env@0.14.0-next.0

## 0.6.2

### Patch Changes

- Updated dependencies [[`b77803f`](https://github.com/LedgerHQ/ledger-live/commit/b77803ffbca90848d55bca56b9d8cd3547464620), [`d36ed0a`](https://github.com/LedgerHQ/ledger-live/commit/d36ed0a5b624f1842e2ad3a857d502621dfb5fb9), [`420409b`](https://github.com/LedgerHQ/ledger-live/commit/420409ba20ed5eca81813b15b7dcb85a92de1b5b), [`ef95b2e`](https://github.com/LedgerHQ/ledger-live/commit/ef95b2e00e490f024b81bfbf35cb582b5fed8783), [`e051c84`](https://github.com/LedgerHQ/ledger-live/commit/e051c84a8486b78327ea49500c38b6e2138bbc21), [`3a0d8aa`](https://github.com/LedgerHQ/ledger-live/commit/3a0d8aa1d4904fa0ccc53528ec092bc32a63dcd4), [`96fac1e`](https://github.com/LedgerHQ/ledger-live/commit/96fac1eb64856beb33cc68594e98c25e8b308898), [`0d83181`](https://github.com/LedgerHQ/ledger-live/commit/0d83181e9a96f55811f2ce5532527739bdb7e62a), [`e186896`](https://github.com/LedgerHQ/ledger-live/commit/e186896213df32feb1e6a80e38f45cf189655866), [`e7b21f8`](https://github.com/LedgerHQ/ledger-live/commit/e7b21f816021dbbe7314ff51bf32cc4d87291b98), [`e67063f`](https://github.com/LedgerHQ/ledger-live/commit/e67063fc1fdb96c419c42a452433870b588f201e)]:
  - @ledgerhq/types-live@6.131.0
  - @shared/env@0.13.0

## 0.6.2-next.0

### Patch Changes

- Updated dependencies [[`b77803f`](https://github.com/LedgerHQ/ledger-live/commit/b77803ffbca90848d55bca56b9d8cd3547464620), [`d36ed0a`](https://github.com/LedgerHQ/ledger-live/commit/d36ed0a5b624f1842e2ad3a857d502621dfb5fb9), [`420409b`](https://github.com/LedgerHQ/ledger-live/commit/420409ba20ed5eca81813b15b7dcb85a92de1b5b), [`ef95b2e`](https://github.com/LedgerHQ/ledger-live/commit/ef95b2e00e490f024b81bfbf35cb582b5fed8783), [`e051c84`](https://github.com/LedgerHQ/ledger-live/commit/e051c84a8486b78327ea49500c38b6e2138bbc21), [`3a0d8aa`](https://github.com/LedgerHQ/ledger-live/commit/3a0d8aa1d4904fa0ccc53528ec092bc32a63dcd4), [`96fac1e`](https://github.com/LedgerHQ/ledger-live/commit/96fac1eb64856beb33cc68594e98c25e8b308898), [`0d83181`](https://github.com/LedgerHQ/ledger-live/commit/0d83181e9a96f55811f2ce5532527739bdb7e62a), [`e186896`](https://github.com/LedgerHQ/ledger-live/commit/e186896213df32feb1e6a80e38f45cf189655866), [`e7b21f8`](https://github.com/LedgerHQ/ledger-live/commit/e7b21f816021dbbe7314ff51bf32cc4d87291b98), [`e67063f`](https://github.com/LedgerHQ/ledger-live/commit/e67063fc1fdb96c419c42a452433870b588f201e)]:
  - @ledgerhq/types-live@6.131.0-next.0
  - @shared/env@0.13.0-next.0

## 0.6.1

### Patch Changes

- Updated dependencies [[`9907890`](https://github.com/LedgerHQ/ledger-live/commit/9907890790bf8b804d7cc454a067508df0969137), [`77a85a3`](https://github.com/LedgerHQ/ledger-live/commit/77a85a30abe7b42e5f5b4e0478bec14fa39033cf), [`797b1ab`](https://github.com/LedgerHQ/ledger-live/commit/797b1ab63e4099c962a74170b43275f149c6fbea)]:
  - @ledgerhq/types-live@6.130.0
  - @shared/env@0.12.0

## 0.6.1-next.0

### Patch Changes

- Updated dependencies [[`9907890`](https://github.com/LedgerHQ/ledger-live/commit/9907890790bf8b804d7cc454a067508df0969137), [`77a85a3`](https://github.com/LedgerHQ/ledger-live/commit/77a85a30abe7b42e5f5b4e0478bec14fa39033cf), [`797b1ab`](https://github.com/LedgerHQ/ledger-live/commit/797b1ab63e4099c962a74170b43275f149c6fbea)]:
  - @ledgerhq/types-live@6.130.0-next.0
  - @shared/env@0.12.0-next.0

## 0.6.0

### Minor Changes

- [#23611](https://github.com/LedgerHQ/ledger-live/pull/23611) [`0c04ab2`](https://github.com/LedgerHQ/ledger-live/commit/0c04ab223b387417a27eebbf64459bcd17ea3dc2) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Report coin-module calls and every broadcast outcome to Datadog logs behind the new `coinObservability` flag: `withMetrics` wraps the resolved coin-module API and reports each call to registered observers, sampled on the sync path and capped on failures, and the bridge seam's broadcast events are forwarded as `tx_broadcast` for every family and route.

### Patch Changes

- Updated dependencies [[`29ae68a`](https://github.com/LedgerHQ/ledger-live/commit/29ae68a1ad2429a224106f355f35d1190c0f7359)]:
  - @ledgerhq/types-live@6.129.0
  - @shared/env@0.11.0

## 0.6.0-next.0

### Minor Changes

- [#23611](https://github.com/LedgerHQ/ledger-live/pull/23611) [`0c04ab2`](https://github.com/LedgerHQ/ledger-live/commit/0c04ab223b387417a27eebbf64459bcd17ea3dc2) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Report coin-module calls and every broadcast outcome to Datadog logs behind the new `coinObservability` flag: `withMetrics` wraps the resolved coin-module API and reports each call to registered observers, sampled on the sync path and capped on failures, and the bridge seam's broadcast events are forwarded as `tx_broadcast` for every family and route.

### Patch Changes

- Updated dependencies [[`29ae68a`](https://github.com/LedgerHQ/ledger-live/commit/29ae68a1ad2429a224106f355f35d1190c0f7359)]:
  - @ledgerhq/types-live@6.129.0-next.0
  - @shared/env@0.11.0

## 0.5.1

### Patch Changes

- Updated dependencies [[`ee508db`](https://github.com/LedgerHQ/ledger-live/commit/ee508db35d572d43e03cf58e811177cc3b2389a9), [`80f99a8`](https://github.com/LedgerHQ/ledger-live/commit/80f99a819b13d3ec2bd39d896de46e0a433b9954), [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574), [`75498cf`](https://github.com/LedgerHQ/ledger-live/commit/75498cf55065bccf17d09b780866ae031c01701a), [`68cebc0`](https://github.com/LedgerHQ/ledger-live/commit/68cebc06f2ec8f4cc38ac1caca779317a8fe0711)]:
  - @shared/env@0.11.0
  - @ledgerhq/types-live@6.128.0

## 0.5.1-next.0

### Patch Changes

- Updated dependencies [[`ee508db`](https://github.com/LedgerHQ/ledger-live/commit/ee508db35d572d43e03cf58e811177cc3b2389a9), [`80f99a8`](https://github.com/LedgerHQ/ledger-live/commit/80f99a819b13d3ec2bd39d896de46e0a433b9954), [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574), [`75498cf`](https://github.com/LedgerHQ/ledger-live/commit/75498cf55065bccf17d09b780866ae031c01701a), [`68cebc0`](https://github.com/LedgerHQ/ledger-live/commit/68cebc06f2ec8f4cc38ac1caca779317a8fe0711)]:
  - @shared/env@0.11.0-next.0
  - @ledgerhq/types-live@6.128.0-next.0

## 0.5.0

### Minor Changes

- [#22961](https://github.com/LedgerHQ/ledger-live/pull/22961) [`5b62ecb`](https://github.com/LedgerHQ/ledger-live/commit/5b62ecb5c84b36099b4f29fcca9665431a468fb7) Thanks [@beths-ledger](https://github.com/beths-ledger)! - Report `earn_transaction_*` for the StakeKit, Kiln DeFi and P2P TON stake programs.

  `kiln-widget` (Kiln DeFi) is now on the staking-app allow list, so its stablecoin vault deposits reach Segment. Its ERC-4626 `deposit`, `withdraw` and `redeem` calls already map. It reports no `staking_method`, because a lending yield fits none of them. The built-in stake-program list now includes `p2p-ton-staking`, and it is typed against the allow list, so a stake program that Segment would drop fails to compile.

  StakeKit's EVM stakes (bsc, avalanche_c_chain, POL and USDe on ethereum) are contract calls with no staking `mode`, so they had no action and were dropped. `stakekit` is now on the staking-app allow list, so they emit, with an unmapped function reported as `transaction_type: unknown` and its selector in `raw_transaction_type`. StakeKit reports no `staking_method`: one manifest stakes natively, liquidly and through validators. Its native routes (tron, crypto_org, assethub_polkadot) already emitted and keep their family wording. Observed runs confirm USDe `deposit`, AVAX `submit` → `deposit`, and POL `buyVoucherPOL` → `delegate`: each Polygon validator has its own ValidatorShare contract, so the call names a validator. BSC is not yet observed and reports its selector until it is. AVAX calls `submit` on sAVAX itself, so the contract map now reports it as `liquid` with `output_currency: sAVAX`, checked against CAL like the ETH receipt tokens.

  TON has no `mode`, so its action is now read from what the signer signs: `payload.type`, or a non-empty top-level comment, which replaces the payload. `tonstakers-deposit` and `tonwhales-pool-deposit` are deposits, and `tonwhales-pool-withdraw` and `single-nominator-withdraw` are withdraws. `jetton-burn` stays unmapped, because a Tonstakers unstake and any other burn look the same. `p2p-ton-staking` is on the allow list as pooled staking.

  A P2P deposit carries no payload: it is a plain transfer to the pool with the comment `Deposit`. Inside `p2p-ton-staking` only, an unencrypted comment of exactly `Deposit` is classified, and reported as the fixed `raw_transaction_type` `pool-comment-deposit`. The comment text itself is never reported, and the same comment outside a staking app classifies nothing. A P2P withdrawal needs nothing new: it sends the `tonwhales-pool-withdraw` payload.

  `contract_address` is now only ever reported for EVM. With StakeKit and P2P allow-listed, a native or TON stake reached the contract fallback, which reported its recipient, lower-cased, as a contract. Lower-casing also corrupts TON's case-sensitive addresses.

  These three manifests come from the `stakePrograms` remote config, not from the Earn API, so the drift guard does not cover them.

- [#22787](https://github.com/LedgerHQ/ledger-live/pull/22787) [`1bf1044`](https://github.com/LedgerHQ/ledger-live/commit/1bf1044e3eb3b57187bf6c837b17b4ed00f870cc) Thanks [@beths-ledger](https://github.com/beths-ledger)! - Map the ETH staking dApp exit calls that reached `earn_transaction_*` as `transaction_type: unknown`.

  Every name comes from a completed stake in production, not from the selector list: Chorus One `enterExitQueue` and `claimExitedAssets`, Coinbase and Kiln `requestExit` and `multiClaim`, Kiln `requestValidatorsExit`, Lido `requestWithdrawalsWithPermit` and Kelp `completeWithdrawal` are withdraws, and Kelp `requestRedeem` is a redeem.

  Kiln `batchWithdrawCLFee` stays unmapped on purpose. It sweeps rewards, but after a validator exit the same call returns the principal, so either mapping would be wrong for some calls.

- [#22962](https://github.com/LedgerHQ/ledger-live/pull/22962) [`5eca063`](https://github.com/LedgerHQ/ledger-live/commit/5eca063fe675ec5cb59cc96fffe4b67fcd7f3061) Thanks [@beths-ledger](https://github.com/beths-ledger)! - Report the staked token as `input_currency` for StakeKit's USDe and POL stakes, not the network coin. These calls come from the parent ETH account, so the token is known only from the contract that was called. The contract map now carries an optional `inputCurrency` next to `outputCurrency`. The POL entry covers one Polygon validator, because each validator has its own ValidatorShare contract. The StakeKit USDe vault also reports `output_currency: stk-USDe`, the vault share token the user receives. CAL does not list it, so the drift guard cannot check it.

- [#23083](https://github.com/LedgerHQ/ledger-live/pull/23083) [`4c28d72`](https://github.com/LedgerHQ/ledger-live/commit/4c28d726d50493ed3967c1a7eb84392442dfbeb9) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump `@ledgerhq/ledger-key-ring-protocol`, `@ledgerhq/hw-ledger-key-ring-protocol` to 1.0.0 and `@ledgerhq/evm-tools` to 2.0.0 (ts-libs). No API change.

- [#22781](https://github.com/LedgerHQ/ledger-live/pull/22781) [`6c8bd31`](https://github.com/LedgerHQ/ledger-live/commit/6c8bd31900a6b6aa8987cc82f6d907bbc3611fc1) Thanks [@KVNLS](https://github.com/KVNLS)! - Build the desktop renderer as a web target instead of `electron-renderer`: Node builtins resolve at build time rather than as runtime `require()` calls, and the bundle has no externals. `process` reads are supplied from a snapshot captured in main at startup, deliberately not a `process/browser` polyfill, which would report `platform === "browser"`. A build-time guard fails the build on an unguarded `process` read or a bare `setImmediate`/`clearImmediate`, rather than letting it surface as a runtime crash.

  ZCash shielded sync receives its IPC channel through `setZCashIpcRenderer` instead of reaching for `electron`; the desktop app supplies it over the preload bridge.

  `@ledgerhq/transaction-observability` (the dApp intent's `app_version`) and `@features/platform-device-action-content` (the E2E animation switch) read `process.env` directly instead of `globalThis.process`, which the web-target renderer does not have.

### Patch Changes

- Updated dependencies [[`bf29f88`](https://github.com/LedgerHQ/ledger-live/commit/bf29f888316e5d8d9049b763a8c77ce9850f07df), [`c9b7594`](https://github.com/LedgerHQ/ledger-live/commit/c9b75949c8f01cade6b061bd5b6ecb0af5b0ec5f), [`90e805d`](https://github.com/LedgerHQ/ledger-live/commit/90e805d9c1b0ef536d1e53489c73b88056731993), [`f45fc80`](https://github.com/LedgerHQ/ledger-live/commit/f45fc8027562e53cdbd3500a2884084df6a4af8e), [`6f2ecf8`](https://github.com/LedgerHQ/ledger-live/commit/6f2ecf89dd1d978038f573738d6e85fe1805b5d9), [`dce4fb6`](https://github.com/LedgerHQ/ledger-live/commit/dce4fb6a4ec291153cc5b4d5a0d5000f777007e1), [`2b2eee6`](https://github.com/LedgerHQ/ledger-live/commit/2b2eee6a4abfb86615f3e5a628f518b5a9c58dad), [`bcd25fd`](https://github.com/LedgerHQ/ledger-live/commit/bcd25fd87bda9e7e8b7c3ee2a243d3e241adc0b0), [`91ac227`](https://github.com/LedgerHQ/ledger-live/commit/91ac22740fbf677ca481382eb55d2e4e12336d2a), [`f482212`](https://github.com/LedgerHQ/ledger-live/commit/f48221278738b5b3accf7199c23e6dd84c48c27e)]:
  - @ledgerhq/types-live@6.127.0
  - @shared/env@0.10.0

## 0.5.0-next.0

### Minor Changes

- [#22961](https://github.com/LedgerHQ/ledger-live/pull/22961) [`5b62ecb`](https://github.com/LedgerHQ/ledger-live/commit/5b62ecb5c84b36099b4f29fcca9665431a468fb7) Thanks [@beths-ledger](https://github.com/beths-ledger)! - Report `earn_transaction_*` for the StakeKit, Kiln DeFi and P2P TON stake programs.

  `kiln-widget` (Kiln DeFi) is now on the staking-app allow list, so its stablecoin vault deposits reach Segment. Its ERC-4626 `deposit`, `withdraw` and `redeem` calls already map. It reports no `staking_method`, because a lending yield fits none of them. The built-in stake-program list now includes `p2p-ton-staking`, and it is typed against the allow list, so a stake program that Segment would drop fails to compile.

  StakeKit's EVM stakes (bsc, avalanche_c_chain, POL and USDe on ethereum) are contract calls with no staking `mode`, so they had no action and were dropped. `stakekit` is now on the staking-app allow list, so they emit, with an unmapped function reported as `transaction_type: unknown` and its selector in `raw_transaction_type`. StakeKit reports no `staking_method`: one manifest stakes natively, liquidly and through validators. Its native routes (tron, crypto_org, assethub_polkadot) already emitted and keep their family wording. Observed runs confirm USDe `deposit`, AVAX `submit` → `deposit`, and POL `buyVoucherPOL` → `delegate`: each Polygon validator has its own ValidatorShare contract, so the call names a validator. BSC is not yet observed and reports its selector until it is. AVAX calls `submit` on sAVAX itself, so the contract map now reports it as `liquid` with `output_currency: sAVAX`, checked against CAL like the ETH receipt tokens.

  TON has no `mode`, so its action is now read from what the signer signs: `payload.type`, or a non-empty top-level comment, which replaces the payload. `tonstakers-deposit` and `tonwhales-pool-deposit` are deposits, and `tonwhales-pool-withdraw` and `single-nominator-withdraw` are withdraws. `jetton-burn` stays unmapped, because a Tonstakers unstake and any other burn look the same. `p2p-ton-staking` is on the allow list as pooled staking.

  A P2P deposit carries no payload: it is a plain transfer to the pool with the comment `Deposit`. Inside `p2p-ton-staking` only, an unencrypted comment of exactly `Deposit` is classified, and reported as the fixed `raw_transaction_type` `pool-comment-deposit`. The comment text itself is never reported, and the same comment outside a staking app classifies nothing. A P2P withdrawal needs nothing new: it sends the `tonwhales-pool-withdraw` payload.

  `contract_address` is now only ever reported for EVM. With StakeKit and P2P allow-listed, a native or TON stake reached the contract fallback, which reported its recipient, lower-cased, as a contract. Lower-casing also corrupts TON's case-sensitive addresses.

  These three manifests come from the `stakePrograms` remote config, not from the Earn API, so the drift guard does not cover them.

- [#22787](https://github.com/LedgerHQ/ledger-live/pull/22787) [`1bf1044`](https://github.com/LedgerHQ/ledger-live/commit/1bf1044e3eb3b57187bf6c837b17b4ed00f870cc) Thanks [@beths-ledger](https://github.com/beths-ledger)! - Map the ETH staking dApp exit calls that reached `earn_transaction_*` as `transaction_type: unknown`.

  Every name comes from a completed stake in production, not from the selector list: Chorus One `enterExitQueue` and `claimExitedAssets`, Coinbase and Kiln `requestExit` and `multiClaim`, Kiln `requestValidatorsExit`, Lido `requestWithdrawalsWithPermit` and Kelp `completeWithdrawal` are withdraws, and Kelp `requestRedeem` is a redeem.

  Kiln `batchWithdrawCLFee` stays unmapped on purpose. It sweeps rewards, but after a validator exit the same call returns the principal, so either mapping would be wrong for some calls.

- [#22962](https://github.com/LedgerHQ/ledger-live/pull/22962) [`5eca063`](https://github.com/LedgerHQ/ledger-live/commit/5eca063fe675ec5cb59cc96fffe4b67fcd7f3061) Thanks [@beths-ledger](https://github.com/beths-ledger)! - Report the staked token as `input_currency` for StakeKit's USDe and POL stakes, not the network coin. These calls come from the parent ETH account, so the token is known only from the contract that was called. The contract map now carries an optional `inputCurrency` next to `outputCurrency`. The POL entry covers one Polygon validator, because each validator has its own ValidatorShare contract. The StakeKit USDe vault also reports `output_currency: stk-USDe`, the vault share token the user receives. CAL does not list it, so the drift guard cannot check it.

- [#23083](https://github.com/LedgerHQ/ledger-live/pull/23083) [`4c28d72`](https://github.com/LedgerHQ/ledger-live/commit/4c28d726d50493ed3967c1a7eb84392442dfbeb9) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Bump `@ledgerhq/ledger-key-ring-protocol`, `@ledgerhq/hw-ledger-key-ring-protocol` to 1.0.0 and `@ledgerhq/evm-tools` to 2.0.0 (ts-libs). No API change.

- [#22781](https://github.com/LedgerHQ/ledger-live/pull/22781) [`6c8bd31`](https://github.com/LedgerHQ/ledger-live/commit/6c8bd31900a6b6aa8987cc82f6d907bbc3611fc1) Thanks [@KVNLS](https://github.com/KVNLS)! - Build the desktop renderer as a web target instead of `electron-renderer`: Node builtins resolve at build time rather than as runtime `require()` calls, and the bundle has no externals. `process` reads are supplied from a snapshot captured in main at startup, deliberately not a `process/browser` polyfill, which would report `platform === "browser"`. A build-time guard fails the build on an unguarded `process` read or a bare `setImmediate`/`clearImmediate`, rather than letting it surface as a runtime crash.

  ZCash shielded sync receives its IPC channel through `setZCashIpcRenderer` instead of reaching for `electron`; the desktop app supplies it over the preload bridge.

  `@ledgerhq/transaction-observability` (the dApp intent's `app_version`) and `@features/platform-device-action-content` (the E2E animation switch) read `process.env` directly instead of `globalThis.process`, which the web-target renderer does not have.

### Patch Changes

- Updated dependencies [[`bf29f88`](https://github.com/LedgerHQ/ledger-live/commit/bf29f888316e5d8d9049b763a8c77ce9850f07df), [`c9b7594`](https://github.com/LedgerHQ/ledger-live/commit/c9b75949c8f01cade6b061bd5b6ecb0af5b0ec5f), [`90e805d`](https://github.com/LedgerHQ/ledger-live/commit/90e805d9c1b0ef536d1e53489c73b88056731993), [`f45fc80`](https://github.com/LedgerHQ/ledger-live/commit/f45fc8027562e53cdbd3500a2884084df6a4af8e), [`6f2ecf8`](https://github.com/LedgerHQ/ledger-live/commit/6f2ecf89dd1d978038f573738d6e85fe1805b5d9), [`dce4fb6`](https://github.com/LedgerHQ/ledger-live/commit/dce4fb6a4ec291153cc5b4d5a0d5000f777007e1), [`2b2eee6`](https://github.com/LedgerHQ/ledger-live/commit/2b2eee6a4abfb86615f3e5a628f518b5a9c58dad), [`bcd25fd`](https://github.com/LedgerHQ/ledger-live/commit/bcd25fd87bda9e7e8b7c3ee2a243d3e241adc0b0), [`91ac227`](https://github.com/LedgerHQ/ledger-live/commit/91ac22740fbf677ca481382eb55d2e4e12336d2a), [`f482212`](https://github.com/LedgerHQ/ledger-live/commit/f48221278738b5b3accf7199c23e6dd84c48c27e)]:
  - @ledgerhq/types-live@6.127.0-next.0
  - @shared/env@0.10.0-next.0

## 0.4.0

### Minor Changes

- [#22058](https://github.com/LedgerHQ/ledger-live/pull/22058) [`f8c92f9`](https://github.com/LedgerHQ/ledger-live/commit/f8c92f9300d4b8268949ed7aff5a6781ed7f60a8) Thanks [@alexstapenka-ledger](https://github.com/alexstapenka-ledger)! - Instrument the shared sign/broadcast bridge defensively and dispatch consent-independent Earn
  transaction lifecycle events for native staking and allow-listed dApps on Desktop and Mobile.

### Patch Changes

- Updated dependencies [[`2d869a5`](https://github.com/LedgerHQ/ledger-live/commit/2d869a596a4562a00003de01cc657d7277dc6b7c), [`5adf8f3`](https://github.com/LedgerHQ/ledger-live/commit/5adf8f3b844e21895aa17f96a620a2dfa6b679ad), [`f1d8aac`](https://github.com/LedgerHQ/ledger-live/commit/f1d8aac1c7c0bc0be9beb1508c1a9ef3cf7affae), [`a025d7a`](https://github.com/LedgerHQ/ledger-live/commit/a025d7a872b7b1e4681d16b2bfb54f8949bf6626), [`a896fca`](https://github.com/LedgerHQ/ledger-live/commit/a896fca1974a46f10e915d1212e0947e2d808ad5), [`8c486aa`](https://github.com/LedgerHQ/ledger-live/commit/8c486aabe3dbd100b21e43d3f344fda5142858ed)]:
  - @ledgerhq/types-live@6.126.0
  - @shared/env@0.9.0

## 0.4.0-next.0

### Minor Changes

- [#22058](https://github.com/LedgerHQ/ledger-live/pull/22058) [`f8c92f9`](https://github.com/LedgerHQ/ledger-live/commit/f8c92f9300d4b8268949ed7aff5a6781ed7f60a8) Thanks [@alexstapenka-ledger](https://github.com/alexstapenka-ledger)! - Instrument the shared sign/broadcast bridge defensively and dispatch consent-independent Earn
  transaction lifecycle events for native staking and allow-listed dApps on Desktop and Mobile.

### Patch Changes

- Updated dependencies [[`2d869a5`](https://github.com/LedgerHQ/ledger-live/commit/2d869a596a4562a00003de01cc657d7277dc6b7c), [`5adf8f3`](https://github.com/LedgerHQ/ledger-live/commit/5adf8f3b844e21895aa17f96a620a2dfa6b679ad), [`f1d8aac`](https://github.com/LedgerHQ/ledger-live/commit/f1d8aac1c7c0bc0be9beb1508c1a9ef3cf7affae), [`a025d7a`](https://github.com/LedgerHQ/ledger-live/commit/a025d7a872b7b1e4681d16b2bfb54f8949bf6626), [`a896fca`](https://github.com/LedgerHQ/ledger-live/commit/a896fca1974a46f10e915d1212e0947e2d808ad5), [`8c486aa`](https://github.com/LedgerHQ/ledger-live/commit/8c486aabe3dbd100b21e43d3f344fda5142858ed)]:
  - @ledgerhq/types-live@6.126.0-next.0
  - @shared/env@0.9.0-next.0

## 0.3.2

### Patch Changes

- Updated dependencies [[`40d296b`](https://github.com/LedgerHQ/ledger-live/commit/40d296b822381cc5d05616acafa1bca61e500dce), [`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68), [`a62ad28`](https://github.com/LedgerHQ/ledger-live/commit/a62ad28e4900a887567fb61fb8f197af4fa5a23b), [`c48d6d7`](https://github.com/LedgerHQ/ledger-live/commit/c48d6d71b7ec0318cfec3277c119284a88d652f7), [`d59d123`](https://github.com/LedgerHQ/ledger-live/commit/d59d123a2ba037b44507b1f5424e31f05309ec26), [`40251b4`](https://github.com/LedgerHQ/ledger-live/commit/40251b41a62b2381c5c79410073a5f0b3c1fe629)]:
  - @shared/env@0.8.0
  - @ledgerhq/evm-tools@1.15.0
  - @ledgerhq/types-live@6.125.0

## 0.3.2-next.0

### Patch Changes

- Updated dependencies [[`40d296b`](https://github.com/LedgerHQ/ledger-live/commit/40d296b822381cc5d05616acafa1bca61e500dce), [`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68), [`a62ad28`](https://github.com/LedgerHQ/ledger-live/commit/a62ad28e4900a887567fb61fb8f197af4fa5a23b), [`c48d6d7`](https://github.com/LedgerHQ/ledger-live/commit/c48d6d71b7ec0318cfec3277c119284a88d652f7), [`d59d123`](https://github.com/LedgerHQ/ledger-live/commit/d59d123a2ba037b44507b1f5424e31f05309ec26), [`40251b4`](https://github.com/LedgerHQ/ledger-live/commit/40251b41a62b2381c5c79410073a5f0b3c1fe629)]:
  - @shared/env@0.8.0-next.0
  - @ledgerhq/evm-tools@1.15.0-next.0
  - @ledgerhq/types-live@6.125.0-next.0

## 0.3.1

### Patch Changes

- Updated dependencies [[`85e01c4`](https://github.com/LedgerHQ/ledger-live/commit/85e01c449dab75d75851631a56d292f2cb0c5b36), [`da3d09d`](https://github.com/LedgerHQ/ledger-live/commit/da3d09d75d7dcae659611cd371c48d75c03f7ae4), [`dc204a7`](https://github.com/LedgerHQ/ledger-live/commit/dc204a7633e6f7c9acb66fbb18a6aeaa2e75c4bb)]:
  - @ledgerhq/types-live@6.124.0
  - @shared/env@0.7.0
  - @ledgerhq/evm-tools@1.14.3

## 0.3.1-next.0

### Patch Changes

- Updated dependencies [[`85e01c4`](https://github.com/LedgerHQ/ledger-live/commit/85e01c449dab75d75851631a56d292f2cb0c5b36), [`da3d09d`](https://github.com/LedgerHQ/ledger-live/commit/da3d09d75d7dcae659611cd371c48d75c03f7ae4), [`dc204a7`](https://github.com/LedgerHQ/ledger-live/commit/dc204a7633e6f7c9acb66fbb18a6aeaa2e75c4bb)]:
  - @ledgerhq/types-live@6.124.0-next.0
  - @shared/env@0.7.0-next.0
  - @ledgerhq/evm-tools@1.14.3

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->

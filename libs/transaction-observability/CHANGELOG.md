# @ledgerhq/transaction-observability

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

## 0.3.0

### Minor Changes

- [#21250](https://github.com/LedgerHQ/ledger-live/pull/21250) [`7c6a8de`](https://github.com/LedgerHQ/ledger-live/commit/7c6a8de98093e274de57e9ee94c6179541e2120c) Thanks [@beths-ledger](https://github.com/beths-ledger)! - Report `earn_transaction_*` for ETH dApp and live-app staking.

  A contract call carries no staking `mode`, so the action came back undefined and every Lido, Kiln, Stader, Kelp, Coinbase, Chorus One, Figment and P2P transaction was dropped. Two signals now classify it, each read at the stage that has it: the action from the call data at sign, the originating app from the manifest.

  Neither works alone. A selector is the keccak hash of a function signature, not a statement of intent — `0xd0e30db0` is `deposit()` on WETH, wrapping ETH, as readily as it is a vault entry — so call data is only ever read inside a known staking app. The manifest, in turn, says the user was in Lido but not whether they staked or withdrew.

  The two vocabularies are kept in separate maps because they disagree: a generic-framework `mode` of `stake` picks a validator and means `delegate`, while a function named `stake` enters a pool and means `deposit`. A family mode always wins, so EVM chains that stake natively — sei_evm, monad, somnia, zero_gravity — keep their own wording and never fall through to call data.

  An allow-listed app calling a function the map does not cover is reported with `transaction_type: "unknown"` and the selector in `raw_transaction_type`, rather than dropped. A silent drop is the failure this project exists to remove: this way the gap is countable and the next mapping is obvious.

  Adds `staking_method` (`liquid`, `pooling`, `restaking`, `dedicated`) and restores `redeem` for share-exact ERC-4626 exits. `approve` stays out: ETH staking needs no approval before delegating, so counting one would inflate the funnel's denominator. `kiln-staking` reports no method, because one manifest serves both a pooled and a dedicated product and only a `queryParams.focus` the bridge never sees tells them apart.

  The allow list is held in code, because a gate must not depend on a network call. `stakingApps.integration.test.ts` reads the real Earn API and fails when a provider appears that the list has never heard of, or when a method stops matching its category.

  Reports `contract_address` and `output_currency` too. One lookup on the called contract answers both which token comes out and, for `kiln-staking`, which of its two products this was — a distinction its manifest cannot make, since both share one manifest id.

  The contracts were confirmed by signing and rejecting on device against each provider, which found two things assumption would have missed.

  **The deposit target is usually not the receipt token.** Only Lido mints on its own token. Kelp, Chorus One and Stader all deposit into a pool contract that mints the token at a different address, so a token address is no evidence of a deposit target. That inference was tried and was wrong three times out of five — Kelp most clearly, where the real target turned out to be `0x036676389e…` rather than rsETH.

  **Chorus One calls `deposit_all`**, which the selector list carries separately from `depositAll`. The map lacked that spelling, and it surfaced in the first test because an unmapped call inside a staking app is reported rather than dropped.

  Observed: Lido, Kiln pooled, Coinbase, Chorus One, Kelp. Published but unobserved: Stader, whose wallet connection does not complete.

  A contract is public infrastructure and identical for every user, and it is only ever read for a call inside a known staking app, never for a plain send whose recipient is the user's own payee.

  An unrecognised contract reports neither field rather than defaulting. Guessing `dedicated` for whatever is unmapped would turn one unknown pool into silently wrong data; an absent field is visible, and `contract_address` says exactly what to add.

  Classification also works at the broadcast stage without the sign stage's help. The generic coin framework copies the transaction onto the optimistic operation, so `recipients[0]` is the contract and `transactionRaw` carries the mode plus the call data — confirmed on a completed Lido deposit, where the data arrives as an unprefixed hex string. Correlation stays as enrichment rather than a dependency, which matters on the split wallet-api route, where a signed operation is serialised and object identity is lost.

  Note for anyone querying this: `tx_pathway` is not one value across these providers. Lido is a live app, so it reads `wallet-api/transaction.signAndBroadcast`; the other seven are dApps and read `dApp/eth_sendTransaction`. Both routes go through the same account bridge, so the classification is identical either way — but a query that filters on one pathway will silently miss the rest.

### Patch Changes

- Updated dependencies [[`60ee73c`](https://github.com/LedgerHQ/ledger-live/commit/60ee73c7b89b101dde708a04ded260341ef86d44), [`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d), [`2d42e64`](https://github.com/LedgerHQ/ledger-live/commit/2d42e647d55f79cf2eb821ec30a232cc07891219), [`b7d0367`](https://github.com/LedgerHQ/ledger-live/commit/b7d03671db1aa022d3ff375465c7d8470bf2b215), [`5e971b5`](https://github.com/LedgerHQ/ledger-live/commit/5e971b55429cdcab0f69825ce2056fef24d30215), [`b7a8906`](https://github.com/LedgerHQ/ledger-live/commit/b7a89064587bbcd1f758f7b6205a616225ac2317), [`c3de11c`](https://github.com/LedgerHQ/ledger-live/commit/c3de11cdf58c4feac701435548bbb96819ae09f6), [`9fb98ab`](https://github.com/LedgerHQ/ledger-live/commit/9fb98ab74e3ca680e686a302b9beaa460a087783)]:
  - @shared/env@0.6.0
  - @ledgerhq/types-live@6.123.0
  - @ledgerhq/evm-tools@1.14.3

## 0.3.0-next.0

### Minor Changes

- [#21250](https://github.com/LedgerHQ/ledger-live/pull/21250) [`7c6a8de`](https://github.com/LedgerHQ/ledger-live/commit/7c6a8de98093e274de57e9ee94c6179541e2120c) Thanks [@beths-ledger](https://github.com/beths-ledger)! - Report `earn_transaction_*` for ETH dApp and live-app staking.

  A contract call carries no staking `mode`, so the action came back undefined and every Lido, Kiln, Stader, Kelp, Coinbase, Chorus One, Figment and P2P transaction was dropped. Two signals now classify it, each read at the stage that has it: the action from the call data at sign, the originating app from the manifest.

  Neither works alone. A selector is the keccak hash of a function signature, not a statement of intent — `0xd0e30db0` is `deposit()` on WETH, wrapping ETH, as readily as it is a vault entry — so call data is only ever read inside a known staking app. The manifest, in turn, says the user was in Lido but not whether they staked or withdrew.

  The two vocabularies are kept in separate maps because they disagree: a generic-framework `mode` of `stake` picks a validator and means `delegate`, while a function named `stake` enters a pool and means `deposit`. A family mode always wins, so EVM chains that stake natively — sei_evm, monad, somnia, zero_gravity — keep their own wording and never fall through to call data.

  An allow-listed app calling a function the map does not cover is reported with `transaction_type: "unknown"` and the selector in `raw_transaction_type`, rather than dropped. A silent drop is the failure this project exists to remove: this way the gap is countable and the next mapping is obvious.

  Adds `staking_method` (`liquid`, `pooling`, `restaking`, `dedicated`) and restores `redeem` for share-exact ERC-4626 exits. `approve` stays out: ETH staking needs no approval before delegating, so counting one would inflate the funnel's denominator. `kiln-staking` reports no method, because one manifest serves both a pooled and a dedicated product and only a `queryParams.focus` the bridge never sees tells them apart.

  The allow list is held in code, because a gate must not depend on a network call. `stakingApps.integration.test.ts` reads the real Earn API and fails when a provider appears that the list has never heard of, or when a method stops matching its category.

  Reports `contract_address` and `output_currency` too. One lookup on the called contract answers both which token comes out and, for `kiln-staking`, which of its two products this was — a distinction its manifest cannot make, since both share one manifest id.

  The contracts were confirmed by signing and rejecting on device against each provider, which found two things assumption would have missed.

  **The deposit target is usually not the receipt token.** Only Lido mints on its own token. Kelp, Chorus One and Stader all deposit into a pool contract that mints the token at a different address, so a token address is no evidence of a deposit target. That inference was tried and was wrong three times out of five — Kelp most clearly, where the real target turned out to be `0x036676389e…` rather than rsETH.

  **Chorus One calls `deposit_all`**, which the selector list carries separately from `depositAll`. The map lacked that spelling, and it surfaced in the first test because an unmapped call inside a staking app is reported rather than dropped.

  Observed: Lido, Kiln pooled, Coinbase, Chorus One, Kelp. Published but unobserved: Stader, whose wallet connection does not complete.

  A contract is public infrastructure and identical for every user, and it is only ever read for a call inside a known staking app, never for a plain send whose recipient is the user's own payee.

  An unrecognised contract reports neither field rather than defaulting. Guessing `dedicated` for whatever is unmapped would turn one unknown pool into silently wrong data; an absent field is visible, and `contract_address` says exactly what to add.

  Classification also works at the broadcast stage without the sign stage's help. The generic coin framework copies the transaction onto the optimistic operation, so `recipients[0]` is the contract and `transactionRaw` carries the mode plus the call data — confirmed on a completed Lido deposit, where the data arrives as an unprefixed hex string. Correlation stays as enrichment rather than a dependency, which matters on the split wallet-api route, where a signed operation is serialised and object identity is lost.

  Note for anyone querying this: `tx_pathway` is not one value across these providers. Lido is a live app, so it reads `wallet-api/transaction.signAndBroadcast`; the other seven are dApps and read `dApp/eth_sendTransaction`. Both routes go through the same account bridge, so the classification is identical either way — but a query that filters on one pathway will silently miss the rest.

### Patch Changes

- Updated dependencies [[`60ee73c`](https://github.com/LedgerHQ/ledger-live/commit/60ee73c7b89b101dde708a04ded260341ef86d44), [`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d), [`2d42e64`](https://github.com/LedgerHQ/ledger-live/commit/2d42e647d55f79cf2eb821ec30a232cc07891219), [`b7d0367`](https://github.com/LedgerHQ/ledger-live/commit/b7d03671db1aa022d3ff375465c7d8470bf2b215), [`5e971b5`](https://github.com/LedgerHQ/ledger-live/commit/5e971b55429cdcab0f69825ce2056fef24d30215), [`b7a8906`](https://github.com/LedgerHQ/ledger-live/commit/b7a89064587bbcd1f758f7b6205a616225ac2317), [`c3de11c`](https://github.com/LedgerHQ/ledger-live/commit/c3de11cdf58c4feac701435548bbb96819ae09f6), [`9fb98ab`](https://github.com/LedgerHQ/ledger-live/commit/9fb98ab74e3ca680e686a302b9beaa460a087783)]:
  - @shared/env@0.6.0-next.0
  - @ledgerhq/types-live@6.123.0-next.0
  - @ledgerhq/evm-tools@1.14.3-next.0

## 0.2.0

### Minor Changes

- [#20819](https://github.com/LedgerHQ/ledger-live/pull/20819) [`edad3fb`](https://github.com/LedgerHQ/ledger-live/commit/edad3fb2dc1fea0277418374b5ebee9c9860f448) Thanks [@beths-ledger](https://github.com/beths-ledger)! - Report the originating live-app or dApp as `manifest_id` rather than `provider` on `earn_transaction_completed` / `earn_transaction_failed`.

  The value was always a manifest id, and `provider` means something else in Ledger Wallet's analytics: the staking or swap partner behind a flow. `manifest_id` is also the name the rest of the codebase already uses for this identifier, including the feature-flag params that supply it.

  No consumer is affected. The host apps only register the observer in the bridge-seam change, so no event has carried either property in production yet.

- [#20819](https://github.com/LedgerHQ/ledger-live/pull/20819) [`0b024e8`](https://github.com/LedgerHQ/ledger-live/commit/0b024e8214eb3635d42c18986aa983bd1501c985) Thanks [@beths-ledger](https://github.com/beths-ledger)! - Correlate the sign and broadcast stages, so a broadcast event carries the transaction's own data rather than what survives on the optimistic operation.

  `signOperation` emits a `SignedOperation` and that same object is later handed to `broadcast`, so object identity is the correlation key — nothing to invent, nothing to reconcile. A `WeakMap` means no TTL, no eviction policy and no size cap to get wrong, and no signature is retained: a transaction signed but never broadcast simply becomes garbage.

  Without this, the broadcast stage is uneven in ways a data consumer cannot predict. Cosmos copies its validators into the optimistic operation and Solana does not; Hedera's `claim-rewards` and Algorand's `claimReward` are crafted as plain transfers and so report `OUT`, and Solana's `stake.withdraw` reports `IN` — indistinguishable from an incoming transfer. Correlation recovers the exact action, the delegation target and send-max for all of them.

  Correlation legitimately misses when a signed operation is serialised and rehydrated (the wallet-api `transaction.sign` route, or one persisted and broadcast later) and for ACRE, which signs outside the wrapper. Those fall back to the operation type. `tx_data_source` on every event records which path produced it, so the hit rate is measurable rather than assumed. Route attribution still comes from the broadcast stage, which is the only stage that knows it.

- [#20817](https://github.com/LedgerHQ/ledger-live/pull/20817) [`244454b`](https://github.com/LedgerHQ/ledger-live/commit/244454ba821c5590a56b4b0e5e5ec6ca2436e6ab) Thanks [@beths-ledger](https://github.com/beths-ledger)! - Add `@ledgerhq/transaction-observability`: the sign/broadcast log-event model, a global observer registry, error classification, staking-action derivation and the Segment mapping behind `earn_transaction_completed` / `earn_transaction_failed`. Nothing consumes it yet — the account-bridge seam and the host registrations follow.

  It lives in a dedicated `libs/*` package rather than `@ledgerhq/live-common` (which no longer accepts new top-level modules), and deliberately does not depend on live-common, since live-common depends on it.

  The two lifecycle stages see different things, and that drives the design: `signOperation` gets the rich transaction (the family's own `mode`, the delegation target), while `broadcast` gets only the optimistic operation and so has to read a coarser `OperationType`. There are therefore two derivations — `deriveEarnTransactionType` and `deriveFromOperationType` — and a per-family matrix test asserts they agree. Without the second one a successful Solana stake derives no action at all and is dropped, because its sign-stage `stake.createAccount` becomes a `DELEGATE` operation at broadcast.

  Emission is gated on having derived a staking action, so plain sends and swaps are ignored without needing a currency allowlist, and generic operation types (`OUT`, `IN`, `NONE`, `FEES`) are never mapped. Transactions originating from the Earn live-app are skipped because that app emits these events itself. Events carry `stage`, `transaction_type`, `raw_transaction_type`, `input_currency`, `network`, `validators`, `error_category` + `error_reason` on failure, and `tx_data_source` so the sign-vs-broadcast provenance is measurable — never a raw error message or signature.

### Patch Changes

- Updated dependencies [[`5e45fdd`](https://github.com/LedgerHQ/ledger-live/commit/5e45fddee9f3483ac3daa7b93f58b01e725e6d4b), [`a8c34d0`](https://github.com/LedgerHQ/ledger-live/commit/a8c34d0d9469b4e11339edfbef53445e58194fd8), [`27388a8`](https://github.com/LedgerHQ/ledger-live/commit/27388a894eaac67b8e162a60f6d3368aad0a8682)]:
  - @shared/env@0.5.0
  - @ledgerhq/types-live@6.122.0

## 0.2.0-next.0

### Minor Changes

- [#20819](https://github.com/LedgerHQ/ledger-live/pull/20819) [`edad3fb`](https://github.com/LedgerHQ/ledger-live/commit/edad3fb2dc1fea0277418374b5ebee9c9860f448) Thanks [@beths-ledger](https://github.com/beths-ledger)! - Report the originating live-app or dApp as `manifest_id` rather than `provider` on `earn_transaction_completed` / `earn_transaction_failed`.

  The value was always a manifest id, and `provider` means something else in Ledger Wallet's analytics: the staking or swap partner behind a flow. `manifest_id` is also the name the rest of the codebase already uses for this identifier, including the feature-flag params that supply it.

  No consumer is affected. The host apps only register the observer in the bridge-seam change, so no event has carried either property in production yet.

- [#20819](https://github.com/LedgerHQ/ledger-live/pull/20819) [`0b024e8`](https://github.com/LedgerHQ/ledger-live/commit/0b024e8214eb3635d42c18986aa983bd1501c985) Thanks [@beths-ledger](https://github.com/beths-ledger)! - Correlate the sign and broadcast stages, so a broadcast event carries the transaction's own data rather than what survives on the optimistic operation.

  `signOperation` emits a `SignedOperation` and that same object is later handed to `broadcast`, so object identity is the correlation key — nothing to invent, nothing to reconcile. A `WeakMap` means no TTL, no eviction policy and no size cap to get wrong, and no signature is retained: a transaction signed but never broadcast simply becomes garbage.

  Without this, the broadcast stage is uneven in ways a data consumer cannot predict. Cosmos copies its validators into the optimistic operation and Solana does not; Hedera's `claim-rewards` and Algorand's `claimReward` are crafted as plain transfers and so report `OUT`, and Solana's `stake.withdraw` reports `IN` — indistinguishable from an incoming transfer. Correlation recovers the exact action, the delegation target and send-max for all of them.

  Correlation legitimately misses when a signed operation is serialised and rehydrated (the wallet-api `transaction.sign` route, or one persisted and broadcast later) and for ACRE, which signs outside the wrapper. Those fall back to the operation type. `tx_data_source` on every event records which path produced it, so the hit rate is measurable rather than assumed. Route attribution still comes from the broadcast stage, which is the only stage that knows it.

- [#20817](https://github.com/LedgerHQ/ledger-live/pull/20817) [`244454b`](https://github.com/LedgerHQ/ledger-live/commit/244454ba821c5590a56b4b0e5e5ec6ca2436e6ab) Thanks [@beths-ledger](https://github.com/beths-ledger)! - Add `@ledgerhq/transaction-observability`: the sign/broadcast log-event model, a global observer registry, error classification, staking-action derivation and the Segment mapping behind `earn_transaction_completed` / `earn_transaction_failed`. Nothing consumes it yet — the account-bridge seam and the host registrations follow.

  It lives in a dedicated `libs/*` package rather than `@ledgerhq/live-common` (which no longer accepts new top-level modules), and deliberately does not depend on live-common, since live-common depends on it.

  The two lifecycle stages see different things, and that drives the design: `signOperation` gets the rich transaction (the family's own `mode`, the delegation target), while `broadcast` gets only the optimistic operation and so has to read a coarser `OperationType`. There are therefore two derivations — `deriveEarnTransactionType` and `deriveFromOperationType` — and a per-family matrix test asserts they agree. Without the second one a successful Solana stake derives no action at all and is dropped, because its sign-stage `stake.createAccount` becomes a `DELEGATE` operation at broadcast.

  Emission is gated on having derived a staking action, so plain sends and swaps are ignored without needing a currency allowlist, and generic operation types (`OUT`, `IN`, `NONE`, `FEES`) are never mapped. Transactions originating from the Earn live-app are skipped because that app emits these events itself. Events carry `stage`, `transaction_type`, `raw_transaction_type`, `input_currency`, `network`, `validators`, `error_category` + `error_reason` on failure, and `tx_data_source` so the sign-vs-broadcast provenance is measurable — never a raw error message or signature.

### Patch Changes

- Updated dependencies [[`5e45fdd`](https://github.com/LedgerHQ/ledger-live/commit/5e45fddee9f3483ac3daa7b93f58b01e725e6d4b), [`a8c34d0`](https://github.com/LedgerHQ/ledger-live/commit/a8c34d0d9469b4e11339edfbef53445e58194fd8), [`27388a8`](https://github.com/LedgerHQ/ledger-live/commit/27388a894eaac67b8e162a60f6d3368aad0a8682)]:
  - @shared/env@0.5.0-next.0
  - @ledgerhq/types-live@6.122.0-next.0

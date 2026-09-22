# @ledgerhq/coin-cosmos

## 1.4.0-next.0

### Minor Changes

- [#22343](https://github.com/LedgerHQ/ledger-live/pull/22343) [`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop the `documentation` doc-gen CLI: remove the `doc` script and `documentation` devDependency, and the related `micromark` patch in `.pnpmfile.cjs`

- [#22208](https://github.com/LedgerHQ/ledger-live/pull/22208) [`62a6f6c`](https://github.com/LedgerHQ/ledger-live/commit/62a6f6c516180411942c54ef686219387c41fb95) Thanks [@vladyslavchupovskiy-ext-art](https://github.com/vladyslavchupovskiy-ext-art)! - feat(coin-cosmos): add the Gonka currency configuration

  Points Gonka at the Ledger-hosted LCD, sets its minimum gas price to 0 (the chain's fee
  consensus parameter), and disables delegation, which the runtime rejects. Hides the account-header
  stake action on Desktop and Mobile for any Cosmos chain whose config sets `disableDelegation`, and
  stops a zero minimum gas price being mistaken for a missing config when preloaded data is restored.

- [#21841](https://github.com/LedgerHQ/ledger-live/pull/21841) [`d59d123`](https://github.com/LedgerHQ/ledger-live/commit/d59d123a2ba037b44507b1f5424e31f05309ec26) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(cosmos): migrate account resources to shared staking aggregate

- [#22069](https://github.com/LedgerHQ/ledger-live/pull/22069) [`bb3e182`](https://github.com/LedgerHQ/ledger-live/commit/bb3e1822bfc2cb9ff00089082782d9e2bd229b67) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(coin-cosmos): Add the Cosmos CoinFrameworkSigner adapter so the generic account bridge can construct, receive, and sign without extra device address confirmation

### Patch Changes

- Updated dependencies [[`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68), [`a62ad28`](https://github.com/LedgerHQ/ledger-live/commit/a62ad28e4900a887567fb61fb8f197af4fa5a23b), [`5d2f40f`](https://github.com/LedgerHQ/ledger-live/commit/5d2f40f470f859960e43a2a08755a962796f6beb), [`d59d123`](https://github.com/LedgerHQ/ledger-live/commit/d59d123a2ba037b44507b1f5424e31f05309ec26), [`40251b4`](https://github.com/LedgerHQ/ledger-live/commit/40251b41a62b2381c5c79410073a5f0b3c1fe629), [`e2134f5`](https://github.com/LedgerHQ/ledger-live/commit/e2134f5cffe4669ff5896e2b52904fe22218461b)]:
  - @ledgerhq/ledger-wallet-framework@3.5.0-next.0
  - @ledgerhq/types-live@6.125.0-next.0
  - @ledgerhq/live-env@4.1.0-next.0

## 1.3.0

### Minor Changes

- [#21924](https://github.com/LedgerHQ/ledger-live/pull/21924) [`cdb273b`](https://github.com/LedgerHQ/ledger-live/commit/cdb273b068df78cd5a0dbd4281fb79f22e0a7506) Thanks [@qperrot](https://github.com/qperrot)! - Fix account view crash when cosmos `cosmosResources` is undefined by handling missing resources gracefully in the delegation hook and account UI components

- [#20869](https://github.com/LedgerHQ/ledger-live/pull/20869) [`54fce77`](https://github.com/LedgerHQ/ledger-live/commit/54fce77bfa46c3d42d3e39b80804258a91d910f2) Thanks [@henri-ly](https://github.com/henri-ly)! - Stop discarding a cosmos transaction history when one page of it fails.

  `CosmosAPI.fetchAllTransactions` pages until the accumulated tx count reaches the response's `total`. Any page that failed propagated to the surrounding catch, which returned an empty array — so a single bad page reported the account as having no history at all. Two causes are live on mainnet today: a page past the last one, when a node serves fewer transactions than its `total` counts (`failed to search for txs: page should be within [1, N] range`), and a transaction the node can no longer decode (`unable to resolve type URL /tendermint.liquidity.v1beta1.MsgDepositWithinBatch: tx parse error`, permanent on cosmoshub for accounts holding pre-removal liquidity-module txs). Both are answered as HTTP 500 and retried twice by the network layer. A failing page now ends the walk and keeps the pages already fetched.

  Also in `fetchTransactions`: an empty result serialized as `null` instead of `[]` is read as an empty list, and `total` is coerced to a number — the endpoint returns the uint64 as a string, while the declared type said `number`.

  The loop also stops on an empty page. It only advances on the transactions it receives, so a node that answers 200 with an empty page while still counting more in `total` — rather than the 500 above — never reached the exit condition and paged that node indefinitely.

- [#21719](https://github.com/LedgerHQ/ledger-live/pull/21719) [`bb2f03e`](https://github.com/LedgerHQ/ledger-live/commit/bb2f03e41b96b8f95f239acea75428657cdd64fe) Thanks [@vladyslavchupovskiy-ext-art](https://github.com/vladyslavchupovskiy-ext-art)! - fix(cosmos): add the gonka chain and always send the HRP to the signer

  Adds the Gonka chain to the Cosmos coin module's chain factory. Fixes the Cosmos
  signer to send the chain's address prefix to the device on every coin type
  instead of only coin type 60 — the gate was safe while 118 was the only other
  option, but a chain on any other coin type (Gonka is on 1200) could not sign
  through the DMK signer. Chains whose device app is not app-cosmos opt out via
  the new `signWithPrefix` chain parameter: `crypto_org` and `crypto_org_croeseid`
  run the separate "Cronos POS Chain" app on coin type 394 and keep omitting the
  field, so no shipping chain's sign APDU changes. Renames `CosmosSigner.sign`'s
  third parameter from `transactionType` to `hrp`, matching what it actually
  carries. Also treats a zero fee as loaded rather than missing on the send path,
  so a zero-fee chain can send a transaction and use its full spendable balance.

### Patch Changes

- Updated dependencies [[`85e01c4`](https://github.com/LedgerHQ/ledger-live/commit/85e01c449dab75d75851631a56d292f2cb0c5b36), [`dc204a7`](https://github.com/LedgerHQ/ledger-live/commit/dc204a7633e6f7c9acb66fbb18a6aeaa2e75c4bb), [`5ddb9ab`](https://github.com/LedgerHQ/ledger-live/commit/5ddb9ab2874a6715d706042701e8b2242b1c14b9)]:
  - @ledgerhq/types-live@6.124.0
  - @ledgerhq/ledger-wallet-framework@3.4.0

## 1.3.0-next.0

### Minor Changes

- [#21924](https://github.com/LedgerHQ/ledger-live/pull/21924) [`cdb273b`](https://github.com/LedgerHQ/ledger-live/commit/cdb273b068df78cd5a0dbd4281fb79f22e0a7506) Thanks [@qperrot](https://github.com/qperrot)! - Fix account view crash when cosmos `cosmosResources` is undefined by handling missing resources gracefully in the delegation hook and account UI components

- [#20869](https://github.com/LedgerHQ/ledger-live/pull/20869) [`54fce77`](https://github.com/LedgerHQ/ledger-live/commit/54fce77bfa46c3d42d3e39b80804258a91d910f2) Thanks [@henri-ly](https://github.com/henri-ly)! - Stop discarding a cosmos transaction history when one page of it fails.

  `CosmosAPI.fetchAllTransactions` pages until the accumulated tx count reaches the response's `total`. Any page that failed propagated to the surrounding catch, which returned an empty array — so a single bad page reported the account as having no history at all. Two causes are live on mainnet today: a page past the last one, when a node serves fewer transactions than its `total` counts (`failed to search for txs: page should be within [1, N] range`), and a transaction the node can no longer decode (`unable to resolve type URL /tendermint.liquidity.v1beta1.MsgDepositWithinBatch: tx parse error`, permanent on cosmoshub for accounts holding pre-removal liquidity-module txs). Both are answered as HTTP 500 and retried twice by the network layer. A failing page now ends the walk and keeps the pages already fetched.

  Also in `fetchTransactions`: an empty result serialized as `null` instead of `[]` is read as an empty list, and `total` is coerced to a number — the endpoint returns the uint64 as a string, while the declared type said `number`.

  The loop also stops on an empty page. It only advances on the transactions it receives, so a node that answers 200 with an empty page while still counting more in `total` — rather than the 500 above — never reached the exit condition and paged that node indefinitely.

- [#21719](https://github.com/LedgerHQ/ledger-live/pull/21719) [`bb2f03e`](https://github.com/LedgerHQ/ledger-live/commit/bb2f03e41b96b8f95f239acea75428657cdd64fe) Thanks [@vladyslavchupovskiy-ext-art](https://github.com/vladyslavchupovskiy-ext-art)! - fix(cosmos): add the gonka chain and always send the HRP to the signer

  Adds the Gonka chain to the Cosmos coin module's chain factory. Fixes the Cosmos
  signer to send the chain's address prefix to the device on every coin type
  instead of only coin type 60 — the gate was safe while 118 was the only other
  option, but a chain on any other coin type (Gonka is on 1200) could not sign
  through the DMK signer. Chains whose device app is not app-cosmos opt out via
  the new `signWithPrefix` chain parameter: `crypto_org` and `crypto_org_croeseid`
  run the separate "Cronos POS Chain" app on coin type 394 and keep omitting the
  field, so no shipping chain's sign APDU changes. Renames `CosmosSigner.sign`'s
  third parameter from `transactionType` to `hrp`, matching what it actually
  carries. Also treats a zero fee as loaded rather than missing on the send path,
  so a zero-fee chain can send a transaction and use its full spendable balance.

### Patch Changes

- Updated dependencies [[`85e01c4`](https://github.com/LedgerHQ/ledger-live/commit/85e01c449dab75d75851631a56d292f2cb0c5b36), [`dc204a7`](https://github.com/LedgerHQ/ledger-live/commit/dc204a7633e6f7c9acb66fbb18a6aeaa2e75c4bb), [`5ddb9ab`](https://github.com/LedgerHQ/ledger-live/commit/5ddb9ab2874a6715d706042701e8b2242b1c14b9)]:
  - @ledgerhq/types-live@6.124.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.4.0-next.0

## 1.2.0

### Minor Changes

- [#21572](https://github.com/LedgerHQ/ledger-live/pull/21572) [`147a290`](https://github.com/LedgerHQ/ledger-live/commit/147a2905d735eee5682d849b3e2c2cde5178f7bb) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(cosmos): carry operation extras through the familyExtra slot

- [#21380](https://github.com/LedgerHQ/ledger-live/pull/21380) [`59ea8fb`](https://github.com/LedgerHQ/ledger-live/commit/59ea8fbd36754199f1c68ab53537460ca31c70b4) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(cosmos): remove Ledger validator as the default one for Osmosis

### Patch Changes

- Updated dependencies [[`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d), [`2d42e64`](https://github.com/LedgerHQ/ledger-live/commit/2d42e647d55f79cf2eb821ec30a232cc07891219), [`b7d0367`](https://github.com/LedgerHQ/ledger-live/commit/b7d03671db1aa022d3ff375465c7d8470bf2b215), [`5b7d11d`](https://github.com/LedgerHQ/ledger-live/commit/5b7d11dd9a988f0034b4b5b6168f02429ba5a406), [`5e971b5`](https://github.com/LedgerHQ/ledger-live/commit/5e971b55429cdcab0f69825ce2056fef24d30215), [`b7a8906`](https://github.com/LedgerHQ/ledger-live/commit/b7a89064587bbcd1f758f7b6205a616225ac2317), [`b9e15ac`](https://github.com/LedgerHQ/ledger-live/commit/b9e15ac78e2b89919c605511f333282610e57225), [`9fb98ab`](https://github.com/LedgerHQ/ledger-live/commit/9fb98ab74e3ca680e686a302b9beaa460a087783)]:
  - @ledgerhq/types-live@6.123.0
  - @ledgerhq/ledger-wallet-framework@3.3.0
  - @ledgerhq/live-env@4.0.0

## 1.2.0-next.0

### Minor Changes

- [#21572](https://github.com/LedgerHQ/ledger-live/pull/21572) [`147a290`](https://github.com/LedgerHQ/ledger-live/commit/147a2905d735eee5682d849b3e2c2cde5178f7bb) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(cosmos): carry operation extras through the familyExtra slot

- [#21380](https://github.com/LedgerHQ/ledger-live/pull/21380) [`59ea8fb`](https://github.com/LedgerHQ/ledger-live/commit/59ea8fbd36754199f1c68ab53537460ca31c70b4) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(cosmos): remove Ledger validator as the default one for Osmosis

### Patch Changes

- Updated dependencies [[`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d), [`2d42e64`](https://github.com/LedgerHQ/ledger-live/commit/2d42e647d55f79cf2eb821ec30a232cc07891219), [`b7d0367`](https://github.com/LedgerHQ/ledger-live/commit/b7d03671db1aa022d3ff375465c7d8470bf2b215), [`5b7d11d`](https://github.com/LedgerHQ/ledger-live/commit/5b7d11dd9a988f0034b4b5b6168f02429ba5a406), [`5e971b5`](https://github.com/LedgerHQ/ledger-live/commit/5e971b55429cdcab0f69825ce2056fef24d30215), [`b7a8906`](https://github.com/LedgerHQ/ledger-live/commit/b7a89064587bbcd1f758f7b6205a616225ac2317), [`b9e15ac`](https://github.com/LedgerHQ/ledger-live/commit/b9e15ac78e2b89919c605511f333282610e57225), [`9fb98ab`](https://github.com/LedgerHQ/ledger-live/commit/9fb98ab74e3ca680e686a302b9beaa460a087783)]:
  - @ledgerhq/types-live@6.123.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.3.0-next.0
  - @ledgerhq/live-env@4.0.0-next.0

## 1.1.0

### Minor Changes

- [#21168](https://github.com/LedgerHQ/ledger-live/pull/21168) [`beaaa31`](https://github.com/LedgerHQ/ledger-live/commit/beaaa315b5c4d4ccea8145f3a309ba557f961118) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Adopt the coin-module authoring type, dropping the hand-written "not supported" stubs.

  `createApi` no longer declares `CoinModuleApi` as its return type: it returns the object it actually
  builds, checked with `satisfies CoinModuleImpl<CosmosCoinConfig, StringMemo | MemoNotSupported>`. Six
  capability methods that only threw are omitted instead of stubbed — `call`, `register`,
  `craftRawTransaction`, `getRewards`, `getBlock` and `getBlockInfo`. Staking is the notable case: it is
  published à la carte, so `getStakes` and `getValidators` remain real implementations and only the
  reward-distribution listing goes away — the accrued amount stays available through `getStakes`.
  Likewise `lastBlock` is implemented; only the per-height block lookups are absent. `getNextSequence`
  is a real implementation here and is untouched.

  Consumers see no behavioural change: the resolver applies the framework's `withDefaults`, which
  backfills each omitted method with the same `"<name> is not supported"` throw. `supports()` on the
  wrapped api now reports these capabilities as absent, which the stubs previously masked.

  The authored type also keeps the contract's trailing optional parameter, or a caller reaching the module through it could no longer pass it: `broadcast` accepts and ignores its own. TypeScript does not hold a function's shorter parameter list against a target declaring more, so the `satisfies` passed either way and nothing flagged the narrowing.

  The api test asserts the whole capability surface with the framework's `capabilityReport()` rather than one test per unimplemented capability: one expectation covers that each is absent, that reaching it raises `"<name> is not supported"`, and that `supports()` agrees. Being an exact comparison it is exhaustive, so implementing or dropping a capability changes the list instead of leaving a test that passes while covering less.

### Patch Changes

- Updated dependencies [[`27388a8`](https://github.com/LedgerHQ/ledger-live/commit/27388a894eaac67b8e162a60f6d3368aad0a8682), [`e21305a`](https://github.com/LedgerHQ/ledger-live/commit/e21305abce18f0a9408bf6c0e2bb47d5c992e06a)]:
  - @ledgerhq/types-live@6.122.0
  - @ledgerhq/ledger-wallet-framework@3.2.0
  - @ledgerhq/live-env@3.2.0

## 1.1.0-next.0

### Minor Changes

- [#21168](https://github.com/LedgerHQ/ledger-live/pull/21168) [`beaaa31`](https://github.com/LedgerHQ/ledger-live/commit/beaaa315b5c4d4ccea8145f3a309ba557f961118) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Adopt the coin-module authoring type, dropping the hand-written "not supported" stubs.

  `createApi` no longer declares `CoinModuleApi` as its return type: it returns the object it actually
  builds, checked with `satisfies CoinModuleImpl<CosmosCoinConfig, StringMemo | MemoNotSupported>`. Six
  capability methods that only threw are omitted instead of stubbed — `call`, `register`,
  `craftRawTransaction`, `getRewards`, `getBlock` and `getBlockInfo`. Staking is the notable case: it is
  published à la carte, so `getStakes` and `getValidators` remain real implementations and only the
  reward-distribution listing goes away — the accrued amount stays available through `getStakes`.
  Likewise `lastBlock` is implemented; only the per-height block lookups are absent. `getNextSequence`
  is a real implementation here and is untouched.

  Consumers see no behavioural change: the resolver applies the framework's `withDefaults`, which
  backfills each omitted method with the same `"<name> is not supported"` throw. `supports()` on the
  wrapped api now reports these capabilities as absent, which the stubs previously masked.

  The authored type also keeps the contract's trailing optional parameter, or a caller reaching the module through it could no longer pass it: `broadcast` accepts and ignores its own. TypeScript does not hold a function's shorter parameter list against a target declaring more, so the `satisfies` passed either way and nothing flagged the narrowing.

  The api test asserts the whole capability surface with the framework's `capabilityReport()` rather than one test per unimplemented capability: one expectation covers that each is absent, that reaching it raises `"<name> is not supported"`, and that `supports()` agrees. Being an exact comparison it is exhaustive, so implementing or dropping a capability changes the list instead of leaving a test that passes while covering less.

### Patch Changes

- Updated dependencies [[`27388a8`](https://github.com/LedgerHQ/ledger-live/commit/27388a894eaac67b8e162a60f6d3368aad0a8682), [`e21305a`](https://github.com/LedgerHQ/ledger-live/commit/e21305abce18f0a9408bf6c0e2bb47d5c992e06a)]:
  - @ledgerhq/types-live@6.122.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.2.0-next.0
  - @ledgerhq/live-env@3.2.0-next.0

## 1.0.1

### Patch Changes

- Updated dependencies [[`aa39333`](https://github.com/LedgerHQ/ledger-live/commit/aa393339789242783b168398cb5122a7f1e3f620), [`6c425e0`](https://github.com/LedgerHQ/ledger-live/commit/6c425e0e869c6feed4bd4c87ee0fef5443617708), [`585d8d7`](https://github.com/LedgerHQ/ledger-live/commit/585d8d78d5e153186c39ee2abfcdb7dc4a5d06e0), [`8161bac`](https://github.com/LedgerHQ/ledger-live/commit/8161bac542474212dfefc8519e714da345b03f71), [`fbc8036`](https://github.com/LedgerHQ/ledger-live/commit/fbc8036d9bd4e1cc30eea4233f05e8b0498c0e5e), [`39a676d`](https://github.com/LedgerHQ/ledger-live/commit/39a676d2f861d04913264e61100205b4f6044cf9)]:
  - @ledgerhq/types-live@6.121.0
  - @ledgerhq/ledger-wallet-framework@3.1.0
  - @ledgerhq/live-env@3.1.0

## 1.0.1-next.0

### Patch Changes

- Updated dependencies [[`aa39333`](https://github.com/LedgerHQ/ledger-live/commit/aa393339789242783b168398cb5122a7f1e3f620), [`6c425e0`](https://github.com/LedgerHQ/ledger-live/commit/6c425e0e869c6feed4bd4c87ee0fef5443617708), [`585d8d7`](https://github.com/LedgerHQ/ledger-live/commit/585d8d78d5e153186c39ee2abfcdb7dc4a5d06e0), [`8161bac`](https://github.com/LedgerHQ/ledger-live/commit/8161bac542474212dfefc8519e714da345b03f71), [`fbc8036`](https://github.com/LedgerHQ/ledger-live/commit/fbc8036d9bd4e1cc30eea4233f05e8b0498c0e5e), [`39a676d`](https://github.com/LedgerHQ/ledger-live/commit/39a676d2f861d04913264e61100205b4f6044cf9)]:
  - @ledgerhq/types-live@6.121.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.1.0-next.0
  - @ledgerhq/live-env@3.1.0-next.0

## 1.0.0

### Major Changes

- [#20752](https://github.com/LedgerHQ/ledger-live/pull/20752) [`b2896a9`](https://github.com/LedgerHQ/ledger-live/commit/b2896a9b10cf6daaa8f532eaa12f016df606eb8b) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Update combine to accept string[] per ADR-047

### Minor Changes

- [#20571](https://github.com/LedgerHQ/ledger-live/pull/20571) [`7c8d5df`](https://github.com/LedgerHQ/ledger-live/commit/7c8d5dfa862a2e9c3a35251b5d06a3cd4f905d2a) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Thread the coin-module `Context` (ADR-019) explicitly through the coin-evm, coin-vechain and coin-near api and logic layers instead of resolving configuration from the module-level `getCoinConfig` singleton. Exported logic functions now take the context as their first argument, resolve `config` from it (`await context.config(currencyId)`), and pass an explicit, required `config` down to the network layer — no `config?` optionals and no singleton reads on the data path. `getCoinConfig`/`setCoinConfig` remain only as the compatibility surface for the classic account bridge. Ledger Live consumers (live-common, desktop, mobile and coin-celo) are updated to resolve and pass config/context explicitly. Also fixes a coin-polkadot type-inference issue where `getTransactionMaterialWithMetadata`'s cache-key extractor narrowed the cached signature and dropped the `config` argument.

- [#20786](https://github.com/LedgerHQ/ledger-live/pull/20786) [`75d0c9b`](https://github.com/LedgerHQ/ledger-live/commit/75d0c9b97aced42be1f465319ee17ccaafcd649d) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Add unsupported `register` to CoinModuleApi implementations (ADR-046)

### Patch Changes

- Updated dependencies [[`da0a5ce`](https://github.com/LedgerHQ/ledger-live/commit/da0a5ceb8f889f1bace45ed2d3d4c640cdf24ca8), [`eecf99a`](https://github.com/LedgerHQ/ledger-live/commit/eecf99af5c17ab63724843c31d5f3facc6352dad), [`030fc67`](https://github.com/LedgerHQ/ledger-live/commit/030fc677db03e8a411d3d33d2fa88e1ab04df80b), [`5b39a67`](https://github.com/LedgerHQ/ledger-live/commit/5b39a67dd93d4c541a77b0b146881073ca00ed15), [`0807eca`](https://github.com/LedgerHQ/ledger-live/commit/0807ecacfd06057811a3d6f8845b9f4bfc6f693c), [`b6da6b1`](https://github.com/LedgerHQ/ledger-live/commit/b6da6b1b1c98d022f30985c6103c239bffd0c7df), [`79882e2`](https://github.com/LedgerHQ/ledger-live/commit/79882e26a14f246f1cc969937e011b16e701b8f2), [`a20805c`](https://github.com/LedgerHQ/ledger-live/commit/a20805cebd95f2f620d394c4d7598ec93506c83e), [`030b427`](https://github.com/LedgerHQ/ledger-live/commit/030b42707768af3f9c98a15fc6751f1d64b36fe6)]:
  - @ledgerhq/types-live@6.120.0
  - @ledgerhq/ledger-wallet-framework@3.0.0

## 1.0.0-next.1

### Patch Changes

- Updated dependencies [[`da0a5ce`](https://github.com/LedgerHQ/ledger-live/commit/da0a5ceb8f889f1bace45ed2d3d4c640cdf24ca8)]:
  - @ledgerhq/types-live@6.120.0-next.1
  - @ledgerhq/ledger-wallet-framework@3.0.0-next.1

## 1.0.0-next.0

### Major Changes

- [#20752](https://github.com/LedgerHQ/ledger-live/pull/20752) [`b2896a9`](https://github.com/LedgerHQ/ledger-live/commit/b2896a9b10cf6daaa8f532eaa12f016df606eb8b) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Update combine to accept string[] per ADR-047

### Minor Changes

- [#20571](https://github.com/LedgerHQ/ledger-live/pull/20571) [`7c8d5df`](https://github.com/LedgerHQ/ledger-live/commit/7c8d5dfa862a2e9c3a35251b5d06a3cd4f905d2a) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Thread the coin-module `Context` (ADR-019) explicitly through the coin-evm, coin-vechain and coin-near api and logic layers instead of resolving configuration from the module-level `getCoinConfig` singleton. Exported logic functions now take the context as their first argument, resolve `config` from it (`await context.config(currencyId)`), and pass an explicit, required `config` down to the network layer — no `config?` optionals and no singleton reads on the data path. `getCoinConfig`/`setCoinConfig` remain only as the compatibility surface for the classic account bridge. Ledger Live consumers (live-common, desktop, mobile and coin-celo) are updated to resolve and pass config/context explicitly. Also fixes a coin-polkadot type-inference issue where `getTransactionMaterialWithMetadata`'s cache-key extractor narrowed the cached signature and dropped the `config` argument.

- [#20786](https://github.com/LedgerHQ/ledger-live/pull/20786) [`75d0c9b`](https://github.com/LedgerHQ/ledger-live/commit/75d0c9b97aced42be1f465319ee17ccaafcd649d) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Add unsupported `register` to CoinModuleApi implementations (ADR-046)

### Patch Changes

- Updated dependencies [[`eecf99a`](https://github.com/LedgerHQ/ledger-live/commit/eecf99af5c17ab63724843c31d5f3facc6352dad), [`030fc67`](https://github.com/LedgerHQ/ledger-live/commit/030fc677db03e8a411d3d33d2fa88e1ab04df80b), [`5b39a67`](https://github.com/LedgerHQ/ledger-live/commit/5b39a67dd93d4c541a77b0b146881073ca00ed15), [`0807eca`](https://github.com/LedgerHQ/ledger-live/commit/0807ecacfd06057811a3d6f8845b9f4bfc6f693c), [`b6da6b1`](https://github.com/LedgerHQ/ledger-live/commit/b6da6b1b1c98d022f30985c6103c239bffd0c7df), [`79882e2`](https://github.com/LedgerHQ/ledger-live/commit/79882e26a14f246f1cc969937e011b16e701b8f2), [`a20805c`](https://github.com/LedgerHQ/ledger-live/commit/a20805cebd95f2f620d394c4d7598ec93506c83e), [`030b427`](https://github.com/LedgerHQ/ledger-live/commit/030b42707768af3f9c98a15fc6751f1d64b36fe6)]:
  - @ledgerhq/ledger-wallet-framework@3.0.0-next.0
  - @ledgerhq/types-live@6.120.0-next.0

## 0.43.0

### Minor Changes

- [#20278](https://github.com/LedgerHQ/ledger-live/pull/20278) [`3d24a89`](https://github.com/LedgerHQ/ledger-live/commit/3d24a898d59de55364ec29de29eaecb7ca14425d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop the `@ledgerhq/errors` dependency, completing the errors sunset (LIVE-32915).

  The `@ledgerhq/errors` package is removed from the monorepo: no workspace source imported it anymore, every error class it held now lives in the package that owns it (`@ledgerhq/ledger-wallet-framework/errors` for the ones shared across coin modules). `createCustomErrorClass` and the `serializeError` / `deserializeError` stack are gone with it — define errors as native classes and branch on `error.name`.

  `@ledgerhq/errors@6.37.0` stays on npm for external consumers, but is no longer published from this repo.

- [#20280](https://github.com/LedgerHQ/ledger-live/pull/20280) [`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Stop depending on `@ledgerhq/errors` (LIVE-32915).

  No workspace package declares it anymore, and none may again: `enforce-boundaries` now fails CI on any manifest that does. The classes it held live in the package that owns them, with `@ledgerhq/ledger-wallet-framework/errors` as the shared home below the coin layer.

  The package itself stays in the repo so it keeps being published for external consumers, and is bridged to the external coin packages that still peer-depend on it via `pnpm.packageExtensions` using `workspace:*` (which reuses the single in-repo copy, so the dependency graph keeps exactly the physical copies it had before). [LedgerHQ/coin-modules#752](https://github.com/LedgerHQ/coin-modules/pull/752) removes that peerDependency upstream; once it is released the bridge can be dropped, but the package still needs publishing.

- [#20447](https://github.com/LedgerHQ/ledger-live/pull/20447) [`9e1412e`](https://github.com/LedgerHQ/ledger-live/commit/9e1412e08ccccd4af4a7078a797332ea92f86c63) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - chore(coin-modules): provide validator id

### Patch Changes

- Updated dependencies [[`aee0e64`](https://github.com/LedgerHQ/ledger-live/commit/aee0e64b491aafc1ca8fea16b1ef124cb183770b), [`1e9db75`](https://github.com/LedgerHQ/ledger-live/commit/1e9db750a4882f9db7f95278e33c00262487b37b), [`647804e`](https://github.com/LedgerHQ/ledger-live/commit/647804ee755d54776e6b8cd96328bee89fb035e4), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152)]:
  - @ledgerhq/types-live@6.119.0
  - @ledgerhq/ledger-wallet-framework@2.8.0

## 0.43.0-next.0

### Minor Changes

- [#20278](https://github.com/LedgerHQ/ledger-live/pull/20278) [`3d24a89`](https://github.com/LedgerHQ/ledger-live/commit/3d24a898d59de55364ec29de29eaecb7ca14425d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop the `@ledgerhq/errors` dependency, completing the errors sunset (LIVE-32915).

  The `@ledgerhq/errors` package is removed from the monorepo: no workspace source imported it anymore, every error class it held now lives in the package that owns it (`@ledgerhq/ledger-wallet-framework/errors` for the ones shared across coin modules). `createCustomErrorClass` and the `serializeError` / `deserializeError` stack are gone with it — define errors as native classes and branch on `error.name`.

  `@ledgerhq/errors@6.37.0` stays on npm for external consumers, but is no longer published from this repo.

- [#20280](https://github.com/LedgerHQ/ledger-live/pull/20280) [`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Stop depending on `@ledgerhq/errors` (LIVE-32915).

  No workspace package declares it anymore, and none may again: `enforce-boundaries` now fails CI on any manifest that does. The classes it held live in the package that owns them, with `@ledgerhq/ledger-wallet-framework/errors` as the shared home below the coin layer.

  The package itself stays in the repo so it keeps being published for external consumers, and is bridged to the external coin packages that still peer-depend on it via `pnpm.packageExtensions` using `workspace:*` (which reuses the single in-repo copy, so the dependency graph keeps exactly the physical copies it had before). [LedgerHQ/coin-modules#752](https://github.com/LedgerHQ/coin-modules/pull/752) removes that peerDependency upstream; once it is released the bridge can be dropped, but the package still needs publishing.

- [#20447](https://github.com/LedgerHQ/ledger-live/pull/20447) [`9e1412e`](https://github.com/LedgerHQ/ledger-live/commit/9e1412e08ccccd4af4a7078a797332ea92f86c63) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - chore(coin-modules): provide validator id

### Patch Changes

- Updated dependencies [[`aee0e64`](https://github.com/LedgerHQ/ledger-live/commit/aee0e64b491aafc1ca8fea16b1ef124cb183770b), [`1e9db75`](https://github.com/LedgerHQ/ledger-live/commit/1e9db750a4882f9db7f95278e33c00262487b37b), [`647804e`](https://github.com/LedgerHQ/ledger-live/commit/647804ee755d54776e6b8cd96328bee89fb035e4), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152)]:
  - @ledgerhq/types-live@6.119.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.8.0-next.0

## 0.42.0

### Minor Changes

- [#20280](https://github.com/LedgerHQ/ledger-live/pull/20280) [`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Stop depending on `@ledgerhq/errors` (LIVE-32915).

  No workspace package declares it anymore, and none may again: `enforce-boundaries` now fails CI on any manifest that does. The classes it held live in the package that owns them, with `@ledgerhq/ledger-wallet-framework/errors` as the shared home below the coin layer.

  The package itself stays in the repo so it keeps being published for external consumers, and is bridged to the external coin packages that still peer-depend on it via `pnpm.packageExtensions` using `workspace:*` (which reuses the single in-repo copy, so the dependency graph keeps exactly the physical copies it had before). [LedgerHQ/coin-modules#752](https://github.com/LedgerHQ/coin-modules/pull/752) removes that peerDependency upstream; once it is released the bridge can be dropped, but the package still needs publishing.

- [#19737](https://github.com/LedgerHQ/ledger-live/pull/19737) [`825f50f`](https://github.com/LedgerHQ/ledger-live/commit/825f50fb9989f929c1462d53d0df58a7242261c0) Thanks [@ishaba](https://github.com/ishaba)! - feat(cosmos): integrate coin module alpaca api and cover by coin tester

- [#20245](https://github.com/LedgerHQ/ledger-live/pull/20245) [`b90214c`](https://github.com/LedgerHQ/ledger-live/commit/b90214cf695812b52dc13eabcd930dbdfb6fe081) Thanks [@qperrot](https://github.com/qperrot)! - Fix: new zenrock lcd

### Patch Changes

- Updated dependencies [[`56cfe0b`](https://github.com/LedgerHQ/ledger-live/commit/56cfe0bc6673f416f739c1593abfec718230952d), [`a464f7d`](https://github.com/LedgerHQ/ledger-live/commit/a464f7d6092607ff6b81aa6ec0cd29ef6cfcf35a), [`6a531c5`](https://github.com/LedgerHQ/ledger-live/commit/6a531c54ccd1c65df122286de6f136f9d73b9002), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152), [`635fa12`](https://github.com/LedgerHQ/ledger-live/commit/635fa12d47f5a98858326f4dd68962dffe82eda9)]:
  - @ledgerhq/types-live@6.118.0
  - @ledgerhq/ledger-wallet-framework@2.7.0

## 0.42.0-next.0

### Minor Changes

- [#20280](https://github.com/LedgerHQ/ledger-live/pull/20280) [`9fcbe39`](https://github.com/LedgerHQ/ledger-live/commit/9fcbe39689ff122568ffb031a30dc3805ebb6add) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Stop depending on `@ledgerhq/errors` (LIVE-32915).

  No workspace package declares it anymore, and none may again: `enforce-boundaries` now fails CI on any manifest that does. The classes it held live in the package that owns them, with `@ledgerhq/ledger-wallet-framework/errors` as the shared home below the coin layer.

  The package itself stays in the repo so it keeps being published for external consumers, and is bridged to the external coin packages that still peer-depend on it via `pnpm.packageExtensions` using `workspace:*` (which reuses the single in-repo copy, so the dependency graph keeps exactly the physical copies it had before). [LedgerHQ/coin-modules#752](https://github.com/LedgerHQ/coin-modules/pull/752) removes that peerDependency upstream; once it is released the bridge can be dropped, but the package still needs publishing.

- [#19737](https://github.com/LedgerHQ/ledger-live/pull/19737) [`825f50f`](https://github.com/LedgerHQ/ledger-live/commit/825f50fb9989f929c1462d53d0df58a7242261c0) Thanks [@ishaba](https://github.com/ishaba)! - feat(cosmos): integrate coin module alpaca api and cover by coin tester

- [#20245](https://github.com/LedgerHQ/ledger-live/pull/20245) [`b90214c`](https://github.com/LedgerHQ/ledger-live/commit/b90214cf695812b52dc13eabcd930dbdfb6fe081) Thanks [@qperrot](https://github.com/qperrot)! - Fix: new zenrock lcd

### Patch Changes

- Updated dependencies [[`56cfe0b`](https://github.com/LedgerHQ/ledger-live/commit/56cfe0bc6673f416f739c1593abfec718230952d), [`a464f7d`](https://github.com/LedgerHQ/ledger-live/commit/a464f7d6092607ff6b81aa6ec0cd29ef6cfcf35a), [`6a531c5`](https://github.com/LedgerHQ/ledger-live/commit/6a531c54ccd1c65df122286de6f136f9d73b9002), [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152), [`635fa12`](https://github.com/LedgerHQ/ledger-live/commit/635fa12d47f5a98858326f4dd68962dffe82eda9)]:
  - @ledgerhq/types-live@6.118.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.7.0-next.0

## 0.41.0

### Minor Changes

- [#19980](https://github.com/LedgerHQ/ledger-live/pull/19980) [`ba69273`](https://github.com/LedgerHQ/ledger-live/commit/ba692732b521c42f934acf540641ecbfdb837004) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Convert error classes from createCustomErrorClass factory to native extends Error (LIVE-32915 tier 1a)

- [#19692](https://github.com/LedgerHQ/ledger-live/pull/19692) [`d7600fb`](https://github.com/LedgerHQ/ledger-live/commit/d7600fb21e73581fbfb20019a78109b9a5c9abff) Thanks [@ishaba](https://github.com/ishaba)! - feat(cosmos): implement coin module alpaca api

### Patch Changes

- Updated dependencies [[`1070564`](https://github.com/LedgerHQ/ledger-live/commit/107056410174d3da2d45c468232a8d742aea021f), [`2e1aecc`](https://github.com/LedgerHQ/ledger-live/commit/2e1aeccf6c91761c5d09c91e4be10dcc8c22eb7b), [`1af9ec9`](https://github.com/LedgerHQ/ledger-live/commit/1af9ec984928e0bf5fd23ce12edcc6131b0302a0), [`c475d28`](https://github.com/LedgerHQ/ledger-live/commit/c475d288b4978aa3011c9e76f3e9a1e2f9733010), [`a534db5`](https://github.com/LedgerHQ/ledger-live/commit/a534db5c41da6957d38a330c1da6f7db1b693763), [`c622459`](https://github.com/LedgerHQ/ledger-live/commit/c622459fcbff5dcc094ee10eb360f2a835036007), [`524d763`](https://github.com/LedgerHQ/ledger-live/commit/524d7636d85a79379a9b086323d3121f3199bd1f), [`dbf8acf`](https://github.com/LedgerHQ/ledger-live/commit/dbf8acf27c9405548e7eb559d163a8e0883a20aa)]:
  - @ledgerhq/errors@7.0.0
  - @ledgerhq/ledger-wallet-framework@2.6.0
  - @ledgerhq/live-network@3.0.0
  - @ledgerhq/live-env@3.0.0
  - @ledgerhq/types-live@6.117.0

## 0.41.0-next.0

### Minor Changes

- [#19980](https://github.com/LedgerHQ/ledger-live/pull/19980) [`ba69273`](https://github.com/LedgerHQ/ledger-live/commit/ba692732b521c42f934acf540641ecbfdb837004) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Convert error classes from createCustomErrorClass factory to native extends Error (LIVE-32915 tier 1a)

- [#19692](https://github.com/LedgerHQ/ledger-live/pull/19692) [`d7600fb`](https://github.com/LedgerHQ/ledger-live/commit/d7600fb21e73581fbfb20019a78109b9a5c9abff) Thanks [@ishaba](https://github.com/ishaba)! - feat(cosmos): implement coin module alpaca api

### Patch Changes

- Updated dependencies [[`1070564`](https://github.com/LedgerHQ/ledger-live/commit/107056410174d3da2d45c468232a8d742aea021f), [`2e1aecc`](https://github.com/LedgerHQ/ledger-live/commit/2e1aeccf6c91761c5d09c91e4be10dcc8c22eb7b), [`1af9ec9`](https://github.com/LedgerHQ/ledger-live/commit/1af9ec984928e0bf5fd23ce12edcc6131b0302a0), [`c475d28`](https://github.com/LedgerHQ/ledger-live/commit/c475d288b4978aa3011c9e76f3e9a1e2f9733010), [`a534db5`](https://github.com/LedgerHQ/ledger-live/commit/a534db5c41da6957d38a330c1da6f7db1b693763), [`c622459`](https://github.com/LedgerHQ/ledger-live/commit/c622459fcbff5dcc094ee10eb360f2a835036007), [`524d763`](https://github.com/LedgerHQ/ledger-live/commit/524d7636d85a79379a9b086323d3121f3199bd1f), [`dbf8acf`](https://github.com/LedgerHQ/ledger-live/commit/dbf8acf27c9405548e7eb559d163a8e0883a20aa)]:
  - @ledgerhq/errors@7.0.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.6.0-next.0
  - @ledgerhq/live-network@3.0.0-next.0
  - @ledgerhq/live-env@3.0.0-next.0
  - @ledgerhq/types-live@6.117.0-next.0

## 0.40.0

### Minor Changes

- [#19734](https://github.com/LedgerHQ/ledger-live/pull/19734) [`bb2d2d2`](https://github.com/LedgerHQ/ledger-live/commit/bb2d2d250a1d5b8cde43ba963795d28b10b48be6) Thanks [@ishaba](https://github.com/ishaba)! - remove umee chain related code

- [#19763](https://github.com/LedgerHQ/ledger-live/pull/19763) [`d50d169`](https://github.com/LedgerHQ/ledger-live/commit/d50d16989e968fbb3ff45f6c463cae886e0e566a) Thanks [@amaslakov](https://github.com/amaslakov)! - Fix the Babylon (BABY) undelegation completion date, which showed the chain's 21-day x/staking unbonding time instead of Babylon's ~2-day fast unbonding. On epoched chains the date is now re-anchored to the unbonding's creation height plus the effective unbonding period.

### Patch Changes

- Updated dependencies [[`cdf6cf4`](https://github.com/LedgerHQ/ledger-live/commit/cdf6cf40d658b20dd21a7eabe3615c75baf4cb0a), [`22d4a88`](https://github.com/LedgerHQ/ledger-live/commit/22d4a888228b7e5409593a2d6af072b4ab07bb07), [`6935fe0`](https://github.com/LedgerHQ/ledger-live/commit/6935fe04a6304e046fd217350399446194e96d47), [`e7caf31`](https://github.com/LedgerHQ/ledger-live/commit/e7caf310efbbf82aa777a7e86ceafe60f11e7193), [`bb2d2d2`](https://github.com/LedgerHQ/ledger-live/commit/bb2d2d250a1d5b8cde43ba963795d28b10b48be6), [`c498e25`](https://github.com/LedgerHQ/ledger-live/commit/c498e25ca9f4b6ef5c4e3dfd370dab44ccdebc0f), [`4d99006`](https://github.com/LedgerHQ/ledger-live/commit/4d99006589b6855d1a06a8aa1ece23c3f6f3ddf7)]:
  - @ledgerhq/types-live@6.116.0
  - @ledgerhq/live-network@2.7.0
  - @ledgerhq/ledger-wallet-framework@2.5.0

## 0.40.0-next.0

### Minor Changes

- [#19734](https://github.com/LedgerHQ/ledger-live/pull/19734) [`bb2d2d2`](https://github.com/LedgerHQ/ledger-live/commit/bb2d2d250a1d5b8cde43ba963795d28b10b48be6) Thanks [@ishaba](https://github.com/ishaba)! - remove umee chain related code

- [#19763](https://github.com/LedgerHQ/ledger-live/pull/19763) [`d50d169`](https://github.com/LedgerHQ/ledger-live/commit/d50d16989e968fbb3ff45f6c463cae886e0e566a) Thanks [@amaslakov](https://github.com/amaslakov)! - Fix the Babylon (BABY) undelegation completion date, which showed the chain's 21-day x/staking unbonding time instead of Babylon's ~2-day fast unbonding. On epoched chains the date is now re-anchored to the unbonding's creation height plus the effective unbonding period.

### Patch Changes

- Updated dependencies [[`cdf6cf4`](https://github.com/LedgerHQ/ledger-live/commit/cdf6cf40d658b20dd21a7eabe3615c75baf4cb0a), [`22d4a88`](https://github.com/LedgerHQ/ledger-live/commit/22d4a888228b7e5409593a2d6af072b4ab07bb07), [`6935fe0`](https://github.com/LedgerHQ/ledger-live/commit/6935fe04a6304e046fd217350399446194e96d47), [`e7caf31`](https://github.com/LedgerHQ/ledger-live/commit/e7caf310efbbf82aa777a7e86ceafe60f11e7193), [`bb2d2d2`](https://github.com/LedgerHQ/ledger-live/commit/bb2d2d250a1d5b8cde43ba963795d28b10b48be6), [`c498e25`](https://github.com/LedgerHQ/ledger-live/commit/c498e25ca9f4b6ef5c4e3dfd370dab44ccdebc0f), [`4d99006`](https://github.com/LedgerHQ/ledger-live/commit/4d99006589b6855d1a06a8aa1ece23c3f6f3ddf7)]:
  - @ledgerhq/types-live@6.116.0-next.0
  - @ledgerhq/live-network@2.7.0-next.0
  - @ledgerhq/ledger-wallet-framework@2.5.0-next.0

## 0.39.0

### Minor Changes

- [#19683](https://github.com/LedgerHQ/ledger-live/pull/19683) [`4b73f23`](https://github.com/LedgerHQ/ledger-live/commit/4b73f23260ecc28574f46a7fd0f5cd7627d6d13f) Thanks [@ysitbon](https://github.com/ysitbon)! - Consume currency accessors and currency types from `@ledgerhq/ledger-wallet-framework` instead of `@ledgerhq/cryptoassets`/`@ledgerhq/types-cryptoassets`. Value accessors now resolve through the framework's injected `CurrenciesResolver`; `CryptoCurrency`/`TokenCurrency`/`Unit`/`ExplorerView` types are imported from the framework.

- [#19396](https://github.com/LedgerHQ/ledger-live/pull/19396) [`25fd71b`](https://github.com/LedgerHQ/ledger-live/commit/25fd71b4caaa8781101dad205669773b234d86c0) Thanks [@amaslakov](https://github.com/amaslakov)! - Hide the "Compound" claim-rewards option for Cosmos-family chains that use epoching (wrapped) staking messages, such as Babylon. Compound restaking is not supported on those chains yet — its embedded delegate is not epoching-wrapped — so only "Cash in" (claim rewards) is offered, preventing the "claimRewardCompound is not supported" error.

- [#19501](https://github.com/LedgerHQ/ledger-live/pull/19501) [`9824fc8`](https://github.com/LedgerHQ/ledger-live/commit/9824fc8e03b55afe020e87a7f55fe44104f69e1b) Thanks [@amaslakov](https://github.com/amaslakov)! - Fix the Cosmos-family "Undelegating" tooltip in the desktop account summary footer, which hardcoded a 21-day timelock for every chain. It now uses each chain's actual unbonding period (e.g. ~2 days for Babylon, 14 for Osmosis, 30 for dYdX), matching the value already shown in the delegation section.

  Also make the Cosmos chain factory alias the crypto_org_croeseid testnet to crypto_org, so it resolves chain params instead of throwing (previously only the osmosis alias was handled).

- [#19425](https://github.com/LedgerHQ/ledger-live/pull/19425) [`35f0138`](https://github.com/LedgerHQ/ledger-live/commit/35f0138542fbd98f664b24ee786fc662d7223e10) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(xion): rebrand Xion to Verona (display name/ticker XION -> VERONA, main unit code XION -> VERONA, base denom uxion unchanged) and backport the coin-cosmos default LCD to verona-api.polkachu.com

### Patch Changes

- Updated dependencies [[`8f30c75`](https://github.com/LedgerHQ/ledger-live/commit/8f30c75ecb553a720722f1e039b4aec53fce2a87), [`0f85077`](https://github.com/LedgerHQ/ledger-live/commit/0f850774ae3b46fd4a06c0da5762d3d4211b26af), [`a15b864`](https://github.com/LedgerHQ/ledger-live/commit/a15b864576d901f15d480070b475314c3b23c1dd), [`e26e68e`](https://github.com/LedgerHQ/ledger-live/commit/e26e68e854ecea6ebbe5e26196c8d8e899329c7d), [`bde85a7`](https://github.com/LedgerHQ/ledger-live/commit/bde85a7ef50cf7990efd2f9bcd7ccc34c0764fb7), [`fc44f1e`](https://github.com/LedgerHQ/ledger-live/commit/fc44f1e6ddcca939c117e0cb8bc49c404163b003), [`d631f0d`](https://github.com/LedgerHQ/ledger-live/commit/d631f0dd2480950c5f20dec0c9b4aca515ec63f8), [`6ef44af`](https://github.com/LedgerHQ/ledger-live/commit/6ef44afa6807ace32b3f6620173868f2ef20e158), [`6ef44af`](https://github.com/LedgerHQ/ledger-live/commit/6ef44afa6807ace32b3f6620173868f2ef20e158)]:
  - @ledgerhq/ledger-wallet-framework@2.4.0
  - @ledgerhq/live-env@2.42.0
  - @ledgerhq/types-live@6.115.0
  - @ledgerhq/live-network@2.6.8

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->

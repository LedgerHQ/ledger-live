# @ledgerhq/coin-solana

## 2.5.0

### Minor Changes

- [#23295](https://github.com/LedgerHQ/ledger-live/pull/23295) [`98c994b`](https://github.com/LedgerHQ/ledger-live/commit/98c994bc1f46a03366096531afac2471f07f397b) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(solana): refresh the blockhash after the device review to avoid "Blockhash not found"

- [#23349](https://github.com/LedgerHQ/ledger-live/pull/23349) [`6639142`](https://github.com/LedgerHQ/ledger-live/commit/6639142cc619d0758ba7873dafbc3e32944f250f) Thanks [@qperrot](https://github.com/qperrot)! - Use config.name instead of intent.asset.name as currency name in validateIntent

- [#23190](https://github.com/LedgerHQ/ledger-live/pull/23190) [`696357f`](https://github.com/LedgerHQ/ledger-live/commit/696357f754751853758d67c88bf34df9302b9b97) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(coin-solana): partition the native balance between the system account and the stake accounts, summed by the generic adapter through `partitionsNativeBalance` and the family's `getHeldNativeAmount`, so delegated SOL is counted once

- [#23320](https://github.com/LedgerHQ/ledger-live/pull/23320) [`5aa4154`](https://github.com/LedgerHQ/ledger-live/commit/5aa41540bc68cb4fedfe45d4cc8d0105ba36cb66) Thanks [@qperrot](https://github.com/qperrot)! - Remove the unused `parseAPIValue` export

- [#21840](https://github.com/LedgerHQ/ledger-live/pull/21840) [`dbed44c`](https://github.com/LedgerHQ/ledger-live/commit/dbed44ca28d6bdb0291bb66247cce0a524f6c805) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Remove the Solana legacy bridge, now that the family is served by the generic coin framework: `prepareTransaction`, `getTransactionStatus`, `signOperation`, `createTransaction`, `estimateMaxSpendable`, the synchronisation, the transaction serializer, the device transaction config, the on-chain instruction parsers and the helpers and types only they used are deleted. `rxjs` goes with them.

  The deterministic tester drops its legacy strategy and runs the generic adapter alone.

- [#23672](https://github.com/LedgerHQ/ledger-live/pull/23672) [`fe74104`](https://github.com/LedgerHQ/ledger-live/commit/fe74104174a41357be9cb911d9b762e4360cbf46) Thanks [@henri-ly](https://github.com/henri-ly)! - fix(coin-solana): check the stake minimum before a validator is picked

  The mobile delegation flow asks for the amount before the validator, so the recipient is still empty when the amount is validated. The minimum-delegation check was skipped in that case, which let an amount below 1 SOL through to the summary. The summary now also shows its validation error in the alert colour.

### Patch Changes

- Updated dependencies [[`80f99a8`](https://github.com/LedgerHQ/ledger-live/commit/80f99a819b13d3ec2bd39d896de46e0a433b9954), [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574), [`75498cf`](https://github.com/LedgerHQ/ledger-live/commit/75498cf55065bccf17d09b780866ae031c01701a), [`e66d21e`](https://github.com/LedgerHQ/ledger-live/commit/e66d21ea7ccb706d718703b69d2133ede3294c1a), [`98c994b`](https://github.com/LedgerHQ/ledger-live/commit/98c994bc1f46a03366096531afac2471f07f397b), [`696357f`](https://github.com/LedgerHQ/ledger-live/commit/696357f754751853758d67c88bf34df9302b9b97)]:
  - @ledgerhq/ledger-wallet-framework@3.8.0
  - @ledgerhq/types-live@6.128.0

## 2.5.0-next.1

### Minor Changes

- [#23672](https://github.com/LedgerHQ/ledger-live/pull/23672) [`fe74104`](https://github.com/LedgerHQ/ledger-live/commit/fe74104174a41357be9cb911d9b762e4360cbf46) Thanks [@henri-ly](https://github.com/henri-ly)! - fix(coin-solana): check the stake minimum before a validator is picked

  The mobile delegation flow asks for the amount before the validator, so the recipient is still empty when the amount is validated. The minimum-delegation check was skipped in that case, which let an amount below 1 SOL through to the summary. The summary now also shows its validation error in the alert colour.

## 2.5.0-next.0

### Minor Changes

- [#23295](https://github.com/LedgerHQ/ledger-live/pull/23295) [`98c994b`](https://github.com/LedgerHQ/ledger-live/commit/98c994bc1f46a03366096531afac2471f07f397b) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(solana): refresh the blockhash after the device review to avoid "Blockhash not found"

- [#23349](https://github.com/LedgerHQ/ledger-live/pull/23349) [`6639142`](https://github.com/LedgerHQ/ledger-live/commit/6639142cc619d0758ba7873dafbc3e32944f250f) Thanks [@qperrot](https://github.com/qperrot)! - Use config.name instead of intent.asset.name as currency name in validateIntent

- [#23190](https://github.com/LedgerHQ/ledger-live/pull/23190) [`696357f`](https://github.com/LedgerHQ/ledger-live/commit/696357f754751853758d67c88bf34df9302b9b97) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(coin-solana): partition the native balance between the system account and the stake accounts, summed by the generic adapter through `partitionsNativeBalance` and the family's `getHeldNativeAmount`, so delegated SOL is counted once

- [#23320](https://github.com/LedgerHQ/ledger-live/pull/23320) [`5aa4154`](https://github.com/LedgerHQ/ledger-live/commit/5aa41540bc68cb4fedfe45d4cc8d0105ba36cb66) Thanks [@qperrot](https://github.com/qperrot)! - Remove the unused `parseAPIValue` export

- [#21840](https://github.com/LedgerHQ/ledger-live/pull/21840) [`dbed44c`](https://github.com/LedgerHQ/ledger-live/commit/dbed44ca28d6bdb0291bb66247cce0a524f6c805) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Remove the Solana legacy bridge, now that the family is served by the generic coin framework: `prepareTransaction`, `getTransactionStatus`, `signOperation`, `createTransaction`, `estimateMaxSpendable`, the synchronisation, the transaction serializer, the device transaction config, the on-chain instruction parsers and the helpers and types only they used are deleted. `rxjs` goes with them.

  The deterministic tester drops its legacy strategy and runs the generic adapter alone.

### Patch Changes

- Updated dependencies [[`80f99a8`](https://github.com/LedgerHQ/ledger-live/commit/80f99a819b13d3ec2bd39d896de46e0a433b9954), [`f40b1c2`](https://github.com/LedgerHQ/ledger-live/commit/f40b1c20948a5c7921796926f620201f1bb8d574), [`75498cf`](https://github.com/LedgerHQ/ledger-live/commit/75498cf55065bccf17d09b780866ae031c01701a), [`e66d21e`](https://github.com/LedgerHQ/ledger-live/commit/e66d21ea7ccb706d718703b69d2133ede3294c1a), [`98c994b`](https://github.com/LedgerHQ/ledger-live/commit/98c994bc1f46a03366096531afac2471f07f397b), [`696357f`](https://github.com/LedgerHQ/ledger-live/commit/696357f754751853758d67c88bf34df9302b9b97)]:
  - @ledgerhq/ledger-wallet-framework@3.8.0-next.0
  - @ledgerhq/types-live@6.128.0-next.0

## 2.4.0

### Minor Changes

- [#23297](https://github.com/LedgerHQ/ledger-live/pull/23297) [`2989e37`](https://github.com/LedgerHQ/ledger-live/commit/2989e37b80b8bfcaae549cc02aa6de189a69dfef) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(solana): refresh the blockhash after the device review to avoid "Blockhash not found"

- [#23181](https://github.com/LedgerHQ/ledger-live/pull/23181) [`406eab8`](https://github.com/LedgerHQ/ledger-live/commit/406eab877fd65339b4e7c6272beb3daa54b3b192) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(coin-solana): don't mark token operations as internal / don't double count fees in token operations

- [#21839](https://github.com/LedgerHQ/ledger-live/pull/21839) [`6d744e0`](https://github.com/LedgerHQ/ledger-live/commit/6d744e0d30b4480282d35c359d096f3f6d6602af) Thanks [@YazhuEth](https://github.com/YazhuEth)! - `estimateFees` now returns the recipient token account, wallet address and input type of an SPL transfer alongside its fee, so the device screen names the destination; a recipient token account holding another token throws `SolanaTokenAccountHoldsAnotherToken`.

  `makeEmptyTokenAccount` now builds its id with `encodeTokenAccountId`, like the fourteen families that already do: the wallet-API placeholder previously used the contract address, so it matched no real sub-account id.

  Solana runs on the generic coin framework. The send and staking screens move onto the generic transaction shape, which names what it does — a mode, a memo, a stake account seed — instead of the nested command model the legacy bridge carried, and the apps now read it through one family module rather than reaching into the transaction themselves.

  The behaviours the legacy bridge produced are restored on the generic path: an incoming SPL transfer produces an operation, a stake withdrawal empties the account rather than signing a stale amount, opening a token account is charged its rent, sending the maximum to a new stake account leaves enough to unstake it later, the device confirmation screen lists every row the device itself shows, and a token account's frozen state and Token-2022 extensions are back on screen.

  A live app can again submit the four token and stake commands the wallet API defines, and a raw signature it gets back is hex, as the field it arrives in says. The device signer is selected through the family's own factory, so the `ldmkSolanaSigner` flag and the transaction-check option it carries keep deciding, as they did before. The mock bridge is rewritten on the coin module, so a mocked signature still yields a transaction the wallet API can deserialize.

- [#22989](https://github.com/LedgerHQ/ledger-live/pull/22989) [`8312d68`](https://github.com/LedgerHQ/ledger-live/commit/8312d6818aa5fa37f523352f81f51a61dd502bf2) Thanks [@gre-ledger](https://github.com/gre-ledger)! - chore: take `uuid` from the pnpm catalog (11.1.0)

  `uuid` was spread over 8.3.2, 9.0.1 and 11.1.0. Every package now uses the catalog entry. `@types/uuid` is dropped: 11 ships its own types. The repo only imports `v4`, `v5` and `parse` (`parse` in a coin-solana test fixture), which behave the same across these majors. 11 types `v4` with overloads, so passing it directly as a callback (`useState(uuid)`) no longer typechecks and is now wrapped (`useState(() => uuid())`).

### Patch Changes

- Updated dependencies [[`20484ff`](https://github.com/LedgerHQ/ledger-live/commit/20484ff8d7cc0aab2e4b8448c7e8ce9ebf6840fe), [`f047501`](https://github.com/LedgerHQ/ledger-live/commit/f047501381efde857b48c1314d2de637fdce8ade), [`bf29f88`](https://github.com/LedgerHQ/ledger-live/commit/bf29f888316e5d8d9049b763a8c77ce9850f07df), [`3347eb8`](https://github.com/LedgerHQ/ledger-live/commit/3347eb88f282e2286b43493dadb0a9dd3d1f81d5), [`90e805d`](https://github.com/LedgerHQ/ledger-live/commit/90e805d9c1b0ef536d1e53489c73b88056731993), [`9c9cae5`](https://github.com/LedgerHQ/ledger-live/commit/9c9cae5ab492b74d52b13e0a5b0673bd681f8d9d), [`2989e37`](https://github.com/LedgerHQ/ledger-live/commit/2989e37b80b8bfcaae549cc02aa6de189a69dfef), [`6f2ecf8`](https://github.com/LedgerHQ/ledger-live/commit/6f2ecf89dd1d978038f573738d6e85fe1805b5d9), [`18166fb`](https://github.com/LedgerHQ/ledger-live/commit/18166fbe8719d50c911aa0ab349e68c414f8fc62), [`dce4fb6`](https://github.com/LedgerHQ/ledger-live/commit/dce4fb6a4ec291153cc5b4d5a0d5000f777007e1), [`2b2eee6`](https://github.com/LedgerHQ/ledger-live/commit/2b2eee6a4abfb86615f3e5a628f518b5a9c58dad), [`6d744e0`](https://github.com/LedgerHQ/ledger-live/commit/6d744e0d30b4480282d35c359d096f3f6d6602af), [`bcd25fd`](https://github.com/LedgerHQ/ledger-live/commit/bcd25fd87bda9e7e8b7c3ee2a243d3e241adc0b0), [`91ac227`](https://github.com/LedgerHQ/ledger-live/commit/91ac22740fbf677ca481382eb55d2e4e12336d2a), [`f482212`](https://github.com/LedgerHQ/ledger-live/commit/f48221278738b5b3accf7199c23e6dd84c48c27e), [`8312d68`](https://github.com/LedgerHQ/ledger-live/commit/8312d6818aa5fa37f523352f81f51a61dd502bf2), [`c5c2815`](https://github.com/LedgerHQ/ledger-live/commit/c5c2815ec53dbf88804e558952f1451f13c37bb4)]:
  - @ledgerhq/ledger-wallet-framework@3.7.0
  - @ledgerhq/types-live@6.127.0

## 2.4.0-next.1

### Minor Changes

- [#23297](https://github.com/LedgerHQ/ledger-live/pull/23297) [`2989e37`](https://github.com/LedgerHQ/ledger-live/commit/2989e37b80b8bfcaae549cc02aa6de189a69dfef) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(solana): refresh the blockhash after the device review to avoid "Blockhash not found"

### Patch Changes

- Updated dependencies [[`2989e37`](https://github.com/LedgerHQ/ledger-live/commit/2989e37b80b8bfcaae549cc02aa6de189a69dfef)]:
  - @ledgerhq/ledger-wallet-framework@3.7.0-next.1

## 2.4.0-next.0

### Minor Changes

- [#23181](https://github.com/LedgerHQ/ledger-live/pull/23181) [`406eab8`](https://github.com/LedgerHQ/ledger-live/commit/406eab877fd65339b4e7c6272beb3daa54b3b192) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(coin-solana): don't mark token operations as internal / don't double count fees in token operations

- [#21839](https://github.com/LedgerHQ/ledger-live/pull/21839) [`6d744e0`](https://github.com/LedgerHQ/ledger-live/commit/6d744e0d30b4480282d35c359d096f3f6d6602af) Thanks [@YazhuEth](https://github.com/YazhuEth)! - `estimateFees` now returns the recipient token account, wallet address and input type of an SPL transfer alongside its fee, so the device screen names the destination; a recipient token account holding another token throws `SolanaTokenAccountHoldsAnotherToken`.

  `makeEmptyTokenAccount` now builds its id with `encodeTokenAccountId`, like the fourteen families that already do: the wallet-API placeholder previously used the contract address, so it matched no real sub-account id.

  Solana runs on the generic coin framework. The send and staking screens move onto the generic transaction shape, which names what it does — a mode, a memo, a stake account seed — instead of the nested command model the legacy bridge carried, and the apps now read it through one family module rather than reaching into the transaction themselves.

  The behaviours the legacy bridge produced are restored on the generic path: an incoming SPL transfer produces an operation, a stake withdrawal empties the account rather than signing a stale amount, opening a token account is charged its rent, sending the maximum to a new stake account leaves enough to unstake it later, the device confirmation screen lists every row the device itself shows, and a token account's frozen state and Token-2022 extensions are back on screen.

  A live app can again submit the four token and stake commands the wallet API defines, and a raw signature it gets back is hex, as the field it arrives in says. The device signer is selected through the family's own factory, so the `ldmkSolanaSigner` flag and the transaction-check option it carries keep deciding, as they did before. The mock bridge is rewritten on the coin module, so a mocked signature still yields a transaction the wallet API can deserialize.

- [#22989](https://github.com/LedgerHQ/ledger-live/pull/22989) [`8312d68`](https://github.com/LedgerHQ/ledger-live/commit/8312d6818aa5fa37f523352f81f51a61dd502bf2) Thanks [@gre-ledger](https://github.com/gre-ledger)! - chore: take `uuid` from the pnpm catalog (11.1.0)

  `uuid` was spread over 8.3.2, 9.0.1 and 11.1.0. Every package now uses the catalog entry. `@types/uuid` is dropped: 11 ships its own types. The repo only imports `v4`, `v5` and `parse` (`parse` in a coin-solana test fixture), which behave the same across these majors. 11 types `v4` with overloads, so passing it directly as a callback (`useState(uuid)`) no longer typechecks and is now wrapped (`useState(() => uuid())`).

### Patch Changes

- Updated dependencies [[`20484ff`](https://github.com/LedgerHQ/ledger-live/commit/20484ff8d7cc0aab2e4b8448c7e8ce9ebf6840fe), [`f047501`](https://github.com/LedgerHQ/ledger-live/commit/f047501381efde857b48c1314d2de637fdce8ade), [`bf29f88`](https://github.com/LedgerHQ/ledger-live/commit/bf29f888316e5d8d9049b763a8c77ce9850f07df), [`3347eb8`](https://github.com/LedgerHQ/ledger-live/commit/3347eb88f282e2286b43493dadb0a9dd3d1f81d5), [`90e805d`](https://github.com/LedgerHQ/ledger-live/commit/90e805d9c1b0ef536d1e53489c73b88056731993), [`9c9cae5`](https://github.com/LedgerHQ/ledger-live/commit/9c9cae5ab492b74d52b13e0a5b0673bd681f8d9d), [`6f2ecf8`](https://github.com/LedgerHQ/ledger-live/commit/6f2ecf89dd1d978038f573738d6e85fe1805b5d9), [`18166fb`](https://github.com/LedgerHQ/ledger-live/commit/18166fbe8719d50c911aa0ab349e68c414f8fc62), [`dce4fb6`](https://github.com/LedgerHQ/ledger-live/commit/dce4fb6a4ec291153cc5b4d5a0d5000f777007e1), [`2b2eee6`](https://github.com/LedgerHQ/ledger-live/commit/2b2eee6a4abfb86615f3e5a628f518b5a9c58dad), [`6d744e0`](https://github.com/LedgerHQ/ledger-live/commit/6d744e0d30b4480282d35c359d096f3f6d6602af), [`bcd25fd`](https://github.com/LedgerHQ/ledger-live/commit/bcd25fd87bda9e7e8b7c3ee2a243d3e241adc0b0), [`91ac227`](https://github.com/LedgerHQ/ledger-live/commit/91ac22740fbf677ca481382eb55d2e4e12336d2a), [`f482212`](https://github.com/LedgerHQ/ledger-live/commit/f48221278738b5b3accf7199c23e6dd84c48c27e), [`8312d68`](https://github.com/LedgerHQ/ledger-live/commit/8312d6818aa5fa37f523352f81f51a61dd502bf2), [`c5c2815`](https://github.com/LedgerHQ/ledger-live/commit/c5c2815ec53dbf88804e558952f1451f13c37bb4)]:
  - @ledgerhq/ledger-wallet-framework@3.7.0-next.0
  - @ledgerhq/types-live@6.127.0-next.0

## 2.3.0

### Minor Changes

- [#21953](https://github.com/LedgerHQ/ledger-live/pull/21953) [`381bd0b`](https://github.com/LedgerHQ/ledger-live/commit/381bd0befb6a09f20f13f65c233f0e1479e7051d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Consume `@ledgerhq/live-config`, `@ledgerhq/live-env`, `@ledgerhq/live-currency-format`,
  `@ledgerhq/domain-service` and `@ledgerhq/evm-tools` from npm instead of the workspace — they
  now live in the `ts-libs` repository. No API change.

### Patch Changes

- Updated dependencies [[`2d869a5`](https://github.com/LedgerHQ/ledger-live/commit/2d869a596a4562a00003de01cc657d7277dc6b7c), [`f1d8aac`](https://github.com/LedgerHQ/ledger-live/commit/f1d8aac1c7c0bc0be9beb1508c1a9ef3cf7affae), [`381bd0b`](https://github.com/LedgerHQ/ledger-live/commit/381bd0befb6a09f20f13f65c233f0e1479e7051d), [`a025d7a`](https://github.com/LedgerHQ/ledger-live/commit/a025d7a872b7b1e4681d16b2bfb54f8949bf6626), [`a896fca`](https://github.com/LedgerHQ/ledger-live/commit/a896fca1974a46f10e915d1212e0947e2d808ad5), [`8c486aa`](https://github.com/LedgerHQ/ledger-live/commit/8c486aabe3dbd100b21e43d3f344fda5142858ed), [`88bae04`](https://github.com/LedgerHQ/ledger-live/commit/88bae04e2f7e7a3de8d55c340fe32b48e37bd78d)]:
  - @ledgerhq/types-live@6.126.0
  - @ledgerhq/ledger-wallet-framework@3.6.0

## 2.3.0-next.0

### Minor Changes

- [#21953](https://github.com/LedgerHQ/ledger-live/pull/21953) [`381bd0b`](https://github.com/LedgerHQ/ledger-live/commit/381bd0befb6a09f20f13f65c233f0e1479e7051d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Consume `@ledgerhq/live-config`, `@ledgerhq/live-env`, `@ledgerhq/live-currency-format`,
  `@ledgerhq/domain-service` and `@ledgerhq/evm-tools` from npm instead of the workspace — they
  now live in the `ts-libs` repository. No API change.

### Patch Changes

- Updated dependencies [[`2d869a5`](https://github.com/LedgerHQ/ledger-live/commit/2d869a596a4562a00003de01cc657d7277dc6b7c), [`f1d8aac`](https://github.com/LedgerHQ/ledger-live/commit/f1d8aac1c7c0bc0be9beb1508c1a9ef3cf7affae), [`381bd0b`](https://github.com/LedgerHQ/ledger-live/commit/381bd0befb6a09f20f13f65c233f0e1479e7051d), [`a025d7a`](https://github.com/LedgerHQ/ledger-live/commit/a025d7a872b7b1e4681d16b2bfb54f8949bf6626), [`a896fca`](https://github.com/LedgerHQ/ledger-live/commit/a896fca1974a46f10e915d1212e0947e2d808ad5), [`8c486aa`](https://github.com/LedgerHQ/ledger-live/commit/8c486aabe3dbd100b21e43d3f344fda5142858ed), [`88bae04`](https://github.com/LedgerHQ/ledger-live/commit/88bae04e2f7e7a3de8d55c340fe32b48e37bd78d)]:
  - @ledgerhq/types-live@6.126.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.6.0-next.0

## 2.2.0

### Minor Changes

- [#22343](https://github.com/LedgerHQ/ledger-live/pull/22343) [`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop the `documentation` doc-gen CLI: remove the `doc` script and `documentation` devDependency, and the related `micromark` patch in `.pnpmfile.cjs`

- [#21836](https://github.com/LedgerHQ/ledger-live/pull/21836) [`31208bf`](https://github.com/LedgerHQ/ledger-live/commit/31208bfbd73f45dbdd817802e6468211cba77de6) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Preparation for running Solana on the generic coin framework, with no effect on the app yet: the family is still served by its legacy bridge.

  The coin module's read path now reports what an account actually holds. A balance lists the associated SPL and Token-2022 account of every mint held rather than the native one alone, a staking position carries the stake account it belongs to and its locked reserve, an operation list follows each token account's own signatures instead of only the owner's, operations come back newest-first whichever account they were found through, a token operation names only the counterparties of its own mint — so each leg of a swap no longer shows the other's — and a new `buildTokenAccountShapes` reports a token account's frozen state and its Token-2022 extensions — reading the epoch at most once per call, and never without a transfer-fee extension.

- [#21838](https://github.com/LedgerHQ/ledger-live/pull/21838) [`c55b967`](https://github.com/LedgerHQ/ledger-live/commit/c55b967ed644a1639fb385281b75923532f7f0b7) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Preparation for running Solana on the generic coin framework, with no effect on the app yet: the family is still served by its legacy bridge.

  The coin module validates an intent the way the legacy bridge validated a transaction, so the send and staking screens will refuse what the chain would refuse: a recipient that is not funded or sits off the ed25519 curve, a frozen or non-existent token account, a recipient that is the sender's own associated token account, an amount that leaves too little for the rent or for a later unstake, a memo that is too long, and a stake account in a state the requested command cannot act on. Opening a recipient's associated token account is reported as a warning with its rent, rather than rejected.

  Restored alongside, each a check the legacy bridge had: a stake split requires an amount, an approval or a revocation is refused against a frozen or uninitialized token account, a Token-2022 transfer fee counts against the token balance rather than only the recipient's share, a token authority command is paid from the actually spendable balance rather than one that still counts the rent and the unstake reserve, a recipient whose derived token account address holds lamports without being a token account is refused instead of reaching the chain, opening a token account that already exists is refused rather than built on a non-idempotent instruction, approving or revoking against an account that does not exist is refused, an approval whose delegate is the sender's own token account is refused, and staking the maximum when nothing would be left reports an insufficient balance.

- [#21837](https://github.com/LedgerHQ/ledger-live/pull/21837) [`8dead4f`](https://github.com/LedgerHQ/ledger-live/commit/8dead4fcb776189c366401305586323ee9df0525) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Preparation for running Solana on the generic coin framework, with no effect on the app yet: the family is still served by its legacy bridge.

  The coin module can now craft and price every command the family exposes — a stake creation, delegation, deactivation and withdrawal, a token account opening, an approval and a revocation, and a transaction a partner already built — and charges each its true cost, including an associated token account's rent and the reserve a new stake account must keep to be unstaked later. Token-2022 transfer fees are computed in both directions, so sending a maximum amount no longer overshoots.

  A stake split and a token account opening are now priced on their own dummy transaction rather than on an unrelated one, and a fee estimate is measured on the token program the crafted transaction will actually use — read off the mint, as crafting reads it. Opening an associated token account for a Token-2022 mint declares that program, so the address the account is created at matches the one it was derived from.

  One change reaches the legacy send flow, which shares `broadcast`: a transaction the cluster did not confirm in time now surfaces as a named timeout error rather than a bare one, and a failed simulation is logged before it is thrown.

### Patch Changes

- Updated dependencies [[`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68), [`a62ad28`](https://github.com/LedgerHQ/ledger-live/commit/a62ad28e4900a887567fb61fb8f197af4fa5a23b), [`5d2f40f`](https://github.com/LedgerHQ/ledger-live/commit/5d2f40f470f859960e43a2a08755a962796f6beb), [`d59d123`](https://github.com/LedgerHQ/ledger-live/commit/d59d123a2ba037b44507b1f5424e31f05309ec26), [`40251b4`](https://github.com/LedgerHQ/ledger-live/commit/40251b41a62b2381c5c79410073a5f0b3c1fe629), [`e2134f5`](https://github.com/LedgerHQ/ledger-live/commit/e2134f5cffe4669ff5896e2b52904fe22218461b)]:
  - @ledgerhq/ledger-wallet-framework@3.5.0
  - @ledgerhq/types-live@6.125.0
  - @ledgerhq/live-env@4.1.0

## 2.2.0-next.0

### Minor Changes

- [#22343](https://github.com/LedgerHQ/ledger-live/pull/22343) [`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop the `documentation` doc-gen CLI: remove the `doc` script and `documentation` devDependency, and the related `micromark` patch in `.pnpmfile.cjs`

- [#21836](https://github.com/LedgerHQ/ledger-live/pull/21836) [`31208bf`](https://github.com/LedgerHQ/ledger-live/commit/31208bfbd73f45dbdd817802e6468211cba77de6) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Preparation for running Solana on the generic coin framework, with no effect on the app yet: the family is still served by its legacy bridge.

  The coin module's read path now reports what an account actually holds. A balance lists the associated SPL and Token-2022 account of every mint held rather than the native one alone, a staking position carries the stake account it belongs to and its locked reserve, an operation list follows each token account's own signatures instead of only the owner's, operations come back newest-first whichever account they were found through, a token operation names only the counterparties of its own mint — so each leg of a swap no longer shows the other's — and a new `buildTokenAccountShapes` reports a token account's frozen state and its Token-2022 extensions — reading the epoch at most once per call, and never without a transfer-fee extension.

- [#21838](https://github.com/LedgerHQ/ledger-live/pull/21838) [`c55b967`](https://github.com/LedgerHQ/ledger-live/commit/c55b967ed644a1639fb385281b75923532f7f0b7) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Preparation for running Solana on the generic coin framework, with no effect on the app yet: the family is still served by its legacy bridge.

  The coin module validates an intent the way the legacy bridge validated a transaction, so the send and staking screens will refuse what the chain would refuse: a recipient that is not funded or sits off the ed25519 curve, a frozen or non-existent token account, a recipient that is the sender's own associated token account, an amount that leaves too little for the rent or for a later unstake, a memo that is too long, and a stake account in a state the requested command cannot act on. Opening a recipient's associated token account is reported as a warning with its rent, rather than rejected.

  Restored alongside, each a check the legacy bridge had: a stake split requires an amount, an approval or a revocation is refused against a frozen or uninitialized token account, a Token-2022 transfer fee counts against the token balance rather than only the recipient's share, a token authority command is paid from the actually spendable balance rather than one that still counts the rent and the unstake reserve, a recipient whose derived token account address holds lamports without being a token account is refused instead of reaching the chain, opening a token account that already exists is refused rather than built on a non-idempotent instruction, approving or revoking against an account that does not exist is refused, an approval whose delegate is the sender's own token account is refused, and staking the maximum when nothing would be left reports an insufficient balance.

- [#21837](https://github.com/LedgerHQ/ledger-live/pull/21837) [`8dead4f`](https://github.com/LedgerHQ/ledger-live/commit/8dead4fcb776189c366401305586323ee9df0525) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Preparation for running Solana on the generic coin framework, with no effect on the app yet: the family is still served by its legacy bridge.

  The coin module can now craft and price every command the family exposes — a stake creation, delegation, deactivation and withdrawal, a token account opening, an approval and a revocation, and a transaction a partner already built — and charges each its true cost, including an associated token account's rent and the reserve a new stake account must keep to be unstaked later. Token-2022 transfer fees are computed in both directions, so sending a maximum amount no longer overshoots.

  A stake split and a token account opening are now priced on their own dummy transaction rather than on an unrelated one, and a fee estimate is measured on the token program the crafted transaction will actually use — read off the mint, as crafting reads it. Opening an associated token account for a Token-2022 mint declares that program, so the address the account is created at matches the one it was derived from.

  One change reaches the legacy send flow, which shares `broadcast`: a transaction the cluster did not confirm in time now surfaces as a named timeout error rather than a bare one, and a failed simulation is logged before it is thrown.

### Patch Changes

- Updated dependencies [[`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68), [`a62ad28`](https://github.com/LedgerHQ/ledger-live/commit/a62ad28e4900a887567fb61fb8f197af4fa5a23b), [`5d2f40f`](https://github.com/LedgerHQ/ledger-live/commit/5d2f40f470f859960e43a2a08755a962796f6beb), [`d59d123`](https://github.com/LedgerHQ/ledger-live/commit/d59d123a2ba037b44507b1f5424e31f05309ec26), [`40251b4`](https://github.com/LedgerHQ/ledger-live/commit/40251b41a62b2381c5c79410073a5f0b3c1fe629), [`e2134f5`](https://github.com/LedgerHQ/ledger-live/commit/e2134f5cffe4669ff5896e2b52904fe22218461b)]:
  - @ledgerhq/ledger-wallet-framework@3.5.0-next.0
  - @ledgerhq/types-live@6.125.0-next.0
  - @ledgerhq/live-env@4.1.0-next.0

## 2.1.1

### Patch Changes

- Updated dependencies [[`85e01c4`](https://github.com/LedgerHQ/ledger-live/commit/85e01c449dab75d75851631a56d292f2cb0c5b36), [`dc204a7`](https://github.com/LedgerHQ/ledger-live/commit/dc204a7633e6f7c9acb66fbb18a6aeaa2e75c4bb), [`5ddb9ab`](https://github.com/LedgerHQ/ledger-live/commit/5ddb9ab2874a6715d706042701e8b2242b1c14b9)]:
  - @ledgerhq/types-live@6.124.0
  - @ledgerhq/ledger-wallet-framework@3.4.0

## 2.1.1-next.0

### Patch Changes

- Updated dependencies [[`85e01c4`](https://github.com/LedgerHQ/ledger-live/commit/85e01c449dab75d75851631a56d292f2cb0c5b36), [`dc204a7`](https://github.com/LedgerHQ/ledger-live/commit/dc204a7633e6f7c9acb66fbb18a6aeaa2e75c4bb), [`5ddb9ab`](https://github.com/LedgerHQ/ledger-live/commit/5ddb9ab2874a6715d706042701e8b2242b1c14b9)]:
  - @ledgerhq/types-live@6.124.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.4.0-next.0

## 2.1.0

### Minor Changes

- [#21318](https://github.com/LedgerHQ/ledger-live/pull/21318) [`e1e7cb2`](https://github.com/LedgerHQ/ledger-live/commit/e1e7cb2fa32ef3b413f8e598687f05780ad1c0e8) Thanks [@henri-ly](https://github.com/henri-ly)! - Fix Solana account synchronization failing when the RPC provider deprioritizes stake
  account discovery. Stake accounts are now enumerated with the paginated
  getProgramAccountsV2, falling back to getProgramAccounts on endpoints that do not
  implement it (devnet, testnet and the local test validator run vanilla agave).

- [#21454](https://github.com/LedgerHQ/ledger-live/pull/21454) [`0dc37f4`](https://github.com/LedgerHQ/ledger-live/commit/0dc37f464793d07436854e14bd358fd0bb7a9225) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-solana): support v1 transactions

- [#21417](https://github.com/LedgerHQ/ledger-live/pull/21417) [`0c46f58`](https://github.com/LedgerHQ/ledger-live/commit/0c46f58fe1aab809579e5639d9c754ea223e2b51) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(coin-solana): prevent withdraw while activating

### Patch Changes

- Updated dependencies [[`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d), [`2d42e64`](https://github.com/LedgerHQ/ledger-live/commit/2d42e647d55f79cf2eb821ec30a232cc07891219), [`b7d0367`](https://github.com/LedgerHQ/ledger-live/commit/b7d03671db1aa022d3ff375465c7d8470bf2b215), [`5b7d11d`](https://github.com/LedgerHQ/ledger-live/commit/5b7d11dd9a988f0034b4b5b6168f02429ba5a406), [`5e971b5`](https://github.com/LedgerHQ/ledger-live/commit/5e971b55429cdcab0f69825ce2056fef24d30215), [`b7a8906`](https://github.com/LedgerHQ/ledger-live/commit/b7a89064587bbcd1f758f7b6205a616225ac2317), [`b9e15ac`](https://github.com/LedgerHQ/ledger-live/commit/b9e15ac78e2b89919c605511f333282610e57225), [`9fb98ab`](https://github.com/LedgerHQ/ledger-live/commit/9fb98ab74e3ca680e686a302b9beaa460a087783)]:
  - @ledgerhq/types-live@6.123.0
  - @ledgerhq/ledger-wallet-framework@3.3.0
  - @ledgerhq/live-env@4.0.0

## 2.1.0-next.0

### Minor Changes

- [#21318](https://github.com/LedgerHQ/ledger-live/pull/21318) [`e1e7cb2`](https://github.com/LedgerHQ/ledger-live/commit/e1e7cb2fa32ef3b413f8e598687f05780ad1c0e8) Thanks [@henri-ly](https://github.com/henri-ly)! - Fix Solana account synchronization failing when the RPC provider deprioritizes stake
  account discovery. Stake accounts are now enumerated with the paginated
  getProgramAccountsV2, falling back to getProgramAccounts on endpoints that do not
  implement it (devnet, testnet and the local test validator run vanilla agave).

- [#21454](https://github.com/LedgerHQ/ledger-live/pull/21454) [`0dc37f4`](https://github.com/LedgerHQ/ledger-live/commit/0dc37f464793d07436854e14bd358fd0bb7a9225) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-solana): support v1 transactions

- [#21417](https://github.com/LedgerHQ/ledger-live/pull/21417) [`0c46f58`](https://github.com/LedgerHQ/ledger-live/commit/0c46f58fe1aab809579e5639d9c754ea223e2b51) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(coin-solana): prevent withdraw while activating

### Patch Changes

- Updated dependencies [[`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d), [`2d42e64`](https://github.com/LedgerHQ/ledger-live/commit/2d42e647d55f79cf2eb821ec30a232cc07891219), [`b7d0367`](https://github.com/LedgerHQ/ledger-live/commit/b7d03671db1aa022d3ff375465c7d8470bf2b215), [`5b7d11d`](https://github.com/LedgerHQ/ledger-live/commit/5b7d11dd9a988f0034b4b5b6168f02429ba5a406), [`5e971b5`](https://github.com/LedgerHQ/ledger-live/commit/5e971b55429cdcab0f69825ce2056fef24d30215), [`b7a8906`](https://github.com/LedgerHQ/ledger-live/commit/b7a89064587bbcd1f758f7b6205a616225ac2317), [`b9e15ac`](https://github.com/LedgerHQ/ledger-live/commit/b9e15ac78e2b89919c605511f333282610e57225), [`9fb98ab`](https://github.com/LedgerHQ/ledger-live/commit/9fb98ab74e3ca680e686a302b9beaa460a087783)]:
  - @ledgerhq/types-live@6.123.0-next.0
  - @ledgerhq/ledger-wallet-framework@3.3.0-next.0
  - @ledgerhq/live-env@4.0.0-next.0

## 2.0.0

### Major Changes

- [#20935](https://github.com/LedgerHQ/ledger-live/pull/20935) [`27388a8`](https://github.com/LedgerHQ/ledger-live/commit/27388a894eaac67b8e162a60f6d3368aad0a8682) Thanks [@dilaouid](https://github.com/dilaouid)! - Move Solana staking onto the generic `StakingResources` account attribute.

  **Breaking for `@ledgerhq/coin-solana`.** `SolanaResources`, `SolanaResourcesRaw`, `toSolanaResourcesRaw` and `fromSolanaResourcesRaw` are gone. `SolanaAccount` is now an alias of `StakingAccount`, so read staking data from `account.stakingResources` instead of `account.solanaResources`. A stake is a `StakingDelegation` or a `StakingUnbonding` (`SolanaStakingPosition`) rather than a `SolanaStake`: its stake account address is `positionId`, its validator is `validatorAddress`, and the former `activation.active` / `activation.inactive` / `withdrawable` fields are `activeAmount` / `inactiveAmount` / `withdrawableAmount`. `listSolanaStakingPositions`, `solanaActivationState` and `stakeActions` from `@ledgerhq/coin-solana/logic` cover the common access patterns. Accounts already persisted with a `solanaResources` blob are migrated on hydration, so no resync is needed.

  `@ledgerhq/types-live` gains `StakingPositionDetails`, mixed into `StakingDelegation` and `StakingUnbonding` for chains that materialize each position as its own on-chain account, plus `actionFeeReserve` on `StakingResources`. Both are optional, so other chains are unaffected.

  `@ledgerhq/wallet-cli`'s `earn positions` output changes shape: on `EarnSolanaStake`, `stakeBalance` and `withdrawable` go from `number` to an integer decimal string, so lamport amounts above `Number.MAX_SAFE_INTEGER` stay exact. Anything reading those two fields numerically needs updating.

  `@ledgerhq/ledger-wallet-framework` now exports the generic `StakingResources` serializer (`toStakingResourcesRaw`, `fromStakingResourcesRaw`, `assignStakingResourcesToAccountRaw`, `assignStakingResourcesFromAccountRaw`), moved out of the EVM family in `live-common` so every coin module can use it.

### Minor Changes

- [#21168](https://github.com/LedgerHQ/ledger-live/pull/21168) [`a4e5995`](https://github.com/LedgerHQ/ledger-live/commit/a4e5995bea7f9e1f164bfa50939e15031765b2fa) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Adopt the coin-module authoring type, dropping the hand-written "not supported" stubs.

  `createApi` now returns its object with `satisfies CoinModuleImpl<…>` — which keeps the precise shape, so a caller sees exactly which methods exist — and omits the five capabilities the chain has none of, `call`, `register`, `getBlock`, `getBlockInfo` and `getRewards`, instead of giving each a `throw new Error("… is not supported")`.

  Staking stays: `getStakes` and `getValidators` are implemented against the chain's stake accounts and validator list, and only `getRewards` is absent.

  Consumers see no change in what they can call. They reach the module through a resolver that applies the framework's `withDefaults`, which supplies every omitted capability, so the same call still raises the same `"<method> is not supported"` error — and `supports(method)` now reports which capabilities are real.

  The authored type also keeps the contract's trailing optional parameter, or a caller reaching the module through it could no longer pass it: `getValidators` accepts and ignores its own. TypeScript does not hold a function's shorter parameter list against a target declaring more, so the `satisfies` passed either way and nothing flagged the narrowing.

- [#21532](https://github.com/LedgerHQ/ledger-live/pull/21532) [`173be30`](https://github.com/LedgerHQ/ledger-live/commit/173be30135caf7ffdb26432dac0a6c4f5701e932) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-solana): support v1 transactions

- [#21212](https://github.com/LedgerHQ/ledger-live/pull/21212) [`bc1093b`](https://github.com/LedgerHQ/ledger-live/commit/bc1093bc06adfda3700841b5dbd5598825cb52d1) Thanks [@YazhuEth](https://github.com/YazhuEth)! - fix(coin-solana): pair each signature with its own parsed transaction in listOperations

  JSON-RPC batch responses are not order-guaranteed, so pairing the signature list with the parsed
  transaction batch by array position could attach another transaction's fee, feesPayer and balances
  to a signature. Transactions are now matched by their own signature.

### Patch Changes

- Updated dependencies [[`27388a8`](https://github.com/LedgerHQ/ledger-live/commit/27388a894eaac67b8e162a60f6d3368aad0a8682), [`e21305a`](https://github.com/LedgerHQ/ledger-live/commit/e21305abce18f0a9408bf6c0e2bb47d5c992e06a)]:
  - @ledgerhq/types-live@6.122.0
  - @ledgerhq/ledger-wallet-framework@3.2.0
  - @ledgerhq/live-env@3.2.0

## 2.0.0-next.1

### Minor Changes

- [#21532](https://github.com/LedgerHQ/ledger-live/pull/21532) [`173be30`](https://github.com/LedgerHQ/ledger-live/commit/173be30135caf7ffdb26432dac0a6c4f5701e932) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-solana): support v1 transactions

## 2.0.0-next.0

### Major Changes

- [#20935](https://github.com/LedgerHQ/ledger-live/pull/20935) [`27388a8`](https://github.com/LedgerHQ/ledger-live/commit/27388a894eaac67b8e162a60f6d3368aad0a8682) Thanks [@dilaouid](https://github.com/dilaouid)! - Move Solana staking onto the generic `StakingResources` account attribute.

  **Breaking for `@ledgerhq/coin-solana`.** `SolanaResources`, `SolanaResourcesRaw`, `toSolanaResourcesRaw` and `fromSolanaResourcesRaw` are gone. `SolanaAccount` is now an alias of `StakingAccount`, so read staking data from `account.stakingResources` instead of `account.solanaResources`. A stake is a `StakingDelegation` or a `StakingUnbonding` (`SolanaStakingPosition`) rather than a `SolanaStake`: its stake account address is `positionId`, its validator is `validatorAddress`, and the former `activation.active` / `activation.inactive` / `withdrawable` fields are `activeAmount` / `inactiveAmount` / `withdrawableAmount`. `listSolanaStakingPositions`, `solanaActivationState` and `stakeActions` from `@ledgerhq/coin-solana/logic` cover the common access patterns. Accounts already persisted with a `solanaResources` blob are migrated on hydration, so no resync is needed.

  `@ledgerhq/types-live` gains `StakingPositionDetails`, mixed into `StakingDelegation` and `StakingUnbonding` for chains that materialize each position as its own on-chain account, plus `actionFeeReserve` on `StakingResources`. Both are optional, so other chains are unaffected.

  `@ledgerhq/wallet-cli`'s `earn positions` output changes shape: on `EarnSolanaStake`, `stakeBalance` and `withdrawable` go from `number` to an integer decimal string, so lamport amounts above `Number.MAX_SAFE_INTEGER` stay exact. Anything reading those two fields numerically needs updating.

  `@ledgerhq/ledger-wallet-framework` now exports the generic `StakingResources` serializer (`toStakingResourcesRaw`, `fromStakingResourcesRaw`, `assignStakingResourcesToAccountRaw`, `assignStakingResourcesFromAccountRaw`), moved out of the EVM family in `live-common` so every coin module can use it.

### Minor Changes

- [#21168](https://github.com/LedgerHQ/ledger-live/pull/21168) [`a4e5995`](https://github.com/LedgerHQ/ledger-live/commit/a4e5995bea7f9e1f164bfa50939e15031765b2fa) Thanks [@cted-ledger](https://github.com/cted-ledger)! - Adopt the coin-module authoring type, dropping the hand-written "not supported" stubs.

  `createApi` now returns its object with `satisfies CoinModuleImpl<…>` — which keeps the precise shape, so a caller sees exactly which methods exist — and omits the five capabilities the chain has none of, `call`, `register`, `getBlock`, `getBlockInfo` and `getRewards`, instead of giving each a `throw new Error("… is not supported")`.

  Staking stays: `getStakes` and `getValidators` are implemented against the chain's stake accounts and validator list, and only `getRewards` is absent.

  Consumers see no change in what they can call. They reach the module through a resolver that applies the framework's `withDefaults`, which supplies every omitted capability, so the same call still raises the same `"<method> is not supported"` error — and `supports(method)` now reports which capabilities are real.

  The authored type also keeps the contract's trailing optional parameter, or a caller reaching the module through it could no longer pass it: `getValidators` accepts and ignores its own. TypeScript does not hold a function's shorter parameter list against a target declaring more, so the `satisfies` passed either way and nothing flagged the narrowing.

- [#21212](https://github.com/LedgerHQ/ledger-live/pull/21212) [`bc1093b`](https://github.com/LedgerHQ/ledger-live/commit/bc1093bc06adfda3700841b5dbd5598825cb52d1) Thanks [@YazhuEth](https://github.com/YazhuEth)! - fix(coin-solana): pair each signature with its own parsed transaction in listOperations

  JSON-RPC batch responses are not order-guaranteed, so pairing the signature list with the parsed
  transaction batch by array position could attach another transaction's fee, feesPayer and balances
  to a signature. Transactions are now matched by their own signature.

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

- [#20778](https://github.com/LedgerHQ/ledger-live/pull/20778) [`eecf99a`](https://github.com/LedgerHQ/ledger-live/commit/eecf99af5c17ab63724843c31d5f3facc6352dad) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-evm): replace `CryptoCurrency` with `currencyId`

- [#19581](https://github.com/LedgerHQ/ledger-live/pull/19581) [`6a437fd`](https://github.com/LedgerHQ/ledger-live/commit/6a437fd60cb8d5c197f104a522ce1406da197e51) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(lwdm): improve error context on datadog

- [#20786](https://github.com/LedgerHQ/ledger-live/pull/20786) [`75d0c9b`](https://github.com/LedgerHQ/ledger-live/commit/75d0c9b97aced42be1f465319ee17ccaafcd649d) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Add unsupported `register` to CoinModuleApi implementations (ADR-046)

### Patch Changes

- Updated dependencies [[`da0a5ce`](https://github.com/LedgerHQ/ledger-live/commit/da0a5ceb8f889f1bace45ed2d3d4c640cdf24ca8), [`eecf99a`](https://github.com/LedgerHQ/ledger-live/commit/eecf99af5c17ab63724843c31d5f3facc6352dad), [`030fc67`](https://github.com/LedgerHQ/ledger-live/commit/030fc677db03e8a411d3d33d2fa88e1ab04df80b), [`5b39a67`](https://github.com/LedgerHQ/ledger-live/commit/5b39a67dd93d4c541a77b0b146881073ca00ed15), [`0807eca`](https://github.com/LedgerHQ/ledger-live/commit/0807ecacfd06057811a3d6f8845b9f4bfc6f693c), [`b6da6b1`](https://github.com/LedgerHQ/ledger-live/commit/b6da6b1b1c98d022f30985c6103c239bffd0c7df), [`79882e2`](https://github.com/LedgerHQ/ledger-live/commit/79882e26a14f246f1cc969937e011b16e701b8f2), [`a20805c`](https://github.com/LedgerHQ/ledger-live/commit/a20805cebd95f2f620d394c4d7598ec93506c83e), [`030b427`](https://github.com/LedgerHQ/ledger-live/commit/030b42707768af3f9c98a15fc6751f1d64b36fe6)]:
  - @ledgerhq/types-live@6.120.0
  - @ledgerhq/ledger-wallet-framework@3.0.0

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->

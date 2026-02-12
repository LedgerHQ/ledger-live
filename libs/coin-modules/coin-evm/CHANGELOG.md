# @ledgerhq/coin-evm

## 2.43.0-next.0

### Minor Changes

- [#13992](https://github.com/LedgerHQ/ledger-live/pull/13992) [`cb6cce9`](https://github.com/LedgerHQ/ledger-live/commit/cb6cce9031b6400968eca11017c6e4d0606805a2) Thanks [@jnicoulaud-ledger](https://github.com/jnicoulaud-ledger)! - fix(BACK-10392): fix RSK EIP-1191 addresses rejected by ethers validation

- [#13985](https://github.com/LedgerHQ/ledger-live/pull/13985) [`03b3105`](https://github.com/LedgerHQ/ledger-live/commit/03b3105efe8094b79ba70432e475fdc5d945c2c4) Thanks [@estrauser-ledger](https://github.com/estrauser-ledger)! - block time and hash are mandatory for alpaca

- [#14215](https://github.com/LedgerHQ/ledger-live/pull/14215) [`c4e7d20`](https://github.com/LedgerHQ/ledger-live/commit/c4e7d20ce631d43d7c8847d3f56187f68140fbab) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-modules): align `tsconfig` and `eslint` with quality standards

- [#14264](https://github.com/LedgerHQ/ledger-live/pull/14264) [`ebb41ed`](https://github.com/LedgerHQ/ledger-live/commit/ebb41ed183ed5d6c16b82eb94c9fceea3fe26b61) Thanks [@jprudent](https://github.com/jprudent)! - fix tx hash on internal tx provided by blockscout

- [#14131](https://github.com/LedgerHQ/ledger-live/pull/14131) [`8006565`](https://github.com/LedgerHQ/ledger-live/commit/8006565f77487fa0e38bf5f8d7bb4cda4cdba1f5) Thanks [@Canestin](https://github.com/Canestin)! - chore: remove ethereum holesky

- [#14385](https://github.com/LedgerHQ/ledger-live/pull/14385) [`4c642cb`](https://github.com/LedgerHQ/ledger-live/commit/4c642cbf197bbc5bd7783a08f36774d016ab3b22) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - deps(coin-evm,coin-tester-evm): remove `bluebird`

- [#14188](https://github.com/LedgerHQ/ledger-live/pull/14188) [`62e9b32`](https://github.com/LedgerHQ/ledger-live/commit/62e9b32207ad55211a2985e9e00d568abc2abe37) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-evm): log on NaN value found

### Patch Changes

- Updated dependencies [[`03b3105`](https://github.com/LedgerHQ/ledger-live/commit/03b3105efe8094b79ba70432e475fdc5d945c2c4), [`d5da9e0`](https://github.com/LedgerHQ/ledger-live/commit/d5da9e04d7a92b3f7f9df9d462bdd101cadbd300), [`7896aa2`](https://github.com/LedgerHQ/ledger-live/commit/7896aa2dacc12e6781267fa3ca2965aa6fb018d2), [`8a258aa`](https://github.com/LedgerHQ/ledger-live/commit/8a258aa0655123d22f955067acffaf9f74661165), [`8006565`](https://github.com/LedgerHQ/ledger-live/commit/8006565f77487fa0e38bf5f8d7bb4cda4cdba1f5), [`2ec4196`](https://github.com/LedgerHQ/ledger-live/commit/2ec419630bceab7a9600711742a18034ba9ff3cc), [`fe678a1`](https://github.com/LedgerHQ/ledger-live/commit/fe678a1d16eeda84cf8d802eee53026ea677be58)]:
  - @ledgerhq/coin-framework@6.16.0-next.0
  - @ledgerhq/cryptoassets@13.39.0-next.0
  - @ledgerhq/evm-tools@1.11.0-next.0
  - @ledgerhq/domain-service@1.6.4-next.0

## 2.42.0

### Minor Changes

- [#14132](https://github.com/LedgerHQ/ledger-live/pull/14132) [`982a7e9`](https://github.com/LedgerHQ/ledger-live/commit/982a7e9c73867b7c7b90ccae6df575d59c06806c) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-modules): promote compiler options for tracking unused vars$

- [#14027](https://github.com/LedgerHQ/ledger-live/pull/14027) [`65f0757`](https://github.com/LedgerHQ/ledger-live/commit/65f0757b1ea33a5971132d338e270ecf3242ba10) Thanks [@jnicoulaud-ledger](https://github.com/jnicoulaud-ledger)! - fix(BACK-10235): fix "Cannot convert NaN to a BigInt" with blockscout optimism transactions

- [#14038](https://github.com/LedgerHQ/ledger-live/pull/14038) [`a774b49`](https://github.com/LedgerHQ/ledger-live/commit/a774b49cca0696426d20a51782e3f18640c47613) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-evm): embed etherscan message within `InvalidExplorerResponse`

### Patch Changes

- Updated dependencies [[`bf34cf5`](https://github.com/LedgerHQ/ledger-live/commit/bf34cf516a26081ddd493bb01042b1a0e462b029), [`7a75642`](https://github.com/LedgerHQ/ledger-live/commit/7a75642c2f56e27c778106d60a44049917d04014)]:
  - @ledgerhq/coin-framework@6.15.0
  - @ledgerhq/live-env@2.27.0
  - @ledgerhq/domain-service@1.6.3
  - @ledgerhq/evm-tools@1.10.2
  - @ledgerhq/cryptoassets@13.38.1
  - @ledgerhq/live-network@2.2.2

## 2.42.0-next.0

### Minor Changes

- [#14132](https://github.com/LedgerHQ/ledger-live/pull/14132) [`982a7e9`](https://github.com/LedgerHQ/ledger-live/commit/982a7e9c73867b7c7b90ccae6df575d59c06806c) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-modules): promote compiler options for tracking unused vars$

- [#14027](https://github.com/LedgerHQ/ledger-live/pull/14027) [`65f0757`](https://github.com/LedgerHQ/ledger-live/commit/65f0757b1ea33a5971132d338e270ecf3242ba10) Thanks [@jnicoulaud-ledger](https://github.com/jnicoulaud-ledger)! - fix(BACK-10235): fix "Cannot convert NaN to a BigInt" with blockscout optimism transactions

- [#14038](https://github.com/LedgerHQ/ledger-live/pull/14038) [`a774b49`](https://github.com/LedgerHQ/ledger-live/commit/a774b49cca0696426d20a51782e3f18640c47613) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-evm): embed etherscan message within `InvalidExplorerResponse`

### Patch Changes

- Updated dependencies [[`bf34cf5`](https://github.com/LedgerHQ/ledger-live/commit/bf34cf516a26081ddd493bb01042b1a0e462b029), [`7a75642`](https://github.com/LedgerHQ/ledger-live/commit/7a75642c2f56e27c778106d60a44049917d04014)]:
  - @ledgerhq/coin-framework@6.15.0-next.0
  - @ledgerhq/live-env@2.27.0-next.0
  - @ledgerhq/domain-service@1.6.3-next.0
  - @ledgerhq/evm-tools@1.10.2-next.0
  - @ledgerhq/cryptoassets@13.38.1-next.0
  - @ledgerhq/live-network@2.2.2-next.0

## 2.41.0

### Minor Changes

- [#13782](https://github.com/LedgerHQ/ledger-live/pull/13782) [`363b630`](https://github.com/LedgerHQ/ledger-live/commit/363b63050ab007266d2c1158a27e4fce79081983) Thanks [@acewf](https://github.com/acewf)! - Add unichain network config

- [#13871](https://github.com/LedgerHQ/ledger-live/pull/13871) [`cb69f67`](https://github.com/LedgerHQ/ledger-live/commit/cb69f67326834079695935103530d0b24ad3772d) Thanks [@jnicoulaud-ledger](https://github.com/jnicoulaud-ledger)! - add EVM currencies avalanche_c_chain_fuji, bitlayer, klaytn_baobab, shape, story

- [#13781](https://github.com/LedgerHQ/ledger-live/pull/13781) [`99f92ce`](https://github.com/LedgerHQ/ledger-live/commit/99f92cee9bbfb433eda7c3d4f1a4752401f3aa44) Thanks [@jprudent](https://github.com/jprudent)! - EVM coin module getBlock returns ERC20 operations

- [#13930](https://github.com/LedgerHQ/ledger-live/pull/13930) [`1f3a159`](https://github.com/LedgerHQ/ledger-live/commit/1f3a159e950dcb81b8e23aaa9e411db816e657d4) Thanks [@jprudent](https://github.com/jprudent)! - fix: Optimism can fetch blocks with more than 10 txs

### Patch Changes

- Updated dependencies [[`dd1122e`](https://github.com/LedgerHQ/ledger-live/commit/dd1122eeb6e9c582541446ff82a488928fa340c2), [`363b630`](https://github.com/LedgerHQ/ledger-live/commit/363b63050ab007266d2c1158a27e4fce79081983), [`cb69f67`](https://github.com/LedgerHQ/ledger-live/commit/cb69f67326834079695935103530d0b24ad3772d), [`9a99ae9`](https://github.com/LedgerHQ/ledger-live/commit/9a99ae9c6b4a99cdda500ae0e216037799de5cd5)]:
  - @ledgerhq/coin-framework@6.14.0
  - @ledgerhq/cryptoassets@13.38.0
  - @ledgerhq/domain-service@1.6.2
  - @ledgerhq/evm-tools@1.10.1

## 2.41.0-next.0

### Minor Changes

- [#13782](https://github.com/LedgerHQ/ledger-live/pull/13782) [`363b630`](https://github.com/LedgerHQ/ledger-live/commit/363b63050ab007266d2c1158a27e4fce79081983) Thanks [@acewf](https://github.com/acewf)! - Add unichain network config

- [#13871](https://github.com/LedgerHQ/ledger-live/pull/13871) [`cb69f67`](https://github.com/LedgerHQ/ledger-live/commit/cb69f67326834079695935103530d0b24ad3772d) Thanks [@jnicoulaud-ledger](https://github.com/jnicoulaud-ledger)! - add EVM currencies avalanche_c_chain_fuji, bitlayer, klaytn_baobab, shape, story

- [#13781](https://github.com/LedgerHQ/ledger-live/pull/13781) [`99f92ce`](https://github.com/LedgerHQ/ledger-live/commit/99f92cee9bbfb433eda7c3d4f1a4752401f3aa44) Thanks [@jprudent](https://github.com/jprudent)! - EVM coin module getBlock returns ERC20 operations

- [#13930](https://github.com/LedgerHQ/ledger-live/pull/13930) [`1f3a159`](https://github.com/LedgerHQ/ledger-live/commit/1f3a159e950dcb81b8e23aaa9e411db816e657d4) Thanks [@jprudent](https://github.com/jprudent)! - fix: Optimism can fetch blocks with more than 10 txs

### Patch Changes

- Updated dependencies [[`dd1122e`](https://github.com/LedgerHQ/ledger-live/commit/dd1122eeb6e9c582541446ff82a488928fa340c2), [`363b630`](https://github.com/LedgerHQ/ledger-live/commit/363b63050ab007266d2c1158a27e4fce79081983), [`cb69f67`](https://github.com/LedgerHQ/ledger-live/commit/cb69f67326834079695935103530d0b24ad3772d), [`9a99ae9`](https://github.com/LedgerHQ/ledger-live/commit/9a99ae9c6b4a99cdda500ae0e216037799de5cd5)]:
  - @ledgerhq/coin-framework@6.14.0-next.0
  - @ledgerhq/cryptoassets@13.38.0-next.0
  - @ledgerhq/domain-service@1.6.2-next.0
  - @ledgerhq/evm-tools@1.10.1

## 2.40.0

### Minor Changes

- [#13743](https://github.com/LedgerHQ/ledger-live/pull/13743) [`d38431e`](https://github.com/LedgerHQ/ledger-live/commit/d38431ee5f91439794cc6c7bad793b89ade95155) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - perf(llc): parellelize calls to the crypto asset store

- [#13790](https://github.com/LedgerHQ/ledger-live/pull/13790) [`819d969`](https://github.com/LedgerHQ/ledger-live/commit/819d96907febd9a68a6407c1bad06f475d044a4d) Thanks [@Justkant](https://github.com/Justkant)! - feat: add transaction source tagging with headers for broadcast

  Add TransactionSource type and source field to BroadcastConfig to track
  transaction origins (dApp, live-app, coin-module, swap) and transmit them
  as X-Ledger-Source-Type and X-Ledger-Source-Name headers when broadcasting
  to blockchain explorers for Bitcoin and EVM.

  Changes:

  - Add TransactionSource type with type and name fields to types-live
  - Extend BroadcastConfig with optional source field
  - Thread source through Bitcoin broadcast chain (broadcast.ts → wallet.ts → xpub.ts → explorer)
  - Thread source through EVM broadcast in ledger node API
  - Update Desktop to pass source in:
    - Live app broadcasts (LiveAppSDKLogic.ts)
    - Swap flows (CompleteExchange Body.tsx)
    - Native send flows (GenericStepConnectDevice.tsx)
  - Update Mobile to pass source in:
    - Native transaction flows (screenTransactionHooks.ts)
    - Platform exchange (CompleteExchange.tsx)
    - Swap flows (Confirmation.tsx)
  - Update wallet-api integrations (react.ts, useDappLogic.ts)

- [#13787](https://github.com/LedgerHQ/ledger-live/pull/13787) [`7389999`](https://github.com/LedgerHQ/ledger-live/commit/7389999b0a5b52c42b565cbfe8e024c315c9dcf5) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - refactor(llc): always pass `bigint` inside Alpaca custom fees

- [#13710](https://github.com/LedgerHQ/ledger-live/pull/13710) [`36aaf48`](https://github.com/LedgerHQ/ledger-live/commit/36aaf487c15da117a23332de376257ce8e6582a9) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Returns native empty balance when account is pristine

### Patch Changes

- Updated dependencies [[`6532080`](https://github.com/LedgerHQ/ledger-live/commit/6532080d2a0f5e49052aeab0bf532ee5cd52694a)]:
  - @ledgerhq/live-env@2.26.0
  - @ledgerhq/coin-framework@6.13.1
  - @ledgerhq/domain-service@1.6.1
  - @ledgerhq/evm-tools@1.10.1
  - @ledgerhq/cryptoassets@13.37.1
  - @ledgerhq/live-network@2.2.1

## 2.40.0-next.0

### Minor Changes

- [#13743](https://github.com/LedgerHQ/ledger-live/pull/13743) [`d38431e`](https://github.com/LedgerHQ/ledger-live/commit/d38431ee5f91439794cc6c7bad793b89ade95155) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - perf(llc): parellelize calls to the crypto asset store

- [#13790](https://github.com/LedgerHQ/ledger-live/pull/13790) [`819d969`](https://github.com/LedgerHQ/ledger-live/commit/819d96907febd9a68a6407c1bad06f475d044a4d) Thanks [@Justkant](https://github.com/Justkant)! - feat: add transaction source tagging with headers for broadcast

  Add TransactionSource type and source field to BroadcastConfig to track
  transaction origins (dApp, live-app, coin-module, swap) and transmit them
  as X-Ledger-Source-Type and X-Ledger-Source-Name headers when broadcasting
  to blockchain explorers for Bitcoin and EVM.

  Changes:

  - Add TransactionSource type with type and name fields to types-live
  - Extend BroadcastConfig with optional source field
  - Thread source through Bitcoin broadcast chain (broadcast.ts → wallet.ts → xpub.ts → explorer)
  - Thread source through EVM broadcast in ledger node API
  - Update Desktop to pass source in:
    - Live app broadcasts (LiveAppSDKLogic.ts)
    - Swap flows (CompleteExchange Body.tsx)
    - Native send flows (GenericStepConnectDevice.tsx)
  - Update Mobile to pass source in:
    - Native transaction flows (screenTransactionHooks.ts)
    - Platform exchange (CompleteExchange.tsx)
    - Swap flows (Confirmation.tsx)
  - Update wallet-api integrations (react.ts, useDappLogic.ts)

- [#13787](https://github.com/LedgerHQ/ledger-live/pull/13787) [`7389999`](https://github.com/LedgerHQ/ledger-live/commit/7389999b0a5b52c42b565cbfe8e024c315c9dcf5) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - refactor(llc): always pass `bigint` inside Alpaca custom fees

- [#13710](https://github.com/LedgerHQ/ledger-live/pull/13710) [`36aaf48`](https://github.com/LedgerHQ/ledger-live/commit/36aaf487c15da117a23332de376257ce8e6582a9) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Returns native empty balance when account is pristine

### Patch Changes

- Updated dependencies [[`6532080`](https://github.com/LedgerHQ/ledger-live/commit/6532080d2a0f5e49052aeab0bf532ee5cd52694a)]:
  - @ledgerhq/live-env@2.26.0-next.0
  - @ledgerhq/coin-framework@6.13.1-next.0
  - @ledgerhq/domain-service@1.6.1-next.0
  - @ledgerhq/evm-tools@1.10.1-next.0
  - @ledgerhq/cryptoassets@13.37.1-next.0
  - @ledgerhq/live-network@2.2.1-next.0

## 2.39.0

### Minor Changes

- [#13630](https://github.com/LedgerHQ/ledger-live/pull/13630) [`e3a83e0`](https://github.com/LedgerHQ/ledger-live/commit/e3a83e08278fd6bef3fd26d90df2823c78957d20) Thanks [@qperrot](https://github.com/qperrot)! - Fix: Blast need to use getOptimismAdditionalFees in order to perform a send max

- [#13626](https://github.com/LedgerHQ/ledger-live/pull/13626) [`1f35ab1`](https://github.com/LedgerHQ/ledger-live/commit/1f35ab1efc396e1c4740607d6806284f906f1907) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(coin-evm): display native internal operations

- [#13634](https://github.com/LedgerHQ/ledger-live/pull/13634) [`a526d94`](https://github.com/LedgerHQ/ledger-live/commit/a526d9465eb4887b3c65ab768b346bd91bf17e20) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(coin-evm): harmonize contract addresses

- [#13645](https://github.com/LedgerHQ/ledger-live/pull/13645) [`0d2ee1b`](https://github.com/LedgerHQ/ledger-live/commit/0d2ee1b8c71f8040deaded3575124a44f2704a21) Thanks [@qperrot](https://github.com/qperrot)! - Fix: remove asset type check and only check reference

- [#13627](https://github.com/LedgerHQ/ledger-live/pull/13627) [`ebce0b9`](https://github.com/LedgerHQ/ledger-live/commit/ebce0b97b3d35921d7b6c256e106ddb400f2aaa5) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(coin-evm): do not crash when computing additional fees

- [#13614](https://github.com/LedgerHQ/ledger-live/pull/13614) [`e506740`](https://github.com/LedgerHQ/ledger-live/commit/e506740729486f4c1579308ede0a5a348a04ecee) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(coin-evm): only expose `refreshOperations` if no explorers is available

- [#13396](https://github.com/LedgerHQ/ledger-live/pull/13396) [`b9a3e43`](https://github.com/LedgerHQ/ledger-live/commit/b9a3e431be33943ab4feb4294d6a7f27b966e61b) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Update Jest to v30

### Patch Changes

- Updated dependencies [[`537a975`](https://github.com/LedgerHQ/ledger-live/commit/537a975536ca3669d3b88371e1e1f651c4cb9a1b), [`cbcae7c`](https://github.com/LedgerHQ/ledger-live/commit/cbcae7c0ba9b54b1167d26e4227bd2b847207cb9), [`50bae0f`](https://github.com/LedgerHQ/ledger-live/commit/50bae0f13a95ef166b2c5609ccbcf5ef01ba1579), [`cf08174`](https://github.com/LedgerHQ/ledger-live/commit/cf0817462e9f0210fceff29ec60b0699e4e69b71), [`b9a3e43`](https://github.com/LedgerHQ/ledger-live/commit/b9a3e431be33943ab4feb4294d6a7f27b966e61b), [`3ac5f26`](https://github.com/LedgerHQ/ledger-live/commit/3ac5f26111f8596327fa7e588e514509de3f8a59)]:
  - @ledgerhq/cryptoassets@13.37.0
  - @ledgerhq/coin-framework@6.13.0
  - @ledgerhq/live-env@2.25.0
  - @ledgerhq/devices@8.10.0
  - @ledgerhq/errors@6.29.0
  - @ledgerhq/logs@6.14.0
  - @ledgerhq/domain-service@1.6.0
  - @ledgerhq/live-network@2.2.0
  - @ledgerhq/evm-tools@1.10.0
  - @ledgerhq/live-promise@0.2.0

## 2.39.0-next.0

### Minor Changes

- [#13630](https://github.com/LedgerHQ/ledger-live/pull/13630) [`e3a83e0`](https://github.com/LedgerHQ/ledger-live/commit/e3a83e08278fd6bef3fd26d90df2823c78957d20) Thanks [@qperrot](https://github.com/qperrot)! - Fix: Blast need to use getOptimismAdditionalFees in order to perform a send max

- [#13626](https://github.com/LedgerHQ/ledger-live/pull/13626) [`1f35ab1`](https://github.com/LedgerHQ/ledger-live/commit/1f35ab1efc396e1c4740607d6806284f906f1907) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(coin-evm): display native internal operations

- [#13634](https://github.com/LedgerHQ/ledger-live/pull/13634) [`a526d94`](https://github.com/LedgerHQ/ledger-live/commit/a526d9465eb4887b3c65ab768b346bd91bf17e20) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(coin-evm): harmonize contract addresses

- [#13645](https://github.com/LedgerHQ/ledger-live/pull/13645) [`0d2ee1b`](https://github.com/LedgerHQ/ledger-live/commit/0d2ee1b8c71f8040deaded3575124a44f2704a21) Thanks [@qperrot](https://github.com/qperrot)! - Fix: remove asset type check and only check reference

- [#13627](https://github.com/LedgerHQ/ledger-live/pull/13627) [`ebce0b9`](https://github.com/LedgerHQ/ledger-live/commit/ebce0b97b3d35921d7b6c256e106ddb400f2aaa5) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(coin-evm): do not crash when computing additional fees

- [#13614](https://github.com/LedgerHQ/ledger-live/pull/13614) [`e506740`](https://github.com/LedgerHQ/ledger-live/commit/e506740729486f4c1579308ede0a5a348a04ecee) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(coin-evm): only expose `refreshOperations` if no explorers is available

- [#13396](https://github.com/LedgerHQ/ledger-live/pull/13396) [`b9a3e43`](https://github.com/LedgerHQ/ledger-live/commit/b9a3e431be33943ab4feb4294d6a7f27b966e61b) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Update Jest to v30

### Patch Changes

- Updated dependencies [[`537a975`](https://github.com/LedgerHQ/ledger-live/commit/537a975536ca3669d3b88371e1e1f651c4cb9a1b), [`cbcae7c`](https://github.com/LedgerHQ/ledger-live/commit/cbcae7c0ba9b54b1167d26e4227bd2b847207cb9), [`50bae0f`](https://github.com/LedgerHQ/ledger-live/commit/50bae0f13a95ef166b2c5609ccbcf5ef01ba1579), [`cf08174`](https://github.com/LedgerHQ/ledger-live/commit/cf0817462e9f0210fceff29ec60b0699e4e69b71), [`b9a3e43`](https://github.com/LedgerHQ/ledger-live/commit/b9a3e431be33943ab4feb4294d6a7f27b966e61b), [`3ac5f26`](https://github.com/LedgerHQ/ledger-live/commit/3ac5f26111f8596327fa7e588e514509de3f8a59)]:
  - @ledgerhq/cryptoassets@13.37.0-next.0
  - @ledgerhq/coin-framework@6.13.0-next.0
  - @ledgerhq/live-env@2.25.0-next.0
  - @ledgerhq/devices@8.10.0-next.0
  - @ledgerhq/errors@6.29.0-next.0
  - @ledgerhq/logs@6.14.0-next.0
  - @ledgerhq/domain-service@1.6.0-next.0
  - @ledgerhq/live-network@2.2.0-next.0
  - @ledgerhq/evm-tools@1.10.0-next.0
  - @ledgerhq/live-promise@0.2.0-next.0

## 2.38.0

### Minor Changes

- [#13651](https://github.com/LedgerHQ/ledger-live/pull/13651) [`398b3d8`](https://github.com/LedgerHQ/ledger-live/commit/398b3d85d2de4a520d5ae78a18135f8d163aad5b) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(llc): do not recompute balances

- [#13543](https://github.com/LedgerHQ/ledger-live/pull/13543) [`3d30262`](https://github.com/LedgerHQ/ledger-live/commit/3d3026233072f4fab0dbcf6fee8153a75e295def) Thanks [@qperrot](https://github.com/qperrot)! - Fix: remove asset type check and only check reference

- [#13468](https://github.com/LedgerHQ/ledger-live/pull/13468) [`9874905`](https://github.com/LedgerHQ/ledger-live/commit/98749050026e6b19a207065b312dc99770af639d) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Dedup MSW lib inside monorepo

- [#13560](https://github.com/LedgerHQ/ledger-live/pull/13560) [`a2aa565`](https://github.com/LedgerHQ/ledger-live/commit/a2aa565653bdddb86620b714c8e2e3066adb4975) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(coin-evm): reduce batch size in `getBalance`

### Patch Changes

- Updated dependencies [[`6e6a12c`](https://github.com/LedgerHQ/ledger-live/commit/6e6a12cdfd79b752839bf664bab5156cea9c9e23), [`398b3d8`](https://github.com/LedgerHQ/ledger-live/commit/398b3d85d2de4a520d5ae78a18135f8d163aad5b), [`a8c59da`](https://github.com/LedgerHQ/ledger-live/commit/a8c59da888c8cb3c200a9f62869ca54aba706cae), [`8cb7d40`](https://github.com/LedgerHQ/ledger-live/commit/8cb7d40e0a55e47f42adc5cd522740cab1fd4de4), [`fba1e31`](https://github.com/LedgerHQ/ledger-live/commit/fba1e31386e589a93adb19bc4f6eae55129e19ea)]:
  - @ledgerhq/cryptoassets@13.36.0
  - @ledgerhq/coin-framework@6.12.0
  - @ledgerhq/devices@8.9.0
  - @ledgerhq/live-env@2.24.0
  - @ledgerhq/domain-service@1.5.2
  - @ledgerhq/evm-tools@1.9.1
  - @ledgerhq/live-network@2.1.5

## 2.38.0-next.3

### Minor Changes

- [#13651](https://github.com/LedgerHQ/ledger-live/pull/13651) [`398b3d8`](https://github.com/LedgerHQ/ledger-live/commit/398b3d85d2de4a520d5ae78a18135f8d163aad5b) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(llc): do not recompute balances

### Patch Changes

- Updated dependencies [[`398b3d8`](https://github.com/LedgerHQ/ledger-live/commit/398b3d85d2de4a520d5ae78a18135f8d163aad5b)]:
  - @ledgerhq/coin-framework@6.12.0-next.1

## 2.38.0-next.2

### Minor Changes

- [#13560](https://github.com/LedgerHQ/ledger-live/pull/13560) [`a2aa565`](https://github.com/LedgerHQ/ledger-live/commit/a2aa565653bdddb86620b714c8e2e3066adb4975) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(coin-evm): reduce batch size in `getBalance`

## 2.38.0-next.1

### Minor Changes

- [#13543](https://github.com/LedgerHQ/ledger-live/pull/13543) [`3d30262`](https://github.com/LedgerHQ/ledger-live/commit/3d3026233072f4fab0dbcf6fee8153a75e295def) Thanks [@qperrot](https://github.com/qperrot)! - Fix: remove asset type check and only check reference

## 2.38.0-next.0

### Minor Changes

- [#13468](https://github.com/LedgerHQ/ledger-live/pull/13468) [`9874905`](https://github.com/LedgerHQ/ledger-live/commit/98749050026e6b19a207065b312dc99770af639d) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Dedup MSW lib inside monorepo

### Patch Changes

- Updated dependencies [[`6e6a12c`](https://github.com/LedgerHQ/ledger-live/commit/6e6a12cdfd79b752839bf664bab5156cea9c9e23), [`a8c59da`](https://github.com/LedgerHQ/ledger-live/commit/a8c59da888c8cb3c200a9f62869ca54aba706cae), [`8cb7d40`](https://github.com/LedgerHQ/ledger-live/commit/8cb7d40e0a55e47f42adc5cd522740cab1fd4de4), [`fba1e31`](https://github.com/LedgerHQ/ledger-live/commit/fba1e31386e589a93adb19bc4f6eae55129e19ea)]:
  - @ledgerhq/cryptoassets@13.36.0-next.0
  - @ledgerhq/devices@8.9.0-next.0
  - @ledgerhq/live-env@2.24.0-next.0
  - @ledgerhq/coin-framework@6.11.2-next.0
  - @ledgerhq/domain-service@1.5.2-next.0
  - @ledgerhq/evm-tools@1.9.1-next.0
  - @ledgerhq/live-network@2.1.5-next.0

## 2.37.1

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/coin-framework@6.11.1
  - @ledgerhq/domain-service@1.5.1
  - @ledgerhq/evm-tools@1.9.0
  - @ledgerhq/cryptoassets@13.35.1

## 2.37.1-hotfix.0

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/coin-framework@6.11.1-hotfix.0
  - @ledgerhq/domain-service@1.5.1-hotfix.0
  - @ledgerhq/evm-tools@1.9.0
  - @ledgerhq/cryptoassets@13.35.1-hotfix.0

## 2.37.0

### Minor Changes

- [#12038](https://github.com/LedgerHQ/ledger-live/pull/12038) [`480a08a`](https://github.com/LedgerHQ/ledger-live/commit/480a08ae190119829910b46ecc6d2a9fb11bb7c2) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - feat(llc): remove EVM bridge

- [#13112](https://github.com/LedgerHQ/ledger-live/pull/13112) [`e63194f`](https://github.com/LedgerHQ/ledger-live/commit/e63194f7dbd5ff2b0135c26aac3842a2be676b0a) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - 🔧 Enforce @typescript-eslint/no-deprecated and Replace Deprecated APIs

- [#13028](https://github.com/LedgerHQ/ledger-live/pull/13028) [`edb90d0`](https://github.com/LedgerHQ/ledger-live/commit/edb90d024a9cc58801c26e56ff1d0c52bb295b52) Thanks [@estrauser-ledger](https://github.com/estrauser-ledger)! - Add getblock api for alpaca

- [#13142](https://github.com/LedgerHQ/ledger-live/pull/13142) [`bdacedf`](https://github.com/LedgerHQ/ledger-live/commit/bdacedfe32bea8ffce96ab675a44c0d7cf395143) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - upgrade typescript-eslint rules & versions

- [#13311](https://github.com/LedgerHQ/ledger-live/pull/13311) [`378d22a`](https://github.com/LedgerHQ/ledger-live/commit/378d22a3f748e1c53fb1fda5ee1f87c259085ab6) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(coin-evm): allow custom `gasLimit` in `craftTransaction`

- [#12967](https://github.com/LedgerHQ/ledger-live/pull/12967) [`5e8d6be`](https://github.com/LedgerHQ/ledger-live/commit/5e8d6be609dd37c48d747890e56189e0716d5273) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - Validate address implementation on all currencies

- [#13155](https://github.com/LedgerHQ/ledger-live/pull/13155) [`aadb3d5`](https://github.com/LedgerHQ/ledger-live/commit/aadb3d57f5719cc2cc397975eafec8094b160afe) Thanks [@gre-ledger](https://github.com/gre-ledger)! - rxjs@7.8.2 everywhere

- [#13278](https://github.com/LedgerHQ/ledger-live/pull/13278) [`ddd40b4`](https://github.com/LedgerHQ/ledger-live/commit/ddd40b4cae93ecf3139fd33dc0f4dd1c8366d628) Thanks [@semeano](https://github.com/semeano)! - Fix SeiEVM not showing on MAD

- [#13091](https://github.com/LedgerHQ/ledger-live/pull/13091) [`34248c3`](https://github.com/LedgerHQ/ledger-live/commit/34248c306479dafe6335b2c176daf25064c85b3b) Thanks [@dilaouid](https://github.com/dilaouid)! - feat: add descriptors (+supported features) and helpers for each coins

### Patch Changes

- Updated dependencies [[`480a08a`](https://github.com/LedgerHQ/ledger-live/commit/480a08ae190119829910b46ecc6d2a9fb11bb7c2), [`e63194f`](https://github.com/LedgerHQ/ledger-live/commit/e63194f7dbd5ff2b0135c26aac3842a2be676b0a), [`bc76d51`](https://github.com/LedgerHQ/ledger-live/commit/bc76d5154d35f8340b6b282c4909cd26920b8d40), [`4be69a7`](https://github.com/LedgerHQ/ledger-live/commit/4be69a71dcd7624a1cba8dd1b1847ef009eb2d83), [`7ae71b6`](https://github.com/LedgerHQ/ledger-live/commit/7ae71b64161424b398b63f77da5127085143fcdc), [`5fa83e4`](https://github.com/LedgerHQ/ledger-live/commit/5fa83e49c5fb103da7ecf0777b7e75bb35d5ed61), [`c5da2ce`](https://github.com/LedgerHQ/ledger-live/commit/c5da2cef7cded2b53c1af9aa3174cd27e5c92e0a), [`bdacedf`](https://github.com/LedgerHQ/ledger-live/commit/bdacedfe32bea8ffce96ab675a44c0d7cf395143), [`5e8d6be`](https://github.com/LedgerHQ/ledger-live/commit/5e8d6be609dd37c48d747890e56189e0716d5273), [`3e70677`](https://github.com/LedgerHQ/ledger-live/commit/3e706774f8c4e9b768ab18b67abc3471cf61b6b6), [`aadb3d5`](https://github.com/LedgerHQ/ledger-live/commit/aadb3d57f5719cc2cc397975eafec8094b160afe), [`d4bad44`](https://github.com/LedgerHQ/ledger-live/commit/d4bad4433c3fb083d95820d2927a9e8beeaf244f), [`8d8e1b7`](https://github.com/LedgerHQ/ledger-live/commit/8d8e1b7bb26305af326ea21710248223d1e8653b), [`5e0556a`](https://github.com/LedgerHQ/ledger-live/commit/5e0556a3bd0ea60277462eed10c997b17b09d299), [`bce6610`](https://github.com/LedgerHQ/ledger-live/commit/bce6610ca8554a85f8f17b6014e921fdecd3fa4f), [`ddd40b4`](https://github.com/LedgerHQ/ledger-live/commit/ddd40b4cae93ecf3139fd33dc0f4dd1c8366d628), [`2a60165`](https://github.com/LedgerHQ/ledger-live/commit/2a601656b7a23a424a29f006ec53090648fdae4f), [`34248c3`](https://github.com/LedgerHQ/ledger-live/commit/34248c306479dafe6335b2c176daf25064c85b3b)]:
  - @ledgerhq/coin-framework@6.11.0
  - @ledgerhq/cryptoassets@13.35.0
  - @ledgerhq/errors@6.28.0
  - @ledgerhq/domain-service@1.5.0
  - @ledgerhq/evm-tools@1.9.0
  - @ledgerhq/live-env@2.23.0
  - @ledgerhq/devices@8.8.0
  - @ledgerhq/live-network@2.1.4

## 2.37.0-next.0

### Minor Changes

- [#12038](https://github.com/LedgerHQ/ledger-live/pull/12038) [`480a08a`](https://github.com/LedgerHQ/ledger-live/commit/480a08ae190119829910b46ecc6d2a9fb11bb7c2) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - feat(llc): remove EVM bridge

- [#13112](https://github.com/LedgerHQ/ledger-live/pull/13112) [`e63194f`](https://github.com/LedgerHQ/ledger-live/commit/e63194f7dbd5ff2b0135c26aac3842a2be676b0a) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - 🔧 Enforce @typescript-eslint/no-deprecated and Replace Deprecated APIs

- [#13028](https://github.com/LedgerHQ/ledger-live/pull/13028) [`edb90d0`](https://github.com/LedgerHQ/ledger-live/commit/edb90d024a9cc58801c26e56ff1d0c52bb295b52) Thanks [@estrauser-ledger](https://github.com/estrauser-ledger)! - Add getblock api for alpaca

- [#13142](https://github.com/LedgerHQ/ledger-live/pull/13142) [`bdacedf`](https://github.com/LedgerHQ/ledger-live/commit/bdacedfe32bea8ffce96ab675a44c0d7cf395143) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - upgrade typescript-eslint rules & versions

- [#13311](https://github.com/LedgerHQ/ledger-live/pull/13311) [`378d22a`](https://github.com/LedgerHQ/ledger-live/commit/378d22a3f748e1c53fb1fda5ee1f87c259085ab6) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(coin-evm): allow custom `gasLimit` in `craftTransaction`

- [#12967](https://github.com/LedgerHQ/ledger-live/pull/12967) [`5e8d6be`](https://github.com/LedgerHQ/ledger-live/commit/5e8d6be609dd37c48d747890e56189e0716d5273) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - Validate address implementation on all currencies

- [#13155](https://github.com/LedgerHQ/ledger-live/pull/13155) [`aadb3d5`](https://github.com/LedgerHQ/ledger-live/commit/aadb3d57f5719cc2cc397975eafec8094b160afe) Thanks [@gre-ledger](https://github.com/gre-ledger)! - rxjs@7.8.2 everywhere

- [#13278](https://github.com/LedgerHQ/ledger-live/pull/13278) [`ddd40b4`](https://github.com/LedgerHQ/ledger-live/commit/ddd40b4cae93ecf3139fd33dc0f4dd1c8366d628) Thanks [@semeano](https://github.com/semeano)! - Fix SeiEVM not showing on MAD

- [#13091](https://github.com/LedgerHQ/ledger-live/pull/13091) [`34248c3`](https://github.com/LedgerHQ/ledger-live/commit/34248c306479dafe6335b2c176daf25064c85b3b) Thanks [@dilaouid](https://github.com/dilaouid)! - feat: add descriptors (+supported features) and helpers for each coins

### Patch Changes

- Updated dependencies [[`480a08a`](https://github.com/LedgerHQ/ledger-live/commit/480a08ae190119829910b46ecc6d2a9fb11bb7c2), [`e63194f`](https://github.com/LedgerHQ/ledger-live/commit/e63194f7dbd5ff2b0135c26aac3842a2be676b0a), [`bc76d51`](https://github.com/LedgerHQ/ledger-live/commit/bc76d5154d35f8340b6b282c4909cd26920b8d40), [`4be69a7`](https://github.com/LedgerHQ/ledger-live/commit/4be69a71dcd7624a1cba8dd1b1847ef009eb2d83), [`7ae71b6`](https://github.com/LedgerHQ/ledger-live/commit/7ae71b64161424b398b63f77da5127085143fcdc), [`5fa83e4`](https://github.com/LedgerHQ/ledger-live/commit/5fa83e49c5fb103da7ecf0777b7e75bb35d5ed61), [`c5da2ce`](https://github.com/LedgerHQ/ledger-live/commit/c5da2cef7cded2b53c1af9aa3174cd27e5c92e0a), [`bdacedf`](https://github.com/LedgerHQ/ledger-live/commit/bdacedfe32bea8ffce96ab675a44c0d7cf395143), [`5e8d6be`](https://github.com/LedgerHQ/ledger-live/commit/5e8d6be609dd37c48d747890e56189e0716d5273), [`3e70677`](https://github.com/LedgerHQ/ledger-live/commit/3e706774f8c4e9b768ab18b67abc3471cf61b6b6), [`aadb3d5`](https://github.com/LedgerHQ/ledger-live/commit/aadb3d57f5719cc2cc397975eafec8094b160afe), [`d4bad44`](https://github.com/LedgerHQ/ledger-live/commit/d4bad4433c3fb083d95820d2927a9e8beeaf244f), [`8d8e1b7`](https://github.com/LedgerHQ/ledger-live/commit/8d8e1b7bb26305af326ea21710248223d1e8653b), [`5e0556a`](https://github.com/LedgerHQ/ledger-live/commit/5e0556a3bd0ea60277462eed10c997b17b09d299), [`bce6610`](https://github.com/LedgerHQ/ledger-live/commit/bce6610ca8554a85f8f17b6014e921fdecd3fa4f), [`ddd40b4`](https://github.com/LedgerHQ/ledger-live/commit/ddd40b4cae93ecf3139fd33dc0f4dd1c8366d628), [`2a60165`](https://github.com/LedgerHQ/ledger-live/commit/2a601656b7a23a424a29f006ec53090648fdae4f), [`34248c3`](https://github.com/LedgerHQ/ledger-live/commit/34248c306479dafe6335b2c176daf25064c85b3b)]:
  - @ledgerhq/coin-framework@6.11.0-next.0
  - @ledgerhq/cryptoassets@13.35.0-next.0
  - @ledgerhq/errors@6.28.0-next.0
  - @ledgerhq/domain-service@1.5.0-next.0
  - @ledgerhq/evm-tools@1.9.0-next.0
  - @ledgerhq/live-env@2.23.0-next.0
  - @ledgerhq/devices@8.8.0-next.0
  - @ledgerhq/live-network@2.1.4-next.0

## 2.36.1

### Patch Changes

- Updated dependencies [[`b68b749`](https://github.com/LedgerHQ/ledger-live/commit/b68b749b53c9583dd983ab057faa89fced1e541e)]:
  - @ledgerhq/errors@6.27.1
  - @ledgerhq/coin-framework@6.10.1
  - @ledgerhq/domain-service@1.4.3
  - @ledgerhq/cryptoassets@13.34.1
  - @ledgerhq/devices@8.7.1
  - @ledgerhq/live-network@2.1.3

## 2.36.1-hotfix.0

### Patch Changes

- Updated dependencies [[`b68b749`](https://github.com/LedgerHQ/ledger-live/commit/b68b749b53c9583dd983ab057faa89fced1e541e)]:
  - @ledgerhq/errors@6.27.1-hotfix.0
  - @ledgerhq/coin-framework@6.10.1-hotfix.0
  - @ledgerhq/domain-service@1.4.3-hotfix.0
  - @ledgerhq/cryptoassets@13.34.1-hotfix.0
  - @ledgerhq/devices@8.7.1-hotfix.0
  - @ledgerhq/live-network@2.1.3-hotfix.0

## 2.36.0

### Minor Changes

- [#12974](https://github.com/LedgerHQ/ledger-live/pull/12974) [`e6a0ea2`](https://github.com/LedgerHQ/ledger-live/commit/e6a0ea2cc2ef00d4b15596e1173598c013ef6bed) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(coin-evm): invalid operation status for failed token transaction

- [#12677](https://github.com/LedgerHQ/ledger-live/pull/12677) [`fe81926`](https://github.com/LedgerHQ/ledger-live/commit/fe81926afeb2df8e917e6bd1e4cbab13f09647fd) Thanks [@semeano](https://github.com/semeano)! - Add 0G coin

- [#12734](https://github.com/LedgerHQ/ledger-live/pull/12734) [`903ea9c`](https://github.com/LedgerHQ/ledger-live/commit/903ea9cdacf704a0119de2803a4f409b775391a5) Thanks [@semeano](https://github.com/semeano)! - Add Monad testnet

- [#12889](https://github.com/LedgerHQ/ledger-live/pull/12889) [`bf6f5d3`](https://github.com/LedgerHQ/ledger-live/commit/bf6f5d39cf752138741d16b246d1bc322426f9e5) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - refactor(llc): use core operation `tx.failed` property

- [#12795](https://github.com/LedgerHQ/ledger-live/pull/12795) [`e37c057`](https://github.com/LedgerHQ/ledger-live/commit/e37c057e66b71d25fbcef48c07adfb08253bbf64) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(coin-evm): respect list operations order

- [#12675](https://github.com/LedgerHQ/ledger-live/pull/12675) [`9659a34`](https://github.com/LedgerHQ/ledger-live/commit/9659a34d9998d5c4dff8618bf6cef7d16403680d) Thanks [@semeano](https://github.com/semeano)! - Add Somnia coin

### Patch Changes

- Updated dependencies [[`50aeea1`](https://github.com/LedgerHQ/ledger-live/commit/50aeea1233056e9abff9568eb928927f39e76cff), [`a2ecb55`](https://github.com/LedgerHQ/ledger-live/commit/a2ecb55df9d383dc282f5fe489cb14386208215e), [`fe81926`](https://github.com/LedgerHQ/ledger-live/commit/fe81926afeb2df8e917e6bd1e4cbab13f09647fd), [`67137eb`](https://github.com/LedgerHQ/ledger-live/commit/67137eb5d7f04dd5f3610fdaa4e463d292654105), [`49ef24c`](https://github.com/LedgerHQ/ledger-live/commit/49ef24cbd1948bfd146af0b20f2128951b2dc170), [`b4a4e16`](https://github.com/LedgerHQ/ledger-live/commit/b4a4e160aae6fd64f944ab25633f6931dc4358d3), [`903ea9c`](https://github.com/LedgerHQ/ledger-live/commit/903ea9cdacf704a0119de2803a4f409b775391a5), [`9251b77`](https://github.com/LedgerHQ/ledger-live/commit/9251b77fcb01709723842f19220a2a41a6fc8f3b), [`02ef98f`](https://github.com/LedgerHQ/ledger-live/commit/02ef98faeb13c182ef255e06a43c39abeb55ecc7), [`6d0c6b2`](https://github.com/LedgerHQ/ledger-live/commit/6d0c6b2eda60049d8eebda5de2c54e8f0be7d009), [`b113920`](https://github.com/LedgerHQ/ledger-live/commit/b11392056bc334fc1813c473569ad3ae7be08045), [`9659a34`](https://github.com/LedgerHQ/ledger-live/commit/9659a34d9998d5c4dff8618bf6cef7d16403680d)]:
  - @ledgerhq/cryptoassets@13.34.0
  - @ledgerhq/coin-framework@6.10.0
  - @ledgerhq/live-env@2.22.0
  - @ledgerhq/domain-service@1.4.2
  - @ledgerhq/evm-tools@1.8.2
  - @ledgerhq/live-network@2.1.2

## 2.36.0-next.0

### Minor Changes

- [#12974](https://github.com/LedgerHQ/ledger-live/pull/12974) [`e6a0ea2`](https://github.com/LedgerHQ/ledger-live/commit/e6a0ea2cc2ef00d4b15596e1173598c013ef6bed) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(coin-evm): invalid operation status for failed token transaction

- [#12677](https://github.com/LedgerHQ/ledger-live/pull/12677) [`fe81926`](https://github.com/LedgerHQ/ledger-live/commit/fe81926afeb2df8e917e6bd1e4cbab13f09647fd) Thanks [@semeano](https://github.com/semeano)! - Add 0G coin

- [#12734](https://github.com/LedgerHQ/ledger-live/pull/12734) [`903ea9c`](https://github.com/LedgerHQ/ledger-live/commit/903ea9cdacf704a0119de2803a4f409b775391a5) Thanks [@semeano](https://github.com/semeano)! - Add Monad testnet

- [#12889](https://github.com/LedgerHQ/ledger-live/pull/12889) [`bf6f5d3`](https://github.com/LedgerHQ/ledger-live/commit/bf6f5d39cf752138741d16b246d1bc322426f9e5) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - refactor(llc): use core operation `tx.failed` property

- [#12795](https://github.com/LedgerHQ/ledger-live/pull/12795) [`e37c057`](https://github.com/LedgerHQ/ledger-live/commit/e37c057e66b71d25fbcef48c07adfb08253bbf64) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(coin-evm): respect list operations order

- [#12675](https://github.com/LedgerHQ/ledger-live/pull/12675) [`9659a34`](https://github.com/LedgerHQ/ledger-live/commit/9659a34d9998d5c4dff8618bf6cef7d16403680d) Thanks [@semeano](https://github.com/semeano)! - Add Somnia coin

### Patch Changes

- Updated dependencies [[`50aeea1`](https://github.com/LedgerHQ/ledger-live/commit/50aeea1233056e9abff9568eb928927f39e76cff), [`a2ecb55`](https://github.com/LedgerHQ/ledger-live/commit/a2ecb55df9d383dc282f5fe489cb14386208215e), [`fe81926`](https://github.com/LedgerHQ/ledger-live/commit/fe81926afeb2df8e917e6bd1e4cbab13f09647fd), [`67137eb`](https://github.com/LedgerHQ/ledger-live/commit/67137eb5d7f04dd5f3610fdaa4e463d292654105), [`49ef24c`](https://github.com/LedgerHQ/ledger-live/commit/49ef24cbd1948bfd146af0b20f2128951b2dc170), [`b4a4e16`](https://github.com/LedgerHQ/ledger-live/commit/b4a4e160aae6fd64f944ab25633f6931dc4358d3), [`903ea9c`](https://github.com/LedgerHQ/ledger-live/commit/903ea9cdacf704a0119de2803a4f409b775391a5), [`9251b77`](https://github.com/LedgerHQ/ledger-live/commit/9251b77fcb01709723842f19220a2a41a6fc8f3b), [`02ef98f`](https://github.com/LedgerHQ/ledger-live/commit/02ef98faeb13c182ef255e06a43c39abeb55ecc7), [`6d0c6b2`](https://github.com/LedgerHQ/ledger-live/commit/6d0c6b2eda60049d8eebda5de2c54e8f0be7d009), [`b113920`](https://github.com/LedgerHQ/ledger-live/commit/b11392056bc334fc1813c473569ad3ae7be08045), [`9659a34`](https://github.com/LedgerHQ/ledger-live/commit/9659a34d9998d5c4dff8618bf6cef7d16403680d)]:
  - @ledgerhq/cryptoassets@13.34.0-next.0
  - @ledgerhq/coin-framework@6.10.0-next.0
  - @ledgerhq/live-env@2.22.0-next.0
  - @ledgerhq/domain-service@1.4.2-next.0
  - @ledgerhq/evm-tools@1.8.2-next.0
  - @ledgerhq/live-network@2.1.2-next.0

## 2.35.0

### Minor Changes

- [#12572](https://github.com/LedgerHQ/ledger-live/pull/12572) [`74a340b`](https://github.com/LedgerHQ/ledger-live/commit/74a340b258589c9c37476103029eb036b930616c) Thanks [@gre-ledger](https://github.com/gre-ledger)! - BREAKING: CryptoAssetsStore interface is now fully async. All token lookup methods return Promises. Bot system and coin modules updated to support async token operations.

- [#12402](https://github.com/LedgerHQ/ledger-live/pull/12402) [`544721d`](https://github.com/LedgerHQ/ledger-live/commit/544721d198454526ef83516619d59c881ba34eb9) Thanks [@qperrot](https://github.com/qperrot)! - Fix transactionSequenceNumber type

- [#12248](https://github.com/LedgerHQ/ledger-live/pull/12248) [`f0e3f10`](https://github.com/LedgerHQ/ledger-live/commit/f0e3f10aaddadc03d7ebac577c4d4a0dd4d3d044) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - feat(coin-evm): dynamically adjust transaction type

- [#12500](https://github.com/LedgerHQ/ledger-live/pull/12500) [`9f61dcf`](https://github.com/LedgerHQ/ledger-live/commit/9f61dcf6163fd66657e5be732c28bea623a40515) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - LIVE-21900 EVM/Hedera/Cardano/TON: sync hash calculation to not depends on listTokens()

- [#12469](https://github.com/LedgerHQ/ledger-live/pull/12469) [`479abcc`](https://github.com/LedgerHQ/ledger-live/commit/479abcc77310297226726271d3bdad7668a084ee) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - feat(llc): enable transaction replacement in generic adapter

- [#12604](https://github.com/LedgerHQ/ledger-live/pull/12604) [`eb5a17e`](https://github.com/LedgerHQ/ledger-live/commit/eb5a17e4db336eaa871eaeb52ffa5248e0f78bec) Thanks [@jnicoulaud-ledger](https://github.com/jnicoulaud-ledger)! - coin-modules/alpaca: add transaction status to operations

### Patch Changes

- Updated dependencies [[`74a340b`](https://github.com/LedgerHQ/ledger-live/commit/74a340b258589c9c37476103029eb036b930616c), [`b69c97d`](https://github.com/LedgerHQ/ledger-live/commit/b69c97d979ba97154c9abfda6abfc2a36becee4f), [`544721d`](https://github.com/LedgerHQ/ledger-live/commit/544721d198454526ef83516619d59c881ba34eb9), [`9f61dcf`](https://github.com/LedgerHQ/ledger-live/commit/9f61dcf6163fd66657e5be732c28bea623a40515), [`938b970`](https://github.com/LedgerHQ/ledger-live/commit/938b970e15118dc706c759a3bec27dc01c3dd268), [`c40e9da`](https://github.com/LedgerHQ/ledger-live/commit/c40e9da68452fe9827b9435ff2d162291186be73), [`c0b5b9f`](https://github.com/LedgerHQ/ledger-live/commit/c0b5b9f4cdcb2ea3e15419cbf3d1a14f725c3e6a), [`eb5a17e`](https://github.com/LedgerHQ/ledger-live/commit/eb5a17e4db336eaa871eaeb52ffa5248e0f78bec)]:
  - @ledgerhq/cryptoassets@13.33.0
  - @ledgerhq/coin-framework@6.9.0
  - @ledgerhq/live-env@2.21.0
  - @ledgerhq/domain-service@1.4.1
  - @ledgerhq/evm-tools@1.8.1
  - @ledgerhq/live-network@2.1.1

## 2.35.0-next.0

### Minor Changes

- [#12572](https://github.com/LedgerHQ/ledger-live/pull/12572) [`74a340b`](https://github.com/LedgerHQ/ledger-live/commit/74a340b258589c9c37476103029eb036b930616c) Thanks [@gre-ledger](https://github.com/gre-ledger)! - BREAKING: CryptoAssetsStore interface is now fully async. All token lookup methods return Promises. Bot system and coin modules updated to support async token operations.

- [#12402](https://github.com/LedgerHQ/ledger-live/pull/12402) [`544721d`](https://github.com/LedgerHQ/ledger-live/commit/544721d198454526ef83516619d59c881ba34eb9) Thanks [@qperrot](https://github.com/qperrot)! - Fix transactionSequenceNumber type

- [#12248](https://github.com/LedgerHQ/ledger-live/pull/12248) [`f0e3f10`](https://github.com/LedgerHQ/ledger-live/commit/f0e3f10aaddadc03d7ebac577c4d4a0dd4d3d044) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - feat(coin-evm): dynamically adjust transaction type

- [#12500](https://github.com/LedgerHQ/ledger-live/pull/12500) [`9f61dcf`](https://github.com/LedgerHQ/ledger-live/commit/9f61dcf6163fd66657e5be732c28bea623a40515) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - LIVE-21900 EVM/Hedera/Cardano/TON: sync hash calculation to not depends on listTokens()

- [#12469](https://github.com/LedgerHQ/ledger-live/pull/12469) [`479abcc`](https://github.com/LedgerHQ/ledger-live/commit/479abcc77310297226726271d3bdad7668a084ee) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - feat(llc): enable transaction replacement in generic adapter

- [#12604](https://github.com/LedgerHQ/ledger-live/pull/12604) [`eb5a17e`](https://github.com/LedgerHQ/ledger-live/commit/eb5a17e4db336eaa871eaeb52ffa5248e0f78bec) Thanks [@jnicoulaud-ledger](https://github.com/jnicoulaud-ledger)! - coin-modules/alpaca: add transaction status to operations

### Patch Changes

- Updated dependencies [[`74a340b`](https://github.com/LedgerHQ/ledger-live/commit/74a340b258589c9c37476103029eb036b930616c), [`b69c97d`](https://github.com/LedgerHQ/ledger-live/commit/b69c97d979ba97154c9abfda6abfc2a36becee4f), [`544721d`](https://github.com/LedgerHQ/ledger-live/commit/544721d198454526ef83516619d59c881ba34eb9), [`9f61dcf`](https://github.com/LedgerHQ/ledger-live/commit/9f61dcf6163fd66657e5be732c28bea623a40515), [`938b970`](https://github.com/LedgerHQ/ledger-live/commit/938b970e15118dc706c759a3bec27dc01c3dd268), [`c40e9da`](https://github.com/LedgerHQ/ledger-live/commit/c40e9da68452fe9827b9435ff2d162291186be73), [`c0b5b9f`](https://github.com/LedgerHQ/ledger-live/commit/c0b5b9f4cdcb2ea3e15419cbf3d1a14f725c3e6a), [`eb5a17e`](https://github.com/LedgerHQ/ledger-live/commit/eb5a17e4db336eaa871eaeb52ffa5248e0f78bec)]:
  - @ledgerhq/cryptoassets@13.33.0-next.0
  - @ledgerhq/coin-framework@6.9.0-next.0
  - @ledgerhq/live-env@2.21.0-next.0
  - @ledgerhq/domain-service@1.4.1-next.0
  - @ledgerhq/evm-tools@1.8.1-next.0
  - @ledgerhq/live-network@2.1.1-next.0

## 2.34.0

### Minor Changes

- [#12409](https://github.com/LedgerHQ/ledger-live/pull/12409) [`965692a`](https://github.com/LedgerHQ/ledger-live/commit/965692a3c88e114616e3f9c0e76ab2bfbb57a85f) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(coin-evm): add resilience when failing to get token balance

- [#12321](https://github.com/LedgerHQ/ledger-live/pull/12321) [`63e8f34`](https://github.com/LedgerHQ/ledger-live/commit/63e8f342f6b951ab77bb710b9971f033c05e579e) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Bump axios version to 1.12.2

- [#12420](https://github.com/LedgerHQ/ledger-live/pull/12420) [`34b28dd`](https://github.com/LedgerHQ/ledger-live/commit/34b28dd5e819906daaa79db5fe6064674def5e7d) Thanks [@semeano](https://github.com/semeano)! - Add Monad currency

- [#12340](https://github.com/LedgerHQ/ledger-live/pull/12340) [`8d7c1f7`](https://github.com/LedgerHQ/ledger-live/commit/8d7c1f7a92489647399b0e780d4bb926508e8554) Thanks [@gre-ledger](https://github.com/gre-ledger)! - migrate getDeviceTransactionConfig to async

- [#12245](https://github.com/LedgerHQ/ledger-live/pull/12245) [`0b57e76`](https://github.com/LedgerHQ/ledger-live/commit/0b57e7631fadf0e1ecd08d0c6302bf0ac728173b) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - add status to getTransaction

- [#12297](https://github.com/LedgerHQ/ledger-live/pull/12297) [`c96d73f`](https://github.com/LedgerHQ/ledger-live/commit/c96d73fed0a75a9c208f78d51c34b742703a7dda) Thanks [@Justkant](https://github.com/Justkant)! - feat(coin-framework): add postSync support to scanAccounts and apply across coins [LIVE-21755]

  Adds optional postSync hook to makeScanAccounts (invoked after account shape build).
  Applies postSync in bitcoin, cardano, evm, and tron currency bridges.
  Exports tron postSync so it can be passed during scanning.
  Ensures scanAccounts benefits from the same normalization/cleanup logic as sync without breaking existing callers (default no-op).

- [#12197](https://github.com/LedgerHQ/ledger-live/pull/12197) [`7744980`](https://github.com/LedgerHQ/ledger-live/commit/774498090411f1a6d6c06395dda1fc7cd24adf24) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Adding sponsored transactions to evm based swap transactions

- [#12235](https://github.com/LedgerHQ/ledger-live/pull/12235) [`ae0f8e4`](https://github.com/LedgerHQ/ledger-live/commit/ae0f8e4fb7fed90b7b110769b4bef54642fc24cf) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - feat(llc): support multiple sub operations in the generic adapter

- [#12431](https://github.com/LedgerHQ/ledger-live/pull/12431) [`4095b90`](https://github.com/LedgerHQ/ledger-live/commit/4095b9024527c16454eff9d5c44ed825375296ea) Thanks [@gre-ledger](https://github.com/gre-ledger)! - dedup ethers library

- [#12366](https://github.com/LedgerHQ/ledger-live/pull/12366) [`eb176c2`](https://github.com/LedgerHQ/ledger-live/commit/eb176c201d711f1d28f74de831c4a6cd0c2d4a50) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - feat(llc): forward pending operations in generic adapter

- [#12372](https://github.com/LedgerHQ/ledger-live/pull/12372) [`a731c4c`](https://github.com/LedgerHQ/ledger-live/commit/a731c4cd492a968eb7baa981fdd8aaddedd21f25) Thanks [@jprudent](https://github.com/jprudent)! - Add AlpacaApi.getValidators and implementation for SUI

- [#12382](https://github.com/LedgerHQ/ledger-live/pull/12382) [`3d4188a`](https://github.com/LedgerHQ/ledger-live/commit/3d4188a26021d33b950129d82cb55d2c2e8d4358) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Introduce CryptoAssetStore#getTokensSyncHash function

### Patch Changes

- Updated dependencies [[`b4ceaff`](https://github.com/LedgerHQ/ledger-live/commit/b4ceaff2ecf68d8a14e09801c76ab0b014c45286), [`da750a1`](https://github.com/LedgerHQ/ledger-live/commit/da750a16ee5f2c083114569b8ae3c708cceba06c), [`63e8f34`](https://github.com/LedgerHQ/ledger-live/commit/63e8f342f6b951ab77bb710b9971f033c05e579e), [`ccf788d`](https://github.com/LedgerHQ/ledger-live/commit/ccf788d7c0239ca95e76c3cc340f9a6bd09ea726), [`34b28dd`](https://github.com/LedgerHQ/ledger-live/commit/34b28dd5e819906daaa79db5fe6064674def5e7d), [`607e4be`](https://github.com/LedgerHQ/ledger-live/commit/607e4be33145c102debce1606224b08579888aa8), [`c96d73f`](https://github.com/LedgerHQ/ledger-live/commit/c96d73fed0a75a9c208f78d51c34b742703a7dda), [`c1a4bfd`](https://github.com/LedgerHQ/ledger-live/commit/c1a4bfd34b46c6b6587d247673cadb3c078deb1d), [`f8d904d`](https://github.com/LedgerHQ/ledger-live/commit/f8d904de5607c103549f247428b5a4079f28c1c0), [`eb176c2`](https://github.com/LedgerHQ/ledger-live/commit/eb176c201d711f1d28f74de831c4a6cd0c2d4a50), [`a731c4c`](https://github.com/LedgerHQ/ledger-live/commit/a731c4cd492a968eb7baa981fdd8aaddedd21f25), [`b962966`](https://github.com/LedgerHQ/ledger-live/commit/b962966525517c5cfa7f1f8826f8f2b9162189e4), [`759064d`](https://github.com/LedgerHQ/ledger-live/commit/759064d4815c636af2d73ba548a85b4f53e7b491), [`cadf2e1`](https://github.com/LedgerHQ/ledger-live/commit/cadf2e1dfb09248d3f77d96f94ae774425dbca75), [`cbc0648`](https://github.com/LedgerHQ/ledger-live/commit/cbc064885d8e0459e40d327a2e5389204b3ec705), [`36e5168`](https://github.com/LedgerHQ/ledger-live/commit/36e5168397eaec2a5f425038392a4400f60571d0), [`6ccabef`](https://github.com/LedgerHQ/ledger-live/commit/6ccabef8f3c4e8cc042299d531684595ebadcc55), [`3d4188a`](https://github.com/LedgerHQ/ledger-live/commit/3d4188a26021d33b950129d82cb55d2c2e8d4358), [`d9305e8`](https://github.com/LedgerHQ/ledger-live/commit/d9305e8a4d8364366aaba05dd698396d28b539dc)]:
  - @ledgerhq/cryptoassets@13.32.0
  - @ledgerhq/coin-framework@6.8.0
  - @ledgerhq/domain-service@1.4.0
  - @ledgerhq/live-network@2.1.0
  - @ledgerhq/evm-tools@1.8.0
  - @ledgerhq/live-env@2.20.0
  - @ledgerhq/devices@8.7.0
  - @ledgerhq/errors@6.27.0

## 2.34.0-next.0

### Minor Changes

- [#12409](https://github.com/LedgerHQ/ledger-live/pull/12409) [`965692a`](https://github.com/LedgerHQ/ledger-live/commit/965692a3c88e114616e3f9c0e76ab2bfbb57a85f) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(coin-evm): add resilience when failing to get token balance

- [#12321](https://github.com/LedgerHQ/ledger-live/pull/12321) [`63e8f34`](https://github.com/LedgerHQ/ledger-live/commit/63e8f342f6b951ab77bb710b9971f033c05e579e) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Bump axios version to 1.12.2

- [#12420](https://github.com/LedgerHQ/ledger-live/pull/12420) [`34b28dd`](https://github.com/LedgerHQ/ledger-live/commit/34b28dd5e819906daaa79db5fe6064674def5e7d) Thanks [@semeano](https://github.com/semeano)! - Add Monad currency

- [#12340](https://github.com/LedgerHQ/ledger-live/pull/12340) [`8d7c1f7`](https://github.com/LedgerHQ/ledger-live/commit/8d7c1f7a92489647399b0e780d4bb926508e8554) Thanks [@gre-ledger](https://github.com/gre-ledger)! - migrate getDeviceTransactionConfig to async

- [#12245](https://github.com/LedgerHQ/ledger-live/pull/12245) [`0b57e76`](https://github.com/LedgerHQ/ledger-live/commit/0b57e7631fadf0e1ecd08d0c6302bf0ac728173b) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - add status to getTransaction

- [#12297](https://github.com/LedgerHQ/ledger-live/pull/12297) [`c96d73f`](https://github.com/LedgerHQ/ledger-live/commit/c96d73fed0a75a9c208f78d51c34b742703a7dda) Thanks [@Justkant](https://github.com/Justkant)! - feat(coin-framework): add postSync support to scanAccounts and apply across coins [LIVE-21755]

  Adds optional postSync hook to makeScanAccounts (invoked after account shape build).
  Applies postSync in bitcoin, cardano, evm, and tron currency bridges.
  Exports tron postSync so it can be passed during scanning.
  Ensures scanAccounts benefits from the same normalization/cleanup logic as sync without breaking existing callers (default no-op).

- [#12197](https://github.com/LedgerHQ/ledger-live/pull/12197) [`7744980`](https://github.com/LedgerHQ/ledger-live/commit/774498090411f1a6d6c06395dda1fc7cd24adf24) Thanks [@philipptpunkt](https://github.com/philipptpunkt)! - Adding sponsored transactions to evm based swap transactions

- [#12235](https://github.com/LedgerHQ/ledger-live/pull/12235) [`ae0f8e4`](https://github.com/LedgerHQ/ledger-live/commit/ae0f8e4fb7fed90b7b110769b4bef54642fc24cf) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - feat(llc): support multiple sub operations in the generic adapter

- [#12431](https://github.com/LedgerHQ/ledger-live/pull/12431) [`4095b90`](https://github.com/LedgerHQ/ledger-live/commit/4095b9024527c16454eff9d5c44ed825375296ea) Thanks [@gre-ledger](https://github.com/gre-ledger)! - dedup ethers library

- [#12366](https://github.com/LedgerHQ/ledger-live/pull/12366) [`eb176c2`](https://github.com/LedgerHQ/ledger-live/commit/eb176c201d711f1d28f74de831c4a6cd0c2d4a50) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - feat(llc): forward pending operations in generic adapter

- [#12372](https://github.com/LedgerHQ/ledger-live/pull/12372) [`a731c4c`](https://github.com/LedgerHQ/ledger-live/commit/a731c4cd492a968eb7baa981fdd8aaddedd21f25) Thanks [@jprudent](https://github.com/jprudent)! - Add AlpacaApi.getValidators and implementation for SUI

- [#12382](https://github.com/LedgerHQ/ledger-live/pull/12382) [`3d4188a`](https://github.com/LedgerHQ/ledger-live/commit/3d4188a26021d33b950129d82cb55d2c2e8d4358) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Introduce CryptoAssetStore#getTokensSyncHash function

### Patch Changes

- Updated dependencies [[`b4ceaff`](https://github.com/LedgerHQ/ledger-live/commit/b4ceaff2ecf68d8a14e09801c76ab0b014c45286), [`da750a1`](https://github.com/LedgerHQ/ledger-live/commit/da750a16ee5f2c083114569b8ae3c708cceba06c), [`63e8f34`](https://github.com/LedgerHQ/ledger-live/commit/63e8f342f6b951ab77bb710b9971f033c05e579e), [`ccf788d`](https://github.com/LedgerHQ/ledger-live/commit/ccf788d7c0239ca95e76c3cc340f9a6bd09ea726), [`34b28dd`](https://github.com/LedgerHQ/ledger-live/commit/34b28dd5e819906daaa79db5fe6064674def5e7d), [`607e4be`](https://github.com/LedgerHQ/ledger-live/commit/607e4be33145c102debce1606224b08579888aa8), [`c96d73f`](https://github.com/LedgerHQ/ledger-live/commit/c96d73fed0a75a9c208f78d51c34b742703a7dda), [`c1a4bfd`](https://github.com/LedgerHQ/ledger-live/commit/c1a4bfd34b46c6b6587d247673cadb3c078deb1d), [`f8d904d`](https://github.com/LedgerHQ/ledger-live/commit/f8d904de5607c103549f247428b5a4079f28c1c0), [`eb176c2`](https://github.com/LedgerHQ/ledger-live/commit/eb176c201d711f1d28f74de831c4a6cd0c2d4a50), [`a731c4c`](https://github.com/LedgerHQ/ledger-live/commit/a731c4cd492a968eb7baa981fdd8aaddedd21f25), [`b962966`](https://github.com/LedgerHQ/ledger-live/commit/b962966525517c5cfa7f1f8826f8f2b9162189e4), [`759064d`](https://github.com/LedgerHQ/ledger-live/commit/759064d4815c636af2d73ba548a85b4f53e7b491), [`cadf2e1`](https://github.com/LedgerHQ/ledger-live/commit/cadf2e1dfb09248d3f77d96f94ae774425dbca75), [`cbc0648`](https://github.com/LedgerHQ/ledger-live/commit/cbc064885d8e0459e40d327a2e5389204b3ec705), [`36e5168`](https://github.com/LedgerHQ/ledger-live/commit/36e5168397eaec2a5f425038392a4400f60571d0), [`6ccabef`](https://github.com/LedgerHQ/ledger-live/commit/6ccabef8f3c4e8cc042299d531684595ebadcc55), [`3d4188a`](https://github.com/LedgerHQ/ledger-live/commit/3d4188a26021d33b950129d82cb55d2c2e8d4358), [`d9305e8`](https://github.com/LedgerHQ/ledger-live/commit/d9305e8a4d8364366aaba05dd698396d28b539dc)]:
  - @ledgerhq/cryptoassets@13.32.0-next.0
  - @ledgerhq/coin-framework@6.8.0-next.0
  - @ledgerhq/domain-service@1.4.0-next.0
  - @ledgerhq/live-network@2.1.0-next.0
  - @ledgerhq/evm-tools@1.8.0-next.0
  - @ledgerhq/live-env@2.20.0-next.0
  - @ledgerhq/devices@8.7.0-next.0
  - @ledgerhq/errors@6.27.0-next.0

## 2.33.0

### Minor Changes

- [#12072](https://github.com/LedgerHQ/ledger-live/pull/12072) [`2bdc741`](https://github.com/LedgerHQ/ledger-live/commit/2bdc741cf7ae42ca2a7d0eebbe9515d9fdd69603) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - feat(coin-evm): recompute fees from parameters

- [#11965](https://github.com/LedgerHQ/ledger-live/pull/11965) [`3979c07`](https://github.com/LedgerHQ/ledger-live/commit/3979c0715e4f54165c89d00ebe1441e064e1a110) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - refactor(coin-evm,coin-stellar): remove CAL dependency from Alpaca

- [#12128](https://github.com/LedgerHQ/ledger-live/pull/12128) [`c6a676f`](https://github.com/LedgerHQ/ledger-live/commit/c6a676ff80581ac19b896adf44d54812983b72da) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - feat(coin-evm): support layer 2 fees and gas options

- [#12130](https://github.com/LedgerHQ/ledger-live/pull/12130) [`b5fc1bd`](https://github.com/LedgerHQ/ledger-live/commit/b5fc1bd28fff091241905fec5ff8dc8af4c99b79) Thanks [@qperrot](https://github.com/qperrot)! - Feat listOperations for EVM staking

- [#12015](https://github.com/LedgerHQ/ledger-live/pull/12015) [`03af552`](https://github.com/LedgerHQ/ledger-live/commit/03af552b621e19e31747a65b1870dfe8d3bb005b) Thanks [@Justkant](https://github.com/Justkant)! - feat: new signRawTransaction to support any XRP transaction with wallet-api

- [#12185](https://github.com/LedgerHQ/ledger-live/pull/12185) [`89ac0ed`](https://github.com/LedgerHQ/ledger-live/commit/89ac0eddc145dcf5c7cf240aa8be4301372c8f33) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Remove deprecated findTokenByAddress in favor of findTokenByAddressInCurrency

  Removed the deprecated `findTokenByAddress` function which had ambiguous behavior when multiple tokens shared the same contract address across different blockchains. The function has been fully replaced with `findTokenByAddressInCurrency` which requires both the token address and parent currency ID, providing more precise token lookup.

  This includes:

  - Removal of `findTokenByAddress` function from cryptoassets package
  - Removal of `tokensByAddress` state dictionary
  - Update all usages to `findTokenByAddressInCurrency` across the codebase
  - Update CryptoAssetsStore interface to remove the deprecated method

- [#12196](https://github.com/LedgerHQ/ledger-live/pull/12196) [`565da80`](https://github.com/LedgerHQ/ledger-live/commit/565da807b1ebbfc830fd0e47b3d8856f88d410a6) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Remove deprecated getTokenById and hasTokenId functions

- [#12062](https://github.com/LedgerHQ/ledger-live/pull/12062) [`d2b12e7`](https://github.com/LedgerHQ/ledger-live/commit/d2b12e70bba9e772d078d1fe4d9c537b8d316a87) Thanks [@qperrot](https://github.com/qperrot)! - feat: estimateFees and craftTransaction for evm staking and new Intent type

### Patch Changes

- Updated dependencies [[`4cac377`](https://github.com/LedgerHQ/ledger-live/commit/4cac377401fac788e2bbedf7aee1ee57b82f4d18), [`ea16f59`](https://github.com/LedgerHQ/ledger-live/commit/ea16f592e85019a1b77287a7f2b975c6fcffc74c), [`cfe65ca`](https://github.com/LedgerHQ/ledger-live/commit/cfe65cafa268be4e53197ee163ce78f28ed72592), [`a9aacdb`](https://github.com/LedgerHQ/ledger-live/commit/a9aacdb330700f0a294833f7d77de17f179229b2), [`3979c07`](https://github.com/LedgerHQ/ledger-live/commit/3979c0715e4f54165c89d00ebe1441e064e1a110), [`f1f3845`](https://github.com/LedgerHQ/ledger-live/commit/f1f3845942e4cbce9c585dc65f6170ddbc319f19), [`c6a676f`](https://github.com/LedgerHQ/ledger-live/commit/c6a676ff80581ac19b896adf44d54812983b72da), [`b5fc1bd`](https://github.com/LedgerHQ/ledger-live/commit/b5fc1bd28fff091241905fec5ff8dc8af4c99b79), [`03af552`](https://github.com/LedgerHQ/ledger-live/commit/03af552b621e19e31747a65b1870dfe8d3bb005b), [`89ac0ed`](https://github.com/LedgerHQ/ledger-live/commit/89ac0eddc145dcf5c7cf240aa8be4301372c8f33), [`565da80`](https://github.com/LedgerHQ/ledger-live/commit/565da807b1ebbfc830fd0e47b3d8856f88d410a6), [`1d9860c`](https://github.com/LedgerHQ/ledger-live/commit/1d9860cd1688131d391579955b40c6710b667db8), [`d2b12e7`](https://github.com/LedgerHQ/ledger-live/commit/d2b12e70bba9e772d078d1fe4d9c537b8d316a87), [`c8dbf40`](https://github.com/LedgerHQ/ledger-live/commit/c8dbf402268359e225a94782420111e786f875fa), [`cab7d97`](https://github.com/LedgerHQ/ledger-live/commit/cab7d9794e7babb8220c6d339fb08e618e3d4202)]:
  - @ledgerhq/domain-service@1.3.0
  - @ledgerhq/cryptoassets@13.31.0
  - @ledgerhq/coin-framework@6.7.0
  - @ledgerhq/live-env@2.19.0
  - @ledgerhq/evm-tools@1.7.9
  - @ledgerhq/live-network@2.0.20

## 2.33.0-next.1

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/coin-framework@6.7.0-next.1
  - @ledgerhq/domain-service@1.3.0-next.1
  - @ledgerhq/evm-tools@1.7.9-next.0
  - @ledgerhq/cryptoassets@13.31.0-next.1

## 2.33.0-next.0

### Minor Changes

- [#12072](https://github.com/LedgerHQ/ledger-live/pull/12072) [`2bdc741`](https://github.com/LedgerHQ/ledger-live/commit/2bdc741cf7ae42ca2a7d0eebbe9515d9fdd69603) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - feat(coin-evm): recompute fees from parameters

- [#11965](https://github.com/LedgerHQ/ledger-live/pull/11965) [`3979c07`](https://github.com/LedgerHQ/ledger-live/commit/3979c0715e4f54165c89d00ebe1441e064e1a110) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - refactor(coin-evm,coin-stellar): remove CAL dependency from Alpaca

- [#12128](https://github.com/LedgerHQ/ledger-live/pull/12128) [`c6a676f`](https://github.com/LedgerHQ/ledger-live/commit/c6a676ff80581ac19b896adf44d54812983b72da) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - feat(coin-evm): support layer 2 fees and gas options

- [#12130](https://github.com/LedgerHQ/ledger-live/pull/12130) [`b5fc1bd`](https://github.com/LedgerHQ/ledger-live/commit/b5fc1bd28fff091241905fec5ff8dc8af4c99b79) Thanks [@qperrot](https://github.com/qperrot)! - Feat listOperations for EVM staking

- [#12015](https://github.com/LedgerHQ/ledger-live/pull/12015) [`03af552`](https://github.com/LedgerHQ/ledger-live/commit/03af552b621e19e31747a65b1870dfe8d3bb005b) Thanks [@Justkant](https://github.com/Justkant)! - feat: new signRawTransaction to support any XRP transaction with wallet-api

- [#12185](https://github.com/LedgerHQ/ledger-live/pull/12185) [`89ac0ed`](https://github.com/LedgerHQ/ledger-live/commit/89ac0eddc145dcf5c7cf240aa8be4301372c8f33) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Remove deprecated findTokenByAddress in favor of findTokenByAddressInCurrency

  Removed the deprecated `findTokenByAddress` function which had ambiguous behavior when multiple tokens shared the same contract address across different blockchains. The function has been fully replaced with `findTokenByAddressInCurrency` which requires both the token address and parent currency ID, providing more precise token lookup.

  This includes:

  - Removal of `findTokenByAddress` function from cryptoassets package
  - Removal of `tokensByAddress` state dictionary
  - Update all usages to `findTokenByAddressInCurrency` across the codebase
  - Update CryptoAssetsStore interface to remove the deprecated method

- [#12196](https://github.com/LedgerHQ/ledger-live/pull/12196) [`565da80`](https://github.com/LedgerHQ/ledger-live/commit/565da807b1ebbfc830fd0e47b3d8856f88d410a6) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Remove deprecated getTokenById and hasTokenId functions

- [#12062](https://github.com/LedgerHQ/ledger-live/pull/12062) [`d2b12e7`](https://github.com/LedgerHQ/ledger-live/commit/d2b12e70bba9e772d078d1fe4d9c537b8d316a87) Thanks [@qperrot](https://github.com/qperrot)! - feat: estimateFees and craftTransaction for evm staking and new Intent type

### Patch Changes

- Updated dependencies [[`4cac377`](https://github.com/LedgerHQ/ledger-live/commit/4cac377401fac788e2bbedf7aee1ee57b82f4d18), [`ea16f59`](https://github.com/LedgerHQ/ledger-live/commit/ea16f592e85019a1b77287a7f2b975c6fcffc74c), [`cfe65ca`](https://github.com/LedgerHQ/ledger-live/commit/cfe65cafa268be4e53197ee163ce78f28ed72592), [`a9aacdb`](https://github.com/LedgerHQ/ledger-live/commit/a9aacdb330700f0a294833f7d77de17f179229b2), [`3979c07`](https://github.com/LedgerHQ/ledger-live/commit/3979c0715e4f54165c89d00ebe1441e064e1a110), [`f1f3845`](https://github.com/LedgerHQ/ledger-live/commit/f1f3845942e4cbce9c585dc65f6170ddbc319f19), [`c6a676f`](https://github.com/LedgerHQ/ledger-live/commit/c6a676ff80581ac19b896adf44d54812983b72da), [`b5fc1bd`](https://github.com/LedgerHQ/ledger-live/commit/b5fc1bd28fff091241905fec5ff8dc8af4c99b79), [`03af552`](https://github.com/LedgerHQ/ledger-live/commit/03af552b621e19e31747a65b1870dfe8d3bb005b), [`89ac0ed`](https://github.com/LedgerHQ/ledger-live/commit/89ac0eddc145dcf5c7cf240aa8be4301372c8f33), [`565da80`](https://github.com/LedgerHQ/ledger-live/commit/565da807b1ebbfc830fd0e47b3d8856f88d410a6), [`1d9860c`](https://github.com/LedgerHQ/ledger-live/commit/1d9860cd1688131d391579955b40c6710b667db8), [`d2b12e7`](https://github.com/LedgerHQ/ledger-live/commit/d2b12e70bba9e772d078d1fe4d9c537b8d316a87), [`c8dbf40`](https://github.com/LedgerHQ/ledger-live/commit/c8dbf402268359e225a94782420111e786f875fa), [`cab7d97`](https://github.com/LedgerHQ/ledger-live/commit/cab7d9794e7babb8220c6d339fb08e618e3d4202)]:
  - @ledgerhq/domain-service@1.3.0-next.0
  - @ledgerhq/cryptoassets@13.31.0-next.0
  - @ledgerhq/coin-framework@6.7.0-next.0
  - @ledgerhq/live-env@2.19.0-next.0
  - @ledgerhq/evm-tools@1.7.9-next.0
  - @ledgerhq/live-network@2.0.20-next.0

## 2.32.0

### Minor Changes

- [#11822](https://github.com/LedgerHQ/ledger-live/pull/11822) [`7ec652c`](https://github.com/LedgerHQ/ledger-live/commit/7ec652c31d8d634385919478386fe560a62be3a5) Thanks [@dilaouid](https://github.com/dilaouid)! - feat: getBalance returns staking positions

- [#11581](https://github.com/LedgerHQ/ledger-live/pull/11581) [`4d60b7e`](https://github.com/LedgerHQ/ledger-live/commit/4d60b7e0984f0f8ef75c1483e0cfaf5784fbc5ed) Thanks [@Canestin](https://github.com/Canestin)! - feature (lld,llm): integrate Core DAO Mainnet

- [#11889](https://github.com/LedgerHQ/ledger-live/pull/11889) [`e3b568d`](https://github.com/LedgerHQ/ledger-live/commit/e3b568d2cbeee6dcf19a7047ce9fa11a04b0ae2a) Thanks [@Canestin](https://github.com/Canestin)! - feat: ethereum hoodi testnet integration

- [#11929](https://github.com/LedgerHQ/ledger-live/pull/11929) [`0d368f0`](https://github.com/LedgerHQ/ledger-live/commit/0d368f0e682b3bd3daafa6af5b396648a95b1488) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - feature(coin-evm): pass calldata to intent

- [#11547](https://github.com/LedgerHQ/ledger-live/pull/11547) [`f4fa9d5`](https://github.com/LedgerHQ/ledger-live/commit/f4fa9d57e494db378bb00b114870b164a57c7039) Thanks [@dilaouid](https://github.com/dilaouid)! - feat: add getStakes method + contracts lists and methods

- [#11892](https://github.com/LedgerHQ/ledger-live/pull/11892) [`e56c3a8`](https://github.com/LedgerHQ/ledger-live/commit/e56c3a855d038cac74bdef225b9d057653c9ca18) Thanks [@jnicoulaud-ledger](https://github.com/jnicoulaud-ledger)! - tech(evm): parallelize balance fetching

### Patch Changes

- Updated dependencies [[`ab0e1bc`](https://github.com/LedgerHQ/ledger-live/commit/ab0e1bcc97b66b750b6c29e618eb03ce6f25bb7b), [`c2d8d86`](https://github.com/LedgerHQ/ledger-live/commit/c2d8d8670f848989836c46ea08ae88c88086fdd6), [`4d60b7e`](https://github.com/LedgerHQ/ledger-live/commit/4d60b7e0984f0f8ef75c1483e0cfaf5784fbc5ed), [`e3b568d`](https://github.com/LedgerHQ/ledger-live/commit/e3b568d2cbeee6dcf19a7047ce9fa11a04b0ae2a), [`0d368f0`](https://github.com/LedgerHQ/ledger-live/commit/0d368f0e682b3bd3daafa6af5b396648a95b1488), [`fe1abf6`](https://github.com/LedgerHQ/ledger-live/commit/fe1abf640cc1a30b2e78bf7aa4a12e983a068f2e)]:
  - @ledgerhq/cryptoassets@13.30.0
  - @ledgerhq/errors@6.26.0
  - @ledgerhq/live-env@2.18.0
  - @ledgerhq/coin-framework@6.6.0
  - @ledgerhq/domain-service@1.2.45
  - @ledgerhq/evm-tools@1.7.8
  - @ledgerhq/devices@8.6.1
  - @ledgerhq/live-network@2.0.19

## 2.32.0-next.0

### Minor Changes

- [#11822](https://github.com/LedgerHQ/ledger-live/pull/11822) [`7ec652c`](https://github.com/LedgerHQ/ledger-live/commit/7ec652c31d8d634385919478386fe560a62be3a5) Thanks [@dilaouid](https://github.com/dilaouid)! - feat: getBalance returns staking positions

- [#11581](https://github.com/LedgerHQ/ledger-live/pull/11581) [`4d60b7e`](https://github.com/LedgerHQ/ledger-live/commit/4d60b7e0984f0f8ef75c1483e0cfaf5784fbc5ed) Thanks [@Canestin](https://github.com/Canestin)! - feature (lld,llm): integrate Core DAO Mainnet

- [#11889](https://github.com/LedgerHQ/ledger-live/pull/11889) [`e3b568d`](https://github.com/LedgerHQ/ledger-live/commit/e3b568d2cbeee6dcf19a7047ce9fa11a04b0ae2a) Thanks [@Canestin](https://github.com/Canestin)! - feat: ethereum hoodi testnet integration

- [#11929](https://github.com/LedgerHQ/ledger-live/pull/11929) [`0d368f0`](https://github.com/LedgerHQ/ledger-live/commit/0d368f0e682b3bd3daafa6af5b396648a95b1488) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - feature(coin-evm): pass calldata to intent

- [#11547](https://github.com/LedgerHQ/ledger-live/pull/11547) [`f4fa9d5`](https://github.com/LedgerHQ/ledger-live/commit/f4fa9d57e494db378bb00b114870b164a57c7039) Thanks [@dilaouid](https://github.com/dilaouid)! - feat: add getStakes method + contracts lists and methods

- [#11892](https://github.com/LedgerHQ/ledger-live/pull/11892) [`e56c3a8`](https://github.com/LedgerHQ/ledger-live/commit/e56c3a855d038cac74bdef225b9d057653c9ca18) Thanks [@jnicoulaud-ledger](https://github.com/jnicoulaud-ledger)! - tech(evm): parallelize balance fetching

### Patch Changes

- Updated dependencies [[`ab0e1bc`](https://github.com/LedgerHQ/ledger-live/commit/ab0e1bcc97b66b750b6c29e618eb03ce6f25bb7b), [`c2d8d86`](https://github.com/LedgerHQ/ledger-live/commit/c2d8d8670f848989836c46ea08ae88c88086fdd6), [`4d60b7e`](https://github.com/LedgerHQ/ledger-live/commit/4d60b7e0984f0f8ef75c1483e0cfaf5784fbc5ed), [`e3b568d`](https://github.com/LedgerHQ/ledger-live/commit/e3b568d2cbeee6dcf19a7047ce9fa11a04b0ae2a), [`0d368f0`](https://github.com/LedgerHQ/ledger-live/commit/0d368f0e682b3bd3daafa6af5b396648a95b1488), [`fe1abf6`](https://github.com/LedgerHQ/ledger-live/commit/fe1abf640cc1a30b2e78bf7aa4a12e983a068f2e)]:
  - @ledgerhq/cryptoassets@13.30.0-next.0
  - @ledgerhq/errors@6.26.0-next.0
  - @ledgerhq/live-env@2.18.0-next.0
  - @ledgerhq/coin-framework@6.6.0-next.0
  - @ledgerhq/domain-service@1.2.45-next.0
  - @ledgerhq/evm-tools@1.7.8-next.0
  - @ledgerhq/devices@8.6.1-next.0
  - @ledgerhq/live-network@2.0.19-next.0

## 2.31.0

### Minor Changes

- [#11797](https://github.com/LedgerHQ/ledger-live/pull/11797) [`2444623`](https://github.com/LedgerHQ/ledger-live/commit/244462341ee0d2d85a2e1370624500e565cb030a) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - refactor(llc, coin-evm): support several EVM configs

- [#11677](https://github.com/LedgerHQ/ledger-live/pull/11677) [`f8092e3`](https://github.com/LedgerHQ/ledger-live/commit/f8092e3b3b5df2e4a7b8ba9f83d393701854d7f7) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - feat(coin-tester-evm): support the generic adapter

- [#11823](https://github.com/LedgerHQ/ledger-live/pull/11823) [`7d23713`](https://github.com/LedgerHQ/ledger-live/commit/7d23713789ff91bd93d0cdba7dbed27e4efec6ce) Thanks [@qperrot](https://github.com/qperrot)! - Remove duplicate code in estimateFees & craftTransaction

- [#11925](https://github.com/LedgerHQ/ledger-live/pull/11925) [`c40c867`](https://github.com/LedgerHQ/ledger-live/commit/c40c867c790107270a7db63eeacdddc67dd22769) Thanks [@qperrot](https://github.com/qperrot)! - Fix evm fetch tokens for external node

### Patch Changes

- Updated dependencies [[`38a172c`](https://github.com/LedgerHQ/ledger-live/commit/38a172c23035040d077433c7f4fce60f72962ae0), [`aaa16b7`](https://github.com/LedgerHQ/ledger-live/commit/aaa16b718454dca51d59bb138ab1a638dc4b8243), [`d56bebe`](https://github.com/LedgerHQ/ledger-live/commit/d56bebe672a1ed825697b371662dbff19dcc63d8), [`af64263`](https://github.com/LedgerHQ/ledger-live/commit/af642634bd4536183f766323d0ec5b9b99841dc6), [`0108eaf`](https://github.com/LedgerHQ/ledger-live/commit/0108eafb64e36ce68f44e03cc3f66ccdb5ee5a92), [`65c128a`](https://github.com/LedgerHQ/ledger-live/commit/65c128a93f07857b421bed3696bc9984f860ada9), [`3b5576e`](https://github.com/LedgerHQ/ledger-live/commit/3b5576e0b67fedad0f5dbbd6b9546281af4e6111), [`6941aac`](https://github.com/LedgerHQ/ledger-live/commit/6941aac638dcc8d4fb03aa92f42d2a71d4089202), [`fe97131`](https://github.com/LedgerHQ/ledger-live/commit/fe971313776194e5942dfa9a95d6082950c3111e), [`2a58b72`](https://github.com/LedgerHQ/ledger-live/commit/2a58b720de42e63e59ea430bd03b2c95e903634c)]:
  - @ledgerhq/devices@8.6.0
  - @ledgerhq/live-env@2.17.0
  - @ledgerhq/cryptoassets@13.29.0
  - @ledgerhq/coin-framework@6.5.0
  - @ledgerhq/evm-tools@1.7.7
  - @ledgerhq/live-network@2.0.18
  - @ledgerhq/domain-service@1.2.44

## 2.31.0-next.1

### Minor Changes

- [#11925](https://github.com/LedgerHQ/ledger-live/pull/11925) [`c40c867`](https://github.com/LedgerHQ/ledger-live/commit/c40c867c790107270a7db63eeacdddc67dd22769) Thanks [@qperrot](https://github.com/qperrot)! - Fix evm fetch tokens for external node

## 2.31.0-next.0

### Minor Changes

- [#11797](https://github.com/LedgerHQ/ledger-live/pull/11797) [`2444623`](https://github.com/LedgerHQ/ledger-live/commit/244462341ee0d2d85a2e1370624500e565cb030a) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - refactor(llc, coin-evm): support several EVM configs

- [#11677](https://github.com/LedgerHQ/ledger-live/pull/11677) [`f8092e3`](https://github.com/LedgerHQ/ledger-live/commit/f8092e3b3b5df2e4a7b8ba9f83d393701854d7f7) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - feat(coin-tester-evm): support the generic adapter

- [#11823](https://github.com/LedgerHQ/ledger-live/pull/11823) [`7d23713`](https://github.com/LedgerHQ/ledger-live/commit/7d23713789ff91bd93d0cdba7dbed27e4efec6ce) Thanks [@qperrot](https://github.com/qperrot)! - Remove duplicate code in estimateFees & craftTransaction

### Patch Changes

- Updated dependencies [[`38a172c`](https://github.com/LedgerHQ/ledger-live/commit/38a172c23035040d077433c7f4fce60f72962ae0), [`aaa16b7`](https://github.com/LedgerHQ/ledger-live/commit/aaa16b718454dca51d59bb138ab1a638dc4b8243), [`d56bebe`](https://github.com/LedgerHQ/ledger-live/commit/d56bebe672a1ed825697b371662dbff19dcc63d8), [`af64263`](https://github.com/LedgerHQ/ledger-live/commit/af642634bd4536183f766323d0ec5b9b99841dc6), [`0108eaf`](https://github.com/LedgerHQ/ledger-live/commit/0108eafb64e36ce68f44e03cc3f66ccdb5ee5a92), [`65c128a`](https://github.com/LedgerHQ/ledger-live/commit/65c128a93f07857b421bed3696bc9984f860ada9), [`3b5576e`](https://github.com/LedgerHQ/ledger-live/commit/3b5576e0b67fedad0f5dbbd6b9546281af4e6111), [`6941aac`](https://github.com/LedgerHQ/ledger-live/commit/6941aac638dcc8d4fb03aa92f42d2a71d4089202), [`fe97131`](https://github.com/LedgerHQ/ledger-live/commit/fe971313776194e5942dfa9a95d6082950c3111e), [`2a58b72`](https://github.com/LedgerHQ/ledger-live/commit/2a58b720de42e63e59ea430bd03b2c95e903634c)]:
  - @ledgerhq/devices@8.6.0-next.0
  - @ledgerhq/live-env@2.17.0-next.0
  - @ledgerhq/cryptoassets@13.29.0-next.0
  - @ledgerhq/coin-framework@6.5.0-next.0
  - @ledgerhq/evm-tools@1.7.7-next.0
  - @ledgerhq/live-network@2.0.18-next.0
  - @ledgerhq/domain-service@1.2.44-next.0

## 2.30.0

### Minor Changes

- [#11582](https://github.com/LedgerHQ/ledger-live/pull/11582) [`776fae2`](https://github.com/LedgerHQ/ledger-live/commit/776fae24bf98f4695ea729885259e6b1b0a2fc14) Thanks [@qperrot](https://github.com/qperrot)! - Update ethers library to v6.15.0

- [#11699](https://github.com/LedgerHQ/ledger-live/pull/11699) [`2b896f9`](https://github.com/LedgerHQ/ledger-live/commit/2b896f94d6fc53ef965ed567489ad96d913466d4) Thanks [@jnicoulaud-ledger](https://github.com/jnicoulaud-ledger)! - feat(BACK-9645): add support for returning details in AlpacaApi.craftTransaction

- [#11273](https://github.com/LedgerHQ/ledger-live/pull/11273) [`2482195`](https://github.com/LedgerHQ/ledger-live/commit/24821957c838a304be60ff6e16798ef3cac987cd) Thanks [@estrauser-ledger](https://github.com/estrauser-ledger)! - add cursor to pagintion api

- [#11494](https://github.com/LedgerHQ/ledger-live/pull/11494) [`89fc31e`](https://github.com/LedgerHQ/ledger-live/commit/89fc31e8ecfc5e2fd679a2694b3514f8fb19d7b7) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - feat(coin-framework): add `getTokenFromAsset` in `BridgeApi`

- [#11657](https://github.com/LedgerHQ/ledger-live/pull/11657) [`4835688`](https://github.com/LedgerHQ/ledger-live/commit/48356882efadc15ed59f608e01b44cdcbc6637fb) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - refactor(coin-evm): rework coin EVM `listOperations`

- [#11625](https://github.com/LedgerHQ/ledger-live/pull/11625) [`3489203`](https://github.com/LedgerHQ/ledger-live/commit/34892030dcfbd1a19a0eb0a8fcae9f8f01d3d2a9) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - refactor(llc): use standard token account id encoding

### Patch Changes

- Updated dependencies [[`2b896f9`](https://github.com/LedgerHQ/ledger-live/commit/2b896f94d6fc53ef965ed567489ad96d913466d4), [`338d979`](https://github.com/LedgerHQ/ledger-live/commit/338d979bae349b185c52b1d8c9f6718a3d142526), [`2482195`](https://github.com/LedgerHQ/ledger-live/commit/24821957c838a304be60ff6e16798ef3cac987cd), [`e52268a`](https://github.com/LedgerHQ/ledger-live/commit/e52268a3bc7d97a7ed09ed082786a647e048a6e8), [`89fc31e`](https://github.com/LedgerHQ/ledger-live/commit/89fc31e8ecfc5e2fd679a2694b3514f8fb19d7b7), [`ff22728`](https://github.com/LedgerHQ/ledger-live/commit/ff22728a61ab2cde6835991bf8ed115d4a39a1d0), [`c190e2b`](https://github.com/LedgerHQ/ledger-live/commit/c190e2b104a9dd0dd693c2d72433b98115f4089f), [`a87922d`](https://github.com/LedgerHQ/ledger-live/commit/a87922dc99e4f2e4b40a46fd52ad08a71012fe94), [`3489203`](https://github.com/LedgerHQ/ledger-live/commit/34892030dcfbd1a19a0eb0a8fcae9f8f01d3d2a9), [`b27c96c`](https://github.com/LedgerHQ/ledger-live/commit/b27c96ccbcefb1982a40688a8385209eac99165a)]:
  - @ledgerhq/coin-framework@6.4.0
  - @ledgerhq/cryptoassets@13.28.0
  - @ledgerhq/live-env@2.16.0
  - @ledgerhq/domain-service@1.2.43
  - @ledgerhq/evm-tools@1.7.6
  - @ledgerhq/live-network@2.0.17

## 2.30.0-next.0

### Minor Changes

- [#11582](https://github.com/LedgerHQ/ledger-live/pull/11582) [`776fae2`](https://github.com/LedgerHQ/ledger-live/commit/776fae24bf98f4695ea729885259e6b1b0a2fc14) Thanks [@qperrot](https://github.com/qperrot)! - Update ethers library to v6.15.0

- [#11699](https://github.com/LedgerHQ/ledger-live/pull/11699) [`2b896f9`](https://github.com/LedgerHQ/ledger-live/commit/2b896f94d6fc53ef965ed567489ad96d913466d4) Thanks [@jnicoulaud-ledger](https://github.com/jnicoulaud-ledger)! - feat(BACK-9645): add support for returning details in AlpacaApi.craftTransaction

- [#11273](https://github.com/LedgerHQ/ledger-live/pull/11273) [`2482195`](https://github.com/LedgerHQ/ledger-live/commit/24821957c838a304be60ff6e16798ef3cac987cd) Thanks [@estrauser-ledger](https://github.com/estrauser-ledger)! - add cursor to pagintion api

- [#11494](https://github.com/LedgerHQ/ledger-live/pull/11494) [`89fc31e`](https://github.com/LedgerHQ/ledger-live/commit/89fc31e8ecfc5e2fd679a2694b3514f8fb19d7b7) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - feat(coin-framework): add `getTokenFromAsset` in `BridgeApi`

- [#11657](https://github.com/LedgerHQ/ledger-live/pull/11657) [`4835688`](https://github.com/LedgerHQ/ledger-live/commit/48356882efadc15ed59f608e01b44cdcbc6637fb) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - refactor(coin-evm): rework coin EVM `listOperations`

- [#11625](https://github.com/LedgerHQ/ledger-live/pull/11625) [`3489203`](https://github.com/LedgerHQ/ledger-live/commit/34892030dcfbd1a19a0eb0a8fcae9f8f01d3d2a9) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - refactor(llc): use standard token account id encoding

### Patch Changes

- Updated dependencies [[`2b896f9`](https://github.com/LedgerHQ/ledger-live/commit/2b896f94d6fc53ef965ed567489ad96d913466d4), [`338d979`](https://github.com/LedgerHQ/ledger-live/commit/338d979bae349b185c52b1d8c9f6718a3d142526), [`2482195`](https://github.com/LedgerHQ/ledger-live/commit/24821957c838a304be60ff6e16798ef3cac987cd), [`e52268a`](https://github.com/LedgerHQ/ledger-live/commit/e52268a3bc7d97a7ed09ed082786a647e048a6e8), [`89fc31e`](https://github.com/LedgerHQ/ledger-live/commit/89fc31e8ecfc5e2fd679a2694b3514f8fb19d7b7), [`ff22728`](https://github.com/LedgerHQ/ledger-live/commit/ff22728a61ab2cde6835991bf8ed115d4a39a1d0), [`c190e2b`](https://github.com/LedgerHQ/ledger-live/commit/c190e2b104a9dd0dd693c2d72433b98115f4089f), [`a87922d`](https://github.com/LedgerHQ/ledger-live/commit/a87922dc99e4f2e4b40a46fd52ad08a71012fe94), [`3489203`](https://github.com/LedgerHQ/ledger-live/commit/34892030dcfbd1a19a0eb0a8fcae9f8f01d3d2a9), [`b27c96c`](https://github.com/LedgerHQ/ledger-live/commit/b27c96ccbcefb1982a40688a8385209eac99165a)]:
  - @ledgerhq/coin-framework@6.4.0-next.0
  - @ledgerhq/cryptoassets@13.28.0-next.0
  - @ledgerhq/live-env@2.16.0-next.0
  - @ledgerhq/domain-service@1.2.43-next.0
  - @ledgerhq/evm-tools@1.7.6-next.0
  - @ledgerhq/live-network@2.0.17-next.0

## 2.29.0

### Minor Changes

- [#11454](https://github.com/LedgerHQ/ledger-live/pull/11454) [`212f772`](https://github.com/LedgerHQ/ledger-live/commit/212f772b17dc3db97009ebe62912f8f183c1ef2e) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-modules): add `eqeqeq` ESLint rule

- [#11527](https://github.com/LedgerHQ/ledger-live/pull/11527) [`a9a0c18`](https://github.com/LedgerHQ/ledger-live/commit/a9a0c18d91cac8d4bb805d558d3d0bd50337d98a) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - test(coin-evm): fix integration tests

- [#11313](https://github.com/LedgerHQ/ledger-live/pull/11313) [`d6a6a94`](https://github.com/LedgerHQ/ledger-live/commit/d6a6a949d45fdd2f97f15842c808bf6d1058403f) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - Update EVM createBridge function signature for CAL lazy loading

- [#11424](https://github.com/LedgerHQ/ledger-live/pull/11424) [`2834ca4`](https://github.com/LedgerHQ/ledger-live/commit/2834ca443fe9071979d3b506e4ca4fbc17aeca7b) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - feat(coin-evm): return `gasLimit` and `gasOptions` is `estimateFees`

- [#11309](https://github.com/LedgerHQ/ledger-live/pull/11309) [`e8899f0`](https://github.com/LedgerHQ/ledger-live/commit/e8899f0dac12c6ca9c655c121eeb907f6bbad844) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - feat(coin-evm): implement `validateIntent`

- [#11382](https://github.com/LedgerHQ/ledger-live/pull/11382) [`2a4070b`](https://github.com/LedgerHQ/ledger-live/commit/2a4070b594271007fa47dc7451b612008a233006) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-evm): revert "adapt `estimateFees` parameters"

### Patch Changes

- Updated dependencies [[`12277dc`](https://github.com/LedgerHQ/ledger-live/commit/12277dcb478f24152060e3e11e2eb37d650b5b60), [`acdc089`](https://github.com/LedgerHQ/ledger-live/commit/acdc089f934461dd2fdfdfd61aa907f1520a5d7b), [`87617a9`](https://github.com/LedgerHQ/ledger-live/commit/87617a9930be43a6cdbc5cc5711cc24b00309184), [`9fcc4eb`](https://github.com/LedgerHQ/ledger-live/commit/9fcc4eb5cd6e96e772daa154bd87ae374f925ddc), [`d6a6a94`](https://github.com/LedgerHQ/ledger-live/commit/d6a6a949d45fdd2f97f15842c808bf6d1058403f), [`8936f39`](https://github.com/LedgerHQ/ledger-live/commit/8936f390edbe9cbc36ac6590b01562daf5c580e1), [`0356d19`](https://github.com/LedgerHQ/ledger-live/commit/0356d1904dbb5e856970fa7e7ebb206eed7b4c5d), [`516176d`](https://github.com/LedgerHQ/ledger-live/commit/516176d18c7f53961799e92e8804c4a756684266)]:
  - @ledgerhq/cryptoassets@13.27.0
  - @ledgerhq/coin-framework@6.3.0
  - @ledgerhq/live-env@2.15.0
  - @ledgerhq/errors@6.25.0
  - @ledgerhq/domain-service@1.2.42
  - @ledgerhq/evm-tools@1.7.5
  - @ledgerhq/live-network@2.0.16
  - @ledgerhq/devices@8.5.1

## 2.29.0-next.0

### Minor Changes

- [#11454](https://github.com/LedgerHQ/ledger-live/pull/11454) [`212f772`](https://github.com/LedgerHQ/ledger-live/commit/212f772b17dc3db97009ebe62912f8f183c1ef2e) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-modules): add `eqeqeq` ESLint rule

- [#11527](https://github.com/LedgerHQ/ledger-live/pull/11527) [`a9a0c18`](https://github.com/LedgerHQ/ledger-live/commit/a9a0c18d91cac8d4bb805d558d3d0bd50337d98a) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - test(coin-evm): fix integration tests

- [#11313](https://github.com/LedgerHQ/ledger-live/pull/11313) [`d6a6a94`](https://github.com/LedgerHQ/ledger-live/commit/d6a6a949d45fdd2f97f15842c808bf6d1058403f) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - Update EVM createBridge function signature for CAL lazy loading

- [#11424](https://github.com/LedgerHQ/ledger-live/pull/11424) [`2834ca4`](https://github.com/LedgerHQ/ledger-live/commit/2834ca443fe9071979d3b506e4ca4fbc17aeca7b) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - feat(coin-evm): return `gasLimit` and `gasOptions` is `estimateFees`

- [#11309](https://github.com/LedgerHQ/ledger-live/pull/11309) [`e8899f0`](https://github.com/LedgerHQ/ledger-live/commit/e8899f0dac12c6ca9c655c121eeb907f6bbad844) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - feat(coin-evm): implement `validateIntent`

- [#11382](https://github.com/LedgerHQ/ledger-live/pull/11382) [`2a4070b`](https://github.com/LedgerHQ/ledger-live/commit/2a4070b594271007fa47dc7451b612008a233006) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-evm): revert "adapt `estimateFees` parameters"

### Patch Changes

- Updated dependencies [[`12277dc`](https://github.com/LedgerHQ/ledger-live/commit/12277dcb478f24152060e3e11e2eb37d650b5b60), [`acdc089`](https://github.com/LedgerHQ/ledger-live/commit/acdc089f934461dd2fdfdfd61aa907f1520a5d7b), [`87617a9`](https://github.com/LedgerHQ/ledger-live/commit/87617a9930be43a6cdbc5cc5711cc24b00309184), [`9fcc4eb`](https://github.com/LedgerHQ/ledger-live/commit/9fcc4eb5cd6e96e772daa154bd87ae374f925ddc), [`d6a6a94`](https://github.com/LedgerHQ/ledger-live/commit/d6a6a949d45fdd2f97f15842c808bf6d1058403f), [`8936f39`](https://github.com/LedgerHQ/ledger-live/commit/8936f390edbe9cbc36ac6590b01562daf5c580e1), [`0356d19`](https://github.com/LedgerHQ/ledger-live/commit/0356d1904dbb5e856970fa7e7ebb206eed7b4c5d), [`516176d`](https://github.com/LedgerHQ/ledger-live/commit/516176d18c7f53961799e92e8804c4a756684266)]:
  - @ledgerhq/cryptoassets@13.27.0-next.0
  - @ledgerhq/coin-framework@6.3.0-next.0
  - @ledgerhq/live-env@2.15.0-next.0
  - @ledgerhq/errors@6.25.0-next.0
  - @ledgerhq/domain-service@1.2.42-next.0
  - @ledgerhq/evm-tools@1.7.5-next.0
  - @ledgerhq/live-network@2.0.16-next.0
  - @ledgerhq/devices@8.5.1-next.0

## 2.28.0

### Minor Changes

- [#11366](https://github.com/LedgerHQ/ledger-live/pull/11366) [`589e0e6`](https://github.com/LedgerHQ/ledger-live/commit/589e0e62092359f48b2a7d22d1d8ecf363ac04b1) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - feat(coin-evm): implement `getSequence`

- [#10420](https://github.com/LedgerHQ/ledger-live/pull/10420) [`80f8f1e`](https://github.com/LedgerHQ/ledger-live/commit/80f8f1eaef8a7bc84ba5441790296dec6cbfa199) Thanks [@Wozacosta](https://github.com/Wozacosta)! - Stellar Generic Adaptor

- [#11374](https://github.com/LedgerHQ/ledger-live/pull/11374) [`a3fcd55`](https://github.com/LedgerHQ/ledger-live/commit/a3fcd55fdea8c6ffbbb818825382cc96637fe8f5) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-evm): adapt `estimateFees` parameters

### Patch Changes

- Updated dependencies [[`1f1cbeb`](https://github.com/LedgerHQ/ledger-live/commit/1f1cbeb4485fb4b85b76ffe040c632d049f4e0c4), [`80f8f1e`](https://github.com/LedgerHQ/ledger-live/commit/80f8f1eaef8a7bc84ba5441790296dec6cbfa199), [`d41fc9c`](https://github.com/LedgerHQ/ledger-live/commit/d41fc9c458050ef1234c04af9642321c41cecda1), [`67ec10b`](https://github.com/LedgerHQ/ledger-live/commit/67ec10b773b4a6b512a8a6485940fa0abd41c3ef)]:
  - @ledgerhq/cryptoassets@13.26.0
  - @ledgerhq/coin-framework@6.2.0
  - @ledgerhq/evm-tools@1.7.4
  - @ledgerhq/domain-service@1.2.41

## 2.28.0-next.0

### Minor Changes

- [#11366](https://github.com/LedgerHQ/ledger-live/pull/11366) [`589e0e6`](https://github.com/LedgerHQ/ledger-live/commit/589e0e62092359f48b2a7d22d1d8ecf363ac04b1) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - feat(coin-evm): implement `getSequence`

- [#10420](https://github.com/LedgerHQ/ledger-live/pull/10420) [`80f8f1e`](https://github.com/LedgerHQ/ledger-live/commit/80f8f1eaef8a7bc84ba5441790296dec6cbfa199) Thanks [@Wozacosta](https://github.com/Wozacosta)! - Stellar Generic Adaptor

- [#11374](https://github.com/LedgerHQ/ledger-live/pull/11374) [`a3fcd55`](https://github.com/LedgerHQ/ledger-live/commit/a3fcd55fdea8c6ffbbb818825382cc96637fe8f5) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-evm): adapt `estimateFees` parameters

### Patch Changes

- Updated dependencies [[`1f1cbeb`](https://github.com/LedgerHQ/ledger-live/commit/1f1cbeb4485fb4b85b76ffe040c632d049f4e0c4), [`80f8f1e`](https://github.com/LedgerHQ/ledger-live/commit/80f8f1eaef8a7bc84ba5441790296dec6cbfa199), [`d41fc9c`](https://github.com/LedgerHQ/ledger-live/commit/d41fc9c458050ef1234c04af9642321c41cecda1), [`67ec10b`](https://github.com/LedgerHQ/ledger-live/commit/67ec10b773b4a6b512a8a6485940fa0abd41c3ef)]:
  - @ledgerhq/cryptoassets@13.26.0-next.0
  - @ledgerhq/coin-framework@6.2.0-next.0
  - @ledgerhq/evm-tools@1.7.4-next.0
  - @ledgerhq/domain-service@1.2.41-next.0

## 2.27.0

### Minor Changes

- [#11221](https://github.com/LedgerHQ/ledger-live/pull/11221) [`4cc85de`](https://github.com/LedgerHQ/ledger-live/commit/4cc85de8d28a3a0c28d095449b155f0e3e739caa) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-evm): populate `assetOwner` in `getBalance` and `listOperations`

- [#11016](https://github.com/LedgerHQ/ledger-live/pull/11016) [`a8b4f57`](https://github.com/LedgerHQ/ledger-live/commit/a8b4f57bf7d82e6c2444a65901e927c3c3d64412) Thanks [@jnicoulaud-ledger](https://github.com/jnicoulaud-ledger)! - [coin-modules] add coin-framework staking API + SUI implementation

- [#11248](https://github.com/LedgerHQ/ledger-live/pull/11248) [`6746cf0`](https://github.com/LedgerHQ/ledger-live/commit/6746cf0f61be566026b5d53d2dc648db543354d2) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - test(coin-evm): improve Alpaca integration tests

### Patch Changes

- Updated dependencies [[`75a08cc`](https://github.com/LedgerHQ/ledger-live/commit/75a08cc3061347bae98ddef7ac3cdcd6181ddab5), [`0c8486e`](https://github.com/LedgerHQ/ledger-live/commit/0c8486ea830e9e2abf1dfc5d108117e1db733072), [`354fa83`](https://github.com/LedgerHQ/ledger-live/commit/354fa83c8107cf8e6b56a8b306569ee65980e10c), [`a8b4f57`](https://github.com/LedgerHQ/ledger-live/commit/a8b4f57bf7d82e6c2444a65901e927c3c3d64412), [`67e2a7c`](https://github.com/LedgerHQ/ledger-live/commit/67e2a7c5a74d000f22684254778dfec5b8b5163d)]:
  - @ledgerhq/live-env@2.14.0
  - @ledgerhq/cryptoassets@13.25.0
  - @ledgerhq/errors@6.24.0
  - @ledgerhq/coin-framework@6.1.0
  - @ledgerhq/devices@8.5.0
  - @ledgerhq/evm-tools@1.7.3
  - @ledgerhq/live-network@2.0.15
  - @ledgerhq/domain-service@1.2.40

## 2.27.0-next.0

### Minor Changes

- [#11221](https://github.com/LedgerHQ/ledger-live/pull/11221) [`4cc85de`](https://github.com/LedgerHQ/ledger-live/commit/4cc85de8d28a3a0c28d095449b155f0e3e739caa) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-evm): populate `assetOwner` in `getBalance` and `listOperations`

- [#11016](https://github.com/LedgerHQ/ledger-live/pull/11016) [`a8b4f57`](https://github.com/LedgerHQ/ledger-live/commit/a8b4f57bf7d82e6c2444a65901e927c3c3d64412) Thanks [@jnicoulaud-ledger](https://github.com/jnicoulaud-ledger)! - [coin-modules] add coin-framework staking API + SUI implementation

- [#11248](https://github.com/LedgerHQ/ledger-live/pull/11248) [`6746cf0`](https://github.com/LedgerHQ/ledger-live/commit/6746cf0f61be566026b5d53d2dc648db543354d2) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - test(coin-evm): improve Alpaca integration tests

### Patch Changes

- Updated dependencies [[`75a08cc`](https://github.com/LedgerHQ/ledger-live/commit/75a08cc3061347bae98ddef7ac3cdcd6181ddab5), [`0c8486e`](https://github.com/LedgerHQ/ledger-live/commit/0c8486ea830e9e2abf1dfc5d108117e1db733072), [`354fa83`](https://github.com/LedgerHQ/ledger-live/commit/354fa83c8107cf8e6b56a8b306569ee65980e10c), [`a8b4f57`](https://github.com/LedgerHQ/ledger-live/commit/a8b4f57bf7d82e6c2444a65901e927c3c3d64412), [`67e2a7c`](https://github.com/LedgerHQ/ledger-live/commit/67e2a7c5a74d000f22684254778dfec5b8b5163d)]:
  - @ledgerhq/live-env@2.14.0-next.0
  - @ledgerhq/cryptoassets@13.25.0-next.0
  - @ledgerhq/errors@6.24.0-next.0
  - @ledgerhq/coin-framework@6.1.0-next.0
  - @ledgerhq/devices@8.5.0-next.0
  - @ledgerhq/evm-tools@1.7.3-next.0
  - @ledgerhq/live-network@2.0.15-next.0
  - @ledgerhq/domain-service@1.2.40-next.0

## 2.26.0

### Minor Changes

- [#11154](https://github.com/LedgerHQ/ledger-live/pull/11154) [`5bb2111`](https://github.com/LedgerHQ/ledger-live/commit/5bb2111d6a0c84cd0d6508bbf33d184bc89f9da3) Thanks [@qperrot](https://github.com/qperrot)! - Remove generic type for token assets

- [#11189](https://github.com/LedgerHQ/ledger-live/pull/11189) [`cf29b89`](https://github.com/LedgerHQ/ledger-live/commit/cf29b897219b6ea7963decf8e8dc0916cfb087b2) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(coin-evm): use `toFixed` instead of `toString`

- [#11142](https://github.com/LedgerHQ/ledger-live/pull/11142) [`9c200a4`](https://github.com/LedgerHQ/ledger-live/commit/9c200a44f0d8d0cb3995b64a85adbaa750c2452d) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - feat(coin-evm): support `customFees` in `craftTransaction`

- [#11027](https://github.com/LedgerHQ/ledger-live/pull/11027) [`9c63d6b`](https://github.com/LedgerHQ/ledger-live/commit/9c63d6b8d5fb629a19514ec36396c35eeefb96aa) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - Replace CoinFmk cryptoassets lib calls

- [#11147](https://github.com/LedgerHQ/ledger-live/pull/11147) [`8b0b4ef`](https://github.com/LedgerHQ/ledger-live/commit/8b0b4efaf2c0968cfb60c0cecebca9c575b00748) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - core(coin-framework): add `feesStrategy` property to `TransactionIntent`

### Patch Changes

- Updated dependencies [[`b5cbffa`](https://github.com/LedgerHQ/ledger-live/commit/b5cbffac207569027e241db761a6aa70b3b1b636), [`2da9b4a`](https://github.com/LedgerHQ/ledger-live/commit/2da9b4a5dd9fec3fea188fc9fa107b2c3479d1be), [`5bb2111`](https://github.com/LedgerHQ/ledger-live/commit/5bb2111d6a0c84cd0d6508bbf33d184bc89f9da3), [`417e4fc`](https://github.com/LedgerHQ/ledger-live/commit/417e4fc8b92ebc95542ca915e14023fdb62497bb), [`b9debdf`](https://github.com/LedgerHQ/ledger-live/commit/b9debdfbc822e9f5dc0b26619208f94bbd788777), [`9c63d6b`](https://github.com/LedgerHQ/ledger-live/commit/9c63d6b8d5fb629a19514ec36396c35eeefb96aa), [`8b0b4ef`](https://github.com/LedgerHQ/ledger-live/commit/8b0b4efaf2c0968cfb60c0cecebca9c575b00748)]:
  - @ledgerhq/cryptoassets@13.24.0
  - @ledgerhq/coin-framework@6.0.0
  - @ledgerhq/live-env@2.13.0
  - @ledgerhq/domain-service@1.2.39
  - @ledgerhq/evm-tools@1.7.2
  - @ledgerhq/live-network@2.0.14

## 2.26.0-next.0

### Minor Changes

- [#11154](https://github.com/LedgerHQ/ledger-live/pull/11154) [`5bb2111`](https://github.com/LedgerHQ/ledger-live/commit/5bb2111d6a0c84cd0d6508bbf33d184bc89f9da3) Thanks [@qperrot](https://github.com/qperrot)! - Remove generic type for token assets

- [#11189](https://github.com/LedgerHQ/ledger-live/pull/11189) [`cf29b89`](https://github.com/LedgerHQ/ledger-live/commit/cf29b897219b6ea7963decf8e8dc0916cfb087b2) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(coin-evm): use `toFixed` instead of `toString`

- [#11142](https://github.com/LedgerHQ/ledger-live/pull/11142) [`9c200a4`](https://github.com/LedgerHQ/ledger-live/commit/9c200a44f0d8d0cb3995b64a85adbaa750c2452d) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - feat(coin-evm): support `customFees` in `craftTransaction`

- [#11027](https://github.com/LedgerHQ/ledger-live/pull/11027) [`9c63d6b`](https://github.com/LedgerHQ/ledger-live/commit/9c63d6b8d5fb629a19514ec36396c35eeefb96aa) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - Replace CoinFmk cryptoassets lib calls

- [#11147](https://github.com/LedgerHQ/ledger-live/pull/11147) [`8b0b4ef`](https://github.com/LedgerHQ/ledger-live/commit/8b0b4efaf2c0968cfb60c0cecebca9c575b00748) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - core(coin-framework): add `feesStrategy` property to `TransactionIntent`

### Patch Changes

- Updated dependencies [[`b5cbffa`](https://github.com/LedgerHQ/ledger-live/commit/b5cbffac207569027e241db761a6aa70b3b1b636), [`2da9b4a`](https://github.com/LedgerHQ/ledger-live/commit/2da9b4a5dd9fec3fea188fc9fa107b2c3479d1be), [`5bb2111`](https://github.com/LedgerHQ/ledger-live/commit/5bb2111d6a0c84cd0d6508bbf33d184bc89f9da3), [`417e4fc`](https://github.com/LedgerHQ/ledger-live/commit/417e4fc8b92ebc95542ca915e14023fdb62497bb), [`b9debdf`](https://github.com/LedgerHQ/ledger-live/commit/b9debdfbc822e9f5dc0b26619208f94bbd788777), [`9c63d6b`](https://github.com/LedgerHQ/ledger-live/commit/9c63d6b8d5fb629a19514ec36396c35eeefb96aa), [`8b0b4ef`](https://github.com/LedgerHQ/ledger-live/commit/8b0b4efaf2c0968cfb60c0cecebca9c575b00748)]:
  - @ledgerhq/cryptoassets@13.24.0-next.0
  - @ledgerhq/coin-framework@6.0.0-next.0
  - @ledgerhq/live-env@2.13.0-next.0
  - @ledgerhq/domain-service@1.2.39-next.0
  - @ledgerhq/evm-tools@1.7.2-next.0
  - @ledgerhq/live-network@2.0.14-next.0

## 2.25.0

### Minor Changes

- [#11022](https://github.com/LedgerHQ/ledger-live/pull/11022) [`431725f`](https://github.com/LedgerHQ/ledger-live/commit/431725f3e23a1342a94c6b566d9be7728ff37fff) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - feat(coin-evm): support EIP-1559 in `craftTransaction`

- [#10838](https://github.com/LedgerHQ/ledger-live/pull/10838) [`d5f6793`](https://github.com/LedgerHQ/ledger-live/commit/d5f6793c6ae52178e93a19efc75931994bf930a8) Thanks [@jnicoulaud-ledger](https://github.com/jnicoulaud-ledger)! - [coin-modules][ALPACA] add getBlock to coin-framework API, implement it for SUI

### Patch Changes

- Updated dependencies [[`72c2a6c`](https://github.com/LedgerHQ/ledger-live/commit/72c2a6c91cfee66fac3505774ba16049fba1c0cf), [`6792990`](https://github.com/LedgerHQ/ledger-live/commit/6792990d8130ec297192bb7d6b98aef024e81dfa), [`d5f6793`](https://github.com/LedgerHQ/ledger-live/commit/d5f6793c6ae52178e93a19efc75931994bf930a8), [`132af3d`](https://github.com/LedgerHQ/ledger-live/commit/132af3db5863fb6e54587dd53d4db7b0ec19259e)]:
  - @ledgerhq/cryptoassets@13.23.0
  - @ledgerhq/coin-framework@5.8.0
  - @ledgerhq/domain-service@1.2.38
  - @ledgerhq/evm-tools@1.7.1

## 2.25.0-next.1

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/coin-framework@5.8.0-next.1
  - @ledgerhq/domain-service@1.2.38-next.1
  - @ledgerhq/evm-tools@1.7.1

## 2.25.0-next.0

### Minor Changes

- [#11022](https://github.com/LedgerHQ/ledger-live/pull/11022) [`431725f`](https://github.com/LedgerHQ/ledger-live/commit/431725f3e23a1342a94c6b566d9be7728ff37fff) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - feat(coin-evm): support EIP-1559 in `craftTransaction`

- [#10838](https://github.com/LedgerHQ/ledger-live/pull/10838) [`d5f6793`](https://github.com/LedgerHQ/ledger-live/commit/d5f6793c6ae52178e93a19efc75931994bf930a8) Thanks [@jnicoulaud-ledger](https://github.com/jnicoulaud-ledger)! - [coin-modules][ALPACA] add getBlock to coin-framework API, implement it for SUI

### Patch Changes

- Updated dependencies [[`72c2a6c`](https://github.com/LedgerHQ/ledger-live/commit/72c2a6c91cfee66fac3505774ba16049fba1c0cf), [`6792990`](https://github.com/LedgerHQ/ledger-live/commit/6792990d8130ec297192bb7d6b98aef024e81dfa), [`d5f6793`](https://github.com/LedgerHQ/ledger-live/commit/d5f6793c6ae52178e93a19efc75931994bf930a8), [`132af3d`](https://github.com/LedgerHQ/ledger-live/commit/132af3db5863fb6e54587dd53d4db7b0ec19259e)]:
  - @ledgerhq/cryptoassets@13.23.0-next.0
  - @ledgerhq/coin-framework@5.8.0-next.0
  - @ledgerhq/domain-service@1.2.38-next.0
  - @ledgerhq/evm-tools@1.7.1

## 2.24.0

### Minor Changes

- [#10845](https://github.com/LedgerHQ/ledger-live/pull/10845) [`2f95ad0`](https://github.com/LedgerHQ/ledger-live/commit/2f95ad048a482a8627a3cc511c94db4845152c9b) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - feat(coin-evm): add craft transaction

- [#10957](https://github.com/LedgerHQ/ledger-live/pull/10957) [`bf0607b`](https://github.com/LedgerHQ/ledger-live/commit/bf0607b191eb0c0ad30568dcf643a529be677da2) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(coin-evm): add getBalance (Alpaca)

- [#10955](https://github.com/LedgerHQ/ledger-live/pull/10955) [`582a016`](https://github.com/LedgerHQ/ledger-live/commit/582a016c79d80936e3ec5a22b16c79071d788ffe) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - deps: remove unused dependencies

- [#10931](https://github.com/LedgerHQ/ledger-live/pull/10931) [`4a2c078`](https://github.com/LedgerHQ/ledger-live/commit/4a2c0785883c025859a4b5ef8ac2083ddfd0d604) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - feat(coin-evm): add list operations

- [#10846](https://github.com/LedgerHQ/ledger-live/pull/10846) [`9c11b2c`](https://github.com/LedgerHQ/ledger-live/commit/9c11b2c7a9165fad82f9d15deecd2b77fdb00713) Thanks [@Canestin](https://github.com/Canestin)! - feat(coin-evm): add alpaca combine method

### Patch Changes

- Updated dependencies [[`17e039b`](https://github.com/LedgerHQ/ledger-live/commit/17e039b0c7487dda4a68f6a0fe493b4cf5fd265b), [`6ece1b8`](https://github.com/LedgerHQ/ledger-live/commit/6ece1b80ed05f9dab6541702e40a43b51887f958), [`bb7e311`](https://github.com/LedgerHQ/ledger-live/commit/bb7e31139763b9fd943bf237d2c6260d6aef24ab), [`9fd5b54`](https://github.com/LedgerHQ/ledger-live/commit/9fd5b5449f1d15fc559e966e9d71e2ad6573547c), [`63cdeb1`](https://github.com/LedgerHQ/ledger-live/commit/63cdeb1ea20fe0c16b623546ce00f3fe26b7ec80), [`20406e5`](https://github.com/LedgerHQ/ledger-live/commit/20406e52b4167289fced610c6ca9824a6d68cdac)]:
  - @ledgerhq/live-env@2.12.0
  - @ledgerhq/cryptoassets@13.22.0
  - @ledgerhq/coin-framework@5.7.0
  - @ledgerhq/errors@6.23.0
  - @ledgerhq/evm-tools@1.7.1
  - @ledgerhq/live-network@2.0.13
  - @ledgerhq/domain-service@1.2.37
  - @ledgerhq/devices@8.4.8

## 2.24.0-next.0

### Minor Changes

- [#10845](https://github.com/LedgerHQ/ledger-live/pull/10845) [`2f95ad0`](https://github.com/LedgerHQ/ledger-live/commit/2f95ad048a482a8627a3cc511c94db4845152c9b) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - feat(coin-evm): add craft transaction

- [#10957](https://github.com/LedgerHQ/ledger-live/pull/10957) [`bf0607b`](https://github.com/LedgerHQ/ledger-live/commit/bf0607b191eb0c0ad30568dcf643a529be677da2) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(coin-evm): add getBalance (Alpaca)

- [#10955](https://github.com/LedgerHQ/ledger-live/pull/10955) [`582a016`](https://github.com/LedgerHQ/ledger-live/commit/582a016c79d80936e3ec5a22b16c79071d788ffe) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - deps: remove unused dependencies

- [#10931](https://github.com/LedgerHQ/ledger-live/pull/10931) [`4a2c078`](https://github.com/LedgerHQ/ledger-live/commit/4a2c0785883c025859a4b5ef8ac2083ddfd0d604) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - feat(coin-evm): add list operations

- [#10846](https://github.com/LedgerHQ/ledger-live/pull/10846) [`9c11b2c`](https://github.com/LedgerHQ/ledger-live/commit/9c11b2c7a9165fad82f9d15deecd2b77fdb00713) Thanks [@Canestin](https://github.com/Canestin)! - feat(coin-evm): add alpaca combine method

### Patch Changes

- Updated dependencies [[`17e039b`](https://github.com/LedgerHQ/ledger-live/commit/17e039b0c7487dda4a68f6a0fe493b4cf5fd265b), [`6ece1b8`](https://github.com/LedgerHQ/ledger-live/commit/6ece1b80ed05f9dab6541702e40a43b51887f958), [`bb7e311`](https://github.com/LedgerHQ/ledger-live/commit/bb7e31139763b9fd943bf237d2c6260d6aef24ab), [`9fd5b54`](https://github.com/LedgerHQ/ledger-live/commit/9fd5b5449f1d15fc559e966e9d71e2ad6573547c), [`63cdeb1`](https://github.com/LedgerHQ/ledger-live/commit/63cdeb1ea20fe0c16b623546ce00f3fe26b7ec80), [`20406e5`](https://github.com/LedgerHQ/ledger-live/commit/20406e52b4167289fced610c6ca9824a6d68cdac)]:
  - @ledgerhq/live-env@2.12.0-next.0
  - @ledgerhq/cryptoassets@13.22.0-next.0
  - @ledgerhq/coin-framework@5.7.0-next.0
  - @ledgerhq/errors@6.23.0-next.0
  - @ledgerhq/evm-tools@1.7.1-next.0
  - @ledgerhq/live-network@2.0.13-next.0
  - @ledgerhq/domain-service@1.2.37-next.0
  - @ledgerhq/devices@8.4.8-next.0

## 2.23.0

### Minor Changes

- [#10811](https://github.com/LedgerHQ/ledger-live/pull/10811) [`ad01130`](https://github.com/LedgerHQ/ledger-live/commit/ad01130147094f0bf71691fdd31d243db7bcf791) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - refactor(coin-evm): remove cyclic imports

- [#10822](https://github.com/LedgerHQ/ledger-live/pull/10822) [`2f38d03`](https://github.com/LedgerHQ/ledger-live/commit/2f38d032ec8e8481e4ff3b37f33aa4eb3872b542) Thanks [@Canestin](https://github.com/Canestin)! - feat(coin-evm): EVM Alpacaization (part 1)

- [#10797](https://github.com/LedgerHQ/ledger-live/pull/10797) [`c57bdbe`](https://github.com/LedgerHQ/ledger-live/commit/c57bdbe55941a2f49eb4e8e33abc9fc697e4a3ba) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - refactor (coin-evm): move files to meet architecture

### Patch Changes

- Updated dependencies [[`90b023d`](https://github.com/LedgerHQ/ledger-live/commit/90b023d9a6db34fef865abf96ab31a5e0bcef42a), [`2f38d03`](https://github.com/LedgerHQ/ledger-live/commit/2f38d032ec8e8481e4ff3b37f33aa4eb3872b542)]:
  - @ledgerhq/coin-framework@5.6.0
  - @ledgerhq/domain-service@1.2.36
  - @ledgerhq/evm-tools@1.7.0

## 2.23.0-next.0

### Minor Changes

- [#10811](https://github.com/LedgerHQ/ledger-live/pull/10811) [`ad01130`](https://github.com/LedgerHQ/ledger-live/commit/ad01130147094f0bf71691fdd31d243db7bcf791) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - refactor(coin-evm): remove cyclic imports

- [#10822](https://github.com/LedgerHQ/ledger-live/pull/10822) [`2f38d03`](https://github.com/LedgerHQ/ledger-live/commit/2f38d032ec8e8481e4ff3b37f33aa4eb3872b542) Thanks [@Canestin](https://github.com/Canestin)! - feat(coin-evm): EVM Alpacaization (part 1)

- [#10797](https://github.com/LedgerHQ/ledger-live/pull/10797) [`c57bdbe`](https://github.com/LedgerHQ/ledger-live/commit/c57bdbe55941a2f49eb4e8e33abc9fc697e4a3ba) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - refactor (coin-evm): move files to meet architecture

### Patch Changes

- Updated dependencies [[`90b023d`](https://github.com/LedgerHQ/ledger-live/commit/90b023d9a6db34fef865abf96ab31a5e0bcef42a), [`2f38d03`](https://github.com/LedgerHQ/ledger-live/commit/2f38d032ec8e8481e4ff3b37f33aa4eb3872b542)]:
  - @ledgerhq/coin-framework@5.6.0-next.0
  - @ledgerhq/domain-service@1.2.36-next.0
  - @ledgerhq/evm-tools@1.7.0

## 2.22.6

### Patch Changes

- Updated dependencies [[`c6005ce`](https://github.com/LedgerHQ/ledger-live/commit/c6005ce8545acb596c2ff7770a0df848378ee83b), [`264316c`](https://github.com/LedgerHQ/ledger-live/commit/264316c9524f13b760460c2f1a2bc822767cff95), [`264316c`](https://github.com/LedgerHQ/ledger-live/commit/264316c9524f13b760460c2f1a2bc822767cff95), [`9d646eb`](https://github.com/LedgerHQ/ledger-live/commit/9d646eb6ca28b41af950b264c7d799a7ad536207)]:
  - @ledgerhq/cryptoassets@13.21.0
  - @ledgerhq/coin-framework@5.5.0
  - @ledgerhq/domain-service@1.2.35
  - @ledgerhq/evm-tools@1.7.0

## 2.22.6-next.0

### Patch Changes

- Updated dependencies [[`c6005ce`](https://github.com/LedgerHQ/ledger-live/commit/c6005ce8545acb596c2ff7770a0df848378ee83b), [`264316c`](https://github.com/LedgerHQ/ledger-live/commit/264316c9524f13b760460c2f1a2bc822767cff95), [`264316c`](https://github.com/LedgerHQ/ledger-live/commit/264316c9524f13b760460c2f1a2bc822767cff95), [`9d646eb`](https://github.com/LedgerHQ/ledger-live/commit/9d646eb6ca28b41af950b264c7d799a7ad536207)]:
  - @ledgerhq/cryptoassets@13.21.0-next.0
  - @ledgerhq/coin-framework@5.5.0-next.0
  - @ledgerhq/domain-service@1.2.35-next.0
  - @ledgerhq/evm-tools@1.7.0

## 2.22.5

### Patch Changes

- Updated dependencies [[`881dc73`](https://github.com/LedgerHQ/ledger-live/commit/881dc73e98bba95567fc2a4a6c54659d44f22957), [`5735489`](https://github.com/LedgerHQ/ledger-live/commit/5735489ddcee66110fc0cccc6bdd696876b8be4d)]:
  - @ledgerhq/evm-tools@1.7.0
  - @ledgerhq/cryptoassets@13.20.0
  - @ledgerhq/live-env@2.11.0
  - @ledgerhq/coin-framework@5.4.1
  - @ledgerhq/domain-service@1.2.34
  - @ledgerhq/live-network@2.0.12

## 2.22.5-next.0

### Patch Changes

- Updated dependencies [[`881dc73`](https://github.com/LedgerHQ/ledger-live/commit/881dc73e98bba95567fc2a4a6c54659d44f22957), [`5735489`](https://github.com/LedgerHQ/ledger-live/commit/5735489ddcee66110fc0cccc6bdd696876b8be4d)]:
  - @ledgerhq/evm-tools@1.7.0-next.0
  - @ledgerhq/cryptoassets@13.20.0-next.0
  - @ledgerhq/live-env@2.11.0-next.0
  - @ledgerhq/coin-framework@5.4.1-next.0
  - @ledgerhq/domain-service@1.2.34-next.0
  - @ledgerhq/live-network@2.0.12-next.0

## 2.22.4

### Patch Changes

- Updated dependencies [[`b5e3217`](https://github.com/LedgerHQ/ledger-live/commit/b5e321789d3a6f9cb1916067790590640db0876f), [`4d9aaf5`](https://github.com/LedgerHQ/ledger-live/commit/4d9aaf583060a22cd1343b23d9b5c1ee3c02abb4), [`5739a67`](https://github.com/LedgerHQ/ledger-live/commit/5739a67975dfc2509d5abd4ff13ea36af010f93e)]:
  - @ledgerhq/errors@6.22.0
  - @ledgerhq/coin-framework@5.4.0
  - @ledgerhq/cryptoassets@13.19.0
  - @ledgerhq/domain-service@1.2.33
  - @ledgerhq/evm-tools@1.6.4
  - @ledgerhq/devices@8.4.7
  - @ledgerhq/live-network@2.0.11

## 2.22.4-next.0

### Patch Changes

- Updated dependencies [[`b5e3217`](https://github.com/LedgerHQ/ledger-live/commit/b5e321789d3a6f9cb1916067790590640db0876f), [`4d9aaf5`](https://github.com/LedgerHQ/ledger-live/commit/4d9aaf583060a22cd1343b23d9b5c1ee3c02abb4), [`5739a67`](https://github.com/LedgerHQ/ledger-live/commit/5739a67975dfc2509d5abd4ff13ea36af010f93e)]:
  - @ledgerhq/errors@6.22.0-next.0
  - @ledgerhq/coin-framework@5.4.0-next.0
  - @ledgerhq/cryptoassets@13.19.0-next.0
  - @ledgerhq/domain-service@1.2.33-next.0
  - @ledgerhq/evm-tools@1.6.4
  - @ledgerhq/devices@8.4.7-next.0
  - @ledgerhq/live-network@2.0.11-next.0

## 2.22.3

### Patch Changes

- Updated dependencies [[`8551c28`](https://github.com/LedgerHQ/ledger-live/commit/8551c280f24f7bd4475c6cc12f1b1d92636d9357), [`18bc0d4`](https://github.com/LedgerHQ/ledger-live/commit/18bc0d4a27696491400df6ce26b915a88b56792f), [`99385c9`](https://github.com/LedgerHQ/ledger-live/commit/99385c9a7ecac9328ffa29c039e8c0cf2317c431), [`e04d215`](https://github.com/LedgerHQ/ledger-live/commit/e04d21576919fa21cb3ab6e1c4e8e50fb6c17eca), [`1535307`](https://github.com/LedgerHQ/ledger-live/commit/1535307f78d345d7f652ac2c91c8a67e62fedef2)]:
  - @ledgerhq/live-env@2.10.0
  - @ledgerhq/coin-framework@5.3.0
  - @ledgerhq/evm-tools@1.6.4
  - @ledgerhq/cryptoassets@13.18.1
  - @ledgerhq/live-network@2.0.10
  - @ledgerhq/domain-service@1.2.32

## 2.22.3-next.1

### Patch Changes

- Updated dependencies [[`99385c9`](https://github.com/LedgerHQ/ledger-live/commit/99385c9a7ecac9328ffa29c039e8c0cf2317c431)]:
  - @ledgerhq/coin-framework@5.3.0-next.1

## 2.22.3-next.0

### Patch Changes

- Updated dependencies [[`8551c28`](https://github.com/LedgerHQ/ledger-live/commit/8551c280f24f7bd4475c6cc12f1b1d92636d9357), [`18bc0d4`](https://github.com/LedgerHQ/ledger-live/commit/18bc0d4a27696491400df6ce26b915a88b56792f), [`e04d215`](https://github.com/LedgerHQ/ledger-live/commit/e04d21576919fa21cb3ab6e1c4e8e50fb6c17eca), [`1535307`](https://github.com/LedgerHQ/ledger-live/commit/1535307f78d345d7f652ac2c91c8a67e62fedef2)]:
  - @ledgerhq/live-env@2.10.0-next.0
  - @ledgerhq/coin-framework@5.3.0-next.0
  - @ledgerhq/evm-tools@1.6.4-next.0
  - @ledgerhq/cryptoassets@13.18.1-next.0
  - @ledgerhq/live-network@2.0.10-next.0
  - @ledgerhq/domain-service@1.2.32-next.0

## 2.22.2

### Patch Changes

- Updated dependencies [[`f42f353`](https://github.com/LedgerHQ/ledger-live/commit/f42f353a593d0a1cd0a237648765080c85d0eea7), [`ebbbd47`](https://github.com/LedgerHQ/ledger-live/commit/ebbbd47efe76d82047a956cb5849be5831f58772), [`f29e4ba`](https://github.com/LedgerHQ/ledger-live/commit/f29e4bae00a4bf470a0c1ca143e505b731543f95)]:
  - @ledgerhq/coin-framework@5.2.0
  - @ledgerhq/logs@6.13.0
  - @ledgerhq/domain-service@1.2.31
  - @ledgerhq/evm-tools@1.6.3
  - @ledgerhq/devices@8.4.6
  - @ledgerhq/live-network@2.0.9
  - @ledgerhq/live-promise@0.1.1

## 2.22.2-next.2

### Patch Changes

- Updated dependencies [[`ebbbd47`](https://github.com/LedgerHQ/ledger-live/commit/ebbbd47efe76d82047a956cb5849be5831f58772)]:
  - @ledgerhq/logs@6.13.0-next.1
  - @ledgerhq/coin-framework@5.2.0-next.2
  - @ledgerhq/domain-service@1.2.31-next.2
  - @ledgerhq/devices@8.4.6-next.1
  - @ledgerhq/live-network@2.0.9-next.1
  - @ledgerhq/live-promise@0.1.1-next.1

## 2.22.2-next.1

### Patch Changes

- Updated dependencies [[`f29e4ba`](https://github.com/LedgerHQ/ledger-live/commit/f29e4bae00a4bf470a0c1ca143e505b731543f95)]:
  - @ledgerhq/logs@6.13.0-next.0
  - @ledgerhq/coin-framework@5.2.0-next.1
  - @ledgerhq/domain-service@1.2.31-next.1
  - @ledgerhq/devices@8.4.6-next.0
  - @ledgerhq/live-network@2.0.9-next.0
  - @ledgerhq/live-promise@0.1.1-next.0

## 2.22.2-next.0

### Patch Changes

- Updated dependencies [[`f42f353`](https://github.com/LedgerHQ/ledger-live/commit/f42f353a593d0a1cd0a237648765080c85d0eea7)]:
  - @ledgerhq/coin-framework@5.2.0-next.0
  - @ledgerhq/domain-service@1.2.31-next.0
  - @ledgerhq/evm-tools@1.6.3

## 2.22.1

### Patch Changes

- Updated dependencies [[`107f35a`](https://github.com/LedgerHQ/ledger-live/commit/107f35a0650412716b088a3503b86435e6d9cf47), [`9081c26`](https://github.com/LedgerHQ/ledger-live/commit/9081c2648490f977469a33762a3c67bb2c2a0be5)]:
  - @ledgerhq/cryptoassets@13.18.0
  - @ledgerhq/errors@6.21.0
  - @ledgerhq/coin-framework@5.1.0
  - @ledgerhq/live-env@2.9.0
  - @ledgerhq/domain-service@1.2.30
  - @ledgerhq/devices@8.4.5
  - @ledgerhq/live-network@2.0.8
  - @ledgerhq/evm-tools@1.6.3

## 2.22.1-next.0

### Patch Changes

- Updated dependencies [[`107f35a`](https://github.com/LedgerHQ/ledger-live/commit/107f35a0650412716b088a3503b86435e6d9cf47), [`9081c26`](https://github.com/LedgerHQ/ledger-live/commit/9081c2648490f977469a33762a3c67bb2c2a0be5)]:
  - @ledgerhq/cryptoassets@13.18.0-next.0
  - @ledgerhq/errors@6.21.0-next.0
  - @ledgerhq/coin-framework@5.1.0-next.0
  - @ledgerhq/live-env@2.9.0-next.0
  - @ledgerhq/domain-service@1.2.30-next.0
  - @ledgerhq/devices@8.4.5-next.0
  - @ledgerhq/live-network@2.0.8-next.0
  - @ledgerhq/evm-tools@1.6.3-next.0

## 2.22.0

### Minor Changes

- [#10094](https://github.com/LedgerHQ/ledger-live/pull/10094) [`5657584`](https://github.com/LedgerHQ/ledger-live/commit/565758426688c9604c7958183ec5b3d4e35ffbe4) Thanks [@Antoine-bls83](https://github.com/Antoine-bls83)! - Remove NFT tx history for evm

### Patch Changes

- Updated dependencies [[`f92f49a`](https://github.com/LedgerHQ/ledger-live/commit/f92f49a003767b83b94955e920cfac8cd565c162)]:
  - @ledgerhq/cryptoassets@13.17.0
  - @ledgerhq/coin-framework@5.0.2

## 2.22.0-next.0

### Minor Changes

- [#10094](https://github.com/LedgerHQ/ledger-live/pull/10094) [`5657584`](https://github.com/LedgerHQ/ledger-live/commit/565758426688c9604c7958183ec5b3d4e35ffbe4) Thanks [@Antoine-bls83](https://github.com/Antoine-bls83)! - Remove NFT tx history for evm

### Patch Changes

- Updated dependencies [[`f92f49a`](https://github.com/LedgerHQ/ledger-live/commit/f92f49a003767b83b94955e920cfac8cd565c162)]:
  - @ledgerhq/cryptoassets@13.17.0-next.0
  - @ledgerhq/coin-framework@5.0.2-next.0

## 2.21.0

### Minor Changes

- [#10103](https://github.com/LedgerHQ/ledger-live/pull/10103) [`91fe526`](https://github.com/LedgerHQ/ledger-live/commit/91fe526be2710f0fb18b4d035a5d8de630b3d4b5) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Add tracking for transaction checks opt in result

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/coin-framework@5.0.1
  - @ledgerhq/domain-service@1.2.29
  - @ledgerhq/evm-tools@1.6.2

## 2.21.0-next.0

### Minor Changes

- [#10103](https://github.com/LedgerHQ/ledger-live/pull/10103) [`91fe526`](https://github.com/LedgerHQ/ledger-live/commit/91fe526be2710f0fb18b4d035a5d8de630b3d4b5) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Add tracking for transaction checks opt in result

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/coin-framework@5.0.1-next.0
  - @ledgerhq/domain-service@1.2.29-next.0
  - @ledgerhq/evm-tools@1.6.2

## 2.20.0

### Minor Changes

- [#10007](https://github.com/LedgerHQ/ledger-live/pull/10007) [`a11fd0b`](https://github.com/LedgerHQ/ledger-live/commit/a11fd0bbb687edc9e279bd4d63352658cae92c63) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(coin-evm): make batch size configurable for EVM Ledger explorer

### Patch Changes

- Updated dependencies [[`de92b67`](https://github.com/LedgerHQ/ledger-live/commit/de92b67ab9c8a553a817a245cecbfe292249d431), [`b599ac4`](https://github.com/LedgerHQ/ledger-live/commit/b599ac4697688459aad15371f9efea58f331dc33)]:
  - @ledgerhq/cryptoassets@13.16.0
  - @ledgerhq/coin-framework@5.0.0
  - @ledgerhq/domain-service@1.2.28
  - @ledgerhq/evm-tools@1.6.2

## 2.20.0-next.0

### Minor Changes

- [#10007](https://github.com/LedgerHQ/ledger-live/pull/10007) [`a11fd0b`](https://github.com/LedgerHQ/ledger-live/commit/a11fd0bbb687edc9e279bd4d63352658cae92c63) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(coin-evm): make batch size configurable for EVM Ledger explorer

### Patch Changes

- Updated dependencies [[`de92b67`](https://github.com/LedgerHQ/ledger-live/commit/de92b67ab9c8a553a817a245cecbfe292249d431), [`b599ac4`](https://github.com/LedgerHQ/ledger-live/commit/b599ac4697688459aad15371f9efea58f331dc33)]:
  - @ledgerhq/cryptoassets@13.16.0-next.0
  - @ledgerhq/coin-framework@5.0.0-next.0
  - @ledgerhq/domain-service@1.2.28-next.0
  - @ledgerhq/evm-tools@1.6.2

## 2.19.1

### Patch Changes

- Updated dependencies [[`cf2bf99`](https://github.com/LedgerHQ/ledger-live/commit/cf2bf99ba44e6eaf20e16cb320c0b22068340601)]:
  - @ledgerhq/coin-framework@4.0.0

## 2.19.1-next.0

### Patch Changes

- Updated dependencies [[`cf2bf99`](https://github.com/LedgerHQ/ledger-live/commit/cf2bf99ba44e6eaf20e16cb320c0b22068340601)]:
  - @ledgerhq/coin-framework@4.0.0-next.0

## 2.19.0

### Minor Changes

- [#9931](https://github.com/LedgerHQ/ledger-live/pull/9931) [`95dbd60`](https://github.com/LedgerHQ/ledger-live/commit/95dbd60c06b02fe6fd50bc2ec0883096858d1f23) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Add tracking during opt-in transaction checks

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/coin-framework@3.0.1
  - @ledgerhq/domain-service@1.2.27
  - @ledgerhq/evm-tools@1.6.2

## 2.19.0-next.0

### Minor Changes

- [#9931](https://github.com/LedgerHQ/ledger-live/pull/9931) [`95dbd60`](https://github.com/LedgerHQ/ledger-live/commit/95dbd60c06b02fe6fd50bc2ec0883096858d1f23) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Add tracking during opt-in transaction checks

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/coin-framework@3.0.1-next.0
  - @ledgerhq/domain-service@1.2.27-next.0
  - @ledgerhq/evm-tools@1.6.2

## 2.18.0

### Minor Changes

- [#9898](https://github.com/LedgerHQ/ledger-live/pull/9898) [`73722cc`](https://github.com/LedgerHQ/ledger-live/commit/73722ccbc93712103ff4ea33ab5c0c294400eef8) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - refactor(coin-evm): remove dependency to `@ledgerhq/coin-tester`

- [#9775](https://github.com/LedgerHQ/ledger-live/pull/9775) [`fe89dd5`](https://github.com/LedgerHQ/ledger-live/commit/fe89dd51cd35000c7b661d6364fe78f88bbf6c62) Thanks [@Canestin](https://github.com/Canestin)! - extract coin-tester-evm module

### Patch Changes

- Updated dependencies [[`8d36e9b`](https://github.com/LedgerHQ/ledger-live/commit/8d36e9b2474a4c600427f357adad04f99a89e13d), [`1e56618`](https://github.com/LedgerHQ/ledger-live/commit/1e56618a3c31e7980074072e0aae9422c145f4b3), [`bf3dec3`](https://github.com/LedgerHQ/ledger-live/commit/bf3dec3eb166f80e066f466e0e03291c9a141a81)]:
  - @ledgerhq/coin-framework@3.0.0
  - @ledgerhq/cryptoassets@13.15.0
  - @ledgerhq/domain-service@1.2.26
  - @ledgerhq/evm-tools@1.6.2

## 2.18.0-next.0

### Minor Changes

- [#9898](https://github.com/LedgerHQ/ledger-live/pull/9898) [`73722cc`](https://github.com/LedgerHQ/ledger-live/commit/73722ccbc93712103ff4ea33ab5c0c294400eef8) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - refactor(coin-evm): remove dependency to `@ledgerhq/coin-tester`

- [#9775](https://github.com/LedgerHQ/ledger-live/pull/9775) [`fe89dd5`](https://github.com/LedgerHQ/ledger-live/commit/fe89dd51cd35000c7b661d6364fe78f88bbf6c62) Thanks [@Canestin](https://github.com/Canestin)! - extract coin-tester-evm module

### Patch Changes

- Updated dependencies [[`8d36e9b`](https://github.com/LedgerHQ/ledger-live/commit/8d36e9b2474a4c600427f357adad04f99a89e13d), [`1e56618`](https://github.com/LedgerHQ/ledger-live/commit/1e56618a3c31e7980074072e0aae9422c145f4b3), [`bf3dec3`](https://github.com/LedgerHQ/ledger-live/commit/bf3dec3eb166f80e066f466e0e03291c9a141a81)]:
  - @ledgerhq/coin-framework@3.0.0-next.0
  - @ledgerhq/cryptoassets@13.15.0-next.0
  - @ledgerhq/domain-service@1.2.26-next.0
  - @ledgerhq/evm-tools@1.6.2

## 2.17.0

### Minor Changes

- [#9686](https://github.com/LedgerHQ/ledger-live/pull/9686) [`6116909`](https://github.com/LedgerHQ/ledger-live/commit/61169099ce63dfa73e52065327ca3c889c315cb8) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(coin-evm): update Ethereum url in coin tester

- [#9648](https://github.com/LedgerHQ/ledger-live/pull/9648) [`f1732a7`](https://github.com/LedgerHQ/ledger-live/commit/f1732a795e54f666b67e7686d59926037412caca) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Remove SubAccount as it is an alias to TokenAccount

- [#9690](https://github.com/LedgerHQ/ledger-live/pull/9690) [`d694069`](https://github.com/LedgerHQ/ledger-live/commit/d6940698a49b7a0ed48f84d6e8184d80760cca4f) Thanks [@Justkant](https://github.com/Justkant)! - feat: support Solana NFTs

### Patch Changes

- Updated dependencies [[`44ae74c`](https://github.com/LedgerHQ/ledger-live/commit/44ae74c272ba803bed7c9f4fc3351e3ce8a15531), [`71bb6a9`](https://github.com/LedgerHQ/ledger-live/commit/71bb6a9adb4ac83172be5def5b25d2836380df1d), [`8ce7b0a`](https://github.com/LedgerHQ/ledger-live/commit/8ce7b0ab2d1d73ef071102f795e7c868c676b1f4), [`46a9620`](https://github.com/LedgerHQ/ledger-live/commit/46a9620b4ea6343efc28792d3b57bf84ee2a23e8), [`1e7d454`](https://github.com/LedgerHQ/ledger-live/commit/1e7d454d99f1f39880f39a120c59020725d26475), [`f1732a7`](https://github.com/LedgerHQ/ledger-live/commit/f1732a795e54f666b67e7686d59926037412caca), [`32d46cc`](https://github.com/LedgerHQ/ledger-live/commit/32d46cc77debe059ae0bcd848a21065dec7ee091), [`d694069`](https://github.com/LedgerHQ/ledger-live/commit/d6940698a49b7a0ed48f84d6e8184d80760cca4f)]:
  - @ledgerhq/coin-framework@2.6.0
  - @ledgerhq/live-env@2.8.0
  - @ledgerhq/domain-service@1.2.25
  - @ledgerhq/evm-tools@1.6.2
  - @ledgerhq/cryptoassets@13.14.1
  - @ledgerhq/live-network@2.0.7

## 2.17.0-next.0

### Minor Changes

- [#9686](https://github.com/LedgerHQ/ledger-live/pull/9686) [`6116909`](https://github.com/LedgerHQ/ledger-live/commit/61169099ce63dfa73e52065327ca3c889c315cb8) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix(coin-evm): update Ethereum url in coin tester

- [#9648](https://github.com/LedgerHQ/ledger-live/pull/9648) [`f1732a7`](https://github.com/LedgerHQ/ledger-live/commit/f1732a795e54f666b67e7686d59926037412caca) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Remove SubAccount as it is an alias to TokenAccount

- [#9690](https://github.com/LedgerHQ/ledger-live/pull/9690) [`d694069`](https://github.com/LedgerHQ/ledger-live/commit/d6940698a49b7a0ed48f84d6e8184d80760cca4f) Thanks [@Justkant](https://github.com/Justkant)! - feat: support Solana NFTs

### Patch Changes

- Updated dependencies [[`44ae74c`](https://github.com/LedgerHQ/ledger-live/commit/44ae74c272ba803bed7c9f4fc3351e3ce8a15531), [`71bb6a9`](https://github.com/LedgerHQ/ledger-live/commit/71bb6a9adb4ac83172be5def5b25d2836380df1d), [`8ce7b0a`](https://github.com/LedgerHQ/ledger-live/commit/8ce7b0ab2d1d73ef071102f795e7c868c676b1f4), [`46a9620`](https://github.com/LedgerHQ/ledger-live/commit/46a9620b4ea6343efc28792d3b57bf84ee2a23e8), [`1e7d454`](https://github.com/LedgerHQ/ledger-live/commit/1e7d454d99f1f39880f39a120c59020725d26475), [`f1732a7`](https://github.com/LedgerHQ/ledger-live/commit/f1732a795e54f666b67e7686d59926037412caca), [`32d46cc`](https://github.com/LedgerHQ/ledger-live/commit/32d46cc77debe059ae0bcd848a21065dec7ee091), [`d694069`](https://github.com/LedgerHQ/ledger-live/commit/d6940698a49b7a0ed48f84d6e8184d80760cca4f)]:
  - @ledgerhq/coin-framework@2.6.0-next.0
  - @ledgerhq/live-env@2.8.0-next.0
  - @ledgerhq/domain-service@1.2.25-next.0
  - @ledgerhq/evm-tools@1.6.2-next.0
  - @ledgerhq/cryptoassets@13.14.1-next.0
  - @ledgerhq/live-network@2.0.7-next.0

## 2.16.0

### Patch Changes

- [#9664](https://github.com/LedgerHQ/ledger-live/pull/9664) [`3cf359d`](https://github.com/LedgerHQ/ledger-live/commit/3cf359d6f62d6993975f4ab7e643fabdeed0100e) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Use observable instead of promise for signing

## 2.15.0

### Minor Changes

- [#9298](https://github.com/LedgerHQ/ledger-live/pull/9298) [`2785d49`](https://github.com/LedgerHQ/ledger-live/commit/2785d49ac320498f98ed39b4eccc48310ad35fe1) Thanks [@Canestin](https://github.com/Canestin)! - config coin-integration env for sonarqube

### Patch Changes

- Updated dependencies [[`2785d49`](https://github.com/LedgerHQ/ledger-live/commit/2785d49ac320498f98ed39b4eccc48310ad35fe1), [`32f2a0c`](https://github.com/LedgerHQ/ledger-live/commit/32f2a0cf073e5c1a5d65cbe44e69660f8f510dd7), [`40e98c3`](https://github.com/LedgerHQ/ledger-live/commit/40e98c392bd9192570e46c2d62cf0779bdfe01ec), [`a656e47`](https://github.com/LedgerHQ/ledger-live/commit/a656e47c1dc3ac8b578debf9cf80eab370c7086f)]:
  - @ledgerhq/coin-framework@2.5.0
  - @ledgerhq/live-env@2.7.0
  - @ledgerhq/cryptoassets@13.14.0
  - @ledgerhq/domain-service@1.2.24
  - @ledgerhq/evm-tools@1.6.1
  - @ledgerhq/live-network@2.0.6

## 2.15.0-next.0

### Minor Changes

- [#9298](https://github.com/LedgerHQ/ledger-live/pull/9298) [`2785d49`](https://github.com/LedgerHQ/ledger-live/commit/2785d49ac320498f98ed39b4eccc48310ad35fe1) Thanks [@Canestin](https://github.com/Canestin)! - config coin-integration env for sonarqube

### Patch Changes

- Updated dependencies [[`2785d49`](https://github.com/LedgerHQ/ledger-live/commit/2785d49ac320498f98ed39b4eccc48310ad35fe1), [`32f2a0c`](https://github.com/LedgerHQ/ledger-live/commit/32f2a0cf073e5c1a5d65cbe44e69660f8f510dd7), [`40e98c3`](https://github.com/LedgerHQ/ledger-live/commit/40e98c392bd9192570e46c2d62cf0779bdfe01ec), [`a656e47`](https://github.com/LedgerHQ/ledger-live/commit/a656e47c1dc3ac8b578debf9cf80eab370c7086f)]:
  - @ledgerhq/coin-framework@2.5.0-next.0
  - @ledgerhq/live-env@2.7.0-next.0
  - @ledgerhq/cryptoassets@13.14.0-next.0
  - @ledgerhq/domain-service@1.2.24-next.0
  - @ledgerhq/evm-tools@1.6.1-next.0
  - @ledgerhq/live-network@2.0.6-next.0

## 2.14.1

### Patch Changes

- Updated dependencies [[`5f27549`](https://github.com/LedgerHQ/ledger-live/commit/5f275498e80060f98238a54e8ae3e2c94bfd7c91), [`e2630cb`](https://github.com/LedgerHQ/ledger-live/commit/e2630cbec8d94ae037b2bf85cfa200a277ae739f), [`b8fca38`](https://github.com/LedgerHQ/ledger-live/commit/b8fca386fa07cf393109a1928e92dfc790f9c286)]:
  - @ledgerhq/coin-framework@2.4.0
  - @ledgerhq/domain-service@1.2.23
  - @ledgerhq/evm-tools@1.6.0

## 2.14.1-next.0

### Patch Changes

- Updated dependencies [[`5f27549`](https://github.com/LedgerHQ/ledger-live/commit/5f275498e80060f98238a54e8ae3e2c94bfd7c91), [`e2630cb`](https://github.com/LedgerHQ/ledger-live/commit/e2630cbec8d94ae037b2bf85cfa200a277ae739f), [`b8fca38`](https://github.com/LedgerHQ/ledger-live/commit/b8fca386fa07cf393109a1928e92dfc790f9c286)]:
  - @ledgerhq/coin-framework@2.4.0-next.0
  - @ledgerhq/domain-service@1.2.23-next.0
  - @ledgerhq/evm-tools@1.6.0

## 2.14.0

### Minor Changes

- [#9446](https://github.com/LedgerHQ/ledger-live/pull/9446) [`dcea0f8`](https://github.com/LedgerHQ/ledger-live/commit/dcea0f880728c808fffe5b09410eec614083f04b) Thanks [@Justkant](https://github.com/Justkant)! - fix: potential wrong type for the hydrate value

- [#9472](https://github.com/LedgerHQ/ledger-live/pull/9472) [`9c4c82e`](https://github.com/LedgerHQ/ledger-live/commit/9c4c82e8e81aaadfc1132f0a25812be094e54453) Thanks [@KVNLS](https://github.com/KVNLS)! - Fix elliptic library version used

### Patch Changes

- Updated dependencies [[`9c4c82e`](https://github.com/LedgerHQ/ledger-live/commit/9c4c82e8e81aaadfc1132f0a25812be094e54453), [`cc00249`](https://github.com/LedgerHQ/ledger-live/commit/cc002495f3e107aba283a3aa4abca90954de6d76)]:
  - @ledgerhq/evm-tools@1.6.0
  - @ledgerhq/coin-framework@2.3.0
  - @ledgerhq/domain-service@1.2.22

## 2.14.0-next.0

### Minor Changes

- [#9446](https://github.com/LedgerHQ/ledger-live/pull/9446) [`dcea0f8`](https://github.com/LedgerHQ/ledger-live/commit/dcea0f880728c808fffe5b09410eec614083f04b) Thanks [@Justkant](https://github.com/Justkant)! - fix: potential wrong type for the hydrate value

- [#9472](https://github.com/LedgerHQ/ledger-live/pull/9472) [`9c4c82e`](https://github.com/LedgerHQ/ledger-live/commit/9c4c82e8e81aaadfc1132f0a25812be094e54453) Thanks [@KVNLS](https://github.com/KVNLS)! - Fix elliptic library version used

### Patch Changes

- Updated dependencies [[`9c4c82e`](https://github.com/LedgerHQ/ledger-live/commit/9c4c82e8e81aaadfc1132f0a25812be094e54453), [`cc00249`](https://github.com/LedgerHQ/ledger-live/commit/cc002495f3e107aba283a3aa4abca90954de6d76)]:
  - @ledgerhq/evm-tools@1.6.0-next.0
  - @ledgerhq/coin-framework@2.3.0-next.0
  - @ledgerhq/domain-service@1.2.22-next.0

## 2.13.0

### Minor Changes

- [#9292](https://github.com/LedgerHQ/ledger-live/pull/9292) [`0a59343`](https://github.com/LedgerHQ/ledger-live/commit/0a59343b591dab4e886c21cb47f7339231997331) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - feature (lld,llm): integrate Sonic

- [#9403](https://github.com/LedgerHQ/ledger-live/pull/9403) [`358a988`](https://github.com/LedgerHQ/ledger-live/commit/358a9880d9b1c4800340686410a421d0dfc8efb1) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Update NMS version to v2

- [#9257](https://github.com/LedgerHQ/ledger-live/pull/9257) [`e5066a0`](https://github.com/LedgerHQ/ledger-live/commit/e5066a04fa0252d049d976d452888b790e6e5b2a) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - doc (coin-evm): fix misleading doc on SVG naming convention

- [#9402](https://github.com/LedgerHQ/ledger-live/pull/9402) [`bdfa413`](https://github.com/LedgerHQ/ledger-live/commit/bdfa4139fcbceabfd05a57e69b05e9ccf10efbe1) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Update Staging NFT Metadata service url + Rename env variable

### Patch Changes

- Updated dependencies [[`7931e5f`](https://github.com/LedgerHQ/ledger-live/commit/7931e5f6bf379eee7b80f5a95f13b6e96140ac5a), [`8675df1`](https://github.com/LedgerHQ/ledger-live/commit/8675df12c24067877358f27e1e7c66f739ff0c78), [`0a59343`](https://github.com/LedgerHQ/ledger-live/commit/0a59343b591dab4e886c21cb47f7339231997331), [`1461449`](https://github.com/LedgerHQ/ledger-live/commit/146144941c13e60182da8d79592f706d12a6f00e), [`bdfa413`](https://github.com/LedgerHQ/ledger-live/commit/bdfa4139fcbceabfd05a57e69b05e9ccf10efbe1)]:
  - @ledgerhq/evm-tools@1.5.0
  - @ledgerhq/coin-framework@2.2.0
  - @ledgerhq/cryptoassets@13.13.0
  - @ledgerhq/live-env@2.6.0
  - @ledgerhq/domain-service@1.2.21
  - @ledgerhq/live-network@2.0.5

## 2.13.0-next.0

### Minor Changes

- [#9292](https://github.com/LedgerHQ/ledger-live/pull/9292) [`0a59343`](https://github.com/LedgerHQ/ledger-live/commit/0a59343b591dab4e886c21cb47f7339231997331) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - feature (lld,llm): integrate Sonic

- [#9403](https://github.com/LedgerHQ/ledger-live/pull/9403) [`358a988`](https://github.com/LedgerHQ/ledger-live/commit/358a9880d9b1c4800340686410a421d0dfc8efb1) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Update NMS version to v2

- [#9257](https://github.com/LedgerHQ/ledger-live/pull/9257) [`e5066a0`](https://github.com/LedgerHQ/ledger-live/commit/e5066a04fa0252d049d976d452888b790e6e5b2a) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - doc (coin-evm): fix misleading doc on SVG naming convention

- [#9402](https://github.com/LedgerHQ/ledger-live/pull/9402) [`bdfa413`](https://github.com/LedgerHQ/ledger-live/commit/bdfa4139fcbceabfd05a57e69b05e9ccf10efbe1) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Update Staging NFT Metadata service url + Rename env variable

### Patch Changes

- Updated dependencies [[`7931e5f`](https://github.com/LedgerHQ/ledger-live/commit/7931e5f6bf379eee7b80f5a95f13b6e96140ac5a), [`8675df1`](https://github.com/LedgerHQ/ledger-live/commit/8675df12c24067877358f27e1e7c66f739ff0c78), [`0a59343`](https://github.com/LedgerHQ/ledger-live/commit/0a59343b591dab4e886c21cb47f7339231997331), [`1461449`](https://github.com/LedgerHQ/ledger-live/commit/146144941c13e60182da8d79592f706d12a6f00e), [`bdfa413`](https://github.com/LedgerHQ/ledger-live/commit/bdfa4139fcbceabfd05a57e69b05e9ccf10efbe1)]:
  - @ledgerhq/evm-tools@1.5.0-next.0
  - @ledgerhq/coin-framework@2.2.0-next.0
  - @ledgerhq/cryptoassets@13.13.0-next.0
  - @ledgerhq/live-env@2.6.0-next.0
  - @ledgerhq/domain-service@1.2.21-next.0
  - @ledgerhq/live-network@2.0.5-next.0

## 2.12.0

### Minor Changes

- [#8931](https://github.com/LedgerHQ/ledger-live/pull/8931) [`ee205a0`](https://github.com/LedgerHQ/ledger-live/commit/ee205a01e1a26045e468735907039ad9be1c7f34) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Add dmk signer when using dmk transport

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/coin-framework@2.1.1
  - @ledgerhq/domain-service@1.2.20
  - @ledgerhq/evm-tools@1.4.0

## 2.12.0-next.0

### Minor Changes

- [#8931](https://github.com/LedgerHQ/ledger-live/pull/8931) [`ee205a0`](https://github.com/LedgerHQ/ledger-live/commit/ee205a01e1a26045e468735907039ad9be1c7f34) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Add dmk signer when using dmk transport

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/coin-framework@2.1.1-next.0
  - @ledgerhq/domain-service@1.2.20-next.0
  - @ledgerhq/evm-tools@1.4.0

## 2.11.0

### Minor Changes

- [#9119](https://github.com/LedgerHQ/ledger-live/pull/9119) [`da67b55`](https://github.com/LedgerHQ/ledger-live/commit/da67b5511b22553f7e3e089eca2e363a5e3cbffe) Thanks [@qperrot](https://github.com/qperrot)! - Fix ethereum testnet units

- [#9248](https://github.com/LedgerHQ/ledger-live/pull/9248) [`94a59f2`](https://github.com/LedgerHQ/ledger-live/commit/94a59f2030b8b25962e183919017a1e25454fdfb) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix (coin-tester): stop EVM coin tester smoothly

### Patch Changes

- Updated dependencies [[`da67b55`](https://github.com/LedgerHQ/ledger-live/commit/da67b5511b22553f7e3e089eca2e363a5e3cbffe)]:
  - @ledgerhq/cryptoassets@13.12.0
  - @ledgerhq/coin-framework@2.1.0
  - @ledgerhq/domain-service@1.2.19
  - @ledgerhq/evm-tools@1.4.0

## 2.11.0-next.0

### Minor Changes

- [#9119](https://github.com/LedgerHQ/ledger-live/pull/9119) [`da67b55`](https://github.com/LedgerHQ/ledger-live/commit/da67b5511b22553f7e3e089eca2e363a5e3cbffe) Thanks [@qperrot](https://github.com/qperrot)! - Fix ethereum testnet units

- [#9248](https://github.com/LedgerHQ/ledger-live/pull/9248) [`94a59f2`](https://github.com/LedgerHQ/ledger-live/commit/94a59f2030b8b25962e183919017a1e25454fdfb) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix (coin-tester): stop EVM coin tester smoothly

### Patch Changes

- Updated dependencies [[`da67b55`](https://github.com/LedgerHQ/ledger-live/commit/da67b5511b22553f7e3e089eca2e363a5e3cbffe)]:
  - @ledgerhq/cryptoassets@13.12.0-next.0
  - @ledgerhq/coin-framework@2.1.0-next.0
  - @ledgerhq/domain-service@1.2.19-next.0
  - @ledgerhq/evm-tools@1.4.0

## 2.10.0

### Minor Changes

- [#9161](https://github.com/LedgerHQ/ledger-live/pull/9161) [`25d078c`](https://github.com/LedgerHQ/ledger-live/commit/25d078c79f21950ac6bea16d3491ec3206ed44c2) Thanks [@Justkant](https://github.com/Justkant)! - fix: legacy transaction support in rpc call of getFeeData

- [#9082](https://github.com/LedgerHQ/ledger-live/pull/9082) [`07ec8a0`](https://github.com/LedgerHQ/ledger-live/commit/07ec8a0204368f47d05ec7481375dfdc04e0b15a) Thanks [@qperrot](https://github.com/qperrot)! - Fix specs test for blast and blast_sepolia

### Patch Changes

- Updated dependencies [[`58c1a9c`](https://github.com/LedgerHQ/ledger-live/commit/58c1a9c68b2ce2ebef9dbd7af00ae09efd7a29dc), [`551f2cc`](https://github.com/LedgerHQ/ledger-live/commit/551f2ccad6d7897a010d39110c0ba9336d407dfd), [`ff40e9a`](https://github.com/LedgerHQ/ledger-live/commit/ff40e9a00d325e5b46cb069936ba2a5781c601b5)]:
  - @ledgerhq/coin-framework@2.0.0
  - @ledgerhq/evm-tools@1.4.0
  - @ledgerhq/cryptoassets@13.11.0

## 2.10.0-next.0

### Minor Changes

- [#9161](https://github.com/LedgerHQ/ledger-live/pull/9161) [`25d078c`](https://github.com/LedgerHQ/ledger-live/commit/25d078c79f21950ac6bea16d3491ec3206ed44c2) Thanks [@Justkant](https://github.com/Justkant)! - fix: legacy transaction support in rpc call of getFeeData

- [#9082](https://github.com/LedgerHQ/ledger-live/pull/9082) [`07ec8a0`](https://github.com/LedgerHQ/ledger-live/commit/07ec8a0204368f47d05ec7481375dfdc04e0b15a) Thanks [@qperrot](https://github.com/qperrot)! - Fix specs test for blast and blast_sepolia

### Patch Changes

- Updated dependencies [[`58c1a9c`](https://github.com/LedgerHQ/ledger-live/commit/58c1a9c68b2ce2ebef9dbd7af00ae09efd7a29dc), [`551f2cc`](https://github.com/LedgerHQ/ledger-live/commit/551f2ccad6d7897a010d39110c0ba9336d407dfd), [`ff40e9a`](https://github.com/LedgerHQ/ledger-live/commit/ff40e9a00d325e5b46cb069936ba2a5781c601b5)]:
  - @ledgerhq/coin-framework@2.0.0-next.0
  - @ledgerhq/evm-tools@1.4.0-next.0
  - @ledgerhq/cryptoassets@13.11.0-next.0

## 2.9.3

### Patch Changes

- Updated dependencies [[`5e18866`](https://github.com/LedgerHQ/ledger-live/commit/5e18866320b843632699659ee66f6c410c108c1e)]:
  - @ledgerhq/coin-framework@1.0.0

## 2.9.3-next.0

### Patch Changes

- Updated dependencies [[`5e18866`](https://github.com/LedgerHQ/ledger-live/commit/5e18866320b843632699659ee66f6c410c108c1e)]:
  - @ledgerhq/coin-framework@1.0.0-next.0

## 2.9.2

### Patch Changes

- Updated dependencies [[`41b153a`](https://github.com/LedgerHQ/ledger-live/commit/41b153adb98ce8de3336563694204d83905dba0e), [`9534f17`](https://github.com/LedgerHQ/ledger-live/commit/9534f17247e1472b0fee8b993a83264f4e4ab363)]:
  - @ledgerhq/cryptoassets@13.10.0
  - @ledgerhq/coin-framework@0.25.0
  - @ledgerhq/domain-service@1.2.18
  - @ledgerhq/evm-tools@1.3.1

## 2.9.2-next.0

### Patch Changes

- Updated dependencies [[`41b153a`](https://github.com/LedgerHQ/ledger-live/commit/41b153adb98ce8de3336563694204d83905dba0e), [`9534f17`](https://github.com/LedgerHQ/ledger-live/commit/9534f17247e1472b0fee8b993a83264f4e4ab363)]:
  - @ledgerhq/cryptoassets@13.10.0-next.0
  - @ledgerhq/coin-framework@0.25.0-next.0
  - @ledgerhq/domain-service@1.2.18-next.0
  - @ledgerhq/evm-tools@1.3.1

## 2.9.1

### Patch Changes

- Updated dependencies [[`670776e`](https://github.com/LedgerHQ/ledger-live/commit/670776e3a34859a18d6de1470de4195cf2094a81)]:
  - @ledgerhq/coin-framework@0.24.0

## 2.9.1-hotfix.0

### Patch Changes

- Updated dependencies [[`670776e`](https://github.com/LedgerHQ/ledger-live/commit/670776e3a34859a18d6de1470de4195cf2094a81)]:
  - @ledgerhq/coin-framework@0.23.1-hotfix.0

## 2.9.0

### Minor Changes

- [#8909](https://github.com/LedgerHQ/ledger-live/pull/8909) [`7224a7d`](https://github.com/LedgerHQ/ledger-live/commit/7224a7d3e5643fee75575fab74c72a2aca260be6) Thanks [@qperrot](https://github.com/qperrot)! - Fix bot device actions for polygon

- [#8899](https://github.com/LedgerHQ/ledger-live/pull/8899) [`c62cec9`](https://github.com/LedgerHQ/ledger-live/commit/c62cec9a911f41d2383effeb2ea1f92756ce0a09) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Prevent request on blockscout for ERC1155 NFTs as unsupported yet and add a `none` option for explorer's config to allow for node-only synchronization (will make token accounts disappear though)

- [#8914](https://github.com/LedgerHQ/ledger-live/pull/8914) [`537141a`](https://github.com/LedgerHQ/ledger-live/commit/537141ab549b8dab57d3eb117e875faa67b54f4b) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Bot feature : Add filter for features

### Patch Changes

- Updated dependencies [[`3a65633`](https://github.com/LedgerHQ/ledger-live/commit/3a6563309c8cacbd6e9a73e3044b1ff7c3966f87), [`537141a`](https://github.com/LedgerHQ/ledger-live/commit/537141ab549b8dab57d3eb117e875faa67b54f4b)]:
  - @ledgerhq/coin-framework@0.23.0
  - @ledgerhq/domain-service@1.2.17
  - @ledgerhq/evm-tools@1.3.1

## 2.9.0-next.0

### Minor Changes

- [#8909](https://github.com/LedgerHQ/ledger-live/pull/8909) [`7224a7d`](https://github.com/LedgerHQ/ledger-live/commit/7224a7d3e5643fee75575fab74c72a2aca260be6) Thanks [@qperrot](https://github.com/qperrot)! - Fix bot device actions for polygon

- [#8899](https://github.com/LedgerHQ/ledger-live/pull/8899) [`c62cec9`](https://github.com/LedgerHQ/ledger-live/commit/c62cec9a911f41d2383effeb2ea1f92756ce0a09) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Prevent request on blockscout for ERC1155 NFTs as unsupported yet and add a `none` option for explorer's config to allow for node-only synchronization (will make token accounts disappear though)

- [#8914](https://github.com/LedgerHQ/ledger-live/pull/8914) [`537141a`](https://github.com/LedgerHQ/ledger-live/commit/537141ab549b8dab57d3eb117e875faa67b54f4b) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Bot feature : Add filter for features

### Patch Changes

- Updated dependencies [[`3a65633`](https://github.com/LedgerHQ/ledger-live/commit/3a6563309c8cacbd6e9a73e3044b1ff7c3966f87), [`537141a`](https://github.com/LedgerHQ/ledger-live/commit/537141ab549b8dab57d3eb117e875faa67b54f4b)]:
  - @ledgerhq/coin-framework@0.23.0-next.0
  - @ledgerhq/domain-service@1.2.17-next.0
  - @ledgerhq/evm-tools@1.3.1

## 2.8.1

### Patch Changes

- Updated dependencies [[`5e01938`](https://github.com/LedgerHQ/ledger-live/commit/5e01938ece3dc1ccf7bea6c2805b6558c846db80), [`d98a964`](https://github.com/LedgerHQ/ledger-live/commit/d98a96476c3d44eab1575f6c7c58ec03b5daf890), [`c2d24cd`](https://github.com/LedgerHQ/ledger-live/commit/c2d24cd0299ea04e39306279b6f833696bc4f4fb)]:
  - @ledgerhq/coin-framework@0.22.0
  - @ledgerhq/cryptoassets@13.9.0
  - @ledgerhq/live-env@2.5.0
  - @ledgerhq/domain-service@1.2.16
  - @ledgerhq/evm-tools@1.3.1
  - @ledgerhq/live-network@2.0.4

## 2.8.1-next.0

### Patch Changes

- Updated dependencies [[`5e01938`](https://github.com/LedgerHQ/ledger-live/commit/5e01938ece3dc1ccf7bea6c2805b6558c846db80), [`d98a964`](https://github.com/LedgerHQ/ledger-live/commit/d98a96476c3d44eab1575f6c7c58ec03b5daf890), [`c2d24cd`](https://github.com/LedgerHQ/ledger-live/commit/c2d24cd0299ea04e39306279b6f833696bc4f4fb)]:
  - @ledgerhq/coin-framework@0.22.0-next.0
  - @ledgerhq/cryptoassets@13.9.0-next.0
  - @ledgerhq/live-env@2.5.0-next.0
  - @ledgerhq/domain-service@1.2.16-next.0
  - @ledgerhq/evm-tools@1.3.1-next.0
  - @ledgerhq/live-network@2.0.4-next.0

## 2.8.0

### Minor Changes

- [#8499](https://github.com/LedgerHQ/ledger-live/pull/8499) [`9820a8f`](https://github.com/LedgerHQ/ledger-live/commit/9820a8f8ec66cf114b23c3c3b92474d250b8bf01) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Exchange function is now in coin-modules

### Patch Changes

- Updated dependencies [[`9820a8f`](https://github.com/LedgerHQ/ledger-live/commit/9820a8f8ec66cf114b23c3c3b92474d250b8bf01), [`50b00c7`](https://github.com/LedgerHQ/ledger-live/commit/50b00c73e39af99c7d749bf57d5ef2f2e4942f2d), [`6cd5ecd`](https://github.com/LedgerHQ/ledger-live/commit/6cd5ecdedaed090d47a4df18db3c36f990de60e5), [`1fa754d`](https://github.com/LedgerHQ/ledger-live/commit/1fa754deed730bb3dd8d05cb4e83e8c8d1b33ad1), [`2ae713b`](https://github.com/LedgerHQ/ledger-live/commit/2ae713b20c1da18ef33beb730f41fb3ea2990e44), [`1f62290`](https://github.com/LedgerHQ/ledger-live/commit/1f622907dd108fced66a36be1d8d8738d41303c9), [`9d8e34e`](https://github.com/LedgerHQ/ledger-live/commit/9d8e34eee5d77c6620298def250e85eda6b606b7)]:
  - @ledgerhq/coin-framework@0.21.0
  - @ledgerhq/cryptoassets@13.8.0
  - @ledgerhq/domain-service@1.2.15
  - @ledgerhq/evm-tools@1.3.0

## 2.8.0-next.1

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/coin-framework@0.21.0-next.1
  - @ledgerhq/domain-service@1.2.15-next.1
  - @ledgerhq/evm-tools@1.3.0

## 2.8.0-next.0

### Minor Changes

- [#8499](https://github.com/LedgerHQ/ledger-live/pull/8499) [`9820a8f`](https://github.com/LedgerHQ/ledger-live/commit/9820a8f8ec66cf114b23c3c3b92474d250b8bf01) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Exchange function is now in coin-modules

### Patch Changes

- Updated dependencies [[`9820a8f`](https://github.com/LedgerHQ/ledger-live/commit/9820a8f8ec66cf114b23c3c3b92474d250b8bf01), [`50b00c7`](https://github.com/LedgerHQ/ledger-live/commit/50b00c73e39af99c7d749bf57d5ef2f2e4942f2d), [`6cd5ecd`](https://github.com/LedgerHQ/ledger-live/commit/6cd5ecdedaed090d47a4df18db3c36f990de60e5), [`1fa754d`](https://github.com/LedgerHQ/ledger-live/commit/1fa754deed730bb3dd8d05cb4e83e8c8d1b33ad1), [`2ae713b`](https://github.com/LedgerHQ/ledger-live/commit/2ae713b20c1da18ef33beb730f41fb3ea2990e44), [`1f62290`](https://github.com/LedgerHQ/ledger-live/commit/1f622907dd108fced66a36be1d8d8738d41303c9), [`9d8e34e`](https://github.com/LedgerHQ/ledger-live/commit/9d8e34eee5d77c6620298def250e85eda6b606b7)]:
  - @ledgerhq/coin-framework@0.21.0-next.0
  - @ledgerhq/cryptoassets@13.8.0-next.0
  - @ledgerhq/domain-service@1.2.15-next.0
  - @ledgerhq/evm-tools@1.3.0

## 2.7.0

### Minor Changes

- [#8375](https://github.com/LedgerHQ/ledger-live/pull/8375) [`c45ee45`](https://github.com/LedgerHQ/ledger-live/commit/c45ee457a9f5500ae42f2a8fb7f0cfb7926f319b) Thanks [@Canestin](https://github.com/Canestin)! - add mev protection

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/coin-framework@0.20.1
  - @ledgerhq/domain-service@1.2.14
  - @ledgerhq/evm-tools@1.3.0

## 2.7.0-next.1

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/coin-framework@0.20.1-next.1
  - @ledgerhq/domain-service@1.2.14-next.1
  - @ledgerhq/evm-tools@1.3.0

## 2.7.0-next.0

### Minor Changes

- [#8375](https://github.com/LedgerHQ/ledger-live/pull/8375) [`c45ee45`](https://github.com/LedgerHQ/ledger-live/commit/c45ee457a9f5500ae42f2a8fb7f0cfb7926f319b) Thanks [@Canestin](https://github.com/Canestin)! - add mev protection

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/coin-framework@0.20.1-next.0
  - @ledgerhq/domain-service@1.2.14-next.0
  - @ledgerhq/evm-tools@1.3.0

## 2.6.0

### Minor Changes

- [#8412](https://github.com/LedgerHQ/ledger-live/pull/8412) [`0397e32`](https://github.com/LedgerHQ/ledger-live/commit/0397e32253ea2af6fc901d69b51f6a59896f3e6a) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Coin-tester clean up. Fixing italian typo (sorry pasta bros), fixing Polkadot coin-tester log noise & docker-compose.

### Patch Changes

- Updated dependencies [[`0b51d37`](https://github.com/LedgerHQ/ledger-live/commit/0b51d37762c73a88d7204d1fcc3bb60a110568ed), [`daa059a`](https://github.com/LedgerHQ/ledger-live/commit/daa059a90eb4381a0936c4a3703e8061db24072a)]:
  - @ledgerhq/coin-framework@0.20.0
  - @ledgerhq/domain-service@1.2.13
  - @ledgerhq/evm-tools@1.3.0

## 2.6.0-next.0

### Minor Changes

- [#8412](https://github.com/LedgerHQ/ledger-live/pull/8412) [`0397e32`](https://github.com/LedgerHQ/ledger-live/commit/0397e32253ea2af6fc901d69b51f6a59896f3e6a) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Coin-tester clean up. Fixing italian typo (sorry pasta bros), fixing Polkadot coin-tester log noise & docker-compose.

### Patch Changes

- Updated dependencies [[`0b51d37`](https://github.com/LedgerHQ/ledger-live/commit/0b51d37762c73a88d7204d1fcc3bb60a110568ed), [`daa059a`](https://github.com/LedgerHQ/ledger-live/commit/daa059a90eb4381a0936c4a3703e8061db24072a)]:
  - @ledgerhq/coin-framework@0.20.0-next.0
  - @ledgerhq/domain-service@1.2.13-next.0
  - @ledgerhq/evm-tools@1.3.0

## 2.5.1

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/coin-framework@0.19.1
  - @ledgerhq/domain-service@1.2.12
  - @ledgerhq/evm-tools@1.3.0

## 2.5.1-next.0

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/coin-framework@0.19.1-next.0
  - @ledgerhq/domain-service@1.2.12-next.0
  - @ledgerhq/evm-tools@1.3.0

## 2.5.0

### Minor Changes

- [#8305](https://github.com/LedgerHQ/ledger-live/pull/8305) [`408dd7d`](https://github.com/LedgerHQ/ledger-live/commit/408dd7d7a25f6c9b99e8e4a35180f08ad0ac4b26) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Change preload cache duration from 1 hour to 1 day in order to delay new synchronizations from block 0

### Patch Changes

- [#8206](https://github.com/LedgerHQ/ledger-live/pull/8206) [`9059f4b`](https://github.com/LedgerHQ/ledger-live/commit/9059f4bb1dd540f28e2e16d85d701d70a99b6c96) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add new coin-tester helper `callMyDealer` capable of providing any token or NFT without the need to know a previous owner. Also adds 2 new scenarii for Blast & Scroll.

- [#8206](https://github.com/LedgerHQ/ledger-live/pull/8206) [`9059f4b`](https://github.com/LedgerHQ/ledger-live/commit/9059f4bb1dd540f28e2e16d85d701d70a99b6c96) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Make coin-tester script run tests sequentially

- [#8175](https://github.com/LedgerHQ/ledger-live/pull/8175) [`b93a421`](https://github.com/LedgerHQ/ledger-live/commit/b93a421866519b80fdd8a029caea97323eceae93) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Remove helper `applyEIP155` now that `hw-app-eth` is fixed and returns a valid `v` in all possible cases. Adding a env var `EVM_FORCE_LEGACY_TRANSACTIONS` to force transaction type 0, making this change QA compatible.

- Updated dependencies [[`5c13c7b`](https://github.com/LedgerHQ/ledger-live/commit/5c13c7bf743333f09cbfee720d275dfae7e157d2), [`2013b0f`](https://github.com/LedgerHQ/ledger-live/commit/2013b0f23d7f5bccff58dfd93fd45333194b8ae0), [`2013b0f`](https://github.com/LedgerHQ/ledger-live/commit/2013b0f23d7f5bccff58dfd93fd45333194b8ae0), [`95fbec9`](https://github.com/LedgerHQ/ledger-live/commit/95fbec9fdff75cd6d4ac23e189e876efffc81906), [`63e5392`](https://github.com/LedgerHQ/ledger-live/commit/63e5392a108f1bec7cfc9c413db1550e7b5c9a25), [`b93a421`](https://github.com/LedgerHQ/ledger-live/commit/b93a421866519b80fdd8a029caea97323eceae93), [`b93a421`](https://github.com/LedgerHQ/ledger-live/commit/b93a421866519b80fdd8a029caea97323eceae93), [`a40c525`](https://github.com/LedgerHQ/ledger-live/commit/a40c5256b80574aaaf17651d195832668b9796f5)]:
  - @ledgerhq/live-env@2.4.1
  - @ledgerhq/coin-framework@0.19.0
  - @ledgerhq/cryptoassets@13.7.0
  - @ledgerhq/evm-tools@1.3.0
  - @ledgerhq/live-network@2.0.3
  - @ledgerhq/domain-service@1.2.11

## 2.5.0-next.0

### Minor Changes

- [#8305](https://github.com/LedgerHQ/ledger-live/pull/8305) [`408dd7d`](https://github.com/LedgerHQ/ledger-live/commit/408dd7d7a25f6c9b99e8e4a35180f08ad0ac4b26) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Change preload cache duration from 1 hour to 1 day in order to delay new synchronizations from block 0

### Patch Changes

- [#8206](https://github.com/LedgerHQ/ledger-live/pull/8206) [`9059f4b`](https://github.com/LedgerHQ/ledger-live/commit/9059f4bb1dd540f28e2e16d85d701d70a99b6c96) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add new coin-tester helper `callMyDealer` capable of providing any token or NFT without the need to know a previous owner. Also adds 2 new scenarii for Blast & Scroll.

- [#8206](https://github.com/LedgerHQ/ledger-live/pull/8206) [`9059f4b`](https://github.com/LedgerHQ/ledger-live/commit/9059f4bb1dd540f28e2e16d85d701d70a99b6c96) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Make coin-tester script run tests sequentially

- [#8175](https://github.com/LedgerHQ/ledger-live/pull/8175) [`b93a421`](https://github.com/LedgerHQ/ledger-live/commit/b93a421866519b80fdd8a029caea97323eceae93) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Remove helper `applyEIP155` now that `hw-app-eth` is fixed and returns a valid `v` in all possible cases. Adding a env var `EVM_FORCE_LEGACY_TRANSACTIONS` to force transaction type 0, making this change QA compatible.

- Updated dependencies [[`5c13c7b`](https://github.com/LedgerHQ/ledger-live/commit/5c13c7bf743333f09cbfee720d275dfae7e157d2), [`2013b0f`](https://github.com/LedgerHQ/ledger-live/commit/2013b0f23d7f5bccff58dfd93fd45333194b8ae0), [`2013b0f`](https://github.com/LedgerHQ/ledger-live/commit/2013b0f23d7f5bccff58dfd93fd45333194b8ae0), [`95fbec9`](https://github.com/LedgerHQ/ledger-live/commit/95fbec9fdff75cd6d4ac23e189e876efffc81906), [`63e5392`](https://github.com/LedgerHQ/ledger-live/commit/63e5392a108f1bec7cfc9c413db1550e7b5c9a25), [`b93a421`](https://github.com/LedgerHQ/ledger-live/commit/b93a421866519b80fdd8a029caea97323eceae93), [`b93a421`](https://github.com/LedgerHQ/ledger-live/commit/b93a421866519b80fdd8a029caea97323eceae93), [`a40c525`](https://github.com/LedgerHQ/ledger-live/commit/a40c5256b80574aaaf17651d195832668b9796f5)]:
  - @ledgerhq/live-env@2.4.1-next.0
  - @ledgerhq/coin-framework@0.19.0-next.0
  - @ledgerhq/cryptoassets@13.7.0-next.0
  - @ledgerhq/evm-tools@1.3.0-next.0
  - @ledgerhq/live-network@2.0.3-next.0
  - @ledgerhq/domain-service@1.2.11-next.0

## 2.4.3

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/coin-framework@0.18.6
  - @ledgerhq/domain-service@1.2.10
  - @ledgerhq/evm-tools@1.2.4

## 2.4.3-next.0

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/coin-framework@0.18.6-next.0
  - @ledgerhq/domain-service@1.2.10-next.0
  - @ledgerhq/evm-tools@1.2.4

## 2.4.2

### Patch Changes

- Updated dependencies [[`f275f48`](https://github.com/LedgerHQ/ledger-live/commit/f275f48a17eeba2bdd3119e478975c8d4c7183be)]:
  - @ledgerhq/cryptoassets@13.6.2
  - @ledgerhq/coin-framework@0.18.5
  - @ledgerhq/domain-service@1.2.9
  - @ledgerhq/evm-tools@1.2.4

## 2.4.2-next.0

### Patch Changes

- Updated dependencies [[`f275f48`](https://github.com/LedgerHQ/ledger-live/commit/f275f48a17eeba2bdd3119e478975c8d4c7183be)]:
  - @ledgerhq/cryptoassets@13.6.2-next.0
  - @ledgerhq/coin-framework@0.18.5-next.0
  - @ledgerhq/domain-service@1.2.9-next.0
  - @ledgerhq/evm-tools@1.2.4

## 2.4.1

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/coin-framework@0.18.4
  - @ledgerhq/domain-service@1.2.8
  - @ledgerhq/evm-tools@1.2.4

## 2.4.1-hotfix.0

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/coin-framework@0.18.4-hotfix.0
  - @ledgerhq/domain-service@1.2.8-hotfix.0
  - @ledgerhq/evm-tools@1.2.4

## 2.4.0

### Minor Changes

- [#7991](https://github.com/LedgerHQ/ledger-live/pull/7991) [`ced792c`](https://github.com/LedgerHQ/ledger-live/commit/ced792c37b42135f2b7596228c14ccd0783a803f) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Decreasing the base fee multiplier to 27% for the EIP1559 fee system. Based on the spec of EIP1559, it should allow to create blocks which could be included in the next 3 blocks even in awful network situations.

### Patch Changes

- [#7874](https://github.com/LedgerHQ/ledger-live/pull/7874) [`9c6e2c4`](https://github.com/LedgerHQ/ledger-live/commit/9c6e2c4969832d9d55188ed03bbdfd79b43b7e63) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add support for Uniswap plugin resolution in `signOperation`

- Updated dependencies [[`ced792c`](https://github.com/LedgerHQ/ledger-live/commit/ced792c37b42135f2b7596228c14ccd0783a803f)]:
  - @ledgerhq/live-env@2.4.0
  - @ledgerhq/coin-framework@0.18.3
  - @ledgerhq/domain-service@1.2.7
  - @ledgerhq/evm-tools@1.2.4
  - @ledgerhq/cryptoassets@13.6.1
  - @ledgerhq/live-network@2.0.2

## 2.4.0-next.0

### Minor Changes

- [#7991](https://github.com/LedgerHQ/ledger-live/pull/7991) [`ced792c`](https://github.com/LedgerHQ/ledger-live/commit/ced792c37b42135f2b7596228c14ccd0783a803f) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Decreasing the base fee multiplier to 27% for the EIP1559 fee system. Based on the spec of EIP1559, it should allow to create blocks which could be included in the next 3 blocks even in awful network situations.

### Patch Changes

- [#7874](https://github.com/LedgerHQ/ledger-live/pull/7874) [`9c6e2c4`](https://github.com/LedgerHQ/ledger-live/commit/9c6e2c4969832d9d55188ed03bbdfd79b43b7e63) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add support for Uniswap plugin resolution in `signOperation`

- Updated dependencies [[`ced792c`](https://github.com/LedgerHQ/ledger-live/commit/ced792c37b42135f2b7596228c14ccd0783a803f)]:
  - @ledgerhq/live-env@2.4.0-next.0
  - @ledgerhq/coin-framework@0.18.3-next.0
  - @ledgerhq/domain-service@1.2.7-next.0
  - @ledgerhq/evm-tools@1.2.4-next.0
  - @ledgerhq/cryptoassets@13.6.1-next.0
  - @ledgerhq/live-network@2.0.2-next.0

## 2.3.1

### Patch Changes

- [#7817](https://github.com/LedgerHQ/ledger-live/pull/7817) [`2f71fec`](https://github.com/LedgerHQ/ledger-live/commit/2f71fecc0e4bd2692277386931978242a25a364c) Thanks [@Wozacosta](https://github.com/Wozacosta)! - chore: update default explorer for local base & zkevm config, update evm bridge test

- Updated dependencies [[`c83af75`](https://github.com/LedgerHQ/ledger-live/commit/c83af756fb388043c9f5a3862cae1231ec99a02c)]:
  - @ledgerhq/cryptoassets@13.6.0
  - @ledgerhq/coin-framework@0.18.2
  - @ledgerhq/domain-service@1.2.6
  - @ledgerhq/evm-tools@1.2.3

## 2.3.1-next.0

### Patch Changes

- [#7817](https://github.com/LedgerHQ/ledger-live/pull/7817) [`2f71fec`](https://github.com/LedgerHQ/ledger-live/commit/2f71fecc0e4bd2692277386931978242a25a364c) Thanks [@Wozacosta](https://github.com/Wozacosta)! - chore: update default explorer for local base & zkevm config, update evm bridge test

- Updated dependencies [[`c83af75`](https://github.com/LedgerHQ/ledger-live/commit/c83af756fb388043c9f5a3862cae1231ec99a02c)]:
  - @ledgerhq/cryptoassets@13.6.0-next.0
  - @ledgerhq/coin-framework@0.18.2-next.0
  - @ledgerhq/domain-service@1.2.6-next.0
  - @ledgerhq/evm-tools@1.2.3-next.0

## 2.3.0

### Minor Changes

- [#7621](https://github.com/LedgerHQ/ledger-live/pull/7621) [`1605678`](https://github.com/LedgerHQ/ledger-live/commit/1605678a4c43ce85b19bd549b295f3c67ff1dcb9) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Update preloading method to use the crypto-assets service instead of the CDN for fetching token definitions

### Patch Changes

- [#7883](https://github.com/LedgerHQ/ledger-live/pull/7883) [`f805d14`](https://github.com/LedgerHQ/ledger-live/commit/f805d1470f927824233f94eaba065b00d7af18cf) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Update Axios to 1.7.7 following CVE: https://github.com/advisories/GHSA-8hc4-vh64-cxmj

- Updated dependencies [[`1605678`](https://github.com/LedgerHQ/ledger-live/commit/1605678a4c43ce85b19bd549b295f3c67ff1dcb9), [`f805d14`](https://github.com/LedgerHQ/ledger-live/commit/f805d1470f927824233f94eaba065b00d7af18cf), [`0a71c43`](https://github.com/LedgerHQ/ledger-live/commit/0a71c4344b7bb2c6640f3e5dda152ae815573330), [`1605678`](https://github.com/LedgerHQ/ledger-live/commit/1605678a4c43ce85b19bd549b295f3c67ff1dcb9)]:
  - @ledgerhq/cryptoassets@13.5.0
  - @ledgerhq/domain-service@1.2.5
  - @ledgerhq/live-network@2.0.1
  - @ledgerhq/evm-tools@1.2.2
  - @ledgerhq/errors@6.19.1
  - @ledgerhq/coin-framework@0.18.1
  - @ledgerhq/devices@8.4.4

## 2.3.0-next.1

### Patch Changes

- [#7883](https://github.com/LedgerHQ/ledger-live/pull/7883) [`f805d14`](https://github.com/LedgerHQ/ledger-live/commit/f805d1470f927824233f94eaba065b00d7af18cf) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Update Axios to 1.7.7 following CVE: https://github.com/advisories/GHSA-8hc4-vh64-cxmj

- Updated dependencies [[`f805d14`](https://github.com/LedgerHQ/ledger-live/commit/f805d1470f927824233f94eaba065b00d7af18cf)]:
  - @ledgerhq/cryptoassets@13.5.0-next.1
  - @ledgerhq/domain-service@1.2.5-next.1
  - @ledgerhq/live-network@2.0.1-next.1
  - @ledgerhq/evm-tools@1.2.2-next.1
  - @ledgerhq/coin-framework@0.18.1-next.1

## 2.3.0-next.0

### Minor Changes

- [#7621](https://github.com/LedgerHQ/ledger-live/pull/7621) [`1605678`](https://github.com/LedgerHQ/ledger-live/commit/1605678a4c43ce85b19bd549b295f3c67ff1dcb9) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Update preloading method to use the crypto-assets service instead of the CDN for fetching token definitions

### Patch Changes

- Updated dependencies [[`1605678`](https://github.com/LedgerHQ/ledger-live/commit/1605678a4c43ce85b19bd549b295f3c67ff1dcb9), [`0a71c43`](https://github.com/LedgerHQ/ledger-live/commit/0a71c4344b7bb2c6640f3e5dda152ae815573330), [`1605678`](https://github.com/LedgerHQ/ledger-live/commit/1605678a4c43ce85b19bd549b295f3c67ff1dcb9)]:
  - @ledgerhq/cryptoassets@13.5.0-next.0
  - @ledgerhq/errors@6.19.1-next.0
  - @ledgerhq/coin-framework@0.18.1-next.0
  - @ledgerhq/evm-tools@1.2.2-next.0
  - @ledgerhq/domain-service@1.2.5-next.0
  - @ledgerhq/devices@8.4.4-next.0
  - @ledgerhq/live-network@2.0.1-next.0

## 2.2.0

### Minor Changes

- [#7741](https://github.com/LedgerHQ/ledger-live/pull/7741) [`224e33c`](https://github.com/LedgerHQ/ledger-live/commit/224e33c93d2acd22c82892148b240df004284037) Thanks [@CremaFR](https://github.com/CremaFR)! - fixed bnb custom fee crashes and erased gasLimit

- [#7652](https://github.com/LedgerHQ/ledger-live/pull/7652) [`e7db725`](https://github.com/LedgerHQ/ledger-live/commit/e7db72552042ff4dd85bec236f6bd083fa3da533) Thanks [@CremaFR](https://github.com/CremaFR)! - fix evm getFeeData to return requested option value

### Patch Changes

- [#7593](https://github.com/LedgerHQ/ledger-live/pull/7593) [`187293c`](https://github.com/LedgerHQ/ledger-live/commit/187293c6cf6093f15f07d5effc1ded0843a9e6ab) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Update `axios` to fixed version `1.7.3`

- [#7710](https://github.com/LedgerHQ/ledger-live/pull/7710) [`cc291f5`](https://github.com/LedgerHQ/ledger-live/commit/cc291f5466d80a2b7e9394338ab588ecd3db4623) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Migrating the Matic currency to POL (see https://polygon.technology/blog/save-the-date-matic-pol-migration-coming-september-4th-everything-you-need-to-know)

- [#7531](https://github.com/LedgerHQ/ledger-live/pull/7531) [`d213d81`](https://github.com/LedgerHQ/ledger-live/commit/d213d8122647d559b7a0f44e2beffa5e39c3249b) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Remove `NotEnoughBalanceInParentAccount` error from `validateAmount` check in `getTransactionStatus` as it was redundant with a `validateGas` test

- Updated dependencies [[`5c738cb`](https://github.com/LedgerHQ/ledger-live/commit/5c738cbd35ce5d0ca39ad3b86a61cc6234d1bdf7), [`9c55e81`](https://github.com/LedgerHQ/ledger-live/commit/9c55e81c84d3372f2a7fd36248f970376aec905a), [`187293c`](https://github.com/LedgerHQ/ledger-live/commit/187293c6cf6093f15f07d5effc1ded0843a9e6ab), [`187293c`](https://github.com/LedgerHQ/ledger-live/commit/187293c6cf6093f15f07d5effc1ded0843a9e6ab), [`cc291f5`](https://github.com/LedgerHQ/ledger-live/commit/cc291f5466d80a2b7e9394338ab588ecd3db4623), [`fb9466a`](https://github.com/LedgerHQ/ledger-live/commit/fb9466a4d7827fd4759c726ad3ae0b43dddcacd3), [`5758950`](https://github.com/LedgerHQ/ledger-live/commit/5758950841fbf8018dd848e745017484aec67333), [`4799d5d`](https://github.com/LedgerHQ/ledger-live/commit/4799d5de3fb1dcef2b01de31fe29b59e76922576), [`ef82161`](https://github.com/LedgerHQ/ledger-live/commit/ef82161688fc49bf32cbc88f1837b15490e5d2b4), [`d13e7b9`](https://github.com/LedgerHQ/ledger-live/commit/d13e7b9f55d92098cacc9384fd7fab24033c040f), [`a3fd728`](https://github.com/LedgerHQ/ledger-live/commit/a3fd72861f2a7df676bd793062b3816fdb9d1f57), [`a0bb74b`](https://github.com/LedgerHQ/ledger-live/commit/a0bb74b8f3704ab9d5567c9d14c16cab9e0872f7), [`eb9a36f`](https://github.com/LedgerHQ/ledger-live/commit/eb9a36f6ee8487c9ffbb841c3e6c0ca84f68bb0a), [`6815f6f`](https://github.com/LedgerHQ/ledger-live/commit/6815f6fccb9bca627a2e51ab954dc3f9b8f7c710), [`9c2f1b3`](https://github.com/LedgerHQ/ledger-live/commit/9c2f1b3b6e11a37a6b5ecf02d1e1ae7f0258e3ae)]:
  - @ledgerhq/errors@6.19.0
  - @ledgerhq/cryptoassets@13.4.0
  - @ledgerhq/domain-service@1.2.4
  - @ledgerhq/live-network@2.0.0
  - @ledgerhq/evm-tools@1.2.1
  - @ledgerhq/coin-framework@0.18.0
  - @ledgerhq/live-env@2.3.0
  - @ledgerhq/devices@8.4.3

## 2.2.0-next.0

### Minor Changes

- [#7741](https://github.com/LedgerHQ/ledger-live/pull/7741) [`224e33c`](https://github.com/LedgerHQ/ledger-live/commit/224e33c93d2acd22c82892148b240df004284037) Thanks [@CremaFR](https://github.com/CremaFR)! - fixed bnb custom fee crashes and erased gasLimit

- [#7652](https://github.com/LedgerHQ/ledger-live/pull/7652) [`e7db725`](https://github.com/LedgerHQ/ledger-live/commit/e7db72552042ff4dd85bec236f6bd083fa3da533) Thanks [@CremaFR](https://github.com/CremaFR)! - fix evm getFeeData to return requested option value

### Patch Changes

- [#7593](https://github.com/LedgerHQ/ledger-live/pull/7593) [`187293c`](https://github.com/LedgerHQ/ledger-live/commit/187293c6cf6093f15f07d5effc1ded0843a9e6ab) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Update `axios` to fixed version `1.7.3`

- [#7710](https://github.com/LedgerHQ/ledger-live/pull/7710) [`cc291f5`](https://github.com/LedgerHQ/ledger-live/commit/cc291f5466d80a2b7e9394338ab588ecd3db4623) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Migrating the Matic currency to POL (see https://polygon.technology/blog/save-the-date-matic-pol-migration-coming-september-4th-everything-you-need-to-know)

- [#7531](https://github.com/LedgerHQ/ledger-live/pull/7531) [`d213d81`](https://github.com/LedgerHQ/ledger-live/commit/d213d8122647d559b7a0f44e2beffa5e39c3249b) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Remove `NotEnoughBalanceInParentAccount` error from `validateAmount` check in `getTransactionStatus` as it was redundant with a `validateGas` test

- Updated dependencies [[`5c738cb`](https://github.com/LedgerHQ/ledger-live/commit/5c738cbd35ce5d0ca39ad3b86a61cc6234d1bdf7), [`9c55e81`](https://github.com/LedgerHQ/ledger-live/commit/9c55e81c84d3372f2a7fd36248f970376aec905a), [`187293c`](https://github.com/LedgerHQ/ledger-live/commit/187293c6cf6093f15f07d5effc1ded0843a9e6ab), [`187293c`](https://github.com/LedgerHQ/ledger-live/commit/187293c6cf6093f15f07d5effc1ded0843a9e6ab), [`cc291f5`](https://github.com/LedgerHQ/ledger-live/commit/cc291f5466d80a2b7e9394338ab588ecd3db4623), [`fb9466a`](https://github.com/LedgerHQ/ledger-live/commit/fb9466a4d7827fd4759c726ad3ae0b43dddcacd3), [`5758950`](https://github.com/LedgerHQ/ledger-live/commit/5758950841fbf8018dd848e745017484aec67333), [`4799d5d`](https://github.com/LedgerHQ/ledger-live/commit/4799d5de3fb1dcef2b01de31fe29b59e76922576), [`ef82161`](https://github.com/LedgerHQ/ledger-live/commit/ef82161688fc49bf32cbc88f1837b15490e5d2b4), [`d13e7b9`](https://github.com/LedgerHQ/ledger-live/commit/d13e7b9f55d92098cacc9384fd7fab24033c040f), [`a3fd728`](https://github.com/LedgerHQ/ledger-live/commit/a3fd72861f2a7df676bd793062b3816fdb9d1f57), [`a0bb74b`](https://github.com/LedgerHQ/ledger-live/commit/a0bb74b8f3704ab9d5567c9d14c16cab9e0872f7), [`eb9a36f`](https://github.com/LedgerHQ/ledger-live/commit/eb9a36f6ee8487c9ffbb841c3e6c0ca84f68bb0a), [`6815f6f`](https://github.com/LedgerHQ/ledger-live/commit/6815f6fccb9bca627a2e51ab954dc3f9b8f7c710), [`9c2f1b3`](https://github.com/LedgerHQ/ledger-live/commit/9c2f1b3b6e11a37a6b5ecf02d1e1ae7f0258e3ae)]:
  - @ledgerhq/errors@6.19.0-next.0
  - @ledgerhq/cryptoassets@13.4.0-next.0
  - @ledgerhq/domain-service@1.2.4-next.0
  - @ledgerhq/live-network@2.0.0-next.0
  - @ledgerhq/evm-tools@1.2.1-next.0
  - @ledgerhq/coin-framework@0.18.0-next.0
  - @ledgerhq/live-env@2.3.0-next.0
  - @ledgerhq/devices@8.4.3-next.0

## 2.1.4

### Patch Changes

- [#7494](https://github.com/LedgerHQ/ledger-live/pull/7494) [`60f1b5c`](https://github.com/LedgerHQ/ledger-live/commit/60f1b5c6cab125f5281468bb3e36f1abfae2d70c) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Update env variable for CAL_SERVICE

- Updated dependencies [[`afa03ae`](https://github.com/LedgerHQ/ledger-live/commit/afa03ae921ad1ca7df83dc0ba717c1cc27cb08cd), [`db9c2d7`](https://github.com/LedgerHQ/ledger-live/commit/db9c2d78fb74df586c3ea1b9fb75ce3b014a0f4b), [`4bd91de`](https://github.com/LedgerHQ/ledger-live/commit/4bd91de13442d12acce3ee83d5f2fd5f087570cf), [`53ff78c`](https://github.com/LedgerHQ/ledger-live/commit/53ff78c541d3ed69a3e74854d77f58a7e0d93978), [`8553b3e`](https://github.com/LedgerHQ/ledger-live/commit/8553b3eef10132396ec580a2d5f20b616f5b18a0), [`52daa39`](https://github.com/LedgerHQ/ledger-live/commit/52daa3998709ac3538afd447fe771faa3e3441be), [`60f1b5c`](https://github.com/LedgerHQ/ledger-live/commit/60f1b5c6cab125f5281468bb3e36f1abfae2d70c), [`60f1b5c`](https://github.com/LedgerHQ/ledger-live/commit/60f1b5c6cab125f5281468bb3e36f1abfae2d70c), [`60f1b5c`](https://github.com/LedgerHQ/ledger-live/commit/60f1b5c6cab125f5281468bb3e36f1abfae2d70c), [`50b6db6`](https://github.com/LedgerHQ/ledger-live/commit/50b6db67d374a23ba040043aa93e7fbc52685297)]:
  - @ledgerhq/coin-framework@0.17.0
  - @ledgerhq/cryptoassets@13.3.0
  - @ledgerhq/live-env@2.2.0
  - @ledgerhq/live-network@1.4.0
  - @ledgerhq/evm-tools@1.2.0
  - @ledgerhq/domain-service@1.2.3

## 2.1.4-next.1

### Patch Changes

- Updated dependencies [[`50b6db6`](https://github.com/LedgerHQ/ledger-live/commit/50b6db67d374a23ba040043aa93e7fbc52685297)]:
  - @ledgerhq/cryptoassets@13.3.0-next.1
  - @ledgerhq/coin-framework@0.17.0-next.1
  - @ledgerhq/evm-tools@1.2.0-next.1

## 2.1.4-next.0

### Patch Changes

- [#7494](https://github.com/LedgerHQ/ledger-live/pull/7494) [`60f1b5c`](https://github.com/LedgerHQ/ledger-live/commit/60f1b5c6cab125f5281468bb3e36f1abfae2d70c) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Update env variable for CAL_SERVICE

- Updated dependencies [[`afa03ae`](https://github.com/LedgerHQ/ledger-live/commit/afa03ae921ad1ca7df83dc0ba717c1cc27cb08cd), [`db9c2d7`](https://github.com/LedgerHQ/ledger-live/commit/db9c2d78fb74df586c3ea1b9fb75ce3b014a0f4b), [`4bd91de`](https://github.com/LedgerHQ/ledger-live/commit/4bd91de13442d12acce3ee83d5f2fd5f087570cf), [`53ff78c`](https://github.com/LedgerHQ/ledger-live/commit/53ff78c541d3ed69a3e74854d77f58a7e0d93978), [`8553b3e`](https://github.com/LedgerHQ/ledger-live/commit/8553b3eef10132396ec580a2d5f20b616f5b18a0), [`52daa39`](https://github.com/LedgerHQ/ledger-live/commit/52daa3998709ac3538afd447fe771faa3e3441be), [`60f1b5c`](https://github.com/LedgerHQ/ledger-live/commit/60f1b5c6cab125f5281468bb3e36f1abfae2d70c), [`60f1b5c`](https://github.com/LedgerHQ/ledger-live/commit/60f1b5c6cab125f5281468bb3e36f1abfae2d70c), [`60f1b5c`](https://github.com/LedgerHQ/ledger-live/commit/60f1b5c6cab125f5281468bb3e36f1abfae2d70c)]:
  - @ledgerhq/coin-framework@0.17.0-next.0
  - @ledgerhq/cryptoassets@13.3.0-next.0
  - @ledgerhq/live-env@2.2.0-next.0
  - @ledgerhq/live-network@1.4.0-next.0
  - @ledgerhq/evm-tools@1.2.0-next.0
  - @ledgerhq/domain-service@1.2.3-next.0

## 2.1.3

### Patch Changes

- Updated dependencies [[`0b12c90`](https://github.com/LedgerHQ/ledger-live/commit/0b12c9040d6ee0a326b1d5effd261ddee2db452f)]:
  - @ledgerhq/devices@8.4.2
  - @ledgerhq/coin-framework@0.16.1

## 2.1.3-hotfix.0

### Patch Changes

- Updated dependencies [[`5d508e5`](https://github.com/LedgerHQ/ledger-live/commit/5d508e5cfd296e458746adf176dd292aa884f7ea)]:
  - @ledgerhq/devices@8.4.2-hotfix.0
  - @ledgerhq/coin-framework@0.16.1-hotfix.0

## 2.1.2

### Patch Changes

- Updated dependencies [[`ef2d53d`](https://github.com/LedgerHQ/ledger-live/commit/ef2d53d514f1f4e6f18fc79fa3423bd9b0208a04), [`b77ab8e`](https://github.com/LedgerHQ/ledger-live/commit/b77ab8e718ee8e10b74dc15370e8a19d2597d39e), [`fe8a26b`](https://github.com/LedgerHQ/ledger-live/commit/fe8a26b04206df64e50220c3e9249c9a1bd057a6), [`e78f3b7`](https://github.com/LedgerHQ/ledger-live/commit/e78f3b75296c7a063f6cddbeae44c36d236055f3), [`f979216`](https://github.com/LedgerHQ/ledger-live/commit/f9792160293fc8215c6d099f02e1b136c6655f9b), [`c1d2bb0`](https://github.com/LedgerHQ/ledger-live/commit/c1d2bb0866723c10d6e2899d40ddd9b9801189f4), [`c59adf2`](https://github.com/LedgerHQ/ledger-live/commit/c59adf2b0d49ea3c72b94fcb356eb72bcbfc4a6b)]:
  - @ledgerhq/cryptoassets@13.2.0
  - @ledgerhq/coin-framework@0.16.0
  - @ledgerhq/errors@6.18.0
  - @ledgerhq/domain-service@1.2.2
  - @ledgerhq/evm-tools@1.1.2
  - @ledgerhq/devices@8.4.1
  - @ledgerhq/live-network@1.3.1

## 2.1.2-next.0

### Patch Changes

- Updated dependencies [[`ef2d53d`](https://github.com/LedgerHQ/ledger-live/commit/ef2d53d514f1f4e6f18fc79fa3423bd9b0208a04), [`b77ab8e`](https://github.com/LedgerHQ/ledger-live/commit/b77ab8e718ee8e10b74dc15370e8a19d2597d39e), [`fe8a26b`](https://github.com/LedgerHQ/ledger-live/commit/fe8a26b04206df64e50220c3e9249c9a1bd057a6), [`e78f3b7`](https://github.com/LedgerHQ/ledger-live/commit/e78f3b75296c7a063f6cddbeae44c36d236055f3), [`f979216`](https://github.com/LedgerHQ/ledger-live/commit/f9792160293fc8215c6d099f02e1b136c6655f9b), [`c1d2bb0`](https://github.com/LedgerHQ/ledger-live/commit/c1d2bb0866723c10d6e2899d40ddd9b9801189f4), [`c59adf2`](https://github.com/LedgerHQ/ledger-live/commit/c59adf2b0d49ea3c72b94fcb356eb72bcbfc4a6b)]:
  - @ledgerhq/cryptoassets@13.2.0-next.0
  - @ledgerhq/coin-framework@0.16.0-next.0
  - @ledgerhq/errors@6.18.0-next.0
  - @ledgerhq/domain-service@1.2.2-next.0
  - @ledgerhq/evm-tools@1.1.2-next.0
  - @ledgerhq/devices@8.4.1-next.0
  - @ledgerhq/live-network@1.3.1-next.0

## 2.1.1

### Patch Changes

- [#7078](https://github.com/LedgerHQ/ledger-live/pull/7078) [`993c5f2`](https://github.com/LedgerHQ/ledger-live/commit/993c5f25b8a3ef3bb1f96dd93883e430e61f9fac) Thanks [@lvndry](https://github.com/lvndry)! - [evm] Improve error message if could not get list of operations

- [#7206](https://github.com/LedgerHQ/ledger-live/pull/7206) [`81e5b8b`](https://github.com/LedgerHQ/ledger-live/commit/81e5b8bf4830dcb9d666436f2cc4367d92e93e78) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - chore: resolve merge conflicts

- Updated dependencies [[`cde94b9`](https://github.com/LedgerHQ/ledger-live/commit/cde94b9584d6889849fb097813a5fc11ea19d069), [`b478096`](https://github.com/LedgerHQ/ledger-live/commit/b478096537a0f86a9e39acc8c6cf17b1184e0849), [`81e5b8b`](https://github.com/LedgerHQ/ledger-live/commit/81e5b8bf4830dcb9d666436f2cc4367d92e93e78)]:
  - @ledgerhq/coin-framework@0.15.0
  - @ledgerhq/cryptoassets@13.1.1
  - @ledgerhq/domain-service@1.2.1
  - @ledgerhq/evm-tools@1.1.1

## 2.1.1-next.2

### Patch Changes

- [#7206](https://github.com/LedgerHQ/ledger-live/pull/7206) [`81e5b8b`](https://github.com/LedgerHQ/ledger-live/commit/81e5b8bf4830dcb9d666436f2cc4367d92e93e78) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - chore: resolve merge conflicts

- Updated dependencies [[`81e5b8b`](https://github.com/LedgerHQ/ledger-live/commit/81e5b8bf4830dcb9d666436f2cc4367d92e93e78)]:
  - @ledgerhq/cryptoassets@13.1.1-next.1
  - @ledgerhq/coin-framework@0.15.0-next.2
  - @ledgerhq/domain-service@1.2.1-next.1
  - @ledgerhq/evm-tools@1.1.1-next.1

## 2.1.1-next.1

### Patch Changes

- Updated dependencies [[`b478096`](https://github.com/LedgerHQ/ledger-live/commit/b478096537a0f86a9e39acc8c6cf17b1184e0849)]:
  - @ledgerhq/cryptoassets@13.1.1-next.0
  - @ledgerhq/coin-framework@0.15.0-next.1
  - @ledgerhq/evm-tools@1.1.1-next.0

## 2.1.1-next.0

### Patch Changes

- [#7078](https://github.com/LedgerHQ/ledger-live/pull/7078) [`993c5f2`](https://github.com/LedgerHQ/ledger-live/commit/993c5f25b8a3ef3bb1f96dd93883e430e61f9fac) Thanks [@lvndry](https://github.com/lvndry)! - [evm] Improve error message if could not get list of operations

- Updated dependencies [[`cde94b9`](https://github.com/LedgerHQ/ledger-live/commit/cde94b9584d6889849fb097813a5fc11ea19d069)]:
  - @ledgerhq/coin-framework@0.15.0-next.0
  - @ledgerhq/domain-service@1.2.1-next.0
  - @ledgerhq/evm-tools@1.1.0

## 2.1.0

### Minor Changes

- [#6596](https://github.com/LedgerHQ/ledger-live/pull/6596) [`77fa530`](https://github.com/LedgerHQ/ledger-live/commit/77fa530c8626df94fa7f9c0a8b3a99f2efa7cb11) Thanks [@KVNLS](https://github.com/KVNLS)! - Upgrade React Native to version 0.73.6

- [#7030](https://github.com/LedgerHQ/ledger-live/pull/7030) [`12a74b9`](https://github.com/LedgerHQ/ledger-live/commit/12a74b9f2f27285e44a5dca665422b3b8ecd4028) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Update evm coin-tester indexer now supporting Ledger & Etherscan-like explorers

- [#6876](https://github.com/LedgerHQ/ledger-live/pull/6876) [`689e6e5`](https://github.com/LedgerHQ/ledger-live/commit/689e6e5a443170b8e6c2b404cc99af2e67d8e8e4) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Update coin implementations to use new account bridge types & implement cleaner architecture

- [#6977](https://github.com/LedgerHQ/ledger-live/pull/6977) [`2f2b754`](https://github.com/LedgerHQ/ledger-live/commit/2f2b754b1350360ca0d9f761ca6e4a8cbaff141b) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add support for Scroll & Scroll Sepolia

### Patch Changes

- [#6663](https://github.com/LedgerHQ/ledger-live/pull/6663) [`de5de2d`](https://github.com/LedgerHQ/ledger-live/commit/de5de2d273ed6966c82bde2c3a95b98ba594204f) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Reorganize coin serializaiton code

- [#6754](https://github.com/LedgerHQ/ledger-live/pull/6754) [`4c01029`](https://github.com/LedgerHQ/ledger-live/commit/4c01029b4d4feb32dab2f9e77da1126050d8c1bc) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Move Tezos in its own package

- [#6752](https://github.com/LedgerHQ/ledger-live/pull/6752) [`434262d`](https://github.com/LedgerHQ/ledger-live/commit/434262db4560f62113002fbb607bd1a8da0712b4) Thanks [@CremaFR](https://github.com/CremaFR)! - bugfix, keep swap history for token when deep cleaning

- [#6844](https://github.com/LedgerHQ/ledger-live/pull/6844) [`f19960f`](https://github.com/LedgerHQ/ledger-live/commit/f19960f2e7104e5bdf332269fa92fda47455e17d) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Simplify SignerContext generic signature

- [#6796](https://github.com/LedgerHQ/ledger-live/pull/6796) [`6552679`](https://github.com/LedgerHQ/ledger-live/commit/65526794bb4d1fbc7e286c0e1c0b6d021413fc8c) Thanks [@gre](https://github.com/gre)! - Drop technical Account#name and Account#starred fields and replace it with a new architecture: a wallet store that contains all user's data.

- [#7030](https://github.com/LedgerHQ/ledger-live/pull/7030) [`12a74b9`](https://github.com/LedgerHQ/ledger-live/commit/12a74b9f2f27285e44a5dca665422b3b8ecd4028) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Make `gasTracker` optional in `EvmConfig`

- [#6816](https://github.com/LedgerHQ/ledger-live/pull/6816) [`60cd799`](https://github.com/LedgerHQ/ledger-live/commit/60cd799e693e3ae0712a5a9e88206b5304bbc214) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Split currencies utils between CoinFmk and LLC

- Updated dependencies [[`77fa530`](https://github.com/LedgerHQ/ledger-live/commit/77fa530c8626df94fa7f9c0a8b3a99f2efa7cb11), [`6c35cc5`](https://github.com/LedgerHQ/ledger-live/commit/6c35cc564cb050614ee571907f628ecf15ec4584), [`b9f1f71`](https://github.com/LedgerHQ/ledger-live/commit/b9f1f715355752d8c57c24ecd6a6d166b80f689d), [`815ae3d`](https://github.com/LedgerHQ/ledger-live/commit/815ae3dae8027823854ada837df3dc983d09b10f), [`de5de2d`](https://github.com/LedgerHQ/ledger-live/commit/de5de2d273ed6966c82bde2c3a95b98ba594204f), [`83e5690`](https://github.com/LedgerHQ/ledger-live/commit/83e5690429e41ecd1c508b3398904ae747085cf7), [`4c01029`](https://github.com/LedgerHQ/ledger-live/commit/4c01029b4d4feb32dab2f9e77da1126050d8c1bc), [`326cae0`](https://github.com/LedgerHQ/ledger-live/commit/326cae088cc33795536deb1d868c86e8dbeb6a13), [`6c35cc5`](https://github.com/LedgerHQ/ledger-live/commit/6c35cc564cb050614ee571907f628ecf15ec4584), [`4499990`](https://github.com/LedgerHQ/ledger-live/commit/449999066c58ae5df371dfb92a7230f9b5e90a60), [`a18c28e`](https://github.com/LedgerHQ/ledger-live/commit/a18c28e3f6a6132bd5e53d5b61721084b3aa19e8), [`cec1599`](https://github.com/LedgerHQ/ledger-live/commit/cec1599a41aa1a18a249e34312164bc93b63972f), [`801265b`](https://github.com/LedgerHQ/ledger-live/commit/801265b7ff3ed7ebd0012eb50f70898557a2dd52), [`d5a1300`](https://github.com/LedgerHQ/ledger-live/commit/d5a130034c18c7ac8b1fd3d4c5271423b4f7639d), [`6d44f25`](https://github.com/LedgerHQ/ledger-live/commit/6d44f255c5b2f453c61d0b754807db1f76d7174e), [`f19960f`](https://github.com/LedgerHQ/ledger-live/commit/f19960f2e7104e5bdf332269fa92fda47455e17d), [`3b9c93c`](https://github.com/LedgerHQ/ledger-live/commit/3b9c93c0de8ceff2af96a6ee8e42b8d9c2ab7af0), [`6623cd1`](https://github.com/LedgerHQ/ledger-live/commit/6623cd13102bd8340bd7d4dfdd469934527985c3), [`f7e7881`](https://github.com/LedgerHQ/ledger-live/commit/f7e7881a820880143c2b011d6a92b5a36156b2c1), [`2f2b754`](https://github.com/LedgerHQ/ledger-live/commit/2f2b754b1350360ca0d9f761ca6e4a8cbaff141b), [`689e6e5`](https://github.com/LedgerHQ/ledger-live/commit/689e6e5a443170b8e6c2b404cc99af2e67d8e8e4), [`6552679`](https://github.com/LedgerHQ/ledger-live/commit/65526794bb4d1fbc7e286c0e1c0b6d021413fc8c), [`fda6a81`](https://github.com/LedgerHQ/ledger-live/commit/fda6a814544b3a1debceab22f69485911e76cadc), [`689e6e5`](https://github.com/LedgerHQ/ledger-live/commit/689e6e5a443170b8e6c2b404cc99af2e67d8e8e4), [`60cd799`](https://github.com/LedgerHQ/ledger-live/commit/60cd799e693e3ae0712a5a9e88206b5304bbc214), [`84274a6`](https://github.com/LedgerHQ/ledger-live/commit/84274a6e764a385f707bc811ead7a7e92a02ed6a)]:
  - @ledgerhq/cryptoassets@13.1.0
  - @ledgerhq/devices@8.4.0
  - @ledgerhq/errors@6.17.0
  - @ledgerhq/coin-framework@0.14.0
  - @ledgerhq/domain-service@1.2.0
  - @ledgerhq/live-network@1.3.0
  - @ledgerhq/evm-tools@1.1.0
  - @ledgerhq/live-promise@0.1.0
  - @ledgerhq/live-env@2.1.0

## 2.1.0-next.2

### Patch Changes

- Updated dependencies [[`d5a1300`](https://github.com/LedgerHQ/ledger-live/commit/d5a130034c18c7ac8b1fd3d4c5271423b4f7639d)]:
  - @ledgerhq/cryptoassets@13.1.0-next.2
  - @ledgerhq/coin-framework@0.14.0-next.2
  - @ledgerhq/evm-tools@1.1.0-next.2

## 2.1.0-next.1

### Patch Changes

- Updated dependencies [[`f7e7881`](https://github.com/LedgerHQ/ledger-live/commit/f7e7881a820880143c2b011d6a92b5a36156b2c1)]:
  - @ledgerhq/cryptoassets@13.1.0-next.1
  - @ledgerhq/coin-framework@0.14.0-next.1
  - @ledgerhq/evm-tools@1.1.0-next.1

## 2.1.0-next.0

### Minor Changes

- [#6596](https://github.com/LedgerHQ/ledger-live/pull/6596) [`77fa530`](https://github.com/LedgerHQ/ledger-live/commit/77fa530c8626df94fa7f9c0a8b3a99f2efa7cb11) Thanks [@KVNLS](https://github.com/KVNLS)! - Upgrade React Native to version 0.73.6

- [#7030](https://github.com/LedgerHQ/ledger-live/pull/7030) [`12a74b9`](https://github.com/LedgerHQ/ledger-live/commit/12a74b9f2f27285e44a5dca665422b3b8ecd4028) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Update evm coin-tester indexer now supporting Ledger & Etherscan-like explorers

- [#6876](https://github.com/LedgerHQ/ledger-live/pull/6876) [`689e6e5`](https://github.com/LedgerHQ/ledger-live/commit/689e6e5a443170b8e6c2b404cc99af2e67d8e8e4) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Update coin implementations to use new account bridge types & implement cleaner architecture

- [#6977](https://github.com/LedgerHQ/ledger-live/pull/6977) [`2f2b754`](https://github.com/LedgerHQ/ledger-live/commit/2f2b754b1350360ca0d9f761ca6e4a8cbaff141b) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add support for Scroll & Scroll Sepolia

### Patch Changes

- [#6663](https://github.com/LedgerHQ/ledger-live/pull/6663) [`de5de2d`](https://github.com/LedgerHQ/ledger-live/commit/de5de2d273ed6966c82bde2c3a95b98ba594204f) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Reorganize coin serializaiton code

- [#6754](https://github.com/LedgerHQ/ledger-live/pull/6754) [`4c01029`](https://github.com/LedgerHQ/ledger-live/commit/4c01029b4d4feb32dab2f9e77da1126050d8c1bc) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Move Tezos in its own package

- [#6752](https://github.com/LedgerHQ/ledger-live/pull/6752) [`434262d`](https://github.com/LedgerHQ/ledger-live/commit/434262db4560f62113002fbb607bd1a8da0712b4) Thanks [@CremaFR](https://github.com/CremaFR)! - bugfix, keep swap history for token when deep cleaning

- [#6844](https://github.com/LedgerHQ/ledger-live/pull/6844) [`f19960f`](https://github.com/LedgerHQ/ledger-live/commit/f19960f2e7104e5bdf332269fa92fda47455e17d) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Simplify SignerContext generic signature

- [#6796](https://github.com/LedgerHQ/ledger-live/pull/6796) [`6552679`](https://github.com/LedgerHQ/ledger-live/commit/65526794bb4d1fbc7e286c0e1c0b6d021413fc8c) Thanks [@gre](https://github.com/gre)! - Drop technical Account#name and Account#starred fields and replace it with a new architecture: a wallet store that contains all user's data.

- [#7030](https://github.com/LedgerHQ/ledger-live/pull/7030) [`12a74b9`](https://github.com/LedgerHQ/ledger-live/commit/12a74b9f2f27285e44a5dca665422b3b8ecd4028) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Make `gasTracker` optional in `EvmConfig`

- [#6816](https://github.com/LedgerHQ/ledger-live/pull/6816) [`60cd799`](https://github.com/LedgerHQ/ledger-live/commit/60cd799e693e3ae0712a5a9e88206b5304bbc214) Thanks [@sprohaszka-ledger](https://github.com/sprohaszka-ledger)! - Split currencies utils between CoinFmk and LLC

- Updated dependencies [[`77fa530`](https://github.com/LedgerHQ/ledger-live/commit/77fa530c8626df94fa7f9c0a8b3a99f2efa7cb11), [`6c35cc5`](https://github.com/LedgerHQ/ledger-live/commit/6c35cc564cb050614ee571907f628ecf15ec4584), [`b9f1f71`](https://github.com/LedgerHQ/ledger-live/commit/b9f1f715355752d8c57c24ecd6a6d166b80f689d), [`815ae3d`](https://github.com/LedgerHQ/ledger-live/commit/815ae3dae8027823854ada837df3dc983d09b10f), [`de5de2d`](https://github.com/LedgerHQ/ledger-live/commit/de5de2d273ed6966c82bde2c3a95b98ba594204f), [`83e5690`](https://github.com/LedgerHQ/ledger-live/commit/83e5690429e41ecd1c508b3398904ae747085cf7), [`4c01029`](https://github.com/LedgerHQ/ledger-live/commit/4c01029b4d4feb32dab2f9e77da1126050d8c1bc), [`326cae0`](https://github.com/LedgerHQ/ledger-live/commit/326cae088cc33795536deb1d868c86e8dbeb6a13), [`6c35cc5`](https://github.com/LedgerHQ/ledger-live/commit/6c35cc564cb050614ee571907f628ecf15ec4584), [`4499990`](https://github.com/LedgerHQ/ledger-live/commit/449999066c58ae5df371dfb92a7230f9b5e90a60), [`a18c28e`](https://github.com/LedgerHQ/ledger-live/commit/a18c28e3f6a6132bd5e53d5b61721084b3aa19e8), [`cec1599`](https://github.com/LedgerHQ/ledger-live/commit/cec1599a41aa1a18a249e34312164bc93b63972f), [`801265b`](https://github.com/LedgerHQ/ledger-live/commit/801265b7ff3ed7ebd0012eb50f70898557a2dd52), [`6d44f25`](https://github.com/LedgerHQ/ledger-live/commit/6d44f255c5b2f453c61d0b754807db1f76d7174e), [`f19960f`](https://github.com/LedgerHQ/ledger-live/commit/f19960f2e7104e5bdf332269fa92fda47455e17d), [`3b9c93c`](https://github.com/LedgerHQ/ledger-live/commit/3b9c93c0de8ceff2af96a6ee8e42b8d9c2ab7af0), [`6623cd1`](https://github.com/LedgerHQ/ledger-live/commit/6623cd13102bd8340bd7d4dfdd469934527985c3), [`2f2b754`](https://github.com/LedgerHQ/ledger-live/commit/2f2b754b1350360ca0d9f761ca6e4a8cbaff141b), [`689e6e5`](https://github.com/LedgerHQ/ledger-live/commit/689e6e5a443170b8e6c2b404cc99af2e67d8e8e4), [`6552679`](https://github.com/LedgerHQ/ledger-live/commit/65526794bb4d1fbc7e286c0e1c0b6d021413fc8c), [`fda6a81`](https://github.com/LedgerHQ/ledger-live/commit/fda6a814544b3a1debceab22f69485911e76cadc), [`689e6e5`](https://github.com/LedgerHQ/ledger-live/commit/689e6e5a443170b8e6c2b404cc99af2e67d8e8e4), [`60cd799`](https://github.com/LedgerHQ/ledger-live/commit/60cd799e693e3ae0712a5a9e88206b5304bbc214), [`84274a6`](https://github.com/LedgerHQ/ledger-live/commit/84274a6e764a385f707bc811ead7a7e92a02ed6a)]:
  - @ledgerhq/cryptoassets@13.1.0-next.0
  - @ledgerhq/devices@8.4.0-next.0
  - @ledgerhq/errors@6.17.0-next.0
  - @ledgerhq/coin-framework@0.14.0-next.0
  - @ledgerhq/domain-service@1.2.0-next.0
  - @ledgerhq/live-network@1.3.0-next.0
  - @ledgerhq/evm-tools@1.1.0-next.0
  - @ledgerhq/live-promise@0.1.0-next.0
  - @ledgerhq/live-env@2.1.0-next.0

## 2.0.0

### Major Changes

- [#6669](https://github.com/LedgerHQ/ledger-live/pull/6669) [`fdb76a7`](https://github.com/LedgerHQ/ledger-live/commit/fdb76a7c3a8459a50b22b3e5a5a3002932805bcd) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Removing support for Goerli & Ropsten networks and their Layer 2 variants (Linea Goerli & Optimism Goerli) and replace them by Linea Sepolia & Optimism Sepolia

### Minor Changes

- [#6567](https://github.com/LedgerHQ/ledger-live/pull/6567) [`0dae8e5`](https://github.com/LedgerHQ/ledger-live/commit/0dae8e5a33704eaee5976e8ae2cbe29c6f458167) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Update `getSyncHash` method to use new hash files provided by token importers instead of manually serializing each token. This greatly improve performances of that method.

### Patch Changes

- [#6684](https://github.com/LedgerHQ/ledger-live/pull/6684) [`96029e1`](https://github.com/LedgerHQ/ledger-live/commit/96029e1396be2f283f0345a59e08009b0a6a96db) Thanks [@CremaFR](https://github.com/CremaFR)! - Allow additional fees when using maxButton

- Updated dependencies [[`5552ca0`](https://github.com/LedgerHQ/ledger-live/commit/5552ca0542d5734b845ed23dae2f02c6d1b8ba2d), [`fdb76a7`](https://github.com/LedgerHQ/ledger-live/commit/fdb76a7c3a8459a50b22b3e5a5a3002932805bcd), [`df1dcbf`](https://github.com/LedgerHQ/ledger-live/commit/df1dcbffe901d7c4baddb46a06b08a4ed5b7a17e), [`3896648`](https://github.com/LedgerHQ/ledger-live/commit/389664874b98074905a7f8f8e5a845bb76908f13), [`45a53bc`](https://github.com/LedgerHQ/ledger-live/commit/45a53bc227ab2f42b1e839aacbb8c251d0a4a5d2), [`0dae8e5`](https://github.com/LedgerHQ/ledger-live/commit/0dae8e5a33704eaee5976e8ae2cbe29c6f458167), [`fdb76a7`](https://github.com/LedgerHQ/ledger-live/commit/fdb76a7c3a8459a50b22b3e5a5a3002932805bcd), [`0dae8e5`](https://github.com/LedgerHQ/ledger-live/commit/0dae8e5a33704eaee5976e8ae2cbe29c6f458167), [`cfb97f7`](https://github.com/LedgerHQ/ledger-live/commit/cfb97f7d5c81824815522e8699b7469047b1513a), [`2f2ef00`](https://github.com/LedgerHQ/ledger-live/commit/2f2ef001145469870ac703b6af28fdf8f0d70945)]:
  - @ledgerhq/live-promise@0.0.4
  - @ledgerhq/coin-framework@0.13.0
  - @ledgerhq/live-env@2.0.2
  - @ledgerhq/cryptoassets@13.0.0
  - @ledgerhq/live-network@1.2.2
  - @ledgerhq/domain-service@1.1.21
  - @ledgerhq/evm-tools@1.0.19

## 2.0.0-next.1

### Patch Changes

- Updated dependencies [[`5552ca0`](https://github.com/LedgerHQ/ledger-live/commit/5552ca0542d5734b845ed23dae2f02c6d1b8ba2d)]:
  - @ledgerhq/live-promise@0.0.4-next.1
  - @ledgerhq/live-network@1.2.2-next.1

## 2.0.0-next.0

### Major Changes

- [#6669](https://github.com/LedgerHQ/ledger-live/pull/6669) [`fdb76a7`](https://github.com/LedgerHQ/ledger-live/commit/fdb76a7c3a8459a50b22b3e5a5a3002932805bcd) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Removing support for Goerli & Ropsten networks and their Layer 2 variants (Linea Goerli & Optimism Goerli) and replace them by Linea Sepolia & Optimism Sepolia

### Minor Changes

- [#6567](https://github.com/LedgerHQ/ledger-live/pull/6567) [`0dae8e5`](https://github.com/LedgerHQ/ledger-live/commit/0dae8e5a33704eaee5976e8ae2cbe29c6f458167) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Update `getSyncHash` method to use new hash files provided by token importers instead of manually serializing each token. This greatly improve performances of that method.

### Patch Changes

- [#6684](https://github.com/LedgerHQ/ledger-live/pull/6684) [`96029e1`](https://github.com/LedgerHQ/ledger-live/commit/96029e1396be2f283f0345a59e08009b0a6a96db) Thanks [@CremaFR](https://github.com/CremaFR)! - Allow additional fees when using maxButton

- Updated dependencies [[`fdb76a7`](https://github.com/LedgerHQ/ledger-live/commit/fdb76a7c3a8459a50b22b3e5a5a3002932805bcd), [`df1dcbf`](https://github.com/LedgerHQ/ledger-live/commit/df1dcbffe901d7c4baddb46a06b08a4ed5b7a17e), [`3896648`](https://github.com/LedgerHQ/ledger-live/commit/389664874b98074905a7f8f8e5a845bb76908f13), [`45a53bc`](https://github.com/LedgerHQ/ledger-live/commit/45a53bc227ab2f42b1e839aacbb8c251d0a4a5d2), [`0dae8e5`](https://github.com/LedgerHQ/ledger-live/commit/0dae8e5a33704eaee5976e8ae2cbe29c6f458167), [`fdb76a7`](https://github.com/LedgerHQ/ledger-live/commit/fdb76a7c3a8459a50b22b3e5a5a3002932805bcd), [`0dae8e5`](https://github.com/LedgerHQ/ledger-live/commit/0dae8e5a33704eaee5976e8ae2cbe29c6f458167), [`cfb97f7`](https://github.com/LedgerHQ/ledger-live/commit/cfb97f7d5c81824815522e8699b7469047b1513a), [`2f2ef00`](https://github.com/LedgerHQ/ledger-live/commit/2f2ef001145469870ac703b6af28fdf8f0d70945)]:
  - @ledgerhq/coin-framework@0.13.0-next.0
  - @ledgerhq/live-env@2.0.2-next.0
  - @ledgerhq/cryptoassets@13.0.0-next.0
  - @ledgerhq/live-network@1.2.2-next.0
  - @ledgerhq/live-promise@0.0.4-next.0
  - @ledgerhq/domain-service@1.1.21-next.0
  - @ledgerhq/evm-tools@1.0.19-next.0

## 1.1.0

### Minor Changes

- [#6309](https://github.com/LedgerHQ/ledger-live/pull/6309) [`5848f9e`](https://github.com/LedgerHQ/ledger-live/commit/5848f9e247f169eb7a4aff322253937214b9efdd) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Removes never publicly exposed Evmos & Kava currencies. Also fixes multiple Etherscan based explorers URI (Lukso, RSK, Astar & Boba).

- [#6290](https://github.com/LedgerHQ/ledger-live/pull/6290) [`08c9779`](https://github.com/LedgerHQ/ledger-live/commit/08c9779659628e4e22ac99a152049ac3fa2745fa) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add `chainId` while using the `hw-getAddress` method to display the network name and logo on a Stax device

- [#6422](https://github.com/LedgerHQ/ledger-live/pull/6422) [`381023d`](https://github.com/LedgerHQ/ledger-live/commit/381023de2617aa09829a8b5dad7b0ba2c846328e) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Fix Operations' amount depending if failure and remove internal operations from a failed coin operation

- [#6482](https://github.com/LedgerHQ/ledger-live/pull/6482) [`83d0bc6`](https://github.com/LedgerHQ/ledger-live/commit/83d0bc67979159044a7785b5cb4cbda8ed78ebf4) Thanks [@vbergeron-ledger](https://github.com/vbergeron-ledger)! - EVM coin synchronozation is now optimized to start from the latest sync rather than from the latest operation

### Patch Changes

- [#6501](https://github.com/LedgerHQ/ledger-live/pull/6501) [`5e939e0`](https://github.com/LedgerHQ/ledger-live/commit/5e939e0540cabb8d9931794b79909fe0a353a179) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add missing index to Ledger ERC20 operations' ids, leading to missing token ops in history

- [#6341](https://github.com/LedgerHQ/ledger-live/pull/6341) [`92e9d19`](https://github.com/LedgerHQ/ledger-live/commit/92e9d194313ffd1542b676c59ae2d34e861f698f) Thanks [@sarneijim](https://github.com/sarneijim)! - Fix swap history

- [#6370](https://github.com/LedgerHQ/ledger-live/pull/6370) [`3c15515`](https://github.com/LedgerHQ/ledger-live/commit/3c155155f2d45fb85f8900e7e77c1b5ab1c7ad67) Thanks [@lvndry](https://github.com/lvndry)! - Get evm node, explorer and gasTracker information from liveconfig

- Updated dependencies [[`1aa8ef4`](https://github.com/LedgerHQ/ledger-live/commit/1aa8ef404411c31f6ac4cf09fba453042db8b955), [`3c15515`](https://github.com/LedgerHQ/ledger-live/commit/3c155155f2d45fb85f8900e7e77c1b5ab1c7ad67), [`762dea1`](https://github.com/LedgerHQ/ledger-live/commit/762dea1c52ef0537961d058f7ba81fa399663ac1), [`fc4f83e`](https://github.com/LedgerHQ/ledger-live/commit/fc4f83e26d9f00b7c518f28157e8d9da55ce3685), [`dd1d17f`](https://github.com/LedgerHQ/ledger-live/commit/dd1d17fd3ce7ed42558204b2f93707fb9b1599de), [`26b3a5d`](https://github.com/LedgerHQ/ledger-live/commit/26b3a5d7d6e11efc226403707d683f3d0098a1c1), [`5848f9e`](https://github.com/LedgerHQ/ledger-live/commit/5848f9e247f169eb7a4aff322253937214b9efdd), [`a8138f9`](https://github.com/LedgerHQ/ledger-live/commit/a8138f9ec0cff714d9745012eb91a09713ffbbd2), [`ebb45be`](https://github.com/LedgerHQ/ledger-live/commit/ebb45be56c6b1fdb3c36a8c20a16b41600baa264), [`53da330`](https://github.com/LedgerHQ/ledger-live/commit/53da3301aaceeb16e6b1f96b1ea44428fbeb4483), [`abb1bbb`](https://github.com/LedgerHQ/ledger-live/commit/abb1bbb09c52a3d08577ba622c6cb0f44aab36c1)]:
  - @ledgerhq/coin-framework@0.12.0
  - @ledgerhq/cryptoassets@12.1.0
  - @ledgerhq/live-env@2.0.1
  - @ledgerhq/errors@6.16.4
  - @ledgerhq/devices@8.3.0
  - @ledgerhq/domain-service@1.1.20
  - @ledgerhq/evm-tools@1.0.18
  - @ledgerhq/live-network@1.2.1

## 1.1.0-next.1

### Patch Changes

- Updated dependencies [[`762dea1`](https://github.com/LedgerHQ/ledger-live/commit/762dea1c52ef0537961d058f7ba81fa399663ac1)]:
  - @ledgerhq/live-env@2.0.1-next.0
  - @ledgerhq/coin-framework@0.12.0-next.1
  - @ledgerhq/evm-tools@1.0.18-next.1
  - @ledgerhq/live-network@1.2.1-next.1

## 1.1.0-next.0

### Minor Changes

- [#6309](https://github.com/LedgerHQ/ledger-live/pull/6309) [`5848f9e`](https://github.com/LedgerHQ/ledger-live/commit/5848f9e247f169eb7a4aff322253937214b9efdd) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Removes never publicly exposed Evmos & Kava currencies. Also fixes multiple Etherscan based explorers URI (Lukso, RSK, Astar & Boba).

- [#6290](https://github.com/LedgerHQ/ledger-live/pull/6290) [`08c9779`](https://github.com/LedgerHQ/ledger-live/commit/08c9779659628e4e22ac99a152049ac3fa2745fa) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add `chainId` while using the `hw-getAddress` method to display the network name and logo on a Stax device

- [#6422](https://github.com/LedgerHQ/ledger-live/pull/6422) [`381023d`](https://github.com/LedgerHQ/ledger-live/commit/381023de2617aa09829a8b5dad7b0ba2c846328e) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Fix Operations' amount depending if failure and remove internal operations from a failed coin operation

- [#6482](https://github.com/LedgerHQ/ledger-live/pull/6482) [`83d0bc6`](https://github.com/LedgerHQ/ledger-live/commit/83d0bc67979159044a7785b5cb4cbda8ed78ebf4) Thanks [@vbergeron-ledger](https://github.com/vbergeron-ledger)! - EVM coin synchronozation is now optimized to start from the latest sync rather than from the latest operation

### Patch Changes

- [#6501](https://github.com/LedgerHQ/ledger-live/pull/6501) [`5e939e0`](https://github.com/LedgerHQ/ledger-live/commit/5e939e0540cabb8d9931794b79909fe0a353a179) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add missing index to Ledger ERC20 operations' ids, leading to missing token ops in history

- [#6341](https://github.com/LedgerHQ/ledger-live/pull/6341) [`92e9d19`](https://github.com/LedgerHQ/ledger-live/commit/92e9d194313ffd1542b676c59ae2d34e861f698f) Thanks [@sarneijim](https://github.com/sarneijim)! - Fix swap history

- [#6370](https://github.com/LedgerHQ/ledger-live/pull/6370) [`3c15515`](https://github.com/LedgerHQ/ledger-live/commit/3c155155f2d45fb85f8900e7e77c1b5ab1c7ad67) Thanks [@lvndry](https://github.com/lvndry)! - Get evm node, explorer and gasTracker information from liveconfig

- Updated dependencies [[`1aa8ef4`](https://github.com/LedgerHQ/ledger-live/commit/1aa8ef404411c31f6ac4cf09fba453042db8b955), [`3c15515`](https://github.com/LedgerHQ/ledger-live/commit/3c155155f2d45fb85f8900e7e77c1b5ab1c7ad67), [`fc4f83e`](https://github.com/LedgerHQ/ledger-live/commit/fc4f83e26d9f00b7c518f28157e8d9da55ce3685), [`dd1d17f`](https://github.com/LedgerHQ/ledger-live/commit/dd1d17fd3ce7ed42558204b2f93707fb9b1599de), [`26b3a5d`](https://github.com/LedgerHQ/ledger-live/commit/26b3a5d7d6e11efc226403707d683f3d0098a1c1), [`5848f9e`](https://github.com/LedgerHQ/ledger-live/commit/5848f9e247f169eb7a4aff322253937214b9efdd), [`a8138f9`](https://github.com/LedgerHQ/ledger-live/commit/a8138f9ec0cff714d9745012eb91a09713ffbbd2), [`ebb45be`](https://github.com/LedgerHQ/ledger-live/commit/ebb45be56c6b1fdb3c36a8c20a16b41600baa264), [`53da330`](https://github.com/LedgerHQ/ledger-live/commit/53da3301aaceeb16e6b1f96b1ea44428fbeb4483), [`abb1bbb`](https://github.com/LedgerHQ/ledger-live/commit/abb1bbb09c52a3d08577ba622c6cb0f44aab36c1)]:
  - @ledgerhq/coin-framework@0.12.0-next.0
  - @ledgerhq/cryptoassets@12.1.0-next.0
  - @ledgerhq/errors@6.16.4-next.0
  - @ledgerhq/devices@8.3.0-next.0
  - @ledgerhq/domain-service@1.1.20-next.0
  - @ledgerhq/evm-tools@1.0.18-next.0
  - @ledgerhq/live-network@1.2.1-next.0

## 1.0.0

### Major Changes

- [#6195](https://github.com/LedgerHQ/ledger-live/pull/6195) [`dfac39b`](https://github.com/LedgerHQ/ledger-live/commit/dfac39b2086f0475d1bc8065032bfe27cbf424f6) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Deprecating Arbitrum goerli & Base goerli

### Minor Changes

- [#6179](https://github.com/LedgerHQ/ledger-live/pull/6179) [`25fe5c4`](https://github.com/LedgerHQ/ledger-live/commit/25fe5c48d44d3d1b11e35b81bb4bf31d30fa1268) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Update `DEFAULT_NONCE` (-1) behaviour when converting a Ledger Live transaction to an `ethers` transaction, because using an invalid nonce (like a negative value here) will make `ethers` throw with some of its methods, like `serializeTransaction`

- [#6196](https://github.com/LedgerHQ/ledger-live/pull/6196) [`255476b`](https://github.com/LedgerHQ/ledger-live/commit/255476bd65b15971eb523807fe9795c84882f198) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add suppport of `blacklistedTokenIds` to coin-evm synchronization

- [#6195](https://github.com/LedgerHQ/ledger-live/pull/6195) [`dfac39b`](https://github.com/LedgerHQ/ledger-live/commit/dfac39b2086f0475d1bc8065032bfe27cbf424f6) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add support for Base Sepolia & Arbitrum Sepolia

### Patch Changes

- [#6041](https://github.com/LedgerHQ/ledger-live/pull/6041) [`9c83695`](https://github.com/LedgerHQ/ledger-live/commit/9c8369580b91d82021d4ec28ad7a49dc4ba42e4f) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Remove unnecessary logs

- [#5682](https://github.com/LedgerHQ/ledger-live/pull/5682) [`4744c31`](https://github.com/LedgerHQ/ledger-live/commit/4744c3136021f1f47ad1617f2c84f47ac0647370) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Make `hw-app-eth` a devDep by relying on `clearSignTransaction` instead of importing the `ledgerService`

- [#5682](https://github.com/LedgerHQ/ledger-live/pull/5682) [`4744c31`](https://github.com/LedgerHQ/ledger-live/commit/4744c3136021f1f47ad1617f2c84f47ac0647370) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add documentation

- [#5682](https://github.com/LedgerHQ/ledger-live/pull/5682) [`4744c31`](https://github.com/LedgerHQ/ledger-live/commit/4744c3136021f1f47ad1617f2c84f47ac0647370) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Move clear signed selectors to evm-tools lib

- [#5682](https://github.com/LedgerHQ/ledger-live/pull/5682) [`4744c31`](https://github.com/LedgerHQ/ledger-live/commit/4744c3136021f1f47ad1617f2c84f47ac0647370) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Update `NotEnoughBalance` error for token transactions

- Updated dependencies [[`4744c31`](https://github.com/LedgerHQ/ledger-live/commit/4744c3136021f1f47ad1617f2c84f47ac0647370), [`0dd1546`](https://github.com/LedgerHQ/ledger-live/commit/0dd15467070cbf7fcbb9d9055a4535f6a25b2ad0), [`f456d69`](https://github.com/LedgerHQ/ledger-live/commit/f456d69a2f64b6a217d3c1d9c6a531f31c2817a8), [`4715e4c`](https://github.com/LedgerHQ/ledger-live/commit/4715e4c411fa2396330ebcb810aeb6bfc9892e88), [`9c83695`](https://github.com/LedgerHQ/ledger-live/commit/9c8369580b91d82021d4ec28ad7a49dc4ba42e4f), [`74ef384`](https://github.com/LedgerHQ/ledger-live/commit/74ef3840c17181fa779035f190f829e9537e1539), [`2fd465e`](https://github.com/LedgerHQ/ledger-live/commit/2fd465ee730b11594d231503cfb940b984fa2f5a), [`dfac39b`](https://github.com/LedgerHQ/ledger-live/commit/dfac39b2086f0475d1bc8065032bfe27cbf424f6), [`7fb3eb2`](https://github.com/LedgerHQ/ledger-live/commit/7fb3eb266acdca143c94d2fce74329809ebfbb79), [`4744c31`](https://github.com/LedgerHQ/ledger-live/commit/4744c3136021f1f47ad1617f2c84f47ac0647370), [`bd4ee6c`](https://github.com/LedgerHQ/ledger-live/commit/bd4ee6c938c27102c2d0529c2aab07ac000f7424), [`dfac39b`](https://github.com/LedgerHQ/ledger-live/commit/dfac39b2086f0475d1bc8065032bfe27cbf424f6), [`2e5185b`](https://github.com/LedgerHQ/ledger-live/commit/2e5185b3dba497c956272068128e49db72e8af2a)]:
  - @ledgerhq/live-env@2.0.0
  - @ledgerhq/errors@6.16.3
  - @ledgerhq/cryptoassets@12.0.0
  - @ledgerhq/coin-framework@0.11.3
  - @ledgerhq/evm-tools@1.0.17
  - @ledgerhq/live-network@1.2.0
  - @ledgerhq/domain-service@1.1.19
  - @ledgerhq/devices@8.2.2

## 1.0.0-next.1

### Patch Changes

- [#6375](https://github.com/LedgerHQ/ledger-live/pull/6375) [`09128f3`](https://github.com/LedgerHQ/ledger-live/commit/09128f3fd41285199122115324964d83befe9237) Thanks [@CremaFR](https://github.com/CremaFR)! - Allow additional fees when using maxButton

## 1.0.0-next.0

### Major Changes

- [#6195](https://github.com/LedgerHQ/ledger-live/pull/6195) [`dfac39b`](https://github.com/LedgerHQ/ledger-live/commit/dfac39b2086f0475d1bc8065032bfe27cbf424f6) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Deprecating Arbitrum goerli & Base goerli

### Minor Changes

- [#6179](https://github.com/LedgerHQ/ledger-live/pull/6179) [`25fe5c4`](https://github.com/LedgerHQ/ledger-live/commit/25fe5c48d44d3d1b11e35b81bb4bf31d30fa1268) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Update `DEFAULT_NONCE` (-1) behaviour when converting a Ledger Live transaction to an `ethers` transaction, because using an invalid nonce (like a negative value here) will make `ethers` throw with some of its methods, like `serializeTransaction`

- [#6196](https://github.com/LedgerHQ/ledger-live/pull/6196) [`255476b`](https://github.com/LedgerHQ/ledger-live/commit/255476bd65b15971eb523807fe9795c84882f198) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add suppport of `blacklistedTokenIds` to coin-evm synchronization

- [#6195](https://github.com/LedgerHQ/ledger-live/pull/6195) [`dfac39b`](https://github.com/LedgerHQ/ledger-live/commit/dfac39b2086f0475d1bc8065032bfe27cbf424f6) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add support for Base Sepolia & Arbitrum Sepolia

### Patch Changes

- [#6041](https://github.com/LedgerHQ/ledger-live/pull/6041) [`9c83695`](https://github.com/LedgerHQ/ledger-live/commit/9c8369580b91d82021d4ec28ad7a49dc4ba42e4f) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Remove unnecessary logs

- [#5682](https://github.com/LedgerHQ/ledger-live/pull/5682) [`4744c31`](https://github.com/LedgerHQ/ledger-live/commit/4744c3136021f1f47ad1617f2c84f47ac0647370) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Make `hw-app-eth` a devDep by relying on `clearSignTransaction` instead of importing the `ledgerService`

- [#5682](https://github.com/LedgerHQ/ledger-live/pull/5682) [`4744c31`](https://github.com/LedgerHQ/ledger-live/commit/4744c3136021f1f47ad1617f2c84f47ac0647370) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add documentation

- [#5682](https://github.com/LedgerHQ/ledger-live/pull/5682) [`4744c31`](https://github.com/LedgerHQ/ledger-live/commit/4744c3136021f1f47ad1617f2c84f47ac0647370) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Move clear signed selectors to evm-tools lib

- [#5682](https://github.com/LedgerHQ/ledger-live/pull/5682) [`4744c31`](https://github.com/LedgerHQ/ledger-live/commit/4744c3136021f1f47ad1617f2c84f47ac0647370) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Update `NotEnoughBalance` error for token transactions

- Updated dependencies [[`4744c31`](https://github.com/LedgerHQ/ledger-live/commit/4744c3136021f1f47ad1617f2c84f47ac0647370), [`0dd1546`](https://github.com/LedgerHQ/ledger-live/commit/0dd15467070cbf7fcbb9d9055a4535f6a25b2ad0), [`f456d69`](https://github.com/LedgerHQ/ledger-live/commit/f456d69a2f64b6a217d3c1d9c6a531f31c2817a8), [`4715e4c`](https://github.com/LedgerHQ/ledger-live/commit/4715e4c411fa2396330ebcb810aeb6bfc9892e88), [`9c83695`](https://github.com/LedgerHQ/ledger-live/commit/9c8369580b91d82021d4ec28ad7a49dc4ba42e4f), [`74ef384`](https://github.com/LedgerHQ/ledger-live/commit/74ef3840c17181fa779035f190f829e9537e1539), [`2fd465e`](https://github.com/LedgerHQ/ledger-live/commit/2fd465ee730b11594d231503cfb940b984fa2f5a), [`dfac39b`](https://github.com/LedgerHQ/ledger-live/commit/dfac39b2086f0475d1bc8065032bfe27cbf424f6), [`7fb3eb2`](https://github.com/LedgerHQ/ledger-live/commit/7fb3eb266acdca143c94d2fce74329809ebfbb79), [`4744c31`](https://github.com/LedgerHQ/ledger-live/commit/4744c3136021f1f47ad1617f2c84f47ac0647370), [`bd4ee6c`](https://github.com/LedgerHQ/ledger-live/commit/bd4ee6c938c27102c2d0529c2aab07ac000f7424), [`dfac39b`](https://github.com/LedgerHQ/ledger-live/commit/dfac39b2086f0475d1bc8065032bfe27cbf424f6), [`2e5185b`](https://github.com/LedgerHQ/ledger-live/commit/2e5185b3dba497c956272068128e49db72e8af2a)]:
  - @ledgerhq/live-env@2.0.0-next.0
  - @ledgerhq/errors@6.16.3-next.0
  - @ledgerhq/cryptoassets@12.0.0-next.0
  - @ledgerhq/coin-framework@0.11.3-next.0
  - @ledgerhq/evm-tools@1.0.17-next.0
  - @ledgerhq/live-network@1.2.0-next.0
  - @ledgerhq/domain-service@1.1.19-next.0
  - @ledgerhq/devices@8.2.2-next.0

## 0.12.3

### Patch Changes

- Updated dependencies [[`884cfd6`](https://github.com/LedgerHQ/ledger-live/commit/884cfd64a1440d393fb983dfe361be9c78f3b81c), [`3e28615`](https://github.com/LedgerHQ/ledger-live/commit/3e28615a8d5edbec3eff1e93207bf0e9d017666a)]:
  - @ledgerhq/cryptoassets@11.4.1
  - @ledgerhq/live-env@1.0.1
  - @ledgerhq/coin-framework@0.11.2
  - @ledgerhq/evm-tools@1.0.16
  - @ledgerhq/live-network@1.1.13

## 0.12.3-hotfix.1

### Patch Changes

- Updated dependencies [[`884cfd6`](https://github.com/LedgerHQ/ledger-live/commit/884cfd64a1440d393fb983dfe361be9c78f3b81c)]:
  - @ledgerhq/cryptoassets@11.4.1-hotfix.0
  - @ledgerhq/coin-framework@0.11.2-hotfix.1
  - @ledgerhq/evm-tools@1.0.16-hotfix.1

## 0.12.3-hotfix.0

### Patch Changes

- Updated dependencies [[`3e28615`](https://github.com/LedgerHQ/ledger-live/commit/3e28615a8d5edbec3eff1e93207bf0e9d017666a)]:
  - @ledgerhq/live-env@1.0.1-hotfix.0
  - @ledgerhq/coin-framework@0.11.2-hotfix.0
  - @ledgerhq/evm-tools@1.0.16-hotfix.0
  - @ledgerhq/live-network@1.1.13-hotfix.0

## 0.12.2

### Patch Changes

- [#6165](https://github.com/LedgerHQ/ledger-live/pull/6165) [`8d99b81`](https://github.com/LedgerHQ/ledger-live/commit/8d99b81feaf5e8d46e0c26f34bc70b709a7e3c14) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Remove unnecessary logs

- [#6165](https://github.com/LedgerHQ/ledger-live/pull/6165) [`c18a0cf`](https://github.com/LedgerHQ/ledger-live/commit/c18a0cfdce5d1e44faf8d8bd5659ebdae38533fa) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Make `hw-app-eth` a devDep by relying on `clearSignTransaction` instead of importing the `ledgerService`

- [#6165](https://github.com/LedgerHQ/ledger-live/pull/6165) [`c18a0cf`](https://github.com/LedgerHQ/ledger-live/commit/c18a0cfdce5d1e44faf8d8bd5659ebdae38533fa) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Add documentation

- [#6165](https://github.com/LedgerHQ/ledger-live/pull/6165) [`c18a0cf`](https://github.com/LedgerHQ/ledger-live/commit/c18a0cfdce5d1e44faf8d8bd5659ebdae38533fa) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Move clear signed selectors to evm-tools lib

- [#6165](https://github.com/LedgerHQ/ledger-live/pull/6165) [`c18a0cf`](https://github.com/LedgerHQ/ledger-live/commit/c18a0cfdce5d1e44faf8d8bd5659ebdae38533fa) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Update `NotEnoughBalance` error for token transactions

- Updated dependencies [[`c18a0cf`](https://github.com/LedgerHQ/ledger-live/commit/c18a0cfdce5d1e44faf8d8bd5659ebdae38533fa), [`ee88785`](https://github.com/LedgerHQ/ledger-live/commit/ee8878515671241ce1037362af5e8f7799b3673a), [`8d99b81`](https://github.com/LedgerHQ/ledger-live/commit/8d99b81feaf5e8d46e0c26f34bc70b709a7e3c14), [`628fa73`](https://github.com/LedgerHQ/ledger-live/commit/628fa732866a6018287ca7bc3d463acb3f5cd6b9), [`43eea9e`](https://github.com/LedgerHQ/ledger-live/commit/43eea9e8076f2c9d5aeb0f8a3b0738e97b3152c8), [`c18a0cf`](https://github.com/LedgerHQ/ledger-live/commit/c18a0cfdce5d1e44faf8d8bd5659ebdae38533fa), [`b444092`](https://github.com/LedgerHQ/ledger-live/commit/b444092040af249ae45e5ee18d75be420f9f26f8)]:
  - @ledgerhq/live-env@1.0.0
  - @ledgerhq/errors@6.16.2
  - @ledgerhq/coin-framework@0.11.1
  - @ledgerhq/evm-tools@1.0.15
  - @ledgerhq/domain-service@1.1.18
  - @ledgerhq/live-network@1.1.12
  - @ledgerhq/devices@8.2.1

## 0.12.2-next.0

### Patch Changes

- [#6041](https://github.com/LedgerHQ/ledger-live/pull/6041) [`9c83695`](https://github.com/LedgerHQ/ledger-live/commit/9c8369580b91d82021d4ec28ad7a49dc4ba42e4f) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Remove unnecessary logs

- [#5682](https://github.com/LedgerHQ/ledger-live/pull/5682) [`4744c31`](https://github.com/LedgerHQ/ledger-live/commit/4744c3136021f1f47ad1617f2c84f47ac0647370) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Make `hw-app-eth` a devDep by relying on `clearSignTransaction` instead of importing the `ledgerService`

- [#5682](https://github.com/LedgerHQ/ledger-live/pull/5682) [`4744c31`](https://github.com/LedgerHQ/ledger-live/commit/4744c3136021f1f47ad1617f2c84f47ac0647370) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add documentation

- [#5682](https://github.com/LedgerHQ/ledger-live/pull/5682) [`4744c31`](https://github.com/LedgerHQ/ledger-live/commit/4744c3136021f1f47ad1617f2c84f47ac0647370) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Move clear signed selectors to evm-tools lib

- [#5682](https://github.com/LedgerHQ/ledger-live/pull/5682) [`4744c31`](https://github.com/LedgerHQ/ledger-live/commit/4744c3136021f1f47ad1617f2c84f47ac0647370) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Update `NotEnoughBalance` error for token transactions

- Updated dependencies [[`4744c31`](https://github.com/LedgerHQ/ledger-live/commit/4744c3136021f1f47ad1617f2c84f47ac0647370), [`f456d69`](https://github.com/LedgerHQ/ledger-live/commit/f456d69a2f64b6a217d3c1d9c6a531f31c2817a8), [`9c83695`](https://github.com/LedgerHQ/ledger-live/commit/9c8369580b91d82021d4ec28ad7a49dc4ba42e4f), [`74ef384`](https://github.com/LedgerHQ/ledger-live/commit/74ef3840c17181fa779035f190f829e9537e1539), [`2fd465e`](https://github.com/LedgerHQ/ledger-live/commit/2fd465ee730b11594d231503cfb940b984fa2f5a), [`4744c31`](https://github.com/LedgerHQ/ledger-live/commit/4744c3136021f1f47ad1617f2c84f47ac0647370), [`bd4ee6c`](https://github.com/LedgerHQ/ledger-live/commit/bd4ee6c938c27102c2d0529c2aab07ac000f7424)]:
  - @ledgerhq/live-env@1.0.0-next.0
  - @ledgerhq/errors@6.16.2-next.0
  - @ledgerhq/coin-framework@0.11.1-next.0
  - @ledgerhq/evm-tools@1.0.15-next.0
  - @ledgerhq/domain-service@1.1.18-next.0
  - @ledgerhq/live-network@1.1.12-next.0
  - @ledgerhq/devices@8.2.1-next.0

## 0.12.1

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-app-eth@6.35.4
  - @ledgerhq/coin-framework@0.11.0

## 0.12.1-next.0

### Patch Changes

- Updated dependencies []:
  - @ledgerhq/hw-app-eth@6.35.4-next.0
  - @ledgerhq/coin-framework@0.11.0

## 0.12.0

### Minor Changes

- [#5722](https://github.com/LedgerHQ/ledger-live/pull/5722) [`2358e87`](https://github.com/LedgerHQ/ledger-live/commit/2358e8748d9ae9398cfc05a0ec20a6b191fc7324) Thanks [@chabroA](https://github.com/chabroA)! - Add Ethereum Sepolia and Holesky

- [#5744](https://github.com/LedgerHQ/ledger-live/pull/5744) [`ed23f46`](https://github.com/LedgerHQ/ledger-live/commit/ed23f4680d4ed1020bf34ac05b064ff659a282f5) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add support for internal transactions in transactions' history

### Patch Changes

- [#5743](https://github.com/LedgerHQ/ledger-live/pull/5743) [`e494a2b`](https://github.com/LedgerHQ/ledger-live/commit/e494a2b984fb0406fe9225bb4eccde3d9585efe1) Thanks [@chabroA](https://github.com/chabroA)! - remove unreachable statement

- [#5780](https://github.com/LedgerHQ/ledger-live/pull/5780) [`2b627ae`](https://github.com/LedgerHQ/ledger-live/commit/2b627aebddef859b9cb62467353e7d868bfbc4f9) Thanks [@mle-gall](https://github.com/mle-gall)! - Parent Account Error on gas fees LLD

- [#5780](https://github.com/LedgerHQ/ledger-live/pull/5780) [`17d1f86`](https://github.com/LedgerHQ/ledger-live/commit/17d1f86022f0122ac85ca6489eb4698c7d9045fb) Thanks [@mle-gall](https://github.com/mle-gall)! - New LLM gas fees parent account error

- Updated dependencies [[`fc2cf04`](https://github.com/LedgerHQ/ledger-live/commit/fc2cf04c8d3cd55503ea19aeb21fd12ee55046f6), [`dd5d930`](https://github.com/LedgerHQ/ledger-live/commit/dd5d9308e0e3ef8ca78f879c15bc07313ef3c8c4), [`a4a72da`](https://github.com/LedgerHQ/ledger-live/commit/a4a72da33ddfefd5ba69ac4d9ecb33d7775583f1), [`acc0605`](https://github.com/LedgerHQ/ledger-live/commit/acc06050b622f8d4265be9f962c6c83b1fbaefd5), [`2358e87`](https://github.com/LedgerHQ/ledger-live/commit/2358e8748d9ae9398cfc05a0ec20a6b191fc7324), [`65772fb`](https://github.com/LedgerHQ/ledger-live/commit/65772fbcc1e6887d60ca585147123d356914ba56), [`69bbdce`](https://github.com/LedgerHQ/ledger-live/commit/69bbdce5c88d69248cbddb94ac4627334c1df626), [`b74faea`](https://github.com/LedgerHQ/ledger-live/commit/b74faea05f856860a253c5b94a9333810a3446ca), [`0375de1`](https://github.com/LedgerHQ/ledger-live/commit/0375de19ca909b0b013992c114b0fa2ead2a08f3)]:
  - @ledgerhq/cryptoassets@11.4.0
  - @ledgerhq/live-network@1.1.11
  - @ledgerhq/types-live@6.44.0
  - @ledgerhq/coin-framework@0.11.0
  - @ledgerhq/types-cryptoassets@7.9.0
  - @ledgerhq/live-env@0.9.0
  - @ledgerhq/evm-tools@1.0.14
  - @ledgerhq/hw-app-eth@6.35.3
  - @ledgerhq/domain-service@1.1.17

## 0.12.0-next.0

### Minor Changes

- [#5722](https://github.com/LedgerHQ/ledger-live/pull/5722) [`2358e87`](https://github.com/LedgerHQ/ledger-live/commit/2358e8748d9ae9398cfc05a0ec20a6b191fc7324) Thanks [@chabroA](https://github.com/chabroA)! - Add Ethereum Sepolia and Holesky

- [#5744](https://github.com/LedgerHQ/ledger-live/pull/5744) [`ed23f46`](https://github.com/LedgerHQ/ledger-live/commit/ed23f4680d4ed1020bf34ac05b064ff659a282f5) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add support for internal transactions in transactions' history

### Patch Changes

- [#5743](https://github.com/LedgerHQ/ledger-live/pull/5743) [`e494a2b`](https://github.com/LedgerHQ/ledger-live/commit/e494a2b984fb0406fe9225bb4eccde3d9585efe1) Thanks [@chabroA](https://github.com/chabroA)! - remove unreachable statement

- [#5780](https://github.com/LedgerHQ/ledger-live/pull/5780) [`2b627ae`](https://github.com/LedgerHQ/ledger-live/commit/2b627aebddef859b9cb62467353e7d868bfbc4f9) Thanks [@mle-gall](https://github.com/mle-gall)! - Parent Account Error on gas fees LLD

- [#5780](https://github.com/LedgerHQ/ledger-live/pull/5780) [`17d1f86`](https://github.com/LedgerHQ/ledger-live/commit/17d1f86022f0122ac85ca6489eb4698c7d9045fb) Thanks [@mle-gall](https://github.com/mle-gall)! - New LLM gas fees parent account error

- Updated dependencies [[`fc2cf04`](https://github.com/LedgerHQ/ledger-live/commit/fc2cf04c8d3cd55503ea19aeb21fd12ee55046f6), [`dd5d930`](https://github.com/LedgerHQ/ledger-live/commit/dd5d9308e0e3ef8ca78f879c15bc07313ef3c8c4), [`a4a72da`](https://github.com/LedgerHQ/ledger-live/commit/a4a72da33ddfefd5ba69ac4d9ecb33d7775583f1), [`acc0605`](https://github.com/LedgerHQ/ledger-live/commit/acc06050b622f8d4265be9f962c6c83b1fbaefd5), [`2358e87`](https://github.com/LedgerHQ/ledger-live/commit/2358e8748d9ae9398cfc05a0ec20a6b191fc7324), [`65772fb`](https://github.com/LedgerHQ/ledger-live/commit/65772fbcc1e6887d60ca585147123d356914ba56), [`69bbdce`](https://github.com/LedgerHQ/ledger-live/commit/69bbdce5c88d69248cbddb94ac4627334c1df626), [`b74faea`](https://github.com/LedgerHQ/ledger-live/commit/b74faea05f856860a253c5b94a9333810a3446ca), [`0375de1`](https://github.com/LedgerHQ/ledger-live/commit/0375de19ca909b0b013992c114b0fa2ead2a08f3)]:
  - @ledgerhq/cryptoassets@11.4.0-next.0
  - @ledgerhq/live-network@1.1.11-next.0
  - @ledgerhq/types-live@6.44.0-next.0
  - @ledgerhq/coin-framework@0.11.0-next.0
  - @ledgerhq/types-cryptoassets@7.9.0-next.0
  - @ledgerhq/live-env@0.9.0-next.0
  - @ledgerhq/evm-tools@1.0.14-next.0
  - @ledgerhq/hw-app-eth@6.35.3-next.0
  - @ledgerhq/domain-service@1.1.17-next.0

## 0.11.2

### Patch Changes

- Updated dependencies [[`d49f444`](https://github.com/LedgerHQ/ledger-live/commit/d49f44417fd175affe71da589c0ca380e88fbb35)]:
  - @ledgerhq/cryptoassets@11.3.1
  - @ledgerhq/coin-framework@0.10.1
  - @ledgerhq/evm-tools@1.0.13
  - @ledgerhq/hw-app-eth@6.35.2

## 0.11.2-next.0

### Patch Changes

- Updated dependencies [[`d49f444`](https://github.com/LedgerHQ/ledger-live/commit/d49f44417fd175affe71da589c0ca380e88fbb35)]:
  - @ledgerhq/cryptoassets@11.3.1-next.0
  - @ledgerhq/coin-framework@0.10.1-next.0
  - @ledgerhq/evm-tools@1.0.13-next.0
  - @ledgerhq/hw-app-eth@6.35.2-next.0

## 0.11.1

### Patch Changes

- [#5709](https://github.com/LedgerHQ/ledger-live/pull/5709) [`0fb6cb3`](https://github.com/LedgerHQ/ledger-live/commit/0fb6cb3cb0085b71dfadfd3a92602511cb7e9928) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Fix improper filtering for logging of invalid dates

- [#5546](https://github.com/LedgerHQ/ledger-live/pull/5546) [`6dc1007`](https://github.com/LedgerHQ/ledger-live/commit/6dc100774010ad674001d04b531239f5adfdce7b) Thanks [@lvndry](https://github.com/lvndry)! - safeEncode senders and recipient addresses

- [#5524](https://github.com/LedgerHQ/ledger-live/pull/5524) [`be22d72`](https://github.com/LedgerHQ/ledger-live/commit/be22d724cf5499fe4958bfb3b5f763ffaf0d0446) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Addings logs to detect date issue resulting with a RangeError

- Updated dependencies [[`1cb527b`](https://github.com/LedgerHQ/ledger-live/commit/1cb527b9a0b03f23a921a446c64f71ab5c9e9013), [`b7d58b4`](https://github.com/LedgerHQ/ledger-live/commit/b7d58b4cf3aa041b7b794d9af6f0b89bbc0df633), [`44ee889`](https://github.com/LedgerHQ/ledger-live/commit/44ee88944571c73afb105349f5f28b82e8be262d), [`13d9cbe`](https://github.com/LedgerHQ/ledger-live/commit/13d9cbe9a4afbf3ccd532a33e4ada3685d9d646a), [`618307f`](https://github.com/LedgerHQ/ledger-live/commit/618307f92899af07f4c8ad97c67df483492e3d9d), [`0f5292a`](https://github.com/LedgerHQ/ledger-live/commit/0f5292af8feaa517f36ec35155d813b17c4f66e9), [`52a3732`](https://github.com/LedgerHQ/ledger-live/commit/52a373273dee3b2cb5a3e8d2d4b05f90616d71a2), [`4d1aade`](https://github.com/LedgerHQ/ledger-live/commit/4d1aade53cd33f8e7548ce340f54fbb834bdcdcb), [`eb5ac4d`](https://github.com/LedgerHQ/ledger-live/commit/eb5ac4dca430654f5f86854025fddddab4261a29), [`c8172ab`](https://github.com/LedgerHQ/ledger-live/commit/c8172abc5c052a753b93be8b6c9cfd88ce0dd64a), [`5d03bf5`](https://github.com/LedgerHQ/ledger-live/commit/5d03bf514fcf7aea91dc8beae0cd503ed6b4ab3c), [`9d35080`](https://github.com/LedgerHQ/ledger-live/commit/9d35080944a6a63c78f54a545734f4cf3cbded63), [`3adea7a`](https://github.com/LedgerHQ/ledger-live/commit/3adea7a7ad66080b5e6e4407071a976644158d04), [`2edfa53`](https://github.com/LedgerHQ/ledger-live/commit/2edfa533bccafbfd8a61aea0f5422c0db79825ea), [`be22d72`](https://github.com/LedgerHQ/ledger-live/commit/be22d724cf5499fe4958bfb3b5f763ffaf0d0446), [`52a3732`](https://github.com/LedgerHQ/ledger-live/commit/52a373273dee3b2cb5a3e8d2d4b05f90616d71a2), [`6dea540`](https://github.com/LedgerHQ/ledger-live/commit/6dea54057f67162a1f556661afae16e0422f7ac3), [`e70e345`](https://github.com/LedgerHQ/ledger-live/commit/e70e345bd21d4f5c82fbedfd4447aec0e866be5a)]:
  - @ledgerhq/types-live@6.43.1
  - @ledgerhq/cryptoassets@11.3.0
  - @ledgerhq/coin-framework@0.10.0
  - @ledgerhq/live-env@0.8.0
  - @ledgerhq/errors@6.16.1
  - @ledgerhq/devices@8.2.0
  - @ledgerhq/domain-service@1.1.16
  - @ledgerhq/evm-tools@1.0.12
  - @ledgerhq/hw-app-eth@6.35.1
  - @ledgerhq/live-network@1.1.10

## 0.11.1-next.1

### Patch Changes

- [#5709](https://github.com/LedgerHQ/ledger-live/pull/5709) [`0fb6cb3`](https://github.com/LedgerHQ/ledger-live/commit/0fb6cb3cb0085b71dfadfd3a92602511cb7e9928) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Fix improper filtering for logging of invalid dates

## 0.11.1-next.0

### Patch Changes

- [#5546](https://github.com/LedgerHQ/ledger-live/pull/5546) [`6dc1007`](https://github.com/LedgerHQ/ledger-live/commit/6dc100774010ad674001d04b531239f5adfdce7b) Thanks [@lvndry](https://github.com/lvndry)! - safeEncode senders and recipient addresses

- [#5524](https://github.com/LedgerHQ/ledger-live/pull/5524) [`be22d72`](https://github.com/LedgerHQ/ledger-live/commit/be22d724cf5499fe4958bfb3b5f763ffaf0d0446) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Addings logs to detect date issue resulting with a RangeError

- Updated dependencies [[`1cb527b`](https://github.com/LedgerHQ/ledger-live/commit/1cb527b9a0b03f23a921a446c64f71ab5c9e9013), [`b7d58b4`](https://github.com/LedgerHQ/ledger-live/commit/b7d58b4cf3aa041b7b794d9af6f0b89bbc0df633), [`44ee889`](https://github.com/LedgerHQ/ledger-live/commit/44ee88944571c73afb105349f5f28b82e8be262d), [`13d9cbe`](https://github.com/LedgerHQ/ledger-live/commit/13d9cbe9a4afbf3ccd532a33e4ada3685d9d646a), [`618307f`](https://github.com/LedgerHQ/ledger-live/commit/618307f92899af07f4c8ad97c67df483492e3d9d), [`0f5292a`](https://github.com/LedgerHQ/ledger-live/commit/0f5292af8feaa517f36ec35155d813b17c4f66e9), [`52a3732`](https://github.com/LedgerHQ/ledger-live/commit/52a373273dee3b2cb5a3e8d2d4b05f90616d71a2), [`4d1aade`](https://github.com/LedgerHQ/ledger-live/commit/4d1aade53cd33f8e7548ce340f54fbb834bdcdcb), [`eb5ac4d`](https://github.com/LedgerHQ/ledger-live/commit/eb5ac4dca430654f5f86854025fddddab4261a29), [`c8172ab`](https://github.com/LedgerHQ/ledger-live/commit/c8172abc5c052a753b93be8b6c9cfd88ce0dd64a), [`5d03bf5`](https://github.com/LedgerHQ/ledger-live/commit/5d03bf514fcf7aea91dc8beae0cd503ed6b4ab3c), [`9d35080`](https://github.com/LedgerHQ/ledger-live/commit/9d35080944a6a63c78f54a545734f4cf3cbded63), [`3adea7a`](https://github.com/LedgerHQ/ledger-live/commit/3adea7a7ad66080b5e6e4407071a976644158d04), [`2edfa53`](https://github.com/LedgerHQ/ledger-live/commit/2edfa533bccafbfd8a61aea0f5422c0db79825ea), [`be22d72`](https://github.com/LedgerHQ/ledger-live/commit/be22d724cf5499fe4958bfb3b5f763ffaf0d0446), [`52a3732`](https://github.com/LedgerHQ/ledger-live/commit/52a373273dee3b2cb5a3e8d2d4b05f90616d71a2), [`6dea540`](https://github.com/LedgerHQ/ledger-live/commit/6dea54057f67162a1f556661afae16e0422f7ac3), [`e70e345`](https://github.com/LedgerHQ/ledger-live/commit/e70e345bd21d4f5c82fbedfd4447aec0e866be5a)]:
  - @ledgerhq/types-live@6.43.1-next.0
  - @ledgerhq/cryptoassets@11.3.0-next.0
  - @ledgerhq/coin-framework@0.10.0-next.0
  - @ledgerhq/live-env@0.8.0-next.0
  - @ledgerhq/errors@6.16.1-next.0
  - @ledgerhq/devices@8.2.0-next.0
  - @ledgerhq/domain-service@1.1.16-next.0
  - @ledgerhq/evm-tools@1.0.12-next.0
  - @ledgerhq/hw-app-eth@6.35.1-next.0
  - @ledgerhq/live-network@1.1.10-next.0

## 0.11.0

### Minor Changes

- [#4886](https://github.com/LedgerHQ/ledger-live/pull/4886) [`771c9d3c1d`](https://github.com/LedgerHQ/ledger-live/commit/771c9d3c1d138ddd68da2e4f9738e2c41ecaf81b) Thanks [@chabroA](https://github.com/chabroA)! - Add speedup / cancel tx feature for evm

### Patch Changes

- [#5364](https://github.com/LedgerHQ/ledger-live/pull/5364) [`743e1ede3e`](https://github.com/LedgerHQ/ledger-live/commit/743e1ede3eebf806e1e22c8627191b419870a476) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Updating the hashing algorithm from SHA256 to MurmurHashV3 for the `getSyncHash` method in order to drastically increase performances on a React Native environment.

- [#4886](https://github.com/LedgerHQ/ledger-live/pull/4886) [`771c9d3c1d`](https://github.com/LedgerHQ/ledger-live/commit/771c9d3c1d138ddd68da2e4f9738e2c41ecaf81b) Thanks [@chabroA](https://github.com/chabroA)! - Fix wrong usage of explorer block endpoint in coin evm

- [#4987](https://github.com/LedgerHQ/ledger-live/pull/4987) [`e63205b850`](https://github.com/LedgerHQ/ledger-live/commit/e63205b85071538ed2431157a12818d7a8f0ffa9) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - add 10s timeout to estimate gas

- Updated dependencies [[`48487abd29`](https://github.com/LedgerHQ/ledger-live/commit/48487abd297e41629c6725bc0ac9d69bfeaa74d3), [`08dde174fd`](https://github.com/LedgerHQ/ledger-live/commit/08dde174fdeaadbce85dcd914383839f788f21dd), [`771c9d3c1d`](https://github.com/LedgerHQ/ledger-live/commit/771c9d3c1d138ddd68da2e4f9738e2c41ecaf81b), [`c5981ae341`](https://github.com/LedgerHQ/ledger-live/commit/c5981ae3411abc4c8594adf2efcb52aacddac143), [`317685e696`](https://github.com/LedgerHQ/ledger-live/commit/317685e69678e6fe1f489f0c071e7613d329d389), [`a4299c5d62`](https://github.com/LedgerHQ/ledger-live/commit/a4299c5d629cd56e6e6795adaa14978ae2b90f42), [`b4e7201b0b`](https://github.com/LedgerHQ/ledger-live/commit/b4e7201b0b70d146de7d936ff2c9e9e443164243), [`e63205b850`](https://github.com/LedgerHQ/ledger-live/commit/e63205b85071538ed2431157a12818d7a8f0ffa9), [`5964e30bed`](https://github.com/LedgerHQ/ledger-live/commit/5964e30bed11d64a3b7401c6ab51ffc1ad4c427c), [`4a283060bf`](https://github.com/LedgerHQ/ledger-live/commit/4a283060bf2e837d73c6c1cb5d89f890a4e4b931)]:
  - @ledgerhq/types-live@6.43.0
  - @ledgerhq/types-cryptoassets@7.8.0
  - @ledgerhq/cryptoassets@11.2.0
  - @ledgerhq/errors@6.16.0
  - @ledgerhq/coin-framework@0.9.0
  - @ledgerhq/live-env@0.7.0
  - @ledgerhq/hw-app-eth@6.35.0
  - @ledgerhq/devices@8.1.0
  - @ledgerhq/logs@6.12.0
  - @ledgerhq/domain-service@1.1.15
  - @ledgerhq/evm-tools@1.0.11
  - @ledgerhq/live-network@1.1.9
  - @ledgerhq/live-promise@0.0.3

## 0.11.0-next.1

### Patch Changes

- Updated dependencies [[`4a283060bf`](https://github.com/LedgerHQ/ledger-live/commit/4a283060bf2e837d73c6c1cb5d89f890a4e4b931)]:
  - @ledgerhq/cryptoassets@11.2.0-next.1
  - @ledgerhq/coin-framework@0.9.0-next.1
  - @ledgerhq/evm-tools@1.0.11-next.1
  - @ledgerhq/hw-app-eth@6.35.0-next.1

## 0.11.0-next.0

### Minor Changes

- [#4886](https://github.com/LedgerHQ/ledger-live/pull/4886) [`771c9d3c1d`](https://github.com/LedgerHQ/ledger-live/commit/771c9d3c1d138ddd68da2e4f9738e2c41ecaf81b) Thanks [@chabroA](https://github.com/chabroA)! - Add speedup / cancel tx feature for evm

### Patch Changes

- [#5364](https://github.com/LedgerHQ/ledger-live/pull/5364) [`743e1ede3e`](https://github.com/LedgerHQ/ledger-live/commit/743e1ede3eebf806e1e22c8627191b419870a476) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Updating the hashing algorithm from SHA256 to MurmurHashV3 for the `getSyncHash` method in order to drastically increase performances on a React Native environment.

- [#4886](https://github.com/LedgerHQ/ledger-live/pull/4886) [`771c9d3c1d`](https://github.com/LedgerHQ/ledger-live/commit/771c9d3c1d138ddd68da2e4f9738e2c41ecaf81b) Thanks [@chabroA](https://github.com/chabroA)! - Fix wrong usage of explorer block endpoint in coin evm

- [#4987](https://github.com/LedgerHQ/ledger-live/pull/4987) [`e63205b850`](https://github.com/LedgerHQ/ledger-live/commit/e63205b85071538ed2431157a12818d7a8f0ffa9) Thanks [@kallen-ledger](https://github.com/kallen-ledger)! - add 10s timeout to estimate gas

- Updated dependencies [[`48487abd29`](https://github.com/LedgerHQ/ledger-live/commit/48487abd297e41629c6725bc0ac9d69bfeaa74d3), [`08dde174fd`](https://github.com/LedgerHQ/ledger-live/commit/08dde174fdeaadbce85dcd914383839f788f21dd), [`771c9d3c1d`](https://github.com/LedgerHQ/ledger-live/commit/771c9d3c1d138ddd68da2e4f9738e2c41ecaf81b), [`c5981ae341`](https://github.com/LedgerHQ/ledger-live/commit/c5981ae3411abc4c8594adf2efcb52aacddac143), [`317685e696`](https://github.com/LedgerHQ/ledger-live/commit/317685e69678e6fe1f489f0c071e7613d329d389), [`a4299c5d62`](https://github.com/LedgerHQ/ledger-live/commit/a4299c5d629cd56e6e6795adaa14978ae2b90f42), [`b4e7201b0b`](https://github.com/LedgerHQ/ledger-live/commit/b4e7201b0b70d146de7d936ff2c9e9e443164243), [`e63205b850`](https://github.com/LedgerHQ/ledger-live/commit/e63205b85071538ed2431157a12818d7a8f0ffa9), [`5964e30bed`](https://github.com/LedgerHQ/ledger-live/commit/5964e30bed11d64a3b7401c6ab51ffc1ad4c427c)]:
  - @ledgerhq/types-live@6.43.0-next.0
  - @ledgerhq/types-cryptoassets@7.8.0-next.0
  - @ledgerhq/cryptoassets@11.2.0-next.0
  - @ledgerhq/errors@6.16.0-next.0
  - @ledgerhq/coin-framework@0.9.0-next.0
  - @ledgerhq/live-env@0.7.0-next.0
  - @ledgerhq/hw-app-eth@6.35.0-next.0
  - @ledgerhq/devices@8.1.0-next.0
  - @ledgerhq/logs@6.12.0-next.0
  - @ledgerhq/domain-service@1.1.15-next.0
  - @ledgerhq/evm-tools@1.0.11-next.0
  - @ledgerhq/live-network@1.1.9-next.0
  - @ledgerhq/live-promise@0.0.3-next.0

## 0.10.0

### Minor Changes

- [#5173](https://github.com/LedgerHQ/ledger-live/pull/5173) [`17ba334e47`](https://github.com/LedgerHQ/ledger-live/commit/17ba334e47b901e34fbb083396aa3f9952e5233e) Thanks [@chabroA](https://github.com/chabroA)! - Add neon_evm support

### Patch Changes

- [#4856](https://github.com/LedgerHQ/ledger-live/pull/4856) [`173d7d6d22`](https://github.com/LedgerHQ/ledger-live/commit/173d7d6d224bcf1cecf364062b6571f52792e371) Thanks [@chabroA](https://github.com/chabroA)! - return error when tx from tokenAccount has no amount

- [#5088](https://github.com/LedgerHQ/ledger-live/pull/5088) [`2fc6d1efa0`](https://github.com/LedgerHQ/ledger-live/commit/2fc6d1efa0233a90b0fa273782cff1dd6344d52c) Thanks [@sarneijim](https://github.com/sarneijim)! - Fix swap-web-app fees

- Updated dependencies [[`3dc4937cc0`](https://github.com/LedgerHQ/ledger-live/commit/3dc4937cc0c77f6dc40ac7c628e9ab165dfb899f), [`fc121ce96d`](https://github.com/LedgerHQ/ledger-live/commit/fc121ce96dbcc4f30cfd9836644f778b85f997b7), [`95cf52eb66`](https://github.com/LedgerHQ/ledger-live/commit/95cf52eb66769228feb45dd5e799c444e80c5072), [`f5a5c315ea`](https://github.com/LedgerHQ/ledger-live/commit/f5a5c315ea2200cd5b52ef3a0b377d1327b1144e), [`17ba334e47`](https://github.com/LedgerHQ/ledger-live/commit/17ba334e47b901e34fbb083396aa3f9952e5233e), [`9e2d32aec4`](https://github.com/LedgerHQ/ledger-live/commit/9e2d32aec4ebd8774880f94e3ef0e805ebb172ac), [`f83e060bf4`](https://github.com/LedgerHQ/ledger-live/commit/f83e060bf474a6b6133406eff49cb054e813046f), [`9e2d32aec4`](https://github.com/LedgerHQ/ledger-live/commit/9e2d32aec4ebd8774880f94e3ef0e805ebb172ac), [`df5c9ae02a`](https://github.com/LedgerHQ/ledger-live/commit/df5c9ae02a604ddba13ddc64caf8d9ad079c303d), [`54b1d185c9`](https://github.com/LedgerHQ/ledger-live/commit/54b1d185c9df5ae84dc7e85d58249c06550df5f1), [`9b49ff233c`](https://github.com/LedgerHQ/ledger-live/commit/9b49ff233ccfad68c98d15cd648927dee12a8b0b), [`4d6fa0772e`](https://github.com/LedgerHQ/ledger-live/commit/4d6fa0772e19cdbd4b432fafa43621c42e2a5fdd), [`b259781b72`](https://github.com/LedgerHQ/ledger-live/commit/b259781b7212aa7758437640e7c48c5d17b0fa79)]:
  - @ledgerhq/types-live@6.42.0
  - @ledgerhq/domain-service@1.1.14
  - @ledgerhq/types-cryptoassets@7.7.0
  - @ledgerhq/cryptoassets@11.1.0
  - @ledgerhq/logs@6.11.0
  - @ledgerhq/coin-framework@0.8.1
  - @ledgerhq/live-env@0.6.1
  - @ledgerhq/errors@6.15.0
  - @ledgerhq/evm-tools@1.0.10
  - @ledgerhq/hw-app-eth@6.34.9
  - @ledgerhq/devices@8.0.8
  - @ledgerhq/live-network@1.1.8
  - @ledgerhq/live-promise@0.0.2

## 0.10.0-next.0

### Minor Changes

- [#5173](https://github.com/LedgerHQ/ledger-live/pull/5173) [`17ba334e47`](https://github.com/LedgerHQ/ledger-live/commit/17ba334e47b901e34fbb083396aa3f9952e5233e) Thanks [@chabroA](https://github.com/chabroA)! - Add neon_evm support

### Patch Changes

- [#4856](https://github.com/LedgerHQ/ledger-live/pull/4856) [`173d7d6d22`](https://github.com/LedgerHQ/ledger-live/commit/173d7d6d224bcf1cecf364062b6571f52792e371) Thanks [@chabroA](https://github.com/chabroA)! - return error when tx from tokenAccount has no amount

- [#5088](https://github.com/LedgerHQ/ledger-live/pull/5088) [`2fc6d1efa0`](https://github.com/LedgerHQ/ledger-live/commit/2fc6d1efa0233a90b0fa273782cff1dd6344d52c) Thanks [@sarneijim](https://github.com/sarneijim)! - Fix swap-web-app fees

- Updated dependencies [[`3dc4937cc0`](https://github.com/LedgerHQ/ledger-live/commit/3dc4937cc0c77f6dc40ac7c628e9ab165dfb899f), [`fc121ce96d`](https://github.com/LedgerHQ/ledger-live/commit/fc121ce96dbcc4f30cfd9836644f778b85f997b7), [`95cf52eb66`](https://github.com/LedgerHQ/ledger-live/commit/95cf52eb66769228feb45dd5e799c444e80c5072), [`f5a5c315ea`](https://github.com/LedgerHQ/ledger-live/commit/f5a5c315ea2200cd5b52ef3a0b377d1327b1144e), [`17ba334e47`](https://github.com/LedgerHQ/ledger-live/commit/17ba334e47b901e34fbb083396aa3f9952e5233e), [`9e2d32aec4`](https://github.com/LedgerHQ/ledger-live/commit/9e2d32aec4ebd8774880f94e3ef0e805ebb172ac), [`f83e060bf4`](https://github.com/LedgerHQ/ledger-live/commit/f83e060bf474a6b6133406eff49cb054e813046f), [`9e2d32aec4`](https://github.com/LedgerHQ/ledger-live/commit/9e2d32aec4ebd8774880f94e3ef0e805ebb172ac), [`df5c9ae02a`](https://github.com/LedgerHQ/ledger-live/commit/df5c9ae02a604ddba13ddc64caf8d9ad079c303d), [`54b1d185c9`](https://github.com/LedgerHQ/ledger-live/commit/54b1d185c9df5ae84dc7e85d58249c06550df5f1), [`9b49ff233c`](https://github.com/LedgerHQ/ledger-live/commit/9b49ff233ccfad68c98d15cd648927dee12a8b0b), [`4d6fa0772e`](https://github.com/LedgerHQ/ledger-live/commit/4d6fa0772e19cdbd4b432fafa43621c42e2a5fdd), [`b259781b72`](https://github.com/LedgerHQ/ledger-live/commit/b259781b7212aa7758437640e7c48c5d17b0fa79)]:
  - @ledgerhq/types-live@6.42.0-next.0
  - @ledgerhq/domain-service@1.1.14-next.0
  - @ledgerhq/types-cryptoassets@7.7.0-next.0
  - @ledgerhq/cryptoassets@11.1.0-next.0
  - @ledgerhq/logs@6.11.0-next.0
  - @ledgerhq/coin-framework@0.8.1-next.0
  - @ledgerhq/live-env@0.6.1-next.0
  - @ledgerhq/errors@6.15.0-next.0
  - @ledgerhq/evm-tools@1.0.10-next.0
  - @ledgerhq/hw-app-eth@6.34.9-next.0
  - @ledgerhq/devices@8.0.8-next.0
  - @ledgerhq/live-network@1.1.8-next.0
  - @ledgerhq/live-promise@0.0.2-next.0

## 0.9.0

### Minor Changes

- [#5042](https://github.com/LedgerHQ/ledger-live/pull/5042) [`3b4f7501cc`](https://github.com/LedgerHQ/ledger-live/commit/3b4f7501cc5f09be94a2994f20f9998898682975) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Ensure compatiblity with @ledgerhq/coin-framework change regarding `TokenAccounts` ids & update `preload` & `hydrate` method to use the `convertBEP20` method instead of the `convertERC20` method when dealing with the bsc chain. This last fix is technically useless as BEP20 = ERC20, it's only here in order to prevent breaking changes with the different backends at Ledger. As soon as those backends have the possibility of changing the "bsc/bep20/XYZ" token ids into "bsc/erc20/XYZ", this fix should be removed in order to avoid useless complexity.

### Patch Changes

- Updated dependencies [[`ce18546c0a`](https://github.com/LedgerHQ/ledger-live/commit/ce18546c0a0b9dd5ed78b1745cac19b7eef7b5eb), [`3b4f7501cc`](https://github.com/LedgerHQ/ledger-live/commit/3b4f7501cc5f09be94a2994f20f9998898682975), [`fbeebfe04b`](https://github.com/LedgerHQ/ledger-live/commit/fbeebfe04b297b33ec258440b694cdfb6213af24)]:
  - @ledgerhq/types-live@6.41.1
  - @ledgerhq/coin-framework@0.8.0
  - @ledgerhq/cryptoassets@11.0.1
  - @ledgerhq/domain-service@1.1.13
  - @ledgerhq/evm-tools@1.0.9
  - @ledgerhq/hw-app-eth@6.34.8

## 0.9.0-hotfix.2

### Patch Changes

- Updated dependencies [[`fbeebfe04b`](https://github.com/LedgerHQ/ledger-live/commit/fbeebfe04b297b33ec258440b694cdfb6213af24)]:
  - @ledgerhq/cryptoassets@11.0.1-hotfix.0
  - @ledgerhq/coin-framework@0.8.0-hotfix.2
  - @ledgerhq/domain-service@1.1.13-hotfix.1
  - @ledgerhq/evm-tools@1.0.9-hotfix.0
  - @ledgerhq/hw-app-eth@6.34.8-hotfix.1

## 0.9.0-hotfix.1

### Minor Changes

- [#5042](https://github.com/LedgerHQ/ledger-live/pull/5042) [`3b4f7501cc`](https://github.com/LedgerHQ/ledger-live/commit/3b4f7501cc5f09be94a2994f20f9998898682975) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Ensure compatiblity with @ledgerhq/coin-framework change regarding `TokenAccounts` ids & update `preload` & `hydrate` method to use the `convertBEP20` method instead of the `convertERC20` method when dealing with the bsc chain. This last fix is technically useless as BEP20 = ERC20, it's only here in order to prevent breaking changes with the different backends at Ledger. As soon as those backends have the possibility of changing the "bsc/bep20/XYZ" token ids into "bsc/erc20/XYZ", this fix should be removed in order to avoid useless complexity.

### Patch Changes

- Updated dependencies [[`3b4f7501cc`](https://github.com/LedgerHQ/ledger-live/commit/3b4f7501cc5f09be94a2994f20f9998898682975)]:
  - @ledgerhq/coin-framework@0.8.0-hotfix.1

## 0.8.1-hotfix.0

### Patch Changes

- Updated dependencies [[`ce18546c0a`](https://github.com/LedgerHQ/ledger-live/commit/ce18546c0a0b9dd5ed78b1745cac19b7eef7b5eb)]:
  - @ledgerhq/types-live@6.41.1-hotfix.0
  - @ledgerhq/coin-framework@0.7.1-hotfix.0
  - @ledgerhq/domain-service@1.1.13-hotfix.0
  - @ledgerhq/evm-tools@1.0.8
  - @ledgerhq/hw-app-eth@6.34.8-hotfix.0

## 0.8.0

### Minor Changes

- [#4741](https://github.com/LedgerHQ/ledger-live/pull/4741) [`a134f28e9d`](https://github.com/LedgerHQ/ledger-live/commit/a134f28e9d220d172148619ed281d4ca897d5532) Thanks [@chabroA](https://github.com/chabroA)! - Add gasOption serialisation and deserialisation to evm transactions

- [#4791](https://github.com/LedgerHQ/ledger-live/pull/4791) [`b779f6c964`](https://github.com/LedgerHQ/ledger-live/commit/b779f6c964079b9cd9a4ee985cd5cdbb8c49406e) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Update `getDeviceTransactionConfig` to return correctly nano fields when the transaction has been crafted by a third party (like the Wallet API)

- [#4285](https://github.com/LedgerHQ/ledger-live/pull/4285) [`533278e2c4`](https://github.com/LedgerHQ/ledger-live/commit/533278e2c40ee764ecb87d4430fa6650f251ff0c) Thanks [@chabroA](https://github.com/chabroA)! - Migrate Ethereum family implementation to EVM family

  Replace the legcay Ethereum familly implementation that was present in ledger-live-common by the coin-evm lib implementation.
  This change was made in order to improve scalabillity and maintainability of the evm coins, as well as more easilly integrate new evm based chains in the future.

### Patch Changes

- [#4804](https://github.com/LedgerHQ/ledger-live/pull/4804) [`4cb507a52b`](https://github.com/LedgerHQ/ledger-live/commit/4cb507a52bf336d395b08b4c1a429bd4956ab22d) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add cache to CDN requests during preload

- Updated dependencies [[`c86637f6e5`](https://github.com/LedgerHQ/ledger-live/commit/c86637f6e57845716a791854dd8f686807152e73), [`72288402ec`](https://github.com/LedgerHQ/ledger-live/commit/72288402ec70f9159022505cb3187e63b24df450), [`f527d1bb5a`](https://github.com/LedgerHQ/ledger-live/commit/f527d1bb5a2888a916f761d43d2ba5093eaa3e3f), [`a134f28e9d`](https://github.com/LedgerHQ/ledger-live/commit/a134f28e9d220d172148619ed281d4ca897d5532), [`49ea3fd98b`](https://github.com/LedgerHQ/ledger-live/commit/49ea3fd98ba1e1e0ed54d29ab5fdc71c4918183f), [`533278e2c4`](https://github.com/LedgerHQ/ledger-live/commit/533278e2c40ee764ecb87d4430fa6650f251ff0c), [`70e4277bc9`](https://github.com/LedgerHQ/ledger-live/commit/70e4277bc9dda253b894bdae5f2c8a5f43a9a64e)]:
  - @ledgerhq/hw-app-eth@6.34.7
  - @ledgerhq/cryptoassets@11.0.0
  - @ledgerhq/types-cryptoassets@7.6.0
  - @ledgerhq/types-live@6.41.0
  - @ledgerhq/coin-framework@0.7.0
  - @ledgerhq/live-env@0.6.0
  - @ledgerhq/domain-service@1.1.12
  - @ledgerhq/evm-tools@1.0.8
  - @ledgerhq/live-network@1.1.7

## 0.6.2

### Patch Changes

- Updated dependencies [[`6c83521fee`](https://github.com/LedgerHQ/ledger-live/commit/6c83521fee8da656858630c1cb37a5af95df3362)]:
  - @ledgerhq/types-cryptoassets@7.5.0
  - @ledgerhq/cryptoassets@9.13.0
  - @ledgerhq/types-live@6.40.0
  - @ledgerhq/coin-framework@0.5.4
  - @ledgerhq/domain-service@1.1.11
  - @ledgerhq/evm-tools@1.0.7
  - @ledgerhq/hw-app-eth@6.34.6

## 0.6.1

### Patch Changes

- Updated dependencies [[`e0cc3a0841`](https://github.com/LedgerHQ/ledger-live/commit/e0cc3a08415de84b9d3ce828444248a043a9d699), [`18b4a47b48`](https://github.com/LedgerHQ/ledger-live/commit/18b4a47b4878a23695a50096b7770134883b8a2e)]:
  - @ledgerhq/coin-framework@0.5.3
  - @ledgerhq/cryptoassets@9.12.1
  - @ledgerhq/domain-service@1.1.10
  - @ledgerhq/evm-tools@1.0.6
  - @ledgerhq/hw-app-eth@6.34.5

## 0.6.0

### Minor Changes

- [#4235](https://github.com/LedgerHQ/ledger-live/pull/4235) [`8e9df43a0c`](https://github.com/LedgerHQ/ledger-live/commit/8e9df43a0cd00a2065b494439f300f96724b8eb8) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Better typing for the Operation.extra field

### Patch Changes

- [#4391](https://github.com/LedgerHQ/ledger-live/pull/4391) [`fde2fe79f1`](https://github.com/LedgerHQ/ledger-live/commit/fde2fe79f1df69fffe80763cd6d9792fe9de1262) Thanks [@valpinkman](https://github.com/valpinkman)! - Rework some env typings

- [#4452](https://github.com/LedgerHQ/ledger-live/pull/4452) [`1020f27632`](https://github.com/LedgerHQ/ledger-live/commit/1020f276322fe361585a56573091ec647fbd901e) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - fix evm integration tests

- [#4268](https://github.com/LedgerHQ/ledger-live/pull/4268) [`707e59f8b5`](https://github.com/LedgerHQ/ledger-live/commit/707e59f8b516448e6f2845288ad4cb3f5488e688) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - fix pending transaction bug in evm family

- Updated dependencies [[`8e9df43a0c`](https://github.com/LedgerHQ/ledger-live/commit/8e9df43a0cd00a2065b494439f300f96724b8eb8), [`fde2fe79f1`](https://github.com/LedgerHQ/ledger-live/commit/fde2fe79f1df69fffe80763cd6d9792fe9de1262), [`f6f70ba0e8`](https://github.com/LedgerHQ/ledger-live/commit/f6f70ba0e85c7898cdeec19402b1eadfde6a2206), [`45be23c776`](https://github.com/LedgerHQ/ledger-live/commit/45be23c77666697dbe395f836ab592062173d5cb), [`6375c250a9`](https://github.com/LedgerHQ/ledger-live/commit/6375c250a9a58b33e3dd1d6c96a96c7e46150298), [`0d9ad3599b`](https://github.com/LedgerHQ/ledger-live/commit/0d9ad3599bce8872fde97d27c977ab24445afc3a)]:
  - @ledgerhq/types-live@6.39.0
  - @ledgerhq/live-env@0.5.0
  - @ledgerhq/coin-framework@0.5.2
  - @ledgerhq/cryptoassets@9.12.0
  - @ledgerhq/domain-service@1.1.9
  - @ledgerhq/evm-tools@1.0.5
  - @ledgerhq/hw-app-eth@6.34.4
  - @ledgerhq/live-network@1.1.6

## 0.6.0-next.0

### Minor Changes

- [#4235](https://github.com/LedgerHQ/ledger-live/pull/4235) [`8e9df43a0c`](https://github.com/LedgerHQ/ledger-live/commit/8e9df43a0cd00a2065b494439f300f96724b8eb8) Thanks [@haammar-ledger](https://github.com/haammar-ledger)! - Better typing for the Operation.extra field

### Patch Changes

- [#4391](https://github.com/LedgerHQ/ledger-live/pull/4391) [`fde2fe79f1`](https://github.com/LedgerHQ/ledger-live/commit/fde2fe79f1df69fffe80763cd6d9792fe9de1262) Thanks [@valpinkman](https://github.com/valpinkman)! - Rework some env typings

- [#4452](https://github.com/LedgerHQ/ledger-live/pull/4452) [`1020f27632`](https://github.com/LedgerHQ/ledger-live/commit/1020f276322fe361585a56573091ec647fbd901e) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - fix evm integration tests

- [#4268](https://github.com/LedgerHQ/ledger-live/pull/4268) [`707e59f8b5`](https://github.com/LedgerHQ/ledger-live/commit/707e59f8b516448e6f2845288ad4cb3f5488e688) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - fix pending transaction bug in evm family

- Updated dependencies [[`8e9df43a0c`](https://github.com/LedgerHQ/ledger-live/commit/8e9df43a0cd00a2065b494439f300f96724b8eb8), [`fde2fe79f1`](https://github.com/LedgerHQ/ledger-live/commit/fde2fe79f1df69fffe80763cd6d9792fe9de1262), [`f6f70ba0e8`](https://github.com/LedgerHQ/ledger-live/commit/f6f70ba0e85c7898cdeec19402b1eadfde6a2206), [`45be23c776`](https://github.com/LedgerHQ/ledger-live/commit/45be23c77666697dbe395f836ab592062173d5cb), [`6375c250a9`](https://github.com/LedgerHQ/ledger-live/commit/6375c250a9a58b33e3dd1d6c96a96c7e46150298), [`0d9ad3599b`](https://github.com/LedgerHQ/ledger-live/commit/0d9ad3599bce8872fde97d27c977ab24445afc3a)]:
  - @ledgerhq/types-live@6.39.0-next.0
  - @ledgerhq/live-env@0.5.0-next.0
  - @ledgerhq/coin-framework@0.5.2-next.0
  - @ledgerhq/cryptoassets@9.12.0-next.0
  - @ledgerhq/domain-service@1.1.9-next.0
  - @ledgerhq/evm-tools@1.0.5-next.0
  - @ledgerhq/hw-app-eth@6.34.4-next.0
  - @ledgerhq/live-network@1.1.6-next.0

## 0.5.1

### Patch Changes

- Updated dependencies [[`5bbcea12f9`](https://github.com/LedgerHQ/ledger-live/commit/5bbcea12f93e3cda41705a4d61d50845628a6de6), [`95088eab45`](https://github.com/LedgerHQ/ledger-live/commit/95088eab45f6af919e347a605cefefb6d7705808), [`a61a43fc47`](https://github.com/LedgerHQ/ledger-live/commit/a61a43fc47399e969fa68539de6af51bfa41e921), [`4c2539a1d5`](https://github.com/LedgerHQ/ledger-live/commit/4c2539a1d5c9c01c0f9fa7cd1daf5a5a63c02996), [`229cf62304`](https://github.com/LedgerHQ/ledger-live/commit/229cf623043b29eefed3e8e37a102325fa6e0387), [`3455944496`](https://github.com/LedgerHQ/ledger-live/commit/34559444969ce1571ff4c54f33feb7f3fb59a33a)]:
  - @ledgerhq/types-live@6.38.1
  - @ledgerhq/live-env@0.4.2
  - @ledgerhq/errors@6.14.0
  - @ledgerhq/cryptoassets@9.11.1
  - @ledgerhq/coin-framework@0.5.1
  - @ledgerhq/domain-service@1.1.8
  - @ledgerhq/evm-tools@1.0.4
  - @ledgerhq/hw-app-eth@6.34.3
  - @ledgerhq/live-network@1.1.5
  - @ledgerhq/devices@8.0.7

## 0.5.1-next.0

### Patch Changes

- Updated dependencies [[`5bbcea12f9`](https://github.com/LedgerHQ/ledger-live/commit/5bbcea12f93e3cda41705a4d61d50845628a6de6), [`95088eab45`](https://github.com/LedgerHQ/ledger-live/commit/95088eab45f6af919e347a605cefefb6d7705808), [`a61a43fc47`](https://github.com/LedgerHQ/ledger-live/commit/a61a43fc47399e969fa68539de6af51bfa41e921), [`4c2539a1d5`](https://github.com/LedgerHQ/ledger-live/commit/4c2539a1d5c9c01c0f9fa7cd1daf5a5a63c02996), [`229cf62304`](https://github.com/LedgerHQ/ledger-live/commit/229cf623043b29eefed3e8e37a102325fa6e0387), [`3455944496`](https://github.com/LedgerHQ/ledger-live/commit/34559444969ce1571ff4c54f33feb7f3fb59a33a)]:
  - @ledgerhq/types-live@6.38.1-next.0
  - @ledgerhq/live-env@0.4.2-next.0
  - @ledgerhq/errors@6.14.0-next.0
  - @ledgerhq/cryptoassets@9.11.1-next.0
  - @ledgerhq/coin-framework@0.5.1-next.0
  - @ledgerhq/domain-service@1.1.8-next.0
  - @ledgerhq/evm-tools@1.0.4-next.0
  - @ledgerhq/hw-app-eth@6.34.3-next.0
  - @ledgerhq/live-network@1.1.5-next.0
  - @ledgerhq/devices@8.0.7-next.0

## 0.5.0

### Minor Changes

- [#4021](https://github.com/LedgerHQ/ledger-live/pull/4021) [`e5f9cc46d6`](https://github.com/LedgerHQ/ledger-live/commit/e5f9cc46d69b82ad7267296b350e9d97a47f9e86) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add telos evm currency

- [#3704](https://github.com/LedgerHQ/ledger-live/pull/3704) [`b6e50932af`](https://github.com/LedgerHQ/ledger-live/commit/b6e50932afac6acc2d2f9fa9ed10b77a62378e03) Thanks [@chabroA](https://github.com/chabroA)! - Create EVM send flow

- [#3827](https://github.com/LedgerHQ/ledger-live/pull/3827) [`6a88b7f8a6`](https://github.com/LedgerHQ/ledger-live/commit/6a88b7f8a6b7c732be0c945131b6c1d9b3937cc1) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add support for Ledger infra as node and/or explorer

- [#4015](https://github.com/LedgerHQ/ledger-live/pull/4015) [`374e339c27`](https://github.com/LedgerHQ/ledger-live/commit/374e339c27e317656d01463a822898ad3a60df85) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add support for Polygon zkEVM, Base Goerli, Klaytn

### Patch Changes

- [#4090](https://github.com/LedgerHQ/ledger-live/pull/4090) [`7675787398`](https://github.com/LedgerHQ/ledger-live/commit/767578739822597768f877f94fd8f7f35441395a) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Fix building & bundling of `evm-tools` & `domain-service` libs due to .gitignore(s)

- [#4143](https://github.com/LedgerHQ/ledger-live/pull/4143) [`c2fd7e2e3d`](https://github.com/LedgerHQ/ledger-live/commit/c2fd7e2e3d684da831a7eafe6b22b5e2c96a3722) Thanks [@chabroA](https://github.com/chabroA)! - Add missing teloscan in type guard

- Updated dependencies [[`1263b7a9c1`](https://github.com/LedgerHQ/ledger-live/commit/1263b7a9c1916da81ad55bb2ca1e804cff5f89e2), [`770842cdbe`](https://github.com/LedgerHQ/ledger-live/commit/770842cdbe94c629b6844f93d1b5d94d381931b1), [`e5f9cc46d6`](https://github.com/LedgerHQ/ledger-live/commit/e5f9cc46d69b82ad7267296b350e9d97a47f9e86), [`6a88b7f8a6`](https://github.com/LedgerHQ/ledger-live/commit/6a88b7f8a6b7c732be0c945131b6c1d9b3937cc1), [`cfbff52724`](https://github.com/LedgerHQ/ledger-live/commit/cfbff527241534aba69bff3d86733b50a14eb4ce), [`b6e50932af`](https://github.com/LedgerHQ/ledger-live/commit/b6e50932afac6acc2d2f9fa9ed10b77a62378e03), [`6a88b7f8a6`](https://github.com/LedgerHQ/ledger-live/commit/6a88b7f8a6b7c732be0c945131b6c1d9b3937cc1), [`7675787398`](https://github.com/LedgerHQ/ledger-live/commit/767578739822597768f877f94fd8f7f35441395a), [`95ac67a5e0`](https://github.com/LedgerHQ/ledger-live/commit/95ac67a5e0359b03c7d82c34fd1f2f3b6eb7df22), [`c7c484acf0`](https://github.com/LedgerHQ/ledger-live/commit/c7c484acf01e9db8dc5a5507b62ffcb863c77ca4), [`374e339c27`](https://github.com/LedgerHQ/ledger-live/commit/374e339c27e317656d01463a822898ad3a60df85), [`66769a98e6`](https://github.com/LedgerHQ/ledger-live/commit/66769a98e69f2b8156417e464e90d9162272b470)]:
  - @ledgerhq/cryptoassets@9.11.0
  - @ledgerhq/live-env@0.4.1
  - @ledgerhq/types-cryptoassets@7.4.0
  - @ledgerhq/types-live@6.38.0
  - @ledgerhq/coin-framework@0.5.0
  - @ledgerhq/evm-tools@1.0.3
  - @ledgerhq/hw-app-eth@6.34.2
  - @ledgerhq/errors@6.13.1
  - @ledgerhq/domain-service@1.1.7
  - @ledgerhq/live-network@1.1.4
  - @ledgerhq/devices@8.0.6

## 0.5.0-next.0

### Minor Changes

- [#4021](https://github.com/LedgerHQ/ledger-live/pull/4021) [`e5f9cc46d6`](https://github.com/LedgerHQ/ledger-live/commit/e5f9cc46d69b82ad7267296b350e9d97a47f9e86) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add telos evm currency

- [#3704](https://github.com/LedgerHQ/ledger-live/pull/3704) [`b6e50932af`](https://github.com/LedgerHQ/ledger-live/commit/b6e50932afac6acc2d2f9fa9ed10b77a62378e03) Thanks [@chabroA](https://github.com/chabroA)! - Create EVM send flow

- [#3827](https://github.com/LedgerHQ/ledger-live/pull/3827) [`6a88b7f8a6`](https://github.com/LedgerHQ/ledger-live/commit/6a88b7f8a6b7c732be0c945131b6c1d9b3937cc1) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add support for Ledger infra as node and/or explorer

- [#4015](https://github.com/LedgerHQ/ledger-live/pull/4015) [`374e339c27`](https://github.com/LedgerHQ/ledger-live/commit/374e339c27e317656d01463a822898ad3a60df85) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add support for Polygon zkEVM, Base Goerli, Klaytn

### Patch Changes

- [#4090](https://github.com/LedgerHQ/ledger-live/pull/4090) [`7675787398`](https://github.com/LedgerHQ/ledger-live/commit/767578739822597768f877f94fd8f7f35441395a) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Fix building & bundling of `evm-tools` & `domain-service` libs due to .gitignore(s)

- [#4143](https://github.com/LedgerHQ/ledger-live/pull/4143) [`c2fd7e2e3d`](https://github.com/LedgerHQ/ledger-live/commit/c2fd7e2e3d684da831a7eafe6b22b5e2c96a3722) Thanks [@chabroA](https://github.com/chabroA)! - Add missing teloscan in type guard

- Updated dependencies [[`1263b7a9c1`](https://github.com/LedgerHQ/ledger-live/commit/1263b7a9c1916da81ad55bb2ca1e804cff5f89e2), [`770842cdbe`](https://github.com/LedgerHQ/ledger-live/commit/770842cdbe94c629b6844f93d1b5d94d381931b1), [`e5f9cc46d6`](https://github.com/LedgerHQ/ledger-live/commit/e5f9cc46d69b82ad7267296b350e9d97a47f9e86), [`6a88b7f8a6`](https://github.com/LedgerHQ/ledger-live/commit/6a88b7f8a6b7c732be0c945131b6c1d9b3937cc1), [`cfbff52724`](https://github.com/LedgerHQ/ledger-live/commit/cfbff527241534aba69bff3d86733b50a14eb4ce), [`b6e50932af`](https://github.com/LedgerHQ/ledger-live/commit/b6e50932afac6acc2d2f9fa9ed10b77a62378e03), [`6a88b7f8a6`](https://github.com/LedgerHQ/ledger-live/commit/6a88b7f8a6b7c732be0c945131b6c1d9b3937cc1), [`7675787398`](https://github.com/LedgerHQ/ledger-live/commit/767578739822597768f877f94fd8f7f35441395a), [`95ac67a5e0`](https://github.com/LedgerHQ/ledger-live/commit/95ac67a5e0359b03c7d82c34fd1f2f3b6eb7df22), [`c7c484acf0`](https://github.com/LedgerHQ/ledger-live/commit/c7c484acf01e9db8dc5a5507b62ffcb863c77ca4), [`374e339c27`](https://github.com/LedgerHQ/ledger-live/commit/374e339c27e317656d01463a822898ad3a60df85), [`66769a98e6`](https://github.com/LedgerHQ/ledger-live/commit/66769a98e69f2b8156417e464e90d9162272b470)]:
  - @ledgerhq/cryptoassets@9.11.0-next.0
  - @ledgerhq/live-env@0.4.1-next.0
  - @ledgerhq/types-cryptoassets@7.4.0-next.0
  - @ledgerhq/types-live@6.38.0-next.0
  - @ledgerhq/coin-framework@0.5.0-next.0
  - @ledgerhq/evm-tools@1.0.3-next.0
  - @ledgerhq/hw-app-eth@6.34.2-next.0
  - @ledgerhq/errors@6.13.1-next.0
  - @ledgerhq/domain-service@1.1.7-next.0
  - @ledgerhq/live-network@1.1.4-next.0
  - @ledgerhq/devices@8.0.6-next.0

## 0.4.1

### Patch Changes

- [#4103](https://github.com/LedgerHQ/ledger-live/pull/4103) [`2317fccb67`](https://github.com/LedgerHQ/ledger-live/commit/2317fccb6776a077eaca8828da8371d402323be4) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Fix building & bundling of `evm-tools` & `domain-service` libs due to .gitignore(s)

- Updated dependencies [[`2317fccb67`](https://github.com/LedgerHQ/ledger-live/commit/2317fccb6776a077eaca8828da8371d402323be4)]:
  - @ledgerhq/evm-tools@1.0.2
  - @ledgerhq/hw-app-eth@6.34.1

## 0.4.1-hotfix.0

### Patch Changes

- [#4103](https://github.com/LedgerHQ/ledger-live/pull/4103) [`2317fccb67`](https://github.com/LedgerHQ/ledger-live/commit/2317fccb6776a077eaca8828da8371d402323be4) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Fix building & bundling of `evm-tools` & `domain-service` libs due to .gitignore(s)

- Updated dependencies [[`2317fccb67`](https://github.com/LedgerHQ/ledger-live/commit/2317fccb6776a077eaca8828da8371d402323be4)]:
  - @ledgerhq/evm-tools@1.0.2-hotfix.0
  - @ledgerhq/hw-app-eth@6.34.1-hotfix.0

## 0.4.0

### Minor Changes

- [#3714](https://github.com/LedgerHQ/ledger-live/pull/3714) [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Adding support for NFT transactions

- [#3786](https://github.com/LedgerHQ/ledger-live/pull/3786) [`11e62b1e1e`](https://github.com/LedgerHQ/ledger-live/commit/11e62b1e1e3773eeaad748453973e0b3bcd3e3bf) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Adds support for the `setLoadConfig` during the SignOperation step and adds the usage of environment variables to set the backends URIs

- [#3714](https://github.com/LedgerHQ/ledger-live/pull/3714) [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add support for non finite quantity w/ NFT transaction data crafting

- [#3924](https://github.com/LedgerHQ/ledger-live/pull/3924) [`14cce73003`](https://github.com/LedgerHQ/ledger-live/commit/14cce7300333c51cbcdbd5a7e290ddc600c9f3a1) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Use of the `evm-tools` new library to bring support for SignMessage

### Patch Changes

- [#3714](https://github.com/LedgerHQ/ledger-live/pull/3714) [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Prevent duplicated sub & nft operations with rate limited explorers & make explorerless implementation also patch sub & nft operations after transaction finalization

- [#3714](https://github.com/LedgerHQ/ledger-live/pull/3714) [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Rename rpc file that prevented shims to be applied for React Native

- Updated dependencies [[`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec), [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec), [`49182846de`](https://github.com/LedgerHQ/ledger-live/commit/49182846dee35ae9b3535c0c120e17d0eaecde70), [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec), [`c660c4e389`](https://github.com/LedgerHQ/ledger-live/commit/c660c4e389ac200ef308cbc3882930d392375de3), [`2c28d5aab3`](https://github.com/LedgerHQ/ledger-live/commit/2c28d5aab36b8b0cf2cb2a50e02eac4c5a588e41), [`0f4293e9bf`](https://github.com/LedgerHQ/ledger-live/commit/0f4293e9bf9cac4c2a195efeb0831aab3d51933d), [`14cce73003`](https://github.com/LedgerHQ/ledger-live/commit/14cce7300333c51cbcdbd5a7e290ddc600c9f3a1), [`14cce73003`](https://github.com/LedgerHQ/ledger-live/commit/14cce7300333c51cbcdbd5a7e290ddc600c9f3a1), [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec), [`bae3b64dd2`](https://github.com/LedgerHQ/ledger-live/commit/bae3b64dd2710a3743552600166be986e93d9099), [`9692adc2a6`](https://github.com/LedgerHQ/ledger-live/commit/9692adc2a6774feb4424fc7a984810918c946b1b), [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec)]:
  - @ledgerhq/live-env@0.4.0
  - @ledgerhq/coin-framework@0.4.0
  - @ledgerhq/cryptoassets@9.10.0
  - @ledgerhq/errors@6.13.0
  - @ledgerhq/types-live@6.37.0
  - @ledgerhq/hw-app-eth@6.34.0
  - @ledgerhq/types-cryptoassets@7.3.1
  - @ledgerhq/evm-tools@1.0.1
  - @ledgerhq/live-network@1.1.3
  - @ledgerhq/domain-service@1.1.6
  - @ledgerhq/devices@8.0.5

## 0.4.0-next.0

### Minor Changes

- [#3714](https://github.com/LedgerHQ/ledger-live/pull/3714) [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Adding support for NFT transactions

- [#3786](https://github.com/LedgerHQ/ledger-live/pull/3786) [`11e62b1e1e`](https://github.com/LedgerHQ/ledger-live/commit/11e62b1e1e3773eeaad748453973e0b3bcd3e3bf) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Adds support for the `setLoadConfig` during the SignOperation step and adds the usage of environment variables to set the backends URIs

- [#3714](https://github.com/LedgerHQ/ledger-live/pull/3714) [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add support for non finite quantity w/ NFT transaction data crafting

- [#3924](https://github.com/LedgerHQ/ledger-live/pull/3924) [`14cce73003`](https://github.com/LedgerHQ/ledger-live/commit/14cce7300333c51cbcdbd5a7e290ddc600c9f3a1) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Use of the `evm-tools` new library to bring support for SignMessage

### Patch Changes

- [#3714](https://github.com/LedgerHQ/ledger-live/pull/3714) [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Prevent duplicated sub & nft operations with rate limited explorers & make explorerless implementation also patch sub & nft operations after transaction finalization

- [#3714](https://github.com/LedgerHQ/ledger-live/pull/3714) [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Rename rpc file that prevented shims to be applied for React Native

- Updated dependencies [[`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec), [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec), [`49182846de`](https://github.com/LedgerHQ/ledger-live/commit/49182846dee35ae9b3535c0c120e17d0eaecde70), [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec), [`c660c4e389`](https://github.com/LedgerHQ/ledger-live/commit/c660c4e389ac200ef308cbc3882930d392375de3), [`2c28d5aab3`](https://github.com/LedgerHQ/ledger-live/commit/2c28d5aab36b8b0cf2cb2a50e02eac4c5a588e41), [`0f4293e9bf`](https://github.com/LedgerHQ/ledger-live/commit/0f4293e9bf9cac4c2a195efeb0831aab3d51933d), [`14cce73003`](https://github.com/LedgerHQ/ledger-live/commit/14cce7300333c51cbcdbd5a7e290ddc600c9f3a1), [`14cce73003`](https://github.com/LedgerHQ/ledger-live/commit/14cce7300333c51cbcdbd5a7e290ddc600c9f3a1), [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec), [`bae3b64dd2`](https://github.com/LedgerHQ/ledger-live/commit/bae3b64dd2710a3743552600166be986e93d9099), [`9692adc2a6`](https://github.com/LedgerHQ/ledger-live/commit/9692adc2a6774feb4424fc7a984810918c946b1b), [`15e8abc482`](https://github.com/LedgerHQ/ledger-live/commit/15e8abc482b2b38e4808890f556097cf693359ec)]:
  - @ledgerhq/live-env@0.4.0-next.0
  - @ledgerhq/coin-framework@0.4.0-next.0
  - @ledgerhq/cryptoassets@9.10.0-next.0
  - @ledgerhq/errors@6.13.0-next.0
  - @ledgerhq/types-live@6.37.0-next.0
  - @ledgerhq/hw-app-eth@6.34.0-next.0
  - @ledgerhq/types-cryptoassets@7.3.1-next.0
  - @ledgerhq/evm-tools@1.0.1-next.0
  - @ledgerhq/live-network@1.1.3-next.0
  - @ledgerhq/domain-service@1.1.6-next.0
  - @ledgerhq/devices@8.0.5-next.0

## 0.3.0

### Minor Changes

- [#3611](https://github.com/LedgerHQ/ledger-live/pull/3611) [`092cb8d317`](https://github.com/LedgerHQ/ledger-live/commit/092cb8d317fa7971e0f790b77f900ae3864d96c2) Thanks [@chabroA](https://github.com/chabroA)! - Create GasTracker abstraction for evm familly

### Patch Changes

- [#3741](https://github.com/LedgerHQ/ledger-live/pull/3741) [`6194db3178`](https://github.com/LedgerHQ/ledger-live/commit/6194db3178cf90b26f4f6c7f049b7eafafdf7bfc) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Update eip55 dependency

- [#3741](https://github.com/LedgerHQ/ledger-live/pull/3741) [`6194db3178`](https://github.com/LedgerHQ/ledger-live/commit/6194db3178cf90b26f4f6c7f049b7eafafdf7bfc) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Update eip55 dependency to 2.1.1 fixing browser context usage

- [#3872](https://github.com/LedgerHQ/ledger-live/pull/3872) [`d1d1578ab5`](https://github.com/LedgerHQ/ledger-live/commit/d1d1578ab5b351544c98d56b67c68f18640f2d20) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Rename rpc file that prevented shims to be applied for React Native

- Updated dependencies [[`6194db3178`](https://github.com/LedgerHQ/ledger-live/commit/6194db3178cf90b26f4f6c7f049b7eafafdf7bfc), [`44192f2ab2`](https://github.com/LedgerHQ/ledger-live/commit/44192f2ab2857cbae2ef4a81ee9608d395dcd2b9), [`cb95f72c24`](https://github.com/LedgerHQ/ledger-live/commit/cb95f72c2415876ef88ca83fd2c4363a57669b92), [`be5f56b233`](https://github.com/LedgerHQ/ledger-live/commit/be5f56b2330c166323914b79fef37a3c05e0e13a), [`092cb8d317`](https://github.com/LedgerHQ/ledger-live/commit/092cb8d317fa7971e0f790b77f900ae3864d96c2), [`5af41b6fa1`](https://github.com/LedgerHQ/ledger-live/commit/5af41b6fa1e43037ccdb2df279c82e12ef3d2b1a), [`6194db3178`](https://github.com/LedgerHQ/ledger-live/commit/6194db3178cf90b26f4f6c7f049b7eafafdf7bfc)]:
  - @ledgerhq/domain-service@1.1.5
  - @ledgerhq/types-live@6.36.0
  - @ledgerhq/cryptoassets@9.9.0
  - @ledgerhq/types-cryptoassets@7.3.0
  - @ledgerhq/live-env@0.3.1
  - @ledgerhq/hw-app-eth@6.33.7
  - @ledgerhq/coin-framework@0.3.7
  - @ledgerhq/live-network@1.1.2

## 0.3.0-next.1

### Patch Changes

- [#3872](https://github.com/LedgerHQ/ledger-live/pull/3872) [`d1d1578ab5`](https://github.com/LedgerHQ/ledger-live/commit/d1d1578ab5b351544c98d56b67c68f18640f2d20) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Rename rpc file that prevented shims to be applied for React Native

## 0.3.0-next.0

### Minor Changes

- [#3611](https://github.com/LedgerHQ/ledger-live/pull/3611) [`092cb8d317`](https://github.com/LedgerHQ/ledger-live/commit/092cb8d317fa7971e0f790b77f900ae3864d96c2) Thanks [@chabroA](https://github.com/chabroA)! - Create GasTracker abstraction for evm familly

### Patch Changes

- [#3741](https://github.com/LedgerHQ/ledger-live/pull/3741) [`6194db3178`](https://github.com/LedgerHQ/ledger-live/commit/6194db3178cf90b26f4f6c7f049b7eafafdf7bfc) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Update eip55 dependency

- [#3741](https://github.com/LedgerHQ/ledger-live/pull/3741) [`6194db3178`](https://github.com/LedgerHQ/ledger-live/commit/6194db3178cf90b26f4f6c7f049b7eafafdf7bfc) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Update eip55 dependency to 2.1.1 fixing browser context usage

- Updated dependencies [[`6194db3178`](https://github.com/LedgerHQ/ledger-live/commit/6194db3178cf90b26f4f6c7f049b7eafafdf7bfc), [`44192f2ab2`](https://github.com/LedgerHQ/ledger-live/commit/44192f2ab2857cbae2ef4a81ee9608d395dcd2b9), [`cb95f72c24`](https://github.com/LedgerHQ/ledger-live/commit/cb95f72c2415876ef88ca83fd2c4363a57669b92), [`be5f56b233`](https://github.com/LedgerHQ/ledger-live/commit/be5f56b2330c166323914b79fef37a3c05e0e13a), [`092cb8d317`](https://github.com/LedgerHQ/ledger-live/commit/092cb8d317fa7971e0f790b77f900ae3864d96c2), [`5af41b6fa1`](https://github.com/LedgerHQ/ledger-live/commit/5af41b6fa1e43037ccdb2df279c82e12ef3d2b1a), [`6194db3178`](https://github.com/LedgerHQ/ledger-live/commit/6194db3178cf90b26f4f6c7f049b7eafafdf7bfc)]:
  - @ledgerhq/domain-service@1.1.5-next.0
  - @ledgerhq/types-live@6.36.0-next.0
  - @ledgerhq/cryptoassets@9.9.0-next.0
  - @ledgerhq/types-cryptoassets@7.3.0-next.0
  - @ledgerhq/live-env@0.3.1-next.0
  - @ledgerhq/hw-app-eth@6.33.7-next.0
  - @ledgerhq/coin-framework@0.3.7-next.0
  - @ledgerhq/live-network@1.1.2-next.0

## 0.2.1

### Patch Changes

- Updated dependencies [[`9adc1862dd`](https://github.com/LedgerHQ/ledger-live/commit/9adc1862dda605a722d19f3b6895bd324834c914), [`4a1454beb3`](https://github.com/LedgerHQ/ledger-live/commit/4a1454beb3f86405ba2686e07879c12a7d35ad8e), [`809065c571`](https://github.com/LedgerHQ/ledger-live/commit/809065c57198646a49adea112b9d799e35a57d25), [`d1aa522db7`](https://github.com/LedgerHQ/ledger-live/commit/d1aa522db75f7ea850efe412abaa4dc7d37af6b7), [`ebe5b07afe`](https://github.com/LedgerHQ/ledger-live/commit/ebe5b07afec441ea3e2d9103da9e1175972add47)]:
  - @ledgerhq/errors@6.12.7
  - @ledgerhq/cryptoassets@9.8.0
  - @ledgerhq/types-cryptoassets@7.2.1
  - @ledgerhq/types-live@6.35.1
  - @ledgerhq/coin-framework@0.3.6
  - @ledgerhq/domain-service@1.1.4
  - @ledgerhq/devices@8.0.4
  - @ledgerhq/hw-app-eth@6.33.6
  - @ledgerhq/live-network@1.1.1
  - @ledgerhq/live-portfolio@0.0.8

## 0.2.1-next.0

### Patch Changes

- Updated dependencies [[`9adc1862dd`](https://github.com/LedgerHQ/ledger-live/commit/9adc1862dda605a722d19f3b6895bd324834c914), [`4a1454beb3`](https://github.com/LedgerHQ/ledger-live/commit/4a1454beb3f86405ba2686e07879c12a7d35ad8e), [`809065c571`](https://github.com/LedgerHQ/ledger-live/commit/809065c57198646a49adea112b9d799e35a57d25), [`d1aa522db7`](https://github.com/LedgerHQ/ledger-live/commit/d1aa522db75f7ea850efe412abaa4dc7d37af6b7), [`ebe5b07afe`](https://github.com/LedgerHQ/ledger-live/commit/ebe5b07afec441ea3e2d9103da9e1175972add47)]:
  - @ledgerhq/errors@6.12.7-next.0
  - @ledgerhq/cryptoassets@9.8.0-next.0
  - @ledgerhq/types-cryptoassets@7.2.1-next.0
  - @ledgerhq/types-live@6.35.1-next.0
  - @ledgerhq/coin-framework@0.3.6-next.0
  - @ledgerhq/domain-service@1.1.4-next.0
  - @ledgerhq/devices@8.0.4-next.0
  - @ledgerhq/hw-app-eth@6.33.6-next.0
  - @ledgerhq/live-network@1.1.1-next.0
  - @ledgerhq/live-portfolio@0.0.8-next.0

## 0.2.0

### Minor Changes

- [#3536](https://github.com/LedgerHQ/ledger-live/pull/3536) [`a380bfc53a`](https://github.com/LedgerHQ/ledger-live/commit/a380bfc53a25bf196031337cd7ab8bc459731e16) Thanks [@chabroA](https://github.com/chabroA)! - Move evm familly logic in own package

### Patch Changes

- Updated dependencies [[`5cce6e3593`](https://github.com/LedgerHQ/ledger-live/commit/5cce6e359309110df53e16ef989c5b8b94492dfd), [`30bf4d92c7`](https://github.com/LedgerHQ/ledger-live/commit/30bf4d92c7d79cb81b1e4ad014857459739c33be), [`b30ead9d22`](https://github.com/LedgerHQ/ledger-live/commit/b30ead9d22a4bce5f8ee27febf0190fccd2ca25b), [`ce675302c7`](https://github.com/LedgerHQ/ledger-live/commit/ce675302c78311571e1087cfa35ee67580263796), [`43cdd2624c`](https://github.com/LedgerHQ/ledger-live/commit/43cdd2624cd2965ddb6e346e9a77a3cc12476500)]:
  - @ledgerhq/cryptoassets@9.7.0
  - @ledgerhq/live-network@1.1.0
  - @ledgerhq/types-live@6.35.0
  - @ledgerhq/coin-framework@0.3.5
  - @ledgerhq/domain-service@1.1.3
  - @ledgerhq/hw-app-eth@6.33.5
  - @ledgerhq/live-portfolio@0.0.7

## 0.2.0-next.1

### Patch Changes

- Updated dependencies [[`30bf4d92c7`](https://github.com/LedgerHQ/ledger-live/commit/30bf4d92c7d79cb81b1e4ad014857459739c33be)]:
  - @ledgerhq/cryptoassets@9.7.0-next.1
  - @ledgerhq/coin-framework@0.3.5-next.1
  - @ledgerhq/domain-service@1.1.3-next.1
  - @ledgerhq/hw-app-eth@6.33.5-next.1

## 0.2.0-next.0

### Minor Changes

- [#3536](https://github.com/LedgerHQ/ledger-live/pull/3536) [`a380bfc53a`](https://github.com/LedgerHQ/ledger-live/commit/a380bfc53a25bf196031337cd7ab8bc459731e16) Thanks [@chabroA](https://github.com/chabroA)! - Move evm familly logic in own package

### Patch Changes

- Updated dependencies [[`5cce6e3593`](https://github.com/LedgerHQ/ledger-live/commit/5cce6e359309110df53e16ef989c5b8b94492dfd), [`b30ead9d22`](https://github.com/LedgerHQ/ledger-live/commit/b30ead9d22a4bce5f8ee27febf0190fccd2ca25b), [`7439b63325`](https://github.com/LedgerHQ/ledger-live/commit/7439b63325a9b0181a3af4310ba787f00faa80c9), [`ce675302c7`](https://github.com/LedgerHQ/ledger-live/commit/ce675302c78311571e1087cfa35ee67580263796), [`43cdd2624c`](https://github.com/LedgerHQ/ledger-live/commit/43cdd2624cd2965ddb6e346e9a77a3cc12476500)]:
  - @ledgerhq/cryptoassets@9.7.0-next.0
  - @ledgerhq/live-network@1.1.0-next.0
  - @ledgerhq/types-live@6.35.0-next.0
  - @ledgerhq/coin-framework@0.3.5-next.0
  - @ledgerhq/domain-service@1.1.3-next.0
  - @ledgerhq/hw-app-eth@6.33.5-next.0
  - @ledgerhq/live-portfolio@0.0.7-next.0

# @ledgerhq/types-live

## 6.125.0-next.0

### Minor Changes

- [#22343](https://github.com/LedgerHQ/ledger-live/pull/22343) [`387619d`](https://github.com/LedgerHQ/ledger-live/commit/387619d7be17b3d7cd86031430769c6bb6638a68) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop the `documentation` doc-gen CLI: remove the `doc` script and `documentation` devDependency, and the related `micromark` patch in `.pnpmfile.cjs`

- [#21841](https://github.com/LedgerHQ/ledger-live/pull/21841) [`d59d123`](https://github.com/LedgerHQ/ledger-live/commit/d59d123a2ba037b44507b1f5424e31f05309ec26) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(cosmos): migrate account resources to shared staking aggregate

- [#21967](https://github.com/LedgerHQ/ledger-live/pull/21967) [`40251b4`](https://github.com/LedgerHQ/ledger-live/commit/40251b41a62b2381c5c79410073a5f0b3c1fe629) Thanks [@sarneijim](https://github.com/sarneijim)! - Remove the obsolete original Wallet V4 tour

## 6.124.0

### Minor Changes

- [#21656](https://github.com/LedgerHQ/ledger-live/pull/21656) [`85e01c4`](https://github.com/LedgerHQ/ledger-live/commit/85e01c449dab75d75851631a56d292f2cb0c5b36) Thanks [@sarneijim](https://github.com/sarneijim)! - Add the Q3 Wallet V4 Tour feature flag, persisted seen state, mobile debug setup, and Segment wallet40Attributes.q3Tour

- [#21751](https://github.com/LedgerHQ/ledger-live/pull/21751) [`dc204a7`](https://github.com/LedgerHQ/ledger-live/commit/dc204a7633e6f7c9acb66fbb18a6aeaa2e75c4bb) Thanks [@sarneijim](https://github.com/sarneijim)! - Add releaseTour and gate Q2/Q3 tours with it, dropping q2Tour/q3Tour from Wallet 4.0

## 6.124.0-next.0

### Minor Changes

- [#21656](https://github.com/LedgerHQ/ledger-live/pull/21656) [`85e01c4`](https://github.com/LedgerHQ/ledger-live/commit/85e01c449dab75d75851631a56d292f2cb0c5b36) Thanks [@sarneijim](https://github.com/sarneijim)! - Add the Q3 Wallet V4 Tour feature flag, persisted seen state, mobile debug setup, and Segment wallet40Attributes.q3Tour

- [#21751](https://github.com/LedgerHQ/ledger-live/pull/21751) [`dc204a7`](https://github.com/LedgerHQ/ledger-live/commit/dc204a7633e6f7c9acb66fbb18a6aeaa2e75c4bb) Thanks [@sarneijim](https://github.com/sarneijim)! - Add releaseTour and gate Q2/Q3 tours with it, dropping q2Tour/q3Tour from Wallet 4.0

## 6.123.0

### Minor Changes

- [#21488](https://github.com/LedgerHQ/ledger-live/pull/21488) [`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop `delisted` from `CryptoCurrency`. No registry entry ever set it, so the `listCryptoCurrencies()` production filter was testing a dead branch. It stays on `TokenCurrency`, where CAL drives it.

- [#21486](https://github.com/LedgerHQ/ledger-live/pull/21486) [`2d42e64`](https://github.com/LedgerHQ/ledger-live/commit/2d42e647d55f79cf2eb821ec30a232cc07891219) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop `deviceTicker` from `CryptoCurrency`. The field was declared in three places and set by 17 testnet/L2 registry entries, but nothing ever read it.

- [#21487](https://github.com/LedgerHQ/ledger-live/pull/21487) [`b7d0367`](https://github.com/LedgerHQ/ledger-live/commit/b7d03671db1aa022d3ff375465c7d8470bf2b215) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop `disableCountervalue` from `CryptoCurrency`. Nothing read it on a crypto currency; it stays on `TokenCurrency`, where the assets API drives it, and on `FiatCurrency`.

- [#21326](https://github.com/LedgerHQ/ledger-live/pull/21326) [`9fb98ab`](https://github.com/LedgerHQ/ledger-live/commit/9fb98ab74e3ca680e686a302b9beaa460a087783) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Drive the XRP app through the Device Management Kit behind the `ldmkXrpSigner` feature flag, keeping `hw-app-xrp` as the fallback

## 6.123.0-next.0

### Minor Changes

- [#21488](https://github.com/LedgerHQ/ledger-live/pull/21488) [`52f573c`](https://github.com/LedgerHQ/ledger-live/commit/52f573c045c52805d250079dd300870c4468493d) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop `delisted` from `CryptoCurrency`. No registry entry ever set it, so the `listCryptoCurrencies()` production filter was testing a dead branch. It stays on `TokenCurrency`, where CAL drives it.

- [#21486](https://github.com/LedgerHQ/ledger-live/pull/21486) [`2d42e64`](https://github.com/LedgerHQ/ledger-live/commit/2d42e647d55f79cf2eb821ec30a232cc07891219) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop `deviceTicker` from `CryptoCurrency`. The field was declared in three places and set by 17 testnet/L2 registry entries, but nothing ever read it.

- [#21487](https://github.com/LedgerHQ/ledger-live/pull/21487) [`b7d0367`](https://github.com/LedgerHQ/ledger-live/commit/b7d03671db1aa022d3ff375465c7d8470bf2b215) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop `disableCountervalue` from `CryptoCurrency`. Nothing read it on a crypto currency; it stays on `TokenCurrency`, where the assets API drives it, and on `FiatCurrency`.

- [#21326](https://github.com/LedgerHQ/ledger-live/pull/21326) [`9fb98ab`](https://github.com/LedgerHQ/ledger-live/commit/9fb98ab74e3ca680e686a302b9beaa460a087783) Thanks [@aussedatlo](https://github.com/aussedatlo)! - Drive the XRP app through the Device Management Kit behind the `ldmkXrpSigner` feature flag, keeping `hw-app-xrp` as the fallback

## 6.122.0

### Minor Changes

- [#20935](https://github.com/LedgerHQ/ledger-live/pull/20935) [`27388a8`](https://github.com/LedgerHQ/ledger-live/commit/27388a894eaac67b8e162a60f6d3368aad0a8682) Thanks [@dilaouid](https://github.com/dilaouid)! - Move Solana staking onto the generic `StakingResources` account attribute.

  **Breaking for `@ledgerhq/coin-solana`.** `SolanaResources`, `SolanaResourcesRaw`, `toSolanaResourcesRaw` and `fromSolanaResourcesRaw` are gone. `SolanaAccount` is now an alias of `StakingAccount`, so read staking data from `account.stakingResources` instead of `account.solanaResources`. A stake is a `StakingDelegation` or a `StakingUnbonding` (`SolanaStakingPosition`) rather than a `SolanaStake`: its stake account address is `positionId`, its validator is `validatorAddress`, and the former `activation.active` / `activation.inactive` / `withdrawable` fields are `activeAmount` / `inactiveAmount` / `withdrawableAmount`. `listSolanaStakingPositions`, `solanaActivationState` and `stakeActions` from `@ledgerhq/coin-solana/logic` cover the common access patterns. Accounts already persisted with a `solanaResources` blob are migrated on hydration, so no resync is needed.

  `@ledgerhq/types-live` gains `StakingPositionDetails`, mixed into `StakingDelegation` and `StakingUnbonding` for chains that materialize each position as its own on-chain account, plus `actionFeeReserve` on `StakingResources`. Both are optional, so other chains are unaffected.

  `@ledgerhq/wallet-cli`'s `earn positions` output changes shape: on `EarnSolanaStake`, `stakeBalance` and `withdrawable` go from `number` to an integer decimal string, so lamport amounts above `Number.MAX_SAFE_INTEGER` stay exact. Anything reading those two fields numerically needs updating.

  `@ledgerhq/ledger-wallet-framework` now exports the generic `StakingResources` serializer (`toStakingResourcesRaw`, `fromStakingResourcesRaw`, `assignStakingResourcesToAccountRaw`, `assignStakingResourcesFromAccountRaw`), moved out of the EVM family in `live-common` so every coin module can use it.

## 6.122.0-next.0

### Minor Changes

- [#20935](https://github.com/LedgerHQ/ledger-live/pull/20935) [`27388a8`](https://github.com/LedgerHQ/ledger-live/commit/27388a894eaac67b8e162a60f6d3368aad0a8682) Thanks [@dilaouid](https://github.com/dilaouid)! - Move Solana staking onto the generic `StakingResources` account attribute.

  **Breaking for `@ledgerhq/coin-solana`.** `SolanaResources`, `SolanaResourcesRaw`, `toSolanaResourcesRaw` and `fromSolanaResourcesRaw` are gone. `SolanaAccount` is now an alias of `StakingAccount`, so read staking data from `account.stakingResources` instead of `account.solanaResources`. A stake is a `StakingDelegation` or a `StakingUnbonding` (`SolanaStakingPosition`) rather than a `SolanaStake`: its stake account address is `positionId`, its validator is `validatorAddress`, and the former `activation.active` / `activation.inactive` / `withdrawable` fields are `activeAmount` / `inactiveAmount` / `withdrawableAmount`. `listSolanaStakingPositions`, `solanaActivationState` and `stakeActions` from `@ledgerhq/coin-solana/logic` cover the common access patterns. Accounts already persisted with a `solanaResources` blob are migrated on hydration, so no resync is needed.

  `@ledgerhq/types-live` gains `StakingPositionDetails`, mixed into `StakingDelegation` and `StakingUnbonding` for chains that materialize each position as its own on-chain account, plus `actionFeeReserve` on `StakingResources`. Both are optional, so other chains are unaffected.

  `@ledgerhq/wallet-cli`'s `earn positions` output changes shape: on `EarnSolanaStake`, `stakeBalance` and `withdrawable` go from `number` to an integer decimal string, so lamport amounts above `Number.MAX_SAFE_INTEGER` stay exact. Anything reading those two fields numerically needs updating.

  `@ledgerhq/ledger-wallet-framework` now exports the generic `StakingResources` serializer (`toStakingResourcesRaw`, `fromStakingResourcesRaw`, `assignStakingResourcesToAccountRaw`, `assignStakingResourcesFromAccountRaw`), moved out of the EVM family in `live-common` so every coin module can use it.

## 6.121.0

### Minor Changes

- [#20887](https://github.com/LedgerHQ/ledger-live/pull/20887) [`aa39333`](https://github.com/LedgerHQ/ledger-live/commit/aa393339789242783b168398cb5122a7f1e3f620) Thanks [@fAnselmi-Ledger](https://github.com/fAnselmi-Ledger)! - Add Solana TXC flag

- [#20782](https://github.com/LedgerHQ/ledger-live/pull/20782) [`6c425e0`](https://github.com/LedgerHQ/ledger-live/commit/6c425e0e869c6feed4bd4c87ee0fef5443617708) Thanks [@shazzzam](https://github.com/shazzzam)! - Surface ICP neuron staking entry points on mobile: Stake and Manage Neurons account-header actions,
  gated behind the new `llmIcpStaking` feature flag. The StakingFlow and NeuronManageFlow navigators
  are registered as stubs and their screens land separately.

- [#20650](https://github.com/LedgerHQ/ledger-live/pull/20650) [`fbc8036`](https://github.com/LedgerHQ/ledger-live/commit/fbc8036d9bd4e1cc30eea4233f05e8b0498c0e5e) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Add a gRPC-web transport to the Sui coin module

  - `coin-sui` gains a third transport on `sui.rpc.v2` over gRPC-web, covering every capability from
    checkpoints to device signing.
  - New tri-state `suiTransport` feature flag (`json` | `grpc` | `graphql`), defaulting to `json`,
    replaces the boolean `suiGraphqlTransport`, which is removed. An unrecognised value resolves to
    `json`.
  - New env vars `API_SUI_GRPC_PROXY` and `API_SUI_TESTNET_GRPC_PROXY`. `@mysten/sui` 2.9.0 → 2.23.1.
  - Operation `blockHash` carries the real checkpoint digest on gRPC.
  - Fix: account sync read a single page of history on GraphQL and gRPC, capping an account at its
    newest 50 operations for good — sync resumes from the newest stored operation and never re-reads
    what it skipped. Both arms now walk up to `TRANSACTIONS_LIMIT` (300), the depth JSON-RPC reached.
  - Fix: a resumed sync on GraphQL and gRPC read backwards from the tip, so when more than
    `TRANSACTIONS_LIMIT` transactions arrived between two syncs, the ones in the middle were skipped
    and the next sync resumed above them — a permanent hole. Both arms now walk forward from the
    cursor, as the JSON-RPC arm already did, leaving anything unread newer than the next resume point.
  - Fix: an account holding no operations resumed from its stored `syncHash`, so a cleared cache came
    back with only the transactions that arrived after it. Such an account now re-reads its history,
    which is also how one truncated by the bug above recovers. Token operations count as history: they
    live in the subaccounts, so a token-only account is no longer treated as empty.
  - Fix: on gRPC, any failure to resolve a cursor's digest — including a transient network error — was
    read as "unknown digest", which falls back to an unbounded page from the tip and made paging report
    the end of history. Only a `NOT_FOUND` does that now; everything else propagates and is retried.
  - Fix: reading history skipped transactions that shared a checkpoint with the resume point, in
    account sync (`getOperations`) as well as paging (`getListOperations`).
  - Fix: paging inferred "more to come" from how many operations survived client-side filtering, which
    ended the walk early. GraphQL now reads `pageInfo`, gRPC the stream's `QueryEnd` reason. A page
    whose transactions were all filtered out now resumes from the page's own boundary instead of
    reporting the end of history.
  - Fix: a gRPC history record with no timestamp became an operation dated 1970 that could not serve as
    a pagination cursor. Those records are now dropped, as the GraphQL arm already did.
  - Fix: ascending paging on GraphQL returned the newest slice of the range instead of walking forward
    from the oldest.
  - Fix: the Sui fetcher dropped `X-Ledger-Client-Version` and all gRPC-web headers when passed a
    `Headers` instance.
  - Fix: GraphQL resolved the latest checkpoint in two queries, so the second could answer null. It is
    now one query.
  - A checkpoint missing its `digest` or `timestamp` now raises on both GraphQL and gRPC, instead of
    reporting a block with an empty hash and a 1970 timestamp.
  - Known limitation: `getListOperations` resumes from a synthesised `timestamp:digest` cursor, so
    within one checkpoint a sibling whose digest sorts earlier can be skipped, and a checkpoint holding
    more than one page is stepped over rather than resumed inside. Account sync is unaffected: it
    resumes from the server's own watermark cursor.

## 6.121.0-next.0

### Minor Changes

- [#20887](https://github.com/LedgerHQ/ledger-live/pull/20887) [`aa39333`](https://github.com/LedgerHQ/ledger-live/commit/aa393339789242783b168398cb5122a7f1e3f620) Thanks [@fAnselmi-Ledger](https://github.com/fAnselmi-Ledger)! - Add Solana TXC flag

- [#20782](https://github.com/LedgerHQ/ledger-live/pull/20782) [`6c425e0`](https://github.com/LedgerHQ/ledger-live/commit/6c425e0e869c6feed4bd4c87ee0fef5443617708) Thanks [@shazzzam](https://github.com/shazzzam)! - Surface ICP neuron staking entry points on mobile: Stake and Manage Neurons account-header actions,
  gated behind the new `llmIcpStaking` feature flag. The StakingFlow and NeuronManageFlow navigators
  are registered as stubs and their screens land separately.

- [#20650](https://github.com/LedgerHQ/ledger-live/pull/20650) [`fbc8036`](https://github.com/LedgerHQ/ledger-live/commit/fbc8036d9bd4e1cc30eea4233f05e8b0498c0e5e) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Add a gRPC-web transport to the Sui coin module

  - `coin-sui` gains a third transport on `sui.rpc.v2` over gRPC-web, covering every capability from
    checkpoints to device signing.
  - New tri-state `suiTransport` feature flag (`json` | `grpc` | `graphql`), defaulting to `json`,
    replaces the boolean `suiGraphqlTransport`, which is removed. An unrecognised value resolves to
    `json`.
  - New env vars `API_SUI_GRPC_PROXY` and `API_SUI_TESTNET_GRPC_PROXY`. `@mysten/sui` 2.9.0 → 2.23.1.
  - Operation `blockHash` carries the real checkpoint digest on gRPC.
  - Fix: account sync read a single page of history on GraphQL and gRPC, capping an account at its
    newest 50 operations for good — sync resumes from the newest stored operation and never re-reads
    what it skipped. Both arms now walk up to `TRANSACTIONS_LIMIT` (300), the depth JSON-RPC reached.
  - Fix: a resumed sync on GraphQL and gRPC read backwards from the tip, so when more than
    `TRANSACTIONS_LIMIT` transactions arrived between two syncs, the ones in the middle were skipped
    and the next sync resumed above them — a permanent hole. Both arms now walk forward from the
    cursor, as the JSON-RPC arm already did, leaving anything unread newer than the next resume point.
  - Fix: an account holding no operations resumed from its stored `syncHash`, so a cleared cache came
    back with only the transactions that arrived after it. Such an account now re-reads its history,
    which is also how one truncated by the bug above recovers. Token operations count as history: they
    live in the subaccounts, so a token-only account is no longer treated as empty.
  - Fix: on gRPC, any failure to resolve a cursor's digest — including a transient network error — was
    read as "unknown digest", which falls back to an unbounded page from the tip and made paging report
    the end of history. Only a `NOT_FOUND` does that now; everything else propagates and is retried.
  - Fix: reading history skipped transactions that shared a checkpoint with the resume point, in
    account sync (`getOperations`) as well as paging (`getListOperations`).
  - Fix: paging inferred "more to come" from how many operations survived client-side filtering, which
    ended the walk early. GraphQL now reads `pageInfo`, gRPC the stream's `QueryEnd` reason. A page
    whose transactions were all filtered out now resumes from the page's own boundary instead of
    reporting the end of history.
  - Fix: a gRPC history record with no timestamp became an operation dated 1970 that could not serve as
    a pagination cursor. Those records are now dropped, as the GraphQL arm already did.
  - Fix: ascending paging on GraphQL returned the newest slice of the range instead of walking forward
    from the oldest.
  - Fix: the Sui fetcher dropped `X-Ledger-Client-Version` and all gRPC-web headers when passed a
    `Headers` instance.
  - Fix: GraphQL resolved the latest checkpoint in two queries, so the second could answer null. It is
    now one query.
  - A checkpoint missing its `digest` or `timestamp` now raises on both GraphQL and gRPC, instead of
    reporting a block with an empty hash and a 1970 timestamp.
  - Known limitation: `getListOperations` resumes from a synthesised `timestamp:digest` cursor, so
    within one checkpoint a sibling whose digest sorts earlier can be skipped, and a checkpoint holding
    more than one page is stepped over rather than resumed inside. Account sync is unaffected: it
    resumes from the server's own watermark cursor.

## 6.120.0

### Minor Changes

- [#20907](https://github.com/LedgerHQ/ledger-live/pull/20907) [`da0a5ce`](https://github.com/LedgerHQ/ledger-live/commit/da0a5ceb8f889f1bace45ed2d3d4c640cdf24ca8) Thanks [@fAnselmi-Ledger](https://github.com/fAnselmi-Ledger)! - Add Solana TXC flag

- [#20719](https://github.com/LedgerHQ/ledger-live/pull/20719) [`5b39a67`](https://github.com/LedgerHQ/ledger-live/commit/5b39a67dd93d4c541a77b0b146881073ca00ed15) Thanks [@sarneijim](https://github.com/sarneijim)! - Drive desktop LNS upsell banners from `largeScreenUpsell` and remove the legacy `lldNanoSUpsellBanners` flag (LIVE-35487).

- [#20630](https://github.com/LedgerHQ/ledger-live/pull/20630) [`0807eca`](https://github.com/LedgerHQ/ledger-live/commit/0807ecacfd06057811a3d6f8845b9f4bfc6f693c) Thanks [@sarneijim](https://github.com/sarneijim)! - Enable LNS upsell portfolio banner for opted-in users (LIVE-32086).

## 6.120.0-next.1

### Minor Changes

- [#20907](https://github.com/LedgerHQ/ledger-live/pull/20907) [`da0a5ce`](https://github.com/LedgerHQ/ledger-live/commit/da0a5ceb8f889f1bace45ed2d3d4c640cdf24ca8) Thanks [@fAnselmi-Ledger](https://github.com/fAnselmi-Ledger)! - Add Solana TXC flag

## 6.120.0-next.0

### Minor Changes

- [#20719](https://github.com/LedgerHQ/ledger-live/pull/20719) [`5b39a67`](https://github.com/LedgerHQ/ledger-live/commit/5b39a67dd93d4c541a77b0b146881073ca00ed15) Thanks [@sarneijim](https://github.com/sarneijim)! - Drive desktop LNS upsell banners from `largeScreenUpsell` and remove the legacy `lldNanoSUpsellBanners` flag (LIVE-35487).

- [#20630](https://github.com/LedgerHQ/ledger-live/pull/20630) [`0807eca`](https://github.com/LedgerHQ/ledger-live/commit/0807ecacfd06057811a3d6f8845b9f4bfc6f693c) Thanks [@sarneijim](https://github.com/sarneijim)! - Enable LNS upsell portfolio banner for opted-in users (LIVE-32086).

## 6.119.0

### Minor Changes

- [#20207](https://github.com/LedgerHQ/ledger-live/pull/20207) [`aee0e64`](https://github.com/LedgerHQ/ledger-live/commit/aee0e64b491aafc1ca8fea16b1ef124cb183770b) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Add Internet Computer (ICP) neuron staking to the coin module: create and top up neurons, start/stop dissolving, disburse, set/increase dissolve delay, follow, split, spawn, stake maturity, and add/remove hot keys, plus neuron listing. Governance operations are routed through the NNS governance canister via the device's update-call signing, alongside the existing ledger transfer path, and account synchronization now carries neuron data. Adds the `STAKE_NEURON` and `TOP_UP_NEURON` operation types, with matching icons and labels in the desktop and mobile operation history. (LIVE-28469)

- [#20574](https://github.com/LedgerHQ/ledger-live/pull/20574) [`1e9db75`](https://github.com/LedgerHQ/ledger-live/commit/1e9db750a4882f9db7f95278e33c00262487b37b) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Move these packages from `libs/ledgerjs/packages/` up to `libs/`. The remaining LedgerJS packages stay in place until they are extracted to the ts-libs repository.

- [#20430](https://github.com/LedgerHQ/ledger-live/pull/20430) [`647804e`](https://github.com/LedgerHQ/ledger-live/commit/647804ee755d54776e6b8cd96328bee89fb035e4) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Move the recent-addresses domain model and in-memory store into `@domain/entity-recent-addresses`

  `RecentAddress` and `RecentAddressesState` are no longer declared in `@ledgerhq/types-live`; they are now inferred from the Zod schemas in `@domain/entity-recent-addresses`, which also owns `RecentAddressesStore`, `setupRecentAddressesStore` and `getRecentAddressesStore`. Import them from `@domain/entity-recent-addresses`.

  `@ledgerhq/live-common/account/index` still re-exports the store API unchanged, minus the `RecentAddressesCache` alias — use `RecentAddressesState` instead.

  Also fixes the store mutating its own state in place: once a first mutation had been dispatched, immer had frozen that exact object graph, so the next `addAddress` or `removeAddress` on the same currency threw `TypeError: Cannot assign to read only property`. The store now replaces its state instead of mutating it.

- [#19645](https://github.com/LedgerHQ/ledger-live/pull/19645) [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152) Thanks [@amaslakov](https://github.com/amaslakov)! - Add an optional `readiness` attribute to the base `Account` type (`{ ready: boolean; reason?: string }`), a generic cross-chain projection of whether an account is fully operational. It is persisted through account serialization and populated during sync via a new optional `BridgeApi.getAccountReadiness` hook. Tezos implements the hook: an account whose public key is not revealed on-chain is reported as `{ ready: false, reason: "unrevealed" }`. Families that do not provide the hook leave `readiness` undefined. coin-tezos `getAccountByAddress` now coalesces concurrent same-address calls into a single request, so surfacing readiness during sync adds no redundant tzkt call.

## 6.119.0-next.0

### Minor Changes

- [#20207](https://github.com/LedgerHQ/ledger-live/pull/20207) [`aee0e64`](https://github.com/LedgerHQ/ledger-live/commit/aee0e64b491aafc1ca8fea16b1ef124cb183770b) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Add Internet Computer (ICP) neuron staking to the coin module: create and top up neurons, start/stop dissolving, disburse, set/increase dissolve delay, follow, split, spawn, stake maturity, and add/remove hot keys, plus neuron listing. Governance operations are routed through the NNS governance canister via the device's update-call signing, alongside the existing ledger transfer path, and account synchronization now carries neuron data. Adds the `STAKE_NEURON` and `TOP_UP_NEURON` operation types, with matching icons and labels in the desktop and mobile operation history. (LIVE-28469)

- [#20574](https://github.com/LedgerHQ/ledger-live/pull/20574) [`1e9db75`](https://github.com/LedgerHQ/ledger-live/commit/1e9db750a4882f9db7f95278e33c00262487b37b) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Move these packages from `libs/ledgerjs/packages/` up to `libs/`. The remaining LedgerJS packages stay in place until they are extracted to the ts-libs repository.

- [#20430](https://github.com/LedgerHQ/ledger-live/pull/20430) [`647804e`](https://github.com/LedgerHQ/ledger-live/commit/647804ee755d54776e6b8cd96328bee89fb035e4) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Move the recent-addresses domain model and in-memory store into `@domain/entity-recent-addresses`

  `RecentAddress` and `RecentAddressesState` are no longer declared in `@ledgerhq/types-live`; they are now inferred from the Zod schemas in `@domain/entity-recent-addresses`, which also owns `RecentAddressesStore`, `setupRecentAddressesStore` and `getRecentAddressesStore`. Import them from `@domain/entity-recent-addresses`.

  `@ledgerhq/live-common/account/index` still re-exports the store API unchanged, minus the `RecentAddressesCache` alias — use `RecentAddressesState` instead.

  Also fixes the store mutating its own state in place: once a first mutation had been dispatched, immer had frozen that exact object graph, so the next `addAddress` or `removeAddress` on the same currency threw `TypeError: Cannot assign to read only property`. The store now replaces its state instead of mutating it.

- [#19645](https://github.com/LedgerHQ/ledger-live/pull/19645) [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152) Thanks [@amaslakov](https://github.com/amaslakov)! - Add an optional `readiness` attribute to the base `Account` type (`{ ready: boolean; reason?: string }`), a generic cross-chain projection of whether an account is fully operational. It is persisted through account serialization and populated during sync via a new optional `BridgeApi.getAccountReadiness` hook. Tezos implements the hook: an account whose public key is not revealed on-chain is reported as `{ ready: false, reason: "unrevealed" }`. Families that do not provide the hook leave `readiness` undefined. coin-tezos `getAccountByAddress` now coalesces concurrent same-address calls into a single request, so surfacing readiness during sync adds no redundant tzkt call.

## 6.118.0

### Minor Changes

- [#20093](https://github.com/LedgerHQ/ledger-live/pull/20093) [`56cfe0b`](https://github.com/LedgerHQ/ledger-live/commit/56cfe0bc6673f416f739c1593abfec718230952d) Thanks [@sarneijim](https://github.com/sarneijim)! - Use the shared large-screen upsell configuration and eligibility for mobile upgrade banners.

- [#20256](https://github.com/LedgerHQ/ledger-live/pull/20256) [`a464f7d`](https://github.com/LedgerHQ/ledger-live/commit/a464f7d6092607ff6b81aa6ec0cd29ef6cfcf35a) Thanks [@ysitbon](https://github.com/ysitbon)! - Own the currency type declarations internally instead of importing them from the now-deleted `@ledgerhq/types-cryptoassets`.

  `@ledgerhq/types-live` was the last consumer of that package, which it pulled in as a `devDependency` even though the emitted `.d.ts` referenced it — so external consumers had to resolve a phantom dependency to type-check `Account.currency`. The declarations now live in `src/currency.ts`.

  These types are internal: they are not re-exported from the package entry point, and the `./currency` subpath is blocked in `exports`, so they cannot be imported from outside. They are marked `@deprecated` and exist only until the types that carry them move to the domain packages. Use `@domain/entity-currency-crypto`, `@domain/entity-currency-token`, `@domain/entity-currency-unit` and `@domain/entity-currency`.

  The exported type surface is unchanged: `CryptoCurrency`, `TokenCurrency`, `CryptoOrTokenCurrency` and `Unit` keep the exact shapes they had, so every signature that mentions them is structurally identical.

  `FiatCurrency`, `Currency` and `CryptoCurrencyId` were not carried over — nothing in `types-live` used them. Import them from `@domain/entity-currency-fiat`, `@domain/entity-currency` and `@shared/schema-primitives` respectively.

- [#20339](https://github.com/LedgerHQ/ledger-live/pull/20339) [`6a531c5`](https://github.com/LedgerHQ/ledger-live/commit/6a531c54ccd1c65df122286de6f136f9d73b9002) Thanks [@qperrot](https://github.com/qperrot)! - Remove Scroll Sepolia testnet support as it is no longer maintained

- [#19645](https://github.com/LedgerHQ/ledger-live/pull/19645) [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152) Thanks [@amaslakov](https://github.com/amaslakov)! - Add an optional `readiness` attribute to the base `Account` type (`{ ready: boolean; reason?: string }`), a generic cross-chain projection of whether an account is fully operational. It is persisted through account serialization and populated during sync via a new optional `BridgeApi.getAccountReadiness` hook. Tezos implements the hook: an account whose public key is not revealed on-chain is reported as `{ ready: false, reason: "unrevealed" }`. Families that do not provide the hook leave `readiness` undefined. coin-tezos `getAccountByAddress` now coalesces concurrent same-address calls into a single request, so surfacing readiness during sync adds no redundant tzkt call.

## 6.118.0-next.0

### Minor Changes

- [#20093](https://github.com/LedgerHQ/ledger-live/pull/20093) [`56cfe0b`](https://github.com/LedgerHQ/ledger-live/commit/56cfe0bc6673f416f739c1593abfec718230952d) Thanks [@sarneijim](https://github.com/sarneijim)! - Use the shared large-screen upsell configuration and eligibility for mobile upgrade banners.

- [#20256](https://github.com/LedgerHQ/ledger-live/pull/20256) [`a464f7d`](https://github.com/LedgerHQ/ledger-live/commit/a464f7d6092607ff6b81aa6ec0cd29ef6cfcf35a) Thanks [@ysitbon](https://github.com/ysitbon)! - Own the currency type declarations internally instead of importing them from the now-deleted `@ledgerhq/types-cryptoassets`.

  `@ledgerhq/types-live` was the last consumer of that package, which it pulled in as a `devDependency` even though the emitted `.d.ts` referenced it — so external consumers had to resolve a phantom dependency to type-check `Account.currency`. The declarations now live in `src/currency.ts`.

  These types are internal: they are not re-exported from the package entry point, and the `./currency` subpath is blocked in `exports`, so they cannot be imported from outside. They are marked `@deprecated` and exist only until the types that carry them move to the domain packages. Use `@domain/entity-currency-crypto`, `@domain/entity-currency-token`, `@domain/entity-currency-unit` and `@domain/entity-currency`.

  The exported type surface is unchanged: `CryptoCurrency`, `TokenCurrency`, `CryptoOrTokenCurrency` and `Unit` keep the exact shapes they had, so every signature that mentions them is structurally identical.

  `FiatCurrency`, `Currency` and `CryptoCurrencyId` were not carried over — nothing in `types-live` used them. Import them from `@domain/entity-currency-fiat`, `@domain/entity-currency` and `@shared/schema-primitives` respectively.

- [#20339](https://github.com/LedgerHQ/ledger-live/pull/20339) [`6a531c5`](https://github.com/LedgerHQ/ledger-live/commit/6a531c54ccd1c65df122286de6f136f9d73b9002) Thanks [@qperrot](https://github.com/qperrot)! - Remove Scroll Sepolia testnet support as it is no longer maintained

- [#19645](https://github.com/LedgerHQ/ledger-live/pull/19645) [`53c3431`](https://github.com/LedgerHQ/ledger-live/commit/53c3431e01b3139ef689cb589bab0adee4ed6152) Thanks [@amaslakov](https://github.com/amaslakov)! - Add an optional `readiness` attribute to the base `Account` type (`{ ready: boolean; reason?: string }`), a generic cross-chain projection of whether an account is fully operational. It is persisted through account serialization and populated during sync via a new optional `BridgeApi.getAccountReadiness` hook. Tezos implements the hook: an account whose public key is not revealed on-chain is reported as `{ ready: false, reason: "unrevealed" }`. Families that do not provide the hook leave `readiness` undefined. coin-tezos `getAccountByAddress` now coalesces concurrent same-address calls into a single request, so surfacing readiness during sync adds no redundant tzkt call.

## 6.117.0

### Minor Changes

- [#20073](https://github.com/LedgerHQ/ledger-live/pull/20073) [`a534db5`](https://github.com/LedgerHQ/ledger-live/commit/a534db5c41da6957d38a330c1da6f7db1b693763) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Remove newsfeedPage feature flag (LIVE-31511)

- [#20054](https://github.com/LedgerHQ/ledger-live/pull/20054) [`c622459`](https://github.com/LedgerHQ/ledger-live/commit/c622459fcbff5dcc094ee10eb360f2a835036007) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Remove the disabled npsRatingsPrompt feature flag and NPS ratings dead code on mobile

- [#20072](https://github.com/LedgerHQ/ledger-live/pull/20072) [`524d763`](https://github.com/LedgerHQ/ledger-live/commit/524d7636d85a79379a9b086323d3121f3199bd1f) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Remove deprecated storyly feature flag, types, and orphaned i18n keys.

- [#20114](https://github.com/LedgerHQ/ledger-live/pull/20114) [`dbf8acf`](https://github.com/LedgerHQ/ledger-live/commit/dbf8acf27c9405548e7eb559d163a8e0883a20aa) Thanks [@semeano](https://github.com/semeano)! - Add Ironwood support to Zcash

## 6.117.0-next.0

### Minor Changes

- [#20073](https://github.com/LedgerHQ/ledger-live/pull/20073) [`a534db5`](https://github.com/LedgerHQ/ledger-live/commit/a534db5c41da6957d38a330c1da6f7db1b693763) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Remove newsfeedPage feature flag (LIVE-31511)

- [#20054](https://github.com/LedgerHQ/ledger-live/pull/20054) [`c622459`](https://github.com/LedgerHQ/ledger-live/commit/c622459fcbff5dcc094ee10eb360f2a835036007) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Remove the disabled npsRatingsPrompt feature flag and NPS ratings dead code on mobile

- [#20072](https://github.com/LedgerHQ/ledger-live/pull/20072) [`524d763`](https://github.com/LedgerHQ/ledger-live/commit/524d7636d85a79379a9b086323d3121f3199bd1f) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Remove deprecated storyly feature flag, types, and orphaned i18n keys.

- [#20114](https://github.com/LedgerHQ/ledger-live/pull/20114) [`dbf8acf`](https://github.com/LedgerHQ/ledger-live/commit/dbf8acf27c9405548e7eb559d163a8e0883a20aa) Thanks [@semeano](https://github.com/semeano)! - Add Ironwood support to Zcash

## 6.116.0

### Minor Changes

- [#19762](https://github.com/LedgerHQ/ledger-live/pull/19762) [`cdf6cf4`](https://github.com/LedgerHQ/ledger-live/commit/cdf6cf40d658b20dd21a7eabe3615c75baf4cb0a) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: limit aleo swaps to public balance only

- [#19738](https://github.com/LedgerHQ/ledger-live/pull/19738) [`22d4a88`](https://github.com/LedgerHQ/ledger-live/commit/22d4a888228b7e5409593a2d6af072b4ab07bb07) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-evm): store delegation shares

- [#19702](https://github.com/LedgerHQ/ledger-live/pull/19702) [`6935fe0`](https://github.com/LedgerHQ/ledger-live/commit/6935fe04a6304e046fd217350399446194e96d47) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Add HyperCore support by plugging `@ledgerhq/coin-hypercore` into the generic coin framework: register the `hypercore` native currency (USDC, magnitude 6), route the family through the generic bridge, reuse the EVM signer for address derivation (HyperCore shares the Ethereum address), and add the `currencyHypercore` feature flag. HyperCore accounts can be discovered and serve their balance and operations from the coin module. In the history, HyperCore operations are labelled "Deposit"/"Withdraw" instead of "Received"/"Sent" (deposits/withdrawals go through bridging, not a plain transfer).

- [#19734](https://github.com/LedgerHQ/ledger-live/pull/19734) [`bb2d2d2`](https://github.com/LedgerHQ/ledger-live/commit/bb2d2d250a1d5b8cde43ba963795d28b10b48be6) Thanks [@ishaba](https://github.com/ishaba)! - remove umee chain related code

- [#18413](https://github.com/LedgerHQ/ledger-live/pull/18413) [`c498e25`](https://github.com/LedgerHQ/ledger-live/commit/c498e25ca9f4b6ef5c4e3dfd370dab44ccdebc0f) Thanks [@sarneijim](https://github.com/sarneijim)! - Remove lldActionCarousel feature flag (always enabled with variant A)

## 6.116.0-next.0

### Minor Changes

- [#19762](https://github.com/LedgerHQ/ledger-live/pull/19762) [`cdf6cf4`](https://github.com/LedgerHQ/ledger-live/commit/cdf6cf40d658b20dd21a7eabe3615c75baf4cb0a) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - feat: limit aleo swaps to public balance only

- [#19738](https://github.com/LedgerHQ/ledger-live/pull/19738) [`22d4a88`](https://github.com/LedgerHQ/ledger-live/commit/22d4a888228b7e5409593a2d6af072b4ab07bb07) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - chore(coin-evm): store delegation shares

- [#19702](https://github.com/LedgerHQ/ledger-live/pull/19702) [`6935fe0`](https://github.com/LedgerHQ/ledger-live/commit/6935fe04a6304e046fd217350399446194e96d47) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Add HyperCore support by plugging `@ledgerhq/coin-hypercore` into the generic coin framework: register the `hypercore` native currency (USDC, magnitude 6), route the family through the generic bridge, reuse the EVM signer for address derivation (HyperCore shares the Ethereum address), and add the `currencyHypercore` feature flag. HyperCore accounts can be discovered and serve their balance and operations from the coin module. In the history, HyperCore operations are labelled "Deposit"/"Withdraw" instead of "Received"/"Sent" (deposits/withdrawals go through bridging, not a plain transfer).

- [#19734](https://github.com/LedgerHQ/ledger-live/pull/19734) [`bb2d2d2`](https://github.com/LedgerHQ/ledger-live/commit/bb2d2d250a1d5b8cde43ba963795d28b10b48be6) Thanks [@ishaba](https://github.com/ishaba)! - remove umee chain related code

- [#18413](https://github.com/LedgerHQ/ledger-live/pull/18413) [`c498e25`](https://github.com/LedgerHQ/ledger-live/commit/c498e25ca9f4b6ef5c4e3dfd370dab44ccdebc0f) Thanks [@sarneijim](https://github.com/sarneijim)! - Remove lldActionCarousel feature flag (always enabled with variant A)

## 6.115.0

### Minor Changes

- [#19217](https://github.com/LedgerHQ/ledger-live/pull/19217) [`e26e68e`](https://github.com/LedgerHQ/ledger-live/commit/e26e68e854ecea6ebbe5e26196c8d8e899329c7d) Thanks [@qperrot](https://github.com/qperrot)! - families/bitcoin/bridgeExtensions.ts now implements the full edit-transaction contract: getEditTransactionPatch, getEditTransactionStatus, getFormattedFeeFields, hasMinimumFundsToCancel, hasMinimumFundsToSpeedUp, isStrategyDisabled, isTransactionConfirmed.
  The Bitcoin edit-transaction helpers (RBF replace/cancel, fee formatting, strategy validation) live under ledger-live-common/src/families/bitcoin/editTransaction/, with unit tests.
  Desktop & mobile Bitcoin edit flows (Body.tsx, StepFees, StepMethod, MethodSelection, EditTransactionSummary) reach these helpers through getAccountBridge(account) instead of importing them directly.

  hasMinimumFundsToCancel / hasMinimumFundsToSpeedUp now return Promise<boolean>. Bitcoin's minimum-funds checks are inherently async (RBF fee lookup) and all call sites already await them; EVM's implementations were updated accordingly.

  Bitcoin's isStrategyDisabled uses a slightly different shape than the generic contract, adapted via a thin wrapper (same pattern as EVM): it maps the contract's feeData to Bitcoin's feesStrategy, and its transaction param was widened to accept the real (nullable) feePerByte with a guard. isTransactionConfirmed follows the { account, hash } contract signature directly.

- [#19333](https://github.com/LedgerHQ/ledger-live/pull/19333) [`bde85a7`](https://github.com/LedgerHQ/ledger-live/commit/bde85a7ef50cf7990efd2f9bcd7ccc34c0764fb7) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Deprecate `preload` and `hydrate` on `CurrencyBridge` interface — both methods are now optional. Prefer loading data lazily in UI flows instead of eagerly via these methods.

- [#19351](https://github.com/LedgerHQ/ledger-live/pull/19351) [`d631f0d`](https://github.com/LedgerHQ/ledger-live/commit/d631f0dd2480950c5f20dec0c9b4aca515ec63f8) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Drop @ledgerhq/client-ids dep by inlining a DeviceId interface

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->

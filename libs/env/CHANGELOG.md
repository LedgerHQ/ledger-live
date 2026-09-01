# @ledgerhq/live-env

## 3.2.0-next.0

### Minor Changes

- [#21124](https://github.com/LedgerHQ/ledger-live/pull/21124) [`e21305a`](https://github.com/LedgerHQ/ledger-live/commit/e21305abce18f0a9408bf6c0e2bb47d5c992e06a) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Make getEnv and getEnvDefault throw when the name is not in injected definitions

## 3.1.0

### Minor Changes

- [#20998](https://github.com/LedgerHQ/ledger-live/pull/20998) [`8161bac`](https://github.com/LedgerHQ/ledger-live/commit/8161bac542474212dfefc8519e714da345b03f71) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - chore: move hedera envs directly to config

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

- [#20955](https://github.com/LedgerHQ/ledger-live/pull/20955) [`39a676d`](https://github.com/LedgerHQ/ledger-live/commit/39a676d2f861d04913264e61100205b4f6044cf9) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix: move hedera envs to config/constants

## 3.1.0-next.0

### Minor Changes

- [#20998](https://github.com/LedgerHQ/ledger-live/pull/20998) [`8161bac`](https://github.com/LedgerHQ/ledger-live/commit/8161bac542474212dfefc8519e714da345b03f71) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - chore: move hedera envs directly to config

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

- [#20955](https://github.com/LedgerHQ/ledger-live/pull/20955) [`39a676d`](https://github.com/LedgerHQ/ledger-live/commit/39a676d2f861d04913264e61100205b4f6044cf9) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - fix: move hedera envs to config/constants

## 3.0.0

### Major Changes

- [#20076](https://github.com/LedgerHQ/ledger-live/pull/20076) [`c475d28`](https://github.com/LedgerHQ/ledger-live/commit/c475d288b4978aa3011c9e76f3e9a1e2f9733010) Thanks [@gre-ledger](https://github.com/gre-ledger)! - **Breaking change**: all env API functions (`getEnv`, `setEnv`, `setEnvUnsafe`, `getEnvDefault`, `getAllEnvs`, `getAllEnvNames`, `getDefinition`, `getEnvDesc`, `isEnvDefault`) now throw if called before `injectDefinitions()`.

  Previously, `@ledgerhq/live-env` bundled ~200 env var definitions and made them available on import. The definitions have been extracted into the new workspace-private `@shared/env` package. The framework layer (`@ledgerhq/live-env`) is now definition-free and requires an explicit bootstrap call.

  **Migration for app consumers** — switch to `@shared/env` (recommended):

  ```ts
  // before
  import { getEnv } from "@ledgerhq/live-env";

  // after
  import { getEnv } from "@shared/env"; // auto-calls injectDefinitions at import time
  ```

  **Migration for published libs** that need `@ledgerhq/live-env` directly (e.g. test setup):

  ```ts
  import { injectDefinitions, stringParser } from "@ledgerhq/live-env";

  injectDefinitions({
    MY_VAR: { def: "default", parser: stringParser, desc: "..." },
  });
  // now getEnv / setEnv work
  ```

  New exports: `injectDefinitions`, `EnvDef<T>`, `EnvDefs`, `EnvChange`, and all parser helpers (`intParser`, `floatParser`, `boolParser`, `stringParser`, `jsonParser`, `stringArrayParser`).

## 3.0.0-next.0

### Major Changes

- [#20076](https://github.com/LedgerHQ/ledger-live/pull/20076) [`c475d28`](https://github.com/LedgerHQ/ledger-live/commit/c475d288b4978aa3011c9e76f3e9a1e2f9733010) Thanks [@gre-ledger](https://github.com/gre-ledger)! - **Breaking change**: all env API functions (`getEnv`, `setEnv`, `setEnvUnsafe`, `getEnvDefault`, `getAllEnvs`, `getAllEnvNames`, `getDefinition`, `getEnvDesc`, `isEnvDefault`) now throw if called before `injectDefinitions()`.

  Previously, `@ledgerhq/live-env` bundled ~200 env var definitions and made them available on import. The definitions have been extracted into the new workspace-private `@shared/env` package. The framework layer (`@ledgerhq/live-env`) is now definition-free and requires an explicit bootstrap call.

  **Migration for app consumers** — switch to `@shared/env` (recommended):

  ```ts
  // before
  import { getEnv } from "@ledgerhq/live-env";

  // after
  import { getEnv } from "@shared/env"; // auto-calls injectDefinitions at import time
  ```

  **Migration for published libs** that need `@ledgerhq/live-env` directly (e.g. test setup):

  ```ts
  import { injectDefinitions, stringParser } from "@ledgerhq/live-env";

  injectDefinitions({
    MY_VAR: { def: "default", parser: stringParser, desc: "..." },
  });
  // now getEnv / setEnv work
  ```

  New exports: `injectDefinitions`, `EnvDef<T>`, `EnvDefs`, `EnvChange`, and all parser helpers (`intParser`, `floatParser`, `boolParser`, `stringParser`, `jsonParser`, `stringArrayParser`).

## 2.42.0

### Minor Changes

- [#19439](https://github.com/LedgerHQ/ledger-live/pull/19439) [`a15b864`](https://github.com/LedgerHQ/ledger-live/commit/a15b864576d901f15d480070b475314c3b23c1dd) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Update default values for `CAL_SERVICE_URL` and `CAL_SERVICE_URL_STAGING` to the Gravitee gateway URLs (`https://global.api.prd.ledger.com/cal` and `https://global.api.stg.ledger-test.com/cal`).

- [#19507](https://github.com/LedgerHQ/ledger-live/pull/19507) [`fc44f1e`](https://github.com/LedgerHQ/ledger-live/commit/fc44f1e6ddcca939c117e0cb8bc49c404163b003) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(solana): update default validators summary base url for prod

## 2.42.0-next.0

### Minor Changes

- [#19439](https://github.com/LedgerHQ/ledger-live/pull/19439) [`a15b864`](https://github.com/LedgerHQ/ledger-live/commit/a15b864576d901f15d480070b475314c3b23c1dd) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Update default values for `CAL_SERVICE_URL` and `CAL_SERVICE_URL_STAGING` to the Gravitee gateway URLs (`https://global.api.prd.ledger.com/cal` and `https://global.api.stg.ledger-test.com/cal`).

- [#19507](https://github.com/LedgerHQ/ledger-live/pull/19507) [`fc44f1e`](https://github.com/LedgerHQ/ledger-live/commit/fc44f1e6ddcca939c117e0cb8bc49c404163b003) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(solana): update default validators summary base url for prod

## 2.41.0

### Minor Changes

- [#19231](https://github.com/LedgerHQ/ledger-live/pull/19231) [`70a706e`](https://github.com/LedgerHQ/ledger-live/commit/70a706e4efe3a6fa176f9827a4a06949ba185f11) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Remove unused USE_LEARN_STAGING_URL env var

## 2.41.0-next.0

### Minor Changes

- [#19231](https://github.com/LedgerHQ/ledger-live/pull/19231) [`70a706e`](https://github.com/LedgerHQ/ledger-live/commit/70a706e4efe3a6fa176f9827a4a06949ba185f11) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Remove unused USE_LEARN_STAGING_URL env var

## 2.40.0

### Minor Changes

- [#18823](https://github.com/LedgerHQ/ledger-live/pull/18823) [`13aeeb6`](https://github.com/LedgerHQ/ledger-live/commit/13aeeb6186997b433785e542ed1dafa6afde2267) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - chore: remove unused thirdweb code

- [#17970](https://github.com/LedgerHQ/ledger-live/pull/17970) [`798081d`](https://github.com/LedgerHQ/ledger-live/commit/798081db3e427c8d2d09930ceb836703146ca1ba) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Migrate the Polkadot family (mainnet and Westend, relay chain and asset hub) to the new polkadot-rest-api endpoints, served under a `/v1` prefix (`/v1/rc` for the relay chain).

  Adapt the coin-polkadot client to the rest-api, which is not fully 1:1 with substrate-api-sidecar:

  - staking storage queries use `keys[]` only (drop the legacy `key1` query param, rejected by the rest-api);
  - tolerate a missing `ss58Format` in `/runtime/spec` (e.g. Westend Asset Hub) instead of producing `NaN`;
  - parse the new `/transaction/dry-run` response shape (`resultType` at the root, error under `result.error`, plus the `TransactionValidityError` case).

## 2.40.0-next.0

### Minor Changes

- [#18823](https://github.com/LedgerHQ/ledger-live/pull/18823) [`13aeeb6`](https://github.com/LedgerHQ/ledger-live/commit/13aeeb6186997b433785e542ed1dafa6afde2267) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - chore: remove unused thirdweb code

- [#17970](https://github.com/LedgerHQ/ledger-live/pull/17970) [`798081d`](https://github.com/LedgerHQ/ledger-live/commit/798081db3e427c8d2d09930ceb836703146ca1ba) Thanks [@YazhuEth](https://github.com/YazhuEth)! - Migrate the Polkadot family (mainnet and Westend, relay chain and asset hub) to the new polkadot-rest-api endpoints, served under a `/v1` prefix (`/v1/rc` for the relay chain).

  Adapt the coin-polkadot client to the rest-api, which is not fully 1:1 with substrate-api-sidecar:

  - staking storage queries use `keys[]` only (drop the legacy `key1` query param, rejected by the rest-api);
  - tolerate a missing `ss58Format` in `/runtime/spec` (e.g. Westend Asset Hub) instead of producing `NaN`;
  - parse the new `/transaction/dry-run` response shape (`resultType` at the root, error under `result.error`, plus the `TransactionValidityError` case).

## 2.39.0

### Minor Changes

- [#18395](https://github.com/LedgerHQ/ledger-live/pull/18395) [`81ceb34`](https://github.com/LedgerHQ/ledger-live/commit/81ceb347c0b2167358c601a9922e2c7fa14a845b) Thanks [@pawell24](https://github.com/pawell24)! - fix: point aptos testnet endpoints to public aptos backend

- [#18320](https://github.com/LedgerHQ/ledger-live/pull/18320) [`9ab3a61`](https://github.com/LedgerHQ/ledger-live/commit/9ab3a6157abb3a382c3157eb292ce9d9d2c6df93) Thanks [@ishaba](https://github.com/ishaba)! - fix: sui testnet node url update

- [#18256](https://github.com/LedgerHQ/ledger-live/pull/18256) [`eb1dae8`](https://github.com/LedgerHQ/ledger-live/commit/eb1dae8fc14ff8e0bc1e1ce040712492a0328451) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Derive "supported currencies" from the coin-modules registry instead of `setSupportedCurrencies`.

  Each `CoinModuleLoader` now declares a `supportedCoins: CryptoCurrencyId[]` field, and a currency is supported when it appears in a registered loader's `supportedCoins`. The framework `setSupportedCurrencies` / `listSupportedCurrencies` / `isCurrencySupported` and the `EXPERIMENTAL_CURRENCIES` env are removed; `listSupportedCurrencies` / `isCurrencySupported` are now exported from `@ledgerhq/live-common/currencies` backed by the registry. Apps no longer maintain a supported-currencies list — registering the coin modules is what makes their currencies supported.

## 2.39.0-next.0

### Minor Changes

- [#18395](https://github.com/LedgerHQ/ledger-live/pull/18395) [`81ceb34`](https://github.com/LedgerHQ/ledger-live/commit/81ceb347c0b2167358c601a9922e2c7fa14a845b) Thanks [@pawell24](https://github.com/pawell24)! - fix: point aptos testnet endpoints to public aptos backend

- [#18320](https://github.com/LedgerHQ/ledger-live/pull/18320) [`9ab3a61`](https://github.com/LedgerHQ/ledger-live/commit/9ab3a6157abb3a382c3157eb292ce9d9d2c6df93) Thanks [@ishaba](https://github.com/ishaba)! - fix: sui testnet node url update

- [#18256](https://github.com/LedgerHQ/ledger-live/pull/18256) [`eb1dae8`](https://github.com/LedgerHQ/ledger-live/commit/eb1dae8fc14ff8e0bc1e1ce040712492a0328451) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Derive "supported currencies" from the coin-modules registry instead of `setSupportedCurrencies`.

  Each `CoinModuleLoader` now declares a `supportedCoins: CryptoCurrencyId[]` field, and a currency is supported when it appears in a registered loader's `supportedCoins`. The framework `setSupportedCurrencies` / `listSupportedCurrencies` / `isCurrencySupported` and the `EXPERIMENTAL_CURRENCIES` env are removed; `listSupportedCurrencies` / `isCurrencySupported` are now exported from `@ledgerhq/live-common/currencies` backed by the registry. Apps no longer maintain a supported-currencies list — registering the coin modules is what makes their currencies supported.

## 2.38.0

### Minor Changes

- [#18030](https://github.com/LedgerHQ/ledger-live/pull/18030) [`b14d5cc`](https://github.com/LedgerHQ/ledger-live/commit/b14d5cc29cc75c6be2e565db3d4d0ab400cc56d9) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - refactor: unify aleo node endpoint env

- [#18105](https://github.com/LedgerHQ/ledger-live/pull/18105) [`ec38133`](https://github.com/LedgerHQ/ledger-live/commit/ec38133ab6b2c18d329e1c78320b7c2a1f80fbfc) Thanks [@ishaba](https://github.com/ishaba)! - feat: cardano coin module api getValidators

## 2.38.0-next.0

### Minor Changes

- [#18030](https://github.com/LedgerHQ/ledger-live/pull/18030) [`b14d5cc`](https://github.com/LedgerHQ/ledger-live/commit/b14d5cc29cc75c6be2e565db3d4d0ab400cc56d9) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - refactor: unify aleo node endpoint env

- [#18105](https://github.com/LedgerHQ/ledger-live/pull/18105) [`ec38133`](https://github.com/LedgerHQ/ledger-live/commit/ec38133ab6b2c18d329e1c78320b7c2a1f80fbfc) Thanks [@ishaba](https://github.com/ishaba)! - feat: cardano coin module api getValidators

## 2.37.0

### Minor Changes

- [#17648](https://github.com/LedgerHQ/ledger-live/pull/17648) [`5fc817a`](https://github.com/LedgerHQ/ledger-live/commit/5fc817a5ee316396a327e5b10eccd8314bfb2df5) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Add Arc and Arc Testnet (Circle's USDC-native EVM L1, chainIds 5042 and 5042002)

- [#17877](https://github.com/LedgerHQ/ledger-live/pull/17877) [`65f87d9`](https://github.com/LedgerHQ/ledger-live/commit/65f87d938ac4158e0ae706593d2a46561097f5a9) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - refactor: upgrade hedera utils with configOrCurrencyId param

## 2.37.0-next.0

### Minor Changes

- [#17648](https://github.com/LedgerHQ/ledger-live/pull/17648) [`5fc817a`](https://github.com/LedgerHQ/ledger-live/commit/5fc817a5ee316396a327e5b10eccd8314bfb2df5) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Add Arc and Arc Testnet (Circle's USDC-native EVM L1, chainIds 5042 and 5042002)

- [#17877](https://github.com/LedgerHQ/ledger-live/pull/17877) [`65f87d9`](https://github.com/LedgerHQ/ledger-live/commit/65f87d938ac4158e0ae706593d2a46561097f5a9) Thanks [@mdomanski-ext-ledger](https://github.com/mdomanski-ext-ledger)! - refactor: upgrade hedera utils with configOrCurrencyId param

## 2.36.0

### Minor Changes

- [#17517](https://github.com/LedgerHQ/ledger-live/pull/17517) [`2eabd7f`](https://github.com/LedgerHQ/ledger-live/commit/2eabd7f56680e1399926a96b4bdeaf628e435999) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove debug Asset Detail FAB and its `DEBUG_ASSET_DETAIL_FAB` env toggle. Asset/market detail is now reachable from regular navigation entry points.

## 2.36.0-next.0

### Minor Changes

- [#17517](https://github.com/LedgerHQ/ledger-live/pull/17517) [`2eabd7f`](https://github.com/LedgerHQ/ledger-live/commit/2eabd7f56680e1399926a96b4bdeaf628e435999) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove debug Asset Detail FAB and its `DEBUG_ASSET_DETAIL_FAB` env toggle. Asset/market detail is now reachable from regular navigation entry points.

## 2.35.0

### Minor Changes

- [#17096](https://github.com/LedgerHQ/ledger-live/pull/17096) [`abdb866`](https://github.com/LedgerHQ/ledger-live/commit/abdb8662fba3784399a747ece63a11cc4f6e23bb) Thanks [@ishaba](https://github.com/ishaba)! - Add GraphQL read-side transport for Sui (balances, stakes, lastBlock, checkpoint) behind the `suiGraphqlTransport` feature flag.

- [#17236](https://github.com/LedgerHQ/ledger-live/pull/17236) [`5177d5e`](https://github.com/LedgerHQ/ledger-live/commit/5177d5e6311047cc7485a66dbcb8971c9a8c0a5c) Thanks [@deepyjr](https://github.com/deepyjr)! - Add debug FAB toggle to quickly open Asset Detail screen

## 2.35.0-next.0

### Minor Changes

- [#17096](https://github.com/LedgerHQ/ledger-live/pull/17096) [`abdb866`](https://github.com/LedgerHQ/ledger-live/commit/abdb8662fba3784399a747ece63a11cc4f6e23bb) Thanks [@ishaba](https://github.com/ishaba)! - Add GraphQL read-side transport for Sui (balances, stakes, lastBlock, checkpoint) behind the `suiGraphqlTransport` feature flag.

- [#17236](https://github.com/LedgerHQ/ledger-live/pull/17236) [`5177d5e`](https://github.com/LedgerHQ/ledger-live/commit/5177d5e6311047cc7485a66dbcb8971c9a8c0a5c) Thanks [@deepyjr](https://github.com/deepyjr)! - Add debug FAB toggle to quickly open Asset Detail screen

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->

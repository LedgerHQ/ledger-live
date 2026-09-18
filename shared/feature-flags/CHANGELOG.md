# @shared/feature-flags

## 0.23.0-next.0

### Minor Changes

- [#21706](https://github.com/LedgerHQ/ledger-live/pull/21706) [`96a1ca9`](https://github.com/LedgerHQ/ledger-live/commit/96a1ca9fef1b0acc8113708c148890054dea143d) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add excludedCurrencyIds param to lwdContacts and lwmContacts feature flags to exclude specific currencies from Contacts

- [#21656](https://github.com/LedgerHQ/ledger-live/pull/21656) [`85e01c4`](https://github.com/LedgerHQ/ledger-live/commit/85e01c449dab75d75851631a56d292f2cb0c5b36) Thanks [@sarneijim](https://github.com/sarneijim)! - Add the Q3 Wallet V4 Tour feature flag, persisted seen state, mobile debug setup, and Segment wallet40Attributes.q3Tour

- [#21802](https://github.com/LedgerHQ/ledger-live/pull/21802) [`7e44af4`](https://github.com/LedgerHQ/ledger-live/commit/7e44af495eccab1fac4b0808d6729a595b610c69) Thanks [@ysitbon](https://github.com/ysitbon)! - fix(feature-flags): let the middleware prime from a device-local flag cache

  `createFeatureFlagsMiddleware` accepts two new optional callbacks:

  - `readCachedFlags`, read before the first `fetchRemoteFlags` and without any network, so boot
    resolves on the last values the backend actually sent rather than on compiled defaults. The
    prime changes which values boot resolves on, not when readiness is announced: that stays
    with the first fetch settling, so the boot gates keep the meaning they already had. The one
    exception is a middleware given a cache reader and no fetcher, where nothing else would ever
    settle: there the prime re-resolves once and arms the gate itself.
  - `onRemoteFlagsError`, invoked once per failed read with its stage, attempt number and whether
    any values are held yet. Purely observational: the return value is ignored and a throwing
    handler cannot stop the poll loop. Failed fetches used to be swallowed silently.

  Both are opt-in. A middleware configured without `readCachedFlags` behaves exactly as before.

- [#21802](https://github.com/LedgerHQ/ledger-live/pull/21802) [`7050652`](https://github.com/LedgerHQ/ledger-live/commit/70506520dafbccca4e014ac30d75647a5b7fe7d0) Thanks [@ysitbon](https://github.com/ysitbon)! - refactor(feature-flags): split the middleware body into named helpers

  `createFeatureFlagsMiddleware` now assembles a handful of small module-private helpers instead of
  inlining them, so its body reads as: build the collaborators, pick one of the two start-ups,
  return the middleware. `pollRemoteFlags` takes a deps object rather than seven positional
  arguments. Behaviour and public API are unchanged.

- [#21751](https://github.com/LedgerHQ/ledger-live/pull/21751) [`dc204a7`](https://github.com/LedgerHQ/ledger-live/commit/dc204a7633e6f7c9acb66fbb18a6aeaa2e75c4bb) Thanks [@sarneijim](https://github.com/sarneijim)! - Add releaseTour and gate Q2/Q3 tours with it, dropping q2Tour/q3Tour from Wallet 4.0

- [#21628](https://github.com/LedgerHQ/ledger-live/pull/21628) [`903c180`](https://github.com/LedgerHQ/ledger-live/commit/903c1802ea5d4cc3fe1bfe5609b8cf3871152cf0) Thanks [@ishaba](https://github.com/ishaba)! - feat(tron): add gasSponsorship feature flag

- [#21791](https://github.com/LedgerHQ/ledger-live/pull/21791) [`a6a7a94`](https://github.com/LedgerHQ/ledger-live/commit/a6a7a946b1c1dbdda1cfa2c049f536f7235ddde2) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Complete the Card login on desktop. The provider's page opens in the Discover webview, and the
  manifest of the live app owns its origin. The `lwdPayTab` flag carries `baanx_login_manifest_id`
  and `baanx_hosted_manifest_id`, which default to the staging manifests. A redirect that echoes no
  attempt id now passes the callback guards, so the app's own deep link completes the login.

## 0.22.0

### Minor Changes

- [#21833](https://github.com/LedgerHQ/ledger-live/pull/21833) [`8993c24`](https://github.com/LedgerHQ/ledger-live/commit/8993c242de8ed57617fb74ac9a3b1af047638914) Thanks [@koda-apps](https://github.com/apps/koda-apps)! - Fix walletsync feature flags (lldWalletSync, llmWalletSync) to default to the PROD environment instead of STAGING.

- [#21396](https://github.com/LedgerHQ/ledger-live/pull/21396) [`ebb1371`](https://github.com/LedgerHQ/ledger-live/commit/ebb13714a6de9c39f290b2ccd51ca78370824f6f) Thanks [@vladyslavchupovskiy-ext-art](https://github.com/vladyslavchupovskiy-ext-art)! - Add the Gonka (GNK) currency feature flag, disabled by default

- [#21283](https://github.com/LedgerHQ/ledger-live/pull/21283) [`761cf3e`](https://github.com/LedgerHQ/ledger-live/commit/761cf3e359fa197d07f6086d8522fd1785ba575d) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - add earn banner to success transation modal

## 0.22.0-next.1

### Minor Changes

- [#21833](https://github.com/LedgerHQ/ledger-live/pull/21833) [`8993c24`](https://github.com/LedgerHQ/ledger-live/commit/8993c242de8ed57617fb74ac9a3b1af047638914) Thanks [@koda-apps](https://github.com/apps/koda-apps)! - Fix walletsync feature flags (lldWalletSync, llmWalletSync) to default to the PROD environment instead of STAGING.

## 0.22.0-next.0

### Minor Changes

- [#21396](https://github.com/LedgerHQ/ledger-live/pull/21396) [`ebb1371`](https://github.com/LedgerHQ/ledger-live/commit/ebb13714a6de9c39f290b2ccd51ca78370824f6f) Thanks [@vladyslavchupovskiy-ext-art](https://github.com/vladyslavchupovskiy-ext-art)! - Add the Gonka (GNK) currency feature flag, disabled by default

- [#21283](https://github.com/LedgerHQ/ledger-live/pull/21283) [`761cf3e`](https://github.com/LedgerHQ/ledger-live/commit/761cf3e359fa197d07f6086d8522fd1785ba575d) Thanks [@lpaquet-ledger](https://github.com/lpaquet-ledger)! - add earn banner to success transation modal

## 0.21.0

### Minor Changes

- [#21074](https://github.com/LedgerHQ/ledger-live/pull/21074) [`a8c34d0`](https://github.com/LedgerHQ/ledger-live/commit/a8c34d0d9469b4e11339edfbef53445e58194fd8) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Introduce `@support/jest-shared` with `createSharedJestConfig` and `createSharedUiJestConfig` factories; wire all `shared/*` jest configs to use them.

- [#21188](https://github.com/LedgerHQ/ledger-live/pull/21188) [`c8bb138`](https://github.com/LedgerHQ/ledger-live/commit/c8bb13851393d4b1a50a5ece62763ba43110ae6f) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(lwdm): ask ledger sync on add contact

- [#21152](https://github.com/LedgerHQ/ledger-live/pull/21152) [`116f006`](https://github.com/LedgerHQ/ledger-live/commit/116f006fb7e1dc3ed7d97c41ec08b2340b66a12e) Thanks [@alexstapenka-ledger](https://github.com/alexstapenka-ledger)! - Add the `stableSavings` feature flag, forward it to Earn on initial load, and send it to Mixpanel as a boolean identify trait on desktop and mobile.

## 0.21.0-next.0

### Minor Changes

- [#21074](https://github.com/LedgerHQ/ledger-live/pull/21074) [`a8c34d0`](https://github.com/LedgerHQ/ledger-live/commit/a8c34d0d9469b4e11339edfbef53445e58194fd8) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Introduce `@support/jest-shared` with `createSharedJestConfig` and `createSharedUiJestConfig` factories; wire all `shared/*` jest configs to use them.

- [#21188](https://github.com/LedgerHQ/ledger-live/pull/21188) [`c8bb138`](https://github.com/LedgerHQ/ledger-live/commit/c8bb13851393d4b1a50a5ece62763ba43110ae6f) Thanks [@Moustafa-Koterba](https://github.com/Moustafa-Koterba)! - feat(lwdm): ask ledger sync on add contact

- [#21152](https://github.com/LedgerHQ/ledger-live/pull/21152) [`116f006`](https://github.com/LedgerHQ/ledger-live/commit/116f006fb7e1dc3ed7d97c41ec08b2340b66a12e) Thanks [@alexstapenka-ledger](https://github.com/alexstapenka-ledger)! - Add the `stableSavings` feature flag, forward it to Earn on initial load, and send it to Mixpanel as a boolean identify trait on desktop and mobile.

## 0.20.0

### Minor Changes

- [#20887](https://github.com/LedgerHQ/ledger-live/pull/20887) [`aa39333`](https://github.com/LedgerHQ/ledger-live/commit/aa393339789242783b168398cb5122a7f1e3f620) Thanks [@fAnselmi-Ledger](https://github.com/fAnselmi-Ledger)! - Add Solana TXC flag

- [#20834](https://github.com/LedgerHQ/ledger-live/pull/20834) [`01c088d`](https://github.com/LedgerHQ/ledger-live/commit/01c088db6a0597a479f6371c3a3db81157ead41e) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add a My Wallet Profile LNS upsell banner gated by `largeScreenUpsell.banners.profile` (LIVE-35481). Require `utmContent` on `buildLargeScreenUpsellCtaLink` and export `LARGE_SCREEN_UPSELL_UTM`.

- [#20925](https://github.com/LedgerHQ/ledger-live/pull/20925) [`91dbf02`](https://github.com/LedgerHQ/ledger-live/commit/91dbf023257961c3f15725f57abf273d2190e3c5) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Gate Recover Nano S intercept and Backup Hub Recovery Key warning with `largeScreenUpsell.params.banners["recover-page-block-nano-s-only"]` and `banners["backup-hub-recovery-key-text-warning"]`.

- [#20996](https://github.com/LedgerHQ/ledger-live/pull/20996) [`d6c7592`](https://github.com/LedgerHQ/ledger-live/commit/d6c7592278f2eed430c0451dd1b0a99fdf5b377d) Thanks [@CremaFR](https://github.com/CremaFR)! - Forward the `llmWalletApiDeviceIntentSign` assignment to the swap live app on mobile as `llmWalletApiDeviceIntentSignVariant` (the `variantId`) and `llmWalletApiDeviceIntentSignEnabled` (the flag state). Resolve that per manifest through `useDeviceIntentSignAssignment`, which also backs the Wallet API UI hook. Report both attributes on Mixpanel via `getRemoteABTestingAttributes`.

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

## 0.20.0-next.0

### Minor Changes

- [#20887](https://github.com/LedgerHQ/ledger-live/pull/20887) [`aa39333`](https://github.com/LedgerHQ/ledger-live/commit/aa393339789242783b168398cb5122a7f1e3f620) Thanks [@fAnselmi-Ledger](https://github.com/fAnselmi-Ledger)! - Add Solana TXC flag

- [#20834](https://github.com/LedgerHQ/ledger-live/pull/20834) [`01c088d`](https://github.com/LedgerHQ/ledger-live/commit/01c088db6a0597a479f6371c3a3db81157ead41e) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Add a My Wallet Profile LNS upsell banner gated by `largeScreenUpsell.banners.profile` (LIVE-35481). Require `utmContent` on `buildLargeScreenUpsellCtaLink` and export `LARGE_SCREEN_UPSELL_UTM`.

- [#20925](https://github.com/LedgerHQ/ledger-live/pull/20925) [`91dbf02`](https://github.com/LedgerHQ/ledger-live/commit/91dbf023257961c3f15725f57abf273d2190e3c5) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Gate Recover Nano S intercept and Backup Hub Recovery Key warning with `largeScreenUpsell.params.banners["recover-page-block-nano-s-only"]` and `banners["backup-hub-recovery-key-text-warning"]`.

- [#20996](https://github.com/LedgerHQ/ledger-live/pull/20996) [`d6c7592`](https://github.com/LedgerHQ/ledger-live/commit/d6c7592278f2eed430c0451dd1b0a99fdf5b377d) Thanks [@CremaFR](https://github.com/CremaFR)! - Forward the `llmWalletApiDeviceIntentSign` assignment to the swap live app on mobile as `llmWalletApiDeviceIntentSignVariant` (the `variantId`) and `llmWalletApiDeviceIntentSignEnabled` (the flag state). Resolve that per manifest through `useDeviceIntentSignAssignment`, which also backs the Wallet API UI hook. Report both attributes on Mixpanel via `getRemoteABTestingAttributes`.

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

## 0.19.0

### Minor Changes

- [#20848](https://github.com/LedgerHQ/ledger-live/pull/20848) [`e4e8d08`](https://github.com/LedgerHQ/ledger-live/commit/e4e8d086fc5672e4ce96c30c9a9af3f2022f863a) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the `lwmPasswordRevamp` feature flag, gating the User App Authentication epic on Ledger Wallet Mobile. Boolean gate with no params, disabled by default; its Remote Config key is derived as `feature_lwm_password_revamp`. Nothing reads it yet.

- [#20907](https://github.com/LedgerHQ/ledger-live/pull/20907) [`da0a5ce`](https://github.com/LedgerHQ/ledger-live/commit/da0a5ceb8f889f1bace45ed2d3d4c640cdf24ca8) Thanks [@fAnselmi-Ledger](https://github.com/fAnselmi-Ledger)! - Add Solana TXC flag

- [#20719](https://github.com/LedgerHQ/ledger-live/pull/20719) [`5b39a67`](https://github.com/LedgerHQ/ledger-live/commit/5b39a67dd93d4c541a77b0b146881073ca00ed15) Thanks [@sarneijim](https://github.com/sarneijim)! - Drive desktop LNS upsell banners from `largeScreenUpsell` and remove the legacy `lldNanoSUpsellBanners` flag (LIVE-35487).

- [#20630](https://github.com/LedgerHQ/ledger-live/pull/20630) [`0807eca`](https://github.com/LedgerHQ/ledger-live/commit/0807ecacfd06057811a3d6f8845b9f4bfc6f693c) Thanks [@sarneijim](https://github.com/sarneijim)! - Enable LNS upsell portfolio banner for opted-in users (LIVE-32086).

## 0.19.0-next.1

### Minor Changes

- [#20907](https://github.com/LedgerHQ/ledger-live/pull/20907) [`da0a5ce`](https://github.com/LedgerHQ/ledger-live/commit/da0a5ceb8f889f1bace45ed2d3d4c640cdf24ca8) Thanks [@fAnselmi-Ledger](https://github.com/fAnselmi-Ledger)! - Add Solana TXC flag

## 0.19.0-next.0

### Minor Changes

- [#20848](https://github.com/LedgerHQ/ledger-live/pull/20848) [`e4e8d08`](https://github.com/LedgerHQ/ledger-live/commit/e4e8d086fc5672e4ce96c30c9a9af3f2022f863a) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the `lwmPasswordRevamp` feature flag, gating the User App Authentication epic on Ledger Wallet Mobile. Boolean gate with no params, disabled by default; its Remote Config key is derived as `feature_lwm_password_revamp`. Nothing reads it yet.

- [#20719](https://github.com/LedgerHQ/ledger-live/pull/20719) [`5b39a67`](https://github.com/LedgerHQ/ledger-live/commit/5b39a67dd93d4c541a77b0b146881073ca00ed15) Thanks [@sarneijim](https://github.com/sarneijim)! - Drive desktop LNS upsell banners from `largeScreenUpsell` and remove the legacy `lldNanoSUpsellBanners` flag (LIVE-35487).

- [#20630](https://github.com/LedgerHQ/ledger-live/pull/20630) [`0807eca`](https://github.com/LedgerHQ/ledger-live/commit/0807ecacfd06057811a3d6f8845b9f4bfc6f693c) Thanks [@sarneijim](https://github.com/sarneijim)! - Enable LNS upsell portfolio banner for opted-in users (LIVE-32086).

## 0.18.0

### Minor Changes

- [#20595](https://github.com/LedgerHQ/ledger-live/pull/20595) [`43bf6d8`](https://github.com/LedgerHQ/ledger-live/commit/43bf6d8f6600f70b7c2a85615660e7e150e798bf) Thanks [@ysitbon](https://github.com/ysitbon)! - Make every new-architecture barrel a pure regrouping point, and enforce it.

  An `index.*` under `shared/`, `domain/` or `features/` may now contain only `export * from "./x"`
  lines, plus an optional default re-export. Having to sort in the export
  (`export { a, b } from "./x"`) proved the target file mixed public and private code; an `index.*`
  holding actual code proved it more loudly. A new nx plugin infers a `lint:structure` target on each
  of the 49 packages and fails on both, along with two related rules: a barrel may not re-export a
  private `internals` location, and it may not re-export another workspace package.

  That last rule removes the proxies. A package that re-exported a neighbour gave the same symbol two
  import paths and hid who actually provided it. Consumers now import the original provider and
  declare the dependency, which is why the two apps gain `@features/flow-contacts-add-contact` and the
  desktop app gains `@features/platform-contacts`.

  Renamed or relocated, with the import specifier unchanged for consumers in every case except where
  noted:

  - `@domain/entity-account-name` no longer exports the `setAccountNames` alias; use
    `bulkSetAccountNames`, the name the slice actually defines.
  - `@shared/cloud-sync` exports `getCloudSyncApi` as a named export from its api module instead of
    re-exporting a default under a different name.

  Five packages are left untouched behind temporary exclusions, each recording how to remove it:

  - `@shared/env`, the facade over the legacy `@ledgerhq/live-env`, which carries the wrapping in its
    barrel.
  - the `@ledgerhq/engagement` and `@ledgerhq/ptx` packages (`flow-analytics-consent`,
    `flow-large-screen-upsell`, `flow-lazy-onboarding-banner`, `flow-pay-card-auth`), so each owning
    team lands the change on its own schedule. Conformant barrels were prepared and verified for them
    before being reverted, so the work is deferred rather than open.

- [#20290](https://github.com/LedgerHQ/ledger-live/pull/20290) [`9708010`](https://github.com/LedgerHQ/ledger-live/commit/970801044529fe978ccbb8c562cc64c00277d1de) Thanks [@sarneijim](https://github.com/sarneijim)! - Add the shared lazy onboarding banner flow, its Mobile portfolio view and configurable Shop link feature flag.

## 0.18.0-next.0

### Minor Changes

- [#20595](https://github.com/LedgerHQ/ledger-live/pull/20595) [`43bf6d8`](https://github.com/LedgerHQ/ledger-live/commit/43bf6d8f6600f70b7c2a85615660e7e150e798bf) Thanks [@ysitbon](https://github.com/ysitbon)! - Make every new-architecture barrel a pure regrouping point, and enforce it.

  An `index.*` under `shared/`, `domain/` or `features/` may now contain only `export * from "./x"`
  lines, plus an optional default re-export. Having to sort in the export
  (`export { a, b } from "./x"`) proved the target file mixed public and private code; an `index.*`
  holding actual code proved it more loudly. A new nx plugin infers a `lint:structure` target on each
  of the 49 packages and fails on both, along with two related rules: a barrel may not re-export a
  private `internals` location, and it may not re-export another workspace package.

  That last rule removes the proxies. A package that re-exported a neighbour gave the same symbol two
  import paths and hid who actually provided it. Consumers now import the original provider and
  declare the dependency, which is why the two apps gain `@features/flow-contacts-add-contact` and the
  desktop app gains `@features/platform-contacts`.

  Renamed or relocated, with the import specifier unchanged for consumers in every case except where
  noted:

  - `@domain/entity-account-name` no longer exports the `setAccountNames` alias; use
    `bulkSetAccountNames`, the name the slice actually defines.
  - `@shared/cloud-sync` exports `getCloudSyncApi` as a named export from its api module instead of
    re-exporting a default under a different name.

  Five packages are left untouched behind temporary exclusions, each recording how to remove it:

  - `@shared/env`, the facade over the legacy `@ledgerhq/live-env`, which carries the wrapping in its
    barrel.
  - the `@ledgerhq/engagement` and `@ledgerhq/ptx` packages (`flow-analytics-consent`,
    `flow-large-screen-upsell`, `flow-lazy-onboarding-banner`, `flow-pay-card-auth`), so each owning
    team lands the change on its own schedule. Conformant barrels were prepared and verified for them
    before being reverted, so the work is deferred rather than open.

- [#20290](https://github.com/LedgerHQ/ledger-live/pull/20290) [`9708010`](https://github.com/LedgerHQ/ledger-live/commit/970801044529fe978ccbb8c562cc64c00277d1de) Thanks [@sarneijim](https://github.com/sarneijim)! - Add the shared lazy onboarding banner flow, its Mobile portfolio view and configurable Shop link feature flag.

## 0.17.0

### Minor Changes

- [#20219](https://github.com/LedgerHQ/ledger-live/pull/20219) [`2fa6e1f`](https://github.com/LedgerHQ/ledger-live/commit/2fa6e1f3fbcb56ff444ca756135d821e141bc439) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Widen analyticsOptIn policyVersion to number | string for major/minor semantics

- [#20093](https://github.com/LedgerHQ/ledger-live/pull/20093) [`56cfe0b`](https://github.com/LedgerHQ/ledger-live/commit/56cfe0bc6673f416f739c1593abfec718230952d) Thanks [@sarneijim](https://github.com/sarneijim)! - Use the shared large-screen upsell configuration and eligibility for mobile upgrade banners.

- [#19634](https://github.com/LedgerHQ/ledger-live/pull/19634) [`4015ade`](https://github.com/LedgerHQ/ledger-live/commit/4015ade1f9744d4bb575282060fdb1beb9aafc89) Thanks [@thesan](https://github.com/thesan)! - Connect @ledgerhq/ledger-auth to the Ledger Wallet apps Redux store

- [#20232](https://github.com/LedgerHQ/ledger-live/pull/20232) [`d467088`](https://github.com/LedgerHQ/ledger-live/commit/d4670885d7eb77c035d09c225eff9dca0151abb3) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwdm): a/b testing show recent banner

- [#20339](https://github.com/LedgerHQ/ledger-live/pull/20339) [`6a531c5`](https://github.com/LedgerHQ/ledger-live/commit/6a531c54ccd1c65df122286de6f136f9d73b9002) Thanks [@qperrot](https://github.com/qperrot)! - Remove Scroll Sepolia testnet support as it is no longer maintained

- [#20265](https://github.com/LedgerHQ/ledger-live/pull/20265) [`5f81208`](https://github.com/LedgerHQ/ledger-live/commit/5f81208308f7e56971cce9329369c12af82185d3) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Remove analytics consentValidityDays and the unused live-common consent expiry helpers

## 0.17.0-next.0

### Minor Changes

- [#20219](https://github.com/LedgerHQ/ledger-live/pull/20219) [`2fa6e1f`](https://github.com/LedgerHQ/ledger-live/commit/2fa6e1f3fbcb56ff444ca756135d821e141bc439) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Widen analyticsOptIn policyVersion to number | string for major/minor semantics

- [#20093](https://github.com/LedgerHQ/ledger-live/pull/20093) [`56cfe0b`](https://github.com/LedgerHQ/ledger-live/commit/56cfe0bc6673f416f739c1593abfec718230952d) Thanks [@sarneijim](https://github.com/sarneijim)! - Use the shared large-screen upsell configuration and eligibility for mobile upgrade banners.

- [#19634](https://github.com/LedgerHQ/ledger-live/pull/19634) [`4015ade`](https://github.com/LedgerHQ/ledger-live/commit/4015ade1f9744d4bb575282060fdb1beb9aafc89) Thanks [@thesan](https://github.com/thesan)! - Connect @ledgerhq/ledger-auth to the Ledger Wallet apps Redux store

- [#20232](https://github.com/LedgerHQ/ledger-live/pull/20232) [`d467088`](https://github.com/LedgerHQ/ledger-live/commit/d4670885d7eb77c035d09c225eff9dca0151abb3) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwdm): a/b testing show recent banner

- [#20339](https://github.com/LedgerHQ/ledger-live/pull/20339) [`6a531c5`](https://github.com/LedgerHQ/ledger-live/commit/6a531c54ccd1c65df122286de6f136f9d73b9002) Thanks [@qperrot](https://github.com/qperrot)! - Remove Scroll Sepolia testnet support as it is no longer maintained

- [#20265](https://github.com/LedgerHQ/ledger-live/pull/20265) [`5f81208`](https://github.com/LedgerHQ/ledger-live/commit/5f81208308f7e56971cce9329369c12af82185d3) Thanks [@tonykhaov](https://github.com/tonykhaov)! - Remove analytics consentValidityDays and the unused live-common consent expiry helpers

## 0.16.0

### Minor Changes

- [#19992](https://github.com/LedgerHQ/ledger-live/pull/19992) [`452adf8`](https://github.com/LedgerHQ/ledger-live/commit/452adf85380d1cb74f1894478cdd84849b120ef4) Thanks [@sarneijim](https://github.com/sarneijim)! - Gate each existing mobile Nano S upsell banner placement through the shared large-screen upsell flag.

- [#20152](https://github.com/LedgerHQ/ledger-live/pull/20152) [`44798f3`](https://github.com/LedgerHQ/ledger-live/commit/44798f392deb662a5f60123651ece2b320fbf946) Thanks [@sarneijim](https://github.com/sarneijim)! - Add the `lazyOnboardingBanner` feature flag with shop direct and feature intro modes

- [#20073](https://github.com/LedgerHQ/ledger-live/pull/20073) [`a534db5`](https://github.com/LedgerHQ/ledger-live/commit/a534db5c41da6957d38a330c1da6f7db1b693763) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Remove newsfeedPage feature flag (LIVE-31511)

- [#20054](https://github.com/LedgerHQ/ledger-live/pull/20054) [`c622459`](https://github.com/LedgerHQ/ledger-live/commit/c622459fcbff5dcc094ee10eb360f2a835036007) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Remove the disabled npsRatingsPrompt feature flag and NPS ratings dead code on mobile

- [#19215](https://github.com/LedgerHQ/ledger-live/pull/19215) [`dfab01f`](https://github.com/LedgerHQ/ledger-live/commit/dfab01f36460bd4e0ea0b0c13aa3d965aef945cd) Thanks [@CremaFR](https://github.com/CremaFR)! - Add a Device Intent Executor based signing path for Wallet API `transaction.sign` and `message.sign` on Ledger Wallet Mobile, gated behind the new `llmWalletApiDeviceIntentSign` feature flag (per-manifest allow-list, off by default). Introduces the `signMessageIntent` module in live-common.

## 0.16.0-next.0

### Minor Changes

- [#19992](https://github.com/LedgerHQ/ledger-live/pull/19992) [`452adf8`](https://github.com/LedgerHQ/ledger-live/commit/452adf85380d1cb74f1894478cdd84849b120ef4) Thanks [@sarneijim](https://github.com/sarneijim)! - Gate each existing mobile Nano S upsell banner placement through the shared large-screen upsell flag.

- [#20152](https://github.com/LedgerHQ/ledger-live/pull/20152) [`44798f3`](https://github.com/LedgerHQ/ledger-live/commit/44798f392deb662a5f60123651ece2b320fbf946) Thanks [@sarneijim](https://github.com/sarneijim)! - Add the `lazyOnboardingBanner` feature flag with shop direct and feature intro modes

- [#20073](https://github.com/LedgerHQ/ledger-live/pull/20073) [`a534db5`](https://github.com/LedgerHQ/ledger-live/commit/a534db5c41da6957d38a330c1da6f7db1b693763) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Remove newsfeedPage feature flag (LIVE-31511)

- [#20054](https://github.com/LedgerHQ/ledger-live/pull/20054) [`c622459`](https://github.com/LedgerHQ/ledger-live/commit/c622459fcbff5dcc094ee10eb360f2a835036007) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Remove the disabled npsRatingsPrompt feature flag and NPS ratings dead code on mobile

- [#19215](https://github.com/LedgerHQ/ledger-live/pull/19215) [`dfab01f`](https://github.com/LedgerHQ/ledger-live/commit/dfab01f36460bd4e0ea0b0c13aa3d965aef945cd) Thanks [@CremaFR](https://github.com/CremaFR)! - Add a Device Intent Executor based signing path for Wallet API `transaction.sign` and `message.sign` on Ledger Wallet Mobile, gated behind the new `llmWalletApiDeviceIntentSign` feature flag (per-manifest allow-list, off by default). Introduces the `signMessageIntent` module in live-common.

## 0.15.0

### Minor Changes

- [#19734](https://github.com/LedgerHQ/ledger-live/pull/19734) [`bb2d2d2`](https://github.com/LedgerHQ/ledger-live/commit/bb2d2d250a1d5b8cde43ba963795d28b10b48be6) Thanks [@ishaba](https://github.com/ishaba)! - remove umee chain related code

- [#19875](https://github.com/LedgerHQ/ledger-live/pull/19875) [`59a6c82`](https://github.com/LedgerHQ/ledger-live/commit/59a6c82a784b4f484b5fb6a5ea42b6ebb1115818) Thanks [@sarneijim](https://github.com/sarneijim)! - Gate the large-screen upsell modal by the enabled state of the selected opt-in variant

- [#18413](https://github.com/LedgerHQ/ledger-live/pull/18413) [`c498e25`](https://github.com/LedgerHQ/ledger-live/commit/c498e25ca9f4b6ef5c4e3dfd370dab44ccdebc0f) Thanks [@sarneijim](https://github.com/sarneijim)! - Remove lldActionCarousel feature flag (always enabled with variant A)

## 0.15.0-next.0

### Minor Changes

- [#19734](https://github.com/LedgerHQ/ledger-live/pull/19734) [`bb2d2d2`](https://github.com/LedgerHQ/ledger-live/commit/bb2d2d250a1d5b8cde43ba963795d28b10b48be6) Thanks [@ishaba](https://github.com/ishaba)! - remove umee chain related code

- [#19875](https://github.com/LedgerHQ/ledger-live/pull/19875) [`59a6c82`](https://github.com/LedgerHQ/ledger-live/commit/59a6c82a784b4f484b5fb6a5ea42b6ebb1115818) Thanks [@sarneijim](https://github.com/sarneijim)! - Gate the large-screen upsell modal by the enabled state of the selected opt-in variant

- [#18413](https://github.com/LedgerHQ/ledger-live/pull/18413) [`c498e25`](https://github.com/LedgerHQ/ledger-live/commit/c498e25ca9f4b6ef5c4e3dfd370dab44ccdebc0f) Thanks [@sarneijim](https://github.com/sarneijim)! - Remove lldActionCarousel feature flag (always enabled with variant A)

## 0.14.0

### Minor Changes

- [#19252](https://github.com/LedgerHQ/ledger-live/pull/19252) [`c75213b`](https://github.com/LedgerHQ/ledger-live/commit/c75213b0c649cc0acfdbabacd62e07848ccee842) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwm): switch to deviceaction instead of die with FF on new send flow

- [#19568](https://github.com/LedgerHQ/ledger-live/pull/19568) [`45584e4`](https://github.com/LedgerHQ/ledger-live/commit/45584e4b87ad8ffea9a0e6ba48e196d14164c84a) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Show an estimated label for configured providers on completed mobile swaps.

- [#19444](https://github.com/LedgerHQ/ledger-live/pull/19444) [`ea792bc`](https://github.com/LedgerHQ/ledger-live/commit/ea792bc06b9eb9931d75823bff63186202d3e2de) Thanks [@deepyjr](https://github.com/deepyjr)! - Add eligible address family configuration to Contacts feature flags.

- [#19377](https://github.com/LedgerHQ/ledger-live/pull/19377) [`75a33a8`](https://github.com/LedgerHQ/ledger-live/commit/75a33a8ef74a6eef6236bb5db873cadd35643705) Thanks [@deepyjr](https://github.com/deepyjr)! - Register Contacts feature flags and expose Contacts flow access.

- [#19380](https://github.com/LedgerHQ/ledger-live/pull/19380) [`bae43dd`](https://github.com/LedgerHQ/ledger-live/commit/bae43ddc50439d2a7f18852f2b727e24de0169ed) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add `card` boolean param to `lwdPayTab` and `lwmPayTab` feature flags

- [#19589](https://github.com/LedgerHQ/ledger-live/pull/19589) [`9479c28`](https://github.com/LedgerHQ/ledger-live/commit/9479c284321915f7d5139746f3f924b1ad2685c3) Thanks [@sarneijim](https://github.com/sarneijim)! - Keep large-screen upsell eligibility read-only and align the fallback CTA link

- [#19378](https://github.com/LedgerHQ/ledger-live/pull/19378) [`fd9da5e`](https://github.com/LedgerHQ/ledger-live/commit/fd9da5e2b3a1e5300d012b826f3707535d07b1d9) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add lwmPayTab feature flag for the Pay Tab in LWM

- [#19367](https://github.com/LedgerHQ/ledger-live/pull/19367) [`8238860`](https://github.com/LedgerHQ/ledger-live/commit/8238860c893b0688d2c59a3e042d7a227031547a) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - add lwdPayTab feature flag for desktop Pay tab

## 0.14.0-next.0

### Minor Changes

- [#19252](https://github.com/LedgerHQ/ledger-live/pull/19252) [`c75213b`](https://github.com/LedgerHQ/ledger-live/commit/c75213b0c649cc0acfdbabacd62e07848ccee842) Thanks [@dilaouid](https://github.com/dilaouid)! - feat(lwm): switch to deviceaction instead of die with FF on new send flow

- [#19568](https://github.com/LedgerHQ/ledger-live/pull/19568) [`45584e4`](https://github.com/LedgerHQ/ledger-live/commit/45584e4b87ad8ffea9a0e6ba48e196d14164c84a) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Show an estimated label for configured providers on completed mobile swaps.

- [#19444](https://github.com/LedgerHQ/ledger-live/pull/19444) [`ea792bc`](https://github.com/LedgerHQ/ledger-live/commit/ea792bc06b9eb9931d75823bff63186202d3e2de) Thanks [@deepyjr](https://github.com/deepyjr)! - Add eligible address family configuration to Contacts feature flags.

- [#19377](https://github.com/LedgerHQ/ledger-live/pull/19377) [`75a33a8`](https://github.com/LedgerHQ/ledger-live/commit/75a33a8ef74a6eef6236bb5db873cadd35643705) Thanks [@deepyjr](https://github.com/deepyjr)! - Register Contacts feature flags and expose Contacts flow access.

- [#19380](https://github.com/LedgerHQ/ledger-live/pull/19380) [`bae43dd`](https://github.com/LedgerHQ/ledger-live/commit/bae43ddc50439d2a7f18852f2b727e24de0169ed) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add `card` boolean param to `lwdPayTab` and `lwmPayTab` feature flags

- [#19589](https://github.com/LedgerHQ/ledger-live/pull/19589) [`9479c28`](https://github.com/LedgerHQ/ledger-live/commit/9479c284321915f7d5139746f3f924b1ad2685c3) Thanks [@sarneijim](https://github.com/sarneijim)! - Keep large-screen upsell eligibility read-only and align the fallback CTA link

- [#19378](https://github.com/LedgerHQ/ledger-live/pull/19378) [`fd9da5e`](https://github.com/LedgerHQ/ledger-live/commit/fd9da5e2b3a1e5300d012b826f3707535d07b1d9) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Add lwmPayTab feature flag for the Pay Tab in LWM

- [#19367](https://github.com/LedgerHQ/ledger-live/pull/19367) [`8238860`](https://github.com/LedgerHQ/ledger-live/commit/8238860c893b0688d2c59a3e042d7a227031547a) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - add lwdPayTab feature flag for desktop Pay tab

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->

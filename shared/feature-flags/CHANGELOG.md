# @shared/feature-flags

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

## 0.13.0

### Minor Changes

- [#19015](https://github.com/LedgerHQ/ledger-live/pull/19015) [`a2621e2`](https://github.com/LedgerHQ/ledger-live/commit/a2621e2c6c6369c7109af72e1cb59df2448951ff) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - feat: lwm ledger sync feature flag clean up

- [#18887](https://github.com/LedgerHQ/ledger-live/pull/18887) [`8b6614e`](https://github.com/LedgerHQ/ledger-live/commit/8b6614eaff423aaeb50b7eb44ba5916a941a573d) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Remove the `concordiumVerifyAddress` feature flag and its "address verification unavailable" fallback. On-device address verification is now the unconditional path for all Concordium accounts.

- [#19137](https://github.com/LedgerHQ/ledger-live/pull/19137) [`714411f`](https://github.com/LedgerHQ/ledger-live/commit/714411fcbf054244444ec97f2e53039417cba54e) Thanks [@ysitbon](https://github.com/ysitbon)! - chore: make new domain/shared/features packages "born migrated" for knip

  Add an explicit, minimal `package.json#exports` surface (no `./*` wildcard) and a `knip.json` workspace entry to every new `@domain/*`, `@shared/*`, and `@features/*` package, plus an `unimported` script that runs knip scoped to the workspace. This lets dead-code / unused-dependency detection actually analyze these packages and detect zombie top-level source files. Also removes the unused `cn` util and its `clsx` / `tailwind-merge` dependencies from `@features/flow-market-banner` (surfaced by knip).

- [#19259](https://github.com/LedgerHQ/ledger-live/pull/19259) [`ca07aac`](https://github.com/LedgerHQ/ledger-live/commit/ca07aac857c58e3d85beab71b246d8af687431f3) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - enable lwdWallet40 feature flag by default

- [#19062](https://github.com/LedgerHQ/ledger-live/pull/19062) [`5ccd2a9`](https://github.com/LedgerHQ/ledger-live/commit/5ccd2a9c229e8007851c6eb8b01c866c8e605932) Thanks [@abdurrahman-ledger](https://github.com/abdurrahman-ledger)! - Extract E2E test-support code out of `@ledgerhq/live-common`

  Moved the E2E enums, models, family helpers and speculos/device utilities that lived under
  `@ledgerhq/live-common/e2e/*` into a new dedicated, private package `@ledgerhq/live-e2e-shared`
  (located under `e2e/`, alongside the Desktop and Mobile E2E suites). This keeps test-only code
  out of `live-common`, which is in maintenance mode.

  - `@ledgerhq/live-common`: removed the internal `./e2e` export.
  - `@shared/feature-flags`: now exports `getAllFeatureFlags` (previously in the live-common e2e
    module), so production debug tooling no longer depends on test code.
  - `ledger-live-desktop`: the `devices` reducer now derives the Speculos device model from a small
    local map instead of importing from the e2e module.
  - Desktop/Mobile apps and E2E suites now import from `@ledgerhq/live-e2e-shared`.

- [#18817](https://github.com/LedgerHQ/ledger-live/pull/18817) [`9f8ab96`](https://github.com/LedgerHQ/ledger-live/commit/9f8ab9672ababc02909e7553d433ee326c37762e) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Remove the `newReceiveDialog` feature flag and make the new Lumen receive options dialog the permanent default on desktop. This drops the legacy `StepOptions` receive step, the `useLegacyReceiveOptions` path, and the related `shouldDisplayNewReceiveDialog` config across the feature-flags packages and types.

- [#19073](https://github.com/LedgerHQ/ledger-live/pull/19073) [`7914bd1`](https://github.com/LedgerHQ/ledger-live/commit/7914bd123d4f3b990db035f28dca4904420562ec) Thanks [@ysitbon](https://github.com/ysitbon)! - feature-flags: apply env (`FEATURE_FLAGS`) overrides at store boot even when the first remote-flags fetch fails. The middleware now re-resolves once on the first settled fetch — on success as before, and once on the first failure — so env (and version/language) resolution runs at boot without depending on a successful remote fetch. Subsequent failed polls do not re-resolve (a one-shot guard), so there is no per-poll churn. No app changes are required: any consumer of `createFeatureFlagsMiddleware` gets correct env-at-boot resolution.

- [#19036](https://github.com/LedgerHQ/ledger-live/pull/19036) [`addef52`](https://github.com/LedgerHQ/ledger-live/commit/addef52ed445008c16e3f94d66f46222c8c535f7) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - remove marketbanner param from wallet4.0 FF

- [#18953](https://github.com/LedgerHQ/ledger-live/pull/18953) [`81373c1`](https://github.com/LedgerHQ/ledger-live/commit/81373c1ca46cf2094cfd4f98958eff2114f02cea) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - opt-in notification feature flag clean up

- [#19130](https://github.com/LedgerHQ/ledger-live/pull/19130) [`34bccb5`](https://github.com/LedgerHQ/ledger-live/commit/34bccb5268c8b27f87f2ab0395e372d4f1d5d926) Thanks [@sarneijim](https://github.com/sarneijim)! - Add shared `largeScreenUpsell` feature flag (off by default) as the single source of truth for the large-screen upsell audience, timing and modal content across Desktop and Mobile

- [#18994](https://github.com/LedgerHQ/ledger-live/pull/18994) [`966d6a1`](https://github.com/LedgerHQ/ledger-live/commit/966d6a198412c12548575516a2ac72456c380181) Thanks [@deepyjr](https://github.com/deepyjr)! - Add the Ledger Wallet dust filtering feature flags and platform hook.

- [#18936](https://github.com/LedgerHQ/ledger-live/pull/18936) [`e820e40`](https://github.com/LedgerHQ/ledger-live/commit/e820e402fb57d52b31dcd6de26f8d31d9564e2a4) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - lldRebordABTest feature flag clean up

- [#19076](https://github.com/LedgerHQ/ledger-live/pull/19076) [`007f27e`](https://github.com/LedgerHQ/ledger-live/commit/007f27e81cce353a3ee6648543d54d06ae6e7a11) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Add lwdAnalyticsOptInScreenV2 feature flag

- [#18891](https://github.com/LedgerHQ/ledger-live/pull/18891) [`b10ca6a`](https://github.com/LedgerHQ/ledger-live/commit/b10ca6ab5e80889b24805b460f81eff5748f0170) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - flexibleContentCards feature flag cleanup

- [#18855](https://github.com/LedgerHQ/ledger-live/pull/18855) [`df6ca42`](https://github.com/LedgerHQ/ledger-live/commit/df6ca422fa70171162974ea71519da5c5eeb55d8) Thanks [@sarneijim](https://github.com/sarneijim)! - Remove the `llmRebornLP` feature flag (always enabled with variant A) and inline the enabled behavior

- [#19003](https://github.com/LedgerHQ/ledger-live/pull/19003) [`e3c0327`](https://github.com/LedgerHQ/ledger-live/commit/e3c032795a0432500a447b756503ce0aefd8c0f6) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Remove the `quickActionCtas` sub-flag of `lwdWallet40` (always enabled) and inline the enabled behavior: QuickActions are now always shown in the Portfolio and the legacy send/receive/exchange sidebar entries are removed

- [#18932](https://github.com/LedgerHQ/ledger-live/pull/18932) [`628f21f`](https://github.com/LedgerHQ/ledger-live/commit/628f21f5acf7d5866c0c956d41d69c760caf0caa) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add an informational disclaimer banner on the Wallet 4.0 asset detail screen for assets supported exclusively on a Robinhood chain (e.g. tokenized stocks on robinhood_testnet). The banner is gated by the `llRobinhoodDisclaimer` feature flag, which is simplified to a plain boolean flag (its unused `url` param is removed).

- [#18971](https://github.com/LedgerHQ/ledger-live/pull/18971) [`5aada6f`](https://github.com/LedgerHQ/ledger-live/commit/5aada6f1a72df070770f4b67112f51b5ced58cff) Thanks [@sarneijim](https://github.com/sarneijim)! - Remove the always-enabled `nanoOnboardingFundWallet` feature flag and clean up the dead onboarding tutorial code it gated (the `Aside` illustration sidebar, per-screen `Illustration`/`Footer` statics, related shared helpers, and orphaned i18n keys).

- [#18993](https://github.com/LedgerHQ/ledger-live/pull/18993) [`69b201e`](https://github.com/LedgerHQ/ledger-live/commit/69b201e2b1e01b2c6bfb6eaf9e0aa60088f175fc) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - feat: lwd sync onboarding feature flag clean up

- [#19178](https://github.com/LedgerHQ/ledger-live/pull/19178) [`3da6b44`](https://github.com/LedgerHQ/ledger-live/commit/3da6b4439d61a7ad7f06e04be12aa1e92b9cdb55) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove the balanceRefreshRework param of the wallet 4.0 feature flag everywhere; the reworked balance refresh is now always used on mobile

- [#19302](https://github.com/LedgerHQ/ledger-live/pull/19302) [`f9411d1`](https://github.com/LedgerHQ/ledger-live/commit/f9411d1e2a06b031555cda9e26ecba37b4cf045e) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove the `graphRework` param of the Wallet 4.0 feature flag on both platforms. The param is no longer consumed on desktop (LIVE-33502) nor mobile, so it is dropped entirely: from the `lwmWallet40` / `lwdWallet40` schemas, the shared `Feature_Wallet40_Params` type, the analytics helper, the `shouldDisplayGraphRework` getter in `useWalletFeaturesConfig`, and both platforms' debug dev-tool lists.

  On mobile the Wallet 4.0 balance hero is now always rendered: the legacy portfolio graph card is dropped from the portfolio header and read-only screens (the `GraphCard` / `GraphCardContainer` / `PortfolioGraphCard` components stay, still used by the Analytics screen), and the graphRework gating is removed from every mobile call site (Portfolio screen/VM, `Delta`, settings reducer, WalletAssets VM).

- [#19203](https://github.com/LedgerHQ/ledger-live/pull/19203) [`6eea36b`](https://github.com/LedgerHQ/ledger-live/commit/6eea36bfafeba265672a96b37981e2c7e629ef33) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove the mainNavigation param of the wallet 4.0 feature flag; the wallet 4.0 main navigation is now always used on mobile and the legacy tab-bar/top-bar code paths are removed

- [#19261](https://github.com/LedgerHQ/ledger-live/pull/19261) [`35d4af9`](https://github.com/LedgerHQ/ledger-live/commit/35d4af90e7bee849814cd98358c80e20ef4e4f2a) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Wallet 4.0 Q1 cleanup on mobile:

  - Remove the `quickActionCtas` param of the `lwmWallet40` feature flag. The quick-action CTAs are now always enabled; the `shouldDisplayQuickActionCtas` getter and the legacy `PortfolioQuickActionsBar` are removed.
  - Remove the legacy (pre-4.0) Portfolio screen. `PortfolioRootScreen` now always renders the MVVM `Portfolio` / `ReadOnlyPortfolio`, and the dead legacy screen files are deleted.

## 0.13.0-next.0

### Minor Changes

- [#19015](https://github.com/LedgerHQ/ledger-live/pull/19015) [`a2621e2`](https://github.com/LedgerHQ/ledger-live/commit/a2621e2c6c6369c7109af72e1cb59df2448951ff) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - feat: lwm ledger sync feature flag clean up

- [#18887](https://github.com/LedgerHQ/ledger-live/pull/18887) [`8b6614e`](https://github.com/LedgerHQ/ledger-live/commit/8b6614eaff423aaeb50b7eb44ba5916a941a573d) Thanks [@lysyi3m](https://github.com/lysyi3m)! - Remove the `concordiumVerifyAddress` feature flag and its "address verification unavailable" fallback. On-device address verification is now the unconditional path for all Concordium accounts.

- [#19137](https://github.com/LedgerHQ/ledger-live/pull/19137) [`714411f`](https://github.com/LedgerHQ/ledger-live/commit/714411fcbf054244444ec97f2e53039417cba54e) Thanks [@ysitbon](https://github.com/ysitbon)! - chore: make new domain/shared/features packages "born migrated" for knip

  Add an explicit, minimal `package.json#exports` surface (no `./*` wildcard) and a `knip.json` workspace entry to every new `@domain/*`, `@shared/*`, and `@features/*` package, plus an `unimported` script that runs knip scoped to the workspace. This lets dead-code / unused-dependency detection actually analyze these packages and detect zombie top-level source files. Also removes the unused `cn` util and its `clsx` / `tailwind-merge` dependencies from `@features/flow-market-banner` (surfaced by knip).

- [#19259](https://github.com/LedgerHQ/ledger-live/pull/19259) [`ca07aac`](https://github.com/LedgerHQ/ledger-live/commit/ca07aac857c58e3d85beab71b246d8af687431f3) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - enable lwdWallet40 feature flag by default

- [#19062](https://github.com/LedgerHQ/ledger-live/pull/19062) [`5ccd2a9`](https://github.com/LedgerHQ/ledger-live/commit/5ccd2a9c229e8007851c6eb8b01c866c8e605932) Thanks [@abdurrahman-ledger](https://github.com/abdurrahman-ledger)! - Extract E2E test-support code out of `@ledgerhq/live-common`

  Moved the E2E enums, models, family helpers and speculos/device utilities that lived under
  `@ledgerhq/live-common/e2e/*` into a new dedicated, private package `@ledgerhq/live-e2e-shared`
  (located under `e2e/`, alongside the Desktop and Mobile E2E suites). This keeps test-only code
  out of `live-common`, which is in maintenance mode.

  - `@ledgerhq/live-common`: removed the internal `./e2e` export.
  - `@shared/feature-flags`: now exports `getAllFeatureFlags` (previously in the live-common e2e
    module), so production debug tooling no longer depends on test code.
  - `ledger-live-desktop`: the `devices` reducer now derives the Speculos device model from a small
    local map instead of importing from the e2e module.
  - Desktop/Mobile apps and E2E suites now import from `@ledgerhq/live-e2e-shared`.

- [#18817](https://github.com/LedgerHQ/ledger-live/pull/18817) [`9f8ab96`](https://github.com/LedgerHQ/ledger-live/commit/9f8ab9672ababc02909e7553d433ee326c37762e) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Remove the `newReceiveDialog` feature flag and make the new Lumen receive options dialog the permanent default on desktop. This drops the legacy `StepOptions` receive step, the `useLegacyReceiveOptions` path, and the related `shouldDisplayNewReceiveDialog` config across the feature-flags packages and types.

- [#19073](https://github.com/LedgerHQ/ledger-live/pull/19073) [`7914bd1`](https://github.com/LedgerHQ/ledger-live/commit/7914bd123d4f3b990db035f28dca4904420562ec) Thanks [@ysitbon](https://github.com/ysitbon)! - feature-flags: apply env (`FEATURE_FLAGS`) overrides at store boot even when the first remote-flags fetch fails. The middleware now re-resolves once on the first settled fetch — on success as before, and once on the first failure — so env (and version/language) resolution runs at boot without depending on a successful remote fetch. Subsequent failed polls do not re-resolve (a one-shot guard), so there is no per-poll churn. No app changes are required: any consumer of `createFeatureFlagsMiddleware` gets correct env-at-boot resolution.

- [#19036](https://github.com/LedgerHQ/ledger-live/pull/19036) [`addef52`](https://github.com/LedgerHQ/ledger-live/commit/addef52ed445008c16e3f94d66f46222c8c535f7) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - remove marketbanner param from wallet4.0 FF

- [#18953](https://github.com/LedgerHQ/ledger-live/pull/18953) [`81373c1`](https://github.com/LedgerHQ/ledger-live/commit/81373c1ca46cf2094cfd4f98958eff2114f02cea) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - opt-in notification feature flag clean up

- [#19130](https://github.com/LedgerHQ/ledger-live/pull/19130) [`34bccb5`](https://github.com/LedgerHQ/ledger-live/commit/34bccb5268c8b27f87f2ab0395e372d4f1d5d926) Thanks [@sarneijim](https://github.com/sarneijim)! - Add shared `largeScreenUpsell` feature flag (off by default) as the single source of truth for the large-screen upsell audience, timing and modal content across Desktop and Mobile

- [#18994](https://github.com/LedgerHQ/ledger-live/pull/18994) [`966d6a1`](https://github.com/LedgerHQ/ledger-live/commit/966d6a198412c12548575516a2ac72456c380181) Thanks [@deepyjr](https://github.com/deepyjr)! - Add the Ledger Wallet dust filtering feature flags and platform hook.

- [#18936](https://github.com/LedgerHQ/ledger-live/pull/18936) [`e820e40`](https://github.com/LedgerHQ/ledger-live/commit/e820e402fb57d52b31dcd6de26f8d31d9564e2a4) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - lldRebordABTest feature flag clean up

- [#19076](https://github.com/LedgerHQ/ledger-live/pull/19076) [`007f27e`](https://github.com/LedgerHQ/ledger-live/commit/007f27e81cce353a3ee6648543d54d06ae6e7a11) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Add lwdAnalyticsOptInScreenV2 feature flag

- [#18891](https://github.com/LedgerHQ/ledger-live/pull/18891) [`b10ca6a`](https://github.com/LedgerHQ/ledger-live/commit/b10ca6ab5e80889b24805b460f81eff5748f0170) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - flexibleContentCards feature flag cleanup

- [#18855](https://github.com/LedgerHQ/ledger-live/pull/18855) [`df6ca42`](https://github.com/LedgerHQ/ledger-live/commit/df6ca422fa70171162974ea71519da5c5eeb55d8) Thanks [@sarneijim](https://github.com/sarneijim)! - Remove the `llmRebornLP` feature flag (always enabled with variant A) and inline the enabled behavior

- [#19003](https://github.com/LedgerHQ/ledger-live/pull/19003) [`e3c0327`](https://github.com/LedgerHQ/ledger-live/commit/e3c032795a0432500a447b756503ce0aefd8c0f6) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Remove the `quickActionCtas` sub-flag of `lwdWallet40` (always enabled) and inline the enabled behavior: QuickActions are now always shown in the Portfolio and the legacy send/receive/exchange sidebar entries are removed

- [#18932](https://github.com/LedgerHQ/ledger-live/pull/18932) [`628f21f`](https://github.com/LedgerHQ/ledger-live/commit/628f21f5acf7d5866c0c956d41d69c760caf0caa) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add an informational disclaimer banner on the Wallet 4.0 asset detail screen for assets supported exclusively on a Robinhood chain (e.g. tokenized stocks on robinhood_testnet). The banner is gated by the `llRobinhoodDisclaimer` feature flag, which is simplified to a plain boolean flag (its unused `url` param is removed).

- [#18971](https://github.com/LedgerHQ/ledger-live/pull/18971) [`5aada6f`](https://github.com/LedgerHQ/ledger-live/commit/5aada6f1a72df070770f4b67112f51b5ced58cff) Thanks [@sarneijim](https://github.com/sarneijim)! - Remove the always-enabled `nanoOnboardingFundWallet` feature flag and clean up the dead onboarding tutorial code it gated (the `Aside` illustration sidebar, per-screen `Illustration`/`Footer` statics, related shared helpers, and orphaned i18n keys).

- [#18993](https://github.com/LedgerHQ/ledger-live/pull/18993) [`69b201e`](https://github.com/LedgerHQ/ledger-live/commit/69b201e2b1e01b2c6bfb6eaf9e0aa60088f175fc) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - feat: lwd sync onboarding feature flag clean up

- [#19178](https://github.com/LedgerHQ/ledger-live/pull/19178) [`3da6b44`](https://github.com/LedgerHQ/ledger-live/commit/3da6b4439d61a7ad7f06e04be12aa1e92b9cdb55) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove the balanceRefreshRework param of the wallet 4.0 feature flag everywhere; the reworked balance refresh is now always used on mobile

- [#19302](https://github.com/LedgerHQ/ledger-live/pull/19302) [`f9411d1`](https://github.com/LedgerHQ/ledger-live/commit/f9411d1e2a06b031555cda9e26ecba37b4cf045e) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove the `graphRework` param of the Wallet 4.0 feature flag on both platforms. The param is no longer consumed on desktop (LIVE-33502) nor mobile, so it is dropped entirely: from the `lwmWallet40` / `lwdWallet40` schemas, the shared `Feature_Wallet40_Params` type, the analytics helper, the `shouldDisplayGraphRework` getter in `useWalletFeaturesConfig`, and both platforms' debug dev-tool lists.

  On mobile the Wallet 4.0 balance hero is now always rendered: the legacy portfolio graph card is dropped from the portfolio header and read-only screens (the `GraphCard` / `GraphCardContainer` / `PortfolioGraphCard` components stay, still used by the Analytics screen), and the graphRework gating is removed from every mobile call site (Portfolio screen/VM, `Delta`, settings reducer, WalletAssets VM).

- [#19203](https://github.com/LedgerHQ/ledger-live/pull/19203) [`6eea36b`](https://github.com/LedgerHQ/ledger-live/commit/6eea36bfafeba265672a96b37981e2c7e629ef33) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Remove the mainNavigation param of the wallet 4.0 feature flag; the wallet 4.0 main navigation is now always used on mobile and the legacy tab-bar/top-bar code paths are removed

- [#19261](https://github.com/LedgerHQ/ledger-live/pull/19261) [`35d4af9`](https://github.com/LedgerHQ/ledger-live/commit/35d4af90e7bee849814cd98358c80e20ef4e4f2a) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Wallet 4.0 Q1 cleanup on mobile:

  - Remove the `quickActionCtas` param of the `lwmWallet40` feature flag. The quick-action CTAs are now always enabled; the `shouldDisplayQuickActionCtas` getter and the legacy `PortfolioQuickActionsBar` are removed.
  - Remove the legacy (pre-4.0) Portfolio screen. `PortfolioRootScreen` now always renders the MVVM `Portfolio` / `ReadOnlyPortfolio`, and the dead legacy screen files are deleted.

## 0.12.0

### Minor Changes

- [#18620](https://github.com/LedgerHQ/ledger-live/pull/18620) [`dd0be79`](https://github.com/LedgerHQ/ledger-live/commit/dd0be79ac4a388e9db17e349fbdf218f0a05a91f) Thanks [@jiyuzhuang](https://github.com/jiyuzhuang)! - Add Q2 Tour on Portfolio with theme-aware slide images, Figma copy, persisted hasSeen state, and lwdWallet40 q2Tour flag

- [#18550](https://github.com/LedgerHQ/ledger-live/pull/18550) [`30cfdb1`](https://github.com/LedgerHQ/ledger-live/commit/30cfdb1c3c4bcaa9beab26cb8d28663d7a3daf1e) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Add swapEntryPoint tracking field and ptxSwapLiveAppOnAsset feature flag

- [#19098](https://github.com/LedgerHQ/ledger-live/pull/19098) [`98eb6d6`](https://github.com/LedgerHQ/ledger-live/commit/98eb6d636e8cbcf1ed35449f7070ac2a84b8b148) Thanks [@ysitbon](https://github.com/ysitbon)! - feature-flags: apply env (`FEATURE_FLAGS`) overrides at store boot even when the first remote-flags fetch fails. The middleware now re-resolves once on the first settled fetch — on success as before, and once on the first failure — so env (and version/language) resolution runs at boot without depending on a successful remote fetch. Subsequent failed polls do not re-resolve (a one-shot guard), so there is no per-poll churn. No app changes are required: any consumer of `createFeatureFlagsMiddleware` gets correct env-at-boot resolution.

- [#18681](https://github.com/LedgerHQ/ledger-live/pull/18681) [`ad68778`](https://github.com/LedgerHQ/ledger-live/commit/ad68778ad71686c9e4f397276917e606a099f573) Thanks [@mitchellv-ledger](https://github.com/mitchellv-ledger)! - Remove llmAnalyticsOptInPrompt feature flag and unused variant B code

- [#18660](https://github.com/LedgerHQ/ledger-live/pull/18660) [`1f41eee`](https://github.com/LedgerHQ/ledger-live/commit/1f41eee5b4dc6aa50accd94e5a0d6c98fcf76e23) Thanks [@mitchellv-ledger](https://github.com/mitchellv-ledger)! - Remove "llmHomescreen" feature flag and legacy code in lwm

- [#18572](https://github.com/LedgerHQ/ledger-live/pull/18572) [`93a84fb`](https://github.com/LedgerHQ/ledger-live/commit/93a84fbadb2b1a0e529e2ffa08ca1de790355934) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - feat: add new evm chain

- [#18604](https://github.com/LedgerHQ/ledger-live/pull/18604) [`1f11587`](https://github.com/LedgerHQ/ledger-live/commit/1f11587b4681429aa9be2dc50035f292e0394108) Thanks [@RobinVncnt](https://github.com/RobinVncnt)! - Add foundation for the image-based Q2 Wallet V4 Tour: new `q2Tour` parameter on the `lwmWallet40` feature flag and a persisted `hasSeenQ2WalletV4Tour` mobile settings flag

- [#18669](https://github.com/LedgerHQ/ledger-live/pull/18669) [`94923e3`](https://github.com/LedgerHQ/ledger-live/commit/94923e36342b58ebd4754ce41324680bd9eb1bfd) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - add robinhood disclaimer ff

- [#18011](https://github.com/LedgerHQ/ledger-live/pull/18011) [`ca20506`](https://github.com/LedgerHQ/ledger-live/commit/ca20506c138a1cfb9c254f61e6bb930aea4c6ab8) Thanks [@hhumphrey-ledger](https://github.com/hhumphrey-ledger)! - Forward on the currencyId to the earn deposit screen to support the swap to earn feature

## 0.12.0-next.2

### Minor Changes

- [#19098](https://github.com/LedgerHQ/ledger-live/pull/19098) [`98eb6d6`](https://github.com/LedgerHQ/ledger-live/commit/98eb6d636e8cbcf1ed35449f7070ac2a84b8b148) Thanks [@ysitbon](https://github.com/ysitbon)! - feature-flags: apply env (`FEATURE_FLAGS`) overrides at store boot even when the first remote-flags fetch fails. The middleware now re-resolves once on the first settled fetch — on success as before, and once on the first failure — so env (and version/language) resolution runs at boot without depending on a successful remote fetch. Subsequent failed polls do not re-resolve (a one-shot guard), so there is no per-poll churn. No app changes are required: any consumer of `createFeatureFlagsMiddleware` gets correct env-at-boot resolution.

## 0.12.0-next.1

### Minor Changes

- [#18550](https://github.com/LedgerHQ/ledger-live/pull/18550) [`30cfdb1`](https://github.com/LedgerHQ/ledger-live/commit/30cfdb1c3c4bcaa9beab26cb8d28663d7a3daf1e) Thanks [@ooke-ledger](https://github.com/ooke-ledger)! - Add swapEntryPoint tracking field and ptxSwapLiveAppOnAsset feature flag

<!-- changelog-pruned: older entries were removed to keep this file small. Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->

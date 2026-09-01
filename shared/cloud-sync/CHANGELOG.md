# @shared/cloud-sync

## 0.3.0-next.0

### Minor Changes

- [#21074](https://github.com/LedgerHQ/ledger-live/pull/21074) [`a8c34d0`](https://github.com/LedgerHQ/ledger-live/commit/a8c34d0d9469b4e11339edfbef53445e58194fd8) Thanks [@Sebastien-Dav1d](https://github.com/Sebastien-Dav1d)! - Introduce `@support/jest-shared` with `createSharedJestConfig` and `createSharedUiJestConfig` factories; wire all `shared/*` jest configs to use them.

## 0.2.0

### Minor Changes

- [#20555](https://github.com/LedgerHQ/ledger-live/pull/20555) [`9e0c703`](https://github.com/LedgerHQ/ledger-live/commit/9e0c703631379409b5a9bee047832e9ac147a249) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Isolate wallet sync module failures instead of failing the whole sync: the aggregator validates each module slice on its own and quarantines a broken one, preserving its raw distant value, while every other module keeps syncing. A quarantine is reported as the module key plus the failure kind only, never the offending data.

  A distant document is now typed as what it is — a `DistantDocument` (`Record<string, unknown>`) whose slices are trusted per module — instead of the aggregate of the module schemas that nothing validates. `parseDistantState` is removed: it cast an unvalidated document to a validated type, and the aggregator already narrows the document at runtime. `CloudSyncSDK` drops its `schema` constructor option, which was never applied to anything and only served to infer that same misleading type; the class is now parameterised by its document type directly.

  `recentAddresses` drops its corrupted-address repair path. `CorruptedNestedAddressDistantSchema` and the lenient `z.array(z.unknown())` wrapper that swallowed every bad entry are removed together: a corrupted distant entry now quarantines the module, so the slice is preserved verbatim and reported, instead of being silently rewritten — or, had only the transform been removed, silently dropped. The local-cache repair in `schema.ts`/`store.ts` is untouched; it migrates data on disk, which quarantine does not cover.

## 0.2.0-next.0

### Minor Changes

- [#20555](https://github.com/LedgerHQ/ledger-live/pull/20555) [`9e0c703`](https://github.com/LedgerHQ/ledger-live/commit/9e0c703631379409b5a9bee047832e9ac147a249) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Isolate wallet sync module failures instead of failing the whole sync: the aggregator validates each module slice on its own and quarantines a broken one, preserving its raw distant value, while every other module keeps syncing. A quarantine is reported as the module key plus the failure kind only, never the offending data.

  A distant document is now typed as what it is — a `DistantDocument` (`Record<string, unknown>`) whose slices are trusted per module — instead of the aggregate of the module schemas that nothing validates. `parseDistantState` is removed: it cast an unvalidated document to a validated type, and the aggregator already narrows the document at runtime. `CloudSyncSDK` drops its `schema` constructor option, which was never applied to anything and only served to infer that same misleading type; the class is now parameterised by its document type directly.

  `recentAddresses` drops its corrupted-address repair path. `CorruptedNestedAddressDistantSchema` and the lenient `z.array(z.unknown())` wrapper that swallowed every bad entry are removed together: a corrupted distant entry now quarantines the module, so the slice is preserved verbatim and reported, instead of being silently rewritten — or, had only the transform been removed, silently dropped. The local-cache repair in `schema.ts`/`store.ts` is untouched; it migrates data on disk, which quarantine does not cover.

## 0.1.0

### Minor Changes

- [#20423](https://github.com/LedgerHQ/ledger-live/pull/20423) [`c4a8141`](https://github.com/LedgerHQ/ledger-live/commit/c4a8141369e63e875fb5bfc9aef3f53362150338) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Fix Ledger Sync surfacing a 401 instead of refreshing the expired JWT

  `@shared/cloud-sync` threw a bare `Error` carrying only `HTTP <status> on <method> <url>`, dropping
  both the HTTP status and the backend's response body. The trustchain JWT recovery in
  `genericWithJWT` could not classify it, so an expired token was rethrown instead of being refreshed
  and retried: the 401 reached the UI, and on mobile it fed the wallet-sync error into the account
  sync indicator ("Some account data couldn't load").

  `CloudSyncHttpError` now carries `status`, `url`, `method` and the backend's verbatim message, and
  `auth.ts` classifies 4xx from the numeric `status` rather than from the `LedgerAPI4xx` class name,
  so recovery no longer depends on which transport made the call. The error contract expected by the
  trustchain layer is documented in `auth.ts`; a transport whose errors are not `Error`-shaped must
  remap to it at its boundary.

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

## 0.1.0-next.0

### Minor Changes

- [#20423](https://github.com/LedgerHQ/ledger-live/pull/20423) [`c4a8141`](https://github.com/LedgerHQ/ledger-live/commit/c4a8141369e63e875fb5bfc9aef3f53362150338) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Fix Ledger Sync surfacing a 401 instead of refreshing the expired JWT

  `@shared/cloud-sync` threw a bare `Error` carrying only `HTTP <status> on <method> <url>`, dropping
  both the HTTP status and the backend's response body. The trustchain JWT recovery in
  `genericWithJWT` could not classify it, so an expired token was rethrown instead of being refreshed
  and retried: the 401 reached the UI, and on mobile it fed the wallet-sync error into the account
  sync indicator ("Some account data couldn't load").

  `CloudSyncHttpError` now carries `status`, `url`, `method` and the backend's verbatim message, and
  `auth.ts` classifies 4xx from the numeric `status` rather than from the `LedgerAPI4xx` class name,
  so recovery no longer depends on which transport made the call. The error contract expected by the
  trustchain layer is documented in `auth.ts`; a transport whose errors are not `Error`-shaped must
  remap to it at its boundary.

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

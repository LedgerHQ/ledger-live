# @domain/entity-recent-addresses

## 0.2.1-next.0

### Patch Changes

- Updated dependencies [[`a8c34d0`](https://github.com/LedgerHQ/ledger-live/commit/a8c34d0d9469b4e11339edfbef53445e58194fd8)]:
  - @shared/cloud-sync-module@0.4.0-next.0

## 0.2.0

### Minor Changes

- [#20555](https://github.com/LedgerHQ/ledger-live/pull/20555) [`9e0c703`](https://github.com/LedgerHQ/ledger-live/commit/9e0c703631379409b5a9bee047832e9ac147a249) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Isolate wallet sync module failures instead of failing the whole sync: the aggregator validates each module slice on its own and quarantines a broken one, preserving its raw distant value, while every other module keeps syncing. A quarantine is reported as the module key plus the failure kind only, never the offending data.

  A distant document is now typed as what it is — a `DistantDocument` (`Record<string, unknown>`) whose slices are trusted per module — instead of the aggregate of the module schemas that nothing validates. `parseDistantState` is removed: it cast an unvalidated document to a validated type, and the aggregator already narrows the document at runtime. `CloudSyncSDK` drops its `schema` constructor option, which was never applied to anything and only served to infer that same misleading type; the class is now parameterised by its document type directly.

  `recentAddresses` drops its corrupted-address repair path. `CorruptedNestedAddressDistantSchema` and the lenient `z.array(z.unknown())` wrapper that swallowed every bad entry are removed together: a corrupted distant entry now quarantines the module, so the slice is preserved verbatim and reported, instead of being silently rewritten — or, had only the transform been removed, silently dropped. The local-cache repair in `schema.ts`/`store.ts` is untouched; it migrates data on disk, which quarantine does not cover.

### Patch Changes

- Updated dependencies [[`9e0c703`](https://github.com/LedgerHQ/ledger-live/commit/9e0c703631379409b5a9bee047832e9ac147a249)]:
  - @shared/cloud-sync-module@0.3.0

## 0.2.0-next.0

### Minor Changes

- [#20555](https://github.com/LedgerHQ/ledger-live/pull/20555) [`9e0c703`](https://github.com/LedgerHQ/ledger-live/commit/9e0c703631379409b5a9bee047832e9ac147a249) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Isolate wallet sync module failures instead of failing the whole sync: the aggregator validates each module slice on its own and quarantines a broken one, preserving its raw distant value, while every other module keeps syncing. A quarantine is reported as the module key plus the failure kind only, never the offending data.

  A distant document is now typed as what it is — a `DistantDocument` (`Record<string, unknown>`) whose slices are trusted per module — instead of the aggregate of the module schemas that nothing validates. `parseDistantState` is removed: it cast an unvalidated document to a validated type, and the aggregator already narrows the document at runtime. `CloudSyncSDK` drops its `schema` constructor option, which was never applied to anything and only served to infer that same misleading type; the class is now parameterised by its document type directly.

  `recentAddresses` drops its corrupted-address repair path. `CorruptedNestedAddressDistantSchema` and the lenient `z.array(z.unknown())` wrapper that swallowed every bad entry are removed together: a corrupted distant entry now quarantines the module, so the slice is preserved verbatim and reported, instead of being silently rewritten — or, had only the transform been removed, silently dropped. The local-cache repair in `schema.ts`/`store.ts` is untouched; it migrates data on disk, which quarantine does not cover.

### Patch Changes

- Updated dependencies [[`9e0c703`](https://github.com/LedgerHQ/ledger-live/commit/9e0c703631379409b5a9bee047832e9ac147a249)]:
  - @shared/cloud-sync-module@0.3.0-next.0

## 0.1.1

### Patch Changes

- Updated dependencies [[`43bf6d8`](https://github.com/LedgerHQ/ledger-live/commit/43bf6d8f6600f70b7c2a85615660e7e150e798bf)]:
  - @shared/cloud-sync-module@0.2.0

## 0.1.1-next.0

### Patch Changes

- Updated dependencies [[`43bf6d8`](https://github.com/LedgerHQ/ledger-live/commit/43bf6d8f6600f70b7c2a85615660e7e150e798bf)]:
  - @shared/cloud-sync-module@0.2.0-next.0

## 0.1.0

### Minor Changes

- [#20362](https://github.com/LedgerHQ/ledger-live/pull/20362) [`bf20a35`](https://github.com/LedgerHQ/ledger-live/commit/bf20a3538b12b1e38a3f049add2c1a84f4e3a129) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add `describeCloudSyncModuleContract` shared Jest contract helper and apply it to accountNamesSyncModule and recentAddressesSyncModule

### Patch Changes

- Updated dependencies [[`bf20a35`](https://github.com/LedgerHQ/ledger-live/commit/bf20a3538b12b1e38a3f049add2c1a84f4e3a129)]:
  - @shared/cloud-sync-module@0.1.0

## 0.1.0-next.0

### Minor Changes

- [#20362](https://github.com/LedgerHQ/ledger-live/pull/20362) [`bf20a35`](https://github.com/LedgerHQ/ledger-live/commit/bf20a3538b12b1e38a3f049add2c1a84f4e3a129) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Add `describeCloudSyncModuleContract` shared Jest contract helper and apply it to accountNamesSyncModule and recentAddressesSyncModule

### Patch Changes

- Updated dependencies [[`bf20a35`](https://github.com/LedgerHQ/ledger-live/commit/bf20a3538b12b1e38a3f049add2c1a84f4e3a129)]:
  - @shared/cloud-sync-module@0.1.0-next.0

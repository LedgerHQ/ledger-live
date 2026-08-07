---
"@shared/cloud-sync-module": minor
"@shared/cloud-sync": minor
"@ledgerhq/live-wallet": minor
"@ledgerhq/live-e2e-shared": minor
"@ledgerhq/web-tools": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Isolate wallet sync module failures instead of failing the whole sync: the aggregator validates each module slice on its own and quarantines a broken one, preserving its raw distant value, while every other module keeps syncing. A quarantine is reported as the module key plus the failure kind only, never the offending data.

A distant document is now typed as what it is — a `DistantDocument` (`Record<string, unknown>`) whose slices are trusted per module — instead of the aggregate of the module schemas that nothing validates. `parseDistantState` is removed: it cast an unvalidated document to a validated type, and the aggregator already narrows the document at runtime. `CloudSyncSDK` drops its `schema` constructor option, which was never applied to anything and only served to infer that same misleading type; the class is now parameterised by its document type directly.

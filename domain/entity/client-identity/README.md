# @domain/entity-client-identity

Privacy-protected identity value objects and Redux slice for the three client identities managed by Ledger Live: **UserId**, **DatadogId**, and **DeviceId**.

## Responsibility

- Define **typed value-object classes** (`UserId`, `DatadogId`, `DeviceId`) that encapsulate identity strings and prevent raw-string leaks — `toString()` returns `[Type:REDACTED]` by design
- Provide a **Redux slice** (`identitiesSlice`) with safe init/import reducers and a persistence contract
- Expose **selectors** used by the sync middleware
- Own the **export allowlist** (`export-rules.json` + `check-export-rules`) that gates which consumer files may call which export method

## Why classes instead of Zod schemas

Identity values are **not plain data** — they carry access rules. A raw `string` userId must never appear in logs, serialized Redux state, or analytics payloads. Classes enforce this at the type level: the only way to get the underlying string is through a named, auditable export method (e.g. `exportUserIdForPushDevicesService()`, `exportUserIdForAnalytics()`). `export-rules.json` then restricts which files may call which method, enforced in CI.

## Dependencies

| Package | Why |
|---|---|
| `@reduxjs/toolkit` | `createSlice` for `identitiesSlice` |
| `uuid` | UUID v4 generation for new identities |

## Public API

```typescript
import {
  DeviceId,
  UserId,
  DatadogId,
  identitiesSlice,
  initialIdentitiesState,
  exportIdentitiesForPersistence,
} from "@domain/entity-client-identity";
```

## Slice reducers

| Reducer | When to use |
|---|---|
| `initFromPersisted(payload)` | App boot — restores persisted identities; generates fresh IDs for missing/blank/dummy values |
| `importFromLegacy({ userId, datadogId? })` | One-time migration from pre-DDD storage |
| `initFromScratch()` | First launch — no persisted state |
| `addDeviceId(deviceId)` | Paired device registered; marks sync as "unsynced" |
| `markSyncCompleted(url)` | Push Devices Service confirmed receipt |

## File structure

```
src/
  ids/
    DeviceId.ts     Class — wraps device token, REDACTED on stringify
    UserId.ts       Class — wraps user UUID, REDACTED on stringify
    DatadogId.ts    Class — wraps Datadog UUID, REDACTED on stringify
    index.ts
  types.ts          IdentitiesState, PushDevicesSyncState, DUMMY_ID_STR
  slice.ts          identitiesSlice + shouldUsePersistedId helper
  selectors.ts      userIdSelector, datadogIdSelector
  persistence.ts    PersistedIdentities interface + exportIdentitiesForPersistence
  index.ts          Public barrel export
export-rules.json   Per-method export allowlist
scripts/
  check-export-rules.mjs   CI check — run by the check-export-rules NX target
```

## Export rules

`export-rules.json` lists, for each export method on the three ID classes, the exact set of files that may call it. CI enforces this via `pnpm --filter @domain/entity-client-identity check-export-rules`. When adding a new consumer, add it to the allowlist first.

## Testing

```sh
pnpm test        # jest
pnpm typecheck   # tsc --noEmit
pnpm --filter @domain/entity-client-identity check-export-rules
```

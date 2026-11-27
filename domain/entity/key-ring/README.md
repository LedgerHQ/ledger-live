# @domain/entity-key-ring

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

The key ring state of this instance: the `trustchain` slice that both apps mount and persist, its Zod
schema, and the selectors features read.

- `keyRingSlice`, its reducer (default export) and actions: import, reset, set key tree, set member key.
  The slice keeps the Redux key `trustchain` and the persisted shape of Ledger Sync v1, so app data
  reloads unchanged.
- Semantic selectors for features: `selectIsKeyRingMember`, `selectIsLedgerSyncActive`,
  `selectKeyRingTreeId`, `selectHasKeyRingMemberKey`.
- `selectKeyRingSecrets` returns the member key and the Ledger Sync key. Only
  `@features/platform-key-ring` reads it; the apps ban it.

Key generation and the boot import of persisted data belong to `@features/platform-key-ring`,
which dispatches this slice's actions. That import checks only the member key, as Ledger Sync v1
did; the rest of the persisted value is kept as stored.

Mocks: `@domain/entity-key-ring/schema.mock` and `@domain/entity-key-ring/slice.mock`.

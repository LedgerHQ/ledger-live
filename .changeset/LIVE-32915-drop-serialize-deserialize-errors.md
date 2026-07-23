---
"@ledgerhq/errors": major
---

Remove `serializeError`, `deserializeError`, `CustomErrorClassType`, and `TransportStatusErrorClassType` from the public exports of `@ledgerhq/errors`.

These APIs are part of the deprecated serialize/deserialize stack being sunset as part of LIVE-32915. All internal callers have been migrated:

- `apps/cli`: inline fallback using `error.name`/`error.message`
- `apps/ledger-live-desktop` (DebugMock): inline reconstruction
- `libs/ledger-wallet-framework/serialization/transaction`: inline cycle-safe serialize/deserialize
- `libs/ledger-live-common/deviceSDK/tasks/core`: replaced `CustomErrorClassType`/`TransportStatusErrorClassType` with `new (...args: any[]) => Error`
- `libs/ledger-live-common/__tests__/errors.ts`: deleted (was testing lib internals)

The implementations remain in `libs/ledgerjs/packages/errors/src/helpers.ts` (internal to the package) for the package's own test suite, but are no longer part of the public API.

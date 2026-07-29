---
"@ledgerhq/errors": major
---

Remove `CustomErrorClassType` and `TransportStatusErrorClassType` from the public exports of `@ledgerhq/errors`.

These type aliases are part of the deprecated serialize/deserialize stack being sunset as part of LIVE-32915. Internal callers have been migrated:

- `libs/ledger-live-common/deviceSDK/tasks/core`: replaced `CustomErrorClassType`/`TransportStatusErrorClassType` with `new (...args: any[]) => Error`
- `libs/ledger-live-common/__tests__/errors.ts`: deleted (was testing lib internals)

Note: `serializeError` and `deserializeError` remain exported for now due to an external dependency (`wallet-api-core@1.35.0`) that imports them. They will be dropped in a follow-up once that package is updated.

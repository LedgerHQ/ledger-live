# @ledgerhq/errors is deprecated

This package is **frozen** and being sunset. It stays published for backward
compatibility (it is consumed externally, including by `@ledgerhq/coin-module-framework`),
but it must not grow.

## Do not

- ❌ Add new error classes here (whether via `createCustomErrorClass` or hand-written).
- ❌ Use `createCustomErrorClass` in any package.
- ❌ Use the serialization stack — `serializeError`, `deserializeError`,
  `addCustomErrorDeserializer`. Send a plain `{ name, message }` shape over a
  boundary and branch on `error.name` at the consumer.

## Do instead

Define errors as plain native classes in your own package's `src/errors.ts`, and
check their type with `error.name === "X"` rather than `instanceof` (the name
survives serialization across IPC / workers / external frameworks).

In the ledger-live repo, the `errors` skill documents the full how-to, and
`libs/ledger-auth/src/errors.ts` is a reference implementation.

## Why it can't just be deleted

- The public API is consumed by external packages and apps; removal is future work.
- ~22 errors are shared by several sibling coin modules and have no editable home
  package below the coin layer yet. They stay here for now; future owner is the
  `coin-module-framework` repo.

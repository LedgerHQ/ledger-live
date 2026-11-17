---
name: rebuild-to-fix-lib-import-errors
description: Rebuild a published monorepo lib when typecheck fails on an import from it, and tell that case apart from a private lib read from source. Read when a typecheck reports an import error from a monorepo lib.
---

Only published packages (no `"private": true` in their `package.json`) build. Their consumers read the
built `lib/` and `lib-es/`, which go stale when the package's source changes. Private packages have no
build: their `exports` point at `src/`, so consumers always read the current source.

## Published lib: rebuild it

```shell
nx run @ledgerhq/name_of_lib_here:build
```

When several are stale, `pnpm build:libs` rebuilds all the published `@ledgerhq` packages.

### Example: `ledger-wallet-framework` changed and the import in `live-common` errors

> src/families/tron/transaction.ts:2:10 - error TS2305: Module '"@ledgerhq/ledger-wallet-framework/account"' has no exported member 'getAccountCurrency'.

`@ledgerhq/ledger-wallet-framework` is published, so rebuild it:

```shell
nx run @ledgerhq/ledger-wallet-framework:build
```

## Private lib: no build to refresh

The error is in the source or the `exports` map, and a rebuild cannot fix it. Check that:

- the subpath has an entry in the lib's `exports`: see the
  [package checklist](../../../docs/new-library.md#package-checklist);
- the error is not in the lib's own source, compiled with the consumer's options: see
  [typescript](../typescript/SKILL.md#packages-read-from-source).

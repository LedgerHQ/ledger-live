---
name: rebuild-to-fix-lib-import-errors
description: Rebuild a monorepo lib that has a build when typecheck fails on an import from it, and tell that case apart from a private lib read from source. Read when a typecheck reports an import error from a monorepo lib.
---

A lib builds when it is published (no `"private": true` in its `package.json`), or when it is a
private package with a `no-build` exception in
[`source-only-debt.mjs`](../../../tools/nx-plugins/enforce-tool-config/rules/source-only-debt.mjs),
whose entry says what its build produces. Its consumers read that output, which goes stale when the
source changes. Any other private package has no build: its `exports` point at `src/`, so consumers
always read the current source.

## Lib with a build: rebuild it

```shell
nx run @ledgerhq/name_of_lib_here:build
```

When several are stale, `pnpm build:libs` rebuilds every `@ledgerhq` package that has a build.

### Example: `ledger-wallet-framework` changed and the import in `live-common` errors

> src/families/tron/transaction.ts:2:10 - error TS2305: Module '"@ledgerhq/ledger-wallet-framework/account"' has no exported member 'getAccountCurrency'.

`@ledgerhq/ledger-wallet-framework` is published, so rebuild it:

```shell
nx run @ledgerhq/ledger-wallet-framework:build
```

## Source-only lib: no build to refresh

The error is in the source or the `exports` map, and a rebuild cannot fix it. Check that:

- the subpath has an entry in the lib's `exports`: see the
  [package checklist](../../../docs/new-library.md#package-checklist);
- the error is not in the lib's own source, compiled with the consumer's options: see
  [typescript](../typescript/SKILL.md#packages-read-from-source).

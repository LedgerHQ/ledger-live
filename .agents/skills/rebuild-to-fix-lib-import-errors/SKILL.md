---
name: rebuild-to-fix-lib-import-errors
description: Rebuild a monorepo lib that has a build when typecheck fails on an import from it, and tell that case apart from a private lib read from source. Read when a typecheck reports an import error from a monorepo lib.
---

Look at what the lib's `exports` point at, not at whether it has a `build` target:

- built output (`lib/`, `lib-es/`), as in published packages and a few private ones: consumers read
  that output, which goes stale when the source changes. Rebuild it.
- `src/`: consumers read the current source, and a rebuild cannot fix the error, even when the lib
  keeps an `nx:noop` `build` target. Go to the source-only checks below. One exception: a lib whose
  `no-build` entry in
  [`source-only-debt.mjs`](../../../tools/nx-plugins/enforce-tool-config/rules/source-only-debt.mjs)
  says its build generates files under `src/` needs that build when those files are missing.

## Lib that exports built output: rebuild it

```shell
nx run @ledgerhq/name_of_lib_here:build
```

When several are stale, `pnpm build:libs` runs `build` on the `@ledgerhq` packages, minus the ones its
script in the root `package.json` excludes.

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

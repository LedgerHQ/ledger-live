---
name: rebuild-to-fix-lib-import-errors
description: Rebuild a monorepo lib when typecheck fails on an import that resolves to its built output, and tell that case apart from an import read from source. Read when a typecheck reports an import error from a monorepo lib.
---

Look at the file the consumer resolves the import to, not at whether the lib has a `build` target.
The `@support/tsconfig` presets set the `@ledgerhq/source` condition, so most consumers resolve even a
published lib to its `src/` (the `--traceResolution` output of `tsc` shows the resolved file):

- a file under `lib/` or `lib-es/`: the consumer reads built output, which goes stale when the source
  changes. That happens when the `exports` entry has no `@ledgerhq/source` condition, or when the
  consumer's config clears `customConditions` (a `tsconfig.build.json`). Rebuild the lib.
- a file under `src/`: the consumer reads the current source, and a rebuild cannot fix the error, even
  when the lib keeps an `nx:noop` `build` target. Go to the source-only checks below. One exception:
  a lib whose `no-build` entry in
  [`source-only-debt.mjs`](../../../tools/nx-plugins/enforce-tool-config/rules/source-only-debt.mjs)
  says its build generates files under `src/` needs that build when those files are missing.

## Built output: rebuild the lib

```shell
nx run @ledgerhq/name_of_lib_here:build
```

When several are stale, `pnpm build:libs` runs `build` on the `@ledgerhq` packages, minus the ones its
script in the root `package.json` excludes.

## Source: no build to refresh

The error is in the source or the `exports` map, and a rebuild cannot fix it. Check that:

- the subpath has an entry in the lib's `exports`: see the
  [package checklist](../../../docs/new-library.md#package-checklist);
- the error is not in the lib's own source, compiled with the consumer's options: see
  [typescript](../typescript/SKILL.md#packages-read-from-source).

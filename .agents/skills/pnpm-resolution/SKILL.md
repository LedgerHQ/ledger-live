---
name: pnpm-resolution
description: |
  `.pnpmfile.cjs` hooks and `pnpm.packageExtensions` are deprecated. Read when fixing
  MODULE_NOT_FOUND, undeclared peers, lockfile churn, or editing `.pnpmfile.cjs`,
  `pnpm.packageExtensions`, or `.npmrc` hoist patterns.
---

# pnpm resolution workarounds are deprecated

`.pnpmfile.cjs` `readPackage` hooks and `pnpm.packageExtensions` are **deprecated**. Burn-down: [LIVE-37807](https://ledgerhq.atlassian.net/browse/LIVE-37807).

Do **not** add a hook, a `packageExtensions` entry, or a `public-hoist-pattern` to paper over a missing dependency.

They invent a graph that `package.json` does not declare. That poisons `nx affected` (`projectsAffectedByDependencyUpdates: "auto"`) and forces the whole lockfile into the cache hash.

## Instead

1. **Declare it** on the workspace package that imports it (`dependencies`, or `peerDependencies` when a singleton is required).
2. **Fix upstream** if a third-party package `require()`s something it does not list — PR, then bump.
3. **`pnpm.overrides` / catalog** only pin versions; they do not replace a missing declaration.
4. Existing entries: shrink them. Moving a `.pnpmfile.cjs` hook into `packageExtensions` is the same workaround.

When rebasing a branch that touches the lockfile: check out `origin/develop`'s `pnpm-lock.yaml`, then `SKIP_BUNDLE_CHECK=1 pnpm install` on top of the branch manifests. Do not keep a lockfile merged from the old branch — it carries stale snapshots (Babel, Metro, extra axios variants). A second `--lockfile-only` should be a no-op.

`pnpm.patchedDependencies` is a content fork, not this class of workaround. Prefer upstream; do not use a patch to inject undeclared deps.

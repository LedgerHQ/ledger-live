# dependency-checks

Guards the resolved dependency graph. A package usually arrives transitively, several levels
down, where a `package.json` lint cannot see it — so the check reads what pnpm actually resolved.

## How it runs

[`.pnpmfile.cjs`](../../.pnpmfile.cjs) calls `assertDependencyChecks` from pnpm's
`afterAllResolved` hook, which receives the lockfile object pnpm is about to write. The error
names the group and, for allowlists, the dependency chain:

```console
$ pnpm install
1 dependency check violation(s):

secp256k1 — The monorepo converges on @noble/curves for secp256k1 (LIVE-37372).
  tiny-secp256k1 entered the tree: libs/coin-modules/coin-bitcoin > ecpair > tiny-secp256k1
```

The hook runs when pnpm resolves, which is any `pnpm install` that is not a frozen install
against an already matching lockfile. That is the interesting case: adding a dependency updates
the lockfile and re-resolves, so the guard sees the new graph.

`--ignore-pnpmfile` is still caught. The lockfile stores a `pnpmfileChecksum` of `.pnpmfile.cjs`;
a frozen install whose checksum does not match fails with `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH`.
Hand-editing `pnpm-lock.yaml` while leaving that checksum alone is not covered — frozen CI would
skip resolution and never call the hook.

## Config

[config.json](./config.json) has two kinds of rule:

- **`singletons`** — a package name may resolve to at most `maxVersions` distinct versions
  (default 1). Add `react`, `electron`, or anything else that must not fork in the tree.
- **`allowlists`** — a named group with `why`, the `patterns` it watches (`*` is the only glob
  honoured) and the `packages` allowed to match them. Anything else matching the patterns fails
  the install, so a package is caught even under a name nobody has seen yet.

Add an allowlist group when the rule is "only these packages may satisfy this concern" — one
curve implementation, one bundler, one HTTP client. The first group is `secp256k1`
([LIVE-37372](https://ledgerhq.atlassian.net/browse/LIVE-37372)).

## Listing a package in an allowlist

Entries need a `reason`. Add `tolerated` with an `exit` condition when we only put up with it,
and `target` for the one package the group converges on.

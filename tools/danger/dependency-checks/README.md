# dependency-checks

Guards the resolved dependency graph. A package usually arrives transitively, several levels
down, where a `package.json` lint cannot see it — so the check reads what pnpm actually resolved.

## How it runs

[`check-lockfile.ts`](./check-lockfile.ts) parses the committed `pnpm-lock.yaml` and passes it to
`assertDependencyChecks`. It runs from the `dependency-checks` step of the `hk` pre-commit hook and
from Danger ([`validation/dependency-checks.ts`](../validation/dependency-checks.ts)), which fails the required
"Validate PR conventions" job. To run it by hand: `node tools/danger/dependency-checks/cli.ts`. The error
names the group and, for allowlists, the dependency chain:

```console
$ node tools/danger/dependency-checks/cli.ts
1 dependency check violation(s):

secp256k1 — The monorepo converges on @noble/curves for secp256k1 (LIVE-37372).
  tiny-secp256k1 entered the tree: libs/coin-modules/coin-bitcoin > ecpair > tiny-secp256k1
```

It reads the file rather than hooking into `pnpm install`, so it also covers lockfiles regenerated
by Renovate (which runs pnpm with `--ignore-pnpmfile`) and hand edits.

## Config

[config.json](./config.json) has three kinds of rule:

- **`singletons`** — a package name may resolve to at most `maxVersions` distinct versions
  (default 1). Add `react`, `electron`, or anything else that must not fork in the tree.
- **`denylists`**: a named group with `why` and `packages`, each with a `reason` and the
  alternative to `use`. A key is a package name or a `*` pattern. Any match fails the install, so
  a dependency we replaced cannot come back transitively. Being unused is not a reason: only
  list a package when a better alternative exists.
- **`allowlists`** — a named group with `why`, the `patterns` it watches (`*` is the only glob
  honoured) and the `packages` allowed to match them. Anything else matching the patterns fails
  the install, so a package is caught even under a name nobody has seen yet.

Add a denylist entry when a dependency has a better replacement. Add an allowlist group when the rule is "only these packages may satisfy this concern", for example one
curve implementation, one bundler, one HTTP client. The first group is `secp256k1`
([LIVE-37372](https://ledgerhq.atlassian.net/browse/LIVE-37372)).

## Listing a package in an allowlist

Entries need a `reason`. Add `tolerated` with an `exit` condition when we only put up with it,
and `target` for the one package the group converges on.

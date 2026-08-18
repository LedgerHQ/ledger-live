# prune-changelogs

Trims old entries from every workspace `CHANGELOG.md`, keeping the newest N.

## Why

The release workflows commit through `planetscale/ghcommit-action`, which uses the
GitHub GraphQL `createCommitOnBranch` mutation. That mutation takes **whole file
contents, not diffs**, so a one-line version bump prepended to a 2.9 MB changelog
ships all 2.9 MB.

A release bumping ~146 packages sent ~21 MB raw / 28 MB base64 in a single request
and intermittently died with `502 Bad Gateway`. Entries had accumulated to 500–700
per changelog. Pruning to 20 takes the whole set from 22.4 MB to 4.1 MB and leaves
no single file above ~440 KB base64.

Old entries are deleted, not archived: an archive file would be re-sent in full on
every commit that appends to it, recreating the problem. History stays available in
`git log -p CHANGELOG.md` and in the GitHub release for each version.

## Usage

```sh
node tools/prune-changelogs/bin/prune-changelogs.mjs --dry-run
node tools/prune-changelogs/bin/prune-changelogs.mjs --keep=20
```

| Flag | Default | Meaning |
| --- | --- | --- |
| `--keep=<n>` | `20` | Newest version entries to retain |
| `--dry-run` | off | Report what would change without writing |
| `--cwd=<dir>` | `process.cwd()` | Workspace root to scan |

Requires Node ≥ 23.6 for TypeScript type stripping; the repo pins 24.14.0 in
`mise.toml`.

## Where it runs

`Prune changelogs` in [release-create.yml](../../.github/workflows/release-create.yml),
after `changeset pre enter` and before the files are staged.

**Only ever prune the release branch cut from develop.** `release-create` cuts
`release` from `develop`, so the prune reaches `main` through the normal
release→main merge and `develop` through the backmerge PR. Pruning two branches
independently produces differently-bounded deletions of the same lines, which
conflicts on every subsequent merge.

## Invariants

`pruneChangelog` throws rather than write a changelog that would break releases:

- the `# <package name>` header must survive byte-exactly
- the newest entry must survive byte-exactly

Both matter because `changeset version` inserts new entries directly below the
header. If a prune altered that region, its diff would overlap the region releases
edit and every develop/main merge would conflict.

Files are skipped, not rewritten, when they have no `# name` header, are already
within the limit, or are so short that the footer would outweigh the entries
removed.

Pruned output is already prettier-clean, so the tool does not run prettier —
`test/prettier-stability.test.ts` pins that property, since `changeset version`
reformats these files on every release.

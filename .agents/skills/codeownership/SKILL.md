---
name: codeownership
description: Maintain CODEOWNERS file and team directories. Provides resolve-codeowners.js to annotate files with their owner team — useful to split a large PR by team. Use when working with "**/team-*/**" or splitting monolithic files.
---

# Codeownership

## Why

- To reduce cross-team review bottlenecks

## What

- Make ownership of team specific directories clear
- Organise some directories into team-specific sub-directories
- Maintain CODEOWNERS files when team specific directories are added or removed
- Split monolithic files or folders that have been identified as being touched by too many teams

## Resolving ownership for a list of files

Use `resolve-codeowners.js` to annotate any list of files with their CODEOWNERS team — handy when splitting a large PR by team owner. The script finds `ignore` in the pnpm virtual store automatically (no extra install).

```bash
# From a git diff
git diff --name-only HEAD~1 | node .agents/skills/codeownership/resolve-codeowners.js

# Explicit file list
node .agents/skills/codeownership/resolve-codeowners.js apps/ledger-live-desktop/src/foo.ts libs/env/src/bar.ts

# Override CODEOWNERS location
node .agents/skills/codeownership/resolve-codeowners.js --codeowners /path/to/CODEOWNERS <files...>
```

Output format (same columns as CODEOWNERS, but resolved to actual files):
```
apps/ledger-live-desktop/src/main/index.ts  @ledgerhq/platform
apps/ledger-live-desktop/src/renderer/foo.ts  @ledgerhq/wallet-xp
.github/workflows/e2e.yml  @ledgerhq/wallet-ci @ledgerhq/qaa
random/unknown/file.xyz  (no owner)
```

Semantics: last-rule-wins; ownerless entries appear as `(no owner)`.

## Target

### Splitting a monolithic file

- Split `[foo].ts` into `[foo]/team-[name]/*.ts`

### Maintaining team specific directories

#### Example

**`/shared/feature-flags/src/flags/`** contains `team-coin-integration`, `team-engagement`, `team-live-devices`, etc.

**`CODEOWNERS`** defines the owner for each of these:

```
**/team-coin-integration/         @ledgerhq/coin-integration
**/team-engagement/               @ledgerhq/engagement
**/team-live-devices/             @ledgerhq/live-devices
```

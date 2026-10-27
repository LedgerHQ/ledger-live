---
name: create-changeset
description: Create changesets for the ledger-live monorepo using @changesets/cli. Use when the user asks to add a changeset, prepare a release, or document package changes for a PR.
---

# Create Changeset

Create a `.changeset/<adjective-noun-verb>.md` file (human-readable random identifier, matching `@changesets/cli` convention) with this format:

```markdown
---
"package-name": minor
---

Short description of the change
```

## Package Names

Package names **must match exactly** what's in each `package.json`:

| App / Lib | Package name |
|-----------|-------------|
| Mobile app | `live-mobile` |
| Desktop app | `ledger-live-desktop` |
| Common lib | `@ledgerhq/live-common` |
| Coin modules | `@ledgerhq/coin-<name>` (e.g. `@ledgerhq/coin-sui`) |
| Layer packages | `@shared/<name>`, `@domain/entity-<name>`, `@domain/api-<name>`, `@features/flow-<name>`, `@features/platform-<name>`, `@devtools/<name>` (e.g. `@domain/entity-contact`, `@features/flow-contacts`) |
| Other libs | Check the lib's `package.json` `name` field |

## Private and published packages

- **Layer packages are private.** Every package under `shared/`, `domain/`, `features/`, `devtools/` and `support/` has `"private": true` and is never published to npm. [`.changeset/config.json`](../../../.changeset/config.json) sets `privatePackages.version: true` and `tag: false`: a changeset still bumps a private package's version and writes its `CHANGELOG.md`, but publishes and tags nothing. Name the changed layer packages in the changeset like any other package, together with the app (`ledger-live-desktop`, `live-mobile`) whose users see the change.
- **No changeset for development-only changes.** A change that only touches `support/` presets or `devDependencies` needs none, and neither do docs and skills.
- **Published packages** are the `@ledgerhq/*` packages without `"private": true` in their `package.json`, almost all under `libs/`. Their changeset becomes an npm release.

## Impact Levels

| Level | When to use |
|-------|-------------|
| `minor` | The minimum: new features, bug fixes, internal changes |
| `major` | Breaking changes (rare, requires discussion) |
| `patch` | Only in a PR based on a `hotfix` branch, never on `develop` |

## Description

- One line, concise but descriptive
- Format: `<verb> <what>` or conventional commit style
- Examples:
  - `Add portfolio analytics dashboard with performance metrics`
  - `Fix transaction signing issue on mobile`
  - `Flush mobile content card click analytics before opening links`

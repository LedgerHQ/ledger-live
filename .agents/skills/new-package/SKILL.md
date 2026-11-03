---
name: new-package
description: Scaffold a new package under `shared/`, `domain/` or `features/` with the nx generator, then finish its README, CODEOWNERS line and knip-ready exports. Use when adding a new internal package in the monorepo layers, or when a package still lacks a README status marker or a CODEOWNERS entry.
---

# New package: generate, then register

Pick the layer with [structure-flow](../structure-flow/SKILL.md) before running the generator. The
generator writes the tool scripts and presets the layer expects; this skill covers what still belongs
in the first PR.

## 1. Generate the package

From the repository root:

```bash
pnpm nx g @ledgerhq/generators:package <name> \
  --layer <shared|domain-entity|domain-api|feature-platform|feature-flow> \
  --platform <logic|web|native|dual> \
  [--description "One line on what the package owns"]
pnpm i
```

| Option | Required | Meaning |
| --- | --- | --- |
| `name` | yes | Folder name in kebab-case (e.g. `contacts`). The layer prefixes it to the npm name (`shared/contacts` → `@shared/contacts`, `domain/entity/contact` → `@domain/entity-contact`). |
| `layer` | yes | `shared`, `domain-entity`, `domain-api`, `feature-platform` or `feature-flow`. |
| `platform` | yes | `logic`, `web`, `native` or `dual`. A pair the layer docs forbid is rejected with the allowed list. |
| `description` | no | One line for `package.json` and the README title block. |
| `skipFormat` | no | Internal: skip formatting generated files (default false). |

The generator creates a placeholder module and test, a pure `export *` barrel, an `internals.ts` stub
per [package-public-api](../package-public-api/SKILL.md), explicit `exports` (no `./*` wildcard),
README with an **UNSTABLE** status callout, tsconfig on the right `@support/tsconfig` archetype, a
one-line jest config on the matching `@support/jest` factory, and `project.json` when the layer uses
one. Tooling details live in [support-config](../support-config/SKILL.md); change them only when the
generated preset is wrong for the package.

## 2. README and status marker

Replace the generator's one-line description with a short scope: problem solved, main exports, who
consumes it. Keep the status callout directly under the `# Title` heading. Templates and when to move
between STABLE, UNSTABLE and DEPRECATED are in [docs/new-library.md](../../../docs/new-library.md#readme-status-marker).

## 3. CODEOWNERS

Add a rule for the package directory in the root [`CODEOWNERS`](../../../CODEOWNERS). Match a
neighbour of the same layer and team, or resolve owners with
[codeownership](../codeownership/SKILL.md):

```bash
node .agents/skills/codeownership/resolve-codeowners.js <path/to/new/file.ts>
node .agents/skills/codeownership/resolve-codeowners.js --check
```

Example:

```text
domain/entity/contact/    @ledgerhq/wallet-xp
```

## 4. Knip

New layer packages start knip-clean: explicit `exports` only, no entry in
[`support/knip/knip.json`](../../../support/knip/knip.json). Dual-platform packages add
`knip.web.config.mjs` and `knip.native.config.mjs` per
[knip-migration](../knip-migration/SKILL.md). Run knip on the package before the PR merges.

## After the scaffold

| Layer / shape | Read next |
| --- | --- |
| `domain/entity` or `domain/api` | [domain-data](../domain-data/SKILL.md) |
| `features/flow` | [flow-package](../flow-package/SKILL.md) and [mvvm-architecture](../mvvm-architecture/SKILL.md) |
| Platform-split React UI | [universal-components](../universal-components/SKILL.md) |

Review an existing package against the checklist in [docs/new-library.md](../../../docs/new-library.md).

## Validate

Before committing, run [validate-changes](../validate-changes/SKILL.md).

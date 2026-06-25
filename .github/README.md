---
name: github-config
description: Overview of .github (workflows, templates, automation) and how PR labels are generated from scopes.ts.
---

# `.github`

GitHub configuration for the `ledger-live` monorepo: CI/CD workflows, issue and pull
request templates, repository automation, and the shared scope definitions.

For git conventions, scope values, commit types, and PR rules see
[`CONTRIBUTING.md`](../CONTRIBUTING.md).

## Contents

| Path | Description |
| --- | --- |
| [`workflows/`](./workflows) | GitHub Actions workflows (CI, releases, e2e, automation). |
| [`workflow-templates/`](./workflow-templates) | Reusable starter workflows for the org. |
| [`ISSUE_TEMPLATE/`](./ISSUE_TEMPLATE) | Bug report / feature request issue templates. |
| [`pull_request_template.md`](./pull_request_template.md) | Default PR description template. |
| [`templates/`](./templates) | Shared snippets reused across workflows and templates. |
| [`scopes.ts`](./scopes.ts) | Canonical scope definitions — single source of truth for scope values and the paths they map to. |
| [`labeler.yml.ts`](./labeler.yml.ts) | Generator that turns `scopes.ts` into `labeler.yml`. |
| [`labeler.yml`](./labeler.yml) | **Generated** config consumed by [`actions/labeler`](https://github.com/actions/labeler). Do not edit by hand. |
| [`node-shims.d.ts`](./node-shims.d.ts) / [`tsconfig.json`](./tsconfig.json) | TypeScript support for running the `.ts` scripts in this folder. |
| [`copilot-instructions.md`](./copilot-instructions.md) | Instructions for the automated reviewer. |
| [`_dependabot-disabled.yml`](./_dependabot-disabled.yml) | Dependabot config (currently disabled). |

## PR labels are generated from scopes

[`scopes.ts`](./scopes.ts) is the canonical scope definition (see
[`CONTRIBUTING.md`](../CONTRIBUTING.md#scope-values) for how scopes are used). Each
scope maps to the glob `paths` that belong to it, and that mapping drives PR labels:

```
scopes.ts ──(pnpm generate:labeler)──> labeler.yml ──(actions/labeler)──> PR labels
```

The [`[CI] - Labeler - PR`](./workflows/labeler.yml) workflow runs
[`actions/labeler`](https://github.com/actions/labeler) against the generated
[`labeler.yml`](./labeler.yml), so a PR gets the label of every scope whose paths it
touches.

`labeler.yml` is generated — never edit it by hand. After changing
[`scopes.ts`](./scopes.ts), regenerate and commit it alongside your change:

```bash
pnpm generate:labeler
```

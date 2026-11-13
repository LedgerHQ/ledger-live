# Project Context

## Overview

"Ledger Wallet" (formerly "ledger-live") is a crypto wallet. This pnpm and Nx monorepo contains multiple frontend apps and over 150 library packages. See the root [README](./README.md) for an overview.

We are working towards consistency across all those packages but each workspace has it's own details. Read local README files relevant to where you are working.

## Where to add new code

New code goes in the [monorepo layers](./docs/monorepo-architecture.md) — `shared/`, `domain/`, `features/`, `apps/`. `libs/` is legacy: maintained, not grown.

When creating a new package, follow [docs/new-library.md](./docs/new-library.md) guidelines.

## Third-party libraries

New runtime third-party libraries are not added to apps directly (framework singletons, the design system and tooling excepted). The lowest valid package of the [monorepo layers](./docs/monorepo-architecture.md) (`shared/`, `domain/`, `features/`) owns each one and exposes our own API. Before adding a dependency to `apps/*/package.json`, read the [wrap-third-party-libs](./.agents/skills/wrap-third-party-libs/SKILL.md) skill.

## Repo Commands

Prefer commands given in local README files. For example appls like [Ledger Wallet Desktop](./apps/ledger-live-desktop/README.md) and [Ledger Wallet Mobile](./apps/ledger-live-mobile/README.md) have very specific commands for setup, dev and build commands.

For general test, build and check recipes see [/docs/repo-commands.md](/docs/repo-commands.md), which also contains notes on Nx, filtering and aliases.

## External Work Links

When a task includes Jira or Confluence links, use Atlassian MCP to fetch and read the referenced ticket or page by default before summarizing, planning, or implementing.

When a task involves GitHub — pull requests, issues, CI checks, or releases — use the `gh` CLI by default.

## Commits and changesets

Before committing, read the [git-conventions](./.agents/skills/git-conventions/SKILL.md) skill. Before creating or editing a file in `.changeset/`, read the [create-changeset](./.agents/skills/create-changeset/SKILL.md) skill: it decides whether a change needs one and which bump to use.

## Validate Before Finishing

Before completing or pushing code changes, run the [validate-changes](./.agents/skills/validate-changes/SKILL.md) skill.

## CI runners

Before adding or changing a `runs-on` in `.github/workflows/`, read the [ci-runners](./.agents/skills/ci-runners/SKILL.md) skill. Several `ledger-live-*` runners are deprecated.

Reusable workflows and composite actions are called `@develop`, even from release and hotfix branches whose code is older. Before changing one, read the [ci-workflow-refs](./.agents/skills/ci-workflow-refs/SKILL.md) skill. It also shows how to test such a change before merge.

CI pulls npm and Maven packages through JFrog. Before adding a package install or Gradle build to a CI job, or a Maven repository to an Android build, read [ci-jfrog](./docs/contributing/ci-jfrog.md).

Runner images bake the mise toolchain and the Android AVD. Before changing a version in `mise.toml` or the AVD configuration, read the [runner-images](./.agents/skills/runner-images/SKILL.md) skill.

## Accounts

The legacy `Account` type is being retired. Before reading or showing account data, read [/docs/account-models](/docs/account-models/README.md).

## Configuration and environment variables

Before adding any configuration value — an environment variable, a URL, a partner key — read [/docs/configuration.md](/docs/configuration.md) to pick its home. `@shared/env` is deprecated and takes no new definitions.

## Keep the external services catalog up to date

New endpoint or new SDK that phones home? Add it to [/docs/services.md](/docs/services.md).

## Read READMEs for packages where you're working

See examples:

- **Entity packages** (`domain/entity/`): read `domain/entity/README.md`
- **API packages** (`domain/api/`): read `domain/api/README.md`
- **Shared packages** (`shared/**`): read `shared/README.md`
- **Support packages** (`support/**`): read `support/README.md`

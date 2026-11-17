# Repo commands

## Setup

Regardless of where you're working setup is the same:

```bash
mise install    # Install pinned Node, pnpm, and other tools (see mise.toml)
pnpm install    # Install all dependencies
```

Tip: you can use `pnpm install --ignore-scripts` if hitting issues with postinstall steps that are unrelated to your needs.

## Prefer local READMEs

Always assume commands and instructions in local README takes priority over the guidance given here.

For example, [apps/ledger-live-mobile/README.md](../apps/ledger-live-mobile/README.md) provides better guidance to work on mobile than you will find here.

## Common recipes

### Building

Private packages have no build: apps, tests and typecheck read their `src/`. Published packages
build, and so do the private exceptions listed in
[`source-only-debt.mjs`](../tools/nx-plugins/enforce-tool-config/rules/source-only-debt.mjs). Nx
rebuilds them before a target that depends on them. To rebuild them by hand:

```bash
pnpm build:libs                     # every @ledgerhq package that has a build
pnpm nx run <package-name>:build    # one package that has a build
```

### Linting & typechecking

```bash
pnpm lint:fix                           # Lint entire monorepo + auto-fix
pnpm format                             # Format + auto-fix
pnpm typecheck                          # Typecheck entire monorepo
pnpm nx run <package-name>:typecheck    # Typecheck a specific lib
```

### Testing

Test libs:

```bash
pnpm nx run <package-name>:test
pnpm nx run <package-name>:test --watch
```

Run all tests for a coin/bridge family:

```bash
pnpm test:family evm        # Runs @ledgerhq/coin-evm, @ledgerhq/coin-tester-evm,
                                # @ledgerhq/live-signer-evm, @ledgerhq/evm-tools,
                                # and generic-coin-framework tests inside @ledgerhq/live-common
pnpm test:family bitcoin    # All bitcoin-related packages
pnpm test:family solana     # All solana-related packages
```

## CI checks

Before pushing a change under `shared/`, `domain/`, `features/`, `support/` or `devtools/`, run the checks of CI's required module-boundaries job:

```bash
pnpm lint:arch    # lint:boundaries, lint:structure, lint:tool-config, lint:i18n-keys; stops at the first failure
```

You can read YAML in [.github/workflows](../.github/workflows/) to find exactly what runs in CI. This might be useful for validating complex changes.

## Nx, filtering and aliases

### Aliases vs filtering

Common package aliases give shorter commands. For example, `pnpm desktop test` is equivalent to `pnpm --filter ledger-live-desktop test`.

Prefer the raw `--filter` form when:

- the package has no alias
- you are not in the root directory (aliases only work from root)
- you need advanced filtering (changed packages, dependency graphs, exclusions, globs), e.g.:

```bash
pnpm run test --filter="!./apps/*" --filter="...[HEAD~1]"
```

### Prefer Nx

Prefer `nx` over a raw `--filter` because:

- configs like `dependsOn` (being rolled out across the monorepo) keep dependencies up to date
- flags like `affected`, `base` and `include` enable advanced filtering

In the following example dependencies that have a build will be built and tests run on affected files.

```bash
pnpm nx affected -t test --base=HEAD~1 --head=HEAD --exclude=tag:scope:apps
```

#### ✅ Good

Nx builds the dependencies of a project that have a build before running the target:

```bash
pnpm nx test @domain/entity-client-identity
```

#### ❌ Bad

⚠️ Skipping `nx` risks reading a stale build of a dependency:

```bash
pnpm --filter @domain/entity-client-identity test
```

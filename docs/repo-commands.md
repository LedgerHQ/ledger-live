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

If a specific dependency isn't rebuilding automatically\*, you can try this:

```bash
pnpm nx run <package-name>:build
```

_\*If you're running commands through Nx dependencies should be rebuilt automatically._

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

In the following example dependencies will be built and tests run on affected files.

```bash
pnpm nx affected -t test --base=HEAD~1 --head=HEAD --exclude=tag:scope:apps
```

#### ✅ Good

Nx builds a project's dependencies before running the target, so
`@ledgerhq/client-ids` is built before its `test` target runs:

```bash
pnpm nx test @ledgerhq/client-ids
```

#### ❌ Bad

⚠️ Skipping `nx` risks dependencies being out of date:

```bash
pnpm --filter @ledgerhq/client-ids test
```

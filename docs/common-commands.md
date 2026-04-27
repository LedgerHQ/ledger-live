# Common commands

All commands must be run from the **repo root** unless stated otherwise.

## Setup

```bash
proto use               # Install correct Node/pnpm versions
pnpm i --ignore-scripts # Install all dependencies
```

## Development

```bash
pnpm dev:lld                  # Start Ledger Live Desktop
pnpm dev:llm:ios              # Start mobile on iOS
pnpm dev:llm:android          # Start mobile on Android
```

## Building

```bash
pnpm build:lld                # Build desktop (builds deps first via turbo)
pnpm build:llm:deps           # Build all mobile dependencies
pnpm build:libs               # Build all libs
pnpm build:llc                # Build ledger-live-common only
pnpm turbo build --filter=@ledgerhq/<lib-name>  # Build a specific lib
```

## Linting & Typechecking

```bash
pnpm lint                     # Lint entire monorepo
pnpm lint:fix                 # Lint + auto-fix
pnpm typecheck                # Typecheck entire monorepo
pnpm desktop typecheck        # Typecheck desktop only
pnpm mobile typecheck         # Typecheck mobile only
pnpm --filter <package-name> typecheck  # Typecheck a specific lib
```

## Testing

```bash
# Desktop (run from repo root)
pnpm desktop test:jest                  # Run all desktop Jest tests
pnpm desktop test:jest "filename"       # Run a specific test file

# Mobile (run from repo root)
pnpm mobile test:jest                   # Run all mobile Jest tests
pnpm mobile test:jest "filename"        # Run a specific test file

# Watch mode (preferred for agentic tasks)
pnpm desktop test:jest:watch
pnpm mobile test:jest:watch

# Library
pnpm --filter <package-name> test
pnpm --filter <package-name> test --watch

# Family (run all tests for a coin/bridge family)
pnpm test:family evm       # Runs @ledgerhq/coin-evm, @ledgerhq/coin-tester-evm,
                            # @ledgerhq/live-signer-evm, @ledgerhq/evm-tools,
                            # and generic-alpaca tests inside @ledgerhq/live-common
pnpm test:family bitcoin   # All bitcoin-related packages
pnpm test:family solana    # All solana-related packages
```

## Filtering / Scoping

```bash
pnpm lint --filter=[origin/develop]           # Lint only changed packages
pnpm run test --filter="!./apps/*" --filter="...[HEAD~1]"  # Test changed libs
pnpm typecheck --filter="live-mobile"         # Typecheck one package
```

## Package Aliases

Commonly used package aliases (run from repo root):

| Alias          | Package               |
| -------------- | --------------------- |
| `pnpm desktop` | `ledger-live-desktop` |
| `pnpm mobile`  | `live-mobile`         |
| `pnpm common`  | `live-common`         |
| `pnpm domain`  | `domain-service`      |

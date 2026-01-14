# Development Guide

## Project: @ledgerhq/coin-evm

**Generated:** 2026-01-14  
**Version:** 2.37.1

## Prerequisites

- **Node.js:** ≥16.x (ES2020 target)
- **Package Manager:** pnpm (workspace protocol)
- **TypeScript:** Configured via `tsconfig.json`
- **Part of:** Ledger Live monorepo (`ledger-live`)

## Installation

This library is part of the Ledger Live monorepo. To set up the development environment:

```bash
# Clone the monorepo
git clone https://github.com/LedgerHQ/ledger-live.git
cd ledger-live

# Install dependencies (from monorepo root)
pnpm install

# Navigate to this package
cd libs/coin-modules/coin-evm
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm build` | Build both CommonJS and ESM outputs |
| `pnpm clean` | Remove build outputs (`lib/`, `lib-es/`) |
| `pnpm test` | Run unit tests with Jest |
| `pnpm test-integ` | Run integration tests |
| `pnpm test:debug` | Debug tests with Node.js inspector |
| `pnpm coverage` | Run tests with coverage report |
| `pnpm lint` | Run ESLint on source files |
| `pnpm lint:fix` | Auto-fix linting issues |
| `pnpm typecheck` | Type check without emitting |
| `pnpm watch` | Watch mode for CommonJS build |
| `pnpm watch:es` | Watch mode for ESM build |
| `pnpm doc` | Generate API documentation |
| `pnpm unimported` | Check for unused dependencies |

## Build Process

The library produces dual build outputs:

```bash
# Full build (CommonJS + ESM)
pnpm build

# Outputs:
# - lib/       → CommonJS (require())
# - lib-es/    → ESM (import)
```

### Build Configuration

- **CommonJS:** Standard TypeScript compilation to `lib/`
- **ESM:** Compiled with `--moduleResolution bundler` to `lib-es/`
- **Declarations:** `.d.ts` files generated with source maps

## Testing

### Unit Tests

```bash
# Run all unit tests
pnpm test

# Run with coverage
pnpm coverage

# Run specific test file
pnpm test -- path/to/test.ts

# Watch mode
pnpm test -- --watch
```

### Integration Tests

```bash
# Run integration tests
pnpm test-integ
```

### Test Structure

- **Unit tests:** `src/__tests__/unit/` and co-located `*.test.ts` files
- **Fixtures:** `src/__tests__/fixtures/`
- **Mocking:** Uses MSW (Mock Service Worker) for network mocking
- **Property testing:** Uses fast-check for property-based tests

### Test Configuration

- **Framework:** Jest with SWC transformer
- **Environment:** Node.js
- **Coverage:** JSON, LCOV, and text formats
- **Reporters:** Default + jest-sonar for CI integration

## Code Quality

### Linting

```bash
# Check for issues
pnpm lint

# Auto-fix issues
pnpm lint:fix
```

### Type Checking

```bash
# Strict type checking
pnpm typecheck
```

### Unused Dependencies

```bash
# Check for unused imports/dependencies
pnpm unimported
```

## Development Workflow

### Adding New Features

1. Create feature files in appropriate `src/` subdirectory
2. Export from relevant `index.ts`
3. Add unit tests in `src/__tests__/unit/` or co-located
4. Run `pnpm typecheck` and `pnpm test`
5. Update documentation if needed

### Modifying Existing Logic

1. Review existing documentation in `docs/`
2. Make changes to source files
3. Update/add tests to cover changes
4. Run full test suite: `pnpm test`
5. Check for lint issues: `pnpm lint`

### Working with Dependencies

This package uses workspace dependencies from the monorepo:

```json
{
  "@ledgerhq/coin-framework": "workspace:^",
  "@ledgerhq/cryptoassets": "workspace:^",
  "@ledgerhq/devices": "workspace:*",
  "@ledgerhq/domain-service": "workspace:^",
  "@ledgerhq/errors": "workspace:^",
  "@ledgerhq/evm-tools": "workspace:^"
}
```

Changes to workspace dependencies require rebuilding from the monorepo root.

## Environment Variables

No `.env` files are required for basic development. Integration tests may require environment configuration via `dotenv/config` (loaded automatically by Jest).

## CI/CD Integration

This library is part of the Ledger Live CI/CD pipeline:

- **Test Reports:** SonarQube integration via `jest-sonar` reporter
- **Coverage:** LCOV format for CI coverage tracking
- **Monorepo Builds:** Managed by Turborepo (`.turbo/`)

## Debugging

### Debug Tests

```bash
# Start debugger and wait for attachment
pnpm test:debug
```

Then attach your debugger (VS Code, Chrome DevTools) to the Node.js process.

### Debug in VS Code

The `.vscode/` directory may contain launch configurations for debugging.

## Related Documentation

See the `docs/` folder for detailed documentation on:
- Individual API functions (`broadcast.md`, `synchronization.md`, etc.)
- EVM integration process (`evm-family-integration-process/README.md`)
- API layer details (`api/` subdirectory)

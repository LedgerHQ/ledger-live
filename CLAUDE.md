# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

`ledger-live` is a pnpm + turborepo monorepo containing:

- `apps/ledger-live-desktop` — Electron desktop wallet (React, TypeScript)
- `apps/ledger-live-mobile` — React Native mobile wallet (iOS/Android)
- `libs/` — Shared libraries (`ledger-live-common`, `ledgerjs`, `coin-modules`, UI, etc.)
- `tools/` — Internal tooling (GitHub actions, scripts)

All commands must be run from the **repo root** unless stated otherwise.

## Setup

```bash
proto use          # Install correct Node/pnpm versions
pnpm i             # Install all dependencies
```

## Common Commands

### Development

```bash
pnpm dev:lld                  # Start Ledger Live Desktop
pnpm dev:llm:ios              # Start mobile on iOS
pnpm dev:llm:android          # Start mobile on Android
```

### Building

```bash
pnpm build:lld                # Build desktop (builds deps first via turbo)
pnpm build:llm:deps           # Build all mobile dependencies
pnpm build:libs               # Build all libs
pnpm build:llc                # Build ledger-live-common only
pnpm turbo build --filter=@ledgerhq/<lib-name>  # Build a specific lib
```

### Linting & Typechecking

```bash
pnpm lint                     # Lint entire monorepo
pnpm lint:fix                 # Lint + auto-fix
pnpm typecheck                # Typecheck entire monorepo
pnpm desktop typecheck        # Typecheck desktop only
pnpm mobile typecheck         # Typecheck mobile only
pnpm --filter <package-name> typecheck  # Typecheck a specific lib
```

### Testing

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
```

### Changesets

Every PR that changes user-facing behavior or library APIs **must** include a changeset:

```bash
pnpm changeset    # or: pnpm changelog
```

### Filtering / Scoping

```bash
pnpm lint --filter=[origin/develop]           # Lint only changed packages
pnpm run test --filter="!./apps/*" --filter="...[HEAD~1]"  # Test changed libs
pnpm typecheck --filter="live-mobile"         # Typecheck one package
```

### Package Aliases

Commonly used package aliases (run from repo root):

| Alias | Package |
|---|---|
| `pnpm desktop` | `ledger-live-desktop` |
| `pnpm mobile` | `live-mobile` |
| `pnpm common` | `live-common` |
| `pnpm coin` | `coin-framework` |
| `pnpm domain` | `domain-service` |

## Validation Before Finishing

Before finishing any agentic code change, run for the affected scope:

1. `pnpm [app/filter] typecheck`
2. `pnpm [app/filter] test:jest` (or `test --watch` for libs)

If typecheck fails with an import error from a local lib, rebuild that lib:

```bash
pnpm turbo build --filter=@ledgerhq/<lib-name>
```

## Architecture

### MVVM Pattern

Both apps are migrating to MVVM. New code must use the MVVM pattern under `src/mvvm/`:

```
src/mvvm/
├── features/
│   └── FeatureName/
│       ├── __integrations__/   # Integration tests (required for every feature)
│       ├── components/         # Reusable UI within the feature
│       ├── screens/            # Screen folders with private building blocks
│       ├── hooks/              # Feature-specific hooks
│       └── utils/              # Feature-scoped utilities
├── components/                 # Global shared UI
├── hooks/
└── utils/
```

**Component pattern:** `Container → ViewModel → View`

- The ViewModel (`use<ComponentName>ViewModel.ts`) produces data and handlers.
- The View receives everything via props and never directly calls hooks connecting to external systems.

Every new feature folder under `src/mvvm/` **must include a minimal integration test** in `__integrations__/`.

### Coin Families Contract

**Never** add `if (family === "evm")` or similar coin-specific branches in shared/generic UI. Coin-specific behavior belongs in `families/<family>/` and is exposed through typed contract slots:

- **Desktop:** Optional slots on `LLDCoinFamily` in `apps/ledger-live-desktop/src/renderer/families/types.ts`; accessed via `getLLDCoinFamily(currency.family).SlotName`.
- **Mobile:** Typed generated maps (e.g. `getCustomNoAssociatedAccounts(currency)`); generic code looks up by contract, never branches on name.

When a flow needs new coin-specific behavior: **extend the contract** (add an optional slot), implement it in `families/<family>/`, and have generic code read from the contract.

### State Management

- **Redux Toolkit slices** for application state (`reducers/` per app).
- **RTK Query** for data fetching (`state-manager/api.ts` files); one API slice per base URL.
- **Global dialogs:** Use the centralized `dialogs.ts` slice (Desktop: `renderer/reducers/dialogs.ts`) — never create a dedicated slice per dialog. Local dialogs use `useState`.

### Privacy — `@ledgerhq/client-ids`

Sensitive identifiers (DeviceId, UserId, DatadogId) **must** use the `@ledgerhq/client-ids` library:

- Never use raw strings for device/user/analytics IDs.
- Use `DeviceId`, `UserId`, `DatadogId` from `@ledgerhq/client-ids/ids`.
- `toString()` / `toJSON()` return `[DeviceId:REDACTED]` by design.
- Every ID export must be allowlisted in `libs/client-ids/export-rules.json`.
- Export IDs only at system boundaries (API calls, persistence).

### Translations

Only edit the **English** locale files:

- Desktop: `apps/ledger-live-desktop/static/i18n/en/app.json`
- Mobile: `apps/ledger-live-mobile/src/locales/en/common.json`

## Testing Conventions

- **Stack:** Jest + React Testing Library (Desktop) / React Native Testing Library (Mobile) + MSW
- **Network mocking:** Use MSW with handlers (see `apps/ledger-live-mobile/__tests__/server.ts` or `apps/ledger-live-desktop/tests/server.ts`)
- **Custom renderers:** Desktop uses `tests/testSetup`; Mobile uses `@tests/test-renderer`
- **Test data:** Fixtures in `__fixtures__/`, use factories; avoid hardcoded values
- **Query priority:** `ByRole > ByLabelText > ByText > ByTestId`
- **Avoid** duplicating mocks already in jest-setup; check `apps/ledger-live-mobile/__tests__/jest-setup.js` or `apps/ledger-live-desktop/tests/jestSetup.js` first
- **Avoid** `jest.restoreAllMocks()` — use `jest.clearAllMocks()` instead

## Code Conventions

- **TypeScript:** Prefer named exports, avoid default exports. Types in `types.ts`. Use Zod for runtime validation. Avoid `any`; use `unknown`.
- **React:** Function components with typed props. Prefer interfaces/type aliases (PascalCase). Extract logic into custom hooks.
- **Import order:** external libs → internal modules → types
- **Async:** `async/await` with `try/catch`; no inline Promises in JSX.

## Git Conventions

Branch prefix: `feat/`, `bugfix/`, `support/`, `chore/`

Commit format (Conventional Commits):

```
<type>[(scope)]: <description>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`

Examples:
```
feat(desktop): add dark mode toggle
fix(mobile): resolve transaction signing issue
```

## Cross-Team Files

When touching files owned by multiple teams, split using the **team-split convention**:
- `[foo]/index.ts` re-exports from `[foo]/team-<team>/*.ts` files
- See `.cursor/rules/team-split-convention.mdc` for full details

## Domain & Shared Packages

- Before modifying `domain/entity/` or `domain/api/` packages, read the relevant README in that folder.
- Before modifying `shared/` packages, read `shared/README.md`.

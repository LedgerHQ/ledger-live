# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

`ledger-live` is a **pnpm monorepo** using **turborepo** for task orchestration. It contains all JavaScript/TypeScript code for the Ledger Live ecosystem: desktop app, mobile app, CLI, and shared libraries.

All commands must be run from the **root of the monorepo**.

## Setup

```bash
# Install toolchain (Node, pnpm) via proto
proto use

# Install all dependencies
pnpm i
```

## Key Commands

### Development

```bash
pnpm dev:lld              # Ledger Live Desktop (Electron, watch mode)
pnpm dev:llm              # Ledger Live Mobile (React Native metro)
pnpm dev:llm:ios          # Mobile — iOS
pnpm dev:llm:android      # Mobile — Android
pnpm dev:cli              # CLI (watch mode)
```

### Build

```bash
pnpm build:libs           # Build all libraries (required before running apps)
pnpm build:lld            # Build desktop app (builds deps first via turbo)
pnpm build:llm:deps       # Build mobile dependencies
pnpm build:coin           # Build all coin modules
```

### Test

```bash
pnpm test                             # Run all tests (via turbo, sequential)

# Scoped tests (run from root):
pnpm common test                      # live-common unit tests
pnpm desktop test:jest                # Desktop Jest tests only
pnpm desktop test:playwright          # Desktop Playwright e2e tests
pnpm mobile test                      # Mobile Jest + env tests

# Run tests for a specific package:
pnpm --filter live-common jest -- --testPathPattern=<pattern>
pnpm --filter coin-evm test
```

### Lint & Typecheck

```bash
pnpm lint                 # Lint all packages
pnpm lint:fix             # Lint and auto-fix
pnpm typecheck            # Type-check all packages
```

### Scoped operations (powerful pattern)

```bash
# Run any script scoped to a package alias or filter:
pnpm desktop <script>     # → ledger-live-desktop
pnpm mobile <script>      # → live-mobile
pnpm common <script>      # → live-common
pnpm coin:evm <script>    # → coin-evm

# Or with explicit filter:
pnpm --filter live-common <script>
pnpm lint --filter=[origin/develop]   # Only changed packages
```

### Changelog

```bash
pnpm changeset            # Add a changeset entry (required for PRs)
```

## Monorepo Structure

```
apps/
  ledger-live-desktop/    # Electron desktop app
  ledger-live-mobile/     # React Native mobile app (iOS + Android)
  cli/                    # CLI tool (wraps live-common)
  web-tools/              # Internal web tooling

libs/
  ledger-live-common/     # Core business logic shared by desktop + mobile
  ledgerjs/               # Low-level device communication packages
    packages/
      hw-transport-*/     # Transport implementations (USB HID, WebHID, BLE, etc.)
      hw-app-*/           # Per-coin hardware wallet app protocols
      types-*/            # Shared type definitions
      cryptoassets/       # Crypto asset registry
  coin-modules/           # Per-blockchain coin implementations
    coin-bitcoin/
    coin-evm/             # Ethereum and EVM-compatible chains
    coin-solana/
    coin-cosmos/
    ... (one package per supported blockchain)
  coin-framework/         # Abstract interfaces/base for coin modules
  ui/
    packages/
      react/              # @ledgerhq/react-ui — desktop UI components
      native/             # @ledgerhq/native-ui — mobile UI components
      icons/              # @ledgerhq/icons-ui
  live-wallet/            # Wallet state management
  live-network/           # HTTP networking layer
  live-config/            # Remote feature configuration
  live-countervalues/     # Fiat exchange rates
  device-core/            # Device management core
  device-react/           # React hooks for device interactions
  live-dmk-*/             # Device Management Kit integrations

tools/                    # Internal GitHub Actions, scripts, etc.
```

## Architecture

### Layered dependency model

```
apps (desktop/mobile/cli)
    └── ledger-live-common     ← orchestrates everything
            ├── coin-modules/* ← per-blockchain logic
            ├── ledgerjs/*     ← hardware transport & app protocols
            └── live-*/        ← domain services (network, wallet, config...)
```

### Desktop app (Electron + rspack)

- `src/main/` — Electron **main process** (Node.js): window lifecycle, USB transport, IPC
- `src/renderer/` — React **renderer process**: all UI, Redux state, React Router screens
- `src/renderer/reducers/` — Redux reducers
- `src/renderer/screens/` — Page-level React components
- `src/renderer/components/` — Shared UI components
- `src/renderer/hooks/` — Custom React hooks
- Communication between main and renderer via Electron IPC

### Mobile app (React Native)

- Uses `@callstack/repack` (rspack-based) bundler
- Tests: Jest (unit) + Detox (e2e)
- i18n: `src/locales/en/common.json` (English only — Smartling handles translations)

### Coin modules pattern

Each `libs/coin-modules/coin-<name>/` implements the `CoinModule` interface from `coin-framework`, providing:
- `CurrencyBridge` — scan accounts from device
- `AccountBridge` — sync account, prepare/sign transactions
- Hardware wallet integration via the corresponding `hw-app-<name>` package

## Git Conventions

**Branch prefixes**: `feat/`, `bugfix/`, `support/`

**Commit messages**: Conventional Commits format (enforced by commitlint).
Use `pnpm commit` for an interactive prompt.

**Rebase strategy**: Always prefer rebase over merge unless the branch contains merge commits.

**Every PR requires a changeset**: run `pnpm changeset` before opening a PR.

## Translations (i18n)

Only edit English translation files. Other languages are managed by Smartling:
- Desktop: `apps/ledger-live-desktop/static/i18n/en/app.json`
- Mobile: `apps/ledger-live-mobile/src/locales/en/common.json`

## Coding Standards

### TypeScript & React

- Use function components with typed props (interfaces/type aliases, PascalCase).
- Avoid `any`; use `unknown` when type is truly unknown.
- Prefer named imports and named exports — avoid default exports.
- Import order: (1) external libs, (2) internal modules, (3) types.
- Use `async/await` with `try/catch` — avoid inline Promises in JSX.
- Use `as const` for literals; discriminated unions for state machines.
- Prefer `Result<T, E>` patterns for recoverable failures.
- Memoize with `React.memo`, `useMemo`, `useCallback` where beneficial.
- Extract logic into custom hooks with explicitly typed return values.

### MVVM Architecture (new code in `src/mvvm/`)

New features **must** use the MVVM pattern in `src/mvvm/`. See `.claude/agents/code-architect.md`.

```
src/mvvm/features/FeatureName/
  __integrations__/          # mandatory integration tests
  components/                # reusable UI across screens
  screens/ScreenName/
    index.tsx                # View — receives props only, no external hooks
    useScreenNameViewModel.ts # ViewModel — all Redux/RTK/navigation calls
    types.ts
  hooks/
  utils/
```

**Key rule:** `index.tsx` (View) must NOT import `useSelector`, `useDispatch`, `useNavigation`, or any RTK Query hook. All external hooks go in the ViewModel.

New UI in `src/mvvm/` uses **Lumen design system**:
- Desktop: `@ledgerhq/lumen-ui-react`
- Mobile: `@ledgerhq/lumen-ui-rnative`

### Coin Families Contract

Never branch on `family === "evm"` (or any coin name) in generic/shared code. Instead:
1. Add an optional slot to `LLDCoinFamily` in `apps/ledger-live-desktop/src/renderer/families/types.ts`
2. Implement in `families/<family>/`
3. Access via `getLLDCoinFamily(currency.family).SlotName` — no name checks

### Privacy & Security — Client IDs

Sensitive IDs (DeviceId, UserId, DatadogId) **must** use `@ledgerhq/client-ids`:
- Never use raw strings for devices, users, or analytics
- `toString()` / `toJSON()` return `[DeviceId:REDACTED]` by design
- Export IDs only at system boundaries via explicit export methods
- Every export method must be allowlisted in `libs/client-ids/export-rules.json`

### Redux Toolkit

- `createSlice`: descriptive `name`, typed `initialState` with `satisfies`, colocate selectors
- `createApi` (RTK Query): one API slice per data source, define in `state-manager/api.ts`
- Tags as enums in `state-manager/types.ts`; `providesTags`/`invalidatesTags` for cache
- Use **Zod** for runtime validation: define schemas first, infer types with `z.infer<>`

## Testing Standards

- **Stack**: Jest + MSW (network) + React Testing Library (desktop) / RNTL (mobile)
- Tests live next to source: `MyComponent.test.tsx`; grouped in `__tests__/`; integration in `__integrations__/`
- Every new MVVM feature **must** have an integration test in `__integrations__/`
- Test behavior, not implementation — assert user-visible outcomes
- Query priority: `ByRole` > `ByLabelText` > `ByText` > `ByTestId`
- Use `toBeVisible()` over `toBeInTheDocument()`
- Use MSW for network mocking — never mock React components or hooks directly
- **Jest mock rules** (avoid flaky tests):
  - Check jest-setup before adding `jest.mock()` — don't duplicate global mocks
  - Never call `renderHook` at describe load time — use `beforeEach` instead
  - Never use `jest.restoreAllMocks()` — use `jest.clearAllMocks()` instead
  - Call `clearAllMocks()` BEFORE configuring mock return values in `beforeEach`

| Platform | Render import | MSW server | Run command |
|----------|--------------|-----------|-------------|
| Desktop | `tests/testSetup` | `tests/server.ts` | `pnpm desktop test:jest "file"` |
| Mobile | `@tests/test-renderer` | `__tests__/server.ts` | `pnpm mobile test:jest "file"` |

## Validation Before Finishing

Before finishing any agentic task that makes code changes:
1. Run **typecheck** scoped to the changed package
2. Run **unit tests** scoped to the changed package
3. Fix all failures before considering the task complete

If typecheck fails with an import error from a monorepo lib, rebuild it:
```bash
pnpm turbo build --filter=@ledgerhq/<lib-name>
```

## Agents & Commands

Specialized agents and commands are defined in `.claude/agents/` and `.claude/commands/`.
Key agents: `code-architect`, `code-reviewer`, `code-explorer`, `test-runner`, `ci-watcher`
Key commands: `pre-review`, `create-pr`, `feature-dev`, `cleanup`, `test-coverage`

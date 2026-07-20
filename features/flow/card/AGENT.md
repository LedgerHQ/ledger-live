# AGENT — @features/flow-card

Cross-platform **Card** feature for Ledger Wallet (Desktop + Mobile), part of the DDD `features/flow/` layer. See [README.md](./README.md).

## What this package is

- A **micro frontend**: built to be loaded remotely by the host apps via **Module Federation**.
- Ships **UI + feature logic only**. App-specific screen composition stays in `apps/`.

## Navigation

- This micro frontend does **not** own navigation.
- All navigation actions are **passed up to the Shell app**, which owns a **global Redux store**.
- The global store is **not integrated yet** — wire navigation as intents/callbacks and stub them until the Shell store is available. Do not add a router here.

## Platform convention (`.web` / `.native`)

Bundlers auto-resolve per platform — always respect the suffixes:

- `*.web.tsx` → Desktop (Rspack)
- `*.native.tsx` → Mobile (Metro)

## Architecture (MVVM)

`index.tsx` / `index.native.tsx` (container) → `use<Name>ViewModel.ts` (data + handlers) → `<Name>View.web.tsx` / `<Name>View.native.tsx` (presentational, props only).

- The View is pure: everything comes via props, no direct calls to external systems.
- The ViewModel is shared cross-platform when possible.
- `src/components/` is the **shared components** folder (reused across screens).

## Data

- API calls use **RTK Query** (endpoints from `@domain/api-*`), consumed via hooks inside ViewModels — never inside Views.
- Canonical Pay Card entities live in `@domain/entity-pay-card`; feature code should use camelCase entity shapes.
- The Pay Card API lives in `@domain/api-pay-card` and owns RTK Query endpoints, wire contracts, transforms, cache tags, and mocks.
- Inject URLs, session access, and mock settings through `payCardApiExtra`; do not import app environment or configuration modules in the domain API.
- Keep feature code importing from `@domain/api-pay-card`; do not redefine or re-export the API from `@features/flow-card`.
- When adding Pay Card API endpoints, keep them in one `createApi` slice, add authenticated endpoint names to `AUTHENTICATED_ENDPOINTS`, and keep mock handlers aligned with endpoint methods, paths, and response contracts.
- Cover endpoint registration, injected configuration, mock responses, and authenticated headers in `domain/api/pay-card/src/api.test.ts`.

## UI & styling

- Always use **Lumen** components: `@ledgerhq/lumen-ui-react` (web), `@ledgerhq/lumen-ui-rnative` (native).
- Only use **Tailwind** utility classes (web `className`) when Lumen provides nothing for the case.

## Testing

- Write **meaningful tests only** — no filler tests added just for coverage.
- Dual Jest projects: `*.web.test.tsx` (jsdom) and `*.native.test.tsx` (node), in `__tests__/`.
- Lumen barrels are stubbed, so assert on **ViewModel wiring and layout**, not Lumen internals.

## Commands

```bash
pnpm test        # jest (web + native)
pnpm typecheck   # tsc --noEmit
pnpm lint        # oxlint + tailwind lint (web)
pnpm format      # oxfmt
```

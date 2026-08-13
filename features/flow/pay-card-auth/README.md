# Pay Card Auth

> [!CAUTION]
> **Status: UNSTABLE** — In active development; API may change.

Cross-platform Pay Card authentication flow for Ledger Wallet.

## Usage

```tsx
import { CardLogin } from "@features/flow-pay-card-auth";

<CardLogin />;
```

`CardLogin` opens the API-provided login URL itself. Desktop uses a new browsing context.
Mobile uses `expo-web-browser` (`ASWebAuthenticationSession` on iOS, Chrome Custom Tabs on Android).

The native opener forwards the opaque login URL unchanged. Callback exchange, OAuth state handling,
and session persistence are outside this package's current scope.

The apps configure the OAuth client and redirect URI once through `cardApiExtra`. The authorization
initiation returns that resolved redirect URI with the hosted URL so the native opener can end the
secure browser session without `CardLogin` receiving app configuration.

App composition and DevTools consume shared Pay Card entity state through
`@domain/entity-pay-card`. Auth-only runtime state (`hasCard`) lives in this flow's
`payCardAuth` slice, exposed through `@features/flow-pay-card-auth/state`. Other Pay Card UI state is
owned by the flow it belongs to: the balance filter by `@features/flow-pay-card-balance` and the
feature-tour flag by `@features/flow-pay-card-feature-tour`.

## Card API

This flow owns no API code. The Card endpoints, their wire schemas and the generated hooks live in
[`@domain/api-card-management`](../../../domain/api/card-management/README.md), which injects them
into the shared `cardApi` service. `useCardLoginViewModel` imports
`useInitiateAuthorizeMutation` from there directly — that import is what triggers the injection.

## Platform resolution

Platform files live side by side (`.web` / `.native`). Imports omit the suffix; TypeScript
`moduleSuffixes` and the bundlers resolve the right file:

```ts
import { CardLoginView } from "./CardLoginView";
// → CardLoginView.web.tsx (desktop) or CardLoginView.native.tsx (mobile)
```

| Tooling | How it resolves |
| ------- | --------------- |
| TypeScript (IDE) | Solution-style `tsconfig.json` → `tsconfig.web.json` / `tsconfig.native.json` |
| Desktop (Rspack) | `.web` / unsuffixed |
| Mobile (Metro) | `.native` / unsuffixed |
| Jest | Tests import `.web` / `.native` files explicitly |

| Platform         | File resolved                        |
| ---------------- | ------------------------------------ |
| Mobile (Metro)   | `CardLogin/index.native.tsx`         |
| Desktop (Rspack) | `CardLogin/index.web.tsx`            |

## Structure

This package follows the [Structure & Flow ADR](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/6111232117/Guideline+Monorepo+DDD+Re-architecture+Structure+Flow). Add optional directories only when the flow needs them; do not keep empty scaffolding.

```text
pay-card-auth/
├── package.json                            # Package metadata and public exports
└── src/
    ├── components/                         # Components shared by several screens
    │   └── CardLogin/
    │       ├── __tests__/
    │       │   ├── CardLoginView.native.test.tsx
    │       │   └── CardLoginView.web.test.tsx
    │       ├── CardLoginView.native.tsx     # Native presentational UI
    │       ├── CardLoginView.web.tsx        # Web presentational UI
    │       ├── index.native.tsx             # Native component container
    │       ├── index.web.tsx                # Web component container
    │       ├── openHostedLogin.native.ts    # Native secure-browser opener
    │       ├── openHostedLogin.web.ts       # Desktop browsing-context opener
    │       ├── types.ts                     # Component contracts
    │       └── useCardLoginViewModel.ts     # Shared state and orchestration
    ├── hooks/                              # Flow-local hooks
    ├── router/                             # Flow-local routing
    ├── state/
    │   ├── __tests__/
    │   │   └── slice.native.test.ts        # Auth slice and selector tests
    │   ├── selectors.ts                    # Auth selectors
    │   ├── slice.ts                        # Auth-only runtime state (`hasCard`)
    │   ├── store.ts                        # Public state subpath
    │   └── types.ts                        # Auth Redux state type
    ├── utils/                              # Flow-local helpers
    ├── index.native.ts                     # Native public API
    └── index.ts                            # Default/web public API
```

`hooks/`, `router/`, `screens/`, `state/`, and `utils/` are extension points. Add them only when the flow needs them.

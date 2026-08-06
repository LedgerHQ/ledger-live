# Pay Card Auth

> [!CAUTION]
> **Status: UNSTABLE** — In active development; API may change.

Cross-platform Pay Card authentication flow for Ledger Wallet.

## Usage

```tsx
import { CardLogin } from "@features/flow-pay-card-auth";

<CardLogin openHostedLogin={openHostedLogin} />;
```

The host app provides `openHostedLogin` so platform-specific navigation remains at the app
composition root.

## Card API

The flow owns its Card API wire contract and endpoint in `src/state/`. The endpoint is injected into
the endpoint-less `payCardApi` service from
[`@shared/api-services`](../../../shared/api-services/README.md):

| Endpoint | Method | Purpose |
| -------- | ------ | ------- |
| `/card/v1/pre-auth` | POST | Exchange a provider for the hosted login URL |

Reaching the backend — including the base URL (`PAY_CARD_API_BASE_URL`; staging is VPN-only) —
belongs to the shared service. Both apps register `payCardApi`; importing this flow injects the
endpoint into that same API instance. Responses are validated against
`PayCardPreAuthResponseSchema` before they reach the view model.

The OAuth code exchange (`/card/v1/auth`) and card status read (`/card/v1/me`) are intentionally
deferred until the callback and status steps can also provide session-token handling.

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
    │       ├── types.ts                     # Component contracts
    │       └── useCardLoginViewModel.ts     # Shared state and orchestration
    ├── hooks/                              # Flow-local hooks
    ├── router/                             # Flow-local routing
    ├── state/
    │   ├── __tests__/
    │   │   ├── api.native.test.ts          # Endpoint contract tests (Node environment)
    │   │   └── schema.native.test.ts       # Wire contract tests (Node environment)
    │   ├── api.ts                          # Card API endpoint, injected into payCardApi
    │   ├── index.ts                        # Flow-local state surface
    │   ├── schema.ts                       # Card API wire contracts
    │   └── types.ts                        # Types inferred from those contracts
    ├── utils/                              # Flow-local helpers
    ├── index.native.ts                     # Native public API
    └── index.ts                            # Default/web public API
```

`hooks/`, `router/`, `screens/`, `state/`, and `utils/` are extension points. Add them only when the flow needs them.
